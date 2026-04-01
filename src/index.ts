import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { createServer } from './server.js';
import { log } from './logger.js';

async function main(): Promise<void> {
  const server = createServer();
  const transport = new StdioServerTransport();
  await server.connect(transport);
  log.info('workflow-os MCP server running on stdio');

  // Graceful shutdown when the MCP client disconnects
  process.stdin.on('close', () => {
    log.info('workflow-os: stdin closed, shutting down');
    void server.close();
  });

  // Graceful shutdown on SIGTERM (e.g. process manager, container orchestration)
  process.on('SIGTERM', () => {
    log.info('workflow-os: SIGTERM received, shutting down');
    void server.close().then(() => process.exit(0));
  });
}

main().catch((error: unknown) => {
  // Use process.stderr.write directly — logger may not be initialised at crash time
  process.stderr.write(
    JSON.stringify({ level: 'error', msg: 'Failed to start MCP server', error: String(error) }) + '\n',
  );
  process.exit(1);
});
