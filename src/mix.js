// Sound for a silent render: a soft air bed, timed effects from the page's cues, narration from add_voice, and any extra tracks.
// Project knobs live in sound.json, all optional:
//   { "loudness": -16, "bed": "air" | "none", "bedDb": -30, "sfxDb": 0, "voiceDb": 0,
//     "score": { "bpm": 120 }, "scoreDb": -6,
//     "tracks": [{ "file": "footage/a/audio.wav", "at": 0, "db": 0 }] }
import fs from 'node:fs';
import path from 'node:path';
import { SFX_DIR, loudnessOf, probe, runFfmpeg } from './env.js';
import { fileIn } from './project.js';
import { writeScore } from './score.js';

// Cue kind -> level in dB under the file's own peak. Every file in assets/sfx is peak-normalised by tools/make-sfx.js.
export const CUES = {
  deep: -16, zoom: -20, braam: -20, boom: -18, hit: -18, flash: -20, spark: -26, digit: -28, digits: -26, tick: -30, tock: -30, drip: -24, drop: -22,
  paper: -24, slap: -22, whoosh: -22, pop: -22, notif: -24, stamp: -18, clock: -26, door: -20, knock: -20, steps: -22, pen: -24, marker: -26, riser: -22,
  correct: -22, wrong: -22, typing: -26, congrats: -22, coin: -24, bell: -24, clocktick: -28, fanhum: -32, ice: -28, horn: -26, pour: -28,
};

const readJson = f => { try { return JSON.parse(fs.readFileSync(f, 'utf8')); } catch { return null; } };

function sfxFile(cue) {
  if (cue.k === 'whoosh') return path.join(SFX_DIR, `whoosh${(cue.i ?? 0) % 2}.wav`);
  const f = path.join(SFX_DIR, `${cue.k}.wav`);
  return fs.existsSync(f) ? f : null;
}

