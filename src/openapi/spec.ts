type OpenApiSpec = typeof openApiSpecTemplate & {
  servers: Array<{
    url: string;
    description: string;
  }>;
};

export function createOpenApiSpec(serverUrl = '/'): OpenApiSpec {
  return {
    ...openApiSpecTemplate,
    servers: [
      {
        url: serverUrl,
        description: serverUrl === '/' ? 'Current HTTP origin' : 'Current HTTP transport endpoint',
      },
    ],
  };
}

const openApiSpecTemplate = {
  openapi: '3.1.0',
  info: {
    title: 'workflow-os MCP HTTP API',
    version: '1.0.0',
    description:
      'OpenAPI documentation for the workflow-os MCP HTTP transport. ' +
      'This server exposes MCP over HTTP using JSON-RPC and SSE semantics rather than a conventional REST resource model.',
  },
  tags: [
    {
      name: 'Operational',
      description: 'Operational and health-check endpoints.',
    },
    {
      name: 'MCP',
      description: 'MCP transport endpoints exposed over HTTP.',
    },
    {
      name: 'Documentation',
      description: 'Interactive API documentation and raw OpenAPI spec.',
    },
  ],
  paths: {
    '/health': {
      get: {
        tags: ['Operational'],
        summary: 'Health check',
        description: 'Returns a liveness/readiness response for the HTTP transport.',
        operationId: 'getHealth',
        responses: {
          '200': {
            description: 'Service is healthy.',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/HealthResponse',
                },
              },
            },
          },
        },
      },
    },
    '/mcp': {
      post: {
        tags: ['MCP'],
        summary: 'Send an MCP JSON-RPC message',
        description:
          'Accepts an MCP/JSON-RPC request or notification over HTTP. ' +
          'Depending on the MCP interaction pattern, the response may be JSON or stream-oriented transport output.',
        operationId: 'postMcp',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/JsonRpcMessage',
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'MCP response payload.',
            content: {
              'application/json': {
                schema: {
                  oneOf: [
                    { $ref: '#/components/schemas/JsonRpcSuccessResponse' },
                    { $ref: '#/components/schemas/JsonRpcErrorResponse' },
                  ],
                },
              },
              'text/event-stream': {
                schema: {
                  type: 'string',
                  description: 'SSE transport stream returned for streamable MCP responses.',
                },
              },
            },
          },
          '400': {
            description: 'Invalid MCP or JSON-RPC request.',
          },
          '500': {
            description: 'Unhandled server-side transport error.',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/InternalServerError',
                },
              },
            },
          },
        },
      },
      get: {
        tags: ['MCP'],
        summary: 'Open MCP SSE stream',
        description:
          'Opens a streamable MCP SSE connection. This endpoint is stream-oriented and should not be treated as a standard REST GET.',
        operationId: 'getMcpStream',
        responses: {
          '200': {
            description: 'SSE stream established.',
            content: {
              'text/event-stream': {
                schema: {
                  type: 'string',
                  description: 'Server-sent event stream carrying MCP transport messages.',
                },
              },
            },
          },
          '500': {
            description: 'Unhandled server-side transport error.',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/InternalServerError',
                },
              },
            },
          },
        },
      },
      delete: {
        tags: ['MCP'],
        summary: 'Close or tear down an MCP session',
        description:
          'Handles MCP session teardown. In this server implementation, HTTP mode is stateless per request, so this behaves as a no-op transport cleanup endpoint.',
        operationId: 'deleteMcpSession',
        responses: {
          '200': {
            description: 'Session teardown request accepted or handled.',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  additionalProperties: true,
                  description: 'Implementation-defined transport response payload.',
                },
              },
              'text/event-stream': {
                schema: {
                  type: 'string',
                  description: 'Possible stream-oriented transport output.',
                },
              },
            },
          },
          '500': {
            description: 'Unhandled server-side transport error.',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/InternalServerError',
                },
              },
            },
          },
        },
      },
    },
    '/docs-api.json': {
      get: {
        tags: ['Documentation'],
        summary: 'Get raw OpenAPI document',
        description: 'Returns the canonical OpenAPI document for this HTTP API in JSON format.',
        operationId: 'getOpenApiDocument',
        responses: {
          '200': {
            description: 'OpenAPI document.',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  additionalProperties: true,
                },
              },
            },
          },
        },
      },
    },
  },
  components: {
    schemas: {
      HealthResponse: {
        type: 'object',
        additionalProperties: false,
        required: ['status', 'service', 'transport'],
        properties: {
          status: { type: 'string', const: 'ok' },
          service: { type: 'string', const: 'workflow-os-mcp' },
          transport: { type: 'string', const: 'http' },
        },
      },
      JsonRpcId: {
        oneOf: [{ type: 'string' }, { type: 'integer' }, { type: 'null' }],
      },
      JsonRpcParams: {
        type: 'object',
        additionalProperties: true,
        description: 'Flexible MCP/JSON-RPC params object.',
      },
      JsonRpcResult: {
        type: 'object',
        additionalProperties: true,
        description: 'Flexible MCP/JSON-RPC result object.',
      },
      JsonRpcErrorObject: {
        type: 'object',
        required: ['code', 'message'],
        additionalProperties: false,
        properties: {
          code: { type: 'integer' },
          message: { type: 'string' },
          data: {
            type: 'object',
            additionalProperties: true,
            description: 'Implementation-defined JSON-RPC error details.',
          },
        },
      },
      JsonRpcRequest: {
        type: 'object',
        additionalProperties: false,
        required: ['jsonrpc', 'method', 'id'],
        properties: {
          jsonrpc: { type: 'string', const: '2.0' },
          id: { $ref: '#/components/schemas/JsonRpcId' },
          method: { type: 'string' },
          params: { $ref: '#/components/schemas/JsonRpcParams' },
        },
      },
      JsonRpcNotification: {
        type: 'object',
        additionalProperties: false,
        required: ['jsonrpc', 'method'],
        properties: {
          jsonrpc: { type: 'string', const: '2.0' },
          method: { type: 'string' },
          params: { $ref: '#/components/schemas/JsonRpcParams' },
        },
      },
      JsonRpcSuccessResponse: {
        type: 'object',
        additionalProperties: false,
        required: ['jsonrpc', 'id', 'result'],
        properties: {
          jsonrpc: { type: 'string', const: '2.0' },
          id: { $ref: '#/components/schemas/JsonRpcId' },
          result: { $ref: '#/components/schemas/JsonRpcResult' },
        },
      },
      JsonRpcErrorResponse: {
        type: 'object',
        additionalProperties: false,
        required: ['jsonrpc', 'id', 'error'],
        properties: {
          jsonrpc: { type: 'string', const: '2.0' },
          id: { $ref: '#/components/schemas/JsonRpcId' },
          error: { $ref: '#/components/schemas/JsonRpcErrorObject' },
        },
      },
      JsonRpcMessage: {
        oneOf: [
          { $ref: '#/components/schemas/JsonRpcRequest' },
          { $ref: '#/components/schemas/JsonRpcNotification' },
          { $ref: '#/components/schemas/JsonRpcSuccessResponse' },
          { $ref: '#/components/schemas/JsonRpcErrorResponse' },
        ],
      },
      InternalServerError: {
        type: 'object',
        additionalProperties: false,
        required: ['error'],
        properties: {
          error: {
            type: 'string',
            const: 'Internal server error',
          },
        },
      },
    },
  },
} as const;

export const openApiSpec = createOpenApiSpec();
