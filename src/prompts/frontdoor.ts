import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { buildPromptText } from '../core/output.js';
import type { Mode } from '../schemas/types.js';

export function registerFrontdoorPrompt(server: McpServer): void {
  server.registerPrompt(
    'route_and_run',
    {
      title: 'Route and Run',
      description:
        'Front-door prompt: classify the task, select one workflow, run it, and end with one immediate next action.',
      argsSchema: {
        task: z.string().min(1).describe('The task or request to route and execute'),
        goal: z.string().optional().describe('Desired outcome'),
        audience: z.string().optional().describe('Target audience'),
        constraints: z.array(z.string()).default([]).describe('List of constraints'),
        preferred_mode: z
          .enum(['auto', 'clarify', 'strategy', 'build', 'persuasion', 'execution', 'review'])
          .default('auto')
          .describe('Override the mode selection'),
        preferred_domain: z
          .enum(['auto', 'os', 'freelancing', 'products', 'content', 'execution', 'investing', 'utility'])
          .default('auto')
          .describe('Override the domain selection'),
      },
    },
    ({ task, goal, audience, constraints, preferred_mode, preferred_domain }) => {
      const resolvedMode: Mode = preferred_mode === 'auto' ? 'clarify' : preferred_mode;
      return {
        messages: [
          {
            role: 'user',
            content: {
              type: 'text',
              text: buildPromptText(resolvedMode, preferred_domain, task, {
                goal,
                audience,
                constraints,
                preferred_mode,
                preferred_domain,
              }),
            },
          },
        ],
      };
    },
  );
}
