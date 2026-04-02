import { DOMAIN_FILES, DOMAIN_URI_MAP, DOMAIN_SEQUENCES } from '../core/catalog.js';
import { buildAppliedSequence, normalizeStage } from '../core/normalizer.js';
import { inferUtilityIssues, makeNextAction } from '../core/output.js';
import type { Domain } from '../schemas/types.js';
import { extractMarkdownSection, readWorkflowFile } from '../resources/loader.js';
import type { UtilityExecutionCommand, UtilityExecutionResult, WorkflowExecutionCommand, WorkflowExecutionResult } from './types.js';

type WorkflowBlueprint = {
  purpose: string;
  input: string;
  decisionRule: string;
  sequence: string[];
  outputRules: string;
  completionRule: string;
};

const SECTION_HEADINGS = {
  purpose: '## 1. PURPOSE',
  input: '### 3.1 INPUT',
  decisionRule: '### 3.2 DECISION RULE',
  sequence: '### 3.3 SEQUENCE',
  outputRules: '### 4.2 OUTPUT RULES',
  completionRule: '### 4.3 COMPLETION RULE',
} as const;

export async function executeWorkflow(command: WorkflowExecutionCommand): Promise<WorkflowExecutionResult> {
  const stage = normalizeStage(command.domain, command.stage);
  const blueprint = await loadWorkflowBlueprint(command.domain);
  const appliedSequence = buildAppliedSequence(command.domain, stage, DOMAIN_SEQUENCES[command.domain]);
  const focusStage = stage === 'auto' ? appliedSequence[0] ?? 'auto' : stage;
  const contextText = command.context?.trim();
  const focusSummary = contextText ? `${command.task} (${contextText})` : command.task;
  const recommendations = buildWorkflowRecommendations(command.domain, focusStage, focusSummary, blueprint, appliedSequence);
  const supportingNotes = buildSupportingNotes(command.domain, focusStage, blueprint, contextText);

  return {
    mode: command.mode,
    domain: command.domain,
    stage,
    workflowReference: DOMAIN_URI_MAP[command.domain],
    stageOutcome: describeStageOutcome(command.domain, focusStage, command.task),
    executionSummary: [
      sentence(`Purpose: ${blueprint.purpose}`),
      sentence(`Current focus: ${focusStage === 'auto' ? 'full workflow' : focusStage}`),
      sentence(`Task: ${focusSummary}`),
    ].join(' '),
    recommendations: command.optimizeOnce ? recommendations : recommendations.slice(0, 2),
    supportingNotes,
    appliedSequence,
    optimizationApplied: command.optimizeOnce,
    nextAction: command.nextActionRequired ? makeNextAction(command.domain, focusSummary, []) : 'No next action requested.',
  };
}

export async function applyUtility(command: UtilityExecutionCommand): Promise<UtilityExecutionResult> {
  const issuesFound = inferUtilityIssues(command.utilityName, command.content);
  const normalized = normalizeWhitespace(command.content);
  const changesApplied: string[] = [];
  let revisedContent = normalized;

  switch (command.utilityName) {
    case 'clarity_rewrite':
      revisedContent = stripFiller(normalized);
      changesApplied.push('Removed filler words and tightened phrasing.');
      break;
    case 'conversion_rewrite':
      revisedContent = `Outcome-first version: ${stripFiller(normalized)}`;
      changesApplied.push('Moved the reader outcome to the front.');
      break;
    case 'tone_calibration':
      revisedContent = toDirectTone(normalized);
      changesApplied.push('Adjusted the tone to be more direct and professional.');
      break;
    case 'structure_rebuild':
      revisedContent = sentenceList(normalized).map((line) => `- ${line}`).join('\n');
      changesApplied.push('Rebuilt the asset into a scan-friendly structure.');
      break;
    case 'audience_rewrite':
      revisedContent = command.context
        ? `For ${command.context}: ${stripFiller(normalized)}`
        : `For the intended audience: ${stripFiller(normalized)}`;
      changesApplied.push('Refocused the draft around the intended audience.');
      break;
    case 'impact_compressor':
      revisedContent = sentenceList(stripFiller(normalized)).slice(0, 3).join(' ');
      changesApplied.push('Compressed the content to the highest-signal points.');
      break;
    case 'blind_spot_finder':
      revisedContent = [
        normalized,
        '',
        'Blind spots to resolve:',
        '- Define the exact audience and proof level.',
        '- State the immediate decision the reader should make.',
      ].join('\n');
      changesApplied.push('Added a focused blind-spot review.');
      break;
    case 'shortcut_strategy':
      revisedContent = [
        'Fastest path:',
        `1. ${sentenceList(normalized)[0] ?? normalized}`,
        '2. Remove any step that does not create immediate feedback.',
        '3. Ship one concrete asset before optimizing.',
      ].join('\n');
      changesApplied.push('Converted the content into a faster execution path.');
      break;
    case 'ultra_leverage':
      revisedContent = [
        `Highest-leverage move: ${sentenceList(normalized)[0] ?? normalized}`,
        'Reuse the same asset across adjacent channels before adding new work.',
      ].join('\n');
      changesApplied.push('Surfaced the highest-leverage move.');
      break;
    case 'momentum_amplifier':
      revisedContent = [
        'Momentum plan:',
        `- Start with: ${sentenceList(normalized)[0] ?? normalized}`,
        '- Reduce scope to a 10-minute action.',
        '- Finish with a visible proof of progress.',
      ].join('\n');
      changesApplied.push('Turned the asset into a momentum-preserving action plan.');
      break;
    default:
      changesApplied.push('Normalized whitespace and preserved the original content.');
      break;
  }

  if (command.context) {
    revisedContent = `${revisedContent}\n\nContext: ${command.context}`;
    changesApplied.push('Kept the provided context attached to the improved output.');
  }

  return {
    utilityName: command.utilityName,
    operation: utilityOperationLabel(command.utilityName),
    originalContent: command.content,
    revisedContent,
    issuesFound,
    changesApplied,
    nextAction: 'Apply the improved asset to the primary workflow output and review the delta once.',
  };
}

