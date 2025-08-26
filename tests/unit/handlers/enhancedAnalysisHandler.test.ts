import { EnhancedAnalysisHandler } from '../../../src/handlers/enhancedAnalysisHandler';
import { mockMatchHistory, mockPlayerProfile } from '../../test-data';

describe('EnhancedAnalysisHandler', () => {
    beforeEach(() => {
        jest.resetAllMocks();
    });
    let leetifyClient: any;
    let ollamaService: any;
    let dataTransformer: any;
    let handler: EnhancedAnalysisHandler;

    beforeEach(() => {
        leetifyClient = {
            getPlayerProfile: jest.fn().mockResolvedValue(mockPlayerProfile()),
            getMatchHistory: jest.fn().mockResolvedValue(mockMatchHistory().matches),
        };

        dataTransformer = {
            setAdaptiveThresholds: jest.fn(),
            processMatches: jest.fn().mockReturnValue({
                playerId: 'player1',
                timeRange: 'recent',
                averageStats: {
                    rating: 1.15,
                    kdRatio: 1.2,
                    adr: 80,
                    kast: 0.7,
                    headshotPercentage: 0.4,
                    gamesPlayed: 10,
                },
                recentPerformance: [],
                strengths: ['aim'],
                weaknesses: ['utility'],
                trends: [],
            }),
            generateEnhancedAnalysis: jest.fn().mockResolvedValue({
                performanceStateAnalysis: {
                    currentState: {
                        classification: 'flow_state',
                        confidence: 0.9,
                        evidence: ['good aim'],
                        baselineDeviation: { rating: '+0.1' },
                    },
                    detectedPatterns: {
                        tiltIndicators: {
                            active: false,
                            severity: 'low',
                            triggersDetected: [],
                            prediction: '',
                        },
                        flowStateIndicators: {
                            lastOccurrence: '2025-07-01',
                            triggers: ['multi-kill'],
                            performanceBoost: '+10%',
                            frequency: 'rare',
                        },
                    },
                },
                metricCorrelationAnalysis: {
                    primaryPerformanceDrivers: [],
                    surprisingFindings: [],
                },
                predictiveWarningSystem: {
                    immediateAlerts: [],
                },
            }),
        };
        ollamaService = {
            enhancedAnalysis: jest.fn().mockResolvedValue({ ai: 'enhanced', recommendations: ['Train Y'] }),
        };
        handler = new EnhancedAnalysisHandler(leetifyClient, ollamaService, dataTransformer);
    });

    it('returns enhanced analysis and skips AI if skipAI is true', async () => {
        const args = {
            playerId: 'player1',
            matchCount: 5,
            skipAI: true,
        };
        const result = await handler.handleEnhancedAnalysis(args);
        expect(result.content[0].type).toBe('text');
        const parsed = JSON.parse(result.content[0].text);
        expect(parsed.response.enhancedAnalysis).toEqual({
            performanceStateAnalysis: {
                currentState: {
                    classification: 'flow_state',
                    confidence: 0.9,
                    evidence: ['good aim'],
                    baselineDeviation: { rating: '+0.1' },
                },
                detectedPatterns: {
                    tiltIndicators: {
                        active: false,
                        severity: 'low',
                        triggersDetected: [],
                        prediction: '',
                    },
                    flowStateIndicators: {
                        lastOccurrence: '2025-07-01',
                        triggers: ['multi-kill'],
                        performanceBoost: '+10%',
                        frequency: 'rare',
                    },
                },
            },
            metricCorrelationAnalysis: {
                primaryPerformanceDrivers: [],
                surprisingFindings: [],
            },
            predictiveWarningSystem: {
                immediateAlerts: [],
            },
        });
        expect(parsed.response.playerProfile).toBeDefined();
        expect(parsed.response.metadata).toBeDefined();
        expect(parsed.response.metadata.analysisType).toBe('enhanced_statistical');
    });

    it('calls ollamaService if skipAI is false', async () => {
        ollamaService.analyzeEnhancedData = jest.fn().mockResolvedValue({ ai: 'enhanced', recommendations: ['Train Y'] });
        handler = new EnhancedAnalysisHandler(leetifyClient, ollamaService, dataTransformer);
        const args = {
            playerId: 'player1',
            matchCount: 5,
            skipAI: false,
        };
        const result = await handler.handleEnhancedAnalysis(args);
        expect(ollamaService.analyzeEnhancedData).toHaveBeenCalled();
        const parsed = JSON.parse(result.content[0].text);
        expect(parsed.response.ai).toBe('enhanced');
        expect(parsed.response.recommendations).toEqual(['Train Y']);
    });

    it('validates input and throws on invalid', async () => {
        const args = { playerId: 123 }; // playerId should be string
        await expect(handler.handleEnhancedAnalysis(args)).rejects.toThrow();
    });

    it('returns error when insufficient match data', async () => {
        leetifyClient.getMatchHistory.mockResolvedValue([]); // Empty match history

        const args = {
            playerId: 'player1',
            matchCount: 5,
            skipAI: true,
        };

        const result = await handler.handleEnhancedAnalysis(args);
        const parsed = JSON.parse(result.content[0].text);
        expect(parsed.type).toBe('enhanced_analysis_error');
        expect(parsed.error).toBe('Insufficient match data');
    });

    it('filters analysis components correctly for specific components', async () => {
        const args = {
            playerId: 'player1',
            matchCount: 10,
            components: ['tilt_detection', 'correlation_analysis'],
            skipAI: true,
        };

        const result = await handler.handleEnhancedAnalysis(args);
        const parsed = JSON.parse(result.content[0].text);

        // Should only include tilt detection and correlation analysis
        expect(parsed.response.enhancedAnalysis.performanceStateAnalysis.detectedPatterns.tiltIndicators).toBeDefined();
        expect(parsed.response.enhancedAnalysis.metricCorrelationAnalysis).toBeDefined();

        // Should not include flow state indicators (not in components)
        expect(parsed.response.enhancedAnalysis.performanceStateAnalysis.currentState).toBeUndefined();
    });

    it('handles analysis generation errors gracefully', async () => {
        dataTransformer.generateEnhancedAnalysis.mockRejectedValue(new Error('Analysis failed'));

        const args = {
            playerId: 'player1',
            matchCount: 10,
            skipAI: true,
        };

        const result = await handler.handleEnhancedAnalysis(args);
        const parsed = JSON.parse(result.content[0].text);
        expect(parsed.type).toBe('enhanced_analysis_error');
        expect(parsed.error).toBe('Analysis failed');
        expect(parsed.message).toBe('Analysis failed');
    });

    it('sets includeBaseline to false correctly', async () => {
        const args = {
            playerId: 'player1',
            matchCount: 10,
            includeBaseline: false,
            skipAI: true,
        };

        const result = await handler.handleEnhancedAnalysis(args);
        const parsed = JSON.parse(result.content[0].text);

        expect(parsed.response.basicAnalysis).toBeNull();
        expect(dataTransformer.processMatches).not.toHaveBeenCalled();
    });

    it('handles analysis with warnings for data quality assessment', async () => {

        // Avoid circular reference: use plain object, no self-references
        // Always use a new object and a plain array for warnings
        const warningsArr = ['Insufficient data for baseline', 'Low match count'];
        dataTransformer.generateEnhancedAnalysis.mockResolvedValue({
            warnings: [...warningsArr],
            performanceStateAnalysis: {
                currentState: {
                    classification: 'baseline_normal',
                    confidence: 0.6,
                },
            },
        });

        const args = {
            playerId: 'player1',
            matchCount: 10,
            skipAI: true,
        };

        const result = await handler.handleEnhancedAnalysis(args);
        const parsed = JSON.parse(result.content[0].text);

        expect(parsed.response.metadata.dataQuality.score).toBe('moderate');
        // Defensive: check that issues is an array and not a string
        expect(Array.isArray(parsed.response.metadata.dataQuality.issues)).toBe(true);
        expect(parsed.response.metadata.dataQuality.issues).toEqual(warningsArr);
    });


    it('handles data quality: high (no warnings)', async () => {
        dataTransformer.generateEnhancedAnalysis.mockResolvedValue({
            warnings: [],
            performanceStateAnalysis: { currentState: { classification: 'baseline_normal', confidence: 1 } },
        });
        const args = { playerId: 'player1', matchCount: 10, skipAI: true };
        const result = await handler.handleEnhancedAnalysis(args);
        const parsed = JSON.parse(result.content[0].text);
        expect(parsed.response.metadata.dataQuality.score).toBe('high');
        expect(parsed.response.metadata.dataQuality.issues).toEqual([]);
        expect(parsed.response.metadata.dataQuality.reliability).toMatch(/reliable/i);
    });

    it('handles data quality: low (3+ warnings)', async () => {
        dataTransformer.generateEnhancedAnalysis.mockResolvedValue({
            warnings: ['w1', 'w2', 'w3'],
            performanceStateAnalysis: { currentState: { classification: 'baseline_normal', confidence: 0.3 } },
        });
        const args = { playerId: 'player1', matchCount: 10, skipAI: true };
        const result = await handler.handleEnhancedAnalysis(args);
        const parsed = JSON.parse(result.content[0].text);
        expect(parsed.response.metadata.dataQuality.score).toBe('low');
        expect(parsed.response.metadata.dataQuality.issues).toEqual(['w1', 'w2', 'w3']);
        expect(parsed.response.metadata.dataQuality.reliability).toMatch(/caution/i);
    });
});
