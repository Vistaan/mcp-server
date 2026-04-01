import { z } from 'zod';
import type { Domain, Mode, RouteResult } from '../schemas/types.js';
import { routeTaskInputSchema } from '../schemas/tools.js';
import { DOMAIN_SEQUENCES } from './catalog.js';

export function routeTask(input: z.infer<typeof routeTaskInputSchema>): RouteResult {
  if (input.preferred_mode !== 'auto' && input.preferred_domain !== 'auto') {
    return {
      mode: input.preferred_mode,
      domain: input.preferred_domain,
      confidence: 0.99,
      reason: 'Explicit preferred mode and domain were provided.',
      sequence: DOMAIN_SEQUENCES[input.preferred_domain],
      useUtility: input.preferred_domain !== 'utility',
      utilityCandidates: utilityCandidatesForMode(input.preferred_mode),
    };
  }

  const text = [input.task, input.goal, input.audience, input.constraints.join(' ')]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  const inferredDomain = input.preferred_domain !== 'auto' ? input.preferred_domain : inferDomain(text);
  const inferredMode = input.preferred_mode !== 'auto' ? input.preferred_mode : inferMode(text, inferredDomain);

  return {
    mode: inferredMode,
    domain: inferredDomain,
    confidence: 0.82,
    reason: buildRouteReason(inferredMode, inferredDomain, text),
    sequence: DOMAIN_SEQUENCES[inferredDomain],
    useUtility: inferredDomain !== 'utility',
    utilityCandidates: utilityCandidatesForMode(inferredMode),
  };
}

export function inferDomain(text: string): Domain {
  if (/(stock|ticker|watchlist|trade|earnings|market|invest)/.test(text)) return 'investing';
  if (/(hook|copy|content|post|cta|audience|landing page|offer copy)/.test(text)) return 'content';
  if (/(stuck|overwhelm|procrastinat|priority|sprint|focus|execution)/.test(text)) return 'execution';
  if (/(product|idea|validate|first sale|pricing|buyer|digital product)/.test(text)) return 'products';
  if (/(freelance|client|portfolio|outreach|retainer|niche|service offer)/.test(text)) return 'freelancing';
  if (/(rewrite|compress|tone|blind spot|leverage|optimi[sz]e|improve)/.test(text)) return 'utility';
  return 'os';
}

export function inferMode(text: string, domain: Domain): Mode {
  if (/(confused|unclear|fuzzy|clarify|not sure)/.test(text)) return 'clarify';
  if (/(stuck|overwhelm|do now|procrastinat|sprint|focus)/.test(text)) return 'execution';
  if (/(rewrite|improve|optimi[sz]e|review|tighten)/.test(text)) {
    return domain === 'content' ? 'persuasion' : 'review';
  }
  if (/(strategy|direction|choose|best|validate|niche|opportunity)/.test(text)) return 'strategy';
  if (domain === 'content') return 'persuasion';
  if (domain === 'execution') return 'execution';
  return 'build';
}

export function buildRouteReason(mode: Mode, domain: Domain, text: string): string {
  return `Detected ${mode} mode for the ${domain} domain from task language: ${text.slice(0, 160) || 'n/a'}`;
}

export function utilityCandidatesForMode(mode: Mode): string[] {
  switch (mode) {
    case 'clarify':
      return ['clarity_rewrite', 'structure_rebuild'];
    case 'strategy':
      return ['blind_spot_finder', 'shortcut_strategy', 'ultra_leverage'];
    case 'build':
      return ['structure_rebuild', 'audience_rewrite'];
    case 'persuasion':
      return ['conversion_rewrite', 'tone_calibration', 'impact_compressor'];
    case 'execution':
      return ['shortcut_strategy', 'momentum_amplifier'];
    case 'review':
      return ['clarity_rewrite', 'impact_compressor', 'blind_spot_finder'];
  }
}
