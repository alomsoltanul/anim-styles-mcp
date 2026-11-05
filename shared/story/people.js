// Story engine, part 2: the cast. A character is one SVG group built once and posed by updChar(lt).
import { CUR, ITEMS, S, SPEC, DEFS, dsp, hash, inSpan, kf, lg, nextSeed, patCheck, rg, shade, step, uid } from './core.js';

// Filled from vo/timing.js when add_voice has run: mouth openness 0 to 9 at `fps` per second, on the film's own clock.
export const mouth = { curve: null, fps: 30 };

// unit space: hips at (0,0), head centre (0,-345), chin -278, shoulders -262. Characters face the camera.
const HEADP = 'M -58,-352 C -60,-421 60,-421 58,-352 C 57,-311 34,-279 0,-277 C -34,-279 -57,-311 -58,-352 Z';
const POSES = {
  down:   { L: [[-90, -238], [-104, -142], [-106, -52]], R: [[90, -238], [104, -142], [106, -52]] },
  fold:   { L: [[-90, -238], [-110, -140], [-16, -112]], R: [[90, -238], [110, -140], [16, -108]] },
  hold:   { L: [[-90, -238], [-112, -150], [-50, -150]], R: [[90, -238], [112, -150], [50, -150]] },
  talk:   { L: [[-90, -238], [-104, -142], [-106, -52]], R: [[90, -238], [124, -150], [88, -222]] },
  point:  { L: [[-90, -238], [-104, -142], [-106, -52]], R: [[90, -238], [168, -214], [246, -236]] },
  phone:  { L: [[-90, -238], [-104, -142], [-106, -52]], R: [[90, -238], [114, -142], [50, -196]] },
  show:   { L: [[-90, -238], [-104, -142], [-106, -52]], R: [[90, -238], [156, -186], [196, -262]] },
  shrug:  { L: [[-90, -238], [-142, -158], [-160, -214]], R: [[90, -238], [142, -158], [160, -214]] },
  hips:   { L: [[-90, -238], [-146, -150], [-88, -82]], R: [[90, -238], [146, -150], [88, -82]] },
  chin:   { L: [[-90, -238], [-110, -140], [-16, -112]], R: [[90, -238], [104, -158], [24, -270]], front: 'R' },
  cry:    { L: [[-90, -238], [-104, -168], [-30, -334]], R: [[90, -238], [104, -168], [30, -334]], front: 'LR' },
  wipe:   { L: [[-90, -238], [-104, -142], [-106, -52]], R: [[90, -238], [104, -170], [28, -342]], front: 'R' },
  eat:    { L: [[-90, -238], [-112, -150], [-52, -140]], R: [[90, -238], [108, -164], [16, -298]], front: 'R' },
  handle: { L: [[-90, -238], [-126, -166], [-150, -118]], R: [[90, -238], [126, -166], [150, -118]] },
  write:  { L: [[-90, -238], [-112, -150], [-50, -132]], R: [[90, -238], [112, -150], [40, -118]] },
};
function buildChar(g, c, it) {
  const P = { g, c };
  const skin = c.skin || '#C68A5E', skinD = shade(skin, -.16), hairC = c.hair || '#1d1712', cc = c.ccol || '#3d6fb6', cc2 = c.ccol2 || shade(cc, -.3);
  const fem = !!c.female, sw = fem ? 84 : 94, legs = !!(it.legs ?? c.legs);
  const len = legs ? (['panjabi', 'kameez', 'robe'].includes(c.cloth) ? 120 : c.cloth === 'saree' ? 0 : 34) : 70;
  const body = S('g', {}, g); P.body = body;
  const headBack = S('g', {}, body); P.headBack = headBack;
  // back hair / headwear behind
  if (c.headwear === 'hijab') S('path', { d: 'M -92,-350 C -98,-456 98,-456 92,-350 L 122,-196 C 80,-168 -80,-168 -122,-196 Z', fill: shade(c.hcol, -.12) }, headBack);
  else if (c.headwear === 'ghomta') S('path', { d: 'M -78,-346 C -90,-458 90,-458 78,-346 L 106,-232 L -106,-232 Z', fill: shade(cc, -.1) }, headBack);
  if (c.hairstyle === 'long') S('path', { d: 'M -66,-362 C -84,-446 84,-446 66,-362 L 88,-196 C 60,-176 -60,-176 -88,-196 Z', fill: hairC }, headBack);
  if (c.hairstyle === 'braid') { S('path', { d: 'M -64,-362 C -80,-446 80,-446 64,-362 L 70,-250 L -70,-250 Z', fill: hairC }, headBack); }
  if (c.hairstyle === 'bun') S('circle', { cx: 0, cy: -414, r: 30, fill: hairC }, headBack);
  // legs
  if (legs) {
    const lw = c.lower || (c.cloth === 'saree' || c.cloth === 'robe' ? 'skirt' : c.cloth === 'panjabi' ? 'pyjama' : 'pants');
    const lg2 = S('g', {}, body); P.legs = lg2;
    const feetY = 262;
    if (lw === 'lungi') S('path', { d: 'M -86,-10 L 86,-10 L 98,250 L -98,250 Z', fill: patCheck(c.lcol || '#2F5D8C', '#E9E4D8', 30, .45) }, lg2);
    else if (lw === 'skirt') { S('path', { d: 'M -88,-10 L 88,-10 L 106,262 L -106,262 Z', fill: c.cloth === 'robe' ? cc : cc }, lg2); if (c.cloth === 'saree') S('rect', { x: -106, y: 236, width: 212, height: 22, fill: cc2 }, lg2); }
    else { const lc = lw === 'pyjama' ? '#EDE8DD' : (c.lcol || '#3a3d46'); S('path', { d: 'M -84,-10 L -4,-10 L -10,250 L -80,250 Z', fill: lc }, lg2); S('path', { d: 'M 84,-10 L 4,-10 L 10,250 L 80,250 Z', fill: shade(lc, -.06) }, lg2); }
    P.feet = [-1, 1].map(sd => { const f = S('g', {}, lg2); S('ellipse', { cx: sd * 44, cy: feetY, rx: 34, ry: 13, fill: '#3b2a20' }, f); S('ellipse', { cx: sd * 44, cy: feetY - 6, rx: 24, ry: 9, fill: skin }, f); return f; });
  }
  // neck + torso
  S('rect', { x: -19, y: -294, width: 38, height: 44, rx: 10, fill: skinD }, body);
  const cloth = c.pattern === 'check' ? patCheck(cc, c.pcol || '#ffffff', 28, .38) : lg([[0, shade(cc, .07)], [1, shade(cc, -.1)]]);
  const top = -262, bot = len;
  const torsoD = fem
    ? `M ${-sw},${top + 30} Q ${-sw},${top} ${-sw + 30},${top} L ${sw - 30},${top} Q ${sw},${top} ${sw},${top + 30} C ${sw - 8},-140 ${sw - 14},-70 ${sw - 4},${bot} L ${-sw + 4},${bot} C ${-sw + 14},-70 ${-sw + 8},-140 ${-sw},${top + 30} Z`
    : `M ${-sw},${top + 30} Q ${-sw},${top} ${-sw + 34},${top} L ${sw - 34},${top} Q ${sw},${top} ${sw},${top + 30} L ${sw - 4},${bot} L ${-sw + 4},${bot} Z`;
  S('path', { d: torsoD, fill: c.cloth === 'saree' ? lg([[0, shade(cc2, .08)], [1, shade(cc2, -.1)]]) : cloth, stroke: shade(c.cloth === 'saree' ? cc2 : cc, -.2), 'stroke-width': 3 }, body);
  const det = S('g', {}, body);
  if (c.cloth === 'panjabi') {
    S('rect', { x: -25, y: -270, width: 50, height: 13, rx: 5, fill: shade(cc, -.1) }, det);
    S('line', { x1: 0, y1: -258, x2: 0, y2: -150, stroke: shade(cc, -.2), 'stroke-width': 3 }, det);
    [-236, -206, -176].forEach(y => S('circle', { cx: 0, cy: y, r: 4, fill: c.button || shade(cc, -.35) }, det));
  } else if (c.cloth === 'shirt') {
    S('path', { d: 'M -30,-268 L -2,-232 L -8,-268 Z M 30,-268 L 2,-232 L 8,-268 Z', fill: shade(cc, .15), stroke: shade(cc, -.2), 'stroke-width': 2 }, det);
    S('line', { x1: 0, y1: -240, x2: 0, y2: bot, stroke: shade(cc, -.25), 'stroke-width': 3 }, det);
    [-212, -172, -132, -92].forEach(y => y < bot && S('circle', { cx: 0, cy: y, r: 4, fill: '#f4f1ea' }, det));
    S('rect', { x: -66, y: -214, width: 34, height: 30, rx: 4, fill: 'none', stroke: shade(cc, -.25), 'stroke-width': 2.5 }, det);
  } else if (c.cloth === 'tshirt') {
    S('path', { d: 'M -28,-263 Q 0,-236 28,-263', fill: skinD, stroke: shade(cc, -.22), 'stroke-width': 7 }, det);
    if (c.print) S('text', { x: 0, y: -170, 'text-anchor': 'middle', 'font-family': 'Montserrat', 'font-weight': 800, 'font-size': 34, fill: c.print[1] || '#fff' }, det).textContent = c.print[0];
  } else if (c.cloth === 'kameez') {
    S('path', { d: 'M -24,-263 L 0,-226 L 24,-263 Z', fill: skinD }, det);
    if (c.ocol) S('path', { d: 'M -86,-252 C -60,-170 60,-170 86,-252 L 86,-220 C 60,-138 -60,-138 -86,-220 Z', fill: c.ocol }, det);
  } else if (c.cloth === 'saree') {
    S('path', { d: 'M -22,-263 Q 0,-240 22,-263 Z', fill: skinD }, det);
    S('path', { d: `M 26,-264 L 92,-246 L ${-36},${bot + 4} L -92,${bot + 4} L -94,-6 Z`, fill: lg([[0, shade(cc, .1)], [1, shade(cc, -.06)]]) }, det);
    S('path', { d: `M 26,-264 L -94,-6 M 92,-246 L -36,${bot + 4}`, stroke: cc2, 'stroke-width': 9, fill: 'none' }, det);
    if (c.motif) [[10, -150], [-30, -80], [40, -200]].forEach(([x, y]) => S('circle', { cx: x, cy: y, r: 7, fill: c.motif, opacity: .8 }, det));
  } else if (c.cloth === 'robe') {
    S('path', { d: 'M 0,-230 L 0,' + bot, stroke: shade(cc, -.15), 'stroke-width': 3 }, det);
  }
  if (c.vest) {
    const vf = lg([[0, shade(c.vest, .06)], [1, shade(c.vest, -.08)]]);
    S('path', { d: `M ${-sw},${top + 30} Q ${-sw},${top} ${-sw + 34},${top} L -30,${top} L -22,${Math.min(bot, 40)} L ${-sw + 6},${Math.min(bot, 40)} Z`, fill: vf }, det);
    S('path', { d: `M ${sw},${top + 30} Q ${sw},${top} ${sw - 34},${top} L 30,${top} L 22,${Math.min(bot, 40)} L ${sw - 6},${Math.min(bot, 40)} Z`, fill: vf }, det);
  }
  if (c.headwear === 'hijab') S('path', { d: 'M -98,-300 C -112,-230 -102,-188 -90,-146 C -40,-124 40,-124 90,-146 C 102,-188 112,-230 98,-300 Z', fill: c.hcol }, det);
  if (c.gamchha) {
    const gp = patCheck(c.gamchha[0] || '#C0392B', c.gamchha[1] || '#2E7D32', 24, .55);
    S('path', { d: 'M -92,-252 Q -64,-274 -36,-264 L -44,-104 L -80,-100 Z', fill: gp }, det);
    S('path', { d: 'M -80,-100 L -44,-104 L -46,-92 L -78,-88 Z', fill: '#F3E9D2' }, det);
  }
  if (c.bag) { S('path', { d: 'M -70,-262 L 86,-80', stroke: '#8a6a3e', 'stroke-width': 9, fill: 'none' }, det); }
  // arms (each pose drawn once; update() shows one)
  P.poses = {}; P.armsBack = S('g', {}, body);
  const head = S('g', {}, body); P.head = head;
  P.armsFront = S('g', {}, body);
  const sleeve = shade(c.cloth === 'saree' ? cc2 : cc, -.08), short = c.sleeves === 'short' || c.cloth === 'saree';
  for (const [name, ps] of Object.entries(POSES)) {
    const gb = S('g', { display: 'none' }, P.armsBack), gf = S('g', { display: 'none' }, P.armsFront);
    for (const side of ['L', 'R']) {
      const tgt = (ps.front || '').includes(side) ? gf : gb, [s0, e, w] = ps[side];
      const ln = { 'stroke-linecap': 'round', 'stroke-linejoin': 'round', fill: 'none' }, mid = [s0[0] + (e[0] - s0[0]) * .62, s0[1] + (e[1] - s0[1]) * .62];
      if (short) {
        S('path', { d: `M ${s0} L ${e} L ${w}`, stroke: skinD, 'stroke-width': 32, ...ln }, tgt);
        S('path', { d: `M ${s0} L ${e} L ${w}`, stroke: skin, 'stroke-width': 27, ...ln }, tgt);
        S('path', { d: `M ${s0} L ${mid}`, stroke: shade(c.pattern === 'check' ? cc : sleeve, -.25), 'stroke-width': 47, ...ln }, tgt);
        S('path', { d: `M ${s0} L ${mid}`, stroke: c.pattern === 'check' ? cloth : sleeve, 'stroke-width': 42, ...ln }, tgt);
      } else {
        S('path', { d: `M ${s0} L ${e} L ${w}`, stroke: shade(sleeve, -.22), 'stroke-width': 43, ...ln }, tgt);
        S('path', { d: `M ${s0} L ${e} L ${w}`, stroke: sleeve, 'stroke-width': 37, ...ln }, tgt);
      }
      S('circle', { cx: w[0], cy: w[1], r: 17, fill: skin, stroke: skinD, 'stroke-width': 2.5 }, tgt);
    }
    P.poses[name] = [gb, gf];
  }
  // head
  S('ellipse', { cx: -57, cy: -345, rx: 9, ry: 15, fill: skinD }, head);
  S('ellipse', { cx: 57, cy: -345, rx: 9, ry: 15, fill: skinD }, head);
  if (c.earring) [-1, 1].forEach(sd => S('circle', { cx: sd * 58, cy: -326, r: 5, fill: '#E3B23C' }, head));
  S('path', { d: HEADP, fill: rg([[0, shade(skin, .07)], [1, shade(skin, -.04)]], .4, .3, .8) }, head);
  if (c.age === 'old') S('path', { d: 'M -26,-392 Q 0,-398 26,-392 M -20,-382 Q 0,-387 20,-382', stroke: skinD, 'stroke-width': 2.4, fill: 'none', opacity: .6 }, head);
  if (fem || c.blush) [-1, 1].forEach(sd => S('circle', { cx: sd * 34, cy: -318, r: 11, fill: '#E07A7A', opacity: .22 }, head));
  // eyes
  P.eyes = []; P.irises = []; P.closed = [];
  for (const sd of [-1, 1]) {
    const eg = S('g', { transform: `translate(${sd * 23},-350)` }, head), op = S('g', {}, eg);
    const cid = uid('ec'); const cp = S('clipPath', { id: cid }, DEFS); S('ellipse', { rx: 12.5, ry: 8.8 }, cp);
    S('ellipse', { rx: 12.5, ry: 8.8, fill: '#FBF8F2' }, op);
    const ir = S('g', { 'clip-path': `url(#${cid})` }, op), irg = S('g', {}, ir);
    S('circle', { r: 7.2, fill: c.eye || '#3a2416' }, irg); S('circle', { r: 3.7, fill: '#120c08' }, irg); S('circle', { cx: 2.3, cy: -2.3, r: 1.8, fill: '#fff' }, irg);
    S('path', { d: 'M -14,-1 Q 0,-12.5 14,-1', stroke: '#2a1a12', 'stroke-width': 3.2, fill: 'none', 'stroke-linecap': 'round' }, op);
    if (fem) S('path', { d: `M ${sd * 12},-4 l ${sd * 6},-5`, stroke: '#2a1a12', 'stroke-width': 2.6, 'stroke-linecap': 'round' }, op);
    if (c.age === 'old') S('path', { d: 'M -10,10 Q 0,15 10,10', stroke: skinD, 'stroke-width': 2, fill: 'none' }, op);
    const lid = S('path', { d: 'M -14,-8 L 14,-8 L 14,1 Q 0,-4 -14,1 Z', fill: skin, display: 'none' }, op);
    const cl = S('path', { d: 'M -12,2 Q 0,-8 12,2', stroke: '#2a1a12', 'stroke-width': 3.4, fill: 'none', 'stroke-linecap': 'round', display: 'none' }, eg);
    const cl2 = S('path', { d: 'M -12,-1 Q 0,6 12,-1', stroke: '#2a1a12', 'stroke-width': 3.4, fill: 'none', 'stroke-linecap': 'round', display: 'none' }, eg);
    P.eyes.push({ op, lid }); P.irises.push(irg); P.closed.push([cl, cl2]);
  }
  P.brows = [-1, 1].map(sd => { const b = S('g', {}, head); S('path', { d: 'M -12,2 Q 0,-5 12,0', stroke: c.brow || (c.age === 'old' ? '#8d877d' : hairC), 'stroke-width': fem ? 3.6 : 5, fill: 'none', 'stroke-linecap': 'round', transform: sd > 0 ? 'scale(-1,1)' : null }, b); return b; });
  S('path', { d: 'M -2,-340 Q -8,-318 -1,-314 Q 4,-313 8,-317', stroke: skinD, 'stroke-width': 3.2, fill: 'none', 'stroke-linecap': 'round' }, head);
  if (c.nosepin) S('circle', { cx: 9, cy: -318, r: 2.6, fill: '#F2C94C' }, head);
  // mouths
  const lip = c.paan ? '#B3232E' : fem ? '#A64650' : '#6b3b2e', mdark = c.paan ? '#7A1018' : '#4a1d1a';
  const mg = S('g', { transform: 'translate(0,-301)' }, head); P.mouths = {};
  const M = (n, f) => { const g2 = S('g', { display: 'none' }, mg); f(g2); P.mouths[n] = g2; };
  M('neutral', m => S('path', { d: 'M -12,0 Q 0,3 12,0', stroke: lip, 'stroke-width': 4.2, fill: 'none', 'stroke-linecap': 'round' }, m));
  M('smile', m => S('path', { d: 'M -19,-4 Q 0,13 19,-4', stroke: lip, 'stroke-width': 4.4, fill: 'none', 'stroke-linecap': 'round' }, m));
  M('sad', m => S('path', { d: 'M -15,6 Q 0,-6 15,6', stroke: lip, 'stroke-width': 4.4, fill: 'none', 'stroke-linecap': 'round' }, m));
  M('smug', m => S('path', { d: 'M -14,1 Q 4,6 18,-6', stroke: lip, 'stroke-width': 4.4, fill: 'none', 'stroke-linecap': 'round' }, m));
  M('nervous', m => S('path', { d: 'M -18,0 l 6,-4 l 6,4 l 6,-4 l 6,4 l 6,-4', stroke: lip, 'stroke-width': 3.6, fill: 'none', 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, m));
  M('o', m => S('ellipse', { rx: 8, ry: 11, fill: mdark }, m));
  M('t1', m => { S('ellipse', { rx: 11, ry: 5, fill: mdark }, m); });
  M('t2', m => { S('path', { d: 'M -14,-3 Q 0,-6 14,-3 Q 10,13 0,14 Q -10,13 -14,-3 Z', fill: mdark }, m); S('path', { d: 'M -8,8 Q 0,4 8,8 Q 0,13 -8,8 Z', fill: '#c4545c' }, m); });
  M('grin', m => { S('path', { d: 'M -22,-5 Q 0,-3 22,-5 Q 16,18 0,19 Q -16,18 -22,-5 Z', fill: mdark }, m); S('path', { d: 'M -18,-4 Q 0,-2 18,-4 L 16,3 Q 0,5 -16,3 Z', fill: '#fff' }, m); });
  M('laugh', m => { S('path', { d: 'M -24,-6 Q 0,-3 24,-6 Q 18,26 0,27 Q -18,26 -24,-6 Z', fill: mdark }, m); S('path', { d: 'M -20,-5 Q 0,-3 20,-5 L 18,2 Q 0,4 -18,2 Z', fill: '#fff' }, m); S('path', { d: 'M -10,18 Q 0,12 10,18 Q 0,25 -10,18 Z', fill: '#c4545c' }, m); });
  M('chew', m => S('path', { d: 'M -14,0 Q -6,6 0,2 Q 6,6 14,0', stroke: lip, 'stroke-width': 4.2, fill: 'none', 'stroke-linecap': 'round' }, m));
  if (c.paan) S('path', { d: 'M 12,-296 q 3,8 1,14', stroke: '#B3232E', 'stroke-width': 2.4, fill: 'none', opacity: .7 }, head);
  if (c.moustache) S('path', { d: c.moustache === 'thick' ? 'M -27,-310 Q -14,-326 0,-317 Q 14,-326 27,-310 Q 16,-306 0,-310 Q -16,-306 -27,-310 Z' : 'M -20,-313 Q -10,-320 0,-316 Q 10,-320 20,-313 Q 10,-312 0,-313 Q -10,-312 -20,-313 Z', fill: c.mcol || hairC }, head);
  if (c.beard === 'goatee') S('path', { d: 'M -15,-290 Q 0,-286 15,-290 Q 12,-262 0,-252 Q -12,-262 -15,-290 Z', fill: c.bcol || '#d9d4cb' }, head);
  if (c.beard === 'full') S('path', { d: 'M -57,-346 C -59,-298 -30,-258 0,-254 C 30,-258 59,-298 57,-346 C 48,-312 28,-292 0,-292 C -28,-292 -48,-312 -57,-346 Z', fill: c.bcol || hairC }, head);
  // hair front
  const hf = S('g', {}, head);
  if (c.hairstyle === 'short') S('path', { d: 'M -61,-346 C -70,-420 -24,-440 6,-434 C 48,-431 72,-404 61,-348 C 56,-372 46,-388 28,-392 C 8,-386 -14,-393 -28,-390 C -46,-386 -55,-371 -61,-346 Z', fill: hairC }, hf);
  if (c.hairstyle === 'kid') S('path', { d: 'M -62,-344 C -70,-412 -30,-440 0,-436 L 8,-452 L 18,-432 L 32,-446 L 38,-426 C 64,-414 72,-392 62,-346 C 54,-376 36,-392 14,-390 C -6,-396 -30,-392 -44,-382 C -54,-372 -58,-360 -62,-344 Z', fill: hairC }, hf);
  if (c.hairstyle === 'bald') { [-1, 1].forEach(sd => S('path', { d: `M ${sd * 60},-326 C ${sd * 66},-366 ${sd * 54},-390 ${sd * 38},-398 C ${sd * 48},-380 ${sd * 50},-358 ${sd * 50},-326 Z`, fill: hairC }, hf)); S('ellipse', { cx: -16, cy: -396, rx: 16, ry: 6, fill: '#fff', opacity: .28 }, hf); }
  if (['long', 'braid', 'bun'].includes(c.hairstyle)) {
    S('path', { d: 'M -61,-336 C -66,-414 -6,-436 0,-416 C 6,-436 66,-414 61,-336 C 54,-378 26,-398 0,-398 C -26,-398 -54,-378 -61,-336 Z', fill: hairC }, hf);
    if (c.hairstyle === 'long') [-1, 1].forEach(sd => S('path', { d: `M ${sd * 58},-350 C ${sd * 70},-300 ${sd * 66},-250 ${sd * 78},-206 L ${sd * 56},-206 C ${sd * 54},-250 ${sd * 52},-300 ${sd * 48},-340 Z`, fill: hairC }, hf));
  }
  if (c.flower) S('g', { transform: 'translate(46,-392)' }, hf).innerHTML = [0, 72, 144, 216, 288].map(a => `<ellipse rx="7" ry="13" cy="-9" fill="#fff" transform="rotate(${a})"/>`).join('') + '<circle r="5" fill="#F2C94C"/>';
  if (c.glasses) S('g', {}, head).innerHTML = `<rect x="-41" y="-363" width="35" height="27" rx="8" fill="rgba(255,255,255,.14)" stroke="#2b2b2b" stroke-width="3.6"/><rect x="6" y="-363" width="35" height="27" rx="8" fill="rgba(255,255,255,.14)" stroke="#2b2b2b" stroke-width="3.6"/><path d="M -6,-354 Q 0,-358 6,-354 M -41,-354 L -56,-350 M 41,-354 L 56,-350" stroke="#2b2b2b" stroke-width="3.2" fill="none"/>`;
  if (c.headwear === 'tupi') { const tg = S('g', {}, head); S('path', { d: 'M -55,-378 C -53,-434 53,-434 55,-378 Q 0,-390 -55,-378 Z', fill: '#F5F2EA', stroke: '#d6cfbf', 'stroke-width': 2 }, tg); for (let i = 0; i < 9; i++) S('circle', { cx: -40 + i * 10, cy: -398 + Math.abs(i - 4) * 2.4, r: 2.2, fill: '#cfc6b3' }, tg); }
  if (c.headwear === 'hijab') S('path', { d: 'M -76,-350 A 76,90 0 1 1 76,-350 A 76,90 0 1 1 -76,-350 Z M -47,-340 A 47,61 0 1 0 47,-340 A 47,61 0 1 0 -47,-340 Z', fill: c.hcol, 'fill-rule': 'evenodd' }, head);
  if (c.headwear === 'ghomta') { S('path', { d: 'M -72,-316 C -80,-446 80,-446 72,-316', stroke: shade(cc, .05), 'stroke-width': 24, fill: 'none' }, head); S('path', { d: 'M -60,-318 C -66,-428 66,-428 60,-318', stroke: cc2, 'stroke-width': 5, fill: 'none' }, head); }
  // tears + sweat
  P.tears = S('g', { display: 'none' }, body); P.tearDrops = [0, 1, 2, 3].map(k => S('path', { d: 'M 0,-7 Q 6,2 0,6 Q -6,2 0,-7 Z', fill: '#7EC8F2' }, P.tears));
  P.sweat = S('path', { d: 'M 0,-10 Q 8,2 0,8 Q -8,2 0,-10 Z', fill: '#8FD3FF', stroke: '#4aa3d8', 'stroke-width': 2, display: 'none' }, body);
  // hand props
  const hp = S('g', {}, body); P.hold = hp;
  if (it.hold === 'phone') S('g', { transform: 'translate(50,-224)' }, hp).innerHTML = '<rect x="-17" y="-32" width="34" height="62" rx="7" fill="#222"/><rect x="-14" y="-27" width="28" height="50" rx="3" fill="#7fd3ff" opacity=".85"/>';
  if (it.hold === 'phoneUp') S('g', { transform: 'translate(204,-300) rotate(8)' }, hp).innerHTML = '<rect x="-30" y="-56" width="60" height="108" rx="11" fill="#222"/><rect x="-25" y="-48" width="50" height="90" rx="4" fill="#e9f6ff"/><rect x="-18" y="-30" width="36" height="8" rx="3" fill="#9aa6b2"/><rect x="-18" y="-12" width="36" height="8" rx="3" fill="#c3cbd3"/><rect x="-18" y="6" width="24" height="8" rx="3" fill="#D7263D"/>';
  if (it.hold === 'tray') S('g', { transform: 'translate(0,-150)' }, hp).innerHTML = '<ellipse cx="0" cy="6" rx="150" ry="22" fill="#cfd6dc"/><ellipse cx="0" cy="0" rx="150" ry="22" fill="#eef2f5" stroke="#b7c0c8" stroke-width="3"/>' + [-80, 0, 80].map(x => `<g transform="translate(${x},-12)"><ellipse cy="10" rx="28" ry="8" fill="#fff" stroke="#c9c1b2" stroke-width="2"/><path d="M -18,-18 L 18,-18 L 14,8 L -14,8 Z" fill="#fff" stroke="#c9c1b2" stroke-width="2"/><ellipse cy="-18" rx="18" ry="5" fill="#9b5b2e"/><path d="M 18,-12 q 12,2 0,14" stroke="#c9c1b2" stroke-width="3" fill="none"/></g>`).join('');
  if (it.hold === 'clipboard') S('g', { transform: 'translate(0,-150) rotate(-4)' }, hp).innerHTML = '<rect x="-62" y="-70" width="124" height="150" rx="8" fill="#9b6b3f"/><rect x="-52" y="-56" width="104" height="128" fill="#fffdf6"/><rect x="-22" y="-80" width="44" height="20" rx="5" fill="#bfc5ca"/>' + [-30, -8, 14, 36].map(y => `<rect x="-40" y="${y}" width="${y === 36 ? 50 : 80}" height="6" rx="3" fill="#b7ad9c"/>`).join('');
  if (it.hold === 'file') S('g', { transform: 'translate(0,-148) rotate(3)' }, hp).innerHTML = '<rect x="-70" y="-52" width="140" height="104" rx="6" fill="#E9C46A"/><rect x="-70" y="-60" width="58" height="14" rx="4" fill="#E9C46A"/><rect x="-46" y="-30" width="92" height="8" rx="3" fill="#b8913a"/>';
  if (it.hold === 'plate') S('g', { transform: 'translate(-52,-150)' }, hp).innerHTML = '<ellipse cx="0" cy="4" rx="64" ry="16" fill="#e3e8ec"/><ellipse rx="64" ry="16" fill="#fafcfd" stroke="#c6ced4" stroke-width="2"/><circle cx="-18" cy="-8" r="13" fill="#7b3f1d"/><circle cx="14" cy="-9" r="13" fill="#8a4a24"/><circle cx="-20" cy="-12" r="4" fill="#fff" opacity=".4"/>';
  if (it.hold === 'cup') S('g', { transform: 'translate(0,-164)' }, hp).innerHTML = '<ellipse cy="32" rx="34" ry="9" fill="#fff" stroke="#c9c1b2" stroke-width="2"/><path d="M -28,-24 L 28,-24 L 21,30 L -21,30 Z" fill="#fff" stroke="#c9c1b2" stroke-width="2.5"/><ellipse cy="-24" rx="28" ry="7" fill="#9b5b2e"/>';
  if (it.hold === 'umbrella') S('g', { transform: 'translate(-106,-60) rotate(10)' }, hp).innerHTML = '<path d="M -6,-150 L 6,-150 L 12,80 L -12,80 Z" fill="#1d1d1f"/><path d="M 0,80 L 0,120 Q 0,140 18,138" stroke="#6b4a2c" stroke-width="8" fill="none" stroke-linecap="round"/>';
  if (c.bag) S('g', { transform: 'translate(96,-50)' }, hp).innerHTML = '<path d="M -40,-40 L 40,-40 L 48,60 L -48,60 Z" fill="#C7A36B"/><path d="M -40,-40 L 40,-40 L 42,-20 L -42,-20 Z" fill="#a8844f"/><path d="M -20,10 l 40,0" stroke="#a8844f" stroke-width="4"/>';
  if (c.kid) head.setAttribute('transform', 'translate(0,-285) scale(1.12) translate(0,285)');
  P.seed = hash(c.seedn || nextSeed()) * 10;
  return P;
}
function updChar(P, it, lt) {
  const c = P.c, seed = P.seed;
  P.body.setAttribute('transform', `translate(0,${-Math.sin(lt * 1.9 + seed) * 1.6}) scale(1,${1 + .006 * Math.sin(lt * 1.9 + seed)})`);
  const walk = inSpan(it.walk, lt), bob = walk ? -Math.abs(Math.sin(lt * Math.PI * 2.2)) * 10 : 0;
  const tilt = (kf(it.tilt, lt) ?? 0) + Math.sin(lt * .8 + seed) * 1.3 + (walk ? Math.sin(lt * Math.PI * 2.2) * 2 : 0);
  const ht = `translate(0,${bob}) rotate(${tilt},0,-285)` + (c.kid ? ' translate(0,-285) scale(1.12) translate(0,285)' : '');
  P.head.setAttribute('transform', ht); P.headBack.setAttribute('transform', ht);
  if (P.feet) { const pd = inSpan(it.pedal, lt) ? Math.sin(lt * 9) * 16 : walk ? Math.sin(lt * Math.PI * 2.2) * 6 : 0; P.feet[0].setAttribute('transform', `translate(0,${pd})`); P.feet[1].setAttribute('transform', `translate(0,${-pd})`); }
  const expr = step(it.expr, lt, c.expr || 'neutral');
  // eyes
  const per = 3.3 + (seed % 1.6), ph = (lt + seed) % per; let bl = ph < .14 ? Math.sin(ph / .14 * Math.PI) : 0;
  if (expr === 'shock') bl = 0;
  const shut = expr === 'laugh' || expr === 'closed' || expr === 'cry', half = expr === 'smug' || expr === 'bored';
  P.eyes.forEach((e, i) => {
    dsp(e.op, !shut);
    e.op.setAttribute('transform', `scale(1,${Math.max(.08, 1 - bl * .95) * (expr === 'shock' ? 1.25 : 1)})`);
    dsp(e.lid, half);
    dsp(P.closed[i][0], shut && expr === 'laugh');
    dsp(P.closed[i][1], shut && expr !== 'laugh');
  });
  const lk = kf(it.gaze, lt) || [0, 0];
  P.irises.forEach(g => g.setAttribute('transform', `translate(${lk[0] * 4.5},${lk[1] * 3.2})`));
  const BR = { neutral: [0, 0], smile: [-2, 0], laugh: [-4, 0], angry: [4, 13], worried: [-4, -12], sad: [-2, -10], shock: [-10, 0], smug: [0, 0], cry: [-4, -14], nervous: [-3, -10], bored: [2, 0], o: [-8, 0], grin: [-3, 0], chew: [0, 0], closed: [0, 0] };
  const [by, br] = BR[expr] || [0, 0];
  P.brows.forEach((b, i) => { const sd = i ? 1 : -1, extra = expr === 'smug' && sd > 0 ? -8 : 0; b.setAttribute('transform', `translate(${sd * 24},${-372 + by + extra}) rotate(${-sd * br})`); });
  // mouth
  let m = { neutral: 'neutral', smile: 'smile', laugh: 'laugh', angry: 'sad', worried: 'nervous', sad: 'sad', shock: 'o', smug: 'smug', cry: 'sad', nervous: 'nervous', bored: 'neutral', o: 'o', grin: 'grin', chew: 'chew', closed: 'smile' }[expr] || 'neutral';
  // lip: true follows the voice. Its mouth moves with the loudness of the line, or chatters through the line if only times are known. Without a voice, `talk` spans chatter.
  const rest = expr === 'smile' || expr === 'grin' || expr === 'laugh' ? 'smile' : 'neutral';
  const voiced = it.lip && CUR?.vod > 0, inLine = voiced && lt >= CUR.lead && lt < CUR.lead + CUR.vod;
  if (inLine && mouth.curve) { const v = mouth.curve[Math.floor((CUR.t0 + lt) * mouth.fps)] ?? 0; m = v < 3 ? rest : v < 6 ? 't1' : v < 9 ? 't2' : 'o'; }
  else if (inLine || (!voiced && inSpan(it.talk, lt))) { const r = hash(Math.floor(lt * 8.5) + seed * 7); m = r < .3 ? (expr === 'smile' || expr === 'laugh' ? 'smile' : 'neutral') : r < .68 ? 't1' : 't2'; }
  if (inSpan(it.eat, lt)) { const sl = Math.floor(lt * 5); m = sl % 2 ? 'chew' : 'neutral'; }
  for (const k in P.mouths) dsp(P.mouths[k], k === m);
  const pose = step(it.pose, lt, c.pose || 'down');
  for (const k in P.poses) P.poses[k].forEach(g => dsp(g, k === pose));
  const cry = inSpan(it.tears, lt);
  dsp(P.tears, cry);
  if (cry) P.tearDrops.forEach((d, k) => { const p = (lt * 1.25 + k / 4) % 1, sd = k % 2 ? 1 : -1; d.setAttribute('transform', `translate(${sd * (34 + p * 10)},${-322 + p * 120})`); d.setAttribute('opacity', 1 - p); });
  const sw = inSpan(it.sweat, lt); dsp(P.sweat, sw);
  if (sw) P.sweat.setAttribute('transform', `translate(66,${-392 + ((lt * .6) % 1) * 30})`);
}

ITEMS.char = (g, it) => {
  const base = SPEC.cast[it.id] || {}; const c = Object.assign({}, base, it.outfit ? (base.outfits || {})[it.outfit] : {}, it.with || {});
  c.seedn = c.seedn || (it.id || 'x').length * 13 + (it.x || 0);
  if (it.shadow !== false) S('ellipse', { cx: 0, cy: (it.legs ?? c.legs) ? 268 : 0, rx: 120, ry: 18, fill: '#000', opacity: (it.legs ?? c.legs) ? .16 : 0 }, g);
  const P = buildChar(g, c, it);
  return lt => updChar(P, it, lt);
};
