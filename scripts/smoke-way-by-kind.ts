/** Smoke — the way handed over by kind (proposals/2026-11-15-the-way-by-kind.md;
 *  spine:o-page-unit 1.11111 and 1.111112).
 *
 *  A law whose root line closes 'is ways:<name>.' has had that way handed over once
 *  in a session since 2 November (smoke:thread proves it). This proves the step
 *  beyond it, offline, against two small in-memory beaches (a family's own and the
 *  default one):
 *    - a law naming its own way keeps it, whatever its kind's form names;
 *    - a law naming none takes its phase's form's way before its mode's;
 *    - a phase whose form names no way falls to the mode's form;
 *    - a phase with no form of that name ('set aside' reads as set) falls to the mode;
 *    - a law with neither line is handed nothing;
 *    - a form missing at the family's beach is looked for at the default beach, and
 *      the way comes from where the form was found;
 *    - the second engage in a session prints only the line saying the way was given,
 *      and does not ask the forms again. */
const FAMILY = 'https://smoke-kind.test';
const HOME = 'https://smoke-home.test';
process.env.DEFAULT_BEACH = HOME;

const reader = { _: 'THE WAY OF A READER — of this smoke.', '1': 'FIND THE FAMILY.', '2': 'READ IT PLAINLY.', '9': 'PROVENANCE — never taught.' };
const recipe = { _: 'THE WAY OF A RECIPE — of this smoke.', '1': 'ASK WHERE THEY ARE.', '9': 'PROVENANCE — never taught.' };
const beaches: Record<string, Record<string, any>> = {
  [FAMILY]: {
    'function:document': { _: 'THE DOCUMENT FORM — of this smoke. How a mind helps its person read one and answer it is ways:reader.', '1': 'mode: document' },
    'function:proposal': { _: 'THE PROPOSAL FORM — of this smoke, naming no way; ways:proposal is for whoever makes one.' },
    'function:recipe': { _: 'THE RECIPE FORM — of this smoke. How a mind walks its person through one is ways:recipe.' },
    'ways:reader': reader,
    'ways:recipe': recipe,
    'ways:own': { _: 'THE WAY OF ITS OWN — of this smoke.', '1': 'DO IT THIS FAMILY’S WAY.' },
    // a proposal: phase form names no way, the mode's form does
    'spine:alpha': { _: 'alpha, a proposal', '1': { _: 'the first step', '1': { _: 'the second step', '8': 'DECIDE — the second? Asked of ada.' } } },
    'function:alpha': { _: 'Operator for alpha: a proposal read as a document.', '1': 'mode: document', '7': 'phase: proposal — the decisions are open.' },
    // a recipe: the phase's way before the mode's
    'spine:beta': { _: 'beta, a recipe', '1': 'the first step' },
    'function:beta': { _: 'Operator for beta: a recipe read as a document.', '1': 'mode: document', '7': 'phase: recipe — walked with the person.' },
    // a law naming its own way keeps it
    'spine:gamma': { _: 'gamma', '1': 'the first step' },
    'function:gamma': { _: 'Operator for gamma. How a mind carries it is ways:own.', '1': 'mode: document', '7': 'phase: recipe' },
    // neither line: nothing
    'spine:delta': { _: 'delta', '1': 'the first step' },
    'function:delta': { _: 'Operator for delta, with no kind written.' },
    // a phase with no form of its name
    'spine:eps': { _: 'eps', '1': 'the first step' },
    'function:eps': { _: 'Operator for eps.', '1': 'mode: document', '7': 'phase: set aside — its work lives elsewhere.' },
  },
  [HOME]: {
    'function:meeting': { _: 'THE MEETING FORM — of this smoke, at the default beach only. How a mind helps its person read one and answer it is ways:reader.' },
    'ways:reader': reader,
  },
};
// a family on its own beach whose kind's form stands only at the default beach
beaches[FAMILY]['spine:zeta'] = { _: 'zeta, a meeting', '1': 'what was said' };
beaches[FAMILY]['function:zeta'] = { _: 'Operator for zeta.', '1': 'mode: meeting' };

