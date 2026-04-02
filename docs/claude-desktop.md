# Claude Desktop Integration

For the generic MCP setup pattern used across multiple clients, see:

- [Generic MCP Client Configuration](./mcp-client-configuration.md)

## Build First

```bash
make build
```

## Configure Claude Desktop

Edit (or create) the Claude Desktop config file:

- **macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Windows**: `%APPDATA%\Claude\claude_desktop_config.json`

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

No environment variables are required — workflow files are bundled.

## Verify

1. Restart Claude Desktop
2. Open a new conversation
3. Check that the following appear in the tool list:
   - `route_task`
   - `run_workflow_sequence`
   - `select_domain_workflow`
   - `apply_utility_prompt`
   - `generate_next_action`
4. Check that the following resources are available:
   - `workflow://os/v4`
   - `workflow://freelancing/v4`
   - `workflow://products/v4`
   - `workflow://content/v4`
   - `workflow://execution/v4`
   - `workflow://investing/v4`
   - `workflow://utility/v4`

## Troubleshooting

**Server not starting**: Check the `dist/` directory exists — run `make build` first.

**Wrong workflow files**: The server defaults to the bundled `workflows/` directory. To override:
```json
{
  "mcpServers": {
    "workflow-os": {
      "command": "node",
      "args": ["/path/to/mcp-server/dist/index.js"],
      "env": {
        "WORKFLOW_ROOT": "/path/to/your/custom/workflows"
      }
    }
  }
}
```

**Logs**: The server writes structured JSON to stderr. Claude Desktop captures these in its logs.
