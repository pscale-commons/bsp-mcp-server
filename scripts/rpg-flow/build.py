"""rpg-flow/build.py — after capture.ts.

Build a pscale-shaped flow block (the shape mindflow/flow/ draws) from the five
captured RPG windows. Labels, addresses and sizes only — no text is carried.
Each span is tagged with David's stratum (PHYSICS how to use pscale and the tool /
CHEMISTRY the compound composed for the task / BIOLOGY the loop's law and the role
worn for the call) and a lodestone rung for the page's colour."""
import json, re, sys, hashlib

if len(sys.argv) < 5:
    sys.exit('usage: build.py <capture-dir> <handle> <table-name> <room>   (after capture.ts)')
D, HANDLE, TABLE, ROOM = sys.argv[1:5]
T = {n: open(f'{D}/{n}.txt').read() for n in ['door', 'turn', 'medium', 'soft', 'hard']}
_m = re.search(r'# The place — spatial:([a-z0-9_-]+):', T['door']); WORLD = _m.group(1) if _m else 'world'
ACCT = 'history' if f'── history:{HANDLE} ──' in T['door'] else 'witnessed'
KNOWS = 'stash' if f'── stash:{HANDLE} ──' in T['door'] else 'knows'
def g(s):
    """The builder is written against the table it was first run at (Ugarth, Brackenfoot, pool:120, the legacy
    organ names); g() re-points every reference and header at the capture actually in hand."""
    return (s.replace('witnessed:Ugarth', f'{ACCT}:{HANDLE}').replace('knows:Ugarth', f'{KNOWS}:{HANDLE}')
             .replace('Ugarth', HANDLE).replace('brackenfoot-open', TABLE).replace('brackenfoot', WORLD)
             .replace('pool:120', f'pool:{ROOM}').replace(':120:', f':{ROOM}:').replace('pool:100:background', 'pool:coarser:background'))
fmt = lambda n: f'{n:,}'
est = lambda c: max(1, round(c / 4))

HEAD = re.compile(r'^(# .*|\[(?:THE |THIS |WHAT |WHERE |YOUR |WHO )[^\n]*|── .* ──|═+ .* ═+)$', re.M)

def sections(t):
    idx = [(m.start(), m.group(0)) for m in HEAD.finditer(t)]
    out = []
    if idx and idx[0][0] > 0: out.append(('(lead)', t[:idx[0][0]]))
    for i, (s, h) in enumerate(idx):
        e = idx[i + 1][0] if i + 1 < len(idx) else len(t)
        out.append((h, t[s:e]))
    return out

def find(secs, start, nth=0):
    hits = [b for h, b in secs if h.startswith(g(start))]
    return hits[nth] if len(hits) > nth else ''

def col0_chunks(body):
    """Split an addressed text into its first line(s) and each column-0 '[addr]' chunk with its indented children."""
    lines = body.split('\n'); chunks = []; cur = None
    for ln in lines:
        m = re.match(r'^\[([\d.]+)\] ', ln)
        if m:
            cur = [m.group(1), ln + '\n']; chunks.append(cur)
        elif cur is None:
            if not chunks or chunks[-1][0] != '': chunks.append(['', ''])
            chunks[-1][1] += ln + '\n'
        else:
            cur[1] += ln + '\n'
    return [(a, txt) for a, txt in chunks]

def story_groups(body):
    """Beats grouped by the room they happened in."""
    parts = re.split(r'(?m)^(?=— at )', body)
    head = parts[0]; groups = {}
    for p in parts[1:]:
        m = re.search(r'\[pool:([\d.]+)', p)
        groups.setdefault(m.group(1) if m else '?', []).append(p)
    return head, groups

# ── span + block construction ────────────────────────────────────────────────
STRATA = {'P': 'PHYSICS — how to use pscale and the tool', 'C': 'CHEMISTRY — the compound composed for this task', 'B': 'BIOLOGY — the loop: its law and the role worn for this call'}
RUNG_WORD = {'1': 'stance', '2': 'ground', '3': 'intention', '4': 'situation', '5': 'relation', '6': 'given', '7': 'composition'}
totals = {}   # window → stratum → chars

def span(win, ref, about, text, stratum, rung):
    ref, about = g(ref), g(about)
    chars = len(text)
    totals.setdefault(win, {'P': 0, 'C': 0, 'B': 0})[stratum] += chars
    return {'ref': ref, 'about': about, 'chars': chars, 'stratum': stratum, 'rung': rung,
            'fp': hashlib.sha1(text.encode()).hexdigest()[:8]}

