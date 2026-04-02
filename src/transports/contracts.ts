import type { MetricsSnapshot } from '../metrics.js';

export type ServiceStatus = 'ok' | 'degraded';

export type HttpErrorCode = 'workflow_unavailable' | 'request_aborted' | 'request_timeout' | 'internal';

export type HealthResponse = {
  status: ServiceStatus;
  service: 'workflow-os-mcp';
  transport: 'http';
  workflow_root: string;
  missing_workflows: string[];
  checked_at: string;
};

export type HttpErrorResponse = {
  error: {
    code: HttpErrorCode;
    message: string;
    request_id: string;
  };
};

export type MetricsResponse = MetricsSnapshot & {
  service: 'workflow-os-mcp';
  transport: 'http';
};

export function buildHealthResponse(input: {
  status: ServiceStatus;
  workflowRoot: string;
  missingFiles: string[];
  checkedAt: string;
}): HealthResponse {
  return {
    status: input.status,
    service: 'workflow-os-mcp',
    transport: 'http',
    workflow_root: input.workflowRoot,
    missing_workflows: input.missingFiles,
    checked_at: input.checkedAt,
  };
}

export function buildHttpErrorResponse(code: HttpErrorCode, requestId: string): HttpErrorResponse {
  return {
    error: {
      code,
      message: errorMessageForCode(code),
      request_id: requestId,
    },
  };
}

export function errorMessageForCode(code: HttpErrorCode): string {
  switch (code) {
    case 'workflow_unavailable':
      return 'Workflow resources unavailable';
    case 'request_aborted':
      return 'Request aborted by client';
    case 'request_timeout':
      return 'Request timed out';
    case 'internal':
    default:
      return 'Internal server error';
  }
}

export function buildMetricsResponse(snapshot: MetricsSnapshot): MetricsResponse {
  return {
    service: 'workflow-os-mcp',
    transport: 'http',
    ...snapshot,
  };
}
