// The one list of looks. Menu numbers are catalog order, so new looks go at the end of catalog.json.
import fs from 'node:fs';
import path from 'node:path';
import { CARDS_DIR, GALLERY_DIR, ROOT, STYLES_DIR } from './env.js';

export const STYLES = JSON.parse(fs.readFileSync(path.join(ROOT, 'catalog.json'), 'utf8'));
export const GROUPS = ['Teach one idea', 'Numbers and facts', 'Stories with characters', 'Big hooks', 'Calm and abstract', 'With your talking video', 'Promo films'];

const FILLER = new Set(['style', 'styles', 'look', 'design', 'format', 'in', 'the', 'make', 'this', 'video', 'a', 'an']);
const norm = s => String(s).toLowerCase().replace(/[^\p{L}\p{N}]+/gu, ' ').split(' ').filter(w => w && !FILLER.has(w)).join(' ');

export function find(name) {
  const raw = String(name).trim();
  if (/^\d+$/.test(raw)) { const s = STYLES[+raw - 1]; return s ? [s] : []; }
  const q = norm(raw);
  if (!q) return [];
  const names = s => [s.id, s.name, ...(s.aliases || [])].map(norm);
  const exact = STYLES.filter(s => names(s).includes(q));
  if (exact.length) return exact;
  return STYLES.filter(s => names(s).some(n => n.includes(q) || (n.length > 2 && q.includes(n))));
}

export function one(name) {
  const hits = find(name);
  if (hits.length === 1) return hits[0];
  throw new Error(hits.length
    ? `"${name}" matches ${hits.map(s => s.id).join(', ')}. Pick one.`
    : `No style called "${name}". Call list_styles to see them all.`);
}

export function grouped() {
  const names = [...GROUPS, ...new Set(STYLES.map(s => s.group).filter(g => !GROUPS.includes(g)))];
  return names
    .map(g => [g, STYLES.flatMap((s, i) => s.group === g ? [[i + 1, s]] : [])])
    .filter(([, items]) => items.length);
}

export function menu() {
  return grouped().map(([g, items]) => `**${g}**\n${items.map(([n, s]) => `- **${n}** ${s.name} (\`${s.id}\`): ${s.use}`).join('\n')}`).join('\n\n');
}

export const card = id => fs.readFileSync(path.join(CARDS_DIR, `${id}.md`), 'utf8');
export const rules = () => fs.readFileSync(path.join(CARDS_DIR, '_rules.md'), 'utf8');
export const frame = id => path.join(GALLERY_DIR, `${id}.jpg`);
export const starter = id => path.join(STYLES_DIR, id);
