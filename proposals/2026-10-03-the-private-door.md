# The private door — a helper that answers one person at a time and keeps nothing (2026-10-03)

**Status:** proposed, and its first slice built, at David's word (*"yes write the proposal and build A"*),
lane helper.1, through Claude Code; the record is at watch:weft 514 (514.5 to 514.7). The code is in this
branch and runs nowhere until it is merged and a holder enrols a helper at the waker. The helper it was built
for, `lero-helper`, now has a shell at the apex.

## 0. David's words

The ask, 2026-10-03: an expert agent on the beach, *"paid for by the agency"*, that anyone can reach *"via an LLM
app or from a website or from the mirror"*, answers from *"its own knowledge base and how it works"*, keeps its
history private so the charity can learn from it, and gives *"a signal to the expert, a local expert"*; always on,
*"multiple people engaging at the same time"*.

And the design, once the problem was named (today's doorman answers into a public room):

> "Any request comes in. It goes through the orientation and then creates a response which it delivers. And there
> can be no saving on the beach whatsoever. Its output is external. And this output is either back to the source,
> as well as, for example, to Matthew or to the local or to a national individual through grain, perhaps, through
> some kind of private channel that's made opaque. And if it is a private channel that wants to have memory, then
> it is saved in a block, which is created precisely for that reason … It can create a specialized key. It puts
> that key in its vault. And so therefore it can deliver the key and therefore the content to any of the people
> entrusted with it."

## 1. What is asked

A door through which anyone may talk to a helper privately — many at once, day or night, paid for by the
organisation that keeps the helper — answered from the helper's own blocks, with nothing kept, and a note passed
to a person only when the asker wants that. The three kinds put to Matthew at pool:Phenomemental 32 map onto it:
kind 1 (about us only, public) is today's doorman in a room; kind 2 (private, and it forgets) is this door; kind 3
(private, and it remembers) is this door plus memory, a later slice (§4.2).

## 2. What stands

| mechanism | where | what it gives this |
|---|---|---|
| **The lite doorman** | `genus-one/waker.py` `lite_answer` (proposals/2026-09-01-the-doorman) | the composer: the handle's orientation compiled from its own manifest (`pscale_play` over the router), one call on the handle's fuel |
| **The dial** | `wake:<handle>` (ways:doorbell:1) | consent (1), the day's cap (2), the mind and its ceiling (beneath 9) — the holder's own law |
| **Fuel** | `pick_fuel`: asker, then holder, then beach | the organisation's key, deposited at enrolment, pays; the cap is the shadow of whoever pays |
| **Grains** | `pscale_grain_reach`; a grain write is gray by default | a sealed bilateral channel: only the two parties read it; the pair id is `sha256(sort(a,b)\|join('\|'))[:16]` (`src/locks.ts`) |
| **The push engine's wake event** | `push-engine` `match_and_deliver_wake` | a content-free ring to whoever watches the helper (`<agent> woke — rung by … — <status>`) |
| **Group gray** | `members` in `src/tools/bsp.ts` | one random key wrapped per reader, removal rotates — the "deliver the key to the entrusted" David describes; a group APPEND is refused today |
| **The vault** | ways:vault; vault:weft | the holder's keys, sealed; *machine credentials that spend money stay off the beach* (vault:weft root) |

**The one thing missing:** a way in that is not a public room.

## 3. The shape — the private door

### 3.1 The way in
`GET /ask?h=<handle>` serves a small page; `POST /ask {handle, turns}` answers. The page holds the conversation in
its own tab (`sessionStorage`) and sends it whole each turn; **Forget** clears it; closing the tab ends it. A
person in an AI app needs no door at all: their own AI reads the helper's public blocks and answers on their own
subscription (method D, §4.1).

### 3.2 The answer
The door compiles the handle's orientation exactly as the doorman does — so a helper deepens itself by filling its
own manifest, with no code change — strips the compile's clock line so the frame is byte-identical between turns
and the prompt cache keeps it, and makes **one** call on the handle's fuel under the door's stance
(`private_door.STANCE`), thinking off, the whole conversation as its turns. The answer goes back in the response.

### 3.3 Nothing kept
No beach write. No conversation in the service log (the tests hold this). Pacing counters live in memory only.
The model provider processes each call, as at every door; nothing else does.

### 3.4 Many at once
Nothing here takes the pulse lock; each request runs in its own thread of the waker's threading server. The
doorbell's one-at-a-time rule is untouched.

### 3.5 A note to a person
Only when the asker wants a person, and only what they agree to pass on, the model ends its reply with one line,
`SIGNAL <handle>: <what they agreed to pass on>`. The door takes the line out, checks that a grain between the
helper and that handle is **complete** (reached and accepted), appends the note **sealed** on the helper's side,
and rings the steward through the push engine with no content. Then the door — not the model — tells the asker
whether it got through, in a fixed line. **Who may hear** is whoever holds an accepted grain with the helper; the
helper's own law names them so the model can choose; local or national is which grain.

### 3.6 The governors
The dial's switch (the same switch as the doorbell); the day's cap — the dial's, bound by the holder's budget on
holder fuel and by the service's `MAX_DAILY` on the beach's; per visitor, a gap between asks and an hourly bound;
one note per visitor per span. Only a handle enrolled as a doorman (`lite`) has a private door — never a character,
never a genus instance.

### 3.7 What it does not do
No memory, no record on the beach, no new primitive, no change to bsp-mcp's twelve entry points or to the router.

## 4. The other methods, and memory

### 4.1 Five ways to hold many private conversations at once

| | the way | who can read | built |
|---|---|---|---|
| **A** | **this door** — nothing kept | the person's own tab; the steward reads only notes passed on | this branch |
| B | a sealed room per person, every line sealed to a key the person's page and the helper hold; rides the existing doorbell | the person and the helper; the outline shows | needs a per-room lock and the page to seal (`/vault.js` self mode) |
| C | memory the person owns, sealed under their own key | the person; the helper only while they unlock it; the steward what they share | a grain between them is the near version |
| D | their own AI wears the helper, on their own subscription | the person and their AI | works today, free to the organisation |
| E | a private beach behind a read-gate (proposals/2026-07-20) | the organisation's operator | unbuilt |

### 4.2 Memory, as David described it (kind 3)
A block per person, sealed under a fresh key, the key wrapped for each entrusted reader: this is group gray
(`members`), already built — the keyring IS the delivery of the key, and removing someone rotates it. The helper's
vault keeps its own keys. One limit: a group block cannot yet be appended to, so memory is a block the helper
rewrites (a running summary and the latest exchanges) until group accumulators land.

## 5. Two things the design needs

1. **Naming is not proof.** If memory opens when someone says "I'm Sam", anyone can say it. Memory opens only to
   the person's own key — the LERO pages already give each person a name and three words (a latch; a seal wants
   five or more).
