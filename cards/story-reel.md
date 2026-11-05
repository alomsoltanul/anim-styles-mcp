# Animated Story Reel

Target: gallery/story-reel.jpg

## Look
- Flat cartoon drawn in SVG: pastel sets with soft gradients, round faces, plain clothes. No images, so any story can be drawn.
- Characters breathe, blink and face the camera. The camera pushes slowly, and one set is seen from different places, like a real location.
- Cream caption card low in the frame with dark text and *keywords* in red. A dark tag sits top left. Small cream cards pop in beside the action.
- Mood comes from `grade`: warm, night or cold. A light vignette and fine grain sit over everything.

## Keep
`page.html` as it is. `capStyle: 'card'`, one spoken line per shot, and `LANE()`, the way one set is reused across shots.

## Swap
All of `scenes.js`: the cast, the story, the shots, the sign on the stall. The demo story is called The Second Cup. It must not survive.

## Motion
`sub` 2. Every shot moves: a slow `cam` push, a character's `walk` or `move`, cards popping on `wN` times. Crossfade between places, hard cut (`xf: 0`) between angles of one place. Use `shake` on a stamp or a shock. Days pass with a `cal` and a `tintk` flicker.

## Text
Captions come from `vo`, so write the line once. Noto 600 at 54 px, in a card up to 880 px wide, split by sentence, and by 7 to 10 words in a long one. Mark 2 or 3 keywords per line with `*`. Set `wps` to about 3 for English; a Bangla script reads nearer 2.3. Cards and stamps carry 1 to 3 words.

## Sound
Each shot's `sfx` becomes one flat cue list on the film's clock, so cues stay on their words when a voice changes the timing. Good kinds here: `pop` for cards, `whoosh` for a change of place, `stamp` on a slam, `paper` and `coin` for props, `clocktick` for time passing, `correct`, `wrong`, `bell`, `riser`, `steps`, `knock`. No music by default. For a beat under the story, add `score` to `sound.json`; the rules show how.

## Voice
Without a voice each shot lasts `.35 + words / wps + tail`, which makes the first cut an animatic. To add narration:

1. Write `vo` on every spoken shot.
2. Call `add_voice` with one line per spoken shot, in shot order. Shots with no `vo` take no line.
3. Call `stills`, then `render`. `scenes.js` does not change, and the film's length updates itself.

The page reads `vo/timing.json` and `vo/timing.js` when it loads, and the picture then fits the voice:

- A spoken shot cuts in up to .35 s before its line and holds until the next shot, so shot lengths follow the clips.
- `wN` times, captions and `sfx` follow that line's own pace.
- A character with `lip: true` moves its mouth with the line's loudness. Give it `talk` too, for the cut with no voice.
- `add_voice` puts lines .1 s apart, so a shot lasts its clip plus .1 s, and `dur` and `tail` count only on the last spoken shot. For a pause after a line, give the next line an `at`: the shot holds until .35 s before it.
- A shot with no `vo` between two spoken shots needs that room too. If there is none, `stills` reports a page error with the `at` to use.
- Lines and spoken shots must match one to one. A mismatch is reported the same way.

`vo/timing.json` in the starter is an empty placeholder that `add_voice` replaces. Leave it there: without it the page still works, but the missing file shows as a page error.

## Wide films
9:16 is the default. For 16:9, set `"size": [1920, 1080]` in the project's `style.json` before the first `stills`. The world is then 1920 x 1080 and camera `[960, 540, 1]` shows all of it. Captions sit at the bottom edge, and `TAG` and `MARK` move to fit. The demo is laid out for 9:16, so write new shots: `room`, `wallplain`, `dark`, `desk`, `sky` and `street` fill a wide frame, while `lane` and `stall` are 1080 wide and need a closer camera. `window.W` and `window.H` hold the size in `scenes.js`.

## SPEC reference
`page.html` loads the engine and calls `play('scenes.js')`. It stays as it is. All the work is in `scenes.js`, a plain script that sets `window.SPEC`:

