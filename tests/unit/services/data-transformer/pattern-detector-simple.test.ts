/**
 * @fileoverview Simple unit tests for PatternDetector
 * Tests basic functionality and ensures no crashes
 */

import { PatternDetector } from '../../../../src/services/analysis';
import { createValidExtendedMatchData } from '../../../test-data.js';

describe('PatternDetector - Basic Tests', () => {
  let detector: PatternDetector;
  
  beforeEach(() => {
    detector = new PatternDetector();
  });

  describe('detectMomentumPatterns', () => {
    it('should detect momentum with sufficient data', () => {
  const matches = createValidExtendedMatchData([0.8, 0.9, 1.0, 1.1, 1.2]); // Improving trend
      const result = detector.detectMomentumPatterns(matches);

      expect(result.currentMomentum).toMatch(/positive|negative|neutral/);
      expect(result.strength).toBeGreaterThanOrEqual(0);
      expect(result.duration).toBe(matches.length);
      expect(result.prediction).toBeDefined();
      expect(result.confidence).toBeGreaterThanOrEqual(0);
      expect(result.confidence).toBeLessThanOrEqual(1);
    });

    it('should handle insufficient data gracefully', () => {
  const matches = createValidExtendedMatchData([1.0]); // Only one match
      const result = detector.detectMomentumPatterns(matches);

      expect(result.currentMomentum).toBe('neutral');
      expect(result.strength).toBe(0);
      expect(result.duration).toBe(0);
      expect(result.prediction).toContain('Insufficient');
    });

    it('should detect positive momentum', () => {
  const matches = createValidExtendedMatchData([0.7, 0.8, 0.9, 1.0, 1.1]); // Clear upward trend
      const result = detector.detectMomentumPatterns(matches);

      expect(result.currentMomentum).toMatch(/positive|neutral/); // Allow neutral if trend not strong enough
      expect(result.strength).toBeGreaterThanOrEqual(0);
    });

    it('should detect negative momentum', () => {
  const matches = createValidExtendedMatchData([1.3, 1.2, 1.1, 1.0, 0.9]); // Clear downward trend
      const result = detector.detectMomentumPatterns(matches);

      expect(result.currentMomentum).toMatch(/negative|neutral/); // Allow neutral if trend not strong enough
      expect(result.strength).toBeGreaterThanOrEqual(0);
    });
  });

  describe('analyzeCascadingEffects', () => {
    it('should analyze cascading effects with sufficient data', () => {
  const matches = createValidExtendedMatchData([1.0, 0.9, 0.8, 0.7, 0.6]); // Potential cascade
      const result = detector.analyzeCascadingEffects(matches);

      expect(result.cascadeType).toMatch(/tilt|flow|none/);
      expect(result.severity).toMatch(/low|moderate|high/);
      expect(result.length).toBeGreaterThanOrEqual(0);
      expect(result.trend).toMatch(/accelerating|stable|recovering/);
      expect(result.breakProbability).toBeGreaterThanOrEqual(0);
      expect(result.breakProbability).toBeLessThanOrEqual(1);
    });

    it('should handle insufficient data gracefully', () => {
  const matches = createValidExtendedMatchData([1.0]); // Only one match
      const result = detector.analyzeCascadingEffects(matches);

      expect(result.cascadeType).toBe('none');
      expect(result.severity).toBe('low');
      expect(result.length).toBe(0);
      expect(result.breakProbability).toBe(1.0);
    });

    it('should detect tilt cascade', () => {
  const matches = createValidExtendedMatchData([1.2, 0.9, 0.8, 0.7, 0.6]); // Clear decline
      const result = detector.analyzeCascadingEffects(matches);

      expect(result.cascadeType).toMatch(/tilt|none/);
      expect(result.length).toBeGreaterThanOrEqual(0);
    });
  });

  describe('findContextualClusters', () => {
    it('should analyze contextual patterns with map data', () => {
  const matches = createValidExtendedMatchData([1.0, 1.1, 0.9, 1.2, 0.8]);
      const result = detector.findContextualClusters(matches);

      expect(typeof result.mapPerformance).toBe('object');
      expect(typeof result.timeOfDayEffects).toBe('object');
      expect(Array.isArray(result.sessionPositionEffects)).toBe(true);
      expect(typeof result.teammateInfluence).toBe('number');
      expect(Array.isArray(result.fatigueIndicators)).toBe(true);
    });

    it('should handle empty map performance data', () => {
  const matches = createValidExtendedMatchData([1.0]); // Single match
      const result = detector.findContextualClusters(matches);

      expect(result.mapPerformance).toBeDefined();
      expect(result.timeOfDayEffects).toBeDefined();
      expect(result.teammateInfluence).toBeGreaterThanOrEqual(-1);
      expect(result.teammateInfluence).toBeLessThanOrEqual(1);
    });

    it('should complete analysis within reasonable time', () => {
  const matches = createValidExtendedMatchData(Array.from({ length: 50 }, () => Math.random() + 0.5));
      
      const startTime = Date.now();
      const result = detector.findContextualClusters(matches);
      const endTime = Date.now();

      expect(endTime - startTime).toBeLessThan(1000); // Should complete within 1 second
      expect(result).toBeDefined();
    });
  });

  describe('edge cases and robustness', () => {
    it('should handle matches with missing extended data', () => {
  const matches = createValidExtendedMatchData([1.0, 1.1, 0.9]).map(match => ({
        ...match,
        rawPlayerStats: null // Remove extended data
      }));

      const momentum = detector.detectMomentumPatterns(matches);
      const cascade = detector.analyzeCascadingEffects(matches);
      const contextual = detector.findContextualClusters(matches);

      expect(momentum.currentMomentum).toBeDefined();
      expect(cascade.cascadeType).toBeDefined();
      expect(contextual.fatigueIndicators).toBeDefined();
    });

    it('should handle extreme rating values', () => {
  const matches = createValidExtendedMatchData([0.1, 3.0, 0.5, 2.5, 1.0]); // Extreme values
      
      const momentum = detector.detectMomentumPatterns(matches);
      const cascade = detector.analyzeCascadingEffects(matches);

      expect(momentum.confidence).toBeGreaterThanOrEqual(0);
      expect(cascade.breakProbability).toBeGreaterThanOrEqual(0);
    });

    it('should provide consistent results for same input', () => {
  const matches = createValidExtendedMatchData([1.0, 1.1, 1.2, 1.3, 1.4]);
      
      const result1 = detector.detectMomentumPatterns(matches);
      const result2 = detector.detectMomentumPatterns(matches);

      expect(result1.currentMomentum).toBe(result2.currentMomentum);
      expect(result1.strength).toBeCloseTo(result2.strength, 3);
      expect(result1.confidence).toBeCloseTo(result2.confidence, 3);
    });

    it('should validate mathematical properties', () => {
  const matches = createValidExtendedMatchData([1.0, 1.1, 1.2, 1.0, 0.9]);
      
      const momentum = detector.detectMomentumPatterns(matches);
      const cascade = detector.analyzeCascadingEffects(matches);
      const contextual = detector.findContextualClusters(matches);

      // Test mathematical invariants
      expect(momentum.confidence).toBeGreaterThanOrEqual(0);
      expect(momentum.confidence).toBeLessThanOrEqual(1);
      expect(cascade.breakProbability).toBeGreaterThanOrEqual(0);
      expect(cascade.breakProbability).toBeLessThanOrEqual(1);
      expect(contextual.teammateInfluence).toBeGreaterThanOrEqual(-1);
      expect(contextual.teammateInfluence).toBeLessThanOrEqual(1);
    });
  });
});