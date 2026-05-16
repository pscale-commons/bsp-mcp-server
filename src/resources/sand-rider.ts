import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import sandRider from '../sand-rider.json' with { type: 'json' };

export function registerSandRider(server: McpServer) {
  server.resource(
    'sand-rider',
    'pscale://sand-rider',
    {
      description:
        'SAND rider — Signed Agent Network Datagram envelope. The format that rides on Level 3 content moving through committed channels (grain sides, sed: positions, pool slots). A rider carries probe_id, credit claim, SQ claim, sha256 chain of hops, topic_coordinate; recipients verify deterministically via pscale_verify_rider; verdicts accumulate as evaluations at the recipient\'s passport at the topic coordinate. Pure format — non-enforcing; chain integrity is tamper-evident sha256; credit and SQ are arithmetic claims against the sender\'s passport at conventional addresses. Nine branches: vocabulary, rider shape, composition with content, chain protocol, topic coordinates, verification and verdict, evaluations accumulation, authoring discipline, reflexive metadata. Companion to l3-relay (the verbs) and to pscale_verify_rider (the primitive).',
      mimeType: 'application/json',
    },
    async (uri) => ({
      contents: [
        {
          uri: uri.toString(),
          text: JSON.stringify(sandRider, null, 2),
          mimeType: 'application/json',
        },
      ],
    }),
  );
}
