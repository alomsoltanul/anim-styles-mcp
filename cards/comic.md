# Comic Art

Target: gallery/comic.jpg

## Look
- Two panels on white with black borders: action above, reaction close-up below.
- Ben-Day dots: blue on pale sky, red on skin, fine grey on paper (`dotPat`).
- Flat primaries (red `#e0232e`, yellow `#ffd91a`, blue `#1f5fc4`) with 7 to 10 px black keylines everywhere.
- Radial action lines from the burst, yellow-and-red starburst with the sound word, cream narration box in the corner, speech balloon.

## Keep
`dotPat()`, `ink()`, `shape()`, `rect()`, `burst()`, panel rectangles `A` and `B`, action lines.

## Swap
`rickshaw()`, `city()`, `face()`, sound word, narration box, balloon text.

## Motion
12 fps steps, `sub` 1. Burst and balloon pop in with `backOut`. Expressions swap on a beat, no in-betweens.

## Text
Galada for sound words and balloons, red fill with a thin black stroke (7 px). Noto 700 for narration boxes. Keep a sound word to about 7 letters at 86 px so it stays inside the burst, and keep the burst clear of the subject's key shape.
