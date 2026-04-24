import { describe, it, expect } from 'vitest';
import { DOMAIN_URI_MAP } from '../../../src/core/catalog.js';
import { normalizeStage } from '../../../src/core/normalizer.js';

describe('select_domain_workflow logic', () => {
  it('returns correct resource_uri for each domain', () => {
    const domains = ['os', 'freelancing', 'products', 'content', 'execution', 'investing', 'utility'] as const;
    for (const domain of domains) {
      expect(DOMAIN_URI_MAP[domain]).toMatch(/^workflow:\/\//);
      expect(DOMAIN_URI_MAP[domain]).toContain(domain);
    }
  });

  it('normalizeStage returns auto for unknown stage', () => {
    expect(normalizeStage('products', 'nonexistent')).toBe('auto');
  });

  it('normalizeStage returns stage for valid stage', () => {
    expect(normalizeStage('products', 'idea')).toBe('idea');
    expect(normalizeStage('investing', 'trade_setup')).toBe('trade_setup');
  });

  it('subsection_uri is set only when stage is not auto', () => {
    const stage = normalizeStage('products', 'idea');
    const uri = DOMAIN_URI_MAP.products;
    const subsectionUri = stage !== 'auto' ? `${uri}/execution/sequence` : undefined;
    expect(subsectionUri).toBe('workflow://products/v1/execution/sequence');
  });

  it('subsection_uri is undefined when stage is auto', () => {
    const stage = normalizeStage('products', undefined);
    const uri = DOMAIN_URI_MAP.products;
    const subsectionUri = stage !== 'auto' ? `${uri}/execution/sequence` : undefined;
    expect(subsectionUri).toBeUndefined();
  });
});
