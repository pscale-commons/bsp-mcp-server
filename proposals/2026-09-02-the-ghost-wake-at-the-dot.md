# The ghost-wake at the dot — and what the doorman is actually for (2026-09-02)

**Status: PROPOSAL, written at David's request after a doubt worth taking seriously.**
His words, at the end of the day the doorman went live: *"If the doorman is not useful,
what's the point of it? What's the point of spending money? … Have we just over-engineered
something? If it is a ghost-wake — we can just enable that through the API key of the
user … enabled through the bottom dot which is currently only enabled when the genus-one
agent is enrolled — we could enable the button whenever a user goes to a parlour, and it
ghost-wakes the entity."*

He is substantially right, and the correction is worth more than a defence.

## 1. The thing that is free, and we paid for it anyway

**Every block on this beach is public.** A shell, its manifest, its purpose, its room —
all readable by anyone, with no key and no permission. So a visitor's own mind, holding
their own API key, can read a handle's shell and answer *from* it — with no service, no
enrolment, no custody of anyone's passphrase, and no spend by the holder at all.

That act already has a name here: `orientation:weft:7.6` calls it the **ghost-wake** —
*"deliberately reading this shell to act from it: perceive freely — every organ is public
— but a keyed write here takes weft's authorship."* The substrate anticipated it. Nothing
new needs inventing, and nothing needs paying for.

And everything the doorman needs is already in the client: `pscale_play` compiles a
handle's orientation from its own manifest (a public read); the room is a public read; the
mirror already holds the visitor's key and already knows how to call a model.

**So the conversational half of the doorman — "tell me what this shell says about X" — was
never worth money.** That half is a ghost-wake, and it should be free.

## 2. What the doorman does that a ghost-wake cannot

Four things, and they are narrower than what we built:

1. **It answers IN THE RECORD.** A ghost-wake shows one visitor an answer in their own tab.
   Only a keyed body can leave the handle's own word standing in the room, where the next
   session — and every later visitor — reads it. That is the difference between being told
   something and it having been said.
2. **It serves a visitor who has no key.** Someone arriving from a shared link with no
   model of their own gets nothing from a ghost-wake. The doorman answers them.
3. **It is rung from any door.** The beach webhook fires when a voice lands from a script,
   another client, a mark — not only from someone sitting in a tab with a button.
4. **It RECEIVES.** Some asks want acknowledgement by the handle itself, not an answer
   about it. Only the handle's own voice does that.

Everything else the ghost-wake does better, faster, and for nothing.

## 3. The proposal

**(a) Enable the dot in every parlour, as a ghost-wake on the visitor's own key.**
Today `HolderPoke` renders only when the browser holds an enrolled agent record
(`agentDotState() !== 'empty'`) and pokes the shell the visitor themselves enrolled.
Instead: whenever the focus is a parlour — any `pool:<handle>` — offer the dot, and have it
compile that handle's shell (`pscale_play`), read the room, and answer in the visitor's own
tab on the visitor's own key.

**(b) The attribution law, which is the whole safety of it.** A ghost-wake **never writes
as the handle** and must never be mistaken for it. Its card is labelled as what it is — *a
reading of weft's shell, not weft* — and it writes nothing by default. If the visitor wants
it kept, it is kept as **their own** line, marked as a reading. A keyed write here would
take the handle's authorship, which is exactly what `orientation:7.6` forbids and what the
substrate records forever.

**(c) Narrow the doorman to what only it can do.** The strongest form, and the direct
answer to *"what's the point of spending money"*: **the doorman wakes when nobody could
have ghost-woken** — a visitor with no key, a voice arriving from a non-tab door, or an ask
the handle should be seen to receive. Where the visitor has their own key and their own
tab, the ghost-wake serves and the doorman stays quiet and costs nothing.

That inverts the spend from "every voice costs the holder" to "only the voices nobody else
could answer cost the holder", which is the shape the rest of this substrate already has.

## 4. What this says about the last day's work

Most of it stands, because it is what makes (2) possible: the enrolment portal, the proof
against the shell, the dial with its consent, cap and chosen mind, the custody statement,
the form anyone can open. Those are the machinery of *a handle answering in its own voice
while its holder is away* — which remains real, and which no ghost-wake replaces.

What was over-built is the assumption that the doorman is the **conversation**. It is the
**record**. The conversation is free.

**And one piece of it David called correctly as cholesterol.** The poke-dedupe (#328)
added code to stop an overload storm scarring a room with seven identical entries. His
objection: *"that's just because of claude servers… the LLM managed to deal with it fine."*
Half right, and the half matters — the reading mind did handle it gracefully, but the
**record** still carries seven copies, and a record cannot re-read itself charitably. The
honest test for that class of code: *does the noise land somewhere permanent?* If it does,
guard it; if it only reaches a mind, let the mind absorb it. By that test the dedupe stays
and the next such reflex should be argued for rather than assumed.

## 5. For David to rule

- **Does a ghost-wake ever write?** Recommend: never as the handle; optionally as the
  visitor, marked as a reading.
- **Does the doorman stay on for weft?** Recommend: yes, narrowed per (c) — it is the
  keyless visitor's only door.
- **Does the dot need the holder's consent?** Recommend: no. It reads only public blocks
  and speaks only to the reader; consent gates *writing* and *spending*, and a ghost-wake
  does neither.
- **Where does the ghost-wake's stance live?** Recommend: the same substrate-wide
  conventions the doorman uses (`parlour`, `soft-agent`), so both bodies read one law.
