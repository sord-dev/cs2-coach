### 🔄 Project Awareness & Context
 **Always read `PLANNING.md`** at the start of a new conversation to understand the project's architecture, goals, style, and constraints.
 **Check `TASK.md`** before starting a new task. If the task isn’t listed, add it with a brief description and today's date.
 **Use consistent naming conventions, file structure, and architecture patterns** as described in `PLANNING.md`.
 **Use the correct Node.js version and package manager** (e.g., `npm`, `yarn`, or `pnpm`) as specified in the project.

### 🧱 Code Structure & Modularity
  
 **Never create a file longer than 500 lines of code.** If a file approaches this limit, refactor by splitting it into modules or helper files.
 **Organize code into clearly separated modules**, grouped by feature or responsibility.
  For agents this looks like:
    - `agent.ts` - Main agent definition and execution logic
    - `tools.ts` - Tool functions used by the agent
    - `prompts.ts` - System prompts
 **Use clear, consistent imports** (prefer relative imports within packages).
 **Use environment variables** via `dotenv` and load them at the entry point.

### 🧪 Testing & Reliability
  - Include at least:
    - 1 test for expected use
    - 1 edge case
    - 1 failure case
 **Always create Jest unit tests for new features** (functions, classes, routes, etc).
 **After updating any logic**, check whether existing unit tests need to be updated. If so, do it.
 **Tests should live in a `/tests` folder** mirroring the main app structure.
  - Include at least:
    - 1 test for expected use
    - 1 edge case
    - 1 failure case

### ✅ Task Completion
 **Mark completed tasks in `TASK.md`** immediately after finishing them.
 **Add new sub-tasks or TODOs discovered during development to `TASK.md` under a “Discovered During Work” section.**

### 📎 Style & Conventions

 **Use TypeScript** as the primary language.
 **Follow the official TypeScript style guide**, use `eslint` and format with `prettier`.
 **Use `zod` or `io-ts` for data validation**.
 Use `Express` or `Fastify` for APIs and `TypeORM` or `Prisma` for ORM if applicable.
 Write **JSDoc comments for every function** using the following style:
  ```typescript
  /**
   * Brief summary.
   *
   * @param param1 - Description.
   * @returns Description.
   */
  function example(param1: string): string {
    // ...
  }
  ```

### 📚 Documentation & Explainability
 **Update `README.md`** when new features are added, dependencies change, or setup steps are modified.
 **Comment non-obvious code** and ensure everything is understandable to a mid-level developer.
 **Always Keep Documentation Up-to-Date** always add progress to the TASK.md and README.md for later reference
 When writing complex logic, **add an inline `// Reason:` comment** explaining the why, not just the what.

### 🧠 AI Behavior Rules
 **Never assume missing context. Ask questions if uncertain.**
 **Never hallucinate libraries or functions** – only use known, verified TypeScript/JavaScript packages.
 **Always confirm file paths and module names** exist before referencing them in code or tests.
 **Never delete or overwrite existing code** unless explicitly instructed to or if part of a task from `TASK.md`.