import {QueryClient, QueryClientProvider} from '@tanstack/react-query';
import {fireEvent, render, screen, waitFor} from '@testing-library/react';
import {MemoryRouter} from 'react-router-dom';
import {beforeEach, describe, expect, it, vi} from 'vitest';
import '@testing-library/jest-dom';
import {notificationApiService} from '@/apis/services/notification-api';
import NotificationCenter from './index';

vi.mock('@/apis/services/notification-api', () => ({
  notificationApiService: {
    getUnreadCount: vi.fn(),
    getNotifications: vi.fn(),
    markRead: vi.fn(),
    markAllRead: vi.fn(),
  },
}));

const response = <T,>(data: T) => ({
  status: 200,
  code: 'SUCCESS',
  message: 'Success',
  timestamp: '2026-08-18T12:00:00Z',
  data,
});

describe('NotificationCenter', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(notificationApiService.getUnreadCount).mockResolvedValue(response({unreadCount: 0}));
    vi.mocked(notificationApiService.getNotifications).mockResolvedValue(response({
      items: [], page: 1, size: 20, total: 0,
    }));
    vi.mocked(notificationApiService.markAllRead).mockResolvedValue(response({unreadCount: 0}));
  });

  it('keeps Mark all read available when the unread count is zero', async () => {
    const queryClient = new QueryClient({defaultOptions: {queries: {retry: false}}});
    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter><NotificationCenter/></MemoryRouter>
      </QueryClientProvider>
    );

    fireEvent.click(screen.getByRole('button', {name: 'Notifications'}));
    const markAll = await screen.findByRole('button', {name: 'Mark all read'});
    expect(markAll).toBeEnabled();
    fireEvent.click(markAll);

    await waitFor(() => expect(notificationApiService.markAllRead).toHaveBeenCalledOnce());
  });
});
