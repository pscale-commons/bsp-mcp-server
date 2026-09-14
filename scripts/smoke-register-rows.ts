/**
 * Register-rows smoke — every reader of the worlds register walks its wraps.
 *
 * The register grows by APPEND and supernests when its ladder fills (its own
 * growth law). On 2026-09-14 the tenth world (the open tables) wrapped it: the
 * first nine rows moved under the root underscore and the newer rows landed in
 * the container at 1. Two readers went blind that minute — the play door's
 * lookup and the welcome's world fill — because both walked the top level only.
 * This pins that every row is read, in the register's own order, and that the
 * welcome names the first world that HAS A DOOR (a third field naming a room),
 * never a canon scenario that would answer a stranger with the Author walk.
 *
 * Run: npm run smoke:register
 */
import { registerRows, routeToOrigin } from '../src/tools/play.js';
import { pickWelcomeWorld } from '../src/tools/invite.js';

let checks = 0;
function assert(cond: boolean, msg: string): void {
  if (!cond) { console.error(`✗ ${msg}`); process.exit(1); }
  checks += 1;
}

const FLAT = {
  _: 'Worlds at this beach.',
  1: 'brackenfoot → /w/brackenfoot → surface',
  2: 'earth → earth.beach.happyseaurchin.com → surface',
  3: 'urb → urb.beach.happyseaurchin.com → surface',
};
const WRAPPED = {
  _: { _: 'Worlds at this beach — wrapped.', ...FLAT, 9: 'brackenfoot-open → /w/brackenfoot-open → gate' },
  1: { 1: 'thornmere-open → /w/thornmere-open → gate', 2: 'threshold-open → /w/threshold-open → gate' },
};

// 1 — rows, flat and wrapped, in order.
assert(registerRows(FLAT).length === 3, 'flat: three rows');
const rows = registerRows(WRAPPED);
assert(rows.length === 6, `wrapped: six rows read, got ${rows.length}`);
assert(rows[0].startsWith('brackenfoot →') && rows[3].startsWith('brackenfoot-open') && rows[4].startsWith('thornmere-open'), 'wrapped: the wrapped era first, then the container at 1, in order');
assert(registerRows(null).length === 0 && registerRows('nope').length === 0, 'no block, no rows');

// 2 — routes resolve at the family.
const base = 'https://beach.happyseaurchin.com';
assert(routeToOrigin('/w/brackenfoot-open', base) === `${base}/w/brackenfoot-open`, 'a path route is a table at the apex');
assert(routeToOrigin('urb.beach.happyseaurchin.com', base) === 'https://urb.beach.happyseaurchin.com', 'a host route stands as https');
assert(routeToOrigin('https://earth.beach.happyseaurchin.com/', base) === 'https://earth.beach.happyseaurchin.com', 'a URL route stands, trailing slash dropped');
assert(routeToOrigin('', base) === null, 'an empty route is nothing');

// 3 — the welcome names the first world with a door.
assert(pickWelcomeWorld(WRAPPED) === 'brackenfoot-open', 'wrapped: the first doored row (in the wrapped era) is the welcome world');
assert(pickWelcomeWorld(FLAT) === 'brackenfoot', 'no doored row: the first row stands');
assert(pickWelcomeWorld({ _: 'x', 1: 'urb → urb.beach.happyseaurchin.com → surface', 2: 'coldcote-open → /w/coldcote-open → gate' }) === 'coldcote-open', 'a doored row later in the list wins over a surface row before it');
assert(pickWelcomeWorld(null) === null && pickWelcomeWorld({ _: 'empty' }) === null, 'an empty register names nothing');

console.log(`✓ smoke:register — ${checks} checks`);
