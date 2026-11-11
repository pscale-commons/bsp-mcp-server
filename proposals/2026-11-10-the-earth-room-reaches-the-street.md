# The earth room reaches the street: a proposal carries its kind, its rung and its OpenStreetMap entry, and the keeper may mint a neighbourhood or a street (2026-11-10)

**Status**: ADOPTED at David's word ("Yes, fix both", 10 November 2026, lane map.1). Two positions of a law-class block changed on earth.beach.happyseaurchin.com:

- `function:earth` 7.1 (READ) now says what a line in the room carries.
- `function:earth` 7.2 (MINT) now lets the pass mint a neighbourhood or a street from the room, never a house or a room.

The standing text before the change is `archive:function:earth:2026-11-10b`, copied whole and byte-identical, latched under weft's key. The page side is happyseaurchin-home #656: /globe suggests the rung, keeps the camera on what it found, and comes back to the planet after a proposal.

This follows `proposals/2026-11-10-the-earth-room-grows-the-map.md` (#629) and replaces its §5 rule "never finer than a town".

## 0. David's words

On his phone, a few hours after the room opened:

> I entered a location, quarry lane -- but it doesn't go down to the location level that the phone presents. The globe disappears after I add the location. I had to delete all the digits and return to the base url /globe and when i click on quarry lane it settles at sheffield level. Although we are waiting for weft to make it official, shouldn't it be able to suggest an appropriate pscale depth rather than stopping at 'sheffield'? Will weft be able to find it more specifically later if all it has is 'quarry lane' in sheffield?

Then: *"Yes, fix both."*

## 1. What the room held

His line in `pool:earth`:

`Quarry Lane — a place the map lacks, proposed from the globe at 53.36,-1.5 @12; it falls in Sheffield Central (spatial:earth:31131100000).`

It held a name, a point rounded to about a kilometre, and the ground it fell in. It did not say what kind of place this is.

- **This time the keeper could find it.** OpenStreetMap has one Quarry Lane in Sheffield: way 23590048, a residential street in Carterknowle, about 100 m from the phone's point.
- **In general it could not.** A "High Street" proposed with a point to the nearest kilometre names nothing.
- **The law would have refused it anyway.** 7.2 minted "world rungs only (continent, country, region, town)", so the pass would have answered that a street is finer than the map adds.

## 2. What changed in the law

### 7.1 — a line carries what the world knows

When the globe's search found the place, the line now carries its kind, the pscale its population sets and its OpenStreetMap entry, with the place's own point and box:

`Quarry Lane — a street the map lacks (pscale 2, OpenStreetMap way 23590048), proposed from the globe at 53.3598,-1.504 · 53.3587,53.3607,-1.5055,-1.5033; it falls in Sheffield Central (spatial:earth:31131100000).`

- **Position 2 is unchanged.** It stays the ground's address with zeros below it, because the digits beneath are the keeper's to choose.
- **A line from a device the world could not name** still carries the position rounded to about a kilometre, with no kind. The keeper sets its rung.

### 7.2 — the street is the finest rung a proposal reaches

The pass may now mint a neighbourhood or a street from a room line, once the world's own record confirms it. That record is the OpenStreetMap entry the line names, or the one its name finds inside the ground it falls in.

- **Never a house or a room.** Not from the room, and not from world knowledge. Those stay a person's own to name, in their own mirror's words or not at all (rules:earth 2).
- **This needs no change to rules:earth.** Rule 2 already lets world knowledge ground "the road".
- **The map already had one street.** Machon Bank (`31131111100`) stands at pscale 2 under Nether Edge, from David's own words.

## 3. The rung the globe suggests

The globe suggests a rung, and the keeper decides it.

**Population first.** The rung is the pscale its population sets, which is the law's own phrase: round(log10(population)), when OpenStreetMap gives a population. For example:

- Leeds, 766,399 → 6.
- Sheffield → 6.

**Kind next.** When there is no population, the kind sets the rung, following the ladder's legend:

| kind | pscale |
|---|---|
| street, park or block, hamlet | 2 |
| village, neighbourhood | 3 |
| suburb, quarter, town | 4 |
| borough, district | 5 |
| city | 6 |
| county, state, region | 7 |
| country | 8 |

**Where it would stand.** The card names the ground that holds the place. That is the finest ground the map has that is coarser than the place itself. The card shows the address it would have. Quarry Lane would stand three rungs below Sheffield Central, at `3,1,1,3,1,1,0,0,?`:

- the zeros are the rungs between, still undecided (pscale's own mark);
- `?` is its own digit, the keeper's to choose.

The address pill and the ladder show the same while the place is in view.

## 4. Privacy

- **A street is the finest thing written.** A house, a shop or a building is narrowed to its street. A postcode is turned away with "type its street". A house or a room is never proposed.
- **"My location" stays on the device.** To name the place you are at, the name goes to OpenStreetMap's search with a box of some 30 km around a point rounded to a tenth of a degree. The nearest answer is chosen on the device.
- **The world's own point is what gets written.** The line carries the street's point and box as OpenStreetMap publishes them, never the device's position. If the world does not know the name, the line carries the device's position rounded to about a kilometre, as before.

## 5. Who answers, and when

The first record said "the keeper's evening pass". That was loose:

- **The earth keeper runs weekly.** It is a cloud routine on Mondays at 06:29 UTC (`wake:weft` 9). It reads the law and files writes to the map as owed, because the map answers to the beach's main lock.
- **The Mac mints them.** The Mac's evening wake mints what was filed as owed (`wake:weft` 6.7).
- **Both now name the room.** Their positions (`wake:weft` 9.1, 6.7) now name the room and the answer beneath each line.

Leeds and Quarry Lane are answered from Monday 16 November.

## 6. What is open

- **Rectangles.** geo:earth's boxes are rectangles, so a place near a ground's edge can be suggested inside the wrong ground: Hathersage falls inside Sheffield's box. The keeper's check against the world decides.
- **The rungs between.** The keeper may mint the ward and the neighbourhood between a ground and a street (Ecclesall, Carterknowle) or leave them as zeros. GROUND DECIDES (7.7) carries either.

🤖 Generated with [Claude Code](https://claude.com/claude-code)
