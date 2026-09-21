/**
 * smoke-tiers.ts — the three tiers of play, composed OFFLINE (src/tools/tiers.ts,
 * proposals/2026-09-19-soft-medium-hard-beach-side.md).
 *
 * What this pins, because each was bought by a live failure:
 *  · THE FENCE. A place's face is its underscore; its hidden directory holds the
 *    names, minds and reasons. The resolution reads faces only and never the
 *    keeper's register — so no motive reaches the voice that composes actions
 *    and intentions (David's ruling, 2026-09-19). The keeper reads both.
 *  · THE STORY CROSSES ROOMS. A fold given only its own room put a party back at
 *    the ford at dusk, a day after they climbed away from it (2026-09-19). The
 *    resolution is framed with the beats these characters lived wherever they
 *    happened, newest last; a closed span rides as its summary when one is paid,
 *    and whole when it is owed, so a thing stowed nine beats back is still in view.
 *  · THE WINDOW HOLDS THE WORLD. A voice the keeper staged is one of the place's
 *    people, named in the window beside the players' own lines.
 *  · WHAT THEY CARRY. Holds ride the actors' sheets (grit 3.1), and the telling
 *    and the resolution both get them.
 *  · A TELLING KNOWS WHERE IT LANDS, and says plainly when the account already
 *    covers the room.
 *  · A WALK WHERE A WALK WOULD DO (the semantic-flow diet, 2026-09-21). The law
 *    rides to one ring beneath the act's addresses, never the subtree; the dice
 *    system rides with the dice; identity is walked to the room; a held register
 *    rides as its spine; and a kept sheet is framed with the beats since it was
 *    kept — a character nothing has happened to is owed no call.
 *
 *   npm run smoke:tiers
 */
process.env.DEFAULT_BEACH = 'https://apex.test';

type AnyBlock = Record<string, unknown>;

// The master: a floor-3 holding whose rooms carry hidden directories — the face
// at the underscore, the truth beneath it.
const spatial: AnyBlock = {
  _: { _: { _: 'Spatial map of Thornlea — the poorest holding in the valley.' } },
  '1': {
    _: { _: 'The Village — a muddy scatter of cottages.', '1': 'Six of the lord\'s men hold it, and it is one word from breaking.' },
    '2': {
      _: { _: 'The Alehouse — low and smoky, the warmest roof here.', '1': 'Half-commandeered as the crew\'s billet: what drinks nightly guards badly nightly.' },
      '1': { _: { _: 'The trestle — and behind it the alewife, lean and closed-faced.', '1': 'Maerla (named in identity, earned in play) counts the crew\'s drinking and says nothing she is not forced to.' } },
    },
    '3': { _: { _: 'The Store — padlocked, a bored man set to watch it.', '1': 'The day-watch is the boy, the weak seam in the whole crew.' } },
  },
  '2': { _: { _: 'The Road In — the ford below, the wood the track climbs through.' } },
};

