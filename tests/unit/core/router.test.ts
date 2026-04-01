import { describe, it, expect } from 'vitest';
import {
  inferDomain,
  inferMode,
  routeTask,
  utilityCandidatesForMode,
  buildRouteReason,
} from '../../../src/core/router.js';
import { DOMAIN_SEQUENCES } from '../../../src/core/catalog.js';

describe('inferDomain', () => {
  it('returns investing for investing keywords', () => {
    expect(inferDomain('analyze this stock ticker for earnings')).toBe('investing');
    expect(inferDomain('build a watchlist for swing trade')).toBe('investing');
  });

  it('returns content for content keywords', () => {
    expect(inferDomain('write a hook for my landing page')).toBe('content');
    expect(inferDomain('improve my copy and cta')).toBe('content');
  });

  it('returns execution for execution keywords', () => {
    expect(inferDomain('i am stuck and overwhelmed')).toBe('execution');
    expect(inferDomain('help me sprint and prioritize my work')).toBe('execution');
  });

  it('returns products for product keywords', () => {
    expect(inferDomain('validate my digital product idea')).toBe('products');
    expect(inferDomain('need help with pricing for my first sale')).toBe('products');
  });

  it('returns freelancing for freelancing keywords', () => {
    expect(inferDomain('build a client outreach strategy')).toBe('freelancing');
    expect(inferDomain('help me find my freelance niche')).toBe('freelancing');
  });

  it('returns utility for utility keywords', () => {
    expect(inferDomain('rewrite this text for me')).toBe('utility');
    expect(inferDomain('compress this and find leverage points')).toBe('utility');
  });

  it('returns os as default fallback', () => {
    expect(inferDomain('help me with something')).toBe('os');
    expect(inferDomain('')).toBe('os');
  });
});

describe('inferMode', () => {
  it('returns clarify for clarify keywords', () => {
    expect(inferMode('i am confused and unclear about my goal', 'os')).toBe('clarify');
  });

  it('returns execution for execution keywords', () => {
    expect(inferMode('i am stuck and need to do now', 'products')).toBe('execution');
  });

  it('returns review for review keywords in non-content domain', () => {
    expect(inferMode('review and improve my plan', 'freelancing')).toBe('review');
  });

  it('returns persuasion for review keywords in content domain', () => {
    expect(inferMode('rewrite and improve my copy', 'content')).toBe('persuasion');
  });

  it('returns strategy for strategy keywords', () => {
    expect(inferMode('choose the best niche direction', 'freelancing')).toBe('strategy');
  });

  it('returns persuasion as default for content domain', () => {
    expect(inferMode('write my linkedin post', 'content')).toBe('persuasion');
  });

  it('returns execution as default for execution domain', () => {
    expect(inferMode('help me', 'execution')).toBe('execution');
  });

  it('returns build as default for other domains', () => {
    expect(inferMode('help me', 'products')).toBe('build');
    expect(inferMode('help me', 'freelancing')).toBe('build');
  });
});

describe('routeTask', () => {
  it('returns 0.99 confidence for explicit preferred mode + domain', () => {
    const result = routeTask({
      task: 'anything',
      preferred_mode: 'build',
      preferred_domain: 'products',
      constraints: [],
    });
    expect(result.confidence).toBe(0.99);
    expect(result.mode).toBe('build');
    expect(result.domain).toBe('products');
    expect(result.reason).toBe('Explicit preferred mode and domain were provided.');
  });

  it('sets useUtility to false when preferred_domain is utility', () => {
    const result = routeTask({
      task: 'rewrite this',
      preferred_mode: 'review',
      preferred_domain: 'utility',
      constraints: [],
    });
    expect(result.useUtility).toBe(false);
  });

  it('returns 0.82 confidence for auto-inferred routing', () => {
    const result = routeTask({
      task: 'i want to validate my product idea',
      preferred_mode: 'auto',
      preferred_domain: 'auto',
      constraints: [],
    });
    expect(result.confidence).toBe(0.82);
    expect(result.domain).toBe('products');
  });

  it('returns the correct domain sequence', () => {
    const result = routeTask({
      task: 'help me find my freelance niche and outreach to clients',
      preferred_mode: 'auto',
      preferred_domain: 'auto',
      constraints: [],
    });
    expect(result.sequence).toEqual(DOMAIN_SEQUENCES.freelancing);
  });

  it('includes utility candidates for the inferred mode', () => {
    const result = routeTask({
      task: 'help me clarify my fuzzy goal',
      preferred_mode: 'auto',
      preferred_domain: 'auto',
      constraints: [],
    });
    expect(result.utilityCandidates).toContain('clarity_rewrite');
  });
});

describe('utilityCandidatesForMode', () => {
  it('returns correct candidates for clarify', () => {
    expect(utilityCandidatesForMode('clarify')).toEqual(['clarity_rewrite', 'structure_rebuild']);
  });

  it('returns correct candidates for strategy', () => {
    expect(utilityCandidatesForMode('strategy')).toEqual(['blind_spot_finder', 'shortcut_strategy', 'ultra_leverage']);
  });

  it('returns correct candidates for persuasion', () => {
    expect(utilityCandidatesForMode('persuasion')).toEqual([
      'conversion_rewrite',
      'tone_calibration',
      'impact_compressor',
    ]);
  });

  it('returns correct candidates for execution', () => {
    expect(utilityCandidatesForMode('execution')).toEqual(['shortcut_strategy', 'momentum_amplifier']);
  });

  it('returns correct candidates for review', () => {
    expect(utilityCandidatesForMode('review')).toEqual(['clarity_rewrite', 'impact_compressor', 'blind_spot_finder']);
  });
});

describe('buildRouteReason', () => {
  it('includes mode and domain in the reason string', () => {
    const reason = buildRouteReason('build', 'products', 'create a product');
    expect(reason).toContain('build');
    expect(reason).toContain('products');
  });

  it('truncates long text to 160 characters', () => {
    const longText = 'a'.repeat(200);
    const reason = buildRouteReason('build', 'products', longText);
    expect(reason.length).toBeLessThan(300);
    const match = reason.match(/task language: (.+)/);
    expect(match?.[1]?.length).toBeLessThanOrEqual(160);
  });
});
