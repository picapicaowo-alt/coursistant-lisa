import axios, {AxiosError, AxiosInstance, AxiosRequestConfig, AxiosResponse, InternalAxiosRequestConfig} from 'axios';
import {ApiError, ApiResponse} from './types';

export interface ApiClientConfig {
  baseURL: string;
  timeout?: number;
  headers?: Record<string, string>;
  withCredentials?: boolean;
}

export interface RequestConfig extends Omit<AxiosRequestConfig, 'url' | 'method'> {
  skipAuth?: boolean;
  retryCount?: number;
}

export class ApiClient {
  private readonly client: AxiosInstance;
  private config: ApiClientConfig;
  private accessToken?: string;
  
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
    this.accessToken = token;
    this.client.defaults.headers.common['Authorization'] = `Bearer ${this.accessToken}`;
  }
  
  public clearAccessToken(): void {
    this.accessToken = undefined;
    delete this.client.defaults.headers.common['Authorization'];
  }
  
  private handleRequest(config: InternalAxiosRequestConfig): InternalAxiosRequestConfig {
    config.headers = config.headers || {};
    
    config.headers['X-Request-Timestamp'] = Date.now().toString();
    
    const requestConfig = config as unknown as RequestConfig;
    if (requestConfig.skipAuth !== undefined && requestConfig.skipAuth) {
      delete config.headers.Authorization;
    } else {
      if (this.accessToken === undefined) {
        const token = localStorage.getItem('accToken');
        if (token !== null) {
          this.accessToken = token;
          config.headers.Authorization = `Bearer ${this.accessToken}`;
        }
      } else {
        config.headers.Authorization = `Bearer ${this.accessToken}`;
      }
    }
    
    console.log(`[API Request] ${config.method?.toUpperCase()} ${config.url}`, {
      headers: config.headers,
      data: config.data || ''
    });
    
    return config;
  }
  
  private handleRequestError(error: any): Promise<never> {
    return Promise.reject(error);
  }
  
  private handleResponse(response: AxiosResponse): AxiosResponse {
    if (process.env.NODE_ENV === 'development') {
      console.log(`[API Response] ${response.config.method?.toUpperCase()} ${response.config.url}`, {
        status: response.status,
        headers: response.headers,
        data: response.data
      });
    }
    
    return response;
  }
  
  private handleResponseError(error: AxiosError): Promise<never> {
    const apiError: ApiError = {
      code: error.response?.status || 0,
      message: error.message,
      details: error.response?.data as any
    };
    
    if (error.response?.status === 401) {
      return this.handleAuthError(error);
    }
    
    console.error('[API Error]', apiError);
    return Promise.reject(apiError);
  }
  
  private async handleAuthError(error: AxiosError): Promise<never> {
    return Promise.reject({
      code: 401,
      message: 'Authentication required',
      details: error.response?.data
    });
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
  
  public async get<T = any>(url: string, config?: RequestConfig): Promise<ApiResponse<T>> {
    const mergedConfig = this.mergeRequestConfig(config);
    const response = await this.client.get<ApiResponse<T>>(url, mergedConfig);
    return response.data;
  }
  
  public async post<T = any>(url: string, data?: any, config?: RequestConfig): Promise<ApiResponse<T>> {
    const mergedConfig = this.mergeRequestConfig(config);
    const response = await this.client.post<ApiResponse<T>>(url, data, mergedConfig);
    return response.data;
  }
  
  public async put<T = any>(url: string, data?: any, config?: RequestConfig): Promise<ApiResponse<T>> {
    const mergedConfig = this.mergeRequestConfig(config);
    const response = await this.client.put<ApiResponse<T>>(url, data, mergedConfig);
    return response.data;
  }
  
  public async patch<T = any>(url: string, data?: any, config?: RequestConfig): Promise<ApiResponse<T>> {
    const mergedConfig = this.mergeRequestConfig(config);
    const response = await this.client.patch<ApiResponse<T>>(url, data, mergedConfig);
    return response.data;
  }
  
  public async delete<T = any>(url: string, config?: RequestConfig): Promise<ApiResponse<T>> {
    const mergedConfig = this.mergeRequestConfig(config);
    const response = await this.client.delete<ApiResponse<T>>(url, mergedConfig);
    return response.data;
  }
  
  public async uploadFile<T = any>(
    url: string,
    file: File,
    fieldName = 'file',
    additionalData?: Record<string, any>
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