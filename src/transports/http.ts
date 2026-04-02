import express from 'express';
import { existsSync } from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import type { Request, Response } from 'express';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import * as swaggerUi from 'swagger-ui-express';
import type { Transport } from '@modelcontextprotocol/sdk/shared/transport.js';
import { createOpenApiSpec } from '../openapi/spec.js';
import { createServer } from '../server.js';
import { log } from '../logger.js';

function resolveLandingPagePath(): string {
  const currentDir = path.dirname(fileURLToPath(import.meta.url));
  const primaryCandidate = path.resolve(currentDir, '..', '..', 'landing-page');
  const candidates = [
    primaryCandidate,
    path.resolve(currentDir, '..', '..', '..', 'landing-page'),
    path.resolve(process.cwd(), 'landing-page'),
  ];

  for (const candidate of candidates) {
    if (existsSync(path.join(candidate, 'index.html'))) {
      return candidate;
    }
  }

  return primaryCandidate;
}

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
export function createHttpApp(): express.Express {
  const app = express();
  const landingPagePath = resolveLandingPagePath();

  app.use(express.static(landingPagePath));

  // Root index route for enterprise landing page
  app.get('/', (_req: Request, res: Response) => {
    res.sendFile(path.join(landingPagePath, 'index.html'));
  });

  app.use(express.json({ limit: '10mb' }));
  app.get('/docs-api.json', (req: Request, res: Response) => {
    const host = req.get('host');
    const serverUrl = host ? `${req.protocol}://${host}` : '/';
    res.json(createOpenApiSpec(serverUrl));
  });
  app.use(
    '/docs',
    ...swaggerUi.serve,
    swaggerUi.setup(undefined, {
      explorer: true,
      swaggerOptions: {
        url: '/docs-api.json',
      },
    }),
  );

  // ── Health check ─────────────────────────────────────────────────────────────
  app.get('/health', (_req: Request, res: Response) => {
    res.json({ status: 'ok', service: 'workflow-os-mcp', transport: 'http' });
  });

  // ── MCP handler (POST + GET + DELETE) ─────────────────────────────────────────
  async function handleMcp(req: Request, res: Response): Promise<void> {
    try {
      const transport = new StreamableHTTPServerTransport();
      const server = createServer();

      // The SDK transport is runtime-compatible with `Transport`, but its current
      // declarations do not satisfy `exactOptionalPropertyTypes` cleanly.
      await server.connect(transport as unknown as Transport);
      await transport.handleRequest(req, res, req.body as Record<string, unknown> | undefined);
      void server.close();
    } catch (error) {
      log.error('HTTP MCP handler error', { error: String(error) });
      if (!res.headersSent) {
        res.status(500).json({ error: 'Internal server error' });
      }
    }
  }

  app.post('/mcp', (req, res) => {
    void handleMcp(req, res);
  });
  app.get('/mcp', (req, res) => {
    void handleMcp(req, res);
  });
  app.delete('/mcp', (req, res) => {
    void handleMcp(req, res);
  });

  return app;
}

export async function startHttpTransport(port: number): Promise<void> {
  const app = createHttpApp();

  await new Promise<void>((resolve) => {
    app.listen(port, () => {
      log.info(`workflow-os MCP server running on HTTP port ${String(port)}`);
      resolve();
    });
  });
}
