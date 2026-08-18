import {
  AdminTenant,
  AdminTenantPayload,
  ApiResponse,
  ChangeManagedUserRoleRequest,
  CreateManagedUserRequest,
  idempotent,
  ManagedUser,
  V2ApiClient,
} from '@/apis';

export class AdminApiService {
  private apiClient = V2ApiClient;

  constructor(apiClient?: typeof V2ApiClient) {
    if (apiClient) this.apiClient = apiClient;
  }

  listTenants(): Promise<ApiResponse<AdminTenant[]>> {
    return this.apiClient.get('/v2/admin/tenants');
  }

  createTenant(request: AdminTenantPayload): Promise<ApiResponse<AdminTenant>> {
    return this.apiClient.post('/v2/admin/tenants', request, idempotent());
  }

  updateTenant(tenantId: number, request: Partial<AdminTenantPayload>): Promise<ApiResponse<AdminTenant>> {
    return this.apiClient.patch(`/v2/admin/tenants/${tenantId}`, request, idempotent());
  }

  deleteTenant(tenantId: number): Promise<ApiResponse<void>> {
    return this.apiClient.delete(`/v2/admin/tenants/${tenantId}`, idempotent());
  }

  listUsers(): Promise<ApiResponse<ManagedUser[]>> {
    return this.apiClient.get('/v2/users');
  }

  createManagedUser(scope: 'system' | 'tenant', request: CreateManagedUserRequest): Promise<ApiResponse<number>> {
    return this.apiClient.post(`/v2/${scope}/managed-users`, request, idempotent());
  }

  changeManagedUserRole(scope: 'system' | 'tenant', userId: number, request: ChangeManagedUserRoleRequest): Promise<ApiResponse<void>> {
    return this.apiClient.put(`/v2/${scope}/managed-users/${userId}/role`, request, idempotent());
  }

  disableManagedUser(scope: 'system' | 'tenant', userId: number): Promise<ApiResponse<void>> {
    return this.apiClient.post(`/v2/${scope}/managed-users/${userId}/disable`, undefined, idempotent());
  }
}

export const adminApiService = new AdminApiService();
