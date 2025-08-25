
import type {
	LeetifyMatchData,
	PlayerAnalysis,
	ProcessedStats,
	PerformanceTrend,
	PersonalBaseline,
	TiltAnalysis,
	PredictiveAlert,
	EnhancedAnalysisResult
} from '../../types/index.js';

import { calculateMatchPerformance, calculateAverageStats, getDefaultStats } from '../analysis/metrics.js';
import { strengthThresholds, weaknessThresholds } from '../common/constants.js';
import { getInsightAreas, getAreaTarget, getAreaLabel } from '../analysis/area.js';
import { createAdaptiveThresholds, AdaptiveThresholds } from '../analysis/adaptive-thresholds.js';
import { roundTo } from '../../utils/helpers.js';

// Enhanced Analysis Components
import { personalBaselineCalculator } from '../baseline/baseline-calculator.js';
import { tiltDetector } from '../detection/tilt-detector.js';
import { performanceStateClassifier } from '../analysis/state-classifier.js';
import { correlationAnalyzer } from '../analysis/correlation-analyzer.js';
import { patternDetector } from '../analysis/pattern-detector.js';

/**
 * Data transformation service for processing Leetify API data
 * into coaching insights and performance analysis.
 * 
 * Transforms raw match statistics into structured analysis
 * with trends, strengths, weaknesses, and improvement areas.
 */

export class LeetifyDataTransformer {
	private adaptiveThresholds?: AdaptiveThresholds;

	/**
	 * Sets player-specific adaptive thresholds based on premier rating.
	 * Should be called before analysis to ensure rank-appropriate thresholds.
	 */
	setAdaptiveThresholds(premierRating?: number): void {
		this.adaptiveThresholds = createAdaptiveThresholds(premierRating);
	}

	/**
	 * Gets the current adaptive thresholds or falls back to static defaults.
	 */
	private getThresholds(): {
		strength: Record<string, number>;
		weakness: Record<string, number>;
		areaTargets: { [key: string]: Record<string, number> };
	} {
		if (this.adaptiveThresholds) {
			return {
				strength: this.adaptiveThresholds.getStrengthThresholds(),
				weakness: this.adaptiveThresholds.getWeaknessThresholds(),
				areaTargets: this.adaptiveThresholds.getAreaTargets()
			};
		}
		// Fallback to static thresholds
		return {
			strength: strengthThresholds,
			weakness: weaknessThresholds,
			areaTargets: {
				aim: { headshotPercentage: 35, kdRatio: 1.2, adr: 75 },
				positioning: { kast: 75, rating: 1.0, survivalRate: 0.3 },
				utility: { adr: 70, supportRating: 1.0, teamImpact: 0.8 },
				teamwork: { kast: 80, consistency: 0.8, leadership: 0.7 }
			}
		};
	}

	processMatches(matches: LeetifyMatchData[], targetPlayerId: string): PlayerAnalysis {
			if (!matches.length) {
				return this.createEmptyAnalysis(targetPlayerId);
			}
			const recentPerformance = calculateMatchPerformance(matches);
			const averageStats = calculateAverageStats(recentPerformance);
			const trends = this.identifyTrends(recentPerformance);
			const strengths = this.identifyStrengths(averageStats);
			const weaknesses = this.identifyWeaknesses(averageStats);
			return {
				playerId: targetPlayerId,
				timeRange: this.getTimeRangeDescription(matches),
				averageStats,
				recentPerformance,
				strengths,
				weaknesses,
				trends,
			};
		}

	analyzeSpecificArea(analysis: PlayerAnalysis, area: string): any {
			const thresholds = this.getThresholds();
			const focusedAnalysis = {
				...analysis,
				areaFocus: getAreaLabel(area),
				areaSpecificInsights: this.getAreaSpecificInsights(analysis, area),
				targetMetrics: thresholds.areaTargets[area] || getAreaTarget(area),
				practiceRecommendations: this.getAreaPracticeRecommendations(area),
				availableAreas: getInsightAreas().map(getAreaLabel),
			};
			return focusedAnalysis;
	}

