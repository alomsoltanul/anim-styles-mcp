# Third-party parts

The code in this repo is MIT. These bundled parts keep their own licences.

| Part | Where | Licence |
|---|---|---|
| three.js r170 | `shared/vendor/` | MIT, see `shared/vendor/three.LICENSE` |
| D3 | `shared/explainer/vendor/d3.min.js` | ISC, see `d3.LICENSE` there |
| TopoJSON Client | `shared/explainer/vendor/topojson-client.min.js` | ISC, see `topojson-client.LICENSE` there |
| World Atlas, built from Natural Earth | `shared/explainer/vendor/world50m.js` | ISC; the Natural Earth data is public domain, see `world-atlas.LICENSE` there |
| Inter, Montserrat, Galada, Noto Sans Bengali, Noto Serif Bengali, Noto Sans JP | `shared/fonts/` | SIL Open Font License 1.1, see `shared/fonts/OFL.txt` |
| KanjiVG stroke data for one kanji, by Ulrich Apel | `styles/breakdown/strokes.js` | CC BY-SA 3.0 |

If you publish a video that uses the KanjiVG strokes, credit KanjiVG. A project made from the `breakdown` starter keeps that data until you replace it.

## Installed, not bundled

| Part | Licence |
|---|---|
| Model Context Protocol SDK | MIT |
| Zod | MIT |
| Playwright | Apache-2.0 |
| ffmpeg-static, optional | GPL-3.0 for the ffmpeg binary it downloads |

ffmpeg-static fetches its binary at install time, and your system ffmpeg is used first when you have one. The repo holds no ffmpeg binary.

## Audio

All sound effects are synthesized by `tools/make-sfx.js`, and promo scores by `src/score.js`. The repo holds no third-party audio.
