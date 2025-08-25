/**
 * No-op AI service for deployment environments without Ollama
 * Returns structured responses without AI analysis
 */

import type { CoachingResponse, PlayerAnalysis } from '../../types/index.js';
import type { 
	IAICoachService, 
	CoachingAnalysisRequest, 
	SpecificAreaRequest, 
	ImprovementRequest, 
	RankComparisonRequest,
	EnhancedAnalysisRequest
} from './interface.js';

/**
 * No-op AI service that provides structured responses without AI analysis.
 * Perfect for deployment environments where Ollama is not available.
 */
export class NoOpAIService implements IAICoachService {
	/**
	 * Returns structured coaching response based on statistical analysis only.
	 */
	async analyzeGameplay(request: CoachingAnalysisRequest): Promise<CoachingResponse> {
		const { analysis, playerProfile } = request;
		
		return {
			analysis,
			recommendations: this.generateBasicRecommendations(analysis),
			practiceRoutine: this.generateBasicPracticeRoutine(analysis),
			confidence: 0.8,
			generatedAt: new Date(),
		};
	}

	/**
	 * Returns structured area-specific analysis without AI.
	 */
	async analyzeSpecificArea(request: SpecificAreaRequest): Promise<any> {
		const { area, analysis } = request;
		
		return {
			area,
			analysis,
			insights: [`Focus on improving ${area} based on statistical analysis`],
			recommendations: this.generateAreaSpecificRecommendations(area, analysis),
			confidence: 0.8,
			generatedAt: new Date(),
		};
	}

	/**
	 * Returns structured improvement analysis without AI.
	 */
	async analyzeImprovement(request: ImprovementRequest): Promise<any> {
		return {
			trends: request.trends,
			insights: ['Statistical trend analysis complete'],
			recommendations: ['Continue current improvement trajectory'],
			confidence: 0.8,
			generatedAt: new Date(),
		};
	}

	/**
	 * Returns structured rank comparison without AI.
	 */
	async analyzeRankComparison(request: RankComparisonRequest): Promise<any> {
		const { targetRank, comparison } = request;
		
		return {
			targetRank,
			comparison,
			insights: [`Statistical comparison to ${targetRank} complete`],
			recommendations: ['Focus on identified gaps based on statistical analysis'],
			confidence: 0.8,
			generatedAt: new Date(),
		};
	}

	/**
	 * Returns structured enhanced data analysis without AI.
	 */
	async analyzeEnhancedData(request: EnhancedAnalysisRequest): Promise<any> {
		return {
			enhancedAnalysis: request.enhancedAnalysis,
			insights: ['Enhanced statistical analysis complete'],
			recommendations: ['Recommendations based on advanced statistical analysis'],
			confidence: 0.9,
			generatedAt: new Date(),
		};
	}

	/**
	 * Generates basic recommendations from statistical analysis.
	 */
	private generateBasicRecommendations(analysis: PlayerAnalysis): Array<any> {
		const recommendations = [];

		// Add weakness-based recommendations
		if (analysis.weaknesses && analysis.weaknesses.length > 0) {
			recommendations.push({
				category: 'improvement',
				priority: 'high',
				title: 'Address Key Weaknesses',
				description: `Focus on: ${analysis.weaknesses.join(', ')}`,
				actionItems: analysis.weaknesses.map((w: string) => `Practice ${w} improvement drills`),
			});
		}

		// Add strength-based recommendations
		if (analysis.strengths && analysis.strengths.length > 0) {
			recommendations.push({
				category: 'leverage',
				priority: 'medium',
				title: 'Leverage Strengths',
				description: `Continue excelling at: ${analysis.strengths.join(', ')}`,
				actionItems: analysis.strengths.map((s: string) => `Maintain ${s} consistency`),
			});
		}

		return recommendations;
	}

	/**
	 * Generates area-specific recommendations.
	 */
	private generateAreaSpecificRecommendations(area: string, analysis: any): Array<any> {
		const recommendations = [];
		
		switch (area) {
			case 'aim':
				recommendations.push({
					title: 'Aim Training',
					description: 'Focus on crosshair placement and spray control',
					actionItems: ['Practice aim_botz daily', 'Work on spray patterns'],
				});
				break;
			case 'positioning':
				recommendations.push({
					title: 'Map Control',
					description: 'Improve map awareness and positioning',
					actionItems: ['Study common angles', 'Practice utility usage'],
				});
				break;
			case 'utility':
				recommendations.push({
					title: 'Utility Usage',
					description: 'Master smoke and flash lineups',
					actionItems: ['Learn map-specific lineups', 'Practice timing'],
				});
				break;
			case 'teamwork':
				recommendations.push({
					title: 'Team Communication',
					description: 'Focus on callouts and coordination',
					actionItems: ['Practice clear callouts', 'Work on team strategies'],
				});
				break;
		}

		return recommendations;
	}

	/**
	 * Generates basic practice routine.
	 */
	private generateBasicPracticeRoutine(analysis: PlayerAnalysis): any {
		return {
			warmup: ['5 minutes aim_botz', '10 minutes deathmatch'],
			aimTraining: ['Crosshair placement drills', 'Spray control practice'],
			mapPractice: ['Learn common angles', 'Practice utility lineups'],
			tacticalReview: ['Watch demo of recent match', 'Study professional gameplay'],
			estimatedTime: 45,
		};
	}
}