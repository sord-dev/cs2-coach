import { ImprovementHandler } from '../../../src/handlers/improvementHandler';

describe('ImprovementHandler', () => {
    let leetifyClient: any;
    let dataTransformer: any;

    let ollamaService: any;
    let handler: ImprovementHandler;

    beforeEach(() => {
        leetifyClient = {
            getImprovementData: jest.fn().mockResolvedValue([
                { metric: 'rating', value: 1.1 },
                { metric: 'kd', value: 1.2 },
            ]),
        };
        ollamaService = {
            analyzeImprovement: jest.fn().mockResolvedValue({ ai: 'improvement', recommendations: ['Practice Z'] }),
        };
        dataTransformer = {
            calculateImprovementTrends: jest.fn().mockReturnValue({
                rating: { trend: 'improving', changePercentage: 5, description: 'Improved by 5%' },
                kd: { trend: 'stable', changePercentage: 0, description: 'No change' },
            }),
        };
        handler = new ImprovementHandler(leetifyClient, ollamaService, dataTransformer);
    });


    it('returns improvement analysis', async () => {
        const args = {
            playerId: 'player1',
            fromDate: '2025-01-01',
            toDate: '2025-08-01',
            metrics: ['rating'],
        };
        const result = await handler.handleImprovementTracking(args);
        expect(result.content[0].type).toBe('text');
        const parsed = JSON.parse(result.content[0].text);
        expect(parsed.metrics).toEqual(['rating']);
        expect(typeof parsed.generatedAt).toBe('string');
        expect(parsed.response).toBeDefined();
        expect(parsed.response.recommendations).toEqual(['Practice Z']);
    });

    it('validates input and throws on invalid', async () => {
        const args = { playerId: 123 }; // playerId should be string
        await expect(handler.handleImprovementTracking(args)).rejects.toThrow();
    });
});
