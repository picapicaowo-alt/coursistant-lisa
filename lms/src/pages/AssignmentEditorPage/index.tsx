import {ChangeEvent, FormEvent, useState} from 'react';
import {useQuery, useQueryClient} from '@tanstack/react-query';
import {ArrowLeft, CalendarClock, FileText, Upload, UsersRound, X} from 'lucide-react';
import {Link, useNavigate, useParams} from 'react-router-dom';
import type {AssignmentDetail, AssignmentSubmissionType, CreateAssignmentPayload} from '@/apis';
import {unwrapData} from '@/apis';
import {assignmentApiService} from '@/apis/services/assignment-api';
import styles from './index.module.scss';

const parseId = (value?: string) => {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
};

const toDateTimeInput = (value?: string) => value ? value.slice(0, 16) : '';
const toApiDateTime = (value: string) => value.length === 16 ? `${value}:00` : value;
const formatFileSize = (sizeBytes: number) => {
  if (sizeBytes < 1024 * 1024) return `${Math.max(1, Math.round(sizeBytes / 1024))} KB`;
  return `${(sizeBytes / 1024 / 1024).toFixed(1)} MB`;
};

interface AssignmentEditorFormProps {
  courseId: number;
  assignment?: AssignmentDetail;
}

const AssignmentEditorForm = ({courseId, assignment}: AssignmentEditorFormProps) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [title, setTitle] = useState(assignment?.title ?? '');
  const [description, setDescription] = useState(assignment?.description ?? '');
  const [dueAt, setDueAt] = useState(toDateTimeInput(assignment?.dueAtLocal));
  const [lateUntil, setLateUntil] = useState(toDateTimeInput(assignment?.lateUntilLocal));
  const [pointsPossible, setPointsPossible] = useState(
    assignment?.pointsPossible === undefined ? '100' : String(assignment.pointsPossible)
  );
  const [submissionType, setSubmissionType] = useState<AssignmentSubmissionType>(
    assignment?.submissionType ?? 'Individual'
  );
  const [groupSetId, setGroupSetId] = useState(
    assignment?.groupSetId === undefined ? '' : String(assignment.groupSetId)
  );
  const [allowedFileTypes, setAllowedFileTypes] = useState(
    assignment?.allowedFileTypes?.join(', ') ?? 'pdf, docx'
  );
  const [maxFileCount, setMaxFileCount] = useState(String(assignment?.maxFileCount ?? 3));
  const [maxFileSizeMb, setMaxFileSizeMb] = useState(
    String(Math.round((assignment?.maxFileSizeBytes ?? 10 * 1024 * 1024) / 1024 / 1024))
  );
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [isSaving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const removePendingFile = (index: number) => {
    setPendingFiles(files => files.filter((_, fileIndex) => fileIndex !== index));
  };

  const onChooseFiles = (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    setPendingFiles(current => [...current, ...files]);
    event.target.value = '';
  };

  const buildPayload = (): CreateAssignmentPayload | null => {
    const cleanTitle = title.trim();
    if (!cleanTitle || !dueAt) {
      setError('Assignment name and due time are required.');
      return null;
    }

    const points = Number(pointsPossible);
    const fileCount = Number(maxFileCount);
    const sizeMb = Number(maxFileSizeMb);
    const parsedGroupSetId = Number(groupSetId);

    if (!Number.isFinite(points) || points < 0 || !Number.isInteger(fileCount) || fileCount < 1 || !Number.isFinite(sizeMb) || sizeMb <= 0) {
      setError('Points and file limits must be valid positive numbers.');
      return null;
    }

    if (submissionType === 'Group' && (!Number.isInteger(parsedGroupSetId) || parsedGroupSetId <= 0)) {
      setError('A group set ID is required for group assignments.');
      return null;
    }

    return {
      title: cleanTitle,
      description: description.trim(),
      pointsPossible: points,
      dueAt: toApiDateTime(dueAt),
      ...(lateUntil ? {lateUntil: toApiDateTime(lateUntil)} : {}),
      allowedFileTypes: allowedFileTypes
        .split(',')
        .map(value => value.trim().replace(/^\./, ''))
        .filter(Boolean),
      maxFileCount: fileCount,
      maxFileSizeBytes: Math.round(sizeMb * 1024 * 1024),
      submissionType,
      ...(submissionType === 'Group' ? {groupSetId: parsedGroupSetId} : {}),
    };
  };

  const persist = async (publish: boolean) => {
    const payload = buildPayload();
    if (!payload) return;

    setSaving(true);
    setError(null);

    try {
      const response = assignment
        ? await assignmentApiService.patchAssignment(courseId, assignment.id, {
          ...payload,
          ...(assignment.lateUntilLocal && !lateUntil ? {clearLateUntil: true} : {}),
        })
        : await assignmentApiService.createAssignment(courseId, payload);
      let saved = unwrapData(response, assignment ? 'patchAssignment' : 'createAssignment');

      if (pendingFiles.length > 0) {
        await assignmentApiService.uploadAttachments(courseId, saved.id, pendingFiles);
      }

      if (publish && saved.state !== 'Published') {
        saved = unwrapData(
          await assignmentApiService.publishAssignment(courseId, saved.id),
          'publishAssignment'
        );
      }

      await Promise.all([
        queryClient.invalidateQueries({queryKey: ['course-assignments', courseId]}),
        queryClient.invalidateQueries({queryKey: ['assignment', courseId, saved.id]}),
      ]);
      navigate(`/course/${courseId}/assignments/${saved.id}`);
    } catch {
      setError(
        assignment
          ? 'The assignment could not be updated. Your form values are still here.'
          : 'The assignment could not be created. Your form values are still here.'
      );
    } finally {
      setSaving(false);
    }
  };

  const submitDraft = (event: FormEvent) => {
    event.preventDefault();
    void persist(false);
  };

  return (
    <div className={styles.page}>
      <form className={styles.editor} onSubmit={submitDraft}>
        <header className={styles.header}>
          <div>
            <p className={styles.eyebrow}>{assignment ? 'Edit assignment' : 'New assignment'}</p>
            <h1>{assignment ? 'Edit Homework/Problem Set' : 'Create Homework/Problem Set'}</h1>
          </div>
          <Link
            to={assignment ? `/course/${courseId}/assignments/${assignment.id}` : `/course/${courseId}`}
            className={styles.closeButton}
            aria-label="Close assignment editor"
          >
            <X size={22}/>
          </Link>
        </header>

        <div className={styles.fieldGrid}>
          <label className={`${styles.field} ${styles.titleField}`}>
            <span>Assignment name</span>
            <input
              value={title}
              onChange={event => setTitle(event.target.value)}
              placeholder="Enter an assignment name"
              maxLength={180}
              autoFocus
            />
          </label>

          <label className={styles.field}>
            <span><CalendarClock size={16}/> Due time</span>
            <input type="datetime-local" value={dueAt} onChange={event => setDueAt(event.target.value)}/>
          </label>

          <label className={styles.field}>
            <span><CalendarClock size={16}/> Accept late work until</span>
            <input type="datetime-local" value={lateUntil} onChange={event => setLateUntil(event.target.value)}/>
          </label>

          <label className={styles.field}>
            <span><FileText size={16}/> Submission type</span>
            <select
              value={submissionType}
              onChange={event => setSubmissionType(event.target.value as AssignmentSubmissionType)}
            >
              <option value="Individual">Individual</option>
              <option value="Group">Group</option>
            </select>
          </label>

          {submissionType === 'Group' ? (
            <label className={styles.field}>
              <span><UsersRound size={16}/> Group set ID</span>
              <input
                type="number"
                min="1"
                value={groupSetId}
                onChange={event => setGroupSetId(event.target.value)}
                placeholder="Required"
              />
            </label>
          ) : null}

          <label className={styles.field}>
            <span>Points possible</span>
            <input type="number" min="0" step="0.01" value={pointsPossible} onChange={event => setPointsPossible(event.target.value)}/>
          </label>

          <label className={`${styles.field} ${styles.fullWidth}`}>
            <span>Instructions</span>
            <textarea
              value={description}
              onChange={event => setDescription(event.target.value)}
              placeholder="Write instructions for students…"
              rows={6}
            />
          </label>

          <label className={styles.field}>
            <span>Allowed file types</span>
            <input value={allowedFileTypes} onChange={event => setAllowedFileTypes(event.target.value)} placeholder="pdf, docx"/>
          </label>

          <label className={styles.field}>
            <span>Maximum files</span>
            <input type="number" min="1" value={maxFileCount} onChange={event => setMaxFileCount(event.target.value)}/>
          </label>

          <label className={styles.field}>
            <span>Maximum size per file (MB)</span>
            <input type="number" min="1" step="1" value={maxFileSizeMb} onChange={event => setMaxFileSizeMb(event.target.value)}/>
          </label>
        </div>

        <label className={styles.uploadArea}>
          <Upload size={30} aria-hidden="true"/>
          <span>Drag and drop files here or <strong>Choose files</strong> to upload</span>
          <small>Attachments are uploaded after the assignment record is saved.</small>
          <input type="file" multiple onChange={onChooseFiles}/>
        </label>

        {assignment?.attachments.length ? (
          <section className={styles.existingAttachments} aria-labelledby="current-attachments-title">
            <p id="current-attachments-title">Current attachments</p>
            <ul>
              {assignment.attachments.map(file => (
                <li key={file.id}>
                  <FileText size={18} aria-hidden="true"/>
                  <a href={file.downloadUrl} target="_blank" rel="noreferrer">{file.originalName}</a>
                  <span>{formatFileSize(file.sizeBytes)}</span>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {pendingFiles.length > 0 ? (
          <ul className={styles.pendingFiles} aria-label="Files ready to upload">
            {pendingFiles.map((file, index) => (
              <li key={`${file.name}-${file.lastModified}-${index}`}>
                <span>{file.name}</span>
                <button type="button" onClick={() => removePendingFile(index)} aria-label={`Remove ${file.name}`}>
                  <X size={16}/>
                </button>
              </li>
            ))}
          </ul>
        ) : null}

        {error ? <p className={styles.error} role="alert">{error}</p> : null}

        <footer className={styles.actions}>
          <Link
            to={assignment ? `/course/${courseId}/assignments/${assignment.id}` : `/course/${courseId}`}
            className={styles.secondaryButton}
          >
            Cancel
          </Link>
          <button type="submit" className={styles.secondaryButton} disabled={isSaving}>
            {assignment ? 'Save changes' : 'Save draft'}
          </button>
          <button type="button" className={styles.primaryButton} disabled={isSaving} onClick={() => void persist(true)}>
            {isSaving ? 'Saving…' : assignment?.state === 'Published' ? 'Save & keep published' : 'Publish'}
          </button>
        </footer>
      </form>

      <Link to={`/course/${courseId}`} className={styles.backLink}>
        <ArrowLeft size={18}/> Back to course
      </Link>
    </div>
  );
};

const AssignmentEditorPage = () => {
  const {courseId: courseParam, assignmentId: assignmentParam} = useParams();
  const courseId = parseId(courseParam);
  const assignmentId = assignmentParam ? parseId(assignmentParam) : null;
  const isEditing = Boolean(assignmentParam);

  const assignmentQuery = useQuery({
    queryKey: ['assignment', courseId, assignmentId],
    enabled: courseId !== null && assignmentId !== null,
    queryFn: async () => unwrapData(
      await assignmentApiService.getAssignment(courseId!, assignmentId!),
      'getAssignment'
    ),
  });

  if (courseId === null || (isEditing && assignmentId === null)) {
    return <div className={styles.status} role="alert">This assignment editor link is invalid.</div>;
  }

  if (isEditing && assignmentQuery.isLoading) {
    return <div className={styles.status}>Loading assignment editor…</div>;
  }

  if (isEditing && (assignmentQuery.isError || !assignmentQuery.data)) {
    return <div className={styles.status} role="alert">This assignment couldn&apos;t be opened for editing.</div>;
  }

  return (
    <AssignmentEditorForm
      key={assignmentQuery.data?.id ?? 'new'}
      courseId={courseId}
      assignment={assignmentQuery.data}
    />
  );
};

export default AssignmentEditorPage;
