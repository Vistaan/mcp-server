import { describe, it, expect } from 'vitest';
import {
  normalizeStage,
  buildAppliedSequence,
  toSentenceCase,
  toTitle,
  truncate,
  escapeRegex,
} from '../../../src/core/normalizer.js';
import { DOMAIN_SEQUENCES } from '../../../src/core/catalog.js';

describe('normalizeStage', () => {
  it('returns auto for undefined stage', () => {
    expect(normalizeStage('products', undefined)).toBe('auto');
  });

  it('returns auto for empty string', () => {
    expect(normalizeStage('products', '')).toBe('auto');
  });

  it('returns auto for "auto"', () => {
    expect(normalizeStage('products', 'auto')).toBe('auto');
  });

  it('returns stage when it exists in the domain sequence', () => {
    expect(normalizeStage('products', 'idea')).toBe('idea');
    expect(normalizeStage('freelancing', 'offer')).toBe('offer');
    expect(normalizeStage('investing', 'trade_setup')).toBe('trade_setup');
  });

  it('returns auto for invalid stage names', () => {
    expect(normalizeStage('products', 'not_a_real_stage')).toBe('auto');
    expect(normalizeStage('freelancing', 'trade_setup')).toBe('auto');
  });
});

describe('buildAppliedSequence', () => {
  it('returns the full sequence fallback when stage is auto', () => {
    const full = DOMAIN_SEQUENCES.products;
    expect(buildAppliedSequence('products', 'auto', full)).toEqual(full);
  });

  it('returns sliced sequence starting at the given stage', () => {
    const result = buildAppliedSequence('products', 'pricing', DOMAIN_SEQUENCES.products);
    expect(result[0]).toBe('pricing');
    expect(result).toEqual(['pricing', 'offer', 'first_sale']);
  });

  it('returns full sequence when stage is not found', () => {
    const full = DOMAIN_SEQUENCES.products;
    expect(buildAppliedSequence('products', 'nonexistent', full)).toEqual(DOMAIN_SEQUENCES.products);
  });

  it('handles first stage correctly', () => {
    const result = buildAppliedSequence('products', 'idea', DOMAIN_SEQUENCES.products);
    expect(result).toEqual(DOMAIN_SEQUENCES.products);
  });
});

describe('toSentenceCase', () => {
  it('converts snake_case to sentence case', () => {
    expect(toSentenceCase('energy_level')).toBe('Energy level');
    expect(toSentenceCase('preferred_mode')).toBe('Preferred mode');
  });

  it('handles single word', () => {
    expect(toSentenceCase('goal')).toBe('Goal');
  });
});

describe('toTitle', () => {
  it('converts snake_case to Title Case', () => {
    expect(toTitle('execute_referencing')).toBe('Execute Referencing');
  });

  it('converts hyphen-case to Title Case', () => {
    expect(toTitle('execute-referencing')).toBe('Execute Referencing');
  });

  it('handles single word', () => {
    expect(toTitle('products')).toBe('Products');
  });
});

describe('truncate', () => {
  it('returns the value unchanged when shorter than maxLength', () => {
    expect(truncate('hello', 10)).toBe('hello');
  });

  it('returns the value unchanged at exactly maxLength', () => {
    expect(truncate('hello', 5)).toBe('hello');
  });

  it('truncates and appends ellipsis when longer than maxLength', () => {
    const result = truncate('hello world', 8);
    expect(result).toHaveLength(8);
    expect(result.endsWith('\u2026')).toBe(true);
  });
});

describe('escapeRegex', () => {
  it('escapes special regex characters', () => {
    expect(escapeRegex('### 3.1 INPUT')).toBe('### 3\\.1 INPUT');
    expect(escapeRegex('(a+b)')).toBe('\\(a\\+b\\)');
  });

  it('leaves regular strings unchanged', () => {
    expect(escapeRegex('hello world')).toBe('hello world');
  });
});
