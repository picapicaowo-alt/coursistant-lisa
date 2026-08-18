import '@testing-library/jest-dom';
import {fireEvent, render, screen} from '@testing-library/react';
import {format} from 'date-fns';
import {MemoryRouter, Route, Routes} from 'react-router-dom';
import {describe, expect, it, vi} from 'vitest';

const {useDashboardActivitiesMock} = vi.hoisted(() => ({
  useDashboardActivitiesMock: vi.fn(),
}));

vi.mock('@/pages/LmsHomePage/hooks/useDashboardActivities', () => ({
  ACTIVITY_WINDOW_DAYS: 30,
  useDashboardActivities: useDashboardActivitiesMock,
}));

import LearningScheduleComponent from './LearningScheduleComponent';

const todayKey = format(new Date(), 'yyyy-MM-dd');

const renderSchedule = () => render(
  <MemoryRouter initialEntries={['/']}>
    <Routes>
      <Route path="/" element={<LearningScheduleComponent/>}/>
      <Route path="/course/:courseId" element={<div>Course destination</div>}/>
    </Routes>
  </MemoryRouter>
);

describe('LearningScheduleComponent', () => {
  it('opens the exact course returned by the activity API', () => {
    useDashboardActivitiesMock.mockReturnValue({
      activities: [{
        courseId: 41,
        courseCode: 'API-41b464ce84b3',
        type: 'Lecture',
        title: 'Lecture',
        date: todayKey,
        startTime: '09:00:00',
        endTime: '10:30:00',
        location: 'A101',
        source: 'Session',
        sourceId: 18,
        timezone: 'America/Los_Angeles',
      }],
      coveredFrom: todayKey,
      coveredTo: todayKey,
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    });

    renderSchedule();

    const courseLink = screen.getByRole('link', {name: 'Open API-41b464ce84b3: Lecture'});
    expect(courseLink).toHaveAttribute('href', '/course/41');

    fireEvent.click(courseLink);
    expect(screen.getByText('Course destination')).toBeInTheDocument();
  });

  it('renders calendar dates as keyboard-accessible buttons', () => {
    useDashboardActivitiesMock.mockReturnValue({
      activities: [],
      coveredFrom: todayKey,
      coveredTo: todayKey,
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    });

    renderSchedule();

    expect(screen.getByRole('button', {name: format(new Date(), 'EEEE, MMMM d, yyyy')}))
      .toHaveAttribute('aria-pressed', 'true');
  });
});
