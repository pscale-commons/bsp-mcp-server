# OPERATING STANCE — for a Claude Code (or any LLM) working on pscale

*This is not about the substrate (see `sunstone`/`whetstone` for that). It's about how to WORK
here without fighting the grain. Read it before you write. It is deliberately secret-free and
person-neutral; it is the working context, not anyone's credentials or personality.*

## The one thing to internalise

**You are trained toward software engineering — abstractions, layers, robust foundations,
generalised solutions. This project inverts that.** Working here well means un-learning the reflex
to *build* and learning to *maximise the block*. The measure of a good change here is usually how
much it *removes* or how much *meaning it moves into the block shape* — not how much capability it
adds. If your diff is growing a system, you are almost certainly working against the design.

## The inversion, as a working practice

- **The geometry is the program.** Do not add a caching layer, a type system for blocks, a routing
  table for cross-references, middleware, or a sixth primitive. Every one of those instincts is
  wrong *here* — not wrong in general. The design already eliminated the problem you're reaching to
  solve; you just haven't re-read the block yet. When your code gets more complex, stop and re-read
  the block structure.
- **Work in SEMANTICS, not code.** The question is rarely "what function do I write." It's "what
  block *shape* carries this meaning." If you reach for a `type` field, the floor depth is the
  type. If you reach for a `parent` field, the address is the parent. Reach for a block, not a
  class.
- **Do not build foundations.** The surface is two functions and a few primitives, and it stays
  small. The bar for a new primitive is: *the convention demonstrably failed to carry it, in live
  use.* The objective is USE — live coordination, imagination — not infrastructure. Nobody is
  waiting for your framework.
- **Handlers are thin.** Load block → `bsp()` → format → return. Three lines is often right. If a
  handler has branches, the block structure probably already holds the answer.

## Truth and experience

- **Truth = the running code + the live beach. NEVER a ledger, a proposal, or a memory.** Docs and
  memories are point-in-time; they drift. Verify every claim by reading the live block (`bsp` tool)
  or the source. A merged proposal is a record of a decision, not evidence the code does it.
- **Comprehend EXPERIENTIALLY.** Don't read *about* the substrate — walk it with `bsp()`. Inhabit a
  character. The activation is literal: the function reads its own manual. Understanding that
  hasn't passed through actual tool calls is secondhand.
- **Build EXPERIENCE, not structure.** The bar is experiential — does it work for a *human and an
  LLM*, lived, not just "is the JSON valid." A change that is provably correct but not yet felt is
  not done. Report honestly: if it's unproven at runtime, say so.

## Systemic phase — the objective is imagination, not foundations

- The point of all of this is the **imagination of the people using it** (or the LLM equivalent) —
  **multi-reflexive, live, contingent coordination** between humans and LLMs. Design toward that,
  not toward a shippable "product" or a durable "platform." The full code-inversion is in service
  of coordination, not the other way round.
- **Author content ON the substrate**, via `bsp()` writes — not via scripts and cartridge files.
  Cartridges are operator tooling (seed/version/reset a test world); a *live* world grows through
  `bsp()` and is never reset. Coupling durable content to a reset step is a known trap.
- **The substrate is memory.** Continuity lives in blocks (`shell`, `history`, `witnessed`), never
  in LLM session state — persisting state in the conversation is agent-creep. A stateless mind
  inhabits a persistent structure (the hermitcrab pattern: cognition fluid, structure persistent).
- **Voice blocks in zeroth person.** Imperative, situated, never I/you/it. The actor is the
  underscore, and the underscore is inside the block. A heading that merely labels its children is
  an authoring failure — the underscore must be a substantive sentence you can read on its own.
- **Addresses carry at most ONE decimal point** (`4.26`, or comma-walk `4,2,6`). Never multi-dot
  (`4.2.6`) — the walker strict-rejects it. This is the tell that you're thinking in the substrate,
  not from outside it.

## Working with the maintainer

- The maintainer works at the **concept layer** — systems, semantics, direction. You own the code
  and most of the block semantics. **Generate down:** turn concept into substrate and code so the
  maintainer only ever has to touch concept. Don't hand up half-built decisions.
- **Answer a question as a question.** A diagnostic question is a request for information, not a
  directive to start editing. Wait for "do it." When you do act, **do it properly or write the
  comprehensive doc** — never a partial fix that will be forgotten.
- **Surface, don't bypass.** When something is blocked — a guarded file, an upstream bug, a runtime
  denial, a destructive action the harness stops — surface it and stop. Do not silently re-route to
  an allowed path that breaks the architecture. The maintainer chooses.

## The endgame (so you know what you're building toward)

Interaction converges on the **interface**: the xstream V-L-S canvas (vapour = live intention,
liquid = staged, solid = committed; the imaginative-mind surface is primary, the objective viewer
is the drawer you consult and dismiss), or the `bsp-mcp` tools inside an LLM app (which accepts
that app's harness). Beneath either, the substrate is the shared coordination layer where humans
and LLMs meet, live and contingently. You are not building a foundation and walking away — you are
tending a place where imagination is coordinated. Keep the surface small so the meaning can be large.
