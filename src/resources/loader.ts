import { readFile } from 'node:fs/promises';
import { accessSync, constants } from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
import { DOMAIN_FILES } from '../core/catalog.js';
import { escapeRegex } from '../core/normalizer.js';
import { WorkflowResourceError } from './errors.js';

/**
 * Bundled workflows directory — co-located in the project at /workflows.
 * Can be overridden via WORKFLOW_ROOT for custom deployments.
 */
const BUNDLED_WORKFLOWS = path.resolve(fileURLToPath(import.meta.url), '../../../workflows');

type WorkflowReadiness = {
  status: 'ok' | 'degraded';
  workflowRoot: string;
  missingFiles: string[];
  checkedAt: string;
};

const workflowFileCache = new Map<string, string>();
const workflowReadInflight = new Map<string, Promise<string>>();

let activeWorkflowRoot = '';
let lastReadiness: WorkflowReadiness | undefined;

function getBundledWorkflowRoot(): string {
  return process.env['WORKFLOW_ROOT'] ?? BUNDLED_WORKFLOWS;
}

function resetCacheIfWorkflowRootChanged(): string {
  const workflowRoot = getBundledWorkflowRoot();
  if (activeWorkflowRoot !== workflowRoot) {
    workflowFileCache.clear();
    workflowReadInflight.clear();
    activeWorkflowRoot = workflowRoot;
    lastReadiness = undefined;
  }
  return workflowRoot;
}

function listRequiredWorkflowFiles(): string[] {
  return Array.from(new Set(Object.values(DOMAIN_FILES)));
}

function toWorkflowFilePath(fileName: string): string {
  return path.join(resetCacheIfWorkflowRootChanged(), fileName);
}

function setReadiness(missingFiles: string[]): WorkflowReadiness {
  lastReadiness = {
    status: missingFiles.length === 0 ? 'ok' : 'degraded',
    workflowRoot: activeWorkflowRoot || getBundledWorkflowRoot(),
    missingFiles,
    checkedAt: new Date().toISOString(),
  };
  return lastReadiness;
}

function rememberUnreadableWorkflow(fileName: string): void {
  const current = getWorkflowReadiness();
  if (current.missingFiles.includes(fileName)) {
    return;
  }

  setReadiness([...current.missingFiles, fileName].sort());
}

export function clearWorkflowFileCache(): void {
  workflowFileCache.clear();
  workflowReadInflight.clear();
  lastReadiness = undefined;
  activeWorkflowRoot = getBundledWorkflowRoot();
}

export function getWorkflowReadiness(): WorkflowReadiness {
  const workflowRoot = resetCacheIfWorkflowRootChanged();
  if (lastReadiness?.workflowRoot === workflowRoot) {
    return lastReadiness;
  }

  const missingFiles = listRequiredWorkflowFiles().filter((fileName) => {
    try {
      accessSync(path.join(workflowRoot, fileName), constants.R_OK);
      return false;
    } catch {
      return true;
    }
  });

  return setReadiness(missingFiles);
}

export function assertWorkflowReadiness(): void {
  const readiness = getWorkflowReadiness();
  if (readiness.status === 'degraded') {
    throw new WorkflowResourceError(
      'WORKFLOW_FILE_UNREADABLE',
      `Required workflow files are unreadable from ${readiness.workflowRoot}`,
      { missingFiles: readiness.missingFiles, workflowRoot: readiness.workflowRoot },
    );
  }
}

/**
 * Reads a workflow file from WORKFLOW_ROOT with an in-memory single-flight cache.
 */
export async function readWorkflowFile(fileName: string): Promise<string> {
  const absolutePath = toWorkflowFilePath(fileName);
  const cached = workflowFileCache.get(absolutePath);
  if (cached !== undefined) {
    return cached;
  }

  const existingRead = workflowReadInflight.get(absolutePath);
  if (existingRead) {
    return existingRead;
  }

  const readPromise = readFile(absolutePath, 'utf8')
    .then((contents) => {
      workflowFileCache.set(absolutePath, contents);
      const current = getWorkflowReadiness();
      if (current.missingFiles.includes(fileName)) {
        setReadiness(current.missingFiles.filter((item) => item !== fileName));
      }
      return contents;
    })
    .catch((error) => {
      rememberUnreadableWorkflow(fileName);
      throw new WorkflowResourceError(
        'WORKFLOW_FILE_UNREADABLE',
        `Workflow file is unreadable: ${absolutePath}`,
        { fileName, absolutePath },
        { cause: error },
      );
    })
    .finally(() => {
      workflowReadInflight.delete(absolutePath);
    });

  workflowReadInflight.set(absolutePath, readPromise);
  return readPromise;
}

/**
 * Extracts a markdown section by heading text.
 * Stops at the next heading with the same or shallower depth.
 */
export function extractMarkdownSection(markdown: string, heading: string): string {
  const normalizedHeading = heading.trim().replace(/\s+/g, ' ');
  const headingMatch = normalizedHeading.match(/^(#{1,6})\s+(.*)$/);

  if (!headingMatch) {
    throw new WorkflowResourceError('WORKFLOW_SECTION_NOT_FOUND', `Invalid section heading: ${heading}`, { heading });
  }

  const headingHashes = headingMatch[1];
  const headingText = headingMatch[2];
  if (!headingHashes || !headingText) {
    throw new WorkflowResourceError('WORKFLOW_SECTION_NOT_FOUND', `Invalid section heading: ${heading}`, { heading });
  }

  const targetDepth = headingHashes.length;
  const targetText = escapeRegex(headingText.trim().replace(/\s+/g, ' '));
  const lines = markdown.split('\n');

  let startIndex = -1;
  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index]?.trim().replace(/\s+/g, ' ');
    if (line && new RegExp(`^#{${targetDepth}}\\s+${targetText}$`).test(line)) {
      startIndex = index;
      break;
    }
  }

  if (startIndex === -1) {
    throw new WorkflowResourceError('WORKFLOW_SECTION_NOT_FOUND', `Section not found: ${heading}`, { heading });
  }

  let endIndex = lines.length;
  for (let index = startIndex + 1; index < lines.length; index += 1) {
    const line = lines[index]?.trim();
    const match = line?.match(/^(#{1,6})\s+/);
    if (match?.[1] && match[1].length <= targetDepth) {
      endIndex = index;
      break;
    }
  }

  return lines.slice(startIndex, endIndex).join('\n').trimEnd();
}
