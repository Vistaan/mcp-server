import { z } from 'zod';
import { metrics } from '../metrics.js';
import type { Domain, Mode, RouteResult } from '../schemas/types.js';
import { routeTaskInputSchema } from '../schemas/tools.js';
import { DOMAIN_SEQUENCES } from './catalog.js';

type SignalDefinition<TLabel extends string> = Record<
  TLabel,
  Array<{ pattern: RegExp; weight: number; label: string }>
>;

type RankedChoice<TLabel extends string> = {
  label: TLabel;
  score: number;
  evidence: string[];
};

const DOMAIN_SIGNALS: SignalDefinition<Domain> = {
  os: [
    { pattern: /\b(route|workflow os|front door|classify)\b/, weight: 3, label: 'router language' },
    { pattern: /\b(system|operating mode|dispatch)\b/, weight: 2, label: 'system language' },
  ],
  freelancing: [
    { pattern: /\b(freelance|client|retainer|proposal|portfolio)\b/, weight: 4, label: 'freelancing language' },
    { pattern: /\b(outreach|niche|service offer|discovery call)\b/, weight: 3, label: 'client acquisition language' },
  ],
  products: [
    { pattern: /\b(product|offer|pricing|validate|first sale)\b/, weight: 4, label: 'product language' },
    { pattern: /\b(digital product|buyer result|productized)\b/, weight: 3, label: 'product build language' },
  ],
  content: [
    { pattern: /\b(copy|hook|cta|landing page|headline)\b/, weight: 4, label: 'content language' },
    { pattern: /\b(post|audience|story|persuasion|email)\b/, weight: 3, label: 'persuasion language' },
  ],
  execution: [
    { pattern: /\b(stuck|overwhelm|priority|focus|sprint)\b/, weight: 4, label: 'execution language' },
    { pattern: /\b(unblock|do now|momentum|procrastinat)\b/, weight: 3, label: 'momentum language' },
  ],
  investing: [
    { pattern: /\b(stock|ticker|earnings|trade|watchlist)\b/, weight: 4, label: 'investing language' },
    { pattern: /\b(market|news|entry criteria|portfolio)\b/, weight: 3, label: 'market language' },
  ],
  utility: [
    { pattern: /\b(rewrite|compress|tighten|simplify|adapt)\b/, weight: 4, label: 'utility language' },
    { pattern: /\b(optimi[sz]e|blind spot|leverage|improve)\b/, weight: 3, label: 'optimization language' },
  ],
  'pentest-web': [
    {
      pattern: /\b(web app|owasp|xss|sql injection|csrf|web security|pentest web)\b/,
      weight: 5,
      label: 'web pentest language',
    },
    {
      pattern: /\b(web application|vulnerability assessment|security audit|wstg)\b/,
      weight: 4,
      label: 'web security language',
    },
  ],
  'pentest-mobile': [
    {
      pattern: /\b(mobile app|ios security|android security|masvs|mstg|pentest mobile)\b/,
      weight: 5,
      label: 'mobile pentest language',
    },
    {
      pattern: /\b(mobile penetration|apk|ipa|app security|mobile audit)\b/,
      weight: 4,
      label: 'mobile security language',
    },
  ],
  'pentest-api': [
    {
      pattern: /\b(api security|api pentest|owasp api|bola|idor|rest api|graphql security)\b/,
      weight: 5,
      label: 'api pentest language',
    },
    {
      pattern: /\b(api vulnerability|endpoint security|api audit|swagger security)\b/,
      weight: 4,
      label: 'api security language',
    },
  ],
  'pentest-infra': [
    {
      pattern: /\b(infrastructure|network pentest|cloud security|cis benchmark|mitre att&ck|ptes)\b/,
      weight: 5,
      label: 'infra pentest language',
    },
    {
      pattern: /\b(server security|container security|kubernetes security|cloud audit)\b/,
      weight: 4,
      label: 'infra security language',
    },
  ],
};

const MODE_SIGNALS: SignalDefinition<Mode> = {
  clarify: [
    { pattern: /\b(confused|unclear|fuzzy|clarify|not sure)\b/, weight: 4, label: 'clarify language' },
    { pattern: /\b(understand|figure out|define)\b/, weight: 2, label: 'discovery language' },
  ],
  strategy: [
    { pattern: /\b(strategy|direction|choose|best|opportunity)\b/, weight: 4, label: 'strategy language' },
    { pattern: /\b(validate|position|niche)\b/, weight: 2, label: 'strategic decision language' },
  ],
  build: [
    { pattern: /\b(build|create|launch|ship|plan)\b/, weight: 3, label: 'build language' },
    { pattern: /\b(set up|assemble|develop)\b/, weight: 2, label: 'implementation language' },
  ],
  persuasion: [
    { pattern: /\b(copy|hook|persuasion|convert|cta)\b/, weight: 4, label: 'persuasion language' },
    { pattern: /\b(rewrite|headline|offer copy)\b/, weight: 3, label: 'conversion language' },
  ],
  execution: [
    { pattern: /\b(stuck|do now|sprint|focus|execute)\b/, weight: 4, label: 'execution language' },
    { pattern: /\b(priority|unblock|momentum)\b/, weight: 3, label: 'action language' },
  ],
  review: [
    { pattern: /\b(review|audit|tighten|improve|optimi[sz]e)\b/, weight: 4, label: 'review language' },
    { pattern: /\b(check|refine|polish)\b/, weight: 2, label: 'refinement language' },
  ],
};

