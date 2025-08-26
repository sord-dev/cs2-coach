import { OllamaCoachService } from '../../../src/services/ollama';

// Minimal mock for Ollama client
class SimpleMockOllamaClient {
  constructor(public url: string, public model: string) {}
  generate = jest.fn();
}

describe('OllamaCoachService', () => {
  it('analyzeSpecificArea returns parsed advice', async () => {
    mockOllama.generate.mockResolvedValueOnce(validAIResponse);
    const req = {
      playerId: 'player123',
      area: 'aim',
      analysis: {
        averageStats: {
          rating: 1,
          kdRatio: 1,
          adr: 1,
          kast: 1,
          headshotPercentage: 1,
          gamesPlayed: 1,
        },
      },
      playerProfile: mockPlayerProfile
    };
    const result = await service.analyzeSpecificArea(req);
    expect(result).toHaveProperty('recommendations');
  });

  it('analyzeImprovement returns parsed advice', async () => {
    mockOllama.generate.mockResolvedValueOnce(validAIResponse);
    const req = { playerId: 'player123', trends: {} };
    const result = await service.analyzeImprovement(req);
    expect(result).toHaveProperty('recommendations');
  });

  it('analyzeRankComparison returns parsed advice', async () => {
    mockOllama.generate.mockResolvedValueOnce(validAIResponse);
  const req = { playerId: 'player123', targetRank: 'LEM', comparison: {}, playerProfile: mockPlayerProfile };
    const result = await service.analyzeRankComparison(req);
    expect(result).toHaveProperty('recommendations');
  });

  it('analyzeEnhancedData returns enhanced summary and keyFindings', async () => {
    mockOllama.generate.mockResolvedValueOnce(validAIResponse);
  const req = { playerId: 'player123', enhancedAnalysis: {}, basicAnalysis: {}, playerProfile: mockPlayerProfile, components: ['aim', 'utility'] };
    const result = await service.analyzeEnhancedData(req);
    expect(result.summary).toMatch(/Enhanced statistical analysis/);
  expect(result.keyFindings?.[0]).toMatch(/Advanced statistical analysis/);
  });

  it('parseCoachingResponse throws on no JSON in response', () => {
    // @ts-ignore: access private
    expect(() => service.parseCoachingResponse('no json here', {})).toThrow(/No JSON found/);
  });

  it('parseCoachingResponse handles missing recommendations and practiceRoutine', () => {
    // @ts-ignore: access private
    const minimal = JSON.stringify({ summary: 's', keyFindings: [], nextSteps: 'n' });
    // @ts-ignore: access private
    const result = service.parseCoachingResponse(minimal, {});
    expect(result.recommendations[0]).toHaveProperty('category');
    expect(result.practiceRoutine).toHaveProperty('warmup');
  });

  it('createFallbackResponse returns fallback structure', () => {
    // @ts-ignore: access private
    const result = service.createFallbackResponse({}, 'raw');
    expect(result.recommendations[0].description).toMatch(/raw/);
    expect(result.practiceRoutine).toHaveProperty('warmup');
  });

  it('queueRequest handles multiple requests in order', async () => {
    let order: string[] = [];
    const s = new OllamaCoachService({ generate: async () => validAIResponse });
    const p1 = s['queueRequest'](() => Promise.resolve(order.push('a')));
    const p2 = s['queueRequest'](() => Promise.resolve(order.push('b')));
    await Promise.all([p1, p2]);
    expect(order).toEqual(['a', 'b']);
  });

  it('validateRecommendations handles malformed input', () => {
    // @ts-ignore: access private
    const result = service.validateRecommendations([{}, { title: 't' }]);
    expect(result[0]).toHaveProperty('title');
    expect(result[1].title).toBe('t');
  });

  it('validatePracticeRoutine handles malformed input', () => {
    // @ts-ignore: access private
    const result = service.validatePracticeRoutine({});
    expect(result).toHaveProperty('warmup');
    expect(result).toHaveProperty('aimTraining');
  });
  let service: OllamaCoachService;
  let mockOllama: SimpleMockOllamaClient;

  const mockPlayerProfile = {
    steam64_id: '76561198000000000',
    id: 'player123',
    name: 'TestPlayer',
    total_matches: 100,
    winrate: 55,
    first_match_date: '2022-01-01',
    bans: [],
    ranks: {
      leetify: 10,
      premier: 5,
      faceit: 3,
      faceit_elo: 2000,
      wingman: 2,
      renown: null,
      competitive: [{ map_name: 'de_dust2', rank: 10 }],
    },
    rating: { overall: 1.15 },
    stats: { kd: 1.25, adr: 78.5, kast: 72, headshotPercentage: 36 },
    recent_teammates: [],
  };

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
  playerProfile: mockPlayerProfile,
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