```js
window.SPEC = {
  wps: 3,               // words a second before a voice exists
  capStyle: 'card',     // cream caption card; leave out for dark captions
  accent: '#D7263D',    // keyword colour, optional
  fonts: [],            // extra fonts to wait for, as '700 40px Name', optional
  cast: { lena: { female: true, hairstyle: 'bun', cloth: 'shirt', ccol: '#2E7D6B', lower: 'pants' } },
  shots: [
    { vo: 'Every evening, *Lena* paid for *two* teas.', tail: 0, xf: 0, grade: 'warm',
      cam: { from: [540, 1100, 1.02], to: [470, 1160, 1.2] },
      sfx: [['w5', 'coin']],
      items: [{ k: 'lane' }, C('lena', 300, 1380, 1, { legs: true, expr: 'smile', pose: 'hold', hold: 'cup' }), TAG('The <span class="F">second cup</span>', -.3)] },
  ],
};
```

The world is in screen units. In a reel, camera `[540, 960, 1]` shows x 0 to 1080 and y 0 to 1920. Items sit in the world and the camera moves over them, unless they have `screen: true`.

### Time
Any time inside a shot, measured from its start, can be written as:

| Form | Means |
|---|---|
| `1.5` | seconds |
| `'w6'` | when the 6th word is said; `'w0'` is the first word, `'w6+.2'` .2 s later |
| `'40%'` | that share of the shot |
| `'e'`, `'e-1'` | the end of the shot, 1 s before it |

This works in `at`, `out`, keyframes, spans, `sfx`, `shake`, camera `keys` and HTML `data-at`. A negative `at`, such as `-.3`, means the thing is already in place at the start of the shot.

Keyframes are `[[t, value, ...], ...]` and ease between entries. Spans are `[[from, to], ...]`.

### Shot fields
| Field | What it does |
|---|---|
| `vo` | The spoken line. It sets the shot's length and word clock and becomes the caption. `*word*` turns a keyword red. No `vo` means a silent shot. |
| `who` | Speaker's name above the caption. |
| `dur` | Fixed length. Without it the shot lasts `max(2.4, .35 + words / wps + tail)`. |
| `tail` | Seconds held after the line, default .75. |
| `cap` | `false` hides the caption. |
| `items` | What is in the shot, back to front. |
| `set`, `setOpt` | Short form for a first item: `set: 'room', setOpt: { hy: 800 }`. |
| `cam` | `{ from: [x, y, zoom], to: [x, y, zoom] }` or `{ keys: [[t, x, y, zoom], ...] }`. |
| `push` | Zoom reached when `cam.to` is left out, default 1.045. |
| `xf` | Crossfade in, seconds, default .32. `0` is a hard cut. |
| `shake` | `[[t, amp, dur], ...]`. |
| `grade` | `warm`, `night`, `cold` or `day`. |
| `tint`, `tintc`, `blend`, `sat`, `bri` | The same by hand: tint strength and colour, blend mode, saturation, brightness. |
| `tintk`, `satk`, `brik` | Keyframes for those: `[[t, value], ...]`. |
| `sfx` | `[[t, kind], ...]`. Kinds are the cue kinds in the rules. `[t, 'whoosh', 1]` picks whoosh 1; whooshes alternate if it is left out. |

### Fields every item takes
`k` (the kind), `x, y, s` (place and scale), `r` (degrees or keyframes), `flip`, `at`, `out`, `anim` (`pop fade drop up stamp slideL slideR swing none`; an item with `at` pops by default), `move: [[t, x, y, s?], ...]`, `o` (opacity or keyframes), `clip: [x, y, w, h]`, `blur`, `screen: true`.

