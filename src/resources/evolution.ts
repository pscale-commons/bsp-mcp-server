import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import evolution from '../evolution.json' with { type: 'json' };

export function registerEvolution(server: McpServer) {
  server.resource(
    'evolution',
    'pscale://evolution',
    {
      description:
        'The five-level relational framing of the pscale agent ecology. Walkable as a pscale block. Pscale is the substrate, not a level — these levels describe relational acts. 1=Signal (leave marks), 2=Commitment (grain or rock), 3=Semantic networks (SAND riders), 4=Mutual objectives (pools, GRIT, Onen RPG), 5=Shared context (MAGI + xstream). Star walk at digit 5 within each level for the beach-crab rung at that level. Walk by digit for each level\'s substance.',
      mimeType: 'application/json',
    },
    async (uri) => ({
      contents: [
        {
          uri: uri.toString(),
          text: JSON.stringify(evolution, null, 2),
          mimeType: 'application/json',
        },
      ],
    }),
  );
}
