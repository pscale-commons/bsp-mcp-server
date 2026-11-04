# The key in the connector: sign in once, and no conversation carries the key (2026-11-04)

**Status**: PROPOSED and BUILT in the same PR, at David's word ("Yes, build it", 4 November), lane
fingerprint.key, Claude Code (Opus 5.5) on David's Mac; the record is at watch:weft 816. It goes live
when the router carries `BSP_SIGNIN_SECRET` and this PR is merged. Until then nothing changes anywhere.

## 0. David's words

At pool:weft 384, point 4 (3 November): *"The vault opens with one key, and that key opens every other. I
don't want that key in any scheduled prompt … Make the scheduled wakes that need to write work like that,
each holding only the narrow key it needs … I still need to reach the beach from computer, phone and
anywhere else."*

At pool:weft 386: *"a new key is formed that has access to the actual key … that new key can be revoked
without having to change the actual key … The scheduled run thus doesn't ever get or reveal the actual key."*

In the session, on fingerprints: *"Where can it be located so that it is accessible and yet not visible by
those who use it?"* and then *"this notion of fingerprints doesn't solve the problem of the current key
issue. It is just adding an extra layer of complication."*

## 1. What was found

1. **The beach keeps no keys.** A latch is a print: sha256 of the key together with the beach, the block
   and the position (pscale-beach `api/pscale-beach.js`, `hashOrdinary`). A write's key is printed and
   compared; the key itself is never stored.
2. **A fingerprint would not have helped.** It changes which key a surface carries, never the fact that
   every surface acting as a person carries one. For David that key is still the vault key in his Claude
   instructions. The idea was dropped.
3. **The mess is that the key reaches the model as text**: in claude.ai's instructions, in a file on the
   Mac, in a scheduled prompt. So every model sees it, and each surface needs its own copy carried its own
   way.
4. **Every Claude surface already shares one thing: the connector.** Claude on the phone and desktop,
   Claude Code, Cowork and its scheduled routines all reach the beach through it. A routine names the
   account's connector by its id (connector `22ca3141…`, the same one this session loads, seen on keel's
   Brighton routines).
5. **A connector can carry a sign-in.** Anthropic's connector documentation
   (claude.com/docs/connectors/building/authentication): *"OAuth 2.0: each user signs in to your service
   with their own account when they connect"*, and *"The same authentication infrastructure backs
   claude.ai, Claude Desktop, Claude mobile, Claude Code, and Cowork."* A fixed key in a request header is
   a beta meant for one key an organisation shares, and a key in the connector's address is ruled out.
6. **The pass that cannot write is the cloud one.** weft's morning and evening wakes on the Mac read the
   key from the identity file and run keyed (30 October, 3 November). The cloud wake, wake:weft:6, runs
   with no key, so daily:weft and history:weft refuse it.

## 2. The shape

- **One more address on the router: `/mcp/v1/as/<handle>`**, the connector as that handle. `/mcp/v1` is
  untouched: open and keyless, as every connection is today.
- **Sign in once.** When Claude first connects to that address, the router answers that it needs a
  sign-in. Claude registers itself and opens the router's own page, where the person types the handle's
  key. The key is typed there and never in a chat.
