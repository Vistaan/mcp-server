import { z } from 'zod';
import { completable } from '@modelcontextprotocol/sdk/server/completable.js';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { buildPromptText } from '../core/output.js';

const DOMAINS = ['os', 'freelancing', 'products', 'content', 'execution', 'investing', 'utility'] as const;

export function registerModePrompts(server: McpServer): void {
  server.registerPrompt(
    'clarify_task',
    {
      title: 'Clarify Task',
      description: 'Clarify a fuzzy task into a concrete goal, constraints, and desired output.',
      argsSchema: {
        task: z.string().min(1).describe('The vague or unclear task to clarify'),
        goal: z.string().optional().describe('Optional goal context'),
        audience: z.string().optional().describe('Optional target audience'),
        constraints: z.array(z.string()).default([]).describe('Optional constraints'),
      },
    },
    ({ task, goal, audience, constraints }) => ({
      messages: [
        {
          role: 'user',
          content: { type: 'text', text: buildPromptText('clarify', 'auto', task, { goal, audience, constraints }) },
        },
      ],
    }),
  );

  server.registerPrompt(
    'strategize_task',
    {
      title: 'Strategize Task',
      description: 'Select the strongest direction, priorities, or plan.',
      argsSchema: {
        task: z.string().min(1).describe('Task or challenge to strategize'),
        domain: completable(z.enum(DOMAINS).default('products'), (value: string | undefined) =>
          DOMAINS.filter((d) => d.startsWith(value ?? '')),
        ),
        context: z.string().optional().describe('Additional context'),
      },
    },
    ({ task, domain, context }) => ({
      messages: [
        {
          role: 'user',
          content: { type: 'text', text: buildPromptText('strategy', domain, task, { context }) },
        },
      ],
    }),
  );

  server.registerPrompt(
    'build_output',
    {
      title: 'Build Output',
      description: 'Turn an idea into a concrete asset, plan, draft, or structure.',
      argsSchema: {
        task: z.string().min(1).describe('Idea or goal to convert into an asset'),
        domain: z.enum(DOMAINS).default('products'),
        context: z.string().optional().describe('Additional context'),
      },
    },
    ({ task, domain, context }) => ({
      messages: [
        {
          role: 'user',
          content: { type: 'text', text: buildPromptText('build', domain, task, { context }) },
        },
      ],
    }),
  );

  server.registerPrompt(
    'improve_persuasion',
    {
      title: 'Improve Persuasion',
      description: 'Strengthen messaging, copy, hooks, or positioning.',
      argsSchema: {
        task: z.string().min(1).describe('Content or messaging to improve'),
        audience: z.string().optional().describe('Target audience'),
        platform: z.string().optional().describe('Publishing platform'),
      },
    },
    ({ task, audience, platform }) => ({
      messages: [
        {
          role: 'user',
          content: { type: 'text', text: buildPromptText('persuasion', 'content', task, { audience, platform }) },
        },
      ],
    }),
  );

  server.registerPrompt(
    'force_execution',
    {
      title: 'Force Execution',
      description: 'Reduce overwhelm and force immediate action.',
      argsSchema: {
        task: z.string().min(1).describe('Blocked task or overwhelming situation'),
        energy_level: z.enum(['low', 'medium', 'high']).default('medium').describe('Current energy level'),
      },
    },
    ({ task, energy_level }) => ({
      messages: [
        {
          role: 'user',
          content: { type: 'text', text: buildPromptText('execution', 'execution', task, { energy_level }) },
        },
      ],
    }),
  );

  server.registerPrompt(
    'review_optimize',
    {
      title: 'Review and Optimize',
      description: 'Tighten an existing output without unnecessary expansion.',
      argsSchema: {
        task: z.string().min(1).describe('Output to review and optimize'),
        domain: z.enum(DOMAINS).default('utility'),
        content: z.string().optional().describe('The existing draft or content to review'),
      },
    },
    ({ task, domain, content }) => ({
      messages: [
        {
          role: 'user',
          content: { type: 'text', text: buildPromptText('review', domain, task, { content }) },
        },
      ],
    }),
  );
}
