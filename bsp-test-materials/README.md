# bsp-test-materials

The acceptance battery any `bsp()` port must pass: 72 cases in eight batteries, testing the walker that reads one block (strata 1, physics). The cases live in [`../src/bsp-test.json`](../src/bsp-test.json), the block bsp-mcp serves as `bsp(agent_id="pscale", block="bsp-test")`. This folder holds what that block can't carry: the fixtures the cases run against, a reference walker, and the runner.

## Run it

```bash
python3 bsp-test-materials/run-bsp-tests.py              # bsp-alt.py, the reference walker
python3 bsp-test-materials/run-bsp-tests.py mcp          # this repo's walker, src/bsp-fn.ts (npm install first)
python3 bsp-test-materials/run-bsp-tests.py my-bsp.py    # any bsp with bsp-alt.py's CLI
```

A conforming walker ends with `=== Summary: 72/72 tests passed ===`. On 29 October 2026 both `bsp-alt.py` and this repo's walker scored 72/72. To show the runner catches faults, a walker that returns nothing scored 0/72, and the old `(floor - 1) - depth` pscale formula scored 40/72.

To test a port in another language, give it bsp-alt.py's interface: `<block.json> [--spindle X] [--pscale N]`, printing the result as JSON `{shape, …}`. Then pass a Python wrapper that calls it, the way `bsp-mcp-driver.py` wraps the TypeScript walker.

## What is here

| File | What it is |
|---|---|
| `run-bsp-tests.py` | The runner. It reads the cases from `src/bsp-test.json` and checks each one's shape, entry count and marker strings. |
| `bsp-alt.py` | The reference walker, in Python. It passes 72/72 by construction. |
| `bsp-mcp-driver.py` | This repo's walker (`scripts/bsp-cli.ts` → `bspRead`) behind bsp-alt.py's interface. |
| `test-spatial-floor3.json` | A block with floor 3, from Thornkeep down to the iron chain (batteries 1, 5, 6, 7). |
| `sunstone.json` | Sunstone frozen as it stood on 17 May 2026 (batteries 2, 3, 5, 7). The live `pscale://sunstone` has grown since and fails case 2.9, so test against this copy. |
| `absorb-floor1.json`, `absorb-floor2.json`, `absorb-floor3.json` | The same content at floors 1, 2 and 3 (batteries 4, 7). |
| `subnest-before.json`, `subnest-after.json` | A leaf that grows into a node (battery 8). |
| `super-before.json`, `super-after.json` | A block that gains a floor (battery 8). |

Battery k sits at digit k of `bsp-test`, and case X of it at `k.X`. Each case holds its description at `_`, the call at 1 (2 for the reverse battery) and the canonical answer at 2. Batteries 5–8 also carry markers at 3, the shape at 4 and the count at 5.

## What it leaves out

The battery covers reads only. It does not cover writes, locks, gray, multi-level star (`X*Y*Z`), following a star reference, routing across beaches, the disc-address round trip, the empty block `{}`, or the face and tier modifiers.

## The other levels

- **Physics, the block as written:** [`src/well-formed.json`](../src/well-formed.json) (`pscale://well-formed`). `npm run lint:block` and `npm run smoke:wellformed` check its mechanical half. `npm run smoke:parser` checks the address parser.
- **Chemistry, blocks in company:** [`src/compound-test.json`](../src/compound-test.json) (`pscale://compound-test`), with its fixtures, reference compositor, form checker and runner in [`compound-test-materials/`](../compound-test-materials/). `npm run smoke:compound` runs it. Its reference battery covers following a star reference across blocks, which this battery leaves out.
- **Biology, the loop:** `npm run smoke:genus` checks that genus-one's window matches its kernel byte for byte.
