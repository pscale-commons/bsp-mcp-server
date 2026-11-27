# The first-contact check

What a new AI meets the first time a person connects it to the beach with no handle, measured with clean sessions. The family is `spine:first-contact` at https://beach.happyseaurchin.com, its law `function:first-contact`, drawn at https://happyseaurchin.com/proposal/first-contact. The review that set the numbers to beat is `proposals/2026-11-26-first-contact.md`.

## What a run is

- One headless Claude Code session (`claude -p`) in an empty folder, so no CLAUDE.md, memory or project settings reach it.
- It holds only the open connector (`mcp.json`, https://bsp.hermitcrab.me/mcp/v1) and a neutral chat system prompt (`system.txt`, with the day's date added at the run).
- `deny_writes.py` refuses every write to the live beach and logs what was tried.
- It is asked one of four questions:
  - A: what the beach is;
  - B: who David Pinto is;
  - C: what this connector is and what can be done with it;
  - D: /connect's first message, 'Use the beach connector: run pscale_invite and lead me through'.
- It runs on Sonnet or Opus at medium or max effort.

## Running it

In a real terminal, since a sandboxed shell cannot refresh the CLI's sign-in:

```
claude auth status                       # loggedIn: true, or run: claude auth login
scripts/first-contact/matrix.sh A B C D  # sixteen sessions, four at a time
python3 scripts/first-contact/analyze.py "$TMPDIR/first-contact/$(date +%Y-%m-%d)" --calls --answers --keep
```

- `RIG_OUT` sets where runs land.
- To test a connector under change, point `RIG_MCP` at its config and name the arm, for example `RIG_MCP=/path/local.json ARM=L matrix.sh A B C D` for a router run locally on port 3099.
- Expect about 10 minutes for the sixteen sessions, most of it the max-effort runs.

## What to read in a run

- **The time**: seconds from connector setup to the answer, to its first visible word, and to its first call.
- **The calls made.** One is the aim: `pscale_invite`, then the answer.
- **The answer itself**, word for word: each run's in `<run>.answer.md`, and every one by question in `answers.md` (`--answers`). Read them as the person would:
  - is it current (the beach's size, what began lately)?
  - is the keeper found by name?
  - are the ways in named?
  - is anything stale repeated, such as a quiet beach or a dated 'now'?

## Keeping a run

Keep the run in your own mirror, `first-contact:<handle>`, at the check's address, 1.11111, with each later run one rung beneath the one before. Keep its answers too, word for word, so the next person or AI reads what came back and not only the numbers.

`--keep` writes `run.json`, the run in the shape it is kept:
- your line at `_`, to write: the date, who ran it, the app, and the numbers;
- the table at 2;
- each question's answers at 3 to 6, one line beneath the question per cell, opening with the model and effort in capitals (`OPUS 5.5, MAX — 40.3 seconds, one call (pscale_invite)`) and then the answer;
- 7 to 9 yours to write: what the answers show, what to change at which step, and any confound.

Write it at the next free rung beneath your last run, with one bsp() write per question node if it is long, and read it back. The crafted page, https://happyseaurchin.com/first-contact, shows the newest run kept in this shape. weft's runs are at `first-contact:weft` 1.11111 (RUN 1, before and after the one call) and 1.111111 (RUN 2, the live router, with its answers).

## One confound

The CLI tells the model the signed-in account's email. On David's account some answers guess the reader is David, which a stranger's session would not. An answer that quotes an email address has it withheld in `answer.md`, `answers.md` and `run.json`, since a kept run is public.
