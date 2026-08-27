import {CircleAlert, CircleCheck} from 'lucide-react';
import {Link} from 'react-router-dom';
import {SubmissionStatus} from '@/apis';
import {useRequiredAuth} from '@/contexts/RequiredAuthContext';
import {AssignmentRow, useDashboardAssignments} from '@/pages/LmsHomePage/hooks/useDashboardAssignments';
import {formatDeadline} from '@/utils/datetime';
import styles from './DueNextCard.module.scss';

export interface DashboardAssistantRequest {
  courseId: number;
  prompt: string;
  requestId: number;
}

interface DueNextCardProps {
  onAskAssistant: (request: DashboardAssistantRequest) => void;
}

const actionLabel = (status?: SubmissionStatus, isInstructor = false): string => {
  if (isInstructor) return 'Open';
  if (status === 'NotSubmitted') return 'Submit';
  if (status === 'Submitted' || status === 'SubmittedLate') return 'Resubmit';
  return 'View';
};

const buildAssignmentHelpPrompt = (row: AssignmentRow): string =>
  `Help me understand and plan for “${row.title}” in ${row.courseCode}.`;

const DueNextCard = ({onAskAssistant}: DueNextCardProps) => {
  const {user} = useRequiredAuth();
  const {rows, isInstructor, isLoading, isError, refetch} = useDashboardAssignments();
  const nextAssignment = rows[0];
  const firstName = user.name?.trim().split(/\s+/)[0] || 'there';

  if (isLoading) {
    return <section className={styles.statusCard} aria-label="Due next" aria-live="polite">Loading your next assignment…</section>;
  }

  if (isError) {
    return (
      <section className={styles.statusCard} aria-label="Due next" role="alert">
        <span>Your next assignment couldn&apos;t be loaded.</span>
        <button type="button" onClick={refetch}>Try again</button>
      </section>
    );
  }

  if (!nextAssignment) {
    return (
      <section className={`${styles.card} ${styles.emptyCard}`} aria-labelledby="due-next-empty-title">
        <div className={styles.copy}>
          <p className={styles.label}><CircleCheck aria-hidden="true"/>Due next</p>
          <h2 id="due-next-empty-title">Nice work, {firstName}!</h2>
          <p className={styles.emptyDescription}>Nothing is due in the next 14 days.</p>
        </div>
      </section>
    );
  }

  return (
    <section className={styles.card} aria-labelledby="due-next-title">
      <div className={styles.copy}>
        <p className={styles.label}><CircleAlert aria-hidden="true"/>Due next</p>
        <h2 id="due-next-title">{nextAssignment.title}</h2>
        <p className={styles.meta}>
          <Link to={`/course/${nextAssignment.courseId}`}>{nextAssignment.courseCode}</Link>
          <span aria-hidden="true">·</span>
          <span>Due {formatDeadline(nextAssignment.atLocal, nextAssignment.timezone)}</span>
        </p>
      </div>

      <div className={styles.actions}>
        <button
          type="button"
          className={styles.assistantAction}
          onClick={() => onAskAssistant({
            courseId: nextAssignment.courseId,
            prompt: buildAssignmentHelpPrompt(nextAssignment),
            requestId: Date.now(),
          })}
        >
          Ask AI to help
        </button>
        <Link className={styles.primaryAction} to={nextAssignment.destination}>
          {actionLabel(nextAssignment.submissionStatus, isInstructor)}
        </Link>
      </div>
    </section>
  );
};

export default DueNextCard;
