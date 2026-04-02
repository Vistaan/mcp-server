import { beforeEach, describe, expect, it, vi } from 'vitest';
import { registerResources } from '../../../src/resources/index.js';
import { registerStaticResources } from '../../../src/resources/static.js';
import { registerSectionResources } from '../../../src/resources/sections.js';

const { readWorkflowFileMock, extractMarkdownSectionMock } = vi.hoisted(() => ({
  readWorkflowFileMock: vi.fn(),
  extractMarkdownSectionMock: vi.fn((source: string, heading: string) => `${heading}\n${source}`),
}));

vi.mock('../../../src/resources/loader.js', () => ({
  readWorkflowFile: readWorkflowFileMock,
  extractMarkdownSection: extractMarkdownSectionMock,
}));

type ResourceHandler = (uri: URL, params: Record<string, unknown>) => Promise<{
  contents: Array<{ uri: string; text: string }>;
}>;

function createResourceServer() {
  const resources: Array<{ id: string; target: unknown; handler: ResourceHandler }> = [];
  const server = {
    registerResource: vi.fn((id: string, target: unknown, _meta: unknown, handler: ResourceHandler) => {
      resources.push({ id, target, handler });
    }),
  };

  return { server, resources };
}

describe('resource registration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    readWorkflowFileMock.mockResolvedValue('workflow body');
  });

  it('registers static resources and reads workflow contents', async () => {
    const { server, resources } = createResourceServer();

    registerStaticResources(server as never);

    expect(server.registerResource).toHaveBeenCalledTimes(8);

    const result = await resources[0]!.handler(new URL('workflow://os/v4'), {});
    expect(result.contents[0]).toEqual({ uri: 'workflow://os/v4', text: 'workflow body' });
  });

  it('registers section resources, lists entries, and resolves a section', async () => {
    const { server, resources } = createResourceServer();

    registerSectionResources(server as never);

    expect(server.registerResource).toHaveBeenCalledTimes(1);

    const section = resources[0]!;
    const listResult = await (section.target as { _callbacks: { list: () => Promise<{ resources: unknown[] }> } })
      ._callbacks.list();
    const result = await section.handler(new URL('workflow://os/v4/execution/input'), {
      domain: 'os',
      sectionGroup: 'execution',
      sectionName: 'input',
    });

    expect(listResult.resources.length).toBeGreaterThan(0);
    expect(result.contents[0]?.text).toContain('### 3.1 INPUT');
  });

  it('throws for unsupported or unknown section requests', async () => {
    const { resources } = createResourceServer();

    registerSectionResources({ registerResource: vi.fn((id: string, target: unknown, _meta: unknown, handler: ResourceHandler) => {
      resources.push({ id, target, handler });
    }) } as never);

    const section = resources[0]!;

    await expect(
      section.handler(new URL('workflow://os/v4/bad/section'), {
        domain: 'os',
        sectionGroup: 'bad',
        sectionName: 'section',
      }),
    ).rejects.toThrow('Unsupported section');

    await expect(
      section.handler(new URL('workflow://unknown/v4/execution/input'), {
        domain: 'unknown',
        sectionGroup: 'execution',
        sectionName: 'input',
      }),
    ).rejects.toThrow('Invalid workflow section resource params');
  });

  it('registers both static and section resources together', () => {
    const { server } = createResourceServer();

    registerResources(server as never);

    expect(server.registerResource).toHaveBeenCalledTimes(9);
  });
});
