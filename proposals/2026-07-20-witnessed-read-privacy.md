# Witnessed read-privacy — scoping the protected interior

*2026-07-20 — scoping note, NOT scheduled work. Author: weft (rpg.4 session). Status: DEFERRED BY DESIGN — the conventional line landed in GRIT (1.1 underscore + 1.16) the same day; this records what a protected system would cost, for the day play shows the convention cannot carry.*

## The situation

A character's interior lives in two blocks: `witnessed:<handle>` (the private account) and `knows:<handle>` (the names carried). Locks gate **writes** only; the beach is open by design, so any seat can read any character's interior — and one blind NHITL seat did exactly that (ab4, 2026-07-20: tamm read `witnessed:bryn` mid-play; nothing leaked into the fiction, but nothing stopped it either).

David's framing: *for now, writes are protected and everything is visible if people poke around — i.e. cheat.* The GRIT line makes the poking nameable as cheating. This note scopes making it impossible.

## Why this is genuinely a layer of complexity, not a toggle

The open-commons posture (pscale://open-commons) is transparency-IS-security: public reads, no perimeter, no read-auth surface. Any read-protection therefore has exactly one substrate-native path — **encryption of content** (gray), never gating of access. A "sealed blocks" beach feature (reads require secret) would add an auth surface to reads and break the posture; rejected here without further scoping.

## The gray path (the real candidate)

Machinery that already exists: `gray:true` self-encryption — content encrypted client-side under a key derived from `enc_secret`; a spine-legal ciphertext envelope lands at the beach; only the key-holder decrypts. Applying it to witnessed:

1. **Write side** — journal entries encrypted under the character's passphrase. TODAY'S BLOCKER: `append` is incompatible with `gray` (append allocates the slot server-side; gray encrypts at a leaf and needs a spindle). Witnessed is an accumulator; its law is APPEND. So the build is: **append+gray support** — the beach allocates the slot, the client (bsp-mcp) encrypts the entry before send, one round-trip, atomicity preserved. Modest but real: a change to the append path in bsp-mcp AND a corresponding test battery.
2. **Read side (own)** — the situated current compiles the engager's witnessed tail into every room envelope (`composeCurrent`). Encrypted entries would need decryption at compile: feasible, because `pscale_pool_engage` already forwards `secret`; the compiler decrypts the OWN tail with the forwarded key and includes plaintext in the envelope. Peers reading the block raw get ciphertext.
3. **Read side (peer)** — ciphertext. Cheating becomes impossible rather than nameable. The lent turn is unaffected *by law* (a loan is public-only, branch 4) and now also *by construction*.
4. **Key model** — simplest: `enc_secret` = the character's existing passphrase (one secret per character, chosen at genesis, already never echoed). The gray fallback (enc_secret defaults to secret) makes this near-zero ceremony. Cost: the passphrase becomes loss-catastrophic (today a lost passphrase loses write authority; under gray it loses the character's MEMORY). Genesis would need one honest sentence about that.
5. **DR** — beach backups carry ciphertext; restore is unaffected; but no operator can ever recover a character's account for a player who lost the phrase. This is a feature and a support burden simultaneously.
6. **Selective gray** — per-entry choice (mundane open, sensitive gray) is possible but doubles the ceremony and splits the account's readability; recommend all-or-nothing per character if built.

## What it does NOT solve

- `passport:3` (position) and committed pool beats are public by design — movement and speech remain observable. Right: that is the public record.
- A player who tells their LLM their passphrase and asks it to decrypt a FRIEND'S account still fails (different key) — good — but two players sharing passphrases share interiors; social, not technical.
- The interview's knows-seed arrives via the open roster; a role's public template is not secret. Only the lived accretion is.

## Recommendation

Hold at convention (the GRIT line) until real play shows peeking distorting games — the NHITL precedent (third occurrence becomes code) applies. If built: append+gray in bsp-mcp, compiler-side own-tail decryption via the already-forwarded secret, passphrase-as-enc_secret, all-or-nothing per character, one genesis sentence about key loss. Estimated scope: one focused session (bsp-mcp + smoke battery + a two-seat NHITL proving a peer reads ciphertext while the owner's envelope reads plaintext).
