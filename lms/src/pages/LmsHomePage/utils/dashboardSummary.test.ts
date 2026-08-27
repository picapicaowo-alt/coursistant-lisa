import {describe, expect, it} from 'vitest';
import {UpcomingActivity} from '@/apis';
import {AssignmentRow} from '@/pages/LmsHomePage/hooks/useDashboardAssignments';
import {countTasksDueThisWeek, formatNextClass} from './dashboardSummary';

const assignment = (atLocal: string): AssignmentRow => ({
  key: atLocal,
  courseId: 1,
  courseCode: 'BIO-210',
  title: 'Lab report',
  atLocal,
  timezone: 'America/Los_Angeles',
  assignmentId: 10,
  destination: '/course/1/assignments/10',
});

describe('dashboard summary', () => {
  it('counts only deadlines remaining in the tenant calendar week', () => {
    const now = new Date('2026-08-26T19:00:00Z');
    expect(countTasksDueThisWeek([
      assignment('2026-08-27T23:59:00'),
      assignment('2026-08-30T23:59:00'),
      assignment('2026-09-01T23:59:00'),
    ], now)).toBe(2);
  });

  it('formats the tenant-local class day and time without timezone drift', () => {
    const activity = {
      date: '2026-08-27',
      startTime: '10:00:00',
    } as UpcomingActivity;
    expect(formatNextClass(activity)).toBe('Thu 10:00');
  });
});
