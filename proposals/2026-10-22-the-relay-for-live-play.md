# The relay for live play

> **Status.** SCOPE, not built — lane tron.1 (weft, Claude Code, David present), 2026-10-22. Every number
> below was measured that morning from David's Mac in the UK unless it names a source. Decisions at §9 wait
> for David.

**In short.** The relay we already have is fast: 22 ms one way between two players in the UK, within a few
milliseconds of what their connections allow. What it cannot do is carry play at a price — it bills every
receiver of every message and caps a project at 500 messages a second, so a single room of sixteen would
already exceed it. The arcade's exchange should therefore be the **introduction, not the pipe**: players
meet in a beach room, trade their addresses over the vapour channel the mirror already has, and play
directly over unordered data channels; TURN carries the pairs that cannot connect, and an edge room
referees a cup. Armagetron Advanced shows why that is enough: its speed comes from timestamped events, not
from rate — a turn is about 36 bytes, an enemy is resynced once a second, and the game was built to play at
round trips several times what we measured. The first piece to build is small: the voice's own
introduction, carrying data instead of audio, and a page where two people see their ping both ways.

## 1. What David asked

"Explore how to set up live relay for players in games … what's the round trip time on [the mirror's relay
through Supabase]? … Our primary goal is to scope creating the fastest relay to include in our game-arcade
kit/setup so that people who have multi-player games can do so effortlessly and with small ping; so we
become an exchange of sorts — either central or enabling p2p network." Armagetron Advanced is the
yardstick (fast play; a shared mechanics core that players skin for themselves), and how it might hook into
the beach is secondary.

It answers the arcade's open question: the fold at `game-arcade` 1 asks for "a cost sheet for running a
game on the beach, and a small working piece David can try", and the proposal's growth step says "live
head-to-head play needs game servers".

## 2. What stands today, measured

