import { ResourceTemplate } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import type { Domain } from '../schemas/types.js';
import { DOMAIN_FILES, DOMAIN_URI_MAP, SECTION_SEGMENTS } from '../core/catalog.js';
import { toTitle } from '../core/normalizer.js';
import { extractMarkdownSection, readWorkflowFile } from './loader.js';
import { WorkflowResourceError } from './errors.js';

const sectionResourceParamsSchema = z.object({
  domain: z.enum([
    'os',
    'freelancing',
    'products',
    'content',
    'execution',
    'investing',
    'utility',
    'pentest-web',
    'pentest-mobile',
    'pentest-api',
    'pentest-infra',
  ]),
  sectionGroup: z.string().min(1),
  sectionName: z.string().min(1),
});

export function registerSectionResources(server: McpServer): void {
  server.registerResource(
    'workflow-sections',
    new ResourceTemplate('workflow://{domain}/v1/{sectionGroup}/{sectionName}', {
      list: () => ({
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
      const parsedParams = sectionResourceParamsSchema.safeParse(params);
      if (!parsedParams.success) {
        throw new WorkflowResourceError('WORKFLOW_PARAM_INVALID', 'Invalid workflow section resource params', {
          issues: parsedParams.error.issues,
          params,
        });
      }

      const { domain, sectionGroup, sectionName } = parsedParams.data;
      const key = `${sectionGroup}/${sectionName}`;
      const segment = SECTION_SEGMENTS.find((item) => item.key === key);

      if (!segment) {
        throw new WorkflowResourceError('WORKFLOW_SECTION_NOT_FOUND', `Unsupported section: ${key}`, { key });
      }

      const fileName = DOMAIN_FILES[domain as Domain];
      if (!fileName) {
        throw new WorkflowResourceError('WORKFLOW_PARAM_INVALID', `Unknown domain: ${domain}`, { domain });
      }

      const source = await readWorkflowFile(fileName);
      const sectionText = extractMarkdownSection(source, segment.heading);

      return {
        contents: [{ uri: uri.href, text: sectionText }],
      };
    },
  );
}
