# Generic MCP Client Configuration

Use this guide for any client that can launch an MCP server over `stdio` by providing:

- a command
- command arguments
- optional environment variables

That generic pattern is the same for:

- Codex app
- Codex VS Code extension
- Claude Code VS Code extension
- Claude web
- ChatGPT web
- Kimi web
- Kimi Code VS Code extension
- Kimi Claw
- Open Claw

The exact UI, JSON field names, and file location may differ by client, but the server contract is the same.

## Build First

```bash
pnpm install
pnpm run build
```

## Generic Stdio Configuration

Most MCP-capable clients need the equivalent of:

```json
{
  "mcpServers": {
    "workflow-os": {
      "command": "node",
      "args": ["/absolute/path/to/mcp-server/dist/index.js"]
    }
  }
}
```

If the client exposes form fields instead of raw JSON, map them like this:

- server name: `workflow-os`
- transport: `stdio`
- command: `node`
- args: `/absolute/path/to/mcp-server/dist/index.js`
- env: optional

## Optional Environment Variables

You usually do not need any environment variables because the bundled workflow files are included in the repo.

If your client allows custom environment variables, these are supported:

- `WORKFLOW_ROOT`
- `MCP_TRANSPORT`
- `MCP_PORT`

`MCP_PORT` is configurable. The app currently defaults to `3000` only if you do not provide a value.

Typical override example:

```json
{
  "mcpServers": {
    "workflow-os": {
      "command": "node",
      "args": ["/absolute/path/to/mcp-server/dist/index.js"],
      "env": {
        "WORKFLOW_ROOT": "/absolute/path/to/custom/workflows"
      }
    }
  }
}
```

## When To Use HTTP Instead

Use HTTP only if a client explicitly asks for an MCP endpoint URL instead of launching a local command.

Start the server:

```bash
MCP_TRANSPORT=http MCP_PORT=<port> node dist/index.js
# Example: MCP_TRANSPORT=http MCP_PORT=3000 node dist/index.js
```

Then provide the client with:

- base URL: `http://localhost:<port>`
- MCP endpoint: `http://localhost:<port>/mcp`
- liveness check: `http://localhost:<port>/livez`
- readiness check: `http://localhost:<port>/readyz`
- legacy health check: `http://localhost:<port>/health`

## Verify The Integration

After adding the server to a client:

1. Restart or refresh the client
2. Open a new session or workspace
3. Confirm the tools appear:
   - `route_task`
   - `select_domain_workflow`
   - `run_workflow_sequence`
   - `apply_utility_prompt`
   - `generate_next_action`
4. Confirm the resources appear:
   - `workflow://os/v4`
   - `workflow://freelancing/v4`
   - `workflow://products/v4`
   - `workflow://content/v4`
   - `workflow://execution/v4`
   - `workflow://investing/v4`
   - `workflow://utility/v4`
   - `workflow://execute-referencing/v4`
   - `workflow://design-reference/v4`

## Recommended Usage Pattern

For most clients, the best flow is:

1. Call `route_task`
2. Optionally inspect a workflow resource
3. Call `run_workflow_sequence`
4. Optionally call `apply_utility_prompt` once
5. End with the returned `next_action`

## Troubleshooting

If the server does not start:

- confirm `dist/index.js` exists
- run `pnpm run build`
- confirm the configured path is absolute
- confirm the client is allowed to launch local commands

If the client expects HTTP instead of `stdio`:

- run the server with `MCP_TRANSPORT=http`
- provide `http://localhost:<your-configured-port>/mcp`

If the wrong workflow files are being used:

- set `WORKFLOW_ROOT` explicitly

If you need logs:

- this server writes structured JSON logs to `stderr`
- set `LOG_LEVEL=debug` for verbose troubleshooting output
- many MCP clients expose these logs in a developer console, logs panel, or extension output pane
