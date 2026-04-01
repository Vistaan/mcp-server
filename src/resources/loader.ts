import { readFile } from 'node:fs/promises';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
import { escapeRegex } from '../core/normalizer.js';

/**
 * Bundled workflows directory — co-located in the project at /workflows.
 * Can be overridden via WORKFLOW_ROOT for custom deployments.
 */
const BUNDLED_WORKFLOWS = path.resolve(fileURLToPath(import.meta.url), '../../../workflows');

export const WORKFLOW_ROOT: string = process.env['WORKFLOW_ROOT'] ?? BUNDLED_WORKFLOWS;

/**
 * Reads a workflow file from WORKFLOW_ROOT.
 * Returns a descriptive error markdown string instead of throwing when the
 * file is missing — keeps the server running even if WORKFLOW_ROOT is misconfigured.
 */
export async function readWorkflowFile(fileName: string): Promise<string> {
  const absolutePath = path.join(WORKFLOW_ROOT, fileName);
  try {
    return await readFile(absolutePath, 'utf8');
  } catch (error) {
    return [
      '# Missing workflow file',
      `Expected file: ${absolutePath}`,
      `Error: ${error instanceof Error ? error.message : String(error)}`,
      '',
      'Workflow files are bundled in the /workflows directory.',
      'Override via WORKFLOW_ROOT environment variable if needed.',
    ].join('\n');
  }
}

/**
 * Extracts a markdown section by its heading prefix.
 * Stops at the next sibling heading (###  N.M) or end of file.
 */
export function extractMarkdownSection(markdown: string, heading: string): string {
  const escapedHeading = escapeRegex(heading);
  const pattern = new RegExp(`${escapedHeading}[\\s\\S]*?(?=\\n###\\s\\d\\.\\d|$)`, 'm');
  const match = markdown.match(pattern);
  return match?.[0] ?? `${heading}\n\nSection not found.`;
}
