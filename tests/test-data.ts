// --- RawPlayerStats factory for enhanced analysis and type-correct test data ---
export function makeRawPlayerStats(overrides: Partial<any> = {}) {
  return {
    steam64_id: 'player123',
    name: 'Test Player',
    mvps: 2,
    preaim: 6,
    reaction_time: 510,
    accuracy: 0.5,
    accuracy_enemy_spotted: 0.5,
    accuracy_head: 0.5,
    shots_fired_enemy_spotted: 10,
    shots_fired: 100,
    shots_hit_enemy_spotted: 5,
    shots_hit_friend: 0,
    shots_hit_friend_head: 0,
    shots_hit_foe: 50,
    shots_hit_foe_head: 5,
    utility_on_death_avg: 0,
    he_foes_damage_avg: 0,
    he_friends_damage_avg: 0,
    he_thrown: 0,
    molotov_thrown: 0,
    smoke_thrown: 0,
    counter_strafing_shots_all: 0,
    counter_strafing_shots_bad: 0,
    counter_strafing_shots_good: 0,
    counter_strafing_shots_good_ratio: 0,
    flashbang_hit_foe: 0,
    flashbang_leading_to_kill: 0,
    flashbang_hit_foe_avg_duration: 0,
    flashbang_hit_friend: 0,
    flashbang_thrown: 0,
    flash_assist: 0,
    score: 0,
    initial_team_number: 1,
    spray_accuracy: 61,
    total_kills: 20,
    total_deaths: 10,
    kd_ratio: 2.0,
    rounds_survived: 10,
    rounds_survived_percentage: 33.3,
    dpr: 0.5,
    total_assists: 5,
    total_damage: 1600,
    leetify_rating: 1.1,
    ct_leetify_rating: 1.1,
    t_leetify_rating: 1.1,
    multi1k: 1,
    multi2k: 1,
    multi3k: 0,
    multi4k: 0,
    multi5k: 0,
    rounds_count: 30,
    rounds_won: 15,
    rounds_lost: 15,
    total_hs_kills: 10,
    trade_kill_opportunities: 0,
    trade_kill_attempts: 0,
    trade_kills_succeed: 0,
    trade_kill_attempts_percentage: 0,
    trade_kills_success_percentage: 0,
    trade_kill_opportunities_per_round: 0,
    traded_death_opportunities: 0,
    traded_death_attempts: 0,
    traded_deaths_succeed: 0,
    traded_death_attempts_percentage: 0,
    traded_deaths_success_percentage: 0,
    traded_deaths_opportunities_per_round: 0,
    // Add any additional fields required by RawPlayerStats here
    ...overrides
  };
}
// --- Area/process analysis and area stats factories for handler tests ---
export function createMockProcessAnalysis(overrides: Partial<any> = {}) {
  return {
    playerId: 'player1',
    timeRange: 'recent',
    averageStats: {
      rating: 1.15,
      kdRatio: 1.2,
      adr: 80,
      kast: 0.7,
      headshotPercentage: 0.4,
      gamesPlayed: 10,
      ...(overrides && overrides.averageStats ? overrides.averageStats : {})
    },
    recentPerformance: [],
    strengths: ['aim'],
    weaknesses: ['utility'],
    trends: [],
    ...overrides
  };
}

export function createMockAreaStats(overrides: Partial<any> = {}) {
  return {
    area: 'aim',
    stats: { kills: 10, rating: 1.2, headshotPercentage: 0.4, ...(overrides && overrides.stats ? overrides.stats : {}) },
    ...overrides
  };
}

// --- Base data shapes for reuse ---
function basePlayerProfile() {
  return {
    steam64_id: '76561198850657011',
    id: 'player123',
    name: 'picxi',
    total_matches: 150,
    winrate: 58,
    first_match_date: '2023-01-01',
    bans: [],
    ranks: {
      leetify: 1.15,
      faceit: undefined, // Fix: should be number | undefined, not null
      premier: 19598,
      mm: 'DMG',
      competitive: [
        { map_name: 'de_dust2', rank: 12 },
        { map_name: 'de_inferno', rank: 11 }
      ]
    },
    rating: { overall: 1.12, recent: 1.15 },
  stats: { avg_kd_ratio: 1.5, avg_adr: 75.5, avg_kast: 72.3, kd_ratio: 1.5 }, // Match test expectation for K/D: 1.5
    recent_teammates: [],
  };
}

