
// Moved from detection/tilt-detector.ts


import { roundTo } from '../../utils/helpers.js';
import { TILT_THRESHOLDS, RECOVERY_PATTERNS } from '../utils.js';
import type { PersonalBaseline, TiltAnalysis, ExtendedMatchData, TiltIndicator, PredictionResult } from '../../types/index.js';

/**
 * Detects tilt states using extended metrics and cascade analysis.
 * Based on research showing correlation between reaction time >650ms and poor performance.
 */
export class TiltDetector {
  private readonly TILT_THRESHOLDS = TILT_THRESHOLDS;
  private readonly RECOVERY_PATTERNS = RECOVERY_PATTERNS;

  /**
   * Detects tilt state from recent match data.
   * 
   * @param recentMatches - Recent match data (recommended 5-10 matches)
   * @param baseline - Personal baseline for comparison
   * @param adaptiveThresholds - Optional adaptive thresholds based on player rank
   * @returns Comprehensive tilt analysis
   */
  detectTiltState(
    recentMatches: ExtendedMatchData[], 
    baseline: PersonalBaseline, 
    adaptiveThresholds?: typeof TILT_THRESHOLDS
  ): TiltAnalysis {
    if (recentMatches.length < 2) {
      return this.createNoTiltAnalysis('Insufficient data for tilt detection');
    }

    // Store adaptive thresholds for use in detection methods
    const currentThresholds = adaptiveThresholds || this.TILT_THRESHOLDS;
    
    // Detect various tilt indicators (using stored thresholds internally)
    const indicators = this.detectTiltIndicators(recentMatches, baseline);
    
    // Calculate overall tilt severity
    const severity = this.calculateTiltSeverity(indicators);
    
    // Determine if tilt is active
    const isActive = indicators.length > 0 && severity !== 'low';
    
    // Calculate cascade length
    const cascadeLength = this.calculateCascadeLength(recentMatches, baseline);
    
    // Generate recovery prediction
    const recoveryPrediction = this.generateRecoveryPrediction(indicators, cascadeLength);
    
    // Generate recommended action
    const recommendedAction = this.generateRecommendedAction(severity, indicators);

    return {
      active: isActive,
      severity,
      triggers: indicators.map(i => i.description),
      cascadeLength,
      recoveryPrediction,
      recommendedAction
    };
  }

  /**
   * Calculates overall tilt severity from individual indicators.
   * 
   * @param indicators - Array of tilt indicators
   * @returns Overall severity level
   */
  calculateTiltSeverity(indicators: TiltIndicator[]): "low" | "moderate" | "high" {
    if (indicators.length === 0) return 'low';

    const severityScores = {
      'low': 1,
      'moderate': 2,
      'high': 3
    };

    // Calculate weighted severity score
    const totalScore = indicators.reduce((sum, indicator) => {
      return sum + severityScores[indicator.severity];
    }, 0);

    const averageScore = totalScore / indicators.length;

    // Apply multiplier for multiple indicators
    const multiplier = Math.min(1 + (indicators.length - 1) * 0.2, 2.0);

    const finalScore = averageScore * multiplier;

    if (finalScore >= 2.5) return 'high';
    if (finalScore >= 1.5) return 'moderate';
    return 'low';
  }
  /**
   * Predicts next match performance based on current tilt state.
   * 
   * @param currentState - Current tilt analysis
   * @returns Performance prediction with confidence
   */
  predictNextMatchPerformance(currentState: TiltAnalysis): PredictionResult {
    const baselineRating = 1.0; // Default baseline
    let ratingPrediction = baselineRating;
    let confidence = 0.5;
    let recommendedAction = 'Continue playing normally';
    let recoveryProbability = this.RECOVERY_PATTERNS.recoverySuccessRate;

    if (!currentState.active) {
      ratingPrediction = baselineRating;
      confidence = 0.8;
      recommendedAction = 'Performance is stable, continue current approach';
      recoveryProbability = 1.0;
    } else {
      // Apply severity-based performance degradation
      const degradationFactor = this.getSeverityDegradationFactor(currentState.severity);
      ratingPrediction = baselineRating * (1 - degradationFactor);
      
      // Reduce confidence based on cascade length
      confidence = Math.max(0.2, 0.7 - (currentState.cascadeLength * 0.1));
      
      // Adjust recovery probability based on cascade length
      recoveryProbability = Math.max(0.2, this.RECOVERY_PATTERNS.recoverySuccessRate - (currentState.cascadeLength * 0.1));
      
      recommendedAction = this.generatePredictiveRecommendation(currentState);
    }

    return {
      nextMatchRating: roundTo(ratingPrediction, 3),
      confidence: roundTo(confidence, 2),
      recommendedAction,
      recoveryProbability: roundTo(recoveryProbability, 2)
    };
  }

