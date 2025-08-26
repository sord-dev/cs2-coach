
// Ensure LeetifyAPIError is defined for use in this module


import fetch from 'node-fetch';
import { sleep, SimpleCache, getCS2RankBenchmarks, determineCSRank } from '../../utils/helpers.js';

import type {
	LeetifyConfig,
	LeetifyPlayerProfile,
	LeetifyMatchData,
	RawPlayerStats,
	RawLeetifyMatch
} from '../../types/index.js';

import { LeetifyAPIError } from '../../types/index.js';


// Stat calculation helpers (inlined from stats.ts)
export function calculateKAST(playerStats: any): number {
	const roundsCount = playerStats.rounds_count || 30;
	const kills = playerStats.total_kills || playerStats.kills || 0;
	const assists = playerStats.total_assists || playerStats.assists || 0;
	const roundsSurvived = playerStats.rounds_survived || 0;
	const impactRounds = Math.min(kills + assists + roundsSurvived, roundsCount);
	return roundsCount > 0 ? (impactRounds / roundsCount) * 100 : 0;
}

export function calculateHeadshotPercentage(playerStats: any): number {
	const totalKills = playerStats.total_kills || playerStats.kills || 0;
	const headshotKills = playerStats.total_hs_kills || playerStats.headshots || 0;
	if (totalKills === 0) return 0;
	return (headshotKills / totalKills) * 100;
}

export function determineSide(playerStats: any): 'ct' | 't' {
	const teamNumber = playerStats.initial_team_number;
	if (teamNumber === 2) return 't';
	if (teamNumber === 3) return 'ct';
	return 'ct';
}

interface QueuedRequest {
	url: string;
	options?: any;
	resolve: (value: any) => void;
	reject: (reason: any) => void;
	retryCount: number;
}

export class LeetifyAPIClient {
	private readonly config: LeetifyConfig;
	private requestQueue: QueuedRequest[] = [];
	private isProcessingQueue = false;
	private lastRequestTime = 0;
	private readonly cache = new SimpleCache<any>(1000);

	constructor() {
		this.config = {
			baseUrl: process.env.LEETIFY_API_BASE_URL || 'https://api-public.cs-prod.leetify.com',
			rateLimitMs: parseInt(process.env.LEETIFY_API_RATE_LIMIT_MS || '1000'),
			timeout: 30000,
			retryAttempts: 3,
		};
	}

	async testApiConnectivity(): Promise<any> {
		console.log('Testing Leetify API connectivity...');
		const endpointsToTest = [
			'/', '/health', '/status', '/v3', '/api', '/docs', '/swagger',
		];
		const results = [];
		for (const endpoint of endpointsToTest) {
			try {
				const url = `${this.config.baseUrl}${endpoint}`;
				console.log(`Testing: ${url}`);
				const response = await this.queueRequest(url);
				results.push({
					endpoint,
					status: response.status,
					ok: response.ok,
					headers: Object.fromEntries(response.headers.entries()),
				});
				if (response.ok) {
					try {
						const data = await response.text();
						console.log(`✅ ${endpoint} - ${response.status}: ${data.substring(0, 200)}...`);
					} catch (e) {
						console.log(`✅ ${endpoint} - ${response.status}: [Non-text response]`);
					}
				} else {
					console.log(`❌ ${endpoint} - ${response.status}: ${response.statusText}`);
				}
			} catch (error) {
				console.log(`💥 ${endpoint} - Error: ${error}`);
				results.push({
					endpoint,
					error: error instanceof Error ? error.message : String(error),
				});
			}
		}
		return results;
	}

