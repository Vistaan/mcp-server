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

type ParsedOutput<TSchema extends z.ZodTypeAny> = z.infer<TSchema>;

function buildValidatedToolResult<TSchema extends z.ZodTypeAny>(
  schema: TSchema,
  output: ParsedOutput<TSchema>,
) {
  const parsed = schema.parse(output);
  return toToolResult(parsed as Record<string, unknown>);
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

export function buildSelectDomainWorkflowResult(output: ParsedOutput<typeof selectDomainWorkflowOutputSchema>) {
  return buildValidatedToolResult(selectDomainWorkflowOutputSchema, output);
}

export function buildRunWorkflowSequenceResult(output: ParsedOutput<typeof runWorkflowSequenceOutputSchema>) {
  return buildValidatedToolResult(runWorkflowSequenceOutputSchema, output);
}

export function buildApplyUtilityPromptResult(output: ParsedOutput<typeof applyUtilityPromptOutputSchema>) {
  return buildValidatedToolResult(applyUtilityPromptOutputSchema, output);
}

export function buildGenerateNextActionResult(output: ParsedOutput<typeof generateNextActionOutputSchema>) {
  return buildValidatedToolResult(generateNextActionOutputSchema, output);
}
