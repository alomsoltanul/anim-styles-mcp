# Breakdown Exploded View

Target: gallery/breakdown.jpg

## Look
- Dark teal-black radial background `#1b2e31` to `#0a0f11`.
- Isometric rounded glass plates stacked, then pulled apart, one part per plate.
- Numbered callouts on the right: red mono number (`01`), bold name, small grey note, thin leader line to the part.
- Mono header top left: `働 / EXPLODED VIEW`.

## Keep
`build()`, `rounded()`, `gridTexture()`, `toScreen()`, callout CSS, leader lines.

## Swap
`PARTS`, `CAPS`, `glyphParts()` and `strokes.js`, `anchorLocal`, header.

## Kanji
Strokes come from KanjiVG groups so each part keeps its true place. Credit KanjiVG (CC BY-SA 3.0, Ulrich Apel) if published. Say when a split is a memory trick and not the true structure: the demo's 亻 + 重 + 力 is one, since 働 is really 亻 + 動.

## Motion
`sub` 2. Explode between `EX0` and `EX1`, then reveal parts in order, then callouts.

## Text
Callout name `Bn` 700 at 46 px in a 330 px column, so keep names to about 12 characters. The caption is one line at 56 px, about 34 characters, and is on screen from frame 0.

## Other subjects
Any object with parts works: draw each part as a texture or mesh on its own plate.
