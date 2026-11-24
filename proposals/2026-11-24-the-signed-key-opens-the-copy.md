# The signed key opens the holder's copy at the stream and room doors

24 November 2026 · weft (lane signed-seal.1) · at David's "yes, go ahead"

## What

Through a signed connector (`/mcp/v1/as/<handle>`, `src/signin.ts`), `pscale_stream_engage` and `pscale_pool_engage` now open the holder's own copy of a colour with the key the connection signed in with, when the call passes no `secret`. In a coloured family or room:

- a holder's say, keep, commit or stage is sealed with the colour's current turn key from their own copy, not as a letter, and reads back as words in the same session;
- a holder's read opens the colour's lines, with nothing opened first through `bsp()`;
- a hand the colour's ring does not name still writes a letter and still reads grey lines, as before.

The code is one line in each tool: the sealing word is the call's `secret`, which the sign-in fills with the key, where it was `sealingKey(undefined, secret)`, which drops a key the sign-in supplied. `sealingKey` itself is unchanged, so `bsp()` and `pscale_networking` still seal and sign with that key only when asked (`enc_secret: "vault"`). No tool's wording changes: both `gray` descriptions already say the copy is opened "by `secret` as the sealing word", and the router now puts the key there.

## Why

The gap was first seen in lane colour-admin.1 (`watch:weft` 1146). It was weighed in this lane (`watch:weft` 1159) and found to be observably what is missing.

- Read the way `function:admin`'s own root says to read it, `pscale_stream_engage(field='admin', at='today')`, weft's own line came back grey to weft, its holder.
- A say there landed as a letter its writer could not read back, so the write's read-back failed in the session that made it (strata 1.2111).
- The way round it, one `bsp()` read with `enc_secret: 'vault'` first, stood only at `ways:grain` 7.1111, a grain room's way that the admin family never delivers.

A block could not carry this. The seal is made inside the tool at the moment of the say, and a block acts only through a mind that read it just before. Carrying it in blocks would mean copying one connector's quirk into the law of every coloured family.

## What stays

- **Whether a line is sealed** is decided by the family's law (`SEALED IN colour:<name>`), the room's purpose, or `gray`, exactly as before. The key decides only whether its holder reads the line. So the rule of 4 November ("a key the sign-in supplied never seals a line unless the call asks for it … every seal is deliberate", `2026-11-04-the-key-in-the-connector.md`) still holds: no line is sealed here that was not sealed anyway.
- **`spine:coloured-stigmergy` 1.8** kept the sealing word apart from the latch, and `2026-11-05-the-derived-latch.md` made that one word with two keys. Neither `passport:weft` 9 nor `passport:happyseaurchin` 9 carries the derived-latch marker yet, so on those connectors the key is still latch and sealing word at once. It is the same key, opening the same copy, that `bsp()` with `enc_secret: "vault"` already used. Nothing is exposed that was not exposed before.
- **The cost** is one key derivation for each session and word, paid only where a coloured line is met, as for any keyed reader (`wearFor`, `keyOfTurn`). A read that meets no coloured line derives nothing.

## Checked

`scripts/smoke-colour-default.ts` section 4 drives both doors through `installSignedIn`, as the router installs it, each in a session that opened nothing first:

- a holder's say is sealed with their copy and reads back as words;
- a holder's read opens the colour's lines;
- a hand holding no copy writes a letter and reads grey lines;
- a holder's commit is sealed with their copy;
- a holder's read of the room opens its lines;
- a hand holding no copy writes a letter in the room;
- no reply carries the key.

On the code before this change, the five holder checks fail and the rest pass. After it, the run is 35 passed, 0 failed. `smoke:signin`, `smoke:colour`, `smoke:private-room`, `smoke:derived-latch`, `smoke:seal-price` and `smoke:key-guard` pass unchanged.

## After the merge

The merge redeploys the router at bsp.hermitcrab.me and ends every live MCP session, so it is made at a quiet moment. Once it is live, `ways:grain` 7.1111 drops its last sentence, since a say through a signed connector then seals with the holder's own copy.
