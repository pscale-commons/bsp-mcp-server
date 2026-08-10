# CADO as a rigor gradient · the author/character split · world-inclusion

*2026-07-19 — design record. Written from a full-context Claude Code (Opus) session after the brackenfoot solo HITL exposed the seam. Author: weft. Status: PROPOSAL, awaiting David's blessing on the copy→reference direction before any entry refactor.*

## 1. The failure that named the seam

The `-test` solo boot did three jobs in one breath: **authored a world** (hand-copied nine scenario blocks into an empty table), **created a character** (genesis), and **played** (opening beat). Two defects fell out, and both are the *signature of a free-play Character doing rigorous Author work*:

- **Canon was polluted** — the character's blocks (`passport:Victor`…) were written onto the read-only master `/w/brackenfoot`, because the seat filled char-creation's `<beach-url>` with the beach it was *reading the scenario from* (canon), not the beach it was *playing in* (the table). The canon sign caught it late, on the `pscale_play` call, *after* the writes.
- **The fork was incomplete** — `frame-spec:brackenfoot` was dropped; a hand-copy of nine blocks mid-boot is unreliable.

Neither is inherent to making a character. Both come from fusing two roles at one seat.

## 2. CADO is a rigor gradient, not four flavours

David's framing: the faces are ordered by the **stakes of what they touch**, and therefore by the **rigor / constraint** required. The analogy: `claude.ai` is free and casual; **Claude Code is under more discipline because it edits code**. CADO is that ladder, made explicit for the beach:

| Face | Edits | Stakes | Posture |
|---|---|---|---|
| **Character** | ephemeral play — a beat, a pool line, own `witnessed` | lowest | free, immersed, fast |
| **Author** | shared **content** — places, standing figures, regions (the stage) | medium: must be *coherent*, others inhabit it | composed, equipped |
| **Designer** | **rules & conventions** — `rules:nomad`, GRIT, the entry flow itself | highest: must be *correct* | code-strict |
| **Observer** | nothing (read-only correlation across narratives) | — | wide, silent |

The law that falls out: **match the face to the stakes. A Character never does Author work.** The `-test` boot broke exactly this rule — and the substrate paid for it.

## 3. The author/character split at entry

- **Forking / preparing a world instance is an Author act.** It shapes shared content; it needs rigor.
- **Genesis + play is a Character act.** It's free, immersed, low-stakes.

The lead player wears **Author first** (prepare the stage, once), then **Character** (play it). Everyone else wears **Character only**. This is precisely the tabletop DM↔players division, and CADO already names it — we just stopped letting the faces be what they are (the canon sign literally *instructs the Character to fork*).

Splitting them fixes both defects **by construction**: a Character handed a ready stage never reads canon, never forks, never *can* pollute the master. That's the ~12-call, sub-minute clean boot we already see when the table was Author-prepared (`/w/brackenfoot-play`).

## 4. The pivotal decision — does a table COPY the world, or REFERENCE it?

**Copy (today).** A table is a full scenario copy + play-state. Total isolation; but the fork is nine writes (`spatial` and `identity` are the two biggest blocks in the game), it is error-prone by hand, and reading-from-canon-while-writing-to-a-table is the source of the canon confusion.

**Reference (recommended).** A table holds only **play-state** — the characters and the pools — and **references** the shared world's scenario. The substrate already has the mechanism: a character's location is a star-ref, `passport:3 = "… Location: *:<beach>:spatial:<world>:<addr>"`. Point that star-ref at the **shared world** and the split is clean:

- The **place** (`spatial`, `rules`, `roster`, `identity`) is read from the shared world — read-only by nature, so a Character *cannot* pollute it.
- The **room** (`pool:<addr>`) and the **characters** live in the table — per-group, isolated.
- **No fork.** Zero scenario copies. The 9-write balloon disappears; so does the dropped-block risk and the canon-write confusion.

The isolation that actually matters — *one group's play does not touch another's* — is fully preserved (play-state is per-table). What's shared is the scenario, which is read-only and *should* be shared.

