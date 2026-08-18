import {useState} from 'react';
import {Link, useParams} from 'react-router-dom';
import {useQuery} from '@tanstack/react-query';
import {ArrowLeft, CalendarClock, UsersRound} from 'lucide-react';
import {assignmentApiService} from '@/apis/services/assignment-api';
import {unwrapData} from '@/apis';
import {useAuth} from '@/contexts/AuthContext';
import {formatDeadline} from '@/utils/datetime';
import {SubmitAssignmentDialog} from './SubmitAssignmentDialog';
import styles from './index.module.scss';

const parseId = (value?: string) => {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
};

const AssignmentDetailPage = () => {
  const {courseId: courseIdParam, assignmentId: assignmentIdParam} = useParams();
  const {user} = useAuth();
  const [isSubmitDialogOpen, setSubmitDialogOpen] = useState(false);
  const courseId = parseId(courseIdParam);
  const assignmentId = parseId(assignmentIdParam);

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
  const isStudent = assignmentQuery.data ? !isStaff : user?.level === 'STUDENT';

  const submissionQuery = useQuery({
    queryKey: ['assignment-submission', courseId, assignmentId],
    enabled: assignmentQuery.isSuccess && isStudent && courseId !== null && assignmentId !== null,
    queryFn: async () => unwrapData(
      await assignmentApiService.getMySubmission(courseId!, assignmentId!),
      'getMySubmission'
    ),
  });

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
        {isStaff ? (
          <div className={styles.headerActions}>
            <Link to={`/course/${courseId}/assignments/${assignmentId}/edit`} className={styles.secondaryLink}>
              Edit
            </Link>
            <Link to={`/course/${courseId}/assignments/${assignmentId}/grading`} className={styles.primaryLink}>
              Grade submissions
            </Link>
          </div>
        ) : null}
      </header>

      <div className={styles.layout}>
        <main className={styles.mainColumn}>
          <section className={styles.card}>
            <h2>Assignment details</h2>
            <p className={styles.description}>
              {assignment.description || 'No instructions were provided for this assignment.'}
            </p>

            {assignment.attachments?.length > 0 && (
              <div className={styles.attachments}>
                <h3>Instructor files</h3>
                {assignment.attachments.map(attachment => (
                  <a key={attachment.id} href={attachment.downloadUrl} className={styles.attachmentLink}>
                    <img src="/icons/assignments/document-download.svg" alt="" width={24} height={24}/>
                    <span>{attachment.originalName}</span>
                  </a>
                ))}
              </div>
            )}
          </section>

          {isStudent && (
            <section className={styles.card}>
              <div className={styles.cardHeader}>
                <div>
                  <h2>Your submission</h2>
                  <p className={styles.secondaryText}>
                    {submissionQuery.data?.submissionStatus ?? 'Not submitted'}
                  </p>
                </div>
                <button
                  type="button"
                  className={styles.primaryButton}
                  onClick={() => setSubmitDialogOpen(true)}
                  disabled={!submissionQuery.data?.acceptingSubmissions}
                >
                  {submissionQuery.data?.totalVersions ? 'Submit new version' : 'Submit assignment'}
                </button>
              </div>

              {submissionQuery.isError && (
                <p className={styles.error} role="alert">
                  Submission status is temporarily unavailable. Try again when the 8081 API is online.
                </p>
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
