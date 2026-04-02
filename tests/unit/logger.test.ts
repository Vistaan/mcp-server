import { afterEach, describe, expect, it, vi } from 'vitest';
import { log } from '../../src/logger.js';

describe('logger', () => {
  afterEach(() => {
    delete process.env['LOG_LEVEL'];
    vi.restoreAllMocks();
  });

  it('writes structured stderr logs for each level when LOG_LEVEL=debug', () => {
    process.env['LOG_LEVEL'] = 'debug';
    const writeSpy = vi.spyOn(process.stderr, 'write').mockReturnValue(true);

    log.debug('debug message', { foo: 1 });
    log.info('info message');
    log.warn('warn message');
    log.error('error message');

    expect(writeSpy).toHaveBeenCalledTimes(4);

    const firstPayload = JSON.parse(String(writeSpy.mock.calls[0]?.[0]).trim()) as Record<string, unknown>;
    expect(firstPayload['level']).toBe('debug');
    expect(firstPayload['msg']).toBe('debug message');
    expect(firstPayload['foo']).toBe(1);
  });

  it('filters lower-severity logs below the configured level', () => {
    process.env['LOG_LEVEL'] = 'warn';
    const writeSpy = vi.spyOn(process.stderr, 'write').mockReturnValue(true);

    log.debug('debug message');
    log.info('info message');
    log.warn('warn message');
    log.error('error message');

    expect(writeSpy).toHaveBeenCalledTimes(2);

    const firstPayload = JSON.parse(String(writeSpy.mock.calls[0]?.[0]).trim()) as Record<string, unknown>;
    const secondPayload = JSON.parse(String(writeSpy.mock.calls[1]?.[0]).trim()) as Record<string, unknown>;
    expect(firstPayload['level']).toBe('warn');
    expect(secondPayload['level']).toBe('error');
  });
});
