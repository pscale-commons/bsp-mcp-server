// Bake a shore snapshot: everything site/shore/index.html draws, fetched from
// a federated beach's public surface and emitted as one JSON document on
// stdout. Read-only; no dependencies; node 18+.
//
//   node scripts/shore-snapshot.mjs [beach-origin] > snapshot.json
//
// Default origin is the commons reference beach. The output is the
// window.SHORE_SNAPSHOT shape the page understands — inject it before the
// page's main script to bake a self-contained copy (claude.ai artifacts
// cannot fetch, so an agent embeds this and publishes the page as-is
// otherwise). The page and this script share the data contract: index,
// marks, lighthouse, presence.
const ORIGIN = (process.argv[2] || 'https://beach.happyseaurchin.com').replace(/\/+$/, '');

const get = async (params) => {
  const r = await fetch(`${ORIGIN}/.well-known/pscale-beach${params}`, {
    headers: { accept: 'application/json' },
  });
  if (!r.ok) throw new Error(`beach ${r.status} on ${params || '(index)'}`);
  return r.json();
};

const index = await get('');
if (!Array.isArray(index.blocks)) throw new Error('not a beach index');
const grab = async (name) => {
  if (!index.blocks.includes(name)) return null;
  try { return await get(`?block=${encodeURIComponent(name)}`); } catch { return null; }
};
const [marks, lighthouse, presence] = await Promise.all([
  grab('marks'), grab('lighthouse'), grab('presence'),
]);

console.log(JSON.stringify({
  generated_at: Date.now(),
  origin: ORIGIN,
  index, marks, lighthouse, presence,
}));
console.error(`shore snapshot: ${index.blocks.length} blocks at ${ORIGIN}`);
