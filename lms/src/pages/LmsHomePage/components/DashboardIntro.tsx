import {useRequiredAuth} from '@/contexts/RequiredAuthContext';
import {useDashboardActivities} from '@/pages/LmsHomePage/hooks/useDashboardActivities';
import {useDashboardAssignments} from '@/pages/LmsHomePage/hooks/useDashboardAssignments';
import {countTasksDueThisWeek, formatNextClass} from '@/pages/LmsHomePage/utils/dashboardSummary';
import styles from './DashboardIntro.module.scss';

const DashboardIntro = () => {
  const {user} = useRequiredAuth();
  const assignments = useDashboardAssignments();
  const activities = useDashboardActivities();
  const dueThisWeek = countTasksDueThisWeek(assignments.rows);

  const firstName = user.name?.trim().split(/\s+/)[0] || 'there';
  const taskSummary = assignments.isLoading
    ? 'Loading tasks due this week'
    : assignments.isError
      ? 'Tasks unavailable'
      : `${dueThisWeek} ${dueThisWeek === 1 ? 'task' : 'tasks'} due this week`;
  const nextClassSummary = activities.isLoading
    ? 'loading next class'
    : activities.isError
      ? 'next class unavailable'
      : activities.activities[0]
        ? `next class ${formatNextClass(activities.activities[0])}`
        : 'no upcoming class';

  return (
    <header className={styles.intro}>
      <h2>Welcome back, {firstName}</h2>
      <p>{taskSummary} · {nextClassSummary}.</p>
    </header>
  );
};

export default DashboardIntro;