	async getPlayerProfile(playerId: string): Promise<LeetifyPlayerProfile> {
		const cacheKey = `profile:${playerId}`;
		const cached = this.cache.get(cacheKey, 30 * 60 * 1000);
		if (cached) return cached;
		const url = `${this.config.baseUrl}/v3/profile?steam64_id=${playerId}`;
		let response;
		   try {
			   response = await this.queueRequest(url);
		   } catch (err) {
			   // Defensive: handle undefined/null error
			   if (!err) {
				   throw new LeetifyAPIError('Failed to fetch player profile: Unknown error', 0, false);
			   }
			   // If the error is a LeetifyAPIError (e.g., from rate limiting), rethrow with a consistent message
			   if (err instanceof LeetifyAPIError) {
				   if (err.statusCode === 429) {
					   throw new LeetifyAPIError(
						   'Failed to fetch player profile: Too Many Requests',
						   429,
						   true
					   );
				   }
				   if (typeof err.statusCode === 'number' && err.statusCode > 0) {
					   throw new LeetifyAPIError(
						   `Failed to fetch player profile: ${err.message}`,
						   err.statusCode,
						   false
					   );
				   }
				   throw err;
			   }
			   // If the error is a fetch Response-like object with status/statusText (but not a standard Error)
			   if (typeof err === 'object' && err !== null && !(err instanceof Error) && ('status' in err || 'statusText' in err)) {
				   const status = (err as any).status ?? 0;
				   let statusText = (err as any).statusText;
				   // Always use the correct message for 429
				   if (status === 429) {
					   // If statusText is missing, force it to 'Too Many Requests' for 429
					   statusText = statusText || 'Too Many Requests';
					   throw new LeetifyAPIError(
						   `Failed to fetch player profile: ${statusText}`,
						   429,
						   true
					   );
				   }
				   // For other statuses, use statusText if available, else fallback to status code or 'Unknown error'
				   throw new LeetifyAPIError(
					   `Failed to fetch player profile: ${statusText || status || 'Unknown error'}`,
					   status,
					   false
				   );
			   }
			   // Fallback: generic error message
			   throw new LeetifyAPIError(
				   `Failed to fetch player profile: ${(err instanceof Error ? err.message : String(err))}`,
				   0,
				   false
			   );
		   }
		if (!response || typeof response !== 'object' || typeof response.ok !== 'boolean' || typeof response.status !== 'number') {
			throw new LeetifyAPIError('No valid response object received from fetch', 0, false);
		}
		if (!response.ok) {
			throw new LeetifyAPIError(
				`Failed to fetch player profile: ${response.statusText}`,
				response.status,
				response.status === 429
			);
		}
		const data = await response.json();
		this.cache.set(cacheKey, data);
		return this.transformPlayerProfile(data);
	}

	async getMatchHistory(playerId: string, limit = 10): Promise<LeetifyMatchData[]> {
		if (limit > 50) throw new LeetifyAPIError('Match limit cannot exceed 50');
		const cacheKey = `matches:${playerId}:${limit}`;
		const cached = this.cache.get(cacheKey, 30 * 60 * 1000);
		if (cached) return cached;
		const url = `${this.config.baseUrl}/v3/profile/matches?steam64_id=${playerId}`;
		const response = await this.queueRequest(url);
		if (!response.ok) {
			throw new LeetifyAPIError(
				`Failed to fetch match history: ${response.statusText}`,
				response.status,
				response.status === 429
			);
		}
		const data = await response.json();
		const transformedData = this.transformMatchHistory(data, playerId, limit);
		this.cache.set(cacheKey, transformedData);
		return transformedData;
	}

	async getMatchDetails(gameId: string): Promise<LeetifyMatchData> {
		const cacheKey = `match:${gameId}`;
		const cached = this.cache.get(cacheKey, 60 * 60 * 1000);
		if (cached) return cached;
		const url = `${this.config.baseUrl}/v2/matches/${gameId}`;
		const response = await this.queueRequest(url);
		if (!response.ok) {
			throw new LeetifyAPIError(
				`Failed to fetch match details: ${response.statusText}`,
				response.status,
				response.status === 429
			);
		}
		const data = await response.json();
		const transformedData = this.transformMatchDetails(data);
		this.cache.set(cacheKey, transformedData);
		return transformedData;
	}

