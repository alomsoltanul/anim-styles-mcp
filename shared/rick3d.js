// Same rickshaw as common.js (RK), built in 3D. 1 unit = 100 px of the 2D drawing. Origin on the ground.
import * as THREE from 'three';
const shapeOf = pts => { const s = new THREE.Shape(); pts.forEach(([x, y], i) => i ? s.lineTo(x / 100, -y / 100) : s.moveTo(x / 100, -y / 100)); s.closePath(); return s; };
const V = (x, y, z = 0) => new THREE.Vector3(x / 100, -y / 100, z);
export function tube(a, b, r, mat, seg = 8) {
  const d = b.clone().sub(a), L = d.length(), m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, L, seg), mat);
  m.position.copy(a).addScaledVector(d, .5); m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.clone().normalize()); return m;
}
function slab(pts, width, mat, bevel = 0) {
  const depth = width - 2 * bevel, g = new THREE.ExtrudeGeometry(shapeOf(pts), { depth, steps: 1, bevelEnabled: bevel > 0, bevelSize: bevel, bevelThickness: bevel, bevelSegments: 4, curveSegments: 8 });
  g.translate(0, 0, -depth / 2); return new THREE.Mesh(g, mat);
}
function shell(a0, a1, seg, width, mat, k = 1) {
  const arc = arcPts(RK.pivot[0], RK.pivot[1], 76 * k, 118 * k, a0, a1, seg), pos = [], idx = [];
  arc.forEach(([x, y]) => { pos.push(x / 100, -y / 100, -width / 2, x / 100, -y / 100, width / 2); });
  for (let i = 0; i < seg; i++) { const a = i * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals();
  return new THREE.Mesh(g, mat);
}
function wheel(r, seg, m, o) {
  const g = new THREE.Group(), axial = geo => { geo.rotateX(Math.PI / 2); return geo; };
  if (o.chunky) {
    g.add(new THREE.Mesh(axial(new THREE.CylinderGeometry(r, r, .2, seg)), m.tire));
    g.add(new THREE.Mesh(axial(new THREE.CylinderGeometry(r * .56, r * .56, .23, seg)), m.hub));
  } else {
    g.add(new THREE.Mesh(new THREE.TorusGeometry(r - o.tire, o.tire, 14, seg), m.tire));
    g.add(new THREE.Mesh(new THREE.TorusGeometry(r - o.tire * 2.2, .014, 8, seg), m.metal));
    g.add(new THREE.Mesh(axial(new THREE.CylinderGeometry(r * .2, r * .2, .1, 20)), m.hub));
    for (let i = 0; i < o.spokes; i++) { const a = i / o.spokes * Math.PI; g.add(tube(new THREE.Vector3(Math.cos(a) * (r - o.tire * 2), Math.sin(a) * (r - o.tire * 2), 0), new THREE.Vector3(-Math.cos(a) * (r - o.tire * 2), -Math.sin(a) * (r - o.tire * 2), 0), .009, m.metal, 5)); }
  }
  return g;
}
// m = { wedges:[4], cushion, box, saddle, metal, tire, hub }
export function rickshaw3d(m, o = {}) {
  const { wheelSeg = 28, chunky = false, tire = .05, spokes = 10, bevel = 0, tubeR = .03, tubeSeg = 8, hoodSeg = 8, width = 1.3 } = o;
  const g = new THREE.Group(), wheels = [], add = x => { g.add(x); return x; }, lining = m.inner || new THREE.MeshBasicMaterial({ color: '#17121a', side: THREE.DoubleSide });
  [[172, 136], [136, 100], [100, 64], [64, 28]].forEach(([a0, a1], i) => {
    add(shell(a0, a1, hoodSeg, width + .08, m.wedges[i]));
    add(shell(a0, a1, hoodSeg, width + .05, lining, .975));
    [-1, 1].forEach(s => { const f = new THREE.Mesh(new THREE.ShapeGeometry(shapeOf(RK.wedges[i])), m.wedges[i]); f.position.z = s * (width + .08) / 2; add(f); const q = new THREE.Mesh(f.geometry, lining); q.position.z = s * (width + .04) / 2; add(q); });
  });
  add(slab(RK.cushion, width, m.cushion, bevel)); add(slab(RK.box, width, m.box, bevel)); add(slab(RK.saddle, .34, m.saddle, bevel * .6));
  RK.frame.slice(1, 7).forEach(([a, b]) => add(tube(V(...a), V(...b), tubeR, m.metal, tubeSeg)));
  [-1, 1].forEach(s => add(tube(V(34, -46), V(-70, -42, s * .62), tubeR, m.metal, tubeSeg)));
  add(tube(V(-70, -42, -.66), V(-70, -42, .66), tubeR, m.metal, tubeSeg));
  add(tube(V(104, -126, -.34), V(104, -126, .34), tubeR, m.metal, tubeSeg));
  [[-70, -42, -.66, 42], [-70, -42, .66, 42], [128, -36, 0, 36]].forEach(([x, y, z, r]) => { const w = wheel(r / 100, wheelSeg, m, { chunky, tire, spokes }); w.position.copy(V(x, y, z)); wheels.push(w); add(w); });
  return { group: g, wheels, jets: [V(-70, 0, -.66), V(-70, 0, .66), V(128, 0, 0)] };
}
export function softDisc(size = 128, stops = [[0, 1], [.5, .55], [1, 0]]) {
  const c = document.createElement('canvas'); c.width = c.height = size; const x = c.getContext('2d'), g = x.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  stops.forEach(([p, a]) => g.addColorStop(p, `rgba(255,255,255,${a})`)); x.fillStyle = g; x.fillRect(0, 0, size, size);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}
export function gradientTex(stops, h = 512) {
  const c = document.createElement('canvas'); c.width = 4; c.height = h; const x = c.getContext('2d'), g = x.createLinearGradient(0, 0, 0, h);
  stops.forEach(([p, col]) => g.addColorStop(p, col)); x.fillStyle = g; x.fillRect(0, 0, 4, h);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}
// fades a cone from its base to nothing at the tip (jet exhaust)
export function fadeTex() { const c = document.createElement('canvas'); c.width = 4; c.height = 128; const x = c.getContext('2d'), g = x.createLinearGradient(0, 0, 0, 128); g.addColorStop(0, '#000'); g.addColorStop(.55, '#555'); g.addColorStop(1, '#fff'); x.fillStyle = g; x.fillRect(0, 0, 4, 128); return new THREE.CanvasTexture(c); }
export function uvBox(w, h, d, sx, sy) { const g = new THREE.BoxGeometry(w, h, d), uv = g.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * sx, uv.getY(i) * sy); return g; }
