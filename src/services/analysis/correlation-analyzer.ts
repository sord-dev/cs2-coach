/**
 * Correlation analysis engine with Pearson and Spearman methods.
 * Identifies performance drivers and surprising correlations with statistical validation.
 */

import { roundTo } from '../../utils/helpers.js';

import type {
  LeetifyMatchData,
  RawPlayerStats,
  CorrelationResult,
  PerformanceDriver,
  SurprisingFinding
} from '../../types/index.js';

// Local types not in shared types
type CrossCorrelationResult = {
  maxCorrelation: number;
  optimalLag: number;
  pValue: number;
  significance: "low" | "moderate" | "high";
  description: string;
};

type CorrelationMatrix = {
  [metric1: string]: {
    [metric2: string]: CorrelationResult;
  };
};

type ExtendedMatchData = LeetifyMatchData & { rawPlayerStats?: RawPlayerStats };
// MetricPair is only used locally, keep as local type


/**
 * Performs correlation analysis using multiple statistical methods.
 * Identifies performance drivers and detects surprising relationships.
 */
export class CorrelationAnalyzer {
  private readonly MIN_SAMPLE_SIZE = 10;
  private readonly RECOMMENDED_SAMPLE_SIZE = 30;
  private readonly CORRELATION_THRESHOLDS = {
    weak: 0.3,
    moderate: 0.5,
    strong: 0.7,
    veryStrong: 0.9
  };

