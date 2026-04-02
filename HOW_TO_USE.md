# How To Use

This app is an MCP server named `workflow-os`.

It helps an MCP client route a request into one of the bundled workflow domains, run a single main workflow, optionally apply one utility pass, and end with one concrete next action.

## What It Does

The server exposes:

- tools for routing and execution
- prompts for common workflow entry points
- resources that expose the bundled workflow markdown files

The intended pattern is:

1. Route the task first
2. Select or inspect the right workflow/resource if needed
3. Run one main workflow
4. Optionally apply one utility prompt
5. Return one immediate next action

## Start The Server

Build first:

```bash
pnpm install
pnpm run build
```

Run in stdio mode:

```bash
node dist/index.js
```

Run in HTTP mode:

```bash
MCP_TRANSPORT=http MCP_PORT=<port> node dist/index.js
# Example: MCP_TRANSPORT=http MCP_PORT=3000 node dist/index.js
```

HTTP endpoints:

- `GET /health`
- `POST /mcp`
- `GET /mcp`
- `DELETE /mcp`

## Environment Variables

| Variable | Default | Meaning |
|---|---|---|
| `MCP_TRANSPORT` | `stdio` | Transport mode: `stdio` or `http` |
| `MCP_PORT` | defaults to `3000` | HTTP port when using HTTP transport |
| `WORKFLOW_ROOT` | `./workflows` bundle | Override workflow markdown source directory |

## Main Tools

### `route_task`

Use this first.

Input:

- `task`
- optional `goal`
- optional `audience`
- optional `constraints`
- optional `preferred_mode`
- optional `preferred_domain`

Output:

- `mode`
- `domain`
- `confidence`
- `reason`
- `sequence`
- `use_utility`
- `utility_candidates`

Example intent:

```text
Route: "Help me validate a digital product idea for busy founders"
```

### `select_domain_workflow`

Use this when you want the workflow resource URI and normalized stage before running.

Input:

- `domain`
- optional `stage`

Output includes:

- `resource_uri`
- `subsection_uri`
- `stage`
- `command_format`
- `response_shape`

### `run_workflow_sequence`

This is the primary execution tool.

Input:

- `mode`
- `domain`
- `task`
- optional `context`
- optional `stage`
- optional `optimize_once`
- optional `next_action_required`

Output includes:

- `main_deliverable`
- `applied_sequence`
- `optimization_applied`
- `next_action`

### `apply_utility_prompt`

Use only after a main workflow has already run.

Available utilities:

- `clarity_rewrite`
- `conversion_rewrite`
- `tone_calibration`
- `structure_rebuild`
- `audience_rewrite`
- `impact_compressor`
- `blind_spot_finder`
- `shortcut_strategy`
- `ultra_leverage`
- `momentum_amplifier`

### `generate_next_action`

Use this when you already have output and need exactly one immediate next step.

## Prompts

The server also exposes prompts for higher-level MCP clients.

Mode prompts:

- `clarify_task`
- `strategize_task`
- `build_output`
- `improve_persuasion`
- `force_execution`
- `review_optimize`

Domain prompts:

- `run_freelancing_workflow`
- `run_products_workflow`
- `run_content_workflow`
- `run_execution_workflow`
- `run_investing_workflow`
- `run_utility_workflow`

Front-door prompt:

- `route_and_run`

## Resources

Full workflow resources:

- `workflow://os/v4`
- `workflow://freelancing/v4`
- `workflow://products/v4`
- `workflow://content/v4`
- `workflow://execution/v4`
- `workflow://investing/v4`
- `workflow://utility/v4`
- `workflow://execute-referencing/v4`

Section resources follow this template:

```text
workflow://{domain}/v4/{sectionGroup}/{sectionName}
```

Examples:

- `workflow://products/v4/execution/sequence`
- `workflow://content/v4/output/response-shape`

## Recommended Client Flow

For most client integrations, use this sequence:

1. Call `route_task`
2. Optionally read `resource_uri` or a section resource
3. Call `run_workflow_sequence`
4. If needed, call `apply_utility_prompt` once
5. Return the final output with the supplied `next_action`

## Client Configuration

For client setup across Codex, Claude, ChatGPT, Kimi, Claw-style clients, and VS Code extensions, use the generic MCP configuration guide:

- [Generic MCP Client Configuration](./docs/mcp-client-configuration.md)

## Notes

- The bundled workflow markdown files are the source of truth.
- The server is designed to run one main workflow per request.
- Utility prompts are supporting tools, not the primary entry point.
- Output should end with one immediate next action.
