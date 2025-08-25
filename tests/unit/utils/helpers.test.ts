import { sleep, roundTo, SimpleCache, getCS2RankBenchmarks } from '../../../src/utils/helpers';

describe('utils/helpers', () => {
  describe('getCS2RankBenchmarks', () => {
    it('returns correct benchmarks for silver', () => {
      const result = getCS2RankBenchmarks('silver');
      expect(result).toEqual({
        rating: expect.any(Number),
        kdRatio: expect.any(Number),
        adr: expect.any(Number),
        kast: expect.any(Number),
        headshotPercentage: expect.any(Number),
      });
      // Spot check values
      expect(result.rating).toBeCloseTo(0.7, 1);
      expect(result.kdRatio).toBeCloseTo(0.6, 1);
    });

    it('returns correct benchmarks for global', () => {
      const result = getCS2RankBenchmarks('global');
      expect(result.rating).toBeGreaterThanOrEqual(1.3);
      expect(result.kdRatio).toBeGreaterThanOrEqual(1.2);
      expect(result.adr).toBeGreaterThanOrEqual(105);
      expect(result.kast).toBeGreaterThanOrEqual(85);
      expect(result.headshotPercentage).toBeGreaterThanOrEqual(50);
    });

    it('returns MG as fallback for unknown rank', () => {
      const result = getCS2RankBenchmarks('unknown_rank');
      const mg = getCS2RankBenchmarks('mg');
      expect(result).toEqual(mg);
    });

    it('returns MG fallback for empty string', () => {
      // Since we now use embedded data, empty string falls back to MG
      const result = getCS2RankBenchmarks('');
      const mg = getCS2RankBenchmarks('mg');
      expect(result).toEqual(mg);
    });
  });

  it('sleep resolves after given ms', async () => {
    const start = Date.now();
    await sleep(15);
    expect(Date.now() - start).toBeGreaterThanOrEqual(10);
  });

  it('roundTo rounds numbers correctly', () => {
    expect(roundTo(1.2345, 2)).toBe(1.23);
    expect(roundTo(1.2355, 2)).toBe(1.24);
    expect(roundTo(10.555, 1)).toBe(10.6);
  });

  it('SimpleCache stores and retrieves values within TTL', () => {
    const cache = new SimpleCache<number>(10);
    cache.set('a', 123);
    expect(cache.get('a', 1000)).toBe(123);
  });

  it('SimpleCache expires values after TTL', async () => {
    const cache = new SimpleCache<number>(10);
    cache.set('a', 123);
    await sleep(5);
    expect(cache.get('a', 1)).toBeNull();
  });

  it('SimpleCache clears all values', () => {
    const cache = new SimpleCache<number>(10);
    cache.set('a', 1);
    cache.set('b', 2);
    cache.clear();
    expect(cache.get('a', 1000)).toBeNull();
    expect(cache.get('b', 1000)).toBeNull();
  });
  describe('determineCSRank', () => {
    const { determineCSRank } = require('../../../src/utils/helpers');
    it('returns correct rank for valid scores', () => {
      expect(determineCSRank(0)).toBe('Unranked');
      expect(determineCSRank(10)).toBe('Gold IV');
      expect(determineCSRank(19)).toBe('The Global Elite');
    });
    it('returns Unknown for out-of-range but not thrown', () => {
      expect(determineCSRank(20)).toBe('Unknown');
    });
    it('throws for negative or too high scores', () => {
      expect(() => determineCSRank(-1)).toThrow('Invalid CS rank score');
      expect(() => determineCSRank(21)).toThrow('Invalid CS rank score');
    });
  });
});
