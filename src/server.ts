#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { 
  InitializeRequestSchema,
  ListToolsRequestSchema,
  CallToolRequestSchema
} from '@modelcontextprotocol/sdk/types.js';
import dotenv from 'dotenv';
import { LeetifyAPIClient } from './services/leetify/index.js';
import { OllamaCoachService } from './services/ollama/index.js';
import { NoOpAIService } from './services/ollama/noop.js';
import { IAICoachService } from './services/ollama/interface.js';
import { LeetifyDataTransformer } from './services/data-transformer/index.js';
import { CoachingHandler } from './handlers/coachingHandler.js';
import { AreaAnalysisHandler } from './handlers/areaAnalysisHandler.js';
import { ImprovementHandler } from './handlers/improvementHandler.js';
import { RankComparisonHandler } from './handlers/rankComparisonHandler.js';
import { EnhancedAnalysisHandler } from './handlers/enhancedAnalysisHandler.js';

import { ValidationError, LeetifyAPIError, OllamaError } from './types/index.js';
import { COMMANDS } from './commands/index.js';

// Load environment variables (Node.js environments only)
if (typeof process !== 'undefined' && process.env) {
  dotenv.config();
}

/**
 * CS2 AI Coach MCP Server
 * 
 * Provides personalized Counter-Strike 2 coaching advice through MCP protocol
 * using Leetify API data and local Ollama AI models.
 */
class CS2CoachServer {
  private server: Server;
  private leetifyClient: LeetifyAPIClient;
  private ollamaService: IAICoachService;
  private dataTransformer: LeetifyDataTransformer;
  private coachingHandler: CoachingHandler;
  private areaAnalysisHandler: AreaAnalysisHandler;
  private improvementHandler: ImprovementHandler;
  private rankComparisonHandler: RankComparisonHandler;
  private enhancedAnalysisHandler: EnhancedAnalysisHandler;

