// Shared utility functions and constants for services
// Move all generic helpers/constants here from common/ and data-transformer/

// --- Constants from common/constants.ts ---
export const BASELINE_CONSTANTS = {
  DEFAULT_DECAY_FACTOR: 0.95,
  MIN_RELIABLE_SAMPLE: 20,
  PREFERRED_SAMPLE: 50,
  MIN_MAP_SAMPLE: 15
};

export const STATE_PATTERNS = {
  mechanical_inconsistency: {
    reactionTimeVariance: 0.3,
    preaim_instability: 10.0,
    accuracyFluctuation: 0.25,
    ratingVariance: 0.25
  },
  tilt_cascade: {
    consecutiveDeclines: 3,
    ratingDropPercentage: 0.2,
    cascadeAcceleration: 0.15,
    recoveryFailures: 2
  },
  flow_state: {
    preaim_threshold: 6.0,
    reactionTime_threshold: 0.6,
    ratingBoost: 0.08,
    consistencyBonus: 0.15,
    utilityEfficiencyThreshold: 0.7
  },
  baseline_normal: {
    ratingDeviationRange: 0.1,
    consistencyThreshold: 0.2,
    mechanicalStability: 0.15
  }
};

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

export const TILT_THRESHOLDS = {
  reactionTimeThreshold: 0.65,
  consecutiveNegativeRatings: 3,
  preaim_degradation: 0.15,
  ratingDropThreshold: 0.2,
  consistencyThreshold: 0.3,
  utilityEfficiencyDrop: 0.25
};

export const RECOVERY_PATTERNS = {
  averageRecoveryTime: 2.3,
  recoverySuccessRate: 0.67,
  breakEffectiveness: 0.78
};

// Add more helpers as needed from data-transformer or other generic logic
