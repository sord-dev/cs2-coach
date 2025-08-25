import { AreaAnalysisHandler } from '../../../src/handlers/areaAnalysisHandler';
import { mockPlayerProfile, mockMatchHistory, createMockProcessAnalysis, createMockAreaStats } from '../../test-data';

describe('AreaAnalysisHandler', () => {
  let leetifyClient: any;
  let ollamaService: any;
  let dataTransformer: any;
  let handler: AreaAnalysisHandler;

  beforeEach(() => {
    leetifyClient = {
      getPlayerProfile: jest.fn().mockResolvedValue(mockPlayerProfile()),
      getMatchHistory: jest.fn().mockResolvedValue(mockMatchHistory().matches),
    };
    dataTransformer = {
      processMatches: jest.fn().mockReturnValue(createMockProcessAnalysis()),
      analyzeSpecificArea: jest.fn().mockReturnValue(createMockAreaStats()),
    };
    ollamaService = {
      analyzeSpecificArea: jest.fn().mockResolvedValue({ ai: 'analysis', recommendations: ['Do X'] }),
    };
    handler = new AreaAnalysisHandler(leetifyClient, ollamaService, dataTransformer);
  });

  it('returns analysis and skips AI if skipAI is true', async () => {
    const args = {
      playerId: 'player1',
      area: 'aim',
      matchCount: 5,
      skipAI: true,
    };

    const result = await handler.handleSpecificAreaAnalysis(args);
    expect(result.content[0].type).toBe('text');
    const parsed = JSON.parse(result.content[0].text);
    expect(parsed.response.analysis).toEqual({ area: 'aim', stats: { kills: 10, headshotPercentage: 0.4, rating: 1.2 } });
    expect(parsed.response.aiAnalysis).toBe('Skipped for faster response');
    expect(parsed.response.recommendations).toEqual([]);
    expect(parsed.response.practiceRoutine).toBeDefined();
    expect(parsed.response.confidence).toBe(1.0);
  });

  it('calls ollamaService if skipAI is false', async () => {
    const args = {
      playerId: 'player1',
      area: 'aim',
      matchCount: 2,
      skipAI: false,
    };
    const result = await handler.handleSpecificAreaAnalysis(args);
    expect(ollamaService.analyzeSpecificArea).toHaveBeenCalled();
    const parsed = JSON.parse(result.content[0].text);
    expect(parsed.response.ai).toBe('analysis');
    expect(parsed.response.recommendations).toEqual(['Do X']);
  });

  it('validates input using SpecificAreaAnalysisSchema', async () => {
    const args = { playerId: 123, area: 'aim' }; // playerId should be string
    await expect(handler.handleSpecificAreaAnalysis(args)).rejects.toThrow();
  });
});
