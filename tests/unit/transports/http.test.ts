import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { WorkflowResourceError } from '../../../src/resources/errors.js';

const realSetTimeout = globalThis.setTimeout;

let rootHandler: ((req: unknown, res: ReturnType<typeof createResponse>) => void) | undefined;
let docsJsonHandler: ((req: unknown, res: ReturnType<typeof createResponse>) => void) | undefined;
let livezHandler: ((req: unknown, res: ReturnType<typeof createResponse>) => void) | undefined;
let readyzHandler: ((req: unknown, res: ReturnType<typeof createResponse>) => void) | undefined;
let healthHandler: ((req: unknown, res: ReturnType<typeof createResponse>) => void) | undefined;
let metricsHandler: ((req: unknown, res: ReturnType<typeof createResponse>) => void) | undefined;
let metricsPrometheusHandler: ((req: unknown, res: ReturnType<typeof createResponse>) => void) | undefined;
let getMcpHandler: ((req: Record<string, unknown>, res: ReturnType<typeof createResponse>) => void) | undefined;
let postMcpHandler: ((req: Record<string, unknown>, res: ReturnType<typeof createResponse>) => void) | undefined;
let deleteMcpHandler: ((req: Record<string, unknown>, res: ReturnType<typeof createResponse>) => void) | undefined;
let docsUseArgs: unknown[] | undefined;
let timerCallbacks: Array<() => void> = [];

const { assertWorkflowReadinessMock, getWorkflowReadinessMock } = vi.hoisted(() => ({
  assertWorkflowReadinessMock: vi.fn(),
  getWorkflowReadinessMock: vi.fn(
    () =>
      ({
        status: 'ok',
        workflowRoot: '/workflows',
        missingFiles: [] as string[],
        checkedAt: '2026-04-02T00:00:00.000Z',
      }) as {
        status: 'ok' | 'degraded';
        workflowRoot: string;
        missingFiles: string[];
        checkedAt: string;
      },
  ),
}));

const useMock = vi.fn();
const listenMock = vi.fn((port: number, callback: () => void) => {
  callback();
  return { port };
});
const jsonMock = vi.fn(() => 'json-middleware');
const staticMock = vi.fn(() => 'static-middleware');
const swaggerServeHandlers = [vi.fn(), vi.fn()];
const swaggerUiHandler = vi.fn();
const swaggerSetupMock = vi.fn(() => swaggerUiHandler);
const expressMock = vi.fn(() => ({
  use: vi.fn((...args: unknown[]) => {
    useMock(...args);
    if (args[0] === '/docs') {
      docsUseArgs = args;
    }
  }),
    get: vi.fn((path: string, handler: typeof healthHandler) => {
      if (path === '/') {
        rootHandler = handler as typeof rootHandler;
      } else if (path === '/docs-api.json') {
        docsJsonHandler = handler;
      } else if (path === '/livez') {
        livezHandler = handler;
      } else if (path === '/readyz') {
        readyzHandler = handler;
      } else if (path === '/health') {
        healthHandler = handler;
      } else if (path === '/metrics') {
        metricsHandler = handler;
      } else if (path === '/metrics/prometheus') {
        metricsPrometheusHandler = handler;
      } else if (path === '/mcp') {
        getMcpHandler = handler as typeof getMcpHandler;
      }
  }),
  post: vi.fn((path: string, handler: typeof postMcpHandler) => {
    if (path === '/mcp') {
      postMcpHandler = handler;
    }
  }),
  delete: vi.fn((path: string, handler: typeof deleteMcpHandler) => {
    if (path === '/mcp') {
      deleteMcpHandler = handler;
    }
  }),
  listen: listenMock,
}));

const connectMock = vi.fn();
const closeMock = vi.fn().mockResolvedValue(undefined);
const createServerMock = vi.fn(() => ({ connect: connectMock, close: closeMock }));
const infoMock = vi.fn();
const errorMock = vi.fn();
const handleRequestMock = vi.fn();
const transportCtorMock = vi.fn(() => ({ handleRequest: handleRequestMock }));

vi.mock('express', () => ({
  default: Object.assign(expressMock, { json: jsonMock, static: staticMock }),
}));

vi.mock('../../../src/server.js', () => ({
  createServer: createServerMock,
}));

vi.mock('../../../src/logger.js', () => ({
  log: { info: infoMock, error: errorMock },
}));

