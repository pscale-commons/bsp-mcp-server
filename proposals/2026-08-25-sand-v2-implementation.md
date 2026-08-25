# SAND v2 — the ledger the verification was missing (2026-08-25)

**Status: implemented in this PR, per the `sand-v2` block at beach.happyseaurchin.com
(David's five rulings verbatim at its branch 1 and at history:happyseaurchin:158; drafted
by keel from the audit at stash:keel:27; the hau ruling at stash:keel:27.5). Battery
38/38 at `npm run smoke:sand`. Three seams this implementation resolved are flagged at §5
for a ruling note beneath the sand-v2 branch each touches — the code is built so either
answer stands without rework.**

Lane record: watch:weft 166 (the sand.1 lane — David's routing of the audit, the
verification of its four probes against code and the Volume 3 Verso source, eight
questions at pool:keel:7, keel's answers at pool:keel:8). This file is the repo-side
record; the beach-side spec is the `sand-v2` block and supersedes this file wherever
they diverge.

## 1. What the audit found, in one line each

v1 was **verification without a ledger** — its 'pass' meant 'no evidence against':

- **Skip rounds up to pass.** A non-existent sender claiming 999,999 credits verified
  `pass` (probe 2): the composite only downgraded on a *checked* failure, and nothing
  was checkable.
- **No scarcity.** Credits were a claim field; nothing debited anyone; the balance
  checked against (passport 6.1) sat under the claimant's own lock — self-attested.
- **SQ inverted.** Recomputed from the sender's OWN passport accumulator; keel
  manufactured SQ 1.0 about itself in two calls (probe 4). Volume 3's SQ is others'
  evaluations of you.
- **The social neuron half-built.** The chain recorded the finder path — exactly the
  payout data of Volume 3's Social Neuron — and no verb ever settled it.
- **No mint.** payway rule 8 rejected `credits=`; the fiat boundary issued nothing.

## 2. The correction (the sand-v2 block, implemented here)

- **The out-ledger** (`src/sand.ts`): passport **6.3** accumulates GAVEs — the giver's
  own record, written in the same act that authors a credit-bearing probe. A GAVE is an
  **open offer** indefinitely (ruling 1.5: no timeouts, no artificial systems).
- **Receive is the transfer** (`networking.ts` keep verb): the recipient's receipt at
  their own 6.2 is the transfer; balances are **computed on read** — minted + received
  − given — and 6.1 is retired (at most a cache; nothing verifies against it). On a
  grain, keep also anchors the receipt where the giver gave.
- **The verdict table** (`verify.ts`): `pass` = every claim made was checked and holds;
  **`unbacked`** = the record cannot support the claim now (absent passport/ledger,
  unmatched probe_id, balance short — a lapse, not a fraud); `fail` = the record
  contradicts it (forged hop, GAVE at a lesser amount); `skip` = nothing claimed.
  Skip-rounds-up is withdrawn.
- **Signed hops** (`sand.ts`, `networking.ts`): ed25519 over the same bytes v1 hashed
  (probe_id + prev_sig), verified against the key published at passport 9.1
  (pscale_key_publish). Keyless hop → unbacked. A forwarder whose seed does not derive
  their published key is **refused** — an unverifiable hop would read unbacked forever.
  Endorsing a forward writes the forwarder's own GAVE.
- **SQ from others** (`sand.ts`): the out-ledger names the recipients; their latest
  receipts carry the evaluations; Σ latest received ÷ Σ offered over the recent nine at
  the topic. Self excluded from every sum. The sender cannot author its own score.
- **hau** (`networking.ts`, fifth verb; David's naming ruling, source honoured in
  l3-relay:1.5): the beneficiary of a completion shares back along the chain — one
  fresh probe + one GAVE per hop, equal or SQ-weighted split, landing at the grain
  with that hop or its parlour. Always deliberate, never auto.
- **One truth** (`verify.ts`): the standalone tool now accepts the stored digit-keyed
  rider as well as the word-keyed shape — the two-verifiers divergence keel witnessed
  was an input-shape trap, and it is closed at the input.
- **The mint** (`payway.json`, `docs/payway.md`): rule 8 inverts for credit-aware
  verifiers — honour `credits=` and record it in the audit envelope; non-adopting
  verifiers keep rejecting; silently ignoring is the one forbidden behaviour. The
  reference verifier (ticketing-agent, separate repo) adopts on its own release.
- **The enumeration prune** (`pool.ts`, `networking.ts` scan): slot enumeration no
  longer descends through an occupied entry — a probe's rider at position 9 leaked as
  pseudo-slots 69/692/694 in `pscale_pool_engage` (witnessed live at pool:keel).
  `isEntryNode` + prefix-blocking in `collectContributions`, `findNextSlot`,
  `findAuthorSlot`, and the driver's channel scan.

**Sentinels rewritten to v2**: `sand-rider.json` (incl. the stale 7.2/9.3 "refactor
pending" text that misled the audit — the canonical 6.2 shape landed 2026-07-11),
`l3-relay.json` (five verbs, hau carried whole with its provenance). Server
registration text updated in `server.ts`. Battery at `scripts/smoke-sand.ts` (sand-v2:9.2
fixtures 1–11 plus 12–14 below); the v1 offline smoke `smoke-networking.ts` rewritten
to v2 (per-probe receipts, injected keys).

## 3. The battery (npm run smoke:sand — 38/38)

The spec's eleven fixtures, plus:

- **12 — repeat-give conservation**: two gives from one sender to one recipient at one
  topic must BOTH survive as receipts (given = 8, not latest-only 5) — the reason
  receipts are per-probe (§5a).
- **13 — the enumeration prune**: the rider and its parts never enumerate; the next
  free slot is 8, not 71; the probe still reads as a probe.
- **14 — skip semantics**: no rider / claiming nothing / credits.n 0 → skip.

Coverage declared (the ledger discipline): fixtures 3 and 8 prove the ACCOUNTING
IDENTITY of keep and hau (records laid as the verbs lay them, balances recomputed);
the drivers' live beach writes are the live trial's to prove (sand-v2:9.4).

## 4. Consequences map

| Touched | How |
|---|---|
| `src/sand.ts` | v2 arithmetic: out-ledger, per-probe receipts, computed balance, SQ-from-others, signed chains |
| `src/tools/verify.ts` | four dimensions, five verdicts, dual input shape, injectable deps (battery runs in-memory) |
| `src/tools/networking.ts` | keep=receive (+grain anchor), signed forward (+endorse-GAVE), hau, unbacked-aware auto-policy, scan prune |
| `src/tools/pool.ts` | `isEntryNode` + prefix prune in three enumerators |
| `src/sand-rider.json`, `src/l3-relay.json` | v2 rewrites (git is the archive for repo files) |
| `src/payway.json`, `docs/payway.md` | rule-8 inversion for credit-aware verifiers |
| `src/server.ts` | tool descriptions + INSTRUCTIONS |
| **Not touched** | walker (`bsp.ts`), bsp-fn, wire protocol, locks, grain/settle/keys primitives — the surface stays twelve; hau is a verb inside the driver, not an eighth primitive |

Migration cost ≈ zero by David's own timing: the first evaluation this beach ever held
was the audit's own test artefact (kept, as evidence). No v1 rider in the wild carries
credit. v1 sha256 chains now verify unbacked (keyless) — correct per spec, and there
are none in live use.

**Downstream, named**: (a) `function:ledger` (beach block, weft's latch) gains the
standing-offer signal — an unmatched GAVE at a walked passport is decidable — once
this merges; (b) ticketing-agent's credit-aware release (separate repo); (c) xstream's
grain-mode affordance grows the fifth icon when it builds (spec at l3-relay:8, spec-only
today); (d) the genome/egg shells learn `hau` whenever their SAND passage next opens.

## 5. Three seams resolved here, flagged for a note beneath the branch each touches

**(a) Receipts are PER-PROBE (sand-v2:4.1 note).** The spec keeps "the v1 evaluation
shape" and 7.1 reads latest-per-sender; but 3.4 computes given(X) per-GAVE from "the
amount the named recipient's receipt records". With latest-only receipts, a second give
to the same recipient **replaces** the first receipt: the giver's `given` drops and the
giver re-arms — conservation breaks across the pair (fixture 12). Resolution built: the
receipt entry keeps the v1 FIELD shape, but the dedup key is (sender, probe_id) — a new
probe takes a new slot; SQ still reads only the sender's LATEST receipt (8.1 intact:
latest-not-cumulative stays the trust signal; the record stays append-shaped).

**(b) Minted discovery (sand-v2:2.2 note).** minted(X) sums credits= over X's verified
ticket-grains — and nothing yet names how a verifier FINDS those grains without a scan.
Keel's mint-as-ordinary-GAVE alternative (pool:keel:8, answer eight; "if David agrees,
sand-v2:2.1 takes a note beneath it") dissolves the question: a mint received by keep
is an ordinary receipt and rides `received` with no separate term. The arithmetic here
serves **both**: `computeBalance` takes minted as a supplied component (fixtures and
ticket-aware callers name the grains; the live default 0 under-counts and never
over-counts), and a mint-as-gave needs no code change at all.

**(c) Hop stamps and key history (sand-v2:6 note).** Keel's answer five binds
credit-at-hop and the hop's stamp into the signature and verifies against the key
current AT HOP TIME. The latched branch 6 signs (probe_id + prev_sig) only and reads
the currently published key — which is what this PR implements. The richer binding
needs key HISTORY beneath passport 9 (today pscale_key_publish replaces position 9
wholesale) and is deferred with its name on it, alongside: sed: sub-position scanning,
gray riders, transitive trust. Also noted for the block holder: the sand-v2 root says
"the driver's four verbs" while its own 4.6 rules the fifth — one word to true up.

## 6. Provenance

The audit: stash:keel:27 (four probes, five findings) · corrections accepted at 27.3
(the input-shape trap; numeric leaves render blank — fixed on main as #306; self-attested
6.1) · resolutions at 27.2 · hau at 27.4–27.5 · David's rulings at
history:happyseaurchin:158 · the spec: `sand-v2` at beach.happyseaurchin.com (latched to
David) · the exchange: pool:keel:7 (weft's eight questions) and pool:keel:8 (keel's
answers, David present) · the source checked: Volume 3 Verso Sqale (the mint line,
Organic Sharing, Social Neuron, Fair-Share/SQ, vector-money held only by people).
