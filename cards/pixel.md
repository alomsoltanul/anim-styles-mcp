# Pixel Art

Target: gallery/pixel.jpg

## Look
- Everything is drawn on a 270×480 grid, then scaled 4× with smoothing off. Nothing is drawn at full resolution.
- Sky is a Bayer 8×8 dither through a 9-colour indigo → magenta → peach ramp.
- Sprites and text pass a hard alpha threshold, with a dark 1 px outline on sprites. No soft edges anywhere.
- Game dressing: HUD top left (label, value, green bar), hearts top right, marquee sign with chasing bulbs, grid floor, big blocky crowd at the bottom.

## Keep
`setup()` sky and city, `hardText()`, `disc()`, `beam()`, `person()`, the threshold and outline pass, the final `drawImage` upscale.

## Swap
`rickshawSprite()` (draw the subject into the small sprite canvas, the pass after it stays), marquee text, HUD label and value, crowd sign.

## Motion
15 fps steps: `t = floor(t0 * 15) / 15`. Integer positions only. `sub` 1.

## Text
Latin survives at about 14 px on this grid, and scripts with fine strokes need about 17 px. Below that letters break, so keep HUD words short. The marquee fits 8 capitals at 24 px. Use weight 600 to 800 with threshold 90 to 120.
