import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { routeTask } from '../core/router.js';
import { log } from '../logger.js';
import { routeTaskInputSchema, routeTaskOutputSchema } from '../schemas/tools.js';
import { buildRouteTaskResult } from './transformers.js';

export function registerRouteTool(server: McpServer): void {
  server.registerTool(
    'route_task',
    {
      title: 'Route Task',
      description: 'Classify the task into mode + domain + sequence. Call this first before running any workflow.',
      inputSchema: routeTaskInputSchema,
      outputSchema: routeTaskOutputSchema,
    },
    (args) => {
      const routed = routeTask(args);
      log.info('route_task', { mode: routed.mode, domain: routed.domain, confidence: routed.confidence });

      return buildRouteTaskResult(routed);
    },
  );
}
