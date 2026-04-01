# Local Setup

## Prerequisites

- Node.js 20.6+
- pnpm 10+

## Install

```bash
git clone <repo-url>
cd mcp-server
pnpm install
```

## Build

```bash
make build
# or: pnpm run build
```

## Run (stdio mode — for Claude Desktop)

```bash
node dist/index.js
# MCP_TRANSPORT defaults to "stdio"
```

## Run (HTTP mode — for local testing of Docker/K8s behavior)

```bash
MCP_TRANSPORT=http MCP_PORT=3000 node dist/index.js
# Server starts on http://localhost:3000
# Health check: http://localhost:3000/health
# MCP endpoint: http://localhost:3000/mcp
```

## Test

```bash
make test             # run all tests
make test-coverage    # with coverage report
```

## Workflow Files

The 8 v4 Markdown workflow files are **bundled** in `workflows/`. They are automatically found by the server. No environment variables needed for local development.

To use custom/external workflow files:
```bash
WORKFLOW_ROOT=/your/custom/path node dist/index.js
```

## Environment Variables

| Variable | Default | Description |
|---|---|---|
| `MCP_TRANSPORT` | `stdio` | `stdio` or `http` |
| `MCP_PORT` | `3000` | HTTP server port (ignored in stdio mode) |
| `WORKFLOW_ROOT` | `<project>/workflows` | Path to workflow markdown files |
