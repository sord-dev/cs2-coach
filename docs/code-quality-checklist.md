# CODE QUALITY CHECKLIST

## 1. Architecture & Separation of Concerns
- [x] Handlers only validate input, orchestrate services, and format responses—no business logic leaks.
- [x] Services contain all business logic, no direct API/HTTP or file system calls unless absolutely necessary.
- [x] Utils are pure, stateless, and shared—never domain-aware.

## 2. Type Safety & Validation
- [x] All input is validated with zod schemas in types.
- [x] Types are always inferred from zod schemas (`z.infer<typeof Schema>`), never duplicated.
- [ ] No “any” or “unknown” types in business logic—ever.

## 3. Testing
- [x] Every new feature has unit and integration tests (see tests).
- [x] External APIs (Leetify, Ollama) are mocked in tests—no real calls.
- [x] Test coverage is >90% and covers edge/failure cases, not just happy paths.
- [x] Tests are fast, isolated, and deterministic.

## 4. Error Handling
- [x] All errors are caught and returned in a consistent, structured format.
- [x] No leaking of stack traces or internal details to clients.
- [x] No silent failures—every error is logged or surfaced appropriately.

## 5. Rate Limiting & Caching
- [x] Leetify API calls are rate-limited with a robust queue/backoff, not just setTimeout hacks.
- [x] Responses from Leetify are cached and cache invalidation is handled correctly.
- [x] No redundant API calls for the same data.

## 6. Environment & Configuration
- [x] All config is loaded from .env and validated at startup (zod or similar).
- [x] No secrets or sensitive data committed to git.
- [x] App fails fast if required config is missing or malformed.

## 7. Documentation
- [x] `README.md` and PLANNING.md are current, accurate, and free of TODO/WIP lies.
- [x] All public functions and modules have JSDoc comments explaining non-obvious logic.
- [x] Major changes are documented as they happen.

## 8. AI Prompt Engineering
- [x] All prompts are stored in versioned files, not hardcoded.
- [x] Prompt changes are tested to ensure output format stability.

## 9. File Size & Structure
- [x] No file exceeds 500 lines—split by responsibility, not just line count.
- [x] Each file has a single, clear purpose.

## 10. Security
- [x] No user input is ever trusted—always validated and sanitized.
- [x] No sensitive data is logged or exposed.
- [x] Dependencies are up to date and free of known vulnerabilities.