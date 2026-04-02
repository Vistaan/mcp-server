import { beforeEach, describe, expect, it, vi } from 'vitest';
import { registerApplyTool } from '../../../src/tools/apply.js';
import { registerGenerateTool } from '../../../src/tools/generate.js';
import { registerRouteTool } from '../../../src/tools/route.js';
import { registerRunTool } from '../../../src/tools/run.js';
import { registerSelectTool } from '../../../src/tools/select.js';
import { registerTools } from '../../../src/tools/index.js';

const { infoMock } = vi.hoisted(() => ({
  infoMock: vi.fn(),
}));

vi.mock('../../../src/logger.js', () => ({
  log: { info: infoMock },
}));

type ToolHandler = (args: Record<string, unknown>) => unknown;

function createToolServer() {
  const tools = new Map<string, ToolHandler>();
  const server = {
    registerTool: vi.fn((name: string, _config: unknown, handler: ToolHandler) => {
      tools.set(name, handler);
    }),
  };

  return { server, tools };
}

describe('tool registration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('registers route_task and returns structured routing output', () => {
    const { server, tools } = createToolServer();

    registerRouteTool(server as never);

    expect(server.registerTool).toHaveBeenCalledTimes(1);

    const result = tools.get('route_task')?.({
      task: 'validate a SaaS idea',
      preferred_mode: 'auto',
      preferred_domain: 'auto',
      constraints: [],
    }) as { structuredContent: Record<string, unknown> };

    expect(result.structuredContent['domain']).toBe('products');
    expect(result.structuredContent['mode']).toBeDefined();
    expect(infoMock).toHaveBeenCalledWith('route_task', expect.objectContaining({ domain: 'products' }));
  });

  it('registers select_domain_workflow and returns resource metadata', () => {
    const { server, tools } = createToolServer();

    registerSelectTool(server as never);

    expect(server.registerTool).toHaveBeenCalledTimes(1);

    const result = tools.get('select_domain_workflow')?.({
      domain: 'products',
      stage: 'idea',
    }) as { structuredContent: Record<string, unknown> };

    expect(result.structuredContent['resource_uri']).toBe('workflow://products/v4');
    expect(result.structuredContent['subsection_uri']).toBe('workflow://products/v4/execution/sequence');
  });

  it('registers run_workflow_sequence and returns structured execution output', async () => {
    const { server, tools } = createToolServer();

    registerRunTool(server as never);

    expect(server.registerTool).toHaveBeenCalledTimes(1);

    const withNext = (await tools.get('run_workflow_sequence')?.({
      mode: 'build',
      domain: 'products',
      task: 'launch a productized service',
      stage: 'pricing',
      context: 'for solo founders',
      optimize_once: true,
      next_action_required: true,
    })) as { structuredContent: Record<string, unknown> };

    const withoutNext = (await tools.get('run_workflow_sequence')?.({
      mode: 'build',
      domain: 'products',
      task: 'launch a productized service',
      stage: 'auto',
      optimize_once: false,
      next_action_required: false,
    })) as { structuredContent: Record<string, unknown> };

    expect(String(withNext.structuredContent['execution_summary'])).toContain('launch a productized service');
    expect(withNext.structuredContent['workflow_reference']).toBe('workflow://products/v4');
    expect(String(withNext.structuredContent['stage_outcome']).toLowerCase()).toContain('price');
    expect(Array.isArray(withNext.structuredContent['recommendations'])).toBe(true);
    expect(Array.isArray(withNext.structuredContent['supporting_notes'])).toBe(true);
    expect(withNext.structuredContent['optimization_applied']).toBe(true);
    expect(withNext.structuredContent['next_action']).not.toBe('No next action requested.');
    expect(withoutNext.structuredContent['next_action']).toBe('No next action requested.');
    expect(infoMock).toHaveBeenCalledWith('run_workflow_sequence', expect.objectContaining({ domain: 'products' }));
  });

  it('registers apply_utility_prompt and returns a transformed asset with issues', async () => {
    const { server, tools } = createToolServer();

    registerApplyTool(server as never);

    expect(server.registerTool).toHaveBeenCalledTimes(1);

    const result = (await tools.get('apply_utility_prompt')?.({
      utility_name: 'clarity_rewrite',
      content: 'maybe this could work',
      context: 'for landing page copy',
    })) as { structuredContent: Record<string, unknown> };

    expect(String(result.structuredContent['revised_content'])).not.toContain('[Utility applied: clarity_rewrite]');
    expect(String(result.structuredContent['revised_content'])).toContain('for landing page copy');
    expect(Array.isArray(result.structuredContent['issues_found'])).toBe(true);
    expect(Array.isArray(result.structuredContent['changes_applied'])).toBe(true);
  });

  it('registers generate_next_action and produces one immediate next step', () => {
    const { server, tools } = createToolServer();

    registerGenerateTool(server as never);

    expect(server.registerTool).toHaveBeenCalledTimes(1);

    const result = tools.get('generate_next_action')?.({
      domain: 'products',
      current_output: 'Validated problem statement and offer draft',
      constraints: ['no budget'],
    }) as { structuredContent: Record<string, unknown> };

    expect(String(result.structuredContent['next_action'])).toContain('while respecting: no budget');
    expect(String(result.structuredContent['why_this_next'])).toContain('smallest concrete move');
  });

  it('registers all tools together', () => {
    const { server } = createToolServer();

    registerTools(server as never);

    expect(server.registerTool).toHaveBeenCalledTimes(5);
  });
});
