import express from 'express';
import type { Request, Response } from 'express';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { createServer } from '../server.js';
import { log } from '../logger.js';

/**
 * Starts the MCP server on a Streamable HTTP transport.
 *
 * Each request gets its own stateless transport+server pair — no sticky sessions
 * required, works cleanly with multi-replica Kubernetes deployments.
 *
 * Endpoints:
 *   POST /mcp        — MCP JSON-RPC messages
 *   GET  /mcp        — MCP SSE stream
 *   DELETE /mcp      — Session teardown (no-op in stateless mode)
 *   GET  /health     — Liveness/readiness probe for K8s
 */
export async function startHttpTransport(port: number): Promise<void> {
  const app = express();
  app.use(express.json({ limit: '10mb' }));

  // ── Health check ─────────────────────────────────────────────────────────────
  app.get('/health', (_req: Request, res: Response) => {
    res.json({ status: 'ok', service: 'workflow-os-mcp', transport: 'http' });
  });

  // ── MCP handler (POST + GET + DELETE) ─────────────────────────────────────────
  async function handleMcp(req: Request, res: Response): Promise<void> {
    try {
      const transport = new StreamableHTTPServerTransport({
        sessionIdGenerator: undefined, // stateless — no session affinity needed
      });
      const server = createServer();
      await server.connect(transport);
      await transport.handleRequest(req, res, req.body as Record<string, unknown> | undefined);
      void server.close();
    } catch (error) {
      log.error('HTTP MCP handler error', { error: String(error) });
      if (!res.headersSent) {
        res.status(500).json({ error: 'Internal server error' });
      }
    }
  }

  app.post('/mcp', (req, res) => { void handleMcp(req, res); });
  app.get('/mcp', (req, res) => { void handleMcp(req, res); });
  app.delete('/mcp', (req, res) => { void handleMcp(req, res); });

  await new Promise<void>((resolve) => {
    app.listen(port, () => {
      log.info(`workflow-os MCP server running on HTTP port ${String(port)}`);
      resolve();
    });
  });
}
