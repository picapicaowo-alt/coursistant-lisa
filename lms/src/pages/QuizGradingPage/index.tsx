import {useEffect, useMemo, useState} from 'react';
import {useMutation, useQueries, useQuery, useQueryClient} from '@tanstack/react-query';
import {ArrowLeft, CheckCircle2, RotateCcw, Search, Send, Users} from 'lucide-react';
import {Link, useParams} from 'react-router-dom';
import {unwrapData} from '@/apis';
import {quizApiService} from '@/apis/services/quiz-api';
import {courseApiService} from '@/apis/services/course-api';
import {useCourseAccess} from '@/hooks/useCourseAccess';
import {idempotencyFingerprint, useIdempotencyCheckpoint} from '@/hooks/useIdempotencyCheckpoint';
import styles from './index.module.scss';

interface GradeDraft {
  score: string;
  feedback: string;
}

const loadCourseStudents = async (courseId: number) => {
  const size = 100;
  const first = unwrapData(
    await courseApiService.listCourseMembers(courseId, {courseRole: 'Student', active: true, page: 0, size}),
    'listCourseMembers page 0',
  );
  const pageCount = Math.ceil(first.total / size);
  if (pageCount <= 1) return first.items;
  const rest = await Promise.all(Array.from({length: pageCount - 1}, async (_, index) => unwrapData(
    await courseApiService.listCourseMembers(courseId, {courseRole: 'Student', active: true, page: index + 1, size}),
    `listCourseMembers page ${index + 1}`,
  )));
  return [first.items, ...rest.map(page => page.items)].flat();
};

