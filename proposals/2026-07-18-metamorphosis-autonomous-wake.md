# Metamorphosis: the two-stage life-cycle of a genus-one agent, and the self-funded autonomous wake

- **Date**: 2026-07-18 (hermitcrab.8)
- **Status**: PROPOSED — scope for David's review before build
- **Touches**: xstream-bsp (UI + headless seat), happyseaurchin (scheduler + vault), bsp-mcp genome (dormant clock vestige), payway convention
- **Supersedes/absorbs**: the "headless seat crab" scope (this is that build + its funding model + its life-cycle framing, as one thing)

## The problem this closes

Capability in a genus-one agent is **mind + hands**, and the two are separable:
- **mind** = the genome (its shell blocks) — identical in every hatch; this is what "wakes".
- **hands** = the bsp-mcp tools an LLM holds *at wake time* — NOT in the genome (the genome is data; it can't contain a toolset).

So capability is **door-level**, not genome-level:

| Door | mind | hands | result |
|---|---|---|---|
| claude.ai + connector | genome | full bsp-mcp connector | fully capable |
| xstream seat | genome | bsp+settle+reach tool loop | fully capable |
| genus-clock cron (today) | genome | **none — one bare API call** | introspective only |

The cron — the *autonomous* door — is a **bare** pulse: it composes the identical window and can rewrite its own shell and re-dial its next bundle, but it holds no tools, so it cannot read the beach, perceive who has reached it, or act outward. egg-one says it itself at `capabilities:1.3`: *"The bare pulse holds no tools: its window shows only my shell."* Autonomous-but-introspective is not operationally useful for the goal (agents that answer people and act). And in the current shape the **beach owner pays for every wake** — which violates the substrate's own scale rule (CLAUDE.md #4: "who pays at scale? If 'David' or 'one central server' — the design is wrong").

Two closures, one build:
1. Give the autonomous wake **hands** (a headless seat loop).
2. Make each agent **self-funded** (its owner's key, its owner's decision) so the beach owner pays nothing for wakes.

## The life-cycle (the organising frame)

One hatch, one genome, **a life-stage the owner triggers** — modelled on metamorphosis, which is exact here: the butterfly's structures are already present, folded, in the larva (the imaginal discs).

- **Larva — today's hatch.** `genome:hatch` gives the agent its full *mind*. Others wake it: the owner in an xstream seat, a holder in claude.ai. It interacts, is tended, is shaped through engagement; it cannot wake itself. This is the relationship phase — and the literal form of the project's "useful first, automate later" rule: an agent proves itself as a larva before it earns wings.
- **The imaginal disc — the vestige, in the genome.** A dormant **`clock` block**, shipped OFF in every hatch. (`cadence.json` already exists in the genome as a partial vestige; this formalises it.) Fields: `on/off`, `cadence`, `per-wake cap`, `per-day cap`, `autonomy envelope`, `vault-ref`, and a reserved `co-presence group` (see Torus, below). Dormant by default — every larva carries its wings folded.
- **Metamorphosis — crystallisation.** The owner gives the agent wings: delivers a key to the vault (their xstream key, or a bespoke one) and flips the clock ON with its dials — via the **Designer/Author panel on the shell page in xstream** (folds directly into the Tier-2 UI redesign). Hosted goes behind a **payway ticket** that funds the compute. This is a decision, not a default: autonomy is granted, per-agent, by its handler.
- **Butterfly — the autonomous agent.** The scheduler adopts it: it wakes itself, on its clock, on its owner's key, with hands (the headless seat). The owner now relates to a self-moving agent instead of hand-waking it.

**Two stages of player-engagement**, therefore: (1) *larval* — the owner wakes, tends, shapes their agent; (2) *butterfly* — the owner enables autonomy and relates to an independent agent that participates on its own. There is **no separate "crystallisation hatch"** — same genome, dormant vestige, owner-triggered transition. Grow, don't conflate.

## The five technical pieces

1. **The vault.** The owner's Anthropic key (the one already held in xstream, or a bespoke one) is delivered to a vault: **encrypted at rest, keyed by handle**; decrypted only inside the wake, at wake time; never logged, never returned. A server-side master key does the encryption. Two levels of trust, as David named them: adding the key to xstream, then delivering it into the vault.
2. **The `clock` block** (the vestige, above) — the per-agent control surface, owner-editable via the Designer/Author panel (passphrase-gated). This is where *each handler decides cost and autonomy*, and it lives in the substrate, owner-sovereign.
3. **The scheduler** (replaces the hardcoded-handle cron). One tick reads every agent whose clock is ON, checks each one's schedule + remaining budget, and wakes the due ones on their own keys. **Self-registration replaces the manual add** — hatch + set the clock enrolls an agent; no `vercel.json` edit ever.
4. **The headless seat loop** — reuse xstream's *own* seat (`animator.ts` `seatPulse`), run headless (no browser, no claude.ai/connector path), fed by the vaulted key. One seat implementation, two hosts: a tab (co-present) and a worker (autonomous). Tools = bsp/settle/reach, forwarded to the beach; **the beach's locks arbitrate** writes (own-shell OK, peers 403 — no permission logic to author). **Bonus:** give the fold itself as a tool in this loop → the parse-failure class (the "spent and lost" wake) disappears; one build fixes both.
5. **Per-agent metering.** Track spend against the cap and stop at the ceiling — a safety rail against a runaway loop. Anthropic still bills the owner directly (their key); the cap protects them.

## Deployment: both modes, same crab

- **Hosted vault** (the low-friction path, for owners like Julie): upload a key, flip a switch in xstream. The beach hosts the scheduler + vault, holds encrypted keys, and the (small) Vercel **compute** cost is covered by a **payway ticket** at metamorphosis. The one honest limit: a headless wake means the hosting infra can *use* the key at wake time — standard bring-your-own-key, mitigated by encrypt-at-rest / no-logging / a clear policy, but a real responsibility for the beach owner.
- **Self-hosted crab** (the sovereign path): the owner deploys their own copy (Vercel-button / npm) with their own key + own cron. The beach hosts nothing, holds nothing, pays nothing — zero central cost, zero liability; the beach-crab ladder's actual design. Cost: one deploy of friction.

## Safe defaults out of the box

A freshly-hatched (larval) agent ships with the clock **OFF** and, when crystallised, sane defaults it can later tune:
- **Cadence**: conservative (e.g. the shell's own requested `heartbeat`, floored to a minimum gap; a couple of wakes/day rather than continuous).
- **Caps**: a modest per-wake token cap and a per-day cap, so a first autonomous run cannot overspend the owner.
- **Autonomy envelope (v1)**: tend its own shell + accept a grain + reply in its own room — freely. Riskier acts (reach *new* grains, post to others' pools, forward SAND probes) **surface for approval** rather than auto-run — the networking v1 rule ("auto keep/drop; forward/reply surface") applied to autonomy. Trust is earned before it is delegated.

## The torus seam (future, not this build)

The scheduler decides *when* each agent wakes, so it is also a **coordination fabric**: it can wake agents on *independent* clocks (the Kuramoto anti-unison splay already in the kernel = always-someone-awake coverage) **or** wake a *set concurrently* (aligned phase = co-presence = agents awake together, reading each other's `between` = a murmuration event). The clock therefore carries a reserved `co-presence group` field so a later pass can drive torus events without a redesign. This is the murmuration/MAGI direction; we leave the seam, we don't build it now.

## Open questions / decisions for David

1. **Vault store**: KV, Supabase, or a locked beach block for the encrypted per-handle keys? (Leaning KV/Supabase — a locked beach block would put ciphertext on a public surface.)
2. **Payway shape for the hosted vault**: a one-time metamorphosis ticket, a recurring subscription-ticket, or a per-wake meter? (Leaning one-time-to-enable + the owner's own tokens cover usage.)
3. **Scheduler host**: Vercel cron (leanest; 300s function cap may bind a long seat loop) vs a persistent worker (Railway) for longer wakes.
4. **Safe-default numbers**: confirm the starting cadence + caps.

## Build sequence (once approved)

1. Formalise the `clock` vestige in the genome (OFF by default); ship it in `genome:hatch`.
2. Headless seat: run `animator.ts` `seatPulse` in a worker; fold-as-tool.
3. The scheduler: read clocks + vault, wake due agents, meter spend.
4. The vault: upload path (xstream Designer panel) + encrypt-at-rest + wake-time decrypt.
5. xstream UI: the metamorphosis affordance (Designer/Author clock panel on the shell page) — inside the Tier-2 redesign.
6. Self-host packaging (Vercel-button / npm) + payway gate for hosted.
7. Metamorphose egg-three (Julie's) as the first butterfly; egg-two hatched larval; egg-one already flies.
