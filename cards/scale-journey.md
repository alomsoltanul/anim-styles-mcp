# Dark Gold Data Reel

Target: gallery/scale-journey.jpg

## Look
- Near-black warm background, gold `rgba(236,178,98)` lines with soft bloom (two blur canvases).
- One number explodes on screen as the structure grows from a single "you" dot.
- Inter for numbers and words.
- Opens and ends on the same frame so it loops.

## Keep
Bloom canvases, `GOLD`, easing helpers, `win()`, the loop fade.

## Swap
`TXT`, `STEPS`, `geo()` and the seeded tree data.

## Motion
Smooth, `sub` 3. The counter reads `N_at()` at frame time, so it holds still across the blur samples. Holds come from reading time.

## Sound
The starter returns no cues, so it mixes to the air bed alone. Add `digit` or `tick` per step in `prepare()`.

## Watch for
It runs about 45 s, the longest starter here, and `sub` 3 triples the frames, so render it last. Thin lines at low alpha vanish after phone compression.
