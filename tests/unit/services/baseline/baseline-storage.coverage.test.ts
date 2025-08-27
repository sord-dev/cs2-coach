import { BaselineStorageManager } from '../../../../src/services/analysis/index.js';
import { createValidExtendedMatchData } from '../../../test-data';

describe('BaselineStorageManager', () => {
  let storage: BaselineStorageManager;
  const playerId = 'player-test-1';
  const mapName = 'de_mirage';
  const baseline = {
    value: 1.1,
    confidenceInterval: [1.0, 1.2] as [number, number],
    sampleSize: 20,
    lastUpdated: new Date().toISOString(),
    variance: 0.01
  };

  beforeEach(() => {
    storage = new BaselineStorageManager();
    storage.clearAllBaselines();
  });

  it('stores and retrieves overall baseline', () => {
    storage.setBaseline(playerId, baseline);
    const result = storage.getBaseline(playerId);
    expect(result).toEqual(baseline);
  });

  it('stores and retrieves map-specific baseline', () => {
    storage.setBaseline(playerId, baseline, mapName);
    const result = storage.getBaseline(playerId, mapName);
    expect(result).toEqual(baseline);
  });

  it('returns null for missing baseline', () => {
    expect(storage.getBaseline('unknown')).toBeNull();
  });

  it('hasReliableBaseline returns true/false as expected', () => {
    storage.setBaseline(playerId, baseline);
    expect(storage.hasReliableBaseline(playerId)).toBe(true);
    expect(storage.hasReliableBaseline('unknown')).toBe(false);
    // Not reliable if sample size too low
    storage.setBaseline(playerId, { ...baseline, sampleSize: 1 });
    expect(storage.hasReliableBaseline(playerId)).toBe(false);
  });

  it('getAllBaselines returns entry after set', () => {
    storage.setBaseline(playerId, baseline);
    const entry = storage.getAllBaselines(playerId);
    expect(entry).toBeTruthy();
    expect(entry?.overall).toEqual(baseline);
  });

  it('clearBaselines removes all for player', () => {
    storage.setBaseline(playerId, baseline);
    storage.clearBaselines(playerId);
    expect(storage.getBaseline(playerId)).toBeNull();
  });

  it('clearAllBaselines removes all players', () => {
    storage.setBaseline(playerId, baseline);
    storage.clearAllBaselines();
    expect(storage.getBaseline(playerId)).toBeNull();
  });

  it('importBaselines and exportBaselines work as no-ops', () => {
    const exported = storage.exportBaselines();
    storage.importBaselines(exported, true);
    // No error, but nothing imported since export is empty (SimpleCache limitation)
    expect(typeof exported).toBe('object');
  });

  it('getStorageStats returns expected structure', () => {
    const stats = storage.getStorageStats();
    expect(stats).toHaveProperty('totalPlayers');
    expect(stats).toHaveProperty('totalBaselines');
    expect(stats).toHaveProperty('cacheHitRate');
    expect(stats).toHaveProperty('averageSampleSize');
    expect(stats).toHaveProperty('oldestBaseline');
  });
});