  /**
   * Detects specific tilt indicators from match data.
   */
  private detectTiltIndicators(matches: ExtendedMatchData[], baseline: PersonalBaseline): TiltIndicator[] {
    const indicators: TiltIndicator[] = [];

    // Check reaction time degradation
    const reactionTimeIndicator = this.checkReactionTimeIndicator(matches);
    if (reactionTimeIndicator) indicators.push(reactionTimeIndicator);

    // Check preaim degradation
    const preaimIndicator = this.checkPreaimIndicator(matches);
    if (preaimIndicator) indicators.push(preaimIndicator);

    // Check rating cascade
    const ratingIndicator = this.checkRatingCascade(matches, baseline);
    if (ratingIndicator) indicators.push(ratingIndicator);

    // Check performance consistency
    const consistencyIndicator = this.checkConsistencyLoss(matches);
    if (consistencyIndicator) indicators.push(consistencyIndicator);

    // Check utility efficiency decline
    const utilityIndicator = this.checkUtilityDecline(matches);
    if (utilityIndicator) indicators.push(utilityIndicator);

    return indicators;
  }

  /**
   * Checks for reaction time degradation (>650ms threshold).
   */
  private checkReactionTimeIndicator(matches: ExtendedMatchData[]): TiltIndicator | null {
    const recentReactionTimes = matches
      .slice(0, 3) // Check last 3 matches
      .map(match => match.rawPlayerStats?.reaction_time || 0)
      .filter(rt => rt > 0);

    if (recentReactionTimes.length === 0) return null;

    const averageReactionTime = recentReactionTimes.reduce((a, b) => a + b, 0) / recentReactionTimes.length;

    if (averageReactionTime > this.TILT_THRESHOLDS.reactionTimeThreshold) {
      const severity: 'low' | 'moderate' | 'high' = 
        averageReactionTime > 0.8 ? 'high' :
        averageReactionTime > 0.7 ? 'moderate' : 'low';

      return {
        type: 'reaction_time',
        severity,
        value: roundTo(averageReactionTime, 3),
        threshold: this.TILT_THRESHOLDS.reactionTimeThreshold,
        description: `Reaction time elevated (${Math.round(averageReactionTime * 1000)}ms avg) - indicates stress/fatigue`
      };
    }

    return null;
  }

  /**
   * Checks for preaim degradation (crosshair placement decline).
   */
  private checkPreaimIndicator(matches: ExtendedMatchData[]): TiltIndicator | null {
    const preaimValues = matches
      .slice(0, 5) // Check last 5 matches
      .map(match => match.rawPlayerStats?.preaim || 0)
      .filter(pa => pa > 0);

    if (preaimValues.length < 2) return null;

    // Calculate degradation trend
    const recent = preaimValues.slice(0, Math.ceil(preaimValues.length / 2));
    const older = preaimValues.slice(Math.floor(preaimValues.length / 2));

    const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length;
    const olderAvg = older.reduce((a, b) => a + b, 0) / older.length;

    if (olderAvg > 0) {
      const degradation = (olderAvg - recentAvg) / olderAvg;

      if (degradation > this.TILT_THRESHOLDS.preaim_degradation) {
        const severity: 'low' | 'moderate' | 'high' = 
          degradation > 0.3 ? 'high' :
          degradation > 0.2 ? 'moderate' : 'low';

        return {
          type: 'preaim_degradation',
          severity,
          value: roundTo(degradation, 3),
          threshold: this.TILT_THRESHOLDS.preaim_degradation,
          description: `Crosshair placement degraded by ${Math.round(degradation * 100)}% - indicates aim inconsistency`
        };
      }
    }

    return null;
  }

