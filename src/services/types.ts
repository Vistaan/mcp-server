import type { Domain, Mode } from '../schemas/types.js';

export type WorkflowExecutionCommand = {
  mode: Mode;
  domain: Domain;
  task: string;
  context?: string;
  stage: string;
  optimizeOnce: boolean;
  nextActionRequired: boolean;
};

export type WorkflowExecutionResult = {
  mode: Mode;
  domain: Domain;
  stage: string;
  workflowReference: string;
  stageOutcome: string;
  executionSummary: string;
  recommendations: string[];
  supportingNotes: string[];
  appliedSequence: string[];
  optimizationApplied: boolean;
  nextAction: string;
};

export type UtilityExecutionCommand = {
  utilityName: string;
  content: string;
  context?: string;
};

export type UtilityExecutionResult = {
  utilityName: string;
  operation: string;
  originalContent: string;
  revisedContent: string;
  issuesFound: string[];
  changesApplied: string[];
  nextAction: string;
};
