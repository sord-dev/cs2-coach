import fetch from 'node-fetch';

import { OllamaCoachService } from '../../src/services/ollama/index';
import { LeetifyAPIClient } from '../../src/services/leetify/index';
import { LeetifyDataTransformer } from '../../src/services/analysis';
import { mockPlayerProfile, mockMatchHistory, mockAIResponse } from '../test-data';

jest.mock('node-fetch');

const mockFetch = fetch as jest.MockedFunction<typeof fetch>;

describe('Ollama Model Integration', () => {
  let leetifyClient: LeetifyAPIClient;
  let dataTransformer: LeetifyDataTransformer;
  let ollamaService: OllamaCoachService;
  let mockOllamaClient: any;

  beforeEach(() => {
    jest.clearAllMocks();
    leetifyClient = new LeetifyAPIClient();
    dataTransformer = new LeetifyDataTransformer();
    
    // Create mock Ollama client
    mockOllamaClient = {
      generate: jest.fn()
    };
    
    // Inject mock client into the service
    ollamaService = new OllamaCoachService(mockOllamaClient);
  });

  it('should mock Ollama model, assert prompt construction and AI response parsing', async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockPlayerProfile(),
        headers: {} as any,
        statusText: '',
        url: '',
        redirected: false,
        type: 'default',
        clone: () => undefined,
        body: null,
        buffer: () => Promise.resolve(Buffer.from('')),
        size: 0,
        textConverted: false,
        timeout: 0,
      } as any)
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockMatchHistory(),
        headers: {} as any,
        statusText: '',
        url: '',
        redirected: false,
        type: 'default',
        clone: () => undefined,
        body: null,
        buffer: () => Promise.resolve(Buffer.from('')),
        size: 0,
        textConverted: false,
        timeout: 0,
      } as any);

    const aiResponse = mockAIResponse();
    mockOllamaClient.generate.mockResolvedValue({ response: aiResponse.response });

    const playerProfile = await leetifyClient.getPlayerProfile('76561198850657011');
    const matchHistory = await leetifyClient.getMatchHistory('76561198850657011', 5);
    const analysis = dataTransformer.processMatches(matchHistory, '76561198850657011');

    const result = await ollamaService.analyzeGameplay({
      playerId: '76561198850657011',
      analysisType: 'general',
      timeRange: 'recent',
      matchCount: 5,
      analysis,
      playerProfile,
      skipAI: false,
    });

    expect(mockOllamaClient.generate).toHaveBeenCalled();
    const promptArg = mockOllamaClient.generate.mock.calls[0][0];
    expect(typeof promptArg.prompt).toBe('string');
    expect(promptArg.prompt).toContain('picxi');
    expect(promptArg.prompt).toContain('Recent');
    expect(result).toHaveProperty('summary');
    expect(typeof result.summary).toBe('string');
    expect(result).toHaveProperty('recommendations');
    expect(Array.isArray(result.recommendations)).toBe(true);
    expect(result.recommendations.length).toBeGreaterThan(0);
  });
});
