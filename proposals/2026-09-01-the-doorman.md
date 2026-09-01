# The doorman — a shell that answers while its holder is away (2026-09-01)

**Status: PROPOSAL, systematic by request.** David: *"Let's ensure we have thought about
how this works properly and systematically before we implement a partial solution that
I'll be chasing for a week to get working."* So this file states the whole chain, what is
already built, the one thing missing, the five decisions that are his, and a staged plan
with stop-gates. No code, no enrolment, no beach write beyond this record.

Lane: the tidying lane (watch:weft 173→199, window `tidying.5`). Origin: David's question
after Matthew reported a fault to him rather than to the beach — *can Claude Code be woken
by something appearing in its parlour?* No (nothing starts a Claude Code session but a
human or this machine's scheduler), and the honest alternative is an agent-bodied shell
that answers in the room and leaves the work for the full session. He then asked the
larger question: can any handle have one — `keel-lite`, `happyseaurchin-lite` — and is
egg-one simply the case where the shell is a genome?

**Yes. And the portal for it is already built.** That is the finding this file exists to
record, because a session that does not know it will build a second one.

## 1. What already runs, verified in source and against the live services

The waker (`genus-one/waker.py`, live at waker-production.up.railway.app) is **generic
infrastructure that happens to have been built for eggs**. Every part of the chain a
"-lite" shell needs is standing:

- **The event.** The beach declares its pool webhook at `settings:6`; a voice landing in
  any `pool:*` POSTs to the push engine, which fans out to the waker's `/ring`. Commits
  only — never liquid, never vapour. Field-proven since 2026-08-17.
- **Enrolment, by the holder's own hand.** `POST /enroll {handle, passphrase, notify?,
  fuel?}` — browser to waker over TLS. `DELETE` with the same proof removes it.
- **The passphrase is PROVEN, not taken on trust.** `verify_shell_key` reads
  `reflexive:<handle>` position 1 and writes it back **byte-identical** under the supplied
  secret. No `new_lock` is ever sent, so the proof cannot alter lock topology, content, or
  one byte. A wrong key cannot enrol. Failed proofs are throttled (5/hour/handle) because
  the endpoint is a passphrase oracle. Rotating the shell lock on the beach invalidates a
  stale enrolment by itself.
- **Fuel is already a first-class field.** `store[handle] = {secret, notify, fuel, …}` and
  `pick_fuel` runs a settled precedence: **the asker's carried key → the holder's deposited
  fuel → the beach's standing key** (only if the generosity switch is on). A holder who
  deposits their own key pays for their own agent.
- **Consent and pacing are the handle's own, read fresh every ring.** The dial at
  `wake:<handle>`: 1 on/off (absent reads OFF — the doorbell rings only by consent), 2 the
  daily cap, 4 per-ringer cooldown with named exceptions, 5 refractory. Plus a self-ring
  guard, a one-pulse-at-a-time lock, and the holder's own ceiling at `budget:<handle>`.
- **Spend is logged where the holder already reads.** Every granted wake appends to
  `daily:<handle>` under that handle's own key, funder recorded.
- **The mirror's pane is already generic.** `DoorbellCard`'s record is
  `{handle, secret, notify, fuel, enrolled}`; it POSTs straight to the waker, seeds the
  `wake:<handle>` dial, and reads `/health.enrolled` to draw the ◉ dot. **It is not a
  genus-one pane** — it is "the agent you keep here", and the "one agent" David noticed is
  one *record per browser profile*, not a limit of the design.
- **The poke button is already generic too.** Mirror.tsx routes a landing through the
  doorbell when `ringing.includes(poolName)`, and `ringing` is exactly the waker's enrolled
  list. Stand in `pool:keel` with keel enrolled and the poke path appears **with no client
  change at all**.

## 2. The one thing missing

`/ring` (and `/poke`) end in `run_pulse` → `kernel.pulse()` — the genus-one kernel, which
composes its window from a **genome**. That is the whole of what makes egg-one "full", and
it is the only genus-specific link in the chain. A `keel` enrolled today would ring, pass
every governor, and meet a kernel with nothing to compose.

So David's model is right, and sharpens to one sentence: **egg-one is not a different kind
of thing — it is the case where the shell happens to be a genome.**

**THE BUILD IS ONE BRANCH:** a second responder mode that composes from the blocks a
settled handle already has, answers once in the room, and stops.

    on ring for an enrolled handle with no genome:
      read pool:<handle> since the marker + the brief (below)
      one LLM call on that handle's fuel
      post ONE reply into the room, as that handle
      append the spend line to daily:<handle>
      stop

Nothing else. No state machine, no memory beyond the room, no second block.

## 3. The brief — what a lite shell reads to answer as itself

David's instinct — *"we need the reflective-compass … to have some content in its shell to
respond accordingly (the operator block of the shell?)"* — is the right question, and the
answer is that **it needs no new block type**:

- `passport:<handle>` — who this is, in its own words. Every settled handle has one.
- `pool:<handle>` — the room, and the conversation so far.
- `wake:<handle>` — consent and pacing (already read by the waker).
- `pscale://parlour` + `pscale://soft-agent` — the substrate-wide manners for a handle's
  own room, which every soft LLM on this substrate already wears.