function baseMatchHistory() {
  return {
    matches: [
      {
        gameId: 'match1',
        date: '2024-08-15T10:00:00Z',
        map: 'de_dust2',
        gameMode: 'competitive',
        durationSeconds: 3600,
        playerStats: [{
          steamId: 'player123', kills: 25, deaths: 15, assists: 5, adr: 85.5, kast: 75, rating: 1.25, headshots: 10, headshotPercentage: 40, mvps: 3
        }],
        teamStats: { roundsWon: 16, roundsLost: 12, score: 16, side: 'ct' }
      },
      {
        gameId: 'match2',
        date: '2024-08-14T15:30:00Z',
        map: 'de_inferno',
        gameMode: 'competitive',
        durationSeconds: 2700,
        playerStats: [{
          steamId: 'player123', kills: 18, deaths: 20, assists: 8, adr: 72.3, kast: 68, rating: 0.95, headshots: 6, headshotPercentage: 33, mvps: 1
        }],
        teamStats: { roundsWon: 13, roundsLost: 16, score: 13, side: 't' }
      },
      {
        gameId: 'match3',
        date: '2024-08-13T12:00:00Z',
        map: 'de_mirage',
        gameMode: 'competitive',
        durationSeconds: 3000,
        playerStats: [{
          steamId: 'player123', kills: 30, deaths: 10, assists: 5, adr: 90.0, kast: 80, rating: 1.5, headshots: 12, headshotPercentage: 40, mvps: 4
        }],
        teamStats: { roundsWon: 16, roundsLost: 8, score: 16, side: 'ct' }
      },
      {
        gameId: 'match4',
        date: '2024-08-12T14:00:00Z',
        map: 'de_overpass',
        gameMode: 'competitive',
        durationSeconds: 3600,
        playerStats: [{
          steamId: 'player123', kills: 28, deaths: 12, assists: 6, adr: 88.0, kast: 78, rating: 1.4, headshots: 11, headshotPercentage: 39, mvps: 3
        }],
        teamStats: { roundsWon: 15, roundsLost: 11, score: 15, side: 't' }
      },
      {
        gameId: 'match5',
        date: '2024-08-11T14:00:00Z',
        map: 'de_nuke',
        gameMode: 'competitive',
        durationSeconds: 3600,
        playerStats: [{
          steamId: 'player123', kills: 22, deaths: 18, assists: 7, adr: 80.0, kast: 75, rating: 1.1, headshots: 9, headshotPercentage: 41, mvps: 2
        }],
        teamStats: { roundsWon: 14, roundsLost: 12, score: 14, side: 'ct' }
      }
    ],
  };
}

// Legacy-style test data factories for compatibility with existing tests
export function mockPlayerProfile(overrides: Partial<any> = {}) {
  return { ...basePlayerProfile(), ...overrides };
}

export function mockMatchHistory(overrides: Partial<any> = {}) {
  return { ...baseMatchHistory(), ...overrides };
}

export function mockAIResponse(overrides: Partial<any> = {}) {
  return createMockAIResponse(overrides);
}
// --- Generic, type-correct test data factories for all test needs ---

// Player profile factory (generic)
export function createPlayerProfile(overrides: Partial<any> = {}) {
  // Use basePlayerProfile as a starting point, but allow for generic overrides
  const base = basePlayerProfile();
  return {
    ...base,
    playerId: overrides.playerId ?? base.id ?? base.steam64_id,
    ...overrides,
  };
}

// Analysis object factory
export function createAnalysis(overrides: Partial<any> = {}) {
  return {
    playerId: '123',
    timeRange: '30d',
    recentPerformance: [],
    averageStats: {
      rating: 1.2,
      kdRatio: 1.5,
      adr: 80,
      kast: 75,
      headshotPercentage: 40,
      gamesPlayed: 10,
      ...(overrides && overrides.averageStats ? overrides.averageStats : {})
    },
    strengths: ['aim'],
    weaknesses: ['utility'],
    trends: [
      { metric: 'adr', trend: 'improving' as 'improving', changePercentage: 5, description: 'ADR is trending up' }
    ],
    analysisType: 'general',
    ...overrides
  };
}

