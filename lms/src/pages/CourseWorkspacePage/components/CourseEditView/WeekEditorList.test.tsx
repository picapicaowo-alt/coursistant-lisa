import {fireEvent, render, screen, waitFor} from '@testing-library/react';
import {QueryClient, QueryClientProvider} from '@tanstack/react-query';
import {beforeEach, describe, expect, it, vi} from 'vitest';
import type {CourseWeek} from '@/apis';
import {courseApiService} from '@/apis/services/course-api';
import {WeekEditorList} from './WeekEditorList';

vi.mock('@/apis/services/course-api', () => ({
  courseApiService: {
    createWeek: vi.fn(),
    renameWeek: vi.fn(),
    deleteWeek: vi.fn(),
    publishWeek: vi.fn(),
    unpublishWeek: vi.fn(),
    reorderWeeks: vi.fn(),
  },
}));

const weeks: CourseWeek[] = [
  {
    id: 11,
    courseId: 31,
    title: 'Week 1',
    orderPosition: 0,
    state: 'Draft',
    materials: [],
    createdAt: '2026-08-01T00:00:00Z',
    updatedAt: '2026-08-01T00:00:00Z',
  },
  {
    id: 12,
    courseId: 31,
    title: 'Week 2',
    orderPosition: 1,
    state: 'Published',
    materials: [],
    createdAt: '2026-08-01T00:00:00Z',
    updatedAt: '2026-08-01T00:00:00Z',
  },
];

const renderList = (canEditStructure: boolean) => {
  const client = new QueryClient({defaultOptions: {mutations: {retry: false}}});
  render(
    <QueryClientProvider client={client}>
      <WeekEditorList
        courseId={31}
        weeks={weeks}
        activeWeekId={11}
        onSelect={vi.fn()}
        onChanged={vi.fn()}
        canEditStructure={canEditStructure}
      />
    </QueryClientProvider>
  );
};

describe('WeekEditorList', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(courseApiService.reorderWeeks).mockResolvedValue({} as never);
  });

  it('reorders the full week permutation', async () => {
    renderList(true);

    fireEvent.click(screen.getByLabelText('Move Week 1 down'));

    await waitFor(() => expect(courseApiService.reorderWeeks).toHaveBeenCalledWith(
      31,
      [12, 11]
    ));
  });

  it('does not expose structural controls to a TA content editor', () => {
    renderList(false);

    expect(screen.queryByText('Rename')).toBeNull();
    expect(screen.queryByText('Publish')).toBeNull();
    expect(screen.queryByPlaceholderText('Name the new week')).toBeNull();
  });
});
