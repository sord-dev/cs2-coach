/**
 * Health check endpoint
 */

import { HealthResponse } from '../types.js';
import { createSuccessResponse } from '../middleware/errorHandler.js';

/**
 * Handles health check requests
 */
export async function healthHandler(request: Request): Promise<Response> {
  const healthData: HealthResponse = {
    status: 'healthy',
    mode: 'statistical_analysis',
    ai_enabled: false,
    timestamp: new Date().toISOString()
  };

  return createSuccessResponse(healthData);
}