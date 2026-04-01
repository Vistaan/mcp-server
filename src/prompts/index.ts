import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { registerModePrompts } from './mode.js';
import { registerDomainPrompts } from './domain.js';
import { registerFrontdoorPrompt } from './frontdoor.js';

export function registerPrompts(server: McpServer): void {
  registerModePrompts(server);
  registerDomainPrompts(server);
  registerFrontdoorPrompt(server);
}
