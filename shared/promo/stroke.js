// One stroke as data: { pts: [[x, y]...], w: [half width...] }. Strokes with the same sample count morph point to point,
// so one line can turn into a slash, an equals bar, an underline or a tick and stay the same object on screen.
import { clamp, lerp } from '../time.js';

export const N = 56;
const L2 = (a, b, u) => [lerp(a[0], b[0], u), lerp(a[1], b[1], u)];
const sine = u => .5 - .5 * Math.cos(Math.PI * clamp(u));
const arcLen = P => { const L = [0]; for (let i = 1; i < P.length; i++) L.push(L[i - 1] + Math.hypot(P[i][0] - P[i - 1][0], P[i][1] - P[i - 1][1])); return L; };

export function resample(P, n = N, a = 0, b = 1) {
  const L = arcLen(P), tot = L.at(-1) || 1e-6, out = [];
  let j = 0;
  for (let i = 0; i < n; i++) {
    const s = (a + (b - a) * i / (n - 1)) * tot;
    while (j < L.length - 2 && L[j + 1] < s) j++;
    out.push(L2(P[j], P[j + 1], clamp((s - L[j]) / ((L[j + 1] - L[j]) || 1e-6))));
  }
  return out;
}

// Half widths along a stroke: a slight belly, and tapered ends if asked, so it reads as a brush mark.
function profile(n, hw, start, end) {
  const w = [];
  for (let i = 0; i < n; i++) {
    const u = i / (n - 1);
    let k = 1 + .06 * Math.sin(Math.PI * u);
    if (start === 'taper') k *= .28 + .72 * sine(u / .16);
    if (end === 'taper') k *= 1 - .9 * sine((u - .62) / .38);
    w.push(hw * k);
  }
  return w;
}

export const mk = (P, hw, start = 'round', end = 'round') => ({ pts: resample(P), w: profile(N, hw, start, end) });
export const line = (x0, y0, x1, y1, hw, start, end) => mk([[x0, y0], [x1, y1]], hw, start, end);
export const morph = (A, B, p) => p <= 0 ? A : p >= 1 ? B : { pts: A.pts.map((q, i) => L2(q, B.pts[i], p)), w: A.w.map((x, i) => lerp(x, B.w[i], p)) };
export const shift = (S, dx, dy) => ({ pts: S.pts.map(p => [p[0] + dx, p[1] + dy]), w: S.w });
export const grow = (S, k) => ({ pts: S.pts, w: S.w.map(x => x * k) });

// The visible part of a stroke between 0 and 1 along its length, for drawing it on. Keeps the sample count.
export function part(S, a, b) {
  if (b - a <= .0005) return null;
  const n = S.pts.length, pts = resample(S.pts, n, a, b), w = [];
  for (let i = 0; i < n; i++) {
    const f = (a + (b - a) * i / (n - 1)) * (n - 1), k = Math.floor(f), r = f - k;
    w.push(lerp(S.w[Math.min(k, n - 1)], S.w[Math.min(k + 1, n - 1)], r));
  }
  return { pts, w };
}

export function bez(P0, P1, P2, P3, n = 40) {
  const o = [];
  for (let i = 0; i < n; i++) {
    const u = i / (n - 1), v = 1 - u;
    o.push([v * v * v * P0[0] + 3 * v * v * u * P1[0] + 3 * v * u * u * P2[0] + u * u * u * P3[0], v * v * v * P0[1] + 3 * v * v * u * P1[1] + 3 * v * u * u * P2[1] + u * u * u * P3[1]]);
  }
  return o;
}

// Polygon with round caps, as an SVG path.
export function outline({ pts: P, w: Wd }) {
  const n = P.length, Lf = [], Rt = [];
  for (let i = 0; i < n; i++) {
    const a = P[Math.max(0, i - 1)], b = P[Math.min(n - 1, i + 1)];
    let tx = b[0] - a[0], ty = b[1] - a[1];
    const l = Math.hypot(tx, ty) || 1; tx /= l; ty /= l;
    Lf.push([P[i][0] - ty * Wd[i], P[i][1] + tx * Wd[i]]);
    Rt.push([P[i][0] + ty * Wd[i], P[i][1] - tx * Wd[i]]);
  }
  const cap = (c, r, a0) => Array.from({ length: 8 }, (_, k) => { const a = a0 - Math.PI * (k + 1) / 9; return [c[0] + Math.cos(a) * r, c[1] + Math.sin(a) * r]; });
  const d0 = Math.atan2(P[1][1] - P[0][1], P[1][0] - P[0][0]), d1 = Math.atan2(P[n - 1][1] - P[n - 2][1], P[n - 1][0] - P[n - 2][0]);
  return [...Lf, ...cap(P[n - 1], Wd[n - 1], d1 + Math.PI / 2), ...Rt.reverse(), ...cap(P[0], Wd[0], d0 - Math.PI / 2)];
}
export const pathD = poly => `M${poly.map(p => `${p[0].toFixed(2)} ${p[1].toFixed(2)}`).join('L')}Z`;
