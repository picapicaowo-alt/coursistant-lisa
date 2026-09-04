import axios, {AxiosError, AxiosInstance, AxiosRequestConfig, AxiosResponse, InternalAxiosRequestConfig} from 'axios';
import {ApiError, ApiResponse} from './types';
import {isRecord} from '@/utils/apiError';

export interface ApiClientConfig {
  baseURL: string;
  timeout?: number;
  headers?: Record<string, string>;
  withCredentials?: boolean;
  /**
   * Path that exchanges the refresh cookie for a new access token. Set it to
   * enable transparent recovery from an expired token; leave it off and a 401
   * is simply reported to the caller.
   */
  refreshPath?: string;
  /**
   * Used when this client cannot refresh on its own (different origin than
   * `/v1/auth/refresh-token`) but should reuse the LMS session rotation.
   */
  refreshDelegate?: () => Promise<void>;
  /** Called when the session cannot be recovered and the user must log in. */
  onSessionExpired?: () => void;
  /**
   * Auxiliary services may reject an otherwise valid LMS token. Keep the LMS
   * session intact and report that service's 401 to its caller instead.
   */
  preserveSessionOnAuthFailure?: boolean;
}

export interface RequestConfig extends Omit<AxiosRequestConfig, 'url' | 'method'> {
  skipAuth?: boolean;
  retryCount?: number;
  /** Set internally once a request has been retried after a refresh. */
  isRetryAfterRefresh?: boolean;
}

interface RefreshCandidate {
  url?: string;
  skipAuth?: boolean;
  isRetryAfterRefresh?: boolean;
}

/** Anonymous auth calls must never revive or rotate an older user's session. */
export const shouldAttemptTokenRefresh = (
  refreshPath: string | undefined,
  request: RefreshCandidate | undefined,
  options?: {hasRefreshDelegate?: boolean},
): boolean => Boolean(
  (Boolean(refreshPath) || options?.hasRefreshDelegate)
  && request
  && !request.isRetryAfterRefresh
  && !request.skipAuth
  && request.url !== refreshPath
);

export const shouldEndSessionAfterAuthFailure = (
  preserveSessionOnAuthFailure: boolean | undefined,
): boolean => preserveSessionOnAuthFailure !== true;

export class ApiClient {
  private readonly client: AxiosInstance;
  private config: ApiClientConfig;
  
  constructor(config: ApiClientConfig) {
    this.config = {
      timeout: 10000,
      ...config
    };
    
    this.client = axios.create({
      baseURL: this.config.baseURL,
      timeout: this.config.timeout,
      headers: {
        'Content-Type': 'application/json',
        ...this.config.headers
      },
      withCredentials: this.config.withCredentials || false
    });
    
    this.client.interceptors.request.use(
      this.handleRequest.bind(this),
      this.handleRequestError.bind(this)
    );
    
    this.client.interceptors.response.use(
      this.handleResponse.bind(this),
      this.handleResponseError.bind(this)
    );
  }
  
  public getClient(): AxiosInstance {
    return this.client;
  }
  
  public setAccessToken(token: string): void {
    localStorage.setItem('accToken', token);
  }
  
  public clearAccessToken(): void {
    localStorage.removeItem('accToken');
    delete this.client.defaults.headers.common['Authorization'];
  }

  /** Read at dispatch time: every LMS/AI client and browser tab shares rotation. */
  public getAccessToken(): string | null {
    return localStorage.getItem('accToken');
  }
  
  private handleRequest(config: InternalAxiosRequestConfig): InternalAxiosRequestConfig {
    config.headers = config.headers || {};

    // Let the browser supply the multipart boundary. Keeping the instance's
    // application/json default on FormData produces an invalid upload request.
    if (config.data instanceof FormData && 'delete' in config.headers) {
      config.headers.delete('Content-Type');
    }

    // No X-Request-Timestamp header. It appears in no API contract, nothing
    // reads it, and being a custom header it forces a CORS preflight that the
    // server rejects: its Access-Control-Allow-Headers lists the name as
    // "field-x-request-timestamp", so every cross-origin call fails outright.

    const requestConfig = config as unknown as RequestConfig;
    if (requestConfig.skipAuth !== undefined && requestConfig.skipAuth) {
      delete config.headers.Authorization;
    } else {
      const token = this.getAccessToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      } else {
        delete config.headers.Authorization;
      }
    }
    
