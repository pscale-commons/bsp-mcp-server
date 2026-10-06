#!/usr/bin/env python3
"""redial — re-dial weft's manifest from the measure, with no hand in it.

THE MEASURE: across every Claude Code transcript on this machine, what a session
reached for from the shell's own organs in the SAME response as its boot — the
reads the compiled window did not spare it. THE RULES, fixed here once:
  1. a slot whose compiled section is empty is re-dialed to attention 0 if the
     block has anything at all there, else dropped;
  2. an organ spindle reached for after boot by one session in ten (MIN_SHARE)
     joins the bundle, at the attention those sessions used, most-reached first,
     until nine slots stand — an entry of an accumulator (a lane's own pile or
     day) is a pick-up, not orientation, and never joins;
  3. the hand's own compiled context stays under BUDGET characters (the room is
     the inbox and is not counted): slots are added in order and the first one
     that breaks the budget is left out, largest first (the door measures).
Retired organs (the desk) are never re-dialed in.

    npm run redial               # measure and propose
    npm run redial -- --write    # and write the manifest, then measure the door again
    npm run redial -- --session <transcript.jsonl>   # the measure for one session

scripts/review.py runs it with --write every Sunday from this Mac (David,
2026-10-06: 'run it Sundays') and records the outcome beneath the day's entry
in daily:weft. Beside count-calls.py, which counts what calls were for;
this changes what the next boot is given.
"""
import collections, glob, json, os, re, sys, urllib.request

BEACH = 'https://beach.happyseaurchin.com'
WELL = BEACH + '/.well-known/pscale-beach'
MCP = 'https://bsp.hermitcrab.me/mcp/v1'
HAND = 'weft'
MIN_SHARE = 0.10        # reached for by one session in ten
BUDGET = 15000
RETIRED = {('shell', '5')}           # the desk, set aside 2026-10-06
FIXED = {'7'}                         # manifest slots that are prose, never re-dialed
ORGANS = {'passport','shell','orientation','cook','wake','purpose','review','order','proposals','watch','history','daily','solid','vault','stash','capabilities','relationships','reflexive','surface','state-of-play','arrival','situating-pscale','task','pool'}

def lines(path):
    with open(path, encoding='utf-8') as f:
        for l in f:
            try: yield json.loads(l)
            except ValueError: pass

def is_user_turn(d):
    if d.get('type') != 'user': return False
    c = (d.get('message') or {}).get('content')
    return isinstance(c, str) or (isinstance(c, list) and any(isinstance(x, dict) and x.get('type') == 'text' for x in c))

def organ_read(name, inp):
    """(organ, spindle, attention) when this call reads one of the hand's own organs, else None."""
    inp = inp if isinstance(inp, dict) else {}
    tool = name.rsplit('__', 1)[-1]
    if tool == 'bsp':
        if inp.get('content') is not None or inp.get('new_lock') is not None or inp.get('append'): return None
        agent, block = str(inp.get('agent_id', '')), str(inp.get('block', ''))
        if agent == HAND and block in ORGANS: organ = block
        elif agent.startswith(BEACH) and block.endswith(':' + HAND) and block[:-len(HAND)-1] in ORGANS: organ = block[:-len(HAND)-1]
        else: return None
        sp = str(inp.get('spindle') or '')
        att = inp.get('pscale_attention')
        return (organ, sp, 'walk' if att is None else int(att))
    if tool == 'pscale_pool_engage' and str(inp.get('pool_name')) == HAND and not inp.get('contribution') and inp.get('submit') is None:
        return ('pool', '', 'engage')
    if tool == 'pscale_stream_engage' and str(inp.get('handle')) == HAND and not (inp.get('say') or '').strip():
        return ('beat', str(inp.get('at') or ''), 'engage')
    return None

