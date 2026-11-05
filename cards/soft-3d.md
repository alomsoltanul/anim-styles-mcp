# Soft 3D Object

Target: gallery/soft-3d.jpg

## Look
- One clean hero object, close, filling about 85% of the width. No people.
- Soft studio light, smooth bevels, light clearcoat, saturated colours.
- Two passes: the world (layer 1) is rendered and blurred 20 px on a 2D canvas, the hero (layer 0) is drawn sharp on top. That gives strong depth of field for free.
- Pale sky, sand or street bands, soft blob shadow, white haze.

## Keep
Two-pass `draw()`, `back()` for anything in the blurred world, light and environment settings, `softDisc` sprites for jets and haze.

## Swap
Hero build, world objects, captions.

## Motion
Slow orbit plus gentle tilt, `sub` 3.

## Text
Noto 900 at 100 px, white with a 16 px black stroke, `paint-order: stroke fill`, popping in by word group, read at frame time (`tq` in `draw()`) so two lines never double-expose under `sub` 3. Sits below the hero, about 18 characters a line, two lines at most.

## Watch for
Lights must call `layers.enableAll()` or a pass goes dark. Environment too high washes colours out. `puffs()` is y-down: use negative `rise` and `fall`.
