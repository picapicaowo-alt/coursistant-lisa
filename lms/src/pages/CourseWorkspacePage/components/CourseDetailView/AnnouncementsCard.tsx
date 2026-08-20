import React from 'react';
import {Link} from 'react-router-dom';
import type {CourseAnnouncementSummary} from '@/apis';
import styles from './index.module.scss';

interface AnnouncementsCardProps {
  courseId: number;
  announcements: CourseAnnouncementSummary[];
  failed: boolean;
  canManage?: boolean;
}

const formatAnnouncementDate = (postedAt: string): string => {
  const date = new Date(postedAt);
  if (Number.isNaN(date.getTime())) {
    return postedAt;
  }
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

export const AnnouncementsCard: React.FC<AnnouncementsCardProps> = ({
  courseId,
  announcements,
  failed,
  canManage = false,
}) => {
  const ordered = [...announcements].sort(
    (a, b) => new Date(b.postedAt).getTime() - new Date(a.postedAt).getTime(),
  );
  const displayed = ordered.slice(0, 3);

  return (
    <section className={styles.card}>
      <div className={styles.cardHeader}>
        <h2 className={styles.cardTitle}>Announcements</h2>
        <Link
          to={`/course/${courseId}/announcements`}
          className={styles.addButton}
        >
          {canManage ? '+ Add announcement' : 'View all'}
        </Link>
      </div>

      {failed ? (
        <p className={styles.cardEmpty} role="alert">
          Couldn&apos;t load announcements.
        </p>
      ) : ordered.length === 0 ? (
        <p className={styles.cardEmpty}>No announcements in this course yet.</p>
      ) : (
        <>
          <ul className={styles.rowList}>
            {displayed.map((item) => (
              <li key={item.id} className={styles.row}>
                <Link
                  to={`/course/${courseId}/announcements/${item.id}`}
                  className={styles.rowLink}
                >
                  <span className={styles.rowTitle}>{item.title}</span>
                  <span className={styles.rowMeta}>
                    {formatAnnouncementDate(item.postedAt)}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
          {ordered.length > 3 && (
            <div className={styles.cardFooter}>
              <Link
                to={`/course/${courseId}/announcements`}
                className={styles.viewAllLink}
              >
                View all announcements ({ordered.length}) →
              </Link>
            </div>
          )}
        </>
      )}
    </section>
  );
};
