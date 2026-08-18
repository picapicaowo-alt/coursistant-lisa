import {useEffect, useState} from 'react';
import {useMutation, useQuery, useQueryClient} from '@tanstack/react-query';
import {ArrowLeft, CheckCircle2, RotateCcw, Send} from 'lucide-react';
import {Link, useParams} from 'react-router-dom';
import {unwrapData} from '@/apis';
import {quizApiService} from '@/apis/services/quiz-api';
import {useCourseAccess} from '@/hooks/useCourseAccess';
import styles from './index.module.scss';

interface GradeDraft {
  score: string;
  feedback: string;
}

const QuizGradingPage = () => {
  const {courseId: courseIdParam, quizId: quizIdParam} = useParams();
  const courseId = Number(courseIdParam);
  const quizId = Number(quizIdParam);
  const valid = Number.isInteger(courseId) && courseId > 0 && Number.isInteger(quizId) && quizId > 0;
  const access = useCourseAccess(valid ? courseId : null);
  const queryClient = useQueryClient();
  const [selectedQuestionId, setSelectedQuestionId] = useState<number | null>(null);
  const [drafts, setDrafts] = useState<Record<number, GradeDraft>>({});
  const [message, setMessage] = useState<string | null>(null);

  const quizQuery = useQuery({
    queryKey: ['quiz', courseId, quizId],
    queryFn: async () => unwrapData(await quizApiService.getQuiz(courseId, quizId), 'getQuiz'),
    enabled: valid,
  });
  const summaryQuery = useQuery({
    queryKey: ['quiz-grading-summary', courseId, quizId],
    queryFn: async () => unwrapData(await quizApiService.getGradingSummary(courseId, quizId), 'getGradingSummary'),
    enabled: valid && access.canGrade,
  });
  const questionsQuery = useQuery({
    queryKey: ['quiz-questions', courseId, quizId],
    queryFn: async () => unwrapData(await quizApiService.listQuestions(courseId, quizId), 'listQuestions'),
    enabled: valid && access.canGrade,
  });
  const shortQuestions = (questionsQuery.data ?? []).filter(question => question.type === 'ShortAnswer');

  useEffect(() => {
    if (selectedQuestionId === null && shortQuestions.length) setSelectedQuestionId(shortQuestions[0].id);
  }, [selectedQuestionId, shortQuestions.map(question => question.id).join(',')]);

  const answersQuery = useQuery({
    queryKey: ['quiz-short-answers', courseId, quizId, selectedQuestionId],
    queryFn: async () => unwrapData(
      await quizApiService.listShortAnswers(courseId, quizId, selectedQuestionId!),
      'listShortAnswers',
    ),
    enabled: access.canGrade && selectedQuestionId !== null,
  });

  useEffect(() => {
    if (!answersQuery.data) return;
    setDrafts(Object.fromEntries(answersQuery.data.map(answer => [answer.attemptId, {
      score: answer.score === null ? '' : String(answer.score),
      feedback: answer.feedback ?? '',
    }])));
  }, [answersQuery.data]);

  const gradeAnswer = useMutation({
    mutationFn: ({attemptId, questionId, draft}: {attemptId: number; questionId: number; draft: GradeDraft}) =>
      quizApiService.gradeAnswer(courseId, quizId, attemptId, questionId, {
        score: Number(draft.score),
        feedback: draft.feedback.trim() || undefined,
      }),
    onSuccess: async () => {
      setMessage('Grade saved.');
      await queryClient.invalidateQueries({queryKey: ['quiz-short-answers', courseId, quizId, selectedQuestionId]});
      await queryClient.invalidateQueries({queryKey: ['quiz-grading-summary', courseId, quizId]});
    },
    onError: () => setMessage('The grade could not be saved.'),
  });

  const updateRelease = useMutation({
    mutationFn: (action: 'release' | 'retract') => action === 'release'
      ? quizApiService.releaseGrades(courseId, quizId)
      : quizApiService.retractGrades(courseId, quizId),
    onSuccess: async (_, action) => {
      setMessage(action === 'release' ? 'Eligible grades released.' : 'Released grades retracted.');
      await queryClient.invalidateQueries({queryKey: ['quiz-grading-summary', courseId, quizId]});
    },
    onError: () => setMessage('The grade release state could not be changed.'),
  });

  if (access.isResolved && !access.canGrade) {
    return <main className={styles.page}><p className={styles.error} role="alert">You do not have grading permission for this course.</p></main>;
  }

  const selectedQuestion = shortQuestions.find(question => question.id === selectedQuestionId);

  return (
    <main className={styles.page}>
      <div className={styles.header}>
        <Link to={`/course/${courseId}/quizzes/${quizId}`} className={styles.backLink} aria-label="Back to quiz"><ArrowLeft size={22}/></Link>
        <div><p className={styles.eyebrow}>Quiz grading</p><h1>{quizQuery.data?.title || 'Loading quiz…'}</h1></div>
        <div className={styles.headerActions}>
          <button type="button" className={styles.secondaryButton} onClick={() => updateRelease.mutate('retract')} disabled={updateRelease.isPending}><RotateCcw size={16}/> Retract</button>
          <button type="button" className={styles.primaryButton} onClick={() => updateRelease.mutate('release')} disabled={updateRelease.isPending || Boolean(summaryQuery.data?.manualIncompleteAttemptCount)}><Send size={16}/> Release eligible grades</button>
        </div>
      </div>

      <section className={styles.summaryGrid}>
        <div><strong>{summaryQuery.data?.submittedAttemptCount ?? '—'}</strong><span>Submitted attempts</span></div>
        <div><strong>{summaryQuery.data?.pendingShortAnswerCount ?? '—'}</strong><span>Pending short answers</span></div>
        <div><strong>{summaryQuery.data?.manualIncompleteAttemptCount ?? '—'}</strong><span>Incomplete grading</span></div>
        <div><strong>{summaryQuery.data?.releasedUserCount ?? '—'}</strong><span>Released users</span></div>
      </section>

      {message ? <p className={message.includes('could not') ? styles.error : styles.success} role="status">{message}</p> : null}

      <section className={styles.card}>
        <div className={styles.cardHeader}>
          <div><h2>Short-answer grading</h2><p>Objective questions are auto-scored by the backend answer key.</p></div>
          {shortQuestions.length ? <label><span>Question</span><select value={selectedQuestionId ?? ''} onChange={event => setSelectedQuestionId(Number(event.target.value))}>{shortQuestions.map(question => <option key={question.id} value={question.id}>{question.position}. {question.stem}</option>)}</select></label> : null}
        </div>

        {!shortQuestions.length ? <p className={styles.empty}>This quiz has no short-answer questions.</p> : answersQuery.isError ? <p className={styles.error} role="alert">Short answers could not be loaded.</p> : (answersQuery.data ?? []).length === 0 ? <p className={styles.empty}>No submitted answers for this question yet.</p> : <div className={styles.answerList}>{answersQuery.data?.map(answer => {
          const draft = drafts[answer.attemptId] ?? {score: '', feedback: ''};
          return <article key={answer.attemptId} className={styles.answerCard}>
            <div className={styles.answerHeading}><div><strong>User {answer.userId}</strong><span>Attempt {answer.attemptId}</span></div>{answer.pendingManual ? <span className={styles.pending}>Needs grading</span> : <span className={styles.graded}><CheckCircle2 size={15}/> Graded</span>}</div>
            <blockquote>{answer.textAnswer || 'No text answer'}</blockquote>
            <div className={styles.gradeControls}>
              <label><span>Score / {selectedQuestion?.points ?? 0}</span><input type="number" min="0" max={selectedQuestion?.points ?? undefined} step="0.5" value={draft.score} onChange={event => setDrafts(previous => ({...previous, [answer.attemptId]: {...draft, score: event.target.value}}))}/></label>
              <label><span>Feedback</span><input value={draft.feedback} onChange={event => setDrafts(previous => ({...previous, [answer.attemptId]: {...draft, feedback: event.target.value}}))}/></label>
              <button type="button" className={styles.primaryButton} disabled={gradeAnswer.isPending || draft.score === '' || Number(draft.score) < 0 || Number(draft.score) > (selectedQuestion?.points ?? 0)} onClick={() => gradeAnswer.mutate({attemptId: answer.attemptId, questionId: answer.questionId, draft})}>Save grade</button>
            </div>
          </article>;
        })}</div>}
      </section>
    </main>
  );
};

export default QuizGradingPage;
