/** Smoke — the stream's map labels each position as the address it is dialled by.
 *
 *  With no `at`, pscale_stream_engage prints the family's map: one row per top
 *  position. It printed the bare key, so on a floor-3 spine the worlds 100…400
 *  read as [1]…[4], and "1" copied back as at= pads to 001, inside the root's
 *  underscore chain; on a floor-10 clock the millennium read as [2] (fixit
 *  443.11, found by the testing.1 machine pass, 2026-10-04). Floor 1 must stay
 *  byte-identical.
 *
 *  Offline: fetch answers from a small in-memory beach. */

const ORIGIN = 'https://smoke-stream-map.test';
process.env.DEFAULT_BEACH = ORIGIN;

const wrap = (text: string, floor: number): any => {
  let node: any = text;
  for (let i = 0; i < floor; i++) node = { _: node };
  return node;
};

const store: Record<string, any> = {
  'spine:map-bare': { '1': 'unrooted one', '2': 'unrooted two' },
  'spine:map-one': { _: 'a floor-1 field', '1': 'one', '2': { _: 'two', '1': 'two-one' } },
  'spine:map-three': { ...wrap('a floor-3 field', 3), '1': { _: 'world one' }, '4': { _: 'world four', '1': { _: 'area' } } },
  'spine:map-clock': { ...wrap('a clock field', 10), '2': { _: 'the 2000s' } },
};

globalThis.fetch = (async (input: any) => {
  const url = new URL(String(input));
  if (url.host !== 'smoke-stream-map.test') throw new Error(`smoke refuses ${url.host}`);
  const block = url.searchParams.get('block');
  const json = (status: number, body: unknown) =>
    new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });
  if (!block) return json(200, { _: 'fake beach', origin: ORIGIN, blocks: Object.keys(store) });
  return block in store ? json(200, store[block]) : json(404, { error: 'not found' });
}) as any;

const { handleStreamEngage } = await import('../src/tools/stream.js');

let pass = 0, fail = 0;
const ok = (c: boolean, m: string) => { if (c) { pass++; console.log(`  ✓ ${m}`); } else { fail++; console.log(`  ✗ ${m}`); } };
const map = async (field: string) =>
  ((await handleStreamEngage({ field, handle: 'probe', beach: ORIGIN } as any)).content[0] as any).text as string;

const bare = await map('map-bare');
ok(bare.includes('  [1] unrooted one') && !bare.includes('[.1]'), 'no root underscore (floor 0): labels stay the bare digits');

const one = await map('map-one');
ok(one.includes('  [1] one') && one.includes('  [2] two'), 'floor 1: labels stay the bare digits');

const three = await map('map-three');
ok(three.includes('  [100] world one') && three.includes('  [400] world four'), 'floor 3: top positions read 100 and 400');
ok(!/\n {2}\[1\] /.test(three) && !/\n {2}\[4\] /.test(three), 'floor 3: no bare key that would pad into the underscore chain');

const clock = await map('map-clock');
ok(clock.includes('  [2000000000] the 2000s'), 'floor 10: the millennium reads 2000000000');

console.log(`\nstream map labels: ${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
