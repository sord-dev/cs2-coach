// Re-export public helpers and types for single entry point
export * from './error';
export * from './prompts';
export * from './interface';
export * from './noop';
import { Ollama } from 'ollama';
import { SimpleCache } from '../../utils/helpers.js';
import { buildAnalysisPrompt, buildSpecificAreaPrompt, buildImprovementPrompt, buildRankComparisonPrompt } from './prompts.js';
import { wrapOllamaError, OllamaError } from './error.js';

import type { OllamaConfig, PlayerAnalysis, LeetifyPlayerProfile, PracticeRoutine, CoachingRequest, CoachingResponse, CoachingRecommendation} from '../../types/index.js'

interface CoachingAnalysisRequest extends CoachingRequest {
	analysis: PlayerAnalysis;
	playerProfile: LeetifyPlayerProfile;
}

interface SpecificAreaRequest {
	playerId: string;
	area: string;
	analysis: any;
	playerProfile: LeetifyPlayerProfile;
}

interface ImprovementRequest {
	playerId: string;
	trends: any;
}

interface RankComparisonRequest {
	playerId: string;
	targetRank: string;
	comparison: any;
	playerProfile: LeetifyPlayerProfile;
}



export class OllamaCoachService {
	private ollama: any;
	private config: OllamaConfig;
	private isProcessing = false;
	private requestQueue: Array<() => Promise<void>> = [];
	private responseCache = new SimpleCache<CoachingResponse>(100);

	/**
	 * Optionally inject a custom Ollama client (for testing/mocking)
	 */
	constructor(ollamaClient?: any) {
		this.config = {
			baseUrl: process.env.OLLAMA_BASE_URL || 'http://localhost:11434',
			model: process.env.OLLAMA_MODEL || 'cs2-coach',
			timeoutMs: parseInt(process.env.OLLAMA_TIMEOUT_MS || '30000'),
			temperature: 0.2,
			maxTokens: 1000,
		};
		this.ollama = ollamaClient || new Ollama({ host: this.config.baseUrl });
	}

	private async logOllamaErrorBody(error: any) {
		if (error && typeof error === 'object' && error.response && typeof error.response.text === 'function') {
			try {
				const errBody = await error.response.text();
				console.log('Ollama API error response body:', errBody);
			} catch (e) {
				console.log('Failed to read Ollama error response body:', e);
			}
		}
	}

	async analyzeGameplay(request: CoachingAnalysisRequest): Promise<CoachingResponse> {
		const cacheKey = this.generateCacheKey('gameplay', request);
		const cached = this.responseCache.get(cacheKey, parseInt(process.env.CACHE_TTL_AI_RESPONSES_MS || '3600000'));
		if (cached) return cached;
	const prompt = buildAnalysisPrompt(request);
		const aiResponse = await this.queueRequest(() => this.callOllama(prompt));
		const coachingResponse = this.parseCoachingResponse(aiResponse, request.analysis);
		this.responseCache.set(cacheKey, coachingResponse);
		return coachingResponse;
	}

	async analyzeSpecificArea(request: SpecificAreaRequest): Promise<CoachingResponse> {
		const cacheKey = this.generateCacheKey('specific', request);
		const cached = this.responseCache.get(cacheKey, parseInt(process.env.CACHE_TTL_AI_RESPONSES_MS || '3600000'));
		if (cached) return cached;
	const prompt = buildSpecificAreaPrompt(request);
		const aiResponse = await this.queueRequest(() => this.callOllama(prompt));
		const coachingResponse = this.parseSpecificAreaResponse(aiResponse, request.area);
		this.responseCache.set(cacheKey, coachingResponse);
		return coachingResponse;
	}

	async analyzeImprovement(request: ImprovementRequest): Promise<CoachingResponse> {
		const cacheKey = this.generateCacheKey('improvement', request);
		const cached = this.responseCache.get(cacheKey, parseInt(process.env.CACHE_TTL_AI_RESPONSES_MS || '3600000'));
		if (cached) return cached;
	const prompt = buildImprovementPrompt(request);
		const aiResponse = await this.queueRequest(() => this.callOllama(prompt));
		const coachingResponse = this.parseImprovementResponse(aiResponse, request.trends);
		this.responseCache.set(cacheKey, coachingResponse);
		return coachingResponse;
	}

	async analyzeRankComparison(request: RankComparisonRequest): Promise<CoachingResponse> {
		const cacheKey = this.generateCacheKey('rank_comparison', request);
		const cached = this.responseCache.get(cacheKey, parseInt(process.env.CACHE_TTL_AI_RESPONSES_MS || '3600000'));
		if (cached) return cached;
	const prompt = buildRankComparisonPrompt(request);
		const aiResponse = await this.queueRequest(() => this.callOllama(prompt));
		const coachingResponse = this.parseRankComparisonResponse(aiResponse, request.targetRank);
		this.responseCache.set(cacheKey, coachingResponse);
		return coachingResponse;
	}

