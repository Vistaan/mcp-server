import { afterEach, describe, expect, it, vi } from 'vitest';

const connectMock = vi.fn();
const closeMock = vi.fn().mockResolvedValue(undefined);
const createServerMock = vi.fn(() => ({ connect: connectMock, close: closeMock }));
const infoMock = vi.fn();
const stdioCtorMock = vi.fn(() => ({ kind: 'stdio-transport' }));

vi.mock('../../../src/server.js', () => ({
  createServer: createServerMock,
}));

vi.mock('../../../src/logger.js', () => ({
  log: { info: infoMock },
}));

vi.mock('@modelcontextprotocol/sdk/server/stdio.js', () => ({
  StdioServerTransport: stdioCtorMock,
}));

describe('startStdioTransport', () => {
  afterEach(() => {
    vi.clearAllMocks();
    vi.restoreAllMocks();
  });

  it('connects the server and handles stdin close and SIGTERM', async () => {
    let stdinHandler: (() => void) | undefined;
    let sigtermHandler: (() => void) | undefined;

    vi.spyOn(process.stdin, 'on').mockImplementation(((event, handler) => {
      if (event === 'close') {
        stdinHandler = handler as () => void;
      }
      return process.stdin;
    }) as never);

    vi.spyOn(process, 'on').mockImplementation(((event, handler) => {
      if (event === 'SIGTERM') {
        sigtermHandler = handler as () => void;
      }
      return process;
    }) as never);

    const exitSpy = vi.spyOn(process, 'exit').mockImplementation((() => undefined) as never);

    const { startStdioTransport } = await import('../../../src/transports/stdio.js');

    await startStdioTransport();

    expect(stdioCtorMock).toHaveBeenCalledTimes(1);
    expect(connectMock).toHaveBeenCalledWith({ kind: 'stdio-transport' });
    expect(infoMock).toHaveBeenCalledWith('workflow-os MCP server running on stdio');

    stdinHandler?.();
    sigtermHandler?.();
    await Promise.resolve();
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(closeMock).toHaveBeenCalledTimes(2);
    expect(infoMock).toHaveBeenCalledWith('workflow-os: stdin closed, shutting down');
    expect(infoMock).toHaveBeenCalledWith('workflow-os: SIGTERM received, shutting down');
    expect(exitSpy).toHaveBeenCalledWith(0);
  });
});
