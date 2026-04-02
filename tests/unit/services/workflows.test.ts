import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { metrics } from '../../../src/metrics.js';
import { clearWorkflowFileCache } from '../../../src/resources/loader.js';
import { applyUtility, executeWorkflow } from '../../../src/services/workflows.js';

describe('workflow services', () => {
  beforeEach(() => {
    metrics.reset();
    clearWorkflowFileCache();
  });

  afterEach(() => {
    metrics.reset();
    clearWorkflowFileCache();
  });

  it('executes a workflow using stage aliases from the workflow command format', async () => {
    const result = await executeWorkflow({
      mode: 'build',
      domain: 'products',
      task: 'launch a founder-focused offer',
      stage: 'validation',
      optimizeOnce: true,
      nextActionRequired: true,
    });

    expect(result.stage).toBe('validate');
    expect(result.workflowReference).toBe('workflow://products/v4');
    expect(result.stageOutcome).toContain('buyer pain');
    expect(result.supportingNotes.length).toBeGreaterThan(0);
  });

  it('applies utility transformations with structured change tracking', async () => {
    const result = await applyUtility({
      utilityName: 'impact_compressor',
      content: 'Maybe this helps founders close clients faster. It also gives them scripts. It saves time.',
    });

    expect(result.revisedContent).not.toContain('Maybe');
    expect(result.changesApplied).toContain('Compressed the content to the highest-signal points.');
    expect(result.nextAction).toContain('primary workflow output');
  });

  it('records workflow cache metrics across miss, join, and hit paths', async () => {
    const [first, second] = await Promise.all([
      executeWorkflow({
        mode: 'build',
        domain: 'products',
        task: 'validate a new product idea',
        stage: 'idea',
        optimizeOnce: true,
        nextActionRequired: false,
      }),
      executeWorkflow({
        mode: 'build',
        domain: 'products',
        task: 'validate a new product idea',
        stage: 'idea',
        optimizeOnce: true,
        nextActionRequired: false,
      }),
    ]);

    const third = await executeWorkflow({
      mode: 'build',
      domain: 'products',
      task: 'validate a new product idea',
      stage: 'idea',
      optimizeOnce: false,
      nextActionRequired: false,
    });

    expect(first.workflowReference).toBe(third.workflowReference);
    expect(second.workflowReference).toBe(third.workflowReference);

    const snapshot = metrics.snapshot();
    expect(snapshot).toEqual(
      expect.objectContaining({
        'workflow_file_cache_miss|file:WORKFLOW_PRODUCTS_v4.md': 1,
        'workflow_file_singleflight_join|file:WORKFLOW_PRODUCTS_v4.md': 1,
        'workflow_file_cache_hit|file:WORKFLOW_PRODUCTS_v4.md': 1,
      }),
    );
  });
});
