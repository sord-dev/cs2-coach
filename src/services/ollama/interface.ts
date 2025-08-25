/**
 * Common interface for AI services (Ollama and NoOp)
 * Ensures both implementations provide the same methods
 */

import type { CoachingResponse, PlayerAnalysis, LeetifyPlayerProfile } from '../../types/index.js';

export interface CoachingAnalysisRequest {
	analysis: PlayerAnalysis;
	playerProfile: LeetifyPlayerProfile;
	playerId: string;
	analysisType: string;
}

export interface SpecificAreaRequest {
	playerId: string;
	area: string;
	analysis: any;
	playerProfile: LeetifyPlayerProfile;
}

export interface ImprovementRequest {
	playerId: string;
	trends: any;
}

export interface RankComparisonRequest {
	playerId: string;
	targetRank: string;
	comparison: any;
	playerProfile: LeetifyPlayerProfile;
}

export interface EnhancedAnalysisRequest {
	enhancedAnalysis: any;
	basicAnalysis: any;
	playerProfile: LeetifyPlayerProfile;
	playerId: string;
	components: string[];
}

/**
 * Common interface for AI coaching services
 * Implemented by both OllamaCoachService and NoOpAIService
 */
export interface IAICoachService {
	analyzeGameplay(request: CoachingAnalysisRequest): Promise<CoachingResponse>;
	analyzeSpecificArea(request: SpecificAreaRequest): Promise<any>;
	analyzeImprovement(request: ImprovementRequest): Promise<any>;
	analyzeRankComparison(request: RankComparisonRequest): Promise<any>;
	analyzeEnhancedData(request: EnhancedAnalysisRequest): Promise<any>;
}