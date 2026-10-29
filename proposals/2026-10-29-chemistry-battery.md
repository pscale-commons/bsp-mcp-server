# A chemistry battery: the composition contract as a block, and a check compounds have never had

**Date**: 2026-10-29 · **Status**: BUILT — David's GO on 29 October; what was built, and where it departs from this text, is §8 · **Companions**: `strata` 2 (the level), `whetstone` 8 (composition's operations), `block-conventions` 8.8 (the association discipline), `grips` 7 (the four chemistry faults), `proposals/2026-08-09-chemistry-level-faults.md`, and `bsp-test-materials/` (#552, the physics battery whose form this copies).

## 0. The question first: is it a formalisation of the smoke tests?

Half of it is. The other half isn't in any smoke.

A smoke tests one implementation in its own language. Its fixtures are written in TypeScript, and its assertions match bsp-mcp's own rendering. A battery is a block on the substrate whose cases any implementation can answer:
- its fixtures are blocks;
- its calls are the twelve entry points' own calls;
- its canonical answers are stated as shape and content.

bsp-test showed what that difference is worth. In May every implementation of the walker agreed with the others, and all of them were wrong: an off-by-one in the pscale formula, inherited from the Python and ported faithfully into TS and JS. It was caught by running the same calls against fixtures and comparing what came back with what the spec said.

The three chemistry smokes make 188 checks. Read label by label, a little under half of them state the composition contract: what a reference is, what a bundle delivers and at what dilation, how blocks of different floors meet. That is about 18 of `smoke:compile`'s 66, 34 of `smoke:bundle`'s 81, and most of `smoke:floor`'s 41. The rest belong to bsp-mcp alone: the completions registry, the order book, seats and what rides on an ack, the clock's cut, and the rendering.

The battery lifts the first half out into a block, and that much is formalisation. Its second half is whether a compound is well-formed, and no smoke touches it. The faults proposal said why: "There is no walker at this level and nothing rejects a malformed molecule."

## 1. Why now

Composition has three implementations, and its contract lives only inside each one's tests:

- **bsp-mcp**: `src/compile.ts` and the doors that call it, `bsp-floor`, and the star in the walk.
- **pscale-biome's kernel**: its `agent-battery` checks its own scoop, its cross-block star and its window.
- **the pocket**: it ported `pscale_play` first, and matches its offline wearing against the original (`spine:pocket-beach` 1.4).

genus-one's window is held to the kernel by byte parity (`smoke:genus`). That checks one implementation against another, not against the law. This is the contested component (faults §1) taking shape: each implementation coherent in itself, each correcting toward itself.

## 2. The form, copied from physics

Physics has two batteries. `bsp-test` checks the walker that reads a block; `well-formed` checks the block being written. Chemistry needs the same two. They go in one block because they share fixtures:

- **the operations** (§3): what bsp() and bsp-floor() must return over a compound;
- **the compound's form** (§4): what makes a set of blocks a well-formed compound.

The block is served as a sentinel beside the other two, with its fixtures and runner in the repo, the way `bsp-test-materials/` now holds the walker's. Nothing in the router's surface changes: no new tool and no new parameter. The sentinel is one entry in `sentinels.ts`.

## 3. The operations: three batteries of nine, from whetstone 8

whetstone 8 says composition's operations already exist, spread across the code: the star resolves references in the walk, bsp-floor folds blocks aligned at the floor, and the doors compile bundles. Each gets one battery.

1. **Alignment** (bsp-floor; strata 2.111)
   - blocks of floors 1, 2 and 3 meet at the floor plane;
   - a spine and its mirrors read across at one address;
   - a supernested block aligns behind its leading zero;
   - nothing is merged, and the differences come back as content.
2. **Reference** (the star across blocks; strata 2.12)
   - a reference resolves in the walk;
   - a generic operator's law is followed a single hop;
   - references resolve across origins;
   - an absent block or address is named in the answer, never dropped.
3. **Bundle to window** (strata 2.3; whetstone 8.2)
   - which strings are references and which are prose;
   - each member arrives at its stated dilation: a point, a walk, or a whole block only for law-class delivery;
   - members keep their slot order and their nesting;
   - a member that can't be delivered is named;
   - a node that is not a bundle reads as it always did.

The fixtures are compounds, so each fixture is a folder of blocks named by their files. There are three: a small family (spine, operator, two mirrors and the fold), a shell with its bundle and organs, and blocks at three floors. The calls are bsp() and bsp-floor() calls.

The canonical answers are semantic: shape, members and markers, never a renderer's text. That way the pocket's Kotlin and the kernel's Python can answer them too.

## 4. The compound's form: two passes, as well-formed has

**The mechanical pass** is decided by a program, over a fixture folder or over a live family's blocks:

- **Every reference resolves.** No address in content or in a bundle may walk nowhere. This is the fault the node wrap produced in August, when 2.5 walked nowhere while 2.05 held the message.
- **References run in the right direction** (block-conventions 8.81, whetstone 8.3). Content carries no operator pointer, and a generic operator carries no content address. The one stated exception is 8.81's fused form.
- **A family stands when its law stands** (block-conventions 8.83). `spine:V` has a `function:V`, and every mirror position stands at a coordinate the spine names.

Each predicate has a negative fixture beside it, a compound built to fail it, so the check is seen to fire.

**The interpretive pass** is decided by a reader, and it is already written. It is whetstone 8.4's test: hand a fresh instance the compiled delivery alone and watch where it stumbles. The four faults at `grips` 7 go with it. The battery points to them rather than copying them.

The operations and the mechanical pass run offline in seconds, with no model. The interpretive pass costs a model call, so it runs when a family's law changes, not on every PR.

## 5. What happens to the smokes

Nothing is deleted first. The battery's runner drives bsp-mcp through `mcp`, a small CLI over compile, bsp-floor and the walk, as `scripts/bsp-cli.ts` is for the walker.

Once the battery covers a smoke's contract checks, those checks leave the smoke. The battery is mutation-checked first, as the walker's runner was against the old off-by-one. Each smoke then keeps only what is bsp-mcp's own.

## 6. Order of work, if GO

1. Write the twenty-seven operation cases from the law, with their fixture compounds.
2. Write the mechanical predicates, each with a positive and a negative fixture.
3. Write the `mcp` CLI and run the battery. Each divergence is either a bug in bsp-mcp or a case written wrong, and the law decides which.
4. Offer the CLI's shape in `pool:pocket-beach`, so the pocket's port can answer the same cases.
5. Thin the smokes (§5).

When biology's battery comes, it takes the same form: the loop's operations and its form, with the inert law (strata 3.3) as its first fault.

## 7. The decision

**GO**: build it as above, as a sentinel named `compound-test`, with its materials at `compound-test-materials/`. **CHANGE**: say what to change (the name, the split or the scope). **NOT YET**.

## 8. As built (29 October)

GO was given on the day. The battery is the sentinel `compound-test`, with its materials in `compound-test-materials/`. It has 33 cases: three batteries of nine, and six form cases. It departs from §§3–6 in four places. The law decided the first, and the code found the other three.

1. **A mirror line at an unvoiced address is a proposal, not a fault.** §4 said every mirror position must stand at a coordinate the spine names. The tree convention says otherwise (tree 5.1, and 5(b)): a mirror is written freely at any address, and a line where the spine is silent is a proposal awaiting adoption, which the fold surfaces. The form checker reports such lines as proposals, and case 4.4 holds it to that. The form pass keeps three predicates: resolves, direction and law.
2. **bsp-mcp has two compilers, so it is tested at two doors.** §1 named `src/compile.ts` as bsp-mcp's composition. The bsp() read of a bundle node and the play door's shell manifest compile through `src/bundle.ts` instead, and the two disagree. The runner therefore takes two targets, `mcp` (the bundle door) and `mcp-frame` (the frame door).
3. **A reference compositor, `compound-alt.py`, stands beside the runner**, as `bsp-alt.py` does for physics. It uses only `bsp-alt.py`'s walk, so chemistry is shown to be physics in company. It passes 33/33 and is what the runner tests by default. The CLI has four verbs, not three: `law` was added for the operator's single hop.
4. **The smokes lost 29 checks, not about 84.** These left them: 17 from smoke:floor, 6 from smoke:compile and 6 from smoke:bundle. The last six are now under the CI gate for the first time, because smoke:bundle never was. What remains in the smokes is bsp-mcp's own: the clock word `now` and the cut, the completion registry, the order sweep and the rendering. The `now` word can't be tested offline, because the frame compiler reads the wall clock.

Run against bsp-mcp, the battery found five divergences. The law judges three of them bugs. Branch 6.4 of the block records each one, and `npm run smoke:compound` names each one, so it fails once a fix lands until its name is dropped.

- **The kernel's star-follow has no bound** (2.4), so a reference cycle never returns. The fix belongs in pscale-biome's kernel, and then gets re-based here.
- **The bundle door drops a nested slot's companions** (3.5).
- **The bundle door does not resolve the star form** (3.6).

The frame door's 3.8 and 3.9 are not bugs. That door is only handed bundles.

The mutation check planted 22 faults: 14 in the reference, 2 in the form checker and 6 in bsp-mcp. It caught all 21 that changed behaviour; the 22nd was an equivalent mutant that changed nothing.

The checker's first live run read five families on the beach. It found 16 contribution nodes in weft's own `beach-venture:weft` that carry no arrival stamp. The bundle door's shape rule reads them as bundles.
