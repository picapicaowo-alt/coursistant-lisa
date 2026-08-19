import {Dispatch, FormEvent, SetStateAction, useEffect, useMemo, useState} from 'react';
import {useMutation, useQuery, useQueryClient} from '@tanstack/react-query';
import {ArrowDown, ArrowLeft, ArrowUp, Pencil, Plus, Trash2, X} from 'lucide-react';
import {Link, useNavigate, useParams} from 'react-router-dom';
import type {CreateQuizQuestionRequest, QuizQuestion, QuizQuestionType, QuizResultVisibility} from '@/apis';
import {unwrapData} from '@/apis';
import {quizApiService} from '@/apis/services/quiz-api';
import {EnglishDateTimeInput} from '@/components/EnglishDateInput';
import {useCourseAccess} from '@/hooks/useCourseAccess';
import styles from './index.module.scss';

const localInputValue = (date: Date) => {
  const shifted = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return shifted.toISOString().slice(0, 16);
};

const defaultQuestion = (): CreateQuizQuestionRequest => ({
  type: 'SingleChoice',
  stem: '',
  points: 1,
  options: [
    {label: '', isCorrect: true, position: 1},
    {label: '', isCorrect: false, position: 2},
  ],
});

const questionToDraft = (question: QuizQuestion): CreateQuizQuestionRequest => ({
  type: question.type,
  stem: question.stem,
  points: question.points,
  options: question.options.map(option => ({...option})),
});

const normalizedQuestion = (draft: CreateQuizQuestionRequest): CreateQuizQuestionRequest => ({
  ...draft,
  stem: draft.stem.trim(),
  options: draft.type === 'ShortAnswer'
    ? []
    : draft.options?.map((option, index) => ({
      ...option,
      label: option.label.trim(),
      position: index + 1,
    })),
});

const isQuestionValid = (draft: CreateQuizQuestionRequest) => {
  if (!draft.stem.trim() || !Number.isFinite(draft.points) || draft.points < 0) return false;
  if (draft.type === 'ShortAnswer') return true;
  const options = draft.options ?? [];
  if (options.length < 2 || options.some(option => !option.label.trim())) return false;
  const correctCount = options.filter(option => option.isCorrect).length;
  return draft.type === 'MultipleSelect' ? correctCount > 0 : correctCount === 1;
};

interface QuestionFieldsProps {
  draft: CreateQuizQuestionRequest;
  setDraft: Dispatch<SetStateAction<CreateQuizQuestionRequest>>;
  canChangeType: boolean;
}

