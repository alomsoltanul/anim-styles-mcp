// A plain beat score for promo films: kick, off-beat noise, hats, plucks over a four-chord loop, a low hit on each scene change, a soft last chord.
// sound.json: { "score": { "bpm": 120, "scenes": [0, 4, 8], "mood": "bright" | "dark" } }. The picture lands on the same beats.
import { RATE, highpass, noise, noiseSource, place, samples, shape, sine, writeWav } from './synth.js';

const CHORDS = {
  dark: [[146.83, 220, 293.66, 349.23], [116.54, 174.61, 233.08, 293.66], [130.81, 196, 261.63, 329.63], [110, 164.81, 220, 293.66]],
  bright: [[130.81, 196, 261.63, 329.63], [110, 164.81, 220, 261.63], [87.31, 174.61, 220, 261.63], [98, 196, 246.94, 293.66]],
};

const pluck = (hz, sec = 0.65) => {
  const a = sine(sec, hz, { decay: 8 }), b = sine(sec, hz * 2, { decay: 8 });
  return shape(a.map((v, i) => v + 0.23 * b[i]), (_, t) => Math.min(1, t * 250));
};

export function makeScore({ dur, bpm = 120, scenes = [], mood = 'dark', seed = 45 }) {
  const beat = 60 / bpm, L = samples(dur), R = samples(dur), chords = CHORDS[mood] ?? CHORDS.dark;
  const put = (buf, at, gain, pan = 0) => { place(L, buf, at, gain * (1 - pan * 0.45)); place(R, buf, at, gain * (1 + pan * 0.45)); };
  const bar = beat * 4, bars = Math.ceil(dur / bar), kick = shape(sine(0.35, 83, { glideTo: 44 }), (_, t) => Math.exp(-t * 15));
  const snare = shape(highpass(noise(0.15, seed), 1500), (_, t) => Math.exp(-t * 30));
  const hat = shape(highpass(noise(0.055, seed + 1), 5000), (_, t) => Math.exp(-t * 90));
  for (let b = 0; b < bars; b++) {
    const start = b * bar, chord = chords[Math.floor(b / 2) % chords.length];
    [0, 2, 1, 3, 2, 1, 3, 2].forEach((note, j) => put(pluck(chord[note] * 2), start + j * beat / 2, 0.075, (j % 2 ? -1 : 1) * 0.55));
    const pad = samples(bar);
    for (const hz of chord) place(pad, sine(bar, hz), 0, 0.25);
    put(shape(pad, (_, t) => Math.min(t * 3, 1, (bar - t) * 3)), start, 0.09);
    for (let k = 0; k < 4; k++) {
      const at = start + k * beat;
      if (k % 2 === 0) put(kick, at, 0.42); else put(snare, at, 0.055);
      put(hat, at, 0.022, 0.4); put(hat, at + beat / 2, 0.022, -0.4);
    }
  }
  const rise = noiseSource(seed + 2);
  for (const at of scenes) {
    if (at > 0) put(shape(samples(0.28).map(() => rise()), u => Math.sin(Math.PI * u) ** 2), at - 0.28, 0.035);
    put(shape(sine(0.9, 73.4), (_, t) => Math.exp(-t * 8)), at, 0.28);
  }
  const last = samples(2);
  for (const hz of chords[0]) place(last, sine(2, hz, { decay: 2 }), 0, 0.25);
  put(last, Math.max(0, dur - 2), 0.22);
  const fade = (buf, i) => {
    const edge = Math.min(i / (RATE * 0.08), (buf.length - i) / (RATE * 0.8), 1);
    return Math.tanh(buf[i] * 1.3) * edge * 0.88;
  };
  return [L.map((_, i) => fade(L, i)), R.map((_, i) => fade(R, i))];
}

export const writeScore = (file, opts) => writeWav(file, makeScore(opts));
