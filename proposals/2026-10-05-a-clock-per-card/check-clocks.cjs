// A clock per card — /next's DOING exercised in Chromium against a stubbed beach.
//
//   NODE_PATH=$(npm root -g) node check-clocks.cjs <happyseaurchin-home>/next.html [shots-dir] [--before]
//
// The page is served at its real origin (https://happyseaurchin.com) by routing, so
// localStorage behaves as it does live; every beach request is answered from an
// in-memory store, so nothing reaches the real beach. --before runs only the
// reproduction against the page as it stands today.
const { chromium } = require('playwright');
const path = require('path');

const PAGE = path.resolve(process.argv[2]);
const SITE = path.dirname(PAGE);
const SHOTS = process.argv[3] && !process.argv[3].startsWith('--') ? path.resolve(process.argv[3]) : null;
const BEFORE = process.argv.includes('--before');
const ORIGIN = 'https://happyseaurchin.com';
const TKEY = 'next-timer:ahead:happyseaurchin';

let failed = 0;
const t = (label, ok, got) => { if (!ok) failed++; console.log(`  ${ok ? '✓' : '✗'} ${label}` + (ok ? '' : `\n      got ${JSON.stringify(got)}`)); };
const sleep = ms => new Promise(r => setTimeout(r, ms));
async function until(fn, ms = 5000){ const end = Date.now() + ms; while (Date.now() < end){ try { if (await fn()) return true; } catch(e){} await sleep(50); } return false; }

/* ── the stub beach — one in-memory store, the wire's own write rules ── */
function seed(over){
  const floor10 = s => { let r = s; for (let i = 0; i < 10; i++) r = { _: r }; return r; };
  const store = {
    'ahead:happyseaurchin': {
      _: "AHEAD — happyseaurchin's piles of the indexical future.",
      '1': {
        _: 'within hours',
        '1': { _: 'hang the washing out', '2': 'now', '3': '2026-10-05T08:00Z', '4': 'held' },
        '2': { _: 'make soup for lunch', '2': 'now', '3': '2026-10-05T08:00Z', '4': 'held' },
        '3': { _: 'reply to Matthew about the walk', '2': 'now', '3': '2026-10-05T08:00Z' },
        '4': { _: 'review the onen-rpg table', '2': 'onen-rpg', '3': '2026-10-05T08:00Z', '4': 'held' },
      },
      '2': { _: 'tomorrow' },
    },
    'now:happyseaurchin': floor10('NOW — happyseaurchin, voiced on the clock.'),
    'onen-rpg:happyseaurchin': { _: 'MIRROR — happyseaurchin on onen-rpg.' },
  };
  if (over) over(store);
  return store;
}
function stepInto(node, ch){
  const k = ch === '0' ? '_' : ch;
  if (typeof node[k] === 'string') node[k] = { _: node[k] };
  else if (!node[k] || typeof node[k] !== 'object') node[k] = {};
  return node[k];
}
function setAt(block, addr, content){
  let n = block;
  const p = String(addr).split('');
  for (const ch of p.slice(0, -1)) n = stepInto(n, ch);
  const k = p[p.length - 1] === '0' ? '_' : p[p.length - 1];
  /* a string merges into an occupied node's underscore; an object replaces it */
  if (typeof content === 'string' && n[k] && typeof n[k] === 'object') n[k]._ = content;
  else n[k] = content;
}
const at = (block, addr) => String(addr).split('').reduce((n, ch) => n && n[ch === '0' ? '_' : ch], block);
function beach(store, log){
  return async route => {
    const req = route.request();
    const json = (status, body) => route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(body) });
    if (req.method() === 'GET'){
      const name = new URL(req.url()).searchParams.get('block');
      if (!name) return json(200, { _: 'stub beach', origin: 'stub', blocks: Object.keys(store) });
      return name in store ? json(200, store[name]) : json(404, { error: 'not_found' });
    }
    const b = JSON.parse(req.postData() || '{}');
    log.push(b);
    if (b.spindle == null && !b.append){ if (b.content !== undefined) store[b.block] = b.content; return json(200, { ok: true }); }
    if (!(b.block in store)) store[b.block] = {};
    if (b.append){
      let n = store[b.block];
      if (b.spindle) for (const ch of String(b.spindle)) n = stepInto(n, ch);
      let d = 1; while (d <= 9 && n[String(d)] !== undefined) d++;
      n[String(d)] = b.content;
      return json(200, { ok: true, spindle: (b.spindle || '') + d });
    }
    setAt(store[b.block], b.spindle, b.content);
    return json(200, { ok: true });
  };
}

