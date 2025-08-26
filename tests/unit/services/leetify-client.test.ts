import { LeetifyAPIClient } from '../../../src/services/leetify/index';
import { LeetifyAPIError } from '../../../src/types/index';
import fetch from 'node-fetch';

// Mock node-fetch
jest.mock('node-fetch');
const mockFetch = fetch as jest.MockedFunction<typeof fetch>;

describe('LeetifyAPIClient', () => {
  describe('getMatchDetails', () => {
    const mockMatchDetail = {
      id: 'match1',
      finished_at: '2024-08-15T10:00:00Z',
      map_name: 'de_dust2',
      data_source: 'competitive',
      duration: 3600,
      playerId: '12345',
      stats: [
        {
          steam64_id: '12345',
          total_kills: 25,
          total_deaths: 15,
          total_assists: 5,
          dpr: 85.5,
          leetify_rating: 1.25,
          total_hs_kills: 10,
        },
      ],
      team_scores: [
        { team_number: 2, score: 16 },
        { team_number: 3, score: 10 },
      ],
    };
    test('should fetch and transform match details successfully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockMatchDetail,
        headers: {} as any,
        statusText: '',
      } as any);
      const result = await client.getMatchDetails('match1');
      expect(result).toHaveProperty('gameId', 'match1');
      expect(result).toHaveProperty('map', 'de_dust2');
      expect(result.playerStats).toHaveProperty('kills', 25);
    });
    test('should use cache for match details', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockMatchDetail,
        headers: {} as any,
        statusText: '',
      } as any);
      await client.getMatchDetails('match1');
      // Second call should use cache
      const result = await client.getMatchDetails('match1');
      expect(result).toHaveProperty('gameId', 'match1');
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });
    test('should throw on API error', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
        headers: {} as any,
      } as any);
      await expect(client.getMatchDetails('badid')).rejects.toThrow('Failed to fetch match details');
    });
  });

  describe('getImprovementData', () => {
    const mockImprovementData = {
      matches: [
        {
          gameId: 'match2',
          date: '2024-08-16T10:00:00Z',
          map: 'de_inferno',
          gameMode: 'competitive',
          durationSeconds: 3500,
          playerStats: [
            {
              steamId: '12345',
              kills: 20,
              deaths: 10,
              assists: 7,
              adr: 90.5,
              kast: 80,
              rating: 1.35,
              headshots: 12,
              headshotPercentage: 60,
              mvps: 4,
            },
          ],
          teamStats: {
            roundsWon: 16,
            roundsLost: 8,
            score: 16,
            side: 't',
          },
        },
      ],
    };
    test('should fetch and transform improvement data successfully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockImprovementData,
        headers: {} as any,
        statusText: '',
      } as any);
      const result = await client.getImprovementData('12345', '2024-08-01', '2024-08-31', 1);
      expect(result).toHaveLength(1);
      expect(result[0]).toHaveProperty('gameId', 'match2');
    });
    test('should use cache for improvement data', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockImprovementData,
        headers: {} as any,
        statusText: '',
      } as any);
      await client.getImprovementData('12345', '2024-08-01', '2024-08-31', 1);
      // Second call should use cache
      const result = await client.getImprovementData('12345', '2024-08-01', '2024-08-31', 1);
      expect(result).toHaveLength(1);
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });
    test('should throw on API error', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Server Error',
        headers: {} as any,
      } as any);
      await expect(client.getImprovementData('badid', '2024-08-01', '2024-08-31', 1)).rejects.toThrow('Failed to fetch improvement data');
    });
  });

  describe('getRankBenchmarks', () => {
    test('should return fallback benchmarks and cache them', async () => {
      const result = await client.getRankBenchmarks('mg');
      expect(result).toBeDefined();
      // Second call should use cache
      const result2 = await client.getRankBenchmarks('mg');
      expect(result2).toBe(result);
    });
  });

  describe('transformMatchData edge cases', () => {
    test('should handle missing stats and invalid date', () => {
      // @ts-ignore: access private
      const transformMatchData = client.transformMatchData.bind(client);
      const match = { id: 'm1', playerStats: null, date: 'not-a-date' };
      const result = transformMatchData(match, 'p1');
      expect(result).toHaveProperty('gameId', 'm1');
      expect(result.date).not.toBe('not-a-date');
    });
    test('should handle missing team scores', () => {
      // @ts-ignore: access private
      const transformMatchData = client.transformMatchData.bind(client);
      const match = { id: 'm2', playerStats: {}, date: '2024-08-01T00:00:00Z' };
      const result = transformMatchData(match, 'p2');
      expect(result.teamStats.roundsWon).toBe(0);
    });
  });
  let client: LeetifyAPIClient;

  const mockPlayerData = {
    steam64_id: '12345',
    id: 'player123',
    name: 'TestPlayer',
    total_matches: 100,
    winrate: 55,
    first_match_date: '2023-01-01',
    bans: null,
    ranks: {
      leetify: 1.15,
      faceit: null,
      premier: null,
      faceit_elo: null,
      wingman: null,
      renown: null,
      competitive: []
    },
    rating: {
      overall: 1.12,
      recent: 1.15
    },
    stats: {
      avg_kd_ratio: 1.25,
      avg_adr: 75.5,
      avg_kast: 72.3
    },
    recent_teammates: []
  };

  beforeEach(() => {
    client = new LeetifyAPIClient();
    client.clearCache();
    jest.clearAllMocks();
  });

  describe('getPlayerProfile', () => {

    test('should fetch and transform player profile successfully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockPlayerData,
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

      const result = await client.getPlayerProfile('12345');

      expect(result).toEqual({
        steam64_id: '12345',
        id: 'player123',
        name: 'TestPlayer',
        total_matches: 100,
        winrate: 55,
        first_match_date: '2023-01-01',
        bans: null,
        ranks: {
          leetify: 1.15,
          premier: null,
          faceit: null,
          faceit_elo: null,
          wingman: null,
          renown: null,
          competitive: []
        },
        rating: {
          overall: 1.12,
          recent: 1.15
        },
        stats: {
          avg_kd_ratio: 1.25,
          avg_adr: 75.5,
          avg_kast: 72.3
        },
        recent_teammates: []
      });

      // Accept any URL containing the player ID, and allow any headers (browser env may add more)
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('12345'),
        expect.objectContaining({
          headers: expect.objectContaining({
            'User-Agent': expect.any(String),
            'Accept': expect.any(String),
          }),
        })
      );
    });

    test('should throw LeetifyAPIError on API failure', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
        headers: {} as any,
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

      try {
        await client.getPlayerProfile('invalid');
        // If no error is thrown, fail the test
        fail('Expected LeetifyAPIError to be thrown');
      } catch (err) {
        expect(err && err.name).toBe('LeetifyAPIError');
        expect((err as Error).message).toContain('Failed to fetch player profile');
      }
    });

    test('should handle rate limiting with retry', async () => {
      // First call returns 429 (rate limited)
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 429,
        statusText: 'Too Many Requests',
        headers: {} as any,
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

      // Second call succeeds
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockPlayerData,
      } as any);

      const result = await client.getPlayerProfile('12345');

      expect(result.steam64_id).toBe('12345');
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    test('should use cached data when available', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockPlayerData,
      } as any);

      // First call should hit the API
      const result1 = await client.getPlayerProfile('12345');
      
      // Second call should use cache
      const result2 = await client.getPlayerProfile('12345');

      expect(result1).toEqual(result2);
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });
  });

  describe('getMatchHistory', () => {
    const mockMatchData = {
      matches: [
        {
          gameId: 'match1',
          date: '2024-08-15T10:00:00Z',
          map: 'de_dust2',
          gameMode: 'competitive',
          durationSeconds: 3600,
          playerStats: [{
            steamId: '12345',
            kills: 25,
            deaths: 15,
            assists: 5,
            adr: 85.5,
            kast: 75,
            rating: 1.25,
            headshots: 10,
            headshotPercentage: 40,
            mvps: 3,
          }],
          teamStats: {
            roundsWon: 16,
            roundsLost: 10,
            score: 16,
            side: 'ct',
          },
        },
      ],
    };

    test('should fetch and transform match history successfully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockMatchData,
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

      const result = await client.getMatchHistory('12345', 10);

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        gameId: 'match1',
        date: '2024-08-15T10:00:00Z',
        map: 'de_dust2',
        gameMode: 'competitive',
        durationSeconds: 3600,
        playerStats: {
          steamId: '12345',
          kills: 25,
          deaths: 15,
          assists: 5,
          adr: 85.5,
          kast: 100,
          rating: 1.25,
          headshots: 10,
          headshotPercentage: 40,
          mvps: 3,
        },
        rawPlayerStats: {
          steamId: '12345',
          kills: 25,
          deaths: 15,
          assists: 5,
          adr: 85.5,
          kast: 75,
          rating: 1.25,
          headshots: 10,
          headshotPercentage: 40,
          mvps: 3,
        },
        teamStats: {
          roundsWon: 0,
          roundsLost: 0,
          score: 0,
          side: 'ct',
        },
      });
    });

    test('should enforce match limit validation', async () => {
      await expect(client.getMatchHistory('12345', 100))
        .rejects
        .toThrow('Match limit cannot exceed 50');
    });

    test('should return empty array for invalid match data', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ matches: null }),
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

      const result = await client.getMatchHistory('12345');
      expect(result).toEqual([]);
    });

    test('should handle real Leetify API format', async () => {
      const realApiData = [
        {
          id: "38351665-134d-4001-8bfa-da03bf121eed",
          finished_at: "2025-08-16T01:08:30.000Z",
          data_source: "matchmaking",
          data_source_match_id: "CSGO-JPnmR-dOZvX-7Bebq-pJy6G-YSEdH",
          map_name: "de_dust2",
          has_banned_player: false,
          team_scores: [
            { team_number: 2, score: 6 },
            { team_number: 3, score: 13 }
          ],
          stats: [
            {
              steam64_id: "76561198850657011",
              name: "picxi",
              mvps: 2,
              total_kills: 16,
              total_deaths: 12,
              total_assists: 2,
              dpr: 77.58,
              leetify_rating: -0.003,
              total_hs_kills: 10,
              rounds_count: 19,
              rounds_survived: 7,
              initial_team_number: 3
            }
          ]
        }
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => realApiData,
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

      const result = await client.getMatchHistory('76561198850657011', 10);

      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        gameId: '38351665-134d-4001-8bfa-da03bf121eed',
        date: '2025-08-16T01:08:30.000Z',
        map: 'de_dust2',
        gameMode: 'matchmaking',
        playerStats: {
          steamId: '76561198850657011',
          kills: 16,
          deaths: 12,
          assists: 2,
          adr: 77.58,
          rating: -0.003,
          headshots: 10,
          headshotPercentage: 62.5, // 10/16 * 100
          mvps: 2,
        },
        teamStats: {
          roundsWon: 6,
          roundsLost: 13,
          score: 6,
          side: 'ct',
        },
      });

      // Verify KAST calculation
      expect(result[0].playerStats.kast).toBeGreaterThan(0);
    });
  });

  describe('rate limiting', () => {
    test('should respect rate limiting between requests', async () => {
      const startTime = Date.now();

      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => mockPlayerData,
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

      // Make two sequential requests
      await client.getPlayerProfile('player1');
      await client.getPlayerProfile('player2');

      const endTime = Date.now();
      const elapsed = endTime - startTime;

      // Should take at least the rate limit duration (100ms in test config)
      expect(elapsed).toBeGreaterThanOrEqual(100);
    });
  });

  describe('error handling', () => {
    test('should handle network errors gracefully', async () => {
      // Mock fetch to reject for all retry attempts (initial + 3 retries = 4 total)
      mockFetch.mockRejectedValue(new Error('Network error'));
      
      // Use a completely different ID to avoid any cache issues
      await expect(client.getPlayerProfile('network-error-test-id')).rejects.toThrow('Network error');
      
      // Verify that fetch was actually called
      expect(mockFetch).toHaveBeenCalled();
    });

    test('should retry on transient errors', async () => {
      // First call fails with network error
      mockFetch.mockRejectedValueOnce(new Error('Connection timeout'));

      // Second call succeeds
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockPlayerData,
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

      const result = await client.getPlayerProfile('12345');
      
      expect(result.steam64_id).toBe('12345');
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    test('should fail after max retry attempts', async () => {
      // Mock all retry attempts to fail
      mockFetch.mockRejectedValue(new Error('Persistent error'));

      await expect(client.getPlayerProfile('12345'))
        .rejects
        .toThrow('Persistent error');

      // Should have attempted initial call + 3 retries = 4 total
      expect(mockFetch).toHaveBeenCalledTimes(4);
    });
  });
});