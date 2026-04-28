import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import whetstone from '../whetstone.json' with { type: 'json' };

export function registerWhetstone(server: McpServer) {
  server.resource(
    'whetstone',
    'pscale://whetstone',
    {
      description:
        'Whetstone — operational reference for the BSP MCP. The sharpener that ships with the function. Five branches: signature, selection-shape derivation, modifier composition, storage adapter, translation from pscale-mcp idioms. Walk by position to retrieve the slice you need (e.g. 1.4 for the pscale_attention parameter, 2.2 for ring derivation, 5.1 for walk-mode-spindle translation).',
      mimeType: 'application/json',
    },
    async (uri) => ({
      contents: [
        {
          uri: uri.toString(),
          text: JSON.stringify(whetstone, null, 2),
          mimeType: 'application/json',
        },
      ],
    }),
  );
}
