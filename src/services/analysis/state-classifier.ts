/**
 * Performance state classifier using research-based pattern recognition.
 * Classifies performance into distinct states with evidence-based reasoning.
 */

import { roundTo } from '../../utils/helpers.js';
import { STATE_PATTERNS } from '../utils.js';
import { tiltDetector } from '../analysis/index.js';

import type { LeetifyMatchData, RawPlayerStats, PlayerAnalysis, PersonalBaseline } from '../../types/index.js';

interface ExtendedMatchData extends LeetifyMatchData {
  rawPlayerStats?: RawPlayerStats;
}

interface StateEvidence {
  metric: string;
  value: number;
  threshold: number;
  impact: 'positive' | 'negative';
  description: string;
}

interface StateClassificationResult {
  classification: "mechanical_inconsistency" | "tilt_cascade" | "flow_state" | "baseline_normal";
  confidence: number;
  evidence: string[];
  baselineDeviation: Record<string, string>;
  primaryFactors: StateEvidence[];
  recommendations: string[];
}

/**
 * Classifies performance states using multi-dimensional analysis.
 * Based on research patterns from processed example data.
 */
export class PerformanceStateClassifier {
  // Research-based state patterns (imported from constants)
  private readonly STATE_PATTERNS = STATE_PATTERNS;

  /**
   * Classifies current performance state from recent match data.
   * 
   * @param analysis - Player analysis data
   * @param baseline - Personal baseline for comparison
   * @param recentMatches - Recent match data for detailed analysis
   * @returns Complete state classification with evidence
   */
  classifyCurrentState(
    analysis: PlayerAnalysis, 
    baseline: PersonalBaseline,
    recentMatches?: ExtendedMatchData[]
  ): StateClassificationResult {
    const evidence: StateEvidence[] = [];
    const baselineDeviations: Record<string, string> = {};

    // Analyze each potential state
    const mechanicalScore = this.analyzeMechanicalConsistency(analysis, recentMatches, evidence);
    const tiltScore = this.analyzeTiltCascade(analysis, baseline, recentMatches, evidence);
    const flowScore = this.analyzeFlowState(analysis, baseline, recentMatches, evidence);
    const baselineScore = this.analyzeBaselineNormal(analysis, baseline, evidence);

    // Calculate baseline deviations
    this.calculateBaselineDeviations(analysis, baseline, baselineDeviations);

    // Determine primary classification
    const scores = {
      mechanical_inconsistency: mechanicalScore,
      tilt_cascade: tiltScore,
      flow_state: flowScore,
      baseline_normal: baselineScore
    };

    const primaryState = Object.entries(scores).reduce((max, [state, score]) => 
      score > max.score ? { state, score } : max, 
      { state: 'baseline_normal', score: 0 }
    );

    const classification = primaryState.state as "mechanical_inconsistency" | "tilt_cascade" | "flow_state" | "baseline_normal";
    const confidence = this.calculateClassificationConfidence(scores, evidence.length);

    return {
      classification,
      confidence: roundTo(confidence, 2),
      evidence: evidence.map(e => e.description),
      baselineDeviation: baselineDeviations,
      primaryFactors: evidence.filter(e => e.impact === 'negative' || classification === 'flow_state'),
      recommendations: this.generateStateRecommendations(classification, evidence)
    };
  }

  /**
   * Analyzes mechanical consistency indicators.
   */
  private analyzeMechanicalConsistency(
    analysis: PlayerAnalysis, 
    recentMatches?: ExtendedMatchData[], 
    evidence: StateEvidence[] = []
  ): number {
    let score = 0;

    // Check performance variance
    if (analysis.recentPerformance.length >= 3) {
      const ratings = analysis.recentPerformance.map(p => p.rating);
      const mean = ratings.reduce((a, b) => a + b, 0) / ratings.length;
      const variance = ratings.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) / ratings.length;
      const coefficientOfVariation = Math.sqrt(variance) / mean;

      if (coefficientOfVariation > this.STATE_PATTERNS.mechanical_inconsistency.ratingVariance) {
        score += 3;
        evidence.push({
          metric: 'rating_variance',
          value: roundTo(coefficientOfVariation, 3),
          threshold: this.STATE_PATTERNS.mechanical_inconsistency.ratingVariance,
          impact: 'negative',
          description: `High rating variance (${Math.round(coefficientOfVariation * 100)}%) indicates mechanical inconsistency`
        });
      }
    }

