import { describe, expect, it } from 'vitest';
import { buildApplyUtilityPromptResult, buildGenerateNextActionResult, buildRouteTaskResult, buildRunWorkflowSequenceResult, buildSelectDomainWorkflowResult } from '../../../src/tools/transformers.js';

describe('tool transformers', () => {
  it('maps route results into the public DTO contract', () => {
    const result = buildRouteTaskResult({
      mode: 'build',
      domain: 'products',
      confidence: 0.82,
      reason: 'test',
      sequence: ['idea', 'validate'],
      useUtility: true,
      utilityCandidates: ['blind_spot_finder'],
    });

    expect(result.structuredContent).toEqual({
      mode: 'build',
      domain: 'products',
      confidence: 0.82,
      reason: 'test',
      sequence: ['idea', 'validate'],
      use_utility: true,
      utility_candidates: ['blind_spot_finder'],
    });
  });

  it('validates select and run workflow DTOs before returning them', () => {
    const selectResult = buildSelectDomainWorkflowResult({
      resource_uri: 'workflow://products/v4',
      subsection_uri: 'workflow://products/v4/execution/sequence',
      stage: 'idea',
      command_format: 'RUN: ...',
      response_shape: '{ mode }',
    });
    const runResult = buildRunWorkflowSequenceResult({
      mode: 'build',
      domain: 'products',
      main_deliverable: 'deliverable',
      applied_sequence: ['idea'],
      optimization_applied: true,
      next_action: 'next',
    });

    expect(selectResult.structuredContent['resource_uri']).toBe('workflow://products/v4');
    expect(runResult.structuredContent['next_action']).toBe('next');
  });

  it('validates utility and next-action DTOs before returning them', () => {
    const applyResult = buildApplyUtilityPromptResult({
      utility_name: 'clarity_rewrite',
      revised_content: 'revised',
      issues_found: ['issue'],
    });
    const nextActionResult = buildGenerateNextActionResult({
      next_action: 'Do the thing',
      why_this_next: 'It moves the work forward.',
    });

    expect(applyResult.structuredContent['issues_found']).toEqual(['issue']);
    expect(nextActionResult.structuredContent['next_action']).toBe('Do the thing');
  });
});
