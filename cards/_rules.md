# Rules every look keeps

## The page

A project is a folder with `page.html`. The page defines two functions:

- `window.prepare()` returns `{ dur, cues }`: length in seconds, and sound cues `[{ t, k }]`.
- `window.seek(t)` draws the frame for time `t`. It may be async.

`seek(t)` must give the same frame every time, in any order. No `Math.random`, `Date` or stored state: use `hash()` or `rand(seed)` from `common.js`, or `rng(seed)` from `time.js`. The renderer samples between frames for motion blur.

`_shared/` is provided by the server. Don't copy it. Canvas starters load `_shared/common.js`, which has `W H DUR clamp lerp ss hash rand boot`, so a second `const` of those names stops the page. Pages load local files only: the renderer blocks the network.

## Working

1. Read the card and the target frame.
2. Write the beats: time, what moves, what text is on screen. Check facts.
3. Edit `page.html`. The card says which parts hold the look. Replace the subject, the copy and the beats, then set `dur` and `cues`.
4. The demo subject must not survive. Fill its role with your own subject: the one thing the eye follows.
5. Call `stills` and compare with the target frame. Does it still look like the style, can the text be read on a phone, is the subject the star? Fix and repeat.
6. Call `render`, then `check_video`. For a counter, pass adjacent times such as 3.00, 3.03, 3.07, because a fault can last one frame.
7. Report the path and anything not checked. Sound is measured, not heard, so say so.

For several looks on one topic, keep the same `dur` and beats in each so they compare one to one.

## Frame

- Size is 1080×1920 unless the look says otherwise. Pages are laid out for that shape, so another shape needs a new layout, not a stretch.
- Keep key text between about y 250 and y 1500, so platform buttons and captions don't cover it.
- Frame 0 has text and motion, because that frame is the hook and often the thumbnail.

## Text

- Holds follow reading time: about 3 English words a second, 12 Bangla graphemes a second or 5 kana a second, plus 0.5 s to find the text and 0.3 s per number.
- Fonts in `_shared/fonts`: `Noto` (Latin, Bangla and Japanese in one family), `Bn`, `Jp`, `In` (Inter), `Montserrat`, `NotoSerif`, `Galada`. List each one in `boot({ fonts })` or `fontsReady`, or the first frames render in a fallback font.
- Another script, such as Arabic or Devanagari: add its font with `add_media` and an `@font-face` in the page.

## Motion

The style sets `sub`, the number of blended subframes. Hard-stepped looks use 1, because blur smears what makes them read as pixels, chalk or stop-motion. Smooth looks use 2 or 3.

Under `sub` 2 or 3, anything that steps, such as a rolling counter, double-exposes two values. Read it at `Math.round(t * 30) / 30` so it holds still across the blur samples. Stills can't show this fault.

## Sound

The default mix is a soft air bed plus the page's cues. No music unless asked. Cue kinds:

`deep zoom braam boom hit flash spark digit digits tick tock drip drop paper slap whoosh pop notif stamp clock door knock steps pen marker riser correct wrong typing congrats coin bell clocktick fanhum ice horn pour`

`whoosh` also takes `i: 0` or `1`. Optional `sound.json` in the project:

```json
{ "loudness": -16, "bed": "air", "bedDb": -30, "sfxDb": 0, "voiceDb": 0,
  "score": { "bpm": 120, "scenes": [0, 4, 8], "mood": "dark" }, "scoreDb": -6,
  "tracks": [{ "file": "footage/take1/audio.wav", "at": 0, "db": 0 }] }
```

`bed` can be `none`. `score` adds a plain beat score for promos; `mood` is `dark` or `bright`. Most platforms want −14 LUFS, so set `loudness` to −14 for an upload.

## Voice

No voice ships with this server. `add_voice` takes a `file` per line, from a recording or any TTS tool, or uses the provider the user set. It writes `vo/timing.js`:

```js
import { LINES, ENV, FPS, DUR } from './vo/timing.js';
// LINES: [{ id, text, start, dur, on, off }]; ENV: loudness 0–1 at FPS Hz, for lip sync
```

Set the page's `dur` to at least `DUR`.

## Your own footage

`add_media` turns a video into frames. Draw them from an async `seek`:

```js
import { footage } from './_shared/footage.js';
const take = await footage('take1');
window.seek = async t => { ctx.drawImage(await take.at(t), 0, 0, 1080, 1920); };
```

Add its sound with a `tracks` entry in `sound.json`.

## Honesty

Take a look, never someone's characters, story beats or footage. Show only real product facts in promos. Don't publish a third party's name or trademark as the name of a look.
