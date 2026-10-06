# The voice mirror — stage one of the bobble

A phone number that answers from your own shell on the beach. The bobble's road begins here
(`spine:bobble` 8.1, step 3.1): prove the voice before building the object. The reasoning is in
[`proposals/2026-10-04-the-bobble-a-thing-on-the-beach.md`](../proposals/2026-10-04-the-bobble-a-thing-on-the-beach.md).

## What a call does

1. **Before the first word.** OpenAI posts `realtime.call.incoming` to this gateway. The caller's
   number picks a handle from `CALLERS`. The beach's own door (`handlePlay`, the one every session
   boots through) then compiles that shell (passport, the manifest's dialled blocks, their room)
   into the voice's instructions. The caller hears a ring or two while this happens.
2. **During.** The call is accepted into OpenAI's realtime model, with the beach's MCP server as its
   one tool server, limited to `bsp()`, for anything the compiled window does not already hold.
3. **After.** One log line of measurements:
   `call happyseaurchin · 3.2 min · 14 turns · answer starts after 0.84 s (median) · tokens in 41000 out 2100`.
   If the holder asked for a record, the turns are appended sealed (§ A sealed record).

Unknown numbers are declined, so nobody else's talk spends the key.

## Set it up

This takes about an hour and costs about £2 a month, plus the talk.

1. **OpenAI.**
   - Use a project with Realtime access, and create an API key.
   - Under Settings → Project → Webhooks, add the endpoint `https://<your-gateway>/webhook` for the
     event `realtime.call.incoming`, and copy its signing secret (`whsec_…`).
   - Note the project id (`proj_…`).
2. **A host.**
   - Deploy this repository as a second service, on Railway or any Node 22 host.
   - Its start command is `npm run gateway`, and its environment is set as below.
   - On Railway, give it a config file of its own (an absolute path such as `/gateway/railway.json`)
     with its own watch patterns, at least `/gateway/**` and `/src/**`. The repository's root
     `railway.json` belongs to the router, and its patterns leave the gateway out.
   - Its public URL plus `/webhook` is the endpoint from step 1.
3. **A number.**
   - In Twilio, buy a UK number (about £1 a month).
   - Under Elastic SIP Trunking, create a trunk. Give it the origination URI
     `sip:<proj_id>@sip.api.openai.com;transport=tls`.
   - Attach the number to the trunk.
   - Any SIP provider works the same way.
4. **Who may call.** Set `CALLERS` to a JSON map of numbers to handles, such as
   `{"+447700900123": "happyseaurchin"}`. It stays in the host's environment: a phone number is
   personal data, and the beach is public by design, so numbers never go in a block.
5. **Call it.**

| variable | required | default | what it is |
|---|---|---|---|
| `OPENAI_API_KEY` | yes | — | pays for the calls this gateway answers |
| `OPENAI_WEBHOOK_SECRET` | yes | — | the `whsec_…` secret from the webhook endpoint |
| `CALLERS` | yes | — | number → handle, or number → `{handle, writeback, key_env}` |
| `BEACH` | no | `https://beach.happyseaurchin.com` | where shells are read |
| `MCP_URL` | no | `https://bsp.hermitcrab.me/mcp/v1` | the beach's MCP server, for lookups during a call |
| `REALTIME_MODEL` | no | `gpt-realtime-2` | the voice's model |
| `VOICE` | no | `marin` | the voice itself |
| `TRANSCRIBE_MODEL` | no | `gpt-4o-mini-transcribe` | transcribes the caller's words, for the record |
| `WINDOW_CHARS` | no | `24000` | cap on the compiled window |
| `PORT` | no | `8787` | the port to listen on |

## A sealed record, if you want one

Write the caller's entry as an object:
`{"handle": "happyseaurchin", "writeback": "<block>", "key_env": "<VARIABLE holding that handle's key>"}`.
After each call, the turns are appended gray (encrypted to that key) to the block named, and only
that key reads them back. Choose a block whose folds you keep, because an accumulator owes its
summaries as it grows (block-conventions 3.5). Records are off unless they are set.

Caller ID can be spoofed. A stranger with your number could therefore add a sealed record to that
block, though they could never read anything or write as you anywhere else. Per-device keys, at
stage three of the road, close that gap.

## What stage one measures

- **How fast an answer starts.** The log's median, from the caller falling silent to the voice's
  first audio. The aim is about a second.
- **What a minute costs.** The log's tokens, times the model's price.
- **Whether the beach makes answers better.** Ask the same three questions of ChatGPT's own voice
  mode and of this number: one about your week, one about a person in your room, one about a project
  you keep. Write which answered better, and why, in your mirror at `bobble:<your-handle>` 3.1
  (`pscale_stream_engage`, field `bobble`, at `3.1`).

## What it does not do yet

- It has no bobble firmware and no per-device keys. Those are stages two and three.
- It spends the host's model key. Opening each owner's own key (fuel in the vault) comes at stage
  three.
- It writes nothing to the beach during a call. `bsp()` can write to open blocks, so the
  instructions forbid it; enforcement waits for per-device keys.

## Tests

`npm run smoke:gateway`, offline, covers:

- the webhook signature;
- who is calling;
- the accepted session;
- the instructions, as the real door compiles them from an in-memory beach;
- the measurements and the sealed record;
- the refusals.
