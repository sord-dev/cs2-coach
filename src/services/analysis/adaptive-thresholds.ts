import { getCS2RankBenchmarks } from '../../utils/helpers.js';
import { 
  strengthThresholds, 
  weaknessThresholds, 
  areaTargets, 
  TILT_THRESHOLDS,
  STATE_PATTERNS
} from '../utils.js';

/**
 * Maps CS2 premier rating to rank tier for adaptive thresholds.
 * Based on the accurate CS2 premier rating tier system.
 * 
 * @param premierRating - Player's premier rating (0-30000+)
 * @returns Rank tier string for benchmark lookup
 */
export function mapPremierRatingToRank(premierRating: number): string {
  // Gray (0-4,999): Entry level players - map to Silver
  if (premierRating < 5000) return 'silver';
  
  // Light Blue (5,000-9,999): Average players - map to Gold Nova  
  if (premierRating < 10000) return 'gold_nova';
  
  // Blue (10,000-14,999): Above average with solid fundamentals - map to MG
  if (premierRating < 15000) return 'mg';
  
  // Purple (15,000-19,999): Skilled players with advanced knowledge - map to DMG
  if (premierRating < 20000) return 'dmg';
  
  // Pink (20,000-24,999): Elite players approaching professional level - map to LE
  if (premierRating < 25000) return 'le';
  
  // Red (25,000-29,999): Top-tier players with exceptional skills - map to LEM
  if (premierRating < 30000) return 'lem';
  
  // Gold/Yellow (30,000+): Professional level players - map to Supreme/Global
  return 'supreme';
}

/**
 * Adaptive thresholds that adjust based on player's rank tier.
 * Higher ranked players have higher expectations.
 */
export class AdaptiveThresholds {
  private rankTier: string;
  private benchmarks: ReturnType<typeof getCS2RankBenchmarks>;

  constructor(premierRating: number = 10000) {
    this.rankTier = mapPremierRatingToRank(premierRating);
    this.benchmarks = getCS2RankBenchmarks(this.rankTier);
  }

  /**
   * Gets adaptive strength thresholds based on rank tier.
   * Higher ranks require better performance to be considered "strong".
   */
  getStrengthThresholds(): Record<string, number> {
    const rankMultipliers = {
      silver: 0.8,
      gold_nova: 0.9,
      mg: 1.0,
      dmg: 1.1,
      le: 1.2,
      lem: 1.3,
      supreme: 1.4,
      global: 1.5
    };

    const multiplier = rankMultipliers[this.rankTier as keyof typeof rankMultipliers] || 1.0;

    return {
      rating: this.benchmarks.rating * 1.2 * multiplier, // 20% above rank benchmark
      kdRatio: this.benchmarks.kdRatio * 1.15 * multiplier,
      adr: this.benchmarks.adr * 1.1 * multiplier,
      kast: this.benchmarks.kast * 1.05 * multiplier,
      headshotPercentage: this.benchmarks.headshotPercentage * 1.1 * multiplier
    };
  }

  /**
   * Gets adaptive weakness thresholds based on rank tier.
   * Lower ranks have more forgiving weakness thresholds.
   */
  getWeaknessThresholds(): Record<string, number> {
    const rankTolerances = {
      silver: 0.7,    // More forgiving for lower ranks
      gold_nova: 0.75,
      mg: 0.8,
      dmg: 0.85,
      le: 0.9,
      lem: 0.92,
      supreme: 0.95,
      global: 0.97
    };

    const tolerance = rankTolerances[this.rankTier as keyof typeof rankTolerances] || 0.8;

    return {
      rating: this.benchmarks.rating * tolerance,
      kdRatio: this.benchmarks.kdRatio * tolerance, 
      adr: this.benchmarks.adr * tolerance,
      kast: this.benchmarks.kast * tolerance,
      headshotPercentage: this.benchmarks.headshotPercentage * tolerance
    };
  }

  /**
   * Gets adaptive area targets based on rank tier.
   * Higher ranks have more ambitious targets.
   */
  getAreaTargets(): { [key: string]: Record<string, number> } {
    const strengthThresholds = this.getStrengthThresholds();
    
    return {
      aim: { 
        headshotPercentage: strengthThresholds.headshotPercentage, 
        kdRatio: strengthThresholds.kdRatio, 
        adr: strengthThresholds.adr 
      },
      positioning: { 
        kast: strengthThresholds.kast, 
        rating: strengthThresholds.rating, 
        survivalRate: this.rankTier === 'silver' ? 0.25 : this.rankTier === 'global' ? 0.4 : 0.3 
      },
      utility: { 
        adr: strengthThresholds.adr * 0.9, // Slightly lower ADR expectation for utility
        supportRating: strengthThresholds.rating * 0.9, 
        teamImpact: this.rankTier === 'silver' ? 0.6 : this.rankTier === 'global' ? 0.9 : 0.8 
      },
      teamwork: { 
        kast: strengthThresholds.kast * 1.05, // Higher KAST for teamwork
        consistency: this.rankTier === 'silver' ? 0.7 : this.rankTier === 'supreme' ? 0.9 : 0.8, 
        leadership: this.rankTier === 'silver' ? 0.5 : this.rankTier === 'supreme' ? 0.85 : 
                   this.rankTier === 'lem' ? 0.8 : this.rankTier === 'le' ? 0.75 : 0.7
      }
    };
  }

