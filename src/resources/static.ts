import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { STATIC_RESOURCES } from '../core/catalog.js';
import { readWorkflowFile } from './loader.js';

export function registerStaticResources(server: McpServer): void {
  for (const resource of STATIC_RESOURCES) {
    server.registerResource(
      resource.id,
      resource.uri,
      {
        title: resource.title,
        description: resource.description,
        mimeType: resource.mimeType ?? 'text/plain',
      },
      async (uri) => {
        const text = await readWorkflowFile(resource.fileName);
        return {
          contents: [{ uri: uri.href, text }],
        };
      },
    );
  }
}
