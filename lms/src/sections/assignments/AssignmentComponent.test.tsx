import '@testing-library/jest-dom';
import {render, screen} from '@testing-library/react';
import {MemoryRouter} from 'react-router-dom';
import {describe, expect, it, vi} from 'vitest';

const {useDashboardMoreAssignmentsMock} = vi.hoisted(() => ({
  useDashboardMoreAssignmentsMock: vi.fn(),
}));

vi.mock('@/pages/LmsHomePage/hooks/useDashboardMoreAssignments', () => ({
  useDashboardMoreAssignments: useDashboardMoreAssignmentsMock,
}));

import AssignmentComponent from './AssignmentComponent';

const baseResult = {
  isLoading: false,
  isError: false,
  refetch: vi.fn(),
};

describe('AssignmentComponent dashboard links', () => {
  it('takes student actions to the exact assignment', () => {
    useDashboardMoreAssignmentsMock.mockReturnValue({
      ...baseResult,
      isInstructor: false,
      rows: [{
        key: 'student-9-13',
        courseId: 9,
        courseCode: 'DEMO-ENROLL',
        title: 'Reading notes',
        atLocal: '2026-08-23T22:17:00',
        timezone: 'America/Los_Angeles',
        submissionStatus: 'Submitted',
        assignmentId: 13,
        destination: '/course/9/assignments/13',
      }],
    });

    render(<MemoryRouter><AssignmentComponent/></MemoryRouter>);

    expect(screen.getByRole('link', {name: 'Reading notes'}))
      .toHaveAttribute('href', '/course/9/assignments/13');
    expect(screen.getByRole('link', {name: 'Resubmit Reading notes'}))
      .toHaveAttribute('href', '/course/9/assignments/13');
    expect(screen.getByRole('link', {name: 'View all assignments in Calendar'}))
      .toHaveAttribute('href', '/calendar');
  });

  it('takes an instructor quiz deadline to the exact quiz', () => {
    useDashboardMoreAssignmentsMock.mockReturnValue({
      ...baseResult,
      isInstructor: true,
      rows: [{
        key: 'teaching-Quiz-9-3',
        courseId: 9,
        courseCode: 'DEMO-ENROLL',
        title: 'Week 1 quiz',
        atLocal: '2026-08-23T22:17:00',
        timezone: 'America/Los_Angeles',
        progress: {submitted: 4, total: 8},
        assignmentId: null,
        destination: '/course/9/quizzes/3',
      }],
    });

    render(<MemoryRouter><AssignmentComponent/></MemoryRouter>);

    expect(screen.getByRole('link', {name: 'Week 1 quiz'}))
      .toHaveAttribute('href', '/course/9/quizzes/3');
  });

  it('shows a composed empty card when the 14-day window has no assignments', () => {
    useDashboardMoreAssignmentsMock.mockReturnValue({
      ...baseResult,
      isInstructor: false,
      hasDueNext: false,
      rows: [],
    });

    const {container} = render(
      <MemoryRouter><AssignmentComponent title="More assignments"/></MemoryRouter>
    );

    expect(screen.getByRole('heading', {name: 'No upcoming assignments'})).toBeInTheDocument();
    expect(screen.getByText('New assignments will appear here.')).toBeInTheDocument();
    expect(container.querySelector('[data-dashboard-empty-state] svg')).not.toBeInTheDocument();
  });

  it('does not imply the due-next assignment disappeared when it is the only item', () => {
    useDashboardMoreAssignmentsMock.mockReturnValue({
      ...baseResult,
      isInstructor: false,
      hasDueNext: true,
      rows: [],
    });

    render(<MemoryRouter><AssignmentComponent title="More assignments"/></MemoryRouter>);

    expect(screen.getByRole('heading', {name: 'No other upcoming assignments'})).toBeInTheDocument();
    expect(screen.getByText('Your next assignment is shown above.')).toBeInTheDocument();
  });
});
