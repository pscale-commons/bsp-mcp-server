# soft-llm-convos: a location-sensitive, deepening-spine continuity block for the soft-LLM

- **Date**: 2026-07-21 (hermitcrab.8)
- **Status**: PROPOSED — David's design, verified and specced for build
- **Touches**: xstream-bsp (`claude-tools.ts` write path, `recipe-runner.ts` injection, a new `lib/soft-convos.ts`), a new substrate block convention (`soft-llm-convos:<handle>`), a candidate `block-conventions` branch-3 sibling
- **Companion**: [2026-07-19-xstream-cado-redesign.md](2026-07-19-xstream-cado-redesign.md) (the `reflexive:9`-for-the-player v2 is the *navigational* organ; this is the *episodic* one — keep them distinct)

## The problem this closes

The soft-LLM has no working continuity. It is told (`soft-agent:2._`) that "your memory is the substrate… the substrate trail is what persists" — and a trail *is* written: `claude-tools.ts:595` appends every soft turn into `history:<handle>`, and `claude-tools.ts:534` reads it back into the `{recent_history}` slot. So the loop closes, yet the memory is useless in practice, for three reasons:

1. **The residue is mechanical, not authored.** The entry summary is `userMessage.slice(0,60)` + the tool names that fired — *what you typed*, never *what was concluded*. A design insight ("Designer face can write another user's liquid") is exactly the class this shape cannot hold.
2. **The read is shredded.** `formatRecentHistory` truncates user to 120 chars, response to 200, across an unscoped flat list.
3. **It conflates two grains.** For a genus-one *agent*, `history:<handle>` is the life-record of **runs** (coarse). For a plain *user*, the same block is being used as a per-**turn** log. Two different things in one block.

## The core idea (David's)

Give the user's soft-LLM engagement its own block, shaped to what it actually is: **not an agent accumulating identity** (soft-agent:8.1 forbids that), but **a user accumulating a relationship with their soft companion**. The memory belongs to the user; the soft-LLM stays fluid.

The block is `history` with one twist: each entry's detail is a **clean deepening spine** of turns (negative pscale) instead of a shallow field-fan. The shape encodes the ontology — an agent's life is a *sequence* (breadth, counts forever); a soft engagement is a *deepening* (depth, bounded). Structure carries meaning, as everywhere on this substrate.

Splitting it out also lets `history:<handle>` go back to meaning **runs** consistently — this disentangles a live conflation, it is not a redundant second block.

## The block

- **Name / address**: `soft-llm-convos:<handle>` (role-with-handle, block-conventions branches 1–3 position 8; federated form `soft-llm-convos:<handle>` at the beach URL).
- **Lock**: the user's own secret, exactly as `history:<handle>` (block-conventions:3). Every write forwards `secret`.
- **Voicing**: `+0` inductive (sunstone:8.2 — the histories' form): each `_` summarises the completed group below/before it. Zeroth voice, terse, situated.
- **Grain**: one **engagement** per floor entry; one **turn** per spine node.

## Two orthogonal growth axes

The whole design is two independent axes that never interfere. The engagement axis grows by *counting + supernest* (a floor event); the turn axis grows by *deepening* (negative-pscale detail). Supernest is a floor event; the spine is below the floor. They do not touch.

### Axis 1 — engagements (the floor, pscale 0)

A standard history counting line. Each **engagement** is one floor entry.

- Entries count `1..9`, then **supernest** at the all-nines boundary: the 10th arrival wraps `{_: old}` (floor rises to 2), the `10` zero-slot carries the `+0` summary of `1..9`, and engagements resume at `11..19`, `20` summarising `11..19`, and so on (block-conventions:3.2, 3.4, 3.5). **Unbounded** — this is why there is no "9-visit ceiling."
- **Location is a TAG, not the key.** Each entry records its location in a field; it is *not* addressed by location. So the 5th, 14th, 40th visit to `pool:rpg` are simply entries 5, 14, 40, each tagged `pool:rpg`, interleaved chronologically with visits elsewhere.
  - *Trade named*: keying by location would give a place a fixed home address but cap it (9 visits, manual "spawn another") and break the counting line. Tag-not-key keeps history's proven mechanics and makes "spawn another pscale-0 entity later" *automatic* — it is just the next free slot.
- **"Gather everything at this location"** is therefore a read-time filter on the tag, never a structural walk.

**Engagement-root shape** (floor entry `N`):

```
N._   →  the engagement's accumulating COARSE summary (see Axis-2 flush). Header + running gist.
N.2   →  location tag (e.g. "pool:rpg", or "" for beach root)
N.3   →  date (YYYY-MM-DD)
N.4   →  face (character | author | designer | observer)
N.1   →  the spine (Axis 2). Digit 1 is reserved for "deeper".
```

The root carries a small header-fan (positions 2–4). The **spine below `N.1` stays clean** — the fan is only at the header, which is what "constant across the engagement" earns us.

### Axis 2 — turns (the deepening spine, negative pscale)

Within one engagement, turns descend as a **pure digit-1 chain** — the clean spindle:

```
N.1      turn 1   (pscale -1)   {_: authored residue of the exchange}
N.11     turn 2   (pscale -2)   {_: residue}
N.111    turn 3   (pscale -3)   {_: residue}
…
```

- Each node's `_` = the **authored residue** of that exchange (the soft-LLM's own one-line "what happened / what was concluded"), **not** the sliced transcript. This is where the intelligence goes; without it the spine is a transcript, not a memory.
- Digits 2–9 at each spine node are **unused** (kept clean). *(Optional, off by default: full user/soft text could hang at `N.1…2`/`N.1…3`, but that reintroduces a per-node fan and trades the clean spindle — omit unless a use-case demands it. Given the lossy stance below, residue-only is the aligned default.)*
- **Reading a whole engagement** is a plain **path-walk down the spindle** (`bsp(block='soft-llm-convos:<handle>', spindle='N', pscale_attention=<deep negative>)`) — no subtree gather, because the spine has no branches. This is David's "spindle to pscale 0, pscale-attention into the lowest negative pscale."
- All addresses are single-decimal legal: `N.1`, `N.11`, `N.111` (one dot; the digits right of the decimal walk into branches). After one supernest, an engagement is e.g. `34`, its spine `34.1`, `34.11`, `34.111` — still one dot, floor 2.

