import {BookOpenCheck, Clock3} from 'lucide-react';
import {Link} from 'react-router-dom';
import {SubmissionStatus} from '@/apis';
import {AssignmentRow, useDashboardAssignments} from '@/pages/LmsHomePage/hooks/useDashboardAssignments';
import {formatDeadline, isPastDeadline} from '@/utils/datetime';
import styles from './AssignmentComponent.module.scss';

const STATUS_LABEL: Record<SubmissionStatus, string> = {
  Submitted: 'Submitted',
  SubmittedLate: 'Submitted late',
  NotSubmitted: 'Due soon',
  NotSubmittedClosed: 'Closed',
};

const STATUS_CLASS: Record<SubmissionStatus, string> = {
  Submitted: styles.complete,
  SubmittedLate: styles.warning,
  NotSubmitted: styles.warning,
  NotSubmittedClosed: styles.closed,
};

const studentAction = (status: SubmissionStatus): string | null => {
  if (status === 'NotSubmitted') return 'Submit';
  if (status === 'Submitted' || status === 'SubmittedLate') return 'Resubmit';
  return null;
};

const AssignmentComponent = () => {
  const {rows, isInstructor, isLoading, isError, refetch} = useDashboardAssignments();

  return (
    <div className={styles.section}>
      <div className={styles.header}>
        <h2>Assignments</h2>
        {rows[0] ? (
          <Link to={`/course/${rows[0].courseId}`} aria-label={`See all work in ${rows[0].courseCode}`}>
            View all
          </Link>
        ) : null}
      </div>
      <div className={styles.list}>
        <Body
          rows={rows.slice(0, 4)}
          isInstructor={isInstructor}
          isLoading={isLoading}
          isError={isError}
          refetch={refetch}
        />
      </div>
    </div>
  );
};

interface BodyProps {
  rows: AssignmentRow[];
  isInstructor: boolean;
  isLoading: boolean;
  isError: boolean;
  refetch: () => void;
}

const Body = ({rows, isInstructor, isLoading, isError, refetch}: BodyProps) => {
  if (isLoading) return <p className={styles.state}>Loading assignments…</p>;

  if (isError) {
    return (
      <div className={styles.state} role="alert">
        <p>Assignments couldn&apos;t be loaded.</p>
        <button type="button" onClick={refetch}>Try again</button>
      </div>
    );
  }

  if (rows.length === 0) {
    return <p className={styles.state}>{isInstructor ? 'No upcoming deadlines.' : 'Nothing due in the next 14 days.'}</p>;
  }

  return <>{rows.map(row => <AssignmentItem key={row.key} row={row} isInstructor={isInstructor}/>)}</>;
};

const AssignmentItem = ({row, isInstructor}: {row: AssignmentRow; isInstructor: boolean}) => {
  const overdue = isPastDeadline(row.atLocal, row.timezone);
  const statusLabel = isInstructor
    ? (overdue ? 'Past due' : `${row.progress?.submitted ?? 0}/${row.progress?.total ?? 0} submitted`)
    : (row.submissionStatus ? STATUS_LABEL[row.submissionStatus] : 'Upcoming');
  const statusClass = isInstructor
    ? (overdue ? styles.closed : styles.complete)
    : (row.submissionStatus ? STATUS_CLASS[row.submissionStatus] : styles.warning);
  const action = !isInstructor && row.submissionStatus ? studentAction(row.submissionStatus) : null;

  return (
    <div className={styles.item}>
      <span className={styles.icon}><BookOpenCheck aria-hidden="true"/></span>
      <span className={styles.itemCopy}>
        <Link className={styles.itemTitle} to={row.destination} aria-label={row.title}>{row.title}</Link>
        <small>
          {row.courseCode}
          <span aria-hidden="true">·</span>
          <Clock3 aria-hidden="true"/>
          {formatDeadline(row.atLocal, row.timezone)}
        </small>
      </span>
      {action ? (
        <Link
          className={`${styles.status} ${statusClass}`}
          to={row.destination}
          aria-label={`${action} ${row.title}`}
        >
          {action}
        </Link>
      ) : (
        <span className={`${styles.status} ${statusClass}`}>{statusLabel}</span>
      )}
    </div>
  );
};

export default AssignmentComponent;
