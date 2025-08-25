// Types for tilt detection and prediction

import type { LeetifyMatchData, RawPlayerStats } from './leetify';

export type ExtendedMatchData = LeetifyMatchData & { rawPlayerStats?: RawPlayerStats };

export type TiltIndicator = {
  type: 'reaction_time' | 'preaim_degradation' | 'rating_cascade' | 'consistency_loss' | 'utility_decline';
  severity: 'low' | 'moderate' | 'high';
  value: number;
  threshold: number;
  description: string;
};

export type PredictionResult = {
  nextMatchRating: number;
  confidence: number;
  recommendedAction: string;
  recoveryProbability: number;
};
