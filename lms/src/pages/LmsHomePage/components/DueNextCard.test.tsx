import '@testing-library/jest-dom';
import {fireEvent, render, screen} from '@testing-library/react';
import {MemoryRouter} from 'react-router-dom';
import {beforeEach, describe, expect, it, vi} from 'vitest';

const {useDashboardAssignmentsMock} = vi.hoisted(() => ({
  useDashboardAssignmentsMock: vi.fn(),
}));

vi.mock('@/pages/LmsHomePage/hooks/useDashboardAssignments', () => ({
  useDashboardAssignments: useDashboardAssignmentsMock,
}));

vi.mock('@/contexts/RequiredAuthContext', () => ({
  useRequiredAuth: () => ({user: {name: 'Demo Student'}}),
}));

import DueNextCard from './DueNextCard';

const dueNextRow = {
  key: 'student-9-13',
  courseId: 9,
  courseCode: 'BIO-210',
  title: 'Lab Report: Mitosis Observation',
  atLocal: '2026-08-27T23:59:00',
  timezone: 'America/Los_Angeles',
  submissionStatus: 'NotSubmitted' as const,
  assignmentId: 13,
  destination: '/course/9/assignments/13',
};

describe('DueNextCard', () => {
  beforeEach(() => {
    useDashboardAssignmentsMock.mockReturnValue({
      rows: [dueNextRow],
      isInstructor: false,
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    });
  });

  it('links to the real course and assignment destinations', () => {
    render(<MemoryRouter><DueNextCard onAskAssistant={vi.fn()}/></MemoryRouter>);

    expect(screen.getByRole('link', {name: 'BIO-210'})).toHaveAttribute('href', '/course/9');
    expect(screen.getByRole('link', {name: 'Submit'})).toHaveAttribute('href', '/course/9/assignments/13');
  });

  it('prefills Coursistant with the selected assignment context', () => {
    const onAskAssistant = vi.fn();
    render(<MemoryRouter><DueNextCard onAskAssistant={onAskAssistant}/></MemoryRouter>);

    fireEvent.click(screen.getByRole('button', {name: 'Ask AI to help'}));

    expect(onAskAssistant).toHaveBeenCalledWith(expect.objectContaining({
      courseId: 9,
      prompt: 'Help me understand and plan for “Lab Report: Mitosis Observation” in BIO-210.',
      requestId: expect.any(Number),
    }));
  });

  it('turns an empty 14-day window into a positive student state', () => {
    useDashboardAssignmentsMock.mockReturnValue({
      rows: [],
      isInstructor: false,
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    });

    render(<MemoryRouter><DueNextCard onAskAssistant={vi.fn()}/></MemoryRouter>);

    expect(screen.getByRole('heading', {name: 'Nice work, Demo!'})).toBeInTheDocument();
    expect(screen.getByText('Nothing is due in the next 14 days.')).toBeInTheDocument();
  });
});