	async getImprovementData(playerId: string, fromDate: string, toDate: string, limit = 10): Promise<LeetifyMatchData[]> {
		if (limit > 50) throw new LeetifyAPIError('Match limit cannot exceed 50');
		const cacheKey = `improvement:${playerId}:${fromDate}:${toDate}:${limit}`;
		const cached = this.cache.get(cacheKey, 60 * 60 * 1000);
		if (cached) return cached;
		const url = `${this.config.baseUrl}/v3/profile/matches?steam64_id=${playerId}&from=${fromDate}&to=${toDate}`;
		const response = await this.queueRequest(url);
		if (!response.ok) {
			throw new LeetifyAPIError(
				`Failed to fetch improvement data: ${response.statusText}`,
				response.status,
				response.status === 429
			);
		}
		const data = await response.json();
		const transformedData = this.transformMatchHistory(data, playerId, limit);
		this.cache.set(cacheKey, transformedData);
		return transformedData;
	}

	async getRankBenchmarks(rank: string): Promise<any> {
		const cacheKey = `benchmarks:${rank}`;
		const cached = this.cache.get(cacheKey, 24 * 60 * 60 * 1000);
		if (cached) return cached;
		console.warn(`Warning: Using fallback rank benchmarks for ${rank}. The /benchmarks endpoint may not be available in the public API.`);
		const fallbackBenchmarks = this.getFallbackRankBenchmarks(rank);
		this.cache.set(cacheKey, fallbackBenchmarks);
		return fallbackBenchmarks;
	}

	private getFallbackRankBenchmarks(rank: string): any {
			// Use the new utility for real benchmark data
			try {
				return getCS2RankBenchmarks(rank);
			} catch (e) {
				// fallback to MG if error
				return getCS2RankBenchmarks('mg');
			}
	}

	private async queueRequest(url: string, options: any = {}): Promise<any> {
		return new Promise((resolve, reject) => {
			this.requestQueue.push({
				url,
				options: {
					timeout: this.config.timeout,
					headers: {
						'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:141.0) Gecko/20100101 Firefox/141.0',
						'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
						'Accept-Language': 'en-GB,en;q=0.5',
						'Accept-Encoding': 'gzip, deflate, br, zstd',
						'Connection': 'keep-alive',
						...options.headers,
					},
					...options,
				},
				resolve,
				reject,
				retryCount: 0,
			});
			this.processQueue();
		});
	}

	   private async processQueue(): Promise<void> {
		   if (this.isProcessingQueue || this.requestQueue.length === 0) return;
		   this.isProcessingQueue = true;
		   while (this.requestQueue.length > 0) {
			   const request = this.requestQueue.shift()!;
			   try {
				   const timeSinceLastRequest = Date.now() - this.lastRequestTime;
				   if (timeSinceLastRequest < this.config.rateLimitMs) {
					   await sleep(this.config.rateLimitMs - timeSinceLastRequest);
				   }
				   this.lastRequestTime = Date.now();
				   const response = await fetch(request.url, request.options);
				   if (response.status === 429) {
					   if (request.retryCount < this.config.retryAttempts) {
						   request.retryCount++;
						   const delay = Math.pow(2, request.retryCount) * 1000;
						   await sleep(delay);
						   this.requestQueue.unshift(request);
						   continue;
					   } else {
						   request.reject(response);
						   continue;
					   }
				   }
				   request.resolve(response);
			   } catch (error) {
				   // If error is a fetch Response-like object, attach status/statusText if missing
				   if (error && typeof error === 'object' && !('status' in error)) {
					   (error as any).status = 0;
				   }
				   if (request.retryCount < this.config.retryAttempts) {
					   request.retryCount++;
					   const delay = Math.pow(2, request.retryCount) * 1000;
					   await sleep(delay);
					   this.requestQueue.unshift(request);
					   continue;
				   }
				   request.reject(error);
			   }
		   }
		   this.isProcessingQueue = false;
	   }

	public clearCache(): void {
		this.cache.clear();
	}

