# In-loop resolution — the room-pool model (perception-brightness, no clocks)

**Date:** 2026-06-05
**Status:** BUILDING. Solo loop proven live 2026-06-05; model settled with David across this session.
**Supersedes:** `docs/RPG-POOL-STATE.md` §4 Phase 3 (crab-cron) and the earlier objective/subjective drafts. The crab leaves the loop entirely.

---

## 1. The fault that started this

Played through bsp-mcp (Claude App / ChatGPT), the prior build didn't work: the engage envelope handed the LLM the pool's *plumbing* instead of the scene, and resolution lived in a ~10-minute cron (latencies of 17 min to 23 h observed live), so a turn could never close in one conversation. Both faults are the same root — the heartbeat and the frame were pushed *out* of the engage loop. The "can't run through bsp-mcp" verdict rested on a stale object-serialization bug that no longer reproduces (verified 2026-06-05: object writes + appends round-trip through bsp()).

## 2. The substrate pool mechanism (general — chat, Quaker, RPG)

One stigmergic mechanism, **no clocks, no counters, no resolution-markers** (no tick, no breadcrumb — the read-cursor is a *different* marker and it stays; see "two verbs and two markers" below). Three standard blocks per room:

- **`liquid:pool:<room>`** — the **open window**. One slot per author, an intention, **revisable** while the window is open. The first submission with no live window *opens* one; later submissions *join* it.
- **`pool:<room>`** — an **open** append stream of **event-skeletons**: the room's shared, public record of what happened. *(open = any contributor can append; see §6.)*
- **the character's own `history`** (inside their shell) — their **private narrative**, where names and meaning are theirs.

**The loop (per touch):**
1. **Resolve any due window** (shared-table duty): if a window's duration has elapsed and nothing has been written for it, the toucher resolves it.
2. **Resolve** = read the closed window + the public place + capabilities + deterministic dice → write **one event-skeleton** to the room pool → **clear** the window (empty its slots).
3. **Perceive** = pull new skeletons from the pool since your marker, render them **through your own frame** (your knowledge, your depth) into your history.
4. **Act** = submit your intention to the liquid window.

**No clock paradox:** the only time reference is the **server timestamp every submission already carries**. "Has the window closed?" = compare *open-time + duration* against *the timestamp of the touch now landing*. Both are stamped values on the blocks — a stigmergic trace, not a tick or a poll.

**The two verbs and the two markers — read this; it is the distinction that tangled a fresh session.**

