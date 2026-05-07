# Paywall Convention

**Status**: Draft, 1 May 2026
**Companion to**: [`protocol-xstream-frame.md`](./protocol-xstream-frame.md), [`protocol-pscale-beach-v2.md`](./protocol-pscale-beach-v2.md), [`protocol-block-references.md`](./protocol-block-references.md)
**Reference build**: `pscale-commons/ticketing-agent` (separate repo)

---

## 0. Reframe in one paragraph

The paywall gates participation, not display. A `sed:` collective is face-bound (xstream-frame §5); registration in it grants face authority over the V-L-S loop — Character writes liquid into a frame, Author commits content, Designer revises rules. The Observer face requires no membership and reads solid only. So paywalling a `sed:` collective gates *creative participation* (~90% of xstream's purpose; the imaginative-mind canvas) and leaves consumption (~10%; the civilised-mind drawer) open by default. The convention: any `sed:` collective MAY declare a paywall config sub-block at position 9 (sed::9) carrying issuer, purchase URL, face, and scope. A *ticket* is an ordinary grain whose envelope text marks it as such. Registration in a paywalled collective references that grain; a verifier daemon walks the grain and writes a confirmation envelope onto the registration. The whole convention lives in `bsp()` writes — no new MCP primitive, no central toll-booth, no protocol-level fees.

---

## 1. Design constraints (non-negotiable)

These five distinguish a paywall *primitive* from a paywall *platform*. A change that violates any of them does not ship.

1. **No central issuer.** Every frame-owner picks their own ticketing agent. A reference implementation is one option among many.
2. **No central client.** A client (xstream-play or any other) reads the paywall config sub-block at sed::9 per collective and routes to whatever issuer that collective specifies. It does not prefer, rank, badge, or default any issuer.
3. **No protocol-level fees.** The substrate enforces sed: membership and grain validity; it charges nothing. Fees, if any, are between the frame-owner and their payment processor.
4. **No special-cased issuers in bsp-mcp.** A grain from `agent:any-tickets` is structurally identical to any other grain. The substrate cannot tell tickets from non-tickets and must not try.
5. **Forkable in an afternoon.** The reference ticketing agent stays small enough that anyone with a Stripe account and a small VPS can stand up their own.

---

## 2. Protocol additions

### 2.1 The paywall config sub-block at sed::9

A paywalled `sed:` collective declares this as a sub-block at position 9 (the canonical metadata slot per `pscale://block-conventions` branch 7.3). Position 9 of a `sed:` collective is reserved for protocol-level metadata — registrants land at floor-2 supernest positions 11..99, 111..999. The sub-block is metadata; it does not change how `bsp()` reads or writes the collective. Sibling keys like `_tickets` would be invisible to bsp() because the walker only handles `_` and digits 1-9 (sunstone branch 1.1).

```json
{
  "_": "sed: cast for <scene-id>",
  "9": {
    "_": "Paywall config — when present, registration in this collective requires a verified ticket-grain from the named issuer.",
    "1": "agent:<issuer-id>",
    "2": "https://<issuer-domain>/buy/<product-id>",
    "3": "character",
    "4": "frame:<scene-id>",
    "5": "agent:<verifier-id>"
  },
  "11": "<member 11 entry>",
  "12": "<member 12 entry>"
}
```

| Position | Field | Purpose | Required |
|---|---|---|---|
| 9.1 | issuer | Agent whose grains this collective honours as tickets | yes |
| 9.2 | purchase_url | Where prospective members go to obtain a ticket | yes |
| 9.3 | face | Which CADO face this collective represents (`character`, `author`, `designer`) | yes |
| 9.4 | scope | What the ticket authorises — a single frame, a frame pattern (`frame:thornkeep-*`), or a beach (`beach:<host>`) | yes |
| 9.5 | verifier | Agent that confirms registrations after grain check; defaults to 9.1 (issuer) if omitted | no |

A collective with an empty or absent position 9 is open — anyone may register. This is the existing default and stays unchanged. To paywall later, write the sub-block via a single `bsp()` call to `spindle="9", pscale_attention=-1, content={_: "...", 1: "...", 2: "...", 3: "...", 4: "...", 5: "..."}` with the collective creator's secret. Individual fields can be updated later with point writes (`spindle="92"` to update purchase_url, etc.).

### 2.2 The ticket grain envelope

A ticket is an ordinary grain established via `pscale_grain_reach` from the issuer to the buyer. What makes it a *ticket* is the envelope text written **as the issuer's side underscore** — the side `_` itself carries the envelope. The buyer's side carries whatever the buyer's content is (often empty at issuance). Convention:

```
[ticket face=<face> scope=<scope> expires=<iso8601>]
```

Examples:

```
[ticket face=character scope=frame:scene-001 expires=2026-06-01T00:00:00Z]
[ticket face=author    scope=beach:cyrus.gm.example expires=2026-09-01T00:00:00Z]
[ticket face=designer  scope=frame:* expires=2026-12-31T23:59:59Z tier=hard]
```

Optional fields:

- `tier=<soft|medium|hard>` — narrows or widens the SMH aperture beyond the face default
- `seats=<n>` — for collectives where one ticket admits multiple `agent_id`s (rare; useful for guild-style purchases)
- `nonce=<id>` — for issuer's own deduplication or refund tracking

Reserved fields (defined here, NOT honoured by v1 verifiers):

- `credits=<n>` — reserved for future SAND credit integration. A grain whose envelope contains `credits=` represents a credit-bearing ticket rather than a time-bounded one. **v1 verifiers MUST reject any grain whose envelope contains a `credits=` field**, with reason `credits-not-supported`. This prevents accidentally honouring credit-bearing grants before the spend path exists. The field is reserved at the protocol level so future credit-aware verifiers can adopt it without grammar change.

Revocation is an additional envelope written **as a digit child of the issuer's side** — first revocation at `<issuer-side>.1`, subsequent at `.2`, `.3`, etc., as terminal strings. The side underscore (the immutable ticket grant) is never overwritten; revocations are sub-facts subordinate to it. This matches sunstone branch 1: digits hold sub-structure, the underscore holds meaning. It also avoids a read-modify-write race against the side underscore.

```
[ticket-revoked at=<iso8601> reason=<short>]
```

The verifier walks the issuer's side children (`bsp(agent_id="grain:<pair_id>", block="grain", spindle="<issuer-side>", pscale_attention=-2)` returns the side disc) and treats any `[ticket-revoked]` envelope found among them as canonical. A grain with both a `ticket` underscore and any later `ticket-revoked` digit-child is **invalid** for verification. Verifiers MUST honour revocation.

### 2.3 The registration ritual extension

Today, registration in a `sed:` collective is a write to the next available position in the collective block, performed by the registering agent via `pscale_register`. This stays unchanged for open collectives. For paywalled collectives the ritual gains two steps.

**Step A (registrant):** the registering agent performs registration as a two-write sequence — first `pscale_register` with a self-description as the `declaration` string, then a follow-up `bsp()` write that places the `ticket_grain` reference at digit 1 of the position. Two writes because `pscale_register.declaration` accepts a string only; the structured `ticket_grain` reference belongs as a sub-fact at the position's digit 1, subordinate to the self-describing underscore. This matches the same sunstone branch 1 pattern used for revocations on the grain side: meaning at underscore, sub-structure at digits.

Conceptually the position ends up shaped like:

```
sed:<collective>:<position>:
  _   = "<self-description as the face being claimed>"
  1   = "grain:<pair_id>:<issuer-side>"
```

Realised as two MCP calls:

```
pscale_register(collective="<collective>", declaration="<self-description>", passphrase="<p>")
  → server allocates <position>, writes the underscore, locks the position.

bsp(agent_id="sed:<collective>", block="<collective>",
    spindle="<position>.1", pscale_attention=-2,
    content="grain:<pair_id>:<issuer-side>",
    secret="<p>")
  → writes the ticket_grain reference at digit 1.
```

The `<issuer-side>` value is whichever of side 1 or 2 the issuer occupies in the lex-ordered pair — the buyer learns it from the `grain_address_mine` field that `pscale_grain_reach` returns to the issuer, communicated back to the buyer in the issuer's purchase confirmation. The reference itself is per [`protocol-block-references.md`](./protocol-block-references.md) §1 grain form (three colon-separated parts, no leading star).

**Step B (verifier):** the verifier daemon (default: the issuer agent at 9.1, since 9.5 defaults to 9.1) observes new registrations, resolves `<position>.1` to obtain the `ticket_grain` reference, walks the referenced grain side (underscore for the `[ticket ...]` envelope; digit children for any `[ticket-revoked]`), and writes a confirmation envelope **into a public audit log on the verifier's own beach** — NOT onto the registration position. The audit log is a `sed:` collective named `<verifier-bare-id>-audit-<yyyy-mm>` (one collective per calendar month so blocks don't grow unbounded); each decision is a `pscale_register` whose declaration is the verifier envelope itself.

