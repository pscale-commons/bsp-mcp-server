# Where a page is named — the mirror offers the page that stands (2026-09-27)

**Status**: amendment to the `soft-agent` sentinel, adding 3.344 and 6.83. It goes proposal-first per
[2026-08-05-law-writes-get-their-record](2026-08-05-law-writes-get-their-record.md), and the
sentinel's standing text is this repository's history. The lighthouse half is already written
at the beach (`lighthouse` 1.1 and 8.21, logged at 9.2). The mirror's half is
happyseaurchin/xstream-bsp#362.
**Prompted by**: David, 2026-09-27, comparing claude.ai with mirror.onen.ai. He asked the mirror to
*"take me to matthew's lero project pool? and provide me with a link to the o-page url so i can see
his overall structure?"*. It offered `happyseaurchin.com/render?…&block=pool:lero-nnh`. Asked the
same, claude.ai gave Matthew's own site, his rooms, his now, his hand and his project walks.
**Lane**: watch:weft 471 (matthew.1).

## 1. What happened

A reader finds a page only where a block it already reads names it. Matthew's pages were named in
none of the places a reader looks:

- **His passport** doesn't name them. His site (phenomemental.github.io/happyseaurchin-beach,
  static pages that read and write the beach directly) is listed at `artifacts:Phenomemental` 8.
  His passport points at that block from 7, so the site is two reads away, through a block name
  no reader knows to open.
- **His rooms** don't name them. None of his four rooms' opening lines mentions a page. The chats
  founded through /found do, which is why `pool:now` shows its links in the mirror.
- **The mirror** doesn't know where pages are named. Its soft-LLM reads a copy of this sentinel
  built into xstream, plus bundled whetstone and conventions, and never the lighthouse. The only
  page address in that copy is /render, which 3.341 says is never a visitor's page. It offered
  /render anyway, because it knew no other.
- **The link was broken.** It was written in bold, and the mirror's link-maker kept the closing
  asterisks, so the link opened `pool:lero-nnh**`, which returns a 404.

The sync had also stopped. xstream's seed was last synced on 2026-07-26. This sentinel was
restructured to go deeper on 2026-08-13 (#278), and xstream's flattener read only three levels:
on today's sentinel it drops 13 of 72 lines, including the Character face, the Observer face and
the new 3.344.

## 2. The change

- **soft-agent 3.344**: *A page that already stands is NAMED where it lives — read it there,
  never assemble it: a beach's own pages in its lighthouse (bsp(agent_id=<beach>,
  block='lighthouse')), a person's own pages, on the site or off it, on their passport and the map
  it points to. Offer the standing page before authoring one (6.8), never /render to a visitor,
  and write the address bare — outside bold, brackets or quotes — so it opens as written.*
- **soft-agent 6.83**: *A page that already stands comes first: when {user} asks for a link to
  something that has a page — a person's own site, a family's walk, a room — offer that page
  (3.344), and author a view only for what no standing page shows.* Without this line, 6.8 would
  have read David's ask as a request to author a new view.
- **lighthouse 1.1**: *A person's own pages — on this site or off it, a page they built
  themselves — are named on their passport, so to send someone to a person, read the passport
  before offering a link. happyseaurchin.com/page/<handle> lays the card itself: their own words,
  their now, their parlour.*
- **lighthouse 8.21**: the pages by name, each with its address pattern: /page/<handle>,
  /now/<handle>, /hands/<handle>, /walk/<project>/<handle>, /tree/<family> and /beach-pages.
  /render is named as a maker's window, never a visitor's page.
- **xstream#362**: the link-maker trims what only frames an address; the flattener walks any
  depth, each line under its own address; and the seed is synced whole to this sentinel.

## 3. What it does not do

It adds no index of people's sites, no new block kind and no new tool. A page is found where a
reader already looks: the passport a person keeps, and the compass the beach keeps.

## 4. Matthew's side

It's his to write, and he has been asked in his own room (`pool:Phenomemental`): put his homepage
on passport 3 ("how you meet me"), and have each room's opening line name its page. Once he has, a
reader finds his pages in one read, and the mirror shows the link to anyone who enters the room.

## 5. The check

Once xstream#362 is deployed, confirm that the served Mirror chunk carries `addressOf`. Then ask
the mirror the same question David asked. It should read the lighthouse and Matthew's passport
and offer his site and /page/Phenomemental, not /render. Any link it gives should open.
