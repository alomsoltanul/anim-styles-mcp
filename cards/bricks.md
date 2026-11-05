# Brick Toy

Target: gallery/bricks.jpg

## Look
- Everything sits on a stud grid. `Set_.brick(x, y, z, w, d, colour, h = BH, top = true)` adds a brick with studs, drawn as instanced meshes. Use `h = .4` for plates, `top = false` to hide studs under a deck. Add entries to `COL` for a signature colour.
- Toy colours (`COL`), glossy plastic (roughness .38), flat sky `#8fd0fb`, soft shadows.
- Green baseplate to the horizon, grey plate pad with orange trim, stacked towers in running bond.
- A plain peg-doll figure with a smiley face: block body, ball head and hands. Smoke as round white bricks that snap to the grid.

## Keep
`Set_`, `BuildSet`, `tower()`, baseplate block, lights, grid-snapped `pops`. The figure and the pops are optional; keep them if they help the story.

## Swap
Build the subject from `brick()` calls and a few cylinders. Move the towers to suit.

## Motion
12 fps steps for stop-motion, `sub` 1. Parts snap to whole studs where possible.

## Text
Noto 800, white with a soft blue drop, 84 px at the top of the frame. Keep the top 20% of the frame for text and frame the subject under it. White on this sky is low contrast, so go as big as the line allows.

## Watch for
The figure's face must point at the camera: a sphere's texture centre starts at +x, so the head turns a quarter. Frame edges are tight at 9:16, so check the figure sits inside. Keep the figure generic: don't copy any toy maker's figure, and keep brand names out of titles.

## Build-on
For anything that assembles itself, use `BuildSet`: `add(step, x, y, z, w, d, colour)` instead of `brick()`, `build(scene)` once, then `show(Math.floor(t * 12))` in `draw()`. Bricks drop in on stepped rows. Land one or two per step at first so it reads as brick by brick, then a whole row per step. Pops: `puffs(t, { lift: () => 0, ... })` when smoke isn't tied to a take-off.

## Sound
`tick` and `tock` every 2 to 3 steps, no `zoom` (it buries the clicks), one `drop` on the last piece.

## Big subjects
Over about 30 units tall, scale the plate, sun position and shadow box with it. The grey pad is 26×14.
