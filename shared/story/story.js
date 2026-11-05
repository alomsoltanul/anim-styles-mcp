// Flat cartoon story engine. A project's page calls play(); its scenes.js sets window.SPEC = { cast, shots }.
// prepare() builds every shot once and returns { dur, cues, shots }; seek(t) only moves what was built, so it draws from t alone.
// Shape comes from style.json: a tall size is a reel, a wide one a film. The world stays in screen units and the camera sees a window of it.
import { CUR, DEFS, E, H, ITEMS, S, SHADOW, SPEC, T, W, appear, back, bn, clamp, dsp, eio, eo, hash, inSpan, kf, lerp, lg, normTimes, patCheck, patDots, rg, setCur, setSize, setSpec, shade, stage, step, uid } from './core.js';
import { fo, timed } from './cards.js';
import * as kit from './kit.js';
import { mouth } from './people.js';
import './sets.js';

const LEAD = .35;   // a spoken line starts this long after its shot's cut
const FONTS = ['500 40px Noto', '600 40px Noto', '700 40px Noto', '800 40px Noto', '900 40px Noto', '40px Galada', '600 40px Montserrat', '700 40px Montserrat', '900 40px Montserrat'];
const GRADES = { night: { tint: .55, tintc: '#1d2b55', sat: .8, bri: 1 }, cold: { tint: .25, tintc: '#6f7f9c', sat: .45, bri: .96 }, warm: { tint: .14, tintc: '#ffb36b', sat: 1.08, bri: 1.02, blend: 'soft-light' }, day: {} };
const grainEl = stage.querySelector('#grain'), GRAIN = [];
let SC = [], DUR = 0;

// ---------- item wrapper: placement, appear/out, move [[t,x,y(,s)]], clip [x,y,w,h] in parent space, blur
const BLURS = {};
function blurF(sd) { if (!BLURS[sd]) { const id = uid('bl'), f = S('filter', { id, x: '-5%', y: '-5%', width: '110%', height: '110%' }, DEFS); S('feGaussianBlur', { stdDeviation: sd }, f); BLURS[sd] = `url(#${id})`; } return BLURS[sd]; }
function buildItem(parent, raw) {
  const it = normTimes({ ...raw }); let host = parent;
  if (it.clip) { const id = uid('cl'), cp = S('clipPath', { id, clipPathUnits: 'userSpaceOnUse' }, DEFS); S('rect', { x: it.clip[0], y: it.clip[1], width: it.clip[2], height: it.clip[3] }, cp); host = S('g', { 'clip-path': `url(#${id})` }, parent); }
  const g = S('g', {}, host), inner = S('g', {}, g);
  if (it.blur) inner.setAttribute('filter', blurF(it.blur));
  const make = ITEMS[it.k];
  if (!make) console.error(`Unknown item kind "${it.k}" in shot ${CUR.i + 1}.`);
  const up = make?.(inner, it);
  return lt => {
    const a = appear(it, lt), mv = kf(it.move, lt), x = mv ? mv[0] : (it.x ?? 0), y = mv ? mv[1] : (it.y ?? 0);
    const s = (mv && mv[2] != null ? mv[2] : (it.s ?? 1)) * a.s, rot = (kf(it.r, lt) ?? 0) + a.r;
    g.setAttribute('transform', `translate(${x + a.dx},${y + a.dy}) rotate(${rot}) scale(${s * (it.flip ? -1 : 1)},${s})`);
    g.setAttribute('opacity', a.o * (kf(it.o, lt) ?? 1)); g.style.display = a.o <= 0.001 ? 'none' : null;
    if (up && a.o > 0.001) up(lt);
  };
}
// reveal: sub-items appear top to bottom between a and b behind a scan line (y0..y1 in this item's space)
ITEMS.reveal = (g, it) => {
  const id = uid('rv'), cp = S('clipPath', { id, clipPathUnits: 'userSpaceOnUse' }, DEFS), r = S('rect', { x: -3000, y: it.y0, width: 6000, height: 0 }, cp);
  const inner = S('g', { 'clip-path': `url(#${id})` }, g), ups = (it.items || []).map(x => buildItem(inner, x));
  const line = S('rect', { x: it.x0 ?? -420, width: it.lw ?? 840, height: 8, rx: 4, fill: it.lc || '#2E9E5B' }, g);
  const a = T(it.a), b = T(it.b);
  return lt => { const p = eio((lt - a) / (b - a)), yy = it.y0 + p * (it.y1 - it.y0); r.setAttribute('height', Math.max(0, yy - it.y0)); line.setAttribute('y', yy - 4); line.style.display = p > 0 && p < 1 ? '' : 'none'; ups.forEach(f => f(lt)); };
};
ITEMS.group = (g, it) => { const ups = (it.items || []).map(r => buildItem(g, r)); return lt => ups.forEach(f => f(lt)); };

