# Cream Explainer

Target: `gallery/explainer.jpg`

## Look
- Warm cream paper `#F4F2EC`, black ink, one red `#E1262C`. Bold sans type, one word in red or circled by a hand-drawn marker loop.
- Graphics that feel like evidence: paper tags with a pin, maps with a dashed red arc, newspaper clippings with a highlighter, a spreadsheet typing itself in, a calendar and clock.
- Hard cuts between scenes, film grain, a very slow push on most scenes.
- Between the graphics, the talking head, with two-line captions whose words light up as they are said.

## Keep
`shared/explainer/engine.js` and `engine.css` hold every scene type. `page.html` holds only `window.EXPLAINER`. Keep its `<link>` and `<script>` tags in the same order: `page.css`, `engine.css`, the three vendor scripts, then the scenes, then `engine.js` as a module.

## Swap
The scenes. Length is the sum of their `dur`.

```js
window.EXPLAINER = {
  font: 'Montserrat',    // optional heading font; Noto is the default, and Bangla and Japanese fall through to it
  locale: 'en-US',       // number format
  accent: '#1F4E8C',     // optional: a channel colour in place of red
  h: 1920,               // must match the height in style.json's size; see Watch for before changing it
  scenes: [ { type: 'title', dur: 3, /* ... */ } ],
};
```

Every scene takes `dur`, `sfx: [[seconds, 'kind'], ...]`, `push` (end scale, default 1.035) and `grain` (0 to 1). A graphic with no `sfx` gets one `whoosh` at its cut.

Text markup, in every text field except where noted: `*red*`, `{red with a marker circle}`, `_script accent_`, `~muted~`, `==highlighter==`, `##redacted##`, and `|` for a new line. Lines don't wrap by themselves, so break them with `|`; they shrink to fit if too long.

`at: [...]` gives exact reveal times, one per word or item, so words can land on a voice. Otherwise `start` and `step` space them out.

| type | what it shows | fields |
|---|---|---|
| `title` | words pop in, optional giant faded word behind | `text`, `sub`, `bg`, `size`, `y`, `start`, `step`, `at` |
| `chapter` | section card | `n`, `text`, `sub`, `bg: 'dark' \| 'wood'` |
| `quote` | big quote mark, words fill like karaoke | `text`, `tag`, `bg`, `source`, `size`, `start`, `step` |
| `list` | numbered points slide in | `title`, `items: [{ t, sub }]`, `gap`, `at`, `source` |
| `timeline` | red line drops from the top, paper tags clip on | `tags: [{ t, y, at }]` (`y` is 0 to 1), `name`, `name_at`, `len` |
| `years` | horizontal year line | `title`, `points: [{ y, t, at }]`, `hl` (index) |
| `calendar` | calendar page, and a clock if `time` is set | `month`, `day`, `weekday`, `time: [h, m]`, `label` |
| `map` | countries fill, pins, dashed arc with a moving dot, counter | see below |
| `chart` | line that draws itself, or bars that grow | `kind: 'line' \| 'bar'`, `title`, `labels`, `values`, `pre`, `post`, `dec`, `hl`, `note: { i, t, at }`, `min`, `max`, `show: [indices]` (which points get a value), `at` (second it starts), `source` |
| `stat` | rows of numbers that count up | `rows: [[{ t \| count, pre, post, dec, s: 'xl' \| 'l' \| 'm' \| 's', c: 'red' \| 'ink' \| 'grey' \| 'alarm', dur }]]`, `at`, `source`. A row can be `{ gap, segs: [...] }` |
| `dots` | pictogram grid, some turn red | `icon: 'person' \| 'house'`, `title`, `total`, `cols`, `hl` (how many), `size`, `fade_rest`, `label`, `label_at`, `source` |
| `sheet` | spreadsheet window, cells type in | `top`, `title`, `head`, `rows`, `red: [column]`, `cols`, `start`, `gap` |
| `compare` | two options: rows, counted totals, a difference box | `left` and `right`: `{ name, say, icon, rows: [[label, value]], total, total_label }`, `pre`, `post`, `dec`, `diff`, `diff_at`, `source` |
| `article` | web article with highlights, slow zoom to the first one | Mock: `paper`, `nav`, `head`, `by`, `body: []`, `color`. Screenshot: `img: 'assets/x.png'`, `boxes: [{ x, y, w, h, kind: 'hl' \| 'red' \| 'ul' }]` in image pixels. Both: `start`, `step`, `at`, `s0`, `s1`, `trans`, `source` |
| `clipping` | aged newspaper, highlights in order | `paper`, `date`, `head`, `body: []`, `start`, `step`, `at`, `cam: { x0, y0, s0, x1, y1, s1 }` |
| `profile` | person card on a red disc | `name`, `role`, `note`, `photo: 'assets/x.png'` |
| `talk` | the talking head | see below |
| `media` | sourced footage or a photo | `clip` or `src: 'assets/x.jpg'`, `box: { y, h }`, `fit`, `pos`, `focus`, `from`, `rate`, `text`, `sub`, `chip`, `name`, `source` |
| `end` | black card with one word | `text` (default SHARE) |

