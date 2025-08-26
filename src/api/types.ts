/**
 * HTTP API specific types and interfaces
 */

export interface APIResponse<T = any> {
  data?: T;
  error?: string;
  message?: string;
  timestamp: string;
}

export interface ErrorResponse {
  error: string;
  message: string;
  timestamp: string;
  code?: string;
}

export interface HealthResponse {
  status: string;
  mode: string;
  ai_enabled: boolean;
  timestamp: string;
}

export interface RouteHandler {
  (request: Request): Promise<Response>;
}

export interface Middleware {
  (request: Request, next: () => Promise<Response>): Promise<Response>;
}