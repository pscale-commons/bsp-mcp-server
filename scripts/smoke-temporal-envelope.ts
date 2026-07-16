/**
 * smoke-temporal-envelope.ts — S2: the grounding, driven through the REAL
 * server wrapper rather than by calling the helpers directly.
 *
 * The unit smoke (smoke-temporal.ts) proves the arithmetic. This proves the
 * WIRING: that a tool registered on the actual McpServer comes back with its
 * timestamps aged and its response stamped, that errors stay ungrounded, and
 * that the install order of the two wrappers is right. Run:
 *   npm run smoke:temporal-envelope
 */

import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import { createServer } from '../src/server.js';
import { groundResult, annotateAges, ground } from '../src/temporal.js';

let pass = 0, fail = 0;
const ok = (name: string, cond: boolean, detail = '') => {
  if (cond) { pass++; console.log(`  ✓ ${name}`); }
  else { fail++; console.log(`  ✗ ${name}${detail ? ` — ${detail}` : ''}`); }
};

const NOW = new Date('2026-07-15T18:30:00Z');

console.log('\nANNOTATION — the relation lands beside the data');
{
  // A real marks read, as fmtResult would render it.
  const rendered = [
    '[whole block]',
    '{',
    '  "1": {',
    '    "_": "weft passing through",',
    '    "1": "weft",',
    '    "3": "2026-07-14T09:12:00Z"',
    '  },',
    '  "2": {',
    '    "_": "happyhedgehog says hello",',
    '    "3": "2026-07-15T18:22:00Z"',
    '  }',
    '}',
  ].join('\n');
  const out = annotateAges(rendered, NOW);
  ok('a day-old mark is aged in place', out.includes('"2026-07-14T09:12:00Z (+2 — about a day ago)"'));
  ok('a mark from this beat is aged in place', out.includes('"2026-07-15T18:22:00Z (+0 — this beat ago)"')
    || out.includes('2026-07-15T18:22:00Z (0 — this beat'), out.split('\n').find(l => l.includes('18:22')));
  ok('the block structure survives verbatim', out.includes('"_": "weft passing through"'));
  ok('non-timestamp digits are untouched', out.includes('"1": "weft"'));
}

console.log('\nA DATE IN PROSE IS LEFT ALONE (only instants are stamps)');
{
  const prose = 'The genesis passage was authored on 2026-07-15 and stands.';
  ok('bare date is not annotated', annotateAges(prose, NOW) === prose);
}

console.log('\nGROUND — body annotated, stamp appended, stamp not self-annotated');
{
  const out = ground('last seen 2026-07-14T09:12:00Z', NOW);
  ok('body is aged', out.includes('2026-07-14T09:12:00Z (+2 — about a day ago)'));
  ok('stamp is appended', out.trimEnd().endsWith('Wednesday 15 July 2026, late afternoon (beat 9)'));
  ok('the stamp does not annotate itself',
    !out.includes('2026-07-15T18:30:00Z (0'), out.split('\n').pop());
  ok('exactly one stamp', (out.match(/^now · /gm) || []).length === 1);
}

console.log('\nGROUNDRESULT — MCP result shape');
{
  const res = groundResult({ content: [{ type: 'text', text: 'seen 2026-07-14T09:12:00Z' }] }, NOW);
  const text = (res as any).content[0].text;
  ok('aged', text.includes('(+2 — about a day ago)'));
  ok('stamped', text.includes('now · 2026-07-15T18:30:00Z · 2026313179'));
}
{
  const res: any = groundResult({
    content: [
      { type: 'text', text: 'part one 2026-07-14T09:12:00Z' },
      { type: 'text', text: 'part two' },
    ],
  }, NOW);
  ok('every text part is aged', res.content[0].text.includes('(+2 — about a day ago)'));
  ok('only the LAST part carries the stamp',
    !res.content[0].text.includes('now · ') && res.content[1].text.includes('now · '));
}
{
  const err = groundResult({ isError: true, content: [{ type: 'text', text: 'Tool bsp failed: nope' }] }, NOW);
  ok('an error result is left ungrounded — an error needs no clock',
    (err as any).content[0].text === 'Tool bsp failed: nope');
}
{
  const passthru = groundResult({ content: [{ type: 'image', data: 'x' }] }, NOW);
  ok('a non-text result passes through', (passthru as any).content[0].type === 'image');
}
ok('a malformed result never throws', groundResult(null as any, NOW) === null);

// ── The real thing: createServer(), a real MCP client, a real bsp() call ────
// Driven over the SDK's in-memory transport against a SENTINEL block, so it
// exercises the shipped path end to end with no network and no fixtures.

(async () => {
  console.log('\nTHE REAL SERVER — createServer() + a real MCP client over bsp()');
  const server = createServer();
  const client = new Client({ name: 'smoke-client', version: '0' });
  const [clientT, serverT] = InMemoryTransport.createLinkedPair();
  await Promise.all([server.connect(serverT), client.connect(clientT)]);

  const stampRe = /^now · \d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z · \d{10} · .+$/m;

  const read: any = await client.callTool({
    name: 'bsp',
    arguments: { agent_id: 'pscale', block: 'whetstone', spindle: '1', pscale_attention: 0 },
  });
  const text = read.content[0].text as string;
  ok('a real bsp() read comes back stamped', stampRe.test(text), text.split('\n').pop());
  ok('the stamp is last — adjacent to what was just read', stampRe.test(text.trimEnd().split('\n').pop()!));
  ok('exactly one stamp on the response', (text.match(/^now · /gm) || []).length === 1);
  ok('the block content is intact', text.includes('bsp'), text.slice(0, 60));

  const idx: any = await client.callTool({ name: 'bsp', arguments: { agent_id: 'pscale' } });
  ok('a sentinel index is stamped too', stampRe.test(idx.content[0].text));

  const miss: any = await client.callTool({
    name: 'bsp', arguments: { agent_id: 'pscale', block: 'no-such-block' },
  });
  ok('a not-found (a real answer, not an error) is stamped',
    stampRe.test(miss.content[0].text), miss.content[0].text);

  const invite: any = await client.callTool({ name: 'pscale_invite', arguments: {} });
  ok('every tool gets it, not just bsp — pscale_invite is stamped',
    stampRe.test(invite.content[0].text));

  console.log('\n  sample — the last two lines of a live bsp() read:');
  console.log(text.trimEnd().split('\n').slice(-3).map((l) => '    ' + l).join('\n'));

  await client.close();
  console.log(`\n${pass} passed, ${fail} failed\n`);
  process.exit(fail ? 1 : 0);
})();
