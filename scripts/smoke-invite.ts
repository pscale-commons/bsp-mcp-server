/**
 * smoke-invite.ts — the first call (proposals/2026-11-26-first-contact.md).
 *
 * A bare pscale_invite returns ONE envelope composed live from the default
 * beach's blocks. This holds the composition to its shape on fixtures, offline:
 * the stance from the welcome, the place from the lighthouse, the numbers and
 * the newest families from the index, the operator the lighthouse names at 9.4
 * with their card and their line for this week, the ways in at 1 to 5, and the
 * walked date with the families begun since. And it holds what is NOT there:
 * no marks read, no ways in past 7 spelled out, no family's machinery listed.
 *
 * Run: npm run smoke:invite
 */
import { composeFirstCall, newestFamilies, weekLine } from '../src/tools/invite.js';
import { writeAt } from '../src/bsp.js';
import { namedRungAddress, emitFor, NAMED_RUNGS } from '../src/tools/stream.js';

let failures = 0;
function assert(cond: boolean, label: string) {
  if (cond) console.log(`  ✓ ${label}`);
  else { console.error(`  ✗ ${label}`); failures++; }
}

const when = new Date('2026-11-26T15:00:00Z');

const lighthouse: any = {
  _: 'The beach at beach.example.org: a shared, open place where people and their AIs write in small numbered blocks.',
  1: { _: 'Play — something to do in the next few minutes.', 1: 'example.org/games — games on the beach.', 2: 'worlds — the register of story worlds.' },
  2: { _: 'Look and answer — pages drawn live from the blocks.', 1: 'example.org/proposal — every proposal.' },
  3: { _: 'Put yourself in — a place of one\'s own.', 1: 'now — what they are doing today.' },
  4: { _: 'Meet — the people here.', 1: 'passport:<handle> — a public card.' },
  5: { _: 'Upgrade — taking the beach into work.', 1: 'An agent: a genus-one agent.' },
  6: { _: 'Understand — pointers only.', 1: 'situating-pscale — five registers.' },
  7: { _: 'The live glances and what is still rough.', 1: 'The index itself.' },
  8: { _: 'The doors.', 1: 'mirror.example.org — the live client.' },
  9: { _: 'Lighthouse metadata.', 1: 'v3 — the compass. Walked 2026-11-20: the date a first call reports.', 4: 'keeper — Ada Keeper keeps this beach, with one AI alongside: loom (pool:loom).' },
};

const index: any = {
  blocks: ['lighthouse', 'marks', 'passport:keeper', 'passport:ben', 'now:keeper', 'spine:alpha', 'spine:beta', 'spine:beta-plug', 'spine:gamma', 'spine:delta-schematic', 'spine:old'],
  born: {
    'spine:alpha': '2026-11-25T10:00:00Z', 'spine:beta': '2026-11-24T10:00:00Z', 'spine:beta-plug': '2026-11-26T09:00:00Z',
    'spine:gamma': '2026-11-02T10:00:00Z', 'spine:delta-schematic': '2026-11-26T08:00:00Z', 'spine:old': '2026-09-01T10:00:00Z',
  },
};

console.log('NEWEST — families an arriving person can be pointed at');
{
  const n = newestFamilies(index);
  assert(n.map((f) => f.name).join(',') === 'alpha,beta,gamma,old', 'newest first, from born, spines only');
  assert(!n.some((f) => /plug|schematic/.test(f.name)), "a family's machinery is left out");
  assert(newestFamilies(null).length === 0, 'no index, no list');
}

console.log('WEEK — the operator\'s own line for this week');
{
  let nowBlock: any = 'now:keeper';
  for (let i = 0; i < 10; i++) nowBlock = { _: nowBlock };
  const full = namedRungAddress('this week', when)!;
  const digits = full.slice(0, NAMED_RUNGS.week).split('');
  writeAt(nowBlock, emitFor(digits, nowBlock), 'Planting the garden and calling two funders.');
  assert(weekLine(nowBlock, when) === 'Planting the garden and calling two funders.', 'the line said at this week is read back');
  assert(weekLine(nowBlock, new Date('2026-12-20T12:00:00Z')) === null, 'a week with nothing said is null, never a stale line');
  assert(weekLine(null, when) === null, 'no now block, no line');
}

console.log('ENVELOPE — one read for the opening turn');
{
  const text = composeFirstCall({
    origin: 'https://beach.example.org',
    stance: 'THE FIRST TURN with a person who has just arrived.',
    lighthouse,
    index,
    operator: { handle: 'keeper', keepers: 'Ada Keeper keeps this beach, with one AI alongside: loom (pool:loom).', passport: { _: 'Ada Keeper — a keeper of beaches. More words follow here.', 1: 'What I bring: tide tables. And patience.' }, week: 'Planting the garden and calling two funders.' },
    titles: { alpha: 'Alpha — the first thing.', beta: 'Beta — the second thing.' },
    when,
  });
  assert(text.startsWith('THE BEACH — the first call, composed live from beach.example.org'), 'it says what it is and where it was read');
  assert(text.includes('THE FIRST TURN with a person'), 'the stance comes from the welcome');
  assert(text.includes('WHAT IT IS — The beach at beach.example.org'), "the place is the lighthouse's own underscore");
  assert(text.includes('In numbers today: 11 blocks, 2 people with a public card, 6 projects and proposals, 5 of them begun this month.'), 'the numbers are counted from the index');
  assert(text.includes('WHO KEEPS IT — Ada Keeper keeps this beach'), 'the keepers are the lighthouse 9.4 line');
  assert(text.includes('Their own card, passport:keeper: Ada Keeper — a keeper of beaches. What I bring: tide tables. And patience.'), "the operator's card: one sentence of the passport, two of its 1");
  assert(text.includes('Their line for this week, in their own words: "Planting the garden'), "the operator's week, in their own words");
  assert(text.includes('example.org/now/keeper') && text.includes('pool:keeper'), "the operator's day and parlour, the site read from the beach's host");
  assert(/BEGUN LATELY[\s\S]*alpha \(2026-11-25\) — Alpha — the first thing\.[\s\S]*beta \(2026-11-24\)/.test(text), 'the newest families, newest first, with their titles');
  assert(text.includes('• Play — something to do') && text.includes('    – example.org/games — games on the beach.'), 'the ways in, each with its lines');
  assert(text.includes('• Upgrade — taking the beach into work.'), 'all five ways in');
  assert(text.includes('• Understand — pointers only. (lighthouse 6)') && !text.includes('situating-pscale — five registers'), 'understand and the glances by their opening line alone');
  assert(!text.includes('mirror.example.org'), 'the doors stay in the compass');
  assert(text.includes('walked 2026-11-20; 4 families have begun since'), 'the walked date, and the families begun since it');
  assert(!/marks/i.test(text), 'no marks read, no marks named');
}

console.log('ENVELOPE — what is missing is left out, never invented');
{
  const text = composeFirstCall({
    origin: 'https://beach.example.org', stance: '', lighthouse: { _: 'A beach.', 9: { 4: 'keeper — Ada keeps it.' } }, index: null,
    operator: { handle: 'keeper', keepers: 'Ada keeps it.', passport: null, week: null }, titles: {}, when,
  });
  assert(!text.includes('In numbers today'), 'no index, no numbers');
  assert(!text.includes('Their line for this week'), 'no week said, no line');
  assert(!text.includes('BEGUN LATELY'), 'no index, no newest');
  assert(!text.includes(', walked'), 'no walked date, none claimed');
}

if (failures) { console.error(`\n${failures} failed`); process.exit(1); }
console.log('\nall well');
