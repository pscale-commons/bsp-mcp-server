# compound-test-materials

The acceptance battery for blocks in company (strata 2, chemistry). bsp-test covers the walker that reads one block; this battery covers the operations a compound is read by, and the form a compound must hold. There are 33 cases. Batteries 1 to 3 have nine each: alignment, reference, and bundle to window. Battery 4 has six cases of the mechanical form pass.

The cases live in [`../src/compound-test.json`](../src/compound-test.json), the block bsp-mcp serves as `bsp(agent_id="pscale", block="compound-test")`. This folder holds what that block can't carry: the fixture compounds, a reference compositor, the form checker and the runner.

## Run it

```bash
python3 compound-test-materials/run-compound-tests.py             # compound-alt.py, the reference
python3 compound-test-materials/run-compound-tests.py mcp         # bsp-mcp, bundles at the bundle door (npm install first)
python3 compound-test-materials/run-compound-tests.py mcp-frame   # bsp-mcp, bundles at the frame door
python3 compound-test-materials/run-compound-tests.py my-cli      # any program that answers the CLI
npm run smoke:compound                                            # all three, as CI runs them
```

A conforming implementation ends with `33 passed, 0 diverged`. Name a case you expect to fail with `--known 2.4,3.5`. The run then fails if a named case starts passing, so the list is dropped as soon as its fault is fixed.

On 29 October 2026 `compound-alt.py` scored 33/33. bsp-mcp scored 30/33 at the bundle door and 30/33 at the frame door. The five divergences are listed below.

To check that the runner catches faults, 22 single faults were planted one at a time:

- In the reference: levels out of order, a disc one rung off, zero positions skipped, a missing block dropped, no following, unbounded following, a mount followed twice, companions dropped, the star form treated as prose, every node read as a bundle, the resolution gate dropped, the head read as the oldest entry, an absent member dropped, and prose fetched as a reference.
- In the form checker: direction left unchecked, and proposals called faults.
- In bsp-mcp: levels out of order, digit 0 skipped as the old floor-align did, a mount followed twice, the form gate dropped, and prose fetched as a reference.

All 21 that changed behaviour were caught. The 22nd changed nothing: removing a whitespace guard in `src/bundle.ts` was covered by a second guard in `src/genus.ts`.

## The CLI every implementation answers

```
<impl> align   <compound> <name> <name> [...] [--pscale N]
<impl> resolve <compound> <reference>
<impl> law     <compound> <family>
<impl> compile <compound> <name>[:<address>]
```

Each call prints one JSON object. Branch 6 of the block gives each verb's shape: `aligned`, `point`, `path-walk`, `disc`, `block`, `absent`, `unresolved`, `law`, `window` or `not-a-bundle`. The answers are semantic, so a port in any language can answer the same cases.

A **compound** is a folder of blocks. Each file is named with its block's name URI-encoded: `spine:tide` is `spine%3Atide.json`, the same naming pscale-beach's folder-backed store uses. Another origin's blocks sit in a subfolder named with the encoded origin, such as `https%3A%2F%2Ffar.test/`.

The form cases (battery 4) run `compound-form.py` whatever the target, because nothing else decides a compound's form yet. It also reads a live family by public GET:

```bash
python3 compound-test-materials/compound-form.py --beach https://beach.happyseaurchin.com --family now --family audit
```

## What is here

| Path | What it is |
|---|---|
| `run-compound-tests.py` | The runner. It reads the cases from `src/compound-test.json` and checks each one's shape, count, markers and absent markers. It also checks two laws on every call. Each block's side of an alignment must be that block's own disc, as `bsp-alt.py` reads it. A window's members must be in slot order, and a member is a reference exactly when its leaf parses as one. |
| `compound-alt.py` | The reference compositor. It uses only `../bsp-test-materials/bsp-alt.py`'s walk, applied to blocks read together, and passes 33/33 by construction. |
| `compound-form.py` | The mechanical form pass. It reports faults against three predicates (resolves, direction, law) and lists proposals, which are never faults. |
| `../scripts/compound-cli.ts` | bsp-mcp behind the CLI. Alignment uses `src/floor-align.ts`. References use the frame compiler's resolution (`src/compile.ts` over the kernel scoop). A family's law uses `operatorLaw` in `src/tools/stream.ts`. Bundles compile at `--door bundle` (`src/bundle.ts`) or `--door frame` (`src/compile.ts`). |
| `floors/` | Blocks at floors 1, 2 and 3, `one` supernested to floor 2, and an accumulator grown twice (battery 1). |
| `family/` | Two well-formed families. `tide` has a spine, its own law, two mirrors, a fold and a pool with its directive at its underscore. `reed` runs a generic law (batteries 1, 2 and 4.5). |
| `shell/` | `shell:wren` with its manifest and organs. It also holds what a door must survive: an absent member, a reference cycle, a member at another origin (`https%3A%2F%2Ffar.test/`), a prose node and a list of words, and a mount of a mount (batteries 2, 3 and 4.6). |
| `form/` | Four compounds, each built to fail or exercise one predicate: `dangling`, `inverted`, `lawless` and `proposed` (4.1 to 4.4). |

## What bsp-mcp answers today

| Case | Door | Verdict |
|---|---|---|
| 2.4 | both | **Bug.** References are resolved by the kernel's scoop (`src/genus.ts`, a port of pscale-biome's kernel). Its star-follow has no bound, so a reference cycle never returns. The fix belongs in the kernel, and then gets re-based here. |
| 3.5 | bundle | **Bug.** A slot that is itself a small bundle delivers its primary and drops its companions, though whetstone 8.12 says nesting is preserved. A bsp() read of `reflexive:neptune` 9 loses three companions this way today. |
| 3.6 | bundle | **Bug.** The star form isn't in the bundle door's grammar, so a member at another origin rides through as prose, though whetstone 8.11 says the compiling door resolves it. |
| 3.8, 3.9 | frame | **Not a bug.** The frame compiler composes whatever node it is handed, because its doors only hand it frames and orders, which are bundles by authoring. |

## What it leaves out

- The word `now`: the host computes it from the clock, and the frame compiler reads the wall clock, so it can't be tested offline. smoke:bundle covers the clock members.
- The completion registry.
- The order sweep.
- How a window renders as text.
- The face and tier modifiers.
- The interpretive pass (branch 5). It needs a model call, so it runs when a family's law changes. Reading `compound-test` at spindle 5 compiles the whetstone and grips passages that state it.
