// Auth types — see docs/api/auth_module-api_en.md

/**
 * Which account table the login should be resolved against. This is not an
 * authorization role: the JWT carries its own RoleEnum, and the platform
 * standing lives in `level`. Course roles (Student / TA / Instructor) are a
 * third, separate concept that never appears here.
 */
export type LoginAccountType = 'USER' | 'TENANT_ADMIN' | 'SYSTEM_ADMIN' | 'ADMIN';

/** Platform standing. Course TAs are not represented here — TA is per-course. */
export type UserLevel = 'STUDENT' | 'INSTRUCTOR' | 'NOT_APPLICABLE';

export interface LoginRequest {
  email: string;
  password: string;
  /** Must match the account type or login fails. */
  role: LoginAccountType;
}

/**
 * `data` of a successful `POST /v1/auth/login` (and of `register`).
 *
 * `refreshToken` is deliberately absent: the server returns it as an HttpOnly
 * cookie and never in JSON, so only `accessToken` is ours to store.
 */
export interface AuthResult {
  userId: number;
  email: string;
  name: string;
  username: string;
  role: LoginAccountType;
  level: UserLevel;
  /** May be null. */
  avatar: string | null;
  accessToken: string;
  /** Null or omitted means false. */
  mustChangePassword?: boolean | null;
}

/**
 * The authenticated user as the app stores it.
 *
 * Mostly `AuthResult`, plus `id` because a lot of existing code keys off
 * `user.id`. The RocketChat fields are populated by the chat integration, not
 * by login.
 */
export interface LoginResponse extends AuthResult {
  id: number;
  rocketChatToken?: string;
  rocketChatUserId?: string;
}

/** Error `code` values login can return. */
export const AUTH_ERROR_CODES = {
  invalidCredentials: 'INVALID_CREDENTIALS',
  passwordChangeRequired: 'PASSWORD_CHANGE_REQUIRED',
  serviceUnavailable: 'AUTH_SERVICE_TEMPORARILY_UNAVAILABLE',
  paramMissing: 'PARAM_MISSING',
  tokenCreationFailed: 'TOKEN_CREATION_FAILED',
} as const;