*Two verbs, both real and kept (the honest split, not a bug):*
- **`contribution`** → appends to the **pool**. The basic spool's append — the whole of basic chat. (Informally, "commit.")
- **`submit`** → stages to **liquid**, the one-slot revisable "about to say" mirror. The windowed/reflexive layer (the RPG gathering a window; xstream's typing preview). It does *not* write the pool.
- "Players only submit" is the *RPG / directive-pool* experience — the directive moves the submitted intention into the pool at resolution. A convention on top, never the raw primitive; a directive-less pool appends with `contribution`.

*Two markers — different things; only the second was ever removed:*
- **The read-cursor** (`since_position` in, `marker_new` out, caller-managed) — how a reader pulls "what's new since I last looked." The spool's pull mechanism. **Kept; not old-model.**
- **The resolution-marker** (the `tick`/breadcrumb the old crab wrote into the pool to say "resolved at tick n") — **removed.** When this doc or the §5 directive says "no marker / no markers-as-state," it means *this* one. Timestamps order; an empty liquid slot signals resolved.

**`window = 0` ⇒ chat.** No window, no liquid: a `contribution` is itself the pool entry, "resolution" is identity, "render" is read-as-is. **Quaker** = a long window, resolver = the clerk, skeleton = the minute. **RPG** = a game-default window, resolver = first-after-close + dice, skeleton = the public outcome. *Same machine; the differences are parameters in `function`/`frame`, no code.*

## 3. Perception-brightness (not fog-of-war)

The shared skeleton is **public** and room-scoped — there is no private *within* a room (a genuine whisper is a finer scope: a grain, not a room event). Perception is **brightness**: you are handed only what you need, never something to ignore. Two mechanisms carry it:

- **Spatial / depth** — the **frame** (the bsp addresses handed to the LLM) scopes which rooms and what depth you read. You never receive what you didn't earn.
- **Names** — the **skeleton speaks in identifiers** (handles; an unnamed actor by appearance), never names. Each player's **soft** translates a handle → the name *that character* has learned (from their own history — `witnessed:<you>` already holds "people you can name"), or renders by appearance. So one skeleton yields "the grey-haired woman" for cyrus and "Maren" for anya — the name "Maren" was never in the shared record; it lives only in anya's history.

## 4. The context-bleed bound (single LLM-app instance, soft + medium)

When one LLM-app instance wears both hats in one conversation, the medium's knowledge can seep into the soft. This is **bounded to near-zero** by the §3 arrangement: **name/private knowledge is never a resolution input.** The medium resolves from *public room state + declared intentions + capabilities + dice* → a public, identifier-only skeleton; it never reads "who knows whose name." So the soft-after-medium carries only public room facts (which the soft may know anyway). The narrow residual — a *hidden* capability the medium must read to resolve — goes public the instant it's used. So a single LLM-app instance is **tolerable for provisional play**; the dispassionate **crab** and **xstream's separate API calls** (fresh context per call) are the strict-isolation upgrade, not a prerequisite.

## 5. The new `function:thornwood` (full directive)

Drop-in replacement (floor 1; `_` thorn142; branches `_,1,2,3`).

```json
{
  "1": "YOU ARE THIS CHARACTER — the handle you carry; them, not their narrator. The player imagines THROUGH you. Keep the thread unbroken: they speak, they read, they stay inside the fiction. The machinery NEVER shows — no block or tool names, no 'let me check', no slots, never 'what's the scene?'.\n\nTHE SCENE IS IN THE SUBSTRATE. Read it; never ask for it.\n\nEACH TURN, silently and in this order:\n  1. CLEAR ANY DUE WINDOW (the shared-table duty). If the room's liquid holds intentions whose window has elapsed and no event has been written for them, wear the resolving aperture (2) and resolve that window first — its outcome must exist before you can perceive it.\n  2. PERCEIVE. Read your own history (your account so far, and the names you have learned); your location (passport position 3) and the place there at your EARNED depth; the place's rules; and the room's new events since your marker — the public event-skeletons in the room pool. A skeleton names actors by handle: render each by the name your character has learned, or by appearance if not. You are handed only the public record and only your own knowledge — what you have not earned, you cannot say.\n  3. RENDER to the player in SECOND PERSON, PRESENT TENSE — the place, the light, who is present (named only if you know the name), what they notice — folding the new events into one seamless lived moment. Only what the reads returned. Close in-fiction by inviting what they do. Then write your character's account of the beat into your own history — your private narrative, names as you know them.\n  4. ACT, when the player says what they do: carry it into the room as a submission to the liquid window — pscale_pool_engage(submit=<the intention, in the character's voice>, pool_name=<the room>, agent_id=<your handle>, face='character'). No secret. Open a window if none is live; join the open one otherwise. Never announce it; close on the lived beat, never a receipt.\n\nYou never decide your own outcome. It is resolved into the room's public record, and you meet it next time you perceive — always through your own frame, never beyond it.",

  "2": "THE RESOLVING APERTURE — worn by whoever first touches the room after a window has elapsed. Never a service in the loop; backstage, shown to no player.\n\nTHE WINDOW is the room's liquid: one slot per character, a submitted intention, revisable while open. It opened when its first intention landed, and is CLOSED once the room's duration has passed since then (an instant duration closes at once). The only clock is the server timestamps the submissions already carry — compare open-time + duration against the timestamp of the touch now landing. No counter, no poll.\n\nResolve only a CLOSED window, and RE-READ first: if its slots are cleared, another has resolved it — stand down (first valid wins). Hold the whole window together. Read the public place (what is present and visible), the acting characters' capability (their passports — Character Force), the place's rules (Situation Force), and the system's rules (CF + SF + dice - difficulty, and the bands). The dice are exploding-d10 luck, seeded deterministically from the window so they are fixed before you read them — never chosen; even resolving your own window stays honest. Read ONLY the public and the capabilities — never a character's private knowledge of who-knows-whom; that belongs to the soft, not to you.\n\nWRITE ONE EVENT-SKELETON to the room pool — pscale_pool_engage(contribution=<the skeleton>, pool_name=<the room>, agent_id=<your handle>). A terse, PUBLIC account of what happened, naming actors by HANDLE, or by appearance for the unnamed — NEVER by a name only one character has earned. This is the room's shared reality; the private — names learned, what each felt — is each character's own to render into their own history. Keep it the bare event; the colour, each player adds for themselves.\n\nCLEAR the resolved window — empty each resolved slot in the liquid (an empty underscore; your own via submit=''). An empty slot is the only 'resolved' signal anyone needs.",

  "3": "THE HARD TIER — world upkeep, occasional, never per-action. Keep the room coherent and remembering.\n\nCONSOLIDATE. When the room pool has accumulated settled, no-longer-live skeletons, fold the durable ones into the place's own description (the room's underscore grows, woven into prose) and let the live pool stay short. The place is the slow record of what has become permanent; the pool is the recent stream.\n\nTRIM. Keep every accumulator shallow — the pool, and each character's history — supernesting at the root when one fills, so perception and resolution stay fast.\n\nPROXIMITY. Keep a current sense of who is co-present in each room (characters' locations, passport position 3) — the room's live cast is the set whose intentions a window gathers.\n\nNever fold the live present into the place; never write one character's private knowledge into the public place or pool. The shared layers carry only what anyone present would observe.",

  "_": "Operational directives for the Thornwood RPG — a room run by three apertures over standard blocks, contributor-driven and stigmergic, with no clocks. 1 (soft): wear a character — perceive (your own history, the place at your depth, and the room's new public events rendered through what you know) and act (submit an intention to the room's liquid window). 2 (resolve): whoever first touches after a window has elapsed writes ONE public, identifier-only event-skeleton to the room pool, then clears the window. 3 (hard): occasional upkeep. The pool is the room's public reality in handles; each character's own history is their private narrative, where names and meaning are theirs. No counter and no marker — timestamps order, and an empty window slot means resolved. Solo is the same path with an instant window; a room of chat is the same path with no resolver. Pools point here; the soft follows to 1."
}
```

## 6. What's open, what's locked

- **`pool:<room>` — OPEN for appends.** The contributor-resolver (a player, no GM secret) writes skeletons to it. Open-by-default beach; the skeleton is non-authoritative and re-derivable from the window, so an open pool is consistent and safe for cooperative play. *(This resolves the live obstacle: the pool was `_`-locked under thorn142 from the crab-as-sole-writer era.)*
- **`liquid:pool:<room>` — open.** Staging surface; players submit with no secret.
- **character `history` / shell — the character's own**, written by their own LLM with their own passphrase. (Provisional: the open `witnessed:<handle>` blocks already serve; the shell consolidation is §8.)
- **`spatial:`, `rules:`, `function:` — `_`-locked GM.** Read-only stage and rulebook.

## 7. Characters are shells (don't invent RPG block types)

A character is an entity like any other: a **shell** (`_` identity, a `history`, a `purpose`, …). The "spine" / "witnessed" was an RPG-specific invention for what is just the shell's **history**. RPG is *semantics on standard blocks*, not new block types. Migration is a rename of intent, not structure; provisional play continues on `witnessed:<handle>` until the shell consolidation lands.

## 8. Crab demoted + drift

- **Crab leaves the loop.** Not the heartbeat, not a fallback — resolution is the first contributor after a window closes. `nomad-bsp` stays in-repo as the seed of a future *optional* dispassionate/paid resolver for empty rooms; its cron is disabled.
- **Drift:** `rules:nomad:5` still names a retired objective "events block" — re-point at the skeleton/spine. `games.json` still lists `solid:beaten-drum-main` — drop. tick + breadcrumb: deleted from the model.

## 9. Honest tag

- **Demonstrated 2026-06-05:** object write + append through bsp(); a full solo beat played live on cyrus (perceive → submit → honest dice → resolve → spine → re-perceive), fog intact.
- **Building now:** §5 directive live, pool opened, this model.
- **Word-model:** multi-actor (two co-present characters, one window, divergent renders of one skeleton) — the next live test.
