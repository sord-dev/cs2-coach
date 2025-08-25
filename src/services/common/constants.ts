// Personal Baseline calculation constants
export const BASELINE_CONSTANTS = {
  DEFAULT_DECAY_FACTOR: 0.95,
  MIN_RELIABLE_SAMPLE: 20,
  PREFERRED_SAMPLE: 50,
  MIN_MAP_SAMPLE: 15
};

// State classifier patterns for performance state detection, research-based
export const STATE_PATTERNS = {
  mechanical_inconsistency: {
    reactionTimeVariance: 0.3, // 30% variance
    preaim_instability: 10.0,  // >10 degree range
    accuracyFluctuation: 0.25,  // 25% match-to-match variance
    ratingVariance: 0.25
  },
  tilt_cascade: {
    consecutiveDeclines: 3,
    ratingDropPercentage: 0.2, // 20% below baseline
    cascadeAcceleration: 0.15,  // 15% acceleration in decline
    recoveryFailures: 2
  },
  flow_state: {
    preaim_threshold: 6.0,      // <6.0 degrees
    reactionTime_threshold: 0.6, // <600ms
    ratingBoost: 0.08,          // +8% above baseline
    consistencyBonus: 0.15,     // 15% consistency improvement
    utilityEfficiencyThreshold: 0.7 // 70%+ utility efficiency
  },
  baseline_normal: {
    ratingDeviationRange: 0.1,  // ±10% from baseline
    consistencyThreshold: 0.2,  // <20% variance
    mechanicalStability: 0.15   // <15% mechanical variance
  }
};

// Thresholds and static config for strengths, weaknesses, and area targets
export const strengthThresholds: Record<string, number> = {
  rating: 1.1,
  kdRatio: 1.2,
  adr: 75,
  kast: 75,
  headshotPercentage: 35
};

export const weaknessThresholds: Record<string, number> = {
  rating: 0.9,
  kdRatio: 0.8,
  adr: 60,
  kast: 60,
  headshotPercentage: 20
};

export const areaTargets: { [key: string]: Record<string, number> } = {
  aim: { headshotPercentage: 35, kdRatio: 1.2, adr: 75 },
  positioning: { kast: 75, rating: 1.0, survivalRate: 0.3 },
  utility: { adr: 70, supportRating: 1.0, teamImpact: 0.8 },
  teamwork: { kast: 80, consistency: 0.8, leadership: 0.7 }
};

// Tilt detection thresholds, research-based
export const TILT_THRESHOLDS = {
  reactionTimeThreshold: 0.65, // 650ms - strongly correlates with poor performance
  consecutiveNegativeRatings: 3,
  preaim_degradation: 0.15, // 15% worse than baseline
  ratingDropThreshold: 0.2, // 20% below baseline
  consistencyThreshold: 0.3, // 30% variance in performance
  utilityEfficiencyDrop: 0.25 // 25% utility efficiency drop
};

// Recovery patterns, research-based
export const RECOVERY_PATTERNS = {
  averageRecoveryTime: 2.3, // matches
  recoverySuccessRate: 0.67,
  breakEffectiveness: 0.78 // 15min+ break stops cascade 78% of time
};
