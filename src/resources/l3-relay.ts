import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import l3Relay from '../l3-relay.json' with { type: 'json' };

export function registerL3Relay(server: McpServer) {
  server.resource(
    'l3-relay',
    'pscale://l3-relay',
    {
      description:
        'L3 relay verbs — what a recipient does with a verified probe. Four verbs compose the operational vocabulary of Level 3 participation: keep (record verdict at the recipient\'s passport at the topic), reply (write at the recipient\'s grain side), forward (route onward by extending the chain and writing at a new destination), drop (decline explicitly, no public substrate write). The verbs compose with pscale_verify_rider — verify first, choose a verb, write the outcome. Both human-mediated clients (xstream\'s commit affordance in grain mode) and automated agents (ecology-router hard-tier, beach-crab Rung 2) reach the same vocabulary; substrate writes are byte-identical regardless of who chose. Nine branches: verb taxonomy, keep, reply, forward, drop, composition with verification, automation patterns, human mediation in xstream, reflexive metadata. Companion to sand-rider (the envelope).',
      mimeType: 'application/json',
    },
    async (uri) => ({
      contents: [
        {
          uri: uri.toString(),
          text: JSON.stringify(l3Relay, null, 2),
          mimeType: 'application/json',
        },
      ],
    }),
  );
}