**Recommendation: default to reference; keep copy as an opt-in "freeze this scenario" snapshot** (for a playtest that must not move if the master is re-authored). Reference is what world-inclusion (§5) requires; copy stays available for a frozen cartridge.

Bounded code change this implies (for the blessing, not built yet): `pscale_play` resolves the **place** from the world named in the character's location star-ref, and the **room** from the table it is called on; `char-creation` pins the character's write-target to the table and the location's referenced-world to the shared master.

## 5. World-inclusion — patching regions into a shared, expanding world

David's question: once authored, can a cartridge be *submitted for inclusion* — patched into a larger world on the beach, "outwith their cartridge control rig"?

Yes, and it is substrate-native:

- A scenario **is region-blocks** (`spatial:brackenfoot`, `identity:brackenfoot`, `rules:brackenfoot`, its roster). A **cartridge** is the *authoring/reset rig* around those blocks (seed, dump, reset) — but the blocks stand on their own.
- A larger **world** is a shared spatial tree. It **includes** a region by grafting it at a **proximate address** — a star-ref (or subtree) at a position in the world's `spatial`, exactly the "hive off a region as its own block and reference it from the parent" pattern (`block-conventions:4.74`). Brackenfoot becomes *a holding at address X in the valley*, one step from a named neighbour.
- **"Outwith the cartridge rig"** = the fork/reset tooling is the cartridge's private concern; the *blocks* graft into the shared world independently of it. Expanding the world is **authoring more regions** at proximate addresses on the shared substrate — an **Author** act.
- This is the same move as the **campaign** case already noted (`project-campaign-world-entry`): *author a new area proximate to existing geography (one step, distant, a familiar named location), place it near/far from other players, seed a random encounter.* World-inclusion and campaign-growth are one Author operation: **graft a region at a proximate address.**

So the two nouns become **scenario · table** plus one verb the Author owns: **graft** (a region into the world). And the reference model (§4) is what makes it live: a Character playing the expanded world simply has a location star-ref into the shared world's (now larger) spatial.

## 6. Build roadmap (ordered; none built yet)

1. **Reference resolution in `pscale_play`** — place from the location-referenced world, room from the table; `char-creation` pins write-target to the table. *This is the load-bearing change and the one to bless first.* Testable: a lightweight table (pool only) + a character whose location references canon, plays with no fork.
2. **Canon hygiene** — sweep the orphan `Victor` blocks and `pool:gate` residue off `/w/brackenfoot`; in the shared-world model the master must be pristine.
3. **A shared world block** — a `spatial:<world>` that *includes* brackenfoot as a region at an address (the first graft), proving world-inclusion.
4. **The Author's prepare/graft act** — a clean, complete operation (not a character's hand-copy). In the reference model most of "prepare" evaporates (a table is lightweight); the Author's real work becomes *authoring/grafting regions* — the Author face's proper job. Whether this needs tooling or a robust convention is the open question, decided by an NHITL of an Author-seat grafting a region.
5. **Face-scoped entry** — the doorway hands a **Character** a ready table (small, clean); an **Author** gets the prepare/graft surface; a **Designer** gets the rules. The eleven-tool federation surface stops greeting a storytelling Character (which is also what triggered the Run-1 tool-distrust spiral).

## 7. Testable now, with no new build

`/w/brackenfoot-play` is an **Author-prepared** clean table (prepared by a full-context Opus seat — complete, canon-safe). Playing it *is* the role-split's clean boot; `-test` (a Character forking mid-play) is the fused-boot's defective one. The contrast is already the evidence: same scenario, one prepared by the right face and one not.

## 8. The through-line

The game was never dying of admin. It was asking one seat to be Author and Character at once, at the moment of entry, on a free-play model's budget. Give the faces their rigor gradient — Character plays, Author prepares and grafts, Designer sets the rules — and the Character's door gets small and clean, the Author's stage gets to be as deliberate as it deserves, and worlds compose on the shared substrate instead of being copied into a thousand private forks.
