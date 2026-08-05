/**
 * pscale-wire-contract.ts — the wire's acceptance battery.
 *
 * VENDORED BYTE-IDENTICAL alongside pscale-wire.ts (canonical in bsp-mcp,
 * copy in xstream) — the same assertions run in both repos against the same
 * simulated beach, so the two consumers cannot drift apart without a smoke
 * going red. This is the wire's equivalent of the walker's 72-test battery,
 * and exists for the same reason: three dialects, one contract.
 *
 * THE SIM PROTOCOL (each repo's scripts/smoke-wire.ts implements it with a
 * ~60-line node:http server; the contract only needs these behaviours):
 *   - an in-memory store of blocks, seeded per test via POST /__seed
 *     {block, content}; GET/POST ?block= behave like a beach: GET returns
 *     the stored JSON or 404 {error:'not found'}; a POST with append:true
 *     acks {slot:'71'} (numeric 71 when block === 'numeric-slot'); a POST
 *     with action:'reach' acks {ok:true, state:'created', pair_id:'x'} —
 *     the handler's REAL vocabulary (created|completed|updated); a POST
 *     with action:'register' acks {ok:true, position:'12',
 *     address:'sed:<name>:12'}; other POSTs store `content`, ack {ok:true}.
 *   - special blocks:
 *       'locked'        POST → 403 {"error":"locked"}
 *       'server-error'  GET/POST → 500 {"error":"boom"}
 *       'flaky-once'    first GET: socket destroyed mid-flight; second: 200
 *                       with the seeded content (transport-retry case)
 *       'enveloped'     GET → 200 {"block": <seeded content>}
 *       'mutating'      GET → 200 {"_":"changed-by-sim"} regardless of POST
 *       'resolve-taken' append with resolve_window → 409
 *                       {"code":"window_already_resolved","resolved_by":"rival","window":"w1"}
 *       'window-moved'  append with resolve_window → 409
 *                       {"code":"window_moved","window":"w2","buffer":{"1":{"_":"late"}}}
 *   - every request is recorded: GET /__log returns
 *       [{method, path, query, body}] since the last POST /__clear.
 *
 * Case one is the fault that started this: THE GRAIN SIDE IS A STRING.
 */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Json = any;

// The wire module under test — structural type so the battery compiles
// against either repo's import of the vendored file.
export interface WireModule {
  WIRE_VERSION: string;
  endpoint(origin: string, block: string): string;
  endpointShape(origin: string, block: string, spindle: string | null, pscale: number | null): string;
  loadBlock(origin: string, block: string, opts?: Json): Promise<Json | null>;
  readShape(origin: string, block: string, spindle: string | null, pscale: number | null, opts?: Json): Promise<Json | null>;
  surfaceIndex(origin: string, opts?: Json): Promise<{ blocks: string[] } | null>;
  saveWhole(origin: string, block: string, content: Json, opts?: Json): Promise<Json>;
  writeAt(origin: string, block: string, spindle: string, content: Json, opts?: Json): Promise<Json>;
  append(origin: string, block: string, entry: Json, opts?: Json): Promise<Json>;
  postAction(origin: string, block: string, body: Record<string, Json>, opts?: Json): Promise<Json>;
  pairId(a: string, b: string): Promise<string>;
  sideOf(handle: string, partner: string): '1' | '2';
  grainReach(origin: string, args: Json, opts?: Json): Promise<Json>;
  sedRegister(origin: string, args: Json, opts?: Json): Promise<Json>;
  sha256hex(text: string): Promise<string>;
  deepEqual(a: Json, b: Json): boolean;
}

export interface SimHandle {
  origin: string;
  seed(block: string, content: Json): Promise<void>;
  log(): Promise<Array<{ method: string; path: string; query: Record<string, string>; body: Json }>>;
  clear(): Promise<void>;
}

export interface ContractResult {
  pass: number;
  fail: number;
  lines: string[];
}

const FAST = { retryDelayMs: 1, timeoutMs: 4000 };

