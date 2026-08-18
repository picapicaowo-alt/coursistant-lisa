import {useEffect, useMemo, useRef, useState} from 'react';
import {FileSection} from '@/components/FileSection';
import {assignmentApiService} from '@/apis/services/assignment-api';
import {unwrapData} from '@/apis';
import type {AssignmentDetail, SubmissionState} from '@/apis';
import type {FileView} from '@/types';
import styles from './SubmitAssignmentDialog.module.scss';

interface SubmitAssignmentDialogProps {
  assignment: AssignmentDetail;
  courseId: number;
  submission: SubmissionState;
  onClose: () => void;
  onStaged: () => Promise<void>;
  onSubmitted: () => Promise<void>;
}

const toAcceptValue = (allowedFileTypes?: string[]) => {
  if (!allowedFileTypes?.length) return undefined;
  return allowedFileTypes.map(type => type.startsWith('.') ? type : `.${type}`).join(',');
};

export const SubmitAssignmentDialog = ({
  assignment,
  courseId,
  submission,
  onClose,
  onStaged,
  onSubmitted,
}: SubmitAssignmentDialogProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const idempotencyKeyRef = useRef(crypto.randomUUID());

  const stagedFiles = useMemo<FileView[]>(() => (
    submission.stagingFiles.map(file => ({
      id: file.id,
      filename: file.originalName,
      mimeType: file.contentType,
      fileSize: file.sizeBytes,
      updatedAt: file.createdAt,
      uploadStatus: 'success',
      uploadProgress: 100,
    }))
  ), [submission.stagingFiles]);

  const accept = toAcceptValue(assignment.allowedFileTypes);
  const instructorAttachment = assignment.attachments?.[0];

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !isSubmitting) onClose();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isSubmitting, onClose]);

  const uploadFile = async (file: File, signal: AbortSignal): Promise<string> => {
    setSubmitError(null);
    const response = await assignmentApiService.uploadStagingFiles(
      courseId,
      assignment.id,
      [file],
      signal
    );
    const uploaded = unwrapData(response, 'uploadStagingFiles');
    const staged = uploaded.find(item => item.originalName === file.name) ?? uploaded[0];

    if (!staged) throw new Error('The API did not return the staged file.');
    return String(staged.id);
  };

  const submit = async () => {
    if (submission.stagingFiles.length === 0) {
      setSubmitError('Choose at least one file before submitting.');
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      await assignmentApiService.submitStagedFiles(
        courseId,
        assignment.id,
        {stagingFileIds: submission.stagingFiles.map(file => file.id)},
        idempotencyKeyRef.current
      );
      await onSubmitted();
      onClose();
    } catch {
      setSubmitError('Your assignment could not be submitted. Your staged files are still available.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className={styles.backdrop}
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !isSubmitting) onClose();
      }}
    >
      <section
        className={styles.dialog}
        role="dialog"
        aria-modal="true"
        aria-labelledby="submit-assignment-title"
      >
        <h2 id="submit-assignment-title" className={styles.title}>Submit Assignment</h2>
        <p className={styles.subtitle}>Upload your responses, then submit them as a new version.</p>

        {instructorAttachment && (
          <div className={styles.instructorFile}>
            <p>Your instructor provided a file to help you complete this assignment.</p>
            <a href={instructorAttachment.downloadUrl} className={styles.downloadLink}>
              <img
                src="/icons/assignments/document-download.svg"
                alt=""
                width={24}
                height={24}
              />
              <span>Download {instructorAttachment.originalName}</span>
            </a>
          </div>
        )}

        <FileSection
          files={stagedFiles}
          accept={accept}
          uploadFunction={uploadFile}
          onUploaded={() => void onStaged()}
        />

        <p className={styles.fileHint}>
          {assignment.allowedFileTypes?.length
            ? `Supported file types: ${assignment.allowedFileTypes.join(', ')}`
            : 'Use one of the file types allowed by your instructor.'}
        </p>

        {submitError && <p className={styles.error} role="alert">{submitError}</p>}

        <div className={styles.actions}>
          <button type="button" className={styles.cancel} onClick={onClose} disabled={isSubmitting}>
            Cancel
          </button>
          <button
            type="button"
            className={styles.submit}
            onClick={() => void submit()}
            disabled={isSubmitting || !submission.acceptingSubmissions}
          >
            {isSubmitting ? 'Submitting…' : 'Submit files'}
          </button>
        </div>
      </section>
    </div>
  );
};
