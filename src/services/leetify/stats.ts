// Stat calculation helpers extracted from LeetifyAPIClient

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
