import type { Domain, Mode, RouteDomain, ToolEnvelope } from '../schemas/types.js';
import { toSentenceCase, truncate } from './normalizer.js';

export function toToolResult<T extends Record<string, unknown>>(output: T): ToolEnvelope<T> {
  return {
    content: [{ type: 'text', text: JSON.stringify(output, null, 2) }],
    structuredContent: output,
  };
}

export function buildPromptText(
  mode: Mode,
  domain: RouteDomain,
  task: string,
  meta?: Record<string, unknown>,
): string {
  const lines = [`Mode: ${mode}`, `Domain: ${domain}`, `Task: ${task}`];

  if (meta) {
    for (const [key, value] of Object.entries(meta)) {
      if (value === undefined || value === null || value === '') continue;
      lines.push(`${toSentenceCase(key)}: ${Array.isArray(value) ? value.join(', ') : String(value)}`);
    }
  }

  lines.push(
    'Use one main workflow. Produce one main deliverable. Optimize once only if it clearly improves the output. End with one immediate next action.',
  );
  return lines.join('\n');
}

export function makeNextAction(domain: Domain, currentOutput: string, constraints: string[]): string {
  const constraintText = constraints.length > 0 ? ` while respecting: ${constraints.join(', ')}` : '';

  switch (domain) {
    case 'freelancing':
      return `Turn the current freelancing output into a one-page offer brief${constraintText}.`;
    case 'products':
      return `Write the one-sentence product promise and list the first five components${constraintText}.`;
    case 'content':
      return `Draft the opening hook and first three supporting lines${constraintText}.`;
    case 'execution':
      return `Choose one subtask from the current output and complete it in the next 10 minutes${constraintText}.`;
    case 'investing':
      return `Define the exact watchlist or trade-entry criteria from the current analysis${constraintText}.`;
    case 'utility':
      return `Apply the selected utility to the current output and compare the before/after version${constraintText}.`;
    case 'os':
    default:
      return `Run the primary workflow on this output: ${truncate(currentOutput, 80)}${constraintText}.`;
  }
}

export function inferUtilityIssues(utilityName: string, content: string): string[] {
  const issues: string[] = [];
  if (content.length < 80) issues.push('Source content is very short and may need more context.');
  if (/\b(maybe|possibly|perhaps|some|stuff)\b/i.test(content)) {
    issues.push('Contains vague language that weakens precision.');
  }
  if (/\n\n\n+/.test(content)) issues.push('Has avoidable spacing/noise that can be tightened.');
  if (utilityName === 'blind_spot_finder') {
    issues.push('Potential hidden assumption: target audience and proof level may be underspecified.');
  }
  if (issues.length === 0) {
    issues.push('No major structural issue detected; utility can be used as a polishing pass.');
  }
  return issues;
}
