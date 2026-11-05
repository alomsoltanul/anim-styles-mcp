// Shared helpers for the canvas and three.js starters: clock, smoke, polyline tools, and the rickshaw used as the demo subject.
// Page contract: window.prepare() -> {dur,cues}, window.seek(t).
const W = 1080, H = 1920, DUR = 7;
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const lerp = (a, b, t) => a + (b - a) * t;
const ss = (a, b, x) => { const t = clamp((x - a) / (b - a)); return t * t * (3 - 2 * t); };
const backOut = u => { const c = 1.70158; const v = u - 1; return 1 + (c + 1) * v * v * v + c * v * v; };
const hash = n => { const s = Math.sin(n * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };
const vnoise = x => { const i = Math.floor(x), f = x - i, u = f * f * (3 - 2 * f); return lerp(hash(i), hash(i + 1), u) * 2 - 1; };
const bn = s => String(s).replace(/\d/g, d => '০১২৩৪৫৬৭৮৯'[d]);
const rand = seed => () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };

const BEAT = {
  ign: t => ss(0.9, 1.9, t),                                         // thrust builds
  lift: t => { const u = clamp((t - 2.0) / 2.7); return 1 - Math.pow(1 - u, 3) + Math.sin(t * 2.6) * 0.012 * ss(3.6, 4.6, t); },
  shake: t => ss(0.9, 1.5, t) * (1 - ss(2.3, 3.0, t)),
  cheer: t => ss(2.1, 2.6, t),
  caption: t => ss(4.7, 5.0, t),
  hook: t => 1 - ss(2.2, 2.6, t),                                    // the opening question, on screen from frame 0
};
const shakeXY = (t, amp) => { const k = BEAT.shake(t) * amp; return [vnoise(t * 31) * k, vnoise(t * 37 + 9) * k]; };
const TXT = { title: 'Rickshaw 101', name: 'RICKSHAW', law: 'Thrust > Weight', thrust: 'Thrust', weight: 'Weight', wow: 'Bravo!', woah: 'Wow!', whoosh: 'WHOOSH!', fly: 'The rickshaw flies.', what: 'What if a rickshaw could fly?', whatLines: ['What if a rickshaw', 'could fly?'] };

// Smoke: stateless, so seek(t) lands on the same frame every time.
// emit(i, birth) -> [x, y] where puff i starts; returns puffs alive at t.
function puffs(t, { n = 60, t0 = 1.0, t1 = 4.4, life = [1.2, 2.6], spread = 200, rise = 60, fall = 0, r = [18, 60], emit, seed = 1, lift = BEAT.lift }) {
  const out = [];
  for (let i = 0; i < n; i++) {
    const birth = lerp(t0, t1, hash(i * 3.1 + seed)), L = lerp(life[0], life[1], hash(i * 5.7 + seed));
    const u = (t - birth) / L; if (u < 0 || u > 1) continue;
    const [ex, ey] = emit(i, birth), dir = hash(i * 9.3 + seed) * 2 - 1, g = 1 - Math.pow(1 - u, 2.2), hi = clamp(lift(birth));   // pass lift: () => 0 for smoke that isn't tied to the demo's take-off
    out.push({ i, u, x: ex + dir * spread * g * (1 - .8 * hi), y: ey - rise * g * (0.4 + hash(i + seed)) * (1 - hi) + fall * hi * g, r: lerp(r[0], r[1], hash(i * 2.2 + seed)) * (0.35 + 0.65 * Math.sqrt(u)) * (u > 0.8 ? 1 - (u - 0.8) * 3 : 1), a: u < 0.1 ? u * 10 : 1 - ss(0.65, 1, u) });
  }
  return out.sort((a, b) => a.r - b.r);
}

// ---- Rickshaw, side view. Origin = ground under the middle, y negative = up.
const arcPts = (cx, cy, rx, ry, a0, a1, n = 22) => Array.from({ length: n + 1 }, (_, i) => { const a = lerp(a0, a1, i / n) * Math.PI / 180; return [cx + rx * Math.cos(a), cy - ry * Math.sin(a)]; });
const RK = (() => {
  const pv = [-62, -92], arc = arcPts(pv[0], pv[1], 76, 118, 172, 28);
  const wedge = (a0, a1) => [pv, ...arcPts(pv[0], pv[1], 76, 118, a0, a1, 8)];
  return {
    pivot: pv,
    wheels: [{ x: -70, y: -42, r: 42 }, { x: 128, y: -36, r: 36 }],
    hood: [...arc, [-14, -92], [-128, -92]],
    hoodArc: arc,
    wedges: [wedge(172, 136), wedge(136, 100), wedge(100, 64), wedge(64, 28)],
    ribs: [136, 100, 64].map(a => [pv, arcPts(pv[0], pv[1], 76, 118, a, a, 1)[0]]),
    cushion: [[-130, -92], [-12, -92], [-8, -76], [-124, -70]],
    box: [[-124, -70], [-8, -76], [14, -54], [-112, -48]],
    saddle: [[28, -92], [66, -92], [68, -86], [34, -84]],
    frame: [[[-70, -42], [34, -46]], [[14, -54], [34, -46]], [[34, -46], [46, -86]], [[34, -46], [112, -80]], [[46, -80], [112, -94]], [[110, -102], [128, -36]], [[110, -102], [106, -124]], [[90, -130], [124, -120]]],
    crank: { x: 34, y: -46, r: 11 },
    nozzles: [[-70, 0], [128, 0]],
  };
})();
const place = (pts, ox, oy, s, rot = 0) => { const c = Math.cos(rot), n = Math.sin(rot); return pts.map(([x, y]) => [ox + (x * c - y * n) * s, oy + (x * n + y * c) * s]); };
const placeWheel = (w, ox, oy, s, rot = 0) => { const [[x, y]] = place([[w.x, w.y]], ox, oy, s, rot); return { x, y, r: w.r * s }; };
function resample(pts, step, closed) {
  const src = closed ? [...pts, pts[0]] : pts, out = []; let carry = 0;
  for (let i = 1; i < src.length; i++) {
    const [ax, ay] = src[i - 1], [bx, by] = src[i], L = Math.hypot(bx - ax, by - ay); let d = carry;
    while (d <= L) { out.push([lerp(ax, bx, d / L), lerp(ay, by, d / L)]); d += step; }
    carry = d - L;
  }
  return out;
}
const circlePts = (x, y, r, n = 40) => arcPts(x, y, r, r, 0, 360, n);
function trace(ctx, pts, closed) { ctx.beginPath(); pts.forEach((p, i) => i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])); if (closed) ctx.closePath(); }

// Boot: waits for fonts, then either serves the renderer or plays live in a browser.
// dur = clip length in seconds, cues = [{ t, k }] sound cues; the kinds are listed in the rules.
const LIFT_CUES = [{ t: .9, k: 'deep' }, { t: 2, k: 'zoom' }, { t: 2.3, k: 'hit' }, { t: 4.7, k: 'spark' }];
function boot({ setup, draw, fonts = [], dur = DUR, cues = [] }) {
  window.prepare = async () => {
    await Promise.all(fonts.map(f => document.fonts.load(f, 'Ag অ 働')));
    await document.fonts.ready;
    if (setup) await setup();
    window.seek(0);
    return { dur, cues };
  };
  window.seek = t => draw(Math.min(t, dur - 1e-3));
  if (!location.search.includes('render')) window.prepare().then(() => { const t0 = performance.now(); const tick = () => { draw(((performance.now() - t0) / 1000) % dur); requestAnimationFrame(tick); }; tick(); });
}