export function routeTask(input: z.infer<typeof routeTaskInputSchema>): RouteResult {
  if (input.preferred_mode !== 'auto' && input.preferred_domain !== 'auto') {
    return {
      mode: input.preferred_mode,
      domain: input.preferred_domain,
      confidence: 1,
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

  const domainResult = input.preferred_domain !== 'auto' ? explicitChoice(input.preferred_domain) : scoreDomain(text);
  const inferredDomain = domainResult.label;
  const modeResult =
    input.preferred_mode !== 'auto' ? explicitChoice(input.preferred_mode) : scoreMode(text, inferredDomain);
  const inferredMode = modeResult.label;
  const confidence = deriveConfidence(
    domainResult.score,
    modeResult.score,
    domainResult.evidence.length,
    modeResult.evidence.length,
  );
  if (confidence < 0.7) {
    metrics.increment('route_low_confidence', { domain: inferredDomain, mode: inferredMode });
  }

  return {
    mode: inferredMode,
    domain: inferredDomain,
    confidence,
    reason: buildRouteReason(inferredMode, inferredDomain, text, {
      domainEvidence: domainResult.evidence,
      modeEvidence: modeResult.evidence,
    }),
    sequence: DOMAIN_SEQUENCES[inferredDomain],
    useUtility: inferredDomain !== 'utility',
    utilityCandidates: utilityCandidatesForMode(inferredMode),
  };
}

export function inferDomain(text: string): Domain {
  return scoreDomain(text).label;
}

export function inferMode(text: string, domain: Domain): Mode {
  return scoreMode(text, domain).label;
}

export function buildRouteReason(
  mode: Mode,
  domain: Domain,
  text: string,
  details?: { domainEvidence?: string[]; modeEvidence?: string[] },
): string {
  const domainEvidence = details?.domainEvidence?.slice(0, 2).join(', ');
  const modeEvidence = details?.modeEvidence?.slice(0, 2).join(', ');
  const evidence = [
    domainEvidence ? `domain evidence: ${domainEvidence}` : undefined,
    modeEvidence ? `mode evidence: ${modeEvidence}` : undefined,
  ]
    .filter(Boolean)
    .join('; ');
  return `Detected ${mode} mode for the ${domain} domain from task language: ${text.slice(0, 160) || 'n/a'}${evidence ? ` (${evidence})` : ''}`;
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

function scoreDomain(text: string): RankedChoice<Domain> {
  const ranked = rankSignals(text, DOMAIN_SIGNALS, 'os');
  return ranked;
}

function scoreMode(text: string, domain: Domain): RankedChoice<Mode> {
  const ranked = rankSignals(text, MODE_SIGNALS, defaultModeForDomain(domain));
  if (ranked.score > 0) {
    return ranked;
  }

  return explicitChoice(defaultModeForDomain(domain));
}

function rankSignals<TLabel extends string>(
  text: string,
  definitions: SignalDefinition<TLabel>,
  fallback: TLabel,
): RankedChoice<TLabel> {
  const rankedChoices = (Object.entries(definitions) as Array<[TLabel, SignalDefinition<TLabel>[TLabel]]>).map(
    ([label, signals]) => {
      const evidence: string[] = [];
      const score = signals.reduce((total: number, signal) => {
        if (signal.pattern.test(text)) {
          evidence.push(signal.label);
          return total + signal.weight;
        }
        return total;
      }, 0);

      return { label, score, evidence };
    },
  );

  rankedChoices.sort((left, right) => {
    if (right.score !== left.score) {
      return right.score - left.score;
    }
    return left.label.localeCompare(right.label);
  });

  const best = rankedChoices[0];
  if (!best || best.score === 0) {
    return explicitChoice(fallback);
  }

  return best;
}

function defaultModeForDomain(domain: Domain): Mode {
  if (domain === 'content') return 'persuasion';
  if (domain === 'execution') return 'execution';
  if (domain.startsWith('pentest-')) return 'review';
  return 'build';
}

function explicitChoice<TLabel extends string>(label: TLabel): RankedChoice<TLabel> {
  return { label, score: 10, evidence: ['explicit preference'] };
}

function deriveConfidence(
  domainScore: number,
  modeScore: number,
  domainEvidenceCount: number,
  modeEvidenceCount: number,
): number {
  const raw =
    0.45 + Math.min(0.5, domainScore * 0.03 + modeScore * 0.03 + domainEvidenceCount * 0.04 + modeEvidenceCount * 0.04);
  return Number(raw.toFixed(2));
}
