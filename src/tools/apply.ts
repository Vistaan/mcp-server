import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { inferUtilityIssues } from '../core/output.js';
import { applyUtilityPromptInputSchema, applyUtilityPromptOutputSchema } from '../schemas/tools.js';
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
    (args) => {
      const issuesFound = inferUtilityIssues(args.utility_name, args.content);
      const revisedContent = [
        args.content,
        '',
        `[Utility applied: ${args.utility_name}]`,
        args.context ? `Context: ${args.context}` : undefined,
      ]
        .filter((line) => line !== undefined)
        .join('\n');

      return buildApplyUtilityPromptResult({
        utility_name: args.utility_name,
        revised_content: revisedContent,
        issues_found: issuesFound,
      });
    },
  );
}
