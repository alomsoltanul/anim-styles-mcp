# Black and White 3D

Target: gallery/mono-3d.jpg

## Look
- Pure black void, no background at all, and no colour anywhere.
- Glossy white objects with hard key light, black panels for contrast.
- A black mirror floor that doubles everything.
- Masses of white spheres in place of smoke or crowd. Thin white statues with raised arms at the frame edges.
- Tiny, widely spaced type. Silence and scale do the work.

## Keep
`white`, `black`, `grey`, the two-pass mirror at the end of `draw()`, lights, `statue()`, the sphere pool.

## Swap
`rickshaw3d` build with these materials, statues if unneeded, spaced labels, caption.

## Mirror
Everything in `root` draws twice: `root.scale.y = -1` under the floor, `clearDepth()`, then a dark glass plane at opacity .56 and the world again. Anything that should reflect must sit inside `root`. Raise the floor opacity for a fainter reflection.

## Motion
Slow push-in, `sub` 2.

## Text
Noto 700 at 24 to 30 px with 9 to 14 px `letter-spacing`. The caption sits above the subject, since white spheres swallow white text lower down.

## Best for
Premium, abstract, one bold idea.
