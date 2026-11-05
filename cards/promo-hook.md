# Talking Hook Reel

Target: gallery/promo-hook.jpg

A person talks to camera. The top half is a board for the current beat, the bottom half is the face, and word-by-word captions sit on the seam. The starter renders with no footage, showing a plain stand-in figure and an on-screen note.

## Look
- Brand row and a fixed header title for the whole reel.
- Numbered beat chips under the title. The current one is in the accent, past ones are bright, the rest are dim.
- A paper board for the current beat, sliding in on each beat change.
- Face below with a slow punch-in inside each beat, one step tighter on every second beat, so each new beat reads as a cut.
- Caption pill on the seam with the current word in the accent. A thin progress line runs along the seam.

## Keep
`WORDS`, `GROUPS`, `drawCaption`, `drawBoards`, `zoomAt`, `drawTake`. `footage/take/meta.json` in the starter is an empty marker that says no take has been added; `add_media` replaces it.

## Swap
- `brand.js`: `name`, `url`, `cta`, `colors`, `products`. Optional `logo` in the brand row. Optional `image` on a product, used on the `product` board.
- `COPY` at the top of the page is the whole reel, in the shape of a `reel.json`:

```js
{ title: 'Header for the whole reel, *accent word*', take: 'take', end: 24.5,
  face: { x: .5, y: .42, punch: .07 },   // where the face sits (0 to 1), how far the punch-in goes
  beats: [{ start: 0, chip: 'Hook', say: 'Exact spoken words.', board: { t: 'text', title: 'Pill', big: 'Big *line*', sub: 'Small line' } }] }
```

Boards: `text` (`title`, `big`, `sub`), `compare` (`title`, `a` and `b`, each `{ b, s, art }`), `list` (`title`, `items: [{ b, art }]`, shown in turn), `product` (`title`, `index` into `BRAND.products`), `cta` (`title`, `gives`; uses `BRAND.cta` and `BRAND.url`). `art` is an optional SVG path in a 100 x 100 box.

### With a real take
1. `add_media` the take with `name: "take"`. A vertical recording of the face works best; the page crops it to 1080x960.
2. List the beats: type `say` as spoken and set each `start` to the second that part begins in the take. Set `end` to the take's length. Move `face.y` so the eyes sit in the upper half of the panel.
3. Add the sound. In `sound.json`, add `"tracks": [{ "file": "footage/take/audio.wav", "at": 0, "db": 0 }]`, and set `score.scenes` to the beat starts. Leave `scoreDb` low, or remove `score` for voice alone.
4. `render`, then `check_video`.

The take needs its own edit first. The page plays it straight through and removes nothing.

## Motion
`sub` 1, so nothing smears and captions stay sharp. `seek` is async because it waits for the frame. Boards slide in 0.3 s. The hook board is complete on frame 0, because that frame is the thumbnail.

## Text
Captions time by word share across each beat's span, weighted by word length. There is no transcription or speech recognition, so accuracy depends on `start`: more, shorter beats track speech closer. Short phrases are grouped at punctuation or after about four words. Keep `say` word for word, or the captions drift. Keep key text out of the bottom 340 px and the right rail. **Show only real product facts. Never invent counts or claims:** board text must say only what the person says, or what is true of the product.

## Sound
No voice ships. With no take, the render has only a quiet bright score and the cues: `whoosh` per beat, `pop` per board item, `bell` on the CTA. The voice comes from the `tracks` entry. `bed` is `none`, so room tone comes from the take. Sound is measured, not heard, so say so.

## Watch for
- A wrong take name shows the stand-in and a page error. The name in `add_media` and `COPY.take` must match.
- `end` longer than the take freezes the last frame.
- A landscape take is cropped hard and softened, because add_media caps width at 1080.
- A real person's take needs their consent. Use only the user's own footage.

## Best for
Founder and creator promos, where the person's face and voice do the selling, and any 20 to 75 s reel with a clear beat list.
