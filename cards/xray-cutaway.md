# X-ray Cutaway

Target: gallery/xray-cutaway.jpg

## Look
- Navy room `#081420` falling to slate blue, with a round plinth and a gold rim.
- The shell is blue glass (`glass()`: transparent, `depthWrite: false`), so hidden parts show through. Tyres stay solid black to anchor it.
- Inner parts are the stars: steel tanks, a gold valve, cyan glowing pipes with bright beads flowing along them.
- Dark label boxes with a thin border, a bold name over a small mono spec, and a thin leader line ending in a gold dot on the part.
- Small spaced title at top, caption pill with a gold underline on the key word, grey-blue spheres for smoke.

## Keep
`glass()`, `glow()`, the plinth, `line()` pipes with beads, `toScreen()`, the leader block, label and pill CSS, the composer.

## Swap
`rickshaw3d` (any glass shell), `parts()`, `anchors`, the `.lab` boxes and `SHOW` times, title, caption.

## Motion
Slow orbit, `sub` 2. Labels reveal one by one, each timed to when that part matters, so a label never sits on the subject while it moves through.

## Text
Label name in Noto 700 at 40 px, spec in a monospace stack at 25 px. Keep to 3 labels on a phone.

## Watch for
A near part can hide what a label points at. Move the part or the anchor until the gold dot lands on something visible, and check it at every shot. `puffs()` is y-down, so use negative `rise` and `fall`.

## Best for
"How it secretly works": anything with hidden insides, like an engine, the body, a machine. `breakdown` splits a thing apart; this looks inside it whole.