// Utility to generate a valid LeetifyMatchData object for metrics tests
export function createValidLeetifyMatchData(overrides: Partial<any> = {}): any {
  return {
    gameId: overrides.gameId ?? 'match1',
    date: overrides.date ?? '2024-08-17T10:00:00Z',
    map: overrides.map ?? 'de_dust2',
    gameMode: overrides.gameMode ?? 'competitive',
    durationSeconds: overrides.durationSeconds ?? 3600,
    playerStats: {
      rating: 1.2,
      kills: 20,
      deaths: 10,
      assists: 5,
      adr: 80,
      kast: 75,
      headshots: 8,
      headshotPercentage: 40,
      mvps: 2,
      ...((overrides.playerStats as object) || {})
    },
    rawPlayerStats: {
      steam64_id: 'player123',
      name: 'Test Player',
      mvps: 2,
      preaim: 5.5,
      reaction_time: 0.45,
      accuracy: 0.5,
      accuracy_enemy_spotted: 0.5,
      accuracy_head: 0.5,
      shots_fired_enemy_spotted: 10,
      shots_fired: 100,
      shots_hit_enemy_spotted: 5,
      shots_hit_friend: 0,
      shots_hit_friend_head: 0,
      shots_hit_foe: 50,
      shots_hit_foe_head: 5,
      utility_on_death_avg: 0,
      he_foes_damage_avg: 10,
      he_friends_damage_avg: 0,
      he_thrown: 1,
      molotov_thrown: 0,
      smoke_thrown: 2,
      counter_strafing_shots_all: 0,
      counter_strafing_shots_bad: 0,
      counter_strafing_shots_good: 0,
      counter_strafing_shots_good_ratio: 0,
      flashbang_hit_foe: 2,
      flashbang_leading_to_kill: 0,
      flashbang_hit_foe_avg_duration: 0,
      flashbang_hit_friend: 0,
      flashbang_thrown: 3,
      flash_assist: 0,
      score: 0,
      initial_team_number: 1,
      spray_accuracy: 85,
      total_kills: 20,
      total_deaths: 10,
      kd_ratio: 2.0,
      rounds_survived: 10,
      rounds_survived_percentage: 33.3,
      dpr: 0.5,
      total_assists: 5,
      total_damage: 1600,
      leetify_rating: 1.1,
      ct_leetify_rating: 1.1,
      t_leetify_rating: 1.1,
      multi1k: 1,
      multi2k: 1,
      multi3k: 0,
      multi4k: 0,
      multi5k: 0,
      rounds_count: 30,
      rounds_won: 15,
      rounds_lost: 15,
      total_hs_kills: 10,
      trade_kill_opportunities: 0,
      trade_kill_attempts: 0,
      trade_kills_succeed: 0,
      trade_kill_attempts_percentage: 0,
      trade_kills_success_percentage: 0,
      trade_kill_opportunities_per_round: 0,
      traded_death_opportunities: 0,
      traded_death_attempts: 0,
      traded_deaths_succeed: 0,
      traded_death_attempts_percentage: 0,
      traded_deaths_success_percentage: 0,
      traded_deaths_opportunities_per_round: 0,
      ...((overrides.rawPlayerStats as object) || {})
    },
    teamStats: {
      roundsWon: 16,
      roundsLost: 10,
      score: 16,
      side: 'ct',
      ...((overrides.teamStats as object) || {})
    },
    ...overrides
  };
}

