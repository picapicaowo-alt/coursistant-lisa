import {describe, expect, it} from 'vitest';
import {
  shouldAttemptTokenRefresh,
  shouldEndSessionAfterAuthFailure,
} from './api-client';

describe('shouldAttemptTokenRefresh', () => {
  it('never refreshes an anonymous login request after a 401', () => {
    expect(shouldAttemptTokenRefresh('/v1/auth/refresh-token', {
      url: '/v1/auth/login',
      skipAuth: true,
    })).toBe(false);
  });

  it('refreshes one authenticated business request but not the refresh request itself', () => {
    expect(shouldAttemptTokenRefresh('/v1/auth/refresh-token', {
      url: '/v2/me/courses',
    })).toBe(true);
    expect(shouldAttemptTokenRefresh('/v1/auth/refresh-token', {
      url: '/v1/auth/refresh-token',
    })).toBe(false);
    expect(shouldAttemptTokenRefresh('/v1/auth/refresh-token', {
      url: '/v2/me/courses',
      isRetryAfterRefresh: true,
    })).toBe(false);
  });

  it('allows a client without refreshPath to reuse the LMS session rotation', () => {
    expect(shouldAttemptTokenRefresh(undefined, {url: '/chat'}, {hasRefreshDelegate: true})).toBe(true);
    expect(shouldAttemptTokenRefresh(undefined, {url: '/chat'})).toBe(false);
  });

  it('keeps the LMS session when an auxiliary service rejects its token', () => {
    expect(shouldEndSessionAfterAuthFailure(true)).toBe(false);
    expect(shouldEndSessionAfterAuthFailure(false)).toBe(true);
    expect(shouldEndSessionAfterAuthFailure(undefined)).toBe(true);
  });
});
