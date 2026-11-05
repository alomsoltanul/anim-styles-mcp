// A local file server for pages. Each project gets an unguessable path on 127.0.0.1, and `_shared/` under it maps to this package,
// so projects hold no symlinks and a project stays a plain folder on every OS.
import { randomBytes } from 'node:crypto';
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { SHARED } from './env.js';

const TYPES = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.gif': 'image/gif',
  '.ttf': 'font/ttf', '.otf': 'font/otf', '.woff': 'font/woff', '.woff2': 'font/woff2', '.wav': 'audio/wav', '.mp3': 'audio/mpeg', '.m4a': 'audio/mp4', '.mp4': 'video/mp4',
};

const roots = new Map();   // token -> project folder
const tokens = new Map();  // project folder -> token
let listening;

// Resolves a URL path inside root, or null when it would leave root, including through a symlink.
function inside(root, rel) {
  const full = path.resolve(root, rel);
  if (full !== root && !full.startsWith(root + path.sep)) return null;
  try {
    const real = fs.realpathSync(full), realRoot = fs.realpathSync(root);
    return real === realRoot || real.startsWith(realRoot + path.sep) ? real : null;
  } catch { return null; }
}

function handle(req, res) {
  if (req.url.endsWith('/favicon.ico')) { res.writeHead(204).end(); return; }   // browsers ask for it; a 404 would read as a page error
  const [, token, ...rest] = decodeURIComponent(new URL(req.url, 'http://x').pathname).split('/').slice(1);
  const project = roots.get(token);
  const rel = rest.join('/');
  const file = !project ? null : rel === '_shared' || rel.startsWith('_shared/') ? inside(SHARED, rel.slice(8)) : inside(project, rel || 'page.html');
  if (!file || !fs.existsSync(file) || !fs.statSync(file).isFile()) { res.writeHead(404).end('not found'); return; }
  res.writeHead(200, { 'content-type': TYPES[path.extname(file).toLowerCase()] || 'application/octet-stream', 'cache-control': 'no-store' });
  fs.createReadStream(file).pipe(res);
}

function start() {
  listening ??= new Promise((resolve, reject) => {
    const server = http.createServer(handle);
    server.on('error', reject);
    server.listen(0, '127.0.0.1', () => { server.unref(); resolve(server.address().port); });
  });
  return listening;
}

// Base URL for a project folder, with no trailing slash.
export async function urlFor(dir) {
  const port = await start();
  if (!tokens.has(dir)) { const t = randomBytes(12).toString('hex'); tokens.set(dir, t); roots.set(t, dir); }
  return `http://127.0.0.1:${port}/p/${tokens.get(dir)}`;
}
