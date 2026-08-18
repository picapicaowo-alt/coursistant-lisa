import {useEffect, useState} from 'react';
import {useMutation, useQuery, useQueryClient} from '@tanstack/react-query';
import axios from 'axios';
import {ArrowLeft, CheckCircle2, Clock3, Pencil, ShieldCheck} from 'lucide-react';
import {Link, useParams} from 'react-router-dom';
import type {QuizAttempt, QuizQuestion} from '@/apis';
import {unwrapData} from '@/apis';
import {quizApiService} from '@/apis/services/quiz-api';
import {useCourseAccess} from '@/hooks/useCourseAccess';
import styles from './index.module.scss';

interface AnswerDraft {
  selectedOptionIds: number[];
  textAnswer: string;
}

const emptyAnswer = (): AnswerDraft => ({selectedOptionIds: [], textAnswer: ''});

const toDrafts = (attempt: QuizAttempt | null): Record<number, AnswerDraft> =>
  Object.fromEntries((attempt?.answers ?? []).map(answer => [answer.questionId, {
    selectedOptionIds: answer.selectedOptionIds ?? [],
    textAnswer: answer.textAnswer ?? '',
  }]));

const isNotFound = (error: unknown) =>
  (axios.isAxiosError(error) && error.response?.status === 404)
  || (typeof error === 'object' && error !== null && 'code' in error && error.code === 404);

