import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { registerRouteTool } from './route.js';
import { registerSelectTool } from './select.js';
import { registerRunTool } from './run.js';
import { registerApplyTool } from './apply.js';
import { registerGenerateTool } from './generate.js';

export function registerTools(server: McpServer): void {
  registerRouteTool(server);
  registerSelectTool(server);
  registerRunTool(server);
  registerApplyTool(server);
  registerGenerateTool(server);
}
