# ASCII Terminal

Target: gallery/ascii-terminal.jpg

## Look
- Black-green screen `#020805`, phosphor greens, amber only for warnings.
- The subject is real ASCII: `subject()` paints greys on a small hidden canvas, then `glyphs()` turns each cell's brightness into a character and a green tone. Brighter means denser.
- A shell session frames it: file header, typed command, `[ OK ]` status lines, a `[ !! ]` moment, an `ALT [####....]` bar and a status line.
- Soft phosphor glow, scanlines, slow rolling band, vignette.

## Keep
`glyphs()`, `RAMP`, `TONES`, the grid numbers, `row()`, `typed()`, the glow and scanline block at the end of `draw()`.

## Swap
`subject()` (draw anything there in greys; fill mid-grey, edges white), the command, the status lines, the HUD values, the last line.

## Motion
15 fps steps, `sub` 1, since motion blur would smear the glyphs.

## Text
All shell text goes through `mono()`: Menlo, then `ui-monospace`, Consolas and `monospace`, so each platform uses its own terminal font and `setup()` measures the cell width. Shell rows at 27 px, status lines at 30 px, the payoff line `> ...` at 52 px with a blinking block. Text in a script the mono font lacks, such as Bangla or Japanese, goes in `Noto` as a third item in the `row()` part.

## Sound
`digit` per status line, `digits` on the big moment.

## Watch for
Under about 20 columns of subject the shape stops reading, so keep it big and simple. Glyph colour needs contrast: a pure mid-grey fill reads as noise, give it clear edges.

## Best for
Tech, AI, hacking, "system" stories, anything that feels like running a program.
