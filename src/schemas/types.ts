export type Mode = 'clarify' | 'strategy' | 'build' | 'persuasion' | 'execution' | 'review';

export type Domain =
  | 'os'
  | 'freelancing'
  | 'products'
  | 'content'
  | 'execution'
  | 'investing'
  | 'utility'
  | 'pentest-web'
  | 'pentest-mobile'
  | 'pentest-api'
  | 'pentest-infra';

export type RouteDomain = Domain | 'auto';

export type RouteMode = Mode | 'auto';

export type RouteResult = {
  mode: Mode;
  domain: Domain;
  confidence: number;
  reason: string;
  sequence: string[];
  useUtility: boolean;
  utilityCandidates: string[];
};

export type ResourceDef = {
  id: string;
  domain: Domain | 'execute-referencing' | 'design-reference';
  uri: string;
  fileName: string;
  title: string;
  description: string;
  mimeType?: string;
};

export type SectionSegment = {
  key: string;
  heading: string;
  titleSuffix: string;
};

/** Wraps tool output to satisfy MCP CallToolResult shape. */
export type ToolEnvelope<T> = {
  content: Array<{ type: 'text'; text: string }>;
  structuredContent: T;
};
