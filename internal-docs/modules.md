# Module Reference

Per-module walkthrough of the `src/` tree.

---

## `src/schemas/types.ts`

Pure TypeScript types. No imports except other type files. Safe to import from anywhere.

| Export            | Description                                                                                                                                                                   |
| ----------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Mode`            | Union: `'clarify' \| 'strategy' \| 'build' \| 'persuasion' \| 'execution' \| 'review'`                                                                                        |
| `Domain`          | Union: `'os' \| 'freelancing' \| 'products' \| 'content' \| 'execution' \| 'investing' \| 'utility' \| 'pentest-web' \| 'pentest-mobile' \| 'pentest-api' \| 'pentest-infra'` |
| `RouteDomain`     | `Domain \| 'auto'`                                                                                                                                                            |
| `RouteResult`     | Full routing result shape                                                                                                                                                     |
| `ResourceDef`     | MCP resource registration descriptor                                                                                                                                          |
| `SectionSegment`  | Heading → key → titleSuffix mapping for subsection URIs                                                                                                                       |
| `ToolEnvelope<T>` | Wraps any T into `{ content: [{type:'text', text}], structuredContent: T }`                                                                                                   |

---

## `src/schemas/tools.ts`

All Zod schemas for tool inputs and outputs. Imports `zod` only.

| Schema pair                                                            | Tool                     |
| ---------------------------------------------------------------------- | ------------------------ |
| `routeTaskInputSchema` / `routeTaskOutputSchema`                       | `route_task`             |
| `selectDomainWorkflowInputSchema` / `selectDomainWorkflowOutputSchema` | `select_domain_workflow` |
| `runWorkflowSequenceInputSchema` / `runWorkflowSequenceOutputSchema`   | `run_workflow_sequence`  |
| `applyUtilityPromptInputSchema` / `applyUtilityPromptOutputSchema`     | `apply_utility_prompt`   |
| `generateNextActionInputSchema` / `generateNextActionOutputSchema`     | `generate_next_action`   |

---

## `src/core/catalog.ts`

Static registry. No logic. All data used by routing, resources, and prompts lives here.

| Export             | Contents                                             |
| ------------------ | ---------------------------------------------------- |
| `DOMAIN_FILES`     | Filename for each domain                             |
| `DOMAIN_URI_MAP`   | `workflow://` URI for each domain                    |
| `DOMAIN_SEQUENCES` | Ordered stage arrays per domain                      |
| `MODE_TO_PROMPT`   | Mode → prompt name mapping                           |
| `SECTION_SEGMENTS` | Heading → key pairs for subsection resource template |
| `STATIC_RESOURCES` | `ResourceDef[]` for all 13 static resources          |

---

## `src/core/router.ts`

Pure routing logic. No I/O. No SDK imports. Fully unit-testable in isolation.

| Export                                 | Purpose                                   |
| -------------------------------------- | ----------------------------------------- |
| `routeTask(input)`                     | Main entry: returns full `RouteResult`    |
| `inferDomain(text)`                    | Keyword regex → Domain                    |
| `inferMode(text, domain)`              | Keyword regex → Mode                      |
| `buildRouteReason(mode, domain, text)` | Human-readable routing explanation        |
| `utilityCandidatesForMode(mode)`       | Suggested utilities after primary routing |

---

## `src/core/normalizer.ts`

String and sequence utilities. No I/O. No SDK imports.

| Export                                          | Purpose                                                            |
| ----------------------------------------------- | ------------------------------------------------------------------ |
| `normalizeStage(domain, stage?)`                | Validates stage against domain sequence; returns 'auto' if invalid |
| `buildAppliedSequence(domain, stage, fallback)` | Returns sequence slice from given stage                            |
| `toSentenceCase(value)`                         | `snake_case` → `Sentence case`                                     |
| `toTitle(value)`                                | `snake-case` or `snake_case` → `Title Case`                        |
| `truncate(value, maxLength)`                    | Appends `…` if over limit                                          |
| `escapeRegex(value)`                            | Escapes regex special characters                                   |

---

## `src/core/output.ts`

Response shaping. Imports `normalizer.ts` only.

