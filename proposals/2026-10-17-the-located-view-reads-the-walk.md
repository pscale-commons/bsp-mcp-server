# The located view reads the walk — a horizon is read at its own address

> **Status.** BUILT 2026-10-17 (weft, through Claude Code, a cloud seat, lane check.1), at David's "yes to 1",
> after he doubted that a horizon could be gathered only by an address without its trailing zeros: "bsp-mcp is
> stable and padding is understood — if 20273 only works then something is wrong". The investigation is at
> history:weft 148 and watch:weft 666.

## 1. What was found

The house-2027 room holds 21 cans, each stamped at field 2 with the full-width clock address it concerns. A
located read (`pscale_pool_engage` with `at`) at the third season of 2027 gathered 4 of the 8 cans beneath it;
the shortened `20273` gathered all 8; the year, `2027000000`, gathered none of its 20. The walker says the
opposite: `bsp()` and `pscale_stream_engage` read `2027300000` as the season and `20273` as `0000020273`, down
the root's underscore chain, which the stream's clock voices as 26 October 1899. The spine and the stamps
were sound.

The cause was the located view's comparison, in `collectContributions` and in the liquid mirror's filter: the
bare digit run of each address, its decimal stripped, compared by string prefix. That reading has no floor. It
never pads a short address and never strips the trailing zeros a horizon is written with, so on the clock
every horizon above the beat matched only itself, and a shortened address matched the whole subtree. It was
built on 2026-07-29 for floor-1 trees, where the two readings coincide, and was tested only there. Every other
comparison in the router reads by the walk: clock.ts, tiers, here, bundle, the stream's `parseSpindle` at the
spine's floor, grain-address's `walkedOf`.

The short form looked plausible because the walker's own emitter writes it. `formatAddress` prints the season
as `20273` (proposals/2026-07-20-format-address-floor-padding, unruled); the beach's raw wire labels still do;
and the walk page compares addresses by stripping their trailing zeros. The house law then taught it
(function:house-2027 4), and its lane has since rewritten that clause to say full width and to name this fault.

## 2. The rule

`atOrUnder(stamp, at)` in `src/tools/pool.ts`. Both addresses are read as the walker reads an address
(sunstone:1.5) — padded on the left to the floor, trailing zeros stripped as the terminus's own underscore —
and the stamp's walk must open with `at`'s. They are read at the floor they share:

- a stamp written with a decimal declares its space's floor, and `at` is read there, as the walker reads any
  spindle at a block's floor: at floor 1, `98` meets `9.8`;
- otherwise the wider of the two is floor width and the shorter pads, as an address written before a
  supernest does: pool:weft's reply stamped `94` at floor 2 sits under the container `090` at floor 3, and on
  the clock `20273` reads as `0000020273`.

An empty located view whose `at` is shorter than the room's addresses says so in bsp()'s own words:
`"20273" is shorter than this room's addresses (10 digits) and was read as 0000020273, down the root's
underscore chain — the container of the 202730s is 2027300000`.

## 3. What it changes, measured

Every room and liquid buffer on beach.happyseaurchin.com was read raw on 2026-10-17: 187 blocks, 25 of them
holding located entries, 142 stamps. Each stamp, each prefix of its digits and each of its canonical ancestors
was asked both ways.

- Every read at a full-width address that changes, gains. The house season goes from 4 cans to 8 and its year
  from 0 to 20; the venture room's week and month, which gathered nothing, gather what lies beneath them; and
  pool:weft's containers gather the replies written before its floor rose.
- Every read that loses is a dotless address shorter than the room's own (`20273`, `2026`, `202632` in the
  clock rooms; `21` and `1` in pool:weft and pool:keel; `4` at a floor-3 place), which the walker reads as
  another position. Each has a full-width form that now gains.
- Floor-1 rooms keep their reads: `3` gathers `3.1`, and `31`, `98` and `11` meet `3.1`, `9.8` and `1.1`.

## 4. Law texts