  /**
   * Checks for consecutive negative ratings (cascade pattern).
   */
  private checkRatingCascade(matches: ExtendedMatchData[], baseline: PersonalBaseline): TiltIndicator | null {
    if (baseline.sampleSize < 10) return null; // Need reliable baseline

    const recentRatings = matches.slice(0, 5).map(match => match.playerStats.rating);
    let consecutiveNegative = 0;

    for (const rating of recentRatings) {
      if (rating < baseline.value * (1 - this.TILT_THRESHOLDS.ratingDropThreshold)) {
        consecutiveNegative++;
      } else {
        break; // Break streak
      }
    }

    if (consecutiveNegative >= this.TILT_THRESHOLDS.consecutiveNegativeRatings) {
      const severity: 'low' | 'moderate' | 'high' = 
        consecutiveNegative >= 5 ? 'high' :
        consecutiveNegative >= 4 ? 'moderate' : 'low';

      return {
        type: 'rating_cascade',
        severity,
        value: consecutiveNegative,
        threshold: this.TILT_THRESHOLDS.consecutiveNegativeRatings,
        description: `${consecutiveNegative} consecutive matches below baseline - indicates performance cascade`
      };
    }

    return null;
  }

  /**
   * Checks for performance consistency loss.
   */
  private checkConsistencyLoss(matches: ExtendedMatchData[]): TiltIndicator | null {
    if (matches.length < 4) return null;

    const ratings = matches.slice(0, 6).map(match => match.playerStats.rating);
    const mean = ratings.reduce((a, b) => a + b, 0) / ratings.length;
    const variance = ratings.reduce((sum, rating) => sum + Math.pow(rating - mean, 2), 0) / ratings.length;
    const coefficient = Math.sqrt(variance) / mean;

    if (coefficient > this.TILT_THRESHOLDS.consistencyThreshold) {
      const severity: 'low' | 'moderate' | 'high' = 
        coefficient > 0.5 ? 'high' :
        coefficient > 0.4 ? 'moderate' : 'low';

      return {
        type: 'consistency_loss',
        severity,
        value: roundTo(coefficient, 3),
        threshold: this.TILT_THRESHOLDS.consistencyThreshold,
        description: `High performance variance (${Math.round(coefficient * 100)}%) - indicates inconsistent play`
      };
    }

    return null;
  }

  /**
   * Checks for utility efficiency decline.
   */
  private checkUtilityDecline(matches: ExtendedMatchData[]): TiltIndicator | null {
    const utilityEfficiencies = matches
      .slice(0, 5)
      .map(match => this.calculateUtilityEfficiency(match.rawPlayerStats))
      .filter(eff => eff > 0);

    if (utilityEfficiencies.length < 3) return null;

    const recent = utilityEfficiencies.slice(0, Math.ceil(utilityEfficiencies.length / 2));
    const older = utilityEfficiencies.slice(Math.floor(utilityEfficiencies.length / 2));

    const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length;
    const olderAvg = older.reduce((a, b) => a + b, 0) / older.length;

    if (olderAvg > 0) {
      const decline = (olderAvg - recentAvg) / olderAvg;

      if (decline > this.TILT_THRESHOLDS.utilityEfficiencyDrop) {
        const severity: 'low' | 'moderate' | 'high' = 
          decline > 0.4 ? 'high' :
          decline > 0.3 ? 'moderate' : 'low';

        return {
          type: 'utility_decline',
          severity,
          value: roundTo(decline, 3),
          threshold: this.TILT_THRESHOLDS.utilityEfficiencyDrop,
          description: `Utility efficiency dropped ${Math.round(decline * 100)}% - indicates tactical degradation`
        };
      }
    }

    return null;
  }

