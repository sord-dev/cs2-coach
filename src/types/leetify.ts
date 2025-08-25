// Leetify API types
export interface RawLeetifyMatch {
  id: string;
  finished_at: string;
  data_source: string;
  data_source_match_id: string;
  map_name: string;
  has_banned_player: boolean;
  replay_url?: string;
  team_scores: RawTeamScore[];
  stats: RawPlayerStats[];
}

export interface RawTeamScore {
  team_number: number;
  score: number;
}

export interface RawPlayerStats {
  steam64_id: string;
  name: string;
  mvps: number;
  preaim: number;
  reaction_time: number;
  accuracy: number;
  accuracy_enemy_spotted: number;
  accuracy_head: number;
  shots_fired_enemy_spotted: number;
  shots_fired: number;
  shots_hit_enemy_spotted: number;
  shots_hit_friend: number;
  shots_hit_friend_head: number;
  shots_hit_foe: number;
  shots_hit_foe_head: number;
  utility_on_death_avg: number;
  he_foes_damage_avg: number;
  he_friends_damage_avg: number;
  he_thrown: number;
  molotov_thrown: number;
  smoke_thrown: number;
  counter_strafing_shots_all: number;
  counter_strafing_shots_bad: number;
  counter_strafing_shots_good: number;
  counter_strafing_shots_good_ratio: number;
  flashbang_hit_foe: number;
  flashbang_leading_to_kill: number;
  flashbang_hit_foe_avg_duration: number;
  flashbang_hit_friend: number;
  flashbang_thrown: number;
  flash_assist: number;
  score: number;
  initial_team_number: number;
  spray_accuracy: number;
  total_kills: number;
  total_deaths: number;
  kd_ratio: number;
  rounds_survived: number;
  rounds_survived_percentage: number;
  dpr: number;
  total_assists: number;
  total_damage: number;
  leetify_rating: number;
  ct_leetify_rating: number;
  t_leetify_rating: number;
  multi1k: number;
  multi2k: number;
  multi3k: number;
  multi4k: number;
  multi5k: number;
  rounds_count: number;
  rounds_won: number;
  rounds_lost: number;
  total_hs_kills: number;
  trade_kill_opportunities: number;
  trade_kill_attempts: number;
  trade_kills_succeed: number;
  trade_kill_attempts_percentage: number;
  trade_kills_success_percentage: number;
  trade_kill_opportunities_per_round: number;
  traded_death_opportunities: number;
  traded_death_attempts: number;
  traded_deaths_succeed: number;
  traded_death_attempts_percentage: number;
  traded_deaths_success_percentage: number;
  traded_deaths_opportunities_per_round: number;
}

export interface LeetifyPlayerProfile {
  steam64_id: string;
  id: string;
  name: string;
  total_matches: number;
  winrate: number;
  first_match_date?: string;
  bans?: any[];
  ranks: {
    leetify?: number;
    premier?: number;
    faceit?: number;
    faceit_elo?: number;
    wingman?: number;
    renown?: number | null;
    competitive?: Array<{ map_name: string; rank: number }>;
  };
  rating: Record<string, number>;
  stats: Record<string, number>;
  recent_teammates?: any[];
}

export interface LeetifyMatchData {
  gameId: string;
  date: string;
  map: string;
  gameMode: string;
  durationSeconds: number;
  playerStats: LeetifyPlayerStats;
  rawPlayerStats?: RawPlayerStats;
  teamStats: LeetifyTeamStats;
}

export interface LeetifyPlayerStats {
  steamId: string;
  kills: number;
  deaths: number;
  assists: number;
  adr: number;
  kast: number;
  rating: number;
  headshots: number;
  headshotPercentage: number;
  mvps: number;
}

export interface LeetifyTeamStats {
  roundsWon: number;
  roundsLost: number;
  score: number;
  side: 'ct' | 't';
}