### Items
| Item | What it is | Key fields |
|---|---|---|
| `char` | Cast member, facing the camera. `x, y` is the hips, the head is 345 x `s` above them, feet 262 x `s` below. | `id`, `outfit`, `with: {look}`, `expr`, `pose`, `gaze: [dx, dy]` from -1 to 1 or keyframes, `tilt`, `talk`, `tears`, `sweat`, `eat`, `walk`, `pedal` (all spans), `lip: true`, `legs: true` (else cut at the hips), `hold`, `shadow: false` |
| `room` | Wall and floor. | `hy` (floor line), `wall`, `floor`, `panel`, `light` (SVG path) |
| `wallplain`, `dark`, `desk` | Full-frame plain wall, dark backdrop, wood desk top. | `c` |
| `sky` | Sky over a far city, for wide films. | `kind: evening, morning, night`, `line: true` (washing line) |
| `street` | Road running away from the camera, signs passing. | `v` (speed), `signs: []` |
| `lane` | Row of old pastel buildings on a pavement, for reels. | `gy` (where buildings meet the ground), `sky1`, `sky2` |
| `stall` | Tea stall; `x, y` is the pavement under the counter. Draw `part: 'back'`, then whoever stands inside, then `part: 'front'`. | `part`, `sign`, `counter`, `shutter` (0 to 1) |
| `window` | Window with curtains. | `w, h`, `sky: day, night, evening`, `curtain` (colour or `false`) |
| `door` | Curtained door; `y` is the floor. | `w, h`, `part: back, front`, `open` (0 to 1, keyframes), `curtain` |
| `clock`, `fan` | Wall clock, ceiling fan. | clock: `r`, `m0` (start, in minutes), `speed` (minutes a second); fan: `speed` (turns a second, keyframes) |
| `frame`, `shelf` | Picture frame, display shelf. | frame: `w, h`, `kind: art, calli, empty`, `html`; shelf: `w, h` |
| `sofa`, `bench`, `bed`, `blanket`, `stand` | Seats and bedroom. `y` is the floor. A sleeper goes between `bed` and `blanket`. | sofa: `w, c, part`; bench: `w, seat`; bed: `w`; blanket: `w, c`; stand: `w` |
| `table`, `plate` | Tea table, plate of sweets. | table: `w`, `paper`, `food: [mishti, roshogolla, samosa, chanachur, cup, apple, banana, biscuit]`; plate: `n`, `eat: [t, ...]` |
| `deskf`, `laptopb`, `chairb`, `lamp`, `mug` | Desk from the front, laptop from behind, chair back, desk lamp, mug. | deskf: `w`; laptopb: `w, h`; chairb: `c` |
| `plant`, `rail`, `bag`, `spot`, `glow` | Pot plant, balcony rail, shoulder bag, light beam, soft glow. | plant: `c`; rail: `y0, c`; spot: `w`; glow: `r, c` |
| `cal` | Wall calendar that flips. | `pages: [[t, month, day, +seconds?], ...]`, `w, h`, `flip` |
| `alarm`, `book`, `pile`, `papers`, `zzz` | Ringing clock, closed book, stack that grows, papers bursting out, sleep Zs. | alarm: `r`, `ring` (span); book: `w, h, c`; pile: `n` (number or `[[t, count], ...]`), `max`, `kind: 'diary'`; papers: `n` |
| `rickshaw` | Front view, wheels turning. | `rider: {id, ...}`, `passenger: {id, ...}` |
| `bubble` | Speech or thought bubble. | `text`, `w`, `tail: [dx, dy]`, `think: true` |
| `chip` | Rounded label. | `text`, `c: y, r, g, w` |
| `text` | Big type. | `text`, `size`, `color`, `font`, `w`, `css` |
| `html` | Any HTML card; `x, y` is its centre. | `html`, `w`, `h`, `css`, `shadow` |
| `phone` | Phone with HTML on its screen. | `html`, `w, h`, `bg`, `hand` (skin colour) |
| `group` | Items that share placement or `blur`. | `items` |
| `reveal` | Items wiped in behind a scan line. | `a, b` (times), `y0, y1`, `items`, `x0`, `lw`, `lc` |

HTML children animate with `data-at`, `data-out`, `data-dur` and `data-anim`: `pop fade up stamp type count bar draw blink spin`. `count` takes `data-from`, `data-to` and `data-digits="bn"` for Bangla digits; `bar` takes `data-to` as a percent width; `draw` wants a `<path>` inside it. Classes ready to use: `F` (accent colour), `tag`, `chip`, `paper`, `ph`, `row` with `l` and `v`, `stamp`, `stamp g`, `hl`, `big`.

### Cast look
Set in `cast`, overridden per item with `with`. `outfits: { name: {...} }` holds changes of clothes for `outfit`.

