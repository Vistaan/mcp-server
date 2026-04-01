import { describe, it, expect } from 'vitest';
import { toToolResult, buildPromptText, makeNextAction, inferUtilityIssues } from '../../../src/core/output.js';

describe('toToolResult', () => {
  it('wraps output in content + structuredContent', () => {
    const input = { foo: 'bar', count: 42 };
    const result = toToolResult(input);
    expect(result.structuredContent).toEqual(input);
    expect(result.content).toHaveLength(1);
    expect(result.content[0]?.type).toBe('text');
    expect(JSON.parse(result.content[0]?.text ?? '{}')).toEqual(input);
  });
});

describe('buildPromptText', () => {
  it('includes Mode, Domain, and Task lines', () => {
    const text = buildPromptText('build', 'products', 'create an ebook');
    expect(text).toContain('Mode: build');
    expect(text).toContain('Domain: products');
    expect(text).toContain('Task: create an ebook');
  });

  it('always ends with the OS operating discipline sentence', () => {
    const text = buildPromptText('clarify', 'os', 'anything');
    expect(text).toContain('Use one main workflow.');
    expect(text).toContain('End with one immediate next action.');
  });

  it('includes optional meta fields when present', () => {
    const text = buildPromptText('build', 'products', 'my task', {
      context: 'I have no budget',
      audience: 'beginners',
    });
    expect(text).toContain('Context: I have no budget');
    expect(text).toContain('Audience: beginners');
  });

  it('omits meta fields that are undefined, null, or empty', () => {
    const text = buildPromptText('build', 'products', 'my task', {
      context: undefined,
      audience: '',
      goal: null,
    });
    expect(text).not.toContain('Context:');
    expect(text).not.toContain('Audience:');
    expect(text).not.toContain('Goal:');
  });

  it('joins array meta values with commas', () => {
    const text = buildPromptText('build', 'products', 'task', {
      constraints: ['no budget', 'time boxed'],
    });
    expect(text).toContain('no budget, time boxed');
  });
});

describe('makeNextAction', () => {
  it('returns freelancing-specific action', () => {
    const action = makeNextAction('freelancing', 'some output', []);
    expect(action).toContain('one-page offer brief');
  });

  it('returns products-specific action', () => {
    const action = makeNextAction('products', 'some output', []);
    expect(action).toContain('one-sentence product promise');
  });

  it('returns content-specific action', () => {
    const action = makeNextAction('content', 'some output', []);
    expect(action).toContain('opening hook');
  });

  it('returns execution-specific action', () => {
    const action = makeNextAction('execution', 'some output', []);
    expect(action).toContain('10 minutes');
  });

  it('returns investing-specific action', () => {
    const action = makeNextAction('investing', 'some output', []);
    expect(action).toContain('watchlist or trade-entry criteria');
  });

  it('returns utility-specific action', () => {
    const action = makeNextAction('utility', 'some output', []);
    expect(action).toContain('before/after');
  });

  it('returns os/default action with truncated output', () => {
    const longOutput = 'a'.repeat(200);
    const action = makeNextAction('os', longOutput, []);
    expect(action).toContain('Run the primary workflow');
  });

  it('appends constraint text when constraints are provided', () => {
    const action = makeNextAction('products', 'output', ['no budget', 'time boxed']);
    expect(action).toContain('while respecting: no budget, time boxed');
  });
});

describe('inferUtilityIssues', () => {
  it('detects short content', () => {
    const issues = inferUtilityIssues('clarity_rewrite', 'short text');
    expect(issues.some((i) => i.includes('very short'))).toBe(true);
  });

  it('detects vague language', () => {
    const issues = inferUtilityIssues('clarity_rewrite', 'maybe you should possibly do some stuff here');
    expect(issues.some((i) => i.includes('vague language'))).toBe(true);
  });

  it('detects excessive blank lines', () => {
    const issues = inferUtilityIssues('clarity_rewrite', 'line 1\n\n\n\nline 2');
    expect(issues.some((i) => i.includes('spacing'))).toBe(true);
  });

  it('adds blind_spot_finder specific issue', () => {
    const issues = inferUtilityIssues('blind_spot_finder', 'a reasonable length content block that is clear enough');
    expect(issues.some((i) => i.includes('hidden assumption'))).toBe(true);
  });

  it('returns the no-issue message for clean content', () => {
    const cleanContent =
      'This offer helps B2B founders close their first $5k client within 30 days using proven outreach scripts and frameworks.';
    const issues = inferUtilityIssues('clarity_rewrite', cleanContent);
    expect(issues).toHaveLength(1);
    expect(issues[0]).toContain('No major structural issue');
  });
});