const gets: string[] = [];
globalThis.fetch = (async (input: any, init: any = {}) => {
  const url = new URL(String(input));
  const store = beaches[url.origin];
  if (!store) throw new Error(`smoke refuses ${url.host}`);
  const block = url.searchParams.get('block');
  const json = (status: number, body: unknown) => new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });
  if ((init.method || 'GET').toUpperCase() !== 'GET') return json(200, { ok: true });
  if (!block) return json(200, { _: 'fake beach', origin: url.origin, blocks: Object.keys(store), touched: {} });
  gets.push(`${url.origin}|${block}`);
  return block in store ? json(200, store[block]) : json(404, { error: 'not found' });
}) as any;

const { handleStreamEngage, resetStanding } = await import('../src/tools/stream.js');

let pass = 0, fail = 0;
const ok = (c: boolean, m: string) => { if (c) { pass++; console.log(`  ✓ ${m}`); } else { fail++; console.log(`  ✗ ${m}`); } };
const engage = async (session: string, field: string) =>
  (await handleStreamEngage({ field, handle: 'cy', beach: FAMILY, at: '1' } as any, { sessionId: session })).content.map((c: any) => c.text).join('\n');
const given = (name: string) => `# The way — ${name}, how a mind carries this family's work; given once in a session`;
const stood = (name: string) => `# The way — ${name}, standing as it was given to you earlier in this session`;

resetStanding();
let r = await engage('s1', 'alpha');
ok(r.includes(given('ways:reader')) && r.includes('1 FIND THE FAMILY.') && !r.includes('never taught'), 'a proposal whose law names no way is handed the reader\'s way, by its mode, without the provenance');

r = await engage('s1', 'beta');
ok(r.includes(given('ways:recipe')) && r.includes('1 ASK WHERE THEY ARE.'), 'a recipe is handed the recipe\'s way: the phase\'s form before the mode\'s');
ok(!r.includes('ways:reader'), 'and not the reader\'s');

r = await engage('s1', 'gamma');
ok(r.includes(given('ways:own')) && !r.includes('ways:recipe'), 'a law naming its own way keeps it, whatever its kind names');

r = await engage('s1', 'delta');
ok(!r.includes('# The way'), 'a law with neither a mode nor a phase is handed nothing');

r = await engage('s2', 'eps');
ok(r.includes(given('ways:reader')), 'a phase with no form of its name falls to the mode\'s form');

r = await engage('s3', 'zeta');
ok(r.includes(given('ways:reader')) && r.includes('2 READ IT PLAINLY.'), 'a form missing at the family\'s beach is found at the default beach, and its way read there');
const atFamily = gets.indexOf(`${FAMILY}|function:meeting`), atHome = gets.indexOf(`${HOME}|function:meeting`);
ok(atFamily >= 0 && atHome > atFamily, 'the form was asked of the family\'s beach first, then the default beach');
ok(gets.includes(`${HOME}|ways:reader`), 'and the way was read where the form was found');

// ── once a session: the second engage says the way was given, and asks the forms nothing ──
const before = gets.filter((g) => /function:(proposal|document)$/.test(g)).length;
r = await engage('s1', 'alpha');
ok(r.includes(stood('ways:reader')) && !r.includes('1 FIND THE FAMILY.'), 'the second engage in a session prints only the line saying the way was given');
const after = gets.filter((g) => /function:(proposal|document)$/.test(g)).length;
ok(after === before, 'and the forms are not asked again in that session');

r = await engage('s4', 'alpha');
ok(r.includes(given('ways:reader')) && r.includes('1 FIND THE FAMILY.'), 'a new session is given it whole again');

// ── off the clock the ladder says each rung as it is answered at: 1.18, never 118 ──
r = (await handleStreamEngage({ field: 'alpha', handle: 'cy', beach: FAMILY, at: '1.18' } as any, { sessionId: 's5' })).content.map((c: any) => c.text).join('\n');
ok(r.includes('[1.18]') && r.includes('[1.1]') && !/\[118\]|\[11\]/.test(r), 'the ladder says 1.1 and 1.18 with their decimal point, as the header does');

console.log(`\n${pass} passed, ${fail} failed`);
if (fail) process.exit(1);
