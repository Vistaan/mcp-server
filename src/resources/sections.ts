import { ResourceTemplate } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { Domain } from '../schemas/types.js';
import { DOMAIN_FILES, DOMAIN_URI_MAP, SECTION_SEGMENTS } from '../core/catalog.js';
import { toTitle } from '../core/normalizer.js';
import { extractMarkdownSection, readWorkflowFile } from './loader.js';

export function registerSectionResources(server: McpServer): void {
  server.registerResource(
    'workflow-sections',
    new ResourceTemplate('workflow://{domain}/v4/{sectionGroup}/{sectionName}', {
      list: async () => ({
        resources: SECTION_SEGMENTS.flatMap((segment) =>
          (Object.keys(DOMAIN_URI_MAP) as Domain[]).map((domain) => ({
            uri: `${DOMAIN_URI_MAP[domain]}/${segment.key}`,
            name: `${toTitle(domain)} ${segment.titleSuffix}`,
            mimeType: 'text/markdown',
          })),
        ),
      }),
    }),
    {
      title: 'Workflow Section',
      description: 'Machine-addressable execution/output subsection for a specific workflow file.',
      mimeType: 'text/markdown',
    },
    async (uri, params) => {
      const domain = params['domain'] as Domain;
      const sectionGroup = String(params['sectionGroup']);
      const sectionName = String(params['sectionName']);
      const key = `${sectionGroup}/${sectionName}`;
      const segment = SECTION_SEGMENTS.find((item) => item.key === key);

      if (!segment) {
        throw new Error(`Unsupported section: ${key}`);
      }

      const fileName = DOMAIN_FILES[domain];
      if (!fileName) {
        throw new Error(`Unknown domain: ${domain}`);
      }

      const source = await readWorkflowFile(fileName);
      const sectionText = extractMarkdownSection(source, segment.heading);

      return {
        contents: [{ uri: uri.href, text: sectionText }],
      };
    },
  );
}