	calculateImprovementTrends(matches: LeetifyMatchData[], metrics: string[]): any {
		const timeWindows = this.createTimeWindows(matches);
		const trends: Record<string, any> = {};
		for (const metric of metrics) {
			trends[metric] = this.calculateMetricTrend(timeWindows, metric);
		}
		return {
			timeRange: this.getTimeRangeDescription(matches),
			trends,
			overallDirection: this.calculateOverallTrendDirection(trends),
			recommendations: this.getTrendBasedRecommendations(trends),
		};
	}

	compareToRank(playerMatches: LeetifyMatchData[], rankBenchmarks: any, playerId: string): any {
			const playerStats = calculateAverageStats(
				calculateMatchPerformance(playerMatches)
			);
		const comparison = {
			playerId,
			playerStats,
			rankBenchmarks,
			gaps: this.calculatePerformanceGaps(playerStats, rankBenchmarks),
			strengths: this.identifyRankStrengths(playerStats, rankBenchmarks),
			improvementAreas: this.identifyRankImprovementAreas(playerStats, rankBenchmarks),
			estimatedTimeToRank: this.estimateTimeToRank(playerStats, rankBenchmarks),
		};
		return comparison;
	}

	private identifyTrends(performances: ProcessedStats[]): PerformanceTrend[] {
		if (performances.length < 3) {
			return [];
		}
		const trends: PerformanceTrend[] = [];
		const metrics = ['rating', 'kdRatio', 'adr', 'kast', 'headshotPercentage'];
		for (const metric of metrics) {
			const trend = this.calculateTrendForMetric(performances, metric);
			trends.push(trend);
		}
		return trends;
	}

	private calculateTrendForMetric(performances: ProcessedStats[], metric: string): PerformanceTrend {
		const values = performances.map(p => (p as any)[metric]).filter(v => typeof v === 'number');
		if (values.length < 2) {
			return {
				metric,
				trend: 'stable',
				changePercentage: 0,
				description: 'Insufficient data for trend analysis',
			};
		}
		const first = values.slice(0, Math.ceil(values.length / 2));
		const second = values.slice(Math.floor(values.length / 2));
		const firstAvg = first.reduce((a, b) => a + b, 0) / first.length;
		const secondAvg = second.reduce((a, b) => a + b, 0) / second.length;
		const changePercentage = firstAvg > 0 ? ((secondAvg - firstAvg) / firstAvg) * 100 : 0;
		let trend: 'improving' | 'declining' | 'stable';
		let description: string;
		if (Math.abs(changePercentage) < 5) {
			trend = 'stable';
			description = `${metric} performance is consistent`;
		} else if (changePercentage > 0) {
			trend = 'improving';
			description = `${metric} showing upward trend`;
		} else {
			trend = 'declining';
			description = `${metric} needs attention`;
		}
		return {
			metric,
			trend,
			changePercentage: roundTo(Math.abs(changePercentage), 1),
			description,
		};
	}


		private identifyStrengths(stats: ProcessedStats): string[] {
			const thresholds = this.getThresholds();
			const strengths: string[] = [];
			if (stats.rating >= thresholds.strength.rating) {
				strengths.push('Consistent high-impact performance');
			}
			if (stats.kdRatio >= thresholds.strength.kdRatio) {
				strengths.push('Strong fragging ability');
			}
			if (stats.adr >= thresholds.strength.adr) {
				strengths.push('Good damage output');
			}
			if (stats.kast >= thresholds.strength.kast) {
				strengths.push('High round contribution');
			}
			if (stats.headshotPercentage >= thresholds.strength.headshotPercentage) {
				strengths.push('Excellent aim precision');
			}
			return strengths.length ? strengths : ['Solid fundamental gameplay'];
		}