  /**
   * Calculates the length of the current tilt cascade.
   */
  private calculateCascadeLength(matches: ExtendedMatchData[], baseline: PersonalBaseline): number {
    if (baseline.sampleSize < 10) return 0;

    let cascadeLength = 0;
    const thresholdRating = baseline.value * (1 - this.TILT_THRESHOLDS.ratingDropThreshold);

    for (const match of matches) {
      if (match.playerStats.rating < thresholdRating) {
        cascadeLength++;
      } else {
        break; // End of cascade
      }
    }

    return cascadeLength;
  }

  /**
   * Generates recovery prediction based on indicators and cascade length.
   */
  private generateRecoveryPrediction(indicators: TiltIndicator[], cascadeLength: number): string {
    if (indicators.length === 0) {
      return 'No recovery needed - performance stable';
    }

    const averageRecoveryTime = this.RECOVERY_PATTERNS.averageRecoveryTime + (cascadeLength * 0.5);
    const recoveryChance = Math.max(0.3, this.RECOVERY_PATTERNS.recoverySuccessRate - (cascadeLength * 0.1));

    return `Expected recovery in ${Math.round(averageRecoveryTime)} matches with ${Math.round(recoveryChance * 100)}% probability`;
  }

  /**
   * Generates recommended action based on tilt severity and indicators.
   */
  private generateRecommendedAction(severity: 'low' | 'moderate' | 'high', indicators: TiltIndicator[]): string {
    if (severity === 'low') {
      return 'Monitor performance - consider short break if trend continues';
    }

    if (severity === 'moderate') {
      const hasReactionTime = indicators.some(i => i.type === 'reaction_time');
      if (hasReactionTime) {
        return 'Take 15-30 minute break to reset focus and reaction time';
      }
      return 'Consider adjusting playstyle or taking short break';
    }

    // High severity
    const actionTypes = indicators.map(i => i.type);
    if (actionTypes.includes('reaction_time') && actionTypes.includes('preaim_degradation')) {
      return 'Take extended break (1+ hour) - multiple mechanical indicators suggest fatigue';
    }
    if (actionTypes.includes('rating_cascade')) {
      return 'Stop playing ranked matches - practice aim/mechanics before returning';
    }
    return 'Take significant break - performance severely degraded';
  }

  /**
   * Generates predictive recommendation for next match.
   */
  private generatePredictiveRecommendation(currentState: TiltAnalysis): string {
    if (currentState.severity === 'high') {
      return 'Strongly recommend break before next match - high probability of continued poor performance';
    }
    if (currentState.cascadeLength >= 3) {
      return 'Pattern suggests continued decline - consider warmup routine before next match';
    }
    return 'Monitor closely - adjust strategy if performance doesn\'t improve';
  }

  /**
   * Gets performance degradation factor based on severity.
   */
  private getSeverityDegradationFactor(severity: 'low' | 'moderate' | 'high'): number {
    switch (severity) {
      case 'low': return 0.05; // 5% degradation
      case 'moderate': return 0.15; // 15% degradation
      case 'high': return 0.25; // 25% degradation
    }
  }

  /**
   * Calculates utility efficiency from raw player stats.
   */
  private calculateUtilityEfficiency(rawStats: any): number {
    if (!rawStats) return 0;

    const totalUtility = (rawStats.smoke_thrown || 0) + (rawStats.flashbang_thrown || 0) + (rawStats.he_thrown || 0);
    if (totalUtility === 0) return 0;

    const effectiveUtility = (rawStats.flashbang_hit_foe || 0) + 
                           (rawStats.he_foes_damage_avg > 0 ? 1 : 0);

    return (effectiveUtility / totalUtility) * 100;
  }

  /**
   * Creates analysis result indicating no tilt detected.
   */
  private createNoTiltAnalysis(reason: string): TiltAnalysis {
    return {
      active: false,
      severity: 'low',
      triggers: [],
      cascadeLength: 0,
      recoveryPrediction: reason,
      recommendedAction: 'Continue current performance approach'
    };
  }
}

/**
 * Singleton instance for global tilt detection access.
 */
export const tiltDetector = new TiltDetector();