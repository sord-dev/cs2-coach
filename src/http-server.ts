/**
 * HTTP server for deployment environments (Cloudflare Workers, Vercel, etc.)
 * Provides REST API endpoints for CS2 coaching analysis
 */

import { LeetifyAPIClient } from './services/leetify/index.js';
import { NoOpAIService } from './services/ollama/noop.js';
import { IAICoachService } from './services/ollama/interface.js';
import { LeetifyDataTransformer } from './services/data-transformer/index.js';
import { CoachingHandler } from './handlers/coachingHandler.js';
import { AreaAnalysisHandler } from './handlers/areaAnalysisHandler.js';
import { ImprovementHandler } from './handlers/improvementHandler.js';
import { RankComparisonHandler } from './handlers/rankComparisonHandler.js';
import { EnhancedAnalysisHandler } from './handlers/enhancedAnalysisHandler.js';

/**
 * HTTP-based CS2 Coach service for serverless deployment
 * Uses NoOp AI service by default for maximum compatibility
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
   * Handles coaching advice requests
   */
  async handleCoachingAdvice(request: any): Promise<any> {
    try {
      const result = await this.coachingHandler.handleCoachingAdvice(request);
      return this.formatHTTPResponse(result);
    } catch (error) {
      return this.formatHTTPError(error);
    }
  }

  /**
   * Handles specific area analysis requests
   */
  async handleAreaAnalysis(request: any): Promise<any> {
    try {
      const result = await this.areaAnalysisHandler.handleSpecificAreaAnalysis(request);
      return this.formatHTTPResponse(result);
    } catch (error) {
      return this.formatHTTPError(error);
    }
  }

  /**
   * Handles improvement tracking requests
   */
  async handleImprovementTracking(request: any): Promise<any> {
    try {
      const result = await this.improvementHandler.handleImprovementTracking(request);
      return this.formatHTTPResponse(result);
    } catch (error) {
      return this.formatHTTPError(error);
    }
  }

  /**
   * Handles rank comparison requests
   */
  async handleRankComparison(request: any): Promise<any> {
    try {
      const result = await this.rankComparisonHandler.handleRankComparison(request);
      return this.formatHTTPResponse(result);
    } catch (error) {
      return this.formatHTTPError(error);
    }
  }

  /**
   * Handles enhanced analysis requests
   */
  async handleEnhancedAnalysis(request: any): Promise<any> {
    try {
      const result = await this.enhancedAnalysisHandler.handleEnhancedAnalysis(request);
      return this.formatHTTPResponse(result);
    } catch (error) {
      return this.formatHTTPError(error);
    }
  }

  /**
   * Handles generic HTTP requests and routes to appropriate handler
   */
  async handleHTTPRequest(request: Request): Promise<Response> {
    try {
      const url = new URL(request.url);
      const path = url.pathname;

      // CORS headers for browser compatibility
      const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      };

      // Handle CORS preflight
      if (request.method === 'OPTIONS') {
        return new Response(null, { status: 200, headers: corsHeaders });
      }

      // Health check endpoint
      if (path === '/health') {
        return new Response(JSON.stringify({ 
          status: 'healthy', 
          mode: 'statistical_analysis',
          ai_enabled: false,
          timestamp: new Date().toISOString() 
        }), {
          status: 200,
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
      }

      // API endpoints
      if (request.method === 'POST') {
        const body = await request.json();

        let result;
        switch (path) {
          case '/api/coaching-advice':
            result = await this.handleCoachingAdvice(body);
            break;
          case '/api/analyze-area':
            result = await this.handleAreaAnalysis(body);
            break;
          case '/api/track-improvement':
            result = await this.handleImprovementTracking(body);
            break;
          case '/api/compare-to-rank':
            result = await this.handleRankComparison(body);
            break;
          case '/api/enhanced-analysis':
            result = await this.handleEnhancedAnalysis(body);
            break;
          default:
            return new Response(JSON.stringify({
              error: 'Not Found',
              message: `Endpoint ${path} not found`,
              availableEndpoints: [
                '/api/coaching-advice',
                '/api/analyze-area', 
                '/api/track-improvement',
                '/api/compare-to-rank',
                '/api/enhanced-analysis'
              ]
            }), {
              status: 404,
              headers: { 'Content-Type': 'application/json', ...corsHeaders }
            });
        }

        return new Response(JSON.stringify(result), {
          status: 200,
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
      }

      // Method not allowed
      return new Response(JSON.stringify({
        error: 'Method Not Allowed',
        message: 'Only POST requests are supported for API endpoints'
      }), {
        status: 405,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });

    } catch (error) {
      const errorResponse = this.formatHTTPError(error);
      return new Response(JSON.stringify(errorResponse), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }

  /**
   * Formats MCP tool result for HTTP response
   */
  private formatHTTPResponse(mcpResult: any): any {
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
  private formatHTTPError(error: any): any {
    return {
      error: 'Internal Server Error',
      message: error instanceof Error ? error.message : 'Unknown error occurred',
      timestamp: new Date().toISOString(),
    };
  }
}

// Export for Cloudflare Workers
export default {
  async fetch(request: Request): Promise<Response> {
    const service = new CS2CoachHTTPService();
    return service.handleHTTPRequest(request);
  }
};