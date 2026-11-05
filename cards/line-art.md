# Sacred Line Art

Target: gallery/line-art.jpg

## Look
- Pure black, white only, nothing else.
- Subject is a wire drawing: 2 px lines with a node dot at every joint, fine inner lines at low alpha.
- Faint flower-of-life circles behind everything, rotating very slowly. Small orbiting circles.
- Stick figure with a solid white head; crowd as three rows of lollipops, bigger toward the camera.

## Keep
`line()`, `ring()`, `node()`, the geometry block, crowd rows, stick figure, ground line, orbiters.

## Swap
Subject polylines, the rings under it, caption.

## Motion
Smooth, `sub` 3. Slow and calm. Expanding rings show force or energy.

## Text
Noto 300, white, short lines. Caption at y 300 at 64 px, next line +92, on screen from frame 0. A hero number works at 190 px inside the circles with a 64 px unit word beside it; right-align the digits so the word doesn't jump.

## Watch for
Hairlines below 0.15 alpha vanish after phone compression.

## Abstract subjects
A curve can be the subject: 2.4 px line, a node per period, thin fan and plumb lines at .3 to .4 alpha, the whole path as a ghost at .24 from frame 0. The crowd can be a real counter: rows of 14, 12 and 11 for 37, hollow until lit, one `tick` each.
