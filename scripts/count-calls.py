#!/usr/bin/env python3
"""count-calls — what a Claude Code session spent on the work and what on itself.

    npm run count                       # the newest session of this project
    npm run count -- 04c38e95           # a session by the start of its id
    npm run count -- /path/to/x.jsonl   # a transcript, wherever it is
    npm run count -- --all              # every session of this project, one line each
    npm run count -- --day 2026-10-05   # one day across every project on this Mac (or --day yesterday)

Reads the session's own transcript (~/.claude/projects/<project>/<id>.jsonl) and
any sub-agent transcripts beneath it, and splits every tool call into WORK and
SELF-ADMIN: the shell's organs (the desk, the pile, the say at now, the paths
tree, the boot), and the harness's memory files. Then the model calls behind
them, with the tokens each cost — output (the thinking and the writing) and
input (the window re-sent on every call, which is where self-admin costs most).

David, 2026-10-06: 'far too many tool calls sequentially arranged; too many
threads that the llm needs to pull, which costs time, processing, money'. This
is the measure for that review. bsp-habits.py counts HOW bsp() is called; this
counts WHAT the calls were for. Both read the transcript, nothing else.
"""
import collections
import datetime
import glob
import json
import os
import sys

# ── What counts as self-admin ──────────────────────────────────────────────
# A block of the shell's own keeping, not of the work.
ADMIN_BLOCKS = {
    'shell:weft', 'watch:weft', 'orientation:weft', 'task:weft', 'daily:weft',
    'history:weft', 'stack:weft', 'spine:paths', 'pool:weft', 'vault:weft',
    'wake:weft', 'passport:weft', 'cook:weft',
}
ADMIN_FIELD = 'torus-mirror'   # the say at now
ADMIN_HAND = 'weft'


def kind(name, inp):
    """'admin' or 'work' for one tool call."""
    inp = inp if isinstance(inp, dict) else {}
    if name.startswith('mcp__') and '__bsp' in name or name.startswith('mcp__bsp__'):
        tool = name.rsplit('__', 1)[-1]
        if tool == 'pscale_play':
            return 'admin'
        if tool == 'pscale_stream_engage' and inp.get('field') == ADMIN_FIELD and inp.get('handle') == ADMIN_HAND:
            return 'admin'
        if str(inp.get('block', '')) in ADMIN_BLOCKS or str(inp.get('pool_name', '')) == ADMIN_HAND:
            return 'admin'
        return 'work'
    if name in ('Write', 'Edit', 'Read', 'MultiEdit', 'NotebookEdit'):
        p = str(inp.get('file_path', ''))
        return 'admin' if ('/.claude/projects/' in p and '/memory/' in p) else 'work'
    if name == 'Bash':
        c = str(inp.get('command', ''))
        if any(b in c for b in ('watch:weft', 'shell:weft')) or ('/memory/' in c and 'MEMORY.md' in c):
            return 'admin'
    return 'work'


# ── Reading a transcript ───────────────────────────────────────────────────

def read_lines(path):
    with open(path, encoding='utf-8') as f:
        for line in f:
            try:
                yield json.loads(line)
            except ValueError:
                continue


def when(d):
    ts = d.get('timestamp')
    if not ts:
        return None
    try:
        return datetime.datetime.fromisoformat(ts.replace('Z', '+00:00'))
    except ValueError:
        return None


def is_user_turn(d):
    if d.get('type') != 'user':
        return False
    content = (d.get('message') or {}).get('content')
    if isinstance(content, str):
        return True
    return isinstance(content, list) and any(isinstance(c, dict) and c.get('type') == 'text' for c in content)


def count(paths, day=None):
    """day: a YYYY-MM-DD (UTC) that keeps only that day's lines."""
    uses = {}        # tool_use id -> (ts, kind, name)
    results = {}     # tool_use id -> ts
    turns = []       # per user turn: Counter
    cur = None
    model_calls = {}  # message id -> {'kinds': set, 'text': bool, 'usage': dict}
    first = last = None
    for path in paths:
        for d in read_lines(path):
            if day and not str(d.get('timestamp', '')).startswith(day): continue
            t = when(d)
            if t:
                first = t if first is None or t < first else first
                last = t if last is None or t > last else last
            m = d.get('message') or {}
            content = m.get('content')
            if is_user_turn(d):
                cur = collections.Counter()
                turns.append(cur)
            if d.get('type') == 'user' and isinstance(content, list):
                for c in content:
                    if isinstance(c, dict) and c.get('type') == 'tool_result' and t:
                        results[c.get('tool_use_id')] = t
            if d.get('type') == 'assistant' and isinstance(content, list):
                mid = m.get('id') or d.get('uuid')
                mc = model_calls.setdefault(mid, {'kinds': set(), 'text': False, 'usage': m.get('usage') or {}})
                for c in content:
                    if not isinstance(c, dict):
                        continue
                    if c.get('type') == 'tool_use':
                        k = kind(c.get('name', ''), c.get('input'))
                        uses[c.get('id')] = (t, k, c.get('name'))
                        mc['kinds'].add(k)
                        if cur is not None:
                            cur[k] += 1
                    elif c.get('type') == 'text' and c.get('text', '').strip():
                        mc['text'] = True
    calls = collections.Counter(k for _, k, _ in uses.values())
    secs = collections.Counter()
    for i, (t, k, _) in uses.items():
        r = results.get(i)
        if t and r:
            secs[k] += (r - t).total_seconds()
    names = collections.Counter((k, n.replace('mcp__bsp__', 'bsp:')) for _, k, n in uses.values())
    by_class = collections.Counter()
    out_tok = collections.Counter()
    in_tok = collections.Counter()
    for mc in model_calls.values():
        ks = mc['kinds']
        cls = ('self-admin' if ks == {'admin'} else 'work' if ks == {'work'} else 'both' if ks
               else 'words to the person' if mc['text'] else 'thinking only')
        u = mc['usage']
        by_class[cls] += 1
        out_tok[cls] += u.get('output_tokens', 0)
        in_tok[cls] += u.get('input_tokens', 0) + u.get('cache_read_input_tokens', 0) + u.get('cache_creation_input_tokens', 0)
    return {
        'first': first, 'last': last, 'turns': turns, 'calls': calls, 'secs': secs, 'names': names,
        'by_class': by_class, 'out_tok': out_tok, 'in_tok': in_tok,
    }


