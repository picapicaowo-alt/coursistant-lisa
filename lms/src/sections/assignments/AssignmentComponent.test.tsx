import '@testing-library/jest-dom';
import {render, screen} from '@testing-library/react';
import {MemoryRouter} from 'react-router-dom';
import {describe, expect, it, vi} from 'vitest';

const {useDashboardAssignmentsMock} = vi.hoisted(() => ({
  useDashboardAssignmentsMock: vi.fn(),
}));

vi.mock('@/pages/LmsHomePage/hooks/useDashboardAssignments', () => ({
  useDashboardAssignments: useDashboardAssignmentsMock,
}));

import AssignmentComponent from './AssignmentComponent';

const baseResult = {
  isLoading: false,
  isError: false,
  refetch: vi.fn(),
};

describe('AssignmentComponent dashboard links', () => {
  it('takes student actions to the exact assignment', () => {
    useDashboardAssignmentsMock.mockReturnValue({
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
    expect(screen.getByRole('link', {name: 'See all work in DEMO-ENROLL'}))
      .toHaveAttribute('href', '/course/9');
  });

  it('takes an instructor quiz deadline to the exact quiz', () => {
    useDashboardAssignmentsMock.mockReturnValue({
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
});
