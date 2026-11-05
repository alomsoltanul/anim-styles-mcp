# Chalkboard

Target: gallery/chalkboard.jpg

## Look
- Green board with mottled light and dark, wiped-away swirls from "earlier lessons", wood frame, tray with chalk sticks and eraser.
- All marks go on one layer, then a speckle mask punches holes so the board shows through. A soft blurred copy underneath gives chalk dust.
- Colours are chalk only: white `#f4f2ea`, yellow `#f4d35e`, pink `#f29db0`, blue `#8fd3f0`.
- Heading in Galada with a wobbly yellow underline, one law or formula below it, a circled tick when it comes true.
- Hatching fills shapes instead of solid colour. Force arrows and small notes sit beside the drawing.

## Keep
`setup()`, `chalk()`, `wob()`, `hatch()`, `write()`, `line()`, `arrow()`, the `destination-in` grain step and the blur composite at the end of `draw()`.

## Swap
Subject polylines, heading, formula, arrows, the stick figure's note.

## Motion
12 fps steps, lines boil at 8 fps through `boil` (3 poses). Drawings write themselves on with the `rev` argument. `sub` 1.

## Text
Galada carries Latin and Bangla well at 48 px and up. It has no kana, so Japanese uses `Jp` at 700 through the same grain. A one-colour line can use the font stack `'700 64px Galada, Jp'`; for two colours pass runs to `line([[text, font, colour], gap, ...], cx, y, rev)`.

Furigana can't use `<ruby>` here: `write()` the reading centred above the kanji in `Jp` 700. 36 px reads, 30 px breaks up in the grain.

The heading and the law are on the board at frame 0, with the subject already half drawn.

## Watch for
Smoke or labels crossing the subject turn into scribble. Keep at least 30 px between chalk lines.

## Sound
`paper` for writing, `slap` for a ring or circle, `drop` for a rule landing, `spark` for the tick. There is no chalk sound yet.

## Limits
`write()` is a left-to-right wipe, not stroke order.

## Layout that worked
For teaching: heading and question on top, then for each point a small stick-figure scene, the sentence with the key letter ringed, the meaning, and the rule. Two stacked halves work well, one colour per idea.