	/**
	 * Analyzes enhanced statistical data and provides AI insights.
	 */
	async analyzeEnhancedData(request: any): Promise<CoachingResponse> {
		const cacheKey = this.generateCacheKey('enhanced_analysis', request);
		const cached = this.responseCache.get(cacheKey, parseInt(process.env.CACHE_TTL_AI_RESPONSES_MS || '3600000'));
		if (cached) return cached;
		
		const prompt = this.generateEnhancedAnalysisPrompt(request);
		const aiResponse = await this.queueRequest(() => this.callOllama(prompt));
		const coachingResponse = this.parseEnhancedAnalysisResponse(aiResponse, request);
		this.responseCache.set(cacheKey, coachingResponse);
		return coachingResponse;
	}

	private async queueRequest<T>(requestFn: () => Promise<T>): Promise<T> {
		return new Promise((resolve, reject) => {
			this.requestQueue.push(async () => {
				try {
					const result = await requestFn();
					resolve(result);
				} catch (error) {
					reject(error);
				}
			});
			this.processQueue();
		});
	}

	private async processQueue(): Promise<void> {
		if (this.isProcessing || this.requestQueue.length === 0) return;
		this.isProcessing = true;
		while (this.requestQueue.length > 0) {
			const request = this.requestQueue.shift()!;
			await request();
		}
		this.isProcessing = false;
	}

		private async callOllama(prompt: string): Promise<string> {
			try {
				const response = await this.ollama.generate({
					model: this.config.model,
					prompt,
					options: {
						temperature: this.config.temperature,
						num_predict: this.config.maxTokens,
					},
					stream: false,
				});
				if (!response || typeof response.response !== 'string') {
					// Invalid response from Ollama
					throw new OllamaError('No valid response from Ollama', this.config.model);
				}
				return response.response;
			} catch (error: any) {
				// Log error for debugging
				await this.logOllamaErrorBody(error);
				throw wrapOllamaError(error, this.config.model);
			}
		}


		private parseCoachingResponse(aiResponse: string, analysis: PlayerAnalysis): CoachingResponse {
			if (!aiResponse || aiResponse.trim() === '') {
				throw new OllamaError('Empty response received from Ollama', this.config.model);
			}
			   try {
				   // Parse JSON from AI response
				   const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
				   if (!jsonMatch) throw new Error('No JSON found in AI response');
				   const parsed = JSON.parse(jsonMatch[0]);
						   return {
							   analysis: analysis && Object.keys(analysis).length > 0 ? analysis : {
								   playerId: '',
								   timeRange: '',
								   averageStats: {
									   rating: 0,
									   kdRatio: 0,
									   adr: 0,
									   kast: 0,
									   headshotPercentage: 0,
									   gamesPlayed: 0,
								   },
								   recentPerformance: [],
								   strengths: [],
								   weaknesses: [],
								   trends: [],
							   },
							   recommendations: this.validateRecommendations(parsed.recommendations || []),
							   practiceRoutine: this.validatePracticeRoutine(parsed.practiceRoutine || {}),
							   confidence: 0.85,
							   generatedAt: new Date(),
							   summary: parsed.summary,
							   keyFindings: parsed.keyFindings,
							   nextSteps: parsed.nextSteps,
						   };
			} catch (error) {
				throw wrapOllamaError(
					error instanceof Error
						? `Failed to parse Ollama response: ${error.message}`
						: 'Failed to parse Ollama response: Unknown parsing error',
					this.config.model
				);
			}
		}

	private parseSpecificAreaResponse(aiResponse: string, _area: string): CoachingResponse {
		// Provide a valid minimal PlayerAnalysis object
		return this.parseCoachingResponse(aiResponse, {
			playerId: '',
			timeRange: '',
			averageStats: {
				rating: 0,
				kdRatio: 0,
				adr: 0,
				kast: 0,
				headshotPercentage: 0,
				gamesPlayed: 0,
			},
			recentPerformance: [],
			strengths: [],
			weaknesses: [],
			trends: [],
		});
	}

	private parseImprovementResponse(aiResponse: string, _trends: any): CoachingResponse {
		return this.parseCoachingResponse(aiResponse, {} as PlayerAnalysis);
	}

	private parseRankComparisonResponse(aiResponse: string, _targetRank: string): CoachingResponse {
		return this.parseCoachingResponse(aiResponse, {} as PlayerAnalysis);
	}

