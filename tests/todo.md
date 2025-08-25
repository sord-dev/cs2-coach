# TODO: Test Coverage Improvements

This file lists files and areas to target for increased test coverage, based on the latest coverage report.

## Integration Tests:

- [ ] End-to-End MCP Tool Flow
	- Simulate an MCP request (e.g., coaching or analysis) and assert that the response includes expected fields and values.
	- Example:
		```typescript
		// In tests/integration/full-system.test.ts
		import request from 'supertest';
		import { createPlayerProfile, createAnalysis } from '../test-data';
		// ...
		it('should return a valid coaching response', async () => {
			const res = await request(server)
				.post('/mcp/coaching')
				.send({ playerProfile: createPlayerProfile(), analysis: createAnalysis() });
			expect(res.status).toBe(200);
			expect(res.body).toHaveProperty('summary');
			expect(res.body).toHaveProperty('recommendations');
		});
		```

- [x] Leetify API Integration
	- Mock/fake the Leetify API response, trigger a handler, and assert that player profile and match data are correctly parsed and passed downstream.
	- Example:
		```typescript
		// Use nock or msw to mock Leetify API
		// Assert handler receives and transforms data as expected
		```

- [x] Ollama Model Integration
	- Simulate a handler call that triggers an Ollama prompt, mock the Ollama model response, and assert prompt construction and AI response parsing.
	- ✅ **COMPLETED**: Fixed mocking approach and now properly tests Ollama prompt construction and response parsing.

- [x] Baseline Calculation Pipeline
	- Feed a sequence of matches through the baseline calculation flow, then request a baseline via the handler, and assert correct baseline is returned and cached.
	- ✅ **COMPLETED**: Comprehensive test suite covering baseline calculation, caching, map-specific baselines, deviation detection, and edge cases.

- [ ] Error Propagation and Handling
	- Simulate failures at each integration point and assert errors are handled gracefully and surfaced in the MCP response.
	- Example:
		```typescript
		// Mock Leetify/Ollama to throw errors
		// Assert MCP response includes error info
		```

- [ ] Data Consistency Across Services
	- Trigger a full analysis and assert that the same player/match data is passed consistently from handler → transformer → AI prompt → response.
	- Example:
		```typescript
		// Spy on service calls, assert data shape integrity
		```

- [ ] MCP Compliance
	- Send a variety of valid and invalid MCP requests and assert that the server responds according to the MCP spec.
	- Example:
		```typescript
		// Send invalid payloads, assert error codes/schema validation
		```


## Unit Tests:

### Handlers
- [x] areaAnalysisHandler.ts (handlers/areaAnalysisHandler.ts)
- [x] improvementHandler.ts (handlers/improvementHandler.ts)
- [x] coachingHandler.ts (handlers/coachingHandler.ts) — lines 31-40,106-115,126-131,139-166,196-202,209-211
- [x] enhancedAnalysisHandler.ts (handlers/enhancedAnalysisHandler.ts) — lines 36,111,136-176
- [x] rankComparisonHandler.ts (handlers/rankComparisonHandler.ts) — lines 21, 25

### Services
- [x] correlation-analyzer.ts (services/analysis/correlation-analyzer.ts) — lines 105,200,207-209,252-254,560-561,595-598,652,664
- [x] metrics.ts (services/analysis/metrics.ts) — lines 110-114
- [x] baseline-calculator.ts (services/baseline/baseline-calculator.ts) — lines 94-110,163-224,254-255,277-311,392
- [x] baseline-storage.ts (services/baseline/baseline-storage.ts) — lines 41,68,86-171,196
- [x] data-transformer/index.ts (services/data-transformer/index.ts) — lines 269,275-276,282-290,317-320,394-399,407,452,469-759
- [x] leetify/index.ts (services/leetify/index.ts) — lines 42-76,95,117,130-184,232-233,257,295,306
- [x] ollama/index.ts (services/ollama/index.ts) — lines 57-61,78-122,202-259,292
- [x] prompts.ts (services/ollama/prompts.ts) — lines 14-19,21-32,41

### Utils
- [x] helpers.ts (utils/helpers.ts) — lines 89-92

---
For each file, add or expand tests to cover:
- Uncovered lines/branches (see coverage report)
- Edge cases and error handling
- All major code paths

Check off each item as coverage improves.
