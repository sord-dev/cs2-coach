import { CoachingRequestSchema } from '../types/index.js';
import { LeetifyAPIClient } from '../services/leetify/index.js';
import { IAICoachService } from '../services/ollama/interface.js';
import { LeetifyDataTransformer } from '../services/analysis/index.js';
import { safeJsonStringify } from '../utils/helpers.js';
export class CoachingHandler {
  constructor(
    private leetifyClient: LeetifyAPIClient,
    private ollamaService: IAICoachService,
    private dataTransformer: LeetifyDataTransformer
  ) {}

  /**
   * Handles general coaching advice requests with enhanced analysis capabilities.
   */
  async handleCoachingAdvice(args: unknown): Promise<any> {
    try {
      console.error('CoachingHandler: Starting coaching advice request');
      console.error('CoachingHandler: Args received:', JSON.stringify(args));
    const validatedArgs = CoachingRequestSchema.parse(args);
    const playerProfile = await this.leetifyClient.getPlayerProfile(validatedArgs.playerId);
    const matchHistory = await this.leetifyClient.getMatchHistory(
      validatedArgs.playerId,
      validatedArgs.matchCount
    );

    // Set adaptive thresholds based on player's premier rating
    this.dataTransformer.setAdaptiveThresholds(playerProfile.ranks?.premier);

    // Decide whether to use enhanced analysis based on data availability and match count
    const useEnhancedAnalysis = this.shouldUseEnhancedAnalysis(matchHistory, validatedArgs);
    
    let analysis: any;
    let enhancedAnalysis: any = null;
    
    if (useEnhancedAnalysis) {
      try {
        // Generate both basic and enhanced analysis
        analysis = this.dataTransformer.processMatches(matchHistory, validatedArgs.playerId);
        enhancedAnalysis = await this.dataTransformer.generateEnhancedAnalysis(
          matchHistory, 
          validatedArgs.playerId
        );
      } catch (error) {
        console.warn('Enhanced analysis failed, falling back to basic analysis:', error);
        analysis = this.dataTransformer.processMatches(matchHistory, validatedArgs.playerId);
      }
    } else {
      // Use basic analysis only
      analysis = this.dataTransformer.processMatches(matchHistory, validatedArgs.playerId);
    }

    let response;
    if (validatedArgs.skipAI) {
      response = {
        analysis,
        enhancedAnalysis,
        playerProfile,
        aiAnalysis: 'Skipped for faster response',
        recommendations: this.generateBasicRecommendations(analysis, enhancedAnalysis),
        practiceRoutine: this.generateBasicPracticeRoutine(analysis, enhancedAnalysis),
        confidence: enhancedAnalysis ? 0.9 : 0.7,
        generatedAt: new Date(),
        analysisType: useEnhancedAnalysis ? 'enhanced' : 'basic',
        warnings: enhancedAnalysis?.warnings || []
      };
    } else {
      // Enhanced AI analysis with additional context
      const aiRequest = {
        analysis,
        playerProfile,
        playerId: validatedArgs.playerId,
        analysisType: validatedArgs.analysisType,
        timeRange: validatedArgs.timeRange,
        matchCount: validatedArgs.matchCount,
        skipAI: validatedArgs.skipAI,
        enhancedAnalysis
      };
      
      response = await this.ollamaService.analyzeGameplay(aiRequest);
    }

    return {
      content: [
        {
          type: 'text',
          text: safeJsonStringify({
            type: 'coaching_advice',
            playerId: validatedArgs.playerId,
            analysisType: validatedArgs.analysisType,
            timeRange: validatedArgs.timeRange,
            skipAI: validatedArgs.skipAI,
            enhancedAnalysisUsed: useEnhancedAnalysis,
            response,
            generatedAt: new Date().toISOString(),
          }, 2),
        },
      ],
    };
    
    } catch (error) {
      console.error('CoachingHandler: Error occurred:', error);
      console.error('CoachingHandler: Stack trace:', error instanceof Error ? error.stack : 'No stack trace');
      
      return {
        content: [
          {
            type: 'text',
            text: safeJsonStringify({
              type: 'error',
              errorType: 'coaching_handler_error',
              message: error instanceof Error ? error.message : 'Unknown error occurred',
              timestamp: new Date().toISOString(),
            }, 2),
          },
        ],
        isError: true,
      };
    }
  }

