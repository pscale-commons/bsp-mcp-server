import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import gatekeeper from '../gatekeeper.json' with { type: 'json' };

export function registerGatekeeper(server: McpServer) {
  server.resource(
    'gatekeeper',
    'pscale://gatekeeper',
    {
      description:
        'Gatekeeper — substrate-wide canonical role-shell for the L1→L2 admission threshold. Hermitcrab pattern: cognition fluid (any LLM with an API key inhabits it), structure persistent (this shell). An honored convention, not a primitive — pscale_grain_reach stays permissive; gatekeeper is the shape clients honour when admitting an agent from Signal (marks/vapour) into Commitment (grain/sed:). Branches: 1 voice, 2 criteria (admit/retry signals), 3 opening, 4 turn-2 follow-up patterns, 5 decision rules, 6 reply copy, 7 host invocation patterns (host-invoked vs reflective — claude-app/chatgpt clients run admission in-session and write passport:8 directly), 9 metadata. Per-beach overrides at (beach_url, "gatekeeper"); seeded fallback in xstream-play/blocks/gatekeeper.json. See docs/DESIGN-CHANNELS.md § "The gatekeeper as hermitcrab" and § "The architectural choice — convention, not primitive".',
      mimeType: 'application/json',
    },
    async (uri) => ({
      contents: [
        {
          uri: uri.toString(),
          text: JSON.stringify(gatekeeper, null, 2),
          mimeType: 'application/json',
        },
      ],
    }),
  );
}