    if (import.meta.env.DEV) {
      // Never print request headers or bodies: they may contain bearer tokens,
      // passwords, assignment submissions, or uploaded-file metadata.
      console.debug(`[API Request] ${config.method?.toUpperCase()} ${config.url}`);
    }
    
    return config;
  }
  
  private handleRequestError(error: unknown): Promise<never> {
    return Promise.reject(error);
  }
  
  private handleResponse(response: AxiosResponse): AxiosResponse {
    if (import.meta.env.DEV) {
      // Response bodies can contain access tokens and student data.
      console.debug(
        `[API Response] ${response.config.method?.toUpperCase()} ${response.config.url} ${response.status}`
      );
    }
    
    return response;
  }
  
  private async handleResponseError(error: AxiosError): Promise<never> {
    const apiError: ApiError = {
      code: error.response?.status || 0,
      message: error.message,
      details: isRecord(error.response?.data) ? error.response.data : undefined,
    };
    
    if (error.response?.status === 401) {
      return this.handleAuthError(error);
    }

    const original = error.config as (InternalAxiosRequestConfig & RequestConfig) | undefined;
    const errorCode = isRecord(error.response?.data) && typeof error.response.data.code === 'string'
      ? error.response.data.code
      : undefined;

    if (errorCode === 'IDEMPOTENCY_REQUEST_IN_PROGRESS' && original) {
      const retryCount = original.retryCount ?? 0;
      if (retryCount < 3) {
        original.retryCount = retryCount + 1;
        await new Promise(resolve => setTimeout(resolve, 1000));
        return await this.client.request(original) as never;
      }
    }
    
    // Keep diagnostics useful without logging response bodies, which may
    // contain private course or student data.
    console.error(`[API Error] ${apiError.code}: ${apiError.message}`);
    return Promise.reject(apiError);
  }
  
  /**
   * Recovers from an expired access token, once, then replays the request.
   *
   * The access token is short-lived while the refresh cookie lasts about two
   * weeks, so a 401 mid-session is the normal course of events rather than a
   * real authentication failure. Without this every request starts failing the
   * moment the token ages out and the user is thrown back to the login screen
   * mid-task.
   */
  private async handleAuthError(error: AxiosError): Promise<never> {
    const original = error.config as (InternalAxiosRequestConfig & RequestConfig) | undefined;

    const canRetry = shouldAttemptTokenRefresh(this.config.refreshPath, original, {
      hasRefreshDelegate: Boolean(this.config.refreshDelegate),
    });

    if (canRetry && original) {
      try {
        const authorization = original.headers.Authorization;
        const rejectedToken = typeof authorization === 'string' && authorization.startsWith('Bearer ')
          ? authorization.slice('Bearer '.length)
          : null;
        await this.recoverSession(rejectedToken);
      } catch {
        if (shouldEndSessionAfterAuthFailure(this.config.preserveSessionOnAuthFailure)) {
          this.endSession();
        }
        return Promise.reject({code: 401, message: 'Authentication required'});
      }

      original.isRetryAfterRefresh = true;
      // The interceptor attaches the current shared token. A replay's network
      // or business error must not be mistaken for a failed session refresh.
      return await this.client.request(original) as never;
    }

    if (original?.isRetryAfterRefresh
      && shouldEndSessionAfterAuthFailure(this.config.preserveSessionOnAuthFailure)) {
      this.endSession();
    }

    return Promise.reject({
      code: 401,
      message: 'Authentication required',
      details: isRecord(error.response?.data) ? error.response.data : undefined,
    });
  }

  /** Rotates the LMS access token, including for clients that share this session. */
  public recoverSession(rejectedToken?: string | null): Promise<void> {
    const currentToken = this.getAccessToken();
    // A late 401 may belong to a request sent before another client refreshed.
    if (rejectedToken !== undefined && currentToken && currentToken !== rejectedToken) {
      return Promise.resolve();
    }
    if (this.config.refreshDelegate) return this.config.refreshDelegate();
    return this.refreshAccessToken();
  }

  /**
   * Fetches a new access token, coalescing concurrent callers.
   *
   * A dashboard fires several requests at once, so an expired token produces a
   * burst of 401s. They share one refresh: without this they would each rotate
   * the refresh cookie, and every rotation but the last would be invalidated.
   */
  private refreshInFlight?: Promise<void>;

  private refreshAccessToken(): Promise<void> {
    if (this.refreshInFlight) return this.refreshInFlight;

    this.refreshInFlight = (async () => {
      // A bare axios call: the instance interceptor would recurse on failure.
      const response = await axios.post<ApiResponse<string>>(
        `${this.config.baseURL}${this.config.refreshPath}`,
        undefined,
        {withCredentials: true, timeout: this.config.timeout}
      );

      // `data` here is the token itself, not an object wrapping one.
      const token = response.data?.data;
      if (typeof token !== 'string' || token.length === 0) {
        throw new Error('Refresh response carried no access token');
      }

      this.setAccessToken(token);
    })();

    return this.refreshInFlight.finally(() => {
      this.refreshInFlight = undefined;
    });
  }

  private endSession(): void {
    this.clearAccessToken();
    this.config.onSessionExpired?.();
  }
  
  private mergeRequestConfig(config?: RequestConfig): AxiosRequestConfig {
    if (!config) return {};
    
    if (config.headers) {
      return {
        ...config,
        headers: {
          ...config.headers
        }
      };
    }
    
    return config;
  }
  
  public async get<T = unknown>(url: string, config?: RequestConfig): Promise<ApiResponse<T>> {
    const mergedConfig = this.mergeRequestConfig(config);
    const response = await this.client.get<ApiResponse<T>>(url, mergedConfig);
    return response.data;
  }
  
  public async post<T = unknown>(url: string, data?: unknown, config?: RequestConfig): Promise<ApiResponse<T>> {
    const mergedConfig = this.mergeRequestConfig(config);
    const response = await this.client.post<ApiResponse<T>>(url, data, mergedConfig);
    return response.data;
  }
  
  public async put<T = unknown>(url: string, data?: unknown, config?: RequestConfig): Promise<ApiResponse<T>> {
    const mergedConfig = this.mergeRequestConfig(config);
    const response = await this.client.put<ApiResponse<T>>(url, data, mergedConfig);
    return response.data;
  }
  
  public async patch<T = unknown>(url: string, data?: unknown, config?: RequestConfig): Promise<ApiResponse<T>> {
    const mergedConfig = this.mergeRequestConfig(config);
    const response = await this.client.patch<ApiResponse<T>>(url, data, mergedConfig);
    return response.data;
  }
  
  public async delete<T = unknown>(url: string, config?: RequestConfig): Promise<ApiResponse<T>> {
    const mergedConfig = this.mergeRequestConfig(config);
    const response = await this.client.delete<ApiResponse<T>>(url, mergedConfig);
    return response.data;
  }
  
  public async uploadFile<T = unknown>(
    url: string,
    file: File,
    fieldName = 'file',
    additionalData?: Record<string, string | Blob>
  ): Promise<ApiResponse<T>> {
    const formData = new FormData();
    formData.append(fieldName, file);
    
    if (additionalData) {
      Object.keys(additionalData).forEach(key => {
        formData.append(key, additionalData[key]);
      });
    }
    
    const config: RequestConfig = {
      headers: {}
    };
    
    return this.post<T>(url, formData, config);
  }
  
  public createCancelToken() {
    return axios.CancelToken.source();
  }
}