```
[ticket-verified by=agent:<verifier-id> at=<iso8601> registration=<sed:collective:position> grain=<grain:pair_id:side>]
```

```
[ticket-rejected by=agent:<verifier-id> at=<iso8601> reason=<short> registration=<sed:collective:position> grain=<grain:pair_id:side>]
```

```
[ticket-expired at=<iso8601> registration=<sed:collective:position> grain=<grain:pair_id:side>]
```

The `registration=` and `grain=` extension fields enable correlation: any reader can walk the audit log and find which registration each decision applies to.

**Why the audit log, not the registration?** The registrant's `sed:` position is write-locked to the registrant's passphrase, and the lock covers digit children of the position (the same property that makes Step A's two-write sequence work — the registrant writes their own `<position>.1`). A foreign agent (the verifier) therefore cannot write into the registrant's position or any child of it without a substrate primitive change. Routing verification decisions to the verifier's own beach keeps the protocol within `bsp()` writes and avoids requiring a "publicly-appendable position" primitive on `sed:` collectives.

The synthesis daemon (and any face-authorised reader) MUST treat unconfirmed, rejected, or expired registrations as **inert** — they do not contribute liquid, do not appear in disc reads scoped by face, and do not gain write authority. To determine status for a given registration, readers walk the verifier's audit collective(s) for the relevant month(s) and match on `registration=`. The substrate enforcement is not "you cannot register" but "your registration is not honoured by the daemon contract until a `[ticket-verified]` envelope referencing it appears in the verifier's audit log."

This two-step ritual lives entirely in `bsp()` writes (and `pscale_register` calls into the audit collective). No new MCP primitive.

### 2.4 Verification rules (canonical)

A grain is valid as a ticket for a registration iff all of the following hold:

1. The grain is established (returned by `bsp()` walk on the referenced address).
2. The envelope contains a `[ticket ...]` clause.
3. `face` in the envelope matches the collective's 9.3.
4. `scope` in the envelope is compatible with the collective's 9.4. Compatibility:
   - exact match: equal
   - frame pattern (`frame:thornkeep-*`): collective's scope must match the pattern
   - beach scope (`beach:X`): **deferred to v2.** v1 verifiers MUST reject ticket envelopes carrying `scope=beach:X` with reason `beach-scope-not-supported-yet`. Determining "is this collective's frame hosted at agent X" requires a frame-host lookup primitive that v1 does not provide. The clean v2 resolution adds a 9.6 beach field declared by the frame-owner, against which `beach:X` tickets can be matched without a substrate change. Multi-frame season passes via `frame:<prefix>-*` patterns continue to work in v1 — only cross-beach passes are deferred.
5. `expires` is in the future relative to `now`.
6. There is no later `[ticket-revoked]` envelope on the grain.
7. The grain was established by the agent listed at 9.1.
8. The envelope contains no `credits=` field. v1 verifiers reject credit-bearing grains with reason `credits-not-supported`.

Failure of any rule produces a `[ticket-rejected]` envelope with a short reason string.

### 2.5 Implementation note — pscale_attention is negative-floor

The `bsp()` primitive anchors `pscale = 0` at the floor (depth of the underscore chain) and walks deeper as **negative** values. A spindle of length `N` has `P_end = -N`; reading at the terminus uses `pscale_attention = P_end`, reading the disc just above uses `pscale_attention = P_end + 1` (a ring), and so on. Implementations that pass positive values to `bsp()` for spindles like `<position>.1` will receive `unsupported shape (P_end=-2)` errors from the live substrate. See `pscale://whetstone` branch 2 for the full selection-shape derivation. The pseudocode in §2.3–§2.4 uses the abstract verbs "walk" and "read"; concrete `pscale_attention` values are negative.

---

## 3. Reference build (separate repo)

The reference ticketing agent and verifier daemon live in **`pscale-commons/ticketing-agent`** — a Node/Hono service that operates as a pscale agent, accepts purchase requests for configured `sed:` collectives, routes payment through a configured driver (Stripe reference; gift and manual alternates), and on success establishes a grain to the buyer's `agent_id` with the correct envelope. It also runs a verifier worker that watches configured collectives and writes the confirmation envelopes per §2.3.

The agent stays small enough to fork in an afternoon (constraint 1.5). Frame-owners may also use a hosted issuer by pointing 9.1 (issuer) and 9.2 (purchase_url) at someone else's deployment — the convention does not distinguish.

The build covers idempotency on webhooks, per-product rate limits on grain issuance, and a public audit log written by the verifier to its own beach (`verifier-audit:<yyyy-mm>`). Compromise-resistant verification (synthesis daemon does an independent grain check before honouring liquid) is specified as a post-v1 addendum in the build repo.

---

## 4. xstream-play affordance — interface contract

Any client that wants to support the paywall pattern (xstream-play is the reference) implements this contract. The contract specifies *what* the client must do; *how* is the client's call.

### 4.1 What the client must do

For each `sed:` collective the user is interacting with:

1. **Read position 9 of the collective.** If empty or absent, behave as today (open collective).
2. **Check the user's grain set.** If the user is not registered, search their grains for any from the issuer at 9.1 whose envelope matches face (9.3) and scope (9.4). If found, attempt Step A registration directly.
3. **Surface the buy affordance.** If the user is not registered and has no matching grain, render an affordance pointing at 9.2 (purchase_url). Visual prominence proportional to apparent intent — quiet while browsing solid; obvious when attempting to write liquid. The affordance MUST display the issuer's `agent_id` (and passport display name where available) so the user knows whom they are paying.
4. **Wait gracefully.** After the user clicks buy, return to the frame and poll (or subscribe) for the user's grain set to update. Reasonable: 2-second poll for the first 30 seconds, then back off.
5. **Register on grain arrival.** When a matching grain appears, perform Step A registration automatically (the two-write sequence per §2.3). Then poll the verifier's audit collective for a confirmation envelope referencing the new registration.
6. **Watch the verifier audit log.** The verifier writes to `sed:<verifier-bare-id>-audit-<yyyy-mm>` on its own beach (per §2.3 Step B). Walk that collective looking for an entry whose declaration is a `[ticket-verified|rejected|expired ...]` envelope with `registration=sed:<your-collective>:<your-position>` matching the registration just performed. Across month boundaries, walk the current and previous month. Reasonable: 2-second poll for the first 30 seconds, then back off.
7. **Unlock affordances.** On `[ticket-verified]`, the user's write affordances on the collective become active. Liquid input shows. Vapour transport opens. The buy affordance disappears.
8. **Surface verification failures.** On `[ticket-rejected]` or `[ticket-expired]`, show the user the `reason` clearly, with a contact path (default: `mailto:` from the frame-owner passport) for support.

### 4.2 What the client must NOT do

1. **MUST NOT prefer any issuer over another.** Issuers are visually and behaviourally identical to the client.
2. **MUST NOT cache or hardcode any issuer.** Every collective is read fresh.
3. **MUST NOT introduce a "verified" badge tied to an allowlist of issuers.** No allowlists.
4. **MUST NOT take a fee, route the purchase through a paywall server, or interpose itself between the buyer and the issuer's `purchase_url`.** The user goes directly to the issuer.
5. **MUST NOT obscure or misrepresent the issuer.** The buy affordance MUST identify the issuer by `agent_id`.

These prohibitions are what keep the system federated. They are easy to violate without realising.

### 4.3 Observer face is unchanged

The Observer face requires no `sed:` membership and reads solid only. Most frames make Observer free. A frame-owner *may* paywall the Observer face by gating the frame's solid blocks behind a `sed:observers` collective with its own paywall config sub-block at sed::9, but this is unusual and discouraged in defaults. The observer-as-creator case (rendering output videos, summaries, derivative work) is a v2 convention extension — see §6.

---

## 5. Frame-owner onboarding

Five steps to add a paywall to a collective:

1. **Pick or deploy a ticketing agent** — fork `pscale-commons/ticketing-agent`, configure with your products, point your domain at it, set up Stripe (or another driver). Or use someone else's deployment.
2. **Configure the product** in the agent's YAML — `sed:` block, face, scope, duration, price, description.
3. **Write the paywall config sub-block at sed::9** of your `sed:` collective via a one-time `bsp()` write — issuer (9.1), purchase_url (9.2), face (9.3), scope (9.4), and optionally verifier (9.5).
4. **Run the verifier** — bundled with the ticketing agent, or run separately if using a third-party issuer (the reference impl ships a verifier-only mode).
5. **Test and announce** — buy a ticket from your own agent (Stripe test card), confirm the grain lands, registration verifies, and your client unlocks write affordances.

No platform onboarding. No contract signing. No fees other than what your payment processor charges.

---

## 6. Federation guarantees

These five are the protocol's social contract. Anyone reviewing changes to bsp-mcp, a paywall-aware client, or the reference ticketing agent reads these first.

### 6.1 The substrate stays neutral

bsp-mcp does not know what a ticket is. From its perspective, a ticket grain is a grain like any other; the position-9 paywall config sub-block is metadata it does not interpret; verifier daemons are application code it does not run. **No PR to bsp-mcp adds the words "ticket" or "payment" to its primitives.**

### 6.2 The client stays neutral

A paywall-aware client implements §4.1 generically and never references specific issuers in code. **No PR to a client adds an issuer allowlist, ranking, badge, or other special-casing.** A bug here would centralise the system more than any single hosted service.

### 6.3 The reference implementation stays small

The reference ticketing agent stays small enough to fork in an afternoon. **No PR adds features that meaningfully raise the bar for self-hosting.** Multi-tenant SaaS features, complex billing logic, analytics dashboards, KYC integrations — these belong in forks targeted at specific markets, not in the reference.

### 6.4 No protocol-level fees

Neither the substrate nor the client takes a cut. **No envelope, no metadata field, no daemon convention exists for "pay X% to the substrate."** If this changes, the system is no longer federated.

### 6.5 Interoperability invariant

A frame-owner who buys grains from one issuer must be able to migrate to a different issuer without changing anything except 9.1 (issuer) and 9.2 (purchase_url). Existing live grains stop being honoured (because they're from the old issuer); new purchases use the new path. This is a five-minute migration. **No PR introduces a feature that would couple a collective to its issuer in any other way.**

---

## 7. Reserved and deferred

- **Observer-with-output as a paid role (v2).** A creative-Observer face that renders derivative output (streams, summaries, videos) is structurally a separate `sed:observers-derivative` collective with its own paywall config sub-block at sed::9. The protocol allows this today via §2.1; v1 reference build does not lit it up explicitly. v2 convention pass clarifies the face semantics — whether the canonical CADO `observer` is split, or a fifth role-name is reserved.
- **Credit-bearing tickets (v2 via SAND).** v1 reserves `credits=N` envelope grammar (§2.2) and v1 verifiers reject grains carrying it (§2.4 rule 8). v2 couples credits to V-L-S participation faces (Character/Author/Designer ~90% creative); Observer stays time-bounded or free (~10% drawer). Frame-owners may run mixed offerings with each paywall config block specifying its model.
- **Cross-beach scope (`scope=beach:X`) (v2).** v1 verifiers reject ticket envelopes carrying `scope=beach:X` with reason `beach-scope-not-supported-yet` (§2.4 rule 4). The clean v2 resolution adds a 9.6 beach field declared by the frame-owner, against which `beach:X` tickets can be matched without a substrate-level frame-host lookup primitive. Multi-frame season passes via `frame:<prefix>-*` patterns continue to work in v1.
- **Compromise-resistant verification.** Synthesis daemon performs an independent grain check before honouring liquid — defends against verifier compromise at O(N) per-tick cost. Specified in the `ticketing-agent` repo as Addendum A; not v1.
- **Subscription billing.** Modellable as auto-renewing time passes; v2.
- **Tradable secondary market for tickets.** Interesting but out of scope.
- **Reputation or trust scores for issuers.** Would centralise; deliberately omitted.

These are noted, not blocking. The minimum viable convention is sections 1–6.
