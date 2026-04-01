import { describe, it, expect } from 'vitest';
import { inferUtilityIssues } from '../../../src/core/output.js';

describe('apply_utility_prompt logic', () => {
  it('detects short content issue', () => {
    const issues = inferUtilityIssues('tone_calibration', 'hi');
    expect(issues.some((i) => i.includes('very short'))).toBe(true);
  });

  it('detects vague language in content', () => {
    const issues = inferUtilityIssues('clarity_rewrite', 'maybe this could possibly work for some stuff');
    expect(issues.some((i) => i.includes('vague language'))).toBe(true);
  });

  it('blind_spot_finder always adds its specific issue', () => {
    const content = 'This is a detailed and specific product offer for enterprise buyers with clear proof.';
    const issues = inferUtilityIssues('blind_spot_finder', content);
    expect(issues.some((i) => i.includes('hidden assumption'))).toBe(true);
  });

  it('returns no-issue message for clean, adequate content', () => {
    const clean = 'This offer helps B2B founders close their first $5k client within 30 days using outreach scripts.';
    const issues = inferUtilityIssues('structure_rebuild', clean);
    expect(issues).toHaveLength(1);
    expect(issues[0]).toContain('No major structural issue');
  });
});
