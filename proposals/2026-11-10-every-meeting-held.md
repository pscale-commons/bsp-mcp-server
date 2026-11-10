# Every meeting held: a line in the meeting room for each, a list at /met, and each person's own (2026-11-10)

**Status**: BUILT, waiting on David's merge of happyseaurchin-home #645. The page was checked against a local stand-in beach seeded from the live blocks; nothing was written to the live beach while testing.

These land on the beach once the page merges:

- the law lines (§4), with the standing text first copied to `archive:function:meeting:2026-11-10`;
- the step in `ways:met` (§5);
- the sentence at `pool:meeting`'s root (§6);
- Sam's meeting's line (§7).

## 0. David's words

> Potentially Matthew could put up his met via github with his other pages. The issue is there's no central list of meetings. Perhaps we should create something like the string, or news, which allows people to append their meetings; and then a person can view their own sequence of meetings; and if someone says they were at that meeting, so their string also contains the link to that meeting. Does this make sense?

Then: *"Yes, build it."*

## 1. What stood

**`pool:meeting`**, the meeting form's room:

- It is open to anyone, and calls itself "a list, never a register of authority".
- It holds FOUNDED, COPIED and ARRANGED lines, each with its page.
- The ring and the State Stack read its COPIED and ARRANGED lines.
- It held no line for a meeting held after the hour: `sam-6-nov`, the first meeting with a page after the hour, was not in it.

**Each person's own lists**, from the shell-indexes proposal:

- That proposal was GO'd on 4 November. Its mirror index, `index:mirrors:<handle>`, lists every mirror a person writes, appended by the act that makes it.
- It is not built yet. thread:14 is at its first step, the checker, and only `index:waer` stands.

## 2. The line

Each meeting held gets one line appended to `pool:meeting`, with face `author`:

> `HELD — <name> — <what it was about>; met: <who, as its WHO says it>; <day month year>; by <handle>; <its page>`

- **The name** is the meeting's family where its spine stands on this beach. Otherwise it is a short name of its own: the page address's last part.
- **Its page** is any address:
  - the crafted page, where one stands;
  - else `/met/<name>`;
  - a page on another site (Matthew's GitHub pages) is listed the same way.
- **The latest line for a name stands**, so a correction is a later line. Nothing is deleted.
- **Other readers are untouched.** The ring and the State Stack match only COPIED and ARRANGED lines (`ring.html`, `stack.html`, checked).

## 3. The list at /met (happyseaurchin-home #645)

- **`/met`** with no name lists every meeting held, newest first by the line's date.
  - Each meeting shows what it was about, linked to its page.
  - It shows who met; each person with a handle links to their own list.
  - It shows when it was held.
  - It links the plain page where the meeting's spine stands on this beach, and says "on <host>" for a page elsewhere.
- **`/met?who=<handle>`** is one person's list. It shows both sides of being there, each from its own hand:
  - **named**: the line's `met:` names the handle, or the line was added by them;
  - **answered**: their own reading, `<name>:<handle>`, stands. This is "if someone says they were at that meeting, their list also has the link". Answering the page is how they say it, and the reading is theirs, under their own key.
- **"Yours"** is a chip that appears when the device knows a name.
- **Add a meeting** is a form on the list itself, the String's way: its page, what it was about, who met, when, and your name. A page of this site whose spine stands fills in the rest.
- **Sharing**: the bar's share button gives the list, or one person's list, as a link and a QR code.
- **From each meeting's page**: "every meeting held" in its foot and in its Detailed view.

## 4. The law (lands once the page merges)

**`function:meeting` 2.3** becomes `{_: <2.3 as it stands>, 1: <2.31>}`.

**2.31:**

> EVERY MEETING HELD: happyseaurchin.com/met lists every meeting held, newest first, from the HELD lines in the form's room, pool:meeting — 'HELD — <name> — <what it was about>; met: <who, as its 1.2 says it>; <day month year>; by <handle>; <its page>' — the latest line for a name standing; its page may stand on any site. happyseaurchin.com/met?who=<handle> is one person's: the meetings whose line names them or was added by them, and those they have answered in their own reading. The keeper's LLM adds the line once the page stands (ways:met 6.1); anyone may add one from the list's own form. A list, never a register of authority.

**7.32** gains a last sentence:

> Once the page stands, the LLM lists it in pool:meeting with a HELD line (2.31).

## 5. `ways:met`

**6** becomes `{_: <6 as it stands>, 1: <6.1>}`.

**6.1:**

> LIST IT — once the page stands and its person has seen it, append one line to the form's room with pscale_pool_engage (pool_name 'meeting', agent_id the keeper's handle, face 'author'): 'HELD — <name> — <what it was about, in a few words>; met: <who, as 1.2 says it>; <day month year>; by <keeper>; <the page to share, without https://>'. It is the meeting's place in happyseaurchin.com/met, and in each person's own list at /met?who=<handle>. A page made on another site, a GitHub page among them, is listed the same way, its address the line's last part. A correction is a later line with the same name.

## 6. `pool:meeting`'s root

After the COPIED sentence:

> When a meeting has been held and its page made, a line lands here too — 'HELD — <name> — <what it was about>; met: <who>; <day month year>; by <handle>; <its page>' — and happyseaurchin.com/met lists them, and each person's own at /met?who=<handle> (function:meeting 2.31).

## 7. Sam's meeting, listed

> HELD — sam-6-nov — How a recruiter uses AI, and where the beach fits; met: happyseaurchin (David) and Sam; 6 November 2026; by happyseaurchin; happyseaurchin.com/sam-6-nov

It is appended by weft at David's word.

## 8. What waits

1. **The mirror index.** When `index:mirrors` is built (thread:14), a person's first answer will append the meeting to their own index. `/met?who=` can then read that index instead of the beach's index of block names.
2. **Meetings on other beaches.** A meeting kept on another beach (Matthew's) is listed here by its page. Its readings stand on that beach, so `/met?who=` does not see who answered it.
3. **Wrong lines.** An open room takes any line. A wrong one is corrected by a later line with the same name, and nothing is deleted.
