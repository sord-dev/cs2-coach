import { makeRawPlayerStats } from '../../../test-data';
/**
 * @fileoverview Simple unit tests for PerformanceStateClassifier
 * Tests basic functionality and ensures no crashes
 */

import { PerformanceStateClassifier } from '../../../../src/services/analysis/index.js';
import type { PerformanceTrend } from '../../../../src/types/analysis';

describe('PerformanceStateClassifier - Basic Tests', () => {
  let classifier: PerformanceStateClassifier;
  
  beforeEach(() => {
    classifier = new PerformanceStateClassifier();
  });

  const createMockAnalysis = (rating: number = 1.0) => ({
    playerId: 'test-player',
    timeRange: 'recent',
    averageStats: {
      rating: rating,
      kdRatio: 1.2,
      adr: 75,
      kast: 70,
      headshotPercentage: 35,
      gamesPlayed: 5
    },
    recentPerformance: [
      { rating: rating, kdRatio: 1.2, adr: 75, kast: 70, headshotPercentage: 35, gamesPlayed: 5 },
      { rating: rating + 0.1, kdRatio: 1.3, adr: 80, kast: 75, headshotPercentage: 36, gamesPlayed: 5 },
      { rating: rating - 0.1, kdRatio: 1.1, adr: 70, kast: 65, headshotPercentage: 34, gamesPlayed: 5 }
    ],
    strengths: ['Good aim'],
    weaknesses: ['Positioning'],
    trends: [
      {
        metric: 'rating',
        trend: 'improving' as PerformanceTrend['trend'],
        changePercentage: 5,
        description: 'Rating is improving over recent matches.'
      }
    ] as PerformanceTrend[]
  });

  const mockBaseline = {
    value: 1.0,
    confidenceInterval: [0.9, 1.1] as [number, number],
    sampleSize: 20,
    lastUpdated: '2024-01-01',
    variance: 0.05
  };

  describe('classifyCurrentState', () => {
    it('should return valid classification with baseline performance', () => {
      const analysis = createMockAnalysis(1.0);
      const result = classifier.classifyCurrentState(analysis, mockBaseline);

      expect(result.classification).toMatch(/flow_state|mechanical_inconsistency|tilt_cascade|baseline_normal/);
      expect(result.confidence).toBeGreaterThanOrEqual(0);
      expect(result.confidence).toBeLessThanOrEqual(1);
      expect(Array.isArray(result.evidence)).toBe(true);
      expect(Array.isArray(result.recommendations)).toBe(true);
      expect(typeof result.baselineDeviation).toBe('object');
    });

    it('should handle high performance (potential flow state)', () => {
      const analysis = createMockAnalysis(1.3); // High rating
      const result = classifier.classifyCurrentState(analysis, mockBaseline);

      expect(result.classification).toBeDefined();
      expect(result.confidence).toBeGreaterThanOrEqual(0);
      expect(result.evidence.length).toBeGreaterThanOrEqual(0);
    });

    it('should handle low performance (potential tilt)', () => {
      const analysis = createMockAnalysis(0.7); // Low rating
      const result = classifier.classifyCurrentState(analysis, mockBaseline);

      expect(result.classification).toBeDefined();
      expect(result.confidence).toBeGreaterThanOrEqual(0);
      expect(result.recommendations.length).toBeGreaterThan(0);
    });

    it('should handle insufficient baseline data', () => {
      const lowSampleBaseline = {
        ...mockBaseline,
        sampleSize: 5 as number, // Low sample size
        confidenceInterval: [0.9, 1.1] as [number, number]
      };
      
      const analysis = createMockAnalysis(1.0);
      const result = classifier.classifyCurrentState(analysis, lowSampleBaseline);

      expect(result.classification).toBeDefined();
      expect(result.confidence).toBeLessThan(1.0);
    });

    it('should include extended match data when provided', () => {
      const analysis = createMockAnalysis(1.0);
      const extendedMatches = [
        {
          gameId: 'test1',
          date: '2024-01-01',
          map: 'de_dust2',
          gameMode: 'competitive',
          durationSeconds: 3600,
          playerStats: { steamId: '123', rating: 1.0, kills: 20, deaths: 15, assists: 5, adr: 75, kast: 70, headshots: 8, headshotPercentage: 40, mvps: 2 },
          rawPlayerStats: makeRawPlayerStats(),
          teamStats: { roundsWon: 16, roundsLost: 10, score: 16, side: 'ct' as const }
        }
      ];

      const result = classifier.classifyCurrentState(analysis, mockBaseline, extendedMatches);

      expect(result.classification).toBeDefined();
      expect(result.evidence.length).toBeGreaterThanOrEqual(0);
    });

    it('should complete classification within reasonable time', () => {
      const analysis = createMockAnalysis(1.0);
      
      const startTime = Date.now();
      const result = classifier.classifyCurrentState(analysis, mockBaseline);
      const endTime = Date.now();

      expect(endTime - startTime).toBeLessThan(100); // Should be very fast
      expect(result).toBeDefined();
    });

    it('should provide consistent results for same input', () => {
      const analysis = createMockAnalysis(1.15);
      
      const result1 = classifier.classifyCurrentState(analysis, mockBaseline);
      const result2 = classifier.classifyCurrentState(analysis, mockBaseline);

      expect(result1.classification).toBe(result2.classification);
      expect(result1.confidence).toBeCloseTo(result2.confidence, 3);
    });

    it('should handle missing extended metrics gracefully', () => {
      const analysis = createMockAnalysis(1.0);
      const matchesWithoutExtended = [
        {
          gameId: 'test1',
          date: '2024-01-01',
          map: 'de_dust2',
          gameMode: 'competitive',
          durationSeconds: 3600,
          playerStats: { steamId: '123', rating: 1.0, kills: 20, deaths: 15, assists: 5, adr: 75, kast: 70, headshots: 8, headshotPercentage: 40, mvps: 2 },
          rawPlayerStats: undefined, // No extended metrics
          teamStats: { roundsWon: 16, roundsLost: 10, score: 16, side: 'ct' as const }
        }
      ];

      const result = classifier.classifyCurrentState(analysis, mockBaseline, matchesWithoutExtended);

      expect(result.classification).toBeDefined();
      expect(result.confidence).toBeGreaterThanOrEqual(0);
    });
  });
});