		private identifyWeaknesses(stats: ProcessedStats): string[] {
			const thresholds = this.getThresholds();
			const weaknesses: string[] = [];
			if (stats.rating <= thresholds.weakness.rating) {
				weaknesses.push('Overall impact needs improvement');
			}
			if (stats.kdRatio <= thresholds.weakness.kdRatio) {
				weaknesses.push('Focus on staying alive and trading kills');
			}
			if (stats.adr <= thresholds.weakness.adr) {
				weaknesses.push('Increase damage output per round');
			}
			if (stats.kast <= thresholds.weakness.kast) {
				weaknesses.push('Improve round participation and impact');
			}
			if (stats.headshotPercentage <= thresholds.weakness.headshotPercentage) {
				weaknesses.push('Work on aim and crosshair placement');
			}
			return weaknesses.length ? weaknesses : ['Minor refinements needed'];
		}

	private getAreaSpecificInsights(analysis: PlayerAnalysis, area: string): any {
		switch (area) {
			case 'aim':
				return {
					currentLevel: this.assessAimLevel(analysis.averageStats),
					keyMetrics: {
						headshotPercentage: analysis.averageStats.headshotPercentage,
						kdRatio: analysis.averageStats.kdRatio,
						adr: analysis.averageStats.adr,
					},
					focusAreas: this.getAimFocusAreas(analysis.averageStats),
				};
			case 'positioning':
				return {
					currentLevel: this.assessPositioningLevel(analysis.averageStats),
					keyMetrics: {
						kast: analysis.averageStats.kast,
						rating: analysis.averageStats.rating,
						survival: analysis.averageStats.kdRatio,
					},
					focusAreas: this.getPositioningFocusAreas(analysis.averageStats),
				};
			case 'utility':
				return {
					currentLevel: this.assessUtilityLevel(analysis.averageStats),
					keyMetrics: {
						adr: analysis.averageStats.adr,
						kast: analysis.averageStats.kast,
						teamImpact: analysis.averageStats.rating,
					},
					focusAreas: this.getUtilityFocusAreas(analysis.averageStats),
				};
			case 'teamwork':
				return {
					currentLevel: this.assessTeamworkLevel(analysis.averageStats),
					keyMetrics: {
						kast: analysis.averageStats.kast,
						rating: analysis.averageStats.rating,
						consistency: this.calculateConsistency(analysis.recentPerformance),
					},
					focusAreas: this.getTeamworkFocusAreas(analysis.averageStats),
				};
			default:
				return { message: 'General analysis completed' };
		}
	}

	private getAreaPracticeRecommendations(area: string): string[] {
		const recommendations: Record<string, string[]> = {
			aim: [
				'Practice aim_botz for 15-20 minutes daily',
				'Focus on crosshair placement in deathmatch',
				'Use Aim Lab or Kovaak\'s for tracking exercises',
				'Practice counter-strafing and shooting',
			],
			positioning: [
				'Study professional player positions on key maps',
				'Practice common angles and off-angles',
				'Work on rotations and timing',
				'Review deaths to identify positioning mistakes',
			],
			utility: [
				'Learn smoke and flash lineups for main maps',
				'Practice coordinated utility usage with teammates',
				'Study professional team utility strategies',
				'Focus on utility efficiency and timing',
			],
			teamwork: [
				'Practice communication callouts',
				'Work on trade fragging with teammates',
				'Study team coordination and timing',
				'Focus on supporting teammates consistently',
			],
		};
		return recommendations[area] || recommendations.aim;
	}

	private assessAimLevel(stats: ProcessedStats): string {
		if (stats.headshotPercentage >= 40 && stats.kdRatio >= 1.3) return 'Expert';
		if (stats.headshotPercentage >= 30 && stats.kdRatio >= 1.1) return 'Advanced';
		if (stats.headshotPercentage >= 25 && stats.kdRatio >= 0.9) return 'Intermediate';
		return 'Beginner';
	}

