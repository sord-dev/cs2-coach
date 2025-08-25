
import {
    buildAnalysisPrompt,
    buildSpecificAreaPrompt,
    buildImprovementPrompt,
    buildRankComparisonPrompt,
    getAreaSpecificStats
} from '../../../../src/services/ollama/prompts';
import {
    createPlayerProfile,
    createAnalysis
} from '../../../test-data';

describe('Ollama prompt builders', () => {
    const fakeProfile = createPlayerProfile();
    const fakeAnalysis = createAnalysis();
    it('buildAnalysisPrompt includes player and stats', () => {
        const prompt = buildAnalysisPrompt({
            analysis: fakeAnalysis,
            playerProfile: fakeProfile,
            analysisType: 'general'
        });
        expect(prompt).toMatch(/picxi/);
        expect(prompt).toMatch(/Rating: 1.15/);
        expect(prompt).toMatch(/K\/D: 1.5/);
        expect(prompt).toMatch(/Strengths: aim/);
        expect(prompt).toMatch(/Weaknesses: utility/);
        expect(prompt).toMatch(/ADR 80/);
    });

    it('buildSpecificAreaPrompt includes area and stats', () => {
        const prompt = buildSpecificAreaPrompt({
            playerId: '123',
            area: 'aim',
            analysis: fakeAnalysis,
            playerProfile: fakeProfile
        });

        expect(prompt).toMatch(/AIM Analysis/);
        expect(prompt).toMatch(/Headshot %/);
        expect(prompt).toMatch(/K\/D Ratio/);
    });

    it('buildImprovementPrompt includes trends', () => {
        const prompt = buildImprovementPrompt({ playerId: '123', trends: [{ metric: 'adr', trend: 'up', changePercentage: 5 }] });
        expect(prompt).toMatch(/Improvement Analysis/);
        expect(prompt).toMatch(/adr/);
        expect(prompt).toMatch(/up/);
    });
    it('buildRankComparisonPrompt includes target rank and comparison', () => {
        const prompt = buildRankComparisonPrompt({
            playerId: '123',
            targetRank: 'LE',
            comparison: { adr: 80, kd: 1.2 },
            playerProfile: fakeProfile
        });
        expect(prompt).toMatch(/Rank Comparison/);
        expect(prompt).toMatch(/Target: LE/);
        expect(prompt).toMatch(/adr/);
    });
    it('getAreaSpecificStats returns correct stats for area', () => {
        const aimStats = getAreaSpecificStats(fakeAnalysis, 'aim');
        expect(aimStats).toMatch(/Headshot %/);
        const posStats = getAreaSpecificStats(fakeAnalysis, 'positioning');
        expect(posStats).toMatch(/KAST%/);
        const utilStats = getAreaSpecificStats(fakeAnalysis, 'utility');
        expect(utilStats).toMatch(/Support Score/);
        const teamStats = getAreaSpecificStats(fakeAnalysis, 'teamwork');
        expect(teamStats).toMatch(/Team Contribution/);
        const defStats = getAreaSpecificStats(fakeAnalysis, 'other');
        expect(defStats).toMatch(/rating/);
    });
});
