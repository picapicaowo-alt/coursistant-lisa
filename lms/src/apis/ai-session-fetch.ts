import {V2ApiClient} from './v2-api-client';

/**
 * Streaming/file AI requests use the same session as the Axios LMS client.
 * Retry only an HTTP 401 before consuming the response, never a partial answer
 * or an SSE error event. Auxiliary failures must not clear a valid LMS session.
 * Callers must provide a replayable body (JSON string, URLSearchParams or FormData).
 */
export const fetchWithAiSession = async (
  url: string,
  init: RequestInit,
  fetcher: typeof fetch = fetch,
): Promise<Response> => {
  const send = () => {
    const token = V2ApiClient.getAccessToken();
    const headers = new Headers(init.headers);
    if (token) headers.set('Authorization', `Bearer ${token}`);
    else headers.delete('Authorization');
    // The browser must create the multipart boundary on each attempt.
    if (init.body instanceof FormData) headers.delete('Content-Type');
    return {token, response: fetcher(url, {...init, headers})};
  };

  const first = send();
  const response = await first.response;
  if (response.status !== 401) return response;

  await response.body?.cancel();
  await V2ApiClient.recoverSession(first.token);
  return send().response;
};