def after_boot(path):
    """The organ reads in the same response as the boot, as a list, and when the boot was; None when the session never booted as weft."""
    booted = None; reads = []; done = False
    for d in lines(path):
        if done: break
        if booted and is_user_turn(d): done = True; break
        if d.get('type') != 'assistant': continue
        for c in (d.get('message') or {}).get('content') or []:
            if not isinstance(c, dict) or c.get('type') != 'tool_use': continue
            n, inp = c.get('name', ''), c.get('input') or {}
            if not booted:
                if n.endswith('pscale_play') and str(inp.get('handle')) == HAND: booted = str(d.get('timestamp') or '?')
                continue
            r = organ_read(n, inp)
            if r: reads.append(r)
    return {'reads': reads, 'at': booted} if booted else None

def measure():
    per = {}
    for path in glob.glob(os.path.expanduser('~/.claude/projects/*/*.jsonl')):
        r = after_boot(path)
        if r is not None: per[path] = r['reads']
    return per

def manifest():
    with urllib.request.urlopen(f'{WELL}?block=shell:{HAND}&spindle=3&_t={os.getpid()}', timeout=20) as r: return json.load(r)

def parse_ref(ref):
    m = re.match(r'^(.*):(\d+|0):(-?\d+)$', ref)
    return (m.group(1), m.group(2), int(m.group(3))) if m else None

def key():
    for l in open(os.path.expanduser('~/.claude/projects/-Users-davidpinto-Projects-weft/memory/identity_weft.md'), encoding='utf-8'):
        if l.startswith('| **OPERATIONAL LOCK**'): return re.findall(r'`([^`]+)`', l)[-1]
    raise SystemExit('no key')

class Door:
    def __init__(self): self.sid = None; self.n = 1
    def rpc(self, method, params, sid=True):
        h = {'Content-Type': 'application/json', 'Accept': 'application/json, text/event-stream'}
        if sid and self.sid: h['mcp-session-id'] = self.sid
        req = urllib.request.Request(MCP, data=json.dumps({'jsonrpc': '2.0', 'id': self.n, 'method': method, 'params': params}).encode(), headers=h)
        self.n += 1
        with urllib.request.urlopen(req, timeout=60) as r:
            self.sid = self.sid or r.headers.get('mcp-session-id'); body = r.read().decode()
        data = '\n'.join(l[5:].strip() for l in body.splitlines() if l.startswith('data:'))
        try: return json.loads(data or body)
        except ValueError: return {}
    def window(self, secret):
        if not self.sid:
            self.rpc('initialize', {'protocolVersion': '2024-11-05', 'capabilities': {}, 'clientInfo': {'name': 'redial', 'version': '0'}}, sid=False)
            self.rpc('notifications/initialized', {})
        r = self.rpc('tools/call', {'name': 'pscale_play', 'arguments': {'world': BEACH, 'handle': HAND, 'room': HAND, 'secret': secret}})
        text = ''.join(c.get('text', '') for c in (r.get('result') or {}).get('content') or [])
        own = text.split('YOUR OWN CONTEXT')[-1] if 'YOUR OWN CONTEXT' in text else text
        secs = {}
        for m in re.finditer(r'── (\S+) ──\n(.*?)(?=\n── |\n\ncompleted · |\Z)', own, re.S):
            secs[m.group(1)] = m.group(2).strip()
        return sum(len(v) for v in secs.values()), secs