  constructor() {
    console.log('CS2CoachServer constructor called');
    this.server = new Server(
      {
        name: (typeof process !== 'undefined' && process.env?.MCP_SERVER_NAME) || 'cs2-coach',
        version: (typeof process !== 'undefined' && process.env?.MCP_SERVER_VERSION) || '1.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );
    console.log('Server instance created');

    try {
      console.log('Initializing LeetifyAPIClient...');
      this.leetifyClient = new LeetifyAPIClient();
      
      // Initialize AI service (Ollama or NoOp fallback)
      console.log('Initializing AI service...');
      this.ollamaService = this.initializeAIService();
      
      console.log('Initializing LeetifyDataTransformer...');
      this.dataTransformer = new LeetifyDataTransformer();
      // Initialize handlers
      this.coachingHandler = new CoachingHandler(this.leetifyClient, this.ollamaService, this.dataTransformer);
      this.areaAnalysisHandler = new AreaAnalysisHandler(this.leetifyClient, this.ollamaService, this.dataTransformer);
      this.improvementHandler = new ImprovementHandler(this.leetifyClient, this.ollamaService, this.dataTransformer);
      this.rankComparisonHandler = new RankComparisonHandler(this.leetifyClient, this.ollamaService, this.dataTransformer);
      this.enhancedAnalysisHandler = new EnhancedAnalysisHandler(this.leetifyClient, this.ollamaService, this.dataTransformer);
      console.log('Setting up handlers...');
      this.setupHandlers();
      console.log('CS2CoachServer initialization complete');
    } catch (error) {
      console.log('Error initializing CS2CoachServer services:', error);
      throw error;
    }
  }

  /**
   * Initializes AI service, falling back to NoOp if Ollama is unavailable.
   */
  private initializeAIService(): IAICoachService {
    const useAI = typeof process !== 'undefined' ? process.env?.DISABLE_AI !== 'true' : false;
    
    if (useAI) {
      try {
        console.log('Attempting to initialize Ollama service...');
        return new OllamaCoachService();
      } catch (error) {
        console.log('Failed to initialize Ollama service, falling back to NoOp:', error);
        return new NoOpAIService();
      }
    } else {
      console.log('AI disabled - using statistical analysis only');
      return new NoOpAIService();
    }
  }

  /**
   * Sets up MCP request handlers for the server.
   */
  private setupHandlers(): void {
    // Handle MCP initialize request
    this.server.setRequestHandler(InitializeRequestSchema, async () => ({
      protocolVersion: '2025-06-18',
      capabilities: {
        tools: {},
      },
      serverInfo: {
        name: 'cs2-coach',
        version: '1.0.0',
      },
    }));

    // Use embedded tool definitions for edge compatibility
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: COMMANDS,
    }));

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      try {
        const { name, arguments: args } = request.params;

        switch (name) {
          case 'get_coaching_advice':
            return await this.handleCoachingAdvice(args);
          case 'analyze_specific_area':
            return await this.handleSpecificAreaAnalysis(args);
          case 'track_improvement':
            return await this.handleImprovementTracking(args);
          case 'compare_to_rank':
            return await this.handleRankComparison(args);
          case 'get_enhanced_analysis':
            return await this.handleEnhancedAnalysis(args);
          default:
            throw new Error(`Unknown tool: ${name}`);
        }
      } catch (error) {
        return this.handleError(error);
      }
    });
  }

  /**
   * Handles general coaching advice requests.
   */
  private async handleCoachingAdvice(args: unknown): Promise<any> {
    return this.coachingHandler.handleCoachingAdvice(args);
  }

  /**
   * Handles specific area analysis requests.
   */
  private async handleSpecificAreaAnalysis(args: unknown): Promise<any> {
    return this.areaAnalysisHandler.handleSpecificAreaAnalysis(args);
  }

  /**
   * Handles improvement tracking requests.
   */
  private async handleImprovementTracking(args: unknown): Promise<any> {
    return this.improvementHandler.handleImprovementTracking(args);
  }

  /**
   * Handles rank comparison requests.
   */
  private async handleRankComparison(args: unknown): Promise<any> {
    return this.rankComparisonHandler.handleRankComparison(args);
  }

  /**
   * Handles enhanced analysis requests.
   */
  private async handleEnhancedAnalysis(args: unknown): Promise<any> {
    return this.enhancedAnalysisHandler.handleEnhancedAnalysis(args);
  }

  /**
   * Handles errors and returns structured error responses.
   */
  private handleError(error: unknown): any {
    let errorMessage: string;
    let errorType: string;

    if (error instanceof ValidationError) {
      errorMessage = `Validation error: ${error.message}`;
      errorType = 'validation_error';
    } else if (error instanceof LeetifyAPIError) {
      errorMessage = `Leetify API error: ${error.message}`;
      errorType = 'api_error';
    } else if (error instanceof OllamaError) {
      errorMessage = `AI model error: ${error.message}`;
      errorType = 'ai_error';
    } else if (error instanceof Error) {
      errorMessage = error.message;
      errorType = 'general_error';
    } else {
      try {
        errorMessage = typeof error === 'string' ? error : JSON.stringify(error);
      } catch {
        errorMessage = 'An unknown error occurred';
      }
      errorType = 'unknown_error';
    }

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            type: 'error',
            errorType,
            message: errorMessage,
            timestamp: new Date().toISOString(),
          }, null, 2),
        },
      ],
      isError: true,
    };
  }

  /**
   * Starts the MCP server.
   */
  async run(): Promise<void> {
    try {
      this.setupHandlers();
      const transport = new StdioServerTransport();
      await this.server.connect(transport);
      console.log('CS2 AI Coach MCP server running on stdio');
    } catch (error) {
      console.log('Error starting MCP server:', error);
      throw error;
    }
  }
}

/**
 * Entry point for the application.
 */
async function main(): Promise<void> {
  try {
    console.log('Main function called');
    const server = new CS2CoachServer();
    console.log('CS2CoachServer instantiated, calling run()');
    await server.run();
  } catch (error) {
    console.log('Failed to start CS2 Coach MCP server:', error);
    if (typeof process !== 'undefined') {
      process.exit(1);
    }
  }
}

// Start the server if this file is run directly (Node.js only)
if (typeof process !== 'undefined') {
  console.log('process.argv[1]:', process.argv[1]);
  const isMainModule = process.argv[1] && process.argv[1].endsWith('server.js');
  console.log('Script started, isMainModule:', isMainModule);
  if (isMainModule) {
    console.log('Starting main function...');
    main().catch((error) => {
      console.log('Unhandled error:', error);
      process.exit(1);
    });
  }
}