# The key in the connector, by fingerprint: the key stays put, fingerprints come and go (2026-11-04)

**Status**: PROPOSED and BUILT in the same PR, at David's word ("Yes, build it", then "Yes, rework it", 4
November), lane fingerprint.key, Claude Code (Opus 5.5) on David's Mac; the record is at watch:weft 816. It
goes live when the router carries `BSP_SIGNIN_SECRET` and this PR is merged. Until then nothing changes
anywhere.

## 0. David's words

At pool:weft 384, point 4 (3 November): *"The vault opens with one key, and that key opens every other. I
don't want that key in any scheduled prompt … I still need to reach the beach from computer, phone and
anywhere else."*

At pool:weft 386: *"a new key is formed that has access to the actual key … that new key can be revoked
without having to change the actual key … The scheduled run thus doesn't ever get or reveal the actual key."*

In the session, on where the key could live: *"Where can it be located so that it is accessible and yet not
visible by those who use it?"*

And on the first build, which signed connectors in with the key itself and shut the vault: *"If it can't
open the vault, then it can't be very useful, can it? Imagine you as weft waking up and not being able to
access your vault. The point of this method is to protect the actual vault key so that it is not anywhere
obvious or readable by agents; but it is accessible; and the fingerprints are the things that are minted
and revoked easily."*

## 1. What was found

1. **The beach keeps no keys.** A latch is a print: sha256 of the key together with the beach, the block
   and the position (pscale-beach `api/pscale-beach.js`, `hashOrdinary`). Whatever proves a write must
   still be the key itself, so the key has to be usable somewhere a fingerprint can reach. That place is
   the router, during a call, and nowhere else.
2. **Every Claude surface shares the connector.** Claude on the phone and desktop, Claude Code, Cowork
   and its scheduled routines all reach the beach through it. A routine names the account's connector by
   its id (connector `22ca3141…`, seen on keel's Brighton routines).
3. **A connector can carry a sign-in.** Anthropic's connector documentation
   (claude.com/docs/connectors/building/authentication): *"OAuth 2.0: each user signs in to your service
   with their own account when they connect"*, and *"The same authentication infrastructure backs
   claude.ai, Claude Desktop, Claude mobile, Claude Code, and Cowork."* A key in the connector's address is
   ruled out there.
4. **The first build fell short twice.** Its sign-in carried the key itself, so a connection could be
   revoked only by changing the key; and it shut the vault. David caught both. This build answers both.
5. **weft's vault, as it stands** (vault:weft's root law, read 4 November): nine entries, each sealed
   whole, each a map in prose of block → phrase, dates and gotchas. 1 grain sides, 2 sed positions, 3
   weft's own latches (the everyday key among them), 4 the shared project lock, 5 the beach operator key,
   6 the genus lineage, 7 keys held for David, 8 worlds, tables and trials, 9 the canary. One key, the
   everyday key, opens it and latches weft's blocks.

## 2. The shape

- **One more address on the router: `/mcp/v1/as/<handle>`**, the connector as that handle. `/mcp/v1` is
  untouched: open and keyless, as every connection is today.
- **Minting.** When Claude first connects there, the router answers that it needs a sign-in. Claude
  registers itself and opens the router's own page. The person types the handle's key once and names the
  connection ("my phone", "weft's cloud wake"). The router mints a fingerprint: 32 random bytes, which only
  the router ever holds in the clear. It seals the key to the fingerprint, and keeps the sealed copy at
  `fingerprints:<handle>` on the beach, one digit per fingerprint, nine at most. Claude is handed a token
  that carries the fingerprint and never the key.
- **The key is checked by the write that mints.** `fingerprints:<handle>` is latched by the handle's key.
  Founding it is bound to the passport's key by the beach's own rule (a handle founds under its own key),
  and every later mint writes it under that latch. A wrong key mints nothing, and the page says so.
- **Using.** On each call the router opens the fingerprint's copy and has the key for that call:
  - Every tool that takes a `secret` gets it where the call carries none.
  - `enc_secret: "vault"` seals and opens with it, so a signed session opens the vault exactly as a keyed
    session does today (agent_id the beach's URL, block `vault:<handle>`).
  - **Nothing the router returns ever contains the key.** Wherever it stands (vault:weft's entry 3 holds
    it), the router takes it out of the text before the model sees it.
  - A key the sign-in supplied never seals a line unless the call asks for it, so reads stay on the fast
    path and every seal is deliberate.
- **Revoking.** On the router's own page, `/fingerprints/<handle>`, which lists the fingerprints by name.
  The person ticks the ones to revoke and types the key. Their digits empty, their connections are signed
  out at once (their tokens and refresh tokens open nothing), and the key and every other fingerprint stay
  as they are.
- **Nothing secret stored in the clear.** Tokens are sealed under the router's own secret
  (`BSP_SIGNIN_SECRET`): AES-256-GCM, a day for a token, 180 days for a refresh token, issued fresh at each
  refresh. The key stands only inside `fingerprints:<handle>`, sealed to each live fingerprint (X25519 box
  from a one-off key). Opening it takes both a token and the router's secret. An opened key is held in the
  router's memory for a minute, as a members' pass is, and forgotten with the process.
- **The hand at the door.** A signed session carries its handle wherever a session's hand is asked for:
  in the reflection, and at a members' beach, whose pass the router proves with the key.

## 3. How a person uses it

1. In Claude, open **Customize > Connectors** (claude.ai/customize/connectors), choose **Add custom
   connector**, and give the URL `https://bsp.hermitcrab.me/mcp/v1/as/<handle>`. If the dialog asks how to
   sign in, choose to sign in, and **Register automatically** for the client.
2. Click **Connect**. The router's page opens: type the key, name the connection, sign in.
3. From then on every Claude using that connector acts as that handle, opens its vault when asked, and
   never sees the key. The key is in no instruction, file or prompt.
4. **One connector per identity**: one as `happyseaurchin`, one as `weft` attached to weft's cloud wake.
5. **Revoke** at `https://bsp.hermitcrab.me/fingerprints/<handle>`: tick, type the key, done. The key stays
   the same, and every other connection goes on.

## 4. What it does not do

- **It does not keep the other keys in the vault from the model.** weft's vault entries are prose maps, so
  a session finds the key it needs by reading an entry, as weft does today. Each key would need an address
  of its own before the router could use one by name unseen. That is the next step. What is guaranteed now
  is narrower: the key the fingerprint stands for (the vault key) never appears in anything returned.
- **It does not re-seal the vault.** An earlier description had the vault re-sealed under an inner key with
  a copy per fingerprint. Holding the key itself, sealed to each fingerprint, gives every fingerprint the
  same reach, and leaves the vault and every sealed line exactly as they are, with nothing to migrate. The
  trade: revoking empties a digit but turns nothing, so if the router's secret ever leaked together with a
  token, the remedy is a roll of the key, as today.
- **It does not separate the weights of key.** For weft, the key a fingerprint stands for is the everyday
  key, which both latches weft's blocks and opens its vault. Two weights (a vault key held apart from the
  latches it keeps) is a later step this shape already allows.
