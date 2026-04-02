import { describe, it, expect } from 'vitest';
import { routeTask } from '../../../src/core/router.js';
import { routeTaskInputSchema } from '../../../src/schemas/tools.js';

// Test the logic layer directly (router.ts) rather than the SDK wiring
describe('route_task logic', () => {
  it('returns structured result with correct shape', () => {
    const result = routeTask({
      task: 'I want to validate a digital product idea',
      preferred_mode: 'auto',
      preferred_domain: 'auto',
      constraints: [],
    });

    expect(result).toHaveProperty('mode');
    expect(result).toHaveProperty('domain');
    expect(result).toHaveProperty('confidence');
    expect(result).toHaveProperty('reason');
    expect(result).toHaveProperty('sequence');
    expect(result).toHaveProperty('useUtility');
    expect(result).toHaveProperty('utilityCandidates');
  });

  it('routes product task to products domain', () => {
    const result = routeTask({
      task: 'help me validate my first digital product idea',
      preferred_mode: 'auto',
      preferred_domain: 'auto',
      constraints: [],
    });
    expect(result.domain).toBe('products');
  });

  it('overrides both mode and domain when explicitly set', () => {
    const result = routeTask({
      task: 'anything',
      preferred_mode: 'strategy',
      preferred_domain: 'investing',
      constraints: [],
    });
    expect(result.mode).toBe('strategy');
    expect(result.domain).toBe('investing');
    expect(result.confidence).toBe(1);
  });

  it('schema validation rejects missing task', () => {
    const result = routeTaskInputSchema.safeParse({ preferred_mode: 'auto' });
    expect(result.success).toBe(false);
  });
});
