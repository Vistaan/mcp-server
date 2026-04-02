import type { Domain } from '../schemas/types.js';
import { DOMAIN_SEQUENCES, DOMAIN_STAGE_ALIASES } from './catalog.js';

export function normalizeStage(domain: Domain, stage?: string): string {
  if (!stage || stage === 'auto') return 'auto';
  const canonicalStage = DOMAIN_STAGE_ALIASES[domain][stage] ?? stage;
  const steps = DOMAIN_SEQUENCES[domain];
  return steps.includes(canonicalStage) ? canonicalStage : 'auto';
}

export function buildAppliedSequence(domain: Domain, stage: string, fallback: string[]): string[] {
  if (!stage || stage === 'auto') return fallback;
  const steps = DOMAIN_SEQUENCES[domain];
  const canonicalStage = DOMAIN_STAGE_ALIASES[domain][stage] ?? stage;
  const start = steps.indexOf(canonicalStage);
  return start === -1 ? steps : steps.slice(start);
}

export function toSentenceCase(value: string): string {
  return value.replace(/_/g, ' ').replace(/^./, (char) => char.toUpperCase());
}

export function toTitle(value: string): string {
  return value
    .split(/[-_]/g)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

export function truncate(value: string, maxLength: number): string {
  return value.length <= maxLength ? value : `${value.slice(0, maxLength - 1)}\u2026`;
}

export function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