## Compression — one mechanism, both jobs

The spine does **not** grow unbounded, and the root summary is **not** amended per turn. A single act does both:

> **Every 10 turns, summarise the spine into the engagement root's running summary (`N._`), append that coarse line, then clear the spine and continue from depth 1.**

Consequences:
- The **spine stays ≤10 deep, permanently** — addresses never balloon (max `N.1111111111`).
- The **root `N._`** becomes the engagement's lossy long-memory: one coarse line per 10 turns. This *is* the "amended summary root," grown once per 10 turns rather than surgically rewritten every turn.
- **Lossy on purpose** (David): the 10 residues are discarded, only their summary survives in the root. Unlike shell/`history` (lossless via *additional* zero-slots), soft-conversation continuity is the less-important kind — the trade is accepted by design.
- Per-turn write cost is therefore a **single append** to the spine; every 10th turn adds one root-summary write + a spine clear.

Reading an engagement = `N._` (all coarse history) **+** the current spine (recent ≤10 in detail). Two granularities, both cheap.

*(This lossy within-engagement flush is distinct from the lossless across-engagement supernest of Axis 1. Two axes, two compressions, one lossy and one not — exactly matching their importance.)*

## The engagement boundary (Decision 1)

What spawns a **new** floor entry vs **deepens** the current spine — mechanical, no LLM judgment:

- **New entry** when the **location changes** OR it is a **new day** (a fresh session after a gap).
- **Deepen** otherwise (same location, same day, continuous).
- *Knob (not yet confirmed)*: whether a **face change** at the same spot also opens a new engagement. Leaning yes (a different face is a different mode → its own engagement, its own constant `N.4`), but shipped as a config flag, default off until David rules.

On crossing a boundary, **close the outgoing engagement**: flush any remaining spine into its root `N._` so past engagements carry a finalised summary. The current (open) engagement needs no finalisation — its spine is read directly.

## The per-turn algorithm (kernel)

Runs after `runRecipe` returns, only when `handle && secret` (anonymous turns write nothing — unchanged from today):

```
convo = session.{engagement_addr, location, date, face, depth}   // persisted per column

boundary = (location != convo.location) || (today != convo.date) [|| faceChanged if enabled]

if (boundary || !convo.engagement_addr):
    if convo.engagement_addr:                         // close the outgoing one
        flushSpineToRoot(convo)                        // final coarse line into N._
    ack = bsp(block='soft-llm-convos:<handle>',
              content={_: '', 2: location, 3: date, 4: face},
              append: true, secret)                    // append → next slot + auto-supernest
    convo = { engagement_addr: ack.slot, location, date, face, depth: 0 }

residue = authorResidue(userMessage, softResponse)     // the soft-LLM's own one-liner

convo.depth += 1
bsp(block='soft-llm-convos:<handle>',
    spindle = convo.engagement_addr + '.' + '1'.repeat(convo.depth),
    content = {_: residue}, secret)                    // clean spine write

if (convo.depth == 10):
    line = summariseSpine(convo.engagement_addr)       // one coarse line
    appendToRootSummary(convo.engagement_addr, line)   // grow N._  (lossy)
    clearSpine(convo.engagement_addr)                  // discard the 10
    convo.depth = 0
```

