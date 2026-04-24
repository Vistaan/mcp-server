# Using the Online MCP Server

This guide covers using the hosted instance of `workflow-os-mcp` at `mcp.vistaan.com` instead of running your own local server.

## Overview

The online version provides the same MCP capabilities without local installation. Access the server via HTTP at:

- **Base URL:** `https://mcp.vistaan.com`
- **MCP Endpoint:** `https://mcp.vistaan.com/mcp`
- **Health Check:** `https://mcp.vistaan.com/health`
- **Interactive Docs:** `https://mcp.vistaan.com/docs`
- **OpenAPI Spec:** `https://mcp.vistaan.com/docs-api.json`

## When to Use the Online Version

Use the online MCP server when:

- You want to start immediately without installation
- Your client supports HTTP MCP connections
- You don't need to customize workflow files
- You want automatic updates and zero maintenance
- Local resource constraints prevent running the server

## When to Use Local/Offline

Run your own instance when:

- Your client only supports stdio transport
- You need custom workflow files
- You require network isolation
- You want full control over the environment

## Connecting to the Online Server

### HTTP Mode Clients

For clients that support HTTP MCP endpoints, configure:

```json
{
  "mcpServers": {
    "workflow-os": {
      "transport": "http",
      "url": "https://mcp.vistaan.com/mcp"
    }
  }
}
```

The exact configuration format varies by client. Some clients may call this:

- "Remote MCP"
- "HTTP MCP"
- "Server URL"
- "Endpoint"

### Available Resources

The online server exposes the same bundled workflow resources:

- `workflow://os/v1`
- `workflow://freelancing/v1`
- `workflow://products/v1`
- `workflow://content/v1`
- `workflow://execution/v1`
- `workflow://investing/v1`
- `workflow://utility/v1`
- `workflow://execute-referencing/v1`
- `workflow://design-reference/v1`

### Available Tools

All standard tools work identically to the local version:

- `route_task`
- `select_domain_workflow`
- `run_workflow_sequence`
- `apply_utility_prompt`
- `generate_next_action`

## Rate Limits and Usage

The online service may impose:

- Rate limits on requests
- Session timeouts for long-running connections
- Limits on concurrent connections

For high-volume or production use, consider running your own instance.

## API Endpoints

| Endpoint         | Method | Description                  |
| ---------------- | ------ | ---------------------------- |
| `/mcp`           | POST   | MCP JSON-RPC messages        |
| `/mcp`           | GET    | MCP SSE stream (best-effort) |
| `/docs`          | GET    | Interactive Swagger UI       |
| `/docs-api.json` | GET    | OpenAPI specification        |
| `/health`        | GET    | Health status                |
| `/livez`         | GET    | Liveness probe               |
| `/readyz`        | GET    | Readiness probe              |

## Example: Testing the Connection

```bash
# Check health
curl https://mcp.vistaan.com/health

# View OpenAPI spec
curl https://mcp.vistaan.com/docs-api.json

# Interactive docs (open in browser)
open https://mcp.vistaan.com/docs
```

## Privacy Considerations

When using the online MCP server:

- Task content is sent to the server for processing
- Workflow content is served from the server's bundled files
- No persistent storage of your requests

For sensitive workflows, running a local instance is recommended.

## Troubleshooting

**Connection refused:**

- Verify the URL is `https://mcp.vistaan.com/mcp`
- Check that your client supports HTTP transport

**Timeout errors:**

- Large or complex workflows may hit timeout limits
- Try breaking tasks into smaller chunks

**Client not compatible:**

- Some clients only support stdio transport
- These require running the server locally

## Switching Between Online and Local

Your MCP client configuration determines which server is used. To switch:

1. **To online:** Change server URL to `https://mcp.vistaan.com/mcp`
2. **To local:** Change to local stdio command or `http://localhost:3000/mcp`

The tools, resources, and workflow behavior are identical in both modes.
