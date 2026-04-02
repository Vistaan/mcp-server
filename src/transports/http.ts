import express from 'express';
import { existsSync } from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import type { Request, Response } from 'express';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import * as swaggerUi from 'swagger-ui-express';
import type { Transport } from '@modelcontextprotocol/sdk/shared/transport.js';
import { createOpenApiSpec } from '../openapi/spec.js';
import { WorkflowResourceError } from '../resources/errors.js';
import { assertWorkflowReadiness, getWorkflowReadiness } from '../resources/loader.js';
import { createServer } from '../server.js';
import { log } from '../logger.js';

const DEFAULT_MCP_REQUEST_TIMEOUT_MS = 30_000;

type ClassifiedHttpError = {
  kind: 'workflow_unavailable' | 'request_aborted' | 'request_timeout' | 'internal';
  statusCode: number;
};

type RequestLifecycle = {
  signal: AbortSignal;
  wasAborted(): boolean;
  reason(): string | undefined;
  cleanup(): void;
};

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
  assertWorkflowReadiness();

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
    const readiness = getWorkflowReadiness();
    res.status(readiness.status === 'ok' ? 200 : 503).json({
      status: readiness.status,
      service: 'workflow-os-mcp',
      transport: 'http',
      workflow_root: readiness.workflowRoot,
      missing_workflows: readiness.missingFiles,
      checked_at: readiness.checkedAt,
    });
  });

  // ── MCP handler (POST + GET + DELETE) ─────────────────────────────────────────
  async function handleMcp(req: Request, res: Response): Promise<void> {
    const lifecycle = createRequestLifecycle(req, res);
    let server: ReturnType<typeof createServer> | undefined;

    try {
      const transport = new StreamableHTTPServerTransport();
      server = createServer();

      // The SDK transport is runtime-compatible with `Transport`, but its current
      // declarations do not satisfy `exactOptionalPropertyTypes` cleanly.
      throwIfRequestAborted(lifecycle);
      await server.connect(transport as unknown as Transport);
      throwIfRequestAborted(lifecycle);
      await transport.handleRequest(req, res, req.body as Record<string, unknown> | undefined);
    } catch (error) {
      const classified = classifyHttpError(error, lifecycle);
      log.error('HTTP MCP handler error', {
        error: String(error),
        kind: classified.kind,
        statusCode: classified.statusCode,
        aborted: lifecycle.wasAborted(),
        abortReason: lifecycle.reason(),
      });
      if (!res.headersSent && !lifecycle.wasAborted()) {
        res.status(classified.statusCode).json({
          error: classified.kind === 'workflow_unavailable' ? 'Workflow resources unavailable' : 'Internal server error',
        });
      }
    } finally {
      lifecycle.cleanup();
      if (server) {
        try {
          await server.close();
        } catch (error) {
          log.error('HTTP MCP cleanup error', { error: String(error) });
        }
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
  assertWorkflowReadiness();
  const app = createHttpApp();

  await new Promise<void>((resolve) => {
    app.listen(port, () => {
      log.info(`workflow-os MCP server running on HTTP port ${String(port)}`);
      resolve();
    });
  });
}

function createRequestLifecycle(req: Request, res: Response): RequestLifecycle {
  const abortController = new AbortController();
  let abortReason: string | undefined;

  const abort = (reason: string): void => {
    abortReason = reason;
    if (!abortController.signal.aborted) {
      abortController.abort(reason);
    }
  };

  const onAborted = (): void => abort('client_aborted');
  const onRequestClose = (): void => abort('request_closed');
  const onResponseClose = (): void => abort('response_closed');
  const onTimeout = (): void => abort('request_timeout');

  req.on('aborted', onAborted);
  req.on('close', onRequestClose);
  if ('on' in res && typeof res.on === 'function') {
    res.on('close', onResponseClose);
  }

  let timeout: NodeJS.Timeout | undefined;
  const timeoutMs = resolveTimeoutMs(req.method);
  if (timeoutMs !== undefined) {
    timeout = setTimeout(onTimeout, timeoutMs);

    if (typeof req.setTimeout === 'function') {
      req.setTimeout(timeoutMs, onTimeout);
    }

    if (typeof res.setTimeout === 'function') {
      res.setTimeout(timeoutMs, onTimeout);
    }
  }

  return {
    signal: abortController.signal,
    wasAborted: () => abortController.signal.aborted,
    reason: () => abortReason,
    cleanup: () => {
      if (timeout) {
        clearTimeout(timeout);
      }
      req.off('aborted', onAborted);
      req.off('close', onRequestClose);
      if ('off' in res && typeof res.off === 'function') {
        res.off('close', onResponseClose);
      }
    },
  };
}

function throwIfRequestAborted(lifecycle: RequestLifecycle): void {
  if (lifecycle.wasAborted()) {
    throw new Error(lifecycle.reason() ?? 'request_aborted');
  }
}

function resolveTimeoutMs(method?: string): number | undefined {
  if (method === 'GET') {
    return undefined;
  }

  const rawTimeout = process.env['MCP_REQUEST_TIMEOUT_MS'];
  const parsedTimeout = rawTimeout ? Number.parseInt(rawTimeout, 10) : DEFAULT_MCP_REQUEST_TIMEOUT_MS;
  return Number.isFinite(parsedTimeout) && parsedTimeout > 0 ? parsedTimeout : DEFAULT_MCP_REQUEST_TIMEOUT_MS;
}

function classifyHttpError(error: unknown, lifecycle: RequestLifecycle): ClassifiedHttpError {
  if (error instanceof WorkflowResourceError) {
    return { kind: 'workflow_unavailable', statusCode: 503 };
  }

  if (lifecycle.reason() === 'request_timeout') {
    return { kind: 'request_timeout', statusCode: 504 };
  }

  if (lifecycle.wasAborted()) {
    return { kind: 'request_aborted', statusCode: 408 };
  }

  return { kind: 'internal', statusCode: 500 };
}
