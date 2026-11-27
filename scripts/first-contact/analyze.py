#!/usr/bin/env python3
"""The first-contact check's reading of its runs. Usage: analyze.py <out-dir> [--calls] [--answers] [--keep]

For each run: the seconds from connector setup to the answer, to its first visible word and to its first
call; the calls made; the characters the calls returned; tokens and cost as the CLI reports them; and any
write the hook refused. Runs named <arm><letter>-<model>-<effort> are grouped by arm (no prefix is the
first arm) and summed by effort. A run's answer lands beside it as <run>.answer.md, and --answers writes
every answer word for word into one file, answers.md, by question, so a person or another AI can read
what came back. An email address the CLI showed the model is withheld from both, since a kept run is
public. --keep writes run.json, the run in the shape it is kept in a mirror: your line at _ (to write), the
table at 2, each question's answers word for word at 3 to 6 (one line beneath the question per cell), and 7
to 9 yours to write (what the answers show, what to change at which step, any confound). Keep it in your own
mirror, first-contact:<handle>, at the check's address (spine:first-contact 1.11111), each later run one rung
beneath the one before."""
import glob, json, os, re, statistics as st, sys

EMAIL = re.compile(r'[\w.+-]+@[\w-]+(\.[\w-]+)+')
def withheld(t):
    return EMAIL.sub("\u2039the signed-in account's email\u203a", t)

out = sys.argv[1] if len(sys.argv) > 1 and not sys.argv[1].startswith('--') else '.'
rows = []
for f in sorted(glob.glob(os.path.join(out, '*.jsonl'))):
    rid = os.path.basename(f)[:-6]
    if rid.endswith('.hook'):
        continue
    t_init = t_res = first_text = first_tool = None
    model_id = ''
    tools, texts, spoken, res, chars = [], [], [], None, 0
    for line in open(f):
        o = json.loads(line); ev = o['ev']; ms = o['ms']; ty = ev.get('type')
        if ty == 'system' and ev.get('subtype') == 'init' and t_init is None:
            t_init, model_id = ms, ev.get('model') or ''
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
                    texts.append(b['text']); spoken.append((ms, b['text']))
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
                     out_tokens=u.get('output_tokens'), denied=denied, error=(res or {}).get('is_error'), model_id=model_id))
    last = tools[-1][0] if tools else -1
    rows[-1]['text'] = withheld('\n\n'.join(t.strip() for ms, t in spoken if ms > last) or (texts[-1].strip() if texts else ''))
    with open(os.path.join(out, rid + '.answer.md'), 'w') as a:
        a.write(withheld('\n\n---\n\n'.join(texts)))

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
if '--answers' in sys.argv:
    here = os.path.dirname(os.path.abspath(__file__))
    asked = lambda q: (open(os.path.join(here, 'prompts', q + '.txt')).read().strip() if os.path.exists(os.path.join(here, 'prompts', q + '.txt')) else q)
    name = lambda m: {'sonnet': 'Sonnet', 'opus': 'Opus', 'haiku': 'Haiku'}.get(m, m)
    order = {'sonnet-medium': 0, 'sonnet-max': 1, 'opus-medium': 2, 'opus-max': 3}
    with open(os.path.join(out, 'answers.md'), 'w') as a:
        a.write('# First contact, every answer word for word\n\n')
        a.write('Clean sessions holding only the open connector, every write refused; the seconds run from connector setup to the answer. '
                'Only the answer after the last call is kept here; a line said before a call is in <run>.answer.md.\n')
        for arm in sorted({r['arm'] for r in rows}):
            for q in sorted({r['q'] for r in rows if r['arm'] == arm}):
                a.write('\n## ' + (('arm ' + arm + ': ') if arm else '') + asked(q) + '\n')
                for r in sorted((r for r in rows if r['arm'] == arm and r['q'] == q), key=lambda r: order.get(r['model'] + '-' + r['effort'], 9)):
                    calls = ', '.join(n for _, n, _ in r['tools']) or 'no call'
                    secs = '-' if r['answer'] is None else ('%.1f seconds' % r['answer'])
                    a.write('\n### ' + name(r['model']) + ', ' + r['effort'] + ' effort: ' + secs + ', ' +
                            (str(r['calls']) + ' call' + ('' if r['calls'] == 1 else 's')) + ' (' + calls + ')\n\n' + (r.get('text') or '(no answer)') + '\n')
    print('answers: ' + os.path.join(out, 'answers.md'))
