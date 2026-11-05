# Map Route

Target: gallery/map-route.jpg

## Look
- White 3D city blocks on pale grey `#e9ecee`, a few green trees, tilted navigation camera following the walker.
- Blue route `#1a73e8` with a casing, position dot with halo, red pin at the destination.
- White rounded instruction card at top with a turn icon, an ETA pill low left.

## Keep
`sampleRoute()`, `at()`, `walked()`, `heading()`, `toScreen()`, card CSS.

## Swap
`CORNERS`, `STEPS`, `ARROW`, `METRES`, `PER_MIN`, card copy, the small end mark `#mark`.

## Motion
`sub` 2. The camera turns ahead of each corner so the viewer feels the turn. The ETA pill reads `walked()` at frame time, so its numbers hold still across the blur samples.

## Text
Japanese with furigana through `<ruby>` in `#jp`, the meaning under it in `#mean`. This is the template for any card with a phrase and its translation. For one language, drop `#jp` and let `#mean` carry the line.

## Watch for
Use made-up place names unless a real place is the point.
