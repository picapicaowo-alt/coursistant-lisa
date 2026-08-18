import {FormEvent, useEffect, useMemo, useState} from 'react';
import {useMutation, useQuery, useQueryClient} from '@tanstack/react-query';
import {ArrowDown, ArrowLeft, ArrowUp, Plus, Trash2} from 'lucide-react';
import {Link, useNavigate, useParams} from 'react-router-dom';
import type {CreateQuizQuestionRequest, QuizQuestionType, QuizResultVisibility} from '@/apis';
import {unwrapData} from '@/apis';
import {quizApiService} from '@/apis/services/quiz-api';
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
  const [confirmDeleteQuestionId, setConfirmDeleteQuestionId] = useState<number | null>(null);
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
    mutationFn: () => quizApiService.createQuestion(courseId, quizId!, {
      ...questionDraft,
      stem: questionDraft.stem.trim(),
      options: questionDraft.type === 'ShortAnswer'
        ? []
        : questionDraft.options?.map((option, index) => ({...option, label: option.label.trim(), position: index + 1})),
    }),
    onSuccess: async () => {
      setQuestionDraft(defaultQuestion());
      setMessage('Question added.');
      await queryClient.invalidateQueries({queryKey: ['quiz-questions', courseId, quizId]});
      await queryClient.invalidateQueries({queryKey: ['quiz', courseId, quizId]});
    },
    onError: () => setMessage('The question could not be added.'),
  });

  const deleteQuestion = useMutation({
    mutationFn: (questionId: number) => quizApiService.deleteQuestion(courseId, quizId!, questionId),
    onSuccess: async () => {
      setConfirmDeleteQuestionId(null);
      await queryClient.invalidateQueries({queryKey: ['quiz-questions', courseId, quizId]});
      await queryClient.invalidateQueries({queryKey: ['quiz', courseId, quizId]});
    },
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

  const setQuestionType = (type: QuizQuestionType) => {
    setQuestionDraft(current => ({
      ...current,
      type,
      options: type === 'ShortAnswer'
        ? []
        : type === 'TrueFalse'
          ? [{label: 'True', isCorrect: true, position: 1}, {label: 'False', isCorrect: false, position: 2}]
          : [{label: '', isCorrect: true, position: 1}, {label: '', isCorrect: false, position: 2}],
    }));
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
          <label><span>Opens</span><input type="datetime-local" value={opensAt} onChange={event => setOpensAt(event.target.value)} required/></label>
          <label><span>Closes</span><input type="datetime-local" value={closesAt} onChange={event => setClosesAt(event.target.value)} required/></label>
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
            {questions.length ? <ol className={styles.questionList}>{questions.map((question, index) => <li key={question.id}><div><strong>{question.stem}</strong><small>{question.type} · {question.points} pts</small></div><div className={styles.rowActions}><button type="button" aria-label={`Move ${question.stem} up`} disabled={index === 0} onClick={() => moveQuestion(index, -1)}><ArrowUp size={16}/></button><button type="button" aria-label={`Move ${question.stem} down`} disabled={index === questions.length - 1} onClick={() => moveQuestion(index, 1)}><ArrowDown size={16}/></button>{confirmDeleteQuestionId === question.id ? <><button type="button" className={styles.dangerText} onClick={() => deleteQuestion.mutate(question.id)}>Confirm</button><button type="button" onClick={() => setConfirmDeleteQuestionId(null)}>Cancel</button></> : <button type="button" aria-label={`Delete ${question.stem}`} onClick={() => setConfirmDeleteQuestionId(question.id)}><Trash2 size={16}/></button>}</div></li>)}</ol> : <p className={styles.empty}>Add the first question below.</p>}
          </section>

          <section className={styles.card}>
            <div className={styles.cardHeader}><div><h2>Add question</h2><p>Correct-answer flags are sent only to instructor endpoints.</p></div></div>
            <div className={styles.formGrid}>
              <label><span>Type</span><select value={questionDraft.type} onChange={event => setQuestionType(event.target.value as QuizQuestionType)}><option value="SingleChoice">Single choice</option><option value="MultipleSelect">Multiple select</option><option value="TrueFalse">True / false</option><option value="ShortAnswer">Short answer</option></select></label>
              <label><span>Points</span><input type="number" min="0" step="0.5" value={questionDraft.points} onChange={event => setQuestionDraft(current => ({...current, points: Number(event.target.value)}))}/></label>
              <label className={styles.full}><span>Question</span><textarea rows={3} value={questionDraft.stem} onChange={event => setQuestionDraft(current => ({...current, stem: event.target.value}))}/></label>
            </div>
            {questionDraft.type !== 'ShortAnswer' ? <div className={styles.optionEditor}>{questionDraft.options?.map((option, index) => <div key={index}><input type={questionDraft.type === 'MultipleSelect' ? 'checkbox' : 'radio'} name="correct-option" checked={Boolean(option.isCorrect)} onChange={() => setQuestionDraft(current => ({...current, options: current.options?.map((item, optionIndex) => ({...item, isCorrect: questionDraft.type === 'MultipleSelect' ? optionIndex === index ? !item.isCorrect : item.isCorrect : optionIndex === index}))}))}/><input value={option.label} disabled={questionDraft.type === 'TrueFalse'} placeholder={`Option ${index + 1}`} onChange={event => setQuestionDraft(current => ({...current, options: current.options?.map((item, optionIndex) => optionIndex === index ? {...item, label: event.target.value} : item)}))}/>{questionDraft.type !== 'TrueFalse' && (questionDraft.options?.length ?? 0) > 2 ? <button type="button" onClick={() => setQuestionDraft(current => ({...current, options: current.options?.filter((_, optionIndex) => optionIndex !== index)}))}><Trash2 size={15}/></button> : null}</div>)}{questionDraft.type !== 'TrueFalse' ? <button type="button" className={styles.secondaryButton} onClick={() => setQuestionDraft(current => ({...current, options: [...(current.options ?? []), {label: '', isCorrect: false, position: (current.options?.length ?? 0) + 1}]}))}><Plus size={16}/> Add option</button> : null}</div> : null}
            <div className={styles.footer}><button type="button" className={styles.primaryButton} disabled={addQuestion.isPending || !questionDraft.stem.trim() || (questionDraft.type !== 'ShortAnswer' && questionDraft.options?.some(option => !option.label.trim()))} onClick={() => addQuestion.mutate()}>{addQuestion.isPending ? 'Adding…' : 'Add question'}</button></div>
          </section>
        </>
      ) : null}
    </main>
  );
};

export default QuizEditorPage;