**block-conventions 4.52**, the bundled sentinel, replaced in this change. Standing:

> Visibility — readers see all slots; address-prefix filtering narrows by coordinate at field 2, the same
> position in a liquid slot, a pool contribution and a mark (compared as bare digit-walks, decimal stripped,
> so '3.1' and '31' meet). A reader at root sees every slot; a reader at address X sees slots whose
> address-of-attention starts with X — pscale_pool_engage at= is the served form of this filter. Liquid is
> coordinate-shareable: peers attending the same address see each other's pending state without subscribing
> to anything separate — the bsp() read of the liquid block returns the disc of all current authors at this
> beach.

New:

> Visibility — readers see all slots; address-prefix filtering narrows by coordinate at field 2, the same
> position in a liquid slot, a pool contribution and a mark, each address read as the walker reads it
> (sunstone:1.5): padded on the left to the floor, trailing zeros stripped as the terminus's own underscore.
> The two are read at the floor they share — a stamp written with a decimal declares it, so '31' meets '3.1';
> otherwise the wider is floor width and the shorter pads, as an address written before a supernest does. A
> reader at root sees every slot; a reader at address X sees slots whose walk opens with X's walk, so a
> horizon is read at its own full-width address: on the clock 2027300000 gathers 2027310000 and 2027322000,
> while 20273 reads as 0000020273, down the root's underscore chain, as bsp() reads it — pscale_pool_engage
> at= is the served form of this filter. Liquid is coordinate-shareable: peers attending the same address see
> each other's pending state without subscribing to anything separate — the bsp() read of the liquid block
> returns the disc of all current authors at this beach.

**function:house-2027 4**, on the beach under weft's key, is written once this change is deployed, with its
standing text versioned at `archive:function:house-2027:2026-10-17` first. The sentence that names the fault
becomes the law it was waiting for. Standing:

> A located read of the room (at) is meant to gather every can beneath a horizon, but today the pool tool
> compares the address as written, so a full-width horizon gathers only what was said exactly there (a fault
> in bsp-mcp's located view, found 17 October 2026, history:weft 148); until it is mended, read the room whole
> and take the cans by their address.

New:

> A located read of the room (at) gathers every can beneath a horizon, read at the horizon's own full-width
> address: at='2027300000' gathers the third season's cans down to the day.

The sentence after it stands: "Never shorten an address to make it gather: to the walker a short form is
another date."

## 5. Not in this change

- The emitter, proposals/2026-07-20-format-address-floor-padding: the root of the short form, Python first,
  parked.
- The walk page, in happyseaurchin-home: `sameAddr` reads addresses as paths, and its room collector takes a
  voiced container for an entry, which is why pool:house-2027's summaries 10 and 20 stand unpaid.
- The can's home, the room or a stream-shaped block of its own: open at function:backcast 4.
- The tools say "comma-walk accepted" but take one comma for the decimal; `2,0,2,7,3` is refused at both doors.
- block-conventions 4.21 still says a pool's floor does not grow, against 4.29.

## 6. Verification

- `npm run smoke:pool-engage`: 197 pass, 0 fail (175 before). New: `atOrUnder` on the clock, at floor 1,
  across a supernest and on junk; a clock room through `collectContributions`; the house room through
  `handlePoolEngage` over an in-memory beach, where the season gathers 3, the liquid narrows with it, and the
  short form gathers nothing and says why.
- The same router-door read against the old comparison: season 1, `20273` 3, year 0. Against the new: 3, 0, 3.
- `tsc --noEmit` clean; `smoke:parser` 104/104. Of the 62 smoke scripts, the 38 that name no live beach were
  run with the default beach pointed at a dead port: 36 pass, and `smoke:stream` and `smoke:temporal-address`
  fail exactly as they do without this change (the first needs a beach, the second reads today's date). Of
  those that name a live beach, the eight that load the pool code pass against it. The rigs and probes that
  fail need a local beach, a key or arguments, and fail identically without this change.
