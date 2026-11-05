# Minimal Graphics

Target: gallery/minimal.jpg

## Look
- Black, thin white bars rising as steps, one white dot hopping across them.
- Camera starts tight on the first bars and pulls back until the whole climb fits.
- Star field payoff at the end, one big closing line.
- Almost nothing else on screen: small caption, small count.

## Keep
`camera()`, `day()`, `top()`, star block, CSS for `.cap`, `#count`, `#big`, `#mark`.

## Swap
`N`, `CAPS`, count line, the closing number, the small end mark `#mark`.

## Motion
Slow hops first, then a fast run. `sub` 2. The count reads `day()` at frame time, so it holds still across the blur samples.

## Text
`Bn` 400, 54 px, top third. Bars are the story, so text stays quiet.

## Best with
Maths of small steps: 5 words a day for 100 days.
