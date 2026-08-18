import {Megaphone} from 'lucide-react';
import {Link} from 'react-router-dom';
import styles from './index.module.scss';

export const AnnouncementsCard = ({courseId, canManage}: {courseId: number; canManage: boolean}) => (
  <section className={styles.card}>
    <div className={styles.cardHeader}>
      <h2 className={styles.cardTitle}>Announcements</h2>
      <Link to={`/course/${courseId}/announcements`} className={styles.addButton}>{canManage ? 'Manage announcements' : 'View all'}</Link>
    </div>
    <p className={styles.cardEmpty}><Megaphone size={17}/> Open the announcement center to read all course updates.</p>
  </section>
);
