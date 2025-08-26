/**
 * Personal baseline calculator with rolling average and exponential decay.
 * Implements statistical methods for performance baseline tracking.
 */

import { roundTo } from '../../utils/helpers.js';
import { BASELINE_CONSTANTS } from '../utils.js';
import { baselineStorageManager } from '../analysis/index.js';
import type { LeetifyMatchData, RawPlayerStats, PersonalBaseline } from '../../types/index.js';

type ExtendedMatchData = LeetifyMatchData & { rawPlayerStats?: RawPlayerStats };

interface DeviationResult {
	isSignificant: boolean;
	severity: 'low' | 'moderate' | 'high';
	standardDeviations: number;
	description: string;
}

/**
 * Calculates and manages personal performance baselines using statistical methods.
 * Implements rolling averages with exponential decay and confidence intervals.
 */
export class PersonalBaselineCalculator {
	private readonly DEFAULT_DECAY_FACTOR = BASELINE_CONSTANTS.DEFAULT_DECAY_FACTOR;
	private readonly MIN_RELIABLE_SAMPLE = BASELINE_CONSTANTS.MIN_RELIABLE_SAMPLE;
	private readonly PREFERRED_SAMPLE = BASELINE_CONSTANTS.PREFERRED_SAMPLE;
	private readonly MIN_MAP_SAMPLE = BASELINE_CONSTANTS.MIN_MAP_SAMPLE;

	/**
	 * Calculates rolling baseline with exponential decay.
	 * 
	 * @param matches - Match data for baseline calculation
	 * @param windowSize - Maximum matches to consider (default: 50)
	 * @param decayFactor - Exponential decay factor (default: 0.95)
	 * @returns Personal baseline with confidence intervals
	 */
	calculateRollingBaseline(
		matches: ExtendedMatchData[], 
		windowSize: number = this.PREFERRED_SAMPLE,
		decayFactor: number = this.DEFAULT_DECAY_FACTOR
	): PersonalBaseline {
		if (matches.length === 0) {
			return this.createEmptyBaseline();
		}

		// Sort matches by date (most recent first)
		const sortedMatches = this.sortMatchesByDate(matches);
		const recentMatches = sortedMatches.slice(0, windowSize);
    
		// Extract rating values for baseline calculation
		const ratings = recentMatches.map(match => match.playerStats.rating);
    
		// Calculate weighted average with exponential decay
		const weightedAverage = this.calculateExponentialAverage(ratings, decayFactor);
    
		// Calculate variance for confidence intervals
		const variance = this.calculateWeightedVariance(ratings, weightedAverage, decayFactor);
    
		// Calculate confidence interval
		const confidenceInterval = this.getConfidenceInterval(
			weightedAverage, 
			variance, 
			recentMatches.length
		);

		return {
			value: roundTo(weightedAverage, 3),
			confidenceInterval: [
				roundTo(confidenceInterval[0], 3),
				roundTo(confidenceInterval[1], 3)
			],
			sampleSize: recentMatches.length,
			lastUpdated: new Date().toISOString(),
			variance: roundTo(variance, 6)
		};
	}

	/**
	 * Updates baseline incrementally with new match data.
	 * More efficient than recalculating entire baseline.
	 * 
	 * @param current - Current baseline
	 * @param newMatch - New match data to incorporate
	 * @param decayFactor - Exponential decay factor
	 * @returns Updated baseline
	 */
	updateBaselineIncremental(
		current: PersonalBaseline, 
		newMatch: ExtendedMatchData,
		decayFactor: number = this.DEFAULT_DECAY_FACTOR
	): PersonalBaseline {
		const newRating = newMatch.playerStats.rating;
		const alpha = 1 - decayFactor; // Learning rate
    
		// Update weighted average
		const newValue = current.value * decayFactor + newRating * alpha;
    
		// Update variance incrementally
		const delta = newRating - current.value;
		const newVariance = decayFactor * current.variance + alpha * delta * delta;
    
		// Increment sample size (with maximum cap)
		const newSampleSize = Math.min(current.sampleSize + 1, this.PREFERRED_SAMPLE);
    
		// Recalculate confidence interval
		const confidenceInterval = this.getConfidenceInterval(newValue, newVariance, newSampleSize);

		return {
			value: roundTo(newValue, 3),
			confidenceInterval: [
				roundTo(confidenceInterval[0], 3),
				roundTo(confidenceInterval[1], 3)
			],
			sampleSize: newSampleSize,
			lastUpdated: new Date().toISOString(),
			variance: roundTo(newVariance, 6)
		};
	}

