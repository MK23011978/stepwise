'use strict';
// Year 9 school units: formulae, conjectures & proof, non-linear graphs & inequalities,
// plus one extra style for straight-line graphs (lines parallel to the axes & real-life graphs).
module.exports = (H) => {
  const { topic, addStyles, SPEC, nAns, fAns, eAns, mcq, B, ds, ps, frac, fracN, simp, gcd, lcm, isPrime, pf, pfText, pfHtml, tx, lin, quad, polyT, coefT, br, pm, money, htable, svgWrap, sT, sL, sP, sC, sPoly, dot, ACC, f1, gridSvg } = H;

  Object.assign(SPEC, {
    'y9-formulae': '1MA1 A2, A3, A5, A9',
    'y9-conjectures': '1MA1 N4, A3, A4, A6',
    'y9-nonlinear-graphs': '1MA1 A11, A12, A22',
  });

  // ---------------------------------------------------------------- local helpers
  const OPH = { '<': '&lt;', '>': '&gt;', '<=': '≤', '>=': '≥' };
  const FLIP = { '<': '>', '>': '<', '<=': '>=', '>=': '<=' };
  const iv = (v) => `<i>${v}</i>`;
  const pmv = (n) => (n === 0 ? '' : pm(n));
  const given = (list) => { const s = list.map(([n, v]) => `${iv(n)} = ${ds(v)}`); return s.length === 1 ? s[0] : s.slice(0, -1).join(', ') + ' and ' + s[s.length - 1]; };
  const factorText = (n) => { for (let p = 2; p * p <= n; p++) if (n % p === 0) return `${p} × ${n / p}`; return String(n); };
  const digitSum = (n) => String(n).split('').reduce((s, d) => s + Number(d), 0);

  // axes with optional curves, shading, lines and points (maths coords → svg)
  function axesSvg(o) {
    const W = 300, Ht = 300, pad = 24; const { xmin, xmax, ymin, ymax } = o;
    const X = (x) => pad + ((x - xmin) / (xmax - xmin)) * (W - 2 * pad);
    const Y = (y) => Ht - pad - ((y - ymin) / (ymax - ymin)) * (Ht - 2 * pad);
    const xs = o.xs || 1, ys = o.ys || 1; let body = '';
    for (let i = Math.ceil(xmin); i <= xmax; i++) body += sL(X(i), Y(ymin), X(i), Y(ymax), { w: 1, op: 0.15 });
    for (let j = Math.ceil(ymin); j <= ymax; j++) body += sL(X(xmin), Y(j), X(xmax), Y(j), { w: 1, op: 0.15 });
    if (o.shade && o.shade.length > 2) body += sPoly(o.shade.map(([x, y]) => [X(x), Y(y)]), { c: 'none', fill: ACC, fop: 0.2 });
    const ax = Math.min(Math.max(0, xmin), xmax), ay = Math.min(Math.max(0, ymin), ymax);
    body += sL(X(xmin), Y(ay), X(xmax), Y(ay), { w: 1.5 }) + sL(X(ax), Y(ymin), X(ax), Y(ymax), { w: 1.5 });
    for (let i = Math.ceil(xmin / xs) * xs; i <= xmax; i += xs) if (i) body += sL(X(i), Y(ay) - 3, X(i), Y(ay) + 3, { w: 1 }) + sT(X(i), Y(ay) + 11, ds(i), { fs: 10 });
    for (let j = Math.ceil(ymin / ys) * ys; j <= ymax; j += ys) if (j) body += sL(X(ax) - 3, Y(j), X(ax) + 3, Y(j), { w: 1 }) + sT(X(ax) - 6, Y(j), ds(j), { fs: 10, a: 'end' });
    body += sT(X(xmax) - 4, Y(ay) - 10, 'x', { it: true }) + sT(X(ax) + 10, Y(ymax) + 6, 'y', { it: true });
    for (const L of o.lines || []) body += sL(X(L[0]), Y(L[1]), X(L[2]), Y(L[3]), { c: ACC, w: 2.5, dash: L[4] });
    for (const f of o.curves || []) {
      let seg = []; const segs = [];
      for (let x = xmin; x <= xmax + 1e-9; x += (xmax - xmin) / 400) {
        const y = f(x);
        if (isFinite(y) && y >= ymin - 0.05 && y <= ymax + 0.05) seg.push([X(x), Y(Math.min(ymax, Math.max(ymin, y)))]);
        else { if (seg.length > 1) segs.push(seg); seg = []; }
      }
      if (seg.length > 1) segs.push(seg);
      for (const s of segs) body += sP('M' + s.map((p) => f1(p[0]) + ' ' + f1(p[1])).join(' L'), { c: ACC, w: 2.5 });
    }
    for (const p of o.pts || []) body += dot(X(p[0]), Y(p[1]), ACC);
    return svgWrap(W, Ht, body, false);
  }
  // clip polygon to half-plane g >= 0
  function clipHalf(poly, g) {
    const out = [];
    for (let i = 0; i < poly.length; i++) {
      const P = poly[i], Q = poly[(i + 1) % poly.length]; const gp = g(P), gq = g(Q);
      if (gp >= 0) out.push(P);
      if ((gp >= 0) !== (gq >= 0)) { const t = gp / (gp - gq); out.push([P[0] + t * (Q[0] - P[0]), P[1] + t * (Q[1] - P[1])]); }
    }
    return out;
  }
  // number line: lo..hi ticks; a/b ends (null = arrow to edge); aIn/bIn inclusive
  function numLineSvg(lo, hi, a, aIn, b, bIn) {
    const W = 340, x0 = 24, x1 = W - 24; const X = (v) => x0 + ((v - lo) / (hi - lo)) * (x1 - x0); const yl = 70, ys = 40; let body = '';
    body += sL(x0 - 10, yl, x1 + 10, yl, { w: 1.5 });
    for (let v = lo; v <= hi; v++) body += sL(X(v), yl - 5, X(v), yl + 5, { w: 1.5 }) + sT(X(v), yl + 18, ds(v), { fs: 12 });
    const L = a === null ? x0 - 8 : X(a) + 6, R = b === null ? x1 + 8 : X(b) - 6;
    body += sL(L, ys, R, ys, { c: ACC, w: 3 });
    if (a === null) body += sP(`M${f1(x0 - 2)} ${ys - 7} L${f1(x0 - 12)} ${ys} L${f1(x0 - 2)} ${ys + 7}`, { c: ACC, w: 3 });
    else body += `<circle cx="${f1(X(a))}" cy="${ys}" r="6" stroke="${ACC}" stroke-width="2.5" fill="${aIn ? ACC : 'none'}"/>`;
    if (b === null) body += sP(`M${f1(x1 + 2)} ${ys - 7} L${f1(x1 + 12)} ${ys} L${f1(x1 + 2)} ${ys + 7}`, { c: ACC, w: 3 });
    else body += `<circle cx="${f1(X(b))}" cy="${ys}" r="6" stroke="${ACC}" stroke-width="2.5" fill="${bIn ? ACC : 'none'}"/>`;
    return svgWrap(W, 100, body, false);
  }
  // small grid of numbered cells; cells: 2D array of {t, hi}
  function cellsSvg(cells) {
    const s = 46, rows = cells.length, cols = cells[0].length; let body = '';
    cells.forEach((row, i) => row.forEach((c, j) => {
      body += `<rect x="${4 + j * s}" y="${4 + i * s}" width="${s}" height="${s}" fill="${c.hi ? ACC : 'none'}" fill-opacity="${c.hi ? 0.18 : 0}" stroke="currentColor" stroke-width="1.5"/>`;
      if (c.t) body += sT(4 + j * s + s / 2, 4 + i * s + s / 2, c.t, { fs: 13, b: !!c.hi, it: /n/.test(c.t) });
    }));
    return svgWrap(cols * s + 8, rows * s + 8, body, false);
  }

  // ================================================================ y9-formulae
  const SUBS = [
    (r) => { const u = r.int(-10, 20), a = r.nz(-6, 9), t = r.int(2, 12); const v = u + a * t;
      return { ctx: 'The final velocity of an object is given by', f: tx('v=u+at'), vals: [['u', u], ['a', a], ['t', t]], want: 'v', ans: v,
        sub: `${ds(u)} + ${br(a)} × ${t}`, mid: [`= ${ds(u)}${pm(a * t)}`] }; },
    (r) => { const a = 2 * r.nz(-3, 5), t = r.int(1, 6), u = r.int(0, 12); const s = u * t + (a * t * t) / 2;
      return { ctx: 'The distance travelled by an object is given by', f: `<i>s</i> = <i>ut</i> + ${frac(1, 2)}<i>at</i><sup>2</sup>`, vals: [['u', u], ['a', a], ['t', t]], want: 's', ans: s,
        sub: `${u} × ${t} + ${frac(1, 2)} × ${br(a)} × ${t}<sup>2</sup>`, mid: [`= ${ds(u * t)} + ${frac(1, 2)} × ${br(a)} × ${t * t}`, `= ${ds(u * t)}${pm((a * t * t) / 2)}`], unit: 'm' }; },
    (r) => { const k = r.int(-8, 20); const C = 5 * k; const F = 9 * k + 32;
      return { ctx: 'To convert a temperature from °C to °F you can use', f: `<i>F</i> = ${frac('9<i>C</i>', 5)} + 32`, vals: [['C', C]], want: 'F', ans: F,
        sub: `${frac('9 × ' + br(C), 5)} + 32`, mid: [`= ${frac(ds(9 * C), 5)} + 32 = ${ds(9 * k)} + 32`], unit: '°F' }; },
    (r) => { let a, b, h; do { a = r.int(2, 15); b = r.int(2, 15); h = r.int(2, 12); } while (a === b || ((a + b) * h) % 2); const A = ((a + b) * h) / 2;
      return { ctx: 'The area of a trapezium is given by', f: `<i>A</i> = ${frac(1, 2)}(<i>a</i> + <i>b</i>)<i>h</i>`, vals: [['a', a], ['b', b], ['h', h]], want: 'A', ans: A,
        sub: `${frac(1, 2)} × (${a} + ${b}) × ${h}`, mid: [`= ${frac(1, 2)} × ${a + b} × ${h}`], unit: 'cm²' }; },
    (r) => { const k = r.int(2, 5), m = r.nz(-5, 5), p = r.nz(-6, 6), q = r.nz(-9, 9); const T = k * p * p + m * q;
      return { ctx: 'A formula states', f: tx(`T=${k}p^2${m < 0 ? '-' : '+'}${Math.abs(m) === 1 ? '' : Math.abs(m)}q`), vals: [['p', p], ['q', q]], want: 'T', ans: T,
        sub: `${k} × ${br(p)}<sup>2</sup> ${m < 0 ? '−' : '+'} ${Math.abs(m) === 1 ? '' : Math.abs(m) + ' × '}${br(q)}`, mid: [`= ${k} × ${p * p}${pm(m * q)}`, `= ${ds(k * p * p)}${pm(m * q)}`] }; },
    (r) => { const m = r.nz(-6, 6), x = r.nz(-8, 8), c = r.nz(-12, 12); const y = m * x + c;
      return { ctx: 'A straight line has the formula', f: tx(`y=mx+c`), vals: [['m', m], ['x', x], ['c', c]], want: 'y', ans: y,
        sub: `${br(m)} × ${br(x)} + ${br(c)}`, mid: [`= ${ds(m * x)}${pm(c)}`] }; },
    (r) => { const a = r.nz(-4, 4), b = r.int(-8, 8), c = r.nz(-6, 6); const D = b * b - 4 * a * c;
      return { ctx: 'A formula used with quadratic equations is', f: tx('D=b^2-4ac'), vals: [['a', a], ['b', b], ['c', c]], want: 'D', ans: D,
        sub: `${br(b)}<sup>2</sup> − 4 × ${br(a)} × ${br(c)}`, mid: [`= ${b * b} − ${br(4 * a * c)}`] }; },
    (r) => { let c; do { c = r.nz(-6, 6); } while (Math.abs(c) < 2); const q = r.int(-9, 9), b = r.int(-12, 12); const a = q * c + b;
      return { ctx: 'A formula states', f: `<i>w</i> = ${frac('<i>a</i> − <i>b</i>', '<i>c</i>')}`, vals: [['a', a], ['b', b], ['c', c]], want: 'w', ans: q,
        sub: frac(`${ds(a)} − ${br(b)}`, ds(c)), mid: [`= ${frac(ds(a - b), ds(c))}`] }; },
    (r) => { const m = 2 * r.int(1, 10), v = r.int(2, 12); const E = (m * v * v) / 2;
      return { ctx: 'The kinetic energy (in joules) of a moving object is', f: `<i>E</i> = ${frac(1, 2)}<i>mv</i><sup>2</sup>`, vals: [['m', m], ['v', v]], want: 'E', ans: E,
        sub: `${frac(1, 2)} × ${m} × ${v}<sup>2</sup>`, mid: [`= ${frac(1, 2)} × ${m} × ${v * v}`], unit: 'J' }; },
    (r) => { const F = r.pick([20, 25, 30, 35, 40, 45, 50, 60]), R = r.int(10, 45), h = r.int(1, 8); const C = F + R * h;
      return { ctx: `An electrician charges £${F} to call out plus £${R} for each hour, <i>h</i>. The cost in pounds is`, f: tx(`C=${F}+${R}h`), vals: [['h', h]], want: 'C', ans: C,
        sub: `${F} + ${R} × ${h}`, mid: [`= ${F} + ${R * h}`], unit: '', money: true }; },
    (r) => { const l = r.int(3, 25), w = r.int(2, 20); const P = 2 * (l + w);
      return { ctx: 'The perimeter of a rectangle is', f: tx('P=2(l+w)'), vals: [['l', l], ['w', w]], want: 'P', ans: P,
        sub: `2 × (${l} + ${w})`, mid: [`= 2 × ${l + w}`], unit: 'cm' }; },
    (r) => { const a = r.nz(-5, 5), b = r.nz(-5, 5); const K = a * a - 3 * a * b;
      return { ctx: 'A formula states', f: tx('K=a^2-3ab'), vals: [['a', a], ['b', b]], want: 'K', ans: K,
        sub: `${br(a)}<sup>2</sup> − 3 × ${br(a)} × ${br(b)}`, mid: [`= ${a * a} − ${br(3 * a * b)}`] }; },
  ];

  const CLASSES = ['An expression', 'An equation', 'A formula', 'An identity'];
  const genItem = (r, kind) => {
    const a = r.int(2, 9), b = r.int(1, 9) * r.sign(), c = r.int(2, 9);
    if (kind === 0) return r.pick([() => tx(polyT([[a, 'x'], [b, 'y']])), () => `${a}(${tx(lin(1, b, 'm'))})`, () => tx(polyT([[1, 'a^2'], [-c, 'b']])), () => tx(lin(a, b, 'n')), () => tx(polyT([[a, 'p'], [b, 'q'], [c, '']]))])();
    if (kind === 1) return r.pick([() => tx(`${lin(a, b)}=${a * r.int(1, 6) + b}`), () => { let d; do { d = r.int(1, 9); } while (d === a); return tx(`${lin(a, b, 'y')}=${lin(d, c, 'y')}`); }, () => tx(`x^2=${c * c}`), () => `${frac(tx(lin(1, b, 'x')), a)} = ${c}`])();
    if (kind === 2) return r.pick([() => tx('A=lw'), () => tx('v=u+at'), () => tx('F=ma'), () => tx('d=st'), () => tx('P=2l+2w'), () => tx('V=IR'), () => tx('A=pir^2'), () => tx('C=2pir'), () => tx(`C=${a}n+${c * 5}`), () => tx(`T=${c}m+${a}`)])();
    return r.pick([() => `${a}(${tx(lin(1, b))}) ≡ ${tx(lin(a, a * b))}`, () => `${tx(Array((c % 3) + 2).fill('x').join('+'))} ≡ ${tx((c % 3) + 2 + 'x')}`, () => `${tx(`${a}x+${c}x`)} ≡ ${tx((a + c) + 'x')}`, () => `(${tx(lin(1, a))})(${tx(lin(1, c))}) ≡ ${tx(quad(1, a + c, a * c))}`, () => `${tx(`${a}y`)} × ${c} ≡ ${tx(a * c + 'y')}`])();
  };
  const WHY = [
    'It has no equals sign — it is just a collection of terms, so it cannot be solved.',
    'It has an equals sign and is true only for particular value(s) of the letter, so it can be solved.',
    'It is a rule linking two or more quantities, with one letter as the subject; substituting values gives the subject.',
    'It uses ≡: both sides are equal for every value of the letter (expanding or simplifying one side gives the other).',
  ];

  const LET = ['a', 'b', 'c', 'd', 'h', 'k', 'm', 'n', 'p', 'q', 'r', 's', 't', 'u', 'w', 'x', 'y', 'z'];

  topic('y9-formulae', 'algebra', 9, 1, 'FH', 'Formulae: Substituting & Rearranging', 'Substitute into formulae, tell formulae from equations and expressions, and change the subject of a formula.', [
    ['Substituting into formulae',
      'Replace each letter with its value, putting negative numbers in brackets. Then follow the order of operations: brackets, powers, multiply and divide, then add and subtract.',
      (r) => {
        const T = r.pick(SUBS)(r);
        const html = `${T.ctx} ${B(T.f)}.<br>Work out the value of ${iv(T.want)} when ${given(T.vals)}.`;
        const ans = T.money ? nAns(T.ans, { money: true }) : nAns(T.ans, T.unit ? { unit: T.unit } : {});
        return { html, ...ans, unit: T.money ? '' : (T.unit || ''), hint: 'Put negative numbers in brackets, then do powers before multiplying and adding.',
          steps: [`Write the formula: ${T.f}`, `Substitute: ${iv(T.want)} = ${T.sub}`, ...T.mid, `${iv(T.want)} = ${B(T.money ? money(T.ans) : ds(T.ans))}${T.unit && !T.money ? ' ' + T.unit : ''}`] };
      }],
    ['Expressions, equations, formulae & identities',
      'An expression has no equals sign. An equation is true for particular values and can be solved. A formula links quantities with a subject, e.g. A = lw. An identity (≡) is true for every value.',
      (r) => {
        if (r.chance(0.6)) {
          const k = r.int(0, 3); const item = genItem(r, k);
          return { html: `Which word best describes ${B(item)}?`, ...mcq(r, CLASSES, k), hint: 'Look for an equals sign or ≡, and ask: is it true for every value, one value, or does it link quantities?',
            steps: [`${B(item)}`, WHY[k], `So it is ${B(CLASSES[k].toLowerCase())}.`] };
        }
        const k = r.int(0, 3); const items = [0, 1, 2, 3].map((j) => genItem(r, j));
        const name = CLASSES[k].replace(/^An? /, '').toLowerCase();
        return { html: `Which of these is ${/^[aeiou]/.test(name) ? 'an' : 'a'} ${B(name)}?`, ...mcq(r, items, k), hint: 'Expression: no equals. Equation: can be solved. Formula: links quantities. Identity: ≡, true for all values.',
          steps: [`${items[k]} — ${WHY[k].charAt(0).toLowerCase() + WHY[k].slice(1)}`, `The others: ${[0, 1, 2, 3].filter((j) => j !== k).map((j) => `${items[j]} is ${CLASSES[j].toLowerCase()}`).join('; ')}.`] };
      }],
    ['Rearranging formulae (one step)',
      'To change the subject, undo what has been done to the letter you want using the inverse operation, doing the same to both sides: + ↔ −, × ↔ ÷.',
      (r) => {
        const [S, A, Bv] = r.sample(LET, 3); const k = r.int(2, 12);
        const T = r.pick([
          () => ({ f: tx(`${S}=${A}+${Bv}`), t: A, a: `${S}-${Bv}`, op: `${Bv} is added to ${iv(A)}`, inv: `Subtract ${iv(Bv)} from both sides` }),
          () => ({ f: tx(`${S}=${A}+${Bv}`), t: Bv, a: `${S}-${A}`, op: `${A} is added to ${iv(Bv)}`, inv: `Subtract ${iv(A)} from both sides` }),
          () => ({ f: tx(`${S}=${A}-${Bv}`), t: A, a: `${S}+${Bv}`, op: `${Bv} is subtracted from ${iv(A)}`, inv: `Add ${iv(Bv)} to both sides` }),
          () => ({ f: tx(`${S}=${A}${Bv}`), t: A, a: `${S}/${Bv}`, op: `${iv(A)} is multiplied by ${iv(Bv)}`, inv: `Divide both sides by ${iv(Bv)}`, h: frac(iv(S), iv(Bv)) }),
          () => ({ f: tx(`${S}=${A}${Bv}`), t: Bv, a: `${S}/${A}`, op: `${iv(Bv)} is multiplied by ${iv(A)}`, inv: `Divide both sides by ${iv(A)}`, h: frac(iv(S), iv(A)) }),
          () => ({ f: `${iv(S)} = ${frac(iv(A), iv(Bv))}`, t: A, a: `${S}${Bv}`, op: `${iv(A)} is divided by ${iv(Bv)}`, inv: `Multiply both sides by ${iv(Bv)}` }),
          () => ({ f: tx(`${S}=${A}+${k}`), t: A, a: `${S}-${k}`, op: `${k} is added to ${iv(A)}`, inv: `Subtract ${k} from both sides` }),
          () => ({ f: tx(`${S}=${A}-${k}`), t: A, a: `${S}+${k}`, op: `${k} is subtracted from ${iv(A)}`, inv: `Add ${k} to both sides` }),
          () => ({ f: tx(`${S}=${k}${A}`), t: A, a: `${S}/${k}`, op: `${iv(A)} is multiplied by ${k}`, inv: `Divide both sides by ${k}`, h: frac(iv(S), k) }),
          () => ({ f: `${iv(S)} = ${frac(iv(A), k)}`, t: A, a: `${k}${S}`, op: `${iv(A)} is divided by ${k}`, inv: `Multiply both sides by ${k}` }),
          () => ({ f: tx(`${S}=${k}+${A}`), t: A, a: `${S}-${k}`, op: `${k} is added to ${iv(A)}`, inv: `Subtract ${k} from both sides` }),
          () => { const [F, P, Q, ctx] = r.pick([['V', 'i', 'r', 'In electronics, voltage = current × resistance:'], ['d', 's', 't', 'Distance = speed × time:'], ['F', 'm', 'a', 'Force = mass × acceleration:'], ['A', 'l', 'w', 'The area of a rectangle is']]);
            const tt = r.chance() ? P : Q, o = tt === P ? Q : P;
            return { pre: ctx + ' ', f: `${F} = ${iv(P)}${iv(Q)}`, t: tt, a: `${F.toLowerCase()}/${o}`, op: `${iv(tt)} is multiplied by ${iv(o)}`, inv: `Divide both sides by ${iv(o)}`, h: frac(F, iv(o)), cap: F }; },
        ])();
        const disp = T.h || tx(T.a);
        return { html: `${T.pre || ''}${B(T.f)}<br>Make ${B(iv(T.t))} the subject of the formula.`, ...eAns(T.a), answerHtml: B(`${iv(T.t)} = ${disp}`), answerLabel: `<i>${T.t}</i> =`,
          format: 'Type the expression, e.g. y-z or y/z (use / for divide)', hint: 'Use the inverse operation on both sides.',
          steps: [`In ${T.f}, ${T.op}.`, `${T.inv}.`, `${B(`${iv(T.t)} = ${disp}`)}`] };
      }],
    ['Rearranging formulae (two steps)',
      'Undo the operations in reverse order, just like solving an equation: usually deal with anything added or subtracted first, then undo the multiplication or division.',
      (r) => {
        const [S, A, Bv] = r.sample(LET, 3); const a = r.int(2, 9), b = r.nz(-12, 12);
        const T = r.pick([
          () => ({ f: tx(`${S}=${lin(a, b, A)}`), t: A, a: `(${lin(1, -b, S)})/${a}`, h: frac(tx(lin(1, -b, S)), a), st: [`${b > 0 ? 'Subtract' : 'Add'} ${Math.abs(b)}: ${tx(`${lin(1, -b, S)}=${a}${A}`)}`, `Divide by ${a}`] }),
          () => ({ f: `${iv(S)} = ${frac(tx(lin(1, b, A)), a)}`, t: A, a: lin(a, -b, S), st: [`Multiply both sides by ${a}: ${tx(`${a}${S}=${lin(1, b, A)}`)}`, `${b > 0 ? 'Subtract' : 'Add'} ${Math.abs(b)}`] }),
          () => ({ f: `${iv(S)} = ${frac(iv(A), a)}${pm(b)}`, t: A, a: `${a}(${lin(1, -b, S)})`, st: [`${b > 0 ? 'Subtract' : 'Add'} ${Math.abs(b)}: ${tx(lin(1, -b, S))} = ${frac(iv(A), a)}`, `Multiply both sides by ${a}`] }),
          () => ({ f: tx(`${S}=${a}${A}-${Bv}`), t: A, a: `(${S}+${Bv})/${a}`, h: frac(tx(`${S}+${Bv}`), a), st: [`Add ${iv(Bv)} to both sides: ${tx(`${S}+${Bv}=${a}${A}`)}`, `Divide by ${a}`] }),
          () => { const C = r.pick(LET.filter((l) => ![S, A, Bv].includes(l))); return { f: tx(`${A}${Bv}-${C}=${S}`), t: A, a: `(${S}+${C})/${Bv}`, h: frac(tx(`${S}+${C}`), iv(Bv)), st: [`Add ${iv(C)} to both sides: ${tx(`${A}${Bv}=${S}+${C}`)}`, `Divide by ${iv(Bv)}`] }; },
          () => ({ f: tx(`${S}=${Bv}${A}+${a}`), t: A, a: `(${S}-${a})/${Bv}`, h: frac(tx(`${S}-${a}`), iv(Bv)), st: [`Subtract ${a}: ${tx(`${S}-${a}=${Bv}${A}`)}`, `Divide by ${iv(Bv)}`] }),
          () => ({ f: `${iv(S)} = ${a}(${tx(lin(1, b, A))})`, t: A, a: `${S}/${a}${b > 0 ? '-' : '+'}${Math.abs(b)}`, h: `${frac(iv(S), a)}${pm(-b)}`, st: [`Divide both sides by ${a}: ${frac(iv(S), a)} = ${tx(lin(1, b, A))}`, `${b > 0 ? 'Subtract' : 'Add'} ${Math.abs(b)}`] }),
          () => { const tt = r.chance() ? 't' : 'a'; const o = tt === 't' ? 'a' : 't'; return { pre: 'The formula for final velocity is ', f: tx('v=u+at'), t: tt, a: `(v-u)/${o}`, h: frac(tx('v-u'), iv(o)), st: [`Subtract ${iv('u')}: ${tx('v-u=at')}`, `Divide by ${iv(o)}`] }; },
          () => ({ pre: 'The perimeter of a rectangle is ', f: 'P = 2<i>l</i> + 2<i>w</i>', t: 'l', a: '(p-2w)/2', h: frac('P − 2<i>w</i>', 2), st: ['Subtract 2<i>w</i>: P − 2<i>w</i> = 2<i>l</i>', 'Divide by 2'] }),
          () => ({ pre: 'The area of a triangle is ', f: `A = ${frac(1, 2)}<i>bh</i>`, t: 'h', a: '2a/b', h: frac('2A', iv('b')), st: ['Multiply by 2: 2A = <i>bh</i>', `Divide by ${iv('b')}`] }),
          () => ({ f: tx(`${S}=${a}${A}+${Bv}`), t: A, a: `(${S}-${Bv})/${a}`, h: frac(tx(`${S}-${Bv}`), a), st: [`Subtract ${iv(Bv)}: ${tx(`${S}-${Bv}=${a}${A}`)}`, `Divide by ${a}`] }),
        ])();
        const disp = T.h || tx(T.a);
        return { html: `${T.pre || ''}${B(T.f)}<br>Make ${B(iv(T.t))} the subject.`, ...eAns(T.a), answerHtml: B(`${iv(T.t)} = ${disp}`), answerLabel: `<i>${T.t}</i> =`,
          format: 'Type the expression, e.g. (y-3)/2 — use brackets and / for divide', hint: 'Undo the adding or subtracting first, then the multiplying or dividing.',
          steps: [`Start with ${T.f}`, ...T.st.map((s, i) => (i === T.st.length - 1 ? `${s}: ${B(`${iv(T.t)} = ${disp}`)}` : s))] };
      }],
    ['Rearranging to find a gradient',
      'To read the gradient and y-intercept of a line, rearrange its equation into the form y = mx + c: get the y term on its own, then divide everything by the number in front of y.',
      (r) => {
        const k = r.int(2, 5); let a; do { a = r.nz(-12, 12); } while (Math.abs(a) === k && r.chance(0.7));
        const ask = r.pick(['m', 'm', 'c', 'eq']); const b = ask === 'eq' ? k * r.int(-6, 6) : r.nz(-12, 12);
        // the line is ky = ax + b
        const form = r.int(0, 3); let eqH, st0;
        if (form === 0) { eqH = tx(`${k}y=${lin(a, b)}`); st0 = null; }
        else if (form === 1) { eqH = tx(`${polyT([[k, 'y'], [-a, 'x']])}=${b}`); st0 = `${a > 0 ? 'Add' : 'Subtract'} ${tx(coefT(Math.abs(a), 'x'))} ${a > 0 ? 'to' : 'from'} both sides: ${tx(`${k}y=${lin(a, b)}`)}`; }
        else if (form === 2) { eqH = tx(`${polyT([[-a, 'x'], [k, 'y']])}=${b}`); st0 = `${a < 0 ? 'Subtract' : 'Add'} ${tx(coefT(Math.abs(a), 'x'))} ${a < 0 ? 'from' : 'to'} both sides: ${tx(`${k}y=${lin(a, b)}`)}`; }
        else { eqH = tx(`${polyT([[k, 'y'], [-b, '']])}=${coefT(a, 'x')}`); st0 = `${b < 0 ? 'Subtract' : 'Add'} ${Math.abs(b)} ${b < 0 ? 'from' : 'to'} both sides: ${tx(`${k}y=${lin(a, b)}`)}`; }
        const [mn, md] = simp(a, k), [cn, cd] = simp(b, k);
        const mH = md === 1 ? (mn === 1 ? '' : mn === -1 ? '−' : ds(mn)) : (mn < 0 ? '−' : '') + frac(Math.abs(mn), md);
        const yH = `<i>y</i> = ${mH}<i>x</i>${cn === 0 ? '' : cd === 1 ? pm(cn) : ` ${cn < 0 ? '−' : '+'} ${frac(Math.abs(cn), cd)}`}`;
        const steps = [...(st0 ? [st0] : []), `Divide every term by ${k}: ${yH}`];
        if (ask === 'eq') {
          const ans = `${md === 1 ? coefT(mn, 'x') : `(${mn}/${md})x`}${cn === 0 ? '' : cn > 0 ? '+' + cn : cn}`;
          return { html: `Write the equation ${B(eqH)} in the form ${B(tx('y=mx+c'))}.`, ...eAns(ans), answerHtml: B(yH), answerLabel: '<i>y</i> =', format: 'Type the right-hand side, e.g. 3x-2 or (1/2)x+4', hint: 'Get the y term on its own, then divide by its coefficient.',
            steps: [...steps, `So ${B(yH)}`] };
        }
        const isM = ask === 'm';
        return { html: `A straight line has equation ${B(eqH)}.<br>Find ${isM ? 'the gradient of the line' : 'the <i>y</i>-coordinate of the point where the line crosses the <i>y</i>-axis'}.`, ...fAns(isM ? a : b, k, { simplest: false }),
          format: 'Type a whole number, fraction or decimal, e.g. 2, -3/4 or 0.5', hint: 'Rearrange into y = mx + c first.',
          steps: [...steps, `Compare with y = mx + c: ${isM ? `gradient m = ${B(fracN(mn, md))}` : `y-intercept c = ${B(fracN(cn, cd))}`}`] };
      }],
  ]);

  // ================================================================ y9-conjectures
  const ASW = ['Always true', 'Sometimes true', 'Never true'];
  const ASN = [
    () => ({ s: 'The sum of two odd numbers is even.', a: 0, why: ['Write the odd numbers as 2<i>a</i> + 1 and 2<i>b</i> + 1.', 'Sum = 2<i>a</i> + 2<i>b</i> + 2 = 2(<i>a</i> + <i>b</i> + 1), a multiple of 2.'] }),
    () => ({ s: 'The sum of two even numbers is odd.', a: 2, why: ['Write the even numbers as 2<i>a</i> and 2<i>b</i>.', 'Sum = 2<i>a</i> + 2<i>b</i> = 2(<i>a</i> + <i>b</i>), which is always even — never odd.'] }),
    () => ({ s: 'The product of two odd numbers is odd.', a: 0, why: ['e.g. 3 × 5 = 15, 7 × 9 = 63.', '(2<i>a</i> + 1)(2<i>b</i> + 1) = 4<i>ab</i> + 2<i>a</i> + 2<i>b</i> + 1 = 2(2<i>ab</i> + <i>a</i> + <i>b</i>) + 1, which is one more than an even number.'] }),
    () => ({ s: 'An odd number plus an even number gives an even number.', a: 2, why: ['(2<i>a</i> + 1) + 2<i>b</i> = 2(<i>a</i> + <i>b</i>) + 1.', 'That is one more than an even number, so the answer is always odd.'] }),
    () => ({ s: 'The product of two prime numbers is odd.', a: 1, why: ['3 × 5 = 15 is odd, so it can be true.', 'But 2 × 5 = 10 is even (2 is an even prime), so it is not always true.'] }),
    (r) => { const a = r.int(2, 9), b = r.int(2, 6); return { s: `A multiple of ${a * b} is also a multiple of ${a}.`, a: 0, why: [`${a * b} = ${a} × ${b}, so ${a * b}<i>n</i> = ${a} × ${b}<i>n</i>.`, `Every multiple of ${a * b} is therefore ${a} × (a whole number), a multiple of ${a}.`] }; },
    (r) => { const a = r.int(2, 9), b = r.int(2, 6); return { s: `A multiple of ${a} is also a multiple of ${a * b}.`, a: 1, why: [`${a * b} is a multiple of ${a} and of ${a * b}, so it can be true.`, `But ${a} itself is not a multiple of ${a * b}, so it is not always true.`] }; },
    (r) => { const k = r.pick([2, 3, 4, 5, 6, 7]); const odd = k % 2 === 1; const terms = Array.from({ length: k }, (_, i) => (i ? `<i>n</i> + ${i}` : '<i>n</i>')).join(', ');
      return { s: `The sum of ${k} consecutive whole numbers is a multiple of ${k}.`, a: odd ? 0 : 2, why: [`Call the numbers ${terms}. Their sum is ${k}<i>n</i> + ${(k * (k - 1)) / 2}.`, odd ? `${(k * (k - 1)) / 2} = ${k} × ${(k - 1) / 2}, so the sum = ${k}(<i>n</i> + ${(k - 1) / 2}), always a multiple of ${k}.` : `${(k * (k - 1)) / 2} leaves remainder ${k / 2} when divided by ${k}, so the sum is never a multiple of ${k}.`] }; },
    () => ({ s: 'Squaring a number gives a bigger answer.', a: 1, why: ['3<sup>2</sup> = 9, which is bigger than 3 — so it can be true.', '0.5<sup>2</sup> = 0.25 and 1<sup>2</sup> = 1 are not bigger, so it is not always true.'] }),
    (r) => { const k = r.int(2, 12); return k % 2 === 0
      ? { s: `Multiplying a whole number by ${k} gives an even number.`, a: 0, why: [`${k} = 2 × ${k / 2}, so ${k}<i>n</i> = 2 × ${k / 2}<i>n</i>.`, 'That is a multiple of 2, so it is always even.'] }
      : { s: `Multiplying a whole number by ${k} gives an even number.`, a: 1, why: [`${k} × 2 = ${2 * k} is even.`, `${k} × 3 = ${3 * k} is odd, so it is only sometimes true.`] }; },
    (r) => { const k = r.int(1, 20); return k % 2 === 1
      ? { s: `Adding ${k} to an odd number gives an even number.`, a: 0, why: [`(2<i>n</i> + 1) + ${k} = 2<i>n</i> + ${k + 1} = 2(<i>n</i> + ${(k + 1) / 2}).`, 'That is a multiple of 2, so the result is always even.'] }
      : { s: `Adding ${k} to an odd number gives an even number.`, a: 2, why: [`(2<i>n</i> + 1) + ${k} = 2<i>n</i> + ${k + 1} = 2(<i>n</i> + ${k / 2}) + 1.`, 'That is one more than an even number, so the result is always odd.'] }; },
    (r) => { const a = r.int(4, 12), b = a + r.int(1, 10); return { s: 'For two different positive whole numbers, the HCF is smaller than the LCM.', a: 0, why: [`e.g. ${a} and ${b}: HCF = ${gcd(a, b)}, LCM = ${lcm(a, b)}.`, 'The HCF is at most the smaller number, and the LCM is at least the larger number, so the HCF is always smaller.'] }; },
    (r) => { const [p, q] = r.pick([[4, 6], [6, 8], [6, 9], [8, 12], [10, 15], [4, 10]]); const [u, v] = r.pick([[3, 4], [4, 5], [5, 7], [2, 9], [3, 8]]);
      return { s: 'The LCM of two numbers is equal to their product.', a: 1, why: [`${u} and ${v}: LCM = ${lcm(u, v)} = ${u} × ${v}, so it can be true.`, `${p} and ${q}: LCM = ${lcm(p, q)}, but ${p} × ${q} = ${p * q}. It is only true when the HCF is 1.`] }; },
    (r) => { const a = r.int(4, 30), b = r.int(4, 30); return { s: 'The HCF of two numbers is greater than both of the numbers.', a: 2, why: [`e.g. HCF of ${a} and ${b} is ${gcd(a, b)}.`, 'The HCF is a factor of each number, so it can never be bigger than either of them.'] }; },
    () => ({ s: 'A square number has an odd number of factors.', a: 0, why: ['Factors come in pairs, e.g. 36: 1×36, 2×18, 3×12, 4×9, 6×6.', 'For a square number one pair is a repeated factor (6 × 6), which is only counted once — so the total is always odd.'] }),
    () => ({ s: '<i>n</i><sup>2</sup> + <i>n</i> is even, where <i>n</i> is a whole number.', a: 0, why: ['<i>n</i><sup>2</sup> + <i>n</i> = <i>n</i>(<i>n</i> + 1), the product of two consecutive numbers.', 'One of two consecutive numbers is always even, so the product is always even.'] }),
    () => ({ s: 'The product of two consecutive whole numbers is odd.', a: 2, why: ['One of any two consecutive whole numbers is even.', 'Even × anything is even, so the product is never odd.'] }),
    () => ({ s: 'Halving a number makes it smaller.', a: 1, why: ['Half of 10 is 5, which is smaller.', 'Half of −10 is −5, which is bigger, and half of 0 is 0. So it is only sometimes true.'] }),
    (r) => { const k = r.int(1, 15); return r.chance()
      ? { s: `${tx(`x+${k}`)} is greater than ${iv('x')}.`, a: 0, why: [`Adding ${k} to any number moves it ${k} to the right on the number line.`, `So ${tx(`x+${k}`)} is always greater than ${iv('x')}.`] }
      : { s: `${tx(`x-${k}`)} is greater than ${iv('x')}.`, a: 2, why: [`Subtracting ${k} from any number moves it ${k} to the left on the number line.`, `So ${tx(`x-${k}`)} is always less than ${iv('x')} — never greater.`] }; },
    (r) => { const k = r.int(2, 9); return { s: `${tx(`${k}x`)} is greater than ${iv('x')}.`, a: 1, why: [`If <i>x</i> = 2: ${k} × 2 = ${2 * k} &gt; 2, so it can be true.`, `If <i>x</i> = −1: ${k} × (−1) = −${k}, which is less than −1. (Also <i>x</i> = 0 gives 0 = 0.) So it is only sometimes true.`] }; },
    (r) => { const d = r.pick([2, 5, 3, 4, 6, 7, 8, 9]); return [2, 5].includes(d)
      ? { s: `A whole number ending in ${d} is a multiple of ${d}.`, a: 0, why: [`Every multiple of 10 is a multiple of ${d}, and a number ending in ${d} is (a multiple of 10) + ${d}.`, `So it is always a multiple of ${d}.`] }
      : { s: `A whole number ending in ${d} is a multiple of ${d}.`, a: 1, why: [`${d} itself ends in ${d} and is a multiple of ${d}.`, `${10 + d} ends in ${d} but ${10 + d} ÷ ${d} is not a whole number, so it is only sometimes true.`] }; },
    () => ({ s: 'The sum of three consecutive even numbers is a multiple of 6.', a: 0, why: ['2<i>n</i> + (2<i>n</i> + 2) + (2<i>n</i> + 4) = 6<i>n</i> + 6.', '6<i>n</i> + 6 = 6(<i>n</i> + 1), always a multiple of 6.'] }),
    () => ({ s: 'A prime number is odd.', a: 1, why: ['3, 5, 7 and 11 are odd primes, so it can be true.', '2 is prime and even, so it is not always true.'] }),
  ];

  // claims for "smallest counterexample" (start at n = 1 unless given)
  const CLAIMS = [
    (r) => { const k = r.pick([2, 4, 6, 10, 12, 14]); return { s: `${tx(lin(k, 1, 'n'))} is a prime number for every positive whole number ${iv('n')}.`, bad: (n) => !isPrime(k * n + 1), val: (n) => k * n + 1, show: (n) => `${k} × ${n} + 1 = ${k * n + 1}`, why: (n) => `${k * n + 1} = ${factorText(k * n + 1)}, so it is not prime` }; },
    (r) => { const p = r.pick([3, 5, 11, 17]); return { s: `${tx(`n^2+n+${p}`)} is a prime number for every positive whole number ${iv('n')}.`, bad: (n) => !isPrime(n * n + n + p), val: (n) => n * n + n + p, show: (n) => `${n}<sup>2</sup> + ${n} + ${p} = ${n * n + n + p}`, why: (n) => `${n * n + n + p} = ${factorText(n * n + n + p)}, so it is not prime` }; },
    (r) => { const p = r.pick([3, 5, 11]); return { s: `${tx(`n^2-n+${p}`)} is a prime number for every positive whole number ${iv('n')}.`, bad: (n) => !isPrime(n * n - n + p), val: (n) => n * n - n + p, show: (n) => `${n}<sup>2</sup> − ${n} + ${p} = ${n * n - n + p}`, why: (n) => `${n * n - n + p} = ${factorText(n * n - n + p)}, so it is not prime` }; },
    () => ({ s: `2<sup><i>n</i></sup> + 1 is a prime number for every positive whole number ${iv('n')}.`, bad: (n) => !isPrime(2 ** n + 1), val: (n) => 2 ** n + 1, show: (n) => `2<sup>${n}</sup> + 1 = ${2 ** n + 1}`, why: (n) => `${2 ** n + 1} = ${factorText(2 ** n + 1)}, so it is not prime` }),
    (r) => { const d = r.pick([3, 4, 6, 7, 8, 9]); return { s: `Every positive whole number ending in the digit ${d} is a multiple of ${d}. (Test the numbers ending in ${d} in order.)`, bad: (n) => n % d !== 0, val: (n) => n, list: (i) => d + 10 * (i - 1), show: (n) => `${n} ÷ ${d} ${n % d === 0 ? '= ' + n / d : 'is not a whole number'}`, why: (n) => `${n} is not a multiple of ${d}`, num: true }; },
    (r) => { const [a, b] = r.pick([[4, 6], [6, 9], [4, 10], [6, 8], [10, 15], [6, 15], [8, 12], [9, 12], [12, 18], [6, 10], [4, 14], [8, 20]]);
      return { s: `If a number is a multiple of both ${a} and ${b}, then it is a multiple of ${a * b}. (Test the common multiples of ${a} and ${b} in order.)`, bad: (n) => n % (a * b) !== 0, val: (n) => n, list: (i) => lcm(a, b) * i, show: (n) => `${n} is a multiple of ${a} and of ${b} (it is the LCM)`, why: (n) => `${n} &lt; ${a * b}, so it is not a multiple of ${a * b}`, num: true }; },
    (r) => { const k = r.pick([4, 6, 7, 8, 11, 12, 13]); return { s: `The digits of every multiple of ${k} add up to a multiple of ${k}. (Test the multiples of ${k} in order.)`, bad: (n) => digitSum(n) % k !== 0, val: (n) => n, list: (i) => k * i, show: (n) => `${n}: digit sum = ${digitSum(n)}`, why: (n) => `${digitSum(n)} is not a multiple of ${k}`, num: true }; },
    (r) => { const m = r.int(1, 40); return { s: `Every odd number greater than ${m} is prime. (Test the odd numbers greater than ${m} in order.)`, bad: (n) => !isPrime(n), val: (n) => n, list: (i) => (m % 2 ? m + 2 * i : m - 1 + 2 * i), show: (n) => `${n}`, why: (n) => `${n} = ${factorText(n)}, so it is not prime`, num: true }; },
  ];
  const MCX = [
    (r) => { const ok = r.pick(['0.5', '1', '0', '0.2', '0.8']); const wr = r.sample(['3', '−2', '1.5', '10', '−0.5', '4', '−3', '2'], 3);
      return { s: 'Squaring a number always gives a bigger answer.', opts: [ok, ...wr].map((v) => `${iv('x')} = ${v}`), why: [`${ok}<sup>2</sup> = ${ps(Number(ok) ** 2)}, which is not bigger than ${ok}.`, `For the other values the square is bigger (e.g. (−2)<sup>2</sup> = 4 &gt; −2).`] }; },
    (r) => { const ok = r.pick([['2', '0.5'], ['3', '1'], ['−2', '4'], ['0', '6'], ['5', '0.2']]); const wr = r.sample([['2', '3'], ['4', '5'], ['1.5', '4'], ['6', '7'], ['2.5', '2'], ['3', '9']], 3);
      const P = (p) => `${p[0]} and ${p[1]}`; const pr = Number(ok[0].replace('−', '-')) * Number(ok[1].replace('−', '-'));
      return { s: 'When you multiply two numbers, the answer is always bigger than both numbers.', opts: [P(ok), ...wr.map(P)], why: [`${ok[0]} × ${ok[1]} = ${ds(pr)}, which is not bigger than both ${ok[0]} and ${ok[1]}.`, 'The other pairs all give answers bigger than both numbers.'] }; },
    (r) => { const ok = r.pick([3, 5, 7, 11, 13, 17]); const pool = [[3, 5], [5, 7], [3, 11], [7, 13], [5, 11], [3, 13], [11, 13], [2, 2]]; const wr = r.sample(pool, 3);
      return { s: 'The sum of two prime numbers is always even.', opts: [`2 and ${ok}`, ...wr.map((p) => `${p[0]} and ${p[1]}`)], why: [`2 + ${ok} = ${2 + ok}, which is odd.`, 'The other pairs have even sums. Only one counterexample is needed to disprove the statement.'] }; },
    (r) => { const ok = r.pick([[4, 6], [6, 8], [6, 9], [8, 12], [10, 15], [4, 10], [9, 12]]); const wr = r.sample([[3, 4], [4, 5], [5, 7], [2, 9], [3, 8], [5, 6], [7, 9], [2, 7]], 3);
      return { s: 'The LCM of two numbers is always their product.', opts: [ok, ...wr].map((p) => `${p[0]} and ${p[1]}`), why: [`LCM of ${ok[0]} and ${ok[1]} is ${lcm(ok[0], ok[1])}, but ${ok[0]} × ${ok[1]} = ${ok[0] * ok[1]}.`, 'The other pairs have HCF 1, so their LCM does equal their product.'] }; },
  ];

  const cf = (k) => (k === 1 ? '' : k);
  const BINOM = (r) => { // identity choices: opts[i] = [text, fn]
    for (;;) {
      const v = r.pick(['x', 'n', 'y', 'a']); const a = r.int(1, 9); const kind = r.int(0, 3); let I;
      if (kind === 0) I = { lhs: `(${tx(lin(1, a, v))})<sup>2</sup>`, L: (t) => (t + a) ** 2, opts: [[quad(1, 2 * a, a * a, v), (t) => t * t + 2 * a * t + a * a], [polyT([[1, v + '^2'], [a * a, '']]), (t) => t * t + a * a], [quad(1, a, a * a, v), (t) => t * t + a * t + a * a], [lin(2, 2 * a, v), (t) => 2 * t + 2 * a]],
        why: `(${tx(lin(1, a, v))})(${tx(lin(1, a, v))}) = ${tx(v + '^2')} + ${cf(a)}${iv(v)} + ${cf(a)}${iv(v)} + ${a * a}` };
      else if (kind === 1) { const k = r.int(2, 9); I = { lhs: `${k}(${tx(lin(1, a, v))})`, L: (t) => k * (t + a), opts: [[lin(k, k * a, v), (t) => k * t + k * a], [lin(k, a, v), (t) => k * t + a], [lin(1, k * a, v), (t) => t + k * a], [lin(k, k + a, v), (t) => k * t + k + a]],
        why: `Multiply both terms in the bracket by ${k}: ${k} × ${iv(v)} + ${k} × ${a}` }; }
      else if (kind === 2) { const b = r.int(1, 9); I = { lhs: `(${tx(lin(1, a, v))})(${tx(lin(1, b, v))})`, L: (t) => (t + a) * (t + b), opts: [[quad(1, a + b, a * b, v), (t) => t * t + (a + b) * t + a * b], [quad(1, a * b, a + b, v), (t) => t * t + a * b * t + a + b], [polyT([[1, v + '^2'], [a * b, '']]), (t) => t * t + a * b], [quad(1, a + b, a + b, v), (t) => t * t + (a + b) * t + a + b]],
        why: `${tx(v + '^2')} + ${cf(b)}${iv(v)} + ${cf(a)}${iv(v)} + ${a * b}` }; }
      else I = { lhs: `(${tx(lin(1, a, v))})(${tx(lin(1, -a, v))})`, L: (t) => (t + a) * (t - a), opts: [[polyT([[1, v + '^2'], [-a * a, '']]), (t) => t * t - a * a], [polyT([[1, v + '^2'], [a * a, '']]), (t) => t * t + a * a], [quad(1, -2 * a, -a * a, v), (t) => t * t - 2 * a * t - a * a], [polyT([[1, v + '^2'], [-a, '']]), (t) => t * t - a]],
        why: `${tx(v + '^2')} − ${cf(a)}${iv(v)} + ${cf(a)}${iv(v)} − ${a * a} (the middle terms cancel)` };
      I.v = v;
      if (new Set(I.opts.map((o) => o[0])).size === 4) return I;
    }
  };
  topic('y9-conjectures', 'number', 9, 1, 'FH', 'Testing Conjectures & Simple Proof', 'Decide if statements are always, sometimes or never true, find counterexamples and use algebra (2n, 2n + 1, n + 10 …) to prove results.', [
    ['Always, sometimes or never true',
      'Test several kinds of number: odd and even, 0 and 1, negatives and fractions. If every case works and you can explain why, it is always true; if some work and some do not, it is sometimes true; if none can work, it is never true.',
      (r) => {
        const S = r.pick(ASN)(r);
        return { html: `Is this statement always true, sometimes true or never true?<br>${B(S.s)}`, ...mcq(r, ASW, S.a), hint: 'Try odd and even numbers, 0, 1, negatives and fractions. Algebra like 2n and 2n + 1 can prove it.',
          steps: [...S.why, `So the statement is ${B(ASW[S.a].toLowerCase())}.`] };
      }],
    ['Counterexamples',
      'A conjecture is a statement that seems to be true. Just one counterexample — a case where it is false — is enough to prove it wrong. Test values carefully and in order.',
      (r) => {
        if (r.chance(0.3)) {
          const C = r.pick(MCX)(r);
          return { html: `Sam makes this conjecture:<br>${B(C.s)}<br>Which of these is a counterexample that shows Sam is wrong?`, ...mcq(r, C.opts, 0), hint: 'A counterexample is a case where the statement is false.',
            steps: [...C.why, `So ${B(C.opts[0])} is a counterexample.`] };
        }
        const C = r.pick(CLAIMS)(r); const at = (i) => (C.list ? C.list(i) : i);
        let i = 1; while (!C.bad(at(i)) && i < 200) i++;
        const ans = at(i); const prev = []; for (let j = Math.max(1, i - 3); j < i; j++) prev.push(at(j));
        const qWhat = C.num ? 'Find the smallest number that is a counterexample to this statement.' : `Find the smallest positive whole number ${iv('n')} that is a counterexample.`;
        return { html: `Here is a conjecture:<br>${B(C.s)}<br>${qWhat}`, ...nAns(ans), answerLabel: C.num ? '' : '<i>n</i> =', hint: C.num ? 'Test the numbers in order until one fails.' : 'Substitute n = 1, 2, 3, … until the result is not prime.',
          steps: [`Test the cases in order${prev.length ? '' : ' — the very first one fails'}.`, ...(prev.length ? [`${i > 4 ? '… ' : ''}${prev.map((n) => (C.num ? C.show(n) : `${iv('n')} = ${n}: ${C.show(n)}`)).join('; ')} — all of these fit the statement.`] : []),
            `${C.num ? C.show(ans) : `${iv('n')} = ${ans}: ${C.show(ans)}`} — ${C.why(ans)}.`, `So the smallest counterexample is ${B(ans)}. One counterexample is enough to disprove a conjecture.`] };
      }],
    ['Odd, even & consecutive numbers in algebra',
      'Any even number can be written 2n and any odd number 2n + 1, where n is a whole number. Consecutive numbers are n, n + 1, n + 2, … Simplify, then factorise to show what the result is always a multiple of.',
      (r) => {
        const mode = r.int(0, 4);
        if (mode === 0) {
          const k = r.int(1, 4);
          const T = r.pick([
            [`the next even number after 2${iv('n')}`, 'n', '2n+2', 'Even numbers go up in 2s.'],
            [`the even number that comes ${k + 1} even numbers after 2${iv('n')}`, 'n', `2n+${2 * (k + 1)}`, 'Each even number is 2 more than the one before.'],
            [`the next odd number after 2${iv('n')} + 1`, 'n', '2n+3', 'Odd numbers go up in 2s.'],
            [`the odd number just before 2${iv('n')} + 1`, 'n', '2n-1', 'Odd numbers go down in 2s.'],
            [`the sum of the even number 2${iv('n')} and the next even number`, 'n', '4n+2', '2n + (2n + 2)'],
            [`the sum of 2${iv('n')} + 1 and the next ${k + 1} odd numbers after it`, 'n', `${2 * (k + 2)}n+${(k + 2) * (k + 2)}`, 'List them: 2n + 1, 2n + 3, 2n + 5, …'],
          ]);
          return { html: `${iv('n')} is a whole number. Write a simplified expression for ${B(T[0])}.`, ...eAns(T[2], { form: 'expanded' }), format: 'Type a simplified expression, e.g. 2n+5', hint: T[3],
            steps: [T[3], `Simplify: ${B(tx(T[2]))}`] };
        }
        let k, a, b, terms, what; const askNum = r.chance(0.5);
        if (mode === 1) { do { k = r.int(2, 7); } while (gcd(k, (k * (k - 1)) / 2) < 2); a = k; b = (k * (k - 1)) / 2; terms = Array.from({ length: k }, (_, i) => (i ? `(<i>n</i> + ${i})` : '<i>n</i>')); what = `${k} consecutive whole numbers, starting with ${iv('n')}`; }
        else if (mode === 2) { k = r.int(2, 6); a = 2 * k; b = k * (k - 1); terms = Array.from({ length: k }, (_, i) => (i ? `(2<i>n</i> + ${2 * i})` : '2<i>n</i>')); what = `${k} consecutive even numbers, starting with 2${iv('n')}`; }
        else if (mode === 3) { k = r.int(2, 6); a = 2 * k; b = k * k; terms = Array.from({ length: k }, (_, i) => `(2<i>n</i> + ${2 * i + 1})`); what = `${k} consecutive odd numbers, starting with 2${iv('n')} + 1`; }
        else {
          const A = r.int(1, 6); const T = r.pick([
            [`(2<i>n</i> + 1)<sup>2</sup>`, '4n^2+4n+1', '(2n + 1)(2n + 1) = 4n² + 2n + 2n + 1', 'It is 2(2n² + 2n) + 1, so the square of an odd number is always odd.'],
            [`(<i>n</i> + 1)<sup>2</sup> − <i>n</i><sup>2</sup>`, '2n+1', 'n² + 2n + 1 − n²', 'So the difference between consecutive square numbers is always odd.'],
            [`(<i>n</i> + ${A})<sup>2</sup> − <i>n</i><sup>2</sup>`, `${2 * A}n+${A * A}`, `n² + ${2 * A}n + ${A * A} − n²`, `The n² terms cancel.`],
            [`(<i>n</i> + ${A})<sup>2</sup> − (<i>n</i> − ${A})<sup>2</sup>`, `${4 * A}n`, `(n² + ${2 * A}n + ${A * A}) − (n² − ${2 * A}n + ${A * A})`, `So the result is always a multiple of ${4 * A}.`],
            [`(2<i>n</i> + 1)(2<i>n</i> + 3)`, '4n^2+8n+3', '4n² + 6n + 2n + 3', 'This is 2(2n² + 4n + 1) + 1, so the product of two odd numbers is odd.'],
            [`2<i>n</i>(2<i>n</i> + 2)`, '4n^2+4n', '4n² + 4n', `= 4n(n + 1); one of n and n + 1 is even, so it is a multiple of 8.`],
          ]);
          return { html: `Expand and simplify ${B(T[0])}.`, ...eAns(T[1], { form: 'expanded' }), format: 'Type a simplified expression without brackets, e.g. 4n^2+4n+1', hint: 'Expand each bracket carefully, then collect like terms.',
            steps: [`Expand: ${T[2]}`, `Simplify: ${B(tx(T[1]))}`, T[3]] };
        }
        const g = gcd(a, b); const exprT = lin(a, b, 'n'); const fac = `${g}(${lin(a / g, b / g, 'n')})`;
        if (askNum) return { html: `Show that the sum of ${what} is always a multiple of a certain number.<br>What is the ${B('largest')} whole number that the sum is always a multiple of?`, ...nAns(g), hint: 'Add the terms, simplify, then take out the highest common factor.',
          steps: [`Sum = ${terms.join(' + ')}`, `= ${tx(exprT)}`, `Factorise: ${tx(fac)}`, `So the sum is always a multiple of ${B(g)}.`] };
        return { html: `Write and simplify an expression for the sum of ${what}.`, ...eAns(exprT, { form: 'expanded' }), format: 'Type a simplified expression, e.g. 3n+3', hint: 'Write out each number in terms of n, then collect like terms.',
          steps: [`Sum = ${terms.join(' + ')}`, `= ${B(tx(exprT))}`, `This factorises to ${tx(fac)}, so the sum is always a multiple of ${g}.`] };
      }],
    ['Identities & verification',
      'An identity (≡) is true for every value of the letter. Numerical verification tests one value; algebraic verification (expanding and simplifying) proves it for all values. One value that fails shows it is not an identity.',
      (r) => {
        const I = BINOM(r); const ok = I.opts[0][0];
        if (r.chance(0.6)) {
          return { html: `Which of these is true for ${B('every')} value of the letter?`, ...mcq(r, I.opts.map((o) => `${I.lhs} ≡ ${tx(o[0])}`), 0), hint: 'Expand the brackets fully — multiply every term in one bracket by every term in the other.',
            steps: [`Expand: ${I.why} = ${tx(ok)}`, `So ${B(`${I.lhs} ≡ ${tx(ok)}`)} is the identity.`, 'Check numerically with any value of the letter: both sides give the same answer.'] };
        }
        const [wrong, wf] = I.opts[r.int(1, 3)]; const v = I.v; let k, L, R;
        do { k = r.nz(-5, 6); L = I.L(k); R = wf(k); } while (L === R);
        return { html: `Jo says that ${B(`${I.lhs} ≡ ${tx(wrong)}`)}.<br>Substitute ${B(`${iv(v)} = ${ds(k)}`)} into both sides. What is the left-hand side minus the right-hand side?`, ...nAns(L - R), hint: 'Work out each side separately, using brackets for negative numbers.',
          steps: [`Left-hand side with ${iv(v)} = ${ds(k)}: ${ds(L)}`, `Right-hand side with ${iv(v)} = ${ds(k)}: ${ds(R)}`, `Difference = ${ds(L)} − ${br(R)} = ${B(ds(L - R))}`, `The sides are different, so this is ${B('not')} an identity. In fact ${I.lhs} ≡ ${tx(ok)}.`] };
      }],
    ['Generalising on a number grid',
      'On a 100 square, if a number is n then the number to its right is n + 1, the one below is n + 10 and the one above-right is n − 9. On a grid w wide, “below” is n + w. Use these to write and simplify expressions.',
      (r) => {
        const w = r.chance(0.65) ? 10 : r.pick([6, 8, 9, 12]); const gridTxt = w === 10 ? 'a 100 square (rows of 10, numbered 1 to 100)' : `a number grid with ${w} numbers in each row (1 to ${w} in the first row, ${w + 1} to ${2 * w} in the second, and so on)`;
        const mode = r.int(0, 2);
        if (mode === 0) {
          const D = r.pick([[0, 1, 'immediately to the right of'], [0, -1, 'immediately to the left of'], [1, 0, 'directly below'], [-1, 0, 'directly above'], [1, 1, 'diagonally below and to the right of'], [1, -1, 'diagonally below and to the left of'], [-1, 1, 'diagonally above and to the right of'], [-1, -1, 'diagonally above and to the left of'], [2, 0, 'two rows directly below'], [-2, 0, 'two rows directly above'], [0, 2, 'two places to the right of']]);
          const off = D[0] * w + D[1]; const cells = []; for (let i = -2; i <= 2; i++) { const row = []; for (let j = -2; j <= 2; j++) row.push({ t: i === 0 && j === 0 ? 'n' : i === D[0] && j === D[1] ? '?' : '', hi: (i === 0 && j === 0) || (i === D[0] && j === D[1]) }); cells.push(row); }
          return { html: `On ${gridTxt}, a number is called ${iv('n')}.<br>Write an expression for the number ${B(D[2])} ${iv('n')}.`, diagram: cellsSvg(cells), ...eAns(lin(1, off, 'n')), format: 'Type an expression, e.g. n+3', hint: `Moving one place right adds 1; moving one row down adds ${w}.`,
            steps: [`Each row has ${w} numbers, so one row down adds ${w} and one row up subtracts ${w}; one place right adds 1.`, `Change: ${D[0] && D[1] ? `${D[0] > 0 ? '+' : '−'}${Math.abs(D[0]) * w} ${D[1] > 0 ? '+' : '−'} ${Math.abs(D[1])} = ${ds(off)}` : `${off > 0 ? '+' : '−'}${Math.abs(off)}`}`, `Expression: ${B(tx(lin(1, off, 'n')))}`] };
        }
        if (mode === 1) {
          const S = r.pick([['2 × 2 square', [[0, 0], [0, 1], [1, 0], [1, 1]]], ['plus-shaped cross', [[-1, 0], [0, -1], [0, 0], [0, 1], [1, 0]]], ['L-shape', [[0, 0], [1, 0], [2, 0], [2, 1]]], ['T-shape', [[0, -1], [0, 0], [0, 1], [1, 0], [2, 0]]], ['row of three', [[0, 0], [0, 1], [0, 2]]], ['column of three', [[0, 0], [1, 0], [2, 0]]]]);
          const offs = S[1].map(([i, j]) => i * w + j); const k = offs.length, c = offs.reduce((s, v) => s + v, 0);
          const rs = S[1].map((p) => p[0]), cs = S[1].map((p) => p[1]); const r0 = Math.min(...rs), r1 = Math.max(...rs), c0 = Math.min(...cs), c1 = Math.max(...cs);
          const cells = []; for (let i = r0; i <= r1; i++) { const row = []; for (let j = c0; j <= c1; j++) { const on = S[1].some((p) => p[0] === i && p[1] === j); const o = i * w + j; row.push({ t: on ? (o === 0 ? 'n' : tx(lin(1, o, 'n'))) : '', hi: on }); } cells.push(row); }
          const cellsQ = cells.map((row) => row.map((c2) => ({ t: c2.t === 'n' ? 'n' : '', hi: c2.hi })));
          const terms = offs.map((o) => tx(lin(1, o, 'n'))).join(' + ');
          if (r.chance(0.5)) return { html: `A ${S[0]} is placed on ${gridTxt}. The cell marked ${iv('n')} contains the number ${iv('n')}.<br>Write a simplified expression for the ${B('total')} of the numbers in the shape.`, diagram: cellsSvg(cellsQ), ...eAns(lin(k, c, 'n'), { form: 'expanded' }), format: 'Type a simplified expression, e.g. 4n+22', hint: 'Write each number in the shape in terms of n, then add.',
            steps: [`Numbers in the shape: ${cells.flat().filter((x) => x.t).map((x) => (x.t === 'n' ? '<i>n</i>' : x.t)).join(', ')}`, `Total = ${terms}`, `= ${B(tx(lin(k, c, 'n')))}`] };
          let n; do { n = r.int(w + 2, w * 8); } while ((n - 1) % w + c0 < 0 || (n - 1) % w + c1 > w - 1 || n + r0 * w < 1);
          const T = k * n + c;
          return { html: `A ${S[0]} is placed on ${gridTxt}. The cell marked ${iv('n')} contains the number ${iv('n')}, and the total of the numbers in the shape is ${B(T)}.<br>Find ${iv('n')}.`, diagram: cellsSvg(cellsQ), ...nAns(n), answerLabel: '<i>n</i> =', hint: 'Write the total as an expression in n, then solve the equation.',
            steps: [`Total = ${terms} = ${tx(lin(k, c, 'n'))}`, `${tx(lin(k, c, 'n'))} = ${T}`, `${k}<i>n</i> = ${ds(T - c)}`, `<i>n</i> = ${B(n)}`] };
        }
        const s = r.int(2, 4); const p = s - 1, q = (s - 1) * w; const ex = r.int(1, w - s + 1) + w * r.int(0, 3);
        return { html: `On ${gridTxt}, a ${s} × ${s} square is drawn. The top-left number is ${iv('n')}.<br>Multiply the top-right and bottom-left corners, then subtract the product of the top-left and bottom-right corners. What is the answer, whatever the value of ${iv('n')}?`, ...nAns(p * q), hint: 'Write each corner in terms of n, expand both products and subtract.',
          steps: [`Corners: top-left ${iv('n')}, top-right ${tx(lin(1, p, 'n'))}, bottom-left ${tx(lin(1, q, 'n'))}, bottom-right ${tx(lin(1, p + q, 'n'))}`, `(${tx(lin(1, p, 'n'))})(${tx(lin(1, q, 'n'))}) = ${tx(quad(1, p + q, p * q, 'n'))}`, `${iv('n')}(${tx(lin(1, p + q, 'n'))}) = ${tx(quad(1, p + q, 0, 'n'))}`, `Difference = ${B(p * q)}, for every value of ${iv('n')}.`, `Check with ${iv('n')} = ${ex}: ${ex + p} × ${ex + q} − ${ex} × ${ex + p + q} = ${(ex + p) * (ex + q) - ex * (ex + p + q)} ✓`] };
      }],
  ]);

  // ================================================================ y9-nonlinear-graphs
  const subQuad = (a, b, c, x) => {
    const t1 = `${a === 1 ? '' : a === -1 ? '−' : ds(a) + ' × '}${a === -1 ? `(${ds(x)})` : br(x)}<sup>2</sup>`;
    const t2 = b ? ` ${b < 0 ? '−' : '+'} ${Math.abs(b) === 1 ? '' : Math.abs(b) + ' × '}${br(x)}` : ''; const t3 = c ? ` ${c < 0 ? '−' : '+'} ${Math.abs(c)}` : '';
    const v1 = a * x * x, v2 = b * x;
    return [t1 + t2 + t3, `${ds(v1)}${b ? pm(v2) : ''}${c ? pm(c) : ''}`];
  };
  const rangeFor = (vals) => { const lo = Math.min(...vals), hi = Math.max(...vals); const span = hi - lo; return { ys: span > 24 ? 5 : span > 12 ? 2 : 1 }; };
  const GT = ['Linear', 'Quadratic', 'Cubic', 'Reciprocal', 'Exponential'];
  const GDESC = ['a straight line', 'a U-shaped or ∩-shaped parabola', 'an S-shaped curve', 'two separate curves that never touch the axes (asymptotes)', 'a curve that grows (or decays) faster and faster and never touches the x-axis'];
  const graphOf = (r, t) => {
    if (t === 0) { const m = r.nz(-3, 3), c = r.int(-3, 3); return { h: `<i>y</i> = ${tx(lin(m, c))}`, f: (x) => m * x + c, why: 'the highest power of x is 1' }; }
    if (t === 1) { const s = r.pick([1, -1]), c = r.int(-4, 3) * s, b = r.int(-2, 2); return { h: `<i>y</i> = ${tx(quad(s, b, c))}`, f: (x) => s * x * x + b * x + c, why: 'the highest power of x is 2' }; }
    if (t === 2) { const [h, f] = r.pick([['x^3', (x) => x ** 3], ['x^3-3x', (x) => x ** 3 - 3 * x], ['x^3+2', (x) => x ** 3 + 2], ['-x^3', (x) => -(x ** 3)], ['x^3-4x', (x) => x ** 3 - 4 * x], ['x^3-2', (x) => x ** 3 - 2]]); return { h: `<i>y</i> = ${tx(h)}`, f, why: 'the highest power of x is 3' }; }
    if (t === 3) { const k = r.pick([1, 2, 3, 4, -1, -2, -3]); return { h: `<i>y</i> = ${k < 0 ? '−' : ''}${frac(Math.abs(k), '<i>x</i>')}`, f: (x) => (Math.abs(x) < 1e-9 ? NaN : k / x), why: 'x is in the denominator (y = k/x)' }; }
    const [h, f] = r.pick([['2^x', (x) => 2 ** x], ['3^x', (x) => 3 ** x], ['(1/2)^x', (x) => 0.5 ** x], ['2^(-x)', (x) => 2 ** -x], ['2^x+1', (x) => 2 ** x + 1]]); return { h: `<i>y</i> = ${tx(h)}`, f, why: 'x is the power (index)' };
  };
  const eqFor = (r, t) => {
    const a = r.int(2, 9), b = r.nz(-9, 9), c = r.nz(-9, 9);
    return [
      () => r.pick([tx(`y=${lin(a, b)}`), tx(`y=${polyT([[c, ''], [-a, 'x']])}`), tx(`y=${coefT(-a, 'x')}`), `<i>y</i> = ${frac('<i>x</i>', a)}${pm(b)}`]),
      () => r.pick([tx(`y=${quad(1, b, c)}`), tx(`y=${quad(a, 0, c)}`), tx(`y=${polyT([[c, ''], [-1, 'x^2']])}`), tx(`y=${quad(-a, b, 0)}`)]),
      () => r.pick([tx(`y=${polyT([[1, 'x^3'], [b, 'x']])}`), tx(`y=${polyT([[a, 'x^3'], [c, '']])}`), tx(`y=${polyT([[1, 'x^3'], [b, 'x^2'], [c, '']])}`), tx(`y=${polyT([[-1, 'x^3'], [a, 'x']])}`)]),
      () => r.pick([`<i>y</i> = ${frac(a, '<i>x</i>')}`, `<i>y</i> = −${frac(a, '<i>x</i>')}`, `<i>y</i> = ${frac(1, '<i>x</i>')}`, `<i>xy</i> = ${a * 2}`]),
      () => r.pick([tx(`y=${a}^x`), tx('y=2^x'), tx('y=(1/2)^x'), tx(`y=${a}^x${b < 0 ? '-' : '+'}${Math.abs(b)}`), tx(`y=${a}*2^x`)]),
    ][t]();
  };

  topic('y9-nonlinear-graphs', 'algebra', 9, 3, 'FH', 'Quadratic & Other Graphs, Representing Inequalities', 'Tables of values for quadratics, roots and turning points, recognising graph shapes, and showing inequalities on number lines and graphs.', [
    ['Tables of values for quadratics',
      'Substitute each x-value into the equation to find y. Put negative x-values in brackets so they are squared correctly: (−3)² = 9, not −9. Remember to square before multiplying.',
      (r) => {
        const a = r.pick([1, 1, 1, -1, 2]), b = r.int(-5, 5), c = r.int(-8, 8); const s = r.int(-4, -1); const xs = Array.from({ length: 7 }, (_, i) => s + i);
        const f = (x) => a * x * x + b * x + c; let qx; do { qx = r.pick(xs); } while (qx === 0 && r.chance(0.8));
        const [sub, mid] = subQuad(a, b, c, qx);
        const tbl = htable(['<i>x</i>', ...xs.map((x) => ds(x))], [['<i>y</i>', ...xs.map((x) => (x === qx ? B('?') : ds(f(x))))]]);
        return { html: `Here is a table of values for ${B(tx('y=' + quad(a, b, c)))}.${tbl}Work out the missing value of ${iv('y')}.`, ...nAns(f(qx)), answerLabel: '<i>y</i> =', hint: `Substitute x = ${ds(qx)}. Use brackets: (${ds(qx)})² = ${qx * qx}.`,
          steps: [`Substitute <i>x</i> = ${ds(qx)}: <i>y</i> = ${sub}`, `= ${mid}`, `<i>y</i> = ${B(ds(f(qx)))}`, 'Check: the y-values should be symmetrical about the turning point.'] };
      }],
    ['Roots, y-intercept & turning point',
      'The roots are where the curve crosses the x-axis (y = 0). The y-intercept is where it crosses the y-axis (x = 0). The turning point is the lowest (or highest) point, halfway between the roots on the line of symmetry.',
      (r) => {
        let p, q; do { p = r.int(-5, 3); q = p + 2 * r.int(1, 3); } while (q > 5);
        const s = r.chance(0.75) ? 1 : -1; const h = (p + q) / 2; const f = (x) => s * (x - p) * (x - q); const k = f(h); const yi = f(0);
        const eqH = tx('y=' + quad(s, -s * (p + q), s * p * q)); const useTable = r.chance(0.5); const ask = r.pick(['roots', 'roots', 'tp', 'tp', 'yint', 'sym']);
        let diagram = null, rep;
        if (useTable) { const xs = Array.from({ length: 7 }, (_, i) => h - 3 + i); rep = `The table shows values for ${B(eqH)}.${htable(['<i>x</i>', ...xs.map((x) => ds(x))], [['<i>y</i>', ...xs.map((x) => ds(f(x)))]])}`; }
        else {
          const xmin = Math.min(p - 1, -1), xmax = Math.max(q + 1, 1); const ylo = Math.min(k, yi, 0, f(xmin), f(xmax)), yhi = Math.max(k, yi, 0, f(xmin), f(xmax));
          const ymin = Math.max(Math.min(k, yi, 0) - 1, -12), ymax = Math.min(Math.max(k, yi, 0) + 1, 12); void ylo; void yhi;
          diagram = axesSvg({ xmin, xmax, ymin, ymax, curves: [f], ...rangeFor([ymin, ymax]), pts: [[p, 0], [q, 0], [h, k], [0, yi]].filter((pt) => pt[1] >= ymin && pt[1] <= ymax) });
          rep = `The graph of ${B(eqH)} is drawn.`;
        }
        const src = useTable ? 'From the table' : 'From the graph';
        if (ask === 'roots') return { html: `${rep}<br>Write down the roots of ${B(tx(quad(s, -s * (p + q), s * p * q) + '=0'))}.`, diagram, answer: `${p}, ${q}`, check: { type: 'pair', values: [p, q] }, answerHtml: B(`<i>x</i> = ${ds(p)} and <i>x</i> = ${ds(q)}`), format: 'Give both values separated by a comma, e.g. −1, 3', hint: 'Roots are where y = 0 (the curve crosses the x-axis).',
          steps: [`${src}, find where <i>y</i> = 0.`, `This happens at <i>x</i> = ${ds(p)} and <i>x</i> = ${ds(q)}.`, `Roots: ${B(`${ds(p)} and ${ds(q)}`)}`] };
        if (ask === 'tp') return { html: `${rep}<br>Write down the coordinates of the turning point.`, diagram, answer: `${h}, ${k}`, check: { type: 'pair', values: [h, k], ordered: true }, answerHtml: B(`(${ds(h)}, ${ds(k)})`), format: 'Type the coordinates x, y, e.g. 2, −9', hint: 'The turning point is on the line of symmetry, halfway between the roots.',
          steps: [`The roots are ${ds(p)} and ${ds(q)}; halfway between them is <i>x</i> = (${ds(p)} + ${br(q)}) ÷ 2 = ${ds(h)}.`, `When <i>x</i> = ${ds(h)}, <i>y</i> = ${ds(k)} — the ${s > 0 ? 'lowest (minimum)' : 'highest (maximum)'} point.`, `Turning point: ${B(`(${ds(h)}, ${ds(k)})`)}`] };
        if (ask === 'yint') return { html: `${rep}<br>Write down the ${iv('y')}-coordinate of the point where the curve crosses the ${iv('y')}-axis.`, diagram, ...nAns(yi), hint: 'The y-axis is where x = 0.',
          steps: ['The curve crosses the y-axis where <i>x</i> = 0.', `<i>y</i> = ${s === 1 ? '' : '−'}(0 − ${br(p)})(0 − ${br(q)}) = ${ds(yi)} — the constant term in the equation.`, `<i>y</i>-intercept: ${B(ds(yi))}`] };
        return { html: `${rep}<br>Write down the equation of the line of symmetry of the curve.`, diagram, ...nAns(h), answerLabel: '<i>x</i> =', hint: 'The line of symmetry is a vertical line halfway between the roots.',
          steps: [`The roots are <i>x</i> = ${ds(p)} and <i>x</i> = ${ds(q)}.`, `Halfway: (${ds(p)} + ${br(q)}) ÷ 2 = ${ds(h)}`, `Line of symmetry: ${B(`<i>x</i> = ${ds(h)}`)}`] };
      }],
    ['Recognising graph shapes',
      'Look at the highest power of x: power 1 gives a straight line, power 2 a parabola (quadratic), power 3 an S-shaped cubic. y = k/x is reciprocal (it never touches the axes) and y = 2ˣ, with x as the power, is exponential.',
      (r) => {
        const t = r.int(0, 4); const mode = r.int(0, 2);
        if (mode === 0) { const e = eqFor(r, t);
          return { html: `What type of graph does ${B(e)} have?`, ...mcq(r, GT, t), hint: 'Look at the highest power of x, whether x is in the denominator, or whether x is a power.',
            steps: [`In ${e}, ${graphOf(r, t).why}.`, `So it is ${t === 4 ? 'an' : 'a'} ${B(GT[t].toLowerCase())} graph: ${GDESC[t]}.`] }; }
        const g = graphOf(r, t); const others = r.sample([0, 1, 2, 3, 4].filter((x) => x !== t), 3);
        const diagram = axesSvg({ xmin: -4, xmax: 4, ymin: -6, ymax: 6, curves: [g.f], ys: 2 });
        if (mode === 1) return { html: 'Which equation could match this sketch?', diagram, ...mcq(r, [g.h, ...others.map((o) => graphOf(r, o).h)], 0), hint: 'Is it a straight line, a parabola, an S-shape, two separate branches or a curve that rises faster and faster?',
          steps: [`The graph is ${GDESC[t]}.`, `That is ${t === 4 ? 'an' : 'a'} ${GT[t].toLowerCase()} graph, because ${g.why}: ${B(g.h)}`] };
        return { html: 'What type of graph is shown in the sketch?', diagram, ...mcq(r, GT, t), hint: 'Straight, U-shaped, S-shaped, two branches or ever-steeper growth?',
          steps: [`The graph is ${GDESC[t]}.`, `It is ${B(GT[t].toLowerCase())}, e.g. ${g.h}.`] };
      }],
    ['Inequalities on a number line',
      'An open circle (○) means the value is not included (< or >); a filled circle (●) means it is included (≤ or ≥). An arrow shows the values carry on forever in that direction.',
      (r) => {
        const mode = r.int(0, 2);
        if (mode === 0) {
          if (r.chance(0.5)) { const k = r.int(-5, 5), op = r.pick(['<', '>', '<=', '>=']); const lo = k - r.int(2, 4), hi = lo + 8; const right = op[0] === '>'; const inc = op.length === 2;
            return { html: 'Write down the inequality shown on the number line.', diagram: numLineSvg(lo, hi, right ? k : null, inc, right ? null : k, inc), answer: `x${op}${ps(k)}`, check: { type: 'text', accept: [`x${op}${ps(k)}`, `${ps(k)}${FLIP[op]}x`] }, answerHtml: B(`<i>x</i> ${OPH[op]} ${ds(k)}`), format: 'Type e.g. x>3 or x<=-2 (you can use ≤ and ≥)', hint: 'Open circle: < or >. Filled circle: ≤ or ≥. The arrow shows the direction.',
              steps: [`The circle is at ${ds(k)} and is ${inc ? 'filled, so ' + ds(k) + ' is included' : 'open, so ' + ds(k) + ' is not included'}.`, `The arrow points ${right ? 'right (greater than)' : 'left (less than)'}.`, `Inequality: ${B(`<i>x</i> ${OPH[op]} ${ds(k)}`)}`] }; }
          const a = r.int(-5, 3), b = a + r.int(2, 5), o1 = r.pick(['<', '<=']), o2 = r.pick(['<', '<=']); const lo = a - r.int(1, 2), hi = lo + 9;
          const ans = `${ps(a)}${o1}x${o2}${ps(b)}`;
          return { html: 'Write down the inequality shown on the number line.', diagram: numLineSvg(lo, Math.max(hi, b + 1), a, o1 === '<=', b, o2 === '<='), answer: ans, check: { type: 'text', accept: [ans, `${ps(b)}${FLIP[o2]}x${FLIP[o1]}${ps(a)}`] }, answerHtml: B(`${ds(a)} ${OPH[o1]} <i>x</i> ${OPH[o2]} ${ds(b)}`), format: 'Type e.g. -2<x<=3 (you can use ≤ and ≥)', hint: 'Write it as (left end) sign x sign (right end).',
            steps: [`Left end ${ds(a)}: ${o1 === '<=' ? 'filled circle, included (≤)' : 'open circle, not included (&lt;)'}.`, `Right end ${ds(b)}: ${o2 === '<=' ? 'filled circle, included (≤)' : 'open circle, not included (&lt;)'}.`, `Inequality: ${B(`${ds(a)} ${OPH[o1]} <i>x</i> ${OPH[o2]} ${ds(b)}`)}`] };
        }
        if (mode === 1) {
          const a = r.int(-6, 3), b = a + r.int(2, 6), o1 = r.pick(['<', '<=']), o2 = r.pick(['<', '<=']); const ints = []; for (let i = a; i <= b; i++) if ((o1 === '<' ? i > a : i >= a) && (o2 === '<' ? i < b : i <= b)) ints.push(i);
          const v = r.pick(['x', 'n']);
          return { html: `${iv(v)} is an integer and ${B(`${ds(a)} ${OPH[o1]} ${iv(v)} ${OPH[o2]} ${ds(b)}`)}.<br>List all the possible values of ${iv(v)}.`, answer: ints.join(', '), check: { type: 'text', accept: [ints.join(','), ints.join(';')] }, answerHtml: B(ints.map((x) => ds(x)).join(', ')), format: 'List them in order, separated by commas, e.g. -1, 0, 1, 2', hint: '< means the end value is not included; ≤ means it is.',
            steps: [`${ds(a)} is ${o1 === '<=' ? '' : 'not '}included; ${ds(b)} is ${o2 === '<=' ? '' : 'not '}included.`, `Integers: ${B(ints.map((x) => ds(x)).join(', '))}`] };
        }
        const k = r.int(-9, 12), op = r.pick(['<', '>', '<=', '>=']); const big = op[0] === '<'; const ans = op === '<' ? k - 1 : op === '<=' ? k : op === '>' ? k + 1 : k;
        return { html: `${iv('x')} is an integer and ${B(`<i>x</i> ${OPH[op]} ${ds(k)}`)}.<br>What is the ${big ? 'largest' : 'smallest'} possible value of ${iv('x')}?`, ...nAns(ans), hint: op.length === 2 ? `${ds(k)} itself is included.` : `${ds(k)} itself is not included.`,
          steps: [`${OPH[op]} ${op.length === 2 ? 'includes' : 'does not include'} ${ds(k)}.`, `The ${big ? 'largest' : 'smallest'} integer is ${B(ds(ans))}.`] };
      }],
    ['Representing inequalities on a graph',
      'A region is bounded by a line. A solid line means points on the line are included (≤ or ≥); a dashed line means they are not (< or >). Test a point that is not on the line, such as (0, 0), to decide which side is shaded.',
      (r) => {
        const kind = r.int(0, 2); const op = r.pick(['<', '>', '<=', '>=']); const inc = op.length === 2; const big = op[0] === '>';
        let lhs, rhsH, g, line, bnd;
        if (kind === 0) { const a = r.nz(-3, 3); lhs = 'x'; rhsH = ds(a); g = (x, y) => x - a; line = [a, -5, a, 5]; bnd = `<i>x</i> = ${ds(a)}`; }
        else if (kind === 1) { const b = r.nz(-3, 3); lhs = 'y'; rhsH = ds(b); g = (x, y) => y - b; line = [-5, b, 5, b]; bnd = `<i>y</i> = ${ds(b)}`; }
        else { const m = r.pick([1, 2, -1, -2, 3]), c = r.int(-2, 3); lhs = 'y'; rhsH = tx(lin(m, c)); g = (x, y) => y - m * x - c; line = [-5, -5 * m + c, 5, 5 * m + c]; bnd = `<i>y</i> = ${rhsH}`; }
        const ineq = (o) => `<i>${lhs}</i> ${OPH[o]} ${rhsH}`; const sg = big ? 1 : -1;
        let tp = [0, 0]; if (Math.abs(g(0, 0)) < 1e-9 || Math.sign(g(0, 0)) !== sg) { const cands = []; for (let x = -4; x <= 4; x++) for (let y = -4; y <= 4; y++) if (Math.sign(g(x, y)) === sg && Math.abs(g(x, y)) >= 1) cands.push([x, y]); tp = cands[0]; }
        const testStep = `Test (${ds(tp[0])}, ${ds(tp[1])}), which is in the shaded region: ${kind === 2 ? `${ds(tp[1])} ${big ? '&gt;' : '&lt;'} ${ds(tp[1] - g(tp[0], tp[1]))}` : `${ds(kind === 0 ? tp[0] : tp[1])} ${big ? '&gt;' : '&lt;'} ${rhsH}`} ✓`;
        if (r.chance(0.6)) {
          const shade = clipHalf([[-5, -5], [5, -5], [5, 5], [-5, 5]], (P) => sg * g(P[0], P[1]));
          const diagram = axesSvg({ xmin: -5, xmax: 5, ymin: -5, ymax: 5, shade, lines: [[...line, !inc]] });
          return { html: `The shaded region is bounded by the line ${B(bnd)}, drawn ${inc ? 'solid' : 'dashed'}.<br>Which inequality does the shaded region represent?`, diagram, ...mcq(r, [op, ...['<', '>', '<=', '>='].filter((o) => o !== op)].map(ineq), 0), hint: 'Solid line: ≤ or ≥. Dashed line: < or >. Then test a point in the shaded region.',
            steps: [`The boundary is ${bnd}. It is ${inc ? 'solid, so points on it are included (≤ or ≥)' : 'dashed, so points on it are not included (&lt; or &gt;)'}.`, testStep, `The region is ${B(ineq(op))}.`] };
        }
        const inR = (x, y) => { const v = g(x, y); return inc ? sg * v >= -1e-9 : sg * v > 1e-9; };
        const pts = []; for (let x = -5; x <= 5; x++) for (let y = -5; y <= 5; y++) pts.push([x, y]);
        const yes = r.shuffle(pts.filter((P) => inR(P[0], P[1]))), no = r.shuffle(pts.filter((P) => !inR(P[0], P[1])));
        const onLine = no.filter((P) => Math.abs(g(P[0], P[1])) < 1e-9); const offNo = no.filter((P) => Math.abs(g(P[0], P[1])) >= 1e-9);
        const wrong = [...(onLine.length ? [onLine[0]] : []), ...offNo].slice(0, 3); const right = yes[0];
        const fmtP = (P) => `(${ds(P[0])}, ${ds(P[1])})`;
        return { html: `Which of these points lies in the region ${B(ineq(op))}?`, ...mcq(r, [right, ...wrong].map(fmtP), 0), hint: 'Substitute each point into the inequality and check whether it is true.',
          steps: [`Substitute ${fmtP(right)}: ${kind === 0 ? ds(right[0]) : ds(right[1])} ${OPH[op]} ${kind === 2 ? ds(right[1] - g(right[0], right[1])) : rhsH} — true ✓`, ...wrong.map((P) => `${fmtP(P)}: ${kind === 0 ? ds(P[0]) : ds(P[1])} ${OPH[op]} ${kind === 2 ? ds(P[1] - g(P[0], P[1])) : rhsH} is false${Math.abs(g(P[0], P[1])) < 1e-9 ? ' (the point is on the line, which is not included)' : ''}`), `Answer: ${B(fmtP(right))}`] };
      }],
  ]);

  // ================================================================ y9-straight-line-graphs (extra style)
  addStyles('y9-straight-line-graphs', [
    ['Lines parallel to the axes & real-life graphs',
      'x = a is a vertical line (parallel to the y-axis) and y = b is horizontal (parallel to the x-axis). In a real-life graph such as cost = rate × time + fixed charge, the y-intercept is the fixed charge and the gradient is the rate. Direct proportion graphs pass through the origin.',
      (r) => {
        const mode = r.int(0, 6);
        if (mode === 0) {
          const vert = r.chance(); const a = r.nz(-5, 5); const others = r.sample([-5, -4, -3, -2, -1, 0, 1, 2, 3, 4, 5].filter((v) => v !== a), 3);
          const pts = others.map((o) => (vert ? { x: a, y: o } : { x: o, y: a }));
          const ans = `${vert ? 'x' : 'y'}=${ps(a)}`;
          return { html: `The points ${pts.map((p) => `(${ds(p.x)}, ${ds(p.y)})`).join(', ')} all lie on a straight line.<br>Write down the equation of the line.`, diagram: gridSvg(pts, null), answer: ans, check: { type: 'text', accept: [ans] }, answerHtml: B(tx(ans)), format: 'Type the equation, e.g. x=3 or y=-2', hint: 'Which coordinate is the same for every point?',
            steps: [`Every point has ${vert ? 'x' : 'y'}-coordinate ${ds(a)}.`, `So the line is ${vert ? 'vertical (parallel to the y-axis)' : 'horizontal (parallel to the x-axis)'}: ${B(tx(ans))}`] };
        }
        if (mode === 1) {
          const px = r.int(-8, 8), py = r.int(-8, 8); const axis = r.chance() ? 'x' : 'y'; const ans = axis === 'x' ? `y=${ps(py)}` : `x=${ps(px)}`;
          return { html: `Write down the equation of the straight line that passes through ${B(`(${ds(px)}, ${ds(py)})`)} and is parallel to the ${B(axis + '-axis')}.`, answer: ans, check: { type: 'text', accept: [ans] }, answerHtml: B(tx(ans)), format: 'Type the equation, e.g. x=3 or y=-2', hint: axis === 'x' ? 'A line parallel to the x-axis is horizontal: y = a number.' : 'A line parallel to the y-axis is vertical: x = a number.',
            steps: [`Parallel to the ${axis}-axis means the line is ${axis === 'x' ? 'horizontal, so every point has the same y-coordinate' : 'vertical, so every point has the same x-coordinate'}.`, `That coordinate is ${axis === 'x' ? ds(py) : ds(px)}, so the line is ${B(tx(ans))}`] };
        }
        if (mode === 2) {
          const a = r.int(-9, 9), b = r.int(-9, 9);
          return { html: `The lines ${B(tx(`x=${a}`))} and ${B(tx(`y=${b}`))} are drawn on the same axes. Write down the coordinates of the point where they cross.`, answer: `${a}, ${b}`, check: { type: 'pair', values: [a, b], ordered: true }, answerHtml: B(`(${ds(a)}, ${ds(b)})`), format: 'Type the coordinates x, y, e.g. 3, −2', hint: 'Every point on x = a has x-coordinate a; every point on y = b has y-coordinate b.',
            steps: [`On ${tx(`x=${a}`)}, every point has <i>x</i> = ${ds(a)}. On ${tx(`y=${b}`)}, every point has <i>y</i> = ${ds(b)}.`, `They cross at ${B(`(${ds(a)}, ${ds(b)})`)}`] };
        }
        const C = r.pick([['A plumber', 'a call-out charge', 'hour', 'hours', 'h', [30, 40, 45, 50, 60, 75], [25, 60]], ['An electrician', 'a call-out charge', 'hour', 'hours', 'h', [25, 35, 40, 50, 60], [20, 55]], ['A taxi firm', 'a fixed charge', 'mile', 'miles', 'm', [2, 3, 4, 5], [1, 4]], ['A gym', 'a joining fee', 'month', 'months', 'n', [10, 20, 25, 30, 40, 50], [15, 45]], ['A boat hire company', 'a deposit', 'hour', 'hours', 'h', [10, 15, 20, 25], [8, 30]], ['A van hire firm', 'a fixed booking fee', 'day', 'days', 'd', [15, 20, 25, 30, 40], [35, 80]]]);
        const F = r.pick(C[5]), R = r.int(C[6][0], C[6][1]), n = r.int(2, 9);
        const intro = `${C[0]} charges ${C[1]} of £${F} plus £${R} per ${C[2]}.`;
        if (mode === 3) return { html: `${intro} Work out the total cost for ${B(n + ' ' + C[3])}.`, ...nAns(F + R * n, { money: true }), hint: 'Cost = fixed charge + rate × number.',
          steps: [`Cost = ${F} + ${R} × ${n}`, `= ${F} + ${R * n} = ${B(money(F + R * n))}`] };
        if (mode === 4) return { html: `${intro} Write a formula for the total cost, ${iv('C')} pounds, for ${iv(C[4])} ${C[3]}.`, ...eAns(lin(R, F, C[4])), answerHtml: B(`<i>C</i> = ${tx(lin(R, F, C[4]))}`), answerLabel: '<i>C</i> =', format: `Type the right-hand side, e.g. 12${C[4]}+30`, hint: 'The rate multiplies the number; the fixed charge is added.',
          steps: [`The rate £${R} per ${C[2]} gives ${tx(`${R}${C[4]}`)} — this is the gradient.`, `The fixed charge £${F} is the y-intercept.`, `${B(`<i>C</i> = ${tx(lin(R, F, C[4]))}`)}`] };
        if (mode === 5) {
          const n1 = r.int(1, 4), n2 = n1 + r.int(2, 5); const askF = r.chance();
          const tbl = htable([C[3].charAt(0).toUpperCase() + C[3].slice(1), String(n1), String(n2)], [['Cost (£)', String(F + R * n1), String(F + R * n2)]]);
          return { html: `${C[0]} charges a fixed amount plus a rate per ${C[2]}. The graph of cost against ${C[3]} is a straight line. Two values are shown.${tbl}Work out ${askF ? `the fixed charge (the <i>y</i>-intercept)` : `the rate per ${C[2]} (the gradient)`}.`, ...nAns(askF ? F : R, { money: true }), hint: 'Gradient = change in cost ÷ change in number. Then work back to 0 to find the intercept.',
            steps: [`Gradient = (${F + R * n2} − ${F + R * n1}) ÷ (${n2} − ${n1}) = ${R * (n2 - n1)} ÷ ${n2 - n1} = £${R} per ${C[2]}`, ...(askF ? [`Fixed charge = ${F + R * n1} − ${R} × ${n1} = ${B(money(F))}`] : [`The rate per ${C[2]} is ${B(money(R))}`]), 'In a real-life graph the y-intercept is the fixed charge and the gradient is the rate.'] };
        }
        const item = r.pick([['box of pens', 'boxes of pens'], ['bag of sand', 'bags of sand'], ['cinema ticket', 'cinema tickets'], ['litre of paint', 'litres of paint'], ['kg of apples', 'kg of apples']]); const p = r.pick([1.5, 2.3, 2.5, 3.2, 4.5, 6, 7.5, 12, 0.8, 1.25]); const k1 = r.int(2, 6); let k2; do { k2 = r.int(3, 15); } while (k2 === k1);
        return { html: `The cost of buying ${item[1]} is ${B('directly proportional')} to the number bought, so the graph of cost against number is a straight line through the origin. It passes through (${k1}, ${ds(p * k1)}), where the cost is in pounds.<br>Work out the cost of ${k2} ${item[1]}.`, ...nAns(p * k2, { money: true }), hint: 'A direct proportion graph starts at (0, 0), so the gradient is the price of one.',
          steps: [`The line passes through (0, 0): buying 0 costs £0.`, `Gradient = ${ds(p * k1)} ÷ ${k1} = ${money(p)} per ${item[0]}`, `Cost of ${k2} = ${k2} × ${money(p)} = ${B(money(p * k2))}`] };
      }],
  ]);

  // ================================================================ school-audit additions (appended — never reorder)
  const ineqAcc = (op, k, v = 'x') => [`${v}${op}${ps(k)}`, `${ps(k)}${FLIP[op]}${v}`];
  const ineqH = (op, k, v = 'x') => `${iv(v)} ${OPH[op]} ${ds(k)}`;

  addStyles('y9-straight-line-graphs', [
    ['Tables of values for straight lines',
      'To plot y = mx + c, choose some x-values, substitute each one to find y, and write the results in a table. Each column gives a coordinate pair (x, y) to plot. Two points are enough for a line, but a third checks your working.',
      (r) => {
        const m = r.nz(-5, 5), c = r.int(-10, 10); const set = r.pick([[-3, 0, 3], [-2, -1, 0, 1, 2], [-3, -2, -1, 0, 1, 2, 3], [0, 1, 2, 3, 4], [-4, -2, 0, 2, 4]]);
        const f = (x) => m * x + c; const eq = tx(`y=${lin(m, c)}`);
        if (r.chance(0.3)) { // find x from y
          const qx = r.pick(set.filter((x) => x !== 0)); const yv = f(qx);
          return { html: `The point with ${iv('y')}-coordinate ${B(ds(yv))} lies on the line ${B(eq)}. Find its ${iv('x')}-coordinate.`, ...nAns(qx), answerLabel: '<i>x</i> =', hint: 'Substitute the y-value and solve the equation for x.',
            steps: [`${ds(yv)} = ${tx(lin(m, c))}`, `${c ? `${c > 0 ? 'Subtract' : 'Add'} ${Math.abs(c)}: ` : ''}${ds(yv - c)} = ${tx(coefT(m, 'x'))}`, `Divide by ${ds(m)}: <i>x</i> = ${B(ds(qx))}`] };
        }
        const qx = r.pick(set);
        const tbl = htable(['<i>x</i>', ...set.map((x) => ds(x))], [['<i>y</i>', ...set.map((x) => (x === qx ? B('?') : ds(f(x))))]]);
        return { html: `Complete the table of values for ${B(eq)}.${tbl}Work out the missing value.`, ...nAns(f(qx)), answerLabel: '<i>y</i> =', hint: `Multiply x by ${ds(m)}, then ${c >= 0 ? 'add' : 'subtract'} ${Math.abs(c)}.`,
          steps: [`Substitute <i>x</i> = ${ds(qx)}: <i>y</i> = ${m === 1 ? '' : m === -1 ? '−' : ds(m) + ' × '}${m === -1 ? `(${ds(qx)})` : br(qx)}${c ? pm(c) : ''}`, `${c ? `= ${ds(m * qx)}${pm(c)} = ` : '= '}${B(ds(f(qx)))}`, `This gives the coordinate pair (${ds(qx)}, ${ds(f(qx))}) to plot.`, `Check: each time x goes up by ${set[1] - set[0]}, y changes by ${ds(m * (set[1] - set[0]))}, because the gradient is ${ds(m)}.`] };
      }],
    ['Comparing gradients & intercepts',
      'In y = mx + c the gradient m tells you the steepness: the bigger the number (ignoring its sign), the steeper the line; a negative m slopes down. Lines with the same m are parallel. Lines with the same c cross the y-axis at the same point, (0, c).',
      (r) => {
        const mode = r.int(0, 4); const eqm = (m, c) => tx(`y=${lin(m, c)}`);
        if (mode === 0) {
          const ms = r.sample([1, 2, 3, 4, 5, 6], 4).map((v) => v * r.sign()); const cs = ms.map(() => r.int(-6, 6));
          const big = ms.reduce((b, v, i) => (Math.abs(v) > Math.abs(ms[b]) ? i : b), 0);
          const opts = ms.map((m, i) => eqm(m, cs[i])); const order = [big, ...[0, 1, 2, 3].filter((i) => i !== big)];
          return { html: 'Which of these lines is the steepest?', ...mcq(r, order.map((i) => opts[i]), 0), hint: 'Compare the gradients, ignoring the sign. The intercept does not affect steepness.',
            steps: [`Gradients: ${ms.map((m) => ds(m)).join(', ')}`, `Ignoring signs, the largest is ${Math.abs(ms[big])}.`, `So ${B(opts[big])} is the steepest${ms[big] < 0 ? ' (it slopes downwards)' : ''}.`] };
        }
        if (mode === 1) {
          const m = r.nz(-5, 5), c = r.int(-8, 8); let d; do { d = r.int(-8, 8); } while (d === c); const k = r.int(2, 4);
          const ok = r.chance() ? eqm(m, d) : tx(`${k}y=${lin(k * m, k * d)}`);
          let m2; do { m2 = r.nz(-6, 6); } while (Math.abs(m2) === Math.abs(m));
          const wr = [eqm(-m, c), eqm(c === 0 || c === m ? m + 1 : c, m), eqm(m2, c)];
          if (new Set([ok, ...wr]).size < 4) wr[1] = eqm(m + (m > 0 ? 1 : -1), d);
          return { html: `Which line is ${B('parallel')} to ${B(eqm(m, c))}?`, ...mcq(r, [ok, ...wr], 0), hint: 'Parallel lines have the same gradient. Rearrange to y = mx + c if needed.',
            steps: [`The gradient of ${eqm(m, c)} is ${ds(m)}.`, /=/.test(ok) && ok.includes(`${k}`) && !ok.startsWith('<i>y</i>') ? `${ok}: divide by ${k} to get ${eqm(m, d)}, gradient ${ds(m)}.` : `${ok} also has gradient ${ds(m)}.`, `Same gradient, so they are parallel: ${B(ok)}`] };
        }
        if (mode === 2) {
          const c = r.nz(-8, 8); const ms = r.sample([1, 2, 3, 4, 5, -1, -2, -3], 4); const ok = eqm(ms[0], c);
          const cs = r.sample([-8, -7, -6, -5, -4, -3, -2, -1, 1, 2, 3, 4, 5, 6, 7, 8].filter((v) => v !== c && v !== -c), 2);
          const wr = [eqm(c, ms[1]), eqm(ms[2], cs[0]), eqm(ms[3], cs[1])];
          if (new Set([ok, ...wr]).size < 4) wr[0] = eqm(ms[1], -c);
          return { html: `Which line crosses the ${iv('y')}-axis at the same point as ${B(eqm(r.pick([6, 7, -4]), c))}?`, ...mcq(r, [ok, ...wr], 0), hint: 'The y-intercept is the number c in y = mx + c (not the coefficient of x).',
            steps: [`The y-intercept is c = ${ds(c)}, the point (0, ${ds(c)}).`, `${ok} also has c = ${ds(c)}.`, `So ${B(ok)} crosses at the same place.`] };
        }
        if (mode === 3) {
          const m = r.nz(-6, 6), c = r.int(-9, 9);
          return { html: `Write down the coordinates of the point where ${B(eqm(m, c))} crosses the ${iv('y')}-axis.`, answer: `0, ${c}`, check: { type: 'pair', values: [0, c], ordered: true }, answerHtml: B(`(0, ${ds(c)})`), format: 'Type the coordinates x, y, e.g. 0, −3', hint: 'On the y-axis, x = 0.',
            steps: [`On the y-axis <i>x</i> = 0, so <i>y</i> = ${ds(m)} × 0${pm(c)} = ${ds(c)}.`, `The y-intercept is always (0, c): ${B(`(0, ${ds(c)})`)}`] };
        }
        let m, c; do { m = r.nz(-3, 3); c = r.int(-4, 4); } while (Math.abs(m) + Math.abs(c) > 7);
        return { html: 'Find the equation of the straight line shown on the grid. Give it in the form <i>y</i> = <i>mx</i> + <i>c</i>.', diagram: gridSvg([{ x: 0, y: c, label: ' ' }, { x: 1, y: m + c, label: ' ' }], { m, c }), ...eAns(lin(m, c), { vars: ['x'] }), answerLabel: '<i>y</i> =', format: 'Type the right-hand side, e.g. 2x+1', hint: 'Read the y-intercept, then count how far the line goes up (or down) for each 1 across.',
          steps: [`The line crosses the y-axis at (0, ${ds(c)}), so c = ${ds(c)}.`, `For every 1 across, the line goes ${m > 0 ? 'up' : 'down'} ${Math.abs(m)}, so m = ${ds(m)}${m > 0 ? ' (positive: it slopes upwards)' : ' (negative: it slopes downwards)'}.`, `Equation: ${B(eqm(m, c))}`] };
      }],
  ]);

  addStyles('y9-inequalities', [
    ['Inequalities with unknowns on both sides',
      'Solve these just like equations with unknowns on both sides: expand any brackets, collect the x terms on the side with more x, then the numbers on the other side. Keep the inequality sign the same unless you multiply or divide by a negative.',
      (r) => {
        const op = r.pick(['<', '>', '<=', '>=']); const k = r.int(-8, 8); let a, b, c, d, lhs, rhs, pre = [];
        if (r.chance(0.5)) { do { a = r.int(2, 9); c = r.int(1, 8); } while (a === c); b = r.int(-15, 15); d = (a - c) * k + b; lhs = lin(a, b); rhs = lin(c, d); }
        else { let p, q, rr, sv; do { p = r.int(2, 7); rr = r.int(1, 6); q = r.nz(-6, 6); sv = ((p - rr) * k + p * q) / rr; } while (p === rr || !Number.isInteger(sv) || sv === 0);
          a = p; b = p * q; c = rr; d = rr * sv; lhs = `${p}(${lin(1, q)})`; rhs = rr === 1 ? lin(1, sv) : `${rr}(${lin(1, sv)})`; pre = [`Expand: ${tx(lin(a, b))} ${OPH[op]} ${tx(lin(c, d))}`]; }
        const res = a > c ? op : FLIP[op]; const lo = Math.min(a, c), hi = Math.max(a, c);
        const st = a > c
          ? [`Subtract ${tx(coefT(c, 'x'))} from both sides: ${tx(lin(a - c, b))} ${OPH[op]} ${ds(d)}`, `${b >= 0 ? 'Subtract' : 'Add'} ${Math.abs(b)}: ${tx(coefT(a - c, 'x'))} ${OPH[op]} ${ds(d - b)}`]
          : [`Subtract ${tx(coefT(a, 'x'))} from both sides: ${ds(b)} ${OPH[op]} ${tx(lin(c - a, d))}`, `${d >= 0 ? 'Subtract' : 'Add'} ${Math.abs(d)}: ${ds(b - d)} ${OPH[op]} ${tx(coefT(c - a, 'x'))}`];
        void lo; void hi;
        const t = k + (res[0] === '>' ? 1 : -1);
        return { html: `Solve ${B(`${tx(lhs)} ${OPH[op]} ${tx(rhs)}`)}`, answer: `x${res}${ps(k)}`, check: { type: 'text', accept: ineqAcc(res, k) }, answerHtml: B(ineqH(res, k)), format: 'Type e.g. x>3 or x<=-2 (you can use ≤ and ≥)', hint: 'Collect the x terms on the side with the larger number of x so the coefficient stays positive.',
          steps: [...pre, ...st, `Divide by ${Math.abs(a - c)}${a > c ? '' : ' and write x first (the sign turns round)'}: ${B(ineqH(res, k))}`, `Check with <i>x</i> = ${ds(t)}: left side ${ds(a * t + b)}, right side ${ds(c * t + d)} — ${ds(a * t + b)} ${OPH[op]} ${ds(c * t + d)} ✓`] };
      }],
    ['Forming and solving inequalities',
      'Turn the words into an inequality: “more than” or “greater than” is >, “less than” is <, “at least” is ≥ and “at most” or “no more than” is ≤. Then solve it like an equation.',
      (r) => {
        const W = r.pick([['is greater than', '>'], ['is more than', '>'], ['is less than', '<'], ['is at least', '>='], ['is at most', '<='], ['is no more than', '<=']]); const op = W[1];
        const k = r.int(2, 6), a = r.int(1, 15), s = r.int(-3, 12); const form = r.int(0, 3);
        let words, lhsT, val, st;
        if (form === 0) { words = `${a} more than ${k} times my number`; lhsT = lin(k, a); val = k * s + a; st = [`Subtract ${a}: ${tx(coefT(k, 'x'))} ${OPH[op]} ${ds(val - a)}`, `Divide by ${k}`]; }
        else if (form === 1) { words = `${a} less than ${k} times my number`; lhsT = lin(k, -a); val = k * s - a; st = [`Add ${a}: ${tx(coefT(k, 'x'))} ${OPH[op]} ${ds(val + a)}`, `Divide by ${k}`]; }
        else if (form === 2) { words = `${k} times the sum of my number and ${a}`; lhsT = `${k}(${lin(1, a)})`; val = k * (s + a); st = [`Divide by ${k}: ${tx(lin(1, a))} ${OPH[op]} ${ds(s + a)}`, `Subtract ${a}`]; }
        else { words = `my number multiplied by ${k}, then increased by ${a}`; lhsT = lin(k, a); val = k * s + a; st = [`Subtract ${a}: ${tx(coefT(k, 'x'))} ${OPH[op]} ${ds(val - a)}`, `Divide by ${k}`]; }
        const who = r.pick(['Amir', 'Bella', 'Chen', 'Dana', 'Ellis', 'Femi']);
        return { html: `${who} says: “${words.charAt(0).toUpperCase() + words.slice(1)} ${W[0]} ${ds(val)}.”<br>Call ${who}’s number ${iv('x')}. Form an inequality and solve it to find the possible values of ${iv('x')}.`, answer: `x${op}${ps(s)}`, check: { type: 'text', accept: ineqAcc(op, s) }, answerHtml: B(ineqH(op, s)), format: 'Type the solution, e.g. x>3 or x<=-2', hint: `“${W[0].replace('is ', '')}” means ${OPH[op]}.`,
          steps: [`Form the inequality: ${B(`${tx(lhsT)} ${OPH[op]} ${ds(val)}`)}`, ...st.map((x, i) => (i === st.length - 1 ? `${x}: ${B(ineqH(op, s))}` : x)), `${who}’s number is any value ${op[0] === '>' ? 'greater than' : 'less than'}${op.length === 2 ? ' or equal to' : ''} ${ds(s)}.`] };
      }],
  ]);

  addStyles('y9-formulae', [
    ['Substituting to form and solve equations',
      'Substituting the values you know into a formula turns it into an equation. If the unknown is not the subject, solve the equation using inverse operations (or rearrange first, then substitute).',
      (r) => {
        const T = r.pick([
          () => { const u = r.int(0, 20), a = r.int(2, 9), t = r.int(2, 12); const v = u + a * t; return { f: tx('v=u+at'), vals: [['v', v], ['u', u], ['a', a]], want: 't', ans: t, st: [`${v} = ${u} + ${a}<i>t</i>`, `Subtract ${u}: ${v - u} = ${a}<i>t</i>`, `Divide by ${a}`] }; },
          () => { const l = r.int(4, 30), w = r.int(2, 25); const P = 2 * l + 2 * w; return { f: 'P = 2<i>l</i> + 2<i>w</i>', vals: [['P', P], ['l', l]], want: 'w', ans: w, st: [`${P} = 2 × ${l} + 2<i>w</i> = ${2 * l} + 2<i>w</i>`, `Subtract ${2 * l}: ${P - 2 * l} = 2<i>w</i>`, 'Divide by 2'] }; },
          () => { let b, h; do { b = r.int(2, 16); h = r.int(2, 16); } while ((b * h) % 2); const A = (b * h) / 2; return { f: `A = ${frac(1, 2)}<i>bh</i>`, vals: [['A', A], ['b', b]], want: 'h', ans: h, st: [`${A} = ${frac(1, 2)} × ${b} × <i>h</i>`, `${A} = ${b / 2}<i>h</i>`, `Divide by ${b / 2}`] }; },
          () => { const k = r.int(-8, 20); const C = 5 * k, F = 9 * k + 32; return { f: `<i>F</i> = ${frac('9<i>C</i>', 5)} + 32`, vals: [['F', F]], want: 'C', ans: C, st: [`${ds(F)} = ${frac('9<i>C</i>', 5)} + 32`, `Subtract 32: ${ds(F - 32)} = ${frac('9<i>C</i>', 5)}`, `Multiply by 5: ${ds(5 * (F - 32))} = 9<i>C</i>, then divide by 9`] }; },
          () => { const Fx = r.pick([20, 25, 30, 40, 50]), R = r.int(10, 45), h = r.int(1, 9); const C = Fx + R * h; return { f: tx(`C=${Fx}+${R}h`), vals: [['C', C]], want: 'h', ans: h, st: [`${C} = ${Fx} + ${R}<i>h</i>`, `Subtract ${Fx}: ${C - Fx} = ${R}<i>h</i>`, `Divide by ${R}`] }; },
          () => { const m = r.nz(-6, 6), x = r.nz(-9, 9), c = r.int(-12, 12); const y = m * x + c; return { f: tx('y=mx+c'), vals: [['y', y], ['m', m], ['c', c]], want: 'x', ans: x, st: [`${ds(y)} = ${ds(m)}<i>x</i>${pm(c)}`, `${c >= 0 ? 'Subtract' : 'Add'} ${Math.abs(c)}: ${ds(y - c)} = ${ds(m)}<i>x</i>`, `Divide by ${ds(m)}`] }; },
          () => { const s = r.int(20, 90), t = r.int(2, 9); const d = s * t; return { f: tx('d=st'), vals: [['d', d], ['s', s]], want: 't', ans: t, st: [`${d} = ${s}<i>t</i>`, `Divide by ${s}`] }; },
        ])();
        return { html: `Use the formula ${B(T.f)} to find ${iv(T.want)} when ${given(T.vals)}.`, ...nAns(T.ans), answerLabel: `<i>${T.want}</i> =`, hint: `Substitute, then solve the equation for ${T.want}.`,
          steps: [...T.st.slice(0, -1), `${T.st[T.st.length - 1]}: ${B(`${iv(T.want)} = ${ds(T.ans)}`)}`, 'Substituting into a formula gave an equation, which we then solved.'] };
      }],
  ]);

  addStyles('y9-conjectures', [
    ['HCF, LCM & prime factors',
      'List factors to find the highest common factor (HCF) and list multiples to find the lowest common multiple (LCM). Any whole number can be split into a product of primes using a factor tree.',
      (r) => {
        const mode = r.int(0, 4);
        if (mode === 0) {
          const pr = [2, 2, 2, 3, 3, 5, 7, 11]; let n; do { n = r.sample(pr, r.int(2, 4)).reduce((x, y) => x * y, 1) * r.pick([1, 2, 3]); } while (n < 12 || n > 300 || isPrime(n));
          const f = pf(n); const ans = pfText(f);
          return { html: `Write ${B(n)} as a product of its prime factors.`, ...eAns(ans, { form: 'primes' }), answerHtml: B(pfHtml(f)), format: 'Type e.g. 2^2×3×5 (use × or * and ^ for powers)', hint: 'Use a factor tree: split into any factor pair, then keep splitting until every branch ends in a prime.',
            steps: [`Factor tree: keep dividing by primes — ${f.map(([p, e]) => Array(e).fill(p).join(' × ')).join(' × ')}`, `Check: the product is ${n}.`, `${n} = ${B(pfHtml(f))}`] };
        }
        let a, b; do { const g = r.pick([2, 3, 4, 5, 6, 8, 9, 10, 12]); a = g * r.int(1, 6); b = g * r.int(1, 6); } while (a === b || a < 6 || b < 6 || a > 72 || b > 72);
        const facs = (n) => { const o = []; for (let i = 1; i <= n; i++) if (n % i === 0) o.push(i); return o; };
        if (mode === 1) { const h = gcd(a, b);
          return { html: `Find the highest common factor (HCF) of ${B(a)} and ${B(b)}.`, ...nAns(h), hint: 'List the factors of each number and find the biggest one they share.',
            steps: [`Factors of ${a}: ${facs(a).join(', ')}`, `Factors of ${b}: ${facs(b).join(', ')}`, `The highest factor in both lists is ${B(h)}.`] }; }
        if (mode === 2) { const l = lcm(a, b); const mult = (n) => Array.from({ length: Math.min(8, l / n + 1) }, (_, i) => n * (i + 1));
          return { html: `Find the lowest common multiple (LCM) of ${B(a)} and ${B(b)}.`, ...nAns(l), hint: 'List the multiples of each number until one appears in both lists.',
            steps: [`Multiples of ${a}: ${mult(a).join(', ')}${l / a + 1 > 8 ? ', …' : ''}`, `Multiples of ${b}: ${mult(b).join(', ')}${l / b + 1 > 8 ? ', …' : ''}`, `The first number in both lists is ${B(l)}.`] }; }
        if (mode === 3) { let x, y; do { x = r.int(3, 20); y = r.int(3, 20); } while (x === y || lcm(x, y) > 120 || gcd(x, y) === Math.min(x, y));
          const [what, unit] = r.pick([['Two buses leave the station together. One leaves every', 'minutes'], ['Two lighthouses flash together. One flashes every', 'seconds'], ['Two runners start together on a circular track. One completes a lap every', 'minutes']]);
          return { html: `${what} ${x} ${unit} and the other every ${y} ${unit}. After how many ${unit} will this next happen together?`, ...nAns(lcm(x, y)), unit, hint: 'You need a common multiple — the lowest one.',
            steps: [`Multiples of ${x}: ${Array.from({ length: Math.min(6, lcm(x, y) / x) }, (_, i) => x * (i + 1)).join(', ')}${lcm(x, y) / x > 6 ? ', …' : ''}`, `Multiples of ${y}: ${Array.from({ length: Math.min(6, lcm(x, y) / y) }, (_, i) => y * (i + 1)).join(', ')}${lcm(x, y) / y > 6 ? ', …' : ''}`, `LCM = ${B(lcm(x, y))} ${unit}`] }; }
        const h = gcd(a, b); const [thing, grp] = r.pick([['red pens', 'blue pens', 'packs'], ['apples', 'oranges', 'bags'], ['boys', 'girls', 'teams']].map((t) => [t, t[2]]));
        return { html: `There are ${a} ${thing[0]} and ${b} ${thing[1]}. They are shared into identical ${grp} with nothing left over, each ${grp.slice(0, -1)} containing the same mix. What is the greatest number of ${grp} that can be made?`, ...nAns(h), hint: 'The number of groups must divide both numbers exactly — find the HCF.',
          steps: [`The number of ${grp} must be a factor of ${a} and of ${b}.`, `HCF of ${a} and ${b} = ${h}`, `So ${B(h)} ${grp}, each with ${a / h} ${thing[0]} and ${b / h} ${thing[1]}.`] };
      }],
    ['True or false? Testing patterns',
      'A pattern that works for the first few cases is only a conjecture. Keep testing: the first case that breaks the pattern is a counterexample, and it proves the conjecture false.',
      (r) => {
        const mode = r.int(0, 2);
        if (mode === 0) {
          const a = r.int(1, 6), k = r.pick([2, 2, 3]); const d1 = (k - 1) * a, d2 = (k * k - k) * a, sd = d2 - d1; const seq = [a, k * a, k * k * a]; let dd = d2; while (seq.length < 6) { dd += sd; seq.push(seq[seq.length - 1] + dd); }
          const word = k === 2 ? 'double' : 'three times';
          return { html: `A sequence begins ${B(seq.join(', ') + ', …')}<br>Kai looks at the first three terms and says: “Each term is ${word} the one before.”<br>Write down the first term that shows Kai is wrong.`, ...nAns(seq[3]), hint: `Check each term against ${k} × the previous one.`,
            steps: [`${a} × ${k} = ${k * a} ✓, ${k * a} × ${k} = ${k * k * a} ✓`, `${k * k * a} × ${k} = ${k ** 3 * a}, but the next term is ${seq[3]} ✗`, `The differences are ${seq.slice(1).map((v, x) => v - seq[x]).join(', ')}, … — they go up by ${sd} each time; the terms are not multiplied by ${k}.`, `First counterexample: ${B(seq[3])}`] };
        }
        if (mode === 1) {
          let a, d, i; do { a = r.pick([3, 5, 7, 11, 13]); d = r.pick([2, 4, 6, 10, 12]); i = 0; while (isPrime(a + d * i)) i++; } while (i < 2 || gcd(a, d) !== 1);
          const shown = Array.from({ length: i + 2 }, (_, j) => a + d * j);
          return { html: `A sequence starts ${B(shown.join(', ') + ', …')} and goes up by ${d} each time.<br>Lily says: “Every term in this sequence is a prime number.”<br>Write down the first term that disproves Lily’s conjecture.`, ...nAns(a + d * i), hint: 'Test each term: does it have a factor other than 1 and itself?',
            steps: [`${shown.slice(0, i).join(', ')} ${i === 2 ? 'are both' : 'are all'} prime.`, `${a + d * i} = ${factorText(a + d * i)}, so it is not prime.`, `First counterexample: ${B(a + d * i)}`] };
        }
        const T = r.pick([
          () => { const [x, y] = r.pick([[18, 30], [12, 20], [16, 24], [15, 25], [14, 21], [24, 36]]); const h = gcd(x, y); const claim = r.chance() ? h : h * r.pick([2, 3]) <= Math.min(x, y) && Math.min(x, y) % (h * 2) === 0 ? h * 2 : h / (h % 2 === 0 ? 2 : 1); const ok = claim === h;
            return [`The HCF of ${x} and ${y} is ${claim}.`, ok, `Factors of ${x} and ${y} in common: ${[...Array(h + 1).keys()].filter((v) => v && h % v === 0).join(', ')}. The highest is ${h}.`]; },
          () => { const [x, y] = r.pick([[9, 12], [6, 8], [10, 15], [4, 6], [8, 12], [6, 10]]); const l = lcm(x, y); const claim = r.chance() ? l : x * y; const ok = claim === l;
            return [`The LCM of ${x} and ${y} is ${claim}.`, ok, `Multiples of ${x}: ${[1, 2, 3, 4].map((v) => v * x).join(', ')}…; multiples of ${y}: ${[1, 2, 3, 4].map((v) => v * y).join(', ')}… The first common multiple is ${l}.`]; },
          () => { const n = r.pick([21, 27, 39, 51, 57, 87, 91, 23, 29, 31, 37, 41, 43, 47, 53, 59, 61]); const ok = isPrime(n);
            return [`${n} is a prime number.`, ok, ok ? `${n} has exactly two factors, 1 and ${n}.` : `${n} = ${factorText(n)}, so it has more than two factors.`]; },
          () => { const [x, y] = r.pick([[4, 6], [8, 12], [9, 15], [10, 25], [6, 9], [12, 18]]);
            return [`HCF(${x}, ${y}) × LCM(${x}, ${y}) = ${x} × ${y}`, true, `HCF = ${gcd(x, y)}, LCM = ${lcm(x, y)}; ${gcd(x, y)} × ${lcm(x, y)} = ${x * y} = ${x} × ${y}.`]; },
          () => { const n = r.int(3, 12); const ok = r.chance(); const v = ok ? 2 * n + 1 : 2 * n;
            return [`${v} can be written in the form 2<i>n</i> + 1, where <i>n</i> is a whole number.`, ok, ok ? `${v} = 2 × ${n} + 1, so it is odd and fits the form.` : `${v} = 2 × ${n} is even; numbers of the form 2<i>n</i> + 1 are odd.`]; },
        ])();
        return { html: `True or false?<br>${B(T[0])}`, ...mcq(r, ['True', 'False'], T[1] ? 0 : 1), hint: 'Check it carefully with a calculation.',
          steps: [T[2], `So the statement is ${B(T[1] ? 'true' : 'false')}.`] };
      }],
  ]);

  addStyles('y9-nonlinear-graphs', [
    ['Cubic, reciprocal & exponential values',
      'Substitute into the equation just as for a quadratic. For a cubic, (−2)³ = −8. For y = k/x, x cannot be 0 (the y-axis is an asymptote). For y = aˣ, a⁰ = 1 and a negative power gives a fraction: 2⁻² = 1/4.',
      (r) => {
        const mode = r.int(0, 3);
        if (mode === 0) {
          const b = r.int(-4, 4), c = r.int(-6, 6); const xs = [-3, -2, -1, 0, 1, 2, 3]; const f = (x) => x ** 3 + b * x + c; const qx = r.pick(xs.filter((x) => x));
          const tbl = htable(['<i>x</i>', ...xs.map((x) => ds(x))], [['<i>y</i>', ...xs.map((x) => (x === qx ? B('?') : ds(f(x))))]]);
          return { html: `Here is a table of values for the cubic ${B(tx('y=' + polyT([[1, 'x^3'], [b, 'x'], [c, '']])))}.${tbl}Work out the missing value.`, ...nAns(f(qx)), answerLabel: '<i>y</i> =', hint: `Cube carefully: (${ds(qx)})³ = ${ds(qx ** 3)}.`,
            steps: [`<i>y</i> = ${br(qx)}<sup>3</sup>${b ? ` ${b < 0 ? '−' : '+'} ${Math.abs(b) === 1 ? '' : Math.abs(b) + ' × '}${br(qx)}` : ''}${c ? pm(c) : ''}`, `= ${ds(qx ** 3)}${b ? pm(b * qx) : ''}${c ? pm(c) : ''}`, `<i>y</i> = ${B(ds(f(qx)))}`] };
        }
        if (mode === 1) {
          const k = r.pick([1, 2, 3, 4, 6, 8, 10, 12, 24]) * r.sign(); const x = r.nz(-6, 6);
          return { html: `Find the value of ${iv('y')} on the reciprocal graph ${B(`<i>y</i> = ${k < 0 ? '−' : ''}${frac(Math.abs(k), '<i>x</i>')}`)} when ${B(`<i>x</i> = ${ds(x)}`)}.`, ...fAns(k, x, { simplest: false }), answerLabel: '<i>y</i> =', format: 'Type a whole number, fraction or decimal, e.g. −3 or 2/5', hint: 'Divide k by the x-value.',
            steps: [`<i>y</i> = ${frac(ds(k), br(x))}`, `<i>y</i> = ${B(fracN(...simp(k, x)))}`, 'x can never be 0, so the graph never touches the y-axis — it is an asymptote.'] };
        }
        if (mode === 2) {
          const a = r.pick([2, 3, 4, 5, 10]); const x = r.int(-3, 4); if (a >= 5 && x > 3) return { html: `Find the value of ${iv('y')} on ${B(tx(`y=${a}^x`))} when ${B('<i>x</i> = 0')}.`, ...nAns(1), answerLabel: '<i>y</i> =', hint: 'Any number to the power 0 is 1.', steps: [`<i>y</i> = ${a}<sup>0</sup>`, `= ${B(1)} — every graph y = aˣ crosses the y-axis at (0, 1).`] };
          const n = x >= 0 ? a ** x : 1, d = x >= 0 ? 1 : a ** -x;
          return { html: `Find the value of ${iv('y')} on the exponential graph ${B(tx(`y=${a}^x`))} when ${B(`<i>x</i> = ${ds(x)}`)}.`, ...fAns(n, d), answerLabel: '<i>y</i> =', format: 'Type a whole number or fraction, e.g. 8 or 1/9', hint: x < 0 ? `A negative power means 1 divided by the positive power: ${a}<sup>${x}</sup> = 1 ÷ ${a}<sup>${-x}</sup>.` : 'Multiply the base by itself x times; a⁰ = 1.',
            steps: [`<i>y</i> = ${a}<sup>${ds(x)}</sup>`, x < 0 ? `= ${frac(1, `${a}<sup>${-x}</sup>`)} = ${B(fracN(n, d))}` : `= ${B(ds(n))}`, 'The curve never reaches the x-axis: y is always positive.'] };
        }
        const q = r.pick([
          () => { const k = r.int(1, 12); return [`For which value of ${iv('x')} can ${B(`<i>y</i> = ${frac(k, '<i>x</i>')}`)} not be worked out?`, 0, ['You cannot divide by 0.', `So <i>x</i> = ${B(0)} is impossible; the y-axis (x = 0) is an asymptote.`]]; },
          () => { const a = r.pick([2, 3, 5, 10]), c = r.int(-5, 6); return [`Write down the ${iv('y')}-coordinate where ${B(tx(`y=${a}^x${c ? (c > 0 ? '+' : '-') + Math.abs(c) : ''}`))} crosses the ${iv('y')}-axis.`, 1 + c, [`At the y-axis x = 0, and ${a}<sup>0</sup> = 1.`, `<i>y</i> = 1${c ? pm(c) : ''} = ${B(ds(1 + c))}`]]; },
          () => { const b = r.int(-6, 6), c = r.int(-9, 9); return [`Write down the ${iv('y')}-coordinate where the cubic ${B(tx('y=' + polyT([[1, 'x^3'], [b, 'x^2'], [c, '']])))} crosses the ${iv('y')}-axis.`, c, ['At the y-axis x = 0, so every term with x is 0.', `<i>y</i> = ${B(ds(c))}`]]; },
        ])();
        return { html: q[0], ...nAns(q[1]), hint: 'Think about what happens when x = 0.', steps: q[2] };
      }],
  ]);
};