const beaches: Record<string, Record<string, AnyBlock>> = {
  'https://master.test/w/thornlea': {
    'spatial:thornlea': spatial,
    'keeper:thornlea': {
      _: 'THE AUTHOR\'S HOLD — never a stranger\'s envelope.',
      '4': { _: 'THE ARC — what breaks the day strangers arrive.', '1': 'THE SQUEEZE — the doubled quota comes down and the crew takes the seed-corn.' },
      '5': { _: 'THE WAYS THROUGH — seven pressure points, found and never offered.', '1': 'PEEL OFF THE BOY — the Store\'s day-watch is sixteen and sick about it.' },
      '9': { _: 'PROVENANCE — the authoring record for this seed.', '2': { _: 'THE REPAIRS LOG — where the source crossed the fence.', '1': 'a repair recorded three levels down, for authors.' } },
    },
    'identity:thornlea': {
      _: { _: { _: 'IDENTITY:THORNLEA — every address here is spatial:thornlea\'s own; the place as each we holds it.' } },
      '1': {
        _: 'The Village as held — home under occupation to those who live in it.',
        '2': { _: 'The Alehouse as held — our alehouse under their boots.', '1': { _: 'The trestle as held.', '1': 'to the village: the one warm room; to the crew: billet and board.' } },
        '3': { _: 'The Store as held — the village\'s stolen winter, the crew\'s prize.' },
      },
    },
    'rules:thornlea': {
      _: { _: 'Rules constraining action at Thornlea.', '1': 'Perception — the village is open ground; sound carries; the dark hides what daylight shows.' },
      '1': 'THE OCCUPATION — the warrant is the crew\'s chief weapon, and the sergeant weighs his comfort.',
      '3': { _: 'The clock and the dark.', '1': 'THE REINFORCEMENT CLOCK — a rider out the ford brings thirty men in three days.' },
    },
    'rules:nomad': { _: 'NOMAD — outcome = CF + SF + dice − difficulty.', '1': 'The formula.', '2': 'The dice — exploding d10.' },
  },
  // The table: characters, pools, the keeper placing — no spatial of its own.
  'https://table.test/w/thornlea-grp': {
    'keeper:scene': { _: "The keeper's hold for this table.", '3': 'PLACING: *:https://master.test/w/thornlea:spatial:thornlea:120' },
    'passport:mara': {
      _: 'Mara — a pedlar with a quick tongue.',
      '1': 'Character Force ~8; peak in warm talk, weak in a straight fight.',
      '3': 'Quick-eyed and easy, a pedlar\'s pack, a blue glass bead on a cord at her throat. Location: *:https://master.test/w/thornlea:spatial:thornlea:120',
      '4': { _: 'HOLDS — what Mara carries.', '1': 'the blue bead on its cord · hers from the start · stowed in her pack since the ford' },
    },
    'passport:dorn': {
      _: 'Dorn — a hedge-soldier off a war.',
      '1': 'Character Force ~8; peak in a fight, weak in soft talk.',
      '3': 'Broad and scarred, a worn blade at his hip. Location: *:https://master.test/w/thornlea:spatial:thornlea:120',
      '4': { _: 'HOLDS — what Dorn carries; consolidated at upkeep (grit 3.1). Kept through 2026-09-19T10:01:00.000Z.', '1': 'the worn blade · his from the war · at his hip' },
    },
    'pool:120': {
      _: 'pscale:grit/1',
      '1': { _: 'Mara and Dorn arrive.', '1': 'mara', '3': '2026-09-19T10:00:00.000Z' },
      '2': { _: 'The alewife sets down a cup and says nothing.', '1': 'mara', '3': '2026-09-19T10:05:00.000Z', '5': 'mara,dorn' },
    },
    'pool:110': {
      _: 'pscale:grit/1',
      '1': { _: 'At the ford, Mara lifts the bead over her head and stows it in her pack.', '1': 'dorn', '3': '2026-09-19T09:00:00.000Z', '5': 'mara,dorn' },
      '2': { _: 'A carter passes and says nothing to either of them.', '1': 'keel', '3': '2026-09-19T09:30:00.000Z' },
    },
    'liquid:pool:120': {
      _: 'Liquid pre-commit buffer. window opened 2026-09-19T10:06:00.000Z',
      '1': { _: 'I ask the alewife who drinks here of an evening.', '1': 'mara', '3': '2026-09-19T10:06:00.000Z', '6': '2026-09-19T10:06:00.000Z' },
      '2': { _: 'wipes the same patch of trestle and does not look up', '1': 'the alewife', '3': '2026-09-19T10:06:30.000Z', '6': '2026-09-19T10:06:30.000Z' },
    },
    'witnessed:mara': {
      _: 'witnessed:mara at the table.',
      '1': { _: 'At the ford you lifted the bead over your head and put it away in the pack.', '1': 'mara', '2': 'pool:110:2', '3': '2026-09-19T09:31:00.000Z' },
      '2': { _: 'You came in out of the wet, and the room did not look up.', '1': 'mara', '2': 'pool:120:1', '3': '2026-09-19T10:01:00.000Z' },
    },
    'knows:mara': { _: 'Reads people well; no weapon worth speaking of.', '1': 'every road in the valley' },
  },
};

const WELL_KNOWN = '/.well-known/pscale-beach';
globalThis.fetch = (async (input: any) => {
  const url = new URL(typeof input === 'string' ? input : input.url);
  const wk = url.pathname.indexOf(WELL_KNOWN);
  if (wk === -1) return new Response('not a beach', { status: 404 });
  const surface = `${url.origin}${url.pathname.slice(0, wk)}`;
  const beach = beaches[surface];
  if (!beach) return new Response('no beach', { status: 404 });
  const name = url.searchParams.get('block');
  if (!name) {
    return new Response(JSON.stringify({ _: `surface ${surface}`, origin: surface, blocks: Object.keys(beach).sort() }),
      { status: 200, headers: { 'Content-Type': 'application/json' } });
  }
  const block = beach[name];
  if (block === undefined) return new Response('not found', { status: 404 });
  return new Response(JSON.stringify(block), { status: 200, headers: { 'Content-Type': 'application/json' } });
}) as typeof fetch;