export async function runContract(wire: WireModule, sim: SimHandle): Promise<ContractResult> {
  const lines: string[] = [];
  let pass = 0;
  let fail = 0;
  const check = (name: string, cond: boolean, detail = '') => {
    if (cond) { pass++; lines.push(`  ✓ ${name}`); }
    else { fail++; lines.push(`  ✗ ${name}${detail ? ` — ${detail}` : ''}`); }
  };
  const o = sim.origin;

  // ── 1. the grain side is a STRING, and the pair id is the live vector ─────
  // sha256('egg-one|egg-three')[:16] — the first sibling grain of the genus,
  // laid 2026-08-03 by egg-one, verified against the standing beach block.
  check('pairId matches the live vector (egg-one × egg-three)',
    (await wire.pairId('egg-one', 'egg-three')) === '085d6efa34a97d66');
  check('pairId is order-insensitive',
    (await wire.pairId('egg-three', 'egg-one')) === '085d6efa34a97d66');
  check("sideOf sorted-first is the STRING '1'",
    wire.sideOf('egg-one', 'egg-three') === '1' && typeof wire.sideOf('egg-one', 'egg-three') === 'string');
  check("sideOf sorted-second is the STRING '2'",
    wire.sideOf('egg-three', 'egg-one') === '2');

  await sim.clear();
  const reach = await wire.grainReach(o, {
    handle: 'egg-one', partner: 'egg-three',
    description: 'the threshold seam', sideContent: 'my half', passphrase: 'pp',
  }, FAST);
  {
    const log = await sim.log();
    const req = log.find(r => r.method === 'POST');
    const b = req?.body ?? {};
    check('grainReach posts to ?block=grain:<pid>', (req?.query.block ?? '') === 'grain:085d6efa34a97d66');
    check("grainReach body side === '1' (string)", b.side === '1' && typeof b.side === 'string');
    check('grainReach body carries the full action shape',
      b.action === 'reach' && b.agent_id === 'egg-one' && b.partner_agent_id === 'egg-three'
      && b.description === 'the threshold seam' && b.my_side_content === 'my half' && b.my_passphrase === 'pp');
    check("grainReach carries the handler's state verbatim, completed derived from it",
      reach.ok === true && reach.pid === '085d6efa34a97d66' && reach.side === '1'
      && reach.state === 'created' && reach.completed === false);
  }

  // ── 2. sed register ───────────────────────────────────────────────────────
  await sim.clear();
  const reg = await wire.sedRegister(o, { collective: 'genus-hatch', declaration: 'a new one', passphrase: 'pp2', shellRef: 'https://x.y' }, FAST);
  {
    const req = (await sim.log()).find(r => r.method === 'POST');
    check('sedRegister posts to ?block=sed:<collective>', (req?.query.block ?? '') === 'sed:genus-hatch');
    check('sedRegister body is the register action, shell_ref riding when given',
      req?.body?.action === 'register' && req?.body?.declaration === 'a new one' && req?.body?.passphrase === 'pp2' && req?.body?.shell_ref === 'https://x.y');
    check('sedRegister returns position and address from the ack',
      reg.ok === true && reg.position === '12' && reg.address === 'sed:genus-hatch:12');
  }

  // ── 3. whole-block save: query-form, confirm, read-back ───────────────────
  await sim.clear();
  const content = { _: 'a block', 1: 'one' };
  const saved = await wire.saveWhole(o, 'plain', content, { secret: 's3', ...FAST });
  {
    const log = await sim.log();
    const post = log.find(r => r.method === 'POST');
    check('saveWhole carries the block in the QUERY, never the body',
      (post?.query.block ?? '') === 'plain' && !('block' in (post?.body ?? {})));
    check('saveWhole body has confirm:true + content + secret-only-when-given',
      post?.body?.confirm === true && wire.deepEqual(post?.body?.content, content) && post?.body?.secret === 's3' && !('new_lock' in (post?.body ?? {})));
    check('saveWhole read-back ran (a GET follows the POST)',
      log.some(r => r.method === 'GET' && r.query.block === 'plain'));
    check('saveWhole ok on read-back match', saved.ok === true);
  }
  const mut = await wire.saveWhole(o, 'mutating', { _: 'what I sent' }, FAST);
  check('saveWhole FAILS LOUDLY when read-back differs (a lost write is never ok)',
    mut.ok === false && String(mut.error ?? '').includes('read back'));

  // ── 4. surgical write ─────────────────────────────────────────────────────
  await sim.clear();
  await wire.writeAt(o, 'plain', '1.21', { _: 'the grant' }, { secret: 's', ...FAST });
  {
    const post = (await sim.log()).find(r => r.method === 'POST');
    check('writeAt passes the spindle verbatim', post?.body?.spindle === '1.21');
    check('writeAt never sends confirm (surgical, not replace)', !('confirm' in (post?.body ?? {})));
  }
  const refused = await wire.writeAt(o, 'locked', '1', 'x', FAST);
  check('writeAt surfaces a 403 as {ok:false, status:403}', refused.ok === false && refused.status === 403 && String(refused.error).includes('locked'));

  // ── 5. append ─────────────────────────────────────────────────────────────
  await sim.clear();
  const ap = await wire.append(o, 'room', { _: 'hello', 1: 'weft' }, { secret: 's', ...FAST });
  {
    const post = (await sim.log()).find(r => r.method === 'POST');
    check('append body is {append:true, content} with no spindle by default',
      post?.body?.append === true && !('spindle' in (post?.body ?? {})));
    check("append extracts the slot as a string", ap.ok === true && ap.slot === '71');
  }
  const apn = await wire.append(o, 'numeric-slot', { _: 'x' }, FAST);
  check('append normalises a numeric slot ack to a string', apn.ok === true && apn.slot === '71');
  await sim.clear();
  await wire.append(o, 'room', { _: 'nested' }, { spindle: '2', ...FAST });
  {
    const post = (await sim.log()).find(r => r.method === 'POST');
    check('node-scoped append carries the spindle', post?.body?.spindle === '2');
  }
  const taken = await wire.append(o, 'resolve-taken', { _: 'fold' }, { resolveWindow: 'w1', ...FAST });
  check('resolver 409 already_resolved comes back discriminated, not as an error string',
    taken.ok === false && taken.alreadyResolved === true && taken.resolvedBy === 'rival' && taken.window === 'w1');
  const moved = await wire.append(o, 'window-moved', { _: 'fold' }, { resolveWindow: 'w2', ...FAST });
  check('resolver 409 window_moved rides the live buffer back',
    moved.ok === false && moved.windowMoved === true && !!moved.buffer);

  // ── 6. reads ──────────────────────────────────────────────────────────────
  await sim.seed('raw-block', { _: 'raw', 2: 'two' });
  check('loadBlock returns a raw block as-is', wire.deepEqual(await wire.loadBlock(o, 'raw-block', FAST), { _: 'raw', 2: 'two' }));
  await sim.seed('enveloped', { _: 'inside' });
  check('loadBlock unwraps a {block: X} envelope', wire.deepEqual(await wire.loadBlock(o, 'enveloped', FAST), { _: 'inside' }));
  check('loadBlock returns null ONLY for 404 (absence is data)', (await wire.loadBlock(o, 'never-seeded', FAST)) === null);
  let threw = false;
  try { await wire.loadBlock(o, 'server-error', FAST); } catch { threw = true; }
  check('loadBlock THROWS on non-404 failure (unreadable must never pass for absent)', threw);
  await sim.seed('flaky-once', { _: 'recovered' });
  check('transport failure retries once and recovers', wire.deepEqual(await wire.loadBlock(o, 'flaky-once', FAST), { _: 'recovered' }));
  await sim.clear();
  try { await wire.loadBlock(o, 'server-error', FAST); } catch { /* expected */ }
  check('an HTTP status is a beach ANSWER — never retried',
    (await sim.log()).filter(r => r.query.block === 'server-error').length === 1);
  check('surfaceIndex extracts the blocks list', ((await wire.surfaceIndex(o, FAST))?.blocks ?? []).length >= 0 && Array.isArray((await wire.surfaceIndex(o, FAST))?.blocks));

  // ── 7. small parts ────────────────────────────────────────────────────────
  check('deepEqual is order-insensitive', wire.deepEqual({ a: 1, b: { c: 2 } }, { b: { c: 2 }, a: 1 }) && !wire.deepEqual({ a: 1 }, { a: 2 }));
  check('endpoint keeps colons readable', wire.endpoint('https://x.y/', 'pool:egg-one').endsWith('/.well-known/pscale-beach?block=pool:egg-one'));
  check('endpointShape carries spindle and pscale', wire.endpointShape('https://x.y', 'b', '1.2', -1).includes('spindle=1.2') && wire.endpointShape('https://x.y', 'b', '1.2', -1).includes('pscale=-1'));

  return { pass, fail, lines };
}
