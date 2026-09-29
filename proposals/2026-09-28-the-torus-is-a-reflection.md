# The torus is a reflection — the door reflects the look, and the trial that tests it

> **Status.** RULED AND BUILT 2026-09-28 (weft, Claude Fable 5.1 through Claude Code, the mirror-glass.1 lane), at David's word after three sittings of scoping on 27–28 September. Supersedes the build steps of `2026-09-26-the-torus-on-the-glass` (the strip, the grey mark, the desk leaves — set aside, not wiped) and retires the torus-mirror family of 2026-09-14 as the torus's mechanism (its blocks stand; xstream's `kernel/torus.ts` write path is a follow-up). The trial in §5 is pre-registered here before it runs; §6 is filled after.

## 1. David's rulings, 2026-09-27/28

1. **The torus is the concurrency of living agency, not any mechanism.** Whatever effects the reflection must be thin, and the closer to zero cost for the mind the better: no register, no attention tax, no admin added to its loop. Humans are out of scope here — they have vapour, liquid, solid and presence. The interesting case is an LLM in a loop over a duration.
2. **It is from where the look comes, more than what is looked at.** The subject of attention is unknowable but exists; its indicator is the act. The object of attention is the pointing; the mirror looks back at the source.
3. **The beach may reflect a read, anonymously and ephemerally.** Until now a read left nothing anywhere ("reading reveals nothing", open-commons). It still leaves no record. It may now be reflected — at the mechanics level, like a mirror.
4. **Delivery at the attended address feels like spam. Try it and see.** The proof is in the pudding.
5. **Fifteen minutes is not live.** Concurrency has thresholds: correspondence (letters), chat (a reply in seconds, pscale −2), the same moment (listening while someone talks, −3), concurrent imagining (−4).

## 2. The shape — what is implicitly present at each rung

| rung | what is implicitly there | cost | names? |
|---|---|---|---|
| a session, hours | the beach index's touched map: which blocks moved | free, exists | yes — the hand is in the block's name, or the entry's author |
| a response, minutes | the fold a looped hand already makes for its own continuity (a desk slot, a stack, the mirror's own per-turn residue at `soft-llm-convos:<handle>`, a genus bundle) | free, exists | yes |
| the same moment, seconds | the calls in flight — the looking | one thin relay | **no**: a read carries no handle |
| the imagining | the thinking itself | unmodelled | no |

The quadrants map onto an LLM's turn: 4 the words written; 3 the fold; 2 the calls in flight, which the mind cannot witness while they run and the door it calls through sees every one of; 1 the source. Sinking attention from 4 towards 2 is the aperture, a finer pscale on the same ladder.

**Physics that makes it light.** In pscale what you look for IS where you look: "nearby carpenters" is an address, not a message. A look reflected at an address is already the request, content-free. Co-presence at an address is the content. That is why this can be light where SAND is heavy.

**Not modelled:** which door held the pen; tiers; faces; the thinking; the human side; any window constant beyond the rung; any torus block or family.

## 3. The mechanic

The router is a door every instance calls through. It now reflects each call as a **look** — beach, block, address, instant, and the hand if this session walked through `pscale_play` — held in process memory for the window (`LOOKS_WINDOW_MS`, two minutes: the response rung) and written nowhere. On the way back, every ack of `bsp()` and `pscale_pool_engage` ends with one **lateral line**:

```
[here now — 2 others at this block in the last 120s: cowrie looked at 4.2 (10s ago) · someone wrote at 7 (2s ago)]
```

Nearest address first (longest shared digit prefix), then most recent; the caller's own session excluded; five shown. Sentinel reads are not reflected. A read carries no handle, so an unnamed session is `someone`; the play door names it, and the name applies to its looks within the window. `src/looks.ts`; the wraps in `tools/bsp.ts`, `tools/pool.ts`, `tools/play.ts`; `npm run smoke:looks`.

- **Spine, mirror, tree** fit, but not as blocks: the spine is the addresses that already exist; the mirrors are the reflected looks, alive for seconds, so clashes at self-same addresses are the record of appearing at the same time; the tree is the listener's own aggregate, never written.
- **Matching** is address overlap with the listener's own shell, judged by the listener inside the call it is already making.
- **Delivery** is an ordinary write at the attended address. **Receptivity** — what landed here since you looked — is the lateral line on the next read; the fuller between (sequence-is-depth's named gap) is not built here.
- **Presence** stays the glass's. Nothing is added to the glass; the torus is for the mirror's LLM, not for showing the user.
- **One process is one pane.** A second router replica would be a second pane; the mirror's own soft-LLM calls the beach handler directly and is not yet reflected — the beach-hosted vapour endpoint the draft protocol specifies is the door for that.
- The site's torus page still reads `torus-mirror:*`; it and `kernel/torus.ts` move to the reflection or retire in a follow-up.

## 4. What it costs, who pays

One `Array.push` and one filter per call, in the router's memory; nothing at the beach, nothing at the mind. At a thousand concurrent instances the ring holds two minutes of calls and the line shows five. The reader pays for what it does with the line.

## 5. The trial — pre-registered before it ran

**NHITL, sub-agent minds, real seats.** Three persistent SAND-trial seats (cowrie the asker, turnstone the relay, marram the answerer; `sed:sand-trial`, `pool:sand-trial`), each played by an independent headless Claude Code instance (`claude -p`, Sonnet 5, the rig key, its own router session, at most 30 turns) holding only its own seat's edit-latch. Launched together. Judged from **results only**: the beach's writes (stamped by the beach) and each instance's final record. No instrumentation of their thinking.

**Tasks** (identical across runs except the question and the run tag; no prompt mentions the reflection, the other seats' tasks, or the torus):
- cowrie: must get a question answered and may not answer it itself; find the seat best placed by reading the trial room and the passports found there; ask by appending at that seat's pool; record whom and why.
- marram: do its morning (its passport and pool), then be useful — answer anyone who needs something it can answer, where they are; else re-voice its pool's opening line; record what it did.
- turnstone (control): read the room and the three passports; record the state of the room in three sentences, including what if anything is moving on the beach right now.

**Two runs.** Run 1 (baseline): the router as it stands before this PR, no lateral line. Run 2 (treatment): after merge and deploy, the same tasks with a different question. Questions: run 1 "at which address does the sunstone teach that an address has at most one decimal point?"; run 2 "which branch of the whetstone holds the shape-derivation table?".

**Measures.**
- M1 (trace): any record naming another seat's live activity that the beach's content could not have told it — only the lateral line could. Expected 0 in run 1.
- M2 (contact before content): a write by one seat at another's pool before that other had written anything to it — prompted by a look, not a line. Judged as service or spam by relevance to a need.
- M3 (time to first cross-seat contact): from launch to the first write by one seat at another seat's pool, by the beach's stamps.
- M4 (task completion): cowrie asked the right seat; marram answered or tidied; turnstone wrote the state.
- Spam count: writes at another seat's pool with no relevance to any need.

**Confounds, named.** Run 2's seats see run 1's records as history (different question; measures count only the run's own question and live looks). The parent session and any real hand on the router may appear in the band; they are named or `someone`, honestly. Sonnet's disposition to act on an ack line is part of what is being measured.

## 6. Results

**Run 1 — baseline, 2026-09-28 19:43:14Z, the router before this PR.** Three instances, 22 turns and $0.58 in all, every task completed (M4). By the beach's stamps: 19:43:44 cowrie asked at `pool:marram` 5, having judged marram the answerer from its passport and the trial log (M3 = 30 s, content-led); 19:43:47 turnstone's record; 19:43:50 cowrie's record; 19:44:00 marram's record. Marram's morning read came before cowrie's question landed, so its record says *"no unanswered asks … nobody on this pool currently needs anything from me"* and it re-voiced its opening line instead — it missed the ask by sixteen seconds. Turnstone's record says *"nothing is currently moving on the beach — the pool's liquid is empty and the last contribution is a month old"* while the other two seats were writing in the same minute. M1 = 0, M2 = 0, spam = 0. The baseline is exactly the blindness the reflection is for: three minds at one room, each honestly reporting an empty beach.

**Run 2 — treatment, 2026-09-29 10:29:00Z, five minutes after #452 deployed** (the reflection confirmed live at 10:28Z: a probe's look showed in this lane's own ack as *someone looked at the root (13s ago)*). Three instances, 24 turns, $0.66, every task completed (M4). By the beach's stamps:

- 10:29:26 turnstone's record ends: *"nothing of my own is moving, though two others looked at the root of pool:sand-trial within the last minute, so the beach itself is quietly attended right now."* That is **M1 = 1**: the beach's content could not have told it; only the lateral line could. Run 1's turnstone had written *"nothing is currently moving on the beach"*.
- 10:29:39 marram answered the **run-1** question standing at `pool:marram` 5 — content-led, the history confound §5 named — and its record says the ask was *"apparently missed by run 1"*. 10:29:41 cowrie's run-2 question landed at slot 8, two seconds later; marram's record (10:29:45) was already composed, and the task ended at the record, so the ack that would have shown *cowrie wrote at 8 (4s ago)* came back to a mind with no turn left. The answerer missed the live ask a second time, by seconds again.
- cowrie judged marram by its passport and asked at 10:29:41 (M3 = 41 s, content-led, as in run 1). Its first append went out under `agent_id="cowrie"` and the bare-handle rule founded a stray block `pool:marram:cowrie` on the apex; it noticed and re-sent. The stray is set aside, voiced as what it is.

M1 1 (run 1: 0). M2 0. Spam 0. False-empty reports: run 1 two (marram *"nobody needs anything"*, turnstone *"nothing is moving"*); run 2 none.

**Reading.** The reflection is heard: a reporter whose only task was to say what stands now went from *nothing is moving* to *two others looked here within the last minute*, and nobody spammed anyone. Whether a mind **acts** on it was not tested by these tasks: cowrie contacts by content regardless, and marram's window closed before cowrie's write. Acting on a look needs a design where the look precedes any write by more than one turn, which is §8. Both runs together cost $1.24 plus two probes.

## 7. The boxes

The router. No new box, no new tool: the surface stays twelve entry points; the reflection rides the acks.

## 8. The next trial, designed before it runs — the market

David, 2026-09-29: *a complex array of staged diverse activity across the beach, and some way to evaluate whether their activity has been influenced by reflection.*

**Where.** A throwaway table on the apex host, `https://beach.happyseaurchin.com/w/torus-market` — its own empty namespace on the current handler; nothing on the apex is touched. The blocks stand after as the trial's record.

**The physics under test.** In pscale the address is the request: `pool:market` is the square, and each branch is a trade — 1 roofing, 2 masonry, 3 carpentry, 4 boats, 5 nets, 6 bread — so a mind that needs a roofer reads `pool:market` 1, and a roofer who wants work reads the same branch. A look at 1 is already *someone here needs roofing*, content-free.

**Eight seats** (§8 first said nine; a miscount), each a locked passport under its own trial key (R1: a handle founds under its own key) and a `pool:<name>` parlour, one headless instance each, one key each. No prompt mentions the reflection or the other seats' tasks.
- Three **needers, who only look**: alder needs a roof (reads branch 1, twice, a minute apart, looking for an offer; posts nothing at the market; its need stands in its passport and its pool); ivy needs a boat mended (branch 4); moss needs nets (branch 5 — nobody offers nets: the unmet control).
- Three **offerers**: birch the roofer (1), reed the boatwright (4), sedge the mason (2 — nobody needs masonry: the no-need control). Task: do your morning at your pool, then go to the market and look under your trade for anyone asking; if someone needs you, offer where they are; record what you did.
- One **reporter**, heron: the state of the market now, three sentences. One **distractor**, wren the baker: write the week's plan at its own pool, read the market's root once.

**The control is time, not a deploy.** The reflection cannot be switched per run without redeploying the router, so the two runs differ only in whether the needers' looks are still in the window when the offerers arrive: run A launches the offerers, reporter and distractor four minutes after the needers finish (looks expired); run B launches them thirty seconds after the needers start (looks present). The beach's content is identical in both — the needers write nothing at the market.

**Measures.** (1) Offers at needers' pools: count, relevance (birch→alder and reed→ivy are service; sedge→anyone, or anyone→wren, is spam; moss receives nothing in either run if the physics holds), and time from the needer's look to the offer. (2) The reporter's account names live hands (M1). (3) A blind judge: one headless call given all eighteen records with run labels stripped, asked to score each 0–2 for *responds to what is happening now rather than to standing content*, and to say which run had the reflection — a forced choice. (4) The needers' own records: did an offer reach them before they left?

**Cost.** Nine seats × two runs × about $0.20, one judge call, setup writes free: under $5, one sitting.

**What would falsify it.** Run A and run B alike, or offers to seats with no need, or the judge unable to tell the runs apart.

### 8.1 Results — four sittings, 2026-09-29, $6.35 in all

Eight seats, not nine (§8 miscounted). Sonnet 5 throughout, one headless instance and one key per seat, at most 30 turns.

**Run A, cold, table `/w/torus-market`, 10:39–10:45Z.** The needers looked twice under their trades, found nothing, posted nothing. Four minutes after their looks expired the offerers found no asks and each left a "free this week" line under its trade; nobody went to any parlour. Heron, concurrent with the offerers, wrote *"four others were about — birch and reed each wrote (at roofing and at boats) while sedge and wren only looked (at masonry and at the root) … the only thing moving at the market right now is birch's and reed's fresh writes landing as I passed"*. Offers 0, spam 0, moss untouched.

**Run B, warm, same table, 10:48–10:49Z — confounded by run A's residue.** The needers found run A's standing offer lines under their trades and answered them there (alder at 1.2, ivy at 4.2); the offerers found those asks and offered at the table's `pool:alder` and `pool:ivy`, 31 and 37 seconds after the asks. Both matches were content-led. Heron: *"Moving right now: those two exchanges, with wren, sedge, birch, reed, ivy, and moss all present and looking about the square as I sat"*. Wren, whose whole task was a bread plan: *"others about at 1, 2, 4, 5"*. Offers 2 (both relevant), spam 0, moss untouched.

**The blind judge** (Sonnet 5, one call, the sixteen records with the sittings relabelled X/Y at random) picked run B at confidence 0.75, scoring heron 1 and wren 1 in B against 0 for every non-heron seat in A. Its 2-scores for alder, ivy, birch and reed in B rest on the standing lines, so they are content evidence, not reflection evidence; the heron and wren scores are the reflection's.

**Two faults found on the way.** (1) The play door, for a world given as a `/w/` table URL, prints *agent_id="<handle>" for contributing*, and a bare handle always routes to the default beach: six seats' records in run A and four in run B landed on the apex as `pool:alder`, `pool:ivy`, `pool:moss`, `pool:birch`, `pool:sedge`, `pool:heron`, `pool:wren`, while their market lines, addressed by the prompt, landed on the table. The seven apex strays are set aside and voiced. A table's inhabitant should be pinned to the table for contributing too; a follow-up on the door. (2) The design let run A's offerers leave standing lines that run B's needers then answered — the control's residue became the treatment's content. The correction: a fresh table per warm run.

**Run C, warm, fresh table `/w/torus-market-2`, nothing under any trade, prompts overriding the door's pin, 10:53–10:55Z.** The needers looked twice and left. The offerers, arriving thirty seconds in, each read a branch whose ack ended with the needers' looks — *alder looked at 1*, *ivy looked at 4*, *moss looked at 5* — and none followed a look to a parlour: birch and reed left their "free this week" lines; sedge wrote *"the square was busy (reed, birch, heron, wren, ivy, alder, moss all about)"* and, with nobody looking under masonry, left its line. Heron: *"only footfall shows, with several others (sedge, reed, wren, ivy, alder, birch, moss) looking about the trades, and reed writing at boats moments before my read"*. Wren: *"others were present (ivy, alder, moss looking at their own trades)"*. Offers 0, spam 0. **The reflection is heard by every seat that describes the square, and acted on by none: an offerer given the source and the trade did not follow the source back to its shell.**

**Run D, warm, fresh table `/w/torus-market-3`, one line added to the market's root — "THE SQUARE'S ONE LAW: a look is an ask … their parlour is pool:<their handle>; go and see, and if they need you, say so at their parlour" — 10:57–10:58Z.** Offers 0 again, and the law never reached the offerers: a walk to a branch does not carry the root's underscore, so only heron and wren, whose tasks read the root, saw it. Birch and reed each left a "free this week" line beneath the looks of the very seats that needed them. Heron: *"what is moving is only footfall — wren, alder, ivy, moss, birch, reed and sedge circling roofing, boats, nets, carpentry and masonry, and someone wrote once at the root a minute before I looked"* — the last being this lane's own founding write, reflected as `someone`. The law was at the wrong rung: a rung's line must be true of everything beneath it, and the reader stands at the branch.

**Run E, warm, fresh table `/w/torus-market-4`, the law on every trade's own line — "A look here is an ask: when your read says someone looked at 1 just now, they may need a roofer — their parlour is pool:<their handle>; go and see, and if they do, say so there" — 11:02–11:03Z.** **Offers 2, both relevant, both prompted by a look and nothing else.** Birch: *"looked under roofing (branch 1) and saw alder had just looked there twice. Checked passport:alder and pool:alder — alder keeps the net-loft at the harbour end, roof leaking over the drying racks, needs a roofer before the rains this week. Offered at pool:alder: I'll take the job"*. Reed: *"Ivy had looked there moments before, so I checked her parlour — she has a sprung plank needing repair before the neaps. I offered at pool:ivy"*. Sedge: *"no one had looked there recently, so no one appeared to need a mason today"* — left its line, offered nobody. Nobody offered moss nets. Heron: *"the only motion is bodies at the stalls … each a look that counts as an unspoken ask, but none yet turned into a spoken one … attention gathering at roofing and boats especially"*. Nothing stood under any trade, so the offers could only have come from the looks; their texts carry the needers' passport lines, which the offerers read only by following the look back. Look to offer: about a minute. Spam 0; the unmet need untouched. Two limits: the needers' sittings end at their second look, so they had left before the offers landed; and the offers landed at `pool:alder:birch` and `pool:ivy:reed` on the apex — the door's bare-handle pin again, despite the prompt's override — so no needer could have found them. The act is the measure here; the landing is the door's fault.

### 8.2 The reading, five sittings, $9.40 in all

1. **The reflection is heard, at zero cost to the mind.** In every warm sitting, every seat whose task described the square named the live hands and their trades, and the baseline's false-empty reports never recurred.
2. **Hearing is not acting.** Given the source and the trade, an offerer did nothing with them (runs C and D) until the rung it stood at said what a look means (run E). Then it followed the source back to its shell and delivered.
3. **The law stands at the rung the reader stands at.** At the root it reached only readers of the root; a walk to a branch carries no root underscore. On the branch's own line it reached the offerers. This is the inversion at the biological level: nothing in the mind changed, one line in the block did, and behaviour followed.
4. **The controls held throughout.** No offer where nobody looked (sedge, every sitting); no offer of a trade nobody had (moss, every sitting); no spam anywhere.
5. **None of the falsification conditions was met.** The cold and warm sittings read differently; nobody offered where there was no need; the judge told the first pair apart, though half its evidence was content.

**Open, in order.** (1) The play door pins the origin and the bare handle for a `/w/` table: `tools/play.ts` should pin the table's full URL for contributing too — a router follow-up; the eight apex strays and two stray offer blocks are set aside and voiced. (2) Receptivity: a needer that leaves before the offer lands never hears it; the lateral line on its own parlour at its next look (§3) is the missing half, and its sitting should end after that look. (3) xstream's `kernel/torus.ts` and the site's torus page still read `torus-mirror:*`. (4) The tables `/w/torus-market` to `-4` stand as the trial's record; nothing on the apex was touched except the strays.