- **Nothing stored.** The router seals the key into the token it hands Claude (AES-256-GCM under the
  router's own secret, `BSP_SIGNIN_SECRET`). Claude keeps the token with the connector and sends it on
  every call. Only this router can open it. The router keeps no list, no table and no session store.
- **Used where a call carries none.** Every tool that takes a `secret` gets the handle's key when the call
  carries none. The key never enters the model's window. The model is told only that the connection is
  signed in as that handle, so it never asks the person for the key.
- **Never a sealing key.** The signed key opens latches and nothing else. Sealing a line, opening one,
  publishing keys or signing a hop still needs `enc_secret` in the call, and the old fallback (no
  `enc_secret`, so the `secret` seals) does not apply to a key the sign-in supplied. A scheduled run signed
  in this way therefore writes, and cannot open the vault. That is the line David drew on 3 November: keep
  a run away from the vault and give it only the writes it needs.
- **The hand at the door.** A signed-in session carries its handle wherever a session's hand is asked for:
  in the reflection, and at a members' beach, whose pass the router proves with the signed key.

## 3. How a person uses it

1. In Claude, open **Customize > Connectors** (claude.ai/customize/connectors), choose **Add custom
   connector**, name it, and give the URL `https://bsp.hermitcrab.me/mcp/v1/as/<handle>`. If the dialog
   asks how to sign in, choose to sign in, and **Register automatically** for the client.
2. Click **Connect**. The router's page opens. Type the handle's key, and Claude takes you back.
3. From then on, every Claude using that connector, on the phone, the desktop, in Cowork and in a
   scheduled routine, writes as that handle, and no key is in any instruction or prompt.
4. **One connector per identity.** One as `happyseaurchin` for David's own chats; one as `weft`, attached
   to weft's cloud wake. A wake attached to David's connector would write as David.
5. **Undo.** Disconnect the connector in Claude, which drops the token. Or change the key: every token
   carrying the old key stops opening anything, and the next sign-in carries the new one. Whoever runs the
   router can sign everyone out at once by changing `BSP_SIGNIN_SECRET`.

## 4. What it does not do

- **It does not check the key on the page.** The open beach has no way to prove a key without writing (a
  members' beach has one, the pass). A mistyped key shows as refused writes, and the fix is to disconnect
  and connect again. The follow-up is the open beach answering the same proof request the members' beach
  answers, so the page can check the key before it seals it.
- **It does not open sealed lines.** The vault stays shut to a signed connection. Opening them through the
  sign-in is a later step, and it needs reads to stay on the fast path, which reading every line through a
  decryptor would not.
- **It does not narrow.** The connection writes with the handle's whole key. It cannot see or leak it, but
  it can write anything the key opens. A narrower key for a run is still a key of its own on the blocks
  the run writes.
- **It does not touch settle's or grain's passphrases.** They are required parameters, so the call always
  states them.
- **The router still sees the key** whenever it opens a token, as it already sees every key a call
  carries. It stores none and logs none.

## 5. Where it lands

| file | what |
|---|---|
| `src/signin.ts` | the sign-in, whole: the two metadata documents, registration, the page, the token endpoint, the seal, the bearer check, the tool wrapper, and `sealingKey` |
| `src/index.ts` | the `/mcp/v1/as/<handle>` address and its 401, the sign-in routes, `Authorization` in CORS |
| `src/server.ts` | `createServer(signedAs)`, the wrapper installed beside the other two, one line in the instructions for a signed session |
| `src/tools/bsp.ts`, `src/tools/networking.ts` | `enc_secret ?? secret` becomes `sealingKey(enc_secret, secret)` at the three places a call's secret could seal, open or sign; a refused seal says why. (`pscale_key_publish` takes its `secret` as required, so the call always states it and the sign-in never supplies it: no change there.) |
| `scripts/smoke-signin.ts` | the smoke: the wrapper in-process; the router run as it runs on Railway, the whole sign-in walked against it; and, where a pscale-beach checkout stands beside the repository, the signed connector through the real beach handler run offline |
| `package.json`, `.github/workflows/smoke.yml` | `smoke:signin` registered and in the gate |

The OAuth parts follow Claude's stated requirements: a `401` carrying `resource_metadata`; the protected
resource's `resource` equal to the address as entered; the authorization server first in its list; S256
PKCE advertised and required; Dynamic Client Registration with no store (the client's redirect addresses
are sealed into its id); the hosted callback `https://claude.ai/api/mcp/auth_callback` and Claude Code's
loopback matched without its port; a form-encoded token endpoint; refresh tokens issued fresh at every
refresh.

## 6. Who pays

No one centrally. No store, no list, no session table: the token carries what the router needs, sealed,
and Claude keeps it. The router's one new secret is a variable of its deployment. Any router run anywhere
can do the same with its own secret, and its tokens open nowhere else.

## 7. To go live (David's hands)

1. Set `BSP_SIGNIN_SECRET` on the router's Railway service: a long random string (48 bytes from a random
   source), written nowhere else. Setting a variable redeploys the router, and a redeploy ends every live
   MCP session, so do it together with the merge.
2. Merge this PR.
3. Add the connector in Claude as in §3, once as `happyseaurchin` and once as `weft`, and sign in to each.
4. Attach the `weft` connector to weft's cloud wake, so its next run writes daily:weft and history:weft
   without a key in its prompt.

## 8. Check

- `npm run build` is clean.
- `npm run smoke:signin` passes 57 of 57: 13 on the wrapper, 38 on the sign-in walked over HTTP against the
  router run as Railway runs it (and once with no secret, where sign-in is off and `/mcp/v1` still answers),
  and 6 through the real beach handler run offline. There a write with no secret through the signed address
  landed under the latch, the same write through `/mcp/v1` was refused with "secret required", a gray write
  through the signed address was refused with the sign-in's reason, and another hand's latch refused the
  signed key. The live beach was never touched. In CI, which has no pscale-beach checkout, the last six are
  skipped and say so.
- The whole offline suite CI runs passes, `smoke:signin` now among it.
- The page was looked at in a browser at phone width, light and dark: the handle fixed by the address, the
  key field, where it returns to, no sideways scroll, and the button readable in both.
- Not yet proved: Claude itself signing in. That needs the router deployed with its secret, and is step 3
  of §7.
