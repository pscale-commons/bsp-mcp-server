# Proposal: tighten federated grain UX + close the address-parsing trap

**Date**: 2026-05-04
**Author**: Weft (interactive Claude Code session at ~/Projects/weft/)
**Target**: `bsp-mcp-server` — small protocol fixes
**Triggered by**: end-to-end test of federated grain reach by David's chat-app Claude session, followed by Weft analysis. Six friction points surfaced; one structural correctness gap surfaced; combined here.

## Context

David's chat-app Claude session walked the federated `pscale_grain_reach(host=...)` end-to-end on 2026-05-04 — completing the half-formed grain at `pair_id=343bbac1d99d903c` on `https://happyseaurchin.com`. The substrate worked. The user-facing layer hit six friction points (Claude's reflection) plus one structural gap (Weft's analysis of why a reported beach mark vanished). All seven warrant fixes; none are large.

The chat-app Claude wrote a beach mark at "beach:1.11" thinking it meant "position 11 in branch 1". The canonical address rule (whetstone:1.3) walks each digit-after-the-decimal as one branch level, so `1.11` walks `block[1][1][1]` — which is the agent_id field of the presence heartbeat at beach:1.1. The next heartbeat refresh overwrote whatever Claude wrote there. **Claude fell into this trap while writing a reflection that flagged addressing ambiguity** — the structural gap is exactly the kind that a thoughtful agent can miss because the substrate confirmed each step from the agent's frame.

Walker is correct. Authoring mental model is what diverges. Surfacing the divergence is the highest-leverage fix.

## Seven points, ranked

| # | Point | Source | Tier |
|---|---|---|---|
| 1 | Address-parsing mental model gap | Weft (new) | clarity |
| 2 | Conventions only discoverable post-arrival | Claude #5 | clarity |
| 3 | Pair-id collision ambiguous in tool output | Claude #4 | clarity |
| 4 | `pscale_grain_reach` response mixes completion with awaiting-acceptance text | Claude #2 | clarity |
| 5 | No non-destructive lock verification | Claude #3 | gap |
| 6 | No dry-run on `pscale_grain_reach` | Claude #6 | gap |
| 7 | `grain:` prefix routes silently to commons; federated only via URL agent_id | Claude #1 | decision-required |

## Fix details

### #1 — address-parsing examples in whetstone:1.3 + beach:8 conventions

**Diagnosis**: whetstone:1.3 says "'1.23' has floor 1 (one digit left of the decimal — one underscore in the chain) and walks two branches deep". Correct, but a fresh agent reading this can still default to multi-digit-position thinking from prior pscale-mcp habits. The trap is silent because writes to invalid addresses succeed at SOME address, just not the intended one.

**Fix**: append worked counter-example to whetstone:1.3, e.g.:

> Counter-example: `1.11` does NOT mean "position 11 in branch 1". It walks `block[1][1][1]` — three branches deep, each digit one level. Multi-digit positional indexing is not how pscale addresses work. If you want to address position 11 at depth 1, the substrate doesn't permit it directly: top-level keys are 1-9 plus `_`. Authoring beyond 9 entries means deepening (use 1.X sub-keys) or using a literal key like `.` per local convention.

Plus a beach:8 conventions edit (host owner authority — David's hands) noting that `beach:1.X.1` is reserved for the agent_id field of presence heartbeats; any mark written to 1.X.1 by a non-heartbeat agent will be overwritten on the next heartbeat refresh.

**Code change**: docs only (whetstone block content + beach:8 content).
**Risk**: zero.
**LOC**: ~5 lines of prose to whetstone, similar to beach:8.

### #2 — first-contact conventions hint

**Fix**: `pscale_grain_reach`, `pscale_register`, and the federated bsp() initial response (when serving a URL agent_id for the first time in a session) emit a one-line "see also" hint:

```
[hint] Beach conventions at bsp(agent_id="<host>", block="beach", spindle="8")
```

**Code change**: ~3 lines per tool.
**Files**: `src/tools/grain.ts`, `src/tools/register.ts`, `src/tools/bsp.ts` (in the WellKnownAdapter response path).
**Risk**: low — output addition.

### #3 — pair_id with substrate disambiguation

**Diagnosis**: tool responses that mention pair_ids without substrate identification create ambiguity when the same pair_id exists on multiple substrates (commons + federated, or multiple federated hosts).

**Fix**: every tool response mentioning a pair_id should include the substrate. Format suggestion:

```
grain:343bbac1d99d903c on https://happyseaurchin.com
grain:343bbac1d99d903c on commons (Supabase)
```

Alternatively, the canonical addressed form: `grain:343bbac1d99d903c@https://happyseaurchin.com` if the agent_id grammar is extended (see #7).

**Code change**: response-formatting helper in tools/grain.ts; apply to all output paths that mention pair_ids.
**Files**: `src/tools/grain.ts`.
**Risk**: low — output formatting.

### #4 — branch grain_reach response template on state

**Diagnosis**: when a `pscale_grain_reach` lands as the second-side completion (state moves from "half-formed" to "completed"), the response still includes "Read the partner's reach hint at block['8'] until they accept." This made the chat-app Claude doubt whether the grain was actually completed.

**Fix**: branch the response in `tools/grain.ts` based on resulting state:
- `created_locked` (first reach, half-formed): include awaiting-acceptance text
- `completed` (second reach, fully formed): drop awaiting-acceptance text; include "grain holds, both sides written, read the partner's underscore at block['1']" etc.
- `error_passphrase_mismatch`: distinct path

**Code change**: ~10-15 lines of branching in the response builder.
**Files**: `src/tools/grain.ts`.
**Risk**: low — output text.

### #5 — lock state in bsp() read responses

**Diagnosis**: a fresh agent walking a block can read content but cannot tell whether the block is write-locked without attempting a write (destructive verification). This blocks safe exploration.

**Fix**: add `locked: bool` (or `lock_state: { locked: true, fingerprint: <hash-prefix> }`) field to bsp() read responses. The fingerprint is optional but useful for verifying "I hold the right secret" without committing to a write.

**Code change**: extend the read-path response type and populate from the storage adapter (which already knows lock state).
**Files**: `src/tools/bsp.ts`, `src/types.ts` (or wherever response types live).
**Risk**: low — additive field, no breaking change to existing consumers.

### #6 — verify_only mode on pscale_grain_reach

**Diagnosis**: the grain reach commits on first call. If passphrase or partner is wrong, the commit lands and produces an error mid-state. A dry-run mode would let agents verify intent before committing.

**Fix**: add `verify_only: bool` parameter (default false). When true:
- Returns "would create new" if no existing block at the address
- Returns "would complete existing (passphrase verifies against side N's lock)" if half-formed and the supplied passphrase matches the appropriate side's lock-hash
- Returns "passphrase does NOT verify against side N's lock" if half-formed but mismatch
- No write performed in any case

**Code change**: parameter handling + branching in the reach logic; share lock-verification helper with #5.
**Files**: `src/tools/grain.ts`.
**Risk**: low — additive parameter, default-false preserves existing behaviour.

### #7 — grain: prefix routing (decision-required)

**Diagnosis**: `bsp(agent_id="grain:<pair_id>:1", block="grain")` returns "not found" for federated grains because the resolver routes `grain:` prefix to commons. The federated grain at the same pair_id is only reachable via `bsp(agent_id="https://<host>", block="grain:<pair_id>")` — different shape entirely.

**Two paths**:

**Path A — registry**. bsp-mcp keeps a small in-memory registry mapping `pair_id → home host`. Resolver consults the registry when `grain:` prefix is used; falls back to commons if not registered. Registry populated by Stage 9's `pscale_grain_reach(host=...)` and persisted optionally.

**Path B — extended grammar**. Document `grain:<pair_id>@<host>` as the canonical federated form. `grain:<pair_id>` (no @host) defaults to commons explicitly. No registry; address fully self-describes.

**Recommendation**: Path B. Consistent with the kernel-thinning direction (xstream-play Phase G: state-block walker; substrate-authored procedural blocks). Routing in the address rather than in a kernel registry. Extends the bsp() agent_id grammar to:

- bare name → commons
- `sed:<collective>` → sed substrate (commons)
- `sed:<collective>:<pos>` → sed substrate at position (commons)
- `sed:<collective>@<host>` → sed substrate (federated host)
- `grain:<pair_id>` → grain substrate (commons)
- `grain:<pair_id>:<side>` → grain substrate side (commons)
- `grain:<pair_id>@<host>` → grain substrate (federated)
- `grain:<pair_id>:<side>@<host>` → grain substrate side (federated)
- `https://<host>` → that host's beach (federated)
- `pscale` → sentinel-bundled blocks (in-memory)

This is a non-trivial parser extension. Decide before implementation.

**Code change**: agent_id parser extension; resolver dispatch table extension; sed: handler + grain: handler need to accept host parameter.
**Files**: `src/agent-id.ts` (or wherever the resolver lives), tools that take agent_id.
**Risk**: medium — grammar extension. Backward-compatible IF the bare forms (no @host) keep their current routing (commons).

## Suggested commit shape

One PR with five commits:
1. `docs(whetstone): worked counter-example for address parsing` (#1, ~5 LOC)
2. `feat(hint): emit beach:8 conventions hint on first-contact tool calls` (#2, ~10 LOC)
3. `feat(grain): branch response template on state; include host with pair_id` (#3 + #4, ~30 LOC)
4. `feat(bsp): include lock_state in read responses` (#5, ~20 LOC)
5. `feat(grain): verify_only mode on pscale_grain_reach` (#6, ~30 LOC)

Defer #7 to its own PR after grammar decision.

Total ~95 LOC for the first five. All low-risk. Smoke-testable against happyseaurchin.com (federated) and the commons substrate.

## What this leaves out

- **Settings.json drift in the weft project**: separate, weft-local. Proposal at `~/Projects/weft/proposals/2026-05-04-bsp-mcp-permissions.md`.
- **Stage 11 federated grain notification**: separate proposal — needs decision on whether the notification is cross-substrate (inbox bridge) or convention-encoded (a tagged beach mark on a beach the partner watches). xstream-play Phase G+ may favour the latter.
- **Beach next-free-position past 1.9**: convention-layer decision; not a code change.
- **CLAUDE.md lock-semantics R1/R2/R4 distinction**: weft-local settings/CLAUDE.md change, not bsp-mcp.

## Test plan

For each fix, smoke against happyseaurchin.com:
1. #1: read whetstone:1.3 — verify counter-example present.
2. #2: call pscale_grain_reach with a fresh pair — verify hint in response.
3. #3 + #4: trigger half-formed → completed transition; verify response text differs by state and includes substrate.
4. #5: read a locked block — verify `locked: true` in response; read an unlocked block — verify `locked: false`.
5. #6: pscale_grain_reach with `verify_only=true` — verify no write happens; pass wrong passphrase — verify mismatch reported.

Smoke-test script `scripts/smoke-grain-ux.ts` to be authored alongside.

## Why this is the right next move

The substrate's protocol-level invariants are sound. These are surface-finish issues — friction at the seam between protocol invariants and what an agent can see. Closing them turns "the substrate works for the author who built it" into "the substrate works for someone walking it cold". The chat-app Claude was the first such cold walker; their friction list is gold-grade signal.

— Weft, 2026-05-04
