// Small sound toolkit: buffers of floats in, 16-bit WAV out. Everything in assets/sfx and every promo score comes from here,
// so the package carries no third-party audio.
import fs from 'node:fs';

export const RATE = 48000;
export const samples = sec => new Float64Array(Math.round(sec * RATE));

// Seeded, so a rebuild gives the same files.
export function noiseSource(seed = 1) {
  let s = seed >>> 0;
  return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 2147483648 - 1; };
}

export function sine(sec, hz, { decay = 0, phase = 0, glideTo } = {}) {
  const out = samples(sec);
  let ph = phase;
  for (let i = 0; i < out.length; i++) {
    const t = i / RATE, f = glideTo ? hz * Math.pow(glideTo / hz, t / sec) : hz;
    ph += 2 * Math.PI * f / RATE;
    out[i] = Math.sin(ph) * (decay ? Math.exp(-t * decay) : 1);
  }
  return out;
}

export function noise(sec, seed, decay = 0) {
  const out = samples(sec), r = noiseSource(seed);
  for (let i = 0; i < out.length; i++) out[i] = r() * (decay ? Math.exp(-i / RATE * decay) : 1);
  return out;
}

// One-pole filters: cheap, and enough for noise colour.
export function lowpass(buf, hz) {
  const a = 1 - Math.exp(-2 * Math.PI * hz / RATE), out = new Float64Array(buf.length);
  let y = 0;
  for (let i = 0; i < buf.length; i++) { y += a * (buf[i] - y); out[i] = y; }
  return out;
}
export function highpass(buf, hz) {
  const low = lowpass(buf, hz);
  return buf.map((v, i) => v - low[i]);
}
// Low-pass whose corner moves over the sound, for sweeps. hz(u) takes 0 to 1.
export function sweep(buf, hz) {
  const out = new Float64Array(buf.length);
  let y = 0;
  for (let i = 0; i < buf.length; i++) {
    const a = 1 - Math.exp(-2 * Math.PI * hz(i / buf.length) / RATE);
    y += a * (buf[i] - y); out[i] = y;
  }
  return out;
}
export const shape = (buf, env) => buf.map((v, i) => v * env(i / buf.length, i / RATE));
export const attack = (buf, sec = 0.003) => shape(buf, (_, t) => Math.min(1, t / sec));

export function place(dst, src, at = 0, gain = 1) {
  const from = Math.round(at * RATE);
  for (let i = 0; i < src.length && from + i < dst.length; i++) if (from + i >= 0) dst[from + i] += src[i] * gain;
  return dst;
}
export function layer(sec, parts) {
  const out = samples(sec);
  for (const [src, at = 0, gain = 1] of parts) place(out, src, at, gain);
  return out;
}

export function normalise(buf, peakDb = -3) {
  const peak = buf.reduce((m, v) => Math.max(m, Math.abs(v)), 1e-9), g = Math.pow(10, peakDb / 20) / peak;
  return buf.map(v => v * g);
}

// channels: one buffer (mono) or two (stereo).
export function writeWav(file, channels) {
  const chans = Array.isArray(channels) ? channels : [channels], n = chans[0].length, c = chans.length;
  const out = Buffer.alloc(44 + n * c * 2);
  out.write('RIFF', 0); out.writeUInt32LE(36 + n * c * 2, 4); out.write('WAVEfmt ', 8); out.writeUInt32LE(16, 16); out.writeUInt16LE(1, 20); out.writeUInt16LE(c, 22);
  out.writeUInt32LE(RATE, 24); out.writeUInt32LE(RATE * c * 2, 28); out.writeUInt16LE(c * 2, 32); out.writeUInt16LE(16, 34); out.write('data', 36); out.writeUInt32LE(n * c * 2, 40);
  for (let i = 0, p = 44; i < n; i++) for (let k = 0; k < c; k++, p += 2) out.writeInt16LE(Math.round(Math.max(-1, Math.min(1, chans[k][i])) * 32767), p);
  fs.writeFileSync(file, out);
}
