import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { routeTask } from '../core/router.js';
import { buildAppliedSequence, normalizeStage } from '../core/normalizer.js';
import { makeNextAction } from '../core/output.js';
import { DOMAIN_URI_MAP } from '../core/catalog.js';
import { log } from '../logger.js';
import { runWorkflowSequenceInputSchema, runWorkflowSequenceOutputSchema } from '../schemas/tools.js';
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
    (args) => {
      const route = routeTask({
        task: args.task,
        preferred_mode: args.mode,
        preferred_domain: args.domain,
        constraints: [],
      });

      const appliedSequence = buildAppliedSequence(args.domain, args.stage, route.sequence);
      const stage = normalizeStage(args.domain, args.stage);

      const mainDeliverable = [
        `Mode: ${args.mode}`,
        `Domain: ${args.domain}`,
        `Stage: ${stage}`,
        `Task: ${args.task}`,
        args.context ? `Context: ${args.context}` : undefined,
        `Sequence: ${appliedSequence.join(' -> ')}`,
        `Use the resource ${DOMAIN_URI_MAP[args.domain]} as the source-of-truth workflow reference.`,
      ]
        .filter(Boolean)
        .join('\n');

      const nextAction = makeNextAction(args.domain, args.task, []);

      const output = {
        mode: args.mode,
        domain: args.domain,
        main_deliverable: mainDeliverable,
        applied_sequence: appliedSequence,
        optimization_applied: args.optimize_once,
        next_action: args.next_action_required ? nextAction : 'No next action requested.',
      };

      log.info('run_workflow_sequence', { mode: args.mode, domain: args.domain, stage });
      return buildRunWorkflowSequenceResult(output);
    },
  );
}
