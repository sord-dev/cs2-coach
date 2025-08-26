/**
 * Error handling middleware for HTTP API
 */

import { ErrorResponse } from '../types.js';
import { CORS_HEADERS } from './cors.js';

/**
 * Formats MCP tool result for HTTP response
 */
export function formatHTTPResponse(mcpResult: any): any {
  if (mcpResult.content && mcpResult.content[0] && mcpResult.content[0].text) {
    try {
      return JSON.parse(mcpResult.content[0].text);
    } catch {
      return { result: mcpResult.content[0].text };
    }
  }
  return mcpResult;
}

/**
 * Formats error for HTTP response
 */
export function formatHTTPError(error: any): ErrorResponse {
  return {
    error: 'Internal Server Error',
    message: error instanceof Error ? error.message : 'Unknown error occurred',
    timestamp: new Date().toISOString(),
  };
}

/**
 * Creates an error response
 */
export function createErrorResponse(
  status: number,
  error: string,
  message: string,
  code?: string
): Response {
  const errorResponse: ErrorResponse = {
    error,
    message,
    timestamp: new Date().toISOString(),
    ...(code && { code }),
  };

  return new Response(JSON.stringify(errorResponse), {
    status,
    headers: { 'Content-Type': 'application/json', ...CORS_HEADERS }
  });
}

/**
 * Creates a success response
 */
export function createSuccessResponse(data: any): Response {
  return new Response(JSON.stringify(data), {
    status: 200,
    headers: { 'Content-Type': 'application/json', ...CORS_HEADERS }
  });
}