import { readFile } from 'node:fs/promises';
import * as path from 'node:path';
import { escapeRegex } from '../core/normalizer.js';

/**
 * Root directory where the seven v4 workflow markdown files live.
 * Override via WORKFLOW_ROOT environment variable.
 */
export const WORKFLOW_ROOT: string = process.env['WORKFLOW_ROOT'] ?? process.cwd();

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
      'Set the WORKFLOW_ROOT environment variable to the directory containing the v4 workflow files.',
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