export async function mix(dir, out = 'final.mp4') {
  const silent = path.join(dir, 'silent.mp4');
  const data = readJson(`${silent}.cues.json`);
  if (!data) throw new Error('No silent render here. Call render first.');
  const { dur, cues } = data;
  const sound = readJson(path.join(dir, 'sound.json')) ?? {};
  const target = sound.loudness ?? -16, bedDb = sound.bedDb ?? -30, sfxDb = sound.sfxDb ?? 0, voiceDb = sound.voiceDb ?? 0;
  const voice = readJson(path.join(dir, 'vo', 'timing.json'));
  const inputs = ['-i', silent], chains = [], labels = [], skipped = [], warnings = [];
  let n = 1;
  const add = (file, chain) => { inputs.push('-i', file); const l = `a${n}`; chains.push(`[${n}:a]aformat=sample_rates=48000:channel_layouts=stereo,${chain}[${l}]`); labels.push(`[${l}]`); n++; };

  // Bed: two noise sources for width, filtered to moving air with slow swells. No pitch, so nothing fights a voice.
  if ((sound.bed ?? 'air') === 'air') {
    inputs.push('-f', 'lavfi', '-t', String(dur), '-i', 'anoisesrc=c=brown:r=48000:a=0.6:seed=7', '-f', 'lavfi', '-t', String(dur), '-i', 'anoisesrc=c=brown:r=48000:a=0.6:seed=11');
    chains.push(`[${n}:a][${n + 1}:a]join=inputs=2:channel_layout=stereo,highpass=f=70,lowpass=f=700,volume='0.75+0.25*sin(2*PI*t/11)':eval=frame,volume=${bedDb + 18}dB,afade=t=in:d=0.6,afade=t=out:st=${Math.max(0, dur - 1.2).toFixed(3)}:d=1.2[bed]`);
    labels.push('[bed]');
    n += 2;
  }
  for (const c of cues) {
    const f = sfxFile(c);
    if (!f) { skipped.push(c.k); continue; }
    const ms = Math.max(0, Math.round((c.t - (c.k === 'whoosh' ? 0.12 : 0)) * 1000));
    add(f, `volume=${(CUES[c.k] ?? -24) + sfxDb + 3}dB,adelay=${ms}|${ms}`);
  }
  if (voice) {
    for (const l of voice.lines) {
      const ms = Math.round(l.start * 1000);
      add(path.join(dir, 'vo', `${l.id}.wav`), `volume=${voiceDb}dB,adelay=${ms}|${ms}`);
    }
    const last = voice.lines.at(-1);
    if (last && last.start + last.dur > dur) warnings.push(`Narration runs ${(last.start + last.dur).toFixed(1)} s but the page is ${dur.toFixed(1)} s, so its end is cut. Set dur to ${voice.dur} and render again.`);
  }
  if (sound.score) {
    const wav = path.join(dir, 'score.wav');
    writeScore(wav, { dur, ...sound.score });
    add(wav, `volume=${sound.scoreDb ?? -6}dB`);
  }
  for (const t of sound.tracks ?? []) {
    const ms = Math.round((t.at ?? 0) * 1000);
    add(fileIn(dir, t.file), `volume=${t.db ?? 0}dB,adelay=${ms}|${ms}`);
  }
  if (!labels.length) throw new Error('Nothing to mix: no bed, cues, voice or tracks.');

  const tmp = path.join(dir, '.mix.wav');
  const graph = [...chains, `${labels.join('')}amix=inputs=${labels.length}:normalize=0:duration=longest,apad=whole_dur=${dur.toFixed(3)},atrim=0:${dur.toFixed(3)}[mix]`].join(';');
  await runFfmpeg(['-v', 'error', '-y', ...inputs, '-filter_complex', graph, '-map', '[mix]', '-c:a', 'pcm_s24le', tmp]);
  const before = await loudnessOf(tmp);
  const file = path.resolve(dir, path.basename(out));
  // One fixed gain then a limiter, so a quiet bed isn't pumped up between sounds. The limiter takes level off a loud film,
  // so the gain is measured once through it and corrected.
  const finish = g => `volume=${g.toFixed(2)}dB,alimiter=limit=0.83:attack=3:release=60:level=0`;
  let gain = Number.isFinite(before.lufs) ? target - before.lufs : 0;
  const trial = path.join(dir, '.trial.wav');
  await runFfmpeg(['-v', 'error', '-y', '-i', tmp, '-af', finish(gain), '-c:a', 'pcm_s24le', trial]);
  const limited = await loudnessOf(trial);
  if (Number.isFinite(limited.lufs)) gain += target - limited.lufs;
  await runFfmpeg(['-v', 'error', '-y', '-i', silent, '-i', tmp, '-map', '0:v', '-map', '1:a', '-c:v', 'copy',
    '-af', finish(gain), '-c:a', 'aac', '-b:a', '192k', '-shortest', '-movflags', '+faststart', file]);
  fs.rmSync(tmp, { force: true });
  fs.rmSync(trial, { force: true });
  if (skipped.length) warnings.push(`Unknown cue kinds skipped: ${[...new Set(skipped)].join(', ')}.`);
  return { file, sounds: labels.length, ...(await loudnessOf(file)), warnings };
}

export async function check(file, times) {
  const info = await probe(file);
  const sound = info.audio ? await loudnessOf(file) : null;
  const ts = times?.length ? times : [0.1, info.duration / 2, Math.max(0, info.duration - 0.3)];
  const qa = path.join(path.dirname(file), 'qa');
  fs.mkdirSync(qa, { recursive: true });
  const stem = path.basename(file, path.extname(file)), shots = [];
  for (const [i, t] of ts.entries()) {
    const p = path.join(qa, `${stem}-${i}.png`);
    await runFfmpeg(['-v', 'error', '-y', '-ss', String(t), '-i', file, '-frames:v', '1', p]);
    shots.push(p);
  }
  const { tile } = await import('./render.js');
  const sheet = path.join(qa, `${stem}-check.jpg`);
  await tile(shots, sheet);
  return { ...info, ...(sound ?? {}), sheet };
}