  /**
   * Determines whether to use enhanced analysis based on data quality and availability.
   */
  private shouldUseEnhancedAnalysis(matchHistory: any[], validatedArgs: any): boolean {
    // Use enhanced analysis if we have sufficient data
    if (matchHistory.length < 5) {
      return false; // Too few matches for meaningful enhanced analysis
    }

    // Check if extended metrics are available
    const hasExtendedMetrics = matchHistory.some(match => 
      match.rawPlayerStats && (
        match.rawPlayerStats.preaim || 
        match.rawPlayerStats.reaction_time || 
        match.rawPlayerStats.spray_accuracy
      )
    );

    // Enable enhanced analysis for sufficient data with extended metrics
    return matchHistory.length >= 10 || hasExtendedMetrics;
  }

  /**
   * Generates basic recommendations when AI is skipped.
   */
  private generateBasicRecommendations(analysis: any, enhancedAnalysis: any): any[] {
    const recommendations: any[] = [];

    // Basic recommendations from standard analysis
    if (analysis.weaknesses && analysis.weaknesses.length > 0) {
      recommendations.push({
        category: 'general',
        priority: 'high',
        title: 'Address Key Weaknesses',
        description: analysis.weaknesses.join(', '),
        actionItems: analysis.weaknesses.map((w: string) => `Focus on improving: ${w}`),
        expectedImprovement: 'Performance consistency and rating improvement'
      });
    }

    // Enhanced recommendations from advanced analysis
    if (enhancedAnalysis) {
      // Tilt detection recommendations
      if (enhancedAnalysis.performanceStateAnalysis.detectedPatterns.tiltIndicators.active) {
        recommendations.push({
          category: 'mental',
          priority: 'high',
          title: 'Tilt Management Required',
          description: enhancedAnalysis.performanceStateAnalysis.detectedPatterns.tiltIndicators.prediction,
          actionItems: [enhancedAnalysis.performanceStateAnalysis.currentState.recommendedAction || 'Take a break'],
          expectedImprovement: 'Reduced performance volatility and better decision making'
        });
      }

      // Performance driver recommendations
      if (enhancedAnalysis.metricCorrelationAnalysis.primaryPerformanceDrivers.length > 0) {
        const topDriver = enhancedAnalysis.metricCorrelationAnalysis.primaryPerformanceDrivers[0];
        recommendations.push({
          category: 'skill',
          priority: 'medium',
          title: `Focus on ${topDriver.metric}`,
          description: topDriver.insight,
          actionItems: [topDriver.threshold],
          expectedImprovement: 'Targeted skill improvement with highest impact'
        });
      }

      // Predictive alert recommendations
      enhancedAnalysis.predictiveWarningSystem.immediateAlerts.forEach((alert: any) => {
        if (alert.severity !== 'low') {
          recommendations.push({
            category: 'warning',
            priority: alert.severity === 'high' ? 'high' : 'medium',
            title: alert.alertType.replace('_', ' '),
            description: alert.evidence,
            actionItems: [alert.recommendedAction],
            expectedImprovement: alert.prediction
          });
        }
      });
    }

    return recommendations;
  }

  /**
   * Generates basic practice routine when AI is skipped.
   */
  private generateBasicPracticeRoutine(analysis: any, enhancedAnalysis: any): any {
    const routine = {
      warmup: ['5 minutes aim_botz', '10 minutes deathmatch'],
      aimTraining: [] as string[],
      mapPractice: [] as string[],
      tacticalReview: [] as string[],
      estimatedTime: 30
    };

    // Add specific training based on weaknesses
    if (analysis.weaknesses) {
      analysis.weaknesses.forEach((weakness: string) => {
        if (weakness.includes('aim') || weakness.includes('crosshair')) {
          routine.aimTraining.push('Practice crosshair placement in aim_botz');
          routine.aimTraining.push('Focus on pre-aiming common angles');
        }
        if (weakness.includes('impact') || weakness.includes('rating')) {
          routine.tacticalReview.push('Review recent deaths and positioning mistakes');
          routine.mapPractice.push('Study common angles and timings');
        }
      });
    }

    // Enhanced routine based on performance state
    if (enhancedAnalysis?.performanceStateAnalysis.currentState.classification === 'mechanical_inconsistency') {
      routine.aimTraining.push('Extended aim training session (20+ minutes)');
      routine.aimTraining.push('Focus on spray control patterns');
      routine.estimatedTime += 15;
    }

    // Ensure minimum content
    if (routine.aimTraining.length === 0) {
      routine.aimTraining.push('General aim practice in aim_botz');
    }
    if (routine.mapPractice.length === 0) {
      routine.mapPractice.push('Practice smoke lineups for main maps');
    }
    if (routine.tacticalReview.length === 0) {
      routine.tacticalReview.push('Review recent match demos');
    }

    return routine;
  }
}
