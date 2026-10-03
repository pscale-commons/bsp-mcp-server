# The held search — a helper may look things up, but only where its own sources point (2026-10-03)

**Status:** built at David's word (*"go ahead, draft the list, create the actual block so it is operational, and
open the PR"*), lane helper.1, through Claude Code; the record is at watch:weft 518 and the entry after it. The
sources block it reads, `sources:lero-helper`, stands at the apex, and the line that turns the search on stands
beneath 9 of `wake:lero-helper`. Until this is merged and the waker redeploys, the running door reads that line as
nothing and answers as it does today.

## 0. David's words

The trial at https://happyseaurchin.com/ask/lero-helper, 2026-10-03: asked whether there is a LERO in Sheffield,
the helper said it had no way to look one up. *"Either we empower it. Or we scrape info from the world and add it
to the beach. And perhaps daily we run a fetch to update the beach. But with current model there's no saving of
queries so we don't know what is missing. What do you think is the simplest way to make this thing useful?"*

Weft's answer (watch:weft 518): empower it, but only on sites a block names. The block says where to look; the
search looks there. No daily scrape: it copies the world onto the beach, goes stale between runs, and nobody
vets it.

## 1. The shape

| piece | where | whose |
|---|---|---|
| **The sources** | `sources:<handle>` — where to look, by what the person needs: a LERO near them, treatment, meetings, family, a group by name. Every web address in it is a site the search may reach. | the curator's (Matthew's, once handed over); the helper reads it as knowledge through its manifest, so it points people well with the search off |
| **The switch** | beneath 9 of the dial, beside the mind and in its idiom: `search <block> [uses]` — `search sources:lero-helper 2` | the holder's, like the mind and the cap: the cost of an answer is theirs |
| **The door** | `genus-one/waker.py` `held_search`: read the dial's block fresh at every ask, take the host of every link in it as the search's `allowed_domains`, at most `uses` searches (5 at most); the stance names the one tool it holds | code, and nothing more than that |

`search off`, or no line, holds none. A block that cannot be read, or links nothing, holds none. The beach's own
hosts are never searched: the beach is read.

**The helper's own law moved with it.** `function:lero-helper` 1.2 said to name no local people or places, which
a helper that looks up help near a person cannot keep. It now says to name a local service, group or place only as
the sources or the LEROs listed by place give it, or as a search of the sources' sites finds it, always with where
it came from and never from memory; a new 1.5 says where to start when someone asks where help is near them. The
standing text was archived first, at `archive:function:lero-helper:2026-10-03`.

## 2. What it does not change

- **Nothing is kept.** The door still writes nothing and logs nothing a person said. The search words the model
  writes (*a place and a kind of help*) go to the search the API runs, as every word goes to the model; the stance
  tells it never to put anything about the person into a search.
- **A refused search never costs an answer.** If the API refuses the search (a site it will not take, search not
  open to the paying account), the door asks once more without it, and the reason goes to the service log.
- **The page's promise.** The private page tells the person that, to answer, the helper may search a few public
  sites it trusts; its own conversation still stays in its tab.

## 3. Cost

The API charges a cent a search, and the pages it reads are counted as input. A searched answer costs a few cents
more than a plain one; the dial's daily cap bounds the worst case. The service log names each answer's searches
beside its tokens (`· 2 searched`).

## 4. Why not the other two

- **A daily scrape** writes the world onto the beach once a day: a system to run and pay for, stale between runs,
  and vetted by nobody. The held search reads the same sites only when someone asks.
- **An open search** reaches every site, among them the paid rehab-referral sites that crowd searches about
  addiction. Holding it to the curator's list keeps those out and leaves the list in a person's hands.

What is missing is learned without keeping words: the curator's own list of the questions people bring is the
helper's test, and a consented topic note through the existing SIGNAL line can follow when a steward accepts a
grain.
