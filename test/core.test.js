import assert from 'node:assert/strict';
import fs from 'node:fs';
import http from 'node:http';
import os from 'node:os';
import path from 'node:path';
import { after, before, describe, it } from 'node:test';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'anim-test-'));
process.env.ANIM_HOME = tmp;

const { STYLES, GROUPS, find, one, menu } = await import('../src/catalog.js');
const { CARDS_DIR, GALLERY_DIR, ROOT, SFX_DIR, STYLES_DIR, ffmpeg, probe } = await import('../src/env.js');
const { fileIn, newProject, openProject, settings, writeBrand } = await import('../src/project.js');
const { urlFor } = await import('../src/serve.js');
const { addVoice, provider } = await import('../src/voice.js');
const { CUES } = await import('../src/mix.js');

after(() => fs.rmSync(tmp, { recursive: true, force: true }));

describe('catalog', () => {
  it('has unique ids and known groups', () => {
    assert.equal(new Set(STYLES.map(s => s.id)).size, STYLES.length);
    for (const s of STYLES) assert.ok(GROUPS.includes(s.group), s.id);
  });
  it('gives every look a starter, a card and a target frame', () => {
    for (const { id } of STYLES) {
      assert.ok(fs.existsSync(path.join(STYLES_DIR, id, 'page.html')), `${id} page`);
      assert.ok(fs.existsSync(path.join(CARDS_DIR, `${id}.md`)), `${id} card`);
      assert.ok(fs.existsSync(path.join(GALLERY_DIR, `${id}.jpg`)), `${id} frame`);
    }
  });
  it('finds a look by number, id, alias and loose wording', () => {
    assert.equal(find('1')[0].id, 'chalkboard');
    assert.equal(one('chalkboard').id, 'chalkboard');
    assert.equal(one('8-bit').id, 'pixel');
    assert.equal(one('in pixel art style').id, 'pixel');
    assert.deepEqual(find('999'), []);
    assert.throws(() => one('no such look'), /No style/);
  });
  it('lists every look in the menu', () => {
    for (const s of STYLES) assert.ok(menu().includes(s.name), s.id);
  });
  it('has a sound file for every cue kind', () => {
    for (const k of Object.keys(CUES)) assert.ok(fs.existsSync(path.join(SFX_DIR, `${k === 'whoosh' ? 'whoosh0' : k}.wav`)), k);
  });
});

describe('projects', () => {
  it('copies a starter and saves the look settings', () => {
    const { dir } = newProject('paper-cut', 'p1');
    assert.equal(openProject('p1'), dir);
    assert.equal(settings(dir).fps, 12);
    assert.equal(settings(dir).sub, 1);
  });
  it('refuses to overwrite a project', () => {
    assert.throws(() => newProject('pixel', 'p1'), /not empty/);
  });
  it('keeps file access inside the project', () => {
    const dir = openProject('p1');
    assert.throws(() => fileIn(dir, '../outside.txt'), /outside/);
    assert.throws(() => fileIn(dir, '/etc/passwd'), /outside/);
    assert.equal(fileIn(dir, 'a/b.txt'), path.join(dir, 'a/b.txt'));
  });
  it('merges a brand over the placeholders', () => {
    const { dir } = newProject('promo-glass', 'p2', { brand: { name: 'Acme', colors: { accent: '#00ff00' } } });
    const brand = JSON.parse(/\{[\s\S]*\}/.exec(fs.readFileSync(path.join(dir, 'brand.js'), 'utf8'))[0]);
    assert.equal(brand.name, 'Acme');
    assert.equal(brand.colors.accent, '#00ff00');
    assert.ok(brand.colors.bg, 'other colours stay');
    writeBrand(dir, { url: 'acme.test' });
    assert.match(fs.readFileSync(path.join(dir, 'brand.js'), 'utf8'), /Acme[\s\S]*acme\.test|acme\.test[\s\S]*Acme/);
  });
});

