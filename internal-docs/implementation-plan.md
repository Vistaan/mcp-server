# Plan: Enterprise-Standard workflow-os MCP Server

## Context

The user has a prompting workflow system consisting of 7 authoritative Markdown workflow files plus a dispatcher file, a 680-line design spec (`server-design.md`), and a 1014-line prototype monolith (`server.ts`) in `/home/cybrotron/Documents/workspace/prompt-engineering/prompting-workflow/mcp/`. The target directory `/home/cybrotron/Documents/workspace/mcp-server/` is empty.

The goal is to build a production-quality, modular, tested MCP server in the target directory — refactoring the prototype into an enterprise project with correct SDK imports, strict TypeScript, tests, linting, and proper project structure.

---

## Critical Pre-Implementation Fixes (vs. prototype)

| Issue | Fix |
|---|---|
| SDK package is `@modelcontextprotocol/server/...` | Correct to `@modelcontextprotocol/sdk/server/...` |
| `ctx.mcpReq.log(...)` in tool handlers — not a real SDK API | Replace with `log.info(...)` writing to `process.stderr` |
| Single 1014-line monolithic file | Split into `src/` modules per `server-design.md` |
| No project scaffold (no `package.json`, `tsconfig.json`) | Add full project setup |
| No tests | Add Vitest unit + integration tests |
| No linting/formatting | Add ESLint + Prettier |

---

## Directory Structure

```
/home/cybrotron/Documents/workspace/mcp-server/
├── package.json                         ← ESM, Node 20+, scripts, deps
├── tsconfig.json                        ← strict, NodeNext, ES2022
├── tsconfig.build.json                  ← extends tsconfig.json, excludes tests
├── vitest.config.ts
├── .eslintrc.cjs
├── .prettierrc.json
├── .env.example                         ← WORKFLOW_ROOT documentation
├── .gitignore
├── claude_desktop_config.example.json   ← copy to ~/.../Claude/claude_desktop_config.json
└── src/
    ├── index.ts                         ← entry point: transport + SIGTERM
    ├── server.ts                        ← createServer() factory
    ├── logger.ts                        ← structured JSON → process.stderr only
    ├── schemas/
    │   ├── types.ts                     ← Mode, Domain, RouteResult, ToolEnvelope, etc.
    │   └── tools.ts                     ← all 10 Zod input/output schemas
    ├── core/
    │   ├── catalog.ts                   ← DOMAIN_FILES, DOMAIN_URI_MAP, DOMAIN_SEQUENCES, SECTION_SEGMENTS, STATIC_RESOURCES
    │   ├── router.ts                    ← routeTask(), inferDomain(), inferMode(), utilityCandidatesForMode()
    │   ├── normalizer.ts                ← normalizeStage(), buildAppliedSequence(), toSentenceCase(), toTitle(), truncate(), escapeRegex()
    │   └── output.ts                   ← toToolResult(), buildPromptText(), makeNextAction(), inferUtilityIssues()
    ├── resources/
    │   ├── index.ts                     ← registerResources(server)
    │   ├── loader.ts                    ← WORKFLOW_ROOT, readWorkflowFile(), extractMarkdownSection()
    │   ├── static.ts                    ← 8 static resources registration loop
    │   └── sections.ts                  ← ResourceTemplate for subsection URIs
    ├── prompts/
    │   ├── index.ts                     ← registerPrompts(server)
    │   ├── mode.ts                      ← 6 mode prompts (clarify_task → review_optimize)
    │   ├── domain.ts                    ← 6 domain prompts (run_*_workflow)
    │   └── frontdoor.ts                 ← route_and_run prompt
    └── tools/
        ├── index.ts                     ← registerTools(server)
        ├── route.ts                     ← route_task
        ├── select.ts                    ← select_domain_workflow
        ├── run.ts                       ← run_workflow_sequence
        ├── apply.ts                     ← apply_utility_prompt
        └── generate.ts                  ← generate_next_action
tests/
    ├── unit/
    │   ├── core/
    │   │   ├── router.test.ts           ← inferDomain, inferMode, routeTask, utilityCandidates
    │   │   ├── normalizer.test.ts       ← normalizeStage, buildAppliedSequence, string utils
    │   │   └── output.test.ts           ← toToolResult, buildPromptText, makeNextAction, inferUtilityIssues
    │   ├── tools/
    │   │   ├── route.test.ts, select.test.ts, run.test.ts, apply.test.ts, generate.test.ts
    │   └── schemas/
    │       └── tools.test.ts            ← schema defaults, required field validation
    └── integration/
        └── server.test.ts               ← createServer() smoke test (no transport spin-up)
```

---

## Key Config Files

