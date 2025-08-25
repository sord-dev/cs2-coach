// Analysis and enhanced analysis types
export interface PlayerAnalysis {
  playerId: string;
  timeRange: string;
  averageStats: ProcessedStats;
  recentPerformance: ProcessedStats[];
  strengths: string[];
  weaknesses: string[];
  trends: PerformanceTrend[];
}

export interface ProcessedStats {
  rating: number;
  kdRatio: number;
  adr: number;
  kast: number;
  headshotPercentage: number;
  gamesPlayed: number;
}

export interface ExtendedProcessedStats extends ProcessedStats {
  personalBaseline: PersonalBaseline;
  deviationFromBaseline: number;
  confidenceLevel: 'low' | 'medium' | 'high';
  preaim: number;
  reactionTime: number;
  sprayAccuracy: number;
  utilityEfficiency: number;
  sessionPosition: number;
  timeOfDay: string;
  mapSpecificPerformance: number;
}

export interface PersonalBaseline {
  value: number;
  confidenceInterval: [number, number];
  sampleSize: number;
  lastUpdated: string;
  variance: number;
}

export interface TiltAnalysis {
  active: boolean;
  severity: 'low' | 'moderate' | 'high';
  triggers: string[];
  cascadeLength: number;
  recoveryPrediction: string;
  recommendedAction: string;
}

export interface PerformanceState {
  classification: 'mechanical_inconsistency' | 'tilt_cascade' | 'flow_state' | 'baseline_normal';
  confidence: number;
  evidence: string[];
  baselineDeviation: Record<string, string>;
}

export interface CorrelationResult {
  coefficient: number;
  pValue: number;
  significance: 'low' | 'moderate' | 'high';
  sampleSize: number;
  confidenceInterval: [number, number];
}

export interface PerformanceDriver {
  metric: string;
  correlationToRating: number;
  significance: 'low' | 'moderate' | 'high';
  insight: string;
  threshold: string;
}

export interface SurprisingFinding {
  finding: string;
  explanation: string;
  recommendation: string;
}

export interface PredictiveAlert {
  alertType: string;
  severity: 'low' | 'moderate' | 'high';
  evidence: string;
  prediction: string;
  recommendedAction: string;
}

export interface EnhancedAnalysisResult {
  performanceStateAnalysis: {
    currentState: PerformanceState;
    detectedPatterns: {
      tiltIndicators: {
        active: boolean;
        severity: 'low' | 'moderate' | 'high';
        triggersDetected: string[];
        prediction: string;
      };
      flowStateIndicators: {
        lastOccurrence: string;
        triggers: string[];
        performanceBoost: string;
        frequency: string;
      };
    };
  };
  metricCorrelationAnalysis: {
    primaryPerformanceDrivers: PerformanceDriver[];
    surprisingFindings: SurprisingFinding[];
  };
  predictiveWarningSystem: {
    immediateAlerts: PredictiveAlert[];
  };
  warnings?: string[];
}

export interface PerformanceTrend {
  metric: string;
  trend: 'improving' | 'declining' | 'stable';
  changePercentage: number;
  description: string;
}
