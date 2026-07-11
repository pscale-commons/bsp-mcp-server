/**
 * scripts/sand-live.ts — live SAND driver runner.
 *
 * pscale_networking is not yet on the DEPLOYED MCP surface, so the first live
 * run drives it locally against the real beach. Two actions (ACTION env):
 *
 *   ACTION=author — author a rider onto an existing channel slot, tool-assisting
 *     the manual write of sand-rider:8.1 (computes the hop-0 sha256 so no human
 *     hand-hashes). Writes only position 9 of the named slot, surgically.
 *   ACTION=run    — call handleNetworking: perceive (default) or act (EXECUTE).
 *
 * The write secret is read from env SAND_SECRET ONLY — never an argument, never
 * printed. All stdout is acknowledgements / the tool's own text envelope.
 */

import { createHash } from 'node:crypto';
import { Block, readAt, writeAt, formatAddress, parseSpindle, floorDepth } from '../src/bsp.js';
import { loadBlock, saveBlock } from '../src/db.js';
import { handleNetworking } from '../src/tools/networking.js';

const sha = (s: string) => createHash('sha256').update(s).digest('hex');
const E = (k: string, d?: string) => process.env[k] ?? d;
const BEACH = E('BEACH', 'https://beach.happyseaurchin.com')!;

async function author() {
  const secret = E('SAND_SECRET');
  const block = E('BLOCK') ?? E('GRAIN');
  const slot = E('SLOT');
  const probeId = E('PROBE_ID');
  const topic = E('TOPIC');
  const from = E('FROM');
  const credit = E('CREDIT');
  if (!secret || !block || !slot || !probeId || !topic || !from) {
    throw new Error('author needs SAND_SECRET, BLOCK/GRAIN, SLOT, PROBE_ID, TOPIC, FROM');
  }
  const rider: Block = {
    _: 'rider',
    '1': probeId,
    '4': { _: 'chain hops', '1': { _: 'hop 1', '1': from, '2': sha(probeId + '') } },
    '5': topic,
  };
  if (credit) rider['2'] = { _: 'credit claim', '1': Number(credit), '2': from };

  const row = await loadBlock(BEACH, block);
  if (!row || typeof row.block !== 'object' || row.block === null) throw new Error(`no channel ${block} at ${BEACH}`);
  const b: Block = JSON.parse(JSON.stringify(row.block));
  const fl = floorDepth(b);
  const slotDigits = parseSpindle(slot, fl).digits;
  const riderAddr = formatAddress([...slotDigits, '9'], fl); // e.g. slot 2.1 → 2.19 (walk 2,1,9)
  writeAt(b, riderAddr, rider);
  await saveBlock(BEACH, block, b, { spindle: riderAddr, pscale_attention: -1, secret });
  console.log(`authored rider at ${block}:${riderAddr}  (probe=${probeId}, topic=${topic}, from=${from})`);

  const rb = await loadBlock(BEACH, block);
  const got = rb ? readAt(rb.block, riderAddr) : null;
  console.log(`read-back: ${got && got['1'] === probeId ? 'OK — rider present at position 9' : 'MISSING'}`);
}

async function run() {
  const params: any = {
    agent_id: E('AGENT_ID'),
    channel: E('CHANNEL'),
    beach: BEACH,
    permission: E('PERMISSION', 'ask'),
  };
  if (E('SINCE')) params.since_marker = Number(E('SINCE'));
  if (E('SAND_SECRET')) params.secret = E('SAND_SECRET');
  if (E('EXECUTE')) params.execute = JSON.parse(E('EXECUTE')!);
  if (!params.agent_id || !params.channel) throw new Error('run needs AGENT_ID and CHANNEL');
  const res = await handleNetworking(params);
  console.log(res.content[0].text);
}

(async () => {
  const action = E('ACTION', 'run');
  if (action === 'author') await author();
  else await run();
})().catch((e) => { console.error('ERROR:', e?.message ?? e); process.exit(1); });
