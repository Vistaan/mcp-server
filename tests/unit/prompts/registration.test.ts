import { describe, it, expect, vi } from 'vitest';
import { registerModePrompts } from '../../../src/prompts/mode.js';
import { registerDomainPrompts } from '../../../src/prompts/domain.js';
import { registerFrontdoorPrompt } from '../../../src/prompts/frontdoor.js';
import { registerPrompts } from '../../../src/prompts/index.js';

type PromptHandler = (args: Record<string, unknown>) => {
  messages: Array<{ role: string; content: { type: string; text: string } }>;
};

function createPromptServer() {
  const prompts = new Map<string, PromptHandler>();
  const server = {
    registerPrompt: vi.fn((name: string, _meta: unknown, handler: PromptHandler) => {
      prompts.set(name, handler);
    }),
  };

  return { server, prompts };
}

describe('prompt registration', () => {
  it('registers mode prompts and builds prompt messages', () => {
    const { server, prompts } = createPromptServer();

    registerModePrompts(server as never);

    expect(server.registerPrompt).toHaveBeenCalledTimes(6);
    expect(prompts.get('clarify_task')?.({ task: 'clarify this' }).messages[0]?.content.text).toContain('clarify this');
    expect(
      prompts.get('strategize_task')?.({ task: 'plan this', domain: 'products', context: 'launch' }).messages[0]
        ?.content.text,
    ).toContain('plan this');
    expect(prompts.get('build_output')?.({ task: 'ship it', domain: 'products' }).messages[0]?.content.text).toContain(
      'ship it',
    );
    expect(
      prompts.get('improve_persuasion')?.({ task: 'rewrite copy', audience: 'founders' }).messages[0]?.content.text,
    ).toContain('rewrite copy');
    expect(
      prompts.get('force_execution')?.({ task: 'finish docs', energy_level: 'low' }).messages[0]?.content.text,
    ).toContain('finish docs');
    expect(
      prompts.get('review_optimize')?.({ task: 'tighten draft', domain: 'utility', content: 'draft' }).messages[0]
        ?.content.text,
    ).toContain('tighten draft');
  });

  it('registers domain prompts and builds prompt messages', () => {
    const { server, prompts } = createPromptServer();

    registerDomainPrompts(server as never);

    expect(server.registerPrompt).toHaveBeenCalledTimes(6);
    expect(
      prompts.get('run_freelancing_workflow')?.({ task: 'get clients', stage: 'offer', context: 'design' }).messages[0]
        ?.content.text,
    ).toContain('get clients');
    expect(
      prompts.get('run_products_workflow')?.({ task: 'validate app', stage: 'idea', context: 'B2B' }).messages[0]
        ?.content.text,
    ).toContain('validate app');
    expect(
      prompts.get('run_content_workflow')?.({
        task: 'write thread',
        stage: 'hooks',
        platform: 'X',
        audience: 'developers',
      }).messages[0]?.content.text,
    ).toContain('write thread');
    expect(
      prompts.get('run_execution_workflow')?.({ task: 'stop procrastinating', stage: 'do_now', energy_level: 'high' })
        .messages[0]?.content.text,
    ).toContain('stop procrastinating');
    expect(
      prompts.get('run_investing_workflow')?.({ task: 'analyze stock', stage: 'analyze', ticker: 'NVDA' }).messages[0]
        ?.content.text,
    ).toContain('analyze stock');
    expect(
      prompts.get('run_utility_workflow')?.({
        task: 'improve draft',
        utility_name: 'clarity_rewrite',
        content: 'draft',
      }).messages[0]?.content.text,
    ).toContain('improve draft');
  });

  it('registers the frontdoor prompt and resolves auto mode to clarify', () => {
    const { server, prompts } = createPromptServer();

    registerFrontdoorPrompt(server as never);

    expect(server.registerPrompt).toHaveBeenCalledTimes(1);

    const autoText = prompts.get('route_and_run')?.({
      task: 'help me',
      goal: 'ship',
      audience: 'users',
      constraints: ['fast'],
      preferred_mode: 'auto',
      preferred_domain: 'auto',
    }).messages[0]?.content.text;

    const explicitText = prompts.get('route_and_run')?.({
      task: 'help me',
      preferred_mode: 'strategy',
      preferred_domain: 'products',
      constraints: [],
    }).messages[0]?.content.text;

    expect(autoText).toContain('help me');
    expect(explicitText).toContain('help me');
    expect(autoText).not.toEqual(explicitText);
  });

  it('registers all prompt groups together', () => {
    const { server } = createPromptServer();

    registerPrompts(server as never);

    expect(server.registerPrompt).toHaveBeenCalledTimes(13);
  });
});
