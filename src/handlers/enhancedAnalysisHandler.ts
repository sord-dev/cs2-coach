import { z } from 'zod';
import { LeetifyAPIClient } from '../services/leetify/index.js';
import { IAICoachService } from '../services/ollama/interface.js';
import { LeetifyDataTransformer } from '../services/analysis/index.js';
import { safeJsonStringify } from '../utils/helpers.js';

const EnhancedAnalysisRequestSchema = z.object({
  playerId: z.string(),
  matchCount: z.number().min(5).max(50).default(20),
  components: z.array(z.enum(['tilt_detection', 'performance_state', 'correlation_analysis', 'pattern_recognition', 'all'])).default(['all']),
  includeBaseline: z.boolean().default(true),
  skipAI: z.boolean().default(true)  // Changed: AI skipped by default for fast analysis
});

export class EnhancedAnalysisHandler {
  constructor(
    private leetifyClient: LeetifyAPIClient,
    private ollamaService: IAICoachService,
    private dataTransformer: LeetifyDataTransformer
  ) {}

  /**
   * Handles enhanced analysis requests with granular component selection.
   */
  async handleEnhancedAnalysis(args: unknown): Promise<any> {
    const validatedArgs = EnhancedAnalysisRequestSchema.parse(args);
    
    // Get player data
    const playerProfile = await this.leetifyClient.getPlayerProfile(validatedArgs.playerId);
    const matchHistory = await this.leetifyClient.getMatchHistory(
      validatedArgs.playerId,
      validatedArgs.matchCount
    );

    // Set adaptive thresholds based on player's premier rating
    this.dataTransformer.setAdaptiveThresholds(playerProfile.ranks?.premier);

    // Validate sufficient data for enhanced analysis
    if (matchHistory.length < 5) {
      return {
        content: [
          {
            type: 'text',
            text: safeJsonStringify({
              type: 'enhanced_analysis_error',
              error: 'Insufficient match data',
              message: `Enhanced analysis requires at least 5 matches, but only ${matchHistory.length} found`,
              playerId: validatedArgs.playerId,
              generatedAt: new Date().toISOString()
            }, 2)
          }
        ]
      };
    }

    try {
      // Generate enhanced analysis
      const enhancedAnalysis = await this.dataTransformer.generateEnhancedAnalysis(
        matchHistory,
        validatedArgs.playerId
      );

      // Filter components based on request
      const filteredAnalysis = this.filterAnalysisComponents(enhancedAnalysis, validatedArgs.components);

      // Defensive deep clone to avoid circular references
      const clone = (obj: any) => JSON.parse(JSON.stringify(obj));
      const filteredAnalysisClone = clone(filteredAnalysis);
      const enhancedAnalysisClone = clone(enhancedAnalysis);

      // Get basic analysis for context if needed
      const basicAnalysis = validatedArgs.includeBaseline ? 
        this.dataTransformer.processMatches(matchHistory, validatedArgs.playerId) : null;

      let response;
      if (validatedArgs.skipAI) {
        // Return raw analysis without AI interpretation
        response = {
          enhancedAnalysis: filteredAnalysisClone,
          basicAnalysis,
          playerProfile,
          metadata: {
            matchCount: matchHistory.length,
            analysisComponents: validatedArgs.components,
            dataQuality: this.assessDataQuality(enhancedAnalysisClone),
            generatedAt: new Date().toISOString(),
            analysisType: 'enhanced_statistical'
          }
        };
      } else {
        // Generate AI insights about the enhanced analysis
        const aiRequest = {
          enhancedAnalysis: filteredAnalysisClone,
          basicAnalysis,
          playerProfile,
          playerId: validatedArgs.playerId,
          components: validatedArgs.components
        };
        response = await this.ollamaService.analyzeEnhancedData(aiRequest);
      }

      return {
        content: [
          {
            type: 'text',
            text: safeJsonStringify({
              type: 'enhanced_analysis',
              playerId: validatedArgs.playerId,
              components: validatedArgs.components,
              matchCount: validatedArgs.matchCount,
              response,
              generatedAt: new Date().toISOString()
            }, 2)
          }
        ]
      };

    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: safeJsonStringify({
              type: 'enhanced_analysis_error',
              error: 'Analysis failed',
              message: error instanceof Error ? error.message : 'Unknown error occurred',
              playerId: validatedArgs.playerId,
              generatedAt: new Date().toISOString()
            }, 2)
          }
        ]
      };
    }
  }

  /**
   * Filters enhanced analysis components based on user request.
   */
  private filterAnalysisComponents(analysis: any, components: string[]): any {
    if (components.includes('all')) {
      return analysis;
    }

    const filtered: any = {
      warnings: analysis.warnings || []
    };

    if (components.includes('tilt_detection')) {
      filtered.performanceStateAnalysis = {
        detectedPatterns: {
          tiltIndicators: analysis.performanceStateAnalysis?.detectedPatterns?.tiltIndicators
        }
      };
    }

    if (components.includes('performance_state')) {
      filtered.performanceStateAnalysis = {
        ...filtered.performanceStateAnalysis,
        currentState: analysis.performanceStateAnalysis?.currentState,
        detectedPatterns: {
          ...filtered.performanceStateAnalysis?.detectedPatterns,
          flowStateIndicators: analysis.performanceStateAnalysis?.detectedPatterns?.flowStateIndicators
        }
      };
    }

    if (components.includes('correlation_analysis')) {
      filtered.metricCorrelationAnalysis = analysis.metricCorrelationAnalysis;
    }

    if (components.includes('pattern_recognition')) {
      filtered.patternAnalysis = {
        momentum: analysis.momentum,
        cascades: analysis.cascades,
        contextual: analysis.contextual
      };
    }

    // Always include predictive warnings if they exist
    if (analysis.predictiveWarningSystem) {
      filtered.predictiveWarningSystem = analysis.predictiveWarningSystem;
    }

    return filtered;
  }

  /**
   * Assesses the quality of the enhanced analysis data.
   */
  private assessDataQuality(analysis: any): any {
    const warnings = Array.isArray(analysis.warnings) ? analysis.warnings : [];
    const qualityScore = warnings.length === 0 ? 'high' : 
                        warnings.length <= 2 ? 'moderate' : 'low';
    return {
      score: qualityScore,
      issues: warnings,
      reliability: qualityScore === 'high' ? 'Very reliable' :
                   qualityScore === 'moderate' ? 'Moderately reliable' :
                   'Limited reliability - interpret with caution'
    };
  }
}