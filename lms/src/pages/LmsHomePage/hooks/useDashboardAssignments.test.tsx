import {QueryClient, QueryClientProvider} from '@tanstack/react-query';
import {renderHook, waitFor} from '@testing-library/react';
import type {PropsWithChildren} from 'react';
import {beforeEach, describe, expect, it, vi} from 'vitest';

const mocks = vi.hoisted(() => ({
  getUpcomingDeadlines: vi.fn(),
  getTeachingDeadlines: vi.fn(),
  user: {id: 8, level: 'STUDENT'},
}));

vi.mock('@/apis/services/dashboard-api', () => ({
  DASHBOARD_LIMITS: {deadlineDays: {default: 14, max: 30}},
  dashboardApiService: {
    getUpcomingDeadlines: mocks.getUpcomingDeadlines,
    getTeachingDeadlines: mocks.getTeachingDeadlines,
  },
}));

vi.mock('@/contexts/RequiredAuthContext', () => ({
  useRequiredAuth: () => ({user: mocks.user}),
}));

import {useDashboardAssignments} from './useDashboardAssignments';

const createWrapper = () => {
  const client = new QueryClient({defaultOptions: {queries: {retry: false}}});
  const Wrapper = ({children}: PropsWithChildren) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
  Wrapper.displayName = 'DashboardAssignmentsTestWrapper';
  return Wrapper;
};

describe('useDashboardAssignments', () => {
  beforeEach(() => vi.clearAllMocks());

  it('requests the 14-day API window and puts the nearest deadline first', async () => {
    mocks.getUpcomingDeadlines.mockResolvedValue({
      data: [
        {
          courseId: 4,
          courseCode: 'BIO-210',
          assignmentId: 12,
          title: 'Later assignment',
          dueAtUtc: '2026-09-04T06:59:00Z',
          dueAtLocal: '2026-09-03T23:59:00',
          timezone: 'America/Los_Angeles',
          submissionStatus: 'NotSubmitted',
        },
        {
          courseId: 4,
          courseCode: 'BIO-210',
          assignmentId: 9,
          title: 'Nearest assignment',
          dueAtUtc: '2026-08-28T06:59:00Z',
          dueAtLocal: '2026-08-27T23:59:00',
          timezone: 'America/Los_Angeles',
          submissionStatus: 'NotSubmitted',
        },
      ],
    });

    const result = renderHook(() => useDashboardAssignments(), {wrapper: createWrapper()});

    await waitFor(() => expect(result.result.current.isLoading).toBe(false));
    expect(mocks.getUpcomingDeadlines).toHaveBeenCalledWith(14);
    expect(result.result.current.rows.map(row => row.title)).toEqual([
      'Nearest assignment',
      'Later assignment',
    ]);
  });
});
