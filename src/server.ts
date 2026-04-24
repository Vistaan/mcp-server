import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { registerResources } from './resources/index.js';
import { registerPrompts } from './prompts/index.js';
import { registerTools } from './tools/index.js';

const SERVER_NAME = 'workflow-os';
const SERVER_VERSION = '1.0.0';

const SERVER_INSTRUCTIONS = [
  'Treat the seven v1 workflow files as the source of truth.',
  'Route first, run one main workflow, use utility prompts only in a supporting role,',
  'optimize at most once, and end with one immediate next action.',
].join(' ');

export function createServer(): McpServer {
  const server = new McpServer(
    { name: SERVER_NAME, version: SERVER_VERSION },
    {
      instructions: SERVER_INSTRUCTIONS,
      capabilities: { logging: {} },
    },
  );

  registerResources(server);
  registerPrompts(server);
  registerTools(server);

  return server;
}
