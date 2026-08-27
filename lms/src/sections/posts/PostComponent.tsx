import {Megaphone} from 'lucide-react';
import {Link} from 'react-router-dom';
import {useQuery} from '@tanstack/react-query';
import {RecentAnnouncement} from '@/apis';
import {dashboardApiService} from '@/apis/services/dashboard-api';
import DashboardEmptyState from '@/components/DashboardEmptyState/DashboardEmptyState';
import {useRequiredAuth} from '@/contexts/RequiredAuthContext';
import {formatAnnouncementRelativeTime} from './announcementTime';
import styles from './PostComponent.module.scss';

interface PostComponentProps {
  limit?: number;
}

const PostComponent = ({limit = 4}: PostComponentProps) => {
  const {user} = useRequiredAuth();
  const query = useQuery({
    queryKey: ['dashboard', 'announcements', user.id],
    queryFn: async (): Promise<RecentAnnouncement[]> => {
      const response = await dashboardApiService.getRecentAnnouncements();
      if (!response.data) throw new Error('Malformed response from /v2/me/announcements/recent');
      return response.data;
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
    retry: 2,
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  const announcements = query.data ?? [];
  const firstCourseId = announcements[0]?.courseId;
  const hasUnreadAnnouncements = announcements.some(announcement => announcement.unread);
  const isEmpty = !query.isPending && !query.isError
    && (announcements.length === 0 || !hasUnreadAnnouncements);
  const emptyState = announcements.length === 0
    ? {title: 'No announcements yet', description: 'Course updates will appear here.'}
    : {title: 'No new announcements', description: 'You’re up to date.'};
  const visibleAnnouncements = [...announcements]
    .sort((a, b) => Number(b.unread) - Number(a.unread))
    .slice(0, limit);

  return (
    <div className={styles.section}>
      <div className={styles.header}>
        <h2>Announcements</h2>
        {firstCourseId ? <Link to={`/course/${firstCourseId}/announcements`}>View all</Link> : null}
      </div>
      <div
        className={`${styles.list} ${isEmpty ? styles.emptyList : ''}`}
        data-dashboard-list-state={isEmpty ? 'empty' : 'populated'}
      >
        {query.isPending ? <p className={styles.state}>Loading announcements…</p> : null}

        {query.isError ? (
          <div className={styles.state} role="alert">
            <p>Announcements couldn&apos;t be loaded.</p>
            <button type="button" onClick={() => void query.refetch()}>Try again</button>
          </div>
        ) : null}

        {isEmpty
          ? <DashboardEmptyState title={emptyState.title} description={emptyState.description}/>
          : null}

        {!query.isError && hasUnreadAnnouncements && visibleAnnouncements.map(announcement => (
          <Link
            className={styles.item}
            key={`${announcement.courseId}-${announcement.id}`}
            to={`/course/${announcement.courseId}/announcements/${announcement.id}`}
            aria-label={`Open announcement: ${announcement.title}${announcement.unread ? ', New' : ''}`}
          >
            <span className={styles.icon}><Megaphone aria-hidden="true"/></span>
            <span className={styles.itemCopy}>
              <strong>{announcement.title}</strong>
              <small>{announcement.courseCode} · {formatAnnouncementRelativeTime(announcement.postedAt)}</small>
            </span>
            {announcement.unread ? <span className={styles.unread}><span className={styles.srOnly}>New</span></span> : null}
          </Link>
        ))}
      </div>
    </div>
  );
};

export default PostComponent;
