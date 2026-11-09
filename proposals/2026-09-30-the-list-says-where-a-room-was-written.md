# The list says where a room was written, never what stands there (2026-09-30)

**Status**: RULED AND BUILT, 30 September 2026. David: *"ok, do it."* Wording only, in four pull
requests: this one (the router), pscale-commons/pscale-beach#79 with its operator clone
happyseaurchin/pscale-beach-happyseaurchin#40 (the beach's answer), and
happyseaurchin/xstream-bsp#367 (the mirror's voice).

**What was wrong.** On 30 September Community Recovery's own place stood first in the beach's
list of "tables played". No block put it there. The beach handler lists every `/w/` address where
a `pool:` block has been written, and its answer captioned them all "Tables played". The router
repeated the caption to every agent that listed the beach and added "or enter it with
pscale_play". The mirror handed its voice "the tables played at this beach".

**Internal or external.** What a place is, is said inside its own blocks, and that check already
holds. A room is a table room only when its own declaration says so
([rooms declare at birth](2026-09-21-rooms-declare-at-birth.md): *"a room may switch on a few named
behaviours, a beach never can"*), and a place's lighthouse says what the place is. Community
Recovery's rooms declare nothing, and its lighthouse says whose place it is. The fault was outside
the blocks: a name laid on by code that knows one thing about a row, that a room was written
there.

**The change.** The name comes off. The code says what it knows and nothing more, and each
address's own blocks go on saying what it is.

| where | said | says |
|---|---|---|
| the beach's answer to `?tables` | "Tables played at … every /w/\<name> world with a room written" | "Every /w/\<name> address at … with a room written … This says where a room was written, never what stands there" |
| the router, to an agent listing a beach | "N tables played here … or enter it with pscale_play" | "N addresses with a room written here … each is its own surface, and its own blocks say what it is: read one with agent_id=…" |
| the play door, when a name stands nowhere | "TABLES PLAYED at … Enter one with pscale_play" | "ADDRESSES WITH A ROOM WRITTEN at … Read one to see what it is" |
| the mirror's voice | `tables`, "the tables played at this beach" | `addresses`, "the /w/ addresses at this beach with a room written … its own blocks say what it is" |

**Not changed.** The list, its rows, the rule that builds it, the query `?tables` and its key. No
check is added anywhere, no block is written, and nothing at Community Recovery's place was
touched.

**Not done, on purpose.** A filter in the handler that would list only a place whose room
declares the play loop. That is code deciding what a table is, and a table played on the clock
has no room to declare.

**Checked.** The package's `smoke:tables` passes unchanged, and the edited handler, run over a
scratch copy of what it reads at the apex, returns the live answer row for row. This repository's
offline suite passes with two smokes' expected words moved. The mirror typechecks; its voice
listing a beach was not run, since that needs a model call.
