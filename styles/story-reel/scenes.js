// The Second Cup: a short original story. One narrated line per shot; 'wN' is the moment the Nth word is said.
// The world is a 1080 x 1920 window: camera [540, 960, 1] shows x 0..1080, y 0..1920.
const GY = 1560;   // where the stall meets the pavement
const SUNSET = { sky1: '#F2B98A', sky2: '#FBE3C4' };
const JOE = (o = {}) => C('joe', 540, GY - 270, 1.0, { pose: 'hold', hold: 'tray', expr: 'smile', gaze: [0, .2], ...o });

// One set, seen from different places: the lane, the stall's back wall, whoever stands behind the counter, the counter, then whoever stands in front.
const LANE = (o = {}) => ({ k: 'group', blur: o.blur, items: [
  { k: 'lane', gy: 1180, ...SUNSET, ...o.sky },
  { k: 'stall', x: 540, y: GY, part: 'back', sign: "JOE'S TEA" },
  ...(o.mid || [JOE()]),
  { k: 'stall', x: 540, y: GY, part: 'front', counter: 'Tea · Toast' },
  ...(o.front || []),
] });

// A custom item: rain, drawn from lt alone. Any scene can add to ITEMS the same way.
ITEMS.rain = (g, it) => {
  const drops = [...Array(it.n || 70)].map(() => S('line', { stroke: '#BFD4F2', 'stroke-width': 4, 'stroke-linecap': 'round', opacity: .55 }, g));
  return lt => drops.forEach((d, i) => {
    const y = ((hash(i) * 2200 + lt * 1500) % 2200) - 140, x = hash(i + 50) * 1300 - 110 - y * .12;
    d.setAttribute('x1', x); d.setAttribute('y1', y); d.setAttribute('x2', x - 11); d.setAttribute('y2', y + 74);
  });
};

