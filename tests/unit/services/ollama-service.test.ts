import { OllamaCoachService } from '../../../src/services/ollama';

// Minimal mock for Ollama client
class SimpleMockOllamaClient {
  constructor(public url: string, public model: string) {}
  generate = jest.fn();
}

describe('OllamaCoachService', () => {
  let service: OllamaCoachService;
  let mockOllama: SimpleMockOllamaClient;

  const mockRequest = {
    playerId: 'player123',
    analysisType: 'general' as const,
    timeRange: 'recent' as const,
    matchCount: 10,
    skipAI: false,
    analysis: {
      playerId: 'player123',
      timeRange: 'recent',
      averageStats: {
        rating: 1.15,
        kdRatio: 1.25,
        adr: 78.5,
        kast: 72,
        headshotPercentage: 36,
        gamesPlayed: 10,
      },
      recentPerformance: [],
      strengths: ['Strong fragging ability'],
      weaknesses: ['Improve utility usage'],
      trends: [],
    },
    playerProfile: {
      steamId: 'player123',
      nickname: 'TestPlayer',
      leetifyRating: 1.15,
      rank: 'DMG',
      gamesCount: 100,
      averageRating: 1.12,
      kdRatio: 1.25,
      winRate: 55,
    },
  };

  const validAIResponse = {
    model: 'cs2-coach',
    created_at: new Date(),
    done: true,
    done_reason: 'stop',
    response: JSON.stringify({
      summary: 'Player shows solid mechanical skills with room for tactical improvement',
      keyFindings: [
        'Strong aim mechanics with 36% headshot rate',
        'Good K/D ratio indicates survival skills',
        'Utility usage needs development',
      ],
      recommendations: [
        {
          category: 'utility',
          priority: 'high',
          title: 'Improve utility coordination',
          description: 'Focus on learning smoke and flash lineups',
          actionItems: ['Practice Yprac maps daily', 'Coordinate with teammates'],
          expectedImprovement: 'Better round impact and team play',
        },
      ],
      practiceRoutine: {
        warmup: ['Deathmatch for 15 minutes'],
        aimTraining: ['aim_botz practice'],
        mapPractice: ['Learn utility lineups'],
        tacticalReview: ['Watch pro demos'],
        estimatedTime: 60,
      },
      nextSteps: 'Focus on utility practice for the next week',
    }),
    context: [],
    total_duration: 1,
    load_duration: 1,
    prompt_eval_count: 1,
    prompt_eval_duration: 1,
    eval_count: 1,
    eval_duration: 1,
  };

  beforeEach(() => {
    mockOllama = new SimpleMockOllamaClient('http://localhost:11434', 'cs2-coach');
    service = new OllamaCoachService(mockOllama as any);
    service.clearCache();
    jest.clearAllMocks();
  });

  it('returns parsed coaching advice on valid response', async () => {
    mockOllama.generate.mockResolvedValueOnce(validAIResponse);
    const result = await service.analyzeGameplay(mockRequest);
    expect(result.summary).toMatch(/solid mechanical skills/);
    expect(result.recommendations[0].category).toBe('utility');
    expect(result.practiceRoutine.estimatedTime).toBe(60);
  });

  it('throws OllamaError on invalid JSON', async () => {
    mockOllama.generate.mockResolvedValueOnce({ ...validAIResponse, response: 'not valid json' });
    await expect(service.analyzeGameplay(mockRequest)).rejects.toThrow(/Failed to parse Ollama response/);
  });

  it('throws OllamaError on empty response', async () => {
    mockOllama.generate.mockResolvedValueOnce({ ...validAIResponse, response: '' });
    await expect(service.analyzeGameplay(mockRequest)).rejects.toThrow(/Empty response received from Ollama/);
  });

  it('throws OllamaError on API failure', async () => {
    mockOllama.generate.mockRejectedValueOnce(new Error('Connection failed'));
    await expect(service.analyzeGameplay(mockRequest)).rejects.toThrow('Connection failed');
  });

  it('uses cache for identical requests', async () => {
    mockOllama.generate.mockResolvedValue(validAIResponse);
    const result1 = await service.analyzeGameplay(mockRequest);
    const result2 = await service.analyzeGameplay(mockRequest);
    expect(result1).toEqual(result2);
    expect(mockOllama.generate).toHaveBeenCalledTimes(1);
  });

  it('does not use cache for different requests', async () => {
    mockOllama.generate.mockResolvedValue(validAIResponse);
    const req2 = { ...mockRequest, playerId: 'other' };
    await service.analyzeGameplay(mockRequest);
    await service.analyzeGameplay(req2);
    expect(mockOllama.generate).toHaveBeenCalledTimes(2);
  });
});