### Map
```js
{ type: 'map', dur: 5,
  fit: [[-9, 37], [24, 58]],                  // [lon, lat] points the view must contain
  hl: [{ name: 'Italy', at: .2, color: 'red' }, { id: '392', at: 1 }],   // Natural Earth name or ISO numeric id; dark unless red
  pins: [{ ll: [12.5, 41.9], label: 'Rome', side: 'left', dy: -56, at: .5 }],
  arc: { from: [12.5, 41.9], to: [-.13, 51.5], at: 1, dur: 1.6, bend: .3 },
  counter: { from: 0, to: 170, suffix: ' years later', at: 1, dur: 1.6 },
  title: 'Black box *title*', title_at: .1, zoom: 1.07, top: .3, bottom: .68, pad: 150, source: '...' }
```
A country name that isn't in the data logs an error and is skipped. Names follow Natural Earth, such as `United Kingdom` and `United States of America`.

### Talking head
Add the clip with `add_media` as, say, `take1`. Then:

```js
{ type: 'talk', dur: 4.6, clip: 'take1',
  say: 'The line being said. Captions are spread over the scene.',   // or cards, below
  punch: true,          // tight shot, 1.2x; or zoom: 1.35
  focus: [.5, .35],     // where the crop sits, 0 to 1, to keep the face in frame
  from: 12,             // seconds into the clip; leave it out, see below
  chip: 'Source line', name: 'Name tag', name_at: .4, cap_y: .64, max: 6, fit: 'cover' }
```

Leave `from` out and the clip follows the film's clock: a graphic of 4 seconds covers 4 seconds of the take, the talking continues underneath, and one `sound.json` track stays in sync:

```json
{ "tracks": [{ "file": "footage/take1/audio.wav", "at": 0, "db": 0 }] }
```

Set `from` for a jump cut, and move the sound to match with a track per cut.

Captions by hand, with `cards: [{ s, e, top, main, w: [word start times] }]` in seconds from the scene's start. With `say`, times are spread by character count, which is only a guess, so write `cards` when words must land on the voice.

With no `clip`, `talk` shows a dark placeholder and the captions, so a whole script can be drafted before filming. The starter has one. A `clip` name that was never added logs an error and shows the placeholder.

## Motion
`sub` 2, 30 fps. Count-ups and typing read a clock held to 1/30 s (`sc.lq`), so motion blur can't double-expose them. A new scene type should do the same.

## Text
Body font is `Noto`, serif paper is `DocSerif` (from `NotoSerifBengali.ttf`, which also has Latin), the accent is `Galada`, and numerals in chapter and end cards are `Montserrat`. All are in `_shared/fonts`. Chips use the system monospace font.

Frame 0: give the first title a negative `start`, such as `-.5`, so its first word is already there.

Pace: shots of 3 to 6 seconds, no graphic over 8, no talking stretch over 12 without a `punch`. About half talking head, half graphics. The talking head carries opinion, feeling and the hook. Graphics carry every number, place, date, name and source.

## Sound
Put `sfx` on each scene: `paper` for documents, `marker` per highlight, `pen` for a circle, `pop` for tags and pins, `tick` for a counter landing, `typing` for a sheet, `digits` for a count-up, `whoosh` on the cut. In the mix, the voice comes from a `tracks` entry or `add_voice`.

## Watch for
- Every fact on screen needs a source line. An `article` or `clipping` mock is a layout, not evidence: never give a mock the name of a real outlet, and show the real screenshot in a finished film.
- Use a screenshot only where the user can. Don't run long clips of other people's footage.
- Map borders are modern, so say so on a historical map. Country outlines are Natural Earth's and may not match a viewer's view of a dispute.
- Long `body` text gets small on a phone. Cut it to the sentence that matters.
- A clip shorter than its scene holds on its last frame.
- The map zooms in as it plays, so a pin's tag can run off the frame by the last second. Check the end of the scene, and use `side` to put the tag where there is room.
- The scenes are laid out for 1080×1920. For another shape, set `h` and `size` in `style.json` together and check every scene with `stills`, because some use fixed pixel offsets. At 1080×1080 a `chart` needs `top: .36` and a `compare` needs `top: .16, diff_y: .82`, or their parts collide.

## Best for
Talking-head explainers of 1 to 3 minutes: news, money, history, how a system works. Three shapes work well: open on a scene and then ask why; start from "you" and end by re-showing each source; or tell one person's story, then the numbers. Also works with no clip at all as a pure graphics film.
