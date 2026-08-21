import {renderHook, waitFor} from '@testing-library/react';
import {QueryClient, QueryClientProvider} from '@tanstack/react-query';
import {MemoryRouter, Route, Routes} from 'react-router-dom';
import {describe, expect, it, vi} from 'vitest';
import {courseApiService} from '@/apis/services/course-api';
import {useRoster} from './useRoster';
import React from 'react';

vi.mock('@/apis/services/course-api', () => ({
  courseApiService: {
    listCourseMembers: vi.fn(),
  },
}));

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });
  return ({children}: {children: React.ReactNode}) => (
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={['/course/10/roster']}>
        <Routes>
          <Route path="/course/:courseId/roster" element={children} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>
  );
};

describe('useRoster sorting', () => {
  it('sorts members client-side by role priority (Instructor -> TA -> Student)', async () => {
    const mockMembers = {
      status: 200,
      code: 'SUCCESS',
      message: 'Success',
      data: {
        items: [
          {id: 1, userId: 101, courseRole: 'Student', userName: 'Student A'},
          {id: 2, userId: 102, courseRole: 'TA', userName: 'TA A'},
          {id: 3, userId: 103, courseRole: 'Instructor', userName: 'Instructor A'},
        ],
        total: 3,
        page: 0,
        size: 20,
      },
    };

    vi.mocked(courseApiService.listCourseMembers).mockResolvedValue(mockMembers as any);

    const {result} = renderHook(() => useRoster(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.members).toHaveLength(3);
    expect(result.current.members[0].courseRole).toBe('Instructor');
    expect(result.current.members[1].courseRole).toBe('TA');
    expect(result.current.members[2].courseRole).toBe('Student');
  });
});
