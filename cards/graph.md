# Count-up Graph

Target: gallery/graph.jpg

## Look
- White card, big black rolling number top left (`Bn` 700 at 176 px), one smooth curve.
- Coloured dots at each level with small x-axis labels, a pill that pops at each stop.
- One hook line under the chart, small grey source note at the bottom.

## Keep
Monotone curve code, `progress()`, CSS for `#num`, `#pill`, `#hook`, `#note`.

## Swap
`L` (points, labels, colours), `VMAX`, `LINES`, label, note.

## Motion
`sub` 2. Number and line move together, with a beat at each stop. The number reads `progress()` at frame time, so it holds still across the blur samples. Cues: `digits` at start, `tick` and `digit` per stop.

## Text
`comma()` from `time.js` formats the number; `bnComma()` gives Bangla digits. The hook is one line at 58 px, about 30 characters. Estimates say so on screen, with a source note.
