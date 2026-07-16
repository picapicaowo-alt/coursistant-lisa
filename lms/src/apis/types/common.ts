export interface ApiResponse<T = any> {
  code: number;
  message: string;
  data: T;
  timestamp: number;
}

export interface ApiError {
  code: number;
  message: string;
  details?: Record<string, any>;
}