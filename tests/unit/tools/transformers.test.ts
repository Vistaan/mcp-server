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
      resource_uri: 'workflow://products/v1',
      subsection_uri: 'workflow://products/v1/execution/sequence',
      stage: 'idea',
      command_format: 'RUN: ...',
      response_shape: '{ mode }',
    });
    const runResult = buildRunWorkflowSequenceResult({
      mode: 'build',
      domain: 'products',
      stage: 'idea',
      workflow_reference: 'workflow://products/v1',
      stage_outcome: 'Define the buyer problem',
      execution_summary: 'deliverable',
      recommendations: ['validate demand'],
      supporting_notes: ['Preserve the core audience context'],
      applied_sequence: ['idea'],
      optimization_applied: true,
      next_action: 'next',
    });

    expect(selectResult.structuredContent['resource_uri']).toBe('workflow://products/v1');
    expect(runResult.structuredContent['next_action']).toBe('next');
    expect(runResult.structuredContent['workflow_reference']).toBe('workflow://products/v1');
    expect(runResult.structuredContent['supporting_notes']).toEqual(['Preserve the core audience context']);
  });

  it('validates utility and next-action DTOs before returning them', () => {
    const applyResult = buildApplyUtilityPromptResult({
      utility_name: 'clarity_rewrite',
      operation: 'clarity rewrite',
      original_content: 'original',
      revised_content: 'revised',
      issues_found: ['issue'],
      changes_applied: ['tightened phrasing'],
      next_action: 'Use the improved asset',
    });
    const nextActionResult = buildGenerateNextActionResult({
      next_action: 'Do the thing',
      why_this_next: 'It moves the work forward.',
    });

    expect(applyResult.structuredContent['issues_found']).toEqual(['issue']);
    expect(applyResult.structuredContent['changes_applied']).toEqual(['tightened phrasing']);
    expect(nextActionResult.structuredContent['next_action']).toBe('Do the thing');
  });
});
