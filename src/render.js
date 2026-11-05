// Page -> frames -> video. A page exposes window.prepare() -> { dur, cues } and window.seek(t), and draws from t alone,
// so any frame can be rendered in any order and subframes can be blended for motion blur.
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright-core';
import { requireFfmpeg, runFfmpeg } from './env.js';
import { settings } from './project.js';
import { urlFor } from './serve.js';

const SHUTTER = 0.5;
const GPU = { darwin: ['--enable-gpu', '--use-angle=metal'], win32: ['--enable-gpu', '--use-angle=d3d11'] }[process.platform]
  ?? ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'];
const ARGS = ['--force-color-profile=srgb', '--disable-lcd-text', '--font-render-hinting=none', '--enable-gpu-rasterization', '--ignore-gpu-blocklist', ...GPU];

export async function launch() {
  const tries = [
    process.env.ANIM_CHROME && { executablePath: process.env.ANIM_CHROME },
    { channel: 'chromium' },   // the browser from `anim-styles-mcp setup`
    { channel: 'chrome' },     // or the user's own Chrome
  ].filter(Boolean);
  let last;
  for (const how of tries) {
    try { return await chromium.launch({ ...how, args: ARGS }); } catch (e) { last = e; }
  }
  throw new Error(`No browser found. Run: npx anim-styles-mcp setup\n(${String(last).split('\n')[0]})`);
}

async function open(dir) {
  const { size: [width, height] } = settings(dir);
  const browser = await launch();
  const page = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: 1 });
  const errors = [];
  page.on('pageerror', e => errors.push(String(e)));
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  // Pages render from local files only: a render never depends on, or talks to, the network.
  await page.route('**/*', route => {
    const u = new URL(route.request().url());
    return u.hostname === '127.0.0.1' || u.protocol === 'data:' || u.protocol === 'blob:' ? route.continue() : route.abort();
  });
  await page.goto(`${await urlFor(dir)}/page.html?render=1`, { waitUntil: 'load' });
  const info = await page.evaluate(() => {
    if (!window.prepare || !window.seek) throw new Error('page must define window.prepare() and window.seek(t)');
    return window.prepare();
  });
  const dur = info?.dur ?? info?.duration;
  if (!(dur > 0)) throw new Error('prepare() must return { dur } in seconds');
  // Retried, because a sleeping laptop or a busy machine can stall one frame, and that must not kill a long render.
  const shot = async t => {
    for (let tries = 0; ; tries++) {
      try {
        await page.evaluate(x => window.seek(x), t);
        return await page.screenshot({ type: 'png', animations: 'disabled', caret: 'hide', timeout: 60000 });
      } catch (e) {
        if (tries >= 4 || !/timeout/i.test(String(e))) throw e;
        await new Promise(r => setTimeout(r, 5000));
      }
    }
  };
  return { browser, shot, dur, cues: info.cues ?? [], errors };
}

const stamp = t => t.toFixed(2).padStart(6, '0');

export async function stills(dir, times) {
  const qa = path.join(dir, 'qa');
  fs.mkdirSync(qa, { recursive: true });
  const { browser, shot, dur, errors } = await open(dir);
  try {
    const list = (times?.length ? times : [0, dur / 2, dur - 0.3]).map(t => Math.min(Math.max(t, 0), dur - 1e-3));
    const files = [];
    for (const t of list) {
      const f = path.join(qa, `${stamp(t)}.png`);
      fs.writeFileSync(f, await shot(t));
      files.push(f);
    }
    const sheet = path.join(qa, 'sheet.jpg');
    await tile(files, sheet);
    return { dur, times: list, files, sheet, errors };
  } finally { await browser.close(); }
}

export async function tile(files, out) {
  const scaled = files.map((_, i) => `[${i}:v]scale=360:-2[s${i}]`).join(';');
  const join = files.length > 1 ? `;${files.map((_, i) => `[s${i}]`).join('')}hstack=inputs=${files.length}[o]` : '';
  await runFfmpeg(['-y', ...files.flatMap(f => ['-i', f]), '-filter_complex', scaled + join, '-map', files.length > 1 ? '[o]' : '[s0]', '-frames:v', '1', '-q:v', '3', out]);
}

// Silent H.264 plus silent.mp4.cues.json, which the mixer reads. onProgress(frame, total) is called as frames land.
export async function video(dir, { onProgress, fps: fpsArg, sub: subArg } = {}) {
  const set = settings(dir), fps = fpsArg ?? set.fps, sub = subArg ?? set.sub;
  const out = path.join(dir, 'silent.mp4');
  const { browser, shot, dur, cues, errors } = await open(dir);
  try {
    fs.writeFileSync(`${out}.cues.json`, JSON.stringify({ dur, cues }, null, 1));
    const total = Math.round(dur * fps);
    const offsets = sub > 1 ? Array.from({ length: sub }, (_, i) => (i / (sub - 1) - 0.5) * SHUTTER / fps) : [0];
    const blur = sub > 1 ? ['-vf', `tmix=frames=${sub},select='eq(mod(n\\,${sub})\\,${sub - 1})',setpts=N/(${fps}*TB)`] : [];
    const enc = spawn(requireFfmpeg(), ['-v', 'error', '-y', '-f', 'image2pipe', '-c:v', 'png', '-framerate', String(fps * sub), '-i', '-', ...blur,
      '-r', String(fps), '-c:v', 'libx264', '-preset', 'medium', '-crf', '16', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', out], { stdio: ['pipe', 'ignore', 'pipe'] });
    let log = '';
    enc.stderr.on('data', d => { log += d; });
    const finished = new Promise((resolve, reject) => {
      enc.on('error', reject);
      enc.on('close', code => code === 0 ? resolve() : reject(new Error(`encoder failed: ${log.slice(-800)}`)));
    });
    for (let k = 0; k < total; k++) {
      for (const o of offsets) {
        const buf = await shot(Math.min(Math.max(0, k / fps + o), dur - 1e-3));
        if (!enc.stdin.write(buf)) await new Promise(r => enc.stdin.once('drain', r));
      }
      onProgress?.(k + 1, total);
    }
    enc.stdin.end();
    await finished;
    return { file: out, dur, frames: total, fps, sub, cues: cues.length, errors };
  } finally { await browser.close(); }
}
