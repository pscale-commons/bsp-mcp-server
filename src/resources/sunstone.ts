import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import sunstone from '../sunstone.json' with { type: 'json' };

export function registerSunstone(server: McpServer) {
  server.resource(
    'sunstone',
    'pscale://sunstone',
    {
      description:
        'Sunstone — the teaching block for the BSP MCP. Self-contained: teaches its own format, the function that operates on it, and the discipline of voicing that authors its content. Eight branches frame the same primitive from eight angles (geometry, function, access, substrate, composition, commons, reflexive, voicing). Walk it with bsp() to learn how to use bsp(). The block IS the test.',
      mimeType: 'application/json',
    },
    async (uri) => ({
      contents: [
        {
          uri: uri.toString(),
          text: JSON.stringify(sunstone, null, 2),
          mimeType: 'application/json',
        },
      ],
    }),
  );
}
