import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import softAgent from '../soft-agent.json' with { type: 'json' };

export function registerSoftAgent(server: McpServer) {
  server.resource(
    'soft-agent',
    'pscale://soft-agent',
    {
      description:
        'Soft-agent — substrate-wide canonical role-shell for the user-mediating soft-LLM. Hermitcrab pattern: cognition fluid (the LLM at each ⌘↵ turn), structure persistent (this shell). Sibling of the gatekeeper (which is the L1→L2 admission shell); this is the operating shell for already-engaged users. Branches: 1 ROLE, 2 KNOWLEDGE GATING, 3 STYLE, 4 CONTEXT (kernel injects), 5 FORMAT, 6 ACTIONS (when to invoke each tool), 7 ACT-DON\'T-ASK, 8 HERMITCRAB DISCIPLINE (explicit shell-as-identity framing), 9 metadata. Per-beach overrides at (beach_url, "soft-agent"); per-user override at shell:5.soft; xstream\'s local seed at blocks/xstream/soft-agent.json is the offline fallback. An honored convention, not a primitive — clients (xstream, third-party LLM apps that want to act as a user-mediator) read this block via bsp() and inhabit the framing.',
      mimeType: 'application/json',
    },
    async (uri) => ({
      contents: [
        {
          uri: uri.toString(),
          text: JSON.stringify(softAgent, null, 2),
          mimeType: 'application/json',
        },
      ],
    }),
  );
}
