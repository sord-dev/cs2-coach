import { calculateMatchPerformance, calculateExtendedMatchPerformance, calculateAverageStats, getDefaultStats } from '../../../../src/services/analysis/metrics';
import { createValidLeetifyMatchData } from '../../../test-data';

describe('metrics.ts', () => {
    const sampleMatch = createValidLeetifyMatchData();

    it('calculates basic match performance', () => {
        const result = calculateMatchPerformance([sampleMatch]);
        expect(result[0].rating).toBe(1.2);
        expect(result[0].kdRatio).toBe(2);
        expect(result[0].adr).toBe(80);
        expect(result[0].kast).toBe(75);
        expect(result[0].headshotPercentage).toBe(40);
        expect(result[0].gamesPlayed).toBe(1);
    });

    it('calculates extended match performance', () => {
        const result = calculateExtendedMatchPerformance([sampleMatch]);
        expect(result[0].preaim).toBe(5.5);
        expect(result[0].reactionTime).toBe(0.45);
        expect(result[0].sprayAccuracy).toBe(85);
        expect(result[0].utilityEfficiency).toBeGreaterThan(0);
        expect(result[0].timeOfDay).toBe('morning');
        expect(result[0].sessionPosition).toBe(0);
    });

    it('handles missing/zero utility gracefully', () => {
        const match = createValidLeetifyMatchData({ rawPlayerStats: {} });
        const result = calculateExtendedMatchPerformance([match]);
        expect(result[0].utilityEfficiency).toBe(0);
    });

    it('handles missing date/timeOfDay', () => {
        const match = createValidLeetifyMatchData({ date: undefined });
        const result = calculateExtendedMatchPerformance([match]);
        expect(result[0].timeOfDay).toBe('unknown');
    });

    it('calculates average stats', () => {
        const stats = [
            { rating: 1, kdRatio: 1, adr: 70, kast: 70, headshotPercentage: 40, gamesPlayed: 1 },
            { rating: 2, kdRatio: 2, adr: 90, kast: 80, headshotPercentage: 50, gamesPlayed: 1 }
        ];
        const avg = calculateAverageStats(stats);
        expect(avg.rating).toBe(1.5);
        expect(avg.kdRatio).toBe(1.5);
        expect(avg.adr).toBe(80);
        expect(avg.kast).toBe(75);
        expect(avg.headshotPercentage).toBe(45);
        expect(avg.gamesPlayed).toBe(2);
    });

    it('returns default stats for empty input', () => {
        const avg = calculateAverageStats([]);
        expect(avg).toEqual(getDefaultStats());
    });
});
