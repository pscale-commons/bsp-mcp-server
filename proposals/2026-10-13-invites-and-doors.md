# Invites and doors — a public invite page per meeting, and a door that is discretion, never a wall (2026-10-13)

**Status**: PROPOSAL. Builds nothing until David's word. Written at David's ask on 13 October, after the first
invite, for Beach Session, was made as a claude.ai page and turned out private by default.

**Companions**:
- `2026-10-12-locating-a-meeting`: the pre-meeting, the fix, and the lattice check.
- `open-commons`: "public reads, no perimeter, nothing hidden; openness IS the security posture".
- `gatekeeper`: the beach's one existing gate, which is a conversation and not a lock.

Weft, lane 2, Claude Code.

## 0. David's words

> "The my Town field suggests to the user it will be in person.... but it is a virtual meeting. … I am wondering why
> we need it to be private if the actual meeting isn't and it is available on the beach...? Unless we create a sed
> and the sed members only have access to it? Could that work? Otherwise we create a bespoke new invite page to
> support a meeting. On the template for the invite page the user can insert names of users, perhaps search them on
> the beach. And toggle -- done before, first time -- and it remembers the user. … the invite can be created via
> claude or the llm-app if possible. … is that a system we could use -- where pages are visible or not based on the
> handle and passphrase? … it's more like a gate rather than a wall. Not secure, but gated. Something that provides
> some discretion but not privacy per se -- like meeting around a table in a cafe or an open office."

The town field became a time zone field the same day, filled from the person's own device.

## 1. The invite needn't be private

The first invite page was private only because a claude.ai page lives in its owner's account until it is shared.
The meeting it points at is public, like everything on the beach.

An invite belongs where the meeting is, as a public page that reads the meeting's own blocks. /ring already reads
them that way. Nobody has to share anything for friends to open it.

## 2. A sed would not gate it

**Every read on the beach is public, whatever the block.** A sed hides nothing. What it gives is a seat for each
member, claimed with the member's own key (`pscale_settle`). That is the right tool for a standing group whose
membership each person owns, such as a cast or a collective.

**For one meeting, the people invited are the meeting's Who.** The keeper names them at 1.2, in the meeting's own
text, and each person says "coming" in their own reading there, as now.

**When a sed would help.** If the same friends become a standing group that meets often, a sed is the natural
register for them. An invite could then name the sed instead of five handles.

## 3. The invite page, one template for every meeting

The page would live at `happyseaurchin.com/invite/<meeting>` and read the meeting's blocks:

- **The meeting.** Its title, its hour, and its link on the ring.
- **Who is invited.** The names at the meeting's Who, 1.2, each shown with its handle. Whoever keeps the meeting
  (the keeper) adds a name by searching the beach's passports; the page writes 1.2 under the keeper's key, asked
  for by the browser as every o-page does. The keeper's own AI can do the same: "invite happyhedgehog, MarkBeall
  and emojisword to beach-session".
- **You.** The visitor picks their name and the device remembers it, along with the time zone the device reports,
  which they can change.
- **First time, or done before.** A toggle, also remembered.
  - **First time** shows the connector step and the full prompt: fill the week from the calendar, read the
    pre-meeting and everyone's availability, offer times, then fix and book by `function:meeting` 7.1.
  - **Done before** shows a short prompt, because the person's AI already has their availability on the beach.
    For example: "Arrange <meeting> for me: read its pre-meeting and everyone's availability, offer up to three
    hours at its When, say I'm coming, and fix and book it as function:meeting 7.1 says."
- **Once fixed.** When the meeting's time is fixed, the page shows it at the top, as the ring's header does, with
  the follow-up line for booking.

## 4. The door: discretion, never a wall

A door belongs to the page, never to the beach. The blocks stay as open as everything else, and anyone determined
reads them there. A page can still ask who you are before it shows you the invite, the way a host at a café
table might. There are two doors; neither hides anything:

1. **The name door.** The invite opens fully only after you pick a name on the list. Otherwise it says "this
   invite is for …; ask <keeper>". This is discretion by name.
2. **The door word**, which is optional.
   - The keeper chooses a word and sends it with the invite.
   - Its hash stands as one line in the meeting's own law, `DOOR: <hash>`, so a casual reader of the block doesn't
     see the word itself. It could as well stand in the clear: it is a gate, and a hash only keeps it from being
     read at a glance.
   - The page asks for the word once and the device remembers it.
   - This is the "handle and new password" David describes: a word per page, not a login.

**Why not each person's own key.** The beach checks a key only when something is written, so a page cannot check
one without writing. A door word sent with the invite is also simpler for someone new.

**Real privacy is a different thing.** When something must be private, the beach already has encryption: a gray
block, or a members' keyring that every member's key opens. That is a wall. It is opt-in and heavier, because
each member publishes keys first.

**As a general system for o-pages.** Any page that reads a family can honour a `DOOR` line in that family's law.
One helper in `theme.js` would ask for the word, hash it, compare and remember, so the door behaves the same on
every page. It is etiquette, not security, and the page says so.

## 5. If this is right

- The invite page at `happyseaurchin.com/invite/<meeting>`, as §3.
- One line in `function:meeting`, under the shared lock, with the standing text archived first: the keeper names
  the invited at the meeting's Who, 1.2; a door, if wanted, is a line in the meeting's own law.
- The door helper in `theme.js`, used first by the invite page, then wherever David wants a door.
- Beach Session's 1.2 names its five people: happyseaurchin, Phenomemental, happyhedgehog, MarkBeall and
  emojisword.

## 6. For David

1. **The invite page as §3:** yes?
2. **The door:** the name door only, or a door word as well?
3. **A standing group:** should the five of you become one, as a sed?
