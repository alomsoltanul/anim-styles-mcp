// Builds gallery/all-styles.jpg, the numbered picture sheet, from catalog.json and gallery/<id>.jpg. Run: npm run sheet
import fs from 'node:fs';
import path from 'node:path';
import { grouped } from '../src/catalog.js';
import { GALLERY_DIR, SHARED } from '../src/env.js';
import { launch } from '../src/render.js';

const data = (file, type) => `data:${type};base64,${fs.readFileSync(file).toString('base64')}`;
const COLUMNS = 6, TILE = 228;

const tile = ([n, s]) => {
  const pic = path.join(GALLERY_DIR, `${s.id}.jpg`);
  return `<figure><figcaption><b>${n}</b><span>${s.name}</span></figcaption>${fs.existsSync(pic) ? `<img src="${data(pic, 'image/jpeg')}">` : '<i></i>'}</figure>`;
};

const html = `<!doctype html><meta charset="utf-8"><style>
@font-face{font-family:M;src:url(${data(path.join(SHARED, 'fonts/Montserrat.ttf'), 'font/ttf')});font-weight:100 900}
*{box-sizing:border-box;margin:0}
body{background:#0e0e12;color:#fff;font:800 16px M;padding:14px;width:${COLUMNS * TILE + (COLUMNS + 1) * 14}px}
h2{color:#ffc45c;font-size:30px;font-weight:800;margin:20px 0 8px}
h2:first-child{margin-top:4px}
section{display:grid;grid-template-columns:repeat(${COLUMNS},${TILE}px);gap:14px}
figure{min-width:0}
figcaption{display:flex;gap:8px;align-items:center;height:42px}
figcaption span{font-size:14px;line-height:1.1}
b{background:#fff;color:#0e0e12;border-radius:8px;min-width:36px;height:28px;display:grid;place-items:center;font-size:17px}
img,i{display:block;width:100%;height:405px;object-fit:contain;background:#000}
</style>${grouped().map(([g, items]) => `<h2>${g}</h2><section>${items.map(tile).join('')}</section>`).join('')}`;

const browser = await launch();
const page = await browser.newPage({ viewport: { width: COLUMNS * TILE + (COLUMNS + 1) * 14, height: 800 }, deviceScaleFactor: 1 });
await page.setContent(html, { waitUntil: 'load' });
await page.evaluate(() => document.fonts.ready);
const out = path.join(GALLERY_DIR, 'all-styles.jpg');
await page.screenshot({ path: out, type: 'jpeg', quality: 86, fullPage: true });
await browser.close();
console.log(out);
