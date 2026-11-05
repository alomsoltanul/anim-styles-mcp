// Story promo: two friends on a bench, a problem, a turn, then the product. Brand words, colours and products all come from brand.js.
// Replace the problem with a real one your product solves. The world is a 1080 x 1920 window: camera [540, 960, 1] shows all of it.
const B = window.BRAND, COL = B.colors, DARK = COL.bg, RED = COL.accent, PAPER = COL.paper, INK = COL.ink;
const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const sentence = s => `${String(s).trim().replace(/[.!?]+$/, '')}.`;
const CARDP = 'background:#FFF9EE;border-radius:26px;box-shadow:0 14px 30px rgba(30,18,6,.26);color:#2a2219';
const TALK = [['w0', 'e-.3']];   // chatter from the first word; with a voice, lip: true follows the line instead

// The name as a logo: BRAND.logo when there is one, else the name set in heavy type. A long name breaks at the space nearest its middle, unless `lines` is 1.
function wordmark(width, color, lines = 2) {
  if (B.logo) return `<img src="${esc(B.logo)}" style="max-width:${width}px;max-height:${Math.round(width * .32)}px;display:inline-block">`;
  const name = B.name, mid = name.length / 2, spaces = [...name.matchAll(/ /g)].map(m => m.index);
  const cut = lines > 1 && name.length > 16 ? spaces.sort((a, b) => Math.abs(a - mid) - Math.abs(b - mid))[0] : undefined;
  const rows = cut == null ? [name] : [name.slice(0, cut), name.slice(cut + 1)];
  const size = Math.min(Math.round(width * .17), Math.round(width / (Math.max(...rows.map(r => r.length)) * .66)));
  return `<span style="display:inline-block;font:900 ${size}px/1.1 Montserrat;color:${color};white-space:nowrap">${rows.map(esc).join('<br>')}</span>`;
}
const MARKB = () => ({ k: 'html', screen: true, x: 540, y: 160, w: 640, html: `<div style="text-align:center"><span style="display:inline-block;background:rgba(251,247,242,.9);border-radius:30px;padding:8px 24px 10px;line-height:0">${wordmark(Math.min(560, 120 + B.name.length * 16), DARK, 1)}</span></div>` });

// One corner of a street: a cafe, and a bench in front of it.
const GY = 1560, SX = 770;
const STREET = (o = {}) => ({ k: 'group', blur: o.blur, items: [
  { k: 'lane', gy: 1180, sky1: o.sky1 || '#F2B98A', sky2: o.sky2 || '#FBE3C4' },
  { k: 'stall', x: SX, y: GY, part: 'back', sign: 'CORNER CAFE' },
  { k: 'stall', x: SX, y: GY, part: 'front', counter: 'Coffee · Tea' },
] });
const NX = 280, TX = 560, BENCHY = 1720, HIP = BENCHY - 262;
const BENCH = (n = {}, t = {}) => [STREET(), { k: 'bench', x: 420, y: BENCHY, w: 620, seat: 250 },
  C('nia', NX, HIP, 1, { legs: true, gaze: [.8, 0], expr: 'neutral', ...n }), C('theo', TX, HIP, 1, { legs: true, gaze: [-.8, 0], expr: 'smile', ...t })];
const TWO = { from: [430, 1240, 1.28], to: [430, 1225, 1.33] }, NIA = { from: [NX, 1130, 2.0], to: [NX, 1125, 2.12] };

const PILL = (t, at, x, y, r) => ({ k: 'html', screen: true, x, y, w: 520, r, html: `<div style="text-align:center"><span style="display:inline-block;${CARDP};padding:12px 30px 18px;font:800 50px Noto" data-at="${at}" data-anim="pop">${t}</span></div>` });
const STAMP = (t, at, x, y, r, size = 92) => ({ k: 'html', screen: true, x, y, w: 900, r, html: `<div style="text-align:center"><span style="display:inline-block;border:9px solid ${RED};border-radius:18px;padding:2px 30px 12px;font:900 ${size}px Noto;color:${RED};background:rgba(255,255,255,.9)" data-at="${at}" data-anim="stamp">${t}</span></div>` });

