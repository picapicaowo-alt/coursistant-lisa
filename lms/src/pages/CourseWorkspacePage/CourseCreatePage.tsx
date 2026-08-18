import React, {useState} from 'react';
import {useMutation} from '@tanstack/react-query';
import {useNavigate} from 'react-router-dom';
import {ApiError, unwrapData} from '@/apis';
import {courseApiService} from '@/apis/services/course-api';
import {EnglishDateInput} from '@/components/EnglishDateInput';
import styles from './CourseCreatePage.module.scss';

interface FormState {
  courseCode: string;
  title: string;
  termStartDate: string;
  termEndDate: string;
  description: string;
  location: string;
}

const EMPTY_FORM: FormState = {
  courseCode: '',
  title: '',
  termStartDate: '',
  termEndDate: '',
  description: '',
  location: '',
};

const CourseCreatePage: React.FC = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState<FormState>(EMPTY_FORM);

  const createCourse = useMutation({
    mutationFn: async () => unwrapData(
      await courseApiService.createCourse({
        courseCode: form.courseCode.trim(),
        title: form.title.trim(),
        termStartDate: form.termStartDate,
        termEndDate: form.termEndDate,
        description: form.description.trim() || undefined,
        location: form.location.trim() || undefined,
      }),
      'createCourse',
    ),
    onSuccess: course => navigate(`/course/${course.id}`),
  });

  const updateField = (field: keyof FormState) => (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const value = event.target.value;
    setForm(current => ({...current, [field]: value}));
  };

  const datesOutOfOrder = Boolean(
    form.termStartDate && form.termEndDate && form.termEndDate < form.termStartDate,
  );
  const canSubmit = Boolean(
    form.courseCode.trim()
    && form.title.trim()
    && form.termStartDate
    && form.termEndDate
    && !datesOutOfOrder
    && !createCourse.isPending,
  );
  const failure = createCourse.isError
    ? (((createCourse.error as unknown) as ApiError)?.details as {message?: string} | undefined)?.message
      ?? "Couldn't create the course."
    : null;

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <button
          type="button"
          className={styles.back}
          onClick={() => navigate('/course')}
          aria-label="Back to courses"
        >
          <span aria-hidden="true">←</span>
        </button>
        <div>
          <p className={styles.eyebrow}>Course setup</p>
          <h1 className={styles.title}>New course</h1>
        </div>
      </header>

      <form
        className={styles.form}
        onSubmit={event => {
          event.preventDefault();
          if (canSubmit) createCourse.mutate();
        }}
      >
        <label className={styles.field}>
          <span className={styles.label}>Course code</span>
          <input className={styles.input} value={form.courseCode} onChange={updateField('courseCode')} maxLength={32} placeholder="CS01" required/>
        </label>

        <label className={styles.field}>
          <span className={styles.label}>Course title</span>
          <input className={styles.input} value={form.title} onChange={updateField('title')} placeholder="Computer Science" required/>
        </label>

        <div className={styles.row}>
          <label className={styles.field}>
            <span className={styles.label}>Term starts</span>
            <EnglishDateInput className={styles.input} value={form.termStartDate} onChangeValue={value => setForm(current => ({...current, termStartDate: value}))} required/>
          </label>
          <label className={styles.field}>
            <span className={styles.label}>Term ends</span>
            <EnglishDateInput className={styles.input} value={form.termEndDate} onChangeValue={value => setForm(current => ({...current, termEndDate: value}))} required/>
          </label>
        </div>

        {datesOutOfOrder ? <p className={styles.error}>The term must end on or after it starts.</p> : null}

        <label className={styles.field}>
          <span className={styles.label}>Location <span className={styles.optional}>optional</span></span>
          <input className={styles.input} value={form.location} onChange={updateField('location')} placeholder="Engineering Building"/>
        </label>

        <label className={styles.field}>
          <span className={styles.label}>Description <span className={styles.optional}>optional</span></span>
          <textarea className={styles.textarea} rows={4} value={form.description} onChange={updateField('description')}/>
        </label>

        {failure ? <p className={styles.error} role="alert">{failure}</p> : null}

        <div className={styles.actions}>
          <button type="button" className={styles.cancel} onClick={() => navigate('/course')}>Cancel</button>
          <button type="submit" className={styles.submit} disabled={!canSubmit}>
            {createCourse.isPending ? 'Creating…' : 'Create course'}
          </button>
        </div>
      </form>
    </main>
  );
};

export default CourseCreatePage;
