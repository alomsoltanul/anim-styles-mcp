// The MCP surface. The client's model writes the page; this server supplies the looks, renders, mixes and shows the result.
import fs from 'node:fs';
import path from 'node:path';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import { STYLES, card, find, frame, menu, one, rules } from './catalog.js';
import { GALLERY_DIR, HOME, ffmpeg } from './env.js';
import { addMedia } from './media.js';
import { check, mix } from './mix.js';
import { fileIn, newProject, openProject, settings, version } from './project.js';
import { launch, stills, video } from './render.js';
import { urlFor } from './serve.js';
import { addVoice, provider } from './voice.js';

const WAIT_MS = 40000;   // tool calls return before common client timeouts; a longer render continues as a job

const INSTRUCTIONS = `Makes short animated videos in named looks, all local.
Flow: list_styles, get_style (read the card and the target frame), new_project, edit page.html (your own file tools, or read_file/write_file), stills (look at the sheet, fix, repeat), optional add_voice and add_media, render, check_video.
Keep the look and swap the subject. Report the file path, and say that sound was measured, not heard.`;

const text = t => ({ type: 'text', text: t });
const image = file => ({ type: 'image', data: fs.readFileSync(file).toString('base64'), mimeType: file.endsWith('.png') ? 'image/png' : 'image/jpeg' });
const reply = (...content) => ({ content });
const failure = e => ({ isError: true, content: [text(e.message ?? String(e))] });
const guarded = fn => async args => { try { return await fn(args); } catch (e) { return failure(e); } };
const errorsNote = errors => errors?.length ? `\nPage errors:\n${errors.slice(0, 5).join('\n')}` : '';

const jobs = new Map();
let nextJob = 1;

function startRender(dir, { out, fps, sub }) {
  const running = [...jobs.values()].find(j => j.dir === dir && j.state !== 'done' && j.state !== 'failed');
  if (running) return running;
  const job = { id: `render-${nextJob++}`, dir, state: 'rendering', frame: 0, total: 0 };
  job.done = (async () => {
    try {
      const r = await video(dir, { fps, sub, onProgress: (frame, total) => Object.assign(job, { frame, total }) });
      job.state = 'mixing';
      const m = await mix(dir, out);
      job.result = { ...r, ...m };
      job.state = 'done';
    } catch (e) { job.error = e.message; job.state = 'failed'; }
  })();
  jobs.set(job.id, job);
  return job;
}

async function jobReply(job) {
  await Promise.race([job.done, new Promise(r => setTimeout(r, WAIT_MS).unref())]);
  if (job.state === 'failed') throw new Error(`${job.id} failed: ${job.error}`);
  if (job.state !== 'done') return reply(text(`${job.id} is ${job.state}, frame ${job.frame} of ${job.total || '?'}. Call render_status with this job id to wait for it.`));
  const r = job.result;
  const lines = [`Done: ${r.file}`, `${r.dur.toFixed(2)} s, ${r.frames} frames at ${r.fps} fps, ${r.sounds} sounds, ${r.lufs} LUFS, ${r.peak} dBFS true peak.`, ...r.warnings];
  return reply(text(lines.join('\n') + errorsNote(r.errors)));
}