// ---------- when each shot runs
const words = s => (s || '').replace(/[।?!,.*]/g, ' ').split(/\s+/).filter(Boolean).length;
const readLength = d => d.dur ?? Math.max(2.4, LEAD + words(d.vo) / SPEC.wps + (d.tail ?? .75));

// The mixer plays each line at line.start, so the picture fits the voice. Lines go to shots with `vo`, in order.
// A spoken shot cuts in up to LEAD before its line, never before the last line has ended, and holds until the next shot.
// Shots with no line keep their length if the lines leave room, so a pause needs an `at` on the next line.
function planShots(shots, voice) {
  const lines = voice?.lines ?? [], P = shots.map(d => ({ dur: readLength(d), lead: LEAD, vod: 0, wps: SPEC.wps }));
  const spoken = shots.flatMap((d, i) => d.vo ? [i] : []);
  if (lines.length && lines.length !== spoken.length) console.error(`add_voice has ${lines.length} lines but ${spoken.length} shots have vo. Give one line per spoken shot, in order.`);
  let prev = -1, lineEnd = 0;
  spoken.slice(0, lines.length).forEach((i, k) => {
    const l = lines[k], cut = i === 0 ? 0 : Math.min(l.start, Math.max(lineEnd, l.start - LEAD));
    const between = P.slice(prev + 1, i), need = between.reduce((a, p) => a + p.dur, 0), room = cut - lineEnd;
    if (need > room + .01) {
      console.error(`Shot${between.length > 1 ? 's' : ''} before shot ${i + 1} ${between.length > 1 ? 'have' : 'has'} no voice and ${need.toFixed(1)} s of picture, but only ${room.toFixed(1)} s between lines. Give add_voice line ${k + 1} at: ${(lineEnd + need + LEAD).toFixed(2)}.`);
      between.forEach(p => { p.dur *= Math.max(0, room) / need; });
    }
    let t = cut;
    for (const p of between.reverse()) { t -= p.dur; p.t0 = t; }
    if (prev >= 0) P[prev].dur = t - P[prev].t0;
    else if (between.length) { P[0].dur += t; P[0].t0 = 0; }
    Object.assign(P[i], { t0: cut, lead: l.start - cut, vod: l.dur, wps: words(shots[i].vo) / l.dur });
    prev = i; lineEnd = l.start + l.dur;
  });
  if (prev >= 0) { const p = P[prev], d = shots[prev]; p.dur = d.dur ? Math.max(d.dur, p.lead + p.vod + .4) : Math.max(2.4, p.lead + p.vod + (d.tail ?? .75) * .8); }
  let t = prev < 0 ? 0 : P[prev].t0 + P[prev].dur;
  for (const p of P.slice(prev + 1)) { p.t0 = t; t += p.dur; }
  if (voice?.dur > t) P.at(-1).dur += voice.dur - t;
  return P;
}

