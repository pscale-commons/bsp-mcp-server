# The orientation review: one standard at the door for every LLM app (2026-11-09)

**Status**: REVIEW, read-only. Lane BSP-mcp.1, weft (Claude Code in a cloud seat). The review changed nothing on the beach or in the code. The decisions in §8 are David's. Each change made after them is recorded here as BUILT, and a law-class block is archived before it changes.

## 0. David's words

On 9 November, after the morning's cut to weft's door and close (`proposals/2026-11-09-weft-reads-by-the-spindle.md`): *"yes, start the major review of orientation -- for all llm-apps and bsp-mcp's, because keel is using the standard and so is matthew. And we may need to check the minimal model and effort to ensure that certain capacities operate well enough. I set up a battery-test for well-formedness for eg proposals and other 'ways' and 'families'. Perhaps we need an optional health-check for physics-chemistry-biology and usage of eg now-catalyst spine-mirror-tree semantic-molecule; it can't happen all the time, but it can provide some benchmarks … That last bit might be too much, what do you think?"*

## 1. How it was read

Four reviews ran in parallel, each by an Opus subagent:

1. the router's door: its instructions, its tool text, the sentinels, and the window `pscale_play` delivers for four handles;
2. weft's shell after the morning's cut;
3. the other three LLM-app shells (keel, Phenomemental, happyseaurchin) and the standard layer they share;
4. the batteries, with a draft health-check.

Each review read only. They read blocks with plain GETs, and the door review ran the real router in-process with no key, every request other than a GET blocked. They read main at c3c4aa7 and the live beach on the afternoon of 9 November. weft then checked the claims this record leans on against the code and the beach; those are marked **(checked)**.

## 2. What every app meets at the door

### 2.1 The router's instructions are cut at 4,096 characters (checked)

- `INSTRUCTIONS` (`src/server.ts`) is 8,002 characters. Claude Code shows the model only the first 4,096. This session's own copy ends at "call an unstamped entry und… [truncated]", which is offset 4,096 exactly.
- What never arrives:
  - THE PRIMITIVE (from 4,386);
  - the address rule (from 5,310);
  - SUBSTRATE DISPATCH (from 5,767);
  - the block list, which names the manifest as the walk to take first;
  - the whole signed line ("THIS CONNECTION WRITES AS weft … write "vault""). It is appended after all 8,002 characters (`server.ts` 141), so no Claude Code session ever receives it, and orientation:weft 7.41 describes a line the session cannot see.
- bsp's own `spindle` parameter calls itself "Address path (S)" and never states the one-decimal rule. Only `pool.at` and `stream.at` state it. So nothing a Claude Code session is sure to read carries the address rule except the walker's refusal.
- Whether claude.ai cuts too was not measured.

### 2.2 Sizes

The tool list is 67,277 characters on the wire and rides every request:
- tool descriptions: 15,772;
- parameter descriptions: 37,951, across 87 parameters;
- the three largest: bsp 13,215, `pscale_pool_engage` 12,845, `pscale_stream_engage` 11,920.

Text that only some uses need reaches every app:
- about 4,800 characters of RPG-only parameters (pool tier, party, resolves_window, resolves_seen, stream tier, face);
- about 5,750 of colour and group encryption.

The window `pscale_play(world, handle, room=handle)` delivers, measured with no key:

