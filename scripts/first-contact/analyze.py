#!/usr/bin/env python3
"""The first-contact check's reading of its runs. Usage: analyze.py <out-dir> [--calls] [--answers]

For each run: the seconds from connector setup to the answer, to its first visible word and to its first
call; the calls made; the characters the calls returned; tokens and cost as the CLI reports them; and any
write the hook refused. Runs named <arm><letter>-<model>-<effort> are grouped by arm (no prefix is the
first arm) and summed by effort. A run's answer lands beside it as <run>.answer.md. Keep the numbers in
your own mirror, first-contact:<handle>, at the check's address (spine:first-contact 1.1111)."""
import glob, json, os, re, statistics as st, sys

out = sys.argv[1] if len(sys.argv) > 1 and not sys.argv[1].startswith('--') else '.'
rows = []
for f in sorted(glob.glob(os.path.join(out, '*.jsonl'))):
    rid = os.path.basename(f)[:-6]
    if rid.endswith('.hook'):
        continue
    t_init = t_res = first_text = first_tool = None
    tools, texts, res, chars = [], [], None, 0
    for line in open(f):
        o = json.loads(line); ev = o['ev']; ms = o['ms']; ty = ev.get('type')
        if ty == 'system' and ev.get('subtype') == 'init' and t_init is None:
            t_init = ms
        if ty == 'result':
            t_res, res = ms, ev
        elif ty == 'stream_event':
            e = ev.get('event', {})
            if first_text is None and e.get('type') == 'content_block_delta' and e.get('delta', {}).get('type') == 'text_delta' and e['delta'].get('text', '').strip():
                first_text = ms
        elif ty == 'assistant':
            for b in ev['message']['content']:
                if b['type'] == 'tool_use':
                    first_tool = ms if first_tool is None else first_tool
                    tools.append((ms, b['name'].replace('mcp__bsp__', ''), json.dumps(b['input'])[:160]))
                elif b['type'] == 'text' and b['text'].strip():
                    texts.append(b['text'])
        elif ty == 'user':
            for b in ev['message']['content']:
                if isinstance(b, dict) and b.get('type') == 'tool_result':
                    chars += len(json.dumps(b.get('content')))
    hook = os.path.join(out, rid + '.hook.jsonl')
    denied = [d for d in (json.loads(l) for l in open(hook)) if d.get('write')] if os.path.exists(hook) else []
    u = (res or {}).get('usage') or {}
    m = re.match(r'^([A-Z]*)([A-Z])-(\w+)-(\w+)$', rid)
    rows.append(dict(id=rid, arm=m.group(1) if m else '', q=m.group(2) if m else '', model=m.group(3) if m else '', effort=m.group(4) if m else '',
                     answer=(t_res - t_init) / 1000 if t_res is not None and t_init is not None else None,
                     first_word=(first_text - t_init) / 1000 if first_text and t_init is not None else None,
                     first_call=(first_tool - t_init) / 1000 if first_tool and t_init is not None else None,
                     calls=len(tools), tools=tools, chars=chars, cost=(res or {}).get('total_cost_usd'),
                     out_tokens=u.get('output_tokens'), denied=denied, error=(res or {}).get('is_error')))
    with open(os.path.join(out, rid + '.answer.md'), 'w') as a:
        a.write('\n\n---\n\n'.join(texts))

fmt = lambda v: '-' if v is None else f'{v:.0f}s'
print(f"{'run':24s} {'answer':>7s} {'1st word':>8s} {'1st call':>8s} {'calls':>5s} {'read':>8s} {'cost':>6s}  refused")
for r in rows:
    print(f"{r['id']:24s} {fmt(r['answer']):>7s} {fmt(r['first_word']):>8s} {fmt(r['first_call']):>8s} {r['calls']:5d} {r['chars']:8d} "
          f"{('%.2f' % r['cost']) if r['cost'] else '-':>6s}  {len(r['denied'])}{'  ERROR' if r['error'] else ''}")
print()
for arm in sorted({r['arm'] for r in rows}):
    for effort in ('medium', 'max'):
        v = [r['answer'] for r in rows if r['arm'] == arm and r['effort'] == effort and r['answer'] is not None]
        if v:
            calls = sum(r['calls'] for r in rows if r['arm'] == arm and r['effort'] == effort)
            print(f"arm {arm or '(first)':8s} {effort:6s}  {len(v)} runs  median {st.median(v):5.1f}s  range {min(v):.0f}-{max(v):.0f}s  calls {calls}")
if '--calls' in sys.argv:
    for r in rows:
        print('\n==', r['id'])
        for ms, n, a in r['tools']:
            print(f'   {ms / 1000:6.1f}s {n:20s} {a}')
        for d in r['denied']:
            print('   REFUSED', d['tool'], json.dumps(d['input'])[:200])
json.dump([{k: v for k, v in r.items() if k != 'tools'} for r in rows], open(os.path.join(out, 'summary.json'), 'w'), indent=1)