const QuizPage = () => {
  const {courseId: courseIdParam, quizId: quizIdParam} = useParams();
  const courseId = Number(courseIdParam);
  const quizId = Number(quizIdParam);
  const valid = Number.isInteger(courseId) && courseId > 0 && Number.isInteger(quizId) && quizId > 0;
  const access = useCourseAccess(valid ? courseId : null);
  const isStaff = access.isResolved && (access.canConfigureAssignments || access.canGrade);
  const queryClient = useQueryClient();
  const [drafts, setDrafts] = useState<Record<number, AnswerDraft>>({});
  const [savedQuestions, setSavedQuestions] = useState<Set<number>>(new Set());
  const [confirmSubmit, setConfirmSubmit] = useState(false);

  const quizQuery = useQuery({
    queryKey: ['quiz', courseId, quizId],
    queryFn: async () => unwrapData(await quizApiService.getQuiz(courseId, quizId), 'getQuiz'),
    enabled: valid,
    retry: 1,
  });
  const questionsQuery = useQuery({
    queryKey: ['quiz-questions', courseId, quizId],
    queryFn: async () => unwrapData(await quizApiService.listQuestions(courseId, quizId), 'listQuestions'),
    enabled: valid,
    retry: 1,
  });
  const attemptQuery = useQuery({
    queryKey: ['quiz-current-attempt', courseId, quizId],
    queryFn: async () => {
      try {
        return unwrapData(await quizApiService.getCurrentAttempt(courseId, quizId), 'getCurrentAttempt');
      } catch (error) {
        if (isNotFound(error)) return null;
        throw error;
      }
    },
    enabled: valid && access.isResolved && !isStaff,
    retry: false,
  });
  const resultQuery = useQuery({
    queryKey: ['quiz-my-result', courseId, quizId],
    queryFn: async () => {
      try {
        return unwrapData(await quizApiService.getMyResult(courseId, quizId), 'getMyResult');
      } catch (error) {
        if (isNotFound(error)) return null;
        throw error;
      }
    },
    enabled: valid && access.isResolved && !isStaff && attemptQuery.data === null,
    retry: false,
  });

  useEffect(() => {
    if (attemptQuery.data) setDrafts(toDrafts(attemptQuery.data));
  }, [attemptQuery.data?.id]);

  const startAttempt = useMutation({
    mutationFn: () => quizApiService.startAttempt(courseId, quizId),
    onSuccess: response => {
      const attempt = unwrapData(response, 'startAttempt');
      queryClient.setQueryData(['quiz-current-attempt', courseId, quizId], attempt);
      setDrafts(toDrafts(attempt));
    },
  });

  const saveAnswer = useMutation({
    mutationFn: ({question, draft}: {question: QuizQuestion; draft: AnswerDraft}) =>
      quizApiService.autosaveAnswer(
        courseId,
        quizId,
        attemptQuery.data!.id,
        question.id,
        question.type === 'ShortAnswer'
          ? {textAnswer: draft.textAnswer}
          : {selectedOptionIds: draft.selectedOptionIds},
      ),
    onSuccess: (_, variables) => {
      setSavedQuestions(previous => new Set(previous).add(variables.question.id));
    },
  });

  const submitAttempt = useMutation({
    mutationFn: () => quizApiService.submitAttempt(courseId, quizId, attemptQuery.data!.id),
    onSuccess: async () => {
      setConfirmSubmit(false);
      queryClient.setQueryData(['quiz-current-attempt', courseId, quizId], null);
      await queryClient.invalidateQueries({queryKey: ['quiz-my-result', courseId, quizId]});
    },
  });

  const changeState = useMutation({
    mutationFn: () => quizQuery.data?.state === 'Published'
      ? quizApiService.unpublishQuiz(courseId, quizId)
      : quizApiService.publishQuiz(courseId, quizId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({queryKey: ['quiz', courseId, quizId]});
      await queryClient.invalidateQueries({queryKey: ['course-quizzes', courseId]});
    },
  });

  const updateDraft = (questionId: number, updater: (draft: AnswerDraft) => AnswerDraft) => {
    setSavedQuestions(previous => {
      const next = new Set(previous);
      next.delete(questionId);
      return next;
    });
    setDrafts(previous => ({
      ...previous,
      [questionId]: updater(previous[questionId] ?? emptyAnswer()),
    }));
  };

  if (!valid || quizQuery.isError || questionsQuery.isError) {
    return <main className={styles.page}><div className={styles.error} role="alert">This quiz could not be loaded.</div></main>;
  }

  const quiz = quizQuery.data;
  const questions = questionsQuery.data ?? [];
  const attempt = attemptQuery.data;
  const result = resultQuery.data;

  return (
    <main className={styles.page}>
      <div className={styles.header}>
        <Link to={`/course/${courseId}`} className={styles.backLink} aria-label="Back to course"><ArrowLeft size={22}/></Link>
        <div className={styles.headerText}>
          <p className={styles.eyebrow}>{quiz?.state || 'Quiz'}</p>
          <h1>{quiz?.title || 'Loading quiz…'}</h1>
        </div>
        {quiz && isStaff ? (
          <div className={styles.headerActions}>
            <Link className={styles.secondaryButton} to={`/course/${courseId}/quizzes/${quizId}/edit`}><Pencil size={16}/> Edit</Link>
            {access.canGrade ? <Link className={styles.secondaryButton} to={`/course/${courseId}/quizzes/${quizId}/grading`}><ShieldCheck size={16}/> Grade</Link> : null}
            <button type="button" className={styles.primaryButton} onClick={() => changeState.mutate()} disabled={changeState.isPending}>
              {quiz.state === 'Published' ? 'Unpublish' : 'Publish quiz'}
            </button>
          </div>
        ) : null}
      </div>

      {quiz ? (
        <section className={styles.summaryCard}>
          <p className={styles.instructions}>{quiz.instructions || 'No instructions were provided.'}</p>
          <div className={styles.summaryGrid}>
            <span><Clock3 size={17}/> {quiz.timeLimitSeconds ? `${Math.round(quiz.timeLimitSeconds / 60)} minutes` : 'No time limit'}</span>
            <span>{quiz.attemptsAllowed} attempt{quiz.attemptsAllowed === 1 ? '' : 's'}</span>
            <span>{quiz.totalPoints} points</span>
            <span>Closes {new Date(quiz.closesAtUtc).toLocaleString()}</span>
          </div>
        </section>
      ) : null}

      {isStaff ? (
        <section className={styles.card}>
          <h2>Questions</h2>
          {questions.length ? (
            <ol className={styles.questionSummary}>
              {questions.map(question => (
                <li key={question.id}>
                  <span>{question.stem}</span>
                  <small>{question.type} · {question.points} pts</small>
                </li>
              ))}
            </ol>
          ) : <p className={styles.muted}>No questions yet. Add questions before publishing.</p>}
        </section>
      ) : result ? (
        <section className={styles.card}>
          <div className={styles.resultHeader}><CheckCircle2 size={28}/><div><h2>Quiz submitted</h2><p>Receipt {result.receiptId || 'pending'}</p></div></div>
          <p className={styles.score}>{result.totalScore === null ? 'Waiting for grading' : `${result.totalScore} / ${quiz?.totalPoints ?? 0}`}</p>
          {result.manualGradingPending ? <p className={styles.muted}>A short-answer response still needs instructor grading.</p> : null}
        </section>
      ) : attempt ? (
        <section className={styles.attempt}>
          <div className={styles.attemptHeader}>
            <div><h2>Attempt {attempt.attemptNumber}</h2><p>Answers are saved one question at a time.</p></div>
            {attempt.deadlineAt ? <span>Deadline {new Date(attempt.deadlineAt).toLocaleTimeString()}</span> : null}
          </div>
          {questions.map((question, index) => {
            const draft = drafts[question.id] ?? emptyAnswer();
            return (
              <article key={question.id} className={styles.questionCard}>
                <div className={styles.questionHeading}><h3>{index + 1}. {question.stem}</h3><span>{question.points} pts</span></div>
                {question.type === 'ShortAnswer' ? (
                  <textarea
                    value={draft.textAnswer}
                    onChange={event => updateDraft(question.id, current => ({...current, textAnswer: event.target.value}))}
                    rows={5}
                    placeholder="Type your answer"
                  />
                ) : (
                  <div className={styles.options}>
                    {question.options.map(option => {
                      const checked = draft.selectedOptionIds.includes(option.id);
                      const multiple = question.type === 'MultipleSelect';
                      return (
                        <label key={option.id}>
                          <input
                            type={multiple ? 'checkbox' : 'radio'}
                            name={`question-${question.id}`}
                            checked={checked}
                            onChange={() => updateDraft(question.id, current => ({
                              ...current,
                              selectedOptionIds: multiple
                                ? checked
                                  ? current.selectedOptionIds.filter(id => id !== option.id)
                                  : [...current.selectedOptionIds, option.id]
                                : [option.id],
                            }))}
                          />
                          <span>{option.label}</span>
                        </label>
                      );
                    })}
                  </div>
                )}
                <div className={styles.questionFooter}>
                  {savedQuestions.has(question.id) ? <span className={styles.saved}><CheckCircle2 size={15}/> Saved</span> : <span/>}
                  <button
                    type="button"
                    className={styles.secondaryButton}
                    onClick={() => saveAnswer.mutate({question, draft})}
                    disabled={saveAnswer.isPending}
                  >Save answer</button>
                </div>
              </article>
            );
          })}
          <div className={styles.submitBar}>
            {confirmSubmit ? (
              <>
                <p>Submit this attempt? You won&apos;t be able to change answers afterward.</p>
                <button type="button" className={styles.secondaryButton} onClick={() => setConfirmSubmit(false)}>Keep working</button>
                <button type="button" className={styles.primaryButton} onClick={() => submitAttempt.mutate()} disabled={submitAttempt.isPending}>Confirm submit</button>
              </>
            ) : <button type="button" className={styles.primaryButton} onClick={() => setConfirmSubmit(true)}>Submit quiz</button>}
          </div>
        </section>
      ) : (
        <section className={styles.card}>
          <h2>Ready to begin?</h2>
          <p className={styles.muted}>Starting creates an attempt and begins the quiz timer, if one is configured.</p>
          <button type="button" className={styles.primaryButton} onClick={() => startAttempt.mutate()} disabled={startAttempt.isPending || quiz?.state !== 'Published'}>
            {startAttempt.isPending ? 'Starting…' : quiz?.state === 'Published' ? 'Start attempt' : 'Quiz is not open'}
          </button>
          {startAttempt.isError || attemptQuery.isError ? <p className={styles.error} role="alert">The attempt could not be started. Check the quiz window and try again.</p> : null}
        </section>
      )}
    </main>
  );
};

export default QuizPage;
