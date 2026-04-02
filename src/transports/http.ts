import express from 'express';
import { randomUUID } from 'crypto';
import { existsSync } from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import type { Request, Response } from 'express';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import * as swaggerUi from 'swagger-ui-express';
import type { Transport } from '@modelcontextprotocol/sdk/shared/transport.js';
import { metrics } from '../metrics.js';
import { createOpenApiSpec } from '../openapi/spec.js';
import { WorkflowResourceError } from '../resources/errors.js';
import { assertWorkflowReadiness, getWorkflowReadiness } from '../resources/loader.js';
import { createServer } from '../server.js';
import { log } from '../logger.js';
import { buildHealthResponse, buildHttpErrorResponse, type HttpErrorCode } from './contracts.js';

const DEFAULT_MCP_REQUEST_TIMEOUT_MS = 30_000;

type ClassifiedHttpError = {
  kind: HttpErrorCode;
  statusCode: number;
};

type RequestLifecycle = {
  requestId: string;
  signal: AbortSignal;
  wasAborted(): boolean;
  isTimedOut(): boolean;
  markCompleted(): void;
  durationMs(): number;
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
  const app = express();
  const landingPagePath = resolveLandingPagePath();

  app.use(express.static(landingPagePath));

  // Root index route for enterprise landing page
  app.get('/', (_req: Request, res: Response) => {
    res.sendFile(path.join(landingPagePath, 'index.html'));
  });

  app.use(express.json({ limit: '10mb' }));
  app.get('/docs-api.json', (req: Request, res: Response) => {
    const serverUrl = resolveServerUrl(req);
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
    res.status(readiness.status === 'ok' ? 200 : 503).json(buildHealthResponse(readiness));
  });

  // ── MCP handler (POST + GET + DELETE) ─────────────────────────────────────────
  async function handleMcp(req: Request, res: Response): Promise<void> {
    const lifecycle = createRequestLifecycle(req, res);
    let server: ReturnType<typeof createServer> | undefined;
    metrics.increment('http_request_started', { method: req.method ?? 'UNKNOWN' });
    log.info('HTTP MCP request started', { requestId: lifecycle.requestId, method: req.method, path: req.path });

    try {
      assertWorkflowReadiness();
      const transport = new StreamableHTTPServerTransport();
      server = createServer();

      // The SDK transport is runtime-compatible with `Transport`, but its current
      // declarations do not satisfy `exactOptionalPropertyTypes` cleanly.
      await server.connect(transport as unknown as Transport);
      await Promise.race([
        transport.handleRequest(req, res, req.body as Record<string, unknown> | undefined),
        waitForAbort(lifecycle.signal),
      ]);
      lifecycle.markCompleted();
      metrics.increment('http_request_completed', { method: req.method ?? 'UNKNOWN' });
      metrics.observeDuration('http_request_duration_ms', lifecycle.durationMs(), { method: req.method ?? 'UNKNOWN' });
      log.info('HTTP MCP request completed', {
        requestId: lifecycle.requestId,
        method: req.method,
        duration_ms: lifecycle.durationMs(),
      });
    } catch (error) {
      const classified = classifyHttpError(error, lifecycle);
      metrics.increment('http_request_failed', { method: req.method ?? 'UNKNOWN', kind: classified.kind });
      log.error('HTTP MCP handler error', {
        requestId: lifecycle.requestId,
        error: String(error),
        kind: classified.kind,
        statusCode: classified.statusCode,
        aborted: lifecycle.wasAborted(),
        timedOut: lifecycle.isTimedOut(),
      });
      if (!res.headersSent && !lifecycle.wasAborted()) {
        res.status(classified.statusCode).json(buildHttpErrorResponse(classified.kind, lifecycle.requestId));
      }
    } finally {
      lifecycle.cleanup();
      if (server) {
        try {
          await server.close();
        } catch (error) {
          log.error('HTTP MCP cleanup error', { requestId: lifecycle.requestId, error: String(error) });
        }
      }
      log.info('HTTP MCP request cleaned up', {
        requestId: lifecycle.requestId,
        method: req.method,
        duration_ms: lifecycle.durationMs(),
      });
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

function createRequestLifecycle(req: Request, res: Response): RequestLifecycle {
  const requestId = randomUUID();
  const controller = new AbortController();
  let aborted = Boolean(req.aborted);
  let timedOut = false;
  let completed = false;
  const startedAt = Date.now();
  const onAborted = (): void => {
    aborted = true;
    controller.abort(new Error('request_aborted'));
    if (typeof res.destroy === 'function') {
      res.destroy(new Error('request_aborted'));
    }
  };
  const onTimeout = (): void => {
    timedOut = true;
    controller.abort(new Error('request_timeout'));
    if (typeof res.destroy === 'function') {
      res.destroy(new Error('request_timeout'));
    } else if (typeof req.destroy === 'function') {
      req.destroy(new Error('request_timeout'));
    }
  };

  req.on('aborted', onAborted);

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
    requestId,
    signal: controller.signal,
    wasAborted: () => aborted,
    isTimedOut: () => timedOut,
    markCompleted: () => {
      completed = true;
    },
    durationMs: () => Date.now() - startedAt,
    cleanup: () => {
      if (timeout) {
        clearTimeout(timeout);
      }
      req.off('aborted', onAborted);
      if (!completed && !controller.signal.aborted) {
        controller.abort(new Error('request_cleanup'));
      }
    },
  };
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

  if (lifecycle.isTimedOut()) {
    return { kind: 'request_timeout', statusCode: 504 };
  }

  if (lifecycle.wasAborted()) {
    return { kind: 'request_aborted', statusCode: 408 };
  }

  return { kind: 'internal', statusCode: 500 };
}

function waitForAbort(signal: AbortSignal): Promise<never> {
  if (signal.aborted) {
    return Promise.reject(signal.reason ?? new Error('request_aborted'));
  }

  return new Promise((_, reject) => {
    signal.addEventListener(
      'abort',
      () => {
        reject(signal.reason ?? new Error('request_aborted'));
      },
      { once: true },
    );
  });
}

function resolveServerUrl(req: Request): string {
  const configuredBaseUrl = process.env['PUBLIC_BASE_URL']?.trim();
  if (configuredBaseUrl) {
    return configuredBaseUrl;
  }

  if (process.env['NODE_ENV'] !== 'production') {
    const host = req.get('host');
    if (host) {
      return `${req.protocol}://${host}`;
    }
  }

  return '/';
}
