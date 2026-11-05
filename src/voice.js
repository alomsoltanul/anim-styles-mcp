// Voice is the user's choice, so this package ships none. A line of narration comes from one of three places:
//   1. a file the user already has (their own recording, or the output of any TTS tool in their client);
//   2. ANIM_TTS_CMD, any command that writes speech to a file;
//   3. ANIM_TTS_URL, any OpenAI-compatible /v1/audio/speech endpoint, local or hosted.
// The command and URL come only from the user's own environment, never from a tool call, so a page or prompt can't run anything.
import { execFile } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { promisify } from 'node:util';
import { loudnessOf, probe, requireFfmpeg, runFfmpeg } from './env.js';
import { fileIn } from './project.js';

const exec = promisify(execFile);
export const ENV_RATE = 30;   // mouth envelope samples per second

export function provider() {
  if (process.env.ANIM_TTS_CMD) return 'command';
  if (process.env.ANIM_TTS_URL) return 'http';
  return null;
}

const NO_PROVIDER = 'No voice is set up, so this line needs a `file`. Pass an audio file you recorded or made with any TTS tool, or set ANIM_TTS_CMD or ANIM_TTS_URL in this server\'s env (see the README).';

// Splits on spaces, honouring double quotes, then fills {text}, {text_file} and {out}. No shell is involved.
function commandArgs(template, values) {
  const parts = template.match(/"[^"]*"|\S+/g) ?? [];
  return parts.map(p => p.replace(/^"|"$/g, '').replace(/\{(text_file|text|out)\}/g, (_, k) => values[k]));
}

async function speak(text, out) {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'anim-tts-'));
  try {
    if (process.env.ANIM_TTS_CMD) {
      const raw = path.join(tmp, 'line.audio'), textFile = path.join(tmp, 'line.txt');
      fs.writeFileSync(textFile, text);
      const [cmd, ...args] = commandArgs(process.env.ANIM_TTS_CMD, { text, text_file: textFile, out: raw });
      await exec(cmd, args, { timeout: 180000 });
      if (!fs.existsSync(raw)) throw new Error('ANIM_TTS_CMD finished but wrote no file at {out}.');
      await toWav(raw, out);
    } else if (process.env.ANIM_TTS_URL) {
      const res = await fetch(process.env.ANIM_TTS_URL, {
        method: 'POST',
        headers: { 'content-type': 'application/json', ...(process.env.ANIM_TTS_KEY ? { authorization: `Bearer ${process.env.ANIM_TTS_KEY}` } : {}) },
        body: JSON.stringify({ input: text, model: process.env.ANIM_TTS_MODEL, voice: process.env.ANIM_TTS_VOICE, response_format: 'wav' }),
      });
      if (!res.ok) throw new Error(`ANIM_TTS_URL answered ${res.status}: ${(await res.text()).slice(0, 200)}`);
      const raw = path.join(tmp, 'line.audio');
      fs.writeFileSync(raw, Buffer.from(await res.arrayBuffer()));
      await toWav(raw, out);
    } else throw new Error(NO_PROVIDER);
  } finally { fs.rmSync(tmp, { recursive: true, force: true }); }
}

const VOICE_LUFS = -18;   // every line lands at one level, whatever made it, so a clip from one tool doesn't jump over another

async function toWav(src, out) {
  const { lufs } = await loudnessOf(src);
  const gain = Number.isFinite(lufs) && lufs > -60 ? VOICE_LUFS - lufs : 0;
  await runFfmpeg(['-v', 'error', '-y', '-i', src, '-vn', '-af', `volume=${gain.toFixed(2)}dB`, '-ar', '48000', '-ac', '2', '-c:a', 'pcm_s16le', out]);
}

// Loudness per 1/30 s, 0 to 1, for lip sync and anything else that should move with the voice.
async function envelope(file) {
  const { spawn } = await import('node:child_process');
  const rate = 8000, chunks = [];
  await new Promise((resolve, reject) => {
    const p = spawn(requireFfmpeg(), ['-v', 'error', '-i', file, '-ac', '1', '-ar', String(rate), '-f', 'f32le', '-'], { stdio: ['ignore', 'pipe', 'ignore'] });
    p.stdout.on('data', d => chunks.push(d));
    p.on('error', reject);
    p.on('close', c => c === 0 ? resolve() : reject(new Error('could not read the voice clip')));
  });
  const buf = Buffer.concat(chunks), n = Math.floor(buf.length / 4), hop = Math.floor(rate / ENV_RATE), out = [];
  for (let i = 0; i + hop <= n; i += hop) {
    let sum = 0;
    for (let k = 0; k < hop; k++) { const v = buf.readFloatLE((i + k) * 4); sum += v * v; }
    out.push(Math.sqrt(sum / hop));
  }
  const peak = Math.max(1e-6, ...out);
  return out.map(v => Math.round(Math.min(1, v / (peak * 0.7)) * 100) / 100);
}

// lines: [{ text, file?, at? }]. `at` pins a line to a time; otherwise it follows the last line after `gap` seconds.
// Writes vo/L1.wav…, vo/timing.json for the mixer, and vo/timing.js for pages.
export async function addVoice(dir, lines, { start = 0.12, gap = 0.1 } = {}) {
  const vo = path.join(dir, 'vo');
  fs.rmSync(vo, { recursive: true, force: true });
  fs.mkdirSync(vo, { recursive: true });
  let cursor = start;
  const placed = [], env = [];
  for (const [i, line] of lines.entries()) {
    const id = `L${i + 1}`, wav = path.join(vo, `${id}.wav`);
    if (line.file) {
      const src = path.isAbsolute(line.file) ? line.file : fileIn(dir, line.file);
      if (!fs.existsSync(src)) throw new Error(`${src} not found.`);
      await toWav(src, wav);
    } else if (line.text) await speak(line.text, wav);
    else throw new Error(`Line ${i + 1} needs text or a file.`);
    const { duration } = await probe(wav);
    const at = line.at ?? cursor, e = await envelope(wav);
    const voiced = e.flatMap((v, k) => v > 0.08 ? [k / ENV_RATE] : []);
    placed.push({ id, text: line.text ?? '', start: +at.toFixed(3), dur: +duration.toFixed(3), on: +(at + (voiced[0] ?? 0)).toFixed(3), off: +(at + (voiced.at(-1) ?? duration)).toFixed(3) });
    const from = Math.round(at * ENV_RATE);
    e.forEach((v, k) => { env[from + k] = Math.max(env[from + k] ?? 0, v); });
    cursor = at + duration + gap;
  }
  const dur = +(cursor + 0.4).toFixed(2);
  const ENV = Array.from(env, v => v ?? 0);
  fs.writeFileSync(path.join(vo, 'timing.json'), JSON.stringify({ dur, lines: placed }, null, 1));
  fs.writeFileSync(path.join(vo, 'timing.js'), `// Made by add_voice: line times, and a mouth envelope at ${ENV_RATE} Hz.\nexport const FPS = ${ENV_RATE}, DUR = ${dur};\nexport const LINES = ${JSON.stringify(placed)};\nexport const ENV = ${JSON.stringify(ENV)};\n`);
  return { dur, lines: placed };
}