| Export                                               | Purpose                                                  |
| ---------------------------------------------------- | -------------------------------------------------------- |
| `toToolResult<T>(output)`                            | Wraps output in MCP `ToolEnvelope<T>`                    |
| `buildPromptText(mode, domain, task, meta?)`         | Builds formatted prompt string with OS discipline suffix |
| `makeNextAction(domain, currentOutput, constraints)` | Returns domain-specific one-line next action             |
| `inferUtilityIssues(utilityName, content)`           | Detects common quality issues in content                 |

---

## `src/resources/loader.ts`

File I/O boundary. The only module that reads from disk.

| Export                                      | Purpose                                                                 |
| ------------------------------------------- | ----------------------------------------------------------------------- |
| `WORKFLOW_ROOT`                             | Defaults to bundled `workflows/`. Override via `WORKFLOW_ROOT` env var. |
| `readWorkflowFile(fileName)`                | Reads file, returns error markdown string (not throw) on missing file   |
| `extractMarkdownSection(markdown, heading)` | Regex-based section extraction by heading                               |

---

## `src/resources/static.ts`

Registers 13 static resources via `server.registerResource()`. Calls `readWorkflowFile` in each handler.

## `src/resources/sections.ts`

Registers one `ResourceTemplate` for subsection URIs (`workflow://{domain}/v1/{group}/{name}`). Calls `extractMarkdownSection` to serve specific sections.

---

## `src/prompts/mode.ts`

6 operating-mode prompts. Each uses `buildPromptText()` to format the prompt message.

| Prompt               | Mode       |
| -------------------- | ---------- |
| `clarify_task`       | clarify    |
| `strategize_task`    | strategy   |
| `build_output`       | build      |
| `improve_persuasion` | persuasion |
| `force_execution`    | execution  |
| `review_optimize`    | review     |

## `src/prompts/domain.ts`

6 domain workflow prompts. Each uses `completable()` for stage argument completion.

| Prompt                     | Domain      |
| -------------------------- | ----------- |
| `run_freelancing_workflow` | freelancing |
| `run_products_workflow`    | products    |
| `run_content_workflow`     | content     |
| `run_execution_workflow`   | execution   |
| `run_investing_workflow`   | investing   |
| `run_utility_workflow`     | utility     |

## `src/prompts/frontdoor.ts`

`route_and_run` — the master front-door prompt. Routes and runs in one call.

---

## `src/tools/route.ts` — `route_task`

Classifies task into mode + domain + sequence. Call first.

Input: `{ task, goal?, audience?, constraints?, preferred_mode?, preferred_domain? }`
Output: `{ mode, domain, confidence, reason, sequence, use_utility, utility_candidates }`

## `src/tools/select.ts` — `select_domain_workflow`

Resolves which resource URI and stage to use.

Input: `{ domain, stage? }`
Output: `{ resource_uri, subsection_uri?, stage, command_format, response_shape }`

## `src/tools/run.ts` — `run_workflow_sequence`

Main workhorse. Builds the full execution context and next action.

Input: `{ mode, domain, task, context?, stage?, optimize_once?, next_action_required? }`
Output: `{ mode, domain, main_deliverable, applied_sequence, optimization_applied, next_action }`

## `src/tools/apply.ts` — `apply_utility_prompt`

Applies one supporting utility. Always subordinate — never a primary entry point.

Input: `{ utility_name, content, context? }`
Output: `{ utility_name, revised_content, issues_found }`

## `src/tools/generate.ts` — `generate_next_action`

Returns one immediate next step.

Input: `{ domain?, current_output, constraints? }`
Output: `{ next_action, why_this_next }`

---

## `src/logger.ts`

Writes structured JSON to `process.stderr`. Never uses `console.log` (stdout is reserved for JSON-RPC).

```typescript
log.info('message', { key: 'value' });
// → stderr: {"level":"info","ts":"...","msg":"message","key":"value"}
```

## `src/transports/stdio.ts`

Wraps `StdioServerTransport`. Handles stdin close + SIGTERM for graceful shutdown.

## `src/transports/http.ts`

Wraps `StreamableHTTPServerTransport` via Express. Stateless per-request (no session affinity). Exposes `/health` for K8s probes and `/mcp` for POST/GET/DELETE.

## `src/server.ts`

`createServer()` — assembles all layers. Returns a configured `McpServer`.

## `src/index.ts`

Entry point. Reads `MCP_TRANSPORT` + `MCP_PORT` env vars and delegates to the right transport.