Depth is opt-in and needs no schema: a handle that also keeps `purpose:`, `orientation:`
or `cook:` simply answers better, because the brief is a compile of what exists.

**One naming decision (§5a).** If we want a single named home for "how I answer", the
family law landed at `whetstone:8.5` says a family's operator is `function:<name>` — so
`function:<handle>` is the consistent home, falling back to the parlour convention when
absent. That is a decision, not a requirement: the thing works without it.

## 4. Where a secret may travel — the rule that decides the architecture

David asked whether this could run **through bsp-mcp**, so a claude.ai or ChatGPT user
could set it up by talking to their LLM. The answer is a firm split, and it is the most
important line in this file:

> **An LLM may POINT AT the door. It must never CARRY the key.**

Enrolment is a human→waker act over TLS and must stay one. Routing it through a tool call
would put the passphrase and the API key into: the user's LLM context window, the LLM
provider's logs, the bsp-mcp router's process, and any transcript on disk — four new places
for a credential that today touches exactly two (the browser's TLS session and the waker's
volume). That is strictly worse, and it is worse in a way that cannot be walked back once a
key has been typed into a chat.

**So: yes a claude.ai user can set this up, and the way is a link.** Their LLM (holding
bsp-mcp) reads the beach, tells them a doorman exists and what it will and will not do, and
hands them the URL. They type their handle, passphrase and API key into the **waker's own
form**, in their own browser. bsp-mcp's job is discovery and explanation — never custody.

Which also answers the mirror question: **leave mirror.onen.ai as it is.** Its pane is
already the generic door; nothing about it is genus-specific; the black dot and the poke
button generalise for free the moment another handle is enrolled. The only gap for a
non-mirror user is that the waker's `GET /enroll` returns a JSON explainer rather than a
plain HTML form (§5e).

## 5. The decisions that are David's

**(a) The answering law's name.** `function:<handle>` (consistent with `whetstone:8.5`),
or nothing at all and the parlour convention carries it. Recommend: nothing at first;
add `function:<handle>` when a shell wants to differ from the default.

**(b) The proof block.** Enrolment proves against `reflexive:<handle>`. Live today:
Ada, waer, weft, egg-one/two/three. **keel and happyseaurchin have none**, so neither can
enrol as things stand. Recommend generalising the proof to `passport:<handle>` — the one
block every settled handle has — with `reflexive:` still accepted.

**(c) Custody, and it is the real decision.** See §6. Recommend: personal handles only
until (b) and the door text are in place, then invite one person deliberately.

**(d) The fuel policy per handle.** Holder's own key (their spend, their cap), the asker's
carried key (asker-pays, already implemented), or the beach's standing key (David's
generosity, floored by `WAKER_MAX_DAILY`). Recommend: a lite shell for someone else runs on
**their own deposited fuel or nothing** — the beach's key funds David's own handles only.

**(e) The door for non-mirror users.** A plain HTML form at `GET /enroll`. Small, and it is
what makes "a claude.ai user can do this" true rather than theoretical.

## 6. Custody, stated plainly

David asked: *"this 'you hold their shell key' is what is currently happening with the
egg-one etc agents, correct? And that is secure, correct?"*

