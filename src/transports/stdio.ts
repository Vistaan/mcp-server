import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { createServer } from '../server.js';
import { log } from '../logger.js';

/**
 * Starts the MCP server on a stdio transport.
 * Used for local Claude Desktop integration.
 */
export async function startStdioTransport(): Promise<void> {
  const server = createServer();
  const transport = new StdioServerTransport();
  await server.connect(transport);
  log.info('workflow-os MCP server running on stdio');

  process.stdin.on('close', () => {
    log.info('workflow-os: stdin closed, shutting down');
    void server.close();
  });

  process.on('SIGTERM', () => {
    log.info('workflow-os: SIGTERM received, shutting down');
    void server.close().then(() => process.exit(0));
  });
}
