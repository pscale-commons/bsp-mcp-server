# The key in the connector, by fingerprint: the key stays put, fingerprints come and go (2026-11-04)

**Status**: PROPOSED and BUILT in the same PR, at David's word ("Yes, build it", then "Yes, rework it", 4
November), lane fingerprint.key, Claude Code (Opus 5.5) on David's Mac; the record is at watch:weft 816. Live the same day: bsp-mcp #582, merged 4 November. **Amended the same day, §9**: the one address, `/mcp/v1/me`,
with the handle typed on the sign-in page, and "vault" standing for the key wherever a signed call would name it (bsp-mcp #594, merged 4 November). **Amended again on 5 November, §10**: a signed call sets a lock only to the key itself, and a
fingerprint is minted only for a handle whose passport stands (bsp-mcp #597, merged 5 November).

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

## 9. Amendment: the one address, and "vault" wherever a key is named (4 November, afternoon)

**Status**: PROPOSED and BUILT in one PR, at David's word ("Yes, build it"). It goes live when merged; the
router's secret is already set.

### 9.1 David's words

On where a connection's handle should live: *"I think the one address and the sign-in page carries the
handle is the better design."* On the two addresses side by side: *"Ah, ok, so /me is the generic user and
/as/<handle> is for an agent; that is good I think."*

### 9.2 What was found

1. **One address per identity was a chore.** A connector's address named its handle, so every person
   needed to be told their own URL, and a mistyped handle in the URL could only fail at the key.
2. **A client account adds any one address once.** So a second identity on the same account, David's
   account holding weft beside himself, still needs an address of its own.
3. **A signed connection could not found a block under its key.** The weaver's first signed run (4
   November, 15:18Z) wrote its archive, archive:portal:2026-11-04, unlatched: it could pass the key as
   proof without seeing it, but never as the lock a new block takes. Founding a colour (`src/tools/bsp.ts`,
   a colour is latched whole by its keeper) and any new block named for the handle hit the same wall.

### 9.3 The shape

- **`/mcp/v1/me` is the address to give anyone.** It answers 401 and points at its own metadata like
  `/as/<handle>` does. Its sign-in page asks for the handle as well as the key, with no automatic capital
  letter (a phone's first-letter capital once split a handle in two). The fingerprint is minted for the
  handle typed, and a key that does not open that handle's blocks mints nothing, exactly as before.
- **The token is bound to the address it was minted at.** A token from `/me` opens `/me`, for the handle
  that signed in there, and nothing else; a token from `/as/<handle>` opens only that address.
- **`/mcp/v1/as/<handle>` stays**, for a second identity on one client account: David at `/me`, weft at
  `/as/weft`, both on his account.
- **"vault" wherever a signed call would name the key.** `secret: "vault"`, `enc_secret: "vault"` and
  `new_lock: "vault"` each become the connection's key at the router. `new_lock: "vault"` is the new one:
  it latches a new block under the key, so a signed connection founds its own blocks, archives and
  colours locked, without ever seeing the key it locks them with.
- **An unsigned call that names "vault" is refused before it reaches the beach.** There the word would
  itself become the key: a latch anyone could open, a seal anyone could read, a key pair anyone could
  derive.

### 9.4 What it still does not do

- **It does not narrow what a connection may do.** A signed connection can still rotate or relinquish a
  latch it holds, by passing `new_lock` with another value or empty, as anyone holding the key can. A
  misled agent could therefore move a block to a key it was handed. Refusing every `new_lock` but "vault"
  on a signed call would close that, at the cost of a signed hand founding a block under any other key.
  That choice is David's, and this PR leaves it open. **Closed on 5 November at his word, §10.**
- **It does not lock the archive the weaver already wrote open.** archive:portal:2026-11-04 stands
  unlatched until a signed hand latches it with `new_lock: "vault"`, a homestead its own keeper may make.

### 9.5 Where it lands

| file | what |
|---|---|
| `src/signin.ts` | `ANY`, the path `/me` in `asHandle`; `/me`'s metadata and 401; the page asking for the handle; `authFor` taking whichever handle a `/me` token carries, bound to `/me`; "vault" in `secret`, `enc_secret` and `new_lock`; the unsigned "vault" refused; the instructions line |
| `src/index.ts` | the session takes its handle from the token, so `/me` signs a session in as whoever signed in there |
| `scripts/smoke-signin.ts` | 24 checks more (below) |

### 9.6 Check

- `npm run build` is clean.
- `npm run smoke:signin` passes 88 of 88:
  - 20 on the wrapper: "vault" in each of the three fields; a call's own `new_lock` kept; an unsigned call
    naming "vault" in each field refused, running nothing.
  - 32 over HTTP with no beach behind the router: `/me`'s 401 and its pointer, its metadata, its page
    asking for the handle, a typed handle that is not a handle, no mint with no beach, a forged bearer, and
    `/me/more` no address.
  - 36 through the real beach handler run offline: at `/me` a key that does not open the typed handle
    mints nothing, the right one mints for it, its token writes as that handle, a `/me` token is refused at
    `/as/ada` and an `/as/ada` token at `/me`; `new_lock: "vault"` founds a block the open endpoint
    cannot write and the signed hand can; `secret: "vault"` writes; "vault" through the open endpoint is
    refused.
- The live beach was never touched.

## 10. Amendment: a lock is set only to the key, and a handle must stand (5 November)

**Status**: BUILT at David's word, in one PR with both parts. It goes live when merged.

### 10.1 David's words

Asked to explain §9.4 and why it was proposed, then asked *"Shall I move your brief to the signed
connector, with the lock guard too?"*, David answered: *"Yes, both"*.

### 10.2 What was found

1. **One act on a signed connection could not be taken back.** A bad write can be repaired, because the
   block stays under the holder's key. A lock moved to another key, or opened, cannot: the key no longer
   opens the block, and revoking the fingerprint does not return it. The worst targets are the handle's
   passport and shell, and its ring of fingerprints: a ring moved off the key could no longer be revoked
   on the fingerprints page, so the connection that moved it could not be signed out there, while it
   went on writing everywhere else with the real key. The new value would also have been typed into a
   call, a key in plain sight. One call does it, from an agent that invents a lock for a block it thinks
   needs one, or that follows an instruction in a block it read.
2. **A connection signed in as "me".** On 5 November David named his connector "bsp as me" and gave it
   the address `/mcp/v1/as/me`, after `/as/weft` and `/as/happyseaurchin`. An `/as/` address fixes the
   handle to the word after it, so the page signed him in as a handle called `me`, its field locked and
   nothing on it saying the address was the cause. No `passport:me` stands, so founding
   `fingerprints:me` was bound to no passport's key and took his. Two fingerprints stood there, the
   connection's instructions named it `me`, and the reflection showed him as `me`; he revoked both the
   same morning, and the page, asked again, offered only `me`. A key that does not open a handle's
   blocks still minted nothing; a handle with no blocks had nothing to refuse it with, so anyone could
   have taken a ring for a handle not yet founded, at `/me` by typing it or at `/as/` by naming it.

### 10.3 The shape

- **A signed call sets a lock only to the key itself.** Where the router put the key into the call (no
  secret, or `secret: "vault"`), any `new_lock` but `"vault"` is refused before the tool runs: another
  key, an empty one and null alike. Moving a block to another key, or opening it, takes the key in hand.
  A call that brings its own key, as `secret`, is untouched: the guard binds the fingerprint, not the
  key. The connection's instructions line says so.
- **A fingerprint is minted only for a handle that stands.** Before minting, the router reads
  `passport:<handle>`; where none stands, the page says the typed name is not a handle on this beach and
  mints nothing, with no ring founded.
- **An address that fixes a handle nobody holds says so first.** At `/as/<handle>` the page reads the
  passport before it asks for a key; where none stands it says there is no such handle on this beach and
  gives the address to sign in as oneself, `/mcp/v1/me`. A beach that does not answer is no reason to
  turn a sign-in away there: minting says so.
- **The page names the field plainly.** At `/me` it reads "Your handle, the name your blocks are under".

### 10.4 What it does not do

- **It does not move a connector's address.** A token is checked against its fingerprint's digit, not
  its passport, so a connection signs in as whatever its address and its page fixed. David gives his
  connector the address `/mcp/v1/me` and types `happyseaurchin`. The `fingerprints:me` ring stays,
  latched by his key, with both its digits revoked.

### 10.5 Where it lands

| file | what |
|---|---|
| `src/signin.ts` | the lock guard in `installSignedIn`; `passportStands` read before `mint` and before an `/as/` page; `noSuchHandle`; the page's label; the instructions line; the header and the wrapper's comment |
| `scripts/smoke-signin.ts` | 17 checks more (below) |
| `proposals/2026-11-04-the-key-in-the-connector.md` | this section; §9.4 closed |

### 10.6 Check

- `npm run build` is clean.
- `npm run smoke:signin` passes 105 of 105:
  - 25 on the wrapper: another key, an empty lock and null each refused with the key put in, running
    nothing; the same with `secret: "vault"`; a call bringing its own key moves its own lock; the key set
    to the key stands.
  - 33 over HTTP with no beach behind the router, the page's label among them.
  - 47 through the real beach handler run offline: at `/me`, `me` and `bob` (a handle with a journal but
    no passport) each mint nothing and found no ring; `/as/me` is refused before any key is typed,
    pointing at `/me`, and a sign-in posted there mints nothing; a signed call can neither move `notes:ada` to
    another key nor open it, and the signed hand still writes it; the key in hand still moves the lock,
    and after that the fingerprint no longer opens the block.
- The live beach was never touched.
