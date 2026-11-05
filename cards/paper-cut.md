# Paper-Cut Stop-Motion

Target: `gallery/paper-cut.jpg`

## Look
- Dark theme colour behind everything, a torn cream card at the top, a second torn sheet behind the lower half, a town or hills of cut paper at the bottom.
- One huge red number with a dark red offset behind it, like two layers of card. A black torn strip under it carries the unit, then one or two short fact lines.
- Below the card, a taped sheet holds a small drawing made of flat cut-outs: no faces, no glow, no gradients.
- Edges shiver a little (hand-cut outlines redraw three ways), and fine grain lies over the whole frame.

## Keep
`shared/paper/paper.js` and `pace.js` do the look, the schedule and the sound. A page never redraws the card: it calls `PAPER.reel({...})`. Keep the page's canvas `<canvas id="c" width="1080" height="1920">`, the two script tags and the small `<style>`, load order `pace.js`, `paper.js`, then the page script.

## Swap
Everything inside `PAPER.reel({...})`, and the demo's drawing functions (`stopwatch`, `days`, `years`, `mammoth`).

```js
PAPER.reel({
  theme: 'teal',             // green indigo maroon teal plum night earth
  ground: 'town',            // town village city sea plain
  locale: 'en-US',           // number format: 'bn-BD' gives Bangla digits, 'ja-JP' Japanese grouping
  hook: ['Line one', 'line two?'],
  hookNum: { from: 60, to: 1000000000, dur: 2.4, log: true, pre: '', post: '', dec: 0, unit: 'seconds', size: 190 },  // rolls from frame 0
  hookArt(g) {},             // drawing under the hook card
  stops: [{
    name: 'A million seconds is about',   // line above the number
    val: 11.6, from: 0, dec: 1, pre: '', post: '',   // rolling number; or num: 'x3' for a fixed string
    unit: 'days',            // black strip
    fact: ['line one', 'line two'],       // appear 0.45 s after arrival
    labels: 2,               // labels inside the drawing, each adds reading time
    size: 214,               // number size; it also shrinks to fit
    art(g) {},               // this stop's drawing, slides with its card
  }],
  end: ['Line', 'Line'], cta: 'Button text', endArt(g) {},
  fixed(g) {},               // optional: one drawing that stays still across all stops
  back(g) {}, front(g) {},   // optional: under everything, over everything
  cues: SCH => [],           // extra sound cues; SCH[i] is { start, arr, leave } for stop i
  move: .75,                 // seconds a slide takes
});
```

Put a word like "about" in `name` or `pre`, not in the number.

Drawing functions get `g`: `g.t` film time, `g.since` seconds since this stop arrived, `g.hold` how long it stays, `g.k` stop index, `g.from` `g.to` `g.m` the stops a slide runs between and how far along it is (0 to 1), `g.th` theme colours, `g.ART` the drawing area.

Draw inside `ART` = `{ x: 70, y: 945, w: 940, h: 680, cx: 540, cy: 1285 }`: the card ends at y 910 and the ground starts near y 1660.

`const { x, piece, poly, circ, rect, sheet, tape, T, big, strip, icon, num, ... } = PAPER;` where `x` is the canvas context.

- `piece(path, fill, lift)`: one cut-out with a shadow. `path` is a function that traces, usually `() => circ(cx, cy, r, seed)`, `() => rect(cx, cy, w, h, rot, seed)` or `() => poly([[x, y], ...], seed, wobble)`.
- `sheet(left, top, right, bottom, fill, seed)`: torn paper. `tape(x, y, rot, w)`: a strip of tape.
- `T(text, x, y, size, weight, colour, align, maxWidth)`, `big(text, y, size)`, `strip(text, y)`. All shrink to fit.
- `icon.person drop heart moon sun star house phone bus rickshaw plane stalk bee ant flower`. Most take (x, bottomY, size, fill, seed).
- Colours: `CARD CARD2 RED RED2 GOLD MUTE SKY LEAF INK` and `g.th.bg2`.
- Helpers: `clamp lerp smooth easeOut easeIO hash rng num`.

## Motion
`sub` 1, 12 fps. The engine steps time to 12 fps, so a page must not smooth anything. Things arrive with a short pop or slide over about 0.3 s and then hold. Nothing big moves while text is being read. Stops slide in sideways, with a slight tilt.

## Text
Font is `Noto` at 600 to 900, which draws Latin, Bangla and Japanese. `shared/paper/pace.js` sets every hold from reading speed: 3 English words a second, 12 Bangla graphemes a second, 5 kana or kanji a second, plus time to find the text and read each number. Holds run from 4.5 s to 9.5 s, so copy length sets the film's length. Keep `name` under about 30 characters and fact lines under about 45. `window.textCheck()` in the browser console lists any line that had to shrink.

Key text sits between y 250 and y 800. Frame 0 shows the hook and a number already rolling.

## Sound
The engine adds `paper` and `digits` at the start, and on every stop a `whoosh`, `slap`, `digit` and `paper`, then `drop` at the end card. Add the rest through `cues`: `tick` and `tock` for a clock, `digit` for tiles, `drop` for a landing, `drip` for something falling away. No music by default.

## Watch for
- A stop needs its own moving drawing, not just a number. Only the stops with `art` or a `fixed` drawing feel finished.
- A rolling number from a large `from` to a small `val` reads as a fall, which is useful for "how much is left".
- `end` lines are short: the card grows with them, and `endArt` sits below it. Check the end frame with `stills`.
- Check every figure. If it is a sum, show the sum in a fact line so the viewer can check it too.

## Best for
One big "how much, how long, how many" question, told in three to six steps. Fact reels and data shorts with no voice, 30 to 90 seconds.
