import { describe, it, expect } from 'vitest';
import {
  routeTaskInputSchema,
  routeTaskOutputSchema,
  selectDomainWorkflowInputSchema,
  runWorkflowSequenceInputSchema,
  applyUtilityPromptInputSchema,
  generateNextActionInputSchema,
} from '../../../src/schemas/tools.js';

describe('routeTaskInputSchema', () => {
  it('requires task field', () => {
    const result = routeTaskInputSchema.safeParse({});
    expect(result.success).toBe(false);
  });

  it('defaults preferred_mode and preferred_domain to auto', () => {
    const result = routeTaskInputSchema.parse({ task: 'test' });
    expect(result.preferred_mode).toBe('auto');
    expect(result.preferred_domain).toBe('auto');
  });

  it('defaults constraints to empty array', () => {
    const result = routeTaskInputSchema.parse({ task: 'test' });
    expect(result.constraints).toEqual([]);
  });

  it('rejects empty task string', () => {
    const result = routeTaskInputSchema.safeParse({ task: '' });
    expect(result.success).toBe(false);
  });
});

describe('routeTaskOutputSchema', () => {
  it('parses valid output', () => {
    const result = routeTaskOutputSchema.parse({
      mode: 'build',
      domain: 'products',
      confidence: 0.82,
      reason: 'detected products domain',
      sequence: ['idea', 'validate'],
      use_utility: false,
      utility_candidates: [],
    });
    expect(result.mode).toBe('build');
  });
});

describe('selectDomainWorkflowInputSchema', () => {
  it('requires domain field', () => {
    const result = selectDomainWorkflowInputSchema.safeParse({});
    expect(result.success).toBe(false);
  });

  it('allows optional stage', () => {
    const result = selectDomainWorkflowInputSchema.parse({ domain: 'products' });
    expect(result.stage).toBeUndefined();
  });
});

describe('runWorkflowSequenceInputSchema', () => {
  it('defaults stage to auto', () => {
    const result = runWorkflowSequenceInputSchema.parse({ mode: 'build', domain: 'products', task: 'test' });
    expect(result.stage).toBe('auto');
  });

  it('defaults optimize_once to true', () => {
    const result = runWorkflowSequenceInputSchema.parse({ mode: 'build', domain: 'products', task: 'test' });
    expect(result.optimize_once).toBe(true);
  });

  it('defaults next_action_required to true', () => {
    const result = runWorkflowSequenceInputSchema.parse({ mode: 'build', domain: 'products', task: 'test' });
    expect(result.next_action_required).toBe(true);
  });
});

describe('applyUtilityPromptInputSchema', () => {
  it('requires utility_name and content', () => {
    const result = applyUtilityPromptInputSchema.safeParse({});
    expect(result.success).toBe(false);
  });

  it('accepts valid utility names', () => {
    const result = applyUtilityPromptInputSchema.parse({
      utility_name: 'clarity_rewrite',
      content: 'some content to improve',
    });
    expect(result.utility_name).toBe('clarity_rewrite');
  });

  it('rejects unknown utility names', () => {
    const result = applyUtilityPromptInputSchema.safeParse({
      utility_name: 'made_up_utility',
      content: 'content',
    });
    expect(result.success).toBe(false);
  });
});

describe('generateNextActionInputSchema', () => {
  it('requires current_output', () => {
    const result = generateNextActionInputSchema.safeParse({});
    expect(result.success).toBe(false);
  });

  it('domain is optional', () => {
    const result = generateNextActionInputSchema.parse({ current_output: 'my output' });
    expect(result.domain).toBeUndefined();
  });

  it('defaults constraints to empty array', () => {
    const result = generateNextActionInputSchema.parse({ current_output: 'my output' });
    expect(result.constraints).toEqual([]);
  });
});
