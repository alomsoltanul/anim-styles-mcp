// Story engine, part 3: things that carry text. HTML lives in a foreignObject; children with data-at animate in.
import { E, ITEMS, S, SHADOW, T, back, bn, clamp, eo, hash, lerp } from './core.js';

// data-anim: pop fade stamp up type draw count bar spin blink. data-at and data-out take the same times as any item.
export function fo(g, x, y, w, h, html, it) {
  const f = S('foreignObject', { x, y, width: w, height: h === 'auto' ? 10 : h }, g);
  const d = E('div', 'fo', null, html); d.style.width = w + 'px'; d.style.height = h === 'auto' ? 'auto' : h + 'px'; f.appendChild(d);
  return { f, d };
}
export function timed(root) {
  const els = [...root.querySelectorAll('[data-at]')].map(el => {
    const r = { el, at: T(el.dataset.at), out: el.dataset.out != null ? T(el.dataset.out) : null, an: el.dataset.anim || 'pop', dur: Number(el.dataset.dur || .6) };
    if (r.an === 'type') r.txt = el.textContent;
    if (r.an === 'count') { r.from = Number(el.dataset.from || 0); r.to = Number(el.dataset.to); r.show = el.dataset.digits === 'bn' ? bn : String; }
    if (r.an === 'bar') r.to = Number(el.dataset.to || 100);
    if (r.an === 'draw') { r.path = el.querySelector('path'); r.len = 1400; r.path.style.strokeDasharray = r.len; }
    el.style.transformOrigin = el.style.transformOrigin || '50% 50%';
    if (!el.style.transform && el.classList.contains('stamp')) r.rot = -12; else r.rot = Number(el.dataset.rot || 0);
    return r;
  });
  return lt => els.forEach(r => {
    const p = lt - r.at; let o = p >= 0 ? 1 : 0, s = 1, ty = 0;
    if (r.an === 'pop') { s = p >= 0 ? lerp(.5, 1, back(p / .35)) : .5; o = clamp(p / .12); }
    else if (r.an === 'fade') o = clamp(p / .4);
    else if (r.an === 'up') { o = clamp(p / .25); ty = lerp(26, 0, eo(p / .4)); }
    else if (r.an === 'stamp') { s = p >= 0 ? lerp(2.4, 1, eo(p / .18)) : 2.4; o = clamp(p / .06); }
    else if (r.an === 'type') { o = 1; const n = Math.round(clamp(p / r.dur) * r.txt.length); r.el.textContent = r.txt.slice(0, Math.max(0, n)); }
    else if (r.an === 'count') { o = 1; r.el.textContent = r.show(Math.round(lerp(r.from, r.to, eo(clamp(p / r.dur))))); }
    else if (r.an === 'bar') { o = 1; r.el.style.width = (p < 0 ? 0 : lerp(0, r.to, eo(clamp(p / r.dur)))) + '%'; }
    else if (r.an === 'draw') { o = p >= 0 ? 1 : 0; r.path.style.strokeDashoffset = r.len * (1 - eo(clamp(p / r.dur))); }
    else if (r.an === 'spin') { o = 1; r.el.style.transform = `rotate(${lt * 300}deg)`; return; }
    else if (r.an === 'blink') { o = p >= 0 ? (Math.floor(p * 2.2) % 2 ? .25 : 1) : 0; }
    if (r.out != null && lt > r.out) o *= 1 - clamp((lt - r.out) / .3);
    r.el.style.opacity = o;
    if (r.an !== 'type' && r.an !== 'count' && r.an !== 'bar' && r.an !== 'draw') r.el.style.transform = `translateY(${ty}px) scale(${s}) rotate(${r.rot}deg)`;
  });
}
ITEMS.html = (g, it) => {
  const w = it.w || 600; const { f, d } = fo(g, 0, 0, w, 'auto', it.html, it);
  if (it.css) d.style.cssText += it.css;
  const h = it.h || d.offsetHeight; f.setAttribute('height', h + 40); f.setAttribute('x', -w / 2); f.setAttribute('y', -h / 2); d.style.height = h + 'px';
  if (it.shadow) g.setAttribute('filter', SHADOW);
  return timed(d);
};
ITEMS.bubble = (g, it) => {
  const w = it.w || 560; const { f, d } = fo(g, 0, 0, w, 'auto', `<div class="bub${it.think ? ' th' : ''}">${it.text}</div>`, it);
  const h = d.firstChild.offsetHeight; f.setAttribute('height', h + 40); f.setAttribute('x', -w / 2); f.setAttribute('y', -h / 2);
  const [tx, ty] = it.tail || [-w * .25, h / 2 + 60];
  if (!it.think) { const bx = clamp(tx, -w / 2 + 50, w / 2 - 50) * .6; g.insertBefore(S('path', { d: `M ${bx - 26},${h / 2 - 8} L ${bx + 26},${h / 2 - 8} L ${tx},${ty} Z`, fill: '#fff' }), f); }
  else [[.35, 16], [.7, 10]].forEach(([p, r]) => g.insertBefore(S('circle', { cx: tx * p, cy: h / 2 + (ty - h / 2) * p, r, fill: '#fff' }), f));
};
ITEMS.chip = (g, it) => {
  const { f, d } = fo(g, 0, 0, 1200, 'auto', `<div style="text-align:center"><span class="chip ${it.c || ''}">${it.text}</span></div>`, it);
  const h = d.firstChild.offsetHeight; f.setAttribute('height', h + 40); f.setAttribute('x', -600); f.setAttribute('y', -h / 2);
  return timed(d);
};
ITEMS.text = (g, it) => {
  const w = it.w || 1600; const { f, d } = fo(g, 0, 0, w, 'auto', `<div class="big" style="font-size:${it.size || 120}px;color:${it.color || '#fff'};font-family:${it.font || 'Noto'};${it.css || ''}">${it.text}</div>`, it);
  const h = d.firstChild.offsetHeight; f.setAttribute('height', h + 40); f.setAttribute('x', -w / 2); f.setAttribute('y', -h / 2);
  return timed(d);
};
ITEMS.phone = (g, it) => {
  const w = it.w || 430, h = it.h || 860;
  S('rect', { x: -w / 2, y: -h / 2, width: w, height: h, rx: 58, fill: '#17181c', filter: SHADOW }, g);
  S('rect', { x: -w / 2 + 16, y: -h / 2 + 16, width: w - 32, height: h - 32, rx: 44, fill: it.bg || '#F4F6F8' }, g);
  const { d } = fo(g, -w / 2 + 16, -h / 2 + 16, w - 32, h - 32, `<div style="height:100%;border-radius:44px;overflow:hidden;position:relative">${it.html || ''}</div>`, it);
  S('rect', { x: -60, y: -h / 2 + 30, width: 120, height: 30, rx: 15, fill: '#17181c' }, g);
  if (it.hand) S('g', {}, g).innerHTML = `<path d="M ${-w / 2 - 30},${h / 2 - 140} C ${-w / 2 - 50},${h / 2 + 40} ${-w / 2 + 40},${h / 2 + 200} ${-w / 2 + 160},${h / 2 + 300} L ${w / 2 + 40},${h / 2 + 300} C ${w / 2 + 10},${h / 2 + 120} ${w / 2 + 20},${h / 2 - 40} ${w / 2 - 10},${h / 2 - 110} Z" fill="${it.hand}"/><ellipse cx="${-w / 2 + 6}" cy="${h / 2 - 150}" rx="34" ry="62" fill="${it.hand}" transform="rotate(-18,${-w / 2 + 6},${h / 2 - 150})"/>`;
  return timed(d);
};
ITEMS.papers = (g, it) => {
  const n = it.n || 14, ps = [];
  for (let i = 0; i < n; i++) { const p = S('g', {}, g); fo(p, -60, -78, 120, 156, `<div style="width:120px;height:156px;background:#FFFCF4;border-radius:5px;box-shadow:0 4px 10px rgba(0,0,0,.25);padding:10px;box-sizing:border-box"><div style="width:38px;height:44px;background:${['#cfd8dc', '#f3d1c4', '#d7e7cf'][i % 3]};border-radius:4px;margin-bottom:8px"></div>${[90, 70, 84, 60].map(x => `<div style="height:7px;width:${x}%;background:#c9bfae;border-radius:3px;margin:5px 0"></div>`).join('')}</div>`, it); ps.push({ p, a: -150 + (i / (n - 1)) * 300 + (hash(i) - .5) * 20, r: 330 + hash(i + 5) * 160, rot: (hash(i + 9) - .5) * 70, d: i * .07 }); }
  return lt => ps.forEach(q => { const p = eo((lt - (it.at || 0) - q.d) / .7), a = q.a * Math.PI / 180; q.p.setAttribute('opacity', clamp((lt - (it.at || 0) - q.d) / .1)); q.p.setAttribute('transform', `translate(${Math.sin(a) * q.r * p},${-Math.cos(a) * q.r * p * .7 + (1 - p) * 40}) rotate(${q.rot * p}) scale(${lerp(.3, 1, p)})`); });
};
