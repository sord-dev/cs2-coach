
# Copilot Instructions for cs2-coach-mcp-server

## Project Overview & Architecture
- **Purpose:** Local AI-powered Counter-Strike 2 coaching assistant, implemented as an MCP (Model Context Protocol) server.
- **Core Flow:** Fetches player stats from Leetify API → transforms/analyzes data → generates coaching advice using local Ollama models → responds via MCP tools.
- **Major Components:**
  - `src/server.ts`: Main MCP server (wires up handlers, no business logic)
  - `src/handlers/`: One handler per MCP tool (input validation, orchestration, response formatting)
  - `src/services/`: Business logic for API, AI, and data transformation (no orchestration)
  - `src/types/`: All zod schemas and type definitions (centralized)
  - `src/utils/`: Shared helpers (cache, math, etc.)
  - `modelfiles/`: Ollama model definitions
  - `PRPs/examples/`: Example data, API usage, and test flows

## Essential Developer Workflows
- **Install:** `npm install`
- **Build:** `npm run build`
- **Dev Mode:** `npm run dev`
- **Start:** `npm start`
- **Test:**
  - Unit: `npm test`
  - Integration: `npm run test:integration`
  - MCP compliance: `npm run test:mcp-compliance`
  - Ollama health: `npm run test:ollama-health`
- **Typecheck:** `npm run typecheck`
- **Lint:** `npm run lint`

## Project-Specific Conventions
- **TypeScript-first.**
- **Data validation:** Use `zod` schemas for all tool input validation (see `src/types/`).
- **Testing:**
  - Use Jest. Place tests in `tests/` mirroring `src/` structure.
  - Cover expected, edge, and failure cases for all new logic.
- **Environment:**
  - Use `.env` for config (see `.env.example`). Ollama and Leetify endpoints are required.
- **File Size:** Keep files <500 lines; refactor if needed.
- **Documentation:**
  - Update `README.md` and `PLANNING.md` for major changes.
  - Add/mark tasks in `TASK.md` as you work.
- **Style:**
  - Use Prettier and ESLint. JSDoc for all functions.
  - Comment non-obvious logic, especially data flows and AI prompt construction.

## Integration & Data Flow Patterns
- **MCP Tools:** Each tool is a server endpoint with clear input/output contracts (see README for parameters).
- **Leetify API:** All requests are rate-limited (1 req/sec). See `src/services/leetify-client.ts`.
- **Ollama:** Models must be created locally before use. See `modelfiles/` and `README.md` for setup.
- **Prompt Engineering:** Prompt templates and model files live in `PRPs/examples/ollama-integration/`.

## AI Agent Guidance
- **Always check `PLANNING.md` and `TASK.md` before major changes.**
- **Never invent new tools or endpoints; use only those defined in code/docs.**
- **If context is missing, ask for clarification.**
- **Preserve modularity and separation of concerns.**
- **Reference example scripts in `PRPs/examples/` for usage patterns.**

## Example: Adding a New MCP Tool
1. Define input schema with `zod` in `src/types/`.
2. Create a handler in `src/handlers/` for orchestration, validation, and response formatting.
3. Add/extend business logic in a service in `src/services/` if needed.
4. Add/extend tests in `tests/` for the handler, service, and utils as appropriate.
5. Document the new tool in `README.md` and update this file if conventions change.

---
For more, see `README.md`, `CLAUDE.md`, and `PRPs/examples/README.md`.