	private transformPlayerProfile(rawData: any): LeetifyPlayerProfile {
		if (!rawData || (!rawData.steam64_id && !rawData.id)) {
			throw new LeetifyAPIError('Player not found or invalid profile data', 404, false);
		}
		return {
			steam64_id: rawData.steam64_id,
			id: rawData.id,
			name: rawData.name,
			total_matches: rawData.total_matches,
			winrate: rawData.winrate,
			first_match_date: rawData.first_match_date,
			bans: rawData.bans,
			ranks: {
				leetify: rawData.ranks?.leetify,
				premier: rawData.ranks?.premier,
				faceit: rawData.ranks?.faceit,
				faceit_elo: rawData.ranks?.faceit_elo,
				wingman: rawData.ranks?.wingman,
				renown: rawData.ranks?.renown,
				competitive: rawData.ranks?.competitive.map((r: any) => {
					return {
						map_name: r.map_name,
						rank: determineCSRank(r.rank),
					};
				}),
			},
			rating: { ...rawData.rating },
			stats: { ...rawData.stats },
			recent_teammates: rawData.recent_teammates,
		};
	}

	private transformMatchHistory(rawData: any, playerId: string, limit = 10): LeetifyMatchData[] {
		let matches = Array.isArray(rawData) ? rawData : rawData.matches;
		if (!matches || !Array.isArray(matches)) return [];
		matches = matches.slice(0, Math.max(0, Math.min(limit, 50)));
		return matches.map((match: any) => this.transformMatchData(match, playerId));
	}

	private transformMatchDetails(rawData: any): LeetifyMatchData {
		return this.transformMatchData(rawData, rawData.playerId);
	}

		private transformMatchData(match: any, playerId: string): LeetifyMatchData {
			const rawMatch = match as RawLeetifyMatch;
			let playerStats: RawPlayerStats | any = {};
			if (Array.isArray(rawMatch.stats)) {
				playerStats = rawMatch.stats.find((p: RawPlayerStats) => p.steam64_id === playerId) || {};
			} else if (Array.isArray(match.playerStats)) {
				playerStats = match.playerStats.find((p: any) => p.steamId === playerId) || {};
			} else {
				playerStats = match.playerStats || {};
			}
			const rawDate = rawMatch.finished_at || match.date || match.timestamp;
			const fallbackDate = new Date().toISOString();
			let validDate = fallbackDate;
			if (rawDate) {
				const parsedDate = new Date(rawDate);
				if (!isNaN(parsedDate.getTime())) {
					validDate = rawDate;
				}
			}
			const teamScores = rawMatch.team_scores || match.teamScores || [];
			const team1Score = teamScores.find((t: any) => t.team_number === 2)?.score || 0;
			const team2Score = teamScores.find((t: any) => t.team_number === 3)?.score || 0;
			return {
				gameId: rawMatch.id || match.gameId || match.id,
				date: validDate,
				map: rawMatch.map_name || match.map || match.mapName || 'unknown',
				gameMode: rawMatch.data_source || match.gameMode || match.mode || 'competitive',
				durationSeconds: match.durationSeconds || match.duration || 0,
				playerStats: {
					steamId: playerId,
					kills: playerStats.total_kills || playerStats.kills || 0,
					deaths: playerStats.total_deaths || playerStats.deaths || 0,
					assists: playerStats.total_assists || playerStats.assists || 0,
					adr: playerStats.dpr || playerStats.adr || playerStats.damagePerRound || 0,
					kast: calculateKAST(playerStats),
					rating: playerStats.leetify_rating || playerStats.rating || 0,
					headshots: playerStats.total_hs_kills || playerStats.headshots || 0,
					headshotPercentage: calculateHeadshotPercentage(playerStats),
					mvps: playerStats.mvps || 0,
				},
				// Preserve raw player stats for extended metrics analysis
				rawPlayerStats: playerStats,
				teamStats: {
					roundsWon: team1Score,
					roundsLost: team2Score,
					score: team1Score,
					side: determineSide(playerStats),
				},
			};
		}

}
