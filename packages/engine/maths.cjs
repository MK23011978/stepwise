'use strict';
/*
 * curriculum.js — Edexcel GCSE Maths (1MA1) curriculum, Year 8 to Year 11,
 * with procedural question generators and answer checking.
 * Zero dependencies, CommonJS, Node 20.
 */

// ============================================================================
// PRNG + random helpers
// ============================================================================
function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function R(rng) {
  const r = {
    rng,
    int(lo, hi) { return lo + Math.floor(rng() * (hi - lo + 1)); },
    nz(lo, hi) { let v; do { v = r.int(lo, hi); } while (v === 0); return v; },
    pick(a) { return a[Math.floor(rng() * a.length)]; },
    chance(p = 0.5) { return rng() < p; },
    sign() { return rng() < 0.5 ? -1 : 1; },
    shuffle(a) { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; },
    sample(a, k) { return r.shuffle(a).slice(0, k); },
  };
  return r;
}

// ============================================================================
// Maths helpers
// ============================================================================
const gcd = (a, b) => { a = Math.abs(a); b = Math.abs(b); while (b) { [a, b] = [b, a % b]; } return a; };
const lcm = (a, b) => Math.abs(a * b) / gcd(a, b);
const isPrime = (n) => { if (n < 2 || n % 1) return false; for (let i = 2; i * i <= n; i++) if (n % i === 0) return false; return true; };
function pf(n) { const f = []; for (let p = 2; p * p <= n; p++) { let e = 0; while (n % p === 0) { n /= p; e++; } if (e) f.push([p, e]); } if (n > 1) f.push([n, 1]); return f; }
const pfText = (f) => f.map(([p, e]) => (e > 1 ? `${p}^${e}` : `${p}`)).join('×');
const pfHtml = (f) => f.map(([p, e]) => (e > 1 ? `${p}<sup>${e}</sup>` : `${p}`)).join(' × ');
function rnd(x, dp = 0) { const f = 10 ** dp; const s = x < 0 ? -1 : 1; return (s * Math.round(Number((Math.abs(x) * f).toPrecision(15)))) / f; }
const ord = (n) => { const v = Math.abs(n) % 100; return n + (v >= 11 && v <= 13 ? 'th' : ({ 1: 'st', 2: 'nd', 3: 'rd' })[v % 10] || 'th'); };
const frS = (n, d) => (gcd(n, d) > 1 ? `${fracN(n, d)} = ${B(fracS(n, d))}` : B(fracN(n, d)));
const sum = (a) => a.reduce((s, v) => s + v, 0);
const DEG = Math.PI / 180;
const sinD = (d) => Math.sin(d * DEG), cosD = (d) => Math.cos(d * DEG), tanD = (d) => Math.tan(d * DEG);
const asinD = (v) => Math.asin(v) / DEG, acosD = (v) => Math.acos(v) / DEG, atanD = (v) => Math.atan(v) / DEG;
function simp(n, d) { if (d < 0) { n = -n; d = -d; } const g = gcd(n, d) || 1; return [n / g, d / g]; }

// ============================================================================
// Number formatting
// ============================================================================
function ps(x, dp = 9) { // plain string (answers)
  if (!isFinite(x)) return String(x);
  const v = rnd(x, dp);
  if (v === 0) return '0';
  let s = String(v);
  if (/e/.test(s)) { s = v.toFixed(Math.min(20, Math.max(0, dp))); if (s.includes('.')) s = s.replace(/\.?0+$/, ''); }
  return s;
}
const commas = (s) => { let neg = s[0] === '-'; if (neg) s = s.slice(1); let [i, f] = s.split('.'); if (i.length > 4) i = i.replace(/\B(?=(\d{3})+(?!\d))/g, ','); return (neg ? '−' : '') + i + (f !== undefined ? '.' + f : ''); };
const ds = (x, dp = 9) => commas(ps(x, dp)); // display
function fx(x, dp) { let s = rnd(x, dp).toFixed(dp); if (/^-0(\.0*)?$/.test(s)) s = s.slice(1); return s; } // fixed dp, plain
const dfx = (x, dp) => commas(fx(x, dp));
const money = (x) => '£' + commas(fx(x, 2));
const B = (s) => `<b>${s}</b>`;
const br = (n) => (n < 0 ? `(${ds(n)})` : ds(n));
const pm = (n) => (n < 0 ? ` − ${ds(-n)}` : ` + ${ds(n)}`); // " + 3" / " − 3"
const pmT = (n) => (n < 0 ? `-${ps(-n)}` : `+${ps(n)}`);
const frac = (a, b) => `<span class="frac"><span>${a}</span><span>${b}</span></span>`;
function fracN(n, d) { if (d < 0) { n = -n; d = -d; } if (d === 1) return ds(n); return (n < 0 ? '−' : '') + frac(ds(Math.abs(n)), ds(d)); }
function fracS(n, d) { const [a, b] = simp(n, d); return fracN(a, b); }
function fracT(n, d) { const [a, b] = simp(n, d); return b === 1 ? `${a}` : `${a}/${b}`; }
const sq = (x) => `<span class="sqrt">${x}</span>`;
const deg = (x) => `${ds(x)}°`;
const dpWord = (dp) => `${dp} decimal place${dp === 1 ? '' : 's'}`;

// text maths -> html: '3x^2-2x+1' -> 3<i>x</i><sup>2</sup> − 2<i>x</i> + 1
function tx(s) {
  s = String(s).replace(/sqrt/g, '√').replace(/pi/g, 'π');
  let out = '', prev = '';
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (c === ' ') continue;
    if (c === '^') {
      let j = i + 1, e = '';
      if (s[j] === '(') { let d = 0, k = j; for (; k < s.length; k++) { if (s[k] === '(') d++; else if (s[k] === ')') { d--; if (!d) break; } } e = s.slice(j + 1, k); i = k; }
      else { if (s[j] === '-') { e = '-'; j++; } const m = s.slice(j).match(/^(\d+(\.\d+)?|[a-z])/); e += m ? m[0] : ''; i = j + (m ? m[0].length : 0) - 1; }
      out += '<sup>' + tx(e) + '</sup>'; prev = 'x'; continue;
    }
    if (c === '-') { out += (prev === '' || '(=<>,+-*/≤≥'.includes(prev)) ? '−' : ' − '; prev = '-'; continue; }
    if (c === '+') out += ' + ';
    else if (c === '*') out += ' × ';
    else if (c === '=') out += ' = ';
    else if (c === '<') out += ' &lt; ';
    else if (c === '>') out += ' &gt; ';
    else if (c === '≤' || c === '≥') out += ` ${c} `;
    else if (/[a-z]/.test(c)) out += `<i>${c}</i>`;
    else out += c;
    prev = c;
  }
  return out;
}
// polynomial text from [[coef, 'x^2'], [coef, 'x'], [coef, '']]
function polyT(terms) {
  let s = '';
  for (const [c, v] of terms) {
    if (c === 0) continue;
    const a = Math.abs(c);
    const t = (v && a === 1 ? '' : ps(a)) + v;
    if (s === '') s = (c < 0 ? '-' : '') + t; else s += (c < 0 ? '-' : '+') + t;
  }
  return s || '0';
}
const lin = (a, b, v = 'x') => polyT([[a, v], [b, '']]);
const quad = (a, b, c, v = 'x') => polyT([[a, v + '^2'], [b, v], [c, '']]);
const coefT = (a, v) => (a === 1 ? v : a === -1 ? '-' + v : ps(a) + v);

// HTML table helper
function table(rows, head = true) {
  const cs = 'border:1px solid rgba(128,128,128,.55);padding:4px 12px;text-align:center';
  return '<table class="qtable" style="border-collapse:collapse;margin:8px 0">' + rows.map((row, i) => '<tr>' + row.map((c) => (i === 0 && head ? `<th style="${cs}">${c}</th>` : `<td style="${cs}">${c}</td>`)).join('') + '</tr>').join('') + '</table>';
}
function htable(header, rows) { // first column header style
  const cs = 'border:1px solid rgba(128,128,128,.55);padding:4px 12px;text-align:center';
  return '<table class="qtable" style="border-collapse:collapse;margin:8px 0">' + [header, ...rows].map((row) => '<tr>' + row.map((c, j) => (j === 0 ? `<th style="${cs}">${c}</th>` : `<td style="${cs}">${c}</td>`)).join('') + '</tr>').join('') + '</table>';
}
function colvec(a, b) {
  return `<span style="display:inline-flex;align-items:center;vertical-align:middle"><span style="font-size:1.9em;font-weight:200;line-height:1">(</span><span style="display:inline-flex;flex-direction:column;text-align:center;line-height:1.2;margin:0 3px">${typeof a === 'number' ? `<span>${ds(a)}</span>` : `<span>${a}</span>`}${typeof b === 'number' ? `<span>${ds(b)}</span>` : `<span>${b}</span>`}</span><span style="font-size:1.9em;font-weight:200;line-height:1">)</span></span>`;
}

// ============================================================================
// Answer parsing / checking
// ============================================================================
const SUPMAP = { '⁰': '0', '¹': '1', '²': '2', '³': '3', '⁴': '4', '⁵': '5', '⁶': '6', '⁷': '7', '⁸': '8', '⁹': '9', '⁻': '-' };
function normBasic(s) {
  return String(s).replace(/[−–—‐]/g, '-').replace(/[⁰¹²³⁴⁵⁶⁷⁸⁹⁻]+/g, (m) => '^' + [...m].map((c) => SUPMAP[c]).join('')).trim();
}
const NUMRE = '(?:\\d+\\.?\\d*|\\.\\d+)';
const RE_SF = new RegExp(`^([+-]?${NUMRE})\\s*[x×*·]\\s*10\\s*(?:\\^|\\*\\*)\\s*\\(?\\s*([+-]?\\d+)\\s*\\)?$`);
const RE_E = new RegExp(`^([+-]?${NUMRE})e([+-]?\\d+)$`);
const RE_NUM = new RegExp(`^[+-]?${NUMRE}$`);
const RE_MIXED = /^([+-]?)(\d+)\s+(\d+)\s*\/\s*(\d+)$/;
const RE_FRAC = new RegExp(`^([+-]?${NUMRE})\\s*/\\s*([+-]?${NUMRE})$`);

function parseNum(input, wantSF) {
  let s = normBasic(input).toLowerCase();
  s = s.replace(/^[a-z]\s*=\s*/, '');
  s = s.replace(/(\d),(?=\d{3}(?!\d))/g, '$1');
  s = s.replace(/^([+-]?)\s*[£$€]\s*/, '$1').trim();
  let m = s.match(RE_SF);
  if (m) return { v: Number(m[1] + 'e' + m[2]), sf: true, mant: Number(m[1]) };
  m = s.match(RE_E);
  if (m) return { v: Number(m[1] + 'e' + m[2]), sf: true, mant: Number(m[1]) };
  if (wantSF) return null;
  s = s.replace(/\s*[a-z°%µ'"][a-z0-9°%µ^/\s.'"-]*$/, '').replace(/p$/, '').trim();
  if (RE_NUM.test(s)) return { v: Number(s) };
  m = s.match(RE_MIXED);
  if (m) { const d = +m[4]; if (!d) return null; return { v: (m[1] === '-' ? -1 : 1) * (+m[2] + +m[3] / d) }; }
  m = s.match(RE_FRAC);
  if (m) { const d = Number(m[2]); if (!d) return null; return { v: Number(m[1]) / d }; }
  return null;
}

function parseFrac(input) {
  let s = normBasic(input).toLowerCase().replace(/^p\s*\([^)]*\)\s*=\s*/, '').replace(/^[a-z]\s*=\s*/, '').trim();
  let m = s.match(/^([+-]?)\s*(\d+)\s+(\d+)\s*\/\s*(\d+)$/);
  if (m) { const sg = m[1] === '-' ? -1 : 1, w = +m[2], n = +m[3], d = +m[4]; if (!d) return null; return { n: sg * (w * d + n), d, mixed: true, fn: n, fd: d }; }
  m = s.match(/^([+-]?)\s*(\d+)\s*\/\s*([+-]?)\s*(\d+)$/);
  if (m) { const n = +m[2], d = +m[4]; if (!d) return null; const sg = (m[1] === '-' ? -1 : 1) * (m[3] === '-' ? -1 : 1); return { n: sg * n, d, frac: true }; }
  if (/^[+-]?\d+$/.test(s)) return { n: parseInt(s, 10), d: 1, int: true };
  if (/^[+-]?(\d+\.\d*|\.\d+)$/.test(s)) return { dec: true, v: Number(s) };
  return null;
}

function normText(s) {
  s = String(s).toLowerCase().replace(/[−–—‐]/g, '-').replace(/≤/g, '<=').replace(/≥/g, '>=')
    .replace(/=</g, '<=').replace(/=>/g, '>=').replace(/√/g, 'sqrt').replace(/squareroot/g, 'sqrt').replace(/root/g, 'sqrt')
    .replace(/&/g, 'and');
  s = s.replace(/\s+/g, '').replace(/[*×·]/g, '');
  s = s.replace(/sqrt\((\d+)\)/g, 'sqrt$1');
  s = s.replace(/^\(([^()]*)\)\//, '$1/');
  s = s.replace(/\.$/, '');
  return s;
}

// ---- small safe expression parser ----
function tokenize(str) {
  const s = String(str).toLowerCase().replace(/[×·∙]/g, '*').replace(/÷/g, '/').replace(/π/g, 'pi').replace(/√/g, 'sqrt')
    .replace(/\*\*/g, '^').replace(/[[{]/g, '(').replace(/[\]}]/g, ')').replace(/\s+/g, '');
  const toks = []; let i = 0;
  while (i < s.length) {
    const c = s[i];
    if (/[0-9.]/.test(c)) { const m = s.slice(i).match(/^(\d+\.?\d*|\.\d+)/); if (!m) throw new Error('num'); toks.push({ t: 'num', v: parseFloat(m[1]) }); i += m[1].length; continue; }
    if (s.startsWith('sqrt', i)) { toks.push({ t: 'fn', v: 'sqrt' }); i += 4; continue; }
    if (s.startsWith('pi', i)) { toks.push({ t: 'num', v: Math.PI, pi: true }); i += 2; continue; }
    if (/[a-z]/.test(c)) { toks.push({ t: 'var', v: c }); i++; continue; }
    if ('+-*/^()'.includes(c)) { toks.push({ t: c }); i++; continue; }
    throw new Error('bad char ' + c);
  }
  return toks;
}
function parseExpr(str) {
  const toks = tokenize(str); let p = 0;
  if (!toks.length) throw new Error('empty');
  const peek = () => toks[p];
  function expr() {
    let n = term();
    while (peek() && (peek().t === '+' || peek().t === '-')) { const op = toks[p++].t; const b = term(); n = { k: op === '+' ? 'add' : 'sub', a: n, b }; }
    return n;
  }
  function term() {
    let n = unary();
    for (;;) {
      const t = peek(); if (!t) break;
      if (t.t === '*' || t.t === '/') { p++; const b = unary(); n = { k: t.t === '*' ? 'mul' : 'div', a: n, b }; }
      else if (t.t === 'var' || t.t === '(' || t.t === 'fn' || (t.t === 'num' && (t.pi || toks[p - 1].t === ')'))) {
        const prev = toks[p - 1];
        if (t.t === 'num' && !t.pi && prev.t !== ')') throw new Error('adjacent numbers');
        n = { k: 'mul', a: n, b: power(), imp: true };
      } else if (t.t === 'num') throw new Error('adjacent number');
      else break;
    }
    return n;
  }
  function unary() {
    const t = peek(); if (!t) throw new Error('eof');
    if (t.t === '-') { p++; return { k: 'neg', a: unary() }; }
    if (t.t === '+') { p++; return unary(); }
    return power();
  }
  function power() {
    const base = primary();
    if (peek() && peek().t === '^') { p++; return { k: 'pow', a: base, b: unary() }; }
    return base;
  }
  function primary() {
    const t = toks[p++]; if (!t) throw new Error('eof');
    if (t.t === 'num') return { k: 'num', v: t.v };
    if (t.t === 'var') { if (peek() && peek().t === 'num' && !peek().pi) throw new Error('var then number'); return { k: 'var', v: t.v }; }
    if (t.t === '(') { const e = expr(); if (!peek() || peek().t !== ')') throw new Error('missing )'); p++; return { k: 'paren', a: e }; }
    if (t.t === 'fn') return { k: 'sqrt', a: power() };
    throw new Error('unexpected ' + t.t);
  }
  const n = expr();
  if (p !== toks.length) throw new Error('trailing');
  return n;
}
function ev(n, env) {
  switch (n.k) {
    case 'num': return n.v;
    case 'var': return env[n.v] === undefined ? NaN : env[n.v];
    case 'add': return ev(n.a, env) + ev(n.b, env);
    case 'sub': return ev(n.a, env) - ev(n.b, env);
    case 'mul': return ev(n.a, env) * ev(n.b, env);
    case 'div': return ev(n.a, env) / ev(n.b, env);
    case 'pow': return Math.pow(ev(n.a, env), ev(n.b, env));
    case 'neg': return -ev(n.a, env);
    case 'paren': return ev(n.a, env);
    case 'sqrt': return Math.sqrt(ev(n.a, env));
    default: return NaN;
  }
}
function varsOf(n, set = new Set()) { if (n.k === 'var') set.add(n.v); if (n.a) varsOf(n.a, set); if (n.b) varsOf(n.b, set); return set; }
const PTS = [1.37, 2.13, 0.71, 2.9, 0.53, 3.41, 1.89, 2.57, 0.89, 3.07, 1.61];
function envAt(vars, i) { const env = {}; vars.forEach((v, j) => { env[v] = PTS[(i + 3 * j) % PTS.length] + 0.173 * j; }); return env; }
const close = (x, y) => Math.abs(x - y) <= 1e-7 * Math.max(1, Math.abs(x), Math.abs(y));
function exprEqual(a, b) {
  const vars = [...new Set([...varsOf(a), ...varsOf(b)])].sort();
  const n = vars.length ? 8 : 1; let good = 0;
  for (let i = 0; i < n; i++) {
    const env = envAt(vars, i); const x = ev(a, env), y = ev(b, env);
    if (!isFinite(x) && !isFinite(y)) continue;
    if (!isFinite(x) || !isFinite(y)) return false;
    if (!close(x, y)) return false;
    good++;
  }
  return good >= (vars.length ? 3 : 1);
}
const isSum = (n) => { while (n.k === 'paren') n = n.a; return n.k === 'add' || n.k === 'sub'; };
const isBracketSum = (f) => (f.k === 'paren' && isSum(f.a)) || (f.k === 'pow' && f.a.k === 'paren' && isSum(f.a.a));
function factorsOf(n, out) {
  if (n.k === 'neg') return factorsOf(n.a, out);
  if (n.k === 'mul') { factorsOf(n.a, out); factorsOf(n.b, out); return out; }
  if (n.k === 'paren' && !isSum(n.a)) return factorsOf(n.a, out);
  out.push(n); return out;
}
function isFactored(n) {
  const fs = factorsOf(n, []);
  if (fs.length === 1) return fs[0].k === 'pow' && isBracketSum(fs[0]);
  return fs.some(isBracketSum);
}
function outerOK(n, outerStr) {
  const fs = factorsOf(n, []).filter((f) => !isBracketSum(f));
  const outer = parseExpr(outerStr);
  const vars = [...new Set([...varsOf(outer), ...fs.flatMap((f) => [...varsOf(f)])])].sort();
  for (let i = 0; i < 5; i++) {
    const env = envAt(vars, i);
    const pIn = fs.reduce((acc, f) => acc * ev(f, env), 1);
    if (!close(Math.abs(pIn), Math.abs(ev(outer, env)))) return false;
  }
  return true;
}
function isPrimeProduct(n) {
  const fs = []; (function walk(x) { if (x.k === 'mul') { walk(x.a); walk(x.b); } else fs.push(x); })(n);
  return fs.every((f) => (f.k === 'num' && isPrime(f.v)) || (f.k === 'pow' && f.a.k === 'num' && isPrime(f.a.v) && f.b.k === 'num' && Number.isInteger(f.b.v) && f.b.v >= 1));
}
function prepExpr(s) {
  s = normBasic(s).toLowerCase().replace(/\s+/g, '');
  s = s.replace(/^(?:[a-z]|f(?:\^?-1)?\([a-z]\))=/, '');
  return s;
}
function pairNums(input) {
  let s = normBasic(input).toLowerCase();
  if (/sqrt|√/.test(s)) return null;
  s = s.replace(/[a-z]\s*_?\s*[0-9₁₂]?\s*=/g, ' ').replace(/[₁₂]/g, '');
  const re = /[+-]?(?:\d+\.?\d*|\.\d+)(?:\s*\/\s*(?:\d+\.?\d*|\.\d+))?/g;
  const found = s.match(re) || [];
  const rest = s.replace(re, '').replace(/and|or|[\s,;()[\]{}&]/g, '');
  if (rest !== '') return null;
  return found.map((t) => { const [a, b] = t.split('/'); return b === undefined ? Number(a) : Number(a) / Number(b); });
}

function checkAnswer(check, input) {
  try {
    if (!check || input === undefined || input === null) return false;
    input = String(input);
    if (!input.trim() || input.length > 400) return false;
    switch (check.type) {
      case 'number': {
        const p = parseNum(input, !!check.sf);
        if (!p || !isFinite(p.v)) return false;
        if (check.sf && !(p.sf && Math.abs(p.mant) >= 1 && Math.abs(p.mant) < 10)) return false;
        const tol = check.tol == null ? 1e-9 : check.tol;
        return Math.abs(p.v - check.value) <= tol + 1e-9 * Math.abs(check.value);
      }
      case 'fraction': {
        const p = parseFrac(input); const N = check.num, D = check.den;
        if (!p || !D) return false;
        if (p.dec) { if (check.simplest || check.improper || check.mixed) return false; return Math.abs(p.v - N / D) < 1e-9; }
        if (p.n * D !== N * p.d) return false;
        if (check.simplest) {
          if (p.frac && gcd(p.n, p.d) !== 1) return false;
          if (p.mixed && (p.fn === 0 || p.fn >= p.fd || gcd(p.fn, p.fd) !== 1)) return false;
        }
        if (check.improper && p.mixed) return false;
        if (check.mixed && p.frac && Math.abs(p.n) > p.d) return false;
        return true;
      }
      case 'expr': {
        const val = parseExpr(prepExpr(check.value));
        const inS = prepExpr(input);
        if (!inS) return false;
        const inp = parseExpr(inS);
        const allowed = new Set([...varsOf(val), ...(check.vars || []).map((v) => v.toLowerCase())]);
        for (const v of varsOf(inp)) if (!allowed.has(v)) return false;
        if (!exprEqual(val, inp)) return false;
        const form = check.form || 'any';
        if (form === 'factored' && !isFactored(inp)) return false;
        if (form === 'expanded' && /[()]/.test(inS)) return false;
        if (form === 'primes' && !isPrimeProduct(inp)) return false;
        if (form === 'simplified' && (/\^/.test(inS) || (inS.match(/[a-z]/g) || []).length > 2)) return false;
        if (form === 'single') { let t = inp; while (t.k === 'neg' || t.k === 'paren') t = t.a; if (t.k !== 'div') return false; }
        if (check.outer && !outerOK(inp, check.outer)) return false;
        return true;
      }
      case 'text': {
        const n = normText(input);
        return (check.accept || []).some((a) => normText(a) === n);
      }
      case 'pair': {
        const nums = pairNums(input); const vals = check.values;
        if (!nums || nums.length !== vals.length || nums.some((v) => !isFinite(v))) return false;
        const tol = check.tol == null ? 1e-9 : check.tol;
        const eq = (a, b) => Math.abs(a - b) <= tol + 1e-9 * Math.abs(b);
        if (check.ordered) return vals.every((v, i) => eq(nums[i], v));
        const used = new Array(nums.length).fill(false);
        return vals.every((v) => { const i = nums.findIndex((x, j) => !used[j] && eq(x, v)); if (i < 0) return false; used[i] = true; return true; });
      }
      case 'ratio': {
        const parts = normBasic(input).split(':');
        if (parts.length !== check.parts.length) return false;
        return parts.every((p, i) => { const s = p.trim(); if (!RE_NUM.test(s)) return false; return Math.abs(Number(s) - check.parts[i]) < 1e-9; });
      }
      default: return false;
    }
  } catch (e) {
    return false;
  }
}

// ============================================================================
// SVG helpers
// ============================================================================
const ACC = '#3b6cf6';
const f1 = (v) => Math.round(v * 10) / 10;
function svgWrap(w, h, body, note = true) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="100%" style="max-width:360px" font-size="14" font-family="inherit" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round" stroke-linecap="round">${body}${note ? `<text x="${w - 4}" y="${h - 5}" text-anchor="end" font-size="10" fill="currentColor" stroke="none" opacity="0.65">Not drawn accurately</text>` : ''}</svg>`;
}
function sT(x, y, s, o = {}) {
  return `<text x="${f1(x)}" y="${f1(y)}" text-anchor="${o.a || 'middle'}" dominant-baseline="middle" fill="${o.c || 'currentColor'}" stroke="none"${o.fs ? ` font-size="${o.fs}"` : ''}${o.it ? ' font-style="italic"' : ''}${o.b ? ' font-weight="bold"' : ''}>${s}</text>`;
}
const stroke = (o) => ` stroke="${o.c || 'currentColor'}"${o.dash ? ' stroke-dasharray="5 4"' : ''}${o.w ? ` stroke-width="${o.w}"` : ''}${o.op ? ` opacity="${o.op}"` : ''}`;
const sL = (x1, y1, x2, y2, o = {}) => `<line x1="${f1(x1)}" y1="${f1(y1)}" x2="${f1(x2)}" y2="${f1(y2)}"${stroke(o)}/>`;
const sPoly = (pts, o = {}) => `<${o.open ? 'polyline' : 'polygon'} points="${pts.map((p) => f1(p[0]) + ',' + f1(p[1])).join(' ')}"${stroke(o)} fill="${o.fill || 'none'}"${o.fop ? ` fill-opacity="${o.fop}"` : ''}/>`;
const sC = (cx, cy, r, o = {}) => `<circle cx="${f1(cx)}" cy="${f1(cy)}" r="${f1(r)}"${stroke(o)} fill="${o.fill || 'none'}"/>`;
const sE = (cx, cy, rx, ry, o = {}) => `<ellipse cx="${f1(cx)}" cy="${f1(cy)}" rx="${f1(rx)}" ry="${f1(ry)}"${stroke(o)} fill="${o.fill || 'none'}"/>`;
const sP = (d, o = {}) => `<path d="${d}"${stroke(o)} fill="${o.fill || 'none'}"${o.fop ? ` fill-opacity="${o.fop}"` : ''}/>`;
const dot = (x, y, c = 'currentColor') => `<circle cx="${f1(x)}" cy="${f1(y)}" r="3.5" fill="${c}" stroke="none"/>`;
function angArc(V, P1, P2, r, label, o = {}) {
  const a1 = Math.atan2(P1[1] - V[1], P1[0] - V[0]); const a2 = Math.atan2(P2[1] - V[1], P2[0] - V[0]);
  let d = a2 - a1; while (d > Math.PI) d -= 2 * Math.PI; while (d < -Math.PI) d += 2 * Math.PI;
  const s = [V[0] + r * Math.cos(a1), V[1] + r * Math.sin(a1)], e = [V[0] + r * Math.cos(a1 + d), V[1] + r * Math.sin(a1 + d)];
  const mid = a1 + d / 2, lr = r + (o.lr || 15);
  return sP(`M${f1(s[0])},${f1(s[1])} A${r},${r} 0 0 ${d > 0 ? 1 : 0} ${f1(e[0])},${f1(e[1])}`, { c: o.c, w: o.w || 1.5 }) +
    (label ? sT(V[0] + lr * Math.cos(mid), V[1] + lr * Math.sin(mid), label, { c: o.tc, fs: o.fs }) : '');
}
function rightMark(V, P1, P2, s = 13) {
  const u = unit(V, P1), v = unit(V, P2);
  return sPoly([[V[0] + u[0] * s, V[1] + u[1] * s], [V[0] + (u[0] + v[0]) * s, V[1] + (u[1] + v[1]) * s], [V[0] + v[0] * s, V[1] + v[1] * s]], { open: true, w: 1.5 });
}
function unit(A, B) { const dx = B[0] - A[0], dy = B[1] - A[1], l = Math.hypot(dx, dy) || 1; return [dx / l, dy / l]; }
function tick(A, Bp, n = 1) {
  const m = [(A[0] + Bp[0]) / 2, (A[1] + Bp[1]) / 2], u = unit(A, Bp), nrm = [-u[1], u[0]]; let s = '';
  for (let i = 0; i < n; i++) { const off = (i - (n - 1) / 2) * 5; const c = [m[0] + u[0] * off, m[1] + u[1] * off]; s += sL(c[0] - nrm[0] * 7, c[1] - nrm[1] * 7, c[0] + nrm[0] * 7, c[1] + nrm[1] * 7, { w: 1.5 }); }
  return s;
}
// fit math-coordinate points (y up) into box, returns screen points
function fit(pts, w = 360, h = 240, pad = 42, padB) {
  const xs = pts.map((p) => p[0]), ys = pts.map((p) => p[1]);
  const minx = Math.min(...xs), maxx = Math.max(...xs), miny = Math.min(...ys), maxy = Math.max(...ys);
  const pb = padB == null ? pad : padB;
  const sc = Math.min((w - 2 * pad) / ((maxx - minx) || 1), (h - pad - pb) / ((maxy - miny) || 1));
  const ox = (w - (maxx - minx) * sc) / 2, oy = pad + ((h - pad - pb) - (maxy - miny) * sc) / 2;
  return pts.map((p) => [ox + (p[0] - minx) * sc, oy + (maxy - p[1]) * sc]);
}
// generic triangle: P = 3 screen points; o.sides[i] labels side P[i]-P[i+1]
function triSvg(P, o = {}) {
  const g = [(P[0][0] + P[1][0] + P[2][0]) / 3, (P[0][1] + P[1][1] + P[2][1]) / 3];
  let body = sPoly(P);
  for (let i = 0; i < 3; i++) {
    const A = P[i], Bp = P[(i + 1) % 3];
    if (o.hi === i) body += sL(A[0], A[1], Bp[0], Bp[1], { c: ACC, w: 3 });
    if (o.ticks && o.ticks[i]) body += tick(A, Bp, o.ticks[i]);
    if (o.sides && o.sides[i]) {
      const m = [(A[0] + Bp[0]) / 2, (A[1] + Bp[1]) / 2]; const u = unit(g, m);
      const an = u[0] > 0.35 ? 'start' : u[0] < -0.35 ? 'end' : 'middle';
      body += sT(m[0] + u[0] * (an === 'middle' ? 14 : 8), m[1] + u[1] * 14, o.sides[i], { a: an, c: o.hi === i ? ACC : undefined, b: o.hi === i });
    }
  }
  for (let i = 0; i < 3; i++) {
    const V = P[i], P1 = P[(i + 1) % 3], P2 = P[(i + 2) % 3];
    if (o.right === i) body += rightMark(V, P1, P2);
    else if (o.angles && o.angles[i]) body += angArc(V, P1, P2, o.ar || 24, o.angles[i], { c: o.hiA === i ? ACC : undefined, tc: o.hiA === i ? ACC : undefined, lr: 17 });
    if (o.v) { const u = unit(g, V); body += sT(V[0] + u[0] * 14, V[1] + u[1] * 14, o.v[i], { b: true }); }
  }
  return svgWrap(o.w || 360, o.h || 240, body + (o.extra || ''));
}
// right-angled triangle: right angle bottom-left. sides: v (vertical), hz (horizontal), hyp. angle at 'B' (bottom-right) or 'T' (top)
function rtSvg(o) {
  const T = [70, 36], C = [70, 196], Bv = [300, 196];
  let body = sPoly([T, C, Bv]) + rightMark(C, T, Bv);
  const hiC = { c: ACC, w: 3 };
  if (o.hi === 'v') body += sL(T[0], T[1], C[0], C[1], hiC);
  if (o.hi === 'hz') body += sL(C[0], C[1], Bv[0], Bv[1], hiC);
  if (o.hi === 'hyp') body += sL(T[0], T[1], Bv[0], Bv[1], hiC);
  const lab = (k, x, y, a) => (o[k] ? sT(x, y, o[k], { a, c: o.hi === k ? ACC : undefined, b: o.hi === k }) : '');
  body += lab('v', 58, 116, 'end') + lab('hz', 185, 216, 'middle') + lab('hyp', 192, 104, 'start');
  if (o.angle) {
    const at = o.angleAt === 'T' ? T : Bv, other = o.angleAt === 'T' ? C : C, third = o.angleAt === 'T' ? Bv : T;
    body += angArc(at, other, third, 34, o.angle, { c: o.hiAngle ? ACC : undefined, tc: o.hiAngle ? ACC : undefined, lr: 18 });
  }
  return svgWrap(360, 240, body);
}
function triFromAngles(A, Bd) { // returns math points [A,B,C] for angles at A and B
  const C = 180 - A - Bd; const a = sinD(A), b = sinD(Bd), c = sinD(C);
  return [[c * cosD(Bd), c * sinD(Bd)], [0, 0], [a, 0]];
}
function triFromSides(a, b, c) { // sides opposite A,B,C -> math points [A,B,C]; B at origin, C on x-axis
  const cosB = (a * a + c * c - b * b) / (2 * a * c); const sinB = Math.sqrt(Math.max(0, 1 - cosB * cosB));
  return [[c * cosB, c * sinB], [0, 0], [a, 0]];
}
// straight line / around a point angle diagrams. parts: [{deg, label, hi}]
function anglesSvg(parts, full) {
  let body = '';
  const O = full ? [180, 122] : [180, 168]; const L = full ? 105 : 140;
  if (!full) body += sL(O[0] - 150, O[1], O[0] + 150, O[1]);
  let acc = full ? 90 : 0; const rays = [];
  for (let i = 0; i < parts.length; i++) { rays.push(acc); acc += parts[i].deg; }
  if (!full) rays.push(180);
  const pt = (a, r) => [O[0] + r * cosD(a), O[1] - r * sinD(a)];
  rays.forEach((a, i) => { if (full || (i > 0 && i < rays.length - 1)) { const p = pt(a, L); body += sL(O[0], O[1], p[0], p[1]); } });
  let a0 = full ? 90 : 0;
  parts.forEach((p) => {
    const a1 = a0 + p.deg; const rr = p.deg < 35 ? 46 : 30;
    body += angArc(O, pt(a0, 10), pt(a1, 10), rr, p.label, { c: p.hi ? ACC : undefined, tc: p.hi ? ACC : undefined, lr: p.deg < 35 ? 18 : 22, w: 1.5 });
    a0 = a1;
  });
  body += dot(O[0], O[1]);
  return svgWrap(360, full ? 250 : 200, body);
}
function polygonSvg(n, o = {}) {
  const pts = []; for (let i = 0; i < n; i++) { const a = 90 + (360 / n) * (i + 0.5); pts.push([180 + 88 * cosD(a), 118 - 88 * sinD(a)]); }
  let body = sPoly(pts);
  if (o.ext) { const A = pts[0], Bp = pts[1]; const u = unit(A, Bp); const E = [Bp[0] + u[0] * 55, Bp[1] + u[1] * 55]; body += sL(Bp[0], Bp[1], E[0], E[1], { dash: true }); body += angArc(Bp, E, pts[2], 22, o.ext, { c: ACC, tc: ACC, lr: 18 }); }
  if (o.int) body += angArc(pts[1], pts[0], pts[2], 22, o.int, { c: ACC, tc: ACC, lr: 18 });
  return svgWrap(360, 240, body);
}

// shapes: rectangle-ish polygon with side labels (math points, labels per edge i from P[i] to P[i+1])
function shapeSvg(pts, labels, o = {}) {
  const P = fit(pts, 360, 240, 46);
  const g = [sum(P.map((p) => p[0])) / P.length, sum(P.map((p) => p[1])) / P.length];
  let body = sPoly(P, { fill: o.fill ? ACC : 'none', fop: 0.08 });
  P.forEach((A, i) => {
    const Bp = P[(i + 1) % P.length]; const lab = labels[i]; if (!lab) return;
    const m = [(A[0] + Bp[0]) / 2, (A[1] + Bp[1]) / 2]; const u = unit(A, Bp); let nrm = [u[1], -u[0]];
    // choose normal pointing away from centroid
    if ((m[0] - g[0]) * nrm[0] + (m[1] - g[1]) * nrm[1] < 0) nrm = [-nrm[0], -nrm[1]];
    if (o.inside && o.inside.includes(i)) nrm = [-nrm[0], -nrm[1]];
    const an = nrm[0] > 0.35 ? 'start' : nrm[0] < -0.35 ? 'end' : 'middle';
    body += sT(m[0] + nrm[0] * (an === 'middle' ? 16 : 8), m[1] + nrm[1] * 13, lab, { a: an });
  });
  if (o.height) { // [fromIdx point math, toPoint math, label]
    const H = fit([...pts, o.height[0], o.height[1]], 360, 240, 46); const a = H[pts.length], b = H[pts.length + 1];
    body += sL(a[0], a[1], b[0], b[1], { dash: true, c: ACC }) + rightMark(b, a, [b[0] + 20, b[1]], 9) + sT(a[0] + 8, (a[1] + b[1]) / 2, o.height[2], { a: 'start', c: ACC });
  }
  return svgWrap(360, 240, body);
}
function circleSvg(o) { // o.mode 'r'|'d', label
  const c = [180, 118], r = 88; let body = sC(c[0], c[1], r) + dot(c[0], c[1]);
  if (o.mode === 'r') body += sL(c[0], c[1], c[0] + r * cosD(25), c[1] - r * sinD(25), { c: ACC, w: 2.5 }) + sT(c[0] + (r / 2) * cosD(25) - 14 * sinD(25), c[1] - (r / 2) * sinD(25) - 14 * cosD(25), o.label, { c: ACC });
  else body += sL(c[0] - r, c[1], c[0] + r, c[1], { c: ACC, w: 2.5 }) + sT(c[0] + 40, c[1] - 12, o.label, { c: ACC });
  return svgWrap(360, 240, body);
}
function sectorSvg(theta, rLabel, angLabel, hi) {
  const c = [180, 132], r = 92; const a0 = 90 - theta / 2 + (theta > 200 ? 0 : 0); const a1 = a0 + theta;
  const p0 = [c[0] + r * cosD(a0), c[1] - r * sinD(a0)], p1 = [c[0] + r * cosD(a1), c[1] - r * sinD(a1)];
  const large = theta > 180 ? 1 : 0;
  let body = sP(`M${f1(c[0])},${f1(c[1])} L${f1(p0[0])},${f1(p0[1])} A${r},${r} 0 ${large} 0 ${f1(p1[0])},${f1(p1[1])} Z`, { fill: ACC, fop: 0.1 });
  if (hi === 'arc') body += sP(`M${f1(p0[0])},${f1(p0[1])} A${r},${r} 0 ${large} 0 ${f1(p1[0])},${f1(p1[1])}`, { c: ACC, w: 3.5 });
  const mr = [(c[0] + p0[0]) / 2, (c[1] + p0[1]) / 2];
  body += sT(mr[0] + 14 * cosD(a0 - 90), mr[1] - 14 * sinD(a0 - 90), rLabel);
  const am = a0 + theta / 2; const ar = theta < 60 ? 34 : 22;
  body += sP(`M${f1(c[0] + ar * cosD(a0))},${f1(c[1] - ar * sinD(a0))} A${ar},${ar} 0 ${large} 0 ${f1(c[0] + ar * cosD(a1))},${f1(c[1] - ar * sinD(a1))}`, { w: 1.5 });
  body += sT(c[0] + (ar + 18) * cosD(am), c[1] - (ar + 18) * sinD(am), angLabel);
  return svgWrap(360, 245, body);
}
function cuboidSvg(l, w, h, hiFill) {
  const x0 = 70, y0 = 205, L = 180, H = 110, dx = 60, dy = -45;
  const F = [[x0, y0], [x0 + L, y0], [x0 + L, y0 - H], [x0, y0 - H]];
  const Bk = F.map(([x, y]) => [x + dx, y + dy]);
  let body = sPoly(F, { fill: hiFill ? ACC : 'none', fop: 0.08 }) + sPoly([F[3], Bk[3], Bk[2], F[2]]) + sPoly([F[1], Bk[1], Bk[2], F[2]]);
  body += sL(F[0][0], F[0][1], Bk[0][0], Bk[0][1], { dash: true, w: 1 }) + sL(Bk[0][0], Bk[0][1], Bk[1][0], Bk[1][1], { dash: true, w: 1 }) + sL(Bk[0][0], Bk[0][1], Bk[3][0], Bk[3][1], { dash: true, w: 1 });
  body += sT(x0 + L / 2, y0 + 16, l) + sT(x0 - 10, y0 - H / 2, h, { a: 'end' }) + sT(x0 + L + dx / 2 + 10, y0 + dy / 2 + 2, w, { a: 'start' });
  return svgWrap(360, 240, body);
}
function cylinderSvg(rLab, hLab) {
  const cx = 180, top = 50, bot = 190, rx = 80, ry = 22;
  let body = sE(cx, top, rx, ry) + sL(cx - rx, top, cx - rx, bot) + sL(cx + rx, top, cx + rx, bot);
  body += sP(`M${cx - rx},${bot} A${rx},${ry} 0 0 0 ${cx + rx},${bot}`) + sP(`M${cx - rx},${bot} A${rx},${ry} 0 0 1 ${cx + rx},${bot}`, { dash: true, w: 1 });
  body += dot(cx, top) + sL(cx, top, cx + rx, top, { c: ACC }) + sT(cx + rx / 2, top + 11, rLab, { c: ACC, fs: 13 });
  body += sT(cx + rx + 10, (top + bot) / 2, hLab, { a: 'start' });
  return svgWrap(360, 240, body);
}
function prismSvg(bLab, hLab, lLab) {
  const A = [60, 200], Bp = [170, 200], C = [60, 90]; const dx = 120, dy = -50;
  const A2 = [A[0] + dx, A[1] + dy], B2 = [Bp[0] + dx, Bp[1] + dy], C2 = [C[0] + dx, C[1] + dy];
  let body = sPoly([A, Bp, C], { fill: ACC, fop: 0.08 }) + rightMark(A, Bp, C, 11) + sL(Bp[0], Bp[1], B2[0], B2[1]) + sL(C[0], C[1], C2[0], C2[1]) + sL(B2[0], B2[1], C2[0], C2[1]);
  body += sL(A[0], A[1], A2[0], A2[1], { dash: true, w: 1 }) + sL(A2[0], A2[1], B2[0], B2[1], { dash: true, w: 1 }) + sL(A2[0], A2[1], C2[0], C2[1], { dash: true, w: 1 });
  body += sT((A[0] + Bp[0]) / 2, A[1] + 16, bLab) + sT(A[0] - 10, (A[1] + C[1]) / 2, hLab, { a: 'end' }) + sT((Bp[0] + B2[0]) / 2 + 12, (Bp[1] + B2[1]) / 2 + 8, lLab, { a: 'start' });
  return svgWrap(360, 240, body);
}
function sphereSvg(rLab) {
  const c = [180, 120], r = 90;
  let body = sC(c[0], c[1], r) + sP(`M${c[0] - r},${c[1]} A${r},${r * 0.28} 0 0 0 ${c[0] + r},${c[1]}`) + sP(`M${c[0] - r},${c[1]} A${r},${r * 0.28} 0 0 1 ${c[0] + r},${c[1]}`, { dash: true, w: 1 });
  body += dot(c[0], c[1]) + sL(c[0], c[1], c[0] + r, c[1], { c: ACC }) + sT(c[0] + r / 2, c[1] - 12, rLab, { c: ACC });
  return svgWrap(360, 240, body);
}
function coneSvg(rLab, hLab) {
  const ap = [180, 30], cx = 180, by = 190, rx = 90, ry = 24;
  let body = sL(ap[0], ap[1], cx - rx, by) + sL(ap[0], ap[1], cx + rx, by) + sP(`M${cx - rx},${by} A${rx},${ry} 0 0 0 ${cx + rx},${by}`) + sP(`M${cx - rx},${by} A${rx},${ry} 0 0 1 ${cx + rx},${by}`, { dash: true, w: 1 });
  body += sL(cx, ap[1], cx, by, { dash: true, c: ACC }) + rightMark([cx, by], [cx, ap[1]], [cx + rx, by], 9) + sL(cx, by, cx + rx, by, { c: ACC });
  body += sT(cx + 8, (ap[1] + by) / 2 + 10, hLab, { a: 'start', c: ACC }) + sT(cx + rx / 2, by + 36, rLab, { c: ACC });
  return svgWrap(360, 240, body);
}
function pyramidSvg(bLab, hLab) {
  const F = [[80, 200], [230, 200], [290, 160], [140, 160]]; const ap = [185, 30]; const cen = [185, 180];
  let body = sL(F[0][0], F[0][1], F[1][0], F[1][1]) + sL(F[1][0], F[1][1], F[2][0], F[2][1]) + sL(F[2][0], F[2][1], F[3][0], F[3][1], { dash: true, w: 1 }) + sL(F[3][0], F[3][1], F[0][0], F[0][1], { dash: true, w: 1 });
  body += [0, 1, 2].map((i) => sL(ap[0], ap[1], F[i][0], F[i][1])).join('') + sL(ap[0], ap[1], F[3][0], F[3][1], { dash: true, w: 1 });
  body += sL(ap[0], ap[1], cen[0], cen[1], { dash: true, c: ACC }) + sT(ap[0] + 8, 95, hLab, { a: 'start', c: ACC }) + sT(155, 216, bLab) + sT(272, 190, bLab, { a: 'start' });
  return svgWrap(360, 240, body);
}
function barSvg(labels, values, o = {}) {
  const x0 = 52, y0 = 198, W = 290, H = 160; const maxV = Math.max(...values);
  const step = maxV <= 6 ? 1 : maxV <= 12 ? 2 : maxV <= 30 ? 5 : 10; const top = Math.ceil(maxV / step) * step;
  let body = '';
  for (let v = 0; v <= top; v += step) { const y = y0 - (v / top) * H; body += sL(x0, y, x0 + W, y, { w: 1, op: 0.25 }) + sT(x0 - 8, y, String(v), { a: 'end', fs: 12 }); }
  const bw = W / labels.length;
  labels.forEach((lab, i) => { const h = (values[i] / top) * H; const x = x0 + i * bw + bw * 0.18; body += `<rect x="${f1(x)}" y="${f1(y0 - h)}" width="${f1(bw * 0.64)}" height="${f1(h)}" fill="${ACC}" fill-opacity="0.3" stroke="${ACC}" stroke-width="1.5"/>`; body += sT(x0 + (i + 0.5) * bw, y0 + 14, lab, { fs: 12 }); });
  body += sL(x0, y0, x0 + W, y0) + sL(x0, y0, x0, y0 - H - 6);
  if (o.xl) body += sT(x0 + W / 2, y0 + 32, o.xl, { fs: 12 });
  if (o.yl) body += `<text x="14" y="${y0 - H / 2}" text-anchor="middle" fill="currentColor" stroke="none" font-size="12" transform="rotate(-90 14 ${y0 - H / 2})">${o.yl}</text>`;
  return svgWrap(360, 240, body, false);
}
function gridSvg(pts, line, lim = 6) { // pts [{x,y,label}], line {m,c} or null
  const S = 300, pad = 22, cell = (S - 2 * pad) / (2 * lim); const X = (x) => pad + (x + lim) * cell, Y = (y) => pad + (lim - y) * cell;
  let body = '';
  for (let i = -lim; i <= lim; i++) { body += sL(X(i), Y(-lim), X(i), Y(lim), { w: 1, op: 0.18 }) + sL(X(-lim), Y(i), X(lim), Y(i), { w: 1, op: 0.18 }); }
  body += sL(X(-lim), Y(0), X(lim), Y(0), { w: 1.5 }) + sL(X(0), Y(-lim), X(0), Y(lim), { w: 1.5 });
  for (let i = -lim; i <= lim; i += 2) if (i) { body += sT(X(i), Y(0) + 11, ds(i), { fs: 10 }) + sT(X(0) - 5, Y(i), ds(i), { fs: 10, a: 'end' }); }
  body += sT(X(lim) + 2, Y(0) - 10, 'x', { it: true }) + sT(X(0) + 10, Y(lim) + 2, 'y', { it: true });
  if (line) { // clip y = m x + c to box
    const xs = []; for (let x = -lim; x <= lim; x += 0.01) { const y = line.m * x + line.c; if (y >= -lim && y <= lim) xs.push(x); }
    if (xs.length) { const a = xs[0], b = xs[xs.length - 1]; body += sL(X(a), Y(line.m * a + line.c), X(b), Y(line.m * b + line.c), { c: ACC, w: 2.5 }); }
  }
  pts.forEach((p) => { body += dot(X(p.x), Y(p.y), ACC) + sT(X(p.x) + 6, Y(p.y) - 11, p.label || `(${ds(p.x)}, ${ds(p.y)})`, { a: 'start', fs: 12, b: true }); });
  return svgWrap(S, S, body, false);
}
function treeSvg(p1, p2, labels) { // p1: [first, second] branch labels for stage 1; p2: [[..],[..]] stage 2; labels: [A, A'] , [B, B']
  const root = [10, 120], m = [[140, 62], [140, 178]], e = [[[280, 32], [280, 92]], [[280, 148], [280, 208]]];
  let body = '';
  for (let i = 0; i < 2; i++) {
    body += sL(root[0], root[1], m[i][0] - 42, m[i][1]) + sT((root[0] + m[i][0] - 42) / 2 - 4, (root[1] + m[i][1]) / 2 + (i ? 13 : -13), p1[i], { fs: 13, c: ACC, b: true }) + sT(m[i][0], m[i][1], labels[0][i], { fs: 11 });
    for (let j = 0; j < 2; j++) {
      body += sL(m[i][0] + 42, m[i][1], e[i][j][0] - 4, e[i][j][1]) + sT((m[i][0] + 42 + e[i][j][0]) / 2 - 4, (m[i][1] + e[i][j][1]) / 2 + (j ? 12 : -12), p2[i][j], { fs: 13, c: ACC, b: true }) + sT(e[i][j][0] + 2, e[i][j][1], labels[1][j], { fs: 11, a: 'start' });
    }
  }
  return svgWrap(360, 240, body, false);
}
function boxPlotSvg(v, lo, hi, step) {
  const x0 = 30, W = 300, X = (x) => x0 + ((x - lo) / (hi - lo)) * W, yb = 90; let body = '';
  body += sL(X(lo), 170, X(hi), 170);
  for (let t = lo; t <= hi + 1e-9; t += step) body += sL(X(t), 170, X(t), 176) + sT(X(t), 189, ds(t), { fs: 11 });
  body += sL(X(v[0]), yb, X(v[1]), yb) + sL(X(v[3]), yb, X(v[4]), yb) + sL(X(v[0]), yb - 14, X(v[0]), yb + 14) + sL(X(v[4]), yb - 14, X(v[4]), yb + 14);
  body += `<rect x="${f1(X(v[1]))}" y="${yb - 28}" width="${f1(X(v[3]) - X(v[1]))}" height="56" fill="${ACC}" fill-opacity="0.12" stroke="${ACC}" stroke-width="2"/>` + sL(X(v[2]), yb - 28, X(v[2]), yb + 28, { c: ACC, w: 2.5 });
  return svgWrap(360, 210, body, false);
}

// ============================================================================
// Registration
// ============================================================================
const STRANDS = [
  { id: 'number', name: 'Number', color: '#3b6cf6', icon: '#' },
  { id: 'algebra', name: 'Algebra', color: '#8b5cf6', icon: 'x' },
  { id: 'ratio', name: 'Ratio, Proportion & Rates of Change', color: '#0ea5a4', icon: ':' },
  { id: 'geometry', name: 'Geometry & Measures', color: '#f59e0b', icon: '△' },
  { id: 'probability', name: 'Probability', color: '#ec4899', icon: '%' },
  { id: 'statistics', name: 'Statistics', color: '#10b981', icon: 'σ' },
];
const TOPICS = [];
const STYLES = {};
const FMT = {
  number: 'Type a number, e.g. 42 or −3.5',
  fraction: 'Give your answer as a fraction in its simplest form, e.g. 3/4',
  expr: 'Type an expression, e.g. 3x+2 (use ^ for powers, e.g. x^2)',
  pair: 'Give both values separated by a comma, e.g. 3, −2',
  ratio: 'Use a colon between the parts, e.g. 3:5',
  text: '',
};
function finish(q) {
  const c = q.check;
  let ah = q.answerHtml;
  if (!ah) {
    if (c.type === 'number') ah = B(commas(String(q.answer))) + (q.unit ? ' ' + q.unit : '');
    else if (c.type === 'fraction') { const p = String(q.answer).split('/'); ah = B(p.length === 2 ? fracN(+p[0], +p[1]) : ds(+p[0])); }
    else ah = B(tx(String(q.answer)));
  }
  return {
    html: q.html, diagram: q.diagram || null, answerLabel: q.answerLabel || '', unit: q.unit || '',
    format: q.format || FMT[c.type] || '', answer: String(q.answer), answerHtml: ah, check: c,
    hint: q.hint || '', steps: q.steps || [],
  };
}
// Style ids are `${topicId}-${n}` in registration order — never reorder or remove (student progress references them).
function regStyle(t, s) {
  const sid = `${t.id}-${t.styles.length + 1}`; const fn = s[2];
  STYLES[sid] = { id: sid, topicId: t.id, name: s[0], intro: s[1], gen: (rng) => finish(fn(R(rng))) };
  t.styles.push(sid);
}
function topic(id, strand, year, term, tier, name, summary, styles) {
  const t = { id, strand, year, term, tier, name, summary, styles: [] };
  styles.forEach((s) => regStyle(t, s));
  TOPICS.push(t);
}
// append further styles to an existing topic (ids continue the numbering)
function addStyles(topicId, styles) {
  const t = TOPICS.find((x) => x.id === topicId);
  if (!t) throw new Error('addStyles: unknown topic ' + topicId);
  styles.forEach((s) => regStyle(t, s));
}
// specification references, attached to every topic as `specRef`
const SPEC = {};
// answer builders
function nAns(value, o = {}) { // o.dp (rounding), o.tol, o.money
  let answer, tol;
  if (o.money) { answer = fx(value, 2); tol = 0.0051; }
  else if (o.dp != null) { answer = fx(value, o.dp); tol = 0.51 * 10 ** -o.dp; }
  else if (o.whole) { answer = String(Math.round(value)); tol = 0.5; }
  else { answer = ps(value); tol = 1e-9; }
  if (o.tol != null) tol = o.tol;
  const disp = o.money ? money(+answer) : commas(answer);
  return { answer, check: { type: 'number', value: o.exact === false ? +answer : value, tol }, answerHtml: B(disp) + (o.unit ? ' ' + o.unit : ''), ...(o.money ? { answerLabel: '£' } : {}) };
}
function fAns(n, d, o = {}) {
  const [a, b] = simp(n, d);
  return { answer: b === 1 ? `${a}` : `${a}/${b}`, check: { type: 'fraction', num: a, den: b, simplest: o.simplest !== false, ...(o.extra || {}) }, answerHtml: B(fracN(a, b)) };
}
function eAns(text, o = {}) { return { answer: text, check: { type: 'expr', value: text, ...o }, answerHtml: B(tx(text)) }; }
function dpFmt(dp, unit) { return `Give your answer to ${dpWord(dp)}${unit ? '' : ''}.`; }
// 1dp etc display
const r1 = (x) => fx(x, 1), r2 = (x) => fx(x, 2);

// ============================================================================
// YEAR 8
// ============================================================================
topic('y8-negative-numbers', 'number', 8, 1, 'FH', 'Negative Numbers', 'Add, subtract, multiply and divide with negative numbers.', [
  ['Adding & subtracting negatives',
    'Subtracting a negative is the same as adding: 5 − (−3) = 5 + 3. Adding a negative is the same as subtracting: 4 + (−6) = 4 − 6. Then count up or down a number line.',
    (r) => {
      const a = r.nz(-15, 15), b = r.nz(-15, 15), add = r.chance();
      const ans = add ? a + b : a - b; const eff = add ? b : -b;
      const steps = [];
      if (!add && b < 0) steps.push(`Subtracting a negative is the same as adding: ${ds(a)} − (${ds(b)}) = ${ds(a)} + ${ds(-b)}`);
      else if (add && b < 0) steps.push(`Adding a negative is the same as subtracting: ${ds(a)} + (${ds(b)}) = ${ds(a)} − ${ds(-b)}`);
      else steps.push(`Write the calculation: ${ds(a)} ${add ? '+' : '−'} ${ds(b)}`);
      steps.push(`Start at ${ds(a)} on the number line and move ${Math.abs(eff)} ${eff > 0 ? 'up (to the right)' : 'down (to the left)'}.`);
      steps.push(`You land on ${B(ds(ans))}.`);
      return { html: `Work out ${B(`${ds(a)} ${add ? '+' : '−'} ${br(b)}`)}`, ...nAns(ans), hint: b < 0 ? 'Two signs next to each other: “− −” becomes “+”, and “+ −” becomes “−”.' : 'Use a number line: subtracting moves you down.', steps };
    }],
  ['Multiplying & dividing negatives',
    'Multiply or divide the numbers as normal, then decide the sign. Same signs give a positive answer; different signs give a negative answer.',
    (r) => {
      let a = r.int(2, 12) * r.sign(), b = r.int(2, 12) * r.sign();
      if (a > 0 && b > 0) { if (r.chance()) a = -a; else b = -b; }
      const mult = r.chance();
      const q = mult ? `${ds(a)} × ${br(b)}` : `${ds(a * b)} ÷ ${br(b)}`;
      const ans = mult ? a * b : a;
      const p = mult ? [a, b] : [a * b, b];
      const same = (p[0] < 0) === (p[1] < 0);
      return {
        html: `Work out ${B(q)}`, ...nAns(ans), hint: 'Same signs → positive. Different signs → negative.',
        steps: [`Ignore the signs first: ${Math.abs(p[0])} ${mult ? '×' : '÷'} ${Math.abs(p[1])} = ${Math.abs(ans)}`,
          `The signs are ${same ? 'the same' : 'different'}, so the answer is ${same ? 'positive' : 'negative'}.`, `Answer: ${B(ds(ans))}`],
      };
    }],
  ['Negative numbers in context',
    'Temperatures below zero are negative. A rise means add, a fall means subtract. The difference between two temperatures is the larger take away the smaller.',
    (r) => {
      const kind = r.int(0, 2);
      if (kind === 2) {
        let t1 = r.int(-15, 10), t2 = r.int(-20, 5); if (t1 === t2) t2 -= 3; const hi = Math.max(t1, t2), lo = Math.min(t1, t2);
        return { html: `At 6 am the temperature was ${B(deg(t1) + 'C')}. At midnight it was ${B(deg(t2) + 'C')}. What is the difference between these temperatures?`, ...nAns(hi - lo), unit: '°C', hint: 'Count the steps from the lower temperature up to the higher one.',
          steps: [`The higher temperature is ${ds(hi)}°C and the lower is ${ds(lo)}°C.`, `Difference = ${ds(hi)} − ${br(lo)} = ${ds(hi)} + ${ds(-lo)}`.replace('+ −', '− '), `Difference = ${B(ds(hi - lo))}°C`] };
      }
      const t = r.int(-12, 6), d = r.int(3, 15), rise = kind === 0; const ans = rise ? t + d : t - d;
      return { html: `The temperature is ${B(deg(t) + 'C')}. It then ${rise ? 'rises' : 'falls'} by ${B(d + '°C')}. What is the new temperature?`, ...nAns(ans), unit: '°C', hint: rise ? 'A rise means move up the number line.' : 'A fall means move down the number line.',
        steps: [`${rise ? 'Rising' : 'Falling'} by ${d} means ${rise ? 'adding' : 'subtracting'} ${d}.`, `${ds(t)} ${rise ? '+' : '−'} ${d} = ${B(ds(ans))}`, `The new temperature is ${ds(ans)}°C.`] };
    }],
]);

topic('y8-factors-multiples', 'number', 8, 1, 'FH', 'Factors, Multiples & Primes', 'Prime factor decomposition, highest common factor and lowest common multiple.', [
  ['Prime factor decomposition',
    'Keep dividing by prime numbers (2, 3, 5, 7, …) until you reach 1 — a factor tree does this. Write the number as a product of its primes, using powers for repeats.',
    (r) => {
      let n, f;
      do {
        const e = [r.int(0, 4), r.int(0, 3), r.int(0, 2), r.int(0, 1), r.chance(0.2) ? 1 : 0];
        n = 2 ** e[0] * 3 ** e[1] * 5 ** e[2] * 7 ** e[3] * 11 ** e[4]; f = pf(n);
      } while (n < 24 || n > 1000 || sum(f.map((x) => x[1])) < 3 || f.length < 2);
      const chain = []; let m = n; for (const [p, e] of f) for (let i = 0; i < e; i++) { chain.push(`${m} ÷ ${p} = ${m / p}`); m /= p; }
      return {
        html: `Write ${B(n)} as a product of its prime factors. Give your answer in index form.`,
        answer: pfText(f), check: { type: 'expr', value: pfText(f).replace(/×/g, '*'), form: 'primes' }, answerHtml: B(pfHtml(f)),
        format: 'Use × (or *) between primes and ^ for powers, e.g. 2^3×3×5',
        hint: `Start by dividing ${n} by the smallest prime that goes into it.`,
        steps: [`Divide repeatedly by primes:<br>${chain.join('<br>')}`, `The prime factors are ${f.map(([p, e]) => Array(e).fill(p).join(' × ')).join(' × ')}`, `In index form: ${n} = ${B(pfHtml(f))}`],
      };
    }],
  ['Highest common factor (HCF)',
    'Write both numbers as products of primes. The HCF is the product of the primes they share (use the lower power of each shared prime).',
    (r) => {
      let g, p, q; do { g = r.int(2, 15); p = r.int(2, 9); q = r.int(2, 11); } while (p === q || gcd(p, q) !== 1 || g * q > 150);
      const a = g * p, b = g * q; const fa = pf(a), fb = pf(b); const fg = pf(g);
      return {
        html: `Find the highest common factor (HCF) of ${B(a)} and ${B(b)}.`, ...nAns(g), hint: 'Which primes appear in both prime factorisations?',
        steps: [`${a} = ${pfHtml(fa)}`, `${b} = ${pfHtml(fb)}`, `Shared prime factors: ${pfHtml(fg)}`, `HCF = ${B(g)}`],
      };
    }],
  ['Lowest common multiple (LCM)',
    'Write both numbers as products of primes. The LCM uses every prime that appears, each with its highest power. Useful when two things repeat at different intervals.',
    (r) => {
      let a, b; do { a = r.int(4, 30); b = r.int(4, 30); } while (a === b || a % b === 0 || b % a === 0 || lcm(a, b) > 400 || gcd(a, b) === 1 && r.chance(0.5));
      const L = lcm(a, b); const ctx = r.chance(0.4);
      const html = ctx ? `One bus leaves the station every ${B(a + ' minutes')}. Another bus leaves every ${B(b + ' minutes')}. They both leave at 9 am. After how many minutes will they next leave together?`
        : `Find the lowest common multiple (LCM) of ${B(a)} and ${B(b)}.`;
      return {
        html, ...nAns(L, { unit: ctx ? 'minutes' : '' }), unit: ctx ? 'minutes' : '', hint: 'Use the highest power of every prime that appears in either number.',
        steps: [`${a} = ${pfHtml(pf(a))}`, `${b} = ${pfHtml(pf(b))}`, `Take each prime with its highest power: ${pfHtml(pf(L))}`, `LCM = ${B(L)}`],
      };
    }],
]);

topic('y8-order-of-operations', 'number', 8, 1, 'FH', 'Order of Operations', 'Use BIDMAS to evaluate calculations correctly.', [
  ['BIDMAS: × ÷ before + −',
    'BIDMAS tells you the order: Brackets, Indices, Division and Multiplication (left to right), then Addition and Subtraction (left to right).',
    (r) => {
      const t = r.int(0, 4); const a = r.int(2, 20), b = r.int(2, 9), c = r.int(2, 9), d = r.int(2, 9);
      const T = [
        () => ({ q: `${a} + ${b} × ${c}`, s: [`Multiply first: ${b} × ${c} = ${b * c}`, `Then add: ${a} + ${b * c} = ${a + b * c}`], v: a + b * c }),
        () => ({ q: `(${a} + ${b}) × ${c}`, s: [`Brackets first: ${a} + ${b} = ${a + b}`, `Then multiply: ${a + b} × ${c} = ${(a + b) * c}`], v: (a + b) * c }),
        () => ({ q: `${a} − ${b} × ${c}`, s: [`Multiply first: ${b} × ${c} = ${b * c}`, `Then subtract: ${a} − ${b * c} = ${ds(a - b * c)}`], v: a - b * c }),
        () => ({ q: `${a} × ${b} − ${c} × ${d}`, s: [`Do both multiplications: ${a} × ${b} = ${a * b} and ${c} × ${d} = ${c * d}`, `Then subtract: ${a * b} − ${c * d} = ${ds(a * b - c * d)}`], v: a * b - c * d }),
        () => ({ q: `${b * c} ÷ ${b} + ${a} × ${d}`, s: [`Divide: ${b * c} ÷ ${b} = ${c}`, `Multiply: ${a} × ${d} = ${a * d}`, `Add: ${c} + ${a * d} = ${c + a * d}`], v: c + a * d }),
      ][t]();
      return { html: `Work out ${B(T.q)}`, ...nAns(T.v), hint: 'Do multiplication and division before addition and subtraction.', steps: [...T.s, `Answer: ${B(ds(T.v))}`] };
    }],
  ['BIDMAS with brackets & indices',
    'Work out brackets first, then indices (powers and roots), then × and ÷, then + and −.',
    (r) => {
      const t = r.int(0, 3); let o;
      if (t === 0) { const a = r.int(1, 20), b = r.int(2, 5), c = r.int(2, 6); o = { q: `${a} + ${b}<sup>2</sup> × ${c}`, s: [`Indices first: ${b}<sup>2</sup> = ${b * b}`, `Multiply: ${b * b} × ${c} = ${b * b * c}`, `Add: ${a} + ${b * b * c} = ${a + b * b * c}`], v: a + b * b * c }; }
      else if (t === 1) { const d = r.int(2, 9), b = r.int(1, 12), a = b + d; const divs = []; for (let k = 2; k <= d * d; k++) if ((d * d) % k === 0 && k <= 12) divs.push(k); const c = r.pick(divs); o = { q: `(${a} − ${b})<sup>2</sup> ÷ ${c}`, s: [`Brackets: ${a} − ${b} = ${d}`, `Indices: ${d}<sup>2</sup> = ${d * d}`, `Divide: ${d * d} ÷ ${c} = ${d * d / c}`], v: d * d / c }; }
      else if (t === 2) { const a = r.int(20, 60), b = r.int(2, 6), c = r.int(2, 6), d = r.int(2, 5); o = { q: `${a} − (${b} + ${c}) × ${d}`, s: [`Brackets: ${b} + ${c} = ${b + c}`, `Multiply: ${b + c} × ${d} = ${(b + c) * d}`, `Subtract: ${a} − ${(b + c) * d} = ${ds(a - (b + c) * d)}`], v: a - (b + c) * d }; }
      else { const b = r.int(2, 4), c = r.int(1, 5), k = r.int(2, 4), a = r.int(2, 6); o = { q: `${a} × (${b} + ${c})<sup>2</sup> − ${k}<sup>3</sup>`, s: [`Brackets: ${b} + ${c} = ${b + c}`, `Indices: ${b + c}<sup>2</sup> = ${(b + c) ** 2} and ${k}<sup>3</sup> = ${k ** 3}`, `Multiply: ${a} × ${(b + c) ** 2} = ${a * (b + c) ** 2}`, `Subtract: ${a * (b + c) ** 2} − ${k ** 3} = ${ds(a * (b + c) ** 2 - k ** 3)}`], v: a * (b + c) ** 2 - k ** 3 }; }
      return { html: `Work out ${B(o.q)}`, ...nAns(o.v), hint: 'Brackets, then Indices, then × ÷, then + −.', steps: [...o.s, `Answer: ${B(ds(o.v))}`] };
    }],
]);

topic('y8-algebraic-notation', 'algebra', 8, 1, 'FH', 'Algebraic Notation & Simplifying', 'Collect like terms and multiply simple algebraic terms.', [
  ['Collecting like terms',
    'Like terms have exactly the same letters (and powers). Add or subtract their numbers (coefficients) and keep the letters: 3a + 5a = 8a. Unlike terms, such as a and b, cannot be combined.',
    (r) => {
      const [u, v] = r.pick([['x', 'y'], ['a', 'b'], ['m', 'n'], ['p', 'q'], ['c', 'd']]);
      let a, b, c, d; do { a = r.int(1, 9); c = r.nz(-9, 9); b = r.nz(-9, 9); d = r.nz(-9, 9); } while (a + c === 0 || b + d === 0 || c === -a);
      const q = polyT([[a, u], [b, v], [c, u], [d, v]]); const ans = polyT([[a + c, u], [b + d, v]]);
      return {
        html: `Simplify ${B(tx(q))}`, ...eAns(ans, { form: 'expanded' }), hint: `Group the ${u} terms together and the ${v} terms together.`,
        steps: [`Collect the ${u} terms: ${tx(polyT([[a, u], [c, u]]))} = ${tx(coefT(a + c, u))}`, `Collect the ${v} terms: ${tx(polyT([[b, v], [d, v]]))} = ${tx(coefT(b + d, v))}`, `Answer: ${B(tx(ans))}`],
      };
    }],
  ['Multiplying & dividing terms',
    'Multiply the numbers, then write the letters next to each other in alphabetical order: 3a × 4b = 12ab. A letter times itself is squared: x × x = x². To divide, cancel common numbers and letters.',
    (r) => {
      const t = r.int(0, 2); const [u, v] = r.pick([['a', 'b'], ['x', 'y'], ['m', 'n'], ['p', 'q']]);
      const a = r.int(2, 9), b = r.int(2, 9);
      if (t === 0) { const ans = `${a * b}${u}${v}`; return { html: `Simplify ${B(tx(`${a}${u}*${b}${v}`))}`, ...eAns(ans), hint: 'Multiply the numbers, then put the letters together.', steps: [`Numbers: ${a} × ${b} = ${a * b}`, `Letters: ${u} × ${v} = ${u}${v}`, `Answer: ${B(tx(ans))}`] }; }
      if (t === 1) { const ans = `${a * b}${u}^2`; return { html: `Simplify ${B(tx(`${a}${u}*${b}${u}`))}`, ...eAns(ans), hint: `${u} × ${u} = ${u}².`, steps: [`Numbers: ${a} × ${b} = ${a * b}`, `Letters: ${tx(`${u}*${u}=${u}^2`)}`, `Answer: ${B(tx(ans))}`] }; }
      const k = r.int(2, 6); const ans = coefT(k, v);
      return { html: `Simplify ${B(frac(tx(`${a * k}${u}${v}`), tx(`${a}${u}`)))}`, ...eAns(ans), hint: 'Divide the numbers, then cancel any letter that is on the top and the bottom.', steps: [`Numbers: ${a * k} ÷ ${a} = ${k}`, `Letters: ${tx(u + v)} ÷ ${tx(u)} = ${tx(v)}`, `Answer: ${B(tx(ans))}`] };
    }],
  ['Simplifying with powers',
    'x² and x are different terms — they are not “like terms”. Collect the x² terms together and the x terms together separately.',
    (r) => {
      const v = r.pick(['x', 'a', 'y', 'n']);
      let a, b, c, d; do { a = r.int(1, 9); b = r.nz(-9, 9); c = r.nz(-9, 9); d = r.nz(-9, 9); } while (a + c === 0 || b + d === 0);
      const q = polyT([[a, v + '^2'], [b, v], [c, v + '^2'], [d, v]]); const ans = polyT([[a + c, v + '^2'], [b + d, v]]);
      return { html: `Simplify ${B(tx(q))}`, ...eAns(ans, { form: 'expanded' }), hint: `Treat ${v}² terms and ${v} terms separately.`,
        steps: [`${tx(v + '^2')} terms: ${tx(polyT([[a, v + '^2'], [c, v + '^2']]))} = ${tx(coefT(a + c, v + '^2'))}`, `${tx(v)} terms: ${tx(polyT([[b, v], [d, v]]))} = ${tx(coefT(b + d, v))}`, `Answer: ${B(tx(ans))}`] };
    }],
]);

topic('y8-substitution', 'algebra', 8, 1, 'FH', 'Substitution', 'Substitute numbers into expressions and formulae.', [
  ['Substituting into expressions',
    'Replace each letter with its value, putting negative numbers in brackets. Then work it out using BIDMAS. Remember 3a means 3 × a.',
    (r) => {
      const a = r.nz(-6, 8), b = r.nz(-6, 8), p = r.int(2, 7), q = r.int(2, 7); const t = r.int(0, 3);
      const E = [
        { e: `${p}a+${q}b`, s: `${p} × ${br(a)} + ${q} × ${br(b)} = ${ds(p * a)} + ${br(q * b)}`, v: p * a + q * b },
        { e: `${p}a-${q}b`, s: `${p} × ${br(a)} − ${q} × ${br(b)} = ${ds(p * a)} − ${br(q * b)}`, v: p * a - q * b },
        { e: `a^2+${q}b`, s: `${br(a)}<sup>2</sup> + ${q} × ${br(b)} = ${a * a} + ${br(q * b)}`, v: a * a + q * b },
        { e: `${p}ab`, s: `${p} × ${br(a)} × ${br(b)}`, v: p * a * b },
      ][t];
      return { html: `Given that ${B(`<i>a</i> = ${ds(a)}`)} and ${B(`<i>b</i> = ${ds(b)}`)}, work out the value of ${B(tx(E.e))}.`, ...nAns(E.v), hint: 'Replace each letter with its number, using brackets for negatives.',
        steps: [`Substitute: ${E.s}`, `= ${B(ds(E.v))}`] };
    }],
  ['Substituting into formulae',
    'A formula links quantities. Write the formula, substitute the values you know, then calculate the subject.',
    (r) => {
      const t = r.int(0, 4); let o;
      if (t === 0) { const u = r.int(0, 20), a = r.int(2, 10), tt = r.int(2, 12); o = { f: 'v = u + at', given: `<i>u</i> = ${u}, <i>a</i> = ${a} and <i>t</i> = ${tt}`, find: '<i>v</i>', s: [`v = ${u} + ${a} × ${tt}`, `v = ${u} + ${a * tt}`], v: u + a * tt }; }
      else if (t === 1) { let b, h; do { b = r.int(3, 20); h = r.int(3, 20); } while ((b * h) % 2); o = { f: 'A = ½bh', given: `<i>b</i> = ${b} and <i>h</i> = ${h}`, find: '<i>A</i>', s: [`A = ½ × ${b} × ${h}`, `A = ${b * h} ÷ 2`], v: b * h / 2 }; }
      else if (t === 2) { const C = r.int(-4, 8) * 5; o = { f: 'F = 9C ÷ 5 + 32', given: `<i>C</i> = ${ds(C)}`, find: '<i>F</i>', s: [`F = 9 × ${br(C)} ÷ 5 + 32`, `F = ${ds(9 * C)} ÷ 5 + 32 = ${ds(9 * C / 5)} + 32`], v: 9 * C / 5 + 32 }; }
      else if (t === 3) { const l = r.int(3, 25), w = r.int(2, 15); o = { f: 'P = 2(l + w)', given: `<i>l</i> = ${l} and <i>w</i> = ${w}`, find: '<i>P</i>', s: [`P = 2 × (${l} + ${w})`, `P = 2 × ${l + w}`], v: 2 * (l + w) }; }
      else { const m = r.int(1, 6) * 2, v = r.int(2, 9); o = { f: 'E = ½mv²', given: `<i>m</i> = ${m} and <i>v</i> = ${v}`, find: '<i>E</i>', s: [`E = ½ × ${m} × ${v}<sup>2</sup>`, `E = ½ × ${m} × ${v * v}`], v: m * v * v / 2 }; }
      return { html: `Use the formula ${B(o.f.replace(/([a-zA-Z])/g, '<i>$1</i>').replace('<i>²</i>', '²'))} to work out ${o.find} when ${o.given}.`, ...nAns(o.v), hint: 'Write the formula, substitute, then use BIDMAS.', steps: [...o.s, `${o.find} = ${B(ds(o.v))}`] };
    }],
]);

function angleQ(parts, full, x) {
  return anglesSvg(parts, full);
}
topic('y8-angle-facts', 'geometry', 8, 1, 'FH', 'Angle Facts', 'Angles on a straight line, around a point, in triangles and isosceles triangles.', [
  ['Angles on a straight line',
    'Angles on a straight line add up to 180°. Add the angles you know and subtract from 180°.',
    (r) => {
      const x = r.int(25, 130); const rest = 180 - x; const k = rest >= 50 && r.chance() ? 2 : 1;
      let known = [rest]; if (k === 2) { const a = r.int(20, rest - 20); known = [a, rest - a]; }
      const parts = r.shuffle([...known.map((d) => ({ deg: d, label: deg(d) })), { deg: x, label: 'x', hi: true }]);
      return { html: `${r.pick(['The diagram shows angles on a straight line.', 'Some angles meet on a straight line.', 'The angles in the diagram lie on a straight line.'])} The known angle${k === 2 ? 's are' : ' is'} ${known.map(deg).join(' and ')}. Work out the size of angle ${B('<i>x</i>')}.`, diagram: anglesSvg(parts, false), answerLabel: 'x =', unit: '°', ...nAns(x, { unit: '°' }), hint: 'Angles on a straight line add up to 180°.',
        steps: [`Angles on a straight line add up to 180°.`, `Known angles: ${known.map(deg).join(' + ')} = ${deg(rest)}`, `x = 180° − ${deg(rest)} = ${B(deg(x))}`] };
    }],
  ['Angles around a point',
    'Angles around a point add up to 360°. Add the angles you know and subtract from 360°.',
    (r) => {
      let ks, x; do { x = r.int(40, 170); ks = [r.int(35, 160), r.int(35, 160)]; ks.push(360 - x - ks[0] - ks[1]); } while (ks[2] < 35 || ks[2] > 170);
      const parts = r.shuffle([...ks.map((d) => ({ deg: d, label: deg(d) })), { deg: x, label: 'x', hi: true }]);
      return { html: `${r.pick(['The diagram shows angles around a point.', 'Four angles meet at a point.', 'The angles in the diagram are around a point.'])} The known angles are ${ks.map(deg).join(', ')}. Work out the size of angle ${B('<i>x</i>')}.`, diagram: anglesSvg(parts, true), answerLabel: 'x =', unit: '°', ...nAns(x, { unit: '°' }), hint: 'Angles around a point add up to 360°.',
        steps: [`Angles around a point add up to 360°.`, `Known angles: ${ks.map(deg).join(' + ')} = ${deg(360 - x)}`, `x = 360° − ${deg(360 - x)} = ${B(deg(x))}`] };
    }],
  ['Angles in a triangle',
    'The three angles in any triangle add up to 180°. Subtract the two angles you know from 180°.',
    (r) => {
      let a, b; do { a = r.int(25, 110); b = r.int(25, 110); } while (a + b > 155);
      const x = 180 - a - b; const P = fit(triFromAngles(a, b), 360, 240, 44);
      return { html: `${r.pick(['The diagram shows a triangle.', 'Here is a triangle.', 'A triangular frame is shown.'])} Two of its angles are ${deg(a)} and ${deg(b)}. Work out the size of angle ${B('<i>x</i>')}.`, diagram: triSvg(P, { angles: [deg(a), deg(b), 'x'], hiA: 2 }), answerLabel: 'x =', unit: '°', ...nAns(x, { unit: '°' }), hint: 'Angles in a triangle add up to 180°.',
        steps: ['Angles in a triangle add up to 180°.', `${deg(a)} + ${deg(b)} = ${deg(a + b)}`, `x = 180° − ${deg(a + b)} = ${B(deg(x))}`] };
    }],
  ['Isosceles triangles',
    'An isosceles triangle has two equal sides, and the two base angles opposite them are equal. Use this with “angles in a triangle add up to 180°”.',
    (r) => {
      const apexGiven = r.chance();
      if (apexGiven) {
        const apex = r.int(10, 70) * 2; const base = (180 - apex) / 2; const P = fit(triFromAngles(apex, base), 360, 240, 44);
        return { html: `The triangle is isosceles with the two marked sides equal. The angle between the equal sides is ${deg(apex)}. Work out the size of angle ${B('<i>x</i>')}.`, diagram: triSvg(P, { angles: [deg(apex), 'x', ''], hiA: 1, ticks: { 0: 1, 2: 1 } }), answerLabel: 'x =', unit: '°', ...nAns(base, { unit: '°' }), hint: 'The two base angles are equal.',
          steps: [`The two base angles are equal and the angles add up to 180°.`, `Base angles together: 180° − ${deg(apex)} = ${deg(180 - apex)}`, `x = ${deg(180 - apex)} ÷ 2 = ${B(deg(base))}`] };
      }
      const base = r.int(25, 80); const apex = 180 - 2 * base; const P = fit(triFromAngles(apex, base), 360, 240, 44);
      return { html: `The triangle is isosceles with the two marked sides equal. One base angle is ${deg(base)}. Work out the size of angle ${B('<i>x</i>')}.`, diagram: triSvg(P, { angles: ['x', deg(base), ''], hiA: 0, ticks: { 0: 1, 2: 1 } }), answerLabel: 'x =', unit: '°', ...nAns(apex, { unit: '°' }), hint: 'Both base angles are the same size.',
        steps: [`Both base angles are ${deg(base)}.`, `${deg(base)} + ${deg(base)} = ${deg(2 * base)}`, `x = 180° − ${deg(2 * base)} = ${B(deg(apex))}`] };
    }],
]);

topic('y8-fractions', 'number', 8, 2, 'FH', 'Fractions', 'Simplify, add, subtract, multiply and divide fractions; convert mixed numbers.', [
  ['Simplifying fractions',
    'Divide the numerator and denominator by their highest common factor. The fraction is in its simplest form when nothing else divides into both.',
    (r) => {
      let d0, n0; do { d0 = r.int(3, 12); n0 = r.int(1, d0 - 1); } while (gcd(n0, d0) !== 1);
      const k = r.int(2, 9); const n = n0 * k, d = d0 * k;
      return { html: `Write ${B(frac(n, d))} in its simplest form.`, ...fAns(n0, d0), hint: `What is the biggest number that divides into both ${n} and ${d}?`,
        steps: [`The highest common factor of ${n} and ${d} is ${k}.`, `Divide top and bottom by ${k}: ${frac(n + ' ÷ ' + k, d + ' ÷ ' + k)} = ${B(frac(n0, d0))}`] };
    }],
  ['Adding & subtracting fractions',
    'Find a common denominator (the LCM of the denominators). Convert both fractions, add or subtract the numerators only, then simplify.',
    (r) => {
      let b, d, a, c, add; do { b = r.int(2, 12); d = r.int(2, 12); a = r.int(1, b - 1); c = r.int(1, d - 1); add = r.chance(); } while (b === d || (!add && a * d <= c * b) || gcd(a, b) !== 1 || gcd(c, d) !== 1);
      const L = lcm(b, d); const A = a * L / b, C = c * L / d; const N = add ? A + C : A - C;
      const [sn, sd] = simp(N, L);
      const steps = [`The lowest common denominator of ${b} and ${d} is ${L}.`, `${frac(a, b)} = ${frac(A, L)} and ${frac(c, d)} = ${frac(C, L)}`, `${frac(A, L)} ${add ? '+' : '−'} ${frac(C, L)} = ${frac(N, L)}`];
      if (sd !== L) steps.push(`Simplify: ${frac(N, L)} = ${B(fracN(sn, sd))}`);
      return { html: `Work out ${B(`${frac(a, b)} ${add ? '+' : '−'} ${frac(c, d)}`)}. Give your answer in its simplest form.`, ...fAns(N, L), format: 'Type a fraction such as 7/12 (improper fractions or mixed numbers like 1 1/4 are fine)', hint: `Change both fractions to have denominator ${L}.`, steps };
    }],
  ['Multiplying & dividing fractions',
    'To multiply, multiply the numerators and multiply the denominators. To divide, keep the first fraction, change ÷ to ×, and flip the second fraction (Keep, Change, Flip). Then simplify.',
    (r) => {
      let a, b, c, d; do { b = r.int(2, 10); d = r.int(2, 10); a = r.int(1, b - 1); c = r.int(1, d - 1); } while (gcd(a, b) !== 1 || gcd(c, d) !== 1 || (a === c && b === d)); const mul = r.chance();
      const N = mul ? a * c : a * d, D = mul ? b * d : b * c; const [sn, sd] = simp(N, D);
      const steps = mul ? [`Multiply the numerators: ${a} × ${c} = ${a * c}`, `Multiply the denominators: ${b} × ${d} = ${b * d}`, `${frac(N, D)}${sd !== D ? ` = ${B(fracN(sn, sd))} (simplified)` : ''}`]
        : [`Keep, change, flip: ${frac(a, b)} × ${frac(d, c)}`, `Multiply: ${frac(a + ' × ' + d, b + ' × ' + c)} = ${frac(N, D)}`, `${sd !== D ? `Simplify: ${B(fracN(sn, sd))}` : `Already in simplest form: ${B(fracN(sn, sd))}`}`];
      return { html: `Work out ${B(`${frac(a, b)} ${mul ? '×' : '÷'} ${frac(c, d)}`)}. Give your answer in its simplest form.`, ...fAns(N, D), format: 'Type a fraction such as 5/6 (improper fractions or mixed numbers are fine)', hint: mul ? 'Top × top and bottom × bottom.' : 'Flip the second fraction and multiply.', steps };
    }],
  ['Mixed numbers & improper fractions',
    'Mixed → improper: multiply the whole number by the denominator and add the numerator. Improper → mixed: divide the numerator by the denominator; the remainder goes over the denominator.',
    (r) => {
      let d, n; do { d = r.int(2, 9); n = r.int(1, d - 1); } while (gcd(n, d) !== 1);
      const w = r.int(1, 6); const top = w * d + n;
      if (r.chance()) {
        return { html: `Write ${B(`${w}${frac(n, d)}`)} as an improper fraction.`, ...fAns(top, d, { extra: { improper: true } }), format: 'Type an improper fraction, e.g. 11/4', hint: `How many ${d}ths are in ${w} whole${w > 1 ? 's' : ''}?`,
          steps: [`${w} whole${w > 1 ? 's' : ''} = ${w} × ${d} = ${w * d} ${d}ths`, `Add the ${n}: ${w * d} + ${n} = ${top}`, `So ${w}${frac(n, d)} = ${B(frac(top, d))}`] };
      }
      return { html: `Write ${B(frac(top, d))} as a mixed number.`, answer: `${w} ${n}/${d}`, check: { type: 'fraction', num: top, den: d, simplest: true, mixed: true }, answerHtml: B(`${w}${frac(n, d)}`), format: 'Type a mixed number with a space, e.g. 2 3/4', hint: `How many times does ${d} go into ${top}?`,
        steps: [`${top} ÷ ${d} = ${w} remainder ${n}`, `The whole number is ${w} and the remainder ${n} goes over ${d}.`, `So ${frac(top, d)} = ${B(`${w}${frac(n, d)}`)}`] };
    }],
]);

topic('y8-decimals-percentages', 'number', 8, 2, 'FH', 'Fractions, Decimals & Percentages', 'Convert between fractions, decimals and percentages; find percentages of amounts.', [
  ['Converting F, D and P',
    'Percent means “out of 100”. Decimal → percentage: × 100. Percentage → decimal: ÷ 100. Fraction → decimal: divide the numerator by the denominator (or make the denominator 100).',
    (r) => {
      const t = r.int(0, 4);
      if (t === 0) { const d = r.pick([2, 4, 5, 8, 10, 20, 25, 50]); let n; do { n = r.int(1, d - 1); } while (gcd(n, d) !== 1); const v = n / d;
        return { html: `Write ${B(frac(n, d))} as a decimal.`, ...nAns(v), hint: `Divide ${n} by ${d}.`, steps: [`${frac(n, d)} means ${n} ÷ ${d}.`, `${n} ÷ ${d} = ${B(ps(v))}`] }; }
      if (t === 1) { const v = r.pick([r.int(1, 99) / 100, r.int(1, 9) / 10, r.int(101, 250) / 100, r.int(1, 999) / 1000]);
        return { html: `Write ${B(ps(v))} as a percentage.`, ...nAns(v * 100, { unit: '%' }), unit: '%', hint: 'Multiply by 100.', steps: [`To change a decimal to a percentage, multiply by 100.`, `${ps(v)} × 100 = ${B(ps(v * 100) + '%')}`] }; }
      if (t === 2) { const p = r.pick([r.int(1, 99), r.int(1, 99), r.int(101, 200), r.int(1, 99) + 0.5]);
        return { html: `Write ${B(ps(p) + '%')} as a decimal.`, ...nAns(p / 100), hint: 'Divide by 100.', steps: [`To change a percentage to a decimal, divide by 100.`, `${ps(p)} ÷ 100 = ${B(ps(p / 100))}`] }; }
      if (t === 3) { let p; do { p = r.int(1, 99); } while (gcd(p, 100) === 1 && r.chance(0.7)); const [a, b] = simp(p, 100);
        return { html: `Write ${B(p + '%')} as a fraction in its simplest form.`, ...fAns(p, 100), hint: `${p}% means ${p} out of 100.`, steps: [`${p}% = ${frac(p, 100)}`, a !== p ? `Divide top and bottom by ${p / a}: ${B(frac(a, b))}` : `This is already in its simplest form: ${B(frac(a, b))}`] }; }
      const d = r.pick([4, 5, 10, 20, 25, 50]); let n; do { n = r.int(1, d - 1); } while (gcd(n, d) !== 1); const k = 100 / d;
      return { html: `Write ${B(frac(n, d))} as a percentage.`, ...nAns(n * k, { unit: '%' }), unit: '%', hint: 'Make the denominator 100.', steps: [`Multiply top and bottom by ${k}: ${frac(n, d)} = ${frac(n * k, 100)}`, `${n * k} out of 100 = ${B(n * k + '%')}`] };
    }],
  ['Percentage of an amount',
    'Find 10% by dividing by 10 (and 1% by dividing by 100), then build up the percentage you need. On a calculator, multiply by the percentage as a decimal.',
    (r) => {
      const p = r.pick([5, 10, 15, 20, 25, 30, 35, 40, 45, 60, 70, 75, 80, 12.5, 2.5]); const amt = 20 * r.int(2, 40); const isMoney = r.chance();
      const v = amt * p / 100; const ten = amt / 10;
      const unitS = isMoney ? '' : ' kg';
      const show = (x) => (isMoney ? money(x) : ds(x) + unitS);
      return { html: `Work out ${B(ps(p) + '%')} of ${B(show(amt))}.`, ...nAns(v, isMoney ? { money: true } : { unit: 'kg' }), unit: isMoney ? '' : 'kg', format: isMoney ? 'Type the amount in pounds, e.g. 12.50' : 'Type a number',
        hint: 'Start by finding 10% (divide by 10).',
        steps: [`10% of ${show(amt)} = ${show(amt)} ÷ 10 = ${show(ten)}`, `${ps(p)}% = ${ps(p / 10)} × 10%`, `${ps(p / 10)} × ${show(ten)} = ${B(show(v))}`] };
    }],
  ['One number as a percentage of another',
    'Write the amount as a fraction of the total, then multiply by 100 to turn it into a percentage.',
    (r) => {
      let b, p; do { b = r.pick([20, 25, 40, 50, 80, 120, 200, 250, 400, 500, 60, 75]); p = r.int(2, 98); } while ((p * b) % 100);
      const a = p * b / 100; const ctx = r.pick([['scored', 'marks', 'out of'], ['sold', 'tickets', 'out of'], ['planted', 'trees, and', 'of them survived out of']]);
      return { html: `Ali scored ${B(a)} marks out of ${B(b)} in a test. What percentage did he score?`, ...nAns(p, { unit: '%' }), unit: '%', hint: `Work out ${a} ÷ ${b} × 100.`,
        steps: [`Write as a fraction: ${frac(a, b)}`, `Multiply by 100: ${a} ÷ ${b} × 100`, `= ${B(p + '%')}`] };
    }],
]);

topic('y8-expanding-brackets', 'algebra', 8, 2, 'FH', 'Expanding Single Brackets', 'Multiply out single brackets and simplify.', [
  ['Expanding a(bx + c)',
    'Multiply every term inside the bracket by the term outside. Take care with signs: a negative outside changes the sign of every term inside.',
    (r) => {
      let a = r.nz(-9, 9); while (Math.abs(a) < 2) a = r.nz(-9, 9); const b = r.int(1, 9), c = r.nz(-9, 9); const v = r.pick(['x', 'y', 'a', 'n']);
      const ans = lin(a * b, a * c, v);
      return { html: `Expand ${B(tx(`${a}(${lin(b, c, v)})`))}`, ...eAns(ans, { form: 'expanded' }), hint: `Multiply both terms in the bracket by ${ds(a)}.`,
        steps: [`${ds(a)} × ${tx(coefT(b, v))} = ${tx(coefT(a * b, v))}`, `${ds(a)} × ${br(c)} = ${ds(a * c)}`, `Answer: ${B(tx(ans))}`] };
    }],
  ['Expanding x(ax + b)',
    'When the term outside contains a letter, multiply the letters too: x × x = x². Multiply each term inside by the term outside.',
    (r) => {
      const k = r.int(1, 5), a = r.int(1, 7), b = r.nz(-9, 9); const v = r.pick(['x', 'y', 'p']);
      const out = coefT(k, v); const ans = polyT([[k * a, v + '^2'], [k * b, v]]);
      return { html: `Expand ${B(tx(`${out}(${lin(a, b, v)})`))}`, ...eAns(ans, { form: 'expanded' }), hint: `${v} × ${v} = ${v}².`,
        steps: [`${tx(out)} × ${tx(coefT(a, v))} = ${tx(coefT(k * a, v + '^2'))}`, `${tx(out)} × ${br(b)} = ${tx(coefT(k * b, v))}`, `Answer: ${B(tx(ans))}`] };
    }],
  ['Expand and simplify',
    'Expand each bracket separately, then collect like terms. A minus sign in front of a bracket multiplies every term inside by a negative.',
    (r) => {
      let a, b, c, d; do { a = r.int(2, 7); b = r.nz(-9, 9); c = r.nz(-6, 6); d = r.nz(-9, 9); } while (Math.abs(c) < 2 || a + c === 0 || a * b + c * d === 0);
      const q = `${a}(${lin(1, b)})${c < 0 ? '-' : '+'}${Math.abs(c)}(${lin(1, d)})`;
      const ans = lin(a + c, a * b + c * d);
      return { html: `Expand and simplify ${B(tx(q))}`, ...eAns(ans, { form: 'expanded' }), hint: 'Expand each bracket, then collect the x terms and the number terms.',
        steps: [`${tx(`${a}(${lin(1, b)})`)} = ${tx(lin(a, a * b))}`, `${tx(`${c}(${lin(1, d)})`)} = ${tx(lin(c, c * d))}`, `Collect: ${tx(polyT([[a, 'x'], [a * b, ''], [c, 'x'], [c * d, '']]))} = ${B(tx(ans))}`] };
    }],
]);

topic('y8-linear-equations', 'algebra', 8, 2, 'FH', 'Solving Linear Equations', 'Solve one-step and two-step linear equations.', [
  ['One-step equations',
    'Use the inverse (opposite) operation to get x on its own. Whatever you do to one side, do to the other. The inverse of + is −, and of × is ÷.',
    (r) => {
      const t = r.int(0, 3); const x = r.nz(-10, 20); const a = r.int(2, 12);
      const E = [
        { q: `x+${a}=${x + a}`, s: `Subtract ${a} from both sides: x = ${ds(x + a)} − ${a}` },
        { q: `x-${a}=${x - a}`, s: `Add ${a} to both sides: x = ${ds(x - a)} + ${a}` },
        { q: `${a}x=${a * x}`, s: `Divide both sides by ${a}: x = ${ds(a * x)} ÷ ${a}` },
        { q: null, s: `Multiply both sides by ${a}: x = ${ds(x)} × ${a}`, xx: a * x },
      ][t];
      if (t === 3) { const X = a * x; return { html: `Solve ${B(`${frac('<i>x</i>', a)} = ${ds(x)}`)}`, answerLabel: 'x =', ...nAns(X), hint: `Undo ÷ ${a} by multiplying by ${a}.`, steps: [E.s.replace('x =', '<i>x</i> ='), `<i>x</i> = ${B(ds(X))}`] }; }
      return { html: `Solve ${B(tx(E.q))}`, answerLabel: 'x =', ...nAns(x), hint: 'Do the inverse operation to both sides.', steps: [E.s.replace('x =', '<i>x</i> ='), `<i>x</i> = ${B(ds(x))}`] };
    }],
  ['Two-step equations',
    'Undo the operations in reverse order: first add or subtract to remove the number term, then divide (or multiply) to leave x on its own.',
    (r) => {
      const x = r.nz(-9, 15), a = r.int(2, 9), b = r.nz(-20, 20);
      if (r.chance(0.3)) { const X = a * r.nz(-6, 9); const c = X / a + b; return { html: `Solve ${B(`${frac('<i>x</i>', a)}${pm(b)} = ${ds(c)}`)}`, answerLabel: 'x =', ...nAns(X), hint: `First ${b > 0 ? 'subtract' : 'add'} ${Math.abs(b)}.`,
        steps: [`${b > 0 ? 'Subtract' : 'Add'} ${Math.abs(b)} ${b > 0 ? 'from' : 'to'} both sides: ${frac('<i>x</i>', a)} = ${ds(c - b)}`, `Multiply both sides by ${a}: <i>x</i> = ${ds(c - b)} × ${a}`, `<i>x</i> = ${B(ds(X))}`] }; }
      const c = a * x + b;
      return { html: `Solve ${B(tx(`${lin(a, b)}=${c}`))}`, answerLabel: 'x =', ...nAns(x), hint: `First ${b > 0 ? 'subtract' : 'add'} ${Math.abs(b)} ${b > 0 ? 'from' : 'to'} both sides.`,
        steps: [`${b > 0 ? 'Subtract' : 'Add'} ${Math.abs(b)} ${b > 0 ? 'from' : 'to'} both sides: ${tx(`${a}x=${c - b}`)}`, `Divide both sides by ${a}: <i>x</i> = ${ds(c - b)} ÷ ${a}`, `<i>x</i> = ${B(ds(x))}`] };
    }],
  ['Forming & solving equations',
    'Turn the words into an equation: call the unknown number x and write each instruction in order. Then solve it using inverse operations.',
    (r) => {
      const x = r.int(2, 25), a = r.int(2, 9), b = r.int(1, 30), add = r.chance(); const c = add ? a * x + b : a * x - b;
      return { html: `I think of a number. I multiply it by ${B(a)} and then ${add ? 'add' : 'subtract'} ${B(b)}. The answer is ${B(ds(c))}. What number did I think of?`, ...nAns(x), hint: 'Write it as an equation in x, then solve.',
        steps: [`Let the number be <i>x</i>: ${tx(`${a}x${add ? '+' : '-'}${b}=${c}`)}`, `${add ? 'Subtract' : 'Add'} ${b}: ${tx(`${a}x=${a * x}`)}`, `Divide by ${a}: <i>x</i> = ${B(x)}`] };
    }],
]);

topic('y8-perimeter-area', 'geometry', 8, 2, 'FH', 'Perimeter & Area', 'Perimeter and area of rectangles, compound shapes, triangles, parallelograms and trapezia.', [
  ['Rectangles & compound shapes',
    'Area of a rectangle = length × width. Perimeter is the total distance around the outside. Split an L-shape into two rectangles, find each area and add.',
    (r) => {
      const t = r.int(0, 2); const u = r.pick(['cm', 'm']);
      if (t < 2) { const l = r.int(3, 20), w = r.int(2, 15); const area = t === 0; const v = area ? l * w : 2 * (l + w);
        return { html: `A rectangle is ${B(l + ' ' + u)} long and ${B(w + ' ' + u)} wide. Work out its ${area ? 'area' : 'perimeter'}.`, diagram: shapeSvg([[0, 0], [l, 0], [l, w], [0, w]], [`${l} ${u}`, `${w} ${u}`, '', '']), unit: area ? u + '²' : u, ...nAns(v, { unit: area ? u + '²' : u }),
          hint: area ? 'Area = length × width.' : 'Add up all four sides.', steps: area ? [`Area = length × width`, `= ${l} × ${w}`, `= ${B(v)} ${u}²`] : [`Perimeter = ${l} + ${w} + ${l} + ${w}`, `= 2 × (${l} + ${w})`, `= ${B(v)} ${u}`] }; }
      let W, H, a, c; do { W = r.int(8, 20); H = r.int(6, 16); a = r.int(2, W - 3); c = r.int(2, H - 3); } while (false);
      // shape: top-left width a, step at height c from top
      const pts = [[0, H], [a, H], [a, H - c], [W, H - c], [W, 0], [0, 0]];
      const area = a * c + W * (H - c);
      return { html: `The diagram shows an L-shape made from rectangles. All corners are right angles. Work out its area.`, diagram: shapeSvg(pts, [`${a} ${u}`, `${c} ${u}`, '', `${H - c} ${u}`, `${W} ${u}`, `${H} ${u}`], { fill: true }), unit: u + '²', ...nAns(area, { unit: u + '²' }), hint: 'Split the shape into two rectangles.',
        steps: [`Split into a top rectangle ${a} × ${c} and a bottom rectangle ${W} × ${H - c}.`, `Top: ${a} × ${c} = ${a * c} ${u}²; bottom: ${W} × ${H - c} = ${W * (H - c)} ${u}²`, `Total area = ${a * c} + ${W * (H - c)} = ${B(area)} ${u}²`] };
    }],
  ['Area of a triangle',
    'Area of a triangle = ½ × base × perpendicular height. The height must be at right angles to the base.',
    (r) => {
      const b = r.int(3, 20), h = r.int(3, 16); const u = r.pick(['cm', 'm', 'mm']); const v = b * h / 2; const off = r.int(1, b - 1);
      const what = r.pick(['triangle', 'triangular tile', 'triangular sign', 'shaded triangle', 'triangle ABC']);
      return { html: `The diagram shows a ${what} with base ${b} ${u} and perpendicular height ${h} ${u}. Work out the area of the ${what}.`, diagram: shapeSvg([[0, 0], [b, 0], [off, h]], [`${b} ${u}`, '', ''], { height: [[off, h], [off, 0], `${h} ${u}`] }), unit: u + '²', ...nAns(v, { unit: u + '²' }), hint: 'Area = ½ × base × height.',
        steps: ['Area = ½ × base × height', `= ½ × ${b} × ${h}`, `= ${b * h} ÷ 2 = ${B(ds(v))} ${u}²`] };
    }],
  ['Area of a parallelogram',
    'Area of a parallelogram = base × perpendicular height. Do not use the slanted side.',
    (r) => {
      const b = r.int(4, 20), h = r.int(3, 14), s = r.int(2, 6); const u = r.pick(['cm', 'm']); const slant = Math.hypot(s, h);
      return { html: `${r.pick(['The diagram shows a parallelogram.', 'A parallelogram-shaped patio is shown.', 'Here is a parallelogram.', 'A metal plate is in the shape of a parallelogram.'])} Its base is ${b} ${u}, its sloping side is ${r1(slant)} ${u} and its perpendicular height is ${h} ${u}. Work out the area.`, diagram: shapeSvg([[0, 0], [b, 0], [b + s, h], [s, h]], [`${b} ${u}`, `${r1(slant)} ${u}`, '', ''], { height: [[s, h], [s, 0], `${h} ${u}`] }), unit: u + '²', ...nAns(b * h, { unit: u + '²' }), hint: 'Use the perpendicular height, not the sloping side.',
        steps: ['Area = base × perpendicular height', `= ${b} × ${h}`, `= ${B(b * h)} ${u}²`] };
    }],
  ['Area of a trapezium',
    'Area of a trapezium = ½(a + b)h, where a and b are the parallel sides and h is the perpendicular height between them.',
    (r) => {
      let a, b, h; do { a = r.int(3, 14); b = r.int(a + 2, 22); h = r.int(2, 12); } while (false);
      const u = r.pick(['cm', 'm']); const v = (a + b) * h / 2; const off = r.int(0, b - a);
      return { html: `${r.pick(['The diagram shows a trapezium.', 'A garden bed is in the shape of a trapezium.', 'Here is a trapezium.', 'The end wall of a shed is a trapezium.'])} The parallel sides are ${a} ${u} and ${b} ${u}, and the perpendicular distance between them is ${h} ${u}. Work out the area.`, diagram: shapeSvg([[0, 0], [b, 0], [off + a, h], [off, h]], [`${b} ${u}`, '', `${a} ${u}`, ''], { height: [[off + a / 2, h], [off + a / 2, 0], `${h} ${u}`] }), unit: u + '²', ...nAns(v, { unit: u + '²' }), hint: 'Add the parallel sides, halve, then multiply by the height.',
        steps: ['Area = ½(a + b)h', `= ½ × (${a} + ${b}) × ${h}`, `= ½ × ${a + b} × ${h} = ${B(ds(v))} ${u}²`] };
    }],
]);

topic('y8-averages', 'statistics', 8, 2, 'FH', 'Averages & Range', 'Mean, median, mode and range from a list of data.', [
  ['The mean',
    'Mean = total of all the values ÷ how many values there are.',
    (r) => {
      const n = r.int(5, 8); let xs; do { xs = Array.from({ length: n }, () => r.int(1, 30)); const s = sum(xs) % n; xs[n - 1] -= s; } while (xs[n - 1] < 1);
      const m = sum(xs) / n;
      return { html: `Find the mean of these numbers:<br>${B(xs.join(', '))}`, ...nAns(m), hint: 'Add them up, then divide by how many there are.',
        steps: [`Total = ${xs.join(' + ')} = ${sum(xs)}`, `There are ${n} numbers.`, `Mean = ${sum(xs)} ÷ ${n} = ${B(ds(m))}`] };
    }],
  ['The median',
    'Put the values in order from smallest to largest. The median is the middle value. If there are two middle values, the median is halfway between them.',
    (r) => {
      const n = r.int(5, 10); const xs = Array.from({ length: n }, () => r.int(1, 40)); const s = xs.slice().sort((a, b) => a - b);
      const med = n % 2 ? s[(n - 1) / 2] : (s[n / 2 - 1] + s[n / 2]) / 2;
      return { html: `Find the median of these numbers:<br>${B(xs.join(', '))}`, ...nAns(med), hint: 'Write them in order first.',
        steps: [`In order: ${s.join(', ')}`, n % 2 ? `There are ${n} values, so the median is the ${ord((n + 1) / 2)} value.` : `There are ${n} values, so the median is halfway between the ${ord(n / 2)} and ${ord(n / 2 + 1)} values: (${s[n / 2 - 1]} + ${s[n / 2]}) ÷ 2`, `Median = ${B(ds(med))}`] };
    }],
  ['Mode & range',
    'The mode is the value that appears most often. The range = largest value − smallest value, and measures how spread out the data is.',
    (r) => {
      const mode = r.int(2, 30); const others = r.sample(Array.from({ length: 40 }, (_, i) => i + 1).filter((v) => v !== mode), r.int(3, 5));
      const xs = r.shuffle([mode, mode, mode, ...others.slice(0, 1), ...others]); const askMode = r.chance();
      const mx = Math.max(...xs), mn = Math.min(...xs);
      if (askMode) return { html: `Find the mode of these numbers:<br>${B(xs.join(', '))}`, ...nAns(mode), hint: 'Which number appears most often?', steps: [`Count how often each number appears.`, `${mode} appears ${xs.filter((v) => v === mode).length} times, more than any other.`, `Mode = ${B(mode)}`] };
      return { html: `Find the range of these numbers:<br>${B(xs.join(', '))}`, ...nAns(mx - mn), hint: 'Largest − smallest.', steps: [`Largest value = ${mx}, smallest value = ${mn}`, `Range = ${mx} − ${mn} = ${B(mx - mn)}`] };
    }],
  ['Finding a missing value from the mean',
    'If you know the mean and how many values there are, the total = mean × number of values. Subtract the values you know to find the missing one.',
    (r) => {
      const n = r.int(4, 7); let xs, m, last; do { m = r.int(5, 20); xs = Array.from({ length: n - 1 }, () => r.int(1, 30)); last = n * m - sum(xs); } while (last < 1 || last > 40);
      return { html: `The mean of ${B(n)} numbers is ${B(m)}. Four of the numbers are shown below${n - 1 === 4 ? '' : ''}. Find the missing number.<br>${B(xs.join(', ') + ', ?')}`.replace('Four of', `${n - 1} of`), ...nAns(last), hint: 'Total = mean × how many numbers.',
        steps: [`Total of all ${n} numbers = ${m} × ${n} = ${m * n}`, `Total of the known numbers = ${sum(xs)}`, `Missing number = ${m * n} − ${sum(xs)} = ${B(last)}`] };
    }],
]);

topic('y8-rounding', 'number', 8, 3, 'FH', 'Rounding & Estimation', 'Round to decimal places and significant figures; estimate calculations.', [
  ['Rounding to decimal places',
    'Count the decimal places you need, then look at the next digit. If it is 5 or more, round up; if it is 4 or less, the digit stays the same.',
    (r) => {
      const N = r.int(10000, 999999); const dp = r.int(1, 3); const x = N / 1e4; const k = 10 ** (4 - dp); const R0 = Math.floor(N / k); const next = Math.floor(N / (k / 10)) % 10; const RR = (N % k) * 2 >= k ? R0 + 1 : R0; const ans = RR / 10 ** dp;
      return { html: `Round ${B(x.toFixed(4))} to ${B(dpWord(dp))}.`, ...nAns(ans), answer: ans.toFixed(dp), answerHtml: B(ans.toFixed(dp)), hint: `Look at digit number ${dp + 1} after the decimal point.`,
        steps: [`Keep ${dp} digit${dp > 1 ? 's' : ''} after the decimal point: ${(R0 / 10 ** dp).toFixed(dp)}|${String(N).slice(-4 + dp)}`, `The next digit is ${next}, which is ${next >= 5 ? '5 or more, so round up' : 'less than 5, so do not round up'}.`, `Answer: ${B(ans.toFixed(dp))}`] };
    }],
  ['Rounding to significant figures',
    'The first significant figure is the first non-zero digit. Count that many significant figures, then use the next digit to decide whether to round up. Keep place-value zeros so the number stays the right size.',
    (r) => {
      let m; do { m = r.int(10001, 99999); } while (m % 10 === 0); const e = r.int(-4, 4); const k = r.int(1, 3);
      const unitK = 10 ** (5 - k); const rm = (m % unitK) * 2 >= unitK ? (Math.floor(m / unitK) + 1) * unitK : Math.floor(m / unitK) * unitK;
      const x = Number(m + 'e' + (e - 4)); const ans = Number(rm + 'e' + (e - 4)); const next = Math.floor(m / (unitK / 10)) % 10;
      return { html: `Round ${B(ds(x))} to ${B(k + ' significant figure' + (k > 1 ? 's' : ''))}.`, ...nAns(ans), hint: 'Start counting from the first non-zero digit.',
        steps: [`The first significant figure is ${String(m)[0]}.`, `Count ${k} significant figure${k > 1 ? 's' : ''}; the next digit is ${next}, so ${next >= 5 ? 'round up' : 'do not round up'}.`, `Answer: ${B(ds(ans))}`] };
    }],
  ['Estimating calculations',
    'Round every number to 1 significant figure, then do the calculation with the rounded numbers. The symbol ≈ means “approximately equal to”.',
    (r) => {
      let a1, b1, c1; do { a1 = r.int(2, 9) * r.pick([1, 10]); b1 = r.int(2, 9) * r.pick([1, 10]); c1 = r.int(2, 9) * r.pick([1, 1, 10]); } while ((a1 * b1) % c1 || a1 === c1);
      const pert = (v) => { const u = 10 ** Math.floor(Math.log10(v)); let d; do { d = (r.int(-35, 35) / 100) * u; } while (Math.abs(d) < 0.03 * u); return rnd(v + d, u >= 10 ? 1 : 2); };
      const a = pert(a1), b = pert(b1), c = pert(c1); const v = a1 * b1 / c1;
      return { html: `By rounding each number to 1 significant figure, estimate the value of ${B(frac(`${ds(a)} × ${ds(b)}`, ds(c)))}`, ...nAns(v), hint: 'Round each number to 1 s.f. first.',
        steps: [`${ds(a)} ≈ ${a1}, ${ds(b)} ≈ ${b1}, ${ds(c)} ≈ ${c1}`, `Estimate = ${frac(`${a1} × ${b1}`, c1)} = ${frac(a1 * b1, c1)}`, `≈ ${B(ds(v))}`] };
    }],
]);

topic('y8-sequences', 'algebra', 8, 3, 'FH', 'Linear Sequences', 'Continue sequences, find and use the nth term of a linear sequence.', [
  ['Next term of a sequence',
    'Find the common difference by subtracting consecutive terms. Add it on (or take it away) to continue the sequence.',
    (r) => {
      const d = r.nz(-9, 12), a = r.int(-10, 30); const ts = [0, 1, 2, 3].map((i) => a + i * d);
      return { html: `Here are the first four terms of a sequence:<br>${B(ts.map((v) => ds(v)).join(', &nbsp;'))}<br>Find the next term.`, ...nAns(a + 4 * d), hint: 'What do you add each time?',
        steps: [`The difference between terms is ${ds(ts[1])} − ${br(ts[0])} = ${ds(d)}`, `Next term = ${ds(ts[3])}${pm(d)} = ${B(ds(a + 4 * d))}`] };
    }],
  ['Finding the nth term',
    'For a linear sequence the nth term is dn + c, where d is the common difference. Find c by working out the “zeroth term”: first term − d.',
    (r) => {
      const d = r.nz(-8, 9), a = r.int(-10, 25); const ts = [0, 1, 2, 3, 4].map((i) => a + i * d); const c = a - d; const ans = lin(d, c, 'n');
      return { html: `Find an expression for the ${B('<i>n</i>th term')} of this sequence:<br>${B(ts.map((v) => ds(v)).join(', &nbsp;'))}`, answerLabel: 'nth term =', ...eAns(ans, { vars: ['n'] }), format: 'Type an expression in n, e.g. 3n+2', hint: `The common difference tells you the number in front of n.`,
        steps: [`Common difference = ${ds(d)}, so the nth term starts ${tx(coefT(d, 'n'))}.`, `Zeroth term = ${ds(a)} − ${br(d)} = ${ds(c)}`, `nth term = ${B(tx(ans))}`] };
    }],
  ['Finding a term from the sequence',
    'Find the nth term rule first, then substitute the position number for n to find any term without listing them all.',
    (r) => {
      const d = r.nz(-7, 9), a = r.int(-10, 25); const ts = [0, 1, 2, 3].map((i) => a + i * d); const k = r.pick([10, 20, 25, 30, 40, 50, 100]); const c = a - d; const v = d * k + c;
      return { html: `Here are the first four terms of a sequence:<br>${B(ts.map((v) => ds(v)).join(', &nbsp;'))}<br>Find the ${B(ord(k))} term.`, ...nAns(v), hint: 'Find the nth term first.',
        steps: [`Common difference = ${ds(d)}, zeroth term = ${ds(c)}`, `nth term = ${tx(lin(d, c, 'n'))}`, `${ord(k)} term = ${ds(d)} × ${k}${pm(c)} = ${B(ds(v))}`] };
    }],
]);

topic('y8-ratio', 'ratio', 8, 3, 'FH', 'Ratio', 'Simplify ratios and share quantities in a given ratio.', [
  ['Simplifying ratios',
    'Divide every part of the ratio by the highest common factor. If the parts have different units, convert them to the same unit first.',
    (r) => {
      if (r.chance(0.3)) {
        const [big, small, f, ks] = r.pick([['m', 'cm', 100, [5, 10, 20, 25, 50]], ['kg', 'g', 1000, [50, 100, 125, 200, 250]], ['hours', 'minutes', 60, [5, 10, 15, 20, 30]], ['£', 'p', 100, [5, 10, 20, 25, 50]]]);
        let p, q, k; do { p = r.int(1, 9); q = r.int(1, 9); k = r.pick(ks); } while (gcd(p, q) !== 1 || (q * k) % f !== 0 || p === q);
        const A = p * k, Bq = q * k / f; const bigStr = big === '£' ? `£${ds(Bq)}` : `${ds(Bq)} ${big}`;
        const aStr = small === 'p' ? `${A}p` : `${A} ${small}`;
        return { html: `Write the ratio ${B(`${aStr} : ${bigStr}`)} in its simplest form.`, answer: `${p}:${q}`, check: { type: 'ratio', parts: [p, q] }, answerHtml: B(`${p} : ${q}`), hint: `Change ${bigStr} into ${small}.`,
          steps: [`Convert to the same units: ${bigStr} = ${q * k} ${small}`, `Ratio = ${A} : ${q * k}`, `Divide both by ${k}: ${B(`${p} : ${q}`)}`] };
      }
      const three = r.chance(0.3); let parts; do { parts = Array.from({ length: three ? 3 : 2 }, () => r.int(1, 9)); } while (parts.reduce(gcd) !== 1 || new Set(parts).size < parts.length);
      const k = r.int(2, 12); const big = parts.map((p) => p * k);
      return { html: `Write the ratio ${B(big.join(' : '))} in its simplest form.`, answer: parts.join(':'), check: { type: 'ratio', parts }, answerHtml: B(parts.join(' : ')), hint: 'Find the highest common factor of all the parts.',
        steps: [`The highest common factor of ${big.join(', ')} is ${k}.`, `Divide each part by ${k}: ${B(parts.join(' : '))}`] };
    }],
  ['Sharing in a ratio',
    'Add the parts to find the total number of shares. Divide the amount by this to find one share, then multiply by each part.',
    (r) => {
      let p, q; do { p = r.int(1, 9); q = r.int(1, 9); } while (p === q || gcd(p, q) !== 1); const one = r.int(2, 40); const total = one * (p + q);
      const askBig = r.chance(); const [n1, n2] = r.pick([['Amy', 'Ben'], ['Sara', 'Tom'], ['Priya', 'Josh'], ['Leah', 'Omar']]);
      const who = askBig ? (p > q ? n1 : n2) : (p > q ? n2 : n1); const part = askBig ? Math.max(p, q) : Math.min(p, q);
      return { html: `${n1} and ${n2} share ${B(money(total))} in the ratio ${B(`${p} : ${q}`)}. How much does ${who} get?`, ...nAns(one * part, { money: true }), format: 'Type the amount in pounds, e.g. 24', hint: 'How many shares are there altogether?',
        steps: [`Total shares = ${p} + ${q} = ${p + q}`, `One share = ${money(total)} ÷ ${p + q} = ${money(one)}`, `${who} gets ${part} shares: ${part} × ${money(one)} = ${B(money(one * part))}`] };
    }],
  ['Ratio problems from one part',
    'If you know the size of one part of the ratio, divide by its ratio number to find one share. Then scale up to find the other parts or the total.',
    (r) => {
      let p, q; do { p = r.int(1, 9); q = r.int(1, 9); } while (p === q || gcd(p, q) !== 1); const one = r.int(2, 15); const t = r.int(0, 1);
      if (t === 0) return { html: `The ratio of boys to girls in a club is ${B(`${p} : ${q}`)}. There are ${B(p * one)} boys. How many girls are there?`, ...nAns(q * one), hint: `${p} parts = ${p * one} boys.`,
        steps: [`${p} parts = ${p * one}, so 1 part = ${p * one} ÷ ${p} = ${one}`, `Girls = ${q} parts = ${q} × ${one} = ${B(q * one)}`] };
      return { html: `Red and blue paint are mixed in the ratio ${B(`${p} : ${q}`)}. ${B(q * one + ' litres')} of blue paint are used. How many litres of paint are made altogether?`, ...nAns((p + q) * one, { unit: 'litres' }), unit: 'litres', hint: `${q} parts = ${q * one} litres.`,
        steps: [`${q} parts = ${q * one} litres, so 1 part = ${one} litres`, `Total parts = ${p} + ${q} = ${p + q}`, `Total = ${p + q} × ${one} = ${B((p + q) * one)} litres`] };
    }],
]);

topic('y8-circles', 'geometry', 8, 3, 'FH', 'Circles', 'Circumference and area of circles.', [
  ['Circumference of a circle',
    'Circumference = π × diameter (C = πd), or C = 2πr using the radius. Use the π button on your calculator and round at the end.',
    (r) => {
      const useD = r.chance(); const v = r.int(2, 25); const u = r.pick(['cm', 'm', 'mm']); const d = useD ? v : 2 * v; const C = Math.PI * d;
      return { html: `A circle has ${useD ? 'diameter' : 'radius'} ${B(v + ' ' + u)}. Work out its circumference. Give your answer to 1 decimal place.`, diagram: circleSvg({ mode: useD ? 'd' : 'r', label: `${v} ${u}` }), unit: u, ...nAns(C, { dp: 1, unit: u }), format: dpFmt(1), hint: 'C = π × d.',
        steps: [useD ? `Diameter = ${v} ${u}` : `Diameter = 2 × ${v} = ${d} ${u}`, `C = π × ${d} = ${fx(C, 4)}…`, `C = ${B(r1(C))} ${u} (1 d.p.)`] };
    }],
  ['Area of a circle',
    'Area = π × radius² (A = πr²). If you are given the diameter, halve it first to get the radius.',
    (r) => {
      const useD = r.chance(); const v = useD ? 2 * r.int(1, 12) : r.int(2, 15); const u = r.pick(['cm', 'm']); const rr = useD ? v / 2 : v; const A = Math.PI * rr * rr;
      return { html: `A circle has ${useD ? 'diameter' : 'radius'} ${B(v + ' ' + u)}. Work out its area. Give your answer to 1 decimal place.`, diagram: circleSvg({ mode: useD ? 'd' : 'r', label: `${v} ${u}` }), unit: u + '²', ...nAns(A, { dp: 1, unit: u + '²' }), format: dpFmt(1), hint: 'A = πr² — make sure you use the radius.',
        steps: [useD ? `Radius = ${v} ÷ 2 = ${rr} ${u}` : `Radius = ${rr} ${u}`, `A = π × ${rr}<sup>2</sup> = π × ${rr * rr} = ${fx(A, 4)}…`, `A = ${B(r1(A))} ${u}² (1 d.p.)`] };
    }],
  ['Working backwards from the circumference',
    'Rearrange C = πd to get d = C ÷ π. The radius is half of the diameter.',
    (r) => {
      const C = r.int(15, 150); const askR = r.chance(); const d = C / Math.PI; const v = askR ? d / 2 : d;
      return { html: `A circle has a circumference of ${B(C + ' cm')}. Work out its ${askR ? 'radius' : 'diameter'}. Give your answer to 1 decimal place.`, unit: 'cm', ...nAns(v, { dp: 1, unit: 'cm' }), format: dpFmt(1), hint: 'd = C ÷ π.',
        steps: [`C = πd, so d = C ÷ π`, `d = ${C} ÷ π = ${fx(d, 4)}…`, askR ? `r = d ÷ 2 = ${fx(d / 2, 4)}… = ${B(r1(v))} cm` : `d = ${B(r1(v))} cm (1 d.p.)`] };
    }],
]);

topic('y8-probability', 'probability', 8, 3, 'FH', 'Basic Probability', 'Probability of single events and of an event not happening.', [
  ['Probability from equally likely outcomes',
    'P(event) = number of ways it can happen ÷ total number of outcomes. Write the probability as a fraction and simplify it.',
    (r) => {
      const cols = r.sample([['red', 'red'], ['blue', 'blue'], ['green', 'green'], ['yellow', 'yellow'], ['white', 'white']], 3); const ns = cols.map(() => r.int(2, 10)); const T = sum(ns);
      const i = r.int(0, 2); const not = r.chance(0.35); const k = not ? T - ns[i] : ns[i];
      return { html: `A bag contains ${cols.map((c, j) => `${B(ns[j])} ${c[0]}`).join(', ').replace(/, ([^,]*)$/, ' and $1')} counters. A counter is taken at random. Find the probability that it is ${not ? 'not ' : ''}${B(cols[i][0])}.`, ...fAns(k, T), hint: 'Count the counters that work and the total.',
        steps: [`Total counters = ${ns.join(' + ')} = ${T}`, not ? `Counters that are not ${cols[i][0]} = ${T} − ${ns[i]} = ${k}` : `${cols[i][0][0].toUpperCase() + cols[i][0].slice(1)} counters = ${k}`, `P = ${frac(k, T)}${gcd(k, T) > 1 ? ` = ${B(fracS(k, T))}` : ''}`] };
    }],
  ['Probabilities that add to 1',
    'The probabilities of all possible outcomes add up to 1. So P(not A) = 1 − P(A), and a missing probability in a table is 1 − (the others).',
    (r) => {
      if (r.chance()) { const p = r.int(1, 99); return { html: `The probability that it rains tomorrow is ${B(ps(p / 100))}. What is the probability that it does ${B('not')} rain tomorrow?`, ...nAns((100 - p) / 100), hint: 'Subtract from 1.', steps: [`P(not rain) = 1 − P(rain)`, `= 1 − ${ps(p / 100)} = ${B(ps((100 - p) / 100))}`] }; }
      let a, b, c; do { a = r.int(5, 45); b = r.int(5, 45); c = r.int(5, 40); } while (a + b + c >= 95);
      const x = 100 - a - b - c; const lbl = ['Red', 'Blue', 'Green', 'Yellow'];
      return { html: `A spinner can land on red, blue, green or yellow. The table shows the probabilities.${table([lbl, [ps(a / 100), ps(b / 100), ps(c / 100), '?']])}Find the probability that it lands on yellow.`, ...nAns(x / 100), hint: 'All the probabilities add up to 1.',
        steps: [`Known probabilities: ${ps(a / 100)} + ${ps(b / 100)} + ${ps(c / 100)} = ${ps((a + b + c) / 100)}`, `P(yellow) = 1 − ${ps((a + b + c) / 100)} = ${B(ps(x / 100))}`] };
    }],
  ['Dice, cards and spinners',
    'List the outcomes that satisfy the condition, count them, and divide by the total number of equally likely outcomes.',
    (r) => {
      const n = r.pick([6, 8, 10, 12, 20]); const conds = [
        ['an even number', (v) => v % 2 === 0], ['a prime number', isPrime], ['a multiple of 3', (v) => v % 3 === 0], ['a factor of ' + n, (v) => n % v === 0], [`greater than ${Math.floor(n / 2) + 1}`, (v) => v > Math.floor(n / 2) + 1], ['a square number', (v) => Math.sqrt(v) % 1 === 0]];
      const [desc, f] = r.pick(conds); const ok = Array.from({ length: n }, (_, i) => i + 1).filter(f);
      const what = n === 6 ? 'A fair six-sided dice is rolled.' : `A fair spinner has ${n} equal sections numbered 1 to ${n}. It is spun once.`;
      return { html: `${what} Find the probability of getting ${B(desc)}.`, ...fAns(ok.length, n), hint: 'List the numbers that work.',
        steps: [`Numbers that work: ${ok.join(', ')} — that is ${ok.length} out of ${n}.`, `P = ${frac(ok.length, n)}${gcd(ok.length, n) > 1 ? ` = ${B(fracS(ok.length, n))}` : ''}`] };
    }],
]);

// ============================================================================
// YEAR 9
// ============================================================================
const OPH = { '<': '&lt;', '>': '&gt;', '<=': '≤', '>=': '≥' };
const FLIP = { '<': '>', '>': '<', '<=': '>=', '>=': '<=' };
const ineqAccept = (op, k) => [`x${op}${ps(k)}`, `${ps(k)}${FLIP[op]}x`];
const ineqHtml = (op, k) => `<i>x</i> ${OPH[op]} ${ds(k)}`;

function idxBase(r) { // numeric or letter base with display
  if (r.chance(0.45)) { const b = r.int(2, 9); return { num: true, b: String(b), max: Math.floor(12 / Math.log10(b)) }; }
  return { num: false, b: r.pick(['x', 'a', 'y', 'm', 'p']), max: 20 };
}
const powT = (b, e) => (e === 1 ? b : `${b}^${e}`);
const powH = (b, e) => (e === 1 ? tx(b) : `${tx(b)}<sup>${ds(e)}</sup>`);
topic('y9-indices', 'number', 9, 1, 'FH', 'Laws of Indices', 'Multiply and divide powers, raise a power to a power, and use the zero index.', [
  ['Multiplying powers',
    'When you multiply powers of the same base, add the indices: aᵐ × aⁿ = aᵐ⁺ⁿ. Multiply any numbers in front separately.',
    (r) => {
      const B0 = idxBase(r); let m, n; do { m = r.int(2, 9); n = r.int(2, 9); } while (m + n > B0.max);
      const coef = !B0.num && r.chance(0.5); const c1 = coef ? r.int(2, 6) : 1, c2 = coef ? r.int(2, 6) : 1;
      const ans = (coef ? c1 * c2 : '') + powT(B0.b, m + n);
      const q = coef ? `${c1}${tx(B0.b)}<sup>${m}</sup> × ${c2}${tx(B0.b)}<sup>${n}</sup>` : `${powH(B0.b, m)} × ${powH(B0.b, n)}`;
      return { html: `Simplify ${B(q)}${B0.num ? `, giving your answer as a power of ${B0.b}` : ''}.`, ...eAns(ans), format: 'Use ^ for powers, e.g. ' + (B0.num ? '5^7' : 'x^7'), hint: 'Same base, multiplying → add the powers.',
        steps: [...(coef ? [`Multiply the numbers: ${c1} × ${c2} = ${c1 * c2}`] : []), `Add the indices: ${m} + ${n} = ${m + n}`, `Answer: ${B(tx(ans))}`] };
    }],
  ['Dividing powers',
    'When you divide powers of the same base, subtract the indices: aᵐ ÷ aⁿ = aᵐ⁻ⁿ. Divide any numbers in front separately.',
    (r) => {
      const B0 = idxBase(r); let m, n; do { m = r.int(4, 15); n = r.int(2, 9); } while (m <= n || m > B0.max + 3);
      const coef = !B0.num && r.chance(0.5); const c2 = coef ? r.int(2, 5) : 1, c1 = coef ? c2 * r.int(2, 6) : 1;
      const ans = (coef ? c1 / c2 : '') + powT(B0.b, m - n);
      const q = coef ? `${c1}${tx(B0.b)}<sup>${m}</sup> ÷ ${c2}${tx(B0.b)}<sup>${n}</sup>` : `${powH(B0.b, m)} ÷ ${powH(B0.b, n)}`;
      return { html: `Simplify ${B(q)}${B0.num ? `, giving your answer as a power of ${B0.b}` : ''}.`, ...eAns(ans), format: 'Use ^ for powers, e.g. ' + (B0.num ? '5^3' : 'x^3'), hint: 'Same base, dividing → subtract the powers.',
        steps: [...(coef ? [`Divide the numbers: ${c1} ÷ ${c2} = ${c1 / c2}`] : []), `Subtract the indices: ${m} − ${n} = ${m - n}`, `Answer: ${B(tx(ans))}`] };
    }],
  ['Power of a power',
    'When you raise a power to another power, multiply the indices: (aᵐ)ⁿ = aᵐⁿ. Any number inside the bracket is raised to the power too.',
    (r) => {
      const B0 = idxBase(r); let m, n; do { m = r.int(2, 6); n = r.int(2, 4); } while (m * n > B0.max);
      const coef = !B0.num && r.chance(0.5); const c = coef ? r.int(2, 5) : 1;
      const ans = (coef ? c ** n : '') + powT(B0.b, m * n);
      const q = `(${coef ? c : ''}${powH(B0.b, m)})<sup>${n}</sup>`;
      return { html: `Simplify ${B(q)}${B0.num ? `, giving your answer as a power of ${B0.b}` : ''}.`, ...eAns(ans), format: 'Use ^ for powers, e.g. ' + (B0.num ? '2^12' : 'x^12'), hint: 'Power of a power → multiply the indices.',
        steps: [...(coef ? [`${c}<sup>${n}</sup> = ${c ** n}`] : []), `Multiply the indices: ${m} × ${n} = ${m * n}`, `Answer: ${B(tx(ans))}`] };
    }],
  ['Combining the laws & the zero index',
    'Work through one law at a time: simplify the top by adding indices, then divide by subtracting. Anything to the power 0 equals 1 (a⁰ = 1).',
    (r) => {
      const v = r.pick(['x', 'a', 'y', 'n']); const p = r.int(2, 8), q = r.int(2, 8); const s = r.chance(0.25) ? p + q : r.int(2, p + q - 1);
      const e = p + q - s; const ans = e === 0 ? '1' : powT(v, e);
      return { html: `Simplify ${B(frac(`${powH(v, p)} × ${powH(v, q)}`, powH(v, s)))}`, ...eAns(ans), format: 'Use ^ for powers, e.g. x^5', hint: 'Simplify the top first, then divide.',
        steps: [`Top: ${powH(v, p)} × ${powH(v, q)} = ${powH(v, p + q)}`, `Divide: ${powH(v, p + q)} ÷ ${powH(v, s)} = ${tx(v)}<sup>${p + q} − ${s}</sup> = ${powH(v, e)}`, e === 0 ? `Anything to the power 0 is 1, so the answer is ${B('1')}` : `Answer: ${B(tx(ans))}`] };
    }],
]);

topic('y9-expanding-double', 'algebra', 9, 1, 'FH', 'Expanding Double Brackets', 'Expand products of two binomials and perfect squares.', [
  ['Expanding (x + a)(x + b)',
    'Multiply every term in the first bracket by every term in the second (FOIL: First, Outer, Inner, Last), then collect the like terms.',
    (r) => {
      const a = r.nz(-9, 9), b = r.nz(-9, 9); const ans = quad(1, a + b, a * b);
      return { html: `Expand and simplify ${B(tx(`(${lin(1, a)})(${lin(1, b)})`))}`, ...eAns(ans, { form: 'expanded' }), hint: 'Four multiplications: x·x, x·b, a·x, a·b.',
        steps: [`${tx('x*x=x^2')}, &nbsp; ${tx('x')} × ${br(b)} = ${tx(coefT(b, 'x'))}, &nbsp; ${ds(a)} × ${tx('x')} = ${tx(coefT(a, 'x'))}, &nbsp; ${ds(a)} × ${br(b)} = ${ds(a * b)}`, `Collect the x terms: ${tx(polyT([[a, 'x'], [b, 'x']]))} = ${a + b === 0 ? '0' : tx(coefT(a + b, 'x'))}`, `Answer: ${B(tx(ans))}`] };
    }],
  ['Expanding (px + a)(qx + b)',
    'Expand in the same way — every term times every term. Multiply the numbers in front of x as well: 2x × 3x = 6x².',
    (r) => {
      let p, q; do { p = r.int(1, 5); q = r.int(1, 5); } while (p === 1 && q === 1); const a = r.nz(-9, 9), b = r.nz(-9, 9);
      const ans = quad(p * q, p * b + a * q, a * b);
      return { html: `Expand and simplify ${B(tx(`(${lin(p, a)})(${lin(q, b)})`))}`, ...eAns(ans, { form: 'expanded' }), hint: 'Use a grid or FOIL, then collect the x terms.',
        steps: [`${tx(coefT(p, 'x'))} × ${tx(coefT(q, 'x'))} = ${tx(coefT(p * q, 'x^2'))}, &nbsp; ${tx(coefT(p, 'x'))} × ${br(b)} = ${tx(coefT(p * b, 'x'))}, &nbsp; ${ds(a)} × ${tx(coefT(q, 'x'))} = ${tx(coefT(a * q, 'x'))}, &nbsp; ${ds(a)} × ${br(b)} = ${ds(a * b)}`, `Collect the x terms: ${tx(polyT([[p * b, 'x'], [a * q, 'x']]))} = ${p * b + a * q === 0 ? '0' : tx(coefT(p * b + a * q, 'x'))}`, `Answer: ${B(tx(ans))}`] };
    }],
  ['Squaring a bracket',
    '(x + a)² means (x + a)(x + a). Expand it fully — it is NOT x² + a². The result is x² + 2ax + a².',
    (r) => {
      const a = r.nz(-10, 10); const v = r.pick(['x', 'x', 'y', 'n', 't', 'p']); const ans = quad(1, 2 * a, a * a, v);
      return { html: `Expand and simplify ${B(tx(`(${lin(1, a, v)})^2`))}`, ...eAns(ans, { form: 'expanded' }), hint: 'Write it as two brackets multiplied together.',
        steps: [`${tx(`(${lin(1, a, v)})^2`)} = ${tx(`(${lin(1, a, v)})(${lin(1, a, v)})`)}`, `= ${tx(polyT([[1, v + '^2'], [a, v], [a, v], [a * a, '']]))}`, `= ${B(tx(ans))}`] };
    }],
]);

topic('y9-factorising', 'algebra', 9, 1, 'FH', 'Factorising', 'Factorise expressions by taking out the highest common factor.', [
  ['Factorising numbers out',
    'Find the highest common factor (HCF) of the terms and write it outside a bracket. Divide each term by the HCF to find what goes inside. Check by expanding.',
    (r) => {
      let g, c, d; do { g = r.int(2, 9); c = r.int(1, 9); d = r.nz(-12, 12); } while (gcd(c, d) !== 1 || c === 0);
      const v = r.pick(['x', 'a', 'y', 'n']); const q = lin(g * c, g * d, v); const ans = `${g}(${lin(c, d, v)})`;
      return { html: `Factorise fully ${B(tx(q))}`, ...eAns(ans, { form: 'factored', outer: String(g) }), format: 'Type your answer with a bracket, e.g. 3(2x+5)', hint: `What is the highest number that divides ${g * c} and ${Math.abs(g * d)}?`,
        steps: [`The HCF of ${g * c} and ${Math.abs(g * d)} is ${g}.`, `${tx(coefT(g * c, v))} ÷ ${g} = ${tx(coefT(c, v))} and ${ds(g * d)} ÷ ${g} = ${ds(d)}`, `Answer: ${B(tx(ans))}`] };
    }],
  ['Factorising with letters',
    'The HCF can include letters as well as numbers. For 6x² + 9x the HCF is 3x, because both terms contain 3 and x. Take it outside the bracket.',
    (r) => {
      let g, c, d; do { g = r.int(1, 8); c = r.int(1, 7); d = r.nz(-11, 11); } while (gcd(c, d) !== 1);
      const v = r.pick(['x', 'y', 'a']); const out = coefT(g, v); const q = polyT([[g * c, v + '^2'], [g * d, v]]); const ans = `${out}(${lin(c, d, v)})`;
      return { html: `Factorise fully ${B(tx(q))}`, ...eAns(ans, { form: 'factored', outer: out }), format: 'Type your answer with a bracket, e.g. 3x(2x+5)', hint: `Both terms contain ${v}.`,
        steps: [`The HCF of ${tx(coefT(g * c, v + '^2'))} and ${tx(coefT(Math.abs(g * d), v))} is ${tx(out)}.`, `${tx(coefT(g * c, v + '^2'))} ÷ ${tx(out)} = ${tx(coefT(c, v))} and ${tx(coefT(g * d, v))} ÷ ${tx(out)} = ${ds(d)}`, `Answer: ${B(tx(ans))}`] };
    }],
  ['Factorising with two letters',
    'Look for a common number AND common letters in every term. The HCF goes outside; what is left of each term goes inside the bracket.',
    (r) => {
      const [u, v] = r.pick([['x', 'y'], ['a', 'b'], ['p', 'q'], ['m', 'n']]); let g, c, d; do { g = r.int(2, 8); c = r.int(1, 7); d = r.nz(-9, 9); } while (gcd(c, d) !== 1);
      const withLetter = r.chance(0.6); const out = withLetter ? `${g}${u}` : `${g}`;
      const q = withLetter ? polyT([[g * c, u + v], [g * d, u]]) : polyT([[g * c, u], [g * d, v]]);
      const inner = withLetter ? lin(c, d, v) : polyT([[c, u], [d, v]]); const ans = `${out}(${inner})`;
      return { html: `Factorise fully ${B(tx(q))}`, ...eAns(ans, { form: 'factored', outer: out }), format: 'Type your answer with a bracket, e.g. 2a(3b+4)', hint: 'Look for the biggest number and any letters that are in both terms.',
        steps: [`The highest common factor is ${tx(out)}.`, `Divide each term by ${tx(out)} to get ${tx(inner)}.`, `Answer: ${B(tx(ans))}`] };
    }],
]);

topic('y9-equations-both-sides', 'algebra', 9, 1, 'FH', 'Equations with Unknowns on Both Sides', 'Solve linear equations with brackets and with the unknown on both sides.', [
  ['Unknowns on both sides',
    'Get all the x terms on one side by subtracting the smaller x term from both sides. Then solve the two-step equation that is left.',
    (r) => {
      let a, c; do { a = r.int(2, 11); c = r.int(1, 10); } while (a === c); const x = r.nz(-8, 12), b = r.nz(-15, 15); const d = (a - c) * x + b;
      const big = a > c; const lhs = lin(a, b), rhs = lin(c, d);
      return { html: `Solve ${B(tx(`${lhs}=${rhs}`))}`, answerLabel: 'x =', ...nAns(x), hint: `Subtract ${tx(coefT(Math.min(a, c), 'x'))} from both sides first.`,
        steps: big ? [`Subtract ${tx(coefT(c, 'x'))} from both sides: ${tx(`${lin(a - c, b)}=${d}`)}`, `${b > 0 ? 'Subtract' : 'Add'} ${Math.abs(b)}: ${tx(`${coefT(a - c, 'x')}=${d - b}`)}`, ...(a - c === 1 ? [] : [`Divide by ${a - c}: <i>x</i> = ${B(ds(x))}`])]
          : [`Subtract ${tx(coefT(a, 'x'))} from both sides: ${tx(`${b}=${lin(c - a, d)}`)}`, `${d > 0 ? 'Subtract' : 'Add'} ${Math.abs(d)}: ${tx(`${b - d}=${coefT(c - a, 'x')}`)}`, ...(c - a === 1 ? [] : [`Divide by ${c - a}: <i>x</i> = ${B(ds(x))}`])] };
    }],
  ['Equations with brackets',
    'Either expand the bracket first, or divide both sides by the number outside the bracket. Then solve as normal.',
    (r) => {
      const a = r.int(2, 9), b = r.nz(-9, 9); let x; do { x = r.nz(-8, 12); } while (x + b === 0); const c = a * (x + b);
      return { html: `Solve ${B(tx(`${a}(${lin(1, b)})=${c}`))}`, answerLabel: 'x =', ...nAns(x), hint: 'Expand the bracket, or divide both sides by the number outside.',
        steps: [`Expand: ${tx(`${lin(a, a * b)}=${c}`)}`, `${b > 0 ? 'Subtract' : 'Add'} ${Math.abs(a * b)}: ${tx(`${a}x=${c - a * b}`)}`, `Divide by ${a}: <i>x</i> = ${B(ds(x))}`] };
    }],
  ['Brackets and unknowns on both sides',
    'Expand any brackets first. Then collect the x terms on one side and the numbers on the other, and divide.',
    (r) => {
      let a, c; do { a = r.int(2, 7); c = r.int(1, 9); } while (a === c); const b = r.nz(-8, 8), x = r.nz(-8, 10); const d = a * (x + b) - c * x;
      const k = a - c;
      return { html: `Solve ${B(tx(`${a}(${lin(1, b)})=${lin(c, d)}`))}`, answerLabel: 'x =', ...nAns(x), hint: 'Expand first, then get the x terms together.',
        steps: [`Expand: ${tx(`${lin(a, a * b)}=${lin(c, d)}`)}`, `Subtract ${tx(coefT(c, 'x'))} from both sides: ${tx(`${lin(k, a * b)}=${d}`)}`, `${a * b > 0 ? 'Subtract' : 'Add'} ${Math.abs(a * b)}: ${tx(`${coefT(k, 'x')}=${d - a * b}`)}`, ...(k === 1 ? [] : [`Divide by ${ds(k)}: <i>x</i> = ${B(ds(x))}`])] };
    }],
]);

topic('y9-pythagoras', 'geometry', 9, 1, 'FH', "Pythagoras' Theorem", 'Find missing sides in right-angled triangles and distances between points.', [
  ['Finding the hypotenuse',
    "In a right-angled triangle, a² + b² = c², where c is the hypotenuse (the longest side, opposite the right angle). Square the two shorter sides, add, then square root.",
    (r) => {
      const a = r.int(3, 20), b = r.int(3, 20); const c = Math.sqrt(a * a + b * b); const u = r.pick(['cm', 'm', 'mm']); const exact = Number.isInteger(c);
      return { html: `${r.pick(['The diagram shows a right-angled triangle.', 'Here is a right-angled triangle.', 'A right-angled triangle is drawn below.'])} The two shorter sides are ${a} ${u} and ${b} ${u}. Work out the length of the hypotenuse ${B('<i>x</i>')}. ${exact ? '' : 'Give your answer to 1 decimal place.'}`, diagram: rtSvg({ v: `${a} ${u}`, hz: `${b} ${u}`, hyp: 'x', hi: 'hyp' }), answerLabel: 'x =', unit: u, ...(exact ? nAns(c, { unit: u }) : nAns(c, { dp: 1, unit: u })), format: exact ? 'Type a number' : dpFmt(1), hint: 'Hypotenuse: square, add, square root.',
        steps: [`x<sup>2</sup> = ${a}<sup>2</sup> + ${b}<sup>2</sup> = ${a * a} + ${b * b} = ${a * a + b * b}`, `x = ${sq(a * a + b * b)} = ${exact ? c : fx(c, 4) + '…'}`, `x = ${B(exact ? c : r1(c))} ${u}`] };
    }],
  ['Finding a shorter side',
    'To find a shorter side, rearrange: a² = c² − b². Square the hypotenuse, subtract the square of the other side, then square root.',
    (r) => {
      const c = r.int(6, 25), b = r.int(2, c - 1); const a = Math.sqrt(c * c - b * b); const u = r.pick(['cm', 'm']); const exact = Number.isInteger(a);
      return { html: `${r.pick(['The diagram shows a right-angled triangle.', 'Here is a right-angled triangle.', 'A right-angled triangle is drawn below.'])} The hypotenuse is ${c} ${u} and one of the shorter sides is ${b} ${u}. Work out the length of side ${B('<i>x</i>')}. ${exact ? '' : 'Give your answer to 1 decimal place.'}`, diagram: rtSvg({ v: 'x', hz: `${b} ${u}`, hyp: `${c} ${u}`, hi: 'v' }), answerLabel: 'x =', unit: u, ...(exact ? nAns(a, { unit: u }) : nAns(a, { dp: 1, unit: u })), format: exact ? 'Type a number' : dpFmt(1), hint: 'Shorter side: square, subtract, square root.',
        steps: [`x<sup>2</sup> = ${c}<sup>2</sup> − ${b}<sup>2</sup> = ${c * c} − ${b * b} = ${c * c - b * b}`, `x = ${sq(c * c - b * b)} = ${exact ? a : fx(a, 4) + '…'}`, `x = ${B(exact ? a : r1(a))} ${u}`] };
    }],
  ['Distance between two points',
    'Draw a right-angled triangle between the points. The horizontal side is the difference in x, the vertical side is the difference in y. Then use Pythagoras.',
    (r) => {
      let x1, y1, x2, y2; do { x1 = r.int(-5, 5); y1 = r.int(-5, 5); x2 = r.int(-5, 5); y2 = r.int(-5, 5); } while (x1 === x2 || y1 === y2);
      const dx = Math.abs(x2 - x1), dy = Math.abs(y2 - y1); const d = Math.hypot(dx, dy); const exact = Number.isInteger(d);
      return { html: `Point A is at ${B(`(${ds(x1)}, ${ds(y1)})`)} and point B is at ${B(`(${ds(x2)}, ${ds(y2)})`)}. Work out the length of AB. ${exact ? '' : 'Give your answer to 1 decimal place.'}`, diagram: gridSvg([{ x: x1, y: y1, label: 'A' }, { x: x2, y: y2, label: 'B' }], null), unit: 'units', ...(exact ? nAns(d) : nAns(d, { dp: 1 })), format: exact ? 'Type a number' : dpFmt(1), hint: 'Find the horizontal and vertical distances first.',
        steps: [`Horizontal distance = ${dx}, vertical distance = ${dy}`, `AB<sup>2</sup> = ${dx}<sup>2</sup> + ${dy}<sup>2</sup> = ${dx * dx + dy * dy}`, `AB = ${sq(dx * dx + dy * dy)} = ${B(exact ? d : r1(d))}`] };
    }],
]);

topic('y9-standard-form', 'number', 9, 2, 'FH', 'Standard Form', 'Convert to and from standard form, and calculate with numbers in standard form.', [
  ['Writing numbers in standard form',
    'Standard form is A × 10ⁿ where 1 ≤ A < 10. Move the decimal point until you have a number between 1 and 10; n is how many places it moved (negative for small numbers).',
    (r) => {
      const m = r.pick([r.int(11, 99) / 10, r.int(101, 999) / 100, r.int(2, 9)]); const e = r.pick([2, 3, 4, 5, 6, 7, -1, -2, -3, -4, -5]); const v = Number(`${m}e${e}`);
      return { html: `Write ${B(ds(v))} in standard form.`, answer: `${m}×10^${e}`, check: { type: 'number', value: v, sf: true, tol: Math.abs(v) * 1e-9 }, answerHtml: B(`${m} × 10<sup>${ds(e)}</sup>`), format: 'Type it like 3.2×10^5 (or 3.2x10^5, or 3.2e5)', hint: 'Make a number between 1 and 10, then count how far the decimal point moved.',
        steps: [`The number between 1 and 10 is ${m}.`, `The decimal point moves ${Math.abs(e)} place${Math.abs(e) > 1 ? 's' : ''} ${e > 0 ? '(the number is large, so the power is positive)' : '(the number is small, so the power is negative)'}.`, `${ds(v)} = ${B(`${m} × 10<sup>${ds(e)}</sup>`)}`] };
    }],
  ['Converting from standard form',
    'Multiplying by 10ⁿ moves the digits n places to the left (the number gets bigger). For a negative power, move them to the right (the number gets smaller).',
    (r) => {
      const m = r.pick([r.int(11, 99) / 10, r.int(101, 999) / 100, r.int(2, 9)]); const e = r.pick([2, 3, 4, 5, 6, -1, -2, -3, -4]); const v = Number(`${m}e${e}`);
      return { html: `Write ${B(`${m} × 10<sup>${ds(e)}</sup>`)} as an ordinary number.`, ...nAns(v), answerHtml: B(ds(v)), hint: e > 0 ? 'The power is positive, so the number is big.' : 'The power is negative, so the number is less than 1.',
        steps: [`Move the decimal point ${Math.abs(e)} place${Math.abs(e) > 1 ? 's' : ''} to the ${e > 0 ? 'right' : 'left'}.`, `${m} × 10<sup>${ds(e)}</sup> = ${B(ds(v))}`] };
    }],
  ['Calculating in standard form',
    'To multiply, multiply the front numbers and add the powers of 10. To divide, divide the front numbers and subtract the powers. If the front number is not between 1 and 10, adjust it.',
    (r) => {
      const A = r.int(11, 49), Bm = r.int(11, 49); const m = r.int(-4, 8), n = r.int(-4, 8); const a = A / 10, b = Bm / 10;
      let p = A * Bm / 100, e = m + n; const raw = p; let adj = false; if (p >= 10) { p = p / 10; e += 1; adj = true; }
      const pS = ps(p); const v = Number(`${pS}e${e}`);
      if (r.chance()) {
        return { html: `Work out ${B(`(${a} × 10<sup>${ds(m)}</sup>) × (${b} × 10<sup>${ds(n)}</sup>)`)}. Give your answer in standard form.`, answer: `${pS}×10^${e}`, check: { type: 'number', value: v, sf: true, tol: Math.abs(v) * 1e-9 }, answerHtml: B(`${pS} × 10<sup>${ds(e)}</sup>`), format: 'Type it like 3.2×10^5 (or 3.2e5)', hint: 'Multiply the numbers, add the powers.',
          steps: [`Multiply the front numbers: ${a} × ${b} = ${ps(raw)}`, `Add the powers: 10<sup>${ds(m)}</sup> × 10<sup>${ds(n)}</sup> = 10<sup>${ds(m + n)}</sup>`, adj ? `${ps(raw)} is not between 1 and 10: ${ps(raw)} × 10<sup>${ds(m + n)}</sup> = ${B(`${pS} × 10<sup>${ds(e)}</sup>`)}` : `Answer: ${B(`${pS} × 10<sup>${ds(e)}</sup>`)}`] };
      }
      // division: (p×10^e) ÷ (b×10^n) = a×10^m
      return { html: `Work out ${B(`(${pS} × 10<sup>${ds(e)}</sup>) ÷ (${b} × 10<sup>${ds(n)}</sup>)`)}. Give your answer in standard form.`, answer: `${a}×10^${m}`, check: { type: 'number', value: Number(`${a}e${m}`), sf: true, tol: Math.abs(Number(`${a}e${m}`)) * 1e-9 }, answerHtml: B(`${a} × 10<sup>${ds(m)}</sup>`), format: 'Type it like 3.2×10^5 (or 3.2e5)', hint: 'Divide the numbers, subtract the powers.',
        steps: [`Divide the front numbers: ${pS} ÷ ${b} = ${ps(p / b)}`, `Subtract the powers: ${ds(e)} − ${br(n)} = ${ds(e - n)}`, adj ? `${ps(p / b)} × 10<sup>${ds(e - n)}</sup> = ${B(`${a} × 10<sup>${ds(m)}</sup>`)}` : `Answer: ${B(`${a} × 10<sup>${ds(m)}</sup>`)}`] };
    }],
]);

topic('y9-percentage-change', 'number', 9, 2, 'FH', 'Percentage Change', 'Increase and decrease by a percentage, and find percentage change, using multipliers.', [
  ['Increase or decrease by a percentage',
    'Use a multiplier. To increase by 15%, multiply by 1.15 (100% + 15%). To decrease by 15%, multiply by 0.85 (100% − 15%).',
    (r) => {
      const p = r.pick([2, 3, 4, 5, 8, 10, 12, 15, 20, 25, 30, 35, 40, 17.5]); const A = 5 * r.int(4, 120); const up = r.chance(); const mult = up ? 1 + p / 100 : 1 - p / 100; const v = A * (up ? 100 + p : 100 - p) / 100;
      const ctx = up ? `A price of ${B(money(A))} is increased by ${B(ps(p) + '%')}. What is the new price?` : `A coat costs ${B(money(A))}. In a sale the price is reduced by ${B(ps(p) + '%')}. What is the sale price?`;
      return { html: ctx, ...nAns(v, { money: true }), format: 'Type the amount in pounds, e.g. 45.60', hint: `The multiplier is ${ps(mult)}.`,
        steps: [`Multiplier = 100% ${up ? '+' : '−'} ${ps(p)}% = ${ps(up ? 100 + p : 100 - p)}% = ${ps(mult)}`, `${money(A)} × ${ps(mult)} = ${B(money(v))}`] };
    }],
  ['Percentage change',
    'Percentage change = (change ÷ original) × 100. Always divide by the ORIGINAL amount, not the new one.',
    (r) => {
      let O, p; do { O = r.pick([20, 25, 40, 50, 60, 80, 120, 150, 160, 200, 240, 250, 400, 500, 800]); p = r.pick([5, 10, 12, 15, 20, 25, 30, 35, 40, 45, 60, 75]); } while ((O * p) % 100);
      const up = r.chance(); const N = O + (up ? 1 : -1) * O * p / 100; const ch = Math.abs(N - O);
      return { html: `The price of a bike ${up ? 'rose' : 'fell'} from ${B(money(O))} to ${B(money(N))}. Work out the percentage ${up ? 'increase' : 'decrease'}.`, unit: '%', ...nAns(p, { unit: '%' }), hint: 'Change ÷ original × 100.',
        steps: [`Change = ${money(Math.max(N, O))} − ${money(Math.min(N, O))} = ${money(ch)}`, `Percentage ${up ? 'increase' : 'decrease'} = ${ps(ch)} ÷ ${O} × 100`, `= ${B(p + '%')}`] };
    }],
  ['Percentage multipliers',
    'A percentage change can be written as a single decimal multiplier: an increase of p% is 1 + p/100, a decrease of p% is 1 − p/100.',
    (r) => {
      const p = r.pick([1, 2, 3, 4, 5, 6, 7, 8, 9, 11, 12, 15, 17.5, 18, 20, 22, 25, 30, 35, 40, 45, 60, 75, 2.5, 0.5]); const up = r.chance(); const m = up ? (100 + p) / 100 : (100 - p) / 100;
      return { html: `Write down the decimal multiplier that ${B(up ? `increases an amount by ${ps(p)}%` : `decreases an amount by ${ps(p)}%`)}.`, ...nAns(m), hint: 'Start from 100% and add or subtract.',
        steps: [`100% ${up ? '+' : '−'} ${ps(p)}% = ${ps(up ? 100 + p : 100 - p)}%`, `${ps(up ? 100 + p : 100 - p)}% as a decimal = ${B(ps(m))}`] };
    }],
]);

topic('y9-inequalities', 'algebra', 9, 2, 'FH', 'Linear Inequalities', 'Solve linear inequalities and list integer solutions.', [
  ['Solving inequalities',
    'Solve an inequality just like an equation: do the same to both sides. Keep the inequality sign the same way round (as long as you do not multiply or divide by a negative).',
    (r) => {
      const op = r.pick(['<', '>', '<=', '>=']); const a = r.int(2, 9), k = r.nz(-8, 12), b = r.nz(-15, 15); const c = a * k + b;
      return { html: `Solve ${B(`${tx(lin(a, b))} ${OPH[op]} ${ds(c)}`)}`, answer: `x${op}${ps(k)}`, check: { type: 'text', accept: ineqAccept(op, k) }, answerHtml: B(ineqHtml(op, k)), format: 'Type e.g. x>3 or x<=-2 (you can use ≤ and ≥)', hint: `${b > 0 ? 'Subtract' : 'Add'} ${Math.abs(b)}, then divide by ${a}.`,
        steps: [`${b > 0 ? 'Subtract' : 'Add'} ${Math.abs(b)} ${b > 0 ? 'from' : 'to'} both sides: ${tx(`${a}x`)} ${OPH[op]} ${ds(c - b)}`, `Divide both sides by ${a}: ${B(ineqHtml(op, k))}`] };
    }],
  ['Inequalities with a negative x term',
    'If you multiply or divide both sides by a negative number, you must reverse the inequality sign. Alternatively, add the x term to both sides to keep it positive.',
    (r) => {
      const op = r.pick(['<', '>', '<=', '>=']); const a = r.int(2, 7), k = r.nz(-8, 10), b = r.int(1, 20); const c = b - a * k; const res = FLIP[op];
      return { html: `Solve ${B(`${ds(b)} − ${tx(coefT(a, 'x'))} ${OPH[op]} ${ds(c)}`)}`, answer: `x${res}${ps(k)}`, check: { type: 'text', accept: ineqAccept(res, k) }, answerHtml: B(ineqHtml(res, k)), format: 'Type e.g. x>3 or x<=-2', hint: 'Dividing by a negative reverses the sign.',
        steps: [`Subtract ${b} from both sides: ${tx(coefT(-a, 'x'))} ${OPH[op]} ${ds(c - b)}`, `Divide both sides by −${a} and reverse the sign: <i>x</i> ${OPH[res]} ${ds((c - b) / -a)}`, `Answer: ${B(ineqHtml(res, k))}`] };
    }],
  ['Double inequalities',
    'With two inequality signs, do the same operation to all three parts. Subtract or add first, then divide.',
    (r) => {
      const op1 = r.pick(['<', '<=']), op2 = r.pick(['<', '<=']); const a = r.int(2, 6), b = r.nz(-9, 9); const k1 = r.int(-6, 3), k2 = k1 + r.int(2, 8);
      const L = a * k1 + b, U = a * k2 + b; const ans = `${ps(k1)}${op1}x${op2}${ps(k2)}`;
      return { html: `Solve ${B(`${ds(L)} ${OPH[op1]} ${tx(lin(a, b))} ${OPH[op2]} ${ds(U)}`)}`, answer: ans, check: { type: 'text', accept: [ans] }, answerHtml: B(`${ds(k1)} ${OPH[op1]} <i>x</i> ${OPH[op2]} ${ds(k2)}`), format: 'Type e.g. -2<x<=5', hint: 'Do the same thing to all three parts.',
        steps: [`${b > 0 ? 'Subtract' : 'Add'} ${Math.abs(b)} in all three parts: ${ds(L - b)} ${OPH[op1]} ${tx(`${a}x`)} ${OPH[op2]} ${ds(U - b)}`, `Divide all three parts by ${a}: ${B(`${ds(k1)} ${OPH[op1]} <i>x</i> ${OPH[op2]} ${ds(k2)}`)}`] };
    }],
  ['Integer solutions',
    'Solve the inequality first, then list the whole numbers (integers) that fit. Check the ends: < means the end value is NOT included, ≤ means it is.',
    (r) => {
      const op1 = r.pick(['<', '<=']), op2 = r.pick(['<', '<=']); const a = r.int(2, 5), b = r.nz(-7, 7); const k1 = r.int(-5, 2), k2 = k1 + r.int(3, 6);
      const L = a * k1 + b, U = a * k2 + b; const ints = []; for (let i = k1; i <= k2; i++) { if ((op1 === '<' ? i > k1 : i >= k1) && (op2 === '<' ? i < k2 : i <= k2)) ints.push(i); }
      const ans = ints.join(', ');
      return { html: `${B('<i>n</i>')} is an integer. List all the values of <i>n</i> such that ${B(`${ds(L)} ${OPH[op1]} ${tx(lin(a, b, 'n'))} ${OPH[op2]} ${ds(U)}`)}`, answer: ans, check: { type: 'text', accept: [ints.join(','), ints.join(';')] }, answerHtml: B(ints.map((v) => ds(v)).join(', ')), format: 'List them in order, separated by commas, e.g. -1, 0, 1, 2', hint: 'Solve it first, then check the end values carefully.',
        steps: [`${b > 0 ? 'Subtract' : 'Add'} ${Math.abs(b)}: ${ds(L - b)} ${OPH[op1]} ${tx(`${a}n`)} ${OPH[op2]} ${ds(U - b)}`, `Divide by ${a}: ${ds(k1)} ${OPH[op1]} <i>n</i> ${OPH[op2]} ${ds(k2)}`, `Integers: ${B(ints.map((v) => ds(v)).join(', '))}`] };
    }],
]);

topic('y9-straight-line-graphs', 'algebra', 9, 2, 'FH', 'Straight-Line Graphs', 'Gradients, intercepts and equations of straight lines (y = mx + c).', [
  ['Gradient between two points',
    'Gradient = change in y ÷ change in x (“rise over run”). Subtract the y-coordinates and the x-coordinates in the same order.',
    (r) => {
      let x1, y1, x2, y2; do { x1 = r.int(-5, 5); y1 = r.int(-5, 5); x2 = r.int(-5, 5); y2 = r.int(-5, 5); } while (x1 === x2 || y1 === y2 || Math.abs(x2 - x1) < 2);
      const dy = y2 - y1, dx = x2 - x1; const [n, d] = simp(dy, dx); const m = dy / dx;
      return { html: `Find the gradient of the straight line through ${B(`(${ds(x1)}, ${ds(y1)})`)} and ${B(`(${ds(x2)}, ${ds(y2)})`)}.`, diagram: gridSvg([{ x: x1, y: y1 }, { x: x2, y: y2 }], { m, c: y1 - m * x1 }), answer: d === 1 ? `${n}` : `${n}/${d}`, check: { type: 'fraction', num: n, den: d }, answerHtml: B(fracN(n, d)), format: 'Type a whole number, fraction or decimal, e.g. 2, -3/4 or 0.5', hint: 'Change in y ÷ change in x.',
        steps: [`Change in y = ${ds(y2)} − ${br(y1)} = ${ds(dy)}`, `Change in x = ${ds(x2)} − ${br(x1)} = ${ds(dx)}`, `Gradient = ${fracN(dy, dx)}${(d !== dx || n !== dy) ? ` = ${B(fracN(n, d))}` : ''}`.replace(/(<b>.*)$/, '$1') + (d === dx && n === dy ? '' : '')] };
    }],
  ['Gradient & intercept from an equation',
    'In y = mx + c, m is the gradient and c is the y-intercept (where the line crosses the y-axis). Rearrange the equation into this form first if necessary.',
    (r) => {
      const m = r.nz(-6, 6), c = r.nz(-9, 9); const k = r.chance(0.4) ? r.int(2, 4) : 1; const askM = r.chance();
      const eq = k === 1 ? `y=${lin(m, c)}` : `${k}y=${lin(k * m, k * c)}`;
      return { html: `A straight line has equation ${B(tx(eq))}. Write down ${askM ? 'its gradient' : 'the y-coordinate of its y-intercept'}.`, ...nAns(askM ? m : c), hint: k > 1 ? `Divide everything by ${k} to get y on its own.` : 'Compare with y = mx + c.',
        steps: [...(k > 1 ? [`Divide by ${k}: ${tx(`y=${lin(m, c)}`)}`] : []), `Compare with y = mx + c: m = ${ds(m)}, c = ${ds(c)}`, `${askM ? 'Gradient' : 'y-intercept'} = ${B(ds(askM ? m : c))}`] };
    }],
  ['Equation of a line through two points',
    'Find the gradient m from the two points. Then substitute one point into y = mx + c to find c. Write the equation as y = mx + c.',
    (r) => {
      const m = r.nz(-4, 4), c = r.int(-6, 6); let x1, x2; do { x1 = r.int(-3, 3); x2 = r.int(-3, 3); } while (x1 === x2 || Math.abs(m * x1 + c) > 6 || Math.abs(m * x2 + c) > 6);
      const y1 = m * x1 + c, y2 = m * x2 + c; const ans = lin(m, c);
      return { html: `Find the equation of the straight line that passes through ${B(`(${ds(x1)}, ${ds(y1)})`)} and ${B(`(${ds(x2)}, ${ds(y2)})`)}.`, diagram: gridSvg([{ x: x1, y: y1 }, { x: x2, y: y2 }], { m, c }), answerLabel: 'y =', ...eAns(ans, { vars: ['x'] }), format: 'Type the right-hand side, e.g. 2x-3', hint: 'Find the gradient first.',
        steps: [`Gradient m = (${ds(y2)} − ${br(y1)}) ÷ (${ds(x2)} − ${br(x1)}) = ${ds(y2 - y1)} ÷ ${ds(x2 - x1)} = ${ds(m)}`, `Substitute (${ds(x1)}, ${ds(y1)}) into ${tx(`y=${coefT(m, 'x')}+c`)}: ${ds(y1)} = ${ds(m * x1)} + c, so c = ${ds(c)}`, `Equation: ${B(tx(`y=${ans}`))}`] };
    }],
  ['Parallel lines',
    'Parallel lines have the same gradient. Use the gradient of the given line, then substitute the point to find c.',
    (r) => {
      const m = r.nz(-5, 5), c0 = r.int(-8, 8); const px = r.nz(-4, 4), py = r.int(-8, 8); const c = py - m * px; const ans = lin(m, c);
      return { html: `Find the equation of the line that is parallel to ${B(tx(`y=${lin(m, c0)}`))} and passes through the point ${B(`(${ds(px)}, ${ds(py)})`)}.`, answerLabel: 'y =', ...eAns(ans, { vars: ['x'] }), format: 'Type the right-hand side, e.g. 2x-3', hint: 'Parallel lines have the same gradient.',
        steps: [`Parallel, so the gradient is ${ds(m)}: y = ${tx(coefT(m, 'x'))} + c`, `Substitute (${ds(px)}, ${ds(py)}): ${ds(py)} = ${ds(m)} × ${br(px)} + c = ${ds(m * px)} + c, so c = ${ds(c)}`, `Equation: ${B(tx(`y=${ans}`))}`] };
    }],
]);

topic('y9-direct-proportion', 'ratio', 9, 2, 'FH', 'Direct Proportion & Best Value', 'Use the unitary method for recipes and prices; compare value for money.', [
  ['Recipes',
    'Use the unitary method: divide to find the amount for 1 person, then multiply up to the number you need.',
    (r) => {
      const u = r.pick([15, 20, 25, 30, 40, 50, 60, 75, 80, 100, 120, 150]); const n = r.pick([2, 4, 5, 6, 8]); let m; do { m = r.pick([3, 4, 6, 7, 9, 10, 12, 15]); } while (m === n);
      const ing = r.pick(['flour', 'sugar', 'butter', 'rice', 'pasta']);
      return { html: `A recipe for ${B(n + ' people')} uses ${B(u * n + ' g')} of ${ing}. How much ${ing} is needed for ${B(m + ' people')}?`, unit: 'g', ...nAns(u * m, { unit: 'g' }), hint: 'Find the amount for one person first.',
        steps: [`For 1 person: ${u * n} ÷ ${n} = ${u} g`, `For ${m} people: ${u} × ${m} = ${B(u * m)} g`] };
    }],
  ['Best value for money',
    'Work out the cost of the same amount for each option (e.g. the cost per 100 g, or the amount per £1). The cheaper cost per unit is the better value.',
    (r) => {
      let sA, sB, pA, pB, uA, uB; do { sA = r.pick([200, 250, 300, 400, 500, 750]); sB = r.pick([500, 600, 800, 1000, 1200, 1500]); uA = r.int(20, 90); uB = r.int(20, 90); pA = sA * uA / 100 / 100; pB = sB * uB / 100 / 100; } while (sA === sB || Math.abs(uA - uB) < 4 || Math.round(pA * 100) !== pA * 100 || Math.round(pB * 100) !== pB * 100);
      const best = uA < uB ? 'A' : 'B';
      return { html: `Cereal is sold in two sizes.<br>Pack A: ${B(sA + ' g')} for ${B(money(pA))}<br>Pack B: ${B(sB + ' g')} for ${B(money(pB))}<br>Which pack is better value for money?`, answer: best, check: { type: 'text', accept: [best, `pack${best}`, `pack ${best}`] }, answerHtml: B('Pack ' + best), format: 'Type A or B', hint: 'Work out the cost of 100 g in each pack.',
        steps: [`Pack A: ${money(pA)} ÷ ${sA / 100} = ${ps(uA)}p per 100 g`, `Pack B: ${money(pB)} ÷ ${sB / 100} = ${ps(uB)}p per 100 g`, `Pack ${best} is cheaper per 100 g, so ${B('Pack ' + best)} is better value.`] };
    }],
  ['Unitary method with prices',
    'If several items cost a certain amount, divide to find the cost of one item, then multiply by the number you want.',
    (r) => {
      const unitP = r.int(15, 250); const n = r.int(3, 9); let m; do { m = r.int(2, 15); } while (m === n);
      const item = r.pick(['pens', 'notebooks', 'apples', 'cans of drink', 'tickets']);
      return { html: `${B(n)} ${item} cost ${B(money(unitP * n / 100))}. How much do ${B(m)} ${item} cost?`, ...nAns(unitP * m / 100, { money: true }), format: 'Type the amount in pounds, e.g. 3.45', hint: 'Find the cost of one first.',
        steps: [`Cost of 1 = ${money(unitP * n / 100)} ÷ ${n} = ${money(unitP / 100)}`, `Cost of ${m} = ${m} × ${money(unitP / 100)} = ${B(money(unitP * m / 100))}`] };
    }],
]);

topic('y9-polygons', 'geometry', 9, 2, 'FH', 'Angles in Polygons', 'Interior and exterior angles of polygons.', [
  ['Sum of interior angles',
    'A polygon with n sides can be split into (n − 2) triangles from one corner, so the interior angles add up to (n − 2) × 180°.',
    (r) => {
      const n = r.int(4, 30); const names = { 4: 'quadrilateral', 5: 'pentagon', 6: 'hexagon', 7: 'heptagon', 8: 'octagon', 9: 'nonagon', 10: 'decagon', 11: 'hendecagon', 12: 'dodecagon' };
      if (!names[n]) names[n] = `${n}-sided polygon`;
      if (r.chance(0.4)) {
        const S = (n - 2) * 180;
        return { html: `The interior angles of a polygon add up to ${B(deg(S))}. How many sides does the polygon have?`, ...nAns(n), hint: 'Sum = (n − 2) × 180°, so divide by 180° and add 2.',
          steps: [`(n − 2) × 180° = ${deg(S)}`, `n − 2 = ${ds(S)} ÷ 180 = ${n - 2}`, `n = ${n - 2} + 2 = ${B(n)}`] };
      }
      return { html: `Work out the sum of the interior angles of a${/^[aeiou8]|^1[18]-/.test(names[n]) ? 'n' : ''} ${B(names[n])}${n <= 12 ? ` (${n} sides)` : ''}.`, diagram: n <= 12 ? polygonSvg(n) : null, unit: '°', ...nAns((n - 2) * 180, { unit: '°' }), hint: 'Sum = (n − 2) × 180°.',
        steps: [`A${/^[aeiou8]|^1[18]-/.test(names[n]) ? 'n' : ''} ${names[n]} has ${n} sides, so it splits into ${n} − 2 = ${n - 2} triangles.`, `Sum = ${n - 2} × 180° = ${B(deg((n - 2) * 180))}`] };
    }],
  ['Angles of regular polygons',
    'In a regular polygon all exterior angles are equal and add up to 360°, so each exterior angle = 360° ÷ n. Interior angle = 180° − exterior angle.',
    (r) => {
      const n = r.pick([3, 4, 5, 6, 8, 9, 10, 12, 15, 18, 20, 24, 30, 36, 40, 45, 60, 72]); const ext = 360 / n; const askExt = r.chance();
      return { html: `A regular polygon has ${B(n)} sides. Work out the size of each ${askExt ? 'exterior' : 'interior'} angle.`, diagram: n <= 12 ? polygonSvg(n, askExt ? { ext: '?' } : { int: '?' }) : null, unit: '°', ...nAns(askExt ? ext : 180 - ext, { unit: '°' }), hint: 'Exterior angles add up to 360°.',
        steps: [`Exterior angle = 360° ÷ ${n} = ${deg(ext)}`, ...(askExt ? [] : [`Interior angle = 180° − ${deg(ext)} = ${deg(180 - ext)}`]), `Answer: ${B(deg(askExt ? ext : 180 - ext))}`] };
    }],
  ['Number of sides from an angle',
    'Number of sides = 360° ÷ exterior angle. If you are given the interior angle, first find the exterior angle: 180° − interior.',
    (r) => {
      const n = r.pick([4, 5, 6, 8, 9, 10, 12, 15, 18, 20, 24, 30, 36, 40, 45, 60, 72, 90]); const ext = 360 / n; const useInt = r.chance();
      return { html: `Each ${useInt ? 'interior' : 'exterior'} angle of a regular polygon is ${B(deg(useInt ? 180 - ext : ext))}. How many sides does the polygon have?`, ...nAns(n), hint: 'n = 360° ÷ exterior angle.',
        steps: [useInt ? `Exterior angle = 180° − ${deg(180 - ext)} = ${deg(ext)}` : 'The exterior angles of any polygon add up to 360°.', `Number of sides = 360° ÷ ${deg(ext)} = ${B(n)}`] };
    }],
]);

topic('y9-speed-distance-time', 'ratio', 9, 3, 'FH', 'Speed, Distance & Time', 'Use speed = distance ÷ time, converting units of time where needed.', [
  ['Finding speed',
    'Speed = distance ÷ time. Make sure the time is in hours for km/h: 30 minutes = 0.5 hours, 15 minutes = 0.25 hours.',
    (r) => {
      const s = r.int(4, 18) * 5; const t = r.pick([0.5, 1.5, 2, 2.5, 3, 0.75, 1.25, 4]); const d = s * t;
      const tS = t >= 1 ? `${Math.floor(t)} hour${Math.floor(t) > 1 ? 's' : ''}${t % 1 ? ` ${(t % 1) * 60} minutes` : ''}` : `${t * 60} minutes`;
      return { html: `A car travels ${B(ds(d) + ' km')} in ${B(tS)}. Work out its average speed in km/h.`, unit: 'km/h', ...nAns(s, { unit: 'km/h' }), hint: 'Convert the time to hours first.',
        steps: [`${tS} = ${ps(t)} hours`, `Speed = distance ÷ time = ${ds(d)} ÷ ${ps(t)}`, `= ${B(s)} km/h`] };
    }],
  ['Finding distance',
    'Distance = speed × time. If the time is in minutes, divide by 60 to change it into hours before multiplying a speed in km/h.',
    (r) => {
      const s = 6 * r.int(5, 15); const t = r.pick([10, 15, 20, 25, 30, 40, 45, 50, 90]); const d = s * t / 60;
      return { html: `A cyclist rides at ${B(s + ' km/h')} for ${B(t + ' minutes')}. How far does she travel?`, unit: 'km', ...nAns(d, { unit: 'km' }), hint: `${t} minutes = ${t}/60 hours.`,
        steps: [`${t} minutes = ${t} ÷ 60 = ${ps(t / 60, 4)}${(t / 60) % 0.25 ? '…' : ''} hours`, `Distance = speed × time = ${s} × ${frac(t, 60)}`, `= ${B(ds(d))} km`] };
    }],
  ['Finding time',
    'Time = distance ÷ speed. This gives the time in hours; multiply the decimal part by 60 to get minutes.',
    (r) => {
      let s, t; do { s = r.pick([30, 40, 45, 48, 50, 60, 72, 80, 90]); t = r.pick([20, 30, 40, 45, 50, 75, 90, 100, 120, 135, 150]); } while ((s * t) % 30);
      const d = s * t / 60;
      return { html: `A train travels ${B(ds(d) + ' km')} at an average speed of ${B(s + ' km/h')}. How many minutes does the journey take?`, unit: 'minutes', ...nAns(t, { unit: 'minutes' }), hint: 'Time = distance ÷ speed, then convert hours to minutes.',
        steps: [`Time = ${ds(d)} ÷ ${s} = ${ps(d / s, 4)}${rnd(d / s, 4) !== d / s ? '…' : ''} hours`, `In minutes: ${frac(ds(d), s)} × 60 = ${B(t)} minutes`] };
    }],
]);

topic('y9-density', 'ratio', 9, 3, 'FH', 'Density, Mass & Volume', 'Use density = mass ÷ volume.', [
  ['Finding density',
    'Density = mass ÷ volume. With mass in grams and volume in cm³, density is in g/cm³.',
    (r) => {
      const dd = r.pick([0.8, 1.2, 2.5, 2.7, 7.8, 8.9, 11.3, 19.3, 0.6, 1.5]); const V = r.int(4, 60) * 5; const m = dd * V;
      return { html: `A block has a mass of ${B(ds(m) + ' g')} and a volume of ${B(V + ' cm³')}. Work out its density.`, unit: 'g/cm³', ...nAns(dd, { unit: 'g/cm³' }), hint: 'Density = mass ÷ volume.',
        steps: ['Density = mass ÷ volume', `= ${ds(m)} ÷ ${V}`, `= ${B(ds(dd))} g/cm³`] };
    }],
  ['Finding mass',
    'Mass = density × volume. Think of the formula triangle: M on top, D and V below.',
    (r) => {
      const dd = r.pick([0.8, 1.2, 2.5, 2.7, 7.8, 8.9, 11.3, 19.3, 0.6, 1.5]); const V = r.int(4, 80) * 5; const m = dd * V;
      return { html: `A metal has a density of ${B(ds(dd) + ' g/cm³')}. Work out the mass of ${B(V + ' cm³')} of the metal.`, unit: 'g', ...nAns(m, { unit: 'g' }), hint: 'Mass = density × volume.',
        steps: ['Mass = density × volume', `= ${ds(dd)} × ${V}`, `= ${B(ds(m))} g`] };
    }],
  ['Finding volume',
    'Volume = mass ÷ density. Check your answer makes sense: a dense material has a small volume for its mass.',
    (r) => {
      const dd = r.pick([0.8, 1.2, 2.5, 2.7, 7.8, 8.9, 11.3, 19.3, 0.6, 1.5]); const V = r.int(4, 60) * 5; const m = dd * V;
      return { html: `An object has a mass of ${B(ds(m) + ' g')}. Its density is ${B(ds(dd) + ' g/cm³')}. Work out its volume.`, unit: 'cm³', ...nAns(V, { unit: 'cm³' }), hint: 'Volume = mass ÷ density.',
        steps: ['Volume = mass ÷ density', `= ${ds(m)} ÷ ${ds(dd)}`, `= ${B(V)} cm³`] };
    }],
]);

topic('y9-volume-surface-area', 'geometry', 9, 3, 'FH', 'Volume & Surface Area', 'Volume and surface area of cuboids, prisms and cylinders.', [
  ['Volume of a cuboid',
    'Volume of a cuboid = length × width × height. Volume is measured in cubic units, such as cm³.',
    (r) => {
      const l = r.int(3, 15), w = r.int(2, 10), h = r.int(2, 12); const u = r.pick(['cm', 'm']);
      return { html: `${r.pick(['The diagram shows a cuboid.', 'A box is in the shape of a cuboid.', 'A storage container is a cuboid.', 'Here is a cuboid.'])} It is ${l} ${u} long, ${w} ${u} wide and ${h} ${u} high. Work out its volume.`, diagram: cuboidSvg(`${l} ${u}`, `${w} ${u}`, `${h} ${u}`), unit: u + '³', ...nAns(l * w * h, { unit: u + '³' }), hint: 'Multiply the three dimensions.',
        steps: ['Volume = length × width × height', `= ${l} × ${w} × ${h}`, `= ${B(l * w * h)} ${u}³`] };
    }],
  ['Surface area of a cuboid',
    'A cuboid has 6 faces in 3 matching pairs. Work out the area of the front, top and side, add them, then double.',
    (r) => {
      const l = r.int(3, 15), w = r.int(2, 10), h = r.int(2, 12); const u = r.pick(['cm', 'm']); const SA = 2 * (l * w + l * h + w * h);
      return { html: `${r.pick(['The diagram shows a cuboid.', 'A closed box is in the shape of a cuboid.', 'A wooden block is a cuboid.', 'Here is a cuboid.'])} It measures ${l} ${u} by ${w} ${u} by ${h} ${u}. Work out its total surface area.`, diagram: cuboidSvg(`${l} ${u}`, `${w} ${u}`, `${h} ${u}`), unit: u + '²', ...nAns(SA, { unit: u + '²' }), hint: 'Three different faces, each appearing twice.',
        steps: [`Front: ${l} × ${h} = ${l * h}, top: ${l} × ${w} = ${l * w}, side: ${w} × ${h} = ${w * h}`, `Sum = ${l * h} + ${l * w} + ${w * h} = ${l * h + l * w + w * h}`, `Surface area = 2 × ${l * h + l * w + w * h} = ${B(SA)} ${u}²`] };
    }],
  ['Volume of a cylinder',
    'A cylinder is a prism with a circular cross-section. Volume = πr²h (area of the circle × height).',
    (r) => {
      const rr = r.int(2, 12), h = r.int(3, 25); const u = 'cm'; const V = Math.PI * rr * rr * h;
      return { html: `A cylinder has radius ${B(rr + ' cm')} and height ${B(h + ' cm')}. Work out its volume. Give your answer to 1 decimal place.`, diagram: cylinderSvg(`${rr} cm`, `${h} cm`), unit: 'cm³', ...nAns(V, { dp: 1, unit: 'cm³' }), format: dpFmt(1), hint: 'V = πr²h.',
        steps: [`Area of circle = π × ${rr}<sup>2</sup> = ${fx(Math.PI * rr * rr, 3)}… cm²`, `Volume = ${fx(Math.PI * rr * rr, 3)}… × ${h} = ${fx(V, 3)}…`, `V = ${B(r1(V))} ${u}³`] };
    }],
  ['Volume of a triangular prism',
    'Volume of a prism = area of cross-section × length. For a triangular prism, the cross-section area is ½ × base × height.',
    (r) => {
      const b = r.int(3, 12), h = r.int(3, 12), l = r.int(5, 20); const A = b * h / 2; const V = A * l;
      return { html: `${r.pick(['The diagram shows a triangular prism.', 'A doorstop is in the shape of a triangular prism.', 'A chocolate box is a triangular prism.', 'A tent is modelled as a triangular prism.'])} The cross-section is a right-angled triangle with base ${b} cm and height ${h} cm. The prism is ${l} cm long. Work out its volume.`, diagram: prismSvg(`${b} cm`, `${h} cm`, `${l} cm`), unit: 'cm³', ...nAns(V, { unit: 'cm³' }), hint: 'Find the area of the triangle first.',
        steps: [`Area of triangle = ½ × ${b} × ${h} = ${ds(A)} cm²`, `Volume = ${ds(A)} × ${l}`, `= ${B(ds(V))} cm³`] };
    }],
]);

topic('y9-relative-frequency', 'probability', 9, 3, 'FH', 'Expected Outcomes & Relative Frequency', 'Expected number of outcomes and estimating probability from experiments.', [
  ['Expected outcomes',
    'Expected number = probability × number of trials. It is what you would expect on average, not a guarantee.',
    (r) => {
      const d = r.pick([2, 4, 5, 6, 8, 10, 20]); let n; do { n = r.int(1, d - 1); } while (gcd(n, d) !== 1); const T = d * r.int(3, 30);
      return { html: `The probability that a biased coin lands on heads is ${B(frac(n, d))}. The coin is thrown ${B(T)} times. How many times would you expect it to land on heads?`, ...nAns(T * n / d), hint: 'Multiply the probability by the number of throws.',
        steps: [`Expected = probability × number of trials`, `= ${frac(n, d)} × ${T} = ${B(T * n / d)}`] };
    }],
  ['Relative frequency',
    'Relative frequency = number of times the event happened ÷ total number of trials. It is an estimate of the probability.',
    (r) => {
      const N = r.pick([20, 25, 40, 50, 80, 100, 200, 250]); const k = r.int(1, N - 1); const rf = k / N;
      return { html: `A spinner is spun ${B(N)} times. It lands on red ${B(k)} times. Work out the relative frequency of landing on red. Give your answer as a decimal.`, ...nAns(rf), hint: 'Successes ÷ total trials.',
        steps: [`Relative frequency = ${k} ÷ ${N}`, `= ${B(ps(rf))}`] };
    }],
  ['Estimating with relative frequency',
    'Use the relative frequency from an experiment as an estimate of the probability, then multiply by the new number of trials.',
    (r) => {
      const N = r.pick([20, 25, 40, 50, 80, 100]); let k, M; do { k = r.int(2, N - 2); M = r.pick([200, 300, 400, 500, 600, 1000]); } while ((M * k) % N);
      return { html: `Jo drops a drawing pin ${B(N)} times. It lands point up ${B(k)} times. She drops the pin another ${B(M)} times. Estimate how many of these times it lands point up.`, ...nAns(M * k / N), hint: 'Find the relative frequency, then multiply.',
        steps: [`Relative frequency = ${frac(k, N)}`, `Estimate = ${frac(k, N)} × ${M} = ${B(M * k / N)}`] };
    }],
]);

topic('y9-listing-outcomes', 'probability', 9, 3, 'FH', 'Listing Outcomes & the Product Rule', 'Systematic listing, sample spaces and the product rule for counting.', [
  ['The product rule',
    'If there are m ways to make one choice and n ways to make another, there are m × n ways to make both. Extend this for three or more choices.',
    (r) => {
      const a = r.int(2, 6), b = r.int(3, 8), c = r.chance() ? r.int(2, 5) : 0;
      return { html: `A café menu has ${B(a)} starters, ${B(b)} main courses${c ? ` and ${B(c)} desserts` : ''}. A meal is one ${c ? 'starter, one main course and one dessert' : 'starter and one main course'}. How many different meals are possible?`, ...nAns(a * b * (c || 1)), hint: 'Multiply the number of choices.',
        steps: ['Use the product rule: multiply the number of options for each choice.', `${a} × ${b}${c ? ` × ${c}` : ''} = ${B(a * b * (c || 1))}`] };
    }],
  ['Sample space for two dice',
    'Two fair dice give 6 × 6 = 36 equally likely outcomes. Count the outcomes that work (a sample space grid helps) and divide by 36.',
    (r) => {
      const kind = r.int(0, 5); let target, cnt = 0; const list = [];
      const ops = [ // [description, value function, comparison]
        ['added', 'total', (a, b) => a + b, 'is'], ['multiplied', 'product', (a, b) => a * b, 'is'],
        ['added', 'total', (a, b) => a + b, 'more than'], ['added', 'total', (a, b) => a + b, 'less than'],
        ['subtracted (larger − smaller)', 'difference', (a, b) => Math.abs(a - b), 'is'], ['multiplied', 'product', (a, b) => a * b, 'more than']];
      const [verb, noun, fn, cmp] = ops[kind];
      if (kind === 0) target = r.int(2, 12); else if (kind === 1) target = r.pick([2, 3, 4, 5, 6, 8, 9, 10, 12, 15, 18, 20, 24, 30]);
      else if (kind === 2) target = r.int(3, 10); else if (kind === 3) target = r.int(4, 11); else if (kind === 4) target = r.int(0, 5); else target = r.pick([6, 8, 10, 12, 15, 18, 20, 24]);
      const test = (v) => (cmp === 'is' ? v === target : cmp === 'more than' ? v > target : v < target);
      for (let i = 1; i <= 6; i++) for (let j = 1; j <= 6; j++) if (test(fn(i, j))) { cnt++; list.push(`(${i}, ${j})`); }
      const who = r.pick(['Two fair six-sided dice are rolled', 'Amy rolls two fair dice', 'In a game, two fair six-sided dice are thrown', 'Two ordinary fair dice are rolled']);
      return { html: `${who} and the scores are ${verb}. Find the probability that the ${noun} ${cmp === 'is' ? 'is' : 'is ' + cmp} ${B(target)}.`, ...fAns(cnt, 36), hint: 'There are 36 possible outcomes — draw a sample space grid.',
        steps: [`There are 6 × 6 = 36 equally likely outcomes.`, cnt <= 8 ? `Outcomes where the ${noun} ${cmp === 'is' ? 'is' : 'is ' + cmp} ${target}: ${list.join(', ')} — ${cnt} outcomes` : `Using a sample space grid, ${cnt} outcomes have a ${noun} ${cmp === 'is' ? 'of' : cmp} ${target}.`, `P = ${frac(cnt, 36)}${gcd(cnt, 36) > 1 ? ` = ${B(fracS(cnt, 36))}` : ''}`] };
    }],
  ['Codes and arrangements',
    'For each position count how many options there are, then multiply. If items cannot be repeated, there is one fewer choice for each new position.',
    (r) => {
      const t = r.int(0, 5);
      if (t === 3) { const a = r.int(2, 6), b = r.int(3, 9), c = r.int(2, 6); const shop = r.pick(['café', 'restaurant', 'school canteen', 'pizza bar']); return { html: `A ${shop} offers ${B(a)} starters, ${B(b)} main courses and ${B(c)} desserts. A meal is one starter, one main course and one dessert. How many different meals are possible?`, ...nAns(a * b * c), hint: 'Multiply the number of choices for each course.', steps: ['Use the product rule.', `${a} × ${b} × ${c} = ${B(a * b * c)}`] }; }
      if (t === 4) { const L = r.pick([3, 4]), D = r.int(2, 4); const v = 26 ** L * 10 ** D; return { html: `A username is ${B(L)} capital letters (A–Z) followed by ${B(D)} digits (0–9). Letters and digits can be repeated. How many different usernames are possible?`, ...nAns(v), hint: '26 choices for each letter, 10 for each digit.', steps: [`Letters: ${Array(L).fill(26).join(' × ')} = ${ds(26 ** L)}`, `Digits: ${Array(D).fill(10).join(' × ')} = ${ds(10 ** D)}`, `Total = ${ds(26 ** L)} × ${ds(10 ** D)} = ${B(ds(v))}`] }; }
      if (t === 5) { const n = r.int(3, 6); const v = 9 * 10 ** (n - 1); return { html: `A PIN has ${B(n)} digits. The first digit cannot be 0, and digits can be repeated. How many different PINs are possible?`, ...nAns(v), hint: 'The first digit has only 9 choices.', steps: [`First digit: 9 choices (1–9); each other digit: 10 choices.`, `9 × ${Array(n - 1).fill(10).join(' × ')} = ${B(ds(v))}`] }; }
      if (t === 0) { const n = r.int(3, 5); return { html: `A padlock code has ${B(n)} digits, each from 0 to 9. Digits can be repeated. How many different codes are possible?`, ...nAns(10 ** n), hint: '10 choices for every digit.', steps: [`Each digit has 10 choices.`, `${Array(n).fill(10).join(' × ')} = ${B(ds(10 ** n))}`] }; }
      if (t === 1) { const L = r.int(5, 9), n = r.int(2, 4); let v = 1, fs = []; for (let i = 0; i < n; i++) { v *= L - i; fs.push(L - i); } return { html: `A code is made from ${B(n)} different letters chosen from ${B(L)} letters (no letter is used twice). How many different codes are possible?`, ...nAns(v), hint: 'One fewer choice each time.', steps: [`First letter: ${L} choices, then ${L - 1}, …`, `${fs.join(' × ')} = ${B(v)}`] }; }
      const n = r.int(3, 6); let v = 1, fs = []; for (let i = n; i >= 1; i--) { v *= i; fs.push(i); }
      return { html: `In how many different orders can ${B(n)} people stand in a line?`, ...nAns(v), hint: 'How many choices for the first place, then the second…', steps: [`First place: ${n} choices, then ${n - 1}, and so on.`, `${fs.join(' × ')} = ${B(v)}`] };
    }],
]);

topic('y9-frequency-tables', 'statistics', 9, 3, 'FH', 'Averages from Frequency Tables', 'Mean, median and averages from frequency tables and bar charts.', [
  ['Mean from a frequency table',
    'Multiply each value by its frequency (fx), add up the fx column, then divide by the total frequency: mean = Σfx ÷ Σf.',
    (r) => {
      const start = r.int(0, 2); const xs = [0, 1, 2, 3, 4].map((i) => start + i); const fs = xs.map(() => r.int(1, 12)); const F = sum(fs), FX = sum(xs.map((x, i) => x * fs[i])); const m = FX / F;
      const what = r.pick([['Goals', 'matches'], ['Number of pets', 'students'], ['Number of siblings', 'students']]);
      return { html: `The table shows information about ${what[1]}.${htable([what[0], ...xs], [['Frequency', ...fs]])}Work out the mean. Give your answer to 1 decimal place.`, ...nAns(m, { dp: 1 }), format: dpFmt(1), hint: 'Mean = Σfx ÷ Σf.',
        steps: [`fx: ${xs.map((x, i) => `${x} × ${fs[i]} = ${x * fs[i]}`).join(', ')}`, `Σfx = ${FX}, Σf = ${F}`, `Mean = ${FX} ÷ ${F} = ${fx(m, 4)}… = ${B(r1(m))}`] };
    }],
  ['Median from a frequency table',
    'Find the total frequency n. The median is the (n + 1) ÷ 2 th value. Add up the frequencies (a running total) until you reach that position.',
    (r) => {
      const xs = [1, 2, 3, 4, 5]; let fs, n; do { fs = xs.map(() => r.int(1, 12)); n = sum(fs); } while (n % 2 === 0);
      const pos = (n + 1) / 2; let c = 0, med; const cum = []; for (let i = 0; i < 5; i++) { c += fs[i]; cum.push(c); if (med === undefined && c >= pos) med = xs[i]; }
      return { html: `The table shows the number of books read by some students.${htable(['Books', ...xs], [['Frequency', ...fs]])}Find the median number of books.`, ...nAns(med), hint: 'Use a running total of the frequencies.',
        steps: [`Total frequency n = ${n}, so the median is the ${ord(pos)} value.`, `Running totals: ${cum.join(', ')}`, `The ${ord(pos)} value is in the “${med}” group, so the median = ${B(med)}`] };
    }],
  ['Mean from a bar chart',
    'Read each frequency from the bar chart and make a frequency table. Then mean = Σfx ÷ Σf.',
    (r) => {
      const xs = [1, 2, 3, 4, 5, 6]; const fs = xs.map(() => r.int(1, 10)); const F = sum(fs), FX = sum(xs.map((x, i) => x * fs[i])); const m = FX / F;
      const ctx = r.pick([['the scores when a dice was rolled', 'times', 'score', 'Score'], ['the number of goals scored in', 'football matches', 'number of goals per match', 'Goals'], ['the number of people in each of', 'cars', 'number of people per car', 'People'], ['the number of books read last month by', 'students', 'number of books per student', 'Books']]);
      return { html: `The bar chart shows ${ctx[0] === 'the scores when a dice was rolled' ? `${ctx[0]} ${F} ${ctx[1]}` : `${ctx[0]} ${F} ${ctx[1]}`}. Work out the mean ${ctx[2]}. Give your answer to 1 decimal place.`, diagram: barSvg(xs.map(String), fs, { xl: ctx[3], yl: 'Frequency' }), ...nAns(m, { dp: 1 }), format: dpFmt(1), hint: 'Multiply each score by its frequency.',
        steps: [`Frequencies: ${fs.join(', ')} (total ${F})`, `Σfx = ${xs.map((x, i) => `${x}×${fs[i]}`).join(' + ')} = ${FX}`, `Mean = ${FX} ÷ ${F} = ${fx(m, 4)}… = ${B(r1(m))}`] };
    }],
]);

// ============================================================================
// YEAR 10
// ============================================================================
topic('y10-compound-interest', 'number', 10, 1, 'FH', 'Compound Interest & Depreciation', 'Repeated percentage change using multipliers and powers.', [
  ['Compound interest',
    'With compound interest the interest is added each year, so the amount is multiplied by the same multiplier every year: Amount = P × (1 + r/100)ⁿ.',
    (r) => {
      const P = 100 * r.int(5, 200), rate = r.pick([1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5, 6]), n = r.int(2, 8); const m = 1 + rate / 100; const A = P * m ** n;
      return { html: `${B(money(P))} is invested at ${B(ps(rate) + '%')} per year compound interest. Work out the value of the investment after ${B(n + ' years')}.`, ...nAns(A, { money: true }), format: 'Give your answer in pounds to the nearest penny, e.g. 1234.56', hint: `Multiplier = ${ps(m)}, used ${n} times.`,
        steps: [`Multiplier = 100% + ${ps(rate)}% = ${ps(m)}`, `Value = ${money(P)} × ${ps(m)}<sup>${n}</sup>`, `= ${fx(A, 4)}… = ${B(money(A))}`] };
    }],
  ['Depreciation',
    'Depreciation means the value falls by a percentage each year. Use the multiplier (1 − r/100) raised to the number of years.',
    (r) => {
      const P = 500 * r.int(4, 60), rate = r.pick([5, 8, 10, 12, 15, 18, 20, 25]), n = r.int(2, 7); const m = 1 - rate / 100; const A = P * m ** n;
      return { html: `A car costs ${B(money(P))}. Its value depreciates by ${B(rate + '%')} each year. Work out its value after ${B(n + ' years')}.`, ...nAns(A, { money: true }), format: 'Give your answer in pounds to the nearest penny', hint: `Multiplier = ${ps(m)}.`,
        steps: [`Multiplier = 100% − ${rate}% = ${ps(m)}`, `Value = ${money(P)} × ${ps(m)}<sup>${n}</sup>`, `= ${fx(A, 4)}… = ${B(money(A))}`] };
    }],
  ['Total interest earned',
    'Find the final amount with the compound interest formula, then subtract the original amount to find how much interest was earned.',
    (r) => {
      const P = 100 * r.int(10, 150), rate = r.pick([2, 2.5, 3, 3.5, 4, 5]), n = r.int(2, 6); const m = 1 + rate / 100; const A = P * m ** n; const I = A - P;
      return { html: `Sam invests ${B(money(P))} for ${B(n + ' years')} at ${B(ps(rate) + '%')} per year compound interest. How much interest does he earn?`, ...nAns(I, { money: true }), format: 'Give your answer in pounds to the nearest penny', hint: 'Final amount − original amount.',
        steps: [`Final amount = ${money(P)} × ${ps(m)}<sup>${n}</sup> = ${fx(A, 4)}…`, `Interest = ${fx(A, 4)}… − ${ps(P)} = ${fx(I, 4)}…`, `Interest = ${B(money(I))}`] };
    }],
]);

topic('y10-reverse-percentages', 'number', 10, 1, 'FH', 'Reverse Percentages', 'Find the original amount before a percentage change.', [
  ['Original amount after an increase',
    'After an increase of p%, the new amount is (100 + p)% of the original. Divide the new amount by the multiplier to get back to the original (100%).',
    (r) => {
      const O = 20 * r.int(5, 150), p = r.pick([5, 10, 15, 20, 25, 30, 40, 35]); const N = O * (100 + p) / 100;
      return { html: `After a ${B(p + '%')} pay rise, Mia earns ${B(money(N))} per year. What did she earn before the pay rise?`, ...nAns(O, { money: true }), format: 'Type the amount in pounds', hint: `${money(N)} is ${100 + p}% of the original.`,
        steps: [`${money(N)} = ${100 + p}% of the original, so the multiplier is ${ps(1 + p / 100)}`, `Original = ${money(N)} ÷ ${ps(1 + p / 100)}`, `= ${B(money(O))}`] };
    }],
  ['Original amount after a decrease',
    'After a decrease of p%, the new amount is (100 − p)% of the original. Divide by the multiplier — do NOT just add p% back on.',
    (r) => {
      const O = 20 * r.int(3, 100), p = r.pick([5, 10, 15, 20, 25, 30, 40, 35, 60]); const N = O * (100 - p) / 100;
      return { html: `In a sale, all prices are reduced by ${B(p + '%')}. A jacket costs ${B(money(N))} in the sale. What was its original price?`, ...nAns(O, { money: true }), format: 'Type the amount in pounds', hint: `${money(N)} is ${100 - p}% of the original price.`,
        steps: [`${money(N)} = ${100 - p}% of the original, so the multiplier is ${ps(1 - p / 100)}`, `Original = ${money(N)} ÷ ${ps(1 - p / 100)}`, `= ${B(money(O))}`] };
    }],
  ['VAT and reverse percentages',
    'VAT at 20% means a price including VAT is 120% of the price before VAT. Divide by 1.2 to remove VAT.',
    (r) => {
      const E = 5 * r.int(2, 200); const I = E * 1.2;
      return { html: `A TV costs ${B(money(I))} including VAT at 20%. Work out the cost of the TV before VAT was added.`, ...nAns(E, { money: true }), format: 'Type the amount in pounds', hint: 'The price with VAT is 120% of the price without VAT.',
        steps: ['Price with VAT = 120% of price without VAT', `Price without VAT = ${money(I)} ÷ 1.2`, `= ${B(money(E))}`] };
    }],
]);

topic('y10-factorising-quadratics', 'algebra', 10, 1, 'FH', 'Factorising Quadratics', 'Factorise x² + bx + c and the difference of two squares.', [
  ['Factorising x² + bx + c',
    'Find two numbers that multiply to give c and add to give b. Write them in the brackets: x² + bx + c = (x + p)(x + q).',
    (r) => {
      let p, q; do { p = r.nz(-9, 9); q = r.nz(-9, 9); } while (p + q === 0 || p === q);
      const ans = `(${lin(1, p)})(${lin(1, q)})`;
      return { html: `Factorise ${B(tx(quad(1, p + q, p * q)))}`, ...eAns(ans, { form: 'factored' }), format: 'Type two brackets, e.g. (x+2)(x-5)', hint: `Two numbers that multiply to ${ds(p * q)} and add to ${ds(p + q)}.`,
        steps: [`Find two numbers with product ${ds(p * q)} and sum ${ds(p + q)}.`, `${ds(p)} × ${br(q)} = ${ds(p * q)} and ${ds(p)} + ${br(q)} = ${ds(p + q)}`, `Answer: ${B(tx(ans))}`] };
    }],
  ['Difference of two squares',
    'An expression of the form a² − b² factorises as (a + b)(a − b). For example x² − 25 = (x + 5)(x − 5).',
    (r) => {
      const k = r.chance(0.3) ? r.int(2, 5) : 1; let a; do { a = r.int(1, 12); } while (gcd(a, k) !== 1); const kx = coefT(k, 'x');
      const ans = `(${kx}+${a})(${kx}-${a})`;
      return { html: `Factorise ${B(tx(polyT([[k * k, 'x^2'], [-a * a, '']])))}`, ...eAns(ans, { form: 'factored' }), format: 'Type two brackets, e.g. (x+3)(x-3)', hint: `Both terms are square numbers: ${tx(polyT([[k * k, 'x^2']]))} = (${tx(kx)})² and ${a * a} = ${a}².`,
        steps: [`${tx(polyT([[k * k, 'x^2']]))} = (${tx(kx)})<sup>2</sup> and ${a * a} = ${a}<sup>2</sup>`, `Use a² − b² = (a + b)(a − b)`, `Answer: ${B(tx(ans))}`] };
    }],
  ['Taking out a common factor first',
    'Always look for a common factor first. Take it outside, then factorise the quadratic left inside the bracket.',
    (r) => {
      const g = r.int(2, 5); let p, q; do { p = r.nz(-7, 7); q = r.nz(-7, 7); } while (p + q === 0 || p === q);
      const ans = `${g}(${lin(1, p)})(${lin(1, q)})`;
      return { html: `Factorise fully ${B(tx(quad(g, g * (p + q), g * p * q)))}`, ...eAns(ans, { form: 'factored', outer: String(g) }), format: 'E.g. 2(x+1)(x-4)', hint: `Every term is a multiple of ${g}.`,
        steps: [`Take out the common factor ${g}: ${tx(`${g}(${quad(1, p + q, p * q)})`)}`, `Factorise the quadratic: two numbers with product ${ds(p * q)} and sum ${ds(p + q)} are ${ds(p)} and ${ds(q)}.`, `Answer: ${B(tx(ans))}`] };
    }],
]);

topic('y10-solving-quadratics', 'algebra', 10, 1, 'FH', 'Solving Quadratics by Factorising', 'Solve quadratic equations by factorising and using the null factor law.', [
  ['Solving x² + bx + c = 0',
    'Factorise the quadratic. If two brackets multiply to give 0, one of them must equal 0 — set each bracket equal to 0 and solve.',
    (r) => {
      let p, q; do { p = r.nz(-9, 9); q = r.nz(-9, 9); } while (p === q || p + q === 0);
      return { html: `Solve ${B(tx(`${quad(1, -(p + q), p * q)}=0`))}`, answer: `${p}, ${q}`, check: { type: 'pair', values: [p, q] }, answerHtml: B(`<i>x</i> = ${ds(p)} or <i>x</i> = ${ds(q)}`), format: 'Give both solutions separated by a comma, e.g. 3, -2', hint: `Two numbers that multiply to ${ds(p * q)} and add to ${ds(-(p + q))}.`,
        steps: [`Factorise: ${tx(`(${lin(1, -p)})(${lin(1, -q)})=0`)}`, `So ${tx(`${lin(1, -p)}=0`)} or ${tx(`${lin(1, -q)}=0`)}`, `<i>x</i> = ${B(ds(p))} or <i>x</i> = ${B(ds(q))}`] };
    }],
  ['Quadratics with no constant or no x term',
    'For x² + bx = 0, factorise as x(x + b) = 0, so x = 0 is one solution. For x² − k = 0, add k and square root — remember both the positive and negative roots.',
    (r) => {
      if (r.chance()) { const b = r.nz(-12, 12); return { html: `Solve ${B(tx(`${polyT([[1, 'x^2'], [b, 'x']])}=0`))}`, answer: `0, ${-b}`, check: { type: 'pair', values: [0, -b] }, answerHtml: B(`<i>x</i> = 0 or <i>x</i> = ${ds(-b)}`), format: 'Give both solutions separated by a comma', hint: 'Take out x as a common factor.',
        steps: [`Factorise: ${tx(`x(${lin(1, b)})=0`)}`, `So <i>x</i> = 0 or ${tx(`${lin(1, b)}=0`)}`, `<i>x</i> = ${B('0')} or <i>x</i> = ${B(ds(-b))}`] }; }
      const k = r.int(2, 15); const m = r.chance(0.3) ? r.int(2, 4) : 1;
      return { html: `Solve ${B(tx(`${polyT([[m, 'x^2'], [-m * k * k, '']])}=0`))}`, answer: `${k}, ${-k}`, check: { type: 'pair', values: [k, -k] }, answerHtml: B(`<i>x</i> = ±${k}`), format: 'Give both solutions separated by a comma', hint: 'Get x² on its own, then square root (±).',
        steps: [...(m > 1 ? [`Divide by ${m}: ${tx(`x^2-${k * k}=0`)}`] : []), `${tx(`x^2=${k * k}`)}`, `<i>x</i> = ±${sq(k * k)} = ${B('±' + k)}`] };
    }],
  ['Rearranging then solving',
    'Rearrange so that one side is 0 (the form ax² + bx + c = 0) before factorising. You cannot use the null factor law unless one side is 0.',
    (r) => {
      let p, q; do { p = r.nz(-9, 9); q = r.nz(-9, 9); } while (p === q || p + q === 0); const b = -(p + q), c = p * q;
      const k = r.nz(-10, 10); // x^2 + bx + (c+k) ... show x^2 + bx = -c ; or x^2 + (b - j)x = -c - jx
      const html = `Solve ${B(tx(`${polyT([[1, 'x^2'], [b, 'x']])}=${-c}`))}`;
      return { html, answer: `${p}, ${q}`, check: { type: 'pair', values: [p, q] }, answerHtml: B(`<i>x</i> = ${ds(p)} or <i>x</i> = ${ds(q)}`), format: 'Give both solutions separated by a comma', hint: 'Move everything to one side first.',
        steps: [`Rearrange: ${tx(`${quad(1, b, c)}=0`)}`, `Factorise: ${tx(`(${lin(1, -p)})(${lin(1, -q)})=0`)}`, `<i>x</i> = ${B(ds(p))} or <i>x</i> = ${B(ds(q))}`] };
    }],
  ['Solving ax² + bx + c = 0 by factorising',
    'When a ≠ 1, find two numbers that multiply to a × c and add to b, split the middle term, and factorise in pairs. Solutions may be fractions.',
    (r) => {
      let m, n; do { m = r.nz(-9, 9); n = r.nz(-6, 6); } while (m % 2 === 0 || 2 * n === m);
      const a = 2, b = 2 * n + m, c = m * n; const r1v = -m / 2, r2v = -n;
      return { html: `Solve ${B(tx(`${quad(a, b, c)}=0`))}`, answer: `${fracT(-m, 2)}, ${-n}`, check: { type: 'pair', values: [r1v, r2v] }, answerHtml: B(`<i>x</i> = ${fracS(-m, 2)} or <i>x</i> = ${ds(-n)}`), format: 'Give both solutions separated by a comma; fractions like -3/2 are fine', hint: `Two numbers that multiply to ${ds(a * c)} and add to ${ds(b)}.`,
        steps: [`a × c = ${ds(a * c)}; two numbers with product ${ds(a * c)} and sum ${ds(b)} are ${ds(m)} and ${ds(2 * n)}.`, `Factorise: ${tx(`(${lin(2, m)})(${lin(1, n)})=0`)}`, `${tx(`${lin(2, m)}=0`)} gives <i>x</i> = ${fracS(-m, 2)}; ${tx(`${lin(1, n)}=0`)} gives <i>x</i> = ${ds(-n)}`, `Answer: ${B(`<i>x</i> = ${fracS(-m, 2)} or <i>x</i> = ${ds(-n)}`)}`] };
    }],
]);

topic('y10-trigonometry', 'geometry', 10, 1, 'FH', 'Trigonometry (SOHCAHTOA)', 'Use sine, cosine and tangent to find missing sides and angles in right-angled triangles.', [
  ['Finding a missing side',
    'Label the sides Opposite, Adjacent and Hypotenuse from the angle. Choose the ratio that uses the side you know and the side you want: SOH (sin = O/H), CAH (cos = A/H), TOA (tan = O/A).',
    (r) => {
      const th = r.int(18, 72), L = r.int(4, 25); const u = r.pick(['cm', 'm']); const t = r.int(0, 5);
      const C = [
        { know: 'hyp', want: 'opp', f: 'sin', v: L * sinD(th), eq: `x = ${L} × sin ${th}°` },
        { know: 'hyp', want: 'adj', f: 'cos', v: L * cosD(th), eq: `x = ${L} × cos ${th}°` },
        { know: 'adj', want: 'opp', f: 'tan', v: L * tanD(th), eq: `x = ${L} × tan ${th}°` },
        { know: 'opp', want: 'hyp', f: 'sin', v: L / sinD(th), eq: `x = ${L} ÷ sin ${th}°` },
        { know: 'adj', want: 'hyp', f: 'cos', v: L / cosD(th), eq: `x = ${L} ÷ cos ${th}°` },
        { know: 'opp', want: 'adj', f: 'tan', v: L / tanD(th), eq: `x = ${L} ÷ tan ${th}°` },
      ][t];
      const map = { opp: 'v', adj: 'hz', hyp: 'hyp' }; const o = { angle: `${th}°`, angleAt: 'B', hi: map[C.want] }; o[map[C.know]] = `${L} ${u}`; o[map[C.want]] = 'x';
      const ratio = { sin: 'O/H', cos: 'A/H', tan: 'O/A' }[C.f]; const nm = { opp: 'opposite', adj: 'adjacent', hyp: 'hypotenuse' };
      return { html: `The diagram shows a right-angled triangle with an angle of ${th}° and a side of length ${L} ${u}. Work out the length of side ${B('<i>x</i>')}. Give your answer to 1 decimal place.`, diagram: rtSvg(o), answerLabel: 'x =', unit: u, ...nAns(C.v, { dp: 1, unit: u }), format: dpFmt(1), hint: `You know the ${nm[C.know]} and want the ${nm[C.want]}.`,
        steps: [`From the ${th}° angle: the known side is the ${nm[C.know]}, x is the ${nm[C.want]}.`, `Use ${C.f} = ${ratio}: ${C.f} ${th}° = ${C.f === 'sin' ? (C.want === 'opp' ? frac('x', L) : frac(L, 'x')) : C.f === 'cos' ? (C.want === 'adj' ? frac('x', L) : frac(L, 'x')) : (C.want === 'opp' ? frac('x', L) : frac(L, 'x'))}`, `${C.eq} = ${fx(C.v, 4)}…`, `x = ${B(r1(C.v))} ${u}`] };
    }],
  ['Finding a missing angle',
    'Choose the ratio from the two sides you know, write it as a fraction, then use the inverse function (sin⁻¹, cos⁻¹ or tan⁻¹) on your calculator to find the angle.',
    (r) => {
      const t = r.int(0, 2); let a, b, th; const u = 'cm';
      if (t < 2) { do { b = r.int(5, 25); a = r.int(2, b - 1); } while (a / b < 0.2 || a / b > 0.95); th = t === 0 ? asinD(a / b) : acosD(a / b); }
      else { a = r.int(3, 20); b = r.int(3, 20); th = atanD(a / b); }
      const f = ['sin', 'cos', 'tan'][t]; const o = { angle: 'θ', angleAt: 'B', hiAngle: true };
      if (t === 0) { o.v = `${a} ${u}`; o.hyp = `${b} ${u}`; } else if (t === 1) { o.hz = `${a} ${u}`; o.hyp = `${b} ${u}`; } else { o.v = `${a} ${u}`; o.hz = `${b} ${u}`; }
      return { html: `The diagram shows a right-angled triangle with two sides of ${a} ${u} and ${b} ${u}. Work out the size of angle ${B('θ')}. Give your answer to 1 decimal place.`, diagram: rtSvg(o), answerLabel: 'θ =', unit: '°', ...nAns(th, { dp: 1, unit: '°' }), format: dpFmt(1), hint: `Which two sides do you know, relative to θ?`,
        steps: [`The sides given are the ${['opposite and hypotenuse', 'adjacent and hypotenuse', 'opposite and adjacent'][t]}, so use ${f}.`, `${f} θ = ${frac(a, b)}`, `θ = ${f}<sup>−1</sup>(${a} ÷ ${b}) = ${fx(th, 4)}…`, `θ = ${B(r1(th) + '°')}`] };
    }],
  ['Exact trigonometric values',
    'Learn the exact values: sin 30° = cos 60° = ½, sin 60° = cos 30° = √3⁄2, tan 45° = 1, sin 90° = cos 0° = 1, tan 0° = sin 0° = 0. Use them to calculate without a calculator.',
    (r) => {
      const t = r.int(0, 8); const L = 2 * r.int(2, 15), M = r.int(2, 12), K = 4 * r.int(1, 9);
      const C = [
        { q: `${L} × sin 30°`, v: L / 2, s: `sin 30° = ½, so ${L} × ½` },
        { q: `${L} × cos 60°`, v: L / 2, s: `cos 60° = ½, so ${L} × ½` },
        { q: `${L} × tan 45°`, v: L, s: `tan 45° = 1, so ${L} × 1` },
        { q: `${L} ÷ cos 60°`, v: L * 2, s: `cos 60° = ½, so ${L} ÷ ½ = ${L} × 2` },
        { q: `${L} ÷ sin 30°`, v: L * 2, s: `sin 30° = ½, so ${L} ÷ ½ = ${L} × 2` },
        { q: `${L} sin 30° + ${M} tan 45°`, v: L / 2 + M, s: `sin 30° = ½ and tan 45° = 1, so ${L} × ½ + ${M} × 1 = ${L / 2} + ${M}` },
        { q: `${M} cos 0° − ${L} cos 60°`, v: M - L / 2, s: `cos 0° = 1 and cos 60° = ½, so ${M} × 1 − ${L} × ½ = ${M} − ${L / 2}` },
        { q: `${K} × (cos 30°)<sup>2</sup>`, v: (3 * K) / 4, s: `cos 30° = ${frac(sq(3), 2)}, so (cos 30°)<sup>2</sup> = ${frac(3, 4)} and ${K} × ${frac(3, 4)}` },
        { q: `${K} × (sin 60°)<sup>2</sup> + ${M} sin 90°`, v: (3 * K) / 4 + M, s: `(sin 60°)<sup>2</sup> = ${frac(3, 4)} and sin 90° = 1, so ${K} × ${frac(3, 4)} + ${M} = ${3 * K / 4} + ${M}` },
      ][t];
      return { html: `Without using a calculator, work out the exact value of ${B(C.q)}.`, ...nAns(C.v), hint: 'Use the exact trig values you have learned.', steps: [C.s, `= ${B(ds(C.v))}`] };
    }],
]);

topic('y10-fractional-indices', 'number', 10, 2, 'H', 'Negative & Fractional Indices', 'Evaluate powers with negative and fractional indices.', [
  ['Negative indices',
    'A negative index means “one over”: a⁻ⁿ = 1/aⁿ. For a fraction, flip it and make the power positive: (a/b)⁻ⁿ = (b/a)ⁿ.',
    (r) => {
      if (r.chance(0.6)) { let b, n; do { b = r.int(2, 10); n = r.int(1, 3); } while (b ** n > 1000); return { html: `Work out the value of ${B(`${b}<sup>−${n}</sup>`)}. Give your answer as a fraction.`, ...fAns(1, b ** n), hint: 'Negative power → one over.', steps: [`${b}<sup>−${n}</sup> = ${frac(1, `${b}<sup>${n}</sup>`)}`, `= ${B(frac(1, b ** n))}`] }; }
      let a, b; do { a = r.int(2, 9); b = r.int(1, 9); } while (gcd(a, b) !== 1 || a === b); const n = r.int(1, 2);
      return { html: `Work out the value of ${B(`(${frac(a, b)})<sup>−${n}</sup>`)}.`, ...fAns(b ** n, a ** n), format: 'Give your answer as a fraction or whole number, e.g. 9/4', hint: 'Flip the fraction, then make the power positive.',
        steps: [`Flip the fraction: (${frac(a, b)})<sup>−${n}</sup> = (${frac(b, a)})<sup>${n}</sup>`, `= ${B(fracN(b ** n, a ** n))}`] };
    }],
  ['Unit fractional indices',
    'A power of 1/n means the nth root: a^(1/2) = √a, a^(1/3) = ∛a.',
    (r) => {
      let k, b; do { k = r.pick([2, 2, 3, 3, 4, 5]); b = r.int(2, 12); } while (b ** k > 10000); const a = b ** k; const name = { 2: 'square root', 3: 'cube root', 4: 'fourth root', 5: 'fifth root' }[k];
      return { html: `Work out the value of ${B(`${a}<sup>${frac(1, k)}</sup>`)}.`, ...nAns(b), hint: `This is the ${name} of ${a}.`, steps: [`${a}<sup>1/${k}</sup> means the ${name} of ${a}.`, `${b}<sup>${k}</sup> = ${a}, so the answer is ${B(b)}`] };
    }],
  ['General fractional indices',
    'For a^(m/n), take the nth root first, then raise to the power m. If the index is negative, also take “one over”. E.g. 8^(−2/3) = 1/(∛8)² = 1/4.',
    (r) => {
      let k, b, p; do { k = r.pick([2, 3, 4]); b = r.int(2, 9); p = r.int(2, 4); } while (b ** k > 10000 || b ** p > 1000 || gcd(p, k) !== 1); const neg = r.chance(); const a = b ** k; const val = b ** p;
      return { html: `Work out the value of ${B(`${a}<sup>${neg ? '−' : ''}${frac(p, k)}</sup>`)}.`, ...(neg ? fAns(1, val) : fAns(val, 1)), format: neg ? 'Give your answer as a fraction, e.g. 1/16' : 'Type a whole number', hint: 'Root first, then power.',
        steps: [`The ${k === 2 ? 'square' : k === 3 ? 'cube' : 'fourth'} root of ${a} is ${b}.`, `${b}<sup>${p}</sup> = ${val}`, neg ? `Negative index → one over: ${B(frac(1, val))}` : `Answer: ${B(val)}`] };
    }],
]);

const SQF = [2, 3, 5, 6, 7, 10, 11, 13];
function surdAcc(k, m) { if (m === 1) return [String(k)]; if (k === 1) return ['√' + m, '1√' + m]; if (k === -1) return ['-√' + m, '-1√' + m]; return [`${k}√${m}`]; }
function surdH(k, m) { if (m === 1) return ds(k); return (k === 1 ? '' : k === -1 ? '−' : ds(k)) + sq(m); }
function simpSurd(n) { let k = 1, m = n; for (let i = Math.floor(Math.sqrt(n)); i >= 2; i--) if (n % (i * i) === 0) { k = i; m = n / (i * i); break; } return [k, m]; }
const surdQ = (k, m) => ({ answer: surdAcc(k, m)[0], check: { type: 'text', accept: surdAcc(k, m) }, answerHtml: B(surdH(k, m)), format: 'Type √ as sqrt if needed, e.g. 3√2 or 3sqrt2' });
topic('y10-surds', 'number', 10, 2, 'H', 'Surds', 'Simplify surds and add, subtract and multiply them.', [
  ['Simplifying surds',
    'Find the largest square number that is a factor of the number. Use √(ab) = √a × √b to split it, then square-root the square number.',
    (r) => {
      let k, m; do { k = r.int(2, 10); m = r.pick(SQF); } while (k * k * m > 500); const n = k * k * m;
      return { html: `Write ${B(sq(n))} in the form <i>a</i>${sq('<i>b</i>')}, where <i>a</i> and <i>b</i> are integers and <i>b</i> is as small as possible.`, ...surdQ(k, m), hint: `Which square number goes into ${n}?`,
        steps: [`The largest square factor of ${n} is ${k * k}.`, `${sq(n)} = ${sq(k * k)} × ${sq(m)}`, `= ${B(surdH(k, m))}`] };
    }],
  ['Adding & subtracting surds',
    'Simplify each surd first. You can only add or subtract like surds (with the same number under the root): 2√3 + 5√3 = 7√3.',
    (r) => {
      const m = r.pick([2, 3, 5, 6, 7]); let k1, k2, add; do { k1 = r.int(1, 6); k2 = r.int(1, 6); add = r.chance(); } while ((add ? k1 + k2 : k1 - k2) === 0 || k1 === k2 || k1 * k1 * m > 300 || k2 * k2 * m > 300);
      const k = add ? k1 + k2 : k1 - k2;
      return { html: `Simplify ${B(`${sq(k1 * k1 * m)} ${add ? '+' : '−'} ${sq(k2 * k2 * m)}`)}`, ...surdQ(k, m), hint: `Write both surds as multiples of ${sq(m)}.`,
        steps: [`${sq(k1 * k1 * m)} = ${surdH(k1, m)} and ${sq(k2 * k2 * m)} = ${surdH(k2, m)}`, `${surdH(k1, m)} ${add ? '+' : '−'} ${surdH(k2, m)} = ${B(surdH(k, m))}`] };
    }],
  ['Multiplying surds',
    'Use √a × √b = √(ab). Multiply the numbers under the roots, then simplify the result.',
    (r) => {
      let a, b, k, m; do { a = r.int(2, 15); b = r.int(2, 15); [k, m] = simpSurd(a * b); } while (a === b || k === 1 || Number.isInteger(Math.sqrt(a)) || Number.isInteger(Math.sqrt(b)));
      return { html: `Simplify ${B(`${sq(a)} × ${sq(b)}`)}`, ...(m === 1 ? { answer: String(k), check: { type: 'text', accept: [String(k)] }, answerHtml: B(k), format: 'Type a whole number or a surd, e.g. 6 or 2√15' } : surdQ(k, m)), hint: 'Multiply under the root, then simplify.',
        steps: [`${sq(a)} × ${sq(b)} = ${sq(a * b)}`, m === 1 ? `${a * b} = ${k}<sup>2</sup>, so ${sq(a * b)} = ${B(k)}` : `${sq(a * b)} = ${sq(k * k)} × ${sq(m)} = ${B(surdH(k, m))}`] };
    }],
]);

topic('y10-simultaneous-equations', 'algebra', 10, 2, 'FH', 'Simultaneous Linear Equations', 'Solve pairs of linear equations by elimination.', [
  ['Elimination (one step)',
    'If one letter has the same coefficient in both equations, subtract the equations to eliminate it (add them if the signs are opposite). Solve for the other letter, then substitute back.',
    (r) => {
      let a1, a2, b, x, y; do { a1 = r.int(1, 7); a2 = r.int(1, 7); b = r.nz(-6, 6); x = r.nz(-6, 9); y = r.nz(-6, 9); } while (a1 === a2);
      const opp = r.chance(); const b2 = opp ? -b : b; const c1 = a1 * x + b * y, c2 = a2 * x + b2 * y;
      const e1 = `${polyT([[a1, 'x'], [b, 'y']])}=${c1}`, e2 = `${polyT([[a2, 'x'], [b2, 'y']])}=${c2}`;
      const ax = opp ? a1 + a2 : a1 - a2, cc = opp ? c1 + c2 : c1 - c2;
      return { html: `Solve the simultaneous equations<br>${B(tx(e1))}<br>${B(tx(e2))}`, answer: `${x}, ${y}`, check: { type: 'pair', values: [x, y], ordered: true }, answerHtml: B(`<i>x</i> = ${ds(x)}, <i>y</i> = ${ds(y)}`), format: 'Type x then y, e.g. 3, -2 (or x=3, y=-2)', hint: `The y terms ${opp ? 'have opposite signs — add' : 'are the same — subtract'} the equations.`,
        steps: [`${opp ? 'Add' : 'Subtract'} the equations to eliminate <i>y</i>: ${tx(`${coefT(ax, 'x')}=${cc}`)}`, `<i>x</i> = ${ds(cc)} ÷ ${br(ax)} = ${ds(x)}`, `Substitute into the first equation: ${ds(a1 * x)}${b < 0 ? ' − ' : ' + '}${tx(coefT(Math.abs(b), 'y'))} = ${ds(c1)}, so <i>y</i> = ${ds(y)}`, `Answer: ${B(`<i>x</i> = ${ds(x)}, <i>y</i> = ${ds(y)}`)}`] };
    }],
  ['Elimination (multiplying first)',
    'If no coefficients match, multiply one or both equations so that one letter has the same coefficient. Then add or subtract to eliminate it.',
    (r) => {
      let a1, b1, a2, b2, x, y; do { a1 = r.int(1, 6); b1 = r.nz(-6, 6); a2 = r.int(1, 6); b2 = r.nz(-6, 6); x = r.nz(-6, 8); y = r.nz(-6, 8); } while (a1 * b2 - a2 * b1 === 0 || Math.abs(b1) === Math.abs(b2) || a1 === a2);
      const c1 = a1 * x + b1 * y, c2 = a2 * x + b2 * y; const e1 = `${polyT([[a1, 'x'], [b1, 'y']])}=${c1}`, e2 = `${polyT([[a2, 'x'], [b2, 'y']])}=${c2}`;
      const L = lcm(a1, a2), m1 = L / a1, m2 = L / a2;
      return { html: `Solve the simultaneous equations<br>${B(tx(e1))}<br>${B(tx(e2))}`, answer: `${x}, ${y}`, check: { type: 'pair', values: [x, y], ordered: true }, answerHtml: B(`<i>x</i> = ${ds(x)}, <i>y</i> = ${ds(y)}`), format: 'Type x then y, e.g. 3, -2', hint: 'Make the x coefficients (or y coefficients) the same.',
        steps: [`Multiply the first equation by ${m1} and the second by ${m2}: ${tx(`${polyT([[L, 'x'], [b1 * m1, 'y']])}=${c1 * m1}`)} and ${tx(`${polyT([[L, 'x'], [b2 * m2, 'y']])}=${c2 * m2}`)}`, `Subtract to eliminate x: ${tx(`${coefT(b1 * m1 - b2 * m2, 'y')}=${c1 * m1 - c2 * m2}`)}, so <i>y</i> = ${ds(y)}`, `Substitute into the first equation: ${tx(coefT(a1, 'x'))}${pm(b1 * y)} = ${ds(c1)}, so <i>x</i> = ${ds(x)}`, `Answer: ${B(`<i>x</i> = ${ds(x)}, <i>y</i> = ${ds(y)}`)}`] };
    }],
  ['Forming simultaneous equations',
    'Use a letter for each unknown, write one equation for each piece of information, then solve them simultaneously.',
    (r) => {
      let A, C, p, q, s, t; do { A = r.int(5, 15); C = r.int(2, A - 1); p = r.int(1, 5); q = r.int(1, 5); s = r.int(1, 5); t = r.int(1, 5); } while (p * t - q * s === 0);
      const T1 = p * A + q * C, T2 = s * A + t * C;
      return { html: `${B(p)} adult tickets and ${B(q)} child tickets cost ${B(money(T1))}.<br>${B(s)} adult tickets and ${B(t)} child tickets cost ${B(money(T2))}.<br>Find the cost of one adult ticket and one child ticket.`, answer: `${A}, ${C}`, check: { type: 'pair', values: [A, C], ordered: true }, answerHtml: B(`Adult ${money(A)}, child ${money(C)}`), format: 'Type the adult price then the child price, e.g. 12, 7', hint: 'Let a = adult price and c = child price.',
        steps: [`${tx(`${polyT([[p, 'a'], [q, 'c']])}=${T1}`)} and ${tx(`${polyT([[s, 'a'], [t, 'c']])}=${T2}`)}`, `Eliminate one letter (multiply so the coefficients match, then subtract).`, `<i>a</i> = ${A}, <i>c</i> = ${C}`, `Adult ticket ${B(money(A))}, child ticket ${B(money(C))}`] };
    }],
]);

topic('y10-rearranging', 'algebra', 10, 2, 'FH', 'Rearranging Formulae', 'Change the subject of a formula.', [
  ['Making x the subject',
    'Treat it like solving an equation: undo the operations around x in reverse order, doing the same to both sides, until x is on its own.',
    (r) => {
      const a = r.int(2, 9), b = r.nz(-12, 12); const rev = r.chance(0.3);
      if (rev) { const ans = `(${b}-y)/${a}`; return { html: `Make ${B('<i>x</i>')} the subject of ${B(tx(`y=${b}-${a}x`))}`, answerLabel: 'x =', ...eAns(ans, { vars: ['y'] }), answerHtml: B(frac(tx(`${b}-y`), a)), format: 'E.g. (y-5)/3', hint: `Add ${a}x to both sides first.`,
        steps: [`Add ${tx(`${a}x`)} to both sides: ${tx(`${a}x+y=${b}`)}`, `Subtract <i>y</i>: ${tx(`${a}x=${b}-y`)}`, `Divide by ${a}: <i>x</i> = ${B(frac(tx(`${b}-y`), a))}`] }; }
      const top = polyT([[1, 'y'], [-b, '']]); const ans = `(${top})/${a}`;
      return { html: `Make ${B('<i>x</i>')} the subject of ${B(tx(`y=${lin(a, b)}`))}`, answerLabel: 'x =', ...eAns(ans, { vars: ['y'] }), answerHtml: B(frac(tx(top), a)), format: 'E.g. (y-5)/3', hint: `First ${b > 0 ? 'subtract' : 'add'} ${Math.abs(b)}.`,
        steps: [`${b > 0 ? 'Subtract' : 'Add'} ${Math.abs(b)} ${b > 0 ? 'from' : 'to'} both sides: ${tx(`${top}=${a}x`)}`, `Divide both sides by ${a}: <i>x</i> = ${B(frac(tx(top), a))}`] };
    }],
  ['Rearranging formulae',
    'Identify the letter you want, then undo everything that has been done to it, step by step. Square roots undo squares; multiplying undoes dividing.',
    (r) => {
      const T = [
        { f: 'v=u+at', s: 't', a: '(v-u)/a', h: frac(tx('v-u'), tx('a')), st: [`Subtract <i>u</i>: ${tx('v-u=at')}`, `Divide by <i>a</i>`] },
        { f: 's=d/t', s: 't', a: 'd/s', h: frac(tx('d'), tx('s')), st: [`Multiply by <i>t</i>: ${tx('st=d')}`, `Divide by <i>s</i>`] },
        { f: 'p=2(l+w)', s: 'l', a: 'p/2-w', h: `${frac(tx('p'), 2)} − <i>w</i>`, st: [`Divide by 2: ${frac(tx('p'), 2)} = <i>l</i> + <i>w</i>`, `Subtract <i>w</i>`] },
        { f: 'y=mx+c', s: 'm', a: '(y-c)/x', h: frac(tx('y-c'), tx('x')), st: [`Subtract <i>c</i>: ${tx('y-c=mx')}`, `Divide by <i>x</i>`] },
        { f: 'a=(b+c)/2', s: 'b', a: '2a-c', h: tx('2a-c'), st: [`Multiply by 2: ${tx('2a=b+c')}`, `Subtract <i>c</i>`] },
        { f: 'k=mv^2/2', s: 'm', a: '2k/v^2', h: frac(tx('2k'), tx('v^2')), st: [`Multiply by 2: ${tx('2k=mv^2')}`, `Divide by ${tx('v^2')}`] },
        { f: 'a=pi*r^2', s: 'r', a: 'sqrt(a/pi)', h: `√(${frac(tx('a'), 'π')})`, st: [`Divide by π: ${frac(tx('a'), 'π')} = ${tx('r^2')}`, `Square root both sides`] },
        { f: 'e=mc^2', s: 'c', a: 'sqrt(e/m)', h: `√(${frac(tx('e'), tx('m'))})`, st: [`Divide by <i>m</i>: ${frac(tx('e'), tx('m'))} = ${tx('c^2')}`, `Square root both sides`] },
        { f: 'p=4s', s: 's', a: 'p/4', h: frac(tx('p'), 4), st: [`${tx('s')} is multiplied by 4`, `Divide both sides by 4`] },
        { f: 'a=b-c', s: 'c', a: 'b-a', h: tx('b-a'), st: [`Add <i>c</i> to both sides: ${tx('a+c=b')}`, `Subtract <i>a</i> from both sides`] },
        { f: 'v=lwh', s: 'h', a: 'v/(lw)', h: frac(tx('v'), tx('lw')), st: [`<i>h</i> is multiplied by ${tx('lw')}`, `Divide both sides by ${tx('lw')}`] },
        { f: 'c=2pir', s: 'r', a: 'c/(2pi)', h: frac(tx('c'), '2π'), st: [`<i>r</i> is multiplied by 2π`, `Divide both sides by 2π`] },
        { f: 'a=bh/2', s: 'h', a: '2a/b', h: frac(tx('2a'), tx('b')), fh: `<i>a</i> = ${frac(tx('bh'), 2)}`, st: [`Multiply by 2: ${tx('2a=bh')}`, `Divide by <i>b</i>`] },
        { f: 'w=5t+u', s: 't', a: '(w-u)/5', h: frac(tx('w-u'), 5), st: [`Subtract <i>u</i>: ${tx('w-u=5t')}`, `Divide by 5`] },
        { f: 't=(a-b)/c', s: 'a', a: 'ct+b', h: tx('ct+b'), fh: `<i>t</i> = ${frac(tx('a-b'), tx('c'))}`, st: [`Multiply by <i>c</i>: ${tx('ct=a-b')}`, `Add <i>b</i>`] },
        { f: 'f=9c/5+32', s: 'c', a: '5(f-32)/9', h: frac(tx('5(f-32)'), 9), fh: `<i>f</i> = ${frac(tx('9c'), 5)} + 32`, st: [`Subtract 32: ${tx('f-32')} = ${frac(tx('9c'), 5)}`, `Multiply by 5: ${tx('5(f-32)=9c')}`, `Divide by 9`] },
        { f: 'd=m/v', s: 'v', a: 'm/d', h: frac(tx('m'), tx('d')), fh: `<i>d</i> = ${frac(tx('m'), tx('v'))}`, st: [`Multiply by <i>v</i>: ${tx('dv=m')}`, `Divide by <i>d</i>`] },
        { f: 'v=u^2+2as', s: 's', a: '(v-u^2)/(2a)', h: frac(tx('v-u^2'), tx('2a')), st: [`Subtract ${tx('u^2')}: ${tx('v-u^2=2as')}`, `Divide by ${tx('2a')}`] },
        { f: 'a=x^2-k', s: 'x', a: 'sqrt(a+k)', h: `√(${tx('a+k')})`, st: [`Add <i>k</i>: ${tx('a+k=x^2')}`, `Square root both sides`] },
        { f: 'i=prt/100', s: 'r', a: '100i/(pt)', h: frac(tx('100i'), tx('pt')), fh: `<i>i</i> = ${frac(tx('prt'), 100)}`, st: [`Multiply by 100: ${tx('100i=prt')}`, `Divide by ${tx('pt')}`] },
        { f: 'p=a+b+c', s: 'b', a: 'p-a-c', h: tx('p-a-c'), st: [`Subtract <i>a</i> from both sides: ${tx('p-a=b+c')}`, `Subtract <i>c</i> from both sides`] },
        { f: 'h=k-5g', s: 'g', a: '(k-h)/5', h: frac(tx('k-h'), 5), st: [`Add ${tx('5g')} and subtract <i>h</i>: ${tx('5g=k-h')}`, `Divide by 5`] },
        { f: 'y=3x-k', s: 'x', a: '(y+k)/3', h: frac(tx('y+k'), 3), st: [`Add <i>k</i>: ${tx('y+k=3x')}`, `Divide by 3`] },
        { f: 'm=(p+q)/2', s: 'q', a: '2m-p', h: tx('2m-p'), fh: `<i>m</i> = ${frac(tx('p+q'), 2)}`, st: [`Multiply by 2: ${tx('2m=p+q')}`, `Subtract <i>p</i>`] },
        { f: 'a=4b^2', s: 'b', a: 'sqrt(a/4)', h: `√(${frac(tx('a'), 4)})`, st: [`Divide by 4: ${frac(tx('a'), 4)} = ${tx('b^2')}`, `Square root both sides`] },
        { f: 'q=r/3-s', s: 'r', a: '3(q+s)', h: tx('3(q+s)'), fh: `<i>q</i> = ${frac(tx('r'), 3)} − <i>s</i>`, st: [`Add <i>s</i>: ${tx('q+s')} = ${frac(tx('r'), 3)}`, `Multiply by 3`] },
        { f: 'v=pir^2h', s: 'h', a: 'v/(pir^2)', h: frac(tx('v'), `π${tx('r^2')}`), fh: `<i>v</i> = π${tx('r^2h')}`, st: [`<i>h</i> is multiplied by π${tx('r^2')}`, `Divide both sides by π${tx('r^2')}`] },
        { f: 'w=2(a-b)', s: 'a', a: 'w/2+b', h: `${frac(tx('w'), 2)} + <i>b</i>`, st: [`Divide by 2: ${frac(tx('w'), 2)} = ${tx('a-b')}`, `Add <i>b</i>`] },
        { f: 'g=k/h', s: 'h', a: 'k/g', h: frac(tx('k'), tx('g')), fh: `<i>g</i> = ${frac(tx('k'), tx('h'))}`, st: [`Multiply by <i>h</i>: ${tx('gh=k')}`, `Divide by <i>g</i>`] },
        { f: 'c=5d+3e', s: 'd', a: '(c-3e)/5', h: frac(tx('c-3e'), 5), st: [`Subtract ${tx('3e')}: ${tx('c-3e=5d')}`, `Divide by 5`] },
        { f: 'y=x^2+c', s: 'x', a: 'sqrt(y-c)', h: `√(${tx('y-c')})`, st: [`Subtract <i>c</i>: ${tx('y-c=x^2')}`, `Square root both sides`] },
      ];
      const o = r.pick(T); const vars = [...new Set(o.f.replace(/pi/g, '').match(/[a-z]/g))].filter((v) => v !== o.s);
      const fH = o.fh ? o.fh : o.f === 's=d/t' ? `<i>s</i> = ${frac(tx('d'), tx('t'))}` : o.f === 'a=(b+c)/2' ? `<i>a</i> = ${frac(tx('b+c'), 2)}` : o.f === 'k=mv^2/2' ? `<i>k</i> = ${frac(tx('mv^2'), 2)}` : o.f === 'a=pi*r^2' ? `<i>a</i> = π${tx('r^2')}` : tx(o.f);
      return { html: `Make ${B(`<i>${o.s}</i>`)} the subject of the formula ${B(fH)}`, answerLabel: `${o.s} =`, ...eAns(o.a, { vars }), answerHtml: B(o.h), format: 'Type an expression; use sqrt( ) for a square root and pi for π', hint: `Undo the operations around ${o.s} one at a time.`,
        steps: [...o.st, `<i>${o.s}</i> = ${B(o.h)}`] };
    }],
  ['Subject inside a fraction',
    'Multiply both sides by the denominator first to clear the fraction. Then rearrange as normal.',
    (r) => {
      const a = r.int(2, 9), b = r.nz(-9, 9), c = r.int(2, 9); const top = polyT([[c, 'y'], [-b, '']]); const ans = `(${top})/${a}`;
      return { html: `Make ${B('<i>x</i>')} the subject of ${B(`<i>y</i> = ${frac(tx(lin(a, b)), c)}`)}`, answerLabel: 'x =', ...eAns(ans, { vars: ['y'] }), answerHtml: B(frac(tx(top), a)), format: 'E.g. (4y-3)/2', hint: `Multiply both sides by ${c} first.`,
        steps: [`Multiply both sides by ${c}: ${tx(`${c}y=${lin(a, b)}`)}`, `${b > 0 ? 'Subtract' : 'Add'} ${Math.abs(b)}: ${tx(`${top}=${a}x`)}`, `Divide by ${a}: <i>x</i> = ${B(frac(tx(top), a))}`] };
    }],
]);

topic('y10-arcs-sectors', 'geometry', 10, 2, 'FH', 'Arcs & Sectors', 'Arc length, sector area and sector perimeter.', [
  ['Arc length',
    'An arc is a fraction of the circumference. Arc length = (θ ÷ 360) × 2πr, where θ is the angle at the centre.',
    (r) => {
      const th = r.int(4, 66) * 5, rr = r.int(3, 20); const L = (th / 360) * 2 * Math.PI * rr;
      return { html: `A sector has radius ${B(rr + ' cm')} and angle ${B(th + '°')}. Work out the arc length. Give your answer to 1 decimal place.`, diagram: sectorSvg(th, `${rr} cm`, `${th}°`, 'arc'), unit: 'cm', ...nAns(L, { dp: 1, unit: 'cm' }), format: dpFmt(1), hint: 'Fraction of the full circumference.',
        steps: [`Arc length = ${frac(th, 360)} × 2 × π × ${rr}`, `= ${fx(L, 4)}…`, `= ${B(r1(L))} cm`] };
    }],
  ['Area of a sector',
    'A sector is a fraction of the whole circle. Sector area = (θ ÷ 360) × πr².',
    (r) => {
      const th = r.int(4, 66) * 5, rr = r.int(3, 20); const A = (th / 360) * Math.PI * rr * rr;
      return { html: `A sector has radius ${B(rr + ' cm')} and angle ${B(th + '°')}. Work out its area. Give your answer to 1 decimal place.`, diagram: sectorSvg(th, `${rr} cm`, `${th}°`), unit: 'cm²', ...nAns(A, { dp: 1, unit: 'cm²' }), format: dpFmt(1), hint: 'Fraction of the full circle area.',
        steps: [`Sector area = ${frac(th, 360)} × π × ${rr}<sup>2</sup>`, `= ${fx(A, 4)}…`, `= ${B(r1(A))} cm²`] };
    }],
  ['Perimeter of a sector',
    'The perimeter of a sector is the arc length plus the two radii: P = (θ ÷ 360) × 2πr + 2r.',
    (r) => {
      const th = r.int(4, 66) * 5, rr = r.int(3, 20); const L = (th / 360) * 2 * Math.PI * rr; const P = L + 2 * rr;
      return { html: `A sector has radius ${B(rr + ' cm')} and angle ${B(th + '°')}. Work out its perimeter. Give your answer to 1 decimal place.`, diagram: sectorSvg(th, `${rr} cm`, `${th}°`, 'arc'), unit: 'cm', ...nAns(P, { dp: 1, unit: 'cm' }), format: dpFmt(1), hint: "Don't forget the two straight edges.",
        steps: [`Arc length = ${frac(th, 360)} × 2 × π × ${rr} = ${fx(L, 4)}…`, `Perimeter = ${fx(L, 4)}… + ${rr} + ${rr}`, `= ${B(r1(P))} cm`] };
    }],
]);

function simSvg(small, big, labS, labB) { // math tri points scaled
  const base = [[0, 0], [4, 0], [1.4, 2.6]];
  const P1 = base.map(([x, y]) => [22 + x * 22 * small, 205 - y * 22 * small]);
  const off = 22 + 4 * 22 * small + 34;
  const P2 = base.map(([x, y]) => [off + x * 22 * big, 205 - y * 22 * big]);
  const lab = (P, L) => { const g = [(P[0][0] + P[1][0] + P[2][0]) / 3, (P[0][1] + P[1][1] + P[2][1]) / 3]; let s = sPoly(P); for (let i = 0; i < 3; i++) { if (!L[i]) continue; const A = P[i], Bp = P[(i + 1) % 3]; const m = [(A[0] + Bp[0]) / 2, (A[1] + Bp[1]) / 2]; const u = unit(g, m); const an = u[0] > 0.35 ? 'start' : u[0] < -0.35 ? 'end' : 'middle'; s += sT(m[0] + u[0] * (an === 'middle' ? 14 : 7), m[1] + u[1] * 13, L[i], { fs: 13, a: an }); } return s; };
  return svgWrap(360, 240, lab(P1, labS) + lab(P2, labB));
}
topic('y10-similar-shapes', 'geometry', 10, 2, 'FH', 'Similar Shapes', 'Scale factors, missing lengths and area scale factors of similar shapes.', [
  ['Missing lengths in similar shapes',
    'Similar shapes have the same angles and their lengths are in the same ratio. Find the scale factor from a pair of corresponding sides, then multiply (or divide) to find the missing length.',
    (r) => {
      const k = r.pick([1.5, 2, 2.5, 3, 4]); const s = [r.int(2, 8) * 2, r.int(2, 8) * 2, r.int(2, 8) * 2]; const t = s.map((v) => v * k);
      const known = r.int(0, 2); let ask; do { ask = r.int(0, 2); } while (ask === known); const up = r.chance();
      const labS = ['', '', ''], labB = ['', '', ''];
      labS[known] = `${s[known]} cm`; labB[known] = `${ds(t[known])} cm`;
      if (up) { labS[ask] = `${s[ask]} cm`; labB[ask] = 'x'; } else { labS[ask] = 'x'; labB[ask] = `${ds(t[ask])} cm`; }
      const v = up ? t[ask] : s[ask];
      const pre = r.pick(['The two triangles are similar.', 'Triangle A and triangle B are similar.', 'The diagram shows two similar triangles.', 'A logo uses two similar triangles.']);
      return { html: `${pre} In the smaller triangle a side is ${s[known]} cm; the corresponding side in the larger triangle is ${ds(t[known])} cm. Work out the length ${B('<i>x</i>')}.`, diagram: simSvg(1.25, 1.95, labS, labB), answerLabel: 'x =', unit: 'cm', ...nAns(v, { unit: 'cm' }), hint: 'Find the scale factor from the pair of sides you know in both shapes.',
        steps: [`Scale factor = ${ds(t[known])} ÷ ${s[known]} = ${ps(k)}`, up ? `x = ${s[ask]} × ${ps(k)}` : `x = ${ds(t[ask])} ÷ ${ps(k)}`, `x = ${B(ds(v))} cm`] };
    }],
  ['Finding the scale factor',
    'Scale factor = length on the new shape ÷ corresponding length on the original shape. A scale factor less than 1 means the shape gets smaller.',
    (r) => {
      const k = r.pick([1.5, 2, 2.5, 3, 4, 0.5, 0.25, 5]); const a = r.int(2, 12) * 4; const b = a * k;
      return { html: `Shape B is an enlargement of shape A. A side of length ${B(a + ' cm')} on shape A corresponds to a side of length ${B(ds(b) + ' cm')} on shape B. Work out the scale factor of the enlargement.`, ...nAns(k), hint: 'New length ÷ original length.',
        steps: [`Scale factor = ${ds(b)} ÷ ${a}`, `= ${B(ps(k))}`] };
    }],
  ['Area of similar shapes',
    'If lengths are multiplied by a scale factor k, areas are multiplied by k². (Volumes are multiplied by k³.)',
    (r) => {
      const k = r.int(2, 5); const A = r.int(3, 40); const vol = r.chance(0.35);
      return { html: `Two shapes are mathematically similar. The lengths of the larger shape are ${B(k + ' times')} the lengths of the smaller shape. The ${vol ? 'volume' : 'area'} of the smaller shape is ${B(A + (vol ? ' cm³' : ' cm²'))}. Work out the ${vol ? 'volume' : 'area'} of the larger shape.`, unit: vol ? 'cm³' : 'cm²', ...nAns(A * k ** (vol ? 3 : 2), { unit: vol ? 'cm³' : 'cm²' }), hint: vol ? 'Volume scale factor = k³.' : 'Area scale factor = k².',
        steps: [`Length scale factor = ${k}`, `${vol ? 'Volume' : 'Area'} scale factor = ${k}<sup>${vol ? 3 : 2}</sup> = ${k ** (vol ? 3 : 2)}`, `${A} × ${k ** (vol ? 3 : 2)} = ${B(A * k ** (vol ? 3 : 2))} ${vol ? 'cm³' : 'cm²'}`] };
    }],
]);

topic('y10-quadratic-sequences', 'algebra', 10, 3, 'FH', 'Quadratic Sequences', 'Continue quadratic sequences and find their nth term.', [
  ['Next term of a quadratic sequence',
    'In a quadratic sequence the first differences change, but the second differences are constant. Use the second difference to find the next first difference, then the next term.',
    (r) => {
      const a = r.pick([1, 1, 2, 3, -1]), b = r.int(-5, 5), c = r.int(-6, 8); const T = (n) => a * n * n + b * n + c; const ts = [1, 2, 3, 4, 5].map(T);
      const d1 = ts.slice(1).map((v, i) => v - ts[i]);
      return { html: `Here are the first five terms of a quadratic sequence:<br>${B(ts.map((v) => ds(v)).join(', &nbsp;'))}<br>Find the next term.`, ...nAns(T(6)), hint: 'Look at the differences between the differences.',
        steps: [`First differences: ${d1.map((v) => ds(v)).join(', ')}`, `Second difference: ${ds(2 * a)}, so the next first difference is ${ds(d1[3])}${pm(2 * a)} = ${ds(d1[3] + 2 * a)}`, `Next term = ${ds(ts[4])}${pm(d1[3] + 2 * a)} = ${B(ds(T(6)))}`] };
    }],
  ['nth term of a quadratic sequence',
    'Halve the second difference to get a, the coefficient of n². Subtract an² from each term; what is left is a linear sequence bn + c. Find its nth term and add it on.',
    (r) => {
      const a = r.pick([1, 1, 2, 3]), b = r.int(-6, 6), c = r.int(-6, 8); const T = (n) => a * n * n + b * n + c; const ts = [1, 2, 3, 4, 5].map(T);
      const resid = [1, 2, 3, 4, 5].map((n) => T(n) - a * n * n); const ans = quad(a, b, c, 'n');
      return { html: `Find an expression for the ${B('<i>n</i>th term')} of this quadratic sequence:<br>${B(ts.map((v) => ds(v)).join(', &nbsp;'))}`, answerLabel: 'nth term =', ...eAns(ans, { vars: ['n'] }), format: 'Type an expression in n, e.g. n^2+3n-1', hint: 'Second difference ÷ 2 gives the number in front of n².',
        steps: [`Second difference = ${2 * a}, so a = ${a}: the sequence starts ${tx(coefT(a, 'n^2'))}`, `Subtract ${tx(coefT(a, 'n^2'))}: ${resid.map((v) => ds(v)).join(', ')}`, `This linear sequence has nth term ${tx(lin(b, c, 'n'))}`, `nth term = ${B(tx(ans))}`] };
    }],
  ['Terms from the nth term',
    'Substitute the position number into the nth term formula. Remember to square n before multiplying by its coefficient.',
    (r) => {
      const a = r.pick([1, 2, 3, -1]), b = r.int(-8, 8), c = r.int(-10, 10); const k = r.int(6, 20); const v = a * k * k + b * k + c;
      return { html: `The nth term of a sequence is ${B(tx(quad(a, b, c, 'n')))}. Work out the ${B(ord(k))} term.`, ...nAns(v), hint: `Substitute n = ${k}.`,
        steps: [`Substitute n = ${k}: ${a === 1 ? '' : a === -1 ? '−' : a + ' × '}${k}<sup>2</sup>${b ? pm(b) + ' × ' + k : ''}${c ? pm(c) : ''}`, `= ${ds(a * k * k)}${b ? pm(b * k) : ''}${c ? pm(c) : ''}`, `= ${B(ds(v))}`] };
    }],
]);

topic('y10-proportion', 'ratio', 10, 3, 'FH', 'Direct & Inverse Proportion', 'Form and use equations for direct and inverse proportion.', [
  ['Direct proportion (y ∝ x)',
    'If y is directly proportional to x, then y = kx. Use the given pair of values to find k, then use the equation to find the unknown.',
    (r) => {
      const k = r.pick([1.5, 2, 2.5, 3, 4, 5, 6, 0.5, 7]); const x1 = r.int(2, 12) * 2, x2 = r.int(2, 20) * 2; const y1 = k * x1, y2 = k * x2;
      return { html: `${B('<i>y</i>')} is directly proportional to ${B('<i>x</i>')}. When <i>x</i> = ${x1}, <i>y</i> = ${ds(y1)}. Find <i>y</i> when <i>x</i> = ${x2}.`, answerLabel: 'y =', ...nAns(y2), hint: 'y = kx: find k first.',
        steps: [`y = kx, so ${ds(y1)} = k × ${x1} and k = ${ps(k)}`, `y = ${ps(k)}x`, `When x = ${x2}: y = ${ps(k)} × ${x2} = ${B(ds(y2))}`] };
    }],
  ['y proportional to x²',
    'If y is proportional to the square of x, then y = kx². Substitute the known values to find k, then use the equation.',
    (r) => {
      const k = r.pick([2, 3, 4, 5, 0.5, 1.5, 2.5]); let x1, x2; do { x1 = r.int(2, 10); x2 = r.int(2, 12); } while (x1 === x2 || !Number.isInteger(k * x1 * x1) || !Number.isInteger(k * x2 * x2)); const y1 = k * x1 * x1, y2 = k * x2 * x2;
      return { html: `${B('<i>y</i>')} is directly proportional to ${B('<i>x</i>²')}. When <i>x</i> = ${x1}, <i>y</i> = ${ds(y1)}. Find <i>y</i> when <i>x</i> = ${x2}.`, answerLabel: 'y =', ...nAns(y2), hint: 'y = kx²: find k first.',
        steps: [`y = kx², so ${ds(y1)} = k × ${x1}<sup>2</sup> = ${x1 * x1}k and k = ${ps(k)}`, `y = ${ps(k)}x²`, `When x = ${x2}: y = ${ps(k)} × ${x2 * x2} = ${B(ds(y2))}`] };
    }],
  ['Inverse proportion (y ∝ 1/x)',
    'If y is inversely proportional to x, then y = k/x (so xy = k is constant). As one doubles, the other halves.',
    (r) => {
      const k = r.pick([12, 24, 36, 48, 60, 72, 120, 144, 180, 240, 360]); const divs = []; for (let d = 2; d <= k / 2; d++) if (k % d === 0) divs.push(d);
      let x1, x2; do { x1 = r.pick(divs); x2 = r.pick(divs); } while (x1 === x2);
      return { html: `${B('<i>y</i>')} is inversely proportional to ${B('<i>x</i>')}. When <i>x</i> = ${x1}, <i>y</i> = ${k / x1}. Find <i>y</i> when <i>x</i> = ${x2}.`, answerLabel: 'y =', ...nAns(k / x2), hint: 'y = k/x: find k first.',
        steps: [`y = ${frac('k', 'x')}, so k = x × y = ${x1} × ${k / x1} = ${k}`, `y = ${frac(k, 'x')}`, `When x = ${x2}: y = ${k} ÷ ${x2} = ${B(k / x2)}`] };
    }],
  ['Inverse square proportion',
    'If y is inversely proportional to x², then y = k/x². Find k = y × x² from the known values, then substitute.',
    (r) => {
      let x1, x2, k; do { x1 = r.int(1, 6); x2 = r.int(1, 8); k = r.pick([36, 72, 144, 288, 400, 576, 720, 900, 1800, 3600]); } while (x1 === x2 || (k / (x1 * x1)) % 1 || (k / (x2 * x2)) % 0.5);
      const y1 = k / (x1 * x1), y2 = k / (x2 * x2);
      return { html: `${B('<i>y</i>')} is inversely proportional to ${B('<i>x</i>²')}. When <i>x</i> = ${x1}, <i>y</i> = ${ds(y1)}. Find <i>y</i> when <i>x</i> = ${x2}.`, answerLabel: 'y =', ...nAns(y2), hint: 'y = k/x²: find k first.',
        steps: [`y = ${frac('k', 'x<sup>2</sup>')}, so k = ${ds(y1)} × ${x1}<sup>2</sup> = ${k}`, `When x = ${x2}: y = ${k} ÷ ${x2 * x2}`, `y = ${B(ds(y2))}`] };
    }],
]);

topic('y10-tree-diagrams', 'probability', 10, 3, 'FH', 'Combined Events & Tree Diagrams', 'Use tree diagrams for independent events: AND means multiply, OR means add.', [
  ['Both events (AND)',
    'For independent events, multiply along the branches: P(A and B) = P(A) × P(B). The probabilities on each pair of branches add up to 1.',
    (r) => {
      const d1 = r.int(3, 10), d2 = r.int(3, 10); const n1 = r.int(1, d1 - 1), n2 = r.int(1, d2 - 1); const neither = r.chance(0.35);
      const [a, b] = neither ? [d1 - n1, d2 - n2] : [n1, n2];
      return { html: `The probability that it rains on Saturday is ${B(frac(n1, d1))}. The probability that it rains on Sunday is ${B(frac(n2, d2))}. The events are independent. Find the probability that it rains on ${B(neither ? 'neither day' : 'both days')}.`, diagram: treeSvg([`${n1}/${d1}`, `${d1 - n1}/${d1}`], [[`${n2}/${d2}`, `${d2 - n2}/${d2}`], [`${n2}/${d2}`, `${d2 - n2}/${d2}`]], [['Rain', 'No rain'], ['Rain', 'No rain']]),
        ...fAns(a * b, d1 * d2), hint: 'Multiply along the branches.',
        steps: [neither ? `P(no rain Sat) = 1 − ${frac(n1, d1)} = ${frac(a, d1)}, P(no rain Sun) = 1 − ${frac(n2, d2)} = ${frac(b, d2)}` : `Follow the “Rain, Rain” branches.`, `P = ${frac(a, d1)} × ${frac(b, d2)} = ${frS(a * b, d1 * d2)}`] };
    }],
  ['Exactly one / at least one',
    'Add the probabilities of the separate routes (OR means add). For “at least one”, it is quicker to use 1 − P(none).',
    (r) => {
      const d1 = r.int(3, 10), d2 = r.int(3, 10); const n1 = r.int(1, d1 - 1), n2 = r.int(1, d2 - 1); const atLeast = r.chance();
      const N = atLeast ? d1 * d2 - (d1 - n1) * (d2 - n2) : n1 * (d2 - n2) + (d1 - n1) * n2;
      return { html: `The probability that Ana is late for school is ${B(frac(n1, d1))}. The probability that Ben is late is ${B(frac(n2, d2))}. These are independent. Find the probability that ${B(atLeast ? 'at least one of them is late' : 'exactly one of them is late')}.`, diagram: treeSvg([`${n1}/${d1}`, `${d1 - n1}/${d1}`], [[`${n2}/${d2}`, `${d2 - n2}/${d2}`], [`${n2}/${d2}`, `${d2 - n2}/${d2}`]], [['Ana late', 'Ana on time'], ['Ben late', 'Ben on time']]),
        ...fAns(N, d1 * d2), hint: atLeast ? 'Use 1 − P(neither is late).' : 'Two routes: (late, on time) or (on time, late).',
        steps: atLeast ? [`P(neither late) = ${frac(d1 - n1, d1)} × ${frac(d2 - n2, d2)} = ${frac((d1 - n1) * (d2 - n2), d1 * d2)}`, `P(at least one) = 1 − ${frac((d1 - n1) * (d2 - n2), d1 * d2)} = ${frS(N, d1 * d2)}`]
          : [`P(Ana late, Ben on time) = ${frac(n1, d1)} × ${frac(d2 - n2, d2)} = ${frac(n1 * (d2 - n2), d1 * d2)}`, `P(Ana on time, Ben late) = ${frac(d1 - n1, d1)} × ${frac(n2, d2)} = ${frac((d1 - n1) * n2, d1 * d2)}`, `Add: ${frS(N, d1 * d2)}`] };
    }],
  ['With replacement',
    'When an item is replaced, the probabilities stay the same for the second pick. Multiply along each branch, then add the branches you need.',
    (r) => {
      const a = r.int(2, 9), b = r.int(2, 9); const n = a + b; const same = r.chance();
      const N = same ? a * a + b * b : 2 * a * b;
      return { html: `A bag contains ${B(a)} red and ${B(b)} blue beads. A bead is taken at random, its colour noted, and it is put back. A second bead is then taken. Find the probability that the two beads are ${B(same ? 'the same colour' : 'different colours')}.`, diagram: treeSvg([`${a}/${n}`, `${b}/${n}`], [[`${a}/${n}`, `${b}/${n}`], [`${a}/${n}`, `${b}/${n}`]], [['Red', 'Blue'], ['Red', 'Blue']]),
        ...fAns(N, n * n), hint: same ? 'Red-red OR blue-blue.' : 'Red-blue OR blue-red.',
        steps: same ? [`P(R, R) = ${frac(a, n)} × ${frac(a, n)} = ${frac(a * a, n * n)}`, `P(B, B) = ${frac(b, n)} × ${frac(b, n)} = ${frac(b * b, n * n)}`, `Add: ${frS(N, n * n)}`]
          : [`P(R, B) = ${frac(a, n)} × ${frac(b, n)} = ${frac(a * b, n * n)}`, `P(B, R) = ${frac(b, n)} × ${frac(a, n)} = ${frac(a * b, n * n)}`, `Add: ${frS(N, n * n)}`] };
    }],
]);

function groupedData(r) {
  const w = r.pick([5, 10, 20]); const k = r.int(4, 5); const start = r.pick([0, 0, w, 2 * w]); let fs; do { fs = Array.from({ length: k }, () => r.int(2, 16)); } while (fs.filter((f) => f === Math.max(...fs)).length > 1);
  const cls = fs.map((f, i) => [start + i * w, start + (i + 1) * w]);
  const v = r.pick([['Time (t minutes)', 't'], ['Height (h cm)', 'h'], ['Mass (m kg)', 'm']]);
  const rows = cls.map(([a, b], i) => [`${a} &lt; <i>${v[1]}</i> ≤ ${b}`, fs[i]]);
  return { w, cls, fs, v, tbl: table([[v[0], 'Frequency'], ...rows]) };
}
const classAccept = (a, b, x) => [`${a}<${x}<=${b}`, `${a}<x<=${b}`, `${a}-${b}`, `${a}to${b}`, `${a}<${x}≤${b}`];
topic('y10-grouped-data', 'statistics', 10, 3, 'FH', 'Grouped Data', 'Estimate the mean and identify the modal and median classes from grouped frequency tables.', [
  ['Estimated mean from grouped data',
    'You do not know the exact values, so use the midpoint of each class. Multiply each midpoint by its frequency, add these up, and divide by the total frequency.',
    (r) => {
      const G = groupedData(r); const mids = G.cls.map(([a, b]) => (a + b) / 2); const F = sum(G.fs), FX = sum(mids.map((m, i) => m * G.fs[i])); const m = FX / F;
      return { html: `The table shows information about some data.${G.tbl}Work out an estimate for the mean. Give your answer to 1 decimal place.`, ...nAns(m, { dp: 1 }), format: dpFmt(1), hint: 'Use the midpoint of each class.',
        steps: [`Midpoints: ${mids.map((v) => ds(v)).join(', ')}`, `Σ(midpoint × f) = ${mids.map((v, i) => `${ds(v)}×${G.fs[i]}`).join(' + ')} = ${ds(FX)}`, `Σf = ${F}`, `Estimated mean = ${ds(FX)} ÷ ${F} = ${fx(m, 4)}… = ${B(r1(m))}`] };
    }],
  ['Modal class',
    'The modal class is the class (group) with the highest frequency. Write it exactly as it appears in the table.',
    (r) => {
      const G = groupedData(r); const i = G.fs.indexOf(Math.max(...G.fs)); const [a, b] = G.cls[i];
      return { html: `The table shows information about some data.${G.tbl}Write down the modal class.`, answer: `${a}<${G.v[1]}<=${b}`, check: { type: 'text', accept: classAccept(a, b, G.v[1]) }, answerHtml: B(`${a} &lt; <i>${G.v[1]}</i> ≤ ${b}`), format: `Type the class, e.g. ${G.cls[0][0]}<${G.v[1]}<=${G.cls[0][1]} or ${G.cls[0][0]}-${G.cls[0][1]}`, hint: 'Which class has the biggest frequency?',
        steps: [`The highest frequency is ${G.fs[i]}.`, `Modal class: ${B(`${a} &lt; <i>${G.v[1]}</i> ≤ ${b}`)}`] };
    }],
  ['Class containing the median',
    'Find the position of the median: (n + 1) ÷ 2 where n is the total frequency. Add up the frequencies until the running total reaches that position.',
    (r) => {
      const G = groupedData(r); const n = sum(G.fs); const pos = (n + 1) / 2; let c = 0, idx = -1; const cum = []; G.fs.forEach((f, i) => { c += f; cum.push(c); if (idx < 0 && c >= pos) idx = i; });
      const [a, b] = G.cls[idx];
      return { html: `The table shows information about some data.${G.tbl}Find the class that contains the median.`, answer: `${a}<${G.v[1]}<=${b}`, check: { type: 'text', accept: classAccept(a, b, G.v[1]) }, answerHtml: B(`${a} &lt; <i>${G.v[1]}</i> ≤ ${b}`), format: `Type the class, e.g. ${G.cls[0][0]}<${G.v[1]}<=${G.cls[0][1]} or ${G.cls[0][0]}-${G.cls[0][1]}`, hint: 'Work out the median position first.',
        steps: [`Total frequency n = ${n}, so the median is the ${Number.isInteger(pos) ? ord(pos) : ps(pos) + 'th'} value.`, `Running totals: ${cum.join(', ')}`, `The ${Number.isInteger(pos) ? ord(pos) : ps(pos) + 'th'} value is in the class ${B(`${a} &lt; <i>${G.v[1]}</i> ≤ ${b}`)}`] };
    }],
]);

// ============================================================================
// YEAR 11
// ============================================================================
const recur = (digits) => [...String(digits)].map((d) => d + '̇').join('');
topic('y11-recurring-decimals', 'number', 11, 1, 'H', 'Recurring Decimals to Fractions', 'Convert recurring decimals into fractions using algebra.', [
  ['Purely recurring decimals',
    'Let x equal the decimal. Multiply by 10 if one digit recurs (100 if two digits recur) so the recurring parts line up. Subtract to remove the recurring part, then solve for x and simplify.',
    (r) => {
      const two = r.chance(); let R0; do { R0 = two ? r.int(1, 98) : r.int(1, 8); } while (two && R0 % 11 === 0);
      const k = two ? 2 : 1; const D = 10 ** k - 1; const Rs = two ? String(R0).padStart(2, '0') : String(R0);
      const disp = two ? `0.${Rs[0]}̇${Rs[1]}̇` : `0.${recur(Rs)}`; const long = `0.${Rs.repeat(two ? 3 : 4)}…`;
      return { html: `Write ${B(disp)} (= ${long}) as a fraction in its simplest form.`, ...fAns(R0, D), hint: `Multiply by ${10 ** k} so the recurring digits line up.`,
        steps: [`Let x = ${long}`, `${10 ** k}x = ${R0}.${Rs.repeat(two ? 3 : 4)}…`, `Subtract: ${D}x = ${R0}, so x = ${frac(R0, D)}`, gcd(R0, D) > 1 ? `Simplify: ${B(fracS(R0, D))}` : `This is already in its simplest form: ${B(frac(R0, D))}`] };
    }],
  ['Decimals with a non-recurring part',
    'When some digits do not recur, use two multiples of x whose recurring parts line up (e.g. 100x and 10x for 0.16̇). Subtract, solve for x, then simplify.',
    (r) => {
      const two = r.chance(0.4); const d = r.int(1, 9); let R0; do { R0 = two ? r.int(1, 98) : r.int(0, 9); } while (two ? (R0 % 11 === 0 || R0 % 10 === d) : R0 === d);
      const k = two ? 2 : 1; const Rs = two ? String(R0).padStart(2, '0') : String(R0);
      const num = d * 10 ** k + R0 - d, den = 10 * (10 ** k - 1);
      const disp = two ? `0.${d}${Rs[0]}̇${Rs[1]}̇` : `0.${d}${Rs}̇`; const long = `0.${d}${Rs.repeat(two ? 3 : 4)}…`;
      const hi = 10 ** (k + 1);
      return { html: `Write ${B(disp)} (= ${long}) as a fraction in its simplest form.`, ...fAns(num, den), hint: `Compare ${hi}x and 10x.`,
        steps: [`Let x = ${long}`, `${hi}x = ${d}${Rs}.${Rs.repeat(3)}… and 10x = ${d}.${Rs.repeat(3)}…`, `Subtract: ${hi - 10}x = ${d * 10 ** k + R0} − ${d} = ${num}`, `x = ${frac(num, den)} = ${B(fracS(num, den))}`] };
    }],
]);

topic('y11-bounds', 'number', 11, 1, 'H', 'Upper & Lower Bounds', 'Find bounds of measurements and of calculations.', [
  ['Bounds of a measurement',
    'A measurement rounded to the nearest unit could be up to half a unit either side. Lower bound = value − ½ unit, upper bound = value + ½ unit.',
    (r) => {
      const [u, desc, unitS] = r.pick([[1, 'to the nearest cm', 'cm'], [10, 'to the nearest 10 m', 'm'], [0.1, 'to 1 decimal place', 'kg'], [5, 'to the nearest 5 g', 'g'], [100, 'to the nearest 100 people', ''], [0.01, 'to 2 decimal places', 's']]);
      const v = rnd(r.int(12, 99) * u, 2); const up = r.chance(); const ans = rnd(up ? v + u / 2 : v - u / 2, 4);
      return { html: `A value is ${B(ds(v) + (unitS ? ' ' + unitS : ''))}, correct ${desc}. Write down the ${B(up ? 'upper' : 'lower')} bound.`, unit: unitS, ...nAns(ans, { unit: unitS }), hint: `Half of ${ds(u)} is ${ds(u / 2)}.`,
        steps: [`The value is rounded ${desc}, so the error is up to ${ds(u / 2)} either way.`, `${up ? 'Upper' : 'Lower'} bound = ${ds(v)} ${up ? '+' : '−'} ${ds(u / 2)} = ${B(ds(ans))}`] };
    }],
  ['Bounds of area & perimeter',
    'For the upper bound of a sum or product, use the upper bounds of every measurement. For the lower bound, use all the lower bounds.',
    (r) => {
      const a = r.int(4, 30), b = r.int(3, 25); const up = r.chance(); const area = r.chance(); const A = up ? a + 0.5 : a - 0.5, Bv = up ? b + 0.5 : b - 0.5; const v = area ? A * Bv : 2 * (A + Bv);
      return { html: `A rectangle has length ${B(a + ' cm')} and width ${B(b + ' cm')}, both measured to the nearest centimetre. Work out the ${B(up ? 'upper' : 'lower')} bound for its ${area ? 'area' : 'perimeter'}.`, unit: area ? 'cm²' : 'cm', ...nAns(v, { unit: area ? 'cm²' : 'cm' }), hint: `Use the ${up ? 'upper' : 'lower'} bound of each length.`,
        steps: [`${up ? 'Upper' : 'Lower'} bounds: length ${ds(A)} cm, width ${ds(Bv)} cm`, area ? `Area = ${ds(A)} × ${ds(Bv)}` : `Perimeter = 2 × (${ds(A)} + ${ds(Bv)})`, `= ${B(ds(v))} ${area ? 'cm²' : 'cm'}`] };
    }],
  ['Bounds of a division',
    'For the upper bound of a ÷ b, use the upper bound of a and the LOWER bound of b (dividing by a smaller number gives a bigger answer). Swap them for the lower bound.',
    (r) => {
      const D = r.int(20, 80) * 5, T = r.int(15, 60) / 10; const up = r.chance(); const Dv = up ? D + 2.5 : D - 2.5, Tv = up ? T - 0.05 : T + 0.05; const s = Dv / Tv;
      return { html: `A car travels ${B(D + ' km')}, correct to the nearest 5 km, in ${B(ds(T) + ' hours')}, correct to 1 decimal place. Work out the ${B(up ? 'upper' : 'lower')} bound of its average speed. Give your answer to 2 decimal places.`, unit: 'km/h', ...nAns(s, { dp: 2, unit: 'km/h' }), format: dpFmt(2), hint: up ? 'Biggest distance ÷ smallest time.' : 'Smallest distance ÷ biggest time.',
        steps: [`Distance bounds: ${ds(D - 2.5)} to ${ds(D + 2.5)} km; time bounds: ${ds(T - 0.05)} to ${ds(T + 0.05)} h`, `${up ? 'Upper' : 'Lower'} bound of speed = ${ds(Dv)} ÷ ${ds(Tv)}`, `= ${fx(s, 4)}… = ${B(r2(s))} km/h`] };
    }],
]);

topic('y11-quadratic-formula', 'algebra', 11, 1, 'H', 'The Quadratic Formula', 'Solve quadratic equations using the formula.', [
  ['Quadratic formula (a = 1)',
    'For ax² + bx + c = 0, x = (−b ± √(b² − 4ac)) ÷ 2a. Write down a, b and c carefully (with their signs), work out b² − 4ac first, then find both solutions.',
    (r) => {
      let b, c, D; do { b = r.int(-9, 9); c = r.nz(-12, 12); D = b * b - 4 * c; } while (D <= 0 || Number.isInteger(Math.sqrt(D)));
      const x1 = (-b + Math.sqrt(D)) / 2, x2 = (-b - Math.sqrt(D)) / 2;
      return { html: `Solve ${B(tx(`${quad(1, b, c)}=0`))}. Give your solutions to 2 decimal places.`, answer: `${r2(x1)}, ${r2(x2)}`, check: { type: 'pair', values: [x1, x2], tol: 0.006 }, answerHtml: B(`<i>x</i> = ${dfx(x1, 2)} or <i>x</i> = ${dfx(x2, 2)}`), format: 'Give both solutions to 2 d.p., separated by a comma, e.g. 1.24, -3.24', hint: `a = 1, b = ${ds(b)}, c = ${ds(c)}.`,
        steps: [`a = 1, b = ${ds(b)}, c = ${ds(c)}`, `b² − 4ac = ${br(b)}<sup>2</sup> − 4 × 1 × ${br(c)} = ${D}`, `x = ${frac(`${ds(-b)} ± ${sq(D)}`, 2)}`, `x = ${B(dfx(x1, 2))} or x = ${B(dfx(x2, 2))}`] };
    }],
  ['Quadratic formula (a ≠ 1)',
    'Use the same formula, taking care that the denominator is 2a and that −b changes the sign of b. Use brackets when substituting negative numbers.',
    (r) => {
      let a, b, c, D; do { a = r.int(2, 5) * r.pick([1, 1, 1, -1]); b = r.int(-9, 9); c = r.nz(-9, 9); D = b * b - 4 * a * c; } while (D <= 0 || Number.isInteger(Math.sqrt(D)));
      const x1 = (-b + Math.sqrt(D)) / (2 * a), x2 = (-b - Math.sqrt(D)) / (2 * a);
      return { html: `Solve ${B(tx(`${quad(a, b, c)}=0`))}. Give your solutions to 2 decimal places.`, answer: `${r2(x1)}, ${r2(x2)}`, check: { type: 'pair', values: [x1, x2], tol: 0.006 }, answerHtml: B(`<i>x</i> = ${dfx(x1, 2)} or <i>x</i> = ${dfx(x2, 2)}`), format: 'Give both solutions to 2 d.p., separated by a comma', hint: `a = ${ds(a)}, b = ${ds(b)}, c = ${ds(c)}.`,
        steps: [`a = ${ds(a)}, b = ${ds(b)}, c = ${ds(c)}`, `b² − 4ac = ${br(b)}<sup>2</sup> − 4 × ${br(a)} × ${br(c)} = ${D}`, `x = ${frac(`${ds(-b)} ± ${sq(D)}`, ds(2 * a))}`, `x = ${B(dfx(x1, 2))} or x = ${B(dfx(x2, 2))}`] };
    }],
]);

topic('y11-completing-square', 'algebra', 11, 1, 'H', 'Completing the Square', 'Write quadratics in completed-square form and find turning points.', [
  ['Completing the square',
    'x² + bx + c = (x + b/2)² − (b/2)² + c. Halve the coefficient of x to get p, then q = c − p².',
    (r) => {
      const p = r.nz(-8, 8), c = r.int(-15, 20); const b = 2 * p, q = c - p * p;
      return { html: `Write ${B(tx(quad(1, b, c)))} in the form ${B('(<i>x</i> + <i>p</i>)<sup>2</sup> + <i>q</i>')}. Give the values of <i>p</i> and <i>q</i>.`, answer: `${p}, ${q}`, check: { type: 'pair', values: [p, q], ordered: true }, answerHtml: B(`${tx(`(${lin(1, p)})^2${q ? pmT(q) : ''}`)} &nbsp; (p = ${ds(p)}, q = ${ds(q)})`), format: 'Type p then q, e.g. 3, -5', hint: `Halve ${ds(b)}.`,
        steps: [`Halve the x coefficient: p = ${ds(b)} ÷ 2 = ${ds(p)}`, `${tx(`(${lin(1, p)})^2`)} = ${tx(quad(1, b, p * p))}, so subtract ${p * p}`, `q = ${ds(c)} − ${p * p} = ${ds(q)}`, `${B(tx(`(${lin(1, p)})^2${q ? pmT(q) : ''}`))}`] };
    }],
  ['Turning point from completed square',
    'For y = (x + p)² + q, the turning point (minimum) is at (−p, q). Complete the square first, then read it off.',
    (r) => {
      const p = r.nz(-8, 8), c = r.int(-15, 20); const b = 2 * p, q = c - p * p;
      return { html: `Find the coordinates of the turning point of ${B(tx(`y=${quad(1, b, c)}`))}.`, answer: `${-p}, ${q}`, check: { type: 'pair', values: [-p, q], ordered: true }, answerHtml: B(`(${ds(-p)}, ${ds(q)})`), format: 'Type the coordinates, e.g. (3, -5) or 3, -5', hint: 'Complete the square first.',
        steps: [`Complete the square: y = ${tx(`(${lin(1, p)})^2${q ? pmT(q) : ''}`)}`, `The minimum is when ${tx(lin(1, p))} = 0, i.e. x = ${ds(-p)}, giving y = ${ds(q)}`, `Turning point: ${B(`(${ds(-p)}, ${ds(q)})`)}`] };
    }],
  ['Completing the square with a ≠ 1',
    'Take out the coefficient of x² as a factor from the x² and x terms first: ax² + bx + c = a[x² + (b/a)x] + c. Complete the square inside, then multiply back out.',
    (r) => {
      const a = r.int(2, 4), p = r.nz(-5, 5), c = r.int(-10, 20); const b = 2 * a * p, q = c - a * p * p;
      return { html: `Write ${B(tx(quad(a, b, c)))} in the form ${B(`${a}(<i>x</i> + <i>p</i>)<sup>2</sup> + <i>q</i>`)}. Give the values of <i>p</i> and <i>q</i>.`, answer: `${p}, ${q}`, check: { type: 'pair', values: [p, q], ordered: true }, answerHtml: B(`${tx(`${a}(${lin(1, p)})^2${q ? pmT(q) : ''}`)} &nbsp; (p = ${ds(p)}, q = ${ds(q)})`), format: 'Type p then q, e.g. 3, -5', hint: `Factor out ${a} from the first two terms.`,
        steps: [`${tx(quad(a, b, c))} = ${tx(`${a}(${polyT([[1, 'x^2'], [2 * p, 'x']])})${pmT(c)}`)}`, `Complete the square inside: ${tx(`${polyT([[1, 'x^2'], [2 * p, 'x']])}=(${lin(1, p)})^2-${p * p}`)}`, `So ${tx(`${a}(${lin(1, p)})^2-${a * p * p}${pmT(c)}`)} = ${B(tx(`${a}(${lin(1, p)})^2${q ? pmT(q) : ''}`))}`] };
    }],
  ['Completing the square with an odd x coefficient',
    'Halving an odd number gives a fraction: x² + 5x = (x + 5/2)² − 25/4. Work carefully with the fractions to find q.',
    (r) => {
      let b; do { b = r.int(-9, 9); } while (b % 2 === 0); const c = r.int(-10, 12); const qn = 4 * c - b * b; // q = qn/4
      const pT = fracT(b, 2), qT = fracT(qn, 4);
      return { html: `Write ${B(tx(quad(1, b, c)))} in the form ${B('(<i>x</i> + <i>p</i>)<sup>2</sup> + <i>q</i>')}. Give the values of <i>p</i> and <i>q</i> (fractions are fine).`, answer: `${pT}, ${qT}`, check: { type: 'pair', values: [b / 2, qn / 4], ordered: true }, answerHtml: B(`p = ${fracS(b, 2)}, q = ${fracS(qn, 4)}`), format: 'Type p then q, e.g. 5/2, -13/4 (decimals are fine too)', hint: `Halve ${ds(b)}: p = ${ds(b)} ÷ 2.`,
        steps: [`p = ${ds(b)} ÷ 2 = ${fracS(b, 2)}`, `p² = ${frac(b * b, 4)}`, `q = ${ds(c)} − ${frac(b * b, 4)} = ${fracN(4 * c, 4)} − ${frac(b * b, 4)} = ${fracS(qn, 4)}`, `${B(`p = ${fracS(b, 2)}, q = ${fracS(qn, 4)}`)}`] };
    }],
]);

function triDraw(a, b, c, o) { const P = fit(triFromSides(a, b, c), 360, 240, 44); return triSvg(P, { v: ['A', 'B', 'C'], ...o }); }
topic('y11-sine-cosine-rule', 'geometry', 11, 1, 'H', 'Sine & Cosine Rules', 'Find missing sides and angles in non-right-angled triangles.', [
  ['Sine rule: missing side',
    'The sine rule: a/sin A = b/sin B = c/sin C. Use it when you know a side and its opposite angle. Lower-case letters are sides, opposite the capital-letter angles.',
    (r) => {
      let A, Bd; do { A = r.int(35, 110); Bd = r.int(25, 80); } while (180 - A - Bd < 20); const C = 180 - A - Bd; const a = r.int(5, 20); const b = a * sinD(Bd) / sinD(A), c = a * sinD(C) / sinD(A);
      return { html: `In triangle ABC, angle A = ${B(A + '°')}, angle B = ${B(Bd + '°')} and BC = ${B(a + ' cm')}. Work out the length of AC. Give your answer to 1 decimal place.`, diagram: triDraw(a, b, c, { sides: { 1: `${a} cm`, 2: 'x' }, angles: { 0: `${A}°`, 1: `${Bd}°` }, hi: 2 }), unit: 'cm', ...nAns(b, { dp: 1, unit: 'cm' }), format: dpFmt(1), hint: 'AC is opposite angle B; BC is opposite angle A.',
        steps: [`${frac('AC', 'sin B')} = ${frac('BC', 'sin A')}`, `AC = ${frac(`${a} × sin ${Bd}°`, `sin ${A}°`)}`, `= ${fx(b, 4)}…`, `AC = ${B(r1(b))} cm`] };
    }],
  ['Sine rule: missing angle',
    'Flip the sine rule to find an angle: sin B / b = sin A / a. Rearrange to find sin B, then use sin⁻¹.',
    (r) => {
      let A, a, b; do { A = r.int(30, 85); a = r.int(6, 20); b = r.int(4, a - 1); } while (b * sinD(A) / a > 0.97);
      const Bd = asinD(b * sinD(A) / a); const C = 180 - A - Bd; const c = a * sinD(C) / sinD(A);
      return { html: `In triangle ABC, BC = ${B(a + ' cm')}, AC = ${B(b + ' cm')} and angle A = ${B(A + '°')}. Work out the size of angle B. Give your answer to 1 decimal place.`, diagram: triDraw(a, b, c, { sides: { 1: `${a} cm`, 2: `${b} cm` }, angles: { 0: `${A}°`, 1: 'θ' }, hiA: 1 }), unit: '°', ...nAns(Bd, { dp: 1, unit: '°' }), format: dpFmt(1), hint: 'sin B / AC = sin A / BC.',
        steps: [`${frac('sin B', b)} = ${frac(`sin ${A}°`, a)}`, `sin B = ${frac(`${b} × sin ${A}°`, a)} = ${fx(b * sinD(A) / a, 5)}…`, `B = sin<sup>−1</sup>(${fx(b * sinD(A) / a, 5)}…) = ${fx(Bd, 4)}…`, `B = ${B(r1(Bd) + '°')}`] };
    }],
  ['Cosine rule: missing side',
    'The cosine rule: a² = b² + c² − 2bc cos A. Use it when you know two sides and the angle between them.',
    (r) => {
      const b = r.int(4, 18), c = r.int(4, 18), A = r.int(25, 130); const a = Math.sqrt(b * b + c * c - 2 * b * c * cosD(A));
      return { html: `In triangle ABC, AB = ${B(c + ' cm')}, AC = ${B(b + ' cm')} and angle A = ${B(A + '°')}. Work out the length of BC. Give your answer to 1 decimal place.`, diagram: triDraw(a, b, c, { sides: { 0: `${c} cm`, 1: 'x', 2: `${b} cm` }, angles: { 0: `${A}°` }, hi: 1 }), unit: 'cm', ...nAns(a, { dp: 1, unit: 'cm' }), format: dpFmt(1), hint: 'Two sides and the angle between them → cosine rule.',
        steps: [`BC² = ${b}<sup>2</sup> + ${c}<sup>2</sup> − 2 × ${b} × ${c} × cos ${A}°`, `BC² = ${fx(a * a, 4)}…`, `BC = ${sq(fx(a * a, 4) + '…')} = ${fx(a, 4)}…`, `BC = ${B(r1(a))} cm`] };
    }],
  ['Cosine rule: missing angle',
    'Rearrange the cosine rule: cos A = (b² + c² − a²) ÷ 2bc. Use it when you know all three sides; then use cos⁻¹.',
    (r) => {
      let a, b, c; do { a = r.int(4, 18); b = r.int(4, 18); c = r.int(4, 18); } while (a >= b + c - 1 || b >= a + c - 1 || c >= a + b - 1);
      const cosA = (b * b + c * c - a * a) / (2 * b * c); const A = acosD(cosA);
      return { html: `Triangle ABC has sides BC = ${B(a + ' cm')}, AC = ${B(b + ' cm')} and AB = ${B(c + ' cm')}. Work out the size of angle A. Give your answer to 1 decimal place.`, diagram: triDraw(a, b, c, { sides: { 0: `${c} cm`, 1: `${a} cm`, 2: `${b} cm` }, angles: { 0: 'θ' }, hiA: 0 }), unit: '°', ...nAns(A, { dp: 1, unit: '°' }), format: dpFmt(1), hint: 'Angle A is opposite side BC.',
        steps: [`cos A = ${frac(`${b}<sup>2</sup> + ${c}<sup>2</sup> − ${a}<sup>2</sup>`, `2 × ${b} × ${c}`)} = ${frac(b * b + c * c - a * a, 2 * b * c)}`, `cos A = ${dfx(cosA, 5)}…`, `A = cos<sup>−1</sup>(${dfx(cosA, 5)}…) = ${fx(A, 4)}…`, `A = ${B(r1(A) + '°')}`] };
    }],
]);

topic('y11-area-sine', 'geometry', 11, 1, 'H', 'Area of a Triangle (½ab sin C)', 'Use Area = ½ab sin C for any triangle.', [
  ['Finding the area',
    'Area = ½ab sin C, where a and b are two sides and C is the angle BETWEEN them.',
    (r) => {
      const a = r.int(4, 20), b = r.int(4, 20), C = r.int(20, 150); const A = 0.5 * a * b * sinD(C); const c = Math.sqrt(a * a + b * b - 2 * a * b * cosD(C));
      return { html: `In triangle ABC, BC = ${B(a + ' cm')}, AC = ${B(b + ' cm')} and angle C = ${B(C + '°')}. Work out the area of the triangle. Give your answer to 1 decimal place.`, diagram: triDraw(a, b, c, { sides: { 1: `${a} cm`, 2: `${b} cm` }, angles: { 2: `${C}°` } }), unit: 'cm²', ...nAns(A, { dp: 1, unit: 'cm²' }), format: dpFmt(1), hint: 'Use the two sides either side of the angle.',
        steps: [`Area = ½ × ${a} × ${b} × sin ${C}°`, `= ${fx(A, 4)}…`, `= ${B(r1(A))} cm²`] };
    }],
  ['Finding a side from the area',
    'Substitute the area and the values you know into Area = ½ab sin C, then rearrange to find the missing side.',
    (r) => {
      let a, C, Ar, b; do { a = r.int(4, 20); C = r.int(25, 140); Ar = r.int(15, 120); b = 2 * Ar / (a * sinD(C)); } while (b < 3 || b > 30); const c = Math.sqrt(a * a + b * b - 2 * a * b * cosD(C));
      return { html: `Triangle ABC has area ${B(Ar + ' cm²')}. BC = ${B(a + ' cm')} and angle C = ${B(C + '°')}. Work out the length of AC. Give your answer to 1 decimal place.`, diagram: triDraw(a, b, c, { sides: { 1: `${a} cm`, 2: 'x' }, angles: { 2: `${C}°` }, hi: 2 }), unit: 'cm', ...nAns(b, { dp: 1, unit: 'cm' }), format: dpFmt(1), hint: `${Ar} = ½ × ${a} × x × sin ${C}°.`,
        steps: [`${Ar} = ½ × ${a} × x × sin ${C}°`, `x = ${frac(`2 × ${Ar}`, `${a} × sin ${C}°`)}`, `x = ${fx(b, 4)}… = ${B(r1(b))} cm`] };
    }],
  ['Finding an angle from the area',
    'Rearrange Area = ½ab sin C to get sin C = 2 × Area ÷ (ab), then use sin⁻¹. (This gives the acute angle.)',
    (r) => {
      let a, b, Ar; do { a = r.int(5, 20); b = r.int(5, 20); Ar = r.int(10, 150); } while (2 * Ar / (a * b) > 0.95 || 2 * Ar / (a * b) < 0.15);
      const C = asinD(2 * Ar / (a * b)); const c = Math.sqrt(a * a + b * b - 2 * a * b * cosD(C));
      return { html: `Triangle ABC has area ${B(Ar + ' cm²')}. BC = ${B(a + ' cm')}, AC = ${B(b + ' cm')} and angle C is acute. Work out the size of angle C. Give your answer to 1 decimal place.`, diagram: triDraw(a, b, c, { sides: { 1: `${a} cm`, 2: `${b} cm` }, angles: { 2: 'θ' }, hiA: 2 }), unit: '°', ...nAns(C, { dp: 1, unit: '°' }), format: dpFmt(1), hint: 'sin C = 2 × area ÷ (ab).',
        steps: [`${Ar} = ½ × ${a} × ${b} × sin C`, `sin C = ${frac(2 * Ar, a * b)} = ${fx(2 * Ar / (a * b), 5)}…`, `C = ${fx(C, 4)}… = ${B(r1(C) + '°')}`] };
    }],
]);

topic('y11-rationalising', 'number', 11, 2, 'H', 'Rationalising Denominators', 'Remove surds from the denominator of a fraction.', [
  ['Rationalising a/√b',
    'Multiply the top and bottom by the surd in the denominator: a/√b × √b/√b = a√b/b. Then simplify the fraction if possible.',
    (r) => {
      const bb = r.pick(SQF); const a = r.int(1, 15); const g = gcd(a, bb); const p = a / g, q = bb / g;
      const acc = q === 1 ? surdAcc(p, bb) : (p === 1 ? [`√${bb}/${q}`, `1√${bb}/${q}`] : [`${p}√${bb}/${q}`]);
      const ah = q === 1 ? surdH(p, bb) : frac(surdH(p, bb), q);
      return { html: `Rationalise the denominator and simplify ${B(frac(a, sq(bb)))}`, answer: acc[0], check: { type: 'text', accept: acc }, answerHtml: B(ah), format: 'Type √ as sqrt if needed, e.g. 3√2/4 or 3sqrt2/4', hint: `Multiply top and bottom by ${sq(bb)}.`,
        steps: [`${frac(a, sq(bb))} × ${frac(sq(bb), sq(bb))} = ${frac(surdH(a, bb), bb)}`, g > 1 ? `Simplify by dividing by ${g}: ${B(ah)}` : `This cannot be simplified further: ${B(ah)}`] };
    }],
  ['Rationalising a/(k√b)',
    'Multiply top and bottom by √b only (not by k). The denominator becomes k × b. Then cancel any common factor.',
    (r) => {
      const bb = r.pick(SQF); const k = r.int(2, 5); const a = r.int(2, 20); const D = k * bb; const g = gcd(a, D); const p = a / g, q = D / g;
      const acc = q === 1 ? surdAcc(p, bb) : (p === 1 ? [`√${bb}/${q}`, `1√${bb}/${q}`] : [`${p}√${bb}/${q}`]);
      const ah = q === 1 ? surdH(p, bb) : frac(surdH(p, bb), q);
      return { html: `Rationalise the denominator and simplify ${B(frac(a, k + sq(bb)))}`, answer: acc[0], check: { type: 'text', accept: acc }, answerHtml: B(ah), format: 'Type √ as sqrt if needed, e.g. 5√3/6', hint: `Multiply top and bottom by ${sq(bb)}.`,
        steps: [`${frac(a, k + sq(bb))} × ${frac(sq(bb), sq(bb))} = ${frac(surdH(a, bb), `${k} × ${bb}`)} = ${frac(surdH(a, bb), D)}`, g > 1 ? `Divide top and bottom by ${g}: ${B(ah)}` : `Answer: ${B(ah)}`] };
    }],
]);

topic('y11-functions', 'algebra', 11, 2, 'H', 'Functions', 'Evaluate functions, composite functions and inverse functions.', [
  ['Evaluating functions',
    'f(x) is a rule. To find f(3), replace every x in the rule with 3 (use brackets for negatives) and work it out.',
    (r) => {
      const t = r.int(0, 2); const k = r.nz(-6, 8); let f, v, s;
      if (t === 0) { const a = r.nz(-7, 9), b = r.nz(-12, 12); f = lin(a, b); v = a * k + b; s = `${ds(a)} × ${br(k)}${pm(b)}`; }
      else if (t === 1) { const a = r.int(1, 5), b = r.nz(-10, 10); f = polyT([[a, 'x^2'], [b, '']]); v = a * k * k + b; s = `${a === 1 ? '' : a + ' × '}${br(k)}<sup>2</sup>${pm(b)}`; }
      else { const b = r.nz(-6, 6), c = r.nz(-10, 10); f = quad(1, b, c); v = k * k + b * k + c; s = `${br(k)}<sup>2</sup>${pm(b)} × ${br(k)}${pm(c)}`; }
      return { html: `${B(`f(<i>x</i>) = ${tx(f)}`)}. Work out ${B(`f(${ds(k)})`)}.`, ...nAns(v), hint: `Substitute x = ${ds(k)}.`, steps: [`f(${ds(k)}) = ${s}`, `= ${B(ds(v))}`] };
    }],
  ['Composite functions',
    'fg(x) means do g first, then put the result into f. Work from the inside out: find g(a) first, then f of that answer.',
    (r) => {
      const a = r.nz(-5, 6), b = r.nz(-9, 9); const c = r.int(1, 4), d = r.nz(-9, 9); const k = r.nz(-4, 5);
      const f = (x) => a * x + b, g = (x) => c * x * x + d; const fg = r.chance();
      const inner = fg ? g(k) : f(k), outer = fg ? f(inner) : g(inner);
      const fT = lin(a, b), gT = polyT([[c, 'x^2'], [d, '']]);
      return { html: `${B(`f(<i>x</i>) = ${tx(fT)}`)} and ${B(`g(<i>x</i>) = ${tx(gT)}`)}. Work out ${B(fg ? `fg(${ds(k)})` : `gf(${ds(k)})`)}.`, ...nAns(outer), hint: fg ? `Find g(${ds(k)}) first.` : `Find f(${ds(k)}) first.`,
        steps: [fg ? `g(${ds(k)}) = ${c === 1 ? '' : c + ' × '}${br(k)}<sup>2</sup>${pm(d)} = ${ds(inner)}` : `f(${ds(k)}) = ${ds(a)} × ${br(k)}${pm(b)} = ${ds(inner)}`, fg ? `f(${ds(inner)}) = ${ds(a)} × ${br(inner)}${pm(b)} = ${ds(outer)}` : `g(${ds(inner)}) = ${c === 1 ? '' : c + ' × '}${br(inner)}<sup>2</sup>${pm(d)} = ${ds(outer)}`, `${fg ? 'fg' : 'gf'}(${ds(k)}) = ${B(ds(outer))}`] };
    }],
  ['Inverse function values',
    'f⁻¹(a) is the input that gives the output a. Either find the inverse function, or solve f(x) = a.',
    (r) => {
      const a = r.int(2, 9), b = r.nz(-12, 12), x0 = r.nz(-8, 10); const div = r.chance(0.35);
      if (div) { const v = (x0 + b) / a; const X0 = a * r.nz(-5, 6) - b; const V = (X0 + b) / a; return { html: `${B(`f(<i>x</i>) = ${frac(tx(lin(1, b)), a)}`)}. Work out ${B(`f<sup>−1</sup>(${ds(V)})`)}.`, ...nAns(X0), hint: `Solve f(x) = ${ds(V)}.`, steps: [`Solve ${frac(tx(lin(1, b)), a)} = ${ds(V)}`, `${tx(lin(1, b))} = ${ds(V * a)}`, `x = ${B(ds(X0))}`] }; }
      const v = a * x0 + b;
      return { html: `${B(`f(<i>x</i>) = ${tx(lin(a, b))}`)}. Work out ${B(`f<sup>−1</sup>(${ds(v)})`)}.`, ...nAns(x0), hint: `Solve f(x) = ${ds(v)}.`,
        steps: [`Solve ${tx(`${lin(a, b)}=${v}`)}`, `${tx(`${a}x=${v - b}`)}`, `x = ${B(ds(x0))}`] };
    }],
  ['Finding the inverse function',
    'Write y = f(x), swap x and y, then rearrange to make y the subject. The result is f⁻¹(x).',
    (r) => {
      const a = r.int(2, 9), b = r.nz(-12, 12); const div = r.chance(0.35);
      if (div) { const ans = lin(a, -b); return { html: `${B(`f(<i>x</i>) = ${frac(tx(lin(1, b)), a)}`)}. Find ${B('f<sup>−1</sup>(<i>x</i>)')}.`, answerLabel: 'f⁻¹(x) =', ...eAns(ans, { vars: ['x'] }), format: 'Type an expression in x, e.g. 3x-2', hint: 'Swap x and y, then rearrange.', steps: [`y = ${frac(tx(lin(1, b)), a)}; swap: x = ${frac(tx(lin(1, b, 'y')), a)}`, `${a}x = ${tx(lin(1, b, 'y'))}`, `y = ${tx(ans)}, so f<sup>−1</sup>(x) = ${B(tx(ans))}`] }; }
      const top = polyT([[1, 'x'], [-b, '']]); const ans = `(${top})/${a}`;
      return { html: `${B(`f(<i>x</i>) = ${tx(lin(a, b))}`)}. Find ${B('f<sup>−1</sup>(<i>x</i>)')}.`, answerLabel: 'f⁻¹(x) =', ...eAns(ans, { vars: ['x'] }), answerHtml: B(frac(tx(top), a)), format: 'Type an expression in x, e.g. (x-3)/2', hint: 'Swap x and y, then rearrange.',
        steps: [`y = ${tx(lin(a, b))}; swap x and y: x = ${tx(lin(a, b, 'y'))}`, `${tx(top)} = ${a}y`, `f<sup>−1</sup>(x) = ${B(frac(tx(top), a))}`] };
    }],
]);

topic('y11-iteration', 'algebra', 11, 2, 'H', 'Iteration', 'Use iterative formulae to find approximate solutions.', [
  ['Iterating a cube-root formula',
    'Start with x₀, substitute it into the formula to get x₁, then substitute x₁ to get x₂, and so on. Use the ANS key on your calculator and do not round until the end.',
    (r) => {
      const p = r.int(2, 12), q = r.int(1, 5); const x0 = r.int(1, 3); const f = (x) => Math.cbrt(p + q * x); const xs = [x0]; for (let i = 0; i < 3; i++) xs.push(f(xs[i]));
      return { html: `Using ${B(`<i>x</i><sub>n+1</sub> = ∛(${p} + ${q === 1 ? '' : q}<i>x</i><sub>n</sub>)`)} with ${B(`<i>x</i><sub>0</sub> = ${x0}`)}, find the value of ${B('<i>x</i><sub>3</sub>')}. Give your answer to 4 decimal places.`, answerLabel: 'x₃ =', ...nAns(xs[3], { dp: 4, tol: 0.00006 }), format: dpFmt(4), hint: 'Substitute three times, keeping full calculator accuracy.',
        steps: [`x<sub>1</sub> = ∛(${p} + ${q === 1 ? '' : q + ' × '}${x0}) = ${fx(xs[1], 6)}…`, `x<sub>2</sub> = ∛(${p} + ${q === 1 ? '' : q + ' × '}${fx(xs[1], 6)}…) = ${fx(xs[2], 6)}…`, `x<sub>3</sub> = ∛(${p} + ${q === 1 ? '' : q + ' × '}${fx(xs[2], 6)}…) = ${fx(xs[3], 6)}…`, `x<sub>3</sub> = ${B(fx(xs[3], 4))} (4 d.p.)`] };
    }],
  ['Iterating a fraction formula',
    'Substitute each value into the formula to get the next. Store each answer in your calculator (ANS) so you never lose accuracy.',
    (r) => {
      let p, q, x0, f, xs; do { p = r.int(2, 12); q = r.int(2, 9); x0 = r.int(0, 2); f = (x) => p / (x * x + q); xs = [x0]; for (let i = 0; i < 3; i++) xs.push(f(xs[i])); } while (!(Math.abs(xs[3] - xs[2]) < Math.abs(xs[2] - xs[1]) && Math.abs(xs[2] - xs[1]) < Math.abs(xs[1] - xs[0])) || Math.abs(xs[3] - xs[2]) > 0.2);
      return { html: `Using ${B(`<i>x</i><sub>n+1</sub> = ${frac(p, `<i>x</i><sub>n</sub><sup>2</sup> + ${q}`)}`)} with ${B(`<i>x</i><sub>0</sub> = ${x0}`)}, find the value of ${B('<i>x</i><sub>3</sub>')}. Give your answer to 4 decimal places.`, answerLabel: 'x₃ =', ...nAns(xs[3], { dp: 4, tol: 0.00006 }), format: dpFmt(4), hint: 'Find x₁, then x₂, then x₃.',
        steps: [`x<sub>1</sub> = ${p} ÷ (${x0}<sup>2</sup> + ${q}) = ${fx(xs[1], 6)}…`, `x<sub>2</sub> = ${p} ÷ (${fx(xs[1], 6)}…<sup>2</sup> + ${q}) = ${fx(xs[2], 6)}…`, `x<sub>3</sub> = ${p} ÷ (${fx(xs[2], 6)}…<sup>2</sup> + ${q}) = ${fx(xs[3], 6)}…`, `x<sub>3</sub> = ${B(fx(xs[3], 4))} (4 d.p.)`] };
    }],
]);

topic('y11-algebraic-fractions', 'algebra', 11, 2, 'H', 'Algebraic Fractions', 'Simplify algebraic fractions by factorising, and combine them into a single fraction.', [
  ['Simplifying by factorising',
    'Factorise the numerator (and denominator) fully, then cancel any bracket that appears on both the top and the bottom.',
    (r) => {
      let p, q; do { p = r.nz(-8, 8); q = r.nz(-8, 8); } while (p === q || p + q === 0);
      const ans = lin(1, q);
      return { html: `Simplify fully ${B(frac(tx(quad(1, p + q, p * q)), tx(lin(1, p))))}`, ...eAns(ans, { form: 'simplified' }), format: 'Type the simplified expression, e.g. x+3', hint: 'Factorise the top.',
        steps: [`Factorise the numerator: ${tx(quad(1, p + q, p * q))} = ${tx(`(${lin(1, p)})(${lin(1, q)})`)}`, `Cancel the common factor ${tx(`(${lin(1, p)})`)}`, `Answer: ${B(tx(ans))}`] };
    }],
  ['Simplifying with quadratics top and bottom',
    'Factorise both the numerator and the denominator. Cancel the common bracket. What remains is the simplified fraction.',
    (r) => {
      let a, b; do { a = r.int(1, 9); b = r.nz(-9, 9); } while (b === -a || b === a);
      const top = `(${lin(1, -a)})`, bot = `(${lin(1, b)})`; const ans = `${top}/${bot}`;
      return { html: `Simplify fully ${B(frac(tx(polyT([[1, 'x^2'], [-a * a, '']])), tx(quad(1, a + b, a * b))))}`, ...eAns(ans, { form: 'simplified' }), answerHtml: B(frac(tx(lin(1, -a)), tx(lin(1, b)))), format: 'Type it as one fraction, e.g. (x-3)/(x+2)', hint: 'The top is a difference of two squares.',
        steps: [`Numerator: ${tx(`x^2-${a * a}`)} = ${tx(`(${lin(1, a)})(${lin(1, -a)})`)}`, `Denominator: ${tx(quad(1, a + b, a * b))} = ${tx(`(${lin(1, a)})(${lin(1, b)})`)}`, `Cancel ${tx(`(${lin(1, a)})`)}: ${B(frac(tx(lin(1, -a)), tx(lin(1, b))))}`] };
    }],
  ['Adding & subtracting algebraic fractions',
    'Use a common denominator — the product of the two denominators. Multiply each numerator by the other denominator, then add or subtract the numerators and simplify.',
    (r) => {
      let a, b, p, q, add; do { a = r.int(1, 6); b = r.int(1, 6); p = r.nz(-6, 6); q = r.nz(-6, 6); add = r.chance(); } while (p === q || (add ? a + b : a - b) === 0);
      const s = add ? 1 : -1; const numT = lin(a + s * b, a * q + s * b * p); const den = `(${lin(1, p)})(${lin(1, q)})`; const ans = `(${numT})/(${den})`;
      return { html: `Write ${B(`${frac(a, tx(lin(1, p)))} ${add ? '+' : '−'} ${frac(b, tx(lin(1, q)))}`)} as a single fraction in its simplest form.`, ...eAns(ans, { form: 'single' }), answerHtml: B(frac(tx(numT), tx(den))), format: 'Type a single fraction, e.g. (5x+7)/((x+1)(x+2))', hint: 'The common denominator is the product of the two denominators.',
        steps: [`Common denominator: ${tx(den)}`, `Numerator: ${tx(`${a}(${lin(1, q)})${add ? '+' : '-'}${b}(${lin(1, p)})`)} = ${tx(polyT([[a, 'x'], [a * q, '']]))} ${add ? '+' : '−'} (${tx(lin(b, b * p))})`, `= ${tx(numT)}`, `Answer: ${B(frac(tx(numT), tx(den)))}`] };
    }],
]);

topic('y11-volume-spheres-cones', 'geometry', 11, 2, 'FH', 'Volume of Spheres, Cones & Pyramids', 'Volumes of spheres, cones and pyramids.', [
  ['Volume of a sphere',
    'Volume of a sphere = 4/3 πr³. A hemisphere is half a sphere, so its volume is 2/3 πr³.',
    (r) => {
      const rr = r.int(2, 15); const hemi = r.chance(0.3); const V = (hemi ? 2 / 3 : 4 / 3) * Math.PI * rr ** 3; const u = r.pick(['cm', 'cm', 'mm', 'm']); const dia = r.chance(0.35);
      return { html: `A ${hemi ? 'hemisphere' : 'sphere'} has ${dia ? `diameter ${B(2 * rr + ' ' + u)}` : `radius ${B(rr + ' ' + u)}`}. Work out its volume. Give your answer to 1 decimal place.`, diagram: sphereSvg(`${rr} ${u}`), unit: u + '³', ...nAns(V, { dp: 1, unit: u + '³' }), format: dpFmt(1), hint: hemi ? 'Half of 4/3 πr³.' : 'V = 4/3 πr³.',
        steps: [...(dia ? [`Radius = ${2 * rr} ÷ 2 = ${rr} ${u}`] : []), `V = ${hemi ? '½ × ' : ''}${frac(4, 3)} × π × ${rr}<sup>3</sup>`, `= ${fx(V, 4)}…`, `= ${B(r1(V))} ${u}³`] };
    }],
  ['Volume of a cone',
    'Volume of a cone = 1/3 πr²h, where h is the perpendicular height (not the slant height).',
    (r) => {
      const rr = r.int(2, 12), h = r.int(4, 25); const V = Math.PI * rr * rr * h / 3;
      return { html: `A cone has base radius ${B(rr + ' cm')} and perpendicular height ${B(h + ' cm')}. Work out its volume. Give your answer to 1 decimal place.`, diagram: coneSvg(`${rr} cm`, `${h} cm`), unit: 'cm³', ...nAns(V, { dp: 1, unit: 'cm³' }), format: dpFmt(1), hint: 'V = ⅓πr²h.',
        steps: [`V = ${frac(1, 3)} × π × ${rr}<sup>2</sup> × ${h}`, `= ${fx(V, 4)}…`, `= ${B(r1(V))} cm³`] };
    }],
  ['Volume of a pyramid',
    'Volume of a pyramid = 1/3 × area of base × perpendicular height. For a square base of side b, the base area is b².',
    (r) => {
      const b = r.int(3, 15), h = r.int(4, 20); const V = b * b * h / 3; const exact = Number.isInteger(V);
      return { html: `A pyramid has a square base of side ${B(b + ' cm')} and a perpendicular height of ${B(h + ' cm')}. Work out its volume.${exact ? '' : ' Give your answer to 1 decimal place.'}`, diagram: pyramidSvg(`${b} cm`, `${h} cm`), unit: 'cm³', ...(exact ? nAns(V, { unit: 'cm³' }) : nAns(V, { dp: 1, unit: 'cm³' })), format: exact ? 'Type a number' : dpFmt(1), hint: 'V = ⅓ × base area × height.',
        steps: [`Base area = ${b}<sup>2</sup> = ${b * b} cm²`, `V = ${frac(1, 3)} × ${b * b} × ${h}`, `= ${B(exact ? V : r1(V))} cm³`] };
    }],
]);

const CP = (cx, cy, R, a) => [cx + R * cosD(a), cy - R * sinD(a)];
topic('y11-circle-theorems', 'geometry', 11, 2, 'H', 'Circle Theorems', 'Use circle theorems to find missing angles, giving reasons.', [
  ['Angle at the centre',
    'The angle at the centre is twice the angle at the circumference when both stand on the same arc.',
    (r) => {
      const O = [180, 122], R = 92; const A = CP(...O, R, 210), Bp = CP(...O, R, 330), C = CP(...O, R, 90);
      const atC = r.chance(); const x = r.int(15, 80); const centre = 2 * x;
      const body = sC(O[0], O[1], R) + sL(C[0], C[1], A[0], A[1]) + sL(C[0], C[1], Bp[0], Bp[1]) + sL(O[0], O[1], A[0], A[1]) + sL(O[0], O[1], Bp[0], Bp[1]) + dot(...O) + sT(O[0], O[1] - 12, 'O', { fs: 12 }) +
        sT(A[0] - 12, A[1] + 8, 'A', { b: true }) + sT(Bp[0] + 12, Bp[1] + 8, 'B', { b: true }) + sT(C[0], C[1] - 13, 'C', { b: true }) +
        angArc(C, A, Bp, 22, atC ? 'x' : `${x}°`, { c: atC ? ACC : undefined, tc: atC ? ACC : undefined, lr: 16 }) + angArc(O, A, Bp, 20, atC ? `${centre}°` : 'x', { c: atC ? undefined : ACC, tc: atC ? undefined : ACC, lr: 16 });
      return { html: `A, B and C are points on a circle with centre O. ${atC ? `Angle AOB = ${B(centre + '°')}` : `Angle ACB = ${B(x + '°')}`}. Work out the size of angle ${B('<i>x</i>')}.`, diagram: svgWrap(360, 240, body), answerLabel: 'x =', unit: '°', ...nAns(atC ? x : centre, { unit: '°' }), hint: 'Angle at centre = 2 × angle at circumference.',
        steps: ['The angle at the centre is twice the angle at the circumference.', atC ? `x = ${centre}° ÷ 2 = ${B(x + '°')}` : `x = 2 × ${x}° = ${B(centre + '°')}`] };
    }],
  ['Angles in the same segment',
    'Angles at the circumference standing on the same arc (in the same segment) are equal.',
    (r) => {
      const O = [180, 122], R = 92; const A = CP(...O, R, 200), Bp = CP(...O, R, 340), C = CP(...O, R, 60), D = CP(...O, R, 125); const x = r.int(20, 75);
      const body = sC(O[0], O[1], R) + sL(A[0], A[1], C[0], C[1]) + sL(Bp[0], Bp[1], C[0], C[1]) + sL(A[0], A[1], D[0], D[1]) + sL(Bp[0], Bp[1], D[0], D[1]) +
        sT(A[0] - 12, A[1] + 6, 'A', { b: true }) + sT(Bp[0] + 12, Bp[1] + 6, 'B', { b: true }) + sT(C[0] + 10, C[1] - 10, 'C', { b: true }) + sT(D[0] - 10, D[1] - 10, 'D', { b: true }) +
        angArc(C, A, Bp, 24, `${x}°`, { lr: 15 }) + angArc(D, A, Bp, 24, 'x', { c: ACC, tc: ACC, lr: 15 });
      return { html: `A, B, C and D are points on a circle. Angle ACB = ${B(x + '°')}. Work out the size of angle ADB, marked ${B('<i>x</i>')}.`, diagram: svgWrap(360, 240, body), answerLabel: 'x =', unit: '°', ...nAns(x, { unit: '°' }), hint: 'Both angles stand on the arc AB.',
        steps: ['Angles ACB and ADB both stand on the same arc AB.', 'Angles in the same segment are equal.', `x = ${B(x + '°')}`] };
    }],
  ['Cyclic quadrilaterals',
    'Opposite angles in a cyclic quadrilateral (all four corners on the circle) add up to 180°.',
    (r) => {
      const O = [180, 122], R = 92; const A = CP(...O, R, 150), Bp = CP(...O, R, 35), C = CP(...O, R, -55), D = CP(...O, R, 235); const a = r.int(55, 130);
      const body = sC(O[0], O[1], R) + sPoly([A, Bp, C, D]) + sT(A[0] - 12, A[1] - 6, 'A', { b: true }) + sT(Bp[0] + 12, Bp[1] - 6, 'B', { b: true }) + sT(C[0] + 10, C[1] + 10, 'C', { b: true }) + sT(D[0] - 12, D[1] + 8, 'D', { b: true }) +
        angArc(A, Bp, D, 22, `${a}°`, { lr: 16 }) + angArc(C, Bp, D, 22, 'x', { c: ACC, tc: ACC, lr: 15 });
      return { html: `ABCD is a cyclic quadrilateral. Angle DAB = ${B(a + '°')}. Work out the size of angle BCD, marked ${B('<i>x</i>')}.`, diagram: svgWrap(360, 240, body), answerLabel: 'x =', unit: '°', ...nAns(180 - a, { unit: '°' }), hint: 'Opposite angles add up to 180°.',
        steps: ['Opposite angles of a cyclic quadrilateral add up to 180°.', `x = 180° − ${a}° = ${B((180 - a) + '°')}`] };
    }],
  ['Tangents and radii',
    'A tangent meets a radius at 90°. Two tangents from the same external point are equal in length. Combine these with angle facts for triangles and quadrilaterals.',
    (r) => {
      const O = [120, 122], R = 72, P = [320, 122]; const al = acosD(R / (P[0] - O[0])); const A = CP(...O, R, al), Bp = CP(...O, R, -al);
      const two = r.chance(); const p = r.int(20, 80) * (two ? 1 : 1);
      if (two) {
        const body = sC(O[0], O[1], R) + sL(P[0], P[1], A[0], A[1]) + sL(P[0], P[1], Bp[0], Bp[1]) + sL(O[0], O[1], A[0], A[1]) + sL(O[0], O[1], Bp[0], Bp[1]) + dot(...O) + rightMark(A, O, P, 10) + rightMark(Bp, O, P, 10) +
          sT(O[0] - 12, O[1], 'O', { b: true }) + sT(A[0], A[1] - 13, 'A', { b: true }) + sT(Bp[0], Bp[1] + 14, 'B', { b: true }) + sT(P[0] + 12, P[1], 'P', { b: true }) + angArc(P, A, Bp, 30, `${p}°`, { lr: 16 }) + angArc(O, A, Bp, 18, 'x', { c: ACC, tc: ACC, lr: 14 });
        return { html: `PA and PB are tangents to the circle with centre O. Angle APB = ${B(p + '°')}. Work out the size of angle AOB, marked ${B('<i>x</i>')}.`, diagram: svgWrap(360, 240, body), answerLabel: 'x =', unit: '°', ...nAns(180 - p, { unit: '°' }), hint: 'Tangent meets radius at 90°; angles in a quadrilateral add to 360°.',
          steps: ['Angles OAP and OBP are 90° (tangent ⟂ radius).', `Angles in quadrilateral OAPB add to 360°: x = 360° − 90° − 90° − ${p}°`, `x = ${B((180 - p) + '°')}`] };
      }
      const body = sC(O[0], O[1], R) + sL(P[0], P[1], A[0], A[1]) + sL(O[0], O[1], A[0], A[1]) + sL(O[0], O[1], P[0], P[1]) + dot(...O) + rightMark(A, O, P, 10) +
        sT(O[0] - 12, O[1], 'O', { b: true }) + sT(A[0], A[1] - 13, 'A', { b: true }) + sT(P[0] + 12, P[1], 'P', { b: true }) + angArc(O, A, P, 22, `${p}°`, { lr: 14 }) + angArc(P, A, O, 36, 'x', { c: ACC, tc: ACC, lr: 14 });
      return { html: `PA is a tangent to the circle with centre O at the point A. Angle AOP = ${B(p + '°')}. Work out the size of angle APO, marked ${B('<i>x</i>')}.`, diagram: svgWrap(360, 240, body), answerLabel: 'x =', unit: '°', ...nAns(90 - p, { unit: '°' }), hint: 'The tangent meets the radius at 90°.',
        steps: ['Angle OAP = 90° (tangent ⟂ radius).', `Angles in triangle OAP add to 180°: x = 180° − 90° − ${p}°`, `x = ${B((90 - p) + '°')}`] };
    }],
]);

topic('y11-quadratic-inequalities', 'algebra', 11, 3, 'H', 'Quadratic Inequalities', 'Solve quadratic inequalities using a sketch of the graph.', [
  ['Quadratic less than zero',
    'Find the roots by solving the equation = 0. Sketch the U-shaped graph: it is BELOW the x-axis between the roots, so the solution is one inequality between them.',
    (r) => {
      let p, q; do { p = r.int(-8, 6); q = r.int(-6, 9); } while (q <= p); const op = r.pick(['<', '<=']); const sym = op === '<' ? '&lt;' : '≤';
      const lhs = quad(1, -(p + q), p * q); const ans = `${ps(p)}${op}x${op}${ps(q)}`; const ge = op === '<' ? '>' : '>=';
      return { html: `Solve ${B(`${tx(lhs)} ${sym} 0`)}`, answer: ans, check: { type: 'text', accept: [ans, `x${ge}${ps(p)}andx${op}${ps(q)}`, `x${op}${ps(q)}andx${ge}${ps(p)}`] }, answerHtml: B(`${ds(p)} ${sym} <i>x</i> ${sym} ${ds(q)}`), format: 'Type e.g. -2<x<3 (use <= for ≤)', hint: 'Find where the graph crosses the x-axis.',
        steps: [`Solve ${tx(`${lhs}=0`)}: ${tx(`(${lin(1, -p)})(${lin(1, -q)})=0`)}, so x = ${ds(p)} or x = ${ds(q)}`, 'The graph is a U-shape, below the x-axis between the roots.', `Answer: ${B(`${ds(p)} ${sym} <i>x</i> ${sym} ${ds(q)}`)}`] };
    }],
  ['Quadratic greater than zero',
    'The U-shaped graph is ABOVE the x-axis outside the roots, so the solution is two separate inequalities: x < smaller root OR x > larger root.',
    (r) => {
      let p, q; do { p = r.int(-8, 6); q = r.int(-6, 9); } while (q <= p); const strict = r.chance(); const op = strict ? '>' : '>='; const sym = strict ? '&gt;' : '≥'; const lo = strict ? '<' : '<='; const loS = strict ? '&lt;' : '≤';
      const lhs = quad(1, -(p + q), p * q); const ans = `x${lo}${ps(p)} or x${op}${ps(q)}`;
      return { html: `Solve ${B(`${tx(lhs)} ${sym} 0`)}`, answer: ans, check: { type: 'text', accept: [ans, `x${op}${ps(q)}orx${lo}${ps(p)}`, `x${lo}${ps(p)},x${op}${ps(q)}`] }, answerHtml: B(`<i>x</i> ${loS} ${ds(p)} or <i>x</i> ${sym} ${ds(q)}`), format: 'Type e.g. x<-2 or x>3', hint: 'Where is the U-shaped graph above the x-axis?',
        steps: [`Solve ${tx(`${lhs}=0`)}: x = ${ds(p)} or x = ${ds(q)}`, 'The graph is above the x-axis to the left of the smaller root and to the right of the larger root.', `Answer: ${B(`<i>x</i> ${loS} ${ds(p)} or <i>x</i> ${sym} ${ds(q)}`)}`] };
    }],
  ['Inequalities like x² < k',
    'x² < k² means −k < x < k (the values between the square roots). x² > k² means x < −k or x > k. Don\'t forget the negative root.',
    (r) => {
      const k = r.int(2, 12); const less = r.chance(); const strict = r.chance(0.6); const moved = r.chance(0.35);
      const lt = strict ? '<' : '<=', gt = strict ? '>' : '>=', ltH = strict ? '&lt;' : '≤', gtH = strict ? '&gt;' : '≥';
      const qH = moved ? `<i>x</i><sup>2</sup> − ${k * k} ${less ? ltH : gtH} 0` : `<i>x</i><sup>2</sup> ${less ? ltH : gtH} ${k * k}`;
      const pre = moved ? [`Add ${k * k} to both sides: <i>x</i><sup>2</sup> ${less ? ltH : gtH} ${k * k}`] : [];
      if (less) { const ans = `-${k}${lt}x${lt}${k}`; const ah = `−${k} ${ltH} <i>x</i> ${ltH} ${k}`; return { html: `Solve ${B(qH)}`, answer: ans, check: { type: 'text', accept: [ans, `x${gt}-${k}andx${lt}${k}`] }, answerHtml: B(ah), format: `Type e.g. -4${lt}x${lt}4`, hint: 'Remember the negative square root.', steps: [...pre, `${tx('x^2')} = ${k * k} when x = ±${k}`, `${tx('x^2')} is less than ${strict ? '' : 'or equal to '}${k * k} between these values.`, `Answer: ${B(ah)}`] }; }
      const ans = `x${lt}-${k} or x${gt}${k}`; const ah = `<i>x</i> ${ltH} −${k} or <i>x</i> ${gtH} ${k}`;
      return { html: `Solve ${B(qH)}`, answer: ans, check: { type: 'text', accept: [ans, `x${gt}${k}orx${lt}-${k}`, `x${lt}-${k},x${gt}${k}`] }, answerHtml: B(ah), format: `Type e.g. x${lt}-4 or x${gt}4`, hint: 'Remember the negative square root.', steps: [...pre, `${tx('x^2')} = ${k * k} when x = ±${k}`, `${tx('x^2')} is greater than ${strict ? '' : 'or equal to '}${k * k} outside these values.`, `Answer: ${B(ah)}`] };
    }],
]);

topic('y11-growth-decay', 'ratio', 11, 3, 'FH', 'Growth & Decay', 'Exponential growth and decay using multipliers.', [
  ['Exponential growth',
    'If something grows by r% each period, multiply by (1 + r/100) once for every period: N = N₀ × (1 + r/100)ⁿ.',
    (r) => {
      const N0 = 100 * r.int(10, 500), rate = r.int(2, 12), n = r.int(3, 10); const N = N0 * (1 + rate / 100) ** n;
      return { html: `A town has a population of ${B(ds(N0))}. The population grows by ${B(rate + '%')} each year. Estimate the population after ${B(n + ' years')}. Give your answer to the nearest whole number.`, ...nAns(N, { whole: true }), answerHtml: B(commas(String(Math.round(N)))), format: 'Give your answer to the nearest whole number', hint: `Multiplier = ${ps(1 + rate / 100)}.`,
        steps: [`Multiplier = 1 + ${rate}/100 = ${ps(1 + rate / 100)}`, `Population = ${ds(N0)} × ${ps(1 + rate / 100)}<sup>${n}</sup> = ${fx(N, 2)}…`, `≈ ${B(commas(String(Math.round(N))))}`] };
    }],
  ['Exponential decay',
    'If something decreases by r% each period, multiply by (1 − r/100) once for every period.',
    (r) => {
      const m0 = r.int(50, 800), rate = r.pick([5, 8, 10, 12, 15, 20, 25, 30]), n = r.int(2, 8); const m = m0 * (1 - rate / 100) ** n;
      return { html: `A radioactive sample has a mass of ${B(m0 + ' g')}. Its mass decreases by ${B(rate + '%')} every hour. Work out its mass after ${B(n + ' hours')}. Give your answer to 1 decimal place.`, unit: 'g', ...nAns(m, { dp: 1, unit: 'g' }), format: dpFmt(1), hint: `Multiplier = ${ps(1 - rate / 100)}.`,
        steps: [`Multiplier = 1 − ${rate}/100 = ${ps(1 - rate / 100)}`, `Mass = ${m0} × ${ps(1 - rate / 100)}<sup>${n}</sup> = ${fx(m, 4)}…`, `= ${B(r1(m))} g`] };
    }],
  ['How many periods?',
    'Multiply by the multiplier one period at a time (or use trial and improvement with powers) until the value first passes the target.',
    (r) => {
      let V, rate, T, n; do { V = 1000 * r.int(8, 40); rate = r.pick([10, 12, 15, 18, 20, 25]); T = V * r.pick([0.2, 0.25, 0.3, 0.4, 0.5]); n = 0; let v = V; while (v >= T) { v *= 1 - rate / 100; n++; } } while (n < 2 || n > 12 || Math.abs(V * (1 - rate / 100) ** n - T) < 1 || Math.abs(V * (1 - rate / 100) ** (n - 1) - T) < 1);
      const m = 1 - rate / 100;
      return { html: `A machine is worth ${B(money(V))}. Its value falls by ${B(rate + '%')} each year. After how many whole years will it first be worth less than ${B(money(T))}?`, unit: 'years', ...nAns(n, { unit: 'years' }), hint: `Try powers of ${ps(m)}.`,
        steps: [`Multiplier = ${ps(m)}`, `After ${n - 1} years: ${money(V)} × ${ps(m)}<sup>${n - 1}</sup> = ${money(V * m ** (n - 1))} (not yet below ${money(T)})`, `After ${n} years: ${money(V)} × ${ps(m)}<sup>${n}</sup> = ${money(V * m ** n)}`, `So it takes ${B(n)} years.`] };
    }],
]);

topic('y11-vectors', 'geometry', 11, 3, 'FH', 'Vectors', 'Column vector arithmetic, solving vector equations and magnitude.', [
  ['Adding & scaling column vectors',
    'Multiply each component by the scalar, then add (or subtract) the top numbers together and the bottom numbers together.',
    (r) => {
      const a = [r.nz(-6, 6), r.nz(-6, 6)], b = [r.nz(-6, 6), r.nz(-6, 6)]; const p = r.nz(-3, 3), q = r.nz(-3, 3); const res = [p * a[0] + q * b[0], p * a[1] + q * b[1]];
      const term = (k, v, first) => `${first ? (k < 0 ? '−' : '') : (k < 0 ? ' − ' : ' + ')}${Math.abs(k) === 1 ? '' : Math.abs(k)}${B(v)}`;
      return { html: `${B('a')} = ${colvec(a[0], a[1])} and ${B('b')} = ${colvec(b[0], b[1])}. Work out ${term(p, 'a', true)}${term(q, 'b')} as a column vector.`, answer: `${res[0]}, ${res[1]}`, check: { type: 'pair', values: res, ordered: true }, answerHtml: colvec(res[0], res[1]), format: 'Type the top number then the bottom number, e.g. 4, -7', hint: 'Work on the top row and the bottom row separately.',
        steps: [`${p === 1 ? '' : p === -1 ? '−' : ds(p)}${B('a')} = ${colvec(p * a[0], p * a[1])}, ${q === 1 ? '' : q === -1 ? '−' : ds(q)}${B('b')} = ${colvec(q * b[0], q * b[1])}`, `Add: ${colvec(`${ds(p * a[0])} + ${br(q * b[0])}`, `${ds(p * a[1])} + ${br(q * b[1])}`)} = ${colvec(res[0], res[1])}`] };
    }],
  ['Solving vector equations',
    'Treat a vector equation like an ordinary equation, working on each component separately: subtract the known vector, then divide by any scalar.',
    (r) => {
      const k = r.int(1, 3); const x = [r.nz(-6, 6), r.nz(-6, 6)], a = [r.nz(-8, 8), r.nz(-8, 8)]; const b = [k * x[0] + a[0], k * x[1] + a[1]];
      return { html: `${B('a')} = ${colvec(a[0], a[1])} and ${B('b')} = ${colvec(b[0], b[1])}. Find the vector ${B('x')} such that ${k === 1 ? '' : k}${B('x')} + ${B('a')} = ${B('b')}.`, answer: `${x[0]}, ${x[1]}`, check: { type: 'pair', values: x, ordered: true }, answerHtml: colvec(x[0], x[1]), format: 'Type the top number then the bottom number, e.g. 4, -7', hint: 'Subtract a from both sides.',
        steps: [`${k === 1 ? '' : k}${B('x')} = ${B('b')} − ${B('a')} = ${colvec(k * x[0], k * x[1])}`, ...(k > 1 ? [`Divide by ${k}`] : []), `${B('x')} = ${colvec(x[0], x[1])}`] };
    }],
  ['Magnitude of a vector',
    'The magnitude (length) of a vector (x, y) is √(x² + y²), using Pythagoras.',
    (r) => {
      const v = [r.nz(-12, 12), r.nz(-12, 12)]; const m = Math.hypot(v[0], v[1]); const exact = Number.isInteger(m);
      return { html: `Work out the magnitude of the vector ${colvec(v[0], v[1])}.${exact ? '' : ' Give your answer to 1 decimal place.'}`, ...(exact ? nAns(m) : nAns(m, { dp: 1 })), format: exact ? 'Type a number' : dpFmt(1), hint: 'Use Pythagoras.',
        steps: [`|v| = ${sq(`${br(v[0])}<sup>2</sup> + ${br(v[1])}<sup>2</sup>`)} = ${sq(v[0] * v[0] + v[1] * v[1])}`, `= ${B(exact ? m : r1(m))}`] };
    }],
]);

topic('y11-conditional-probability', 'probability', 11, 3, 'H', 'Conditional Probability', 'Probabilities without replacement and from two-way tables.', [
  ['Without replacement: same colour',
    'Without replacement, the second pick has one fewer item in total, and one fewer of the colour already taken. Multiply along the branches.',
    (r) => {
      const a = r.int(2, 9), b = r.int(2, 9); const n = a + b; const which = r.chance() ? ['red', a] : ['blue', b];
      return { html: `A bag contains ${B(a)} red and ${B(b)} blue sweets. Two sweets are taken at random without replacement. Find the probability that ${B(`both are ${which[0]}`)}.`, diagram: treeSvg([`${a}/${n}`, `${b}/${n}`], [[`${a - 1}/${n - 1}`, `${b}/${n - 1}`], [`${a}/${n - 1}`, `${b - 1}/${n - 1}`]], [['Red', 'Blue'], ['Red', 'Blue']]),
        ...fAns(which[1] * (which[1] - 1), n * (n - 1)), hint: 'The second probability has one fewer on the top and the bottom.',
        steps: [`P(first ${which[0]}) = ${frac(which[1], n)}`, `P(second ${which[0]} | first ${which[0]}) = ${frac(which[1] - 1, n - 1)}`, `P = ${frac(which[1], n)} × ${frac(which[1] - 1, n - 1)} = ${frS(which[1] * (which[1] - 1), n * (n - 1))}`] };
    }],
  ['Without replacement: one of each',
    'There are two routes to “one of each”: red then blue, or blue then red. Work out each route without replacement, then add.',
    (r) => {
      const a = r.int(2, 9), b = r.int(2, 9); const n = a + b; const N = 2 * a * b, D = n * (n - 1);
      return { html: `A box contains ${B(a)} milk chocolates and ${B(b)} dark chocolates. Two are taken at random without replacement. Find the probability of getting ${B('one of each type')}.`, ...fAns(N, D), hint: 'Milk then dark, OR dark then milk.',
        steps: [`P(milk, dark) = ${frac(a, n)} × ${frac(b, n - 1)} = ${frac(a * b, D)}`, `P(dark, milk) = ${frac(b, n)} × ${frac(a, n - 1)} = ${frac(a * b, D)}`, `Total = ${frS(N, D)}`] };
    }],
  ['Conditional probability from a table',
    'P(A given B) means: restrict to only the B group, then find the fraction of that group that is A. The denominator is the total of the B group, not the grand total.',
    (r) => {
      const m = [[r.int(3, 30), r.int(3, 30), r.int(3, 30)], [r.int(3, 30), r.int(3, 30), r.int(3, 30)]]; const rowN = ['Year 10', 'Year 11'], colN = ['Walk', 'Bus', 'Car'];
      const i = r.int(0, 1), j = r.int(0, 2); const givenRow = r.chance();
      const rows = m.map((row, k) => [rowN[k], ...row, sum(row)]); const colT = [0, 1, 2].map((c) => m[0][c] + m[1][c]);
      const tbl = table([['', ...colN, 'Total'], ...rows.map((rw) => [`<b>${rw[0]}</b>`, ...rw.slice(1)]), ['<b>Total</b>', ...colT, sum(colT)]]);
      const num = m[i][j], den = givenRow ? sum(m[i]) : colT[j];
      const verb = ['walks', 'travels by bus', 'travels by car'][j]; const q = givenRow ? `a student chosen from ${rowN[i]} ${verb}` : `a student who ${verb} is in ${rowN[i]}`;
      return { html: `The table shows how some students travel to school.${tbl}A student is chosen at random. Find the probability that ${B(q)}.`, ...fAns(num, den), hint: givenRow ? `Only look at the ${rowN[i]} row.` : `Only look at the ${colN[j]} column.`,
        steps: [givenRow ? `Restrict to ${rowN[i]}: total ${den} students.` : `Restrict to students who ${['walk', 'travel by bus', 'travel by car'][j]}: total ${den} students.`, `Of these, ${num} ${givenRow ? ['walk', 'travel by bus', 'travel by car'][j] : `are in ${rowN[i]}`}.`, `P = ${frac(num, den)}${gcd(num, den) > 1 ? ` = ${B(fracS(num, den))}` : ''}`] };
    }],
]);

topic('y11-cumulative-frequency', 'statistics', 11, 3, 'H', 'Cumulative Frequency & Box Plots', 'Quartiles, interquartile range, box plots and cumulative frequency.', [
  ['Quartiles and IQR from a list',
    'Order the data. For n values, the median is the (n + 1)/2 th value, the lower quartile the (n + 1)/4 th and the upper quartile the 3(n + 1)/4 th. IQR = UQ − LQ.',
    (r) => {
      const n = r.pick([7, 11, 15]); const xs = Array.from({ length: n }, () => r.int(1, 60)).sort((a, b) => a - b); const L = xs[(n + 1) / 4 - 1], M = xs[(n + 1) / 2 - 1], U = xs[3 * (n + 1) / 4 - 1];
      const t = r.int(0, 3); const what = ['median', 'lower quartile', 'upper quartile', 'interquartile range'][t]; const v = [M, L, U, U - L][t];
      return { html: `Here are ${n} values in order:<br>${B(xs.join(', '))}<br>Find the ${B(what)}.`, ...nAns(v), hint: `Use positions (n + 1)/4, (n + 1)/2 and 3(n + 1)/4 with n = ${n}.`,
        steps: [`n = ${n}: LQ is the ${ord((n + 1) / 4)} value, median the ${ord((n + 1) / 2)}, UQ the ${ord(3 * (n + 1) / 4)}.`, `LQ = ${L}, median = ${M}, UQ = ${U}`, t === 3 ? `IQR = ${U} − ${L} = ${B(U - L)}` : `${what[0].toUpperCase() + what.slice(1)} = ${B(v)}`] };
    }],
  ['Reading a box plot',
    'A box plot shows the minimum, lower quartile, median, upper quartile and maximum. Range = max − min; IQR = UQ − LQ (the width of the box).',
    (r) => {
      const step = r.pick([5, 10]); const lo = 0; const v = [r.int(1, 3), r.int(4, 6), r.int(7, 9), r.int(10, 12), r.int(13, 16)].map((x) => x * step / 2 * 2); const hi = 18 * step;
      const t = r.int(0, 4); const what = ['interquartile range', 'range', 'median', 'lower quartile', 'upper quartile'][t]; const ans = [v[3] - v[1], v[4] - v[0], v[2], v[1], v[3]][t];
      const ctx = r.pick(['the marks scored by a class in a test', 'the times, in minutes, taken by runners to finish a fun run', 'the heights, in cm, of some sunflowers', 'the number of emails received each day by an office', 'the weights, in grams, of some apples', 'the scores of players in a quiz']);
      return { html: `The box plot shows ${ctx}. Find the ${B(what)}.`, diagram: boxPlotSvg(v, lo, hi, step * 2), ...nAns(ans), hint: 'Read the five key values from the scale.',
        steps: [`Minimum ${v[0]}, LQ ${v[1]}, median ${v[2]}, UQ ${v[3]}, maximum ${v[4]}`, t === 0 ? `IQR = ${v[3]} − ${v[1]} = ${B(ans)}` : t === 1 ? `Range = ${v[4]} − ${v[0]} = ${B(ans)}` : `${what[0].toUpperCase() + what.slice(1)} = ${B(ans)}`] };
    }],
  ['Cumulative frequency',
    'Cumulative frequency is a running total of the frequencies. The cumulative frequency at the end of a class tells you how many values are less than or equal to that boundary.',
    (r) => {
      const G = groupedData(r); const cum = []; let c = 0; G.fs.forEach((f) => { c += f; cum.push(c); }); const n = c; const i = r.int(0, G.cls.length - 2); const bound = G.cls[i][1]; const more = r.chance();
      const v = more ? n - cum[i] : cum[i];
      return { html: `The table shows information about some data.${G.tbl}How many values are ${B(more ? `more than ${bound}` : `less than or equal to ${bound}`)}?`, ...nAns(v), hint: 'Use a running total of the frequencies.',
        steps: [`Cumulative frequencies: ${cum.join(', ')}`, `Number ≤ ${bound} = ${cum[i]}`, more ? `More than ${bound}: ${n} − ${cum[i]} = ${B(v)}` : `Answer: ${B(v)}`] };
    }],
]);

// ============================================================================
// Specification references (Pearson Edexcel GCSE (9–1) Mathematics 1MA1)
// ============================================================================
Object.assign(SPEC, {
  'y8-negative-numbers': '1MA1 N1, N2', 'y8-factors-multiples': '1MA1 N4', 'y8-order-of-operations': '1MA1 N3',
  'y8-algebraic-notation': '1MA1 A1, A3, A4', 'y8-substitution': '1MA1 A2, A5', 'y8-angle-facts': '1MA1 G1, G3',
  'y8-fractions': '1MA1 N1, N2, N8', 'y8-decimals-percentages': '1MA1 N10, N12, R9', 'y8-expanding-brackets': '1MA1 A4',
  'y8-linear-equations': '1MA1 A17', 'y8-perimeter-area': '1MA1 G16, G17', 'y8-averages': '1MA1 S4',
  'y8-rounding': '1MA1 N14, N15', 'y8-sequences': '1MA1 A23, A24, A25', 'y8-ratio': '1MA1 R4, R5, R6',
  'y8-circles': '1MA1 G9, G17', 'y8-probability': '1MA1 P3, P4',
  'y9-indices': '1MA1 N6, N7, A4', 'y9-expanding-double': '1MA1 A4', 'y9-factorising': '1MA1 A4',
  'y9-equations-both-sides': '1MA1 A17', 'y9-pythagoras': '1MA1 G20', 'y9-standard-form': '1MA1 N9',
  'y9-percentage-change': '1MA1 R9, N12', 'y9-inequalities': '1MA1 A22', 'y9-straight-line-graphs': '1MA1 A9, A10',
  'y9-direct-proportion': '1MA1 R10, N13', 'y9-polygons': '1MA1 G3', 'y9-speed-distance-time': '1MA1 R1, R11, N13',
  'y9-density': '1MA1 R1, R11', 'y9-volume-surface-area': '1MA1 G16, G17', 'y9-relative-frequency': '1MA1 P1, P2, P3',
  'y9-listing-outcomes': '1MA1 N5, P6', 'y9-frequency-tables': '1MA1 S2, S4',
  'y10-compound-interest': '1MA1 R16, N12', 'y10-reverse-percentages': '1MA1 R9', 'y10-factorising-quadratics': '1MA1 A4',
  'y10-solving-quadratics': '1MA1 A18', 'y10-trigonometry': '1MA1 G20, G21', 'y10-fractional-indices': '1MA1 N7',
  'y10-surds': '1MA1 N8', 'y10-simultaneous-equations': '1MA1 A19, A21', 'y10-rearranging': '1MA1 A5',
  'y10-arcs-sectors': '1MA1 G18', 'y10-similar-shapes': '1MA1 G6, G19, R12', 'y10-quadratic-sequences': '1MA1 A24, A25',
  'y10-proportion': '1MA1 R10, R13', 'y10-tree-diagrams': '1MA1 P6, P8', 'y10-grouped-data': '1MA1 S3, S4',
  'y11-recurring-decimals': '1MA1 N10', 'y11-bounds': '1MA1 N15, N16', 'y11-quadratic-formula': '1MA1 A18',
  'y11-completing-square': '1MA1 A11, A18', 'y11-sine-cosine-rule': '1MA1 G22', 'y11-area-sine': '1MA1 G23',
  'y11-rationalising': '1MA1 N8', 'y11-functions': '1MA1 A7', 'y11-iteration': '1MA1 A20',
  'y11-algebraic-fractions': '1MA1 A4, A6', 'y11-volume-spheres-cones': '1MA1 G17', 'y11-circle-theorems': '1MA1 G10',
  'y11-quadratic-inequalities': '1MA1 A22', 'y11-growth-decay': '1MA1 R16', 'y11-vectors': '1MA1 G25',
  'y11-conditional-probability': '1MA1 P8, P9', 'y11-cumulative-frequency': '1MA1 S3, S4',
});

// ---- fragment y7num.js ----
{
// ===================== YEAR 7 NUMBER (fragment y7num) =====================
const y7nNames = ['Amir', 'Bella', 'Chloe', 'Dev', 'Ella', 'Femi', 'Grace', 'Hassan', 'Isla', 'Jack', 'Kai', 'Leah', 'Maya', 'Noah', 'Omar', 'Priya', 'Ruby', 'Sam', 'Tom', 'Zara'];
const y7nPVi = ['ones', 'tens', 'hundreds', 'thousands', 'ten thousands', 'hundred thousands', 'millions'];
const y7nPVd = ['tenths', 'hundredths', 'thousandths'];
const y7nPlace = (p) => (p >= 0 ? y7nPVi[p] : y7nPVd[-p - 1]);
const y7nCap = (s) => s[0].toUpperCase() + s.slice(1);
const y7nDp = (v) => { const s = ps(v); return s.includes('.') ? s.split('.')[1].length : 0; };
// column addition working; ints are values scaled by 10^dp
function y7nColAdd(ints, dp) {
  const len = Math.max(...ints.map((n) => String(n).length), dp + 1);
  const lines = []; let carry = 0;
  for (let i = 0; i < len; i++) {
    const dg = ints.filter((n) => n >= 10 ** i || i <= dp).map((n) => Math.floor(n / 10 ** i) % 10);
    const s = sum(dg) + carry;
    lines.push(`${y7nCap(y7nPlace(i - dp))}: ${dg.join(' + ')}${carry ? ` + ${carry} (carried)` : ''} = ${s}${s >= 10 ? ` → write ${s % 10}, carry ${Math.floor(s / 10)}` : ''}`);
    carry = Math.floor(s / 10);
  }
  if (carry) lines.push(`Write the final carried ${carry} in the next column.`);
  return lines;
}
// column subtraction working with exchanging; a > b, scaled ints
function y7nColSub(a, b, dp) {
  const len = Math.max(String(a).length, dp + 1);
  const lines = []; let borrow = 0;
  for (let i = 0; i < len; i++) {
    const top = Math.floor(a / 10 ** i) % 10, db = Math.floor(b / 10 ** i) % 10;
    const name = y7nCap(y7nPlace(i - dp));
    let eff = top - borrow; let txt;
    if (eff < db) {
      const pre = borrow ? (top === 0 ? 'the 0 has already given 1 away, so ' : `the ${top} has given 1 away (now ${eff}), so `) : '';
      eff += 10; borrow = 1;
      txt = `${name}: ${pre}exchange 1 from the next column → ${eff} − ${db} = ${eff - db}`;
    } else {
      txt = `${name}: ${borrow ? `${top} − 1 = ${eff}, then ` : ''}${eff} − ${db} = ${eff - db}`;
      borrow = 0;
    }
    lines.push(txt);
  }
  return lines;
}
function y7nFactors(n) { const f = []; for (let i = 1; i <= n; i++) if (n % i === 0) f.push(i); return f; }
function y7nFactorPairs(n) { const p = []; for (let i = 1; i * i <= n; i++) if (n % i === 0) p.push(`${i} × ${n / i}`); return p; }
// value close to L×10^e that rounds to it at 1 s.f., shown to `sig` significant figures
function y7nApprox(r, L, e, sig = 3) {
  const s = 10 ** (sig - 1); let d;
  do { d = L === 1 ? r.int(1, Math.floor(0.4 * s)) : r.int(-Math.floor(0.4 * s), Math.floor(0.4 * s)); } while (d === 0);
  return rnd(((L * s + d) / s) * 10 ** e, 8);
}
const y7nR1 = (x) => { if (x === 0) return 0; const e = Math.floor(Math.log10(Math.abs(x)) + 1e-12); return rnd(Math.round(rnd(x / 10 ** e, 9)) * 10 ** e, 9); };

// --------------------------------------------------------------------------
topic('y7-place-value', 'number', 7, 1, 'FH', 'Place Value, Ordering & Negatives', 'Understand the value of each digit, multiply and divide by 10, 100 and 1000, order decimals and negative numbers.', [
  ['Value of a digit',
    'Each column in a place value table is worth ten times the column to its right: … thousands, hundreds, tens, ones . tenths, hundredths, thousandths. A digit’s value is the digit multiplied by its column value.',
    (r) => {
      const L = r.int(2, 6), D = r.chance(0.5) ? r.int(1, 3) : 0;
      const digs = r.sample([1, 2, 3, 4, 5, 6, 7, 8, 9], L + D);
      const numStr = commas(digs.slice(0, L).join('') + (D ? '.' + digs.slice(L).join('') : ''));
      const k = r.int(0, L + D - 1); const d = digs[k]; const p = k < L ? L - 1 - k : -(k - L + 1);
      const val = rnd(d * 10 ** p, 6);
      return {
        html: `What is the value of the digit ${B(d)} in the number ${B(numStr)}?`, ...nAns(val), format: 'Type a number, e.g. 300 or 0.07',
        hint: 'Work out which column the digit is in, counting from the ones column (the one just before the decimal point).',
        steps: [`Place value columns of ${numStr}: ${digs.map((g, i) => { const q = i < L ? L - 1 - i : -(i - L + 1); return `${g} (${y7nPlace(q)})`; }).join(', ')}`,
          `The digit ${d} is in the ${B(y7nPlace(p))} column.`, `So it is worth ${d} × ${ds(10 ** p)} = ${B(ds(val))}`],
      };
    }],
  ['Multiplying & dividing by 10, 100 and 1000',
    'Multiplying by 10, 100 or 1000 moves every digit 1, 2 or 3 places to the left (the number gets bigger). Dividing moves the digits to the right. Use zeros as placeholders where needed.',
    (r) => {
      const dpIn = r.int(0, 2); const n = rnd(r.int(11, 9999) / 10 ** dpIn, 4);
      const k = r.int(1, 3); const P = 10 ** k; const mult = r.chance();
      const res = rnd(mult ? n * P : n / P, 9); const op = mult ? '×' : '÷';
      const dir = `${mult ? 'Multiplying' : 'Dividing'} by ${ds(P)} moves every digit ${k} place${k > 1 ? 's' : ''} to the ${mult ? 'left' : 'right'}.`;
      if (r.chance(0.3)) { // missing operator number
        return {
          html: `Find the missing number: ${B(`${ds(n)} ${op} □ = ${ds(res)}`)}`, ...nAns(P), hint: 'Count how many places the digits have moved.',
          steps: [`Compare ${ds(n)} and ${ds(res)}: the digits have moved ${k} place${k > 1 ? 's' : ''} to the ${mult ? 'left' : 'right'}.`, dir, `So the missing number is ${B(ds(P))}`],
        };
      }
      return {
        html: `Work out ${B(`${ds(n)} ${op} ${ds(P)}`)}`, ...nAns(res), hint: mult ? 'The digits move left – the answer is bigger.' : 'The digits move right – the answer is smaller.',
        steps: [dir, `${ds(n)} → ${ds(res)}${mult && Number.isInteger(res) && res % 10 === 0 ? ' (zeros fill the empty columns)' : ''}`, `${ds(n)} ${op} ${ds(P)} = ${B(ds(res))}`],
      };
    }],
  ['Ordering decimals & negative numbers',
    'To order decimals, compare digits column by column from the left – writing them with the same number of decimal places helps. For negative numbers, the further below zero, the smaller the number.',
    (r) => {
      const dec = r.chance(); let vals;
      if (dec) {
        const w = r.int(0, 6); const set = new Set();
        while (set.size < 5) { const dp = r.pick([1, 2, 2, 3]); set.add(rnd(w + r.int(1, 10 ** dp - 1) / 10 ** dp, 3)); }
        vals = [...set];
      } else {
        do { const set = new Set(); while (set.size < 6) set.add(r.chance(0.2) ? r.int(-12, 11) + 0.5 : r.int(-15, 15)); vals = [...set]; } while (vals.filter((v) => v < 0).length < 3);
      }
      const big = r.chance(); const k = r.int(2, vals.length - 1);
      const sorted = [...vals].sort((a, b) => a - b); const order = big ? [...sorted].reverse() : sorted; const ans = order[k - 1];
      const dpMax = Math.max(...vals.map(y7nDp));
      return {
        html: `Here is a list of numbers:<br>${B(vals.map((v) => ds(v)).join(', &nbsp; '))}<br>Write the numbers in order, starting with the ${big ? 'largest' : 'smallest'}. Which number is ${B(ord(k))} in your list?`,
        ...nAns(ans), hint: dec ? 'Give every number the same number of decimal places, then compare.' : 'Picture a number line: numbers further left are smaller.',
        steps: [dec ? `Write each with ${dpMax} decimal places: ${vals.map((v) => fx(v, dpMax)).join(', ')}` : 'Negative numbers are smaller than positive ones; −10 is smaller than −2.',
          `In order (${big ? 'largest' : 'smallest'} first): ${order.map((v) => ds(v)).join(', ')}`, `The ${ord(k)} number is ${B(ds(ans))}`],
      };
    }],
  ['Negative numbers on a number line',
    'Adding moves you up (right) the number line, subtracting moves you down (left). To find the difference between two numbers, count the steps between them – remember to count through zero.',
    (r) => {
      const mode = r.int(0, 2);
      if (mode === 2) {
        let a = r.int(-20, -1), b = r.int(-5, 15); if (a === b) b += 3;
        return { html: `What is the difference between ${B(ds(a))} and ${B(ds(b))}?`, ...nAns(b - a), hint: 'Count from the smaller number up to the larger one.',
          steps: [`From ${ds(a)} up to ${b >= 0 ? '0' : ds(b)} is ${b >= 0 ? -a : b - a} step${(b >= 0 ? -a : b - a) === 1 ? '' : 's'}.`, b > 0 ? `From 0 up to ${b} is ${b} more step${b === 1 ? '' : 's'}.` : 'No more steps are needed.', `Difference = ${B(ds(b - a))}`] };
      }
      const a = r.int(-12, 12), d = r.int(3, 18), up = mode === 0;
      const ans = up ? a + d : a - d;
      return { html: `Work out ${B(`${ds(a)} ${up ? '+' : '−'} ${d}`)}`, ...nAns(ans), hint: up ? 'Start at the first number and count up.' : 'Start at the first number and count down.',
        steps: [`Start at ${ds(a)} on the number line.`, `Move ${d} place${d > 1 ? 's' : ''} ${up ? 'up (to the right)' : 'down (to the left)'}.`, `You land on ${B(ds(ans))}`] };
    }],
  ['Exam-style problem',
    'Read carefully and decide which steps you need: ordering, finding a difference, or multiplying/dividing by 10, 100 or 1000. Write each step down.',
    (r) => {
      const t = r.int(0, 5);
      if (t === 0) {
        const cities = r.sample(['Oslo', 'Cardiff', 'Moscow', 'Madrid', 'Ottawa', 'Helsinki', 'Belfast', 'Reykjavik', 'Warsaw', 'Inverness'], 5);
        let temps; do { temps = cities.map(() => r.int(-14, 12)); } while (new Set(temps).size < 5 || Math.min(...temps) >= 0);
        const hi = Math.max(...temps), lo = Math.min(...temps);
        return { html: `The table shows the temperature at midnight in five places.${table([['Place', ...cities], ['Temperature (°C)', ...temps.map((v) => ds(v))]])}How many degrees warmer was the warmest place than the coldest place?`,
          ...nAns(hi - lo), unit: '°C', hint: 'Find the highest and the lowest temperatures first.',
          steps: [`Warmest: ${cities[temps.indexOf(hi)]} at ${ds(hi)}°C. Coldest: ${cities[temps.indexOf(lo)]} at ${ds(lo)}°C.`, `Difference = ${ds(hi)} − ${br(lo)} = ${ds(hi)} + ${ds(-lo)}`, `The warmest place was ${B(ds(hi - lo))}°C warmer.`] };
      }
      if (t === 1) {
        const item = r.pick(['pencils', 'stickers', 'paper cups', 'balloons', 'envelopes', 'name badges']);
        if (r.chance()) {
          const p = r.int(85, 999) / 100; const N = r.pick([100, 1000]);
          return { html: `A pack of 10 ${item} costs ${money(p)}. A school needs ${ds(N)} ${item}. How much will the ${item} cost?`, ...nAns(p * N / 10, { money: true }), hint: `How many packs of 10 make ${ds(N)}?`,
            steps: [`${ds(N)} ÷ 10 = ${ds(N / 10)} packs`, `${money(p)} × ${ds(N / 10)} = ${B(money(p * N / 10))}`] };
        }
        const u = r.int(3, 95); const N = r.pick([100, 1000]); const T = u * N / 100;
        return { html: `A shop buys ${ds(N)} ${item} for ${money(T)}. How much does one of the ${item} cost? Give your answer in pence.`, ...nAns(u), unit: 'p', hint: 'Divide the total cost by the number of items, then change pounds to pence.',
          steps: [`${money(T)} ÷ ${ds(N)} = £${ps(T / N)}`, `£${ps(T / N)} = ${ps(T / N)} × 100 pence`, `One costs ${B(u + 'p')}`] };
      }
      if (t === 2) {
        const dg = r.sample([1, 2, 3, 4, 5, 6, 7, 8, 9], r.pick([4, 4, 5]));
        const big = +[...dg].sort((a, b) => b - a).join(''), small = +[...dg].sort((a, b) => a - b).join('');
        return { html: `${r.pick(y7nNames)} has these digit cards: ${B(dg.join(', '))}. Using every card once, she makes the largest possible number and the smallest possible number. What is the difference between the two numbers?`,
          ...nAns(big - small), hint: 'Largest: put the biggest digit in the highest place value column.',
          steps: [`Largest number: ${ds(big)}`, `Smallest number: ${ds(small)}`, `Difference = ${ds(big)} − ${ds(small)} = ${B(ds(big - small))}`] };
      }
      if (t === 3) {
        const nm = r.pick(y7nNames); const a = r.int(20, 150), b = a + r.int(10, 90), c = r.int(15, 120); const mid = a - b, fin = mid + c;
        return { html: `${nm} has ${money(a)} in a bank account. ${nm} pays a bill of ${money(b)}, so the account becomes overdrawn. Then ${nm} pays in ${money(c)}. What is the balance now? (Use a negative number if the account is still overdrawn.)`,
          ...nAns(fin), answerLabel: '£', hint: 'Taking away more than you have gives a negative balance.',
          steps: [`After the bill: ${ds(a)} − ${ds(b)} = ${ds(mid)}`, `After paying in: ${ds(mid)} + ${ds(c)} = ${ds(fin)}`, `The balance is ${B(fin < 0 ? '−£' + ds(-fin) : '£' + ds(fin))}`] };
      }
      if (t === 4) {
        let f, d1, u1, d2;
        do { f = r.int(-2, 9); d1 = r.int(2, 8); u1 = r.int(2, 9); d2 = r.int(2, 8); } while (f - d1 < -4 || f - d1 + u1 > 12 || f - d1 + u1 - d2 < -4 || f - d1 >= 0 && f - d1 + u1 - d2 >= 0);
        const s1 = f - d1, s2 = s1 + u1, fin = s2 - d2; const fl = (x) => (x === 0 ? 'the ground floor (0)' : `floor ${ds(x)}`);
        return { html: `In a shopping centre the ground floor is floor 0 and the car park levels are floors −1, −2, −3 and −4. A lift starts at ${fl(f)}. It goes down ${d1} floors, then up ${u1} floors, then down ${d2} floors. Which floor number does it finish on?`,
          ...nAns(fin), hint: 'Down means subtract, up means add.',
          steps: [`${ds(f)} − ${d1} = ${ds(s1)}`, `${ds(s1)} + ${u1} = ${ds(s2)}`, `${ds(s2)} − ${d2} = ${B(ds(fin))}`] };
      }
      const nms = r.sample(y7nNames, 5); const base = r.int(3, 5); let ds2;
      do { const s = new Set(); while (s.size < 5) s.add(rnd(base + r.pick([r.int(1, 9) / 10, r.int(1, 99) / 100]), 2)); ds2 = [...s]; } while (false);
      const k = r.int(2, 4); const sorted = [...ds2].sort((a, b) => b - a); const diff = rnd(sorted[0] - sorted[k - 1], 2);
      return { html: `Five pupils did the long jump. Their best jumps, in metres, were:${table([nms, ds2.map((v) => ds(v))])}How much further was the winning jump than the jump that came ${ord(k)}? Give your answer in metres.`,
        ...nAns(diff), unit: 'm', hint: 'Order the distances from longest to shortest – compare the tenths, then the hundredths.',
        steps: [`Write with 2 decimal places: ${ds2.map((v) => fx(v, 2)).join(', ')}`, `Longest to shortest: ${sorted.map((v) => fx(v, 2)).join(', ')}`, `Winner: ${fx(sorted[0], 2)} m; ${ord(k)}: ${fx(sorted[k - 1], 2)} m`, `${fx(sorted[0], 2)} − ${fx(sorted[k - 1], 2)} = ${B(ds(diff))} m`] };
    }],
]);
SPEC['y7-place-value'] = 'KS3 Number: place value, ordering & negative numbers';

// --------------------------------------------------------------------------
topic('y7-addition-subtraction', 'number', 7, 1, 'FH', 'Addition & Subtraction', 'Add and subtract whole numbers and decimals using column methods, inverse operations and money.', [
  ['Column addition',
    'Line up the digits in their place value columns (line up the decimal points too). Add each column from the right; if a column adds to 10 or more, carry the tens into the next column.',
    (r) => {
      const mode = r.int(0, 2); let nums;
      if (mode === 0) nums = [r.int(150, 9999), r.int(150, 9999)];
      else if (mode === 1) nums = [r.int(100, 999), r.int(100, 2999), r.int(20, 999)];
      else nums = [rnd(r.int(101, 9999) / 10 ** r.int(1, 2), 2), rnd(r.int(11, 999) / 10 ** r.int(0, 2), 2)];
      const D = Math.max(...nums.map(y7nDp)); const ints = nums.map((v) => Math.round(v * 10 ** D)); const ans = rnd(sum(ints) / 10 ** D, D);
      return {
        html: `Work out ${B(nums.map((v) => ds(v)).join(' + '))}`, ...nAns(ans), hint: D ? 'Line up the decimal points and fill any gaps with zeros.' : 'Start with the ones column and remember to carry.',
        steps: [D ? `Line up the decimal points: ${nums.map((v) => fx(v, D)).join(' and ')}` : 'Write the numbers in columns, lining up the ones.', `Add each column from the right:<br>${y7nColAdd(ints, D).join('<br>')}`, `Answer: ${B(ds(ans))}`],
      };
    }],
  ['Column subtraction',
    'Write the larger number on top and line up the columns (and decimal points). Subtract each column from the right. If the top digit is smaller, exchange 1 from the next column to the left.',
    (r) => {
      const mode = r.int(0, 2); let a, b, D, ia, ib;
      for (;;) {
        if (mode === 0) { a = r.int(300, 9999); b = r.int(100, a - 50); }
        else if (mode === 1) { a = r.pick([100, 500, 1000, 2000, 20, 50, 10]); b = a >= 100 ? r.int(11, a - 1) : rnd(r.int(101, a * 100 - 1) / 100, 2); }
        else { a = rnd(r.int(201, 9999) / 10 ** r.int(1, 2), 2); b = rnd(r.int(11, Math.floor(a * 100) - 1) / 10 ** r.int(1, 2), 2); }
        if (!(b > 0 && a > b)) continue;
        D = Math.max(y7nDp(a), y7nDp(b)); ia = Math.round(a * 10 ** D); ib = Math.round(b * 10 ** D);
        let ex = false; for (let i = 0; i < String(ia).length; i++) if (Math.floor(ia / 10 ** i) % 10 < Math.floor(ib / 10 ** i) % 10) ex = true;
        if (ex) break;
      }
      const ans = rnd(a - b, D);
      return {
        html: `Work out ${B(`${ds(a)} − ${ds(b)}`)}`, ...nAns(ans), hint: 'When the top digit is smaller, exchange 1 from the column to the left.',
        steps: [D ? `Line up the decimal points: ${fx(a, D)} − ${fx(b, D)}` : `Write ${ds(a)} on top and ${ds(b)} underneath, lining up the ones.`, `Subtract each column from the right:<br>${y7nColSub(ia, ib, D).join('<br>')}`, `Answer: ${B(ds(ans))}`, `Check: ${ds(ans)} + ${ds(b)} = ${ds(a)} ✓`],
      };
    }],
  ['Missing numbers (inverse operations)',
    'Addition and subtraction are inverse operations – one undoes the other. To find a missing number, rearrange using the inverse, then check by putting your answer back in.',
    (r) => {
      const dec = r.chance(0.3); const g = () => (dec ? r.int(105, 999) / 10 : r.int(105, 999));
      let x = g(), y = g(); const mode = r.int(0, 3); let lhs, rhs, ans, how;
      if (mode === 0) { const c = rnd(x + y, 1); lhs = `□ + ${ds(y)}`; rhs = ds(c); ans = x; how = `□ = ${ds(c)} − ${ds(y)}`; }
      else if (mode === 1) { const c = rnd(x + y, 1); lhs = `${ds(x)} + □`; rhs = ds(c); ans = y; how = `□ = ${ds(c)} − ${ds(x)}`; }
      else if (mode === 2) { const c = x; lhs = `□ − ${ds(y)}`; rhs = ds(c); ans = rnd(x + y, 1); how = `□ = ${ds(c)} + ${ds(y)}`; }
      else { if (x < y) [x, y] = [y, x]; if (x === y) x = rnd(x + 12, 1); const c = rnd(x - y, 1); lhs = `${ds(x)} − □`; rhs = ds(c); ans = y; how = `□ = ${ds(x)} − ${ds(c)}`; }
      ans = rnd(ans, 1);
      return {
        html: `Find the missing number: ${B(`${lhs} = ${rhs}`)}`, ...nAns(ans), hint: 'Use the inverse operation to undo what has been done.',
        steps: [mode === 2 ? 'Something take away a number gives the result, so add the number back on.' : mode === 3 ? 'The missing number is the gap between the two numbers, so subtract.' : 'The missing number plus the other number makes the total, so subtract.', `${how} = ${B(ds(ans))}`, `Check: ${lhs.replace('□', ds(ans))} = ${rhs} ✓`],
      };
    }],
  ['Exam-style problem',
    'Pick out the numbers you need, decide whether to add or subtract at each stage, and set out each calculation clearly. For money, keep two decimal places.',
    (r) => {
      const t = r.int(0, 5); const nm = r.pick(y7nNames);
      if (t === 0) {
        const items = r.sample([['a sandwich', 2.15, 4.2], ['a drink', 0.85, 1.95], ['a magazine', 2.5, 5.99], ['a pen set', 3.2, 7.49], ['a cake', 1.1, 3.75], ['a notebook', 1.25, 3.5], ['a phone case', 4.99, 9.99]], r.int(2, 3));
        const prices = items.map(([, lo, hi]) => rnd(r.int(Math.round(lo * 100), Math.round(hi * 100)) / 100, 2));
        const tot = rnd(sum(prices), 2); const note = [5, 10, 20, 50].find((n) => n > tot + 0.5) || 50; const ch = rnd(note - tot, 2);
        return { html: `${nm} buys ${items.map(([n], i) => `${n} for ${money(prices[i])}`).join(', ').replace(/, ([^,]*)$/, ' and $1')}. ${nm} pays with a ${money(note).replace('.00', '')} note. How much change should ${nm} get?`,
          ...nAns(ch, { money: true }), hint: 'Add up the prices, then subtract the total from the note.',
          steps: [`Total cost: ${prices.map(money).join(' + ')} = ${money(tot)}`, `Change: ${money(note)} − ${money(tot)} = ${B(money(ch))}`] };
      }
      if (t === 1) {
        const s = r.int(12, 40), off1 = r.int(3, s - 2), on1 = r.int(2, 15), m1 = s - off1 + on1, off2 = r.int(2, m1 - 1), on2 = r.int(0, 12), fin = m1 - off2 + on2;
        return { html: `A bus leaves the station with ${s} passengers. At the first stop ${off1} people get off and ${on1} get on. At the second stop ${off2} people get off and ${on2} get on. How many passengers are on the bus now?`,
          ...nAns(fin), hint: 'Getting off means subtract; getting on means add.',
          steps: [`After stop 1: ${s} − ${off1} + ${on1} = ${m1}`, `After stop 2: ${m1} − ${off2} + ${on2} = ${B(fin)}`] };
      }
      if (t === 2) {
        const T = r.pick([500, 750, 1000, 1200, 1500, 2000]); let a, b, c;
        do { a = r.int(8000, Math.round(T * 30)) / 100; b = r.int(5000, Math.round(T * 25)) / 100; c = r.int(1000, Math.round(T * 20)) / 100; } while (a + b + c >= T - 10);
        const tot = rnd(a + b + c, 2), need = rnd(T - tot, 2);
        return { html: `A school wants to raise ${money(T)} for a trip. A cake sale raises ${money(a)}, a sponsored walk raises ${money(b)} and a quiz night raises ${money(c)}. How much more money does the school need to raise?`,
          ...nAns(need, { money: true }), hint: 'Add up what has been raised, then subtract from the target.',
          steps: [`Raised so far: ${money(a)} + ${money(b)} + ${money(c)} = ${money(tot)}`, `Still needed: ${money(T)} − ${money(tot)} = ${B(money(need))}`] };
      }
      if (t === 3) {
        const L = r.int(3, 6); const obj = r.pick([['plank of wood', 'cuts off'], ['roll of ribbon', 'cuts off'], ['length of rope', 'cuts off'], ['pipe', 'saws off']]);
        let p1, p2; do { p1 = r.int(45, 230) / 100; p2 = r.int(30, 190) / 100; } while (p1 + p2 > L - 0.2);
        const used = rnd(p1 + p2, 2), left = rnd(L - used, 2);
        return { html: `A ${obj[0]} is ${L} m long. ${nm} ${obj[1]} a piece ${ds(p1)} m long and another piece ${ds(p2)} m long. What length is left? Give your answer in metres.`,
          ...nAns(left), unit: 'm', hint: 'Find the total length cut off first.',
          steps: [`Total cut off: ${fx(p1, 2)} + ${fx(p2, 2)} = ${fx(used, 2)} m`, `Left: ${L}.00 − ${fx(used, 2)} = ${B(ds(left))} m`] };
      }
      if (t === 4) {
        const towns = r.sample(['Ashford', 'Bexley', 'Corby', 'Derwent', 'Ely', 'Frome', 'Hexham', 'Ludlow'], 2);
        const a1 = r.int(120, 480) / 10, a2 = r.int(120, 480) / 10, b1 = r.int(120, 480) / 10, b2 = r.int(120, 480) / 10;
        const A = rnd(a1 + a2, 1), Bt = rnd(b1 + b2, 1); if (A === Bt) return { html: `Route A from home to the coast goes through ${towns[0]}: ${ds(a1)} km then ${ds(a2)} km. How long is route A in kilometres?`, ...nAns(A), unit: 'km', hint: 'Add the two parts.', steps: [`${ds(a1)} + ${ds(a2)}`, `= ${B(ds(A))} km`] };
        const d = rnd(Math.abs(A - Bt), 1);
        return { html: `There are two routes from ${nm}’s home to the coast. Route A goes through ${towns[0]}: ${ds(a1)} km then ${ds(a2)} km. Route B goes through ${towns[1]}: ${ds(b1)} km then ${ds(b2)} km. How much shorter is the shorter route, in kilometres?`,
          ...nAns(d), unit: 'km', hint: 'Work out the total length of each route, then find the difference.',
          steps: [`Route A: ${ds(a1)} + ${ds(a2)} = ${ds(A)} km`, `Route B: ${ds(b1)} + ${ds(b2)} = ${ds(Bt)} km`, `Difference: ${ds(Math.max(A, Bt))} − ${ds(Math.min(A, Bt))} = ${B(ds(d))} km`] };
      }
      const N = r.int(650, 1800), g = r.int(Math.floor(N * 0.35), Math.floor(N / 2) - 3), bo = N - g;
      return { html: `There are ${ds(N)} pupils in a school. ${ds(g)} of them are girls and the rest are boys. How many more boys than girls are there?`,
        ...nAns(bo - g), hint: 'First work out how many boys there are.',
        steps: [`Boys: ${ds(N)} − ${ds(g)} = ${ds(bo)}`, `Difference: ${ds(bo)} − ${ds(g)} = ${B(ds(bo - g))}`] };
    }],
]);
SPEC['y7-addition-subtraction'] = 'KS3 Number: written methods for addition & subtraction';

// --------------------------------------------------------------------------
topic('y7-multiplication-division', 'number', 7, 1, 'FH', 'Multiplication & Division', 'Multiply and divide using written methods, interpret remainders, and multiply and divide decimals by whole numbers.', [
  ['Long multiplication',
    'Split the second number into tens and ones (a grid method does this). Multiply the first number by each part, then add the results together.',
    (r) => {
      const a = r.chance(0.6) ? r.int(23, 99) : r.int(102, 499); const b = r.int(12, 89); const t = Math.floor(b / 10) * 10, o = b % 10;
      const ans = a * b;
      return {
        html: `Work out ${B(`${ds(a)} × ${ds(b)}`)}`, ...nAns(ans), hint: `Split ${b} into ${t}${o ? ' and ' + o : ''}.`,
        steps: [`Split ${b} = ${t}${o ? ' + ' + o : ''}`, `${a} × ${t} = ${ds(a * t)}`, ...(o ? [`${a} × ${o} = ${ds(a * o)}`, `${ds(a * t)} + ${ds(a * o)} = ${B(ds(ans))}`] : [`Answer: ${B(ds(ans))}`])],
      };
    }],
  ['Division & remainders',
    'Use short division: divide into each digit from the left, carrying any remainder to the next digit. In a problem, decide whether the remainder means you round up, round down or give what is left over.',
    (r) => {
      const t = r.int(0, 4);
      if (t === 0) {
        const d = r.int(3, 9), q = r.int(112, 999), n = d * q;
        return { html: `Work out ${B(`${ds(n)} ÷ ${d}`)}`, ...nAns(q), hint: 'Use short division (the bus stop method).',
          steps: [`Divide ${ds(n)} by ${d}, one digit at a time from the left, carrying remainders.`, `${ds(n)} ÷ ${d} = ${B(ds(q))}`, `Check: ${ds(q)} × ${d} = ${ds(n)} ✓`] };
      }
      const d = t === 1 ? r.pick([6, 8, 12, 16, 24]) : r.int(4, 9) + (r.chance() ? 0 : r.pick([3, 6]));
      const q = r.int(8, 60), rem = r.int(1, d - 1), n = q * d + rem;
      if (t === 1) {
        const [thing, box] = r.pick([['eggs', 'boxes'], ['cupcakes', 'boxes'], ['pencils', 'packs'], ['bottles of water', 'crates']]);
        return { html: `A factory has ${ds(n)} ${thing}. They are packed into ${box} of ${d}. How many ${box} can be completely filled?`, ...nAns(q), hint: 'Divide, then think about what the remainder means.',
          steps: [`${ds(n)} ÷ ${d} = ${q} remainder ${rem}`, `The ${rem} left over cannot fill another ${box.replace(/e?s$/, '')}, so round down.`, `${B(q)} ${box} are full.`] };
      }
      if (t === 2) {
        const [ppl, veh] = r.pick([['pupils', 'minibuses'], ['people', 'taxis'], ['campers', 'tents'], ['guests', 'tables']]);
        return { html: `${ds(n)} ${ppl} need ${veh}. Each one holds ${d} ${ppl}. What is the smallest number of ${veh} needed?`, ...nAns(q + 1), hint: 'Everyone needs a place – think about the remainder.',
          steps: [`${ds(n)} ÷ ${d} = ${q} remainder ${rem}`, `The ${rem} extra ${ppl} still need one more, so round up.`, `${q} + 1 = ${B(q + 1)}`] };
      }
      if (t === 3) {
        return { html: `${ds(n)} sweets are shared equally between ${d} party bags. Each bag gets as many sweets as possible. How many sweets are left over?`, ...nAns(rem), hint: 'The answer is the remainder.',
          steps: [`${ds(n)} ÷ ${d} = ${q} remainder ${rem}`, `Each bag gets ${q} sweets and ${B(rem)} are left over.`] };
      }
      return { html: `Work out the remainder when ${B(ds(n))} is divided by ${B(d)}.`, ...nAns(rem), hint: 'Find the biggest multiple of the divisor that fits, then see what is left.',
        steps: [`${d} × ${q} = ${ds(q * d)}`, `${ds(n)} − ${ds(q * d)} = ${rem}`, `Remainder: ${B(rem)}`] };
    }],
  ['Decimals × and ÷ whole numbers',
    'Ignore the decimal point and multiply or divide as whole numbers, then put the decimal point back in the right place. A quick estimate helps you check.',
    (r) => {
      const k = r.int(2, 9); const dp = r.int(1, 2); let a; do { a = r.int(12, 999) / 10 ** dp; } while (a % 1 === 0);
      if (r.chance()) {
        const p = rnd(a * k, dp); const ia = Math.round(a * 10 ** dp);
        return { html: `Work out ${B(`${ds(a)} × ${k}`)}`, ...nAns(p), hint: 'Multiply without the decimal point, then put it back.',
          steps: [`Ignore the decimal point: ${ia} × ${k} = ${ia * k}`, `${ds(a)} has ${dpWord(dp)}, so the answer has ${dpWord(dp)}.`, `${ds(a)} × ${k} = ${B(ds(p))}`] };
      }
      const n = rnd(a * k, dp); const in_ = Math.round(n * 10 ** dp);
      return { html: `Work out ${B(`${ds(n)} ÷ ${k}`)}`, ...nAns(a), hint: 'Use short division and keep the decimal point lined up.',
        steps: [`Use short division, keeping the decimal point in the same place: ${in_} ÷ ${k} = ${in_ / k}`, `Put the decimal point back: ${ds(n)} ÷ ${k} = ${B(ds(a))}`, `Check: ${ds(a)} × ${k} = ${ds(n)} ✓`] };
    }],
  ['Exam-style problem',
    'Work out what has to be multiplied and what has to be divided. With remainders, think about whether to round up or down. Show each calculation.',
    (r) => {
      const t = r.int(0, 5); const nm = r.pick(y7nNames);
      if (t === 0) {
        const n = r.int(18, 45), s = r.int(6, 15), tk = r.int(9, 39) / 2 + 0.25 * r.int(0, 1) * 0; const C = n * s; const each = rnd(s + tk, 2);
        return { html: `${n} pupils go on a trip to a ${r.pick(['museum', 'zoo', 'theme park', 'science centre'])}. The coach costs ${money(C)} in total and is shared equally between the pupils. Each entry ticket costs ${money(tk)}. How much does each pupil pay altogether?`,
          ...nAns(each, { money: true }), hint: 'Share the coach cost first, then add the ticket.',
          steps: [`Coach per pupil: ${money(C)} ÷ ${n} = ${money(s)}`, `Total per pupil: ${money(s)} + ${money(tk)} = ${B(money(each))}`] };
      }
      if (t === 1) {
        const hens = r.int(12, 48), days = 7, box = r.pick([6, 12]); let tot = hens * days; if (tot % box === 0) tot -= 0;
        const lay = tot; const full = Math.floor(lay / box), left = lay % box;
        return { html: `A farm has ${hens} hens. Each hen lays one egg a day. The eggs are put into boxes of ${box}. How many boxes can be completely filled with the eggs laid in one week?`,
          ...nAns(full), hint: 'Find the number of eggs in a week first.',
          steps: [`Eggs in a week: ${hens} × 7 = ${lay}`, `${lay} ÷ ${box} = ${full}${left ? ` remainder ${left}` : ''}`, `${B(full)} boxes can be filled.`] };
      }
      if (t === 2) {
        const h = r.int(1050, 1595) / 100, x = r.int(3, 8), d = r.int(3, 6); const hrs = x * d; const pay = rnd(h * hrs, 2);
        return { html: `${nm} earns ${money(h)} per hour at a café. ${nm} works ${x} hours a day for ${d} days. How much does ${nm} earn altogether?`,
          ...nAns(pay, { money: true }), hint: 'Find the total number of hours first.',
          steps: [`Hours worked: ${x} × ${d} = ${hrs}`, `Pay: ${money(h)} × ${hrs} = ${B(money(pay))}`] };
      }
      if (t === 3) {
        const [it, k] = r.pick([['bread rolls', 8], ['burgers', 6], ['juice cartons', 12], ['paper plates', 20]]);
        const p = r.int(120, 480) / 100; let need; do { need = r.int(35, 150); } while (need % k === 0);
        const packs = Math.ceil(need / k), cost = rnd(packs * p, 2);
        return { html: `${it[0].toUpperCase() + it.slice(1)} are sold in packs of ${k}. Each pack costs ${money(p)}. ${nm} needs ${need} ${it} for a party. What is the least amount ${nm} can spend?`,
          ...nAns(cost, { money: true }), hint: 'Work out how many packs are needed – you can only buy whole packs.',
          steps: [`${need} ÷ ${k} = ${Math.floor(need / k)} remainder ${need % k}`, `So ${packs} packs are needed (round up).`, `Cost: ${packs} × ${money(p)} = ${B(money(cost))}`] };
      }
      if (t === 4) {
        const row = r.pick([12, 14, 15, 16, 18, 20, 24]); let n; do { n = r.int(100, 400); } while (n % row === 0);
        const rows = Math.ceil(n / row), empty = rows * row - n;
        return { html: `Chairs in a hall are set out in rows of ${row}. ${n} people are coming to a concert. Just enough rows are set out for everyone to have a seat. How many seats will be empty?`,
          ...nAns(empty), hint: 'Find how many rows are needed, then how many seats that gives.',
          steps: [`${n} ÷ ${row} = ${Math.floor(n / row)} remainder ${n % row}, so ${rows} rows are needed.`, `Seats: ${rows} × ${row} = ${rows * row}`, `Empty: ${rows * row} − ${n} = ${B(empty)}`] };
      }
      const q = r.int(6, 24), p = r.int(125, 495) / 100, cost = rnd(q * p, 2); const note = cost < 50 ? 50 : 100;
      return { html: `A garden club buys ${q} plants costing ${money(p)} each. They pay with ${money(note).replace('.00', '')}. How much change do they get?`,
        ...nAns(note - cost, { money: true }), hint: 'Multiply to find the total cost, then subtract from the amount paid.',
        steps: [`Cost: ${q} × ${money(p)} = ${money(cost)}`, `Change: ${money(note)} − ${money(cost)} = ${B(money(note - cost))}`] };
    }],
]);
SPEC['y7-multiplication-division'] = 'KS3 Number: written methods for multiplication & division';

// --------------------------------------------------------------------------
topic('y7-factors-primes', 'number', 7, 2, 'FH', 'Factors, Multiples, Primes, Powers & Roots', 'Find factors and multiples, recognise primes, and work with squares, cubes and roots.', [
  ['Factors & multiples',
    'Factors of a number divide into it exactly – find them in pairs that multiply to the number. Multiples are in the times table of the number.',
    (r) => {
      const mode = r.int(0, 2);
      if (mode === 0) {
        const n = r.pick([12, 16, 18, 20, 24, 28, 30, 32, 36, 40, 42, 45, 48, 50, 54, 56, 60, 63, 64, 72, 75, 80, 84, 90, 96, 100]); const f = y7nFactors(n);
        return { html: `How many factors does ${B(n)} have?`, ...nAns(f.length), hint: 'Find factor pairs, starting with 1 × the number.',
          steps: [`Factor pairs: ${y7nFactorPairs(n).join(', ')}`, `Factors: ${f.join(', ')}`, `${n} has ${B(f.length)} factors.`] };
      }
      if (mode === 1) {
        const a = r.int(3, 15), k = r.int(6, 15);
        return { html: `What is the ${B(ord(k))} multiple of ${B(a)}?`, ...nAns(a * k), hint: `The ${ord(k)} multiple is ${k} × the number.`,
          steps: [`Multiples of ${a}: ${a}, ${2 * a}, ${3 * a}, …`, `The ${ord(k)} multiple is ${k} × ${a} = ${B(a * k)}`] };
      }
      const a = r.int(3, 12), L = r.int(10, 60), U = L + r.int(25, 70);
      const first = Math.ceil(L / a) * a, last = Math.floor(U / a) * a, cnt = (last - first) / a + 1;
      return { html: `How many multiples of ${B(a)} are there between ${B(L)} and ${B(U)}?`, ...nAns(cnt), hint: 'Find the first and last multiples in the range.',
        steps: [`First multiple of ${a} in the range: ${first}; last: ${last}`, `Multiples: ${Array.from({ length: cnt }, (_, i) => first + i * a).join(', ')}`, `There are ${B(cnt)}.`] };
    }],
  ['Primes, common factors & common multiples',
    'A prime number has exactly two factors: 1 and itself (1 is not prime). For common factors or multiples, list them for each number and look for ones that appear in both lists.',
    (r) => {
      const mode = r.int(0, 2);
      if (mode === 0) {
        const a = r.int(1, 80), b = a + r.int(10, 25); const pr = []; for (let i = a + 1; i < b; i++) if (isPrime(i)) pr.push(i);
        return { html: `How many prime numbers are there between ${B(a)} and ${B(b)}?`, ...nAns(pr.length), hint: 'Check each number: does it have any factors other than 1 and itself?',
          steps: ['A prime has exactly two factors. Even numbers (except 2) and multiples of 3, 5 or 7 are not prime.', `Primes between ${a} and ${b}: ${pr.length ? pr.join(', ') : 'none'}`, `There are ${B(pr.length)}.`] };
      }
      if (mode === 1) {
        let a, b; do { a = r.int(2, 12); b = r.int(2, 15); } while (a === b || a % b === 0 || b % a === 0);
        const L = lcm(a, b); const m = (x) => Array.from({ length: L / x }, (_, i) => x * (i + 1)).join(', ');
        return { html: `Find the lowest common multiple of ${B(a)} and ${B(b)}.`, ...nAns(L), hint: 'List the multiples of each number until you find one in both lists.',
          steps: [`Multiples of ${a}: ${m(a)}`, `Multiples of ${b}: ${m(b)}`, `The first one in both lists is ${B(L)}.`] };
      }
      let g, p, q; do { g = r.int(2, 12); p = r.int(1, 6); q = r.int(2, 7); } while (p === q || gcd(p, q) !== 1 || g * Math.max(p, q) > 72);
      const a = g * p, b = g * q;
      return { html: `Find the highest common factor of ${B(a)} and ${B(b)}.`, ...nAns(g), hint: 'List the factors of each number and find the biggest one in both lists.',
        steps: [`Factors of ${a}: ${y7nFactors(a).join(', ')}`, `Factors of ${b}: ${y7nFactors(b).join(', ')}`, `The highest factor in both lists is ${B(g)}.`] };
    }],
  ['Squares, cubes & roots',
    'A square number is a number times itself (5² = 25); a cube is a number times itself three times (2³ = 8). The square root undoes squaring and the cube root undoes cubing.',
    (r) => {
      const mode = r.int(0, 5);
      if (mode === 0) { const n = r.int(2, 15); return { html: `Work out ${B(`${n}<sup>2</sup>`)}`, ...nAns(n * n), hint: 'Squaring means multiplying the number by itself.', steps: [`${n}<sup>2</sup> = ${n} × ${n}`, `= ${B(n * n)}`] }; }
      if (mode === 1) { const n = r.int(1, 10); return { html: `Work out ${B(`${n}<sup>3</sup>`)}`, ...nAns(n ** 3), hint: 'Cubing means multiplying three lots of the number.', steps: [`${n}<sup>3</sup> = ${n} × ${n} × ${n}`, `= ${n * n} × ${n} = ${B(n ** 3)}`] }; }
      if (mode === 2) { const n = r.int(2, 15); return { html: `Work out ${B(`√${n * n}`)}`, ...nAns(n), hint: 'Which number multiplied by itself gives this?', steps: [`${n} × ${n} = ${n * n}`, `So √${n * n} = ${B(n)}`] }; }
      if (mode === 3) { const n = r.int(2, 10); return { html: `Work out ${B(`∛${n ** 3}`)} (the cube root of ${n ** 3}).`, ...nAns(n), hint: 'Which number cubed gives this?', steps: [`${n} × ${n} × ${n} = ${n ** 3}`, `So ∛${n ** 3} = ${B(n)}`] }; }
      if (mode === 4) {
        const a = r.int(2, 12), b = r.int(2, 5); const add = r.chance(); let v = add ? a * a + b ** 3 : a * a - b ** 3;
        if (!add && v < 0) v = b ** 3 - a * a;
        const big = !add && a * a < b ** 3; const expr = add ? `${a}<sup>2</sup> + ${b}<sup>3</sup>` : big ? `${b}<sup>3</sup> − ${a}<sup>2</sup>` : `${a}<sup>2</sup> − ${b}<sup>3</sup>`;
        return { html: `Work out ${B(expr)}`, ...nAns(v), hint: 'Work out the powers first.', steps: [`${a}<sup>2</sup> = ${a * a} and ${b}<sup>3</sup> = ${b ** 3}`, `${add ? `${a * a} + ${b ** 3}` : big ? `${b ** 3} − ${a * a}` : `${a * a} − ${b ** 3}`} = ${B(v)}`] };
      }
      const a = r.int(2, 12), k = r.int(2, 9);
      return { html: `Work out ${B(`${k} × √${a * a}`)}`, ...nAns(k * a), hint: 'Find the square root first.', steps: [`√${a * a} = ${a}`, `${k} × ${a} = ${B(k * a)}`] };
    }],
  ['Exam-style problem',
    'Decide what the question needs: a common multiple (things that repeat or must match up), a common factor (sharing into equal groups), or a square/cube root (finding a side from an area or volume).',
    (r) => {
      const t = r.int(0, 5); const nm = r.pick(y7nNames);
      if (t === 0) {
        let a, b; do { a = r.pick([4, 5, 6, 8, 10, 12]); b = r.pick([6, 8, 9, 10, 12, 15]); } while (a === b || a % b === 0 || b % a === 0);
        const [x, y] = r.pick([['sausages', 'bread rolls'], ['burgers', 'buns'], ['cups', 'lids'], ['plates', 'napkins']]); const L = lcm(a, b);
        return { html: `${x[0].toUpperCase() + x.slice(1)} come in packs of ${a}. ${y[0].toUpperCase() + y.slice(1)} come in packs of ${b}. ${nm} wants to buy exactly the same number of ${x} and ${y}. What is the smallest number of packs of ${x} ${nm} can buy?`,
          ...nAns(L / a), hint: 'Find the lowest common multiple of the two pack sizes.',
          steps: [`Multiples of ${a}: ${Array.from({ length: L / a }, (_, i) => a * (i + 1)).join(', ')}`, `Multiples of ${b}: ${Array.from({ length: L / b }, (_, i) => b * (i + 1)).join(', ')}`, `LCM = ${L}, so ${nm} needs ${L} of each.`, `Packs of ${x}: ${L} ÷ ${a} = ${B(L / a)}`] };
      }
      if (t === 1) {
        let g, p, q; do { g = r.int(3, 12); p = r.int(2, 8); q = r.int(2, 9); } while (p === q || gcd(p, q) !== 1);
        const [x, y] = r.pick([['pencils', 'rubbers'], ['apples', 'oranges'], ['red counters', 'blue counters'], ['stickers', 'badges']]);
        return { html: `A teacher has ${g * p} ${x} and ${g * q} ${y}. She puts them into identical groups, with nothing left over, making as many groups as possible. How many ${x} are in each group?`,
          ...nAns(p), hint: 'The number of groups is the highest common factor.',
          steps: [`Factors of ${g * p}: ${y7nFactors(g * p).join(', ')}`, `Factors of ${g * q}: ${y7nFactors(g * q).join(', ')}`, `HCF = ${g}, so there are ${g} groups.`, `${x[0].toUpperCase() + x.slice(1)} in each group: ${g * p} ÷ ${g} = ${B(p)}`] };
      }
      if (t === 2) {
        const s = r.int(5, 20), c = r.pick([2, 3, 4, 5, 6, 8]); const A = s * s, P = 4 * s;
        return { html: `A square ${r.pick(['vegetable patch', 'lawn', 'playground', 'paddock'])} has an area of ${ds(A)} m². A fence is put all the way around it. Fencing costs £${c} per metre. How much does the fence cost?`,
          ...nAns(P * c, { money: true }), hint: 'The side length of a square is the square root of its area.',
          steps: [`Side = √${A} = ${s} m`, `Perimeter = 4 × ${s} = ${P} m`, `Cost = ${P} × £${c} = ${B(money(P * c))}`] };
      }
      if (t === 3) {
        const s = r.int(2, 10); const V = s ** 3;
        return { html: `A cube-shaped ${r.pick(['box', 'storage crate', 'gift box', 'block'])} has a volume of ${ds(V)} cm³. What is the area of one face of the cube?`,
          ...nAns(s * s), unit: 'cm²', hint: 'The edge length is the cube root of the volume.',
          steps: [`Edge length = ∛${V} = ${s} cm`, `Area of one face = ${s} × ${s} = ${B(s * s)} cm²`] };
      }
      if (t === 4) {
        let a, b; do { a = r.int(4, 15); b = r.int(4, 20); } while (a === b || a % b === 0 || b % a === 0 || lcm(a, b) > 120);
        const L = lcm(a, b); const T = L * r.int(3, 8) + r.int(0, L - 1);
        return { html: `A red light flashes every ${a} seconds and a green light flashes every ${b} seconds. They flash together at the start. How many more times do they flash together in the next ${T} seconds?`,
          ...nAns(Math.floor(T / L)), hint: 'Find how often they flash together (the LCM).',
          steps: [`Multiples of ${a} and ${b}: the first common one is ${L}, so they flash together every ${L} seconds.`, `${T} ÷ ${L} = ${Math.floor(T / L)}${T % L ? ` remainder ${T % L}` : ''}`, `They flash together ${B(Math.floor(T / L))} more times.`] };
      }
      // number puzzle
      for (let tries = 0; tries < 200; tries++) {
        const lo = r.int(10, 80), hi = lo + r.int(15, 30); const sqr = r.chance();
        const k = sqr ? r.pick([2, 3, 4, 5, 6, 8]) : r.pick([3, 4, 5, 6, 10]); const c = r.int(1, k - 1);
        const ok = []; for (let n = lo + 1; n < hi; n++) { if (sqr ? Number.isInteger(Math.sqrt(n)) && n % k === 0 : isPrime(n) && n % k === c) ok.push(n); }
        if (ok.length !== 1) continue;
        const v = ok[0];
        const clue = sqr ? `It is a square number and a multiple of ${k}.` : `It is a prime number. When it is divided by ${k} the remainder is ${c}.`;
        const cand = []; for (let n = lo + 1; n < hi; n++) if (sqr ? Number.isInteger(Math.sqrt(n)) : isPrime(n)) cand.push(n);
        return { html: `${nm} is thinking of a number between ${lo} and ${hi}. ${clue} What is ${nm}’s number?`, ...nAns(v), hint: sqr ? 'List the square numbers in the range first.' : 'List the prime numbers in the range first.',
          steps: [`${sqr ? 'Square numbers' : 'Primes'} between ${lo} and ${hi}: ${cand.join(', ')}`, sqr ? `Only ${v} is a multiple of ${k}.` : `Only ${v} leaves remainder ${c} when divided by ${k} (${v} = ${k} × ${Math.floor(v / k)} + ${c}).`, `The number is ${B(v)}`] };
      }
      return { html: `${nm} is thinking of a number between 40 and 60. It is a square number. What is it?`, ...nAns(49), hint: 'List the square numbers.', steps: ['Squares: 36, 49, 64', `Only ${B(49)} is between 40 and 60.`] };
    }],
]);
SPEC['y7-factors-primes'] = 'KS3 Number: factors, multiples, primes, powers & roots';

// --------------------------------------------------------------------------
const y7nF = (n, d) => (d === 1 ? ds(n) : frac(ds(n), ds(d)));
topic('y7-fractions', 'number', 7, 2, 'FH', 'Fractions', 'Equivalent fractions, simplifying, fractions of amounts, comparing fractions, and adding and subtracting fractions.', [
  ['Equivalent fractions & simplifying',
    'Multiplying or dividing the numerator and denominator by the same number gives an equivalent fraction. To simplify, divide both by their highest common factor.',
    (r) => {
      let a, b; do { b = r.int(2, 12); a = r.int(1, b - 1); } while (gcd(a, b) !== 1);
      const k = r.int(2, 9);
      if (r.chance()) {
        const top = r.chance();
        return { html: `Find the missing number: ${B(`${y7nF(a, b)} = ${top ? frac('□', b * k) : frac(a * k, '□')}`)}`, ...nAns(top ? a * k : b * k), hint: 'What has the known number been multiplied by?',
          steps: [top ? `${b} × ${k} = ${b * k}, so the denominator was multiplied by ${k}.` : `${a} × ${k} = ${a * k}, so the numerator was multiplied by ${k}.`, top ? `Do the same to the numerator: ${a} × ${k} = ${B(a * k)}` : `Do the same to the denominator: ${b} × ${k} = ${B(b * k)}`] };
      }
      return { html: `Write ${B(y7nF(a * k, b * k))} in its simplest form.`, ...fAns(a * k, b * k), hint: 'Find the highest common factor of the numerator and denominator.',
        steps: [`The HCF of ${a * k} and ${b * k} is ${k}.`, `${a * k} ÷ ${k} = ${a} and ${b * k} ÷ ${k} = ${b}`, `${y7nF(a * k, b * k)} = ${B(y7nF(a, b))}`] };
    }],
  ['Fraction of an amount',
    'To find a fraction of an amount, divide by the denominator (bottom) to find one part, then multiply by the numerator (top).',
    (r) => {
      let a, b; do { b = r.pick([2, 3, 4, 5, 6, 7, 8, 9, 10, 12]); a = r.int(1, b - 1); } while (gcd(a, b) !== 1);
      const N = b * r.int(3, 25); const u = r.pick(['', '£', 'kg', 'm', 'ml', 'cm', 'g']);
      const show = (v) => (u === '£' ? '£' + ds(v) : ds(v) + (u ? ' ' + u : ''));
      return { html: `Work out ${B(`${y7nF(a, b)} of ${show(N)}`)}`, ...nAns(a * N / b), unit: u === '£' ? '' : u, answerLabel: u === '£' ? '£' : '', hint: 'Divide by the bottom, multiply by the top.',
        steps: [`${y7nF(1, b)} of ${show(N)} = ${ds(N)} ÷ ${b} = ${show(N / b)}`, `${y7nF(a, b)} of ${show(N)} = ${ds(N / b)} × ${a} = ${B(show(a * N / b))}`] };
    }],
  ['Adding & subtracting fractions',
    'You can only add or subtract fractions with the same denominator: add or subtract the numerators and keep the denominator. If the denominators are different, change one fraction into an equivalent fraction first. Simplify your answer.',
    (r) => {
      const b = r.pick([3, 4, 5, 6, 7, 8, 9, 10, 12]); const m = r.chance(0.5) ? 1 : r.pick([2, 3]); const D = b * m;
      let a1, a2; do { a1 = r.int(1, b - 1); a2 = r.int(1, D - 1); } while (gcd(a1, b) !== 1 || gcd(a2, D) !== 1 || a1 * m === a2);
      const add = r.chance(); let n1 = a1 * m, n2 = a2; let first = [a1, b], second = [a2, D]; let swap = false;
      if (!add && n1 < n2) { swap = true; }
      const [p, q] = swap ? [n2, n1] : [n1, n2]; const res = add ? p + q : p - q;
      const exprH = swap ? `${y7nF(second[0], second[1])} − ${y7nF(first[0], first[1])}` : `${y7nF(first[0], first[1])} ${add ? '+' : '−'} ${y7nF(second[0], second[1])}`;
      const steps = [];
      if (m > 1) steps.push(`Change to a common denominator of ${D}: ${y7nF(a1, b)} = ${y7nF(a1 * m, D)}`);
      steps.push(`${y7nF(p, D)} ${add ? '+' : '−'} ${y7nF(q, D)} = ${y7nF(res, D)}`);
      steps.push(gcd(res, D) > 1 ? `Simplify: ${y7nF(res, D)} = ${B(fracS(res, D))}` : `Answer: ${B(fracN(res, D))}`);
      return { html: `Work out ${B(exprH)}`, ...fAns(res, D), format: 'Give your answer as a fraction in its simplest form, e.g. 3/4 or 1 1/4', hint: m > 1 ? `Change ${y7nF(a1, b)} into ${D}ths first.` : 'The denominators are the same, so just work with the numerators.', steps };
    }],
  ['Comparing & ordering fractions',
    'To compare fractions, write them with a common denominator – then the fraction with the bigger numerator is bigger.',
    (r) => {
      let fr, L;
      do {
        const ds_ = r.sample([2, 3, 4, 5, 6, 8, 9, 10, 12], r.int(3, 4)); fr = ds_.map((d) => { let n; do { n = r.int(1, d - 1); } while (gcd(n, d) !== 1); return [n, d]; });
        L = fr.reduce((acc, [, d]) => lcm(acc, d), 1);
      } while (L > 72 || new Set(fr.map(([n, d]) => n * L / d)).size < fr.length);
      const big = r.chance(); const pickF = fr.reduce((best, f) => ((f[0] / f[1] > best[0] / best[1]) === big ? f : best));
      return { html: `Which of these fractions is the ${big ? 'largest' : 'smallest'}?<br>${B(fr.map(([n, d]) => y7nF(n, d)).join(', &nbsp; '))}`, ...fAns(pickF[0], pickF[1]), format: 'Type the fraction, e.g. 3/4',
        hint: `Use a common denominator of ${L}.`,
        steps: [`The lowest common denominator is ${L}.`, `${fr.map(([n, d]) => `${y7nF(n, d)} = ${y7nF(n * L / d, L)}`).join(', ')}`, `The ${big ? 'largest' : 'smallest'} numerator is ${pickF[0] * L / pickF[1]}, so the answer is ${B(y7nF(pickF[0], pickF[1]))}`] };
    }],
  ['Exam-style problem',
    'Break the problem into steps. Find each fraction of the right amount – be careful whether it is a fraction of the whole or a fraction of what is left.',
    (r) => {
      const t = r.int(0, 4); const nm = r.pick(y7nNames);
      if (t === 0) {
        const [a, b] = r.pick([[1, 4], [2, 5], [1, 3], [3, 8], [1, 5], [3, 10]]); const [c, d] = r.pick([[1, 2], [1, 3], [2, 3], [1, 4], [3, 4]]);
        const n = b * d * r.int(1, 3) * (b * d < 12 ? 2 : 1); const w = n * a / b, rest = n - w, cyc = rest * c / d, car = rest - cyc;
        return { html: `There are ${n} pupils in Year 7. ${y7nF(a, b)} of them walk to school. ${y7nF(c, d)} of the remaining pupils cycle. The rest come by car. How many pupils come by car?`,
          ...nAns(car), hint: 'Be careful: the second fraction is of the pupils who are left, not of all of them.',
          steps: [`Walk: ${y7nF(a, b)} of ${n} = ${n} ÷ ${b} × ${a} = ${w}`, `Remaining: ${n} − ${w} = ${rest}`, `Cycle: ${y7nF(c, d)} of ${rest} = ${cyc}`, `Car: ${rest} − ${cyc} = ${B(car)}`] };
      }
      if (t === 1) {
        const D = r.pick([8, 10, 12]); let x, y; do { x = r.int(1, D - 3); y = r.int(1, D - 2); } while (x + y >= D);
        const fr2 = r.chance() && D % 2 === 0 && y % 2 === 0 ? [y / 2, D / 2] : [y, D];
        const fd = fr2[1], fn = fr2[0], yy = fn * D / fd; const left = D - x - yy;
        return { html: `${nm} and a friend share a ${r.pick(['pizza', 'cake', 'chocolate bar', 'pie'])}. ${nm} eats ${y7nF(x, D)} of it and the friend eats ${y7nF(fn, fd)} of it. What fraction is left?`,
          ...fAns(left, D), hint: 'The whole thing is 1. Add what has been eaten, then subtract from 1.',
          steps: [...(fd !== D ? [`${y7nF(fn, fd)} = ${y7nF(yy, D)}`] : []), `Eaten: ${y7nF(x, D)} + ${y7nF(yy, D)} = ${y7nF(x + yy, D)}`, `Left: 1 − ${y7nF(x + yy, D)} = ${y7nF(D, D)} − ${y7nF(x + yy, D)} = ${y7nF(left, D)}`, `Answer: ${B(fracS(left, D))}`] };
      }
      if (t === 2) {
        let a, b, c, d; do { [a, b] = r.pick([[1, 4], [1, 5], [2, 5], [1, 3], [1, 10], [3, 10]]); [c, d] = r.pick([[1, 4], [1, 5], [1, 2], [1, 3], [1, 10], [3, 10]]); } while (b === d || a / b + c / d >= 0.95);
        const N = lcm(b, d) * r.int(2, 12) * (lcm(b, d) < 20 ? 2 : 1); const s1 = N * a / b, s2 = N * c / d, left = N - s1 - s2;
        const [x, y] = r.pick([['clothes', 'food'], ['a phone', 'a concert ticket'], ['books', 'games'], ['rent', 'bills']]);
        return { html: `${nm} has ${money(N).replace('.00', '')}. ${nm} spends ${y7nF(a, b)} of it on ${x} and ${y7nF(c, d)} of it on ${y}. How much money does ${nm} have left?`,
          ...nAns(left, { money: true }), hint: 'Find each fraction of the whole amount, then subtract both.',
          steps: [`${y7nF(a, b)} of £${N} = £${s1}`, `${y7nF(c, d)} of £${N} = £${s2}`, `Left: £${N} − £${s1} − £${s2} = ${B(money(left))}`] };
      }
      if (t === 3) {
        const [a, b] = r.pick([[1, 4], [1, 5], [1, 3], [2, 5], [1, 10], [3, 10], [1, 8]]); const P = b * r.int(4, 30);
        const off = P * a / b;
        return { html: `A ${r.pick(['coat', 'bike', 'games console', 'pair of trainers', 'tent'])} normally costs ${money(P).replace('.00', '')}. In a sale the price is reduced by ${y7nF(a, b)}. What is the sale price?`,
          ...nAns(P - off, { money: true }), hint: 'Find the reduction first, then subtract it.',
          steps: [`Reduction: ${y7nF(a, b)} of £${P} = £${P} ÷ ${b} × ${a} = £${off}`, `Sale price: £${P} − £${off} = ${B(money(P - off))}`] };
      }
      const [a, b] = r.pick([[1, 4], [1, 5], [1, 3], [2, 5], [3, 8]]); const [c, d] = r.pick([[1, 2], [1, 3], [1, 4], [2, 3]]);
      const L = b * d * r.int(2, 10) * 10; const u1 = L * a / b, rest = L - u1, u2 = rest * c / d, left = rest - u2;
      return { html: `A water tank holds ${ds(L)} litres when full. On Monday ${y7nF(a, b)} of the full tank is used. On Tuesday ${y7nF(c, d)} of the water that is left is used. How many litres are left in the tank?`,
        ...nAns(left), unit: 'litres', hint: 'Tuesday’s fraction is of what is left after Monday.',
        steps: [`Monday: ${y7nF(a, b)} of ${ds(L)} = ${ds(u1)} litres`, `Left after Monday: ${ds(L)} − ${ds(u1)} = ${ds(rest)} litres`, `Tuesday: ${y7nF(c, d)} of ${ds(rest)} = ${ds(u2)} litres`, `Left: ${ds(rest)} − ${ds(u2)} = ${B(ds(left))} litres`] };
    }],
]);
SPEC['y7-fractions'] = 'KS3 Number: fractions';

// --------------------------------------------------------------------------
// percent-of-amount building steps
function y7nPctSteps(p, N) {
  const st = [];
  if (p === 50) { st.push(`50% is a half: ${ds(N)} ÷ 2 = ${ds(N / 2)}`); return st; }
  if (p === 25 || p === 75) { st.push(`25% is a quarter: ${ds(N)} ÷ 4 = ${ds(N / 4)}`); if (p === 75) st.push(`75% = 3 × 25% = 3 × ${ds(N / 4)} = ${ds(3 * N / 4)}`); return st; }
  const ten = N / 10, t = Math.floor(p / 10), rem = p % 10; const parts = [];
  st.push(`10% = ${ds(N)} ÷ 10 = ${ds(ten)}`);
  if (t > 1) { st.push(`${t * 10}% = ${t} × ${ds(ten)} = ${ds(t * ten)}`); }
  if (t) parts.push(rnd(t * ten, 6));
  if (rem === 5) { st.push(`5% = half of 10% = ${ds(ten / 2)}`); parts.push(rnd(ten / 2, 6)); }
  else if (rem) { const one = N / 100; st.push(`1% = ${ds(N)} ÷ 100 = ${ds(one)}${rem > 1 ? `, so ${rem}% = ${rem} × ${ds(one)} = ${ds(rem * one)}` : ''}`); parts.push(rnd(rem * one, 6)); }
  if (parts.length > 1) st.push(`${p}% = ${parts.map((v) => ds(v)).join(' + ')} = ${ds(rnd(sum(parts), 6))}`);
  return st;
}
topic('y7-fdp', 'number', 7, 2, 'FH', 'Fractions, Decimals & Percentages', 'Convert between fractions, decimals and percentages; find percentages of amounts and write one quantity as a percentage of another.', [
  ['Converting fractions, decimals & percentages',
    'Per cent means “out of 100”. To change a decimal to a percentage multiply by 100; percentage to decimal, divide by 100. For a fraction, make the denominator 100 (or divide the top by the bottom).',
    (r) => {
      const [n, d] = r.pick([[1, 2], [1, 4], [3, 4], [1, 5], [2, 5], [3, 5], [4, 5], [1, 10], [3, 10], [7, 10], [9, 10], [1, 20], [3, 20], [7, 20], [11, 20], [1, 25], [4, 25], [9, 25], [12, 25], [1, 50], [7, 50], [23, 50], [13, 100], [37, 100], [81, 100], [1, 8], [3, 8]]);
      const pc = rnd(100 * n / d, 4), dec = rnd(n / d, 6); const mode = r.int(0, 5);
      const k = d <= 100 && 100 % d === 0 ? 100 / d : 0;
      const fToP = k ? `Make the denominator 100: ${y7nF(n, d)} = ${y7nF(n * k, 100)}` : `${n} ÷ ${d} = ${ds(dec)}`;
      if (mode === 0) return { html: `Write ${B(y7nF(n, d))} as a decimal.`, ...nAns(dec), hint: 'Make the denominator 10, 100 or 1000 – or divide the numerator by the denominator.', steps: [fToP, `${y7nF(n, d)} = ${B(ds(dec))}`] };
      if (mode === 1) return { html: `Write ${B(y7nF(n, d))} as a percentage.`, ...nAns(pc), unit: '%', answerHtml: B(ds(pc) + '%'), hint: 'Write it as an equivalent fraction out of 100.', steps: [fToP, `${y7nF(n, d)} = ${B(ds(pc) + '%')}`] };
      if (mode === 2) return { html: `Write ${B(ds(dec))} as a percentage.`, ...nAns(pc), unit: '%', answerHtml: B(ds(pc) + '%'), hint: 'Multiply by 100.', steps: [`${ds(dec)} × 100 = ${ds(pc)}`, `${ds(dec)} = ${B(ds(pc) + '%')}`] };
      if (mode === 3) return { html: `Write ${B(ds(pc) + '%')} as a decimal.`, ...nAns(dec), hint: 'Divide by 100.', steps: [`${ds(pc)} ÷ 100 = ${ds(dec)}`, `${ds(pc)}% = ${B(ds(dec))}`] };
      if (mode === 4) {
        const pcN = Number.isInteger(pc) ? pc : null;
        if (pcN !== null) return { html: `Write ${B(ds(pc) + '%')} as a fraction in its simplest form.`, ...fAns(pcN, 100), hint: 'Write it out of 100, then simplify.', steps: [`${ds(pc)}% = ${y7nF(pcN, 100)}`, gcd(pcN, 100) > 1 ? `Divide top and bottom by ${gcd(pcN, 100)}: ${B(y7nF(n, d))}` : `This is already in its simplest form: ${B(y7nF(n, d))}`] };
      }
      const dp = y7nDp(dec); const den = 10 ** dp; const num = Math.round(dec * den);
      return { html: `Write ${B(ds(dec))} as a fraction in its simplest form.`, ...fAns(num, den), hint: 'Use the place value of the last digit for the denominator.',
        steps: [`${ds(dec)} = ${y7nF(num, den)}`, gcd(num, den) > 1 ? `Divide top and bottom by ${gcd(num, den)}: ${B(y7nF(n, d))}` : `Already in its simplest form: ${B(y7nF(n, d))}`] };
    }],
  ['Percentage of an amount',
    'Build percentages from easy ones: 10% is ÷ 10, 5% is half of 10%, 1% is ÷ 100, 50% is a half and 25% is a quarter. Add the pieces together.',
    (r) => {
      const p = r.pick([5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 60, 65, 70, 75, 80, 90, 1, 2, 11, 12, 21, 31]);
      const N = p % 5 === 0 ? 20 * r.int(2, 45) : 100 * r.int(1, 12);
      const u = r.pick(['', '£', 'kg', 'm', 'g', 'ml']); const show = (v) => (u === '£' ? '£' + ds(v) : ds(v) + (u ? ' ' + u : ''));
      const ans = rnd(p * N / 100, 6); const st = y7nPctSteps(p, N);
      st.push(`${p}% of ${show(N)} = ${B(show(ans))}`);
      return { html: `Work out ${B(`${p}% of ${show(N)}`)}`, ...nAns(ans), unit: u === '£' ? '' : u, answerLabel: u === '£' ? '£' : '', hint: 'Start by finding 10% (divide by 10).', steps: st };
    }],
  ['One quantity as a percentage of another',
    'Write the part as a fraction of the whole, then turn it into a percentage – make the denominator 100, or multiply the fraction by 100.',
    (r) => {
      const T = r.pick([10, 20, 25, 40, 50, 80, 200, 250, 300, 400, 500]); let p, part;
      do { p = r.int(1, 99); part = p * T / 100; } while (!Number.isInteger(part) || part === 0);
      const nm = r.pick(y7nNames); const t = r.int(0, 3);
      const html = [
        `${nm} scored ${part} out of ${T} in a test. What percentage is this?`,
        `In a school of ${T} pupils, ${part} have a pet dog. What percentage of the pupils have a pet dog?`,
        `A bag holds ${T} sweets. ${part} of them are red. What percentage of the sweets are red?`,
        `What is ${B(part)} as a percentage of ${B(T)}?`,
      ][t];
      return { html, ...nAns(p), unit: '%', answerHtml: B(p + '%'), hint: 'Write it as a fraction first.',
        steps: [`As a fraction: ${y7nF(part, T)}`, 100 % T === 0 ? `Make the denominator 100: ${y7nF(part, T)} = ${y7nF(p, 100)}` : `${y7nF(part, T)} × 100 = ${ds(part * 100)} ÷ ${T} = ${p}`, `= ${B(p + '%')}`] };
    }],
  ['Exam-style problem',
    'Change everything into the same form (usually percentages or amounts of money) so you can compare or combine them. Show each step.',
    (r) => {
      const t = r.int(0, 5); const nm = r.pick(y7nNames);
      if (t === 0) {
        const it = r.pick(['bike', 'tablet', 'jacket', 'tent', 'scooter', 'guitar']);
        for (;;) {
          const [a, b] = r.pick([[1, 4], [1, 5], [1, 3], [1, 10]]); const p = r.pick([10, 20, 25, 30, 15, 35]);
          const PA = b * 20 * r.int(1, 10), PB = 20 * r.int(Math.max(1, Math.round(PA / 40)), Math.round(PA / 15));
          const fA = PA - PA * a / b, fB = rnd(PB - PB * p / 100, 2); if (Math.abs(fA - fB) < 1) continue;
          return { html: `Two shops sell the same ${it}.<br>Shop A: ${money(PA).replace('.00', '')}, with ${y7nF(a, b)} off.<br>Shop B: ${money(PB).replace('.00', '')}, with ${p}% off.<br>How much cheaper is the ${it} in the cheaper shop?`,
            ...nAns(Math.abs(fA - fB), { money: true }), hint: 'Work out the sale price in each shop, then find the difference.',
            steps: [`Shop A: ${y7nF(a, b)} of £${PA} = £${ds(PA * a / b)}, so price = £${ds(fA)}`, `Shop B: ${p}% of £${PB} = £${ds(PB * p / 100)}, so price = £${ds(fB)}`, `Difference: ${money(Math.max(fA, fB))} − ${money(Math.min(fA, fB))} = ${B(money(Math.abs(fA - fB)))}`] };
        }
      }
      if (t === 1) {
        const N = r.pick([200, 300, 400, 500, 600, 800, 1000, 1200]); let p, a, b; do { p = r.pick([10, 15, 20, 25, 30, 35, 40, 45]); [a, b] = r.pick([[1, 4], [1, 5], [2, 5], [1, 10], [3, 10], [1, 20], [3, 20]]); } while (p / 100 + a / b > 0.9 || (N * a) % b);
        const A = p * N / 100, Bv = N * a / b, C = N - A - Bv; const [x, y, z] = r.sample(['football', 'swimming', 'tennis', 'netball', 'cricket', 'athletics'], 3);
        return { html: `${ds(N)} people were asked to choose their favourite sport. ${p}% chose ${x}, ${y7nF(a, b)} chose ${y} and the rest chose ${z}. How many people chose ${z}?`,
          ...nAns(C), hint: 'Work out how many chose each of the first two sports.',
          steps: [`${x[0].toUpperCase() + x.slice(1)}: ${p}% of ${ds(N)} = ${ds(A)}`, `${y[0].toUpperCase() + y.slice(1)}: ${y7nF(a, b)} of ${ds(N)} = ${ds(Bv)}`, `${z[0].toUpperCase() + z.slice(1)}: ${ds(N)} − ${ds(A)} − ${ds(Bv)} = ${B(ds(C))}`] };
      }
      if (t === 2) {
        const x = r.pick([5, 6, 8, 10, 12, 15, 20]), p = r.pick([10, 20, 25, 30, 40, 50, 15]), w = r.int(4, 12); const s = rnd(x * p / 100, 2), tot = rnd(s * w, 2);
        return { html: `${nm} gets ${money(x).replace('.00', '')} pocket money each week and saves ${p}% of it. How much will ${nm} have saved after ${w} weeks?`,
          ...nAns(tot, { money: true }), hint: 'Find how much is saved in one week first.',
          steps: [`${p}% of £${x} = ${money(s)} each week`, `${w} weeks: ${w} × ${money(s)} = ${B(money(tot))}`] };
      }
      if (t === 3) {
        const nms = r.sample(y7nNames, 3); let pcs; do { pcs = [r.int(11, 19) * 5, r.int(55, 98), r.int(55, 98)]; } while (new Set(pcs).size < 3);
        const T = 20; const s1 = pcs[0] * T / 100;
        const best = Math.max(...pcs);
        return { html: `Three pupils did a test. ${nms[0]} scored ${y7nF(s1, T)} of the marks, ${nms[1]} scored ${pcs[1]}% and ${nms[2]} scored ${ds(pcs[2] / 100)} of the marks as a decimal. What was the highest score, as a percentage?`,
          ...nAns(best), unit: '%', answerHtml: B(best + '%'), hint: 'Change every score into a percentage.',
          steps: [`${nms[0]}: ${y7nF(s1, T)} = ${y7nF(s1 * 5, 100)} = ${pcs[0]}%`, `${nms[1]}: ${pcs[1]}%`, `${nms[2]}: ${ds(pcs[2] / 100)} × 100 = ${pcs[2]}%`, `Highest: ${B(best + '%')}`] };
      }
      if (t === 4) {
        const n = r.int(2, 6), m = r.int(8, 30), p = r.pick([10, 20, 15]); const Bill = n * m; const tot = rnd(Bill * (1 + p / 100), 2); const each = rnd(tot / n, 2);
        return { html: `A meal for ${n} people costs ${money(Bill).replace('.00', '')}. They add a ${p}% tip and share the total equally. How much does each person pay?`,
          ...nAns(each, { money: true }), hint: 'Find the tip, add it on, then divide by the number of people.',
          steps: [...y7nPctSteps(p, Bill).map((s) => s.replace(/(\d)(?=$|,| =| \+)/g, '$1')), `Total: £${ds(Bill)} + £${ds(rnd(Bill * p / 100, 2))} = ${money(tot)}`, `Each: ${money(tot)} ÷ ${n} = ${B(money(each))}`].slice(-6) };
      }
      const P = r.pick([20, 40, 60, 80, 120, 140, 160, 200]), p = r.pick([10, 15, 20, 25, 30, 40]); const sale = P - P * p / 100; const M = sale + r.pick([-1, 1]) * r.int(3, 25);
      const short = M < sale;
      return { html: `A ${r.pick(['pair of headphones', 'watch', 'skateboard', 'school bag', 'football kit'])} costs ${money(P).replace('.00', '')}. In a sale there is ${p}% off. ${nm} has ${money(M).replace('.00', '')}. ${short ? `How much more money does ${nm} need to buy it in the sale?` : `How much money will ${nm} have left after buying it in the sale?`}`,
        ...nAns(Math.abs(M - sale), { money: true }), hint: 'Find the sale price first.',
        steps: [`${p}% of £${P} = £${ds(P * p / 100)}`, `Sale price: £${P} − £${ds(P * p / 100)} = £${ds(sale)}`, short ? `Needs: £${ds(sale)} − £${ds(M)} = ${B(money(sale - M))}` : `Left: £${ds(M)} − £${ds(sale)} = ${B(money(M - sale))}`] };
    }],
]);
SPEC['y7-fdp'] = 'KS3 Number: fractions, decimals & percentages';

// --------------------------------------------------------------------------
topic('y7-rounding', 'number', 7, 3, 'FH', 'Rounding & Estimation', 'Round to the nearest 10, 100 or 1000, to decimal places and to 1 significant figure; estimate answers to calculations.', [
  ['Rounding to the nearest 10, 100 or 1000',
    'Find the two numbers it lies between, then look at the digit to the right of the rounding column: 5 or more rounds up, 4 or less rounds down.',
    (r) => {
      const whole = r.chance(0.2);
      if (whole) {
        const x = rnd(r.int(101, 99999) / 100, 2); const a = Math.round(x);
        return { html: `Round ${B(ds(x))} to the nearest whole number.`, ...nAns(a), hint: 'Look at the tenths digit.',
          steps: [`${ds(x)} lies between ${Math.floor(x)} and ${Math.floor(x) + 1}.`, `The tenths digit is ${Math.floor(x * 10) % 10}, which is ${Math.floor(x * 10) % 10 >= 5 ? '5 or more, so round up' : 'less than 5, so round down'}.`, `Answer: ${B(ds(a))}`] };
      }
      const P = r.pick([10, 100, 1000]); let n; do { n = r.int(P + 1, P * 1000 > 99999 ? 99999 : P * 100); } while (n % P === 0);
      const lo = Math.floor(n / P) * P, a = Math.round(n / P) * P; const dig = Math.floor(n / (P / 10)) % 10;
      return { html: `Round ${B(ds(n))} to the nearest ${ds(P)}.`, ...nAns(a), hint: `Look at the digit in the ${y7nPlace(Math.log10(P) - 1)} column.`,
        steps: [`${ds(n)} lies between ${ds(lo)} and ${ds(lo + P)}.`, `The deciding digit (${y7nPlace(Math.log10(P) - 1)}) is ${dig}, which is ${dig >= 5 ? '5 or more, so round up' : 'less than 5, so round down'}.`, `Answer: ${B(ds(a))}`] };
    }],
  ['Rounding to decimal places',
    'Count the decimal places you need after the decimal point, then look at the next digit: 5 or more rounds up, 4 or less rounds down. Keep any zeros at the end, e.g. 3.40 to 2 dp.',
    (r) => {
      const dp = r.int(1, 2); const extra = r.int(1, 2); let x; do { x = rnd(r.int(10, 9999) / 10 ** (dp + extra) * (r.chance(0.3) ? 10 : 1), dp + extra); } while (y7nDp(x) <= dp);
      const a = rnd(x, dp); const nd = Math.floor(rnd(x * 10 ** (dp + 1), 4)) % 10;
      return { html: `Round ${B(ds(x))} to ${dpWord(dp)}.`, answer: fx(a, dp), check: { type: 'number', value: a, tol: 1e-9 }, answerHtml: B(dfx(a, dp)), hint: `Look at digit number ${dp + 1} after the decimal point.`,
        steps: [`Keep ${dp} digit${dp > 1 ? 's' : ''} after the decimal point: ${fx(Math.trunc(rnd(x * 10 ** dp, 6)) / 10 ** dp, dp)}…`, `The next digit is ${nd}, which is ${nd >= 5 ? '5 or more, so round up' : 'less than 5, so round down'}.`, `Answer: ${B(dfx(a, dp))}`] };
    }],
  ['Rounding to 1 significant figure',
    'The first significant figure is the first non-zero digit. Round to that place value: look at the next digit to decide whether to round up or down, and keep zeros as placeholders.',
    (r) => {
      const e = r.int(-3, 4); const k = r.int(101, 999); if (k % 100 === 0) return { html: `Round ${B(ds(rnd(k / 100 * 10 ** e + 10 ** (e - 2) * 0.5, 9)))} to 1 significant figure.`, ...nAns(y7nR1(rnd(k / 100 * 10 ** e + 10 ** (e - 2) * 0.5, 9))), steps: ['Find the first non-zero digit.', `Round: ${B(ds(y7nR1(rnd(k / 100 * 10 ** e + 10 ** (e - 2) * 0.5, 9))))}`] };
      const x = rnd((k / 100) * 10 ** e, 9); const a = y7nR1(x); const nd = Math.floor(k / 10) % 10;
      return { html: `Round ${B(ds(x))} to 1 significant figure.`, ...nAns(a), hint: 'Find the first non-zero digit – that is the first significant figure.',
        steps: [`The first significant figure is ${Math.floor(k / 100)}, in the ${y7nPlace(e)} column.`, `The next digit is ${nd}, so round ${nd >= 5 ? 'up' : 'down'}.`, `Answer: ${B(ds(a))}`] };
    }],
  ['Estimating calculations',
    'To estimate, round every number to 1 significant figure, then do the easier calculation. The symbol ≈ means “is approximately equal to”.',
    (r) => {
      const L = () => r.int(2, 9); const form = r.int(0, 3);
      for (;;) {
        const A = [L(), r.int(0, 2)], Bb = [L(), r.int(-1, 1)], C = [r.pick([2, 4, 5]), r.int(-1, 1)];
        const Ra = A[0] * 10 ** A[1], Rb = rnd(Bb[0] * 10 ** Bb[1], 6), Rc = rnd(C[0] * 10 ** C[1], 6);
        const a = y7nApprox(r, A[0], A[1]), b = y7nApprox(r, Bb[0], Bb[1]), c = y7nApprox(r, C[0], C[1]);
        let html, est, line;
        if (form === 0) { html = `${ds(a)} × ${ds(b)}`; est = rnd(Ra * Rb, 6); line = `${ds(Ra)} × ${ds(Rb)} = ${ds(est)}`; }
        else if (form === 1) { est = rnd(Ra * Rb / Rc, 6); html = `${frac(`${ds(a)} × ${ds(b)}`, ds(c))}`; line = `${ds(Ra)} × ${ds(Rb)} ÷ ${ds(Rc)} = ${ds(rnd(Ra * Rb, 6))} ÷ ${ds(Rc)} = ${ds(est)}`; }
        else if (form === 2) { const s = Ra + Rb; est = rnd(s / Rc, 6); html = `${frac(`${ds(a)} + ${ds(b)}`, ds(c))}`; line = `(${ds(Ra)} + ${ds(Rb)}) ÷ ${ds(Rc)} = ${ds(rnd(s, 6))} ÷ ${ds(Rc)} = ${ds(est)}`; }
        else { est = rnd(Ra / Rc, 6); html = `${ds(a)} ÷ ${ds(c)}`; line = `${ds(Ra)} ÷ ${ds(Rc)} = ${ds(est)}`; }
        if (y7nDp(est) > 2 || est > 100000) continue;
        const used = form === 0 ? [[a, Ra], [b, Rb]] : form === 3 ? [[a, Ra], [c, Rc]] : [[a, Ra], [b, Rb], [c, Rc]];
        return { html: `By rounding each number to 1 significant figure, estimate the answer to ${B(html)}`, ...nAns(est), hint: 'Round each number to its first non-zero digit first.',
          steps: [`Round each number: ${used.map(([v, R]) => `${ds(v)} ≈ ${ds(R)}`).join(', ')}`, `Estimate: ${line}`, `Answer ≈ ${B(ds(est))}`] };
      }
    }],
  ['Exam-style problem',
    'In real life we often only need a rough answer. Round each number to 1 significant figure before calculating, and say clearly what your estimate is. For “to the nearest” questions, think about the range of values that round to that number.',
    (r) => {
      const t = r.int(0, 5); const nm = r.pick(y7nNames);
      if (t === 0) {
        const pL = r.int(2, 6), nL = r.int(2, 9); const p = y7nApprox(r, pL, 0, 3) + r.pick([0, 0.05, 0.09]) * 0; const price = rnd(y7nApprox(r, pL, 1, 4), 2); const n = Math.round(y7nApprox(r, nL, 2, 3));
        void p; const est = pL * 10 * nL * 100;
        return { html: `Tickets for a ${r.pick(['school concert', 'football match', 'comedy show', 'charity gig'])} cost ${money(price)} each. ${ds(n)} tickets were sold. By rounding each number to 1 significant figure, estimate the total money taken, in pounds.`,
          ...nAns(est), answerLabel: '£', hint: 'Round the price and the number of tickets, then multiply.',
          steps: [`${money(price)} ≈ £${pL * 10}`, `${ds(n)} ≈ ${nL * 100}`, `Estimate: ${pL * 10} × ${nL * 100} = ${B('£' + ds(est))}`] };
      }
      if (t === 1) {
        let gL, mL; do { gL = r.int(1, 9); mL = r.int(2, 9); } while ((mL * 100) % (gL * 10) !== 0 || gL === 1 || mL * 100 / (gL * 10) < 10 && false);
        const d = Math.round(y7nApprox(r, mL, 2, 3)), g = rnd(y7nApprox(r, gL, 1, 3), 1); const est = mL * 100 / (gL * 10);
        return { html: `A van travels ${d} miles and uses ${ds(g)} litres of fuel. By rounding each number to 1 significant figure, estimate how many miles the van travels per litre of fuel.`,
          ...nAns(est), unit: 'miles', hint: 'Round both numbers, then divide the distance by the fuel used.',
          steps: [`${d} ≈ ${mL * 100} and ${ds(g)} ≈ ${gL * 10}`, `Estimate: ${mL * 100} ÷ ${gL * 10} = ${B(ds(est))} miles per litre`] };
      }
      if (t === 2) {
        const cL = r.int(1, 4), lL = r.int(3, 8), wL = r.int(2, 6); const cost = rnd(y7nApprox(r, cL, 1, 4), 2), l = rnd(y7nApprox(r, lL, 0, 3), 2), w = rnd(y7nApprox(r, wL, 0, 3), 2);
        const est = cL * 10 * lL * wL;
        return { html: `A rectangular room is ${ds(l)} m long and ${ds(w)} m wide. Carpet costs ${money(cost)} per square metre. By rounding each number to 1 significant figure, estimate the cost of carpeting the room, in pounds.`,
          ...nAns(est), answerLabel: '£', hint: 'Round each number, find the area, then multiply by the cost.',
          steps: [`${ds(l)} ≈ ${lL}, ${ds(w)} ≈ ${wL}, ${money(cost)} ≈ £${cL * 10}`, `Area ≈ ${lL} × ${wL} = ${lL * wL} m²`, `Cost ≈ ${lL * wL} × ${cL * 10} = ${B('£' + ds(est))}`] };
      }
      if (t === 3) {
        const P = r.pick([10, 100, 1000]); const N = P * r.int(P === 1000 ? 12 : 25, P === 1000 ? 60 : 99); const small = r.chance(); const half = P / 2;
        const ans = small ? N - half : N + half - 1;
        const what = r.pick([['people at a concert', 'people'], ['visitors to a museum one weekend', 'visitors'], ['runners in a fun run', 'runners'], ['fans at a match', 'fans']]);
        return { html: `The number of ${what[0]} was ${ds(N)}, correct to the nearest ${ds(P)}. What is the ${small ? 'smallest' : 'largest'} possible number of ${what[1]}?`,
          ...nAns(ans), hint: `Which whole numbers round to ${ds(N)}? Think about halfway points.`,
          steps: [`Half of ${ds(P)} is ${ds(half)}.`, `Numbers from ${ds(N - half)} up to ${ds(N + half - 1)} round to ${ds(N)} (${ds(N + half)} would round up to ${ds(N + P)}).`, `The ${small ? 'smallest' : 'largest'} possible number is ${B(ds(ans))}`] };
      }
      if (t === 4) {
        const fL = r.pick([2, 3, 4, 5]), nL = r.int(1, 4), cL = r.int(1, 3);
        const f = rnd(y7nApprox(r, fL, -1, 2), 2), n = Math.round(y7nApprox(r, nL, 2, 3)), c = rnd(y7nApprox(r, cL, 0, 3), 2); const est = rnd(fL / 10 * nL * 100 * cL, 6);
        return { html: `A baker uses ${ds(f)} kg of flour for each loaf. She bakes ${n} loaves. Flour costs ${money(c)} per kilogram. By rounding each number to 1 significant figure, estimate the cost of the flour, in pounds.`,
          ...nAns(est), answerLabel: '£', hint: 'Round each number first.',
          steps: [`${ds(f)} ≈ ${ds(fL / 10)}, ${n} ≈ ${nL * 100}, ${money(c)} ≈ £${cL}`, `Flour ≈ ${ds(fL / 10)} × ${nL * 100} = ${ds(rnd(fL * nL * 10, 6))} kg`, `Cost ≈ ${ds(rnd(fL * nL * 10, 6))} × ${cL} = ${B('£' + ds(est))}`] };
      }
      let n; do { n = r.int(1050, 98950); } while (n % 100 === 0);
      const a = Math.round(n / 100) * 100, b = Math.round(n / 1000) * 1000; const nm2 = r.pick(y7nNames.filter((x) => x !== nm));
      return { html: `${nm} rounds ${B(ds(n))} to the nearest 100. ${nm2} rounds ${B(ds(n))} to the nearest 1000. What is the difference between their two answers?`,
        ...nAns(Math.abs(a - b)), hint: 'Do each rounding separately, then subtract.',
        steps: [`Nearest 100: ${ds(n)} → ${ds(a)}`, `Nearest 1000: ${ds(n)} → ${ds(b)}`, `Difference: ${ds(Math.max(a, b))} − ${ds(Math.min(a, b))} = ${B(ds(Math.abs(a - b)))}`] };
    }],
]);
SPEC['y7-rounding'] = 'KS3 Number: rounding & estimation';

}

// ---- fragment y7alg.js ----
{
// ============================================================================
// YEAR 7 — algebra, coordinates, ratio, measures (fragment y7alg)
// ============================================================================
const y7aV = ['a', 'b', 'c', 'd', 'k', 'm', 'n', 'p', 't', 'w', 'x', 'y'];
const y7aN = [['Amir', 'he', 'his'], ['Bella', 'she', 'her'], ['Chen', 'he', 'his'], ['Dani', 'she', 'her'], ['Ella', 'she', 'her'], ['Femi', 'he', 'his'], ['Grace', 'she', 'her'], ['Harry', 'he', 'his'], ['Isla', 'she', 'her'], ['Jamal', 'he', 'his'], ['Keira', 'she', 'her'], ['Liam', 'he', 'his']];
const y7aI = (v) => `<i>${v}</i>`;
const y7aSeq = (ts) => B(ts.map((v) => (v === null ? '___' : ds(v))).join(', &nbsp;'));
const y7aPt = (x, y) => `(${ds(x)}, ${ds(y)})`;
const y7aPair = (x, y) => ({ answer: `${ps(x)}, ${ps(y)}`, check: { type: 'pair', values: [x, y], ordered: true }, answerHtml: B(y7aPt(x, y)), format: 'Give the coordinates as x, y, e.g. 3, −2' });
const y7aRat = (p, q) => ({ answer: `${p}:${q}`, check: { type: 'ratio', parts: [p, q] }, answerHtml: B(`${p} : ${q}`) });
const y7aHM = (m) => { m = ((m % 1440) + 1440) % 1440; return `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`; };
const y7aDur = (m) => { const h = Math.floor(m / 60), mm = m % 60; return [h ? `${h} hour${h === 1 ? '' : 's'}` : '', mm ? `${mm} minute${mm === 1 ? '' : 's'}` : ''].filter(Boolean).join(' '); };
// apply a function-machine operation [op, k]
const y7aDo = ([o, k], v) => (o === '×' ? v * k : o === '÷' ? v / k : o === '+' ? v + k : v - k);
const y7aInv = ([o, k]) => [({ '×': '÷', '÷': '×', '+': '−', '−': '+' })[o], k];
const y7aOpS = ([o, k]) => `${o} ${k}`;
function y7aMachine(inp, ops, out) {
  const n = ops.length + 2, w = 360, bw = n === 4 ? 66 : 58, gap = (w - 8 - n * bw) / (n - 1);
  const labs = [inp, ...ops.map(y7aOpS), out]; let body = '';
  labs.forEach((s, i) => {
    const x = 4 + i * (bw + gap); const end = i === 0 || i === n - 1;
    body += `<rect x="${f1(x)}" y="30" width="${f1(bw)}" height="40" rx="${end ? 20 : 4}" fill="${end ? 'none' : ACC}" fill-opacity="0.12" stroke="${end ? 'currentColor' : ACC}" stroke-width="2"/>`;
    body += sT(x + bw / 2, 50, s, { b: true, c: end ? 'currentColor' : ACC });
    if (i < n - 1) { const x1 = x + bw + 3, x2 = x + bw + gap - 3; body += sL(x1, 50, x2, 50) + sP(`M${f1(x2 - 7)} 45 L${f1(x2)} 50 L${f1(x2 - 7)} 55`); }
    if (end) body += sT(x + bw / 2, 16, i === 0 ? 'Input' : 'Output', { fs: 11 });
  });
  return svgWrap(w, 84, body, false);
}
function y7aMakeOps(r, nOps) {
  for (let tries = 0; tries < 500; tries++) {
    const ops = [];
    for (let i = 0; i < nOps; i++) {
      const o = r.pick(['×', '+', '−', '÷', '×', '+']);
      ops.push([o, o === '×' || o === '÷' ? r.int(2, 6) : r.int(1, 20)]);
    }
    if (ops.length === 2 && ops[0][0] === ops[1][0]) continue;
    const x = r.int(1, 15) * (ops[0][0] === '÷' ? ops[0][1] : 1);
    let v = x, ok = true;
    for (const op of ops) { v = y7aDo(op, v); if (v <= 0 || v % 1 || v > 300) { ok = false; break; } }
    if (ok) return { ops, x, y: v };
  }
  return { ops: [['×', 2], ['+', 3]], x: 4, y: 11 };
}

// ---------------------------------------------------------------- expressions
topic('y7-expressions', 'algebra', 7, 1, 'FH', 'Algebraic Expressions & Notation', 'Write expressions from words, collect like terms, substitute values and simplify products.', [
  ['Forming expressions',
    'Use a letter to stand for an unknown number. “3 more than n” is n + 3, “5 lots of n” is 5n (no × sign needed) and “n shared into 4” is n/4. Do the operations in the order the words say.',
    (r) => {
      const v = r.pick(y7aV), a = r.int(2, 12), b = r.int(1, 15); const t = r.int(0, 8);
      const [nm] = r.pick(y7aN); const V = y7aI(v);
      const E = [
        { w: `the number ${V} with ${a} added on`, e: `${v}+${a}` },
        { w: `${a} less than the number ${V}`, e: `${v}-${a}` },
        { w: `the number ${V} multiplied by ${a}`, e: `${a}${v}` },
        { w: `the number ${V} divided by ${a}`, e: `${v}/${a}` },
        { w: `multiply the number ${V} by ${a}, then add ${b}`, e: `${a}${v}+${b}` },
        { w: `add ${b} to the number ${V}, then multiply the result by ${a}`, e: `${a}(${v}+${b})` },
        { w: `${b} more than double the number ${V}`, e: `2${v}+${b}` },
        { c: `${nm} has ${V} sweets. ${nm} eats ${a} of them. Write an expression for the number of sweets ${nm} has left.`, e: `${v}-${a}` },
        { c: `A box holds ${V} pencils. Write an expression for the total number of pencils in ${a} boxes.`, e: `${a}${v}` },
      ][t];
      const html = E.c || `Write an expression for: ${B(E.w)}.`;
      return {
        html, ...eAns(E.e), format: `Type an expression using ${v}, e.g. 3${v}+2`, hint: 'Turn each instruction into a symbol, in the order given.',
        steps: [t === 5 ? `Adding ${b} first gives ${tx(`${v}+${b}`)}; this must be in brackets before multiplying by ${a}.` : `Write each instruction using ${V} and the operation symbols.`, `Leave out the × sign: a number times a letter is written with the number first, e.g. 4 × ${V} = ${tx(`4${v}`)}.`, `Expression: ${B(tx(E.e))}`],
      };
    }],
  ['Collecting like terms',
    'Like terms have exactly the same letter. Add or subtract the numbers in front of them and keep the letter: 4a + 3a = 7a. Terms with different letters, like a and b, stay separate.',
    (r) => {
      const [u, v] = r.pick([['a', 'b'], ['x', 'y'], ['m', 'n'], ['p', 'q'], ['c', 'd'], ['s', 't']]);
      let a, b, c, d; do { a = r.int(1, 9); b = r.int(1, 9); c = r.int(-6, 9); d = r.int(-6, 9); } while (c === 0 || d === 0 || a + c <= 0 || b + d <= 0 || a + c === 1 && b + d === 1);
      const terms = r.chance() ? [[a, u], [b, v], [c, u], [d, v]] : [[a, u], [b, v], [d, v], [c, u]];
      const q = polyT(terms); const ans = polyT([[a + c, u], [b + d, v]]);
      return {
        html: `Simplify ${B(tx(q))}`, ...eAns(ans, { form: 'expanded' }), hint: `Collect the ${u} terms together, then the ${v} terms.`,
        steps: [`${tx(u)} terms: ${tx(polyT([[a, u], [c, u]]))} = ${tx(coefT(a + c, u))}`, `${tx(v)} terms: ${tx(polyT([[b, v], [d, v]]))} = ${tx(coefT(b + d, v))}`, `Answer: ${B(tx(ans))}`],
      };
    }],
  ['Substituting values',
    'Replace each letter with its number. Remember 3a means 3 × a, and ab means a × b. Then work it out using the order of operations (BIDMAS).',
    (r) => {
      const a = r.int(1, 10), b = r.int(1, 10), p = r.int(2, 9), q = r.int(1, 20); const t = r.int(0, 4);
      const E = [
        { e: `${p}a+${q}`, s: `${p} × ${a} + ${q} = ${p * a} + ${q}`, v: p * a + q },
        { e: `${p}a+${q}b`, s: `${p} × ${a} + ${q} × ${b} = ${p * a} + ${q * b}`, v: p * a + q * b },
        { e: `ab+${q}`, s: `${a} × ${b} + ${q} = ${a * b} + ${q}`, v: a * b + q },
        { e: `${p}(a+b)`, s: `${p} × (${a} + ${b}) = ${p} × ${a + b}`, v: p * (a + b) },
        { e: `a^2+b`, s: `${a}<sup>2</sup> + ${b} = ${a * a} + ${b}`, v: a * a + b },
      ][t];
      return {
        html: `Work out the value of ${B(tx(E.e))} when ${B(`<i>a</i> = ${a}`)} and ${B(`<i>b</i> = ${b}`)}.`, ...nAns(E.v), hint: 'Swap each letter for its value, then calculate.',
        steps: [`Substitute: ${E.s}`, `= ${B(ds(E.v))}`],
      };
    }],
  ['Simplifying products',
    'To simplify a product, multiply the numbers together, then write the letters after the number in alphabetical order: 2a × 5b = 10ab. A letter multiplied by itself is squared: a × a = a².',
    (r) => {
      const [u, v, w] = r.pick([['a', 'b', 'c'], ['m', 'n', 'p'], ['x', 'y', 'z'], ['p', 'q', 'r'], ['d', 'e', 'f']]);
      const p = r.int(2, 9), q = r.int(2, 9); const t = r.int(0, 5);
      const E = [
        { q: `${p}*${u}*${v}`, n: `${p}`, l: `${u}${v}`, a: `${p}${u}${v}` },
        { q: `${p}${u}*${q}${v}`, n: `${p} × ${q} = ${p * q}`, l: `${u}${v}`, a: `${p * q}${u}${v}` },
        { q: `${p}*${w}*${q}`, n: `${p} × ${q} = ${p * q}`, l: w, a: `${p * q}${w}` },
        { q: `${u}*${u}`, n: '1 (not written)', l: `${u}^2`, a: `${u}^2` },
        { q: `${p}${u}*${u}`, n: `${p}`, l: `${u}^2`, a: `${p}${u}^2` },
        { q: `${p}${u}*${v}*${q}${w}`, n: `${p} × ${q} = ${p * q}`, l: `${u}${v}${w}`, a: `${p * q}${u}${v}${w}` },
      ][t];
      return {
        html: `Simplify ${B(tx(E.q))}`, ...eAns(E.a), hint: 'Multiply the numbers, then write the letters together.',
        steps: [`Numbers: ${E.n}`, `Letters: ${tx(E.l)}`, `Answer: ${B(tx(E.a))}`],
      };
    }],
  ['Exam-style problem',
    'Read the situation carefully and write an expression for the quantity you need. Then substitute the given values and work out the answer, showing each step.',
    (r) => {
      const t = r.int(0, 4); const [nm, he, his] = r.pick(y7aN);
      if (t === 0) {
        const A = r.int(7, 12), C = r.int(3, A - 2), m = r.int(1, 3), k = r.int(1, 4); const cost = A * m + C * k; const note = cost < 50 ? 50 : 100;
        return {
          html: `At a cinema an adult ticket costs ${B('£' + A)} and a child ticket costs ${B('£' + C)}.<br>The cost, in pounds, of <i>x</i> adult tickets and <i>y</i> child tickets is ${B(tx(`${A}x+${C}y`))}.<br>${nm} buys ${m} adult ticket${m > 1 ? 's' : ''} and ${k} child ticket${k > 1 ? 's' : ''}, paying with a ${B('£' + note)} note. How much change should ${he} get?`,
          ...nAns(note - cost, { money: true }), format: 'Type the amount in pounds, e.g. 12.50', hint: `Substitute x = ${m} and y = ${k}, then subtract from £${note}.`,
          steps: [`Substitute <i>x</i> = ${m} and <i>y</i> = ${k}: ${A} × ${m} + ${C} × ${k}`, `= ${A * m} + ${C * k} = £${cost}`, `Change = £${note} − £${cost} = ${B(money(note - cost))}`],
        };
      }
      if (t === 1) {
        const f = r.int(2, 5), m = r.int(2, 4), d1 = r.int(2, 9), d2 = r.int(3, 12); const c1 = f + m * d1, c2 = f + m * d2;
        return {
          html: `A taxi company charges a fixed fee of ${B('£' + f)} plus ${B('£' + m)} for each mile travelled.<br>(a) Write an expression for the cost, in pounds, of a journey of <i>d</i> miles.<br>(b) ${nm} makes one journey of ${d1} miles and another of ${d2} miles. Work out the total cost of the two journeys.`,
          ...nAns(c1 + c2, { money: true }), format: 'Type the total in pounds, e.g. 25', hint: 'The cost is the fixed fee plus the cost per mile times the number of miles.',
          steps: [`Cost = ${tx(`${f}+${m}d`)} pounds`, `${d1} miles: ${f} + ${m} × ${d1} = £${c1}`, `${d2} miles: ${f} + ${m} × ${d2} = £${c2}`, `Total = £${c1} + £${c2} = ${B(money(c1 + c2))}`],
        };
      }
      if (t === 2) {
        const a = r.int(2, 9), x = r.int(3, 15); const P = 4 * x + 2 * a;
        return {
          html: `A rectangle has length ${B(tx(`(x+${a})`) + ' cm')} and width ${B('<i>x</i> cm')}.<br>(a) Write a simplified expression for the perimeter of the rectangle.<br>(b) Work out the perimeter when <i>x</i> = ${x}.`,
          ...nAns(P, { unit: 'cm' }), unit: 'cm', diagram: shapeSvg([[0, 0], [x + a, 0], [x + a, x], [0, x]], [`x + ${a}`, 'x', '', '']), hint: 'Perimeter = add all four sides.',
          steps: [`Perimeter = ${tx(`(x+${a})+x+(x+${a})+x`)}`, `= ${tx(`4x+${2 * a}`)}`, `When <i>x</i> = ${x}: 4 × ${x} + ${2 * a} = ${4 * x} + ${2 * a}`, `= ${B(P + ' cm')}`],
        };
      }
      if (t === 3) {
        const a = r.int(2, 6), k = r.int(3, 5), n = r.int(7, 12); const tot = n + (n + a) + k * n;
        return {
          html: `${nm} is <i>n</i> years old. ${his[0].toUpperCase() + his.slice(1)} sister is ${a} years older than ${nm}. Their grandad is ${k} times as old as ${nm}.<br>Write an expression for the total of their three ages, then work out the total when ${nm} is ${n} years old.`,
          ...nAns(tot), hint: 'Write each age in terms of n, then collect like terms.',
          steps: [`Ages: ${tx('n')}, ${tx(`n+${a}`)} and ${tx(`${k}n`)}`, `Total = ${tx(`n+n+${a}+${k}n`)} = ${tx(`${k + 2}n+${a}`)}`, `When <i>n</i> = ${n}: ${k + 2} × ${n} + ${a} = ${(k + 2) * n} + ${a}`, `Total = ${B(tot)} years`],
        };
      }
      const x = r.pick([6, 10, 12]), b = r.int(2, 6), u = r.int(3, x * b - 2);
      return {
        html: `Eggs are sold in boxes of <i>x</i> eggs. ${nm} buys ${b} boxes and uses ${u} eggs for baking.<br>Write an expression for the number of eggs ${nm} has left. Then work out how many eggs are left when <i>x</i> = ${x}.`,
        ...nAns(x * b - u), hint: `${b} boxes of x eggs is ${b}x eggs.`,
        steps: [`Eggs bought = ${tx(`${b}x`)}`, `Eggs left = ${tx(`${b}x-${u}`)}`, `When <i>x</i> = ${x}: ${b} × ${x} − ${u} = ${b * x} − ${u} = ${B(b * x - u)}`],
      };
    }],
]);
SPEC['y7-expressions'] = 'KS3 Algebra: algebraic notation, forming & simplifying expressions, substitution';

// ---------------------------------------------------------------- sequences
topic('y7-sequences', 'algebra', 7, 1, 'FH', 'Sequences', 'Use term-to-term rules, find missing terms, and use the nth term of a sequence.', [
  ['Term-to-term rules',
    'A term-to-term rule tells you how to get from one term to the next, e.g. “add 4” or “multiply by 2”. Work out the rule from the terms you are given, then keep applying it.',
    (r) => {
      const geo = r.chance(0.3); let ts, rule, next;
      if (geo) { const m = r.pick([2, 3]), a = r.int(1, m === 2 ? 9 : 4); ts = [0, 1, 2, 3].map((i) => a * m ** i); rule = `multiply by ${m}`; next = (v) => v * m; }
      else { const d = r.nz(-9, 12), a = d < 0 ? r.int(20, 60) : r.int(-5, 30); ts = [0, 1, 2, 3].map((i) => a + i * d); rule = d > 0 ? `add ${d}` : `subtract ${-d}`; next = (v) => v + d; }
      const ask = r.int(5, 7); const all = [...ts]; while (all.length < ask) all.push(next(all[all.length - 1]));
      const v = all[ask - 1];
      return {
        html: `Here are the first four terms of a sequence:<br>${y7aSeq(ts)}<br>Find the ${B(ord(ask) + ' term')} of the sequence.`, ...nAns(v), hint: 'Look at how you get from one term to the next.',
        steps: [`Term-to-term rule: ${rule}`, `Continue: ${all.slice(3).map((x) => ds(x)).join(', ')}`, `The ${ord(ask)} term is ${B(ds(v))}`],
      };
    }],
  ['Finding a missing term',
    'In a linear sequence the terms go up (or down) by the same amount each time. If there is a gap, find the difference between known terms and divide by the number of steps between them.',
    (r) => {
      const d = r.nz(-8, 12), a = d < 0 ? r.int(30, 70) : r.int(-6, 25); const ts = [0, 1, 2, 3, 4].map((i) => a + i * d);
      const two = r.chance(0.45); let blanks;
      if (two) blanks = r.pick([[1, 2], [2, 3], [1, 3]]); else blanks = [r.int(1, 3)];
      const ask = r.pick(blanks); const shown = ts.map((v, i) => (blanks.includes(i) ? null : v));
      const steps = two
        ? [`From the ${ord(1)} term ${ds(ts[0])} to the ${ord(5)} term ${ds(ts[4])} is 4 steps.`, `Difference = (${ds(ts[4])} − ${br(ts[0])}) ÷ 4 = ${ds(4 * d)} ÷ 4 = ${ds(d)}`, `${ord(ask + 1)} term = ${ds(ts[0])}${pm(ask * d)} = ${B(ds(ts[ask]))}`]
        : [`Use two neighbouring known terms to find the difference: ${ds(d)}`, `${ord(ask + 1)} term = ${ds(ts[ask - 1])}${pm(d)} = ${B(ds(ts[ask]))}`];
      return {
        html: `These are the first five terms of a linear sequence, with ${two ? 'two terms' : 'one term'} missing:<br>${y7aSeq(shown)}<br>Find the ${B(ord(ask + 1) + ' term')}.`, ...nAns(ts[ask]), hint: 'The terms go up or down by the same amount each time.', steps,
      };
    }],
  ['Using the nth term',
    'The nth term is a rule that gives any term from its position n. To find the 10th term, substitute n = 10 into the rule. For 3n + 2, the 10th term is 3 × 10 + 2 = 32.',
    (r) => {
      const a = r.int(2, 9), b = r.int(-9, 15), k = r.pick([1, 2, 3, 5, 6, 8, 10, 12, 15, 20, 25, 50, 100]); const e = lin(a, b, 'n'); const v = a * k + b;
      const t = r.int(0, 1);
      return {
        html: t ? `The <i>n</i>th term of a sequence is ${B(tx(e))}. Work out the ${B(ord(k) + ' term')}.` : `A sequence has <i>n</i>th term ${B(tx(e))}. What is the value of the term in position ${B(k)}?`,
        ...nAns(v), hint: `Substitute n = ${k}.`,
        steps: [`Substitute <i>n</i> = ${k} into ${tx(e)}`, `${a} × ${k}${b ? pm(b) : ''} = ${b ? `${a * k}${pm(b)} = ` : ''}${B(ds(v))}`],
      };
    }],
  ['Is it in the sequence?',
    'To check whether a number is in a sequence, set the nth term equal to it and solve for n. If n is a whole number, the number is in the sequence and n is its position.',
    (r) => {
      const a = r.int(2, 9), b = r.nz(-8, 12); const e = lin(a, b, 'n');
      if (r.chance()) {
        const k = r.int(6, 40), V = a * k + b;
        return {
          html: `The <i>n</i>th term of a sequence is ${B(tx(e))}. The number ${B(ds(V))} is in the sequence. Which term is it? (Give its position number.)`, answerLabel: 'n =', ...nAns(k), hint: `Solve ${tx(e)} = ${ds(V)}.`,
          steps: [`Solve ${tx(`${e}=${V}`)}`, `${b > 0 ? 'Subtract' : 'Add'} ${Math.abs(b)}: ${tx(`${a}n=${V - b}`)}`, `Divide by ${a}: <i>n</i> = ${B(k)}, so it is the ${ord(k)} term.`],
        };
      }
      const X = r.int(30, 200); const n = Math.floor((X - b) / a) + 1; const v = a * n + b;
      return {
        html: `A sequence has <i>n</i>th term ${B(tx(e))}. What is the first term of the sequence that is ${B('greater than ' + X)}?`, ...nAns(v), hint: `Find where ${tx(e)} goes past ${X}.`,
        steps: [`${tx(e)} = ${X} when <i>n</i> = (${X}${pm(-b)}) ÷ ${a} = ${ds(rnd((X - b) / a, 2))}${(X - b) % a ? '…' : ''}`, `${ord(n - 1)} term = ${ds(v - a)} (not greater than ${X}); ${ord(n)} term = ${a} × ${n}${pm(b)} = ${ds(v)}`, `The first term greater than ${X} is ${B(ds(v))}`],
      };
    }],
  ['Exam-style problem',
    'Turn the situation into a sequence: find the starting value and how much it changes each time. Write the terms out or use a rule, then answer the question asked.',
    (r) => {
      const t = r.int(0, 4); const [nm, he] = r.pick(y7aN);
      if (t === 0) {
        const [d, c, shape] = r.pick([[3, 1, 'squares in a row'], [2, 1, 'triangles in a row'], [4, 1, 'pentagons in a row'], [5, 1, 'hexagons in a row']]);
        const M = r.int(40, 150); const n = Math.floor((M - c) / d);
        return {
          html: `Matchstick patterns are made from ${shape}. Pattern 1 uses ${d + c} matchsticks, pattern 2 uses ${2 * d + c} and pattern 3 uses ${3 * d + c}. The pattern continues in the same way.<br>${nm} has ${B(M)} matchsticks. What is the number of the largest pattern ${he} can make?`,
          ...nAns(n), hint: `Each pattern uses ${d} more matchsticks than the one before.`,
          steps: [`The number of matchsticks goes up by ${d} each time, so pattern <i>n</i> uses ${tx(lin(d, c, 'n'))}.`, `Solve ${tx(lin(d, c, 'n'))} ≤ ${M}: <i>n</i> ≤ (${M} − ${c}) ÷ ${d} = ${ds(rnd((M - c) / d, 2))}${(M - c) % d ? '…' : ''}`, `Pattern ${n} uses ${d * n + c} matchsticks; pattern ${n + 1} would need ${d * (n + 1) + c}.`, `Largest pattern: ${B(n)}`],
        };
      }
      if (t === 1) {
        const a = r.int(10, 24), d = r.int(2, 4); const rows = [0, 1, 2, 3, 4].map((i) => a + i * d); const tot = sum(rows);
        return {
          html: `In a theatre, the first row has ${B(a)} seats. Each row has ${B(d)} more seats than the row in front of it. How many seats are there in the first ${B(5)} rows altogether?`,
          ...nAns(tot), hint: 'Write down the number of seats in each of the first five rows.',
          steps: [`Rows go up by ${d}: ${rows.join(', ')}`, `Total = ${rows.join(' + ')}`, `= ${B(tot)} seats`],
        };
      }
      if (t === 2) {
        const s = r.int(2, 8), d = r.int(2, 5), X = r.int(25, 60); const n = Math.floor((X - s) / d) + 2; const amt = s + (n - 1) * d;
        return {
          html: `${nm} saves ${B('£' + s)} in week 1. Each week ${he} saves ${B('£' + d)} more than the week before. In which week will ${he} first save ${B('more than £' + X)} in a single week?`,
          answerLabel: 'Week', ...nAns(n), hint: `Week n: £${s} + £${d} × (n − 1).`,
          steps: [`Week <i>n</i> amount = ${s} + ${d}(<i>n</i> − 1) = ${tx(lin(d, s - d, 'n'))}`, `Week ${n - 1}: £${amt - d} (not more than £${X})`, `Week ${n}: £${amt}, which is more than £${X}`, `Answer: week ${B(n)}`],
        };
      }
      if (t === 3) {
        const h0 = r.int(5, 20), g = r.int(2, 5), w = r.int(4, 15); const H = h0 + g * w;
        return {
          html: `A sunflower is ${B(h0 + ' cm')} tall when it is planted. It grows ${B(g + ' cm')} every week. After how many weeks will it be ${B(H + ' cm')} tall?`,
          ...nAns(w, { unit: 'weeks' }), unit: 'weeks', hint: 'How much does it need to grow altogether?',
          steps: [`Height after <i>w</i> weeks = ${tx(`${h0}+${g}w`)}`, `It needs to grow ${H} − ${h0} = ${H - h0} cm`, `${H - h0} ÷ ${g} = ${B(w)} weeks`],
        };
      }
      const T = r.int(2, 9), d = r.int(1, 3), h = r.int(3, 8); const end = T - d * h;
      return {
        html: `At 6 pm the temperature outside is ${B(T + '°C')}. It falls by ${B(d + '°C')} every hour. What will the temperature be after ${B(h + ' hours')}?`,
        ...nAns(end, { unit: '°C' }), unit: '°C', hint: 'Work out the total fall first.',
        steps: [`Total fall = ${d} × ${h} = ${d * h}°C`, `Temperature = ${T} − ${d * h} = ${B(ds(end) + '°C')}`],
      };
    }],
]);
SPEC['y7-sequences'] = 'KS3 Algebra: term-to-term and position-to-term (nth term) sequences';

// ---------------------------------------------------------------- equations
topic('y7-equations', 'algebra', 7, 2, 'FH', 'Function Machines & Simple Equations', 'Use function machines forwards and backwards, and solve one-step and two-step equations.', [
  ['Function machines: find the output',
    'Put the input through each operation in order, from left to right. The number that comes out of the last box is the output.',
    (r) => {
      const { ops, x, y } = y7aMakeOps(r, r.chance(0.25) ? 3 : 2); let v = x; const steps = ops.map((op) => { const nv = y7aDo(op, v); const s = `${ds(v)} ${y7aOpS(op)} = ${ds(nv)}`; v = nv; return s; });
      return {
        html: `Here is a function machine: ${B(['Input', ...ops.map(y7aOpS), 'Output'].join(' → '))}<br>The input is ${B(x)}. Work out the output.`, diagram: y7aMachine(String(x), ops, '?'),
        ...nAns(y), hint: 'Do the operations in order from left to right.', steps: [...steps, `Output = ${B(ds(y))}`].slice(0, 6),
      };
    }],
  ['Function machines: find the input',
    'To work backwards, start with the output and use the inverse (opposite) operations in reverse order: the inverse of + is −, and the inverse of × is ÷.',
    (r) => {
      const { ops, x, y } = y7aMakeOps(r, r.chance(0.25) ? 3 : 2); const inv = ops.slice().reverse().map(y7aInv);
      let v = y; const steps = inv.map((op) => { const nv = y7aDo(op, v); const s = `${ds(v)} ${y7aOpS(op)} = ${ds(nv)}`; v = nv; return s; });
      return {
        html: `Here is a function machine: ${B(['Input', ...ops.map(y7aOpS), 'Output'].join(' → '))}<br>The output is ${B(y)}. Work out the input.`, diagram: y7aMachine('?', ops, String(y)),
        ...nAns(x), hint: 'Start at the output and work backwards using inverse operations.',
        steps: [`Reverse the machine: ${inv.map(y7aOpS).join(', then ')}`, ...steps, `Input = ${B(ds(x))}`].slice(0, 6),
      };
    }],
  ['One-step equations',
    'An equation is balanced like scales. To find the letter, do the inverse operation to both sides: undo + with −, − with +, × with ÷ and ÷ with ×.',
    (r) => {
      const v = r.pick(['x', 'y', 'a', 'm', 'n', 'p', 't', 'k']); const a = r.int(2, 12), t = r.int(0, 4); const x = r.int(1, 20) + (t === 2 ? a : 0); const V = y7aI(v);
      const E = [
        { q: tx(`${v}+${a}=${x + a}`), s: `Subtract ${a} from both sides: ${V} = ${x + a} − ${a}` },
        { q: tx(`${a}+${v}=${x + a}`), s: `Subtract ${a} from both sides: ${V} = ${x + a} − ${a}` },
        { q: tx(`${v}-${a}=${x - a}`), s: `Add ${a} to both sides: ${V} = ${ds(x - a)} + ${a}` },
        { q: tx(`${a}${v}=${a * x}`), s: `Divide both sides by ${a}: ${V} = ${a * x} ÷ ${a}` },
        { q: `${frac(V, a)} = ${x}`, s: `Multiply both sides by ${a}: ${V} = ${x} × ${a}`, X: x * a },
      ][t];
      const X = E.X || x;
      return { html: `Solve ${B(E.q)}`, answerLabel: `${v} =`, ...nAns(X), hint: 'Use the inverse operation on both sides.', steps: [E.s, `${V} = ${B(ds(X))}`] };
    }],
  ['Two-step equations',
    'Undo the operations in reverse order. First add or subtract to get the letter term on its own, then divide (or multiply) to find the letter.',
    (r) => {
      const v = r.pick(['x', 'y', 'a', 'm', 'n', 'p']); const V = y7aI(v); const x = r.int(1, 15), a = r.int(2, 9), b = r.int(1, 20); const t = r.int(0, 2);
      if (t === 2) {
        const X = a * x, c = x + b;
        return { html: `Solve ${B(`${frac(V, a)} + ${b} = ${c}`)}`, answerLabel: `${v} =`, ...nAns(X), hint: `First subtract ${b} from both sides.`,
          steps: [`Subtract ${b} from both sides: ${frac(V, a)} = ${x}`, `Multiply both sides by ${a}: ${V} = ${x} × ${a}`, `${V} = ${B(X)}`] };
      }
      const add = t === 0 || a * x - b <= 0; const c = add ? a * x + b : a * x - b;
      return {
        html: `Solve ${B(tx(`${a}${v}${add ? '+' : '-'}${b}=${c}`))}`, answerLabel: `${v} =`, ...nAns(x), hint: `First ${add ? 'subtract' : 'add'} ${b} ${add ? 'from' : 'to'} both sides.`,
        steps: [`${add ? 'Subtract' : 'Add'} ${b} ${add ? 'from' : 'to'} both sides: ${tx(`${a}${v}=${a * x}`)}`, `Divide both sides by ${a}: ${V} = ${a * x} ÷ ${a}`, `${V} = ${B(x)}`],
      };
    }],
  ['Exam-style problem',
    'Choose a letter for the unknown and write an equation from the information. Then solve it with inverse operations and check your answer makes sense in the situation.',
    (r) => {
      const t = r.int(0, 4); const [nm, he] = r.pick(y7aN);
      if (t === 0) {
        const x = r.int(2, 30), a = r.int(2, 6), b = r.int(1, 15); const first = r.chance();
        if (first) { const c = a * x - b > 0 ? a * x - b : a * x + b; const sub = a * x - b > 0;
          return { html: `${nm} thinks of a number. ${he[0].toUpperCase() + he.slice(1)} multiplies it by ${B(a)} and then ${sub ? 'subtracts' : 'adds'} ${B(b)}. The answer is ${B(c)}. What number did ${nm} think of?`, ...nAns(x), hint: 'Work backwards using inverse operations.',
            steps: [`Equation: ${tx(`${a}x${sub ? '-' : '+'}${b}=${c}`)}`, `${sub ? 'Add' : 'Subtract'} ${b}: ${tx(`${a}x=${a * x}`)}`, `Divide by ${a}: <i>x</i> = ${B(x)}`] }; }
        const c = a * (x + b);
        return { html: `${nm} thinks of a number. ${he[0].toUpperCase() + he.slice(1)} adds ${B(b)} and then multiplies the result by ${B(a)}. The answer is ${B(c)}. What number did ${nm} think of?`, ...nAns(x), hint: 'Undo the multiplying first, then undo the adding.',
          steps: [`Equation: ${tx(`${a}(x+${b})=${c}`)}`, `Divide by ${a}: ${tx(`x+${b}=${x + b}`)}`, `Subtract ${b}: <i>x</i> = ${B(x)}`] };
      }
      if (t === 1) {
        const f = r.pick([2, 2.5, 3, 3.5, 4]), m = r.pick([1.5, 2, 2.5, 3]), d = r.int(2, 14); const T = f + m * d;
        return { html: `A taxi costs ${B(money(f))} to start the journey plus ${B(money(m))} for every mile. ${nm}'s taxi fare was ${B(money(T))}. How many miles long was the journey?`, ...nAns(d, { unit: 'miles' }), unit: 'miles', hint: 'Take off the starting charge, then divide by the cost per mile.',
          steps: [`Equation: ${ds(f)} + ${ds(m)}<i>d</i> = ${ds(T)}`, `Subtract ${money(f)}: ${ds(m)}<i>d</i> = ${ds(T - f)}`, `Divide by ${ds(m)}: <i>d</i> = ${B(d)} miles`] };
      }
      if (t === 2) {
        const J = r.pick([20, 25, 30, 40, 50]), M = r.int(12, 35), n = r.int(3, 12); const T = J + M * n;
        return { html: `A gym charges a joining fee of ${B('£' + J)} and then ${B('£' + M)} per month. ${nm} has paid ${B(money(T))} in total, including the joining fee. For how many months has ${he} been a member?`, ...nAns(n, { unit: 'months' }), unit: 'months', hint: 'Subtract the joining fee first.',
          steps: [`Equation: ${tx(`${J}+${M}m=${T}`)}`, `Subtract ${J}: ${tx(`${M}m=${T - J}`)}`, `Divide by ${M}: <i>m</i> = ${B(n)} months`] };
      }
      if (t === 3) {
        const k = r.int(2, 5), p = r.int(10, 20) / 2, c = r.pick([3, 3.5, 4, 4.5, 5]); const T = k * p + c;
        return { html: `${nm} buys ${B(k)} cinema tickets, all the same price, and one large popcorn costing ${B(money(c))}. The total cost is ${B(money(T))}. Work out the price of one ticket.`, ...nAns(p, { money: true }), format: 'Type the amount in pounds, e.g. 7.50', hint: 'Subtract the popcorn, then share between the tickets.',
          steps: [`Equation: ${k}<i>t</i> + ${ds(c)} = ${ds(T)}`, `Subtract ${money(c)}: ${k}<i>t</i> = ${ds(k * p)}`, `Divide by ${k}: <i>t</i> = ${B(money(p))}`] };
      }
      const w = r.int(3, 20), k = r.int(2, 9); const P = 4 * w + 2 * k;
      return { html: `The length of a rectangular flower bed is ${B(k + ' m')} more than its width. The perimeter of the flower bed is ${B(P + ' m')}. Work out the width of the flower bed.`, ...nAns(w, { unit: 'm' }), unit: 'm', hint: 'Call the width w, so the length is w + ' + k + '.',
        steps: [`Width = <i>w</i>, length = ${tx(`w+${k}`)}`, `Perimeter: ${tx(`w+w+${k}+w+w+${k}`)} = ${tx(`4w+${2 * k}`)} = ${P}`, `Subtract ${2 * k}: ${tx(`4w=${4 * w}`)}`, `Divide by 4: <i>w</i> = ${B(w + ' m')}`] };
    }],
]);
SPEC['y7-equations'] = 'KS3 Algebra: function machines, inverse operations, solving simple linear equations';

// ---------------------------------------------------------------- coordinates
const y7aLetters = 'ABCDEFGHJKLMNPQRSTUVW'.split('');
function y7aDistinctPts(r, k, lo = -5, hi = 5) {
  const pts = []; let guard = 0;
  while (pts.length < k && guard++ < 500) { const x = r.int(lo, hi), y = r.int(lo, hi); if (pts.some((p) => Math.abs(p.x - x) + Math.abs(p.y - y) < 2)) continue; pts.push({ x, y }); }
  return pts;
}
topic('y7-coordinates', 'algebra', 7, 2, 'FH', 'Coordinates & Simple Graphs', 'Read and plot coordinates in four quadrants, complete shapes, find midpoints and recognise horizontal and vertical lines.', [
  ['Reading coordinates',
    'Coordinates are written (x, y). Go along the x-axis first (right is positive, left is negative), then up or down the y-axis. “Along the corridor, then up the stairs.”',
    (r) => {
      const pts = y7aDistinctPts(r, 4); const labs = r.sample(y7aLetters, 4).sort(); pts.forEach((p, i) => { p.label = labs[i]; });
      const P = r.pick(pts); const w = r.int(0, 2);
      const html = [`Write down the coordinates of point ${B(P.label)}.`, `Four points are plotted on the grid. What are the coordinates of point ${B(P.label)}?`, `Point ${B(P.label)} is marked on the grid. Write down its coordinates.`][w];
      return {
        html, diagram: gridSvg(pts), ...y7aPair(P.x, P.y), hint: 'Read across (x) first, then up or down (y).',
        steps: [`Point ${P.label} is ${Math.abs(P.x)} ${P.x < 0 ? 'left of' : 'right of'} the origin${P.x === 0 ? ' (on the y-axis)' : ''}, so <i>x</i> = ${ds(P.x)}.`, `It is ${Math.abs(P.y)} ${P.y < 0 ? 'down' : 'up'} from the origin${P.y === 0 ? ' (on the x-axis)' : ''}, so <i>y</i> = ${ds(P.y)}.`, `Coordinates: ${B(y7aPt(P.x, P.y))}`],
      };
    }],
  ['Completing a rectangle or square',
    'In a rectangle with sides parallel to the axes, the corners share x-coordinates (on vertical sides) and y-coordinates (on horizontal sides). Use the matching coordinates of the other corners to find the missing one.',
    (r) => {
      const sqr = r.chance(0.35); const x1 = sqr ? r.int(-5, 0) : r.int(-5, 1), y1 = sqr ? r.int(-5, 0) : r.int(-5, 1); const W = sqr ? r.int(2, 5) : r.int(2, 4), H = sqr ? W : r.int(2, 4);
      const x2 = x1 + W, y2 = y1 + H;
      const C = [[x1, y1], [x2, y1], [x2, y2], [x1, y2]]; const s = r.int(0, 3); const order = [0, 1, 2, 3].map((i) => C[(i + s) % 4]);
      const names = ['A', 'B', 'C', 'D']; const miss = r.int(0, 3); const M = order[miss];
      const given = order.map((p, i) => (i === miss ? null : `${names[i]}${y7aPt(p[0], p[1])}`)).filter(Boolean);
      const nb1 = order[(miss + 1) % 4], nb2 = order[(miss + 3) % 4];
      const shareX = nb1[0] === M[0] ? nb1 : nb2, shareY = nb1[1] === M[1] ? nb1 : nb2;
      return {
        html: `${B('ABCD')} is a ${sqr ? 'square' : 'rectangle'} with sides parallel to the axes. The corners are labelled in order. ${given.join(', ')}.<br>Find the coordinates of ${B(names[miss])}.`,
        diagram: gridSvg(order.map((p, i) => ({ x: p[0], y: p[1], label: names[i] })).filter((p, i) => i !== miss)), ...y7aPair(M[0], M[1]), hint: `${names[miss]} lines up with its two neighbouring corners.`,
        steps: [`${names[miss]} is directly above or below a neighbour with <i>x</i> = ${ds(shareX[0])}.`, `${names[miss]} is level with a neighbour with <i>y</i> = ${ds(shareY[1])}.`, `${names[miss]} = ${B(y7aPt(M[0], M[1]))}`],
      };
    }],
  ['Midpoints',
    'The midpoint is exactly halfway between two points. Add the two x-coordinates and halve; then add the two y-coordinates and halve.',
    (r) => {
      let x1, y1, x2, y2; do { x1 = r.int(-8, 10); y1 = r.int(-8, 10); x2 = x1 + 2 * r.int(-5, 5); y2 = y1 + 2 * r.int(-5, 5); } while ((x1 === x2 && y1 === y2) || Math.abs(x2) > 12 || Math.abs(y2) > 12);
      const mx = (x1 + x2) / 2, my = (y1 + y2) / 2; const [P, Q] = r.pick([['A', 'B'], ['P', 'Q'], ['C', 'D'], ['M', 'N']]);
      return {
        html: `${B(P)} is the point ${B(y7aPt(x1, y1))} and ${B(Q)} is the point ${B(y7aPt(x2, y2))}. Find the coordinates of the midpoint of ${B(P + Q)}.`, ...y7aPair(mx, my), hint: 'Halfway between: add and halve each coordinate.',
        steps: [`<i>x</i>: (${ds(x1)} + ${br(x2)}) ÷ 2 = ${ds(x1 + x2)} ÷ 2 = ${ds(mx)}`, `<i>y</i>: (${ds(y1)} + ${br(y2)}) ÷ 2 = ${ds(y1 + y2)} ÷ 2 = ${ds(my)}`, `Midpoint = ${B(y7aPt(mx, my))}`],
      };
    }],
  ['Horizontal & vertical lines',
    'Every point on a vertical line has the same x-coordinate, so its equation is x = a number. Every point on a horizontal line has the same y-coordinate, so its equation is y = a number.',
    (r) => {
      const t = r.int(0, 2); const c = r.int(-6, 6);
      if (t === 0) {
        const vert = r.chance(); let p, q; do { p = r.int(-6, 6); q = r.int(-6, 6); } while (p === q);
        const A = vert ? [c, p] : [p, c], Bp = vert ? [c, q] : [q, c]; const L = vert ? 'x' : 'y'; const ans = `${L} = ${ps(c)}`;
        return {
          html: `A straight line passes through the points ${B(y7aPt(...A))} and ${B(y7aPt(...Bp))}. Write down the equation of the line.`, answer: ans, check: { type: 'text', accept: [`${L}=${ps(c)}`] }, answerHtml: B(tx(`${L}=${ps(c)}`)), format: 'Type an equation, e.g. x = 4 or y = −2',
          hint: `Which coordinate is the same for both points?`, steps: [`Both points have ${L}-coordinate ${ds(c)}.`, `The line is ${vert ? 'vertical' : 'horizontal'}, so its equation is ${B(tx(`${L}=${ps(c)}`))}`],
        };
      }
      if (t === 1) {
        const d = r.int(-6, 6);
        return {
          html: `Point ${B('P')} lies on the line ${B(tx(`x=${ps(c)}`))} and on the line ${B(tx(`y=${ps(d)}`))}. Write down the coordinates of ${B('P')}.`, ...y7aPair(c, d), hint: 'P is where the two lines cross.',
          steps: [`On ${tx(`x=${ps(c)}`)}, the x-coordinate is ${ds(c)}.`, `On ${tx(`y=${ps(d)}`)}, the y-coordinate is ${ds(d)}.`, `P = ${B(y7aPt(c, d))}`],
        };
      }
      const L = r.pick(['x', 'y']); const labs = r.pick([['A', 'B', 'C', 'D'], ['P', 'Q', 'R', 'S'], ['E', 'F', 'G', 'H']]); const k = r.int(0, 3);
      const pts = labs.map((lab, i) => { let a = r.int(-6, 6); const o = r.int(-6, 6); if (i === k) a = c; else while (a === c) a = r.int(-6, 6); return { lab, xy: L === 'x' ? [a, o] : [o, a] }; });
      const right = pts[k];
      return {
        html: `Which of these points lies on the line ${B(tx(`${L}=${ps(c)}`))}?<br>${pts.map((p) => `${B(p.lab)} ${y7aPt(...p.xy)}`).join(', &nbsp;')}`, answer: right.lab, check: { type: 'text', accept: [right.lab] }, answerHtml: B(right.lab), format: 'Type the letter of the point, e.g. A',
        hint: `Look for the point whose ${L}-coordinate is ${ds(c)}.`, steps: [`Points on ${tx(`${L}=${ps(c)}`)} have ${L}-coordinate ${ds(c)}.`, `Only ${right.lab}${y7aPt(...right.xy)} has ${L} = ${ds(c)}, so the answer is ${B(right.lab)}`],
      };
    }],
  ['Exam-style problem',
    'Sketch the points on a grid if it helps. Use what you know about coordinates — matching x or y values, moving right/left and up/down, or halfway points — and then answer the question in context.',
    (r) => {
      const t = r.int(0, 4); const [nm, he] = r.pick(y7aN);
      if (t === 0) {
        let x1, y1, x2, y2; do { x1 = r.int(-6, 8); y1 = r.int(-6, 8); x2 = x1 + 2 * r.int(-6, 6); y2 = y1 + 2 * r.int(-6, 6); } while (x1 === x2 || y1 === y2);
        const [A, Bp, M] = r.pick([['the school', 'the park', 'bus stop'], ['the library', 'the station', 'café'], ['a lighthouse', 'a harbour', 'buoy'], ['the cinema', 'the leisure centre', 'post box']]);
        const mx = (x1 + x2) / 2, my = (y1 + y2) / 2;
        return {
          html: `On a town map, ${A} is at ${B(y7aPt(x1, y1))} and ${Bp} is at ${B(y7aPt(x2, y2))}. A ${M} is exactly halfway between them. Find the coordinates of the ${M}.`, ...y7aPair(mx, my), hint: 'Find the midpoint.',
          steps: [`<i>x</i>: (${ds(x1)} + ${br(x2)}) ÷ 2 = ${ds(mx)}`, `<i>y</i>: (${ds(y1)} + ${br(y2)}) ÷ 2 = ${ds(my)}`, `The ${M} is at ${B(y7aPt(mx, my))}`],
        };
      }
      if (t === 1) {
        const x1 = r.int(-5, 0), y1 = r.int(-5, 0), W = r.int(2, 5), H = r.int(2, 5), k = r.pick([2, 3, 5, 10]); const x2 = x1 + W, y2 = y1 + H;
        const P = 2 * (W + H) * k;
        return {
          html: `A rectangular garden is drawn on a coordinate grid. Three of its corners are at ${y7aPt(x1, y1)}, ${y7aPt(x2, y1)} and ${y7aPt(x2, y2)}. One unit on the grid represents ${B(k + ' metres')}.<br>${nm} wants to put a fence all the way round the garden. How many metres of fencing does ${he} need?`,
          diagram: gridSvg([{ x: x1, y: y1, label: '' }, { x: x2, y: y1, label: '' }, { x: x2, y: y2, label: '' }]), ...nAns(P, { unit: 'm' }), unit: 'm', hint: 'Find the length and width in grid units, then convert to metres.',
          steps: [`Fourth corner: ${y7aPt(x1, y2)}`, `Width = ${ds(x2)} − ${br(x1)} = ${W} units, height = ${ds(y2)} − ${br(y1)} = ${H} units`, `Perimeter = 2 × (${W} + ${H}) = ${2 * (W + H)} units`, `${2 * (W + H)} × ${k} = ${B(P + ' m')}`],
        };
      }
      if (t === 2) {
        const x1 = r.int(-6, 1), y = r.int(-6, 2), s = r.int(2, 5);
        return {
          html: `A square patio has two corners at ${B(y7aPt(x1, y))} and ${B(y7aPt(x1 + s, y))}, and the other two corners above them. Each unit on the grid represents ${B('1 metre')}.<br>Find the coordinates of the other two corners, then work out the area of the patio in m².`,
          ...nAns(s * s, { unit: 'm²' }), unit: 'm²', hint: 'The side length is the distance between the two corners.',
          steps: [`Side length = ${ds(x1 + s)} − ${br(x1)} = ${s} m`, `The other corners are ${y7aPt(x1, y + s)} and ${y7aPt(x1 + s, y + s)}.`, `Area = ${s} × ${s} = ${B(s * s + ' m²')}`],
        };
      }
      if (t === 3) {
        const x0 = r.int(-4, 4), y0 = r.int(-4, 4); const m1 = [r.nz(-5, 5), r.nz(-5, 5)], m2 = [r.nz(-4, 4), r.nz(-4, 4)];
        const X = x0 + m1[0] + m2[0], Y = y0 + m1[1] + m2[1];
        const mv = (m) => `${Math.abs(m[0])} ${m[0] > 0 ? 'right' : 'left'} and ${Math.abs(m[1])} ${m[1] > 0 ? 'up' : 'down'}`;
        const who = r.pick(['A robot', 'A toy car', 'A counter in a board game', 'A drone']);
        return {
          html: `${who} starts at ${B(y7aPt(x0, y0))}. It moves ${B(mv(m1))}, then moves ${B(mv(m2))}. What are its coordinates now?`, ...y7aPair(X, Y), hint: 'Right/left changes x; up/down changes y.',
          steps: [`After the first move: (${ds(x0)}${pm(m1[0])}, ${ds(y0)}${pm(m1[1])}) = ${y7aPt(x0 + m1[0], y0 + m1[1])}`, `After the second move: (${ds(x0 + m1[0])}${pm(m2[0])}, ${ds(y0 + m1[1])}${pm(m2[1])})`, `Final position: ${B(y7aPt(X, Y))}`],
        };
      }
      let x1, y1, b, h; do { x1 = r.int(-5, 0); y1 = r.int(-5, 0); b = r.int(2, 6); h = r.int(2, 6); } while ((b * h) % 2);
      return {
        html: `A triangle has corners at ${B(y7aPt(x1, y1))}, ${B(y7aPt(x1 + b, y1))} and ${B(y7aPt(x1, y1 + h))}. Each grid unit is ${B('1 cm')}. Work out the area of the triangle.`,
        diagram: gridSvg([{ x: x1, y: y1, label: '' }, { x: x1 + b, y: y1, label: '' }, { x: x1, y: y1 + h, label: '' }]), ...nAns(b * h / 2, { unit: 'cm²' }), unit: 'cm²', hint: 'It is a right-angled triangle: area = ½ × base × height.',
        steps: [`Base = ${ds(x1 + b)} − ${br(x1)} = ${b} cm`, `Height = ${ds(y1 + h)} − ${br(y1)} = ${h} cm`, `Area = ½ × ${b} × ${h} = ${B(b * h / 2 + ' cm²')}`],
      };
    }],
]);
SPEC['y7-coordinates'] = 'KS3 Algebra: coordinates in all four quadrants, horizontal and vertical lines';

// ---------------------------------------------------------------- ratio
const y7aPairs = [['red', 'blue', 'counters in a bag'], ['boys', 'girls', 'pupils in a club'], ['cats', 'dogs', 'pets at a rescue centre'], ['cars', 'vans', 'vehicles in a car park'], ['apples', 'oranges', 'pieces of fruit in a box'], ['adults', 'children', 'people on a trip'], ['fiction', 'non-fiction', 'books on a shelf']];
topic('y7-ratio', 'ratio', 7, 3, 'FH', 'Introduction to Ratio', 'Write and simplify ratios, link ratios to fractions, share in a ratio and scale recipes.', [
  ['Writing & simplifying ratios',
    'A ratio compares amounts, written with a colon, e.g. 12 : 18. Keep the order the question asks for. Simplify by dividing both parts by their highest common factor: 12 : 18 = 2 : 3.',
    (r) => {
      let p, q; do { p = r.int(1, 9); q = r.int(1, 9); } while (p === q || gcd(p, q) !== 1); const k = r.int(2, 9);
      const [A, Bn, what] = r.pick(y7aPairs); const swap = r.chance(); const plain = r.chance(0.25);
      const [first, second] = swap ? [q * k, p * k] : [p * k, q * k]; const [s1, s2] = swap ? [q, p] : [p, q];
      const html = plain ? `Write the ratio ${B(`${first} : ${second}`)} in its simplest form.`
        : `There are ${p * k} ${A} and ${q * k} ${Bn} (${what}). Write the ratio of ${B(swap ? `${Bn} to ${A}` : `${A} to ${Bn}`)} in its simplest form.`;
      return {
        html, ...y7aRat(s1, s2), hint: 'Divide both parts by the same number until you cannot go further.',
        steps: [...(plain ? [] : [`Ratio = ${first} : ${second}`]), `The highest common factor of ${first} and ${second} is ${k}.`, `Divide both by ${k}: ${B(`${s1} : ${s2}`)}`],
      };
    }],
  ['Ratios and fractions',
    'In the ratio 2 : 3 there are 2 + 3 = 5 parts altogether, so the first amount is 2/5 of the total and the second is 3/5. Going the other way, if 2/5 are red then 3/5 are not, so red : not red = 2 : 3.',
    (r) => {
      let p, q; do { p = r.int(1, 9); q = r.int(1, 9); } while (p === q || gcd(p, q) !== 1); const [A, Bn, what] = r.pick(y7aPairs);
      if (r.chance()) {
        const askA = r.chance(); const num = askA ? p : q;
        return {
          html: `The ratio of ${A} to ${Bn} (${what}) is ${B(`${p} : ${q}`)}. What fraction of them are ${B(askA ? A : Bn)}?`, ...fAns(num, p + q), hint: 'Add the parts to find the total number of parts.',
          steps: [`Total parts = ${p} + ${q} = ${p + q}`, `${askA ? A : Bn}: ${num} out of ${p + q} parts = ${B(fracN(num, p + q))}`],
        };
      }
      const n = p, d = p + q;
      return {
        html: `${fracN(n, d)} of the ${what} are ${A}. The rest are ${Bn}. Write the ratio ${B(`${A} : ${Bn}`)} in its simplest form.`, ...y7aRat(p, q), hint: `If ${n} out of every ${d} are ${A}, how many are ${Bn}?`,
        steps: [`Out of every ${d}, ${n} are ${A} and ${d} − ${n} = ${q} are ${Bn}.`, `${A} : ${Bn} = ${B(`${p} : ${q}`)}`],
      };
    }],
  ['Sharing in a ratio',
    'To share in a ratio: add the parts to find how many shares there are, divide the total by this to find one share, then multiply by each part of the ratio.',
    (r) => {
      let p, q; do { p = r.int(1, 7); q = r.int(1, 7); } while (p === q || gcd(p, q) !== 1); const one = r.int(2, 15); const tot = one * (p + q);
      const [[n1], [n2]] = r.sample(y7aN, 2); const t = r.int(0, 3); const askFirst = r.chance(); const who = askFirst ? n1 : n2; const part = askFirst ? p : q;
      const thing = ['£', 'sweets', 'stickers', 'marbles'][t]; const isM = t === 0;
      const amt = (v) => (isM ? '£' + v : `${v} ${thing}`);
      return {
        html: `${n1} and ${n2} share ${B(amt(tot))} in the ratio ${B(`${p} : ${q}`)}. How ${isM ? 'much money' : 'many ' + thing} does ${who} get?`,
        ...(isM ? nAns(one * part, { money: true }) : nAns(one * part)), format: isM ? 'Type the amount in pounds, e.g. 24' : 'Type a whole number', hint: 'Add the parts first.',
        steps: [`Total parts = ${p} + ${q} = ${p + q}`, `One part = ${tot} ÷ ${p + q} = ${one}`, `${who} gets ${part} parts: ${part} × ${one} = ${B(amt(one * part))}`],
      };
    }],
  ['Recipes & scaling',
    'Find the amount for one (one person, one item) by dividing, then multiply up to the number you need. Or spot a simple scale factor, e.g. 4 people → 12 people is × 3.',
    (r) => {
      const t = r.int(0, 1);
      if (t === 0) {
        const [ing, u, lo, hi] = r.pick([['flour', 'g', 20, 60], ['butter', 'g', 10, 30], ['milk', 'ml', 25, 80], ['sugar', 'g', 10, 40], ['rice', 'g', 50, 90], ['pasta', 'g', 60, 110]]);
        const per = r.int(lo, hi); const N = r.pick([2, 4, 5, 6, 8]); let M; do { M = r.int(2, 12); } while (M === N);
        const dish = { flour: 'pancakes', butter: 'a crumble', milk: 'a rice pudding', sugar: 'a fruit cake', rice: 'a risotto', pasta: 'a pasta bake' }[ing];
        return {
          html: `A recipe for ${dish} for ${B(N + ' people')} uses ${B(per * N + ' ' + u)} of ${ing}. How much ${ing} is needed for ${B(M + ' people')}?`, ...nAns(per * M, { unit: u }), unit: u, hint: 'Find the amount for one person first.',
          steps: [`For 1 person: ${per * N} ÷ ${N} = ${per} ${u}`, `For ${M} people: ${per} × ${M} = ${B(per * M + ' ' + u)}`],
        };
      }
      const [item, lo, hi] = r.pick([['pens', 30, 90], ['notebooks', 80, 250], ['bread rolls', 25, 60], ['cans of drink', 45, 95]]);
      const per = r.int(lo, hi); const N = r.int(2, 6); let M; do { M = r.int(2, 10); } while (M === N);
      return {
        html: `${N} ${item} cost ${B(money(per * N / 100))}. Work out the cost of ${B(M + ' ' + item)}.`, ...nAns(per * M / 100, { money: true }), format: 'Type the amount in pounds, e.g. 3.60', hint: 'Find the cost of one first.',
        steps: [`Cost of 1: ${money(per * N / 100)} ÷ ${N} = ${money(per / 100)}`, `Cost of ${M}: ${M} × ${money(per / 100)} = ${B(money(per * M / 100))}`],
      };
    }],
  ['Exam-style problem',
    'Decide what the ratio compares and what you are told: a total, one part, or a difference. Work out the value of one part, then use it to answer the question — check whether you need to round up for things like tins or packs.',
    (r) => {
      const t = r.int(0, 4); const [[n1], [n2]] = r.sample(y7aN, 2);
      if (t === 0) {
        let p, q; do { p = r.int(1, 7); q = r.int(1, 7); } while (p === q || gcd(p, q) !== 1); const one = r.int(3, 20); const tot = one * (p + q);
        const [hi, lo] = p > q ? [n1, n2] : [n2, n1];
        return {
          html: `${n1} and ${n2} share ${B('£' + tot)} in the ratio ${B(`${p} : ${q}`)}. How much more money does ${hi} get than ${lo}?`, ...nAns(one * Math.abs(p - q), { money: true }), format: 'Type the amount in pounds, e.g. 15', hint: 'Find one share first.',
          steps: [`Total parts = ${p + q}; one part = £${tot} ÷ ${p + q} = £${one}`, `${n1} gets ${p} × £${one} = £${p * one}; ${n2} gets ${q} × £${one} = £${q * one}`, `Difference = ${B(money(one * Math.abs(p - q)))}`],
        };
      }
      if (t === 1) {
        let p, q; do { p = r.int(1, 5); q = r.int(1, 5); } while (p === q || gcd(p, q) !== 1); const one = r.int(1, 6); const T = one * (p + q); const tin = r.pick([2, 2.5, 4, 5]);
        const yl = p * one; const tins = Math.ceil(yl / tin - 1e-9);
        const [c1, c2, mix] = r.pick([['yellow', 'blue', 'green'], ['red', 'white', 'pink'], ['blue', 'red', 'purple'], ['red', 'yellow', 'orange']]);
        return {
          html: `${n1} mixes ${c1} paint and ${c2} paint in the ratio ${B(`${p} : ${q}`)} to make ${mix} paint. ${n1} wants ${B(T + ' litres')} of ${mix} paint. ${c1[0].toUpperCase() + c1.slice(1)} paint is sold in ${B(ds(tin) + '-litre')} tins. How many tins of ${c1} paint must ${n1} buy?`,
          ...nAns(tins), hint: 'Find how many litres of ' + c1 + ' paint are needed, then think about whole tins.',
          steps: [`One part = ${T} ÷ ${p + q} = ${one} litre${one > 1 ? 's' : ''}`, `${c1[0].toUpperCase() + c1.slice(1)} paint = ${p} × ${one} = ${yl} litres`, `${yl} ÷ ${ds(tin)} = ${ds(rnd(yl / tin, 2))}${Number.isInteger(yl / tin) ? '' : ', so round up'}`, `${n1} must buy ${B(tins)} tins`],
        };
      }
      if (t === 2) {
        let p, q; do { p = r.int(2, 7); q = r.int(2, 7); } while (p === q || gcd(p, q) !== 1); const one = r.int(2, 6);
        const [g, A, Bn] = r.pick([['class', 'boys', 'girls'], ['choir', 'sopranos', 'altos'], ['football club', 'juniors', 'seniors'], ['coach trip', 'adults', 'children']]);
        return {
          html: `In a ${g}, the ratio of ${A} to ${Bn} is ${B(`${p} : ${q}`)}. There are ${B(p * one)} ${A}. How many people are in the ${g} altogether?`, ...nAns((p + q) * one), hint: `${p} parts = ${p * one} ${A}.`,
          steps: [`${p} parts = ${p * one}, so 1 part = ${p * one} ÷ ${p} = ${one}`, `Total parts = ${p} + ${q} = ${p + q}`, `Total = ${p + q} × ${one} = ${B((p + q) * one)}`],
        };
      }
      if (t === 3) {
        const k = r.int(3, 9), c = r.pick([25, 30, 40, 50, 60]); const J = c * (1 + k); const bottle = r.pick([500, 750, 1000]); const jugs = Math.floor(bottle / c);
        return {
          html: `Orange squash is made by mixing squash and water in the ratio ${B(`1 : ${k}`)}. ${n1} makes a jug holding ${B(J + ' ml')} of drink. A bottle contains ${B(bottle + ' ml')} of squash. How many full jugs of drink can ${n1} make from one bottle?`,
          ...nAns(jugs), hint: 'Work out how much squash goes in one jug.',
          steps: [`Total parts = 1 + ${k} = ${k + 1}`, `Squash per jug = ${J} ÷ ${k + 1} = ${c} ml`, `${bottle} ÷ ${c} = ${ds(rnd(bottle / c, 2))}${bottle % c ? ', so only whole jugs count' : ''}`, `${B(jugs)} full jugs`],
        };
      }
      let p, q; do { p = r.int(1, 6); q = r.int(2, 9); } while (q <= p || gcd(p, q) !== 1); const one = r.int(2, 10); const diff = (q - p) * one;
      const thing = r.pick(['sweets', 'football cards', 'stickers', 'beads']);
      return {
        html: `${n1} and ${n2} share some ${thing} in the ratio ${B(`${p} : ${q}`)}. ${n2} gets ${B(diff)} more ${thing} than ${n1}. How many ${thing} are there altogether?`, ...nAns((p + q) * one), hint: 'The difference is worth ' + (q - p) + ' parts.',
        steps: [`Difference in parts = ${q} − ${p} = ${q - p}`, `${q - p} parts = ${diff}, so 1 part = ${one}`, `Total parts = ${p + q}, so total = ${p + q} × ${one} = ${B((p + q) * one)}`],
      };
    }],
]);
SPEC['y7-ratio'] = 'KS3 Ratio: ratio notation, simplifying, sharing in a ratio, scaling';

// ---------------------------------------------------------------- measures
const y7aUnits = [['km', 'm', 1000], ['m', 'cm', 100], ['cm', 'mm', 10], ['kg', 'g', 1000], ['litres', 'ml', 1000], ['m', 'mm', 1000]];
topic('y7-measures', 'ratio', 7, 3, 'FH', 'Measures & Unit Conversion', 'Convert metric units, use 12- and 24-hour times, durations and timetables, and calculate with money.', [
  ['Metric conversions',
    'Learn the key facts: 1 km = 1000 m, 1 m = 100 cm, 1 cm = 10 mm, 1 kg = 1000 g, 1 litre = 1000 ml. Changing to a smaller unit, multiply (more of them); changing to a bigger unit, divide.',
    (r) => {
      const [big, small, f] = r.pick(y7aUnits); const toSmall = r.chance();
      const smallVal = r.pick([r.int(1, 9) * f / 10, r.int(11, 99) * f / 10, r.int(101, 999) * f / 100, r.int(1, 30) * f + r.int(1, 9) * f / 10]);
      const sv = rnd(smallVal, 6), bv = rnd(smallVal / f, 6);
      const [fromV, fromU, toV, toU] = toSmall ? [bv, big, sv, small] : [sv, small, bv, big];
      return {
        html: `Convert ${B(ds(fromV) + ' ' + fromU)} into ${B(toU)}.`, ...nAns(toV, { unit: toU }), unit: toU, hint: `1 ${big} = ${ds(f)} ${small}.`,
        steps: [`1 ${big} = ${ds(f)} ${small}`, `${toSmall ? 'Smaller unit, so multiply' : 'Bigger unit, so divide'}: ${ds(fromV)} ${toSmall ? '×' : '÷'} ${ds(f)} = ${B(ds(toV) + ' ' + toU)}`],
      };
    }],
  ['12- and 24-hour clock',
    'The 24-hour clock always uses four digits, e.g. 07:15 or 19:15. For pm times (after midday) add 12 to the hour; for 24-hour times after 12:59, subtract 12 to get the pm time. 12 midnight is 00:00.',
    (r) => {
      const h24 = r.int(0, 23), mm = r.int(0, 11) * 5 + r.pick([0, 0, 1, 3]) % 5; const m = Math.min(mm, 59);
      const pm2 = h24 >= 12; const h12 = h24 % 12 === 0 ? 12 : h24 % 12; const M2 = String(m).padStart(2, '0');
      const t12 = `${h12}:${M2} ${pm2 ? 'pm' : 'am'}`, t24 = `${String(h24).padStart(2, '0')}:${M2}`;
      const note = h24 === 0 ? ' (midnight hour: 12 am becomes 00)' : h24 === 12 ? ' (12 pm is midday, so the hour stays 12)' : pm2 ? ` (pm, so ${h12} + 12 = ${h24})` : ' (am, so the hour stays the same)';
      if (r.chance()) {
        const H = String(h24).padStart(2, '0');
        return {
          html: `Write ${B(t12)} using the ${B('24-hour clock')}.`, answer: t24, check: { type: 'text', accept: [t24, `${H}${M2}`, `${H}.${M2}`, ...(h24 < 10 ? [`${h24}:${M2}`] : [])] }, answerHtml: B(t24), format: 'Type a 24-hour time, e.g. 14:35',
          hint: 'pm times: add 12 to the hour (except 12 pm).', steps: [`Hour: ${h12} ${pm2 ? 'pm' : 'am'} → ${H}${note}`, `Answer: ${B(t24)}`],
        };
      }
      const ap = pm2 ? 'pm' : 'am';
      return {
        html: `Write ${B(t24)} as a ${B('12-hour clock')} time, using am or pm.`, answer: t12, check: { type: 'text', accept: [`${h12}:${M2}${ap}`, `${h12}.${M2}${ap}`, `${h12}:${M2}${ap[0]}.m`, `${h12}.${M2}${ap[0]}.m`] }, answerHtml: B(t12), format: 'Type a time with am or pm, e.g. 2:35 pm',
        hint: 'Hours 13 to 23: subtract 12 and use pm.', steps: [`Hour ${String(h24).padStart(2, '0')} → ${h12} ${ap}${h24 > 12 ? ` (${h24} − 12 = ${h12})` : h24 === 0 ? ' (00 is the midnight hour)' : ''}`, `Answer: ${B(t12)}`],
      };
    }],
  ['Durations & timetables',
    'To find how long something takes, count on from the start time: first to the next whole hour, then whole hours, then the extra minutes. With a timetable, read across a row for one bus or train and down a column for the stops.',
    (r) => {
      const stops = r.sample(['Bus Station', 'Market Square', 'Park Road', 'Hospital', 'Library', 'Leisure Centre', 'High Street', 'Railway Station'], 4);
      const gaps = [0, r.int(4, 18), r.int(5, 20), r.int(6, 25)]; const off = gaps.map((g, i) => sum(gaps.slice(0, i + 1)));
      const s0 = r.int(6 * 60 + 30, 9 * 60) ; const starts = [s0, s0 + r.int(4, 9) * 5, 0]; starts[2] = starts[1] + r.int(4, 9) * 5;
      const tbl = table([['', ...starts.map((_, j) => `Bus ${j + 1}`)], ...stops.map((s, i) => [s, ...starts.map((st) => y7aHM(st + off[i]))])]);
      if (r.chance()) {
        const j = r.int(0, 2); const i1 = r.int(0, 2), i2 = r.int(i1 + 1, 3); const d = off[i2] - off[i1];
        return {
          html: `Here is part of a bus timetable.${tbl}How many minutes does ${B(`Bus ${j + 1}`)} take to travel from ${B(stops[i1])} to ${B(stops[i2])}?`, ...nAns(d, { unit: 'minutes' }), unit: 'minutes', hint: 'Find both times in that bus’s column and subtract.',
          steps: [`Bus ${j + 1} leaves ${stops[i1]} at ${y7aHM(starts[j] + off[i1])} and reaches ${stops[i2]} at ${y7aHM(starts[j] + off[i2])}.`, `Time taken = ${B(d)} minutes`],
        };
      }
      const i = r.int(0, 2); const j = r.int(1, 2); const arr = starts[j] + off[i] - r.int(1, starts[j] - starts[j - 1] - 1);
      const wait = starts[j] + off[i] - arr; const who = r.pick(y7aN);
      return {
        html: `Here is part of a bus timetable.${tbl}${who[0]} arrives at ${B(stops[i])} at ${B(y7aHM(arr))}. How many minutes does ${who[1]} have to wait for the next bus?`, ...nAns(wait, { unit: 'minutes' }), unit: 'minutes', hint: 'Find the first bus at that stop after she arrives.',
        steps: [`At ${stops[i]}, the next bus after ${y7aHM(arr)} is Bus ${j + 1} at ${y7aHM(starts[j] + off[i])}.`, `Wait = from ${y7aHM(arr)} to ${y7aHM(starts[j] + off[i])} = ${B(wait)} minutes`],
      };
    }],
  ['Money calculations',
    'Work in pounds or pence, not a mix: £1 = 100p. Add up the cost of everything, then subtract from the amount paid to find the change.',
    (r) => {
      const [shop, items] = r.pick([['café', [['sandwich', 250, 450], ['coffee', 180, 320], ['muffin', 120, 260], ['juice', 90, 180]]], ['stationery shop', [['ruler', 45, 120], ['notebook', 150, 350], ['pen', 35, 99], ['pencil case', 250, 600]]], ['bakery', [['bread roll', 45, 95], ['doughnut', 60, 140], ['pasty', 180, 340], ['cookie', 50, 120]]], ['sports shop', [['water bottle', 300, 800], ['pair of socks', 250, 600], ['cap', 600, 1200], ['sweatband', 150, 400]]]]);
      const [i1, i2] = r.sample(items, 2); const p1 = r.int(i1[1] / 5, i1[2] / 5) * 5, p2 = r.int(i2[1] / 5, i2[2] / 5) * 5; let a, b; do { a = r.int(1, 4); b = r.int(1, 3); } while (a * p1 + b * p2 >= 5000);
      const tot = a * p1 + b * p2; const note = [500, 1000, 2000, 5000].find((n) => n >= tot + 1); const fmt = (p) => (p < 100 ? `${p}p` : money(p / 100));
      const pl = (n, s) => (n > 1 ? (s.startsWith('pair') ? s.replace('pair', 'pairs') : s.endsWith('ch') ? s + 'es' : s + 's') : s);
      return {
        html: `At a ${shop}, a ${i1[0]} costs ${B(fmt(p1))} and a ${i2[0]} costs ${B(fmt(p2))}. ${r.pick(['Ava', 'Ben', 'Cara', 'Dev', 'Erin'])} buys ${a} ${pl(a, i1[0])} and ${b} ${pl(b, i2[0])}, and pays with a ${B(money(note / 100).replace('.00', ''))} note. How much change should be given?`,
        ...nAns((note - tot) / 100, { money: true }), format: 'Type the amount in pounds, e.g. 3.45', hint: 'Find the total cost first.',
        steps: [`${a} × ${fmt(p1)} = ${fmt(a * p1)}; ${b} × ${fmt(p2)} = ${fmt(b * p2)}`, `Total = ${money(tot / 100)}`, `Change = ${money(note / 100)} − ${money(tot / 100)} = ${B(money((note - tot) / 100))}`],
      };
    }],
  ['Exam-style problem',
    'Change everything into the same unit before you calculate. Then do one step at a time — for example convert, multiply, then subtract — and check your answer is sensible.',
    (r) => {
      const t = r.int(0, 4); const [nm, he] = r.pick(y7aN);
      if (t === 0) {
        const L = r.pick([1, 1.5, 2, 2.5, 3]), g = r.pick([150, 200, 250, 300]); const n = r.int(2, Math.floor(L * 1000 / g)); const left = L * 1000 - n * g;
        const drink = r.pick(['lemonade', 'orange juice', 'apple juice', 'water']);
        return {
          html: `A bottle holds ${B(ds(L) + ' litres')} of ${drink}. ${nm} pours ${B(n)} glasses, each holding ${B(g + ' ml')}. How many millilitres of ${drink} are left in the bottle?`, ...nAns(left, { unit: 'ml' }), unit: 'ml', hint: 'Change litres to millilitres first.',
          steps: [`${ds(L)} litres = ${ds(L * 1000)} ml`, `Poured: ${n} × ${g} = ${n * g} ml`, `Left: ${ds(L * 1000)} − ${n * g} = ${B(ds(left) + ' ml')}`],
        };
      }
      if (t === 1) {
        const R = r.int(2, 6), p = r.pick([15, 25, 30, 35, 40, 45, 60, 70]); const n = Math.floor(R * 100 / p); const left = R * 100 - n * p;
        if (left === 0) { const R2 = R + 0.5; const n2 = Math.floor(R2 * 100 / p); const l2 = R2 * 100 - n2 * p;
          return { html: `${nm} has a ribbon ${B(ds(R2) + ' m')} long. ${he[0].toUpperCase() + he.slice(1)} cuts as many pieces of length ${B(p + ' cm')} as possible. How many centimetres of ribbon are left over?`, ...nAns(l2, { unit: 'cm' }), unit: 'cm', hint: 'Change metres to centimetres first.',
            steps: [`${ds(R2)} m = ${R2 * 100} cm`, `${R2 * 100} ÷ ${p} = ${n2} remainder ${l2}`, `${n2} pieces use ${n2 * p} cm, leaving ${B(l2 + ' cm')}`] }; }
        return { html: `${nm} has a ribbon ${B(R + ' m')} long. ${he[0].toUpperCase() + he.slice(1)} cuts as many pieces of length ${B(p + ' cm')} as possible. How many centimetres of ribbon are left over?`, ...nAns(left, { unit: 'cm' }), unit: 'cm', hint: 'Change metres to centimetres first.',
          steps: [`${R} m = ${R * 100} cm`, `${R * 100} ÷ ${p} = ${n} remainder ${left}`, `${n} pieces use ${n * p} cm, leaving ${B(left + ' cm')}`] };
      }
      if (t === 2) {
        const dep = r.int(7 * 12, 10 * 12) * 5 + r.pick([0, 2, 3, 7]); const dur = r.int(40, 150); const arr = dep + dur; const meet = Math.ceil((arr + r.int(5, 50)) / 15) * 15; const early = meet - arr;
        return {
          html: `${nm}'s train leaves at ${B(y7aHM(dep))}. The journey takes ${B(y7aDur(dur))}. ${he[0].toUpperCase() + he.slice(1)} has a meeting at ${B(y7aHM(meet))}, at the station where the train arrives. How many minutes before the meeting does the train arrive?`,
          ...nAns(early, { unit: 'minutes' }), unit: 'minutes', hint: 'Work out the arrival time first.',
          steps: [`Arrival = ${y7aHM(dep)} + ${y7aDur(dur)} = ${y7aHM(arr)}`, `From ${y7aHM(arr)} to ${y7aHM(meet)} is ${B(early)} minutes`],
        };
      }
      if (t === 3) {
        const w = r.pick([250, 500, 750, 1500, 2000]), P = r.pick([1.2, 1.6, 2, 2.4, 2.8, 3.2]); const [it, c] = r.pick([['loaf of bread', 1.35], ['carton of milk', 1.15], ['bag of carrots', 0.65], ['box of eggs', 2.1]]);
        const fruit = r.pick(['apples', 'grapes', 'cherries', 'tomatoes']); const cost = rnd(w / 1000 * P + c, 2); const change = rnd(10 - cost, 2);
        return {
          html: `${fruit[0].toUpperCase() + fruit.slice(1)} cost ${B(money(P) + ' per kg')}. ${nm} buys ${B(w + ' g')} of ${fruit} and a ${it} costing ${B(money(c))}. ${he[0].toUpperCase() + he.slice(1)} pays with a ${B('£10')} note. How much change does ${he} get?`,
          ...nAns(change, { money: true }), format: 'Type the amount in pounds, e.g. 6.35', hint: 'Change grams into kilograms first.',
          steps: [`${w} g = ${ds(w / 1000)} kg`, `${fruit[0].toUpperCase() + fruit.slice(1)}: ${ds(w / 1000)} × ${money(P)} = ${money(w / 1000 * P)}`, `Total = ${money(w / 1000 * P)} + ${money(c)} = ${money(cost)}`, `Change = £10 − ${money(cost)} = ${B(money(change))}`],
        };
      }
      const lap = r.pick([400, 250, 200]), k = r.int(3, 10), d = r.int(3, 7); const km = lap * k * d / 1000;
      return {
        html: `A running track is ${B(lap + ' m')} long. ${nm} runs ${B(k + ' laps')} a day for ${B(d + ' days')}. How many kilometres does ${he} run altogether?`, ...nAns(km, { unit: 'km' }), unit: 'km', hint: 'Find the total in metres, then divide by 1000.',
        steps: [`Each day: ${k} × ${lap} = ${k * lap} m`, `${d} days: ${d} × ${k * lap} = ${ds(k * lap * d)} m`, `${ds(k * lap * d)} ÷ 1000 = ${B(ds(km) + ' km')}`],
      };
    }],
]);
SPEC['y7-measures'] = 'KS3 Ratio & Measures: metric units, time and timetables, money';

}

// ---- fragment y7geo.js ----
{
// ============================================================================
// YEAR 7 — geometry, statistics & probability (fragment y7geo)
// ============================================================================
const y7gList = (a) => (a.length < 2 ? a.join('') : a.slice(0, -1).join(', ') + ' and ' + a[a.length - 1]);
const y7gCap = (s) => s[0].toUpperCase() + s.slice(1);
const y7gAn = (w) => (/^[aeiou]/.test(w) ? 'an ' : 'a ') + w;
const y7gTxt = (word, extra = []) => ({ answer: word, check: { type: 'text', accept: [word, ...extra] }, answerHtml: B(word) });
// single angle drawn anticlockwise from a horizontal arm
function y7gAngleSvg(a, label) {
  const O = [180, 130], L = 120, rr = a > 180 ? 30 : 36;
  const pt = (t, r) => [O[0] + r * cosD(t), O[1] - r * sinD(t)];
  const P1 = pt(0, L), P2 = pt(a, L);
  let body = sL(O[0], O[1], P1[0], P1[1]) + sL(O[0], O[1], P2[0], P2[1]) + dot(O[0], O[1]);
  if (a === 90) body += rightMark(O, P1, P2, 16);
  else { const s = pt(0, rr), e = pt(a, rr); body += sP(`M${f1(s[0])},${f1(s[1])} A${rr},${rr} 0 ${a > 180 ? 1 : 0} 0 ${f1(e[0])},${f1(e[1])}`, { c: ACC, w: 2 }); }
  const lp = pt(a / 2, rr + 22); body += sT(lp[0], lp[1], label, { c: ACC, b: true });
  return svgWrap(360, 260, body);
}
function y7gShapeDraw(pts) { const P = fit(pts, 360, 220, 30); return svgWrap(360, 220, sPoly(P, { fill: ACC, fop: 0.12 }), false); }
const y7gReg = (n) => Array.from({ length: n }, (_, i) => [cosD(90 + (360 / n) * (i + 0.5)), sinD(90 + (360 / n) * (i + 0.5))]);

topic('y7-angles', 'geometry', 7, 1, 'FH', 'Angles & Properties of Shapes', 'Name types of angle, use simple angle facts and describe the properties of triangles and quadrilaterals.', [
  ['Types of angle',
    'An acute angle is less than 90°, a right angle is exactly 90°, an obtuse angle is between 90° and 180°, and a reflex angle is between 180° and 360°.',
    (r) => {
      const kind = r.pick(['acute', 'right', 'obtuse', 'reflex']);
      const a = kind === 'acute' ? r.int(2, 17) * 5 : kind === 'right' ? 90 : kind === 'obtuse' ? r.int(19, 35) * 5 : r.int(37, 70) * 5;
      const why = { acute: `${deg(a)} is less than 90°`, right: 'it is exactly 90°', obtuse: `${deg(a)} is between 90° and 180°`, reflex: `${deg(a)} is between 180° and 360°` }[kind];
      const lead = r.pick([`The angle shown measures ${deg(a)}.`, `An angle of ${deg(a)} is drawn below.`, `Priya measures an angle with a protractor and gets ${deg(a)}.`]);
      return { html: `${lead} Is it ${B('acute')}, ${B('right')}, ${B('obtuse')} or ${B('reflex')}?`, diagram: y7gAngleSvg(a, deg(a)), ...y7gTxt(kind, [`${kind} angle`, y7gAn(`${kind} angle`)]),
        format: 'Type a word: acute, right, obtuse or reflex', hint: 'Compare the angle with 90° and 180°.',
        steps: ['Acute: less than 90°. Right: exactly 90°. Obtuse: between 90° and 180°. Reflex: more than 180°.', `Here ${why}.`, `So the angle is ${B(kind)}.`] };
    }],
  ['Angles on a line, around a point & in a triangle',
    'Angles on a straight line add up to 180°. Angles around a point add up to 360°. The three angles in a triangle add up to 180°. Add the angles you know, then subtract from the total.',
    (r) => {
      const t = r.int(0, 2);
      if (t === 0) {
        const x = r.int(4, 26) * 5; const rest = 180 - x; let known = [rest];
        if (rest >= 60 && r.chance()) { const a = r.int(4, (rest - 20) / 5) * 5; known = [a, rest - a]; }
        const parts = r.shuffle([...known.map((d) => ({ deg: d, label: deg(d) })), { deg: x, label: 'x', hi: true }]);
        return { html: `The angles ${y7gList([...known.map(deg), B('<i>x</i>')])} lie on a straight line. Work out the size of angle <i>x</i>.`, diagram: anglesSvg(parts, false), answerLabel: 'x =', unit: '°', ...nAns(x, { unit: '°' }), hint: 'Angles on a straight line add up to 180°.',
          steps: ['Angles on a straight line add up to 180°.', known.length > 1 ? `${known.map(deg).join(' + ')} = ${deg(rest)}` : `The known angle is ${deg(rest)}.`, `x = 180° − ${deg(rest)} = ${B(deg(x))}`] };
      }
      if (t === 1) {
        let ks, x; do { x = r.int(8, 34) * 5; ks = [r.int(8, 30) * 5, r.int(8, 30) * 5]; ks.push(360 - x - ks[0] - ks[1]); } while (ks[2] < 40 || ks[2] > 170);
        const parts = r.shuffle([...ks.map((d) => ({ deg: d, label: deg(d) })), { deg: x, label: 'x', hi: true }]);
        return { html: `Four angles meet at a point: ${y7gList(ks.map(deg))} and ${B('<i>x</i>')}. Work out the size of angle <i>x</i>.`, diagram: anglesSvg(parts, true), answerLabel: 'x =', unit: '°', ...nAns(x, { unit: '°' }), hint: 'Angles around a point add up to 360°.',
          steps: ['Angles around a point add up to 360°.', `${ks.map(deg).join(' + ')} = ${deg(360 - x)}`, `x = 360° − ${deg(360 - x)} = ${B(deg(x))}`] };
      }
      let a, b; do { a = r.int(25, 105); b = r.int(25, 105); } while (a + b > 155);
      const x = 180 - a - b; const P = fit(triFromAngles(a, b), 360, 240, 44);
      return { html: `A triangle has angles of ${deg(a)}, ${deg(b)} and ${B('<i>x</i>')}. Work out the size of angle <i>x</i>.`, diagram: triSvg(P, { angles: [deg(a), deg(b), 'x'], hiA: 2 }), answerLabel: 'x =', unit: '°', ...nAns(x, { unit: '°' }), hint: 'Angles in a triangle add up to 180°.',
        steps: ['Angles in a triangle add up to 180°.', `${deg(a)} + ${deg(b)} = ${deg(a + b)}`, `x = 180° − ${deg(a + b)} = ${B(deg(x))}`] };
    }],
  ['Properties of triangles & quadrilaterals',
    'Learn the special shapes: equilateral (3 equal sides), isosceles (2 equal sides) and scalene (no equal sides) triangles; and squares, rectangles, rhombuses, parallelograms, kites and trapeziums. A line of symmetry folds a shape onto itself; the order of rotational symmetry counts how many times it fits onto itself in one full turn.',
    (r) => {
      const t = r.int(0, 3);
      const SH = [
        ['square', [[0, 0], [4, 0], [4, 4], [0, 4]], 4, 4], ['rectangle', [[0, 0], [6, 0], [6, 3.4], [0, 3.4]], 2, 2],
        ['equilateral triangle', [[0, 0], [4, 0], [2, 3.464]], 3, 3], ['isosceles triangle', [[0, 0], [4, 0], [2, 5]], 1, 1],
        ['scalene triangle', [[0, 0], [6, 0], [1.5, 3.5]], 0, 1], ['rhombus', [[0, 0], [3, 2], [0, 4], [-3, 2]], 2, 2],
        ['parallelogram', [[0, 0], [5, 0], [6.6, 3], [1.6, 3]], 0, 2], ['kite', [[0, 0], [2.2, 3.2], [0, 4.6], [-2.2, 3.2]], 1, 1],
        ['isosceles trapezium', [[0, 0], [6, 0], [4.5, 3], [1.5, 3]], 1, 1], ['regular pentagon', y7gReg(5), 5, 5],
        ['regular hexagon', y7gReg(6), 6, 6], ['regular octagon', y7gReg(8), 8, 8]];
      if (t < 2) {
        const [name, pts, lines, rot] = r.pick(SH); const v = t === 0 ? lines : rot;
        return { html: t === 0 ? `The diagram shows ${/^[aeiou]/.test(name) ? 'an' : 'a'} ${B(name)}. How many lines of symmetry does it have?` : `The diagram shows ${/^[aeiou]/.test(name) ? 'an' : 'a'} ${B(name)}. What is its order of rotational symmetry?`, diagram: y7gShapeDraw(pts), ...nAns(v),
          hint: t === 0 ? 'Imagine folding the shape so that one half lands exactly on the other.' : 'Count how many times the shape looks the same during one full turn.',
          steps: t === 0 ? [`Look for fold lines that map the ${name} exactly onto itself.`, v === 0 ? 'No fold line works, because no two halves match.' : `There ${v === 1 ? 'is' : 'are'} ${v} such line${v === 1 ? '' : 's'}.`, `Lines of symmetry: ${B(v)}`]
            : [`Turn the ${name} through one full turn (360°).`, rot === 1 ? 'It only looks the same at the start/end of the turn.' : `It looks the same ${rot} times, every ${deg(360 / rot)}.`, `Order of rotational symmetry: ${B(v)}`] };
      }
      if (t === 2) {
        const kind = r.pick(['isosceles', 'isosceles', 'scalene', 'scalene', 'equilateral']);
        let a, b, c;
        if (kind === 'equilateral') { a = 60; b = 60; c = 60; }
        else if (kind === 'isosceles') { let base; do { base = r.int(20, 80); } while (base === 60); [a, b] = r.shuffle([base, 180 - 2 * base]); c = 180 - a - b; }
        else { do { a = r.int(20, 110); b = r.int(20, 110); c = 180 - a - b; } while (c < 15 || a === b || b === c || a === c); }
        return mk(a, b);
        function mk(p, q) {
          const s = 180 - p - q; const set = new Set([p, q, s]); const k = set.size === 1 ? 'equilateral' : set.size === 2 ? 'isosceles' : 'scalene';
          const why = k === 'equilateral' ? 'all three angles are equal, so all three sides are equal' : k === 'isosceles' ? 'two angles are equal, so two sides are equal' : 'all three angles are different, so no sides are equal';
          const P = fit(triFromAngles(p, q), 360, 230, 44);
          return { html: `A triangle has two angles of ${deg(p)} and ${deg(q)}. Is the triangle ${B('equilateral')}, ${B('isosceles')} or ${B('scalene')}?`, diagram: triSvg(P, { angles: [deg(p), deg(q), ''], h: 230 }), ...y7gTxt(k, [`${k} triangle`]),
            format: 'Type a word: equilateral, isosceles or scalene', hint: 'Work out the third angle first, then look for equal angles.',
            steps: [`Third angle = 180° − ${deg(p)} − ${deg(q)} = ${deg(s)}`, `The angles are ${deg(p)}, ${deg(q)} and ${deg(s)}: ${why}.`, `The triangle is ${B(k)}.`] };
        }
      }
      const Q = [
        ['square', 'four equal sides and four right angles', []],
        ['rectangle', 'four right angles, with opposite sides equal but not all four sides equal', ['oblong']],
        ['rhombus', 'four equal sides, opposite sides parallel, but no right angles', []],
        ['parallelogram', 'two pairs of parallel sides, opposite sides equal, adjacent sides different lengths and no right angles', []],
        ['trapezium', 'exactly one pair of parallel sides', ['trapezoid']],
        ['kite', 'two pairs of equal adjacent sides and no parallel sides; its diagonals cross at right angles', []]];
      const [name, desc, extra] = r.pick(Q); const who = r.pick(['Leo', 'Mia', 'Sam', 'Aisha', 'Tom', 'Zara']);
      return { html: `${who} draws a quadrilateral with ${desc}. What is the special name of this quadrilateral?`, ...y7gTxt(name, [`a ${name}`, ...extra]),
        format: 'Type the name, e.g. square', hint: 'Check sides, angles and parallel sides one at a time.',
        steps: [`Properties given: ${desc}.`, `These are exactly the properties of a ${name}.`, `The shape is a ${B(name)}.`] };
    }],
  ['Exam-style problem',
    'Read the situation carefully and decide which angle fact you need: a right angle is 90°, a straight line is 180°, a full turn is 360°, and angles in a triangle add up to 180°. Write each step down.',
    (r) => {
      const t = r.int(0, 4);
      if (t === 0) {
        const a = r.int(55, 80); const w = 90 - a;
        return { html: `A ladder leans against a vertical wall. The ground is horizontal and meets the wall at a right angle. The ladder makes an angle of ${deg(a)} with the ground. Work out the angle between the ladder and the wall.`, unit: '°', ...nAns(w, { unit: '°' }), hint: 'The wall, ground and ladder make a triangle with a right angle.',
          steps: ['The wall, the ground and the ladder form a triangle containing a 90° angle.', `Angles in a triangle add up to 180°: 90° + ${deg(a)} = ${deg(90 + a)}`, `Angle with the wall = 180° − ${deg(90 + a)} = ${B(deg(w))}`] };
      }
      if (t === 1) {
        let k, s; do { k = r.int(3, 6); s = r.int(5, 12) * 5; } while (k * s > 300);
        const food = r.pick(['pizza', 'cake', 'pie', 'quiche']); const rest = 360 - k * s;
        return { html: `A round ${food} is cut from the centre into slices. ${k} slices each have an angle of ${deg(s)} at the centre and the rest of the ${food} is one big slice. What is the angle of the big slice?`, unit: '°', ...nAns(rest, { unit: '°' }), hint: 'Angles around the centre add up to 360°.',
          steps: ['Angles around a point add up to 360°.', `The ${k} equal slices: ${k} × ${deg(s)} = ${deg(k * s)}`, `Big slice = 360° − ${deg(k * s)} = ${B(deg(rest))}`] };
      }
      if (t === 2) {
        const h = r.int(1, 11); const gaps = Math.min(h, 12 - h); const ang = gaps * 30;
        return { html: `A clock shows exactly ${h} o’clock. Work out the ${h === 6 ? '' : 'smaller '}angle between the hour hand and the minute hand.`, unit: '°', ...nAns(ang, { unit: '°' }), hint: 'The 12 numbers split the full turn of 360° into 12 equal parts.',
          steps: ['A full turn is 360° and there are 12 hour marks.', 'Each gap between hour marks is 360° ÷ 12 = 30°.', `At ${h} o’clock the hands are ${gaps} gap${gaps === 1 ? '' : 's'} apart${h > 6 ? ' (going the shorter way)' : ''}.`, `Angle = ${gaps} × 30° = ${B(deg(ang))}`] };
      }
      if (t === 3) {
        let a, b; do { a = r.int(4, 30) * 5; b = r.int(4, 30) * 5; } while (a + b >= 340 || a + b === 180);
        const who = r.pick(['A robot', 'A toy car', 'A drone', 'A lighthouse beam']); const rest = 360 - a - b;
        return { html: `${who} starts facing north. It turns ${deg(a)} clockwise, then a further ${deg(b)} clockwise. How many more degrees must it turn clockwise to face north again?`, unit: '°', ...nAns(rest, { unit: '°' }), hint: 'Facing the same way again means one full turn of 360°.',
          steps: ['To face north again it must complete a full turn of 360°.', `So far it has turned ${deg(a)} + ${deg(b)} = ${deg(a + b)}`, `Still to turn: 360° − ${deg(a + b)} = ${B(deg(rest))}`] };
      }
      const a = r.int(20, 50); const top = 180 - 2 * a; const thing = r.pick(['roof frame', 'tent', 'shed roof', 'climbing frame']);
      return { html: `The end of a ${thing} is an isosceles triangle. Both sloping sides make an angle of ${deg(a)} with the horizontal base. Work out the angle at the top of the triangle.`, unit: '°', ...nAns(top, { unit: '°' }), hint: 'Both base angles are equal; angles in a triangle add up to 180°.',
        steps: [`The two base angles are both ${deg(a)}.`, `${deg(a)} + ${deg(a)} = ${deg(2 * a)}`, `Top angle = 180° − ${deg(2 * a)} = ${B(deg(top))}`] };
    }],
]);
SPEC['y7-angles'] = 'KS3 Geometry: angles & properties of shapes';

// ---------------------------------------------------------------- perimeter & area
function y7gGridShape(hs, cell = 24) { // skyline of columns with heights hs on a square grid
  const cols = hs.length + 2, rows = Math.max(...hs) + 2; const W = cols * cell, H = rows * cell;
  const ox = (360 - W) / 2, oy = 10; let body = '';
  for (let i = 0; i <= cols; i++) body += sL(ox + i * cell, oy, ox + i * cell, oy + H, { w: 1, op: 0.25 });
  for (let j = 0; j <= rows; j++) body += sL(ox, oy + j * cell, ox + W, oy + j * cell, { w: 1, op: 0.25 });
  const filled = (c, rr) => c >= 0 && c < hs.length && rr >= 0 && rr < hs[c];
  hs.forEach((h, c) => {
    for (let k = 0; k < h; k++) {
      const x = ox + (c + 1) * cell, y = oy + H - (k + 1) * cell - cell;
      body += `<rect x="${f1(x)}" y="${f1(y)}" width="${cell}" height="${cell}" fill="${ACC}" fill-opacity="0.25" stroke="none"/>`;
      if (!filled(c - 1, k)) body += sL(x, y, x, y + cell, { w: 2.5 });
      if (!filled(c + 1, k)) body += sL(x + cell, y, x + cell, y + cell, { w: 2.5 });
      if (!filled(c, k - 1)) body += sL(x, y + cell, x + cell, y + cell, { w: 2.5 });
      if (!filled(c, k + 1)) body += sL(x, y, x + cell, y, { w: 2.5 });
    }
  });
  return svgWrap(360, H + 20, body, false);
}
topic('y7-perimeter-area', 'geometry', 7, 2, 'FH', 'Perimeter & Area', 'Find perimeters of rectilinear shapes and areas of rectangles, triangles and compound shapes.', [
  ['Perimeter of rectilinear shapes',
    'Perimeter is the total distance around the outside of a shape. Work out any missing side lengths first (opposite sides of a rectilinear shape must balance), then add all the sides.',
    (r) => {
      let u = r.pick(['cm', 'm', 'mm']);
      if (r.chance(0.4)) {
        const sqr = r.chance(0.3); const l = r.int(3, 25), w = sqr ? l : r.int(2, Math.max(2, l - 1)); const p = 2 * (l + w);
        return { html: sqr ? `A square has sides of length ${l} ${u}. Work out its perimeter.` : `A rectangle is ${l} ${u} long and ${w} ${u} wide. Work out its perimeter.`, diagram: shapeSvg([[0, 0], [l, 0], [l, w], [0, w]], [`${l} ${u}`, `${w} ${u}`, '', '']), unit: u, ...nAns(p, { unit: u }), hint: 'Add up all four sides.',
          steps: sqr ? [`All four sides are ${l} ${u}.`, `Perimeter = 4 × ${l} = ${B(p)} ${u}`] : [`Perimeter = ${l} + ${w} + ${l} + ${w}`, `= ${B(p)} ${u}`] };
      }
      const W = r.int(8, 20), H = r.int(6, 16), a = r.int(2, W - 3), c = r.int(2, H - 3);
      const pts = [[0, H], [a, H], [a, H - c], [W, H - c], [W, 0], [0, 0]];
      const p = 2 * (W + H); let what; [what, u] = r.pick([['a garden', 'm'], ['a patio', 'm'], ['a classroom', 'm'], ['a stage', 'm'], ['a playground', 'm'], ['a metal bracket', 'cm'], ['a card template', 'cm'], ['a sticker', 'cm']]);
      return { html: `The diagram shows the plan of ${what}. All corners are right angles and lengths are in ${u}. Work out the perimeter.`, diagram: shapeSvg(pts, [`${a}`, `${c}`, '', `${H - c}`, `${W}`, '']), unit: u, ...nAns(p, { unit: u }), hint: 'Find the two missing sides first.',
        steps: [`Missing horizontal side = ${W} − ${a} = ${W - a} ${u}`, `Missing vertical side = ${c} + ${H - c} = ${H} ${u}`, `Perimeter = ${a} + ${c} + ${W - a} + ${H - c} + ${W} + ${H}`, `= ${B(p)} ${u}`] };
    }],
  ['Area of rectangles & missing sides',
    'Area of a rectangle = length × width, measured in square units (cm², m²). If you know the area and one side, divide the area by that side to find the other.',
    (r) => {
      const t = r.int(0, 2); const u = r.pick(['cm', 'm']);
      if (t === 0) {
        const l = r.int(3, 20), w = r.int(2, 15);
        return { html: `A rectangle measures ${l} ${u} by ${w} ${u}. Work out its area.`, diagram: shapeSvg([[0, 0], [l, 0], [l, w], [0, w]], [`${l} ${u}`, `${w} ${u}`, '', '']), unit: u + '²', ...nAns(l * w, { unit: u + '²' }), hint: 'Area = length × width.',
          steps: ['Area = length × width', `= ${l} × ${w}`, `= ${B(l * w)} ${u}²`] };
      }
      if (t === 1) {
        const l = r.int(3, 15), w = r.int(2, 12); const A = l * w;
        return { html: `A rectangle has an area of ${A} ${u}². Its length is ${l} ${u}. Work out its width.`, diagram: shapeSvg([[0, 0], [l, 0], [l, w], [0, w]], [`${l} ${u}`, '?', '', '']), unit: u, ...nAns(w, { unit: u }), hint: 'Width = area ÷ length.',
          steps: ['Area = length × width, so width = area ÷ length.', `Width = ${A} ÷ ${l}`, `= ${B(w)} ${u}`] };
      }
      const s = r.int(2, 15);
      return { html: `A square has a perimeter of ${4 * s} ${u}. Work out its area.`, diagram: shapeSvg([[0, 0], [s, 0], [s, s], [0, s]], ['', '', '', '']), unit: u + '²', ...nAns(s * s, { unit: u + '²' }), hint: 'Find the length of one side first.',
        steps: [`A square has 4 equal sides, so one side = ${4 * s} ÷ 4 = ${s} ${u}`, `Area = ${s} × ${s}`, `= ${B(s * s)} ${u}²`] };
    }],
  ['Area of triangles',
    'Area of a triangle = ½ × base × perpendicular height (the height measured at right angles to the base). It is half of the rectangle that surrounds it.',
    (r) => {
      const t = r.int(0, 2); const u = r.pick(['cm', 'm', 'mm']);
      if (t === 0) {
        const b = r.int(3, 18), h = r.int(3, 14); const v = b * h / 2;
        return { html: `A right-angled triangle has a base of ${b} ${u} and a perpendicular height of ${h} ${u}. Work out its area.`, diagram: shapeSvg([[0, 0], [b, 0], [0, h]], [`${b} ${u}`, '', `${h} ${u}`]), unit: u + '²', ...nAns(v, { unit: u + '²' }), hint: 'Area = ½ × base × height.',
          steps: ['Area = ½ × base × height', `= ½ × ${b} × ${h}`, `= ${b * h} ÷ 2 = ${B(ds(v))} ${u}²`] };
      }
      if (t === 1) {
        const b = r.int(4, 20), h = r.int(3, 15), off = r.int(1, b - 1); const v = b * h / 2;
        return { html: `A triangle has a base of ${b} ${u} and a perpendicular height of ${h} ${u}. Work out its area.`, diagram: shapeSvg([[0, 0], [b, 0], [off, h]], [`${b} ${u}`, '', ''], { height: [[off, h], [off, 0], `${h} ${u}`] }), unit: u + '²', ...nAns(v, { unit: u + '²' }), hint: 'Area = ½ × base × height.',
          steps: ['Area = ½ × base × height', `= ½ × ${b} × ${h}`, `= ${b * h} ÷ 2 = ${B(ds(v))} ${u}²`] };
      }
      const b = r.int(2, 12) * 2, h = r.int(3, 15); const A = b * h / 2; const off = r.int(1, b - 1);
      return { html: `A triangle has an area of ${A} ${u}² and a base of ${b} ${u}. Work out its perpendicular height.`, diagram: shapeSvg([[0, 0], [b, 0], [off, h]], [`${b} ${u}`, '', ''], { height: [[off, h], [off, 0], 'h'] }), answerLabel: 'h =', unit: u, ...nAns(h, { unit: u }), hint: 'Double the area, then divide by the base.',
        steps: ['Area = ½ × base × height, so base × height = 2 × area.', `${b} × h = 2 × ${A} = ${2 * A}`, `h = ${2 * A} ÷ ${b} = ${B(h)} ${u}`] };
    }],
  ['Counting squares & compound shapes',
    'On a centimetre grid, each square has an area of 1 cm², so count the squares for the area and count the unit edges around the outside for the perimeter. For a compound shape, split it into rectangles and add their areas.',
    (r) => {
      if (r.chance(0.55)) {
        const k = r.int(3, 6); const hs = Array.from({ length: k }, () => r.int(1, 5)); if (Math.max(...hs) < 2) hs[0] = 3;
        const area = sum(hs); let per = 2 * k + hs[0] + hs[k - 1]; for (let i = 0; i + 1 < k; i++) per += Math.abs(hs[i] - hs[i + 1]);
        const isA = r.chance(); const who = r.pick(['Ella', 'Josh', 'Noah', 'Ruby', 'Omar', 'Grace', 'Isla', 'Kai', 'Lily', 'Ben', 'Hana', 'Max']);
        return { html: `${who} shades a shape on a centimetre square grid. Work out the ${isA ? 'area' : 'perimeter'} of the shape.`, diagram: y7gGridShape(hs), unit: isA ? 'cm²' : 'cm', ...nAns(isA ? area : per, { unit: isA ? 'cm²' : 'cm' }),
          hint: isA ? 'Each whole square is 1 cm².' : 'Count every 1 cm edge on the outline.',
          steps: isA ? [`Count the shaded squares column by column: ${hs.join(' + ')}`, `Area = ${B(area)} cm²`]
            : ['Go around the outline counting 1 cm edges.', `Bottom and top edges: ${k} + ${k} = ${2 * k}; side edges: ${per - 2 * k}`, `Perimeter = ${B(per)} cm`] };
      }
      const u = r.pick(['cm', 'm']); const W = r.int(8, 20), H = r.int(6, 16), a = r.int(2, W - 3), c = r.int(2, H - 3);
      const pts = [[0, H], [a, H], [a, H - c], [W, H - c], [W, 0], [0, 0]]; const area = a * c + W * (H - c);
      return { html: `The L-shape is ${W} ${u} wide and ${H} ${u} tall. All corners are right angles. Work out its area.`, diagram: shapeSvg(pts, [`${a} ${u}`, `${c} ${u}`, '', '', `${W} ${u}`, `${H} ${u}`], { fill: true }), unit: u + '²', ...nAns(area, { unit: u + '²' }), hint: 'Split the shape into two rectangles.',
        steps: [`Split into a top rectangle ${a} × ${c} and a bottom rectangle ${W} × ${H - c} (since ${H} − ${c} = ${H - c}).`, `Top: ${a} × ${c} = ${a * c} ${u}²; bottom: ${W} × ${H - c} = ${W * (H - c)} ${u}²`, `Total area = ${a * c} + ${W * (H - c)} = ${B(area)} ${u}²`] };
    }],
  ['Exam-style problem',
    'Decide first whether the problem needs perimeter (distance around: fences, borders, ribbon) or area (surface covered: carpet, paint, tiles, seed). Then use the result in the next step, rounding up when you must buy whole items.',
    (r) => {
      const t = r.int(0, 4);
      if (t === 0) {
        const pl = r.pick([2, 2.5, 3]); const nl = r.int(3, 8), nw = r.int(2, 6); const L = pl * nl, Wd = pl * nw; const P = 2 * (L + Wd); const n = P / pl; const c = r.pick([18, 22, 25, 30, 35, 40]);
        return { html: `A rectangular garden is ${ds(L)} m long and ${ds(Wd)} m wide. Fence panels are ${ds(pl)} m long and cost ${money(c)} each. How much does it cost to put fence panels all the way around the garden?`, ...nAns(n * c, { money: true }), hint: 'Find the perimeter, then the number of panels.',
          steps: [`Perimeter = 2 × (${ds(L)} + ${ds(Wd)}) = ${ds(P)} m`, `Panels needed = ${ds(P)} ÷ ${ds(pl)} = ${n}`, `Cost = ${n} × ${money(c)} = ${B(money(n * c))}`] };
      }
      if (t === 1) {
        const l = r.int(3, 7), w = r.int(2, 6); const A = l * w; const pr = r.pick([8, 12, 15, 18, 24]); const fit_ = r.pick([40, 50, 60, 80]);
        return { html: `A bedroom floor is a rectangle ${l} m by ${w} m. Carpet costs ${money(pr)} per m² and there is a fitting charge of ${money(fit_)}. Work out the total cost of carpeting the floor.`, ...nAns(A * pr + fit_, { money: true }), hint: 'Area first, then cost.',
          steps: [`Area = ${l} × ${w} = ${A} m²`, `Carpet = ${A} × ${money(pr)} = ${money(A * pr)}`, `Total = ${money(A * pr)} + ${money(fit_)} = ${B(money(A * pr + fit_))}`] };
      }
      if (t === 2) {
        const L = r.int(4, 9), Hh = r.pick([2, 3]); const dw = 1, dh = 2; const A = L * Hh - (Hh === 3 ? dw * dh : 0); const cover = r.pick([5, 6, 8, 10]); const tins = Math.ceil(A / cover);
        if (Hh === 3) {
          return { html: `A wall is ${L} m long and 3 m high. It has a door 1 m wide and 2 m high, which will not be painted. One tin of paint covers ${cover} m². How many tins must be bought to paint the wall?`, ...nAns(tins), hint: 'Subtract the door area, then divide and round up.',
            steps: [`Wall area = ${L} × 3 = ${3 * L} m²`, `Area to paint = ${3 * L} − 1 × 2 = ${A} m²`, `Tins = ${A} ÷ ${cover} = ${ds(rnd(A / cover, 2))}${A % cover ? '…, round up' : ''}`, `${B(tins)} tins`] };
        }
        return { html: `A garden wall is ${L} m long and 2 m high. Both sides of the wall will be painted. One tin of paint covers ${cover} m². How many tins must be bought?`, ...nAns(Math.ceil(2 * A / cover)), hint: 'There are two sides to paint.',
          steps: [`One side = ${L} × 2 = ${A} m²`, `Both sides = 2 × ${A} = ${2 * A} m²`, `Tins = ${2 * A} ÷ ${cover} = ${ds(rnd(2 * A / cover, 2))}${(2 * A) % cover ? '…, round up' : ''}`, `${B(Math.ceil(2 * A / cover))} tins`] };
      }
      if (t === 3) {
        const l = r.int(2, 6), w = r.int(2, 5); const tiles = (2 * l) * (2 * w); const box = r.pick([8, 10, 12]); const boxes = Math.ceil(tiles / box);
        return { html: `A kitchen floor is a rectangle ${l} m by ${w} m. It is covered with square tiles of side 50 cm. Tiles come in boxes of ${box}. How many boxes are needed?`, ...nAns(boxes), hint: 'How many 50 cm tiles fit along 1 m?',
          steps: [`Two 50 cm tiles fit in each metre, so ${2 * l} tiles along the length and ${2 * w} along the width.`, `Tiles = ${2 * l} × ${2 * w} = ${tiles}`, `Boxes = ${tiles} ÷ ${box} = ${ds(rnd(tiles / box, 2))}${tiles % box ? '…, round up' : ''}`, `${B(boxes)} boxes`] };
      }
      const b = r.int(3, 9) * 2, h = r.int(4, 12); const A = b * h / 2; const g = r.pick([20, 25, 30, 40, 50]); const total = A * g;
      return { html: `A triangular flower bed has a base of ${b} m and a perpendicular height of ${h} m. Mulch is spread at ${g} litres per m². How many litres of mulch are needed?`, unit: 'litres', ...nAns(total, { unit: 'litres' }), hint: 'Area of a triangle = ½ × base × height.',
        steps: [`Area = ½ × ${b} × ${h} = ${A} m²`, `Mulch = ${A} × ${g}`, `= ${B(total)} litres`] };
    }],
]);
SPEC['y7-perimeter-area'] = 'KS3 Geometry: perimeter & area of 2D shapes';

// ---------------------------------------------------------------- charts
const Y7G_CATS = [ // [chart description, who, labels, what they were asked about]
  ['the favourite fruit of some students', 'students', ['Apple', 'Banana', 'Pear', 'Grape', 'Mango'], 'their favourite fruit'],
  ['the favourite pets of some students', 'students', ['Cat', 'Dog', 'Fish', 'Rabbit', 'Bird'], 'their favourite pet'],
  ['how some students travel to school', 'students', ['Walk', 'Car', 'Bus', 'Bike', 'Train'], 'how they travel to school'],
  ['the favourite sports of some students', 'students', ['Football', 'Tennis', 'Netball', 'Rugby', 'Hockey'], 'their favourite sport'],
  ['the favourite colours of some people', 'people', ['Red', 'Blue', 'Green', 'Pink', 'Purple'], 'their favourite colour'],
  ['the ice-cream flavours chosen by some customers', 'customers', ['Vanilla', 'Mint', 'Lemon', 'Toffee', 'Mango'], 'their favourite ice-cream flavour'],
];
function y7gBarVals(r, n) {
  const m = r.int(0, 2);
  let v; do { v = Array.from({ length: n }, () => (m === 0 ? r.int(1, 12) : m === 1 ? r.int(1, 6) * 5 : r.int(1, 9) * 10)); } while (new Set(v).size < n || (m === 1 && Math.max(...v) < 15) || (m === 2 && Math.max(...v) < 40));
  return v;
}
function y7gPictoSvg(labels, halves, k, sym) {
  const rowH = 34, y0 = 22, x0 = 112, gap = 30, rad = 11; let body = '';
  const icon = (cx, cy, half) => (half ? `<path d="M${f1(cx)},${f1(cy - rad)} A${rad},${rad} 0 0 0 ${f1(cx)},${f1(cy + rad)} Z" fill="${ACC}" fill-opacity="0.55" stroke="${ACC}" stroke-width="1.5"/>`
    : `<circle cx="${f1(cx)}" cy="${f1(cy)}" r="${rad}" fill="${ACC}" fill-opacity="0.55" stroke="${ACC}" stroke-width="1.5"/>`);
  labels.forEach((lab, i) => {
    const y = y0 + i * rowH; body += sT(10, y, lab, { a: 'start', fs: 13 }) + sL(100, y - rowH / 2, 100, y + rowH / 2, { w: 1, op: 0.4 });
    const full = Math.floor(halves[i] / 2); for (let j = 0; j < full; j++) body += icon(x0 + j * gap, y, false);
    if (halves[i] % 2) body += icon(x0 + full * gap, y, true);
  });
  const ky = y0 + labels.length * rowH + 8; body += sL(6, ky - 14, 354, ky - 14, { w: 1, op: 0.4 }) + sT(10, ky + 4, 'Key:', { a: 'start', fs: 13, b: true }) + icon(66, ky + 4, false) + sT(84, ky + 4, `= ${k} ${sym}`, { a: 'start', fs: 13 });
  return svgWrap(360, ky + 24, body, false);
}
const y7gTally = (n) => { const g = Math.floor(n / 5), rm = n % 5; return [...Array(g).fill('<span style="text-decoration:line-through">||||</span>'), ...(rm ? ['|'.repeat(rm)] : [])].join(' '); };

topic('y7-charts', 'statistics', 7, 3, 'FH', 'Data & Charts', 'Read and interpret bar charts, pictograms, tally charts and frequency tables.', [
  ['Reading bar charts',
    'Read the height of each bar against the scale on the vertical axis. Check what each gridline is worth before you read a value. Then add or subtract the values the question asks for.',
    (r) => {
      const [topicName, who, labs, asked] = r.pick(Y7G_CATS); const n = r.int(4, 5); const L = labs.slice(0, n); const v = y7gBarVals(r, n);
      const t = r.int(0, 2); let i, j; do { [i, j] = r.sample([...Array(n).keys()], 2); } while (t === 1 && v[i] === v[j]);
      const hi = v[i] >= v[j] ? i : j, lo = hi === i ? j : i;
      const html = t === 0 ? `The bar chart shows ${topicName}. How many ${who} chose ${B(L[i])}?`
        : t === 1 ? `The bar chart shows ${topicName}. How many more ${who} chose ${B(L[hi])} than ${B(L[lo])}?`
          : `The bar chart shows ${topicName}. How many ${who} are shown in the bar chart altogether?`;
      const ans = t === 0 ? v[i] : t === 1 ? v[hi] - v[lo] : sum(v);
      return { html, diagram: barSvg(L, v, { yl: 'Frequency' }), ...nAns(ans), hint: 'Read each bar carefully against the scale.',
        steps: t === 0 ? [`Find the ${L[i]} bar and read across to the vertical axis.`, `${L[i]}: ${B(v[i])}`]
          : t === 1 ? [`${L[hi]}: ${v[hi]}, ${L[lo]}: ${v[lo]}`, `Difference = ${v[hi]} − ${v[lo]} = ${B(v[hi] - v[lo])}`]
            : [`Read every bar: ${L.map((l, k) => `${l} ${v[k]}`).join(', ')}`, `Total = ${v.join(' + ')} = ${B(ans)}`] };
    }],
  ['Pictograms',
    'A pictogram uses symbols to show frequencies. Read the key to find what one symbol is worth; half a symbol is worth half of that. Multiply the number of symbols by the key value.',
    (r) => {
      const k = r.pick([2, 4, 6, 8, 10, 20]); const ctx = r.pick([
        ['books borrowed from a library', 'books', ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'], 'on'],
        ['cars washed at a car wash', 'cars', ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'], 'on'],
        ['pizzas sold by a café', 'pizzas', ['Week 1', 'Week 2', 'Week 3', 'Week 4'], 'in'],
        ['tickets sold for a school show to each year group', 'tickets', ['Year 7', 'Year 8', 'Year 9', 'Year 10'], 'for'],
        ['visitors to a museum', 'visitors', ['Mon', 'Tue', 'Wed', 'Thu'], 'on']]);
      const L = ctx[2]; const n = L.length; let hv; do { hv = L.map(() => r.int(1, 12)); } while (!hv.some((h) => h % 2) || new Set(hv).size < 3);
      const v = hv.map((h) => (h * k) / 2); const t = r.int(0, 2); let i, j; do { [i, j] = r.sample([...Array(n).keys()], 2); } while (v[i] === v[j]); const hi = v[i] >= v[j] ? i : j, lo = hi === i ? j : i;
      const symDesc = (h) => (h === 1 ? '½ a symbol' : `${Math.floor(h / 2)}${h % 2 ? '½' : ''} symbol${h === 2 ? '' : 's'}`);
      const html = t === 0 ? `The pictogram shows the number of ${ctx[0]}. One symbol represents ${k} ${ctx[1]}. How many ${ctx[1]} were there ${ctx[3]} ${B(L[i])}?`
        : t === 1 ? `The pictogram shows the number of ${ctx[0]}. One symbol represents ${k} ${ctx[1]}. How many more ${ctx[1]} were there ${ctx[3]} ${B(L[hi])} than ${ctx[3]} ${B(L[lo])}?`
          : `The pictogram shows the number of ${ctx[0]}. One symbol represents ${k} ${ctx[1]}. How many ${ctx[1]} were there altogether?`;
      const ans = t === 0 ? v[i] : t === 1 ? v[hi] - v[lo] : sum(v);
      return { html, diagram: y7gPictoSvg(L, hv, k, ctx[1]), ...nAns(ans), hint: `One symbol = ${k}, so half a symbol = ${k / 2}.`,
        steps: t === 0 ? [`${L[i]} has ${symDesc(hv[i])}.`, `${ds(hv[i] / 2)} × ${k} = ${B(v[i])}`]
          : t === 1 ? [`${L[hi]}: ${symDesc(hv[hi])} = ${v[hi]}; ${L[lo]}: ${symDesc(hv[lo])} = ${v[lo]}`, `Difference = ${v[hi]} − ${v[lo]} = ${B(ans)}`]
            : [`Values: ${L.map((l, m) => `${l} ${v[m]}`).join(', ')}`, `Total = ${v.join(' + ')} = ${B(ans)}`] };
    }],
  ['Tally charts & frequency tables',
    'In a tally chart each | is one item and a crossed group of four bars stands for 5. Count in fives, then add the singles. The total frequency is the sum of all the frequencies.',
    (r) => {
      const [topicName, who, labs, asked] = r.pick(Y7G_CATS); const n = 4; const L = labs.slice(0, n); const f = L.map(() => r.int(2, 18)); const T = sum(f);
      const t = r.int(0, 2); const i = r.int(0, n - 1);
      if (t === 2) {
        const rows = [['Category', 'Tally', 'Frequency'], ...L.map((l, k) => [l, k === i ? '' : y7gTally(f[k]), k === i ? '?' : String(f[k])])];
        return { html: `Some ${who} were asked ${asked.startsWith('how') ? asked : 'about ' + asked}. A total of ${T} ${who} were asked.${table(rows)}Work out the missing frequency for ${B(L[i])}.`, ...nAns(f[i]), hint: 'Subtract the known frequencies from the total.',
          steps: [`Known frequencies: ${f.filter((_, k) => k !== i).join(' + ')} = ${T - f[i]}`, `Missing = ${T} − ${T - f[i]} = ${B(f[i])}`] };
      }
      const rows = [['Category', 'Tally'], ...L.map((l, k) => [l, y7gTally(f[k])])];
      if (t === 0) {
        return { html: `The tally chart shows ${topicName}.${table(rows)}What is the frequency for ${B(L[i])}?`, ...nAns(f[i]), hint: 'Each crossed group is 5.',
          steps: [`${L[i]} has ${Math.floor(f[i] / 5)} group${Math.floor(f[i] / 5) === 1 ? '' : 's'} of five and ${f[i] % 5} single bar${f[i] % 5 === 1 ? '' : 's'}.`, `${Math.floor(f[i] / 5)} × 5 + ${f[i] % 5} = ${B(f[i])}`] };
      }
      return { html: `The tally chart shows ${topicName}.${table(rows)}How many ${who} were asked altogether?`, ...nAns(T), hint: 'Turn each tally into a number, then add.',
        steps: [`Frequencies: ${L.map((l, k) => `${l} ${f[k]}`).join(', ')}`, `Total = ${f.join(' + ')} = ${B(T)}`] };
    }],
  ['Exam-style problem',
    'Read the values you need from the chart or table first and write them down. Then use them in a second calculation, such as multiplying by a price, comparing with a target or writing a fraction or percentage of the total.',
    (r) => {
      const t = r.int(0, 4);
      if (t === 0) {
        const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri']; const v = days.map(() => r.int(1, 12) * 2); const p = r.pick([0.8, 1.2, 1.5, 0.75, 1.25, 2]); const item = r.pick(['cupcakes', 'flapjacks', 'cookies', 'muffins']); const T = sum(v);
        return { html: `A school bake sale sells ${item} for ${money(p)} each. The bar chart shows how many ${item} were sold each day. How much money was taken altogether?`, diagram: barSvg(days, v, { yl: `${y7gCap(item)} sold` }), ...nAns(T * p, { money: true }), hint: 'Find the total number sold, then multiply by the price.',
          steps: [`Number sold: ${v.join(' + ')} = ${T}`, `Money = ${T} × ${money(p)}`, `= ${B(money(T * p))}`] };
      }
      if (t === 1) {
        const k = r.pick([4, 6, 10]); const L = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri']; const hv = L.map(() => r.int(2, 10)); const v = hv.map((h) => (h * k) / 2); const T = sum(v); const target = Math.ceil((T + r.int(5, 40)) / 10) * 10;
        return { html: `The pictogram shows the number of books borrowed from a library one week. One symbol represents ${k} books. The library’s target was ${target} books for the week. How many more books needed to be borrowed to reach the target?`, diagram: y7gPictoSvg(L, hv, k, 'books'), ...nAns(target - T), hint: 'Find the total first.',
          steps: [`Values: ${L.map((l, m) => `${l} ${v[m]}`).join(', ')}`, `Total = ${v.join(' + ')} = ${T}`, `More needed = ${target} − ${T} = ${B(target - T)}`] };
      }
      if (t === 2) {
        const ad = r.int(15, 60), ch = r.int(20, 80), co = r.int(5, 25); const pa = r.pick([6, 8, 10, 12]), pc = r.pick([3, 4, 5]), pco = r.pick([4.5, 5.5, 6.5]); const show = r.pick(['school play', 'pantomime', 'talent show', 'concert']);
        const tot = ad * pa + ch * pc + co * pco;
        return { html: `The frequency table shows the tickets sold for a ${show}.${table([['Ticket', 'Price', 'Frequency'], ['Adult', money(pa), ad], ['Child', money(pc), ch], ['Concession', money(pco), co]])}Work out the total money taken from ticket sales.`, ...nAns(tot, { money: true }), hint: 'Multiply each frequency by its price, then add.',
          steps: [`Adult: ${ad} × ${money(pa)} = ${money(ad * pa)}`, `Child: ${ch} × ${money(pc)} = ${money(ch * pc)}`, `Concession: ${co} × ${money(pco)} = ${money(co * pco)}`, `Total = ${B(money(tot))}`] };
      }
      if (t === 3) {
        const [topicName, who, labs] = r.pick(Y7G_CATS.slice(0, 4)); const L = labs.slice(0, 4); let v; do { v = L.map(() => r.int(1, 12)); } while (new Set(v).size < 3);
        const i = r.int(0, 3); const T = sum(v);
        return { html: `The bar chart shows ${topicName}. What fraction of the ${who} chose ${B(L[i])}? Give your answer in its simplest form.`, diagram: barSvg(L, v, { yl: 'Frequency' }), ...fAns(v[i], T), hint: 'Fraction = number who chose it ÷ total.',
          steps: [`Total = ${v.join(' + ')} = ${T}`, `${L[i]}: ${v[i]}`, `Fraction = ${frS(v[i], T)}`] };
      }
      const N = r.pick([20, 25, 50]); let f; do { f = [r.int(3, N / 2), r.int(2, N / 4), r.int(1, N / 5)]; f.push(N - sum(f)); } while (f[3] < 1);
      f.sort((x, y) => y - x); const L = ['Car', 'Van', 'Lorry', 'Bus']; const i = r.int(0, 3); const pct = (f[i] / N) * 100; const place = r.pick(['outside a school', 'on a main road', 'at a junction', 'a farm']);
      return { html: `Kim records the vehicles passing ${place} in a tally chart.${table([['Vehicle', 'Tally'], ...L.map((l, k) => [l, y7gTally(f[k])])])}What percentage of the vehicles were ${B(L[i].toLowerCase() + (L[i] === 'Bus' ? 'es' : 's'))}?`, unit: '%', ...nAns(pct, { unit: '%' }), hint: 'Find the total, write a fraction, then convert to a percentage.',
        steps: [`Frequencies: ${L.map((l, k) => `${l} ${f[k]}`).join(', ')}; total = ${N}`, `Fraction = ${frac(f[i], N)}`, `Percentage = ${f[i]} ÷ ${N} × 100 = ${B(ds(pct))}%`] };
    }],
]);
SPEC['y7-charts'] = 'KS3 Statistics: bar charts, pictograms, tally charts & frequency tables';

// ---------------------------------------------------------------- probability
function y7gSpinner(labels) {
  const c = [180, 118], R0 = 92, n = labels.length; let body = sC(c[0], c[1], R0);
  for (let i = 0; i < n; i++) { const a = 90 - (360 / n) * i; body += sL(c[0], c[1], c[0] + R0 * cosD(a), c[1] - R0 * sinD(a), { w: 1.5 }); const m = a - 180 / n; body += sT(c[0] + 60 * cosD(m), c[1] - 60 * sinD(m), labels[i], { b: true, fs: 15 }); }
  body += sP(`M${c[0]},${c[1]} L${c[0] + 34},${c[1] - 34}`, { c: ACC, w: 3 }) + dot(c[0], c[1], ACC);
  return svgWrap(360, 236, body, false);
}
const Y7G_WORDS = { impossible: ['impossible'], unlikely: ['unlikely'], 'even chance': ['even chance', 'evens', 'even', '50-50', '50/50', 'fifty-fifty', 'equal chance', 'equally likely'], likely: ['likely'], certain: ['certain', 'definite'] };
const Y7G_COLS = ['red', 'blue', 'green', 'yellow', 'white', 'black'];

topic('y7-probability', 'probability', 7, 3, 'FH', 'Probability Language & Scale', 'Describe likelihood with words, place events on the 0 to 1 scale and find simple probabilities as fractions.', [
  ['Probability words',
    'Probability goes from 0 (impossible) to 1 (certain). Less than ½ is unlikely, exactly ½ is an even chance, and more than ½ is likely. Work out the probability first, then choose the word.',
    (r) => {
      const word = r.pick(['impossible', 'unlikely', 'even chance', 'likely', 'certain']); const src = r.int(0, 1);
      let html, num, den, why;
      if (src === 0) {
        const DICE = { impossible: [['a 7', 0], ['a 0', 0], ['a number greater than 6', 0]], certain: [['a number less than 7', 6], ['a whole number from 1 to 6', 6]],
          'even chance': [['an even number', 3], ['an odd number', 3], ['a number greater than 3', 3], ['a number less than 4', 3]],
          unlikely: [['a 6', 1], ['a number greater than 4', 2], ['a 1', 1], ['a multiple of 3', 2]], likely: [['a number less than 5', 4], ['a number greater than 1', 4], ['a number that is not 6', 5], ['a number greater than 2', 4]] };
        const [ev, k] = r.pick(DICE[word]); html = `A fair six-sided dice is rolled once. Which word describes the chance of rolling ${B(ev)}?`; num = k; den = 6; why = `${k} of the 6 outcomes give ${ev}`;
      } else {
        const [c1, c2, c3] = r.sample(Y7G_COLS, 3); const thing = r.pick(['counters', 'marbles', 'beads', 'balls']);
        let a, b, target, bagDesc;
        if (word === 'certain') { a = r.int(3, 12); bagDesc = `${a} ${c1} ${thing} and nothing else`; target = c1; num = a; den = a; }
        else if (word === 'impossible') { a = r.int(2, 10); b = r.int(2, 10); bagDesc = `${a} ${c1} and ${b} ${c2} ${thing}`; target = c3; num = 0; den = a + b; }
        else {
          a = r.int(2, 9); b = word === 'even chance' ? a : word === 'unlikely' ? r.int(1, a - 1 || 1) : r.int(a + 1, a + 8);
          if (word === 'unlikely' && b >= a) { a += 2; b = 1; }
          bagDesc = `${a} ${c1} and ${b} ${c2} ${thing}`; target = c2; num = b; den = a + b;
        }
        html = `A bag contains ${bagDesc}. One is taken out at random. Which word describes the chance that it is ${B(target)}?`;
        why = `${num} of the ${den} ${thing} ${num === 1 ? 'is' : 'are'} ${target}`;
      }
      const pTxt = num === 0 ? '0' : num === den ? '1' : fracS(num, den);
      return { html, answer: word, check: { type: 'text', accept: Y7G_WORDS[word] }, answerHtml: B(word), format: 'Type: impossible, unlikely, even chance, likely or certain', hint: 'Compare the probability with 0, ½ and 1.',
        steps: [`${y7gCap(why)}, so the probability is ${frac(num, den)}${num === 0 || num === den || gcd(num, den) > 1 ? ` = ${pTxt}` : ''}.`, word === 'impossible' ? 'A probability of 0 means it cannot happen.' : word === 'certain' ? 'A probability of 1 means it must happen.' : word === 'even chance' ? 'This is exactly ½.' : word === 'unlikely' ? 'This is less than ½ but more than 0.' : 'This is more than ½ but less than 1.', `The word is ${B(word)}.`] };
    }],
  ['Probability as a fraction',
    'When all outcomes are equally likely, P(event) = number of outcomes that give the event ÷ total number of outcomes. Write it as a fraction and simplify.',
    (r) => {
      const t = r.int(0, 2);
      if (t === 0) {
        const n = r.pick([5, 6, 8, 10]); const letters = ['R', 'B', 'G', 'Y']; const use = letters.slice(0, r.int(2, 3)); let labs; do { labs = Array.from({ length: n }, () => r.pick(use)); } while (use.some((u) => !labs.includes(u)));
        const L = r.pick(use); const k = labs.filter((x) => x === L).length; const name = { R: 'red', B: 'blue', G: 'green', Y: 'yellow' }[L];
        return { html: `A fair spinner has ${n} equal sections. ${use.map((u) => `${u} = ${({ R: 'red', B: 'blue', G: 'green', Y: 'yellow' })[u]}`).join(', ')}. Find the probability that it lands on ${B(name)}. Give your answer as a fraction in its simplest form.`, diagram: y7gSpinner(labs), ...fAns(k, n), hint: `Count the ${L} sections.`,
          steps: [`There are ${n} equal sections and ${k} of them ${k === 1 ? 'is' : 'are'} ${name}.`, `P(${name}) = ${frS(k, n)}`] };
      }
      if (t === 1) {
        const cols = r.sample(Y7G_COLS, 3); const ns = cols.map(() => r.int(1, 9)); const T = sum(ns); const i = r.int(0, 2); const what = r.pick(['sweets', 'counters', 'socks', 'pens']);
        return { html: `A bag contains ${y7gList(cols.map((c, j) => `${ns[j]} ${c}`))} ${what}. One is picked at random. What is the probability that it is ${B(cols[i])}? Give your answer as a fraction in its simplest form.`, ...fAns(ns[i], T), hint: 'Find the total first.',
          steps: [`Total = ${ns.join(' + ')} = ${T}`, `${y7gCap(cols[i])}: ${ns[i]}`, `P(${cols[i]}) = ${frS(ns[i], T)}`] };
      }
      const n = r.pick([10, 12, 15, 20]); const conds = [['an even number', (v) => v % 2 === 0], ['a multiple of 5', (v) => v % 5 === 0], ['a number less than 4', (v) => v < 4], ['a multiple of 3', (v) => v % 3 === 0], ['a square number', (v) => Number.isInteger(Math.sqrt(v))], [`a number greater than ${n - 3}`, (v) => v > n - 3]];
      const [desc, f] = r.pick(conds); const ok = Array.from({ length: n }, (_, i) => i + 1).filter(f);
      return { html: `${n} cards are numbered 1 to ${n}. One card is chosen at random. Find the probability that it shows ${B(desc)}. Give your answer as a fraction in its simplest form.`, ...fAns(ok.length, n), hint: 'List the cards that work.',
        steps: [`Cards that work: ${ok.join(', ')} — that is ${ok.length} card${ok.length === 1 ? '' : 's'}.`, `P = ${frS(ok.length, n)}`] };
    }],
  ['Probability of an event not happening',
    'An event either happens or it does not, so P(not A) = 1 − P(A). With fractions, subtract the numerator from the denominator; with decimals, subtract from 1.',
    (r) => {
      const t = r.int(0, 2);
      const ev = r.pick(['a train is late', 'it snows on Monday', 'Jo wins a game of chess', 'a seed grows into a plant', 'a bus is full', 'a letter arrives tomorrow']);
      if (t === 0) {
        const d = r.pick([5, 7, 8, 9, 10, 11, 12]); let n; do { n = r.int(1, d - 1); } while (gcd(n, d) !== 1);
        return { html: `The probability that ${ev} is ${frac(n, d)}. What is the probability that this does ${B('not')} happen? Give your answer as a fraction.`, ...fAns(d - n, d), hint: 'Subtract from 1.',
          steps: ['P(not) = 1 − P(happens)', `1 = ${frac(d, d)}, so P(not) = ${frac(d, d)} − ${frac(n, d)}`, `= ${frS(d - n, d)}`] };
      }
      if (t === 1) {
        const p = r.int(1, 19) * 5 + (r.chance(0.4) ? r.int(1, 4) : 0); const q = 100 - p;
        return { html: `The probability that ${ev} is ${ps(p / 100)}. What is the probability that this does ${B('not')} happen? Give your answer as a decimal.`, ...nAns(q / 100), hint: 'Subtract from 1.',
          steps: ['P(not) = 1 − P(happens)', `= 1 − ${ps(p / 100)} = ${B(ps(q / 100))}`] };
      }
      const [c1, c2] = r.sample(Y7G_COLS, 2); const a = r.int(2, 12), b = r.int(2, 12);
      return { html: `A box contains ${a} ${c1} and ${b} ${c2} pencils. One is taken at random. What is the probability that it is ${B('not ' + c1)}? Give your answer as a fraction in its simplest form.`, ...fAns(b, a + b), hint: `Count the pencils that are not ${c1}.`,
        steps: [`Total = ${a} + ${b} = ${a + b}`, `Not ${c1}: ${a + b} − ${a} = ${b}`, `P(not ${c1}) = ${frS(b, a + b)}`] };
    }],
  ['Exam-style problem',
    'Work out how many outcomes there are in total and how many of them you want, using any extra information in the question. Remember the probabilities of all the outcomes add up to 1.',
    (r) => {
      const t = r.int(0, 4);
      if (t === 0) {
        const n = r.pick([100, 150, 200, 250, 300]); const k = r.int(2, 10), m = r.int(2, 12); const who = r.pick(['Sam', 'Ava', 'Raj', 'Ellie']);
        return { html: `${n} raffle tickets are sold and one winning ticket is drawn at random. ${who} buys ${k} tickets and ${who}’s family buy another ${m}. What is the probability that ${B('nobody')} in ${who}’s family (including ${who}) wins? Give your answer as a fraction in its simplest form.`, ...fAns(n - k - m, n), hint: 'Count the tickets that do not belong to the family.',
          steps: [`Family tickets = ${k} + ${m} = ${k + m}`, `Other tickets = ${n} − ${k + m} = ${n - k - m}`, `P = ${frS(n - k - m, n)}`] };
      }
      if (t === 1) {
        const rd = r.int(2, 8), g = r.int(1, 9); const mult = r.pick([2, 3]); const bl = mult * rd; const T = rd + bl + g; const thing = r.pick(['counters', 'marbles', 'sweets', 'buttons']);
        return { html: `A bag has only red, blue and green ${thing}. There are ${rd} red ${thing}, ${mult === 2 ? 'twice' : 'three times'} as many blue as red, and ${g} green. One is taken at random. What is the probability that it is ${B('blue')}? Give your answer as a fraction in its simplest form.`, ...fAns(bl, T), hint: 'Work out the number of blue first.',
          steps: [`Blue = ${mult} × ${rd} = ${bl}`, `Total = ${rd} + ${bl} + ${g} = ${T}`, `P(blue) = ${frS(bl, T)}`] };
      }
      if (t === 2) {
        let a, b, x; do { a = r.int(2, 9) * 5; b = r.int(1, 8) * 5; x = (100 - a - b) / 2; } while (x <= 0 || x % 5 !== 0 || a === b);
        const [c1, c2, c3, c4] = r.sample(Y7G_COLS, 4);
        return { html: `A biased spinner can land on ${c1}, ${c2}, ${c3} or ${c4}. P(${c1}) = ${ps(a / 100)} and P(${c2}) = ${ps(b / 100)}. It is equally likely to land on ${c3} or on ${c4}. Work out P(${B(c3)}). Give your answer as a decimal.`, ...nAns(x / 100), hint: 'All the probabilities add up to 1.',
          steps: [`P(${c1}) + P(${c2}) = ${ps(a / 100)} + ${ps(b / 100)} = ${ps((a + b) / 100)}`, `P(${c3}) + P(${c4}) = 1 − ${ps((a + b) / 100)} = ${ps((100 - a - b) / 100)}`, `P(${c3}) = ${ps((100 - a - b) / 100)} ÷ 2 = ${B(ps(x / 100))}`] };
      }
      if (t === 3) {
        const rd = r.int(2, 9), bl = r.int(2, 9), k = r.int(2, 8); const [c1, c2] = r.sample(Y7G_COLS, 2); const who = r.pick(['Tom', 'Mei', 'Ola', 'Finn']);
        return { html: `A jar contains ${rd} ${c1} and ${bl} ${c2} marbles. ${who} adds ${k} more ${c1} marbles to the jar. A marble is then taken at random. What is the probability that it is ${B(c2)}? Give your answer as a fraction in its simplest form.`, ...fAns(bl, rd + k + bl), hint: 'Find the new total first.',
          steps: [`${y7gCap(c1)} now = ${rd} + ${k} = ${rd + k}`, `New total = ${rd + k} + ${bl} = ${rd + k + bl}`, `P(${c2}) = ${frS(bl, rd + k + bl)}`] };
      }
      const N = r.pick([24, 25, 28, 30, 32]); const boys = r.int(8, N - 8); const girls = N - boys; const gg = r.int(1, girls - 2);
      return { html: `A class has ${N} students. ${boys} of them are boys. ${gg} of the girls wear glasses. One student is chosen at random. What is the probability that the student is a ${B('girl who does not wear glasses')}? Give your answer as a fraction in its simplest form.`, ...fAns(girls - gg, N), hint: 'Find the number of girls first.',
        steps: [`Girls = ${N} − ${boys} = ${girls}`, `Girls without glasses = ${girls} − ${gg} = ${girls - gg}`, `P = ${frS(girls - gg, N)}`] };
    }],
]);
SPEC['y7-probability'] = 'KS3 Probability: language, the 0–1 scale & simple probabilities';

}

// ---- fragment exam8.js ----
{
// ===== exam8: exam-style / problem-solving styles for every Year 8 topic =====
const X8N = ['Amira', 'Ben', 'Chloe', 'Dev', 'Ellie', 'Finn', 'Grace', 'Hamza', 'Isla', 'Jack', 'Kemi', 'Leo', 'Maya', 'Noah', 'Priya', 'Ravi', 'Sofia', 'Tom', 'Zara', 'Yusuf'];
const x8sm = (v) => (v < 0 ? '−' + money(-v) : money(v)); // signed money for display
const x8m = (v) => (Number.isInteger(v) ? '£' + commas(String(v)) : money(v)); // £12 or £12.50
const x8deg = (v) => nAns(v, { unit: '°' });
// perturb a 1 s.f. value d×u so it still rounds to d×u at 1 s.f.; dp = decimals to keep
function x8pert(r, v, dp) {
  const u = 10 ** Math.floor(Math.log10(v)); let w;
  do { const d = (r.int(10, 40) / 100) * u * r.sign(); w = rnd(v + d, dp); } while (w === v || rnd(w / u, 0) * u !== v);
  return w;
}

// ---------------------------------------------------------------- negative numbers
addStyles('y8-negative-numbers', [
  ['Problems in context',
    'Write each change in the story as adding or subtracting. Going down — temperatures falling, money leaving an account, floors below ground, depths below sea level — moves you down the number line. Work through the changes one at a time.',
    (r) => {
      const nm = r.pick(X8N);
      return r.pick([
        () => {
          const t1 = r.int(-6, 9), f = r.int(6, 16), u = r.int(2, 9); const mid = t1 - f, ans = mid + u;
          const city = r.pick(['Oslo', 'Moscow', 'Leeds', 'Helsinki', 'Aberdeen', 'Warsaw']);
          return { html: `At 6 pm the temperature in ${city} was ${B(deg(t1) + 'C')}. By midnight it had fallen by ${B(f + '°C')}. By 8 am the next morning it had risen by ${B(u + '°C')}. What was the temperature at 8 am?`, ...nAns(ans, { unit: '°C' }), unit: '°C', hint: 'Subtract the fall, then add the rise.',
            steps: [`A fall of ${f}°C means subtract ${f}: ${ds(t1)} − ${f} = ${ds(mid)}°C at midnight.`, `A rise of ${u}°C means add ${u}: ${ds(mid)} + ${u} = ${ds(ans)}`, `The temperature at 8 am was ${B(ds(ans))}°C.`] };
        },
        () => {
          const b = r.int(20, 150), c = r.int(b + 10, b + 140), p = r.int(10, 90); const mid = b - c, ans = mid + p;
          const bill = r.pick(['a phone bill', 'a car repair', 'a holiday deposit', 'a new laptop']);
          return { html: `${nm} has ${B(x8m(b))} in a bank account. ${nm} pays ${B(x8m(c))} for ${bill}, then pays in ${B(x8m(p))}. What is the balance of the account now? (A negative balance means the account is overdrawn.)`, ...nAns(ans, { money: true }), answerHtml: B(x8sm(ans)), format: 'Type the balance in pounds, e.g. −35 or 20', hint: 'Paying out subtracts; paying in adds.',
            steps: [`After the payment: ${b} − ${c} = ${ds(mid)}, so the balance is ${x8sm(mid)}.`, `After paying in: ${ds(mid)} + ${p} = ${ds(ans)}`, `The balance is ${B(x8sm(ans))}.`] };
        },
        () => {
          const s = r.int(2, 11), d = s + r.int(1, 4), u = r.int(2, 9); const mid = s - d, ans = mid + u;
          const pl = r.pick(['a hotel', 'a shopping centre', 'an office block', 'a hospital']);
          return { html: `In ${pl} the ground floor is floor 0 and the floors below ground are numbered −1, −2, −3 and −4. A lift starts on floor ${B(s)}. It goes down ${B(d)} floors, then up ${B(u)} floors. On which floor does it stop?`, ...nAns(ans), hint: 'Down means subtract, up means add.',
            steps: [`Down ${d} floors: ${s} − ${d} = ${ds(mid)}`, `Up ${u} floors: ${ds(mid)} + ${u} = ${ds(ans)}`, `The lift stops on floor ${B(ds(ans))}.`] };
        },
        () => {
          const a = r.int(2, 5), b = r.int(1, 3), c = r.int(1, 7), w = r.int(3, 10); const ans = a * c - b * w;
          return { html: `In a quiz, a correct answer scores ${B(a)} points and a wrong answer scores ${B('−' + b)} point${b > 1 ? 's' : ''}. ${nm} gets ${B(c)} answers correct and ${B(w)} answers wrong. What is ${nm}’s total score?`, ...nAns(ans), hint: 'Work out the points for correct and wrong answers separately, then add.',
            steps: [`Correct answers: ${c} × ${a} = ${a * c}`, `Wrong answers: ${w} × (−${b}) = −${b * w}`, `Total: ${a * c} + (−${b * w}) = ${a * c} − ${b * w} = ${B(ds(ans))}`] };
        },
        () => {
          const dep = r.int(8, 40) * 5, up = r.int(2, dep / 5 - 1) * 5, h = r.int(5, 60); const pos = -dep + up, ans = h - pos;
          const what = r.pick(['A diver', 'A submarine', 'A research robot', 'A remote camera']);
          return { html: `${what} is ${B(dep + ' m')} below sea level. It rises ${B(up + ' m')}. A seabird is flying ${B(h + ' m')} above sea level, directly above it. How far is the seabird above the ${what.split(' ').slice(1).join(' ')} now?`, ...nAns(ans, { unit: 'm' }), unit: 'm', hint: 'Write below sea level as a negative height.',
            steps: [`Start: −${dep} m. After rising: −${dep} + ${up} = ${ds(pos)} m`, `Distance = ${h} − (${ds(pos)}) = ${h} + ${-pos}`, `The seabird is ${B(ans)} m above it.`] };
        },
      ])();
    }],
  ['Reverse problem',
    'Work backwards. To find a change, work out end − start. To undo a change, do the opposite operation. If a change was shared equally over several hours or items, divide — and remember the sign rules.',
    (r) => {
      const nm = r.pick(X8N);
      return r.pick([
        () => {
          const f = r.int(1, 4), n = r.int(3, 8), t1 = r.int(-5, 10), t2 = t1 - f * n;
          return { html: `At 7 pm the temperature was ${B(deg(t1) + 'C')}. ${n} hours later it was ${B(deg(t2) + 'C')}. The temperature fell by the same amount every hour. By how many degrees did it fall each hour?`, ...nAns(f, { unit: '°C' }), unit: '°C', hint: 'Find the total change first, then share it between the hours.',
            steps: [`Total change = ${ds(t2)} − ${br(t1)} = ${ds(t2 - t1)}°C`, `Change per hour = ${ds(t2 - t1)} ÷ ${n} = ${ds(-f)}°C`, `It fell by ${B(f)}°C each hour.`] };
        },
        () => {
          const e = r.int(5, 60), c = r.int(e + 15, e + 220); const st = c - e;
          const item = r.pick(['concert tickets', 'a new bike', 'car insurance', 'a train season ticket']);
          return { html: `${nm} paid ${B(x8m(c))} for ${item}. After the payment, the account balance was ${B('−' + x8m(e))}. How much was in the account before the payment?`, ...nAns(st, { money: true }), format: 'Type the amount in pounds, e.g. 45', hint: 'Undo the payment: add it back on.',
            steps: [`Balance before − ${c} = −${e}`, `Undo the subtraction: −${e} + ${c} = ${st}`, `There was ${B(x8m(st))} in the account.`] };
        },
        () => {
          const a = r.int(2, 5), b = r.int(1, 3), N = r.pick([10, 12, 15, 20]); const w = r.int(2, N - 2), c = N - w; const S = a * c - b * w;
          return { html: `A quiz has ${B(N)} questions. A correct answer scores ${B(a)} points and a wrong answer scores ${B('−' + b)}. ${nm} answers every question and scores ${B(ds(S))} points. How many questions did ${nm} get wrong?`, ...nAns(w), hint: 'Start from the score for all correct; each wrong answer changes the score by the same amount.',
            steps: [`If all ${N} were correct: ${N} × ${a} = ${N * a} points.`, `Each wrong answer loses ${a} and adds −${b}, so it changes the score by −${a + b}.`, `Points lost = ${N * a} − ${br(S)} = ${N * a - S}`, `Wrong answers = ${N * a - S} ÷ ${a + b} = ${B(w)}`] };
        },
        () => {
          const t = r.int(-12, 6), u = r.int(3, 12), f = r.int(5, 18); const st = t - u + f;
          return { html: `During the morning the temperature rose by ${B(u + '°C')}. In the afternoon it fell by ${B(f + '°C')}. The temperature is now ${B(deg(t) + 'C')}. What was the temperature at the start of the morning?`, ...nAns(st, { unit: '°C' }), unit: '°C', hint: 'Undo the changes in reverse order.',
            steps: [`Undo the fall (add ${f}): ${ds(t)} + ${f} = ${ds(t + f)}`, `Undo the rise (subtract ${u}): ${ds(t + f)} − ${u} = ${ds(st)}`, `The starting temperature was ${B(ds(st))}°C.`] };
        },
        () => {
          let xs, m, last; do { m = r.int(-5, 2); xs = Array.from({ length: 4 }, () => r.int(-9, 6)); last = 5 * m - sum(xs); } while (Math.abs(last) > 10);
          return { html: `The mean of the lowest temperatures on 5 nights was ${B(deg(m) + 'C')}. The lowest temperatures on four of the nights were ${B(xs.map((v) => ds(v) + '°C').join(', '))}. What was the lowest temperature on the fifth night?`, ...nAns(last, { unit: '°C' }), unit: '°C', hint: 'Total = mean × 5.',
            steps: [`Total of all 5 = ${ds(m)} × 5 = ${ds(5 * m)}`, `Total of the four known = ${ds(sum(xs))}`, `Fifth = ${ds(5 * m)} − ${br(sum(xs))} = ${B(ds(last))}°C`] };
        },
      ])();
    }],
]);

// ---------------------------------------------------------------- factors & multiples
addStyles('y8-factors-multiples', [
  ['Problems in context',
    'Decide whether the problem needs the HCF or the LCM. “Largest equal groups, longest equal pieces, biggest square tiles” → HCF. “When do they happen together again, least number so they match” → LCM.',
    (r) => {
      const nm = r.pick(X8N);
      const cop = (lo, hi) => { let p, q; do { p = r.int(lo, hi); q = r.int(lo, hi); } while (p === q || gcd(p, q) !== 1); return [p, q]; };
      return r.pick([
        () => {
          let a, b; do { a = r.int(4, 12); b = r.int(4, 12); } while (a === b || a % b === 0 || b % a === 0 || lcm(a, b) > 120);
          const L = lcm(a, b); const [x, y] = r.pick([['burgers', 'burger buns'], ['paper cups', 'paper plates'], ['pens', 'pencils'], ['candles', 'candle holders'], ['sausages', 'bread rolls']]);
          return { html: `${x[0].toUpperCase() + x.slice(1)} are sold in packs of ${B(a)}. ${y[0].toUpperCase() + y.slice(1)} are sold in packs of ${B(b)}. ${nm} wants to buy exactly the same number of ${x} and ${y}. What is the smallest number of packs of ${x} ${nm} can buy?`, ...nAns(L / a), hint: 'The number of each item must be a common multiple of both pack sizes.',
            steps: [`Multiples of ${a}: ${[1, 2, 3, 4, 5].map((k) => a * k).join(', ')}, …`, `Multiples of ${b}: ${[1, 2, 3, 4, 5].map((k) => b * k).join(', ')}, …`, `LCM of ${a} and ${b} = ${L}, so ${nm} needs ${L} of each.`, `Packs of ${x} = ${L} ÷ ${a} = ${B(L / a)}`] };
        },
        () => {
          let a, b; do { a = r.int(4, 15); b = r.int(4, 15); } while (a === b || a % b === 0 || b % a === 0 || lcm(a, b) > 90);
          const L = lcm(a, b), mins = r.int(2, 10), T = 60 * mins, k = Math.floor(T / L);
          return { html: `A red light flashes every ${B(a + ' seconds')}. A green light flashes every ${B(b + ' seconds')}. They flash together at the start. How many more times will they flash together in the next ${B(mins + ' minutes')}?`, ...nAns(k), hint: 'Find how often they flash together (the LCM), then see how many times that fits.',
            steps: [`${a} = ${pfHtml(pf(a))} and ${b} = ${pfHtml(pf(b))}`, `LCM = ${L}, so they flash together every ${L} seconds.`, `${mins} minutes = ${T} seconds; ${T} ÷ ${L} = ${ds(rnd(T / L, 2))}${T % L ? '…' : ''}`, `They flash together ${B(k)} more times.`] };
        },
        () => {
          const g = r.int(5, 30), [p, q] = cop(2, 9); const a = g * p, b = g * q;
          const it = r.pick(['ribbon', 'rope', 'wire', 'string']);
          return { html: `${nm} has two pieces of ${it}, one ${B(a + ' cm')} long and one ${B(b + ' cm')} long. Both are cut into pieces that are all the same length, as long as possible, with nothing left over. How many pieces are there altogether?`, ...nAns(p + q), hint: 'The length of each piece is the HCF of the two lengths.',
            steps: [`${a} = ${pfHtml(pf(a))} and ${b} = ${pfHtml(pf(b))}`, `HCF = ${g}, so each piece is ${g} cm long.`, `${a} ÷ ${g} = ${p} pieces and ${b} ÷ ${g} = ${q} pieces`, `Total = ${p} + ${q} = ${B(p + q)}`] };
        },
        () => {
          const g = r.int(3, 12), [p, q] = cop(2, 9); const s = g * p, t = g * q; const askBags = r.chance();
          const [x, y] = r.pick([['sweets', 'stickers'], ['pencils', 'rubbers'], ['balloons', 'badges'], ['apples', 'oranges']]);
          return { html: `${nm} has ${B(s)} ${x} and ${B(t)} ${y}. ${nm} puts them all into party bags so that every bag is identical, using as many bags as possible and with nothing left over. ${askBags ? 'How many bags does ' + nm + ' make?' : `How many ${x} are in each bag?`}`, ...nAns(askBags ? g : p), hint: 'The greatest number of identical bags is the HCF.',
            steps: [`${s} = ${pfHtml(pf(s))} and ${t} = ${pfHtml(pf(t))}`, `HCF of ${s} and ${t} = ${g}, so there are ${g} bags.`, askBags ? `Check: ${s} ÷ ${g} = ${p} and ${t} ÷ ${g} = ${q}, both whole numbers.` : `${x[0].toUpperCase() + x.slice(1)} in each bag = ${s} ÷ ${g} = ${p}`, `Answer: ${B(askBags ? g : p)}`] };
        },
        () => {
          const g = 5 * r.int(2, 12), [p, q] = cop(2, 8); const a = g * p, b = g * q;
          return { html: `A rectangular floor measures ${B(a + ' cm')} by ${B(b + ' cm')}. It is covered exactly with identical square tiles. The tiles are as large as possible. How many tiles are needed?`, ...nAns(p * q), hint: 'The side of each tile is the HCF of the two lengths.',
            steps: [`HCF of ${a} and ${b} = ${g}, so each tile is ${g} cm by ${g} cm.`, `Along the length: ${a} ÷ ${g} = ${p} tiles; along the width: ${b} ÷ ${g} = ${q} tiles`, `Number of tiles = ${p} × ${q} = ${B(p * q)}`] };
        },
      ])();
    }],
]);

// ---------------------------------------------------------------- order of operations
addStyles('y8-order-of-operations', [
  ['Problems in context',
    'Write the whole problem as one calculation, then use BIDMAS. Use brackets to show any part that must be worked out first, e.g. 50 − (3 × 8 + 2 × 5).',
    (r) => {
      const nm = r.pick(X8N);
      return r.pick([
        () => {
          const A = r.int(7, 13), C = r.int(4, 7), na = r.int(1, 3), nc = r.int(1, 4); const cost = na * A + nc * C; const N = cost < 50 ? 50 : 100; const ch = N - cost;
          const pl = r.pick(['cinema', 'zoo', 'museum', 'theme park', 'swimming pool']);
          return { html: `Tickets for the ${pl} cost ${B('£' + A)} for an adult and ${B('£' + C)} for a child. ${nm} buys ${na} adult ticket${na > 1 ? 's' : ''} and ${nc} child ticket${nc > 1 ? 's' : ''}, and pays with a ${B('£' + N)} note. How much change should ${nm} get?`, ...nAns(ch, { money: true }), format: 'Type the amount in pounds, e.g. 12', hint: 'Change = note − total cost.',
            steps: [`Change = ${N} − (${na} × ${A} + ${nc} × ${C})`, `Multiply first: ${na} × ${A} = ${na * A} and ${nc} × ${C} = ${nc * C}`, `Brackets: ${na * A} + ${nc * C} = ${cost}`, `Change = ${N} − ${cost} = ${B(x8m(ch))}`] };
        },
        () => {
          let s, m, k, f, tot; do { s = r.pick([2, 2.5, 3, 3.5, 4]); m = r.pick([1.5, 2, 2.5, 3]); k = r.int(3, 14); f = r.int(2, 5); tot = s + m * k; } while (Math.round(tot * 100) % f !== 0);
          return { html: `A taxi charges ${B(x8m(s))} plus ${B(x8m(m))} for every mile. ${f} friends share the fare for a ${k}-mile journey equally. How much does each friend pay?`, ...nAns(tot / f, { money: true }), format: 'Type the amount in pounds, e.g. 4.50', hint: 'Work out the whole fare first, then divide.',
            steps: [`Each pays (${ds(s)} + ${ds(m)} × ${k}) ÷ ${f}`, `Multiply: ${ds(m)} × ${k} = ${ds(m * k)}`, `Bracket: ${ds(s)} + ${ds(m * k)} = ${ds(tot)}`, `Divide: ${ds(tot)} ÷ ${f} = ${B(money(tot / f))}`] };
        },
        () => {
          const w = r.int(4, 18), d = r.int(1, 10), p = r.int(1, 9); const ans = 3 * w + d - p;
          return { html: `In a football league a team gets ${B('3 points')} for a win, ${B('1 point')} for a draw and 0 points for a loss. ${nm}’s team won ${B(w)} games and drew ${B(d)} games, but then had ${B(p)} point${p > 1 ? 's' : ''} taken away as a penalty. How many points does the team have?`, ...nAns(ans), hint: 'Multiply the wins by 3 before adding.',
            steps: [`Points = 3 × ${w} + 1 × ${d} − ${p}`, `Multiply first: 3 × ${w} = ${3 * w}`, `${3 * w} + ${d} − ${p} = ${B(ans)}`] };
        },
        () => {
          const n = r.int(20, 48), s = r.int(12, n - 2), p = r.pick([0.8, 1, 1.2, 1.25, 1.5, 2]), c = r.int(6, 18); const ans = s * p - c;
          return { html: `${nm} spends ${B(x8m(c))} on ingredients and bakes ${B(n)} cakes for a bake sale. ${nm} sells ${B(s)} of the cakes for ${B(x8m(p))} each. How much profit does ${nm} make?`, ...nAns(ans, { money: true }), answerHtml: B(x8sm(ans)), format: 'Type the amount in pounds, e.g. 14.40', hint: 'Profit = money taken − cost.',
            steps: [`Profit = ${s} × ${ds(p)} − ${c}`, `Multiply first: ${s} × ${ds(p)} = ${ds(s * p)}`, `Profit = ${ds(s * p)} − ${c} = ${B(x8sm(ans))}`] };
        },
        () => {
          const fee = r.pick([10, 15, 20, 25, 30]), v = r.pick([3, 4, 5, 6]), n = r.int(2, 4), m = r.int(2, 6); const ans = fee + v * n * 4 * m;
          return { html: `A gym charges a one-off joining fee of ${B('£' + fee)} plus ${B('£' + v)} per visit. ${nm} goes ${B(n + ' times a week')} for ${B(m + ' months')}. Take one month as 4 weeks. How much does ${nm} pay altogether?`, ...nAns(ans, { money: true }), format: 'Type the amount in pounds, e.g. 150', hint: 'Find the number of visits first.',
            steps: [`Visits = ${n} × 4 × ${m} = ${n * 4 * m}`, `Total = ${fee} + ${v} × ${n * 4 * m}`, `Multiply first: ${v} × ${n * 4 * m} = ${v * n * 4 * m}`, `Total = ${fee} + ${v * n * 4 * m} = ${B('£' + ans)}`] };
        },
      ])();
    }],
  ['Spot the mistake',
    'A common mistake is to work from left to right instead of following BIDMAS. Work out the correct value using BIDMAS, then compare it with the wrong answer.',
    (r) => {
      const nm = r.pick(X8N);
      const o = r.pick([
        () => { const a = r.int(2, 15), b = r.int(2, 9), c = r.int(2, 9); return { q: `${a} + ${b} × ${c}`, w: (a + b) * c, v: a + b * c, s: [`× before +: ${b} × ${c} = ${b * c}`, `${a} + ${b * c} = ${a + b * c}`] }; },
        () => { const b = r.int(2, 6), c = r.int(2, 6), a = b * c + r.int(3, 30); return { q: `${a} − ${b} × ${c}`, w: (a - b) * c, v: a - b * c, s: [`× before −: ${b} × ${c} = ${b * c}`, `${a} − ${b * c} = ${a - b * c}`] }; },
        () => { const a = r.int(2, 9), b = r.int(2, 6); return { q: `${a} + ${b}<sup>2</sup>`, w: (a + b) ** 2, v: a + b * b, s: [`Indices before +: ${b}<sup>2</sup> = ${b * b}`, `${a} + ${b * b} = ${a + b * b}`] }; },
        () => { const a = r.int(2, 9), b = r.int(2, 9), c = r.int(2, 9), d = r.int(2, 6); return { q: `${a} × ${b} + ${c} × ${d}`, w: (a * b + c) * d, v: a * b + c * d, s: [`Both multiplications first: ${a} × ${b} = ${a * b} and ${c} × ${d} = ${c * d}`, `${a * b} + ${c * d} = ${a * b + c * d}`] }; },
        () => { let a, b, c; do { c = r.int(2, 6); b = c * r.int(2, 9); a = r.int(2, 30); } while ((a + b) % c !== 0); return { q: `${a} + ${b} ÷ ${c}`, w: (a + b) / c, v: a + b / c, s: [`÷ before +: ${b} ÷ ${c} = ${b / c}`, `${a} + ${b / c} = ${a + b / c}`] }; },
      ])();
      const diff = Math.abs(o.w - o.v);
      return { html: `${nm} works out ${B(o.q)} by working from left to right, and gets the answer ${B(ds(o.w))}. What is the difference between ${nm}’s answer and the correct answer?`, ...nAns(diff), hint: 'Use BIDMAS to find the correct answer first.',
        steps: [...o.s, `The correct answer is ${ds(o.v)}, not ${ds(o.w)}.`, `Difference = ${ds(Math.max(o.w, o.v))} − ${ds(Math.min(o.w, o.v))} = ${B(ds(diff))}`] };
    }],
]);

// ---------------------------------------------------------------- algebraic notation
addStyles('y8-algebraic-notation', [
  ['Problems in context',
    'Write each quantity as an algebraic term or expression, then add them and collect like terms. Keep different letters separate, and remember that 3 × x is written 3x.',
    (r) => {
      const nm = r.pick(X8N);
      return r.pick([
        () => {
          const sides = [0, 1, 2].map(() => [r.int(1, 6), r.nz(-3, 9)]); let A = sum(sides.map((s) => s[0])), Bc = sum(sides.map((s) => s[1]));
          const ans = lin(A, Bc);
          return { html: `The sides of a triangle are ${sides.map((s) => B('(' + tx(lin(s[0], s[1])) + ') cm')).join(', ').replace(/, ([^,]*)$/, ' and $1')}. Write an expression, in its simplest form, for the perimeter of the triangle.`, answerLabel: 'Perimeter =', ...eAns(ans, { form: 'expanded' }), unit: 'cm', hint: 'Add all three sides and collect like terms.',
            steps: [`Perimeter = ${sides.map((s) => tx(lin(s[0], s[1]))).join(' + ')}`, `x terms: ${sides.map((s) => s[0]).join(' + ')} = ${A}, so ${tx(coefT(A, 'x'))}`, `Numbers: ${sides.map((s) => ds(s[1])).join(' + ')} = ${ds(Bc)}`, `Perimeter = ${B(tx(ans))} cm`] };
        },
        () => {
          const a = r.int(2, 7), b = r.int(1, 9), c = r.int(2, 6); const ans = polyT([[2 * a, 'x'], [2 * c, 'y'], [2 * b, '']]);
          return { html: `A rectangle has length ${B('(' + tx(lin(a, b)) + ') m')} and width ${B(tx(c + 'y') + ' m')}. Write an expression, in its simplest form, for the perimeter of the rectangle.`, answerLabel: 'Perimeter =', ...eAns(ans, { form: 'expanded' }), unit: 'm', hint: 'A rectangle has two lengths and two widths.',
            steps: [`Perimeter = ${tx(lin(a, b))} + ${tx(c + 'y')} + ${tx(lin(a, b))} + ${tx(c + 'y')}`, `x terms: ${tx(coefT(2 * a, 'x'))}; y terms: ${tx(coefT(2 * c, 'y'))}; numbers: ${2 * b}`, `Perimeter = ${B(tx(ans))} m`] };
        },
        () => {
          const b = r.int(2, 9), k = r.int(2, 5); const ans = lin(k + 2, b);
          return { html: `${nm} is ${B('<i>x</i>')} years old. ${nm}’s brother is ${B(b)} years older than ${nm}. Their grandad is ${B(k)} times as old as ${nm}. Write an expression, in its simplest form, for the total of their three ages.`, answerLabel: 'Total =', ...eAns(ans, { form: 'expanded' }), hint: 'Write each age in terms of x first.',
            steps: [`${nm}: <i>x</i>; brother: ${tx(lin(1, b))}; grandad: ${tx(k + 'x')}`, `Total = ${tx('x')} + ${tx(lin(1, b))} + ${tx(k + 'x')}`, `Collect the x terms: 1 + 1 + ${k} = ${k + 2}`, `Total = ${B(tx(ans))}`] };
        },
        () => {
          const a = r.int(2, 6), b = r.int(1, 5), c = r.int(1, 6), d = r.int(1, 4); const ans = polyT([[b + d, 'n'], [a + c, 'p']]);
          const [x, y] = r.pick([['pens', 'notebooks'], ['apples', 'bananas'], ['stamps', 'envelopes'], ['cakes', 'drinks']]);
          return { html: `${x[0].toUpperCase() + x.slice(1)} cost ${B('<i>p</i>')} pence each and ${y} cost ${B('<i>n</i>')} pence each. ${nm} buys ${a} ${x} and ${b} ${y}. A friend buys ${c} ${x} and ${d} ${y}. Write an expression, in its simplest form, for the total cost in pence.`, answerLabel: 'Cost =', ...eAns(ans, { form: 'expanded' }), hint: 'Collect the p terms and the n terms separately.',
            steps: [`${nm}: ${tx(polyT([[a, 'p'], [b, 'n']]))}; friend: ${tx(polyT([[c, 'p'], [d, 'n']]))}`, `p terms: ${a} + ${c} = ${a + c}; n terms: ${b} + ${d} = ${b + d}`, `Total = ${B(tx(ans))} pence`] };
        },
        () => {
          const a = r.int(2, 9), c = r.int(2, 9); const u = r.pick([['x', 'y'], ['a', 'b'], ['m', 'n']]); const ans = `${a * c}${u[0]}${u[1]}`;
          const thing = r.pick(['A rectangular rug', 'A rectangular poster', 'A rectangular field', 'A rectangular tile']);
          return { html: `${thing} is ${B(tx(a + u[0]))} metres long and ${B(tx(c + u[1]))} metres wide. Write an expression, in its simplest form, for its area.`, answerLabel: 'Area =', ...eAns(ans), unit: 'm²', hint: 'Area = length × width; multiply numbers, then letters.',
            steps: [`Area = ${tx(a + u[0])} × ${tx(c + u[1])}`, `Numbers: ${a} × ${c} = ${a * c}; letters: ${u[0]} × ${u[1]} = ${u[0]}${u[1]}`, `Area = ${B(tx(ans))} m²`] };
        },
      ])();
    }],
]);

// ---------------------------------------------------------------- substitution
addStyles('y8-substitution', [
  ['Formulae in context',
    'Write down the formula, substitute the numbers from the question, then calculate using BIDMAS. Some questions need a second step, such as working out change or adding two results.',
    (r) => {
      const nm = r.pick(X8N);
      return r.pick([
        () => {
          const s = r.pick([2.5, 3, 3.5, 4]), m = r.pick([1.2, 1.5, 1.8, 2]), d = r.int(3, 15); const C = rnd(s + m * d, 2); const N = [20, 30, 50].find((v) => v > C); const ch = rnd(N - C, 2);
          return { html: `A taxi company uses the formula ${B('<i>C</i> = ' + ds(s) + ' + ' + ds(m) + '<i>d</i>')} to work out the fare, ${B('£<i>C</i>')}, for a journey of ${B('<i>d</i>')} miles. ${nm} travels ${B(d + ' miles')} and pays with a ${B('£' + N)} note. How much change should ${nm} get?`, ...nAns(ch, { money: true }), format: 'Type the amount in pounds, e.g. 6.40', hint: 'Find the fare first, then subtract it from the note.',
            steps: [`C = ${ds(s)} + ${ds(m)} × ${d}`, `C = ${ds(s)} + ${ds(rnd(m * d, 2))} = ${money(C)}`, `Change = ${N} − ${fx(C, 2)} = ${B(money(ch))}`] };
        },
        () => {
          const f = r.pick([30, 35, 40, 45, 50]), rt = r.pick([20, 25, 30, 35, 40]), h1 = r.int(1, 6), h2 = r.int(1, 6); const c1 = f + rt * h1, c2 = f + rt * h2;
          const job = r.pick(['plumber', 'electrician', 'gardener', 'decorator']);
          return { html: `A ${job} works out the charge, ${B('£<i>C</i>')}, for a job lasting ${B('<i>h</i>')} hours using ${B(`<i>C</i> = ${f} + ${rt}<i>h</i>`)}. ${nm} books two jobs: one lasting ${B(h1 + ' hour' + (h1 > 1 ? 's' : ''))} and one lasting ${B(h2 + ' hour' + (h2 > 1 ? 's' : ''))}. How much does ${nm} pay altogether?`, ...nAns(c1 + c2, { money: true }), format: 'Type the amount in pounds, e.g. 210', hint: 'Use the formula once for each job, then add.',
            steps: [`First job: C = ${f} + ${rt} × ${h1} = ${c1}`, `Second job: C = ${f} + ${rt} × ${h2} = ${c2}`, `Total = ${c1} + ${c2} = ${B('£' + (c1 + c2))}`] };
        },
        () => {
          let c1, c2; do { c1 = r.int(-4, 3) * 5; c2 = r.int(-1, 7) * 5; } while (c2 <= c1);
          const F1 = 1.8 * c1 + 32, F2 = 1.8 * c2 + 32; const [p1, p2] = r.sample(['Reykjavik', 'Toronto', 'Madrid', 'Cairo', 'Glasgow', 'Berlin'], 2);
          return { html: `The formula ${B('<i>F</i> = 1.8<i>C</i> + 32')} changes a temperature in °C to °F. One day it was ${B(deg(c1) + 'C')} in ${p1} and ${B(deg(c2) + 'C')} in ${p2}. How many degrees Fahrenheit warmer was it in ${p2}?`, ...nAns(F2 - F1, { unit: '°F' }), unit: '°F', hint: 'Change both temperatures to °F, then subtract.',
            steps: [`${p1}: F = 1.8 × ${br(c1)} + 32 = ${ds(rnd(F1, 2))}`, `${p2}: F = 1.8 × ${br(c2)} + 32 = ${ds(rnd(F2, 2))}`, `Difference = ${ds(rnd(F2, 2))} − ${br(rnd(F1, 2))} = ${B(ds(rnd(F2 - F1, 2)))}°F`] };
        },
        () => {
          const s1 = r.int(4, 12) * 10, t1 = r.pick([0.5, 1, 1.5, 2, 2.5]), s2 = r.int(4, 12) * 10, t2 = r.pick([0.5, 1, 1.5, 2]); const d1 = s1 * t1, d2 = s2 * t2;
          const v = r.pick(['A train', 'A coach', 'A car', 'A lorry']);
          return { html: `The formula ${B('<i>d</i> = <i>st</i>')} gives the distance, <i>d</i> km, travelled at a speed of <i>s</i> km/h for <i>t</i> hours. ${v} travels at ${B(s1 + ' km/h')} for ${B(ds(t1) + ' hours')}, then at ${B(s2 + ' km/h')} for ${B(ds(t2) + ' hours')}. How far does it travel altogether?`, ...nAns(d1 + d2, { unit: 'km' }), unit: 'km', hint: 'Use the formula for each part of the journey.',
            steps: [`First part: d = ${s1} × ${ds(t1)} = ${ds(d1)} km`, `Second part: d = ${s2} × ${ds(t2)} = ${ds(d2)} km`, `Total = ${ds(d1)} + ${ds(d2)} = ${B(ds(d1 + d2))} km`] };
        },
        () => {
          const l = r.int(12, 40), w = r.int(8, 30), c = r.pick([4, 5, 6, 8, 12, 15]); const P = 2 * (l + w);
          return { html: `The perimeter of a rectangle is given by ${B('<i>P</i> = 2(<i>l</i> + <i>w</i>)')}. A rectangular paddock is ${B(l + ' m')} long and ${B(w + ' m')} wide. Fencing costs ${B('£' + c)} per metre. How much does it cost to fence all the way round the paddock?`, ...nAns(P * c, { money: true }), format: 'Type the amount in pounds, e.g. 480', hint: 'Find the perimeter, then multiply by the cost per metre.',
            steps: [`P = 2 × (${l} + ${w}) = 2 × ${l + w} = ${P} m`, `Cost = ${P} × ${c}`, `Cost = ${B('£' + commas(String(P * c)))}`] };
        },
      ])();
    }],
  ['Reverse problem',
    'Substitute the values you know into the formula to make an equation. Then solve it with inverse operations to find the missing value.',
    (r) => {
      const nm = r.pick(X8N);
      return r.pick([
        () => {
          const s = r.pick([2, 2.5, 3, 3.5, 4]), m = r.pick([1.5, 2, 2.5]), d = r.int(3, 16); const C = rnd(s + m * d, 2);
          return { html: `A taxi fare, ${B('£<i>C</i>')}, for a journey of ${B('<i>d</i>')} miles is given by ${B('<i>C</i> = ' + ds(s) + ' + ' + ds(m) + '<i>d</i>')}. ${nm}’s fare was ${B(money(C))}. How many miles was the journey?`, ...nAns(d, { unit: 'miles' }), unit: 'miles', hint: 'Substitute C, then solve the equation.',
            steps: [`${fx(C, 2)} = ${ds(s)} + ${ds(m)}<i>d</i>`, `Subtract ${ds(s)}: ${ds(m)}<i>d</i> = ${ds(rnd(C - s, 2))}`, `Divide by ${ds(m)}: <i>d</i> = ${B(d)} miles`] };
        },
        () => {
          const f = r.pick([30, 35, 40, 45, 50]), rt = r.pick([20, 25, 30, 35, 40]), h = r.int(2, 9); const C = f + rt * h;
          const job = r.pick(['plumber', 'electrician', 'gardener', 'window cleaner']);
          return { html: `A ${job} charges ${B('£<i>C</i>')} for <i>h</i> hours of work, where ${B(`<i>C</i> = ${f} + ${rt}<i>h</i>`)}. ${nm}’s bill was ${B('£' + C)}. How many hours did the ${job} work?`, ...nAns(h, { unit: 'hours' }), unit: 'hours', hint: 'Subtract the fixed charge, then divide.',
            steps: [`${C} = ${f} + ${rt}<i>h</i>`, `Subtract ${f}: ${rt}<i>h</i> = ${C - f}`, `Divide by ${rt}: <i>h</i> = ${B(h)} hours`] };
        },
        () => {
          const C = r.int(-6, 8) * 5, F = 1.8 * C + 32; const Fr = rnd(F, 2);
          return { html: `The formula ${B('<i>F</i> = 1.8<i>C</i> + 32')} changes a temperature in °C to °F. A weather app shows ${B(ds(Fr) + '°F')}. What is this temperature in °C?`, ...nAns(C, { unit: '°C' }), unit: '°C', hint: 'Subtract 32, then divide by 1.8.',
            steps: [`${ds(Fr)} = 1.8<i>C</i> + 32`, `Subtract 32: 1.8<i>C</i> = ${ds(rnd(Fr - 32, 2))}`, `Divide by 1.8: <i>C</i> = ${B(ds(C))}°C`] };
        },
        () => {
          const s = r.int(4, 16) * 5, t = r.pick([1.5, 2, 2.5, 3, 4, 0.5]); const d = s * t;
          const v = r.pick(['A cyclist', 'A coach', 'A ferry', 'A delivery van']);
          return { html: `The formula ${B('<i>d</i> = <i>st</i>')} links distance <i>d</i> km, speed <i>s</i> km/h and time <i>t</i> hours. ${v} travels ${B(ds(d) + ' km')} at an average speed of ${B(s + ' km/h')}. How many hours does the journey take?`, ...nAns(t, { unit: 'hours' }), unit: 'hours', hint: 'Substitute, then divide both sides by the speed.',
            steps: [`${ds(d)} = ${s} × <i>t</i>`, `Divide both sides by ${s}: <i>t</i> = ${ds(d)} ÷ ${s}`, `<i>t</i> = ${B(ds(t))} hours`] };
        },
        () => {
          const l = r.int(6, 30), w = r.int(3, l - 1); const P = 2 * (l + w);
          return { html: `The perimeter of a rectangle is given by ${B('<i>P</i> = 2(<i>l</i> + <i>w</i>)')}. ${nm} uses ${B(P + ' m')} of fencing to go exactly round a rectangular vegetable patch that is ${B(l + ' m')} long. What is the area of the vegetable patch?`, ...nAns(l * w, { unit: 'm²' }), unit: 'm²', hint: 'Find the width first, then the area.',
            steps: [`${P} = 2(${l} + <i>w</i>), so ${l} + <i>w</i> = ${P / 2}`, `<i>w</i> = ${P / 2} − ${l} = ${w} m`, `Area = ${l} × ${w} = ${B(l * w)} m²`] };
        },
      ])();
    }],
]);

// ---------------------------------------------------------------- angle facts
addStyles('y8-angle-facts', [
  ['Exam-style problem',
    'Chain angle facts together: angles on a straight line add to 180°, around a point to 360°, in a triangle to 180°, and the base angles of an isosceles triangle are equal. Find one angle at a time.',
    (r) => {
      return r.pick([
        () => {
          const base = r.int(30, 80), y = 180 - base, apex = 180 - 2 * base;
          return { html: `Triangle ABC is isosceles with AB = AC. The side BC is extended to a point D, so that B, C and D lie on a straight line. Angle ACD = ${B(deg(y))}. Work out the size of angle BAC.`, ...x8deg(apex), unit: '°', hint: 'Find angle ACB first using the straight line.',
            steps: [`Angles on a straight line: ACB = 180° − ${deg(y)} = ${deg(base)}`, `The triangle is isosceles, so ABC = ACB = ${deg(base)}`, `Angles in a triangle: BAC = 180° − ${deg(base)} − ${deg(base)} = ${B(deg(apex))}`] };
        },
        () => {
          const a = r.int(50, 80), askWall = r.chance(); const ans = 90 - a;
          const thing = r.pick(['A ladder', 'A plank', 'A pole', 'A metal beam']);
          return { html: `${thing} leans against a vertical wall. The ground is horizontal. The ${thing.split(' ').slice(1).join(' ').toLowerCase()} makes an angle of ${B(deg(a))} with the ground. Work out the angle between the ${thing.split(' ').slice(1).join(' ').toLowerCase()} and the wall.`, ...x8deg(ans), unit: '°', hint: 'The wall meets the ground at 90°.',
            steps: [`The wall, the ground and the ${thing.split(' ').slice(1).join(' ').toLowerCase()} make a triangle with a right angle (90°).`, `Angles in a triangle: 180° − 90° − ${deg(a)}`, `Angle = ${B(deg(ans))}`] };
        },
        () => {
          let Q, k, c; do { Q = r.int(15, 50); k = r.int(2, 4); c = 180 - (k + 1) * Q; } while (c < 15 || c === Q || c === k * Q);
          return { html: `In triangle PQR, angle P is ${B(k === 2 ? 'twice' : k + ' times')} the size of angle Q. Angle R is ${B(deg(c))}. Work out the size of angle P.`, ...x8deg(k * Q), unit: '°', hint: 'Angles P and Q together make 180° − angle R.',
            steps: [`P + Q = 180° − ${deg(c)} = ${deg(180 - c)}`, `P is ${k} parts and Q is 1 part, so ${k + 1} parts = ${deg(180 - c)} and 1 part = ${deg(Q)}`, `P = ${k} × ${deg(Q)} = ${B(deg(k * Q))}`] };
        },
        () => {
          let a, c; do { a = r.int(70, 150); c = r.int(20, 80); } while (a - c < 15);
          return { html: `A, B and C lie on a straight line. D is a point above the line, forming triangle BCD. Angle ABD = ${B(deg(a))} and angle BCD = ${B(deg(c))}. Work out the size of angle BDC.`, ...x8deg(a - c), unit: '°', hint: 'Find angle DBC using the straight line first.',
            steps: [`Angles on a straight line: DBC = 180° − ${deg(a)} = ${deg(180 - a)}`, `Angles in triangle BCD: BDC = 180° − ${deg(180 - a)} − ${deg(c)}`, `BDC = ${B(deg(a - c))}`] };
        },
        () => {
          const k = r.int(2, 4); let a, each; do { a = r.int(40, 200); each = (360 - a) / k; } while (each % 1 || each < 30 || each === a);
          const what = r.pick(['A pizza', 'A cake', 'A round cheese', 'A pie']);
          return { html: `${what} is cut into ${k + 1} slices from its centre. One slice has an angle of ${B(deg(a))} at the centre. The other ${k} slices are all the same size. Work out the angle at the centre of each of the other slices.`, ...x8deg(each), unit: '°', hint: 'Angles around a point add up to 360°.',
            steps: [`Angles around a point add up to 360°.`, `The other slices share 360° − ${deg(a)} = ${deg(360 - a)}`, `Each = ${deg(360 - a)} ÷ ${k} = ${B(deg(each))}`] };
        },
      ])();
    }],
  ['Angles with algebra',
    'Use an angle fact to write an equation — the angles add up to 180° or 360°. Collect the x terms and the numbers, solve for x, then substitute back if the question asks for an angle.',
    (r) => {
      const ang = (a, b) => `(${tx(lin(a, b))})°`;
      return r.pick([
        () => {
          let x, a, b, c, d; do { x = r.int(10, 40); a = r.int(1, 4); c = r.int(1, 4); b = r.int(-20, 30); d = 180 - (a + c) * x - b; } while (a * x + b < 20 || c * x + d < 20 || d === 0 || b === 0);
          return { html: `Two angles lie on a straight line. They are ${B(ang(a, b))} and ${B(ang(c, d))}. Work out the value of ${B('<i>x</i>')}.`, answerLabel: 'x =', ...nAns(x), hint: 'The two angles add up to 180°.',
            steps: [`${tx(lin(a, b))} + ${tx(lin(c, d))} = 180`, `${tx(lin(a + c, b + d))} = 180`, `${tx(coefT(a + c, 'x'))} = ${180 - b - d}, so <i>x</i> = ${B(x)}`] };
        },
        () => {
          let x, k, c; do { x = r.int(15, 45); k = r.int(2, 3); c = r.int(5, 40); } while ((k + 2) * x + c !== 180 && ((c = 180 - (k + 2) * x) < 5 || c > 60));
          if ((k + 2) * x + c !== 180) c = 180 - (k + 2) * x;
          const big = Math.max(x, k * x, x + c);
          return { html: `The angles in a triangle are ${B('<i>x</i>°')}, ${B(tx(k + 'x') + '°')} and ${B(ang(1, c))}. Work out the size of the ${B('largest')} angle.`, ...x8deg(big), unit: '°', hint: 'Make an equation equal to 180, solve for x, then work out each angle.',
            steps: [`x + ${tx(k + 'x')} + ${tx(lin(1, c))} = 180`, `${tx(lin(k + 2, c))} = 180, so ${tx(coefT(k + 2, 'x'))} = ${180 - c} and <i>x</i> = ${x}`, `Angles: ${x}°, ${k * x}°, ${x + c}°`, `Largest angle = ${B(deg(big))}`] };
        },
        () => {
          let ks, x, m; do { ks = r.pick([[1, 2, 3], [2, 3, 4], [1, 3, 4], [1, 2, 5], [2, 2, 3]]); x = r.int(15, 50); m = 360 - sum(ks) * x; } while (m < 20 || m > 170);
          return { html: `Four angles meet at a point. They are ${ks.map((k) => B(tx(coefT(k, 'x')) + '°')).join(', ')} and ${B(deg(m))}. Work out the value of ${B('<i>x</i>')}.`, answerLabel: 'x =', ...nAns(x), hint: 'Angles around a point add up to 360°.',
            steps: [`${ks.map((k) => tx(coefT(k, 'x'))).join(' + ')} + ${m} = 360`, `${tx(coefT(sum(ks), 'x'))} = 360 − ${m} = ${360 - m}`, `<i>x</i> = ${360 - m} ÷ ${sum(ks)} = ${B(x)}`] };
        },
        () => {
          let x, a, b, apex; do { x = r.int(10, 30); a = r.int(-10, 25); b = r.int(5, 40); apex = x + b; } while (a === 0 || 2 * (2 * x + a) + apex !== 180 && false);
          // choose b so the angles add to 180
          b = 180 - 2 * (2 * x + a) - x; apex = x + b;
          if (b <= 0 || apex < 10 || apex === 2 * x + a) { x = 20; a = 15; b = 180 - 2 * 55 - 20; apex = x + b; }
          return { html: `An isosceles triangle has two equal base angles of ${B(ang(2, a))} each. The third angle is ${B(ang(1, b))}. Work out the size of the third angle.`, ...x8deg(apex), unit: '°', hint: 'Add all three angles, set equal to 180 and solve for x.',
            steps: [`${tx(lin(2, a))} + ${tx(lin(2, a))} + ${tx(lin(1, b))} = 180`, `${tx(lin(5, 2 * a + b))} = 180, so 5<i>x</i> = ${180 - 2 * a - b} and <i>x</i> = ${x}`, `Third angle = ${x} + ${b} = ${B(deg(apex))}`] };
        },
      ])();
    }],
]);

// ---------------------------------------------------------------- fractions
addStyles('y8-fractions', [
  ['Problems in context',
    'To find a fraction of an amount, divide by the denominator and multiply by the numerator. Read carefully: is the fraction of the whole amount, or of what is left?',
    (r) => {
      const nm = r.pick(X8N);
      const fr = (lo, hi) => { let a, b; do { b = r.int(lo, hi); a = r.int(1, b - 1); } while (gcd(a, b) !== 1); return [a, b]; };
      return r.pick([
        () => {
          let a, b, c, d, N; do { [a, b] = fr(3, 6); [c, d] = fr(2, 5); N = b * d * r.int(2, 8); } while (N > 400 || N < 30);
          const r1_ = N * (b - a) / b, s2 = r1_ * c / d, left = r1_ - s2; const [x, y] = r.pick([['a coat', 'shoes'], ['a games console', 'games'], ['a train ticket', 'food'], ['concert tickets', 'a T-shirt']]);
          return { html: `${nm} has ${B('£' + N)}. ${nm} spends ${B(frac(a, b))} of it on ${x}, then spends ${B(frac(c, d))} of what is left on ${y}. How much money does ${nm} have left?`, ...nAns(left, { money: true }), format: 'Type the amount in pounds, e.g. 36', hint: 'The second fraction is of what is left, not of the original amount.',
            steps: [`${frac(a, b)} of £${N} = £${N} ÷ ${b} × ${a} = £${N * a / b}`, `Left: £${N} − £${N * a / b} = £${r1_}`, `${frac(c, d)} of £${r1_} = £${s2}`, `Money left = £${r1_} − £${s2} = ${B('£' + left)}`] };
        },
        () => {
          let a, b, c, d, n; do { [a, b] = fr(2, 6); [c, d] = fr(2, 8); n = lcm(b, d) * r.int(1, 6); } while (b === d || a / b + c / d >= 0.9 || n < 20 || n > 240);
          const w = n * a / b, bs = n * c / d, car = n - w - bs;
          return { html: `There are ${B(n)} students in Year 8. ${B(frac(a, b))} of them walk to school and ${B(frac(c, d))} of them come by bus. The rest come by car. How many students come by car?`, ...nAns(car), hint: 'Work out how many walk and how many come by bus.',
            steps: [`Walk: ${n} ÷ ${b} × ${a} = ${w}`, `Bus: ${n} ÷ ${d} × ${c} = ${bs}`, `Car: ${n} − ${w} − ${bs} = ${B(car)}`] };
        },
        () => {
          let a, b, c, d; do { [a, b] = fr(2, 8); [c, d] = fr(2, 8); } while (b === d || a / b + c / d >= 1);
          const L = lcm(b, d), N = L - a * L / b - c * L / d; const what = r.pick(['pizza', 'cake', 'chocolate bar', 'pie']);
          return { html: `${nm} eats ${B(frac(a, b))} of a ${what}. A friend eats ${B(frac(c, d))} of the same ${what}. What fraction of the ${what} is left? Give your answer in its simplest form.`, ...fAns(N, L), hint: 'Add the fractions eaten, then take the total away from 1.',
            steps: [`Common denominator ${L}: ${frac(a, b)} = ${frac(a * L / b, L)}, ${frac(c, d)} = ${frac(c * L / d, L)}`, `Eaten: ${frac(a * L / b + c * L / d, L)}`, `Left: 1 − ${frac(a * L / b + c * L / d, L)} = ${frac(N, L)}${gcd(N, L) > 1 ? ' = ' + B(fracS(N, L)) : ''}`, `Answer: ${B(fracS(N, L))}`] };
        },
        () => {
          const [a, b] = r.pick([[3, 4], [2, 3], [3, 5], [2, 5], [3, 8], [5, 8]]); let W; do { W = r.int(2, 9); } while ((W * b) % a === 0 && r.chance(0.6));
          const exact = W * b / a, n = Math.floor(exact); const ing = r.pick(['flour', 'sugar', 'oats', 'rice']);
          return { html: `One batch of a recipe needs ${B(frac(a, b) + ' kg')} of ${ing}. ${nm} has ${B(W + ' kg')} of ${ing}. How many ${B('full')} batches can ${nm} make?`, ...nAns(n), hint: `Work out ${W} ÷ ${frac(a, b)}.`,
            steps: [`Batches = ${W} ÷ ${frac(a, b)} = ${W} × ${frac(b, a)}`, `= ${frac(W * b, a)}${(W * b) % a ? ` = ${Math.floor(W * b / a)}${frac((W * b) % a, a)}` : ` = ${exact}`}`, `${nm} can make ${B(n)} full batches.`] };
        },
        () => {
          const q = r.pick([2, 3, 4, 5, 6, 8, 10]); const ds_ = [2, 3, 4, 5, 6, 8, 10].filter((d) => q % d === 0); const d = r.pick(ds_); let n; do { n = r.int(1, d - 1); } while (gcd(n, d) !== 1 && d > 1);
          const w = r.int(1, 6); const pieces = w * q + n * q / d; const it = r.pick(['ribbon', 'rope', 'wood', 'pipe']);
          return { html: `A length of ${it} is ${B(w + (d > 1 ? frac(n, d) : '') + ' metres')} long. It is cut into pieces that are each ${B(frac(1, q) + ' metre')} long. How many pieces are there?`, ...nAns(pieces), hint: `How many ${ord(q).replace(/^\d+/, q === 2 ? 'halve' : q + '')}s are in one metre?`.replace(/2halves/, 'halves'),
            steps: [`Write as an improper fraction: ${w}${frac(n, d)} = ${frac(w * d + n, d)}`, `Number of pieces = ${frac(w * d + n, d)} ÷ ${frac(1, q)} = ${frac(w * d + n, d)} × ${q}`, `= ${B(pieces)}`] };
        },
      ])();
    }],
  ['Reverse problem',
    'If a fraction has been used, the fraction left is 1 minus it. The known amount matches that fraction: divide by its numerator to find one part, then multiply by the denominator to find the whole.',
    (r) => {
      const nm = r.pick(X8N);
      const fr = (lo, hi) => { let a, b; do { b = r.int(lo, hi); a = r.int(1, b - 1); } while (gcd(a, b) !== 1); return [a, b]; };
      return r.pick([
        () => {
          const [a, b] = fr(3, 8), k = r.int(3, 15), st = b * k, L = (b - a) * k;
          return { html: `${nm} spends ${B(frac(a, b))} of their savings on a phone. ${nm} has ${B('£' + L)} left. How much did ${nm} have to start with?`, ...nAns(st, { money: true }), format: 'Type the amount in pounds, e.g. 120', hint: `£${L} is ${frac(b - a, b)} of the savings.`,
            steps: [`Fraction left = 1 − ${frac(a, b)} = ${frac(b - a, b)}`, `${frac(b - a, b)} = £${L}, so ${frac(1, b)} = £${L} ÷ ${b - a} = £${k}`, `Savings = ${b} × £${k} = ${B('£' + st)}`] };
        },
        () => {
          const [a, b] = fr(3, 8), k = r.int(4, 30), tot = b * k, R = (b - a) * k; const how = r.pick(['cycles', 'walks', 'drives', 'runs']);
          return { html: `${nm} ${how} ${B(frac(a, b))} of a journey. There are still ${B(R + ' km')} to go. How long is the whole journey?`, ...nAns(tot, { unit: 'km' }), unit: 'km', hint: `${R} km is the fraction that is still to go.`,
            steps: [`Still to go: 1 − ${frac(a, b)} = ${frac(b - a, b)}`, `${frac(1, b)} of the journey = ${R} ÷ ${b - a} = ${k} km`, `Whole journey = ${b} × ${k} = ${B(tot)} km`] };
        },
        () => {
          const [a, b] = fr(3, 9), k = r.int(10, 50), tot = b * k, P = a * k;
          return { html: `${nm} has read ${B(frac(a, b))} of a book. That is ${B(P + ' pages')}. How many pages has ${nm} still to read?`, ...nAns(tot - P), hint: 'Find the total number of pages first.',
            steps: [`${frac(a, b)} = ${P} pages, so ${frac(1, b)} = ${P} ÷ ${a} = ${k} pages`, `Whole book = ${b} × ${k} = ${tot} pages`, `Still to read = ${tot} − ${P} = ${B(tot - P)}`] };
        },
        () => {
          const [a, b] = r.pick([[1, 4], [3, 8], [2, 5], [1, 3], [3, 5], [1, 5], [2, 3]]), k = r.int(4, 16), cap = b * k, now = a * k;
          return { html: `A car’s fuel tank is ${B(frac(a, b))} full. It contains ${B(now + ' litres')} of fuel. How many more litres are needed to fill the tank?`, ...nAns(cap - now, { unit: 'litres' }), unit: 'litres', hint: 'Find the capacity of the full tank first.',
            steps: [`${frac(a, b)} of the tank = ${now} litres, so ${frac(1, b)} = ${k} litres`, `Full tank = ${b} × ${k} = ${cap} litres`, `More needed = ${cap} − ${now} = ${B(cap - now)} litres`] };
        },
        () => {
          const [a, b] = fr(3, 7), k = r.int(3, 8), tot = b * k, G = (b - a) * k;
          return { html: `In a class, ${B(frac(a, b))} of the students are girls. There are ${B(G)} boys. How many students are in the class?`, ...nAns(tot), hint: `The boys are ${frac(b - a, b)} of the class.`,
            steps: [`Boys = 1 − ${frac(a, b)} = ${frac(b - a, b)} of the class`, `${frac(1, b)} of the class = ${G} ÷ ${b - a} = ${k}`, `Class = ${b} × ${k} = ${B(tot)} students`] };
        },
      ])();
    }],
]);

// ---------------------------------------------------------------- FDP
addStyles('y8-decimals-percentages', [
  ['Problems in context',
    'Change fractions and percentages into the same form to compare them. To find a percentage of an amount, find 10% (÷ 10) or 1% (÷ 100) and build up, or multiply by the decimal.',
    (r) => {
      const nm = r.pick(X8N);
      return r.pick([
        () => {
          const P = 5 * r.int(4, 60), x = r.pick([10, 15, 20, 25, 30, 35, 40]); const off = P * x / 100, sale = P - off; const it = r.pick(['jacket', 'pair of trainers', 'bike helmet', 'lamp', 'watch']);
          return { html: `A ${it} normally costs ${B('£' + P)}. In a sale, the price is reduced by ${B(x + '%')}. What is the sale price?`, ...nAns(sale, { money: true }), format: 'Type the amount in pounds, e.g. 42.50', hint: `Find ${x}% of £${P}, then subtract.`,
            steps: [`10% of £${P} = £${ds(P / 10)}`, `${x}% of £${P} = ${ds(x / 10)} × £${ds(P / 10)} = ${money(off)}`, `Sale price = £${P} − ${money(off)} = ${B(money(sale))}`] };
        },
        () => {
          let P, a, b, x, A, Bv; do { P = 20 * r.int(2, 20); [a, b] = r.pick([[1, 4], [1, 5], [1, 3], [3, 10], [2, 5]]); x = r.pick([15, 20, 25, 30, 35]); A = P * a / b; Bv = P * x / 100; } while (A === Bv || (A * 100) % 1);
          const it = r.pick(['tablet', 'sofa', 'bike', 'TV']);
          return { html: `The same ${it} costs ${B('£' + P)} in two shops. Shop A offers ${B(frac(a, b) + ' off')}. Shop B offers ${B(x + '% off')}. How much cheaper is the ${it} at the shop with the better offer?`, ...nAns(Math.abs(A - Bv), { money: true }), format: 'Type the amount in pounds, e.g. 4', hint: 'Work out the discount in each shop.',
            steps: [`Shop A discount: ${frac(a, b)} of £${P} = ${x8m(rnd(A, 2))}`, `Shop B discount: ${x}% of £${P} = ${x8m(rnd(Bv, 2))}`, `Difference = ${x8m(rnd(Math.max(A, Bv), 2))} − ${x8m(rnd(Math.min(A, Bv), 2))} = ${B(money(Math.abs(A - Bv)))}`] };
        },
        () => {
          let b, a, p, e; do { b = r.pick([20, 25, 40, 50, 80]); a = r.int(Math.ceil(b * 0.3), b - 1); p = a * 100 / b; e = r.int(30, 98); } while (p % 1 || p === e);
          const [s1, s2] = r.sample(['Maths', 'Science', 'English', 'French', 'History'], 2);
          return { html: `${nm} scored ${B(a + ' out of ' + b)} in a ${s1} test and ${B(e + '%')} in a ${s2} test. What is the difference between the two percentage scores?`, ...nAns(Math.abs(p - e), { unit: '%' }), unit: '%', hint: `Change ${a} out of ${b} into a percentage.`,
            steps: [`${s1}: ${frac(a, b)} = ${frac(a * 100 / b, 100)} = ${p}%`, `${s2}: ${e}%`, `Difference = ${Math.max(p, e)} − ${Math.min(p, e)} = ${B(Math.abs(p - e) + '%')}`] };
        },
        () => {
          let n, a, b, x, D, C; do { n = r.pick([40, 60, 80, 100, 120, 200, 240]); [a, b] = r.pick([[1, 4], [3, 8], [2, 5], [1, 5], [3, 10], [1, 8]]); x = r.pick([10, 15, 20, 25, 30, 35]); D = n * a / b; C = n * x / 100; } while (D % 1 || C % 1 || D + C >= n);
          const pl = r.pick(['A survey asked', 'A vet asked', 'A school asked', 'A club asked']);
          return { html: `${pl} ${B(n)} people about their pets. ${B(frac(a, b))} of them have only a dog, ${B(x + '%')} have only a cat, and the rest have no pets. How many people have no pets?`, ...nAns(n - D - C), hint: 'Work out how many have a dog and how many have a cat.',
            steps: [`Dog: ${frac(a, b)} of ${n} = ${D}`, `Cat: ${x}% of ${n} = ${C}`, `No pets: ${n} − ${D} − ${C} = ${B(n - D - C)}`] };
        },
        () => {
          let M, x, k, tot; do { M = r.int(30, 160) + r.pick([0, 0.5]); x = r.pick([10, 12.5, 15, 20]); k = r.int(2, 6); tot = M * (1 + x / 100); } while (Math.abs(tot * 100 - Math.round(tot * 100)) > 1e-6 || Math.round(tot * 100) % k);
          return { html: `${k} friends have a meal in a restaurant. The food costs ${B(money(M))}. A service charge of ${B(ds(x) + '%')} is added to the bill. They share the total bill equally. How much does each friend pay?`, ...nAns(tot / k, { money: true }), format: 'Type the amount in pounds, e.g. 23.10', hint: 'Find the service charge, add it on, then divide.',
            steps: [`Service charge = ${ds(x)}% of ${money(M)} = ${money(M * x / 100)}`, `Total bill = ${money(M)} + ${money(M * x / 100)} = ${money(tot)}`, `Each pays ${money(tot)} ÷ ${k} = ${B(money(tot / k))}`] };
        },
      ])();
    }],
]);

// ---------------------------------------------------------------- expanding brackets
addStyles('y8-expanding-brackets', [
  ['Problems in context',
    'Write an expression with brackets that fits the situation, then multiply every term inside each bracket by the term outside. Collect like terms to simplify.',
    (r) => {
      const nm = r.pick(X8N);
      return r.pick([
        () => {
          const a = r.int(1, 12), b = r.int(2, 9); const ans = lin(b, a * b);
          const it = r.pick(['A rectangular garden', 'A rectangular patio', 'A rectangular classroom', 'A rectangular swimming pool']);
          return { html: `${it} is ${B('(' + tx(lin(1, a)) + ') m')} long and ${B(b + ' m')} wide. Write an expression for its area. Give your answer without brackets.`, answerLabel: 'Area =', ...eAns(ans, { form: 'expanded' }), unit: 'm²', hint: 'Area = length × width; multiply both terms in the bracket.',
            steps: [`Area = ${b}(${tx(lin(1, a))})`, `${b} × <i>x</i> = ${tx(b + 'x')} and ${b} × ${a} = ${a * b}`, `Area = ${B(tx(ans))} m²`] };
        },
        () => {
          const k = r.int(2, 8), a = r.int(1, 6), c = r.int(2, 9); const ans = lin(k, k * a + c);
          return { html: `${k} friends each order a meal costing ${B('£(' + tx(lin(1, a)) + ')')}. They also pay a delivery charge of ${B('£' + c)} in total. Write an expression, without brackets and in its simplest form, for the total cost in pounds.`, answerLabel: 'Cost =', ...eAns(ans, { form: 'expanded' }), hint: 'Total = number of meals × cost of one meal + delivery.',
            steps: [`Total = ${k}(${tx(lin(1, a))}) + ${c}`, `Expand: ${tx(lin(k, k * a))} + ${c}`, `Total = ${B(tx(ans))}`] };
        },
        () => {
          const a = r.int(2, 9), b = r.int(2, 6), c = r.int(1, 20); const ans = lin(b, a * b - c, 'n');
          return { html: `${nm} thinks of a number, ${B('<i>n</i>')}. ${nm} adds ${B(a)}, multiplies the result by ${B(b)}, then subtracts ${B(c)}. Write an expression, without brackets and in its simplest form, for ${nm}’s answer.`, answerLabel: 'Answer =', ...eAns(ans, { form: 'expanded' }), format: 'Type an expression in n, e.g. 3n+2', hint: 'Use a bracket for “add, then multiply”.',
            steps: [`Add ${a}: ${tx(lin(1, a, 'n'))}; multiply by ${b}: ${b}(${tx(lin(1, a, 'n'))})`, `Subtract ${c}: ${b}(${tx(lin(1, a, 'n'))}) − ${c}`, `Expand: ${tx(lin(b, a * b, 'n'))} − ${c} = ${B(tx(ans))}`] };
        },
        () => {
          let a, b; do { a = r.int(1, 9); b = r.int(1, 9); } while (a === b);
          const ans = lin(6, 2 * a - 2 * b);
          return { html: `A rectangle has length ${B('(' + tx(lin(2, -b)) + ') cm')} and width ${B('(' + tx(lin(1, a)) + ') cm')}. Write an expression, without brackets and in its simplest form, for the perimeter of the rectangle.`, answerLabel: 'Perimeter =', ...eAns(ans, { form: 'expanded' }), unit: 'cm', hint: 'Perimeter = 2 × length + 2 × width.',
            steps: [`Perimeter = 2(${tx(lin(2, -b))}) + 2(${tx(lin(1, a))})`, `Expand: ${tx(lin(4, -2 * b))} + ${tx(lin(2, 2 * a))}`, `Collect: ${B(tx(ans))} cm`] };
        },
        () => {
          let a, b, c, d; do { a = r.int(2, 6); b = r.int(1, 8); c = r.int(2, 6); d = r.int(1, 8); } while (a * b === c * d);
          const ans = lin(a + c, a * b - c * d);
          return { html: `A garden has two rectangular lawns. One lawn is ${B(a + ' m')} by ${B('(' + tx(lin(1, b)) + ') m')}. The other lawn is ${B(c + ' m')} by ${B('(' + tx(lin(1, -d)) + ') m')}. Write an expression, without brackets and in its simplest form, for the total area of lawn.`, answerLabel: 'Area =', ...eAns(ans, { form: 'expanded' }), unit: 'm²', hint: 'Find each area as a bracket, expand, then collect like terms.',
            steps: [`Total = ${a}(${tx(lin(1, b))}) + ${c}(${tx(lin(1, -d))})`, `Expand: ${tx(lin(a, a * b))} + ${tx(lin(c, -c * d))}`, `Collect: ${B(tx(ans))} m²`] };
        },
      ])();
    }],
  ['Reasoning: show that',
    'Call the starting number n. Write each instruction as algebra, expand any brackets and simplify. If the n terms cancel out, the final answer is the same whatever number you start with.',
    (r) => {
      const nm = r.pick(X8N);
      const o = r.pick([
        () => { const k = r.int(2, 9), m = r.int(2, 12); return { ins: `multiply it by ${k}, add ${k * m}, divide the result by ${k}, then subtract the number you first thought of`, s: [`Start: <i>n</i>. Multiply by ${k}: ${tx(k + 'n')}. Add ${k * m}: ${tx(lin(k, k * m, 'n'))}`, `Divide by ${k}: (${tx(lin(k, k * m, 'n'))}) ÷ ${k} = ${tx(lin(1, m, 'n'))}`, `Subtract <i>n</i>: ${tx(lin(1, m, 'n'))} − <i>n</i> = ${m}`], v: m }; },
        () => { const a = r.int(2, 9), k = r.int(2, 6); return { ins: `add ${a}, multiply the result by ${k}, then subtract ${k} times the number you first thought of`, s: [`Start: <i>n</i>. Add ${a}: ${tx(lin(1, a, 'n'))}`, `Multiply by ${k}: ${k}(${tx(lin(1, a, 'n'))}) = ${tx(lin(k, k * a, 'n'))}`, `Subtract ${tx(k + 'n')}: ${tx(lin(k, k * a, 'n'))} − ${tx(k + 'n')} = ${k * a}`], v: k * a }; },
        () => { let a, b; do { a = r.int(3, 15); b = 2 * r.int(1, 7); } while (2 * a <= b); return { ins: `add ${a}, double the result, subtract ${b}, halve the result, then subtract the number you first thought of`, s: [`Add ${a} and double: 2(${tx(lin(1, a, 'n'))}) = ${tx(lin(2, 2 * a, 'n'))}`, `Subtract ${b}: ${tx(lin(2, 2 * a - b, 'n'))}; halve: ${tx(lin(1, a - b / 2, 'n'))}`, `Subtract <i>n</i>: ${a - b / 2}`], v: a - b / 2 }; },
        () => { const a = r.int(2, 9), b = r.int(1, 9), k = r.int(2, 5); return { ins: `work out ${k} × (the number + ${a}) and ${k} × (the number − ${b}), then subtract the second answer from the first`, s: [`${k}(${tx(lin(1, a, 'n'))}) = ${tx(lin(k, k * a, 'n'))}`, `${k}(${tx(lin(1, -b, 'n'))}) = ${tx(lin(k, -k * b, 'n'))}`, `(${tx(lin(k, k * a, 'n'))}) − (${tx(lin(k, -k * b, 'n'))}) = ${k * a} + ${k * b} = ${k * (a + b)}`], v: k * (a + b) }; },
      ])();
      return { html: `${nm} says: “Think of any number, ${o.ins}. You always get the same answer!” Use algebra to show that ${nm} is right. What is the final answer always equal to?`, ...nAns(o.v), hint: 'Let the starting number be n and expand any brackets.',
        steps: [...o.s, `The <i>n</i> terms cancel, so the answer is always ${B(ds(o.v))}.`] };
    }],
]);

// ---------------------------------------------------------------- linear equations
addStyles('y8-linear-equations', [
  ['Exam-style problem',
    'Use a letter for the unknown, write an equation from the information, and solve it with inverse operations. Read the question again — it may ask for something you work out from x.',
    (r) => {
      const nm = r.pick(X8N);
      return r.pick([
        () => {
          const x = r.int(2, 15), a = r.int(1, 9), askL = r.chance(); const P = 6 * x + 2 * a;
          return { html: `A rectangle has length ${B('(' + tx(lin(2, a)) + ') cm')} and width ${B(tx('x') + ' cm')}. Its perimeter is ${B(P + ' cm')}. Work out the ${askL ? 'length' : 'width'} of the rectangle.`, ...nAns(askL ? 2 * x + a : x, { unit: 'cm' }), unit: 'cm', hint: 'Add all four sides and set equal to the perimeter.',
            steps: [`${tx(lin(2, a))} + <i>x</i> + ${tx(lin(2, a))} + <i>x</i> = ${P}`, `${tx(lin(6, 2 * a))} = ${P}, so 6<i>x</i> = ${P - 2 * a}`, `<i>x</i> = ${x}`, askL ? `Length = 2 × ${x} + ${a} = ${B(2 * x + a)} cm` : `Width = ${B(x)} cm`] };
        },
        () => {
          const x = r.int(6, 15), a = r.int(2, 6), k = r.int(3, 4); const S = x + (x + a) + k * x;
          return { html: `${nm} is ${B('<i>x</i>')} years old. ${nm}’s sister is ${B(a)} years older than ${nm}. Their dad is ${B(k)} times as old as ${nm}. Their ages add up to ${B(S)}. How old is their dad?`, ...nAns(k * x, { unit: 'years' }), unit: 'years', hint: 'Write each age in terms of x, add, and solve.',
            steps: [`<i>x</i> + (${tx(lin(1, a))}) + ${tx(k + 'x')} = ${S}`, `${tx(lin(k + 2, a))} = ${S}, so ${tx(coefT(k + 2, 'x'))} = ${S - a}`, `<i>x</i> = ${x}`, `Dad = ${k} × ${x} = ${B(k * x)} years old`] };
        },
        () => {
          const n = r.int(3, 8), p = r.int(7, 30) * 5, c = r.int(10, 40) * 10; const T = n * p + c;
          const [x, y] = r.pick([['pens', 'a notebook'], ['bread rolls', 'a cake'], ['stickers', 'a scrapbook'], ['bottles of water', 'a sandwich']]);
          return { html: `${nm} buys ${B(n)} ${x} and ${y}. ${y[0].toUpperCase() + y.slice(1)} costs ${B(money(c / 100))}. Altogether ${nm} pays ${B(money(T / 100))}. The ${x} all cost the same. Work out the cost of one of the ${x}.`, ...nAns(p / 100, { money: true }), format: 'Type the amount in pounds, e.g. 0.85', hint: 'Let one item cost £x and write an equation.',
            steps: [`${n}<i>x</i> + ${fx(c / 100, 2)} = ${fx(T / 100, 2)}`, `Subtract ${fx(c / 100, 2)}: ${n}<i>x</i> = ${fx(n * p / 100, 2)}`, `Divide by ${n}: <i>x</i> = ${B(money(p / 100))}`] };
        },
        () => {
          let x, a, b; do { x = r.int(25, 45); a = r.int(5, 40); b = 4 * x + a - 180; } while (b <= 0 || b >= 2 * x - 10 || b === a);
          return { html: `The angles of a triangle are ${B('<i>x</i>°')}, ${B('(' + tx(lin(1, a)) + ')°')} and ${B('(' + tx(lin(2, -b)) + ')°')}. Work out the value of ${B('<i>x</i>')}.`, answerLabel: 'x =', ...nAns(x), hint: 'Angles in a triangle add up to 180°.',
            steps: [`<i>x</i> + ${tx(lin(1, a))} + ${tx(lin(2, -b))} = 180`, `${tx(lin(4, a - b))} = 180`, `4<i>x</i> = ${180 - a + b}, so <i>x</i> = ${B(x)}`] };
        },
        () => {
          const kind = r.pick(['consecutive whole numbers', 'consecutive even numbers', 'consecutive odd numbers']); const step = kind.includes('whole') ? 1 : 2;
          let x; do { x = r.int(5, 60); } while ((step === 2) && ((kind.includes('even') && x % 2) || (kind.includes('odd') && x % 2 === 0)));
          const S = 3 * x + 3 * step;
          return { html: `Three ${kind} add up to ${B(S)}. What is the ${B('largest')} of the three numbers?`, ...nAns(x + 2 * step), hint: `Call the smallest number x; the others are x + ${step} and x + ${2 * step}.`,
            steps: [`<i>x</i> + (${tx(lin(1, step))}) + (${tx(lin(1, 2 * step))}) = ${S}`, `${tx(lin(3, 3 * step))} = ${S}, so 3<i>x</i> = ${S - 3 * step} and <i>x</i> = ${x}`, `Largest = ${x} + ${2 * step} = ${B(x + 2 * step)}`] };
        },
      ])();
    }],
]);

// ---------------------------------------------------------------- perimeter & area
addStyles('y8-perimeter-area', [
  ['Problems in context',
    'Work out the area or perimeter you need first. Then use it: divide by how much one item covers (rounding UP to whole packs, tins or panels you must buy) and multiply by the price.',
    (r) => {
      const nm = r.pick(X8N);
      return r.pick([
        () => {
          const l = r.int(6, 20), w = r.int(4, 12), c = r.pick([10, 15, 20, 25]), p = r.pick([4, 5, 6, 7.5, 8, 9.5]); const A = l * w, n = Math.ceil(A / c);
          return { html: `${nm}’s lawn is a rectangle ${B(l + ' m')} by ${B(w + ' m')}. A box of grass seed covers ${B(c + ' m²')} and costs ${B(x8m(p))}. ${nm} needs enough seed to cover the whole lawn. How much will the boxes of seed cost?`, ...nAns(n * p, { money: true }), format: 'Type the amount in pounds, e.g. 37.50', hint: 'Find the area, then how many whole boxes are needed.',
            steps: [`Area = ${l} × ${w} = ${A} m²`, `Boxes = ${A} ÷ ${c} = ${ds(rnd(A / c, 2))}${A % c ? '…, so round up to ' + n : ''}`, `Cost = ${n} × ${x8m(p)} = ${B(money(n * p))}`] };
        },
        () => {
          const l = 2 * r.int(3, 10), w = 2 * r.int(2, 8), p = r.pick([18, 22, 25, 30, 35, 40]); const len = l + 2 * w, panels = len / 2;
          return { html: `A rectangular garden is ${B(l + ' m')} long and ${B(w + ' m')} wide. One of the ${l} m sides is the wall of a house. The other three sides need fencing. Fence panels are ${B('2 m')} wide and cost ${B('£' + p)} each. Work out the total cost of the panels.`, ...nAns(panels * p, { money: true }), format: 'Type the amount in pounds, e.g. 330', hint: 'Only three sides need fencing.',
            steps: [`Length of fencing = ${l} + ${w} + ${w} = ${len} m`, `Panels = ${len} ÷ 2 = ${panels}`, `Cost = ${panels} × £${p} = ${B('£' + panels * p)}`] };
        },
        () => {
          const s = r.pick([10, 15, 20, 25]), a = s * r.int(4, 12), b = s * r.int(3, 10), box = r.pick([10, 12, 20, 25]); const t = (a / s) * (b / s), n = Math.ceil(t / box);
          return { html: `A wall is ${B(a + ' cm')} wide and ${B(b + ' cm')} high. It is to be covered with square tiles of side ${B(s + ' cm')}. Tiles are sold in boxes of ${B(box)}. How many boxes of tiles are needed?`, ...nAns(n), hint: 'Find how many tiles fit along each edge.',
            steps: [`Tiles across = ${a} ÷ ${s} = ${a / s}; tiles up = ${b} ÷ ${s} = ${b / s}`, `Tiles needed = ${a / s} × ${b / s} = ${t}`, `Boxes = ${t} ÷ ${box} = ${ds(rnd(t / box, 2))}${t % box ? '…, round up' : ''}`, `${B(n)} boxes`] };
        },
        () => {
          let a, b, h, A; do { a = r.int(2, 8); b = r.int(a + 1, 14); h = r.int(2, 8); A = (a + b) * h / 2; } while (A % 1);
          const c = r.pick([2, 3, 4, 5]), n = Math.ceil(A / c);
          return { html: `A flowerbed is a trapezium. Its parallel sides are ${B(a + ' m')} and ${B(b + ' m')}, and the perpendicular distance between them is ${B(h + ' m')}. One bag of compost covers ${B(c + ' m²')}. How many bags are needed to cover the whole flowerbed?`, ...nAns(n), hint: 'Area of a trapezium = ½(a + b)h.',
            steps: [`Area = ½ × (${a} + ${b}) × ${h} = ${A} m²`, `Bags = ${A} ÷ ${c} = ${ds(rnd(A / c, 2))}${A % c ? '…, round up' : ''}`, `${B(n)} bags`] };
        },
        () => {
          const l = r.int(3, 8), h = r.pick([2.5, 3]), cov = r.pick([10, 12, 15]), tin = r.pick([12, 15, 18, 20]); const A = l * h - 2; const n = Math.ceil(A / cov);
          return { html: `${nm} is painting one wall of a room. The wall is ${B(l + ' m')} long and ${B(ds(h) + ' m')} high, and has a door ${B('2 m')} high and ${B('1 m')} wide that will not be painted. One tin of paint covers ${B(cov + ' m²')} and costs ${B('£' + tin)}. How much will the paint cost?`, ...nAns(n * tin, { money: true }), format: 'Type the amount in pounds, e.g. 36', hint: 'Subtract the area of the door from the area of the wall.',
            steps: [`Wall = ${l} × ${ds(h)} = ${ds(l * h)} m²; door = 2 × 1 = 2 m²`, `Area to paint = ${ds(l * h)} − 2 = ${ds(A)} m²`, `Tins = ${ds(A)} ÷ ${cov} = ${ds(rnd(A / cov, 2))}${A % cov ? '…, round up to ' + n : ''}`, `Cost = ${n} × £${tin} = ${B('£' + n * tin)}`] };
        },
      ])();
    }],
  ['Reverse problem',
    'Use an area or perimeter formula backwards to find a missing length: width = area ÷ length, height of a triangle = 2 × area ÷ base. Then use that length to answer the question.',
    (r) => {
      const nm = r.pick(X8N);
      return r.pick([
        () => {
          const l = r.int(4, 20), w = r.int(2, 15), u = r.pick(['cm', 'm']); const A = l * w;
          return { html: `A rectangle has an area of ${B(A + ' ' + u + '²')}. Its length is ${B(l + ' ' + u)}. Work out the perimeter of the rectangle.`, ...nAns(2 * (l + w), { unit: u }), unit: u, hint: 'Find the width first.',
            steps: [`Width = ${A} ÷ ${l} = ${w} ${u}`, `Perimeter = 2 × (${l} + ${w})`, `= ${B(2 * (l + w))} ${u}`] };
        },
        () => {
          const s = r.int(3, 25); const it = r.pick(['A square vegetable plot', 'A square patio', 'A square playground', 'A square paddling pool']);
          return { html: `${it} has an area of ${B(s * s + ' m²')}. ${nm} wants to put an edging strip all the way round it. What length of edging is needed?`, ...nAns(4 * s, { unit: 'm' }), unit: 'm', hint: 'The side of a square is the square root of its area.',
            steps: [`Side = √${s * s} = ${s} m`, `Perimeter = 4 × ${s}`, `= ${B(4 * s)} m`] };
        },
        () => {
          let b, h; do { b = r.int(3, 20); h = r.int(3, 18); } while ((b * h) % 2);
          const u = r.pick(['cm', 'm']); const A = b * h / 2;
          return { html: `A triangle has an area of ${B(ds(A) + ' ' + u + '²')}. Its base is ${B(b + ' ' + u)}. Work out the perpendicular height of the triangle.`, ...nAns(h, { unit: u }), unit: u, hint: 'Area = ½ × base × height, so height = 2 × area ÷ base.',
            steps: [`${ds(A)} = ½ × ${b} × <i>h</i>`, `${ds(A)} = ${ds(b / 2)} × <i>h</i>`, `<i>h</i> = ${ds(A)} ÷ ${ds(b / 2)} = ${B(h)} ${u}`] };
        },
        () => {
          const l = r.int(5, 25), w = r.int(2, l - 1), u = r.pick(['cm', 'm']); const P = 2 * (l + w);
          return { html: `A rectangle has a perimeter of ${B(P + ' ' + u)}. Its length is ${B(l + ' ' + u)}. Work out the area of the rectangle.`, ...nAns(l * w, { unit: u + '²' }), unit: u + '²', hint: 'Length + width = half the perimeter.',
            steps: [`Length + width = ${P} ÷ 2 = ${P / 2} ${u}`, `Width = ${P / 2} − ${l} = ${w} ${u}`, `Area = ${l} × ${w} = ${B(l * w)} ${u}²`] };
        },
        () => {
          let a, b, h, A; do { a = r.int(2, 10); b = r.int(a + 1, 16); h = r.int(2, 12); A = (a + b) * h / 2; } while (A % 1);
          return { html: `A trapezium has parallel sides of ${B(a + ' cm')} and ${B(b + ' cm')}. Its area is ${B(A + ' cm²')}. Work out the perpendicular height of the trapezium.`, ...nAns(h, { unit: 'cm' }), unit: 'cm', hint: 'Area = ½(a + b)h. Substitute and solve for h.',
            steps: [`${A} = ½ × (${a} + ${b}) × <i>h</i>`, `${A} = ${ds((a + b) / 2)} × <i>h</i>`, `<i>h</i> = ${A} ÷ ${ds((a + b) / 2)} = ${B(h)} cm`] };
        },
      ])();
    }],
]);

// ---------------------------------------------------------------- averages
addStyles('y8-averages', [
  ['Problems in context',
    'Total = mean × number of values. Working with totals lets you add a new value, combine two groups, or find a missing value. For the median, put the values in order first.',
    (r) => {
      const nm = r.pick(X8N);
      return r.pick([
        () => {
          const n = r.int(4, 10), m = r.int(20, 30), m2 = m + r.pick([-1, 1, 2]); const a = (n + 1) * m2 - n * m;
          const grp = r.pick(['players in a netball team', 'members of a band', 'people in a five-a-side squad', 'staff in a café']);
          return { html: `The mean age of the ${B(n)} ${grp} is ${B(m + ' years')}. A new member aged ${B(a)} joins. What is the mean age now?`, ...nAns(m2, { unit: 'years' }), unit: 'years', hint: 'Find the total age, add the new member, then divide by the new number of people.',
            steps: [`Total age before = ${n} × ${m} = ${n * m}`, `New total = ${n * m} + ${a} = ${n * m + a}`, `New mean = ${n * m + a} ÷ ${n + 1} = ${B(m2)} years`] };
        },
        () => {
          let n, m, m2, s; do { n = r.int(3, 6); m = r.int(50, 80); m2 = m + r.int(1, 5); s = (n + 1) * m2 - n * m; } while (s > 100);
          return { html: `${nm} has taken ${B(n)} tests, and the mean mark is ${B(m)}. After one more test the mean mark goes up to ${B(m2)}. What mark did ${nm} get in the last test?`, ...nAns(s), hint: 'Compare the total marks before and after.',
            steps: [`Total of ${n} tests = ${n} × ${m} = ${n * m}`, `Total of ${n + 1} tests = ${n + 1} × ${m2} = ${(n + 1) * m2}`, `Last test = ${(n + 1) * m2} − ${n * m} = ${B(s)}`] };
        },
        () => {
          let nA, nB, mA, mB, tot; do { nA = r.int(12, 30); nB = r.int(12, 30); mA = r.int(40, 75); mB = r.int(40, 75); tot = nA * mA + nB * mB; } while (mA === mB || tot % (nA + nB));
          return { html: `In a test, the ${B(nA)} students in class A have a mean score of ${B(mA)}. The ${B(nB)} students in class B have a mean score of ${B(mB)}. Work out the mean score of all the students together.`, ...nAns(tot / (nA + nB)), hint: 'You cannot just average the two means — use totals.',
            steps: [`Class A total = ${nA} × ${mA} = ${nA * mA}`, `Class B total = ${nB} × ${mB} = ${nB * mB}`, `Combined total = ${tot}, students = ${nA + nB}`, `Mean = ${tot} ÷ ${nA + nB} = ${B(tot / (nA + nB))}`] };
        },
        () => {
          let xs, mean, med; do { xs = Array.from({ length: 7 }, () => r.int(10, 60)); mean = sum(xs) / 7; const s = xs.slice().sort((a, b) => a - b); med = s[3]; } while (mean % 1 || mean === med);
          const s = xs.slice().sort((a, b) => a - b); const what = r.pick(['ice creams sold by a kiosk', 'books borrowed from a library', 'cars using a car park', 'bikes hired from a shop']);
          return { html: `The numbers of ${what} on 7 days were:<br>${B(xs.join(', '))}<br>Work out the difference between the mean and the median.`, ...nAns(Math.abs(mean - med)), hint: 'Find the mean and the median separately, then subtract.',
            steps: [`Mean = ${sum(xs)} ÷ 7 = ${mean}`, `In order: ${s.join(', ')}, so the median is ${med}`, `Difference = ${Math.max(mean, med)} − ${Math.min(mean, med)} = ${B(Math.abs(mean - med))}`] };
        },
        () => {
          let xs, m, last; do { m = r.int(5, 15); xs = Array.from({ length: 4 }, () => r.int(2, 25)); last = 5 * m - sum(xs); } while (last < 1 || last > 30 || xs.includes(last));
          const all = [...xs, last]; const rg = Math.max(...all) - Math.min(...all);
          return { html: `Five friends get pocket money each week. The mean amount is ${B('£' + m)}. Four of the friends get ${B(xs.map((v) => '£' + v).join(', '))}. Work out the range of the five amounts.`, ...nAns(rg, { money: true }), format: 'Type the amount in pounds, e.g. 12', hint: 'Find the missing amount first using the mean.',
            steps: [`Total = 5 × £${m} = £${5 * m}`, `Missing amount = ${5 * m} − ${sum(xs)} = £${last}`, `Largest = £${Math.max(...all)}, smallest = £${Math.min(...all)}`, `Range = ${Math.max(...all)} − ${Math.min(...all)} = ${B('£' + rg)}`] };
        },
      ])();
    }],
]);

// ---------------------------------------------------------------- rounding
addStyles('y8-rounding', [
  ['Estimation in context',
    'Round every number to 1 significant figure, then do the calculation with the rounded numbers. An estimate lets you check that a calculator answer is sensible.',
    (r) => {
      const nm = r.pick(X8N);
      const sf1 = (lo, hi, u) => r.int(lo, hi) * u;
      return r.pick([
        () => {
          const n1 = sf1(2, 6, 10), p1 = sf1(2, 9, 1) * r.pick([1, 10]); const n = x8pert(r, n1, 0), p = x8pert(r, p1, 2);
          const trip = r.pick(['a theatre trip', 'a museum visit', 'a coach trip', 'an activity day']);
          return { html: `${B(n)} students are going on ${trip}. Each ticket costs ${B(money(p))}. By rounding each number to 1 significant figure, estimate the total cost of the tickets in pounds.`, ...nAns(n1 * p1), answerLabel: '£', hint: 'Round both numbers to 1 s.f. first.',
            steps: [`${n} ≈ ${n1} and ${money(p)} ≈ £${p1}`, `Estimate = ${n1} × ${p1}`, `≈ ${B('£' + commas(String(n1 * p1)))}`] };
        },
        () => {
          let D1, G1; do { D1 = sf1(2, 9, 100); G1 = sf1(2, 9, 10); } while (D1 % G1);
          const D = x8pert(r, D1, 0), G = x8pert(r, G1, 1);
          return { html: `A car travels ${B(D + ' miles')} and uses ${B(ds(G) + ' litres')} of fuel. By rounding each number to 1 significant figure, estimate the number of miles the car travels per litre.`, ...nAns(D1 / G1, { unit: 'miles per litre' }), unit: 'miles per litre', hint: 'Miles per litre = miles ÷ litres.',
            steps: [`${D} ≈ ${D1} and ${ds(G)} ≈ ${G1}`, `Estimate = ${D1} ÷ ${G1}`, `≈ ${B(D1 / G1)} miles per litre`] };
        },
        () => {
          const l1 = sf1(2, 9, 10), w1 = sf1(2, 9, r.pick([1, 10])); const l = x8pert(r, l1, 1), w = x8pert(r, w1, 1);
          const pl = r.pick(['A football pitch', 'A car park', 'A field', 'A school playground']);
          return { html: `${pl} is a rectangle ${B(ds(l) + ' m')} long and ${B(ds(w) + ' m')} wide. By rounding each length to 1 significant figure, estimate its area.`, ...nAns(l1 * w1, { unit: 'm²' }), unit: 'm²', hint: 'Area = length × width, using rounded values.',
            steps: [`${ds(l)} ≈ ${l1} and ${ds(w)} ≈ ${w1}`, `Estimate = ${l1} × ${w1}`, `≈ ${B(commas(String(l1 * w1)))} m²`] };
        },
        () => {
          let T1, k1; do { T1 = sf1(2, 9, r.pick([100, 1000])); k1 = sf1(2, 9, 10); } while (T1 % k1);
          const T = x8pert(r, T1, 2), k = x8pert(r, k1, 0);
          return { html: `A total prize of ${B(money(T))} is shared equally between ${B(k)} people. By rounding each number to 1 significant figure, estimate how much each person gets, in pounds.`, ...nAns(T1 / k1), answerLabel: '£', hint: 'Round both numbers to 1 s.f., then divide.',
            steps: [`${money(T)} ≈ £${commas(String(T1))} and ${k} ≈ ${k1}`, `Estimate = ${commas(String(T1))} ÷ ${k1}`, `≈ ${B('£' + ds(T1 / k1))}`] };
        },
        () => {
          const t1 = sf1(2, 9, 1000), p1 = sf1(2, 5, 10); const t = x8pert(r, t1, 0), p = x8pert(r, p1, 2);
          const ev = r.pick(['a concert', 'a football match', 'a music festival', 'a comedy show']);
          return { html: `${B(commas(String(t)))} tickets were sold for ${ev}. Each ticket cost ${B(money(p))}. By rounding each number to 1 significant figure, estimate the total money taken, in pounds.`, ...nAns(t1 * p1), answerLabel: '£', hint: 'Round both numbers to 1 s.f., then multiply.',
            steps: [`${commas(String(t))} ≈ ${commas(String(t1))} and ${money(p)} ≈ £${p1}`, `Estimate = ${commas(String(t1))} × ${p1}`, `≈ ${B('£' + commas(String(t1 * p1)))}`] };
        },
      ])();
    }],
]);

// ---------------------------------------------------------------- sequences
addStyles('y8-sequences', [
  ['Problems in context',
    'Find the first term and the amount added each time (the common difference). The nth term is (difference)n + (first term − difference). Substitute to find any term, or solve an equation to find a position.',
    (r) => {
      const nm = r.pick(X8N);
      return r.pick([
        () => {
          const d = r.int(2, 6), a = d + r.int(1, 5), k = r.pick([10, 12, 15, 20, 25, 30, 40, 50]); const c = a - d, v = d * k + c;
          const it = r.pick(['matchsticks', 'square tiles', 'counters', 'straws']);
          return { html: `A pattern is made from ${it}. Pattern 1 uses ${B(a)}, Pattern 2 uses ${B(a + d)} and Pattern 3 uses ${B(a + 2 * d)}. The pattern continues in the same way. How many ${it} are needed for Pattern ${B(k)}?`, ...nAns(v), hint: 'Find the nth term first.',
            steps: [`Common difference = ${d}, so the nth term starts ${d}<i>n</i>.`, `${a} − ${d} = ${c}, so nth term = ${tx(lin(d, c, 'n'))}`, `Pattern ${k}: ${d} × ${k} + ${c} = ${B(v)}`] };
        },
        () => {
          const a = r.int(12, 24), d = r.int(1, 3), k = r.int(8, 30); const N = a + (k - 1) * d;
          const pl = r.pick(['theatre', 'stadium stand', 'lecture hall', 'concert hall']);
          return { html: `In a ${pl}, the first row has ${B(a)} seats. Each row after that has ${B(d)} more seat${d > 1 ? 's' : ''} than the row in front. Which row has ${B(N)} seats?`, ...nAns(k), hint: 'Write the nth term, set it equal to the number of seats and solve.',
            steps: [`nth term = ${tx(lin(d, a - d, 'n'))}`, `${tx(lin(d, a - d, 'n'))} = ${N}, so ${tx(coefT(d, 'n'))} = ${N - (a - d)}`, `<i>n</i> = ${B(k)}, so it is row ${k}.`] };
        },
        () => {
          let a, d, T, w; do { a = r.int(5, 60); d = r.pick([3, 4, 5, 6, 8, 10, 12, 15]); T = r.int(10, 40) * 10; w = Math.floor((T - a) / d) + 1; } while (T <= a + d);
          return { html: `${nm} has ${B('£' + a)} saved. ${nm} saves another ${B('£' + d)} every week. After how many weeks will ${nm} first have ${B('more than £' + T)}?`, ...nAns(w, { unit: 'weeks' }), unit: 'weeks', hint: 'After w weeks the savings are a + d × w.',
            steps: [`After <i>w</i> weeks: ${a} + ${d}<i>w</i>`, `${a} + ${d}<i>w</i> > ${T} gives ${d}<i>w</i> > ${T - a}, so <i>w</i> > ${ds(rnd((T - a) / d, 2))}${(T - a) % d ? '…' : ''}`, `The first whole number of weeks that works is ${B(w)}.`] };
        },
        () => {
          const d = r.int(3, 7), c = r.int(-2, 6), N = r.int(60, 200); const k = Math.floor((N - c) / d); const t = [1, 2, 3].map((n) => d * n + c);
          return { html: `${nm} is making a sequence of tile patterns. The numbers of tiles in the first three patterns are ${B(t.join(', '))}. ${nm} has ${B(N)} tiles. What is the largest pattern number ${nm} can make?`, ...nAns(k), hint: 'Find the nth term, then the largest n with nth term ≤ the number of tiles.',
            steps: [`nth term = ${tx(lin(d, c, 'n'))}`, `${tx(lin(d, c, 'n'))} ≤ ${N} gives ${d}<i>n</i> ≤ ${N - c}, so <i>n</i> ≤ ${ds(rnd((N - c) / d, 2))}${(N - c) % d ? '…' : ''}`, `Largest pattern = ${B(k)}`] };
        },
        () => {
          const d = r.int(2, 5), k = r.int(3, 9), h = d * k + r.int(2, 12) * 1; const v = h - d * k;
          const it = r.pick(['A candle', 'A stick of incense', 'A wax taper', 'A garden candle']);
          return { html: `${it} is ${B(h + ' cm')} tall when it is lit. Its height goes down by ${B(d + ' cm')} every hour, so its heights make a sequence: ${h}, ${h - d}, ${h - 2 * d}, … How tall is it after ${B(k + ' hours')}?`, ...nAns(v, { unit: 'cm' }), unit: 'cm', hint: 'The common difference is negative.',
            steps: [`Each hour the height changes by −${d} cm.`, `After ${k} hours: ${h} − ${d} × ${k} = ${h} − ${d * k}`, `= ${B(v)} cm`] };
        },
      ])();
    }],
]);

// ---------------------------------------------------------------- ratio
addStyles('y8-ratio', [
  ['Problems in context',
    'Find the value of one part first, then multiply by the number of parts you need. For a recipe, scale every amount by the same factor.',
    (r) => {
      const nm = r.pick(X8N);
      return r.pick([
        () => {
          const p = r.pick([2, 4, 6, 8]), q = r.pick([3, 5, 10, 12, 9]), per = r.pick([25, 30, 40, 50, 60, 75]); const g = per * p;
          const ing = r.pick([['flour', 'g'], ['butter', 'g'], ['milk', 'ml'], ['sugar', 'g']]);
          return { html: `A recipe for ${B(p + ' people')} uses ${B(g + ' ' + ing[1])} of ${ing[0]}. ${nm} wants to make the recipe for ${B(q + ' people')}. How much ${ing[0]} is needed?`, ...nAns(per * q, { unit: ing[1] }), unit: ing[1], hint: 'Find the amount for one person first.',
            steps: [`For 1 person: ${g} ÷ ${p} = ${per} ${ing[1]}`, `For ${q} people: ${per} × ${q}`, `= ${B(per * q)} ${ing[1]}`] };
        },
        () => {
          let p, q; do { p = r.int(1, 7); q = r.int(2, 9); } while (q <= p || gcd(p, q) !== 1); const one = r.int(3, 25); const [n1, n2] = r.sample(X8N, 2);
          return { html: `${n1} and ${n2} share some money in the ratio ${B(p + ' : ' + q)}. ${n2} gets ${B('£' + (q - p) * one)} more than ${n1}. How much money did they share?`, ...nAns((p + q) * one, { money: true }), format: 'Type the amount in pounds, e.g. 120', hint: 'The difference is worth q − p parts.',
            steps: [`Difference in parts = ${q} − ${p} = ${q - p}`, `${q - p} parts = £${(q - p) * one}, so 1 part = £${one}`, `Total = ${p + q} parts = ${p + q} × £${one} = ${B('£' + (p + q) * one)}`] };
        },
        () => {
          const a = r.int(2, 3), b = r.int(a + 1, 5), one = r.int(4, 30) * 5, T = (1 + a + b) * one;
          return { html: `Concrete is made by mixing cement, sand and gravel in the ratio ${B('1 : ' + a + ' : ' + b)} by weight. A builder makes ${B(commas(String(T)) + ' kg')} of concrete. How much sand is used?`, ...nAns(a * one, { unit: 'kg' }), unit: 'kg', hint: 'Add the parts to find the total number of parts.',
            steps: [`Total parts = 1 + ${a} + ${b} = ${1 + a + b}`, `1 part = ${T} ÷ ${1 + a + b} = ${one} kg`, `Sand = ${a} × ${one} = ${B(a * one)} kg`] };
        },
        () => {
          let p, q; do { p = r.int(2, 7); q = r.int(3, 9); } while (q <= p || gcd(p, q) !== 1); const one = r.int(10, 60), N = (p + q) * one;
          return { html: `The ratio of boys to girls in a school is ${B(p + ' : ' + q)}. There are ${B(N)} students in the school. How many more girls than boys are there?`, ...nAns((q - p) * one), hint: 'Find one part, then the difference in parts.',
            steps: [`Total parts = ${p} + ${q} = ${p + q}; 1 part = ${N} ÷ ${p + q} = ${one}`, `Girls − boys = ${q - p} parts`, `${q - p} × ${one} = ${B((q - p) * one)}`] };
        },
        () => {
          const sc = r.pick([25000, 50000, 100000, 20000]), c = r.int(2, 18); const km = c * sc / 100000;
          return { html: `A map has a scale of ${B('1 : ' + commas(String(sc)))}. Two villages are ${B(c + ' cm')} apart on the map. How far apart are they in real life, in kilometres?`, ...nAns(km, { unit: 'km' }), unit: 'km', hint: '1 km = 100,000 cm.',
            steps: [`Real distance = ${c} × ${commas(String(sc))} = ${commas(String(c * sc))} cm`, `1 km = 100 000 cm, so divide by 100 000`, `= ${B(ds(km))} km`] };
        },
      ])();
    }],
]);

// ---------------------------------------------------------------- circles
addStyles('y8-circles', [
  ['Problems in context',
    'Decide whether you need the distance round the edge (circumference, C = πd) or the space inside (area, A = πr²). Use the π button and only round at the very end.',
    (r) => {
      const nm = r.pick(X8N);
      return r.pick([
        () => {
          const d = r.int(50, 72), n = r.int(10, 50) * 10; const C = Math.PI * d, D = C * n / 100;
          return { html: `A bicycle wheel has a diameter of ${B(d + ' cm')}. The wheel turns ${B(n)} times. How far does the bicycle travel? Give your answer in metres, to the nearest metre.`, ...nAns(D, { dp: 0, unit: 'm' }), answer: String(Math.round(D)), unit: 'm', format: 'Type a whole number of metres', hint: 'One turn moves the bicycle one circumference.',
            steps: [`Circumference = π × ${d} = ${fx(C, 2)} cm`, `Distance = ${fx(C, 2)} × ${n} = ${fx(C * n, 1)} cm`, `In metres: ÷ 100 = ${fx(D, 2)} m ≈ ${B(Math.round(D))} m`] };
        },
        () => {
          const rad = r.int(2, 9), p = r.pick([4, 5, 6, 8, 12]); const C = 2 * Math.PI * rad, n = Math.ceil(C);
          return { html: `A circular pond has a radius of ${B(rad + ' m')}. ${nm} wants to put fencing all the way round it. Fencing is sold in whole metres and costs ${B('£' + p)} per metre. How much will the fencing cost?`, ...nAns(n * p, { money: true }), format: 'Type the amount in pounds, e.g. 228', hint: 'Find the circumference, then round up to whole metres.',
            steps: [`Circumference = 2 × π × ${rad} = ${fx(C, 2)} m`, `${nm} must buy ${n} m (round up).`, `Cost = ${n} × £${p} = ${B('£' + n * p)}`] };
        },
        () => {
          const d = r.int(3, 16); const A = Math.PI * (d / 2) ** 2 / 2;
          return { html: `A flowerbed is a semicircle with a diameter of ${B(d + ' m')}. Work out the area of the flowerbed. Give your answer to 1 decimal place.`, ...nAns(A, { dp: 1, unit: 'm²' }), unit: 'm²', format: dpFmt(1), hint: 'A semicircle is half a circle; halve the diameter to get the radius.',
            steps: [`Radius = ${d} ÷ 2 = ${ds(d / 2)} m`, `Full circle area = π × ${ds(d / 2)}<sup>2</sup> = ${fx(2 * A, 3)} m²`, `Semicircle = ${fx(2 * A, 3)} ÷ 2 = ${fx(A, 3)} ≈ ${B(r1(A))} m²`] };
        },
        () => {
          const d = r.pick([20, 24, 25, 28, 30, 32, 35, 36, 40]), k = r.pick([4, 6, 8, 10, 12]); const A = Math.PI * (d / 2) ** 2, s = A / k;
          return { html: `A pizza has a diameter of ${B(d + ' cm')}. It is cut into ${B(k)} equal slices. Work out the area of one slice. Give your answer to 1 decimal place.`, ...nAns(s, { dp: 1, unit: 'cm²' }), unit: 'cm²', format: dpFmt(1), hint: 'Find the area of the whole pizza first.',
            steps: [`Radius = ${d} ÷ 2 = ${ds(d / 2)} cm`, `Whole pizza = π × ${ds(d / 2)}<sup>2</sup> = ${fx(A, 2)} cm²`, `One slice = ${fx(A, 2)} ÷ ${k} = ${fx(s, 3)} ≈ ${B(r1(s))} cm²`] };
        },
        () => {
          const rr = r.pick([0.5, 1, 1.5, 2]), s = r.int(Math.ceil(2 * rr) + 1, 8); const A = s * s - Math.PI * rr * rr;
          return { html: `A circular rug with a radius of ${B(ds(rr) + ' m')} is placed on a square floor with sides of ${B(s + ' m')}. Work out the area of the floor that is ${B('not')} covered by the rug. Give your answer to 1 decimal place.`, ...nAns(A, { dp: 1, unit: 'm²' }), unit: 'm²', format: dpFmt(1), hint: 'Area of floor − area of rug.',
            steps: [`Floor = ${s} × ${s} = ${s * s} m²`, `Rug = π × ${ds(rr)}<sup>2</sup> = ${fx(Math.PI * rr * rr, 3)} m²`, `Not covered = ${s * s} − ${fx(Math.PI * rr * rr, 3)} = ${fx(A, 3)} ≈ ${B(r1(A))} m²`] };
        },
      ])();
    }],
]);

// ---------------------------------------------------------------- probability
addStyles('y8-probability', [
  ['Problems in context',
    'The probabilities of all the possible outcomes add up to 1. The expected number of times something happens = probability × number of trials. Use the total in a bag to turn a probability into a number of items.',
    (r) => {
      const nm = r.pick(X8N);
      return r.pick([
        () => {
          let N, a, b, g; do { N = r.pick([20, 40, 50, 60, 80, 100]); a = r.int(1, 9) * 5; b = r.int(1, 9) * 5; g = N * (100 - a - b) / 100; } while (a + b >= 95 || g % 1 || (N * a / 100) % 1);
          return { html: `A bag contains only red, blue and green counters. The probability of taking a red counter is ${B(ps(a / 100))} and the probability of taking a blue counter is ${B(ps(b / 100))}. There are ${B(N)} counters in the bag. How many green counters are there?`, ...nAns(g), hint: 'Find P(green) first, then multiply by the number of counters.',
            steps: [`P(green) = 1 − ${ps(a / 100)} − ${ps(b / 100)} = ${ps((100 - a - b) / 100)}`, `Green counters = ${ps((100 - a - b) / 100)} × ${N}`, `= ${B(g)}`] };
        },
        () => {
          let p, n, e; do { p = r.int(1, 9) * 5; n = r.int(2, 25) * 20; e = p * n / 100; } while (e % 1);
          const what = r.pick([['A biased spinner', 'lands on red', 'spun'], ['A biased coin', 'lands on heads', 'thrown'], ['A biased dice', 'lands on 6', 'rolled'], ['A basketball player', 'scores a free throw', 'given a free throw']]);
          return { html: `${what[0]} ${what[1]} with probability ${B(ps(p / 100))}. It is ${what[2]} ${B(n)} times. How many times would you expect it to ${what[1].replace(/s /, ' ').replace(/^lands/, 'land').replace(/^scores/, 'score')}?`.replace(/It is given a free throw (\d+) times/, `The player takes ${B('$1')} free throws`).replace(/<b>(<b>\d+<\/b>)<\/b>/, '$1'), ...nAns(e), hint: 'Expected number = probability × number of trials.',
            steps: [`Expected = probability × number of trials`, `= ${ps(p / 100)} × ${n}`, `= ${B(e)}`] };
        },
        () => {
          const n = r.pick([50, 80, 100, 120, 150, 200, 250]), k = r.int(2, 12), m = r.int(2, 12); const [n2] = r.sample(X8N.filter((x) => x !== nm), 1);
          return { html: `In a raffle, ${B(n)} tickets are sold and one winning ticket is picked at random. ${nm} buys ${B(k)} tickets and ${n2} buys ${B(m)} tickets. What is the probability that ${B('neither')} ${nm} nor ${n2} wins? Give your answer as a fraction in its simplest form.`, ...fAns(n - k - m, n), hint: 'Count the tickets that belong to neither of them.',
            steps: [`Tickets bought by ${nm} and ${n2}: ${k} + ${m} = ${k + m}`, `Other tickets: ${n} − ${k + m} = ${n - k - m}`, `P(neither wins) = ${frac(n - k - m, n)}${gcd(n - k - m, n) > 1 ? ' = ' + B(fracS(n - k - m, n)) : ''}`, `Answer: ${B(fracS(n - k - m, n))}`] };
        },
        () => {
          let p, q; do { p = r.int(1, 5); q = r.int(1, 5); } while (p === q || gcd(p, q) !== 1); const one = r.int(2, 6), R = p * one, Bl = q * one, G = r.int(1, 12); const T = R + Bl + G;
          return { html: `A box contains red, blue and green pens. The ratio of red pens to blue pens is ${B(p + ' : ' + q)}. There are ${B(R)} red pens and ${B(G)} green pens. A pen is taken at random. What is the probability that it is blue? Give your answer as a fraction in its simplest form.`, ...fAns(Bl, T), hint: 'Use the ratio to find the number of blue pens.',
            steps: [`${p} parts = ${R} red pens, so 1 part = ${one}`, `Blue pens = ${q} × ${one} = ${Bl}`, `Total pens = ${R} + ${Bl} + ${G} = ${T}`, `P(blue) = ${frac(Bl, T)}${gcd(Bl, T) > 1 ? ' = ' + B(fracS(Bl, T)) : ''}`, `Answer: ${B(fracS(Bl, T))}`] };
        },
        () => {
          const rd = r.int(4, 12), bl = r.int(3, 12), k = r.int(1, 3); const R2 = rd - k, T = rd + bl - k;
          const it = r.pick(['sweets', 'marbles', 'beads', 'counters']); const [c1, c2] = r.pick([['red', 'yellow'], ['green', 'purple'], ['orange', 'white'], ['pink', 'blue']]);
          return { html: `A jar contains ${B(rd)} ${c1} ${it} and ${B(bl)} ${c2} ${it}. ${nm} takes out ${B(k)} ${c1} ${it} and keeps ${k > 1 ? 'them' : 'it'}. One more is now taken from the jar at random. What is the probability that it is ${c1}? Give your answer as a fraction in its simplest form.`, ...fAns(R2, T), hint: `Count what is left in the jar after ${k} ${c1} ${it} have gone.`,
            steps: [`${c1[0].toUpperCase() + c1.slice(1)} left: ${rd} − ${k} = ${R2}`, `Total left: ${rd + bl} − ${k} = ${T}`, `P(${c1}) = ${frac(R2, T)}${gcd(R2, T) > 1 ? ' = ' + B(fracS(R2, T)) : ''}`, `Answer: ${B(fracS(R2, T))}`] };
        },
      ])();
    }],
]);

}

// ---- fragment exam9.js ----
{
// ---- exam9: exam-style / problem-solving styles for every Year 9 topic ----
const x9hm = (mins) => { const h = Math.floor(mins / 60) % 24, m = mins % 60; return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`; };
const x9hrs = (t) => { // hours (decimal) -> words
  const h = Math.floor(t), m = Math.round((t - h) * 60);
  if (!h) return `${m} minutes`;
  return `${h} hour${h > 1 ? 's' : ''}${m ? ` ${m} minutes` : ''}`;
};
function x9sf(v) {
  let e = Math.floor(Math.log10(Math.abs(v))); let m = rnd(v / 10 ** e, 8);
  if (m >= 10) { m = rnd(m / 10, 8); e++; } if (m < 1) { m = rnd(m * 10, 8); e--; }
  return { m, e, s: `${ps(m)}×10^${e}`, h: `${ps(m)} × 10<sup>${ds(e)}</sup>`, v: Number(`${ps(m)}e${e}`) };
}
const x9sfH = (m, e) => `${ps(m)} × 10<sup>${ds(e)}</sup>`;
function x9sfAns(o) { return { answer: o.s, check: { type: 'number', value: o.v, sf: true, tol: Math.abs(o.v) * 1e-9 }, answerHtml: B(o.h), format: 'Type it like 3.2×10^5 (or 3.2e5)' }; }
const x9br = (c, k) => (k === 0 ? tx(coefT(c, 'x')) : `(${tx(lin(c, k))})`); // angle/side expression with brackets when needed

// =========================================================================== indices
addStyles('y9-indices', [
  ['Exam-style: finding the index',
    'Write everything as a power of the same base, then use the index laws: add indices when multiplying, subtract when dividing, multiply for a power of a power. Then compare the indices to find n.',
    (r) => {
      const t = r.int(0, 5);
      if (t === 0) {
        const a = r.int(10, 22), b = a + r.int(8, 20); const thing = r.pick([['photo', 'memory card'], ['song file', 'phone'], ['video clip', 'hard drive'], ['document', 'USB stick']]);
        return { html: `A ${thing[0]} uses ${B(`2<sup>${a}</sup>`)} bytes of storage. A ${thing[1]} can store ${B(`2<sup>${b}</sup>`)} bytes. The number of these ${thing[0]}s that the ${thing[1]} can hold is 2<sup><i>n</i></sup>. Find the value of <i>n</i>.`, answerLabel: 'n =', ...nAns(b - a), hint: 'Divide the capacity by the size of one file.',
          steps: [`Number of ${thing[0]}s = 2<sup>${b}</sup> ÷ 2<sup>${a}</sup>`, `Dividing powers: subtract the indices, ${b} − ${a} = ${b - a}`, `So 2<sup><i>n</i></sup> = 2<sup>${b - a}</sup> and <i>n</i> = ${B(b - a)}`] };
      }
      if (t === 1) {
        const base = r.pick([2, 3, 5, 7]); const a = r.int(2, 9); const cube = r.chance();
        const shape = cube ? r.pick(['cube-shaped box', 'cube', 'cube-shaped tank']) : r.pick(['square tile', 'square garden', 'square photo frame', 'square']);
        const k = cube ? 3 : 2;
        return { html: `A ${shape} has side length ${B(`${base}<sup>${a}</sup>`)} cm. Its ${cube ? 'volume' : 'area'} is ${base}<sup><i>n</i></sup> cm${cube ? '³' : '²'}. Find the value of <i>n</i>.`, answerLabel: 'n =', ...nAns(k * a), hint: cube ? 'Volume of a cube = side × side × side.' : 'Area of a square = side × side.',
          steps: [`${cube ? 'Volume' : 'Area'} = (${base}<sup>${a}</sup>)<sup>${k}</sup>`, `Power of a power: multiply the indices, ${a} × ${k} = ${a * k}`, `<i>n</i> = ${B(a * k)}`] };
      }
      if (t === 2) {
        const p = r.pick([2, 3, 5, 7, 10, 11]); const a = r.int(2, 12); let n = r.int(0, 12); const div = r.chance(0.5); const d = div ? r.int(2, 9) : 0;
        if (r.chance(0.12)) n = 0;
        const c = a + n - d;
        if (c <= 0) n += 1 - c;
        const cc = a + n - d;
        return { html: `Find the value of <i>n</i> such that ${B(div ? `${frac(`${p}<sup>${a}</sup> × ${p}<sup><i>n</i></sup>`, `${p}<sup>${d}</sup>`)} = ${p}<sup>${cc}</sup>` : `${p}<sup>${a}</sup> × ${p}<sup><i>n</i></sup> = ${p}<sup>${cc}</sup>`)}`, answerLabel: 'n =', ...nAns(n), hint: 'Simplify the left-hand side as a single power first.',
          steps: [div ? `Left-hand side = ${p}<sup>${a} + <i>n</i> − ${d}</sup>` : `Left-hand side = ${p}<sup>${a} + <i>n</i></sup>`, div ? `So ${a} + <i>n</i> − ${d} = ${cc}` : `So ${a} + <i>n</i> = ${cc}`, `<i>n</i> = ${cc} − ${a}${div ? ` + ${d}` : ''} = ${B(n)}${n === 0 ? ' (any number to the power 0 is 1)' : ''}`] };
      }
      if (t === 3) {
        const p = r.pick([2, 3, 5, 6, 7]); const a = r.int(2, 6), n = r.int(2, 7);
        return { html: `Find the value of <i>n</i> such that ${B(`(${p}<sup>${a}</sup>)<sup><i>n</i></sup> = ${p}<sup>${a * n}</sup>`)}`, answerLabel: 'n =', ...nAns(n), hint: 'Power of a power: multiply the indices.',
          steps: [`(${p}<sup>${a}</sup>)<sup><i>n</i></sup> = ${p}<sup>${a}<i>n</i></sup>`, `So ${a}<i>n</i> = ${a * n}`, `<i>n</i> = ${a * n} ÷ ${a} = ${B(n)}`] };
      }
      if (t === 4) {
        const k = r.int(2, 6), m = r.int(1, 6); const mul = r.chance(); const n = mul ? 3 * k + 2 * m : 3 * k - 2 * m;
        if (n <= 0) { const nn = 3 * k + 2 * m; return { html: `Write ${B(`8<sup>${k}</sup> × 4<sup>${m}</sup>`)} as a single power of 2. Give the index.`, answerLabel: 'index =', ...nAns(nn), hint: '8 = 2³ and 4 = 2².', steps: [`8 = 2<sup>3</sup>, so 8<sup>${k}</sup> = 2<sup>${3 * k}</sup>; 4 = 2<sup>2</sup>, so 4<sup>${m}</sup> = 2<sup>${2 * m}</sup>`, `2<sup>${3 * k}</sup> × 2<sup>${2 * m}</sup> = 2<sup>${nn}</sup>`, `The index is ${B(nn)}`] }; }
        return { html: `${B(`8<sup>${k}</sup> ${mul ? '×' : '÷'} 4<sup>${m}</sup>`)} can be written as 2<sup><i>n</i></sup>. Find the value of <i>n</i>.`, answerLabel: 'n =', ...nAns(n), hint: 'Write 8 and 4 as powers of 2.',
          steps: [`8 = 2<sup>3</sup>, so 8<sup>${k}</sup> = 2<sup>${3 * k}</sup>`, `4 = 2<sup>2</sup>, so 4<sup>${m}</sup> = 2<sup>${2 * m}</sup>`, `2<sup>${3 * k}</sup> ${mul ? '×' : '÷'} 2<sup>${2 * m}</sup> = 2<sup>${n}</sup>, so <i>n</i> = ${B(n)}`] };
      }
      const a = r.int(2, 12), h = r.int(3, 15); const what = r.pick(['bacteria', 'yeast cells', 'algae cells']);
      return { html: `A sample starts with ${B(`2<sup>${a}</sup>`)} ${what}. The number of ${what} doubles every hour. After ${B(h + ' hours')} there are 2<sup><i>n</i></sup> ${what}. Find the value of <i>n</i>.`, answerLabel: 'n =', ...nAns(a + h), hint: 'Doubling once means multiplying by 2¹.',
        steps: [`Doubling ${h} times means multiplying by 2<sup>${h}</sup>.`, `2<sup>${a}</sup> × 2<sup>${h}</sup> = 2<sup>${a} + ${h}</sup> = 2<sup>${a + h}</sup>`, `<i>n</i> = ${B(a + h)}`] };
    }],
]);

// =========================================================================== expanding double brackets
addStyles('y9-expanding-double', [
  ['Problems in context',
    'Write the area (or the difference in areas) using brackets first, then expand every term in one bracket by every term in the other and collect like terms.',
    (r) => {
      const t = r.int(0, 5); const thing = r.pick(['A rectangular rug', 'A rectangular poster', 'A rectangular patio', 'A rectangular lawn', 'A rectangular table top']);
      if (t === 0) {
        const a = r.int(1, 9), b = r.int(1, 9); const ans = quad(1, a + b, a * b);
        return { html: `${thing} is ${B(tx(`(${lin(1, a)})`))} cm long and ${B(tx(`(${lin(1, b)})`))} cm wide. Write an expression for its area in cm². Expand and simplify your answer.`, ...eAns(ans, { form: 'expanded' }), answerLabel: 'Area =', hint: 'Area = length × width.',
          steps: [`Area = ${tx(`(${lin(1, a)})(${lin(1, b)})`)}`, `= ${tx(`x^2+${a}x+${b}x+${a * b}`)}`, `= ${B(tx(ans))}`] };
      }
      if (t === 1) {
        const p = r.int(2, 5), a = r.int(1, 9); const ans = quad(p * p, 2 * p * a, a * a); const sq0 = r.pick(['square tile', 'square window', 'square vegetable plot', 'square chessboard']);
        return { html: `A ${sq0} has side length ${B(tx(`(${lin(p, a)})`))} cm. Show that its area can be written as <i>ax</i>² + <i>bx</i> + <i>c</i>, and give the expression.`, ...eAns(ans, { form: 'expanded' }), answerLabel: 'Area =', hint: 'Area = side × side, so write the bracket twice.',
          steps: [`Area = ${tx(`(${lin(p, a)})(${lin(p, a)})`)}`, `= ${tx(`${p * p}x^2+${p * a}x+${p * a}x+${a * a}`)}`, `= ${B(tx(ans))}`] };
      }
      if (t === 2) {
        const a = r.int(2, 9), b = r.int(1, 9); const ans = lin(a + b, a * b);
        return { html: `${thing} measures ${B(tx(`(${lin(1, a)})`))} m by ${B(tx(`(${lin(1, b)})`))} m. A square of side ${B('<i>x</i> m')} is cut out of it. Write an expression, in its simplest form, for the area that is left.`, ...eAns(ans, { form: 'expanded' }), answerLabel: 'Area =', hint: 'Whole area − area of the square.',
          steps: [`Whole area = ${tx(`(${lin(1, a)})(${lin(1, b)})`)} = ${tx(quad(1, a + b, a * b))}`, `Area of square = ${tx('x^2')}`, `Area left = ${tx(quad(1, a + b, a * b))} − ${tx('x^2')} = ${B(tx(ans))}`] };
      }
      if (t === 3) {
        const a = r.int(2, 12), b = r.int(1, 9); const ans = quad(1, a - b, -a * b);
        return { html: `${thing} has length ${B(tx(`(${lin(1, a)})`))} cm and width ${B(tx(`(${lin(1, -b)})`))} cm, where <i>x</i> &gt; ${b}. Find an expression for its area. Expand and simplify.`, ...eAns(ans, { form: 'expanded' }), answerLabel: 'Area =', hint: 'Watch the signs: + × − gives −.',
          steps: [`Area = ${tx(`(${lin(1, a)})(${lin(1, -b)})`)}`, `= ${tx(`x^2-${b}x+${a}x-${a * b}`)}`, `= ${B(tx(ans))}`] };
      }
      if (t === 4) {
        let a, b, c, d; do { a = r.int(3, 10); b = r.int(3, 10); c = r.int(1, a); d = r.int(1, b); } while (c === a && d === b);
        const ans = lin(a + b - c - d, a * b - c * d);
        return { html: `Rectangle A measures ${B(tx(`(${lin(1, a)})`))} cm by ${B(tx(`(${lin(1, b)})`))} cm. Rectangle B measures ${B(tx(`(${lin(1, c)})`))} cm by ${B(tx(`(${lin(1, d)})`))} cm. Write a simplified expression for how much greater the area of A is than the area of B.`, ...eAns(ans, { form: 'expanded' }), answerLabel: 'Difference =', hint: 'Expand both areas, then subtract.',
          steps: [`Area A = ${tx(`(${lin(1, a)})(${lin(1, b)})`)} = ${tx(quad(1, a + b, a * b))}`, `Area B = ${tx(`(${lin(1, c)})(${lin(1, d)})`)} = ${tx(quad(1, c + d, c * d))}`, `A − B: the ${tx('x^2')} terms cancel, leaving ${B(tx(ans))}`] };
      }
      const w = r.int(1, 2), k = r.int(2, 8); const ans = lin(4 * w, 2 * w * (k + 2 * w));
      return { html: `A rectangular pond is ${B('<i>x</i> m')} by ${B(tx(`(${lin(1, k)})`) + ' m')}. A path ${B(w + ' m')} wide goes all the way round the pond. Find a simplified expression for the area of the path.`, ...eAns(ans, { form: 'expanded' }), answerLabel: 'Area =', hint: `The outer rectangle is ${2 * w} m longer and ${2 * w} m wider than the pond.`,
        steps: [`Outer rectangle: ${tx(`(${lin(1, 2 * w)})`)} by ${tx(`(${lin(1, k + 2 * w)})`)}`, `Outer area = ${tx(quad(1, k + 4 * w, 2 * w * (k + 2 * w)))}`, `Pond area = ${tx(`x(${lin(1, k)})`)} = ${tx(quad(1, k, 0))}`, `Path = outer − pond = ${B(tx(ans))}`] };
    }],
]);

// =========================================================================== factorising
addStyles('y9-factorising', [
  ['Problems in context',
    'Factorising means writing an expression as a product. If you know the total and one factor, divide each term by that factor. Factorising also makes some calculations easy: 23 × 7 + 23 × 3 = 23 × (7 + 3).',
    (r) => {
      const t = r.int(0, 4);
      if (t === 0) {
        let g, c, d; do { g = r.int(2, 8); c = r.int(1, 6); d = r.int(1, 12); } while (gcd(c, d) !== 1);
        const area = polyT([[g * c, 'x^2'], [g * d, 'x']]); const ans = lin(c, d);
        return { html: `The area of a rectangle is ${B(tx(area) + ' cm²')}. Its width is ${B(tx(coefT(g, 'x')) + ' cm')}. Write an expression for its length.`, ...eAns(ans), answerLabel: 'Length =', format: 'Type an expression, e.g. 3x+2', hint: 'Length = area ÷ width: factorise the area.',
          steps: [`Factorise the area by taking out ${tx(coefT(g, 'x'))}: ${tx(area)} = ${tx(`${coefT(g, 'x')}(${ans})`)}`, `Area = width × length, so length = ${B(tx(ans))} cm`] };
      }
      if (t === 1) {
        let g, c, d; do { g = r.int(3, 9); c = r.int(1, 8); d = r.int(1, 15); } while (gcd(c, d) !== 1);
        const who = r.pick(['friends share a taxi fare', 'students share the cost of a gift', 'people share a restaurant bill', 'members share the cost of a minibus']);
        const ans = lin(c, d);
        return { html: `${g} ${who} equally. The total cost is ${B('£' + tx(`(${lin(g * c, g * d)})`))}. Write an expression for the amount, in pounds, each person pays.`, ...eAns(ans), answerLabel: '£', format: 'Type an expression, e.g. 3x+2', hint: `Take out the factor ${g}.`,
          steps: [`${tx(lin(g * c, g * d))} = ${tx(`${g}(${ans})`)}`, `Dividing by ${g}, each person pays £${B(tx(ans))}`] };
      }
      if (t === 2) {
        const [k, name] = r.pick([[3, 'equilateral triangle'], [4, 'square'], [5, 'regular pentagon'], [6, 'regular hexagon'], [8, 'regular octagon']]);
        let c, d; do { c = r.int(1, 7); d = r.int(1, 12); } while (gcd(c, d) !== 1);
        const ans = lin(c, d);
        return { html: `The perimeter of a ${name} is ${B(tx(lin(k * c, k * d)) + ' cm')}. Find an expression for the length of one side.`, ...eAns(ans), answerLabel: 'Side =', format: 'Type an expression, e.g. 3x+2', hint: `A ${name} has ${k} equal sides.`,
          steps: [`A ${name} has ${k} equal sides, so factorise with ${k}: ${tx(lin(k * c, k * d))} = ${tx(`${k}(${ans})`)}`, `One side = ${B(tx(ans))} cm`] };
      }
      if (t === 3) {
        const a = r.int(12, 99); const plus = r.chance(); const tot = r.pick([10, 100]);
        let b, c; if (plus) { b = r.int(tot === 10 ? 2 : 11, tot === 10 ? 8 : 89); c = tot - b; } else { c = r.int(3, tot === 10 ? 40 : 60); b = c + tot; }
        const v = plus ? a * (b + c) : a * (b - c);
        return { html: `Use factorising to work out ${B(`${a} × ${b} ${plus ? '+' : '−'} ${a} × ${c}`)} without a calculator.`, ...nAns(v), hint: `Both terms have a factor of ${a}.`,
          steps: [`Take out the common factor ${a}: ${a} × (${b} ${plus ? '+' : '−'} ${c})`, `= ${a} × ${tot}`, `= ${B(ds(v))}`] };
      }
      let g, c, d; do { g = r.int(2, 9); c = r.int(1, 6); d = r.int(1, 11); } while (gcd(c, d) !== 1);
      const v = r.pick(['n', 'k', 'm']);
      return { html: `${B(tx(`${v}`))} is a whole number. Factorise ${B(tx(lin(g * c, g * d, v)))} fully. Hence write down the largest whole number that always divides ${tx(lin(g * c, g * d, v))} exactly, whatever the value of ${tx(v)}.`, ...nAns(g), hint: 'Find the HCF of the two numbers.',
        steps: [`The HCF of ${g * c} and ${g * d} is ${g}.`, `${tx(lin(g * c, g * d, v))} = ${tx(`${g}(${lin(c, d, v)})`)}`, `Since ${tx(lin(c, d, v))} is a whole number, the expression is always a multiple of ${B(g)}`] };
    }],
]);

// =========================================================================== equations with unknowns on both sides
addStyles('y9-equations-both-sides', [
  ['Forming equations in context',
    'Use a letter for the unknown. Write an expression for each side of the situation, set them equal, then collect the unknowns on one side and solve.',
    (r) => {
      const t = r.int(0, 4);
      if (t === 0) {
        const m = r.int(3, 12), p = r.int(10, 30), q = p + r.int(2, 8), b = 5 * r.int(2, 10); const a = b + m * (q - p);
        const what = r.pick(['gym', 'phone contract', 'streaming service', 'swimming club']);
        return { html: `Two ${what} deals are available.<br>Deal A: ${B(money(a))} joining fee, then ${B(money(p))} per month.<br>Deal B: ${B(money(b))} joining fee, then ${B(money(q))} per month.<br>After how many months is the total cost of both deals the same?`, answerLabel: 'months =', ...nAns(m), hint: 'Let m be the number of months and set the two totals equal.',
          steps: [`${tx(`${a}+${p}m=${b}+${q}m`)}`, `Subtract ${tx(`${p}m`)} and ${b} from both sides: ${tx(`${a - b}=${q - p}m`)}`, `<i>m</i> = ${a - b} ÷ ${q - p} = ${B(m)} months`] };
      }
      if (t === 1) {
        let x, a, c, b, d; do { x = r.int(3, 20); a = r.int(2, 6); c = a + r.int(1, 4); b = r.int(1, 30); d = (c - a) * x - b; } while (d <= 0);
        const nm = r.pick(['Priya', 'Tom', 'Kwame', 'Sofia', 'Leo']);
        return { html: `${nm} thinks of a number. Multiplying it by ${a} and adding ${b} gives the same answer as multiplying it by ${c} and subtracting ${d}. What is the number?`, ...nAns(x), hint: 'Call the number x and write both sides.',
          steps: [`${tx(`${a}x+${b}=${c}x-${d}`)}`, `Subtract ${tx(`${a}x`)} from both sides: ${tx(`${b}=${coefT(c - a, 'x')}-${d}`)}`, `Add ${d}: ${tx(`${b + d}=${coefT(c - a, 'x')}`)}`, `<i>x</i> = ${B(x)}`] };
      }
      if (t === 2) {
        const w = r.int(3, 15), f = r.int(2, 10), e = f + r.int(2, 8), E = 5 * r.int(2, 20); const F = E + w * (e - f); const askAmt = r.chance(0.4);
        const [p1, p2] = r.pick([['Ella', 'Finn'], ['Ravi', 'Grace'], ['Mo', 'Isla'], ['Zara', 'Jack']]);
        const amt = E + e * w;
        return { html: `${p1} has ${B(money(E))} and saves ${B(money(e))} each week. ${p2} has ${B(money(F))} and saves ${B(money(f))} each week. ${askAmt ? 'When they have the same amount of money, how much will each of them have?' : 'After how many weeks will they have the same amount of money?'}`, ...(askAmt ? nAns(amt, { money: true }) : { answerLabel: 'weeks =', ...nAns(w) }), hint: 'Let w be the number of weeks and set the two amounts equal.',
          steps: [`${tx(`${E}+${e}w=${F}+${f}w`)}`, `Subtract ${tx(`${f}w`)} and ${E}: ${tx(`${e - f}w=${F - E}`)}`, `<i>w</i> = ${F - E} ÷ ${e - f} = ${w} weeks`, ...(askAmt ? [`Amount = ${money(E)} + ${w} × ${money(e)} = ${B(money(amt))}`] : [`Answer: ${B(w)} weeks`])] };
      }
      if (t === 3) {
        const T = r.int(2, 6), b = r.int(1, 3), a = b + r.int(1, 3), hB = b * T + r.int(2, 10); const hA = hB + (a - b) * T;
        return { html: `Candle A is ${B(hA + ' cm')} tall and burns down ${B(a + ' cm')} every hour. Candle B is ${B(hB + ' cm')} tall and burns down ${B(b + ' cm')} every hour. Both are lit at the same time. After how many hours are they the same height?`, answerLabel: 'hours =', ...nAns(T), hint: 'Height after t hours = start height − rate × t.',
          steps: [`${tx(`${hA}-${a}t=${hB}-${coefT(b, 't')}`)}`, `Add ${tx(`${a}t`)} to both sides and subtract ${hB}: ${tx(`${hA - hB}=${coefT(a - b, 't')}`)}`, `<i>t</i> = ${B(T)} hours`] };
      }
      const T = r.int(5, 30), a = r.int(2, 15), b = r.int(2, 15), VA = 10 * r.int(5, 40); const VB = VA + (a + b) * T;
      return { html: `Tank A contains ${B(VA + ' litres')} of water and is being filled at ${B(a + ' litres per minute')}. Tank B contains ${B(VB + ' litres')} and is being emptied at ${B(b + ' litres per minute')}. After how many minutes will the two tanks contain the same amount of water?`, answerLabel: 'minutes =', ...nAns(T), hint: 'Write an expression for each tank after t minutes.',
        steps: [`${tx(`${VA}+${a}t=${VB}-${b}t`)}`, `Add ${tx(`${b}t`)} and subtract ${VA}: ${tx(`${a + b}t=${VB - VA}`)}`, `<i>t</i> = ${VB - VA} ÷ ${a + b} = ${B(T)} minutes`] };
    }],
  ['Geometry: form and solve',
    'Equal lengths or equal angles give you an equation. Solve it to find x, then substitute x back in to answer the actual question (a perimeter, an angle or an area).',
    (r) => {
      const t = r.int(0, 4);
      let x, a, c, b, d; do { x = r.int(2, 12); a = r.int(2, 7); c = r.int(1, a - 1); b = r.int(1, 12); d = r.int(1, 12); } while (a * x - b <= 0);
      // form a x − b = c x + d → (a − c) x = b + d. Recompute d so equality holds
      d = (a - c) * x - b; if (d <= 0) { b = (a - c) * x - r.int(1, Math.max(1, (a - c) * x - 1)); d = (a - c) * x - b; }
      if (d <= 0 || b <= 0) { b = 0; d = (a - c) * x; }
      const L = a * x - b; const sideA = tx(lin(a, -b)), sideC = tx(lin(c, d));
      const solve = [`Set the expressions equal: ${tx(`${lin(a, -b)}=${lin(c, d)}`)}`, `Subtract ${tx(coefT(c, 'x'))}${b ? ` and add ${b}` : ''}: ${tx(`${coefT(a - c, 'x')}=${b + d}`)}`, `<i>x</i> = ${b + d} ÷ ${a - c} = ${x}`];
      if (t === 0) {
        const e = r.int(3, 20); const P = 2 * (L + e);
        return { html: `A rectangle has one pair of opposite sides of length ${B(sideA + ' cm')} and ${B(sideC + ' cm')}. The other two sides are each ${B(e + ' cm')}. Work out the perimeter of the rectangle.`, unit: 'cm', ...nAns(P, { unit: 'cm' }), hint: 'Opposite sides of a rectangle are equal.',
          steps: [...solve, `Long side = ${L} cm, so perimeter = 2 × (${L} + ${e}) = ${B(P)} cm`] };
      }
      if (t === 1) {
        const e = r.int(2, Math.max(2, 2 * L - 1)); const P = 2 * L + e;
        return { html: `An isosceles triangle has two equal sides of length ${B(sideA + ' cm')} and ${B(sideC + ' cm')}. The third side is ${B(e + ' cm')}. Work out the perimeter of the triangle.`, unit: 'cm', ...nAns(P, { unit: 'cm' }), hint: 'The two equal sides give you an equation.',
          steps: [...solve, `Each equal side = ${L} cm, so perimeter = ${L} + ${L} + ${e} = ${B(P)} cm`] };
      }
      if (t === 2) {
        const P = 3 * L;
        return { html: `Two sides of an equilateral triangle are ${B(sideA + ' cm')} and ${B(sideC + ' cm')}. Work out the perimeter of the triangle.`, unit: 'cm', ...nAns(P, { unit: 'cm' }), hint: 'All three sides of an equilateral triangle are equal.',
          steps: [...solve, `Each side = ${L} cm, so perimeter = 3 × ${L} = ${B(P)} cm`] };
      }
      if (t === 3) {
        const A = L * L;
        return { html: `Two sides of a square are ${B(sideA + ' m')} and ${B(sideC + ' m')}. Work out the area of the square.`, unit: 'm²', ...nAns(A, { unit: 'm²' }), hint: 'All sides of a square are equal.',
          steps: [...solve, `Side = ${L} m, so area = ${L} × ${L} = ${B(A)} m²`] };
      }
      // vertically opposite angles: keep angle sensible
      let xx, aa, cc, bb, dd, ang; do { xx = r.int(5, 30); aa = r.int(2, 6); cc = r.int(1, aa - 1); bb = r.int(0, 40); dd = (aa - cc) * xx - bb; ang = aa * xx - bb; } while (dd <= 0 || ang < 20 || ang > 170 || bb === 0);
      return { html: `Two straight lines cross. A pair of vertically opposite angles are ${B(`(${tx(lin(aa, -bb))})°`)} and ${B(`(${tx(lin(cc, dd))})°`)}. Work out the size of one of these angles.`, unit: '°', ...nAns(ang, { unit: '°' }), hint: 'Vertically opposite angles are equal.',
        steps: [`Vertically opposite angles are equal: ${tx(`${lin(aa, -bb)}=${lin(cc, dd)}`)}`, `${tx(`${coefT(aa - cc, 'x')}=${bb + dd}`)}, so <i>x</i> = ${xx}`, `Angle = ${aa} × ${xx} − ${bb} = ${B(ang + '°')}`] };
    }],
]);

// =========================================================================== pythagoras
addStyles('y9-pythagoras', [
  ['Problems in context',
    'Sketch the situation and find the right-angled triangle. Decide whether you want the hypotenuse (square, add, square root) or a shorter side (square, subtract, square root).',
    (r) => {
      const t = r.int(0, 4);
      if (t === 0) {
        const L = r.pick([3, 3.5, 4, 4.5, 5, 6, 6.5, 7, 8, 9, 10]), d = r.pick([0.8, 1, 1.2, 1.5, 1.8, 2, 2.5]); const h = Math.sqrt(L * L - d * d);
        return { html: `A ladder ${B(ds(L) + ' m')} long leans against a vertical wall. The foot of the ladder is ${B(ds(d) + ' m')} from the base of the wall on horizontal ground. How far up the wall does the ladder reach? Give your answer to 1 decimal place.`, diagram: rtSvg({ v: 'h', hz: `${ds(d)} m`, hyp: `${ds(L)} m`, hi: 'v' }), unit: 'm', ...nAns(h, { dp: 1, unit: 'm' }), format: dpFmt(1), hint: 'The ladder is the hypotenuse.',
          steps: [`The ladder is the hypotenuse: h<sup>2</sup> = ${ds(L)}<sup>2</sup> − ${ds(d)}<sup>2</sup>`, `h<sup>2</sup> = ${ds(L * L)} − ${ds(rnd(d * d, 4))} = ${ds(rnd(L * L - d * d, 4))}`, `h = ${sq(ds(rnd(L * L - d * d, 4)))} = ${fx(h, 4)}… = ${B(r1(h))} m`] };
      }
      if (t === 1) {
        const l = 5 * r.int(8, 30), w = 5 * r.int(4, 20); const dg = Math.hypot(l, w); const save = l + w - dg;
        const place = r.pick(['rectangular field', 'rectangular park', 'school playing field', 'rectangular car park']);
        return { html: `A ${place} is ${B(l + ' m')} long and ${B(w + ' m')} wide. Ali walks from one corner to the opposite corner along two edges. Ben walks straight across the diagonal. How much shorter is Ben's route? Give your answer to 1 decimal place.`, unit: 'm', ...nAns(save, { dp: 1, unit: 'm' }), format: dpFmt(1), hint: 'Find the diagonal with Pythagoras, then subtract from the two edges.',
          steps: [`Ali walks ${l} + ${w} = ${l + w} m`, `Diagonal<sup>2</sup> = ${l}<sup>2</sup> + ${w}<sup>2</sup> = ${l * l + w * w}, so diagonal = ${fx(dg, 4)}… m`, `Difference = ${l + w} − ${fx(dg, 4)}… = ${B(r1(save))} m`] };
      }
      if (t === 2) {
        const a = r.int(5, 60), b = r.int(5, 60); const d = Math.hypot(a, b); const [d1, d2] = r.pick([['north', 'east'], ['south', 'west'], ['east', 'north'], ['west', 'south']]);
        const who = r.pick(['A ship sails', 'A plane flies', 'A hiker walks', 'A drone flies']);
        return { html: `${who} ${B(a + ' km')} due ${d1} from a point P, then ${B(b + ' km')} due ${d2}. How far is it now from P in a straight line? Give your answer to 1 decimal place.`, diagram: rtSvg({ v: `${a} km`, hz: `${b} km`, hyp: '?', hi: 'hyp' }), unit: 'km', ...nAns(d, { dp: 1, unit: 'km' }), format: dpFmt(1), hint: 'The two directions are at right angles.',
          steps: [`The two journeys are at right angles, so use Pythagoras.`, `d<sup>2</sup> = ${a}<sup>2</sup> + ${b}<sup>2</sup> = ${a * a} + ${b * b} = ${a * a + b * b}`, `d = ${sq(a * a + b * b)} = ${fx(d, 4)}… = ${B(r1(d))} km`] };
      }
      if (t === 3) {
        const s = 5 * r.int(6, 30), h = r.int(10, s - 5); const x = Math.sqrt(s * s - h * h); const item = r.pick(['A kite', 'A balloon', 'A flag']);
        return { html: `${item} is held by a taut string of length ${B(s + ' m')}. The ${item.split(' ')[1]} is directly above a point on the ground that is ${B(h + ' m')} from the person holding the string. Ignoring the person's height, how high is the ${item.split(' ')[1]}? Give your answer to 1 decimal place.`, unit: 'm', ...nAns(x, { dp: 1, unit: 'm' }), format: dpFmt(1), hint: 'The string is the hypotenuse.',
          steps: [`The string is the hypotenuse: height<sup>2</sup> = ${s}<sup>2</sup> − ${h}<sup>2</sup>`, `= ${s * s} − ${h * h} = ${s * s - h * h}`, `height = ${sq(s * s - h * h)} = ${fx(x, 4)}… = ${B(r1(x))} m`] };
      }
      const D = r.pick([24, 32, 40, 43, 50, 55, 65, 75]) * 2.54; const w0 = rnd(D * r.pick([0.8, 0.82, 0.85, 0.87]), 0); const Dc = rnd(D, 0); const hh = Math.sqrt(Dc * Dc - w0 * w0);
      return { html: `A rectangular TV screen has a diagonal of ${B(Dc + ' cm')} and a width of ${B(w0 + ' cm')}. Work out the height of the screen. Give your answer to 1 decimal place.`, unit: 'cm', ...nAns(hh, { dp: 1, unit: 'cm' }), format: dpFmt(1), hint: 'The diagonal is the hypotenuse.',
        steps: [`height<sup>2</sup> = ${Dc}<sup>2</sup> − ${w0}<sup>2</sup> = ${Dc * Dc} − ${w0 * w0} = ${Dc * Dc - w0 * w0}`, `height = ${sq(Dc * Dc - w0 * w0)} = ${fx(hh, 4)}…`, `height = ${B(r1(hh))} cm`] };
    }],
  ['Two-step problems',
    'Use Pythagoras to find a missing length first, then use that length to answer the real question — an area, a perimeter, a distance moved or a cost.',
    (r) => {
      const t = r.int(0, 3);
      if (t === 0) {
        const b = 2 * r.int(3, 12), s = r.int(b / 2 + 2, b + 10); const h = Math.sqrt(s * s - (b / 2) ** 2); const A = 0.5 * b * h;
        return { html: `An isosceles triangle has two sides of ${B(s + ' cm')} and a base of ${B(b + ' cm')}. Work out the area of the triangle. Give your answer to 1 decimal place.`, unit: 'cm²', ...nAns(A, { dp: 1, unit: 'cm²' }), format: dpFmt(1), hint: 'The height splits the base in half and makes two right-angled triangles.',
          steps: [`The height cuts the base in half: ${b} ÷ 2 = ${b / 2} cm`, `h<sup>2</sup> = ${s}<sup>2</sup> − ${b / 2}<sup>2</sup> = ${s * s - (b / 2) ** 2}, so h = ${fx(h, 4)}… cm`, `Area = ½ × ${b} × ${fx(h, 4)}… = ${fx(A, 3)}…`, `Area = ${B(r1(A))} cm²`] };
      }
      if (t === 1) {
        const d = r.int(10, 40), w = r.int(4, d - 3); const l = Math.sqrt(d * d - w * w); const P = 2 * (l + w); const what = r.pick(['A rectangular door', 'A rectangular field', 'A rectangular sheet of card', 'A rectangular garden']);
        return { html: `${what} has a diagonal of length ${B(d + ' m')} and a width of ${B(w + ' m')}. Work out its perimeter. Give your answer to 1 decimal place.`, unit: 'm', ...nAns(P, { dp: 1, unit: 'm' }), format: dpFmt(1), hint: 'The diagonal splits the rectangle into two right-angled triangles.',
          steps: [`Length<sup>2</sup> = ${d}<sup>2</sup> − ${w}<sup>2</sup> = ${d * d - w * w}`, `Length = ${fx(l, 4)}… m`, `Perimeter = 2 × (${fx(l, 4)}… + ${w}) = ${fx(P, 4)}… = ${B(r1(P))} m`] };
      }
      if (t === 2) {
        const L = r.pick([4, 5, 6, 7, 8, 10]); const d1 = r.pick([0.5, 1, 1.2, 1.5]); const d2 = d1 + r.pick([0.5, 0.8, 1, 1.5]);
        const h1 = Math.sqrt(L * L - d1 * d1), h2 = Math.sqrt(L * L - d2 * d2); const drop = h1 - h2;
        return { html: `A ${B(L + ' m')} ladder leans against a vertical wall with its foot ${B(ds(d1) + ' m')} from the wall. The foot slips until it is ${B(ds(d2) + ' m')} from the wall. How far does the top of the ladder slide down the wall? Give your answer to 2 decimal places.`, unit: 'm', ...nAns(drop, { dp: 2, unit: 'm' }), format: dpFmt(2), hint: 'Work out the height reached before and after.',
          steps: [`Before: h = ${sq(`${L}<sup>2</sup> − ${ds(d1)}<sup>2</sup>`)} = ${fx(h1, 4)}… m`, `After: h = ${sq(`${L}<sup>2</sup> − ${ds(d2)}<sup>2</sup>`)} = ${fx(h2, 4)}… m`, `Distance slid = ${fx(h1, 4)}… − ${fx(h2, 4)}… = ${B(r2(drop))} m`] };
      }
      const a = r.int(3, 15), b = r.int(3, 15); const c = Math.hypot(a, b); const per = a + b + c; const n = Math.ceil(per - 1e-9); const pr = r.pick([3.5, 4, 4.5, 5, 6.25, 7.5, 8, 12]); const cost = n * pr;
      return { html: `A garden is a right-angled triangle. The two sides next to the right angle are ${B(a + ' m')} and ${B(b + ' m')}. Fencing is needed along all three sides. Fencing is sold in whole metres at ${B(money(pr))} per metre. How much will the fencing cost?`, ...nAns(cost, { money: true }), format: 'Type the amount in pounds, e.g. 125.50', hint: 'Find the third side, then the perimeter, then round up to whole metres.',
        steps: [`Third side = ${sq(`${a * a} + ${b * b}`)} = ${fx(c, 4)}… m`, `Perimeter = ${a} + ${b} + ${fx(c, 4)}… = ${fx(per, 4)}… m`, `Buy ${n} m of fencing (round up).`, `Cost = ${n} × ${money(pr)} = ${B(money(cost))}`] };
    }],
]);

// =========================================================================== standard form
addStyles('y9-standard-form', [
  ['Problems in context',
    'Very large and very small quantities in science are written in standard form. Multiply or divide the front numbers, use the index laws for the powers of 10, and adjust so the front number is between 1 and 10.',
    (r) => {
      const t = r.int(0, 4);
      if (t === 0) {
        const [item, k] = r.pick([['grain of rice', 2], ['grain of sand', 3], ['grain of salt', 4], ['speck of dust', 7], ['pollen grain', 8]]);
        const a = r.pick([1.2, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 6, 8]); const c = r.pick([2, 3, 4, 5, 6]); const n = r.int(3, 7);
        const tot = x9sf(rnd(a * c, 6) * 10 ** (n - k));
        return { html: `The mass of one ${item} is ${B(x9sfH(a, -k) + ' g')}. A container holds ${B(x9sfH(c, n))} of them. Work out the total mass in grams. Give your answer in standard form.`, ...x9sfAns(tot), unit: 'g', hint: 'Multiply the front numbers and add the powers.',
          steps: [`Total = (${x9sfH(a, -k)}) × (${x9sfH(c, n)})`, `= ${ps(rnd(a * c, 6))} × 10<sup>${ds(n - k)}</sup>`, `= ${B(tot.h)} g`] };
      }
      if (t === 1) {
        const [big, small, unit, eB, eS] = r.pick([['the Sun', 'the Earth', 'kg', 30, 24], ['a blue whale', 'a mouse', 'kg', 5, -2], ['a hard drive', 'a photo file', 'bytes', 12, 6], ['an elephant', 'an ant', 'g', 6, -3], ['a cruise ship', 'a bicycle', 'kg', 8, 1]]);
        let b, q; do { b = r.pick([1.2, 1.5, 2, 2.5, 3, 4]); q = r.pick([1.5, 2, 2.5, 3, 4, 5, 6]); } while (b * q >= 10);
        const eb = eB + r.int(-1, 0); const es = eS; const ma = rnd(b * q, 6); const ratio = q * 10 ** (eb - es);
        return { html: `The mass of ${big} is about ${B(x9sfH(ma, eb) + ' ' + unit)}. The mass of ${small} is about ${B(x9sfH(b, es) + ' ' + unit)}. How many times greater is the mass of ${big}? Give your answer as an ordinary number.`.replace(/mass of a hard drive/g, 'capacity of a hard drive').replace(/mass of a photo file/g, 'size of a photo file').replace(/the mass of a hard drive/g, 'the capacity of a hard drive'), ...nAns(ratio), answerHtml: B(ds(ratio)), hint: 'Divide the front numbers and subtract the powers.',
          steps: [`${ps(ma)} ÷ ${ps(b)} = ${ps(q)}`, `10<sup>${ds(eb)}</sup> ÷ 10<sup>${ds(es)}</sup> = 10<sup>${ds(eb - es)}</sup>`, `${ps(q)} × 10<sup>${ds(eb - es)}</sup> = ${B(ds(ratio))}`] };
      }
      if (t === 2) {
        const c = r.pick([1.2, 1.5, 2, 2.5, 3, 4, 5, 6, 8]); const n = r.int(1, 4); const what = r.pick(['A radio signal travels', 'Light travels', 'A laser pulse travels', 'A radar signal travels']);
        const target = r.pick(['a space probe', 'a distant satellite', 'a comet', 'a mirror on the Moon']);
        const dist = x9sf(rnd(3 * c, 6) * 10 ** (5 + n));
        return { html: `${what} at ${B('3 × 10<sup>5</sup> km per second')}. It takes ${B(x9sfH(c, n) + ' seconds')} to reach ${target}. How far away is ${target}? Give your answer in standard form, in km.`, ...x9sfAns(dist), unit: 'km', hint: 'Distance = speed × time.',
          steps: ['Distance = speed × time', `= (3 × 10<sup>5</sup>) × (${x9sfH(c, n)}) = ${ps(rnd(3 * c, 6))} × 10<sup>${5 + n}</sup>`, `= ${B(dist.h)} km`] };
      }
      if (t === 3) {
        const ai = r.int(11, 99), bi = r.int(11, 99); const e = r.int(5, 7); const totI = ai * 10 + bi; const tot = x9sf(totI * 10 ** (e - 1));
        const [p, q] = r.pick([['Country A', 'Country B'], ['City P', 'City Q'], ['Region X', 'Region Y']]);
        return { html: `The population of ${p} is ${B(x9sfH(ai / 10, e + 1))}. The population of ${q} is ${B(x9sfH(bi / 10, e))}. Work out the total population of the two places. Give your answer in standard form.`, ...x9sfAns(tot), hint: 'Write both numbers with the same power of 10 before adding.',
          steps: [`${x9sfH(ai / 10, e + 1)} = ${ps(ai)} × 10<sup>${e}</sup>`, `${ps(ai)} × 10<sup>${e}</sup> + ${x9sfH(bi / 10, e)} = ${ps(rnd(ai + bi / 10, 4))} × 10<sup>${e}</sup>`, `= ${B(tot.h)}`] };
      }
      const qq = r.pick([20, 25, 40, 50, 60, 75, 80, 120, 150, 200, 250, 400]); const c = r.pick([2, 4, 5, 6, 8]); const n = r.int(5, 7); const T = x9sf(qq * c * 10 ** n);
      const what = r.pick(['A government spends', 'A charity raises', 'A city council spends', 'A sports fund receives']);
      return { html: `${what} ${B('£' + T.h)} in one year. This is shared equally between ${B(x9sfH(c, n))} people. How much is this per person, in pounds?`, ...nAns(qq), answerLabel: '£', hint: 'Divide the total by the number of people.',
        steps: [`£${T.h} ÷ ${x9sfH(c, n)}`, `= ${ps(T.m)} ÷ ${c} × 10<sup>${ds(T.e)} − ${n}</sup> = ${ps(rnd(T.m / c, 6))} × 10<sup>${T.e - n}</sup>`, `= ${B('£' + ds(qq))}`] };
    }],
]);

// =========================================================================== percentage change
addStyles('y9-percentage-change', [
  ['Problems in context',
    'Write each percentage change as a multiplier and apply them one after another. For percentage profit or growth, use change ÷ original × 100.',
    (r) => {
      const t = r.int(0, 4);
      if (t === 0) {
        const P = 10 * r.int(3, 60), p = r.pick([10, 15, 20, 25, 30, 40]), q = r.pick([5, 10, 15, 20, 25, 30]); const F = P * (1 + p / 100) * (1 - q / 100);
        const item = r.pick(['a games console', 'a bike', 'a jacket', 'a pair of trainers', 'a tablet']);
        return { html: `The price of ${item} was ${B(money(P))}. The price was increased by ${B(p + '%')}. Later, in a sale, the new price was reduced by ${B(q + '%')}. Work out the sale price.`, ...nAns(F, { money: true }), format: 'Type the amount in pounds, e.g. 45.60', hint: 'Use one multiplier for each change.',
          steps: [`Increase: multiplier ${ps(1 + p / 100)}, decrease: multiplier ${ps(1 - q / 100)}`, `${money(P)} × ${ps(1 + p / 100)} = ${money(P * (1 + p / 100))}`, `${money(P * (1 + p / 100))} × ${ps(1 - q / 100)} = ${B(money(F))}`] };
      }
      if (t === 1) {
        const k = r.int(2, 40), p = 5 * r.int(1, 15); const c = 20 * k; const s = c * (100 + p) / 100; const n = r.int(10, 60);
        const item = r.pick(['cans of drink', 'notebooks', 'cupcakes', 'keyrings', 'phone cases']);
        return { html: `A shop buys ${B(n)} ${item} for a total of ${B(money(n * c / 100))}. It sells them for ${B(money(s / 100))} each. Work out the percentage profit.`, unit: '%', ...nAns(p, { unit: '%' }), hint: 'Find the cost of one item first.',
          steps: [`Cost of one = ${money(n * c / 100)} ÷ ${n} = ${money(c / 100)}`, `Profit on one = ${money(s / 100)} − ${money(c / 100)} = ${money((s - c) / 100)}`, `Percentage profit = ${money((s - c) / 100)} ÷ ${money(c / 100)} × 100 = ${B(p + '%')}`] };
      }
      if (t === 2) {
        const S = 1000 * r.int(18, 45), p = r.pick([2, 2.5, 3, 3.5, 4, 5, 6]); const inc = S * p / 100 / 12; const nm = r.pick(['Hannah', 'Omar', 'Chloe', 'Daniel', 'Aisha']);
        return { html: `${nm} earns ${B(money(S))} a year. She is given a pay rise of ${B(ps(p) + '%')}. How much more does she earn ${B('per month')} after the rise? Give your answer to the nearest penny.`.replace('She is', nm === 'Omar' || nm === 'Daniel' ? 'He is' : 'She is').replace('she earn', nm === 'Omar' || nm === 'Daniel' ? 'he earn' : 'she earn'), ...nAns(inc, { money: true }), format: 'Type the amount in pounds, e.g. 45.60', hint: 'Find the yearly increase, then divide by 12.',
          steps: [`Yearly increase = ${ps(p)}% of ${money(S)} = ${money(S * p / 100)}`, `Monthly increase = ${money(S * p / 100)} ÷ 12 = ${fx(inc, 4)}…`, `= ${B(money(inc))}`] };
      }
      if (t === 3) {
        const P = 500 * r.int(10, 60), p = r.pick([10, 15, 20, 25]), q = r.pick([10, 12, 15, 20]); const v1 = P * (1 - p / 100), v2 = v1 * (1 - q / 100);
        const item = r.pick(['A car', 'A van', 'A motorbike', 'A caravan']);
        return { html: `${item} is bought for ${B(money(P))}. In the first year its value falls by ${B(p + '%')}. In the second year its value falls by a further ${B(q + '%')}. What is its value at the end of the second year?`, ...nAns(v2, { money: true }), format: 'Type the amount in pounds, e.g. 4500', hint: 'The second percentage is of the new value, not the original.',
          steps: [`After year 1: ${money(P)} × ${ps(1 - p / 100)} = ${money(v1)}`, `After year 2: ${money(v1)} × ${ps(1 - q / 100)} = ${B(money(v2))}`] };
      }
      const A = r.int(2000, 20000), add = r.int(100, Math.floor(A / 3)); const Bn = A + add; const pc = add / A * 100;
      const [y1, y2] = r.pick([[2015, 2025], [2010, 2020], [2001, 2021], [2012, 2024]]); const what = r.pick(['town', 'village', 'school (number of pupils)', 'club (number of members)']);
      return { html: `The population of a ${what} was ${B(ds(A))} in ${y1} and ${B(ds(Bn))} in ${y2}. Work out the percentage increase. Give your answer to 1 decimal place.`.replace('population of a school (number of pupils)', 'number of pupils at a school').replace('population of a club (number of members)', 'number of members of a club'), unit: '%', ...nAns(pc, { dp: 1, unit: '%' }), format: dpFmt(1), hint: 'Increase ÷ original × 100.',
        steps: [`Increase = ${ds(Bn)} − ${ds(A)} = ${ds(add)}`, `Percentage increase = ${ds(add)} ÷ ${ds(A)} × 100 = ${fx(pc, 4)}…`, `= ${B(r1(pc) + '%')}`] };
    }],
  ['Reasoning: comparing offers',
    'Work out the final cost (or value) for each option separately, using multipliers. Then subtract to see how much better one option is.',
    (r) => {
      const t = r.int(0, 4);
      if (t === 0) {
        let P, Q, p, q, cA, cB; do { P = 5 * r.int(20, 100); Q = P + 5 * r.nz(-4, 4); p = r.pick([10, 15, 20, 25, 30]); q = r.pick([10, 15, 20, 25, 30, 35]); cA = P * (100 - p) / 100; cB = Q * (100 - q) / 100; } while (Math.abs(cA - cB) < 0.5);
        const item = r.pick(['washing machine', 'laptop', 'sofa', 'bike', 'television']);
        return { html: `The same ${item} is sold in two shops.<br>Shop A: ${B(money(P))} with ${B(p + '% off')}<br>Shop B: ${B(money(Q))} with ${B(q + '% off')}<br>How much cheaper is it in the cheaper shop?`, ...nAns(Math.abs(cA - cB), { money: true }), format: 'Type the amount in pounds, e.g. 12.50', hint: 'Work out both sale prices.',
          steps: [`Shop A: ${money(P)} × ${ps(1 - p / 100)} = ${money(cA)}`, `Shop B: ${money(Q)} × ${ps(1 - q / 100)} = ${money(cB)}`, `Difference = ${B(money(Math.abs(cA - cB)))} (Shop ${cA < cB ? 'A' : 'B'} is cheaper)`] };
      }
      if (t === 1) {
        const u = r.pick([1.2, 1.5, 1.8, 2.4, 3, 3.6, 4.5, 6]); const k = 3 * r.int(1, 4); const d = r.pick([20, 25, 30, 40, 45]); const c1 = u * k * 2 / 3, c2 = u * k * (100 - d) / 100;
        const item = r.pick(['tins of paint', 'bottles of juice', 'boxes of cereal', 'packs of batteries']);
        return { html: `${item[0].toUpperCase() + item.slice(1)} cost ${B(money(u))} each. Shop A has a “buy 3, pay for 2” offer. Shop B has ${B(d + '% off')} every item. Jo wants ${B(k)} ${item}. How much does she save by using the cheaper offer?`, ...nAns(Math.abs(c1 - c2), { money: true }), format: 'Type the amount in pounds, e.g. 1.20', hint: 'With “buy 3, pay for 2” you pay for two-thirds of the items.',
          steps: [`Shop A: pay for ${k * 2 / 3} items: ${k * 2 / 3} × ${money(u)} = ${money(c1)}`, `Shop B: ${k} × ${money(u)} × ${ps(1 - d / 100)} = ${money(c2)}`, `Saving = ${B(money(Math.abs(c1 - c2)))}`] };
      }
      if (t === 2) {
        let S, p, q, bonus, iA, iB; do { S = 500 * r.int(2, 20); p = r.pick([1.5, 2, 2.5, 3, 3.5, 4]); q = r.pick([1.5, 2, 2.5, 3]); bonus = 5 * r.int(2, 10); iA = S * p / 100; iB = S * q / 100 + bonus; } while (Math.abs(iA - iB) < 1);
        return { html: `Sam invests ${B(money(S))} for one year.<br>Account A pays ${B(ps(p) + '%')} interest.<br>Account B pays ${B(ps(q) + '%')} interest plus a ${B(money(bonus))} bonus.<br>How much more money does the better account give after one year?`, ...nAns(Math.abs(iA - iB), { money: true }), format: 'Type the amount in pounds, e.g. 12.50', hint: 'Find the total interest from each account.',
          steps: [`Account A: ${ps(p)}% of ${money(S)} = ${money(iA)}`, `Account B: ${ps(q)}% of ${money(S)} + ${money(bonus)} = ${money(S * q / 100)} + ${money(bonus)} = ${money(iB)}`, `Difference = ${B(money(Math.abs(iA - iB)))} (Account ${iA > iB ? 'A' : 'B'} is better)`] };
      }
      if (t === 3) {
        const P = 10 * r.int(10, 200), p = r.pick([10, 20, 25, 30, 40, 50]); const F = P * (1 + p / 100) * (1 - p / 100); const nm = r.pick(['Max', 'Ella', 'Josh', 'Nadia']);
        return { html: `A price of ${B(money(P))} is increased by ${B(p + '%')} and then the new price is decreased by ${B(p + '%')}. ${nm} says the price is now back to ${money(P)}. Show that ${nm} is wrong by working out how much less than ${money(P)} the final price is.`, ...nAns(P - F, { money: true }), format: 'Type the amount in pounds, e.g. 4.50', hint: 'The decrease is a percentage of the bigger, new price.',
          steps: [`After the increase: ${money(P)} × ${ps(1 + p / 100)} = ${money(P * (1 + p / 100))}`, `After the decrease: ${money(P * (1 + p / 100))} × ${ps(1 - p / 100)} = ${money(F)}`, `${money(P)} − ${money(F)} = ${B(money(P - F))} less`] };
      }
      let m1, P, m2, d, tA, tB; do { m1 = r.int(25, 60); P = 10 * r.int(10, 40); m2 = r.int(18, 45); d = r.pick([10, 20, 25]); tA = 24 * m1; tB = P + 24 * m2 * (100 - d) / 100; } while (Math.abs(tA - tB) < 5);
      return { html: `Two 24-month phone contracts:<br>Contract A: free phone, ${B(money(m1))} per month.<br>Contract B: ${B(money(P))} for the phone, then ${B(money(m2))} per month with ${B(d + '% off')} the monthly price.<br>Over the 24 months, how much cheaper is the cheaper contract?`, ...nAns(Math.abs(tA - tB), { money: true }), format: 'Type the amount in pounds, e.g. 54.40', hint: 'Find the total cost of each contract over 24 months.',
        steps: [`Contract A: 24 × ${money(m1)} = ${money(tA)}`, `Contract B monthly: ${money(m2)} × ${ps(1 - d / 100)} = ${money(m2 * (100 - d) / 100)}`, `Contract B total: ${money(P)} + 24 × ${money(m2 * (100 - d) / 100)} = ${money(tB)}`, `Difference = ${B(money(Math.abs(tA - tB)))} (Contract ${tA < tB ? 'A' : 'B'} is cheaper)`] };
    }],
]);

// =========================================================================== inequalities
addStyles('y9-inequalities', [
  ['Problems in context',
    'Turn the words into an inequality (“at most” is ≤, “less than” is <, “at least” is ≥). Solve it, then think about what whole-number answer makes sense in the context.',
    (r) => {
      const t = r.int(0, 4);
      if (t === 0) {
        let a, b, M, v; do { a = r.pick([2.5, 3, 3.5, 4, 4.5, 5]); b = r.pick([1.2, 1.5, 1.8, 2, 2.2, 2.5]); M = r.int(15, 60); v = rnd((M - a) / b, 6); } while (v < 3);
        const n = Math.floor(v + 1e-9);
        return { html: `A taxi charges ${B(money(a))} plus ${B(money(b))} per mile. Kai has ${B(money(M))} and cannot spend more than this. What is the greatest whole number of miles he can travel?`, answerLabel: 'miles =', ...nAns(n), hint: 'Write a + bn ≤ M and solve.',
          steps: [`${ps(a)} + ${ps(b)}<i>n</i> ≤ ${M}`, `${ps(b)}<i>n</i> ≤ ${ps(rnd(M - a, 4))}, so <i>n</i> ≤ ${ps(v, 3)}${rnd(v, 3) !== v ? '…' : ''}`, `Greatest whole number of miles = ${B(n)}`] };
      }
      if (t === 1) {
        const L = 50 * r.int(8, 20), a = r.int(60, 110), b = r.int(15, 40); const n = Math.floor((L - a) / b);
        const who = r.pick(['A lift', 'A goods lift', 'A small boat', 'A delivery van ramp']);
        return { html: `${who} has a maximum safe load of ${B(L + ' kg')}. A worker of mass ${B(a + ' kg')} travels with some boxes, each of mass ${B(b + ' kg')}. What is the greatest number of boxes that can be taken at once?`, ...nAns(n), hint: 'Total mass ≤ maximum load.',
          steps: [`${a} + ${b}<i>n</i> ≤ ${L}`, `${b}<i>n</i> ≤ ${L - a}, so <i>n</i> ≤ ${ps((L - a) / b, 3)}${rnd((L - a) / b, 3) !== (L - a) / b ? '…' : ''}`, `Greatest number of boxes = ${B(n)}`] };
      }
      if (t === 2) {
        let P, k, ans; do { P = r.int(30, 90); k = r.int(2, 9); ans = Math.ceil((P - 2 * k) / 4) - 1; } while (ans < 2);
        const bound = (P - 2 * k) / 4;
        return { html: `A rectangle has width ${B('<i>x</i> cm')} and length ${B(tx(`(${lin(1, k)})`) + ' cm')}, where <i>x</i> is a whole number. The perimeter must be ${B(`less than ${P} cm`)}. What is the greatest possible value of <i>x</i>?`, answerLabel: 'x =', ...nAns(ans), hint: 'Perimeter = 2 × (width + length).',
          steps: [`Perimeter = 2(<i>x</i> + <i>x</i> + ${k}) = ${tx(lin(4, 2 * k))}`, `${tx(lin(4, 2 * k))} &lt; ${P}, so 4<i>x</i> &lt; ${P - 2 * k}`, `<i>x</i> &lt; ${ds(bound)}`, `Greatest whole number: <i>x</i> = ${B(ans)}`] };
      }
      if (t === 3) {
        const a = r.int(2, 5), b = r.nz(-7, 7); const k1 = r.int(-5, 2), k2 = k1 + r.int(3, 7); const L = a * k1 + b, U = a * k2 + b;
        const cnt = k2 - k1; // k1 < n ≤ k2
        return { html: `How many integers <i>n</i> satisfy ${B(`${ds(L)} &lt; ${tx(lin(a, b, 'n'))} ≤ ${ds(U)}`)}?`, ...nAns(cnt), hint: 'Solve the double inequality, then count the integers carefully at each end.',
          steps: [`${b > 0 ? 'Subtract' : 'Add'} ${Math.abs(b)}: ${ds(L - b)} &lt; ${a}<i>n</i> ≤ ${ds(U - b)}`, `Divide by ${a}: ${ds(k1)} &lt; <i>n</i> ≤ ${ds(k2)}`, `Integers ${ds(k1 + 1)} to ${ds(k2)}: that is ${B(cnt)} integers`] };
      }
      let T, s, p, n; do { T = 50 * r.int(10, 40); s = 25 * r.int(2, 12); p = r.pick([8, 12, 15, 18, 20, 25, 30]); n = Math.ceil((T - s) / p); } while (T - s <= 0 || (T - s) % p === 0);
      return { html: `A school trip must raise ${B('at least ' + money(T))}. The school gives ${B(money(s))} and each student pays ${B(money(p))}. What is the smallest number of students needed?`, ...nAns(n), hint: 'Write s + pn ≥ T and solve.',
        steps: [`${s} + ${p}<i>n</i> ≥ ${T}`, `${p}<i>n</i> ≥ ${T - s}, so <i>n</i> ≥ ${ps((T - s) / p, 3)}…`, `Students must be whole people, so round up: ${B(n)}`] };
    }],
]);

// =========================================================================== straight-line graphs
addStyles('y9-straight-line-graphs', [
  ['Linear graphs in context',
    'Real-life straight-line relationships follow y = mx + c. The gradient m is the rate (cost per hour, cm per hour, …) and the intercept c is the starting value. Use two known points to find m, then c.',
    (r) => {
      const t = r.int(0, 4); const ask = r.int(0, 2);
      const solve = (x1, y1, x2, y2, f) => { const m = (y2 - y1) / (x2 - x1); const c = y1 - m * x1; return [m, c, [`Gradient (rate) = (${f(y2)} − ${f(y1)}) ÷ (${ds(x2)} − ${ds(x1)}) = ${f(rnd(y2 - y1, 6))} ÷ ${ds(x2 - x1)} = ${f(rnd(m, 6))}`, `Intercept: ${f(y1)} − ${ds(x1)} × ${f(rnd(m, 6))} = ${f(rnd(c, 6))}`]]; };
      if (t === 0 || t === 1) {
        const plumb = t === 0; const c = plumb ? 5 * r.int(4, 12) : r.pick([2, 2.5, 3, 3.5, 4]); const m = plumb ? 5 * r.int(5, 12) : r.pick([1.5, 1.8, 2, 2.2, 2.5]);
        let x1, x2; do { x1 = r.int(1, plumb ? 6 : 12); x2 = r.int(1, plumb ? 6 : 12); } while (x1 >= x2);
        const y1 = c + m * x1, y2 = c + m * x2; const [, , st] = solve(x1, y1, x2, y2, (v) => money(v));
        const x3 = r.int(plumb ? 7 : 13, plumb ? 9 : 25); const xu = plumb ? 'hours' : 'miles';
        const intro = plumb ? `A plumber charges a fixed call-out fee plus an hourly rate. A ${x1}-hour job costs ${B(money(y1))} and a ${x2}-hour job costs ${B(money(y2))}.` : `A taxi firm charges a fixed amount plus a cost per mile. A ${x1}-mile journey costs ${B(money(y1))} and a ${x2}-mile journey costs ${B(money(y2))}.`;
        const q = [plumb ? 'Work out the call-out fee.' : 'Work out the fixed charge.', plumb ? 'Work out the hourly rate.' : 'Work out the cost per mile.', `Work out the cost of a ${x3}-${xu.slice(0, -1)} ${plumb ? 'job' : 'journey'}.`][ask];
        const ans = [c, m, c + m * x3][ask];
        return { html: `${intro} ${q}`, ...nAns(ans, { money: true }), format: 'Type the amount in pounds, e.g. 45.50', hint: 'Find the rate from the difference between the two costs first.',
          steps: [st[0], ...(ask === 1 ? [`The rate is ${B(money(m))} per ${xu.slice(0, -1)}`] : [st[1].replace('Intercept', 'Fixed charge'), ...(ask === 0 ? [`Fixed charge = ${B(money(c))}`] : [`Cost = ${money(c)} + ${x3} × ${money(m)} = ${B(money(ans))}`])])] };
      }
      if (t === 2) {
        const k = r.pick([1.5, 2, 2.5, 3]), T = r.int(6, 16); const h0 = k * T; let t1, t2; do { t1 = r.int(1, T - 2); t2 = r.int(2, T - 1); } while (t1 >= t2);
        const y1 = h0 - k * t1, y2 = h0 - k * t2; const askT = ask !== 0;
        return { html: `A candle burns down at a steady rate. After ${B(t1 + ' hours')} it is ${B(ds(y1) + ' cm')} tall. After ${B(t2 + ' hours')} it is ${B(ds(y2) + ' cm')} tall. ${askT ? 'How many hours after it was lit will the candle have burnt down completely?' : 'How tall was the candle before it was lit?'}`, unit: askT ? 'hours' : 'cm', ...nAns(askT ? T : h0, { unit: askT ? 'hours' : 'cm' }), hint: 'Find how many cm it burns each hour.',
          steps: [`Rate = (${ds(y1)} − ${ds(y2)}) ÷ (${t2} − ${t1}) = ${ds(k)} cm per hour`, `Starting height = ${ds(y1)} + ${t1} × ${ds(k)} = ${ds(h0)} cm`, ...(askT ? [`Time to burn out = ${ds(h0)} ÷ ${ds(k)} = ${B(T)} hours`] : [`Height before lighting = ${B(ds(h0))} cm`])] };
      }
      if (t === 3) {
        const L0 = r.int(10, 25), k = r.pick([0.5, 1, 1.5, 2, 2.5, 3]); let w1, w2; do { w1 = r.int(1, 5); w2 = r.int(2, 8); } while (w1 >= w2);
        const y1 = L0 + k * w1, y2 = L0 + k * w2; const w3 = r.int(9, 12); const askL0 = ask === 0;
        return { html: `A spring stretches steadily as weights are hung on it. With ${B(w1 + ' kg')} hanging it is ${B(ds(y1) + ' cm')} long. With ${B(w2 + ' kg')} it is ${B(ds(y2) + ' cm')} long. ${askL0 ? 'How long is the spring with no weight on it?' : `How long will it be with ${w3} kg hanging on it?`}`, unit: 'cm', ...nAns(askL0 ? L0 : L0 + k * w3, { unit: 'cm' }), hint: 'Find how much it stretches per kg.',
          steps: [`Stretch per kg = (${ds(y2)} − ${ds(y1)}) ÷ (${w2} − ${w1}) = ${ds(k)} cm`, `Natural length = ${ds(y1)} − ${w1} × ${ds(k)} = ${ds(L0)} cm`, ...(askL0 ? [`Answer: ${B(ds(L0))} cm`] : [`Length = ${ds(L0)} + ${w3} × ${ds(k)} = ${B(ds(L0 + k * w3))} cm`])] };
      }
      const k = r.int(4, 25), T = r.int(10, 40); const V0 = k * T; let t1, t2; do { t1 = r.int(1, T - 2); t2 = r.int(2, T - 1); } while (t1 >= t2);
      const askT = ask !== 0;
      return { html: `Water drains from a tank at a constant rate. After ${B(t1 + ' minutes')} there are ${B(V0 - k * t1 + ' litres')} left. After ${B(t2 + ' minutes')} there are ${B(V0 - k * t2 + ' litres')} left. ${askT ? 'After how many minutes (from the start) will the tank be empty?' : 'How much water was in the tank at the start?'}`, unit: askT ? 'minutes' : 'litres', ...nAns(askT ? T : V0, { unit: askT ? 'minutes' : 'litres' }), hint: 'Find the number of litres lost each minute.',
        steps: [`Rate = (${V0 - k * t1} − ${V0 - k * t2}) ÷ (${t2} − ${t1}) = ${k} litres per minute`, `At the start: ${V0 - k * t1} + ${t1} × ${k} = ${V0} litres`, ...(askT ? [`Time to empty = ${V0} ÷ ${k} = ${B(T)} minutes`] : [`Answer: ${B(V0)} litres`])] };
    }],
]);

// =========================================================================== direct proportion
addStyles('y9-direct-proportion', [
  ['Problems in context',
    'Find the value of one unit (one biscuit, one litre, one kilometre, one pound) and then scale up. When there are several limits, work out each one and use the smallest.',
    (r) => {
      const t = r.int(0, 4);
      if (t === 0) {
        const k = r.pick([10, 12, 15, 20, 24]); const uf = r.pick([10, 15, 20, 25]), ub = r.pick([5, 8, 10, 12]); let nF, nB; do { nF = r.int(20, 80); nB = r.int(20, 80); } while (nF === nB);
        const nm = r.pick(['Asha', 'Ben', 'Carys', 'Dev']); const food = r.pick(['biscuits', 'flapjacks', 'cookies', 'scones']);
        return { html: `A recipe for ${B(k + ' ' + food)} uses ${B(uf * k + ' g')} of flour and ${B(ub * k + ' g')} of butter. ${nm} has ${B(uf * nF + ' g')} of flour and ${B(ub * nB + ' g')} of butter. What is the greatest number of ${food} ${nm} can make?`, ...nAns(Math.min(nF, nB)), hint: 'Work out how many each ingredient is enough for.',
          steps: [`Per item: ${uf * k} ÷ ${k} = ${uf} g flour and ${ub * k} ÷ ${k} = ${ub} g butter`, `Flour is enough for ${uf * nF} ÷ ${uf} = ${nF}; butter is enough for ${ub * nB} ÷ ${ub} = ${nB}`, `The smaller number limits it: ${B(Math.min(nF, nB))} ${food}`] };
      }
      if (t === 1) {
        const rate = r.pick([1.15, 1.16, 1.18, 1.2, 1.25]); const P = r.int(40, 200) + r.pick([0, 0.5, 0.99]); let E; do { E = r.int(40, 240); } while (Math.abs(E / rate - P) < 1);
        const item = r.pick(['pair of headphones', 'watch', 'pair of boots', 'camera']); const cheaper = E / rate < P ? 'France' : 'the UK';
        return { html: `A ${item} costs ${B(money(P))} in the UK and ${B('€' + ds(E))} in France. The exchange rate is ${B('£1 = €' + fx(rate, 2))}. In which country is it cheaper, and by how much in pounds? Give the difference to the nearest penny.`, ...nAns(Math.abs(P - E / rate), { money: true }), format: 'Type the difference in pounds, e.g. 4.35', hint: 'Convert the euro price into pounds by dividing by the rate.',
          steps: [`€${ds(E)} ÷ ${fx(rate, 2)} = ${fx(E / rate, 4)}… = ${money(E / rate)}`, `Difference = ${money(Math.max(P, E / rate))} − ${money(Math.min(P, E / rate))}`, `It is cheaper in ${cheaper} by ${B(money(Math.abs(P - E / rate)))}`] };
      }
      if (t === 2) {
        const L = r.pick([4.5, 5, 5.5, 6, 6.5, 7, 8]), D = 10 * r.int(8, 60), f = r.pick([1.39, 1.45, 1.52, 1.48, 1.6]); const litres = L * D / 100; const cost = litres * f;
        return { html: `A car uses ${B(ds(L) + ' litres')} of fuel for every ${B('100 km')}. Fuel costs ${B(money(f) + ' per litre')}. Work out the cost of the fuel for a ${B(D + ' km')} journey. Give your answer to the nearest penny.`, ...nAns(cost, { money: true }), format: 'Type the amount in pounds, e.g. 23.45', hint: 'Find the litres needed first.',
          steps: [`Litres needed = ${ds(L)} × ${D} ÷ 100 = ${ds(litres)} litres`, `Cost = ${ds(litres)} × ${money(f)} = ${fx(cost, 4)}…`, `= ${B(money(cost))}`] };
      }
      if (t === 3) {
        const per = r.pick([10, 12, 15, 16, 20]); const tin = r.pick([2.5, 5]); const cover = per * tin; const a = r.int(3, 9), b = r.int(2, 4); const area = a * b; const L = area / per;
        return { html: `A ${ds(tin)}-litre tin of paint covers ${B(cover + ' m²')}. A wall is ${B(a + ' m')} long and ${B(b + ' m')} high. How many litres of paint are needed for one coat on the wall?`, unit: 'litres', ...nAns(L, { unit: 'litres' }), hint: 'Find the area covered by 1 litre.',
          steps: [`1 litre covers ${cover} ÷ ${ds(tin)} = ${per} m²`, `Wall area = ${a} × ${b} = ${area} m²`, `Paint needed = ${area} ÷ ${per} = ${B(ds(L))} litres`] };
      }
      let s1, p1, s2, p2, u1, u2; do { s1 = r.pick([250, 330, 500, 750]); s2 = r.pick([1000, 1500, 2000]); u1 = r.int(90, 260); u2 = r.int(90, 260); p1 = u1 * s1 / 1000 / 100; p2 = u2 * s2 / 1000 / 100; } while (Math.abs(u1 - u2) < 5 || Math.round(p1 * 100) !== rnd(p1 * 100, 6) || Math.round(p2 * 100) !== rnd(p2 * 100, 6));
      const drink = r.pick(['orange juice', 'lemonade', 'milk', 'apple juice']);
      return { html: `A small bottle of ${drink} holds ${B(s1 + ' ml')} and costs ${B(money(p1))}. A large bottle holds ${B(ds(s2 / 1000) + ' litres')} and costs ${B(money(p2))}. Work out the cost per litre of each. How much cheaper per litre is the better value bottle?`, ...nAns(Math.abs(u1 - u2) / 100, { money: true }), format: 'Type the amount in pounds, e.g. 0.35', hint: 'Cost per litre = cost ÷ number of litres.',
        steps: [`Small: ${money(p1)} ÷ ${ds(s1 / 1000)} = ${money(u1 / 100)} per litre`, `Large: ${money(p2)} ÷ ${ds(s2 / 1000)} = ${money(u2 / 100)} per litre`, `Difference = ${B(money(Math.abs(u1 - u2) / 100))} per litre (the ${u1 < u2 ? 'small' : 'large'} bottle is better value)`] };
    }],
]);

// =========================================================================== polygons
addStyles('y9-polygons', [
  ['Problems in context',
    'Remember the key facts: exterior angles add up to 360°, interior + exterior = 180° at each vertex, interior angles add up to (n − 2) × 180°, and angles around a point add up to 360°.',
    (r) => {
      const t = r.int(0, 4); const NAME = { 3: 'equilateral triangle', 4: 'square', 5: 'regular pentagon', 6: 'regular hexagon', 8: 'regular octagon', 9: 'regular nonagon', 10: 'regular decagon', 12: 'regular dodecagon' };
      if (t === 0) {
        const k = r.pick([2, 3, 4, 5, 8, 9, 11, 14, 17]); const ext = 180 / (k + 1), n = 360 / ext;
        return { html: `Each interior angle of a regular polygon is ${B(k + ' times')} the size of each exterior angle. How many sides does the polygon have?`, ...nAns(n), hint: 'Interior + exterior = 180°.',
          steps: [`Let the exterior angle be <i>e</i>. Then <i>e</i> + ${k}<i>e</i> = 180°`, `${k + 1}<i>e</i> = 180°, so <i>e</i> = ${deg(ext)}`, `Number of sides = 360° ÷ ${deg(ext)} = ${B(n)}`] };
      }
      if (t === 1) {
        let n = r.pick([5, 6]); let S = (n - 2) * 180; let x, terms, last; let guard = 0;
        do { x = r.int(20, 60); terms = []; for (let i = 0; i < n - 1; i++) terms.push([r.int(1, 3), 5 * r.int(-4, 8)]); last = S - sum(terms.map(([c, k]) => c * x + k)); } while ((last < 60 || last > 175 || terms.some(([c, k]) => c * x + k < 40 || c * x + k > 175) || terms.every(([c]) => c === 1)) && ++guard < 4000);
        if (guard >= 4000) { n = 5; S = 540; x = 50; terms = [[2, 0], [1, 30], [3, -20], [2, -10]]; last = 140; }
        const C = sum(terms.map(([c]) => c)), K = sum(terms.map(([, k]) => k));
        const angs = terms.map(([c, k]) => `${x9br(c, k)}°`); angs.push(`${last}°`);
        const askBig = r.chance(0.35); const vals = terms.map(([c, k]) => c * x + k).concat(last); const big = Math.max(...vals);
        return { html: `The interior angles of a ${n === 5 ? 'pentagon' : 'hexagon'} are ${B(angs.join(', '))}. ${askBig ? 'Work out the size of the largest angle.' : 'Work out the value of <i>x</i>.'}`, ...(askBig ? { unit: '°', ...nAns(big, { unit: '°' }) } : { answerLabel: 'x =', ...nAns(x) }), hint: `The angles in a ${n === 5 ? 'pentagon' : 'hexagon'} add up to ${S}°.`,
          steps: [`Sum of interior angles = (${n} − 2) × 180° = ${S}°`, `${tx(lin(C, K + last))} = ${S}`, `${tx(coefT(C, 'x'))} = ${S - K - last}, so <i>x</i> = ${x}`, ...(askBig ? [`The angles are ${vals.join('°, ')}°, so the largest is ${B(big + '°')}`] : [`<i>x</i> = ${B(x)}`])] };
      }
      if (t === 2) {
        const opts = [3, 4, 5, 6, 8, 10, 12]; const n1 = r.pick(opts); let n2; do { n2 = r.pick(opts); } while (n2 === n1);
        const i1 = 180 - 360 / n1, i2 = 180 - 360 / n2; const gap = 360 - i1 - i2;
        return { html: `A ${NAME[n1]} and a ${NAME[n2]} are placed so that they share one side and meet at a point. Work out the size of the angle between their other two sides at that point (outside both shapes).`, unit: '°', ...nAns(gap, { unit: '°' }), hint: 'Angles around a point add up to 360°.',
          steps: [`Interior angle of the ${NAME[n1]} = 180° − 360° ÷ ${n1} = ${deg(i1)}`, `Interior angle of the ${NAME[n2]} = 180° − 360° ÷ ${n2} = ${deg(i2)}`, `Angle = 360° − ${deg(i1)} − ${deg(i2)} = ${B(deg(gap))}`] };
      }
      if (t === 3) {
        const n = r.int(5, 24); const S = (n - 2) * 180; const nm = r.pick(['Leah', 'Arjun', 'Mia', 'Tariq']);
        return { html: `${nm} measures all the interior angles of a polygon and adds them up. The total is ${B(ds(S) + '°')}. How many sides does the polygon have?`, ...nAns(n), hint: 'Sum = (n − 2) × 180°.',
          steps: [`(<i>n</i> − 2) × 180 = ${S}`, `<i>n</i> − 2 = ${S} ÷ 180 = ${n - 2}`, `<i>n</i> = ${B(n)}`] };
      }
      const opts = [5, 6, 8, 9, 10, 12, 15, 18, 20]; const n1 = r.pick(opts.slice(0, -1)); let n2; do { n2 = r.pick(opts); } while (n2 <= n1);
      const i1 = 180 - 360 / n1, i2 = 180 - 360 / n2;
      return { html: `Work out how much bigger each interior angle of a regular ${n2}-sided polygon is than each interior angle of a regular ${n1}-sided polygon.`, unit: '°', ...nAns(i2 - i1, { unit: '°' }), hint: 'Find each interior angle from its exterior angle.',
        steps: [`${n1} sides: exterior = 360° ÷ ${n1} = ${deg(360 / n1)}, interior = ${deg(i1)}`, `${n2} sides: exterior = 360° ÷ ${n2} = ${deg(360 / n2)}, interior = ${deg(i2)}`, `Difference = ${deg(i2)} − ${deg(i1)} = ${B(deg(i2 - i1))}`] };
    }],
]);

// =========================================================================== speed, distance, time
addStyles('y9-speed-distance-time', [
  ['Problems in context',
    'Average speed = total distance ÷ total time. Keep the units consistent: convert minutes to hours (÷ 60) for km/h, and use × 3.6 to change m/s into km/h.',
    (r) => {
      const t = r.int(0, 3);
      if (t === 0) {
        const t1 = r.pick([0.5, 1, 1.5, 2, 2.5, 0.75]), t2 = r.pick([0.5, 1, 1.5, 2, 0.25]); const s1 = 5 * r.int(6, 22), s2 = 5 * r.int(6, 22); const d1 = s1 * t1, d2 = s2 * t2; const av = (d1 + d2) / (t1 + t2);
        const who = r.pick(['A coach', 'A delivery van', 'Mrs Patel', 'A family car']);
        return { html: `${who} travels ${B(ds(d1) + ' km')} in ${B(x9hrs(t1))}, then ${B(ds(d2) + ' km')} in ${B(x9hrs(t2))}. Work out the average speed for the whole journey in km/h. Give your answer to 1 decimal place.`, unit: 'km/h', ...nAns(av, { dp: 1, unit: 'km/h' }), format: dpFmt(1), hint: 'Total distance ÷ total time — do not average the two speeds.',
          steps: [`Total distance = ${ds(d1)} + ${ds(d2)} = ${ds(d1 + d2)} km`, `Total time = ${ps(t1)} + ${ps(t2)} = ${ps(t1 + t2)} hours`, `Average speed = ${ds(d1 + d2)} ÷ ${ps(t1 + t2)} = ${fx(av, 4)}… = ${B(r1(av))} km/h`] };
      }
      if (t === 1) {
        let s, tm; do { s = r.pick([40, 48, 50, 60, 64, 72, 80, 90, 96, 100, 120]); tm = 15 * r.int(2, 16); } while ((s * tm) % 60);
        const D = s * tm / 60; const dep = 60 * r.int(6, 15) + 5 * r.int(0, 11); const early = 5 * r.int(1, 9); const start = dep + tm + early;
        const ev = r.pick(['a meeting', 'a job interview', 'a football match', 'a concert']); const who = r.pick(['Grace', 'Liam', 'Noor', 'Ethan']);
        return { html: `${who} leaves home at ${B(x9hm(dep))} to drive ${B(ds(D) + ' km')} to ${ev} that starts at ${B(x9hm(start))}. ${who} drives at an average speed of ${B(s + ' km/h')}. How many minutes before the start does ${who} arrive?`, unit: 'minutes', ...nAns(early, { unit: 'minutes' }), hint: 'Time = distance ÷ speed; then convert to minutes.',
          steps: [`Time = ${ds(D)} ÷ ${s} = ${ps(tm / 60)} hours = ${tm} minutes`, `Arrival time = ${x9hm(dep)} + ${tm} minutes = ${x9hm(dep + tm)}`, `From ${x9hm(dep + tm)} to ${x9hm(start)} is ${B(early)} minutes`] };
      }
      if (t === 2) {
        if (r.chance()) {
          const v = r.pick([5, 6, 7.5, 8, 9, 10, 12.5]); const tt = r.pick([8, 10, 12, 16, 20, 40]); const d = v * tt; const who = r.pick(['A sprinter', 'A cyclist', 'A racehorse', 'A greyhound']);
          return { html: `${who} covers ${B(ds(d) + ' m')} in ${B(tt + ' seconds')}. Work out the average speed in km/h.`, unit: 'km/h', ...nAns(v * 3.6, { unit: 'km/h' }), hint: 'Find the speed in m/s, then multiply by 3600 and divide by 1000.',
            steps: [`Speed = ${ds(d)} ÷ ${tt} = ${ds(v)} m/s`, `In one hour: ${ds(v)} × 3600 = ${ds(v * 3600)} m`, `= ${ds(v * 3600)} ÷ 1000 = ${B(ds(v * 3.6))} km/h`] };
        }
        const kmh = r.pick([18, 36, 45, 54, 72, 90, 108, 126]); const who = r.pick(['A train', 'A car', 'A motorbike', 'A speedboat']);
        return { html: `${who} travels at ${B(kmh + ' km/h')}. Work out this speed in metres per second.`, unit: 'm/s', ...nAns(kmh / 3.6, { unit: 'm/s' }), hint: '1 km = 1000 m and 1 hour = 3600 s.',
          steps: [`${kmh} km/h = ${ds(kmh * 1000)} m per hour`, `÷ 3600 to get metres per second`, `${ds(kmh * 1000)} ÷ 3600 = ${B(ds(kmh / 3.6))} m/s`] };
      }
      const s1 = r.int(3, 6), s2 = r.int(3, 6), tm = r.pick([15, 20, 30, 40, 45, 60, 75, 90]); const D = (s1 + s2) * tm / 60; const [a, b] = r.pick([['Amy', 'Raj'], ['Tom', 'Lucy'], ['Kofi', 'Jess'], ['Sara', 'Ollie']]);
      return { html: `${a} and ${b} are ${B(ds(D) + ' km')} apart. They start walking towards each other at the same time. ${a} walks at ${B(s1 + ' km/h')} and ${b} walks at ${B(s2 + ' km/h')}. After how many minutes do they meet?`, unit: 'minutes', ...nAns(tm, { unit: 'minutes' }), hint: 'Together they close the gap at the sum of their speeds.',
        steps: [`The gap closes at ${s1} + ${s2} = ${s1 + s2} km/h`, `Time = ${ds(D)} ÷ ${s1 + s2} = ${ps(tm / 60, 4)}${rnd(tm / 60, 4) !== tm / 60 ? '…' : ''} hours`, `= ${B(tm)} minutes`] };
    }],
  ['Reverse problem',
    'Work backwards from what you know: total distance and total time give the average speed; subtract the part of the journey already done to find what is left, then use speed = distance ÷ time on that part.',
    (r) => {
      const t = r.int(0, 3);
      if (t === 0) {
        const t1 = r.pick([0.5, 1, 1.5, 2]), t2 = r.pick([0.5, 1, 1.5, 2, 2.5]); const s1 = 5 * r.int(6, 20), s2 = 5 * r.int(6, 20); const d1 = s1 * t1, D = d1 + s2 * t2;
        const who = r.pick(['A lorry driver', 'A coach', 'Mr Ahmed', 'A cyclist on an e-bike']);
        return { html: `${who} makes a ${B(ds(D) + ' km')} journey in ${B(x9hrs(t1 + t2))}. The first ${B(ds(d1) + ' km')} take ${B(x9hrs(t1))}. Work out the average speed for the rest of the journey.`, unit: 'km/h', ...nAns(s2, { unit: 'km/h' }), hint: 'Find the distance and time left.',
          steps: [`Distance left = ${ds(D)} − ${ds(d1)} = ${ds(D - d1)} km`, `Time left = ${ps(t1 + t2)} − ${ps(t1)} = ${ps(t2)} hours`, `Speed = ${ds(D - d1)} ÷ ${ps(t2)} = ${B(s2)} km/h`] };
      }
      if (t === 1) {
        let t2, s2; do { t2 = r.pick([30, 40, 45, 60, 75, 90, 120]); s2 = 4 * r.int(10, 25); } while ((s2 * t2) % 60);
        const d2 = s2 * t2 / 60; const t1 = 5 * r.int(6, 24), d1 = r.int(10, 60); const T = t1 + t2; const nm = r.pick(['Jasmine', 'Callum', 'Fatima', 'Rhys']);
        return { html: `${nm} must complete a ${B(ds(d1 + d2) + ' km')} drive in ${B(T + ' minutes')}. ${nm} has driven ${B(d1 + ' km')} in the first ${B(t1 + ' minutes')}. What average speed, in km/h, is needed for the rest of the drive to finish exactly on time?`, unit: 'km/h', ...nAns(s2, { unit: 'km/h' }), hint: 'Convert the time left into hours.',
          steps: [`Distance left = ${ds(d1 + d2)} − ${d1} = ${ds(d2)} km`, `Time left = ${T} − ${t1} = ${t2} minutes = ${ps(t2 / 60, 4)}${rnd(t2 / 60, 4) !== t2 / 60 ? '…' : ''} hours`, `Speed = ${ds(d2)} ÷ ${frac(t2, 60)} = ${B(s2)} km/h`] };
      }
      if (t === 2) {
        const sp = [40, 48, 50, 60, 64, 72, 80, 90, 96, 100, 120]; let s1, s2, D; do { s1 = r.pick(sp); s2 = r.pick(sp); D = 10 * r.int(6, 40); } while (s1 >= s2 || (D * 60) % s1 || (D * 60) % s2);
        const m1 = D * 60 / s1, m2 = D * 60 / s2;
        return { html: `A journey of ${B(D + ' km')} can be made by coach at an average speed of ${B(s1 + ' km/h')} or by train at an average speed of ${B(s2 + ' km/h')}. How many minutes quicker is the train?`, unit: 'minutes', ...nAns(m1 - m2, { unit: 'minutes' }), hint: 'Work out each time in minutes.',
          steps: [`Coach: ${D} ÷ ${s1} hours = ${m1} minutes`, `Train: ${D} ÷ ${s2} hours = ${m2} minutes`, `Difference = ${m1} − ${m2} = ${B(m1 - m2)} minutes`] };
      }
      const v = r.pick([4, 5, 8, 10, 12, 15, 20, 25]); const mins = r.pick([5, 10, 12, 15, 20, 25, 30]); const D = v * 60 * mins / 1000; const what = r.pick(['A drone', 'A model plane', 'A delivery robot', 'A cyclist']);
      return { html: `${what} travels ${B(ds(D) + ' km')} at a constant speed of ${B(v + ' m/s')}. How many minutes does the journey take?`, unit: 'minutes', ...nAns(mins, { unit: 'minutes' }), hint: 'Change km to m first.',
        steps: [`${ds(D)} km = ${ds(D * 1000)} m`, `Time = ${ds(D * 1000)} ÷ ${v} = ${ds(D * 1000 / v)} seconds`, `${ds(D * 1000 / v)} ÷ 60 = ${B(mins)} minutes`] };
    }],
]);

// =========================================================================== density
addStyles('y9-density', [
  ['Problems in context',
    'Use density = mass ÷ volume, mass = density × volume and volume = mass ÷ density. You may need to find a volume first (e.g. of a cuboid), or convert grams to kilograms (÷ 1000).',
    (r) => {
      const t = r.int(0, 4); const [mat, d] = r.pick([['aluminium', 2.7], ['steel', 7.8], ['copper', 8.9], ['lead', 11.3], ['silver', 10.5], ['brass', 8.5], ['oak', 0.7]]);
      if (t === 0) {
        const a = r.int(2, 15), b = r.int(2, 12), c = r.int(2, 10); const V = a * b * c; const m = d * V / 1000;
        return { html: `A solid cuboid of ${mat} measures ${B(`${a} cm by ${b} cm by ${c} cm`)}. The density of ${mat} is ${B(ds(d) + ' g/cm³')}. Work out the mass of the cuboid in kilograms.`, unit: 'kg', ...nAns(m, { unit: 'kg' }), hint: 'Volume first, then mass = density × volume.',
          steps: [`Volume = ${a} × ${b} × ${c} = ${V} cm³`, `Mass = ${ds(d)} × ${V} = ${ds(d * V)} g`, `= ${ds(d * V)} ÷ 1000 = ${B(ds(m))} kg`] };
      }
      if (t === 1) {
        const dA = r.pick([0.8, 0.9, 1.1, 1.2, 1.3]); let dB; do { dB = r.pick([0.7, 0.8, 1, 1.25, 1.4]); } while (dB === dA); const vA = 50 * r.int(2, 10), vB = 50 * r.int(2, 10);
        const mA = dA * vA, mB = dB * vB; const dm = (mA + mB) / (vA + vB);
        return { html: `${B(vA + ' cm³')} of liquid A (density ${B(ds(dA) + ' g/cm³')}) is mixed with ${B(vB + ' cm³')} of liquid B (density ${B(ds(dB) + ' g/cm³')}). Work out the density of the mixture. Give your answer to 2 decimal places.`, unit: 'g/cm³', ...nAns(dm, { dp: 2, unit: 'g/cm³' }), format: dpFmt(2), hint: 'Find the total mass and the total volume.',
          steps: [`Mass of A = ${ds(dA)} × ${vA} = ${ds(mA)} g; mass of B = ${ds(dB)} × ${vB} = ${ds(mB)} g`, `Total mass = ${ds(mA + mB)} g, total volume = ${vA + vB} cm³`, `Density = ${ds(mA + mB)} ÷ ${vA + vB} = ${fx(dm, 4)}… = ${B(r2(dm))} g/cm³`] };
      }
      if (t === 2) {
        const A = r.int(4, 20), L = r.int(5, 20); const V = A * L; const g = r.pick([['gold', 19.3], ['silver', 10.5], ['platinum', 21.4], ['lead', 11.3]]); const m = g[1] * V;
        return { html: `A ${g[0]} bar is a prism with a cross-sectional area of ${B(A + ' cm²')}. Its mass is ${B(ds(m) + ' g')}. The density of ${g[0]} is ${B(ds(g[1]) + ' g/cm³')}. Work out the length of the bar.`, unit: 'cm', ...nAns(L, { unit: 'cm' }), hint: 'Volume = mass ÷ density, then length = volume ÷ area.',
          steps: [`Volume = ${ds(m)} ÷ ${ds(g[1])} = ${V} cm³`, `Length = volume ÷ cross-sectional area = ${V} ÷ ${A}`, `= ${B(L)} cm`] };
      }
      if (t === 3) {
        const V = 50 * r.int(4, 60); const pr = r.pick([2.4, 3.5, 6.8, 8.5, 12, 15.5]); const m = d * V; const cost = m / 1000 * pr;
        return { html: `A piece of ${mat} has a volume of ${B(ds(V) + ' cm³')}. The density of ${mat} is ${B(ds(d) + ' g/cm³')}. ${mat[0].toUpperCase() + mat.slice(1)} costs ${B(money(pr) + ' per kg')}. Work out the cost of the piece. Give your answer to the nearest penny.`, ...nAns(cost, { money: true }), format: 'Type the amount in pounds, e.g. 12.34', hint: 'Find the mass in kg first.',
          steps: [`Mass = ${ds(d)} × ${ds(V)} = ${ds(m)} g = ${ds(m / 1000)} kg`, `Cost = ${ds(m / 1000)} × ${money(pr)} = ${fx(cost, 4)}…`, `= ${B(money(cost))}`] };
      }
      const V = 10 * r.int(5, 80); const [m2, d2] = r.pick([['aluminium', 2.7], ['glass', 2.5], ['oak', 0.7], ['plastic', 1.2]]); const [m1, d1] = r.pick([['steel', 7.8], ['copper', 8.9], ['lead', 11.3], ['silver', 10.5]]);
      return { html: `Two blocks each have a volume of ${B(V + ' cm³')}. One is made of ${m1} (density ${ds(d1)} g/cm³) and the other of ${m2} (density ${ds(d2)} g/cm³). How much heavier, in grams, is the ${m1} block?`, unit: 'g', ...nAns(rnd((d1 - d2) * V, 6), { unit: 'g' }), hint: 'Mass = density × volume for each block.',
        steps: [`${m1}: ${ds(d1)} × ${V} = ${ds(d1 * V)} g`, `${m2}: ${ds(d2)} × ${V} = ${ds(d2 * V)} g`, `Difference = ${ds(d1 * V)} − ${ds(d2 * V)} = ${B(ds((d1 - d2) * V))} g`] };
    }],
]);

// =========================================================================== volume & surface area
addStyles('y9-volume-surface-area', [
  ['Problems in context',
    'Decide whether the question needs a volume (filling, packing, capacity) or a surface area (painting, wrapping). Remember 1 litre = 1000 cm³ and 1 m³ = 1000 litres.',
    (r) => {
      const t = r.int(0, 4);
      if (t === 0) {
        const l = 5 * r.int(6, 20), w = 5 * r.int(4, 10), h = 5 * r.int(6, 12), dd = h - 5 * r.int(1, 3); const L = l * w * dd / 1000;
        return { html: `A fish tank is a cuboid ${B(l + ' cm')} long, ${B(w + ' cm')} wide and ${B(h + ' cm')} high. It is filled with water to a depth of ${B(dd + ' cm')}. How many litres of water are in the tank? (1 litre = 1000 cm³)`, diagram: cuboidSvg(`${l} cm`, `${w} cm`, `${h} cm`), unit: 'litres', ...nAns(L, { unit: 'litres' }), hint: 'Use the depth of water, not the height of the tank.',
          steps: [`Volume of water = ${l} × ${w} × ${dd} = ${ds(l * w * dd)} cm³`, `In litres: ${ds(l * w * dd)} ÷ 1000 = ${B(ds(L))} litres`] };
      }
      if (t === 1) {
        const l = r.int(2, 6), w = r.int(1, 4), h = r.int(1, 3); const SA = 2 * (l * w + l * h + w * h); const C = r.pick([5, 6, 8, 10, 12]); const n = Math.ceil(SA / C);
        const what = r.pick(['storage box', 'wooden chest', 'shipping crate', 'garden store']);
        return { html: `All six outside faces of a cuboid ${what} measuring ${B(`${l} m by ${w} m by ${h} m`)} are to be painted. One tin of paint covers ${B(C + ' m²')}. How many tins must be bought?`, diagram: cuboidSvg(`${l} m`, `${w} m`, `${h} m`), ...nAns(n), hint: 'Find the total surface area, then divide and round up.',
          steps: [`Surface area = 2 × (${l}×${w} + ${l}×${h} + ${w}×${h}) = 2 × ${l * w + l * h + w * h} = ${SA} m²`, `${SA} ÷ ${C} = ${ps(SA / C, 2)}${rnd(SA / C, 2) !== SA / C ? '…' : ''}`, `You cannot buy part of a tin, so ${B(n)} tins`] };
      }
      if (t === 2) {
        const s = r.pick([2, 3, 4, 5]); const L = r.int(10, 40), W = r.int(8, 30), H = r.int(6, 25); const a = Math.floor(L / s), b = Math.floor(W / s), c = Math.floor(H / s); const n = a * b * c;
        return { html: `A box is a cuboid with inside measurements ${B(`${L} cm by ${W} cm by ${H} cm`)}. Cubes of side ${B(s + ' cm')} are packed into it, all the same way up. What is the greatest number of cubes that will fit?`, ...nAns(n), hint: 'Work out how many fit along each edge (whole cubes only).',
          steps: [`Along the length: ${L} ÷ ${s} → ${a}; width: ${W} ÷ ${s} → ${b}; height: ${H} ÷ ${s} → ${c}`, `Only whole cubes fit, so round each down.`, `Number of cubes = ${a} × ${b} × ${c} = ${B(n)}`] };
      }
      if (t === 3) {
        const rr = r.pick([0.4, 0.5, 0.6, 0.75, 0.8, 1, 1.2]), h = r.pick([1, 1.2, 1.5, 2, 2.5]); const V = Math.PI * rr * rr * h; const L = V * 1000;
        return { html: `A cylindrical water tank has radius ${B(ds(rr) + ' m')} and height ${B(ds(h) + ' m')}. How many litres of water does it hold when full? (1 m³ = 1000 litres) Give your answer to the nearest litre.`, diagram: cylinderSvg(`${ds(rr)} m`, `${ds(h)} m`), unit: 'litres', ...nAns(L, { dp: 0, unit: 'litres' }), format: 'Give your answer to the nearest whole number', hint: 'V = πr²h, then × 1000.',
          steps: [`V = π × ${ds(rr)}<sup>2</sup> × ${ds(h)} = ${fx(V, 4)}… m³`, `In litres: ${fx(V, 4)}… × 1000 = ${fx(L, 2)}…`, `= ${B(ds(Math.round(L)))} litres`] };
      }
      const b = r.pick([1.5, 2, 2.5, 3, 4]), h = r.pick([0.3, 0.4, 0.5, 0.6]), l = r.pick([1, 1.2, 1.5, 2, 2.5]); const V = rnd(b * h / 2 * l, 6); const c = 5 * r.int(17, 24); const cost = V * c;
      return { html: `A concrete ramp is a triangular prism. Its cross-section is a right-angled triangle with base ${B(ds(b) + ' m')} and height ${B(ds(h) + ' m')}. The ramp is ${B(ds(l) + ' m')} wide. Concrete costs ${B(money(c) + ' per m³')}. Work out the cost of the concrete. Give your answer to the nearest penny.`, diagram: prismSvg(`${ds(b)} m`, `${ds(h)} m`, `${ds(l)} m`), ...nAns(cost, { money: true }), format: 'Type the amount in pounds, e.g. 45.60', hint: 'Volume = area of triangle × length.',
        steps: [`Area of triangle = ½ × ${ds(b)} × ${ds(h)} = ${ds(rnd(b * h / 2, 6))} m²`, `Volume = ${ds(rnd(b * h / 2, 6))} × ${ds(l)} = ${ds(V)} m³`, `Cost = ${ds(V)} × ${money(c)} = ${B(money(cost))}`] };
    }],
  ['Reverse problem',
    'Here you know the volume or surface area and need a length. Write the formula, put in what you know, then rearrange (divide) to find the missing measurement.',
    (r) => {
      const t = r.int(0, 4);
      if (t === 0) {
        const l = r.int(4, 20), w = r.int(3, 12), h = r.int(2, 15); const V = l * w * h; const what = r.pick(['A cuboid', 'A shoebox', 'A cuboid planter', 'A block of cheese']);
        return { html: `${what} has a volume of ${B(V + ' cm³')}. Its length is ${B(l + ' cm')} and its width is ${B(w + ' cm')}. Work out its height.`, unit: 'cm', ...nAns(h, { unit: 'cm' }), hint: 'Height = volume ÷ (length × width).',
          steps: [`${l} × ${w} × <i>h</i> = ${V}`, `${l * w}<i>h</i> = ${V}`, `<i>h</i> = ${V} ÷ ${l * w} = ${B(h)} cm`] };
      }
      if (t === 1) {
        const s = r.int(2, 15); const SA = 6 * s * s; const what = r.pick(['A cube', 'A dice', 'A cube-shaped box', 'A sugar cube model']);
        return { html: `${what} has a total surface area of ${B(SA + ' cm²')}. Work out its volume.`, unit: 'cm³', ...nAns(s ** 3, { unit: 'cm³' }), hint: 'A cube has 6 equal square faces.',
          steps: [`Area of one face = ${SA} ÷ 6 = ${s * s} cm²`, `Side length = ${sq(s * s)} = ${s} cm`, `Volume = ${s}<sup>3</sup> = ${B(s ** 3)} cm³`] };
      }
      if (t === 2) {
        let V, rr, h; do { V = 50 * r.int(4, 40); rr = r.int(2, 10); h = V / (Math.PI * rr * rr); } while (h < 2 || h > 40);
        const what = r.pick(['A tin of soup', 'A cylindrical vase', 'A candle', 'A drinks can']);
        return { html: `${what} is a cylinder with volume ${B(V + ' cm³')} and radius ${B(rr + ' cm')}. Work out its height. Give your answer to 1 decimal place.`, unit: 'cm', ...nAns(h, { dp: 1, unit: 'cm' }), format: dpFmt(1), hint: 'h = V ÷ (πr²).',
          steps: [`π × ${rr}<sup>2</sup> × <i>h</i> = ${V}`, `π × ${rr}<sup>2</sup> = ${fx(Math.PI * rr * rr, 4)}…`, `<i>h</i> = ${V} ÷ ${fx(Math.PI * rr * rr, 4)}… = ${fx(h, 4)}… = ${B(r1(h))} cm`] };
      }
      if (t === 3) {
        const l1 = r.int(10, 30), w1 = r.int(8, 20), d1 = r.int(5, 20); let l2, w2; do { l2 = r.int(15, 50); w2 = r.int(10, 40); } while (l2 * w2 <= l1 * w1);
        const V = l1 * w1 * d1; const d2 = V / (l2 * w2);
        return { html: `Container A is a cuboid with base ${B(`${l1} cm by ${w1} cm`)}. It contains water to a depth of ${B(d1 + ' cm')}. All the water is poured into container B, a cuboid with base ${B(`${l2} cm by ${w2} cm`)}. Work out the depth of water in container B. Give your answer to 1 decimal place.`, unit: 'cm', ...nAns(d2, { dp: 1, unit: 'cm' }), format: dpFmt(1), hint: 'The volume of water stays the same.',
          steps: [`Volume of water = ${l1} × ${w1} × ${d1} = ${V} cm³`, `Base area of B = ${l2} × ${w2} = ${l2 * w2} cm²`, `Depth = ${V} ÷ ${l2 * w2} = ${fx(d2, 4)}… = ${B(r1(d2))} cm`] };
      }
      const b = r.int(3, 12), h = 2 * r.int(2, 6), L = r.int(5, 25); const A = b * h / 2; const V = A * L; const what = r.pick(['A wooden doorstop', 'A tent', 'A chocolate bar box', 'A garden wedge']);
      return { html: `${what} is a triangular prism. The triangular cross-section has base ${B(b + ' cm')} and perpendicular height ${B(h + ' cm')}. The volume is ${B(V + ' cm³')}. Work out the length of the prism.`, diagram: prismSvg(`${b} cm`, `${h} cm`, '?'), unit: 'cm', ...nAns(L, { unit: 'cm' }), hint: 'Volume = area of cross-section × length.',
        steps: [`Area of triangle = ½ × ${b} × ${h} = ${A} cm²`, `${A} × length = ${V}`, `Length = ${V} ÷ ${A} = ${B(L)} cm`] };
    }],
]);

// =========================================================================== relative frequency
addStyles('y9-relative-frequency', [
  ['Problems in context',
    'Probabilities of all outcomes add up to 1. Expected number = probability × number of trials. A relative frequency from an experiment can be used as an estimate of the probability.',
    (r) => {
      const t = r.int(0, 4);
      if (t === 0) {
        let p; do { p = [r.int(1, 7), r.int(1, 7), r.int(1, 7)].map((v) => v * 5); } while (sum(p) > 90);
        const miss = 100 - sum(p); const N = 20 * r.int(3, 25); const cols = r.shuffle(['red', 'blue', 'green', 'yellow']); const mi = r.int(0, 3);
        const row = []; let j = 0; for (let i = 0; i < 4; i++) row.push(i === mi ? '<i>x</i>' : fx(p[j++] / 100, 2));
        return { html: `A biased spinner can land on red, blue, green or yellow.${table([['Colour', ...cols], ['Probability', ...row]])}The spinner is spun ${B(N)} times. How many times would you expect it to land on ${B(cols[mi])}?`, ...nAns(miss * N / 100), hint: 'Find the missing probability first: they add up to 1.',
          steps: [`<i>x</i> = 1 − (${p.map((v) => fx(v / 100, 2)).join(' + ')}) = ${fx(miss / 100, 2)}`, `Expected = ${fx(miss / 100, 2)} × ${N}`, `= ${B(miss * N / 100)}`] };
      }
      if (t === 1) {
        const N = r.pick([50, 100, 200, 250]); const k = r.int(1, Math.floor(N / 10)); const step = N / gcd(N, k); let M; do { M = step * r.int(1, 200); } while (M < 1000 || M > 50000);
        const notF = r.chance(); const est = M * k / N; const item = r.pick(['light bulbs', 'phone chargers', 'mugs', 'USB cables']);
        return { html: `A factory tests a sample of ${B(N)} ${item} and finds that ${B(k)} are faulty. The factory makes ${B(ds(M))} ${item} in a week. Estimate how many of these are ${notF ? B('not faulty') : B('faulty')}.`, ...nAns(notF ? M - est : est), hint: 'Use the relative frequency from the sample.',
          steps: [`Relative frequency of faulty = ${frac(k, N)}`, `Estimated faulty = ${frac(k, N)} × ${ds(M)} = ${ds(est)}`, ...(notF ? [`Not faulty = ${ds(M)} − ${ds(est)} = ${B(ds(M - est))}`] : [`Estimate: ${B(ds(est))}`])] };
      }
      if (t === 2) {
        const N = 6 * r.int(10, 50); const E = N / 6; const k = E + r.int(3, 15); const face = r.pick(['six', 'five', 'one', 'four']); const nm = r.pick(['Rosa', 'Jamal', 'Ffion', 'Lewis']);
        return { html: `${nm} rolls an ordinary dice ${B(N)} times and gets a ${face} ${B(k)} times. How many more ${face}s did ${nm} get than would be expected from a fair dice?`, ...nAns(k - E), hint: 'For a fair dice, P(any number) = 1/6.',
          steps: [`Expected number = ${frac(1, 6)} × ${N} = ${E}`, `Difference = ${k} − ${E} = ${B(k - E)}`] };
      }
      if (t === 3) {
        let N1, N2, k1, k2, M, tot; do { N1 = r.pick([20, 30, 40, 50]); N2 = r.pick([20, 30, 40, 50, 60]); k1 = r.int(3, N1 - 3); k2 = r.int(3, N2 - 3); tot = N1 + N2; M = (tot / gcd(tot, k1 + k2)) * r.int(1, 10); } while (M < 100 || M > 2000);
        const [a, b] = r.pick([['Kim', 'Leo'], ['Ava', 'Sam'], ['Ruby', 'Zac'], ['Iman', 'Tia']]); const ev = r.pick(['lands on its side', 'lands point up', 'lands heads up', 'lands on red']);
        return { html: `${a} drops a bottle top ${B(N1)} times and it ${ev} ${B(k1)} times. ${b} drops it ${B(N2)} times and it ${ev} ${B(k2)} times. Using all their results, estimate how many times it ${ev} if it is dropped ${B(M)} times.`.replace(/a bottle top/, ev === 'lands heads up' ? 'a coin' : ev === 'lands on red' ? 'a counter' : 'a bottle top'), ...nAns(M * (k1 + k2) / tot), hint: 'Combine the results: total successes ÷ total trials.',
          steps: [`Total trials = ${N1} + ${N2} = ${tot}; total successes = ${k1} + ${k2} = ${k1 + k2}`, `Relative frequency = ${frac(k1 + k2, tot)}`, `Estimate = ${frac(k1 + k2, tot)} × ${M} = ${B(M * (k1 + k2) / tot)}`] };
      }
      let c, P, p, N; do { c = r.pick([50, 100, 200]); P = r.pick([200, 300, 500, 1000]); p = r.pick([5, 10, 15, 20]); N = 100 * r.int(1, 5); } while (p * P >= 100 * c * 0.9);
      const profit = (N * c - N * p / 100 * P) / 100; const game = r.pick(['hook-a-duck', 'tombola', 'coconut shy', 'ring toss']);
      return { html: `At a school fair, the ${game} costs ${B(c >= 100 ? money(c / 100) : c + 'p')} a go. The probability of winning is ${B(fx(p / 100, 2))} and each winner gets a prize worth ${B(money(P / 100))}. The game is played ${B(N)} times. Work out the expected profit for the stall.`, ...nAns(profit, { money: true }), format: 'Type the amount in pounds, e.g. 25.00', hint: 'Money taken − expected cost of prizes.',
        steps: [`Money taken = ${N} × ${money(c / 100)} = ${money(N * c / 100)}`, `Expected winners = ${fx(p / 100, 2)} × ${N} = ${N * p / 100}, costing ${N * p / 100} × ${money(P / 100)} = ${money(N * p / 100 * P / 100)}`, `Expected profit = ${money(N * c / 100)} − ${money(N * p / 100 * P / 100)} = ${B(money(profit))}`] };
    }],
]);

// =========================================================================== listing outcomes
addStyles('y9-listing-outcomes', [
  ['Problems in context',
    'Use the product rule: multiply the number of options at each stage. Watch for restrictions (no repeats, first digit not zero) and reduce the options at that stage. A sample-space grid helps for two spinners or dice.',
    (r) => {
      const t = r.int(0, 4);
      if (t === 0) {
        const s = r.int(3, 8), tr = r.int(2, 6), h = r.int(2, 5), k = r.int(1, 3); const nm = r.pick(['Maya', 'Josh', 'Elif', 'Callum']);
        const [a, b, c] = r.pick([['shirts', 'pairs of trousers', 'pairs of shoes'], ['T-shirts', 'pairs of shorts', 'caps'], ['tops', 'skirts', 'scarves']]);
        return { html: `${nm} has ${B(s)} ${a}, ${B(tr)} ${b} and ${B(h)} ${c}. An outfit is one of each. ${nm} buys ${B(k)} more ${a}. How many ${B('more')} different outfits are now possible?`, ...nAns(k * tr * h), hint: 'Work out the number of outfits before and after.',
          steps: [`Before: ${s} × ${tr} × ${h} = ${s * tr * h}`, `After: ${s + k} × ${tr} × ${h} = ${(s + k) * tr * h}`, `Extra outfits = ${(s + k) * tr * h} − ${s * tr * h} = ${B(k * tr * h)}`] };
      }
      if (t === 1) {
        const v = r.int(0, 2);
        if (v === 0) { const n = r.int(3, 5); const ev = r.chance(); const tot = 9 * 10 ** (n - 2) * 5; const f = [9, ...Array(n - 2).fill(10), 5];
          return { html: `A ${n}-digit PIN uses the digits 0 to 9. The first digit cannot be 0 and the last digit must be ${ev ? 'even' : 'odd'}. Digits can be repeated. How many different PINs are possible?`, ...nAns(tot), hint: 'Count the choices for each position.', steps: [`First digit: 9 choices (1–9); middle digits: 10 each; last digit: 5 ${ev ? 'even' : 'odd'} choices`, `${f.join(' × ')} = ${B(ds(tot))}`] }; }
        if (v === 1) { const n = r.int(3, 5); let tot = 1; const f = []; for (let i = 0; i < n; i++) { tot *= 10 - i; f.push(10 - i); }
          return { html: `A ${n}-digit code uses the digits 0 to 9 and ${B('no digit can be used more than once')}. How many different codes are possible?`, ...nAns(tot), hint: 'One fewer choice for each new digit.', steps: [`Choices: ${f.join(', ')}`, `${f.join(' × ')} = ${B(ds(tot))}`] }; }
        const L = r.int(1, 2), D = r.int(2, 3); const tot = 26 ** L * 10 ** D; const f = [...Array(L).fill(26), ...Array(D).fill(10)];
        return { html: `A locker code is ${L === 1 ? 'one letter' : 'two letters'} (A–Z) followed by ${D} digits (0–9). Letters and digits can be repeated. How many different codes are possible?`, ...nAns(tot), hint: '26 choices for each letter, 10 for each digit.', steps: [`Letters: 26 each; digits: 10 each`, `${f.join(' × ')} = ${B(ds(tot))}`] };
      }
      if (t === 2) {
        const a = r.int(3, 7), b = r.int(3, 8), c = r.int(2, 6); const T = a * b * c;
        const place = r.pick(['A restaurant', 'A school canteen', 'A wedding menu', 'A café']);
        return { html: `${place} offers ${B(a)} starters, ${B(b)} main courses and some desserts. A meal is one starter, one main and one dessert. There are ${B(T)} different meals possible. How many desserts are there?`, ...nAns(c), hint: 'Starters × mains × desserts = total.',
          steps: [`${a} × ${b} × <i>d</i> = ${T}`, `${a * b}<i>d</i> = ${T}`, `<i>d</i> = ${T} ÷ ${a * b} = ${B(c)}`] };
      }
      if (t === 3) {
        const p = r.int(3, 6), q = r.int(3, 6); const k = r.int(4, p + q - 1); let cnt = 0; for (let i = 1; i <= p; i++) for (let j = 1; j <= q; j++) if (i + j > k) cnt++;
        return { html: `Spinner A is numbered 1 to ${p}. Spinner B is numbered 1 to ${q}. Each spinner is fair. Both are spun and the scores are added. Work out the probability that the total is ${B('greater than ' + k)}.`, ...fAns(cnt, p * q), hint: 'Draw a sample-space grid.',
          steps: [`There are ${p} × ${q} = ${p * q} equally likely outcomes.`, `Count the totals greater than ${k}: ${cnt} outcomes`, `P = ${frac(cnt, p * q)}${gcd(cnt, p * q) > 1 ? ` = ${B(fracS(cnt, p * q))}` : ''}`] };
      }
      const n = r.int(5, 16); const pair = r.chance(); const team = r.pick(['football team', 'netball squad', 'quiz team', 'chess club']);
      if (pair) return { html: `There are ${B(n)} people in a ${team}. Every person shakes hands once with every other person. How many handshakes are there?`, ...nAns(n * (n - 1) / 2), hint: 'Each handshake involves two people — do not count it twice.',
        steps: [`Each person shakes ${n - 1} hands: ${n} × ${n - 1} = ${n * (n - 1)}`, `Each handshake has been counted twice, so ÷ 2`, `${n * (n - 1)} ÷ 2 = ${B(n * (n - 1) / 2)}`] };
      return { html: `A ${team} has ${B(n)} members. A captain and a different vice-captain are chosen. How many different ways can this be done?`, ...nAns(n * (n - 1)), hint: 'Choose the captain first, then the vice-captain.',
        steps: [`Captain: ${n} choices; vice-captain: ${n - 1} choices`, `${n} × ${n - 1} = ${B(n * (n - 1))}`] };
    }],
]);

// =========================================================================== frequency tables
addStyles('y9-frequency-tables', [
  ['Problems in context',
    'In a frequency table, Σf is the number of people and Σfx is the total of all the values. Mean = Σfx ÷ Σf. If the mean is given, set up an equation to find a missing frequency.',
    (r) => {
      const t = r.int(0, 4); const ctx = r.pick([['Number of pets', 'households'], ['Number of siblings', 'students'], ['Goals scored', 'matches'], ['Number of cars', 'families'], ['Books borrowed', 'library visitors']]);
      if (t === 0) {
        const xs = [0, 1, 2, 3, 4, 5]; const fs = xs.map(() => r.int(1, 15)); const FX = sum(xs.map((x, i) => x * fs[i]));
        return { html: `The table shows information about some ${ctx[1]}.${htable([ctx[0], ...xs], [['Frequency', ...fs]])}Work out the total ${ctx[0].toLowerCase()} for all of these ${ctx[1]} together.`, ...nAns(FX), hint: 'Multiply each value by its frequency, then add.',
          steps: [`fx: ${xs.map((x, i) => `${x}×${fs[i]} = ${x * fs[i]}`).join(', ')}`, `Total = ${B(FX)}`] };
      }
      if (t === 1) {
        const xs = [0, 1, 2, 3, 4]; let fs, j, F, S, M; do { fs = xs.map(() => r.int(1, 12)); j = r.int(1, 4); F = sum(fs); S = sum(xs.map((x, i) => x * fs[i])); M = S / F; } while (Math.round(M * 10) !== rnd(M * 10, 6) || xs[j] === M);
        const k = fs[j]; const F0 = F - k, S0 = S - xs[j] * k; const row = fs.map((f, i) => (i === j ? '<i>k</i>' : f));
        return { html: `The table shows information about some ${ctx[1]}.${htable([ctx[0], ...xs], [['Frequency', ...row]])}The mean is ${B(ds(M))}. Work out the value of <i>k</i>.`, answerLabel: 'k =', ...nAns(k), hint: 'Write Σfx ÷ Σf = mean, with k in both totals.',
          steps: [`Σf = ${F0} + <i>k</i>, Σfx = ${S0} + ${xs[j]}<i>k</i>`, `${S0} + ${xs[j]}<i>k</i> = ${ds(M)}(${F0} + <i>k</i>) = ${ds(rnd(M * F0, 6))} + ${ds(M)}<i>k</i>`, `${ds(rnd(xs[j] - M, 6))}<i>k</i> = ${ds(rnd(M * F0 - S0, 6))}`.replace(/^−(.*)= −/, '$1= '), `<i>k</i> = ${B(k)}`] };
      }
      if (t === 2) {
        const xs = [1, 2, 3, 4, 5]; let fs, n, med, mode; do { fs = xs.map(() => r.int(1, 12)); n = sum(fs); const mx = Math.max(...fs); mode = fs.filter((f) => f === mx).length === 1 ? xs[fs.indexOf(mx)] : null; let c = 0; med = null; for (let i = 0; i < 5; i++) { c += fs[i]; if (med === null && c >= (n + 1) / 2) med = xs[i]; } } while (n % 2 === 0 || mode === null || med === mode);
        const cum = []; let c = 0; for (const f of fs) { c += f; cum.push(c); }
        return { html: `The table shows information about some ${ctx[1]}.${htable([ctx[0], ...xs], [['Frequency', ...fs]])}Work out the difference between the median and the mode.`, ...nAns(Math.abs(med - mode)), hint: 'The mode has the highest frequency; the median is the middle value.',
          steps: [`Mode = ${mode} (highest frequency, ${Math.max(...fs)})`, `n = ${n}, so the median is the ${ord((n + 1) / 2)} value. Running totals: ${cum.join(', ')}, so median = ${med}`, `Difference = ${B(Math.abs(med - mode))}`] };
      }
      if (t === 3) {
        const xs = [1, 2, 3, 4, 5, 6]; const fs = xs.map(() => r.int(2, 20)); const FX = sum(xs.map((x, i) => x * fs[i])); const p = r.pick([3.5, 4, 4.5, 5, 6.5, 7.5, 8, 12]);
        const ev = r.pick(['cinema tickets', 'bus tickets', 'raffle tickets', 'museum tickets']);
        return { html: `The table shows how many ${ev} each customer bought one morning.${htable(['Tickets bought', ...xs], [['Customers', ...fs]])}Each ticket costs ${B(money(p))}. How much money was taken altogether?`, ...nAns(FX * p, { money: true }), format: 'Type the amount in pounds, e.g. 345.50', hint: 'Find the total number of tickets first.',
          steps: [`Tickets = ${xs.map((x, i) => `${x}×${fs[i]}`).join(' + ')} = ${FX}`, `Money = ${FX} × ${money(p)} = ${B(money(FX * p))}`] };
      }
      const F = r.pick([20, 25, 40, 50]); const xs = [0, 1, 2, 3, 4]; let fs; do { fs = xs.slice(0, 4).map(() => r.int(1, Math.floor(F / 3))); fs.push(F - sum(fs)); } while (fs[4] < 1);
      const k = r.int(2, 3); const cnt = sum(fs.slice(k)); const pc = cnt / F * 100;
      return { html: `The table shows information about ${F} ${ctx[1]}.${htable([ctx[0], ...xs], [['Frequency', ...fs]])}What percentage of the ${ctx[1]} had ${B('at least ' + k)}?`, unit: '%', ...nAns(pc, { unit: '%' }), hint: '“At least” includes the value itself.',
        steps: [`At least ${k}: ${fs.slice(k).join(' + ')} = ${cnt}`, `Percentage = ${cnt} ÷ ${F} × 100 = ${B(ds(pc) + '%')}`] };
    }],
]);

}

// ---- fragment exam10.js ----
{
// ===== exam10: exam-style / problem-solving styles for every Year 10 topic =====
const e10Pick = (r, arr) => arr[r.int(0, arr.length - 1)];
const e10Names = ['Aisha', 'Ben', 'Chloe', 'Dev', 'Ella', 'Finn', 'Grace', 'Harry', 'Isla', 'Jamal', 'Kate', 'Leo', 'Maya', 'Noah', 'Priya', 'Sam', 'Tom', 'Zara'];

// ---------------------------------------------------------------- compound interest
addStyles('y10-compound-interest', [
  ['Problems in context',
    'Real-life percentage change problems: savings accounts, cars losing value, growing populations. Write each change as a multiplier, use a power for repeated changes, and read carefully to see whether the question wants the final amount or the change.',
    (r) => {
      const nm = e10Pick(r, e10Names); const t = r.int(0, 4);
      if (t === 0) { // compound vs simple
        const P = 500 * r.int(2, 20), r1 = r.pick([2, 2.5, 3, 3.5, 4]), r2 = r1 + r.pick([0.5, 1]), n = r.int(3, 6);
        const A = P * (1 + r1 / 100) ** n, I1 = A - P, I2 = P * r2 / 100 * n; const d = Math.abs(I1 - I2); const better = I1 > I2 ? 'Account A' : 'Account B';
        return { html: `${nm} has ${B(money(P))} to save for ${B(n + ' years')}.<br>Account A pays ${B(ps(r1) + '%')} per year <b>compound</b> interest.<br>Account B pays ${B(ps(r2) + '%')} per year <b>simple</b> interest.<br>How much more interest would ${nm} earn with the better account? Give your answer to the nearest penny.`, ...nAns(d, { money: true }), format: 'Give your answer in pounds, e.g. 12.34', hint: 'Work out the interest from each account separately, then subtract.',
          steps: [`Account A: ${money(P)} × ${ps(1 + r1 / 100)}<sup>${n}</sup> = ${money(A)}, so interest = ${money(I1)}`, `Account B: ${ps(r2)}% of ${money(P)} = ${money(P * r2 / 100)} per year, × ${n} = ${money(I2)}`, `${better} pays more. Difference = ${B(money(d))}`] };
      }
      if (t === 1) { // two-rate depreciation
        const P = 1000 * r.int(8, 35), d1 = r.pick([15, 20, 25]), d2 = r.pick([8, 10, 12]), n = r.int(3, 6); const v1 = P * (1 - d1 / 100); const V = v1 * (1 - d2 / 100) ** (n - 1);
        return { html: `${nm} buys a new car for ${B(money(P))}. The car loses ${B(d1 + '%')} of its value in the first year, then ${B(d2 + '%')} of its value in each year after that. Work out the value of the car after ${B(n + ' years')}. Give your answer to the nearest penny.`, ...nAns(V, { money: true }), format: 'Give your answer in pounds, e.g. 1234.56', hint: 'Use one multiplier for the first year and a different multiplier for the other years.',
          steps: [`After 1 year: ${money(P)} × ${ps(1 - d1 / 100)} = ${money(v1)}`, `The next ${n - 1} years use the multiplier ${ps(1 - d2 / 100)}: ${money(v1)} × ${ps(1 - d2 / 100)}<sup>${n - 1}</sup>`, `= ${fx(V, 4)}… = ${B(money(V))}`] };
      }
      if (t === 2) { // population
        const P = 100 * r.int(40, 400), g = r.pick([1.5, 2, 2.5, 3, 4, 5]), n = r.int(3, 10); const V = P * (1 + g / 100) ** n;
        const place = r.pick(['town', 'village', 'city suburb', 'island']);
        return { html: `The population of a ${place} is ${B(ds(P))}. It is predicted to increase by ${B(ps(g) + '%')} each year. Work out the predicted population after ${B(n + ' years')}. Give your answer to the nearest whole number.`, ...nAns(V, { dp: 0 }), format: 'Type a whole number', hint: `Multiplier = ${ps(1 + g / 100)}.`,
          steps: [`Multiplier = 100% + ${ps(g)}% = ${ps(1 + g / 100)}`, `${ds(P)} × ${ps(1 + g / 100)}<sup>${n}</sup> = ${fx(V, 3)}…`, `Population ≈ ${B(ds(Math.round(V)))}`] };
      }
      if (t === 3) { // up then down
        const P = 5000 * r.int(30, 90), u = r.pick([4, 5, 6, 8, 10]), dn = r.pick([2, 3, 4, 5]); const V1 = P * (1 + u / 100), V = V1 * (1 - dn / 100); const ch = V - P;
        return { html: `A house was worth ${B(money(P))}. In the first year its value rose by ${B(u + '%')}. In the second year its value fell by ${B(dn + '%')}. By how much has the value of the house changed over the two years? Give your answer in pounds.`, ...nAns(Math.abs(ch), { money: true }), format: 'Give the size of the change in pounds', hint: 'Find the final value, then compare it with the start value.',
          steps: [`After year 1: ${money(P)} × ${ps(1 + u / 100)} = ${money(V1)}`, `After year 2: ${money(V1)} × ${ps(1 - dn / 100)} = ${money(V)}`, `Change = ${money(V)} − ${money(P)}: the value has ${ch >= 0 ? 'risen' : 'fallen'} by ${B(money(Math.abs(ch)))}`] };
      }
      // phone value then sell
      const P = 50 * r.int(12, 30), d = r.pick([20, 25, 30, 35, 40]), n = r.int(2, 4); const V = P * (1 - d / 100) ** n; const loss = P - V;
      return { html: `${nm} buys a phone for ${B(money(P))}. Its value falls by ${B(d + '%')} each year. ${nm} sells it after ${B(n + ' years')} for its value at that time. How much value has the phone lost? Give your answer to the nearest penny.`, ...nAns(loss, { money: true }), format: 'Give your answer in pounds, e.g. 123.45', hint: 'Value lost = price paid − value after depreciation.',
        steps: [`Multiplier = 100% − ${d}% = ${ps(1 - d / 100)}`, `Value after ${n} years = ${money(P)} × ${ps(1 - d / 100)}<sup>${n}</sup> = ${money(V)}`, `Value lost = ${money(P)} − ${money(V)} = ${B(money(loss))}`] };
    }],
  ['Reverse problem: how many years?',
    'To find how many years it takes to reach a target, keep multiplying by the multiplier (or try values of n in P × mⁿ) until you first pass the target. Check the year before as well.',
    (r) => {
      const t = r.int(0, 3); const nm = e10Pick(r, e10Names);
      let P, m, pct, up, ctx;
      if (t === 0) { P = 1000 * r.int(2, 15); pct = r.pick([2, 3, 4, 5, 6]); up = true; ctx = 'sav'; }
      else if (t === 1) { P = 1000 * r.int(10, 40); pct = r.pick([10, 12, 15, 18, 20]); up = false; ctx = 'car'; }
      else if (t === 2) { P = 1000 * r.int(5, 60); pct = r.pick([3, 4, 5, 6, 8]); up = true; ctx = 'pop'; }
      else { P = 100 * r.int(20, 90); pct = r.pick([5, 8, 10, 12]); up = false; ctx = 'pool'; }
      m = up ? 1 + pct / 100 : 1 - pct / 100;
      const nT = r.int(3, 9); const lo = P * m ** (nT - 1), hi = P * m ** nT; const step = ctx === 'pool' ? 10 : 100;
      let target = Math.round(((lo + hi) / 2) / step) * step;
      let n = 0, v = P; while (up ? v <= target : v >= target) { v *= m; n++; if (n > 60) break; }
      const prev = P * m ** (n - 1);
      const unitF = (x) => (ctx === 'pop' ? ds(Math.round(x)) : ctx === 'pool' ? ds(Math.round(x)) + ' litres' : money(x));
      const html = ctx === 'sav' ? `${nm} invests ${B(money(P))} in an account paying ${B(pct + '%')} per year compound interest. After how many whole years will the investment first be worth more than ${B(money(target))}?`
        : ctx === 'car' ? `A van is bought for ${B(money(P))}. It depreciates by ${B(pct + '%')} each year. After how many whole years will the van first be worth less than ${B(money(target))}?`
          : ctx === 'pop' ? `A colony of birds has ${B(ds(P))} birds. The number grows by ${B(pct + '%')} each year. After how many whole years will there first be more than ${B(ds(target))} birds?`
            : `A pond holds ${B(ds(P) + ' litres')} of water. In a heatwave it loses ${B(pct + '%')} of its water each day. After how many whole days will it first hold less than ${B(ds(target) + ' litres')}?`;
      const per = ctx === 'pool' ? 'days' : 'years';
      return { html, ...nAns(n), unit: per, format: 'Type a whole number', hint: `Use the multiplier ${ps(m)} and try different powers.`,
        steps: [`Multiplier = ${ps(m)}, so after n ${per} the amount is ${ctx === 'pop' ? ds(P) : ctx === 'pool' ? ds(P) : money(P)} × ${ps(m)}<sup>n</sup>`, `n = ${n - 1}: ${unitF(prev)} — ${up ? 'not yet more than' : 'not yet less than'} the target`, `n = ${n}: ${unitF(v)} — ${up ? 'more than' : 'less than'} ${ctx === 'pop' ? ds(target) : ctx === 'pool' ? ds(target) + ' litres' : money(target)}`, `Answer: ${B(n)} ${per}`] };
    }],
]);

// ---------------------------------------------------------------- reverse percentages
addStyles('y10-reverse-percentages', [
  ['Problems in context',
    'Many exam questions hide a reverse percentage inside a longer problem. First find the original (100%) amount by dividing by the multiplier, then use it to answer the actual question — for example the profit, the saving or the VAT.',
    (r) => {
      const t = r.int(0, 4); const nm = e10Pick(r, e10Names);
      if (t === 0) { const C = 4 * r.int(5, 60), p = r.pick([20, 25, 30, 40, 50, 60]); const S = C * (1 + p / 100); const item = r.pick(['bike', 'lamp', 'guitar', 'rug', 'coat']);
        return { html: `A shop sells a ${item} for ${B(money(S))}. This price gives the shop a profit of ${B(p + '%')} on what it paid for the ${item}. How much profit does the shop make on each ${item}?`, ...nAns(S - C, { money: true }), format: 'Give your answer in pounds', hint: `${money(S)} is ${100 + p}% of the cost price.`,
          steps: [`Selling price = ${100 + p}% of the cost price`, `Cost price = ${money(S)} ÷ ${ps(1 + p / 100)} = ${money(C)}`, `Profit = ${money(S)} − ${money(C)} = ${B(money(S - C))}`] }; }
      if (t === 1) { const O = 5 * r.int(6, 100), p = r.pick([10, 15, 20, 25, 30, 35, 40]); const N = O * (1 - p / 100); const item = r.pick(['pair of trainers', 'sofa', 'tablet', 'jacket', 'tent']);
        return { html: `In a sale, ${nm} buys a ${item} for ${B(money(N))}. The sale price is ${B(p + '%')} less than the normal price. How much money did ${nm} save?`, ...nAns(O - N, { money: true }), format: 'Give your answer in pounds', hint: `${money(N)} is ${100 - p}% of the normal price.`,
          steps: [`Sale price = ${100 - p}% of the normal price`, `Normal price = ${money(N)} ÷ ${ps(1 - p / 100)} = ${money(O)}`, `Saving = ${money(O)} − ${money(N)} = ${B(money(O - N))}`] }; }
      if (t === 2) { const E = 5 * r.int(4, 160); const I = E * 1.2; const what = r.pick(['electricity bill', 'builder’s invoice', 'garage bill', 'catering bill']);
        return { html: `A ${what} comes to ${B(money(I))}, including VAT at 20%. How much of the bill is VAT?`, ...nAns(I - E, { money: true }), format: 'Give your answer in pounds', hint: 'The bill is 120% of the price before VAT.',
          steps: [`Price before VAT = ${money(I)} ÷ 1.2 = ${money(E)}`, `VAT = ${money(I)} − ${money(E)} = ${B(money(I - E))}`] }; }
      if (t === 3) { const p = r.pick([4, 5, 8, 10, 12, 15, 20, 25]); const O = r.int(4, 60) * (100 / gcd(100, p)) * r.pick([1, 2, 5]); const N = O * (1 + p / 100); const club = r.pick(['gym', 'swimming club', 'chess club', 'running club']);
        return { html: `The number of members of a ${club} increased by ${B(p + '%')} this year. There are now ${B(ds(N))} members. How many new members joined this year?`, ...nAns(N - O), format: 'Type a whole number', hint: `${ds(N)} is ${100 + p}% of last year’s membership.`,
          steps: [`${ds(N)} = ${100 + p}% of last year’s number`, `Last year = ${ds(N)} ÷ ${ps(1 + p / 100)} = ${ds(O)}`, `New members = ${ds(N)} − ${ds(O)} = ${B(ds(N - O))}`] }; }
      const O = 100 * r.int(2, 30), p = r.pick([10, 20, 25, 30]), q = r.pick([10, 15, 20, 25]); const M = O * (1 + p / 100); const N = M * (1 - q / 100);
      return { html: `A shop increased the price of a games console by ${B(p + '%')}. Later, in a sale, the new price was reduced by ${B(q + '%')}. The sale price is ${B(money(N))}. What was the price before both changes?`, ...nAns(O, { money: true }), format: 'Give your answer in pounds', hint: 'Undo each change in reverse order by dividing by its multiplier.',
        steps: [`Overall multiplier = ${ps(1 + p / 100)} × ${ps(1 - q / 100)} = ${ps((1 + p / 100) * (1 - q / 100))}`, `Original price = ${money(N)} ÷ ${ps((1 + p / 100) * (1 - q / 100))}`, `= ${B(money(O))}`] };
    }],
]);

// ---------------------------------------------------------------- factorising quadratics
addStyles('y10-factorising-quadratics', [
  ['Problems in context',
    'Factorising can reveal the lengths of a rectangle from its area, or make a calculation easy. Factorise first, then use the factors to answer the question.',
    (r) => {
      const t = r.int(0, 3);
      if (t <= 1) {
        let p, q; do { p = r.int(1, 9); q = r.int(1, 9); } while (p === q); if (p < q) [p, q] = [q, p];
        const k = r.int(3, 15); const obj = r.pick([['garden', 'm'], ['poster', 'cm'], ['rug', 'm'], ['patio', 'm'], ['tablecloth', 'cm']]);
        const W = k + q, P = 2 * (2 * k + p + q);
        const area = tx(quad(1, p + q, p * q));
        if (t === 0) return { html: `A rectangular ${obj[0]} has area ${B(area)} ${obj[1]}². Its length is ${B(tx(lin(1, p)))} ${obj[1]}. Find the width of the ${obj[0]} when <i>x</i> = ${k}.`, ...nAns(W), unit: obj[1], hint: 'Factorise the area: one bracket is the length, the other is the width.',
          steps: [`Factorise: ${area} = ${tx(`(${lin(1, p)})(${lin(1, q)})`)}`, `The length is ${tx(lin(1, p))}, so the width is ${tx(lin(1, q))}`, `When <i>x</i> = ${k}: width = ${k} + ${q} = ${B(W)} ${obj[1]}`] };
        return { html: `A rectangular ${obj[0]} has area ${B(area)} ${obj[1]}². Its length is ${B(tx(lin(1, p)))} ${obj[1]}. Work out the perimeter of the ${obj[0]} when <i>x</i> = ${k}.`, ...nAns(P), unit: obj[1], hint: 'Factorise to find the width, then add up all four sides.',
          steps: [`Factorise: ${area} = ${tx(`(${lin(1, p)})(${lin(1, q)})`)}, so the width is ${tx(lin(1, q))}`, `Perimeter = 2(${tx(lin(1, p))} + ${tx(lin(1, q))}) = ${tx(lin(4, 2 * (p + q)))}`, `When <i>x</i> = ${k}: 4 × ${k} + ${2 * (p + q)} = ${B(P)} ${obj[1]}`] };
      }
      if (t === 2) { const a = r.int(51, 99), b = r.int(1, 49); if ((a + b) % 10 && (a - b) % 10) { /* still fine */ }
        return { html: `Without a calculator, use the difference of two squares to work out ${B(`${a}<sup>2</sup> − ${b}<sup>2</sup>`)}.`, ...nAns(a * a - b * b), hint: 'a² − b² = (a + b)(a − b).',
          steps: [`${a}<sup>2</sup> − ${b}<sup>2</sup> = (${a} + ${b})(${a} − ${b})`, `= ${a + b} × ${a - b}`, `= ${B(ds(a * a - b * b))}`] }; }
      const a = r.int(2, 9), k = a + r.int(2, 30); const sheet = r.pick(['card', 'metal sheet', 'wooden board', 'tile']);
      return { html: `A square ${sheet} has side ${B('<i>x</i> cm')}. A square of side ${B(a + ' cm')} is cut from one corner. Factorise the remaining area ${B(tx(`x^2-${a * a}`))} and use it to find the remaining area when <i>x</i> = ${k}.`, ...nAns(k * k - a * a), unit: 'cm²', hint: 'Use the difference of two squares.',
        steps: [`${tx(`x^2-${a * a}`)} = ${tx(`(x+${a})(x-${a})`)}`, `When <i>x</i> = ${k}: (${k} + ${a})(${k} − ${a}) = ${k + a} × ${k - a}`, `= ${B(ds(k * k - a * a))} cm²`] };
    }],
]);

// ---------------------------------------------------------------- solving quadratics
addStyles('y10-solving-quadratics', [
  ['Problems in context',
    'Form a quadratic equation from the information, rearrange so one side is 0, factorise and solve. In real contexts a length, time or number of items cannot be negative, so reject any solution that does not make sense.',
    (r) => {
      const t = r.int(0, 4);
      if (t === 0) { const a = r.int(1, 6), b = r.int(1, 8), x = r.int(2, 12); const A = (x + a) * (x + b); const obj = r.pick(['lawn', 'classroom floor', 'photo frame', 'vegetable plot']);
        const c = a * b - A; const other = -(a + b) - x;
        return { html: `A rectangular ${obj} has length ${B(tx(lin(1, a)))} metres and width ${B(tx(lin(1, b)))} metres. Its area is ${B(A + ' m²')}. Find the value of <i>x</i>.`, answerLabel: 'x =', ...nAns(x), hint: 'Area = length × width. Expand, make one side 0 and factorise.',
          steps: [`${tx(`(${lin(1, a)})(${lin(1, b)})=${A}`)}`, `Expand and rearrange: ${tx(`${quad(1, a + b, c)}=0`)}`, `Factorise: ${tx(`(${lin(1, -x)})(${lin(1, -other)})=0`)}, so <i>x</i> = ${x} or <i>x</i> = ${ds(other)}`, `A length cannot be negative, so <i>x</i> = ${B(x)}`] }; }
      if (t === 1) { const n = r.int(4, 30); const even = r.chance(); const m = even ? 2 * n : n; const step = even ? 2 : 1; const P = m * (m + step);
        const other = -(m + step);
        return { html: `Two consecutive ${even ? 'even ' : ''}positive whole numbers multiply to give ${B(ds(P))}. Let the smaller number be <i>n</i>. Form and solve an equation to find the smaller number.`, answerLabel: 'n =', ...nAns(m), hint: `The numbers are n and n + ${step}.`,
          steps: [`${tx(`n(n+${step})=${P}`)}`, `${tx(`n^2+${step}n-${P}=0`)}`, `Factorise: ${tx(`(n-${m})(n+${m + step})=0`)}, so <i>n</i> = ${m} or <i>n</i> = ${ds(other)}`, `The numbers are positive, so the smaller number is ${B(m)}`] }; }
      if (t === 2) { let t1, t2; do { t1 = r.int(1, 4); t2 = r.int(2, 7); } while (t2 <= t1); const k = 5 * (t1 + t2), H = 5 * t1 * t2; const later = r.chance(); const obj = r.pick(['ball', 'rocket', 'stone', 'firework']);
        return { html: `A ${obj} is launched upwards. Its height, <i>h</i> metres, after <i>t</i> seconds is ${B(`<i>h</i> = ${k}<i>t</i> − 5<i>t</i><sup>2</sup>`)}. The ${obj} is at a height of ${B(H + ' m')} twice. Find the ${later ? 'second (later)' : 'first (earlier)'} time.`, answerLabel: 't =', unit: 's', ...nAns(later ? t2 : t1, { unit: 's' }), hint: `Set ${k}t − 5t² = ${H}, rearrange and divide by 5.`,
          steps: [`${k}<i>t</i> − 5<i>t</i><sup>2</sup> = ${H}`, `Rearrange and divide by 5: ${tx(`t^2-${t1 + t2}t+${t1 * t2}=0`)}`, `Factorise: ${tx(`(t-${t1})(t-${t2})=0`)}, so <i>t</i> = ${t1} or <i>t</i> = ${t2}`, `The ${later ? 'later' : 'earlier'} time is ${B(later ? t2 : t1)} seconds`] }; }
      if (t === 3) { const a = r.int(1, 8), x = 2 * r.int(1, 7); const A = x * (x + a) / 2; const other = -(x + a);
        return { html: `A triangle has a height of ${B('<i>x</i> cm')} and a base of ${B(tx(lin(1, a)) + ' cm')}. Its area is ${B(ds(A) + ' cm²')}. Find the height of the triangle.`, answerLabel: 'x =', unit: 'cm', ...nAns(x, { unit: 'cm' }), hint: 'Area = ½ × base × height. Multiply both sides by 2 first.',
          steps: [`½ × ${tx(`x(${lin(1, a)})=${ds(A)}`)}`, `${tx(`x^2+${a}x=${2 * A}`)}, so ${tx(`x^2+${a}x-${2 * A}=0`)}`, `Factorise: ${tx(`(x-${x})(x+${x + a})=0`)}, so <i>x</i> = ${x} or <i>x</i> = ${ds(other)}`, `Height cannot be negative: <i>x</i> = ${B(x)} cm`] }; }
      const x = r.int(2, 15), b = r.int(1, 9); const c = x * x + b * x; const nm = e10Pick(r, e10Names);
      return { html: `${nm} thinks of a positive number. ${nm} squares it, then adds ${B(b)} times the original number. The result is ${B(c)}. What number did ${nm} think of?`, ...nAns(x), hint: `Write x² + ${b}x = ${c}, make one side 0 and factorise.`,
        steps: [`${tx(`x^2+${b}x=${c}`)}`, `${tx(`x^2+${b}x-${c}=0`)}`, `Factorise: ${tx(`(x-${x})(x+${x + b})=0`)}, so <i>x</i> = ${x} or <i>x</i> = ${ds(-(x + b))}`, `The number is positive, so it is ${B(x)}`] };
    }],
]);

// ---------------------------------------------------------------- trigonometry
addStyles('y10-trigonometry', [
  ['Problems in context',
    'Draw (or imagine) the right-angled triangle hidden in the situation — the ground is usually horizontal and walls are vertical. Label the sides O, A, H from the angle, then choose sin, cos or tan.',
    (r) => {
      const t = r.int(0, 4);
      if (t === 0) { const L = r.int(30, 90) / 10, th = r.int(60, 80); const h = L * sinD(th);
        return { html: `A ladder of length ${B(ds(L) + ' m')} leans against a vertical wall. The ladder makes an angle of ${B(th + '°')} with the horizontal ground. How far up the wall does the ladder reach? Give your answer to 1 decimal place.`, diagram: rtSvg({ v: 'h', hyp: `${ds(L)} m`, angle: `${th}°`, angleAt: 'B', hi: 'v' }), unit: 'm', ...nAns(h, { dp: 1, unit: 'm' }), format: dpFmt(1), hint: 'The ladder is the hypotenuse; the height is opposite the angle.',
          steps: ['The ladder is the hypotenuse and the height is opposite the angle, so use sin.', `h = ${ds(L)} × sin ${th}° = ${fx(h, 4)}…`, `h = ${B(r1(h))} m`] }; }
      if (t === 1) { const h = r.int(3, 12) / 10, L = r.int(30, 80) / 10; const th = asinD(h / L);
        return { html: `A wheelchair ramp is ${B(ds(L) + ' m')} long and rises a vertical height of ${B(ds(h) + ' m')}. Work out the angle the ramp makes with the horizontal ground. Give your answer to 1 decimal place.`, unit: '°', ...nAns(th, { dp: 1, unit: '°' }), format: dpFmt(1), hint: 'You know the opposite and the hypotenuse.',
          steps: [`Opposite = ${ds(h)} m and hypotenuse = ${ds(L)} m, so use sin.`, `sin θ = ${ds(h)} ÷ ${ds(L)}`, `θ = sin<sup>−1</sup>(${ds(h)} ÷ ${ds(L)}) = ${fx(th, 4)}…`, `θ = ${B(r1(th) + '°')}`] }; }
      if (t === 2) { const d = r.int(15, 80), th = r.int(20, 55), e = r.int(14, 18) / 10; const h = d * tanD(th) + e; const obj = r.pick(['tree', 'church tower', 'flagpole', 'block of flats']);
        return { html: `${e10Pick(r, e10Names)} stands ${B(d + ' m')} from the foot of a ${obj} on level ground. The angle of elevation of the top of the ${obj} from eye level is ${B(th + '°')}. Eye level is ${B(ds(e) + ' m')} above the ground. Work out the height of the ${obj}. Give your answer to 1 decimal place.`, unit: 'm', ...nAns(h, { dp: 1, unit: 'm' }), format: dpFmt(1), hint: 'Use tan to find the height above eye level, then add the eye height.',
          steps: [`Height above eye level = ${d} × tan ${th}° = ${fx(d * tanD(th), 4)}…`, `Add eye height: ${fx(d * tanD(th), 4)}… + ${ds(e)} = ${fx(h, 4)}…`, `Height = ${B(r1(h))} m`] }; }
      if (t === 3) { const L = 5 * r.int(6, 30), th = r.int(25, 65); const h = L * sinD(th); const obj = r.pick(['kite', 'small drone', 'party balloon']);
        return { html: `A ${obj} is tied to a tight, straight string of length ${B(L + ' m')}. The other end of the string is fixed to the ground. The string makes an angle of ${B(th + '°')} with the horizontal ground. How high above the ground is the ${obj}? Give your answer to 1 decimal place.`, unit: 'm', ...nAns(h, { dp: 1, unit: 'm' }), format: dpFmt(1), hint: 'String = hypotenuse, height = opposite.',
          steps: ['The string is the hypotenuse and the height is opposite the angle: use sin.', `Height = ${L} × sin ${th}° = ${fx(h, 4)}…`, `Height = ${B(r1(h))} m`] }; }
      const E = r.int(4, 30), N = r.int(4, 30); const th = atanD(E / N);
      return { html: `A boat sails ${B(N + ' km')} due north and then ${B(E + ' km')} due east. Work out the bearing of the boat from its starting point. Give your answer to 1 decimal place.`, unit: '°', ...nAns(th, { dp: 1, unit: '°' }), format: dpFmt(1), hint: 'The bearing is the angle measured clockwise from north: use tan with east (opposite) and north (adjacent).',
        steps: [`From the starting point, north is adjacent (${N} km) and east is opposite (${E} km).`, `tan θ = ${E} ÷ ${N}`, `θ = tan<sup>−1</sup>(${E} ÷ ${N}) = ${fx(th, 4)}…`, `Bearing = ${B(r1(th) + '°')}`] };
    }],
  ['Two-step problems',
    'Some problems need trigonometry twice. Find a length in one right-angled triangle, keep the full calculator value, then use it in the second calculation. Only round at the end.',
    (r) => {
      const t = r.int(0, 3);
      if (t === 0) { const d = r.int(20, 60), a = r.int(35, 60), b = a - r.int(8, 20); const h = d * tanD(a); const D = h / tanD(b); const w = D - d; const obj = r.pick(['lighthouse', 'tower', 'tall tree', 'statue']);
        return { html: `From a point ${B(d + ' m')} from the foot of a ${obj}, the angle of elevation of the top is ${B(a + '°')}. A walker then moves directly away from the ${obj} until the angle of elevation is ${B(b + '°')}. How far did the walker move? Give your answer to 1 decimal place.`, unit: 'm', ...nAns(w, { dp: 1, unit: 'm' }), format: dpFmt(1), hint: 'First find the height using tan, then the new distance.',
          steps: [`Height = ${d} × tan ${a}° = ${fx(h, 4)}… m`, `New distance = height ÷ tan ${b}° = ${fx(D, 4)}… m`, `Distance moved = ${fx(D, 4)}… − ${d} = ${fx(w, 4)}…`, `Distance moved = ${B(r1(w))} m`] }; }
      if (t === 1) { const L = r.int(40, 90) / 10, a = r.int(70, 80), b = a - r.int(8, 20); const h1 = L * sinD(a), h2 = L * sinD(b); const dd = h1 - h2;
        return { html: `A ladder of length ${B(ds(L) + ' m')} leans against a vertical wall at an angle of ${B(a + '°')} to the ground. The foot of the ladder slips, and the angle becomes ${B(b + '°')}. How far down the wall does the top of the ladder slide? Give your answer to 2 decimal places.`, unit: 'm', ...nAns(dd, { dp: 2, unit: 'm' }), format: dpFmt(2), hint: 'Find both heights using sin, then subtract.',
          steps: [`Height before = ${ds(L)} × sin ${a}° = ${fx(h1, 4)}… m`, `Height after = ${ds(L)} × sin ${b}° = ${fx(h2, 4)}… m`, `Slide = ${fx(h1, 4)}… − ${fx(h2, 4)}… = ${fx(dd, 4)}…`, `= ${B(fx(dd, 2))} m`] }; }
      if (t === 2) { const w = 2 * r.int(30, 60) / 10, th = r.int(20, 45); const raf = (w / 2) / cosD(th); const tot = 2 * raf;
        return { html: `A roof is symmetrical. Its width is ${B(ds(w) + ' m')} and each sloping side makes an angle of ${B(th + '°')} with the horizontal. Work out the total length of the two sloping sides. Give your answer to 1 decimal place.`, unit: 'm', ...nAns(tot, { dp: 1, unit: 'm' }), format: dpFmt(1), hint: 'Split the roof into two right-angled triangles; each has a horizontal side of half the width.',
          steps: [`Each half has horizontal (adjacent) side ${ds(w / 2)} m.`, `One sloping side = ${ds(w / 2)} ÷ cos ${th}° = ${fx(raf, 4)}… m`, `Total = 2 × ${fx(raf, 4)}… = ${fx(tot, 4)}…`, `Total = ${B(r1(tot))} m`] }; }
      const h = r.int(50, 300), a = r.int(25, 60), b = r.int(15, a - 5); const d1 = h / tanD(a), d2 = h / tanD(b); const gap = d2 - d1;
      return { html: `A person stands on top of a cliff ${B(h + ' m')} high. They look down at two boats directly out to sea, in a straight line with the foot of the cliff. The angles of depression of the boats are ${B(a + '°')} and ${B(b + '°')}. Work out the distance between the boats. Give your answer to the nearest metre.`, unit: 'm', ...nAns(gap, { dp: 0, unit: 'm' }), format: 'Give your answer to the nearest metre', hint: 'The angle of depression equals the angle of elevation from the boat. Find each boat’s distance from the cliff.',
        steps: [`Nearer boat: distance = ${h} ÷ tan ${a}° = ${fx(d1, 3)}… m`, `Further boat: distance = ${h} ÷ tan ${b}° = ${fx(d2, 3)}… m`, `Distance between = ${fx(d2, 3)}… − ${fx(d1, 3)}… = ${fx(gap, 3)}…`, `≈ ${B(ds(Math.round(gap)))} m`] };
    }],
]);

// ---------------------------------------------------------------- fractional indices
addStyles('y10-fractional-indices', [
  ['Exam-style problem',
    'Exam questions combine the index rules: write numbers as powers of the same base, use a^(1/n) = ⁿ√a, a^(m/n) = (ⁿ√a)^m and a^(−n) = 1/aⁿ, then compare or multiply.',
    (r) => {
      const t = r.int(0, 3);
      if (t === 0) { // find n
        const s = r.pick([2, 3, 5]); const j = s === 2 ? r.pick([2, 3]) : 2; const base = s ** j; let m; do { m = r.nz(-7, 7); } while (m % j === 0 || s ** Math.abs(m) > 2000);
        const target = m > 0 ? ds(s ** m) : frac(1, s ** -m); const n = m / j;
        return { html: `Find the value of <i>n</i> such that ${B(`${base}<sup><i>n</i></sup>`)} = ${B(target)}.`, answerLabel: 'n =', ...fAns(m, j), format: 'Give n as a fraction if needed, e.g. -3/2', hint: `Write both sides as powers of ${s}.`,
          steps: [`${base} = ${s}<sup>${j}</sup>, so ${base}<sup><i>n</i></sup> = ${s}<sup>${j}<i>n</i></sup>`, `${target} = ${s}<sup>${ds(m)}</sup>`, `${j}<i>n</i> = ${ds(m)}, so <i>n</i> = ${B(fracS(m, j))}`] }; }
      if (t === 1) { // product
        let b1, k1, p1; do { k1 = r.pick([2, 3]); b1 = r.int(2, 6); p1 = r.int(1, 3); } while (b1 ** k1 > 300 || gcd(p1, k1) !== 1);
        const a1 = b1 ** k1; const b2 = r.int(2, 7); const a2 = b2 * b2; const v1 = b1 ** p1;
        return { html: `Work out the value of ${B(`${a1}<sup>${frac(p1, k1)}</sup> × ${a2}<sup>−${frac(1, 2)}</sup>`)}. Give your answer as a fraction in its simplest form, or as a whole number.`, ...fAns(v1, b2), format: 'E.g. 9/2 or 4', hint: 'Work out each power separately, then multiply.',
          steps: [p1 === 1 ? `${a1}<sup>1/${k1}</sup> = ${k1 === 2 ? '√' : '∛'}${a1} = ${v1}` : `${a1}<sup>${p1}/${k1}</sup> = (${k1 === 2 ? '√' : '∛'}${a1})<sup>${p1}</sup> = ${b1}<sup>${p1}</sup> = ${v1}`, `${a2}<sup>−1/2</sup> = ${frac(1, `√${a2}`)} = ${frac(1, b2)}`, `${v1} × ${frac(1, b2)} = ${B(fracS(v1, b2))}`] }; }
      if (t === 2) { // cube
        const b = r.int(2, 12); const V = b ** 3; const ask = r.pick(['sa', 'face']); const sa = 6 * b * b; const obj = r.pick(['A cube-shaped box', 'A solid cube of wood', 'A cube of ice', 'A cubic storage crate']);
        return { html: `${obj} has a volume of ${B(ds(V) + ' cm³')}. The length of each edge is ${B(`<i>V</i><sup>${frac(1, 3)}</sup>`)} and the area of each face is ${B(`<i>V</i><sup>${frac(2, 3)}</sup>`)}. Work out the ${ask === 'sa' ? 'total surface area of the cube' : 'area of one face of the cube'}.`, unit: 'cm²', ...nAns(ask === 'sa' ? sa : b * b, { unit: 'cm²' }), hint: 'Find the cube root first, then square it.',
          steps: [`${ds(V)}<sup>1/3</sup> = ∛${ds(V)} = ${b} cm`, `${ds(V)}<sup>2/3</sup> = ${b}<sup>2</sup> = ${b * b} cm²`, ask === 'sa' ? `Total surface area = 6 × ${b * b} = ${B(sa)} cm²` : `Area of one face = ${B(b * b)} cm²`] }; }
      // growth formula
      const k = r.pick([2, 3]); let b, tt; do { b = r.int(2, 5); tt = r.int(1, 6); } while (b ** tt > 1000 || tt % k === 0); const base = b ** k; const A = r.pick([10, 20, 25, 50, 100]); const N = A * b ** tt;
      const what = r.pick(['bacteria in a dish', 'cells in a sample', 'yeast cells', 'algae cells in a pond sample']);
      return { html: `The number of ${what}, <i>N</i>, after <i>t</i> hours is given by ${B(`<i>N</i> = ${A} × ${base}<sup><i>t</i>/${k}</sup>`)}. Work out the number after ${B(tt + (tt === 1 ? ' hour' : ' hours'))}.`, ...nAns(N), format: 'Type a whole number', hint: `${base}<sup>${tt}/${k}</sup> = (${k === 2 ? '√' : '∛'}${base})<sup>${tt}</sup>.`,
        steps: [`<i>N</i> = ${A} × ${base}<sup>${tt}/${k}</sup>`, tt === 1 ? `${base}<sup>1/${k}</sup> = ${b}` : `${base}<sup>1/${k}</sup> = ${b}, so ${base}<sup>${tt}/${k}</sup> = ${b}<sup>${tt}</sup> = ${b ** tt}`, `<i>N</i> = ${A} × ${b ** tt} = ${B(ds(N))}`] };
    }],
]);

// ---------------------------------------------------------------- surds
addStyles('y10-surds', [
  ['Exam-style problem',
    'Surds keep answers exact. In geometry problems, use the usual formulae (area, perimeter, Pythagoras), then simplify any surd by taking out the largest square factor.',
    (r) => {
      const t = r.int(0, 3);
      if (t === 0) { let a, b, k, m; do { a = r.int(2, 15); b = r.int(2, 15); [k, m] = simpSurd(a * b); } while (a === b || k === 1 || m === 1 || Number.isInteger(Math.sqrt(a)) || Number.isInteger(Math.sqrt(b)));
        const obj = r.pick(['rectangle', 'rectangular label', 'rectangular tile', 'rectangular window']);
        return { html: `A ${obj} measures ${B(sq(a) + ' cm')} by ${B(sq(b) + ' cm')}. Work out its area. Give your answer as a surd in its simplest form.`, unit: 'cm²', ...surdQ(k, m), hint: '√a × √b = √(ab), then simplify.',
          steps: [`Area = ${sq(a)} × ${sq(b)} = ${sq(a * b)}`, `${sq(a * b)} = ${sq(k * k)} × ${sq(m)} = ${B(surdH(k, m))} cm²`] }; }
      if (t === 1) { let k, m; do { k = r.int(2, 9); m = r.pick(SQF); } while (k * k * m > 400); const A = k * k * m; const obj = r.pick(['square garden', 'square rug', 'square tile', 'square field']);
        return { html: `A ${obj} has an area of ${B(A + ' m²')}. Work out its perimeter. Give your answer as a surd in its simplest form.`, unit: 'm', ...surdQ(4 * k, m), hint: 'Side = √area. Simplify, then multiply by 4.',
          steps: [`Side length = ${sq(A)} = ${sq(k * k)} × ${sq(m)} = ${surdH(k, m)} m`, `Perimeter = 4 × ${surdH(k, m)} = ${B(surdH(4 * k, m))} m`] }; }
      if (t === 2) { let a, b, k, m; do { a = r.int(1, 12); b = r.int(1, 12); [k, m] = simpSurd(a * a + b * b); } while (k === 1 || m === 1 || a > b);
        const ctx = r.pick(['a right-angled triangle has shorter sides', 'a rectangular screen has a width and height of', 'a ramp has horizontal length and vertical height of']);
        const what = ctx.startsWith('a right') ? 'the length of the hypotenuse' : ctx.includes('screen') ? 'the length of the diagonal' : 'the length of the sloping surface';
        return { html: `${ctx[0].toUpperCase() + ctx.slice(1)} ${B(a + ' cm')} and ${B(b + ' cm')}. Work out ${what}. Give your answer as a surd in its simplest form.`, unit: 'cm', ...surdQ(k, m), hint: 'Use Pythagoras, then simplify the surd.',
          steps: [`Length² = ${a}<sup>2</sup> + ${b}<sup>2</sup> = ${a * a + b * b}`, `Length = ${sq(a * a + b * b)} = ${sq(k * k)} × ${sq(m)}`, `= ${B(surdH(k, m))} cm`] }; }
      let a, b; do { a = r.int(3, 12); b = r.pick(SQF); } while (a * a <= b);
      return { html: `A rectangle has length ${B(`(${a} + ${sq(b)}) cm`)} and width ${B(`(${a} − ${sq(b)}) cm`)}. Show that its area is a whole number of cm², and write down this number.`, unit: 'cm²', ...nAns(a * a - b, { unit: 'cm²' }), hint: 'Expand the brackets — the surd terms cancel.',
        steps: [`Area = (${a} + ${sq(b)})(${a} − ${sq(b)})`, `= ${a * a} − ${a}${sq(b)} + ${a}${sq(b)} − ${b}`, `= ${a * a} − ${b} = ${B(a * a - b)} cm²`] };
    }],
]);

// ---------------------------------------------------------------- simultaneous equations
addStyles('y10-simultaneous-equations', [
  ['Problems in context',
    'Choose a letter for each unknown, write an equation for each fact, and solve them simultaneously. Then use your values to answer the exact question asked — it may not just be x or y.',
    (r) => {
      const t = r.int(0, 3);
      if (t === 0) { let x, y, p, q, s, u; do { x = r.int(18, 40) / 10; y = r.int(15, 45) / 10; p = r.int(1, 5); q = r.int(1, 5); s = r.int(1, 5); u = r.int(1, 5); } while (p * u - q * s === 0 || p * s === q * u || x === y);
        const T1 = p * x + q * y, T2 = s * x + u * y; const m = r.int(2, 6), n = r.int(2, 6); const ans = m * x + n * y; const pr = r.pick([['coffees', 'muffins'], ['teas', 'scones'], ['milkshakes', 'cookies'], ['hot chocolates', 'brownies']]);
        return { html: `In a café, ${p} ${pr[0]} and ${q} ${pr[1]} cost ${B(money(T1))}.<br>${s} ${pr[0]} and ${u} ${pr[1]} cost ${B(money(T2))}.<br>Work out the cost of ${B(`${m} ${pr[0]} and ${n} ${pr[1]}`)}.`, ...nAns(ans, { money: true }), format: 'Give your answer in pounds', hint: 'Let c = cost of one of the first item and m = cost of one of the second item.',
          steps: [`${tx(`${coefT(p, 'c')}+${coefT(q, 'm')}=${fx(T1, 2)}`)} and ${tx(`${coefT(s, 'c')}+${coefT(u, 'm')}=${fx(T2, 2)}`)}`, `Solve simultaneously: one ${pr[0].replace(/s$/, '')} costs ${money(x)}, one ${pr[1].replace(/s$/, '')} costs ${money(y)}`, `${m} × ${money(x)} + ${n} × ${money(y)} = ${B(money(ans))}`] }; }
      if (t === 1) { const c = r.pick([[20, 50], [10, 50], [20, 10], [5, 20]]); const a = r.int(5, 30), b = r.int(5, 30); const N = a + b, V = c[0] * a + c[1] * b; const nm = e10Pick(r, e10Names);
        const Vm = money(V / 100);
        return { html: `${nm} has a jar containing only ${c[0]}p and ${c[1]}p coins. There are ${B(N)} coins altogether, with a total value of ${B(Vm)}. How many ${c[1]}p coins are in the jar?`, ...nAns(b), format: 'Type a whole number', hint: `Let x = number of ${c[0]}p coins and y = number of ${c[1]}p coins. Work in pence.`,
          steps: [`${tx(`x+y=${N}`)} and ${tx(`${c[0]}x+${c[1]}y=${V}`)} (in pence)`, `Multiply the first by ${c[0]}: ${tx(`${c[0]}x+${c[0]}y=${c[0] * N}`)}`, `Subtract: ${c[1] - c[0]}<i>y</i> = ${V - c[0] * N}, so <i>y</i> = ${b}`, `There are ${B(b)} coins worth ${c[1]}p`] }; }
      if (t === 2) { const F = r.pick([2.5, 3, 3.5, 4, 4.5, 5]), R = r.pick([1.2, 1.5, 1.8, 2, 2.2, 2.5]); let m1, m2, m3; do { m1 = r.int(2, 8); m2 = r.int(9, 20); m3 = r.int(3, 25); } while (m3 === m1 || m3 === m2);
        const C1 = F + R * m1, C2 = F + R * m2, C3 = F + R * m3; const firm = r.pick(['taxi', 'minicab', 'courier', 'removal van']);
        return { html: `A ${firm} company charges a fixed fee plus a cost per mile. A journey of ${m1} miles costs ${B(money(C1))}. A journey of ${m2} miles costs ${B(money(C2))}. How much does a journey of ${B(m3 + ' miles')} cost?`, ...nAns(C3, { money: true }), format: 'Give your answer in pounds', hint: 'Let f = fixed fee and r = cost per mile.',
          steps: [`${tx(`f+${m1}r=${fx(C1, 2)}`)} and ${tx(`f+${m2}r=${fx(C2, 2)}`)}`, `Subtract: ${m2 - m1}<i>r</i> = ${fx(C2 - C1, 2)}, so <i>r</i> = ${fx(R, 2)} and <i>f</i> = ${fx(F, 2)}`, `${m3}-mile journey: ${fx(F, 2)} + ${m3} × ${fx(R, 2)} = ${B(money(C3))}`] }; }
      const a = 2 * r.int(4, 15), c = 2 * r.int(2, a / 2 - 1); const N = r.int(40, 250); const ad = r.int(5, N - 5), ch = N - ad; const I = a * ad + c * ch; const ev = r.pick(['school play', 'football match', 'concert', 'theme park']);
      return { html: `Tickets for a ${ev} cost ${B(money(a))} for an adult and ${B(money(c))} for a child. ${B(N)} tickets were sold, and the takings were ${B(money(I))}. How many adult tickets were sold?`, ...nAns(ad), format: 'Type a whole number', hint: 'Let a = adult tickets and c = child tickets.',
        steps: [`${tx(`a+c=${N}`)} and ${tx(`${a}a+${c}c=${I}`)}`, `Multiply the first by ${c}: ${tx(`${c}a+${c}c=${c * N}`)}`, `Subtract: ${a - c}<i>a</i> = ${I - c * N}, so <i>a</i> = ${ad}`, `${B(ad)} adult tickets were sold`] };
    }],
]);

// ---------------------------------------------------------------- rearranging
addStyles('y10-rearranging', [
  ['Problems in context',
    'Real formulae (speed, temperature, cost) often need rearranging before you can use them. Make the required letter the subject, then substitute the values you are given.',
    (r) => {
      const t = r.int(0, 4);
      if (t === 0) { const a = r.pick([2, 2.5, 3, 4, 5]), tt = r.int(2, 12), u = r.int(0, 15); const v = u + a * tt;
        return { html: `The formula ${B(tx('v=u+at'))} gives the final speed <i>v</i> m/s of a ${r.pick(['car', 'cyclist', 'train', 'skateboarder'])} with starting speed <i>u</i> m/s and acceleration <i>a</i> m/s² after <i>t</i> seconds. Rearrange to make <i>t</i> the subject, then find <i>t</i> when <i>v</i> = ${ds(v)}, <i>u</i> = ${u} and <i>a</i> = ${ds(a)}.`, answerLabel: 't =', unit: 's', ...nAns(tt, { unit: 's' }), hint: 'Subtract u, then divide by a.',
          steps: [`${tx('v-u=at')}, so <i>t</i> = ${frac(tx('v-u'), tx('a'))}`, `<i>t</i> = (${ds(v)} − ${u}) ÷ ${ds(a)}`, `<i>t</i> = ${B(tt)} seconds`] }; }
      if (t === 1) { const C = 5 * r.int(-4, 8); const F = 9 * C / 5 + 32;
        return { html: `The formula ${B(`<i>F</i> = ${frac(9, 5)}<i>C</i> + 32`)} converts a temperature in degrees Celsius (<i>C</i>) to degrees Fahrenheit (<i>F</i>). A ${r.pick(['weather report', 'recipe', 'thermometer', 'travel guide'])} gives a temperature of ${B(ds(F) + '°F')}. Rearrange the formula to make <i>C</i> the subject and find this temperature in °C.`, answerLabel: 'C =', unit: '°C', ...nAns(C, { unit: '°C' }), hint: 'Subtract 32, then multiply by 5/9.',
          steps: [`<i>F</i> − 32 = ${frac(9, 5)}<i>C</i>, so <i>C</i> = ${frac(5, 9)}(<i>F</i> − 32)`, `<i>C</i> = ${frac(5, 9)} × (${ds(F)} − 32) = ${frac(5, 9)} × ${ds(F - 32)}`, `<i>C</i> = ${B(ds(C))}°C`] }; }
      if (t === 2) { const A = r.int(20, 600); const rr = Math.sqrt(A / Math.PI); const obj = r.pick(['circular pond', 'round table top', 'circular flower bed', 'circular rug']);
        return { html: `A ${obj} has an area of ${B(A + ' m²')}. Using ${B('<i>A</i> = π<i>r</i><sup>2</sup>')}, make <i>r</i> the subject and work out the radius. Give your answer to 2 decimal places.`, answerLabel: 'r =', unit: 'm', ...nAns(rr, { dp: 2, unit: 'm' }), format: dpFmt(2), hint: 'Divide by π, then square root.',
          steps: [`<i>r</i><sup>2</sup> = ${frac('<i>A</i>', 'π')}, so <i>r</i> = √(${frac('<i>A</i>', 'π')})`, `<i>r</i> = √(${A} ÷ π) = ${fx(rr, 4)}…`, `<i>r</i> = ${B(fx(rr, 2))} m`] }; }
      if (t === 3) { const f = r.pick([2.5, 3, 3.5, 4, 5]), p = r.pick([1.2, 1.5, 1.6, 2, 2.4]), m = r.int(3, 30); const C = f + p * m;
        return { html: `A ${r.pick(['bike hire', 'taxi', 'boat hire', 'scooter hire'])} company uses the formula ${B(`<i>C</i> = ${fx(f, 2)} + ${fx(p, 2)}<i>m</i>`)} to work out the cost in pounds, <i>C</i>, for <i>m</i> miles. ${e10Pick(r, e10Names)} paid ${B(money(C))}. Make <i>m</i> the subject and find how many miles were travelled.`, answerLabel: 'm =', unit: 'miles', ...nAns(m, { unit: 'miles' }), hint: `Subtract ${fx(f, 2)}, then divide by ${fx(p, 2)}.`,
          steps: [`<i>m</i> = ${frac(`<i>C</i> − ${fx(f, 2)}`, fx(p, 2))}`, `<i>m</i> = (${fx(C, 2)} − ${fx(f, 2)}) ÷ ${fx(p, 2)} = ${fx(C - f, 2)} ÷ ${fx(p, 2)}`, `<i>m</i> = ${B(m)} miles`] }; }
      const mm = r.pick([2, 4, 5, 8, 10, 20]), v = r.int(2, 15); const E = mm * v * v / 2;
      return { html: `The kinetic energy, <i>E</i> joules, of an object of mass <i>m</i> kg moving at <i>v</i> m/s is ${B(`<i>E</i> = ${frac(1, 2)}<i>mv</i><sup>2</sup>`)}. A ${r.pick(['trolley', 'ball', 'sledge', 'parcel'])} of mass ${B(mm + ' kg')} has ${B(ds(E) + ' J')} of kinetic energy. Make <i>v</i> the subject and work out its speed.`, answerLabel: 'v =', unit: 'm/s', ...nAns(v, { unit: 'm/s' }), hint: 'Multiply by 2, divide by m, then square root.',
        steps: [`2<i>E</i> = <i>mv</i><sup>2</sup>, so <i>v</i> = √(${frac('2<i>E</i>', '<i>m</i>')})`, `<i>v</i> = √(2 × ${ds(E)} ÷ ${mm}) = √${v * v}`, `<i>v</i> = ${B(v)} m/s`] };
    }],
]);

// ---------------------------------------------------------------- arcs & sectors
addStyles('y10-arcs-sectors', [
  ['Problems in context',
    'Many real objects are sectors: pizza slices, flower beds, fans and pendulum swings. Decide whether you need an arc length (a distance around the edge), a perimeter (arc + two radii) or an area, then finish the problem.',
    (r) => {
      const t = r.int(0, 3);
      if (t === 0) { const th = r.pick([30, 36, 40, 45, 60, 72]), rr = r.int(12, 22); const L = th / 360 * 2 * Math.PI * rr; const slices = 360 / th;
        return { html: `A round pizza of radius ${B(rr + ' cm')} is cut into ${B(slices)} equal slices. Work out the length of the curved crust on one slice. Give your answer to 1 decimal place.`, diagram: sectorSvg(th, `${rr} cm`, `${th}°`, 'arc'), unit: 'cm', ...nAns(L, { dp: 1, unit: 'cm' }), format: dpFmt(1), hint: 'First find the angle of each slice.',
          steps: [`Angle of one slice = 360° ÷ ${slices} = ${th}°`, `Arc length = ${frac(th, 360)} × 2 × π × ${rr} = ${fx(L, 4)}…`, `Crust = ${B(r1(L))} cm`] }; }
      if (t === 1) { const th = 5 * r.int(10, 50), rr = r.int(2, 8); const price = r.pick([2.5, 3, 3.5, 4, 4.5, 6]); const P = th / 360 * 2 * Math.PI * rr + 2 * rr; const M = Math.ceil(P); const cost = M * price;
        return { html: `A flower bed is a sector of a circle with radius ${B(rr + ' m')} and angle ${B(th + '°')}. Edging is put all the way around the flower bed. Edging is sold in whole metres at ${B(money(price))} per metre. How much does the edging cost?`, diagram: sectorSvg(th, `${rr} m`, `${th}°`, 'arc'), ...nAns(cost, { money: true }), format: 'Give your answer in pounds', hint: 'Perimeter = arc + 2 radii. Round UP to whole metres.',
          steps: [`Arc = ${frac(th, 360)} × 2π × ${rr} = ${fx(P - 2 * rr, 3)}… m`, `Perimeter = ${fx(P - 2 * rr, 3)}… + 2 × ${rr} = ${fx(P, 3)}… m, so buy ${M} m`, `Cost = ${M} × ${money(price)} = ${B(money(cost))}`] }; }
      if (t === 2) { const r2 = r.int(35, 60), r1v = r.int(8, r2 - 15), th = 5 * r.int(18, 32); const A = th / 360 * Math.PI * (r2 * r2 - r1v * r1v);
        return { html: `A car windscreen wiper rotates through ${B(th + '°')}. The rubber blade starts ${B(r1v + ' cm')} from the pivot and ends ${B(r2 + ' cm')} from the pivot. Work out the area of windscreen wiped. Give your answer to the nearest cm².`, unit: 'cm²', ...nAns(A, { dp: 0, unit: 'cm²' }), format: 'Give your answer to the nearest whole number', hint: 'Large sector − small sector.',
          steps: [`Large sector = ${frac(th, 360)} × π × ${r2}<sup>2</sup> = ${fx(th / 360 * Math.PI * r2 * r2, 2)}…`, `Small sector = ${frac(th, 360)} × π × ${r1v}<sup>2</sup> = ${fx(th / 360 * Math.PI * r1v * r1v, 2)}…`, `Area wiped = ${fx(A, 2)}… ≈ ${B(ds(Math.round(A)))} cm²`] }; }
      const th = 5 * r.int(15, 60), rr = r.int(6, 20), cov = r.pick([10, 15, 20, 25]); const A = th / 360 * Math.PI * rr * rr; const bags = Math.ceil(A / cov);
      return { html: `A lawn is a sector of a circle of radius ${B(rr + ' m')} and angle ${B(th + '°')}. One bag of grass seed covers ${B(cov + ' m²')}. How many bags of grass seed are needed to cover the lawn?`, diagram: sectorSvg(th, `${rr} m`, `${th}°`), ...nAns(bags), format: 'Type a whole number', hint: 'Find the sector area, divide by the coverage and round up.',
        steps: [`Area = ${frac(th, 360)} × π × ${rr}<sup>2</sup> = ${fx(A, 2)}… m²`, `${fx(A, 2)}… ÷ ${cov} = ${fx(A / cov, 2)}…`, `Round up: ${B(bags)} bags`] };
    }],
  ['Reverse problem',
    'Work backwards from an arc length or area given in terms of π. Write the formula, substitute what you know, cancel the π and solve for the radius or the angle.',
    (r) => {
      const t = r.int(0, 3); const ths = [30, 40, 45, 60, 72, 80, 90, 100, 120, 135, 150, 160, 180, 200, 210, 240, 270, 300];
      const ctx = r.pick(['A sector of a circle', 'A slice of cake (a sector)', 'A paper fan in the shape of a sector', 'A logo in the shape of a sector']);
      let th, rr, val; let tries = 0;
      do { th = r.pick(ths); rr = r.int(2, 18); val = t % 2 === 0 ? 2 * rr * th / 360 : rr * rr * th / 360; tries++; } while (!Number.isInteger(val) && tries < 200);
      if (!Number.isInteger(val)) { th = 90; rr = 4; val = t % 2 === 0 ? 2 : 4; }
      const vH = val === 1 ? 'π' : `${val}π`;
      if (t === 0) return { html: `${ctx} has an angle of ${B(th + '°')} and an arc length of ${B(vH + ' cm')}. Work out the radius.`, diagram: sectorSvg(th, 'r', `${th}°`, 'arc'), answerLabel: 'r =', unit: 'cm', ...nAns(rr, { unit: 'cm' }), hint: 'Arc = (θ/360) × 2πr. Cancel π.',
        steps: [`${frac(th, 360)} × 2π<i>r</i> = ${vH}`, `Cancel π: ${frac(th, 360)} × 2<i>r</i> = ${val}, so ${frac(th, 180)}<i>r</i> = ${val}`, `<i>r</i> = ${val} × ${frac(180, th)} = ${B(rr)} cm`] };
      if (t === 1) return { html: `${ctx} has an angle of ${B(th + '°')} and an area of ${B(vH + ' cm²')}. Work out the radius.`, diagram: sectorSvg(th, 'r', `${th}°`), answerLabel: 'r =', unit: 'cm', ...nAns(rr, { unit: 'cm' }), hint: 'Area = (θ/360) × πr². Cancel π.',
        steps: [`${frac(th, 360)} × π<i>r</i><sup>2</sup> = ${vH}`, `Cancel π: <i>r</i><sup>2</sup> = ${val} × ${frac(360, th)} = ${rr * rr}`, `<i>r</i> = √${rr * rr} = ${B(rr)} cm`] };
      if (t === 2) return { html: `${ctx} has a radius of ${B(rr + ' cm')} and an arc length of ${B(vH + ' cm')}. Work out the angle of the sector.`, diagram: sectorSvg(th, `${rr} cm`, 'θ', 'arc'), answerLabel: 'θ =', unit: '°', ...nAns(th, { unit: '°' }), hint: 'Arc = (θ/360) × 2πr. Cancel π.',
        steps: [`${frac('θ', 360)} × 2π × ${rr} = ${vH}`, `Cancel π: ${frac('θ', 360)} × ${2 * rr} = ${val}`, `θ = ${val} × 360 ÷ ${2 * rr} = ${B(th + '°')}`] };
      return { html: `${ctx} has a radius of ${B(rr + ' cm')} and an area of ${B(vH + ' cm²')}. Work out the angle of the sector.`, diagram: sectorSvg(th, `${rr} cm`, 'θ'), answerLabel: 'θ =', unit: '°', ...nAns(th, { unit: '°' }), hint: 'Area = (θ/360) × πr². Cancel π.',
        steps: [`${frac('θ', 360)} × π × ${rr}<sup>2</sup> = ${vH}`, `Cancel π: ${frac('θ', 360)} × ${rr * rr} = ${val}`, `θ = ${val} × 360 ÷ ${rr * rr} = ${B(th + '°')}`] };
    }],
]);

// ---------------------------------------------------------------- similar shapes
addStyles('y10-similar-shapes', [
  ['Problems in context',
    'Shadows, photos, models and ramps all involve similar shapes. Find the scale factor from a pair of corresponding lengths (in the same units), then use it.',
    (r) => {
      const t = r.int(0, 3); const nm = e10Pick(r, e10Names);
      if (t === 0) { const h = r.pick([1.2, 1.5, 1.6, 1.8, 2]), s = r.pick([0.8, 1.2, 1.5, 2, 2.4, 3]), k = r.pick([2.5, 3, 4, 5, 6, 7.5, 8]); const S = s * k, H = h * k; const obj = r.pick(['tree', 'lamp post', 'building', 'mast']);
        return { html: `At the same time of day, a ${B(ds(h) + ' m')} tall post casts a shadow ${B(ds(s) + ' m')} long and a ${obj} casts a shadow ${B(ds(S) + ' m')} long. Work out the height of the ${obj}.`, unit: 'm', ...nAns(H, { unit: 'm' }), hint: 'The two triangles formed by the objects and their shadows are similar.',
          steps: [`Scale factor = ${ds(S)} ÷ ${ds(s)} = ${ds(k)}`, `Height = ${ds(h)} × ${ds(k)}`, `= ${B(ds(H))} m`] }; }
      if (t === 1) { const w = r.pick([6, 8, 10, 12, 15]), h = r.pick([4, 5, 9, 10, 18]), k = r.pick([1.5, 2, 2.5, 3, 4]); const W = w * k, H = h * k; const per = 2 * (W + H);
        return { html: `${nm} enlarges a photo that is ${B(w + ' cm')} wide and ${B(h + ' cm')} tall. The enlarged photo is similar to the original and is ${B(ds(W) + ' cm')} wide. A frame goes around the edge of the enlarged photo. Work out the perimeter of the enlarged photo.`, unit: 'cm', ...nAns(per, { unit: 'cm' }), hint: 'Find the scale factor, then the new height.',
          steps: [`Scale factor = ${ds(W)} ÷ ${w} = ${ds(k)}`, `New height = ${h} × ${ds(k)} = ${ds(H)} cm`, `Perimeter = 2 × (${ds(W)} + ${ds(H)}) = ${B(ds(per))} cm`] }; }
      if (t === 2) { const k = r.pick([20, 25, 40, 50, 100]), m = r.int(8, 30) / 2; const real = m * k / 100; const obj = r.pick(['bus', 'boat', 'lorry', 'aeroplane', 'train carriage']);
        return { html: `A model ${obj} is made to a scale of ${B('1 : ' + k)}. The model is ${B(ds(m) + ' cm')} long. How long is the real ${obj}? Give your answer in metres.`, unit: 'm', ...nAns(real, { unit: 'm' }), hint: 'Multiply by the scale factor, then convert cm to m.',
          steps: [`Real length = ${ds(m)} × ${k} = ${ds(m * k)} cm`, `${ds(m * k)} cm ÷ 100 = ${B(ds(real))} m`] }; }
      const d = r.int(4, 12), h = r.pick([0.6, 0.8, 0.9, 1, 1.2, 1.5]); let x; do { x = r.int(1, d - 1); } while (!Number.isInteger(Math.round(h * x / d * 1000) / 1000 * 1000)); const y = h * x / d;
      return { html: `A straight ramp rises ${B(ds(h) + ' m')} over a horizontal distance of ${B(d + ' m')}. A vertical support is placed under the ramp ${B(x + ' m')} horizontally from the bottom of the ramp. How tall is the support? Give your answer to 2 decimal places.`, unit: 'm', ...nAns(y, { dp: 2, unit: 'm' }), format: dpFmt(2), hint: 'The small triangle under the support is similar to the whole ramp triangle.',
        steps: [`Scale factor (small to large) = ${x} ÷ ${d}`, `Support = ${ds(h)} × ${x} ÷ ${d} = ${fx(y, 4)}…`, `Support = ${B(fx(y, 2))} m`] };
    }],
  ['Similar solids: reverse problems',
    'For similar solids with length scale factor k, areas scale by k² and volumes (and masses of the same material) by k³. To go backwards, square-root an area ratio or cube-root a volume ratio to find k first.',
    (r) => {
      const t = r.int(0, 3); const k = r.pick([2, 3, 4, 1.5, 2.5]); const obj = r.pick(['bottles', 'statues', 'vases', 'boxes', 'candles']);
      if (t === 0) { const a = r.int(2, 9) * 4, h = r.int(3, 12) * 2; const A = a * k * k;
        return { html: `Two ${obj} are mathematically similar. The surface areas are ${B(a + ' cm²')} and ${B(ds(A) + ' cm²')}. The smaller one is ${B(h + ' cm')} tall. How tall is the larger one?`, unit: 'cm', ...nAns(h * k, { unit: 'cm' }), hint: 'Area scale factor = k², so k = √(area ratio).',
          steps: [`Area scale factor = ${ds(A)} ÷ ${a} = ${ds(k * k)}`, `Length scale factor = √${ds(k * k)} = ${ds(k)}`, `Height = ${h} × ${ds(k)} = ${B(ds(h * k))} cm`] }; }
      if (t === 1) { const v = r.int(2, 9) * 8, h = r.int(3, 12) * 2; const V = v * k ** 3;
        return { html: `Two ${obj} are mathematically similar. Their volumes are ${B(v + ' cm³')} and ${B(ds(V) + ' cm³')}. The larger one is ${B(ds(h * k) + ' cm')} tall. How tall is the smaller one?`, unit: 'cm', ...nAns(h, { unit: 'cm' }), hint: 'Volume scale factor = k³, so k = ∛(volume ratio).',
          steps: [`Volume scale factor = ${ds(V)} ÷ ${v} = ${ds(k ** 3)}`, `Length scale factor = ∛${ds(k ** 3)} = ${ds(k)}`, `Height = ${ds(h * k)} ÷ ${ds(k)} = ${B(h)} cm`] }; }
      if (t === 2) { const a = r.int(2, 9) * 4, v = r.int(2, 10) * 8; const A = a * k * k, V = v * k ** 3;
        return { html: `Two ${obj} are mathematically similar. The surface area of the smaller one is ${B(a + ' cm²')} and of the larger one is ${B(ds(A) + ' cm²')}. The volume of the smaller one is ${B(v + ' cm³')}. Work out the volume of the larger one.`, unit: 'cm³', ...nAns(V, { unit: 'cm³' }), hint: 'Find k from the areas, then use k³ for the volume.',
          steps: [`Area scale factor = ${ds(A)} ÷ ${a} = ${ds(k * k)}, so k = ${ds(k)}`, `Volume scale factor = ${ds(k)}<sup>3</sup> = ${ds(k ** 3)}`, `Volume = ${v} × ${ds(k ** 3)} = ${B(ds(V))} cm³`] }; }
      const m = r.int(2, 9) * 8, h = r.int(4, 15) * 2; const M = m * k ** 3; const mat = r.pick(['bronze', 'stone', 'solid wooden', 'clay']);
      return { html: `Two ${mat} statues are mathematically similar and made of the same material. The smaller statue has mass ${B(m + ' kg')} and height ${B(h + ' cm')}. The larger statue has mass ${B(ds(M) + ' kg')}. Work out the height of the larger statue.`, unit: 'cm', ...nAns(h * k, { unit: 'cm' }), hint: 'Same material, so mass scales like volume: k³.',
        steps: [`Mass (volume) scale factor = ${ds(M)} ÷ ${m} = ${ds(k ** 3)}`, `Length scale factor = ∛${ds(k ** 3)} = ${ds(k)}`, `Height = ${h} × ${ds(k)} = ${B(ds(h * k))} cm`] };
    }],
]);

// ---------------------------------------------------------------- quadratic sequences
addStyles('y10-quadratic-sequences', [
  ['Problems in context',
    'Patterns of tiles, dots or matchsticks often grow quadratically. Use the differences to find the nth term, then use it to answer the question — either substitute a pattern number, or set the nth term equal to a total and solve.',
    (r) => {
      const ctxs = [['tiles', 'Pattern'], ['dots', 'Diagram'], ['matchsticks', 'Shape'], ['counters', 'Arrangement'], ['squares', 'Design']];
      const [item, pat] = r.pick(ctxs);
      let a, b, c; do { a = r.pick([1, 1, 2, 3]); b = r.int(-1, 5); c = r.int(-2, 6); } while (a + b + c < 1 || 3 * a + b <= 0);
      const T = (n) => a * n * n + b * n + c; const ts = [1, 2, 3, 4].map(T); const nth = quad(a, b, c, 'n');
      const k = r.int(8, 25); const rev = r.chance();
      const intro = `The numbers of ${item} in the first four ${pat.toLowerCase()}s of a sequence are ${B(ts.map(ds).join(', '))}. The number of ${item} follows a quadratic sequence.`;
      const d1 = ts.slice(1).map((v, i) => v - ts[i]);
      const s0 = `First differences: ${d1.join(', ')}; second difference: ${2 * a}, so the nth term starts ${tx(coefT(a, 'n^2'))}`;
      const s1 = `Subtracting ${tx(coefT(a, 'n^2'))} leaves ${[1, 2, 3, 4].map((n) => ds(T(n) - a * n * n)).join(', ')}, which is ${tx(polyT([[b, 'n'], [c, '']]))}; nth term = ${tx(nth)}`;
      if (!rev) return { html: `${intro} How many ${item} are in ${pat} ${k}?`, ...nAns(T(k)), hint: 'Find the nth term first.', steps: [s0, s1, `${pat} ${k}: substitute <i>n</i> = ${k}: ${a === 1 ? '' : a + ' × '}${k}<sup>2</sup>${b ? (b > 0 ? ' + ' : ' − ') + (Math.abs(b) === 1 ? '' : Math.abs(b) + ' × ') + k : ''}${c ? (c > 0 ? ' + ' : ' − ') + Math.abs(c) : ''} = ${B(ds(T(k)))}`] };
      return { html: `${intro} Which ${pat.toLowerCase()} uses exactly ${B(ds(T(k)))} ${item}?`, ...nAns(k), format: 'Type the pattern number', hint: 'Find the nth term, then set it equal to the total.',
        steps: [s0, s1, `Solve ${tx(nth)} = ${ds(T(k))}: ${tx(`${quad(a, b, c - T(k), 'n')}=0`)}`, `The positive whole-number solution is <i>n</i> = ${k}, so it is ${pat} ${B(k)}`] };
    }],
]);

// ---------------------------------------------------------------- proportion
addStyles('y10-proportion', [
  ['Problems in context',
    'Decide which kind of proportion the situation describes (direct, inverse, squared). Write the equation with a constant k, find k from the given values, then use the equation to answer the question.',
    (r) => {
      const t = r.int(0, 4);
      if (t === 0) { let w1, d1, w2; do { w1 = r.int(2, 12); d1 = r.int(3, 20); w2 = r.int(2, 15); } while (w1 === w2 || (w1 * d1) % w2); const job = r.pick(['build a wall', 'paint a school', 'harvest a field', 'tile a swimming pool']);
        return { html: `It takes ${B(w1 + ' workers')} ${B(d1 + ' days')} to ${job}. The time taken is inversely proportional to the number of workers. How many days would it take ${B(w2 + ' workers')}?`, unit: 'days', ...nAns(w1 * d1 / w2, { unit: 'days' }), hint: 'Workers × days stays the same.',
          steps: [`Total work = ${w1} × ${d1} = ${w1 * d1} worker-days`, `Days = ${w1 * d1} ÷ ${w2}`, `= ${B(ds(w1 * d1 / w2))} days`] }; }
      if (t === 1) { const k = r.pick([0.005, 0.01, 0.0125, 0.02]); let v1, v2; do { v1 = 10 * r.int(2, 7); v2 = 10 * r.int(2, 8); } while (v1 === v2); const d1 = k * v1 * v1, d2 = k * v2 * v2;
        return { html: `The braking distance, <i>d</i> metres, of a car is directly proportional to the square of its speed, <i>v</i> km/h. At ${B(v1 + ' km/h')} the braking distance is ${B(ds(d1) + ' m')}. Work out the braking distance at ${B(v2 + ' km/h')}.`, unit: 'm', ...nAns(d2, { unit: 'm' }), hint: 'd = kv².',
          steps: [`<i>d</i> = <i>kv</i><sup>2</sup>: ${ds(d1)} = <i>k</i> × ${v1}<sup>2</sup>, so <i>k</i> = ${ds(k)}`, `<i>d</i> = ${ds(k)} × ${v2}<sup>2</sup>`, `<i>d</i> = ${B(ds(d2))} m`] }; }
      if (t === 2) { let d1, d2, k; do { d1 = r.int(1, 6); d2 = r.int(1, 8); k = r.pick([144, 360, 576, 720, 900, 1440, 3600]); } while (d1 === d2 || (k / (d1 * d1)) % 1 || (k / (d2 * d2)) % 0.25); const I1 = k / (d1 * d1), I2 = k / (d2 * d2);
        return { html: `The brightness, <i>B</i>, of light from a lamp is inversely proportional to the square of the distance, <i>d</i> metres, from the lamp. At ${B(d1 + ' m')} the brightness is ${B(ds(I1) + ' units')}. Work out the brightness at ${B(d2 + ' m')}.`, unit: 'units', ...nAns(I2, { unit: 'units' }), hint: 'B = k/d².',
          steps: [`<i>B</i> = ${frac('<i>k</i>', '<i>d</i><sup>2</sup>')}: <i>k</i> = ${ds(I1)} × ${d1}<sup>2</sup> = ${k}`, `<i>B</i> = ${k} ÷ ${d2}<sup>2</sup> = ${k} ÷ ${d2 * d2}`, `<i>B</i> = ${B(ds(I2))}`] }; }
      if (t === 3) { const p = r.pick([1.2, 1.5, 2.4, 3.5, 4.8, 6.5]); const m1 = r.pick([250, 400, 500, 750]), m2 = r.pick([1, 1.5, 2, 2.5, 3]) * 1000; const c1 = p * m1 / 1000, c2 = p * m2 / 1000; const food = r.pick(['cheese', 'coffee beans', 'mixed nuts', 'olives']);
        return { html: `The cost of ${food} is directly proportional to its mass. ${B(m1 + ' g')} costs ${B(money(c1))}. How much does ${B(ds(m2 / 1000) + ' kg')} cost?`, ...nAns(c2, { money: true }), format: 'Give your answer in pounds', hint: 'Convert kg to g, then find the cost per gram or use the multiplier.',
          steps: [`${ds(m2 / 1000)} kg = ${ds(m2)} g`, `Multiplier = ${ds(m2)} ÷ ${m1} = ${ds(m2 / m1)}`, `Cost = ${money(c1)} × ${ds(m2 / m1)} = ${B(money(c2))}`] }; }
      let s1, t1, s2; do { s1 = 10 * r.int(3, 12); t1 = r.int(2, 9) / 2; s2 = 10 * r.int(3, 12); } while (s1 === s2 || ((s1 * t1 * 60) / s2) % 1); const T2 = s1 * t1 / s2; const trip = r.pick(['coach', 'train', 'family car', 'delivery van']);
      return { html: `A ${trip} journey takes ${B(ds(t1) + ' hours')} at an average speed of ${B(s1 + ' km/h')}. The time is inversely proportional to the speed. How many ${B('minutes')} would the same journey take at ${B(s2 + ' km/h')}?`, unit: 'minutes', ...nAns(T2 * 60, { unit: 'minutes' }), hint: 'Speed × time stays the same (it is the distance).',
        steps: [`Distance = ${s1} × ${ds(t1)} = ${ds(s1 * t1)} km`, `Time = ${ds(s1 * t1)} ÷ ${s2} hours = ${ds(s1 * t1)} ÷ ${s2} × 60 minutes`, `= ${B(ds(T2 * 60))} minutes`] };
    }],
]);

// ---------------------------------------------------------------- tree diagrams
const e10Tree = (labels, p1, p2) => treeSvg([fx(p1, 1), fx(1 - p1, 1)], [[fx(p2, 1), fx(1 - p2, 1)], [fx(p2, 1), fx(1 - p2, 1)]], labels);
addStyles('y10-tree-diagrams', [
  ['Problems in context',
    'Put the probabilities on a tree diagram. Multiply along the branches for “and”, add the routes you need for “or”. To estimate how many times something happens, multiply the probability by the number of trials.',
    (r) => {
      const ctx = r.pick([
        { a: 'the bus is late', b: 'the train is late', A: ['Bus late', 'On time'], B: ['Late', 'On time'], days: 'days' },
        { a: 'the first traffic light is red', b: 'the second traffic light is red', A: ['Red', 'Not red'], B: ['Red', 'Not red'], days: 'journeys' },
        { a: 'Jo scores her penalty', b: 'Kim scores her penalty', A: ['Scores', 'Misses'], B: ['Scores', 'Misses'], days: 'matches' },
        { a: 'a tomato seed germinates', b: 'a pepper seed germinates', A: ['Grows', 'Fails'], B: ['Grows', 'Fails'], days: 'trays' },
        { a: 'the school canteen has pizza', b: 'it has chips', A: ['Pizza', 'No pizza'], B: ['Chips', 'No chips'], days: 'school days' },
      ]);
      const p1 = r.int(1, 9) / 10, p2 = r.int(1, 9) / 10; const ask = r.int(0, 3); const N = r.pick([50, 100, 200, 300]); const expect = r.chance(0.4);
      const P = [p1 * p2, (1 - p1) * (1 - p2), p1 * (1 - p2) + (1 - p1) * p2, 1 - (1 - p1) * (1 - p2)][ask];
      const words = ['both happen', 'neither happens', 'exactly one of them happens', 'at least one of them happens'][ask];
      const st = [`P(both) = ${ds(p1)} × ${ds(p2)} = ${ds(rnd(P, 6))}`, `P(neither) = ${ds(1 - p1)} × ${ds(1 - p2)} = ${ds(rnd(P, 6))}`, `P(exactly one) = ${ds(p1)} × ${ds(rnd(1 - p2, 2))} + ${ds(rnd(1 - p1, 2))} × ${ds(p2)} = ${ds(rnd(P, 6))}`, `P(at least one) = 1 − P(neither) = 1 − ${ds(rnd(1 - p1, 2))} × ${ds(rnd(1 - p2, 2))} = ${ds(rnd(P, 6))}`][ask];
      const head = `The probability that ${ctx.a} is ${B(ds(p1))}. The probability that ${ctx.b} is ${B(ds(p2))}. The two events are independent.`;
      const diagram = e10Tree([ctx.A, ctx.B], p1, p2);
      if (expect) { const E = rnd(P * N, 6);
        return { html: `${head} Over ${B(N)} ${ctx.days}, estimate the number of ${ctx.days} on which ${words}.`, diagram, ...nAns(E), hint: 'Find the probability, then multiply by the number of trials.', steps: [`Probability ${words.replace('happens', 'happen').replace('them happen', 'them happens')}:`, st, `Expected number = ${ds(rnd(P, 6))} × ${N} = ${B(ds(E))}`] }; }
      return { html: `${head} Work out the probability that ${words}. Give your answer as a decimal.`, diagram, ...nAns(rnd(P, 6)), format: 'Type a decimal, e.g. 0.42', hint: ask >= 2 ? 'Add the probabilities of the routes you need.' : 'Multiply along the branches.', steps: ['Draw a tree diagram: each pair of branches adds to 1.', st, `Answer: ${B(ds(rnd(P, 6)))}`] };
    }],
  ['Without replacement',
    'If an item is not replaced, the second pick has one fewer item in total — and one fewer of the colour already taken. Update the fractions on the second branches, then multiply along and add the routes you need.',
    (r) => {
      const ctx = r.pick([
        { bag: 'A bag contains', items: ['red sweets', 'green sweets'], N: ['red', 'green'], one: 'a red sweet', same: 'the same colour', A: ['Red', 'Green'], act: 'takes a sweet at random and eats it, then takes another sweet' },
        { bag: 'A drawer contains', items: ['black socks', 'white socks'], N: ['black', 'white'], one: 'a black sock', same: 'the same colour', A: ['Black', 'White'], act: 'takes out a sock at random, then another sock without putting the first back' },
        { bag: 'A box contains', items: ['blue pens', 'black pens'], N: ['blue', 'black'], one: 'a blue pen', same: 'the same colour', A: ['Blue', 'Black'], act: 'takes a pen at random and keeps it, then takes another pen' },
        { bag: 'A club has', items: ['boys', 'girls'], N: ['boy', 'girl'], one: 'a boy', same: 'both boys or both girls', A: ['Boy', 'Girl'], act: 'chooses one member at random to be captain, then another to be vice-captain' },
        { bag: 'A jar contains', items: ['strawberry chews', 'lemon chews'], N: ['strawberry', 'lemon'], one: 'a strawberry chew', same: 'the same flavour', A: ['Straw.', 'Lemon'], act: 'takes a chew at random and eats it, then takes another' },
      ]);
      const a = r.int(2, 9), b = r.int(2, 9); const n = a + b; const nm = e10Pick(r, e10Names); const ask = r.int(0, 3);
      const N = [a * (a - 1) + b * (b - 1), 2 * a * b, a * (a - 1), n * (n - 1) - b * (b - 1)][ask]; const D = n * (n - 1);
            const words = [ctx.same.startsWith('both') ? `they are ${ctx.same}` : `both are ${ctx.same}`, `one of each ${ctx.same.startsWith('both') ? 'gender' : ctx.same.replace('the same ', '')} is chosen`, `both are ${ctx.items[0]}`, `at least one is ${ctx.one}`][ask];
      const diagram = treeSvg([`${a}/${n}`, `${b}/${n}`], [[`${a - 1}/${n - 1}`, `${b}/${n - 1}`], [`${a}/${n - 1}`, `${b - 1}/${n - 1}`]], [ctx.A, ctx.A]);
      const pAA = `${frac(a, n)} × ${frac(a - 1, n - 1)} = ${frac(a * (a - 1), D)}`, pBB = `${frac(b, n)} × ${frac(b - 1, n - 1)} = ${frac(b * (b - 1), D)}`, pAB = `${frac(a, n)} × ${frac(b, n - 1)} = ${frac(a * b, D)}`;
      const [X, Y] = ctx.N; const st = [[`P(both ${X}) = ${pAA}`, `P(both ${Y}) = ${pBB}`, `Add: ${frS(N, D)}`],
        [`P(${X} then ${Y}) = ${pAB}`, `P(${Y} then ${X}) = ${frac(b, n)} × ${frac(a, n - 1)} = ${frac(a * b, D)}`, `Add: ${frS(N, D)}`],
        [`P(${X} then ${X}) = ${frac(a, n)} × ${frac(a - 1, n - 1)}`, `= ${frS(N, D)}`],
        [`P(no ${X}) = P(${Y} then ${Y}) = ${pBB}`, `P(at least one) = 1 − ${frac(b * (b - 1), D)} = ${frS(N, D)}`]][ask];
      return { html: `${ctx.bag} ${B(a)} ${ctx.items[0]} and ${B(b)} ${ctx.items[1]}. ${nm} ${ctx.act}. Work out the probability that ${words}.`, diagram, ...fAns(N, D), hint: `On the second pick there are only ${n - 1} left.`,
        steps: [`First pick out of ${n}; second pick out of ${n - 1}.`, ...st] };
    }],
]);

// ---------------------------------------------------------------- grouped data
addStyles('y10-grouped-data', [
  ['Problems in context',
    'Grouped data questions in context may ask for an estimate of the mean, an estimate of the total, or how many values lie above or below a class boundary. Use midpoints for estimates and add frequencies for counts.',
    (r) => {
      const ctx = r.pick([
        { who: 'runners in a 5 km fun run', v: 't', head: 'Time (<i>t</i> minutes)', w: 5, s: [20, 25], u: 'minutes', tot: 'total time taken by all the runners', noun: 'runners', more: (b) => `took more than ${b} minutes` },
        { who: 'parcels at a post office', v: 'm', head: 'Mass (<i>m</i> kg)', w: 2, s: [0, 2], u: 'kg', tot: 'total mass of all the parcels', noun: 'parcels', more: (b) => `weighed more than ${b} kg` },
        { who: 'sunflowers in a garden', v: 'h', head: 'Height (<i>h</i> cm)', w: 20, s: [100, 120], u: 'cm', tot: 'total height of all the sunflowers', noun: 'sunflowers', more: (b) => `were taller than ${b} cm` },
        { who: 'students’ journeys to school', v: 't', head: 'Time (<i>t</i> minutes)', w: 10, s: [0, 10], u: 'minutes', tot: 'total time spent travelling by all the students', noun: 'students', more: (b) => `took more than ${b} minutes to get to school` },
        { who: 'customers in a shop', v: 'x', head: 'Amount spent (£<i>x</i>)', w: 10, s: [0, 10, 20], u: 'pounds', tot: 'total amount spent by all the customers', noun: 'customers', more: (b) => `spent more than £${b}` },
      ]);
      const k = r.int(4, 5); const st0 = r.pick(ctx.s); const fs = Array.from({ length: k }, () => r.int(2, 18)); const cls = fs.map((f, i) => [st0 + i * ctx.w, st0 + (i + 1) * ctx.w]);
      const tbl = table([[ctx.head, 'Frequency'], ...cls.map(([a, b], i) => [`${a} &lt; <i>${ctx.v}</i> ≤ ${b}`, fs[i]])]);
      const mids = cls.map(([a, b]) => (a + b) / 2); const F = sum(fs), FX = sum(mids.map((m, i) => m * fs[i]));
      const ask = r.int(0, 3); const intro = `The table gives information about the ${ctx.who}.${tbl}`;
      const fxStep = `Midpoints × frequencies: ${mids.map((m, i) => `${ds(m)} × ${fs[i]}`).join(' + ')} = ${ds(FX)}`;
      if (ask === 0) return { html: `${intro}Work out an estimate for the mean. Give your answer to 1 decimal place.`, ...nAns(FX / F, { dp: 1 }), format: dpFmt(1), hint: 'Use the midpoint of each class.', steps: [fxStep, `Total frequency = ${F}`, `Mean ≈ ${ds(FX)} ÷ ${F} = ${fx(FX / F, 3)}… = ${B(r1(FX / F))}`] };
      if (ask === 1) return { html: `${intro}Work out an estimate for the ${ctx.tot}.`, ...nAns(FX), hint: 'Multiply each midpoint by its frequency and add.', steps: ['Use the midpoint of each class as an estimate for every value in it.', fxStep, `Estimated total = ${B(ds(FX))} ${ctx.u}`] };
      const j = r.int(1, k - 1); const bnd = cls[j][0]; const above = sum(fs.slice(j));
      if (ask === 2) return { html: `${intro}How many of the ${ctx.noun} ${ctx.more(bnd)}?`, ...nAns(above), format: 'Type a whole number', hint: `Add the frequencies of the classes above ${bnd}.`, steps: [`The classes above ${bnd} are ${cls.slice(j).map(([a, b]) => `${a}–${b}`).join(', ')}.`, `Add their frequencies: ${fs.slice(j).length > 1 ? fs.slice(j).join(' + ') + ' = ' : ''}${B(above)}`] };
      const pct = above / F * 100;
      return { html: `${intro}What percentage of the ${ctx.noun} ${ctx.more(bnd)}? Give your answer to 1 decimal place.`, unit: '%', ...nAns(pct, { dp: 1, unit: '%' }), format: dpFmt(1), hint: 'Count those above the boundary, then divide by the total frequency.', steps: [`Number above ${bnd}: ${fs.slice(j).join(' + ')} = ${above}`, `Total = ${F}`, `${above} ÷ ${F} × 100 = ${fx(pct, 3)}… = ${B(r1(pct))}%`] };
    }],
]);

}

// ---- fragment exam11.js ----
{
// ===== exam11: exam-style / problem-solving styles for every Year 11 topic =====
const e11Brg = (b) => `${String(((Math.round(b) % 360) + 360) % 360).padStart(3, '0')}°`;
const e11Sf = (x, k) => Number(x.toPrecision(k));
const e11Fr = (n, d) => (gcd(n, d) > 1 || d < 0 ? `${frac(ds(n), ds(d))} = ${fracS(n, d)}` : fracN(n, d));
// recurring decimal I.N(R recurring): returns value as num/den plus display strings and a conversion step
function e11Rec(I, N, Rr) {
  const m = N.length, k = Rr.length; const hi = 10 ** (m + k), lo = 10 ** m;
  const big = Number(`${I}${N}${Rr}`), small = Number(`${I}${N}`);
  const num = big - small, den = hi - lo; const tail = Rr.repeat(k === 1 ? 4 : 3) + '…';
  const disp = `${I}.${N}${recur(Rr)}`, long = `${I}.${N}${tail}`;
  const step = `Let <i>x</i> = ${long}. Then ${hi}<i>x</i> = ${big}.${tail} and ${m ? `${lo}<i>x</i> = ${small}.${tail}` : `<i>x</i> = ${long}`}. Subtract: ${den}<i>x</i> = ${num}, so <i>x</i> = ${e11Fr(num, den)}`;
  return { num, den, disp, long, step };
}
const e11Dig2 = (r) => { let a, b; do { a = r.int(0, 9); b = r.int(0, 9); } while (a === b || (a === 0 && b === 0)); return `${a}${b}`; };

// ---------------------------------------------------------------- recurring decimals
addStyles('y11-recurring-decimals', [
  ['Exam-style problem',
    'Convert each recurring decimal to a fraction first (let x = the decimal, multiply by a power of 10 so the recurring parts line up, then subtract). Then do the arithmetic with the fractions and simplify.',
    (r) => {
      const t = r.int(0, 4);
      if (t === 0) {
        const A = e11Rec(0, '', String(r.int(1, 8))), Bq = e11Rec(0, '', e11Dig2(r));
        const num = A.num * 11 + Bq.num; const add = `${frac(A.num * 11, 99)} + ${frac(Bq.num, 99)}`;
        return { html: `Work out ${B(`${A.disp} + ${Bq.disp}`)}.<br>Give your answer as a fraction in its simplest form.`, ...fAns(num, 99), hint: 'Write each decimal as a fraction, then use a common denominator of 99.',
          steps: [`First decimal: ${A.step}`, `Second decimal: ${Bq.step}`, `Use a denominator of 99: ${add} = ${frac(num, 99)}`, `Simplest form: ${B(fracS(num, 99))}`] };
      }
      if (t === 1) {
        let A, c; do { const d = r.int(1, 9); let R0; do { R0 = r.int(0, 9); } while (R0 === d); A = e11Rec(0, String(d), String(R0)); c = r.int(1, 8); } while (A.num - 10 * c <= 0);
        const C = e11Rec(0, '', String(c)); const num = A.num - 10 * c;
        return { html: `Work out ${B(`${A.disp} − ${C.disp}`)}.<br>Give your answer as a fraction in its simplest form.`, ...fAns(num, 90), hint: 'Convert both decimals to fractions, then use a common denominator of 90.',
          steps: [`First decimal: ${A.step}`, `Second decimal: ${C.step}`, `Common denominator 90: ${frac(A.num, 90)} − ${frac(10 * c, 90)} = ${frac(num, 90)}`, `Simplest form: ${B(fracS(num, 90))}`] };
      }
      if (t === 2) {
        const I = r.int(1, 4), d = r.int(0, 9); let R0; do { R0 = r.int(1, 8); } while (R0 === d);
        const A = e11Rec(I, String(d), String(R0));
        return { html: `A length is measured as ${B(A.disp + ' m')}. Write ${B(A.disp)} as a fraction in its simplest form.<br>You may give an improper fraction or a mixed number.`, ...fAns(A.num, A.den), format: 'Type a fraction, e.g. 13/6 or 2 1/6', hint: 'Use 100x and 10x so that the recurring parts line up.',
          steps: [A.step, `Simplest form: ${B(fracS(A.num, A.den))}`] };
      }
      if (t === 3) {
        const A = e11Rec(0, '', e11Dig2(r)); const n = r.pick([2, 3, 4, 5, 6, 9, 11, 12, 18, 22, 33]);
        const ctx = r.pick([`A tin holds ${A.disp} kg of paint. Work out the total mass of paint, in kg, in ${B(n)} tins.`, `Work out ${B(`${A.disp} × ${n}`)}.`, `A machine adds ${A.disp} ml of syrup to each drink. How much syrup, in ml, is added to ${B(n)} drinks?`]);
        return { html: `${ctx}<br>Give your answer as a fraction in its simplest form (or a whole number).`, ...fAns(A.num * n, 99), hint: 'Write the recurring decimal as a fraction over 99 first.',
          steps: [A.step, `Multiply: ${frac(A.num, 99)} × ${n} = ${frac(A.num * n, 99)}`, `Simplest form: ${B(fracS(A.num * n, 99))}`] };
      }
      const two = r.chance(0.4); const d = r.int(1, 9);
      let Rr; do { Rr = two ? e11Dig2(r) : String(r.int(0, 9)); } while (Rr[Rr.length - 1] === String(d) || Rr === '00');
      const A = e11Rec(0, String(d), Rr); const [p, q] = simp(A.num, A.den);
      return { html: `${B(A.disp)} can be written as the fraction ${frac('<i>p</i>', '<i>q</i>')} in its simplest form, where <i>p</i> and <i>q</i> are whole numbers.<br>Work out the value of ${B('<i>p</i> + <i>q</i>')}.`, answerLabel: 'p + q =', ...nAns(p + q), hint: `Multiply by ${10 ** (1 + Rr.length)} and by 10, then subtract.`,
        steps: [A.step, `So <i>p</i> = ${p} and <i>q</i> = ${q}`, `<i>p</i> + <i>q</i> = ${p} + ${q} = ${B(p + q)}`] };
    }],
]);

// ---------------------------------------------------------------- bounds
addStyles('y11-bounds', [
  ['Problems in context',
    'Write down the bounds of every measurement first. Then decide which bound of each value gives the biggest (or smallest) result, and think about what the question needs: “definitely enough” means use the worst case, then round in the safe direction.',
    (r) => {
      const t = r.int(0, 5);
      if (t === 0) {
        const L = r.int(25, 90), W = r.int(12, 60), P = r.pick([2, 2.5, 3, 1.8]); const per = 2 * (L + W + 1); const n = Math.ceil(rnd(per / P, 9));
        return { html: `A rectangular paddock is ${B(L + ' m')} long and ${B(W + ' m')} wide, both measured to the nearest metre. Fencing is sold in panels that are exactly ${B(ds(P) + ' m')} long.<br>How many panels must be bought to be certain of having enough to go all the way round the paddock?`, unit: 'panels', ...nAns(n), hint: 'Use the upper bounds of the length and width.',
          steps: [`Upper bounds: length ${ds(L + 0.5)} m, width ${ds(W + 0.5)} m`, `Upper bound of perimeter = 2 × (${ds(L + 0.5)} + ${ds(W + 0.5)}) = ${ds(per)} m`, `${ds(per)} ÷ ${ds(P)} = ${ds(rnd(per / P, 3))}`, `Round up to be sure of enough: ${B(n)} panels`] };
      }
      if (t === 1) {
        const S = r.int(80, 160), w = r.int(18, 45) / 10; const n = Math.floor(rnd((S - 0.5) / (w + 0.05), 9));
        return { html: `A shelf is ${B(S + ' cm')} long, measured to the nearest centimetre. Each box file is ${B(ds(w) + ' cm')} wide, measured to the nearest millimetre.<br>What is the greatest number of box files that will ${B('definitely')} fit side by side on the shelf?`, unit: 'files', ...nAns(n), hint: 'Smallest possible shelf ÷ widest possible file.',
          steps: [`Lower bound of shelf = ${ds(S - 0.5)} cm; upper bound of each file = ${ds(rnd(w + 0.05, 2))} cm`, `${ds(S - 0.5)} ÷ ${ds(rnd(w + 0.05, 2))} = ${fx((S - 0.5) / (w + 0.05), 3)}…`, `Round down (a part file does not count): ${B(n)} files`] };
      }
      if (t === 2) {
        const D = r.int(40, 250), S = 5 * r.int(12, 36); const T = (D + 0.5) / (S - 2.5) * 60;
        return { html: `A train travels ${B(D + ' km')}, correct to the nearest km, at an average speed of ${B(S + ' km/h')}, correct to the nearest 5 km/h.<br>Work out the upper bound for the time taken, in minutes. Give your answer to 1 decimal place.`, unit: 'minutes', ...nAns(T, { dp: 1, unit: 'minutes' }), format: dpFmt(1), hint: 'Time = distance ÷ speed: largest distance ÷ smallest speed.',
          steps: [`Upper bound of distance = ${ds(D + 0.5)} km; lower bound of speed = ${ds(S - 2.5)} km/h`, `Upper bound of time = ${ds(D + 0.5)} ÷ ${ds(S - 2.5)} = ${fx((D + 0.5) / (S - 2.5), 5)}… hours`, `× 60 = ${fx(T, 3)}… minutes`, `= ${B(r1(T))} minutes`] };
      }
      if (t === 3) {
        const V = r.int(20, 120), m = 10 * Math.round(V * r.int(25, 110) / 100); const d = (m - 5) / (V + 0.5);
        const mat = r.pick(['metal block', 'piece of stone', 'brass weight', 'glass paperweight']);
        return { html: `A ${mat} has a mass of ${B(m + ' g')}, correct to the nearest 10 g, and a volume of ${B(V + ' cm³')}, correct to the nearest cm³.<br>Work out the lower bound for its density. Give your answer to 2 decimal places.`, unit: 'g/cm³', ...nAns(d, { dp: 2, unit: 'g/cm³' }), format: dpFmt(2), hint: 'Density = mass ÷ volume: smallest mass ÷ largest volume.',
          steps: [`Lower bound of mass = ${m - 5} g; upper bound of volume = ${ds(V + 0.5)} cm³`, `Lower bound of density = ${m - 5} ÷ ${ds(V + 0.5)}`, `= ${fx(d, 4)}… = ${B(r2(d))} g/cm³`] };
      }
      if (t === 4) {
        const A = 10 * r.int(5, 90); const s = Math.sqrt(A + 5);
        const what = r.pick(['square tile', 'square patio', 'square window', 'square rug']);
        return { html: `The area of a ${what} is ${B(A + ' cm²')}, correct to the nearest 10 cm².<br>Work out the upper bound for the length of one side of the ${what.split(' ')[1]}. Give your answer to 2 decimal places.`, unit: 'cm', ...nAns(s, { dp: 2, unit: 'cm' }), format: dpFmt(2), hint: 'Find the upper bound of the area, then square root it.',
          steps: [`Upper bound of area = ${A} + 5 = ${A + 5} cm²`, `Side = ${sq(A + 5)} = ${fx(s, 4)}…`, `Upper bound of side = ${B(r2(s))} cm`] };
      }
      const L = 10 * r.int(50, 120), M = r.int(18, 45); const n = Math.floor(rnd((L - 5) / (M + 0.5), 9));
      return { html: `A goods lift has a maximum safe load of ${B(L + ' kg')}, correct to the nearest 10 kg. Each crate has a mass of ${B(M + ' kg')}, correct to the nearest kg.<br>What is the greatest number of crates that can be put in the lift so that the load is ${B('definitely')} safe?`, unit: 'crates', ...nAns(n), hint: 'Lowest possible safe load ÷ heaviest possible crate.',
        steps: [`Lower bound of safe load = ${L - 5} kg; upper bound of a crate = ${ds(M + 0.5)} kg`, `${L - 5} ÷ ${ds(M + 0.5)} = ${fx((L - 5) / (M + 0.5), 3)}…`, `Round down: ${B(n)} crates`] };
    }],
  ['Exam-style: bounds in formulas',
    'For a subtraction a − b, the upper bound is upper a − LOWER b. For a division a ÷ b, the upper bound is upper a ÷ LOWER b. When asked for a “suitable degree of accuracy”, round both bounds and give the value they agree on.',
    (r) => {
      const t = r.int(0, 4);
      if (t === 0) {
        let P, Q; do { P = r.int(150, 300) / 10; Q = r.int(30, 200) / 10; } while (P - Q < 2);
        const up = r.chance(); const v = rnd(up ? P - Q + 0.1 : P - Q - 0.1, 4); const item = r.pick(['sand', 'compost', 'flour', 'rice']);
        return { html: `A sack of ${item} has a mass of ${B(ds(P) + ' kg')}. Some ${item} is used and the sack then has a mass of ${B(ds(Q) + ' kg')}. Both masses are correct to 1 decimal place.<br>Work out the ${B(up ? 'upper' : 'lower')} bound for the mass of ${item} that was used.`, unit: 'kg', ...nAns(v, { unit: 'kg' }), hint: up ? 'Largest start − smallest finish.' : 'Smallest start − largest finish.',
          steps: [`Bounds: ${ds(rnd(P - 0.05, 2))} ≤ start &lt; ${ds(rnd(P + 0.05, 2))}, ${ds(rnd(Q - 0.05, 2))} ≤ finish &lt; ${ds(rnd(Q + 0.05, 2))}`, up ? `Upper bound used = ${ds(rnd(P + 0.05, 2))} − ${ds(rnd(Q - 0.05, 2))}` : `Lower bound used = ${ds(rnd(P - 0.05, 2))} − ${ds(rnd(Q + 0.05, 2))}`, `= ${B(ds(v))} kg`] };
      }
      if (t === 1) {
        const v = r.int(15, 40), u = r.int(2, 12), T = r.int(20, 99) / 10; const up = r.chance();
        const a = up ? (v + 0.5 - (u - 0.5)) / (T - 0.05) : (v - 0.5 - (u + 0.5)) / (T + 0.05);
        return { html: `The acceleration of a car is given by ${B(`<i>a</i> = ${frac('<i>v</i> − <i>u</i>', '<i>t</i>')}`)}.<br><i>v</i> = ${B(v)} m/s and <i>u</i> = ${B(u)} m/s, both correct to the nearest whole number; <i>t</i> = ${B(ds(T))} s, correct to 1 decimal place.<br>Work out the ${B(up ? 'upper' : 'lower')} bound for <i>a</i>. Give your answer to 2 decimal places.`, answerLabel: 'a =', unit: 'm/s²', ...nAns(a, { dp: 2, unit: 'm/s²' }), format: dpFmt(2), hint: up ? 'Make the top as big as possible and the bottom as small as possible.' : 'Make the top as small as possible and the bottom as big as possible.',
          steps: [`Bounds: <i>v</i> ${ds(v - 0.5)} to ${ds(v + 0.5)}, <i>u</i> ${ds(u - 0.5)} to ${ds(u + 0.5)}, <i>t</i> ${ds(rnd(T - 0.05, 2))} to ${ds(rnd(T + 0.05, 2))}`, up ? `Largest <i>v</i> − <i>u</i> = ${ds(v + 0.5)} − ${ds(u - 0.5)} = ${v - u + 1}` : `Smallest <i>v</i> − <i>u</i> = ${ds(v - 0.5)} − ${ds(u + 0.5)} = ${v - u - 1}`, `<i>a</i> = ${up ? v - u + 1 : v - u - 1} ÷ ${ds(rnd(up ? T - 0.05 : T + 0.05, 2))} = ${fx(a, 4)}…`, `${up ? 'Upper' : 'Lower'} bound = ${B(r2(a))} m/s²`] };
      }
      if (t === 2) {
        const R0 = r.int(5, 40); const d = Math.PI * ((R0 + 0.5) ** 2 - (R0 - 0.5) ** 2); const obj = r.pick(['circular pond', 'circular table top', 'circular flower bed', 'circular mat']);
        return { html: `The radius of a ${obj} is ${B(R0 + ' cm')}, correct to the nearest centimetre.<br>Work out the difference between the upper bound and the lower bound of its area. Give your answer to 1 decimal place.`, unit: 'cm²', ...nAns(d, { dp: 1, unit: 'cm²' }), format: dpFmt(1), hint: 'Find both bounds of the area using πr², then subtract.',
          steps: [`Radius bounds: ${ds(R0 - 0.5)} cm and ${ds(R0 + 0.5)} cm`, `Upper bound of area = π × ${ds(R0 + 0.5)}<sup>2</sup> = ${fx(Math.PI * (R0 + 0.5) ** 2, 3)}… cm²`, `Lower bound of area = π × ${ds(R0 - 0.5)}<sup>2</sup> = ${fx(Math.PI * (R0 - 0.5) ** 2, 3)}… cm²`, `Difference = ${fx(d, 3)}… = ${B(r1(d))} cm²`] };
      }
      if (t === 3) {
        let lo, hi, k, D, T, sp; do { D = r.int(100, 400); T = r.int(120, 650) / 10; lo = (D - 0.5) / (T + 0.05); hi = (D + 0.5) / (T - 0.05); k = [3, 2, 1].find((j) => e11Sf(lo, j) === e11Sf(hi, j)) || 0; sp = r.pick(['A runner', 'A cyclist', 'A swimmer']); } while (k < 2 || hi > 20);
        const v = e11Sf(hi, k);
        return { html: `${sp} travels ${B(D + ' m')}, correct to the nearest metre, in ${B(ds(T) + ' s')}, correct to 1 decimal place.<br>By considering bounds, work out the average speed to a suitable degree of accuracy. Give a reason for your choice in your working.`, unit: 'm/s', ...nAns(v, { unit: 'm/s' }), format: 'Type the speed, rounded to the accuracy both bounds agree on', hint: 'Work out both bounds, then round them until they agree.',
          steps: [`Upper bound = ${ds(D + 0.5)} ÷ ${ds(rnd(T - 0.05, 2))} = ${fx(hi, 5)}…`, `Lower bound = ${ds(D - 0.5)} ÷ ${ds(rnd(T + 0.05, 2))} = ${fx(lo, 5)}…`, `Both bounds round to ${ds(v)} to ${k} significant figures${k < 3 ? ` (but not to ${k + 1} s.f.)` : ''}`, `Speed = ${B(ds(v))} m/s`] };
      }
      const V = 10 * r.int(30, 200), T = r.int(8, 45); const up = r.chance(); const v = up ? (V + 5) / (T - 0.5) : (V - 5) / (T + 0.5);
      return { html: `A tank is filled with ${B(V + ' litres')} of water, correct to the nearest 10 litres. It takes ${B(T + ' minutes')}, correct to the nearest minute.<br>Work out the ${B(up ? 'upper' : 'lower')} bound for the rate of flow in litres per minute. Give your answer to 2 decimal places.`, unit: 'litres/min', ...nAns(v, { dp: 2, unit: 'litres/min' }), format: dpFmt(2), hint: 'Rate = volume ÷ time.',
        steps: [`Volume bounds: ${V - 5} to ${V + 5} litres; time bounds: ${ds(T - 0.5)} to ${ds(T + 0.5)} minutes`, up ? `Upper bound = ${V + 5} ÷ ${ds(T - 0.5)}` : `Lower bound = ${V - 5} ÷ ${ds(T + 0.5)}`, `= ${fx(v, 4)}… = ${B(r2(v))} litres per minute`] };
    }],
]);

// ---------------------------------------------------------------- quadratic formula
const e11NotSq = (D) => D > 0 && !Number.isInteger(Math.sqrt(D));
addStyles('y11-quadratic-formula', [
  ['Problems in context',
    'Form an equation from the information, rearrange it into the form ax² + bx + c = 0, then use the quadratic formula. A length or a time cannot be negative, so reject the negative solution.',
    (r) => {
      const t = r.int(0, 4);
      if (t === 0) {
        let k, A; do { k = r.int(2, 9); A = r.int(20, 150); } while (!e11NotSq(k * k + 4 * A)); const x = (-k + Math.sqrt(k * k + 4 * A)) / 2; const askL = r.chance();
        const v = askL ? x + k : x; const obj = r.pick(['rectangular garden', 'rectangular poster', 'rectangular rug', 'rectangular car park']); const u = obj.includes('garden') || obj.includes('car') ? 'm' : 'cm';
        return { html: `The length of a ${obj} is ${B(k + ' ' + u)} more than its width. The area is ${B(A + ' ' + u + '²')}.<br>Work out the ${askL ? 'length' : 'width'} of the ${obj.split(' ')[1]}. Give your answer to 2 decimal places.`, unit: u, ...nAns(v, { dp: 2, unit: u }), format: dpFmt(2), hint: `Let the width be x, so the length is x + ${k}.`,
          steps: [`Width = <i>x</i>, length = <i>x</i> + ${k}: <i>x</i>(<i>x</i> + ${k}) = ${A}`, `${tx(`${quad(1, k, -A)}=0`)}`, `<i>x</i> = ${frac(`−${k} ± ${sq(`${k}<sup>2</sup> + 4 × ${A}`)}`, 2)} = ${frac(`−${k} ± ${sq(k * k + 4 * A)}`, 2)}`, `Positive solution: <i>x</i> = ${fx(x, 4)}…`, askL ? `Length = ${fx(x, 4)}… + ${k} = ${B(r2(v))} ${u}` : `Width = ${B(r2(v))} ${u}`] };
      }
      if (t === 1) {
        const h0 = r.pick([1, 1.2, 1.5, 1.8, 2]), u = r.int(8, 25); const D = u * u + 19.6 * h0; const T = (u + Math.sqrt(D)) / 9.8;
        const who = r.pick(['A ball is thrown upwards', 'A stone is thrown into the air', 'A netball is thrown upwards', 'A rocket toy is launched']);
        return { html: `${who}. Its height, <i>h</i> metres, above the ground <i>t</i> seconds later is given by<br>${B(`<i>h</i> = ${ds(h0)} + ${u}<i>t</i> − 4.9<i>t</i><sup>2</sup>`)}<br>Work out the time it takes to hit the ground. Give your answer to 2 decimal places.`, answerLabel: 't =', unit: 's', ...nAns(T, { dp: 2, unit: 's' }), format: dpFmt(2), hint: 'It hits the ground when h = 0.',
          steps: [`At the ground <i>h</i> = 0: 4.9<i>t</i><sup>2</sup> − ${u}<i>t</i> − ${ds(h0)} = 0`, `a = 4.9, b = −${u}, c = −${ds(h0)}; b² − 4ac = ${u * u} + ${ds(rnd(19.6 * h0, 4))} = ${ds(rnd(D, 4))}`, `<i>t</i> = ${frac(`${u} ± ${sq(ds(rnd(D, 4)))}`, '9.8')}`, `Time is positive: <i>t</i> = ${fx(T, 4)}… = ${B(r2(T))} s`] };
      }
      if (t === 2) {
        let a, H; do { a = r.int(1, 7); H = r.int(8, 30); } while (!e11NotSq(8 * H * H - 4 * a * a) || H <= a + 1);
        const D = 8 * H * H - 4 * a * a; const x = (-2 * a + Math.sqrt(D)) / 4;
        return { html: `A right-angled triangle has shorter sides of length ${B('<i>x</i> cm')} and ${B(`(<i>x</i> + ${a}) cm`)}. Its hypotenuse is ${B(H + ' cm')}.<br>Work out the value of <i>x</i>. Give your answer to 2 decimal places.`, answerLabel: 'x =', unit: 'cm', ...nAns(x, { dp: 2, unit: 'cm' }), format: dpFmt(2), hint: 'Use Pythagoras to form a quadratic equation.',
          steps: [`Pythagoras: <i>x</i><sup>2</sup> + (<i>x</i> + ${a})<sup>2</sup> = ${H}<sup>2</sup>`, `${tx(`${quad(2, 2 * a, a * a - H * H)}=0`)}`, `<i>x</i> = ${frac(`−${2 * a} ± ${sq(D)}`, 4)}`, `<i>x</i> must be positive: <i>x</i> = ${fx(x, 4)}… = ${B(r2(x))} cm`] };
      }
      if (t === 3) {
        let L, W, T, D; do { L = r.int(6, 15); W = r.int(4, 10); T = L * W + r.int(10, 60); D = 4 * (L + W) ** 2 + 16 * (T - L * W); } while (!e11NotSq(D) || W >= L);
        const x = (-2 * (L + W) + Math.sqrt(D)) / 8;
        return { html: `A rectangular lawn measures ${B(L + ' m')} by ${B(W + ' m')}. A path of constant width <i>x</i> metres is laid all the way round the lawn. The total area of the lawn and path is ${B(T + ' m²')}.<br>Work out the width of the path. Give your answer to 2 decimal places.`, answerLabel: 'x =', unit: 'm', ...nAns(x, { dp: 2, unit: 'm' }), format: dpFmt(2), hint: 'The outer rectangle is (L + 2x) by (W + 2x).',
          steps: [`(${L} + 2<i>x</i>)(${W} + 2<i>x</i>) = ${T}`, `${tx(`${quad(4, 2 * (L + W), L * W)}=${T}`)}, so ${tx(`${quad(4, 2 * (L + W), L * W - T)}=0`)}`, `<i>x</i> = ${frac(`−${2 * (L + W)} ± ${sq(D)}`, 8)}`, `Positive solution: <i>x</i> = ${fx(x, 4)}… = ${B(r2(x))} m`] };
      }
      let h, S, D; do { h = r.int(2, 10); S = r.int(50, 400); D = 16 * h * h + 4 * S; } while (!e11NotSq(D));
      const x = (-4 * h + Math.sqrt(D)) / 2;
      return { html: `An open box (no lid) has a square base of side <i>x</i> cm and a height of ${B(h + ' cm')}. The total outside surface area of the box is ${B(S + ' cm²')}.<br>Work out the value of <i>x</i>. Give your answer to 2 decimal places.`, answerLabel: 'x =', unit: 'cm', ...nAns(x, { dp: 2, unit: 'cm' }), format: dpFmt(2), hint: 'Surface area = base + 4 sides = x² + 4 × x × height.',
        steps: [`Base area <i>x</i><sup>2</sup>, four sides each ${h}<i>x</i>: ${tx(`x^2+${4 * h}x=${S}`)}`, `${tx(`${quad(1, 4 * h, -S)}=0`)}`, `<i>x</i> = ${frac(`−${4 * h} ± ${sq(D)}`, 2)}`, `Positive solution: <i>x</i> = ${fx(x, 4)}… = ${B(r2(x))} cm`] };
    }],
  ['Reasoning with b² − 4ac',
    'The part under the square root, b² − 4ac, decides how many solutions there are: positive → two solutions, zero → one (repeated) solution, negative → no real solutions. Use this to reason about unknown coefficients.',
    (r) => {
      const t = r.int(0, 3);
      if (t === 0) {
        let a, b, c; const mode = r.int(0, 2);
        if (mode === 0) { const m = r.nz(-5, 5); a = r.pick([1, 4]); b = a === 1 ? 2 * m : 4 * m; c = m * m; }
        else { a = r.int(1, 4); b = r.int(-9, 9); c = mode === 1 ? r.int(Math.floor(b * b / (4 * a)) + 1, Math.floor(b * b / (4 * a)) + 12) : r.nz(-10, Math.max(1, Math.floor(b * b / (4 * a)) - 1)); if (b * b - 4 * a * c === 0) c += 1; }
        const D = b * b - 4 * a * c; const n = D > 0 ? 2 : D === 0 ? 1 : 0;
        return { html: `How many real solutions does the equation ${B(tx(`${quad(a, b, c)}=0`))} have?`, ...nAns(n), format: 'Type 0, 1 or 2', hint: 'Work out b² − 4ac.',
          steps: [`a = ${a}, b = ${ds(b)}, c = ${ds(c)}`, `b² − 4ac = ${br(b)}<sup>2</sup> − 4 × ${a} × ${br(c)} = ${ds(D)}`, `${D > 0 ? 'Positive, so two solutions' : D === 0 ? 'Zero, so one (repeated) solution' : 'Negative, so no real solutions'}: ${B(n)}`] };
      }
      if (t === 1) {
        const m = r.int(2, 9); const c = m * m;
        return { html: `The equation ${B(`<i>x</i><sup>2</sup> + <i>kx</i> + ${c} = 0`)} has exactly one (repeated) solution, and <i>k</i> is positive.<br>Work out the value of <i>k</i>.`, answerLabel: 'k =', ...nAns(2 * m), hint: 'For one repeated solution, b² − 4ac = 0.',
          steps: [`One solution means b² − 4ac = 0: <i>k</i><sup>2</sup> − 4 × 1 × ${c} = 0`, `<i>k</i><sup>2</sup> = ${4 * c}`, `<i>k</i> is positive, so <i>k</i> = ${B(2 * m)}`] };
      }
      if (t === 2) {
        const a = r.int(1, 4), b = r.nz(-12, 12); const lim = b * b / (4 * a); const c = Math.floor(lim) + 1;
        return { html: `The equation ${B(`${tx(polyT([[a, 'x^2'], [b, 'x']]))} + <i>c</i> = 0`)} has ${B('no real solutions')}. <i>c</i> is an integer.<br>Work out the smallest possible value of <i>c</i>.`, answerLabel: 'c =', ...nAns(c), hint: 'No real solutions means b² − 4ac < 0.',
          steps: [`No real solutions: ${br(b)}<sup>2</sup> − 4 × ${a} × <i>c</i> &lt; 0`, `${b * b} &lt; ${4 * a}<i>c</i>, so <i>c</i> &gt; ${ds(rnd(lim, 4))}`, `Smallest integer: <i>c</i> = ${B(c)}`] };
      }
      const b = r.nz(-13, 13); const lim = b * b / 4; const k = Number.isInteger(lim) ? lim - 1 : Math.floor(lim);
      return { html: `The equation ${B(`${tx(polyT([[1, 'x^2'], [b, 'x']]))} + <i>k</i> = 0`)} has ${B('two different real solutions')}. <i>k</i> is an integer.<br>Work out the largest possible value of <i>k</i>.`, answerLabel: 'k =', ...nAns(k), hint: 'Two different solutions means b² − 4ac > 0.',
        steps: [`Two solutions: ${br(b)}<sup>2</sup> − 4 × 1 × <i>k</i> &gt; 0`, `${b * b} &gt; 4<i>k</i>, so <i>k</i> &lt; ${ds(lim)}`, `Largest integer: <i>k</i> = ${B(k)}`] };
    }],
]);

// ---------------------------------------------------------------- completing the square
addStyles('y11-completing-square', [
  ['Exam-style problem',
    'Completing the square shows the turning point straight away: a(x − h)² + k has its turning point at (h, k). Use it to find a maximum or minimum value in context, or to solve equations exactly.',
    (r) => {
      const t = r.int(0, 5);
      if (t === 0) {
        const p = r.int(1, 4), c = r.int(1, 20); const b = 10 * p; const H = 5 * p * p + c;
        const who = r.pick(['A ball is kicked into the air', 'A firework is launched', 'A dolphin jumps out of a pool from a platform', 'A stone is thrown upwards from a cliff edge']);
        return { html: `${who}. Its height, <i>h</i> metres, after <i>t</i> seconds is ${B(`<i>h</i> = ${c} + ${b}<i>t</i> − 5<i>t</i><sup>2</sup>`)}.<br>By completing the square, find the maximum height.`, unit: 'm', ...nAns(H, { unit: 'm' }), hint: 'Take out −5 from the t terms first.',
          steps: [`<i>h</i> = −5(<i>t</i><sup>2</sup> − ${2 * p}<i>t</i>) + ${c}`, `= −5[(<i>t</i> − ${p})<sup>2</sup> − ${p * p}] + ${c} = −5(<i>t</i> − ${p})<sup>2</sup> + ${5 * p * p + c}`, `(<i>t</i> − ${p})<sup>2</sup> ≥ 0, so the maximum is when <i>t</i> = ${p}`, `Maximum height = ${B(H)} m`] };
      }
      if (t === 1) {
        const s = 2 * r.int(5, 30); const h = s / 2; const obj = r.pick(['A farmer has', 'A gardener has', 'Mia has', 'A builder has']); const what = r.pick(['fencing', 'edging', 'rope', 'wire']); const u = r.pick(['m', 'm', 'cm']);
        return { html: `${obj} ${B(2 * s + ' ' + u)} of ${what} to make the perimeter of a rectangle. The width is <i>x</i> ${u}, so the area is ${B(`<i>A</i> = <i>x</i>(${s} − <i>x</i>)`)}.<br>By completing the square, find the maximum possible area.`, unit: u + '²', ...nAns(h * h, { unit: u + '²' }), hint: 'Write A = −(x − p)² + q.',
          steps: [`<i>A</i> = ${s}<i>x</i> − <i>x</i><sup>2</sup> = −(<i>x</i><sup>2</sup> − ${s}<i>x</i>)`, `= −[(<i>x</i> − ${h})<sup>2</sup> − ${h * h}] = ${h * h} − (<i>x</i> − ${h})<sup>2</sup>`, `The maximum is when <i>x</i> = ${h} (a square)`, `Maximum area = ${B(h * h)} ${u}²`] };
      }
      if (t === 2) {
        const p = r.nz(-8, 8), m = r.int(-20, 15); const b = 2 * p, c = m + p * p;
        return { html: `The minimum value of ${B(`${tx(polyT([[1, 'x^2'], [b, 'x']]))} + <i>c</i>`)} is ${B(ds(m))}.<br>Work out the value of <i>c</i>.`, answerLabel: 'c =', ...nAns(c), hint: 'Complete the square; the minimum value is the constant at the end.',
          steps: [`${tx(polyT([[1, 'x^2'], [b, 'x']]))} + <i>c</i> = ${tx(`(${lin(1, p)})^2`)} − ${p * p} + <i>c</i>`, `Minimum value = <i>c</i> − ${p * p} = ${ds(m)}`, `<i>c</i> = ${ds(m)} + ${p * p} = ${B(ds(c))}`] };
      }
      if (t === 3) {
        const p = r.nz(-6, 6); let q; do { q = r.int(2, 30); } while (Number.isInteger(Math.sqrt(q))); const c = p * p - q;
        return { html: `By completing the square, solve ${B(tx(`${quad(1, 2 * p, c)}=0`))}.<br>Give your solutions in the form ${B('<i>x</i> = <i>a</i> ± √<i>b</i>')}, and write down the values of <i>a</i> and <i>b</i>.`, answer: `${-p}, ${q}`, check: { type: 'pair', values: [-p, q], ordered: true }, answerHtml: B(`<i>x</i> = ${ds(-p)} ± ${sq(q)} &nbsp; (a = ${ds(-p)}, b = ${q})`), format: 'Type a then b, e.g. -3, 7', hint: `Halve ${2 * p} to start: (x ${p > 0 ? '+' : '−'} ${Math.abs(p)})².`,
          steps: [`${tx(`(${lin(1, p)})^2`)} − ${p * p}${c === 0 ? '' : pm(c)} = 0`, `${tx(`(${lin(1, p)})^2`)} = ${q}`, `${tx(lin(1, p))} = ± ${sq(q)}`, `<i>x</i> = ${ds(-p)} ± ${sq(q)}, so ${B(`a = ${ds(-p)}, b = ${q}`)}`] };
      }
      if (t === 4) {
        const h = r.int(10, 30), c = r.int(20, h * h - 30); const P = h * h - c; const item = r.pick(['candles', 'cupcakes', 'phone cases', 'plants']);
        return { html: `A shop sells ${item}. When the price of each is £<i>x</i>, the daily profit, £<i>P</i>, is given by ${B(`<i>P</i> = ${2 * h}<i>x</i> − <i>x</i><sup>2</sup> − ${c}`)}.<br>By completing the square, find the maximum daily profit.`, answerLabel: '£', unit: '', ...nAns(P), answerHtml: B('£' + P), format: 'Give your answer in pounds', hint: 'Write P = −(x − h)² + k.',
          steps: [`<i>P</i> = −(<i>x</i><sup>2</sup> − ${2 * h}<i>x</i>) − ${c}`, `= −[(<i>x</i> − ${h})<sup>2</sup> − ${h * h}] − ${c} = ${P} − (<i>x</i> − ${h})<sup>2</sup>`, `Maximum when <i>x</i> = ${h} (price £${h})`, `Maximum profit = ${B('£' + P)}`] };
      }
      const h = r.nz(-7, 7), k = r.int(-15, 15); const b = -2 * h, c = h * h + k;
      return { html: `The curve ${B('<i>y</i> = <i>x</i><sup>2</sup> + <i>bx</i> + <i>c</i>')} has a turning point at ${B(`(${ds(h)}, ${ds(k)})`)}.<br>Work out the values of <i>b</i> and <i>c</i>.`, answer: `${b}, ${c}`, check: { type: 'pair', values: [b, c], ordered: true }, answerHtml: B(`b = ${ds(b)}, c = ${ds(c)}`), format: 'Type b then c, e.g. -6, 11', hint: 'Write the curve as (x − h)² + k and expand.',
        steps: [`Turning point (${ds(h)}, ${ds(k)}) means <i>y</i> = ${tx(`(${lin(1, -h)})^2`)}${k ? pm(k) : ''}`, `Expand: <i>y</i> = ${tx(quad(1, b, h * h))}${k ? pm(k) : ''} = ${tx(quad(1, b, c))}`, `${B(`b = ${ds(b)}, c = ${ds(c)}`)}`] };
    }],
]);

// ---------------------------------------------------------------- sine & cosine rules
addStyles('y11-sine-cosine-rule', [
  ['Navigation & bearings',
    'Draw a sketch with north lines at each point. Use the bearings to find an angle INSIDE the triangle, then choose the rule: two sides and the angle between them → cosine rule; a side and its opposite angle → sine rule.',
    (r) => {
      const t = r.int(0, 4);
      if (t === 0) {
        const d1 = r.int(5, 40), d2 = r.int(5, 40), th1 = r.int(10, 170), dl = r.int(30, 150); const th2 = th1 + dl; const Bi = 180 - dl;
        const ac = Math.sqrt(d1 * d1 + d2 * d2 - 2 * d1 * d2 * cosD(Bi)); const v = r.pick(['A ship sails', 'A yacht sails', 'A plane flies', 'A drone flies']);
        return { html: `${v} ${B(d1 + ' km')} from A to B on a bearing of ${B(e11Brg(th1))}. It then travels ${B(d2 + ' km')} from B to C on a bearing of ${B(e11Brg(th2))}.<br>Work out the direct distance from A to C. Give your answer to 1 decimal place.`, unit: 'km', ...nAns(ac, { dp: 1, unit: 'km' }), format: dpFmt(1), hint: 'Find angle ABC using the north lines (co-interior angles add to 180°).',
          steps: [`The bearing changes by ${e11Brg(th2)} − ${e11Brg(th1)} = ${dl}°, so angle ABC = 180° − ${dl}° = ${Bi}°`, `AC² = ${d1}<sup>2</sup> + ${d2}<sup>2</sup> − 2 × ${d1} × ${d2} × cos ${Bi}°`, `AC² = ${fx(ac * ac, 3)}…, AC = ${fx(ac, 4)}…`, `AC = ${B(r1(ac))} km`] };
      }
      if (t === 1) {
        const a1 = r.int(5, 200), df = r.int(30, 150); const a2 = a1 + df; const s1 = r.int(8, 30), s2 = r.int(8, 30), T = r.pick([1, 1.5, 2, 2.5, 3]);
        const d1 = s1 * T, d2 = s2 * T; const D = Math.sqrt(d1 * d1 + d2 * d2 - 2 * d1 * d2 * cosD(df));
        return { html: `Two boats leave a harbour at the same time. Boat P sails on a bearing of ${B(e11Brg(a1))} at ${B(s1 + ' km/h')}. Boat Q sails on a bearing of ${B(e11Brg(a2))} at ${B(s2 + ' km/h')}.<br>How far apart are the boats after ${B(ds(T) + (T === 1 ? ' hour' : ' hours'))}? Give your answer to 1 decimal place.`, unit: 'km', ...nAns(D, { dp: 1, unit: 'km' }), format: dpFmt(1), hint: 'Distance = speed × time for each boat; the angle between their paths is the difference of the bearings.',
          steps: [`Distances: P travels ${s1} × ${ds(T)} = ${ds(d1)} km, Q travels ${s2} × ${ds(T)} = ${ds(d2)} km`, `Angle between the paths = ${e11Brg(a2)} − ${e11Brg(a1)} = ${df}°`, `PQ² = ${ds(d1)}<sup>2</sup> + ${ds(d2)}<sup>2</sup> − 2 × ${ds(d1)} × ${ds(d2)} × cos ${df}° = ${fx(D * D, 3)}…`, `PQ = ${B(r1(D))} km`] };
      }
      if (t === 2) {
        const a1 = r.int(5, 150), df = r.int(25, 160); const a2 = a1 + df; const p = r.int(4, 25), q = r.int(4, 25); const D = Math.sqrt(p * p + q * q - 2 * p * q * cosD(df));
        const [o1, o2] = r.pick([['buoy A', 'buoy B'], ['a lighthouse', 'a rock'], ['a fishing boat', 'a yacht'], ['tree A', 'tree B']]);
        return { html: `From a coastguard station S, ${o1} is ${B(p + ' km')} away on a bearing of ${B(e11Brg(a1))}, and ${o2} is ${B(q + ' km')} away on a bearing of ${B(e11Brg(a2))}.<br>Work out the distance between ${o1} and ${o2}. Give your answer to 1 decimal place.`, unit: 'km', ...nAns(D, { dp: 1, unit: 'km' }), format: dpFmt(1), hint: 'The angle at S is the difference between the two bearings.',
          steps: [`Angle at S = ${e11Brg(a2)} − ${e11Brg(a1)} = ${df}°`, `d² = ${p}<sup>2</sup> + ${q}<sup>2</sup> − 2 × ${p} × ${q} × cos ${df}°`, `d² = ${fx(D * D, 3)}…, d = ${fx(D, 4)}…`, `Distance = ${B(r1(D))} km`] };
      }
      if (t === 3) {
        let a, b, c; do { a = r.int(20, 90); b = r.int(20, 90); c = r.int(20, 90); } while (a >= b + c - 5 || b >= a + c - 5 || c >= a + b - 5 || (c < a || c < b) || c === a || c === b);
        const C = acosD((a * a + b * b - c * c) / (2 * a * b)); const what = r.pick(['field', 'garden', 'car park', 'playground']);
        return { html: `A triangular ${what} has sides of length ${B(a + ' m')}, ${B(b + ' m')} and ${B(c + ' m')}.<br>Work out the size of the largest angle of the ${what}. Give your answer to 1 decimal place.`, unit: '°', ...nAns(C, { dp: 1, unit: '°' }), format: dpFmt(1), hint: 'The largest angle is opposite the longest side.',
          steps: [`The largest angle is opposite the longest side (${c} m)`, `cos C = ${frac(`${a}<sup>2</sup> + ${b}<sup>2</sup> − ${c}<sup>2</sup>`, `2 × ${a} × ${b}`)} = ${frac(ds(a * a + b * b - c * c), 2 * a * b)}`, `C = cos<sup>−1</sup>(${fx((a * a + b * b - c * c) / (2 * a * b), 5)}…) = ${fx(C, 3)}…`, `Largest angle = ${B(r1(C) + '°')}`] };
      }
      let al, be; do { al = r.int(25, 80); be = r.int(25, 80); } while (al + be > 150);
      const d = 10 * r.int(5, 40); const C = 180 - al - be; const AC = d * sinD(be) / sinD(C);
      const obj = r.pick(['a boat', 'a buoy', 'a swimmer', 'a hot-air balloon landing point']);
      return { html: `Two lifeguards, A and B, stand ${B(d + ' m')} apart on a straight beach. They both see ${obj}, C, out at sea. Angle CAB = ${B(al + '°')} and angle CBA = ${B(be + '°')}.<br>Work out the distance AC. Give your answer to 1 decimal place.`, unit: 'm', ...nAns(AC, { dp: 1, unit: 'm' }), format: dpFmt(1), hint: 'Find angle ACB first, then use the sine rule.',
        steps: [`Angle ACB = 180° − ${al}° − ${be}° = ${C}°`, `Sine rule: ${frac('AC', `sin ${be}°`)} = ${frac(d, `sin ${C}°`)}`, `AC = ${frac(`${d} × sin ${be}°`, `sin ${C}°`)} = ${fx(AC, 4)}…`, `AC = ${B(r1(AC))} m`] };
    }],
  ['Exam-style: multi-step triangles',
    'Many exam questions need two steps: use one rule to find a length or angle you were not asked for, then use it in a second triangle (or with the other rule). Keep full calculator values between the steps.',
    (r) => {
      const t = r.int(0, 3);
      if (t === 0) {
        let p, q, A, C, be, BD; do { p = r.int(5, 15); q = r.int(5, 15); A = r.int(40, 110); C = r.int(50, 120); be = r.int(20, 60); BD = Math.sqrt(p * p + q * q - 2 * p * q * cosD(A)); } while (180 - C - be < 15);
        const CD = BD * sinD(be) / sinD(C);
        return { html: `ABCD is a quadrilateral. AB = ${B(p + ' cm')}, AD = ${B(q + ' cm')} and angle BAD = ${B(A + '°')}. The diagonal BD is drawn. Angle BCD = ${B(C + '°')} and angle CBD = ${B(be + '°')}.<br>Work out the length of CD. Give your answer to 1 decimal place.`, unit: 'cm', ...nAns(CD, { dp: 1, unit: 'cm' }), format: dpFmt(1), hint: 'Find BD with the cosine rule in triangle ABD first.',
          steps: [`Triangle ABD: BD² = ${p}<sup>2</sup> + ${q}<sup>2</sup> − 2 × ${p} × ${q} × cos ${A}°`, `BD = ${fx(BD, 4)}… cm`, `Triangle BCD, sine rule: ${frac('CD', `sin ${be}°`)} = ${frac('BD', `sin ${C}°`)}`, `CD = ${frac(`${fx(BD, 4)}… × sin ${be}°`, `sin ${C}°`)} = ${fx(CD, 4)}…`, `CD = ${B(r1(CD))} cm`] };
      }
      if (t === 1) {
        let d1, d2, th1, dl, Bi, ac, A, brg; do {
          d1 = r.int(6, 30); d2 = r.int(5, 30); th1 = r.int(20, 120); dl = r.int(40, 140); Bi = 180 - dl;
          ac = Math.sqrt(d1 * d1 + d2 * d2 - 2 * d1 * d2 * cosD(Bi)); A = asinD(d2 * sinD(Bi) / ac);
          const Cx = d1 * sinD(th1) + d2 * sinD(th1 + dl), Cy = d1 * cosD(th1) + d2 * cosD(th1 + dl); brg = (Math.atan2(Cx, Cy) / DEG + 360) % 360;
        } while (d2 * d2 >= d1 * d1 + ac * ac || Math.abs(brg - (th1 + A)) > 1e-6 || Math.abs(brg - Math.round(brg)) > 0.45 && false);
        return { html: `A ship sails ${B(d1 + ' km')} from port A to a point B on a bearing of ${B(e11Brg(th1))}. It then sails ${B(d2 + ' km')} to a point C on a bearing of ${B(e11Brg(th1 + dl))}.<br>Work out the bearing of C from A. Give your answer to the nearest degree.`, unit: '°', ...nAns(brg, { dp: 0, unit: '°' }), format: 'Give your answer to the nearest degree, e.g. 073', hint: 'Find AC with the cosine rule, then angle BAC with the sine rule.',
          steps: [`Angle ABC = 180° − ${dl}° = ${Bi}°`, `AC² = ${d1}<sup>2</sup> + ${d2}<sup>2</sup> − 2 × ${d1} × ${d2} × cos ${Bi}°, AC = ${fx(ac, 4)}… km`, `sin BAC = ${frac(`${d2} × sin ${Bi}°`, `${fx(ac, 4)}…`)}, so angle BAC = ${fx(A, 3)}…°`, `Bearing = ${th1}° + ${fx(A, 3)}…° = ${fx(brg, 2)}…°`, `Bearing of C from A = ${B(e11Brg(brg))}`] };
      }
      if (t === 2) {
        let al, be; do { al = r.int(15, 50); be = r.int(al + 10, 75); } while (be - al < 8);
        const d = r.int(20, 120); const BT = d * sinD(al) / sinD(be - al); const h = BT * sinD(be);
        const obj = r.pick(['a tower', 'a tree', 'a cliff', 'a church spire']);
        return { html: `Points A and B are ${B(d + ' m')} apart on level ground, in a straight line with the foot of ${obj}. From A, the angle of elevation of the top of ${obj} is ${B(al + '°')}. From B, which is closer, the angle of elevation is ${B(be + '°')}.<br>Work out the height of ${obj}. Give your answer to 1 decimal place.`, unit: 'm', ...nAns(h, { dp: 1, unit: 'm' }), format: dpFmt(1), hint: 'In triangle ABT (T the top), the angle at T is the difference of the two angles of elevation.',
          steps: [`Angle ABT = 180° − ${be}° = ${180 - be}°, so angle ATB = 180° − ${al}° − ${180 - be}° = ${be - al}°`, `Sine rule: BT = ${frac(`${d} × sin ${al}°`, `sin ${be - al}°`)} = ${fx(BT, 4)}… m`, `Right-angled triangle: height = BT × sin ${be}° = ${fx(h, 4)}…`, `Height = ${B(r1(h))} m`] };
      }
      const a = r.int(5, 25), b = r.int(5, 25), C = r.int(30, 140); const c = Math.sqrt(a * a + b * b - 2 * a * b * cosD(C)); const P = a + b + c;
      const obj = r.pick(['triangular plot of land', 'triangular flower bed', 'triangular sail', 'triangular banner']); const u = obj.includes('banner') || obj.includes('sail') ? 'm' : 'm';
      return { html: `A ${obj} has two sides of length ${B(a + ' ' + u)} and ${B(b + ' ' + u)}. The angle between these sides is ${B(C + '°')}. Edging is needed all the way round it.<br>Work out the perimeter. Give your answer to 1 decimal place.`, unit: u, ...nAns(P, { dp: 1, unit: u }), format: dpFmt(1), hint: 'Find the third side with the cosine rule.',
        steps: [`Third side² = ${a}<sup>2</sup> + ${b}<sup>2</sup> − 2 × ${a} × ${b} × cos ${C}° = ${fx(c * c, 3)}…`, `Third side = ${fx(c, 4)}… ${u}`, `Perimeter = ${a} + ${b} + ${fx(c, 4)}… = ${fx(P, 4)}…`, `= ${B(r1(P))} ${u}`] };
    }],
]);

// ---------------------------------------------------------------- area ½ab sin C
addStyles('y11-area-sine', [
  ['Problems in context',
    'Find the area with Area = ½ab sin C (C is the angle between sides a and b), then finish the problem: work out a cost, the number of tins, a total for a shape made of several triangles, or subtract to find a segment.',
    (r) => {
      const t = r.int(0, 5);
      if (t === 0) {
        const a = r.int(5, 20), b = r.int(5, 20), C = r.int(30, 150), p = r.pick([3, 4, 4.5, 5, 6, 7.5, 8]); const A = 0.5 * a * b * sinD(C); const n = Math.ceil(A); const cost = n * p;
        return { html: `A triangular lawn has sides of ${B(a + ' m')} and ${B(b + ' m')} with an angle of ${B(C + '°')} between them. Turf is sold by the whole square metre and costs ${B(money(p))} per m².<br>Work out the cost of buying enough turf to cover the lawn.`, ...nAns(cost, { money: true }), hint: 'Find the area, then round UP to a whole number of square metres.',
          steps: [`Area = ½ × ${a} × ${b} × sin ${C}° = ${fx(A, 3)}… m²`, `Round up: ${n} m² of turf`, `Cost = ${n} × ${money(p)} = ${B(money(cost))}`] };
      }
      if (t === 1) {
        const a = r.int(4, 30), b = r.int(4, 30), C = r.int(25, 85); const A = a * b * sinD(C); const obj = r.pick(['tile', 'badge', 'window pane', 'paving slab']);
        return { html: `A ${obj} is in the shape of a parallelogram with sides ${B(a + ' cm')} and ${B(b + ' cm')}. The acute angle between the sides is ${B(C + '°')}.<br>Work out the area of the ${obj}. Give your answer to 1 decimal place.`, unit: 'cm²', ...nAns(A, { dp: 1, unit: 'cm²' }), format: dpFmt(1), hint: 'A diagonal splits the parallelogram into two identical triangles.',
          steps: ['A diagonal splits the parallelogram into two identical triangles.', `One triangle = ½ × ${a} × ${b} × sin ${C}° = ${fx(A / 2, 4)}… cm²`, `Parallelogram = 2 × ${fx(A / 2, 4)}… = ${fx(A, 4)}…`, `= ${B(r1(A))} cm²`] };
      }
      if (t === 2) {
        const [n, nm] = r.pick([[5, 'pentagon'], [6, 'hexagon'], [8, 'octagon'], [10, 'decagon'], [12, 'dodecagon']]); const R0 = r.int(3, 20); const th = 360 / n; const A = n * 0.5 * R0 * R0 * sinD(th);
        const obj = r.pick(['table top', 'coaster', 'paving stone', 'clock face']);
        return { html: `A ${obj} is a regular ${nm}. Each vertex is ${B(R0 + ' cm')} from the centre.<br>Work out the area of the ${obj}. Give your answer to 1 decimal place.`, unit: 'cm²', ...nAns(A, { dp: 1, unit: 'cm²' }), format: dpFmt(1), hint: `Split it into ${n} identical triangles meeting at the centre.`,
          steps: [`Split into ${n} triangles. Angle at the centre = 360° ÷ ${n} = ${ds(th)}°`, `One triangle = ½ × ${R0} × ${R0} × sin ${ds(th)}° = ${fx(A / n, 4)}… cm²`, `Total = ${n} × ${fx(A / n, 4)}… = ${fx(A, 4)}…`, `= ${B(r1(A))} cm²`] };
      }
      if (t === 3) {
        const R0 = r.int(4, 20), th = r.int(40, 150); const sec = th / 360 * Math.PI * R0 * R0, tri = 0.5 * R0 * R0 * sinD(th); const A = sec - tri;
        return { html: `A chord cuts off a segment from a circle of radius ${B(R0 + ' cm')}. The chord subtends an angle of ${B(th + '°')} at the centre.<br>Work out the area of the minor segment. Give your answer to 1 decimal place.`, unit: 'cm²', ...nAns(A, { dp: 1, unit: 'cm²' }), format: dpFmt(1), hint: 'Segment = sector − triangle.',
          steps: [`Sector = ${frac(th, 360)} × π × ${R0}<sup>2</sup> = ${fx(sec, 4)}… cm²`, `Triangle = ½ × ${R0} × ${R0} × sin ${th}° = ${fx(tri, 4)}… cm²`, `Segment = ${fx(sec, 4)}… − ${fx(tri, 4)}… = ${fx(A, 4)}…`, `= ${B(r1(A))} cm²`] };
      }
      if (t === 4) {
        let a, b, c; do { a = r.int(20, 90); b = r.int(20, 90); c = r.int(20, 90); } while (a >= b + c - 5 || b >= a + c - 5 || c >= a + b - 5);
        const cosC = (a * a + b * b - c * c) / (2 * a * b); const C = acosD(cosC); const A = 0.5 * a * b * sinD(C);
        return { html: `A triangular field has sides of length ${B(a + ' m')}, ${B(b + ' m')} and ${B(c + ' m')}.<br>Work out the area of the field. Give your answer to the nearest square metre.`, unit: 'm²', ...nAns(A, { dp: 0, unit: 'm²' }), format: 'Give your answer to the nearest whole number', hint: 'Use the cosine rule to find an angle first.',
          steps: [`Angle between the ${a} m and ${b} m sides: cos C = ${frac(`${a}<sup>2</sup> + ${b}<sup>2</sup> − ${c}<sup>2</sup>`, `2 × ${a} × ${b}`)} = ${fx(cosC, 5)}…`, `C = ${fx(C, 4)}…°`, `Area = ½ × ${a} × ${b} × sin ${fx(C, 4)}…° = ${fx(A, 3)}…`, `Area = ${B(fx(A, 0))} m²`] };
      }
      const a = r.int(3, 9), b = r.int(3, 9), C = r.int(35, 120), k = r.pick([4, 5, 6, 8]); const A = 0.5 * a * b * sinD(C); const n = Math.ceil(rnd(2 * A / k, 9));
      return { html: `A triangular wooden sign has sides of ${B(a + ' m')} and ${B(b + ' m')} with an angle of ${B(C + '°')} between them. Both faces of the sign are to be varnished. One tin of varnish covers ${B(k + ' m²')}.<br>How many tins of varnish are needed?`, unit: 'tins', ...nAns(n), hint: 'Double the area (two faces), then divide by the coverage and round up.',
        steps: [`Area of one face = ½ × ${a} × ${b} × sin ${C}° = ${fx(A, 3)}… m²`, `Both faces = ${fx(2 * A, 3)}… m²`, `${fx(2 * A, 3)}… ÷ ${k} = ${fx(2 * A / k, 3)}…`, `Round up: ${B(n)} tins`] };
    }],
]);

// ---------------------------------------------------------------- rationalising
const e11NonSq = [2, 3, 5, 6, 7, 10, 11, 13, 14, 15, 17, 19, 21, 22, 23, 26, 29, 30];
addStyles('y11-rationalising', [
  ['Exam-style problem',
    'To rationalise a denominator like b + √c, multiply the top and bottom by b − √c (swap the sign). The bottom becomes b² − c, which has no surd. Then simplify and compare with the form asked for.',
    (r) => {
      const t = r.int(0, 3);
      if (t === 0) {
        let b, c, d; do { b = r.int(1, 5); c = r.pick(e11NonSq); d = b * b - c; } while (d === 0 || Math.abs(d) > 6);
        const k = (d > 0 ? 1 : -1) * r.int(1, 5); const a = d * k; const plus = r.chance();
        const p = k * b, q = plus ? -k : k; const den = plus ? `${b} + ${sq(c)}` : `${b} − ${sq(c)}`; const conj = plus ? `${b} − ${sq(c)}` : `${b} + ${sq(c)}`;
        return { html: `Write ${B(frac(a, den))} in the form ${B('<i>p</i> + <i>q</i>' + sq(c))}, where <i>p</i> and <i>q</i> are integers.<br>Give the values of <i>p</i> and <i>q</i>.`, answer: `${p}, ${q}`, check: { type: 'pair', values: [p, q], ordered: true }, answerHtml: B(`p = ${ds(p)}, q = ${ds(q)}`), format: 'Type p then q, e.g. 6, -2', hint: `Multiply top and bottom by ${conj}.`,
          steps: [`Multiply by ${frac(conj, conj)}: ${frac(`${a}(${conj})`, `(${den})(${conj})`)}`, `Denominator: ${b}<sup>2</sup> − ${c} = ${ds(d)}`, `${frac(`${a}(${conj})`, ds(d))} = ${ds(k)}(${conj}) = ${ds(p)}${q < 0 ? ' − ' : ' + '}${surdH(Math.abs(q), c)}`, `${B(`p = ${ds(p)}, q = ${ds(q)}`)}`] };
      }
      if (t === 1) {
        const bb = r.pick(SQF), m = r.int(1, 6), n = r.int(2, 6); const sub = r.chance() && n !== m; const a = bb * m; const k = sub ? n - m : n + m; const big = n * n * bb;
        return { html: `${B(sub ? `${sq(big)} − ${frac(a, sq(bb))}` : `${frac(a, sq(bb))} + ${sq(big)}`)} can be written in the form ${B('<i>k</i>' + sq(bb))}.<br>Work out the value of <i>k</i>.`, answerLabel: 'k =', ...nAns(k), hint: `Rationalise the fraction and simplify ${sq(big)} as a multiple of ${sq(bb)}.`,
          steps: [`${frac(a, sq(bb))} = ${frac(`${a}${sq(bb)}`, bb)} = ${surdH(m, bb)}`, `${sq(big)} = ${sq(`${n * n} × ${bb}`)} = ${surdH(n, bb)}`, sub ? `${surdH(n, bb)} − ${surdH(m, bb)} = ${surdH(k, bb)}` : `${surdH(m, bb)} + ${surdH(n, bb)} = ${surdH(k, bb)}`, `<i>k</i> = ${B(ds(k))}`] };
      }
      if (t === 2) {
        const [c, d] = r.pick([[2, 1], [5, 2], [10, 3], [17, 4], [26, 5], [3, 1], [6, 2], [11, 3], [3, 2], [15, 4], [35, 6]]);
        const e = c - d * d; const p = (c + d * d) / e, q = 2 * d / e;
        return { html: `Write ${B(frac(`${sq(c)} + ${d}`, `${sq(c)} − ${d}`))} in the form ${B('<i>p</i> + <i>q</i>' + sq(c))}, where <i>p</i> and <i>q</i> are integers.<br>Give the values of <i>p</i> and <i>q</i>.`, answer: `${p}, ${q}`, check: { type: 'pair', values: [p, q], ordered: true }, answerHtml: B(`p = ${ds(p)}, q = ${ds(q)}`), format: 'Type p then q, e.g. 3, 2', hint: `Multiply top and bottom by ${sq(c)} + ${d}.`,
          steps: [`Multiply by ${frac(`${sq(c)} + ${d}`, `${sq(c)} + ${d}`)}`, `Top: (${sq(c)} + ${d})<sup>2</sup> = ${c} + ${2 * d}${sq(c)} + ${d * d} = ${c + d * d} + ${2 * d}${sq(c)}`, `Bottom: ${c} − ${d * d} = ${ds(e)}`, `${frac(`${c + d * d} + ${2 * d}${sq(c)}`, ds(e))} = ${ds(p)}${q < 0 ? ' − ' : ' + '}${surdH(Math.abs(q), c)}, so ${B(`p = ${ds(p)}, q = ${ds(q)}`)}`] };
      }
      const [c, b] = r.pick([[2, 1], [5, 2], [10, 3], [17, 4], [3, 1], [6, 2], [11, 3], [18, 4], [27, 5]]); const e = c - b * b; const diff = r.chance();
      if (diff) {
        const v = 2 * b / e;
        return { html: `Show that ${B(`${frac(1, `${sq(c)} − ${b}`)} − ${frac(1, `${sq(c)} + ${b}`)}`)} is a whole number, and work out its value.`, ...nAns(v), hint: 'Use the common denominator (√c − b)(√c + b).',
          steps: [`Common denominator: (${sq(c)} − ${b})(${sq(c)} + ${b}) = ${c} − ${b * b} = ${e}`, `Numerator: (${sq(c)} + ${b}) − (${sq(c)} − ${b}) = ${2 * b}`, `${frac(2 * b, e)} = ${B(ds(v))}`] };
      }
      const [kk, mm] = simpSurd(c); const coef = 2 * kk / e;
      return { html: `${B(`${frac(1, `${sq(c)} − ${b}`)} + ${frac(1, `${sq(c)} + ${b}`)}`)} can be written in the form ${B('<i>k</i>' + sq(mm))}.<br>Work out the value of <i>k</i>.`, answerLabel: 'k =', ...nAns(coef), hint: 'Use the common denominator (√c − b)(√c + b).',
        steps: [`Common denominator: (${sq(c)} − ${b})(${sq(c)} + ${b}) = ${c} − ${b * b} = ${e}`, `Numerator: (${sq(c)} + ${b}) + (${sq(c)} − ${b}) = 2${sq(c)}${kk > 1 ? ` = ${2 * kk}${sq(mm)}` : ''}`, `${frac(`${2 * kk}${sq(mm)}`, e)} = ${surdH(coef, mm)}, so <i>k</i> = ${B(ds(coef))}`] };
    }],
  ['Problems in context',
    'Lengths in exact form often come out with a surd on the bottom, e.g. 12/√3. Rationalise (multiply top and bottom by the surd) and simplify to the form asked for, such as k√3.',
    (r) => {
      const t = r.int(0, 4); const bb = r.pick(SQF);
      if (t === 0) {
        const k = r.int(2, 9); const A = k * bb; const obj = r.pick(['rectangle', 'rectangular label', 'rectangular sticker', 'rectangular tile']);
        return { html: `A ${obj} has an area of ${B(A + ' cm²')}. Its width is ${B(sq(bb) + ' cm')}.<br>The length can be written as ${B('<i>k</i>' + sq(bb) + ' cm')}. Work out the value of <i>k</i>.`, answerLabel: 'k =', ...nAns(k), hint: 'Length = area ÷ width, then rationalise.',
          steps: [`Length = ${frac(A, sq(bb))}`, `= ${frac(`${A}${sq(bb)}`, bb)} = ${surdH(k, bb)}`, `<i>k</i> = ${B(k)}`] };
      }
      if (t === 1) {
        let A; do { A = r.int(3, 30); } while ((2 * A) % bb !== 0); const k = 2 * A / bb;
        return { html: `A triangle has an area of ${B(A + ' cm²')}. Its base is ${B(sq(bb) + ' cm')} long.<br>The perpendicular height can be written as ${B('<i>k</i>' + sq(bb) + ' cm')}. Work out the value of <i>k</i>.`, answerLabel: 'k =', ...nAns(k), hint: 'Height = 2 × area ÷ base.',
          steps: [`½ × ${sq(bb)} × h = ${A}, so h = ${frac(2 * A, sq(bb))}`, `Rationalise: ${frac(`${2 * A}${sq(bb)}`, bb)} = ${surdH(k, bb)}`, `<i>k</i> = ${B(k)}`] };
      }
      if (t === 2) {
        const d = r.int(3, 20); const per = r.chance(); const v = per ? 2 * d : d / 2;
        return { html: `A square has a diagonal of length ${B(d + ' cm')}.<br>The ${per ? 'perimeter' : 'side length'} of the square can be written as ${B('<i>k</i>√2 cm')}. Work out the value of <i>k</i>.`, answerLabel: 'k =', ...nAns(v), hint: 'Pythagoras: side² + side² = diagonal², so side = d/√2.',
          steps: [`s<sup>2</sup> + s<sup>2</sup> = ${d}<sup>2</sup>, so s = ${frac(d, sq(2))}`, `Rationalise: s = ${frac(`${d}${sq(2)}`, 2)}${d % 2 === 0 ? ` = ${surdH(d / 2, 2)}` : ''}`, per ? `Perimeter = 4 × ${frac(`${d}${sq(2)}`, 2)} = ${surdH(2 * d, 2)}, so <i>k</i> = ${B(2 * d)}` : `<i>k</i> = ${B(ds(v))}`] };
      }
      if (t === 3) {
        const h = 3 * r.int(1, 8); const k = 2 * h / 3;
        return { html: `An equilateral triangle has a perpendicular height of ${B(h + ' cm')}.<br>Its side length can be written as ${B('<i>k</i>√3 cm')}. Work out the value of <i>k</i>.`, answerLabel: 'k =', ...nAns(k), hint: 'sin 60° = √3/2 = height ÷ side.',
          steps: [`sin 60° = ${frac(h, 's')}, so s = ${frac(h, 'sin 60°')} = ${frac(h, frac(sq(3), 2))} = ${frac(2 * h, sq(3))}`, `Rationalise: ${frac(`${2 * h}${sq(3)}`, 3)} = ${surdH(k, 3)}`, `<i>k</i> = ${B(k)}`] };
      }
      let b, c, d; do { b = r.int(2, 5); c = r.pick(e11NonSq); d = b * b - c; } while (d <= 0 || d > 6);
      const k = r.int(1, 5); const A = d * k; const p = k * b, q = -k;
      return { html: `A rectangle has an area of ${B(A + ' m²')} and a length of ${B(`(${b} + ${sq(c)}) m`)}.<br>Its width can be written as ${B(`(<i>p</i> + <i>q</i>${sq(c)}) m`)}, where <i>p</i> and <i>q</i> are integers. Give the values of <i>p</i> and <i>q</i>.`, answer: `${p}, ${q}`, check: { type: 'pair', values: [p, q], ordered: true }, answerHtml: B(`p = ${p}, q = ${q}`), format: 'Type p then q, e.g. 8, -2', hint: `Width = ${A} ÷ (${b} + √${c}); multiply top and bottom by ${b} − √${c}.`,
        steps: [`Width = ${frac(A, `${b} + ${sq(c)}`)}`, `× ${frac(`${b} − ${sq(c)}`, `${b} − ${sq(c)}`)}: denominator ${b * b} − ${c} = ${d}`, `Width = ${frac(`${A}(${b} − ${sq(c)})`, d)} = ${p} − ${surdH(k, c)}`, `${B(`p = ${p}, q = ${q}`)}`] };
    }],
]);

// ---------------------------------------------------------------- functions
addStyles('y11-functions', [
  ['Exam-style problem',
    'Write out what each piece of function notation means as an expression in x first (e.g. ff(x) = f(f(x))), then form and solve an equation. f⁻¹ undoes f, so f⁻¹(a) is the input that gives output a.',
    (r) => {
      const t = r.int(0, 4);
      if (t === 0) {
        const a = r.int(2, 5), b = r.nz(-9, 9), x0 = r.nz(-6, 6); const k = a * (a * x0 + b) + b;
        return { html: `${B(`f(<i>x</i>) = ${tx(lin(a, b))}`)}.<br>Solve ${B(`ff(<i>x</i>) = ${ds(k)}`)}.`, answerLabel: 'x =', ...nAns(x0), hint: 'ff(x) = f(f(x)): substitute f(x) into f.',
          steps: [`ff(<i>x</i>) = ${a}(${tx(lin(a, b))})${pm(b)} = ${tx(lin(a * a, a * b + b))}`, `${tx(`${lin(a * a, a * b + b)}=${k}`)}`, `${a * a}<i>x</i> = ${ds(k - a * b - b)}`, `<i>x</i> = ${B(ds(x0))}`] };
      }
      if (t === 1) {
        const a = r.int(2, 6), x0 = r.nz(-8, 8); const b = x0 * (1 - a);
        return { html: `${B(`f(<i>x</i>) = ${tx(lin(a, b))}`)}.<br>Find the value of <i>x</i> for which ${B('f(<i>x</i>) = f<sup>−1</sup>(<i>x</i>)')}.`, answerLabel: 'x =', ...nAns(x0), hint: 'Find f⁻¹(x) and set it equal to f(x) — or use the fact that they meet on the line y = x.',
          steps: [`f<sup>−1</sup>(<i>x</i>) = ${frac(tx(lin(1, -b)), a)}`, `${tx(lin(a, b))} = ${frac(tx(lin(1, -b)), a)} → ${tx(lin(a * a, a * b))} = ${tx(lin(1, -b))}`, `${a * a - 1}<i>x</i> = ${ds(-b - a * b)}`, `<i>x</i> = ${B(ds(x0))}`] };
      }
      if (t === 2) {
        const [ctx, unitW, s, p] = r.pick([
          ['A taxi company charges a fixed fee plus a charge per mile. The cost, in pounds, of a journey of <i>m</i> miles is', 'miles', r.pick([2.5, 3, 3.5, 4]), r.pick([1.2, 1.5, 1.8, 2, 2.4])],
          ['A plumber charges a call-out fee plus an hourly rate. The cost, in pounds, of a job lasting <i>m</i> hours is', 'hours', r.pick([40, 45, 50, 60]), r.pick([25, 30, 35, 40])],
          ['A bike-hire shop charges a deposit plus a charge per hour. The cost, in pounds, of hiring a bike for <i>m</i> hours is', 'hours', r.pick([5, 8, 10, 12]), r.pick([3.5, 4, 4.5, 6])],
          ['A printing firm charges a set-up fee plus a cost per poster. The cost, in pounds, of <i>m</i> posters is', 'posters', r.pick([15, 20, 25]), r.pick([0.8, 1.2, 1.5, 2.5])]]);
        const m0 = r.int(3, 20); const F = rnd(s + p * m0, 2);
        return { html: `${ctx} ${B(`f(<i>m</i>) = ${ds(s)} + ${ds(p)}<i>m</i>`)}.<br>Work out ${B(`f<sup>−1</sup>(${dfx(F, 2)})`)}. This is the number of ${unitW} for a cost of ${money(F)}.`, ...nAns(m0), hint: `Solve ${ds(s)} + ${ds(p)}m = ${dfx(F, 2)}.`,
          steps: [`f<sup>−1</sup>(${dfx(F, 2)}) is the value of <i>m</i> with ${ds(s)} + ${ds(p)}<i>m</i> = ${dfx(F, 2)}`, `${ds(p)}<i>m</i> = ${dfx(F, 2)} − ${ds(s)} = ${ds(rnd(F - s, 2))}`, `<i>m</i> = ${ds(rnd(F - s, 2))} ÷ ${ds(p)} = ${B(m0)}`] };
      }
      if (t === 3) {
        const a = r.int(2, 7), b = r.nz(-9, 9), c = r.nz(-8, 8); const d = a * c + b;
        return { html: `${B(`f(<i>x</i>) = ${tx(lin(a, b))}`)} and ${B('g(<i>x</i>) = <i>x</i> + <i>c</i>')}, where <i>c</i> is a constant.<br>Given that ${B(`fg(<i>x</i>) = ${tx(lin(a, d))}`)}, work out the value of <i>c</i>.`, answerLabel: 'c =', ...nAns(c), hint: 'fg(x) = f(x + c). Expand and compare constant terms.',
          steps: [`fg(<i>x</i>) = f(<i>x</i> + <i>c</i>) = ${a}(<i>x</i> + <i>c</i>)${pm(b)} = ${a}<i>x</i> + ${a}<i>c</i>${pm(b)}`, `Compare constants: ${a}<i>c</i>${pm(b)} = ${ds(d)}`, `${a}<i>c</i> = ${ds(d - b)}, so <i>c</i> = ${B(ds(c))}`] };
      }
      const b = r.nz(-8, 8), k = r.int(1, 9); const s1 = -b + k, s2 = -b - k;
      return { html: `${B(`f(<i>x</i>) = ${tx(lin(1, b))}`)} and ${B(`g(<i>x</i>) = <i>x</i><sup>2</sup> − ${k * k}`)}.<br>Solve ${B('gf(<i>x</i>) = 0')}.`, answer: `${s1}, ${s2}`, check: { type: 'pair', values: [s1, s2] }, answerHtml: B(`<i>x</i> = ${ds(s1)} or <i>x</i> = ${ds(s2)}`), format: 'Give both solutions separated by a comma, e.g. 3, -5', hint: 'gf(x) = g(f(x)): square f(x) and subtract.',
        steps: [`gf(<i>x</i>) = (${tx(lin(1, b))})<sup>2</sup> − ${k * k} = 0`, `(${tx(lin(1, b))})<sup>2</sup> = ${k * k}, so ${tx(lin(1, b))} = ${k} or ${tx(lin(1, b))} = −${k}`, `<i>x</i> = ${B(ds(s1))} or <i>x</i> = ${B(ds(s2))}`] };
    }],
]);

// ---------------------------------------------------------------- iteration
function e11Root(g, x0) { let x = x0; for (let i = 0; i < 200; i++) x = g(x); return x; }
addStyles('y11-iteration', [
  ['Exam-style problem',
    'Exam questions often go: show there is a solution between two values (look for a change of sign), then use the iteration formula repeatedly until the values agree to the accuracy needed. Keep full calculator accuracy throughout.',
    (r) => {
      const t = r.int(0, 3);
      if (t === 0) {
        let p, q, root, n; do { p = r.int(1, 6); q = r.int(5, 70); const f = (x) => x * x * x + p * x - q; root = e11Root((x) => Math.cbrt(q - p * x), 2); n = Math.floor(root); if (!(Math.abs(f(root)) < 1e-6)) { let lo = 0, hi = 5; for (let i = 0; i < 80; i++) { const mid = (lo + hi) / 2; if (f(mid) < 0) lo = mid; else hi = mid; } root = lo; n = Math.floor(root); } } while (n < 1 || Math.abs(root - Math.round(root)) < 0.05);
        const f = (x) => x * x * x + p * x - q;
        return { html: `The equation ${B(tx(`${polyT([[1, 'x^3'], [p, 'x'], [-q, '']])}=0`))} has exactly one solution. It lies between two consecutive whole numbers <i>n</i> and <i>n</i> + 1.<br>By looking for a change of sign, find the value of <i>n</i>.`, answerLabel: 'n =', ...nAns(n), hint: 'Substitute x = 1, 2, 3, … until the value changes sign.',
          steps: [`Let f(<i>x</i>) = ${tx(polyT([[1, 'x^3'], [p, 'x'], [-q, '']]))}`, `f(${n}) = ${ds(f(n))} (negative)`, `f(${n + 1}) = ${ds(f(n + 1))} (positive)`, `There is a change of sign, so the solution lies between ${n} and ${n + 1}: <i>n</i> = ${B(n)}`] };
      }
      if (t === 1) {
        const minus = r.chance(); let p, q, x0, g, root; do { p = r.int(1, 5); q = r.int(3, 40); g = minus ? (x) => Math.cbrt(p * x + q) : (x) => Math.cbrt(q - p * x); root = e11Root(g, 1.5); x0 = Math.floor(root); } while (x0 < 1 || Math.abs(p / (3 * root * root)) > 0.6 || Math.abs(root * 100 - Math.round(root * 100) - 0.5) < 0.02 || Math.abs(root * 100 - Math.round(root * 100) + 0.5) < 0.02);
        const xs = [x0]; for (let i = 0; i < 4; i++) xs.push(g(xs[i]));
        const eq = minus ? polyT([[1, 'x^3'], [-p, 'x'], [-q, '']]) : polyT([[1, 'x^3'], [p, 'x'], [-q, '']]);
        const fT = minus ? `∛(${p === 1 ? '' : p}<i>x</i><sub>n</sub> + ${q})` : `∛(${q} − ${p === 1 ? '' : p}<i>x</i><sub>n</sub>)`;
        return { html: `The equation ${B(tx(`${eq}=0`))} can be rearranged to give the iteration formula ${B(`<i>x</i><sub>n+1</sub> = ${fT}`)}.<br>Starting with ${B(`<i>x</i><sub>0</sub> = ${x0}`)}, use the iteration formula to find the solution correct to 2 decimal places.`, answerLabel: 'x =', ...nAns(root, { dp: 2 }), format: dpFmt(2), hint: 'Keep iterating until two values in a row round to the same 2 d.p. answer.',
          steps: [`<i>x</i><sub>1</sub> = ${fx(xs[1], 5)}…, <i>x</i><sub>2</sub> = ${fx(xs[2], 5)}…`, `<i>x</i><sub>3</sub> = ${fx(xs[3], 5)}…, <i>x</i><sub>4</sub> = ${fx(xs[4], 5)}…`, `Continuing, the values settle at ${fx(root, 5)}…`, `Solution = ${B(r2(root))} (2 d.p.)`] };
      }
      if (t === 2) {
        let h, V, root; do { h = r.int(1, 6); V = r.int(20, 300); root = e11Root((x) => Math.sqrt(V / (x + h)), 2); } while (Math.abs(root * 100 - Math.floor(root * 100) - 0.5) < 0.02 || root < 1.5);
        const g = (x) => Math.sqrt(V / (x + h)); const x0 = Math.round(root); const xs = [x0]; for (let i = 0; i < 4; i++) xs.push(g(xs[i]));
        const obj = r.pick(['box', 'storage tank', 'gift box', 'planter']);
        return { html: `A ${obj} is a cuboid with a square base of side <i>x</i> m and a height of (<i>x</i> + ${h}) m. Its volume is ${B(V + ' m³')}, so ${B(tx(`x^2(${lin(1, h)})=${V}`))}.<br>Using ${B(`<i>x</i><sub>n+1</sub> = ${sq(frac(V, `<i>x</i><sub>n</sub> + ${h}`))}`)} with ${B(`<i>x</i><sub>0</sub> = ${x0}`)}, find the value of <i>x</i> correct to 2 decimal places.`, answerLabel: 'x =', unit: 'm', ...nAns(root, { dp: 2, unit: 'm' }), format: dpFmt(2), hint: 'Iterate until the values agree to 2 decimal places.',
          steps: [`<i>x</i><sub>1</sub> = ${sq(frac(V, `${x0} + ${h}`))} = ${fx(xs[1], 5)}…`, `<i>x</i><sub>2</sub> = ${fx(xs[2], 5)}…, <i>x</i><sub>3</sub> = ${fx(xs[3], 5)}…, <i>x</i><sub>4</sub> = ${fx(xs[4], 5)}…`, `Continuing, the values settle at ${fx(root, 5)}…`, `<i>x</i> = ${B(r2(root))} m`] };
      }
      let p, q, root; do { p = r.int(1, 8); q = r.int(3, 40); root = (-p + Math.sqrt(p * p + 4 * q)) / 2; } while (Number.isInteger(root) || Math.abs(root * 100 - Math.floor(root * 100) - 0.5) < 0.02);
      const g = (x) => q / (x + p); const x0 = Math.max(1, Math.round(root)); const xs = [x0]; for (let i = 0; i < 4; i++) xs.push(g(xs[i]));
      return { html: `The positive solution of ${B(tx(`${quad(1, p, -q)}=0`))} is found using ${B(`<i>x</i><sub>n+1</sub> = ${frac(q, `<i>x</i><sub>n</sub> + ${p}`)}`)} with ${B(`<i>x</i><sub>0</sub> = ${x0}`)}.<br>Find the solution correct to 2 decimal places.`, answerLabel: 'x =', ...nAns(root, { dp: 2 }), format: dpFmt(2), hint: 'Iterate until the values agree to 2 d.p. (you can check with the quadratic formula).',
        steps: [`<i>x</i><sub>1</sub> = ${q} ÷ (${x0} + ${p}) = ${fx(xs[1], 5)}…`, `<i>x</i><sub>2</sub> = ${fx(xs[2], 5)}…, <i>x</i><sub>3</sub> = ${fx(xs[3], 5)}…, <i>x</i><sub>4</sub> = ${fx(xs[4], 5)}…`, `The values close in on ${fx(root, 5)}… (check: the quadratic formula gives ${frac(`−${p} + ${sq(p * p + 4 * q)}`, 2)})`, `<i>x</i> = ${B(r2(root))}`] };
    }],
]);

// ---------------------------------------------------------------- algebraic fractions
addStyles('y11-algebraic-fractions', [
  ['Exam-style problem',
    'To solve an equation with algebraic fractions, multiply every term by the common denominator to clear the fractions, then expand, simplify and solve (it is often a quadratic). Check no solution makes a denominator zero.',
    (r) => {
      const t = r.int(0, 4);
      if (t === 0) {
        let a, b, p, q, s1, s2; for (;;) { a = r.int(-5, 5); b = r.int(-5, 5); p = r.int(1, 8); q = r.int(1, 8); if (a === b) continue; const B1 = a + b - p - q, C1 = a * b - p * b - q * a; const D = B1 * B1 - 4 * C1; if (D <= 0) continue; const sD = Math.sqrt(D); if (!Number.isInteger(sD)) continue; s1 = (-B1 + sD) / 2; s2 = (-B1 - sD) / 2; if (!Number.isInteger(s1) || [s1, s2].some((s) => s === -a || s === -b)) continue; break; }
        const B1 = a + b - p - q, C1 = a * b - p * b - q * a; const dA = a ? tx(lin(1, a)) : '<i>x</i>', dB = b ? tx(lin(1, b)) : '<i>x</i>';
        return { html: `Solve ${B(`${frac(p, dA)} + ${frac(q, dB)} = 1`)}.`, answer: `${s1}, ${s2}`, check: { type: 'pair', values: [s1, s2] }, answerHtml: B(`<i>x</i> = ${ds(s1)} or <i>x</i> = ${ds(s2)}`), format: 'Give both solutions separated by a comma, e.g. 3, -5', hint: 'Multiply every term by both denominators.',
          steps: [`Multiply by (${dA})(${dB}): ${p}(${dB}) + ${q}(${dA}) = (${dA})(${dB})`, `${tx(lin(p + q, p * b + q * a))} = ${tx(quad(1, a + b, a * b))}`, `${tx(`${quad(1, B1, C1)}=0`)}`, `(<i>x</i>${pm(-s1)})(<i>x</i>${pm(-s2)}) = 0`.replace(/<i>x<\/i> \+ 0|<i>x<\/i> − 0/g, '<i>x</i>'), `<i>x</i> = ${B(ds(s1))} or <i>x</i> = ${B(ds(s2))}`] };
      }
      if (t === 1) {
        let m, n, a, b, x0, k; do { m = r.int(2, 6); n = r.int(2, 6); a = r.int(1, 9); b = r.int(1, 9); x0 = r.int(-5, 12); k = (n * (x0 + a) + m * (x0 - b)) / (m * n); } while (m === n || !Number.isInteger(k) || k === 0);
        return { html: `Solve ${B(`${frac(tx(lin(1, a)), m)} + ${frac(tx(lin(1, -b)), n)} = ${ds(k)}`)}.`, answerLabel: 'x =', ...nAns(x0), hint: `Multiply every term by ${m * n}.`,
          steps: [`Multiply by ${m * n}: ${n}(${tx(lin(1, a))}) + ${m}(${tx(lin(1, -b))}) = ${ds(k * m * n)}`, `${tx(lin(n, n * a))} + ${tx(lin(m, -m * b)).replace(/^−/, '(−') + (m * b < 0 ? ')' : '')} = ${ds(k * m * n)}`.replace(' + (−', ' + (−'), `${m + n}<i>x</i>${pm(n * a - m * b)} = ${ds(k * m * n)}`.replace(' + 0', '').replace(' − 0', ''), `${m + n}<i>x</i> = ${ds((m + n) * x0)}, so <i>x</i> = ${B(ds(x0))}`] };
      }
      if (t === 2) {
        let x, k, d, T; do { x = r.int(4, 25); k = r.int(2, 8); d = 5 * r.int(2, 12); T = d / x + d / (x + k); } while (!Number.isInteger(rnd(T * 60, 6)) || T > 8);
        const H = Math.floor(rnd(T, 6)), M = Math.round((T - H) * 60); const tStr = `${H ? `${H} hour${H > 1 ? 's' : ''}` : ''}${H && M ? ' ' : ''}${M ? `${M} minutes` : ''}`;
        const [who, out, back] = r.pick([['Sam cycles', 'there', 'home'], ['A walker hikes', 'to a lake', 'back'], ['A rower rows', 'upstream', 'back downstream'], ['A runner runs', 'out', 'back']]);
        const Tq = ds(rnd(T, 6));
        return { html: `${who} ${d} km ${out} at <i>x</i> km/h and ${d} km ${back} at (<i>x</i> + ${k}) km/h. The total time is ${B(tStr)}.<br>Form and solve an equation to find <i>x</i>.`, answerLabel: 'x =', unit: 'km/h', ...nAns(x, { unit: 'km/h' }), hint: 'Time = distance ÷ speed for each part; add them.',
          steps: [`${frac(d, '<i>x</i>')} + ${frac(d, `<i>x</i> + ${k}`)} = ${Tq}`, `Multiply by <i>x</i>(<i>x</i> + ${k}): ${d}(<i>x</i> + ${k}) + ${d}<i>x</i> = ${Tq}<i>x</i>(<i>x</i> + ${k})`, `${Tq}<i>x</i><sup>2</sup>${pm(rnd(T * k - 2 * d, 6))}<i>x</i> − ${d * k} = 0`, `Solve: <i>x</i> = ${x} (the other solution is negative, so reject it)`, `<i>x</i> = ${B(x)} km/h`] };
      }
      if (t === 3) {
        let a, b, p, q; do { a = r.int(1, 7); b = r.int(1, 7); p = r.nz(-6, 6); q = r.nz(-6, 6); } while (p === q);
        const c = a + b, dd = a * q + b * p;
        return { html: `${B(`${frac(a, tx(lin(1, p)))} + ${frac(b, tx(lin(1, q)))}`)} can be written as ${B(frac('<i>cx</i> + <i>d</i>', `(${tx(lin(1, p))})(${tx(lin(1, q))})`))}.<br>Work out the values of <i>c</i> and <i>d</i>.`, answer: `${c}, ${dd}`, check: { type: 'pair', values: [c, dd], ordered: true }, answerHtml: B(`c = ${c}, d = ${ds(dd)}`), format: 'Type c then d, e.g. 5, -3', hint: 'Use the common denominator and expand the numerator.',
          steps: [`Numerator: ${a}(${tx(lin(1, q))}) + ${b}(${tx(lin(1, p))})`, `= ${tx(lin(a, a * q))} + ${tx(lin(b, b * p)).replace(/^−/, '(−')}${b * p < 0 && b !== 1 ? '' : ''}`.replace(/\(−(.*)$/, '(−$1)').replace(/\+ \(−(.*)\)$/, (m0, g1) => `− ${g1.replace(/ − /, ' + ')}`), `= ${tx(lin(c, dd))}`, `${B(`c = ${c}, d = ${ds(dd)}`)}`] };
      }
      let a, b, c0; do { a = r.int(1, 8); b = r.nz(-8, 8); c0 = r.nz(-9, 12); } while (b === a || b === -a || c0 + b === 0 || c0 === a || c0 === -a);
      return { html: `Simplify ${B(frac(tx(polyT([[1, 'x^2'], [-a * a, '']])), tx(quad(1, a + b, a * b))))} fully, and hence find its value when ${B(`<i>x</i> = ${ds(c0)}`)}.<br>Give your answer as a fraction in its simplest form (or a whole number).`, ...fAns(c0 - a, c0 + b), hint: 'Factorise the top (difference of two squares) and the bottom, then cancel.',
        steps: [`Top: (${tx(lin(1, a))})(${tx(lin(1, -a))}); bottom: (${tx(lin(1, a))})(${tx(lin(1, b))})`, `Cancel (${tx(lin(1, a))}): ${frac(tx(lin(1, -a)), tx(lin(1, b)))}`, `Substitute <i>x</i> = ${ds(c0)}: ${frac(`${ds(c0)} − ${a}`, `${ds(c0)}${pm(b)}`)} = ${frac(ds(c0 - a), ds(c0 + b))}`, `= ${B(fracS(c0 - a, c0 + b))}`] };
    }],
]);

// ---------------------------------------------------------------- volume of spheres, cones, pyramids
addStyles('y11-volume-spheres-cones', [
  ['Problems in context',
    'Break the problem into steps: work out each volume you need (sphere 4/3πr³, cone 1/3πr²h, pyramid 1/3 × base × height), then use it — add parts together, share it out, divide by a rate, or multiply by a density.',
    (r) => {
      const t = r.int(0, 5);
      if (t === 0) {
        let r1c, h1, r2c, dep; do { r1c = r.int(3, 10); h1 = r.int(6, 24); r2c = r.int(4, 12); dep = r1c * r1c * h1 / (3 * r2c * r2c); } while (dep < 1);
        return { html: `A cone-shaped funnel, with radius ${B(r1c + ' cm')} and height ${B(h1 + ' cm')}, is completely full of water. All the water is poured into an empty cylinder with radius ${B(r2c + ' cm')}.<br>Work out the depth of the water in the cylinder. Give your answer to 1 decimal place.`, unit: 'cm', ...nAns(dep, { dp: 1, unit: 'cm' }), format: dpFmt(1), hint: 'Volume of water stays the same: πr²d = ⅓πr²h.',
          steps: [`Volume of cone = ⅓ × π × ${r1c}<sup>2</sup> × ${h1} = ${fx(Math.PI * r1c * r1c * h1 / 3, 3)}… cm³`, `In the cylinder: π × ${r2c}<sup>2</sup> × d = ${fx(Math.PI * r1c * r1c * h1 / 3, 3)}…`, `d = ${fx(Math.PI * r1c * r1c * h1 / 3, 3)}… ÷ ${fx(Math.PI * r2c * r2c, 3)}… = ${fx(dep, 4)}…`, `Depth = ${B(r1(dep))} cm`] };
      }
      if (t === 1) {
        const R0 = r.int(5, 15), sm = r.int(1, 3); const n = Math.floor(rnd(R0 ** 3 / sm ** 3, 9)); const what = r.pick(['ball bearings', 'beads', 'marbles', 'pellets']);
        return { html: `A solid metal sphere of radius ${B(R0 + ' cm')} is melted down and recast into small spherical ${what}, each of radius ${B(sm + ' cm')}.<br>What is the greatest number of ${what} that can be made?`, unit: what, ...nAns(n), hint: 'Divide the big volume by one small volume — the 4/3π cancels.',
          steps: [`Big sphere = ${frac(4, 3)}π × ${R0}<sup>3</sup> = ${fx(4 / 3 * Math.PI * R0 ** 3, 2)}… cm³`, `Small sphere = ${frac(4, 3)}π × ${sm}<sup>3</sup> = ${fx(4 / 3 * Math.PI * sm ** 3, 4)}… cm³`, `${R0}<sup>3</sup> ÷ ${sm}<sup>3</sup> = ${ds(rnd(R0 ** 3 / sm ** 3, 3))}`, `Greatest whole number: ${B(n)}`] };
      }
      if (t === 2) {
        const rr = r.int(2, 5), h = r.int(8, 15); const V = Math.PI * rr * rr * h / 3 + 2 / 3 * Math.PI * rr ** 3; const obj = r.pick(['An ice-cream', 'A toy', 'A spinning top', 'A cake decoration']);
        return { html: `${obj} is made from a cone of radius ${B(rr + ' cm')} and height ${B(h + ' cm')}, with a hemisphere of the same radius on top.<br>Work out the total volume. Give your answer to 1 decimal place.`, unit: 'cm³', ...nAns(V, { dp: 1, unit: 'cm³' }), format: dpFmt(1), hint: 'Add the cone (⅓πr²h) and the hemisphere (⅔πr³).',
          steps: [`Cone = ⅓ × π × ${rr}<sup>2</sup> × ${h} = ${fx(Math.PI * rr * rr * h / 3, 4)}…`, `Hemisphere = ⅔ × π × ${rr}<sup>3</sup> = ${fx(2 / 3 * Math.PI * rr ** 3, 4)}…`, `Total = ${fx(V, 4)}…`, `= ${B(r1(V))} cm³`] };
      }
      if (t === 3) {
        const rr = r.int(3, 12); const [mat, rho] = r.pick([['aluminium', 2.7], ['steel', 7.9], ['copper', 8.9], ['lead', 11.3], ['glass', 2.5]]); const V = 4 / 3 * Math.PI * rr ** 3; const kg = V * rho / 1000;
        return { html: `A solid ${mat} ball has radius ${B(rr + ' cm')}. The density of ${mat} is ${B(ds(rho) + ' g/cm³')}.<br>Work out the mass of the ball in kilograms. Give your answer to 2 decimal places.`, unit: 'kg', ...nAns(kg, { dp: 2, unit: 'kg' }), format: dpFmt(2), hint: 'Mass = density × volume, then divide by 1000 for kg.',
          steps: [`Volume = ${frac(4, 3)} × π × ${rr}<sup>3</sup> = ${fx(V, 3)}… cm³`, `Mass = ${ds(rho)} × ${fx(V, 3)}… = ${fx(V * rho, 2)}… g`, `÷ 1000 = ${fx(kg, 4)}… kg`, `= ${B(r2(kg))} kg`] };
      }
      if (t === 4) {
        const rr = r.int(6, 15), k = r.int(10, 50); const V = 2 / 3 * Math.PI * rr ** 3; const T = V / k / 60;
        return { html: `A hemispherical bowl has an internal radius of ${B(rr + ' cm')}. Water flows into the empty bowl at ${B(k + ' cm³')} per second.<br>How many minutes does it take to fill the bowl? Give your answer to 1 decimal place.`, unit: 'minutes', ...nAns(T, { dp: 1, unit: 'minutes' }), format: dpFmt(1), hint: 'Time = volume ÷ rate. Convert seconds to minutes.',
          steps: [`Volume = ⅔ × π × ${rr}<sup>3</sup> = ${fx(V, 3)}… cm³`, `Time = ${fx(V, 3)}… ÷ ${k} = ${fx(V / k, 2)}… seconds`, `÷ 60 = ${fx(T, 3)}… minutes`, `= ${B(r1(T))} minutes`] };
      }
      const b = r.int(4, 12), h = r.int(5, 15), p = r.pick([0.8, 1.2, 1.5, 2, 2.5]); const V = b * b * h / 3; const cost = V * p / 100;
      return { html: `A solid chocolate pyramid has a square base of side ${B(b + ' cm')} and a perpendicular height of ${B(h + ' cm')}. The chocolate costs ${B(ds(p) + 'p')} per cm³.<br>Work out the cost of the chocolate used, in pounds. Give your answer to the nearest penny.`, ...nAns(cost, { money: true }), hint: 'Volume = ⅓ × base area × height.',
        steps: [`Volume = ⅓ × ${b}<sup>2</sup> × ${h} = ${ds(rnd(V, 4))} cm³`, `Cost = ${ds(rnd(V, 4))} × ${ds(p)}p = ${ds(rnd(V * p, 4))}p`, `= ${B(money(cost))}`] };
    }],
  ['Reverse problem',
    'Start from the volume formula, substitute everything you know, then rearrange to find the missing length. You may need to divide by π, then take a square root or a cube root at the end.',
    (r) => {
      const t = r.int(0, 4);
      if (t === 0) {
        const V = r.int(100, 5000); const rr = Math.cbrt(3 * V / (4 * Math.PI)); const obj = r.pick(['football', 'spherical water tank', 'globe', 'ball of wool']);
        return { html: `A ${obj} is a sphere with a volume of ${B(commas(String(V)) + ' cm³')}.<br>Work out its radius. Give your answer to 1 decimal place.`, unit: 'cm', ...nAns(rr, { dp: 1, unit: 'cm' }), format: dpFmt(1), hint: 'r³ = 3V ÷ 4π.',
          steps: [`${frac(4, 3)}π<i>r</i><sup>3</sup> = ${V}`, `<i>r</i><sup>3</sup> = ${frac(`3 × ${V}`, '4π')} = ${fx(rr ** 3, 3)}…`, `<i>r</i> = ∛${fx(rr ** 3, 3)}… = ${fx(rr, 4)}…`, `<i>r</i> = ${B(r1(rr))} cm`] };
      }
      if (t === 1) {
        const rr = r.int(2, 12), V = r.int(50, 3000); const h = 3 * V / (Math.PI * rr * rr);
        return { html: `A cone has a volume of ${B(commas(String(V)) + ' cm³')} and a base radius of ${B(rr + ' cm')}.<br>Work out its perpendicular height. Give your answer to 1 decimal place.`, unit: 'cm', ...nAns(h, { dp: 1, unit: 'cm' }), format: dpFmt(1), hint: 'h = 3V ÷ (πr²).',
          steps: [`⅓ × π × ${rr}<sup>2</sup> × <i>h</i> = ${V}`, `<i>h</i> = ${frac(`3 × ${V}`, `π × ${rr * rr}`)}`, `<i>h</i> = ${fx(h, 4)}…`, `<i>h</i> = ${B(r1(h))} cm`] };
      }
      if (t === 2) {
        const h = r.int(4, 30), V = r.int(50, 3000); const rr = Math.sqrt(3 * V / (Math.PI * h)); const obj = r.pick(['traffic cone', 'paper cup shaped like a cone', 'conical pile of sand', 'conical party hat']);
        return { html: `A ${obj} has a volume of ${B(commas(String(V)) + ' cm³')} and a perpendicular height of ${B(h + ' cm')}.<br>Work out the radius of its base. Give your answer to 1 decimal place.`, unit: 'cm', ...nAns(rr, { dp: 1, unit: 'cm' }), format: dpFmt(1), hint: 'r² = 3V ÷ (πh).',
          steps: [`⅓ × π × <i>r</i><sup>2</sup> × ${h} = ${V}`, `<i>r</i><sup>2</sup> = ${frac(`3 × ${V}`, `π × ${h}`)} = ${fx(rr * rr, 4)}…`, `<i>r</i> = ${sq(fx(rr * rr, 4) + '…')} = ${fx(rr, 4)}…`, `<i>r</i> = ${B(r1(rr))} cm`] };
      }
      if (t === 3) {
        const h = r.int(3, 20), V = r.int(30, 2000); const b = Math.sqrt(3 * V / h);
        return { html: `A square-based pyramid has a volume of ${B(commas(String(V)) + ' cm³')} and a perpendicular height of ${B(h + ' cm')}.<br>Work out the length of a side of its base. Give your answer to 1 decimal place.`, unit: 'cm', ...nAns(b, { dp: 1, unit: 'cm' }), format: dpFmt(1), hint: 'Base area = 3V ÷ h.',
          steps: [`⅓ × <i>b</i><sup>2</sup> × ${h} = ${V}`, `<i>b</i><sup>2</sup> = ${frac(`3 × ${V}`, h)} = ${ds(rnd(3 * V / h, 4))}`, `<i>b</i> = ${sq(ds(rnd(3 * V / h, 4)))} = ${fx(b, 4)}…`, `<i>b</i> = ${B(r1(b))} cm`] };
      }
      const R0 = r.int(2, 10), H = r.int(3, 20); const rr = Math.cbrt(3 * R0 * R0 * H / 4);
      return { html: `A cylinder has radius ${B(R0 + ' cm')} and height ${B(H + ' cm')}. A sphere has the same volume as the cylinder.<br>Work out the radius of the sphere. Give your answer to 1 decimal place.`, unit: 'cm', ...nAns(rr, { dp: 1, unit: 'cm' }), format: dpFmt(1), hint: 'Set 4/3πr³ equal to πR²H; the π cancels.',
        steps: [`${frac(4, 3)}π<i>r</i><sup>3</sup> = π × ${R0}<sup>2</sup> × ${H}`, `<i>r</i><sup>3</sup> = ${frac(`3 × ${R0 * R0 * H}`, 4)} = ${ds(rnd(rr ** 3, 4))}`, `<i>r</i> = ∛${ds(rnd(rr ** 3, 4))} = ${fx(rr, 4)}…`, `<i>r</i> = ${B(r1(rr))} cm`] };
    }],
]);

// ---------------------------------------------------------------- circle theorems
addStyles('y11-circle-theorems', [
  ['Exam-style problem',
    'Exam questions chain two or three facts together. Mark the angles you can find on a sketch, and give a reason for every step: isosceles triangles from radii, angle at the centre, angles in a semicircle, cyclic quadrilaterals, tangents and the alternate segment theorem.',
    (r) => {
      const t = r.int(0, 5);
      if (t === 0) {
        const x = r.int(15, 70);
        return { html: `A, B and C are points on a circle with centre O. C lies on the major arc AB. Angle OAB = ${B(x + '°')}.<br>Work out the size of angle ACB.`, unit: '°', ...nAns(90 - x, { unit: '°' }), hint: 'OA = OB, so triangle OAB is isosceles.',
          steps: [`OA = OB (radii), so angle OBA = ${x}°`, `Angle AOB = 180° − 2 × ${x}° = ${180 - 2 * x}° (angles in a triangle)`, `Angle ACB = ${180 - 2 * x}° ÷ 2 = ${B((90 - x) + '°')} (angle at the centre is twice the angle at the circumference)`] };
      }
      if (t === 1) {
        const y = r.int(35, 80), z = r.int(20, 140 - y);
        return { html: `A, B and C are points on a circle. The line TA is a tangent to the circle at A. Angle TAB (between the tangent and the chord AB) = ${B(y + '°')} and angle CAB = ${B(z + '°')}, where C is on the opposite side of AB from T.<br>Work out the size of angle ABC.`, unit: '°', ...nAns(180 - y - z, { unit: '°' }), hint: 'Use the alternate segment theorem to find angle ACB.',
          steps: [`Angle ACB = ${y}° (alternate segment theorem)`, `Angles in triangle ABC add to 180°: angle ABC = 180° − ${y}° − ${z}°`, `Angle ABC = ${B((180 - y - z) + '°')}`] };
      }
      if (t === 2) {
        const x = r.int(30, 85);
        return { html: `A, B, C and D are points on a circle with centre O, and ABCD is a cyclic quadrilateral. Angle BOD (the angle at the centre, on the same side as C) = ${B(2 * x + '°')}.<br>Work out the size of angle BCD.`, unit: '°', ...nAns(180 - x, { unit: '°' }), hint: 'First find angle BAD, then use the cyclic quadrilateral.',
          steps: [`Angle BAD = ${2 * x}° ÷ 2 = ${x}° (angle at the centre is twice the angle at the circumference)`, `Opposite angles of a cyclic quadrilateral add to 180°`, `Angle BCD = 180° − ${x}° = ${B((180 - x) + '°')}`] };
      }
      if (t === 3) {
        const x = r.int(20, 70);
        return { html: `AB is a diameter of a circle and C is a point on the circle. TA is the tangent to the circle at A, with T and C on the same side of AB. Angle ABC = ${B(x + '°')}.<br>Work out the size of angle CAT.`, unit: '°', ...nAns(x, { unit: '°' }), hint: 'The angle in a semicircle is 90°, and the tangent meets the diameter at 90°.',
          steps: [`Angle ACB = 90° (angle in a semicircle)`, `Angle CAB = 180° − 90° − ${x}° = ${90 - x}°`, `Angle BAT = 90° (tangent ⟂ radius), so angle CAT = 90° − ${90 - x}° = ${B(x + '°')}`] };
      }
      if (t === 4) {
        const p = 2 * r.int(15, 55);
        return { html: `PA and PB are tangents to a circle with centre O, touching it at A and B. C is a point on the major arc AB. Angle APB = ${B(p + '°')}.<br>Work out the size of angle ACB.`, unit: '°', ...nAns(90 - p / 2, { unit: '°' }), hint: 'Find angle AOB using quadrilateral OAPB first.',
          steps: [`Angles OAP and OBP are 90° (tangent ⟂ radius)`, `Angle AOB = 360° − 90° − 90° − ${p}° = ${180 - p}°`, `Angle ACB = ${180 - p}° ÷ 2 = ${B((90 - p / 2) + '°')} (angle at the centre is twice the angle at the circumference)`] };
      }
      const p = 2 * r.int(10, 35);
      return { html: `PA is a tangent to a circle with centre O at the point A. The straight line from P through O meets the circle again at B, on the far side of O. Angle APO = ${B(p + '°')}.<br>Work out the size of angle ABO.`, unit: '°', ...nAns((90 - p) / 2, { unit: '°' }), hint: 'Find angle AOP, then use the isosceles triangle AOB.',
        steps: [`Angle OAP = 90° (tangent ⟂ radius), so angle AOP = 180° − 90° − ${p}° = ${90 - p}°`, `OA = OB (radii), so triangle AOB is isosceles with angle OAB = angle OBA`, `Angle AOP is the exterior angle of triangle AOB: 2 × angle ABO = ${90 - p}°`, `Angle ABO = ${B(ds((90 - p) / 2) + '°')}`] };
    }],
]);

// ---------------------------------------------------------------- quadratic inequalities
addStyles('y11-quadratic-inequalities', [
  ['Exam-style problem',
    'Solve the inequality first: find the roots, sketch the U-shaped graph and decide whether you need the part below the axis (between the roots) or above it (outside the roots). Then answer the actual question, e.g. count the integers or find the largest one.',
    (r) => {
      const t = r.int(0, 4);
      if (t === 0 || t === 1) {
        let p, q; do { p = r.int(-8, 5); q = r.int(-4, 10); } while (q - p < 3);
        const strict = r.chance(); const sym = strict ? '&lt;' : '≤'; const lhs = tx(quad(1, -(p + q), p * q));
        if (t === 0) {
          const n = strict ? q - p - 1 : q - p + 1;
          return { html: `How many integers satisfy ${B(`${lhs} ${sym} 0`)}?`, ...nAns(n), hint: 'Find the roots, then count the integers between them.',
            steps: [`Roots: ${tx(`(${lin(1, -p)})(${lin(1, -q)})=0`)}, so <i>x</i> = ${ds(p)} or <i>x</i> = ${ds(q)}`, `Solution: ${ds(p)} ${sym} <i>x</i> ${sym} ${ds(q)}`, `Integers: ${strict ? `${ds(p + 1)} to ${ds(q - 1)}` : `${ds(p)} to ${ds(q)}`}, which is ${B(n)} integers`] };
        }
        const big = r.chance(); const v = big ? (strict ? q - 1 : q) : (strict ? p + 1 : p);
        return { html: `<i>n</i> is an integer and ${B(`${tx(quad(1, -(p + q), p * q, 'n'))} ${sym} 0`)}.<br>Find the ${big ? 'largest' : 'smallest'} possible value of <i>n</i>.`, answerLabel: 'n =', ...nAns(v), hint: 'The graph is below the axis between the roots.',
          steps: [`Roots: <i>n</i> = ${ds(p)} and <i>n</i> = ${ds(q)}`, `Solution: ${ds(p)} ${sym} <i>n</i> ${sym} ${ds(q)}`, `${big ? 'Largest' : 'Smallest'} integer: <i>n</i> = ${B(ds(v))}`] };
      }
      if (t === 2) {
        let T, t1; do { T = r.int(4, 10); t1 = r.int(1, 4); } while (2 * t1 >= T);
        const H = 5 * t1 * (T - t1); const dur = T - 2 * t1; const t2 = T - t1; const who = r.pick(['A ball', 'A water rocket', 'A stone', 'A beanbag']);
        return { html: `${who} is launched upwards. Its height, <i>h</i> m, after <i>t</i> seconds is ${B(`<i>h</i> = ${5 * T}<i>t</i> − 5<i>t</i><sup>2</sup>`)}.<br>By solving a quadratic inequality, find for how many seconds the height is more than ${B(H + ' m')}.`, unit: 's', ...nAns(dur, { unit: 's' }), hint: `Solve ${5 * T}t − 5t² > ${H}.`,
          steps: [`${5 * T}<i>t</i> − 5<i>t</i><sup>2</sup> &gt; ${H} → 5<i>t</i><sup>2</sup> − ${5 * T}<i>t</i> + ${H} &lt; 0 → ${tx(quad(1, -T, t1 * t2, 't'))} &lt; 0`, `(<i>t</i> − ${t1})(<i>t</i> − ${t2}) &lt; 0, so ${t1} &lt; <i>t</i> &lt; ${t2}`, `Time above ${H} m = ${t2} − ${t1} = ${B(dur)} seconds`] };
      }
      if (t === 3) {
        let a, A, root; do { a = r.int(1, 8); A = r.int(20, 200); root = (-a + Math.sqrt(a * a + 4 * A)) / 2; } while (Math.abs(root - Math.round(root)) < 0.02);
        const n = Math.floor(root); const obj = r.pick(['rectangular photo', 'rectangular pen', 'rectangular rug', 'rectangular flower bed']);
        return { html: `A ${obj} has width <i>x</i> cm and length (<i>x</i> + ${a}) cm. Its area must be ${B(`less than ${A} cm²`)}. <i>x</i> is a whole number.<br>Find the largest possible value of <i>x</i>.`, answerLabel: 'x =', ...nAns(n), hint: `Solve x(x + ${a}) < ${A}.`,
          steps: [`<i>x</i>(<i>x</i> + ${a}) &lt; ${A} → ${tx(quad(1, a, -A))} &lt; 0`, `Positive root: <i>x</i> = ${frac(`−${a} + ${sq(a * a + 4 * A)}`, 2)} = ${fx(root, 3)}…`, `So 0 &lt; <i>x</i> &lt; ${fx(root, 3)}…; largest whole number: <i>x</i> = ${B(n)}`] };
      }
      let p, q; do { p = r.int(-7, 4); q = r.int(-3, 9); } while (q - p < 3);
      const ints = []; for (let i = p + 1; i < q; i++) ints.push(i); const s = sum(ints);
      return { html: `Work out the sum of all the integers that satisfy ${B(`${tx(quad(1, -(p + q), p * q))} &lt; 0`)}.`, ...nAns(s), hint: 'Solve the inequality, list the integers, then add them.',
        steps: [`Roots: <i>x</i> = ${ds(p)} and <i>x</i> = ${ds(q)}, so ${ds(p)} &lt; <i>x</i> &lt; ${ds(q)}`, `Integers: ${ints.map(ds).join(', ')}`, `Sum = ${B(ds(s))}`] };
    }],
]);

// ---------------------------------------------------------------- growth & decay
addStyles('y11-growth-decay', [
  ['Problems in context',
    'Write each percentage change as a multiplier (e.g. a 15% decrease is × 0.85). Use a power for repeated changes, and chain different multipliers together when the rate changes. Only round at the very end.',
    (r) => {
      const t = r.int(0, 4);
      if (t === 0) {
        const V = 500 * r.int(16, 60), r1p = r.int(15, 25), r2p = r.int(8, 14), n = r.int(3, 6); const m1 = 1 - r1p / 100, m2 = 1 - r2p / 100; const v = V * m1 * m2 ** (n - 1);
        return { html: `A new car costs ${B(money(V))}. Its value falls by ${B(r1p + '%')} in the first year and then by ${B(r2p + '%')} each year after that.<br>Work out the value of the car after ${B(n + ' years')}. Give your answer to the nearest penny.`, ...nAns(v, { money: true }), hint: `Use ${ps(m1)} once, then ${ps(m2)} for the other ${n - 1} years.`,
          steps: [`Multipliers: ${ps(m1)} for year 1, ${ps(m2)} for each of the next ${n - 1} years`, `Value = ${money(V)} × ${ps(m1)} × ${ps(m2)}<sup>${n - 1}</sup>`, `= ${B(money(v))}`] };
      }
      if (t === 1) {
        let P1, P2, a, b, n, d; do { P1 = 100 * r.int(200, 600); P2 = P1 - 100 * r.int(10, 80); a = r.int(1, 3); b = a + r.int(2, 4); n = r.int(5, 15); d = P2 * (1 + b / 100) ** n - P1 * (1 + a / 100) ** n; } while (d < 50 || Math.abs(d - Math.round(d)) > 0.45);
        return { html: `Town A has a population of ${B(commas(String(P1)))}, which is growing by ${B(a + '%')} a year. Town B has a population of ${B(commas(String(P2)))}, which is growing by ${B(b + '%')} a year.<br>Assuming these rates continue, how many more people will live in Town B than in Town A after ${B(n + ' years')}? Give your answer to the nearest whole number.`, ...nAns(d, { whole: true }), answerHtml: B(commas(String(Math.round(d)))), format: 'Give your answer to the nearest whole number', hint: 'Work out each population separately, then subtract.',
          steps: [`Town A: ${commas(String(P1))} × ${ps(1 + a / 100)}<sup>${n}</sup> = ${fx(P1 * (1 + a / 100) ** n, 2)}…`, `Town B: ${commas(String(P2))} × ${ps(1 + b / 100)}<sup>${n}</sup> = ${fx(P2 * (1 + b / 100) ** n, 2)}…`, `Difference = ${fx(d, 2)}… ≈ ${B(commas(String(Math.round(d))))}`] };
      }
      if (t === 2) {
        const D = r.pick([100, 200, 250, 300, 400, 500]), rp = r.pick([10, 12, 15, 18, 20, 25]), n = r.int(2, 8); const m = 1 - rp / 100; const left = D * m ** n; const gone = D - left;
        return { html: `A patient is given ${B(D + ' mg')} of a medicine. Each hour, the amount of medicine in the bloodstream falls by ${B(rp + '%')}.<br>How much of the medicine has left the bloodstream after ${B(n + ' hours')}? Give your answer to 1 decimal place.`, unit: 'mg', ...nAns(gone, { dp: 1, unit: 'mg' }), format: dpFmt(1), hint: 'Find the amount still there, then subtract from the starting amount.',
          steps: [`Multiplier = 1 − ${rp}/100 = ${ps(m)}`, `Amount left = ${D} × ${ps(m)}<sup>${n}</sup> = ${fx(left, 4)}… mg`, `Amount gone = ${D} − ${fx(left, 4)}… = ${fx(gone, 4)}…`, `= ${B(r1(gone))} mg`] };
      }
      if (t === 3) {
        const r1p = r.int(20, 40), r2p = r.int(8, 20), n = r.int(2, 5); const pc = 100 * (1 - r1p / 100) * (1 - r2p / 100) ** (n - 1); const item = r.pick(['phone', 'laptop', 'games console', 'e-bike']);
        return { html: `A ${item} loses ${B(r1p + '%')} of its value in the first year and ${B(r2p + '%')} of its value in each year after that.<br>After ${B(n + ' years')}, what percentage of its original value is it worth? Give your answer to 1 decimal place.`, unit: '%', ...nAns(pc, { dp: 1, unit: '%' }), format: dpFmt(1), hint: 'You do not need the price: multiply the multipliers and turn into a percentage.',
          steps: [`Overall multiplier = ${ps(1 - r1p / 100)} × ${ps(1 - r2p / 100)}<sup>${n - 1}</sup> = ${fx(pc / 100, 5)}…`, `As a percentage: ${fx(pc, 3)}…%`, `= ${B(r1(pc))}%`] };
      }
      const P = 5000 * r.int(30, 90), up = r.int(2, 8), n1 = r.int(2, 5), down = r.int(3, 12); const v = P * (1 + up / 100) ** n1 * (1 - down / 100);
      return { html: `A house was bought for ${B(money(P))}. Its value rose by ${B(up + '%')} each year for ${B(n1 + ' years')}, then fell by ${B(down + '%')} in the following year.<br>Work out the value of the house at the end of this time. Give your answer to the nearest pound.`, ...nAns(v, { whole: true }), answerLabel: '£', answerHtml: B('£' + commas(String(Math.round(v)))), format: 'Give your answer to the nearest pound', hint: `Use ${ps(1 + up / 100)}<sup>${n1}</sup> and then × ${ps(1 - down / 100)}.`,
        steps: [`Value after ${n1} years = ${money(P)} × ${ps(1 + up / 100)}<sup>${n1}</sup> = ${money(P * (1 + up / 100) ** n1)}`, `After the fall: × ${ps(1 - down / 100)} = ${money(v)}`, `≈ ${B('£' + commas(String(Math.round(v))))}`] };
    }],
  ['Reverse problem',
    'If you know the final amount, divide by the multiplier (raised to the number of periods) to get back to the start. To find an unknown rate, find the multiplier first — e.g. the square root of (final ÷ start) over two years — then turn it into a percentage.',
    (r) => {
      const t = r.int(0, 3);
      if (t === 0) {
        const X = 100 * r.int(80, 900), rp = r.pick([2, 3, 4, 5, 6, 8]), n = r.int(3, 10); const P0 = X / (1 + rp / 100) ** n;
        const what = r.pick([['The population of a town', 'people'], ['The number of members of a gym', 'members'], ['The number of visitors to a museum each year', 'visitors'], ['The number of trees in a forest', 'trees']]);
        return { html: `${what[0]} has increased by ${B(rp + '%')} each year for the last ${B(n + ' years')}. It is now ${B(commas(String(X)))}.<br>What was it ${n} years ago? Give your answer to the nearest whole number.`, ...nAns(P0, { whole: true }), answerHtml: B(commas(String(Math.round(P0)))), format: 'Give your answer to the nearest whole number', hint: `Divide by ${ps(1 + rp / 100)}<sup>${n}</sup>.`,
          steps: [`Original × ${ps(1 + rp / 100)}<sup>${n}</sup> = ${commas(String(X))}`, `Original = ${commas(String(X))} ÷ ${ps(1 + rp / 100)}<sup>${n}</sup> = ${fx(P0, 2)}…`, `≈ ${B(commas(String(Math.round(P0))))} ${what[1]}`] };
      }
      if (t === 1) {
        const A = 10000 * r.int(1, 6), rp = r.int(4, 30), down = r.chance(0.6); const m = down ? 1 - rp / 100 : 1 + rp / 100; const Bv = rnd(A * m * m, 2);
        const item = down ? r.pick(['A van', 'A tractor', 'A boat', 'A machine']) : r.pick(['A painting', 'A vintage watch', 'A rare coin collection', 'A plot of land']);
        return { html: `${item} was worth ${B(money(A))}. Its value ${down ? 'fell' : 'rose'} by the same percentage each year, and after 2 years it was worth ${B(money(Bv))}.<br>Work out the yearly percentage ${down ? 'decrease' : 'increase'}.`, unit: '%', ...nAns(rp, { unit: '%' }), hint: 'Multiplier² = new value ÷ old value.',
          steps: [`Multiplier² = ${money(Bv)} ÷ ${money(A)} = ${ps(m * m)}`, `Multiplier = ${sq(ps(m * m))} = ${ps(m)}`, `${down ? `1 − ${ps(m)}` : `${ps(m)} − 1`} = ${ps(rp / 100)}, so the rate is ${B(rp + '%')}`] };
      }
      if (t === 2) {
        const X = 50 * r.int(60, 500), rp = r.pick([10, 12, 15, 18, 20, 25]), n = r.int(2, 6); const V = X / (1 - rp / 100) ** n; const item = r.pick(['car', 'motorbike', 'caravan', 'piano']);
        return { html: `A ${item} loses ${B(rp + '%')} of its value each year. After ${B(n + ' years')} it is worth ${B(money(X))}.<br>Work out its original value. Give your answer to the nearest penny.`, ...nAns(V, { money: true }), hint: `Divide by ${ps(1 - rp / 100)}<sup>${n}</sup>.`,
          steps: [`Multiplier = ${ps(1 - rp / 100)}`, `Original × ${ps(1 - rp / 100)}<sup>${n}</sup> = ${money(X)}`, `Original = ${money(X)} ÷ ${ps(1 - rp / 100)}<sup>${n}</sup> = ${B(money(V))}`] };
      }
      let A, Bv, n, rate; do { A = 10 * r.int(20, 500); n = r.int(3, 10); Bv = Math.round(A * r.int(115, 260) / 100); rate = ((Bv / A) ** (1 / n) - 1) * 100; } while (Math.abs(rate * 10 - Math.round(rate * 10)) > 0.45);
      const what = r.pick(['A colony of bees', 'The number of followers of a website', 'A population of rabbits', 'The number of cars on an island']);
      return { html: `${what} grew from ${B(commas(String(A)))} to ${B(commas(String(Bv)))} in ${B(n + ' years')}, growing by the same percentage each year.<br>Work out the yearly percentage increase. Give your answer to 1 decimal place.`, unit: '%', ...nAns(rate, { dp: 1, unit: '%' }), format: dpFmt(1), hint: `Multiplier = (${Bv} ÷ ${A}) to the power 1/${n}.`,
        steps: [`Multiplier<sup>${n}</sup> = ${commas(String(Bv))} ÷ ${commas(String(A))} = ${fx(Bv / A, 5)}…`, `Multiplier = <sup>${n}</sup>√(${fx(Bv / A, 5)}…) = ${fx(1 + rate / 100, 5)}…`, `Rate = ${fx(rate, 3)}…% = ${B(r1(rate))}%`] };
    }],
]);

// ---------------------------------------------------------------- vectors
addStyles('y11-vectors', [
  ['Problems in context',
    'A column vector describes a movement: the top number is across (right is positive) and the bottom number is up (up is positive). Add vectors to combine movements, multiply by a number to repeat them, and use Pythagoras for the length.',
    (r) => {
      const t = r.int(0, 5);
      if (t === 0) {
        const v = [r.nz(-6, 6), r.nz(-6, 6)], s = [r.int(-5, 5), r.int(-5, 5)], k = r.int(2, 6); const e = [s[0] + k * v[0], s[1] + k * v[1]]; const who = r.pick(['A robot', 'A boat', 'A drone', 'A toy car']);
        return { html: `${who} starts at the point (${ds(s[0])}, ${ds(s[1])}). Each minute it moves by the vector ${colvec(v[0], v[1])}.<br>Where is it after ${B(k + ' minutes')}? Give its coordinates.`, answer: `${e[0]}, ${e[1]}`, check: { type: 'pair', values: e, ordered: true }, answerHtml: B(`(${ds(e[0])}, ${ds(e[1])})`), format: 'Type the coordinates, e.g. 4, -7', hint: `Multiply the vector by ${k}, then add it to the start.`,
          steps: [`${k} × ${colvec(v[0], v[1])} = ${colvec(k * v[0], k * v[1])}`, `(${ds(s[0])} + ${br(k * v[0])}, ${ds(s[1])} + ${br(k * v[1])})`, `Position: ${B(`(${ds(e[0])}, ${ds(e[1])})`)}`] };
      }
      if (t === 1) {
        const v = [r.nz(-5, 5), r.nz(-5, 5)], k = r.int(2, 5); const d = k * Math.hypot(v[0], v[1]); const exact = Number.isInteger(rnd(d, 9));
        return { html: `A ship moves ${colvec(v[0], v[1])} kilometres every hour. How far is it from its starting point after ${B(k + ' hours')}?${exact ? '' : ' Give your answer to 1 decimal place.'}`, unit: 'km', ...(exact ? nAns(rnd(d, 9), { unit: 'km' }) : nAns(d, { dp: 1, unit: 'km' })), format: exact ? 'Type a number' : dpFmt(1), hint: 'Find the total displacement vector, then its magnitude.',
          steps: [`Displacement = ${k} × ${colvec(v[0], v[1])} = ${colvec(k * v[0], k * v[1])}`, `Distance = ${sq(`${br(k * v[0])}<sup>2</sup> + ${br(k * v[1])}<sup>2</sup>`)} = ${sq(k * k * (v[0] ** 2 + v[1] ** 2))}`, `= ${B(exact ? ds(rnd(d, 9)) : r1(d))} km`] };
      }
      if (t === 2) {
        const A = [r.int(-6, 6), r.int(-6, 6)], u = [r.nz(-5, 5), r.nz(-5, 5)], w = [r.nz(-5, 5), r.nz(-5, 5)]; if (u[0] * w[1] === u[1] * w[0]) w[0] += 1;
        const Bp = [A[0] + u[0], A[1] + u[1]], C = [Bp[0] + w[0], Bp[1] + w[1]]; const D = [A[0] + w[0], A[1] + w[1]];
        return { html: `ABCD is a parallelogram. A is (${ds(A[0])}, ${ds(A[1])}), B is (${ds(Bp[0])}, ${ds(Bp[1])}) and C is (${ds(C[0])}, ${ds(C[1])}).<br>Use vectors to find the coordinates of D.`, answer: `${D[0]}, ${D[1]}`, check: { type: 'pair', values: D, ordered: true }, answerHtml: B(`(${ds(D[0])}, ${ds(D[1])})`), format: 'Type the coordinates, e.g. 4, -7', hint: 'In a parallelogram, AD = BC as vectors.',
          steps: [`<b>BC</b> = ${colvec(`${ds(C[0])} − ${br(Bp[0])}`, `${ds(C[1])} − ${br(Bp[1])}`)} = ${colvec(w[0], w[1])}`, `<b>AD</b> = <b>BC</b>, so D = (${ds(A[0])} + ${br(w[0])}, ${ds(A[1])} + ${br(w[1])})`, `D = ${B(`(${ds(D[0])}, ${ds(D[1])})`)}`] };
      }
      if (t === 3) {
        const v = [r.nz(-6, 6), r.nz(-6, 6)]; const lam = r.pick([2, 3, 4, -2, -3]); const k = lam * v[0], y2 = lam * v[1];
        return { html: `The vector ${colvec('<i>k</i>', y2)} is parallel to the vector ${colvec(v[0], v[1])}.<br>Work out the value of <i>k</i>.`, answerLabel: 'k =', ...nAns(k), hint: 'Parallel vectors are multiples of each other.',
          steps: [`${ds(y2)} ÷ ${br(v[1])} = ${ds(lam)}, so the second vector is ${ds(lam)} × the first`, `<i>k</i> = ${ds(lam)} × ${br(v[0])}`, `<i>k</i> = ${B(ds(k))}`] };
      }
      if (t === 4) {
        const [a, b, c] = r.pick([[3, 4, 5], [5, 12, 13], [8, 15, 17], [6, 8, 10], [7, 24, 25], [9, 12, 15], [12, 16, 20], [20, 21, 29]]); const sw = r.chance(); const known = sw ? b : a, k = sw ? a : b;
        return { html: `The vector ${colvec(known, '<i>k</i>')} has magnitude ${B(c)}, and <i>k</i> is positive.<br>Work out the value of <i>k</i>.`, answerLabel: 'k =', ...nAns(k), hint: 'Magnitude² = top² + bottom².',
          steps: [`${known}<sup>2</sup> + <i>k</i><sup>2</sup> = ${c}<sup>2</sup>`, `<i>k</i><sup>2</sup> = ${c * c} − ${known * known} = ${k * k}`, `<i>k</i> = ${B(k)}`] };
      }
      const a = [r.int(-6, 6), r.int(-6, 6)]; let b; do { b = [a[0] + 3 * r.nz(-3, 3), a[1] + 3 * r.nz(-3, 3)]; } while (false);
      const P = [a[0] + (b[0] - a[0]) / 3, a[1] + (b[1] - a[1]) / 3];
      return { html: `${B('OA')} = ${colvec(a[0], a[1])} and ${B('OB')} = ${colvec(b[0], b[1])}. P is the point on AB such that AP : PB = 1 : 2.<br>Find ${B('OP')} as a column vector.`, answer: `${P[0]}, ${P[1]}`, check: { type: 'pair', values: P, ordered: true }, answerHtml: colvec(P[0], P[1]), format: 'Type the top number then the bottom number, e.g. 4, -7', hint: 'OP = OA + ⅓ AB.',
        steps: [`<b>AB</b> = <b>OB</b> − <b>OA</b> = ${colvec(b[0] - a[0], b[1] - a[1])}`, `<b>AP</b> = ⅓ <b>AB</b> = ${colvec((b[0] - a[0]) / 3, (b[1] - a[1]) / 3)}`, `<b>OP</b> = <b>OA</b> + <b>AP</b> = ${colvec(P[0], P[1])}`] };
    }],
]);

// ---------------------------------------------------------------- conditional probability
addStyles('y11-conditional-probability', [
  ['Exam-style problem',
    '“Given that” means you only look at part of the outcomes: the denominator becomes the size of that group. Without replacement, both the number of items and the number of that colour drop by one after each pick.',
    (r) => {
      const t = r.int(0, 5);
      if (t === 0) {
        const n = r.int(6, 15), k = r.int(2, n - 1); const [N, D] = simp(k * (k - 1), n * (n - 1)); const it = r.pick([['sweets', 'red'], ['counters', 'green'], ['socks', 'black'], ['pens', 'blue']]);
        return { html: `A bag contains ${B(n)} ${it[0]}. Some of them are ${it[1]}. Two ${it[0]} are taken at random without replacement. The probability that both are ${it[1]} is ${B(fracN(N, D))}.<br>How many ${it[1]} ${it[0]} are in the bag?`, ...nAns(k), hint: `If there are r ${it[1]} ${it[0]}, P(both) = r(r − 1) ÷ (${n} × ${n - 1}).`,
          steps: [`Let <i>r</i> be the number of ${it[1]} ${it[0]}: ${frac('<i>r</i>', n)} × ${frac('<i>r</i> − 1', n - 1)} = ${fracN(N, D)}`, `<i>r</i>(<i>r</i> − 1) = ${fracN(N, D)} × ${n * (n - 1)} = ${k * (k - 1)}`, `${k} × ${k - 1} = ${k * (k - 1)}, so <i>r</i> = ${B(k)}`] };
      }
      if (t === 1) {
        let Nn, a, b, c; do { Nn = r.int(25, 40); a = r.int(6, 22); b = r.int(6, 22); c = r.int(2, Math.min(a, b) - 1); } while (a + b - c > Nn);
        const [s1, s2] = r.pick([['play football', 'play tennis'], ['study French', 'study Spanish'], ['have a cat', 'have a dog'], ['sing in the choir', 'play in the orchestra']]); const mode = r.int(0, 2);
        const [num, den, q, why] = mode === 0 ? [c, b, `a student who does ${s2.replace(/^(play|study|have|sing|play in) /, '')}`, `Given ${s2}: ${b} students; of these ${c} also ${s1}`]
          : mode === 1 ? [c, a + b - c, '', `At least one: ${a} + ${b} − ${c} = ${a + b - c} students; of these ${c} do both`]
            : [a - c, Nn - b, '', `Not ${s2}: ${Nn} − ${b} = ${Nn - b} students; of these ${a} − ${c} = ${a - c} ${s1}`];
        const qs = mode === 0 ? `Given that the student chosen ${s2.replace(/^(\w+)/, (m0) => m0 + 's').replace('haves', 'has')}, find the probability that they also ${s1}.` : mode === 1 ? `Given that the student chosen does at least one of these, find the probability that they do both.` : `Given that the student chosen does ${B('not')} ${s2}, find the probability that they ${s1}.`;
        return { html: `In a class of ${B(Nn)} students, ${B(a)} ${s1}, ${B(b)} ${s2} and ${B(c)} do both. A student is chosen at random.<br>${qs}`, ...fAns(num, den), hint: 'Restrict to the “given” group first — that total is your denominator.',
          steps: [`Draw a Venn diagram: both = ${c}, only the first = ${a - c}, only the second = ${b - c}, neither = ${Nn - a - b + c}`, why, `P = ${frac(num, den)}${gcd(num, den) > 1 ? ` = ${B(fracS(num, den))}` : ''}`].map((s) => s.replace(q, q)) };
      }
      if (t === 2) {
        const a = r.int(3, 8), b = r.int(3, 8); const n = a + b; const N = a * (a - 1) * (a - 2) + b * (b - 1) * (b - 2), D = n * (n - 1) * (n - 2);
        return { html: `A box contains ${B(a)} red and ${B(b)} yellow counters. Three counters are taken at random without replacement.<br>Find the probability that all three counters are the same colour.`, ...fAns(N, D), hint: 'All red OR all yellow; the numbers drop by one each pick.',
          steps: [`P(RRR) = ${frac(a, n)} × ${frac(a - 1, n - 1)} × ${frac(a - 2, n - 2)} = ${frac(a * (a - 1) * (a - 2), D)}`, `P(YYY) = ${frac(b, n)} × ${frac(b - 1, n - 1)} × ${frac(b - 2, n - 2)} = ${frac(b * (b - 1) * (b - 2), D)}`, `Add: ${frac(N, D)}${gcd(N, D) > 1 ? ` = ${B(fracS(N, D))}` : ''}`] };
      }
      if (t === 3) {
        const a = r.int(2, 9), b = r.int(2, 9); const n = a + b; const N = n * (n - 1) - b * (b - 1), D = n * (n - 1); const it = r.pick([['raffle tickets', 'winning', 'losing'], ['batteries', 'faulty', 'working'], ['cards', 'picture', 'number'], ['apples', 'bruised', 'perfect']]);
        return { html: `A bag contains ${B(a)} ${it[1]} ${it[0]} and ${B(b)} ${it[2]} ${it[0]}. Two are taken at random without replacement.<br>Find the probability that ${B(`at least one is ${it[1]}`)}.`, ...fAns(N, D), hint: 'P(at least one) = 1 − P(none).',
          steps: [`P(neither is ${it[1]}) = ${frac(b, n)} × ${frac(b - 1, n - 1)} = ${frac(b * (b - 1), D)}`, `P(at least one) = 1 − ${frac(b * (b - 1), D)} = ${frac(N, D)}`, gcd(N, D) > 1 ? `= ${B(fracS(N, D))}` : `= ${B(frac(N, D))}`] };
      }
      if (t === 4) {
        const pr = r.int(1, 6) / 10, l1 = r.int(2, 7) / 10, l2 = r.int(1, 4) / 20; const v = rnd(pr * l1 + (1 - pr) * l2, 6);
        const [ev, out] = r.pick([['it rains', 'Jo is late for work'], ['the bus is late', 'Ravi misses his train'], ['there is ice on the road', 'there is an accident on a junction'], ['a team’s captain plays', 'the team wins']]);
        return { html: `The probability that ${ev} is ${B(ds(pr))}. If ${ev}, the probability that ${out} is ${B(ds(l1))}. If not, the probability that ${out} is ${B(ds(l2))}.<br>Work out the probability that ${out}.`, ...nAns(v), format: 'Type a decimal, e.g. 0.23', hint: 'Two routes on the tree diagram lead to the outcome; add them.',
          steps: [`P(${ev.replace(/^(it |the |there |a )/, '')} and outcome) = ${ds(pr)} × ${ds(l1)} = ${ds(rnd(pr * l1, 6))}`, `P(not, and outcome) = ${ds(rnd(1 - pr, 6))} × ${ds(l2)} = ${ds(rnd((1 - pr) * l2, 6))}`, `Total = ${ds(rnd(pr * l1, 6))} + ${ds(rnd((1 - pr) * l2, 6))} = ${B(ds(v))}`] };
      }
      const a = r.int(2, 9), b = r.int(2, 9); const n = a + b; const N = a * (a - 1), D = a * (a - 1) + b * (b - 1);
      return { html: `A jar contains ${B(a)} lemon and ${B(b)} orange sweets. Two sweets are taken at random without replacement.<br>Given that both sweets are the same flavour, find the probability that they are both lemon.`, ...fAns(N, D), hint: 'Find P(both lemon) and P(same flavour), then divide.',
        steps: [`P(LL) = ${frac(a, n)} × ${frac(a - 1, n - 1)} = ${frac(a * (a - 1), n * (n - 1))}`, `P(OO) = ${frac(b, n)} × ${frac(b - 1, n - 1)} = ${frac(b * (b - 1), n * (n - 1))}`, `P(same) = ${frac(D, n * (n - 1))}`, `P(LL | same) = ${frac(N, D)}${gcd(N, D) > 1 ? ` = ${B(fracS(N, D))}` : ''}`] };
    }],
]);

// ---------------------------------------------------------------- cumulative frequency
addStyles('y11-cumulative-frequency', [
  ['Exam-style problem',
    'From a cumulative frequency graph or table you estimate values by assuming the data is spread evenly within each class (reading between points). Use n ÷ 2 for the median and n ÷ 4, 3n ÷ 4 for the quartiles. An outlier is more than 1.5 × IQR beyond a quartile.',
    (r) => {
      const t = r.int(0, 4);
      const [vName, u, start, w] = r.pick([['Time, <i>t</i> (minutes)', 'minutes', 0, 10], ['Mass, <i>m</i> (grams)', 'g', 100, 20], ['Height, <i>h</i> (cm)', 'cm', 140, 10], ['Distance, <i>d</i> (km)', 'km', 0, 5]]);
      const sym = vName.match(/<i>(\w)<\/i>/)[1]; const subj = { minutes: 'people took', g: 'parcels had a mass', cm: 'plants had a height', km: 'runners ran' }[u];
      const fs = [r.int(2, 8), r.int(5, 15), r.int(8, 20), r.int(5, 15), r.int(2, 8)].map((f) => 2 * f); const cf = []; let c = 0; fs.forEach((f) => { c += f; cf.push(c); }); const n = c;
      const cls = fs.map((_, i) => [start + i * w, start + (i + 1) * w]);
      const tbl = table([[vName, 'Cumulative frequency'], ...cls.map(([a, b], i) => [`${a} &lt; <i>${sym}</i> ≤ ${b}`, cf[i]])]);
      if (t === 0) {
        const i = r.int(1, 3); const v = cls[i][0] + w / 2; const est = cf[i - 1] + fs[i] / 2; const more = r.chance(); const ans = more ? n - est : est;
        return { html: `The table shows cumulative frequencies for ${n} ${u === 'minutes' ? 'people' : u === 'g' ? 'parcels' : u === 'cm' ? 'plants' : 'runners'}.${tbl}Estimate how many ${more ? 'were more than' : 'were at most'} ${B(v + ' ' + u)}.`, ...nAns(ans, { tol: 1 }), format: 'Type a whole number', hint: `${v} is halfway through the class ${cls[i][0]} to ${cls[i][1]}.`,
          steps: [`Up to ${cls[i][0]}: ${cf[i - 1]}; up to ${cls[i][1]}: ${cf[i]}. This class has ${fs[i]} values`, `${v} is halfway through the class, so estimate ${cf[i - 1]} + ${fs[i]} ÷ 2 = ${est} are at most ${v}`, more ? `More than ${v}: ${n} − ${est} = ${B(ans)}` : `Estimate: ${B(ans)}`] };
      }
      if (t === 1) {
        const i = r.int(1, 3); const b = cls[i][1]; const pc = (n - cf[i]) / n * 100;
        return { html: `The table shows cumulative frequencies for ${n} items.${tbl}What percentage of the items were more than ${B(b + ' ' + u)}? Give your answer to 1 decimal place.`, unit: '%', ...nAns(pc, { dp: 1, unit: '%' }), format: dpFmt(1), hint: 'Subtract the cumulative frequency at that value from the total.',
          steps: [`At most ${b}: ${cf[i]}`, `More than ${b}: ${n} − ${cf[i]} = ${n - cf[i]}`, `${frac(n - cf[i], n)} × 100 = ${fx(pc, 3)}… = ${B(r1(pc))}%`] };
      }
      if (t === 2) {
        const half = n / 2; const i = cf.findIndex((x) => x >= half); const below = i ? cf[i - 1] : 0; const med = cls[i][0] + (half - below) / fs[i] * w;
        return { html: `The table shows cumulative frequencies for ${n} items.${tbl}Use the table to estimate the median. Give your answer to 1 decimal place.`, unit: u, ...nAns(med, { dp: 1, tol: 1, unit: u }), format: dpFmt(1), hint: `The median is the ${half}th value; find which class it is in.`,
          steps: [`Median position = ${n} ÷ 2 = ${half}`, `The ${half}th value is in the class ${cls[i][0]} to ${cls[i][1]} (cumulative frequency ${below} → ${cf[i]})`, `Estimate = ${cls[i][0]} + ${frac(`${half} − ${below}`, fs[i])} × ${w} = ${fx(med, 3)}`, `Median ≈ ${B(r1(med))} ${u}`] };
      }
      if (t === 3) {
        const LQ = r.int(15, 60), IQR = 2 * r.int(3, 15); const UQ = LQ + IQR; const up = r.chance() || LQ - 1.5 * IQR <= 0; const lim = up ? UQ + 1.5 * IQR : LQ - 1.5 * IQR;
        const ctx = r.pick(['reaction times, in hundredths of a second,', 'prices of second-hand bikes, in pounds,', 'journey times, in minutes,', 'scores in a quiz']);
        return { html: `For some ${ctx} the lower quartile is ${B(LQ)} and the upper quartile is ${B(UQ)}. A value is an outlier if it is more than 1.5 × IQR ${up ? 'above the upper quartile' : 'below the lower quartile'}.<br>Work out the ${up ? 'value above which' : 'value below which'} a data value counts as an outlier.`, ...nAns(lim), hint: 'Find the IQR first.',
          steps: [`IQR = ${UQ} − ${LQ} = ${IQR}`, `1.5 × ${IQR} = ${ds(1.5 * IQR)}`, up ? `Limit = ${UQ} + ${ds(1.5 * IQR)} = ${B(ds(lim))}` : `Limit = ${LQ} − ${ds(1.5 * IQR)} = ${B(ds(lim))}`] };
      }
      const qa = [r.int(10, 30), 0, 0]; qa[1] = qa[0] + r.int(4, 15); qa[2] = qa[1] + r.int(4, 15); const qb = [r.int(10, 30), 0, 0]; qb[1] = qb[0] + r.int(4, 15); qb[2] = qb[1] + r.int(4, 18);
      const iqA = qa[2] - qa[0], iqB = qb[2] - qb[0]; if (iqA === iqB) qb[2] += 1; const dif = Math.abs((qb[2] - qb[0]) - iqA);
      const [g1, g2] = r.pick([['Class 11A', 'Class 11B'], ['the boys', 'the girls'], ['Team Red', 'Team Blue'], ['the morning group', 'the afternoon group']]);
      return { html: `Test scores were recorded for two groups.<br>For ${g1}: lower quartile ${B(qa[0])}, median ${B(qa[1])}, upper quartile ${B(qa[2])}.<br>For ${g2}: lower quartile ${B(qb[0])}, median ${B(qb[1])}, upper quartile ${B(qb[2])}.<br>By how much is the interquartile range of one group greater than the other?`, ...nAns(dif), hint: 'IQR = UQ − LQ for each group; then subtract.',
        steps: [`${g1}: IQR = ${qa[2]} − ${qa[0]} = ${iqA}`, `${g2}: IQR = ${qb[2]} − ${qb[0]} = ${qb[2] - qb[0]}`, `Difference = ${B(dif)} (the group with the larger IQR has more spread in the middle half of its scores)`] };
    }],
]);

}
// @@FRAGMENTS@@

// ============================================================================
// Public API
// ============================================================================
TOPICS.sort((a, b) => a.year - b.year || a.term - b.term); // stable: keeps registration order within a term
for (const t of TOPICS) t.specRef = SPEC[t.id] || '';
const TOPIC_MAP = Object.fromEntries(TOPICS.map((t) => [t.id, t]));
function getStyle(id) { return Object.prototype.hasOwnProperty.call(STYLES, id) ? STYLES[id] : undefined; }
function getTopic(id) { return Object.prototype.hasOwnProperty.call(TOPIC_MAP, id) ? TOPIC_MAP[id] : undefined; }
function hashSeed(s) {
  if (typeof s === 'number' && isFinite(s)) return Math.floor(Math.abs(s)) >>> 0;
  let h = 2166136261; for (const ch of String(s)) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0;
}
function generate(styleId, seed) {
  const st = getStyle(styleId);
  if (!st) throw new Error('Unknown style: ' + styleId);
  const base = seed === undefined || seed === null ? (Math.random() * 4294967296) >>> 0 : hashSeed(seed);
  let lastErr;
  for (let attempt = 0; attempt < 25; attempt++) {
    try {
      const q = st.gen(mulberry32((base + attempt * 0x9E3779B9) >>> 0));
      if (checkAnswer(q.check, q.answer)) return q;
    } catch (e) { lastErr = e; }
  }
  throw lastErr || new Error('Could not generate a valid question for ' + styleId);
}
function publicCurriculum() {
  return { strands: STRANDS, topics: TOPICS.map((t) => ({ ...t, styles: t.styles.map((id) => ({ id, name: STYLES[id].name })) })) };
}

module.exports = { STRANDS, TOPICS, STYLES, getStyle, getTopic, generate, checkAnswer, publicCurriculum };
