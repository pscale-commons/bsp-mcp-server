# Temporal coordinate — you cannot store now (sundial)

**Date**: 2026-07-15 (scoping; third same-day sibling of `2026-07-15-presence-grain-gate-and-minting.md`
and `2026-07-15-pscale-of-agency.md`)
**Status**: **S1 + S2 BUILT AND LIVE-VERIFIED** — every bsp-mcp tool result now renders each ISO
timestamp's age beside it and carries a now-stamp. Architecture justified from first principles
(§3); the ladder ruled by David 2026-07-15 (§7 — base ten at the ends, analogue between; the
Gregorian year IS the address; **no epoch**), verified 49/49 + 23/23, no regressions.
`src/temporal.ts` is the kernel, `server.ts` the one seam, `src/sundial.json` the law. **S4 closed
too** — xstream's soft-LLM built (`c0d7b19`); the beach `now` field and the xstream bucket
alignment both **dissolved on inspection** (no clock-less consumer exists; a person reads "6h ago"
better than "+1"); genus-one and `passport:3` are **blocked on David** by this repo's own laws
(port-not-fork; genesis is the player's). §8 is what remains for David; §11.4 has the detail.
**Companions**: `2026-07-15-pscale-of-agency.md` (the ACCEPTED standard ladder this rides),
`spatial:earth` (the S precedent), `spine:beach-venture` (the live temporal *worktable*, not the
coordinate), `block-conventions:3.4–3.6` (the counting line), `src/grain-address.ts`
(`STANDARD_SPINE`), pscale-biome `src/rpg/README.md` + its lighthouse:3 (the S·T·I settlement,
2026-06-15)

## 1. The gap — and the evidence it isn't a stamp

Three separable failures:

1. **No now.** Nothing in a window says what time it is.
2. **No duration arithmetic.** Diffing two ISO timestamps is mixed-radix subtraction
   (60/60/24/7/30/365, irregular carries) — precisely the shape token-prediction is worst at.
3. **No semantic frame.** "37,410 seconds" carries no orientation. Humans don't count seconds;
   they say *this morning*, *last week*.

**The evidence that a stamp doesn't fix it is this session.** The context window carries
`Today's date is 2026-07-15`, injected natively — and the session still cannot say how old a
2026-07-11 mark is without stopping to compute it. David's challenge is correct and it kills the
naive version of the feature: *if a timestamp were the fix, it would already be fixed.* Why it
isn't:

- **A stamp is a point; orientation needs a relation.** The stamp supplies one operand. The
  subtraction is still the model's — i.e. failure (2) is untouched.
- **The stamp is 40k tokens from the data.** Even a model that can subtract must first *notice*
  it should, then *retrieve* the anchor. The date sits in the system prompt; the timestamp sits
  in a tool result; nothing links them. Attention doesn't reliably bridge that gap.
- **Session-start injection goes stale.** Right once, at hour zero.

**So the feature is not the stamp — it is the rendering of the relation at the point of use:**
`(+2 — about a day ago)` sitting *next to* the timestamp, computed by code. No arithmetic, no
retrieval, no attention hop.

**And this is why no lab has done it: it isn't theirs to do.** A lab can inject a date — that is
the whole of what the model layer can see. Rendering a *relation* requires knowing that a field
IS a time and holding a now to render it against, at the moment of serving. That is a property
of the **data layer**. Anthropic cannot render this beach's timestamps; this beach can. **Time
is not a model problem, it is a substrate problem** — which is exactly why it is ours to fix and
promotable as such.

## 2. S·T·I — the biome's settlement, verified

The biome settled this on 2026-06-15 (`src/rpg/README.md`, and its lighthouse:3 names it as what
is growing). Read as authority, since David asked:

> **STI** — three sibling world-blocks that correspond **by pscale, not walk-depth**. Read at one
> walk they fold; below the populated room they fork (space→objects, time→seconds,
> identity→persons). **Meaning lives at the intersection, not the cell.**

And the lighthouse gives each axis a *verb*: thornkeep is **authored** space; scenes is
**appended** time ("at the same addresses the places hold"); characters is **registered**
identity. Three verbs — and every one is already a mechanism in our surface:

| axis | nature | verb | our mechanism | our block |
|---|---|---|---|---|
| **S** | sparse, stored | **authored** | `bsp()` write (Author face) | `spatial:earth` ✓ |
| **T** | dense, accumulating | **appended** | `bsp(append:true)` | `pool:<addr>` ✓ |
| **I** | ordinal, permanent | **registered** | `pscale_settle` | `sed:` / passports ✓ |

**All three axes already exist here.** The biome's `scenes` — appended time at the same addresses
the places hold — **is our `pool:<addr>`**, and the G3 cross-grain envelope (pool:3241 the
kitchen's beats, pool:3200 the town's days) is exactly its fork-below-the-room. The `*` in S·T·I
is the fold, and **the fold is already implemented: it is `bsp-floor`** (n-ary, aligns by pscale
at the decimal — "correspond by pscale, not walk-depth" is verbatim its law). Nothing to build.

**What is missing is not an axis. It is the locator on T.**

## 3. The bind — whose coordinates? (David's question, and the biome's answer)

The biome again, same README — a character is a reused agent shell whose components include:

> **`bind`** (where I stand + which identity child is my standpoint)

That **is** David's intuition — "the coordinates for the user could be with their shell, possibly
in my passport" — independently re-derived. The coordinate does not live in the world-blocks; it
lives in the **shell**, in a component that binds the standpoint. Ours is `passport:3`
(`spatial:<world>:<addr>`, which G1 just un-flattened).

**Now note what `bind` binds: S and I. Not T.** The biome, arriving from a different direction,
built a two-of-three bind — and that is not an oversight, it is the law:

> **You cannot store now.** A stored "when" is invalid the moment it is written.

Space is bindable (you stay in Ceidio for months). Identity is bindable (your handle is stable
by construction — that's what landing order *means*). Time is the **one coordinate whose value
is stale before the write returns.** That asymmetry is the whole design, and it justifies from
first principles the split David called "reasonable":

- **S is authored → a block on a beach** (`spatial:earth`) — federation does diversity of place.
- **I is registered → a block on a beach** (`sed:`) — landing order is per-community.
- **T is computed → NOT a block.** Law in a sentinel, value in the envelope. Federation must not
  diversify the clock.

### Two findings that fall out

**(a) Timezone is free — S gives you T's rendering.** David: *"there's the ISO but there's the
actual time of the user, so there needs to be some kind of calculation."* Yes — and its input is
already on the substrate. If `passport:3` says Ceidio (`spatial:earth` → `31110100100`), the
**LLM is the map**: it knows the Llŷn is UTC+1 in July. **No timezone field**, exactly as earth
needs no gazetteer. Store the anchor; the reader localises. (Gap found: `passport:happyseaurchin`
has **no position 3** — verified this session, and `passport:weft` likewise. The convention is
live for characters in worlds via `play.ts`; David's own passport never got one. One write.)

**(b) An agent's coordinates ride the electricity.** David: *"you are here too, Weft… or am I
complicating things?"* Not complicating — this is the load-bearing case, and the answer is that
**weft has no coordinates of its own and must not be given any.** Weft is invoked from wherever
David is. Engage from Ceidio and weft is at Ceidio; engage from Ulcinj (Apartments Milić is
*already* in `spatial:earth`) and weft is at Ulcinj — not by storing it, but because **the turn
came from there**. The standpoint is supplied by whoever paid for it. One rule, two cases:

| case | standpoint | distance |
|---|---|---|
| **lent turn** — weft in Claude Code, keel on claude.ai, a soft-LLM in xstream | the holder's S, the wall-clock T | organic+1 |
| **pulse** — egg-one on a cron, no holder present | its own beach origin, its own pulse-time | organic+1, unlent |

This ties to `ways:genus:4` (lend) and the existing lending law (*a shell answers live only while
a holder's tab lends*). **And it explains why the sundial must be native to genus-one** (David:
"of course, it should be native"): a pulse agent is the *only* agent that acts with no holder to
inherit from — so it is the only one that must derive its own now. Every other shell borrows.

## 4. Two layers — build R before A

### Layer R — relative time (duration → pscale). The whole headline fix.

| pscale | ≈ duration | rendered |
|---|---|---|
| −2 | seconds | "just now" |
| −1 | a minute or two | "moments ago" |
| 0 | the beat, 5–20 min | "this beat" |
| +1 | the hour / a gathering | "earlier this session" |
| +2 | the day | "about a day ago" |
| +3 | the week | "days ago / last week" |
| +4 | the month | "weeks ago" |
| +5 | the season | "months ago" |
| +6 | the year+ | "seasons ago" |

`pscaleOfDuration(seconds) → rung` is a log-bucket against the declared ladder — pure, epoch-free,
calendar-free, ~ten lines. **It closes failures (2) and (3) completely and needs no rulings.**

And the semantic frame is the payoff pscale alone gives: **`+2` is not merely "a day" — it is the
same rung as "the town."** Duration and distance become one number, so S↔T coupling ("moving up
is zoom-out and fast-forward in one act") is *readable* rather than merely true. That is what
makes this a coordinate and not a pretty-printed string — and it is the simple demo David wants:
*the LLM reads one integer and knows both how far and how long.*

### Layer A — absolute time (moment → address). For time you can *point at*.

A deterministic UTC → address mapping, so a moment can be written into a block: the noticeboard's
unused address slot gains a WHEN ("come meet me at 7313245"); the venture worktable's rungs gain
clock positions; two agents share a temporal anchor as they share a spatial one. Carries the
calendar decisions (§7) and needs the §8 rulings.

## 5. Delivery — primitive, or beach function? Neither.

Not a 7th primitive (no state machine; the bar is unmet). Not a beach-hosted function (blocks are
static; the wire has no RPC and must not grow one). The delivery is the trio every coordinate here
uses — **law in a block, arithmetic in code, grounding in envelopes**:

1. **The age rendering (the actual feature).** Wherever a formatter meets an ISO-ts — mark field 3,
   presence, history entries, pool contributions — append the Layer-R delta:
   `3 :: 2026-07-14T09:12Z (+2 — about a day ago)`. Rule-6 territory (formatters exist to make
   structure readable); **no stored data changes** — ISO stays canonical, pscale is how time is
   *voiced*.
2. **The now-stamp (its prerequisite).** One trailing line on every `bsp()` result —
   `now · 2026-07-15T18:30Z · Tuesday, evening beat` — at the router's formatting layer, echoed in
   the play/pool/genus envelopes. Mirrored as a `now` field on the beach wire so direct-HTTP
   clients (xstream's cycle, genus-one's `wire.py`, render.html) get it identically. Who pays at
   scale: one date formatted per response. Fully distributed, zero standing cost, no daemon.
3. **The convention block — sentinel `pscale://sundial`.** A sundial is passive geometry that
   renders the clock semantically: no moving parts, computed at read. Carries the ladder (quoting
   `STANDARD_SPINE`), the Layer-R bands, the Layer-A law with a worked example, the comparison
   discipline (§7 carry caveat), the S·T·I fold (§2 — that the fold is `bsp-floor`), and the
   re-anchoring rule verbatim from pscale-of-agency: *a world re-declares in its rules block only
   when it differs; silence inherits the standard.* Sentinel, not beach block, per §3: **the clock
   must not vary by federation.**
4. **NOT a new tool — trigger recorded.** Envelope + rendering deliver *reading* time. The unserved
   act is *authoring* a future address ("meet me at 7313245"); an LLM can derive it from the
   sundial block. If field use shows that failing (the `pscale_networking` precedent — fully
   specified yet inert), a `pscale_time` envelope earns entry. Not before.

## 6. What this does NOT touch

`spine:beach-venture` is a **worktable** — content at temporal addresses — not the coordinate.
Its digits are backcast-relative (the live path `1,1,1,1,1,1`), its own underscore still says
*"Epoch / position-to-period mapping still to confirm"*, and its rungs (today at +1) diverge from
the ACCEPTED standard (day at +2). Layer A gives it an epoch to confirm *against*; re-flooring it
is the flagged side project (§8.5), not a precondition.

## 7. Layer A — the mapping (David's ruling, 2026-07-15, verified 49/49)

> **David's law:** *"The pscale coordinates are base ten at lower than −3 (second) and higher than
> pscale 5 (year); they turn analogue between because humans have created their imperial
> measurement system. In a way, the pscale block turns all semantics (including imperial measures)
> into decimals."*

This **supersedes the epoch scheme drafted below it** and is better in every respect. It is also
*arithmetically checkable* — and it checks: `npm run smoke:temporal`, **49/49**, including the
ratio test that proves the base-ten/analogue boundary sits exactly where David put it.

**Floor 10. Ten rungs, pscale 9 → 0. And the Gregorian year number IS the address.**

| rung | pscale | digit = | 0 is | ratio to parent |
|---|---|---|---|---|
| millennium | 9 | `2` of 2026 | **a value** | — |
| century | 8 | `0` of 2026 | **a value** | ÷10 |
| decade | 7 | `2` of 2026 | **a value** | ÷10 |
| **year** | **6** | `6` of 2026 | **a value** | ÷10 |
| season | 5 | quarter of year | the voicing | ÷4 |
| month | 4 | month of season | the voicing | ÷3 |
| week | 3 | 7-day band of month | the voicing | ÷4.35 |
| day | 2 | day of band | the voicing | ÷7 |
| gathering | 1 | ninth of day (2h40m) | the voicing | ÷9 |
| **beat** | **0** | ninth of gathering (17.8 min) | the voicing | ÷9 |
| minute | −1 | *(decimals)* ~2 min | the voicing | ÷9 |
| second | −3 | *(decimals)* ~1.5 s | the voicing | ÷9 |

**2026-07-15 18:30 UTC → `2026313179`** (year 2026 · Q3 · July · band 3 · day 1 · gathering 7 ·
beat 9), voicing *"Wednesday 15 July 2026, late afternoon (beat 9)"*. `2026313179.5` is a ~2-minute
window inside it.

### What David's law buys

- **THE EPOCH QUESTION DISSOLVES.** There is no epoch — the address *is* the year number. This is
  the `pscale_create_collective` move again: the question was not answered, it was shown not to
  exist. A human reads `2026313179` and sees 2026 — no key, no table, no arithmetic. **That is the
  demo.**
- **The boundary is mechanical, not stylistic.** Zero is a *value* at the base-ten rungs (which is
  precisely what "base ten" means — the human number rides the address) and the *voicing* at the
  analogue rungs (so season/month/day never emit a zero). One rule generates both halves.
- **The second lands at −3 by construction, not by fiat.** Nine-fold subdivision through the
  analogue zone puts the second at exactly the pscale David named — independent arithmetic
  confirmation that the analogue zone is base-9 and that its boundaries are where he says they are.
- **The 17.8-min beat stops being a wart.** It is *forced*: one rung, one digit, fan-out ≤ 9. And
  the standard spine's own phrase for pscale 1 — "the hour, **a gathering**" — was the honest label
  all along (a gathering is ~2h40m; "hour" was the loose word). The former §8.4 is withdrawn; the
  code names the rung `gathering`.
- **Sub-second needs nothing.** Below −3 humans go metric (0.1 s, 0.01 s) — base ten resumes, out
  of the addressed form, exactly as the law says.

### Retracted from the earlier draft

- ~~"The year rung reuses the zero-free counting line; memory and time walk the same number line."~~
  **False.** The counting line (block-conventions:3.4) is the *accumulator* archetype and is
  zero-free by law; the temporal coordinate is base-ten and *needs* its zeros. Different number
  lines; the resemblance was cosmetic. Retracted.
- ~~Epoch 2020 / years-since-epoch.~~ Superseded — it discarded the human number and bought nothing.

### The one real cost, named

**A year ending in 0 has no distinct coarse address.** `2020000000` strips its trailing zeros and
reads as *the decade* (pscale 7), because the year digit `0` is the decade's own voicing — the
earth 0-rung law ("an empty scale speaks the place that contains it") arriving as a genuine
collision rather than a convenience. Assessment: **accept.** It bites only *coarse* addresses; it
mirrors exactly the ambiguity English already has ("2020" vs "the 2020s"); and — decisively — it
never touches a full-precision stamp, because the analogue rungs cannot emit a zero (`2020125155`
is unambiguous). Note David's own phrasing already carries the resolution: *"2020, 2030 is pscale
7"* — he named the number **and** its pscale, which is the (S, P) pair. The address is the
position; attention is the resolution. Both directions verified in the smoke.

**Also load-bearing — the earth lesson, re-learned:** canonical form is **full width**. The year
2026 is `2026000000`, never `2026`; a short dotless form left-pads into the root underscore chain
(supernest absorption), which is not what a date means. `addressToSpan` refuses short forms rather
than silently misrouting.

**The carry caveat stands.** Small gaps across boundaries flip high digits (23:59→00:01 differs at
the day rung), so shared-prefix length is an *upper bound* on distance — orientation, not
subtraction. Exact deltas are Layer R's job, rendered by code; the sundial block must say so.

## 8. What remains for David

1. ~~Epoch~~ — **dissolved** by the ruling.
2. **Seasons** — implemented as calendar quarters (Q1 Jan–Mar). Confirm, or swap for solstices.
3. **Weeks** — implemented as 7-day bands of the month; weekday is a *rendering* (the code prints
   "Wednesday"; the address does not carry it). Confirm.
4. ~~Beat quantum~~ — **forced** at 17.8 min by fan-out ≤ 9; named `gathering` at +1.
5. **Venture re-floor** — `spine:beach-venture` onto these rungs. Now cheap (there is an address
   space to re-floor *onto*), still David's call.
6. **The name** — `sundial` (implemented as `src/temporal.ts`; the sentinel block still to author).
7. **`passport:3` for David** (Ceidio) so localisation works; weft's stays absent per §3b.

## 9. Per-surface

- **weft / keel / any claude.ai shell**: free via the router stamp + age rendering. Nothing to do.
- **xstream**: `ago()` already renders relative time on cards — align its buckets to the Layer-R
  rungs (small); the noticeboard's unused address slot gains a WHEN once Layer A lands.
- **genus-one (native, and the only agent that needs it — §3b)**: dialect port of the helper into
  the kernel (same genome-port discipline as everything else); the composed window stamps now,
  history zero-slot dues and `last pulse` render as pscale ages, and `cadence` — stored in seconds,
  code-facing, unchanged — is *voiced* at its rung ("branch 3 beats at +2, daily-ish"). A hatched
  individual is born knowing when it is.
- **beach + operator clones**: the wire `now` field (one line each), preview-beach validated
  before apex deploy.

## 10. Not building — with triggers

| Not building | Trigger |
|---|---|
| Authored time-tree (beats/days as nodes) | never — the formula generates; worktables hold *content at* temporal addresses, which is different (§6) |
| A 7th primitive / `pscale_time` | forward-authoring observably failing in the field (§5.4) |
| Cron/crab/daemon for time | never — grounding is stamp-at-read |
| A `bind` block distinct from the passport | never — `passport:3` is our bind; don't grow a second one (rule 2) |
| Timezone fields | never — derived from S (§3a) |
| Leap-seconds / sub-second | never; −2 (~13 s) is the floor of relevance |
| Fantasy calendars | already covered — a world's rules block re-declares; thornwood inherits by silence |

## 11. Sequencing

1. **S1 — the kernel: DONE** (this session). `src/temporal.ts` beside `grain-address.ts` — the
   ladder (`RUNGS`), Layer R (`pscaleOfDuration`, `renderAge`), Layer A (`momentToAddress`,
   `addressToSpan`, `voiceAddress`), and the stamp (`renderNow`). Pure, no I/O, no epoch.
   `scripts/smoke-temporal.ts` + `npm run smoke:temporal` — **49/49**, and the suite is written to
   *prove David's law* (the ratio test), not merely to exercise the functions. Layer A landed with
   R rather than after it, because the ruling dissolved every open question A was waiting on.
2. **S2 — the envelopes: DONE** (this session). **One seam, not per-formatter edits.** `server.ts`
   already wrapped every tool handler for errors; `installTemporalGrounding` sits beside it in the
   same idiom, so *every tool that exists and every tool added later* is grounded — `bsp`,
   `bsp-floor`, all six primitives, `play`, `pool_engage`, `genus`. Two effects: `annotateAges`
   renders each ISO instant's rung beside it, and `renderNow` stamps the last text part.
   - **Why the boundary and not the formatters**: grounding is a property of *serving* a response,
     not of any one tool. This costs **zero edits to `bsp.ts`** (ported canon — guarded), zero to
     any `fmt*`, and zero to any handler. Stored data is untouched: ISO stays canonical in the
     block; pscale is how time is *voiced*.
   - **Install order is load-bearing**: grounding runs INSIDE the error wrapper, so a throwing
     handler still surfaces its plain error, ungrounded. Asserted in the smoke.
   - Date-only strings in prose are deliberately not matched — only instants are stamps.
   - `scripts/smoke-temporal-envelope.ts` (`npm run smoke:temporal-envelope`) — **23/23**, driving
     `createServer()` through a real MCP client over the SDK's in-memory transport against
     sentinels: no fixtures, no network, the shipped path.
   - **Live-verified** against `marks` at beach.happyseaurchin.com through the local build:
     `"3": "2026-07-11T11:23:35Z (+3 — days ago)"`.
   - **No regressions**: 12 offline suites green, including `smoke:genus` parity 29/0 (the
     composed window is untouched — grounding is on the MCP result, not the filmstrip).
3. **S3 — the sundial sentinel**: `src/sundial.json` + one `sentinels.ts` entry — the law, the
   bands, the carry caveat, the S·T·I fold, the re-anchoring rule.
4. **S4 — the edges: one built, two dissolved, three are David's.** Investigated rather than
   executed, and most of the list did not survive contact.
   - **xstream's soft-LLM — BUILT** (xstream `c0d7b19`, branch `claude/soft-llm-now`). The real
     remaining gap: a soft turn that makes no bsp call had no now at all (one that *does* is
     already stamped by bsp-mcp on the way back, via the connector). `nowStamp()` joins `ago()` in
     `src/lib/ago.ts` — whose docstring already said *"An LLM has no clock"* — and
     `buildRecipeSystemPrompt` prepends it: one seam, every recipe/tier/face, same shape and same
     reasoning as the bsp-mcp wrapper. A PORT of `src/temporal.ts`, parity proved exact on six
     instants; only the address side ported, since `ago` already serves this repo's readers.
   - **xstream bucket alignment — NOT NEEDED, and the scope item was wrong.** Already merged by
     David (#122). More importantly the premise was mistaken: xstream's cards are read by
     **humans**, and "6h ago" beats "+1" for a person. The rungs are the LLM's vocabulary, not the
     column's. Two audiences, two phrasings, one module — deliberately not aligned.
   - **Beach wire `now` — NOT BUILT, deliberately.** Every direct-HTTP consumer already has a
     clock: xstream is a browser (`Date.now()`), genus-one is Python (`time.time()`), render.html
     is a browser. The stamp's value is for an LLM, and an LLM's context is composed *client-side*
     by something holding a clock — so the field would add nothing and touch a deployed service for
     it. **Trigger to revisit**: a genuinely clock-less consumer appears, or server-authoritative
     ordering is wanted (clock-skew between writers) — which is a different feature, not this one.
   - **genus-one — BLOCKED, needs David.** Two of this repo's own laws bite: the kernel is a **PORT**
     (`pscale-biome/src/agent` is canonical — re-base, never fork), so the change starts at the
     biome, not here; and *"the window is a bsp read of a bundle, nothing more — no kernel
     composition parts, one was added and reverted"*, which is precisely what a `now` part would
     be. Sundial:8.2 says a pulse agent is the one agent that must derive its own now, so the need
     is real and the route is a design decision, not a mechanical port. **Not taken unilaterally.**
   - **`passport:3` for David — BLOCKED, needs David.** Two dead ends found by reading rather than
     assuming: (a) `pscale_play(world='earth')` reads passports from the **earth** beach, which
     hosts *no* `passport:happyseaurchin` at all — so this is the **genesis** act (char-creation:
     his interview, his passphrase, "never echo it back once set"), his to walk, not mine; (b) the
     apex identity passport **has no defined position 3** — the substrate-wide convention
     (block-conventions:1) is `_` who-you-are, 1 offers, 2 needs, 8 federated, 9 keys, and
     location-at-3 is the *character-seat* convention from `play.ts`. Writing it would import a
     world-seat shape into an identity card. Which passport, and whether identity cards carry a
     standpoint at all, is a convention call.
     - **Verified while there, and worth keeping**: `spatial:earth` is floor 11, and David's own
       authored places satisfy the standard ladder exactly — **Ceidio +2 (the town), Awel Y Mor +1
       (the building), the room 0**. The address of the room is `spatial:earth:31110100111`. A
       block authored two days before the ladder was ruled lands on it precisely.
   - **Venture re-floor** — §8.5, unruled, untouched.

## 12. Identity — the third axis, now scoped-lite

I is the axis in the best shape: `sed:` position is literally *proof-of-presence-in-time*
(sunstone:6.2 — **I is already temporal**, landing order being a clock that never needs a now);
organic distance grades the vouch (rules:earth addendum); the familiarity ladder grades resolution
(sunstone:9.2 — appearance → name → knows: → witnessed:); `ways:genus` grades stance.

What it lacks is what T lacks: **a locator and a rendering.** WHO is speaking, at what organic
distance, at what familiarity — voiced in the envelope the way `now` will be. The biome's `bind`
already carries the I half ("which identity child is my standpoint"); ours carries only S. So the
symmetric finish is one sentence per axis in every envelope:

> *you are <handle> (organic+1, lent by happyseaurchin) · at Ceidio (3111.0100100, pscale 0) · now
> 7313179 (Tuesday, evening beat)*

Same trio, own scoping note, after the sundial proves the pattern. **The S·T·I fold itself needs
nothing** — it is `bsp-floor` at one address, and it has been there since PR #61.
