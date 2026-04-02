import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { routeTask } from '../core/router.js';
import { log } from '../logger.js';
import { runWorkflowSequenceInputSchema, runWorkflowSequenceOutputSchema } from '../schemas/tools.js';
import { executeWorkflow } from '../services/workflows.js';
import { buildRunWorkflowSequenceResult } from './transformers.js';

export function registerRunTool(server: McpServer): void {
  server.registerTool(
    'run_workflow_sequence',
    {
      title: 'Run Workflow Sequence',
      description:
        'Run the selected domain workflow and return one main deliverable plus one next action. ' +
        'This is the primary execution tool — call route_task first to determine mode and domain.',
      inputSchema: runWorkflowSequenceInputSchema,
      outputSchema: runWorkflowSequenceOutputSchema,
    },
    async (args) => {
      const route = routeTask({
        task: args.task,
        preferred_mode: args.mode,
        preferred_domain: args.domain,
        constraints: [],
      });

      const output = await executeWorkflow({
        mode: args.mode,
        domain: args.domain,
        task: args.task,
        stage: args.stage,
        optimizeOnce: args.optimize_once,
        nextActionRequired: args.next_action_required,
        ...(args.context ? { context: args.context } : {}),
      });

      log.info('run_workflow_sequence', {
        mode: args.mode,
        domain: args.domain,
        stage: output.stage,
        routed_sequence: route.sequence.join(' -> '),
      });

      return buildRunWorkflowSequenceResult({
        mode: output.mode,
        domain: output.domain,
        stage: output.stage,
        workflow_reference: output.workflowReference,
        stage_outcome: output.stageOutcome,
        execution_summary: output.executionSummary,
        recommendations: output.recommendations,
        supporting_notes: output.supportingNotes,
        applied_sequence: output.appliedSequence,
        optimization_applied: output.optimizationApplied,
        next_action: output.nextAction,
      });
    },
  );
}
