import { describe, it, expect } from 'vitest';
import { createServer } from '../../src/server.js';

describe('createServer (smoke test)', () => {
  it('creates an McpServer instance without throwing', () => {
    expect(() => createServer()).not.toThrow();
  });

  it('returns a server object with the expected shape', () => {
    const server = createServer();
    expect(server).toBeDefined();
    expect(typeof server.connect).toBe('function');
    expect(typeof server.close).toBe('function');
  });
});
