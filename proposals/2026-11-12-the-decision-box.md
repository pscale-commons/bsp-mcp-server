# The decision box: a trusted voice's ask reaches a person as a page or a box, never as a summary (2026-11-12)

**Status**: DECIDED by David on 12 November 2026, in lane leros.3, in two decision boxes: where the hint goes, and the trust test ("Yes, a shared grain").

## 0. David's words

Matthew had posted eleven lines in weft's parlour and a long design reading in his own mirror. Weft answered with more long text, and David said:

> I don't know what I am meant to look at. I need a proposal. I can't deal with a lot of text that I am meant to parse and even work out where to answer! If he is not creating a proposal, then please explain the questions and what decision needs to be made.

Weft then put three decisions to him in a question box, each with its recommendation first, and he answered all three at once. He said:

> That sounds like a good idea -- a box with recommendations -- a decision box. That needs to be on the beach, instructing the user. If there's a proposal -- give the proposal link (snazzy preferably) to the user, and if not, a decision box. The user can ask their llm to write responses to a proposal for them, or in their llm-app shell voice. But a human should get a snazzy page, or a decision box with recommendations.

Weft first placed the rule in the o-page unit. David corrected that:

> Matthew just posted a bunch of stuff to you, correct? In your parlour? … It is in this process that you should be given the hint of -- don't just mention, or summarise, but actually provide decision box because the source is a trusted person. Obviously we don't want to force decisions on a person from just random people!

## 1. The rule

A person asked for something by someone they trust is handed one of two things:

- **The proposal's crafted page**, if one stands.
- **A decision box** if none does. Each decision is one plain sentence, with its options and the recommendation first.

Their own AI may answer for them, in their own voice, when they ask it to. It never passes the ask on as a mention or a summary.

A voice the person does not trust is mentioned, and is never put to them as a decision.

## 2. Where it lives: the moment a room hands its lines to an AI

The rule lives in the room envelope (`src/tools/pool.ts`), beside the verbatim discipline that already rides every plain room. That is the line that reads: voices are verbatim, never let a summary replace what was said.

The door reads the room through the same envelope: `pscale_play` calls `handlePoolEngage` for the holder's room. So a holder's own start-up carries the rule too, weft's included.

Directive rooms skip it, as they skip the verbatim line, because their law governs how they are rendered.

## 3. The trust test: a grain both people accepted

The beach already records trust that both sides accepted: a grain (`grain:<pair_id>`, ways:grain). So the test is read, never listed anew.

For each distinct author among the voices handed over (bare handles only, never the reader), the envelope computes the pair with the reader and reads `grain:<pair_id>`. It reads at the room's own beach, then at the default beach. A grain counts when its block stands with no reach pending at its 8.

Those voices are marked `· grain` in their slot line. When at least one is marked, one line says what a trusted ask becomes. When none is marked, nothing is added, so no stranger's line is ever pressed on anyone as a decision.

There is no new block, no list to keep and no cache. It costs one read per distinct author in the slice handed over.

## 4. Tested

- `smoke:pool-engage` has a new section: Bob's parlour, read over an in-memory beach.
  - Read as Bob, ann's voice is marked: she holds an accepted grain with him.
  - zed holds no grain, and cal's reach is still pending, so neither is marked.
  - The hint rides once, and before the voices it concerns.
  - Read as zed, nothing is marked and no hint rides.
  - All 205 checks pass. `smoke:room-fold`, `smoke:play-split`, `smoke:door-orientation` and `smoke:envelope` pass unchanged.
- Live, read only: weft's parlour from 446 to 457 through the branch.
  - Phenomemental and keel are marked, since both hold accepted grains with weft. Weft's own line is not marked.

## 5. What it is not

It is not the o-page unit. That unit (`2026-11-10-the-o-page-unit.md`) is what a page a person is handed carries. This is what an AI does when a trusted ask reaches its person and there may be no page at all.

It also does not change who can write in a room. The parlour stays open to anyone. Only what reaches a person as a decision is gated.

## 6. Deploy

The change is in `src/`, so a merge redeploys the router on Railway and ends every live MCP session.
