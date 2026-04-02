import { describe, it, expect } from 'vitest';
import { buildAppliedSequence, normalizeStage } from '../../../src/core/normalizer.js';
import { makeNextAction } from '../../../src/core/output.js';
import { DOMAIN_SEQUENCES } from '../../../src/core/catalog.js';

describe('run_workflow_sequence logic', () => {
  it('applied_sequence starts at the correct stage', () => {
    const result = buildAppliedSequence('products', 'pricing', DOMAIN_SEQUENCES.products);
    expect(result[0]).toBe('pricing');
  });

  it('applied_sequence returns full sequence when stage is auto', () => {
    const result = buildAppliedSequence('products', 'auto', DOMAIN_SEQUENCES.products);
    expect(result).toEqual(DOMAIN_SEQUENCES.products);
  });

  it('next_action is domain-specific', () => {
    const action = makeNextAction('freelancing', 'my freelancing output', []);
    expect(action).toContain('one-page offer brief');
  });

  it('next_action is a non-empty string', () => {
    const action = makeNextAction('content', 'my content output', []);
    expect(action.length).toBeGreaterThan(0);
  });

  it('normalizeStage handles auto correctly', () => {
    expect(normalizeStage('products', 'auto')).toBe('auto');
  });

  it('normalizeStage resolves workflow-stage aliases', () => {
    expect(normalizeStage('products', 'validation')).toBe('validate');
  });
});
