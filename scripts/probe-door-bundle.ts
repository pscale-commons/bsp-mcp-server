/** Read-only probe: the play door's own-context section for a live shell,
 *  rendered through the bundle path (no secret, perceive only). */
import { handlePlay } from '../src/tools/play.js';
const handle = process.argv[2] ?? 'weft';
const res = await handlePlay({ world: 'https://beach.happyseaurchin.com', handle, room: handle } as any, { sessionId: 'probe-door-bundle' });
const t = res.content.map((c: any) => c.text).join('\n');
const i = t.indexOf('═══════════ YOUR OWN CONTEXT');
console.log(t.slice(i, i + 6500));
console.log('\n…total', t.length, 'chars; sections:', [...t.matchAll(/^── (.+?) ──$/gm)].map((m) => m[1]).join(' | '));
