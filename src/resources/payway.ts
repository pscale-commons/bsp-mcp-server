import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const docPath = join(__dirname, '..', '..', 'docs', 'payway.md');
const payway = readFileSync(docPath, 'utf-8');

const DESCRIPTION =
  'The payway convention — pay forward to contribute and experience, not to access. It gates creative PARTICIPATION in face-bound sed: collectives via ticket grains; reading/consumption stays open by default. A sed: collective declares a payway config sub-block at position 9 (sed::9) carrying issuer, purchase URL, face, and scope at digit fields 9.1..9.5; a ticket is an ordinary grain whose envelope text marks it as such; registration references the grain; a verifier daemon writes a [ticket-verified] envelope. Substrate stays neutral (no "ticket" or "payment" in bsp-mcp primitives). Reference build lives in pscale-commons/ticketing-agent. Read this when implementing a payway-aware client (e.g. xstream-play affordance), authoring a payway-gated sed: collective, or running a verifier. Sibling to protocol-xstream-frame (which provides the V-L-S loop the payway gates) and protocol-pscale-beach-v2 (which the audit log writes onto).';

/**
 * Register the long-form markdown at the canonical `pscale://payway` and at the
 * legacy `pscale://protocol-paywall` alias (so existing references keep working).
 */
export function registerPayway(server: McpServer) {
  for (const [name, uri] of [
    ['payway', 'pscale://payway'],
    ['protocol-paywall', 'pscale://protocol-paywall'],
  ] as const) {
    server.resource(
      name,
      uri,
      { description: DESCRIPTION, mimeType: 'text/markdown' },
      async (u) => ({
        contents: [{ uri: u.toString(), text: payway, mimeType: 'text/markdown' }],
      }),
    );
  }
}
