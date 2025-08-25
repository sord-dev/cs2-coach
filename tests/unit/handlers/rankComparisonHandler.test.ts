import { RankComparisonHandler } from '../../../src/handlers/rankComparisonHandler';
import { mockPlayerProfile, mockMatchHistory } from '../../test-data'; // Updated to use functions

describe('RankComparisonHandler', () => {
    let leetifyClient: any;
    let dataTransformer: any;

    let ollamaService: any;
    let handler: RankComparisonHandler;

    beforeEach(() => {
            leetifyClient = {
                getPlayerProfile: jest.fn().mockResolvedValue(mockPlayerProfile()),
                getMatchHistory: jest.fn().mockResolvedValue(mockMatchHistory().matches),
            getRankBenchmarks: jest.fn().mockResolvedValue({
                rank: 'gold_nova',
                stats: { rating: 1.2, kd: 1.1, adr: 80, kast: 0.7, headshotPercentage: 0.4 },
            }),
        };
        ollamaService = {
            analyzeRankComparison: jest.fn().mockResolvedValue({ ai: 'rank', recommendations: ['Climb ladder'] }),
        };
        dataTransformer = {
            compareToRank: jest.fn().mockReturnValue({ diff: 0.1 }),
        };
        handler = new RankComparisonHandler(leetifyClient, ollamaService, dataTransformer);
    });


    it('returns rank comparison analysis (AI enabled)', async () => {
        const args = {
            playerId: 'player1',
            targetRank: 'gold_nova',
            timeRange: 'recent',
            skipAI: false,
        };
        const result = await handler.handleRankComparison(args);
        expect(ollamaService.analyzeRankComparison).toHaveBeenCalled();
        expect(result.content[0].type).toBe('text');
        const parsed = JSON.parse(result.content[0].text);
        expect(parsed.response.ai).toBe('rank');
        expect(parsed.response.recommendations).toEqual(['Climb ladder']);
        expect(typeof parsed.generatedAt).toBe('string');
    });

    it('returns rank comparison analysis (AI skipped)', async () => {
        const args = {
            playerId: 'player1',
            targetRank: 'gold_nova',
            timeRange: 'recent',
            skipAI: true,
        };
        const result = await handler.handleRankComparison(args);
        expect(result.content[0].type).toBe('text');
        const parsed = JSON.parse(result.content[0].text);
        expect(parsed.response.skippedAI).toBe(true);
        expect(parsed.response.comparison).toEqual({ diff: 0.1 });
        expect(parsed.response.playerProfile).toBeDefined();
        expect(parsed.response.note).toBe('AI analysis skipped as requested.');
        expect(parsed.response.generatedAt).toBeUndefined(); // Only in outer object
    });

    it('validates input and throws on invalid', async () => {
        const args = { playerId: 123, targetRank: 5 };
        await expect(handler.handleRankComparison(args)).rejects.toThrow();
    });

    it('handles missing skipAI and boolean skipAI values', async () => {
        const args1 = {
            playerId: 'player1',
            targetRank: 'gold_nova',
            timeRange: 'recent'
            // skipAI missing
        };
        const args2 = {
            playerId: 'player1',
            targetRank: 'gold_nova',
            timeRange: 'recent',
            skipAI: true
        };
        const args3 = {
            playerId: 'player1',
            targetRank: 'gold_nova',
            timeRange: 'recent',
            skipAI: false
        };
        // skipAI missing should default to false (AI runs)
        const result1 = await handler.handleRankComparison(args1);
        expect(result1.content[0].type).toBe('text');
        // skipAI true should skip AI
        const result2 = await handler.handleRankComparison(args2);
        const parsed2 = JSON.parse(result2.content[0].text);
        expect(parsed2.response.skippedAI).toBe(true);
        // skipAI false should not skip AI
        const result3 = await handler.handleRankComparison(args3);
        const parsed3 = JSON.parse(result3.content[0].text);
        expect(parsed3.response.skippedAI).not.toBe(true);
    });
});
