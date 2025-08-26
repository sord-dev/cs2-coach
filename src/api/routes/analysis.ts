/**
 * Analysis endpoints (area analysis and enhanced analysis)
 */

import { AreaAnalysisHandler } from '../../handlers/areaAnalysisHandler.js';
import { EnhancedAnalysisHandler } from '../../handlers/enhancedAnalysisHandler.js';
import { createSuccessResponse, createErrorResponse, formatHTTPResponse } from '../middleware/errorHandler.js';

/**
 * Handles area-specific analysis requests
 */
export async function areaAnalysisHandler(
  request: Request,
  handler: AreaAnalysisHandler
): Promise<Response> {
  try {
    const body = await request.json();
    const result = await handler.handleSpecificAreaAnalysis(body);
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

/**
 * Handles enhanced analysis requests
 */
export async function enhancedAnalysisHandler(
  request: Request,
  handler: EnhancedAnalysisHandler
): Promise<Response> {
  try {
    const body = await request.json();
    const result = await handler.handleEnhancedAnalysis(body);
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