import {Link} from 'react-router-dom';
import styles from './index.module.scss';

export const GradesCard = ({courseId}: {courseId: number}) => (
  <section className={styles.card}>
    <div className={styles.cardHeader}>
      <h2 className={styles.cardTitle}>Grades</h2>
      <Link to={`/course/${courseId}/grades`} className={styles.addButton}>View grades</Link>
    </div>
    <p className={styles.cardEmpty}>See released assignment scores and available quiz results. No course total is calculated.</p>
  </section>
);
