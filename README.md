# workflow-os-mcp

MCP server for the `workflow-os` prompt and execution system.

## Quick Start

Install and build:

```bash
pnpm install
pnpm run build
```

Run locally:

```bash
node dist/index.js
```

Run in HTTP mode:

```bash
MCP_TRANSPORT=http MCP_PORT=3000 node dist/index.js
```

## Docs

- [How To Use](./HOW_TO_USE.md)
- [Local Setup](./docs/setup.md)
- [Claude Desktop Integration](./docs/claude-desktop.md)

## Quality Checks

```bash
pnpm run typecheck
pnpm run lint
pnpm run test:coverage
pnpm run build
```
