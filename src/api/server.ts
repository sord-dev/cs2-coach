/**
 * Modular HTTP server implementation for CS2 Coach API
 * Clean separation of routes, middleware, and business logic
 */

import { LeetifyAPIClient } from '../services/leetify/index.js';
import { IAICoachService } from '../services/ollama/interface.js';
import { NoOpAIService } from '../services/ollama/noop.js'
import { LeetifyDataTransformer } from '../services/analysis/index.js';

// Handlers
import { CoachingHandler } from '../handlers/coachingHandler.js';
import { AreaAnalysisHandler } from '../handlers/areaAnalysisHandler.js';
import { ImprovementHandler } from '../handlers/improvementHandler.js';
import { RankComparisonHandler } from '../handlers/rankComparisonHandler.js';
import { EnhancedAnalysisHandler } from '../handlers/enhancedAnalysisHandler.js';

// Route handlers
import { healthHandler } from './routes/health.js';
import { coachingAdviceHandler } from './routes/coaching.js';
import { areaAnalysisHandler, enhancedAnalysisHandler } from './routes/analysis.js';
import { improvementTrackingHandler } from './routes/improvement.js';
import { rankComparisonHandler } from './routes/rank.js';

// Middleware
import { handleCorsPrelight, addCorsHeaders } from './middleware/cors.js';
import { createErrorResponse } from './middleware/errorHandler.js';

/**
 * Main HTTP service class with modular route handling
 */
export class CS2CoachHTTPService {
  private leetifyClient: LeetifyAPIClient;
  private aiService: IAICoachService;
  private dataTransformer: LeetifyDataTransformer;
  private coachingHandler: CoachingHandler;
  private areaAnalysisHandler: AreaAnalysisHandler;
  private improvementHandler: ImprovementHandler;
  private rankComparisonHandler: RankComparisonHandler;
  private enhancedAnalysisHandler: EnhancedAnalysisHandler;

  constructor() {
    // Initialize services optimized for deployment
    this.leetifyClient = new LeetifyAPIClient();
    this.aiService = new NoOpAIService(); // AI-free for serverless deployment
    this.dataTransformer = new LeetifyDataTransformer();

    // Initialize handlers
    this.coachingHandler = new CoachingHandler(this.leetifyClient, this.aiService, this.dataTransformer);
    this.areaAnalysisHandler = new AreaAnalysisHandler(this.leetifyClient, this.aiService, this.dataTransformer);
    this.improvementHandler = new ImprovementHandler(this.leetifyClient, this.aiService, this.dataTransformer);
    this.rankComparisonHandler = new RankComparisonHandler(this.leetifyClient, this.aiService, this.dataTransformer);
    this.enhancedAnalysisHandler = new EnhancedAnalysisHandler(this.leetifyClient, this.aiService, this.dataTransformer);
  }

  /**
   * Main request handler with clean route separation
   */
  async handleHTTPRequest(request: Request): Promise<Response> {
    try {
      const url = new URL(request.url);
      const path = url.pathname;

      // Handle CORS preflight
      if (request.method === 'OPTIONS') {
        return handleCorsPrelight();
      }

      // Route to appropriate handler
      let response: Response;

      if (path === '/health') {
        response = await healthHandler(request);
      } else if (request.method === 'POST') {
        response = await this.routePOSTRequest(path, request);
      } else {
        response = createErrorResponse(
          405,
          'Method Not Allowed',
          'Only POST requests are supported for API endpoints'
        );
      }

      // Add CORS headers to all responses
      return addCorsHeaders(response);

    } catch (error) {
      const errorResponse = createErrorResponse(
        500,
        'Internal Server Error',
        error instanceof Error ? error.message : 'Unknown error occurred'
      );
      return addCorsHeaders(errorResponse);
    }
  }

  /**
   * Routes POST requests to appropriate handlers
   */
  private async routePOSTRequest(path: string, request: Request): Promise<Response> {
    switch (path) {
      case '/api/coaching-advice':
        return coachingAdviceHandler(request, this.coachingHandler);

      case '/api/analyze-area':
        return areaAnalysisHandler(request, this.areaAnalysisHandler);

      case '/api/track-improvement':
        return improvementTrackingHandler(request, this.improvementHandler);

      case '/api/compare-to-rank':
        return rankComparisonHandler(request, this.rankComparisonHandler);

      case '/api/enhanced-analysis':
        return enhancedAnalysisHandler(request, this.enhancedAnalysisHandler);

      default:
        return createErrorResponse(
          404,
          'Not Found',
          `Endpoint ${path} not found`,
          'ENDPOINT_NOT_FOUND'
        );
    }
  }
}

// Export for Cloudflare Workers compatibility
export default {
  async fetch(request: Request): Promise<Response> {
    const service = new CS2CoachHTTPService();
    return service.handleHTTPRequest(request);
  }
};