const QuestionFields = ({draft, setDraft, canChangeType}: QuestionFieldsProps) => {
  const setQuestionType = (type: QuizQuestionType) => {
    setDraft(current => ({
      ...current,
      type,
      options: type === 'ShortAnswer'
        ? []
        : type === 'TrueFalse'
          ? [{label: 'True', isCorrect: true, position: 1}, {label: 'False', isCorrect: false, position: 2}]
          : [{label: '', isCorrect: true, position: 1}, {label: '', isCorrect: false, position: 2}],
    }));
  };

  return (
    <>
      <div className={styles.formGrid}>
        <label><span>Type</span><select value={draft.type} disabled={!canChangeType} onChange={event => setQuestionType(event.target.value as QuizQuestionType)}><option value="SingleChoice">Single choice</option><option value="MultipleSelect">Multiple select</option><option value="TrueFalse">True / false</option><option value="ShortAnswer">Short answer</option></select></label>
        <label><span>Points</span><input type="number" min="0" step="0.5" value={draft.points} onChange={event => setDraft(current => ({...current, points: Number(event.target.value)}))}/></label>
        <label className={styles.full}><span>Question</span><textarea rows={3} value={draft.stem} onChange={event => setDraft(current => ({...current, stem: event.target.value}))}/></label>
      </div>
      {draft.type !== 'ShortAnswer' ? (
        <fieldset className={styles.optionEditor}>
          <legend>Answer options</legend>
          {draft.options?.map((option, index) => (
            <div key={option.id ?? index}>
              <input
                type={draft.type === 'MultipleSelect' ? 'checkbox' : 'radio'}
                name={`correct-option-${canChangeType ? 'new' : 'edit'}`}
                aria-label={`Mark option ${index + 1} correct`}
                checked={Boolean(option.isCorrect)}
                onChange={() => setDraft(current => ({
                  ...current,
                  options: current.options?.map((item, optionIndex) => ({
                    ...item,
                    isCorrect: current.type === 'MultipleSelect'
                      ? optionIndex === index ? !item.isCorrect : item.isCorrect
                      : optionIndex === index,
                  })),
                }))}
              />
              <input
                value={option.label}
                disabled={draft.type === 'TrueFalse'}
                aria-label={`Option ${index + 1}`}
                placeholder={`Option ${index + 1}`}
                onChange={event => setDraft(current => ({
                  ...current,
                  options: current.options?.map((item, optionIndex) => optionIndex === index
                    ? {...item, label: event.target.value}
                    : item),
                }))}
              />
              {draft.type !== 'TrueFalse' && (draft.options?.length ?? 0) > 2 ? (
                <button type="button" aria-label={`Remove option ${index + 1}`} onClick={() => setDraft(current => ({...current, options: current.options?.filter((_, optionIndex) => optionIndex !== index)}))}><Trash2 size={15}/></button>
              ) : null}
            </div>
          ))}
          {draft.type !== 'TrueFalse' ? (
            <button type="button" className={styles.secondaryButton} onClick={() => setDraft(current => ({...current, options: [...(current.options ?? []), {label: '', isCorrect: false, position: (current.options?.length ?? 0) + 1}]}))}><Plus size={16}/> Add option</button>
          ) : null}
        </fieldset>
      ) : null}
    </>
  );
};

