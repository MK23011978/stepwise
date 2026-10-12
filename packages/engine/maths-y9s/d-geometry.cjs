'use strict';
// Year 9 school units: Rotation & Translation, Enlargement & Similarity, Rates (graphs, flow, unit rates),
// Probability (independent events, Venn diagrams, two-way tables).
module.exports = (H) => {
  const { topic, SPEC, nAns, fAns, B, ds, ps, frac, fracN, fracS, simp, deg, svgWrap, sT, sL, sPoly, sC, dot, table, colvec, gcd, ACC, f1 } = H;

  Object.assign(SPEC, {
    'y9-transformations': '1MA1 G1, G7, G8, G24',
    'y9-enlargement': '1MA1 G6, G7, G19, R12',
    'y9-rates-graphs': '1MA1 N13, R11, R14, A14',
    'y9-probability-diagrams': '1MA1 P2, P3, P4, P6, P8',
  });

  // ---------------------------------------------------------------- local helpers
  const pt = (x, y) => `(${ds(x)}, ${ds(y)})`;
  const COORD_FMT = 'Give the coordinates as x, y — e.g. 3, −2';
  const VEC_FMT = 'Give the column vector as top number, bottom number — e.g. 3, −2';
  const pairAns = (x, y) => ({ answer: `${ps(x)}, ${ps(y)}`, check: { type: 'pair', values: [x, y], ordered: true }, answerHtml: B(pt(x, y)), answerLabel: '(', format: COORD_FMT });
  const vecAns = (a, b) => ({ answer: `${ps(a)}, ${ps(b)}`, check: { type: 'pair', values: [a, b], ordered: true }, answerHtml: B(colvec(a, b)), format: VEC_FMT });
  const textAns = (shown, accept) => ({ answer: shown, check: { type: 'text', accept }, answerHtml: B(shown) });
  const cosD = (d) => Math.cos(d * Math.PI / 180), sinD = (d) => Math.sin(d * Math.PI / 180);

  // coordinate grid: items {poly:[[x,y]..], c, fill, labels:[..]} | {pt:[x,y], label, c} | {vline:k} | {hline:k}
  function cgrid(x0, x1, y0, y1, items) {
    const pad = 24, cell = Math.min(270 / (x1 - x0), 270 / (y1 - y0));
    const w = 2 * pad + cell * (x1 - x0), h = 2 * pad + cell * (y1 - y0);
    const X = (x) => pad + (x - x0) * cell, Y = (y) => pad + (y1 - y) * cell;
    let body = '';
    for (let i = x0; i <= x1; i++) body += sL(X(i), Y(y0), X(i), Y(y1), { w: 1, op: 0.18 });
    for (let j = y0; j <= y1; j++) body += sL(X(x0), Y(j), X(x1), Y(j), { w: 1, op: 0.18 });
    const st = Math.max(x1 - x0, y1 - y0) > 12 ? 2 : 1;
    body += sL(X(x0), Y(0), X(x1), Y(0), { w: 1.5 }) + sL(X(0), Y(y0), X(0), Y(y1), { w: 1.5 });
    for (let i = x0; i <= x1; i++) if (i && i % st === 0) body += sT(X(i), Y(0) + 11, ds(i), { fs: 10 });
    for (let j = y0; j <= y1; j++) if (j && j % st === 0) body += sT(X(0) - 5, Y(j), ds(j), { fs: 10, a: 'end' });
    if (x0 === 0 && y0 === 0) body += sT(X(0) - 7, Y(0) + 10, '0', { fs: 10 });
    body += sT(X(x1) + 4, Y(0) - 10, 'x', { it: true }) + sT(X(0) + 10, Y(y1) - 6, 'y', { it: true });
    for (const it of items) {
      if (it.vline !== undefined) body += sL(X(it.vline), Y(y0), X(it.vline), Y(y1), { c: ACC, w: 2, dash: true }) + sT(X(it.vline) + 4, Y(y0) - 10, it.label || '', { a: 'start', fs: 11, c: ACC });
      if (it.hline !== undefined) body += sL(X(x0), Y(it.hline), X(x1), Y(it.hline), { c: ACC, w: 2, dash: true }) + sT(X(x1) - 2, Y(it.hline) - 9, it.label || '', { a: 'end', fs: 11, c: ACC });
      if (it.poly) {
        const P = it.poly.map(([x, y]) => [X(x), Y(y)]);
        body += sPoly(P, { c: it.c, fill: it.fill ? (it.c || ACC) : 'none', fop: it.fill ? 0.15 : undefined, w: 2 });
        if (it.name) { const cx = P.reduce((s, p) => s + p[0], 0) / P.length, cy = P.reduce((s, p) => s + p[1], 0) / P.length; body += sT(cx, cy, it.name, { b: true, fs: 13, c: it.c }); }
        if (it.labels) {
          const cx = P.reduce((s, p) => s + p[0], 0) / P.length, cy = P.reduce((s, p) => s + p[1], 0) / P.length;
          P.forEach((p, i) => { const dx = p[0] - cx, dy = p[1] - cy, l = Math.hypot(dx, dy) || 1; body += sT(p[0] + dx / l * 11, p[1] + dy / l * 11, it.labels[i], { fs: 12, b: true }); });
        }
      }
      if (it.pt) {
        const [x, y] = it.pt; body += it.cross ? sL(X(x) - 5, Y(y) - 5, X(x) + 5, Y(y) + 5, { w: 2 }) + sL(X(x) - 5, Y(y) + 5, X(x) + 5, Y(y) - 5, { w: 2 }) : dot(X(x), Y(y), it.c || ACC);
        if (it.label) body += sT(X(x) + 6, Y(y) - 10, it.label, { a: 'start', fs: 12, b: true });
      }
    }
    return svgWrap(Math.round(w), Math.round(h), body, false);
  }

  // shapes side by side: [{pts (maths, y up), sides:[edge labels], angs:[vertex labels], name, hi:[edge idx]}]
  function shapesSvg(shapes, o = {}) {
    const boxes = shapes.map((s) => { const xs = s.pts.map((p) => p[0]), ys = s.pts.map((p) => p[1]); return { minx: Math.min(...xs), maxx: Math.max(...xs), miny: Math.min(...ys), maxy: Math.max(...ys) }; });
    const vis = shapes.map((s) => s.vis || 1);
    const gap = o.gap || 60, W = 360, Hh = o.h || 220;
    const totW = boxes.reduce((a, b, i) => a + (b.maxx - b.minx) * vis[i], 0), maxH = Math.max(...boxes.map((b, i) => (b.maxy - b.miny) * vis[i]));
    const sc = Math.min((W - 60 - gap * (shapes.length - 1)) / totW, (Hh - 80) / maxH);
    let x = (W - (totW * sc + gap * (shapes.length - 1))) / 2, body = '';
    const base = Hh - 40;
    shapes.forEach((s, i) => {
      const b = boxes[i], k = vis[i] * sc;
      const P = s.pts.map((p) => [x + (p[0] - b.minx) * k, base - (p[1] - b.miny) * k]);
      const cx = P.reduce((a, p) => a + p[0], 0) / P.length, cy = P.reduce((a, p) => a + p[1], 0) / P.length;
      body += sPoly(P, { fill: ACC, fop: 0.1 });
      P.forEach((A, j) => {
        const Bp = P[(j + 1) % P.length];
        if (s.hi && s.hi.includes(j)) body += sL(A[0], A[1], Bp[0], Bp[1], { c: ACC, w: 3 });
        if (s.sides && s.sides[j]) {
          const mx = (A[0] + Bp[0]) / 2, my = (A[1] + Bp[1]) / 2; const dx = mx - cx, dy = my - cy, l = Math.hypot(dx, dy) || 1;
          const an = dx / l > 0.4 ? 'start' : dx / l < -0.4 ? 'end' : 'middle';
          body += sT(mx + dx / l * 9, my + dy / l * 12, s.sides[j], { a: an, fs: 13 });
        }
        if (s.angs && s.angs[j]) { const dx = cx - A[0], dy = cy - A[1], l = Math.hypot(dx, dy) || 1; const rr = Math.min(26, l * 0.45); body += sT(A[0] + dx / l * rr, A[1] + dy / l * rr, s.angs[j], { fs: 12, c: ACC, b: true }); }
      });
      if (s.name) body += sT(cx, base + 26, s.name, { b: true, fs: 13 });
      x += (b.maxx - b.minx) * k + gap;
    });
    return svgWrap(W, Hh, body, o.note !== false);
  }

  // line graph with gridlines: o {xMax, yMax, xStep, yStep, xLab, yLab (label every n steps), xl, yl, lines:[[[x,y]..]], marks:[[x,y]]}
  function lineGraph(o) {
    const x0 = 58, y0 = 192, W = 280, Hh = 160;
    const X = (x) => x0 + (x / o.xMax) * W, Y = (y) => y0 - (y / o.yMax) * Hh;
    let body = '';
    const nx = Math.round(o.xMax / o.xStep), ny = Math.round(o.yMax / o.yStep);
    for (let i = 0; i <= nx; i++) { const v = i * o.xStep; body += sL(X(v), y0, X(v), y0 - Hh, { w: 1, op: 0.18 }); if (i % (o.xLab || 1) === 0) body += sT(X(v), y0 + 12, ds(v), { fs: 10 }); }
    for (let j = 0; j <= ny; j++) { const v = j * o.yStep; body += sL(x0, Y(v), x0 + W, Y(v), { w: 1, op: 0.18 }); if (j % (o.yLab || 1) === 0) body += sT(x0 - 6, Y(v), ds(v), { fs: 10, a: 'end' }); }
    body += sL(x0, y0, x0 + W, y0, { w: 1.5 }) + sL(x0, y0, x0, y0 - Hh, { w: 1.5 });
    body += sT(x0 + W / 2, y0 + 30, o.xl, { fs: 12 });
    body += `<text x="14" y="${y0 - Hh / 2}" text-anchor="middle" fill="currentColor" stroke="none" font-size="12" transform="rotate(-90 14 ${y0 - Hh / 2})">${o.yl}</text>`;
    for (const ln of o.lines) body += sPoly(ln.map(([x, y]) => [X(x), Y(y)]), { open: true, c: ACC, w: 2.5 });
    for (const [x, y] of o.marks || []) body += dot(X(x), Y(y), ACC) + sT(X(x) + 5, Y(y) - 12, `(${ds(x)}, ${ds(y)})`, { a: X(x) > 280 ? 'end' : 'start', fs: 11, b: true });
    return svgWrap(360, 240, body, false);
  }

  // rotation helpers (maths axes, y up)
  const ROT = {
    cw: { w: '90° clockwise', f: (x, y) => [y, -x], rule: '(x, y) → (y, −x)' },
    acw: { w: '90° anticlockwise', f: (x, y) => [-y, x], rule: '(x, y) → (−y, x)' },
    half: { w: '180°', f: (x, y) => [-x, -y], rule: '(x, y) → (−x, −y)' },
  };
  const z = (v) => (v === 0 ? 0 : v); // avoid −0
  const mv = (dx, dy) => [dx ? `${ds(Math.abs(dx))} ${dx > 0 ? 'right' : 'left'}` : '', dy ? `${ds(Math.abs(dy))} ${dy > 0 ? 'up' : 'down'}` : ''].filter(Boolean).join(', ') || 'no movement';

  // =================================================================== ROTATION, TRANSLATION & SYMMETRY
  const NGON = { 3: 'equilateral triangle', 4: 'square', 5: 'regular pentagon', 6: 'regular hexagon', 7: 'regular heptagon', 8: 'regular octagon', 9: 'regular nonagon', 10: 'regular decagon' };
  const OTHER = [
    ['rectangle', [[-1.7, -0.9], [1.7, -0.9], [1.7, 0.9], [-1.7, 0.9]], 2],
    ['parallelogram', [[-1.7, -0.8], [0.9, -0.8], [1.7, 0.8], [-0.9, 0.8]], 2],
    ['rhombus', [[0, -1.1], [1.7, 0], [0, 1.1], [-1.7, 0]], 2],
    ['kite', [[0, 1.2], [0.9, 0.5], [0, -1.5], [-0.9, 0.5]], 1],
    ['isosceles trapezium', [[-1.7, -0.8], [1.7, -0.8], [0.8, 0.8], [-0.8, 0.8]], 1],
    ['isosceles triangle', [[-1, -1], [1, -1], [0, 1.6]], 1],
  ];
  function symShape(r) {
    const t = r.int(0, 2);
    if (t === 0) { const n = r.int(3, 10); const pts = []; for (let i = 0; i < n; i++) { const a = 90 + (n % 2 ? 0 : 180 / n) + i * 360 / n; pts.push([1.4 * cosD(a), 1.4 * sinD(a)]); } return { name: NGON[n], art: /^[aeiou]/.test(NGON[n]) ? 'an' : 'a', pts, order: n }; }
    if (t === 1) { const [name, pts, order] = r.pick(OTHER); return { name, art: /^[aeiou]/.test(name) ? 'an' : 'a', pts, order }; }
    const k = r.int(3, 8); const pts = []; for (let i = 0; i < 2 * k; i++) { const a = 90 + i * 180 / k; const rr = i % 2 ? 0.55 : 1.5; pts.push([rr * cosD(a), rr * sinD(a)]); }
    const name = r.pick(['logo', 'badge design', 'star pattern', 'windmill logo', 'tile pattern']); return { name, art: 'a', pts, order: k, design: true };
  }
  const symSvg = (pts) => svgWrap(300, 220, sPoly(pts.map(([x, y]) => [150 + x * 62, 110 - y * 62]), { fill: ACC, fop: 0.15 }) + dot(150, 110), false);

  topic('y9-transformations', 'geometry', 9, 2, 'FH', 'Rotation, Translation & Symmetry', 'Rotational symmetry, translating by a column vector, rotating shapes about a point and invariant points.', [
    ['Order of rotational symmetry',
      'The order of rotational symmetry is the number of times a shape fits exactly onto itself during one full turn (360°). A shape that only fits back at the end of the turn has order 1. The smallest turn that works is 360° ÷ order.',
      (r) => {
        const v = r.int(0, 2);
        if (v === 2) {
          const n = r.pick([2, 3, 4, 5, 6, 8, 9, 10, 12, 15, 18, 20, 24, 30, 36]); const a = 360 / n; const ctx = r.pick(['A shape', 'A wheel hub design', 'A snowflake pattern', 'A company logo', 'A decorative tile']);
          return { html: `${ctx} looks exactly the same each time it is rotated through ${B(deg(a))} about its centre (and at no smaller angle). What is its order of rotational symmetry?`, ...nAns(n), hint: 'How many turns of that size make a full turn of 360°?',
            steps: ['Order of rotational symmetry = number of times the shape fits onto itself in 360°.', `360 ÷ ${a} = ${B(n)}`] };
        }
        const s = symShape(r);
        if (v === 1 && s.order > 1) {
          const a = 360 / s.order;
          return { html: `The diagram shows ${s.art} ${B(s.name)}. It is rotated about its centre (marked with a dot). What is the smallest angle of rotation that makes it look exactly the same again?`, diagram: symSvg(s.pts), ...nAns(a), unit: '°', hint: 'Find the order of rotational symmetry first.',
            steps: [s.design ? `The design has ${s.order} identical points, so it fits onto itself ${s.order} times in a full turn: order ${s.order}.` : `A ${s.name} fits onto itself ${s.order} times in a full turn: order ${s.order}.`, `Smallest angle = 360° ÷ ${s.order} = ${B(deg(a))}`] };
        }
        return { html: `The diagram shows ${s.art} ${B(s.name)}. What is its order of rotational symmetry?`, diagram: symSvg(s.pts), ...nAns(s.order), hint: 'Imagine tracing the shape and turning the tracing paper through 360°. Count how many times it fits.',
          steps: ['Trace the shape, mark the centre, and turn the tracing paper one full turn.',
            s.order === 1 ? 'It only fits back onto itself at the end of the full turn.' : `It fits onto itself every ${deg(360 / s.order)}, which is ${s.order} times in a full turn.`, `Order of rotational symmetry = ${B(s.order)}`] };
      }],
    ['Translating by a column vector',
      'In the column vector (a over b), the top number moves the shape right (positive) or left (negative) and the bottom number moves it up (positive) or down (negative). Every vertex moves by the same amount, so add the vector to each coordinate.',
      (r) => {
        let a, b; do { a = r.int(-5, 5); b = r.int(-5, 5); } while (a === 0 && b === 0);
        const v = r.int(0, 2);
        const hor = a === 0 ? 'no move left or right' : `${Math.abs(a)} ${a > 0 ? 'right' : 'left'}`, ver = b === 0 ? 'no move up or down' : `${Math.abs(b)} ${b > 0 ? 'up' : 'down'}`;
        if (v === 1) {
          let P; do { P = [[0, 0], [r.int(2, 3), 0], [r.pick([0, 1]), r.int(2, 3)]]; const ox = r.int(-6, 3), oy = r.int(-6, 3); P = P.map(([x, y]) => [x + ox, y + oy]); } while (P.some(([x, y]) => Math.abs(x + a) > 7 || Math.abs(y + b) > 7 || Math.abs(x) > 7 || Math.abs(y) > 7));
          const k = r.int(0, 2), L = 'ABC'[k]; const [x, y] = P[k];
          return { html: `Triangle ABC has vertices A${pt(...P[0])}, B${pt(...P[1])} and C${pt(...P[2])}. It is translated by the vector ${colvec(a, b)}. Write down the coordinates of the image of ${B(L)}.`, diagram: cgrid(-7, 7, -7, 7, [{ poly: P, fill: true, labels: ['A', 'B', 'C'] }]), ...pairAns(z(x + a), z(y + b)), hint: 'Add the top number to the x-coordinate and the bottom number to the y-coordinate.',
            steps: [`The vector ${colvec(a, b)} means ${hor}, ${ver}.`, `${L} is at ${pt(x, y)}.`, `x: ${ds(x)} ${a < 0 ? '−' : '+'} ${Math.abs(a)} = ${ds(x + a)}; y: ${ds(y)} ${b < 0 ? '−' : '+'} ${Math.abs(b)} = ${ds(y + b)}`, `Image of ${L} = ${B(pt(z(x + a), z(y + b)))}`] };
        }
        let x, y; do { x = r.int(-6, 6); y = r.int(-6, 6); } while (Math.abs(x + a) > 7 || Math.abs(y + b) > 7);
        if (v === 2) { // reverse
          const ix = x + a, iy = y + b;
          const ctx = r.pick(['A point P is translated by the vector', 'A counter on a board game grid is moved by the vector', 'A robot on a coordinate grid moves by the vector']);
          return { html: `${ctx} ${colvec(a, b)}. It ends up at ${B(pt(ix, iy))}. Where did it start?`, ...pairAns(z(x), z(y)), hint: 'Undo the translation: subtract the vector.',
            steps: ['To go back, move by the opposite vector.', `The opposite of ${colvec(a, b)} is ${colvec(z(-a), z(-b))}.`, `x: ${ds(ix)} ${a > 0 ? '−' : '+'} ${Math.abs(a)} = ${ds(x)}; y: ${ds(iy)} ${b > 0 ? '−' : '+'} ${Math.abs(b)} = ${ds(y)}`, `Start = ${B(pt(z(x), z(y)))}`] };
        }
        return { html: `The point P${pt(x, y)} is translated by the vector ${colvec(a, b)} to P′. Find the coordinates of P′.`, diagram: cgrid(-7, 7, -7, 7, [{ pt: [x, y], label: 'P' }]), ...pairAns(z(x + a), z(y + b)), hint: 'Top number: across. Bottom number: up or down.',
          steps: [`The vector ${colvec(a, b)} means ${hor}, ${ver}.`, `x: ${ds(x)} ${a < 0 ? '−' : '+'} ${Math.abs(a)} = ${ds(x + a)}`, `y: ${ds(y)} ${b < 0 ? '−' : '+'} ${Math.abs(b)} = ${ds(y + b)}`, `P′ = ${B(pt(z(x + a), z(y + b)))}`] };
      }],
    ['Finding the translation vector',
      'To describe a translation, pick one vertex on the original shape and the matching vertex on the image. Count how far it moves across (right +, left −) for the top number and up (+) or down (−) for the bottom number.',
      (r) => {
        const TPL = [[[0, 0], [2, 0], [0, 2]], [[0, 0], [3, 0], [3, 1], [0, 2]], [[0, 0], [2, 0], [2, 1], [1, 1], [1, 2], [0, 2]], [[0, 0], [1, 0], [1, 2], [0, 3]], [[0, 0], [3, 0], [1, 2]]];
        let a, b; do { a = r.int(-6, 6); b = r.int(-6, 6); } while (Math.abs(a) + Math.abs(b) < 2);
        const tpl = r.pick(TPL); const w = Math.max(...tpl.map((p) => p[0])), h = Math.max(...tpl.map((p) => p[1]));
        const ox = r.int(Math.max(-7, -7 - a), Math.min(7 - w, 7 - w - a)), oy = r.int(Math.max(-7, -7 - b), Math.min(7 - h, 7 - h - b));
        const A = tpl.map(([x, y]) => [x + ox, y + oy]), Bs = A.map(([x, y]) => [x + a, y + b]);
        const back = r.chance(0.3);
        const [va, vb] = back ? [z(-a), z(-b)] : [a, b];
        const [from, to] = back ? ['B', 'A'] : ['A', 'B'];
        const P0 = back ? Bs[0] : A[0], P1 = back ? A[0] : Bs[0];
        const intro = r.pick(['The diagram shows shape A and shape B on a coordinate grid.', 'Shape B is a translation of shape A.', 'On the grid, shape A has been translated to give shape B.']);
        return { html: `${intro} Shape ${from} has a corner at ${pt(...P0)}. Write down the column vector that translates shape ${B(from)} onto shape ${B(to)}.`, diagram: cgrid(-7, 7, -7, 7, [{ poly: A, fill: true, name: 'A' }, { poly: Bs, c: '#10b981', fill: true, name: 'B' }]), ...vecAns(va, vb), hint: `Choose a corner of shape ${from} and find the matching corner of shape ${to}.`,
          steps: [`A corner of ${from} at ${pt(...P0)} moves to the matching corner of ${to} at ${pt(...P1)}.`, `Across: ${ds(P1[0])} − ${br(P0[0])} = ${ds(va)} (${va === 0 ? 'no move' : va > 0 ? 'right' : 'left'})`, `Up/down: ${ds(P1[1])} − ${br(P0[1])} = ${ds(vb)} (${vb === 0 ? 'no move' : vb > 0 ? 'up' : 'down'})`, `Vector = ${B(colvec(va, vb))}`] };
      }],
    ['Rotating about the origin',
      'To rotate, you need three facts: the centre, the angle and the direction. Use tracing paper, or the rules for the origin: 90° clockwise (x, y) → (y, −x); 90° anticlockwise (x, y) → (−y, x); 180° (x, y) → (−x, −y).',
      (r) => {
        const key = r.pick(['cw', 'acw', 'half']); const R = ROT[key];
        if (r.chance(0.35)) {
          let P; do { const ox = r.int(1, 4) * r.sign(), oy = r.int(1, 4) * r.sign(); P = [[ox, oy], [ox + r.int(1, 2) * r.sign(), oy], [ox, oy + r.int(1, 2) * r.sign()]]; } while (P.some(([x, y]) => Math.abs(x) > 6 || Math.abs(y) > 6 || (x === 0 && y === 0)));
          const k = r.int(0, 2), L = 'ABC'[k]; const [x, y] = P[k]; const [ix, iy] = R.f(x, y);
          return { html: `Triangle ABC has vertices A${pt(...P[0])}, B${pt(...P[1])} and C${pt(...P[2])}. It is rotated ${B(R.w)} about the origin. Write down the coordinates of the image of ${B(L)}.`, diagram: cgrid(-7, 7, -7, 7, [{ poly: P, fill: true, labels: ['A', 'B', 'C'] }, { pt: [0, 0], cross: true }]), ...pairAns(z(ix), z(iy)), hint: `For ${R.w} about the origin: ${R.rule}.`,
            steps: [`Rotation ${R.w} about O: ${R.rule}`, `${L} = ${pt(x, y)}`, `Image of ${L} = ${B(pt(z(ix), z(iy)))}`, 'Check with tracing paper: the distance from O stays the same.'] };
        }
        let x, y; do { x = r.int(-6, 6); y = r.int(-6, 6); } while ((x === 0 && y === 0) || (r.chance(0.7) && (x === 0 || y === 0)));
        const [ix, iy] = R.f(x, y);
        const ctx = r.pick([`The point P${pt(x, y)} is rotated ${R.w} about the origin.`, `A point P is at ${pt(x, y)}. P is rotated ${R.w} about O${pt(0, 0)}.`, `On a computer game map, a marker at ${pt(x, y)} is rotated ${R.w} about the origin.`]);
        return { html: `${ctx} Find the coordinates of its image.`, diagram: cgrid(-7, 7, -7, 7, [{ pt: [x, y], label: 'P' }, { pt: [0, 0], cross: true }]), ...pairAns(z(ix), z(iy)), hint: `For ${R.w} about the origin: ${R.rule}.`,
          steps: [`Rotation ${R.w} about O: ${R.rule}`, key === 'half' ? `Both coordinates change sign: ${pt(x, y)} → ${pt(z(ix), z(iy))}` : `Swap the coordinates and change the sign of the ${key === 'cw' ? 'new y' : 'new x'}: ${pt(x, y)} → ${pt(z(ix), z(iy))}`, `Image = ${B(pt(z(ix), z(iy)))}`] };
      }],
    ['Rotating about any point & invariant points',
      'To rotate about a point C that is not the origin, find how far the point is from C across and up, rotate that movement, then add it back on to C. A point that does not move under a transformation is invariant — the centre of a rotation, or any point on a mirror line.',
      (r) => {
        const v = r.int(0, 2);
        if (v === 2) { // reflection comparison / invariant
          const vert = r.chance(); const k = r.int(-3, 3);
          let x, y; do { x = r.int(-6, 6); y = r.int(-6, 6); } while ((vert ? Math.abs(2 * k - x) > 7 || x === k : Math.abs(2 * k - y) > 7 || y === k));
          const ix = vert ? 2 * k - x : x, iy = vert ? y : 2 * k - y;
          const d = vert ? Math.abs(x - k) : Math.abs(y - k);
          return { html: `To compare with rotation: point P${pt(x, y)} is ${B('reflected')} in the line ${B(vert ? `<i>x</i> = ${ds(k)}` : `<i>y</i> = ${ds(k)}`)}. Find the coordinates of its image. (A reflection needs only the mirror line; points on the mirror line are invariant.)`, diagram: cgrid(-7, 7, -7, 7, [vert ? { vline: k, label: `x = ${ds(k)}` } : { hline: k, label: `y = ${ds(k)}` }, { pt: [x, y], label: 'P' }]), ...pairAns(z(ix), z(iy)), hint: 'The image is the same distance from the mirror line, on the other side.',
            steps: [`P is ${d} unit${d === 1 ? '' : 's'} ${vert ? (x > k ? 'right of' : 'left of') : (y > k ? 'above' : 'below')} the mirror line.`, `The image is ${d} unit${d === 1 ? '' : 's'} on the other side, so the ${vert ? 'x' : 'y'}-coordinate becomes ${ds(vert ? ix : iy)}.`, `The ${vert ? 'y' : 'x'}-coordinate does not change.`, `Image = ${B(pt(z(ix), z(iy)))}`] };
        }
        const key = r.pick(['cw', 'acw', 'half']); const R = ROT[key];
        let C, P, dx, dy, ix, iy;
        do { C = [r.int(-3, 3), r.int(-3, 3)]; dx = r.int(-4, 4); dy = r.int(-4, 4); P = [C[0] + dx, C[1] + dy]; [ix, iy] = R.f(dx, dy); ix += C[0]; iy += C[1]; }
        while ((dx === 0 && dy === 0) || (C[0] === 0 && C[1] === 0) || [P[0], P[1], ix, iy].some((t) => Math.abs(t) > 7));
        const [rx, ry] = R.f(dx, dy);
        if (v === 1) { // triangle rotated about one of its own vertices
          let Q; do { Q = [C[0] + r.int(-2, 2), C[1] + r.int(-2, 2)]; } while ((Q[0] === C[0] && Q[1] === C[1]) || (Q[0] === P[0] && Q[1] === P[1]) || (Q[0] - C[0]) * (P[1] - C[1]) === (Q[1] - C[1]) * (P[0] - C[0]) || Math.abs(Q[0]) > 7 || Math.abs(Q[1]) > 7);
          return { html: `Triangle PQR has vertices P${pt(...P)}, Q${pt(...Q)} and R${pt(...C)}. It is rotated ${B(R.w)} about R. Which vertex is invariant, and where does P go? Give the coordinates of the image of ${B('P')}.`, diagram: cgrid(-7, 7, -7, 7, [{ poly: [P, Q, C], fill: true, labels: ['P', 'Q', 'R'] }]), ...pairAns(z(ix), z(iy)), hint: 'R is the centre, so it stays put. Work out P’s movement from R and rotate it.',
            steps: [`R is the centre of rotation, so R${pt(...C)} is the invariant point.`, `From R to P: ${mv(dx, dy)}, i.e. ${pt(dx, dy)}.`, `Rotating this ${R.w}: ${pt(dx, dy)} → ${pt(z(rx), z(ry))}`, `Image of P = ${pt(...C)} + ${pt(z(rx), z(ry))} = ${B(pt(z(ix), z(iy)))}`] };
        }
        return { html: `The point A${pt(...P)} is rotated ${B(R.w)} about the point C${pt(...C)}. Find the coordinates of the image of A.`, diagram: cgrid(-7, 7, -7, 7, [{ pt: P, label: 'A' }, { pt: C, label: 'C', cross: true }]), ...pairAns(z(ix), z(iy)), hint: 'Find how A sits relative to C, rotate that, then add it back on to C.',
          steps: [`From C to A: ${mv(dx, dy)} — think of it as ${pt(dx, dy)}.`, `Rotate ${R.w}: ${R.rule}, giving ${pt(z(rx), z(ry))}.`, `Add back on to C: (${ds(C[0])} + ${br(rx)}, ${ds(C[1])} + ${br(ry)})`, `Image = ${B(pt(z(ix), z(iy)))}`] };
      }],
  ]);
  function br(n) { return n < 0 ? `(${ds(n)})` : ds(n); }

  // =================================================================== ENLARGEMENT & SIMILARITY
  const rect = (w, h) => [[0, 0], [w, 0], [w, h], [0, h]];
  const SFS = [[2, 1], [3, 1], [4, 1], [5, 1], [1, 2], [1, 3], [1, 4], [3, 2], [5, 2]];
  const sfHtml = (n, d) => (d === 1 ? ds(n) : fracN(n, d));
  // triangle from base angles A (at P0) and Bang (at P1), base length 1
  function triPts(A, Bang) { const L = sinD(Bang) / sinD(180 - A - Bang); return [[0, 0], [1, 0], [L * cosD(A), L * sinD(A)]]; }
  function trapPts(al, be) { const h = 1.3, b = 4; return [[0, 0], [b, 0], [b - h / Math.tan(be * Math.PI / 180), h], [h / Math.tan(al * Math.PI / 180), h]]; }

  topic('y9-enlargement', 'geometry', 9, 2, 'FH', 'Enlargement & Similarity', 'Recognise similar shapes, find and use scale factors (including fractions) and enlarge shapes from a centre.', [
    ['Recognising similar shapes',
      'Two shapes are similar when one is an enlargement of the other: every pair of corresponding sides is in the same ratio and corresponding angles are equal. Divide each side of one shape by the matching side of the other — if every answer is the same, the shapes are similar.',
      (r) => {
        const a = r.int(2, 6), b = a + r.int(1, 5);
        const ks = [2, 3, 1.5, 2.5, 4, 0.5].filter((k) => Number.isInteger(a * k) && Number.isInteger(b * k));
        const k = r.pick(ks);
        const sim = [a * k, b * k];
        const fakes = [];
        const m = r.int(1, 4); fakes.push([a + m, b + m]);
        fakes.push([a * k, b * k + r.pick([1, 2, -1])]);
        fakes.push([a * k + r.pick([1, 2]), b * k]);
        fakes.push([a * (k + 1), b * k]);
        const fk = []; const seenF = new Set([sim.join()]); for (const f of fakes) if (f[0] > 0 && f[1] > 0 && f[0] * b !== f[1] * a && f[0] !== f[1] && !seenF.has(f.join())) { seenF.add(f.join()); fk.push(f); }
        const ctx = r.pick(['rectangles', 'rectangular photos', 'rectangular flags', 'rectangular tiles']);
        if (fk.length >= 2 && r.chance(0.6)) {
          const opts = r.shuffle([sim, ...r.sample(fk, 2)]); const L = ['B', 'C', 'D']; const right = L[opts.indexOf(sim)];
          return { html: `Rectangle A measures ${B(`${ds(a)} cm by ${ds(b)} cm`)}. Rectangles B, C and D measure ${opts.map(([p, q], i) => `${L[i]}: ${ds(p)} cm by ${ds(q)} cm`).join('; ')}. Which one is similar to A? Type the letter.`,
            diagram: shapesSvg([{ pts: rect(b, a), name: 'A' }, ...opts.map(([p, q], i) => ({ pts: rect(q, p), name: L[i] }))].map((s) => ({ ...s, vis: 1 })), { h: 200, gap: 22, note: false }), ...textAns(right, [right]), format: 'Type B, C or D', hint: 'Check whether both pairs of sides are multiplied by the same number.',
            steps: [...opts.map(([p, q], i) => `${L[i]}: ${ds(p)} ÷ ${a} = ${ds(p / a, 3)}, ${ds(q)} ÷ ${b} = ${ds(q / b, 3)}${p * b === q * a ? ' — the same, so similar' : ' — different, not similar'}`), `${B(right)} is similar to A (scale factor ${ds(k)}).`] };
        }
        const yes = r.chance(); const [p, q] = yes ? sim : r.pick(fk);
        return { html: `Two ${ctx} measure ${B(`${ds(a)} cm by ${ds(b)} cm`)} and ${B(`${ds(p)} cm by ${ds(q)} cm`)}. Are they mathematically similar? Answer yes or no.`, ...textAns(yes ? 'yes' : 'no', yes ? ['yes', 'y', 'yes they are similar', 'similar'] : ['no', 'n', 'not similar', 'no they are not similar']), format: 'Type yes or no', hint: 'Divide each side of the second shape by the matching side of the first.',
          steps: [`Short sides: ${ds(p)} ÷ ${a} = ${ds(p / a, 3)}`, `Long sides: ${ds(q)} ÷ ${b} = ${ds(q / b, 3)}`, yes ? `Both sides are multiplied by the same scale factor (${ds(k)}), so the answer is ${B('yes')}.` : `The multipliers are different, so the answer is ${B('no')} — adding the same amount to each side does not keep the shape the same.`] };
      }],
    ['Finding the scale factor',
      'Scale factor = length on the image ÷ the corresponding length on the original. A scale factor bigger than 1 makes the shape bigger; a scale factor between 0 and 1 (such as ½) makes it smaller.',
      (r) => {
        const [n, d] = r.pick(SFS); const base = r.int(1, 6) * d * r.pick([1, 2]); const img = base * n / d;
        const tri = r.chance();
        const pre = r.pick(['Shape B is an enlargement of shape A.', 'Shapes A and B are similar.', 'A designer enlarges logo A to make logo B.', 'A photo A is resized to make photo B.']);
        const ptsA = tri ? [[0, 0], [3, 0], [0, 2]] : rect(3, 2); const ptsB = ptsA.map(([x, y]) => [x, y]);
        const vis = Math.max(0.5, Math.min(2, n / d));
        return { html: `${pre} The side marked ${B(`${base} cm`)} on A corresponds to the side marked ${B(`${ds(img)} cm`)} on B. Work out the scale factor of the enlargement from A to B.`, diagram: shapesSvg([{ pts: ptsA, sides: [`${base} cm`], hi: [0], name: 'A', vis: 1 }, { pts: ptsB, sides: [`${ds(img)} cm`], hi: [0], name: 'B', vis }]), ...fAns(img, base, { simplest: false }), format: 'Give a whole number or a fraction, e.g. 3 or 1/2', hint: 'Image length ÷ original length.',
          steps: [`Scale factor = image ÷ original = ${ds(img)} ÷ ${base}`, `= ${d === 1 ? B(ds(n)) : `${fracN(img, base)} = ${B(fracN(n, d))}`}`, n < d ? 'The scale factor is less than 1, so B is smaller than A.' : 'The scale factor is greater than 1, so B is bigger than A.'] };
      }],
    ['Enlarging lengths by a scale factor',
      'When a shape is enlarged, every length is multiplied by the scale factor. For a fractional scale factor such as ⅓, multiplying by ⅓ is the same as dividing by 3. Angles do not change.',
      (r) => {
        const [n, d] = r.pick(SFS); let w = r.int(1, 6) * d, h = r.int(1, 5) * d; if (w < h) [w, h] = [h, w]; if (w === h) w += d; const k = n / d;
        const v = r.int(0, 2);
        const sfT = sfHtml(n, d);
        const nm = r.pick(['rectangle', 'rectangular garden plan', 'rectangular sign', 'picture frame']);
        const diagram = shapesSvg([{ pts: rect(w, h), sides: [`${w} cm`, `${h} cm`], name: '' }], { h: 200 });
        if (v === 0) {
          const which = r.chance() ? [w, 'length'] : [h, 'width'];
          return { html: `A ${nm} is ${B(`${w} cm`)} long and ${B(`${h} cm`)} wide. It is enlarged by scale factor ${B(sfT)}. Work out the new ${which[1]}.`, diagram, unit: 'cm', ...nAns(which[0] * k, { unit: 'cm' }), hint: 'Multiply the length by the scale factor.',
            steps: [`New ${which[1]} = ${which[0]} × ${sfT}`, d === 1 ? `= ${B(ds(which[0] * k))} cm` : `= ${which[0]} ÷ ${d} × ${n} = ${B(ds(which[0] * k))} cm`] };
        }
        if (v === 1) {
          const P = 2 * (w + h);
          return { html: `A ${nm} measures ${B(`${w} cm`)} by ${B(`${h} cm`)}. It is enlarged by scale factor ${B(sfT)}. Work out the perimeter of the enlarged shape.`, diagram, unit: 'cm', ...nAns(P * k, { unit: 'cm' }), hint: 'Either enlarge each side, or multiply the original perimeter by the scale factor.',
            steps: [`New sides: ${w} × ${sfT} = ${ds(w * k)} cm and ${h} × ${sfT} = ${ds(h * k)} cm`, `Perimeter = 2 × (${ds(w * k)} + ${ds(h * k)}) = ${B(ds(P * k))} cm`, `(Check: original perimeter ${P} cm × ${sfT} = ${ds(P * k)} cm)`] };
        }
        const img = w * k;
        return { html: `A shape is enlarged by scale factor ${B(sfT)}. A side on the enlarged shape is ${B(`${ds(img)} cm`)}. How long was this side on the original shape?`, unit: 'cm', ...nAns(w, { unit: 'cm' }), hint: 'Work backwards: divide by the scale factor.',
          steps: ['Image length = original × scale factor, so original = image ÷ scale factor.', `Original = ${ds(img)} ÷ ${sfT}`, `= ${B(w)} cm`] };
      }],
    ['Enlarging from a centre',
      'To enlarge from a centre C, find how far each vertex is from C (across and up), multiply those distances by the scale factor, and measure them from C again. With a scale factor of ½ the image is half as far from C.',
      (r) => {
        const [n, d] = r.pick([[2, 1], [2, 1], [3, 1], [1, 2], [3, 2]]); const k = n / d;
        let C, D, P, I;
        for (;;) {
          C = [r.int(0, 8), r.int(0, 8)];
          const m = d === 2 ? 2 : 1, lim = k >= 3 ? 2 : d === 2 ? 4 : 3;
          D = [0, 1, 2].map(() => [r.int(-lim, lim) * m, r.int(-lim, lim) * m].map((t) => (d === 2 ? Math.round(t / 2) * 2 : t)));
          P = D.map(([x, y]) => [C[0] + x, C[1] + y]); I = D.map(([x, y]) => [C[0] + x * k, C[1] + y * k]);
          const area = (D[1][0] - D[0][0]) * (D[2][1] - D[0][1]) - (D[2][0] - D[0][0]) * (D[1][1] - D[0][1]);
          if (area !== 0 && D.every(([x, y]) => x || y) && [...P, ...I].every(([x, y]) => x >= 0 && y >= 0 && x <= 12 && y <= 12)) break;
        }
        const j = r.int(0, 2), L = 'ABC'[j]; const [dx, dy] = D[j];
        const sfT = sfHtml(n, d);
        const diagram = cgrid(0, 12, 0, 12, [{ poly: P, fill: true, labels: ['A', 'B', 'C'].map((s) => s) }, { pt: C, label: 'O', cross: true }]);
        if (r.chance(0.25)) {
          return { html: `Triangle ABC has vertices A${pt(...P[0])}, B${pt(...P[1])} and C${pt(...P[2])}. It is enlarged with centre O${pt(...C)}. The image of ${L} is at ${B(pt(...I[j]))}. Work out the scale factor.`, diagram, ...fAns(n, d, { simplest: false }), format: 'Give a whole number or a fraction, e.g. 3 or 1/2', hint: 'Compare the distance from O to the image with the distance from O to the original.',
            steps: [`From O to ${L}: ${pt(dx, dy)} (across, up)`, `From O to the image: ${pt(dx * k, dy * k)}`, `Scale factor = ${ds(dx ? dx * k : dy * k)} ÷ ${ds(dx || dy)} = ${B(sfT)}`] };
        }
        return { html: `Triangle ABC has vertices A${pt(...P[0])}, B${pt(...P[1])} and C${pt(...P[2])}. It is enlarged by scale factor ${B(sfT)} with centre of enlargement O${pt(...C)}. Find the coordinates of the image of ${B(L)}.`, diagram, ...pairAns(I[j][0], I[j][1]), hint: 'Find how far the vertex is from the centre, multiply by the scale factor, and measure from the centre again.',
          steps: [`From O${pt(...C)} to ${L}${pt(...P[j])}: ${mv(dx, dy)}.`, `Multiply by ${sfT}: ${mv(dx * k, dy * k)}.`, `From O: (${ds(C[0])} + ${br(dx * k)}, ${ds(C[1])} + ${br(dy * k)})`, `Image of ${L} = ${B(pt(...I[j]))}`] };
      }],
    ['Missing sides and angles in similar shapes',
      'In similar shapes, find the scale factor from a pair of corresponding sides you know, then multiply (to go to the bigger shape) or divide (to go to the smaller shape). Enlargement does not change angles, so corresponding angles are equal.',
      (r) => {
        const tri = r.chance();
        let pts, angs;
        if (tri) { let A, Bb; do { A = r.int(7, 16) * 5; Bb = r.int(7, 16) * 5; } while (180 - A - Bb < 30); pts = triPts(A, Bb); angs = [A, Bb, 180 - A - Bb]; }
        else { const al = r.int(10, 16) * 5, be = r.int(10, 16) * 5; pts = trapPts(al, be); angs = [al, be, 180 - be, 180 - al]; }
        const k = r.pick([2, 3, 1.5, 2.5, 4]); const vis = Math.min(1.8, k);
        const name = tri ? 'triangles' : 'trapeziums';
        if (r.chance(0.4)) { // angles
          const lab = [[], []];
          if (tri) {
            const miss = r.int(0, 2); const kn = [0, 1, 2].filter((i) => i !== miss);
            kn.forEach((i) => { lab[0][i] = deg(angs[i]); }); lab[1][miss] = 'y';
            return { html: `The two ${name} are similar. The smaller triangle has angles of ${deg(angs[kn[0]])} and ${deg(angs[kn[1]])}. Find the angle ${B('<i>y</i>')} in the larger triangle.`, diagram: shapesSvg([{ pts, angs: lab[0] }, { pts, angs: lab[1], vis }]), ...nAns(angs[miss]), unit: '°', answerLabel: 'y =', hint: 'Angles do not change in an enlargement. Use the angle sum of a triangle.',
              steps: [`Angles in a triangle add up to 180°, so the third angle of the small triangle is 180 − ${angs[kn[0]]} − ${angs[kn[1]]} = ${angs[miss]}°.`, 'Similar shapes have equal corresponding angles.', `<i>y</i> = ${B(deg(angs[miss]))}`] };
          }
          const i = r.int(0, 3);
          if (r.chance()) { lab[0][i] = deg(angs[i]); lab[1][i] = 'y';
            return { html: `The two ${name} are similar. One angle of the smaller trapezium is ${deg(angs[i])}. Find the angle ${B('<i>y</i>')}.`, diagram: shapesSvg([{ pts, angs: lab[0] }, { pts, angs: lab[1], vis }]), ...nAns(angs[i]), unit: '°', answerLabel: 'y =', hint: 'What happens to angles when a shape is enlarged?',
              steps: [`<i>y</i> is in the corresponding position to the ${angs[i]}° angle.`, 'Enlargement does not change angle sizes.', `<i>y</i> = ${B(deg(angs[i]))}`] }; }
          const pair = [3, 2, 1, 0][i]; lab[0][i] = deg(angs[i]); lab[1][pair] = 'y';
          return { html: `The two ${name} are similar (the top and bottom sides are parallel). The smaller trapezium has an angle of ${deg(angs[i])}. Find the angle ${B('<i>y</i>')}.`, diagram: shapesSvg([{ pts, angs: lab[0] }, { pts, angs: lab[1], vis }]), ...nAns(angs[pair]), unit: '°', answerLabel: 'y =', hint: 'Copy the known angle into the larger shape first, then use co-interior angles.',
            steps: [`The angle corresponding to ${angs[i]}° in the larger trapezium is also ${angs[i]}°.`, `It and <i>y</i> lie between the parallel sides on the same slanted side, so they are co-interior and add up to 180°.`, `<i>y</i> = 180 − ${angs[i]} = ${B(deg(angs[pair]))}`] };
        }
        // sides
        const nE = pts.length; const known = r.int(0, nE - 1); let ask; do { ask = r.int(0, nE - 1); } while (ask === known);
        const base = r.int(2, 8) * 2; const other = r.int(2, 9) * 2;
        const s1 = [], s2 = [];
        s1[known] = `${base} cm`; s2[known] = `${ds(base * k)} cm`;
        const up = r.chance(); let ans;
        if (up) { s1[ask] = `${other} cm`; s2[ask] = 'x'; ans = other * k; } else { s1[ask] = 'x'; s2[ask] = `${ds(other * k)} cm`; ans = other; }
        return { html: `The two ${name} are similar. The highlighted sides correspond: ${base} cm on the smaller shape and ${ds(base * k)} cm on the larger. ${up ? `Another side of the smaller shape is ${other} cm.` : `Another side of the larger shape is ${ds(other * k)} cm.`} Work out the length ${B('<i>x</i>')}.`, diagram: shapesSvg([{ pts, sides: s1, hi: [known] }, { pts, sides: s2, hi: [known], vis }]), unit: 'cm', answerLabel: 'x =', ...nAns(ans, { unit: 'cm' }), hint: 'Use the highlighted pair of corresponding sides to find the scale factor.',
          steps: [`Corresponding sides: ${base} cm and ${ds(base * k)} cm.`, `Scale factor = ${ds(base * k)} ÷ ${base} = ${ds(k)}`, up ? `<i>x</i> is on the larger shape: <i>x</i> = ${other} × ${ds(k)}` : `<i>x</i> is on the smaller shape: <i>x</i> = ${ds(other * k)} ÷ ${ds(k)}`, `<i>x</i> = ${B(ds(ans))} cm`] };
      }],
  ]);

  // =================================================================== RATES: GRAPHS, FLOW, UNITS
  const SETS = [
    { tu: 'hours', du: 'km', su: 'km/h', tStep: 0.5, dStep: 10, ts: [0.5, 1, 1.5, 2], stops: [0.5, 1], dLab: 2, tLab: 2 },
    { tu: 'minutes', du: 'm', su: 'm/min', tStep: 5, dStep: 100, ts: [5, 10, 15, 20], stops: [5, 10], dLab: 2, tLab: 2 },
    { tu: 'minutes', du: 'km', su: 'km/h', tStep: 10, dStep: 2, ts: [10, 20, 30], stops: [10, 20], dLab: 2, tLab: 1, toHour: true },
  ];
  function journey(r) {
    const S = r.pick(SETS);
    for (;;) {
      const legs = []; let t = 0, d = 0;
      const out1 = r.pick(S.ts), d1 = r.int(2, 5) * S.dStep;
      legs.push({ move: true, t0: t, t1: t + out1, d0: d, d1: d + d1 }); t += out1; d += d1;
      const st1 = r.pick(S.stops); legs.push({ move: false, t0: t, t1: t + st1, d0: d, d1: d }); t += st1;
      if (r.chance(0.6)) { const o2 = r.pick(S.ts), dd = r.int(1, 3) * S.dStep; legs.push({ move: true, t0: t, t1: t + o2, d0: d, d1: d + dd }); t += o2; d += dd; const st2 = r.pick(S.stops); legs.push({ move: false, t0: t, t1: t + st2, d0: d, d1: d }); t += st2; }
      const back = r.pick(S.ts); legs.push({ move: true, t0: t, t1: t + back, d0: d, d1: 0 }); t += back;
      const speeds = legs.filter((l) => l.move).map((l) => Math.abs(l.d1 - l.d0) / (l.t1 - l.t0) * (S.toHour ? 60 : 1));
      if (t / S.tStep > 18 || d / S.dStep > 9 || speeds.some((s) => !Number.isInteger(s * 2))) continue;
      const tMax = Math.ceil(t / S.tStep) * S.tStep, dMax = (Math.ceil(d / S.dStep) + 1) * S.dStep;
      const pts = [[0, 0], ...legs.map((l) => [l.t1, l.d1])];
      const diagram = lineGraph({ xMax: tMax, yMax: dMax, xStep: S.tStep, yStep: S.dStep, xLab: S.tLab, yLab: S.dLab, xl: `Time (${S.tu})`, yl: `Distance from home (${S.du})`, lines: [pts] });
      return { S, legs, t, d, diagram };
    }
  }
  const who = (r) => r.pick(['Sam', 'Priya', 'Leo', 'Aisha', 'Tom', 'Zara', 'Ben', 'Maya']);
  const tunit = (S, v) => `${ds(v)} ${S.tu === 'hours' ? (v === 1 ? 'hour' : 'hours') : (v === 1 ? 'minute' : 'minutes')}`;

  topic('y9-rates-graphs', 'ratio', 9, 3, 'FH', 'Rates: Distance–Time Graphs, Flow & Units', 'Read distance–time graphs, solve flow-rate problems, convert rates between units and interpret rates of change.', [
    ['Speed from a distance–time graph',
      'On a distance–time graph the gradient (steepness) is the speed: speed = distance travelled ÷ time taken for that section. A steeper line means a faster speed, and a line sloping back down to 0 is the return journey.',
      (r) => {
        const { S, legs, diagram } = journey(r); const name = who(r);
        const moves = legs.filter((l) => l.move); const pick = r.pick(['first', 'return', ...(moves.length > 2 ? ['second'] : [])]);
        const L = pick === 'first' ? moves[0] : pick === 'return' ? moves[moves.length - 1] : moves[1];
        const dist = Math.abs(L.d1 - L.d0), time = L.t1 - L.t0; const sp = dist / time * (S.toHour ? 60 : 1);
        const desc = pick === 'first' ? 'the first part of the journey' : pick === 'return' ? 'the journey back home' : 'the second time they are moving away from home';
        const mode = r.pick(['cycles', 'walks', 'runs', 'drives', 'rides a scooter']);
        return { html: `${name} ${mode} from home and back again. The distance–time graph shows the journey. Work out ${name}’s speed, in ${B(S.su)}, for ${desc}.`, diagram, unit: S.su, ...nAns(sp, { unit: S.su }), hint: 'Speed = distance ÷ time for that straight section of the graph.',
          steps: [`This section runs from ${tunit(S, L.t0)} to ${tunit(S, L.t1)}: time = ${tunit(S, time)}.`, `Distance covered = ${ds(dist)} ${S.du}.`,
            S.toHour ? `${time} minutes = ${fracS(time, 60)} hour, so speed = ${ds(dist)} ÷ ${fracS(time, 60)} = ${ds(dist)} × ${ds(60 / time, 3)}` : `Speed = ${ds(dist)} ÷ ${ds(time)}`, `= ${B(ds(sp))} ${S.su}`] };
      }],
    ['Reading distance–time graphs',
      'A horizontal line means no distance is changing — the person is stationary. Read times along the bottom and distances up the side. The total distance travelled counts the journey out and the journey back.',
      (r) => {
        const { S, legs, t, d, diagram } = journey(r); const name = who(r);
        const v = r.int(0, 3);
        if (v === 0) {
          const stops = legs.filter((l) => !l.move); const tot = stops.reduce((a, l) => a + l.t1 - l.t0, 0); const inMin = S.tu === 'hours';
          return { html: `${name}’s journey is shown on the distance–time graph. For how many ${B('minutes')} in total was ${name} stationary?`, diagram, unit: 'minutes', ...nAns(inMin ? tot * 60 : tot, { unit: 'minutes' }), hint: 'Stationary = horizontal sections of the graph.',
            steps: [`Horizontal sections: ${stops.map((l) => `${ds(l.t0)} to ${ds(l.t1)}`).join(' and ')} (${S.tu}).`, `Total = ${inMin ? ds(tot) : B(ds(tot))} ${S.tu}`, ...(inMin ? [`${ds(tot)} hours × 60 = ${B(ds(tot * 60))} minutes`] : [])] };
        }
        if (v === 1) {
          return { html: `The graph shows ${name}’s journey from home and back. What is the total distance ${name} travelled?`, diagram, unit: S.du, ...nAns(2 * d, { unit: S.du }), hint: 'Add the distance going out and the distance coming back.',
            steps: [`The furthest point from home is ${ds(d)} ${S.du}.`, `Going out: ${ds(d)} ${S.du}; coming back: ${ds(d)} ${S.du}.`, `Total = ${B(ds(2 * d))} ${S.du}`] };
        }
        if (v === 2) {
          const st = r.pick(legs.filter((l) => !l.move)); const tm = st.t0 + (r.chance() ? 0 : st.t1 - st.t0);
          return { html: `Use the distance–time graph of ${name}’s journey. How far from home was ${name} after ${B(tunit(S, tm))}?`, diagram, unit: S.du, ...nAns(st.d0, { unit: S.du }), hint: 'Go up from the time axis to the line, then across to the distance axis.',
            steps: [`Find ${ds(tm)} on the time axis and go up to the graph.`, `Read across: ${B(ds(st.d0))} ${S.du} from home (a horizontal section, so ${name} was stopped).`] };
        }
        const mv = legs.filter((l) => l.move); const sp = mv.map((l) => Math.abs(l.d1 - l.d0) / (l.t1 - l.t0) * (S.toHour ? 60 : 1)); const mx = Math.max(...sp);
        if (sp.filter((s) => s === mx).length > 1) {
          return { html: `Use the distance–time graph of ${name}’s journey. At what time (in ${S.tu} from the start) did ${name} arrive back home?`, diagram, unit: S.tu, ...nAns(t, { unit: S.tu }), hint: 'Where does the graph return to a distance of 0?',
            steps: ['Home is where the distance from home is 0.', `The graph returns to 0 at ${B(ds(t))} ${S.tu}.`] };
        }
        return { html: `Use the distance–time graph of ${name}’s journey. What was ${name}’s fastest speed, in ${B(S.su)}?`, diagram, unit: S.su, ...nAns(mx, { unit: S.su }), hint: 'The steepest section is the fastest. Work out its speed.',
          steps: [`Speeds of the moving sections: ${sp.map((s) => `${ds(s)} ${S.su}`).join(', ')}.`, 'The steepest line gives the greatest speed.', `Fastest speed = ${B(ds(mx))} ${S.su}`] };
      }],
    ['Flow rates and filling times',
      'A flow rate tells you how much liquid passes per unit of time, e.g. litres per minute. Time = volume ÷ rate, volume = rate × time, rate = volume ÷ time. Make sure volumes are in the same unit as the rate (1 litre = 1000 cm³ = 1000 ml).',
      (r) => {
        const v = r.int(0, 4); const thing = r.pick(['bath', 'paddling pool', 'water tank', 'fish tank', 'water butt', 'garden pond']);
        if (v === 0) { const rate = r.int(2, 25), tm = r.int(3, 40); const V = rate * tm;
          return { html: `A ${thing} holds ${B(`${V} litres`)}. It is filled from a tap at a constant rate of ${B(`${rate} litres per minute`)}. How many minutes does it take to fill?`, unit: 'minutes', ...nAns(tm, { unit: 'minutes' }), hint: 'Time = volume ÷ rate.', steps: ['Time = volume ÷ rate', `= ${V} ÷ ${rate} = ${B(tm)} minutes`] }; }
        if (v === 1) { const rate = r.int(2, 30), tm = r.int(4, 30); const V = rate * tm;
          return { html: `A ${thing} holding ${B(`${V} litres`)} of water is emptied at a constant rate in ${B(`${tm} minutes`)}. Work out the rate of flow in litres per minute.`, unit: 'litres/min', ...nAns(rate, { unit: 'litres per minute' }), hint: 'Rate = volume ÷ time.', steps: ['Rate = volume ÷ time', `= ${V} ÷ ${tm} = ${B(rate)} litres per minute`] }; }
        if (v === 2) {
          let l, w, h, rate, Vl, tm; do { l = r.int(4, 12) * 10; w = r.int(3, 8) * 10; h = r.int(3, 8) * 10; Vl = l * w * h / 1000; rate = r.pick([2, 3, 4, 5, 6, 8, 10, 12, 15, 20]); tm = Vl / rate; } while (!Number.isInteger(tm) || tm > 120);
          return { html: `A cuboid ${r.pick(['fish tank', 'water tank', 'storage tank'])} measures ${B(`${l} cm by ${w} cm by ${h} cm`)}. It is filled with water at ${B(`${rate} litres per minute`)}. How long, in minutes, does it take to fill the empty tank? (1 litre = 1000 cm³)`, unit: 'minutes', ...nAns(tm, { unit: 'minutes' }), hint: 'Find the volume in cm³, change it to litres, then divide by the rate.',
            steps: [`Volume = ${l} × ${w} × ${h} = ${ds(l * w * h)} cm³`, `In litres: ${ds(l * w * h)} ÷ 1000 = ${ds(Vl)} litres`, `Time = ${ds(Vl)} ÷ ${rate} = ${B(ds(tm))} minutes`] };
        }
        if (v === 3) { const cap = r.int(6, 40) * 10; const have = r.int(1, cap / 10 - 2) * 10; const rate = r.pick([5, 10, 20, 25, 40, 50].filter((x) => (cap - have) % x === 0)) || 10; const tm = (cap - have) / rate;
          return { html: `A ${thing} can hold ${B(`${cap} litres`)}. It already contains ${B(`${have} litres`)}. Water flows in at ${B(`${rate} litres per minute`)}. How many more minutes until it is full?`, unit: 'minutes', ...nAns(tm, { unit: 'minutes' }), hint: 'First work out how much more water is needed.',
            steps: [`Still needed: ${cap} − ${have} = ${cap - have} litres`, `Time = ${cap - have} ÷ ${rate} = ${B(ds(tm))} minutes`] }; }
        const ml = r.pick([50, 100, 125, 200, 250, 400, 500]); let L; do { L = r.int(2, 60); } while ((L * 1000) % ml);
        const sec = L * 1000 / ml; const askMin = sec % 60 === 0 && r.chance();
        return { html: `A pump moves water at ${B(`${ml} ml per second`)}. How long does it take to pump ${B(`${L} litres`)}? Give your answer in ${askMin ? 'minutes' : 'seconds'}.`, unit: askMin ? 'minutes' : 'seconds', ...nAns(askMin ? sec / 60 : sec, { unit: askMin ? 'minutes' : 'seconds' }), hint: 'Change litres to ml so the units match the rate.',
          steps: [`${L} litres = ${ds(L * 1000)} ml`, `Time = ${ds(L * 1000)} ÷ ${ml} = ${askMin ? ds(sec) : B(ds(sec))} seconds`, ...(askMin ? [`${ds(sec)} ÷ 60 = ${B(ds(sec / 60))} minutes`] : [])] };
      }],
    ['Converting rates between units',
      'Convert a rate one unit at a time. For m/s to km/h: multiply by 3600 (seconds in an hour) and divide by 1000 (metres in a km), i.e. × 3.6. For litres per minute to ml per second: × 1000 then ÷ 60.',
      (r) => {
        const v = r.int(0, 5);
        if (v === 0) { const ms = r.int(2, 40);
          return { html: `${r.pick(['A cyclist travels', 'A train moves', 'A sprinter runs', 'A drone flies', 'A car travels'])} at ${B(`${ms} m/s`)}. Convert this speed to km/h.`, unit: 'km/h', ...nAns(ms * 3.6, { unit: 'km/h' }), hint: 'Metres per hour first (× 3600), then kilometres (÷ 1000).',
            steps: [`In one hour: ${ms} × 3600 = ${ds(ms * 3600)} metres`, `${ds(ms * 3600)} ÷ 1000 = ${B(ds(ms * 3.6))} km/h`] }; }
        if (v === 1) { const ms = r.int(1, 30); const kmh = ms * 18 / 5;
          return { html: `${r.pick(['A bus travels', 'A boat sails', 'A horse gallops', 'A lorry drives'])} at ${B(`${ds(kmh)} km/h`)}. Convert this speed to metres per second.`, unit: 'm/s', ...nAns(ms, { unit: 'm/s' }), hint: 'Change km to m (× 1000), then hours to seconds (÷ 3600).',
            steps: [`${ds(kmh)} km/h = ${ds(kmh * 1000)} metres per hour`, `÷ 3600 seconds = ${B(ds(ms))} m/s`] }; }
        if (v === 2) { const lpm = r.int(1, 30) * 3; const mls = lpm * 1000 / 60;
          return { html: `Water flows from a ${r.pick(['hose', 'tap', 'pipe', 'shower'])} at ${B(`${lpm} litres per minute`)}. Convert this rate to millilitres per second.`, unit: 'ml/s', ...nAns(mls, { unit: 'ml/s' }), hint: 'Litres to ml (× 1000), then per minute to per second (÷ 60).',
            steps: [`${lpm} litres per minute = ${ds(lpm * 1000)} ml per minute`, `÷ 60 = ${B(ds(mls))} ml per second`] }; }
        if (v === 3) { const mls = r.int(1, 40) * 25; const lpm = mls * 60 / 1000;
          return { html: `A pump moves liquid at ${B(`${mls} ml per second`)}. Convert this rate to litres per minute.`, unit: 'litres/min', ...nAns(lpm, { unit: 'litres per minute' }), hint: 'Per second to per minute (× 60), then ml to litres (÷ 1000).',
            steps: [`${mls} ml/s × 60 = ${ds(mls * 60)} ml per minute`, `÷ 1000 = ${B(ds(lpm))} litres per minute`] }; }
        if (v === 4) { const kmh = r.int(1, 20) * 3; const mpm = kmh * 1000 / 60;
          return { html: `${r.pick(['A walker', 'A jogger', 'A tractor', 'A rowing boat'])} moves at ${B(`${kmh} km/h`)}. How many metres does it travel per minute?`, unit: 'm/min', ...nAns(mpm, { unit: 'm/min' }), hint: 'km to m (× 1000), then per hour to per minute (÷ 60).',
            steps: [`${kmh} km/h = ${ds(kmh * 1000)} metres per hour`, `÷ 60 = ${B(ds(mpm))} metres per minute`] }; }
        const ph = r.int(3, 18) * 3; const ppm = ph * 100 / 60;
        return { html: `${r.pick(['A parking meter charges', 'A tutor charges', 'A bike hire shop charges', 'A games arcade charges'])} ${B(`£${ph} per hour`)}. What is this rate in ${B('pence per minute')}?`, unit: 'p/min', ...nAns(ppm, { unit: 'p per minute' }), hint: '£ to pence (× 100), then per hour to per minute (÷ 60).',
          steps: [`£${ph} = ${ph * 100}p per hour`, `${ph * 100} ÷ 60 = ${B(ds(ppm))}p per minute`] };
      }],
    ['Rates of change and their units',
      'The gradient of a straight-line graph is a rate of change: change in the vertical quantity ÷ change in the horizontal quantity. Its unit is "vertical unit per horizontal unit", e.g. cm per minute, £ per mile or °C per minute.',
      (r) => {
        const v = r.int(0, 4);
        const ask = (o) => {
          const { x1, x2, y1, y2 } = o; const g = (y2 - y1) / (x2 - x1);
          const diagram = lineGraph({ xMax: o.xMax, yMax: o.yMax, xStep: o.xStep, yStep: o.yStep, xLab: o.xLab || 1, yLab: o.yLab || 1, xl: o.xl, yl: o.yl, lines: [[[0, o.c], [o.xEnd, o.c + o.m * o.xEnd]]], marks: [[x1, y1], [x2, y2]] });
          return { ...(o.pre ? { answerLabel: o.pre } : {}), html: `${o.html} The line passes through the marked points (${ds(x1)}, ${ds(y1)}) and (${ds(x2)}, ${ds(y2)}).`, diagram, unit: o.unit, ...nAns(Math.abs(g), { unit: o.unit }), hint: 'Pick two points on the line: change in the vertical value ÷ change in the horizontal value.',
            steps: [`Use the marked points (${ds(x1)}, ${ds(y1)}) and (${ds(x2)}, ${ds(y2)}).`, `Change in ${o.yq}: ${ds(y2)} − ${ds(y1)} = ${ds(y2 - y1)}; change in ${o.xq}: ${ds(x2)} − ${ds(x1)} = ${ds(x2 - x1)}`, `Rate = ${ds(Math.abs(y2 - y1))} ÷ ${ds(x2 - x1)} = ${B((o.pre || '') + ds(Math.abs(g)))} ${o.unit}`, o.meaning] };
        };
        if (v === 0) { const m = r.pick([1, 1.5, 2, 2.5, 3, 4, 5]); const c = r.pick([0, 0, 5, 10]); const xEnd = 10; const x1 = r.int(1, 3) * 2, x2 = x1 + r.int(1, 3) * 2;
          return ask({ m, c, xEnd, x1, x2, y1: c + m * x1, y2: c + m * x2, xMax: 10, xStep: 1, xLab: 2, yMax: Math.ceil((c + m * 10) / 10) * 10, yStep: 5, yLab: 2, xl: 'Time (minutes)', yl: 'Depth (cm)', unit: 'cm/min', yq: 'depth', xq: 'time',
            html: `A ${r.pick(['tank', 'container', 'paddling pool', 'cylinder'])} is filled at a constant rate. The graph shows the depth of water. Work out the rate at which the depth increases, in cm per minute.`, meaning: `The depth rises by ${ds(m)} cm every minute.` }); }
        if (v === 1) { const m = r.pick([1.5, 2, 2.5, 3]); const c = r.pick([2, 3, 4, 5]); const x1 = r.int(1, 3) * 2, x2 = x1 + r.int(1, 3) * 2;
          return ask({ m, c, xEnd: 10, x1, x2, y1: c + m * x1, y2: c + m * x2, xMax: 10, xStep: 1, xLab: 2, yMax: Math.ceil((c + m * 10) / 5) * 5, yStep: 5, xl: 'Distance (miles)', yl: 'Fare (£)', unit: 'per mile', pre: '£', yq: 'fare', xq: 'distance',
            html: `The graph shows the cost of a taxi journey. There is a fixed starting charge of £${c}. Work out the cost per mile (the gradient).`, meaning: `Each extra mile costs £${ds(m)}; the £${c} where the line meets the axis is the fixed charge.` }); }
        if (v === 2) { const h0 = r.pick([20, 24, 30, 36, 40]); const m = -r.pick([2, 3, 4, 5, 6].filter((k) => h0 % k === 0 && h0 / k <= 10)); const xEnd = h0 / -m; const x1 = r.int(0, Math.floor(xEnd / 2) - 1), x2 = x1 + r.int(1, Math.floor(xEnd / 2));
          return ask({ m, c: h0, xEnd, x1, x2, y1: h0 + m * x1, y2: h0 + m * x2, xMax: 10, xStep: 1, xLab: 2, yMax: 40, yStep: 5, yLab: 2, xl: 'Time (hours)', yl: 'Height of candle (cm)', unit: 'cm per hour', yq: 'height', xq: 'time',
            html: `The graph shows the height of a candle as it burns. At what rate does the height decrease, in cm per hour?`, meaning: `The negative gradient (${ds(m)}) shows a decrease: the candle gets ${ds(-m)} cm shorter each hour.` }); }
        if (v === 3) { const m = r.pick([1.1, 1.15, 1.2, 1.25, 1.4, 1.5]); const x1 = 0, x2 = r.pick([20, 40, 60, 80]); const x2b = m * x2;
          return ask({ m, c: 0, xEnd: 100, x1, x2, y1: 0, y2: x2b, xMax: 100, xStep: 10, xLab: 2, yMax: 160, yStep: 20, yLab: 2, xl: 'Pounds (£)', yl: 'Euros (€)', unit: 'euros per pound', yq: 'euros', xq: 'pounds',
            html: `The conversion graph changes pounds (£) into euros (€). Use its gradient to find the exchange rate in euros per pound.`, meaning: `£1 is worth €${ds(m)}.` }); }
        const m = r.pick([2, 3, 4, 5, 6, 8, 10]); const c = r.pick([10, 15, 20]); const x1 = r.int(1, 4), x2 = x1 + r.int(2, 5);
        return ask({ m, c, xEnd: 10, x1, x2, y1: c + m * x1, y2: c + m * x2, xMax: 10, xStep: 1, xLab: 2, yMax: Math.ceil((c + m * 10) / 20) * 20, yStep: 10, yLab: 2, xl: 'Time (minutes)', yl: 'Temperature (°C)', unit: '°C per minute', yq: 'temperature', xq: 'time',
          html: `An oven heats up steadily. The graph shows its temperature. Work out the rate of change of temperature, in °C per minute.`, meaning: `The temperature rises ${ds(m)} °C every minute.` });
      }],
  ]);

  // =================================================================== PROBABILITY: INDEPENDENT EVENTS, VENN, TWO-WAY TABLES
  const p2 = (h) => ps(h / 100); // hundredths -> decimal string
  function split(r, total, cnt, min) { // random positive parts (each >= min) summing to total
    for (;;) { const parts = []; let left = total; for (let i = 0; i < cnt - 1; i++) { const p = r.int(min, Math.max(min, Math.floor(2 * left / (cnt - i)) - min)); parts.push(p); left -= p; } parts.push(left); if (parts.every((p) => p >= min)) return parts; }
  }
  function vennSvg(a, both, b, out, la, lb) {
    let body = `<rect x="12" y="12" width="336" height="196" rx="4" fill="none" stroke="currentColor" stroke-width="2"/>`;
    body += sC(140, 112, 78, { c: ACC, fill: ACC }).replace('fill="' + ACC + '"', `fill="${ACC}" fill-opacity="0.08"`) + sC(220, 112, 78, { c: '#ec4899', fill: '#ec4899' }).replace('fill="#ec4899"', 'fill="#ec4899" fill-opacity="0.08"');
    body += sT(80, 36, la, { b: true, c: ACC }) + sT(280, 36, lb, { b: true, c: '#ec4899' });
    body += sT(100, 112, a, { fs: 16 }) + sT(180, 112, both, { fs: 16 }) + sT(260, 112, b, { fs: 16 }) + sT(326, 192, out, { fs: 16 });
    return svgWrap(360, 220, body, false);
  }

  topic('y9-probability-diagrams', 'probability', 9, 3, 'FH', 'Independent Events, Venn Diagrams & Two-Way Tables', 'Probabilities that sum to 1, independent events, and probabilities from Venn diagrams, two-way tables and sample spaces.', [
    ['Probabilities that sum to 1',
      'Probabilities go from 0 (impossible) to 1 (certain). The probabilities of all the possible outcomes add up to 1, so P(not A) = 1 − P(A) and a missing probability is 1 minus the others. Expected number = probability × number of trials.',
      (r) => {
        const v = r.int(0, 3);
        const SETS2 = [['red', 'blue', 'green', 'yellow', 'white'], ['milk', 'dark', 'white', 'caramel', 'mint'], ['bus', 'car', 'walk', 'cycle', 'train'], ['win', 'draw', 'lose'], ['1', '2', '3', '4', '5']];
        const cats = r.pick(SETS2); const n = Math.min(cats.length, r.int(3, 5)); const lab = cats.slice(0, n);
        const ctx = cats[0] === 'red' ? 'A spinner lands on one of these colours' : cats[0] === 'milk' ? 'A chocolate is picked at random from a box' : cats[0] === 'bus' ? 'A pupil is chosen at random. The table shows how pupils travel to school' : cats[0] === 'win' ? 'The table shows the probabilities of a football team’s result in its next match' : 'A biased spinner is numbered 1 to ' + n;
        const parts = split(r, 100, n, 3);
        if (v === 3) { // x and 2x
          const k = r.int(2, 18); const restT = 100 - 3 * k; const rest = split(r, restT, n - 2, 3);
          const row = [...rest.map(p2)]; const labs = lab.slice(0, rest.length + 2);
          const ix = r.int(0, 1);
          return { html: `${ctx}. The probability of ${labs[rest.length]} is ${B('<i>x</i>')} and the probability of ${labs[rest.length + 1]} is ${B('2<i>x</i>')}.${table([labs, [...row, '<i>x</i>', '2<i>x</i>']])}Work out the probability of ${B(labs[rest.length + ix])}.`, ...nAns((ix ? 2 : 1) * k / 100), hint: 'All the probabilities add up to 1, so 3x = 1 − (the others).',
            steps: [`The known probabilities add up to ${p2(restT)}.`, `3<i>x</i> = 1 − ${p2(restT)} = ${p2(3 * k)}`, `<i>x</i> = ${p2(k)}`, ix ? `P(${labs[rest.length + 1]}) = 2<i>x</i> = ${B(p2(2 * k))}` : `P(${labs[rest.length]}) = ${B(p2(k))}`] };
        }
        const miss = r.int(0, n - 1);
        if (v === 0) {
          return { html: `${ctx}.${table([lab, parts.map((p, i) => (i === miss ? '?' : p2(p)))])}Work out the missing probability for ${B(lab[miss])}.`, ...nAns(parts[miss] / 100), hint: 'The probabilities must add up to 1.',
            steps: [`Add the known probabilities: ${parts.filter((_, i) => i !== miss).map(p2).join(' + ')} = ${p2(100 - parts[miss])}`, `Missing probability = 1 − ${p2(100 - parts[miss])} = ${B(p2(parts[miss]))}`] };
        }
        if (v === 1) {
          const N = r.pick([100, 200, 300, 400, 500, 1000]); const e = parts[miss] * N / 100;
          return { html: `${ctx}.${table([lab, parts.map(p2)])}This happens ${B(N)} times. How many times would you expect the outcome ${B(lab[miss])}?`, ...nAns(e), hint: 'Expected number = probability × number of trials.',
            steps: [`Expected = ${p2(parts[miss])} × ${N}`, `= ${B(ds(e))}`, 'This is an estimate of the long-run average, not a guarantee.'] };
        }
        let a, d; do { d = r.pick([3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 15, 20]); a = r.int(1, d - 1); } while (gcd(a, d) !== 1);
        const ev = r.pick(['it rains tomorrow', 'a train is late', 'a seed grows into a plant', 'Jo wins the game', 'a randomly chosen pupil owns a dog', 'the bus arrives on time']);
        return { html: `The probability that ${ev} is ${B(frac(a, d))}. What is the probability that this does ${B('not')} happen?`, ...fAns(d - a, d), hint: 'P(not A) = 1 − P(A).',
          steps: [`P(not) = 1 − ${frac(a, d)}`, `= ${frac(d, d)} − ${frac(a, d)} = ${B(fracN(d - a, d))}`] };
      }],
    ['Independent events',
      'Two events are independent when one happening has no effect on the other (like rolling a dice and spinning a spinner). Then P(A and B) = P(A) × P(B). Work out each probability separately, then multiply.',
      (r) => {
        const v = r.int(0, 3);
        if (v === 0) {
          const n = r.pick([3, 4, 5, 6, 8]); const k = r.int(1, n - 1); const col = r.pick(['red', 'blue', 'green', 'yellow']); const face = r.pick([['a 5', 1], ['a 6', 1], ['an even number', 3], ['a number greater than 4', 2], ['a prime number', 3], ['a 1 or a 2', 2], ['a square number', 2]]);
          return { html: `A fair six-sided dice is rolled and a fair spinner with ${B(n)} equal sections is spun. ${B(k)} of the spinner’s sections ${k === 1 ? 'is' : 'are'} ${col}. Find the probability of rolling ${face[0]} ${B('and')} the spinner landing on ${col}.`, ...fAns(face[1] * k, 6 * n), hint: 'The dice and spinner are independent: multiply the probabilities.',
            steps: [`P(${face[0]}) = ${fracS(face[1], 6)}`, `P(${col}) = ${fracS(k, n)}`, `P(both) = ${fracS(face[1], 6)} × ${fracS(k, n)} = ${fracN(face[1] * k, 6 * n)}${gcd(face[1] * k, 6 * n) > 1 ? ` = ${B(fracS(face[1] * k, 6 * n))}` : ''}`] };
        }
        if (v === 1) {
          const pa = r.int(1, 9), pb = r.int(1, 9); const [ea, eb] = r.pick([['it rains on Monday', 'Leah’s bus is late'], ['a light bulb is faulty', 'a battery is faulty'], ['Ali scores a penalty', 'Ben scores a penalty'], ['a coin lands heads', 'a biased dice lands on 6'], ['the school team wins', 'it is sunny']]);
          const kind = r.int(0, 2);
          const A = pa / 10, Bv = pb / 10; const val = kind === 0 ? A * Bv : kind === 1 ? (1 - A) * (1 - Bv) : A * (1 - Bv);
          const q = kind === 0 ? 'both events happen' : kind === 1 ? 'neither event happens' : `the first event happens but the second does not`;
          return { html: `The events "${ea}" and "${eb}" are independent. The probability that ${ea} is ${B(ps(A))}. The probability that ${eb} is ${B(ps(Bv))}. Find the probability that ${q}.`, ...nAns(val), hint: kind === 0 ? 'Multiply the two probabilities.' : 'Find each "not" probability with 1 − P, then multiply.',
            steps: kind === 0 ? [`P(both) = ${ps(A)} × ${ps(Bv)}`, `= ${B(ps(val))}`] : kind === 1 ? [`P(not first) = 1 − ${ps(A)} = ${ps(1 - A)}; P(not second) = 1 − ${ps(Bv)} = ${ps(1 - Bv)}`, `P(neither) = ${ps(1 - A)} × ${ps(1 - Bv)} = ${B(ps(val))}`] : [`P(not second) = 1 − ${ps(Bv)} = ${ps(1 - Bv)}`, `P(first and not second) = ${ps(A)} × ${ps(1 - Bv)} = ${B(ps(val))}`] };
        }
        if (v === 2) {
          const face = r.pick([['heads', 1], ['tails', 1]]); const dv = r.pick([['a 3', 1], ['an odd number', 3], ['a number less than 3', 2], ['a multiple of 3', 2], ['a 6', 1], ['a factor of 6', 4]]);
          return { html: `A fair coin is flipped and a fair six-sided dice is rolled. What is the probability of getting ${B(face[0])} and ${B(dv[0])}?`, ...fAns(dv[1], 12), hint: 'Multiply P(coin outcome) by P(dice outcome).',
            steps: [`P(${face[0]}) = ${frac(1, 2)}; P(${dv[0]}) = ${fracS(dv[1], 6)}`, `P(both) = ${frac(1, 2)} × ${fracS(dv[1], 6)} = ${fracN(dv[1], 12)}${gcd(dv[1], 12) > 1 ? ` = ${B(fracS(dv[1], 12))}` : ''}`] };
        }
        const n1 = r.int(3, 6), n2 = r.int(3, 6); const k1 = r.int(1, n1 - 1), k2 = r.int(1, n2 - 1);
        return { html: `Bag A has ${B(k1)} red and ${B(n1 - k1)} blue counters. Bag B has ${B(k2)} red and ${B(n2 - k2)} blue counters. One counter is taken at random from each bag. Find the probability that ${B('both counters are red')}.`, ...fAns(k1 * k2, n1 * n2), hint: 'The two picks are independent.',
          steps: [`P(red from A) = ${frac(k1, n1)}`, `P(red from B) = ${frac(k2, n2)}`, `P(both red) = ${frac(k1, n1)} × ${frac(k2, n2)} = ${fracN(k1 * k2, n1 * n2)}${gcd(k1 * k2, n1 * n2) > 1 ? ` = ${B(fracS(k1 * k2, n1 * n2))}` : ''}`] };
      }],
    ['Probability from a Venn diagram',
      'Each region of a Venn diagram shows how many items are in it. The overlap is "A and B", both circles together is "A or B", and the space outside the circles is "neither". Probability = number in the region(s) ÷ total.',
      (r) => {
        const [la, lb, vA, vB, notA, grp] = r.pick([
          ['F', 'T', 'plays football', 'plays tennis', 'does not play football', 'pupils in a class'],
          ['C', 'D', 'has a cat', 'has a dog', 'does not have a cat', 'people in a survey'],
          ['M', 'S', 'studies music', 'studies Spanish', 'does not study music', 'Year 9 pupils'],
          ['W', 'S', 'likes winter', 'likes summer', 'does not like winter', 'people asked'],
          ['P', 'B', 'has been to Paris', 'has been to Berlin', 'has not been to Paris', 'teachers'],
          ['V', 'G', 'plays the violin', 'plays the guitar', 'does not play the violin', 'members of a music club'],
        ]);
        const a = r.int(2, 15), both = r.int(1, 10), b = r.int(2, 15), out = r.int(1, 10); const N = a + both + b + out;
        const v = r.int(0, 6);
        const intro = `The Venn diagram shows ${N} ${grp}. ${la} = ${vA}, ${lb} = ${vB}. One person is chosen at random.`;
        if (v === 6) {
          const tA = a + both, tB = b + both;
          return { html: `In a group of ${B(N)} ${grp}, ${B(tA)} are in set ${la}, ${B(tB)} are in set ${lb} and ${B(both)} are in both. How many are in neither set? (${la}: ${vA}; ${lb}: ${vB})`, diagram: vennSvg('', String(both), '', '?', la, lb), ...nAns(out), hint: 'Fill in the overlap first, then each circle, then the outside.',
            steps: [`${la} only: ${tA} − ${both} = ${a}`, `${lb} only: ${tB} − ${both} = ${b}`, `Neither: ${N} − ${a} − ${both} − ${b} = ${B(out)}`] };
        }
        const Q = [
          [`P(${la})`, `the person ${vA}`, a + both, `In ${la}: ${a} + ${both} = ${a + both}`],
          [`P(${la} ∩ ${lb})`, `the person ${vA} and ${vB}`, both, `In the overlap: ${both}`],
          [`P(${la} ∪ ${lb})`, `the person ${vA} or ${vB} (or both)`, a + both + b, `In either circle: ${a} + ${both} + ${b} = ${a + both + b}`],
          [`P(neither)`, 'the person is in neither group', out, `Outside both circles: ${out}`],
          [`P(not ${la})`, `the person ${notA}`, b + out, `Not in ${la}: ${b} + ${out} = ${b + out}`],
          [`P(${la} only)`, `the person ${vA} but is not in ${lb}`, a, `In ${la} only: ${a}`],
        ][v];
        return { html: `${intro} Find ${B(Q[0])} — the probability that ${Q[1]}.`, diagram: vennSvg(String(a), String(both), String(b), String(out), la, lb), ...fAns(Q[2], N), hint: 'Count the people in the region(s) you need, then divide by the total.',
          steps: [`Total = ${a} + ${both} + ${b} + ${out} = ${N}`, Q[3], `P = ${frac(Q[2], N)}${gcd(Q[2], N) > 1 ? ` = ${B(fracS(Q[2], N))}` : ''}`] };
      }],
    ['Two-way tables',
      'A two-way table splits data by two features at once. Each row and column adds up to its total, so you can fill in missing values. For a probability, divide the number in the cell by the total of the group you are choosing from.',
      (r) => {
        const [rows, cols, who2, noun] = r.pick([
          [['Boys', 'Girls'], ['Bus', 'Car', 'Walk'], 'pupils and how they travel to school', 'pupil'],
          [['Adults', 'Children'], ['Swim', 'Gym', 'Tennis'], 'sports club members and their main activity', 'member'],
          [['Year 8', 'Year 9'], ['Maths', 'Art', 'PE'], 'pupils and their favourite subject', 'pupil'],
          [['Boys', 'Girls'], ['Cat', 'Dog', 'None'], 'pupils and the pet they own', 'pupil'],
          [['Weekday', 'Weekend'], ['Film', 'Bowling', 'Café'], 'visits to a leisure centre', 'visit'],
        ]);
        const M = rows.map(() => cols.map(() => r.int(3, 30)));
        const rt = M.map((row) => row.reduce((a, b) => a + b, 0)), ct = cols.map((_, j) => M[0][j] + M[1][j]), G = rt[0] + rt[1];
        const full = [['', ...cols, 'Total'], ...rows.map((n, i) => [n, ...M[i], rt[i]]), ['Total', ...ct, G]];
        const i = r.int(0, 1), j = r.int(0, 2);
        const v = r.int(0, 2);
        if (v === 0) {
          const viaCol = r.chance(); const T = full.map((row) => row.slice());
          T[i + 1][j + 1] = '?'; if (viaCol) T[i + 1][4] = ''; else T[3][j + 1] = '';
          return { html: `The two-way table shows information about some ${who2}. Work out the missing value marked ?.${table(T.map((row) => row.map(String)))}`, ...nAns(M[i][j]), hint: viaCol ? 'Use the column total.' : 'Use the row total.',
            steps: viaCol ? [`Use the ${cols[j]} column: total ${ct[j]}.`, `? = ${ct[j]} − ${M[1 - i][j]} = ${B(M[i][j])}`] : [`Use the ${rows[i]} row: total ${rt[i]}.`, `? = ${rt[i]} − ${M[i].filter((_, k) => k !== j).join(' − ')} = ${B(M[i][j])}`] };
        }
        if (v === 1) {
          return { html: `The two-way table shows information about some ${who2}. One ${noun} is chosen at random from the whole table. Find ${B(`P(${rows[i]} and ${cols[j]})`)}.${table(full.map((row) => row.map(String)))}`, ...fAns(M[i][j], G), hint: 'Number in that cell ÷ grand total.',
            steps: [`Cell (${rows[i]}, ${cols[j]}) = ${M[i][j]}; grand total = ${G}`, `P = ${frac(M[i][j], G)}${gcd(M[i][j], G) > 1 ? ` = ${B(fracS(M[i][j], G))}` : ''}`] };
        }
        return { html: `The two-way table shows information about some ${who2}. One ${noun} from the ${B(rows[i])} row is chosen at random. Find the probability that it is in the ${B(cols[j])} column.${table(full.map((row) => row.map(String)))}`, ...fAns(M[i][j], rt[i]), hint: `You are only choosing from the ${rows[i]} row, so use its total.`,
          steps: [`Only the ${rows[i]} row counts: total ${rt[i]}.`, `${rows[i]} in ${cols[j]}: ${M[i][j]}`, `P = ${frac(M[i][j], rt[i])}${gcd(M[i][j], rt[i]) > 1 ? ` = ${B(fracS(M[i][j], rt[i]))}` : ''}`] };
      }],
    ['Sample spaces for two events',
      'A sample space diagram lists every combination of two events in a grid. If there are m outcomes for the first and n for the second, there are m × n equally likely combinations. Count the ones you want and divide by the total.',
      (r) => {
        const v = r.int(0, 2);
        const n1 = v === 0 ? 2 : r.int(3, 5), n2 = v === 2 ? r.int(3, 6) : 6;
        const lab1 = v === 0 ? ['H', 'T'] : Array.from({ length: n1 }, (_, i) => String(i + 1)), lab2 = Array.from({ length: n2 }, (_, i) => String(i + 1));
        const desc = v === 0 ? 'A fair coin is flipped and a fair six-sided dice is rolled.' : v === 1 ? `A fair spinner numbered 1 to ${n1} is spun and a fair six-sided dice is rolled.` : `Two fair spinners are spun. One is numbered 1 to ${n1} and the other 1 to ${n2}.`;
        const sampleTable = table([['', ...lab2], ...lab1.map((a) => [a, ...lab2.map((b) => (v === 0 ? `${a}${b}` : ''))])]);
        if (r.chance(0.2)) return { html: `${desc} How many different outcomes are in the sample space?`, ...nAns(n1 * n2), hint: 'Multiply the number of outcomes for each event.', steps: [`First event: ${n1} outcomes; second: ${n2} outcomes.`, `${n1} × ${n2} = ${B(n1 * n2)}`] };
        let label, test;
        if (v === 0) { const c = r.pick(['H', 'T']); const opt = r.pick([['an even number', (b) => b % 2 === 0], ['a prime number', (b) => [2, 3, 5].includes(b)], ['a number greater than 2', (b) => b > 2], ['a 4', (b) => b === 4], ['a factor of 12', (b) => 12 % b === 0], ['an odd number', (b) => b % 2 === 1]]); label = `${c === 'H' ? 'heads' : 'tails'} and ${opt[0]}`; test = (a, b) => a === c && opt[1](b); }
        else {
          const kind = r.int(0, 2); const tot = []; for (let a = 1; a <= n1; a++) for (let b = 1; b <= n2; b++) tot.push(kind === 1 ? a * b : a + b);
          if (kind === 2) { label = `a total that is even`; test = (a, b) => (+a + b) % 2 === 0; }
          else { let k; k = r.pick(tot); label = kind === 0 ? `a total of ${k}` : `a product of ${k}`; test = (a, b) => (kind === 0 ? +a + b : a * b) === k; }
          if (kind === 0 && r.chance(0.4)) { const k = r.int(4, n1 + n2 - 1); label = `a total greater than ${k}`; test = (a, b) => +a + b > k; }
        }
        const hits = []; lab1.forEach((a) => lab2.forEach((b) => { if (test(v === 0 ? a : +a, +b)) hits.push(v === 0 ? `${a}${b}` : `(${a}, ${b})`); }));
        const N = n1 * n2;
        return { html: `${desc} Find the probability of getting ${B(label)}.${v === 0 ? '<br>Sample space:' + sampleTable : ''}`, ...fAns(hits.length, N), hint: 'Draw a sample space grid and count the outcomes that work.',
          steps: [`There are ${n1} × ${n2} = ${N} equally likely outcomes.`, hits.length <= 10 ? `Outcomes that work: ${hits.join(', ')} — ${hits.length} outcome${hits.length === 1 ? '' : 's'}` : `Counting in the grid gives ${hits.length} outcomes that work.`, `P = ${frac(hits.length, N)}${gcd(hits.length, N) > 1 ? ` = ${B(fracS(hits.length, N))}` : ''}`] };
      }],
  ]);
};