	private assessPositioningLevel(stats: ProcessedStats): string {
		if (stats.kast >= 80 && stats.rating >= 1.2) return 'Expert';
		if (stats.kast >= 70 && stats.rating >= 1.0) return 'Advanced';
		if (stats.kast >= 60 && stats.rating >= 0.8) return 'Intermediate';
		return 'Beginner';
	}

	private assessUtilityLevel(stats: ProcessedStats): string {
		if (stats.adr >= 80 && stats.kast >= 75) return 'Expert';
		if (stats.adr >= 70 && stats.kast >= 65) return 'Advanced';
		if (stats.adr >= 60 && stats.kast >= 55) return 'Intermediate';
		return 'Beginner';
	}

	private assessTeamworkLevel(stats: ProcessedStats): string {
		if (stats.kast >= 80 && stats.rating >= 1.1) return 'Expert';
		if (stats.kast >= 70 && stats.rating >= 0.9) return 'Advanced';
		if (stats.kast >= 60 && stats.rating >= 0.7) return 'Intermediate';
		return 'Beginner';
	}

	private getAimFocusAreas(stats: ProcessedStats): string[] {
		const areas = [];
		if (stats.headshotPercentage < 25) areas.push('Crosshair placement');
		if (stats.kdRatio < 1.0) areas.push('Spray control');
		if (stats.adr < 70) areas.push('First shot accuracy');
		return areas;
	}

	private getPositioningFocusAreas(stats: ProcessedStats): string[] {
		const areas = [];
		if (stats.kast < 70) areas.push('Map awareness');
		if (stats.rating < 0.9) areas.push('Angle selection');
		if (stats.kdRatio < 0.8) areas.push('Survival instincts');
		return areas;
	}

	private getUtilityFocusAreas(stats: ProcessedStats): string[] {
		const areas = [];
		if (stats.adr < 65) areas.push('Utility coordination');
		if (stats.kast < 65) areas.push('Support timing');
		return areas;
	}

	private getTeamworkFocusAreas(stats: ProcessedStats): string[] {
		const areas = [];
		if (stats.kast < 70) areas.push('Communication');
		if (stats.rating < 0.9) areas.push('Team synchronization');
		return areas;
	}

	private calculatePerformanceGaps(playerStats: ProcessedStats, benchmarks: any): any {
		return {
			rating: benchmarks.rating - playerStats.rating,
			kdRatio: benchmarks.kdRatio - playerStats.kdRatio,
			adr: benchmarks.adr - playerStats.adr,
			kast: benchmarks.kast - playerStats.kast,
			headshotPercentage: benchmarks.headshotPercentage - playerStats.headshotPercentage,
		};
	}

	private identifyRankStrengths(playerStats: ProcessedStats, benchmarks: any): string[] {
		const strengths = [];
		if (playerStats.rating >= benchmarks.rating) strengths.push('Rating above rank average');
		if (playerStats.kdRatio >= benchmarks.kdRatio) strengths.push('K/D ratio competitive');
		if (playerStats.adr >= benchmarks.adr) strengths.push('Damage output sufficient');
		if (playerStats.kast >= benchmarks.kast) strengths.push('Round participation strong');
		if (playerStats.headshotPercentage >= benchmarks.headshotPercentage) strengths.push('Aim accuracy excellent');
		return strengths;
	}

	private identifyRankImprovementAreas(playerStats: ProcessedStats, benchmarks: any): string[] {
		const areas = [];
		if (playerStats.rating < benchmarks.rating) areas.push('Overall impact and consistency');
		if (playerStats.kdRatio < benchmarks.kdRatio) areas.push('Kill/death efficiency');
		if (playerStats.adr < benchmarks.adr) areas.push('Damage per round output');
		if (playerStats.kast < benchmarks.kast) areas.push('Round participation and support');
		if (playerStats.headshotPercentage < benchmarks.headshotPercentage) areas.push('Aim precision and headshots');
		return areas;
	}