vi.mock('../../../src/resources/loader.js', () => ({
  assertWorkflowReadiness: assertWorkflowReadinessMock,
  getWorkflowReadiness: getWorkflowReadinessMock,
}));

vi.mock('swagger-ui-express', () => ({
  serve: swaggerServeHandlers,
  setup: swaggerSetupMock,
}));

vi.mock('@modelcontextprotocol/sdk/server/streamableHttp.js', () => ({
  StreamableHTTPServerTransport: transportCtorMock,
}));

function createResponse() {
  return {
    headersSent: false,
    req: { protocol: 'http' },
    setTimeout: vi.fn(),
    destroy: vi.fn(),
    setHeader: vi.fn(),
    get: vi.fn((header: string) => {
      if (header === 'host') {
        return 'localhost:8080';
      }
      return undefined;
    }),
    json: vi.fn(),
    send: vi.fn(),
    sendFile: vi.fn(),
    status: vi.fn(function status(this: { json: unknown }, _code: number) {
      return this;
    }),
  };
}

async function flushAsyncWork(): Promise<void> {
  await Promise.resolve();
  await Promise.resolve();
  await new Promise((resolve) => realSetTimeout(resolve, 0));
}

describe('HTTP transport', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    rootHandler = undefined;
    docsJsonHandler = undefined;
    livezHandler = undefined;
    readyzHandler = undefined;
    healthHandler = undefined;
    metricsHandler = undefined;
    metricsPrometheusHandler = undefined;
    getMcpHandler = undefined;
    postMcpHandler = undefined;
    deleteMcpHandler = undefined;
    docsUseArgs = undefined;
    connectMock.mockResolvedValue(undefined);
    handleRequestMock.mockResolvedValue(undefined);
    timerCallbacks = [];
    vi.spyOn(globalThis, 'setTimeout').mockImplementation(((callback: () => void) => {
      timerCallbacks.push(callback);
      return 1 as never;
    }) as never);
    vi.spyOn(globalThis, 'clearTimeout').mockImplementation((() => undefined) as never);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('creates the shared app with docs, liveness/readiness, metrics, and MCP handlers', async () => {
    const { createHttpApp } = await import('../../../src/transports/http.js');

    createHttpApp();

    expect(jsonMock).toHaveBeenCalledWith({ limit: '10mb' });
    expect(staticMock).toHaveBeenCalledWith(expect.stringContaining('landing-page'));
    expect(useMock).toHaveBeenCalledWith('static-middleware');
    expect(useMock).toHaveBeenCalledWith('json-middleware');
    expect(swaggerSetupMock).toHaveBeenCalledWith(undefined, {
      explorer: true,
      swaggerOptions: {
        url: '/docs-api.json',
      },
    });
    expect(docsUseArgs).toEqual(['/docs', ...swaggerServeHandlers, swaggerUiHandler]);

    const rootRes = createResponse();
    rootHandler?.({}, rootRes);
    expect(rootRes.sendFile).toHaveBeenCalledWith(expect.stringContaining('landing-page/index.html'));

    const docsRes = createResponse();
    docsJsonHandler?.(
      {
        protocol: 'http',
        get: (header: string) => (header === 'host' ? 'localhost:8080' : undefined),
      },
      docsRes,
    );
    const [docsJsonCall] = docsRes.json.mock.calls as unknown[][];
    const [docsSpecArg] = docsJsonCall ?? [];
    const docsSpec = docsSpecArg as { openapi: string; paths: Record<string, unknown>; servers: Array<{ url: string }> };
    expect(docsSpec.openapi).toBe('3.1.0');
    expect(docsSpec.servers[0]?.url).toBe('http://localhost:8080');
    expect(docsSpec.paths).toHaveProperty('/health');
    expect(docsSpec.paths).toHaveProperty('/livez');
    expect(docsSpec.paths).toHaveProperty('/readyz');
    expect(docsSpec.paths).toHaveProperty('/metrics');
    expect(docsSpec.paths).toHaveProperty('/mcp');
    expect(docsSpec.paths).toHaveProperty('/metrics/prometheus');
    expect(docsRes.setHeader).toHaveBeenCalledWith('cache-control', 'no-store');

    const livezRes = createResponse();
    livezHandler?.({}, livezRes);
    expect(livezRes.status).toHaveBeenCalledWith(200);
    expect(livezRes.json).toHaveBeenCalledWith({
      status: 'ok',
      service: 'workflow-os-mcp',
      transport: 'http',
    });

    const readyzRes = createResponse();
    readyzHandler?.({}, readyzRes);
    expect(readyzRes.status).toHaveBeenCalledWith(200);
    expect(readyzRes.json).toHaveBeenCalledWith({
      status: 'ok',
      service: 'workflow-os-mcp',
      transport: 'http',
      workflow_root: '/workflows',
      missing_workflows: [],
      checked_at: '2026-04-02T00:00:00.000Z',
    });

    const healthRes = createResponse();
    healthHandler?.({}, healthRes);
    expect(healthRes.status).toHaveBeenCalledWith(200);
    expect(healthRes.json).toHaveBeenCalledWith({
      status: 'ok',
      service: 'workflow-os-mcp',
      transport: 'http',
      workflow_root: '/workflows',
      missing_workflows: [],
      checked_at: '2026-04-02T00:00:00.000Z',
    });
    expect(healthRes.setHeader).toHaveBeenCalledWith('cache-control', 'no-store');

    const metricsRes = createResponse();
    metricsHandler?.({}, metricsRes);
    expect(metricsRes.status).toHaveBeenCalledWith(200);
    const [metricsPayload] = (metricsRes.json.mock.calls[0] ?? []) as [Record<string, unknown>?];
    expect(metricsPayload?.['service']).toBe('workflow-os-mcp');
    expect(metricsPayload?.['transport']).toBe('http');
    expect(typeof metricsPayload?.['counters']).toBe('object');
    expect(typeof metricsPayload?.['durations']).toBe('object');
    expect(metricsRes.setHeader).toHaveBeenCalledWith('cache-control', 'no-store');

    const prometheusRes = createResponse();
    metricsPrometheusHandler?.({}, prometheusRes);
    expect(prometheusRes.status).toHaveBeenCalledWith(200);
    expect(prometheusRes.setHeader).toHaveBeenCalledWith('content-type', 'text/plain; version=0.0.4; charset=utf-8');
    expect(prometheusRes.send).toHaveBeenCalledWith(expect.stringContaining('http_metrics_requested'));

    const req = {
      body: { jsonrpc: '2.0' },
      method: 'POST',
      path: '/mcp',
      aborted: false,
      on: vi.fn(),
      off: vi.fn(),
      setTimeout: vi.fn(),
    };
    const res = createResponse();
    postMcpHandler?.(req, res);
    await flushAsyncWork();

    expect(res.setHeader).toHaveBeenCalledWith('x-request-id', expect.any(String));
    expect(res.setHeader).toHaveBeenCalledWith('cache-control', 'no-store');
    expect(transportCtorMock).toHaveBeenCalledTimes(1);
    expect(connectMock).toHaveBeenCalledTimes(1);
    expect(handleRequestMock).toHaveBeenCalledWith(req, res, req.body);
    expect(closeMock).toHaveBeenCalledTimes(1);

    getMcpHandler?.({ ...req, method: 'GET' }, createResponse());
    deleteMcpHandler?.({ ...req, method: 'DELETE' }, createResponse());
    await flushAsyncWork();

    expect(transportCtorMock).toHaveBeenCalledTimes(3);
    expect(assertWorkflowReadinessMock).toHaveBeenCalledTimes(3);
  });

  it('starts the shared app on the requested port for self-hosted HTTP mode', async () => {
    const { startHttpTransport } = await import('../../../src/transports/http.js');

    await startHttpTransport(8080);

    expect(listenMock).toHaveBeenCalledWith(8080, expect.any(Function));
    expect(infoMock).toHaveBeenCalledWith('workflow-os MCP server running on HTTP port 8080');
  });

  it('prefers PUBLIC_BASE_URL for generated docs when configured', async () => {
    process.env['PUBLIC_BASE_URL'] = 'https://api.example.com';

    const { createHttpApp } = await import('../../../src/transports/http.js');
    createHttpApp();

    const docsRes = createResponse();
    docsJsonHandler?.(
      {
        protocol: 'http',
        get: (header: string) => (header === 'host' ? 'localhost:8080' : undefined),
      },
      docsRes,
    );

    const [docsJsonCall] = docsRes.json.mock.calls as unknown[][];
    const [docsSpecArg] = docsJsonCall ?? [];
    const docsSpec = docsSpecArg as { servers: Array<{ url: string }> };
    expect(docsSpec.servers[0]?.url).toBe('https://api.example.com');

    delete process.env['PUBLIC_BASE_URL'];
  });

  it('does not expose metrics endpoints when METRICS_ENABLED=false', async () => {
    process.env['METRICS_ENABLED'] = 'false';

    const { createHttpApp } = await import('../../../src/transports/http.js');
    createHttpApp();

    expect(metricsHandler).toBeUndefined();
    expect(metricsPrometheusHandler).toBeUndefined();

    delete process.env['METRICS_ENABLED'];
  });

  it('reuses an incoming x-request-id header for MCP responses', async () => {
    const { createHttpApp } = await import('../../../src/transports/http.js');
    createHttpApp();

    const req = {
      body: { jsonrpc: '2.0' },
      method: 'POST',
      path: '/mcp',
      aborted: false,
      headers: { 'x-request-id': 'edge-request-123' },
      get: vi.fn((name: string) => (name.toLowerCase() === 'x-request-id' ? 'edge-request-123' : undefined)),
      on: vi.fn(),
      off: vi.fn(),
      setTimeout: vi.fn(),
    };
    const res = createResponse();

    postMcpHandler?.(req, res);
    await flushAsyncWork();

    expect(res.setHeader).toHaveBeenCalledWith('x-request-id', 'edge-request-123');
  });

  it('logs errors and returns a 500 response when request handling fails', async () => {
    handleRequestMock.mockRejectedValueOnce(new Error('boom'));

    const { createHttpApp } = await import('../../../src/transports/http.js');

    createHttpApp();

    const req = { body: { bad: true }, method: 'POST', aborted: false, on: vi.fn(), off: vi.fn(), setTimeout: vi.fn() };
    const res = createResponse();
    postMcpHandler?.(req, res);
    await flushAsyncWork();

    const internalLogCall = errorMock.mock.calls[0] as [string, Record<string, unknown>] | undefined;
    expect(internalLogCall?.[0]).toBe('HTTP MCP handler error');
    expect(internalLogCall?.[1]['error']).toBe('Error: boom');
    expect(internalLogCall?.[1]['kind']).toBe('internal');
    expect(internalLogCall?.[1]['statusCode']).toBe(500);
    expect(internalLogCall?.[1]['aborted']).toBe(false);
    expect(internalLogCall?.[1]['timedOut']).toBe(false);
    expect(typeof internalLogCall?.[1]['requestId']).toBe('string');
    expect(res.status).toHaveBeenCalledWith(500);
    const [internalErrorPayload] = (res.json.mock.calls[0] ?? []) as [Record<string, unknown>?];
    const internalError = internalErrorPayload?.['error'] as Record<string, unknown> | undefined;
    expect(internalError?.['code']).toBe('internal');
    expect(internalError?.['message']).toBe('Internal server error');
    expect(typeof internalError?.['request_id']).toBe('string');
    expect(closeMock).toHaveBeenCalledTimes(1);
  });

  it('does not write a second error response after headers are sent', async () => {
    connectMock.mockRejectedValueOnce(new Error('connect failed'));

    const { createHttpApp } = await import('../../../src/transports/http.js');

    createHttpApp();

    const res = createResponse();
    res.headersSent = true;

    postMcpHandler?.({ body: undefined, method: 'POST', path: '/mcp', aborted: false, on: vi.fn(), off: vi.fn(), setTimeout: vi.fn() }, res);
    await flushAsyncWork();

    const connectLogCall = errorMock.mock.calls[0] as [string, Record<string, unknown>] | undefined;
    expect(connectLogCall?.[0]).toBe('HTTP MCP handler error');
    expect(connectLogCall?.[1]['error']).toBe('Error: connect failed');
    expect(connectLogCall?.[1]['kind']).toBe('internal');
    expect(connectLogCall?.[1]['statusCode']).toBe(500);
    expect(connectLogCall?.[1]['aborted']).toBe(false);
    expect(connectLogCall?.[1]['timedOut']).toBe(false);
    expect(typeof connectLogCall?.[1]['requestId']).toBe('string');
    expect(res.status).not.toHaveBeenCalled();
    expect(res.json).not.toHaveBeenCalled();
  });

  it('boots degraded and returns 503 for MCP requests when workflows are unavailable', async () => {
    assertWorkflowReadinessMock.mockImplementationOnce(() => {
      throw new WorkflowResourceError('WORKFLOW_FILE_UNREADABLE', 'workflow missing');
    });
    getWorkflowReadinessMock.mockImplementationOnce(
      () =>
        ({
          status: 'degraded',
          workflowRoot: '/broken',
          missingFiles: ['WORKFLOW_OS_v1.md'],
          checkedAt: '2026-04-02T00:00:00.000Z',
        }) as {
          status: 'ok' | 'degraded';
          workflowRoot: string;
          missingFiles: string[];
          checkedAt: string;
        },
    );

    const { createHttpApp } = await import('../../../src/transports/http.js');

    createHttpApp();

    const healthRes = createResponse();
    healthHandler?.({}, healthRes);
    expect(healthRes.status).toHaveBeenCalledWith(503);

    const res = createResponse();
    postMcpHandler?.({ body: {}, method: 'POST', path: '/mcp', aborted: false, on: vi.fn(), off: vi.fn(), setTimeout: vi.fn() }, res);
    await flushAsyncWork();

    expect(res.status).toHaveBeenCalledWith(503);
    const [workflowUnavailablePayload] = (res.json.mock.calls[0] ?? []) as [Record<string, unknown>?];
    const workflowUnavailableError = workflowUnavailablePayload?.['error'] as Record<string, unknown> | undefined;
    expect(workflowUnavailableError?.['code']).toBe('workflow_unavailable');
    expect(workflowUnavailableError?.['message']).toBe('Workflow resources unavailable');
    expect(typeof workflowUnavailableError?.['request_id']).toBe('string');
    expect(createServerMock).not.toHaveBeenCalled();
  });

  it('classifies true aborted requests without treating normal close as an abort', async () => {
    handleRequestMock.mockImplementationOnce((req: { on: ReturnType<typeof vi.fn> }) => {
      const abortedHandler = req.on.mock.calls.find(([event]) => event === 'aborted')?.[1] as (() => void) | undefined;
      abortedHandler?.();
      throw new Error('socket closed');
    });

    const { createHttpApp } = await import('../../../src/transports/http.js');

    createHttpApp();

    const req = { body: {}, method: 'POST', path: '/mcp', aborted: false, on: vi.fn(), off: vi.fn(), setTimeout: vi.fn() };
    const res = createResponse();
    postMcpHandler?.(req, res);
    await flushAsyncWork();

    const abortedLogCall = errorMock.mock.calls[0] as [string, Record<string, unknown>] | undefined;
    expect(abortedLogCall?.[0]).toBe('HTTP MCP handler error');
    expect(abortedLogCall?.[1]['kind']).toBe('request_aborted');
    expect(abortedLogCall?.[1]['statusCode']).toBe(408);
    expect(abortedLogCall?.[1]['aborted']).toBe(true);
    expect(abortedLogCall?.[1]['timedOut']).toBe(false);
    expect(typeof abortedLogCall?.[1]['requestId']).toBe('string');
    expect(res.status).not.toHaveBeenCalled();
  });

  it('classifies timeout-triggered failures separately', async () => {
    handleRequestMock.mockImplementationOnce(() => {
      timerCallbacks[0]?.();
      throw new Error('timed out');
    });

    const { createHttpApp } = await import('../../../src/transports/http.js');

    createHttpApp();

    const res = createResponse();
    postMcpHandler?.({ body: {}, method: 'POST', path: '/mcp', aborted: false, on: vi.fn(), off: vi.fn(), setTimeout: vi.fn() }, res);
    await flushAsyncWork();

    const timeoutLogCall = errorMock.mock.calls[0] as [string, Record<string, unknown>] | undefined;
    expect(timeoutLogCall?.[0]).toBe('HTTP MCP handler error');
    expect(timeoutLogCall?.[1]['kind']).toBe('request_timeout');
    expect(timeoutLogCall?.[1]['statusCode']).toBe(504);
    expect(timeoutLogCall?.[1]['aborted']).toBe(false);
    expect(timeoutLogCall?.[1]['timedOut']).toBe(true);
    expect(typeof timeoutLogCall?.[1]['requestId']).toBe('string');
    expect(res.status).toHaveBeenCalledWith(504);
    const [timeoutPayload] = (res.json.mock.calls[0] ?? []) as [Record<string, unknown>?];
    const timeoutError = timeoutPayload?.['error'] as Record<string, unknown> | undefined;
    expect(timeoutError?.['code']).toBe('request_timeout');
    expect(timeoutError?.['message']).toBe('Request timed out');
    expect(typeof timeoutError?.['request_id']).toBe('string');
  });
});
