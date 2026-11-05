# Glass Kinetic Promo

Target: gallery/promo-glass.jpg

A 36 s promo with no voice: nine 4 s scenes at 120 BPM on a score. Each scene is a panel kind filled from `COPY`, so a new promo is mostly writing, not code.

## Look
- Brand field with two soft lights that drift, a faint grid, frosted glass panels on top.
- Big Montserrat 800 type. Each word rises out of its own mask and tips flat. One accent phrase per title.
- One accent stroke is the through-line. It rests under each scene's content, underlines a phrase when told to, and ends under the brand on the end card. It travels between scenes rather than redrawing.
- A nine-part progress rail and the URL sit under it. The end card has the product as a tilted cover, the CTA, and the URL on glass.

## Keep
`poseItem`, `drawScene`, `strokeAt`, the `.glass` and `.shine` CSS, the `--g-*` variables, `measure()`.

## Swap
- `brand.js`: `name`, `tagline`, `url`, `cta`, `colors`, `products[0]`. Optional `logo` (a path in the project, after `add_media`), drawn in place of the name. Optional `image` on the product, used instead of the drawn card.
- `COPY` at the top of the page: `series` (top right) and `scenes`. `*word*` paints a word in the accent.
- Each scene has `eyebrow`, `title` (an array of lines) and a `kind`. Reorder, drop or repeat them:

| kind | fields | what it shows |
|---|---|---|
| `hero` | `big`, `small` | a 3D glass plaque with depth layers; use it first |
| `counts` | `rows: [{ n, label }]`, `note` | numbers rolling up on glass |
| `chips` | `chips: [{ t, art }]`, `sentence`, `stroke: 'underline'` | six tiles that draw themselves, and a line the stroke underlines (`*phrase*`) |
| `pair` | `pair: [{ b, s, art }]`, `bar` | two cards side by side, then a strip |
| `stack` | `rows: [{ b, s, v }]` | five rows, each with a meter; `v` is 0 to 1 |
| `cards` | `cards: [{ b, s }]` | three numbered cards |
| `tiles` | `tiles`, `equation` | a grid that fills in a wave, up to about 30 tiles |
| `big` | `huge`, `label`, `steps` | one huge rolling number and four steps lit in turn |
| `end` | title only | product cover, wordmark, tagline, CTA, URL |

`art` is an optional SVG path in a 100 x 100 box, drawn on with a line.

## Motion
`sub` 2. Timing lives in `COPY.SCENE` (4 s, 8 beats) and `dur` is scenes x `SCENE`. After changing either, set the same times in `sound.json` `score.scenes`. Type starts `LEAD` seconds before each cut so it lands on the beat, panels follow on sixteenth notes, the accent word bumps on the second beat, and the lights pulse on each beat. Scene 1 starts already moving, so frame 0 has text. Numbers read at `Math.round(t * 30) / 30` so they hold still under blur.

## Text
Lines fit themselves to 904 px, so a long line shrinks; keep titles to two or three short lines. Stay inside about 16 words a scene, which is what 4 s allows. **Show only real product facts. Never invent counts or claims:** every number on screen must come from the user or the product. Replace the demo's 30, 4, 15 and 450 with true figures, or drop `counts`, `tiles` and `big`.

## Sound
`sound.json` has `"bed": "none"` and a dark 120 BPM score with `scenes` on every 4 s cut. Cues: `whoosh` on each cut, then `pop`, `tick` and `digits` per kind, `riser` and `hit` into the end card, `stamp` on the CTA. Sound is measured, not heard, so say so.

## Watch for
- Glass needs something behind it. With a very pale `bg` the panels turn white and the lights do the work, so check stills.
- An underlined phrase must stay on one line.
- `tiles` over about 30 runs into the stroke.
- Check `bg` against `accent`: accent text is lifted until it reads, so it can drift from the brand colour on a mid-tone field.

## Best for
A course, app or offer with several parts to walk through, with no presenter and no voice.
