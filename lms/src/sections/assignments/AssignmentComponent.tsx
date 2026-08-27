import {BookOpenCheck} from 'lucide-react';
import {Link} from 'react-router-dom';
import {SubmissionStatus} from '@/apis';
import DashboardEmptyState from '@/components/DashboardEmptyState/DashboardEmptyState';
import {AssignmentRow} from '@/pages/LmsHomePage/hooks/useDashboardAssignments';
import {useDashboardMoreAssignments} from '@/pages/LmsHomePage/hooks/useDashboardMoreAssignments';
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

interface AssignmentComponentProps {
  title?: string;
  limit?: number;
}

const AssignmentComponent = ({title = 'Assignments', limit = 4}: AssignmentComponentProps) => {
  const {rows, hasDueNext, isInstructor, isLoading, isError, refetch} = useDashboardMoreAssignments();
  const visibleRows = rows.slice(0, limit);
  const isEmpty = !isLoading && !isError && visibleRows.length === 0;
  const emptyState = hasDueNext
    ? {
      title: isInstructor ? 'No other upcoming deadlines' : 'No other upcoming assignments',
      description: 'Your next assignment is shown above.',
    }
    : {
      title: isInstructor ? 'No upcoming deadlines' : 'No upcoming assignments',
      description: 'New assignments will appear here.',
    };

  return (
    <div className={styles.section}>
      <div className={styles.header}>
        <h2>{title}</h2>
        {rows[0] ? (
          <Link to="/calendar" aria-label="View all assignments in Calendar">
            View all
          </Link>
        ) : null}
      </div>
      <div
        className={`${styles.list} ${isEmpty ? styles.emptyList : ''}`}
        data-dashboard-list-state={isEmpty ? 'empty' : 'populated'}
      >
        <Body
          rows={visibleRows}
          isInstructor={isInstructor}
          isLoading={isLoading}
          isError={isError}
          refetch={refetch}
          emptyState={emptyState}
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
  emptyState: {title: string; description: string};
}

const Body = ({rows, isInstructor, isLoading, isError, refetch, emptyState}: BodyProps) => {
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
    return (
      <DashboardEmptyState
        title={emptyState.title}
        description={emptyState.description}
      />
    );
  }

  return <>{rows.map(row => <AssignmentItem key={row.key} row={row} isInstructor={isInstructor}/>)}</>;
};

const AssignmentItem = ({row, isInstructor}: {row: AssignmentRow; isInstructor: boolean}) => {
  const overdue = isPastDeadline(row.atLocal, row.timezone);
  const statusLabel = isInstructor
    ? (overdue
      ? 'Past due'
      : (row.progress ? `${row.progress.submitted}/${row.progress.total} submitted` : 'Upcoming'))
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
          Due {formatDeadline(row.atLocal, row.timezone)}
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
