import {useRef, useState} from 'react';
import {Link, useNavigate, useParams} from 'react-router-dom';
import {useMutation, useQuery, useQueryClient} from '@tanstack/react-query';
import {ArrowLeft, CalendarClock, Download, Eye, FileText, RotateCcw, Trash2, Upload, UsersRound} from 'lucide-react';
import {assignmentApiService} from '@/apis/services/assignment-api';
import type {ApiError, AssignmentAttachment} from '@/apis';
import {unwrapData} from '@/apis';
import {useAuth} from '@/contexts/AuthContext';
import {useCourseAccess} from '@/hooks/useCourseAccess';
import {RichTextEditor} from '@/components/RichTextEditor';
import {formatDeadline} from '@/utils/datetime';
import {isPreviewableFile, openPreviewWindow, saveBlob, showBlobInPreviewWindow} from '@/utils/downloadBlob';
import {SubmitAssignmentDialog} from './SubmitAssignmentDialog';
import {
  buildEmptySubmissionState,
  formatSubmissionStatus,
  isNoFormalSubmissionError,
} from './submissionState';
import styles from './index.module.scss';

const parseId = (value?: string) => {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
};

const apiErrorCode = (error: unknown) => {
  const details = (error as ApiError | undefined)?.details;
  return details && typeof details === 'object' && typeof details.code === 'string'
    ? details.code
    : undefined;
};

export const uploadRubricWithReplaceConfirmation = async (
  courseId: number,
  assignmentId: number,
  file: File,
  alreadyConfirmed: boolean,
) => {
  try {
    return await assignmentApiService.uploadRubric(
      courseId, assignmentId, file, alreadyConfirmed,
    );
  } catch (error) {
    // The rubric summary only reports grades tied to an older version. A
    // grade can therefore be created after the summary was fetched (or be
    // tied to the current version) and the server becomes the authoritative
    // source for whether replacing the rubric needs explicit confirmation.
    if (
      !alreadyConfirmed
      && apiErrorCode(error) === 'RUBRIC_REPLACE_CONFIRM_REQUIRED'
      && window.confirm('At least one grade already references this rubric. Replace the rubric anyway? Existing grades will be preserved.')
    ) {
      return assignmentApiService.uploadRubric(
        courseId, assignmentId, file, true,
      );
    }
    throw error;
  }
};

export const InstructorAttachmentRow = ({courseId, assignmentId, attachment}: {
  courseId: number;
  assignmentId: number;
  attachment: AssignmentAttachment;
}) => {
  const [activeAction, setActiveAction] = useState<'preview' | 'download' | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const previewable = attachment.previewAvailable
    ?? isPreviewableFile(attachment.originalName, attachment.contentType);

  const download = async () => {
    setActiveAction('download');
    setFileError(null);
    try {
      const blob = await assignmentApiService.downloadAttachment(courseId, assignmentId, attachment.id);
      saveBlob(blob, attachment.originalName);
    } catch {
      setFileError(`Could not download ${attachment.originalName}.`);
    } finally {
      setActiveAction(null);
    }
  };

  const preview = async () => {
    const previewWindow = openPreviewWindow();
    if (!previewWindow) {
      setFileError('Allow pop-ups to preview this file.');
      return;
    }

    setActiveAction('preview');
    setFileError(null);
    try {
      const blob = await assignmentApiService.previewAttachment(courseId, assignmentId, attachment.id);
      showBlobInPreviewWindow(previewWindow, blob);
    } catch {
      previewWindow.close();
      setFileError(`Could not preview ${attachment.originalName}.`);
    } finally {
      setActiveAction(null);
    }
  };

  return (
    <li className={styles.attachmentRow}>
      <FileText size={22} aria-hidden="true"/>
      <button
        type="button"
        className={styles.attachmentName}
        title={`Download ${attachment.originalName}`}
        aria-label={`Download ${attachment.originalName}`}
        onClick={() => void download()}
        disabled={activeAction !== null}
      >
        {attachment.originalName}
      </button>
      <div className={styles.attachmentActions}>
        {previewable ? (
          <button type="button" onClick={() => void preview()} disabled={activeAction !== null}>
            <Eye size={15}/>{activeAction === 'preview' ? 'Opening…' : 'Preview'}
          </button>
        ) : null}
        <button type="button" onClick={() => void download()} disabled={activeAction !== null}>
          <Download size={15}/>{activeAction === 'download' ? 'Downloading…' : 'Download'}
        </button>
      </div>
      {fileError ? <p className={styles.attachmentError} role="alert">{fileError}</p> : null}
    </li>
  );
};