if '--keep' in sys.argv:
    here = os.path.dirname(os.path.abspath(__file__))
    asked = lambda q: (open(os.path.join(here, 'prompts', q + '.txt')).read().strip() if os.path.exists(os.path.join(here, 'prompts', q + '.txt')) else q)
    label = {'A': 'WHAT IS THE BEACH', 'B': 'WHO IS DAVID PINTO', 'C': 'WHAT CAN I DO HERE', 'D': "THE CONNECT PAGE'S FIRST MESSAGE"}
    cells = [('sonnet', 'medium'), ('sonnet', 'max'), ('opus', 'medium'), ('opus', 'max')]
    def up(r):
        m = re.match(r'^claude-([a-z]+)-(\d+)-(\d+)', r.get('model_id') or '')
        return (m.group(1).upper() + ' ' + m.group(2) + '.' + m.group(3)) if m else r['model'].upper()
    words = ['no', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine']
    calls_of = lambda r: (words[r['calls']] if r['calls'] < 10 else str(r['calls'])) + ' call' + ('' if r['calls'] == 1 else 's') + ' (' + ', '.join(n for _, n, _ in r['tools']) + ')'
    secs = lambda r: '-' if r['answer'] is None else ('%.1f' % r['answer'])
    run, qs = {'_': 'RUN — <the date>: <who ran it and how> ... (yours to write)'}, sorted({r['q'] for r in rows if not r['arm']})
    tab = ['Table — seconds from connector setup to the answer, and the calls made, in each cell', '| | ' + ' | '.join(m.capitalize() + ' ' + e for m, e in cells) + ' |', '|---' * (len(cells) + 1) + '|']
    for q in qs:
        by = {(r['model'], r['effort']): r for r in rows if not r['arm'] and r['q'] == q}
        tab.append('| ' + asked(q).rstrip('.?') + ' | ' + ' | '.join((secs(by[c]) + ' s, ' + str(by[c]['calls'])) if c in by else '-' for c in cells) + ' |')
    run['2'] = '\n'.join(tab)
    for i, q in enumerate(qs[:4]):
        by = {(r['model'], r['effort']): r for r in rows if not r['arm'] and r['q'] == q}
        node = {'_': label.get(q, 'QUESTION ' + q) + ' — asked “' + asked(q) + '”; the answers word for word, beneath: ' + ', '.join(m.capitalize() + ' at ' + e for m, e in cells if (m, e) in by) + '.'}
        for j, c in enumerate([c for c in cells if c in by]):
            r = by[c]
            node[str(j + 1)] = up(r) + ', ' + c[1].upper() + ' — ' + secs(r) + ' seconds, ' + calls_of(r) + '\n' + (r.get('text') or '(no answer)')
        run[str(3 + i)] = node
    for k, what in (('7', 'WHAT THE ANSWERS SHOW'), ('8', 'WHAT TO CHANGE'), ('9', 'A CONFOUND')):
        run[k] = what + ' — (yours to write)'
    json.dump(run, open(os.path.join(out, 'run.json'), 'w'), indent=1, ensure_ascii=False)
    print('kept shape: ' + os.path.join(out, 'run.json'))
json.dump([{k: v for k, v in r.items() if k not in ('tools', 'text')} for r in rows], open(os.path.join(out, 'summary.json'), 'w'), indent=1)