def law_bundle(win, body):
    kids = []
    for addr, txt in col0_chunks(body):
        if addr == '':
            kids.append(span(win, 'grit:root', 'the engine in one paragraph, and how its delivery and further reads work', txt, 'P', '2.1'))
        else:
            deep = txt.count('\n') > 1
            kids.append(span(win, f'grit:{addr}:{"ring" if deep else "line"}', ('branch ' + addr + ' and one ring beneath it — each child by its own line') if deep else ('the ancestor line of ' + addr), txt, 'B', '1.4'))
    return kids

def whole_bundle(win, name, body, stratum, rung, what):
    kids = []
    for addr, txt in col0_chunks(body):
        ref = f'{name}:root' if addr == '' else f'{name}:{addr}:branch'
        kids.append(span(win, ref, (what + ' — its root') if addr == '' else (what + f' — branch {addr}'), txt, stratum, rung))
    # a side's part holds nine children at most: fold the smallest together
    while len(kids) > 9:
        kids.sort(key=lambda k: k['chars']); a, b = kids[0], kids[1]
        merged = dict(a); merged['chars'] = a['chars'] + b['chars']; merged['ref'] = f'{name}:minor:branches'; merged['about'] = what + ' — several small branches'
        kids = [merged] + kids[2:]
    kids.sort(key=lambda k: k['ref'])
    return kids

def story_bundle(win, body, per_beat):
    head, groups = story_groups(body); kids = []; first = True
    for room, beats in groups.items():
        if per_beat and len(beats) <= 9 and len(groups) == 1:
            for i, b in enumerate(beats):
                txt = (head if first else '') + b; first = False
                slot = re.search(r'slot (\d+)', b)
                kids.append(span(win, f'pool:{room}:beat{slot.group(1) if slot else i + 1}', 'one public beat, whole', txt, 'C', '5.3'))
        else:
            txt = (head if first else '') + ''.join(beats); first = False
            kids.append(span(win, f'pool:{room}:beats', f'{len(beats)} public beats at this room, each whole', txt, 'C', '5.3'))
    return kids[:9]

windows = []   # (title, line, system parts, message parts, reply)

# 1 ── THE DOOR ───────────────────────────────────────────────────────────────
s = sections(T['door']); W = 'door'
acct = find(s, '── witnessed:Ugarth ──'); openspan = find(s, '# The open span')
acct_kids = []
m = re.split(r'(?m)^(?=## )', acct)
acct_kids.append(span(W, 'witnessed:Ugarth:fold:note', 'the divider and the note saying the account is folded', m[0], 'P', '2.1'))
for c in m[1:]:
    sp = re.match(r'## ([\d-]+)', c).group(1)
    acct_kids.append(span(W, f'witnessed:Ugarth:summary:{sp}:span', 'a closed span of nine tellings standing as its paid summary', c, 'C', '3.2'))
open_kids = []
for c in re.split(r'(?m)^(?=\[\d+ )', openspan)[1:]:
    n = re.match(r'\[(\d+)', c).group(1)
    open_kids.append(span(W, f'witnessed:Ugarth:telling{n}', 'one telling of the open span — by its opening line where the room above carries the newest whole', c, 'C', '3.2'))
totals[W]['P'] += len(re.split(r'(?m)^(?=\[\d+ )', openspan)[0])
beats = find(s, '# Contributions since')
beat_kids = []
for c in re.split(r'(?m)^(?=## slot )', beats)[1:]:
    n = re.match(r'## slot (\d+)', c).group(1)
    beat_kids.append(span(W, f'pool:120:beat{n}', 'one public beat of the room the account has not yet told, whole', c, 'C', '5.3'))
