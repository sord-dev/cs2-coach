
# Analysis Methodology

This document describes the enhanced analysis features of the CS2 Coach system. Each section explains not just how the analysis works, but what actionable insights and value it provides to players and coaches.

## Personal Baseline System

**What this provides:**
Establishes a personalized performance benchmark for each player, adapting over time. This enables accurate tracking of improvement, early detection of slumps, and context-aware feedback. Map-specific and quality scoring ensure the analysis is both relevant and reliable for your play history.

- **Rolling averages:**
	Exponential weighted moving average with configurable decay factor (default: 0.95).
  
	_Example:_
	```ts
	const weightedAverage = this.calculateExponentialAverage(ratings, decayFactor);
	// ...
	private calculateExponentialAverage(values: number[], decayFactor: number): number {
		// ...
	}
	```
	[View in code](../src/services/analysis/baseline.ts#L54-L61)

- **Confidence intervals:**
	Statistical confidence intervals using t-distribution for small samples, normal distribution for large samples.
  
	_Example:_
	```ts
	// src/services/analysis/baseline.ts#L121-L151
	getConfidenceInterval(baseline: number, variance: number, sampleSize: number): [number, number] {
		// ...
	}
	```
	[View in code](../src/services/analysis/baseline.ts#L121-L151)

- **Map-specific baselines:**
	Dedicated baselines for maps with ≥15 matches.
  
	_Example:_
	```ts
	// src/services/analysis/baseline.ts#L181-L211
	calculateMapSpecificBaseline(matches: ExtendedMatchData[], mapName: string, playerId: string): PersonalBaseline | null {
		// ...
	}
	```
	[View in code](../src/services/analysis/baseline.ts#L181-L211)

- **Quality assessment:**
	Reliability scoring based on sample size (minimum 20 matches, preferred 50+).
  
	_Example:_
	```ts
	// src/services/analysis/baseline.ts#L241-L281
	evaluateBaselineQuality(baseline: PersonalBaseline): { reliability: string; confidence: number; recommendations: string[] } {
		// ...
	}
	```
	[View in code](../src/services/analysis/baseline.ts#L241-L281)

## Tilt Detection Engine

**What this provides:**
Detects early signs of performance decline ("tilt") using research-backed thresholds and multiple indicators. Offers actionable alerts, severity classification, and recovery advice, helping players break negative streaks and regain optimal performance faster.

- **Research-validated thresholds:**
	Reaction time >650ms, preaim degradation >15% from baseline.
  
	_Example:_
	```ts
	// src/services/analysis/tilt-detector.ts#L181-L221
	private checkReactionTimeIndicator(matches: ExtendedMatchData[]): TiltIndicator | null {
		// ...
	}
	private checkPreaimIndicator(matches: ExtendedMatchData[]): TiltIndicator | null {
		// ...
	}
	```
	[View in code](../src/services/analysis/tilt-detector.ts#L181-L221)

- **Multi-factor analysis:**
	Mechanical, psychological, and consistency indicators.
  
	_Example:_
	```ts
	// src/services/analysis/tilt-detector.ts#L121-L181
	private detectTiltIndicators(matches: ExtendedMatchData[], baseline: PersonalBaseline): TiltIndicator[] {
		// ...
	}
	```
	[View in code](../src/services/analysis/tilt-detector.ts#L121-L181)

- **Cascade detection:**
	3+ consecutive matches below baseline with recovery prediction.
  
	_Example:_
	```ts
	// src/services/analysis/tilt-detector.ts#L221-L261
	private checkRatingCascade(matches: ExtendedMatchData[], baseline: PersonalBaseline): TiltIndicator | null {
		// ...
	}
	```
	[View in code](../src/services/analysis/tilt-detector.ts#L221-L261)

- **Severity classification:**
	Low/moderate/high with evidence-based reasoning.
  
	_Example:_
	```ts
	// src/services/analysis/tilt-detector.ts#L61-L101
	calculateTiltSeverity(indicators: TiltIndicator[]): "low" | "moderate" | "high" {
		// ...
	}
	```
	[View in code](../src/services/analysis/tilt-detector.ts#L61-L101)

- **Recovery insights:**
	67% natural recovery rate, 78% break effectiveness (15+ minutes).
  
	_Example:_
	```ts
	// src/services/analysis/tilt-detector.ts#L361-L401
	private generateRecoveryPrediction(indicators: TiltIndicator[], cascadeLength: number): string {
		// ...
	}
	```
	[View in code](../src/services/analysis/tilt-detector.ts#L361-L401)

## Performance State Classification

**What this provides:**
Classifies your current performance state (e.g., flow, inconsistency, tilt, normal) using a combination of mechanical and statistical signals. This enables targeted coaching, highlights strengths, and pinpoints areas for improvement in real time.

- **Flow state:**
	<6.0° preaim, <600ms reaction time, +8% rating boost indicators.
  
	_Example:_
	```ts
	// src/services/utils.ts#L25-L34
	flow_state: {
		preaim_threshold: 6.0,
		reactionTime_threshold: 0.6,
		ratingBoost: 0.08,
		consistencyBonus: 0.15,
		utilityEfficiencyThreshold: 0.7
	}
	```
	[View in code](../src/services/utils.ts#L25-L34)

- **Mechanical inconsistency:**
	>30% reaction time variance, >10° preaim range.
  
	_Example:_
	```ts
	// src/services/utils.ts#L12-L18
	mechanical_inconsistency: {
		reactionTimeVariance: 0.3,
		preaim_instability: 10.0,
		accuracyFluctuation: 0.25,
		ratingVariance: 0.25
	}
	```
	[View in code](../src/services/utils.ts#L12-L18)

- **Tilt cascade:**
	Consecutive decline patterns with acceleration analysis.
  
	_Example:_
	```ts
	// src/services/utils.ts#L19-L25
	tilt_cascade: {
		consecutiveDeclines: 3,
		ratingDropPercentage: 0.2,
		cascadeAcceleration: 0.15,
		recoveryFailures: 2
	}
	```
	[View in code](../src/services/utils.ts#L19-L25)

- **Baseline normal:**
	Stable performance within ±10% statistical bounds.
  
	_Example:_
	```ts
	// src/services/utils.ts#L35-L39
	baseline_normal: {
		ratingDeviationRange: 0.1,
		consistencyThreshold: 0.2,
		mechanicalStability: 0.15
	}
	```
	[View in code](../src/services/utils.ts#L35-L39)

## Correlation Analysis

**What this provides:**
Identifies relationships between different aspects of your gameplay (e.g., how utility usage correlates with win rate), surfacing hidden strengths and weaknesses for more focused improvement.

_**Note:**_ Correlation and statistical analysis code is implemented in the analysis service layer and may be distributed across multiple files. For details, see the [src/services/analysis](../src/services/analysis/) directory.

## Pattern Recognition

**What this provides:**
Detects recurring patterns and clusters in your performance data, enabling the system to spot habits, playstyles, or issues that may not be obvious from raw stats alone.

_**Note:**_ Pattern recognition and clustering logic is implemented in the analysis and utils service layers. See [src/services/analysis](../src/services/analysis/) and [src/services/utils.ts](../src/services/utils.ts) for details.
