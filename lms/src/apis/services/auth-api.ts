// Auth API service — see docs/api/auth_module-api_en.md
//
// Note the client: auth lives under /v1 while everything else is /v2, but both
// sit behind the same host and base path, so V2ApiClient is the right
// transport despite the name. It sends credentials, which login needs — the
// refreshToken comes back as an HttpOnly cookie and is never in the JSON.

import {
  ApiResponse,
  AuthResult,
  ChangePasswordRequest,
  idempotent,
  LoginRequest,
  PasswordResetRequest,
  RegisterRequest,
  V2ApiClient,
} from '@/apis';

export class AuthApiService {
  private apiClient = V2ApiClient;

  constructor(apiClient?: typeof V2ApiClient) {
    if (apiClient) {
      this.apiClient = apiClient;
    }
  }

  /**
   * Exchanges credentials for an access token.
   *
   * Roughly five consecutive failures lock the account for about 15 minutes,
   * but the caller still sees INVALID_CREDENTIALS — the API refuses to
   * distinguish "wrong password" from "locked" or "no such account", and the
   * UI must not invent that distinction either (NFR-15).
   */
  async login(request: LoginRequest): Promise<ApiResponse<AuthResult>> {
    try {
      return await this.apiClient.post<AuthResult>('/v1/auth/login', request, {skipAuth: true});
    } catch (error) {
      console.error('Failed to log in', error);
      throw error;
    }
  }

  /** Sends the one-time code consumed atomically by registration. */
  async sendRegistrationVerification(email: string): Promise<ApiResponse<void>> {
    return this.apiClient.post<void>(
      '/v1/auth/email-verifications/register',
      undefined,
      {params: {email}, ...idempotent(), skipAuth: true},
    );
  }

  /** Creates a student account and returns an authenticated session. */
  async register(request: RegisterRequest): Promise<ApiResponse<AuthResult>> {
    return this.apiClient.post<AuthResult>('/v1/auth/register', request, {...idempotent(), skipAuth: true});
  }

  async sendPasswordResetVerification(email: string): Promise<ApiResponse<void>> {
    return this.apiClient.post<void>(
      '/v1/auth/email-verifications/reset',
      undefined,
      {params: {email}, ...idempotent(), skipAuth: true},
    );
  }

  async resetPassword(request: PasswordResetRequest): Promise<ApiResponse<void>> {
    return this.apiClient.post<void>(
      '/v1/auth/password-resets',
      request,
      {...idempotent(), skipAuth: true},
    );
  }

  async changePassword(request: ChangePasswordRequest): Promise<ApiResponse<void>> {
    return this.apiClient.put<void>('/v1/auth/password', request, idempotent());
  }

  /** Allowed without a Bearer token — the refresh cookie identifies the session. */
  async logout(): Promise<ApiResponse<void>> {
    try {
      return await this.apiClient.post<void>('/v1/auth/logout', undefined, {...idempotent(), skipAuth: true});
    } catch (error) {
      console.error('Failed to log out', error);
      throw error;
    }
  }

  /** `data` is the new access token as a bare string, not an object. */
  async refreshToken(): Promise<ApiResponse<string>> {
    try {
      return await this.apiClient.post<string>('/v1/auth/refresh-token', undefined, {skipAuth: true});
    } catch (error) {
      console.error('Failed to refresh token', error);
      throw error;
    }
  }
}

export const authApiService = new AuthApiService();