async function loadWorkflowBlueprint(domain: Domain): Promise<WorkflowBlueprint> {
  const source = await readWorkflowFile(DOMAIN_FILES[domain]);
  return {
    purpose: sectionBody(source, SECTION_HEADINGS.purpose),
    input: sectionBody(source, SECTION_HEADINGS.input),
    decisionRule: sectionBody(source, SECTION_HEADINGS.decisionRule),
    sequence: parseSequence(sectionBody(source, SECTION_HEADINGS.sequence)),
    outputRules: sectionBody(source, SECTION_HEADINGS.outputRules),
    completionRule: sectionBody(source, SECTION_HEADINGS.completionRule),
  };
}

function sectionBody(source: string, heading: string): string {
  return extractMarkdownSection(source, heading)
    .replace(new RegExp(`^${escapeForRegex(heading)}\\s*`), '')
    .trim();
}

function parseSequence(section: string): string[] {
  return section
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => /^\d+\./.test(line))
    .map((line) => line.replace(/^\d+\.\s*/, '').trim());
}

function buildWorkflowRecommendations(
  domain: Domain,
  focusStage: string,
  task: string,
  blueprint: WorkflowBlueprint,
  appliedSequence: string[],
): string[] {
  const sequenceLead = blueprint.sequence[0] ?? 'Start with the first workflow step.';
  return [
    sentence(`Focus the ${domain} workflow on ${focusStage === 'auto' ? 'the earliest unresolved stage' : focusStage} for: ${task}`),
    sentence(`Decision rule: ${blueprint.decisionRule}`),
    sentence(`Execution input to preserve: ${blueprint.input}`),
    sentence(`Sequence to run now: ${(appliedSequence.length > 0 ? appliedSequence : DOMAIN_SEQUENCES[domain]).join(' -> ')}`),
    sentence(`Keep the output aligned to: ${blueprint.outputRules}`),
    sentence(`Completion bar: ${blueprint.completionRule}`),
    sentence(`If the task is still underspecified, start with: ${sequenceLead}`),
  ];
}

function buildSupportingNotes(
  domain: Domain,
  focusStage: string,
  blueprint: WorkflowBlueprint,
  contextText?: string,
): string[] {
  return [
    sentence(`Primary input boundary: ${blueprint.input}`),
    sentence(`Stage objective for ${focusStage === 'auto' ? domain : focusStage}: ${describeStageOutcome(domain, focusStage, blueprint.purpose)}`),
    contextText ? sentence(`Context carried into execution: ${contextText}`) : sentence('No extra context was provided beyond the task statement.'),
  ];
}

function describeStageOutcome(domain: Domain, focusStage: string, subject: string): string {
  const normalizedSubject = subject.trim() || 'the request';
  switch (domain) {
    case 'products':
      if (focusStage === 'validate') return `Confirm buyer pain, demand signal, and why ${normalizedSubject} is worth building`;
      if (focusStage === 'pricing') return `Set a price that is easy to justify for ${normalizedSubject}`;
      if (focusStage === 'offer') return `Package ${normalizedSubject} into a clear and buyable offer`;
      break;
    case 'freelancing':
      if (focusStage === 'outreach') return `Turn ${normalizedSubject} into a direct client-acquisition move`;
      break;
    case 'content':
      if (focusStage === 'hooks') return `Create stronger opening hooks for ${normalizedSubject}`;
      break;
    case 'execution':
      if (focusStage === 'do_now') return `Reduce ${normalizedSubject} to the smallest actionable next step`;
      break;
    case 'investing':
      if (focusStage === 'trade_setup') return `Define exact entry, exit, and invalidation rules for ${normalizedSubject}`;
      break;
    case 'utility':
      return `Improve one dimension of ${normalizedSubject} without reopening the full workflow`;
    case 'os':
      return `Route ${normalizedSubject} to one dominant execution path and produce one next move`;
  }

  return `Advance ${normalizedSubject} through the ${focusStage === 'auto' ? domain : focusStage} stage with minimal ambiguity`;
}

function utilityOperationLabel(utilityName: string): string {
  return utilityName.replace(/_/g, ' ');
}

function normalizeWhitespace(content: string): string {
  return content.replace(/\r\n/g, '\n').replace(/[ \t]+/g, ' ').replace(/\n{3,}/g, '\n\n').trim();
}

function stripFiller(content: string): string {
  return normalizeWhitespace(content)
    .replace(/\b(maybe|possibly|perhaps|some|stuff|kind of|sort of)\b/gi, '')
    .replace(/\s{2,}/g, ' ')
    .replace(/\s+([,.!?])/g, '$1')
    .trim();
}

function toDirectTone(content: string): string {
  return sentenceList(stripFiller(content))
    .map((line) => line.replace(/^./, (char) => char.toUpperCase()))
    .join(' ');
}

function sentenceList(content: string): string[] {
  return normalizeWhitespace(content)
    .split(/\n+|(?<=[.!?])\s+/)
    .map((part) => part.trim())
    .filter(Boolean);
}

function sentence(value: string): string {
  const trimmed = value.trim();
  if (trimmed.length === 0) {
    return '';
  }

  return /[.!?]$/.test(trimmed) ? trimmed : `${trimmed}.`;
}

function escapeForRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
