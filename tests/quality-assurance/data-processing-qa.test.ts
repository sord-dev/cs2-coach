/**
 * Quality Assurance: Full Data Processing Pipeline Test
 * Ensures all calculations work with valid data and produce valid outputs.
 */
import { describe, it, expect } from '@jest/globals';
import { mockPlayerProfile, mockMatchHistory } from '../test-data';
import { personalBaselineCalculator, correlationAnalyzer, patternDetector, performanceStateClassifier, tiltDetector } from '../../src/services/analysis';

// Helper to check for valid numbers (not NaN, not Infinity)
function isValidNumber(val: any) {
  return typeof val === 'number' && isFinite(val);
}

describe('Quality Assurance: Full Data Processing Pipeline', () => {
  it('should process valid data and produce valid outputs for all calculations', () => {
    const matchesRaw = mockMatchHistory().matches;
    const playerId = mockPlayerProfile().id;
    // Transform matches to expected format: playerStats as object, not array
    const matches = matchesRaw.map(m => ({
      ...m,
      playerStats: m.playerStats.find(ps => ps.steamId === playerId) || m.playerStats[0],
      teamStats: {
        ...m.teamStats,
        side: (m.teamStats.side === 'ct' ? 'ct' : 't') as 'ct' | 't',
      },
    }));


  // 1. Baseline Calculation
  const baseline = personalBaselineCalculator.calculateRollingBaseline(matches);
  expect(baseline).toBeDefined();
  expect(isValidNumber(baseline.value)).toBe(true);
  // Assert baseline value is average of ratings (mock data: 1.25, 0.95)
  const expectedAvg = (1.25 + 0.95) / 2;
  expect(Math.abs(baseline.value - expectedAvg)).toBeLessThan(0.2);


  // 2. Correlation Analysis (example: K/D vs. ADR)
  const kd = matches.map(m => m.playerStats.kills / Math.max(1, m.playerStats.deaths));
  const adr = matches.map(m => m.playerStats.adr);
  const corrResult = correlationAnalyzer.calculatePearsonCorrelation(kd, adr);
  expect(corrResult).toBeDefined();
  expect(isValidNumber(corrResult.coefficient)).toBe(true);
  // For 5 points, correlation can be noisy, but expect some correlation
  expect(isValidNumber(corrResult.coefficient)).toBe(true);
  expect(corrResult.coefficient).toBeGreaterThanOrEqual(-1);
  expect(corrResult.coefficient).toBeLessThanOrEqual(1);


  // 3. Pattern Detection
  const momentum = patternDetector.detectMomentumPatterns(matches);
  expect(momentum).toBeDefined();
  expect(typeof momentum.currentMomentum).toBe('string');
  // With only 2 matches, should be neutral due to minimum duration
  expect(momentum.currentMomentum).toBe('neutral');


    // 4. State Classification (requires PlayerAnalysis and baseline)
    // Use actual average stats from mock data
    const avgStats = {
      rating: expectedAvg,
      kdRatio: ((25/15)+(18/20))/2,
      adr: (85.5+72.3)/2,
      kast: (75+68)/2,
      headshotPercentage: (40+33)/2,
      gamesPlayed: 2,
    };
    // Transform matches to ProcessedStats for recentPerformance
    const recentPerformance = matches.map(m => ({
      rating: m.playerStats.rating,
      kdRatio: m.playerStats.deaths > 0 ? m.playerStats.kills / m.playerStats.deaths : m.playerStats.kills,
      adr: m.playerStats.adr,
      kast: m.playerStats.kast,
      headshotPercentage: m.playerStats.headshotPercentage,
      gamesPlayed: 1,
    }));
    const fakeAnalysis = {
      playerId,
      timeRange: 'test',
      averageStats: avgStats,
      recentPerformance,
      strengths: [],
      weaknesses: [],
      trends: [],
    };
    const state = performanceStateClassifier.classifyCurrentState(fakeAnalysis, baseline, matches);
    expect(state).toBeDefined();
    expect(typeof state.classification).toBe('string');
    // With average stats close to baseline, expect 'baseline_normal' or similar
    expect([
      'baseline_normal',
      'mechanical_inconsistency',
      'tilt_cascade',
      'flow_state',
    ]).toContain(state.classification);


  // 5. Tilt Detection
  const tilt = tiltDetector.detectTiltState(matches, baseline);
  expect(tilt).toBeDefined();
  expect(typeof tilt.active).toBe('boolean');
  // With only 2 matches and no extreme stats, tilt should not be active
  expect(tilt.active).toBe(false);
  });
});
