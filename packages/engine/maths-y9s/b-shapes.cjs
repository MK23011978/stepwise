'use strict';
// Year 9 school unit: 3D shapes, constructions & congruence, angles in parallel lines & deduction.
module.exports = (H) => {
  const { topic, addStyles, SPEC, nAns, eAns, mcq, B, ds, fx, svgWrap, sT, sL, sP, sC, sE, sPoly, dot, angArc, rightMark, cuboidSvg, shapeSvg, circleSvg } = H;
  const ACC = '#3b6cf6';
  const DEG = Math.PI / 180;
  const sinD = (d) => Math.sin(d * DEG), cosD = (d) => Math.cos(d * DEG);
  const r1 = (x) => fx(x, 1);
  const PI_FMT = 'Give your answer in terms of π, e.g. 24π (you can type pi or π)';
  const piAns = (k) => ({ ...eAns(`${k}pi`), answerHtml: B(`${ds(k)}π`) });
  const piT = (k) => `${ds(k)}π`;
  const an = (w) => (/^[aeiou]/i.test(w) ? 'an ' : 'a ') + w;

  Object.assign(SPEC, {
    'y9-3d-shapes': '1MA1 G1, G12, G13, G17',
    'y9-constructions': '1MA1 G2, G5, G15, R2',
    'y9-angle-deduction': '1MA1 G1, G3, G4, G6',
  });

  // ---------- local drawing helpers ----------
  // fit math points (y up) into a w×h box; returns {T, s}
  function mkFit(pts, w = 360, h = 240, pad = 30, padB = 34) {
    const xs = pts.map((p) => p[0]), ys = pts.map((p) => p[1]);
    const minx = Math.min(...xs), maxx = Math.max(...xs), miny = Math.min(...ys), maxy = Math.max(...ys);
    const s = Math.min((w - 2 * pad) / ((maxx - minx) || 1), (h - pad - padB) / ((maxy - miny) || 1));
    const ox = (w - (maxx - minx) * s) / 2, oy = pad + ((h - pad - padB) - (maxy - miny) * s) / 2;
    return { T: (p) => [ox + (p[0] - minx) * s, oy + (maxy - p[1]) * s], s };
  }
  const rect = (x, y, w, h) => [[x, y], [x + w, y], [x + w, y + h], [x, y + h]];
  function ngonOnEdge(x0, y0, s, n, down) { // regular n-gon on the edge (x0,y0)-(x0+s,y0), above (or below)
    const pts = []; let p = down ? [x0 + s, y0] : [x0, y0]; let a = down ? 180 : 0;
    for (let i = 0; i < n; i++) { pts.push(p); p = [p[0] + s * cosD(a), p[1] + s * sinD(a)]; a += 360 / n; }
    return pts;
  }
  function netSvg(kind, n) {
    let polys = [], circles = [], sector = null;
    if (kind === 'cube') {
      for (let i = 0; i < 4; i++) polys.push(rect(i, 1, 1, 1));
      polys.push(rect(n[0], 2, 1, 1), rect(n[1], 0, 1, 1));
    } else if (kind === 'cuboid') {
      const [l, w, h] = n; let x = 0;
      for (const d of [w, l, w, l]) { polys.push(rect(x, w, d, h)); x += d; }
      polys.push(rect(w, w + h, l, w), rect(w, 0, l, w));
    } else if (kind === 'triPrism') {
      const L = 2.2; for (let i = 0; i < 3; i++) polys.push(rect(0, i, L, 1));
      polys.push([[0, 1], [0, 2], [-0.87, 1.5]], [[L, 1], [L, 2], [L + 0.87, 1.5]]);
    } else if (kind === 'sqPyr') {
      polys.push(rect(0, 0, 1, 1), [[0, 0], [1, 0], [0.5, -1.1]], [[1, 0], [1, 1], [2.1, 0.5]], [[1, 1], [0, 1], [0.5, 2.1]], [[0, 1], [0, 0], [-1.1, 0.5]]);
    } else if (kind === 'tetra') {
      const h = Math.sqrt(3);
      polys.push([[0, 0], [1, 0], [0.5, h / 2]], [[1, 0], [2, 0], [1.5, h / 2]], [[0.5, h / 2], [1.5, h / 2], [1, h]], [[1, 0], [1.5, h / 2], [0.5, h / 2]]);
    } else if (kind === 'prismN') {
      const L = 2.4; for (let i = 0; i < n; i++) polys.push(rect(i, 0, 1, L));
      const k = Math.floor(n / 2);
      polys.push(ngonOnEdge(k, L, 1, n, false), ngonOnEdge(k, 0, 1, n, true));
    } else if (kind === 'pyrN') {
      const R = 0.5 / sinD(180 / n); const base = [];
      for (let i = 0; i < n; i++) { const a = -90 + 180 / n + (360 / n) * i; base.push([R * cosD(a), R * sinD(a)]); }
      polys.push(base);
      for (let i = 0; i < n; i++) {
        const P = base[i], Q = base[(i + 1) % n]; const m = [(P[0] + Q[0]) / 2, (P[1] + Q[1]) / 2]; const d = [Q[0] - P[0], Q[1] - P[1]];
        const nl = Math.hypot(d[0], d[1]); const nor = [d[1] / nl, -d[0] / nl];
        polys.push([P, Q, [m[0] + nor[0] * 1.05, m[1] + nor[1] * 1.05]]);
      }
    } else if (kind === 'cylinder') {
      const r = 0.5, W = 2 * Math.PI * r; polys.push(rect(0, 0, W, 1.6)); circles.push([W / 2, 1.6 + r, r], [W / 2, -r, r]);
    } else if (kind === 'cone') {
      const l = 1.6, th = 150; sector = { c: [0, 0], l, a0: 270 - th / 2, a1: 270 + th / 2 }; const r = l * th / 360; circles.push([0, -l - r, r]);
    }
    const all = [...polys.flat()];
    circles.forEach(([x, y, r]) => all.push([x - r, y - r], [x + r, y + r]));
    if (sector) all.push([sector.c[0] - sector.l, sector.c[1] - sector.l], [sector.c[0] + sector.l, sector.c[1]]);
    const { T, s } = mkFit(all, 360, 240, 22, 30);
    let body = polys.map((p) => sPoly(p.map(T), { fill: ACC, fop: 0.08 })).join('');
    circles.forEach(([x, y, r]) => { const c = T([x, y]); body += sC(c[0], c[1], r * s, {}); });
    if (sector) {
      const c = T(sector.c); const pa = T([sector.l * cosD(sector.a0), sector.l * sinD(sector.a0)]), pb = T([sector.l * cosD(sector.a1), sector.l * sinD(sector.a1)]);
      body += sP(`M${fx(c[0], 1)},${fx(c[1], 1)} L${fx(pa[0], 1)},${fx(pa[1], 1)} A${fx(sector.l * s, 1)},${fx(sector.l * s, 1)} 0 0 0 ${fx(pb[0], 1)},${fx(pb[1], 1)} Z`, { fill: ACC, fop: 0.08 });
    }
    return svgWrap(360, 240, body, false);
  }
  // heights-on-plan grid: hs[row][col], row 0 at the back
  function planGridSvg(hs) {
    const R = hs.length, Cn = hs[0].length, sz = 44; const x0 = 180 - (Cn * sz) / 2, y0 = 30;
    let body = '';
    for (let i = 0; i < R; i++) for (let j = 0; j < Cn; j++) {
      const x = x0 + j * sz, y = y0 + i * sz; const v = hs[i][j];
      body += sPoly(rect(x, y, sz, sz), v ? { fill: ACC, fop: 0.1 } : { dash: true, w: 1, op: 0.5 });
      if (v) body += sT(x + sz / 2, y + sz / 2, String(v), { b: true });
    }
    const yb = y0 + R * sz + 22;
    body += sL(180, yb + 26, 180, yb + 4, { c: ACC }) + sPoly([[174, yb + 11], [180, yb + 3], [186, yb + 11]], { c: ACC, open: true }) + sT(180, yb + 38, 'FRONT', { fs: 12, c: ACC, b: true });
    const xr = x0 + Cn * sz + 22;
    body += sL(xr + 26, y0 + (R * sz) / 2, xr + 4, y0 + (R * sz) / 2, { c: ACC }) + sPoly([[xr + 11, y0 + (R * sz) / 2 - 6], [xr + 3, y0 + (R * sz) / 2], [xr + 11, y0 + (R * sz) / 2 + 6]], { c: ACC, open: true }) + sT(xr + 30, y0 + (R * sz) / 2, 'SIDE', { fs: 12, c: ACC, b: true, a: 'start' });
    return svgWrap(360, Math.max(200, yb + 50), body, false);
  }
  // right-angled triangular prism with all three triangle sides labelled
  function rtPrismSvg(aLab, bLab, cLab, lLab) {
    const A = [60, 200], Bp = [170, 200], C = [60, 90]; const dx = 120, dy = -50;
    const A2 = [A[0] + dx, A[1] + dy], B2 = [Bp[0] + dx, Bp[1] + dy], C2 = [C[0] + dx, C[1] + dy];
    let body = sPoly([A, Bp, C], { fill: ACC, fop: 0.08 }) + rightMark(A, Bp, C, 11) + sL(Bp[0], Bp[1], B2[0], B2[1]) + sL(C[0], C[1], C2[0], C2[1]) + sL(B2[0], B2[1], C2[0], C2[1]);
    body += sL(A[0], A[1], A2[0], A2[1], { dash: true, w: 1 }) + sL(A2[0], A2[1], B2[0], B2[1], { dash: true, w: 1 }) + sL(A2[0], A2[1], C2[0], C2[1], { dash: true, w: 1 });
    body += sT((A[0] + Bp[0]) / 2, A[1] + 16, bLab) + sT(A[0] - 10, (A[1] + C[1]) / 2, aLab, { a: 'end' }) + sT((Bp[0] + C[0]) / 2 - 8, (Bp[1] + C[1]) / 2 - 8, cLab, { a: 'end' }) + sT((Bp[0] + B2[0]) / 2 + 12, (Bp[1] + B2[1]) / 2 + 8, lLab, { a: 'start' });
    return svgWrap(360, 240, body);
  }
  // isosceles (tent-shaped) triangular prism
  function tentSvg(bLab, hLab, sLab, lLab) {
    const A = [40, 200], Bp = [180, 200], C = [110, 95], M = [110, 200]; const dx = 120, dy = -55;
    const A2 = [A[0] + dx, A[1] + dy], B2 = [Bp[0] + dx, Bp[1] + dy], C2 = [C[0] + dx, C[1] + dy];
    let body = sPoly([A, Bp, C], { fill: ACC, fop: 0.08 }) + sL(C[0], C[1], M[0], M[1], { dash: true, w: 1.5, c: ACC }) + rightMark(M, Bp, C, 9);
    body += sL(Bp[0], Bp[1], B2[0], B2[1]) + sL(C[0], C[1], C2[0], C2[1]) + sL(B2[0], B2[1], C2[0], C2[1]);
    body += sL(A[0], A[1], A2[0], A2[1], { dash: true, w: 1 }) + sL(A2[0], A2[1], B2[0], B2[1], { dash: true, w: 1 }) + sL(A2[0], A2[1], C2[0], C2[1]);
    body += sT(110, 216, bLab) + sT(116, 160, hLab, { a: 'start', c: ACC, fs: 13 }) + sT(68, 140, sLab, { a: 'end' }) + sT((Bp[0] + B2[0]) / 2 + 12, (Bp[1] + B2[1]) / 2 + 8, lLab, { a: 'start' });
    return svgWrap(360, 240, body);
  }
  function cylSvg(lab, hLab, diam) {
    const cx = 180, top = 50, bot = 190, rx = 80, ry = 22;
    let body = sP(`M${cx - rx},${top} A${rx},${ry} 0 1 0 ${cx + rx},${top} A${rx},${ry} 0 1 0 ${cx - rx},${top}`) + sL(cx - rx, top, cx - rx, bot) + sL(cx + rx, top, cx + rx, bot);
    body += sP(`M${cx - rx},${bot} A${rx},${ry} 0 0 0 ${cx + rx},${bot}`) + sP(`M${cx - rx},${bot} A${rx},${ry} 0 0 1 ${cx + rx},${bot}`, { dash: true, w: 1 });
    if (diam) body += sL(cx - rx, top, cx + rx, top, { c: ACC }) + dot(cx, top) + sT(cx, top + 12, lab, { c: ACC, fs: 13 });
    else body += dot(cx, top) + sL(cx, top, cx + rx, top, { c: ACC }) + sT(cx + rx / 2, top + 11, lab, { c: ACC, fs: 13 });
    body += sT(cx + rx + 10, (top + bot) / 2, hLab, { a: 'start' });
    return svgWrap(360, 240, body);
  }

  // ======================================================================
  // 3D SHAPES
  // ======================================================================
  const PRISMS = { 3: 'triangular prism', 4: 'cuboid', 5: 'pentagonal prism', 6: 'hexagonal prism', 7: 'heptagonal prism', 8: 'octagonal prism', 10: 'decagonal prism' };
  const PYRS = { 3: 'triangular-based pyramid (tetrahedron)', 4: 'square-based pyramid', 5: 'pentagonal-based pyramid', 6: 'hexagonal-based pyramid', 8: 'octagonal-based pyramid' };
  const POLY = { 3: 'triangle', 4: 'quadrilateral', 5: 'pentagon', 6: 'hexagon', 7: 'heptagon', 8: 'octagon', 10: 'decagon' };
  const fevOf = (pyr, n) => (pyr ? { F: n + 1, E: 2 * n, V: n + 1 } : { F: n + 2, E: 3 * n, V: 2 * n });
  const fevSteps = (pyr, n, what) => {
    const f = fevOf(pyr, n);
    const s = pyr
      ? { F: `Faces: 1 base (${POLY[n]}) + ${n} triangles = ${f.F}`, E: `Edges: ${n} round the base + ${n} up to the apex = ${f.E}`, V: `Vertices: ${n} round the base + 1 apex = ${f.V}` }
      : { F: `Faces: 2 identical ends (${POLY[n]}s) + ${n} rectangles round the sides = ${f.F}`, E: `Edges: ${n} on each end (${2 * n}) + ${n} joining the ends = ${f.E}`, V: `Vertices: ${n} on each end, so 2 × ${n} = ${f.V}` };
    return [s[what], `Check with Euler's rule F + V − E = 2: ${f.F} + ${f.V} − ${f.E} = 2 ✓`];
  };
  const FEVW = { F: 'faces', E: 'edges', V: 'vertices' };

  topic('y9-3d-shapes', 'geometry', 9, 1, 'FH', '3D Shapes: Nets, Plans & Surface Area', 'Faces, edges and vertices, nets, plans and elevations, and surface area of prisms and cylinders.', [
    ['Faces, edges & vertices',
      'A face is a flat surface, an edge is where two faces meet and a vertex is a corner. A prism with an n-sided end has n + 2 faces, 3n edges and 2n vertices; a pyramid with an n-sided base has n + 1 faces, 2n edges and n + 1 vertices.',
      (r) => {
        const kind = r.int(0, 9);
        if (kind <= 5) {
          const pyr = r.chance(0.4); const n = pyr ? r.pick([3, 4, 5, 6, 8]) : r.pick([3, 4, 5, 6, 7, 8, 10]); const what = r.pick(['F', 'E', 'V']);
          const name = pyr ? PYRS[n] : PRISMS[n]; const f = fevOf(pyr, n);
          const ctx = r.pick([`Here is ${an(name)}.`, `A model is made in the shape of ${an(name)}.`, `A paperweight is a solid ${name}.`, `A gift box is shaped like ${an(name)}.`, `Kai builds ${an(name)} out of straws and modelling clay.`]);
          return { html: `${ctx} How many ${B(FEVW[what])} does it have?`, ...nAns(f[what]), hint: pyr ? 'A pyramid has a base and triangles meeting at one point (the apex).' : 'A prism has two identical ends joined by rectangles.',
            steps: [`${an(name).replace(/^a/, 'A')} has ${pyr ? `${an(POLY[n])} base with ${n} sides` : `${POLY[n]} ends with ${n} sides`}.`, ...fevSteps(pyr, n, what), `So it has ${B(f[what])} ${FEVW[what]}.`] };
        }
        if (kind <= 7) { // Euler
          const pyr = r.chance(0.4); const n = pyr ? r.pick([3, 4, 5, 6, 7, 8, 9, 10]) : r.pick([3, 4, 5, 6, 7, 8, 9, 10, 12]); const f = fevOf(pyr, n);
          const miss = r.pick(['F', 'E', 'V']); const giv = ['F', 'E', 'V'].filter((k) => k !== miss);
          const calc = miss === 'E' ? `E = F + V − 2 = ${f.F} + ${f.V} − 2` : miss === 'F' ? `F = 2 + E − V = 2 + ${f.E} − ${f.V}` : `V = 2 + E − F = 2 + ${f.E} − ${f.F}`;
          return { html: `A solid ${r.pick(['shape', 'polyhedron', '3D shape'])} has ${f[giv[0]]} ${FEVW[giv[0]]} and ${f[giv[1]]} ${FEVW[giv[1]]}. Use Euler's rule, F + V − E = 2, to work out how many ${B(FEVW[miss])} it has.`, ...nAns(f[miss]), hint: 'Faces + vertices − edges = 2 for any solid with flat faces and no holes.',
            steps: ['Euler\'s rule: F + V − E = 2', `Rearrange: ${calc}`, `= ${B(f[miss])} ${FEVW[miss]}`] };
        }
        const pyr = r.chance(0.4); const n = r.int(3, 12); const f = fevOf(pyr, n);
        const giv = pyr ? 'E' : r.pick(['E', 'V']); const want = r.pick(['F', 'E', 'V'].filter((k) => k !== giv));
        const solid = pyr ? 'pyramid' : 'prism';
        return { html: `A ${solid} has ${B(f[giv])} ${FEVW[giv]}. How many ${B(FEVW[want])} does it have?`, ...nAns(f[want]), hint: pyr ? 'A pyramid with an n-sided base has 2n edges.' : 'A prism with n-sided ends has 3n edges and 2n vertices.',
          steps: [pyr ? `An n-sided pyramid has 2n edges, so 2n = ${f.E} and n = ${n}.` : giv === 'E' ? `An n-sided prism has 3n edges, so 3n = ${f.E} and n = ${n}.` : `An n-sided prism has 2n vertices, so 2n = ${f.V} and n = ${n}.`,
            pyr ? { F: `Faces = n + 1 = ${f.F}`, E: '', V: `Vertices = n + 1 = ${f.V}` }[want] : { F: `Faces = n + 2 = ${f.F}`, E: `Edges = 3n = ${f.E}`, V: `Vertices = 2n = ${f.V}` }[want],
            `So it has ${B(f[want])} ${FEVW[want]}.`] };
      }],
    ['Nets & recognising prisms',
      'A net is a flat shape that folds up to make a solid. Count the faces and look at their shapes: two identical ends joined by rectangles make a prism; one base with triangles meeting at a point makes a pyramid. A prism must have flat faces and the same cross-section all the way through.',
      (r) => {
        const NETS = [
          { k: 'cube', name: 'cube', d: ['cuboid', 'square-based pyramid', 'tetrahedron'], f: { F: 6, E: 12, V: 8 } },
          { k: 'cuboid', name: 'cuboid', d: ['cube', 'triangular prism', 'square-based pyramid'], f: { F: 6, E: 12, V: 8 } },
          { k: 'triPrism', name: 'triangular prism', d: ['tetrahedron', 'square-based pyramid', 'cuboid'], f: { F: 5, E: 9, V: 6 } },
          { k: 'sqPyr', name: 'square-based pyramid', d: ['tetrahedron', 'cube', 'triangular prism'], f: { F: 5, E: 8, V: 5 } },
          { k: 'tetra', name: 'tetrahedron', d: ['triangular prism', 'square-based pyramid', 'octahedron'], f: { F: 4, E: 6, V: 4 } },
          { k: 'prismN', n: 5, name: 'pentagonal prism', d: ['pentagonal-based pyramid', 'hexagonal prism', 'cuboid'], f: { F: 7, E: 15, V: 10 } },
          { k: 'prismN', n: 6, name: 'hexagonal prism', d: ['hexagonal-based pyramid', 'pentagonal prism', 'octagonal prism'], f: { F: 8, E: 18, V: 12 } },
          { k: 'pyrN', n: 5, name: 'pentagonal-based pyramid', d: ['pentagonal prism', 'hexagonal-based pyramid', 'square-based pyramid'], f: { F: 6, E: 10, V: 6 } },
          { k: 'pyrN', n: 6, name: 'hexagonal-based pyramid', d: ['hexagonal prism', 'pentagonal-based pyramid', 'square-based pyramid'], f: { F: 7, E: 12, V: 7 } },
          { k: 'cylinder', name: 'cylinder', d: ['cone', 'sphere', 'triangular prism'] },
          { k: 'cone', name: 'cone', d: ['cylinder', 'square-based pyramid', 'sphere'] },
        ];
        const variant = r.int(0, 9);
        const ctx = r.pick(['The diagram shows a net.', 'Here is the net of a solid.', 'A packaging designer draws this net.', 'Mia cuts out this net from card.', 'This net is printed on a cereal-box template.', 'A net is drawn on squared paper.']);
        if (variant <= 3) {
          const N = r.pick(NETS); const arg = N.k === 'cube' ? [r.int(0, 3), r.int(0, 3)] : N.k === 'cuboid' ? r.shuffle([1, 1.6, 2.2]) : N.n;
          const faces = N.f ? `${N.f.F} faces` : 'curved surface';
          return { html: `${ctx} ${r.pick(['Which solid does it fold up to make?', 'What is the name of the 3D shape made when the net is folded?'])}`, diagram: netSvg(N.k, arg), ...mcq(r, [N.name, ...N.d], 0), hint: 'Count the faces and look at their shapes. Which faces will be opposite each other?',
            steps: [N.f ? `The net has ${N.f.F} faces.` : (N.k === 'cylinder' ? 'The net has a rectangle and two circles: the rectangle rolls up into the curved surface.' : 'The net has a sector and a circle: the sector curls round to make a point.'),
              { cube: 'All six faces are identical squares.', cuboid: 'There are three pairs of matching rectangles.', triPrism: 'Two identical triangles (the ends) are joined by three rectangles.', sqPyr: 'One square base with four triangles that meet at a point.', tetra: 'All four faces are triangles, which meet in threes at each corner.', prismN: `Two identical ${POLY[N.n]}s (the ends) joined by ${N.n} rectangles.`, pyrN: `One ${POLY[N.n]} base with ${N.n} triangles that meet at a point.`, cylinder: 'The circles are the two ends.', cone: 'The circle is the base.' }[N.k],
              `It folds to make ${an(N.name).replace(N.name, B(N.name))} (${faces}).`] };
        }
        if (variant <= 6) {
          const N = r.pick(NETS.filter((x) => x.f)); const arg = N.k === 'cube' ? [r.int(0, 3), r.int(0, 3)] : N.k === 'cuboid' ? r.shuffle([1, 1.6, 2.2]) : N.n; const what = r.pick(['F', 'E', 'V']);
          return { html: `${ctx} The net is folded to make a solid. How many ${B(FEVW[what])} will the solid have?`, diagram: netSvg(N.k, arg), ...nAns(N.f[what]), hint: 'First decide what solid the net makes.',
            steps: [`The net folds to make ${an(N.name)}.`, `${an(N.name).replace(/^a/, 'A')} has ${N.f.F} faces, ${N.f.E} edges and ${N.f.V} vertices.`, `Check: F + V − E = ${N.f.F} + ${N.f.V} − ${N.f.E} = 2 ✓`, `Answer: ${B(N.f[what])} ${FEVW[what]}`] };
        }
        const PR = ['cuboid', 'cube', 'triangular prism', 'hexagonal prism', 'pentagonal prism', 'octagonal prism', 'solid with an L-shaped cross-section that is the same all the way through'];
        const NOT = ['cylinder', 'cone', 'sphere', 'square-based pyramid', 'tetrahedron', 'hexagonal-based pyramid', 'hemisphere'];
        const why = { cylinder: 'a cylinder has a curved surface, not flat faces', cone: 'a cone narrows to a point and has a curved surface', sphere: 'a sphere has no flat faces at all', 'square-based pyramid': 'a pyramid narrows to a point, so its cross-section changes', tetrahedron: 'a tetrahedron is a pyramid, so its cross-section changes', 'hexagonal-based pyramid': 'a pyramid narrows to a point, so its cross-section changes', hemisphere: 'a hemisphere has a curved surface and its cross-section changes' };
        if (variant <= 8) {
          const p = r.pick(PR); const ds3 = r.sample(NOT, 3);
          return { html: `${r.pick(['Which one of these solids is a prism?', 'A teacher asks the class to pick out the prism. Which solid is a prism?', 'Only one of these solids is a prism. Which one?'])}`, ...mcq(r, [p, ...ds3], 0), hint: 'A prism has flat faces and the same cross-section all the way through.',
            steps: ['A prism has two identical parallel ends, flat faces, and the same cross-section all along its length.', `Not prisms: ${ds3.map((d) => why[d]).join('; ')}.`, `The prism is the ${B(p)}.`] };
        }
        const np = r.pick(NOT); const ps3 = r.sample(PR, 3);
        return { html: `${r.pick(['Which one of these solids is NOT a prism?', 'Three of these solids are prisms. Which one is not?', 'Jay says all of these solids are prisms. Which one shows he is wrong?'])}`, ...mcq(r, [np, ...ps3], 0), hint: 'Look for a curved surface or a shape that comes to a point.',
          steps: ['A prism has two identical parallel ends, flat faces, and the same cross-section all along its length.', `The others all have a constant cross-section, but ${why[np]}.`, `So the ${B(np)} is not a prism.`] };
      }],
    ['Plans & elevations',
      'The plan is the view from directly above. The front elevation is the view from the front and the side elevation is the view from the side. Each view is a flat 2D shape, so hidden depth disappears.',
      (r) => {
        if (r.chance(0.55)) {
          let hs, tot; do { const R0 = r.int(2, 3), C0 = r.int(2, 4); hs = []; for (let i = 0; i < R0; i++) { const row = []; for (let j = 0; j < C0; j++) row.push(r.chance(0.2) ? 0 : r.int(1, 3)); hs.push(row); } tot = hs.flat().reduce((a, b) => a + b, 0); } while (tot < 4 || hs.flat().filter((v) => v).length < 3 || hs[0].map((_, j) => Math.max(...hs.map((row) => row[j]))).some((v) => !v) || hs.some((row) => !Math.max(...row)));
          const colMax = hs[0].map((_, j) => Math.max(...hs.map((row) => row[j]))); const rowMax = hs.map((row) => Math.max(...row));
          const plan = hs.flat().filter((v) => v).length; const front = colMax.reduce((a, b) => a + b, 0); const side = rowMax.reduce((a, b) => a + b, 0);
          const what = r.pick(['cubes', 'front', 'side', 'plan']);
          const intro = r.pick(['A solid is made from centimetre cubes.', 'Ella builds a model from identical cubes.', 'A shape is built from stacks of 1 cm cubes.', 'A child stacks wooden building blocks (all cubes) on a table.']);
          const base = `${intro} The diagram is the plan view; the number in each square shows how many cubes are stacked there.`;
          if (what === 'cubes') return { html: `${base} How many cubes are used altogether?`, diagram: planGridSvg(hs), ...nAns(tot), hint: 'Add up all the numbers on the plan.', steps: ['Each number is the height of one stack.', `Total = ${hs.flat().filter((v) => v).join(' + ')} = ${B(tot)} cubes`] };
          if (what === 'plan') return { html: `${base} The plan view is drawn on centimetre squared paper. How many squares does it cover?`, diagram: planGridSvg(hs), ...nAns(plan), hint: 'From above, each stack looks like one square, however tall it is.', steps: ['From directly above you see one square for every stack, whatever its height.', `Count the squares with a number in them: ${B(plan)}`] };
          if (what === 'front') return { html: `${base} The front elevation is drawn on centimetre squared paper. How many squares does it cover?`, diagram: planGridSvg(hs), ...nAns(front), hint: 'Looking from the front, each column shows its tallest stack.', steps: ['From the front, the stacks in each column hide behind each other, so you see the tallest one.', `Tallest stack in each column (left to right): ${colMax.join(', ')}`, `Squares in front elevation = ${colMax.join(' + ')} = ${B(front)}`] };
          return { html: `${base} The side elevation (viewed from the right) is drawn on centimetre squared paper. How many squares does it cover?`, diagram: planGridSvg(hs), ...nAns(side), hint: 'Looking from the side, each row shows its tallest stack.', steps: ['From the side, the stacks in each row hide behind each other, so you see the tallest one.', `Tallest stack in each row (back to front): ${rowMax.join(', ')}`, `Squares in side elevation = ${rowMax.join(' + ')} = ${B(side)}`] };
        }
        const solid = r.pick(['cuboid', 'prism', 'cylinder', 'pyramid', 'cone']); const view = r.pick(['plan', 'front elevation', 'side elevation']);
        let html, opts, why;
        if (solid === 'cuboid') {
          const [l, w, h] = r.sample([2, 3, 4, 5, 6, 7, 8, 9, 10], 3);
          html = `A cuboid stands on a table. It is ${l} cm long (left to right), ${w} cm deep (front to back) and ${h} cm tall.`;
          const P = `a rectangle ${l} cm by ${w} cm`, F = `a rectangle ${l} cm by ${h} cm`, S = `a rectangle ${w} cm by ${h} cm`;
          opts = view === 'plan' ? [P, F, S, `a rectangle ${l} cm by ${l} cm`] : view === 'front elevation' ? [F, P, S, `a rectangle ${h} cm by ${h} cm`] : [S, F, P, `a rectangle ${w} cm by ${w} cm`];
          why = view === 'plan' ? 'From above you see the length and the depth.' : view === 'front elevation' ? 'From the front you see the length and the height.' : 'From the side you see the depth and the height.';
        } else if (solid === 'prism') {
          const l = r.int(8, 20), b = r.int(3, 9), h = r.int(3, 9);
          html = `A triangular prism lies on one of its rectangular faces, like a tent. It is ${l} cm long (left to right). Each triangular end, facing left and right, has base ${b} cm and height ${h} cm.`;
          const T3 = `a triangle with base ${b} cm and height ${h} cm`, F = `a rectangle ${l} cm by ${h} cm`, P = `a rectangle ${l} cm by ${b} cm with a line along the middle`;
          opts = view === 'plan' ? [P, F, T3, `a triangle with base ${l} cm and height ${b} cm`] : view === 'front elevation' ? [F, T3, P, `a triangle with base ${l} cm and height ${h} cm`] : [T3, F, P, `a rectangle ${b} cm by ${h} cm`];
          why = view === 'plan' ? 'From above you see the two sloping faces meeting along the top edge, which shows as a line down the middle.' : view === 'front elevation' ? 'From the front you see the sloping face side-on: as wide as the prism is long and as tall as the triangle.' : 'From the side you look straight at a triangular end.';
        } else if (solid === 'cylinder') {
          const rr = r.int(2, 9), h = r.int(4, 15);
          html = `A cylinder stands upright on a table. Its radius is ${rr} cm and its height is ${h} cm.`;
          const P = `a circle of radius ${rr} cm`, F = `a rectangle ${2 * rr} cm wide and ${h} cm tall`;
          opts = view === 'plan' ? [P, F, `a circle of radius ${2 * rr} cm`, `a rectangle ${rr} cm wide and ${h} cm tall`] : [F, P, `a rectangle ${rr} cm wide and ${h} cm tall`, `a circle of radius ${rr} cm with a dot in the centre`];
          why = view === 'plan' ? 'From above you see the circular top.' : `From the ${view === 'front elevation' ? 'front' : 'side'} you see a rectangle as wide as the diameter (2 × ${rr} = ${2 * rr} cm).`;
        } else if (solid === 'pyramid') {
          let s, h; do { s = r.int(3, 10); h = r.int(4, 12); } while (s === h);
          html = `A square-based pyramid stands on its base. The base has side ${s} cm and the pyramid is ${h} cm tall.`;
          const P = `a square of side ${s} cm with both diagonals drawn`, F = `a triangle with base ${s} cm and height ${h} cm`;
          opts = view === 'plan' ? [P, `a square of side ${s} cm with no lines inside`, F, `a triangle with base ${s} cm and height ${s} cm`] : [F, P, `a square of side ${s} cm with no lines inside`, `a triangle with base ${h} cm and height ${s} cm`];
          why = view === 'plan' ? 'From above you see the square base and the four sloping edges meeting at the apex in the centre.' : 'From the front or side you see a triangle as wide as the base and as tall as the pyramid.';
        } else {
          const rr = r.int(2, 8), h = r.int(4, 14);
          html = `A cone stands on its circular base. Its radius is ${rr} cm and its height is ${h} cm.`;
          const P = `a circle of radius ${rr} cm with a dot at the centre`, F = `a triangle with base ${2 * rr} cm and height ${h} cm`;
          opts = view === 'plan' ? [P, F, `a triangle with base ${rr} cm and height ${h} cm`, `a circle of radius ${h} cm`] : [F, P, `a triangle with base ${rr} cm and height ${h} cm`, `a rectangle ${2 * rr} cm by ${h} cm`];
          why = view === 'plan' ? 'From above you see the circular base, with the point of the cone in the centre.' : `From the ${view === 'front elevation' ? 'front' : 'side'} you see a triangle whose base is the diameter, 2 × ${rr} = ${2 * rr} cm.`;
        }
        return { html: `${html} Which of these describes its ${B(view)}?`, ...mcq(r, opts, 0), hint: view === 'plan' ? 'Imagine looking straight down from above.' : `Imagine looking straight at it from the ${view === 'front elevation' ? 'front' : 'side'}.`,
          steps: [view === 'plan' ? 'The plan is the view from directly above.' : `The ${view} is the view from the ${view === 'front elevation' ? 'front' : 'side'}.`, why, `The ${view} is ${B(opts[0])}.`] };
      }],
    ['Surface area of prisms & open boxes',
      'Surface area is the total area of all the faces — sketching the net helps you see every face. For a prism, add the two end faces to the rectangles round the sides: each rectangle is one side of the cross-section × the length.',
      (r) => {
        const v = r.int(0, 4); const u = r.pick(['cm', 'cm', 'm']);
        if (v === 0) {
          const [a0, b0, c0] = r.pick([[3, 4, 5], [6, 8, 10], [5, 12, 13], [8, 15, 17], [9, 12, 15], [12, 16, 20]]); const sw = r.chance(); const a = sw ? b0 : a0, b = sw ? a0 : b0, c = c0; const l = r.int(4, 25);
          const ends = a * b, sides = (a + b + c) * l, SA = ends + sides;
          return { html: `${r.pick(['The diagram shows a triangular prism.', 'A wooden doorstop is a triangular prism.', 'A ramp is made in the shape of a triangular prism.', 'A cheese wedge is modelled as a triangular prism.'])} The cross-section is a right-angled triangle with sides ${a} ${u}, ${b} ${u} and ${c} ${u}. The prism is ${l} ${u} long. Work out its total surface area.`, diagram: rtPrismSvg(`${a} ${u}`, `${b} ${u}`, `${c} ${u}`, `${l} ${u}`), unit: u + '²', ...nAns(SA, { unit: u + '²' }), hint: 'Two triangles plus three rectangles.',
            steps: [`Two triangular ends: 2 × ½ × ${a} × ${b} = ${ends} ${u}²`, `Three rectangles: ${a} × ${l} + ${b} × ${l} + ${c} × ${l} = ${a * l} + ${b * l} + ${c * l} = ${sides} ${u}²`, `Total = ${ends} + ${sides} = ${B(SA)} ${u}²`] };
        }
        if (v === 1) {
          const [p, q, s] = r.pick([[3, 4, 5], [4, 3, 5], [6, 8, 10], [8, 6, 10], [5, 12, 13], [12, 5, 13], [9, 12, 15], [12, 9, 15]]); const b = 2 * p, l = r.int(5, 30);
          const tri = 2 * (b * q / 2), recs = (2 * s + b) * l, SA = tri + recs;
          return { html: `${r.pick(['A tent is a triangular prism, including the groundsheet.', 'A chocolate box is a triangular prism.', 'A roof section is modelled as a closed triangular prism.', 'The diagram shows a closed triangular prism.'])} Each end is an isosceles triangle with base ${b} ${u}, sloping sides ${s} ${u} and perpendicular height ${q} ${u}. The prism is ${l} ${u} long. Work out the total surface area.`, diagram: tentSvg(`${b} ${u}`, `${q} ${u}`, `${s} ${u}`, `${l} ${u}`), unit: u + '²', ...nAns(SA, { unit: u + '²' }), hint: 'Use the perpendicular height for the triangles, and the sloping sides for the rectangles.',
            steps: [`Two triangular ends: 2 × ½ × ${b} × ${q} = ${tri} ${u}²`, `Two sloping rectangles: 2 × ${s} × ${l} = ${2 * s * l} ${u}²`, `Base rectangle: ${b} × ${l} = ${b * l} ${u}²`, `Total = ${tri} + ${2 * s * l} + ${b * l} = ${B(SA)} ${u}²`] };
        }
        if (v === 2) {
          const [l, w, h] = r.sample([2, 3, 4, 5, 6, 7, 8, 9, 10, 12, 15], 3); const SA = l * w + 2 * l * h + 2 * w * h;
          return { html: `${r.pick(['An open box (with no lid)', 'A fish tank with no lid', 'An open-topped storage tray', 'A planter with an open top'])} is a cuboid ${l} ${u} long, ${w} ${u} wide and ${h} ${u} high. Work out the area of material needed to make it (the outside surface area).`, diagram: cuboidSvg(`${l} ${u}`, `${w} ${u}`, `${h} ${u}`), unit: u + '²', ...nAns(SA, { unit: u + '²' }), hint: 'There are only five faces: no top.',
            steps: [`Base: ${l} × ${w} = ${l * w} ${u}²`, `Front and back: 2 × ${l} × ${h} = ${2 * l * h} ${u}²`, `Two ends: 2 × ${w} × ${h} = ${2 * w * h} ${u}²`, `Total (no lid) = ${l * w} + ${2 * l * h} + ${2 * w * h} = ${B(SA)} ${u}²`] };
        }
        if (v === 3) {
          const s = r.int(2, 15); const SA = 6 * s * s;
          return { html: `${r.pick(['A cube has a total surface area of', 'A dice-shaped block (a cube) has surface area', 'The surface area of a cube is'])} ${B(SA + ' ' + u + '²')}. Work out the length of one edge of the cube.`, unit: u, ...nAns(s, { unit: u }), hint: 'A cube has 6 identical square faces.',
            steps: [`A cube has 6 identical square faces, so one face = ${SA} ÷ 6 = ${s * s} ${u}²`, `Edge = √${s * s} = ${B(s)} ${u}`] };
        }
        const l = r.int(2, 9), w = r.int(2, 6), h = r.int(1, 4); const SA = 2 * (l * w + l * h + w * h); const cover = r.pick([5, 8, 10, 12]); const tins = Math.ceil(SA / cover); const price = r.pick([6, 8, 9, 12, 15]);
        return { html: `A wooden crate is a closed cuboid ${l} m long, ${w} m wide and ${h} m high. All the outside faces are painted. One tin of paint covers ${cover} m² and costs £${price}. Work out the cost of the paint needed.`, diagram: cuboidSvg(`${l} m`, `${w} m`, `${h} m`), answerLabel: '£', ...nAns(tins * price, { money: true }), hint: 'Find the surface area, then the number of whole tins.',
          steps: [`Surface area = 2(${l} × ${w} + ${l} × ${h} + ${w} × ${h}) = 2(${l * w} + ${l * h} + ${w * h}) = ${SA} m²`, SA % cover ? `Tins: ${SA} ÷ ${cover} = ${ds(Math.round(SA / cover * 100) / 100)}, so ${tins} tin${tins > 1 ? 's' : ''} (round up — you cannot buy part of a tin)` : `Tins: ${SA} ÷ ${cover} = ${tins} tin${tins > 1 ? 's' : ''} exactly`, `Cost = ${tins} × £${price} = ${B('£' + fx(tins * price, 2))}`] };
      }],
    ['Surface area of a cylinder',
      'The net of a closed cylinder is two circles and a rectangle. The rectangle is as long as the circumference (πd) and as wide as the height, so surface area = 2πr² + πdh. Leave the answer in terms of π if asked.',
      (r) => {
        const v = r.int(0, 3); const rr = r.int(2, 12), h = r.int(3, 25); const useD = r.chance(0.4); const d = 2 * rr;
        const given = useD ? `diameter ${B(d + ' cm')}` : `radius ${B(rr + ' cm')}`; const dia = cylSvg(useD ? `${d} cm` : `${rr} cm`, `${h} cm`, useD);
        const rStep = useD ? `Radius = ${d} ÷ 2 = ${rr} cm` : `Diameter = 2 × ${rr} = ${d} cm`;
        const ctxC = r.pick(['A closed cylinder', 'A tin of beans (a closed cylinder)', 'A cylindrical water tank with a lid', 'A solid metal cylinder']);
        if (v === 0) {
          const k = 2 * rr * rr + d * h;
          return { html: `${ctxC} has ${given} and height ${B(h + ' cm')}. Work out its total surface area. Give your answer in terms of π.`, diagram: dia, unit: 'cm²', ...piAns(k), format: PI_FMT, hint: 'Two circles plus the curved rectangle: 2πr² + πdh.',
            steps: [rStep, `Two circles: 2 × π × ${rr}² = ${piT(2 * rr * rr)}`, `Curved surface: π × ${d} × ${h} = ${piT(d * h)}`, `Total = ${piT(2 * rr * rr)} + ${piT(d * h)} = ${B(piT(k))} cm²`] };
        }
        if (v === 1) {
          const k = 2 * rr * rr + d * h; const SA = Math.PI * k;
          return { html: `${ctxC} has ${given} and height ${B(h + ' cm')}. Work out its total surface area. Give your answer to 1 decimal place.`, diagram: dia, unit: 'cm²', ...nAns(SA, { dp: 1, unit: 'cm²' }), format: 'Give your answer to 1 decimal place.', hint: 'SA = 2πr² + πdh.',
            steps: [rStep, `Two circles: 2 × π × ${rr}² = ${fx(2 * Math.PI * rr * rr, 3)}… cm²`, `Curved surface: π × ${d} × ${h} = ${fx(Math.PI * d * h, 3)}… cm²`, `Total = ${fx(SA, 3)}… = ${B(r1(SA))} cm²`] };
        }
        if (v === 2) {
          const k = d * h; const inPi = r.chance();
          const ctx = r.pick(['A paper label covers the curved surface of a tin', 'A cardboard tube (open at both ends)', 'A cylindrical lampshade with no top or bottom', 'A pipe section, open at both ends,']);
          return { html: `${ctx} has ${given} and height ${B(h + ' cm')}. Work out the area of its curved surface. Give your answer ${inPi ? 'in terms of π' : 'to 1 decimal place'}.`, diagram: dia, unit: 'cm²', ...(inPi ? piAns(k) : nAns(Math.PI * k, { dp: 1, unit: 'cm²' })), format: inPi ? PI_FMT : 'Give your answer to 1 decimal place.', hint: 'Unrolled, the curved surface is a rectangle: circumference × height.',
            steps: [rStep, `Unrolled, the curved surface is a rectangle ${d}π cm long (the circumference) and ${h} cm wide.`, inPi ? `Area = π × ${d} × ${h} = ${B(piT(k))} cm²` : `Area = π × ${d} × ${h} = ${fx(Math.PI * k, 3)}… = ${B(r1(Math.PI * k))} cm²`] };
        }
        const k = rr * rr + d * h; const inPi = r.chance();
        const ctx = r.pick(['A plant pot (a cylinder open at the top)', 'A mug with no lid', 'An open-topped cylindrical bin', 'A cylindrical cup, open at the top,']);
        return { html: `${ctx} has ${given} and height ${B(h + ' cm')}. Work out the outside surface area, including the base. Give your answer ${inPi ? 'in terms of π' : 'to 1 decimal place'}.`, diagram: dia, unit: 'cm²', ...(inPi ? piAns(k) : nAns(Math.PI * k, { dp: 1, unit: 'cm²' })), format: inPi ? PI_FMT : 'Give your answer to 1 decimal place.', hint: 'Only one circle this time.',
          steps: [rStep, `One circle (the base): π × ${rr}² = ${piT(rr * rr)}`, `Curved surface: π × ${d} × ${h} = ${piT(d * h)}`, inPi ? `Total = ${B(piT(k))} cm²` : `Total = ${piT(k)} = ${fx(Math.PI * k, 3)}… = ${B(r1(Math.PI * k))} cm²`] };
      }],
  ]);

  // ======================================================================
  // CONSTRUCTIONS, LOCI & CONGRUENCE
  // ======================================================================
  function triFromSides(a, b, c) { // sides opposite A,B,C -> points [A,B,C]
    const cosB = (a * a + c * c - b * b) / (2 * a * c); const sinB = Math.sqrt(Math.max(0, 1 - cosB * cosB));
    return [[c * cosB, c * sinB], [0, 0], [a, 0]];
  }
  function triFromAngles(A, Bd) { const C = 180 - A - Bd; const a = sinD(A), c = sinD(C); return [[c * cosD(Bd), c * sinD(Bd)], [0, 0], [a, 0]]; }
  // place points P (math coords) into screen box [x0,y0,w,h]
  function boxFit(P, x0, y0, w, h) {
    const xs = P.map((p) => p[0]), ys = P.map((p) => p[1]); const minx = Math.min(...xs), maxx = Math.max(...xs), miny = Math.min(...ys), maxy = Math.max(...ys);
    const s = Math.min(w / ((maxx - minx) || 1), h / ((maxy - miny) || 1));
    const ox = x0 + (w - (maxx - minx) * s) / 2, oy = y0 + (h - (maxy - miny) * s) / 2;
    return P.map((p) => [ox + (p[0] - minx) * s, oy + (maxy - p[1]) * s]);
  }
  function triDraw(P, vl, sides, angs, hi) {
    const g = [(P[0][0] + P[1][0] + P[2][0]) / 3, (P[0][1] + P[1][1] + P[2][1]) / 3]; const un = (a, b) => { const dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy) || 1; return [dx / l, dy / l]; };
    let body = sPoly(P, { fill: ACC, fop: 0.05 });
    for (let i = 0; i < 3; i++) {
      const A = P[i], Bp = P[(i + 1) % 3];
      if (sides[i]) { const m = [(A[0] + Bp[0]) / 2, (A[1] + Bp[1]) / 2]; const u = un(g, m); body += sT(m[0] + u[0] * 15, m[1] + u[1] * 13, sides[i], { fs: 13, c: hi === 's' + i ? ACC : undefined, b: hi === 's' + i }); }
      const V = P[i], u = un(g, V); body += sT(V[0] + u[0] * 14, V[1] + u[1] * 14, vl[i], { b: true, fs: 13 });
      if (angs[i]) body += angArc(V, P[(i + 1) % 3], P[(i + 2) % 3], 20, angs[i], { lr: 16, fs: 12, c: hi === 'a' + i ? ACC : undefined, tc: hi === 'a' + i ? ACC : undefined });
    }
    return body;
  }

  topic('y9-constructions', 'geometry', 9, 1, 'FH', 'Constructions, Loci & Congruence', 'Scale drawings and maps, loci, bisectors, constructing triangles and congruent triangles.', [
    ['Scale drawings & map scales',
      'A scale such as 1 : 50 000 means 1 cm on the map is 50 000 cm in real life. Multiply by the scale to get the real length, divide to get the map length, then convert units (100 cm = 1 m, 1000 m = 1 km).',
      (r) => {
        const v = r.int(0, 4);
        if (v <= 1) {
          const n = r.pick([10000, 20000, 25000, 50000, 100000, 200000, 250000, 500000]); const d = r.int(2, 24) / (r.chance(0.3) ? 2 : 1);
          const km = d * n / 100000; const place = r.pick(['two villages', 'two train stations', 'a campsite and a lake', 'two lighthouses', 'the school and the leisure centre', 'two hilltops']);
          if (v === 0) return { html: `A map has a scale of ${B('1 : ' + ds(n))}. On the map, the distance between ${place} is ${B(ds(d) + ' cm')}. Work out the real distance in kilometres.`, unit: 'km', ...nAns(km, { unit: 'km' }), hint: `Each 1 cm on the map is ${ds(n)} cm in real life.`,
            steps: [`Real distance = ${ds(d)} × ${ds(n)} = ${ds(d * n)} cm`, `÷ 100 to get metres: ${ds(d * n / 100)} m`, `÷ 1000 to get kilometres: ${B(ds(km))} km`] };
          return { html: `A map has a scale of ${B('1 : ' + ds(n))}. The real distance between ${place} is ${B(ds(km) + ' km')}. How far apart are they on the map, in centimetres?`, unit: 'cm', ...nAns(d, { unit: 'cm' }), hint: 'Change the real distance to centimetres first.',
            steps: [`${ds(km)} km = ${ds(km * 1000)} m = ${ds(d * n)} cm`, `Map distance = ${ds(d * n)} ÷ ${ds(n)} = ${B(ds(d))} cm`] };
        }
        if (v === 2) {
          const k = r.pick([2, 3, 4, 5, 10, 20, 25, 50]); const unit = k >= 10 ? r.pick(['m', 'km']) : 'm'; const toReal = r.chance();
          const thing = unit === 'km' ? r.pick(['road', 'canal', 'railway line', 'river path']) : r.pick(['garden', 'hall', 'playground', 'kitchen', 'car park']);
          const L = r.int(2, 18) / (r.chance(0.3) ? 2 : 1); const real = L * k;
          if (toReal) return { html: `On a scale drawing of a ${thing}, ${B('1 cm represents ' + k + ' ' + unit)}. A length on the drawing is ${B(ds(L) + ' cm')}. What is the real length?`, unit, ...nAns(real, { unit }), hint: `Multiply by ${k}.`, steps: [`Each 1 cm stands for ${k} ${unit}.`, `Real length = ${ds(L)} × ${k} = ${B(ds(real))} ${unit}`] };
          return { html: `On a scale drawing of a ${thing}, ${B('1 cm represents ' + k + ' ' + unit)}. A real length is ${B(ds(real) + ' ' + unit)}. How long should it be on the drawing?`, unit: 'cm', ...nAns(L, { unit: 'cm' }), hint: `Divide by ${k}.`, steps: [`Each ${k} ${unit} in real life is 1 cm on the drawing.`, `Drawing length = ${ds(real)} ÷ ${k} = ${B(ds(L))} cm`] };
        }
        if (v === 3) {
          const n = r.pick([10, 18, 20, 24, 25, 32, 40, 43, 50, 64, 72, 76, 87, 100]); const mod = r.int(3, 40) / (r.chance(0.3) ? 2 : 1); const realCm = mod * n;
          const obj = r.pick(['car', 'bus', 'train carriage', 'boat', 'aeroplane', 'tractor']);
          if (r.chance()) return { html: `A model ${obj} is made to a scale of ${B('1 : ' + n)}. The model is ${B(ds(mod) + ' cm')} long. How long is the real ${obj}, in metres?`, unit: 'm', ...nAns(realCm / 100, { unit: 'm' }), hint: `The real ${obj} is ${n} times as long.`, steps: [`Real length = ${ds(mod)} × ${n} = ${ds(realCm)} cm`, `÷ 100: ${B(ds(realCm / 100))} m`] };
          return { html: `A model ${obj} is made to a scale of ${B('1 : ' + n)}. The real ${obj} is ${B(ds(realCm / 100) + ' m')} long. How long is the model, in centimetres?`, unit: 'cm', ...nAns(mod, { unit: 'cm' }), hint: 'Change metres to centimetres, then divide.', steps: [`${ds(realCm / 100)} m = ${ds(realCm)} cm`, `Model length = ${ds(realCm)} ÷ ${n} = ${B(ds(mod))} cm`] };
        }
        const n = r.pick([20, 25, 40, 50, 100, 200, 250, 500, 1000]); let dcm; do { dcm = r.int(2, 20); } while ((dcm * n) % 100 && n >= 100); const realCm = dcm * n; const realM = realCm / 100;
        return { html: `${r.pick(['On a plan of a house', 'On a scale drawing of a park', 'On a plan of a school field', 'On a builder\'s plan'])}, a wall that is really ${B(ds(realM) + ' m')} long is drawn ${B(dcm + ' cm')} long. Write the scale in the form 1 : n.`, answer: `1:${n}`, check: { type: 'ratio', parts: [1, n] }, answerHtml: B(`1 : ${ds(n)}`), format: 'Type the scale with a colon, e.g. 1:50', hint: 'Make the units the same first.',
          steps: [`Same units: ${ds(realM)} m = ${ds(realCm)} cm`, `Scale = ${dcm} : ${ds(realCm)}`, `Divide both by ${dcm}: ${B('1 : ' + ds(n))}`] };
      }],
    ['Choosing loci',
      'A locus is the set of points that obey a rule. A fixed distance from a point gives a circle; a fixed distance from a line segment gives a stadium shape; equidistant from two points gives the perpendicular bisector; equidistant from two lines that meet gives the angle bisector.',
      (r) => {
        const v = r.int(0, 5);
        if (v <= 2) {
          const d = r.int(2, 9); const u = r.pick(['m', 'cm', 'km']);
          const L = {
            circle: `a circle of radius ${d} ${u} centred on the point`, disc: `the region inside a circle of radius ${d} ${u} centred on the point`, perp: 'the perpendicular bisector of the line joining the two points',
            ang: 'the bisector of the angle between the two lines', stad: `a stadium shape: two lines parallel to the segment, ${d} ${u} away, joined by semicircles at the ends`, side: 'the region on one side of the perpendicular bisector of the two points',
            para: `a pair of lines parallel to the line, each ${d} ${u} away`,
          };
          const Q = [
            ['circle', `A sprinkler sprays water exactly ${d} ${u} in every direction. Which describes the locus of points where the water lands?`, 'All points the same distance from one fixed point form a circle.'],
            ['circle', `A dog on a ${d} ${u} lead is tied to a post, and the lead is pulled tight. Which describes the locus of the dog's collar?`, 'Points exactly the same distance from a fixed point form a circle.'],
            ['disc', `A phone mast has a range of ${d} ${u}. Which describes the region where you can get a signal?`, 'Points up to a fixed distance from a point lie inside (and on) a circle.'],
            ['disc', `A goat is tied to a peg with a rope ${d} ${u} long. Which describes the region the goat can reach?`, 'Points up to a fixed distance from a point lie inside (and on) a circle.'],
            ['perp', 'A new bench must be the same distance from two trees, A and B. Which describes the possible positions?', 'Points equidistant from two points lie on the perpendicular bisector of the line joining them.'],
            ['perp', 'A lifeguard wants to stand the same distance from two flags on a beach. Which describes where she could stand?', 'Points equidistant from two points lie on the perpendicular bisector of the line joining them.'],
            ['ang', 'A path across a field must stay the same distance from two straight hedges that meet at a corner. Which describes the path?', 'Points equidistant from two lines that meet lie on the bisector of the angle between them.'],
            ['ang', 'A robot moves so it is always equally far from two straight walls that meet at a corner. Which describes its route?', 'Points equidistant from two lines that meet lie on the bisector of the angle between them.'],
            ['stad', `A security light covers everything within ${d} ${u} of a straight fence of fixed length, measured to the nearest point of the fence. Which describes the edge of the lit region?`, 'Beside the fence you get parallel lines; round each end you get a semicircle centred on the end point.'],
            ['stad', `A boundary is drawn exactly ${d} ${u} from a straight wall AB (to the nearest point of the wall, including round its ends). Which describes the boundary?`, 'Beside the wall you get parallel lines; round each end you get a semicircle centred on the end point.'],
            ['side', 'A treasure is buried closer to tree A than to tree B. Which describes where it could be?', 'The perpendicular bisector splits the plane into points nearer A and points nearer B.'],
            ['para', `A boat stays exactly ${d} ${u} from a long, straight coastline. Which describes its possible positions (on either side, ignoring the land)?`, 'Points a fixed distance from a long straight line lie on two lines parallel to it.'],
          ];
          const [key, text, why] = r.pick(Q); const others = r.sample(Object.keys(L).filter((k) => k !== key && !(key === 'circle' && k === 'disc') && !(key === 'disc' && k === 'circle') && !(key === 'perp' && k === 'side') && !(key === 'side' && k === 'perp')), 3);
          return { html: text, ...mcq(r, [L[key], ...others.map((k) => L[k])], 0), hint: 'Is the rule about a point, a line, two points or two lines?', steps: [why, `The answer is ${B(L[key])}.`] };
        }
        const rr = r.int(3, 15); const u = 'm';
        if (v === 3) {
          const where = r.pick([['in the middle of an open field', 1, 'a full circle'], ['to a point on a long straight wall', 0.5, 'a semicircle (the wall blocks half)'], ['to the corner of a fenced square field, inside the field', 0.25, 'a quarter circle'], ['to the outside corner of a large rectangular barn', 0.75, 'three quarters of a circle (the barn blocks a right angle)']]);
          const A = Math.PI * rr * rr * where[1];
          return { html: `A goat is tied ${where[0]} with a rope ${B(rr + ' ' + u)} long. Work out the area of grass the goat can reach. Give your answer to 1 decimal place.`, unit: 'm²', ...nAns(A, { dp: 1, unit: 'm²' }), format: 'Give your answer to 1 decimal place.', hint: 'Decide what fraction of a circle the goat can reach.',
            steps: [`The locus is ${where[2]} of radius ${rr} m.`, `Full circle: π × ${rr}² = ${fx(Math.PI * rr * rr, 3)}… m²`, where[1] === 1 ? `Area = ${B(r1(A))} m²` : `Area = ${ds(where[1])} × ${fx(Math.PI * rr * rr, 3)}… = ${B(r1(A))} m²`] };
        }
        if (v === 4) {
          const Lw = r.int(5, 40), d = r.int(1, 8); const P = 2 * Lw + 2 * Math.PI * d;
          return { html: `A path is marked out exactly ${B(d + ' m')} from a straight wall that is ${B(Lw + ' m')} long, all the way round the wall (including round both ends). Work out the length of the path. Give your answer to 1 decimal place.`, unit: 'm', ...nAns(P, { dp: 1, unit: 'm' }), format: 'Give your answer to 1 decimal place.', hint: 'The path is a stadium: two straight sides and two semicircles.',
            steps: [`Two straight parts, each as long as the wall: 2 × ${Lw} = ${2 * Lw} m`, `Two semicircles of radius ${d} make one full circle: 2 × π × ${d} = ${fx(2 * Math.PI * d, 3)}… m`, `Total = ${2 * Lw} + ${fx(2 * Math.PI * d, 3)}… = ${B(r1(P))} m`] };
        }
        const AB = 2 * r.int(3, 15), x = r.int(1, AB / 2 - 1); const ax = r.chance(); const dA = ax ? x : AB - x;
        return { html: `Points A and B are ${B(AB + ' cm')} apart. Point P lies on the line segment AB, ${B(x + ' cm')} from ${ax ? 'A' : 'B'}. ${r.pick(['How far is P from the perpendicular bisector of AB?', 'Work out the distance from P to the perpendicular bisector of AB.'])}`, unit: 'cm', ...nAns(AB / 2 - x, { unit: 'cm' }), hint: 'The perpendicular bisector crosses AB at its midpoint.',
          steps: [`The perpendicular bisector crosses AB at its midpoint, ${AB / 2} cm from A.`, `P is ${dA} cm from A, so it is ${ax ? 'closer to A' : 'closer to B'}.`, `Distance to the bisector = ${AB / 2} − ${x} = ${B(AB / 2 - x)} cm`] };
      }],
    ['Bisectors & constructing triangles',
      'Every point on the perpendicular bisector of AB is the same distance from A and B, and it meets AB at 90° at its midpoint. Every point on an angle bisector is the same distance from both arms. A triangle can only be constructed if the two shorter sides add up to more than the longest side.',
      (r) => {
        const v = r.int(0, 6);
        if (v === 0) { const L = r.int(4, 30); return { html: `${r.pick(['The perpendicular bisector of AB', 'A line constructed with compasses to bisect AB at right angles', 'The perpendicular bisector of the line segment AB'])} meets AB at M. AB = ${B(L + ' cm')}. Work out the length AM.`, unit: 'cm', ...nAns(L / 2, { unit: 'cm' }), hint: 'Bisect means cut into two equal parts.', steps: ['The perpendicular bisector cuts AB exactly in half at M.', `AM = ${L} ÷ 2 = ${B(ds(L / 2))} cm`] }; }
        if (v === 1) {
          const d = r.int(4, 20), L = r.int(3, 2 * d - 1); const ask = r.pick(['PB', 'per']);
          if (ask === 'PB') return { html: `Point P lies on the perpendicular bisector of AB. PA = ${B(d + ' cm')} and AB = ${B(L + ' cm')}. Work out the length of PB.`, unit: 'cm', ...nAns(d, { unit: 'cm' }), hint: 'What is special about every point on a perpendicular bisector?', steps: ['Every point on the perpendicular bisector of AB is equidistant from A and B.', `So PB = PA = ${B(d)} cm (the length of AB is not needed).`] };
          return { html: `Point P lies on the perpendicular bisector of AB. PA = ${B(d + ' cm')} and AB = ${B(L + ' cm')}. Work out the perimeter of triangle PAB.`, unit: 'cm', ...nAns(2 * d + L, { unit: 'cm' }), hint: 'Find PB first.', steps: ['P is on the perpendicular bisector, so PB = PA = ' + d + ' cm.', `Perimeter = ${d} + ${d} + ${L} = ${B(2 * d + L)} cm`] };
        }
        if (v === 2) {
          const a = r.int(4, 80); const PAB = r.chance();
          return { html: `Point P lies on the perpendicular bisector of AB (P is not on AB). Angle PAB = ${B(a + '°')}. Work out angle ${PAB ? 'PBA' : 'APB'}.`, unit: '°', ...nAns(PAB ? a : 180 - 2 * a, { unit: '°' }), hint: 'PA = PB, so triangle PAB is isosceles.',
            steps: ['P is on the perpendicular bisector, so PA = PB and triangle PAB is isosceles.', `Base angles are equal: angle PBA = ${a}°`, ...(PAB ? [] : [`Angle APB = 180° − ${a}° − ${a}° = ${180 - 2 * a}°`]), `Answer: ${B((PAB ? a : 180 - 2 * a) + '°')}`] };
        }
        if (v === 3) {
          const th = 2 * r.int(15, 85); const rev = r.chance(0.35);
          if (rev) return { html: `The bisector of angle ABC makes an angle of ${B(th / 2 + '°')} with the line BA. Work out the size of angle ABC.`, unit: '°', ...nAns(th, { unit: '°' }), hint: 'The bisector splits the angle into two equal halves.', steps: ['An angle bisector cuts the angle into two equal parts.', `Angle ABC = 2 × ${th / 2}° = ${B(th + '°')}`] };
          return { html: `${r.pick(['Angle ABC', 'The angle between two straight paths', 'The angle at the corner of a field'])} is ${B(th + '°')}. It is bisected using compasses. What is the size of each of the two new angles?`, unit: '°', ...nAns(th / 2, { unit: '°' }), hint: 'Bisect means cut into two equal parts.', steps: ['An angle bisector cuts the angle into two equal parts.', `${th}° ÷ 2 = ${B(th / 2 + '°')}`] };
        }
        if (v === 4) {
          const base = r.pick([[60, 'the angle of an equilateral triangle (constructed with compasses)'], [90, 'a right angle (constructed with a perpendicular)'], [180, 'a straight angle']]); const times = r.int(1, base[0] === 180 ? 3 : 2); const ans = base[0] / 2 ** times;
          return { html: `Kim starts with ${base[1]}, which is ${base[0]}°. She bisects it, ${times > 1 ? `then bisects one of the new angles${times > 2 ? ', then bisects one of those' : ''}` : 'once'}. What size is ${times > 1 ? 'her smallest angle' : 'each new angle'}?`, unit: '°', ...nAns(ans, { unit: '°' }), hint: 'Each bisection halves the angle.',
            steps: [`Start: ${base[0]}°`, ...Array.from({ length: times }, (_, i) => `Bisect: ${base[0] / 2 ** i}° ÷ 2 = ${ds(base[0] / 2 ** (i + 1))}°`), `Answer: ${B(ds(ans) + '°')}`] };
        }
        if (v === 5) {
          const d = r.int(2, 15), th = r.int(30, 140);
          return { html: `Point P lies on the bisector of angle ABC, which is ${th}°. The perpendicular distance from P to the line BA is ${B(d + ' cm')}. What is the perpendicular distance from P to the line BC?`, unit: 'cm', ...nAns(d, { unit: 'cm' }), hint: 'What is special about every point on an angle bisector?', steps: ['Every point on an angle bisector is the same distance from both arms of the angle.', `So the distance to BC is also ${B(d)} cm.`] };
        }
        let a, b, c; do { a = r.int(2, 15); b = r.int(2, 15); c = r.int(2, 22); } while (a + b === c || a + c === b || b + c === a);
        const sides = [a, b, c].sort((x, y) => x - y); const ok = sides[0] + sides[1] > sides[2];
        return { html: `${r.pick(['Leo', 'Priya', 'Sam', 'Aisha'])} tries to construct a triangle with sides ${B(`${a} cm, ${b} cm and ${c} cm`)} using a ruler and compasses. Is it possible?`, ...mcq(r, [`Yes — the two shorter sides add up to more than the longest side`, `No — the two shorter sides add up to less than the longest side`, 'Only if one of the angles is a right angle'], ok ? 0 : 1), hint: 'Compare the sum of the two shorter sides with the longest side.',
          steps: [`Two shorter sides: ${sides[0]} + ${sides[1]} = ${sides[0] + sides[1]} cm; longest side: ${sides[2]} cm.`, ok ? `${sides[0] + sides[1]} &gt; ${sides[2]}, so the arcs from the ends of the longest side will cross: ${B('it is possible')}.` : `${sides[0] + sides[1]} &lt; ${sides[2]}, so the arcs cannot meet: ${B('it is not possible')}.`] };
      }],
    ['Congruence conditions',
      'Congruent shapes are identical in shape and size. Two triangles are congruent if they match by SSS (three sides), SAS (two sides and the angle between them), ASA (two angles and a corresponding side) or RHS (right angle, hypotenuse and one other side). AAA only proves the shapes are similar, and SSA is not enough either.',
      (r) => {
        const Ls = r.pick([['A', 'B', 'C', 'P', 'Q', 'R'], ['D', 'E', 'F', 'X', 'Y', 'Z'], ['A', 'B', 'C', 'L', 'M', 'N'], ['J', 'K', 'L', 'P', 'Q', 'R']]);
        const [a, b, c, p, q, s] = Ls; const t1 = a + b + c, t2 = p + q + s;
        const sd = (i, j) => [Ls[i] + Ls[j], Ls[i + 3] + Ls[j + 3]]; const an = (i, j, k) => [`angle ${Ls[i]}${Ls[j]}${Ls[k]}`, `angle ${Ls[i + 3]}${Ls[j + 3]}${Ls[k + 3]}`];
        const fS = (pair, v) => `${pair[0]} = ${pair[1]} = ${v} cm`; const fA = (pair, v) => `${pair[0]} = ${pair[1]} = ${v}°`;
        const OPTS = ['SSS', 'SAS', 'ASA', 'RHS', 'Not enough information to be sure'];
        const kind = r.pick(['SSS', 'SAS', 'ASA', 'AAS', 'RHS', 'SSA', 'AAA', 'SSS', 'SAS', 'ASA', 'RHS', 'which-not']);
        if (kind === 'which-not') {
          const bad = r.pick(['AAA', 'SSA']);
          return { html: `${r.pick(['Which of these is NOT a valid condition for proving two triangles are congruent?', 'Ravi lists conditions for congruent triangles. Which one is wrong?', 'Which of these does not prove two triangles are congruent?'])}`, ...mcq(r, [bad, ...r.sample(['SSS', 'SAS', 'ASA', 'RHS'], 3)], 0), hint: 'Think about triangles that are the same shape but a different size.',
            steps: ['The four valid conditions are SSS, SAS, ASA (or AAS) and RHS.', bad === 'AAA' ? 'AAA: an enlargement has the same angles but different sides, so the triangles are only similar.' : 'SSA: with two sides and a non-included angle, the third side can often swing to two different positions, giving two different triangles.', `So ${B(bad)} is not a valid condition.`] };
        }
        const x1 = r.int(3, 15), x2 = r.int(3, 15), x3 = r.int(3, 15); let A1, A2; do { A1 = r.int(25, 110); A2 = r.int(25, 110); } while (A1 + A2 > 160 || A1 === A2);
        let facts, ans, why;
        if (kind === 'SSS') { const ss = [x1, x2, x3].sort((m, n) => m - n); if (ss[0] + ss[1] <= ss[2]) ss[2] = ss[0] + ss[1] - 1; facts = [fS(sd(0, 1), ss[0]), fS(sd(1, 2), ss[2]), fS(sd(2, 0), ss[1])]; ans = 0; why = 'All three pairs of sides are equal.'; }
        else if (kind === 'SAS') { facts = [fS(sd(0, 1), x1), fA(an(0, 1, 2), A1), fS(sd(1, 2), x2)]; ans = 1; why = `Two pairs of sides are equal, and the equal angle (at ${b} and ${q}) is between them.`; }
        else if (kind === 'ASA') { facts = [fA(an(2, 0, 1), A1), fS(sd(0, 1), x1), fA(an(0, 1, 2), A2)]; ans = 2; why = `Two pairs of angles are equal, and the equal side ${a}${b} = ${p}${q} lies between them.`; }
        else if (kind === 'AAS') { facts = [fA(an(2, 0, 1), A1), fA(an(0, 1, 2), A2), fS(sd(1, 2), x1)]; ans = 2; why = 'Two pairs of angles are equal, so the third angles are equal too (angles in a triangle add to 180°). Now the equal side lies between two equal angles, so ASA applies.'; }
        else if (kind === 'RHS') { const hyp = Math.max(x1, x2) + r.int(1, 6), leg = Math.min(x1, x2); facts = [fA(an(0, 2, 1), 90), fS(sd(0, 1), hyp), fS(sd(1, 2), leg)]; ans = 3; why = `Both triangles have a right angle (at ${c} and ${s}), equal hypotenuses (${a}${b} = ${p}${q}) and one other pair of equal sides.`; }
        else if (kind === 'SSA') { let cc, aa, Aa; do { cc = r.int(8, 15); Aa = r.int(25, 55); aa = r.int(Math.ceil(cc * sinD(Aa) + 0.5), cc - 1); } while (aa <= cc * sinD(Aa) || aa >= cc); facts = [fS(sd(0, 1), cc), fS(sd(1, 2), aa), fA(an(1, 0, 2), Aa)]; ans = 4; why = `The equal angle (at ${a} and ${p}) is not between the two equal sides and is not a right angle — that is SSA, which can give two different triangles.`; }
        else { facts = [fA(an(2, 0, 1), A1), fA(an(0, 1, 2), A2), fA(an(1, 2, 0), 180 - A1 - A2)]; ans = 4; why = 'Only angles are known (AAA). One triangle could be an enlargement of the other, so they are similar but not necessarily congruent.'; }
        return { html: `Triangles ${B(t1)} and ${B(t2)} have:<br>${r.shuffle(facts).join('<br>')}<br>${r.pick(['Which condition proves the triangles are congruent?', 'Which reason shows the triangles are congruent, if any?', 'Are the triangles congruent? Choose the correct condition.'])}`, ...mcq(r, OPTS, ans), hint: 'Is the angle between the two sides? Is there a right angle with a hypotenuse?',
          steps: [why, `Answer: ${B(OPTS[ans])}`] };
      }],
    ['Congruent triangles: missing sides & angles',
      'If triangle ABC is congruent to triangle PQR, the letters are written in matching order: A matches P, B matches Q and C matches R. So side AB = PQ, angle ABC = angle PQR, and so on — even if one triangle has been rotated or reflected.',
      (r) => {
        const Ls = r.pick([['A', 'B', 'C', 'P', 'Q', 'R'], ['D', 'E', 'F', 'X', 'Y', 'Z'], ['A', 'B', 'C', 'L', 'M', 'N'], ['J', 'K', 'L', 'S', 'T', 'U']]);
        const asSide = r.chance(); let P1, sidesL = ['', '', ''], angL = ['', '', ''], sides2 = ['', '', ''], ang2 = ['', '', ''], ans, steps, html, unit;
        if (asSide) {
          let s; do { s = [r.int(4, 15), r.int(4, 15), r.int(4, 15)]; } while (s[0] + s[1] <= s[2] + 1 || s[1] + s[2] <= s[0] + 1 || s[0] + s[2] <= s[1] + 1 || new Set(s).size < 3);
          // s[0]=BC (opp A), s[1]=CA (opp B), s[2]=AB (opp C); edge i in drawing goes vertex i -> i+1: AB, BC, CA
          P1 = triFromSides(s[0], s[1], s[2]); sidesL = [`${s[2]} cm`, `${s[0]} cm`, `${s[1]} cm`];
          const e = r.int(0, 2); const lens = [s[2], s[0], s[1]]; ans = lens[e]; sides2[e] = 'x'; unit = 'cm';
          const nm = (i, k) => Ls[k + i] + Ls[k + ((i + 1) % 3)];
          html = `Triangle ${B(Ls.slice(0, 3).join(''))} is congruent to triangle ${B(Ls.slice(3).join(''))}. In triangle ${Ls.slice(0, 3).join('')}, ${[0, 1, 2].map((i) => `${nm(i, 0)} = ${lens[i]} cm`).join(', ')}. Work out the length ${B(nm(e, 3))}, marked <i>x</i>.`;
          steps = [`The letters match in order: ${Ls[0]} ↔ ${Ls[3]}, ${Ls[1]} ↔ ${Ls[4]}, ${Ls[2]} ↔ ${Ls[5]}.`, `So ${nm(e, 3)} matches ${nm(e, 0)}.`, `${nm(e, 3)} = ${nm(e, 0)} = ${B(ans)} cm`];
        } else {
          let A, Bd; do { A = r.int(30, 100); Bd = r.int(30, 100); } while (A + Bd > 150 || A === Bd || Math.abs(A + Bd - 90) < 3);
          const C = 180 - A - Bd; const angs = [A, Bd, C]; P1 = triFromAngles(A, Bd);
          const known = r.sample([0, 1, 2], 2); const tgt = r.chance(0.5) ? known[0] : [0, 1, 2].find((i) => !known.includes(i));
          known.forEach((i) => { angL[i] = angs[i] + '°'; }); ang2[tgt] = 'x'; ans = angs[tgt]; unit = '°';
          const nmA = (i, k) => `angle ${Ls[k + ((i + 2) % 3)]}${Ls[k + i]}${Ls[k + ((i + 1) % 3)]}`;
          html = `Triangle ${B(Ls.slice(0, 3).join(''))} is congruent to triangle ${B(Ls.slice(3).join(''))}. In triangle ${Ls.slice(0, 3).join('')}, ${known.map((i) => `${nmA(i, 0)} = ${angs[i]}°`).join(' and ')}. Work out the size of ${B(nmA(tgt, 3))}, marked <i>x</i>.`;
          steps = [`The letters match in order: ${Ls[0]} ↔ ${Ls[3]}, ${Ls[1]} ↔ ${Ls[4]}, ${Ls[2]} ↔ ${Ls[5]}.`, `So ${nmA(tgt, 3)} = ${nmA(tgt, 0)}.`];
          if (known.includes(tgt)) steps.push(`${nmA(tgt, 0)} = ${angs[tgt]}°, so x = ${B(ans + '°')}`);
          else steps.push(`Angles in a triangle add to 180°: ${nmA(tgt, 0)} = 180° − ${angs[known[0]]}° − ${angs[known[1]]}° = ${ans}°`, `So x = ${B(ans + '°')}`);
        }
        // second triangle: rotate (and maybe reflect)
        const rot = r.int(40, 320), refl = r.chance(); const P2 = P1.map(([x, y]) => { const X = refl ? -x : x; return [X * cosD(rot) - y * sinD(rot), X * sinD(rot) + y * cosD(rot)]; });
        const S1 = boxFit(P1, 30, 40, 125, 140), S2 = boxFit(P2, 205, 40, 125, 140);
        const body = triDraw(S1, Ls.slice(0, 3), sidesL, angL) + triDraw(S2, Ls.slice(3), sides2, ang2, asSide ? 's' + sides2.indexOf('x') : 'a' + ang2.indexOf('x'));
        return { html, diagram: svgWrap(360, 225, body), unit, ...nAns(ans, { unit }), hint: 'Match the letters in order to find the corresponding side or angle.', steps };
      }],
  ]);

  // ======================================================================
  // ANGLES IN PARALLEL LINES & DEDUCTION
  // ======================================================================
  // positions: UR, UL, DL, DR at intersection 0 (top) or 1 (bottom); phi = angle UR (anticlockwise from rightwards to upward transversal ray)
  const POS = ['UR', 'UL', 'DL', 'DR'];
  const posRange = (p, phi) => ({ UR: [0, phi], UL: [phi, 180], DL: [180, 180 + phi], DR: [180 + phi, 360] }[p]);
  const posVal = (p, phi) => (p === 'UR' || p === 'DL' ? phi : 180 - phi);
  // label placed beyond an arc, anchored away from the vertex so long expressions do not cross the lines
  function aLab(V, mid, rad, text, hi) {
    const c = cosD(mid), sn = sinD(mid); const a = c > 0.3 ? 'start' : c < -0.3 ? 'end' : 'middle';
    return sT(V[0] + rad * c, V[1] - rad * sn + (a === 'middle' ? -sn * 4 : 0), text, { a, fs: 13, c: hi ? ACC : undefined });
  }
  function lineAnglesSvg(parts, full) {
    const O = full ? [180, 125] : [180, 165]; const L = full ? 100 : 140; let body = '';
    if (!full) body += sL(O[0] - 160, O[1], O[0] + 160, O[1]);
    let acc = full ? 90 : 0; const pt = (a, rr) => [O[0] + rr * cosD(a), O[1] - rr * sinD(a)];
    parts.forEach((p, i) => { if (full || i > 0) { const e = pt(acc, L); body += sL(O[0], O[1], e[0], e[1]); } const a1 = acc + p.deg;
      body += angArc(O, pt(acc, 10), pt(a1, 10), 26, '', { c: p.hi ? ACC : undefined, w: 1.5 }) + aLab(O, acc + p.deg / 2, 36, p.label, p.hi); acc = a1; });
    return svgWrap(360, full ? 250 : 205, body + dot(O[0], O[1]));
  }
  function parSvg(phi, marks, extra = '') {
    const y = [85, 175], cot = cosD(phi) / sinD(phi); const X = [180 + 45 * cot, 180 - 45 * cot]; const u = [cosD(phi), -sinD(phi)];
    let body = sL(20, y[0], 340, y[0]) + sL(20, y[1], 340, y[1]);
    for (const yy of y) body += sPoly([[302, yy - 6], [310, yy], [302, yy + 6]], { open: true, c: ACC });
    body += sL(X[1] - 62 * u[0], y[1] - 62 * u[1], X[0] + 62 * u[0], y[0] + 62 * u[1]);
    for (const m of marks) {
      const V = [X[m.i], y[m.i]]; const [a0, a1] = posRange(m.p, phi); const sz = a1 - a0; const rr = sz < 50 ? 32 : 20;
      const pt = (a) => [V[0] + 10 * cosD(a), V[1] - 10 * sinD(a)];
      if (m.long) body += angArc(V, pt(a0), pt(a1), rr, '', { c: m.hi ? ACC : undefined, w: 1.5 }) + aLab(V, (a0 + a1) / 2, rr + 8, m.label, m.hi);
      else body += angArc(V, pt(a0), pt(a1), rr, m.label, { c: m.hi ? ACC : undefined, tc: m.hi ? ACC : undefined, lr: sz < 50 ? 16 : 18, w: 1.5, fs: 13 });
    }
    return svgWrap(360, 260, body + extra);
  }
  // relationship between two marked positions (direct only)
  function relation(m1, m2) {
    if (m1.i === m2.i) {
      const opp = { UR: 'DL', DL: 'UR', UL: 'DR', DR: 'UL' };
      return opp[m1.p] === m2.p ? 'vert' : 'line';
    }
    const [t, b] = m1.i === 0 ? [m1, m2] : [m2, m1];
    if (t.p === b.p) return 'corr';
    if ((t.p === 'DL' && b.p === 'UR') || (t.p === 'DR' && b.p === 'UL')) return 'alt';
    if ((t.p === 'DL' && b.p === 'UL') || (t.p === 'DR' && b.p === 'UR')) return 'coint';
    return null;
  }
  const REL = {
    corr: ['Corresponding angles are equal', true, 'corresponding angles'], alt: ['Alternate angles are equal', true, 'alternate angles'], coint: ['Co-interior angles add up to 180°', false, 'co-interior angles'],
    vert: ['Vertically opposite angles are equal', true, 'vertically opposite angles'], line: ['Angles on a straight line add up to 180°', false, 'angles on a straight line'],
  };
  const pickPhi = (r) => { let p; do { p = r.int(38, 142); } while (p > 78 && p < 102); return p; };
  const exS = (a, b) => `${a === 1 ? '' : a}<tspan font-style="italic">x</tspan>${b ? (b > 0 ? ' + ' + b : ' − ' + -b) : ''}`;
  const exH = (a, b) => `${a === 1 ? '' : a}<i>x</i>${b ? (b > 0 ? ' + ' + b : ' − ' + -b) : ''}`;
  // two crossing lines (X shape) with labels on opposite angles
  function crossSvg(theta, lab1, lab2, hi) {
    const O = [180, 120], L = 130; const d1 = [cosD(theta / 2), -sinD(theta / 2)], d2 = [cosD(-theta / 2), -sinD(-theta / 2)];
    let body = sL(O[0] - L * d1[0], O[1] - L * d1[1], O[0] + L * d1[0], O[1] + L * d1[1]) + sL(O[0] - L * d2[0], O[1] - L * d2[1], O[0] + L * d2[0], O[1] + L * d2[1]);
    const pt = (a) => [O[0] + 10 * cosD(a), O[1] - 10 * sinD(a)];
    body += angArc(O, pt(-theta / 2), pt(theta / 2), 30, '', { w: 1.5, c: hi ? ACC : undefined }) + aLab(O, 0, 38, lab1, hi) + angArc(O, pt(180 - theta / 2), pt(180 + theta / 2), 30, '', { w: 1.5 }) + aLab(O, 180, 38, lab2);
    return svgWrap(360, 245, body + dot(O[0], O[1]));
  }

  topic('y9-angle-deduction', 'geometry', 9, 2, 'FH', 'Angles in Parallel Lines & Deduction', 'Alternate, corresponding and co-interior angles, angle reasoning, equations from angle facts, quadrilaterals and conjectures.', [
    ['Angles in parallel lines',
      'When a transversal crosses two parallel lines, alternate angles (Z shape) are equal, corresponding angles (F shape) are equal and co-interior angles (C shape) add up to 180°. Always name the rule you used.',
      (r) => {
        const phi = pickPhi(r); let g, t, rel;
        do { g = { i: r.int(0, 1), p: r.pick(POS) }; t = { i: 1 - g.i, p: r.pick(POS) }; rel = relation(g, t); } while (!rel);
        const gv = posVal(g.p, phi), xv = posVal(t.p, phi); const R0 = REL[rel];
        return { html: `${r.pick(['In the diagram, the lines marked with arrows are parallel.', 'Two parallel lines are crossed by a transversal.', 'The diagram shows two parallel railway tracks crossed by a straight road.', 'A ladder leans across two parallel shelves, as shown.'])} One angle is ${B(gv + '°')}. Work out the size of angle ${B('<i>x</i>')}. Give a reason.`,
          diagram: parSvg(phi, [{ ...g, label: gv + '°' }, { ...t, label: 'x', hi: true }]), answerLabel: 'x =', unit: '°', ...nAns(xv, { unit: '°' }), hint: 'Is it a Z (alternate), F (corresponding) or C (co-interior) shape?',
          steps: [`Angle ${B('<i>x</i>')} and the ${gv}° angle are ${R0[2]}.`, `${R0[0]}.`, R0[1] ? `x = ${B(xv + '°')}` : `x = 180° − ${gv}° = ${B(xv + '°')}`] };
      }],
    ['Naming angle relationships',
      'To give a reason you must use the correct name. Alternate angles lie between the parallel lines on opposite sides of the transversal; corresponding angles are in matching positions at each line; co-interior angles lie between the lines on the same side.',
      (r) => {
        const phi = pickPhi(r); let g, t, rel;
        do { g = { i: r.int(0, 1), p: r.pick(POS) }; t = r.chance(0.75) ? { i: 1 - g.i, p: r.pick(POS) } : { i: g.i, p: r.pick(POS.filter((p) => p !== g.p)) }; rel = relation(g, t); } while (!rel);
        const gv = posVal(g.p, phi), bv = posVal(t.p, phi);
        const lab = { corr: `Corresponding angles, so b = ${bv}°`, alt: `Alternate angles, so b = ${bv}°`, coint: `Co-interior angles, so b = ${bv}°`, vert: `Vertically opposite angles, so b = ${bv}°`, line: `Angles on a straight line, so b = ${bv}°` };
        const wrongVal = rel === 'coint' || rel === 'line' ? gv : 180 - gv;
        const wrongs = { corr: [`Alternate angles, so b = ${bv}°`, `Co-interior angles, so b = ${wrongVal}°`, `Vertically opposite angles, so b = ${bv}°`], alt: [`Corresponding angles, so b = ${bv}°`, `Co-interior angles, so b = ${wrongVal}°`, `Vertically opposite angles, so b = ${bv}°`],
          coint: [`Alternate angles, so b = ${wrongVal}°`, `Corresponding angles, so b = ${wrongVal}°`, `Angles on a straight line, so b = ${bv}°`], vert: [`Corresponding angles, so b = ${bv}°`, `Alternate angles, so b = ${bv}°`, `Angles on a straight line, so b = ${wrongVal}°`], line: [`Co-interior angles, so b = ${bv}°`, `Vertically opposite angles, so b = ${wrongVal}°`, `Alternate angles, so b = ${wrongVal}°`] };
        return { html: `${r.pick(['The lines marked with arrows are parallel.', 'In the diagram, two parallel lines are cut by a transversal.', 'The diagram shows a pair of parallel lines and a transversal.'])} Angle ${B('a')} = ${B(gv + '°')}. Which statement correctly gives the size of angle ${B('b')} and the reason?`,
          diagram: parSvg(phi, [{ ...g, label: 'a' }, { ...t, label: 'b', hi: true }]), ...mcq(r, [lab[rel], ...wrongs[rel]], 0), hint: 'Are the angles between the parallel lines? On the same side of the transversal?',
          steps: [{ corr: 'The angles are in the same position at each parallel line (an F shape).', alt: 'Both angles are between the parallel lines, on opposite sides of the transversal (a Z shape).', coint: 'Both angles are between the parallel lines, on the same side of the transversal (a C shape).', vert: 'The angles are opposite each other where two lines cross.', line: 'The angles sit next to each other on a straight line.' }[rel], `${REL[rel][0]}, so b = ${bv}°.`, `Answer: ${B(lab[rel])}`] };
      }],
    ['Multi-step angle reasoning',
      'Harder problems need two or more facts in a chain. Find any angle you can, write down the reason, and keep going until you reach the one you want. Useful facts: angles on a line add to 180°, angles in a triangle add to 180°, and the parallel-line rules.',
      (r) => {
        const v = r.int(0, 2);
        if (v === 0) {
          const phi = pickPhi(r); let g, t;
          do { g = { i: r.int(0, 1), p: r.pick(POS) }; t = { i: 1 - g.i, p: r.pick(POS) }; } while (relation(g, t) || g.p === t.p);
          const gv = posVal(g.p, phi), xv = posVal(t.p, phi); const mid = { i: t.i, p: g.p }; const r2 = relation(mid, t);
          return { html: `${r.pick(['The lines marked with arrows are parallel.', 'Two parallel lines are crossed by a transversal.', 'The diagram shows two parallel fences and a straight path crossing them.'])} One angle is ${B(gv + '°')}. Work out angle ${B('<i>x</i>')}, giving a reason for each step.`,
            diagram: parSvg(phi, [{ ...g, label: gv + '°' }, { ...t, label: 'x', hi: true }, { ...mid, label: 'y' }]), answerLabel: 'x =', unit: '°', ...nAns(xv, { unit: '°' }), hint: 'Use angle y as a stepping stone.',
            steps: [`Angle y = ${gv}° (corresponding angles are equal).`, `${REL[r2][0]}.`, REL[r2][1] ? `x = y = ${B(xv + '°')}` : `x = 180° − ${gv}° = ${B(xv + '°')}`] };
        }
        if (v === 1) {
          let p, q; do { p = r.int(40, 80); q = r.int(40, 80); } while (p + q > 150 || p === q);
          const yT = 70, yB = 180, Hh = yB - yT; const cp = cosD(p) / sinD(p), cq = cosD(q) / sinD(q); const w = Hh * (cp + cq); const xA = 180 - w / 2 + Hh * cp;
          const A = [xA, yT], Bp = [xA - Hh * cp, yB], C = [xA + Hh * cq, yB]; const m = 180 - p - q;
          let body = sL(20, yT, 340, yT) + sL(20, yB, 340, yB) + sPoly([[302, yT - 6], [310, yT], [302, yT + 6]], { open: true, c: ACC }) + sPoly([[302, yB - 6], [310, yB], [302, yB + 6]], { open: true, c: ACC });
          body += sPoly([A, Bp, C]) + sT(A[0], A[1] - 14, 'A', { b: true }) + sT(Bp[0] - 4, Bp[1] + 16, 'B', { b: true }) + sT(C[0] + 4, C[1] + 16, 'C', { b: true });
          const ask = r.pick(['BAC', 'ACB', 'ABC']);
          const lbl = { left: '', mid: '', right: '', B: '', C: '' };
          let ans, steps, givenTxt;
          if (ask === 'BAC') { lbl.left = p + '°'; lbl.C = q + '°'; lbl.mid = 'x'; ans = m; givenTxt = `the angle between the top line and AB is ${p}° and angle ACB = ${q}°`;
            steps = [`The angle between the top line and AC (right of A) = ${q}° (alternate angles with angle ACB are equal).`, `Angles on a straight line add up to 180°: x = 180° − ${p}° − ${q}°`, `x = ${B(m + '°')}`]; }
          else if (ask === 'ACB') { lbl.left = p + '°'; lbl.mid = m + '°'; lbl.C = 'x'; ans = q; givenTxt = `the angle between the top line and AB is ${p}° and angle BAC = ${m}°`;
            steps = [`Angles on a straight line at A: the angle between AC and the top line (right of A) = 180° − ${p}° − ${m}° = ${q}°`, 'Alternate angles are equal, so angle ACB equals that angle.', `x = ${B(q + '°')}`]; }
          else { lbl.right = q + '°'; lbl.mid = m + '°'; lbl.B = 'x'; ans = p; givenTxt = `the angle between the top line and AC is ${q}° and angle BAC = ${m}°`;
            steps = [`Angles on a straight line at A: the angle between the top line and AB (left of A) = 180° − ${q}° − ${m}° = ${p}°`, 'Alternate angles are equal, so angle ABC equals that angle.', `x = ${B(p + '°')}`]; }
          const L = [A[0] - 50, yT], Rr = [A[0] + 50, yT]; const hiO = (k) => (lbl[k] === 'x' ? { c: ACC, tc: ACC } : {});
          if (lbl.left) body += angArc(A, L, Bp, 26, lbl.left, { lr: 16, w: 1.5, fs: 13, ...hiO('left') });
          if (lbl.right) body += angArc(A, C, Rr, 26, lbl.right, { lr: 16, w: 1.5, fs: 13, ...hiO('right') });
          if (lbl.mid) body += angArc(A, Bp, C, 20, lbl.mid, { lr: 15, w: 1.5, fs: 13, ...hiO('mid') });
          if (lbl.B) body += angArc(Bp, C, A, 26, lbl.B, { lr: 16, w: 1.5, fs: 13, ...hiO('B') });
          if (lbl.C) body += angArc(C, A, Bp, 26, lbl.C, { lr: 16, w: 1.5, fs: 13, ...hiO('C') });
          return { html: `In the diagram, A lies on the top line and B and C lie on the bottom line. The two lines are parallel. In the diagram ${givenTxt}. Work out angle ${B(ask)}, marked <i>x</i>, giving reasons.`, diagram: svgWrap(360, 225, body), answerLabel: 'x =', unit: '°', ...nAns(ans, { unit: '°' }), hint: 'Look for a Z shape between the parallel lines.', steps };
        }
        let a, b; do { a = r.int(25, 100); b = r.int(25, 100); } while (a + b > 160);
        const ext = a + b; const fwd = r.chance(0.6);
        const PR = sinD(a + b) / sinD(b); const MP = [[0, 0], [1, 0], [PR * cosD(a), PR * sinD(a)], [1.55, 0]]; const Tf = mkFit(MP, 360, 225, 36, 40).T;
        const [Ap, Bp, Cp, D] = MP.map(Tf);
        let body = sPoly([Ap, Bp, Cp]) + sL(Bp[0], Bp[1], D[0], D[1]) + sT(Ap[0] - 8, Ap[1] + 14, 'P', { b: true }) + sT(Bp[0], Bp[1] + 16, 'Q', { b: true }) + sT(Cp[0], Cp[1] - 14, 'R', { b: true }) + sT(D[0], D[1] + 16, 'S', { b: true });
        body += angArc(Ap, Bp, Cp, 26, fwd ? a + '°' : a + '°', { lr: 16, w: 1.5, fs: 13 }) + angArc(Cp, Ap, Bp, 22, fwd ? b + '°' : 'x', { lr: 16, w: 1.5, fs: 13, ...(fwd ? {} : { c: ACC, tc: ACC }) }) + angArc(Bp, D, Cp, 26, fwd ? 'x' : ext + '°', { lr: 16, w: 1.5, fs: 13, ...(fwd ? { c: ACC, tc: ACC } : {}) });
        const ans = fwd ? ext : b;
        return { html: fwd ? `PQR is a triangle and PQS is a straight line. Angle QPR = ${B(a + '°')} and angle PRQ = ${B(b + '°')}. Work out the exterior angle RQS, marked <i>x</i>, giving reasons.` : `PQR is a triangle and PQS is a straight line. Angle QPR = ${B(a + '°')} and the exterior angle RQS = ${B(ext + '°')}. Work out angle PRQ, marked <i>x</i>, giving reasons.`,
          diagram: svgWrap(360, 225, body), answerLabel: 'x =', unit: '°', ...nAns(ans, { unit: '°' }), hint: 'Find angle PQR first.',
          steps: fwd ? [`Angles in a triangle add up to 180°: angle PQR = 180° − ${a}° − ${b}° = ${180 - a - b}°`, `Angles on a straight line add up to 180°: x = 180° − ${180 - a - b}°`, `x = ${B(ext + '°')} (the exterior angle equals the sum of the two opposite interior angles)`]
            : [`Angles on a straight line add up to 180°: angle PQR = 180° − ${ext}° = ${180 - ext}°`, `Angles in a triangle add up to 180°: x = 180° − ${a}° − ${180 - ext}°`, `x = ${B(b + '°')}`] };
      }],
    ['Forming & solving angle equations',
      'Write the angle fact as an equation, for example angles on a straight line: (2x + 10) + (3x − 5) = 180. Collect like terms, solve for x, then substitute back if you need the size of an angle.',
      (r) => {
        const v = r.pick(['line', 'point', 'vert', 'tri', 'alt', 'coint', 'quad']); const askAngle = r.chance(0.35);
        let x, a, b, c, d, html, diagram = null, eq, s1, angA;
        const ctx = (t) => `${t} Work out ${askAngle ? 'the size of the angle labelled ' + B('A') : 'the value of ' + B('<i>x</i>')}.`;
        if (v === 'line' || v === 'coint') {
          let A1, A2; do { x = r.int(5, 35); a = r.int(1, 5); c = r.int(1, 5); b = r.int(-30, 40); A1 = a * x + b; d = 180 - c * x - A1; A2 = c * x + d; } while (A1 < 20 || A2 < 20 || (v === 'coint' && (A1 < 40 || A1 > 140 || Math.abs(A1 - 90) < 8)) || d < -30 || d > 60 || a === c && b === d);
          angA = A1;
          if (v === 'line') { html = ctx(`The angles ${B((askAngle ? 'A = ' : '') + '(' + exH(a, b) + ')°')} and ${B('(' + exH(c, d) + ')°')} lie on a straight line.`); diagram = lineAnglesSvg([{ deg: A1, label: `${askAngle ? 'A = ' : ''}(${exS(a, b)})°`, hi: askAngle }, { deg: A2, label: `(${exS(c, d)})°` }], false); s1 = 'Angles on a straight line add up to 180°'; }
          else { const phi = 180 - A1; html = ctx(`Two parallel lines are crossed by a transversal. The co-interior angles are ${B((askAngle ? 'A = ' : '') + '(' + exH(a, b) + ')°')} and ${B('(' + exH(c, d) + ')°')}.`); diagram = parSvg(phi, [{ i: 0, p: 'DR', label: `${askAngle ? 'A = ' : ''}(${exS(a, b)})°`, hi: askAngle, long: true }, { i: 1, p: 'UR', label: `(${exS(c, d)})°`, long: true }]); s1 = 'Co-interior angles add up to 180°'; }
          eq = `${exH(a, b)} + ${exH(c, d)} = 180`;
          const sumA = a + c, sumB = b + d;
          const steps = [`${s1}: ${eq}`, `${sumA}<i>x</i>${sumB ? (sumB > 0 ? ' + ' + sumB : ' − ' + -sumB) : ''} = 180`, `${sumA}<i>x</i> = ${180 - sumB}, so <i>x</i> = ${askAngle ? x : B(x)}`];
          if (askAngle) steps.push(`A = ${a === 1 ? '' : a + ' × '}${x}${b ? (b > 0 ? ' + ' + b : ' − ' + -b) : ''} = ${B(angA + '°')}`);
          return { html, diagram, answerLabel: askAngle ? 'A =' : 'x =', unit: askAngle ? '°' : '', ...nAns(askAngle ? angA : x, askAngle ? { unit: '°' } : {}), hint: 'Add the expressions and set them equal to 180.', steps };
        }
        if (v === 'point') {
          let A1, A2, A3; do { x = r.int(10, 40); a = r.int(1, 4); c = r.int(1, 4); b = r.int(-20, 40); d = r.int(-20, 40); A1 = a * x + b; A2 = c * x + d; A3 = 360 - A1 - A2; } while (A1 < 70 || A2 < 70 || A3 < 70 || A3 > 175 || A1 > 160 || A2 > 160);
          // third angle written as kx with k integer if possible, else constant
          const k3 = A3 % x === 0 && A3 / x <= 9 ? A3 / x : 0;
          const lab3 = k3 ? `${k3 === 1 ? '' : k3}<i>x</i>` : `${A3}`; angA = A1;
          html = ctx(`Three angles meet at a point: ${B((askAngle ? 'A = ' : '') + '(' + exH(a, b) + ')°')}, ${B('(' + exH(c, d) + ')°')} and ${B(lab3 + '°')}.`);
          diagram = lineAnglesSvg([{ deg: A1, label: `${askAngle ? 'A = ' : ''}(${exS(a, b)})°`, hi: askAngle }, { deg: A2, label: `(${exS(c, d)})°` }, { deg: A3, label: k3 ? `${k3 === 1 ? '' : k3}<tspan font-style="italic">x</tspan>°` : A3 + '°' }], true);
          const sx = a + c + k3, sb = b + d + (k3 ? 0 : A3);
          const steps = [`Angles around a point add up to 360°: ${exH(a, b)} + ${exH(c, d)} + ${lab3} = 360`, `${sx}<i>x</i>${sb ? (sb > 0 ? ' + ' + sb : ' − ' + -sb) : ''} = 360`, `${sx}<i>x</i> = ${360 - sb}, so <i>x</i> = ${askAngle ? x : B(x)}`];
          if (askAngle) steps.push(`A = ${a === 1 ? '' : a + ' × '}${x}${b ? (b > 0 ? ' + ' + b : ' − ' + -b) : ''} = ${B(angA + '°')}`);
          return { html, diagram, answerLabel: askAngle ? 'A =' : 'x =', unit: askAngle ? '°' : '', ...nAns(askAngle ? angA : x, askAngle ? { unit: '°' } : {}), hint: 'The three angles add up to 360°.', steps };
        }
        if (v === 'vert' || v === 'alt') {
          let A1; do { x = r.int(4, 30); a = r.int(2, 7); c = r.int(1, 6); b = r.int(-25, 30); A1 = a * x + b; d = A1 - c * x; } while (a === c || A1 < 40 || A1 > 140 || Math.abs(A1 - 90) < 8 || d < -40 || d > 80);
          angA = A1;
          if (v === 'vert') { html = ctx(`Two straight lines cross. Vertically opposite angles are ${B((askAngle ? 'A = ' : '') + '(' + exH(a, b) + ')°')} and ${B('(' + exH(c, d) + ')°')}.`); diagram = crossSvg(A1, `${askAngle ? 'A = ' : ''}(${exS(a, b)})°`, `(${exS(c, d)})°`, askAngle); s1 = 'Vertically opposite angles are equal'; }
          else { const phi = A1; html = ctx(`Two parallel lines are crossed by a transversal. The alternate angles are ${B((askAngle ? 'A = ' : '') + '(' + exH(a, b) + ')°')} and ${B('(' + exH(c, d) + ')°')}.`); diagram = parSvg(phi, [{ i: 0, p: 'DL', label: `${askAngle ? 'A = ' : ''}(${exS(a, b)})°`, hi: askAngle, long: true }, { i: 1, p: 'UR', label: `(${exS(c, d)})°`, long: true }]); s1 = 'Alternate angles are equal'; }
          const big = a > c; const [pa, pb, qa, qb] = big ? [a, b, c, d] : [c, d, a, b];
          const steps = [`${s1}: ${exH(a, b)} = ${exH(c, d)}`, `Subtract ${qa === 1 ? '' : qa}<i>x</i> from both sides: ${pa - qa === 1 ? '' : pa - qa}<i>x</i>${pb ? (pb > 0 ? ' + ' + pb : ' − ' + -pb) : ''} = ${ds(qb)}`, `${pa - qa === 1 ? '' : pa - qa}<i>x</i> = ${ds(qb - pb)}, so <i>x</i> = ${askAngle ? x : B(x)}`];
          if (askAngle) steps.push(`A = ${a} × ${x}${b ? (b > 0 ? ' + ' + b : ' − ' + -b) : ''} = ${B(angA + '°')}`);
          return { html, diagram, answerLabel: askAngle ? 'A =' : 'x =', unit: askAngle ? '°' : '', ...nAns(askAngle ? angA : x, askAngle ? { unit: '°' } : {}), hint: 'The two angles are equal, so set the expressions equal.', steps };
        }
        if (v === 'tri') {
          let k1, k2, c2; do { x = r.int(8, 40); k1 = r.int(2, 4); k2 = r.int(1, 4); c2 = 180 - (1 + k1 + k2) * x; } while (c2 === 0 || c2 < -30 || c2 > 60 || k2 * x + c2 < 25 || x < 22);
          angA = k2 * x + c2; const labs = ['<i>x</i>', `${k1}<i>x</i>`, exH(k2, c2)];
          const steps = [`Angles in a triangle add up to 180°: ${labs.join(' + ')} = 180`, `${1 + k1 + k2}<i>x</i>${c2 > 0 ? ' + ' + c2 : ' − ' + -c2} = 180`, `${1 + k1 + k2}<i>x</i> = ${180 - c2}, so <i>x</i> = ${askAngle ? x : B(x)}`];
          if (askAngle) steps.push(`A = ${k2 === 1 ? '' : k2 + ' × '}${x}${c2 > 0 ? ' + ' + c2 : ' − ' + -c2} = ${B(angA + '°')}`);
          const tA = [x, k1 * x, angA]; const P = mkFit([[0, 0], [1, 0], [sinD(tA[1]) / sinD(tA[2]) * cosD(tA[0]), sinD(tA[1]) / sinD(tA[2]) * sinD(tA[0])]], 360, 225, 40, 40).T;
          const Pp = [[0, 0], [1, 0], [sinD(tA[1]) / sinD(tA[2]) * cosD(tA[0]), sinD(tA[1]) / sinD(tA[2]) * sinD(tA[0])]].map(P);
          const tl = ['<tspan font-style="italic">x</tspan>°', `${k1}<tspan font-style="italic">x</tspan>°`, askAngle ? 'A' : `(${exS(k2, c2)})°`];
          let body = sPoly(Pp); [[0, 1, 2], [1, 2, 0], [2, 0, 1]].forEach(([i, j, k], n) => { body += angArc(Pp[i], Pp[j], Pp[k], 24, tl[n], { lr: 22, w: 1.5, fs: 12, ...(n === 2 && askAngle ? { c: ACC, tc: ACC } : {}) }); });
          return { html: ctx(`The angles of a triangle are ${B('<i>x</i>°')}, ${B(k1 + '<i>x</i>°')} and ${B((askAngle ? 'A = ' : '') + '(' + exH(k2, c2) + ')°')}.`), diagram: svgWrap(360, 225, body), answerLabel: askAngle ? 'A =' : 'x =', unit: askAngle ? '°' : '', ...nAns(askAngle ? angA : x, askAngle ? { unit: '°' } : {}), hint: 'The three angles add up to 180°.', steps };
        }
        // quadrilateral
        let k1, k2, k3, cc, Q4; do { x = r.int(10, 35); k1 = r.int(1, 4); k2 = r.int(1, 4); k3 = r.int(2, 5); cc = r.int(-30, 40); Q4 = 360 - (k1 + k2 + k3) * x - cc; } while (Q4 < 40 || Q4 > 170 || k1 === k2 || x * k1 < 30 || x * k3 + cc < 30 || x * k3 + cc > 170 || cc === 0);
        const lab = [`${k1 === 1 ? '' : k1}<i>x</i>`, `${k2 === 1 ? '' : k2}<i>x</i>`, exH(k3, cc), `${Q4}`]; const k3l = askAngle ? 'A = ' : ''; angA = k3 * x + cc;
        const sx = k1 + k2 + k3, sb = cc + Q4;
        const steps = [`Angles in a quadrilateral add up to 360°: ${lab.join(' + ')} = 360`, `${sx}<i>x</i> + ${sb} = 360`, `${sx}<i>x</i> = ${360 - sb}, so <i>x</i> = ${askAngle ? x : B(x)}`];
        if (askAngle) steps.push(`A = ${k3} × ${x}${cc > 0 ? ' + ' + cc : ' − ' + -cc} = ${B(angA + '°')}`);
        return { html: ctx(`${r.pick(['A quadrilateral has angles', 'The four angles of a quadrilateral are', 'A four-sided field has corner angles'])} ${lab.map((l, i) => B((i === 2 ? k3l + '(' + l + ')' : l) + '°')).join(', ')}.`), answerLabel: askAngle ? 'A =' : 'x =', unit: askAngle ? '°' : '', ...nAns(askAngle ? angA : x, askAngle ? { unit: '°' } : {}), hint: 'The four angles add up to 360°.', steps };
      }],
    ['Quadrilaterals, polygons & conjectures',
      'Learn the properties: a parallelogram has opposite angles equal and neighbouring angles adding to 180°; a kite has one pair of equal opposite angles; the interior angles of an n-sided polygon add up to (n − 2) × 180°. A single counterexample is enough to disprove a conjecture.',
      (r) => {
        const v = r.int(0, 5);
        if (v === 0) {
          let a; do { a = r.int(35, 145); } while (a > 84 && a < 96); const opp = r.chance();
          return { html: `${r.pick(['ABCD is a parallelogram.', 'A tile is in the shape of a parallelogram ABCD.', 'The diagram on a garden plan shows a parallelogram ABCD.'])} Angle DAB = ${B(a + '°')}. Work out angle ${B(opp ? 'BCD' : 'ABC')}.`, unit: '°', ...nAns(opp ? a : 180 - a, { unit: '°' }), hint: opp ? 'Opposite angles of a parallelogram are equal.' : 'AD is parallel to BC, so these are co-interior angles.',
            steps: opp ? ['Angles DAB and BCD are opposite angles of the parallelogram.', `Opposite angles of a parallelogram are equal, so angle BCD = ${B(a + '°')}`] : ['AD is parallel to BC, so angles DAB and ABC are co-interior.', `Co-interior angles add up to 180°: angle ABC = 180° − ${a}° = ${B(180 - a + '°')}`] };
        }
        if (v === 1) {
          let A, Bd, C; do { A = r.int(40, 150); Bd = r.int(50, 130); C = 360 - A - 2 * Bd; } while (C < 30 || C > 170 || C === A);
          return { html: `ABCD is a kite with AB = AD and CB = CD. Angle BAD = ${B(A + '°')} and angle ABC = ${B(Bd + '°')}. Work out angle ${B('BCD')}.`, unit: '°', ...nAns(C, { unit: '°' }), hint: 'In a kite, the angles between the unequal sides are equal.',
            steps: [`The kite is symmetrical about AC, so angle ADC = angle ABC = ${Bd}°.`, `Angles in a quadrilateral add up to 360°: angle BCD = 360° − ${A}° − ${Bd}° − ${Bd}°`, `Angle BCD = ${B(C + '°')}`] };
        }
        if (v === 2) {
          const b = r.int(40, 85);
          return { html: `ABCD is an isosceles trapezium with AB parallel to DC and AD = BC. Angle DAB = ${B(b + '°')}. Work out angle ${B('ADC')}.`, unit: '°', ...nAns(180 - b, { unit: '°' }), hint: 'AB is parallel to DC — look for co-interior angles.',
            steps: ['AB is parallel to DC, so angles DAB and ADC are co-interior.', `Co-interior angles add up to 180°: angle ADC = 180° − ${b}° = ${B(180 - b + '°')}`] };
        }
        if (v === 3) {
          const n = r.int(5, 8); const S = (n - 2) * 180; let ks, last; do { ks = Array.from({ length: n - 1 }, () => r.int(90, 170)); last = S - ks.reduce((p, q) => p + q, 0); } while (last < 60 || last > 175);
          const nm = { 5: 'pentagon', 6: 'hexagon', 7: 'heptagon', 8: 'octagon' }[n];
          return { html: `An irregular ${nm} has angles ${ks.map((k) => k + '°').join(', ')} and ${B('<i>x</i>')}. Work out <i>x</i>.`, answerLabel: 'x =', unit: '°', ...nAns(last, { unit: '°' }), hint: 'Sum of interior angles = (n − 2) × 180°.',
            steps: [`A ${nm} has ${n} sides, so its angles add up to (${n} − 2) × 180° = ${S}°.`, `The known angles add up to ${ks.reduce((p, q) => p + q, 0)}°.`, `x = ${S}° − ${ks.reduce((p, q) => p + q, 0)}° = ${B(last + '°')}`] };
        }
        if (v === 4) {
          const BANK = [
            ['The angles in a triangle add up to 180°.', 0, 'This is true for every triangle.'], ['A triangle has two obtuse angles.', 2, 'Two obtuse angles already add up to more than 180°.'],
            ['A quadrilateral has a right angle.', 1, 'A rectangle does, but a rhombus with angles 60° and 120° does not.'], ['Co-interior angles are equal.', 1, 'They add to 180°, so they are only equal when both are 90°.'],
            ['Alternate angles on parallel lines are equal.', 0, 'This is the alternate angles rule.'], ['A rhombus is a square.', 1, 'A rhombus with 90° angles is a square; other rhombuses are not.'],
            ['A square is a rectangle.', 0, 'A square has four right angles and opposite sides equal, so it fits the definition of a rectangle.'], ['The angles in a quadrilateral add up to 360°.', 0, 'Any quadrilateral splits into two triangles: 2 × 180° = 360°.'],
            ['An isosceles triangle is also equilateral.', 1, 'It is only equilateral if the third side matches the other two.'], ['A kite has a pair of parallel sides.', 2, 'A kite has no parallel sides.'],
            ['The exterior angles of a polygon add up to 180°.', 2, 'They always add up to 360°.'], ['Vertically opposite angles are equal.', 0, 'This is true whenever two straight lines cross.'],
            ['A trapezium has a right angle.', 1, 'A right-angled trapezium does; an isosceles trapezium does not.'], ['A triangle has a reflex angle.', 2, 'A reflex angle is more than 180°, which is more than all three angles together.'],
            ['A parallelogram has a line of symmetry.', 1, 'Rectangles and rhombuses do; a general parallelogram does not.'], ['An equilateral triangle has angles of 60°.', 0, 'Three equal angles adding to 180° must each be 60°.'],
            ['A quadrilateral has exactly three right angles.', 2, 'Three right angles make 270°, so the fourth would be 90° too.'], ['The diagonals of a rectangle are equal in length.', 0, 'This is a property of every rectangle.'],
            ['The angle sum of a polygon is a multiple of 180°.', 0, '(n − 2) × 180° is always a multiple of 180°.'], ['A regular polygon has an interior angle of 100°.', 2, 'The exterior angle would be 80°, and 360 ÷ 80 = 4.5 is not a whole number of sides.'],
            ['Corresponding angles are acute.', 1, 'They can be acute or obtuse (or both 90°).'], ['A triangle with two equal angles is isosceles.', 0, 'Equal base angles always mean equal sides opposite them.'],
          ];
          const [st, k, why] = r.pick(BANK); const O = ['Always true', 'Sometimes true', 'Never true'];
          return { html: `${r.pick(['Is this statement always, sometimes or never true?', 'Decide whether the conjecture is always, sometimes or never true:', 'A pupil makes this conjecture. Is it always, sometimes or never true?'])}<br>${B(st)}`, ...mcq(r, O, k), hint: 'Try to find one example where it works and one where it does not.',
            steps: [why, `So the statement is ${B(O[k].toLowerCase())}.`] };
        }
        const CE = [
          ['All quadrilaterals with four equal sides are squares.', 'a rhombus with angles of 70° and 110°', ['a square of side 5 cm', 'a rectangle 4 cm by 6 cm', 'a kite with two pairs of equal sides'], 'A rhombus has four equal sides but its angles are not 90°.'],
          ['Every quadrilateral with a pair of parallel sides is a parallelogram.', 'a trapezium with only one pair of parallel sides', ['a rectangle', 'a square', 'a rhombus'], 'A trapezium has parallel sides but is not a parallelogram.'],
          ['If two triangles have the same three angles, they are congruent.', 'two equilateral triangles with sides 3 cm and 6 cm', ['two identical right-angled triangles', 'a triangle and its reflection', 'a triangle and its rotation'], 'Equal angles but different sizes — similar, not congruent.'],
          ['The angle sum of a shape with more sides is always 360°.', 'a pentagon, whose angles add up to 540°', ['a square, whose angles add up to 360°', 'a kite, whose angles add up to 360°', 'a rectangle, whose angles add up to 360°'], 'A pentagon has an angle sum of 540°, not 360°.'],
          ['Any angle in a triangle is less than 90°.', 'a triangle with angles 100°, 50° and 30°', ['a triangle with angles 60°, 60° and 60°', 'a triangle with angles 70°, 70° and 40°', 'a triangle with angles 80°, 50° and 50°'], 'An obtuse-angled triangle has an angle over 90°.'],
          ['Two angles that add up to 180° must be co-interior angles.', 'two angles that sit next to each other on a straight line', ['two co-interior angles between parallel lines', 'two angles of 90° in a C shape between parallel lines', 'the two angles inside a C shape between parallel lines'], 'Angles on a straight line also add to 180° but are not co-interior.'],
          ['A shape with all its angles equal must be regular.', 'a rectangle 3 cm by 8 cm', ['a square', 'an equilateral triangle', 'a regular hexagon'], 'A rectangle has equal angles but its sides are not all equal.'],
          ['The diagonals of every quadrilateral cross at right angles.', 'a rectangle 2 cm by 9 cm', ['a square', 'a rhombus', 'a kite'], 'The diagonals of a non-square rectangle do not meet at 90°.'],
        ];
        const [claim, good, bads, why] = r.pick(CE); const who = r.pick(['Sam', 'Aisha', 'Tom', 'Mei', 'Jordan']);
        return { html: `${who} says: “${claim}” Which example is a counterexample that proves ${who} wrong?`, ...mcq(r, [good, ...bads], 0), hint: 'A counterexample fits the starting condition but breaks the conclusion.',
          steps: ['A counterexample must meet the condition in the statement but not the conclusion.', why, `Counterexample: ${B(good)}`] };
      }],
  ]);

  // ======================================================================
  // SCHOOL-SHEET AUDIT ADDITIONS (appended styles — keep after the topic() calls above)
  // ======================================================================
  const LET = 'ABCDEFGH';
  const pickN = (r, arr, n, not) => r.sample(arr.filter((x) => x !== not), n);
  // ---- simple pictures of named shapes (screen coordinates) ----
  function oblSvg(F, dx, dy) {
    const Bk = F.map(([x, y]) => [x + dx, y + dy]);
    return sPoly(Bk, { dash: true, w: 1 }) + F.map((p, i) => sL(p[0], p[1], Bk[i][0], Bk[i][1])).join('') + sPoly(F, { fill: ACC, fop: 0.08 });
  }
  const regPts = (n, cx, cy, R, rot = 90) => Array.from({ length: n }, (_, i) => [cx + R * cosD(rot + (360 / n) * i), cy - R * sinD(rot + (360 / n) * i)]);
  const SHAPE_PIC = {
    circle: () => sC(180, 105, 70, { fill: ACC }) .replace('fill="#3b6cf6"', 'fill="#3b6cf6" fill-opacity="0.08"'),
    square: () => sPoly([[120, 45], [240, 45], [240, 165], [120, 165]], { fill: ACC, fop: 0.08 }),
    rectangle: () => sPoly([[80, 60], [280, 60], [280, 160], [80, 160]], { fill: ACC, fop: 0.08 }),
    triangle: () => sPoly([[90, 170], [270, 170], [150, 45]], { fill: ACC, fop: 0.08 }),
    rhombus: () => sPoly([[80, 165], [200, 165], [270, 65], [150, 65]], { fill: ACC, fop: 0.08 }),
    trapezium: () => sPoly([[60, 165], [300, 165], [240, 65], [120, 65]], { fill: ACC, fop: 0.08 }),
    parallelogram: () => sPoly([[60, 165], [240, 165], [300, 65], [120, 65]], { fill: ACC, fop: 0.08 }),
    kite: () => sPoly([[180, 30], [240, 85], [180, 185], [120, 85]], { fill: ACC, fop: 0.08 }),
    pentagon: () => sPoly(regPts(5, 180, 110, 75), { fill: ACC, fop: 0.08 }),
    hexagon: () => sPoly(regPts(6, 180, 105, 75, 0), { fill: ACC, fop: 0.08 }),
    octagon: () => sPoly(regPts(8, 180, 105, 75, 22.5), { fill: ACC, fop: 0.08 }),
    cube: () => oblSvg([[120, 85], [215, 85], [215, 180], [120, 180]], 50, -40),
    cuboid: () => oblSvg([[80, 105], [245, 105], [245, 180], [80, 180]], 55, -40),
    'triangular prism': () => oblSvg([[80, 180], [180, 180], [130, 95]], 100, -45),
    'hexagonal prism': () => oblSvg(regPts(6, 130, 125, 50, 0), 100, -35),
    cylinder: () => sE(180, 50, 70, 20, { fill: ACC }).replace('fill="#3b6cf6"', 'fill="#3b6cf6" fill-opacity="0.08"') + sL(110, 50, 110, 170) + sL(250, 50, 250, 170) + sP('M110,170 A70,20 0 0 0 250,170') + sP('M110,170 A70,20 0 0 1 250,170', { dash: true, w: 1 }),
    cone: () => sL(180, 30, 105, 170) + sL(180, 30, 255, 170) + sP('M105,170 A75,22 0 0 0 255,170') + sP('M105,170 A75,22 0 0 1 255,170', { dash: true, w: 1 }),
    sphere: () => sC(180, 105, 75) + sP('M105,105 A75,20 0 0 0 255,105') + sP('M105,105 A75,20 0 0 1 255,105', { dash: true, w: 1 }),
    'square-based pyramid': () => sL(100, 170, 220, 170) + sL(220, 170, 270, 135) + sP('M100,170 L150,135 L270,135', { dash: true, w: 1 }) + sL(185, 40, 100, 170) + sL(185, 40, 220, 170) + sL(185, 40, 270, 135) + sL(185, 40, 150, 135, { dash: true, w: 1 }),
    tetrahedron: () => sL(100, 170, 250, 170) + sL(250, 170, 200, 130) + sL(100, 170, 200, 130, { dash: true, w: 1 }) + sL(170, 40, 100, 170) + sL(170, 40, 250, 170) + sL(170, 40, 200, 130),
  };
  const CONF = {
    circle: ['sphere', 'semicircle', 'cylinder'], square: ['rhombus', 'rectangle', 'cube'], rectangle: ['parallelogram', 'square', 'cuboid'], triangle: ['tetrahedron', 'triangular prism', 'kite'],
    rhombus: ['kite', 'parallelogram', 'square'], trapezium: ['parallelogram', 'kite', 'rhombus'], parallelogram: ['rhombus', 'trapezium', 'rectangle'], kite: ['rhombus', 'trapezium', 'parallelogram'],
    pentagon: ['hexagon', 'octagon', 'heptagon'], hexagon: ['pentagon', 'octagon', 'hexagonal prism'], octagon: ['hexagon', 'decagon', 'pentagon'],
    cube: ['cuboid', 'square', 'square-based pyramid'], cuboid: ['cube', 'rectangle', 'triangular prism'], 'triangular prism': ['tetrahedron', 'square-based pyramid', 'cuboid'], 'hexagonal prism': ['hexagon', 'pentagonal prism', 'hexagonal-based pyramid'],
    cylinder: ['cone', 'circle', 'sphere'], cone: ['cylinder', 'square-based pyramid', 'triangle'], sphere: ['circle', 'hemisphere', 'cylinder'], 'square-based pyramid': ['tetrahedron', 'triangular prism', 'cone'], tetrahedron: ['square-based pyramid', 'triangular prism', 'triangle'],
  };
  const IS3D = (n) => ['cube', 'cuboid', 'triangular prism', 'hexagonal prism', 'cylinder', 'cone', 'sphere', 'square-based pyramid', 'tetrahedron'].includes(n);
  function cuboidNetSvg(l, w, h, o = {}) {
    const R = [rect(0, w, w, h), rect(w, w, l, h), rect(w + l, w, w, h), rect(2 * w + l, w, l, h), rect(w, w + h, l, w), rect(w, 0, l, w)];
    const W0 = 2 * (l + w), H0 = h + 2 * w; const { T } = mkFit([[0, 0], [W0, H0]], 360, 250, 44, 30);
    let body = '';
    if (o.grid) { for (let x = 0; x <= W0; x++) { const a = T([x, 0]), b = T([x, H0]); body += sL(a[0], a[1], b[0], b[1], { w: 1, op: 0.15 }); } for (let y = 0; y <= H0; y++) { const a = T([0, y]), b = T([W0, y]); body += sL(a[0], a[1], b[0], b[1], { w: 1, op: 0.15 }); } }
    R.forEach((q, i) => { body += sPoly(q.map(T), { fill: ACC, fop: o.hiFace === i ? 0.25 : 0.07 }); if (o.letters) { const c = T([q[0][0] + (q[1][0] - q[0][0]) / 2, q[0][1] + (q[2][1] - q[0][1]) / 2]); body += sT(c[0], c[1], o.letters[i], { b: true }); } });
    if (o.labels) {
      const lab = (k) => (o.unknown === k ? '?' : `${{ l, w, h }[k]} cm`);
      let a = T([w, H0]), b = T([w + l, H0]); body += sT((a[0] + b[0]) / 2, a[1] - 10, lab('l'), { fs: 12, c: o.unknown === 'l' ? ACC : undefined });
      a = T([w + l, w + h]); b = T([w + l, H0]); body += sT(a[0] + 6, (a[1] + b[1]) / 2, lab('w'), { fs: 12, a: 'start', c: o.unknown === 'w' ? ACC : undefined });
      a = T([0, w]); b = T([0, w + h]); body += sT(a[0] - 5, (a[1] + b[1]) / 2, lab('h'), { fs: 12, a: 'end', c: o.unknown === 'h' ? ACC : undefined });
    }
    return svgWrap(360, 250, body, false);
  }

  addStyles('y9-3d-shapes', [
    ['Naming 2D & 3D shapes',
      'A 2D shape is flat and has only length and width; a 3D shape (a solid) also has height. Name 2D shapes from their sides, angles and parallel lines, and 3D shapes from the shapes of their faces and whether they have curved surfaces.',
      (r) => {
        if (r.chance(0.45)) {
          const name = r.pick(Object.keys(SHAPE_PIC)); const d3 = IS3D(name);
          return { html: `${r.pick(['What is the name of this shape?', 'Name the shape shown in the diagram.', 'Here is a sketch of a shape. What is it called?', 'A pupil sketches this shape. Which name is correct?', 'Which word describes the shape in the diagram?'])}`, diagram: svgWrap(360, 210, SHAPE_PIC[name](), false), ...mcq(r, [name, ...CONF[name]], 0), hint: d3 ? 'Look at the shapes of the faces and whether any surface is curved.' : 'Count the sides and look for equal sides, right angles and parallel sides.',
            steps: [d3 ? 'It is a 3D solid (dashed lines show hidden edges).' : 'It is a flat 2D shape.', { circle: 'One curved edge; every point is the same distance from the centre.', square: '4 equal sides and 4 right angles.', rectangle: '4 right angles with opposite sides equal (not all four equal).', triangle: '3 straight sides.', rhombus: '4 equal sides, opposite sides parallel, no right angles.', trapezium: 'Exactly one pair of parallel sides.', parallelogram: 'Two pairs of parallel sides, no right angles, neighbouring sides different.', kite: 'Two pairs of equal neighbouring sides and no parallel sides.', pentagon: '5 straight sides.', hexagon: '6 straight sides.', octagon: '8 straight sides.', cube: '6 identical square faces.', cuboid: '6 rectangular faces.', 'triangular prism': 'Two triangular ends joined by rectangles.', 'hexagonal prism': 'Two hexagonal ends joined by rectangles.', cylinder: 'Two circular ends and a curved surface.', cone: 'A circular base and a curved surface rising to a point.', sphere: 'One curved surface, like a ball.', 'square-based pyramid': 'A square base with four triangles meeting at a point.', tetrahedron: 'Four triangular faces.' }[name], `It is ${an(name).replace(name, B(name))}.`] };
        }
        const BANK = [
          ['a solid with one curved surface, one flat circular face and one vertex (a point)', 'cone', ['cylinder', 'sphere', 'square-based pyramid']],
          ['a solid with two flat circular faces joined by one curved surface', 'cylinder', ['cone', 'sphere', 'hemisphere']],
          ['a solid with one curved surface and no edges or vertices', 'sphere', ['cylinder', 'circle', 'hemisphere']],
          ['a solid with six identical square faces', 'cube', ['cuboid', 'square-based pyramid', 'hexagonal prism']],
          ['a solid with six rectangular faces that are not all squares', 'cuboid', ['cube', 'hexagonal prism', 'triangular prism']],
          ['a solid with two triangular faces and three rectangular faces', 'triangular prism', ['tetrahedron', 'square-based pyramid', 'cuboid']],
          ['a solid with four triangular faces', 'tetrahedron', ['triangular prism', 'square-based pyramid', 'octahedron']],
          ['a solid with one square face and four triangular faces', 'square-based pyramid', ['tetrahedron', 'triangular prism', 'cube']],
          ['a solid with two hexagonal faces and six rectangular faces', 'hexagonal prism', ['hexagonal-based pyramid', 'hexagon', 'octagonal prism']],
          ['a flat shape with four equal sides and four right angles', 'square', ['rhombus', 'rectangle', 'cube']],
          ['a flat shape with four right angles whose opposite sides are equal but whose four sides are not all equal', 'rectangle', ['square', 'parallelogram', 'cuboid']],
          ['a flat shape with four equal sides but no right angles', 'rhombus', ['square', 'kite', 'trapezium']],
          ['a flat four-sided shape with exactly one pair of parallel sides', 'trapezium', ['parallelogram', 'kite', 'rhombus']],
          ['a flat four-sided shape with two pairs of parallel sides, no right angles and neighbouring sides of different lengths', 'parallelogram', ['rhombus', 'rectangle', 'trapezium']],
          ['a flat four-sided shape with two pairs of equal neighbouring sides and no parallel sides', 'kite', ['rhombus', 'parallelogram', 'trapezium']],
          ['a flat shape with five straight sides', 'pentagon', ['hexagon', 'octagon', 'pentagonal prism']],
          ['a flat shape with six straight sides', 'hexagon', ['pentagon', 'octagon', 'hexagonal prism']],
          ['a flat shape with eight straight sides', 'octagon', ['hexagon', 'decagon', 'pentagon']],
          ['a flat shape with one curved edge where every point is the same distance from the centre', 'circle', ['sphere', 'oval', 'semicircle']],
        ];
        const [desc, name, wr] = r.pick(BANK);
        return { html: `${r.pick(['Which shape is', 'What is the name of', 'Give the name of'])} ${desc}?`, ...mcq(r, [name, ...wr], 0), hint: 'Picture the shape. Is it flat (2D) or solid (3D)?',
          steps: [desc.startsWith('a solid') ? 'It is a 3D solid.' : 'It is a flat 2D shape.', `The description matches ${an(name).replace(name, B(name))}.`] };
      }],
    ['Nets of cuboids',
      'A cuboid has three pairs of identical rectangular faces, so its net has six rectangles. Drawn on centimetre squared paper, the area of the net is the surface area of the cuboid. When folded, faces that are separated by one face in the strip of four end up opposite each other.',
      (r) => {
        let l, w, h; do { l = r.int(2, 6); w = r.int(1, 4); h = r.int(1, 5); } while (l === w && w === h);
        const v = r.int(0, 3); const SA = 2 * (l * w + l * h + w * h);
        const ctx = r.pick(['The diagram shows the net of a cuboid drawn on centimetre squared paper.', 'Ana draws the net of a cuboid on a 1 cm grid.', 'A box template (the net of a cuboid) is printed on centimetre squared paper.', 'Here is the net of a cuboid on a centimetre grid.']);
        if (v === 0) return { html: `${ctx} The cuboid is ${l} cm long, ${w} cm wide and ${h} cm high. Work out the total area of the net.`, diagram: cuboidNetSvg(l, w, h, { grid: true, labels: true }), unit: 'cm²', ...nAns(SA, { unit: 'cm²' }), hint: 'The area of the net is the surface area of the cuboid.',
          steps: [`Pairs of faces: ${l} × ${w} = ${l * w}, ${l} × ${h} = ${l * h}, ${w} × ${h} = ${w * h}`, `Each appears twice: 2 × (${l * w} + ${l * h} + ${w * h})`, `Area of net = ${B(SA)} cm²`] };
        if (v === 1) return { html: `${ctx} It folds up to make a cuboid. Use the measurements on the net to work out the volume of the cuboid.`, diagram: cuboidNetSvg(l, w, h, { grid: true, labels: true }), unit: 'cm³', ...nAns(l * w * h, { unit: 'cm³' }), hint: 'Find the length, width and height of the folded cuboid.',
          steps: [`The cuboid is ${l} cm by ${w} cm by ${h} cm.`, `Volume = ${l} × ${w} × ${h} = ${B(l * w * h)} cm³`] };
        if (v === 2) {
          const letters = r.sample(['A', 'B', 'C', 'D', 'E', 'F'], 6); const opp = [2, 3, 0, 1, 5, 4]; const f = r.int(0, 5);
          return { html: `${ctx} The faces are labelled with letters. When the net is folded into a cuboid, which face is opposite face ${B(letters[f])}?`, diagram: cuboidNetSvg(l, w, h, { grid: true, letters, hiFace: f }), ...mcq(r, [letters[opp[f]], ...letters.filter((x, i) => i !== f && i !== opp[f]).slice(0, 3)], 0, { format: 'Choose one answer.' }), hint: 'Imagine folding: in a strip of four faces, faces two apart end up opposite.',
            steps: [f >= 4 ? 'The two faces attached above and below the strip fold to become the top and bottom.' : 'In the strip of four faces, faces two places apart fold to opposite sides.', `Face ${letters[f]} is opposite face ${B(letters[opp[f]])}.`] };
        }
        const which = r.pick([['top', 4, l * w, `${l} × ${w}`], ['front', 1, l * h, `${l} × ${h}`], ['end', 0, w * h, `${w} × ${h}`]]);
        return { html: `${ctx} The cuboid is ${l} cm long, ${w} cm wide and ${h} cm high. How many centimetre squares does the shaded face cover?`, diagram: cuboidNetSvg(l, w, h, { grid: true, labels: true, hiFace: which[1] }), unit: 'cm²', ...nAns(which[2], { unit: 'cm²' }), hint: 'Find the two edges of the shaded rectangle.',
          steps: [`The shaded rectangle measures ${which[3]} cm.`, `Area = ${B(which[2])} cm², so it covers ${which[2]} squares.`] };
      }],
    ['Area of 2D shapes (review)',
      'Rectangle: base × height. Triangle: ½ × base × perpendicular height. Parallelogram: base × perpendicular height. Trapezium: ½(a + b) × h. Circle: πr². Always use the perpendicular height, never a sloping side.',
      (r) => {
        const v = r.pick(['rect', 'tri', 'para', 'trap', 'circ', 'circ']); const u = r.pick(['cm', 'm']);
        if (v === 'rect') { const b = r.int(3, 20), h = r.int(2, 15); return { html: `${r.pick(['A rectangle', 'A rectangular rug', 'A phone screen (a rectangle)', 'A rectangular field'])} is ${b} ${u} long and ${h} ${u} wide. Work out its area.`, diagram: shapeSvg([[0, 0], [b, 0], [b, h], [0, h]], [`${b} ${u}`, `${h} ${u}`, '', '']), unit: u + '²', ...nAns(b * h, { unit: u + '²' }), hint: 'Base × height.', steps: ['Area = base × height', `= ${b} × ${h} = ${B(b * h)} ${u}²`] }; }
        if (v === 'tri') { const b = r.int(3, 20), h = r.int(2, 15), off = r.int(1, b - 1); const sl = Math.hypot(off, h); return { html: `${r.pick(['A triangle', 'A triangular flag', 'A triangular garden bed', 'A triangular sail'])} has base ${b} ${u}, perpendicular height ${h} ${u} and a sloping side of ${r1(sl)} ${u}. Work out its area.`, diagram: shapeSvg([[0, 0], [b, 0], [off, h]], [`${b} ${u}`, '', `${r1(sl)} ${u}`], { height: [[off, h], [off, 0], `${h} ${u}`] }), unit: u + '²', ...nAns(b * h / 2, { unit: u + '²' }), hint: '½ × base × perpendicular height.', steps: ['Area = ½ × base × perpendicular height (the sloping side is not needed)', `= ½ × ${b} × ${h} = ${B(ds(b * h / 2))} ${u}²`] }; }
        if (v === 'para') { const b = r.int(4, 18), h = r.int(2, 12), s = r.int(1, 5); const sl = Math.hypot(s, h); return { html: `${r.pick(['A parallelogram', 'A parallelogram-shaped tile', 'A road sign in the shape of a parallelogram'])} has base ${b} ${u}, sloping side ${r1(sl)} ${u} and perpendicular height ${h} ${u}. Work out its area.`, diagram: shapeSvg([[0, 0], [b, 0], [b + s, h], [s, h]], [`${b} ${u}`, `${r1(sl)} ${u}`, '', ''], { height: [[s, h], [s, 0], `${h} ${u}`] }), unit: u + '²', ...nAns(b * h, { unit: u + '²' }), hint: 'Base × perpendicular height.', steps: ['Area = base × perpendicular height', `= ${b} × ${h} = ${B(b * h)} ${u}²`] }; }
        if (v === 'trap') { const a = r.int(2, 12), b = a + r.int(2, 10), h = r.int(2, 12), off = r.int(0, b - a); const A = (a + b) * h / 2; return { html: `${r.pick(['A trapezium', 'A trapezium-shaped lawn', 'The side of a skip (a trapezium)'])} has parallel sides ${a} ${u} and ${b} ${u}, and perpendicular height ${h} ${u}. Work out its area.`, diagram: shapeSvg([[0, 0], [b, 0], [off + a, h], [off, h]], [`${b} ${u}`, '', `${a} ${u}`, ''], { height: [[off + a / 2, h], [off + a / 2, 0], `${h} ${u}`] }), unit: u + '²', ...nAns(A, { unit: u + '²' }), hint: 'Add the parallel sides, halve, multiply by the height.', steps: ['Area = ½(a + b)h', `= ½ × (${a} + ${b}) × ${h} = ½ × ${a + b} × ${h}`, `= ${B(ds(A))} ${u}²`] }; }
        const rr = r.int(2, 15); const useD = r.chance(0.4); const inPi = r.chance();
        return { html: `${r.pick(['A circle', 'A circular pond', 'A round table top', 'A circular badge'])} has ${useD ? 'diameter' : 'radius'} ${B((useD ? 2 * rr : rr) + ' ' + u)}. Work out its area. Give your answer ${inPi ? 'in terms of π' : 'to 1 decimal place'}.`, diagram: circleSvg({ mode: useD ? 'd' : 'r', label: `${useD ? 2 * rr : rr} ${u}` }), unit: u + '²', ...(inPi ? piAns(rr * rr) : nAns(Math.PI * rr * rr, { dp: 1, unit: u + '²' })), format: inPi ? PI_FMT : 'Give your answer to 1 decimal place.', hint: 'Area = πr². Use the radius.',
          steps: [useD ? `Radius = ${2 * rr} ÷ 2 = ${rr} ${u}` : `Radius = ${rr} ${u}`, `Area = π × ${rr}² = ${piT(rr * rr)}`, inPi ? `Area = ${B(piT(rr * rr))} ${u}²` : `= ${fx(Math.PI * rr * rr, 3)}… = ${B(r1(Math.PI * rr * rr))} ${u}²`] };
      }],
  ]);

  addStyles('y9-volume-surface-area', [
    ['Volume of prisms by cross-section',
      'Volume of any prism (or cylinder) = area of cross-section × length. Count cubes layer by layer for solids made of cubes, and give answers in terms of π when asked.',
      (r) => {
        const v = r.int(0, 5);
        if (v === 0) {
          const l = r.int(2, 8), w = r.int(2, 6), h = r.int(2, 6);
          return { html: `${r.pick(['A cuboid is built from centimetre cubes.', 'Toby stacks 1 cm cubes to make a solid cuboid.', 'A block of sugar cubes forms a cuboid.'])} It is ${l} cubes long, ${w} cubes wide and ${h} cubes high. How many cubes are used, and so what is the volume in cm³?`, diagram: cuboidSvg(`${l} cubes`, `${w} cubes`, `${h} cubes`), unit: 'cm³', ...nAns(l * w * h, { unit: 'cm³' }), hint: 'Count one layer, then multiply by the number of layers.',
            steps: [`One layer: ${l} × ${w} = ${l * w} cubes`, `${h} layers: ${l * w} × ${h} = ${l * w * h} cubes`, `Volume = ${B(l * w * h)} cm³`] };
        }
        if (v === 1) {
          const A = r.int(6, 80), L = r.int(3, 25);
          return { html: `${r.pick(['A prism', 'A chocolate bar (a prism)', 'A metal girder (a prism)', 'A length of skirting board (a prism)'])} has a cross-section of area ${B(A + ' cm²')} and is ${B(L + ' cm')} long. Work out its volume.`, unit: 'cm³', ...nAns(A * L, { unit: 'cm³' }), hint: 'Area of cross-section × length.', steps: ['Volume = area of cross-section × length', `= ${A} × ${L} = ${B(A * L)} cm³`] };
        }
        if (v === 2) {
          const a = r.int(2, 10), b = a + r.int(2, 8), h = r.int(2, 9), L = r.int(4, 20), off = r.int(0, b - a); const A = (a + b) * h / 2;
          return { html: `A prism has a trapezium cross-section (shown). The parallel sides are ${a} cm and ${b} cm, the perpendicular height is ${h} cm, and the prism is ${B(L + ' cm')} long. Work out its volume.`, diagram: shapeSvg([[0, 0], [b, 0], [off + a, h], [off, h]], [`${b} cm`, '', `${a} cm`, ''], { height: [[off + a / 2, h], [off + a / 2, 0], `${h} cm`], fill: true }), unit: 'cm³', ...nAns(A * L, { unit: 'cm³' }), hint: 'Find the trapezium area first.',
            steps: [`Cross-section: ½ × (${a} + ${b}) × ${h} = ${ds(A)} cm²`, `Volume = ${ds(A)} × ${L} = ${B(ds(A * L))} cm³`] };
        }
        if (v === 3) {
          const W0 = r.int(5, 12), H0 = r.int(5, 12), cw = r.int(2, W0 - 2), ch = r.int(2, H0 - 2), L = r.int(3, 20); const A = W0 * H0 - cw * ch;
          return { html: `A prism has an L-shaped cross-section (shown): a ${W0} cm by ${H0} cm rectangle with a ${cw} cm by ${ch} cm rectangle cut from one corner. The prism is ${B(L + ' cm')} long. Work out its volume.`,
            diagram: shapeSvg([[0, 0], [W0, 0], [W0, H0 - ch], [W0 - cw, H0 - ch], [W0 - cw, H0], [0, H0]], [`${W0} cm`, '', `${cw} cm`, `${ch} cm`, '', `${H0} cm`], { fill: true, inside: [3] }), unit: 'cm³', ...nAns(A * L, { unit: 'cm³' }), hint: 'Area of the big rectangle minus the cut-out, then × length.',
            steps: [`Cross-section: ${W0} × ${H0} − ${cw} × ${ch} = ${W0 * H0} − ${cw * ch} = ${A} cm²`, `Volume = ${A} × ${L} = ${B(A * L)} cm³`] };
        }
        if (v === 4) {
          const rr = r.int(2, 10), h = r.int(2, 20); const useD = r.chance(0.4);
          return { html: `${r.pick(['A cylinder', 'A cylindrical can', 'A round cake tin (a cylinder)', 'A cylindrical candle'])} has ${useD ? 'diameter' : 'radius'} ${B((useD ? 2 * rr : rr) + ' cm')} and height ${B(h + ' cm')}. Work out its volume. Give your answer in terms of π.`, diagram: cylSvg(`${useD ? 2 * rr : rr} cm`, `${h} cm`, useD), unit: 'cm³', ...piAns(rr * rr * h), format: PI_FMT, hint: 'V = πr²h; leave π in the answer.',
            steps: [useD ? `Radius = ${2 * rr} ÷ 2 = ${rr} cm` : `Radius = ${rr} cm`, `Area of circle = π × ${rr}² = ${piT(rr * rr)} cm²`, `Volume = ${piT(rr * rr)} × ${h} = ${B(piT(rr * rr * h))} cm³`] };
        }
        const A = r.int(5, 60), L = r.int(3, 25);
        return { html: `A prism has volume ${B(A * L + ' cm³')}. The area of its cross-section is ${B(A + ' cm²')}. How long is the prism?`, unit: 'cm', ...nAns(L, { unit: 'cm' }), hint: 'Length = volume ÷ area of cross-section.', steps: ['Volume = area of cross-section × length, so length = volume ÷ area', `Length = ${A * L} ÷ ${A} = ${B(L)} cm`] };
      }],
  ]);

  // ---- protractor ----
  function protractorSvg(alpha, fromRight) {
    const O = [180, 190], R = 145; let body = sP(`M${O[0] - R},${O[1]} A${R},${R} 0 0 1 ${O[0] + R},${O[1]} Z`, { fill: ACC, fop: 0.04, w: 1.5 });
    for (let a = 0; a <= 180; a += 5) { const t = a % 10 ? 6 : 11; body += sL(O[0] + R * cosD(a), O[1] - R * sinD(a), O[0] + (R - t) * cosD(a), O[1] - (R - t) * sinD(a), { w: 1 }); }
    for (let a = 0; a <= 180; a += 20) { const up = a % 180 ? 0 : 9; body += sT(O[0] + (R - 20) * cosD(a), O[1] - (R - 20) * sinD(a) - up, String(180 - a), { fs: 9 }) + sT(O[0] + (R - 38) * cosD(a), O[1] - (R - 38) * sinD(a) - up, String(a), { fs: 9, c: ACC }); }
    const end = fromRight ? [O[0] + R + 10, O[1]] : [O[0] - R - 10, O[1]]; const arm = [O[0] + (R + 12) * cosD(alpha), O[1] - (R + 12) * sinD(alpha)];
    body += sL(O[0], O[1], end[0], end[1], { w: 3 }) + sL(O[0], O[1], arm[0], arm[1], { w: 3 }) + angArc(O, end, arm, 26, '', { w: 2.5, c: ACC }) + dot(O[0], O[1]);
    return svgWrap(360, 210, body, false);
  }
  const TRI_STEPS = {
    perpPoint: ['Put the compass point on P and draw an arc that crosses the line in two places.', 'From each of those two points, draw arcs of the same radius that cross on the other side of the line.', 'Join P to the point where the two arcs cross.'],
    perpBis: ['Open the compasses to more than half the length of AB.', 'With the point on A and then on B, draw arcs above and below the line (same radius).', 'Join the two points where the arcs cross.'],
    angBis: ['Put the compass point on the vertex and draw an arc crossing both arms.', 'From each crossing point, draw arcs of the same radius that cross inside the angle.', 'Join the vertex to the point where the arcs cross.'],
  };
  const TRI_NAME = { perpPoint: 'the perpendicular from a point P to a line', perpBis: 'the perpendicular bisector of a line AB', angBis: 'the bisector of an angle' };
  // ---- polyominoes for congruent figures ----
  const TFS = [[(x, y) => [-y, x], 'rotated 90° clockwise'], [(x, y) => [-x, -y], 'rotated 180°'], [(x, y) => [y, -x], 'rotated 90° anticlockwise'], [(x, y) => [-x, y], 'reflected in a vertical mirror line'], [(x, y) => [x, -y], 'reflected in a horizontal mirror line'], [(x, y) => [-y, -x], 'reflected and then rotated'], [(x, y) => [y, x], 'reflected in a diagonal mirror line']];
  const norm = (cells) => { const mx = Math.min(...cells.map((c) => c[0])), my = Math.min(...cells.map((c) => c[1])); return cells.map(([x, y]) => [x - mx, y - my]).sort((a, b) => a[0] - b[0] || a[1] - b[1]); };
  const key = (cells) => norm(cells).map((c) => c.join(',')).join(';');
  const canon = (cells) => [cells, ...TFS.map(([f]) => cells.map(([x, y]) => f(x, y)))].map(key).sort()[0];
  function polyo(r, n) {
    const cells = [[0, 0]]; const has = (x, y) => cells.some((c) => c[0] === x && c[1] === y);
    while (cells.length < n) { const [x, y] = r.pick(cells); const [dx, dy] = r.pick([[1, 0], [-1, 0], [0, 1], [0, -1]]); const nx = x + dx, ny = y + dy; const t = norm([...cells, [nx, ny]]); if (!has(nx, ny) && Math.max(...t.map((c) => c[0])) < 4 && Math.max(...t.map((c) => c[1])) < 4) cells.push([nx, ny]); }
    return norm(cells);
  }
  function connected(cells) { const seen = new Set(['0']); const st = [0]; while (st.length) { const i = st.pop(); cells.forEach((c, j) => { if (!seen.has(String(j)) && Math.abs(c[0] - cells[i][0]) + Math.abs(c[1] - cells[i][1]) === 1) { seen.add(String(j)); st.push(j); } }); } return seen.size === cells.length; }
  function mutate(r, cells) {
    for (let k = 0; k < 200; k++) { const c = cells.slice(); c.splice(r.int(0, c.length - 1), 1); const [x, y] = r.pick(c); const [dx, dy] = r.pick([[1, 0], [-1, 0], [0, 1], [0, -1]]); if (c.some((q) => q[0] === x + dx && q[1] === y + dy)) continue; c.push([x + dx, y + dy]); const t = norm(c); if (connected(t) && canon(t) !== canon(cells) && Math.max(...t.map((q) => q[0])) < 4 && Math.max(...t.map((q) => q[1])) < 4) return t; }
    return null;
  }
  const drawPoly = (cells, x0, y0, sz, hi) => cells.map(([x, y]) => sPoly(rect(x0 + x * sz, y0 + y * sz, sz, sz), { fill: ACC, fop: hi ? 0.35 : 0.1 })).join('');

  addStyles('y9-constructions', [
    ['Measuring angles with a protractor',
      'Put the centre of the protractor on the vertex and line up 0 with one arm. Read the scale that starts at 0 on that arm — not the other one. Check: an acute angle must be less than 90° and an obtuse angle more than 90°. For a reflex angle, measure the angle on the other side and subtract it from 360°.',
      (r) => {
        const v = r.int(0, 5);
        if (v <= 2) {
          let a; do { a = 5 * r.int(3, 33); } while (a === 90); const fr = r.chance(); const ans = fr ? a : 180 - a;
          return { html: `${r.pick(['A protractor is placed on an angle as shown.', 'Ella measures the marked angle with a protractor.', 'The diagram shows a protractor lined up on an angle.', 'A protractor is used to measure the angle between the two thick lines.'])} What is the size of the marked angle?`, diagram: protractorSvg(a, fr), unit: '°', ...nAns(ans, { unit: '°' }), hint: 'Which scale has 0 on the starting arm?',
            steps: [`The starting arm goes through 0 on the ${fr ? 'inner (blue) scale on the right' : 'outer (black) scale on the left'}, so read that scale.`, `The other arm points to ${ans} on that scale (and ${180 - ans} on the other scale).`, `The angle is ${ans < 90 ? 'acute' : 'obtuse'}, so ${B(ans + '°')} makes sense.`] };
        }
        if (v === 3) {
          const R0 = r.int(185, 355);
          return { html: `${r.pick(['Sam wants to draw', 'You need to draw', 'Priya is asked to draw'])} a reflex angle of ${B(R0 + '°')} with a 180° protractor. What size of angle should be measured on the other side of the line?`, unit: '°', ...nAns(360 - R0, { unit: '°' }), hint: 'Angles around a point add up to 360°.', steps: ['The reflex angle and the angle on the other side make a full turn: 360°.', `360° − ${R0}° = ${B(360 - R0 + '°')}`] };
        }
        if (v === 4) {
          let a; do { a = r.int(10, 170); } while (a === 90); const wrong = 180 - a;
          return { html: `${r.pick(['Ben', 'Mia', 'Leo', 'Zara'])} measures ${a < 90 ? 'an acute' : 'an obtuse'} angle but reads the wrong scale on the protractor and gets ${B(wrong + '°')}. What is the actual size of the angle?`, unit: '°', ...nAns(a, { unit: '°' }), hint: 'The two scales add up to 180°.', steps: ['The two scales on a protractor always add up to 180° at the same point.', `Actual angle = 180° − ${wrong}° = ${B(a + '°')}`, `Check: ${a}° is ${a < 90 ? 'acute' : 'obtuse'} ✓`] };
        }
        const a = r.pick([r.int(5, 89), 90, r.int(91, 179), 180, r.int(181, 359)]); const k = a < 90 ? 0 : a === 90 ? 1 : a < 180 ? 2 : a === 180 ? 3 : 4; const O = ['acute', 'right angle', 'obtuse', 'straight line', 'reflex'];
        return { html: `What type of angle is ${B(a + '°')}?`, ...mcq(r, O, k), hint: 'Compare with 90°, 180° and 360°.', steps: ['Acute: less than 90°. Right: 90°. Obtuse: between 90° and 180°. Straight: 180°. Reflex: between 180° and 360°.', `${a}° is ${B(O[k])}.`] };
      }],
    ['Constructing triangles & perpendiculars',
      'With three sides (SSS) use a ruler and compasses; with two sides and the included angle (SAS) or two angles and the side between them (ASA) use a ruler and protractor. The shortest distance from a point to a line is along the perpendicular, which you construct with compasses.',
      (r) => {
        const v = r.int(0, 5);
        if (v === 0) {
          const t = r.pick(['SSS', 'SAS', 'ASA']); const [P, Q, Rr] = r.pick([['A', 'B', 'C'], ['P', 'Q', 'R'], ['D', 'E', 'F'], ['X', 'Y', 'Z']]);
          const s1 = r.int(4, 10), s2 = r.int(4, 10), s3 = r.int(Math.abs(s1 - s2) + 1, s1 + s2 - 1), a1 = r.int(30, 80), a2 = r.int(30, 80);
          const info = t === 'SSS' ? `${P}${Q} = ${s1} cm, ${Q}${Rr} = ${s2} cm and ${P}${Rr} = ${s3} cm` : t === 'SAS' ? `${P}${Q} = ${s1} cm, angle ${P}${Q}${Rr} = ${a1}° and ${Q}${Rr} = ${s2} cm` : `${P}${Q} = ${s1} cm, angle ${Rr}${P}${Q} = ${a1}° and angle ${P}${Q}${Rr} = ${a2}°`;
          const O = ['SSS: ruler and compasses', 'SAS: ruler and protractor', 'ASA: ruler and protractor', 'RHS: ruler and compasses only'];
          return { html: `${r.pick(['A pupil must construct triangle', 'Construct triangle', 'An exam question asks you to construct triangle'])} ${P}${Q}${Rr} with ${info}. Which type of information is this, and what equipment is needed?`, ...mcq(r, O, ['SSS', 'SAS', 'ASA'].indexOf(t)), hint: 'Count the sides and angles given, and check whether the angle is between the sides.',
            steps: [t === 'SSS' ? 'Three sides are given.' : t === 'SAS' ? `Two sides with the angle between them (at ${Q}).` : `Two angles with the side ${P}${Q} between them.`, t === 'SSS' ? 'Draw one side with a ruler, then use compasses set to the other two lengths from each end.' : 'Draw the side with a ruler and measure the angle(s) with a protractor.', `Answer: ${B(O[['SSS', 'SAS', 'ASA'].indexOf(t)])}`] };
        }
        if (v === 1) {
          let a, b; do { a = r.int(25, 100); b = r.int(25, 100); } while (a + b > 160);
          return { html: `${r.pick(['Kim', 'Josh', 'Amira', 'Theo'])} constructs triangle ABC with AB = ${r.int(5, 12)} cm, angle CAB = ${B(a + '°')} and angle ABC = ${B(b + '°')}. When finished, what should angle ACB measure?`, unit: '°', ...nAns(180 - a - b, { unit: '°' }), hint: 'Angles in a triangle add up to 180°.', steps: ['Angles in a triangle add up to 180°.', `Angle ACB = 180° − ${a}° − ${b}° = ${B(180 - a - b + '°')}`] };
        }
        if (v === 2) {
          const eq = r.chance(); if (eq) { const s = r.int(3, 12); return { html: `A triangle is constructed with compasses so that all three sides are ${B(s + ' cm')}. What size will each angle be?`, unit: '°', ...nAns(60, { unit: '°' }), hint: 'Equal sides give equal angles.', steps: ['All three sides are equal, so it is equilateral and all angles are equal.', `180° ÷ 3 = ${B('60°')}`] }; }
          const k = r.int(1, 4), tr = r.pick([[3, 4, 5], [5, 12, 13], [6, 8, 10]]); const sd = r.shuffle(tr.map((x) => x * k));
          return { html: `A triangle is constructed (SSS) with sides ${sd.join(' cm, ')} cm. Use Pythagoras' theorem to decide the size of its largest angle.`, unit: '°', ...nAns(90, { unit: '°' }), hint: 'Check whether a² + b² = c² for the longest side.', steps: [`${tr[0] * k}² + ${tr[1] * k}² = ${(tr[0] * k) ** 2} + ${(tr[1] * k) ** 2} = ${(tr[2] * k) ** 2} = ${tr[2] * k}²`, `So the triangle is right-angled, and the largest angle (opposite the ${tr[2] * k} cm side) is ${B('90°')}.`] };
        }
        if (v === 3) {
          const [p, q, c] = r.pick([[3, 4, 5], [6, 8, 10], [5, 12, 13], [8, 15, 17], [9, 12, 15]]); const sw = r.chance(); const d = sw ? q : p, f = sw ? p : q; const ask = r.chance();
          return { html: `F is the foot of the perpendicular from point P to a straight road. PF = ${B(d + ' m')}. ${ask ? `Point Q is on the road, ${f} m from F. How far is P from Q?` : `Point Q is on the road and PQ = ${c} m. How far is Q from F?`}`, unit: 'm', ...nAns(ask ? c : f, { unit: 'm' }), hint: 'PF meets the road at 90°, so use Pythagoras.',
            steps: ['The perpendicular meets the road at 90°, so triangle PFQ is right-angled at F.', ask ? `PQ² = ${d}² + ${f}² = ${d * d + f * f}` : `QF² = ${c}² − ${d}² = ${c * c - d * d}`, ask ? `PQ = √${c * c} = ${B(c)} m` : `QF = √${f * f} = ${B(f)} m`] };
        }
        if (v === 4) {
          const d = r.int(3, 12); const others = r.sample([d + r.int(1, 3), d + r.int(4, 7), d + r.int(8, 12)], 3);
          return { html: `A lifeguard at point P measures the distances to four points on a straight shoreline: ${r.shuffle([d, ...others]).map((x) => x + ' m').join(', ')}. One of these points is the foot of the perpendicular from P. What is the shortest distance from P to the shoreline?`, unit: 'm', ...nAns(d, { unit: 'm' }), hint: 'The perpendicular distance is the shortest.', steps: ['The shortest distance from a point to a line is the perpendicular distance.', `Every other point is further away, so the shortest distance is ${B(d)} m.`] };
        }
        const kind = r.pick(Object.keys(TRI_STEPS)); const st = r.int(0, 2);
        const wrong = ['Measure a 90° angle at P with a protractor and draw the line.', 'Draw a circle centred on the middle of the line.', 'Fold the paper in half and draw along the fold.', 'Join the two ends of the line to P.'];
        return { html: `When constructing ${B(TRI_NAME[kind])} with ruler and compasses, what is step ${B(st + 1)}?`, ...mcq(r, [TRI_STEPS[kind][st], ...TRI_STEPS[kind].filter((_, i) => i !== st), r.pick(wrong)], 0), hint: 'Picture the arcs you draw first, then where they cross.',
          steps: TRI_STEPS[kind].map((x, i) => `Step ${i + 1}: ${i === st ? B(x) : x}`) };
      }],
    ['Congruent figures',
      'Congruent shapes are identical in shape and size: one can be rotated, reflected or moved to fit exactly on top of the other. A shape that has been stretched or has a different arrangement is not congruent.',
      (r) => {
        let P, bad; do { P = polyo(r, r.int(4, 6)); bad = mutate(r, P); } while (!bad);
        const notQ = r.chance(0.4);
        const tf = r.sample(TFS, 3);
        let cand, why;
        if (!notQ) { const t = tf[0]; const bads = [bad]; for (let k = 0; k < 2; k++) { let m; do { m = mutate(r, P); } while (!m); bads.push(m); } cand = [norm(P.map(([x, y]) => t[0](x, y))), ...bads.map((b) => { const f = r.pick(TFS)[0]; return norm(b.map(([x, y]) => f(x, y))); })]; why = [`It is shape P ${t[1]}.`, 'The other shapes have a square in a different place, so no rotation or reflection makes them fit.']; }
        else { cand = [norm(bad), ...tf.map((t) => norm(P.map(([x, y]) => t[0](x, y))))]; why = [`The other three are shape P ${tf.map((t) => t[1]).join(', ')}.`, 'The odd one out has a square in a different place, so it cannot fit exactly on P.']; }
        const m = mcq(r, cand.map((_, i) => String(i)), 0); const order = m.options.map(Number);
        let body = drawPoly(P, 16, 50, 15, true) + sT(46, 125, 'P', { b: true, c: ACC });
        order.forEach((ci, p) => { body += drawPoly(cand[ci], 92 + p * 67, 50, 15, false) + sT(122 + p * 67, 125, LET[p], { b: true }); });
        const opts = order.map((_, p) => `Shape ${LET[p]}`); const ap = m.check.correct[0];
        return { html: `${r.pick(['Shapes are cut from squared paper.', 'Tiles are drawn on a square grid.', 'A puzzle uses pieces made from squares.', 'Ravi draws some shapes on centimetre squared paper.', 'A game has pieces made of identical squares.'])} ${notQ ? r.pick(['Three of the shapes A to D are congruent to shape P. Which one is NOT congruent to P?', 'Which shape is not congruent to shape P?']) : r.pick(['Which shape is congruent to shape P?', 'Only one of shapes A to D is congruent to shape P. Which one?', 'Shape P is drawn on a grid. Which of shapes A to D is congruent to it?'])} (P has ${P.length} squares.)`,
          diagram: svgWrap(360, 150, body, false), options: opts, multi: false, answer: m.answer, check: m.check, answerHtml: `${LET[ap]}) Shape ${LET[ap]}`, format: 'Choose one answer.', hint: 'Imagine turning or flipping shape P. Do the squares line up exactly?',
          steps: [...why, `Answer: ${B('Shape ' + LET[ap])}`] };
      }],
  ]);

  // ---- semicircle diagram ----
  function semiSvg(a, o) {
    const O = [180, 180], R = 135; const C = [O[0] + R * cosD(180 - 2 * a), O[1] - R * sinD(180 - 2 * a)]; const A = [O[0] - R, O[1]], Bq = [O[0] + R, O[1]];
    let body = sP(`M${A[0]},${A[1]} A${R},${R} 0 0 1 ${Bq[0]},${Bq[1]}`) + sL(A[0], A[1], Bq[0], Bq[1]) + sPoly([A, Bq, C], { fill: ACC, fop: 0.06 });
    if (o.radii) body += sL(O[0], O[1], C[0], C[1], { dash: true, w: 1.5 }) + dot(O[0], O[1]) + sT(O[0], O[1] + 15, 'O', { b: true });
    body += sT(A[0] - 10, A[1], 'A', { b: true }) + sT(Bq[0] + 10, Bq[1], 'B', { b: true }) + sT(C[0], C[1] - 13, 'C', { b: true });
    if (o.la) body += angArc(A, Bq, C, 30, o.la, { lr: 14, fs: 12 });
    if (o.lb) body += angArc(Bq, C, A, 30, o.lb, { lr: 14, fs: 12 });
    if (o.lc) body += angArc(C, A, Bq, 20, o.lc, { lr: 14, fs: 12, c: ACC, tc: ACC });
    return svgWrap(360, 215, body);
  }
  const QP = {
    square: ['all sides equal', 'all angles 90°', 'opposite sides parallel', 'opposite angles equal', 'diagonals cross at right angles', 'diagonals equal in length', 'four lines of symmetry', 'opposite sides equal', 'two pairs of equal neighbouring sides'],
    rectangle: ['all angles 90°', 'opposite sides parallel', 'opposite angles equal', 'diagonals equal in length', 'opposite sides equal', 'rotational symmetry of order 2'],
    rhombus: ['all sides equal', 'opposite sides parallel', 'opposite angles equal', 'diagonals cross at right angles', 'opposite sides equal', 'rotational symmetry of order 2', 'two pairs of equal neighbouring sides'],
    parallelogram: ['opposite sides parallel', 'opposite angles equal', 'opposite sides equal', 'rotational symmetry of order 2'],
    kite: ['two pairs of equal neighbouring sides', 'no parallel sides', 'diagonals cross at right angles', 'exactly one line of symmetry', 'only one pair of equal opposite angles'],
    trapezium: ['exactly one pair of parallel sides'],
    'isosceles trapezium': ['exactly one pair of parallel sides', 'diagonals equal in length', 'exactly one line of symmetry'],
  };
  const ALLP = [...new Set(Object.values(QP).flat())];

  addStyles('y9-angle-deduction', [
    ['Testing conjectures with angles',
      'A conjecture is a statement you think is true. Test it with examples: if every example works it is supported, but only a proof using angle facts shows it is always true. A single counterexample is enough to show it is false.',
      (r) => {
        const v = r.int(0, 4);
        if (v === 0) {
          const a = r.int(15, 75), b = 90 - a;
          return { html: `${r.pick(['Leah', 'Omar', 'Grace', 'Ivan'])} conjectures that the angle in a semicircle is always 90°. To test it, triangle ABC is drawn with AB a diameter and C on the semicircle. Angle CAB = ${B(a + '°')} and angle CBA = ${B(b + '°')}. Work out angle ACB.`, diagram: semiSvg(a, { la: a + '°', lb: b + '°', lc: 'x' }), unit: '°', ...nAns(90, { unit: '°' }), hint: 'Angles in a triangle add up to 180°.',
            steps: ['Angles in a triangle add up to 180°.', `Angle ACB = 180° − ${a}° − ${b}° = ${B('90°')}`, 'This example supports the conjecture (but one example does not prove it).'] };
        }
        if (v === 1) {
          const a = r.int(15, 75); const ask = r.pick(['OCA', 'BOC', 'OBC']);
          const ans = { OCA: a, BOC: 2 * a, OBC: 90 - a }[ask];
          const steps = [`OA = OC (radii), so triangle OAC is isosceles: angle OCA = ${a}°.`];
          if (ask !== 'OCA') steps.push(`Angle AOC = 180° − ${a}° − ${a}° = ${180 - 2 * a}°, so angle BOC = 180° − ${180 - 2 * a}° = ${2 * a}° (angles on a straight line).`);
          if (ask === 'OBC') steps.push(`OB = OC, so angle OBC = (180° − ${2 * a}°) ÷ 2 = ${90 - a}°.`, `So angle ACB = ${a}° + ${90 - a}° = 90° — it works for any a.`);
          steps.push(`Angle ${ask} = ${B(ans + '°')}`);
          return { html: `To prove the angle in a semicircle is 90°, O is the centre of the semicircle with diameter AB, and C is on the arc, so OA = OB = OC. Angle OAC = ${B(a + '°')}. Work out angle ${B(ask)}.`, diagram: semiSvg(a, { radii: true, la: a + '°' }), unit: '°', ...nAns(ans, { unit: '°' }), hint: 'OA, OB and OC are radii, so look for isosceles triangles.', steps };
        }
        if (v === 2) {
          let a, b; do { a = r.int(20, 100); b = r.int(20, 100); } while (a + b > 165);
          return { html: `${r.pick(['Jo', 'Kai', 'Nia', 'Ruby'])} conjectures that an exterior angle of a triangle equals the sum of the two interior angles opposite it. Test it: a triangle has interior angles ${a}° and ${b}°. Work out the exterior angle at the third vertex.`, unit: '°', ...nAns(a + b, { unit: '°' }), hint: 'Find the third angle, then use angles on a straight line.',
            steps: [`Third angle = 180° − ${a}° − ${b}° = ${180 - a - b}°`, `Exterior angle = 180° − ${180 - a - b}° = ${B(a + b + '°')}`, `${a}° + ${b}° = ${a + b}°, so this example supports the conjecture.`] };
        }
        if (v === 3) {
          let a, b, c; do { a = r.int(50, 150); b = r.int(50, 150); c = r.int(50, 150); } while (360 - a - b - c < 30 || 360 - a - b - c > 175);
          return { html: `To test the conjecture “the angles in any quadrilateral add up to 360°”, a pupil draws a quadrilateral and measures three angles: ${a}°, ${b}° and ${c}°. If the conjecture is true, what should the fourth angle measure?`, unit: '°', ...nAns(360 - a - b - c, { unit: '°' }), hint: 'Subtract the three angles from 360°.',
            steps: [`${a}° + ${b}° + ${c}° = ${a + b + c}°`, `Fourth angle = 360° − ${a + b + c}° = ${B(360 - a - b - c + '°')}`, 'A diagonal splits any quadrilateral into two triangles: 2 × 180° = 360°, which proves it.'] };
        }
        const Q = [
          [`A conjecture about angles has been tested on ${r.pick([10, 25, 50, 100])} different diagrams and worked every time. Which statement is correct?`, 'It is supported, but it is not proved until there is a general proof', ['It is proved to be always true', 'It is false', 'It needs one more example to be proved'], 'Examples can only support a conjecture; a proof using facts covers every case.'],
          [`How many counterexamples are needed to show a conjecture is false?`, 'One', ['Two', 'Ten', 'It can never be shown to be false'], 'A single case where it fails shows it is not always true.'],
          [`${r.pick(['Ali', 'Beth', 'Cara'])} says: “If two angles add up to 180°, they must be co-interior angles.” Which shows this is false?`, 'Two angles next to each other on a straight line', ['Two co-interior angles on parallel lines', 'Two right angles inside a C shape', 'Two angles inside a C shape on parallel lines'], 'Angles on a straight line add up to 180° but are not co-interior.'],
          [`${r.pick(['Dev', 'Ella', 'Finn'])} says: “Every triangle has at least two acute angles.” Is this always, sometimes or never true?`, 'Always true', ['Sometimes true', 'Never true', 'Only for isosceles triangles'], 'Two angles of 90° or more would already add up to at least 180°, so at most one angle can be 90° or more.'],
        ];
        const [q, good, bads, why] = r.pick(Q);
        return { html: q, ...mcq(r, [good, ...bads], 0), hint: 'Think about what examples can and cannot show.', steps: [why, `Answer: ${B(good)}`] };
      }],
    ['Quadrilateral properties',
      'Know the facts: squares and rhombuses have four equal sides; squares and rectangles have four right angles; parallelograms (including rhombuses, rectangles and squares) have two pairs of parallel sides; a trapezium has exactly one pair; a kite has two pairs of equal neighbouring sides and no parallel sides.',
      (r) => {
        const shapes = Object.keys(QP);
        if (r.chance(0.55)) {
          let t, props; for (;;) { t = r.pick(shapes); props = r.sample(QP[t], Math.min(QP[t].length, r.int(2, 3))); const fits = shapes.filter((s) => props.every((p) => QP[s].includes(p))); if (fits.length === 1) break; }
          const dist = r.sample(shapes.filter((s) => s !== t), 3);
          return { html: `${r.pick(['A quadrilateral has all of these properties:', 'Every shape of one type of quadrilateral has these properties:', 'A quadrilateral is described by these properties:'])} ${props.join('; ')}. Which quadrilateral is it?`, ...mcq(r, [t, ...dist], 0), hint: 'Check each property against each shape.',
            steps: [...dist.map((s) => `${an(s).replace(/^a/, 'A')} does not always have: ${props.find((p) => !QP[s].includes(p))}.`), `Only the ${B(t)} has all of them.`].slice(-4) };
        }
        let t, good, bads; do { t = r.pick(shapes.filter((s) => s !== 'trapezium')); good = r.pick(QP[t]); bads = r.sample(ALLP.filter((p) => !QP[t].includes(p) && !(t === 'square' && p === 'rotational symmetry of order 2')), 3); } while (bads.length < 3);
        return { html: `${r.pick(['Which statement is true for every', 'Which of these is a property of every', 'Choose the statement that is always true for every'])} ${B(t)}?`, ...mcq(r, [good, ...bads], 0), hint: `Picture a ${t} and check each statement.`,
          steps: [`Properties of ${an(t)}: ${QP[t].join('; ')}.`, `So the true statement is: ${B(good)}.`] };
      }],
  ]);
};
