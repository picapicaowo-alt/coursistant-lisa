import type {NotificationItem, NotificationType} from '@/apis';

const NOTIFICATION_TITLES: Record<NotificationType, string> = {
  ANNOUNCEMENT_POSTED: 'New announcement',
  ASSIGNMENT_PUBLISHED: 'Assignment published',
  ASSIGNMENT_SUBMISSION_RECEIVED: 'Submission received',
  ASSIGNMENT_GRADE_RELEASED: 'Grade released',
  QUIZ_GRADE_RELEASED: 'Quiz grade released',
  ASSIGNMENT_GRADE_CORRECTED: 'Assignment grade updated',
  QUIZ_GRADE_CORRECTED: 'Quiz grade updated',
  WEEK_PUBLISHED: 'Course week published',
  ASSIGNMENT_SCHEDULE_CHANGED: 'Assignment schedule changed',
  QUIZ_PUBLISHED: 'Quiz published',
  QUIZ_SCHEDULE_CHANGED: 'Quiz schedule changed',
  QUIZ_TIME_LIMIT_CHANGED: 'Quiz time limit changed',
  COURSE_EVENT_CREATED: 'New course event',
  GROUP_MEMBER_ADDED: 'Group member added',
  GROUP_MEMBER_REMOVED: 'Group member removed',
  GROUP_MEMBER_MOVED: 'Group membership updated',
};

export const getNotificationTitle = (type: NotificationType) => NOTIFICATION_TITLES[type];

/**
 * Resolves backend deep links against routes that exist in this frontend.
 *
 * The notification contract currently uses plural `/courses/...` examples,
 * while the application route is singular `/course/...`. Unknown subject
 * routes fall back to the owning course instead of opening a broken page. An
 * absolute or protocol-relative value is never followed.
 */
export const resolveNotificationPath = (
  notification: Pick<NotificationItem, 'availability' | 'courseId' | 'deepLink'>
): string | null => {
  if (notification.availability !== 'AVAILABLE') return null;

  const deepLink = notification.deepLink?.trim();
  if (deepLink?.startsWith('/') && !deepLink.startsWith('//')) {
    const pluralAssignment = deepLink.match(/^\/courses\/(\d+)\/assignments\/(\d+)\/?$/);
    if (pluralAssignment) {
      return `/course/${pluralAssignment[1]}/assignments/${pluralAssignment[2]}`;
    }

    if (/^\/course\/\d+(?:\/assignments\/\d+)?\/?$/.test(deepLink)) {
      return deepLink.replace(/\/$/, '');
    }

    const pluralCourse = deepLink.match(/^\/courses\/(\d+)(?:\/.*)?$/);
    if (pluralCourse) return `/course/${pluralCourse[1]}`;
  }

  return notification.courseId ? `/course/${notification.courseId}` : null;
};

export const formatNotificationTime = (value: string): string => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(date);
};