	private estimateTimeToRank(playerStats: ProcessedStats, benchmarks: any): string {
		const gaps = this.calculatePerformanceGaps(playerStats, benchmarks);
		const gapCount = Object.values(gaps).filter(gap => typeof gap === 'number' && gap > 0).length;
		if (gapCount === 0) return '1-2 weeks with consistent performance';
		if (gapCount <= 2) return '2-4 weeks with focused practice';
		if (gapCount <= 4) return '1-2 months with dedicated improvement';
		return '2-3 months with comprehensive skill development';
	}

	private createEmptyAnalysis(playerId: string): PlayerAnalysis {
		return {
			playerId,
			timeRange: 'No matches found',
			averageStats: this.getDefaultStats(),
			recentPerformance: [],
			strengths: [],
			weaknesses: ['Insufficient match data'],
			trends: [],
		};
	}


		private getDefaultStats(): ProcessedStats {
			return getDefaultStats();
		}

	private getTimeRangeDescription(matches: LeetifyMatchData[]): string {
		if (!matches.length) return 'No time range';
		const validDates = matches
			.map(m => m.date ? new Date(m.date) : null)
			.filter(date => date && !isNaN(date.getTime()))
			.sort((a, b) => a!.getTime() - b!.getTime());
		if (validDates.length === 0) {
			return 'Unknown time range (invalid dates)';
		}
		const oldest = validDates[0]!;
		const newest = validDates[validDates.length - 1]!;
		return `${oldest.toISOString().split('T')[0]} to ${newest.toISOString().split('T')[0]}`;
	}

	private calculateConsistency(performances: ProcessedStats[]): number {
		if (performances.length < 2) return 0;
		const ratings = performances.map(p => p.rating);
		const avg = ratings.reduce((a, b) => a + b, 0) / ratings.length;
		const variance = ratings.reduce((a, b) => a + Math.pow(b - avg, 2), 0) / ratings.length;
		const stdDev = Math.sqrt(variance);
		return Math.max(0, 1 - (stdDev / avg));
	}

	private createTimeWindows(matches: LeetifyMatchData[]): any[] {
		const sortedMatches = matches.sort((a, b) => {
			const dateA = a.date ? new Date(a.date) : new Date(0);
			const dateB = b.date ? new Date(b.date) : new Date(0);
			if (isNaN(dateA.getTime()) || isNaN(dateB.getTime())) {
				return 0;
			}
			return dateA.getTime() - dateB.getTime();
		});
		const windowSize = Math.max(1, Math.floor(sortedMatches.length / 3));
		const windows = [];
		for (let i = 0; i < sortedMatches.length; i += windowSize) {
			windows.push(sortedMatches.slice(i, i + windowSize));
		}
		return windows;
	}

	private calculateMetricTrend(windows: any[], metric: string): any {
		if (windows.length < 2) {
			return { trend: 'stable', change: 0, description: 'Insufficient data' };
		}
			const averages = windows.map(window => {
				const performances = calculateMatchPerformance(window);
				return (calculateAverageStats(performances) as any)[metric];
			});
		const firstHalf = averages.slice(0, Math.ceil(averages.length / 2));
		const secondHalf = averages.slice(Math.floor(averages.length / 2));
		const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
		const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;
		const change = firstAvg > 0 ? ((secondAvg - firstAvg) / firstAvg) * 100 : 0;
		return {
			trend: change > 5 ? 'improving' : change < -5 ? 'declining' : 'stable',
			change: roundTo(change, 1),
			description: `${metric} ${change > 0 ? 'improved' : 'declined'} by ${Math.abs(change).toFixed(1)}%`,
		};
	}

	private calculateOverallTrendDirection(trends: any): string {
		const directions = Object.values(trends).map((t: any) => t.trend);
		const improving = directions.filter(d => d === 'improving').length;
		const declining = directions.filter(d => d === 'declining').length;
		if (improving > declining) return 'improving';
		if (declining > improving) return 'declining';
		return 'stable';
	}

