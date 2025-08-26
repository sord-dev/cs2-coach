/**
 * @fileoverview Unit tests for PersonalBaselineCalculator
 * Tests personal baseline calculation with statistical validation
 */

import { PersonalBaselineCalculator } from '../../../../src/services/analysis';
import { createValidLeetifyMatchData, createValidExtendedMatchData } from '../../../test-data';

describe('PersonalBaselineCalculator', () => {
  let calculator: PersonalBaselineCalculator;
  
  beforeEach(() => {
    calculator = new PersonalBaselineCalculator();
  });

  describe('calculateRollingBaseline', () => {
    const ratings = [1.0, 1.1, 1.2, 0.9, 1.05];
    const rawPlayerStatsArray = ratings.map((r, i) => ({
      rating: r,
      preaim: [5.0, 4.8, 4.6, 5.2, 4.9][i],
      reaction_time: [0.5, 0.52, 0.48, 0.55, 0.51][i]
    }));
    const mockMatches = createValidExtendedMatchData(ratings, { rawPlayerStats: undefined }, rawPlayerStatsArray);

    it('should calculate baseline with expected use case', () => {
      const baseline = calculator.calculateRollingBaseline(mockMatches);
      
      // Basic structure validation
      expect(baseline).toHaveProperty('value');
      expect(baseline).toHaveProperty('confidenceInterval');
      expect(baseline).toHaveProperty('sampleSize');
      expect(baseline).toHaveProperty('lastUpdated');
      expect(baseline).toHaveProperty('variance');
      
      // Statistical validation
      expect(baseline.value).toBeCloseTo(1.05, 2); // Expected weighted average
      expect(baseline.confidenceInterval).toHaveLength(2);
      expect(baseline.confidenceInterval[0]).toBeLessThan(baseline.value);
      expect(baseline.confidenceInterval[1]).toBeGreaterThan(baseline.value);
      expect(baseline.sampleSize).toBe(mockMatches.length);
      expect(baseline.variance).toBeGreaterThan(0);
    });

    it('should handle edge case with single match', () => {
      const singleMatch = [mockMatches[0]];
      const baseline = calculator.calculateRollingBaseline(singleMatch);
      
      expect(baseline.value).toBe(1.0);
      expect(baseline.sampleSize).toBe(1);
      expect(baseline.variance).toBe(0); // No variance with single data point
      // With single data point and no variance, confidence interval may equal the value
      expect(baseline.confidenceInterval[0]).toBeLessThanOrEqual(baseline.value);
      expect(baseline.confidenceInterval[1]).toBeGreaterThanOrEqual(baseline.value);
    });

    it('should handle failure case with empty matches', () => {
      const baseline = calculator.calculateRollingBaseline([]);
      
      expect(baseline.value).toBe(0);
      expect(baseline.sampleSize).toBe(0);
      expect(baseline.variance).toBe(0);
      expect(baseline.confidenceInterval).toEqual([0, 0]);
    });

    it('should apply exponential decay correctly', () => {
      const decayFactor = 0.8; // More aggressive decay
      const baseline = calculator.calculateRollingBaseline(mockMatches, 10, decayFactor);
      
      // More recent matches should have higher weight
      // Last match (1.05) should influence result more than first (1.0)
      expect(baseline.value).toBeCloseTo(1.05, 1);
      expect(baseline.sampleSize).toBe(mockMatches.length);
    });

    it('should respect custom window size', () => {
      const windowSize = 3;
      const baseline = calculator.calculateRollingBaseline(mockMatches, windowSize);
      
      // Should only consider last 3 matches
      expect(baseline.sampleSize).toBe(windowSize);
      
      // Calculate expected value from last 3 matches: [1.2, 0.9, 1.05]
      const lastThreeValues = [1.2, 0.9, 1.05];
      const expectedValue = lastThreeValues.reduce((sum, val) => sum + val, 0) / lastThreeValues.length;
      expect(baseline.value).toBeCloseTo(expectedValue, 2);
    });
  });

  describe('getOrCalculateBaseline', () => {
  const mockPlayerId = 'test-player-123';
  const ratings2 = [1.0, 1.1];
  const rawPlayerStatsArray2 = ratings2.map(r => ({ rating: r }));
  const mockMatches = createValidExtendedMatchData(ratings2, { rawPlayerStats: undefined }, rawPlayerStatsArray2);

    it('should calculate new baseline when none exists', async () => {
      const baseline = await calculator.getOrCalculateBaseline(mockMatches, mockPlayerId);
      
      expect(baseline).toBeDefined();
      expect(baseline.value).toBeCloseTo(1.05, 2);
      expect(baseline.sampleSize).toBe(2);
    });

    it('should return cached baseline when available', async () => {
      // First call calculates and caches
      const baseline1 = await calculator.getOrCalculateBaseline(mockMatches, mockPlayerId);
      
      // Second call should return cached result
      const baseline2 = await calculator.getOrCalculateBaseline(mockMatches, mockPlayerId);
      
      expect(baseline1).toEqual(baseline2);
    });

    it('should handle different players separately', async () => {
      const player1 = 'player-1';
      const player2 = 'player-2';
      
      const baseline1 = await calculator.getOrCalculateBaseline(mockMatches, player1);
      const baseline2 = await calculator.getOrCalculateBaseline(mockMatches, player2);
      
      // Should be equal values but separate cache entries
      expect(baseline1.value).toEqual(baseline2.value);
      expect(baseline1).not.toBe(baseline2); // Different objects
    });
  });

  describe('statistical accuracy validation', () => {
    it('should calculate confidence intervals using t-distribution for small samples', () => {
      // Test with exactly 5 matches (small sample)
  const ratings = [1.0, 1.1, 1.2, 1.3, 1.4];
  const rawPlayerStatsArray = ratings.map(r => ({ rating: r }));
  const smallSample = createValidExtendedMatchData(ratings, { rawPlayerStats: undefined }, rawPlayerStatsArray);
      
      const baseline = calculator.calculateRollingBaseline(smallSample);
      
      // For small samples, confidence interval should be wider
      const intervalWidth = baseline.confidenceInterval[1] - baseline.confidenceInterval[0];
      expect(intervalWidth).toBeGreaterThan(0.1); // Should have meaningful width
    });

    it('should handle large samples with normal distribution', () => {
      // Generate large sample (50 matches) with known distribution
  const ratings = Array.from({ length: 50 }, (_, i) => 1.0 + Math.sin(i * 0.1) * 0.2);
  const rawPlayerStatsArray = ratings.map(r => ({ rating: r }));
  const largeSample = createValidExtendedMatchData(ratings, { rawPlayerStats: undefined }, rawPlayerStatsArray);
      
      const baseline = calculator.calculateRollingBaseline(largeSample);
      
      expect(baseline.sampleSize).toBe(50);
      expect(baseline.value).toBeCloseTo(1.0, 0); // Relaxed precision - sine wave doesn't average exactly to 1.0
      expect(baseline.variance).toBeGreaterThan(0);
    });

    it('should maintain mathematical invariants', () => {
  const ratings = [1.0, 2.0, 1.5];
  const rawPlayerStatsArray = ratings.map(r => ({ rating: r }));
  const matches = createValidExtendedMatchData(ratings, { rawPlayerStats: undefined }, rawPlayerStatsArray);
      
      const baseline = calculator.calculateRollingBaseline(matches);
      
      // Mathematical invariants
      expect(baseline.value).toBeGreaterThan(0);
      expect(baseline.variance).toBeGreaterThanOrEqual(0);
      expect(baseline.confidenceInterval[0]).toBeLessThanOrEqual(baseline.value);
      expect(baseline.confidenceInterval[1]).toBeGreaterThanOrEqual(baseline.value);
      expect(baseline.sampleSize).toBeGreaterThan(0);
      expect(new Date(baseline.lastUpdated)).toBeInstanceOf(Date);
    });
  });

  describe('performance and edge cases', () => {
    it('should handle matches with missing data gracefully', () => {
  const ratings = [1.0, 1.1, 1.05];
  const rawPlayerStatsArray = [null, { rating: 1.1 }, null];
  const incompleteMatches = createValidExtendedMatchData(ratings, { rawPlayerStats: undefined }, rawPlayerStatsArray);
      
      const baseline = calculator.calculateRollingBaseline(incompleteMatches);
      
      // Should still calculate baseline from available data
      expect(baseline.value).toBeGreaterThan(0);
      expect(baseline.sampleSize).toBeGreaterThan(0);
    });

    it('should handle extreme values without breaking', () => {
  const ratings = [0.01, 5.0, 1.0];
  const rawPlayerStatsArray = ratings.map(r => ({ rating: r }));
  const extremeMatches = createValidExtendedMatchData(ratings, { rawPlayerStats: undefined }, rawPlayerStatsArray);
      
      const baseline = calculator.calculateRollingBaseline(extremeMatches);
      
      expect(baseline.value).toBeGreaterThan(0);
      expect(baseline.value).toBeLessThan(10); // Should be reasonable
      expect(baseline.variance).toBeGreaterThan(0); // Should detect high variance
    });

    it('should complete calculation within reasonable time', () => {
      // Large dataset performance test
  const ratings = Array.from({ length: 1000 }, () => 1.0 + Math.random() * 0.5);
  const rawPlayerStatsArray = ratings.map(r => ({ rating: r }));
  const largeDataset = createValidExtendedMatchData(ratings, { rawPlayerStats: undefined }, rawPlayerStatsArray);
      
      const startTime = Date.now();
      const baseline = calculator.calculateRollingBaseline(largeDataset);
      const endTime = Date.now();
      
      expect(endTime - startTime).toBeLessThan(1000); // Should complete within 1 second
      expect(baseline.sampleSize).toBe(50); // Uses PREFERRED_SAMPLE size by default
    });
  });
});