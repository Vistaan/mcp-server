import { errorMessageForCode } from '../transports/contracts.js';

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
                  $ref: '#/components/schemas/HealthOkResponse',
                },
              },
            },
          },
          '503': {
            description: 'Service is running but required workflow files are unavailable.',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/HealthDegradedResponse',
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
                  $ref: '#/components/schemas/InternalServerErrorResponse',
                },
              },
            },
          },
          '503': {
            description: 'Workflow files are unavailable.',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/WorkflowUnavailableErrorResponse',
                },
              },
            },
          },
          '504': {
            description: 'Request timed out.',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/RequestTimeoutErrorResponse',
                },
              },
            },
          },
          '408': {
            description: 'Client aborted the request.',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/RequestAbortedErrorResponse',
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
                  $ref: '#/components/schemas/InternalServerErrorResponse',
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
                  $ref: '#/components/schemas/InternalServerErrorResponse',
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
    '/metrics': {
      get: {
        tags: ['Operational'],
        summary: 'Get in-process metrics snapshot',
        description: 'Returns lightweight in-memory counters and duration aggregates for the HTTP transport.',
        operationId: 'getMetrics',
        responses: {
          '200': {
            description: 'Metrics snapshot.',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/MetricsResponse',
                },
              },
            },
          },
        },
      },
    },
    '/metrics/prometheus': {
      get: {
        tags: ['Operational'],
        summary: 'Get Prometheus-compatible metrics',
        description: 'Returns the current in-process metrics in Prometheus text exposition format.',
        operationId: 'getPrometheusMetrics',
        responses: {
          '200': {
            description: 'Prometheus metrics payload.',
            content: {
              'text/plain': {
                schema: {
                  type: 'string',
                },
              },
            },
          },
        },
      },
    },
    '/docs': {
      get: {
        tags: ['Documentation'],
        summary: 'Open interactive Swagger UI',
        description: 'Serves the interactive Swagger UI for exploring the workflow-os MCP HTTP API.',
        operationId: 'getSwaggerUi',
        responses: {
          '200': {
            description: 'Swagger UI HTML page.',
            content: {
              'text/html': {
                schema: {
                  type: 'string',
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
      HealthBase: {
        type: 'object',
        additionalProperties: false,
        required: ['status', 'service', 'transport', 'workflow_root', 'missing_workflows', 'checked_at'],
        properties: {
          status: { type: 'string', enum: ['ok', 'degraded'] },
          service: { type: 'string', const: 'workflow-os-mcp' },
          transport: { type: 'string', const: 'http' },
          workflow_root: { type: 'string' },
          missing_workflows: {
            type: 'array',
            items: { type: 'string' },
          },
          checked_at: { type: 'string', format: 'date-time' },
        },
      },
      HealthOkResponse: {
        allOf: [{ $ref: '#/components/schemas/HealthBase' }],
        properties: {
          status: { type: 'string', const: 'ok' },
        },
      },
      HealthDegradedResponse: {
        allOf: [{ $ref: '#/components/schemas/HealthBase' }],
        properties: {
          status: { type: 'string', const: 'degraded' },
        },
      },
      MetricsDurationSummary: {
        type: 'object',
        additionalProperties: false,
        required: ['count', 'total_ms', 'avg_ms', 'min_ms', 'max_ms'],
        properties: {
          count: { type: 'integer' },
          total_ms: { type: 'number' },
          avg_ms: { type: 'number' },
          min_ms: { type: 'number' },
          max_ms: { type: 'number' },
        },
      },
      MetricsResponse: {
        type: 'object',
        additionalProperties: false,
        required: ['service', 'transport', 'counters', 'durations'],
        properties: {
          service: { type: 'string', const: 'workflow-os-mcp' },
          transport: { type: 'string', const: 'http' },
          counters: {
            type: 'object',
            additionalProperties: { type: 'integer' },
          },
          durations: {
            type: 'object',
            additionalProperties: {
              $ref: '#/components/schemas/MetricsDurationSummary',
            },
          },
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
      ErrorBody: {
        type: 'object',
        additionalProperties: false,
        required: ['code', 'message', 'request_id'],
        properties: {
          code: {
            type: 'string',
            enum: ['workflow_unavailable', 'request_aborted', 'request_timeout', 'internal'],
          },
          message: { type: 'string' },
          request_id: { type: 'string' },
        },
      },
      InternalServerErrorResponse: {
        type: 'object',
        additionalProperties: false,
        required: ['error'],
        properties: {
          error: {
            allOf: [{ $ref: '#/components/schemas/ErrorBody' }],
            properties: {
              code: { type: 'string', const: 'internal' },
              message: { type: 'string', const: errorMessageForCode('internal') },
            },
          },
        },
      },
      WorkflowUnavailableErrorResponse: {
        type: 'object',
        additionalProperties: false,
        required: ['error'],
        properties: {
          error: {
            allOf: [{ $ref: '#/components/schemas/ErrorBody' }],
            properties: {
              code: { type: 'string', const: 'workflow_unavailable' },
              message: { type: 'string', const: errorMessageForCode('workflow_unavailable') },
            },
          },
        },
      },
      RequestTimeoutErrorResponse: {
        type: 'object',
        additionalProperties: false,
        required: ['error'],
        properties: {
          error: {
            allOf: [{ $ref: '#/components/schemas/ErrorBody' }],
            properties: {
              code: { type: 'string', const: 'request_timeout' },
              message: { type: 'string', const: errorMessageForCode('request_timeout') },
            },
          },
        },
      },
      RequestAbortedErrorResponse: {
        type: 'object',
        additionalProperties: false,
        required: ['error'],
        properties: {
          error: {
            allOf: [{ $ref: '#/components/schemas/ErrorBody' }],
            properties: {
              code: { type: 'string', const: 'request_aborted' },
              message: { type: 'string', const: errorMessageForCode('request_aborted') },
            },
          },
        },
      },
    },
  },
} as const;

export const openApiSpec = createOpenApiSpec();
