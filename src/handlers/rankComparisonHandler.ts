import { RankComparisonSchema } from '../types/index.js';
import { LeetifyAPIClient } from '../services/leetify/index.js';
import { IAICoachService } from '../services/ollama/interface.js';
import { LeetifyDataTransformer } from '../services/analysis/index.js';

import { safeJsonStringify } from '../utils/helpers.js';

export class RankComparisonHandler {
  constructor(
    private leetifyClient: LeetifyAPIClient,
    private ollamaService: IAICoachService,
    private dataTransformer: LeetifyDataTransformer
  ) {}

  /**
   * Handles rank comparison requests.
   */
  async handleRankComparison(args: unknown): Promise<any> {
    const validatedArgs = RankComparisonSchema.parse(args);
    // Coerce skipAI to boolean (handle string values from LLM)
    let skipAI: boolean = false;
    if (typeof validatedArgs.skipAI === 'string') {
      skipAI = (validatedArgs.skipAI as string).trim().toLowerCase() === 'true';
    } else if (typeof validatedArgs.skipAI === 'boolean') {
      skipAI = validatedArgs.skipAI;
    } else {
      skipAI = false;
    }

    const playerProfile = await this.leetifyClient.getPlayerProfile(validatedArgs.playerId);
    const playerStats = await this.leetifyClient.getMatchHistory(
      validatedArgs.playerId,
      10
    );
    const rankBenchmarks = await this.leetifyClient.getRankBenchmarks(validatedArgs.targetRank);
    const comparison = this.dataTransformer.compareToRank(
      playerStats,
      rankBenchmarks,
      validatedArgs.playerId
    );
    let coachingResponse;
    if (skipAI) {
      coachingResponse = {
        skippedAI: true,
        comparison,
        playerProfile,
        note: 'AI analysis skipped as requested.'
      };
    } else {
      coachingResponse = await this.ollamaService.analyzeRankComparison({
        ...validatedArgs,
        comparison,
        playerProfile,
      });
    }
    return {
      content: [
        {
          type: 'text',
          text: safeJsonStringify({
            type: 'rank_comparison',
            playerId: validatedArgs.playerId,
            targetRank: validatedArgs.targetRank,
            timeRange: validatedArgs.timeRange,
            response: coachingResponse,
            generatedAt: new Date().toISOString(),
          }, 2),
        },
      ],
    };
  }
}