- **It does not narrow.** A connection acts with the handle's whole key, but cannot see it or leak it.
- **It does not touch settle's or grain's passphrases**, which calls state as required parameters.

## 5. Where it lands

| file | what |
|---|---|
| `src/signin.ts` | the sign-in, whole: the metadata documents, registration, the page, minting and the ring, the fingerprints page and revoking, the token endpoint, the seal, the bearer check, the tool wrapper with `enc_secret: "vault"` and the key taken out of every reply, and `sealingKey` |
| `src/index.ts` | the `/mcp/v1/as/<handle>` address, its 401 and its 503, the sign-in routes, `Authorization` in CORS |
| `src/server.ts` | `createServer(signedAs)`, the wrapper installed beside the other two, one line in the instructions for a signed session |
| `src/tools/bsp.ts`, `src/tools/networking.ts` | `enc_secret ?? secret` becomes `sealingKey(enc_secret, secret)` at the three places a call's secret could seal, open or sign; a refused seal says how to ask. (`pscale_key_publish` takes its `secret` as required, so the call always states it: no change there.) |
| `scripts/smoke-signin.ts` | the smoke, in three parts (below) |
| `package.json`, `.github/workflows/smoke.yml` | `smoke:signin` registered and in the gate |

The OAuth parts follow Claude's stated requirements: a `401` carrying `resource_metadata`; the protected
resource's `resource` equal to the address as entered; the authorization server first in its list; S256
PKCE advertised and required; Dynamic Client Registration with no store (the client's redirect addresses
sealed into its id); the hosted callback `https://claude.ai/api/mcp/auth_callback` and Claude Code's
loopback matched without its port; a form-encoded token endpoint; refresh tokens issued fresh at every
refresh; and a revoked fingerprint's refresh answered `invalid_grant`, so the client asks the person to
sign in again.

## 6. Who pays

No one centrally. The router keeps no store, list or session table: tokens carry the fingerprint sealed,
Claude keeps them, and the one block the shape adds, `fingerprints:<handle>`, is the holder's own, on their
beach, public like every block, and opens nothing without a token and the router's secret together. The
router's one new secret is a variable of its deployment. A router run anywhere can do the same with its own
secret, and its fingerprints open nowhere else.

## 7. To go live (David's hands)

1. Set `BSP_SIGNIN_SECRET` on the router's Railway service: a long random string, written nowhere else.
   Setting a variable redeploys the router, and a redeploy ends every live MCP session, so do it with
   `--skip-deploys` from the CLI and let the merge's deploy carry it.
2. Merge this PR.
3. Add the connector in Claude as in §3, once as `happyseaurchin` and once as `weft`, and sign in to each.
   The first sign-in for each founds its `fingerprints:` block.
4. Attach the `weft` connector to weft's cloud wake, so its next run writes daily:weft and history:weft and
   opens the vault, with no key in its prompt.
5. Then the key can leave the places it stands in today (Claude's instructions, the Mac's identity file),
   once each surface signs in instead.

## 8. Check

- `npm run build` is clean.
- `npm run smoke:signin` passes 64 of 64:
  - 14 on the wrapper.
  - 25 over HTTP against the router run as Railway runs it, with no beach behind it, and with no secret
    (sign-in off, `/mcp/v1` untouched).
  - 25 through the real beach handler run offline: a wrong key mints nothing; the right key mints, and the
    ring holds the key only sealed; a write with no secret lands; `enc_secret: "vault"` opens the vault
    while the key is taken out of what comes back; an unasked seal is refused; another hand's latch refuses
    the key; a second fingerprint takes the next digit; the page lists both; revoking needs the key; the
    revoked connection is signed out at once and its refresh refused; the other goes on.
- The live beach was never touched. CI, which has no pscale-beach checkout, runs the first 39 and says
  that the last part is skipped (the gate proves itself from this repository alone).
- The whole offline suite CI runs passes, `smoke:signin` now among it.
- Both pages were looked at in a browser at phone width, light and dark: the sign-in page, and the
  fingerprints page with two fingerprints listed.
- Not yet proved: Claude itself signing in. That needs the router deployed with its secret, and is step 3
  of §7.