const { handlePoolEngage } = await import('../src/tools/pool.js');
const TABLE = 'https://table.test/w/thornlea-grp';

let pass = 0;
let fail = 0;
function check(name: string, ok: boolean, detail?: string): void {
  if (ok) { pass++; console.log(`  ✓ ${name}`); }
  else { fail++; console.log(`  ✗ ${name}${detail ? ` — ${detail}` : ''}`); }
}

async function tier(t: 'soft' | 'medium' | 'hard', room: string, agent: string): Promise<string> {
  const r = await handlePoolEngage({ pool_url: TABLE, pool_name: room, agent_id: agent, tier: t } as any);
  return r.content[0].text;
}
const section = (text: string, head: string): string => {
  const parts = text.split(new RegExp(`^# ${head}[^\\n]*$`, 'm'));
  return parts.length > 1 ? parts[1].split(/^# THE /m)[0] : '';
};

console.log('=== medium — the resolution composes actions and intentions ===');
{
  const text = await tier('medium', '120', 'dorn');
  const call = section(text, 'THE CALL');
  const input = section(text, 'THE INPUT');
  const claim = section(text, 'THE CLAIM');
  check('the law rides at the act\'s addresses', /\[1\.4\]/.test(call) && /\[2\]/.test(call));
  check('to ONE RING beneath them — a branch\'s own line, never its worked cases', /\[1\.44\]/.test(call) && !/\[1\.441\]/.test(call) && /\[2\.4\]/.test(call) && !/\[2\.41\]/.test(call));
  check('the contract names the window as acts and intentions', /the people of the place as the keeper has set them/.test(call));
  check('THE PLACE gives the room\'s face', /\[120\] The Alehouse — low and smoky/.test(input));
  check('and the fixtures\' faces one level down', /The trestle — and behind it the alewife/.test(input));
  check('THE FENCE — no hidden line reaches the resolution', !/Maerla/.test(input) && !/guards badly/.test(input) && !/weak seam/.test(input));
  check('THE FENCE — no keeper register either', !/THE ARC/.test(input) && !/PRESSURE POINTS/i.test(input) && !/REINFORCEMENT CLOCK/.test(input));
  check('the world\'s rules ride at their framing only', /Rules constraining action at Thornlea/.test(input) && !/THE OCCUPATION/.test(input));
  check('the story crosses rooms — the ford beat rides here', /At the ford, Mara lifts the bead/.test(input));
  check('and a beat of theirs is theirs by the weave, not by name', /woven|voiced by dorn/.test(input));
  check('a stranger\'s beat in another room stays out', !/A carter passes/.test(input));
  check('the actors carry their sheets', /Mara/.test(input) && /stowed in her pack since the ford/.test(input));
  check('the window names the players\' line and the place\'s voice apart',
    /- Mara: I ask the alewife/.test(input) && /- the alewife \(one of the place's people\): wipes the same patch/.test(input));
  check('the dice are dealt per actor', /\[THE DICE/.test(input) && /- Mara: luck/.test(input));
  check('and the dice system rides with them', /NOMAD — outcome/.test(input));
  const quiet = section(await tier('medium', '110', 'dorn'), 'THE INPUT');
  check('where no dice were dealt the dice system stays home, the world\'s framing still rides',
    /no dice dealt/.test(quiet) && !/NOMAD/.test(quiet) && /Rules constraining action at Thornlea/.test(quiet));
  check('the claim carries the window\'s stamps', /resolves_window: 2026-09-19T10:06:00\.000Z/.test(claim) && /resolves_seen: 2026-09-19T10:06:30\.000Z/.test(claim));
  check('and the ways a WAY line may name', /way: \[110\] The Road In/.test(claim) || /way: \[100\] The Village/.test(claim));
  check('the actors are named for the beat', /actor: mara — Mara/.test(claim));
}

console.log('\n=== hard — the keeper holds what nobody else is given ===');
{
  const text = await tier('hard', '120', 'dorn');
  const input = section(text, 'THE INPUT');
  const call = section(text, 'THE CALL');
  check('the law rides at upkeep\'s addresses', /\[3\]/.test(call) && /\[1\.46\]/.test(call));
  check('the call asks for lines, not reasoning', /no reasoning, no commentary/.test(call) && /WORLD <label>/.test(call));
  check('the place opens its hidden directories', /\(held .*\) Half-commandeered as the crew's billet/.test(input));
  check('and the names behind the faces', /Maerla/.test(input));
  check('the keeper\'s own register rides as its spine — the branches and their children\'s lines', /THE ARC/.test(input) && /PEEL OFF THE BOY/.test(input) && /THE REPAIRS LOG/.test(input));
  check('and an authoring record nested deeper stays where it is', !/three levels down/.test(input));
  check('the world\'s rules ride to the same depth', /THE REINFORCEMENT CLOCK/.test(input));
  check('identity is WALKED to the room — the alehouse as held, whole', /\[120\] The Alehouse as held/.test(input) && /the one warm room/.test(input) && /The Village as held/.test(input));
  check('never the whole holding: the Store\'s holding is nothing to a moment at the trestle', !/The Store as held/.test(input));
  check('what the world already has standing', /the alewife: wipes the same patch/.test(input));
  check('what their players were told', /the room did not look up/.test(input));
  check('the writes name the places a voice may wait at', /place: \[120\]/.test(section(text, 'THE WRITES')));
  const sheets = text.split(/^# THE SHEET INPUT — /m).slice(1).map((s) => s.split('\n')[0]);
  check('one sheet call per character standing here', sheets.length === 2 && sheets.includes('mara') && sheets.includes('dorn'));
  check('a sheet is framed with that character\'s own story', /At the ford, Mara lifts the bead/.test(text.split('# THE SHEET INPUT — mara')[1]));
  check('the sheet call asks for the holds whole', /THE WHOLE LIST/.test(section(text, 'THE SHEET CALL')));
  const dornSheet = (text.split('# THE SHEET INPUT — dorn')[1] ?? '').split('# THE SHEET INPUT — ')[0];
  check('a KEPT sheet is framed with the beats since it was kept', /kept through 2026-09-19T10:01:00\.000Z/.test(dornSheet) && /The alewife sets down a cup/.test(dornSheet));
  check('and never the story it already stands true of', !/At the ford/.test(dornSheet) && !/Mara and Dorn arrive/.test(dornSheet));
  check('the writes tell the door how far each keeping reaches',
    /sheet: dorn — through 2026-09-19T10:05:00\.000Z/.test(section(text, 'THE WRITES')) && /sheet: mara — through 2026-09-19T10:05:00\.000Z/.test(section(text, 'THE WRITES')));
  const dornPass = beaches[TABLE]['passport:dorn'] as any;
  const keptThen = dornPass['4']._;
  dornPass['4']._ = keptThen.replace('10:01:00.000Z', '10:05:00.000Z');
  const later = await tier('hard', '120', 'dorn');
  check('a character nothing has happened to since is owed no call', !/# THE SHEET INPUT — dorn/.test(later) && /# THE SHEET INPUT — mara/.test(later));
  dornPass['4']._ = keptThen;
}

console.log('\n=== soft — the telling, and where it lands ===');
{
  const text = await tier('soft', '120', 'mara');
  const input = section(text, 'THE INPUT');
  const journal = section(text, 'THE JOURNAL');
  check('where she stands, by face', /\[120\] The Alehouse/.test(input));
  check('what she knows', /every road in the valley/.test(input));
  check('what she carries', /stowed in her pack since the ford/.test(input));
  check('her story so far, already told', /the room did not look up/.test(input));
  check('the moment is the beat her account has not covered', /The alewife sets down a cup/.test(input) && !/\[THE MOMENT[^\]]*\][\s\S]*Mara and Dorn arrive/.test(input));
  check('the journal names the organ and the beat', /organ: witnessed:mara/.test(journal) && /location: pool:120:2/.test(journal));
  const marked = await handlePoolEngage({ pool_url: TABLE, pool_name: '120', agent_id: 'mara', tier: 'soft', since_position: 1 } as any);
  check("a surface's own marker names the moment, whatever the account covers", /The alewife sets down a cup/.test(marked.content[0].text) && /location: pool:120:2/.test(marked.content[0].text));
  const past = await handlePoolEngage({ pool_url: TABLE, pool_name: '120', agent_id: 'mara', tier: 'soft', since_position: 2 } as any);
  check('and nothing past it to tell says so', /nothing new to tell/.test(past.content[0].text));
  const covered = await tier('soft', '110', 'mara');
  check('a room her account already covers says so plainly, and costs no call', /nothing new to tell/.test(covered) && /covers slot 2/.test(covered));
}

console.log('\n=== soft for a table round one screen — told once, for them all ===');
{
  const r = await handlePoolEngage({ pool_url: TABLE, pool_name: '120', agent_id: 'mara', tier: 'soft', since_position: 1, party: ['dorn'] } as any);
  const text = r.content[0].text;
  const input = section(text, 'THE INPUT');
  const call = section(text, 'THE CALL');
  check('the contract tells one table, aloud, naming each character', /players sitting at ONE screen/.test(call) && /heard ALOUD/.test(call) && /NAME EACH CHARACTER/.test(call));
  check('every character at the screen rides with what they know and carry', /- Mara/.test(input) && /- Dorn/.test(input) && /stowed in her pack since the ford/.test(input));
  check('and none of them is listed as a stranger here', !/Here with you, by appearance/.test(input) || !/pedlar/.test(input));
  check('the journal names the account it lands in and who it was told for', /organ: witnessed:mara/.test(section(text, 'THE JOURNAL')) && /told for: mara dorn/.test(section(text, 'THE JOURNAL')));
  const alone = await handlePoolEngage({ pool_url: TABLE, pool_name: '120', agent_id: 'mara', tier: 'soft', since_position: 1 } as any);
  check('without a party it is that character\'s own telling, as before', /You are Mara\./.test(section(alone.content[0].text, 'THE INPUT')) && /renders this character's lived moment/.test(section(alone.content[0].text, 'THE CALL')));
}

console.log('\n=== the door and the turn — nothing rides twice ===');
{
  const { handlePlay } = await import('../src/tools/play.js');
  const door = (await handlePlay({ world: TABLE, handle: 'mara' } as any)).content[0].text;
  const count = (re: RegExp) => (door.match(re) ?? []).length;
  check('the door opens on her room, her pages beneath it', /pool:120 @/.test(door) && /YOUR OWN CONTEXT \(mara\)/.test(door));
  check('her newest tellings ride ONCE — in the room, never again in her own context', count(/the room did not look up/g) === 1);
  check('what she knows rides once', count(/every road in the valley/g) === 1 && !/── knows:mara ──/.test(door));
  check('the room\'s record rides from what her account has not told', /# Contributions since position 1 /.test(door) && /The alewife sets down a cup/.test(door) && !/## slot 1 — /.test(door));
  check('and says why it starts there', /your account has told this room through slot 1/.test(door));
  const turn = (await handlePoolEngage({ pool_url: TABLE, pool_name: '120', agent_id: 'mara', since_position: 2 } as any)).content[0].text;
  check('a seat mid-session is told where its pages stand, never sent them again',
    /# Your account and what you know — witnessed:mara, knows:mara/.test(turn) && !/the room did not look up/.test(turn) && !/every road in the valley/.test(turn));
  check('the place and the ways still ride every engage — the mirror draws its situation from them', /# The place — /.test(turn) && /# The ways /.test(turn));
  const first = (await handlePoolEngage({ pool_url: TABLE, pool_name: '120', agent_id: 'mara' } as any)).content[0].text;
  check('an engage with no marker is an arrival, and carries them', /# Your account — witnessed:mara, last 2 of 2/.test(first) && /# You know — knows:mara/.test(first));
}

console.log('\n=== a tier engage writes nothing ===');
{
  const r = await handlePoolEngage({ pool_url: TABLE, pool_name: '120', agent_id: 'mara', tier: 'medium', submit: 'I try to stage' } as any);
  check('a stage riding with a tier is refused, whole', /composes a call and writes nothing/.test(r.content[0].text));
  const named = await handlePoolEngage({ pool_url: TABLE, pool_name: 'gate', agent_id: 'mara', tier: 'medium' } as any);
  check('a named pool is not a room of a table', /is not a place's address/.test(named.content[0].text));
}

console.log(`\nsmoke-tiers: ${pass} passed, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);
