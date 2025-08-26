/**
 * Rank comparison endpoint
 */

import { RankComparisonHandler } from '../../handlers/rankComparisonHandler.js';
import { createSuccessResponse, createErrorResponse, formatHTTPResponse } from '../middleware/errorHandler.js';

/**
 * Handles rank comparison requests
 */
export async function rankComparisonHandler(
  request: Request,
  handler: RankComparisonHandler
): Promise<Response> {
  try {
    const body = await request.json();
    const result = await handler.handleRankComparison(body);
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