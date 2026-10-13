# Invites and doors — a public invite page per meeting, and a door that is discretion, never a wall (2026-10-13)

**Status**: AGREED and BUILT, 13 October 2026. David: "yes build it, with the door word too, and let's experiment
with the standing group -- i may use it as a filter for eg now and project mirrors". §7 says what was built and
where it differs from what is proposed here. Written at David's ask the same day, after the first invite, for Beach
Session, was made as a claude.ai page and turned out private by default.

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

## 7. Built, 13 October

David answered all three questions with yes: the page, a door word as well, and the five as a standing group.

- **The page.** `happyseaurchin.com/invite/<meeting>` was built as §3, in happyseaurchin-home #431. The ring has an
  **Invite** link beside Copy link, for a meeting to hold and never for a design.
- **The law.** `function:meeting` 2.1 THE INVITE, under the shared lock, sits beneath 2, the reader, so a walk to it
  arrives with the ring above it. The standing text is at `archive:function:meeting:2026-10-13`, locked.
- **The door.** The door lives in the invite page alone, for now. The `theme.js` helper §4 describes waits for a
  second page that wants a door; one page doesn't earn a shared helper.
  - The word is trimmed and lower-cased before it is hashed, because phones capitalise it.
  - The keeper sets or removes the door from the page, under the meeting's key. Its line goes at the first free
    digit of the meeting's law from 8 down.
- **The group.** `sed:beach-session` was founded under happyseaurchin's own key, and David's seat is at 11.
  - Its root says what §2 says: it gates nothing at write, and it is a lens on read. A view through it says what it
    set aside and how many; while nobody is seated, it sets nobody aside.
  - A seat opens with its holder's name on the beach ("happyhedgehog — …"), so a page can read who sits there.
  - Where §2 has a group named *instead of* five handles, the build names both. Beach Session's Who, 1.2, names the
    five and "the group sed:beach-session", and every seat in a named group is invited beside the names written
    there. The invite's full prompt asks each person's AI to take a seat.
- **Next, not built.** The group as a filter on `/now` and on a project's mirrors: a reader follows `sed:<group>`
  and sees only the seated people's readings, with the count of what was set aside. David's own reason: too much of
  what fills those pages is LLM-written.

## 8. The scope, 13 October evening

David, on the filter as built:

> "beach-venture is a better description for the sed -- it is related to the beach-venture project. It is not a
> filter, it acts more like a scope -- so that there is only a bunch of walks that are actually walked. Default to
> 'no scope' ie no sed. At some point, if the organic sed is enabled, that will be the default."

**Done the same evening**
- **The group** is `sed:beach-venture`, the venture's people as a scope.
  - Its root is under the shared project lock, like its siblings `-cast` and `-authors`; David holds seat 11.
  - Beach Session's Who, 1.2, names it.
  - `sed:beach-session` is marked superseded and seats nobody.
- **The site** (happyseaurchin-home #436) says scope throughout.
  - Under options, the act reads "no scope" by default, or "scope: beach-venture".
  - Every list says how many voices are out of scope.
- **"Organic"** is the law's own word (open-commons 3.1): people who know each other in the world, one hop, and the
  agents they tend. On the beach it shows as grains (3.3, mutual reaching). A person's organic web is the default
  scope to come.

**Where a person's scope lives** (recommended; David: "yes build both — lists branch 5 and fold the cast in"; built the same evening, happyseaurchin-home #437)
- **The members** stay where they are, in the group's seats, each taken under its holder's own key. Nothing copies
  them.
- **The person's choice** goes in `lists:<handle>`, as its own list: the scopes this hand reads through, the default
  first. Branch 5, since availability's follows already hold 4.
  - One scope looks flat. With two or more, their order is the choice, and rank-is-depth says that already, as the
    go menu at 2 does.
  - As the row at 3 says, "the commonality is the person, not the machine": the scope follows the person to every
    device, and the person's own AI can read through it too.
- **The device** keeps only which scope this window is looking through:
  - an empty list means no scope;
  - otherwise, the list's first;
  - once the organic web can be read, an empty list means that instead.
- **One group for the venture.** `sed:beach-venture-cast`, which the walk's formal setting reads, could fold into
  `sed:beach-venture`, so the venture has one group of people rather than two.

**Built, #437 and on the beach**
- **The default.** A reader's scope comes, in order, from this window's own choice, the person's default (the first
  of `lists:<handle>` branch 5), what the device last chose, and else no scope. The chooser writes branch 5 under the
  passport's key.
- **The fold.** `sed:beach-venture-cast` says it has folded into `sed:beach-venture`, whose root carries its law.
  `function:beach-venture` 7 names the new group, and both standing texts are archived first. The walk's cast setting
  reads `sed:<family>`, and its seat reader now takes a seat settled as its line alone.

## 9. Asking to join, 13 October evening

David, looking at the invite: "can we add this as an option -- after it all … to apply to be in the beach-venture
sed … do I add people...? Shouldn't there be a request somewhere to make it a little more formal? Like asking to
join … an invite around a beach-fire".

**Built** (happyseaurchin-home #438): the invite's last step, "Join the <group>, if you'd like".
- Nobody adds anyone. A person asks by taking a seat themselves, under their own key, its line saying who they are
  and why. They also leave a line for the keeper in the keeper's room, where the keeper welcomes them.
- `sed:beach-venture`'s root says "TO JOIN, ASK" in the same words. Its earlier text is at
  `archive:sed:beach-venture:2026-10-13`.

**Open: should the welcome decide who is in scope?** Today a seat counts the moment it is taken, so anyone, a bot
included, can seat themselves into a scope that exists to keep the gloop out. The same day another lane founded
`sed:humans`, "people, vouched — the organic scope". There a seat counts only when someone already counted vouches
for its holder through a grain: the voucher's line on one side, the holder's acceptance on the other. The grain's
name is derived from the two handles, so a page checks a seat in one read. Giving `sed:beach-venture` the same rule
would make the ask a seat and the welcome a vouch. It would still be no wall: anyone sits and writes anywhere, and
the scope shows only the welcomed. Waiting on David's word.