	/**
	 * Generates enhanced analysis prompt for AI interpretation.
	 */
	private generateEnhancedAnalysisPrompt(request: any): string {
		const { enhancedAnalysis, basicAnalysis, playerProfile, components } = request;
		
		return `
# Enhanced CS2 Performance Analysis Interpretation

You are an expert CS2 coach analyzing advanced statistical data. Provide insights based on this enhanced analysis.

## Player Information
- Steam ID: ${playerProfile?.steamId}
- Current Rank: ${playerProfile?.rank?.name || 'Unknown'}
- Skill Level: ${playerProfile?.skillLevel || 'Unknown'}

## Analysis Components Requested
${components.join(', ')}

## Enhanced Statistical Data
${JSON.stringify(enhancedAnalysis, null, 2)}

## Basic Performance Context
${basicAnalysis ? JSON.stringify(basicAnalysis, null, 2) : 'Not available'}

## Your Task
Interpret this statistical analysis and provide:

1. **Key Insights**: What do the statistics reveal about this player's current state?
2. **Performance Patterns**: What patterns emerge from the data?
3. **Actionable Recommendations**: Specific, evidence-based advice
4. **Priority Areas**: What should the player focus on most?
5. **Risk Assessment**: Any warning signs or concerns?

Focus on translating the statistical findings into practical coaching advice.
Format your response as structured coaching insights that are easy to understand.
		`.trim();
	}

	/**
	 * Parses enhanced analysis AI response.
	 */
	private parseEnhancedAnalysisResponse(aiResponse: string, request: any): CoachingResponse {
		// For now, use the same parsing logic but indicate enhanced analysis
		const baseResponse = this.parseCoachingResponse(aiResponse, request.basicAnalysis || {} as PlayerAnalysis);
		
		return {
			...baseResponse,
			confidence: 0.9, // Higher confidence due to statistical backing
			summary: `Enhanced statistical analysis for ${request.playerId}`,
			keyFindings: [
				'Advanced statistical analysis completed',
				'Enhanced components: ' + (request.components || ['all']).join(', ')
			]
		};
	}

	private validateRecommendations(recommendations: any[]): CoachingRecommendation[] {
		   if (!Array.isArray(recommendations) || recommendations.length === 0) {
			   return [{
				   category: 'general',
				   priority: 'medium',
				   title: 'Focus Area',
				   description: 'Improve your gameplay',
				   actionItems: ['Practice regularly'],
				   expectedImprovement: 'Gradual skill improvement',
			   }];
		   }
		   return recommendations.map(rec => ({
			   category: rec.category || 'general',
			   priority: rec.priority || 'medium',
			   title: rec.title || 'Focus Area',
			   description: rec.description || 'Improve your gameplay',
			   actionItems: Array.isArray(rec.actionItems) ? rec.actionItems : ['Practice regularly'],
			   expectedImprovement: rec.expectedImprovement || 'Gradual skill improvement',
		   }));
	}

	private validatePracticeRoutine(routine: any): PracticeRoutine {
		   return {
			   warmup: Array.isArray(routine.warmup) ? routine.warmup : ['Deathmatch for 15 minutes'],
			   aimTraining: Array.isArray(routine.aimTraining) ? routine.aimTraining : ['Aim_botz practice'],
			   mapPractice: Array.isArray(routine.mapPractice) ? routine.mapPractice : ['Learn common angles'],
			   tacticalReview: Array.isArray(routine.tacticalReview) ? routine.tacticalReview : ['Watch pro demos'],
			   estimatedTime: typeof routine.estimatedTime === 'number' ? routine.estimatedTime : 60,
		   };
	}

	private createFallbackResponse(analysis: PlayerAnalysis, rawResponse: string): CoachingResponse {
		return {
			analysis,
			recommendations: [
				{
					category: 'general',
					priority: 'medium',
					title: 'Continue Practicing',
					description: rawResponse.substring(0, 200) + '...',
					actionItems: ['Focus on fundamentals', 'Practice daily'],
					expectedImprovement: 'Steady improvement with consistent practice',
				},
			],
			practiceRoutine: {
				warmup: ['Deathmatch for 15 minutes'],
				aimTraining: ['Aim training maps'],
				mapPractice: ['Learn callouts and angles'],
				tacticalReview: ['Watch professional matches'],
				estimatedTime: 60,
			},
			confidence: 0.5,
			generatedAt: new Date(),
		};
	}

	public clearCache(): void {
		this.responseCache.clear();
	}

	private generateCacheKey(type: string, request: any): string {
		const keyData = {
			type,
			playerId: request.playerId,
			analysisType: request.analysisType || request.area || request.targetRank,
			timeRange: request.timeRange || 'default',
		};
		return `${type}:${JSON.stringify(keyData)}`;
	}
}