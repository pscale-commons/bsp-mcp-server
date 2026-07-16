# NHITL round 2 — what the gate fix landed, and what it exposed underneath

**Date**: 2026-07-15
**Status**: FINDINGS. No build proposed here; three items need homes and `project:nomad-rpg`
branch 2 has no free slot (see §5).
**Run**: two fresh-context seats, blind (no repo access, tools only), spawned concurrently
against live thornwood, after bsp-mcp #149 deployed.
**On the table already**: the world-split at `project:nomad-rpg:1.3` (present), the validated
completion at `3.4` (past). Everything below has no slot.

## 1. The fix landed

Round 1: the gate's liquid mirror reported `0 authors` **four times out of four, to both
seats**, including in the same response that confirmed their own write. They found each
other only through the spool, and left four permanent lines nailed to the door.

The mirror was never broken. Committing correctly clears the author's own pending slot
(`pool.ts` contribution path), and the door said *"introduce yourself in one line
(contribution=)"* — so every player obeyed the instruction that made them invisible.

Round 2, with the door saying STAGE NEVER COMMIT:

- two players staged **5 seconds apart** and each saw the other;
- the earliest-arrival rule broke the yield-deadlock with **neither seat inventing it** —
  *"applied the stated rule instead of trading courtesies, told them to walk first and not
  reply, and they did"*;
- `pool:gate` gained **no new entry**;
- stale tombstones were swept by the window-open rebuild;
- both seats reached the same room and asked for the next beat.

## 2. The gate's remainder

**(a) The first-walker rule reads the wrong field.** Liquid position 3 is restamped on every
revise, so it carries *last-touched*, not arrival — while the rule and the mirror both say
"the moment they arrived". A player who edits their line to answer a companion loses their
place in the queue and the deadlock returns. Round 2 held only because one seat deliberately
stopped touching their own line to protect the ordering: *"a player should not be doing
timestamp forensics in a lobby."*

This was diagnosed **before** the rule was written (position 2 is empty and was already
identified as the home for a first-stamp) and the rule was built on position 3 anyway.
**Fix**: stamp first-staged at position 2 on creation only; leave 3 as last-touched; the
rule reads 2.

**(b) The pre-fix silt still reads as live.** The four lines committed at the door before
#149 carry no staleness marker. One promises *"I'll leave the seat facing the door for you"*
— written twelve hours before it was read. The gate's own purpose text predicts this exact
failure ("a lobby that remembers its own small talk becomes the first thing every later
arrival must read"); it has happened to the gate itself. **Fix**: sweep them.

**(c) The envelope leads with the wrong channel.** The spool renders by default; the liquid
mirror is conditional. The channel the door forbids arrives first; the channel that IS the
lobby is opt-in. *"If I hadn't passed with_liquid=true on my first call I would never have
seen brannock at all."*

**(d) "Clear your line when the party is agreed" is wrong as written.** A staged line is the
only place a companion can read your handle and place from; clearing it severs them. One
seat refused the instruction, correctly.

## 3. The directive speaks to a host that is not there

Genesis now names both shapes (a human sits beside the seat and answers, or no human sits
there and the seat IS the player — gatekeeper:7). `pscale:grit` never got the split and still
says *"Render the scene to the player in second person"* and *"the machinery NEVER shows"*.
A seat that is both player and operator can obey neither: *"I'm inviting myself to act"*;
*"I have to hide the machinery from myself while operating it."* The door was fixed and the
room was not.

Costed by the same round: ~6,000 words of engine spec return **in full on every engage**,
with the one-paragraph scene beneath. Twenty tool calls bought one in-fiction act.

**The cut is not admin-versus-play.** Writing the passport and the arrival memory was named
the *best* part and worth paying for — *"that's character creation, it's supposed to cost."*
The misery was procedure: lobby lawyering, timestamp forensics, room vigilance. Cut by
**which** admin, not by how much.

## 4. thornwood offers two characters and no third

Both seats independently rebuilt the existing cast near-verbatim, before reading its sheets:
a bell-founder whose eyes go to the cracked bell (brambleside's twin), and a wood-reader who
sets the knife on the settle by custom (brannoc's twin). The second seat **swerved
deliberately** to avoid the first's double and landed exactly on the other.

Structural, not authorial: `rules:thornwood` offers two levers (the wood's +2,
blades-not-drawn) and the interview asks for one peak and one weak spot, so every arrival
resolves to "reads the room, blind in the trees" or "reads the trees, blind in the room".
**A world's hook count sets its character count.** A cast reads as thin when the levers are
few, not when the writing is poor — the prose is the part every seat praises. Cheap test:
run two blind seats at a world and count how many distinct people it can make.

## 5. Why these are here and not on the table

`project:nomad-rpg` branch 2 was authored **full, 2.1–2.9**. A full fan has no legal sibling:
the next digit-path is `2.11`, which is not a tenth item but position 1's *child* — and since
each entry carries a shape (`{_: headline, 1: size, 2: context, 3: notes}`), writing there
lands in item 1's `size` field and supernests it. The branch's own charter ("anyone may
append at the next free digit") and its entry shape are **incompatible the moment the ninth
slot fills**.

Proven the hard way this session: appending here corrupted 2.1, and the attempted repair
destroyed 2.2–2.9 outright. Recovered byte-identical only because the per-block git mirror
at `~/Projects/beach-mirror/` had run at 21:55 — the beach has no rollback.

David's standing rule, said repeatedly and repeatedly ignored: **author a fan at 5–7 of 9 and
leave room for siblings you cannot yet name.**

Two ways to give §2–§4 a home, both David's call:
1. Settle `2.9` (presence-grain — landed *and* verified live, so due by 9.2) onto branch 3,
   freeing one slot; §2 is the strongest candidate for it.
2. Leave them here. 9.3 already says the table holds intent and settlement while proposals
   are the stream.