window.SPEC = {
  wps: 3, capStyle: 'card',
  cast: {
    lena: { female: true, skin: '#D2A074', hair: '#3A2418', hairstyle: 'bun', cloth: 'shirt', ccol: '#2E7D6B', lower: 'pants', lcol: '#34405A', earring: true },
    joe: { skin: '#9A6A48', hair: '#D8D2C8', hairstyle: 'bald', age: 'old', moustache: 'thick', mcol: '#ECE7DE', glasses: true, cloth: 'shirt', ccol: '#E6DCC6', vest: '#8A4B2D', lower: 'pants', lcol: '#3A3D46' },
    kid: { kid: true, skin: '#C68A5E', hair: '#1D1712', hairstyle: 'kid', cloth: 'tshirt', ccol: '#E2733A', lower: 'pants', lcol: '#34405A' },
    nurse: { female: true, skin: '#8E5B3C', hair: '#1D1712', hairstyle: 'long', cloth: 'shirt', ccol: '#5FA8D3', lower: 'pants', lcol: '#2F4E7A' },
    driver: { skin: '#B37A50', hair: '#2A201A', hairstyle: 'short', beard: 'full', bcol: '#2A201A', cloth: 'tshirt', ccol: '#6D3B8C', lower: 'pants', lcol: '#3A3D46' },
  },
  shots: [
    // 01 the hook: she pays for two, drinks one
    { vo: 'Every evening, *Lena* paid for *two* teas and drank *one*.', tail: 0, xf: 0, cam: { keys: [[0, 540, 1100, 1.02], ['w5', 470, 1160, 1.2], ['e', 450, 1175, 1.26]] },
      sfx: [[.1, 'steps'], ['w5.2', 'coin'], ['w6', 'coin'], ['w9', 'pop']],
      items: [LANE({ front: [C('lena', 300, 1380, 1.02, { legs: true, walk: [[0, 1]], move: [[0, 190, 1380], [1, 300, 1380]], expr: 'smile', gaze: [.7, -.1], pose: [[0, 'down'], ['w8', 'hold']], hold: 'cup' })] }),
        card(ICO.coin + ICO.coin + 'Two teas', 'w5', 760, 430, -3), TAG('The <span class="F">second cup</span>', -.3)] },
    // 02 who the second cup is for
    { vo: 'The second cup was for *whoever came next*.', tail: 0, xf: .2, grade: 'warm', cam: { from: [540, 1170, 1.3], to: [540, 1165, 1.36] },
      sfx: [['w1', 'pop'], ['w5', 'paper'], ['w7.5', 'correct']],
      items: [LANE({ mid: [JOE({ hold: undefined, pose: 'show', expr: 'grin' })] }),
        card(ICO.cup + 'One for Lena', 'w1', 340, 330, -3), card(ICO.cup + '<span>One for <span class="F">the next</span></span>', 'w5', 700, 470, 3, 640)] },
    // 03 days pass: strangers, one each, and the wall calendar runs
    { vo: 'Strangers drank for free. Nobody knew who paid.', tail: 0, xf: .25, grade: 'warm',
      tintc: '#1d2b55', tintk: [[0, 0], [.4, .3], [.8, 0], [1.2, .3], [1.6, 0], [2, .3], [2.4, 0]],
      cam: { from: [540, 1120, 1.0], to: [540, 1120, 1.05] },
      sfx: [...[...Array(10)].map((_, k) => [.2 + k * .24, 'clocktick']), ['w0', 'pop'], ['w2', 'pop'], ['w4', 'pop']],
      items: [LANE({ blur: 3 }),
        C('kid', 210, 1560, .95, { legs: true, at: 'w0', anim: 'up', hold: 'cup', pose: 'hold', expr: 'grin', gaze: [.3, -.3] }),
        C('nurse', 540, 1500, 1.08, { legs: true, at: 'w2', anim: 'up', hold: 'cup', pose: 'hold', expr: 'smile', gaze: [0, -.2] }),
        C('driver', 870, 1560, 1.02, { legs: true, at: 'w4', anim: 'up', hold: 'cup', pose: 'hold', expr: 'smile', gaze: [-.3, -.3] }),
        { k: 'cal', screen: true, x: 880, y: 500, s: .85, pages: [[0, 'March', '3'], ...[...Array(10)].map((_, k) => [.2, 'March', String(k + 4), k * .24])] },
        TAG('Day after <span class="F">day</span>', -.2)] },
    // 04 the turn: a wet night, and her purse is gone
    { vo: 'Then one rainy night, Lena *lost her purse*.', tail: 0, xf: .2, grade: 'night', cam: { from: [540, 1120, 1.5], to: [540, 1110, 1.62] }, shake: [['w6', 8, .35]],
      sfx: [[.1, 'whoosh'], ['w6', 'stamp'], ['w7.5', 'wrong']],
      items: [{ k: 'lane', gy: 1180, sky1: '#2B3A66', sky2: '#566B98' }, C('lena', 540, 1330, 1.15, { legs: true, expr: [[0, 'neutral'], ['w6', 'shock']], pose: [[0, 'fold'], ['w6', 'shrug']], gaze: [[0, -.5, .5], ['w6', 0, 0]], sweat: [['w6', 'e']] }), { k: 'rain' },
        { k: 'html', screen: true, x: 540, y: 440, w: 760, r: -5, html: '<div style="text-align:center"><span style="display:inline-block;border:9px solid #D7263D;border-radius:18px;padding:2px 30px 12px;font:900 92px Noto;color:#D7263D;background:rgba(255,255,255,.9)" data-at="w6" data-anim="stamp">No purse</span></div>' }] },
    // 05 at the stall with empty hands
    { vo: 'At the stall, she had *nothing*.', tail: 0, xf: .2, grade: 'night', cam: { from: [430, 1240, 1.28], to: [430, 1225, 1.34] },
      sfx: [['w1', 'steps'], ['w5', 'pop']],
      items: [LANE({ sky: { sky1: '#2B3A66', sky2: '#566B98' }, mid: [JOE({ hold: undefined, pose: 'fold', expr: 'neutral', gaze: [-.6, .3] })], front: [C('lena', 300, 1380, 1.02, { legs: true, expr: 'worried', pose: 'shrug', gaze: [.7, -.1], sweat: [[.4, 'e']] })] }), { k: 'rain', n: 50 }] },
    // 06 the answer
    { vo: '*Already paid*, said Joe.', tail: .1, xf: 0, grade: 'night', tint: .22, cam: { from: [540, 995, 1.85], to: [540, 990, 1.92] },
      sfx: [['w0', 'pop'], ['w2', 'stamp'], ['w3.4', 'bell']],
      items: [LANE({ sky: { sky1: '#2B3A66', sky2: '#566B98' }, mid: [JOE({ pose: 'show', hold: 'cup', expr: 'grin', talk: [['w0', 'w2.5']], gaze: [-.3, 0] })] }),
        { k: 'html', screen: true, x: 700, y: 520, w: 560, r: 6, html: '<div style="text-align:center"><span style="display:inline-block;border:9px solid #2E9E5B;border-radius:18px;padding:2px 30px 12px;font:900 92px Noto;color:#2E9E5B;background:rgba(255,255,255,.9)" data-at="w2" data-anim="stamp">Paid</span></div>' }, { k: 'rain', n: 40 }] },
    // 07 the last line, in the warm light again
    { vo: 'Kindness *comes back*. It just takes the *long way*.', tail: .7, xf: .3, grade: 'warm', cam: { from: [440, 1200, 1.3], to: [460, 1160, 1.2] },
      sfx: [[.15, 'whoosh'], ['w2', 'correct'], ['w8.5', 'bell']],
      items: [LANE({ sky: { sky1: '#BFE0EC', sky2: '#FBE3C4' }, mid: [JOE({ hold: undefined, pose: 'fold', expr: 'smile', gaze: [-.6, .1] })], front: [C('lena', 300, 1380, 1.02, { legs: true, hold: 'cup', pose: 'hold', expr: 'grin', gaze: [.7, -.1] })] }),
        SPARK('w2', 'w6', 352, 775, 1.7), MARK('The Second Cup')] },
  ],
};
