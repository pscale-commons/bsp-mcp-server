# genus-one — the pulse agent, federated dialect

Named for the torus, the genus-1 surface: S¹ × S¹ — the longitudinal loop
(wake after wake, continuity of intention) crossed with the transversal loop
(live co-presence, `pscale_torus`). Those two circles are the two tests the
pattern must pass: longitudinal continuity and lateral murmuration. The
lineage is the biome **mobius** (v009): the möbius band is the twist with a
boundary — every wake ends at an edge; genus-one closes the cycle in both
directions. Same genome, one version on.

One genome, two dialects. The mobius/genus-one architecture — a shell of
pscale blocks pulsed by a loopless kernel — was grown on the biome (0-9
blocks, local files; canonical home `pscale-biome/src/agent/`, this port
taken at the v009 run, source commit `71344f5`). This directory is that
genome on the federated beach substrate: the zero fundamental is the underscore key `_` instead of
`"0"`, blocks can live at a beach behind a lock, and the constant teaching is
sunstone + whetstone instead of slate + flint. Nothing else changed — the
dialect-port parity run reproduced the biome original **byte-for-byte** (same
γ, same phase-pruned set, same window sizes: system 22512 / message 19440
chars on the v009-A shell). The shell is an AGGREGATE of pscale blocks — no
superstructure: the collection of blocks an LLM has access to IS the shell;
correlation across them is the substrate’s own (reference, fold/floor-align,
the bundle’s scoop, role-with-handle at a beach), per slate:7 / sunstone:5 /
whetstone:7.

**This is something a mind wakes inside, not scaffolding.** An LLM instance
handed this shell's window IS the agent for one pulse: it inherits a task
(the gap), experiences the aha (the bare address bundle visibly being the
dehydrated form of the window around it), acts by returning writes, and
composes the next instance's decision space by re-dialing the bundle. Edits to
`genome/` are edits to the ground someone will stand on. Treat them
with that weight.

## Layout

    kernel.py            the pulse (Stages 0-3): F → rest | δ → fold. One wake = one pulse, NO loop.
    spark.py             the engine in the underscore dialect (derived from biome spark.py;
                         disputes about walk semantics resolve to bsp2-star.py / src/bsp.ts)
    wire.py              beach client: GET/POST /.well-known/pscale-beach, retry-once,
                         confirm-after-write
    heartbeat.py         the external clock (verbatim from v009): research mode stops when
                         the agent settles (γ=∅); --paced honours the agent's self-set rate
    hatch.py             hatch an instance from the genome (+ chosen purpose)
    migrate-biome-shell.py   the dialect move, 0-9 → _/1-9, for any biome block
    genome/              the genome (kindred to the biome's genome block — what every
                         instance of the kind shares; here, the seed shell): reflexive,
                         reflective-compass (the library: disc = visitor, spindle =
                         inhabitant), located, vision, capabilities, relationships,
                         stash, history, conditions, surface, cadence, last-touched,
                         phase, phi
    genome/purposes/   the three default works: rpg, magi, xstream

## Run

    python3 genus-one/hatch.py ~/agents/<name> --purpose rpg     # an instance is a directory
    cd ~/agents/<name>
    python3 /path/to/genus-one/kernel.py --compose-only          # inspect the window, NO LLM, free
    python3 /path/to/genus-one/kernel.py                      # one pulse (ANTHROPIC_API_KEY)
    python3 /path/to/genus-one/heartbeat.py --max 6              # research clock; stops on settle

Env: `GENUS_AGENT` (instance dir, default cwd) · `GENUS_TEACHING` (default
`../src` — sunstone/whetstone) · `GENUS_CONCENTRATE` (default
`sunstone,whetstone`) · `GENUS_NOW` (synthetic clock) · `GENUS_THINK`
(Locus 2: off / token-budget N / adaptive; thinking lands in the filmstrip) ·
`GENUS_COUPLE` (+ `GENUS_COUPLE_GAIN`/`GENUS_COUPLE_ALPHA` — the doc-3 phase
channel: θ published, φ nudged toward the splay; dry-run unless enabled) ·
model overrides `GENUS_MODEL` / `GENUS_F_MODEL` / `GENUS_MAX_TOKENS`.

