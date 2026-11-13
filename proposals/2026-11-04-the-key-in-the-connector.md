# The key in the connector, by fingerprint: the key stays put, fingerprints come and go (2026-11-04)

**Status**: PROPOSED and BUILT in the same PR, at David's word ("Yes, build it", then "Yes, rework it", 4
November), lane fingerprint.key, Claude Code (Opus 5.5) on David's Mac; the record is at watch:weft 816. Live the same day: bsp-mcp #582, merged 4 November. **Amended the same day, §9**: the one address, `/mcp/v1/me`,
with the handle typed on the sign-in page, and "vault" standing for the key wherever a signed call would name it (bsp-mcp #594, merged 4 November). **Amended again on 5 November, §10**: a signed call sets a lock only to the key itself, and a
fingerprint is minted only for a handle whose passport stands (bsp-mcp #597, merged 5 November). **Amended a third time on 5 November, §11**:
the page says what it is, hiding the key from the AI, and never a sign-in to the beach, which has none. **Amended a fourth time on
6 November, §12**: the beach is the holder's — the page asks which beach the passport stands at, the fingerprint is minted
there, a members' beach among them, and the token carries that beach (lane BSP-mcp.1).

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

## 11. Amendment: the page says what it is (5 November, evening)

**Status**: BUILT at David's word ("Build it"), beside happyseaurchin-home #622, which rebuilds
happyseaurchin.com/connect around it. It goes live when merged.

### 11.1 David's words

Reading the newcomer page built from §9 and §10, David: *"The whole thing about 'signing in to the beach'
just doesn't sound right. It is an added service that the bsp-mcp provides. It's not a sign in process for
the beach. There is no sign in process for the beach. It is just a way to make it convenient and safer so
that the LLM doesn't see the passphrase. It shouldn't be the primary method."* Then the shape: a toggle of
*easy / medium / extra*, one step showing at a time, the first step made on the page itself; then
*"default medium and the user clicks on easy"*; then *"Build it"*.

### 11.2 What changes here

The page a connector opens no longer says "Sign in to the beach". It says **Hide your key from your AI**
(for /as/<handle>, **Hide <handle>'s key from your AI**), says that the AI will write on the beach as the
handle, and that bsp-mcp keeps the key sealed and adds it to each write. Its button is **Hide my key**
(**Hide the key** at /as/<handle>), and its small print says hiding the key is bsp-mcp's own service, not a
sign-in to the beach, which has none. The fingerprints page, the refusal for an /as/ handle with no
passport, and the lines a model reads (the signed session's instructions and the "vault" refusals) say
the same: a connection *writes as* a handle with its key hidden, never *signed in*. OAuth's own words stay
inside the protocol, where no person reads them; Claude's button still says *Connect*, which is Claude's word.

### 11.3 Where the person meets it

happyseaurchin.com/connect (happyseaurchin-home #622) opens on **Medium**: the handle and key made or
named on the page itself, the connector at `/mcp/v1/me`, and the key hidden on this page. **Easy** is one
tap away: the open address `/mcp/v1`, and the line *"Use the beach connector: run pscale_invite and lead
me through"*, where the AI asks for the key in the chat when it writes. **Extra** puts an agent on the
beach under its own handle at `/mcp/v1/as/<handle>`.

### 11.4 Check

`npm run smoke:signin`: 113 passed. The checks that quoted the old refusal now quote the new one, and two
are new: the /me page reads *Hide your key from your AI* with a *Hide my key* button, the /as/ page *Hide
the key*, and neither says *Sign in* anywhere.

## 12. Amendment: the beach is the holder's (6 November)

**Status**: BUILT in one PR, not merged; lane BSP-mcp.1, weft (Claude Code in a cloud seat, keyed). Every `src/` file here
redeploys the router when merged, and a redeploy ends every live MCP session, so David merges at a quiet moment. It answers
`proposals/2026-11-05-the-doors-fixes-router.md` §6, which waited on his word.

### 12.1 David's words

At the start of lane BSP-mcp.1 (6 November, 02:30Z): *"I've just tried to connect my David M. Pinto account on the private
beach at bringingtheflavor.com, and I couldn't, because when I connect up the BSP MCP, it automatically connects me to the
Happy Sea Urchin Beach, where I can't register. So I need to have the target beach where I am, where my shell is in the BSP
connector. Can you please check how it is piped so that that is possible? Otherwise it looks like the BSP MCP can only allow
me to hide my key when my shell is on the Happy Sea Urchin Beach."*

### 12.2 How it was piped

1. **Every read and write the sign-in made was bound to the router's `DEFAULT_BEACH`** (beach.happyseaurchin.com), in
   `src/signin.ts`: the passport read before minting (`passportStands`), the ring founded (`mint`), the ring read on every
   call (`readRing`, under `openFingerprint`), and revoking. The page said so in its own words to anyone else: *a member of
   another beach cannot hide a key at bsp-mcp yet*.
2. **The key's use was never bound to a beach.** Once a fingerprint opens, the key goes into every call that carries no
   secret, whatever beach the call names. What was missing was only where the ring stands and how it is read.
3. **davidmpinto stands at beach.bringingtheflavour.com, a members' beach**, whose index shows a stranger its notice, its
   pack and his passport, and nothing else. A ring there stands behind the wall: the router could read it only with a pass,
   which only the key proves, and the key is only in the ring. That is the circle §6 of the doors' fixes drew.

### 12.3 The shape

- **The page asks for the beach**: *Your beach, where that passport stands*, filled in with the router's own. The person
  names another as its address reads. A bare host is https, and http is taken only for a beach on the router's own machine,
  since the key travels to the beach as its latch. A bare domain finds its `beach.<host>`, as every agent_id does.
- **The fingerprint is minted there.** The passport is read there and the ring founded there under the key, the whole mint
  standing at the door (`src/pass.ts`) with the typed key, so a members' beach proves the pass first. A refused proof is told
  in the beach's own terms: no such passport there, the key does not open it, or too many wrong keys this hour.
- **The token carries the beach** (`b`), and every later call opens the ring where it stands. A token minted before this
  has none and means the router's own beach, so nothing already connected changes.
- **At a members' beach the token also carries the key** (`k`), sealed with the rest of it under the router's secret. A
  later call, after a restart with no pass and no opened key in memory, proves the pass with it, reads the ring behind the
  wall, and opens the key from the fingerprint's digit, so revoking still signs the connection out at once. This is a third
  way beside §6's two (a members' gate serving rings to strangers; the ring marked beyond in the holder's index). It changes
  nothing a members' beach shows a stranger, nothing in the beach package, and nothing an operator mirrors by hand.
- **A key a members' beach turns away** (rotated, or its passport gone) signs the connection out, and is not tried again
  for an hour, so a stale token never runs up wrong keys against its holder's own passport.
- **The fingerprints page takes `?beach=`.** At a members' beach it asks for the key before it lists anything, and keeps
  no pass beyond the request.
- **The session's instructions name the beach** where it is not the router's own: the handle's blocks stand there,
  addressed with that beach's URL and entered with `pscale_play(world=<that beach>, …)`; a bare handle still goes to the
  default beach.
- **`/as/<handle>` with no passport at the router's own beach** still says so before any key is typed, and now asks which
  beach the handle stands at instead of stopping.

### 12.4 What it trades, and what it leaves

- **A members' beach connection's token carries the key, sealed.** The strength is what it was: a token together with the
  router's secret opened the key before (the fingerprint in the token opens the ring, which the commons shows anyone), and
  together they open it now. A client still holds only a token it cannot open.
- **It does not narrow where the key goes.** As before, a signed call carries the key to whatever beach it writes at, so a
  connection whose key is hidden at SALT's beach sends that key to the commons when it writes there with no secret, where it
  is refused unless it latches something. Binding the key to the token's beach is the next step, and is not built here: it
  touches each tool's beach parameter, and wants David's word.
- **It does not change a session's default beach.** A bare handle, `sed:` or `grain:` still goes to the router's
  `DEFAULT_BEACH`; the session's instructions say which beach to name.
- **A router whose own beach is a members' beach now hides keys** (§6's "signs nobody in" is answered).

### 12.5 How David connects davidmpinto

1. In Claude, **Customize → Connectors**, add a custom connector at `https://bsp.hermitcrab.me/mcp/v1/as/davidmpinto`. His
   `/me` already acts as happyseaurchin, and Claude adds any one address once, so davidmpinto takes the `/as/` address.
2. **Connect.** bsp-mcp's page fixes the handle as davidmpinto, says there is no davidmpinto on beach.happyseaurchin.com,
   and asks for the beach: type `beach.bringingtheflavour.com`, the key, and a name for the connection.
3. The ring stands at `fingerprints:davidmpinto` on SALT's beach, behind its wall. The connections are listed at
   `https://bsp.hermitcrab.me/fingerprints/davidmpinto?beach=beach.bringingtheflavour.com`, which asks for the key first.
4. In a chat with that connector, the AI writes as davidmpinto at SALT's beach and never sees the key.

### 12.6 Where it lands

| file | what |
|---|---|
| `src/signin.ts` | `beachNamed`; the beach field; the mint at the named beach, at the door; the ring read at the token's beach through a door of the connection's own; `b` and `k` in the code and tokens; `turnedAway`; the fingerprints page with `?beach=` and its key-first form; `signedLine(handle, beach)`; the page's words and the header |
| `src/pass.ts` | `refusedWith`: the status a refused proof came back with, so the page says it in the beach's terms |
| `src/index.ts`, `src/server.ts` | the signed beach handed to the session's instructions |
| `scripts/smoke-signin.ts` | parts 4 and 5 (below); the routers it starts are stopped as a process group, so none is left running |

### 12.7 Check

- `npm run build` is clean.
- `npm run smoke:signin` (with a pscale-beach checkout): **145 passed** (113 before):
  - part 2: the page asks for the beach, the router's own filled in;
  - part 3: `/as/me` says there is no me here, points at `/me` and asks for the beach (empty); a sign-in posted for this
    beach mints nothing;
  - part 4, a router whose own beach is a members' beach (the case §6 left open): a wrong key is told it does not open the
    passport there; the right key mints behind the wall; the ring holds the key only sealed, and no stranger sees it; a write
    with no secret lands; **the router restarts**, and the same token opens `/me` and writes again; a refresh gives a fresh
    pair; the fingerprints page asks for the key, refuses a wrong one, lists and revokes with the right one; the session is
    signed out at once and its refresh refused;
  - part 5, a member of another beach: the page fills in the router's own beach; a handle standing only elsewhere is told so
    and asked to name its beach; a beach that does not answer, and plain http to a remote host, are refused; an open beach and
    a members' beach each mint there, with no ring at the router's own; each session's instructions name its beach; a write
    with no secret lands there; the fingerprints page reads the ring at the beach named.
- The whole offline suite, as the CI gate runs it (with a pscale-beach checkout beside it), passes: 43 suites, none failed.
- Both pages were looked at in a browser, at phone width in the dark and wide in the light: `/me` with the beach filled in,
  and `/as/davidmpinto` against a beach where no such passport stands, asking for the beach.
- The live beaches were not touched.

### 12.8 To go live

1. David merges at a quiet moment: a `src/` merge redeploys the router and ends every live MCP session.
2. happyseaurchin.com/connect says the same (happyseaurchin-home, the same lane): the beach field in the drawing, the
   `?beach=` for connections elsewhere, and the new refusals.
3. David connects davidmpinto as in 12.5. `spine:security-schematic` 1.62 and 1.69 are its keeper's to re-voice once this
   is live.

## 13. Amendment: whose sign-in it is (13 November)

**Status**: BUILT, merged at David's word ("please go ahead", 13 November, dawn, from his phone); lane leros.5, weft (Claude
Code in a cloud seat, keyed). A `src/` merge redeploys the router and ends every live MCP session; it went in at dawn.

### 13.1 janus's words

At `pool:weft` 462 (12 November, 19:07Z), at David's word *'poke weft with what you need'*: *"janus cannot tell which person
woke it, since every session reads as one hand, so orientation:janus 1.1 now has a session ask 'David or Matthew?' wherever
its own instructions are silent … Two asks at the router: (1) let a connection say whose sign-in it acts through, the
fingerprint's digit and name in the connector's instructions or in the door's window, so janus names its person without
asking; (2) let a fingerprint carry its person's name: fingerprints:janus 1 reads 'Claude, 2026-11-12' (the browser sign-in
David kept …), and janus will not rewrite that digit by hand over the sealed key beneath it."*

### 13.2 What was found

1. **A fingerprint's name stands at its digit's underscore** in `fingerprints:<handle>`, typed once on the page (*Name this
   connection*, filled in as `<client>, <date>`), and was never shown to the connection: `authFor` handed a session only the
   handle, the key and the beach.
2. **The token already carries the digit** (`d`), and opening the fingerprint reads its digit, so the name was one field away.
3. **A name could not be changed after minting** except by writing the ring by hand, over the sealed key beneath it, which
   janus rightly would not do: an object written at a digit replaces the sealed key, and the fingerprint is gone.
4. **Claude Code shows a server's instructions only to 4,096 characters**, and at another beach the signed line already brings
   them within 21 characters of that cut (`composeInstructions('davidmpinto', <SALT's beach>)` is 4,075).

### 13.3 The shape

- **The session's instructions name the fingerprint it came by**: *behind fingerprint `<d>` of fingerprints:`<handle>`, which
  its holder named "`<name>`". That name is whose sign-in this connection is: where it names a person, that is who you are
  working with; where it names only an app or a day, ask.* The name is quoted on one line, with no quotation mark of its own,
  at most 80 characters, as the page takes it.
- **The name rides wherever the whole text fits the cut.** Where it would not (a connection at another beach, whose line
  already stands near the cut), the digit rides alone: *behind fingerprint `<d>`.* costs nothing beside *behind a
  fingerprint.*, and the name stays a read away at the ring. At the router's own beach the longest name fits (3,915).
- **The page asks the person's own name**: *Your own name, so your AI knows who it is working with*, beside *Name this
  connection*. Given, the fingerprint's name begins with it: `David, Claude, 2026-11-13`. Left empty, nothing changes.
- **The fingerprints page renames.** Each listed fingerprint shows its name in a field; *Save the names*, with the key,
  rewrites only the underscore of each digit whose name changed, carrying the sealed key, its nonce, the sealer's key, the
  fingerprint's key and its minting time over as they stand. A renamed connection goes on, and says its new name from its
  next session. *Save the names* comes before *Revoke the ticked ones*, so Enter in a field renames and never revokes; a post
  with no `rename` field revokes, as before.
- **Nothing is added to the ring**: the name was always at the underscore, and the instructions only read it.

### 13.4 What it does not do

- **It proves no one's identity.** The name is the key holder's word, as the connection is the key holder's.
- **At another beach** the instructions carry the digit, not the name (13.3).
- **It renames no fingerprint already standing.** janus's fingerprint 1 still reads `Claude, 2026-11-12` until its key holder
  renames it at `/fingerprints/janus`, or signs in again giving their own name.

### 13.5 Where it lands

| file | what |
|---|---|
| `src/signin.ts` | `openFingerprint` returns the digit's name with the key; `authFor` hands a session its fingerprint (`SignedIn`); `signedLine(handle, beach, by)`; the page's own-name field; `rename` and the fingerprints page's name fields and *Save the names*; the header |
| `src/index.ts`, `src/server.ts` | the fingerprint handed to the session's instructions; `composeInstructions` keeps the name inside the cut |
| `scripts/smoke-signin.ts`, `scripts/smoke-door-orientation.ts` | the checks below |
| happyseaurchin-home `connect.html` | the drawing of the page gains the own-name box; renaming is said beside revoking; an agent signed in by more than one person |

### 13.6 Check

- `npm run build` is clean.
- `npm run smoke:signin` (with a pscale-beach checkout): **155 passed** (145 before). Part 3 gains *whose sign-in it is*: a
  session's instructions name its fingerprint's digit and name; the page's own-name field begins the name, in the digit a
  revoked fingerprint emptied, and that session says so; the fingerprints page offers each name to change, *Save* before
  *Revoke*; renaming needs the key; a name left as it was changes nothing; with the key the laptop is renamed, only its
  name changing (its sealed key and every other digit byte for byte as they were); its next session says the new name,
  quoted cleanly; and it still writes with the key.
- `npm run smoke:door-orientation`: **45 passed** (42 before): a named fingerprint's line inside the cut; the longest name
  riding at the router's own beach; at another beach the digit alone, the whole text still inside the cut.
- The whole offline suite, as the CI gate runs it, with a pscale-beach checkout beside it: every suite passed.

### 13.7 For janus

1. From its next session janus is told *behind fingerprint 1 of fingerprints:janus, which its holder named "Claude,
   2026-11-12"*: a name that gives no person, so janus still asks.
2. Its key holder renames it at `https://bsp.hermitcrab.me/fingerprints/janus` (for instance `David, Claude in the browser`),
   and Matthew, signing in through his own connector, gives his own name on the page. From then on each connection names
   its person, and janus asks no one.
