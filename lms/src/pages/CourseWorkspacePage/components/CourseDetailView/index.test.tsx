import {render, screen} from '@testing-library/react';
import {beforeEach, describe, expect, it, vi} from 'vitest';
import {CourseDetailView} from '.';
import {useCourseWorkspaceData} from '../../hooks/useCourseWorkspaceData';

vi.mock('../../hooks/useCourseWorkspaceData', () => ({
  useCourseWorkspaceData: vi.fn(),
}));

const emptyWorkspace = {
  courseId: 37,
  course: undefined,
  weeks: [],
  sessions: [],
  assignments: [],
  quizzes: [],
  events: [],
  groupSets: [],
  announcements: [],
  isLoading: false,
  isError: true,
  isForbidden: false,
  sessionsFailed: false,
  assignmentsFailed: false,
  quizzesFailed: false,
  eventsFailed: false,
  groupSetsFailed: false,
  announcementsFailed: false,
  refetch: vi.fn(),
};

describe('CourseDetailView errors', () => {
  beforeEach(() => {
    vi.mocked(useCourseWorkspaceData).mockReturnValue({...emptyWorkspace});
  });

  it('shows a clear access message for a forbidden course without offering a retry', () => {
    vi.mocked(useCourseWorkspaceData).mockReturnValue({...emptyWorkspace, isForbidden: true});

    render(<CourseDetailView/>);

    expect(screen.getByRole('alert')).toHaveTextContent('You do not have access to this course.');
    expect(screen.queryByRole('button', {name: 'Try again'})).not.toBeInTheDocument();
  });

  it('keeps the retry action for transient loading failures', () => {
    render(<CourseDetailView/>);

    expect(screen.getByRole('alert')).toHaveTextContent("This course couldn't be loaded.");
    expect(screen.getByRole('button', {name: 'Try again'})).toBeInTheDocument();
  });
});