// The turn: light comes up behind the hills. A custom item, drawn from lt alone.
ITEMS.sunrise = (g, it) => {
  S('rect', { x: -400, y: -400, width: 1900, height: 2800, fill: lg([[0, shade(PAPER, -.04)], [1, PAPER]]) }, g);
  const sun = S('circle', { cx: 540, r: 290, fill: RED }, g);
  S('path', { d: 'M -300,1130 C 60,780 360,790 620,930 C 820,840 1100,800 1400,1130 L 1400,2400 L -300,2400 Z', fill: DARK }, g);
  S('path', { d: 'M -300,1480 C 200,1240 700,1500 1400,1320 L 1400,2400 L -300,2400 Z', fill: shade(DARK, .12) }, g);
  const motes = [...Array(16)].map(() => S('circle', { r: 7, fill: '#fff', opacity: .7 }, g));
  return lt => {
    sun.setAttribute('cy', lerp(1180, 640, eo(lt / 1.5)));
    motes.forEach((m, i) => { const q = (lt * .14 + hash(i)) % 1; m.setAttribute('cx', hash(i + 5) * 1080 + Math.sin(q * 6 + i) * 24); m.setAttribute('cy', 1500 - q * 1300); });
  };
};

// A product: its image when BRAND gives one, otherwise a drawn block with the title's first letter.
const PLATE = [RED, DARK, shade(RED, -.28), shade(DARK, .2)];
function productCard(p, i, n, at) {
  const rows = Math.ceil(n / 2), cols = n > 1 ? 2 : 1, gap = 28, top = 320, tall = 1150;
  const h = Math.min(760, (tall - gap * (rows - 1)) / rows), w = cols === 1 ? 760 : 476, last = n % 2 && i === n - 1;
  const x = cols === 1 || last ? 540 : i % 2 ? 540 + (w + gap) / 2 : 540 - (w + gap) / 2, y = top + h / 2 + Math.floor(i / 2) * (h + gap);
  const titleSize = p.title.length <= 15 ? 42 : p.title.length <= 24 ? 36 : 30, foot = p.sub ? 138 : 92, fill = PLATE[i % PLATE.length];
  return { k: 'html', screen: true, x, y, w, html: `<div style="${CARDP};overflow:hidden;height:${h}px;display:flex;flex-direction:column" data-at="${at}" data-anim="pop">
    <div style="flex:1;min-height:0;position:relative;background:${fill};display:flex;align-items:center;justify-content:center;overflow:hidden">
      <span style="font:900 ${Math.round((h - foot) * .62)}px/1 Montserrat;color:rgba(255,255,255,.92)">${esc(p.title[0]?.toUpperCase())}</span>
      ${p.image ? `<img src="${esc(p.image)}" onerror="this.remove()" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover">` : ''}
    </div>
    <div style="height:${foot}px;box-sizing:border-box;padding:12px 16px 0;text-align:center;font:800 ${titleSize}px/1.2 Noto;color:#2a2219;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc(p.title)}
      ${p.sub ? `<div style="font:500 30px/1.4 Noto;color:#6b6358;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc(p.sub)}</div>` : ''}</div></div>` };
}
const PRODUCTS = (B.products || []).slice(0, 6);
const productLine = (() => { const t = PRODUCTS.map(p => `*${p.title}*`); return t.length > 1 ? `${t.slice(0, -1).join(', ')} and ${t.at(-1)}.` : `${t[0]}.`; })();

// A phone with a simple drawn screen. Swap the html for a real screenshot of the product if you have one.
const SCREEN = `<div style="height:100%;background:${PAPER};box-sizing:border-box;padding:92px 26px 0;text-align:center">
  <div style="line-height:0;margin-bottom:26px">${wordmark(340, DARK)}</div>
  <div style="font:700 30px/1.3 Noto;color:#2a2219;margin-bottom:30px">${esc(B.tagline)}</div>
  ${PRODUCTS.slice(0, 4).map((p, i) => `<div style="display:flex;align-items:center;gap:14px;background:#fff;border-radius:16px;padding:14px;margin-bottom:16px;text-align:left" data-at="${.5 + i * .22}" data-anim="up"><span style="flex:none;width:64px;height:64px;border-radius:14px;background:${PLATE[i % PLATE.length]};color:#fff;font:900 36px/64px Montserrat;text-align:center">${esc(p.title[0]?.toUpperCase())}</span><span style="font:700 29px/1.2 Noto;color:#2a2219;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc(p.title)}</span></div>`).join('')}</div>`;
const GRID = { k: 'html', x: 540, y: 960, w: 1400, html: `<div style="height:2200px;background-color:${PAPER};background-image:linear-gradient(${shade(PAPER, -.06)} 2px,transparent 2px),linear-gradient(90deg,${shade(PAPER, -.06)} 2px,transparent 2px);background-size:60px 60px"></div>` };

window.SPEC = {
  wps: 3, capStyle: 'card', accent: RED,
  cast: {
    nia: { female: true, skin: '#C68A5E', hair: '#2A1A12', hairstyle: 'long', cloth: 'tshirt', ccol: '#E2733A', lower: 'pants', lcol: '#34405A', blush: true },
    theo: { skin: '#A8714B', hair: '#1D1712', hairstyle: 'short', beard: 'full', bcol: '#2A201A', glasses: true, cloth: 'shirt', ccol: '#2F4E7A', pattern: 'check', pcol: '#9FB7D6', lower: 'pants', lcol: '#3A3D46' },
  },
  shots: [
    // 01 hook: the problem, loud, with paper in the air
    { vo: "I've *tried everything*. Nothing works!", who: 'Nia', tail: .2, xf: 0, cam: { from: [540, 1060, 1.22], to: [540, 1050, 1.3] },
      sfx: [[.1, 'whoosh'], ['w2', 'stamp'], ['w4', 'wrong']],
      items: [STREET({ sky1: '#BFE0EC', sky2: '#F4EAD6', blur: 2 }),
        C('nia', 540, 1330, 1.25, { legs: true, pose: [[0, 'shrug'], ['w3', 'cry']], expr: [[0, 'angry'], ['w3', 'worried']], talk: TALK, lip: true, move: [[0, 540, 1250], [.22, 540, 1330], [.44, 540, 1270], [.66, 540, 1330]] }),
        { k: 'papers', x: 540, y: 980, n: 14, at: -.3 }, STAMP('Stuck', 'w2', 790, 500, 8), TAG('Sound <span class="F">familiar?</span>', -.3), MARKB()] },
    // 02 the bench: a question
    { vo: 'What did you try?', who: 'Theo', dur: 1.9, xf: .2, grade: 'warm', cam: TWO,
      items: [...BENCH({ expr: 'sad', gaze: [.8, .3] }, { pose: 'talk', talk: TALK, lip: true }), TAG('The corner <span class="F">cafe</span>', .1), MARKB()] },
    // 03 everything she tried, one card each
    { vo: '*Three apps*, *two courses*, one *spreadsheet*.', who: 'Nia', tail: .2, xf: 0, grade: 'warm', cam: TWO,
      sfx: [['w0', 'pop'], ['w2', 'pop'], ['w4', 'pop']],
      items: [...BENCH({ pose: 'talk', expr: 'neutral', talk: TALK, lip: true, gaze: [.3, -.7] }, { pose: 'fold' }),
        PILL('3 apps', 'w0', 280, 390, -3), PILL('2 courses', 'w2', 770, 480, 3), PILL('1 spreadsheet', 'w4', 370, 600, -2), MARKB()] },
    // 04 the problem lands
    { vo: 'All too *hard*!', who: 'Nia', dur: 2.2, xf: 0, grade: 'warm', cam: NIA, shake: [['w2', 8, .35]],
      sfx: [['w2', 'stamp'], ['w3', 'wrong']],
      items: [...BENCH({ expr: [[0, 'worried'], ['w2', 'shock']], talk: TALK, lip: true, sweat: [[.4, 'e']], gaze: [0, 0] }, {}),
        STAMP('Too hard', 'w2', 540, 500, -4, 130), MARKB()] },
    // 05 the turn
    { vo: 'You need *one simple thing*.', who: 'Theo', tail: .5, xf: .3, cam: { from: [540, 960, 1], to: [540, 960, 1.05] },
      sfx: [[.1, 'riser'], ['w2', 'hit']],
      items: [{ k: 'sunrise' }, { k: 'html', screen: true, x: 540, y: 1110, w: 960, html: `<div style="text-align:center;font:900 112px/1.12 Noto;color:${INK}" data-at="w2" data-anim="pop">One simple<br>thing</div>` }, MARKB()] },
    // 06 the question the viewer has too
    { vo: '*Like what?*', who: 'Nia', dur: 1.6, xf: 0, grade: 'warm', cam: NIA,
      items: [...BENCH({ expr: 'o', talk: TALK, lip: true, gaze: [.8, -.2], tilt: 6 }, {}), MARKB()] },
    // 07 the answer: the product itself
    { vo: `*${B.name}*. ${sentence(B.tagline)}`, who: 'Theo', tail: .2, xf: .25, cam: { from: [540, 960, 1] },
      sfx: [[.1, 'whoosh'], ['w1', 'correct']],
      items: [{ k: 'wallplain', c: DARK },
        { k: 'html', x: 540, y: 800, w: 900, r: [[0, 0], ['e', 12]], html: `<svg width="900" height="900" viewBox="-450 -450 900 900">${[...Array(14)].map((_, k) => `<path d="M 0,-360 L 0,-435" stroke="${RED}" stroke-width="14" stroke-linecap="round" transform="rotate(${k * 25.7})"/>`).join('')}</svg>` },
        { k: 'phone', x: 540, y: 800, s: 1.08, bg: PAPER, at: .05, anim: 'up', html: SCREEN }] },
    // 08 every product, one card each
    ...(PRODUCTS.length ? [{ vo: productLine, who: 'Theo', tail: .4, xf: .2, cap: false,
      sfx: PRODUCTS.map((_, i) => [.3 + i * .5, 'pop']),
      items: [GRID, ...PRODUCTS.map((p, i) => productCard(p, i, PRODUCTS.length, .3 + i * .5)), MARKB()] }] : []),
    // 09 she is in
    { vo: "Okay. *I'm in!*", who: 'Nia', dur: 2, xf: .15, grade: 'warm', cam: { from: [430, 1240, 1.28], to: [430, 1225, 1.34] }, shake: [['w1', 6, .3]],
      sfx: [['w1', 'stamp'], ['w3', 'correct']],
      items: [...BENCH({ pose: 'show', expr: 'grin', talk: TALK, lip: true, gaze: [0, -.3], move: [[0, NX, HIP], [.2, NX, HIP - 60], [.45, NX, HIP]] }, { pose: 'hold', expr: 'smile' }),
        STAMP('Sorted ✓', 'w1', 540, 500, -4, 120), MARKB()] },
    // 10 end card
    { vo: sentence(B.cta), who: 'Theo', dur: 3.2, xf: .3, cap: false, cam: { from: [540, 960, 1] },
      sfx: [[.2, 'pop'], ['w1', 'correct']],
      items: [{ k: 'wallplain', c: PAPER },
        { k: 'html', screen: true, x: 540, y: 600, w: 960, html: `<div style="text-align:center;line-height:0" data-at=".1" data-anim="up">${wordmark(860, DARK)}</div>` },
        { k: 'html', screen: true, x: 540, y: 820, w: 940, html: `<div style="text-align:center;font:800 68px/1.3 Noto;color:#2a2219" data-at=".3" data-anim="up">${esc(B.tagline)}</div>` },
        { k: 'html', screen: true, x: 540, y: 1060, w: 940, html: `<div style="text-align:center"><span style="display:inline-block;background:${RED};color:#fff;border-radius:22px;padding:10px 36px 16px;font:800 56px Noto" data-at=".5" data-anim="stamp">${esc(B.cta)}</span></div>` },
        { k: 'html', screen: true, x: 540, y: 1220, w: 940, html: `<div style="text-align:center;font:800 58px Montserrat;color:${DARK}" data-at=".7" data-anim="fade">${esc(B.url)}</div>` }] },
  ],
};