	/**
	 * Calculates confidence interval for baseline.
	 * Uses t-distribution for small samples, normal distribution for large samples.
	 * 
	 * @param baseline - Baseline value
	 * @param variance - Variance
	 * @param sampleSize - Sample size
	 * @returns Confidence interval [lower, upper]
	 */
	getConfidenceInterval(baseline: number, variance: number, sampleSize: number): [number, number] {
		const standardError = Math.sqrt(variance / sampleSize);
    
		// Use appropriate critical value based on sample size
		let criticalValue: number;
		if (sampleSize < 30) {
			// Use t-distribution for small samples (simplified t-values)
			const tValues: Record<number, number> = {
				5: 2.776, 10: 2.228, 15: 2.145, 20: 2.086, 25: 2.060
			};
			criticalValue = this.interpolateTValue(sampleSize, tValues);
		} else {
			// Use normal distribution for large samples (95% confidence)
			criticalValue = 1.96;
		}
    
		const marginOfError = criticalValue * standardError;
    
		return [
			baseline - marginOfError,
			baseline + marginOfError
		];
	}

	/**
	 * Detects significant deviation from baseline.
	 * 
	 * @param current - Current performance value
	 * @param baseline - Personal baseline
	 * @returns Deviation analysis result
	 */
	detectSignificantDeviation(current: number, baseline: PersonalBaseline): DeviationResult {
		if (baseline.sampleSize < this.MIN_RELIABLE_SAMPLE) {
			return {
				isSignificant: false,
				severity: 'low',
				standardDeviations: 0,
				description: 'Insufficient sample size for reliable deviation detection'
			};
		}

		const standardDeviations = Math.abs(current - baseline.value) / Math.sqrt(baseline.variance);
    
		let severity: 'low' | 'moderate' | 'high';
		let isSignificant: boolean;
		let description: string;

		if (standardDeviations >= 2.0) {
			severity = 'high';
			isSignificant = true;
			description = `Performance significantly ${current > baseline.value ? 'above' : 'below'} personal baseline (±2σ)`;
		} else if (standardDeviations >= 1.0) {
			severity = 'moderate';
			isSignificant = true;
			description = `Performance moderately ${current > baseline.value ? 'above' : 'below'} personal baseline (±1σ)`;
		} else {
			severity = 'low';
			isSignificant = false;
			description = 'Performance within normal baseline range';
		}

		return {
			isSignificant,
			severity,
			standardDeviations: roundTo(standardDeviations, 2),
			description
		};
	}

	/**
	 * Calculates map-specific baseline when sufficient data is available.
	 * 
	 * @param matches - Match data for specific map
	 * @param mapName - Map name
	 * @param playerId - Player ID for storage
	 * @returns Map-specific baseline or null if insufficient data
	 */
	calculateMapSpecificBaseline(
		matches: ExtendedMatchData[], 
		mapName: string,
		playerId: string
	): PersonalBaseline | null {
		const mapMatches = matches.filter(match => match.map === mapName);
    
		if (mapMatches.length < this.MIN_MAP_SAMPLE) {
			return null; // Insufficient data for map-specific baseline
		}

		const baseline = this.calculateRollingBaseline(mapMatches);
    
		// Store map-specific baseline
		baselineStorageManager.setBaseline(playerId, baseline, mapName);
    
		return baseline;
	}

	/**
	 * Gets or calculates baseline for player with caching.
	 * 
	 * @param matches - Match data
	 * @param playerId - Player ID
	 * @param mapName - Optional map name for map-specific baseline
	 * @param forceRecalculate - Force recalculation instead of using cache
	 * @returns Personal baseline
	 */
	getOrCalculateBaseline(
		matches: ExtendedMatchData[], 
		playerId: string,
		mapName?: string,
		forceRecalculate: boolean = false
	): PersonalBaseline {
		// Try to get cached baseline first
		if (!forceRecalculate) {
			const cached = baselineStorageManager.getBaseline(playerId, mapName);
			if (cached && this.isBaselineRecent(cached)) {
				return cached;
			}
		}

		// Calculate new baseline
		let baseline: PersonalBaseline;
    
		if (mapName) {
			const mapBaseline = this.calculateMapSpecificBaseline(matches, mapName, playerId);
			baseline = mapBaseline || this.calculateRollingBaseline(matches);
		} else {
			baseline = this.calculateRollingBaseline(matches);
		}

		// Store calculated baseline
		baselineStorageManager.setBaseline(playerId, baseline, mapName);
    
		return baseline;
	}

