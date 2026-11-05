# Round-Head Stick Cartoon

Target: gallery/stick-figure.jpg

## Look
- A big white round head on a small body, with a heavy black outline (14 to 17 px) on everything.
- Huge round eyes with thick rims joined by a bridge, so they read as glasses. Pupils carry the acting.
- Limbs are thick black sticks with small white round hands. Clothes are flat colour with a two-tone cel split down the middle.
- The set is soft and painted: gradient sky, brush dabs, whole world blurred 5 px. The cartoon sits sharp on top of it, and that contrast is the look.
- Close-up cuts carry the jokes.

## Keep
`setup()` painting method, `ink()`, `shape()`, `limb()`, `hero()` and its pose object `{ look, open, smile, up, brow, blink }`, the `close` camera block.

## Swap
What `hero()` wears (gamcha, shirt, lungi), the set painted in `setup()`, `rickshaw()`, the lines, the `say()` times. Always an original character.

## Motion
Smooth, `sub` 2. Mouth runs from `say(a, b)` windows; with a voice, feed it the envelope as `clay-3d` does. Blinks are a short list of times. Cut to close-up on the punchline, centring on the head (`HX`, `HY`).

## Text
Noto 800 at 88 px, white with a 20 px dark stroke, across the body at y 1440. One short line at a time, about 19 characters.

## Sound
Best with a voice. Without one, keep cues few so the acting leads.

## Best for
A character telling a quick "why" story with a joke in it. Easier to edit than `clay-3d`, and no 3D needed.