describe('file server', () => {
  let dir, base;
  before(async () => {
    ({ dir } = newProject('pixel', 'serve'));
    fs.writeFileSync(path.join(tmp, 'secret.txt'), 'secret');
    fs.symlinkSync(path.join(tmp, 'secret.txt'), path.join(dir, 'link.txt'));
    base = await urlFor(dir);
  });
  const status = url => new Promise((resolve, reject) => {
    const u = new URL(url);
    http.get({ host: u.hostname, port: u.port, path: url.slice(u.origin.length) }, r => { r.resume(); resolve(r.statusCode); }).on('error', reject);
  });
  it('serves the page and the shared files', async () => {
    assert.equal(await status(`${base}/page.html`), 200);
    assert.equal(await status(`${base}/_shared/common.js`), 200);
  });
  it('listens on localhost only', () => assert.match(base, /^http:\/\/127\.0\.0\.1:/));
  it('refuses traversal, a symlink out, and an unknown project', async () => {
    assert.equal(await status(`${base}/%2e%2e/secret.txt`), 404);
    assert.equal(await status(`${base}/_shared/%2e%2e/package.json`), 404);
    assert.equal(await status(`${base}/link.txt`), 404);
    assert.equal(await status(`${new URL(base).origin}/p/nope/page.html`), 404);
  });
});

describe('voice', { skip: !ffmpeg() && 'ffmpeg missing' }, () => {
  const clear = () => { for (const k of ['ANIM_TTS_CMD', 'ANIM_TTS_URL', 'ANIM_TTS_KEY', 'ANIM_TTS_MODEL', 'ANIM_TTS_VOICE']) delete process.env[k]; };
  const tone = path.join(tmp, 'tone.wav');
  before(async () => {
    clear();
    const { runFfmpeg } = await import('../src/env.js');
    await runFfmpeg(['-v', 'error', '-y', '-f', 'lavfi', '-i', 'sine=440:d=1', tone]);
  });
  after(clear);

  it('ships no provider, so a line with only text asks for a file', async () => {
    assert.equal(provider(), null);
    const { dir } = newProject('pixel', 'v0');
    await assert.rejects(addVoice(dir, [{ text: 'hello' }]), /needs a `file`/);
  });
  it('takes the user\'s own files and lays them out in order', async () => {
    const { dir } = newProject('pixel', 'v1');
    const r = await addVoice(dir, [{ text: 'one', file: tone }, { file: tone, at: 5 }, { file: tone }]);
    assert.equal(r.lines[1].start, 5);
    assert.ok(r.lines[2].start > 6);
    const mod = await import(path.join(dir, 'vo', 'timing.js'));
    assert.equal(mod.LINES.length, 3);
    assert.ok(mod.ENV.some(v => v > 0.5));
  });
  it('runs ANIM_TTS_CMD without a shell, so text can\'t inject', async () => {
    const marker = path.join(tmp, 'injected');
    process.env.ANIM_TTS_CMD = `${ffmpeg()} -v error -y -f lavfi -i sine=330:d=1 -f wav {out}`;
    const { dir } = newProject('pixel', 'v2');
    const r = await addVoice(dir, [{ text: `hi"; touch ${marker}; echo "` }]);
    assert.equal(r.lines.length, 1);
    assert.ok(!fs.existsSync(marker));
    clear();
  });
  it('calls an OpenAI-compatible speech endpoint with the user\'s settings', async () => {
    let body, auth;
    const server = http.createServer((req, res) => {
      auth = req.headers.authorization;
      let raw = '';
      req.on('data', d => { raw += d; });
      req.on('end', () => { body = JSON.parse(raw); res.writeHead(200, { 'content-type': 'audio/wav' }); fs.createReadStream(tone).pipe(res); });
    });
    await new Promise(r => server.listen(0, '127.0.0.1', r));
    Object.assign(process.env, { ANIM_TTS_URL: `http://127.0.0.1:${server.address().port}/v1/audio/speech`, ANIM_TTS_KEY: 'k', ANIM_TTS_MODEL: 'm', ANIM_TTS_VOICE: 'v' });
    const { dir } = newProject('pixel', 'v3');
    const r = await addVoice(dir, [{ text: 'hello there' }]);
    server.close();
    clear();
    assert.deepEqual(body, { input: 'hello there', model: 'm', voice: 'v', response_format: 'wav' });
    assert.equal(auth, 'Bearer k');
    assert.ok(r.lines[0].dur > 0.9);
  });
});

