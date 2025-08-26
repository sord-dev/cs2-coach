
# Migration Progress (as of August 2025)

- ✅ All generic helpers/constants are now in `utils.ts`.
- ✅ `common/` and `data-transformer/` have been removed; logic is under `analysis/` or `utils.ts`.
- ✅ Imports have been updated throughout the codebase.
- ✅ No more thin wrappers or unnecessary re-exports; each domain has a clear entry point.
- ✅ `analysis/` now contains all metrics, classifiers, baselines, and pattern detection logic.
- ✅ `leetify/` and `ollama/` are cleanly separated and re-export from their own `index.ts`.
- ✅ No `common/`, `baseline/`, or `data-transformer/` folders remain.
- 🟢 Ongoing: Continue to refactor/merge files if any domain exceeds 400-500 lines, and keep this doc up to date.

# Services Directory Structure

## Philosophy
- **Group by domain, not by vague responsibility.**
- **Keep it flat until it hurts:** Only create subfolders when a domain grows large enough to justify it (2-3+ files, >200 lines).
- **No 'common/' or 'data-transformer/' folders:** All generic helpers/constants go in `utils.ts`.
- **Minimize indirection:** Avoid thin wrappers and unnecessary re-exports.
- **Each domain has a single entry point (`index.ts`) if split.**

## Current Structure

```
services/

  analysis/           # All analysis and baseline logic (metrics, classifiers, baselines, etc.)
  archive/            # (Temporary) Archive for old/empty files
  detection/          # Tilt and state detection
  leetify/            # Leetify API client and stat helpers (all helpers/types re-exported from index.ts)
  ollama/             # Ollama AI integration (all helpers/types re-exported from index.ts)
  utils.ts            # Shared helpers/constants for all services

# Removed: baseline/, common/, data-transformer/ (all logic now under analysis/ or utils.ts)

# Removed: common/, data-transformer/ (obsolete/empty per refactor)
```

## When to Split
- If a file exceeds ~400-500 lines, split by subdomain (e.g., `analysis/metrics.ts`, `analysis/baseline.ts`).
- Use an `index.ts` to re-export the public API for the domain.

## Migration Notes
- All constants and generic helpers are now in `utils.ts`.
- `common/` and `data-transformer/` have been removed.
- Imports have been updated throughout the codebase.

## Refactoring Rules
- Don’t create a new folder just because you can.
- If you need a map to find your own code, you’ve already failed.
- Refactor mercilessly. Future-you will thank you.