# ── Finding transcripts ────────────────────────────────────────────────────

def project_dir():
    env = os.environ.get('CLAUDE_PROJECT_DIR') or os.getcwd()
    # the main checkout, not a worktree: Claude keys the project by the directory the session opened
    for cand in (env, os.path.dirname(env)):
        name = cand.replace('/', '-')
        p = os.path.expanduser(f'~/.claude/projects/{name}')
        if os.path.isdir(p):
            return p
    return os.path.expanduser(f'~/.claude/projects/{env.replace("/", "-")}')


def sessions(pdir):
    return sorted(glob.glob(os.path.join(pdir, '*.jsonl')), key=os.path.getmtime)


def transcripts_of(session_path):
    """The session's transcript and every sub-agent transcript beneath its directory."""
    sid = os.path.basename(session_path)[:-len('.jsonl')]
    sub = os.path.join(os.path.dirname(session_path), sid)
    return [session_path] + sorted(glob.glob(os.path.join(sub, '**', '*.jsonl'), recursive=True))


# ── Rendering ──────────────────────────────────────────────────────────────

def pct(part, whole):
    return f'{100 * part // whole:3d}%' if whole else '  -'


def render(label, r):
    calls, secs = r['calls'], r['secs']
    total = sum(calls.values())
    print(f'{label}')
    if r['first']:
        print(f'  from {r["first"]:%Y-%m-%d %H:%M} to {r["last"]:%Y-%m-%d %H:%M} UTC · {len(r["turns"])} user turns')
    print(f'  tool calls {total}: work {calls["work"]} · self-admin {calls["admin"]} ({pct(calls["admin"], total)})')
    print(f'  tool time  work {int(secs["work"])}s · self-admin {int(secs["admin"])}s')
    per = [(c['admin'], c['work']) for c in r['turns'] if sum(c.values())]
    heavier = sum(1 for a, w in per if a > w)
    if per:
        print(f'  per response (self-admin, work): {" ".join(f"{a}/{w}" for a, w in per[-12:])}'
              f'{" …" if len(per) > 12 else ""} · self-admin outnumbered the work in {heavier} of {len(per)}')
    out_total = sum(r['out_tok'].values())
    print('  model calls, with output tokens (thinking + writing) and input tokens (the window, re-sent each call):')
    for cls in ('work', 'self-admin', 'both', 'words to the person', 'thinking only'):
        if r['by_class'][cls]:
            print(f'    {cls:20s} {r["by_class"][cls]:4d} calls · out {r["out_tok"][cls]:8d} ({pct(r["out_tok"][cls], out_total)}) · in {r["in_tok"][cls] // 1000:8d}k')
    admin = [f'{n} ×{c}' for (k, n), c in r['names'].most_common() if k == 'admin'][:6]
    if admin:
        print(f'  self-admin, most often: {", ".join(admin)}')


def main(argv):
    pdir = project_dir()
    if '--day' in argv:
        day = argv[argv.index('--day') + 1]
        if day == 'yesterday': day = (datetime.datetime.now(datetime.timezone.utc) - datetime.timedelta(days=1)).strftime('%Y-%m-%d')
        files = glob.glob(os.path.expanduser('~/.claude/projects/*/*.jsonl')) + glob.glob(os.path.expanduser('~/.claude/projects/*/*/subagents/*.jsonl'))
        r = count(files, day=day)
        active = sum(1 for f in files if any(str(d.get('timestamp', '')).startswith(day) and d.get('type') == 'assistant' for d in read_lines(f)))
        render(f'{day} — {active} sessions active across every project on this Mac', r)
        return 0
    args = [a for a in argv if not a.startswith('--')]
    flags = {a for a in argv if a.startswith('--')}
    if '--all' in flags:
        for s in sessions(pdir):
            r = count(transcripts_of(s))
            total = sum(r['calls'].values())
            if total:
                print(f'{os.path.basename(s)[:8]}  {r["first"]:%m-%d} → {r["last"]:%m-%d}  calls {total:4d}  self-admin {pct(r["calls"]["admin"], total)}  out {sum(r["out_tok"].values()) // 1000:6d}k')
        return 0
    targets = []
    for a in args:
        if os.path.isfile(a):
            targets.append(a)
        else:
            hits = [s for s in sessions(pdir) if os.path.basename(s).startswith(a)]
            if not hits:
                print(f'no session of {pdir} starts with {a!r}', file=sys.stderr)
                return 1
            targets += hits
    if not targets:
        ss = sessions(pdir)
        if not ss:
            print(f'no sessions under {pdir}', file=sys.stderr)
            return 1
        targets = [ss[-1]]
    for s in targets:
        files = transcripts_of(s)
        r = count(files)
        extra = f' (+{len(files) - 1} sub-agent transcript{"s" if len(files) > 2 else ""})' if len(files) > 1 else ''
        render(f'{os.path.basename(s)}{extra}', r)
    return 0


if __name__ == '__main__':
    sys.exit(main(sys.argv[1:]))