// Utility to generate valid ExtendedMatchData for correlation analyzer tests
export function createValidExtendedMatchData(
  ratings: number[],
  overrides: Partial<any> = {},
  rawPlayerStatsArray?: Array<any>
): any[] {
  return ratings.map((rating, i) => ({
    gameId: overrides.gameId ?? `match${i + 1}`,
    date: overrides.date ?? `2024-01-${String(i + 1).padStart(2, '0')}T10:00:00Z`,
    map: overrides.map ?? (i % 2 === 0 ? 'de_dust2' : 'de_mirage'),
    gameMode: overrides.gameMode ?? 'competitive',
    durationSeconds: overrides.durationSeconds ?? 3600,
    playerStats: {
      rating: rating,
      kills: 20 + i,
      deaths: 15,
      assists: 5,
      adr: 75 + i,
      kast: 70 + i,
      headshots: 8,
      headshotPercentage: 40,
      mvps: 2,
      ...((overrides.playerStats as object) || {})
    },
    rawPlayerStats: rawPlayerStatsArray && rawPlayerStatsArray[i] !== undefined
      ? rawPlayerStatsArray[i]
      : {
          steam64_id: 'player123',
          name: 'Test Player',
          mvps: 2,
          preaim: 5.0 + i,
          reaction_time: 0.5 + i * 0.01,
          accuracy: 0.5,
          accuracy_enemy_spotted: 0.5,
          accuracy_head: 0.5,
          shots_fired_enemy_spotted: 10,
          shots_fired: 100,
          shots_hit_enemy_spotted: 5,
          shots_hit_friend: 0,
          shots_hit_friend_head: 0,
          shots_hit_foe: 50,
          shots_hit_foe_head: 5,
          utility_on_death_avg: 0,
          he_foes_damage_avg: 10,
          he_friends_damage_avg: 0,
          he_thrown: 1,
          molotov_thrown: 0,
          smoke_thrown: 2,
          counter_strafing_shots_all: 0,
          counter_strafing_shots_bad: 0,
          counter_strafing_shots_good: 0,
          counter_strafing_shots_good_ratio: 0,
          flashbang_hit_foe: 2,
          flashbang_leading_to_kill: 0,
          flashbang_hit_foe_avg_duration: 0,
          flashbang_hit_friend: 0,
          flashbang_thrown: 3,
          flash_assist: 0,
          score: 0,
          initial_team_number: 1,
          spray_accuracy: 75 + i,
          total_kills: 20 + i,
          total_deaths: 15,
          kd_ratio: (20 + i) / 15,
          rounds_survived: 10,
          rounds_survived_percentage: 33.3,
          dpr: 0.5,
          total_assists: 5,
          total_damage: 1600,
          leetify_rating: 1.1,
          ct_leetify_rating: 1.1,
          t_leetify_rating: 1.1,
          multi1k: 1,
          multi2k: 1,
          multi3k: 0,
          multi4k: 0,
          multi5k: 0,
          rounds_count: 30,
          rounds_won: 15,
          rounds_lost: 15,
          total_hs_kills: 10,
          trade_kill_opportunities: 0,
          trade_kill_attempts: 0,
          trade_kills_succeed: 0,
          trade_kill_attempts_percentage: 0,
          trade_kills_success_percentage: 0,
          trade_kill_opportunities_per_round: 0,
          traded_death_opportunities: 0,
          traded_death_attempts: 0,
          traded_deaths_succeed: 0,
          traded_death_attempts_percentage: 0,
          traded_deaths_success_percentage: 0,
          traded_deaths_opportunities_per_round: 0,
          ...((overrides.rawPlayerStats as object) || {})
        },
    teamStats: {
      roundsWon: 16,
      roundsLost: 10,
      score: 16,
      side: 'ct',
      ...((overrides.teamStats as object) || {})
    },
    ...overrides
  }));
}

// Example AI response factory
export function createMockAIResponse(overrides: Partial<any> = {}) {
  return {
    response: JSON.stringify({
      summary: 'Player shows strong mechanical skills but inconsistent performance',
      keyFindings: [
        'Excellent aim with 36.5% average headshot rate',
        'Performance varies significantly between matches',
        'Strong on CT side, weaker on T side positioning'
      ],
      recommendations: [
        {
          category: 'positioning',
          priority: 'high',
          title: 'Improve T-side positioning',
          description: 'Focus on aggressive positioning and entry fragging techniques',
          actionItems: [
            'Practice entry routes on key maps',
            'Study professional T-side positioning',
            'Work on peek timing and pre-aiming'
          ],
          expectedImprovement: 'More consistent T-side performance and higher impact rounds'
        },
        {
          category: 'aim',
          priority: 'medium',
          title: 'Maintain aim consistency',
          description: 'Continue current aim training to maintain high headshot percentage',
          actionItems: [
            'Daily aim_botz sessions (15-20 minutes)',
            'Focus on spray control in pressure situations'
          ],
          expectedImprovement: 'Sustained high-level aim performance'
        }
      ],
      practiceRoutine: {
        warmup: ['Deathmatch for 15 minutes', 'aim_botz quick session'],
        aimTraining: ['Crosshair placement drills', 'Spray control practice'],
        mapPractice: ['T-side entry routes on Dust2 and Inferno', 'Angle practice'],
        tacticalReview: ['Watch pro T-side executes', 'Review own T-side rounds'],
        estimatedTime: 75
      },
      nextSteps: 'Focus on T-side positioning and consistency for the next two weeks',
      ...overrides
    })
  };
}