// ---------- shots
function capChunks(vo, t0, t1) {
  const parts = vo.split(/(?<=[।?!]|[^.]\.)\s+/).flatMap(s => { const w = s.split(/\s+/); if (w.length <= 10) return [s]; const out = []; let cur = []; for (const x of w) { cur.push(x); if (cur.length >= 7 && /,$/.test(x) || cur.length >= 9) { out.push(cur.join(' ')); cur = []; } } if (cur.length) { if (cur.length < 3 && out.length) out[out.length - 1] += ' ' + cur.join(' '); else out.push(cur.join(' ')); } return out; });
  const tot = parts.reduce((a, p) => a + words(p), 0); let t = t0;
  return parts.map(p => { const d = (t1 - t0) * words(p) / tot, r = { text: p, a: t, b: t + d }; t += d; return r; });
}
const redWords = s => s.replace(/\*([^*]+)\*/g, '<span class="F">$1</span>').replace(/\*/g, '');
function buildShot(d, i, plan) {
  const root = E('div', 'sc', stage); root.style.display = 'block'; root.style.zIndex = 1 + i;
  const sh = { i, d, root, ...plan, t1: plan.t0 + plan.dur }; setCur(sh);
  for (const k of ['tintk', 'satk', 'brik']) if (d[k]) d[k] = d[k].map(r => [T(r[0]), r[1]]);
  const svg = S('svg', { viewBox: `0 0 ${W} ${H}` }, root);
  sh.cam = S('g', {}, svg);
  sh.tint = S('rect', { x: 0, y: 0, width: W, height: H, fill: d.tintc || '#24325c', opacity: 0, style: `mix-blend-mode:${d.blend || 'multiply'}` }, svg);
  sh.ui = S('g', {}, svg);
  const gid = uid('gr'), gf = S('filter', { id: gid, 'color-interpolation-filters': 'sRGB', filterUnits: 'userSpaceOnUse', x: -3000, y: -3000, width: 9000, height: 9000 }, DEFS);
  sh.cm = S('feColorMatrix', { type: 'saturate', values: 1 }, gf); const ctf = S('feComponentTransfer', {}, gf); sh.cf = ['R', 'G', 'B'].map(c => S('feFunc' + c, { type: 'linear', slope: 1 }, ctf)); sh.gid = gid;
  const items = [...(d.set ? [{ k: d.set, ...(d.setOpt || {}) }] : []), ...(d.items || [])];
  sh.ups = items.map(raw => buildItem(raw.screen ? sh.ui : sh.cam, raw));
  // Captions run through the line, or through the shot when there is no voice. Frame 0 of the film always has its caption.
  if (d.vo && d.cap !== false) {
    const [a, b] = sh.vod ? [sh.lead - .05, sh.lead + sh.vod + .05] : [.3, sh.dur - .35];
    sh.caps = capChunks(d.vo, i === 0 ? 0 : a, b).map(c => {
      const el = E('div', 'cap' + (SPEC.capStyle ? ' ' + SPEC.capStyle : ''), root, (d.who ? `<div class="who">• ${d.who}</div>` : '') + redWords(c.text));
      el.style.display = 'none';
      return { ...c, text: c.text.replace(/\*/g, ''), el };
    });
  }
  const gp = GRADES[d.grade] || {}; sh.g = { tint: d.tint ?? gp.tint ?? 0, sat: d.sat ?? gp.sat ?? 1, bri: d.bri ?? gp.bri ?? 1 };
  if (gp.tintc && !d.tintc) sh.tint.setAttribute('fill', gp.tintc);
  if (gp.blend && !d.blend) sh.tint.style.mixBlendMode = gp.blend;
  root.style.display = 'none';
  return sh;
}
function drawShot(sh, lt) {
  setCur(sh); const d = sh.d;
  const cf = d.cam?.from || [W / 2, H / 2, 1], ct = d.cam?.to || [cf[0], cf[1], cf[2] * (d.push ?? 1.045)];
  const keys = d.cam?.keys; let c;
  if (keys) c = kf(keys.map(k => [T(k[0]), k[1], k[2], k[3]]), lt); else { const p = eio(lt / sh.dur); c = [lerp(cf[0], ct[0], p), lerp(cf[1], ct[1], p), lerp(cf[2], ct[2], p)]; }
  let sx = 0, sy = 0;
  for (const [t, amp, du] of (d.shake || [])) { const q = lt - T(t); if (q >= 0 && q < (du || .35)) { const f = 1 - q / (du || .35); sx += Math.sin(q * 90) * amp * f; sy += Math.cos(q * 77) * amp * f; } }
  sh.cam.setAttribute('transform', `translate(${W / 2 + sx},${H / 2 + sy}) scale(${c[2]}) translate(${-c[0]},${-c[1]})`);
  sh.ups.forEach(f => f(lt));
  const tint = kf(d.tintk, lt) ?? sh.g.tint, sat = kf(d.satk, lt) ?? sh.g.sat, bri = kf(d.brik, lt) ?? sh.g.bri;
  sh.tint.setAttribute('opacity', tint);
  if (Math.abs(sat - 1) > .005 || Math.abs(bri - 1) > .005) { sh.cm.setAttribute('values', sat); sh.cf.forEach(f => f.setAttribute('slope', bri)); sh.cam.setAttribute('filter', `url(#${sh.gid})`); } else sh.cam.removeAttribute('filter');
  if (sh.caps) sh.caps.forEach(c => { const on = lt >= c.a && lt < c.b + (c === sh.caps.at(-1) ? 9 : 0); c.el.style.display = on ? 'block' : 'none'; c.el.classList.toggle('two', c.text.length > 46); });
}
function makeGrain() {
  for (let n = 0, s = 7; n < 4; n++) {
    const cv = document.createElement('canvas'); cv.width = 480; cv.height = 270;
    const x = cv.getContext('2d'), im = x.createImageData(cv.width, cv.height);
    for (let i = 0; i < im.data.length; i += 4) { s = (s * 1664525 + 1013904223) >>> 0; const v = 255 - s / 4294967296 * 110; im.data[i] = im.data[i + 1] = im.data[i + 2] = v; im.data[i + 3] = 255; }
    x.putImageData(im, 0, 0); GRAIN.push(`url(${cv.toDataURL()})`);
  }
}