### `package.json`
```json
{
  "name": "workflow-os-mcp",
  "version": "1.0.0",
  "type": "module",
  "engines": { "node": ">=20.0.0" },
  "main": "./dist/index.js",
  "scripts": {
    "build": "tsc -p tsconfig.build.json",
    "start": "node --env-file=.env dist/index.js",
    "dev": "node --watch --env-file=.env dist/index.js",
    "typecheck": "tsc --noEmit",
    "lint": "eslint src tests --ext .ts",
    "lint:fix": "eslint src tests --ext .ts --fix",
    "format": "prettier --write \"src/**/*.ts\" \"tests/**/*.ts\"",
    "test": "vitest run",
    "test:watch": "vitest",
    "test:coverage": "vitest run --coverage",
    "clean": "rm -rf dist"
  },
  "dependencies": {
    "@modelcontextprotocol/sdk": "^1.29.0",
    "zod": "^3.25.0"
  },
  "devDependencies": {
    "@types/node": "^20.0.0",
    "@typescript-eslint/eslint-plugin": "^7.0.0",
    "@typescript-eslint/parser": "^7.0.0",
    "@vitest/coverage-v8": "^1.0.0",
    "eslint": "^8.57.0",
    "eslint-config-prettier": "^9.0.0",
    "prettier": "^3.0.0",
    "typescript": "^5.4.0",
    "vitest": "^1.0.0"
  }
}
```

### `tsconfig.json` key settings
- `"module": "NodeNext"`, `"moduleResolution": "NodeNext"` — required for ESM subpath imports
- `"target": "ES2022"`, `"strict": true`, `"noUncheckedIndexedAccess": true`
- `"sourceMap": true`, `"declaration": true`
- All internal imports must use `.js` extension (e.g., `import { x } from './router.js'`)

### `.env.example`
```
WORKFLOW_ROOT=/absolute/path/to/prompt-engineering/prompting-workflow
```

### `claude_desktop_config.example.json`
```json
{
  "mcpServers": {
    "workflow-os": {
      "command": "node",
      "args": ["--env-file=/path/to/mcp-server/.env", "/path/to/mcp-server/dist/index.js"]
    }
  }
}
```
Copy to `~/Library/Application Support/Claude/claude_desktop_config.json` (macOS).

---

## Code Migration Map (prototype → modules)

| Prototype code | → Target file |
|---|---|
| `type Mode`, `Domain`, `RouteResult`, `ResourceDef`, `ToolEnvelope` | `src/schemas/types.ts` |
| All `*InputSchema` / `*OutputSchema` Zod objects | `src/schemas/tools.ts` |
| `DOMAIN_FILES`, `DOMAIN_URI_MAP`, `DOMAIN_SEQUENCES`, `MODE_TO_PROMPT`, `SECTION_SEGMENTS`, `STATIC_RESOURCES` | `src/core/catalog.ts` |
| `routeTask()`, `inferDomain()`, `inferMode()`, `buildRouteReason()`, `utilityCandidatesForMode()` | `src/core/router.ts` |
| `normalizeStage()`, `buildAppliedSequence()`, `toSentenceCase()`, `toTitle()`, `truncate()`, `escapeRegex()` | `src/core/normalizer.ts` |
| `toToolResult()`, `buildPromptText()`, `makeNextAction()`, `inferUtilityIssues()` | `src/core/output.ts` |
| `WORKFLOW_ROOT`, `readWorkflowFile()`, `extractMarkdownSection()` | `src/resources/loader.ts` |
| `registerResources()` static loop | `src/resources/static.ts` |
| `registerResources()` ResourceTemplate block | `src/resources/sections.ts` |
| `promptRegistry` entries 1–6 (mode prompts) | `src/prompts/mode.ts` |
| `promptRegistry` entries 7–12 (domain prompts) | `src/prompts/domain.ts` |
| `promptRegistry` entry 13 (`route_and_run`) | `src/prompts/frontdoor.ts` |
| Each `registerTools()` tool block | `src/tools/{route,select,run,apply,generate}.ts` |
| `createServer()` | `src/server.ts` |
| `main()` | `src/index.ts` |
| `console.error(...)` logging | `src/logger.ts` (writes JSON to `process.stderr`) |

---

## Implementation Notes

1. **No `console.log`** — MCP protocol uses stdout for JSON-RPC. ESLint `no-console` rule enforces this. Only `process.stderr` writes allowed (via `src/logger.ts`).
2. **`completable`** is real in SDK 1.29.0 at `@modelcontextprotocol/sdk/server/completable.js` — import unchanged.
3. **`registerPrompt` argsSchema** — SDK may expect raw shape (`prompt.argsSchema.shape`) vs `ZodObject`. Test during implementation and adjust if TypeScript errors appear.
4. **`ctx.mcpReq.log(...)` removed** — `RequestHandlerExtra` does not have this method. Replace with `log.info(...)`.
5. **`server.close()` returns Promise** — keep `void server.close()` in signal handlers to discard the promise safely.
6. **File-not-found graceful degradation** — `readWorkflowFile` returns error markdown instead of throwing; preserve this behavior.
7. **Workflow files are NOT copied** — they remain at `WORKFLOW_ROOT` (defaults to the prompting-workflow dir). Set `.env` accordingly.
8. **`--env-file` requires Node 20.6+** — document in README.

---

## Verification

1. `pnpm install` — installs all deps
2. `pnpm run build` — `tsc` compiles with 0 errors
3. `pnpm run typecheck` — passes with strict settings
4. `pnpm run lint` — no ESLint errors
5. `pnpm run test` — all unit tests pass; integration smoke test passes
6. `WORKFLOW_ROOT=/path/to/workflows npm run start` — server starts on stdio, logs to stderr
7. Add to Claude Desktop config → verify `route_task` tool, `run_freelancing_workflow` prompt, and `workflow://os/v1` resource all resolve in Claude Desktop