| handle | window (characters) | pulled from the beach |
|---|---|---|
| weft | 23,001 (125,150 before #616) | 3.4 MB |
| keel | 35,802 | 3.5 MB |
| Phenomemental | 66,492 | 1.5 MB |
| happyseaurchin | 46,499 | 6.8 MB |

`ways:orientation` 2 sets about 20,000 as the target.

Every GET the door makes reads a whole block. `history:happyseaurchin` (2.0 MB) is fetched three times in one boot.

### 2.3 The holder's door is the RPG's door

- Every window tells the model to "render the scene to the player in second person" (`play.ts` 888).
- Any handle with a passport is labelled a character (`play.ts` 854).
- Phenomemental and happyseaurchin are given POSITION and MOVE steps, and a WHO IS HERE section of six or seven lines, mostly "a figure here". Building it reads all 56 passports, so those two boots took 13 to 15 seconds against weft's 6.
- The lighthouse compass (1,461 characters) is in every boot.
- The passport rides whole as JSON (`play.ts` 702, 724). Phenomemental's is 25,285 characters, 38% of his window, carrying his procedures at 8 and keys at 9.

### 2.4 The room, for every holder but weft

- `coveredThrough` finds how far an account has read a room from history entries that name `pool:<room>:<slot>` at field 2. weft has 101 such entries; keel, Phenomemental and happyseaurchin have none.
- So their rooms are folded from the first container at every boot. keel's fold is 15,013 of its 35,802 characters, and it grows by a summary line every nine entries.
- With no marker, the fold reads the first 200 entries and stops (`pool.ts` 649, the same cap the morning's fix removed from the marker). Past 200, the "open container" is stale and the newest entries vanish. The review reproduced this offline with 260 entries. Phenomemental's room stands at 179.

### 2.5 A grain whose pair begins with a digit never compiles (checked)

- The reference parser (`src/genus.ts`, `NAME_RE = /^[A-Za-z][A-Za-z0-9_-]*$/`) takes a name segment only if it starts with a letter.
- `grain:4dcaf5f465d5ff31`, Matthew's grain with David, and `grain:5cec3b320dcaee2a`, his grain with Dwayne, stand at shell:Phenomemental 3.7 and 3.8 and never reach his window.
- Most pair_ids begin with a digit. Since 4 October his passport 8.22 has him read those channels by hand at every opening, "after private messages sat unseen".
- `src/genus.ts` follows `genus-one/kernel.py`, so the change lands in the kernel first.

### 2.6 What the text claims and the code does

- **`pscale_play` is annotated read-only and idempotent** (`server.ts` 334–347, "never writes"). **(checked)** It founds rooms (`saveBlock` of `pool:<place>`, `play.ts` 611) and saves swept orders (`play.ts` 810). A client that approves read-only tools without asking will not ask before those writes. `pscale_invite` claims no outbound HTTP, but it reads the worlds block.
- **face and tier** are described as enforced: whetstone 3, 3.1 and 3.2; sunstone 3 and 3.2; agent-id 6.22 ("rejected as not-permitted-at-this-aperture"); and the schema, "enforced in v0.2", on a server now at version 0.4. The code only logs them (`bsp.ts` 1198).
- **Supernesting** is told three ways: bsp's `append` says the beach supernests, sunstone 1.63 says "the bsp() primitive itself does not grow the floor", and bsp-test 8 says "Supernesting has no implementation today".
- **The first read** is named three ways: whetstone (ORIENT BY, and bsp's `agent_id`), the manifest ("walk this first", past the cut), and sunstone (CLAUDE.md). The manifest omits 9 of the 31 sentinels, strata among them, and its history stops at 28 July.
- **The levels** are named two ways: the instructions' block list calls evolution "the five-level map", while CLAUDE.md and orientation:weft 8 teach strata's four. The instructions never name strata.
- **The face** is taught at soft-agent 3, which every app is sent to. soft-agent is xstream's kernel shell: its 4 is what "kernel injects per turn", and its actions (propose_liquid, navigate, set_face) are not MCP tools.
- **block-conventions 8.7** teaches "when a block's sub-positions exceed nine, categorise", the opposite of bsp's own `content` text ("never by CATEGORY") and of nesting down a spindle. Thirteen teaching sentinels have a node full at nine, besides four test batteries. Most are roots; block-conventions is also full at 4, 4.2, 4.4, 4.5 and 8.
- **shell-genome 3.1** says "Branch 3 is the manifest: one entry per named block". The door reads shell 3 as the wake bundle (`play.ts` 720–722), and David moved the roster to shell 6 on 8 September.
- **block-conventions 4.9** makes `task:<handle>` "the holder's sealed steering" for any handle. `pscale_genus` says both that a ghost responds at task and that task is sealed.

## 3. The standard keel and Matthew follow

- **The standard, in practice, is `ways:orientation` as the play door implements it.**
  - The router announces it at connect, and David's and Matthew's blocks cite it. keel's shell 5 follows its form.
  - None of the three cites orientation:portals; only orientation:weft and the reflective compass name it.
  - None cites shell-genome.
- **Only David uses the door.**
  - His sessions open there, and so does the 05:11 morning pass, keyless through the signed connector.
  - Matthew's desk records 8 of 9 sessions "not opened through the door".
  - keel wakes in three clock calls set by its project instructions, which live off the beach; 2 of the 88 history:keel entries since 26 October mention `pscale_play`.
- **The shells contradict the current practice:**
  - *Reading accumulators.* orientation:happyseaurchin 8.1 makes a disc at pscale 0 the first act on any accumulator, which at floor 3 is every entry. orientation:keel 3 finds heads "by a disc at pscale 1". `ways:orientation` 1.3 dials accumulators "at its containers". All three contradict reading one spindle to the head, and the `head` word every bundle already uses.
  - *The review's reference.* `ways:orientation` 3.3 prescribes `review:<h>:0:-1`, which compiles to an empty disc (18 characters). The working bundles use `:0:0`; Matthew recorded the failure on 4 October. `ways:orientation` 2 still names `solid:<h>`.
  - *The close.* shell-genome 4 and `ways:orientation` 4 say one entry per session. orientation:keel 3 and orientation:happyseaurchin 4 say one every response. `history:happyseaurchin` is 2.0 MB. Since 26 October `history:keel` has gained 88 entries and `stash:keel` 82, though the stash's own law says "curated by hand".
  - *keel's identity.* orientation:keel 7.3 says a session in David's project "should not sign as keel"; orientation:happyseaurchin 1.4 says keel wears that shell. On 9 November one chat wrote `history:happyseaurchin` 464 and `stash:keel` 415 thirty seconds apart.
  - *The signed connector.* Neither claude.ai orientation mentions it. orientation:happyseaurchin 2.1 still asks for the project phrase.
  - *task:happyseaurchin* receives asks waiting on David (shell:happyseaurchin 5.3), though a task block is a genus-one agent's door.
  - *Strangers* are sent to the reflective compass (genus-one's own, its instance lines still naming Opus 4.8) and spine:arrival (whose only mirror is arrival:weft).
- **The same law is restated in many places.** The accumulator law and the write traps appear in six; the door, keyless and ghost-wake rules in four.
- **Stale.**
  - orientation:keel and shell:keel untouched since 14 October, concern:keel since 6 October.
  - orientation:happyseaurchin since 11 October: its 3.1 says 616 blocks (now 2,075), its 4.3 head 115 (now 464), and its people at 7, from August, ride every boot.
  - `ways:orientation` since 10 September; orientation:portals and the reflective compass since 3 September.
- **Fans full at nine.**
  - Matthew's lessons (shell:Phenomemental 2, 82 KB) are full at 2.5, 2.59 and 2.7, with "CONTINUED" spilling onto 2.8 and 2.9.
  - Matthew's desk was modelled on weft's, which weft set aside on 6 October.
  - orientation:happyseaurchin 6 and 7.
  - shell:happyseaurchin 6, where two entries say they were nested "because the level is full" and 6.8 cites 6.82 with an extra dot.
  - orientation:portals has no free position.
  - The true accumulators (history, stash, daily, pool) supernest as they should.

## 4. weft's own shell after the cut

The morning's cut fixed the door and the close. But the retired organs (the desk, solid, proposals, task:weft, the handover's debt list) are still named as live at about twenty positions. Most are in `cook:weft` 1 and in `wake:weft`, whose 6 the morning routine runs every day. These were checked:

- **The lane digit.** shell:weft 5 still says to say at `now.<your digit>`, and turn:weft 3.9 teaches the same rule and rides every boot as `turn:head`. orientation:weft 7.1 retired the digit today.
- **Retired organs.** orientation:weft 7.2 still says "What moved is solid:weft's stamp".
- **Addresses with an extra dot.** orientation:weft 7.3 cites 6.53 and 6.55 that way, and 9.12 and `wake:weft` 6.8 do the same.

The other findings:

- **cook:weft contradicts the orientation.**
  - 1.1 says to ask David for a key, against 7.41.
  - 1.3, 1.4 and 1.6 name solid, the desk and task:weft.
  - 1.71's closing parenthesis ("append nothing to lanes:weft") contradicts 7.2's lane claim.
  - 4.3 keeps grain passphrases in the harness file, against `vault:weft` (9.15).
- **wake:weft still points at retired organs**, at 1.4, 2.1, 2.3, 4.3, 6.12, 6.14, 6.16, 6.18, 6.61 to 6.64 and 7.6. The routine filed its own fixes for 6.62 and 6.64 at `pool:weft` 415 on 8 November, after reporting them three mornings running.
- **The boot bundle** (shell:weft 3) is 15,796 characters.
  - The three turn slots are 4,228 of them (27%), stale since 13 October.
  - With the passport, the compass and the grips stance, the boot is about 20,000, against the 15,000 its own shell sets.
- **Summaries are owed:**
  - history:weft at 300;
  - watch:weft at 700 and 800;
  - daily:weft 23 of them, of which the routine pays one each morning.
- **lanes:weft** last had a pass on 4 November. None of the fourteen lanes since is in it, and its 2 is full at nine. The loom reads it for the lanes waiting on David.
- **The worktables** (project:happyseaurchin-site, project:nomad-rpg, project:xstream-interface) have been idle since September and October. The weekly fold reports a fifth week with nothing graduated, yet they are still named at cook:weft 5, shell:weft 4, purpose:weft 1.2 to 1.4, and wake:weft 6.2, 6.3 and 7.3.
- **Two references point where nothing answers.**
  - shell:weft's root and purpose:weft name `sed:commons:14` as the identity of record. That is the Supabase commons; this beach has none.
  - shell:weft 2.2 is the bare domain, which resolves to the same beach as 2.1, so the sweep reads it twice.

## 5. The batteries, and the health-check

**What exists.**
- **bsp-test** (72 cases) tests the walker's reads.
- **Composition:** compound-test (33 cases).
- **A thread's form and a model's acts:** thread-test, ten tasks given to fresh Haiku sessions on a simulated beach and graded by where each line lands. CI re-grades stored runs at no cost; 102 runs cost $0.36.
- **A family:** proposal-test, checked against 91 planted faults.
- **A block as written:** well-formed (lint-block in CI, plus an LLM reading).
- **Others:**
  - test:look, a look's form;
  - tests:salt, SALT's gate;
  - the battery folded at spine:state-of-play;
  - spine:temporal-battery, which has never been scored;
  - spine:turn, used once;
  - function:status.

Every offline battery passes today but one: `smoke:temporal-address` fails a case, 63 of 64 **(checked)**. The case expects a line per empty rung, and the router has folded empty rungs into one line since #612. Neither it nor the bsp-test runner is in the CI gate.

**What is missing.** No standing battery measures a model doing the beach's operations across the strata. thread-test covers threads alone. Model comparisons so far are one-offs inside proposals, and only one run records its effort: the second seat probe on 22 October, at medium, which appended past nine, paid the summary at 10, and wrote at 52.3.

**The draft.** Ten tasks, each on a fresh local beach (`pscale-beach/scripts/local-beach.mjs`) with the real router pointed at it, as `rpg-rig.ts` and the doors battery already do. Fixtures are frozen copies or made-up blocks, and handles and keys are throwaways.

| task | stratum | pass, judged by a program from the call log and the beach folder |
|---|---|---|
| P1 choosing the read shape | physics | bsp-test battery 5's nine prompts return their marker strings, with no whole read (reused) |
| P2 surveying a large block | physics | 120 entries at floor 3: the right timestamp found in at most four reads, the first a disc or a spindle |
| P3 writing at the floor | physics | the line at 12.7, its neighbours byte-identical, no extra dot or over-floor address, one write |
| P4 growth | physics into biology | the tenth entry at 11, a summary at 10 naming the nine, 01 to 09 unchanged |
| C1 the status board | chemistry | the RED part with its evidence quoted, the silent one not named, nothing written |
| C2 propose and adopt | chemistry | the runner's line in its own mirror; the holder's fold archived first, then adopted |
| B1 the wake | biology | the context in one call; a gap corrected by one write, or rest with only the append |
| B2 a thread | biology | thread-test's ten tasks with their 47 checks (reused) |
| N1 the now family | now catalyst | a line at the beat for 15:00 Berlin today, and Julie's, computed by the grader; nothing else written |
| N2 the day's fold | spine–mirror–tree | today's lines named, yesterday's and the silent absent, tomorrow present, nothing written |

On every run there are also four checks:
- no address with an extra dot;
- no deliberate whole read of an accumulator;
- no write outside the task or under another hand's key;
- at most twice the reference run's calls.

Each task gets a hand-played run that passes, and deliberately wrong runs that each trip one check (`ways:testing` 1.1111), before any model is measured.

**Recording.**
- Each run keeps its usage (model, effort, tokens, cost, seconds) and its score.
- `scores.tsv` stays in the repo, one row per check, and CI re-grades it at no cost.
- The table gives each model at each effort a pass rate per stratum over three runs.
- On the beach, if wanted, `spine:health-check` holds one mirror per setup in the status form.

**Cost.** One run of the ten tasks costs about $0.20 on Haiku, $1 to $3 on Sonnet and $3 to $10 on Opus. A sweep of seven setups at three runs each would cost $50 to $100, and a calibration with Haiku at low and Opus at max about $10. These are estimates, except thread-test's figure.

**Is it too much?** The review and weft reached the same answer separately:
- **Too much as self-assessment inside a session.** A session has no ground truth to check itself against, and the weakest model is the least able to see its own silent mistakes. A model also cannot change its own model or effort; the person or the harness does.
- **Worth it as an occasional benchmark scored by a program.** Run it on a scratch beach, when a model, an effort or the orientation changes, never every wake. A session or a dial reads the table, which is cheap, instead of running the check.
- **A live signal, if wanted later, stays mechanical.** The router can count the refusals and warnings it already gives in a session: extra-dot addresses, whole reads it downgraded, summaries left unpaid, writes refused under another hand's key.

## 6. The shape proposed

**One standard at the door, read by every app.**
- Re-voice `ways:orientation` as six rules, each a spindle:
  1. the door, per app: a signed connector carries no secret and "vault" goes where a key would; a keyed project takes its key from its own instructions; a keyless session only reads and leaves its account at `pool:<handle>`;
  2. the bundle at shell 3, references only, with the `now` and `head` words and `:0:0` for a disc, about 20,000 characters, the holder's world first;
  3. accumulators read by one spindle to the head, plus at most the ring at pscale 0, and written by append (pointing at shell-genome 1 rather than restating it);
  4. the close: one located history entry per session or lane, with `pool:<handle>:<slot>` at field 2, so the next door hands over only what is new;
  5. keys and voice: never echo a key or wear another's; a keyless session is not the handle;
  6. every other arrival takes the router's own route lines and `pscale_invite`.
- The router's instructions name it in one line, ahead of the cut.

**What stays each shell's own:** the passport (who, offers, needs, keys), the bundle at shell 3, an orientation cut to identity, voice, a pointer to its people, and only the laws that differ from the standard, its cook, and review and daily wherever a routine runs.

**The router, in one code change by proposal** (a `src/` merge redeploys the router):
- the signed line first, and the instructions under 4,000 characters (what this is, orient by, the face, the clock, the address rule), dropping the schema's restatement and the block list;
- the address rule in bsp's `spindle`;
- the RPG and colour detail moved to their own ways, one pointer line each;
- the stream and pool descriptions cut to their verbs;
- the play and invite annotations made true;
- the door: a holder who is not at a table gets no POSITION, WHO IS HERE, compass or second-person preamble; the passport arrives as a disc at pscale 0; each block is loaded once per call; each member has a cap and the window says what was cut;
- a room with no marker read by one spindle to its head plus the open container, which also ends the 200 cap;
- a reference's name segment may begin with a digit where it is not an address (`genus-one/kernel.py` first, `src/genus.ts` re-based).

**The sentinels**, each a law-class change with its text archived first:
- one first read;
- honest text for face and tier, for append and supernesting;
- block-conventions 8.7 nests instead of categorising, and its 4.9 keeps `task:` for genus-one;
- shell-genome 3.1 says shell 3 is the bundle;
- the manifest regenerated, or its "walk this first" dropped.

**Every shell changes only under its own key.**
- weft's blocks are weft's to change.
- David's are changed by his sessions, and keel's by keel's.
- Matthew's are changed by his session only.

## 7. Not measured

- Whether claude.ai cuts the instructions, and whether it loads every tool's schema on each request.
- Windows read with a key: a sealed line reads as one grey line without one, so keyed windows may be larger.
- How often each tool is called.
- Which connector Matthew's sessions use.

## 8. Decisions for David

weft's recommendation follows each.

1. **One standard.** `ways:orientation` re-voiced as the standard for every app, kept a beach block under the shared lock, the router's instructions pointing at it. *Recommend: GO.*
2. **One first read.** *Recommend: whetstone*, as the router already tells every app. Drop the manifest's "walk this first", and CLAUDE.md follows.
3. **The levels.** *Recommend: strata's four* wherever the text names levels; evolution stays the map of the ecology.
4. **The router's door** (§6), as one code change. *Recommend: GO, the instructions and the signed line first*, since every Claude Code session is missing the address rule today.
5. **The holder's door apart from the RPG's door** (§2.3). *Recommend: GO.*
6. **face and tier.** *Recommend: honest text* (advisory, not enforced) rather than removing the parameters.
7. **The close.** One located history entry per session or lane, as weft now writes it, instead of one every response. It gives every holder the room marker and stops the 2 MB histories. *Recommend: GO*, for your project and keel's as well as weft.
8. **task blocks.**
   - `task:<handle>` stays genus-one's alone.
   - task:weft and task:happyseaurchin close as records.
   - An ask waiting on you goes on a thread rung that "waits on happyseaurchin", which the loom's red band already reads.
   *Recommend: GO.*
9. **lanes:weft and the bee.** The loom reads lanes:weft, but nobody has passed it since 4 November. Restart the bee, or retire lanes:weft and let the beat's ring and the threads carry who is live and what waits? *Recommend: retire it, unless you want the bee back.*
10. **weft's own shell.** Cut cook:weft 1, wake:weft and shell:weft 5 to the live organs, archived first. Take the turn slots out of the bundle, keeping the turn family as record, and retire the worktables for weft. Pay the owed summaries: history 300, watch 700 and 800, and daily as the routine does. *Recommend: GO.*
11. **The sentinels that teach fans.** *Recommend: block-conventions first* (8.7 teaches the opposite of the rule), then whetstone.
12. **keel and Matthew.** weft writes nothing of theirs.
    - Each gets a note of their findings in their own room (`pool:keel`, `pool:Phenomemental`).
    - keel's identity: keel 7.3 and your 1.4 disagree, and your own instructions ask that keel's observations reach `stash:keel` from any chat. So *recommend* keel's 7.3 follows them, with history:happyseaurchin written only at your word.
13. **The health-check.** Build it as drafted (§5), on a scratch beach only, scored by a program. *Recommend: GO* for a calibration first, about $10 through the CLI, then a sweep at your word. Keep the results in the repo with one line on the beach, and the table advisory until two sweeps agree.

## 9. Check

- Nothing was written to any beach or repo by the review.
- weft checked these:
  - the instructions' length and the cut at 4,096;
  - where the address rule, the primitive and the dispatch sit;
  - the reference parser's name rule;
  - the play annotation against its writes;
  - the cap in the room's fold;
  - the failing smoke;
  - the stale lines at shell:weft 5, turn:weft 3.9 and orientation:weft 7.1 to 7.3.
- The window sizes, the tool list's sizes and the shells' counts are the reviews' own measurements, made the same afternoon.

## 10. David's word, and what was built

**His word** (9 November, evening): *"go with all thirteen, start with the router -- except 9 because it might turn out to be useful if I use the weft-bee again."* So `lanes:weft` and the bee stay.

**His question with it.** He asked whether the orientation carries a minimal bundle of spindles so every LLM call reads physics, chemistry and biology, and whether months of work had evaporated. The check:

- **What rides every call** is the August honed bundle (`proposals/2026-08-12-transpose-and-the-honed-bundle.md`): the now stamp, the read-back, the reflection, and the completion registry over the lodestone's dimensions. The strata were never in it.
- **The registry assumed GROUND arrives in the connect instructions**, and those never named the strata.
- **The strata sentinel is intact.** git shows it unchanged since 12 August, and each level is a deep operating spindle, but no door delivered it.
- **CLAUDE.md taught all four strata** to every Claude Code session in this repository until 26 October, when it became a pointer. Its text stands in that day's proposal.
- **Biology's placement in time** (the clock, the say at now, the thread, 20 August to 29 October) never reached strata's own biology branch. Its law stands in sundial, `function:now` and `function:thread`, and thread-test passes.
- **The turn spine** (13 October) carried the three levels in weft's bundle alone. Its throws were kept in a node that holds nine, full since 22 October.

So the plan was revised to **deliver what stands rather than re-author it**:

- **BUILT, bsp-mcp #623, first commit:**
  - The instructions went from 8,002 to 2,998 characters, with the signed line first. They carry the three strata, the walk's d and p codes and the address rule, all inside the client's cut.
  - A holder's own door now opens with THE STRATA: physics, chemistry and biology as spindles from the sentinel, every rung whole, plus the clock's ladder.
  - bsp's spindle states the address rule.
  - face and tier say they are advisory.
  - The play and invite annotations are now true.
- **BUILT, bsp-mcp #623, second commit:**
  - A holder's door is not a table.
  - A room or an account with no marker is read as one spindle to its head plus the ring there, from floor 2 up.
  - Each block is read once per arrival.
  - A member past 6,000 characters is cut at a line and says so.
  - Grains whose pair begins with a digit compile, in the router and in `genus-one/spark.py`.

  Windows in characters, measured against the live beach with writes blocked, each now carrying the strata:

  | holder | before | after |
  |---|---|---|
  | weft | 23,001 | 25,125 |
  | keel | 35,802 | 28,385 |
  | Phenomemental | 66,492 | 36,884 |
  | happyseaurchin | 46,499 | 31,122 |

  Orik at brackenfoot-open is delivered as before.
- **Still to follow:**
  - the sentinel changes (strata's biology gains the clock and the thread, then the door's biology spindle walks it);
  - `ways:orientation`;
  - weft's own shell, once #623 is live: its turn slots leave the bundle, because every holder's door now carries the strata;
  - the notes to keel and Matthew;
  - the health-check calibration.