	/**
	 * Evaluates baseline reliability based on sample size and age.
	 * 
	 * @param baseline - Baseline to evaluate
	 * @returns Baseline quality assessment
	 */
	evaluateBaselineQuality(baseline: PersonalBaseline): {
		reliability: 'excellent' | 'good' | 'acceptable' | 'limited' | 'unreliable';
		confidence: number;
		recommendations: string[];
	} {
		const recommendations: string[] = [];
		let reliability: 'excellent' | 'good' | 'acceptable' | 'limited' | 'unreliable';
		let confidence: number;

		// Evaluate based on sample size
		if (baseline.sampleSize >= 100) {
			reliability = 'excellent';
			confidence = 0.95;
		} else if (baseline.sampleSize >= this.PREFERRED_SAMPLE) {
			reliability = 'good';
			confidence = 0.85;
		} else if (baseline.sampleSize >= this.MIN_RELIABLE_SAMPLE) {
			reliability = 'acceptable';
			confidence = 0.70;
			recommendations.push(`Play ${this.PREFERRED_SAMPLE - baseline.sampleSize} more matches for improved baseline reliability`);
		} else if (baseline.sampleSize >= 10) {
			reliability = 'limited';
			confidence = 0.50;
			recommendations.push(`Need ${this.MIN_RELIABLE_SAMPLE - baseline.sampleSize} more matches for reliable baseline`);
		} else {
			reliability = 'unreliable';
			confidence = 0.20;
			recommendations.push('Insufficient data for meaningful baseline analysis');
		}

		// Check baseline age
		const baselineAge = Date.now() - new Date(baseline.lastUpdated).getTime();
		const daysOld = baselineAge / (1000 * 60 * 60 * 24);
    
		if (daysOld > 30) {
			confidence *= 0.8; // Reduce confidence for old baselines
			recommendations.push('Baseline is over 30 days old - consider updating with recent matches');
		}

		return {
			reliability,
			confidence: roundTo(confidence, 2),
			recommendations
		};
	}

	/**
	 * Calculates exponential weighted average.
	 * More recent values have higher weight.
	 */
	private calculateExponentialAverage(values: number[], decayFactor: number): number {
		if (values.length === 0) return 0;
    
		let weightedSum = 0;
		let weightSum = 0;
    
		for (let i = 0; i < values.length; i++) {
			const weight = Math.pow(decayFactor, i);
			weightedSum += values[i] * weight;
			weightSum += weight;
		}
    
		return weightSum > 0 ? weightedSum / weightSum : 0;
	}

	/**
	 * Calculates weighted variance for confidence intervals.
	 */
	private calculateWeightedVariance(
		values: number[], 
		mean: number, 
		decayFactor: number
	): number {
		if (values.length <= 1) return 0;
    
		let weightedSumSquares = 0;
		let weightSum = 0;
    
		for (let i = 0; i < values.length; i++) {
			const weight = Math.pow(decayFactor, i);
			const deviation = values[i] - mean;
			weightedSumSquares += deviation * deviation * weight;
			weightSum += weight;
		}
    
		return weightSum > 0 ? weightedSumSquares / weightSum : 0;
	}

	/**
	 * Sorts matches by date (most recent first).
	 */
	private sortMatchesByDate(matches: ExtendedMatchData[]): ExtendedMatchData[] {
		return [...matches].sort((a, b) => {
			const dateA = new Date(a.date).getTime();
			const dateB = new Date(b.date).getTime();
			return dateB - dateA; // Most recent first
		});
	}

	/**
	 * Interpolates t-value for given sample size.
	 */
	private interpolateTValue(sampleSize: number, tValues: Record<number, number>): number {
		const sizes = Object.keys(tValues).map(Number).sort((a, b) => a - b);
    
		// Find surrounding values
		for (let i = 0; i < sizes.length - 1; i++) {
			if (sampleSize >= sizes[i] && sampleSize < sizes[i + 1]) {
				// Linear interpolation
				const x1 = sizes[i];
				const x2 = sizes[i + 1];
				const y1 = tValues[x1];
				const y2 = tValues[x2];
        
				return y1 + (y2 - y1) * (sampleSize - x1) / (x2 - x1);
			}
		}
    
		// Use boundary values
		if (sampleSize < sizes[0]) return tValues[sizes[0]];
		return tValues[sizes[sizes.length - 1]];
	}

	/**
	 * Creates empty baseline for initialization.
	 */
	private createEmptyBaseline(): PersonalBaseline {
		return {
			value: 0,
			confidenceInterval: [0, 0],
			sampleSize: 0,
			lastUpdated: new Date().toISOString(),
			variance: 0
		};
	}

	/**
	 * Checks if baseline is recent enough to be reliable.
	 */
	private isBaselineRecent(baseline: PersonalBaseline): boolean {
		const age = Date.now() - new Date(baseline.lastUpdated).getTime();
		const maxAge = 7 * 24 * 60 * 60 * 1000; // 7 days
		return age < maxAge;
	}
}

/**
 * Singleton instance for global baseline calculation access.
 */
export const personalBaselineCalculator = new PersonalBaselineCalculator();
