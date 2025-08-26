
import { LeetifyDataTransformer } from '../../../src/services/data-transformer';
import { getAreaLabel } from '../../../src/services/analysis/area';
import { makeRawPlayerStats } from '../../test-data';

import type { LeetifyMatchData } from '../../../src/types';


describe('LeetifyDataTransformer', () => {
  let transformer: LeetifyDataTransformer;
  let mockMatches: LeetifyMatchData[];


  beforeEach(() => {
    transformer = new LeetifyDataTransformer();
    // Create mock match data
    mockMatches = [
      {
        gameId: 'match1',
        date: '2024-08-15T10:00:00Z',
        map: 'de_dust2',
        gameMode: 'competitive',
        durationSeconds: 3600,
        playerStats: {
          steamId: 'player123',
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
          roundsWon: 16,
          roundsLost: 10,
          score: 16,
          side: 'ct',
        },
      },
      {
        gameId: 'match2',
        date: '2024-08-14T15:30:00Z',
        map: 'de_inferno',
        gameMode: 'competitive',
        durationSeconds: 2700,
        playerStats: {
          steamId: 'player123',
          kills: 18,
          deaths: 20,
          assists: 8,
          adr: 72.3,
          kast: 68,
          rating: 0.95,
          headshots: 6,
          headshotPercentage: 33,
          mvps: 1,
        },
        teamStats: {
          roundsWon: 12,
          roundsLost: 16,
          score: 12,
          side: 't',
        },
      },
      {
        gameId: 'match3',
        date: '2024-08-13T20:15:00Z',
        map: 'de_mirage',
        gameMode: 'competitive',
        durationSeconds: 4200,
        playerStats: {
          steamId: 'player123',
          kills: 22,
          deaths: 18,
          assists: 6,
          adr: 78.9,
          kast: 72,
          rating: 1.10,
          headshots: 8,
          headshotPercentage: 36,
          mvps: 2,
        },
        teamStats: {
          roundsWon: 14,
          roundsLost: 16,
          score: 14,
          side: 'ct',
        },
      },
    ];
  });

  // --- Additional Coverage Tests ---
  describe('coverage: adaptive thresholds and area branches', () => {
    test('should use adaptive thresholds when setAdaptiveThresholds is called', () => {
      // Set a premier rating and check that adaptive thresholds are used
      transformer.setAdaptiveThresholds(2000);
      // The only way to check is to call a method that uses thresholds and ensure no error
      const result = transformer.processMatches(mockMatches, 'player123');
      expect(result).toHaveProperty('strengths');
    });

    test('should analyze teamwork area specifically', () => {
      const baseAnalysis = transformer.processMatches(mockMatches, 'player123');
      const result = transformer.analyzeSpecificArea(baseAnalysis, 'teamwork');
      expect(result.areaFocus).toBe(getAreaLabel('teamwork'));
      expect(result.areaSpecificInsights).toHaveProperty('currentLevel');
      expect(result.practiceRecommendations).toContain('Practice communication callouts');
    });

    test('should handle unknown area and use default fallback', () => {
      const baseAnalysis = transformer.processMatches(mockMatches, 'player123');
      const result = transformer.analyzeSpecificArea(baseAnalysis, 'unknown_area');
      expect(result.areaFocus).toBe(getAreaLabel('unknown_area'));
      expect(result.areaSpecificInsights).toHaveProperty('message', 'General analysis completed');
      expect(result.practiceRecommendations).toContain('Practice aim_botz for 15-20 minutes daily'); // fallback to aim
  });

  describe('coverage: assess*Level branches', () => {
    test('assessAimLevel returns Expert, Advanced, Intermediate, Beginner', () => {
      // @ts-ignore: access private
      const assessAimLevel = transformer.assessAimLevel.bind(transformer);
      expect(assessAimLevel({ headshotPercentage: 45, kdRatio: 1.4 })).toBe('Expert');
      expect(assessAimLevel({ headshotPercentage: 35, kdRatio: 1.2 })).toBe('Advanced');
      expect(assessAimLevel({ headshotPercentage: 27, kdRatio: 1.0 })).toBe('Intermediate');
      expect(assessAimLevel({ headshotPercentage: 10, kdRatio: 0.5 })).toBe('Beginner');
    });
    test('assessPositioningLevel returns Expert, Advanced, Intermediate, Beginner', () => {
      // @ts-ignore: access private
      const assessPositioningLevel = transformer.assessPositioningLevel.bind(transformer);
      expect(assessPositioningLevel({ kast: 85, rating: 1.3 })).toBe('Expert');
      expect(assessPositioningLevel({ kast: 75, rating: 1.1 })).toBe('Advanced');
      expect(assessPositioningLevel({ kast: 65, rating: 0.9 })).toBe('Intermediate');
      expect(assessPositioningLevel({ kast: 50, rating: 0.5 })).toBe('Beginner');
    });
    // Add similar tests for assessUtilityLevel and assessTeamworkLevel if present
  });

    describe('processMatches', () => {
      test('should process matches and return comprehensive analysis', () => {
        const result = transformer.processMatches(mockMatches, 'player123');

        expect(result).toMatchObject({
          playerId: 'player123',
          averageStats: expect.objectContaining({
            rating: expect.any(Number),
            kdRatio: expect.any(Number),
            adr: expect.any(Number),
            kast: expect.any(Number),
            headshotPercentage: expect.any(Number),
            gamesPlayed: 3,
          }),
          recentPerformance: expect.arrayContaining([
            expect.objectContaining({
              rating: expect.any(Number),
              kdRatio: expect.any(Number),
            }),
          ]),
          strengths: expect.any(Array),
          weaknesses: expect.any(Array),
          trends: expect.any(Array),
        });
      });

      test('should calculate correct average statistics', () => {
        const result = transformer.processMatches(mockMatches, 'player123');

        // Expected averages:
        // Rating: (1.25 + 0.95 + 1.10) / 3 = 1.10
        // K/D: (25/15 + 18/20 + 22/18) / 3 = (1.67 + 0.9 + 1.22) / 3 = 1.26
        // ADR: (85.5 + 72.3 + 78.9) / 3 = 78.9
        // KAST: (75 + 68 + 72) / 3 = 71.7
        // HS%: (40 + 33 + 36) / 3 = 36.3

        expect(result.averageStats.rating).toBeCloseTo(1.10, 2);
        expect(result.averageStats.kdRatio).toBeCloseTo(1.26, 2);
        expect(result.averageStats.adr).toBeCloseTo(78.9, 1);
        expect(result.averageStats.kast).toBeCloseTo(71.7, 1);
        expect(result.averageStats.headshotPercentage).toBeCloseTo(36.3, 1);
      });

      test('should identify strengths correctly', () => {
        const result = transformer.processMatches(mockMatches, 'player123');

        // With rating 1.10 and good K/D, should identify strong performance
        expect(result.strengths).toContain('Consistent high-impact performance');
        expect(result.strengths).toContain('Strong fragging ability');
        expect(result.strengths).toContain('Good damage output');
      });

      test('should identify weaknesses when performance is poor', () => {
        // Create matches with poor performance
        const poorMatches = mockMatches.map(match => ({
          ...match,
          playerStats: {
            ...match.playerStats,
            rating: 0.7,
            kdRatio: 0.6,
            adr: 50,
            kast: 55,
            headshotPercentage: 15,
          },
        }));

        const result = transformer.processMatches(poorMatches, 'player123');

        expect(result.weaknesses).toContain('Overall impact needs improvement');
        expect(result.weaknesses).toContain('Increase damage output per round');
        expect(result.weaknesses).toContain('Improve round participation and impact');
        expect(result.weaknesses).toContain('Work on aim and crosshair placement');
      });

      test('should identify performance trends', () => {
        const result = transformer.processMatches(mockMatches, 'player123');

        expect(result.trends).toHaveLength(5); // 5 metrics tracked
        result.trends.forEach(trend => {
          expect(trend).toMatchObject({
            metric: expect.any(String),
            trend: expect.stringMatching(/^(improving|declining|stable)$/),
            changePercentage: expect.any(Number),
            description: expect.any(String),
          });
        });
      });

      test('should handle empty matches gracefully', () => {
        const result = transformer.processMatches([], 'player123');

        expect(result).toMatchObject({
          playerId: 'player123',
          timeRange: 'No matches found',
          averageStats: {
            rating: 0,
            kdRatio: 0,
            adr: 0,
            kast: 0,
            headshotPercentage: 0,
            gamesPlayed: 0,
          },
          recentPerformance: [],
          strengths: [],
          weaknesses: ['Insufficient match data'],
          trends: [],
        });
      });
    });

    describe('analyzeSpecificArea', () => {
      test('should analyze aim area specifically', () => {
        const baseAnalysis = transformer.processMatches(mockMatches, 'player123');
        const result = transformer.analyzeSpecificArea(baseAnalysis, 'aim');

        expect(result.areaFocus).toBe(getAreaLabel('aim'));
        expect(result.areaSpecificInsights).toMatchObject({
          currentLevel: expect.stringMatching(/^(Beginner|Intermediate|Advanced|Expert)$/),
          keyMetrics: expect.objectContaining({
            headshotPercentage: expect.any(Number),
            kdRatio: expect.any(Number),
            adr: expect.any(Number),
          }),
          focusAreas: expect.any(Array),
        });
        expect(result.targetMetrics).toMatchObject({
          headshotPercentage: 35,
          kdRatio: 1.2,
          adr: 75,
        });
        expect(result.availableAreas).toContain(getAreaLabel('aim'));
      });

      test('should analyze positioning area specifically', () => {
        const baseAnalysis = transformer.processMatches(mockMatches, 'player123');
        const result = transformer.analyzeSpecificArea(baseAnalysis, 'positioning');

        expect(result.areaFocus).toBe(getAreaLabel('positioning'));
        expect(result.areaSpecificInsights.keyMetrics).toMatchObject({
          kast: expect.any(Number),
          rating: expect.any(Number),
          survival: expect.any(Number),
        });
        expect(result.availableAreas).toContain(getAreaLabel('positioning'));
      });

      test('should provide area-specific practice recommendations', () => {
        const baseAnalysis = transformer.processMatches(mockMatches, 'player123');
        const result = transformer.analyzeSpecificArea(baseAnalysis, 'utility');

        expect(result.practiceRecommendations).toContain('Learn smoke and flash lineups for main maps');
        expect(result.practiceRecommendations).toContain('Practice coordinated utility usage with teammates');
      });
    });

    describe('calculateImprovementTrends', () => {
      test('should calculate trends over time periods', () => {
        const result = transformer.calculateImprovementTrends(mockMatches, ['rating', 'kdRatio']);

        expect(result).toMatchObject({
          timeRange: expect.any(String),
          trends: expect.objectContaining({
            rating: expect.objectContaining({
              trend: expect.stringMatching(/^(improving|declining|stable)$/),
              change: expect.any(Number),
              description: expect.any(String),
            }),
            kdRatio: expect.objectContaining({
              trend: expect.stringMatching(/^(improving|declining|stable)$/),
              change: expect.any(Number),
              description: expect.any(String),
            }),
          }),
          overallDirection: expect.stringMatching(/^(improving|declining|stable)$/),
          recommendations: expect.any(Array),
        });
      });

      test('should handle insufficient data for trends', () => {
        const singleMatch = [mockMatches[0]];
        const result = transformer.calculateImprovementTrends(singleMatch, ['rating']);

        expect(result.trends.rating).toMatchObject({
          trend: 'stable',
          change: 0,
          description: 'Insufficient data',
        });
      });
    });

    describe('compareToRank', () => {
      test('should compare player performance to rank benchmarks', () => {
        const mockBenchmarks = {
          rating: 1.0,
          kdRatio: 1.1,
          adr: 75,
          kast: 70,
          headshotPercentage: 30,
        };

        const result = transformer.compareToRank(mockMatches, mockBenchmarks, 'player123');

        expect(result).toMatchObject({
          playerId: 'player123',
          playerStats: expect.any(Object),
          rankBenchmarks: mockBenchmarks,
          gaps: expect.objectContaining({
            rating: expect.any(Number),
            kdRatio: expect.any(Number),
            adr: expect.any(Number),
            kast: expect.any(Number),
            headshotPercentage: expect.any(Number),
          }),
          strengths: expect.any(Array),
          improvementAreas: expect.any(Array),
          estimatedTimeToRank: expect.any(String),
        });
      });

      test('should identify strengths when exceeding benchmarks', () => {
        const mockBenchmarks = {
          rating: 0.8,
          kdRatio: 0.9,
          adr: 60,
          kast: 60,
          headshotPercentage: 25,
        };

        const result = transformer.compareToRank(mockMatches, mockBenchmarks, 'player123');

        expect(result.strengths).toContain('Rating above rank average');
        expect(result.strengths).toContain('K/D ratio competitive');
        expect(result.strengths).toContain('Damage output sufficient');
      });

      test('should estimate realistic time to rank improvement', () => {
        const mockBenchmarks = {
          rating: 1.5,
          kdRatio: 1.8,
          adr: 100,
          kast: 85,
          headshotPercentage: 50,
        };

        const result = transformer.compareToRank(mockMatches, mockBenchmarks, 'player123');

        // With significant gaps, should estimate longer timeframe
        expect(result.estimatedTimeToRank).toMatch(/months/);
      });
    });

    describe('edge cases', () => {
      test('should handle matches with zero deaths', () => {
        const matchWithZeroDeaths = {
          ...mockMatches[0],
          playerStats: {
            ...mockMatches[0].playerStats,
            deaths: 0,
          },
        };

        const result = transformer.processMatches([matchWithZeroDeaths], 'player123');

        // K/D should equal kills when deaths = 0
        expect(result.averageStats.kdRatio).toBe(matchWithZeroDeaths.playerStats.kills);
      });

      test('should handle matches with missing statistics', () => {
        const incompleteMatch = {
          ...mockMatches[0],
          playerStats: {
            steamId: 'player123',
            kills: 10,
            deaths: 8,
            assists: 0,
            adr: 0,
            kast: 0,
            rating: 0,
            headshots: 0,
            headshotPercentage: 0,
            mvps: 0,
          },
        };

        const result = transformer.processMatches([incompleteMatch], 'player123');

        expect(result.averageStats).toMatchObject({
          rating: 0,
          kdRatio: 1.25, // 10/8
          adr: 0,
          kast: 0,
          headshotPercentage: 0,
          gamesPlayed: 1,
        });
      });

      test('should handle matches with invalid dates', () => {
        const matchesWithInvalidDates = [
          {
            ...mockMatches[0],
            date: 'invalid-date-string',
          },
          {
            ...mockMatches[1],
            date: '',
          },
          {
            ...mockMatches[2],
            date: null as any,
          },
        ];

        const result = transformer.processMatches(matchesWithInvalidDates, 'player123');

        // Should not throw "Invalid time value" error and provide fallback
        expect(result.timeRange).toBe('Unknown time range (invalid dates)');
        expect(result.averageStats.gamesPlayed).toBe(3);
      });

      test('should handle mixed valid and invalid dates', () => {
        const mixedDateMatches = [
          {
            ...mockMatches[0],
            date: '2024-08-15T10:00:00Z', // Valid
          },
          {
            ...mockMatches[1],
            date: 'invalid-date', // Invalid
          },
          {
            ...mockMatches[2],
            date: '2024-08-13T20:15:00Z', // Valid
          },
        ];

        const result = transformer.processMatches(mixedDateMatches, 'player123');

        // Should process all matches and show time range for valid dates only
        expect(result.timeRange).toMatch(/2024-08-13 to 2024-08-15/);
        expect(result.averageStats.gamesPlayed).toBe(3);
      });
    });

    // --- Enhanced Analysis Tests ---
    describe('generateEnhancedAnalysis', () => {
      test('should return minimal analysis if insufficient data', async () => {
        const result = await transformer.generateEnhancedAnalysis([], 'player123');
        expect(result.performanceStateAnalysis.currentState.classification).toBe('baseline_normal');
        expect(result.predictiveWarningSystem.immediateAlerts[0].alertType).toBe('insufficient_data');
        expect(result.warnings?.length).toBeGreaterThan(0);
      });

      test('should return enhanced analysis with sufficient data', async () => {
        // Mock 12 matches with extended fields for enhanced analysis
        const extendedMatches = Array.from({ length: 12 }, (_, i) => ({
          ...mockMatches[0],
          gameId: `match${i}`,
          date: `2024-08-${10 + i}T10:00:00Z`,
          playerStats: {
            ...mockMatches[0].playerStats,
            rating: 1.1 + 0.01 * i,
            kdRatio: 1.2 + 0.01 * i,
            adr: 80 + i,
            kast: 70 + i,
            headshotPercentage: 30 + i,
          },
          rawPlayerStats: makeRawPlayerStats({
            preaim: 5 + i,
            reaction_time: 500 + 2 * i,
            spray_accuracy: 60 + i,
            adr: 80 + i,
            kast: 70 + i,
            rating: 1.1 + 0.01 * i,
            headshotPercentage: 30 + i,
          }),
        }));
        const result = await transformer.generateEnhancedAnalysis(extendedMatches, 'player123');
        expect(result.performanceStateAnalysis.currentState).toHaveProperty('classification');
        expect(result.metricCorrelationAnalysis.primaryPerformanceDrivers).toBeInstanceOf(Array);
        expect(result.predictiveWarningSystem.immediateAlerts).toBeInstanceOf(Array);
        expect(Array.isArray(result.warnings)).toBe(true);
      });

      test('should add warning if >50% extended metrics are missing', async () => {
        // 2 matches with all extended fields present, 10 with all fields missing (0)
        const matches = [
          ...Array.from({ length: 2 }, (_, i) => ({
            ...mockMatches[0],
            gameId: `match${i}`,
            date: `2024-08-${10 + i}T10:00:00Z`,
            rawPlayerStats: makeRawPlayerStats({
              preaim: 5 + i,
              reaction_time: 500 + 2 * i,
              spray_accuracy: 60 + i,
            }),
          })),
          ...Array.from({ length: 10 }, (_, i) => ({
            ...mockMatches[0],
            gameId: `match${i + 2}`,
            date: `2024-08-${12 + i}T10:00:00Z`,
            rawPlayerStats: makeRawPlayerStats({
              preaim: 0,
              reaction_time: 0,
              spray_accuracy: 0,
            }),
          })),
        ];
        const result = await transformer.generateEnhancedAnalysis(matches, 'player123');
        expect(Array.isArray(result.warnings)).toBe(true);
        expect(result.warnings && result.warnings.some(w => w.includes('missing extended metrics'))).toBe(true);
      });

      test('should handle errors gracefully and return minimal analysis', async () => {
        // Patch getOrCalculateBaseline to throw
        const orig = transformer["getOrCalculateBaseline"];
        transformer["getOrCalculateBaseline"] = async () => { throw new Error('Test error'); };
        const matches = Array.from({ length: 10 }, (_, i) => ({
          ...mockMatches[0],
          gameId: `match${i}`,
          date: `2024-08-${10 + i}T10:00:00Z`,
          rawPlayerStats: makeRawPlayerStats({
            preaim: 5 + i,
            reaction_time: 500 + 2 * i,
            spray_accuracy: 60 + i,
            adr: 80 + i,
            kast: 70 + i,
            rating: 1.1 + 0.01 * i,
            headshotPercentage: 30 + i,
          }),
        }));
        const result = await transformer.generateEnhancedAnalysis(matches, 'player123');
        expect(result.performanceStateAnalysis.currentState.classification).toBe('baseline_normal');
        expect(Array.isArray(result.warnings)).toBe(true);
        expect(result.warnings && result.warnings.some(w => w.includes('Enhanced analysis error'))).toBe(true);
        transformer["getOrCalculateBaseline"] = orig;
      });
    });
  });
});