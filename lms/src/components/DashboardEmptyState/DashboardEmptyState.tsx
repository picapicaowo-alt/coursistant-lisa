import styles from './DashboardEmptyState.module.scss';

interface DashboardEmptyStateProps {
  title: string;
  description: string;
}

const DashboardEmptyState = ({title, description}: DashboardEmptyStateProps) => (
  <div className={styles.card} data-dashboard-empty-state>
    <div className={styles.copy}>
      <h3>{title}</h3>
      <p>{description}</p>
    </div>
  </div>
);

export default DashboardEmptyState;
