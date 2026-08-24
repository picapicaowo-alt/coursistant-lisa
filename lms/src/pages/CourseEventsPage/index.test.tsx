import {QueryClient, QueryClientProvider} from '@tanstack/react-query';
import {fireEvent, render, screen, waitFor} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {MemoryRouter, Route, Routes} from 'react-router-dom';
import {beforeEach, describe, expect, it, vi} from 'vitest';

const api = vi.hoisted(() => ({
  listCourseEvents: vi.fn(),
  getCourseEvent: vi.fn(),
  updateCourseEvent: vi.fn(),
  createCourseEvent: vi.fn(),
  deleteCourseEvent: vi.fn(),
}));

vi.mock('@/apis/services/course-api', () => ({courseApiService: api}));
vi.mock('@/hooks/useCourseAccess', () => ({
  useCourseAccess: () => ({canManageCourseEvents: true}),
}));

import CourseEventsPage from './index';

const response = <T,>(data: T) => ({
  status: 200,
  code: 'SUCCESS',
  data,
  message: 'OK',
  timestamp: '2026-08-23T00:00:00Z',
});

const event = {
  id: 9,
  courseId: 31,
  name: 'Review session',
  date: '2026-09-10',
  startTime: '10:00:00',
  endTime: '11:00:00',
  location: 'Room 201',
  description: 'Bring questions',
  timezone: 'America/Los_Angeles',
  version: 4,
  createdAt: '2026-08-20T00:00:00Z',
  updatedAt: '2026-08-20T00:00:00Z',
};

const renderPage = () => render(
  <QueryClientProvider client={new QueryClient({defaultOptions: {queries: {retry: false}}})}>
    <MemoryRouter initialEntries={['/course/31/events/9']}>
      <Routes>
        <Route path="/course/:courseId/events/:eventId" element={<CourseEventsPage/>}/>
      </Routes>
    </MemoryRouter>
  </QueryClientProvider>,
);

const renderListPage = () => render(
  <QueryClientProvider client={new QueryClient({defaultOptions: {queries: {retry: false}}})}>
    <MemoryRouter initialEntries={['/course/31/events']}>
      <Routes>
        <Route path="/course/:courseId/events" element={<CourseEventsPage/>}/>
      </Routes>
    </MemoryRouter>
  </QueryClientProvider>,
);

describe('CourseEventsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    api.listCourseEvents.mockResolvedValue(response([event]));
    api.getCourseEvent.mockResolvedValue(response(event));
    api.updateCourseEvent.mockResolvedValue(response({...event, location: null, description: null, version: 5}));
  });

  it('sends empty strings when an editor clears location and description', async () => {
    renderPage();
    const user = userEvent.setup();

    await user.click(await screen.findByRole('button', {name: 'Edit event'}));
    await user.clear(screen.getByLabelText('Location'));
    await user.click(screen.getByLabelText('Description'));
    await user.keyboard('{Control>}a{/Control}{Backspace}');
    await user.click(screen.getByRole('button', {name: 'Save event'}));

    await waitFor(() => expect(api.updateCourseEvent).toHaveBeenCalledWith(
      31,
      9,
      expect.objectContaining({location: '', description: '', expectedVersion: 4}),
      expect.any(String),
    ));
  });

  it('reuses the same key when the user retries an unchanged failed update', async () => {
    api.updateCourseEvent
      .mockRejectedValueOnce(new Error('timeout'))
      .mockResolvedValueOnce(response({...event, version: 5}));
    renderPage();
    const user = userEvent.setup();

    await user.click(await screen.findByRole('button', {name: 'Edit event'}));
    fireEvent.change(screen.getByLabelText('Location'), {target: {value: 'Room 202'}});
    await user.click(screen.getByRole('button', {name: 'Save event'}));
    await screen.findByText('The event could not be saved.');
    await user.click(screen.getByRole('button', {name: 'Save event'}));

    await waitFor(() => expect(api.updateCourseEvent).toHaveBeenCalledTimes(2));
    expect(api.updateCourseEvent.mock.calls[0][3]).toBe(api.updateCourseEvent.mock.calls[1][3]);
  });

  it('defaults a new event to a rounded one-hour range and keeps duration linked', async () => {
    api.listCourseEvents.mockResolvedValue(response([]));
    renderListPage();
    const user = userEvent.setup();

    await user.click(await screen.findByRole('button', {name: 'Add event'}));

    const starts = screen.getByLabelText('Starts') as HTMLInputElement;
    const ends = screen.getByLabelText('Ends') as HTMLInputElement;
    expect(starts.value).toMatch(/:\d{2} (AM|PM)$/);
    expect(starts.value).toMatch(/:(00|30) (AM|PM)$/);
    expect(screen.getByLabelText('Duration')).toHaveValue('60');

    fireEvent.change(starts, {target: {value: '10:00 AM'}});
    expect(ends).toHaveValue('11:00 AM');
    await user.selectOptions(screen.getByLabelText('Duration'), '90');
    expect(ends).toHaveValue('11:30 AM');
  });
});
