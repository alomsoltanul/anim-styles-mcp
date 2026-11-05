# Retro Console 3D

Target: gallery/retro-console.jpg

## Look
- three.js at 405×720, stretched to 1080×1920 by the browser, so bilinear softness comes free. CSS adds `blur(.8px)` and faint scanlines.
- `MeshLambertMaterial`, flat shading, no shadows, 8-sided wheels, chunky proportions.
- Thick pink-purple `Fog`, gradient sky, small muddy textures (32×64 windows, 128 px asphalt).
- Boxy people with a painted face texture, close to camera and cropped by the frame, arms up.
- Handheld camera drift, low angle.

## Keep
Renderer size, CSS filter, fog and light setup, `tex()`, `person()`, sprite smoke.

## Swap
`rickshaw3d()` call or your own low-poly build, city, pad mark, people colours, subtitle.

## Motion
`sub` 1, since games of that era had no motion blur. Smooth animation, not stepped.

## Text
Cutscene subtitle: white, hard black outline, low centre, Noto 700 at 62 px, about 30 characters on one line. Keep it off bright ground marks where you can.

## Watch for
A camera too close: 9:16 is narrow, so about 13 units back for a 4-unit-wide subject at fov 42.
