import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { DOMAIN_URI_MAP } from '../core/catalog.js';
import { normalizeStage } from '../core/normalizer.js';
import { toToolResult } from '../core/output.js';
import { selectDomainWorkflowInputSchema, selectDomainWorkflowOutputSchema } from '../schemas/tools.js';

export function registerSelectTool(server: McpServer): void {
  server.registerTool(
    'select_domain_workflow',
    {
      title: 'Select Domain Workflow',
      description: 'Resolve which workflow file/resource and stage to use for a given domain.',
      inputSchema: selectDomainWorkflowInputSchema,
      outputSchema: selectDomainWorkflowOutputSchema,
    },
    async (args) => {
      const stage = normalizeStage(args.domain, args.stage);
      const resourceUri = DOMAIN_URI_MAP[args.domain];

      return toToolResult({
        resource_uri: resourceUri,
        subsection_uri: stage !== 'auto' ? `${resourceUri}/execution/sequence` : undefined,
        stage,
        command_format: 'RUN: <mode> | <domain> | <task> | <stage?> | <constraints?>',
        response_shape: '{ mode, domain, main_deliverable, supporting_notes?, optimization_applied, next_action }',
      });
    },
  );
}
