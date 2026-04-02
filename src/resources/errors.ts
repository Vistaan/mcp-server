export class WorkflowResourceError extends Error {
  readonly code: 'WORKFLOW_FILE_UNREADABLE' | 'WORKFLOW_SECTION_NOT_FOUND' | 'WORKFLOW_PARAM_INVALID';
  readonly details: Record<string, unknown> | undefined;

  constructor(
    code: WorkflowResourceError['code'],
    message: string,
    details?: Record<string, unknown>,
    options?: ErrorOptions,
  ) {
    super(message, options);
    this.name = 'WorkflowResourceError';
    this.code = code;
    this.details = details;
  }
}