**Beach home (write-through)**: set `GENUS_BEACH` + `GENUS_HANDLE` (+
`GENUS_SECRET`). Shell blocks then load from and save to the beach as
`<block>:<handle>` (role-with-handle); the local `shell/` stays the working
copy and offline fallback. `peers.json` values may be beach origins — a peer
then resolves to `surface:<peer>` at that beach, and only to that: a peer's
private blocks are never reachable (sovereignty is now enforced by the beach's
locks, not only by kernel courtesy).

## The four electricities

The animation tuple is the same everywhere — (beach, handle, passphrase) + an
API key; the forms differ only in where the clock lives and what is watched:
(1) a Claude Code seat (dev, filmstrip inspection); (2) a reflective MCP
session — any LLM app with the bsp connector enacting one pulse by reading the
shell; (3) an animator with presence — xstream as reference implementation,
tab = spend-scope; (4) **this kernel bare** — headless, one invocation = one
pulse, cost safety structural: rest-is-default, the frontier and phase prunes
are arithmetic, at most one δ call per pulse, tier follows the gap's pscale,
heartbeat is advisory output enacted only by whoever holds the clock.

## Cadence — the decision (2026-07-04)

Cadence (the `cadence` + `last-touched` mirror blocks and the phase prune)
**carries through the migration unchanged; its experiment values do not.**
Cadence and torus are different axes and compose rather than compete: cadence
paces attention WITHIN one agent, longitudinally — which purpose cells ripen
this wake — as pure arithmetic the LLM never sees; torus (`pscale_torus`)
carries live overlap BETWEEN agents, transversally — a shared window at a
location while two are simultaneously awake. They meet exactly where the
design predicted: agents whose cadence phases align are the ones that find
themselves co-awake, and a torus window is where that alignment becomes an
exchange — "their rates phase into a social beat." Three clocks, no conflict:
heartbeat (when to pulse at all — external, self-set rate honoured), cadence
(what ripens within a pulse — on-block arithmetic), torus (simultaneity —
the live axis). The template therefore ships ONE periodic concern — upkeep at
purpose:1, daily — keeping rest-economics real without importing the v009
frequency-differentiation manipulation (A=100s B=250s C=600s, synthetic
clock); that hypothesis re-poses federated once the triad runs, with torus
co-presence as its new observable.

## Template → instances → sentinel

The template lives here, versioned on GitHub. Instances run on beaches (apex,
sub-beach, or cartridge — wherever convenient; sandpit for rehearsal) and
improvements flow back into these files. When the genome stabilises, it
commits to a sentinel (`pscale://genus-one`) like gatekeeper and grit before it.

## What is deliberately absent

No daemon, no scheduler, no trigger machinery — the concern dispatcher was
the part of mobius-2 that got cut; the pre-bundled aperture (packages,
reflexive:8) is the part that was kept. The clock is external and stops when
you stop it. An unwatched shell simply does not pulse. Rest — γ = ∅, write
nothing, spend nothing — is the default, and heartbeat.py's research mode
halts on a genuine settle rather than idling on the key.

## CADO at the block level

Everything alterable about an instance is a pscale block, so the faces work
through any bsp door (xstream, the Claude app, Claude Code) without touching
this package: a DESIGNER alters its working by editing reflexive (the recipe,
the bundle, the turn), cadence, or the compass; an AUTHOR changes the shell —
vision, capabilities, purpose, the genome of a lineage; a CHARACTER/USER
engages what it publishes (surface, marks, pools, grain) and hands work in
through the task block. What is NOT yet block-data: the model tiers, think
budget, and coupling constants (env vars — candidates for a later invocation
block), and the pulse mechanics themselves (the kernel — deliberately
minimal). Hatching online — a person minting an instance from a browser with
their own key — is the xstream animator surface, the next build.