// ---------- sound: each shot's sfx [[time, kind, i?]] becomes one flat list of cues on the film's clock
function cuesOf(shots) {
  let swish = 0;
  return shots.flatMap(s => { setCur(s); return (s.d.sfx || []).map(([at, k, i]) => ({ t: +(s.t0 + T(at)).toFixed(3), k, ...(k === 'whoosh' ? { i: i ?? swish++ % 2 } : {}) })); }).sort((a, b) => a.t - b.t);
}

// ---------- voice: add_voice writes vo/timing.json for the mixer and vo/timing.js with the loudness curve
const readJson = f => fetch(f).then(r => r.ok ? r.json() : null).catch(() => null);
// 30 dB under the loud parts is closed. Fast attack, about 50 ms release, then 0 to 9 for the mouth shapes.
function mouthCurve(env) { let open = 0; return env.map(v => { const y = clamp(1 + 20 * Math.log10(Math.max(v, 1e-3)) / 30); open = y > open ? y : open * .45 + y * .55; return Math.round(open * 9); }); }
async function loadVoice() {
  const info = await readJson('vo/timing.json');
  if (!info?.lines?.length) return null;
  const timing = await import(new URL('vo/timing.js', location.href).href).catch(() => null);
  if (timing?.ENV) { mouth.fps = timing.FPS ?? mouth.fps; mouth.curve = mouthCurve(timing.ENV); }
  return info;
}

const loadScript = src => new Promise((resolve, reject) => { const s = document.createElement('script'); s.src = src; s.onload = resolve; s.onerror = () => reject(new Error(`${src} did not load.`)); document.head.appendChild(s); });

