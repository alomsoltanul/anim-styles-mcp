# Paper Collage B-roll

Target: `gallery/paper-collage.jpg`

## Look
- One flat colour field with fine paper fibre, and lots of it left empty. The colour follows the meaning: orange effort or urgency, mustard tools or warning, green growth, purple knowledge or memory, teal people or togetherness, navy night or depth, red alarm, cream calm.
- Three to six big cut-outs in the middle 70 % of the frame, each with a white paper border and a soft shadow, so they look stacked on a table.
- Black halftone dots print shading onto the pieces, like a cheap magazine photo.
- Label tags on cardstock, tilted a few degrees. One or two words each, near the top.
- One idea per clip. The clip says it with one picture, and the tags name it.

## Keep
`field()`, `grain()`, `halftone()`, `cut()`, `shape()`, `printed()`, `tag()`, `pose()`, `drawPiece()`, `drawScene()`, `draw()`, `cuesFrom()`, and the `FIELD`, `ACC`, `KEY` colours.

## Swap
`LENGTHS`, the scenes in `buildScenes()`, the drawing functions (`tower`, `lantern`, `beam`, `rock`, `waves`, `gull`, `disc`, `ring`, `burst`, `arrow`, `boat`, `moon`), and `PHOTOS`. `LENGTHS` has one entry per scene, in seconds.

A scene is `{ color, seed, push, pieces: [...] }`, with `color` a key of `FIELD` and `push` the slow zoom over the scene (default 0.05).

A piece is:

```js
{ p: shape(300, 640, paint, { seed: 3 }),   // or tag(...) or photos.name
  x: 520, y: 950,        // centre, in frame pixels
  t: .4,                 // seconds into the scene it lands; negative means already there at the first frame
  anim: 'pop',           // drop (default), pop, slide, grow, fade
  len: .25,              // how long the landing takes
  frm: [-300, 0],        // for slide: where it comes from, relative to x, y
  rot: -4, s: 1,         // tilt in degrees, scale
  sway: .8,              // degrees of slow rocking while it sits there
  boil: 1,               // hand-placed jitter; 0 holds it still
  out: 3.5,              // optional: seconds into the scene it leaves
  cue: 'pop' }           // optional sound as it lands, from the kinds in the rules
```

Later pieces draw on top. Three ways to make `p`:

- `shape(w, h, (g, w, h) => { ... }, { key, seed, noise })`: draw on the 2D context `g` at size w by h. The white border is added around whatever you paint; `key` is its width, and 0 leaves it off. Call `halftone(g, w, h, (x, y) => darkness, { cell, ink })` inside to print shading: `darkness` is 0 to 1, and dots only land on what is already painted.
- `tag(text, fill, textColour, size, seed)`: a label sized to its words.
- `photos.name`: a user's transparent PNG. Add the file with `add_media`, then list it at the top of the script: `const PHOTOS = { hero: { src: 'assets/hero.png', w: 620 } };`. It is printed as black halftone on paper with the same border. `print: false` keeps its colours, and `cell` sets the dot size.

Background removal is up to the user: the page only reads the PNG's alpha. Remove the background in any tool before `add_media`, or the piece will be a rectangle.

## Motion
`sub` 2, 30 fps, but poses change only `STEP` times a second (12), like pieces moved by hand. Set `STEP` to 30 for smooth movement. Pieces land one by one with a short overshoot, then sway and jitter a little. Each new scene slides up over the last one as a fresh sheet (`SLIDE`, 0.36 s). The whole collage pushes in slowly.

## Text
Tags use `Noto` 800, which draws Latin, Bangla and Japanese. List any other font in `opts.fonts`. Tags near the top, between y 250 and y 500, and another at the bottom only if the idea needs it. Keep them to a few words: this is B-roll, and the voice carries the sentence. Fit each tag inside the frame, because a tag's width follows its text.

Frame 0: give the main tag a `t` of about −0.2 and the big pieces negative times, so the first frame already has text and a piece still landing.

## Sound
`cuesFrom()` builds the cues: a `paper` at the start, a `whoosh` and `paper` on every new sheet, and each piece's own `cue`. `pop` for tags and small pieces, `slap` for big ones, `spark` for light, `paper` for anything laid down. The clip is usually cut in over a voice, so keep cues few.

## Watch for
- Too many pieces. If the field is mostly covered, it stops looking like a collage.
- Thin shapes such as beams look better with `key: 0`, or the border outlines them too heavily.
- Keep `sway` under 1 degree on large pieces, and up to 3 on small ones.
- Don't use a photo unless the user has the rights to it.

## Best for
Cutaways of 4 to 6 seconds between talking clips: one metaphor, a place, a tool, a date. Render a clip per idea, then cut them into the edit, or chain a few scenes as a short on its own.