	private getTrendBasedRecommendations(trends: any): string[] {
		const recommendations: string[] = [];
		Object.entries(trends).forEach(([metric, trend]: [string, any]) => {
			if (trend.trend === 'declining') {
				recommendations.push(`Focus on improving ${metric} - currently declining`);
			} else if (trend.trend === 'improving') {
				recommendations.push(`Continue momentum in ${metric} - showing good progress`);
			}
		});
		return recommendations.length ? recommendations : ['Maintain current practice routine'];
	}

	// Enhanced Analysis Helper Methods

	/**
	 * Validates input data for enhanced analysis.
	 */
	private validateEnhancedAnalysisInput(matches: LeetifyMatchData[], playerId: string): {
		canProceed: boolean;
		warnings: string[];
	} {
		const warnings: string[] = [];
		let canProceed = true;

		if (!matches || matches.length === 0) {
			warnings.push('No match data available for enhanced analysis');
			canProceed = false;
		}

		if (!playerId || typeof playerId !== 'string') {
			warnings.push('Invalid player ID provided');
			canProceed = false;
		}

		if (matches.length < 5) {
			warnings.push(`Limited match data (${matches.length} matches) - enhanced analysis may be less reliable`);
		}

		if (matches.length < 10) {
			warnings.push('Insufficient data for statistical correlation analysis');
		}

		return { canProceed, warnings };
	}

	/**
	 * Converts regular match data to extended format for enhanced analysis.
	 */
	private convertToExtendedMatches(matches: LeetifyMatchData[]): any[] {
		return matches.map(match => ({
			...match,
			// Extended match data is already preserved in rawPlayerStats from the client
		}));
	}

	/**
	 * Gets or calculates personal baseline with caching.
	 */
	private async getOrCalculateBaseline(extendedMatches: any[], playerId: string): Promise<PersonalBaseline> {
		return personalBaselineCalculator.getOrCalculateBaseline(extendedMatches, playerId);
	}

	/**
	 * Generates predictive alerts based on analysis results.
	 */
	private generatePredictiveAlerts(
		tiltAnalysis: TiltAnalysis,
		stateClassification: any,
		patternAnalysis: any,
		baseline: PersonalBaseline
	): PredictiveAlert[] {
		const alerts: PredictiveAlert[] = [];

		// Tilt-based alerts
		if (tiltAnalysis.active) {
			alerts.push({
				alertType: 'tilt_detected',
				severity: tiltAnalysis.severity,
				evidence: `Tilt indicators: ${tiltAnalysis.triggers.join(', ')}`,
				prediction: tiltAnalysis.recoveryPrediction,
				recommendedAction: tiltAnalysis.recommendedAction
			});
		}

		// Performance state alerts
		if (stateClassification.classification === 'mechanical_inconsistency') {
			alerts.push({
				alertType: 'mechanical_inconsistency',
				severity: stateClassification.confidence > 0.8 ? 'high' : 'moderate',
				evidence: `Confidence: ${Math.round(stateClassification.confidence * 100)}%`,
				prediction: 'Performance instability likely to continue without intervention',
				recommendedAction: 'Focus on aim training and mechanical consistency'
			});
		}

		// Flow state opportunity alerts
		if (stateClassification.classification === 'flow_state') {
			alerts.push({
				alertType: 'flow_state_detected',
				severity: 'low',
				evidence: `Optimal performance state detected`,
				prediction: 'Continue current approach for sustained high performance',
				recommendedAction: 'Maintain current conditions and avoid major changes'
			});
		}

		// Momentum-based alerts
		if (patternAnalysis.currentMomentum === 'negative' && patternAnalysis.strength > 0.1) {
			alerts.push({
				alertType: 'negative_momentum',
				severity: patternAnalysis.strength > 0.2 ? 'high' : 'moderate',
				evidence: `${Math.round(patternAnalysis.strength * 100)}% decline over ${patternAnalysis.duration} matches`,
				prediction: 'Continued decline likely without intervention',
				recommendedAction: 'Consider break or practice routine adjustment'
			});
		}

		return alerts;
	}

