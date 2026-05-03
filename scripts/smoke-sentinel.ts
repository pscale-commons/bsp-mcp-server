import { loadBlock, isSentinelOwner, saveBlock, updatePositionHashes } from '../src/db.js';

(async () => {
  console.log('--- isSentinelOwner ---');
  console.log('pscale:', isSentinelOwner('pscale'));
  console.log('weft:', isSentinelOwner('weft'));
  console.log('sed:commons:', isSentinelOwner('sed:commons'));

  console.log('\n--- loadBlock(pscale, whetstone) ---');
  const w = await loadBlock('pscale', 'whetstone');
  console.log('found:', !!w, 'block_type:', w?.block_type);
  console.log('underscore:', String(w?.block?._).slice(0, 120), '...');

  console.log('\n--- loadBlock(pscale, sunstone) ---');
  const s = await loadBlock('pscale', 'sunstone');
  console.log('found:', !!s, 'block_type:', s?.block_type);
  console.log('underscore:', String(s?.block?._).slice(0, 120), '...');

  for (const name of ['agent-id', 'evolution', 'manifest', 'progression', 'block-conventions']) {
    console.log(`\n--- loadBlock(pscale, ${name}) ---`);
    const r = await loadBlock('pscale', name);
    console.log('found:', !!r, 'block_type:', r?.block_type);
    const u = r?.block?._;
    const us = typeof u === 'string' ? u : (u && typeof u === 'object' ? String((u as any)._) : '');
    console.log('underscore:', us.slice(0, 120), '...');
  }

  console.log('\n--- loadBlock(pscale, nonexistent) ---');
  const n = await loadBlock('pscale', 'nonexistent');
  console.log('found:', !!n);

  console.log('\n--- saveBlock(pscale, whetstone) — should reject ---');
  try {
    await saveBlock('pscale', 'whetstone', { _: 'attack' });
    console.log('UNEXPECTED: save accepted');
  } catch (e) {
    console.log('rejected:', (e as Error).message);
  }

  console.log('\n--- updatePositionHashes(pscale, whetstone) — should reject ---');
  try {
    await updatePositionHashes('pscale', 'whetstone', { _: 'x' });
    console.log('UNEXPECTED: lock accepted');
  } catch (e) {
    console.log('rejected:', (e as Error).message);
  }
})();