/* ── a fresh browser context: page at its origin, beach stubbed, nothing else out ── */
async function open(browser, store, log, url, storage){
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, colorScheme: process.env.SCHEME || 'light' });
  await ctx.route('**/*', r => r.abort());
  await ctx.route(/fonts\.(googleapis|gstatic)\.com/, r => r.fulfill({ status: 200, contentType: 'text/css', body: '' }));
  await ctx.route(/^https:\/\/beach\.happyseaurchin\.com\//, beach(store, log));
  await ctx.route(/^https:\/\/happyseaurchin\.com\//, r => {
    const p = new URL(r.request().url()).pathname;
    if (p === '/theme.css') return r.fulfill({ path: path.join(SITE, 'theme.css'), contentType: 'text/css' });
    if (p === '/theme.js') return r.fulfill({ path: path.join(SITE, 'theme.js'), contentType: 'application/javascript' });
    if (/^\/next(\/|$)/.test(p)) return r.fulfill({ path: PAGE, contentType: 'text/html' });
    return r.fulfill({ status: 404, contentType: 'text/html', body: '<!doctype html><title>blank</title>' });
  });
  const page = await ctx.newPage();
  page.on('pageerror', e => { failed++; console.log('  ✗ page error: ' + e.message); });
  if (storage){
    await page.goto(ORIGIN + '/blank');
    await page.evaluate(s => { for (const k in s) localStorage.setItem(k, s[k]); }, storage);
  }
  await page.goto(ORIGIN + url);
  await page.waitForSelector('.cardface.top');
  return { ctx, page };
}
const top = page => page.$eval('.cardface.top .card__text', e => e.textContent);
const viewText = page => page.$eval('#dv-text', e => e.textContent);
const viewShown = page => page.$eval('#doing', e => !e.classList.contains('hidden'));
const clocks = page => page.evaluate(k => JSON.parse(localStorage.getItem(k) || 'null'), TKEY);
/* the row under the bar: null when hidden, else each clock's text, in order */
const row = page => page.$eval('#clockrow', e => e.classList.contains('hidden') ? null : [...e.querySelectorAll('button')].map(b => b.textContent));
const rowSays = async (page, res) => { const r = await row(page); return !!r && r.length === res.length && res.every((re, i) => re.test(r[i])); };
async function flick(page){
  const before = await top(page);
  await page.click('#btn-next');
  await page.waitForFunction(b => { const e = document.querySelector('.cardface.top .card__text'); return e && e.textContent !== b; }, before);
}
async function flickTo(page, text){ for (let i = 0; i < 6 && (await top(page)) !== text; i++) await flick(page); }
async function shot(page, name){ if (SHOTS) await page.screenshot({ path: path.join(SHOTS, name) }); }