	/**
	 * Calculates percentage of missing extended metric data.
	 */
	private calculateMissingDataPercentage(extendedMatches: any[]): number {
		if (extendedMatches.length === 0) return 100;

		const extendedFields = ['preaim', 'reaction_time', 'spray_accuracy'];
		const totalFields = extendedMatches.length * extendedFields.length;
		let missingFields = 0;

		for (const match of extendedMatches) {
			for (const field of extendedFields) {
				const value = match.rawPlayerStats?.[field];
				if (!value || value === 0) {
					missingFields++;
				}
			}
		}

		return (missingFields / totalFields) * 100;
	}

	/**
	 * Creates minimal enhanced analysis result for error cases.
	 */
	private createMinimalEnhancedAnalysis(playerId: string, warnings: string[]): EnhancedAnalysisResult {
		return {
			performanceStateAnalysis: {
				currentState: {
					classification: 'baseline_normal',
					confidence: 0.1,
					evidence: ['Insufficient data for reliable analysis'],
					baselineDeviation: { general: 'Unable to calculate baseline deviation' }
				},
				detectedPatterns: {
					tiltIndicators: {
						active: false,
						severity: 'low',
						triggersDetected: [],
						prediction: 'Unable to detect tilt patterns with current data'
					},
					flowStateIndicators: {
						lastOccurrence: 'Unknown',
						triggers: [],
						performanceBoost: 'Unable to calculate',
						frequency: 'Unable to calculate'
					}
				}
			},
			metricCorrelationAnalysis: {
				primaryPerformanceDrivers: [],
				surprisingFindings: []
			},
			predictiveWarningSystem: {
				immediateAlerts: [{
					alertType: 'insufficient_data',
					severity: 'moderate',
					evidence: 'Not enough data for enhanced analysis',
					prediction: 'Enhanced analysis requires more match data',
					recommendedAction: 'Continue playing to build statistical baseline'
				}]
			},
			warnings
		};
	}

