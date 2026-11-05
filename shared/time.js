// Helpers shared by the starter pages. Every page draws from t alone, so any frame can be rendered in any order.
export const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
export const seg = (t, a, b) => clamp((t - a) / (b - a));
export const lerp = (a, b, k) => a + (b - a) * k;
export const ease = {
  io: k => k < .5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2,
  out: k => 1 - Math.pow(1 - k, 3),
  in: k => k * k * k,
  back: k => { const c = 1.70158; return 1 + (c + 1) * Math.pow(k - 1, 3) + c * Math.pow(k - 1, 2); },
};
const BN = '০১২৩৪৫৬৭৮৯';
export const bn = s => String(s).replace(/\d/g, d => BN[d]);
export const comma = n => Math.round(n).toLocaleString('en-US');
export const bnComma = n => bn(comma(n));
export function rng(seed) { let s = seed >>> 0; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296); }
// One caption per [start, end]: fades and lifts in, fades out.
export function capState(t, a, b, fade = .28) {
  const i = ease.out(seg(t, a, a + fade)), o = 1 - seg(t, b - fade, b);
  return { o: Math.min(i, o), y: (1 - i) * 22 };
}
export async function fontsReady(list) { await Promise.all(list.map(f => document.fonts.load(f, 'অ亻A'))); await document.fonts.ready; }
