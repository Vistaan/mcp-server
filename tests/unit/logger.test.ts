import { afterEach, describe, expect, it, vi } from 'vitest';
import { log } from '../../src/logger.js';

describe('logger', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('writes structured stderr logs for each level', () => {
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
});
