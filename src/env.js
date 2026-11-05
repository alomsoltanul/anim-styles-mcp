// Where things live, and how to reach ffmpeg.
import { spawn, spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const SHARED = path.join(ROOT, 'shared');
export const STYLES_DIR = path.join(ROOT, 'styles');
export const CARDS_DIR = path.join(ROOT, 'cards');
export const GALLERY_DIR = path.join(ROOT, 'gallery');
export const SFX_DIR = path.join(ROOT, 'assets', 'sfx');
export const HOME = path.resolve(process.env.ANIM_HOME || path.join(os.homedir(), 'anim-styles-projects'));

let ffmpegPath;
export function ffmpeg() {
  if (ffmpegPath !== undefined) return ffmpegPath;
  const candidates = [process.env.ANIM_FFMPEG, 'ffmpeg'];
  try { candidates.push(createRequire(import.meta.url)('ffmpeg-static')); } catch { /* optional dependency */ }
  ffmpegPath = candidates.find(c => c && spawnSync(c, ['-version'], { stdio: 'ignore' }).status === 0) ?? null;
  return ffmpegPath;
}

export function requireFfmpeg() {
  const bin = ffmpeg();
  if (!bin) throw new Error('ffmpeg not found. Install it (brew install ffmpeg, apt install ffmpeg, winget install ffmpeg) or set ANIM_FFMPEG.');
  return bin;
}

// Runs ffmpeg and resolves with its stderr, which is where it reports everything we read.
export function runFfmpeg(args, { ok = [0] } = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(requireFfmpeg(), ['-hide_banner', ...args], { stdio: ['ignore', 'ignore', 'pipe'] });
    let err = '';
    child.stderr.on('data', d => { err += d; if (err.length > 2e6) err = err.slice(-1e6); });
    child.on('error', reject);
    child.on('close', code => ok.includes(code) ? resolve(err) : reject(new Error(`ffmpeg failed (${code}): ${err.slice(-1500)}`)));
  });
}

// Duration, size and whether there is sound. `ffmpeg -i` with no output exits 1, so that code is expected.
export async function probe(file) {
  const log = await runFfmpeg(['-i', file], { ok: [0, 1] });
  const d = /Duration: (\d+):(\d+):([\d.]+)/.exec(log);
  const v = /Video:.*?(\d{2,5})x(\d{2,5})/.exec(log);
  const f = /([\d.]+) fps/.exec(log);
  return {
    duration: d ? +d[1] * 3600 + +d[2] * 60 + +d[3] : 0,
    width: v ? +v[1] : 0,
    height: v ? +v[2] : 0,
    fps: f ? +f[1] : 0,
    video: !!v,
    audio: /Stream #.*Audio:/.test(log),
  };
}

// Integrated loudness and true peak. A clip under about 0.4 s has no integrated value, so lufs comes back NaN or -70.
export async function loudnessOf(file) {
  const log = await runFfmpeg(['-nostats', '-i', file, '-af', 'ebur128=peak=true:framelog=quiet', '-f', 'null', '-']);
  const tail = log.slice(log.lastIndexOf('Summary:'));
  return { lufs: +(/I:\s+(-?[\d.]+) LUFS/.exec(tail)?.[1] ?? NaN), peak: +(/Peak:\s+(-?[\d.]+) dBFS/.exec(tail)?.[1] ?? NaN) };
}