export function createServer() {
  const server = new McpServer({ name: 'anim-styles', version: version() }, { instructions: INSTRUCTIONS });
  const tool = (name, description, inputSchema, fn, readOnlyHint = false) =>
    server.registerTool(name, { description, inputSchema, annotations: { readOnlyHint } }, guarded(fn));

  tool('list_styles', 'Numbered menu of every look, grouped by purpose, with a picture sheet. Show this when the user has not picked a look or asks what is available.',
    { picture: z.boolean().default(true).describe('Include the picture sheet') },
    async ({ picture }) => {
      const sheet = path.join(GALLERY_DIR, 'all-styles.jpg');
      return reply(text(`${menu()}\n\nReply with a number and a topic, for example: 1: how vaccines work`), ...(picture && fs.existsSync(sheet) ? [image(sheet)] : []));
    }, true);

  tool('get_style', 'One look in full: the rules that make it that look, what to keep and swap, and its target frame. Takes a name, alias or menu number. Read this before editing a page.',
    { style: z.string().describe('Name, alias or menu number') },
    async ({ style }) => {
      const hits = find(style);
      if (hits.length > 1) return reply(text(`"${style}" matches: ${hits.map(s => `${s.id} (${s.name})`).join(', ')}. Ask which one.`));
      const s = one(style);
      const pic = frame(s.id);
      return reply(text(`${card(s.id)}\n\n---\n\n${rules()}`), ...(fs.existsSync(pic) ? [image(pic)] : []));
    }, true);

  tool('new_project', 'Start a project from a look\'s working starter page. Returns the folder; edit page.html there, swapping the subject and keeping the look.',
    {
      style: z.string().describe('Name, alias or menu number'),
      project: z.string().describe(`Folder name, kept under ${HOME}, or an absolute path`),
      brand: z.object({
        name: z.string().optional(), tagline: z.string().optional(), url: z.string().optional(), cta: z.string().optional(),
        logo: z.string().optional().describe('Path inside the project, after add_media'),
        colors: z.object({ bg: z.string().optional(), ink: z.string().optional(), accent: z.string().optional(), paper: z.string().optional() }).optional(),
        products: z.array(z.object({ title: z.string(), sub: z.string().optional(), image: z.string().optional() })).optional(),
      }).optional().describe('Promo looks only: your brand, written to brand.js'),
    },
    async ({ style, project, brand }) => {
      const { dir, page, style: s } = newProject(style, project, { brand });
      return reply(text(`${s.name} project ready.\nFolder: ${dir}\nPage: ${page}\nRead get_style for what to keep and swap, then call stills.`));
    });

  tool('read_file', 'Read a text file from a project, for clients with no file tools of their own.',
    { project: z.string(), path: z.string().default('page.html') },
    async ({ project, path: rel }) => reply(text(fs.readFileSync(fileIn(openProject(project), rel), 'utf8'))), true);

  tool('write_file', 'Write a text file inside a project, for clients with no file tools of their own. Cannot write outside the project folder.',
    { project: z.string(), path: z.string().default('page.html'), content: z.string() },
    async ({ project, path: rel, content }) => {
      const f = fileIn(openProject(project), rel);
      fs.mkdirSync(path.dirname(f), { recursive: true });
      fs.writeFileSync(f, content);
      return reply(text(`Wrote ${f}`));
    });

  tool('add_media', 'Bring the user\'s own file into a project. Images and audio go to assets/. A video becomes frames in footage/<name>/ plus audio.wav; draw it with shared/footage.js and add its sound through sound.json tracks.',
    { project: z.string(), file: z.string().describe('Absolute path to the file'), name: z.string().optional().describe('Short name to use in the page') },
    async ({ project, file, name }) => reply(text(JSON.stringify(await addMedia(openProject(project), file, name), null, 1))));

  tool('add_voice', `Add narration. No voice ships with this server: each line takes a \`file\` (a recording, or audio from any TTS tool the user has). Lines with only \`text\` use the provider set in this server's env. Writes vo/timing.js with line times and a mouth envelope, and the mixer places the clips. Replaces any earlier narration. Current provider: ${provider() ?? 'none'}.`,
    {
      project: z.string(),
      lines: z.array(z.object({
        text: z.string().optional().describe('What is said; needed when there is no file'),
        file: z.string().optional().describe('Absolute path to the audio for this line'),
        at: z.number().optional().describe('Start time in seconds; default follows the last line'),
      })).min(1),
      gap: z.number().min(0).default(0.1).describe('Seconds between lines that have no `at`'),
    },
    async ({ project, lines, gap }) => {
      const r = await addVoice(openProject(project), lines, { gap });
      return reply(text(`${r.lines.length} lines, ${r.dur} s in all. A page with a fixed dur needs at least ${r.dur}; the story looks fit themselves to the voice.\n${JSON.stringify(r.lines)}`));
    });

  tool('preview', 'A local URL that plays the page live in a browser. It works while this server runs.',
    { project: z.string() },
    async ({ project }) => reply(text(`${await urlFor(openProject(project))}/page.html`)), true);

  tool('stills', 'Render frames and return them as one sheet. Do this after every change and compare with the target frame: does it still look like the style, can the text be read on a phone?',
    { project: z.string(), times: z.array(z.number()).max(8).optional().describe('Seconds; default is start, middle, end') },
    async ({ project, times }) => {
      const r = await stills(openProject(project), times);
      return reply(text(`Clip is ${r.dur.toFixed(2)} s. Frames at ${r.times.map(t => t.toFixed(2)).join(', ')}.${errorsNote(r.errors)}`), image(r.sheet));
    });

  tool('render', 'Render the page to video with motion blur and mix the sound. Returns when done, or a job id if it takes longer than about 40 s.',
    {
      project: z.string(),
      out: z.string().default('final.mp4').describe('File name inside the project'),
      fps: z.number().int().min(1).max(60).optional(),
      sub: z.number().int().min(1).max(4).optional().describe('Subframes for motion blur; the style sets this, leave it out'),
    },
    async ({ project, out, fps, sub }) => jobReply(startRender(openProject(project), { out, fps, sub })));

  tool('render_status', 'Wait on a render job and report it.',
    { job: z.string() },
    async ({ job }) => {
      const j = jobs.get(job);
      if (!j) throw new Error(`No job ${job}.`);
      return jobReply(j);
    }, true);

  tool('check_video', 'Size, length, loudness and frames from a finished file. A render can differ from a still, since stills skip motion blur, so check the real file. For counters pass adjacent times.',
    { project: z.string(), file: z.string().default('final.mp4'), times: z.array(z.number()).max(8).optional() },
    async ({ project, file, times }) => {
      const r = await check(fileIn(openProject(project), file), times);
      const sound = r.audio ? `${r.lufs} LUFS, ${r.peak} dBFS true peak` : 'no sound';
      return reply(text(`${r.width}x${r.height}, ${r.duration.toFixed(2)} s, ${sound}`), image(r.sheet));
    }, true);

  tool('doctor', 'Check this machine can render: ffmpeg, a browser, the voice setup.', {},
    async () => reply(text(await doctor())), true);

  server.registerPrompt('make_video', {
    description: 'Make a short animated video on a topic',
    argsSchema: { topic: z.string(), style: z.string().optional() },
  }, ({ topic, style }) => ({
    messages: [{
      role: 'user',
      content: { type: 'text', text: `Make a short animated video about: ${topic}. ${style ? `Use the ${style} look.` : 'Call list_styles and suggest 2 or 3 looks that fit, then ask which.'} Follow the flow in this server's instructions, check facts, and keep the text readable on a phone.` },
    }],
  }));

  return server;
}

export async function doctor() {
  const lines = [`anim-styles ${version()}, ${STYLES.length} looks`, `Projects: ${HOME}`];
  lines.push(ffmpeg() ? `ffmpeg: ${ffmpeg()}` : 'ffmpeg: MISSING. Install it or set ANIM_FFMPEG.');
  try {
    const b = await launch();
    lines.push(`browser: ${b.browserType().name()} ${b.version()}`);
    await b.close();
  } catch (e) { lines.push(`browser: MISSING. ${e.message}`); }
  lines.push(`voice: ${provider() ?? 'none set. Lines need a file, or set ANIM_TTS_CMD or ANIM_TTS_URL.'}`);
  return lines.join('\n');
}

export const serve = () => createServer().connect(new StdioServerTransport());
export { settings };
