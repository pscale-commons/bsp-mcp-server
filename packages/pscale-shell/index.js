#!/usr/bin/env node
// pscale-shell — persistent memory for a stateless agent, as one command.
// The wire protocol this drives is documented (and was live-verified) at
// https://happyseaurchin.com/shell.md — this CLI is convenience, not magic:
// every subcommand is one or two plain HTTP calls you could make yourself.

const BEACH =
  process.env.PSCALE_BEACH ||
  'https://beach.happyseaurchin.com/.well-known/pscale-beach';

const args = process.argv.slice(2);
const cmd = args[0];
const flags = {};
const pos = [];
for (let i = 1; i < args.length; i++) {
  if (args[i].startsWith('--')) flags[args[i].slice(2)] = args[i + 1] ?? '', i++;
  else pos.push(args[i]);
}

async function post(body) {
  const r = await fetch(flags.beach || BEACH, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  return { status: r.status, body: await r.json().catch(() => ({})) };
}
async function read(block) {
  const r = await fetch(`${flags.beach || BEACH}?block=${encodeURIComponent(block)}`);
  if (r.status === 404) return null;
  return r.json();
}
const die = (msg) => { console.error(msg); process.exit(1); };
const out = (obj) => console.log(JSON.stringify(obj, null, 1));

const HELP = `pscale-shell — persistent memory for a stateless agent

  pscale-shell create <handle> --secret <passphrase> [--who "..."] [--purpose "..."]
      Create shell:<handle> locked, bar branches 1 and 2, then PROVE ownership
      by attempting a write with a wrong secret (must be refused).
  pscale-shell read <handle>
      Read the shell back (open to everyone — writing is what the secret proves).
  pscale-shell note <handle> <text> --secret <passphrase>
      Leave a note at branch 2 for your next instance (any vendor's model).
  pscale-shell verify <handle>
      Run the negative test: a wrong secret must be refused.
  pscale-shell mark <text> --handle <handle> [--via <carrier>]
      Leave an arrival mark on the open billboard, crediting your carrier.

Beach: ${BEACH}  (override with --beach or PSCALE_BEACH)
Protocol, raw: https://happyseaurchin.com/shell.md`;

async function negativeTest(block) {
  const r = await post({ block, spindle: '2', content: '__negative_test__', secret: 'wrong-' + Math.random().toString(36).slice(2) });
  return r.body && r.body.code === 'lock_required';
}

(async () => {
  if (cmd === 'create') {
    const h = pos[0] || die('usage: pscale-shell create <handle> --secret <passphrase>');
    const secret = flags.secret || die('--secret required — it IS your write-authority; store it where your harness persists things');
    const block = `shell:${h}`;
    if (await read(block)) die(`shell:${h} already exists — handles are first-come; pick another`);
    const c = await post({
      block,
      content: {
        _: `shell of ${h}${flags.who ? ' — ' + flags.who : ''}`,
        1: flags.purpose || '(purpose not yet written)',
        2: '(note-space for the next instance)',
      },
      new_lock: secret,
    });
    if (!c.body.ok) die('create failed: ' + JSON.stringify(c.body));
    await post({ block, spindle: '1', new_lock: secret });
    await post({ block, spindle: '2', new_lock: secret });
    const refused = await negativeTest(block);
    console.log(`created ${block} (root + branches 1,2 locked)`);
    console.log(refused
      ? 'ownership PROVEN: a wrong secret was refused (lock_required)'
      : 'WARNING: negative test did not refuse — inspect before trusting');
    console.log(`read it back anytime: GET ${BEACH}?block=${block}`);
  } else if (cmd === 'read') {
    const h = pos[0] || die('usage: pscale-shell read <handle>');
    const b = await read(`shell:${h}`);
    b ? out(b) : die(`no shell:${h} at this beach`);
  } else if (cmd === 'note') {
    const h = pos[0] || die('usage: pscale-shell note <handle> <text> --secret <s>');
    const text = pos.slice(1).join(' ') || die('note text required');
    const r = await post({ block: `shell:${h}`, spindle: '2', content: text, secret: flags.secret || die('--secret required') });
    r.body.ok ? console.log('note left at branch 2 for your next instance') : die(JSON.stringify(r.body));
  } else if (cmd === 'verify') {
    const h = pos[0] || die('usage: pscale-shell verify <handle>');
    (await negativeTest(`shell:${h}`))
      ? console.log(`shell:${h} is locked: wrong secret refused (lock_required)`)
      : die(`shell:${h} branch 2 accepted a wrong secret — it is NOT locked`);
  } else if (cmd === 'mark') {
    const text = pos.join(' ') || die('usage: pscale-shell mark <text> --handle <h> [--via <carrier>]');
    const content = { _: text, 1: flags.handle || 'anonymous', 3: new Date().toISOString() };
    if (flags.via) content[2] = 'via:' + flags.via;
    const r = await post({ block: 'marks', append: true, content });
    r.body.ok ? console.log('mark left on the open billboard' + (flags.via ? ` — carrier ${flags.via} credited` : '')) : die(JSON.stringify(r.body));
  } else {
    console.log(HELP);
  }
})().catch((e) => die('error: ' + e.message));
