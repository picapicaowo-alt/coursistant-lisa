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

describe('PostComponent dashboard links', () => {
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

    expect(await screen.findByRole('link', {name: 'Open announcement: Dashboard announcement'}))
      .toHaveAttribute('href', '/course/31/announcements/72');
  });
});