totals[W]['P'] += len(re.split(r'(?m)^(?=## slot )', beats)[0])
sys_parts = [
    span(W, 'play:header', 'who you are, where you stand, PIN THIS BEACH, how to address every further call', find(s, '# You are now playing') + find(s, '═══════════ THE ROOM'), 'P', '2.1'),
    span(W, 'grit:1:rhythm', 'the law COMPRESSED to its rhythm — a returning seat; a first engage carries the whole character turn instead (9,300 chars)', find(s, '# Operating directive'), 'B', '1.4'),
    span(W, 'play:marker', 'the read-cursor and how to pass it back', find(s, '# Marker') + find(s, '═══════════ YOUR OWN'), 'P', '2.1'),
]
msg_parts = [
    span(W, 'spatial:brackenfoot:120:walk', 'the place walked to its address through the placing star-ref — root line, each ancestor, the room, one ring below', find(s, '# The place'), 'C', '4.2'),
    span(W, 'spatial:brackenfoot:120:ways', 'where this place leads, each with its address', find(s, '# The ways'), 'C', '4.2'),
    span(W, 'witnessed:Ugarth:tail3', 'the last three tellings, whole — delivered here and nowhere else', find(s, '# Your account'), 'C', '3.2'),
    [span(W, 'knows:Ugarth:room', 'what the character arrived knowing — in the room section', find(s, '# You know'), 'C', '3.2'),
     span(W, 'knows:Ugarth:own', 'the same block again in own context (only where it holds more than the room\'s one ring showed)', find(s, '── knows:Ugarth ──'), 'C', '3.2')],
    [span(W, 'liquid:pool:120:window', 'the staged intentions standing now (none)', find(s, '# Liquid'), 'C', '5.3'),
     span(W, 'pool:100:background', 'the coarser life around the room — the village rung', find(s, '# Background'), 'C', '4.5')],
    beat_kids,
    span(W, 'passport:Ugarth:whole', 'the sheet: capability, want, look and location', find(s, '── passport:Ugarth ──'), 'C', '1'),
    acct_kids,
    open_kids,
]
windows.append(('THE DOOR', 'pscale_play as Ugarth at brackenfoot-open — once per session, a tool result read by the player\'s own LLM', sys_parts, msg_parts, None))

# 2 ── A TURN ─────────────────────────────────────────────────────────────────
s = sections(T['turn']); W = 'turn'
sys_parts = [
    span(W, 'grit:1:rhythm', 'the law compressed to its rhythm', find(s, '(lead)') + find(s, '# Operating directive'), 'B', '1.4'),
    span(W, 'play:marker', 'the read-cursor', find(s, '# Marker'), 'P', '2.1'),
]
msg_parts = [
    span(W, 'spatial:brackenfoot:120:walk', 'the place, again — it rides every engage while the mirror draws its situation from each envelope', find(s, '# The place'), 'C', '4.2'),
    span(W, 'spatial:brackenfoot:120:ways', 'the ways, again — the same', find(s, '# The ways'), 'C', '4.2'),
    (span(W, 'witnessed:Ugarth:pointer', 'the account and the stash NAMED, not re-sent — a seat mid-session holds them', find(s, '# Your account'), 'P', '2.1')
     if find(s, '# Your account').startswith('# Your account and what you know')
     else span(W, 'witnessed:Ugarth:tail3', 'the last three tellings, sent again', find(s, '# Your account'), 'C', '3.2')),
    span(W, 'knows:Ugarth:room', 'what the character knows (an arrival only)', find(s, '# You know'), 'C', '3.2'),
    [span(W, 'liquid:pool:120:window', 'the staged intentions', find(s, '# Liquid'), 'C', '5.3'),
     span(W, 'pool:100:background', 'the coarser life around', find(s, '# Background'), 'C', '4.5')],
    span(W, 'pool:120:since', 'what is new since the marker (nothing)', find(s, '# Contributions since'), 'C', '5.3'),
]
windows.append(('A TURN', 'pscale_pool_engage with a marker — every say and every look, a tool result read by the player\'s own LLM', sys_parts, msg_parts, None))

