// Coaching request/response and related types
export interface CoachingAnalysisRequest {
  analysis: import('./analysis').PlayerAnalysis;
  playerProfile: import('./leetify').LeetifyPlayerProfile;
  analysisType?: string;
  timeRange?: string;
  matchCount?: number;
  skipAI?: boolean;
}

export interface SpecificAreaRequest {
  playerId: string;
  area: string;
  analysis: any;
  playerProfile: import('./leetify').LeetifyPlayerProfile;
}

export interface ImprovementRequest {
  playerId: string;
  trends: any;
}

export interface RankComparisonRequest {
  playerId: string;
  targetRank: string;
  comparison: any;
  playerProfile: import('./leetify').LeetifyPlayerProfile;
}

export interface CoachingResponse {
  analysis: import('./analysis').PlayerAnalysis;
  recommendations: CoachingRecommendation[];
  practiceRoutine: PracticeRoutine;
  confidence: number;
  generatedAt: Date;
  summary?: string;
  keyFindings?: string[];
  nextSteps?: string;
}

export interface CoachingRecommendation {
  category: 'aim' | 'positioning' | 'utility' | 'teamwork' | 'general';
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  actionItems: string[];
  expectedImprovement: string;
}

export interface PracticeRoutine {
  warmup: string[];
  aimTraining: string[];
  mapPractice: string[];
  tacticalReview: string[];
  estimatedTime: number;
}

// Zod-inferred types (schemas must be imported in files that use them)
export type CoachingRequest = import('zod').infer<typeof import('./index').CoachingRequestSchema>;
export type SpecificAreaAnalysis = import('zod').infer<typeof import('./index').SpecificAreaAnalysisSchema>;
export type ImprovementTracking = import('zod').infer<typeof import('./index').ImprovementTrackingSchema>;
export type RankComparison = import('zod').infer<typeof import('./index').RankComparisonSchema>;