const AssignmentDetailPage = () => {
  const {courseId: courseIdParam, assignmentId: assignmentIdParam} = useParams();
  const {user} = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const rubricInputRef = useRef<HTMLInputElement>(null);
  const [isSubmitDialogOpen, setSubmitDialogOpen] = useState(false);
  const [staffMessage, setStaffMessage] = useState<string | null>(null);
  const courseId = parseId(courseIdParam);
  const assignmentId = parseId(assignmentIdParam);
  const access = useCourseAccess(courseId);

  const assignmentQuery = useQuery({
    queryKey: ['assignment', courseId, assignmentId],
    enabled: courseId !== null && assignmentId !== null,
    queryFn: async () => unwrapData(
      await assignmentApiService.getAssignment(courseId!, assignmentId!),
      'getAssignment'
    ),
  });

  const isStaff = assignmentQuery.data?.activeStudentCount !== undefined
    || assignmentQuery.data?.canEditStructure !== undefined;
  const isStudent = access.membership
    ? access.isStudent
    : assignmentQuery.data
      ? !isStaff
      : user?.level === 'STUDENT';

  const submissionQuery = useQuery({
    queryKey: ['assignment-submission', courseId, assignmentId],
    enabled: assignmentQuery.isSuccess && isStudent && courseId !== null && assignmentId !== null,
    queryFn: async () => {
      try {
        return unwrapData(
          await assignmentApiService.getMySubmission(courseId!, assignmentId!),
          'getMySubmission'
        );
      } catch (error) {
        const assignment = assignmentQuery.data;
        if (!isNoFormalSubmissionError(error) || !assignment || !user) throw error;

        // 8081 models “never submitted” as a 404. Preserve any staged files,
        // then turn it into the empty state the student screen expects.
        const stagingFiles = assignment.stagedFileCount
          ? unwrapData(
            await assignmentApiService.listStagingFiles(courseId!, assignmentId!),
            'listStagingFiles'
          )
          : [];

        return buildEmptySubmissionState(assignment, user.id, stagingFiles);
      }
    },
  });

  const rubricQuery = useQuery({
    queryKey: ['assignment-rubric', courseId, assignmentId],
    enabled: assignmentQuery.isSuccess && courseId !== null && assignmentId !== null,
    queryFn: async () => unwrapData(await assignmentApiService.getRubric(courseId!, assignmentId!), 'getRubric'),
  });

  const unpublish = useMutation({
    mutationFn: () => assignmentApiService.unpublishAssignment(courseId!, assignmentId!),
    onSuccess: async () => { await assignmentQuery.refetch(); setStaffMessage('Assignment unpublished.'); },
    onError: () => setStaffMessage('The assignment could not be unpublished.'),
  });

  const removeAssignment = useMutation({
    mutationFn: () => assignmentApiService.deleteAssignment(courseId!, assignmentId!),
    onSuccess: async () => {
      await queryClient.invalidateQueries({queryKey: ['course-assignments', courseId]});
      navigate(`/course/${courseId}`, {replace: true});
    },
    onError: () => setStaffMessage('The assignment could not be deleted. It may already have submissions or grades.'),
  });

  const uploadRubric = useMutation({
    mutationFn: (file: File) => uploadRubricWithReplaceConfirmation(
      courseId!, assignmentId!, file,
      Boolean(rubricQuery.data?.gradedAgainstPreviousRubricCount),
    ),
    onSuccess: async () => { await rubricQuery.refetch(); setStaffMessage('Rubric uploaded.'); },
    onError: () => setStaffMessage('The rubric could not be uploaded.'),
  });

  const restoreRubric = useMutation({
    mutationFn: () => assignmentApiService.restorePreviousRubric(
      courseId!, assignmentId!, Boolean(rubricQuery.data?.gradedAgainstPreviousRubricCount),
    ),
    onSuccess: async () => { await rubricQuery.refetch(); setStaffMessage('Previous rubric restored.'); },
    onError: () => setStaffMessage('The previous rubric could not be restored.'),
  });

  const downloadRubric = async () => {
    if (!rubricQuery.data?.posted) return;
    setStaffMessage(null);
    try {
      saveBlob(await assignmentApiService.downloadRubric(courseId!, assignmentId!), rubricQuery.data.originalName || 'rubric.pdf');
    } catch {
      setStaffMessage('The rubric could not be downloaded.');
    }
  };

  const previewRubric = async () => {
    if (!rubricQuery.data?.posted) return;
    const previewWindow = openPreviewWindow();
    if (!previewWindow) {
      setStaffMessage('Allow pop-ups to preview the rubric.');
      return;
    }
    setStaffMessage(null);
    try {
      showBlobInPreviewWindow(
        previewWindow,
        await assignmentApiService.previewRubric(courseId!, assignmentId!),
      );
    } catch {
      previewWindow.close();
      setStaffMessage('The rubric could not be previewed.');
    }
  };

  if (courseId === null || assignmentId === null) {
    return <div className={styles.status} role="alert">This assignment link is invalid.</div>;
  }

  if (assignmentQuery.isLoading) {
    return <div className={styles.status}>Loading assignment…</div>;
  }

  if (assignmentQuery.isError || !assignmentQuery.data) {
    return (
      <div className={styles.status} role="alert">
        <p>This assignment couldn&apos;t be loaded.</p>
        <button type="button" className={styles.primaryButton} onClick={() => void assignmentQuery.refetch()}>
          Try again
        </button>
      </div>
    );
  }

  const assignment = assignmentQuery.data;
  const deadline = formatDeadline(assignment.dueAtLocal, assignment.timezone);

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <Link to={`/course/${courseId}`} className={styles.backLink} aria-label="Back to course">
          <ArrowLeft size={20}/>
        </Link>
        <div className={styles.headerText}>
          <div className={styles.eyebrow}>
            <span className={styles.stateBadge}>{assignment.state}</span>
            <span>{assignment.submissionType} assignment</span>
          </div>
          <h1>{assignment.title}</h1>
        </div>
        {access.canConfigureAssignments || access.canGrade ? (
          <div className={styles.headerActions}>
            {access.canConfigureAssignments ? (
              <Link to={`/course/${courseId}/assignments/${assignmentId}/edit`} className={styles.secondaryLink}>
                Edit
              </Link>
            ) : null}
            {access.canConfigureAssignments && assignment.state === 'Published' ? (
              <button type="button" className={styles.secondaryLink} onClick={() => {
                if (window.confirm('Unpublish this assignment? Students will no longer see it.')) unpublish.mutate();
              }} disabled={unpublish.isPending}>Unpublish</button>
            ) : null}
            {access.canGrade ? (
              <Link to={`/course/${courseId}/assignments/${assignmentId}/grading`} className={styles.primaryLink}>
                Grade submissions
              </Link>
            ) : null}
          </div>
        ) : null}
      </header>

      {staffMessage ? <p className={staffMessage.includes('could not') ? styles.errorBanner : styles.successBanner} role="status">{staffMessage}</p> : null}

      <div className={styles.layout}>
        <main className={styles.mainColumn}>
          <section className={styles.card}>
            <h2>Assignment details</h2>
            <div className={styles.description}>
              <RichTextEditor
                content={assignment.description || 'No instructions were provided for this assignment.'}
                disabled
                displayOnly
                showToolbar={false}
                ariaLabel="Assignment instructions"
              />
            </div>

            {assignment.attachments?.length > 0 && (
              <div className={styles.attachments}>
                <h3>Instructor files</h3>
                <ul>
                  {assignment.attachments.map(attachment => (
                    <InstructorAttachmentRow
                      key={attachment.id}
                      courseId={courseId}
                      assignmentId={assignmentId}
                      attachment={attachment}
                    />
                  ))}
                </ul>
              </div>
            )}
          </section>

          <section className={styles.card}>
            <div className={styles.cardHeader}>
              <div><h2>Rubric</h2><p className={styles.secondaryText}>{rubricQuery.data?.posted ? `Version ${rubricQuery.data.versionNo} · ${rubricQuery.data.totalVersions} total` : 'No rubric uploaded'}</p></div>
              {access.canConfigureAssignments ? <button type="button" className={styles.secondaryLink} onClick={() => rubricInputRef.current?.click()} disabled={uploadRubric.isPending}><Upload size={15}/>{uploadRubric.isPending ? 'Uploading…' : rubricQuery.data?.posted ? 'Replace PDF' : 'Upload PDF'}</button> : null}
            </div>
            <input ref={rubricInputRef} className={styles.hiddenInput} type="file" accept="application/pdf,.pdf" onChange={event => {
              const file = event.target.files?.[0];
              if (file && (!rubricQuery.data?.gradedAgainstPreviousRubricCount || window.confirm(`${rubricQuery.data.gradedAgainstPreviousRubricCount} grade(s) reference the current rubric. Replace it anyway?`))) uploadRubric.mutate(file);
              event.target.value = '';
            }}/>
            {rubricQuery.isPending ? <p className={styles.secondaryText}>Loading rubric…</p> : rubricQuery.isError ? <p className={styles.errorBanner}>Rubric information could not be loaded.</p> : rubricQuery.data?.posted ? <div className={styles.rubricRow}><FileText size={20}/><button type="button" onClick={() => void previewRubric()}>{rubricQuery.data.originalName}</button><span>{rubricQuery.data.sizeBytes ? `${Math.max(1, Math.round(rubricQuery.data.sizeBytes / 1024))} KB` : ''}</span><button type="button" className={styles.secondaryLink} onClick={() => void previewRubric()}><Eye size={15}/>Preview</button><button type="button" className={styles.secondaryLink} onClick={() => void downloadRubric()}><Download size={15}/>Download</button>{access.canConfigureAssignments && rubricQuery.data.canRestorePrevious ? <button type="button" className={styles.secondaryLink} disabled={restoreRubric.isPending} onClick={() => {
              if (window.confirm('Restore the previous rubric version?')) restoreRubric.mutate();
            }}><RotateCcw size={15}/>Restore previous</button> : null}</div> : <p className={styles.secondaryText}>Upload a PDF rubric to keep grading criteria with this assignment.</p>}
          </section>

          {isStudent && (
            <section className={styles.card}>
              <div className={styles.cardHeader}>
                <div>
                  <h2>Your submission</h2>
                  <p className={styles.secondaryText}>
                    {formatSubmissionStatus(submissionQuery.data?.submissionStatus)}
                  </p>
                </div>
                <button
                  type="button"
                  className={styles.primaryButton}
                  onClick={() => setSubmitDialogOpen(true)}
                  disabled={submissionQuery.isPending || !submissionQuery.data?.acceptingSubmissions}
                >
                  {submissionQuery.data?.totalVersions ? 'Submit new version' : 'Submit assignment'}
                </button>
              </div>

              {submissionQuery.isError && (
                <div className={styles.error} role="alert">
                  <span>Submission details couldn&apos;t be loaded.</span>{' '}
                  <button type="button" onClick={() => void submissionQuery.refetch()}>Try again</button>
                </div>
              )}

              {submissionQuery.data?.currentVersion && (
                <div className={styles.versionSummary}>
                  <strong>Version {submissionQuery.data.currentVersion.versionNo}</strong>
                  <span>{submissionQuery.data.currentVersion.fileCount} file(s)</span>
                </div>
              )}
            </section>
          )}
        </main>

        <aside className={styles.summaryCard}>
          <h2>Summary</h2>
          <div className={styles.summaryRow}>
            <CalendarClock size={20}/>
            <div>
              <span>Due</span>
              <strong>{deadline}</strong>
            </div>
          </div>
          <div className={styles.summaryRow}>
            <UsersRound size={20}/>
            <div>
              <span>Submission type</span>
              <strong>{assignment.submissionType}</strong>
            </div>
          </div>
          <div className={styles.summaryRow}>
            <span className={styles.pointsIcon}>#</span>
            <div>
              <span>Points</span>
              <strong>{assignment.pointsPossible ?? 'Not set'}</strong>
            </div>
          </div>

          {!isStudent && (
            <div className={styles.staffMetrics}>
              <span>{assignment.submissionCount ?? 0} submitted</span>
              <span>{assignment.gradedCount ?? 0} graded</span>
              <span>{assignment.releasedCount ?? 0} released</span>
            </div>
          )}
          {access.canConfigureAssignments ? <div className={styles.dangerZone}><button type="button" className={styles.dangerButton} disabled={removeAssignment.isPending} onClick={() => {
            if (window.confirm(`Permanently delete “${assignment.title}”? This only succeeds when no protected submission or grade data depends on it.`)) removeAssignment.mutate();
          }}><Trash2 size={16}/>{removeAssignment.isPending ? 'Deleting…' : 'Delete assignment'}</button></div> : null}
        </aside>
      </div>

      {isSubmitDialogOpen && submissionQuery.data && (
        <SubmitAssignmentDialog
          assignment={assignment}
          courseId={courseId}
          submission={submissionQuery.data}
          onClose={() => setSubmitDialogOpen(false)}
          onStaged={async () => {
            await submissionQuery.refetch();
          }}
          onSubmitted={async () => {
            await Promise.all([assignmentQuery.refetch(), submissionQuery.refetch()]);
          }}
        />
      )}
    </div>
  );
};

export default AssignmentDetailPage;
