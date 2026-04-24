import { describe, expect, it } from 'vitest';
import { createOpenApiSpec, openApiSpec } from '../../../src/openapi/spec.js';

describe('OpenAPI spec', () => {
  it('exposes the expected top-level metadata', () => {
    expect(openApiSpec.openapi).toBe('3.1.0');
    expect(openApiSpec.info.title).toContain('workflow-os MCP HTTP API');
    expect(openApiSpec.info.version).toBe('1.0.0');
  });

  it('can generate a spec bound to the current request origin', () => {
    const spec = createOpenApiSpec('http://localhost:6677');
    expect(spec.servers).toEqual([
      {
        url: 'http://localhost:6677',
        description: 'Current HTTP transport endpoint',
      },
    ]);
  });

  it('documents the expected HTTP paths', () => {
    expect(Object.keys(openApiSpec.paths)).toEqual(
      expect.arrayContaining([
        '/health',
        '/livez',
        '/readyz',
        '/metrics',
        '/metrics/prometheus',
        '/mcp',
        '/docs',
        '/docs-api.json',
      ]),
    );
    expect(openApiSpec.paths['/mcp']).toHaveProperty('post');
    expect(openApiSpec.paths['/mcp']).toHaveProperty('get');
    expect(openApiSpec.paths['/mcp']).toHaveProperty('delete');
  });

  it('models the health response and JSON-RPC schemas', () => {
    expect(openApiSpec.components.schemas.HealthBase.required).toEqual(
      expect.arrayContaining(['status', 'service', 'transport']),
    );
    expect(openApiSpec.components.schemas.LivezResponse.required).toEqual(
      expect.arrayContaining(['status', 'service', 'transport']),
    );
    expect(openApiSpec.components.schemas.MetricsResponse.required).toEqual(
      expect.arrayContaining(['service', 'transport', 'counters', 'durations']),
    );
    expect(openApiSpec.components.schemas.JsonRpcMessage.oneOf).toHaveLength(4);
    expect(openApiSpec.components.schemas.InternalServerErrorResponse.properties.error.allOf).toBeDefined();
  });
});
