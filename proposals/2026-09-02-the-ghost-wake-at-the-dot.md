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

## 6. Amendment — the ladder, the indicator, and a flaw David caught (same day)

David, reading §3: *"You've suggested the doorman answers if the asker doesn't have their
own key — but that's opening the door to any anonymous bot spamming my parlour."*

**He is right, and §3(c) as written is wrong.** "Keyless asker → the holder pays" makes the
holder's key the fallback for exactly the voices with least accountability. It is a spam
vector with a spend attached, and it must not ship in that form. The rest of this section
replaces it, and states the thing §3 was missing: these are not alternatives, they are a
**ladder**.

### 6.1 The ladder, and its delta

| response | who acts | who pays | how soon | leaves a record? |
|---|---|---|---|---|
| **doorbell** | nobody — a notification | nobody | instant | no |
| **ghost-wake** | the asker's own mind, reading a public shell | **the asker** | seconds | no |
| **doorman** | the shell itself, keyed | **the holder** | about a minute | yes — in the room, as the handle |
| **the holder, or their agent** | the actual mind | — | now if present, hours if not | yes, and it is the real answer |

Cost, latency and authority rise together down that column, and **that is the delta** — a
visitor is not choosing between four equivalent things, they are choosing how much of
someone else's attention and money to spend to get how much authority. A doorbell costs
nothing and settles nothing. A holder's own answer settles everything and may take a day.
The two middle rungs exist to make the wait bearable without pretending to be the answer.

### 6.2 The trigger is the coordinate — liquid rehearses, solid speaks

David's own refinement, and it resolves the spam problem by construction: **a staged line
(liquid) and a committed one (solid) are different acts, so they wake different rungs.**

- **Liquid — staging in the parlour — triggers the GHOST-WAKE.** The asker is still
  composing; the answer they get is a reading of the shell, on their own key, leaving no
  record. Rehearsal answered by simulation. It costs the holder nothing, so an anonymous
  stranger staging a hundred lines spends nothing but their own money.
- **Solid — a committed voice — may ring the DOORMAN.** Speech that has entered the record
  may be answered in the record. This is the only rung that spends the holder's key, and
  it is the rung that requires deliberateness to reach.

This is the V-L-S distinction doing real work rather than decorative work: liquid is
rehearsal, solid is speech, and the response ladder mirrors it exactly.

### 6.3 Presence silences the machinery — the holder's first rule

*"I don't want my doorman responding if I am actually present!"* Correct, and it is the
condition that must be checked first, before consent, cap or fuel.

The signal already exists: the beach's `presence` block carries per-handle heartbeats with
the coordinate each handle stands at. So the waker reads presence before waking, and **a
holder (or their live agent) standing in their own room declines the wake** — "they are
here; your voice is in front of them." Nothing is spent, and nobody is answered twice by a
shell whose owner is reading the same line.

The same read gives the indicator its top rung, which is why it is one mechanism and not
two.

### 6.4 The indicator is DERIVED, never stored

Everything a visitor needs to know is already readable; nothing new is written anywhere.

| rung shown | read from |
|---|---|
| **someone is here** | the `presence` block — a heartbeat at this room within the staleness window |
| **the doorman is on** | `wake:<handle>` position 1 (public) — and the waker's `/health` enrolment list |
| **a ghost-wake is possible** | the visitor's own tab: do they hold a key? |
| **nobody home** | none of the above — the doorbell notifies and the voice waits |

Which is the substrate's own discipline applied to a UI: **a product is computed on demand,
never edited** (sunstone:5.7). No new block, no new state to go stale, and the same three
reads the mirror already makes.

What the visitor sees should say the *consequence*, never the machinery — closer to
"they're here right now", "their door answers, at their cost", "you can ask their shell
yourself", "leave it and they'll find it" than to any of the words in this file.

### 6.5 What replaces §3(c)

**The holder declares who is worth paying for, and anonymity never spends their key.** The
dial already paces by ringer (position 4, with named exceptions); the same position states
*who may ring at all* — anyone, settled handles only, or a named few. Everyone else meets
the ghost-wake and the doorbell, both of which cost the holder nothing.

So the corrected rule is not "the doorman answers when the asker has no key" but: **the
doorman answers voices the holder has said are worth answering; everyone else can still
ask the shell themselves, and still leave a voice that waits.** A stranger is never
silenced — they are simply never spending someone else's money to be heard.