(async () => {
  const browser = await chromium.launch();

  if (BEFORE){
    console.log('\nBEFORE — the page as it stands: a second DOING');
    const store = seed(), log = [];
    const { ctx, page } = await open(browser, store, log, '/next/happyseaurchin?aim=now');
    await page.click('#btn-donow');
    await page.click('#do-back');
    await flick(page);
    const second = await top(page);
    await page.click('#btn-donow');
    await sleep(200);
    const toast = await page.$eval('.toast', e => e.textContent).catch(() => '');
    t('pressing DOING on "' + second + '" opens the FIRST card\'s clock instead', (await viewText(page)) === 'hang the washing out', await viewText(page));
    t('and says so: "' + toast + '"', /already holding one/.test(toast), toast);
    await shot(page, '0-before.png');
    await ctx.close(); await browser.close();
    process.exit(failed ? 1 : 0);
  }

  {
    console.log('\nA. two cards on their own clocks at once (?aim=now)');
    const store = seed(), log = [];
    const { ctx, page } = await open(browser, store, log, '/next/happyseaurchin?aim=now');
    const hand = () => store['ahead:happyseaurchin'];
    t('the flick opens on the first card', (await top(page)) === 'hang the washing out', await top(page));
    await page.click('#btn-donow');
    t('DOING opens that card\'s clock', (await viewShown(page)) && (await viewText(page)) === 'hang the washing out', await viewText(page));
    t('the beach takes the claim at the card itself (4 = doing)', await until(() => at(hand(), '11')['4'] === 'doing'), at(hand(), '11'));
    await page.click('#do-back');
    t('back on the deck, the card is lit and carries its clock',
      await page.$eval('.cardface.top', e => e.classList.contains('on') && /doing now · \d+:\d\d/.test(e.querySelector('[data-clock]').textContent)));
    t('the button says it goes back to that clock', (await page.textContent('#btn-donow')) === '▶ back to it', await page.textContent('#btn-donow'));
    await flick(page);
    t('flicked on, the next card is not lit and offers a new clock',
      (await top(page)) === 'make soup for lunch' && !(await page.$eval('.cardface.top', e => e.classList.contains('on'))) && (await page.textContent('#btn-donow')) === '▶ do now');
    t('a row under the bar names the card on its clock, with its time', await rowSays(page, [/▶\d+:\d\dhang the washing out/]), await row(page));
    await page.click('#btn-donow');
    t('DOING on the second card opens ITS clock — not the first', (await viewText(page)) === 'make soup for lunch', await viewText(page));
    t('the first card is listed beneath, still running',
      await page.$eval('#dv-also', e => !e.classList.contains('hidden') && /hang the washing out/.test(e.textContent) && /\d+:\d\d/.test(e.textContent)));
    t('the row names both cards, each with its own time', await rowSays(page, [/▶\d+:\d\dhang the washing out/, /▶\d+:\d\dmake soup for lunch/]), await row(page));
    t('the beach takes the second claim too', await until(() => at(hand(), '12')['4'] === 'doing'), at(hand(), '12'));
    await sleep(1600);
    await shot(page, '2-the-doing-view.png');
    await page.click('#do-back');
    await shot(page, '1-the-deck.png');
    await page.click('#clockrow button:has-text("make soup")');
    t('the row opens that card\'s clock', (await viewText(page)) === 'make soup for lunch', await viewText(page));
    await page.click('#dv-also button');
    t('one tap on the strip goes to the other card\'s clock', (await viewText(page)) === 'hang the washing out', await viewText(page));
    await page.click('#do-pause');
    const c1 = await clocks(page);
    t('pausing it pauses that card alone', c1['11'].paused === true && c1['12'].paused === false, c1);
    t('the view says paused', (await page.textContent('#do-pause')) === '▶ resume' && /paused/.test(await page.textContent('#dv-state')));
    await page.click('#dv-also button');
    t('and back to the soup, still running', (await viewText(page)) === 'make soup for lunch' && (await page.textContent('#do-pause')) === 'pause');
    await page.click('#do-finish');
    t('finish opens the sheet for the card in front', /^Finish — /.test(await page.textContent('#sheet-title')) && /make soup/.test(await page.textContent('#sheet-what')), await page.textContent('#sheet-title'));
    await page.click('#sheet-go');
    const landed = () => { const beat = at(store['now:happyseaurchin'], log.find(b => b.block === 'now:happyseaurchin')?.spindle?.slice(0, -1) || 'x'); return beat && Object.values(beat).find(n => n && n._ === 'made soup for lunch'); };
    t('the done card lands in the now at this beat, its elapsed at 6', await until(() => { const n = landed(); return n && n['4'] === 'done' && n['6']; }), landed());
    t('its pile slot is given back', await until(() => at(hand(), '12')._ === ''), at(hand(), '12'));
    t('its clock is gone; the other card\'s stays, paused', await until(async () => { const c = await clocks(page); return c && !c['12'] && c['11'] && c['11'].paused; }), await clocks(page));
    t('the row shows the one clock left, paused', await rowSays(page, [/⏸\d+:\d\dhang the washing out/]), await row(page));
    await page.reload(); await page.waitForSelector('.cardface.top');
    t('a reload keeps the clock, paused', await rowSays(page, [/⏸\d+:\d\dhang the washing out/]), await row(page));
    t('and the card wears it', await page.$eval('.cardface.top', e => e.classList.contains('on') && /paused · \d+:\d\d/.test(e.textContent)));
    await ctx.close();
  }

  {
    console.log('\nB. dropping a card on its clock lets the clock go');
    const store = seed(), log = [];
    const { ctx, page } = await open(browser, store, log, '/next/happyseaurchin?aim=now');
    await flickTo(page, 'reply to Matthew about the walk');
    await page.click('#btn-donow'); await page.click('#do-back');
    await page.click('.cardface.top .cog');
    await page.click('.menu [data-act="drop"]');
    t('the drop lands after the undo window (4 = drop)', await until(() => at(store['ahead:happyseaurchin'], '13')['4'] === 'drop', 7000), at(store['ahead:happyseaurchin'], '13'));
    t('and the clock goes with it', await until(async () => (await clocks(page)) === null && (await row(page)) === null), await clocks(page));
    await ctx.close();
  }

  {
    console.log('\nC. throwing a card on its clock into tomorrow stops the clock');
    const store = seed(), log = [];
    const { ctx, page } = await open(browser, store, log, '/next/happyseaurchin?aim=now');
    await page.click('#btn-donow'); await page.click('#do-back');
    await until(() => at(store['ahead:happyseaurchin'], '11')['4'] === 'doing');
    const box = await page.$eval('.cardface.top', e => { const r = e.getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2 }; });
    await page.mouse.move(box.x, box.y); await page.mouse.down();
    await page.mouse.move(box.x, box.y - 80, { steps: 6 }); await page.mouse.move(box.x, box.y - 240, { steps: 8 });
    await page.mouse.up();
    const moved = () => at(store['ahead:happyseaurchin'], '21');
    t('the card lands in tomorrow as held — in the hand, no longer being done', await until(() => moved() && moved()._ === 'hang the washing out' && moved()['4'] === 'held', 7000), moved());
    t('its old slot is cleared', await until(() => at(store['ahead:happyseaurchin'], '11')._ === ''), at(store['ahead:happyseaurchin'], '11'));
    t('and its clock has stopped', await until(async () => (await clocks(page)) === null), await clocks(page));
    await ctx.close();
  }

  {
    console.log('\nD. a clock on a card the flick is not showing still finishes where the card aims');
    const store = seed(), log = [];
    const { ctx, page } = await open(browser, store, log, '/next/happyseaurchin');
    await flickTo(page, 'review the onen-rpg table');
    await page.click('#btn-donow');
    await until(() => at(store['ahead:happyseaurchin'], '14')['4'] === 'doing');
    await page.goto(ORIGIN + '/next/happyseaurchin?aim=now'); await page.waitForSelector('.cardface.top');
    t('under ?aim=now the onen-rpg card is not in the flick, but its clock stands in the row', await rowSays(page, [/▶\d+:\d\dreview the onen-rpg table/]), await row(page));
    await page.click('#clockrow button');
    t('the row opens that card\'s clock', (await viewText(page)) === 'review the onen-rpg table', await viewText(page));
    await page.click('#do-finish'); await page.click('#sheet-go');
    const rec = () => Object.values(store['onen-rpg:happyseaurchin']).find(n => n && typeof n === 'object' && n._ === 'reviewed the onen-rpg table');
    t('finished, it lands in onen-rpg (field 2 kept), with its elapsed', await until(() => rec() && rec()['2'] === 'onen-rpg' && rec()['6']), rec());
    await ctx.close();
  }

  {
    console.log('\nE. the single clock kept before this change survives it');
    const store = seed(), log = [];
    const old = { addr: '13', text: 'reply to Matthew about the walk', stemNo: 0, cardNo: 13, started: Date.now() - 65000, acc: 0, paused: false };
    const { ctx, page } = await open(browser, store, log, '/next/happyseaurchin?aim=now', { [TKEY]: JSON.stringify(old) });
    t('the row shows it, a minute in', await rowSays(page, [/▶1:0\dreply to Matthew about the walk/]), await row(page));
    await flickTo(page, 'reply to Matthew about the walk');
    t('its card wears it and offers to go back to it', await page.$eval('.cardface.top', e => e.classList.contains('on')) && (await page.textContent('#btn-donow')) === '▶ back to it');
    await page.click('#btn-donow');
    t('which opens it, counting from where it was', (await viewText(page)) === 'reply to Matthew about the walk' && /^1:0\d$/.test(await page.textContent('#dv-clock')), await page.textContent('#dv-clock'));
    await ctx.close();
  }

  {
    console.log('\nF. a clock whose card was closed elsewhere is let go; a claim with no clock here says since when');
    const store = seed(s => {
      Object.assign(s['ahead:happyseaurchin']['1']['1'], { '4': 'done', '3': '2026-10-05T09:00Z' });
      Object.assign(s['ahead:happyseaurchin']['1']['2'], { '4': 'doing', '3': new Date(Date.now() - 20 * 60000).toISOString().slice(0, 16) + 'Z' });
    }), log = [];
    const stale = { '11': { addr: '11', text: 'hang the washing out', started: Date.now() - 900000, acc: 0, paused: false } };
    const { ctx, page } = await open(browser, store, log, '/next/happyseaurchin?aim=now', { [TKEY]: JSON.stringify(stale) });
    t('the closed card\'s clock is gone from the row and this device', (await row(page)) === null && (await clocks(page)) === null, await clocks(page));
    await flickTo(page, 'make soup for lunch');
    t('the card being done elsewhere is lit and says since when',
      await page.$eval('.cardface.top', e => e.classList.contains('on') && /doing now · since \d\d:\d\d/.test(e.textContent)), await page.$eval('.cardface.top .card__badge', e => e.textContent).catch(() => null));
    await ctx.close();
  }

  {
    console.log('\nG. done already on a card that is running carries its clock');
    const store = seed(), log = [];
    const { ctx, page } = await open(browser, store, log, '/next/happyseaurchin?aim=now');
    await page.click('#btn-donow'); await page.click('#do-back');
    await sleep(1200);
    await page.click('.cardface.top .cog');
    await page.click('.menu [data-act="already"]');
    await page.click('#sheet-go');
    const beat = () => { const b = log.find(x => x.block === 'now:happyseaurchin'); return b && b.content; };
    t('it lands in the now with the elapsed at 6', await until(() => beat() && beat()._ === 'hung the washing out' && beat()['6']), beat());
    t('and its clock is gone', await until(async () => (await clocks(page)) === null && (await row(page)) === null), await clocks(page));
    await ctx.close();
  }

  {
    console.log('\nH. two tabs of the flick keep one set of clocks');
    const store = seed(), log = [];
    const { ctx, page } = await open(browser, store, log, '/next/happyseaurchin?aim=now');
    const other = await ctx.newPage();
    other.on('pageerror', e => { failed++; console.log('  ✗ page error (second tab): ' + e.message); });
    await other.goto(ORIGIN + '/next/happyseaurchin'); await other.waitForSelector('.cardface.top');
    await page.click('#btn-donow'); await page.click('#do-back');
    t('a clock started in one tab stands in the other', await until(async () => await rowSays(other, [/▶\d+:\d\dhang the washing out/])), await row(other));
    await flickTo(other, 'make soup for lunch');
    await other.click('#btn-donow');
    t('one started in the other is taken up by the first', await until(async () => await rowSays(page, [/hang the washing out/, /make soup for lunch/])), await row(page));
    const both = await clocks(page);
    t('and neither tab wrote over the other', both && both['11'] && both['12'], both);
    await ctx.close();
  }

  {
    console.log('\nI. a damaged clock store does not take the page down');
    const store = seed(), log = [];
    const bad = { '11': null, '12': { addr: '12', text: 'make soup for lunch', started: Date.now() - 5000, acc: 0, paused: false }, '13': 'x' };
    const { ctx, page } = await open(browser, store, log, '/next/happyseaurchin?aim=now', { [TKEY]: JSON.stringify(bad) });
    await sleep(1200);
    t('the good clock stands, the damaged ones are passed over', await rowSays(page, [/▶0:0\dmake soup for lunch/]), await row(page));
    await ctx.close();
  }

  await browser.close();
  console.log(failed ? `\n${failed} FAILED` : '\nall passed');
  process.exit(failed ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
