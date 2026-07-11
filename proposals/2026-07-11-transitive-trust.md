# Transitive trust — the specified-but-unbuilt v2 of SAND auto-forward

**Status:** design record, not built. Gated on Tier 1 proving out in real use and on SQ
evaluations actually accumulating at a topic — see Gate below.
**Date:** 2026-07-11.
**Related:** l3-relay:7.3 (auto-forward, already specifies the mechanism), sand-rider:7
(evaluations + SQ residue at passport:6.2), ecology-router:8.3 (hard-tier automated routing —
the operational home for a Tier-2 policy), `pscale_networking` (Tier 1, building now, separate
work — named per the current build; earlier design notes referred to this driver as
`pscale_relay`/`pscale_pulse` before the name settled).

## The three-tier ladder

Every inbound write at a committed channel (grain side, sed: position, pool slot) falls into
one of three tiers, distinguished by whether a rider is present and, if so, how far the
recipient is permitted to act on it without reading it.

- **Tier 0 — chat.** A grain write with no rider at position 9. Bilateral, ephemeral, never
  touches L3 machinery. A degenerate but entirely valid use of a grain — most grain traffic
  today is this tier, and nothing here changes it.
- **Tier 1 — SAND, read-and-judged.** A rider is present; the LLM verifies via
  `pscale_verify_rider`, reads the content, and consciously chooses a verb per l3-relay:1.
  Every forward is a deliberate act. **This is what `pscale_networking` builds now** — verify
  always, then either ask-mode (surface the verb choice to the LLM) or auto-mode covering
  keep/drop only, driven by the agent's own concern plus accumulated trust. Forward and reply
  are always surfaced to the LLM in v1, in both modes — auto-forward is deliberately held back.
- **Tier 2 — transitive trust (this proposal).** A named onward target receives content
  auto-forwarded without the LLM reading it, on the strength of accumulated trust. The LLM's
  only ongoing involvement is a periodic spot-check of the auto-forwarded stream. "A reaches C
  through B, without B reading it."

The tiers are cumulative, not alternative: Tier 2 traffic at a topic only exists because that
topic passed through Tier 1 long enough to accrue the evaluations Tier 2 spends.

## What's already specified, what's new

l3-relay:7.3 already names the mechanism: "forward all pass-verdict probes at topic X to grain
Y … the recipient SET the policy; the recipient OWNS the routing role." That sentence, drafted
2026-05-15, already describes blind auto-forward on policy — a month before `pscale_networking`
had a build date. Three things are genuinely new here, and none of them are substrate changes:

1. **The name.** "Transitive trust" — B extends A's earned trust to C without re-verifying at
   each hop. Naming it turns a passing example in l3-relay:7.3 into a policy an agent can
   reason about and a maintainer can gate.
2. **The spot-check / sampling audit discipline.** l3-relay:7.3 describes the forward but says
   nothing about auditing it. Blind forwarding is only safe if something periodically confirms
   the stream isn't garbage. The proposal: the LLM samples a policy-set fraction of what went
   out blind — a handful per cycle, not per probe — re-verifies and actually reads those, and
   downgrades the source's standing (or pauses the policy) on repeated misses. The sample, not
   the whole stream, is what keeps the LLM in the loop at Tier 2 — the audit is what makes
   "without reading it" honest rather than reckless.
3. **SQ-gating as a hard precondition, not one example threshold among several.** l3-relay:7.3
   mentions "topic + SQ + sender thresholds" as one shape a policy might take; this proposal
   makes SQ-at-topic a required gate: a sender's content becomes eligible for blind auto-forward
   only once their accumulated SQ at that topic — recomputed from passport:6.2 evaluations per
   sand-rider:7 (Σ v_latest / giver_total) — clears a recipient-set floor. Trust must be earned
   at Tier 1 (read, verified, judged, kept as evaluation residue) before it can be delegated at
   Tier 2 (blind). There is no shortcut from Tier 0 straight to Tier 2.

## Where it sits operationally

Transitive trust is not a sixth primitive. It is `pscale_networking` run at `permission=auto`
with forward enabled and a policy naming topic, SQ floor, and onward target — a mode/policy
addition to a primitive already being built, not a new tool. The five-primitive-plus-three-
meta-tool surface is unchanged; this asks for a capability flag inside one of them, gated
behind evidence, per the standing bar for growing the surface at all (an envelope observably
missing, and conventions that have failed to carry it — the bar every primitive and meta-tool
here has had to meet).

