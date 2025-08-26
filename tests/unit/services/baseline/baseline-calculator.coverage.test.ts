import { PersonalBaselineCalculator } from '../../../../src/services/analysis';
import { createValidExtendedMatchData } from '../../../test-data';

describe('PersonalBaselineCalculator (coverage)', () => {
    let calculator: PersonalBaselineCalculator;
    beforeEach(() => {
        calculator = new PersonalBaselineCalculator();
    });

    it('calculates confidence interval for small and large samples', () => {
        // Small sample (t-distribution)
        const ciSmall = calculator.getConfidenceInterval(1.0, 0.04, 5);
        expect(ciSmall[0]).toBeLessThan(1.0);
        expect(ciSmall[1]).toBeGreaterThan(1.0);
        // Large sample (normal)
        const ciLarge = calculator.getConfidenceInterval(1.0, 0.04, 50);
        expect(ciLarge[0]).toBeLessThan(1.0);
        expect(ciLarge[1]).toBeGreaterThan(1.0);
    });

    it('detects significant deviation from baseline', () => {
        const baseline = { value: 1.0, confidenceInterval: [0.9, 1.1] as [number, number], sampleSize: 20, lastUpdated: new Date().toISOString(), variance: 0.01 };
        const high = calculator.detectSignificantDeviation(1.25, baseline);
        expect(high.isSignificant).toBe(true);
        expect(high.severity).toBe('high');
        const moderate = calculator.detectSignificantDeviation(1.12, baseline);
        expect(moderate.isSignificant).toBe(true);
        expect(moderate.severity).toBe('moderate');
        const low = calculator.detectSignificantDeviation(1.01, baseline);
        expect(low.isSignificant).toBe(false);
        expect(low.severity).toBe('low');
    });

    it('returns null for map-specific baseline with insufficient data', () => {
        const matches = createValidExtendedMatchData([1.0, 1.1], {});
        const result = calculator.calculateMapSpecificBaseline(matches, 'de_dust2', 'player1');
        expect(result).toBeNull();
    });

    it('returns map-specific baseline when enough data', () => {
        // Use 15 matches to match MIN_MAP_SAMPLE from constants
        const ratings = Array(15).fill(1.0);
        const matches = createValidExtendedMatchData(ratings, {}, undefined).map((m, i) => ({ ...m, map: 'de_mirage' }));
        const result = calculator.calculateMapSpecificBaseline(matches, 'de_mirage', 'player1');
        expect(result).toBeTruthy();
        expect(result?.sampleSize).toBeGreaterThanOrEqual(15);
    });

    it('evaluates baseline quality for all reliability levels', () => {
        const now = new Date().toISOString();
        const cases = [
            { sampleSize: 120, lastUpdated: now },
            { sampleSize: 50, lastUpdated: now },
            { sampleSize: 20, lastUpdated: now },
            { sampleSize: 12, lastUpdated: now },
            { sampleSize: 2, lastUpdated: now },
            { sampleSize: 50, lastUpdated: new Date(Date.now() - 40 * 24 * 60 * 60 * 1000).toISOString() }, // old baseline
        ];
        for (const c of cases) {
            const b = { value: 1, confidenceInterval: [0.9, 1.1] as [number, number], sampleSize: c.sampleSize, lastUpdated: c.lastUpdated, variance: 0.01 };
            const result = calculator.evaluateBaselineQuality(b);
            expect(result.reliability).toBeDefined();
            expect(result.confidence).toBeGreaterThan(0);
            expect(Array.isArray(result.recommendations)).toBe(true);
        }
    });

    it('createEmptyBaseline returns correct structure', () => {
        // @ts-expect-error: private method
        const empty = calculator.createEmptyBaseline();
        expect(empty.value).toBe(0);
        expect(empty.sampleSize).toBe(0);
        expect(empty.confidenceInterval).toEqual([0, 0]);
    });

    it('isBaselineRecent returns true for recent, false for old', () => {
        // @ts-expect-error: private method
        expect(calculator.isBaselineRecent({ lastUpdated: new Date().toISOString() })).toBe(true);
        // @ts-expect-error: private method
        expect(calculator.isBaselineRecent({ lastUpdated: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString() })).toBe(false);
    });
});