const QuizEditorPage = () => {
  const {courseId: courseIdParam, quizId: quizIdParam} = useParams();
  const courseId = Number(courseIdParam);
  const quizId = quizIdParam ? Number(quizIdParam) : null;
  const isNew = quizId === null;
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const access = useCourseAccess(Number.isInteger(courseId) ? courseId : null);
  const [title, setTitle] = useState('');
  const [instructions, setInstructions] = useState('');
  const [opensAt, setOpensAt] = useState(() => localInputValue(new Date()));
  const [closesAt, setClosesAt] = useState(() => localInputValue(new Date(Date.now() + 7 * 86400_000)));
  const [timeLimitMinutes, setTimeLimitMinutes] = useState('');
  const [attemptsAllowed, setAttemptsAllowed] = useState(1);
  const [resultVisibility, setResultVisibility] = useState<QuizResultVisibility>('AfterRelease');
  const [questionDraft, setQuestionDraft] = useState(defaultQuestion);
  const [editingQuestionId, setEditingQuestionId] = useState<number | null>(null);
  const [editingQuestionDraft, setEditingQuestionDraft] = useState<CreateQuizQuestionRequest>(defaultQuestion);
  const [confirmDeleteQuestionId, setConfirmDeleteQuestionId] = useState<number | null>(null);
  const [confirmDeleteQuiz, setConfirmDeleteQuiz] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const quizQuery = useQuery({
    queryKey: ['quiz', courseId, quizId],
    queryFn: async () => unwrapData(await quizApiService.getQuiz(courseId, quizId!), 'getQuiz'),
    enabled: !isNew && Number.isInteger(courseId) && Number.isInteger(quizId),
    retry: 1,
  });
  const questionsQuery = useQuery({
    queryKey: ['quiz-questions', courseId, quizId],
    queryFn: async () => unwrapData(await quizApiService.listQuestions(courseId, quizId!), 'listQuestions'),
    enabled: !isNew && Number.isInteger(courseId) && Number.isInteger(quizId),
    retry: 1,
  });

  useEffect(() => {
    const quiz = quizQuery.data;
    if (!quiz) return;
    setTitle(quiz.title);
    setInstructions(quiz.instructions ?? '');
    setOpensAt(quiz.opensAtLocal.slice(0, 16));
    setClosesAt(quiz.closesAtLocal.slice(0, 16));
    setTimeLimitMinutes(quiz.timeLimitSeconds ? String(Math.round(quiz.timeLimitSeconds / 60)) : '');
    setAttemptsAllowed(quiz.attemptsAllowed);
    setResultVisibility(quiz.resultVisibility);
    // Rehydrate only when the quiz identity/version changes, not on every refetch.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quizQuery.data?.id, quizQuery.data?.version]);

  const settingsPayload = useMemo(() => ({
    title: title.trim(),
    instructions: instructions.trim(),
    opensAt,
    closesAt,
    timeLimitSeconds: timeLimitMinutes ? Math.round(Number(timeLimitMinutes) * 60) : null,
    attemptsAllowed,
    resultVisibility,
  }), [attemptsAllowed, closesAt, instructions, opensAt, resultVisibility, timeLimitMinutes, title]);

  const saveQuiz = useMutation({
    mutationFn: () => isNew
      ? quizApiService.createQuiz(courseId, settingsPayload)
      : quizApiService.patchQuiz(courseId, quizId, {...settingsPayload, expectedVersion: quizQuery.data!.version}),
    onSuccess: async response => {
      const saved = unwrapData(response, 'saveQuiz');
      await queryClient.invalidateQueries({queryKey: ['course-quizzes', courseId]});
      setMessage('Quiz settings saved.');
      if (isNew) navigate(`/course/${courseId}/quizzes/${saved.id}/edit`, {replace: true});
      else await queryClient.invalidateQueries({queryKey: ['quiz', courseId, quizId]});
    },
    onError: () => setMessage('Quiz settings could not be saved.'),
  });

  const addQuestion = useMutation({
    mutationFn: () => quizApiService.createQuestion(courseId, quizId!, normalizedQuestion(questionDraft)),
    onSuccess: async () => {
      setQuestionDraft(defaultQuestion());
      setMessage('Question added.');
      await queryClient.invalidateQueries({queryKey: ['quiz-questions', courseId, quizId]});
      await queryClient.invalidateQueries({queryKey: ['quiz', courseId, quizId]});
    },
    onError: () => setMessage('The question could not be added.'),
  });

  const saveQuestion = useMutation({
    mutationFn: ({questionId, expectedVersion}: {questionId: number; expectedVersion: number}) =>
      quizApiService.patchQuestion(courseId, quizId!, questionId, {
        ...normalizedQuestion(editingQuestionDraft),
        expectedVersion,
      }),
    onSuccess: async () => {
      setEditingQuestionId(null);
      setMessage('Question updated.');
      await queryClient.invalidateQueries({queryKey: ['quiz-questions', courseId, quizId]});
      await queryClient.invalidateQueries({queryKey: ['quiz', courseId, quizId]});
    },
    onError: () => setMessage('The question could not be updated. Refresh if another editor changed it.'),
  });

  const deleteQuestion = useMutation({
    mutationFn: (questionId: number) => quizApiService.deleteQuestion(courseId, quizId!, questionId),
    onSuccess: async () => {
      setConfirmDeleteQuestionId(null);
      await queryClient.invalidateQueries({queryKey: ['quiz-questions', courseId, quizId]});
      await queryClient.invalidateQueries({queryKey: ['quiz', courseId, quizId]});
    },
  });

  const deleteQuiz = useMutation({
    mutationFn: () => quizApiService.deleteQuiz(courseId, quizId!),
    onSuccess: async () => {
      await queryClient.invalidateQueries({queryKey: ['course-quizzes', courseId]});
      navigate(`/course/${courseId}`, {replace: true});
    },
    onError: () => setMessage('The quiz could not be deleted. It may contain attempts that must be retained.'),
  });

  const reorderQuestions = useMutation({
    mutationFn: (questionIds: number[]) => quizApiService.reorderQuestions(courseId, quizId!, questionIds),
    onSuccess: async () => queryClient.invalidateQueries({queryKey: ['quiz-questions', courseId, quizId]}),
  });

  const publishQuiz = useMutation({
    mutationFn: () => quizQuery.data?.state === 'Published'
      ? quizApiService.unpublishQuiz(courseId, quizId!)
      : quizApiService.publishQuiz(courseId, quizId!),
    onSuccess: async () => {
      await queryClient.invalidateQueries({queryKey: ['quiz', courseId, quizId]});
      await queryClient.invalidateQueries({queryKey: ['course-quizzes', courseId]});
    },
  });

  const moveQuestion = (index: number, offset: -1 | 1) => {
    const questions = questionsQuery.data ?? [];
    const target = index + offset;
    if (target < 0 || target >= questions.length) return;
    const ids = questions.map(question => question.id);
    [ids[index], ids[target]] = [ids[target], ids[index]];
    reorderQuestions.mutate(ids);
  };

  const submitSettings = (event: FormEvent) => {
    event.preventDefault();
    setMessage(null);
    saveQuiz.mutate();
  };

  if (access.isResolved && !access.canConfigureAssignments) {
    return <main className={styles.page}><p className={styles.error} role="alert">You do not have permission to configure quizzes in this course.</p></main>;
  }

  const questions = questionsQuery.data ?? [];

  return (
    <main className={styles.page}>
      <div className={styles.header}>
        <Link to={isNew ? `/course/${courseId}` : `/course/${courseId}/quizzes/${quizId}`} className={styles.backLink} aria-label="Back"><ArrowLeft size={22}/></Link>
        <div><p className={styles.eyebrow}>{isNew ? 'New quiz' : quizQuery.data?.state || 'Quiz editor'}</p><h1>{isNew ? 'Create a quiz' : `Edit ${quizQuery.data?.title || 'quiz'}`}</h1></div>
      </div>

      <form className={styles.card} onSubmit={submitSettings}>
        <div className={styles.cardHeader}><div><h2>Quiz settings</h2><p>Times use the course timezone.</p></div><button className={styles.primaryButton} disabled={saveQuiz.isPending || !title.trim() || !opensAt || !closesAt}>{saveQuiz.isPending ? 'Saving…' : isNew ? 'Create quiz' : 'Save settings'}</button></div>
        <div className={styles.formGrid}>
          <label className={styles.full}><span>Title</span><input value={title} onChange={event => setTitle(event.target.value)} required/></label>
          <label className={styles.full}><span>Instructions</span><textarea value={instructions} onChange={event => setInstructions(event.target.value)} rows={4}/></label>
          <label><span>Opens</span><EnglishDateTimeInput value={opensAt} onChangeValue={setOpensAt} required/></label>
          <label><span>Closes</span><EnglishDateTimeInput value={closesAt} onChangeValue={setClosesAt} required/></label>
          <label><span>Time limit (minutes)</span><input type="number" min="1" value={timeLimitMinutes} onChange={event => setTimeLimitMinutes(event.target.value)} placeholder="Unlimited"/></label>
          <label><span>Attempts allowed</span><input type="number" min="1" value={attemptsAllowed} onChange={event => setAttemptsAllowed(Math.max(1, Number(event.target.value)))}/></label>
          <label className={styles.full}><span>Result visibility</span><select value={resultVisibility} onChange={event => setResultVisibility(event.target.value as QuizResultVisibility)}><option value="AfterRelease">After instructor release</option><option value="InstantAutoScore">Instant auto-score</option></select></label>
        </div>
        {message ? <p className={message.includes('not') || message.includes('could') ? styles.error : styles.success} role="status">{message}</p> : null}
      </form>

      {!isNew ? (
        <>
          <section className={styles.card}>
            <div className={styles.cardHeader}><div><h2>Questions</h2><p>{questions.length} question{questions.length === 1 ? '' : 's'} · {quizQuery.data?.totalPoints ?? 0} points</p></div><button type="button" className={styles.primaryButton} onClick={() => publishQuiz.mutate()} disabled={publishQuiz.isPending || (!questions.length && quizQuery.data?.state !== 'Published')}>{quizQuery.data?.state === 'Published' ? 'Unpublish' : 'Publish quiz'}</button></div>
            {quizQuery.data?.hasAttempts ? <p className={styles.lockedNotice}>Questions are locked because learners have started this quiz.</p> : null}
            {questions.length ? <ol className={styles.questionList}>{questions.map((question, index) => <li key={question.id}><div><strong>{question.stem}</strong><small>{question.type} · {question.points} pts</small></div><div className={styles.rowActions}><button type="button" aria-label={`Edit ${question.stem}`} disabled={quizQuery.data?.hasAttempts} onClick={() => { setEditingQuestionId(question.id); setEditingQuestionDraft(questionToDraft(question)); setMessage(null); }}><Pencil size={16}/></button><button type="button" aria-label={`Move ${question.stem} up`} disabled={index === 0 || quizQuery.data?.hasAttempts} onClick={() => moveQuestion(index, -1)}><ArrowUp size={16}/></button><button type="button" aria-label={`Move ${question.stem} down`} disabled={index === questions.length - 1 || quizQuery.data?.hasAttempts} onClick={() => moveQuestion(index, 1)}><ArrowDown size={16}/></button>{confirmDeleteQuestionId === question.id ? <><button type="button" className={styles.dangerText} onClick={() => deleteQuestion.mutate(question.id)}>Confirm</button><button type="button" onClick={() => setConfirmDeleteQuestionId(null)}>Cancel</button></> : <button type="button" aria-label={`Delete ${question.stem}`} disabled={quizQuery.data?.hasAttempts} onClick={() => setConfirmDeleteQuestionId(question.id)}><Trash2 size={16}/></button>}</div></li>)}</ol> : <p className={styles.empty}>Add the first question below.</p>}
          </section>

          {editingQuestionId !== null ? (
            <section className={styles.card} aria-labelledby="edit-question-title">
              <div className={styles.cardHeader}><div><h2 id="edit-question-title">Edit question</h2><p>The question type cannot change after creation.</p></div><button type="button" className={styles.iconButton} aria-label="Close question editor" onClick={() => setEditingQuestionId(null)}><X size={18}/></button></div>
              <QuestionFields draft={editingQuestionDraft} setDraft={setEditingQuestionDraft} canChangeType={false}/>
              <div className={styles.footer}><button type="button" className={styles.primaryButton} disabled={saveQuestion.isPending || !isQuestionValid(editingQuestionDraft)} onClick={() => { const question = questions.find(item => item.id === editingQuestionId); if (question) saveQuestion.mutate({questionId: question.id, expectedVersion: question.version ?? 1}); }}>{saveQuestion.isPending ? 'Saving…' : 'Save question'}</button></div>
            </section>
          ) : null}

          <section className={styles.card}>
            <div className={styles.cardHeader}><div><h2>Add question</h2><p>Correct-answer flags are sent only to instructor endpoints.</p></div></div>
            <QuestionFields draft={questionDraft} setDraft={setQuestionDraft} canChangeType/>
            <div className={styles.footer}><button type="button" className={styles.primaryButton} disabled={addQuestion.isPending || !isQuestionValid(questionDraft)} onClick={() => addQuestion.mutate()}>{addQuestion.isPending ? 'Adding…' : 'Add question'}</button></div>
          </section>

          <section className={`${styles.card} ${styles.dangerZone}`} aria-labelledby="delete-quiz-title">
            <div>
              <h2 id="delete-quiz-title">Delete quiz</h2>
              <p>This permanently removes the quiz. The server will refuse the operation if learner attempts must be retained.</p>
            </div>
            {confirmDeleteQuiz ? (
              <div className={styles.dangerActions}>
                <button type="button" className={styles.secondaryButton} onClick={() => setConfirmDeleteQuiz(false)}>Cancel</button>
                <button type="button" className={styles.dangerButton} disabled={deleteQuiz.isPending} onClick={() => deleteQuiz.mutate()}>{deleteQuiz.isPending ? 'Deleting…' : 'Confirm delete'}</button>
              </div>
            ) : <button type="button" className={styles.dangerButton} onClick={() => setConfirmDeleteQuiz(true)}>Delete quiz</button>}
          </section>
        </>
      ) : null}
    </main>
  );
};

export default QuizEditorPage;
