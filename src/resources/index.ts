import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { registerStaticResources } from './static.js';
import { registerSectionResources } from './sections.js';

export function registerResources(server: McpServer): void {
  registerStaticResources(server);
  registerSectionResources(server);
}