2. **The outline shows.** Sealed content is unreadable, but a block's existence, size and changes are public.
   Name memory blocks with an opaque id, never a person's name. Forgetting is clean: destroy the key and the sealed
   record is unreadable for good; then delete the block.

## 6. Catches

1. **Custody.** The helper's passphrase and the organisation's key sit at the waker in plain text, as its enrol page
   says. The key never lands on the beach (vault:weft's own law). The door is portable: a LERO can run its own waker.
2. **A public door spends a wallet.** Caps per day and per visitor, and a key made for this with a hard monthly cap
   in the provider's console.
3. **Safety.** The helper's law gives crisis routes first; the stance puts safety before anything; the page says it is
   not a crisis service.
4. **Honesty about delivery.** The door, not the model, says whether a note got through.
5. **Personal data in a note.** Only what the asker agreed to pass on, sealed to the steward alone.

## 7. For David's ruling

1. **Merge and deploy** (the waker redeploys from main).
2. **Enrol `lero-helper`** at the waker's `/enroll` as a doorman, by the holder's own hand — its key is at
   vault:weft 8 — with the organisation's capped key, or none to trial on the beach's key under `MAX_DAILY`.
3. **The steward.** When Matthew chooses a kind, the helper reaches him with a grain, he accepts it, his name goes on
   function:lero-helper 3.2, and his ear watches `wake lero-helper` to be rung.
4. **The link.** The page is the waker's own (`/ask?h=lero-helper`), so it needs no CORS; a panel on the LERO pages
   later adds their origin to `WAKER_CORS_ORIGINS`.
5. **Kind 3** (memory) as §4.2 and §5, when asked for.

## 8. The first slice — in this branch and at the beach

- `genus-one/private_door.py` — the pure law: the stance, `parse_turns`, `split_signals`, `pair_id` and `side_of`
  (anchored to grain 697198849f991039 between keel and weft), the `Pacer`, the page.
- `genus-one/waker.py` — `GET`/`POST /ask`, `private_answer`, `pass_on`, `ask_cap`, `bare_window`;
  `model_call` takes a whole conversation.
- `genus-one/test_private_door.py` — 77 checks offline (`python3 genus-one/test_private_door.py`);
  `test_doorman` 215 and `test_temporal` 37 unchanged; the page driven in Chromium against a local waker.
- **At the beach** (git-free): `passport:lero-helper` (keys published at 9), `function:lero-helper` (its law: whom
  it answers and from what, safety, when a person hears), `wake:lero-helper` (its dial: on, 40 a day, sonnet at
  2000), `shell:lero-helper` (its manifest at 3: the law, then the standards, the agreement and the constitution
  nominated whole from `/w/community-recovery`, about 50,000 characters compiled) — every block locked under the
  helper's own key, recorded at vault:weft 8 in the same pass.

## 9. Provenance

Written 2026-10-03 by weft, Claude Code's shell on the beach, at David's word in lane helper.1 (watch:weft 514).
Read for it: `genus-one/waker.py` (`lite_answer`, `ring`, `pick_fuel`, `Dial`, `set_consent`, `set_answer`,
`forward_event`, `router_call`), `push-engine` `engine.py` (`match_and_deliver_wake`), `src/locks.ts`
(`pairId`, `determineSide`), `src/tools/bsp.ts` (group writes; the refused group append), `src/tools/play.ts` (the
manifest compile: only position 3's direct refs nominate), `src/compile.ts` and `src/genus.ts` (`parseStarRef`,
`parseReference`: address 0 is the root with the spindle omitted); ways:doorbell, ways:genus, ways:vault, the root of
vault:weft, shell-genome; proposals 2026-08-12-doorbell-wake, 2026-09-01-the-doorman, 2026-09-27-fuel-in-the-vault,
2026-09-30-one-source-many-keys and 2026-07-20-private-community-beach.
