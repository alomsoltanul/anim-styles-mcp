// A clip added with add_media, as frames. Use it from an async seek(t):
//   import { footage } from './_shared/footage.js';
//   const take = await footage('take1');                       // in setup or prepare()
//   window.seek = async t => { ctx.drawImage(await take.at(t), 0, 0, 1080, 1920); ... };
// at(t) waits for the image, so a frame is never drawn half loaded. The renderer awaits seek.
export async function footage(name) {
  const base = `footage/${name}`;
  const meta = await (await fetch(`${base}/meta.json`)).json();
  const cache = new Map();
  const load = i => {
    if (!cache.has(i)) {
      const img = new Image();
      img.src = `${base}/${String(i).padStart(6, '0')}.jpg`;
      cache.set(i, img.decode().then(() => img));
      if (cache.size > 90) cache.delete(cache.keys().next().value);
    }
    return cache.get(i);
  };
  return {
    meta,
    at: t => load(Math.min(meta.frames, Math.max(1, Math.floor(t * meta.fps) + 1))),
  };
}
