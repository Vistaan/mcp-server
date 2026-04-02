import { beforeEach, describe, expect, it, vi } from 'vitest';

const startHttpTransportMock = vi.fn();
const startStdioTransportMock = vi.fn();

vi.mock('../../src/transports/http.js', () => ({
  startHttpTransport: startHttpTransportMock,
}));

vi.mock('../../src/transports/stdio.js', () => ({
  startStdioTransport: startStdioTransportMock,
}));

describe('src/index.ts', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('detects direct execution for filesystem paths that include spaces', async () => {
    const { isDirectExecution } = await import('../../src/index.js');

    expect(isDirectExecution('file:///tmp/My%20Project/dist/index.js', '/tmp/My Project/dist/index.js')).toBe(true);
  });

  it('does not auto-start transports when imported as a module', async () => {
    await import('../../src/index.js');

    expect(startHttpTransportMock).not.toHaveBeenCalled();
    expect(startStdioTransportMock).not.toHaveBeenCalled();
  });
});
