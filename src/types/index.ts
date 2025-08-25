export * from './leetify.js';
export * from './analysis.js';
export * from './coaching.js';
export * from './config.js';
export * from './utility.js';
export * from './errors.js';
export * from './tilt.js'
import { z } from 'zod';

// Zod schemas for input validation (types are now global via types.d.ts)
export const CoachingRequestSchema = z.object({
  playerId: z.string().min(1, 'Player ID is required'),
  analysisType: z.enum(['general', 'aim', 'positioning', 'utility', 'teamwork']).default('general'),
  timeRange: z.enum(['recent', 'week', 'month', '3months']).default('recent'),
  matchCount: z.number().min(1).max(50).default(10),
  skipAI: z.boolean().default(true),  // Changed: AI skipped by default for fast analysis
});

export const SpecificAreaAnalysisSchema = z.object({
  playerId: z.string().min(1, 'Player ID is required'),
  area: z.enum(['aim', 'positioning', 'utility', 'teamwork']),
  timeRange: z.enum(['recent', 'week', 'month', '3months']).default('recent'),
  matchCount: z.number().min(1).max(50).default(10),
  skipAI: z.boolean().default(true),  // Changed: AI skipped by default for fast analysis
});

export const ImprovementTrackingSchema = z.object({
  playerId: z.string().min(1, 'Player ID is required'),
  fromDate: z.string().regex(/^[\d]{4}-[\d]{2}-[\d]{2}$/, 'Date must be in YYYY-MM-DD format'),
  toDate: z.string().regex(/^[\d]{4}-[\d]{2}-[\d]{2}$/, 'Date must be in YYYY-MM-DD format'),
  metrics: z.array(z.enum(['rating', 'kd', 'adr', 'kast', 'hs_percentage'])).default(['rating']),
});

export const RankComparisonSchema = z.object({
  playerId: z.string().min(1, 'Player ID is required'),
  targetRank: z.enum(['silver', 'gold_nova', 'mg', 'dmg', 'le', 'lem', 'supreme', 'global']),
  timeRange: z.enum(['recent', 'week', 'month', '3months']).default('recent'),
  skipAI: z.boolean().default(true),  // Changed: AI skipped by default for fast analysis
});