describe('MCP over stdio', () => {
  let client;
  before(async () => {
    client = new Client({ name: 'test', version: '1' });
    await client.connect(new StdioClientTransport({ command: process.execPath, args: [path.join(ROOT, 'bin/cli.js')], env: { ...process.env, ANIM_HOME: tmp } }));
  });
  after(() => client.close());
  const call = (name, args = {}) => client.callTool({ name, arguments: args });

  it('offers the tools and the prompt', async () => {
    const { tools } = await client.listTools();
    for (const n of ['list_styles', 'get_style', 'new_project', 'read_file', 'write_file', 'add_media', 'add_voice', 'preview', 'stills', 'render', 'render_status', 'check_video', 'doctor']) {
      assert.ok(tools.some(t => t.name === n), n);
    }
    assert.ok((await client.listPrompts()).prompts.some(p => p.name === 'make_video'));
  });
  it('lists every look with a picture', async () => {
    const r = await call('list_styles');
    assert.match(r.content[0].text, /Chalkboard/);
    assert.equal(r.content[1].type, 'image');
  });
  it('gives a card with the rules and the target frame', async () => {
    const r = await call('get_style', { style: 'chalkboard' });
    assert.match(r.content[0].text, /Rules every look keeps/);
    assert.equal(r.content[1].type, 'image');
  });
  it('reports errors as tool errors', async () => {
    assert.equal((await call('get_style', { style: 'nope' })).isError, true);
    assert.equal((await call('stills', { project: 'missing' })).isError, true);
  });
  it('makes a project and edits it through the file tools', async () => {
    await call('new_project', { style: 'pixel', project: 'mcp1' });
    await call('write_file', { project: 'mcp1', path: 'notes/a.txt', content: 'hi' });
    assert.equal((await call('read_file', { project: 'mcp1', path: 'notes/a.txt' })).content[0].text, 'hi');
    assert.equal((await call('write_file', { project: 'mcp1', path: '../../x.txt', content: 'no' })).isError, true);
  });
  it('renders stills end to end', { timeout: 120000 }, async () => {
    const r = await call('stills', { project: 'mcp1', times: [1] });
    assert.ok(!r.isError, r.content[0].text);
    assert.equal(r.content[1].type, 'image');
  });
  it('renders and mixes a real video', { timeout: 300000 }, async () => {
    await call('new_project', { style: 'minimal', project: 'mcp2' });
    const dir = path.join(tmp, 'mcp2');
    const page = path.join(dir, 'page.html');
    fs.writeFileSync(path.join(dir, 'style.json'), JSON.stringify({ sub: 1, fps: 5 }));
    fs.writeFileSync(page, '<canvas id=c width=1080 height=1920></canvas><script>const x=c.getContext("2d");window.prepare=()=>({dur:1,cues:[{t:.2,k:"pop"}]});window.seek=t=>{x.fillStyle="#123";x.fillRect(0,0,1080,1920);x.fillStyle="#fff";x.fillRect(t*900,900,100,100)}</script>');
    const r = await call('render', { project: 'mcp2' });
    assert.ok(!r.isError, r.content[0].text);
    const info = await probe(path.join(dir, 'final.mp4'));
    assert.equal(info.width, 1080);
    assert.ok(info.audio);
    assert.ok(Math.abs(info.duration - 1) < 0.2);
  });
});

describe('repo', () => {
  it('holds no machine-specific paths', () => {
    const walk = d => fs.readdirSync(d, { withFileTypes: true }).flatMap(e => e.name === 'node_modules' || e.name === 'projects' || e.name === '.git' ? [] : e.isDirectory() ? walk(path.join(d, e.name)) : [path.join(d, e.name)]);
    const bad = walk(ROOT).filter(f => /\.(js|html|md|json|css)$/.test(f) && f !== path.join(ROOT, 'test/core.test.js') && !f.includes(`${path.sep}vendor${path.sep}`))
      .filter(f => /\/Users\/|\/home\/[a-z]/.test(fs.readFileSync(f, 'utf8')));
    assert.deepEqual(bad, []);
  });
  it('ships audio only from the synth', () => {
    const made = fs.readFileSync(path.join(ROOT, 'tools/make-sfx.js'), 'utf8');
    for (const f of fs.readdirSync(SFX_DIR)) assert.ok(made.includes(`${path.basename(f, '.wav')}:`), f);
  });
});
