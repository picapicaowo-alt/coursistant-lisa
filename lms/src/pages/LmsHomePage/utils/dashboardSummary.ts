import {UpcomingActivity} from '@/apis';
import {AssignmentRow} from '@/pages/LmsHomePage/hooks/useDashboardAssignments';

const DAY_IN_MS = 24 * 60 * 60 * 1000;

const dateOrdinal = (dateKey: string): number => {
  const [year, month, day] = dateKey.split('-').map(Number);
  return Date.UTC(year, month - 1, day);
};

const dateKeyInTimeZone = (date: Date, timeZone: string): string => {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date);
  const value = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find(part => part.type === type)?.value ?? '';
  return `${value('year')}-${value('month')}-${value('day')}`;
};

export const countTasksDueThisWeek = (rows: AssignmentRow[], now = new Date()): number =>
  rows.filter(row => {
    const todayKey = dateKeyInTimeZone(now, row.timezone);
    const todayOrdinal = dateOrdinal(todayKey);
    const dueOrdinal = dateOrdinal(row.atLocal.slice(0, 10));
    const todayDay = new Date(todayOrdinal).getUTCDay();
    const daysUntilSunday = (7 - todayDay) % 7;
    const daysUntilDue = Math.floor((dueOrdinal - todayOrdinal) / DAY_IN_MS);
    return daysUntilDue >= 0 && daysUntilDue <= daysUntilSunday;
  }).length;

export const formatNextClass = (activity: UpcomingActivity): string => {
  const weekday = new Intl.DateTimeFormat('en-US', {
    weekday: 'short',
    timeZone: 'UTC',
  }).format(new Date(dateOrdinal(activity.date)));
  return `${weekday} ${activity.startTime.slice(0, 5)}`;
};