async function build(scenes) {
  const [w, h] = (await readJson('style.json'))?.size ?? [W, H];
  setSize(w, h);
  Object.assign(window, { W: w, H: h });
  stage.style.setProperty('--w', `${w}px`); stage.style.setProperty('--h', `${h}px`); stage.classList.toggle('V', h > w);
  const voice = await loadVoice();
  await loadScript(scenes);
  if (!window.SPEC?.shots) throw new Error(`${scenes} must set window.SPEC = { cast, shots }.`);
  setSpec(window.SPEC);
  SPEC.wps ||= 2.3; SPEC.cast ||= {};
  if (SPEC.accent) stage.style.setProperty('--accent', SPEC.accent);
  await Promise.all([...FONTS, ...(SPEC.fonts || [])].map(f => document.fonts.load(f, 'Aa অক あ語')));
  await document.fonts.ready;
  S('linearGradient', { id: 'glass', x1: 0, y1: 0, x2: 1, y2: 1 }, DEFS).innerHTML = '<stop offset="0" stop-color="#fff" stop-opacity=".55"/><stop offset=".45" stop-color="#fff" stop-opacity=".05"/><stop offset=".55" stop-color="#fff" stop-opacity=".25"/><stop offset="1" stop-color="#fff" stop-opacity="0"/>';
  makeGrain();
  const plans = planShots(SPEC.shots, voice);
  SC = SPEC.shots.flatMap((d, i) => plans[i].dur > .01 ? [buildShot(d, i, plans[i])] : []);
  DUR = SC.at(-1).t1;
  await Promise.all([...stage.querySelectorAll('img')].map(i => i.decode().catch(() => {})));
  seek(0);
  return { dur: DUR, cues: cuesOf(SC), w, h, shots: SC.map(s => ({ i: s.i, t0: +s.t0.toFixed(3), t1: +s.t1.toFixed(3), lead: +s.lead.toFixed(3), vod: s.vod, vo: s.d.vo ?? null })) };
}

function seek(t) {
  let ci = SC.findIndex(s => t >= s.t0 && t < s.t1); if (ci < 0) ci = SC.length - 1;
  const cur = SC[ci], lt = Math.min(t - cur.t0, cur.dur), xf = cur.d.xf ?? .32, prev = ci > 0 && lt < xf ? SC[ci - 1] : null;
  SC.forEach(s => { s.root.style.display = s === cur || s === prev ? 'block' : 'none'; });
  if (prev) { drawShot(prev, prev.dur - 1e-3); prev.root.style.opacity = 1; }
  drawShot(cur, lt); cur.root.style.opacity = prev ? eio(lt / xf) : 1;
  grainEl.style.backgroundImage = GRAIN[Math.floor(t * 12) % 4];
}

// What scenes.js can use without importing anything. Plain window properties, so a scene may declare the same name for itself.
Object.assign(window, { ITEMS, S, E, lg, rg, patCheck, patDots, shade, hash, clamp, lerp, eio, eo, back, bn, kf, step, inSpan, T, dsp, fo, timed, SHADOW, buildItem, ...kit });

export function play(scenes = 'scenes.js') {
  let ready;
  window.prepare = () => ready ??= build(scenes);
  window.seek = seek;
  if (location.search.includes('render')) return;
  // Opened in a browser: loop the film, or one shot with ?shot=N.
  window.prepare().then(info => {
    const shot = new URLSearchParams(location.search).get('shot'), one = shot != null ? info.shots[Number(shot)] : null, a = one ? one.t0 : 0, b = one ? one.t1 : info.dur;
    const fit = () => { stage.style.transform = `scale(${Math.min(1, innerWidth / W, innerHeight / H)})`; };
    fit(); addEventListener('resize', fit);
    const t0 = performance.now(), loop = () => { seek(a + ((performance.now() - t0) / 1000) % (b - a)); requestAnimationFrame(loop); };
    loop();
  });
}