    // Check extended mechanical metrics if available
    if (recentMatches) {
      const mechanicalAnalysis = this.analyzeExtendedMechanics(recentMatches);
      
      if (mechanicalAnalysis.reactionTimeVariance > this.STATE_PATTERNS.mechanical_inconsistency.reactionTimeVariance) {
        score += 2;
        evidence.push({
          metric: 'reaction_time_variance',
          value: roundTo(mechanicalAnalysis.reactionTimeVariance, 3),
          threshold: this.STATE_PATTERNS.mechanical_inconsistency.reactionTimeVariance,
          impact: 'negative',
          description: `Reaction time inconsistency (${Math.round(mechanicalAnalysis.reactionTimeVariance * 100)}% variance)`
        });
      }

      if (mechanicalAnalysis.preaimRange > this.STATE_PATTERNS.mechanical_inconsistency.preaim_instability) {
        score += 2;
        evidence.push({
          metric: 'preaim_instability',
          value: roundTo(mechanicalAnalysis.preaimRange, 1),
          threshold: this.STATE_PATTERNS.mechanical_inconsistency.preaim_instability,
          impact: 'negative',
          description: `Crosshair placement instability (${mechanicalAnalysis.preaimRange.toFixed(1)}° range)`
        });
      }
    }

    return score;
  }

  /**
   * Analyzes tilt cascade indicators.
   */
  private analyzeTiltCascade(
    analysis: PlayerAnalysis, 
    baseline: PersonalBaseline, 
    recentMatches?: ExtendedMatchData[], 
    evidence: StateEvidence[] = []
  ): number {
    let score = 0;

    if (baseline.sampleSize < 10) return 0; // Need reliable baseline

    // Check for consecutive performance declines
    const recentRatings = analysis.recentPerformance.slice(0, 5).map(p => p.rating);
    const thresholdRating = baseline.value * (1 - this.STATE_PATTERNS.tilt_cascade.ratingDropPercentage);
    
    let consecutiveDeclines = 0;
    for (const rating of recentRatings) {
      if (rating < thresholdRating) {
        consecutiveDeclines++;
      } else {
        break;
      }
    }

    if (consecutiveDeclines >= this.STATE_PATTERNS.tilt_cascade.consecutiveDeclines) {
      score += 4;
      evidence.push({
        metric: 'consecutive_declines',
        value: consecutiveDeclines,
        threshold: this.STATE_PATTERNS.tilt_cascade.consecutiveDeclines,
        impact: 'negative',
        description: `${consecutiveDeclines} consecutive matches below baseline indicates tilt cascade`
      });
    }

    // Check cascade acceleration
    if (recentRatings.length >= 4) {
      const early = recentRatings.slice(-2);
      const recent = recentRatings.slice(0, 2);
      const earlyAvg = early.reduce((a, b) => a + b, 0) / early.length;
      const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length;
      
      if (earlyAvg > 0) {
        const acceleration = (earlyAvg - recentAvg) / earlyAvg;
        if (acceleration > this.STATE_PATTERNS.tilt_cascade.cascadeAcceleration) {
          score += 2;
          evidence.push({
            metric: 'cascade_acceleration',
            value: roundTo(acceleration, 3),
            threshold: this.STATE_PATTERNS.tilt_cascade.cascadeAcceleration,
            impact: 'negative',
            description: `Performance decline accelerating (${Math.round(acceleration * 100)}% degradation)`
          });
        }
      }
    }

    // Use tilt detector for additional validation
    if (recentMatches) {
      const tiltAnalysis = tiltDetector.detectTiltState(recentMatches, baseline);
      if (tiltAnalysis.active && tiltAnalysis.severity !== 'low') {
        score += tiltAnalysis.severity === 'high' ? 3 : 2;
        evidence.push({
          metric: 'tilt_detection',
          value: tiltAnalysis.cascadeLength,
          threshold: 2,
          impact: 'negative',
          description: `Tilt detector confirms ${tiltAnalysis.severity} severity state`
        });
      }
    }

    return score;
  }

  /**
   * Analyzes flow state indicators.
   */
  private analyzeFlowState(
    analysis: PlayerAnalysis, 
    baseline: PersonalBaseline, 
    recentMatches?: ExtendedMatchData[], 
    evidence: StateEvidence[] = []
  ): number {
    let score = 0;

    if (baseline.sampleSize < 10) return 0; // Need reliable baseline

    // Check rating boost
    const currentRating = analysis.averageStats.rating;
    const ratingBoost = (currentRating - baseline.value) / baseline.value;
    
    if (ratingBoost > this.STATE_PATTERNS.flow_state.ratingBoost) {
      score += 3;
      evidence.push({
        metric: 'rating_boost',
        value: roundTo(ratingBoost, 3),
        threshold: this.STATE_PATTERNS.flow_state.ratingBoost,
        impact: 'positive',
        description: `Performance ${Math.round(ratingBoost * 100)}% above baseline indicates flow state`
      });
    }

    // Check extended mechanics if available
    if (recentMatches) {
      const mechanicalAnalysis = this.analyzeExtendedMechanics(recentMatches);
      
      // Check preaim excellence
      if (mechanicalAnalysis.averagePreaim > 0 && mechanicalAnalysis.averagePreaim < this.STATE_PATTERNS.flow_state.preaim_threshold) {
        score += 2;
        evidence.push({
          metric: 'preaim_excellence',
          value: roundTo(mechanicalAnalysis.averagePreaim, 1),
          threshold: this.STATE_PATTERNS.flow_state.preaim_threshold,
          impact: 'positive',
          description: `Excellent crosshair placement (${mechanicalAnalysis.averagePreaim.toFixed(1)}° avg)`
        });
      }

      // Check reaction time excellence
      if (mechanicalAnalysis.averageReactionTime > 0 && mechanicalAnalysis.averageReactionTime < this.STATE_PATTERNS.flow_state.reactionTime_threshold) {
        score += 2;
        evidence.push({
          metric: 'reaction_time_excellence',
          value: roundTo(mechanicalAnalysis.averageReactionTime, 3),
          threshold: this.STATE_PATTERNS.flow_state.reactionTime_threshold,
          impact: 'positive',
          description: `Fast reaction time (${Math.round(mechanicalAnalysis.averageReactionTime * 1000)}ms avg)`
        });
      }

      // Check utility efficiency
      if (mechanicalAnalysis.utilityEfficiency > this.STATE_PATTERNS.flow_state.utilityEfficiencyThreshold) {
        score += 1;
        evidence.push({
          metric: 'utility_efficiency',
          value: roundTo(mechanicalAnalysis.utilityEfficiency, 2),
          threshold: this.STATE_PATTERNS.flow_state.utilityEfficiencyThreshold,
          impact: 'positive',
          description: `High utility efficiency (${Math.round(mechanicalAnalysis.utilityEfficiency * 100)}%)`
        });
      }
    }

    // Check consistency bonus
    if (analysis.recentPerformance.length >= 3) {
      const ratings = analysis.recentPerformance.map(p => p.rating);
      const mean = ratings.reduce((a, b) => a + b, 0) / ratings.length;
      const variance = ratings.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) / ratings.length;
      const consistency = 1 - (Math.sqrt(variance) / mean);

      if (consistency > (1 - this.STATE_PATTERNS.flow_state.consistencyBonus)) {
        score += 1;
        evidence.push({
          metric: 'consistency_bonus',
          value: roundTo(consistency, 3),
          threshold: 1 - this.STATE_PATTERNS.flow_state.consistencyBonus,
          impact: 'positive',
          description: `High consistency (${Math.round(consistency * 100)}%) indicates sustained flow`
        });
      }
    }

    return score;
  }

  /**
   * Analyzes baseline normal indicators.
   */
  private analyzeBaselineNormal(
    analysis: PlayerAnalysis, 
    baseline: PersonalBaseline, 
    evidence: StateEvidence[] = []
  ): number {
    let score = 0;

    if (baseline.sampleSize < 10) return 5; // Default to normal if no baseline

    // Check rating deviation
    const currentRating = analysis.averageStats.rating;
    const ratingDeviation = Math.abs(currentRating - baseline.value) / baseline.value;

    if (ratingDeviation <= this.STATE_PATTERNS.baseline_normal.ratingDeviationRange) {
      score += 3;
      evidence.push({
        metric: 'rating_stability',
        value: roundTo(ratingDeviation, 3),
        threshold: this.STATE_PATTERNS.baseline_normal.ratingDeviationRange,
        impact: 'positive',
        description: `Performance within normal baseline range (±${Math.round(ratingDeviation * 100)}%)`
      });
    }

    // Check consistency
    if (analysis.recentPerformance.length >= 3) {
      const ratings = analysis.recentPerformance.map(p => p.rating);
      const mean = ratings.reduce((a, b) => a + b, 0) / ratings.length;
      const variance = ratings.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) / ratings.length;
      const coefficientOfVariation = Math.sqrt(variance) / mean;

      if (coefficientOfVariation <= this.STATE_PATTERNS.baseline_normal.consistencyThreshold) {
        score += 2;
        evidence.push({
          metric: 'performance_consistency',
          value: roundTo(coefficientOfVariation, 3),
          threshold: this.STATE_PATTERNS.baseline_normal.consistencyThreshold,
          impact: 'positive',
          description: `Consistent performance (${Math.round(coefficientOfVariation * 100)}% variance)`
        });
      }
    }

    return score;
  }

  /**
   * Analyzes extended mechanical metrics from raw match data.
   */
  private analyzeExtendedMechanics(recentMatches: ExtendedMatchData[]): {
    reactionTimeVariance: number;
    preaimRange: number;
    averagePreaim: number;
    averageReactionTime: number;
    utilityEfficiency: number;
  } {
    const reactionTimes = recentMatches
      .map(m => m.rawPlayerStats?.reaction_time || 0)
      .filter(rt => rt > 0);
    
    const preaimValues = recentMatches
      .map(m => m.rawPlayerStats?.preaim || 0)
      .filter(pa => pa > 0);

    const utilityEfficiencies = recentMatches
      .map(m => this.calculateUtilityEfficiency(m.rawPlayerStats))
      .filter(eff => eff > 0);

    // Calculate reaction time variance
    let reactionTimeVariance = 0;
    if (reactionTimes.length > 1) {
      const rtMean = reactionTimes.reduce((a, b) => a + b, 0) / reactionTimes.length;
      const rtVariance = reactionTimes.reduce((sum, rt) => sum + Math.pow(rt - rtMean, 2), 0) / reactionTimes.length;
      reactionTimeVariance = Math.sqrt(rtVariance) / rtMean;
    }

    // Calculate preaim range
    const preaimRange = preaimValues.length > 0 ? 
      Math.max(...preaimValues) - Math.min(...preaimValues) : 0;

    // Calculate averages
    const averagePreaim = preaimValues.length > 0 ? 
      preaimValues.reduce((a, b) => a + b, 0) / preaimValues.length : 0;
    
    const averageReactionTime = reactionTimes.length > 0 ? 
      reactionTimes.reduce((a, b) => a + b, 0) / reactionTimes.length : 0;

    const utilityEfficiency = utilityEfficiencies.length > 0 ?
      utilityEfficiencies.reduce((a, b) => a + b, 0) / utilityEfficiencies.length / 100 : 0;

    return {
      reactionTimeVariance,
      preaimRange,
      averagePreaim,
      averageReactionTime,
      utilityEfficiency
    };
  }

  /**
   * Calculates baseline deviations for all metrics.
   */
  private calculateBaselineDeviations(
    analysis: PlayerAnalysis, 
    baseline: PersonalBaseline, 
    deviations: Record<string, string>
  ): void {
    if (baseline.sampleSize < 10) {
      deviations.general = 'Insufficient baseline data for reliable comparison';
      return;
    }

    const currentRating = analysis.averageStats.rating;
    const ratingDeviation = ((currentRating - baseline.value) / baseline.value) * 100;
    
    deviations.rating = `${ratingDeviation >= 0 ? '+' : ''}${ratingDeviation.toFixed(1)}%`;
    
    if (Math.abs(ratingDeviation) > 20) {
      deviations.significance = 'Highly significant deviation';
    } else if (Math.abs(ratingDeviation) > 10) {
      deviations.significance = 'Moderate deviation';
    } else {
      deviations.significance = 'Within normal range';
    }
  }

  /**
   * Calculates classification confidence based on evidence strength.
   */
  private calculateClassificationConfidence(scores: Record<string, number>, evidenceCount: number): number {
    const maxScore = Math.max(...Object.values(scores));
    const totalScore = Object.values(scores).reduce((a, b) => a + b, 0);
    
    // Base confidence on score dominance
    const dominance = totalScore > 0 ? maxScore / totalScore : 0.5;
    
    // Adjust for evidence count
    const evidenceBonus = Math.min(evidenceCount * 0.1, 0.3);
    
    // Calculate final confidence
    const confidence = Math.min(0.5 + (dominance * 0.4) + evidenceBonus, 0.95);
    
    return confidence;
  }

  /**
   * Generates state-specific recommendations.
   */
  private generateStateRecommendations(
    classification: "mechanical_inconsistency" | "tilt_cascade" | "flow_state" | "baseline_normal",
    evidence: StateEvidence[]
  ): string[] {
    const recommendations: string[] = [];

    switch (classification) {
      case 'mechanical_inconsistency':
        recommendations.push('Focus on aim training and mechanical consistency');
        recommendations.push('Practice crosshair placement in aim_botz');
        recommendations.push('Work on counter-strafing and shot timing');
        if (evidence.some(e => e.metric === 'reaction_time_variance')) {
          recommendations.push('Consider fatigue management - take regular breaks');
        }
        break;

      case 'tilt_cascade':
        recommendations.push('Take immediate break to reset mental state');
        recommendations.push('Review recent deaths to identify pattern causes');
        recommendations.push('Practice aim warmup before returning to matches');
        recommendations.push('Consider switching to unranked matches temporarily');
        break;

      case 'flow_state':
        recommendations.push('Maintain current approach - avoid major changes');
        recommendations.push('Stay hydrated and maintain focus');
        recommendations.push('Continue playing while performance is elevated');
        recommendations.push('Take note of current settings and conditions');
        break;

      case 'baseline_normal':
        recommendations.push('Performance is stable - continue current practice routine');
        recommendations.push('Consider working on specific skill areas for improvement');
        recommendations.push('Maintain consistent warmup and practice schedule');
        break;
    }

    return recommendations;
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
}

/**
 * Singleton instance for global state classification access.
 */
export const performanceStateClassifier = new PerformanceStateClassifier();