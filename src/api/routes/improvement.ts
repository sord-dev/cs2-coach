/**
 * Improvement tracking endpoint
 */

import { ImprovementHandler } from '../../handlers/improvementHandler.js';
import { createSuccessResponse, createErrorResponse, formatHTTPResponse } from '../middleware/errorHandler.js';

/**
 * Handles improvement tracking requests
 */
export async function improvementTrackingHandler(
  request: Request,
  handler: ImprovementHandler
): Promise<Response> {
  try {
    const body = await request.json();
    const result = await handler.handleImprovementTracking(body);
    const formattedResult = formatHTTPResponse(result);
    
    return createSuccessResponse(formattedResult);
  } catch (error) {
    return createErrorResponse(
      500,
      'Internal Server Error',
      error instanceof Error ? error.message : 'Unknown error occurred'
    );
  }
}