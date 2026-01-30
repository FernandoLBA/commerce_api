export interface ApiSuccessResponse<T> {
  statusCode: number;
  data: T;
  timestamp: string;
  path: string;
}

export interface ApiErrorResponse {
  statusCode: number;
  error: {
    code: string;
    message: string;
    details?: Record<string, unknown> | string[];
  };
  timestamp: string;
  path: string;
}

export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;
