// Builds assets/sfx from code, so the repo carries no third-party audio. Run: npm run sfx
import fs from 'node:fs';
import path from 'node:path';
import { SFX_DIR } from '../src/env.js';
import { attack, highpass, layer, lowpass, noise, noiseSource, normalise, samples, shape, sine, sweep, writeWav } from '../src/synth.js';

const exp = k => (_, t) => Math.exp(-t * k);
const bell = u => Math.sin(Math.PI * u) ** 2;
const click = (hz, seed, sec = 0.05) => layer(sec, [[attack(sine(sec, hz, { decay: 120 }), 0.0005), 0, 0.8], [shape(highpass(noise(sec, seed), 2000), exp(300)), 0, 0.4]]);
const beep = (hz, sec = 0.06) => attack(sine(sec, hz, { decay: 30 }), 0.002);
const thud = (hz, sec, seed) => layer(sec, [[sine(sec, hz * 2, { glideTo: hz, decay: 12 }), 0, 1], [shape(lowpass(noise(sec, seed), 900), exp(40)), 0, 0.5]]);
const air = (sec, seed, lo, hi, env = bell) => shape(sweep(noise(sec, seed), u => lo + (hi - lo) * env(u)), env);
const series = (sec, times, make) => layer(sec, times.map((t, i) => [make(i), t]));
const crackle = (sec, seed) => { const r = noiseSource(seed); return shape(highpass(noise(sec, seed), 3000), (u, t) => (r() > 0.97 ? 1 : 0.08) * Math.exp(-t * 4)); };

const SOUNDS = {
  tick: () => click(2600, 1), tock: () => click(1700, 2), clocktick: () => click(2100, 3),
  digit: () => series(0.14, [0, 0.07], i => beep(i ? 1760 : 1320)),
  digits: () => series(0.5, [0, 0.07, 0.14, 0.21, 0.28, 0.35], i => beep(1100 + (i % 3) * 330)),
  drip: () => sine(0.16, 700, { glideTo: 1500, decay: 28 }),
  drop: () => layer(0.3, [[sine(0.3, 420, { glideTo: 900, decay: 16 }), 0, 1], [sine(0.2, 180, { decay: 22 }), 0.01, 0.5]]),
  deep: () => shape(sine(1.3, 74, { glideTo: 34 }), (u, t) => Math.min(1, t * 40) * (1 - u) ** 1.5),
  zoom: () => air(0.9, 4, 200, 3200),
  whoosh0: () => air(0.55, 5, 300, 4000), whoosh1: () => air(0.8, 6, 180, 2400),
  braam: () => shape(layer(1.6, [[sine(1.6, 55), 0, 1], [sine(1.6, 110.5), 0, 0.5], [lowpass(noise(1.6, 7), 400), 0, 0.5]]), (u, t) => Math.min(1, t * 8) * (1 - u) ** 2),
  hit: () => layer(1, [[thud(50, 1, 8), 0, 1], [shape(lowpass(noise(0.4, 9), 2400), exp(14)), 0, 0.5]]),
  boom: () => thud(42, 0.9, 10),
  flash: () => layer(1.4, [[sine(1.4, 90, { glideTo: 60, decay: 3 }), 0, 1], [sine(1.4, 181, { decay: 5 }), 0, 0.4]]),
  spark: () => crackle(0.7, 11),
  paper: () => shape(highpass(noise(0.32, 12), 1800), bell),
  slap: () => layer(0.16, [[shape(lowpass(noise(0.16, 13), 2500), exp(50)), 0, 1], [sine(0.14, 150, { decay: 40 }), 0, 0.6]]),
  pop: () => sine(0.09, 420, { glideTo: 1100, decay: 40 }),
  notif: () => series(0.5, [0, 0.13], i => sine(0.3, i ? 1318 : 988, { decay: 12 })),
  stamp: () => layer(0.3, [[thud(70, 0.3, 14), 0, 1], [click(900, 15, 0.08), 0, 0.5]]),
  clock: () => series(1.2, [0, 0.5, 1], i => click(i % 2 ? 1700 : 2400, 16 + i)),
  knock: () => thud(150, 0.14, 19),
  door: () => series(0.9, [0, 0.22, 0.44], i => thud(130, 0.16, 20 + i)),
  steps: () => series(1.4, [0, 0.42, 0.84], i => thud(95, 0.15, 24 + i)),
  pen: () => shape(highpass(noise(0.9, 28), 3500), (u, t) => 0.35 + 0.65 * Math.abs(Math.sin(t * 34))),
  marker: () => shape(highpass(noise(0.5, 29), 1800), (u, t) => (0.5 + 0.5 * Math.abs(Math.sin(t * 22))) * bell(u)),
  riser: () => shape(sweep(noise(1.6, 30), u => 200 + 5000 * u * u), u => u ** 2),
  correct: () => series(0.5, [0, 0.11], i => sine(0.35, i ? 1046 : 784, { decay: 9 })),
  wrong: () => series(0.5, [0, 0.16], () => sine(0.22, 196, { decay: 8 })),
  typing: () => series(1, [0, 0.11, 0.2, 0.34, 0.43, 0.58, 0.7, 0.82], i => click(1200 + (i % 3) * 300, 31 + i, 0.04)),
  congrats: () => series(1.5, [0, 0.12, 0.24, 0.4], i => sine(0.9, [523, 659, 784, 1046][i], { decay: 5 })),
  coin: () => series(0.5, [0, 0.07], i => sine(0.4, i ? 1975 : 1318, { decay: 11 })),
  bell: () => layer(1.2, [[sine(1.2, 880, { decay: 4 }), 0, 1], [sine(1.2, 2211, { decay: 7 }), 0, 0.4], [sine(1.2, 3520, { decay: 11 }), 0, 0.2]]),
  fanhum: () => shape(layer(3, [[sine(3, 100), 0, 0.6], [sine(3, 200), 0, 0.3], [lowpass(noise(3, 40), 500), 0, 0.5]]), u => Math.min(1, u * 10, (1 - u) * 10)),
  ice: () => series(0.7, [0, 0.09, 0.2, 0.33], i => sine(0.2, 2400 + i * 500, { decay: 40 })),
  horn: () => shape(layer(0.7, [[sine(0.7, 370), 0, 1], [sine(0.7, 466), 0, 0.8]]), u => Math.min(1, u * 30, (1 - u) * 12)),
  pour: () => shape(sweep(noise(2.4, 41), u => 900 + 900 * u), u => Math.min(1, u * 6, (1 - u) * 4)),
};

fs.rmSync(SFX_DIR, { recursive: true, force: true });
fs.mkdirSync(SFX_DIR, { recursive: true });
for (const [name, make] of Object.entries(SOUNDS)) writeWav(path.join(SFX_DIR, `${name}.wav`), normalise(make()));
console.log(Object.keys(SOUNDS).length, 'sounds in', SFX_DIR);
