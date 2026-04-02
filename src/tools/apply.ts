import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { applyUtilityPromptInputSchema, applyUtilityPromptOutputSchema } from '../schemas/tools.js';
import { applyUtility } from '../services/workflows.js';
import { buildApplyUtilityPromptResult } from './transformers.js';

export function registerApplyTool(server: McpServer): void {
  server.registerTool(
    'apply_utility_prompt',
    {
      title: 'Apply Utility Prompt',
      description:
        'Apply one supporting utility after a primary workflow has run. ' +
        'Utilities are subordinate — never use this as a primary entry point.',
      inputSchema: applyUtilityPromptInputSchema,
      outputSchema: applyUtilityPromptOutputSchema,
    },
    async (args) => {
      const output = await applyUtility({
        utilityName: args.utility_name,
        content: args.content,
        ...(args.context ? { context: args.context } : {}),
      });
      return buildApplyUtilityPromptResult({
        utility_name: output.utilityName,
        operation: output.operation,
        original_content: output.originalContent,
        revised_content: output.revisedContent,
        issues_found: output.issuesFound,
        changes_applied: output.changesApplied,
        next_action: output.nextAction,
      });
    },
  );
}
