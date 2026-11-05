# CGI Motion

Target: gallery/cgi.jpg

## Look
- ACES tone map, `UnrealBloomPass` (strength .34, threshold .9), film grain and vignette as DOM overlays.
- Dusk sky over dark towers with tiny window lights, far enough back that sky shows above them.
- Subject is close to a silhouette: dark glossy material, red rim light from behind, warm light from under it.
- Cyan-white ring on the ground, fog low in the frame only, soft additive sprites for jets.

## Keep
Renderer, composer, `tower()`, ring, fog puffs, grain and vignette.

## Swap
Subject build and materials, city layout, captions.

## Motion
Slow push-in, `sub` 3. This is the slowest render here.

## Text
Noto 900, white, with the key word on a yellow `#ffd21f` block: «What if a rickshaw **could fly?**». Big hook at top at 84 px, about 18 characters a line, payoff low at 124 px.

## Watch for
Too much light turns the whole frame white. Hard cones look like shards, so use sprites for thrust. Keep the upper half dark. `puffs()` is y-down: use negative `rise` and `fall` in 3D.
