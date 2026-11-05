// Bringing the user's own files into a project. Images and audio are copied to assets/. A video becomes frames plus a sound track,
// because a page must draw any frame at any time: shared/footage.js loads the frame for t, which a <video> element can't do reliably.
import fs from 'node:fs';
import path from 'node:path';
import { probe, runFfmpeg } from './env.js';
import { settings } from './project.js';

const VIDEO = new Set(['.mp4', '.mov', '.m4v', '.webm', '.mkv']);

export async function addMedia(dir, file, name) {
  if (!fs.existsSync(file)) throw new Error(`${file} not found.`);
  const ext = path.extname(file).toLowerCase();
  if (!VIDEO.has(ext)) {
    const assets = path.join(dir, 'assets');
    fs.mkdirSync(assets, { recursive: true });
    const dest = path.join(assets, name ? `${name}${ext}` : path.basename(file));
    fs.copyFileSync(file, dest);
    return { kind: 'asset', path: path.relative(dir, dest) };
  }
  const id = (name ?? path.basename(file, ext)).replace(/[^\w-]+/g, '-');
  const dest = path.join(dir, 'footage', id);
  fs.rmSync(dest, { recursive: true, force: true });
  fs.mkdirSync(dest, { recursive: true });
  const { fps } = settings(dir);
  const info = await probe(file);
  await runFfmpeg(['-v', 'error', '-y', '-i', file, '-vf', `fps=${fps},scale='min(1080,iw)':-2`, '-q:v', '3', path.join(dest, '%06d.jpg')]);
  if (info.audio) await runFfmpeg(['-v', 'error', '-y', '-i', file, '-vn', '-ar', '48000', '-ac', '2', '-c:a', 'pcm_s16le', path.join(dest, 'audio.wav')]);
  const frames = fs.readdirSync(dest).filter(f => f.endsWith('.jpg')).length;
  const meta = { name: id, fps, frames, dur: frames / fps, width: info.width, height: info.height, audio: info.audio };
  fs.writeFileSync(path.join(dest, 'meta.json'), JSON.stringify(meta, null, 1));
  return { kind: 'footage', path: `footage/${id}`, ...meta };
}
