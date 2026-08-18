import type {
  ApiResponse,
  NotificationPage,
  NotificationPageParams,
  UnreadNotificationCount,
} from '@/apis';
import {V2ApiClient} from '@/apis';
import {idempotent} from '@/apis/types/common';

export class NotificationApiService {
  private apiClient = V2ApiClient;

  constructor(apiClient?: typeof V2ApiClient) {
    if (apiClient) this.apiClient = apiClient;
  }

  async getNotifications(
    params: NotificationPageParams = {page: 1, size: 20}
  ): Promise<ApiResponse<NotificationPage>> {
    return this.apiClient.get<NotificationPage>('/v2/me/notifications', {params});
  }

  async getUnreadCount(): Promise<ApiResponse<UnreadNotificationCount>> {
    return this.apiClient.get<UnreadNotificationCount>('/v2/me/notifications/unread-count');
  }

  async markRead(
    notificationId: number,
    idempotencyKey: string = crypto.randomUUID()
  ): Promise<ApiResponse<void>> {
    return this.apiClient.patch<void>(
      `/v2/me/notifications/${notificationId}/read`,
      undefined,
      idempotent(idempotencyKey)
    );
  }

  async markAllRead(
    idempotencyKey: string = crypto.randomUUID()
  ): Promise<ApiResponse<UnreadNotificationCount>> {
    return this.apiClient.patch<UnreadNotificationCount>(
      '/v2/me/notifications/read-all',
      undefined,
      idempotent(idempotencyKey)
    );
  }
}

export const notificationApiService = new NotificationApiService();
