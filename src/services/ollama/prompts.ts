import type {CoachingAnalysisRequest, SpecificAreaRequest, ImprovementRequest, RankComparisonRequest, PerformanceTrend } from '../../types/index.js'

// Prompt construction logic for OllamaCoachService

export function buildAnalysisPrompt(request: CoachingAnalysisRequest): string {
  const { analysis, playerProfile, analysisType } = request;
  // Fallbacks for legacy fields
  const nickname = playerProfile.name || playerProfile.id || playerProfile.steam64_id;
  const leetifyRating = playerProfile.ranks?.leetify ?? playerProfile.rating?.leetify ?? '';
  const rank = playerProfile.ranks?.premier ?? playerProfile.ranks?.leetify ?? playerProfile.ranks?.faceit ?? '';
  const gamesCount = playerProfile.total_matches ?? '';
  const kdRatio = playerProfile.stats?.kd_ratio ?? '';
  const winRate = typeof playerProfile.winrate === 'number' ? playerProfile.winrate.toFixed(1) : '';
  return `CS2 Coaching Analysis\nPlayer: ${nickname} | Rating: ${leetifyRating} | Rank: ${rank} | Games: ${gamesCount} | K/D: ${kdRatio} | Win%: ${winRate}\nRecent: Rating ${analysis.averageStats.rating}, K/D ${analysis.averageStats.kdRatio}, ADR ${analysis.averageStats.adr}, KAST ${analysis.averageStats.kast}%, HS% ${analysis.averageStats.headshotPercentage}%, Games ${analysis.averageStats.gamesPlayed}\nStrengths: ${analysis.strengths.join('; ') || 'None'}\nWeaknesses: ${analysis.weaknesses.join('; ') || 'None'}\nTrends: ${analysis.trends.map((t: PerformanceTrend) => `${t.metric}: ${t.trend} (${t.changePercentage}%)`).join('; ') || 'None'}\nType: ${analysisType}\n\nReply ONLY with a valid JSON object using this schema:\n{\n  "summary": "...",\n  "keyFindings": ["..."],\n  "recommendations": [\n    {"category": "aim|positioning|utility|teamwork|general", "priority": "high|medium|low", "title": "...", "description": "...", "actionItems": ["..."], "expectedImprovement": "..."}\n  ],\n  "practiceRoutine": {"warmup": ["..."], "aimTraining": ["..."], "mapPractice": ["..."], "tacticalReview": ["..."], "estimatedTime": 0},\n  "nextSteps": "..."\n}\nAdvice must be specific, actionable, and based on the stats above.`;
}

export function buildSpecificAreaPrompt(request: SpecificAreaRequest): string {
  const { area, analysis, playerProfile } = request;
  const nickname = playerProfile.name || playerProfile.id || playerProfile.steam64_id;
  const leetifyRating = playerProfile.rating?.leetifyRating ?? playerProfile.rating?.leetify ?? '';
  const rank = playerProfile.ranks?.premier ?? playerProfile.ranks?.leetify ?? playerProfile.ranks?.faceit ?? '';
  return `CS2 ${area.toUpperCase()} Analysis\nPlayer: ${nickname} | Rating: ${leetifyRating} | Rank: ${rank}\nStats: ${getAreaSpecificStats(analysis, area)}\nReply ONLY with a valid JSON object (see general coaching schema). Focus on:\n- Current skill in ${area}\n- Weaknesses & improvement opportunities\n- Practice recommendations\n- Milestones to track progress.`;
}

export function buildImprovementPrompt(request: ImprovementRequest): string {
  return `CS2 Improvement Analysis\nPlayer ID: ${request.playerId}\nTrends: ${JSON.stringify(request.trends)}\nReply ONLY with a valid JSON object (see general coaching schema). Focus on:\n- What is improving\n- What needs more focus\n- Practice adjustments\n- Next goals.`;
}

export function buildRankComparisonPrompt(request: RankComparisonRequest): string {
  const { targetRank, comparison, playerProfile } = request;
  const nickname = playerProfile.name || playerProfile.id || playerProfile.steam64_id;
  const rank = playerProfile.ranks?.premier ?? playerProfile.ranks?.leetify ?? playerProfile.ranks?.faceit ?? '';
  return `CS2 Rank Comparison\nPlayer: ${nickname} (${rank}) vs Target: ${targetRank.toUpperCase()}\nComparison: ${JSON.stringify(comparison)}\nReply ONLY with a valid JSON object (see general coaching schema). Focus on:\n- Skills to improve for ${targetRank}\n- Key benchmarks\n- Priority areas\n- Realistic timeline.`;
}

export function getAreaSpecificStats(analysis: any, area: string): string {
  switch (area) {
    case 'aim':
      return `- Headshot %: ${analysis.averageStats.headshotPercentage}%\n- K/D Ratio: ${analysis.averageStats.kdRatio}\n- ADR: ${analysis.averageStats.adr}`;
    case 'positioning':
      return `- KAST%: ${analysis.averageStats.kast}%\n- Rating: ${analysis.averageStats.rating}\n- Survival Rate: ${analysis.averageStats.kdRatio > 1 ? 'Good' : 'Needs Improvement'}`;
    case 'utility':
      return `- ADR: ${analysis.averageStats.adr}\n- Support Score: ${analysis.averageStats.rating}\n- Team Play Rating: ${analysis.averageStats.kast}%`;
    case 'teamwork':
      return `- KAST%: ${analysis.averageStats.kast}%\n- Win Rate Impact: ${analysis.averageStats.rating}\n- Team Contribution: Multi-round impact analysis`;
    default:
      return JSON.stringify(analysis.averageStats, null, 2);
  }
}
