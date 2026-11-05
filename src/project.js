// A project is a plain folder: page.html, style.json, and whatever the page loads. `_shared/` is served by this package, not copied.
import fs from 'node:fs';
import path from 'node:path';
import { one, starter } from './catalog.js';
import { HOME, ROOT } from './env.js';

const DEFAULTS = { sub: 2, fps: 30, size: [1080, 1920] };

export function projectDir(name) {
  if (!name) throw new Error('Give a project name or path.');
  return path.resolve(HOME, name);
}

export function openProject(name) {
  const dir = projectDir(name);
  if (!fs.existsSync(path.join(dir, 'page.html'))) throw new Error(`${dir} has no page.html. Start one with new_project.`);
  return dir;
}

export function settings(dir) {
  let saved = {};
  try { saved = JSON.parse(fs.readFileSync(path.join(dir, 'style.json'), 'utf8')); } catch { /* a bare page uses the defaults */ }
  return { ...DEFAULTS, ...saved };
}

export function newProject(styleName, folder, { brand } = {}) {
  const s = one(styleName);
  const dest = projectDir(folder);
  if (fs.existsSync(dest) && fs.readdirSync(dest).length) throw new Error(`${dest} is not empty, nothing written.`);
  fs.mkdirSync(dest, { recursive: true });
  fs.cpSync(starter(s.id), dest, { recursive: true });
  const saved = { style: s.id, sub: s.sub ?? DEFAULTS.sub, fps: s.fps ?? DEFAULTS.fps, size: s.size ?? DEFAULTS.size };
  fs.writeFileSync(path.join(dest, 'style.json'), JSON.stringify(saved, null, 1));
  if (brand) writeBrand(dest, brand);
  return { dir: dest, page: path.join(dest, 'page.html'), style: s };
}

// Promo starters read window.BRAND from brand.js. The values given here go over the starter's own placeholders.
export function writeBrand(dir, brand) {
  const file = path.join(dir, 'brand.js');
  const base = fs.existsSync(file) ? JSON.parse(/\{[\s\S]*\}/.exec(fs.readFileSync(file, 'utf8'))?.[0] ?? '{}') : {};
  const merged = { ...base, ...brand, colors: { ...base.colors, ...brand.colors } };
  fs.writeFileSync(file, `window.BRAND = ${JSON.stringify(merged, null, 1)};\n`);
}

// Path inside a project, for tools that read or write there. Refuses anything that would leave the folder.
export function fileIn(dir, rel) {
  const full = path.resolve(dir, rel);
  if (full === dir || !full.startsWith(dir + path.sep)) throw new Error(`${rel} is outside the project.`);
  return full;
}

export const version = () => JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8')).version;
