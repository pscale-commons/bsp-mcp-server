#!/usr/bin/env python3
"""The walk's wording probe: what head lets Opus 5.5 and Sonnet 5.5 walk the run-up?

On 5 November 2026 the walk's window — the block's root, the route so far, the rung and its options,
"Reply as asked." — was refused on Opus 5.5 and Sonnet 5.5 at nearly every rung (reasoning_extraction
with a note and a hinge asked; cyber with the choice alone), while the cells' loop windows, which carry
the frame (the rules of the table) and the live talk, were never refused. So the variable is the head:
the walk window stands alone, with no word of what it is for. Three heads, one call each at rung 1 on
Opus and Sonnet at low effort, then a whole walk for every head that passes:

  bare   "Reply as asked."                                         (as merged in #606)
  line   one sentence naming the game, then "Reply as asked."
  frame  the rules of the table (frame.py, the loop's own head), then "Reply as asked."

  .venv/bin/python walk-probe.py [--stop-usd 1] [--tiers opus,sonnet] [--effort low]
"""
import argparse, asyncio, json, os, time

import door, frame, injector

HERE = os.path.dirname(os.path.abspath(__file__))

LINE = ("This is the run-up of a table game played among people talking: before it listens, each cell "
        "chooses, rung by rung, how it will hold what it hears, and holds the ways it did not take. "
        "Reply as asked.")


def heads(settings):
    f = frame.frame_text(settings["beach"], settings["shell"], settings.get("line_words"))
    return {
        "bare": [{"type": "text", "text": "Reply as asked."}],
        "line": [{"type": "text", "text": LINE}],
        "frame": [{"type": "text", "text": f, "cache_control": {"type": "ephemeral"}}, {"type": "text", "text": "Reply as asked."}],
    }


async def rung1(head, tier, effort, block, spend, log, max_tokens):
    root = str(block.get("_", ""))
    addr, node = next(injector.rungs(block))
    window, opts = injector.render(root, [], addr, node)
    r = await door.call(tier, effort, head, window, max_tokens, spend, "walk", log, meta={"probe": "rung1", "cell": f"probe-{tier}"})
    obj, flag = injector.parse_json(r["reply"]) if r["reply"] else (None, r["error"] or "empty")
    k = injector.pick(obj, opts) if obj else None
    cat = (r.get("stop_details") or {}).get("category")
    return dict(stop=r["stop"], category=cat, choice=(opts[k][0] if k is not None else None), usd=r["usd"], ms=r["ms"])


async def whole(head, tier, effort, block, source, spend, log, settings):
    injector.SYSTEM = head
    sp = await injector.walk(f"probe-{tier}", tier, effort, block, source, door.call, spend, log, settings)
    refused = [r for r in sp["rungs"] if r.get("stop") == "refusal"]
    return dict(rungs=len(sp["rungs"]), route=" ".join(r["addr"] for r in sp["rungs"]), refused=len(refused), usd=sp["usd"], ms=sp["ms"])


async def main(a):
    settings = json.load(open(os.path.join(HERE, "settings.json")))
    settings["injector"]["source"] = "beach"
    block, source = injector.load_block(settings)
    out_dir = os.path.join(HERE, "runs", f"walk-probe-{time.strftime('%Y%m%d-%H%M%S')}")
    os.makedirs(out_dir, exist_ok=True)
    log = os.path.join(out_dir, "calls.jsonl")
    spend = door.Spend(a.stop_usd)
    tiers = a.tiers.split(",")
    H = heads(settings)
    results = {"rung1": {}, "whole": {}}
    print(f"block {source}; heads {', '.join(H)}; tiers {', '.join(tiers)} at {a.effort}\n")
    print("RUNG 1, one call each")
    for name, head in H.items():
        rs = await asyncio.gather(*[rung1(head, t, a.effort, block, spend, log, int(settings["max_tokens"])) for t in tiers])
        results["rung1"][name] = dict(zip(tiers, rs))
        for t, r in zip(tiers, rs):
            print(f"  {name:6} {t:7} {r['stop']:10} {r['category'] or '-':22} choice {r['choice'] or '-':8} ${r['usd']:.4f} {r['ms']/1000:.1f}s")
    print("\nWHOLE WALKS, for every head that passed rung 1 on both tiers")
    for name, head in H.items():
        if all(results["rung1"][name][t]["choice"] for t in tiers):
            rs = await asyncio.gather(*[whole(head, t, a.effort, block, source, spend, log, settings) for t in tiers])
            results["whole"][name] = dict(zip(tiers, rs))
            for t, r in zip(tiers, rs):
                print(f"  {name:6} {t:7} rungs {r['rungs']} refused {r['refused']}  {r['route']}  ${r['usd']:.4f} {r['ms']/1000:.0f}s")
        else:
            print(f"  {name:6} skipped (rung 1 refused)")
    results["spend"] = dict(usd=round(spend.total, 4), calls=spend.calls)
    with open(os.path.join(out_dir, "results.json"), "w") as f:
        json.dump(results, f, indent=1)
    print(f"\nspent ${spend.total:.4f} in {spend.calls['walk']} calls; results in {os.path.relpath(out_dir, HERE)}")


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--stop-usd", type=float, default=1.0)
    ap.add_argument("--tiers", default="opus,sonnet")
    ap.add_argument("--effort", default="low")
    asyncio.run(main(ap.parse_args()))
