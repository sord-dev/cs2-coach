import { SpecificAreaAnalysisSchema } from '../types/index.js';
import { LeetifyAPIClient } from '../services/leetify/index.js';
import { IAICoachService } from '../services/ollama/interface.js';
import { LeetifyDataTransformer } from '../services/analysis/leetify-data-transformer.js';
import { safeJsonStringify } from '../utils/helpers.js';

export class AreaAnalysisHandler {
  constructor(
    private leetifyClient: LeetifyAPIClient,
    private ollamaService: IAICoachService,
    private dataTransformer: LeetifyDataTransformer
  ) {}

  /**
   * Handles specific area analysis requests.
   */
  async handleSpecificAreaAnalysis(args: unknown): Promise<any> {
    const validatedArgs = SpecificAreaAnalysisSchema.parse(args);
    const playerProfile = await this.leetifyClient.getPlayerProfile(validatedArgs.playerId);
    const matchHistory = await this.leetifyClient.getMatchHistory(
      validatedArgs.playerId,
      validatedArgs.matchCount
    );
    const analysis = this.dataTransformer.processMatches(matchHistory, validatedArgs.playerId);
    const specificAnalysis = this.dataTransformer.analyzeSpecificArea(analysis, validatedArgs.area);
    let response;
    if (validatedArgs.skipAI) {
      response = {
        analysis: specificAnalysis,
        playerProfile,
        aiAnalysis: 'Skipped for faster response',
        recommendations: [],
        practiceRoutine: { warmup: [], aimTraining: [], mapPractice: [], tacticalReview: [], estimatedTime: 0 },
        confidence: 1.0,
        generatedAt: new Date().toISOString(),
      };
    } else {
      response = await this.ollamaService.analyzeSpecificArea({
        ...validatedArgs,
        analysis: specificAnalysis,
        playerProfile,
      });
    }
    return {
      content: [
        {
          type: 'text',
          text: safeJsonStringify({
            type: 'specific_area_analysis',
            playerId: validatedArgs.playerId,
            area: validatedArgs.area,
            timeRange: validatedArgs.timeRange,
            skipAI: validatedArgs.skipAI,
            response,
            generatedAt: new Date().toISOString(),
          }, 2),
        },
      ],
    };
  }
}
