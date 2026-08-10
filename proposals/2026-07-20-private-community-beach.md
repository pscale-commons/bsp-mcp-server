# Private-community beaches — read-gate vs content-encryption, and escrow for provisioning

**Date**: 2026-07-20 · **Status**: PROPOSED (analysis + live demo; nothing built) · **Origin**: David Pinto — "can we set up a private area for a school or health practice — invisible outside, operating normally inside? Does escrow + encryption give that, with ALL the functionality of a public beach?"

## The requirement

A community — a school, a clinic — that (a) cannot be read by outsiders, yet (b) operates *normally* inside: full marks, history, pools, grains, sed: collectives, SAND, faces, xstream. The explicit fear: implement privacy and discover some functions no longer work.

## What was tested live (beach.idiothuman.com, 2026-07-20)

**Escrow / key hierarchy — full functionality, zero code.** One operator master; each member key = `HMAC(master, handle:epoch)`. Demonstrated end-to-end: the owner writes her block with her derived key (200); an outsider is refused (403); another member's key is refused (403); the operator re-derives the owner's key and rotates the lock to a new epoch (200); the old key is then dead (403) and the operator re-issues (200). This is corporate-style central control and revocation with **no substrate change** — locks are hashes of a secret, and secrets can be minted from a master. Members are siloed; the operator can always get in and can revoke by re-locking under a new epoch.

**Content encryption — read-privacy, but NOT full functionality.** A record was `nacl.secretbox`-encrypted to a community key and written at a leaf. An outsider read returns only the ciphertext envelope (`{_,1,2,9}`) — verified no plaintext on the wire. A key-holder decrypts it back to plaintext. Privacy works. But in the same run: a **plaintext** mark appended fine via the accumulator (200); an **encrypted** mark cannot — the tool forbids `append`+`gray` (`src/tools/bsp.ts:501`), because append lets the *server* choose the slot while gray needs the *client* to know the leaf to encrypt. They cannot compose.

## The core finding — two different privacy architectures

Privacy can live in the **content** or at the **perimeter**, and they trade against functionality in opposite ways.

**Content encryption** hides data from *everyone without the key, including the beach itself*. That is its strength and its cost: anything the beach or a tool must **read to compute** cannot run on ciphertext.

- Append accumulators (marks, history, pools-via-append) — forbidden with gray today (`bsp.ts:501`); shown live.
- SAND rider verification — `pscale_verify_rider` does sha256-chain + credit-conservation + SQ arithmetic on *plaintext* rider and passport fields (`src/tools/verify.ts`). Ciphertext yields nothing to verify.
- Server-composed pool synthesis, SQ recompute, any server-side read of meaning — same wall.

Encryption is **granular** — the right tool for a private *pocket* on an otherwise public beach (a sealed note, a grain, one confidential branch), accepting that those specific leaves forgo server-side features.

**Perimeter read-gate** hides the beach from *outsiders at the boundary*, while the server still stores and reads **plaintext** inside. Therefore **100% of functionality is preserved** — append, SAND, pools, synthesis, faces, xstream all run exactly as on a public beach, because nothing about how content is stored changes. Only *who may read* changes. This is **wholesale** — the whole community private, everything inside normal. It is the exact fit for "invisible outside, operate normally inside."

The read-gate does **not exist today** — the beach is open-read by design (`reads never need a secret`). It is a small deployment-mode fork of the handler: a doorman check before serving any block (a shared community read-token, or member handle+secret), plus clients attaching that credential on reads (xstream config; agents pass it). Existing public beaches are untouched — this is a *separate* private peer in the federation.

## The correction to the premise

The question paired **escrow + encryption**. Escrow gives write-control and revocation but **no read privacy** (reads stay open). Encryption gives read privacy but **costs functionality**. So escrow + encryption = read-private but *not* full-function.

The pairing that delivers read-privacy **and** full functionality is **escrow + perimeter read-gate**:

| Layer | Mechanism | Functionality cost | Status |
|---|---|---|---|
| Outsiders can't read | perimeter read-gate | **none** (server reads plaintext inside) | needs a small handler fork |
| Members write their own, operator provisions/revokes | per-position locks + key hierarchy (escrow) | none | works today (demoed) |
| A few maximally-sensitive leaves hidden even from the host | selective content encryption | those leaves lose server-side features | works today |

## Functionality matrix — private beach vs public

| Capability | Escrow + read-gate | Content-encrypted beach |
|---|---|---|
| marks / history / pools (append) | ✅ identical | ❌ append forbidden with gray |
| grain / sed: | ✅ identical | ⚠️ declarations encrypt, but state machines read plaintext fields |
| SAND (verify_rider, networking) | ✅ identical | ❌ server can't verify ciphertext |
| pool synthesis, SQ | ✅ identical | ❌ server can't read contributions |
| faces / tiers | ✅ identical | ✅ (validate on membership, not content) |
| xstream V-L-S | ✅ identical (with read credential) | ⚠️ renders ciphertext without keys |
| outsider read | ❌ blocked (the point) | ❌ blocked (the point) |
| host/operator can read | ✅ yes (runs their own beach) | ❌ no (ciphertext at rest) |

That last row is the real chooser. A school or clinic that **runs (or trusts) its own beach** wants the read-gate — full function, and the operator legitimately administers their own data, exactly like running their own server. A community that must be private **even from the host** needs encryption on the sensitive leaves, and accepts that those leaves are inert to server-side features. A **hybrid** is coherent: read-gate for the perimeter, selective encryption for the few records that must be blind even to the operator.

## Posture note (David's call)

The open-commons thesis is deliberately high-trust, "secured by daylight," anti-perimeter. A private-community beach is a **legitimate but different deployment mode** — a private federation peer, not a change to the commons. It should ship as a fork/flag of the beach package, and the public commons should stay open. Naming it clearly keeps the two postures from contaminating each other.

## Recommendation

For the school / health-practice use case: **escrow + perimeter read-gate**, with selective encryption reserved for host-blind records. This is the only combination that meets "invisible outside, fully normal inside." Encryption alone does not — and that is precisely the "loses certain functions" risk the requirement warned against.

## What was NOT built

Nothing. Escrow and encryption were exercised on existing primitives (live on idiothuman). The read-gate is unbuilt — it is a handler fork plus a client read-credential, scoped here but not written, because it is a posture decision that is David's to make first.

## Open decisions

- **Read-gate credential shape**: one shared community read-token (simplest; rotate to re-key the community) vs per-member handle+secret at read (finer, heavier). Escrow can mint either from a master.
- **Host-blind requirement?** Decides whether encryption is layered on sensitive leaves at all, or the read-gate alone suffices (it does, if the operator is trusted).
- **Where it lives**: a flag on the `pscale-beach` package (`BEACH_PRIVATE=members`) forking read-auth, so one codebase serves both public and private peers.
- **Demo hygiene**: `demo-escrow-alice`, `demo-clinic-note`, `demo-marks-plain` left on idiothuman for inspection — say the word to sweep them.
