import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { makeNextAction, toToolResult } from '../core/output.js';
import { generateNextActionInputSchema, generateNextActionOutputSchema } from '../schemas/tools.js';

export function registerGenerateTool(server: McpServer): void {
  server.registerTool(
    'generate_next_action',
    {
      title: 'Generate Next Action',
      description: 'Return exactly one immediate concrete next step that advances the current workflow.',
      inputSchema: generateNextActionInputSchema,
      outputSchema: generateNextActionOutputSchema,
    },
    async (args) => {
      const nextAction = makeNextAction(args.domain ?? 'os', args.current_output, args.constraints);

      return toToolResult({
        next_action: nextAction,
        why_this_next:
          'It is the smallest concrete move that advances the current workflow without branching into multiple decisions.',
      });
    },
  );
}