const QuizGradingPage = () => {
  const {courseId: courseIdParam, quizId: quizIdParam} = useParams();
  const courseId = Number(courseIdParam);
  const quizId = Number(quizIdParam);
  const valid = Number.isInteger(courseId) && courseId > 0 && Number.isInteger(quizId) && quizId > 0;
  const access = useCourseAccess(valid ? courseId : null);
  const queryClient = useQueryClient();
  const idempotency = useIdempotencyCheckpoint();
  const [selectedQuestionId, setSelectedQuestionId] = useState<number | null>(null);
  const [drafts, setDrafts] = useState<Record<number, GradeDraft>>({});
  const [selectedUserIds, setSelectedUserIds] = useState<Set<number>>(new Set());
  const [studentSearch, setStudentSearch] = useState('');
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
  const studentsQuery = useQuery({
    queryKey: ['course-students', courseId],
    queryFn: () => loadCourseStudents(courseId),
    enabled: valid && access.canReleaseGrades,
  });
  const students = studentsQuery.data ?? [];
  const studentAttemptQueries = useQueries({
    queries: students.map(student => ({
      queryKey: ['quiz-attempts', courseId, quizId, 'student', student.userId],
      queryFn: async () => unwrapData(
        await quizApiService.listAttempts(courseId, quizId, {userId: student.userId, page: 1, pageSize: 50}),
        `listAttempts user ${student.userId}`,
      ),
      enabled: access.canReleaseGrades,
      staleTime: 30_000,
    })),
  });
  const shortQuestions = useMemo(
    () => (questionsQuery.data ?? []).filter(question => question.type === 'ShortAnswer'),
    [questionsQuery.data],
  );
  const firstShortQuestionId = shortQuestions[0]?.id ?? null;

  useEffect(() => {
    if (selectedQuestionId === null && firstShortQuestionId !== null) setSelectedQuestionId(firstShortQuestionId);
  }, [firstShortQuestionId, selectedQuestionId]);

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
    mutationFn: ({attemptId, questionId, draft}: {attemptId: number; questionId: number; draft: GradeDraft}) => {
      const request = {
        score: Number(draft.score),
        feedback: draft.feedback.trim() || undefined,
      };
      const operation = `quiz-grade-${courseId}-${quizId}-${attemptId}-${questionId}`;
      return quizApiService.gradeAnswer(
        courseId,
        quizId,
        attemptId,
        questionId,
        request,
        idempotency.keyFor(operation, idempotencyFingerprint(request)),
      );
    },
    onSuccess: async (_, {attemptId, questionId, draft}) => {
      const request = {score: Number(draft.score), feedback: draft.feedback.trim() || undefined};
      const operation = `quiz-grade-${courseId}-${quizId}-${attemptId}-${questionId}`;
      idempotency.completeFingerprint(operation, idempotencyFingerprint(request));
      setMessage('Grade saved.');
      await queryClient.invalidateQueries({queryKey: ['quiz-short-answers', courseId, quizId, selectedQuestionId]});
      await queryClient.invalidateQueries({queryKey: ['quiz-grading-summary', courseId, quizId]});
    },
    onError: () => setMessage('The grade could not be saved.'),
  });

  const updateRelease = useMutation({
    mutationFn: ({action, userIds}: {action: 'release' | 'retract'; userIds?: number[]}) => {
      const operation = `quiz-grades-${action}-${courseId}-${quizId}`;
      const fingerprint = idempotencyFingerprint({action, userIds: userIds ?? []});
      const key = idempotency.keyFor(operation, fingerprint);
      return action === 'release'
        ? quizApiService.releaseGrades(courseId, quizId, userIds, key)
        : quizApiService.retractGrades(courseId, quizId, userIds, key);
    },
    onSuccess: async (_, {action, userIds}) => {
      const operation = `quiz-grades-${action}-${courseId}-${quizId}`;
      const fingerprint = idempotencyFingerprint({action, userIds: userIds ?? []});
      idempotency.completeFingerprint(operation, fingerprint);
      setMessage(action === 'release'
        ? `${userIds?.length ?? 'Eligible'} grade${userIds?.length === 1 ? '' : 's'} released.`
        : `${userIds?.length ?? 'Released'} grade${userIds?.length === 1 ? '' : 's'} retracted.`);
      setSelectedUserIds(new Set());
      await queryClient.invalidateQueries({queryKey: ['quiz-grading-summary', courseId, quizId]});
    },
    onError: () => setMessage('The grade release state could not be changed.'),
  });

  if (access.isResolved && !access.canGrade) {
    return <main className={styles.page}><p className={styles.error} role="alert">You do not have grading permission for this course.</p></main>;
  }

  const selectedQuestion = shortQuestions.find(question => question.id === selectedQuestionId);
  const studentRows = students.map((student, index) => {
    const attempts = studentAttemptQueries[index]?.data ?? [];
    const finalizedAttempts = attempts.filter(attempt => attempt.status !== 'InProgress');
    return {
      student,
      attempts,
      finalizedAttempts,
      latest: attempts[0],
      isLoading: studentAttemptQueries[index]?.isPending ?? false,
      isError: studentAttemptQueries[index]?.isError ?? false,
    };
  });
  const normalizedSearch = studentSearch.trim().toLowerCase();
  const visibleStudentRows = normalizedSearch
    ? studentRows.filter(({student}) => `${student.userName ?? ''} ${student.userEmail ?? ''} ${student.userId}`.toLowerCase().includes(normalizedSearch))
    : studentRows;
  const selectableUserIds = visibleStudentRows
    .filter(row => row.finalizedAttempts.length > 0)
    .map(row => row.student.userId);
  const allVisibleSelected = selectableUserIds.length > 0
    && selectableUserIds.every(userId => selectedUserIds.has(userId));

  const toggleStudent = (userId: number) => setSelectedUserIds(current => {
    const next = new Set(current);
    if (next.has(userId)) next.delete(userId);
    else next.add(userId);
    return next;
  });

  return (
    <main className={styles.page}>
      <div className={styles.header}>
        <Link to={`/course/${courseId}/quizzes/${quizId}`} className={styles.backLink} aria-label="Back to quiz"><ArrowLeft size={22}/></Link>
        <div><p className={styles.eyebrow}>Quiz grading</p><h1>{quizQuery.data?.title || 'Loading quiz…'}</h1></div>
        <div className={styles.headerActions}>
          {access.canReleaseGrades ? <><button type="button" className={styles.secondaryButton} onClick={() => updateRelease.mutate({action: 'retract'})} disabled={updateRelease.isPending}><RotateCcw size={16}/> Retract all</button>
          <button type="button" className={styles.primaryButton} onClick={() => updateRelease.mutate({action: 'release'})} disabled={updateRelease.isPending || Boolean(summaryQuery.data?.manualIncompleteAttemptCount)}><Send size={16}/> Release all eligible</button></> : null}
        </div>
      </div>

      <section className={styles.summaryGrid}>
        <div><strong>{summaryQuery.data?.submittedAttemptCount ?? '—'}</strong><span>Submitted attempts</span></div>
        <div><strong>{summaryQuery.data?.pendingShortAnswerCount ?? '—'}</strong><span>Pending short answers</span></div>
        <div><strong>{summaryQuery.data?.manualIncompleteAttemptCount ?? '—'}</strong><span>Incomplete grading</span></div>
        <div><strong>{summaryQuery.data?.releasedUserCount ?? '—'}</strong><span>Released users</span></div>
      </section>

      {message ? <p className={message.includes('could not') ? styles.error : styles.success} role="status">{message}</p> : null}

      {access.canReleaseGrades ? (
        <section className={styles.card} aria-labelledby="student-release-title">
          <div className={styles.cardHeader}>
            <div><h2 id="student-release-title">Grade release by student</h2><p>Select learners with a finalized attempt, then release or retract only those grades.</p></div>
            <div className={styles.selectionActions}>
              <button type="button" className={styles.secondaryButton} onClick={() => updateRelease.mutate({action: 'retract', userIds: [...selectedUserIds]})} disabled={updateRelease.isPending || selectedUserIds.size === 0}><RotateCcw size={16}/> Retract selected</button>
              <button type="button" className={styles.primaryButton} onClick={() => updateRelease.mutate({action: 'release', userIds: [...selectedUserIds]})} disabled={updateRelease.isPending || selectedUserIds.size === 0}><Send size={16}/> Release selected</button>
            </div>
          </div>
          <div className={styles.rosterToolbar}>
            <label className={styles.searchBox}><Search size={17}/><span className={styles.srOnly}>Search students</span><input value={studentSearch} onChange={event => setStudentSearch(event.target.value)} placeholder="Search students"/></label>
            <label className={styles.selectAll}><input type="checkbox" checked={allVisibleSelected} disabled={!selectableUserIds.length} onChange={() => setSelectedUserIds(current => { const next = new Set(current); selectableUserIds.forEach(userId => allVisibleSelected ? next.delete(userId) : next.add(userId)); return next; })}/><span>Select visible submissions</span></label>
            <span className={styles.selectedCount}><Users size={16}/> {selectedUserIds.size} selected</span>
          </div>
          {studentsQuery.isPending ? <p className={styles.empty}>Loading course students…</p> : studentsQuery.isError ? <div className={styles.inlineError} role="alert"><p>Students could not be loaded.</p><button type="button" onClick={() => void studentsQuery.refetch()}>Try again</button></div> : visibleStudentRows.length === 0 ? <p className={styles.empty}>No matching active students.</p> : (
            <ul className={styles.studentList}>
              {visibleStudentRows.map(row => {
                const selectable = row.finalizedAttempts.length > 0;
                return <li key={row.student.userId}>
                  <label><input type="checkbox" checked={selectedUserIds.has(row.student.userId)} disabled={!selectable || row.isLoading || row.isError} onChange={() => toggleStudent(row.student.userId)}/><span><strong>{row.student.userName || `User ${row.student.userId}`}</strong><small>{row.student.userEmail || `User ID ${row.student.userId}`}</small></span></label>
                  <span className={styles.attemptStatus}>{row.isLoading ? 'Loading attempts…' : row.isError ? 'Attempts unavailable' : row.latest ? `${row.finalizedAttempts.length} finalized · latest ${row.latest.status}` : 'No attempts'}</span>
                </li>;
              })}
            </ul>
          )}
        </section>
      ) : null}

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
