// Stat math and trend helpers for LeetifyDataTransformer
import { roundTo } from '../../utils/helpers.js';
import type { LeetifyMatchData, ProcessedStats, ExtendedProcessedStats } from '../../types/index.js';

/**
 * Calculates match performance from Leetify match data.
 * Extracts both basic and extended metrics for enhanced analysis.
 */
export function calculateMatchPerformance(matches: LeetifyMatchData[]): ProcessedStats[] {
	return matches.map(match => ({
		rating: match.playerStats.rating,
		kdRatio: match.playerStats.deaths > 0 
			? match.playerStats.kills / match.playerStats.deaths 
			: match.playerStats.kills,
		adr: match.playerStats.adr,
		kast: match.playerStats.kast,
		headshotPercentage: match.playerStats.headshotPercentage,
		gamesPlayed: 1,
	}));
}

/**
 * Calculates extended match performance including advanced metrics.
 * Used for enhanced analysis with personal baselines and tilt detection.
 */
export function calculateExtendedMatchPerformance(matches: any[], matchIndex: number = 0): ExtendedProcessedStats[] {
	return matches.map((match, index) => {
		const basicStats = calculateMatchPerformance([match])[0];
    
		// Extract extended metrics from raw player stats if available
		const extendedMetrics = extractExtendedMetrics(match);
    
		return {
			...basicStats,
			personalBaseline: {
				value: basicStats.rating,
				confidenceInterval: [0, 0],
				sampleSize: 0,
				lastUpdated: new Date().toISOString(),
				variance: 0
			},
			deviationFromBaseline: 0,
			confidenceLevel: "low" as const,
			preaim: extendedMetrics.preaim,
			reactionTime: extendedMetrics.reactionTime,
			sprayAccuracy: extendedMetrics.sprayAccuracy,
			utilityEfficiency: extendedMetrics.utilityEfficiency,
			sessionPosition: index + matchIndex,
			timeOfDay: getTimeOfDay(match.date),
			mapSpecificPerformance: basicStats.rating
		};
	});
}

/**
 * Extracts extended metrics from match data.
 * Handles both raw API format and transformed format gracefully.
 */
function extractExtendedMetrics(match: any): {
	preaim: number;
	reactionTime: number;
	sprayAccuracy: number;
	utilityEfficiency: number;
} {
	// Try to get from raw stats first (if available)
	const rawStats = match.rawPlayerStats || match.playerStats;
  
	return {
		preaim: rawStats?.preaim || 0,
		reactionTime: rawStats?.reaction_time || 0,
		sprayAccuracy: rawStats?.spray_accuracy || 0,
		utilityEfficiency: calculateUtilityEfficiency(rawStats)
	};
}

/**
 * Calculates utility efficiency from raw player stats.
 * Based on utility usage effectiveness and team coordination.
 */
function calculateUtilityEfficiency(rawStats: any): number {
	if (!rawStats) return 0;
  
	const smokeThrown = rawStats.smoke_thrown || 0;
	const flashbangThrown = rawStats.flashbang_thrown || 0;
	const heThrown = rawStats.he_thrown || 0;
	const flashbangsHitFoe = rawStats.flashbang_hit_foe || 0;
	const heFoesDamage = rawStats.he_foes_damage_avg || 0;
  
	// Calculate utility effectiveness percentage
	const totalUtility = smokeThrown + flashbangThrown + heThrown;
	if (totalUtility === 0) return 0;
  
	const effectiveUtility = flashbangsHitFoe + (heFoesDamage > 0 ? 1 : 0);
	return roundTo((effectiveUtility / totalUtility) * 100, 1);
}

/**
 * Extracts time of day from match date for temporal analysis.
 */
function getTimeOfDay(dateString: string): string {
	if (!dateString) return 'unknown';
  
	try {
		const date = new Date(dateString);
		if (isNaN(date.getTime())) return 'unknown';
    
		const hour = date.getHours();
    
		if (hour >= 6 && hour < 12) return 'morning';
		if (hour >= 12 && hour < 18) return 'afternoon';
		if (hour >= 18 && hour < 24) return 'evening';
		return 'night';
	} catch {
		return 'unknown';
	}
}

export function calculateAverageStats(performances: ProcessedStats[]): ProcessedStats {
	if (!performances.length) {
		return getDefaultStats();
	}
	const totals = performances.reduce((acc, perf) => ({
		rating: acc.rating + perf.rating,
		kdRatio: acc.kdRatio + perf.kdRatio,
		adr: acc.adr + perf.adr,
		kast: acc.kast + perf.kast,
		headshotPercentage: acc.headshotPercentage + perf.headshotPercentage,
		gamesPlayed: acc.gamesPlayed + 1,
	}), getDefaultStats());
	const count = performances.length;
	return {
		rating: roundTo(totals.rating / count, 2),
		kdRatio: roundTo(totals.kdRatio / count, 2),
		adr: roundTo(totals.adr / count, 1),
		kast: roundTo(totals.kast / count, 1),
		headshotPercentage: roundTo(totals.headshotPercentage / count, 1),
		gamesPlayed: count,
	};
}

export function getDefaultStats(): ProcessedStats {
	return {
		rating: 0,
		kdRatio: 0,
		adr: 0,
		kast: 0,
		headshotPercentage: 0,
		gamesPlayed: 0,
	};
}
