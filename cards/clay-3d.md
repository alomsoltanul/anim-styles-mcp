# Clay 3D Character

Target: gallery/clay-3d.jpg

## Look
- Original character: big head, round glasses, navy suit. Never a character from another channel.
- Clay material: `MeshPhysicalMaterial`, roughness .56, bump from `clayBump()`.
- Blue-sky studio, soft shadows, props built from `sph`, `cap`, `box`.
- Bold word caption low in frame: white with dark stroke, key word yellow `#FFD640`.

## Keep
`clay()`, builders, `makeMan()`, `setPose()`, `setFace()`, `mouthAt()`, `blink()`, lights, `groups()`.

## Swap
Props (`makeTrain`, `makeCard`), `POSE`, the shots in `draw()`, `KEY`, and the voice in `vo/`.

## Voice
This look is voice-led. The starter ships `vo/timing.js` with demo lines and a made-up mouth envelope, so it runs silently with a moving mouth. `add_voice` overwrites that file and the page needs no change:

- Captions come from `LINES[].text`, about three words at a time. A line added from a file with no text gets no caption.
- `KEY` holds the phrases that turn yellow, and the kana line under the caption shows only when a caption contains `chien`.
- The seven shots hang on seven lines through `slot()` and `within()`. With any other number of lines they share `DUR` evenly.

## Motion
`sub` 2. Shot list in `draw()`; poses blend with `setPose(a, b, k)`. The mouth follows `mouthAt(t)` in the shots that face the camera.

## Text
`Bn` 800 at 84 px, about 17 characters per caption. Captions read at frame time (`tq` in `draw()`), so two groups never double-expose under `sub` 2. The demo's Japanese (certificate, phone screen, station sign) is the subject, so swap it with the subject.

## Watch for
Heaviest starter to edit (300 lines). For a clip with no talking person, `soft-3d` is quicker.