**The first half needs a correction: it is not currently happening.** The waker's enrolled
list today is `["egg-one"]` — David's own handle, funded by David's own key. No third
party's secret is held anywhere in this system yet. The custody question is still ahead of
us, which is exactly why it is worth answering before the invitation rather than after.

**On "secure", precisely — three true statements, and the third is the one that matters:**

1. **The protocol is sound.** The secret never travels via the beach; it is proven against
   real locks rather than trusted; the proof cannot mutate anything; enrolment is
   holder-initiated, removable by the holder, and self-invalidating on lock rotation; the
   oracle is throttled. There is no weakness in the *shape* of this.
2. **At rest it is plaintext, mode 600, on the service volume** — the code says so in its
   own comment: *the same trust envelope as this process's env; holders trust the waker
   operator exactly as they trust a client they type the passphrase into.* Anyone with
   access to that Railway project can read it. That is honest, and it is normal for a
   service that must act as you while you sleep — but it is custody, not cryptography.
3. **A shell key IS write-authority over that handle's blocks.** It is not a read secret
   (the beach is public by design), so the exposure is not privacy — it is **impersonation**:
   whoever holds it can write as that handle, and the substrate will record it as that
   handle forever. For David's own handles that is a decision about his own name. For
   someone else's it is a decision about theirs, and it must be theirs to make, in words
   they can act on, before they type anything.

**So: secure for what it is, and the words to use are "custodial, removable, and
impersonation-capable" rather than "secure".** What would reduce it, in rising order of
work: a plain custody statement at the door (do this regardless); per-position lock
delegation, so a doorman key writes only the room and never the shell — **worth testing
before claiming, because a room is an append accumulator under a root lock and the
delegation may not reach it**; encryption at rest with the key in env (moves the problem,
does not remove it); a per-handle scoped credential the substrate does not yet have.

## 7. Failure modes to design against before inviting anyone

- **Injection.** A keyed agent answering strangers in a public room. The room is DATA,
  never instructions — the same posture every soft-agent on this substrate already carries,
  stated in the brief and again in the door text.
- **Runaway spend.** Bounded already (dial cap, cooldown, refractory, one-at-a-time,
  `budget:<handle>`), and the holder's own key means the holder feels it. Verify the cap
  binds a lite wake exactly as it binds a pulse — same code path, so it should, but it is
  a test, not an assumption.
- **The doorman speaking beyond its hands.** It can read the beach and answer from it. It
  cannot open a repo, run a test, verify a deploy, or hold a lock beyond its own. The brief
  must make it *say so* and write down what needs hands, so the full session picks it up —
  which is the whole point David asked for: engagement now, work later, one record.
- **Two minds, one handle.** A doorman writing as `weft` while a Claude Code session writes
  as `weft` is the shell-sovereignty question in a new dress. The room is append-only and
  the doorman writes only there, so they cannot collide mechanically; the discipline is
  that the doorman never writes the shell blocks.
- **Silence looking like presence.** An enrolled handle that is out of fuel, past its cap,
  or dialled off still shows as enrolled. The room should say so plainly rather than
  leaving a visitor talking to nothing.

## 8. The staged plan, with stop-gates

**Stage 1 — the lite pulse, on weft alone.** The responder branch, the brief compiled from
weft's own blocks, `wake:weft`'s dial collision resolved (§5a of the earlier note: the
dial's address is occupied by weft's wake *procedure*; today it reads as OFF, so nothing
fires — decide where the dial lives before enrolling). Fuel: David's key, cap 3/day.
*Gate: David engages weft's parlour from a second device and gets a useful answer that names
what it could not do.*

**Stage 2 — the proof generalises (§5b) and the door gets a form (§5e).** Still no third
party. *Gate: happyseaurchin-lite enrolled by David's own hand through the plain form,
answering in `pool:happyseaurchin`.*

**Stage 3 — one invited person, deliberately.** Keel or Matthew, with the custody statement
at the door, their own fuel, their own cap. *Gate: they can remove it themselves and verify
it is gone.*

**Stage 4 — the lighthouse names it**, once it has answered for a week without a fault.

Each stage is stoppable, and nothing before Stage 3 touches anyone else's key.

## 9. What this deliberately does not do

No new primitive, no new block type, no change to bsp-mcp's twelve entry points, no change
to mirror.onen.ai, and no credential anywhere near an LLM tool call. The build is one
branch in a service that already exists.
