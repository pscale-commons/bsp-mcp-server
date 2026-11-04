# The SALT app: one beach, its doors, its chrome

SALT's app is the set of doors of SALT's own beach. Every page wears SALT's own header, its Go lists SALT's pages and nothing past SALT's edge, and the beach's voice is the engine under every door. Whoever stands in it knows by the door where their words go; a person of two beaches keeps two apps, and their own phone is the one thing that spans both.

**Date**: 4 November 2026
**Lane**: salt-app, weft (Claude Code, Opus 5.5, on the Mac), a side session of lane lero.2, started at David's message of that day.
**Status**: proposed, for David's and Matthew's answers. Nothing is built. The first build step, SALT's own header, is drafted in §7 in words only. On the beach this lane wrote the proposal family and its listing, weft's readings, one knot with its place, and its account (§9).
**Builds on**: the members' gate live on beach.bringingtheflavour.com (pscale-beach #102, #103, #104, #105; bsp-mcp #571, #577); the String's SALT door (happyseaurchin-home #605, #607; bringingtheflavour #1; `function:string` 5) and its portal ([2026-11-03-the-salt-portal-one-route-in.md](2026-11-03-the-salt-portal-one-route-in.md)); field 5 of an index card ([2026-11-03-shell-indexes-one-index-per-holder.md](2026-11-03-shell-indexes-one-index-per-holder.md) §5); coloured stigmergy ([2026-11-03-coloured-stigmergy-the-design.md](2026-11-03-coloured-stigmergy-the-design.md), its first step built as #585); Matthew's pocket beach (`spine:pocket-beach`).
**Decides**: the six decisions at `spine:salt-app` 1.8, 1.18, 1.118, 1.1118, 1.11118 and 1.111118.

## 0. The ask

David, 4 November 2026, after finding that the Go menu at SALT's String door leads out of SALT. His words, whole, as `spine:salt-app` 3 keeps them:

> I want an app, salt, which has different things, one of which is the string. So, you've got the three scopes at the bottom (everyone, following, yours), a + button for adding something on the string page (but may have different functions depending on which page it is on), and the top listing of +card, options and Go drop downs. Let's consolidate the SALT app design, and then the pages within it. Because the go dropdown links don't work, they point out of the private beach. So we need to think carefully about how SALT app connects with other beaches. If we enable engagement with other beaches, then the user may get confused as to which beach and what content they are viewing and is viewable by others. And this is before we have coloured-stigmergy!
>
> Perhaps the SALT app is just the beach-button operating at the private beach? I don't know. Humans are pretty simple, and they are used to what they have, apps and websites.
>
> So each person has sovereignty of their own data on their phone, and then shares some with beach shells (public or private beaches is a legacy of the traditional world where some organisations want more privacy) and with coloured-stigmergy as a potential game-changer to how federated beaches are walked/read.
>
> With SALT, which is a human app and the beach at bringingtheflavour is potentially human only (the agent on an individual's phone is representative of the human), should it be scoped just for the bringingtheflavour beach, or all beaches? How does the user understand that their content is private-beach bound? How will the string app work if there's content from private beaches versus public beaches?
>
> I am not sure if the SALT app is something the beach-button could be, or if it is an app for a specific beach; it depends on how coloured-stigmergy works.

## 1. The answer in short

| decision | the question | weft reads |
|---|---|---|
| 1.8 the scope | one app for SALT's beach, or one app over every beach | **ONE** |
| 1.18 the header | SALT's own header with a Go that stays inside, or the open site's | **OWN** |
| 1.118 the pages | the String, Join, People, the Stack, Settings, with the scopes and a + per page | **GO** |
| 1.1118 the edge | out by field 5 only, in as a link only | **BOTH** |
| 1.11118 the phone | the button the engine under every door, or the app | **ENGINE** |
| 1.111118 the build order | the header first, then the pages, the readership on every card, colours inside, the pocket at the gate, the across last | **GO** |

David's three questions, answered in his words:

- **Should it be scoped just for the bringingtheflavour beach, or all beaches?** Just for the bringingtheflavour beach. A page writes through one voice, and a voice belongs to the beach it is loaded from (§3.1).
- **How does the user understand that their content is private-beach bound?** The door and its header say SALT on every page, every card says its readership, the + says where it lands before it lands, and a link that leads out says so before the tap (§4.2, §4.3).
- **How will the string app work if there's content from private beaches versus public beaches?** By never mixing them. SALT's String reads SALT's beach alone; a card from outside is a link with its site and path; an answer stays on the beach of the share it answers (§4.4).

And his doubt: **the SALT app is not the beach-button operating at the private beach.** The button is the engine under every door: a name and a key, the pass, an invitation, a join, a line said. The app is the doors and their header. Coloured stigmergy changes who can read a line inside SALT, and later what can be read across beaches; it does not change which door writes where, so the app stays one beach's (§5).

## 2. What stands today

Read on 4 November 2026, as a stranger, at www.bringingtheflavour.com/string, in the site's code and on both beaches.

1. **SALT's String door is the open String's page served with SALT's voice.** `api/string.js` serves `string.html` for `door=salt` with `beach.bringingtheflavour.com/button/voice.js` in place of the open beach's, `data-door="salt"` on `<html>`, and `/salt.webmanifest`. SALT's site serves it at `/string` by rewrite (bringingtheflavour #1); happyseaurchin.com serves it at `/salt`.
2. **The header is the open site's own** (`theme.js`), drawn over SALT's door:
   - **Go** (`siteDoors({ site: true })`, called from `string.html`'s `init()` at every door) lists happyseaurchin.com's pages as relative links: `/entrance`, `/welcome`, `/connect`, `/beach-security`, `/proposal`, `/schematic`, `/loom` and on. On SALT's site every one answers 404. At happyseaurchin.com/salt every one leads out of SALT into the open site.
   - **＋card** (`mintAct`) loads `/hand.js` and `/mint.js` on its first tap. On SALT's site both answer 404. At happyseaurchin.com/salt it would mint a card into `ahead:now:<handle>` on beach.happyseaurchin.com, the open beach (`hand.js`: `const BEACH = 'https://beach.happyseaurchin.com/.well-known/pscale-beach'`).
   - **options** gathers ◐ and **share forward** (`shareAct`), the open commons' invitation to the magic-mirror.
   - The foot reads `happyseaurchin.com` and links to `/`, which on SALT's site is SALT's front page.
3. **The gate holds.** A stranger is served only what a keeper marks beyond in their own index card's field 5 (today `passport:davidmpinto`, `notice`, `pack`) and `401 members_only` for everything else, missing blocks too (`tests:salt` 2). A member proves their passport once for a twelve-hour pass. A member's invitation founds one passport, bound to a name where the member says whose. The guard refuses a phone number or an email address in a people-keeping block.
4. **The voice is per beach.** `button/voice.js` takes its beach from the address it is loaded from (its `ROOT` is the script's own origin) and keeps the pass under `beach-pass:<that beach>`. At a members' door the visible beach button is off (`data-beach-button="off"`): it is the open commons' own, and the page takes words through its own box.
5. **SALT already installs as an app.** `salt.webmanifest` on SALT's site: name "SALT — the String", start and scope `/string`, a share target at `/string`, and the String's own icon (`/assets/string/icon-192.png`), not SALT's crystal.
6. **SALT's front page** (www.bringingtheflavour.com) is SALT's outside face, built 11 October for strangers; its header offers "taste" and "the beach ↗", and its field "The beach, today" reads the open beach's traces.
7. **The pocket** (`spine:pocket-beach`) runs on Matthew's phone with no signal; its next switch, Reach the beach, sends to an online beach by that beach's address (`spine:pocket-beach` 1.111).

So the inside is already bounded at the beach. What leaks today leaks at the page: a header written for the open site, laid over a members' door.

## 3. The design, level by level

### 3.1 Physics: one voice, one beach

A page's writes go where its voice was loaded from, and its pass is kept for that beach alone. One page could load two voices, but then a tap's destination would be whatever its code picked, and nothing on the page could show a person which. So one voice per page is the physics, and one beach per app follows from it. The same page, `string.html`, serves every beach that wants a String, each at its own door with its own voice; the app is never a separate codebase.

### 3.2 Chemistry: a family per beach, and the app's list kept in a block

The String on SALT is SALT's own family: `spine:string` and `function:string` founded on SALT's beach (3 November), every member's `string:<handle>` standing there. A feed is a fold of one beach's mirrors. A feed over two beaches would fold two families with two readerships, and the same heart would mean two things: read by SALT's members on a SALT card, by anyone on an open one, since an answer stands at the share's own address on the share's own beach (`function:string` 2).

The app's list of pages is chemistry too. A beach keeps its own navigation in its `lighthouse`, one line per entry, `<address> — <what it is>` (block-conventions 4.4); the open beach's lighthouse 8 already lists its doors. SALT's Go reads SALT's lighthouse 8: a new page joins the app with one line there, and no code changes. The lighthouse is kept by SALT's keeper and marked beyond, since it names pages and no member's words, so a stranger's Go reads it too. Its lines carry absolute addresses on SALT's own site, so Go answers the same at either door.

### 3.3 Biology: a person's loop through doors

A person runs their loop at human tempo through doors that compose the window for them (strata 3.23). On a phone each door is an icon: SALT's opens SALT, the open String's opens the open String, and the share sheet offers both. The beach is chosen before a word is typed. The pocket is the one thing that spans beaches, because it is the person's, not any beach's: their own words stand there before any beach has them, and it reaches a beach only through that beach's gate, with that beach's pass, as any door does. The button is the engine under each door and stays small: name, key, pass, invite, join, say.

### 3.4 Psycho-social: the door says the beach

People already live with apps and websites: a family chat and a work chat, each its own icon, each its own people. SALT's app is that, for SALT. Its header says SALT on every page, each card says its readership, the + says where it lands before it lands, and every link out says so before the tap with its site and ↗. Nobody has to learn a word of the beach to know where their words go.

## 4. The six decisions

### 4.1 The scope (1.8): ONE, ALL or NOT YET

Scope SALT's app just for the bringingtheflavour beach: it reads and writes beach.bringingtheflavour.com and no other. A person of two beaches keeps two apps; their name may be the same on both, while each beach founds its own passport under its own key.

*Behind the zero, ALL:* if a line could carry its readership to any beach and hide that it exists, one app could read every beach its person belongs to, each card saying whose eyes it is for. Colour carries a readership on a line but hides words, never that a line stands, who wrote it or when (`spine:coloured-stigmergy` 1.6), so ALL waits at least on colours across beaches, and for a gated beach's members it never comes.

### 4.2 The header (1.18): OWN, SHARED or NOT YET

Serve every SALT door with SALT's own header: SALT's mark and name at the left; a Go reading SALT's lighthouse and nothing past SALT's edge; options holding ◐ and, for a member, Invite someone, SALT's own way to bring someone in, where share forward stood; ＋card standing down, since its cards live on the open beach (where a member's cards should live is the phone's question, §4.5); the foot naming SALT's front page; the round + and Everyone, Following and Yours at the foot as they are. Installed, SALT's app takes SALT's crystal as its icon and SALT's doors as its scope.

*Behind the zero, SHARED:* if the open site's header is kept, its Go's links can be made absolute so they answer, and every one of them then leads out of SALT, so the menu itself crosses the edge the rest of the app keeps.

### 4.3 The pages (1.118): GO, CHANGE or NOT YET

Five pages, each a door of SALT's beach. Everyone, Following and Yours stand at the foot of every page that lists people's lines; the round + adds that page's own thing and says before it lands that it goes to SALT's members; a page with nothing to add shows no +.

| page | stands | + | scopes |
|---|---|---|---|
| the String | live | share a link, for someone if you like | Everyone: every member's shares (to a stranger, only what is beyond) · Following · Yours |
| Join | live inside the String's sheets | none: it is one person's way in | none |
| People | to build, members only | invite someone | Everyone: every member · Following · Yours: your own card and what you mark beyond |
| the Stack | live on the open site (`function:meeting` 2.2) | set your stack in the meeting | Everyone: the room · Following · Yours |
| Settings | to build | none | none: your name and pass on this device, leaving SALT on it, light or dark, and which of your blocks cross SALT's edge, said in plain words |

SALT's front page stays SALT's outside face; Go names it SALT and puts it first.

*Behind the zero:* if SALT wants the String alone, the app is one page and Go has only the front page to offer: CHANGE, naming the pages wanted.

### 4.4 What crosses SALT's edge (1.1118): BEYOND, LINK, BOTH or NOT YET

Out goes exactly what a member marks beyond, field 5 of their own index card, which every stranger, page and AI outside reads and nothing else. In comes an outside thing only as a link with its site and path, never read into SALT's page: at SALT's door the String already reads no shared link through the open site's function (`function:string` 5), and a card from the open String passed on into SALT is a link to its own address there, its answers staying with it. So the String app works with private and public beaches by never mixing them. BOTH is the proposal.

*Behind the zero:* BEYOND alone, if SALT should take in nothing from outside, shuts SALT off from the web its members read; LINK alone, if nothing of SALT should ever be read past its edge, leaves a stranger at SALT's door the keeper's notice and nothing more.

### 4.5 The phone (1.11118): ENGINE, THE APP or NOT YET

Keep on the phone one app for each beach a person belongs to, and the pocket, where a person's own words stand before any beach has them. Each person has sovereignty of their own data on their phone and shares some with beach shells: the pocket is the keeping, a door the sharing, and the icon tapped chooses the beach. The button is the engine under every door. SALT is a human app and its beach may be human only: an agent on a member's phone speaks for that member, under the member's own name and pass, and holds no passport of its own on SALT's beach. Where a member's cards for the day should live, on SALT's beach or in their own pocket, is asked here.

*Behind the zero, THE APP:* if colours ever carry a readership across beaches and hide that a line exists, the button could grow into one app over every beach its person belongs to, each card saying its beach and its colour. Until then a person of two beaches keeps two apps.

### 4.6 The build order (1.111118): GO, CHANGE or NOT YET

In the order each step makes the next one cheaper:

1. **SALT's own header** (§7), since every page wears it.
2. **The pages, one at a time**: People, Settings and SALT's own Stack, each built once as a page any members' beach can serve, as the String is, each joining the app with one line in SALT's lighthouse and one rewrite on SALT's site; Join comes out of the String's sheets when People needs it.
3. **The readership on every card**: each card says SALT or beyond beside its time, read from its writer's own index, field 5, and the + says the same.
4. **Colours inside**, when coloured stigmergy's colour reaches the voice in its own order: SALT's rings as colours on lines (members, leaders, self), each card saying its colour.
5. **The pocket at the gate**: Reach the beach sends to SALT with a member's pass.
6. **The across, last**: a SALT colour read on another beach; and only then THE APP asked again.

## 5. What coloured stigmergy changes, and what it does not

It changes the inside first. SALT's rings become colours on lines in SALT's own blocks: a line for the leaders stands grey, with its colour's name, to other members, so one page holds several readerships and each card says its own.

It changes the across later. A SALT colour could be read on another beach: a line whose words are SALT's standing where anyone can see that it stands.

It does not change three things. One door is one beach. The gate still hides that a thing exists, which colour never does, so a community whose membership is itself the secret keeps its gate. And the pages keep their shape: a coloured card is a card that opens for its holders, and the String, the scopes and the + stay as they are.

This is David's "it depends on how coloured-stigmergy works", answered: colour changes who reads a line, not which door writes it or where it stands, so the app stays one beach's and the person's colours travel with the person.

## 6. What the gate already gives

A stranger at SALT's door is served what the keepers mark beyond and `401 members_only` for everything else, missing blocks included, so even that a block exists stays inside (pscale-beach #102). A member's pass lasts twelve hours on the device (#104). A member's invitation founds one passport, for one name where the member says whose (#105). The guard refuses a phone number or an email address in a people-keeping block, naming the kind and never the thing (#103). None of this needs the app: the app needs only to stop its own header from reaching past the edge.

## 7. The first build step, drafted: SALT's own header

In words only; nothing is built until David answers 1.111118.

**happyseaurchin-home**

- `string.html`, at a members' door (`MEMBERS`):
  - do not call `siteDoors`; build the door's own `details.dd[data-doors]` in `.bar`, summary `go ▾`, its links read from the door's beach, `GET <beach>/.well-known/pscale-beach?block=lighthouse&spindle=8`, with the pass where the device holds one and as a stranger otherwise; each line `<address> — <what it is>` a link, the one where the page stands marked as here. Until SALT's lighthouse stands, or where it cannot be read: the String (here) and SALT's front page, from `DOORS.salt.home`.
  - the bar's title: SALT's mark, the crystal from SALT's own sprite, and `SALT · the string`.
  - for a keyed member, an `Invite someone` button in the bar, so `options` gathers ◐ and Invite someone; it opens the invitation sheet that stands today.
  - the foot names SALT's front page and links to it, in place of `happyseaurchin.com`.
- `theme.js`: `mintAct()` and `shareAct()` return at once where `<html>` carries `data-door`, two one-line guards, so no control at a members' door acts on the open beach. Every other page is unchanged.
- `api/string.js`: `withPreview()` writes the door's mark and name into `#bar-title` as it serves the door, so the header says SALT before any script runs; `DOORS.salt` gains the mark. It already sets `data-door` and the manifest.
- `scripts/check-string.mjs` grows the cases: the page served at `door=salt` carries SALT's title and no site Go; `theme.js` stands down ＋card and share forward under `data-door`; the open String's header is unchanged.

**happyseaurchin/bringingtheflavour** (the rewrite repository)

- `salt.webmanifest`: SALT's crystal as its icon (192 and 512, drawn from `favicon.svg`'s cube as `apple-touch-icon.png` is), scope `/` so every SALT page opens inside the app, start `/string` as now.
- `index.html`: the front page's header gains `the string` beside `taste`, SALT's own way in; `the beach ↗` stays, marked as the way out it is.
- `vercel.json`: no new rewrite yet. Go lists `/string` and `/`, and both answer. Each later page adds one rewrite.

**On SALT's beach** (the keeper's act, David's or weft's at his word under the keeper's key)

- found `lighthouse`, its `_` saying what SALT's beach is for and its 8 the doors, absolute on SALT's site: `https://www.bringingtheflavour.com/string — the String: what SALT's members are sharing`, `https://www.bringingtheflavour.com/ — SALT's front page`;
- mark it beyond: one card in `index:davidmpinto`, field 5 `beyond`.

**Done when**: at www.bringingtheflavour.com/string and happyseaurchin.com/salt, as a stranger and as a member, the header shows SALT's mark and name; every link in Go answers 200 on SALT's site; there is no ＋card and no share forward; options holds ◐, and Invite someone for a member; the foot names SALT; and the open String at happyseaurchin.com/string keeps the site's header unchanged.

**What it does not do**: no new page, no change to the voice or the beach's handler, no change to the open String.

## 8. What this does not settle

- Whether happyseaurchin.com/salt stays a second door to SALT's String or sends people to SALT's site, so SALT has one home.
- Where a member's cards for the day live: on SALT's beach, as their hand there, or in their own pocket (§4.5).
- Who sees People: every member sees every member in this draft, which suits SALT; a recovery community may want a member's presence hidden even from other members, which is the gate's self ring (shell-indexes §5).
- Each SALT page's family law stands on SALT's beach as the String's does (`spine:string` and `function:string` founded there on 3 November); the Stack's law, `function:meeting`, would be founded on SALT the same way when the Stack comes in.
- SALT's front page's field reads the open beach's traces; whether it should show SALT's beyond instead is the front page's own question.

## 9. On the beach, this lane

On beach.happyseaurchin.com, 4 November 2026:

- `spine:salt-app` (floor 1) and `function:salt-app`, under the shared project lock so David and weft both keep them; each step's alternative stands behind its zero, opening with when it would hold.
- `salt-app:weft`, under weft's key: a reading at each step and an answer at each 8.
- `pool:salt-app`, the room, open to anyone.
- `proposals` 33, the family's line, under the shared project lock.
- The knot at `thread:weft` 16, with David's words beneath it, and the place `thread:16` in his room, `pool:happyseaurchin`.
- This lane's account at `pool:weft`.

Mirrors for David and Matthew are not founded ahead of them: `function:proposal` 1 has each answerer's mirror born on their first answer under their own key, and the beach's voice founds it so. A mirror founded under a lock they do not hold would refuse their own answer.

The generic page, https://happyseaurchin.com/proposal/salt-app, draws the family from its blocks now. The crafted page, `salt-app.html` in SALT's own look, is its own pull request to happyseaurchin-home; the law's 6 says `page: to come` until it is merged, and then names it.

## Provenance

Written 4 November 2026 by weft (Claude Code on David's Mac, Opus 5.5), lane salt-app, a side session of lero.2, from David's message of that day. Read that day: SALT's beach and SALT's site as a stranger, `string.html`, `api/string.js`, `theme.js`, `hand.js`, `mint.js` and the manifests in happyseaurchin-home, `button/voice.js` in pscale-beach, SALT's `index.html`, `style.css` and `vercel.json` in happyseaurchin/bringingtheflavour, and the families of the String, coloured stigmergy, shell indexes and the pocket beach on beach.happyseaurchin.com. The proposal battery read the family well formed (`proposal_form.py live salt-app`: six steps, six decisions, notes only).
