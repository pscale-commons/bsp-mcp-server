import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const docPath = join(__dirname, '..', '..', 'docs', 'protocol-xstream-frame.md');
const xstreamFrame = readFileSync(docPath, 'utf-8');

export function registerXstreamFrame(server: McpServer) {
  server.resource(
    'xstream-frame',
    'pscale://protocol-xstream-frame',
    {
      description:
        'The xstream frame protocol — vapour-liquid-solid as a bsp() convention. Frame is a pscale block; per-entity sub-blocks hold liquid (1) and solid (2) lanes. Vapour is out-of-band on a realtime transport. Synthesis is convention plus daemon, scoped by CADO face. The xstream interface has two layers in reverse proportion to traditional web tools: V-L-S canvas (primary, reflexive) plus a toggleable viewer drawer (secondary, objective, face-scoped). Read this when implementing or extending the xstream interface, building a synthesis daemon, or mapping multi-face collaboration onto pscale blocks.',
      mimeType: 'text/markdown',
    },
    async (uri) => ({
      contents: [
        {
          uri: uri.toString(),
          text: xstreamFrame,
          mimeType: 'text/markdown',
        },
      ],
    }),
  );
}
