import {QueryClient, QueryClientProvider} from '@tanstack/react-query';
import {renderHook, waitFor} from '@testing-library/react';
import type {PropsWithChildren} from 'react';
import {beforeEach, describe, expect, it, vi} from 'vitest';

const mocks = vi.hoisted(() => ({
  getCourseAssignmentSummaries: vi.fn(),
  courseRefetch: vi.fn(),
  dueRefetch: vi.fn(),
}));

vi.mock('@/apis/services/assignment-api', () => ({
  assignmentApiService: {
    getCourseAssignmentSummaries: mocks.getCourseAssignmentSummaries,
  },
}));

vi.mock('@/contexts/RequiredAuthContext', () => ({
  useRequiredAuth: () => ({user: {id: 8, level: 'STUDENT'}}),
}));

vi.mock('@/hooks/useCourseAccess', () => ({
  useMyCourses: () => ({
    data: [{
      id: 4,
      courseId: 4,
      courseCode: 'BIO-210',
      state: 'Active',
      status: 'Active',
    }],
    isPending: false,
    isSuccess: true,
    isError: false,
    refetch: mocks.courseRefetch,
  }),
}));

vi.mock('./useDashboardAssignments', () => ({
  useDashboardAssignments: () => ({
    rows: [{courseId: 4, assignmentId: 9}],
    isLoading: false,
    isError: false,
    refetch: mocks.dueRefetch,
  }),
}));

import {useDashboardMoreAssignments} from './useDashboardMoreAssignments';

const createWrapper = () => {
  const client = new QueryClient({defaultOptions: {queries: {retry: false}}});
  const Wrapper = ({children}: PropsWithChildren) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
  Wrapper.displayName = 'DashboardMoreAssignmentsTestWrapper';
  return Wrapper;
};

describe('useDashboardMoreAssignments', () => {
  beforeEach(() => vi.clearAllMocks());

  it('loads every future course assignment and excludes the item already shown in Due Next', async () => {
    mocks.getCourseAssignmentSummaries.mockResolvedValue({
      data: [
        {
          id: 10,
          title: 'Assignment beyond the dashboard window',
          dueAtUtc: '2099-12-01T08:00:00Z',
          dueAtLocal: '2099-12-01T00:00:00',
          timezone: 'America/Los_Angeles',
          submissionType: 'Individual',
          submissionStatus: 'NotSubmitted',
        },
        {
          id: 9,
          title: 'Already shown above',
          dueAtUtc: '2099-01-01T08:00:00Z',
          dueAtLocal: '2099-01-01T00:00:00',
          timezone: 'America/Los_Angeles',
          submissionType: 'Individual',
          submissionStatus: 'NotSubmitted',
        },
        {
          id: 11,
          title: 'Earlier future assignment',
          dueAtUtc: '2099-06-01T08:00:00Z',
          dueAtLocal: '2099-06-01T00:00:00',
          timezone: 'America/Los_Angeles',
          submissionType: 'Individual',
          submissionStatus: 'NotSubmitted',
        },
        {
          id: 7,
          title: 'Past assignment',
          dueAtUtc: '2000-01-01T08:00:00Z',
          dueAtLocal: '2000-01-01T00:00:00',
          timezone: 'America/Los_Angeles',
          submissionType: 'Individual',
          submissionStatus: 'Submitted',
        },
      ],
    });

    const result = renderHook(() => useDashboardMoreAssignments(), {wrapper: createWrapper()});

    await waitFor(() => expect(result.result.current.isLoading).toBe(false));
    expect(mocks.getCourseAssignmentSummaries).toHaveBeenCalledWith(4);
    expect(result.result.current.hasDueNext).toBe(true);
    expect(result.result.current.rows.map(row => row.title)).toEqual([
      'Earlier future assignment',
      'Assignment beyond the dashboard window',
    ]);
  });
});
