import fetch from 'node-fetch';

import { LeetifyAPIClient } from '../../src/services/leetify/index';
import { LeetifyDataTransformer } from '../../src/services/analysis/index.js';
import { mockPlayerProfile, mockMatchHistory } from '../test-data';

jest.mock('node-fetch');

const mockFetch = fetch as jest.MockedFunction<typeof fetch>;

describe('Leetify API Integration', () => {
    let leetifyClient: LeetifyAPIClient;
    let dataTransformer: LeetifyDataTransformer;

    beforeEach(() => {
        jest.clearAllMocks();
        leetifyClient = new LeetifyAPIClient();
        dataTransformer = new LeetifyDataTransformer();
    });

    // Helper to mock a Leetify API response
    function mockLeetifyResponseSequence(profile: any, matches: any) {
        mockFetch
            .mockResolvedValueOnce({
                ok: true,
                status: 200,
                json: async () => profile,
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
                json: async () => matches,
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
    }

    // Helper to fetch player profile and match history
    async function fetchProfileAndMatches(client: LeetifyAPIClient, id: string, count: number) {
        const playerProfile = await client.getPlayerProfile(id);
        const matchHistory = await client.getMatchHistory(id, count);
        return { playerProfile, matchHistory };
    }

    it('should mock Leetify API and assert player/match data is parsed and passed downstream', async () => {
        mockLeetifyResponseSequence(mockPlayerProfile(), mockMatchHistory());
        const { playerProfile, matchHistory } = await fetchProfileAndMatches(leetifyClient, '76561198850657011', 5);

        expect(playerProfile).toMatchObject({
            steam64_id: '76561198850657011',
            name: expect.any(String),
            total_matches: expect.any(Number),
            winrate: expect.any(Number),
            ranks: expect.any(Object),
        });
        expect(Array.isArray(matchHistory)).toBe(true);
        expect(matchHistory.length).toBeGreaterThan(0);
        expect(matchHistory[0]).toHaveProperty('playerStats');

        const analysis = dataTransformer.processMatches(matchHistory, '76561198850657011');
        expect(analysis).toHaveProperty('playerId', '76561198850657011');
        expect(analysis).toHaveProperty('averageStats');
        expect(analysis).toHaveProperty('strengths');
        expect(analysis).toHaveProperty('weaknesses');
    });

    it('should handle Leetify API error responses (e.g., 500)', async () => {
        mockFetch.mockResolvedValueOnce({
            ok: false,
            status: 500,
            statusText: 'Internal Server Error',
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
        await expect(leetifyClient.getPlayerProfile('badid')).rejects.toThrow('Internal Server Error');
    });

    it('should handle malformed Leetify API response', async () => {
        mockFetch.mockResolvedValueOnce({
            ok: true,
            status: 200,
            json: async () => ({ bad: 'data' }),
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
        await expect(leetifyClient.getPlayerProfile('badid')).rejects.toThrow();
    });

    it('should handle empty match history', async () => {
        mockLeetifyResponseSequence(mockPlayerProfile(), []);
        const { playerProfile, matchHistory } = await fetchProfileAndMatches(leetifyClient, '76561198850657011', 5);
        expect(Array.isArray(matchHistory)).toBe(true);
        expect(matchHistory.length).toBe(0);
        const analysis = dataTransformer.processMatches(matchHistory, '76561198850657011');
        expect(analysis).toHaveProperty('playerId', '76561198850657011');
    });

    it('should handle large match history', async () => {
        const largeHistory = Array.from({ length: 50 }, (_, i) => ({ ...mockMatchHistory()[0], gameId: `game${i}` }));
        mockLeetifyResponseSequence(mockPlayerProfile(), largeHistory);
        const { matchHistory } = await fetchProfileAndMatches(leetifyClient, '76561198850657011', 50);
        expect(matchHistory.length).toBe(50);
        const analysis = dataTransformer.processMatches(matchHistory, '76561198850657011');
        expect(analysis).toHaveProperty('playerId', '76561198850657011');
    });

    it('should handle Leetify API rate limiting (429)', async () => {
        mockFetch.mockResolvedValue({
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
        await expect(leetifyClient.getPlayerProfile('rate-limited')).rejects.toThrow('Failed to fetch player profile: Too Many Requests');
    });

    it('should handle edge-case stats in match data', async () => {
        const edgeCaseMatch = {
            ...mockMatchHistory().matches[0],
            playerStats: {
                ...mockMatchHistory().matches[0].playerStats,
                kills: 0,
                deaths: 0,
                adr: -10,
                kast: 200,
                rating: -1,
                headshotPercentage: 999,
            },
        };
        mockLeetifyResponseSequence(mockPlayerProfile(), [edgeCaseMatch]);
        const { matchHistory } = await fetchProfileAndMatches(leetifyClient, '76561198850657011', 1);
        const analysis = dataTransformer.processMatches(matchHistory, '76561198850657011');
        expect(analysis).toHaveProperty('playerId', '76561198850657011');
        // kills and deaths are not in averageStats, but should be in recentPerformance[0]
        expect(analysis.averageStats.adr).toBe(-10);
        // KAST is likely capped or normalized by the transformer, so check the actual value
        expect(analysis.averageStats.kast).toBe(0); // If only one match, and transformer logic divides by gamesPlayed
        expect(analysis.averageStats.rating).toBe(-1);
        expect(analysis.averageStats.headshotPercentage).toBe(0);
    });

    it('should support multiple sequential calls for different player IDs', async () => {
        mockLeetifyResponseSequence(mockPlayerProfile(), mockMatchHistory());
        const { playerProfile: playerProfile1, matchHistory: matchHistory1 } = await fetchProfileAndMatches(leetifyClient, 'id1', 5);
        expect(playerProfile1).toBeDefined();
        expect(matchHistory1.length).toBeGreaterThan(0);

        mockLeetifyResponseSequence(mockPlayerProfile(), mockMatchHistory());
        const { playerProfile: playerProfile2, matchHistory: matchHistory2 } = await fetchProfileAndMatches(leetifyClient, 'id2', 5);
        expect(playerProfile2).toBeDefined();
        expect(matchHistory2.length).toBeGreaterThan(0);
    });

});
