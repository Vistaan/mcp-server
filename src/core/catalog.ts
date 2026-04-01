import type { Domain, ResourceDef, SectionSegment } from '../schemas/types.js';
import type { Mode } from '../schemas/types.js';

export const DOMAIN_FILES: Record<Domain | 'execute-referencing', string> = {
  os: 'WORKFLOW_OS_v4.md',
  freelancing: 'WORKFLOW_FREELANCING_v4.md',
  products: 'WORKFLOW_PRODUCTS_v4.md',
  content: 'WORKFLOW_CONTENT_v4.md',
  execution: 'WORKFLOW_EXECUTION_v4.md',
  investing: 'WORKFLOW_INVESTING_v4.md',
  utility: 'UTILITY_PROMPTS_v4.md',
  'execute-referencing': 'WORKFLOW_EXECUTE_REFERENCING_v4.md',
};

export const DOMAIN_URI_MAP: Record<Domain, string> = {
  os: 'workflow://os/v4',
  freelancing: 'workflow://freelancing/v4',
  products: 'workflow://products/v4',
  content: 'workflow://content/v4',
  execution: 'workflow://execution/v4',
  investing: 'workflow://investing/v4',
  utility: 'workflow://utility/v4',
};

export const DOMAIN_SEQUENCES: Record<Domain, string[]> = {
  os: ['route', 'diagnose', 'run', 'optimize_once', 'next_action'],
  freelancing: ['skill', 'niche', 'offer', 'pricing', 'portfolio', 'outreach', 'first_client', 'premium', 'growth'],
  products: ['idea', 'validate', 'build', 'value', 'pricing', 'offer', 'first_sale'],
  content: ['audience_pain', 'direction', 'ideas', 'hooks', 'write', 'improve', 'optimize', 'consistency'],
  execution: ['do_now', 'organize', 'simplify', 'unblock', 'sprint', 'priorities', 'momentum'],
  investing: ['analyze', 'watchlist', 'news', 'trade_setup', 'red_flags', 'trade_review', 'system'],
  utility: [
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
  ],
};

export const MODE_TO_PROMPT: Record<Mode, string> = {
  clarify: 'clarify_task',
  strategy: 'strategize_task',
  build: 'build_output',
  persuasion: 'improve_persuasion',
  execution: 'force_execution',
  review: 'review_optimize',
};

export const SECTION_SEGMENTS: readonly SectionSegment[] = [
  { key: 'execution/input', heading: '### 3.1 INPUT', titleSuffix: 'Execution Input' },
  { key: 'execution/decision-rule', heading: '### 3.2 DECISION RULE', titleSuffix: 'Execution Decision Rule' },
  { key: 'execution/sequence', heading: '### 3.3 SEQUENCE', titleSuffix: 'Execution Sequence' },
  { key: 'execution/command-format', heading: '### 3.4 COMMAND FORMAT', titleSuffix: 'Execution Command Format' },
  { key: 'execution/operating-rules', heading: '### 3.5 OPERATING RULES', titleSuffix: 'Execution Operating Rules' },
  { key: 'output/response-shape', heading: '### 4.1 RESPONSE SHAPE', titleSuffix: 'Output Response Shape' },
  { key: 'output/output-rules', heading: '### 4.2 OUTPUT RULES', titleSuffix: 'Output Rules' },
  { key: 'output/completion-rule', heading: '### 4.3 COMPLETION RULE', titleSuffix: 'Completion Rule' },
] as const;

export const STATIC_RESOURCES: ResourceDef[] = [
  {
    id: 'workflow-os',
    domain: 'os',
    uri: DOMAIN_URI_MAP.os,
    fileName: DOMAIN_FILES.os,
    title: 'Workflow OS v4',
    description: 'Top-level router, operating modes, and output discipline.',
    mimeType: 'text/markdown',
  },
  {
    id: 'workflow-freelancing',
    domain: 'freelancing',
    uri: DOMAIN_URI_MAP.freelancing,
    fileName: DOMAIN_FILES.freelancing,
    title: 'Workflow Freelancing v4',
    description: 'Freelancing workflow: skill to premium offer.',
    mimeType: 'text/markdown',
  },
  {
    id: 'workflow-products',
    domain: 'products',
    uri: DOMAIN_URI_MAP.products,
    fileName: DOMAIN_FILES.products,
    title: 'Workflow Products v4',
    description: 'Digital product workflow: idea to first sale.',
    mimeType: 'text/markdown',
  },
  {
    id: 'workflow-content',
    domain: 'content',
    uri: DOMAIN_URI_MAP.content,
    fileName: DOMAIN_FILES.content,
    title: 'Workflow Content v4',
    description: 'Content and persuasion workflow.',
    mimeType: 'text/markdown',
  },
  {
    id: 'workflow-execution',
    domain: 'execution',
    uri: DOMAIN_URI_MAP.execution,
    fileName: DOMAIN_FILES.execution,
    title: 'Workflow Execution v4',
    description: 'Execution workflow for anti-overwhelm and momentum.',
    mimeType: 'text/markdown',
  },
  {
    id: 'workflow-investing',
    domain: 'investing',
    uri: DOMAIN_URI_MAP.investing,
    fileName: DOMAIN_FILES.investing,
    title: 'Workflow Investing v4',
    description: 'Investing workflow: analysis to system design.',
    mimeType: 'text/markdown',
  },
  {
    id: 'workflow-utility',
    domain: 'utility',
    uri: DOMAIN_URI_MAP.utility,
    fileName: DOMAIN_FILES.utility,
    title: 'Utility Prompts v4',
    description: 'Supporting utility prompts and optimization tools.',
    mimeType: 'text/markdown',
  },
  {
    id: 'workflow-execute-referencing',
    domain: 'execute-referencing',
    uri: 'workflow://execute-referencing/v4',
    fileName: DOMAIN_FILES['execute-referencing'],
    title: 'Workflow Execute Referencing v4',
    description: 'Dispatcher/orchestration policy for the seven v4 workflow files.',
    mimeType: 'text/markdown',
  },
];
