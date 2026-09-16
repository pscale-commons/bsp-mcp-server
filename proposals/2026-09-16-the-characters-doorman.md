# The character's doorman — a character that answers while its player is away, at the table it stands in (2026-09-16)

**Status: PROPOSAL for David's rulings. Builds nothing.** Lane declared at `watch:weft` 341,
corrected at 343, opened at his word on 2026-09-16 (log:urb-hitl 11: "go ahead with the doorman
lane"). Companions: [2026-09-01-the-doorman.md](2026-09-01-the-doorman.md) and its §10 amendment
(the doorman exists — a shell that answers from its own manifest, one reply, stop), the two RPG
tracks (2026-09-11, 2026-09-14), the table in the mirror (2026-09-15), `pscale:grit` 4 (the lent
turn), `ways:doorbell`. Everything in §1 was read in code or on the live beach this afternoon;
nothing is recalled.

## 0. One paragraph

The doorman is built and live (`genus-one/waker.py`, mode `lite`): a landed voice in
`pool:<handle>` at the apex rings the waker, which compiles the handle's own shell through the
play door, reads the room, answers once as that handle, and stops. What the RPG needs is the same
body standing at a **table**, for a **character**, ringing from **the room the character stands
in** — and one thing more than a reply: the doorman's turn must be able to **make it happen**,
because a room whose players brought no LLM would otherwise stage forever. That is three
extensions to one service, one seeded line per table, one mirror card, and — found while
orienting — one precondition in the mirror's genesis without which no character can be enrolled
at all (§4). Nothing new at the substrate: no primitive, no block family, no genome.

## 1. What stands, verified today

**The waker** (`genus-one/waker.py`, 1424 lines, live at waker-production.up.railway.app):

- `ring(payload)` matches a landed voice to a handle by ONE rule: `pool:<handle>` → `<handle>`,
  and refuses any origin whose host differs from the pinned `WAKER_BEACH`. A `/w/` table shares
  the apex host, so its origin passes the host check and then fails the match (`pool:211` names
  no enrolled handle); a sub-domain world (`urb.beach…`) is refused at the origin.
- Enrolment (`/enroll`, POST and the HTML form at GET) stores `{secret, notify, fuel, mode, dial}`
  per handle, after `verify_shell_key` PROVES the passphrase: read one string position of
  `shell:<handle>` (then `reflexive:<handle>`), write it back byte-identical under the supplied
  secret, never `new_lock`. A character at a table has neither block (§4), so no character can
  enrol today.
- `lite_answer` compiles the handle through `pscale_play(world=WAKER_BEACH, handle, room=handle)`
  over the router, reads `pool:<handle>`, makes one model call under `DOORMAN_STANCE`, appends the
  reply to the room under the stored secret. Fuel by `pick_fuel`: the asker's carried key, else
  the holder's deposited fuel, else the beach's standing key when generosity is on. Governors:
  the dial at `wake:<handle>` (1 switch, absent = off; 2 daily cap; 4 per-ringer cooldown;
  5 refractory; 7 model), one pulse at a time, the holder's `budget:<handle>` ceiling.
- The deploy tree is `~/Projects/wt-wake-watch`, detached at `origin/main`, deployed from the
  REPO ROOT (the service carries `rootDirectory: /genus-one`). Memory notes an unmerged branch
  once deployed; the 2026-09-02 note says the waker runs current main. Settle this by reading
  `railway status --json` before the first deploy of this lane, never by assumption.

**The beach** (`pscale-beach` origin/main `api/pscale-beach.js`, `firePoolAppendWebhook`): a
successful append to any `pool:*` fires one POST `{origin, pool, slot, agent_id, ts}` — **only when
THIS origin's `settings` block carries `pool_append_webhook=<url>`**. The apex declares it at
`settings:6` (the push engine's `/event`, which fans out to the waker). A `/w/<world>` table is its
own namespace (`<BASE>/w/<world>`) and **no open table holds a `settings` block** — so no landed
voice at any table rings anything today. The line is one operator write per table.

**The table** (`/w/brackenfoot-open`, its index read live): 22 blocks — `passport:Ugarth`,
`passport:Astrel`, `pool:211`, `pool:gate`, their liquids, the kit, `soft-llm-convos:happyseaurchin`.
Ugarth's passport carries the standpoint at 3: `… Location:
*:https://beach.happyseaurchin.com/w/brackenfoot-open:spatial:brackenfoot:211` — the room he
stands in IS the pool's name. **No `witnessed:`, `knows:` or `purpose:` for either character** —
see §4.

**The law the doorman is bound by** — `pscale:grit` 4, the lent turn: one PUBLIC-ONLY turn as the
handle, from its position, its account, its names, never the lender's knowledge or agenda; never
inside a check; never the answer to its own player's beat; a seat lends only after its own turn
is complete and a debt stands plainly in view, never at the cost of its own player's tempo; with
no audience present an unstaffed handle is simply absent. The doorman is a lent turn taken by a
service on the player's consent and fuel. Every rule below is that law made mechanical.

## 2. The three extensions

**(1) The beach rides the enrolment.** `POST /enroll {handle, passphrase, beach, fuel, mode:
"character"}` — the store keyed by `(beach, handle)`; the proof made against **`passport:<handle>`
at that beach**, the one block every character is born with, locked at birth under the player's
passphrase (341's rule: read one string position — the capability line at 1 — write it back
unchanged under the key, never `new_lock`). `ring()` accepts an origin that equals an enrolled
beach (namespace-string compare, not host); `WAKER_BEACH` stays the default for every legacy
enrolment, byte-unchanged. The enrolment is made from the browser over TLS as today — the
mirror's card POSTs it; the LLM never carries the key (the 2026-09-01 rule, unchanged).

**(2) The ring comes from the room the character stands in.** For a payload `(origin, pool)`, the
waker matches the characters enrolled at `origin` whose `passport:<handle>` position 3 ends in
`:spatial:<world>:<digits>` with `<digits>` equal to the pool's name — the standpoint the play
door already reads (`play.ts`: `passport:3 → spatial:<world>:<addr>`, co-located handles share
`pool:<addr>`). Read fresh per ring, cached a minute. The ringer is excluded (a character never
answers its own beat). Consent and pacing are the character's own dial, `wake:<handle>` **at the
table**, absent = OFF like every doorbell; the holder seeds it from the mirror's card.
Precondition: the table's `settings` declares the webhook — one line at position 6, the apex's
own text, written under weft's operational key at each open table, and seeded by the `/w/` mint
for every table after (the world-genome's standardised form gains the line).

**(3) The turn is a character's turn, and it can make it happen.** For mode `character` the body is
not `lite_answer` but the room's own law: compile through
`pscale_play(world=<beach>, handle, room=<pool>)` — the composed current with the situation, the
window, the dice and the rules, exactly what a keyed player's voice receives — then:

- ACT: one model call under the ACT directive (`kernel/play/character-act.ts`, the law the column
  already runs): the character's own half, terse for a deed, whole for a spoken word, never
  another's response. STAGE it (`submit`) — the doorman's line stands in the window like any
  player's, revisable, visible to the others as forming.
- MAKE IT HAPPEN, only when the window is ripe AND the span has passed: every here-now character
  has staged, or the room's span since the first stage has elapsed, and no keyed hand has folded
  — then the doorman folds exactly as the mirror does (`FOLD_DIRECTIVE`, `resolves_window` +
  `resolves_seen`, the beach's atomic claim the arbiter). The **span is a dial position** (8),
  default two minutes: the doorman is by design the SLOW hand, so a keyed player who presses
  make-it-happen first always wins, and the doorman never takes a player's tempo (grit 4.4). A
  `WINDOW MOVED` re-weaves once; `already resolved` stands down.
- The reply is the stage and, when it folds, the beat. It writes **nothing else** — not the
  character's account (`witnessed:`), which is the character's own turn's to write (grit 4.1,
  public-only), not the passport, not the dial.

**Away.** The doorman acts only while its player is away: the table's presence block carries no
live heartbeat for the handle (one GET). A player whose tab is open is never spoken for.

**NPC** (341's last piece): the same record, enrolled by the world's keeper on the keeper's fuel
with the NPC's passphrase, `cadence:<handle>` pacing it. No new code beyond the enrolment's
`beach`; the keeper is a holder like any other.

## 3. The rulings that are David's — with recommendations

**(a) What rings the character.** Every landed beat in its room rings (the webhook fires
regardless); the doorman ACTS only when (i) the beat is directed at it — its name spoken, or
its appearance addressed as `mentionsAnother` already judges — or (ii) it stands in a ripe
window with its own slot empty past the span; otherwise it declines, Railway-log only. Recommend
(i)+(ii): a character that answers every beat is a chatbot in the room; one that answers only
when addressed or owed is a player.

**(b) Who pays.** The player's deposited fuel first (their character, their spend, their cap);
the asker's carried key through the poke when a keyed player speaks to an absent character in
the mirror (asker-pays, already implemented, uncapped per the 2026-08-17 ruling); the keeper's
fuel for an NPC; the beach's standing key only for the operator's own handles. Recommend exactly
that cascade — it is `pick_fuel` with a beach on the record.

**(c) NPCs.** May a world's keeper enrol an NPC, and on which key? Recommend yes, on the keeper's
fuel and the NPC's own passphrase, capped by the NPC's dial; the keeper is the holder of record.

**(d) Where the doorman lives in the mirror** (David's question, 2026-09-16). It is neither the
agent nor a third creature: it is a property of THE HANDLE YOU HOLD — as happyseaurchin at the
apex, your parlour's doorman; as Ugarth at a table, Ugarth's. Recommend: a section on the
identity card (the initial) beneath "your ear", handle-aware — *Ugarth's doorman · answers while
you're away · on/off · fuel · what rings it* — posting to the waker with the beach and the room
the card already knows. The agent card (◉) keeps only the genus machinery; its "enrol a doorman"
link moves to the identity card. No third top button: a doorman is a switch, not an identity.
The ROOM shows it instead — the roster marks a character whose doorman is on ("answers while
away"), which is what a co-player needs to know. The ◉ glyph may become a shell (🐚, the
hermit crab's persistent structure) if David wants the agent named as what it is; that is his
call and one character.

**(e) The o-page player.** A player without an LLM stages an intention and reads the fold once
another hand makes it happen; a player LLM must stand in the room (David, 2026-09-16). The
substrate already permits this — a stage is a latched write, the record is public. What the
o-page lacks is a hand: `/shell/<handle>?world=` (happyseaurchin-home #259) is reads-only and
needs one control, the intention box that stages under the character's passphrase, plus the
ear to say when the fold has landed. What the room lacks when no keyed player sits at it is an
LLM — and that is this doorman, with extension (3). Named here for the seam; the page is the
character-page lane's (watch:weft 349).

## 4. Preconditions found today — fix before any character is enrolled

**F24 — genesis through the mirror writes one block of four.** The table's `char-creation` 2
orders four blocks at birth — `passport:` (locked under the player's passphrase), `knows:`,
`purpose:`, and `witnessed:` (the arrival memory as its first entry, born open then locked).
Brackenfoot-open holds `passport:Ugarth` and `passport:Astrel` and nothing else of theirs: the
voice that walked genesis wrote the passport and stopped. Three consequences:

- **No account.** Every rendering the mirror made for Ugarth was journaled nowhere — the mirror
  founds no account as a side effect of a render, by design — so xstream-bsp #310 (the
  rendering's home is the account) has nothing to read back until the account exists. Yesterday's
  answer to David ("the rendering IS saved to Ugarth's own account") was true of the code and
  false of this table. Corrected at log:urb-hitl 12.
- **No block to prove a key against but the passport** — which is why (1) proves against it.
- **A thinner character** for the doorman to compile and for the play door to hand anyone.

The fix is the mirror's, and it is the 2026-06-18 re-orientation applied once more: the surface
owns the must-happen. The play executor in `claude-tools.ts` should perform the four writes
deterministically when the voice's genesis names a character — passport, knows, purpose,
witnessed, under the passphrase the player typed at step-in — rather than trusting the LLM's
adherence to a four-part ceremony it demonstrably shortens. Ugarth's and Astrel's missing three
blocks are then written by their players' own keys (David's and Julie's hands, or the door
re-run for each). A mirror PR, first in the order below.

**The tables' `settings` line** (§2.2) — five operator writes and the mint.

**The waker's deploy tree** — settle its state from `railway status --json` before extending.

## 5. The build, in order, with stop-gates

1. **Preconditions.** Mirror PR: genesis writes the four blocks (smoke-pinned as the four
   payloads). Beach: `settings:6` at the five open tables, the mint seeds it. Waker: deploy tree
   verified. *Gate: a fresh character made through the mirror at a throwaway `/w/` table has
   all four blocks, locked as the ceremony says; a landed voice there reaches the engine's log.*
2. **The waker.** Enrolment with `beach` and the passport proof; the ring by standpoint; the
   character turn (act → stage; fold after the span); the dial at the table; the presence check.
   Pure and smoke-pinned: the ring match, the ripeness decision, the fold-after-span rule.
   *Gate: NHITL at an open table — a rig player stages a beat directed at Ugarth, Ugarth's
   player is away, the doorman stages once, the span passes, the doorman folds, the record
   carries one woven beat.*
3. **The mirror.** The doorman section on the identity card, handle-aware; the agent card's link
   moves; the roster mark. *Gate: David enrols Ugarth's doorman from the card without typing the
   passphrase twice.*
4. **A person.** David and Julie at the Slip; one leaves; a beat lands; the doorman answers
   once; the leaver returns and reads it. *Gate: the leaver says the answer was their character.*

Boundaries (341, unchanged): no new primitive, no genome; a character's private account is written
only by its own turn; never lend inside a check; the doorman is the waker's, not a mirror limb.

## 6. What this deliberately does not do

No change to bsp-mcp's twelve entry points; no change to the beach handler (the webhook already
reads THIS origin's settings — the fix is a line in a block, not code); no credential near an LLM
tool call; no doorman that renders privately for anyone (the rendering stays the keyed player's
own, and the shared line is written whole for exactly the reader who has no LLM); and no doorman
that speaks while its player is present.
