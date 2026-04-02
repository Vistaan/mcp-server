import { z } from 'zod';

// ---------------------------------------------------------------------------
// route_task
// ---------------------------------------------------------------------------

export const routeTaskInputSchema = z.object({
  task: z.string().min(1),
  goal: z.string().optional(),
  audience: z.string().optional(),
  constraints: z.array(z.string()).default([]),
  preferred_mode: z.enum(['auto', 'clarify', 'strategy', 'build', 'persuasion', 'execution', 'review']).default('auto'),
  preferred_domain: z
    .enum(['auto', 'os', 'freelancing', 'products', 'content', 'execution', 'investing', 'utility'])
    .default('auto'),
});

export const routeTaskOutputSchema = z.object({
  mode: z.enum(['clarify', 'strategy', 'build', 'persuasion', 'execution', 'review']),
  domain: z.enum(['os', 'freelancing', 'products', 'content', 'execution', 'investing', 'utility']),
  confidence: z.number(),
  reason: z.string(),
  sequence: z.array(z.string()),
  use_utility: z.boolean(),
  utility_candidates: z.array(z.string()),
});

// ---------------------------------------------------------------------------
// select_domain_workflow
// ---------------------------------------------------------------------------

export const selectDomainWorkflowInputSchema = z.object({
  domain: z.enum(['os', 'freelancing', 'products', 'content', 'execution', 'investing', 'utility']),
  stage: z.string().optional(),
});

export const selectDomainWorkflowOutputSchema = z.object({
  resource_uri: z.string(),
  subsection_uri: z.string().optional(),
  stage: z.string(),
  command_format: z.string(),
  response_shape: z.string(),
});

// ---------------------------------------------------------------------------
// run_workflow_sequence
// ---------------------------------------------------------------------------

export const runWorkflowSequenceInputSchema = z.object({
  mode: z.enum(['clarify', 'strategy', 'build', 'persuasion', 'execution', 'review']),
  domain: z.enum(['os', 'freelancing', 'products', 'content', 'execution', 'investing', 'utility']),
  task: z.string().min(1),
  context: z.string().optional(),
  stage: z.string().default('auto'),
  optimize_once: z.boolean().default(true),
  next_action_required: z.boolean().default(true),
});

export const runWorkflowSequenceOutputSchema = z.object({
  mode: z.enum(['clarify', 'strategy', 'build', 'persuasion', 'execution', 'review']),
  domain: z.enum(['os', 'freelancing', 'products', 'content', 'execution', 'investing', 'utility']),
  stage: z.string(),
  workflow_reference: z.string(),
  stage_outcome: z.string(),
  execution_summary: z.string(),
  recommendations: z.array(z.string()),
  supporting_notes: z.array(z.string()),
  applied_sequence: z.array(z.string()),
  optimization_applied: z.boolean(),
  next_action: z.string(),
});

// ---------------------------------------------------------------------------
// apply_utility_prompt
// ---------------------------------------------------------------------------

export const applyUtilityPromptInputSchema = z.object({
  utility_name: z.enum([
    'clarity_rewrite',
    'conversion_rewrite',
    'tone_calibration',
    'structure_rebuild',
    'audience_rewrite',
    'impact_compressor',
    'blind_spot_finder',
    'shortcut_strategy',
    'ultra_leverage',
    'momentum_amplifier',
  ]),
  content: z.string().min(1),
  context: z.string().optional(),
});

export const applyUtilityPromptOutputSchema = z.object({
  utility_name: z.string(),
  operation: z.string(),
  original_content: z.string(),
  revised_content: z.string(),
  issues_found: z.array(z.string()),
  changes_applied: z.array(z.string()),
  next_action: z.string(),
});

// ---------------------------------------------------------------------------
// generate_next_action
// ---------------------------------------------------------------------------

export const generateNextActionInputSchema = z.object({
  domain: z.enum(['os', 'freelancing', 'products', 'content', 'execution', 'investing', 'utility']).optional(),
  current_output: z.string().min(1),
  constraints: z.array(z.string()).default([]),
});

export const generateNextActionOutputSchema = z.object({
  next_action: z.string(),
  why_this_next: z.string(),
});
