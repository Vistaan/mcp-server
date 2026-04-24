# Architecture Overview

## What This Is

`workflow-os-mcp` is a Model Context Protocol (MCP) server that wraps eleven authoritative workflow Markdown files as runtime-accessible resources, prompts, and tools. It does not contain its own intelligence — it exposes the v1 workflow files so any MCP client (Claude Desktop, API clients) can route tasks through a structured execution framework.

## Core Design Principle

```
Source of Truth: /workflows/*.md (11 domain files + 1 dispatcher + 1 design reference)
         ↓
MCP Layer: Resources + Prompts + Tools
         ↓
Client: Claude Desktop / any MCP-compatible consumer
```

The server wraps; it does not replace. The Markdown files remain authoritative.

## Operating Discipline (Enforced by Every Tool)

```
1. Route first          → determine mode + domain
2. Run one workflow     → primary domain only
3. Optimize at most once → one utility pass if needed
4. End with one action  → one immediate next step
```

## Transport Layer

The server supports two transports selected by `MCP_TRANSPORT`:

| Transport         | Use Case                                 | Entry Point               |
| ----------------- | ---------------------------------------- | ------------------------- |
| `stdio` (default) | Claude Desktop, local development        | `src/transports/stdio.ts` |
| `http`            | Docker, Kubernetes, always-on deployment | `src/transports/http.ts`  |

HTTP transport uses `StreamableHTTPServerTransport` (stateless per-request) — no sticky sessions required.

## Module Map

```
src/
├── index.ts                  ← entry point: selects transport by MCP_TRANSPORT env var
├── server.ts                 ← createServer() factory: wires resources + prompts + tools
├── logger.ts                 ← structured JSON logger → process.stderr (stdout is reserved for JSON-RPC)
│
├── transports/
│   ├── stdio.ts              ← StdioServerTransport wrapper + graceful shutdown
│   └── http.ts               ← Express + StreamableHTTPServerTransport + /health endpoint
│
├── schemas/
│   ├── types.ts              ← TypeScript types: Mode, Domain, RouteResult, ToolEnvelope
│   └── tools.ts              ← Zod input/output schemas for all 5 tools
│
├── core/
│   ├── catalog.ts            ← Static data: DOMAIN_FILES, DOMAIN_SEQUENCES, STATIC_RESOURCES, etc.
│   ├── router.ts             ← Routing logic: inferDomain(), inferMode(), routeTask()
│   ├── normalizer.ts         ← String/sequence utilities: normalizeStage(), buildAppliedSequence()
│   └── output.ts             ← Response shaping: toToolResult(), buildPromptText(), makeNextAction()
│
├── resources/
│   ├── loader.ts             ← File I/O: readWorkflowFile(), extractMarkdownSection()
│   ├── static.ts             ← Registers 8 static workflow:// URIs
│   ├── sections.ts           ← Registers dynamic subsection ResourceTemplate
│   └── index.ts              ← registerResources(server)
│
├── prompts/
│   ├── mode.ts               ← 6 mode prompts (clarify_task → review_optimize)
│   ├── domain.ts             ← 6 domain prompts (run_*_workflow)
│   ├── frontdoor.ts          ← route_and_run (master router prompt)
│   └── index.ts              ← registerPrompts(server)
│
└── tools/
    ├── route.ts              ← route_task tool
    ├── select.ts             ← select_domain_workflow tool
    ├── run.ts                ← run_workflow_sequence tool (main workhorse)
    ├── apply.ts              ← apply_utility_prompt tool
    ├── generate.ts           ← generate_next_action tool
    └── index.ts              ← registerTools(server)
```

## Data Flow: Tool Call (route → run)

```
Client sends: route_task { task: "...", preferred_mode: "auto", preferred_domain: "auto" }
                ↓
src/tools/route.ts
  → routeTask() in src/core/router.ts
    → inferDomain(text) — regex keyword matching
    → inferMode(text, domain) — keyword pattern matching
    → DOMAIN_SEQUENCES[domain] — from catalog.ts
  ← RouteResult { mode, domain, confidence, sequence, utilityCandidates }
  → toToolResult() wraps as { content, structuredContent }
                ↓
Client sends: run_workflow_sequence { mode, domain, task, stage: "auto" }
                ↓
src/tools/run.ts
  → buildAppliedSequence(domain, stage, fallback)
  → normalizeStage(domain, stage)
  → DOMAIN_URI_MAP[domain] — resolves resource reference
  → makeNextAction(domain, task, constraints)
  ← main_deliverable (with sequence + resource URI reference)
  ← next_action
```

## Resource URI Scheme

```
workflow://os/v1                    ← full WORKFLOW_OS_v1.md
workflow://freelancing/v1           ← full WORKFLOW_FREELANCING_v1.md
workflow://products/v1              ← ...
workflow://content/v1
workflow://execution/v1
workflow://investing/v1
workflow://utility/v1
workflow://execute-referencing/v1   ← dispatcher/orchestration policy

workflow://{domain}/v1/execution/input         ← subsection
workflow://{domain}/v1/execution/sequence      ← subsection
workflow://{domain}/v1/output/response-shape   ← subsection
```

## The 6 Modes × 11 Domains Grid

|            | os  | freelancing | products | content | execution | investing | utility | pentest-web | pentest-mobile | pentest-api | pentest-infra |
| ---------- | --- | ----------- | -------- | ------- | --------- | --------- | ------- | ----------- | -------------- | ----------- | ------------- |
| clarify    | ✓   | ✓           | ✓        | ✓       | ✓         | ✓         | ✓       | ✓           | ✓              | ✓           | ✓             |
| strategy   | ✓   | ✓           | ✓        | ✓       | ✓         | ✓         | ✓       | ✓           | ✓              | ✓           | ✓             |
| build      | ✓   | ✓           | ✓        | ✓       | ✓         | ✓         | ✓       | ✓           | ✓              | ✓           | ✓             |
| persuasion | ✓   | ✓           | ✓        | ✓       | ✓         | ✓         | ✓       | ✓           | ✓              | ✓           | ✓             |
| execution  | ✓   | ✓           | ✓        | ✓       | ✓         | ✓         | ✓       | ✓           | ✓              | ✓           | ✓             |
| review     | ✓   | ✓           | ✓        | ✓       | ✓         | ✓         | ✓       | ✓           | ✓              | ✓           | ✓             |
