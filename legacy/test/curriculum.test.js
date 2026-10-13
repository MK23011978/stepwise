'use strict';
// Plain-node tests for curriculum.js — run with: node test/curriculum.test.js
const path = require('path');
const C = require(path.join(__dirname, '..', '..', 'packages', 'engine', 'maths.cjs'));
const { STRANDS, TOPICS, STYLES, getStyle, getTopic, generate, checkAnswer, publicCurriculum } = C;

let pass = 0, fail = 0; const failures = [];
function ok(cond, msg) { if (cond) pass++; else { fail++; if (failures.length < 60) failures.push(msg); } }
function eq(a, b, msg) { ok(a === b, `${msg} (got ${JSON.stringify(a)}, expected ${JSON.stringify(b)})`); }

// ONLY=<regex> limits the per-style generator checks to matching style ids (and skips global count checks)
const ONLY = process.env.ONLY ? new RegExp(process.env.ONLY) : null;
function mulberry32(a) { return function () { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }

// ---------------------------------------------------------------- structure
eq(STRANDS.length, 6, 'six strands');
eq(STRANDS.map((s) => s.id).join(','), 'number,algebra,ratio,geometry,probability,statistics', 'strand ids');
const strandIds = new Set(STRANDS.map((s) => s.id));
const topicIds = new Set();
for (const t of TOPICS) {
  ok(!topicIds.has(t.id), `duplicate topic ${t.id}`); topicIds.add(t.id);
  ok(strandIds.has(t.strand), `topic ${t.id} strand`);
  ok([7, 8, 9, 10, 11].includes(t.year), `topic ${t.id} year`);
  ok([1, 2, 3].includes(t.term), `topic ${t.id} term`);
  ok(['F', 'H', 'FH'].includes(t.tier), `topic ${t.id} tier`);
  if (!ONLY || t.styles.some((s) => ONLY.test(s))) {
    ok(t.styles.length >= 3 && t.styles.length <= 8, `topic ${t.id} has 3-8 styles`);
    ok(typeof t.specRef === 'string' && t.specRef.length > 0, `topic ${t.id} has specRef`);
  }
  ok(t.id.startsWith(`y${t.year}-`), `topic ${t.id} id prefix`);
  for (const s of t.styles) { ok(!!STYLES[s] && STYLES[s].topicId === t.id, `style ${s} exists for ${t.id}`); ok(s.startsWith(t.id + '-'), `style id ${s}`); }
  ok(getTopic(t.id) === t, `getTopic ${t.id}`);
}
for (const id of Object.keys(STYLES)) { const s = STYLES[id]; ok(s.id === id && typeof s.gen === 'function' && s.name && s.intro, `style ${id} shape`); ok(getStyle(id) === s, `getStyle ${id}`); }
ok(getStyle('nope') === undefined && getTopic('nope') === undefined && getStyle('toString') === undefined, 'unknown ids return undefined');

const pc = publicCurriculum();
let pcJson; try { pcJson = JSON.parse(JSON.stringify(pc)); } catch (e) { pcJson = null; }
ok(!!pcJson, 'publicCurriculum JSON-serialisable');
ok(pc.strands === STRANDS && pc.topics.length === TOPICS.length, 'publicCurriculum shape');
for (const t of pc.topics) for (const s of t.styles) ok(STYLES[s.id] && STYLES[s.id].name === s.name, `public style ${s.id}`);

// ------------------------------------------------------- required minimum topics
const REQUIRED = ['y8-negative-numbers', 'y8-order-of-operations', 'y8-fractions', 'y8-decimals-percentages', 'y8-rounding', 'y8-factors-multiples', 'y8-algebraic-notation', 'y8-substitution', 'y8-expanding-brackets', 'y8-linear-equations', 'y8-sequences', 'y8-ratio', 'y8-angle-facts', 'y8-perimeter-area', 'y8-circles', 'y8-averages', 'y8-probability',
  'y9-indices', 'y9-standard-form', 'y9-percentage-change', 'y9-expanding-double', 'y9-factorising', 'y9-equations-both-sides', 'y9-inequalities', 'y9-straight-line-graphs', 'y9-direct-proportion', 'y9-speed-distance-time', 'y9-density', 'y9-pythagoras', 'y9-polygons', 'y9-volume-surface-area', 'y9-relative-frequency', 'y9-listing-outcomes', 'y9-frequency-tables',
  'y10-compound-interest', 'y10-reverse-percentages', 'y10-fractional-indices', 'y10-surds', 'y10-factorising-quadratics', 'y10-solving-quadratics', 'y10-simultaneous-equations', 'y10-rearranging', 'y10-quadratic-sequences', 'y10-proportion', 'y10-trigonometry', 'y10-arcs-sectors', 'y10-similar-shapes', 'y10-tree-diagrams', 'y10-grouped-data',
  'y11-recurring-decimals', 'y11-bounds', 'y11-rationalising', 'y11-quadratic-formula', 'y11-completing-square', 'y11-functions', 'y11-iteration', 'y11-algebraic-fractions', 'y11-quadratic-inequalities', 'y11-growth-decay', 'y11-sine-cosine-rule', 'y11-area-sine', 'y11-volume-spheres-cones', 'y11-circle-theorems', 'y11-vectors', 'y11-conditional-probability', 'y11-cumulative-frequency'];
const REQUIRED_Y7 = ['y7-place-value', 'y7-addition-subtraction', 'y7-multiplication-division', 'y7-factors-primes', 'y7-fractions', 'y7-fdp', 'y7-rounding', 'y7-expressions', 'y7-equations', 'y7-sequences', 'y7-coordinates', 'y7-ratio', 'y7-measures', 'y7-angles', 'y7-perimeter-area', 'y7-charts', 'y7-probability'];
for (const id of REQUIRED) ok(topicIds.has(id), `required topic ${id}`);
if (!ONLY) {
  for (const id of REQUIRED_Y7) ok(topicIds.has(id), `required topic ${id}`);
  ok(Object.keys(STYLES).length >= 340, `at least 340 styles (got ${Object.keys(STYLES).length})`);
  for (let i = 1; i < TOPICS.length; i++) ok(TOPICS[i - 1].year < TOPICS[i].year || (TOPICS[i - 1].year === TOPICS[i].year && TOPICS[i - 1].term <= TOPICS[i].term), `topics ordered by year/term at ${TOPICS[i].id}`);
}

// ------------------------------------------------------- generators (300 seeds each)
const N = Number(process.env.SEEDS || 300);
function perturb(q) {
  const c = q.check, a = q.answer;
  switch (c.type) {
    case 'number': return String(Number(c.value) + Math.max(1, (c.tol || 0) * 10) + Math.abs(c.value) * 0.5);
    case 'fraction': return `${c.num + c.den}/${c.den}`;
    case 'expr': return `${a}*2`;
    case 'pair': return c.values.map((v, i) => (i === 0 ? v + 1 : v)).join(', ');
    case 'ratio': return c.parts.map((p, i) => (i === 0 ? p + 1 : p)).join(':');
    case 'text': return a + '1';
    default: return null;
  }
}
const FIELDS = ['html', 'diagram', 'answerLabel', 'unit', 'format', 'answer', 'answerHtml', 'check', 'hint', 'steps'];
const perStyleFail = {};
let generated = 0;
// styles where < 20 distinct question texts is mathematically unavoidable (keep this tiny)
const VARIETY_EXEMPT = new Set([]);
const MIN_DISTINCT_HTML = 20;
for (const id of Object.keys(STYLES)) {
  if (ONLY && !ONLY.test(id)) continue;
  const seen = new Set(), seenHtml = new Set();
  for (let seed = 1; seed <= N; seed++) {
    let q;
    try { q = STYLES[id].gen(mulberry32(seed)); } catch (e) { ok(false, `${id} seed ${seed} threw: ${e.message}`); perStyleFail[id] = (perStyleFail[id] || 0) + 1; continue; }
    generated++;
    const bad = (m) => { ok(false, `${id} seed ${seed}: ${m}`); perStyleFail[id] = (perStyleFail[id] || 0) + 1; };
    let js; try { js = JSON.stringify(q); } catch (e) { bad('not serialisable'); continue; }
    if (JSON.stringify(JSON.parse(js)) !== js) bad('JSON round trip differs');
    for (const f of FIELDS) if (!(f in q)) bad('missing field ' + f);
    const OPTIONAL = q.check && q.check.type === 'choice' ? ['options', 'multi'] : [];
    if (Object.keys(q).length !== FIELDS.length + OPTIONAL.filter((f) => f in q).length || Object.keys(q).some((k) => !FIELDS.includes(k) && !OPTIONAL.includes(k))) bad('extra fields ' + Object.keys(q).join(','));
    if (q.check && q.check.type === 'choice' && (!Array.isArray(q.options) || q.options.length < 2)) bad('choice question without options');
    if (typeof q.html !== 'string' || !q.html) bad('html');
    if (!(q.diagram === null || (typeof q.diagram === 'string' && q.diagram.startsWith('<svg') && q.diagram.endsWith('</svg>')))) bad('diagram');
    if (typeof q.answer !== 'string' || !q.answer) bad('answer');
    if (!Array.isArray(q.steps) || q.steps.length < 2 || q.steps.length > 6) bad('steps count ' + (q.steps && q.steps.length));
    if (/undefined|NaN|Infinity|\[object/.test(js)) bad('contains undefined/NaN: ' + js.slice(0, 300));
    if (/\+ −|\+ -\d|− −\d|\b1x\b|\+-|-\+/.test(q.html.replace(/<[^>]+>/g, ' '))) bad('ugly sign formatting in html: ' + q.html.replace(/<[^>]+>/g, ' '));
    if (!checkAnswer(q.check, q.answer)) bad(`canonical answer "${q.answer}" fails check ${JSON.stringify(q.check)}`);
    if (checkAnswer(q.check, 'garbage')) bad('garbage accepted');
    if (checkAnswer(q.check, '')) bad('empty accepted');
    const w = perturb(q); if (w !== null && checkAnswer(q.check, w)) bad(`perturbed answer "${w}" accepted (answer ${q.answer})`);
    seen.add(q.html + (q.diagram || '')); seenHtml.add(q.html);
  }
  ok(seen.size >= Math.min(8, N / 3), `${id} has variety (${seen.size} distinct)`);
  if (N >= 300 && !VARIETY_EXEMPT.has(id)) ok(seenHtml.size >= MIN_DISTINCT_HTML, `${id} has >= ${MIN_DISTINCT_HTML} distinct html over ${N} seeds (got ${seenHtml.size})`);
}
// generate() API
for (const id of Object.keys(STYLES)) {
  if (ONLY && !ONLY.test(id)) continue;
  const a = generate(id, 42), b = generate(id, 42);
  ok(JSON.stringify(a) === JSON.stringify(b), `generate deterministic ${id}`);
  const c = generate(id); ok(checkAnswer(c.check, c.answer), `generate random ${id}`);
  const d = generate(id, 'abc'); ok(checkAnswer(d.check, d.answer), `generate string seed ${id}`);
}
let threw = false; try { generate('nope'); } catch (e) { threw = true; } ok(threw, 'generate unknown style throws');

// ------------------------------------------------------- checkAnswer unit tests
const T = (check, input, want, label) => eq(checkAnswer(check, input), want, `${label || JSON.stringify(check)} input ${JSON.stringify(input)}`);
// numbers
const n5 = { type: 'number', value: 5 };
T(n5, '5', true); T(n5, '+5', true); T(n5, ' 5 cm', true); T(n5, '10/2', true); T(n5, '5.0', true); T(n5, '6', false); T(n5, 'five', false); T(n5, '5 5', false);
T({ type: 'number', value: -3.5 }, '−3.5', true, 'unicode minus'); T({ type: 'number', value: -3.5 }, '-7/2', true); T({ type: 'number', value: -3.5 }, '-3 1/2', true);
T({ type: 'number', value: 1234567 }, '1,234,567', true, 'commas'); T({ type: 'number', value: 12.5 }, '£12.50', true, 'pound sign');
T({ type: 'number', value: 45 }, '45°', true); T({ type: 'number', value: 30 }, '30%', true); T({ type: 'number', value: 12.34, tol: 0.051 }, '12.3', true, '1dp tol'); T({ type: 'number', value: 12.34, tol: 0.051 }, '12.4', false, '1dp tol');
T({ type: 'number', value: 7 }, 'x = 7', true); T({ type: 'number', value: 7 }, '', false); T({ type: 'number', value: 7 }, null, false); T(null, '7', false);
// standard form
const sf = { type: 'number', value: 320000, sf: true, tol: 320000e-9 };
for (const s of ['3.2×10^5', '3.2x10^5', '3.2X10^5', '3.2*10^5', '3.2e5', '3.2 × 10^5', '3.2×10⁵', '3.2 x 10^(5)']) T(sf, s, true, 'SF');
T(sf, '320000', false, 'SF requires SF form'); T(sf, '32×10^4', false, 'SF mantissa range'); T(sf, '3.2×10^4', false);
const sfs = { type: 'number', value: 0.00056, sf: true, tol: 0.00056e-9 };
T(sfs, '5.6×10^-4', true); T(sfs, '5.6×10^−4', true); T(sfs, '5.6x10⁻⁴', true); T(sfs, '5.6e-4', true); T(sfs, '5.6×10^4', false);
T({ type: 'number', value: 4700 }, '4.7e3', true, 'e notation in plain number');
// fractions
const f34 = { type: 'fraction', num: 3, den: 4, simplest: true };
T(f34, '3/4', true); T(f34, '6/8', false); T(f34, '0.75', false); T(f34, ' 3 / 4 ', true); T(f34, '3/5', false);
T({ type: 'fraction', num: 3, den: 4 }, '6/8', true, 'non-simplest ok'); T({ type: 'fraction', num: 3, den: 4 }, '0.75', true, 'decimal ok when not simplest');
const f74 = { type: 'fraction', num: 7, den: 4, simplest: true };
T(f74, '1 3/4', true, 'mixed'); T(f74, '7/4', true); T(f74, '1 6/8', false); T({ ...f74, improper: true }, '1 3/4', false); T({ ...f74, mixed: true }, '7/4', false); T({ ...f74, mixed: true }, '1 3/4', true);
T({ type: 'fraction', num: -3, den: 4, simplest: true }, '-3/4', true); T({ type: 'fraction', num: -3, den: 4, simplest: true }, '−3/4', true); T({ type: 'fraction', num: -3, den: 4, simplest: true }, '3/-4', true); T({ type: 'fraction', num: -3, den: 4, simplest: true }, '3/4', false);
T({ type: 'fraction', num: 5, den: 1, simplest: true }, '5', true, 'integer'); T({ type: 'fraction', num: 5, den: 1, simplest: true }, '10/2', false); T(f34, 'P(red) = 3/4', true); T(f34, '3/0', false);
// expressions
const E = (value, input, want, extra = {}) => T({ type: 'expr', value, ...extra }, input, want, `expr ${value} ${JSON.stringify(extra)}`);
E('2x+3', '3+2x', true); E('2x+3', '2*x+3', true); E('2x+3', '2x+4', false); E('2x+3', 'y=2x+3', true); E('2x+3', '2x + 3', true); E('2x+3', '2X+3', true);
E('x^2+5x+6', '(x+2)(x+3)', true); E('x^2+5x+6', 'x²+5x+6', true); E('x^2+5x+6', 'x^2+5x+6', true, { form: 'expanded' }); E('x^2+5x+6', '(x+2)(x+3)', false, { form: 'expanded' });
E('x^2+5x+6', '(x+2)(x+3)', true, { form: 'factored' }); E('x^2+5x+6', 'x^2+5x+6', false, { form: 'factored' }); E('x^2+5x+6', '(x+3)(x+2)', true, { form: 'factored' }); E('x^2+5x+6', 'x(x+5)+6', false, { form: 'factored' });
E('x^2-6x+9', '(x-3)^2', true, { form: 'factored' }); E('x^2-6x+9', '(x−3)²', true, { form: 'factored' });
E('3x-6', '3(x-2)', true, { form: 'factored', outer: '3' }); E('3x-6', '−3(2−x)', true, { form: 'factored', outer: '3' }); E('6x^2+9x', 'x(6x+9)', false, { form: 'factored', outer: '3x' }); E('6x^2+9x', '3x(2x+3)', true, { form: 'factored', outer: '3x' }); E('6x^2+9x', '3(2x+3)x', true, { form: 'factored', outer: '3x' });
E('x(x+3)', 'x^2+3x', true); E('x(x+3)', 'x(x+3)', true); E('-x^2', '−x²', true); E('-x^2', '(-x)^2', false); E('2x', '2×x', true); E('x/2', 'x÷2', true); E('3(x+1)', '3x+3', true);
E('x+1', '2 3', false); E('x+1', 'x2', false); E('x+1', 'garbage', false); E('x+1', 'x+1)', false); E('x+1', 'x+y', false); E('(y-2)/3', '(y−2)/3', true); E('(y-2)/3', 'y/3-2/3', true); E('(y-2)/3', '(y-2)/4', false);
E('sqrt(a/pi)', 'sqrt(a/π)', true); E('sqrt(a/pi)', '√(a/pi)', true); E('5^7', '5^7', true); E('5^7', '78125', true); E('5^7', '5^8', false); E('12x^7', '12x^7', true); E('12x^7', '12x⁷', true);
E('2^3*3*5', '2^3×3×5', true, { form: 'primes' }); E('2^3*3*5', '2×2×2×3×5', true, { form: 'primes' }); E('2^3*3*5', '8×3×5', false, { form: 'primes' }); E('2^3*3*5', '120', false, { form: 'primes' }); E('2^3*3*5', '4×2×15', false, { form: 'primes' });
E('x+3', 'x+3', true, { form: 'simplified' }); E('x+3', '(x^2+5x+6)/(x+2)', false, { form: 'simplified' });
E('(2x+5)/((x+1)(x+4))', '(2x+5)/(x^2+5x+4)', true, { form: 'single' }); E('(2x+5)/((x+1)(x+4))', '1/(x+1)+1/(x+4)', false, { form: 'single' });
E('3n+2', '3n+2', true, { vars: ['n'] }); E('(x-3)/2', 'f^-1(x)=(x-3)/2', true); E('(x-3)/2', 'f⁻¹(x) = (x-3)/2', true);
// text
const TX = (accept, input, want) => T({ type: 'text', accept }, input, want, `text ${accept[0]}`);
TX(['3√2'], '3√2', true); TX(['3√2'], '3sqrt2', true); TX(['3√2'], '3 sqrt(2)', true); TX(['3√2'], '3root2', true); TX(['3√2'], '3*√2', true); TX(['3√2'], '√18', false); TX(['3√2'], '3√3', false);
TX(['3√2/4'], '(3√2)/4', true); TX(['3√2/4'], '3sqrt(2)/4', true);
TX(['x>3', '3<x'], 'x > 3', true); TX(['x>3', '3<x'], '3 < x', true); TX(['x>3', '3<x'], 'x>=3', false); TX(['x>=3', '3<=x'], 'x ≥ 3', true); TX(['x>=3', '3<=x'], 'x=>3', true); TX(['x<=-2', '-2>=x'], 'x ≤ −2', true); TX(['x<=-2', '-2>=x'], 'x<-2', false);
TX(['-2<x<3'], '−2 < x < 3', true); TX(['x<-2 or x>3'], 'x < -2 or x > 3', true); TX(['x<-2 or x>3'], 'x<-2 and x>3', false); TX(['-1,0,1,2'], '-1, 0, 1, 2', true);
// pair
const P = (c, input, want) => T({ type: 'pair', ...c }, input, want, `pair ${JSON.stringify(c)}`);
P({ values: [3, -2] }, '3, -2', true); P({ values: [3, -2] }, '-2, 3', true); P({ values: [3, -2] }, 'x=3, x=−2', true); P({ values: [3, -2] }, '3 and -2', true); P({ values: [3, -2] }, 'x = 3 or x = -2', true); P({ values: [3, -2] }, '3', false); P({ values: [3, -2] }, '3, 2', false); P({ values: [3, -2] }, '3, -2, 5', false); P({ values: [3, -2] }, 'three, minus two', false);
P({ values: [3, -2], ordered: true }, '-2, 3', false); P({ values: [3, -2], ordered: true }, 'x=3, y=-2', true); P({ values: [-1.5, 4] }, '-3/2, 4', true); P({ values: [1.2361, -3.2361], tol: 0.006 }, '1.24, -3.24', true); P({ values: [1.2361, -3.2361], tol: 0.006 }, '1.23, -3.24', false);
P({ values: [2, 5], ordered: true }, '(2, 5)', true); P({ values: [1, 2] }, 'x₁ = 1, x₂ = 2', true); P({ values: [0, 4] }, 'x=0 or x=4', true);
// ratio
T({ type: 'ratio', parts: [3, 5] }, '3:5', true); T({ type: 'ratio', parts: [3, 5] }, '3 : 5', true); T({ type: 'ratio', parts: [3, 5] }, '6:10', false); T({ type: 'ratio', parts: [3, 5] }, '5:3', false); T({ type: 'ratio', parts: [2, 3, 4] }, '2:3:4', true); T({ type: 'ratio', parts: [3, 5] }, '3/5', false);
// never throws
for (const bad of [undefined, null, 42, {}, [], '((((', ')', '^^^', '1/0', 'x^^2', '√', 'sqrt(', '−', '…', 'é', 'a'.repeat(1000)]) {
  for (const c of [n5, f34, sf, { type: 'expr', value: 'x+1' }, { type: 'text', accept: ['a'] }, { type: 'pair', values: [1, 2] }, { type: 'ratio', parts: [1, 2] }, { type: 'weird' }, {}]) {
    let t = false; try { checkAnswer(c, bad); } catch (e) { t = true; } ok(!t, `checkAnswer threw for ${JSON.stringify(c)} / ${String(bad).slice(0, 20)}`);
  }
}

// ------------------------------------------------------- report
const byYear = {}; for (const t of TOPICS) { byYear[t.year] = byYear[t.year] || { topics: 0, styles: 0 }; byYear[t.year].topics++; byYear[t.year].styles += t.styles.length; }
console.log(`Topics: ${TOPICS.length}, styles: ${Object.keys(STYLES).length}, questions generated: ${generated}`);
for (const y of Object.keys(byYear)) console.log(`  Year ${y}: ${byYear[y].topics} topics, ${byYear[y].styles} styles`);
if (Object.keys(perStyleFail).length) console.log('Failing styles:', perStyleFail);
for (const f of failures) console.log('FAIL:', f);
console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