# 3 ── MAKE IT HAPPEN (medium) ────────────────────────────────────────────────
s = sections(T['medium']); W = 'medium'
rules = find(s, '[THE RULES'); cut = rules.find('\n\nRules constraining') if 'NOMAD' in rules else len(rules.split('\n', 1)[0]) + 1
sys_parts = [
    span(W, 'tier:medium:header', 'the call\'s title line', find(s, '# THE CALL'), 'P', '2.1'),
    law_bundle(W, find(s, '[THE LAW')),
    span(W, 'tier:medium:contract', 'THIS CALL — the role worn and the shape of the reply', find(s, '[THIS CALL]'), 'B', '1.4'),
]
msg_parts = [
    span(W, 'spatial:brackenfoot:120:walk', 'the place: faces only, two rings down', find(s, '# THE INPUT') + find(s, '[THE PLACE'), 'C', '4.2'),
    story_bundle(W, find(s, '[THE STORY SO FAR'), True),
    span(W, 'passport:Ugarth:sheet', 'the actors: name, capability, look, carries', find(s, '[THE ACTORS'), 'C', '1'),
    span(W, 'liquid:pool:120:window', 'THE WINDOW — the staged acts themselves; the whole reason for the call', find(s, '[THE WINDOW'), 'C', '6.1'),
    span(W, 'liquid:pool:120:dice', 'each actor\'s own luck, already rolled', find(s, '[THE DICE'), 'C', '2'),
    [span(W, 'rules:nomad:whole', 'the dice system — riding only where dice were dealt', rules[:cut] if cut > 0 else rules, 'C', '2'),
     span(W, 'rules:brackenfoot:framing', 'the world\'s rules at their general framing', rules[cut:] if cut > 0 else '', 'C', '2')],
    span(W, 'spatial:brackenfoot:120:ways', 'the ways a WAY line may name', find(s, '[THE WAYS'), 'C', '4.2'),
    span(W, 'tier:medium:claim', 'the claim stamps and the ways, for the door to act on', find(s, '# THE CLAIM'), 'P', '2.1'),
]
windows.append(('MAKE IT HAPPEN', 'tier=medium at pool:120 — one call per resolved moment, on whichever key makes it happen', sys_parts, msg_parts,
                [('pool:120:beat', 'the one public beat, appended with the claim', 1060, '5.3')]))

# 4 ── THE TELLING (soft) ─────────────────────────────────────────────────────
s = sections(T['soft']); W = 'soft'
sys_parts = [
    span(W, 'tier:soft:header', 'the call\'s title line', find(s, '# THE CALL'), 'P', '2.1'),
    law_bundle(W, find(s, '[THE LAW')),
    span(W, 'tier:soft:contract', 'THIS CALL — the narrator\'s role and the shape of the telling', find(s, '[THIS CALL]'), 'B', '1.4'),
]
msg_parts = [
    span(W, 'spatial:brackenfoot:120:walk', 'where you are: the place and who is here by appearance', find(s, '# THE INPUT') + find(s, '[WHERE YOU ARE]'), 'C', '4.2'),
    span(W, 'knows:Ugarth:room', 'what you know', find(s, '[WHAT YOU KNOW]'), 'C', '3.2'),
    span(W, 'passport:Ugarth:holds', 'what you carry', find(s, '[WHAT YOU CARRY]'), 'C', '1'),
    span(W, 'witnessed:Ugarth:summary:latest', 'the story so far — ONE paid summary standing for nine tellings', find(s, '[YOUR STORY SO FAR — in summary'), 'C', '3.2'),
    span(W, 'witnessed:Ugarth:last', 'the last telling, for the voice — never told again', find(s, '[YOUR STORY SO FAR — the last'), 'C', '3.2'),
    span(W, 'pool:120:moment', 'THE MOMENT — the beat to be told; the whole reason for the call', find(s, '[THE MOMENT'), 'C', '6.1'),
    span(W, 'tier:soft:journal', 'where the telling is journaled and which beats it covers', find(s, '# THE JOURNAL'), 'P', '2.1'),
]
windows.append(('THE TELLING', 'tier=soft for Ugarth — one call per character per new beat, on that player\'s own key', sys_parts, msg_parts,
                [('witnessed:Ugarth:telling', 'the telling, journaled at the beat it tells', 1500, '3.2')]))

