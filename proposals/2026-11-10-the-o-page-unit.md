# The o-page unit: six things on every page a person is handed, and a door for their own AI (2026-11-10)

**Status**: PROPOSED. Written at David's "Write the proposal" as the proposal family `o-page-unit` on beach.happyseaurchin.com:

- `spine:o-page-unit` and its law `function:o-page-unit`, under the shared project lock;
- its room `pool:o-page-unit`, open;
- its line at `proposals` 37.

The standard view, happyseaurchin.com/proposal/o-page-unit, was read headless at 390 wide as a stranger reads it, and the proposal battery finds the family well formed (four steps, four decisions). The four decisions wait on David. Its crafted page is being built to the crafted-proposal-page craft and follows in its own site PR. The law's 6 names it once it stands.

## 0. David's words

On 10 November, after the meeting pages went live (`2026-11-09-met-one-record-three-views.md`):

> wow, excellent. So, if I have a meeting with someone, or anyone does, what's the procedure for a person to turn it into a ring … the standard met page, and the snazzy page? … We definitely need it well defined for an LLM so an LLM can walk a user through it; is this the 'way' block. But perhaps we should also have schematics for each of the ways, not just this 'met'? SO that a human can understand the process and potentially follow it 'manually'. Or is it more like a proposal...? It's a visualisation of the recipe. Does this demand a new form? … in every proposal, schematic, animation, or recipe, or met there is the invite to hook up the bsp-mcp to their llm-app and let their LLM walk them through the process. Could be as simple as a button with a popup with instructions rather than a steer away to the /connections page. … So we seem to be creating a minimal o-page 'unit': standard beach content, decision-points/comments, pool, threads, snazzy version (with look and animations etc), and LLM-app portal instructions.

Then: *"Write the proposal."*

## 1. The unit (decision 1.8)

Whatever someone is handed, whether a proposal, a schematic, a meeting, a walk or a film, carries the same six things. A person who has learnt one page has learnt them all.

| | The thing | Where it stands today |
|---|---|---|
| 1 | The page, drawn plainly from its blocks | `/proposal/<name>`, `/schematic/<name>`, `/met/<name>`, `/ring/<name>` |
| 2 | Its crafted page, in a world of its own | each one named at its family's law, 6 |
| 3 | A place to answer: a decision or a comment, kept in the reader's own reading | `proposal.html`'s decision cards; `says.js` for comments on parts; `met.html`'s That's it and Not quite |
| 4 | A room to talk in | `pool:<name>`, or for a meeting its keeper's parlour |
| 5 | The threads it set going | `threads.js`, named at the law's 5 |
| 6 | A door for the reader's own AI | **missing**: the pages send a reader to /connect and leave the rest to them |

The first whole one was the meeting of David and Sam on 6 November. It had:

- its ring and its plain page;
- its crafted page;
- answers in each person's own reading;
- talk in David's room.

It lacked the sixth.

**Decision 1.8:** is this the unit every page a person is handed should carry?

## 2. The door (decision 1.18)

There is one button, "with your AI", on every page. It opens a sheet over the page and never takes the reader away from it, as the meeting pages' Share does. The sheet holds three things:

1. **How to add the beach to their AI**, in Claude's own menu steps.
2. **A first message to paste.** The page writes it from what it knows: its link, its family, the way it follows, and where the reader is. For example:
   - on a meeting: *"Use the beach connector. I'm reading the meeting sam-6-nov at happyseaurchin.com/met/sam-6-nov. Tell me what was said and what's next, then help me answer it in my own reading, as ways:met says."*
   - on a proposal: *"Read the proposal o-page-unit, spine:o-page-unit, and help me answer its decisions in my own reading."*
   - on a walk: *"I'm at step 3 of the walk; take me through the rest."*
3. **The way to /connect**, for everything else.

There are two connectors:

- **The open one** (`https://bsp.hermitcrab.me/mcp/v1`) reads everything. It writes only with a key the AI is told.
- **The hidden-key one**, made at /connect's Medium tab, carries the person's key, so the AI never sees it.

The sheet offers the open one to a stranger, and the hidden-key one where the device already knows a name. Once connected, the AI meets the router's own door, cut to fit every LLM app in #623 (`2026-11-09-the-orientation-review.md`).

The door is built once, in `theme.js`, which every page already carries. Each page says only which way it belongs to:

- meetings, `ways:met`;
- proposals, `ways:proposal`;
- schematics, `ways:schematic`.

**Decision 1.18:** build the door into every page as described?

## 3. The way, the walk and the schematic: no new form (decision 1.118)

David asked whether a process's face for people needs a new form. It doesn't. A thing a person can do on the beach has up to three faces:

- **Its way**, `ways:<name>`, is for the AI. It is text only, with every step exact, and the door hands it over.
- **Its walk** is for the person doing it by hand: a proposal read as a document, as keel's mind-meld is made. (`function:mind-meld` is mode document, phase proposal, and its 1.8 asks OWN AI, BY HAND or WALK ME.) Each step is a place the person reaches, and their answers mark how far they have come.
- **Its schematic**, where the inside needs explaining, is the schematic form's map of what already runs.

What stands today:

| Process | Way | Walk | Schematic |
|---|---|---|---|
| The thread | `ways:thread` | none | `spine:thread-schematic` |
| The meeting page | `ways:met` | none yet | none |
| The mind-meld | none | its walk, with its crafted page | none |

A walk is already a document a person moves through, with their place kept in their own reading (`function:document`, `function:proposal`). A schematic already draws a running process at three depths (`function:schematic`). A recipe form would rebuild what those two already carry.

**Decision 1.118:** is a process's face for people its walk, with a schematic where its inside needs explaining, and no new form?

## 4. The order (decision 1.1118)

Four pieces, each small and each its own:

1. **The door**, built in `theme.js`, with each plain reader saying its way.
2. **The meeting page's walk**, in mind-meld's shape, so a person can make a meeting page by hand or with their AI.
3. **The proof.** A fresh claude.ai conversation, not the session that wrote the way, follows `ways:met` for Tom's meeting while David watches. Every step that stumbles mends the way.
4. **The crafted pages** gain the door with no work of their own, because they already carry `theme.js`.

**Decision 1.1118:** build in this order?

## 5. On the beach

**`spine:o-page-unit`**

- The root line, with four steps chained at 1, 1.1, 1.11 and 1.111, and their side-rooms.
- Decisions at 1.8, 1.18, 1.118 and 1.1118. Each is answered GO, NOT YET or CHANGE, and each waits on David.
- The title carries a non-breaking hyphen ("The o‑page unit"), so the standard view's heading never breaks at "o-".

**`function:o-page-unit`**

| Position | What it holds |
|---|---|
| 1 | mode document |
| 2 | the decisions |
| 3 | the room |
| 4 | set aside |
| 5 | threads: none yet; the door is the first, once 1.18 stands |
| 6 | the page |
| 7 | phase: proposal |
| 8 | `map: beach 1.1`, which is "coming in" on `spine:beach-schematic` |
| 9 | provenance |

**The rest**

- `pool:o-page-unit` is open, and the family's line stands at `proposals` 37.
- The battery (`proposal-test-materials/proposal_form.py live o-page-unit`) finds the family WELL FORMED. It leaves two notes:
  - the room is empty;
  - the battery's port of `proposal.html`'s phase reading no longer matches the page. That note is for the battery's keeper, not for this family.

## 6. What waits

1. David's four answers.
2. The crafted page at happyseaurchin.com/o-page-unit, in its own site PR. Once it stands, the law's 6, the spine root's 2 and the list line name it.
3. On a GO at 1.18, the door's thread.
