# Product Line-up Film

Target: gallery/promo-lineup.jpg

A film for a brand with several products. A 3D running track tips flat, and its centre line carries every product in turn. `BRAND.products` drives the film: 2 to 6 work, and all timing follows from the count.

## Look
- Opens on the brand field: a track rushing to the horizon, hook text, a two-line slam, a flash.
- The track tips flat so the lanes run sideways and the centre line becomes the one horizontal accent line.
- That line then plays one job per scene: shelf, stage lip, underline, staircase, centre line again in the sprint, the border of a stamp, the floor, and the underline of the name.
- Product scenes are on paper with a soft floor below the line. Products whip in on the beat.

## Keep
`trackState`, `drawTrack`, `lineAt`, `sets`, `stairs`, `drawProduct`, `whip`. The line keeps one sample count, so any shape can turn into any other.

## Swap
- `brand.js`: `name`, `url`, `cta`, `colors`, `products`. Each product has `title`, `sub` and an optional `image`; without one, a card is drawn from the title. Optional `logo`.
- Products use three stage sets in turn (`shelf`, `stage`, `underline`). From the fourth product the sets repeat, mirrored.
- `COPY` at the top of the page: `hook`, `slam`, `painted` (word on the track, empty uses the brand name), `count` (sits beside the count), `plan` (`title`, 2 to 6 `steps`; an empty list drops the scene), `stamp`, `end`.
- `COPY.host`: optional. Pass a cut-out PNG through `add_media` and set the path, for example `'assets/host.png'`. The host rises from behind the line next to each product on a stage. Leave it `null` and the slot is gone: the card takes the middle of the stage.
- Voice is optional. `add_voice` writes `vo/timing.js`, which replaces the empty one here. The page holds its end card to at least the voice's length and shows each line as a caption unless `COPY.captions` is false.

## Motion
`sub` 3, 120 BPM, whole beats. With N products and S plan steps:

| Part | Length |
|---|---|
| Start | 2 s |
| Count | 2 s |
| Each product | 4 s for 3 products or fewer, 3 s for 4 or more |
| Plan | ceil((S + 2) / 2) s, 0 with no steps |
| Sprint | max(3, ceil((N + 2) / 2)) s |
| Stamp | 2 s |
| Logo and end card | 4 s |

`sound.json` `score.scenes` must match the cuts. With four plan steps:

| N | length | scenes |
|---|---|---|
| 2 | 24 s | 0, 2, 4, 8, 12, 15, 18, 20 |
| 3 | 28 s | 0, 2, 4, 8, 12, 16, 19, 22, 24 |
| 4 | 28 s | 0, 2, 4, 7, 10, 13, 16, 19, 22, 24 |
| 5 | 32 s | 0, 2, 4, 7, 10, 13, 16, 19, 22, 26, 28 |
| 6 | 35 s | 0, 2, 4, 7, 10, 13, 16, 19, 22, 25, 29, 31 |

The sprint shows each product for one beat, or two beats when there are only two products, ending on the stamp.

## Text
Titles fit by balanced lines, so up to about five words work. On a stage a long title shrinks rather than cover the card. Keep `sub` to one short line: 3 s must hold title and sub. **Show only real product facts. Never invent counts or claims:** the count on screen is the real length of `BRAND.products`, so list only products that exist, and only steps the plan really has.

## Sound
`sound.json` has `"bed": "none"` and a dark 120 BPM score. Cues: `slap`, `horn` and `whoosh` at the start, `hit` per product, `drop` per step, `riser` and `steps` into the sprint, `boom` and `stamp` on the finish, `bell` at the end. With voice, lower the score with `scoreDb`. Sound is measured, not heard, so say so.

## Watch for
- Hide scene containers with `display:none`, not `visibility`.
- Keep the part of the plane in front of the pivot shorter than the perspective distance, or it clips through the camera.
- Past six products only the first six are used. Split a longer range into two films.
- The host must be a clean cut-out with a transparent background. The user supplies it; never use a person's photo without their say.

## Best for
A brand with a real range: courses, workbooks, tools, plans. Works with or without voice and a host.
