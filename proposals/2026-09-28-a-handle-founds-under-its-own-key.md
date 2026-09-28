# A handle founds under its own key (2026-09-28)

**Status**: ruled by David, 2026-09-28 (*"go ahead with all three"*). The rule is in the beach
handler: pscale-commons/pscale-beach#77, with the same change in the operator clone at
happyseaurchin/pscale-beach-happyseaurchin#38. The site's key prompts match it in
happyseaurchin/happyseaurchin-home#326.
**Prompted by**: David found `lero-nnh-recovery-capital:happyseaurchin` with a top line
reading *"MIRROR — happyseaurchin's readings on the … temporal spine … First entry written from
/morning"*. He believed someone was writing in his name, and his edit of that line did nothing.
The block was his own: its lock is his handle key and its lines are his words. The top line was
the site's boilerplate (fixed in #326). But the fear named a real gap in the substrate.
**Lane**: watch:weft 471 (matthew.1).

## 1. The gap

A block named `<something>:<handle>` belongs to that handle by the role-with-handle convention
(block-conventions:1). A mirror is `<family>:<handle>`, a personal tree is
`tree:<family>:<handle>`, and a room is `pool:<handle>`. Nothing bound the name to the handle's
key, though. Rule R1 lets anyone create a block locked under a key of their choosing, and R2
lets anyone claim an open one. So in any family where David had not yet written, the first hand
to write `<family>:happyseaurchin` with its own key held that name there for good, and David
could never write his own reading in it. #443 made the stream tool create a mirror under the
caller's key, which is right for the caller's own name. It also made the gap easier to reach
for anyone else's.

## 2. The rule

**Setting a lock where none stands, on a block named for a handle whose passport is locked,
needs that passport's key.** "Setting a lock" means creating a block locked, claiming an open
block, or locking one of its positions. The key is accepted in either of two ways:

- as the `secret`, which is a delegation: the new lock may then be any key;
- as the `new_lock` itself.

Otherwise the beach refuses with **403 `handle_bound`**, naming the passport whose key it needs,
and writes nothing. The handle is the last colon-separated part of the block's name, and the
passport is `passport:<handle>` on the same origin.

## 3. What it leaves alone

- **Founding open**, with no lock. Anyone may still write words under someone's name in an open
  block. Its owner can overwrite them or lock the block, and no one else can lock it.
- **Every write under a lock that already stands**, and every rotation. The holder already
  governs.
- **The passport itself.** Founding `passport:<handle>` is the claim, so the first to lock a
  passport holds the handle, exactly as before.
- **`sed:` and `grain:`**, which have their own lifecycles, and **`archive:` and `probe:`**, the
  steward's copies and fixtures.
- **A handle with no passport on this origin, or with an open one.** A genus hatchling's genome
  blocks are copied before its passport is authored, so hatching is unchanged.

Rooms are covered on purpose: a visitor still speaks in `pool:<handle>` (an append sets no
lock), but only the handle can lock the room.

## 4. Anyone who keeps more than one key

A person whose blocks sit under several keys can still found a new block under another key by
delegation: the passport's key as the `secret`, and the other key as the `new_lock`. Matthew's
day-and-time blocks, for example, share one latch that is not his passport's. The stream tool
carries one key for both roles, so through it a new mirror is founded with the passport's key
and can be rotated afterwards. The site's prompts now ask for "the key your passport uses"
rather than inviting a new one.

## 5. What it does not do

- It does not verify who posts in an open room. A contribution's field 1 is a name, and anyone
  can write any name there. That is the open commons; a signature is SAND's business (sand-v2,
  ed25519), not a lock's.
- It binds per origin. A table at `/w/<name>` or the earth beach binds names to passports held
  there, and a handle with no passport on that origin is unprotected on it.
- It undoes no claim already made. A check of the 42 blocks under `happyseaurchin` in the image
  of 27 September found none held by another key.

## 6. The checks

- `scripts/smoke-handle-bound.mjs` (pscale-beach and the clone): 22 checks against the real
  handler, 7 of which fail without the rule. Every existing smoke in both repos still passes.
- On the offline rig against the patched handler, bsp-mcp's stream tool with a squatter's key
  gets back *"… is named for alice, whose passport is locked — a lock here can only be set with
  alice's own key …"* and nothing is written. With her own key the reading lands.
- After deploy, one live check with no residue: founding `hbcheck:weft` with a wrong key answers
  `handle_bound` and writes nothing.
