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
      '3': 'PLACING: Thornlea stands in Fern Fold — *:https://world.test:spatial:world:211 — and its story begins on the world\'s clock at *:https://world.test:temporal:world:311151 — the first day, dusk.',
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
  // The world the scenario stands in: its map, its clock, its who-is-who — the
  // three spindles every character is placed on (rpg.2, 2026-10-23).
  'https://world.test': {
    'spatial:world': {
      _: { _: { _: 'THE WORLD entire — the world rung, true everywhere beneath it.' } },
      '2': { _: 'The Thousand Folds — valley country under tribute.', '1': { _: 'Fern Fold — reed-waters, and a fog that does not lift before noon.', '1': { _: 'Thornlea — a poor holding under six of the lord\'s men.' } } },
    },
    'temporal:world': {
      _: { _: { _: { _: { _: { _: 'THE CLOCK OF THE WORLD — its one clock.' } } } } },
      '3': {
        _: 'The third season — the storm-turn: fog in the folds until noon, thunder up the valleys in the afternoons.',
        '1': {
          _: 'The harvest month — the tithe come for what the folds brought in.',
          '1': {
            _: 'The first week of it.',
            '1': { _: 'The first day — low cloud and no wind; strangers come to the ford.', '5': 'Dusk — the light failing early under the cloud.', '6': 'Dark — full night, no moon through the cloud.', '7': 'Deep night — the cold coming down off the slopes.' },
            '2': { _: 'The second day — a thin cold rain through the afternoon.', '1': 'First light — grey, the fog lying on the water.', '2': 'Morning — the fog lifting off the reed-waters.', '4': 'Afternoon — the rain setting in.' },
          },
        },
      },
    },
    'almanac:world': {
      _: 'Who is who in the world — the peoples, and what each is held to be.',
      '3': { _: 'The fold-folk — the twin-toned valley people.', '1': { _: 'The Fern-folk — of the reed-waters and the fern terraces.', '1': 'Pedlars and carriers who walk the fold roads.' } },
    },
  },
  // A table begun since the clock stood: nothing has happened yet.
  'https://table.test/w/thornlea-fresh': {
    'keeper:scene': { _: "The keeper's hold for this table.", '3': 'PLACING: *:https://master.test/w/thornlea:spatial:thornlea:120' },
    'passport:sef': {
      _: 'Sef — a carrier on the fold roads.',
      '1': 'Character Force ~7; peak in endurance, weak in a fight.',
      '3': 'Lean and road-browned, a carrier\'s frame on her back. Location: *:https://master.test/w/thornlea:spatial:thornlea:120 Who: *:https://world.test:almanac:world:3.11',
    },
    'pool:120': { _: 'pscale:grit/1' },
    'liquid:pool:120': {
      _: 'Liquid pre-commit buffer. window opened 2026-10-23T10:00:00.000Z',
      '1': { _: 'I set my frame down by the fire and ask for a bed.', '1': 'sef', '3': '2026-10-23T10:00:00.000Z', '6': '2026-10-23T10:00:00.000Z' },
      '2': { _: 'looks up from the trestle', '1': 'the alewife', '3': '2026-10-23T10:00:10.000Z', '6': '2026-10-23T10:00:10.000Z' },
    },
  },
  // The table: characters, pools, the keeper placing — no spatial of its own.
  'https://table.test/w/thornlea-grp': {
    'keeper:scene': { _: "The keeper's hold for this table.", '3': 'PLACING: *:https://master.test/w/thornlea:spatial:thornlea:120' },
    'passport:mara': {
      _: 'Mara — a pedlar with a quick tongue.',
      '1': 'Character Force ~8; peak in warm talk, weak in a straight fight.',
      '3': 'Quick-eyed and easy, a pedlar\'s pack, a blue glass bead on a cord at her throat. Location: *:https://master.test/w/thornlea:spatial:thornlea:120 Who: *:https://world.test:almanac:world:3.11',
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
    'names:scene': {
      _: 'NAMES THIS TABLE USES — what the table has come to call the place\'s people, kept by the keeper once a voice coins one.',
      '1': { _: 'Sergeant Vane — the sergeant who came to the alehouse door; the soldiers\' word for him, and nobody corrects it', '1': 'keeper', '2': '120', '3': '2026-09-22T12:00:00.000Z', '4': 'designer', '5': 'held: Sergeant Bole' },
    },
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

async function tier(t: 'soft' | 'medium' | 'hard' | 'figure', room: string, agent: string): Promise<string> {
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
  check('to ONE RING beneath them — a branch\'s own line, never its worked cases', /\[1\.42\]/.test(call) && !/\[1\.421\]/.test(call) && /\[2\.4\]/.test(call) && !/\[2\.41\]/.test(call));
  check('a finer position the act needs is NAMED, and arrives where it stands with a ring of its own',
    /\[1\.441\]/.test(call) && call.indexOf('[1.43]') < call.indexOf('[1.44]') && call.indexOf('[1.44]') < call.indexOf('[1.441]') && call.indexOf('[1.443]') < call.indexOf('[1.45]'));
  check('the contract names the window as acts and intentions — the place\'s people each speaking for itself, and its news', /the people of the place each speaking for itself/.test(call) && /what news has reached the place/.test(call));
  // NAMES (rpg.11, 2026-09-29): a character is who they look like until their name
  // is said aloud — the record said 'Ugarth doesn't answer Orik yet' before Orik
  // had given it, and the telling carried the name to Ugarth.
  check('the resolution names no one by a name not yet spoken aloud — a character included', /NAME NO ONE BY A NAME NOT YET SPOKEN ALOUD/.test(call) && /THE ACTORS' names tell you who is who; they are never what the place has heard/.test(call));
  check('grit 1.45 rides with it: appearance until a name is spoken aloud', /\[1\.45\] Name actors by appearance until a name is spoken aloud/.test(call));
  check('THE PLACE gives the room\'s face', /\[120\] The Alehouse — low and smoky/.test(input));
  check('and the fixtures\' faces one level down', /The trestle — and behind it the alewife/.test(input));
  check('THE FENCE — no hidden line reaches the resolution', !/Maerla/.test(input) && !/guards badly/.test(input) && !/weak seam/.test(input));
  check('THE FENCE — no keeper register either', !/THE ARC/.test(input) && !/PRESSURE POINTS/i.test(input) && !/REINFORCEMENT CLOCK/.test(input));
  check('the world\'s rules ride at their framing only', /Rules constraining action at Thornlea/.test(input) && !/THE OCCUPATION/.test(input));
  check('the story crosses rooms — the ford beat rides here', /At the ford, Mara lifts the bead/.test(input));
  check('the resolution\'s story headings carry no handle — a handle in a heading is a name it would carry into the record', !/voiced by/.test(input) && /At the ford, Mara lifts the bead/.test(input));
  // THE STORY KEEPS ITS OWN HOUR (rpg.2, 2026-10-23): a beat's stamp is when it was
  // played, and printed in a heading it set the story's hour to the player's — Ugarth
  // left the Green in the late afternoon and, played the next morning, reached the
  // Long House in a grey morning.
  check('the story so far carries no beat\'s stamp — the order is its clock, the hour the beats\' own',
    !/\d{4}-\d\d-\d\dT\d\d:\d\d/.test(input) && /At the ford, Mara lifts the bead/.test(input));
  check('and the resolution is told the hour is the story\'s, never the hour it is read at', /never the hour you read this at/.test(call));
  check('each actor says, as a fact the record holds, whether their name has been said aloud', /- Mara — this name has NOT been said aloud here: the record calls them by how they look/.test(input));
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
  // A WAY LANDS IN A ROOM (world-genome 2.1): the village is entered at its first
  // room down its first branch, a place with nothing finer is its own finest place.
  check('and the ways a WAY line may name — each where it lands, a room', /way: \[121\] The Village/.test(claim) && /way: \[200\] The Road In/.test(claim) && !/way: \[100\]/.test(claim));
  check('the actors are named for the beat', /actor: mara — Mara/.test(claim));
  check('a seat that is its own door is told how to act on the claim — and that a WAY line is walked, never committed',
    /a seat that is its own door: commit the beat/.test(claim) && /A closing WAY line is WALKED, never committed/.test(claim));
  check('and no keyed line a door\'s parser reads is disturbed by it', (claim.match(/^resolves_window:/gm) ?? []).length === 1 && (claim.match(/^way: \[/gm) ?? []).length >= 1);
}

console.log('\n=== hard — the keeper holds what nobody else is given ===');
{
  const text = await tier('hard', '120', 'dorn');
  const input = section(text, 'THE INPUT');
  const call = section(text, 'THE CALL');
  check('the law rides at upkeep\'s addresses', /\[3\]/.test(call) && /\[1\.46\]/.test(call));
  check('the call asks for lines, not reasoning', /no reasoning, no commentary/.test(call) && /ARRIVES <label>/.test(call) && /NEWS <room address/.test(call));
  // THE KEEPER KEEPS THE BOOKS AND CARRIES THE NEWS (#459): one mind asked to be
  // every person at once voiced a man at the inn answering a killing on the hill.
  check('the keeper never voices a person — each figure present speaks for itself', /you never voice a person/.test(call) && !/WORLD <label>/.test(call) && !/at most three of the place's people/.test(call));
  check('news travels only as the world carries it, and is written where it will be heard', /only when the world's own rules carry it there NOW/.test(call) && /where it will be heard/.test(call));
  check('a held name is never cast onto a face from elsewhere', /never a\s+held name from elsewhere cast onto a face here/.test(call));
  check('a voice speaking next keeps its label — never a better name for one already there', /never a better name for one already there/.test(input) && /never a line to say that nothing has/.test(call));
  check('the place opens its hidden directories', /\(held .*\) Half-commandeered as the crew's billet/.test(input));
  check('and the names behind the faces', /Maerla/.test(input));
  check('the keeper\'s own register rides as its spine — the branches and their children\'s lines', /THE ARC/.test(input) && /PEEL OFF THE BOY/.test(input) && /THE REPAIRS LOG/.test(input));
  check('and an authoring record nested deeper stays where it is', !/three levels down/.test(input));
  check('the world\'s rules ride to the same depth', /THE REINFORCEMENT CLOCK/.test(input));
  check('identity is WALKED to the room — the alehouse as held, whole', /\[120\] The Alehouse as held/.test(input) && /the one warm room/.test(input) && /The Village as held/.test(input));
  check('never the whole holding: the Store\'s holding is nothing to a moment at the trestle', !/The Store as held/.test(input));
  check('what the world already has standing', /the alewife: wipes the same patch/.test(input));
  check('the keeper is no longer handed the players\' tellings — the books need the moment, not their minds', !/the room did not look up/.test(input) && !/WHAT THEIR PLAYERS WERE TOLD/.test(input));
  check('the writes name the figures present who speak next — the place\'s people, never a character', /^figure: the alewife$/m.test(section(text, 'THE WRITES')) && !/^figure: (mara|dorn)$/mi.test(section(text, 'THE WRITES')));
  check('the writes name the places a voice may wait at — every room of the place, and the room they stand in', /place: \[121\]/.test(section(text, 'THE WRITES')) && /place: \[120\]/.test(section(text, 'THE WRITES')));
  check('and never a table room at no room of the place — news left there would wait where no way leads', !/place: \[110\]/.test(section(text, 'THE WRITES')));
  check('the writes say who stands in which window, for a DROP to reach and one person to keep one window', /^stands: \[120\] the alewife$/m.test(section(text, 'THE WRITES')));
  check('the keeper\'s story carries no beat\'s stamp either — the light goes by the story\'s hour',
    !/\d{4}-\d\d-\d\dT\d\d:\d\d/.test(input) && /never the hour you read this at/.test(call));
  check('the writes name each character whose name no one has said here, so no line the characters read carries it', /^unsaid: Mara$/m.test(section(text, 'THE WRITES')) && /^unsaid: Dorn$/m.test(section(text, 'THE WRITES')));
  check('the keeper is shown who speaks for themselves next here, so one person is never seated twice', /\[WHO SPEAKS FOR THEMSELVES NEXT, HERE[^\]]*\]\n- the alewife/.test(input));
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

  // THE FRAME IS LAID TO BE KEPT (proposal 2026-09-21-what-a-person-pays-for): a
  // prompt cache is a prefix match, so what does not move rides first — the
  // table, then the room — and only the moment rides last.
  const { KEEPER_TABLE_MARK, KEEPER_ROOM_MARK } = await import('../src/tools/tiers.js');
  const at = (t: string, needle: string | RegExp) => (typeof needle === 'string' ? t.indexOf(needle) : t.search(needle));
  const tMark = at(input, KEEPER_TABLE_MARK), rMark = at(input, KEEPER_ROOM_MARK);
  check('two marks say where the table ends and where the room ends, in that order', tMark > 0 && rMark > tMark);
  check('THE TABLE rides first: the register and the rules stand above the first mark',
    input.trimStart().startsWith("[THE KEEPER'S REGISTER") && at(input, "[THE WORLD'S RULES") > 0 && at(input, "[THE WORLD'S RULES") < tMark);
  check('THE ROOM rides next: the place held, and who holds it how, between the marks',
    at(input, '[THE PLACE, HELD') > tMark && at(input, '[WHO HOLDS THIS PLACE HOW') > at(input, '[THE PLACE, HELD') && at(input, '[WHO HOLDS THIS PLACE HOW') < rMark);
  check('THE MOMENT rides last: the story, the sheets, the standing voices',
    [/\[THE STORY SO FAR/, /\[THE CHARACTERS/, /\[THE WORLD NOW/].every((h) => at(input, h) > rMark));
  const keptPart = (t: string) => { const i = section(t, 'THE INPUT'); return i.slice(0, i.indexOf(KEEPER_ROOM_MARK) + KEEPER_ROOM_MARK.length); };
  const tablePart = (t: string) => { const i = section(t, 'THE INPUT'); return i.slice(0, i.indexOf(KEEPER_TABLE_MARK) + KEEPER_TABLE_MARK.length); };
  const pool120 = beaches[TABLE]['pool:120'] as any;
  pool120['3'] = { _: 'Dorn drains the cup and sets it down hard.', '1': 'dorn', '3': '2026-09-19T10:09:00.000Z', '5': 'mara,dorn' };
  const nextBeat = await tier('hard', '120', 'dorn');
  delete pool120['3'];
  check('A BEAT LATER NOTHING KEPT HAS MOVED — the law, and the frame down to the room\'s mark, are byte for byte what they were',
    section(nextBeat, 'THE CALL') === call && keptPart(nextBeat) === keptPart(text) && /Dorn drains the cup/.test(section(nextBeat, 'THE INPUT')));
  const otherRoom = await tier('hard', '110', 'dorn');
  check('and in another room of the same table the TABLE\'s part is still byte for byte the same, while the room\'s is its own',
    section(otherRoom, 'THE CALL') === call && tablePart(otherRoom) === tablePart(text) && keptPart(otherRoom) !== keptPart(text));
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
  // A HANDLE IS NEVER A NAME HEARD (rpg.11): '- Orik:' handed a telling the name
  // before anyone said it. The head says whose act it was; the look rides so the
  // telling knows itself in a record that calls it by how it looks.
  check('the moment is headed by whose act it was — her own is "you", never her handle', /\[THE MOMENT[^\]]*\]\n- you: The alewife sets down a cup/.test(input) && !/^- mara:/m.test(input));
  check('the telling is told a name is the character\'s only once heard said aloud', /A NAME IS THE CHARACTER'S ONLY ONCE THEY HAVE HEARD IT SAID ALOUD/.test(section(text, 'THE CALL')) && /never a name they heard \(1\.14\)/.test(section(text, 'THE CALL')));
  check('and is shown how the others see her, so a record that says so is hers', /\[YOU, AS THE OTHERS SEE YOU[^\]]*\]\nQuick-eyed and easy/.test(input) && !/Location:/.test(input.split('[YOU, AS THE OTHERS SEE YOU')[1]?.split('\n[')[0] ?? ''));
  check('a seat that is its own door is told to hold the telling to the moment, then keep it, located', /a seat that is its own door: before keeping it, hold the telling to the moment/.test(journal) && /Then keep it by bsp\(block=<organ>, append=true/.test(journal) && (journal.match(/^location:/gm) ?? []).length === 1);
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
  check('at one screen the moment is headed by the companion whose act it was', /\[THE MOMENT[^\]]*\]\n- mara: The alewife sets down a cup/.test(input));
  check('and each companion rides with the look the record may call them by', /looks: Quick-eyed and easy/.test(input) && /looks: Broad and scarred/.test(input));
  const alone = await handlePoolEngage({ pool_url: TABLE, pool_name: '120', agent_id: 'mara', tier: 'soft', since_position: 1 } as any);
  check('without a party it is that character\'s own telling, as before', /You are Mara\./.test(section(alone.content[0].text, 'THE INPUT')) && /renders this character's lived moment/.test(section(alone.content[0].text, 'THE CALL')));
}

console.log('\n=== the telling holds to its moment (2026-09-22) ===');
{
  const text = await tier('soft', '120', 'mara');
  const input = section(text, 'THE INPUT');
  check('the frame closes on where the moment ends, naming the character', /You are Mara\.\n\[THE MOMENT ENDS HERE\. Nothing after this line has happened\. Mara stands exactly where the last beat leaves them/.test(input) && /no further\.\]\s*$/.test(input.trim()));
  check('the names the table uses ride the telling, by face — the held name never', /\[NAMES THIS TABLE USES[^\]]*\]\n- Sergeant Vane — the sergeant who came to the alehouse door/.test(input) && !/Bole/.test(text));
  const medium = await tier('medium', '120', 'mara');
  check('and the resolution, by face — the held name never', /\[NAMES THIS TABLE USES/.test(section(medium, 'THE INPUT')) && /Sergeant Vane/.test(section(medium, 'THE INPUT')) && !/Bole/.test(medium));
  check('the resolution is told never to coin a name, and to use the table\'s where one stands', /[Nn]ever a name of your own making/.test(section(medium, 'THE CALL')) && /where \[NAMES THIS TABLE USES\] gives one, use it exactly/.test(section(medium, 'THE CALL')));
  const hard = await tier('hard', '120', 'mara');
  check('the keeper reads the held name beside the table\'s', /- Sergeant Vane — the sergeant who came to the alehouse door[^\n]*\(held: Sergeant Bole\)/.test(section(hard, 'THE INPUT')));
  check('and is told the KNOWN shape — a coined name kept once, for the whole table', /KNOWN <the table's name> · <the face, as anyone present says it> · <the held name, or none> · <how the place explains it>/.test(section(hard, 'THE CALL')) && /never written twice/.test(section(hard, 'THE CALL')));
  // AN OBSERVER — a handle at the table with no passport here.
  const watched = await handlePoolEngage({ pool_url: TABLE, pool_name: '120', agent_id: 'watcher', tier: 'soft', since_position: 1 } as any);
  const wt = watched.content[0].text;
  const wi = section(wt, 'THE INPUT');
  check('an observer is told under the shared-screen contract: named characters, never you', /NAME EACH CHARACTER/.test(section(wt, 'THE CALL')) && /NEVER say 'you'/.test(section(wt, 'THE CALL')));
  check('nothing private rides for them — no knows, no carries', /no character here is yours: nothing is known or carried/.test(wi) && !/every road in the valley/.test(wi) && !/stowed in her pack/.test(wi));
  check('their story so far is the room\'s own record before the moment', /\[THE STORY SO FAR — the room's record before this moment/.test(wi) && /Mara and Dorn arrive/.test(wi));
  check('the moment is the beats since their own marker, headed by whose act — never a handle', /\[THE MOMENT[^\]]*\]\n- another: The alewife sets down a cup/.test(wi) && !/- mara:/.test(wi));
  check('the frame closes on watching, unseen, and where the moment ends', /You are watching, unseen: no character here is yours/.test(wi) && /\[THE MOMENT ENDS HERE/.test(wi));
  check('the journal says an observer keeps nothing', /organ: none — an observer keeps no account/.test(section(wt, 'THE JOURNAL')) && /an observer keeps nothing: read it, and let it go\./.test(section(wt, 'THE JOURNAL')) && !/keep the telling by bsp/.test(section(wt, 'THE JOURNAL')));
}

console.log('\n=== figure — one of the place\'s people, speaking for itself (#459) ===');
{
  const r = await handlePoolEngage({ pool_url: TABLE, pool_name: '120', agent_id: 'the alewife', tier: 'figure' } as any);
  const text = r.content[0].text;
  const call = section(text, 'THE CALL');
  const input = section(text, 'THE INPUT');
  const writes = section(text, 'THE WRITES');
  // ITS LINE IS PUBLIC (review of #463): asked in the first person, the alewife
  // said the fact a stranger is meant to earn, 2 of 4. A deed, and words said aloud.
  check('the call is one person\'s own, and public: a DEED and WORDS SAID ALOUD, never a mind — or GONE', /YOUR LINE IS PUBLIC/.test(call) && /never a\s+thought/.test(call) && /^DO </m.test(call) && /^SAY </m.test(call) && /the one word GONE/.test(call));
  check('a figure carries no engine law — it is a person in the world, not a player of GRIT', !/\[1\.4\]/.test(call) && !/\[3\]/.test(call));
  check('it is told who it is, and where', /\[WHO YOU ARE\]\nthe alewife — here at The Alehouse/.test(input));
  check('the place it stands in rides with what the place keeps, down the spine to its room', /Half-commandeered as the crew's billet/.test(input));
  check('and what stands inside the room is seen by its face, never its keeping — not the alewife\'s own mind at the trestle', /The trestle — and behind it the alewife/.test(input) && !/Maerla/.test(input));
  check('KNOWLEDGE IS LOCATED — no keeper register, no arc, no world clock', !/THE ARC/.test(input) && !/PEEL OFF THE BOY/.test(input) && !/REINFORCEMENT CLOCK/.test(input));
  check('what it has seen is this room\'s own record', /Mara and Dorn arrive\./.test(input) && /The alewife sets down a cup/.test(input));
  check('and never another room\'s — a beat at the ford never reaches the alehouse', !/At the ford/.test(input) && !/A carter passes/.test(input));
  check('no character\'s private pages ride: not what she knows, carries or was told', !/every road in the valley/.test(input) && !/stowed in her pack/.test(input) && !/the room did not look up/.test(input));
  check('its own last line rides, standing in the window', /\[YOUR LAST LINE[^\]]*\]\nwipes the same patch of trestle/.test(input));
  check('the writes say where the line is staged and under what label', /^room: 120$/m.test(writes) && /^figure: the alewife$/m.test(writes));
  const news = await handlePoolEngage({ pool_url: TABLE, pool_name: '120', agent_id: 'the place', tier: 'figure' } as any);
  check('the place\'s own news is no one\'s voice, and is never asked to speak', /no figure to voice/.test(news.content[0].text));
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
  check('the rhythm a continuing seat is handed names the composed calls (grit 1)', /RENDER and MAKE IT HAPPEN are COMPOSED for you — engage with tier='soft' to tell, tier='medium' to resolve/.test(turn));
  const first = (await handlePoolEngage({ pool_url: TABLE, pool_name: '120', agent_id: 'mara' } as any)).content[0].text;
  check('an engage with no marker is an arrival, and carries them', /# Your account — witnessed:mara, last 2 of 2/.test(first) && /# You know — knows:mara/.test(first));
}

console.log('\n=== the law a seat is delivered points at the composed calls ===');
{
  const first = (await handlePoolEngage({ pool_url: TABLE, pool_name: '110', agent_id: 'stranger' } as any)).content[0].text;
  check('grit 1 tells the seat to engage with tier=soft for its telling', /RENDER the lived moment \(1\.2\): engage with tier='soft', tell the moment as it directs, journal where it says/.test(first));
  check('and with tier=medium to make it happen, at the player\'s word', /at their word MAKE IT HAPPEN \(1\.4\): engage with tier='medium', write the one beat it asks, commit with its claim/.test(first));
  check('the loop from before the tiers is gone from the line', !/COMMIT your own half/.test(first) && !/you may STAGE a preview/.test(first));
  check('and the check it displaced still stands where it lives', /\[1\.6\] A CHECK only when/.test(first) && /wear branch 2/.test(first));
}

console.log('\n=== a tier engage writes nothing ===');
{
  const r = await handlePoolEngage({ pool_url: TABLE, pool_name: '120', agent_id: 'mara', tier: 'medium', submit: 'I try to stage' } as any);
  check('a stage riding with a tier is refused, whole', /composes a call and writes nothing/.test(r.content[0].text));
  const named = await handlePoolEngage({ pool_url: TABLE, pool_name: 'gate', agent_id: 'mara', tier: 'medium' } as any);
  check('a named pool is not a room of a table', /is not a place's address/.test(named.content[0].text));
}

console.log('\n=== where, when, who — the world\'s three spindles in every frame (rpg.2, 2026-10-23) ===');
{
  const { beatMoment, whenOf } = await import('../src/tools/tiers.js');
  const FRESH = 'https://table.test/w/thornlea-fresh';
  // A story begun before the clock stood: the place in the world and the season
  // ride, and the hour stays the story's own until its keeper names one.
  const old = section(await tier('medium', '120', 'dorn'), 'THE INPUT');
  check('WHERE IN THE WORLD walks the world\'s map from its root down to the scenario',
    /\[WHERE IN THE WORLD — spatial:world/.test(old) && /THE WORLD entire/.test(old) && /Fern Fold — reed-waters, and a fog/.test(old) && /Thornlea — a poor holding/.test(old));
  check('the world comes before the place, the place before the clock',
    old.indexOf('[WHERE IN THE WORLD') < old.indexOf('[THE PLACE') && old.indexOf('[THE PLACE') < old.indexOf('[WHEN'));
  check('a story under way before the clock keeps its own hour: the season rides, and says so',
    /\[WHEN — the world's own clock/.test(old) && /The third season — the storm-turn/.test(old) && /the hour stands where the story's own words left it/.test(old) && !/\[THE HOURS AHEAD/.test(old));
  check('who a character is in the world rides with their sheet, walked in the who-is-who',
    /who, in the world:\n {4}The fold-folk — the twin-toned valley people\.\n {4}The Fern-folk/.test(old) && /Pedlars and carriers/.test(old));
  check('only the placing crosses the fence: the scenario keeper\'s own register still never reaches the resolution', !/THE ARC/.test(old) && !/PEEL OFF THE BOY/.test(old));
  const oldMoment = await beatMoment(TABLE, '120', ['mara', 'dorn'], null);
  check('and a beat committed there carries no moment yet', oldMoment === null);

  // A table begun since: the story starts at the scenario's moment on the clock.
  const freshText = await handlePoolEngage({ pool_url: FRESH, pool_name: '120', agent_id: 'sef', tier: 'medium' } as any);
  const fresh = section(freshText.content[0].text, 'THE INPUT');
  check('a fresh table stands at its placing\'s moment: the clock walked from the season down to the part of the day',
    /The third season/.test(fresh) && /The harvest month/.test(fresh) && /The first day — low cloud/.test(fresh) && /Dusk — the light failing/.test(fresh) && !/the hour stands where/.test(fresh));
  check('the clock\'s root and its zero rungs say nothing the rungs below do not', !/THE CLOCK OF THE WORLD/.test(fresh));
  check('THE HOURS AHEAD offer the rest of the day and the next day\'s, each with its address',
    /\[THE HOURS AHEAD/.test(fresh) && /\[311161\] Dark — full night/.test(fresh) && /\[311171\] Deep night/.test(fresh) && /\[311211\] First light — grey, the fog lying on the water\. — the next day/.test(fresh) && !/\[311151\]/.test(fresh));
  check('the resolution is told what WHEN is and how a WHEN line names an hour ahead',
    /\[WHEN\] \(the world's own clock at this moment/.test(section(freshText.content[0].text, 'THE CALL')) && /end with a line WHEN <address>/.test(section(freshText.content[0].text, 'THE CALL')));
  check('the first beat there carries the placing\'s moment', JSON.stringify(await beatMoment(FRESH, '120', ['sef'], null)) === JSON.stringify({ stamp: '*:https://world.test:temporal:world:311151', label: 'The first day, dusk' }));

  // A beat stamped: the clock stands where it left them, and moves one beat.
  const freshPool = beaches[FRESH]['pool:120'] as any;
  freshPool['1'] = { _: 'The carrier sets her frame down by the fire and asks for a bed; the alewife looks up from the trestle.', '1': 'sef', '2': '*:https://world.test:temporal:world:311151', '3': '2026-10-23T10:01:00.000Z', '5': 'sef' };
  check('the next beat is one later', (await beatMoment(FRESH, '120', ['sef'], null))?.stamp === '*:https://world.test:temporal:world:311152');
  check('a WHEN line naming an hour ahead moves the clock there', JSON.stringify(await beatMoment(FRESH, '120', ['sef'], '311211')) === JSON.stringify({ stamp: '*:https://world.test:temporal:world:311211', label: 'The second day, first light' }));
  check('and never backwards', (await beatMoment(FRESH, '120', ['sef'], '311141'))?.stamp === '*:https://world.test:temporal:world:311152');
  const { momentFrom } = await import('../src/tools/tiers.js');
  const clockAt = (addr: string) => ({ ref: { origin: 'https://world.test', block: 'temporal:world', addr }, spine: beaches['https://world.test']['temporal:world'] as any, floor: 6 });
  check('a placing that names a part of the day whole begins at its first beat, a day whole at its first light',
    momentFrom(clockAt('311150'), []).next === '311151' && momentFrom(clockAt('311100'), []).next === '311111' && momentFrom(clockAt('311151'), []).next === '311151');
  const said = whenOf('They bed down by the fire and the night goes over them.\nWHEN 311211\nWAY 200');
  check('a WHEN line leaves the beat\'s text, and names its hour', said.jump === '311211' && said.text === 'They bed down by the fire and the night goes over them.\nWAY 200');
  const stamped = section((await handlePoolEngage({ pool_url: FRESH, pool_name: '120', agent_id: 'sef', tier: 'medium' } as any)).content[0].text, 'THE INPUT');
  check('a stamped beat is headed by its own moment in the story so far', /— at The Alehouse \[pool:120, slot 1\], The first day, dusk:/.test(stamped));
  check('and the moment made now is the next beat of the same dusk', /Dusk — the light failing/.test(stamped) && /\[311161\] Dark/.test(stamped));
  const keeper = section((await handlePoolEngage({ pool_url: FRESH, pool_name: '120', agent_id: 'sef', tier: 'hard' } as any)).content[0].text, 'THE INPUT');
  const { KEEPER_TABLE_MARK, KEEPER_ROOM_MARK } = await import('../src/tools/tiers.js');
  check('the keeper holds the world\'s map above the table mark and the clock below the room mark',
    keeper.indexOf('[WHERE IN THE WORLD') < keeper.indexOf(KEEPER_TABLE_MARK) && keeper.indexOf('[WHEN') > keeper.indexOf(KEEPER_ROOM_MARK) && /at the moment just resolved/.test(keeper) && /Dusk — the light failing/.test(keeper));
  const figure = section((await handlePoolEngage({ pool_url: FRESH, pool_name: '120', agent_id: 'the alewife', tier: 'figure' } as any)).content[0].text, 'THE INPUT');
  check('one of the place\'s people knows the hour it is living in', /\[WHEN — the world's own clock where you stand, now/.test(figure) && /Dusk — the light failing/.test(figure));
  const telling = section((await handlePoolEngage({ pool_url: FRESH, pool_name: '120', agent_id: 'sef', tier: 'soft' } as any)).content[0].text, 'THE INPUT');
  check('the telling is given the world, the hour of the moment told, and who the character is',
    /\[WHERE IN THE WORLD/.test(telling) && /\[WHEN — the world's own clock at the moment told/.test(telling) && /Dusk — the light failing/.test(telling) && /\[WHO YOU ARE IN THE WORLD\]\nThe fold-folk/.test(telling));
  check('and still no wall-clock instant anywhere in what the voices read', ![fresh, stamped, keeper, figure, telling].some((t) => /\d{4}-\d\d-\d\dT\d\d:\d\d/.test(t)));
}

console.log(`\nsmoke-tiers: ${pass} passed, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);
