/**
 * Coaching advice endpoint
 */

import { CoachingHandler } from '../../handlers/coachingHandler.js';
import { createSuccessResponse, createErrorResponse, formatHTTPResponse } from '../middleware/errorHandler.js';

/**
 * Handles coaching advice requests
 */
export async function coachingAdviceHandler(
  request: Request,
  coachingHandler: CoachingHandler
): Promise<Response> {
  try {
    const body = await request.json();
    const result = await coachingHandler.handleCoachingAdvice(body);
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