# 5 ── THE KEEPER (hard) ──────────────────────────────────────────────────────
s = sections(T['hard']); W = 'keeper'
sys_parts = [
    span(W, 'tier:hard:header', 'the call\'s title line', find(s, '# THE CALL'), 'P', '2.1'),
    law_bundle(W, find(s, '[THE LAW', 0)),
    span(W, 'tier:hard:contract', 'THIS CALL — the keeper\'s role and the WORLD / DROP / WHERE shape', find(s, '[THIS CALL]', 0), 'B', '1.4'),
]
msg_parts = [
    story_bundle(W, find(s, '# THE INPUT') + find(s, '[THE STORY SO FAR'), False),
    span(W, 'spatial:brackenfoot:120:held', 'the place with every hidden directory opened', find(s, '[THE PLACE, HELD'), 'C', '4.2'),
    span(W, 'passport:Ugarth:sheet', 'each sheet as it stands', find(s, '[THE CHARACTERS'), 'C', '1'),
    span(W, 'witnessed:Ugarth:last', 'what the players were last told', find(s, '[WHAT THEIR PLAYERS'), 'C', '3.2'),
    span(W, 'liquid:pool:all:standing', 'the voices the keeper left standing, room by room', find(s, '[THE WORLD NOW'), 'C', '5.3'),
    whole_bundle(W, 'keeper:brackenfoot', find(s, "[THE KEEPER'S REGISTER"), 'C', '3.3', 'the held register, its spine to two rings'),
    whole_bundle(W, 'rules:brackenfoot', find(s, "[THE WORLD'S RULES"), 'C', '2', 'the world\'s rules, their spine to two rings'),
    whole_bundle(W, 'identity:brackenfoot', find(s, '[WHO HOLDS THIS PLACE HOW'), 'C', '4.2', 'who holds THIS place how — walked to the room\'s address'),
    span(W, 'tier:hard:writes', 'the rooms and characters the keeper may write', find(s, '# THE WRITES'), 'P', '2.1'),
]
windows.append(('THE KEEPER', 'tier=hard after the resolution — one call per resolved moment, on the fuel of an enrolled doorman in the room', sys_parts, msg_parts,
                [('liquid:pool:120:world', 'what the place\'s people do next, staged into the window', 1080, '5.3')]))

# 6 ── THE KEEPER'S SHEET (hard, per character) ───────────────────────────────
W = 'sheet'
sys_parts = [
    law_bundle(W, find(s, '# THE SHEET CALL') + find(s, '[THE LAW', 1)),
    span(W, 'tier:sheet:contract', 'THIS CALL — keep one character\'s holds, the HOLDS shape', find(s, '[THIS CALL]', 1), 'B', '1.4'),
]
msg_parts = [
    span(W, 'passport:Ugarth:sheet', 'the sheet as it stands', find(s, '# THE SHEET INPUT') + find(s, '[THE SHEET AS IT STANDS'), 'C', '1'),
    story_bundle(W, find(s, '[THE STORY — what'), False),
]
windows.append(('THE KEEPER\'S SHEET', 'the sheet call — one per character per resolved moment, the same fuel', sys_parts, msg_parts,
                [('passport:Ugarth:holds', 'the holds as they stand now, at passport 4', 300, '1')]))

# ── to the pscale block ──────────────────────────────────────────────────────
prev = {}
def key_of(side, sp, bundled):
    return ('self:' + sp['ref']) if bundled else (('sys:' if side == 1 else 'given:') + sp['ref'])
def span_node(sp, flag):
    line = f"{sp['ref']} — {STRATA[sp['stratum']]} — {sp['about']} — {fmt(sp['chars'])} chars ≈ {fmt(est(sp['chars']))} tokens — {RUNG_WORD[sp['rung'][0]]} {sp['rung']} — {flag}"
    return {'_': line, '1': sp['ref'], '2': str(sp['chars']), '3': sp['rung'], '4': flag, '5': sp['fp']}