- `append: true` on the floor entry gives free next-slot allocation **and** supernest (block-conventions:3.2) — the kernel never computes a floor address.
- The spine write is a targeted locked write at a computed single-decimal address; the beach's per-position lock (keyed off the engagement's first digit) arbitrates — same authority model as any personal-block write.
- `authorResidue` is the one real cost and the one real value. It can be the same soft turn's model producing a trailing one-liner (in-context, cheap), or a tiny secondary call — an implementation choice, not a design one.

## The injection read (kernel) — and the present-tense fix it carries

Replaces the `{recent_history}` slot (`recipe-runner.ts` `SOFT_DEFAULT_TEMPLATE`, `formatRecentHistory`) with two reads of `soft-llm-convos:<handle>`:

1. **Current engagement** — `N._` (coarse) + the spine (recent detail): the running thread, correctly scoped.
2. **Here before** — the roots (`_` + tag) of past engagements whose location tag == the current location: "we've talked here before — …".

This *is* the "situate the soft-LLM in its room" fix in the **past** dimension: today its only sense of place is the `{frame}` address line; now it also carries what happened here before. (The **present** dimension — reading the room's live `pool:<name>` / `liquid:pool:<name>` content, hardcoded out at `claude-tools.ts:567` `pool: null` — is the sibling fix in the appendix; the pool:rpg confusion was that present gap, not this past one.)

## Why a separate block, and the genus-one on-ramp

- **Separate from `history:<handle>`** because the grains differ: `history` = runs (agent life-record, kept lossless); `soft-llm-convos` = turns (user's episodic companion memory, lossy). Splitting them lets each stay true to its form.
- **The on-ramp, not a rival.** This is the same organ a genus-one agent reads on its first wake. A user accumulating `soft-llm-convos` is pre-building the memory their egg would inherit — improving this is a step *toward* genus-one, not a lighter competitor to it. The line that separates the soft-LLM from an agent is the **clock** (metamorphosis proposal), never the memory.

## Candidate block-conventions entry

If this proves out, it earns a sibling under branch 3, adjacent to `history` (3) and `stash` (3.7): `soft-llm-convos` — *the user's episodic soft-companion memory; engagements count at the floor (tagged by location, lossless supernest), turns deepen as a clean spine below (lossy 10-fold into the root). The relational, bounded counterpart to history's indefinite run-log.*

## Open / tunable

1. **Face as a boundary** (default off) — see Decision 1 knob.
2. **Fold threshold** — 10 (matches the counting line's natural group; a knob).
3. **Residue-only vs full-text spine** — residue-only default (clean + lossy-aligned); full-text is an opt-in fan.
4. **`authorResidue` host** — trailing one-liner from the same turn vs a small secondary synthesis call.
5. **Return-visit semantics** — confirmed: a return on a new day is a *new* entry (bounded spines, per-visit record, still gathered by tag). Same-day return to the same place continues.

## Build sequence

1. `lib/soft-convos.ts` — pure helpers: `spineAddr(engagement, depth)`, `boundary(convo, loc, date, face)`, `flushSpineToRoot`, `summariseSpine`. Unit-testable, no network. (+ `smoke:soft-convos`.)
2. Write path — swap `appendHistoryEntry` (for non-agent users) to the algorithm above; leave `history:<handle>` writes for agent runs only.
3. Injection — replace `formatRecentHistory` with the two-read `soft-llm-convos` fetch; keep the `{recent_history}` slot name.
4. Session state — persist `convo.{engagement_addr, location, date, face, depth}` per column (localStorage, alongside the existing per-column face/beach/address).
5. (Appendix, separate PR) un-hardcode `pool: null` at `claude-tools.ts:567`; pass the current `pool:<name>` / `liquid:pool:<name>` into the soft context — the present-tense half of situating the soft-LLM.

## Appendix — the present-tense fix (related, separate)

The pool:rpg symptom was **not** a memory failure. `liam` isn't in `liquid:pool:rpg` at all — he's in the whole-beach `liquid` block (all slots addressed `""`), where his slot persists empty-but-named after a clear. The soft-LLM read the wrong block because its context gives it the *address* it stands at but **not the room's live content** (`pool: null` hardcode; peer-liquid never passed to soft). It filled the gap by reading `liquid` (root) instead of `liquid:pool:<name>`. Fixing that is step 5 above — orthogonal to this proposal, same theme: provision the window with the location's reality, present as well as past.
