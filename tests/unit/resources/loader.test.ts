import { afterEach, describe, expect, it, vi } from 'vitest';
import { WorkflowResourceError } from '../../../src/resources/errors.js';

const { readFileMock, accessSyncMock } = vi.hoisted(() => ({
  readFileMock: vi.fn(),
  accessSyncMock: vi.fn(),
}));

vi.mock('node:fs/promises', () => ({
  readFile: readFileMock,
}));

vi.mock('node:fs', async () => {
  const actual = await vi.importActual<typeof import('node:fs')>('node:fs');
  return {
    ...actual,
    accessSync: accessSyncMock,
  };
});

import {
  assertWorkflowReadiness,
  clearWorkflowFileCache,
  extractMarkdownSection,
  getWorkflowReadiness,
  readWorkflowFile,
} from '../../../src/resources/loader.js';

describe('resource loader', () => {
  afterEach(() => {
    vi.clearAllMocks();
    delete process.env['WORKFLOW_ROOT'];
    clearWorkflowFileCache();
  });

  it('reads a workflow file from disk', async () => {
    accessSyncMock.mockImplementation(() => undefined);
    readFileMock.mockResolvedValue('# Workflow');

    await expect(readWorkflowFile('WORKFLOW_OS_v1.md')).resolves.toBe('# Workflow');
  });

  it('throws a typed error when a file is missing', async () => {
    accessSyncMock.mockImplementation(() => undefined);
    readFileMock.mockRejectedValue(new Error('ENOENT'));

    await expect(readWorkflowFile('missing.md')).rejects.toMatchObject({
      name: 'WorkflowResourceError',
      code: 'WORKFLOW_FILE_UNREADABLE',
    });

    expect(getWorkflowReadiness().status).toBe('degraded');
  });

  it('deduplicates concurrent reads and caches successful content', async () => {
    accessSyncMock.mockImplementation(() => undefined);
    let resolveRead: ((value: string) => void) | undefined;
    readFileMock.mockImplementation(
      () =>
        new Promise<string>((resolve) => {
          resolveRead = resolve;
        }),
    );

    const firstRead = readWorkflowFile('WORKFLOW_OS_v1.md');
    const secondRead = readWorkflowFile('WORKFLOW_OS_v1.md');

    expect(readFileMock).toHaveBeenCalledTimes(1);

    resolveRead?.('# Workflow');

    await expect(Promise.all([firstRead, secondRead])).resolves.toEqual(['# Workflow', '# Workflow']);
    await expect(readWorkflowFile('WORKFLOW_OS_v1.md')).resolves.toBe('# Workflow');
    expect(readFileMock).toHaveBeenCalledTimes(1);
  });

  it('extracts a markdown section by heading and throws for missing sections', () => {
    const markdown = [
      '### 3.1   INPUT',
      'Input body',
      '',
      '#### 3.1.1 Detail',
      'Nested detail',
      '',
      '### 4.1 RESPONSE SHAPE',
      'Output body',
    ].join('\n');

    expect(extractMarkdownSection(markdown, '### 3.1 INPUT')).toContain('Nested detail');
    expect(extractMarkdownSection(markdown, '### 3.1 INPUT')).toContain('Input body');
    expect(() => extractMarkdownSection(markdown, '### 9.9 MISSING')).toThrow(WorkflowResourceError);
  });

  it('fails readiness checks when required workflow files are missing', () => {
    process.env['WORKFLOW_ROOT'] = '/tmp/definitely-missing-workflows';
    accessSyncMock.mockImplementation(() => {
      throw new Error('ENOENT');
    });

    expect(getWorkflowReadiness().status).toBe('degraded');
    expect(() => assertWorkflowReadiness()).toThrow(WorkflowResourceError);
  });
});