  /**
   * Gets adaptive tilt detection thresholds based on rank tier.
   * Higher ranked players are expected to have better consistency.
   */
  getTiltThresholds(): typeof TILT_THRESHOLDS {
    const rankStrictness = {
      silver: 1.3,     // More lenient tilt detection
      gold_nova: 1.2,
      mg: 1.1,
      dmg: 1.0,
      le: 0.95,
      lem: 0.9,
      supreme: 0.85,   // Stricter tilt detection
      global: 0.8
    };

    const strictness = rankStrictness[this.rankTier as keyof typeof rankStrictness] || 1.0;

    return {
      reactionTimeThreshold: TILT_THRESHOLDS.reactionTimeThreshold * strictness,
      consecutiveNegativeRatings: Math.max(2, Math.round(TILT_THRESHOLDS.consecutiveNegativeRatings * strictness)),
      preaim_degradation: TILT_THRESHOLDS.preaim_degradation * strictness,
      ratingDropThreshold: TILT_THRESHOLDS.ratingDropThreshold * strictness,
      consistencyThreshold: TILT_THRESHOLDS.consistencyThreshold * strictness,
      utilityEfficiencyDrop: TILT_THRESHOLDS.utilityEfficiencyDrop * strictness
    };
  }

  /**
   * Gets adaptive state classification patterns based on rank tier.
   * Higher ranks have tighter variance thresholds for flow states.
   */
  getStatePatterns(): typeof STATE_PATTERNS {
    // For flow state thresholds: LOWER values = STRICTER requirements
    // For variance thresholds: LOWER values = LESS tolerance (stricter)
    // Higher ranked players should have stricter requirements
    
    const rankMultipliers = {
      silver: 1.3,     // Higher multiplier = more lenient for lower ranks
      gold_nova: 1.2,
      mg: 1.1,
      dmg: 1.0,
      le: 0.9,
      lem: 0.8,
      supreme: 0.7,    // Lower multiplier = stricter for higher ranks
      global: 0.6
    };

    const multiplier = rankMultipliers[this.rankTier as keyof typeof rankMultipliers] || 1.0;

    return {
      mechanical_inconsistency: {
        // Allow more variance for lower ranks (multiply by multiplier)
        reactionTimeVariance: STATE_PATTERNS.mechanical_inconsistency.reactionTimeVariance * multiplier,
        preaim_instability: STATE_PATTERNS.mechanical_inconsistency.preaim_instability * multiplier,
        accuracyFluctuation: STATE_PATTERNS.mechanical_inconsistency.accuracyFluctuation * multiplier,
        ratingVariance: STATE_PATTERNS.mechanical_inconsistency.ratingVariance * multiplier
      },
      tilt_cascade: {
        consecutiveDeclines: Math.max(2, Math.round(STATE_PATTERNS.tilt_cascade.consecutiveDeclines * multiplier)),
        ratingDropPercentage: STATE_PATTERNS.tilt_cascade.ratingDropPercentage * multiplier,
        cascadeAcceleration: STATE_PATTERNS.tilt_cascade.cascadeAcceleration * multiplier,
        recoveryFailures: Math.max(1, Math.round(STATE_PATTERNS.tilt_cascade.recoveryFailures * multiplier))
      },
      flow_state: {
        // Stricter thresholds for higher ranks (multiply by multiplier - lower for higher ranks)
        preaim_threshold: STATE_PATTERNS.flow_state.preaim_threshold * multiplier,
        reactionTime_threshold: STATE_PATTERNS.flow_state.reactionTime_threshold * multiplier,
        ratingBoost: STATE_PATTERNS.flow_state.ratingBoost / multiplier, // Higher ranks need bigger boosts
        consistencyBonus: STATE_PATTERNS.flow_state.consistencyBonus / multiplier,
        utilityEfficiencyThreshold: Math.min(0.9, STATE_PATTERNS.flow_state.utilityEfficiencyThreshold / multiplier)
      },
      baseline_normal: {
        // Allow less deviation for higher ranks
        ratingDeviationRange: STATE_PATTERNS.baseline_normal.ratingDeviationRange * multiplier,
        consistencyThreshold: STATE_PATTERNS.baseline_normal.consistencyThreshold * multiplier,
        mechanicalStability: STATE_PATTERNS.baseline_normal.mechanicalStability * multiplier
      }
    };
  }

  /**
   * Get the current rank tier for logging/debugging.
   */
  getRankTier(): string {
    return this.rankTier;
  }

  /**
   * Get the rank benchmarks used for calculations.
   */
  getBenchmarks(): ReturnType<typeof getCS2RankBenchmarks> {
    return this.benchmarks;
  }
}

/**
 * Factory function to create adaptive thresholds for a player.
 */
export function createAdaptiveThresholds(premierRating?: number): AdaptiveThresholds {
  return new AdaptiveThresholds(premierRating);
}