| path | what rides it | measured | where it runs |
|---|---|---|---|
| **vapour** — Supabase Realtime broadcast (`xstream-bsp src/lib/realtime.ts`) | typing, the voice's signalling | one way **22.5 ms** p50 (p90 25, p99 42); ping back and forth **47 ms** p50 (p90 52, p99 70); acked send 23 ms; 20, 30 and 60 msg/s for 5 s each delivered 100%, p50 22 ms; joining a channel 150 ms warm, 560 ms cold | project `xstream` (Pro plan, region eu-central-1), reached through Cloudflare's Manchester edge |
| **the beach's HTTP** — liquid, presence, record | staged lines, who is here, the kept record | one GET **285–745 ms** (p50 ≈ 430); the mirror polls it every 1.5 s | Vercel function in **iad1, Washington** (`x-vercel-id: lhr1::iad1`); Upstash global, its London replica answering from here |
| **presence** on the same relay (the voice's roster) | who has joined | a join or leave reaches the other side **0.9–2.9 s** later, in steps of about a second, and only 10 of 22 changes surfaced as an event within 2.5–4 s | the same relay |
| **voice** — WebRTC mesh (`src/lib/voice-channel.ts`) | audio, peer to peer | not timed here | signalling over the vapour channel; STUN only (Google's public server), TURN only if an env var names one |
| **WebRTC itself** (Chromium 152, two peers in one page) | — | setup **7 ms** warm (122 ms the first time); an unordered, no-retransmit data channel's round trip **0.2 ms** | — |

What the numbers say:

- **The relay already sits at the edge.** The raw floor from this Mac is 13–18 ms ICMP and about 20 ms TCP
  to the nearest edge. The Supabase hop costs that round trip plus about 3 ms, so the node relaying it is
  near London, not in Frankfurt where the project's database lives — Supabase runs Realtime as one cluster
  spread across regions, any node of which a client may reach
  ([architecture](https://supabase.com/docs/guides/realtime/architecture)). For two players in one
  region, the relay we already have is within a few milliseconds of what the connection allows.
- **The tail is the transport's, not the distance's.** p50 22 ms, p99 42–70 ms: a WebSocket rides TCP, and a
  lost packet holds every later message until it is resent. A 60 Hz game feels the tail, not the median.
- **The beach's HTTP is twenty times slower and must never carry play.** It crosses the Atlantic on every
  read; with the poll, a staged line takes one to two seconds to be seen. Right for words, wrong for action.
- **Presence is a roster, not a doorbell.** The voice dials a newcomer when presence syncs, so the call
  waits one to three seconds before it starts. An introduction should ride a broadcast hello (22 ms) and
  leave presence to say who is in the room.
- **The mirror adds its own 80 ms.** Typing is debounced (`VAPOUR_SEND_THROTTLE_MS = 80`), so a keystroke is
  seen about 100 ms after the typist pauses. A game would not debounce.
- **WebRTC costs nothing to run.** Its price between real players is their network path, the signalling
  hops through whoever introduces them, and a few round trips for ICE and DTLS.

## 3. What Armagetron Advanced teaches

Read from the source, stable 0.2.9.3.1 (tag of 7 October 2026) and trunk 0.4.0 alpha, at
[gitlab.com/armagetronad/armagetronad](https://gitlab.com/armagetronad/armagetronad); GPL v2 or later; one
maintainer active, 494 commits in the last year, mostly tests and refactors, no new network work.

| what it does | where | what it teaches the kit |
|---|---|---|
| UDP on port 4534, its own reliability per message (acks piggybacked, resend at ping + √variance, a ring of the last 1000 ids against duplicates); packets of at most 300 bytes of 16-bit words | `nNetwork.cpp` 108, 149–210, 2211 | two kinds of message, not one stream |
| **State is "latest wins"**: a sync is a dirty flag, sent unreliably when the bandwidth budget allows, applied only if newer than the last one applied | `nNetObject.cpp` 698–702, 1347–1385 | the unordered, no-retransmit channel |
| **Events are reliable and carry their own time**: a turn is ~36 bytes — position, new direction, distance, the client's game time, a turn counter | `gCycle.cpp` 1298–1316 | the ordered channel, and a timestamp on every event |
| The server is the only authority; the client turns its own cycle at once and replays its unacknowledged turns when the server's sync arrives | `gCycle.cpp` 3644–3683, 5418–5507 | prediction on the player's own page; one referee |
| The server places a turn where the player made it, within ±0.1 s of the player's clock; a late turn is rewound out of a lag credit (0.5 s per player, at most 0.1 s per event, refilled over 600 s) | `gCycleMovement.cpp` 2177–2287; `eLagCompensation.cpp` | why an event game tolerates ping |
| Ping charity: each player donates up to 100 ms (by default) so that everyone plays at a common delay — pings of 60 and 160 ms both become 110 | `ePlayer.cpp` 6886–6947; [network doc](http://armagetron.sourceforge.net/doc/network.html) | fairness is a setting, not a transport |
| Rates: your own cycle synced every 0.1 s, every enemy every **1.0 s**, every turn sent to everyone the moment it happens; the server simulates at up to 40 Hz; 8 kB/s per client on a dedicated server; 16 clients by default (32 compiled in) | `config/settings.cfg` 274–275; `settings_dedicated.cfg` 91–100 | a fast game is not a fast stream |
| About 120 settings are the server's — speed, turn delay, rubber, the map, even which cameras are allowed — pushed to every client at login and again at each round; about 500 are the player's own — models, textures, moviepacks, sounds, HUD, camera | `nConfig.cpp` 46–151; `gCycle.cpp` 2031–2160 | the law and the skin, exactly |

Two lessons carry. **Speed comes from events, not rate.** A 16-player round costs each client a few kilobytes a
second; what decides the feel is how fast a turn reaches everyone and how the referee places it. The code's
own limits (0.1 s per event, 100 ms default charity, the server browser marking down servers over 100 ms)
put its design comfortably above the 47 ms the relay we already have gives two UK players; read from those
caps, it was built for round trips up to about 150–200 ms, though neither its docs nor its wiki state a
threshold. **The core is a law,
the skin is the player's.** Armagetron already lives the arcade's sentence: the server pushes the rules,
each player draws the world their own way.

## 4. What makes a relay fast

**Where it sits, first.** A message's one-way time is the length of its path; software adds a few
milliseconds. Three shapes:

1. **Direct** — player to player over a WebRTC data channel. The shortest path there is. It needs an
   introduction (each side's offer and address passed through someone both can reach), and it fails through
   some home and mobile networks, where a TURN server carries it instead — a relay again, wherever TURN runs.
2. **The nearest edge** — each player connects to the nearest node of one network, and the nodes pass
   messages along the network's own backbone. Close to the direct path at any distance. Supabase Realtime
   behaves this way from here (§2).
3. **One place** — a room that lives in one location: a Cloudflare Durable Object, a game server on a
   rented machine, a Vercel function pinned to a region. Every message goes there and back. Fast for players
   near it, slow for the rest; the only shape that can run one authoritative simulation.

**How it travels, second.** A WebSocket rides TCP, so one lost packet stalls everything behind it until it
is resent — the p99 tail above. A data channel opened `{ ordered: false, maxRetransmits: 0 }` behaves like
UDP: a late position is dropped, never waited for, and the next one supersedes it. Events that must arrive
(a turn, a kill, a score) go on a second, ordered channel.

**What the game sends, third.** A game that sends timestamped events and lets the server place each event
where the player saw it tolerates far more ping than one that streams continuous input (§3).

What one place costs, from this Mac (TCP round trip to AWS's regional endpoints, median of eight): London
**26 ms**, Frankfurt **36**, Virginia **112**, Oregon **177**, Sydney **307**. Two UK players whose room
lives in Virginia — where the beach's function runs — would ping each other at about 220 ms before any
game code ran; through the edge relay, at 47. The same table says the Supabase node
answering here is in London: its acked round trip (23 ms) is shorter than the trip to Frankfurt.

So the fastest relay for the kit is: direct where it connects, the nearest edge where it does not, and one
place only when a game needs a referee.

## 5. The exchange, shaped by the beach

The beach is where a room is **found** and where play is **kept**. The stream never touches it: play is
vapour — ephemeral, unstored, unaudited (`docs/protocol-xstream-frame.md` §3.1) — at game rate.

- **The room** is a pool, as every room already is: who is here (presence), the game's law (its rules,
  its authority mode, its tick, its mechanics constants — §3's server-pushed settings, as a block), and the
  record (each player's result in their own mirror, replays, a cup's tree). All of it exists today.
- **The introduction** is the exchange. Players who meet in the room trade their WebRTC offers and answers
  over the room's vapour channel, exactly as the voice already does (`voice-channel.ts`: perfect
  negotiation, the polite side decided by handle, no coordinator). The bytes of play then go player to
  player.
- **The fallback** carries a pair the direct path cannot: TURN first, then the vapour relay itself.
- **The referee**, for a game that needs one: one player's page hosts — the room's earliest arrival, handed
  on when it leaves — at no cost; or a room object at the edge runs the game's core, paid per message, for
  cups where nobody may be both player and judge.
- **Every beach its own.** The vapour protocol (`docs/protocol-pscale-beach-vapour.md`, May 2026) says each
  beach carries its own vapour, co-hosted with its handler (decision 1). Vercel functions have accepted
  WebSockets since June, generally available since 20 October 2026: a connection pinned to one instance,
  closed at the function's maximum duration (300 s Hobby, 800 s Pro), one region (`iad1` unless set),
  memory billed while connections stay open, fan-out across instances through Redis
  ([docs](https://vercel.com/docs/functions/websockets), [limits](https://vercel.com/docs/functions/limitations)).
  So decision 1 is now buildable where a beach already stands — good for introductions and presence; not a
  pipe for play. The smallest widening: a beach may also **declare** what it offers at
  `/.well-known/pscale-beach-vapour` — its introduction channel, its TURN, its edge rooms — as addresses,
  not a proxy, so a game reads where to go. Matrix's calls already federate this way: each deployment names
  its own media server in its `.well-known`, and visitors from other servers join through it
  ([lk-jwt-service](https://github.com/element-hq/lk-jwt-service)). Each operator then pays for its own
  players, and the cost federates with them.

## 6. Who pays, at each scale

**The traffic, shaped as §3 teaches.** Each player sends its state about 10 times a second and an event or
two; a relay that broadcasts delivers each message to every other player. A room of N players then carries
about N × 11 × (N − 1) deliveries a second:

| room | deliveries a second | in an hour |
|---|---|---|
| Ghost Wire, a live race for two (moves batched ten times a second) | 20 | 72,000 |
| four players | 132 | 475,000 |
| sixteen players, an Armagetron round | 2,640 | 9.5 million |
| **the TRONIC Cup as David's sheet sets it** — 131,072 teams of eight, 17 rounds in 12½ hours, 131,071 matches of sixteen, ten minutes each | — | about 21,800 match-hours, **≈ 207 billion deliveries** |

**What each shape costs to carry it** (prices read 22 October 2026 from the vendors' own pages; the arithmetic
is this proposal's estimate, not a bill):

| shape | race for two, an hour | four players, an hour | sixteen, an hour | the Cup | what stops it |
|---|---|---|---|---|---|
| **the relay we have** — Supabase broadcast, billed as one send plus one per receiver, $2.50 a million beyond the Pro plan's 5 million a month ([usage](https://supabase.com/docs/guides/platform/manage-your-usage/realtime-messages)) | 144,000 messages, **$0.36** | 634,000, **$1.58** | 10.1 million, **$25** | 221 billion, **≈ $550,000** | a Pro project carries **500 messages a second** in all (2,500 without a spend cap) and disconnects its clients beyond it ([limits](https://supabase.com/docs/guides/realtime/limits)): twelve races at once, two rooms of four, and not one room of sixteen — and the mirror's own vapour shares the same 500 |
| **an edge room** — a Cloudflare Durable Object: incoming WebSocket messages billed at 20:1 as $0.15 a million, outgoing free, $12.50 a million GB-seconds while awake, nothing while hibernating ([pricing](https://developers.cloudflare.com/durable-objects/platform/pricing/), updated 18 October) | **$0.006** | **$0.007** | **$0.010** | **≈ $230** | about 1,000 requests a second per room (soft); $5 a month for the paid plan; the room stays where it was first opened |
| **direct**, players hosting, with Cloudflare TURN for the pairs that cannot connect — $0.05 a GB after 1,000 GB a month free ([pricing](https://developers.cloudflare.com/realtime/sfu/pricing/), updated 22 September) | **$0** | **$0** | **$0** with one player hosting | TURN for a fifth of the players ≈ 800 GB: **inside the free 1,000 GB** | the host's upload (about 0.4 Mbit/s for sixteen); 10–30% of pairs need TURN by vendors' reports, the best source a 2018 survey ([discuss-webrtc](https://groups.google.com/g/discuss-webrtc/c/5d_EJwM6iJM)) |

Per-message billing is the trap: it charges for every receiver, so it grows with the square of the room, and
its cap is per project, so one popular game would starve the mirror's own typing. Supabase stays right for
what it carries now — words, presence, introductions. Play belongs on a shape that costs nothing per
message.

Introductions are few: a pair trades an offer, an answer and a handful of addresses, about twenty messages,
once. Sent to each player's own channel rather than broadcast to the room, a room of sixteen costs about
2,400 messages to set up, and one player hosting (fifteen pairs, not 120) about 300 — but a Cup that seats a
million players inside the hour meets Supabase's 500 joins a second and 500 connections first. At that scale
the introductions move to the edge rooms too, one per match.

**The rest of the field, briefly** (the survey's own reading, links in its notes): Ably and Pusher bill per
receiver like Supabase. Photon prices per concurrent player and always routes through its servers. Colyseus
and Nakama are open-source game servers on a machine someone keeps. Edgegap places servers by the players'
pings at $0.069 a vCPU-hour. Fly.io keeps a small London machine at about $2–4 a month (plus $2 for the
address UDP needs). WebTransport's datagrams reached every major browser in March 2026 (Safari 26.4), but no
serverless host serves them yet. Hathora's game hosting closed in May; PartyKit's hosted platform closes on
23 October 2026, its code living on as PartyServer in one's own Cloudflare account.

## 7. Armagetron and the beach — the ways in

From the lightest touch to the heaviest:

1. **The beach keeps the cup; the game stays native.** A dedicated server runs as it is, on its own UDP
   netcode, on a rented machine near its players. The server already has the hook: `SPAWN_SCRIPT` starts a
   script that receives every ladderlog line on its standard input — 27 kinds of event, each switchable —
   and runs every line the script prints as a console command (`rConsoleCout.cpp` 144–201, 548–756;
   `ePlayer.cpp` 6179–6283), and `WAIT_FOR_EXTERNAL_SCRIPT` holds a round's start for up to 3 s. So the
   companion is one small script: it writes each match's result into the players' mirrors and the cup's
   tree, and it reads the draw from the beach and tells the server whom to seat and which settings to load.
   `MOVE_TO host:port` hands a player to another server, so a lobby server can deal a cup's matches out.
   The beach never sees a packet of play.
2. **The shelf lists live servers.** Four master servers (UDP 4533) hold the list; any client can ask one,
   then ask each server for its name, players and ping (`nServerInfo.cpp` 1165–1185, 2803–2892). A small
   reader copies that into a beach block, read-only, so the arcade's front door shows who is playing now.
3. **The mechanics as law.** The ~120 settings a server pushes are the shared core; kept as the game's law
   block, a cup's round names its settings by address and the companion loads them. Maps are already XML
   fetched over HTTP from a repository by URL (`tResourceManager.cpp` 67–312), so a map can stand at an
   address too.
4. **A browser Tron of the arcade's own**, built on the room plug with Armagetron's netcode ideas: turns as
   timestamped events on the ordered channel, positions on the unordered one, one player's page as the
   referee placing each turn where it was made, a lag credit and a ping charity in the law.
5. **Armagetron in the browser.** No port exists — none found on the web, no WebAssembly or WebSocket code in
   trunk; the nearest is Cycleblob (2011, WebGL, one player). All packets pass through two functions
   (`nSocket::Read` and `::Write`, `nSocket.cpp` 2004–2110), and its datagrams would map one-to-one onto an
   unordered data channel, so the seam is clean — but the whole game would have to be compiled to
   WebAssembly, and the port stays GPL. Weeks, not days.

One trap for any shared relay placed in front of a native server: every player would arrive from the
relay's one address, and the server keys rules on the address alone — at most 4 to 8 clients from one IP,
and no points between enemies on the same IP (`MAX_CLIENTS_SAME_IP_*`, `ALLOW_ENEMIES_SAME_IP 0`). The
native game is best left on its own UDP, with the beach around it rather than in its path.

## 8. The build order

Each step is useful on its own, and each is played on a throwaway table before it is handed over.

1. **The room plug, and a ping page two people can try.** `beachGame.room(game, room)` in the arcade's
   plug (`game.js`, proposed at /game-arcade and not yet built): presence and introductions over the room's vapour channel; one unordered channel for state
   and one ordered channel for events to each other player; the vapour relay carrying any pair the direct
   path cannot; each peer's ping shown. Most of it stands already in `voice-channel.ts` (presence, perfect
   negotiation, the grace window for a phone that dims) — the change is data channels where it has audio
   tracks. The page shows two people their ping both ways, relayed and direct, side by side. This is the
   "small working piece David can try" the arcade's fold asks for. The first game to carry it is the one
   already on the shelf: Ghost Wire steps at a fixed 60 Hz and records a run as one move per step
   (`ghost-wire.js` `RATE = 60`; `moves.push([qx, qy])` in the page's tick), so a live race streams each
   player's moves and the other page re-runs them as a ghost a few frames behind. Nobody collides with
   anybody, so ping changes nothing about who wins, and the finished run is still proved by re-running it.
2. **TURN, so a phone off wifi can join.** The voice's no-audio sessions of 27 and 28 July matched the
   profile of peers that need TURN (`voice-channel.ts`'s own note). Credentials are minted per session by a
   beach route, so no key ships in a page.
3. **The declared relay.** `/.well-known/pscale-beach-vapour` answers with what the beach offers — its
   introduction channel, its TURN, its edge rooms; the plug reads it, so an operator who runs their own
   changes one answer, not any game.
4. **A referee when a game needs one.** One player's page hosts by default; a room object at the edge
   when the first live cup needs a judge who is not a player.
5. **Armagetron itself**, if David wants the real game on the shelf: §7's first way.

## 9. Decisions

1. **The shape.** The exchange is the introduction: play goes player to player, the relay carries what the
   direct path cannot, and the beach keeps the room and the record. GO, NOT YET or CHANGE?
2. **The first piece.** Step 1 — the room plug and the ping page, generalising the voice's signalling.
3. **TURN.** Cloudflare's is recommended (1,000 GB a month free covers even the Cup as costed in §6), under
   the beach operator's own account — whose, for this beach?
4. **The vapour protocol's decision 1.** Keep "co-hosted with the beach handler", now buildable on Vercel,
   and add "or declared by it" so a beach can name a relay it runs elsewhere?
5. **Armagetron.** Bridge the real game for cups, take its netcode into a browser game of the arcade's own,
   or both, and in which order (§7).

## 10. How it was measured

- **The Supabase relay:** two `@supabase/supabase-js` 2.101.1 clients in one Node 22 process, each with its own
  socket, on a throwaway public channel `vapour:probe:tron1:<random>`, `self: false`, the mirror's own
  publishable key read from the served bundle. Same clock at both ends, so one way is measured directly.
  Nothing was written to any table or block.
- **Baselines:** `curl -w %{time_connect}` eight times to each host; `ping -c 5` to the Supabase host; the
  Cloudflare trace for the edge's location; `curl -w %{time_total}` twelve times on
  `?block=pool:weft&spindle=9`.
- **Presence:** the same two clients on a second throwaway channel, one tracking and untracking eleven times
  at 2.5 s and 4 s spacing, the other timing each join and leave event.
- **Regions:** `curl -w %{time_connect}` eight times to `s3.<region>.amazonaws.com`.
- **WebRTC:** a static page in the Claude app's own Chromium, two `RTCPeerConnection`s signalled in the page,
  five runs without STUN and five with; 200 echoes of 48 bytes over `{ ordered: false, maxRetransmits: 0 }`.
- **Armagetron:** the source cloned shallow (`release_0.2.9` at c8489cf, trunk at bd705b0), read only and never
  built; the settings, the rates and the script hooks re-checked by hand against the files cited.
- **The field:** vendors' pages read on 22 October 2026; the five the costs rest on re-read by hand —
  Supabase's message billing and limits, Cloudflare's Durable Object and Realtime pricing, PartyKit's notice.
- **Ghost Wire:** its page and engine as served from Matthew's GitHub Pages that morning, read only.