def run(argv):
    """Measure, propose and (with --write) re-dial; returns the one-line outcome."""
    if '--session' in argv:
        p = argv[argv.index('--session') + 1]; r = after_boot(p)
        print('never booted as weft' if r is None else f'{len(r["reads"])} organ reads after boot: ' + ', '.join(f'{o}:{s or "root"}:{a}' for o, s, a in r['reads'])); return 'measured'
    per = measure()
    print(f'sessions that booted as {HAND}: {len(per)}')
    counts = collections.Counter(); sessions_by = collections.defaultdict(set)
    for path, reads in per.items():
        for o, s, a in reads:
            counts[(o, s, a)] += 1; sessions_by[(o, s, a)].add(path)
    mean = sum(len(r) for r in per.values()) / max(len(per), 1)
    print(f'organ reads after boot: {sum(counts.values())} in all, {mean:.1f} per session')
    reached = sorted(((len(v), k) for k, v in sessions_by.items()), key=lambda t: (-t[0], t[1][0], t[1][1], str(t[1][2])))
    print('reached for, by sessions:')
    for n, (o, s, a) in reached[:14]: print(f'  {n:2d} sessions  {o}:{s or "root"}:{a}')
    man = manifest(); slots = {k: v for k, v in man.items() if k != '_'}
    print('manifest now:', {k: v for k, v in slots.items() if k not in FIXED})
    door = Door(); sec = key()
    size, secs = door.window(sec)
    print(f'own context now: {size} chars; sections: ' + ', '.join(f'{k} ({len(v)})' for k, v in secs.items()))
    # rule 1
    new = dict(slots)
    for k, ref in list(slots.items()):
        if k in FIXED: continue
        pr = parse_ref(ref)
        if pr and len(secs.get(ref, '')) <= 2:
            block, addr, att = pr
            if att != 0: new[k] = f'{block}:{addr}:0'; print(f'rule 1: slot {k} {ref} compiles empty → {new[k]}')
            else: del new[k]; print(f'rule 1: slot {k} {ref} compiles empty at 0 → dropped')
    # rule 2
    have = {parse_ref(v)[0] for v in new.values() if parse_ref(v)}
    adds = []
    for n, (o, s, a) in reached:
        if n < max(2, MIN_SHARE * len(per)): break
        if (o, s[:1]) in RETIRED or a in ('engage', 'walk') or o in ('beat', 'pool'): continue
        if o in ('watch', 'history', 'daily') and s: continue      # a lane's own entry: a pick-up, not orientation
        block = f'{o}:{HAND}'
        ref = f'{block}:{s or "0"}:{a}'
        if block in have and not s: continue           # already compiled at its root
        if ref in new.values(): continue
        adds.append((n, ref))
    free = [d for d in '123456789' if d not in new]
    for n, ref in adds:
        if not free: break
        d = free.pop(0); new[d] = ref; print(f'rule 2: slot {d} ← {ref} ({n} sessions reached for it)')
    if new == slots: print('nothing to re-dial'); return f'manifest as it was ({len(per)} boots measured, {mean:.1f} organ reads after boot)'
    if '--write' not in argv:
        print('proposed manifest:', {k: v for k, v in new.items() if k not in FIXED}); return 'proposed only'
    body = {k: v for k, v in man.items()}; body.update(new)
    for k in list(body):
        if k != '_' and k not in new: del body[k]
    def write(b):
        req = urllib.request.Request(WELL, data=json.dumps({'block': f'shell:{HAND}', 'spindle': '3', 'content': b, 'secret': sec}).encode(), headers={'Content-Type': 'application/json'}, method='POST')
        with urllib.request.urlopen(req, timeout=30) as r: return r.status
    print('write:', write(body))
    size2, secs2 = door.window(sec)
    print(f'own context after: {size2} chars; sections: ' + ', '.join(f'{k} ({len(v)})' for k, v in secs2.items()))
    # rule 3
    while size2 > BUDGET and any(k not in slots for k in body if k != '_'):
        added = [k for k in body if k != '_' and k not in slots]
        last = max(added, key=lambda k: len(secs2.get(body[k], ''))); dropped = body.pop(last)
        print(f'rule 3: {size2} > {BUDGET} — slot {last} {dropped} ({len(secs2.get(dropped, ""))} chars) left out'); print('write:', write(body))
        size2, secs2 = door.window(sec); print(f'own context after: {size2} chars')
    final = {k: v for k, v in body.items() if k not in ('_', '7')}
    print('manifest written:', final)
    changed = {k: v for k, v in final.items() if slots.get(k) != v}
    dropped = [k for k in slots if k not in final and k not in FIXED]
    return (f'manifest re-dialed from {len(per)} boots ({mean:.1f} organ reads after boot): '
            + (', '.join(f'slot {k} → {v}' for k, v in changed.items()) or 'nothing changed')
            + (f'; dropped {", ".join(dropped)}' if dropped else '') + f'; own context {size2} chars')

def main(argv):
    out = run(argv)
    return 0 if isinstance(out, str) or out == 0 else out

if __name__ == '__main__': sys.exit(main(sys.argv[1:]))
