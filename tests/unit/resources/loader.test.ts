import { afterEach, describe, expect, it, vi } from 'vitest';

const { readFileMock } = vi.hoisted(() => ({
  readFileMock: vi.fn(),
}));

vi.mock('node:fs/promises', () => ({
  readFile: readFileMock,
}));

import { extractMarkdownSection, readWorkflowFile } from '../../../src/resources/loader.js';

describe('resource loader', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('reads a workflow file from disk', async () => {
    readFileMock.mockResolvedValue('# Workflow');

    await expect(readWorkflowFile('WORKFLOW_OS_v4.md')).resolves.toBe('# Workflow');
  });

  it('returns a descriptive markdown error when a file is missing', async () => {
    readFileMock.mockRejectedValue(new Error('ENOENT'));

    const result = await readWorkflowFile('missing.md');

    expect(result).toContain('# Missing workflow file');
    expect(result).toContain('missing.md');
    expect(result).toContain('ENOENT');
  });

  it('extracts a markdown section by heading and handles missing sections', () => {
    const markdown = ['### 3.1 INPUT', 'Input body', '', '### 4.1 RESPONSE SHAPE', 'Output body'].join('\n');

    expect(extractMarkdownSection(markdown, '### 3.1 INPUT')).toContain('Input body');
    expect(extractMarkdownSection(markdown, '### 9.9 MISSING')).toContain('Section not found.');
  });
});
