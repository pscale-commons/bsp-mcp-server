#!/usr/bin/env python3
"""review — the operating system checks itself once a day, with no mind in it.

    npm run review            # yesterday's numbers, recorded beneath the day's entry in daily:weft
    npm run review -- --dry   # the same line, printed only

Every morning from this Mac (launchd, 08:00 local): one line of numbers for
yesterday — the sessions active here, their tool calls split work and
self-admin, the tokens, the boots and what they reached for after the door —
grafted beneath the latest entry in daily:weft, where the weekly review reads
it. On Sundays it also re-dials the manifest from the measure (redial.py) and
says what changed. Reads only the transcripts on this Mac; a lane that ran in
the cloud is not seen here.

David, 2026-10-06: 'there should be a simple review process which is checking
the different levels' operationality'. These are the numbers; the reading of
them is the Monday wake's.
"""
import datetime, glob, importlib.util, json, os, sys, urllib.request

HERE = os.path.dirname(os.path.abspath(__file__))
def load(name):
    spec = importlib.util.spec_from_file_location(name, os.path.join(HERE, name + '.py'))
    mod = importlib.util.module_from_spec(spec); spec.loader.exec_module(mod); return mod

count_calls = load('count-calls')
redial = load('redial')
WELL = 'https://beach.happyseaurchin.com/.well-known/pscale-beach'
DAILY = 'daily:weft'

def latest_entry(block, floor=3):
    """The address of the newest entry at the block's floor: the greatest digit path, walked greatest-first."""
    node, addr = block, ''
    for _ in range(floor):
        if not isinstance(node, dict): return None
        digits = sorted((k for k in node if k.isdigit() and k != '0'), reverse=True)
        if not digits: return addr or None
        addr += digits[0]; node = node[digits[0]]
    return addr

def record(line):
    try:
        with urllib.request.urlopen(f'{WELL}?block={DAILY}&_t={os.getpid()}', timeout=30) as r: block = json.load(r)
        at = latest_entry(block)
    except Exception as e:
        print('could not read the day:', e); at = None
    body = {'block': DAILY, 'append': True, 'content': line}
    if at: body['spindle'] = at
    req = urllib.request.Request(WELL, data=json.dumps(body).encode(), headers={'Content-Type': 'application/json'}, method='POST')
    with urllib.request.urlopen(req, timeout=30) as r: return json.load(r)

def main(argv):
    today = datetime.datetime.now(datetime.timezone.utc)
    day = (today - datetime.timedelta(days=1)).strftime('%Y-%m-%d')
    files = glob.glob(os.path.expanduser('~/.claude/projects/*/*.jsonl')) + glob.glob(os.path.expanduser('~/.claude/projects/*/*/subagents/*.jsonl'))
    r = count_calls.count(files, day=day)
    active = sum(1 for f in files if any(str(d.get('timestamp', '')).startswith(day) and d.get('type') == 'assistant' for d in count_calls.read_lines(f)))
    calls = r['calls']; total = sum(calls.values())
    boots = [v for f in files if (v := redial.after_boot(f)) and v['at'].startswith(day)]
    reach = sum(len(b['reads']) for b in boots) / len(boots) if boots else 0
    out_tok = sum(r['out_tok'].values())
    line = (f"MACHINE REVIEW of {day} (UTC), from this Mac's transcripts — {active} sessions active; "
            f"{total} tool calls, {calls['work']} work and {calls['admin']} self-admin ({100 * calls['admin'] // total if total else 0}%); "
            f"{out_tok // 1000}k output tokens; {len(boots)} boots as weft, {reach:.1f} organ reads after the door each")
    if datetime.date.today().weekday() == 6 or '--redial' in argv:
        try: line += '. SUNDAY RE-DIAL: ' + redial.run(['--write'])
        except Exception as e: line += f'. SUNDAY RE-DIAL failed: {e}'
    line += '. (scripts/review.py; the reading of these is the weekly wake\'s.)'
    print(line)
    if '--dry' in argv: return 0
    print('recorded:', record(line))
    return 0

if __name__ == '__main__': sys.exit(main(sys.argv[1:]))
