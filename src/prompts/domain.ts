import { z } from 'zod';
import { completable } from '@modelcontextprotocol/sdk/server/completable.js';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { buildPromptText } from '../core/output.js';
import { DOMAIN_SEQUENCES } from '../core/catalog.js';

export function registerDomainPrompts(server: McpServer): void {
  server.registerPrompt(
    'run_freelancing_workflow',
    {
      title: 'Run Freelancing Workflow',
      description: 'Run the freelancing chain from skill or niche through premium offer growth.',
      argsSchema: {
        task: z.string().min(1).describe('Freelancing task or challenge'),
        stage: completable(z.string().default('auto'), (value: string | undefined) =>
          ['auto', ...DOMAIN_SEQUENCES.freelancing].filter((s) => s.startsWith(value ?? '')),
        ),
        context: z.string().optional().describe('Skills, niche, constraints'),
      },
    },
    ({ task, stage, context }) => ({
      messages: [
        {
          role: 'user',
          content: { type: 'text', text: buildPromptText('build', 'freelancing', task, { stage, context }) },
        },
      ],
    }),
  );

  server.registerPrompt(
    'run_products_workflow',
    {
      title: 'Run Products Workflow',
      description: 'Run the products chain from idea through first sale.',
      argsSchema: {
        task: z.string().min(1).describe('Product idea or challenge'),
        stage: completable(z.string().default('auto'), (value: string | undefined) =>
          ['auto', ...DOMAIN_SEQUENCES.products].filter((s) => s.startsWith(value ?? '')),
        ),
        context: z.string().optional().describe('Audience, constraints, idea details'),
      },
    },
    ({ task, stage, context }) => ({
      messages: [
        {
          role: 'user',
          content: { type: 'text', text: buildPromptText('strategy', 'products', task, { stage, context }) },
        },
      ],
    }),
  );

  server.registerPrompt(
    'run_content_workflow',
    {
      title: 'Run Content Workflow',
      description: 'Run the content chain from audience pain through optimization.',
      argsSchema: {
        task: z.string().min(1).describe('Content goal or copy challenge'),
        stage: completable(z.string().default('auto'), (value: string | undefined) =>
          ['auto', ...DOMAIN_SEQUENCES.content].filter((s) => s.startsWith(value ?? '')),
        ),
        platform: z.string().optional().describe('Publishing platform (e.g. LinkedIn, Twitter)'),
        audience: z.string().optional().describe('Target audience description'),
      },
    },
    ({ task, stage, platform, audience }) => ({
      messages: [
        {
          role: 'user',
          content: {
            type: 'text',
            text: buildPromptText('persuasion', 'content', task, { stage, platform, audience }),
          },
        },
      ],
    }),
  );

  server.registerPrompt(
    'run_execution_workflow',
    {
      title: 'Run Execution Workflow',
      description: 'Run the execution chain from do-now triage through momentum.',
      argsSchema: {
        task: z.string().min(1).describe('Blocked task, procrastination, or overwhelm situation'),
        stage: completable(z.string().default('auto'), (value: string | undefined) =>
          ['auto', ...DOMAIN_SEQUENCES.execution].filter((s) => s.startsWith(value ?? '')),
        ),
        energy_level: z.enum(['low', 'medium', 'high']).default('medium').describe('Current energy level'),
      },
    },
    ({ task, stage, energy_level }) => ({
      messages: [
        {
          role: 'user',
          content: {
            type: 'text',
            text: buildPromptText('execution', 'execution', task, { stage, energy_level }),
          },
        },
      ],
    }),
  );

  server.registerPrompt(
    'run_investing_workflow',
    {
      title: 'Run Investing Workflow',
      description: 'Run the investing chain from analysis through a repeatable system.',
      argsSchema: {
        task: z.string().min(1).describe('Investing task, stock analysis, or trade setup'),
        stage: completable(z.string().default('auto'), (value: string | undefined) =>
          ['auto', ...DOMAIN_SEQUENCES.investing].filter((s) => s.startsWith(value ?? '')),
        ),
        ticker: z.string().optional().describe('Stock ticker symbol'),
      },
    },
    ({ task, stage, ticker }) => ({
      messages: [
        {
          role: 'user',
          content: { type: 'text', text: buildPromptText('strategy', 'investing', task, { stage, ticker }) },
        },
      ],
    }),
  );

  server.registerPrompt(
    'run_utility_workflow',
    {
      title: 'Run Utility Workflow',
      description: 'Apply one supporting utility after a primary workflow.',
      argsSchema: {
        task: z.string().min(1).describe('Utility task description'),
        utility_name: completable(z.string(), (value: string | undefined) =>
          DOMAIN_SEQUENCES.utility.filter((s) => s.startsWith(value ?? '')),
        ),
        content: z.string().optional().describe('Draft or output to apply the utility to'),
      },
    },
    ({ task, utility_name, content }) => ({
      messages: [
        {
          role: 'user',
          content: { type: 'text', text: buildPromptText('review', 'utility', task, { utility_name, content }) },
        },
      ],
    }),
  );

  server.registerPrompt(
    'run_pentest_web_workflow',
    {
      title: 'Run Web App Pentest Workflow',
      description: 'Run the web application penetration testing workflow following OWASP standards.',
      argsSchema: {
        task: z.string().min(1).describe('Web application security assessment task'),
        stage: completable(z.string().default('auto'), (value: string | undefined) =>
          ['auto', ...DOMAIN_SEQUENCES['pentest-web']].filter((s) => s.startsWith(value ?? '')),
        ),
        target: z.string().optional().describe('Target URL or application name'),
      },
    },
    ({ task, stage, target }) => ({
      messages: [
        {
          role: 'user',
          content: { type: 'text', text: buildPromptText('review', 'pentest-web', task, { stage, target }) },
        },
      ],
    }),
  );

  server.registerPrompt(
    'run_pentest_mobile_workflow',
    {
      title: 'Run Mobile App Pentest Workflow',
      description: 'Run the mobile application penetration testing workflow following OWASP MASVS.',
      argsSchema: {
        task: z.string().min(1).describe('Mobile application security assessment task'),
        stage: completable(z.string().default('auto'), (value: string | undefined) =>
          ['auto', ...DOMAIN_SEQUENCES['pentest-mobile']].filter((s) => s.startsWith(value ?? '')),
        ),
        platform: z.enum(['iOS', 'Android', 'both']).default('both').describe('Target mobile platform'),
      },
    },
    ({ task, stage, platform }) => ({
      messages: [
        {
          role: 'user',
          content: { type: 'text', text: buildPromptText('review', 'pentest-mobile', task, { stage, platform }) },
        },
      ],
    }),
  );

  server.registerPrompt(
    'run_pentest_api_workflow',
    {
      title: 'Run API Pentest Workflow',
      description: 'Run the API penetration testing workflow following OWASP API Security Top 10.',
      argsSchema: {
        task: z.string().min(1).describe('API security assessment task'),
        stage: completable(z.string().default('auto'), (value: string | undefined) =>
          ['auto', ...DOMAIN_SEQUENCES['pentest-api']].filter((s) => s.startsWith(value ?? '')),
        ),
        spec: z.string().optional().describe('OpenAPI/Swagger/GraphQL spec or API documentation'),
      },
    },
    ({ task, stage, spec }) => ({
      messages: [
        {
          role: 'user',
          content: { type: 'text', text: buildPromptText('review', 'pentest-api', task, { stage, spec }) },
        },
      ],
    }),
  );

  server.registerPrompt(
    'run_pentest_infra_workflow',
    {
      title: 'Run Infrastructure Pentest Workflow',
      description: 'Run the infrastructure penetration testing workflow following PTES and MITRE ATT&CK.',
      argsSchema: {
        task: z.string().min(1).describe('Infrastructure security assessment task'),
        stage: completable(z.string().default('auto'), (value: string | undefined) =>
          ['auto', ...DOMAIN_SEQUENCES['pentest-infra']].filter((s) => s.startsWith(value ?? '')),
        ),
        assets: z.string().optional().describe('IP ranges, hostnames, cloud accounts, or container clusters'),
      },
    },
    ({ task, stage, assets }) => ({
      messages: [
        {
          role: 'user',
          content: { type: 'text', text: buildPromptText('review', 'pentest-infra', task, { stage, assets }) },
        },
      ],
    }),
  );
}
