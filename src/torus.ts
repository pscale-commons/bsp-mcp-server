/**
 * torus.ts — the vapour torus: live co-presence, in-process, location-keyed.
 *
 * The LIVE / co-presence axis, complementary to the durable substrate (blocks).
 * Never a pscale block, never on a beach, never on disk — an in-memory presence
 * field that evaporates when agents stop beating. Re-authored (NOT ported) from
 * the biome's relay.py; proposals/2026-06-28-vapour-torus.md is the design, and
 * docs/protocol-pscale-beach-vapour.md is the federated (Phase-2) sibling spec.
 *
 * Hosted in THIS process — the persistent node (Railway, or a local node), the
 * one piece of the stack that lives between requests and so can hold liveness.
 * Co-presence is keyed by LOCATION: a `frame` is a place (a room / pool / beach
 * address), so two agents at the same place share the field regardless of which
 * app they arrived through. The map is process-global — it persists across MCP
 * tool calls and sessions within the process, and is correctly EMPTY after a
 * restart (vapour is meant to evaporate).
 *
 * One core, two exposures: pscale_torus (the LLM heartbeat — each tool call
 * beats and reads, request/response) is live now; an SSE route for human
 * keystrokes is Phase 2 (deferred — humans stay on Supabase Realtime). Both key
 * the same field by the same `frame`, so an LLM and a human at one place are in
 * one torus.
 *
 * A bare beat (no reach) is a presence ping that PRESERVES the standing reach,
 * so an agent holds presence without re-stating intention. STALE_S is the
 * afterglow — the knob that trades concurrency for continuity.
 *
 * Touches no substrate primitive. `grain:` (the durable, lock-gated bilateral
 * block) is untouched; the live bilateral here is a `reach:` frame — a transient
 * key in this map, never written anywhere. reach (live) → grain (durable) is the
 * VLS staging; the words are kept distinct on purpose.
 */

export const STALE_S = 30; // seconds; a beat older than this is pruned on read
export const CAP = 24;     // advisory saturation flag — the torus never refuses

export interface Presence {
  reach: string; // the live offering: an LLM's current intention, a human's draft
  face: string;
  ts: number;    // seconds, from the injected clock
}

export interface PresentMember {
  handle: string;
  face: string;
  reach: string | null;
  age: number; // seconds since this member's last beat (one decimal)
}

export interface TorusView {
  frame: string;
  present: PresentMember[];      // live members at this frame, EXCLUDING the viewer
  you?: PresentMember | null;    // the viewer's own stamped presence (beat() only)
  here: number;                  // live count at this frame (including the viewer)
  load: number;                  // live count across every frame
  cap: number;
  saturated: boolean;
}

/**
 * Order-independent frame for a pairwise reach — both parties name one frame
 * however each addresses the other (alice+bob and bob+alice meet at one frame).
 * NOT a grain: a transient relay key, never a block. reach (live, here) is the
 * precursor to grain (durable, via pscale_grain_reach).
 */
export function pairFrame(a: string, b: string): string {
  return 'reach:' + [a, b].sort().join(':');
}

export class Torus {
  // frame -> handle -> Presence. The field belongs to the running process.
  private frames = new Map<string, Map<string, Presence>>();

  constructor(
    public readonly cap: number = CAP,
    public readonly staleS: number = STALE_S,
    private readonly clock: () => number = () => Date.now() / 1000,
  ) {}

  /**
   * Heartbeat: upsert this handle's presence + reach at `frame`, stamp now, and
   * return the frame's live view (present[] excludes the caller; `you` carries
   * the caller's own stamped presence). A `reach` of undefined PRESERVES the
   * standing reach (a bare presence ping); '' sets it empty. `face` likewise
   * preserves on omission, defaulting to 'character' on the first beat.
   */
  beat(frame: string, handle: string, reach?: string, face?: string): TorusView {
    let here = this.frames.get(frame);
    if (!here) { here = new Map(); this.frames.set(frame, here); }
    const prior = here.get(handle);
    here.set(handle, {
      reach: reach !== undefined ? reach : (prior?.reach ?? ''),
      face: face !== undefined ? face : (prior?.face ?? 'character'),
      ts: this.clock(),
    });
    const view = this.view(frame, handle);
    const me = this.frames.get(frame)?.get(handle);
    view.you = me ? { handle, face: me.face, reach: me.reach || null, age: 0 } : null;
    return view;
  }

  /**
   * Who is live at `frame` (pruning the stale as it reads), plus the server's
   * load. `exclude` drops one handle — a caller need not be shown its own reach.
   */
  view(frame: string, exclude?: string): TorusView {
    const now = this.clock();
    const load = this.prune(now);
    const here = this.frames.get(frame);
    const present: PresentMember[] = [];
    if (here) {
      for (const [h, p] of here) {
        if (h === exclude) continue;
        present.push({
          handle: h,
          face: p.face,
          reach: p.reach || null,
          age: Math.round((now - p.ts) * 10) / 10,
        });
      }
    }
    return {
      frame,
      present,
      here: here ? here.size : 0,
      load,
      cap: this.cap,
      saturated: load >= this.cap,
    };
  }

  /** A clean leave — drop a handle now rather than wait for it to go stale. */
  depart(frame: string, handle: string): void {
    const here = this.frames.get(frame);
    if (!here) return;
    here.delete(handle);
    if (here.size === 0) this.frames.delete(frame);
  }

  /**
   * Prune every frame of beats older than the afterglow; drop emptied frames.
   * Returns the total live count across all frames (the load / capacity signal).
   * Map iteration tolerates deletion of the entry being visited.
   */
  private prune(now: number): number {
    let total = 0;
    for (const [frame, here] of this.frames) {
      for (const [h, p] of here) {
        if (now - p.ts > this.staleS) here.delete(h);
      }
      if (here.size === 0) this.frames.delete(frame);
      else total += here.size;
    }
    return total;
  }
}

/**
 * The process-global torus the pscale_torus tool beats. One field per running
 * bsp-mcp node; agents that want to share co-presence beat the same node.
 */
export const torus = new Torus();
