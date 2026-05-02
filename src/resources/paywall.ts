import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const docPath = join(__dirname, '..', '..', 'docs', 'protocol-paywall.md');
const paywall = readFileSync(docPath, 'utf-8');

export function registerPaywall(server: McpServer) {
  server.resource(
    'paywall',
    'pscale://protocol-paywall',
    {
      description:
        'The paywall convention — gating creative participation in face-bound sed: collectives via ticket grains. A sed: collective declares a _tickets field naming an issuer, purchase URL, face, and scope; a ticket is an ordinary grain whose envelope text marks it as such; registration references the grain; a verifier daemon writes a [ticket-verified] envelope. Substrate stays neutral (no "ticket" or "payment" in bsp-mcp primitives). Reference build lives in pscale-commons/ticketing-agent. Read this when implementing a paywall-aware client (e.g. xstream-play affordance), authoring a paywalled sed: collective, or running a verifier. Sibling to protocol-xstream-frame (which provides the V-L-S loop the paywall gates) and protocol-pscale-beach-v2 (which the audit log writes onto).',
      mimeType: 'text/markdown',
    },
    async (uri) => ({
      contents: [
        {
          uri: uri.toString(),
          text: paywall,
          mimeType: 'text/markdown',
        },
      ],
    }),
  );
}
