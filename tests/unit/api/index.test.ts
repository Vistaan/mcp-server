import { beforeEach, describe, expect, it, vi } from 'vitest';

const appMock = vi.fn();
const createHttpAppMock = vi.fn(() => appMock);

vi.mock('../../../src/transports/http.js', () => ({
  createHttpApp: createHttpAppMock,
}));

describe('Vercel API handler', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('reuses the shared HTTP app and forwards requests without listening', async () => {
    const module = await import('../../../api/index.js');
    const handler = module.default;
    const req = {} as never;
    const res = {} as never;

    handler(req, res);
    handler(req, res);

    expect(createHttpAppMock).toHaveBeenCalledTimes(1);
    expect(appMock).toHaveBeenCalledTimes(2);
    expect(appMock).toHaveBeenNthCalledWith(1, req, res);
    expect(appMock).toHaveBeenNthCalledWith(2, req, res);
  });
});
