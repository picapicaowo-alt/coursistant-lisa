import '@testing-library/jest-dom';
import {QueryClient, QueryClientProvider} from '@tanstack/react-query';
import {render, screen} from '@testing-library/react';
import {MemoryRouter} from 'react-router-dom';
import {describe, expect, it, vi} from 'vitest';

const mocks = vi.hoisted(() => ({
  getRecentAnnouncements: vi.fn(),
}));

vi.mock('@/apis/services/dashboard-api', () => ({
  dashboardApiService: {getRecentAnnouncements: mocks.getRecentAnnouncements},
}));

vi.mock('@/contexts/RequiredAuthContext', () => ({
  useRequiredAuth: () => ({user: {id: 385}}),
}));

import PostComponent from './PostComponent';
import {formatAnnouncementRelativeTime} from './announcementTime';

describe('PostComponent dashboard links', () => {
  it('treats zone-less announcement timestamps as UTC', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-08-24T09:00:00Z'));

    expect(formatAnnouncementRelativeTime('2026-08-24T08:00:00')).toBe('an hour ago');

    vi.useRealTimers();
  });

  it('opens the exact announcement instead of only the course root', async () => {
    mocks.getRecentAnnouncements.mockResolvedValue({
      data: [{
        courseId: 31,
        id: 72,
        courseCode: 'DASH-024730-1',
        title: 'Dashboard announcement',
        postedAt: '2026-08-17T18:00:00Z',
        unread: true,
      }],
    });
    const client = new QueryClient({defaultOptions: {queries: {retry: false}}});

    render(
      <QueryClientProvider client={client}>
        <MemoryRouter><PostComponent/></MemoryRouter>
      </QueryClientProvider>
    );

    expect(await screen.findByRole('link', {name: 'Open announcement: Dashboard announcement, New'}))
      .toHaveAttribute('href', '/course/31/announcements/72');
  });

  it('distinguishes a course with no announcement history', async () => {
    mocks.getRecentAnnouncements.mockResolvedValue({data: []});
    const client = new QueryClient({defaultOptions: {queries: {retry: false}}});

    const {container} = render(
      <QueryClientProvider client={client}>
        <MemoryRouter><PostComponent/></MemoryRouter>
      </QueryClientProvider>
    );

    expect(await screen.findByRole('heading', {name: 'No announcements yet'})).toBeInTheDocument();
    expect(screen.getByText('Course updates will appear here.')).toBeInTheDocument();
    expect(container.querySelector('[data-dashboard-empty-state] svg')).not.toBeInTheDocument();
  });

  it('uses the up-to-date state when announcement history exists but none are unread', async () => {
    mocks.getRecentAnnouncements.mockResolvedValue({
      data: [{
        courseId: 31,
        id: 72,
        courseCode: 'BIO-210',
        title: 'Earlier update',
        postedAt: '2026-08-17T18:00:00Z',
        unread: false,
      }],
    });
    const client = new QueryClient({defaultOptions: {queries: {retry: false}}});

    render(
      <QueryClientProvider client={client}>
        <MemoryRouter><PostComponent/></MemoryRouter>
      </QueryClientProvider>
    );

    expect(await screen.findByRole('heading', {name: 'No new announcements'})).toBeInTheDocument();
    expect(screen.getByText('You’re up to date.')).toBeInTheDocument();
    expect(screen.queryByRole('link', {name: 'Open announcement: Earlier update'})).not.toBeInTheDocument();
  });

  it('keeps unread announcements visible when older read items would otherwise fill the limit', async () => {
    mocks.getRecentAnnouncements.mockResolvedValue({
      data: [
        {courseId: 31, id: 1, courseCode: 'BIO-210', title: 'Read one', postedAt: '2026-08-20T18:00:00Z', unread: false},
        {courseId: 31, id: 2, courseCode: 'BIO-210', title: 'Read two', postedAt: '2026-08-19T18:00:00Z', unread: false},
        {courseId: 31, id: 3, courseCode: 'BIO-210', title: 'Unread update', postedAt: '2026-08-18T18:00:00Z', unread: true},
      ],
    });
    const client = new QueryClient({defaultOptions: {queries: {retry: false}}});

    render(
      <QueryClientProvider client={client}>
        <MemoryRouter><PostComponent limit={2}/></MemoryRouter>
      </QueryClientProvider>
    );

    expect(await screen.findByRole('link', {name: 'Open announcement: Unread update, New'}))
      .toBeInTheDocument();
    expect(screen.queryByRole('link', {name: 'Open announcement: Read two'})).not.toBeInTheDocument();
  });
});
