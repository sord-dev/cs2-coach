
import { CoachingHandler } from '../../../src/handlers/coachingHandler';
import { LeetifyAPIClient } from '../../../src/services/leetify/index';
import { OllamaCoachService } from '../../../src/services/ollama/index';
import { LeetifyDataTransformer } from '../../../src/services/data-transformer/index';
import {
  mockPlayerProfile,
  createAnalysis
} from '../../test-data';

jest.mock('../../../src/services/leetify/index');
jest.mock('../../../src/services/ollama/index');
jest.mock('../../../src/services/data-transformer/index');

describe('CoachingHandler', () => {
  let handler: CoachingHandler;
  let leetifyClient: jest.Mocked<LeetifyAPIClient>;
  let ollamaService: jest.Mocked<OllamaCoachService>;
  let dataTransformer: jest.Mocked<LeetifyDataTransformer>;

  beforeEach(() => {
    leetifyClient = new LeetifyAPIClient() as any;
    ollamaService = new OllamaCoachService() as any;
    dataTransformer = new LeetifyDataTransformer() as any;
    handler = new CoachingHandler(leetifyClient, ollamaService, dataTransformer);
  });

  it('should return analysis and skip AI if skipAI is true', async () => {
  leetifyClient.getPlayerProfile.mockResolvedValue(mockPlayerProfile({ steam64_id: '123', id: '123', total_matches: 10 }));
  leetifyClient.getMatchHistory.mockResolvedValue([]);
  dataTransformer.processMatches.mockReturnValue(createAnalysis({ playerId: '123', averageStats: { rating: 0, kdRatio: 0, adr: 0, kast: 0, headshotPercentage: 0, gamesPlayed: 0 } }));

    const result = await handler.handleCoachingAdvice({ playerId: '123', skipAI: true, matchCount: 1, analysisType: 'general', timeRange: 'recent' });
    expect(result.content[0].text).toContain('coaching_advice');
    expect(result.content[0].text).toContain('Skipped for faster response');
  });

  it('should call ollamaService.analyzeGameplay if skipAI is false', async () => {
  leetifyClient.getPlayerProfile.mockResolvedValue(mockPlayerProfile({ steam64_id: '123', id: '123', total_matches: 10 }));
  leetifyClient.getMatchHistory.mockResolvedValue([]);
  dataTransformer.processMatches.mockReturnValue(createAnalysis({ playerId: '123', averageStats: { rating: 0, kdRatio: 0, adr: 0, kast: 0, headshotPercentage: 0, gamesPlayed: 0 } }));
    ollamaService.analyzeGameplay.mockResolvedValue({
      analysis: {
        playerId: '123',
        timeRange: '',
        averageStats: { rating: 0, kdRatio: 0, adr: 0, kast: 0, headshotPercentage: 0, gamesPlayed: 0 },
        recentPerformance: [],
        strengths: [],
        weaknesses: [],
        trends: []
      },
      recommendations: [],
      practiceRoutine: {
        warmup: [],
        aimTraining: [],
        mapPractice: [],
        tacticalReview: [],
        estimatedTime: 0
      },
      confidence: 1,
      generatedAt: new Date()
    });

    const result = await handler.handleCoachingAdvice({ playerId: '123', skipAI: false, matchCount: 1, analysisType: 'general', timeRange: 'recent' });
    expect(ollamaService.analyzeGameplay).toHaveBeenCalled();
    expect(result.content[0].text).toContain('coaching_advice');
  });

  it('should handle insufficient match data', async () => {
  leetifyClient.getPlayerProfile.mockResolvedValue(mockPlayerProfile({ steam64_id: '123', id: '123', total_matches: 0 }));
  leetifyClient.getMatchHistory.mockResolvedValue([]);
  dataTransformer.processMatches.mockReturnValue(createAnalysis({ playerId: '123', averageStats: { rating: 0, kdRatio: 0, adr: 0, kast: 0, headshotPercentage: 0, gamesPlayed: 0 }, weaknesses: ['positioning'] }));

    const result = await handler.handleCoachingAdvice({ playerId: '123', skipAI: true, matchCount: 1, analysisType: 'general', timeRange: 'recent' });
    expect(result.content[0].text).toContain('coaching_advice');
    // Should still provide coaching advice even with limited data
    const parsed = JSON.parse(result.content[0].text);
    expect(parsed.response.analysis.averageStats.gamesPlayed).toBe(0);
  });

  it('should handle enhanced analysis with sufficient data', async () => {
  leetifyClient.getPlayerProfile.mockResolvedValue(mockPlayerProfile({ steam64_id: '123', id: '123', total_matches: 25 }));
  leetifyClient.getMatchHistory.mockResolvedValue(Array.from({length: 25}, (_, i) => ({ id: i.toString() })) as any);
  dataTransformer.setAdaptiveThresholds = jest.fn();
  dataTransformer.processMatches.mockReturnValue(createAnalysis({ playerId: '123', averageStats: { rating: 0, kdRatio: 0, adr: 0, kast: 0, headshotPercentage: 0, gamesPlayed: 25 } }));
    dataTransformer.generateEnhancedAnalysis = jest.fn().mockResolvedValue({
      performanceStateAnalysis: { 
        currentState: { classification: 'flow_state', confidence: 0.9 },
        detectedPatterns: {
          tiltIndicators: { active: false },
          flowStateIndicators: { active: true }
        }
      },
      metricCorrelationAnalysis: { primaryPerformanceDrivers: [] },
      predictiveWarningSystem: { immediateAlerts: [] },
    });

    const result = await handler.handleCoachingAdvice({ playerId: '123', skipAI: true, matchCount: 25, analysisType: 'general', timeRange: 'recent', enhancedAnalysis: true });
    expect(result.content[0].text).toContain('coaching_advice');
    expect(dataTransformer.generateEnhancedAnalysis).toHaveBeenCalled();
  });

  it('should handle different analysis types', async () => {
  leetifyClient.getPlayerProfile.mockResolvedValue(mockPlayerProfile({ steam64_id: '123', id: '123', total_matches: 10 }));
  leetifyClient.getMatchHistory.mockResolvedValue([{ id: '1' }] as any);
  dataTransformer.processMatches.mockReturnValue(createAnalysis({ playerId: '123', averageStats: { rating: 0, kdRatio: 0, adr: 0, kast: 0, headshotPercentage: 0, gamesPlayed: 10 } }));

    // Test aim analysis
    const aimResult = await handler.handleCoachingAdvice({ playerId: '123', skipAI: true, matchCount: 1, analysisType: 'aim', timeRange: 'recent' });
    expect(aimResult.content[0].text).toContain('coaching_advice');

    // Test positioning analysis  
    const posResult = await handler.handleCoachingAdvice({ playerId: '123', skipAI: true, matchCount: 1, analysisType: 'positioning', timeRange: 'recent' });
    expect(posResult.content[0].text).toContain('coaching_advice');
  });

  it('should handle API errors gracefully', async () => {
  leetifyClient.getPlayerProfile.mockRejectedValue(new Error('API Error'));

  const result = await handler.handleCoachingAdvice({ playerId: '123', skipAI: true, matchCount: 1, analysisType: 'general', timeRange: 'recent' });
  expect(result.isError).toBe(true);
  expect(result.content[0].text).toContain('API Error');
  });

  it('should validate invalid input', async () => {
  const result = await handler.handleCoachingAdvice({ playerId: 123 } as any);
  expect(result.isError).toBe(true);
  expect(result.content[0].text).toContain('invalid_type');
  });
});
