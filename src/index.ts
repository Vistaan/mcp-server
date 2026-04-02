import { fileURLToPath } from 'url';
import { startStdioTransport } from './transports/stdio.js';
import { startHttpTransport } from './transports/http.js';

const transport = process.env['MCP_TRANSPORT'] ?? 'stdio';
const port = parseInt(process.env['MCP_PORT'] ?? '3000', 10);

async function main(): Promise<void> {
  if (transport === 'http') {
    await startHttpTransport(port);
  } else {
    await startStdioTransport();
  }
}

export function isDirectExecution(moduleUrl: string, entryPath = process.argv[1]): boolean {
  return Boolean(entryPath) && fileURLToPath(moduleUrl) === entryPath;
}

if (isDirectExecution(import.meta.url)) {
  main().catch((error: unknown) => {
    process.stderr.write(
      JSON.stringify({ level: 'error', msg: 'Failed to start MCP server', error: String(error) }) + '\n',
    );
    process.exit(1);
  });
}
