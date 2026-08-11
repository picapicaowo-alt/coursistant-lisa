import {ApiClient} from "@/apis/api-client";

export const V2ApiClient = new ApiClient({
  baseURL: import.meta.env.VITE_API_DOMAIN_NAME,
  timeout: 10000,
  // The refresh token travels as an HttpOnly cookie, so it only reaches the
  // server if credentials are sent.
  withCredentials: true,
  refreshPath: "/v1/auth/refresh-token",
  onSessionExpired: () => {
    // Refresh failed, so the session is genuinely over. A full navigation
    // rather than a router push: the caller is deep inside a failed request
    // and every bit of cached state now belongs to a logged-out user.
    localStorage.removeItem('user');
    if (window.location.pathname !== '/login') {
      window.location.href = '/login';
    }
  },
})
