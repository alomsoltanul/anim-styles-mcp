#!/usr/bin/env node
// No arguments: run as an MCP server on stdio. Otherwise a small command line over the same code.
import { spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { menu } from '../src/catalog.js';
import { doctor, serve } from '../src/mcp.js';
import { mix } from '../src/mix.js';
import { newProject, openProject } from '../src/project.js';
import { stills, video } from '../src/render.js';

const HELP = `anim-styles-mcp              run the MCP server on stdio
anim-styles-mcp setup        download the render browser (about 150 MB)
anim-styles-mcp doctor       check ffmpeg, browser and voice setup
anim-styles-mcp list         every look
anim-styles-mcp new <style> <project>
anim-styles-mcp stills <project> [t1,t2,...]
anim-styles-mcp render <project> [out.mp4]`;

const [cmd, a, b] = process.argv.slice(2);
const commands = {
  setup() {
    const cli = createRequire(import.meta.url).resolve('playwright-core/cli.js');
    process.exitCode = spawnSync(process.execPath, [cli, 'install', 'chromium'], { stdio: 'inherit' }).status ?? 1;
  },
  doctor: async () => console.log(await doctor()),
  list: () => console.log(menu()),
  new: () => console.log(newProject(a, b).page),
  stills: async () => {
    const r = await stills(openProject(a), b?.split(',').map(Number));
    console.log(r.sheet, ...r.errors);
  },
  render: async () => {
    const dir = openProject(a);
    const r = await video(dir, { onProgress: (k, n) => { if (k % 60 === 0) console.error(`frame ${k}/${n}`); } });
    const m = await mix(dir, b);
    console.log(m.file, `${m.lufs} LUFS`, ...m.warnings, ...r.errors);
  },
  help: () => console.log(HELP),
  '--help': () => console.log(HELP),
};

if (!cmd) await serve();
else if (commands[cmd]) await commands[cmd]();
else { console.error(HELP); process.exitCode = 1; }
