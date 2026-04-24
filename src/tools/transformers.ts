import type { z } from 'zod';
import { toToolResult } from '../core/output.js';
import type { RouteResult } from '../schemas/types.js';
import {
  applyUtilityPromptOutputSchema,
  generateNextActionOutputSchema,
  routeTaskOutputSchema,
  runWorkflowSequenceOutputSchema,
  selectDomainWorkflowOutputSchema,
} from '../schemas/tools.js';

type ParsedOutput<TOutput extends Record<string, unknown>> = TOutput;

function buildValidatedToolResult<TOutput extends Record<string, unknown>>(
  schema: z.ZodType<TOutput>,
  output: ParsedOutput<TOutput>,
) {
  const parsed = schema.parse(output);
  return toToolResult(parsed);
}

export function buildRouteTaskResult(route: RouteResult) {
  return buildValidatedToolResult(routeTaskOutputSchema, {
    mode: route.mode,
    domain: route.domain,
    confidence: route.confidence,
    reason: route.reason,
    sequence: route.sequence,
    use_utility: route.useUtility,
    utility_candidates: route.utilityCandidates,
  });
}

export function buildSelectDomainWorkflowResult(
  output: ParsedOutput<z.infer<typeof selectDomainWorkflowOutputSchema>>,
) {
  return buildValidatedToolResult(selectDomainWorkflowOutputSchema, output);
}

export function buildRunWorkflowSequenceResult(output: ParsedOutput<z.infer<typeof runWorkflowSequenceOutputSchema>>) {
  return buildValidatedToolResult(runWorkflowSequenceOutputSchema, output);
}

export function buildApplyUtilityPromptResult(output: ParsedOutput<z.infer<typeof applyUtilityPromptOutputSchema>>) {
  return buildValidatedToolResult(applyUtilityPromptOutputSchema, output);
}

export function buildGenerateNextActionResult(output: ParsedOutput<z.infer<typeof generateNextActionOutputSchema>>) {
  return buildValidatedToolResult(generateNextActionOutputSchema, output);
}