| Part | Options |
|---|---|
| Face | `skin`, `eye`, `brow`, `female`, `blush`, `age: 'old'`, `kid`, `glasses`, `moustache: thin, thick` with `mcol`, `beard: goatee, full` with `bcol`, `paan`, `nosepin`, `earring` |
| Hair | `hair` (colour), `hairstyle: short, long, braid, bun, bald, kid`, `flower` |
| Headwear | `headwear: tupi, hijab, ghomta`, `hcol` (hijab colour) |
| Top | `cloth: panjabi, shirt, tshirt, kameez, saree, robe`, `ccol`, `ccol2`, `pattern: 'check'` with `pcol`, `sleeves: 'short'`, `vest`, `gamchha: [c1, c2]`, `ocol` (kameez scarf), `print: [text, colour]` (tshirt), `motif` (saree), `button` |
| Lower | `lower: lungi, pants, pyjama, skirt`, `lcol`, `legs: true` |
| Carry | `bag` |
| Defaults | `expr`, `pose` |

Expressions: `neutral smile grin laugh sad cry angry worried nervous shock smug bored chew closed`.

Poses: `down fold hold talk point phone show shrug hips chin cry wipe eat handle write`.

Hand props for `hold`: `phone phoneUp tray clipboard file plate umbrella cup`. Pair `phone` with pose `phone`, `phoneUp` with `show`, and the others with `hold`.

`expr` and `pose` take a name or `[[t, name], ...]`.

### Helpers
These are ready in `scenes.js` with no import. A scene may reuse a name for itself.

- `C(id, x, y, scale, fields)` is a `char` item.
- `TAG(html, at, y)` is the dark label; `card(html, at, x, y, rotation, width)` a cream card; `chip(text, at, x, y, fields)` a chip; `SPARK(at, out, x, y, scale)` a burst of rays; `MARK(text)` a faint name low in the frame.
- `bub(text, at, [x, y], tip, fields)` is a bubble whose tail reaches `tip`. `MOUTH(cam, x, y, s)` gives that tip for a character at `x, y`, and `Z(cam, x, y)` turns any world point into a screen point.
- `ICO.gym diary alarm books cup coin sun` are small icons for cards, and `CARD` is the card's CSS.
- For drawing: `ITEMS`, `S(tag, attrs, parent)`, `lg(stops)`, `rg(stops)`, `shade(colour, amount)`, `hash(n)`, `lerp`, `clamp`, `eo`, `eio`, `back`, `kf(keys, t)`, `T(time)`.

A new item is one function: it draws into `g` once, and the function it returns moves it. `lt` is seconds into the shot, so draw from `lt` alone.

```js
ITEMS.rain = (g, it) => {
  const drops = [...Array(it.n || 70)].map(() => S('line', { stroke: '#BFD4F2', 'stroke-width': 4 }, g));
  return lt => drops.forEach((d, i) => {
    const y = (hash(i) * 2200 + lt * 1500) % 2200 - 140, x = hash(i + 50) * 1300 - 110;
    d.setAttribute('x1', x); d.setAttribute('y1', y); d.setAttribute('x2', x - 11); d.setAttribute('y2', y + 74);
  });
};
```

## Watch for
- The caption fills about y 1310 to 1500. Keep faces, cards and shop text above it, or the camera far enough back that they clear it.
- `screen: true` cards don't move with the camera. Work out where the head is first: a head at world `y` shows at `960 + (y - cam.y) * zoom`.
- Frame 0 needs text. The first caption is up at 0 by itself; give a tag `at: -.3`.
- A card mixing plain and red words needs one wrapper: `card(ICO.cup + '<span>One for <span class="F">the next</span></span>', ...)`.
- An `<img>` in `html` loads after the card is measured, so give it a fixed height.
- Everything must come from `lt` or `t`. Use `hash(n)` where you would reach for `Math.random`.
- Characters are your own. Take the look, never someone's characters or story.

## Best for
A narrated story with people in it: a lesson told as a small tale, a book's idea in your own words, satire. Reads well at 20 to 90 s, and goes wide for a longer film.
