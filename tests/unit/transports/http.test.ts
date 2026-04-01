import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

let healthHandler: ((req: unknown, res: ReturnType<typeof createResponse>) => void) | undefined;
let getMcpHandler: ((req: Record<string, unknown>, res: ReturnType<typeof createResponse>) => void) | undefined;
let postMcpHandler: ((req: Record<string, unknown>, res: ReturnType<typeof createResponse>) => void) | undefined;
let deleteMcpHandler: ((req: Record<string, unknown>, res: ReturnType<typeof createResponse>) => void) | undefined;

const useMock = vi.fn();
const listenMock = vi.fn((port: number, callback: () => void) => {
  callback();
  return { port };
});
const jsonMock = vi.fn(() => 'json-middleware');
const expressMock = vi.fn(() => ({
  use: useMock,
  get: vi.fn((path: string, handler: typeof healthHandler) => {
    if (path === '/health') {
      healthHandler = handler;
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
  default: Object.assign(expressMock, { json: jsonMock }),
}));

vi.mock('../../../src/server.js', () => ({
  createServer: createServerMock,
}));

vi.mock('../../../src/logger.js', () => ({
  log: { info: infoMock, error: errorMock },
}));

vi.mock('@modelcontextprotocol/sdk/server/streamableHttp.js', () => ({
  StreamableHTTPServerTransport: transportCtorMock,
}));

function createResponse() {
  return {
    headersSent: false,
    json: vi.fn(),
    status: vi.fn(function status(this: { json: unknown }, _code: number) {
      return this;
    }),
  };
}

async function flushAsyncWork(): Promise<void> {
  await Promise.resolve();
  await Promise.resolve();
  await new Promise((resolve) => setTimeout(resolve, 0));
}

describe('startHttpTransport', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    healthHandler = undefined;
    getMcpHandler = undefined;
    postMcpHandler = undefined;
    deleteMcpHandler = undefined;
    connectMock.mockResolvedValue(undefined);
    handleRequestMock.mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('registers middleware and handlers, and serves health and MCP requests', async () => {
    const { startHttpTransport } = await import('../../../src/transports/http.js');

    await startHttpTransport(8080);

    expect(jsonMock).toHaveBeenCalledWith({ limit: '10mb' });
    expect(useMock).toHaveBeenCalledWith('json-middleware');
    expect(listenMock).toHaveBeenCalledWith(8080, expect.any(Function));
    expect(infoMock).toHaveBeenCalledWith('workflow-os MCP server running on HTTP port 8080');

    const healthRes = createResponse();
    healthHandler?.({}, healthRes);
    expect(healthRes.json).toHaveBeenCalledWith({ status: 'ok', service: 'workflow-os-mcp', transport: 'http' });

    const req = { body: { jsonrpc: '2.0' } };
    const res = createResponse();
    postMcpHandler?.(req, res);
    await flushAsyncWork();

    expect(transportCtorMock).toHaveBeenCalledTimes(1);
    expect(connectMock).toHaveBeenCalledTimes(1);
    expect(handleRequestMock).toHaveBeenCalledWith(req, res, req.body);
    expect(closeMock).toHaveBeenCalledTimes(1);

    getMcpHandler?.(req, createResponse());
    deleteMcpHandler?.(req, createResponse());
    await flushAsyncWork();

    expect(transportCtorMock).toHaveBeenCalledTimes(3);
  });

  it('logs errors and returns a 500 response when request handling fails', async () => {
    handleRequestMock.mockRejectedValueOnce(new Error('boom'));

    const { startHttpTransport } = await import('../../../src/transports/http.js');

    await startHttpTransport(9090);

    const req = { body: { bad: true } };
    const res = createResponse();
    postMcpHandler?.(req, res);
    await flushAsyncWork();

    expect(errorMock).toHaveBeenCalledWith('HTTP MCP handler error', { error: 'Error: boom' });
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: 'Internal server error' });
  });

  it('does not write a second error response after headers are sent', async () => {
    connectMock.mockRejectedValueOnce(new Error('connect failed'));

    const { startHttpTransport } = await import('../../../src/transports/http.js');

    await startHttpTransport(7070);

    const res = createResponse();
    res.headersSent = true;

    postMcpHandler?.({ body: undefined }, res);
    await flushAsyncWork();

    expect(errorMock).toHaveBeenCalledWith('HTTP MCP handler error', { error: 'Error: connect failed' });
    expect(res.status).not.toHaveBeenCalled();
    expect(res.json).not.toHaveBeenCalled();
  });
});
