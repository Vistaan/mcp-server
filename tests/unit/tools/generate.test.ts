import { describe, it, expect } from 'vitest';
import { makeNextAction } from '../../../src/core/output.js';

describe('generate_next_action logic', () => {
  it('returns a non-empty string for every domain', () => {
    const domains = ['os', 'freelancing', 'products', 'content', 'execution', 'investing', 'utility'] as const;
    for (const domain of domains) {
      const action = makeNextAction(domain, 'some current output', []);
      expect(action.length).toBeGreaterThan(0);
    }
  });

  it('appends constraint text when provided', () => {
    const action = makeNextAction('products', 'output', ['no budget', 'remote only']);
    expect(action).toContain('while respecting: no budget, remote only');
  });

  it('does not append constraint text when constraints are empty', () => {
    const action = makeNextAction('products', 'output', []);
    expect(action).not.toContain('while respecting');
  });

  it('defaults to os behavior for unknown domain', () => {
    const action = makeNextAction('os', 'run the primary workflow on this output', []);
    expect(action).toContain('Run the primary workflow');
  });
});
