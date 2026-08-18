import {beforeEach, describe, expect, it, vi} from 'vitest';
import type {V2ApiClient} from '@/apis';
import {NotificationApiService} from './notification-api';

const client = {
  get: vi.fn(),
  patch: vi.fn(),
};

const service = new NotificationApiService(client as unknown as typeof V2ApiClient);

describe('NotificationApiService', () => {
  beforeEach(() => vi.clearAllMocks());

  it('lists the authenticated user inbox with paging params', async () => {
    client.get.mockResolvedValue({status: 200, data: {items: []}});

    await service.getNotifications({page: 2, size: 40});

    expect(client.get).toHaveBeenCalledWith('/v2/me/notifications', {
      params: {page: 2, size: 40},
    });
  });

  it('loads the unread notification count', async () => {
    client.get.mockResolvedValue({status: 200, data: {unreadCount: 3}});

    await service.getUnreadCount();

    expect(client.get).toHaveBeenCalledWith('/v2/me/notifications/unread-count');
  });

  it('marks one owned notification read with the required idempotency key', async () => {
    client.patch.mockResolvedValue({status: 200});

    await service.markRead(42, 'notification_read_42');

    expect(client.patch).toHaveBeenCalledWith(
      '/v2/me/notifications/42/read',
      undefined,
      {headers: {'Idempotency-Key': 'notification_read_42'}}
    );
  });

  it('marks the entire inbox read with the required idempotency key', async () => {
    client.patch.mockResolvedValue({status: 200, data: {unreadCount: 0}});

    await service.markAllRead('notification_read_all');

    expect(client.patch).toHaveBeenCalledWith(
      '/v2/me/notifications/read-all',
      undefined,
      {headers: {'Idempotency-Key': 'notification_read_all'}}
    );
  });
});
