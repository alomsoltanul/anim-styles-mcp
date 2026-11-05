# Glow Sketch

Target: gallery/glow-sketch.jpg

## Look
- Near-black `#04050a`. Every line is a row of tiny white dots (`step` about 7.5 px), not a stroke, and dots shimmer slightly.
- One gold light `255,198,104` under the subject, with thin rays falling to a dotted landing ellipse.
- Dark solid discs punch out of the glow where the subject is opaque (wheels in the demo), which gives it depth.
- Ghost frame and title plate at very low alpha; faint dotted circles for a crowd at the bottom.

## Keep
`dots()`, `glow()`, `ell()`, the `lighter` compositing order: glow, black punch-outs, dots.

## Swap
Subject polylines, the glow's position, title, caption.

## Motion
Smooth, `sub` 3. Light intensity carries the story, so ramp it instead of moving much.

## Text
Light weight only: Noto 300 at 44 to 58 px. `letterSpacing` on the canvas context is safe for joined scripts such as Bangla because it spaces whole clusters.

## Watch for
On a phone thin dots vanish below `r` 2.
