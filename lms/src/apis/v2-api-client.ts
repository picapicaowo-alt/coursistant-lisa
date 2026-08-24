import {ApiClient} from "@/apis/api-client";
import {getAppEnv} from '@/config/env';

const appEnv = getAppEnv();

const endBrowserSession = () => {
  localStorage.removeItem('user');
  if (window.location.pathname !== '/login') {
    window.location.href = '/login';
  }
};

export const V2ApiClient = new ApiClient({
  baseURL: appEnv.apiBase,
  timeout: 10000,
  // The refresh token travels as an HttpOnly cookie, so it only reaches the
  // server if credentials are sent.
  withCredentials: true,
  refreshPath: "/v1/auth/refresh-token",
  onSessionExpired: endBrowserSession,
});

/**
 * AI Agent lives on a different origin than `/v1/auth/refresh-token`.
 * 401 recovery reuses the LMS session rotation, then retries with the new Bearer.
 */
export const agentApiClient = new ApiClient({
  baseURL: appEnv.agentBase,
  timeout: 60_000,
  withCredentials: true,
  refreshDelegate: () => V2ApiClient.recoverSession(),
  // A separately deployed agent can reject a token that is still valid for
  // the LMS. Its 401 must not clear the core browser session.
  preserveSessionOnAuthFailure: true,
});