	/**
	 * Generates comprehensive enhanced analysis with all statistical components.
	 * 
	 * @param matches - Match data for analysis
	 * @param playerId - Player identifier
	 * @returns Complete enhanced analysis result
	 */
	async generateEnhancedAnalysis(matches: LeetifyMatchData[], playerId: string): Promise<EnhancedAnalysisResult> {
		// Validate input data
		const validation = this.validateEnhancedAnalysisInput(matches, playerId);
		
		if (!validation.canProceed) {
			return this.createMinimalEnhancedAnalysis(playerId, validation.warnings);
		}

		try {
			// Convert to extended format and get baseline
			const extendedMatches = this.convertToExtendedMatches(matches);
			const baseline = await this.getOrCalculateBaseline(extendedMatches, playerId);
			
			// Basic analysis for backward compatibility
			const basicAnalysis = this.processMatches(matches, playerId);
			
			// Get adaptive thresholds for enhanced analysis
			const adaptiveTiltThresholds = this.adaptiveThresholds?.getTiltThresholds();
			const adaptiveStatePatterns = this.adaptiveThresholds?.getStatePatterns();
			
			// Enhanced analysis components with adaptive thresholds
			const tiltAnalysis = tiltDetector.detectTiltState(extendedMatches, baseline, adaptiveTiltThresholds);
			const stateClassification = performanceStateClassifier.classifyCurrentState(
				basicAnalysis, 
				baseline, 
				extendedMatches
			);
			const correlationResults = correlationAnalyzer.findPerformanceDrivers(extendedMatches);
			const patternAnalysis = patternDetector.detectMomentumPatterns(extendedMatches);
			const cascadeAnalysis = patternDetector.analyzeCascadingEffects(extendedMatches);
			const contextualPatterns = patternDetector.findContextualClusters(extendedMatches);
			
			// Generate predictive alerts
			const immediateAlerts = this.generatePredictiveAlerts(tiltAnalysis, stateClassification, patternAnalysis, baseline);
			
			// Calculate data quality metrics
			const missingDataPercentage = this.calculateMissingDataPercentage(extendedMatches);
			
			// Build enhanced analysis result
			const result: EnhancedAnalysisResult = {
				performanceStateAnalysis: {
					currentState: {
						classification: stateClassification.classification,
						confidence: stateClassification.confidence,
						evidence: stateClassification.evidence,
						baselineDeviation: stateClassification.baselineDeviation
					},
					detectedPatterns: {
						tiltIndicators: {
							active: tiltAnalysis.active,
							severity: tiltAnalysis.severity,
							triggersDetected: tiltAnalysis.triggers,
							prediction: tiltAnalysis.recoveryPrediction
						},
						flowStateIndicators: {
							lastOccurrence: this.getLastFlowStateOccurrence(extendedMatches, baseline),
							triggers: this.getFlowStateTriggers(stateClassification),
							performanceBoost: this.calculateFlowStateBoost(extendedMatches, baseline),
							frequency: this.calculateFlowStateFrequency(extendedMatches, baseline)
						}
					}
				},
				metricCorrelationAnalysis: {
					primaryPerformanceDrivers: correlationResults,
					surprisingFindings: correlationAnalyzer.detectSurprisingCorrelations(
						correlationAnalyzer.buildCorrelationMatrix(extendedMatches)
					)
				},
				predictiveWarningSystem: {
					immediateAlerts
				},
				warnings: validation.warnings
			};

			// Add quality warnings based on data completeness
			if (missingDataPercentage > 50) {
				result.warnings?.push('High percentage of missing extended metrics - some analyses may be limited');
			}
			
			if (matches.length < 10) {
				result.warnings?.push(`Sample size too small (${matches.length} < 10)`);
			}

			return result;
			
		} catch (error) {
			// Fallback to minimal analysis on any errors
			const errorMessage = error instanceof Error ? error.message : 'Unknown error';
			const errorWarnings = [...validation.warnings, `Enhanced analysis error: ${errorMessage}`];
			return this.createMinimalEnhancedAnalysis(playerId, errorWarnings);
		}
	}

	/**
	 * Helper methods for flow state analysis.
	 */
	private getLastFlowStateOccurrence(extendedMatches: any[], baseline: PersonalBaseline): string {
		// Simplified implementation - looks for matches significantly above baseline
		for (let i = 0; i < Math.min(extendedMatches.length, 10); i++) {
			const match = extendedMatches[i];
			if (match.playerStats.rating > baseline.value * 1.15) { // 15% above baseline
				return match.date || 'Unknown';
			}
		}
		return 'Not detected in recent matches';
	}

	private getFlowStateTriggers(stateClassification: any): string[] {
		if (stateClassification.classification === 'flow_state') {
			return stateClassification.evidence || [];
		}
		return [];
	}

	private calculateFlowStateBoost(extendedMatches: any[], baseline: PersonalBaseline): string {
		const recentRatings = extendedMatches.slice(0, 5).map(m => m.playerStats.rating);
		const currentAvg = recentRatings.reduce((a, b) => a + b, 0) / recentRatings.length;
		const boost = ((currentAvg - baseline.value) / baseline.value) * 100;
		
		return boost > 0 ? `+${boost.toFixed(1)}%` : `${boost.toFixed(1)}%`;
	}

	private calculateFlowStateFrequency(extendedMatches: any[], baseline: PersonalBaseline): string {
		const flowMatches = extendedMatches.filter(m => m.playerStats.rating > baseline.value * 1.1).length;
		const frequency = (flowMatches / extendedMatches.length) * 100;
		
		return `${frequency.toFixed(1)}% of recent matches`;
	}
}