block = {}
import datetime
STAMP = datetime.datetime.now(datetime.timezone.utc).strftime('%Y-%m-%dT%H:%M:%SZ')
summary_rows = []
for wi, (title, line, sysp, msgp, reply) in enumerate(windows, start=1):
    line = g(line); now = {}
    def side_node(side, parts, label):
        node = {}; count = 0; chars = 0
        for pi, part in enumerate(parts, start=1):
            if isinstance(part, list):
                kids = [k for k in part if k['chars'] > 0][:9]
                g = {}; gch = 0
                for ki, k in enumerate(kids, start=1):
                    kk = key_of(side, k, True); flag = 'first' if wi == 1 else ('new' if kk not in prev else ('unchanged' if prev[kk] == k['fp'] else 'changed'))
                    now[kk] = k['fp']; g[str(ki)] = span_node(k, flag); gch += k['chars']; count += 1
                g['_'] = f'a part of {len(kids)} spans — {fmt(gch)} chars ≈ {fmt(est(gch))} tokens; one child per span'
                node[str(pi)] = g; chars += gch
            else:
                if part['chars'] == 0: continue
                kk = key_of(side, part, False); flag = 'first' if wi == 1 else ('new' if kk not in prev else ('unchanged' if prev[kk] == part['fp'] else 'changed'))
                now[kk] = part['fp']; node[str(pi)] = span_node(part, flag); chars += part['chars']; count += 1
        node['_'] = f'{label}: {count} spans, {fmt(chars)} chars ≈ {fmt(est(chars))} tokens'
        return node, chars
    S, sc = side_node(1, sysp, 'SYSTEM — the law and the role (for a tool result: the instructions around the scene)')
    M, mc = side_node(2, msgp, 'MESSAGE — the frame the call acts on')
    total = sc + mc
    wkey = ['door', 'turn', 'medium', 'soft', 'keeper', 'sheet'][wi - 1]
    t = totals[wkey]; tt = sum(t.values())
    pct = {k: round(100 * v / tt) for k, v in t.items()}
    win = {'_': f'window composed {STAMP} — {fmt(total)} chars ≈ {fmt(est(total))} tokens, estimated from characters at four to a token — physics {pct["P"]}% · chemistry {pct["C"]}% · biology {pct["B"]}%', '1': S, '2': M}
    wake = {'_': f'{title} — {line} — window ≈ {fmt(est(total))} tokens' + ('' if reply else ' — no reply followed: this is a tool result, and what follows it is the player\'s own LLM speaking to the player'), '1': win}
    if reply:
        writes = {}; wch = 0
        for ri, (ref, about, chars, rung) in enumerate(reply, start=1):
            ref, about = g(ref), g(about)
            writes[str(ri)] = {'_': f'write {ref} — {about} — ≈ {fmt(chars)} chars ≈ {fmt(est(chars))} tokens (typical, from the live record)', '1': ref, '2': str(chars), '3': rung, '4': ''}
            wch += chars
        writes['_'] = f'{len(reply)} write — ≈ {fmt(wch)} chars'
        wake['2'] = {'_': f'reply — ≈ {fmt(wch)} chars ≈ {fmt(est(wch))} tokens of output for ≈ {fmt(est(total))} tokens of window', '1': writes}
    block[str(wi)] = wake
    prev = now
    summary_rows.append((title, total, t, pct))

block['_'] = (f'FLOW — the window of {HANDLE} as the RPG composes it at {TABLE}, door by door and tier by tier: what enters a mind for ONE played moment, from where, at what size. '
              'Six windows, in the order a moment runs: 1 the door (pscale_play, once a session), 2 a turn (every say and look), 3 make it happen (tier medium), 4 the telling (tier soft), 5 the keeper (tier hard), 6 the keeper\'s sheet (one per character). '
              'Each {_: the window\'s line, 1: window {1 SYSTEM, 2 MESSAGE}, 2: reply}; a span reads {_ its line, 1 the reference, 2 chars, 3 lodestone rung, 4 its change since the previous window, 5 fingerprint}. '
              'Every span\'s line names its STRATUM — PHYSICS (how to use pscale and the tool), CHEMISTRY (the compound composed for the task), BIOLOGY (the loop\'s law and the role worn for the call) — and every window\'s line carries the three percentages. '
              'Labels, addresses and sizes only: no text is carried. Measured read-only from the live table by bsp-mcp scripts/rpg-flow (capture.ts, then build.py), composed by src/tools/tiers.ts and play.ts as they stood when it ran. '
              'Drawn at happyseaurchin.com/mindflow/flow/?source=beach@<the origin it is published at>:flow:' + HANDLE + '; provenance at 9.')
block['9'] = {'_': f'PROVENANCE — a measurement, not a producer: written {STAMP} from five read-only compositions at {TABLE} pool:{ROOM} as {HANDLE}; sizes are characters, tokens estimated at four to one; reply sizes are typical values from the live record, marked ≈. Publish it anywhere but the apex flow: family, which the torus page sweeps as living agents.'}

json.dump(block, open(f'{D}/flow-block.json', 'w'), ensure_ascii=False, indent=1)
print('block chars:', len(json.dumps(block, ensure_ascii=False)))
print(f"{'window':22s} {'chars':>8s} {'≈tok':>7s}   physics  chemistry  biology")
for title, total, t, pct in summary_rows:
    print(f"{title:22s} {total:8,d} {est(total):7,d}   {pct['P']:5d}%  {pct['C']:7d}%  {pct['B']:6d}%   (P {t['P']:,} · C {t['C']:,} · B {t['B']:,})")
