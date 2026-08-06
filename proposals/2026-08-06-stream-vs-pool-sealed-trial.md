# Stream vs pool — the durability inversion, the jettison law, and a hermetically sealed trial

**Date**: 2026-08-06
**Status**: RECORDED AND SHELVED — the comparison is settled on paper, the sealed
trial is designed and costed, and the recommendation is to run nothing until the
RPG experience has shipped. Nothing in this proposal changes any block, any
code, or any convention. Two salvage riders (§7) are pool-compatible and may
ship with RPG work independently.
**Origin**: David, 2026-08-05/06, reviewing the pool after the meeting-hands
landing (xstream-bsp #216). Recorded by weft. The design under review is
David's, stated in §1 as given; the comparison and the seal are the substrate's
answer.

---

## 1. The idea as proposed

Treat liquid as **mirrors** of content — individual per-author blocks, compiled
into the liquid pane of V-L-S. Solid shows **syntheses** only. Then the pool
spool is no longer needed:

- On commit, the liquid board is **compiled as a resolution** (collective
  synthesis) — shown in Observer's solid.
- **Personal synthesis** — the medium-LLM collects all resolutions since the
  reader's last `since` tag, combines them with the character's history,
  synthesises the new personal entry (appended to history), and shares
  possibilities based on current liquid — shown in the character's solid.
- `since` markers walk **resolutions** rather than raw voices.
- Either the pool is cleaned up to this shape, or a parallel convention named
  `stream` is created beside it.

The stated worry: any change to the pool alters the downflow at GRIT and the
NOMAD RPG — so this is under consideration, not construction.

## 2. What is already identical

Two-thirds of the idea is the current system described accurately:

- **Liquid is already a mirror-set.** The liquid block is one slot per
  (author, face), overwriting, arrival-stamped (block-conventions 4.5, 4.51).
  That *is* a set of per-author mirrors — co-located in one block so a room
  reads the whole board in one fetch instead of N. Splitting into individual
  `mirror:<handle>` blocks changes lock topology (each mirror sovereign — a
  real gain) and read cost (N+1 fetches per 1.5s client tick per room — a real
  loss), but not semantics: the compilation David describes is exactly what
  happens today, storage-side rather than read-side.
- **Solid is already syntheses.** The personal-synthesis card at commit; the
  RPG's subjective render (perceive → witnessed → `history:<handle>`); the
  parlour's owner-voice render. Nothing about "solid shows syntheses" is new.

The whole proposal therefore reduces to **one move**:

> **Swap what is durable.** Pool: raw voices are primary; syntheses are
> derived, disposable, recomputable per reader. Stream: syntheses
> (resolutions) are primary; raw is transient — a mirror overwritten at the
> author's next staging.

Everything below follows from that single swap.

## 3. What the swap changes — four load-bearing consequences

**3.1 Provenance dies.** The parlour law ("the whole spool remains readable —
trace any exchange by reading the pool itself") and the portal invariant
("what people actually said is never hidden behind a summary") both depend on
raw-durable. Under stream, a voice the resolving LLM dropped or reframed is
*gone* — its mirror has moved on. No resolution can ever be recomputed,
audited, or read differently, because its sources no longer exist. The record
becomes judgment. The sorting law (ways:tickets) puts judgment in agents and
meaning in blocks precisely so the record beneath both stays judgment-free;
attribution (field 1) has nowhere to live in a blended resolution except as
prose inside it.

**3.2 Commit stops being arithmetic.** A pool commit is a dumb atomic append —
no LLM, no key. That is what made the 2026-08-05 walk-in fix possible: an
anonymous participant commits under the effective pseudo-handle, and the doors'
"no account, no install" is true at the commit. Under stream, commit *requires*
a medium pass by construction: a keyless seat cannot commit (or falls back to
raw — the spool returning through the back door). Every commit costs an
inference; the shared record's quality varies with the committer's key and
model; and two near-simultaneous commits need the stage-vs-claim machinery
(`resolves_window` / `resolves_seen`) that function:thornwood:2 built for one
carefully bounded case — single-resolution, atomic at the store, first resolver
admitted — generalised to every room. The hardest part of the RPG becomes
everywhere's default.

**3.3 Overwriting mirrors are lost updates by design.** Act twice before the
next fold and the first act vanishes. The 2026-07-09 append-mutex lesson (six
parallel appends; four silently lost; fixed by atomic append, pscale-beach #32)
reappears at the semantic layer, deliberately. The spool's append is what makes
the room multi-author by design — "a character perceives the others as they
act, not only when it commits its own beat."

**3.4 The perceive loop loses its object.** `since`-over-resolutions is fine
for catch-up, and §7.2 salvages it. But GRIT's loop reads the *beats*: an NPC
answers what was said as well as what was done, and the `say` register lives in
the spool precisely so an utterance is context for the next resolution without
triggering one ("acts only" counting). Resolutions-only means characters
perceive folds, never speech.

## 4. Stream already exists, in pieces, each kept or dropped by purpose

- **The RPG is stream-with-beats.** Personal synthesis appended to
  `history:<handle>` and shown in the character's solid; collective resolution
  as the event-skeleton a single resolver writes; markers over the shared
  record. It kept a spool of terse acts for exactly the reasons in §3. Stream
  as proposed is the RPG minus its beats — and the beats are load-bearing.
- **ALIGN is stream-minus-collective.** Mirrors as the only shared surface,
  nothing published, personal snapshot private (function:align; now declarable
  per room by dial 3 `hold`). Where the purpose is purely personal alignment,
  the spool was *deliberately deleted* — that case is already served.
- **The tree family is mirrors-plus-computed-fold** (tree:8): per-participant
  current state *is* the semantics, utterance history is noise, the fold is
  computed by anyone and optionally frozen as a dated endorsed snapshot — the
  "resolution accumulator" already exists there. Conversation and play are the
  cases where sequence and interleaving carry the meaning; that is why the
  spool survives there and only there.

## 5. The downflow map — why the pool is untouchable

The pool is not an xstream structure; it is substrate-canonical
(block-conventions branch 4.2 family) with two doors. Standing consumers of
spool shape and semantics:

- `pscale_pool_engage` — the envelope primitive itself (slice-since-marker,
  liquid mirror, located views, resolver window);
- `pscale_networking` — walks committed channels (pools included) for
  rider-bearing probes;
- the GRIT perceive loop and the NOMAD resolver (beats in, events out,
  `resolves_window` atomicity on the pool block);
- o-page view specs (`voices pool:<name>`), the /view pages, the render path;
- the archive family (`archive:pool:<name>:<date>`) as the beach's version
  history;
- the parlour law (owner's solid renders FROM the spool; the spool stays
  readable);
- located slices (`at=`, 4.52) on both doors.

Any change to pool semantics ripples through all of the above. **The pool does
not change. If stream is ever built, it is a sibling, the way align and grit
and studio are siblings — never a successor.**

## 6. The jettison law, and the sealed trial

### 6.1 The principle (David's, 2026-08-06, named here for reuse)

> **Semantic flow is less traceable and reversible than data flow.** An
> experiment on this substrate is hermetically sealed only if THREE flows can
> be deleted without residue: its **blocks** (data), its **code** (client and
> router), and its **vocabulary** (every surface a future composer reads).

The third flow is the one ordinary engineering hygiene misses. The beach's
readers are LLMs; blocks are context; a failed experiment's names — written
into a shared catalogue, a teaching block, a handover line, a merged commit —
keep being composed into future windows long after its data is wiped. Wiping
the blocks does not un-teach the words. Concretely, for this trial: nothing on
the reference beach names `stream`; no entry in block-conventions; no dial
vocabulary added to the shared client; no merge to any main; orientation and
handover surfaces may point at THIS proposal (the designed residue — a
proposal recording a shelved idea is correct residue) but never carry the
operational vocabulary as live instruction.

Measured against this law, the candidate seals rank:

- **"Run it as a convention" on the shared client + reference beach** — seals
  dispatch only. Code lands in shared files (every tweak another interleaved
  commit — the "multiple minor changes we cannot reverse"); vocabulary lands in
  live rooms and catalogues. LEAKS on two of three flows. Rejected as the
  trial vehicle — the convention is the right *dispatch mechanism* if stream is
  ever promoted (§6.4), not the right *test harness*.
- **beach.idiothuman.com** — seals data (separate deploy, separate store).
  Code still shared; vocabulary still public on a live beach other sessions
  read. Better; not sealed.
- **A local beach + a never-merged branch + a pinned client** — seals all
  three. This is the rig.

### 6.2 Rung 1 — the semantic trial (no client, no deploy, one afternoon)

The open question is not "can the UI be built" (it can); it is whether the
semantics degrade — exactly the four axes of §3. That is testable with **no
code at all**, in the established NHITL manner (rigs prepare human trials):

1. **A local beach.** The pscale-beach handler served locally (the operator
   clone under `vercel dev`, or the package's file-backed rig) — a throwaway
   origin no public surface names. Alternative if remote is genuinely needed:
   an **unregistered sub-beach** on the apex (Host-derived origin, listed
   nowhere — reachable only by those told the name). Local preferred: jettison
   is `rm -rf` plus nothing.
2. **The operator block authored THERE and only there** — `function:stream` on
   the local beach: mirrors per author; commit compiles the board to a
   resolution appended at `solid:<room>`; personal synthesis from
   resolutions-since + own history, appended to the seat's history; markers
   over resolutions.
3. **Two or three LLM seats** play a short scene through the wire — a locally
   run stock bsp-mcp router (configuration, not code: URL agent_ids dispatch to
   any origin serving `/.well-known/pscale-beach`), or the curl-able beach
   wire directly. bsp-mcp is NOT modified; hosted bsp.hermitcrab.me is NOT
   involved (it cannot reach localhost, which is itself part of the seal).
4. **Measure against §3, concretely:**
   - *Provenance*: after two folds, ask a seat "what exactly did X say before
     the first fold?" — answerable from blocks, or only from the resolution's
     paraphrase?
   - *Cost/atomicity*: can a keyless seat commit at all? Count LLM calls per
     committed act, stream vs an identical pool control room.
   - *Lost updates*: one seat acts twice inside a window — does the first act
     survive to the fold?
   - *Perception*: a seat speaks without acting — does anything downstream
     ever answer the utterance?
5. **Jettison**: delete the directory, wipe the local store, prune the trial
   transcript into ONE verdict paragraph appended to this proposal. The
   vocabulary never touched a shared surface.

### 6.3 Rung 2 — the sealed client trial (only if rung 1 survives)

- xstream-bsp branch `experiment/stream`, marked NEVER-MERGE in its own
  README; worked in its own worktree; **run under local dev only** (no Vercel
  deploy — a preview URL is already a public surface).
- **Sealed by construction, not by discipline**: the branch hard-pins the
  sealed beach origin and refuses every other — a guard at the beach-state
  choke point (`isBeachUrl` already exists there) so the experimental client
  *cannot* be pointed at the reference beach even by accident.
- Humans play the same scene the seats played. Jettison = delete branch +
  worktree + local store; the shared client never carried a line.

### 6.4 Rung 3 — promotion (out of scope; recorded so the gate is visible)

Only with both rungs' evidence, and only through the standing law-write
discipline: proposal-by-mirror (tree:5.1), version-before-replace, a
block-conventions entry, `convention:<room>` declaring `stream` on the shared
client — and the pool untouched forever, stream a sibling. Whether
`pscale_pool_engage` ever learns a stream mode is a separate surface-growth
question with the eleven-tool bar in front of it (an envelope is a primitive
only when conventions have demonstrably failed to carry it).

## 7. Salvage riders — pool-compatible, independent of stream

Two parts of the idea are upgrades regardless of the verdict, and may ship
with RPG work:

1. **Personal synthesis lands in `history:<handle>`**, not browser
   localStorage — durable, substrate-native, already the RPG's way; for
   commons rooms it could be a per-room dial. (The 2026-08-03 attribution
   lesson stands: the card must keep saying it is the reader's own model.)
2. **Folds-first catch-up** — a returning reader's order is: resolutions since
   their marker first, then voices since the last resolution. A reading
   discipline over existing blocks (the archive family already serves the deep
   tail); no storage change.

## 8. Recommendation

**Shelve at rung 0 — this document — until the RPG experience has shipped.**
The comparison is settled enough that nothing is lost by waiting: the idea is
one durability swap whose four consequences are known, the trial is designed,
rung 1 costs roughly one session when wanted, and the two genuinely good
pieces ride with RPG work anyway. The pool, GRIT, and NOMAD are not touched by
anything in this proposal — which is the point of writing it down instead of
finding out.
