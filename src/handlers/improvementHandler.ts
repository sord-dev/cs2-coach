import { ImprovementTrackingSchema } from '../types/index.js';
import { LeetifyAPIClient } from '../services/leetify/index.js';
import { IAICoachService } from '../services/ollama/interface.js';
import { LeetifyDataTransformer } from '../services/analysis/leetify-data-transformer.js';

import { safeJsonStringify } from '../utils/helpers.js';

export class ImprovementHandler {
  constructor(
    private leetifyClient: LeetifyAPIClient,
    private ollamaService: IAICoachService,
    private dataTransformer: LeetifyDataTransformer
  ) {}

  /**
   * Handles improvement tracking requests.
   */
  async handleImprovementTracking(args: unknown): Promise<any> {
    const validatedArgs = ImprovementTrackingSchema.parse(args);
    const improvementData = await this.leetifyClient.getImprovementData(
      validatedArgs.playerId,
      validatedArgs.fromDate,
      validatedArgs.toDate
    );
    const trends = this.dataTransformer.calculateImprovementTrends(
      improvementData,
      validatedArgs.metrics
    );
    const coachingResponse = await this.ollamaService.analyzeImprovement({
      ...validatedArgs,
      trends,
    });
    return {
      content: [
        {
          type: 'text',
          text: safeJsonStringify({
            type: 'improvement_tracking',
            playerId: validatedArgs.playerId,
            timeRange: `${validatedArgs.fromDate} to ${validatedArgs.toDate}`,
            metrics: validatedArgs.metrics,
            response: coachingResponse,
            generatedAt: new Date().toISOString(),
          }, 2),
        },
      ],
    };
  }
}
