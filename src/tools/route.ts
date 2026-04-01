import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { routeTask } from '../core/router.js';
import { toToolResult } from '../core/output.js';
import { log } from '../logger.js';
import { routeTaskInputSchema, routeTaskOutputSchema } from '../schemas/tools.js';

export function registerRouteTool(server: McpServer): void {
  server.registerTool(
    'route_task',
    {
      title: 'Route Task',
      description: 'Classify the task into mode + domain + sequence. Call this first before running any workflow.',
      inputSchema: routeTaskInputSchema,
      outputSchema: routeTaskOutputSchema,
    },
    async (args) => {
      const routed = routeTask(args);
      log.info('route_task', { mode: routed.mode, domain: routed.domain, confidence: routed.confidence });

      return toToolResult({
        mode: routed.mode,
        domain: routed.domain,
        confidence: routed.confidence,
        reason: routed.reason,
        sequence: routed.sequence,
        use_utility: routed.useUtility,
        utility_candidates: routed.utilityCandidates,
      });
    },
  );
}