  /**
   * Calculates Pearson correlation coefficient for linear relationships.
   * 
   * @param x - First variable values
   * @param y - Second variable values
   * @returns Correlation result with statistical significance
   */
  calculatePearsonCorrelation(x: number[], y: number[]): CorrelationResult {
    if (x.length !== y.length || x.length < this.MIN_SAMPLE_SIZE) {
  return this.createInvalidCorrelationResult();
    }

    const n = x.length;
    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = y.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
    const sumX2 = x.reduce((sum, xi) => sum + xi * xi, 0);
    const sumY2 = y.reduce((sum, yi) => sum + yi * yi, 0);

    // Calculate Pearson correlation coefficient
    const numerator = n * sumXY - sumX * sumY;
    const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));

    if (denominator === 0) {
  return this.createInvalidCorrelationResult();
    }

    const r = numerator / denominator;

    // Calculate statistical significance
    const significance = this.calculateSignificance(Math.abs(r));
    const pValue = this.calculatePearsonPValue(r, n);
    const confidenceInterval = this.calculateCorrelationConfidenceInterval(r, n);

    return {
      coefficient: roundTo(r, 4),
      pValue: roundTo(pValue, 4),
      significance,
      sampleSize: n,
      confidenceInterval: [
        roundTo(confidenceInterval[0], 4),
        roundTo(confidenceInterval[1], 4)
      ]
    };
  }

  /**
   * Calculates Spearman rank correlation for non-linear relationships.
   * More robust to outliers than Pearson correlation.
   * 
   * @param x - First variable values
   * @param y - Second variable values
   * @returns Correlation result with statistical significance
   */
  calculateSpearmanCorrelation(x: number[], y: number[]): CorrelationResult {
    if (x.length !== y.length || x.length < this.MIN_SAMPLE_SIZE) {
  return this.createInvalidCorrelationResult();
    }

    // Convert to ranks
    const ranksX = this.calculateRanks(x);
    const ranksY = this.calculateRanks(y);

    // Use Pearson correlation on ranks
    const result = this.calculatePearsonCorrelation(ranksX, ranksY);

    // Adjust p-value calculation for Spearman
    const n = x.length;
    const spearmanPValue = this.calculateSpearmanPValue(result.coefficient, n);

    return {
      ...result,
      pValue: roundTo(spearmanPValue, 4)
    };
  }

  /**
   * Identifies performance drivers by correlating all metrics with rating.
   * 
   * @param matches - Extended match data for analysis
   * @returns Ranked list of performance drivers
   */
  findPerformanceDrivers(matches: ExtendedMatchData[]): PerformanceDriver[] {
    if (matches.length < this.MIN_SAMPLE_SIZE) {
      return [];
    }

    const drivers: PerformanceDriver[] = [];
    const ratings = matches.map(m => m.playerStats.rating);

    // Standard metrics
    const standardMetrics = {
      'K/D Ratio': matches.map(m => m.playerStats.deaths > 0 ? m.playerStats.kills / m.playerStats.deaths : m.playerStats.kills),
      'ADR': matches.map(m => m.playerStats.adr),
      'KAST': matches.map(m => m.playerStats.kast),
      'Headshot %': matches.map(m => m.playerStats.headshotPercentage)
    };

    // Extended metrics (if available)
    const extendedMetrics = this.extractExtendedMetrics(matches);

    // Combine all metrics
    const allMetrics = { ...standardMetrics, ...extendedMetrics };

    // Calculate correlations with rating
    for (const [metricName, values] of Object.entries(allMetrics)) {
      if (values.length !== ratings.length) continue;

      // Calculate both Pearson and Spearman
      const pearson = this.calculatePearsonCorrelation(values, ratings);
      const spearman = this.calculateSpearmanCorrelation(values, ratings);

      // Use the stronger correlation
      const bestCorrelation = Math.abs(pearson.coefficient) > Math.abs(spearman.coefficient) ? pearson : spearman;
      const correlationType = bestCorrelation === pearson ? 'linear' : 'non-linear';

      if (Math.abs(bestCorrelation.coefficient) >= this.CORRELATION_THRESHOLDS.weak) {
        drivers.push({
          metric: metricName,
          correlationToRating: bestCorrelation.coefficient,
          significance: bestCorrelation.significance,
          insight: this.generateDriverInsight(metricName, bestCorrelation, correlationType),
          threshold: this.generateThresholdRecommendation(metricName, values, bestCorrelation.coefficient)
        });
      }
    }

    // Sort by correlation strength
    return drivers.sort((a, b) => Math.abs(b.correlationToRating) - Math.abs(a.correlationToRating));
  }

  /**
   * Detects surprising correlations that don't match expected patterns.
   * 
   * @param correlationMatrix - Matrix of all metric correlations
   * @returns Array of surprising findings with explanations
   */
  detectSurprisingCorrelations(correlationMatrix: CorrelationMatrix): SurprisingFinding[] {
    const surprisingFindings: SurprisingFinding[] = [];

    // Define expected correlation patterns


    // Check for surprising patterns

    for (const [metric1, correlations] of Object.entries(correlationMatrix)) {
      for (const [metric2, result] of Object.entries(correlations as { [metric2: string]: CorrelationResult })) {
        if (metric1 === metric2) continue;

        const surprise = this.evaluateCorrelationSurprise(metric1, metric2, result);
        if (surprise) {
          surprisingFindings.push(surprise);
        }
      }
    }

    // Sort by statistical significance
    return surprisingFindings.sort((a, b) => {
      const scoreA = this.calculateSurpriseScore(a);
      const scoreB = this.calculateSurpriseScore(b);
      return scoreB - scoreA;
    });
  }

  /**
   * Calculates cross-correlation for time-delayed effects.
   * Useful for detecting tilt cascade patterns.
   * 
   * @param series1 - First time series
   * @param series2 - Second time series
   * @param maxLag - Maximum lag to test
   * @returns Cross-correlation result with optimal lag
   */
  calculateLaggedCorrelation(series1: number[], series2: number[], maxLag: number): CrossCorrelationResult {
    if (series1.length !== series2.length || series1.length < this.MIN_SAMPLE_SIZE) {
      return {
        maxCorrelation: 0,
        optimalLag: 0,
        pValue: 1,
        significance: 'low',
        description: 'Insufficient data for cross-correlation analysis'
      };
    }

    let maxCorrelation = 0;
    let optimalLag = 0;
    let bestPValue = 1;

    // Test different lags
    for (let lag = 0; lag <= Math.min(maxLag, Math.floor(series1.length / 3)); lag++) {
      // Positive lag: series2 lags behind series1
      const correlation1 = this.calculateLaggedPearson(series1, series2, lag);
      
      // Negative lag: series1 lags behind series2
      const correlation2 = lag > 0 ? this.calculateLaggedPearson(series2, series1, lag) : correlation1;

      if (Math.abs(correlation1.coefficient) > Math.abs(maxCorrelation)) {
        maxCorrelation = correlation1.coefficient;
        optimalLag = lag;
        bestPValue = correlation1.pValue;
      }

      if (lag > 0 && Math.abs(correlation2.coefficient) > Math.abs(maxCorrelation)) {
        maxCorrelation = correlation2.coefficient;
        optimalLag = -lag;
        bestPValue = correlation2.pValue;
      }
    }

    const significance = this.calculateSignificance(Math.abs(maxCorrelation));
    const description = this.generateLagDescription(maxCorrelation, optimalLag);

    return {
      maxCorrelation: roundTo(maxCorrelation, 4),
      optimalLag,
      pValue: roundTo(bestPValue, 4),
      significance,
      description
    };
  }

  /**
   * Builds complete correlation matrix for all metric pairs.
   * 
   * @param matches - Extended match data
   * @returns Complete correlation matrix
   */
  buildCorrelationMatrix(matches: ExtendedMatchData[]): CorrelationMatrix {
    const matrix: CorrelationMatrix = {};
    
    if (matches.length < this.MIN_SAMPLE_SIZE) {
      return matrix;
    }

    // Extract all available metrics
    const allMetrics = this.getAllMetricsFromMatches(matches);

    // Calculate all pairwise correlations
    const metricKeys = Object.keys(allMetrics);
    for (const metric1 of metricKeys) {
      matrix[metric1] = {};
      const values1 = allMetrics[metric1] || [];
      for (const metric2 of metricKeys) {
        const values2 = allMetrics[metric2] || [];
        // Always set the entry, even if all values are NaN
        const hasInvalid =
          values1.length !== values2.length ||
          values1.length < this.MIN_SAMPLE_SIZE ||
          values1.some(v => v === undefined || Number.isNaN(v)) ||
          values2.some(v => v === undefined || Number.isNaN(v));
        if (hasInvalid) {
          matrix[metric1][metric2] = this.createInvalidCorrelationResult();
        } else {
          // Use Spearman for most pairs as it's more robust
          matrix[metric1][metric2] = this.calculateSpearmanCorrelation(values1, values2);
        }
      }
    }

    return matrix;
  }

  /**
   * Validates correlation analysis quality and provides warnings.
   * 
   * @param sampleSize - Number of data points
   * @param missingDataPercentage - Percentage of missing data
   * @returns Quality assessment with warnings
   */
  validateAnalysisQuality(sampleSize: number, missingDataPercentage: number): {
    quality: 'excellent' | 'good' | 'acceptable' | 'poor';
    warnings: string[];
    recommendations: string[];
  } {
    const warnings: string[] = [];
    const recommendations: string[] = [];
    let quality: 'excellent' | 'good' | 'acceptable' | 'poor';

    // Sample size assessment
    if (sampleSize < this.MIN_SAMPLE_SIZE) {
      quality = 'poor';
      warnings.push(`Sample size too small (${sampleSize} < ${this.MIN_SAMPLE_SIZE})`);
      recommendations.push(`Need at least ${this.MIN_SAMPLE_SIZE - sampleSize} more matches for basic correlation analysis`);
    } else if (sampleSize < this.RECOMMENDED_SAMPLE_SIZE) {
      quality = 'acceptable';
      warnings.push(`Limited sample size (${sampleSize} < ${this.RECOMMENDED_SAMPLE_SIZE})`);
      recommendations.push(`${this.RECOMMENDED_SAMPLE_SIZE - sampleSize} more matches recommended for reliable results`);
    } else if (sampleSize < 50) {
      quality = 'good';
    } else {
      quality = 'excellent';
    }

    // Missing data assessment
    if (missingDataPercentage > 30) {
      quality = 'poor';
      warnings.push(`High missing data rate (${missingDataPercentage.toFixed(1)}%)`);
      recommendations.push('Extended metrics may not be available for all matches');
    } else if (missingDataPercentage > 15) {
      warnings.push(`Moderate missing data rate (${missingDataPercentage.toFixed(1)}%)`);
      recommendations.push('Some extended metrics have limited data');
    }

    return { quality, warnings, recommendations };
  }

  /**
   * Extracts extended metrics from match data.
   */
  private extractExtendedMetrics(matches: ExtendedMatchData[]): Record<string, number[]> {
    const metrics: Record<string, number[]> = {};

    // Extract available extended metrics
    const extendedFields = [
      'preaim', 'reaction_time', 'spray_accuracy', 'accuracy',
      'shots_fired', 'shots_hit_foe', 'flashbang_hit_foe', 'smoke_thrown'
    ];

    for (const field of extendedFields) {
      const values = matches
        .map(m => m.rawPlayerStats?.[field as keyof RawPlayerStats] as number || 0)
        .filter(v => v > 0); // Filter out missing/zero values

      if (values.length >= this.MIN_SAMPLE_SIZE) {
        const fieldName = this.formatFieldName(field);
        metrics[fieldName] = this.padArrayToLength(values, matches.length);
      }
    }

    // Calculate derived metrics
    const utilityEfficiency = matches.map(m => this.calculateUtilityEfficiency(m.rawPlayerStats));
    if (utilityEfficiency.filter(v => v > 0).length >= this.MIN_SAMPLE_SIZE) {
      metrics['Utility Efficiency'] = utilityEfficiency;
    }

    return metrics;
  }

  /**
   * Calculates utility efficiency from raw stats.
   */
  private calculateUtilityEfficiency(rawStats: any): number {
    if (!rawStats) return 0;

    const totalUtility = (rawStats.smoke_thrown || 0) + (rawStats.flashbang_thrown || 0) + (rawStats.he_thrown || 0);
    if (totalUtility === 0) return 0;

    const effectiveUtility = (rawStats.flashbang_hit_foe || 0) + 
                           (rawStats.he_foes_damage_avg > 0 ? 1 : 0);

    return (effectiveUtility / totalUtility) * 100;
  }

  /**
   * Calculates ranks for Spearman correlation.
   */
  private calculateRanks(values: number[]): number[] {
    const sortedIndices = values
      .map((value, index) => ({ value, index }))
      .sort((a, b) => a.value - b.value);

    const ranks = new Array(values.length);
    
    for (let i = 0; i < sortedIndices.length; i++) {
      ranks[sortedIndices[i].index] = i + 1;
    }

    return ranks;
  }

  /**
   * Calculates statistical significance level.
   */
  private calculateSignificance(correlationCoeff: number): "low" | "moderate" | "high" {
    const absCorr = Math.abs(correlationCoeff);
    
    if (absCorr >= this.CORRELATION_THRESHOLDS.strong) return 'high';
    if (absCorr >= this.CORRELATION_THRESHOLDS.moderate) return 'moderate';
    return 'low';
  }

  /**
   * Calculates p-value for Pearson correlation.
   */
  private calculatePearsonPValue(r: number, n: number): number {
    if (n <= 2) return 1;
    
    const t = r * Math.sqrt((n - 2) / (1 - r * r));
    const df = n - 2;
    
    // Simplified t-distribution p-value approximation
    return this.tDistributionPValue(Math.abs(t), df) * 2; // Two-tailed
  }

  /**
   * Calculates p-value for Spearman correlation.
   */
  private calculateSpearmanPValue(rho: number, n: number): number {
    if (n <= 2) return 1;
    
    // For large samples, Spearman correlation follows similar distribution to Pearson
    const t = rho * Math.sqrt((n - 2) / (1 - rho * rho));
    const df = n - 2;
    
    return this.tDistributionPValue(Math.abs(t), df) * 2; // Two-tailed
  }

  /**
   * Simplified t-distribution p-value calculation.
   */
  private tDistributionPValue(t: number, df: number): number {
    // Simplified approximation for common cases
    if (df >= 30) {
      // Use normal approximation for large df
      return this.normalCDF(-Math.abs(t));
    }
    
    // Simplified lookup table for small df
    const criticalValues: Record<number, number[]> = {
      10: [1.812, 2.228, 2.764, 3.169],  // 0.1, 0.05, 0.01, 0.005
      20: [1.725, 2.086, 2.528, 2.845],
      30: [1.697, 2.042, 2.457, 2.750]
    };
    
    const values = criticalValues[Math.min(30, Math.max(10, Math.floor(df / 10) * 10))];
    
    if (t < values[0]) return 0.1;
    if (t < values[1]) return 0.05;
    if (t < values[2]) return 0.01;
    if (t < values[3]) return 0.005;
    return 0.001;
  }

  /**
   * Simplified normal CDF for p-value calculation.
   */
  private normalCDF(z: number): number {
    return 0.5 * (1 + this.erf(z / Math.sqrt(2)));
  }

  /**
   * Error function approximation.
   */
  private erf(x: number): number {
    // Abramowitz and Stegun approximation
    const a1 =  0.254829592;
    const a2 = -0.284496736;
    const a3 =  1.421413741;
    const a4 = -1.453152027;
    const a5 =  1.061405429;
    const p  =  0.3275911;

    const sign = x >= 0 ? 1 : -1;
    x = Math.abs(x);

    const t = 1 / (1 + p * x);
    const y = 1 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);

    return sign * y;
  }

  /**
   * Calculates confidence interval for correlation coefficient.
   */
  private calculateCorrelationConfidenceInterval(r: number, n: number, /* confidence: number = 0.95 */): [number, number] {
    if (n <= 3) return [r, r];
    // Fisher's z-transformation
    const z = 0.5 * Math.log((1 + r) / (1 - r));
    const se = 1 / Math.sqrt(n - 3);
    // Critical value for 95% confidence
    const criticalValue = 1.96;
    const zLower = z - criticalValue * se;
    const zUpper = z + criticalValue * se;
    // Transform back to correlation scale
    const rLower = (Math.exp(2 * zLower) - 1) / (Math.exp(2 * zLower) + 1);
    const rUpper = (Math.exp(2 * zUpper) - 1) / (Math.exp(2 * zUpper) + 1);
    return [rLower, rUpper];
  }

  /**
   * Generates insight text for performance drivers.
   */
  private generateDriverInsight(metric: string, correlation: CorrelationResult, type: string): string {
    const strength = this.getCorrelationStrength(Math.abs(correlation.coefficient));
    const direction = correlation.coefficient > 0 ? 'positively' : 'negatively';
    const reliability = correlation.pValue < 0.05 ? 'statistically significant' : 'not statistically significant';
    
    return `${metric} shows ${strength} ${direction} correlation with rating (${type}, ${reliability})`;
  }

  /**
   * Gets correlation strength description.
   */
  private getCorrelationStrength(absCorr: number): string {
    if (absCorr >= this.CORRELATION_THRESHOLDS.veryStrong) return 'very strong';
    if (absCorr >= this.CORRELATION_THRESHOLDS.strong) return 'strong';
    if (absCorr >= this.CORRELATION_THRESHOLDS.moderate) return 'moderate';
    return 'weak';
  }

  /**
   * Generates threshold recommendation for performance drivers.
   */
  private generateThresholdRecommendation(metric: string, values: number[], correlation: number): string {
    if (values.length === 0) return 'No threshold available';
    
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const std = Math.sqrt(values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length);
    
    if (correlation > 0) {
      // Positive correlation - higher is better
      const target = mean + std;
      return `Target: > ${target.toFixed(2)} (current avg: ${mean.toFixed(2)})`;
    } else {
      // Negative correlation - lower is better
      const target = mean - std;
      return `Target: < ${target.toFixed(2)} (current avg: ${mean.toFixed(2)})`;
    }
  }

  /**
   * Additional helper methods for complete functionality...
   */
  
  private createInvalidCorrelationResult(/* reason: string */): CorrelationResult {
    return {
      coefficient: 0,
      pValue: 1,
      significance: 'low',
      sampleSize: 0,
      confidenceInterval: [0, 0]
    };
  }

  private calculateLaggedPearson(series1: number[], series2: number[], lag: number): CorrelationResult {
    const s1 = series1.slice(0, series1.length - lag);
    const s2 = series2.slice(lag);
    return this.calculatePearsonCorrelation(s1, s2);
  }

  private generateLagDescription(correlation: number, lag: number): string {
    const strength = this.getCorrelationStrength(Math.abs(correlation));
    const direction = correlation > 0 ? 'positive' : 'negative';
    
    if (lag === 0) {
      return `${strength} ${direction} correlation with no time delay`;
    } else if (lag > 0) {
      return `${strength} ${direction} correlation with ${lag} match delay`;
    } else {
      return `${strength} ${direction} correlation leading by ${Math.abs(lag)} matches`;
    }
  }

  private getAllMetricsFromMatches(matches: ExtendedMatchData[]): Record<string, number[]> {
    const metrics: Record<string, number[]> = {};
    const standardMetricDefs: [string, (m: ExtendedMatchData) => number | undefined][] = [
      ['Rating', m => m.playerStats.rating],
      ['K/D Ratio', m => m.playerStats.deaths > 0 ? m.playerStats.kills / m.playerStats.deaths : m.playerStats.kills],
      ['ADR', m => m.playerStats.adr],
      ['KAST', m => m.playerStats.kast],
      ['Headshot %', m => m.playerStats.headshotPercentage],
    ];
    for (const [key, fn] of standardMetricDefs) {
      metrics[key] = matches.map(fn).map(v => v === undefined ? NaN : v);
    }
    // Extended metrics
    const extended = this.extractExtendedMetrics(matches);
    Object.assign(metrics, extended);
    return metrics;
  }

  private formatFieldName(field: string): string {
    return field
      .replace(/_/g, ' ')
      .replace(/\b\w/g, l => l.toUpperCase());
  }

  private padArrayToLength(arr: number[], targetLength: number): number[] {
    // For missing values, we'll use the mean of available values
    const mean = arr.reduce((a, b) => a + b, 0) / arr.length;
    const result = new Array(targetLength).fill(mean);
    
    // Fill in actual values where available
    let arrIndex = 0;
    for (let i = 0; i < targetLength && arrIndex < arr.length; i++) {
      if (arr[arrIndex] > 0) {
        result[i] = arr[arrIndex];
      }
      arrIndex++;
    }
    
    return result;
  }

  private evaluateCorrelationSurprise(metric1: string, metric2: string, result: CorrelationResult): SurprisingFinding | null {
    // This is a simplified implementation - in practice, you'd have more sophisticated surprise detection
    if (result.pValue > 0.05) return null; // Not statistically significant
    
    const absCorr = Math.abs(result.coefficient);
    if (absCorr < this.CORRELATION_THRESHOLDS.moderate) return null; // Not strong enough
    
    // Example surprise: if reaction time is positively correlated with performance (unexpected)
    if (metric1.includes('Reaction Time') && metric2 === 'Rating' && result.coefficient > 0) {
      return {
        finding: `Unexpected positive correlation between ${metric1} and ${metric2}`,
        explanation: 'Higher reaction times typically correlate with worse performance',
        recommendation: 'Investigate potential data quality issues or unique playstyle factors'
      };
    }
    
    return null;
  }

  private calculateSurpriseScore(finding: SurprisingFinding): number {
    // Simple scoring - could be more sophisticated
    return finding.finding.length; // Placeholder
  }
}

/**
 * Singleton instance for global correlation analysis access.
 */
export const correlationAnalyzer = new CorrelationAnalyzer();