# One-Stroke Launch Film

Target: gallery/promo-stroke.jpg

A 28 s, 4:5 launch film for one product. It has 56 beats at 120 BPM, and one stroke in `BRAND.colors.accent` is the only moving object from the first second to the logo.

## Look
- Paper field, one heavy type family, wide empty space. Accent appears only on the stroke until it floods the frame.
- The stroke changes job and never disappears: it strikes a word, splits into an equals sign, underlines a line, ticks three boxes, draws a giant tick over a plan, swells and floods into the cover, then collapses into a brush mark under the name.

### Techniques
- **Hanging lines:** `hang()` draws a thin band through a word, then the letters drop out of it. Out is the reverse. Every line of text uses this.
- **The negation strike:** the hook is a claim with one word in it that, once struck, flips the meaning. The word falls through its own baseline and the rest closes up.
- **Match cut:** the three big boxes are the same drawing as the three small boxes in one plan cell, `K` times larger, so the frame zooms out of a box into the whole plan with no cut visible. Keep `trioSvg`, `BOX`, `GAP` and `K` together.
- **The flood:** the tick swells on half beats, the camera dives at its vertex, a disc grows past all four corners, and the frame is the cover on the biggest beat.

## Keep
`hang`, `measureT`, `strokesAt`, `view`, `planView`, `trioSvg`, `drawCover`, `drawEnd`. `shared/promo/stroke.js` holds the stroke geometry.

## Swap
- `brand.js`: `name`, `url`, `cta`, `colors`, `products[0]` (`title`, `sub`). Optional `logo`. Optional `image`: the product appears as a cover on the accent field with the title under it. Without one, the title is set big on the accent field, which is the cover.
- `COPY` at the top of the page:

| key | what to write |
|---|---|
| `hook.rows`, `hook.strike` | rows of words, and the word to strike. Read it with the word gone: it must be the opposite claim, for example "Drawing is not for you." to "Drawing is for you." |
| `equals` | `left = a + b`, a `label`, and `then`: a second example that rolls into the same slots |
| `promise` | `line`, `punch` (underlined), `sub` |
| `checks` | `title`, three `boxes` |
| `plan` | `cells`, `at` (which cell the zoom leaves from, counted from 0, near the end of the grid), `title`, `sub` |
| `cover.chips` | short product facts |
| `end.line` | the closing line |

## Motion
`sub` 3. `B(n)` is beat n, half a second each. Every event sits on this table, and the sound cues use the same numbers. The plan grid works out its own columns from `plan.cells`, so any count from about 6 to 60 fills the frame.

| Bar | Beat | Time | Picture | Sound |
|---|---|---|---|---|
| 1 | 1 | 0.00 | the hook is already hanging | |
| | 1& | 0.25 | last hook line hangs | `pop` |
| | 3 | 1.00 | the stroke slashes the word | `slap` |
| | 3& | 1.25 | the word falls through its baseline | `drop` |
| | 4 | 1.50 | the rest closes up; the stroke gathers | |
| | 4& | 1.75 | lines retract | `whoosh` |
| 2-3 | 5 | 2.00 | the dash splits into `=`; left side hangs | `hit`, score hit |
| | 5&-6& | 2.25-2.75 | `a`, `+`, `b` hang | `tick` |
| | 7 | 3.00 | label hangs | `pop` |
| | 7& | 3.25 | the `=` flexes | |
| | 8-8& | 3.50-3.75 | the second example rolls in | `tock` |
| | 11-12 | 5.00-5.50 | words retract, the bars fold into one | `whoosh` |
| 4-5 | 13 | 6.00 | `line` and `punch` hang | `hit`, score hit |
| | 14 | 6.50 | camera moves in on the punch | `whoosh` |
| | 15&-17 | 7.25-8.00 | the cursor drags the underline | `marker` |
| | 18 | 8.50 | `sub` hangs | `pop` |
| | 19-20 | 9.00-9.50 | the underline gathers and flies | `whoosh` |
| 6-7 | 21 | 10.00 | title hangs, boxes draw on | `hit`, `paper`, score hit |
| | 23 / 24 / 25 | 11.00 / 11.50 / 12.00 | the tick lands in box 1, 2, 3; old ticks turn dark | `tick`, `pen` |
| | 26 | 12.50 | labels retract | `whoosh` |
| 8-9 | 29 | 14.00 | match cut: zoom out into the plan | `zoom`, score hit |
| | 31& / 32 | 15.25 / 15.50 | plan title and sub hang | `tick` |
| | 33-35& | 16.00-17.25 | the tick lifts and draws a giant tick across the plan | `riser`, `marker` |
| 9-10 | 35&-39& | 17.25-19.25 | the tick swells on half beats, camera dives | `drop` x5 |
| | 39&-41 | 19.25-20.00 | the ink floods past every corner | |
| 11-12 | 41 | 20.00 | biggest beat: the frame is the cover | `boom`, `hit`, score hit |
| | 41&-43 | 20.25-21.00 | title lines and sub hang | |
| | 45-46 | 22.00-23.00 | chips pop | `pop` |
| | 47 | 23.00 | URL pill | `stamp` |
| 13-14 | 49 | 24.00 | the accent collapses into a brush mark | `whoosh`, `hit`, score hit |
| | 50 | 24.50 | the name is drawn out along it | `marker` |
| | 51 / 52 / 53 | 25.00 / 25.50 / 26.00 | line, CTA, URL hang | `tick`, `tick`, `bell` |
| | 53-56 | 26.00-28.00 | the mark pulses on half beats | |

## Text
Keep each line short enough to hang at a big size; lines fit to 960 px. Holds are 2 to 4 s, so a line has to read in one glance. **Show only real product facts. Never invent counts or claims:** `plan.cells`, the days on the boxes and every chip must be true of the product. The hook's flip is a claim too, so it must be one the product can stand behind.

## Sound
`sound.json` has `"bed": "none"` and a dark 120 BPM score, `scenes` on the hits at 0, 2, 6, 10, 14, 20 and 24 s. Move a hit in the picture and change it there too. Sound is measured, not heard, so say so.

## Watch for
- Size is 1080x1350. Pages here are laid out for it: don't stretch to 9:16.
- A hook with no word to strike doesn't work in this format.
- The cover needs `accent` to carry a full frame. A very pale accent loses the flood, so use a stronger colour or say so.
- Change `BOX`, `GAP` or `K` and the match cut still holds, because both drawings come from `trioSvg`. Change one by hand and it breaks.

## Best for
Launching one product with a single idea. A 4:5 feed post, no voice, no footage.