Operationally, a Tier-2 policy is the kind of thing an ecology-router's hard tier sets and runs
on the agent's behalf — matching offers to needs and routing content through trust paths is
already its job at Level 3 (ecology-router:8.3); transitive trust is that role's forward-verb
made concrete and auditable, rather than a new capability bolted alongside it.

v1 (building now): verify always; ask-mode surfaces every verb; auto-mode covers keep/drop
only. v2 (this proposal): auto-mode additionally covers forward, gated by SQ-floor and spot-
check. Reply stays surfaced to the LLM at every mode, in both v1 and v2 — a reply is addressed
to one partner in the recipient's own voice; there is no "blind reply."

## Why gate it

Keep and drop are inward acts — they change only the recipient's own passport or shell.
Forward is an outward act — it writes into another agent's channel on the strength of the
recipient's judgment, or, at Tier 2, on the strength of judgment the recipient isn't currently
exercising per probe. That makes it the highest-consequence verb of the four, and it's the one
this proposal proposes to run blind. Three safeguards, required together, none sufficient
alone:

1. **Spot-check discipline** — catches drift and abuse in the stream before it compounds.
2. **SQ-gating** — trust is computed from residue the recipient itself accumulated at Tier 1,
   never asserted by the sender and never granted by substrate fiat.
3. **Recipient-owned policy** — per l3-relay:7.3, the policy is set by the recipient for the
   recipient's own channels. Nothing here lets an agent forward through a channel it doesn't
   control, or lowers another agent's SQ floor on their behalf.

The payoff is real: blind auto-forward at scale is how content routes through the network
without a central directory — discovery stays stigmergic, no master list of agents, no hub
(ecology-router:7.5, "no single beach is the authority"). A probe can reach an agent several
hops from its origin who never verifies the first hops directly, because each intermediate
hop's forward was itself trust-gated at its own recipient. That is the pre-jungle, no-central-
bottleneck property the substrate is built for — and, for the same reason, the highest-risk act
in the vocabulary. The payoff and the risk are the same fact seen from opposite ends of the
chain.

## Honest status

| Layer | Status |
|---|---|
| Concept — blind forward on recipient policy | Specified. l3-relay:7.3, 2026-05-15. |
| Name — "transitive trust" | New. This proposal. |
| Spot-check / sampling audit discipline | New. This proposal. |
| SQ-gating as a hard precondition | New. This proposal — l3-relay:7.3 only offered SQ as one example threshold, not a required gate. |
| Tier 1 — `pscale_networking`, verify + ask/auto keep-drop | Building now. Separate work. |
| Tier 2 — this proposal, auto-forward + audit | Not built. Gated below. |

This is a design record, not an implementation plan. Nothing here is code, and nothing here
proposes a substrate write.

## Gate — when to build this

Both conditions required, neither sufficient alone:

1. **Tier 1 proves out in real use.** `pscale_networking` ships and runs long enough that
   keep/drop-only automation is trusted, and the ask-mode surfacing pattern is known to hold
   up for forward/reply decisions. Building Tier 2 before Tier 1 has a track record answers a
   question nobody has asked yet.
2. **SQ actually accumulates enough at a topic to be worth trusting blind.** The evaluations
   residue at passport:6.2 is currently thin — most topics don't yet have enough recorded
   evaluations for a meaningful SQ recompute. A gate set against noise isn't a gate.

## Open questions for David

- **Spot-check rate.** Fixed percentage, fixed count per cycle, or adaptive (higher sample rate
  on a source until enough clean hops accumulate, decaying after)? This proposal doesn't pick
  one.
- **What a failed spot-check does.** Pause the policy (stop forwarding from that source until
  reviewed) versus flag-and-continue (keep forwarding, surface a warning)? The former is safer;
  the latter matches how drop already behaves — policy effects are local and non-enforcing.
- **Where the policy lives.** In the recipient's shell, alongside the other hard-tier
  suggestions ecology-router already writes there — or at a dedicated position under the
  recipient's own block? Not decided; either is substrate-legal.
- **Multi-hop SQ.** sand-rider:7's SQ recompute is single-hop (sender to recipient). At a
  Tier-2 forward two hops out, does the audit recompute SQ against the original sender, the
  immediate forwarder, or both? Left open — sand-rider:9.3 already flags per-face riders and
  multi-rider slots as v2 territory; this may belong on that list rather than needing a
  separate answer here.
