'use strict';
// Year 9 school units: Numbers (rational/irrational, directed number, HCF/LCM, fractions),
// Maths & Money, Ratio & Inverse Proportion, plus a reverse-percentages style for y9-percentage-change.
module.exports = (H) => {
  const { topic, addStyles, SPEC, nAns, fAns, mcq, B, ds, ps, fx, money: money2dp, frac, fracN, simp, gcd, lcm, pf, pfHtml, br, table,
    ACC, svgWrap, sT, sL } = H;

  Object.assign(SPEC, {
    'y9-number-skills': '1MA1 N1, N2, N4, N8, A2',
    'y9-maths-money': '1MA1 N2, N12, N13, R9, R16',
    'y9-ratio-proportion': '1MA1 R5, R6, R10, R14',
  });

  // ---------- local helpers ----------
  const money = (x) => (Math.abs(x - Math.round(x)) < 1e-9 ? '£' + ds(Math.round(x)) : money2dp(x)); // £8000 or £12.50
  const P = (pence) => money(pence / 100); // pence -> "£12.34"
  const sMoney = (pence) => (pence < 0 ? '−' + P(-pence) : P(pence)); // signed money display
  const pp = (pence) => (pence < 100 ? `${pence}p` : P(pence)); // 89p or £1.50
  const mixedHtml = (n, d) => { // simplified, improper -> mixed display
    const [a, b] = simp(n, d);
    if (b === 1) return ds(a);
    if (Math.abs(a) < b) return fracN(a, b);
    const w = Math.trunc(Math.abs(a) / b), rem = Math.abs(a) % b;
    return (a < 0 ? '−' : '') + `${w}${frac(rem, b)}`;
  };
  const mixed = (w, n, d) => (w ? `${w}${frac(n, d)}` : frac(n, d));
  const fracAns = (n, d) => ({ ...fAns(n, d), answerHtml: B(mixedHtml(n, d)) });
  const FRAC_FMT = 'Type a fraction in its simplest form, e.g. 7/12 (mixed numbers like 2 3/4 are fine)';
  const MONEY_FMT = 'Type the amount in pounds, e.g. 45.60';
  const nameSet = ['Amira', 'Ben', 'Chloe', 'Dev', 'Ella', 'Finn', 'Grace', 'Harry', 'Isla', 'Jamal', 'Kiera', 'Leo', 'Maya', 'Noah', 'Orla', 'Priya', 'Ravi', 'Sophie', 'Tom', 'Zara'];

  // =====================================================================
  // 1. Rational & irrational numbers, fractions & directed number
  // =====================================================================
  const isSq = (n) => Number.isInteger(Math.sqrt(n));
  function ratItem(r) {
    const t = r.int(0, 5);
    if (t === 0) { const n = r.int(-20, 25); return { s: ds(n), irr: false, kind: 'int', why: `${ds(n)} is an integer, and every integer is rational (${ds(n)} = ${ds(n)}/1).` }; }
    if (t === 1) { let a, b; do { b = r.int(2, 12); a = r.int(1, 11); } while (gcd(a, b) !== 1 || a === b); const neg = r.chance(0.25);
      return { s: `${neg ? '−' : ''}${a}/${b}`, irr: false, kind: 'frac', why: `${neg ? '−' : ''}${a}/${b} is already one integer divided by another, so it is rational.` }; }
    if (t === 2) { const v = r.pick([0.25, 0.6, 1.75, 0.125, 3.2, 2.05, 0.8, 4.5, 0.375, 7.4, 0.02]); const neg = r.chance(0.2);
      return { s: (neg ? '−' : '') + ps(v), irr: false, kind: 'frac', why: `${neg ? '−' : ''}${ps(v)} is a terminating decimal, so it can be written as a fraction (${neg ? '−' : ''}${ps(v * 1000)}/1000).` }; }
    if (t === 3) { const d = r.int(1, 9); const two = r.chance(0.4); const d2 = r.int(0, 9);
      const s = two ? `0.${d}${d2}${d}${d2}${d}${d2}…` : `0.${d}${d}${d}${d}…`;
      return { s, irr: false, kind: 'frac', why: `${s} is a recurring decimal (the digits repeat for ever), and every recurring decimal can be written as a fraction.` }; }
    if (t === 4) { const k = r.int(2, 15); return { s: `√${k * k}`, irr: false, kind: 'int', why: `√${k * k} = ${k}, which is an integer, so it is rational.` }; }
    const k = r.int(2, 5); return { s: `∛${k ** 3}`, irr: false, kind: 'int', why: `∛${k ** 3} = ${k}, which is an integer, so it is rational.` };
  }
  function irrItem(r) {
    const t = r.int(0, 3);
    if (t <= 1) { let n; do { n = r.int(2, 80); } while (isSq(n)); return { s: `√${n}`, irr: true, kind: 'irr', why: `${n} is not a square number, so √${n} is a decimal that never ends and never repeats — irrational.` }; }
    if (t === 2) { const s = r.pick(['π', '2π', '3π', 'π + 1', 'π/2']); return { s, irr: true, kind: 'irr', why: `π is irrational (3.14159… never ends or repeats), so ${s} is irrational too.` }; }
    let n; do { n = r.int(2, 40); } while (Number.isInteger(Math.round(Math.cbrt(n))) && Math.round(Math.cbrt(n)) ** 3 === n);
    return { s: `∛${n}`, irr: true, kind: 'irr', why: `${n} is not a cube number, so ∛${n} never ends or repeats — irrational.` };
  }
  function itemSet(r, nIrr, nRat) {
    const out = [], seen = new Set();
    const add = (f, k) => { let c = 0; while (c < k) { const it = f(r); if (!seen.has(it.s)) { seen.add(it.s); out.push(it); c++; } } };
    add(irrItem, nIrr); add(ratItem, nRat); return out;
  }

  // directed-number substitution expressions: [display html, value fn, working fn]
  const SUBS = [
    [`2<i>a</i> − <i>b</i>`, (a, b) => 2 * a - b, (a, b) => `2 × ${br(a)} − ${br(b)} = ${ds(2 * a)} − ${br(b)}`],
    [`3<i>a</i> + 2<i>b</i>`, (a, b) => 3 * a + 2 * b, (a, b) => `3 × ${br(a)} + 2 × ${br(b)} = ${ds(3 * a)} + ${br(2 * b)}`],
    [`<i>ab</i>`, (a, b) => a * b, (a, b) => `${br(a)} × ${br(b)}`],
    [`<i>a</i><sup>2</sup> + <i>b</i>`, (a, b) => a * a + b, (a, b) => `${br(a)}<sup>2</sup> + ${br(b)} = ${ds(a * a)} + ${br(b)}`],
    [`<i>a</i><sup>2</sup> − 3<i>b</i>`, (a, b) => a * a - 3 * b, (a, b) => `${br(a)}<sup>2</sup> − 3 × ${br(b)} = ${ds(a * a)} − ${br(3 * b)}`],
    [`<i>b</i> − 4<i>a</i>`, (a, b) => b - 4 * a, (a, b) => `${br(b)} − 4 × ${br(a)} = ${ds(b)} − ${br(4 * a)}`],
    [`(<i>a</i> + <i>b</i>)<sup>2</sup>`, (a, b) => (a + b) ** 2, (a, b) => `(${ds(a)} + ${br(b)})<sup>2</sup> = ${br(a + b)}<sup>2</sup>`],
    [`5<i>a</i> − <i>ab</i>`, (a, b) => 5 * a - a * b, (a, b) => `5 × ${br(a)} − ${br(a)} × ${br(b)} = ${ds(5 * a)} − ${br(a * b)}`],
    [`<i>a</i><sup>2</sup><i>b</i>`, (a, b) => a * a * b, (a, b) => `${br(a)}<sup>2</sup> × ${br(b)} = ${ds(a * a)} × ${br(b)}`],
  ];

  function pfStr(n) { return pfHtml(pf(n)); }
  function hcfLcmSteps(a, b, want) {
    const fa = Object.fromEntries(pf(a)), fb = Object.fromEntries(pf(b));
    const primes = [...new Set([...Object.keys(fa), ...Object.keys(fb)].map(Number))].sort((x, y) => x - y);
    const common = primes.filter((p) => fa[p] && fb[p]).map((p) => [p, Math.min(fa[p], fb[p])]);
    const all = primes.map((p) => [p, Math.max(fa[p] || 0, fb[p] || 0)]);
    const steps = [`${a} = ${pfStr(a)}`, `${b} = ${pfStr(b)}`];
    if (want === 'hcf') steps.push(common.length ? `HCF: multiply the primes they share, using the lower power of each: ${pfHtml(common)} = ${B(gcd(a, b))}` : `They share no prime factors, so the HCF is ${B(1)}`);
    else steps.push(`LCM: use every prime that appears, with the higher power of each: ${pfHtml(all)} = ${B(lcm(a, b))}`);
    return steps;
  }

  topic('y9-number-skills', 'number', 9, 2, 'FH', 'Rational & Irrational Numbers, Fractions & Directed Number',
    'Classify numbers as rational or irrational, calculate with negative numbers, find HCF and LCM, and add, subtract, multiply and divide fractions.', [
      ['Rational & irrational numbers',
        'A rational number can be written as one integer divided by another, so integers, fractions, terminating decimals and recurring decimals are all rational. An irrational number, such as π or √2, is a decimal that never ends and never repeats.',
        (r) => {
          const mode = r.int(0, 3);
          if (mode === 0) {
            const nI = r.int(2, 3), its = r.shuffle(itemSet(r, nI, 6 - nI)); const pickIrr = r.chance(0.6);
            const correct = its.map((it, i) => (it.irr === pickIrr ? i : -1)).filter((i) => i >= 0);
            return { html: `Select ${B('all')} the ${B(pickIrr ? 'irrational' : 'rational')} numbers.`, ...mcq(r, its.map((it) => it.s), correct),
              hint: 'Can it be written exactly as a fraction of two integers? If yes, it is rational.',
              steps: [`Irrational:<br>${its.filter((it) => it.irr).map((it) => `${it.s} — ${it.why}`).join('<br>')}`, `Rational:<br>${its.filter((it) => !it.irr).map((it) => `${it.s} — ${it.why}`).join('<br>')}`, `So the ${pickIrr ? 'irrational' : 'rational'} numbers are ${B(its.filter((it) => it.irr === pickIrr).map((it) => it.s).join(', '))}.`] };
          }
          if (mode === 1) {
            const its = itemSet(r, 1, 3); const odd = r.chance(0.5);
            if (odd) return { html: `Which one of these numbers is ${B('irrational')}?`, ...mcq(r, its.map((it) => it.s), 0), hint: 'Look for a square root of a non-square number, or π.',
              steps: its.map((it) => `${it.s}: ${it.why}`).concat([`The irrational number is ${B(its[0].s)}.`]) };
            // one rational among irrationals
            const set = itemSet(r, 3, 1); const opts = [set[3], set[0], set[1], set[2]];
            return { html: `Three of these numbers are irrational. Which one is ${B('rational')}?`, ...mcq(r, opts.map((it) => it.s), 0), hint: 'Which one can be written exactly as a fraction?',
              steps: opts.map((it) => `${it.s}: ${it.why}`).concat([`The rational number is ${B(opts[0].s)}.`]) };
          }
          if (mode === 3) {
            const k = r.int(2, 12); const neg = r.chance(0.6) ? `√(−${k * k})` : `√(−${r.pick([2, 3, 5, 6, 7, 10, 11])})`;
            const others = itemSet(r, 1, 2);
            return { html: `Which one of these is ${B('not a real number')}?`, ...mcq(r, [neg, ...others.map((it) => it.s)], 0), hint: 'Think about what you would square to get a negative answer.',
              steps: [`${neg}: any real number squared is positive or zero (e.g. ${k} × ${k} and (−${k}) × (−${k}) are both positive), so no real number squares to give a negative. ${neg} is ${B('not real')}.`, ...others.map((it) => `${it.s}: real — ${it.why}`)] };
          }
          const it = r.chance(0.4) ? irrItem(r) : ratItem(r);
          const opts = ['an integer', 'rational but not an integer', 'irrational'];
          const k = it.kind === 'int' ? 0 : it.kind === 'frac' ? 1 : 2;
          return { html: `Which best describes the number ${B(it.s)}?`, ...mcq(r, opts, k), hint: 'Integers are whole numbers; rationals are fractions of integers; irrationals never end or repeat.',
            steps: [it.why, `So ${it.s} is ${B(opts[k])}.`] };
        }],
      ['Calculating & substituting with directed numbers',
        'Same signs multiply or divide to give a positive answer; different signs give a negative answer. Subtracting a negative is the same as adding. When you substitute a negative value, put it in brackets so the signs are handled correctly.',
        (r) => {
          const t = r.int(0, 5);
          if (t === 5) {
            const a = r.nz(-12, 12), b = r.nz(-12, 12), c = r.nz(-12, 12); const o1 = r.chance() ? '+' : '−', o2 = r.chance() ? '+' : '−';
            const eb = o1 === '+' ? b : -b, ec = o2 === '+' ? c : -c; const v = a + eb + ec;
            const say0 = (o, x) => (o === '+' ? (x < 0 ? `adding ${br(x)} is the same as subtracting ${-x}` : `add ${x}`) : (x < 0 ? `subtracting ${br(x)} is the same as adding ${-x}` : `subtract ${x}`)); const say = (o, x) => { const t2 = say0(o, x); return t2[0].toUpperCase() + t2.slice(1); };
            return { html: `Work out ${B(`${ds(a)} ${o1} ${br(b)} ${o2} ${br(c)}`)}`, ...nAns(v), hint: 'Two signs next to each other: same signs make +, different signs make −.',
              steps: [`${say(o1, b)}: ${ds(a)} ${eb < 0 ? '−' : '+'} ${Math.abs(b)} = ${ds(a + eb)}`, `${say(o2, c)}: ${ds(a + eb)} ${ec < 0 ? '−' : '+'} ${Math.abs(c)} = ${B(ds(v))}`] };
          }
          if (t <= 1) { // substitution
            let a, b; do { a = r.nz(-9, 9); b = r.nz(-9, 9); } while (a > 0 && b > 0);
            const [eh, f, w] = r.pick(SUBS); const v = f(a, b);
            return { html: `Work out the value of ${B(eh)} when ${B(`<i>a</i> = ${ds(a)}`)} and ${B(`<i>b</i> = ${ds(b)}`)}.`, ...nAns(v), hint: 'Replace each letter with its value in brackets, then use the sign rules.',
              steps: [`Substitute: ${w(a, b)}`, `= ${B(ds(v))}`] };
          }
          if (t === 2) {
            let a, b; do { a = r.nz(-12, 12); b = r.nz(-9, 9); } while (a > 0 && b > 0); const c = r.nz(-20, 20), add = r.chance(); const p = a * b; const v = add ? p + c : p - c;
            return { html: `Work out ${B(`${br(a)} × ${br(b)} ${add ? '+' : '−'} ${br(c)}`)}`, ...nAns(v), hint: 'Multiply first, then add or subtract.',
              steps: [`Multiply first: ${br(a)} × ${br(b)} = ${ds(p)} (${(a < 0) === (b < 0) ? 'same signs → positive' : 'different signs → negative'})`,
                `${ds(p)} ${add ? '+' : '−'} ${br(c)}${add ? '' : ` = ${ds(p)} + ${br(-c)}`} = ${B(ds(v))}`] };
          }
          if (t === 3) {
            const b = r.nz(-9, 9), q = r.nz(-12, 12), c = r.nz(-15, 15); const a = b * q; const v = q - c;
            return { html: `Work out ${B(`${br(a)} ÷ ${br(b)} − ${br(c)}`)}`, ...nAns(v), hint: 'Divide first, then subtract. Subtracting a negative means adding.',
              steps: [`Divide first: ${br(a)} ÷ ${br(b)} = ${ds(q)} (${(a < 0) === (b < 0) ? 'same signs → positive' : 'different signs → negative'})`, `${ds(q)} − ${br(c)}${c < 0 ? ` = ${ds(q)} + ${-c}` : ''} = ${B(ds(v))}`] };
          }
          const a = r.int(2, 9), b = r.nz(-20, 20), sgnSq = r.chance(); const sq = a * a; const v = (sgnSq ? sq : -sq) - b;
          return { html: `Work out ${B(`${sgnSq ? `(−${a})<sup>2</sup>` : `−${a}<sup>2</sup>`} − ${br(b)}`)}`, ...nAns(v), hint: sgnSq ? 'A negative number squared is positive.' : 'Only the number is squared here — the minus sign is applied afterwards.',
            steps: [sgnSq ? `(−${a})<sup>2</sup> = (−${a}) × (−${a}) = ${sq}` : `−${a}<sup>2</sup> = −(${a} × ${a}) = −${sq}`, `${ds(sgnSq ? sq : -sq)} − ${br(b)}${b < 0 ? ` = ${ds(sgnSq ? sq : -sq)} + ${-b}` : ''} = ${B(ds(v))}`] };
        }],
      ['Highest common factor & lowest common multiple',
        'Write each number as a product of prime factors. The HCF multiplies the primes the numbers share (lower powers); the LCM multiplies every prime that appears (higher powers). HCF problems split things into equal groups; LCM problems ask when things happen together again.',
        (r) => {
          let g, m1, m2; do { g = r.int(2, 18); m1 = r.int(2, 9); m2 = r.int(2, 9); } while (m1 === m2 || gcd(m1, m2) !== 1 || g * Math.max(m1, m2) > 180);
          const a = g * m1, b = g * m2; const t = r.int(0, 4);
          if (t === 4) {
            let x, y; do { x = r.int(4, 40); y = r.int(4, 40); } while (x >= y || gcd(x, y) === 1 || y % x === 0 || lcm(x, y) > 120);
            const want = r.chance() ? 'hcf' : 'lcm';
            if (want === 'hcf') { const fx2 = (n) => Array.from({ length: n }, (_, i) => i + 1).filter((d) => n % d === 0); const h = gcd(x, y);
              return { html: `List the factors of ${B(x)} and of ${B(y)}. Use your lists to find the ${B('highest common factor')} of ${x} and ${y}.`, ...nAns(h), hint: 'Write the factors in pairs so you do not miss any, then find the biggest number in both lists.',
                steps: [`Factors of ${x}: ${fx2(x).join(', ')}`, `Factors of ${y}: ${fx2(y).join(', ')}`, `Common factors: ${fx2(x).filter((d) => y % d === 0).join(', ')}`, `The highest is ${B(h)}.`] }; }
            const L = lcm(x, y); const mx = (n) => Array.from({ length: L / n }, (_, i) => n * (i + 1));
            return { html: `List the multiples of ${B(x)} and of ${B(y)}. Use your lists to find the ${B('lowest common multiple')} of ${x} and ${y}.`, ...nAns(L), hint: 'Write out each times table until you find the first number in both lists.',
              steps: [`Multiples of ${x}: ${mx(x).join(', ')}, …`, `Multiples of ${y}: ${mx(y).join(', ')}, …`, `The first number in both lists is ${B(L)}.`] };
          }
          if (t === 0 || t === 1) {
            const want = t === 0 ? 'hcf' : 'lcm';
            return { html: `Find the ${B(want === 'hcf' ? 'highest common factor (HCF)' : 'lowest common multiple (LCM)')} of ${B(a)} and ${B(b)}.`, ...nAns(want === 'hcf' ? g : lcm(a, b)),
              hint: 'Start by writing each number as a product of prime factors.', steps: hcfLcmSteps(a, b, want) };
          }
          if (t === 2) {
            const c = r.pick([['Two buses leave the bus station together at 8 am', 'Route 1 runs every', 'Route 2 every', 'leave together', 'minutes', 4, 30], ['Two lighthouses flash at the same moment', 'one flashes every', 'the other every', 'flash together', 'seconds', 6, 40], ['Two runners start a lap together', 'one completes a lap every', 'the other every', 'pass the start line together', 'seconds', 50, 96]]);
            let p, q; do { p = r.int(c[5], c[6]); q = r.int(c[5], c[6]); } while (p >= q || gcd(p, q) === 1 || gcd(p, q) === p || lcm(p, q) > 600);
            const L = lcm(p, q), unit = c[4];
            return { html: `${c[0]}. ${c[1][0].toUpperCase() + c[1].slice(1)} ${B(`${p} ${unit}`)} and ${c[2]} ${B(`${q} ${unit}`)}. After how many ${unit} will they next ${c[3]}?`, ...nAns(L, { unit }), unit,
              hint: 'You need a time that is a multiple of both numbers — the lowest common multiple.', steps: [...hcfLcmSteps(p, q, 'lcm'), `They next ${c[3]} after ${B(`${L} ${unit}`)}.`] };
          }
          const c = r.pick([['ribbon', 'cm', 'cut both ribbons into pieces of equal length, as long as possible, with nothing left over'], ['rope', 'cm', 'cut both ropes into equal pieces, as long as possible, with no waste'], ['bags of sweets', 'sweets', 'share the sweets into identical party bags with the greatest possible number of bags'],]);
          if (c[0] === 'bags of sweets') {
            return { html: `Kai has ${B(a)} lemon sweets and ${B(b)} cherry sweets. He wants to ${c[2]}, using all the sweets. How many party bags can he make?`, ...nAns(g),
              hint: 'The number of bags must divide into both amounts: use the HCF.', steps: [...hcfLcmSteps(a, b, 'hcf'), `He can make ${B(g)} bags (each with ${m1} lemon and ${m2} cherry sweets).`] };
          }
          return { html: `Two pieces of ${c[0]} are ${B(a + ' cm')} and ${B(b + ' cm')} long. Mia wants to ${c[2]}. How long should each piece be?`, ...nAns(g, { unit: 'cm' }), unit: 'cm',
            hint: 'The length must divide exactly into both: use the HCF.', steps: [...hcfLcmSteps(a, b, 'hcf'), `Each piece should be ${B(g + ' cm')}.`] };
        }],
      ['Adding & subtracting fractions',
        'Change the fractions to equivalent fractions with a common denominator (the LCM of the denominators), then add or subtract the numerators. With mixed numbers, it is safest to change them to improper fractions first.',
        (r) => {
          const t = r.int(0, 2);
          const pf2 = () => { let n, d; do { d = r.int(2, 12); n = r.int(1, d - 1); } while (gcd(n, d) !== 1); return [n, d]; };
          if (t === 0) {
            let a, b, c, d, add; do { [a, b] = pf2(); [c, d] = pf2(); add = r.chance(); } while (b === d || (!add && a * d <= c * b));
            const L = lcm(b, d), A = a * L / b, C = c * L / d, N = add ? A + C : A - C;
            const steps = [`Common denominator: LCM of ${b} and ${d} is ${L}.`, `${frac(a, b)} = ${frac(A, L)} and ${frac(c, d)} = ${frac(C, L)}`, `${frac(A, L)} ${add ? '+' : '−'} ${frac(C, L)} = ${frac(N, L)}`];
            if (simp(N, L)[1] !== L || N > L) steps.push(`Simplify: ${B(mixedHtml(N, L))}`);
            return { html: `Work out ${B(`${frac(a, b)} ${add ? '+' : '−'} ${frac(c, d)}`)}. Give your answer in its simplest form.`, ...fracAns(N, L), format: FRAC_FMT, hint: `Use a common denominator of ${L}.`, steps };
          }
          if (t === 1) {
            let a, b, c, d, w1, w2, add, N1, N2; do { [a, b] = pf2(); [c, d] = pf2(); w1 = r.int(1, 5); w2 = r.int(1, 4); add = r.chance(); N1 = w1 * b + a; N2 = w2 * d + c; } while (b === d || (!add && N1 * d - N2 * b <= b * d) || b * d > 80);
            const L = lcm(b, d), A = N1 * L / b, C = N2 * L / d, N = add ? A + C : A - C;
            return { html: `Work out ${B(`${mixed(w1, a, b)} ${add ? '+' : '−'} ${mixed(w2, c, d)}`)}. Give your answer as a mixed number in its simplest form.`, ...fracAns(N, L), format: FRAC_FMT, hint: 'Change both mixed numbers into improper fractions first.',
              steps: [`Improper fractions: ${mixed(w1, a, b)} = ${frac(N1, b)} and ${mixed(w2, c, d)} = ${frac(N2, d)}`, `Common denominator ${L}: ${frac(N1, b)} = ${frac(A, L)} and ${frac(N2, d)} = ${frac(C, L)}`,
                `${frac(A, L)} ${add ? '+' : '−'} ${frac(C, L)} = ${frac(N, L)}`, `As a mixed number in simplest form: ${B(mixedHtml(N, L))}`] };
          }
          let a, b, c, d; do { [a, b] = pf2(); [c, d] = pf2(); } while (b === d || a * d + c * b >= b * d);
          const L = lcm(b, d), A = a * L / b, C = c * L / d, N = L - A - C;
          const [n1, n2] = r.sample(nameSet, 2); const thing = r.pick(['a pizza', 'a cake', 'a bar of chocolate', 'a pie', 'a lasagne']);
          const verb = ['eats', 'eats', 'is left'];
          return { html: `${n1} ${verb[0]} ${B(frac(a, b))} of ${thing}. ${n2} ${verb[1]} ${B(frac(c, d))} of it. What fraction of ${thing.replace(/^a /, 'the ')} ${verb[2]}?`, ...fracAns(N, L), format: FRAC_FMT, hint: 'The whole is 1. Add the two fractions, then subtract from 1.',
            steps: [`Common denominator ${L}: ${frac(a, b)} = ${frac(A, L)}, ${frac(c, d)} = ${frac(C, L)}`, `Together: ${frac(A, L)} + ${frac(C, L)} = ${frac(A + C, L)}`, `1 = ${frac(L, L)}, so ${frac(L, L)} − ${frac(A + C, L)} = ${frac(N, L)}${simp(N, L)[1] !== L ? ` = ${B(fracN(...simp(N, L)))}` : ''}`, `Answer: ${B(fracN(...simp(N, L)))}`] };
        }],
      ['Multiplying & dividing fractions',
        'To multiply, multiply the numerators and multiply the denominators. To divide, multiply by the reciprocal of the second fraction (flip it). Change mixed numbers to improper fractions first, and simplify at the end.',
        (r) => {
          const t = r.int(0, 3);
          const pf2 = (lo = 2, hi = 10) => { let n, d; do { d = r.int(lo, hi); n = r.int(1, d - 1); } while (gcd(n, d) !== 1); return [n, d]; };
          if (t === 0) {
            const k = r.int(0, 3);
            if (k === 0) { const n = r.int(2, 15); return { html: `Write down the ${B('reciprocal')} of ${B(n)}.`, ...fAns(1, n), format: 'Type a fraction, e.g. 1/5', hint: 'The reciprocal of a number is 1 divided by it.', steps: [`${n} = ${frac(n, 1)}`, `Flip it: ${B(frac(1, n))}`, `Check: ${n} × ${frac(1, n)} = 1`] }; }
            if (k === 1) { const [n, d] = pf2(2, 15); return { html: `Write down the ${B('reciprocal')} of ${B(frac(n, d))}.`, ...fracAns(d, n), format: 'Type a fraction, e.g. 7/3 (or a whole number)', hint: 'Swap the numerator and denominator.', steps: [`Flip the fraction: ${frac(n, d)} → ${frac(d, n)}`, `Reciprocal = ${B(mixedHtml(d, n))}`, `Check: ${frac(n, d)} × ${frac(d, n)} = 1`] }; }
            if (k === 2) { const [n, d] = pf2(2, 9); const w = r.int(1, 4); const N = w * d + n; return { html: `Write down the ${B('reciprocal')} of ${B(mixed(w, n, d))}.`, ...fAns(d, N), format: 'Type a fraction, e.g. 3/7', hint: 'Make it an improper fraction first, then flip it.', steps: [`${mixed(w, n, d)} = ${frac(N, d)}`, `Flip it: ${B(frac(d, N))}`] }; }
            const [dv, f] = r.pick([[0.25, [1, 4]], [0.2, [1, 5]], [0.5, [1, 2]], [0.75, [3, 4]], [0.4, [2, 5]], [0.125, [1, 8]], [1.25, [5, 4]], [2.5, [5, 2]], [0.6, [3, 5]], [0.8, [4, 5]]]);
            return { html: `Write down the ${B('reciprocal')} of ${B(ps(dv))}. Give your answer as a fraction or whole number.`, ...fracAns(f[1], f[0]), format: 'Type a fraction or whole number, e.g. 5/2', hint: 'Write the decimal as a fraction first.', steps: [`${ps(dv)} = ${frac(f[0], f[1])}`, `Flip it: ${frac(f[1], f[0])}${f[0] === 1 ? ` = ${f[1]}` : ''}`, `Reciprocal = ${B(mixedHtml(f[1], f[0]))}`] };
          }
          if (t === 1) {
            let a, b, c, d; do { [a, b] = pf2(); [c, d] = pf2(); } while (a === c && b === d); const mul = r.chance();
            const N = mul ? a * c : a * d, D = mul ? b * d : b * c;
            const steps = mul ? [`Multiply the numerators and the denominators: ${frac(`${a} × ${c}`, `${b} × ${d}`)} = ${frac(N, D)}`] : [`Multiply by the reciprocal of ${frac(c, d)}: ${frac(a, b)} × ${frac(d, c)}`, `${frac(`${a} × ${d}`, `${b} × ${c}`)} = ${frac(N, D)}`];
            steps.push(`Simplest form: ${B(mixedHtml(N, D))}`);
            return { html: `Work out ${B(`${frac(a, b)} ${mul ? '×' : '÷'} ${frac(c, d)}`)}. Give your answer in its simplest form.`, ...fracAns(N, D), format: FRAC_FMT, hint: mul ? 'Top × top, bottom × bottom.' : 'Keep the first fraction, change ÷ to ×, flip the second.', steps };
          }
          if (t === 2) {
            const [a, b] = pf2(); const n = r.int(2, 12); const mul = r.chance(0.6);
            const N = mul ? a * n : a, D = mul ? b : b * n;
            return { html: mul ? `Work out ${B(`${frac(a, b)} × ${n}`)}. Give your answer in its simplest form.` : `Work out ${B(`${frac(a, b)} ÷ ${n}`)}. Give your answer in its simplest form.`, ...fracAns(N, D), format: FRAC_FMT, hint: mul ? `Write ${n} as ${n}/1.` : `Dividing by ${n} is the same as multiplying by ${frac(1, n)}.`,
              steps: mul ? [`${n} = ${frac(n, 1)}`, `${frac(`${a} × ${n}`, b)} = ${frac(N, D)}`, `Simplest form: ${B(mixedHtml(N, D))}`] : [`÷ ${n} is the same as × ${frac(1, n)}`, `${frac(a, `${b} × ${n}`)} = ${frac(N, D)}`, `Simplest form: ${B(mixedHtml(N, D))}`] };
          }
          let a, b, c, d; do { [a, b] = pf2(2, 6); [c, d] = pf2(2, 6); } while (a === c && b === d);
          const w1 = r.int(1, 4), w2 = r.int(0, 3); const N1 = w1 * b + a, N2 = w2 * d + c; const mul = r.chance();
          const N = mul ? N1 * N2 : N1 * d, D = mul ? b * d : b * N2;
          return { html: `Work out ${B(`${mixed(w1, a, b)} ${mul ? '×' : '÷'} ${mixed(w2, c, d)}`)}. Give your answer as a mixed number in its simplest form.`, ...fracAns(N, D), format: FRAC_FMT, hint: 'Change mixed numbers to improper fractions first.',
            steps: [`Improper fractions: ${mixed(w1, a, b)} = ${frac(N1, b)}${w2 ? `, ${mixed(w2, c, d)} = ${frac(N2, d)}` : ''}`,
              mul ? `${frac(N1, b)} × ${frac(N2, d)} = ${frac(`${N1} × ${N2}`, `${b} × ${d}`)} = ${frac(N, D)}` : `${frac(N1, b)} × ${frac(d, N2)} (multiply by the reciprocal) = ${frac(N, D)}`,
              `Simplest form: ${B(mixedHtml(N, D))}`] };
        }],
    ]);

  // =====================================================================
  // 2. Maths & Money
  // =====================================================================
  const sgnAns = (pence) => ({ ...nAns(pence / 100, { money: true }), answerHtml: B(sMoney(pence)) });

  topic('y9-maths-money', 'number', 9, 2, 'FH', 'Maths & Money',
    'Bills and bank statements, simple and compound interest, VAT, wages and tax, and exchange rates.', [
      ['Bills & bank statements',
        'A credit is money paid into an account and a debit is money taken out. Work down a statement row by row: add credits to the balance and subtract debits. A balance can go below zero (overdrawn). On bills, make sure every price is in the same unit (pounds or pence) before adding.',
        (r) => {
          if (r.chance(0.2)) {
            const item = r.pick(['television', 'sofa', 'laptop', 'fridge-freezer', 'electric bike', 'bed']); const cash = r.int(30, 180) * 1000; // pence
            const dep = Math.round(cash * r.pick([0.1, 0.15, 0.2, 0.25]) / 500) * 500; const months = r.pick([6, 10, 12, 18, 24]);
            const inst = Math.ceil((cash - dep) * r.pick([1.05, 1.1, 1.15, 1.2]) / months / 50) * 50; const credit = dep + months * inst; const ask = r.chance();
            const steps = [`Monthly payments: ${months} × ${P(inst)} = ${P(months * inst)}`, `Total on the payment plan: ${P(dep)} + ${P(months * inst)} = ${ask ? B(P(credit)) : P(credit)}`];
            if (!ask) steps.push(`Extra cost: ${P(credit)} − ${P(cash)} = ${B(P(credit - cash))}`);
            return { html: `A ${item} costs ${B(P(cash))} if you pay in full. On a payment plan you pay a ${B('deposit')} of ${B(P(dep))} and then ${B(`${months} monthly payments of ${P(inst)}`)}. ${ask ? 'What is the total cost on the payment plan?' : 'How much more does it cost to use the payment plan?'}`,
              ...nAns((ask ? credit : credit - cash) / 100, { money: true }), format: MONEY_FMT, hint: 'Add the deposit to all the monthly payments.', steps };
          }
          if (r.chance(0.55)) {
            const start = r.int(20, 900) * 100 + r.pick([0, 0, 50, 25, 99, 10]);
            const CR = [['Salary', 90000, 240000], ['Birthday money', 1000, 6000], ['Refund', 500, 4000], ['Transfer in', 2000, 30000]];
            const DR = [['Rent', 45000, 95000], ['Phone bill', 1200, 4500], ['Supermarket', 2500, 14000], ['Council tax', 9000, 18000], ['Electricity', 4000, 15000], ['Car insurance', 3000, 9000], ['Train ticket', 800, 6000], ['Gym', 1500, 4500]];
            const n = r.int(3, 5); const mon = r.pick(['Mar', 'Apr', 'Sep', 'Oct']); const rows = [['Date', 'Description', 'Credit', 'Debit', 'Balance'], [`1 ${mon}`, 'Opening balance', '', '', sMoney(start)]];
            let bal = start; const steps = [`Start: ${sMoney(start)}`]; const used = new Set();
            for (let i = 0; i < n; i++) {
              const cr = (i === 0 ? r.chance(0.5) : r.chance(0.3)) && CR.some((c) => !used.has(c[0])); let it; do { it = r.pick(cr ? CR : DR); } while (used.has(it[0])); used.add(it[0]);
              const amt = r.int(it[1] / 100, it[2] / 100) * 100 + r.pick([0, 0, 50, 99, 45, 20]);
              bal += cr ? amt : -amt; rows.push([`${3 + i * 5} ${mon}`, it[0], cr ? P(amt) : '', cr ? '' : P(amt), i === n - 1 ? '?' : sMoney(bal)]);
              steps.push(`${it[0]}: ${cr ? '+' : '−'} ${P(amt)} → ${sMoney(bal)}`);
            }
            steps[steps.length - 1] = steps[steps.length - 1].replace(/→ (.*)$/, (m, x) => `→ ${B(x)}`);
            if (bal < 0) steps.push(`The balance is negative, so the account is ${B('overdrawn')} by ${P(-bal)}.`);
            if (steps.length > 6) steps.splice(0, 2, `${steps[0]}; ${steps[1]}`);
            return { html: `Here is part of a bank statement. Work out the missing final balance.${table(rows)}`, ...sgnAns(bal), format: 'Type the balance in pounds, e.g. 245.60 (use − for an overdrawn balance, e.g. −32.50)', hint: 'Add credits, subtract debits, one row at a time.', steps };
          }
          const MENU = [['Tea', 120, 260], ['Coffee', 180, 360], ['Milk', 65, 99], ['Bread', 85, 180], ['Sandwich', 250, 495], ['Cake slice', 195, 375], ['Juice', 79, 199], ['Crisps', 45, 95], ['Soup', 325, 550], ['Chips', 150, 320]];
          const items = r.sample(MENU, r.int(3, 4)).map((m) => [m[0], r.int(Math.ceil(m[1] / 5), Math.floor(m[2] / 5)) * 5, r.int(1, 4)]);
          const tot = items.reduce((s, it) => s + it[1] * it[2], 0);
          const rows = [['Item', 'Price'], ...items.map((it) => [it[0], pp(it[1])])];
          const order = items.map((it) => `${it[2]} × ${it[0].toLowerCase()}`).join(', ');
          const steps = [...items.map((it) => `${it[2]} × ${pp(it[1])} = ${P(it[1] * it[2])}`), `Total = ${B(P(tot))}`];
          if (r.chance(0.5)) {
            const paid = [1000, 2000, 5000].find((x) => x >= tot + 1);
            if (paid) { steps.push(`Change = ${P(paid)} − ${P(tot)} = ${B(P(paid - tot))}`);
              return { html: `A café menu shows these prices.${table(rows)}A family orders ${order}. They pay with a ${P(paid)} note. How much change should they get?`, ...nAns((paid - tot) / 100, { money: true }), format: MONEY_FMT, hint: 'Some prices are in pence, some in pounds — convert before adding.', steps };
            }
          }
          return { html: `A café menu shows these prices.${table(rows)}Work out the total cost of: ${order}.`, ...nAns(tot / 100, { money: true }), format: MONEY_FMT, hint: 'Some prices are in pence, some in pounds — convert before adding.', steps };
        }],
      ['Simple interest',
        'With simple interest you earn the same amount every year, worked out on the original amount (the principal). Interest = principal × rate ÷ 100 × number of years. Add the interest to the principal for the total in the account.',
        (r) => {
          const Pp = r.pick([100, 200, 250, 400, 500, 600, 800, 1000, 1200, 1500, 2000, 2500, 3000, 4000, 5000, 8000]); const R = r.pick([1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5, 6]); const n = r.int(2, 10);
          const yr = Pp * R / 100; const I = yr * n; const t = r.int(0, 2); const who = r.pick(nameSet);
          if (t === 0) return { html: `${who} invests ${B(money(Pp))} in a savings account paying ${B(ps(R) + '%')} ${B('simple interest')} per year. How much interest does ${who} earn in ${B(n + ' years')}?`, ...nAns(I, { money: true }), format: MONEY_FMT, hint: 'Find one year\'s interest, then multiply by the number of years.',
            steps: [`One year: ${ps(R)}% of ${money(Pp)} = ${money(Pp)} × ${ps(R / 100)} = ${money(yr)}`, `${n} years: ${money(yr)} × ${n} = ${B(money(I))}`] };
          if (t === 1) return { html: `${B(money(Pp))} is put into an account paying ${B(ps(R) + '%')} ${B('simple interest')} per annum. How much is in the account after ${B(n + ' years')}?`, ...nAns(Pp + I, { money: true }), format: MONEY_FMT, hint: 'Work out the total interest, then add it to the starting amount.',
            steps: [`Interest per year = ${money(Pp)} × ${ps(R)} ÷ 100 = ${money(yr)}`, `Interest for ${n} years = ${money(yr)} × ${n} = ${money(I)}`, `Total = ${money(Pp)} + ${money(I)} = ${B(money(Pp + I))}`] };
          return { html: `${who} invests ${B(money(Pp))} at ${B(ps(R) + '%')} ${B('simple interest')} per year. After how many years will ${who} have earned ${B(money(I))} in interest?`, ...nAns(n, { unit: 'years' }), unit: 'years', hint: 'How much interest is earned each year?',
            steps: [`Interest per year = ${ps(R)}% of ${money(Pp)} = ${money(yr)}`, `Number of years = ${money(I)} ÷ ${money(yr)} = ${B(n)}`] };
        }],
      ['Compound interest',
        'With compound interest, each year\'s interest is added to the account, so next year you earn interest on the interest too. Use a multiplier: amount = principal × (multiplier)<sup>years</sup>. For a 3% rate the multiplier is 1.03; for a loss in value of 15% it is 0.85.',
        (r) => {
          const t = r.int(0, 3);
          if (t <= 1) {
            const Pp = r.pick([500, 750, 1000, 1200, 1500, 2000, 2500, 3000, 4000, 5000, 6000, 10000]); const R = r.pick([1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5, 6]); const n = r.int(2, 8); const m = 1 + R / 100; const A = Pp * m ** n;
            if (t === 0) return { html: `${B(money(Pp))} is invested at ${B(ps(R) + '%')} ${B('compound interest')} per year. How much is in the account after ${B(n + ' years')}? Give your answer to the nearest penny.`, ...nAns(A, { money: true }), format: MONEY_FMT, hint: `The multiplier is ${ps(m)}.`,
              steps: [`Multiplier = 100% + ${ps(R)}% = ${ps(m)}`, `Amount = ${money(Pp)} × ${ps(m)}<sup>${n}</sup>`, `= ${ps(A, 6)}… = ${B(money(A))}`] };
            return { html: `A savings account pays ${B(ps(R) + '%')} ${B('compound interest')} per annum. Sam saves ${B(money(Pp))} and leaves it for ${B(n + ' years')}. How much ${B('interest')} does Sam earn altogether? Give your answer to the nearest penny.`, ...nAns(A - Pp, { money: true }), format: MONEY_FMT, hint: 'Find the final amount, then subtract what Sam put in.',
              steps: [`Multiplier = ${ps(m)}`, `Final amount = ${money(Pp)} × ${ps(m)}<sup>${n}</sup> = ${money(A)}`, `Interest = ${money(A)} − ${money(Pp)} = ${B(money(A - Pp))}`] };
          }
          if (t === 2) {
            const Pp = r.pick([4000, 6000, 8000, 9500, 12000, 15000, 18000, 22000]); const R = r.pick([8, 10, 12, 15, 18, 20, 25]); const n = r.int(2, 5); const m = 1 - R / 100; const A = Pp * m ** n;
            const item = r.pick(['A car', 'A van', 'A motorbike', 'A tractor']);
            return { html: `${item} is bought for ${B(money(Pp))}. It loses ${B(R + '%')} of its value each year (it ${B('depreciates')}). What is it worth after ${B(n + ' years')}? Give your answer to the nearest penny.`, ...nAns(A, { money: true }), format: MONEY_FMT, hint: `Decrease means the multiplier is less than 1: ${ps(m)}.`,
              steps: [`Multiplier = 100% − ${R}% = ${ps(m)}`, `Value = ${money(Pp)} × ${ps(m)}<sup>${n}</sup>`, `= ${B(money(A))}`] };
          }
          const Pp = r.pick([1000, 2000, 2500, 4000, 5000, 8000]); const R = r.pick([2, 3, 4, 5, 6]); const n = r.int(3, 6); const m = 1 + R / 100;
          const simple = Pp * R / 100 * n, comp = Math.round(Pp * m ** n * 100) / 100 - Pp;
          return { html: `${B(money(Pp))} is invested for ${B(n + ' years')} at ${B(R + '%')} per year. How much ${B('more')} interest is earned with ${B('compound')} interest than with ${B('simple')} interest? Give your answer to the nearest penny.`, ...nAns(comp - simple, { money: true }), format: MONEY_FMT, hint: 'Work out both amounts of interest and subtract.',
            steps: [`Simple: ${money(Pp)} × ${R} ÷ 100 × ${n} = ${money(simple)}`, `Compound: ${money(Pp)} × ${ps(m)}<sup>${n}</sup> − ${money(Pp)} = ${money(comp)}`, `Difference = ${money(comp)} − ${money(simple)} = ${B(money(comp - simple))}`] };
        }],
      ['VAT',
        'VAT (Value Added Tax) is added to the price of many goods and services; in the UK the standard rate is 20%. To add VAT multiply by 1.2. To find the price before VAT was added, divide the full price by 1.2. Essentials such as most food have no VAT.',
        (r) => {
          const t = r.int(0, 3); const item = r.pick(['a laptop', 'a washing machine', 'a bike', 'a television', 'a sofa', 'a phone repair', 'a boiler service', 'a pair of headphones']);
          const base = r.int(12, 1500) * 50; const vat = base / 5, full = base + vat; // pence
          if (t === 0) return { html: `The price of ${item} is ${B(P(base))} ${B('plus VAT')} at 20%. Work out the total price including VAT.`, ...nAns(full / 100, { money: true }), format: MONEY_FMT, hint: 'Multiply by 1.2, or find 20% and add it on.',
            steps: [`10% of ${P(base)} = ${P(base / 10)}, so 20% = ${P(vat)}`, `Total = ${P(base)} + ${P(vat)} = ${B(P(full))}`, `(Or: ${P(base)} × 1.2 = ${P(full)})`] };
          if (t === 1) return { html: `A plumber charges ${B(P(base))} before VAT. VAT is charged at 20%. How much VAT is added?`, ...nAns(vat / 100, { money: true }), format: MONEY_FMT, hint: 'Find 10%, then double it.',
            steps: [`10% of ${P(base)} = ${P(base / 10)}`, `20% = 2 × ${P(base / 10)} = ${B(P(vat))}`] };
          if (t === 2) return { html: `The price of ${item} is ${B(P(full))} ${B('including')} VAT at 20%. What was the price before VAT was added?`, ...nAns(base / 100, { money: true }), format: MONEY_FMT, hint: 'The full price is 120% of the original. Divide by 1.2.',
            steps: [`Full price = 120% of the price before VAT`, `${P(full)} ÷ 1.2 = ${B(P(base))}`, `Check: ${P(base)} × 1.2 = ${P(full)} ✓`] };
          // shopping with some VAT-free items
          const food = r.sample([['bread', 145], ['apples', 230], ['milk', 165], ['pasta', 120], ['cheese', 375], ['eggs', 290]], 2);
          const non = r.sample([['batteries', 500], ['shampoo', 350], ['a phone charger', 1200], ['washing-up liquid', 150], ['light bulbs', 600], ['a notebook', 250]], 2);
          const nonTot = non[0][1] + non[1][1], foodTot = food[0][1] + food[1][1]; const tot = foodTot + nonTot * 1.2;
          return { html: `In a shop, food has ${B('no VAT')} but other items have ${B('20% VAT')} added at the till. The prices below are ${B('before VAT')}.${table([['Item', 'Price before VAT'], ...[...food, ...non].map((x) => [x[0], pp(x[1])])])}How much does it cost to buy all four items?`, ...nAns(tot / 100, { money: true }), format: MONEY_FMT, hint: 'Only add VAT to the items that are not food.',
            steps: [`Food (no VAT): ${pp(food[0][1])} + ${pp(food[1][1])} = ${P(foodTot)}`, `Other items: ${pp(non[0][1])} + ${pp(non[1][1])} = ${P(nonTot)}; with VAT: ${P(nonTot)} × 1.2 = ${P(nonTot * 1.2)}`, `Total = ${P(foodTot)} + ${P(nonTot * 1.2)} = ${B(P(tot))}`] };
        }],
      ['Wages, overtime & income tax',
        'Pay = hours × hourly rate. Overtime is often paid at time-and-a-half (1.5 × the normal rate) or double time (2 × the rate). Income tax is paid in bands: no tax on the personal allowance, then a percentage on each slice of income above it.',
        (r) => {
          const t = r.int(0, 3); const who = r.pick(nameSet);
          if (t <= 1) {
            const rate = r.int(55, 95) * 20; // pence, even
            const basic = r.pick([30, 35, 36, 37, 37.5, 38, 40]); const ot = r.int(2, 10); const dbl = t === 1 ? r.int(2, 6) : 0;
            const basicPay = rate * basic, otPay = rate * 1.5 * ot, dPay = rate * 2 * dbl, tot = basicPay + otPay + dPay;
            const html = `${who} earns ${B(P(rate) + ' per hour')} for a basic ${B(ps(basic) + '-hour')} week. Overtime is paid at ${B('time-and-a-half')}${dbl ? `, and Sunday work is paid at ${B('double time')}` : ''}. One week ${who} works the basic hours plus ${B(ot + ' hours')} of overtime${dbl ? ` and ${B(dbl + ' hours')} on Sunday` : ''}. How much does ${who} earn that week?`;
            const steps = [`Basic pay: ${ps(basic)} × ${P(rate)} = ${P(basicPay)}`, `Time-and-a-half rate: ${P(rate)} × 1.5 = ${P(rate * 1.5)}; overtime: ${ot} × ${P(rate * 1.5)} = ${P(otPay)}`];
            if (dbl) steps.push(`Double-time rate: ${P(rate)} × 2 = ${P(rate * 2)}; Sunday: ${dbl} × ${P(rate * 2)} = ${P(dPay)}`);
            steps.push(`Total = ${[basicPay, otPay, dPay].filter((x) => x).map(P).join(' + ')} = ${B(P(tot))}`);
            return { html, ...nAns(tot / 100, { money: true }), format: MONEY_FMT, hint: 'Work out the basic pay and the overtime pay separately.', steps };
          }
          if (t === 2) {
            const sal = r.int(36, 120) * 500; const per = r.pick(['month', 'week']); const v = per === 'month' ? sal / 12 : sal / 52;
            return { html: `${who}'s job has a salary of ${B(money(sal) + ' per year')}. How much is this per ${B(per)}? Give your answer to the nearest penny.`, ...nAns(v, { money: true }), format: MONEY_FMT, hint: `There are ${per === 'month' ? 12 : 52} ${per}s in a year.`,
              steps: [`${money(sal)} ÷ ${per === 'month' ? 12 : 52} = ${ps(v, 5)}…`, `= ${B(money(v))} to the nearest penny`] };
          }
          const sal = r.int(28, 170) * 500; const PA = 12570, HI = 50270;
          const b20 = Math.max(0, Math.min(sal, HI) - PA), b40 = Math.max(0, sal - HI); const tax = 0.2 * b20 + 0.4 * b40; const net = r.chance(0.4);
          const html = `Use these income tax rates:${table([['Income per year', 'Tax rate'], ['first £12,570 (personal allowance)', '0%'], ['£12,571 to £50,270', '20%'], ['over £50,270', '40%']])}${who} earns ${B(money(sal))} a year. ${net ? `How much is left after income tax? (Ignore National Insurance.)` : 'How much income tax does ' + who + ' pay in a year?'}`;
          const steps = [`Tax-free: the first £12,570`, `Taxed at 20%: ${money(Math.min(sal, HI))} − £12,570 = ${money(b20)}; 20% of this = ${money(0.2 * b20)}`];
          if (b40) steps.push(`Taxed at 40%: ${money(sal)} − £50,270 = ${money(b40)}; 40% of this = ${money(0.4 * b40)}`);
          steps.push(`Total tax = ${b40 ? `${money(0.2 * b20)} + ${money(0.4 * b40)} = ` : ''}${net ? money(tax) : B(money(tax))}`);
          if (net) steps.push(`After tax: ${money(sal)} − ${money(tax)} = ${B(money(sal - tax))}`);
          return { html, ...nAns(net ? sal - tax : tax, { money: true }), format: MONEY_FMT, hint: 'Split the salary into the tax bands and tax each slice separately.', steps };
        }],
      ['Exchange rates & unit pricing',
        'An exchange rate such as £1 = €1.15 tells you how much foreign currency one pound buys. Multiply by the rate to change pounds into the other currency; divide by the rate to change back into pounds. To compare prices, work out the cost of one unit (or convert to the same currency).',
        (r) => {
          const CUR = [['euros', '€', [1.12, 1.14, 1.15, 1.16, 1.18, 1.2]], ['US dollars', '$', [1.25, 1.27, 1.3, 1.32, 1.35]], ['Turkish lira', 'TL ', [40, 42, 44, 45]], ['Japanese yen', '¥', [185, 190, 195, 200]], ['Swiss francs', 'CHF ', [1.1, 1.12, 1.14]]];
          const t = r.int(0, 3); const [cn, cs, rates] = r.pick(CUR); const rate = r.pick(rates); const fmt = (v) => `${cs}${ds(v, 2)}`;
          if (t === 0) {
            const gbp = r.pick([20, 40, 50, 75, 80, 100, 150, 200, 250, 300, 350, 400, 450, 500, 600, 750]); const v = gbp * rate; const who = r.pick(nameSet);
            return { html: `The exchange rate is ${B(`£1 = ${cs}${ps(rate)}`)}. ${who} changes ${B(money(gbp))} into ${cn} before a holiday. How many ${cn} does ${who} get?`, ...nAns(v, { dp: 2 }), format: `Type the amount in ${cn}, e.g. 57.50`, hint: 'Pounds → other currency: multiply by the rate.',
              steps: [`Changing pounds into ${cn}, so multiply by the rate (each £1 buys ${cs}${ps(rate)}).`, `${gbp} × ${ps(rate)} = ${B(fmt(v))}`] };
          }
          if (t === 1) {
            const v = r.pick([30, 45, 60, 80, 95, 120, 150, 200, 240, 300, 500]) * (rate > 10 ? 50 : 1); const gbp = v / rate;
            return { html: `The exchange rate is ${B(`£1 = ${cs}${ps(rate)}`)}. A hotel room costs ${B(`${cs}${ds(v)}`)} per night. How much is this in pounds? Give your answer to the nearest penny.`, ...nAns(gbp, { money: true }), format: MONEY_FMT, hint: 'Other currency → pounds: divide by the rate.',
              steps: [`${ds(v)} ÷ ${ps(rate)} = ${ps(gbp, 5)}…`, `= ${B(money(gbp))}`] };
          }
          if (t === 2) {
            const uk = r.int(30, 180); const diffPct = r.pick([-12, -8, -5, 5, 8, 12, 15]); const abroad = Math.round(uk * rate * (1 + diffPct / 100) * (rate > 10 ? 1 : 1)); const abroadGbp = Math.round(abroad / rate * 100) / 100; const diff = Math.abs(uk - abroadGbp);
            const item = r.pick(['pair of trainers', 'video game', 'jacket', 'pair of headphones', 'watch']);
            const where = uk < abroadGbp ? 'in the UK' : 'abroad';
            return { html: `A ${item} costs ${B(money(uk))} in the UK and ${B(`${cs}${ds(abroad)}`)} abroad. The exchange rate is ${B(`£1 = ${cs}${ps(rate)}`)}. How much cheaper, in pounds, is it in the cheaper place? Give your answer to the nearest penny.`, ...nAns(diff, { money: true }), format: MONEY_FMT, hint: 'Convert the foreign price into pounds so both prices are in the same currency.',
              steps: [`Abroad in pounds: ${ds(abroad)} ÷ ${ps(rate)} = ${money(abroadGbp)}`, `It is cheaper ${where}.`, `Difference: ${money(Math.max(uk, abroadGbp))} − ${money(Math.min(uk, abroadGbp))} = ${B(money(diff))}`] };
          }
          let n1, n2, u1, u2; do { n1 = r.int(2, 8); n2 = r.int(2, 12); u1 = r.int(20, 120); u2 = r.int(20, 120); } while (n1 === n2 || Math.abs(u1 - u2) < 3);
          const it = r.pick(['oranges', 'cupcakes', 'cans of pop', 'bread rolls', 'yoghurts', 'pens']);
          const best = u1 < u2 ? 0 : 1;
          return { html: `Shop A sells ${B(`${n1} ${it}`)} for ${B(P(n1 * u1))}. Shop B sells ${B(`${n2} ${it}`)} for ${B(P(n2 * u2))}. Which shop is better value?`, answer: best ? 'B' : 'A', check: { type: 'text', accept: best ? ['B', 'Shop B'] : ['A', 'Shop A'] }, answerHtml: B(best ? 'Shop B' : 'Shop A'), format: 'Type A or B',
            hint: 'Work out the cost of one item at each shop.',
            steps: [`Shop A: ${P(n1 * u1)} ÷ ${n1} = ${u1}p each`, `Shop B: ${P(n2 * u2)} ÷ ${n2} = ${u2}p each`, `${B(best ? 'Shop B' : 'Shop A')} is cheaper per item, so it is better value.`] };
        }],
    ]);

  // =====================================================================
  // 3. Ratio & inverse proportion problems
  // =====================================================================
  function convGraph(cfg, nx) {
    const x0 = 52, y0 = 210, W = 280, Hh = 180; const sx = W / nx, sy = Hh / nx; let body = '';
    for (let i = 0; i <= nx; i++) {
      body += sL(x0 + i * sx, y0, x0 + i * sx, y0 - Hh, { op: 0.25, w: 1 }) + sL(x0, y0 - i * sy, x0 + W, y0 - i * sy, { op: 0.25, w: 1 });
      body += sT(x0 + i * sx, y0 + 14, ds(cfg.a * i), { fs: 11 }) + sT(x0 - 6, y0 - i * sy, ds(cfg.b * i), { fs: 11, a: 'end' });
    }
    body += sL(x0, y0, x0 + W, y0) + sL(x0, y0, x0, y0 - Hh) + sL(x0, y0, x0 + W, y0 - Hh, { c: ACC, w: 2.5 });
    body += sT(x0 + W / 2, y0 + 32, cfg.xl, { fs: 12 }) + `<text x="14" y="${y0 - Hh / 2}" transform="rotate(-90 14 ${y0 - Hh / 2})" text-anchor="middle" fill="currentColor" stroke="none" font-size="12">${cfg.yl}</text>`;
    return svgWrap(350, 250, body, false);
  }
  const CONV = [
    { xl: 'miles', yl: 'kilometres', xu: 'miles', yu: 'km', a: 5, b: 8 },
    { xl: 'pounds (£)', yl: 'euros (€)', xu: '£', yu: '€', a: 20, b: 23, money: true },
    { xl: 'kilograms', yl: 'pounds (lb)', xu: 'kg', yu: 'lb', a: 5, b: 11 },
    { xl: 'gallons', yl: 'litres', xu: 'gallons', yu: 'litres', a: 2, b: 9 },
    { xl: 'inches', yl: 'centimetres', xu: 'inches', yu: 'cm', a: 2, b: 5 },
    { xl: 'pounds (£)', yl: 'US dollars ($)', xu: '£', yu: '$', a: 10, b: 13, money: true },
  ];
  const qty = (c, v, y) => { const u = y ? c.yu : c.xu; return (u === '£' || u === '€' || u === '$') ? `${u}${ds(v)}` : `${ds(v)} ${u}`; };

  topic('y9-ratio-proportion', 'ratio', 9, 3, 'FH', 'Ratio & Inverse Proportion Problems',
    'Share in a ratio, find totals from one part or a difference, use conversion graphs, and solve inverse proportion and best-buy problems.', [
      ['Sharing a whole in a ratio',
        'Add the parts of the ratio to find the total number of shares. Divide the whole amount by that total to find the value of one share, then multiply by each part of the ratio.',
        (r) => {
          const three = r.chance(0.35); let parts; do { parts = Array.from({ length: three ? 3 : 2 }, () => r.int(1, 9)); } while (parts.reduce(gcd) !== 1 || new Set(parts).size < parts.length);
          const S = parts.reduce((a, b) => a + b, 0); const ctx = r.int(0, 2); const names = r.sample(nameSet, parts.length);
          let one, total, unit, fmtv, ask;
          if (ctx === 0) { one = r.chance(0.3) ? r.int(2, 60) * 50 / 100 + r.int(1, 30) : r.int(2, 80); total = one * S; fmtv = (v) => money(v); unit = null; }
          else if (ctx === 1) { one = r.int(2, 25); total = one * S; fmtv = (v) => `${ds(v)} sweets`; }
          else { one = r.int(2, 40) * 5; total = one * S; fmtv = (v) => `${ds(v)} g`; unit = 'g'; }
          const whoI = r.int(0, parts.length - 1); const diff = r.chance(0.3) && !three;
          const lead = ctx === 0 ? `${names.join(', ').replace(/, ([^,]*)$/, ' and $1')} share ${B(money(total))} in the ratio ${B(parts.join(' : '))}.`
            : ctx === 1 ? `${names.join(', ').replace(/, ([^,]*)$/, ' and $1')} share ${B(total + ' sweets')} in the ratio ${B(parts.join(' : '))}.`
              : `A mortar mix uses ${three ? 'cement, sand and lime' : 'cement and sand'} in the ratio ${B(parts.join(' : '))}. A builder makes ${B(total + ' g')} of mix.`;
          const lab = ctx === 2 ? ['cement', 'sand', 'lime'] : names;
          if (diff) {
            const [i, j] = parts[0] > parts[1] ? [0, 1] : [1, 0]; const v = one * (parts[i] - parts[j]);
            ask = ctx === 2 ? `How much more ${lab[i]} than ${lab[j]} is used?` : `How ${ctx === 0 ? 'much more does' : 'many more sweets does'} ${lab[i]} get than ${lab[j]}?`;
            return { html: `${lead} ${ask}`, ...(ctx === 0 ? nAns(v, { money: true }) : nAns(v, unit ? { unit } : {})), ...(unit ? { unit } : {}), format: ctx === 0 ? MONEY_FMT : '', hint: 'Find one share, then work out the difference in shares.',
              steps: [`Total shares = ${parts.join(' + ')} = ${S}`, `One share = ${ctx === 0 ? money(total) : ds(total)} ÷ ${S} = ${fmtv(one)}`, `Difference = ${parts[i]} − ${parts[j]} = ${parts[i] - parts[j]} shares = ${B(fmtv(v))}`] };
          }
          const v = one * parts[whoI];
          ask = ctx === 2 ? `How much ${lab[whoI]} is used?` : `How ${ctx === 0 ? 'much does' : 'many sweets does'} ${lab[whoI]} get?`;
          return { html: `${lead} ${ask}`, ...(ctx === 0 ? nAns(v, { money: true }) : nAns(v, unit ? { unit } : {})), ...(unit ? { unit } : {}), format: ctx === 0 ? MONEY_FMT : '', hint: 'How many shares are there altogether?',
            steps: [`Total shares = ${parts.join(' + ')} = ${S}`, `One share = ${ctx === 0 ? money(total) : ds(total)} ÷ ${S} = ${fmtv(one)}`, `${lab[whoI][0].toUpperCase() + lab[whoI].slice(1)}: ${parts[whoI]} × ${fmtv(one)} = ${B(fmtv(v))}`] };
        }],
      ['Ratio problems from one part or a difference',
        'When you know one part, divide it by its number of shares to find one share. When you know the difference between two parts, divide by the difference in shares. Then scale one share up to find any other part or the total.',
        (r) => {
          let p, q; do { p = r.int(1, 9); q = r.int(1, 9); } while (p === q || gcd(p, q) !== 1); const one = r.int(2, 20); const t = r.int(0, 4);
          if (t === 4) {
            const n = r.int(2, 9); const k = r.int(2, 15); const [a, b] = r.pick([['blue pens', 'red pens'], ['white tiles', 'black tiles'], ['apple trees', 'pear trees'], ['adult tickets', 'child tickets'], ['plain biscuits', 'chocolate biscuits']]);
            const nFirst = r.chance(); const ratio = nFirst ? `${n} : 1` : `1 : ${n}`; const known = nFirst ? b : a, other = nFirst ? a : b; const askTotal = r.chance(0.35);
            return { html: `The ratio of ${a} to ${b} is ${B(ratio)}. There are ${B(`${k} ${known}`)}. ${askTotal ? `How many ${a.split(' ').pop()} are there altogether?` : `How many ${other} are there?`}`,
              ...nAns(askTotal ? k * (n + 1) : k * n), hint: `The "1" part of the ratio is the ${known}, so one share is ${k}.`,
              steps: [`${known[0].toUpperCase() + known.slice(1)} are the 1 part: 1 share = ${k}`, `${other[0].toUpperCase() + other.slice(1)} = ${n} shares = ${n} × ${k} = ${askTotal ? k * n : B(k * n)}`].concat(askTotal ? [`Altogether = ${k} + ${k * n} = ${B(k * (n + 1))}`] : []) };
          }
          if (t === 0) {
            const [a, b] = r.pick([['blue pens', 'red pens'], ['boys', 'girls'], ['adults', 'children'], ['cats', 'dogs'], ['milk chocolates', 'dark chocolates']]);
            return { html: `In a ${a === 'blue pens' || a === 'milk chocolates' ? 'box' : 'group'}, the ratio of ${a} to ${b} is ${B(`${p} : ${q}`)}. There are ${B(`${q * one} ${b}`)}. How many ${a} are there?`, ...nAns(p * one), hint: `${q} shares = ${q * one}.`,
              steps: [q > 1 ? `${q} shares = ${q * one}, so 1 share = ${q * one} ÷ ${q} = ${one}` : `1 share = ${one}`, `${a[0].toUpperCase() + a.slice(1)} = ${p} shares = ${p} × ${one} = ${B(p * one)}`] };
          }
          if (t === 1) {
            const [a, b] = r.sample(nameSet, 2); const m = r.int(2, 30);
            return { html: `${a} and ${b} share some money in the ratio ${B(`${p} : ${q}`)}. ${a} gets ${B(money(p * m))}. How much money was shared altogether?`, ...nAns((p + q) * m, { money: true }), format: MONEY_FMT, hint: `${p} shares = ${money(p * m)}.`,
              steps: [`1 share = ${money(p * m)} ÷ ${p} = ${money(m)}`, `Total shares = ${p} + ${q} = ${p + q}`, `Total = ${p + q} × ${money(m)} = ${B(money((p + q) * m))}`] };
          }
          if (t === 2) {
            const [big, small] = p > q ? [p, q] : [q, p]; const [a, b] = r.sample(nameSet, 2); const m = r.int(2, 25);
            return { html: `${a} and ${b} share money in the ratio ${B(`${big} : ${small}`)}. ${a} gets ${B(money((big - small) * m))} more than ${b}. How much money do they share in total?`, ...nAns((big + small) * m, { money: true }), format: MONEY_FMT, hint: 'The difference in shares matches the difference in money.',
              steps: [`Difference in shares = ${big} − ${small} = ${big - small}`, `${big - small} share${big - small > 1 ? 's' : ''} = ${money((big - small) * m)}, so 1 share = ${money(m)}`, `Total = (${big} + ${small}) × ${money(m)} = ${B(money((big + small) * m))}`] };
          }
          const [big, small] = p > q ? [p, q] : [q, p];
          return { html: `In a school orchestra the ratio of string players to wind players is ${B(`${big} : ${small}`)}. There are ${B((big - small) * one)} more string players than wind players. How many ${B('wind players')} are there?`, ...nAns(small * one), hint: 'Use the difference to find one share.',
            steps: [`Difference = ${big} − ${small} = ${big - small} shares = ${(big - small) * one} players`, `1 share = ${(big - small) * one} ÷ ${big - small} = ${one}`, `Wind players = ${small} × ${one} = ${B(small * one)}`] };
        }],
      ['Conversion graphs & direct proportion',
        'A conversion graph is a straight line through the origin, because the two quantities are in direct proportion. Read across from one axis to the line, then to the other axis. For values beyond the graph, read off a convenient pair and scale it up.',
        (r) => {
          const c = r.pick(CONV); const nx = r.int(4, 6); const j = r.int(1, nx); const rev = r.chance(); const beyond = r.chance(0.45);
          const K = beyond ? r.pick([10, 20, 25, 50, 100]) : 1; const x = c.a * j * K, y = c.b * j * K;
          const given = rev ? qty(c, y, true) : qty(c, x, false); const want = rev ? (c.xu === '£' ? 'pounds' : c.xu) : (c.yu === '€' ? 'euros' : c.yu === '$' ? 'dollars' : c.yu);
          const ans = rev ? x : y;
          const steps = beyond ? [`The graph shows ${qty(c, c.a * j, false)} = ${qty(c, c.b * j, true)} (where the line crosses a grid point).`, `${given} is ${K} times as much, so multiply by ${K}.`, `${ds(rev ? c.a * j : c.b * j)} × ${K} = ${B(rev ? qty(c, x, false) : qty(c, y, true))}`]
            : [`Find ${given} on the ${rev ? 'vertical' : 'horizontal'} axis.`, `Go ${rev ? 'across' : 'up'} to the line, then ${rev ? 'down' : 'across'} to the other axis.`, `${given} = ${B(rev ? qty(c, x, false) : qty(c, y, true))}`];
          return { html: `The graph converts between ${c.xl} and ${c.yl}. Use it to convert ${B(given)} into ${want}.`, diagram: convGraph(c, nx), ...nAns(ans), unit: c.money ? '' : (rev ? c.xu : c.yu), format: 'Type a number', hint: beyond ? 'This is off the graph: read a pair of values from the graph, then multiply.' : 'Read across to the line and then to the other axis.', steps };
        }],
      ['Inverse proportion',
        'Two quantities are in inverse proportion when one is multiplied by a number and the other is divided by the same number — for example, more workers means less time. Their product stays the same, so work out the total (such as worker-days) first.',
        (r) => {
          const t = r.int(0, 3);
          if (t === 0) {
            let w1, d1, w2, k; do { w1 = r.int(2, 12); d1 = r.int(2, 30); k = w1 * d1; w2 = r.int(2, 20); } while (w2 === w1 || k % w2 !== 0);
            const job = r.pick(['build a wall', 'paint a school', 'lay a patio', 'harvest a field', 'decorate a hotel']);
            return { html: `${B(w1 + ' workers')} take ${B(d1 + ' days')} to ${job}. How many days would ${B(w2 + ' workers')} take, working at the same rate?`, ...nAns(k / w2, { unit: 'days' }), unit: 'days', hint: 'Work out how many worker-days the job needs.',
              steps: [`Total work = ${w1} × ${d1} = ${k} worker-days`, `${w2} workers: ${k} ÷ ${w2} = ${B(k / w2)} days`, `More workers → fewer days, so this is inverse proportion.`] };
          }
          if (t === 1) {
            let n1, h1, n2, k; do { n1 = r.int(1, 6); h1 = r.int(2, 24); k = n1 * h1; n2 = r.int(2, 8); } while (n2 === n1 || k % n2 !== 0);
            return { html: `With ${B(n1 + ' identical tap' + (n1 > 1 ? 's' : ''))} running, a pool fills in ${B(h1 + ' hours')}. How long would it take to fill with ${B(n2 + ' taps')}?`, ...nAns(k / n2, { unit: 'hours' }), unit: 'hours', hint: 'How long would one tap take?',
              steps: [`One tap would take ${n1} × ${h1} = ${k} hours`, `${n2} taps: ${k} ÷ ${n2} = ${B(k / n2)} hours`] };
          }
          if (t === 2) {
            let s1, t1, s2, k; do { s1 = r.pick([20, 30, 40, 45, 50, 60, 70, 80]); t1 = r.int(2, 9); k = s1 * t1; s2 = r.pick([20, 30, 40, 45, 50, 60, 70, 80, 90]); } while (s2 === s1 || (k * 60) % s2 !== 0 || k / s2 > 8 || k / s2 < 1);
            const T = k / s2; const hrs = Math.floor(T), mins = Math.round((T - hrs) * 60);
            return { html: `A coach journey takes ${B(t1 + ' hours')} at an average speed of ${B(s1 + ' mph')}. How many ${B('minutes')} would the same journey take at ${B(s2 + ' mph')}?`, ...nAns(T * 60, { unit: 'minutes' }), unit: 'minutes', hint: 'Find the distance first (speed × time).',
              steps: [`Distance = ${s1} × ${t1} = ${k} miles`, `Time = ${k} ÷ ${s2} = ${ps(T, 4)} hours${mins ? ` = ${hrs} h ${mins} min` : ''}`, `In minutes: ${B(ds(T * 60))} minutes`] };
          }
          let a1, b1, a2, k; do { a1 = r.int(2, 12); b1 = r.int(2, 30); k = a1 * b1; a2 = r.int(2, 30); } while (a2 === a1 || k % a2 !== 0);
          const [X, Y] = r.pick([['T', 'G'], ['y', 'x'], ['P', 'Q'], ['m', 'n']]);
          return { html: `${B(`<i>${X}</i>`)} is inversely proportional to ${B(`<i>${Y}</i>`)}. When <i>${Y}</i> = ${a1}, <i>${X}</i> = ${b1}. Find <i>${X}</i> when <i>${Y}</i> = ${a2}.${table([[`<i>${Y}</i>`, String(a1), String(a2)], [`<i>${X}</i>`, String(b1), '?']])}`, ...nAns(k / a2), hint: `For inverse proportion, <i>${X}</i> × <i>${Y}</i> is always the same.`,
            steps: [`<i>${X}</i> × <i>${Y}</i> = ${b1} × ${a1} = ${k}`, `<i>${X}</i> = ${k} ÷ ${a2} = ${B(ds(k / a2))}`].concat(a2 % a1 === 0 ? [`(<i>${Y}</i> was multiplied by ${a2 / a1}, so <i>${X}</i> is divided by ${a2 / a1}.)`] : a1 % a2 === 0 ? [`(<i>${Y}</i> was divided by ${a1 / a2}, so <i>${X}</i> is multiplied by ${a1 / a2}.)`] : []) };
        }],
      ['Best buys',
        'To find the best buy, compare equal amounts: work out the cost of one unit (per item, per 100 g, per litre) for each option — or how much you get per £1. The lowest cost per unit, or the most per pound, is the best value.',
        (r) => {
          if (r.chance(0.3)) { // compare "how much per £1"
            const it = r.pick([['cans of pop', 'cans'], ['bread rolls', 'rolls'], ['tennis balls', 'balls'], ['yoghurts', 'yoghurts']]);
            let nA, nB, pA, pB, perA, perB; do { nA = r.int(3, 12); nB = r.int(3, 12); pA = Math.round(nA * r.int(15, 70) / 10) * 10; pB = Math.round(nB * r.int(15, 70) / 10) * 10; perA = nA / (pA / 100); perB = nB / (pB / 100); } while (nA === nB || Math.abs(perA - perB) < 0.15);
            const best = perA > perB ? 'A' : 'B';
            return { html: `Shop A sells ${B(`${nA} ${it[0]}`)} for ${B(P(pA))}. Shop B sells ${B(`${nB} ${it[0]}`)} for ${B(P(pB))}. By working out how many ${it[1]} you get ${B('for each £1')}, decide which shop is better value.`,
              answer: best, check: { type: 'text', accept: [best, 'Shop ' + best] }, answerHtml: B('Shop ' + best), format: 'Type A or B', hint: 'Divide the number of items by the price in pounds.',
              steps: [`Shop A: ${nA} ÷ ${ps(pA / 100)} = ${ps(perA, 2)} ${it[1]} per £1`, `Shop B: ${nB} ÷ ${ps(pB / 100)} = ${ps(perB, 2)} ${it[1]} per £1`, `More for each pound is better value: ${B('Shop ' + best)}`] };
          }
          const prods = [['rice', 'g', [500, 750, 1000, 2000, 2500, 5000], 100, 'per 100 g'], ['juice', 'ml', [250, 500, 750, 1000, 1500, 2000], 100, 'per 100 ml'], ['washing powder', 'g', [800, 1000, 1600, 2000, 2400, 3000], 100, 'per 100 g'], ['cans of pop', 'cans', [4, 6, 8, 10, 12, 24], 1, 'per can']];
          const [nm, u, sizes, per, perT] = r.pick(prods); const n = r.chance(0.5) ? 3 : 2; const labels = ['A', 'B', 'C'];
          let opts; do {
            opts = r.sample(sizes, n).map((s) => { const up = r.int(8, 60); return { s, up, price: s / per * up }; });
          } while (new Set(opts.map((o) => o.up)).size < n || opts.some((o) => o.price > 3000) || Math.min(...opts.map((o) => o.up)) * 1.04 > [...opts.map((o) => o.up)].sort((a, b) => a - b)[1]);
          const bi = opts.reduce((bi, o, i) => (o.up < opts[bi].up ? i : bi), 0);
          const sz = (o) => (u === 'cans' ? `${o.s} cans` : o.s >= 1000 && u === 'g' ? `${ds(o.s / 1000)} kg` : o.s >= 1000 ? `${ds(o.s / 1000)} litre${o.s > 1000 ? 's' : ''}` : `${o.s} ${u}`);
          const rows = [['Pack', 'Size', 'Price'], ...opts.map((o, i) => [labels[i], sz(o), P(o.price)])];
          return { html: `${nm[0].toUpperCase() + nm.slice(1)} ${nm === 'cans of pop' ? 'are' : 'is'} sold in ${n} sizes.${table(rows)}Which pack is the best buy?`, answer: labels[bi], check: { type: 'text', accept: [labels[bi], 'Pack ' + labels[bi]] }, answerHtml: B('Pack ' + labels[bi]), format: `Type ${labels.slice(0, n).join(', ').replace(/, ([^,]*)$/, ' or $1')}`, hint: `Work out the cost ${perT} for each pack.`,
            steps: [...opts.map((o, i) => `Pack ${labels[i]}: ${P(o.price)} ÷ ${ds(o.s / per)} = ${o.up}p ${perT}`), `Lowest cost ${perT}: ${B('Pack ' + labels[bi])}`] };
        }],
    ]);

  // =====================================================================
  // 4. Reverse percentages (extra style for y9-percentage-change)
  // =====================================================================
  addStyles('y9-percentage-change', [
    ['Reverse percentages',
      'When you know the amount AFTER a percentage change, the new amount is a percentage of the original — e.g. after a 20% increase it is 120%. Divide by the multiplier (1.2) to get back to 100%, or find 1% (or 10%) first and scale up to 100%. Never just take the percentage off the new amount.',
      (r) => {
        const t = r.int(0, 2);
        if (t === 2) {
          const p = r.pick([10, 20, 25, 30, 40, 60, 70, 75, 80, 120, 140, 150, 160]); let O; do { O = r.int(2, 60) * r.pick([5, 10]); } while ((O * p) % 100);
          const v = O * p / 100;
          return { html: `${B(p + '%')} of a number is ${B(ds(v))}. What is the number?`, ...nAns(O), hint: p % 10 === 0 ? `Find 10% first.` : 'Find 1% first.',
            steps: p % 10 === 0 ? [`${p}% = ${ds(v)}`, `10% = ${ds(v)} ÷ ${p / 10} = ${ds(v / (p / 10))}`, `100% = ${ds(v / (p / 10))} × 10 = ${B(ds(O))}`] : [`${p}% = ${ds(v)}`, `1% = ${ds(v)} ÷ ${p} = ${ds(v / p)}`, `100% = ${ds(v / p)} × 100 = ${B(ds(O))}`] };
        }
        const up = t === 0;
        // [text(p, Nstr), isMoney, lo, hi, step] — original = step × int(lo..hi)
        const CTX = up ? [
          [(p, N) => `After a ${B(p + '%')} pay rise, ${r.pick(nameSet)} earns ${B(N)} a month. What was the monthly pay before the rise?`, true, 80, 350, 10],
          [(p, N) => `The price of an annual train season ticket rose by ${B(p + '%')} to ${B(N)}. What was the price before the rise?`, true, 100, 600, 10],
          [(p, N) => `A house increased in value by ${B(p + '%')}. It is now worth ${B(N)}. What was it worth before?`, true, 60, 400, 1000],
          [(p, N) => `The number of members of a sports club increased by ${B(p + '%')} to ${B(N)}. How many members were there before?`, false, 4, 60, 20],
          [(p, N) => `A shop adds ${B(p + '%')} to the price it paid for a bike. It sells the bike for ${B(N)}. How much did the shop pay?`, true, 20, 160, 5],
        ] : [
          [(p, N) => `In a sale, everything is reduced by ${B(p + '%')}. A jacket now costs ${B(N)}. What was its original price?`, true, 4, 60, 5],
          [(p, N) => `After a ${B(p + '%')} discount, a holiday costs ${B(N)}. What was the price before the discount?`, true, 30, 300, 10],
          [(p, N) => `A car lost ${B(p + '%')} of its value in a year and is now worth ${B(N)}. What was it worth a year ago?`, true, 20, 150, 100],
          [(p, N) => `The population of a village fell by ${B(p + '%')} to ${B(N)}. What was the population before?`, false, 10, 120, 20],
          [(p, N) => `A games console is on offer with ${B(p + '%')} off. The offer price is ${B(N)}. What is the normal price?`, true, 16, 90, 5],
        ];
        const [txt, isMoney, lo, hi, step] = r.pick(CTX);
        const p = up ? r.pick([5, 10, 12, 15, 20, 25, 30, 40, 50]) : r.pick([5, 10, 15, 20, 25, 30, 35, 40, 60]); const m = up ? 100 + p : 100 - p;
        let O; do { O = r.int(lo, hi) * step; } while (!isMoney && (O * m) % 100 !== 0);
        const N = O * m / 100; const fmtV = (v) => (isMoney ? money(v) : ds(v));
        return { html: txt(p, fmtV(N)), ...(isMoney ? nAns(O, { money: true }) : nAns(O)), format: isMoney ? MONEY_FMT : 'Type a number', hint: `The new amount is ${m}% of the original. Divide by ${ps(m / 100)}.`,
          steps: [`${up ? 'Increase' : 'Decrease'} of ${p}%: new amount = 100% ${up ? '+' : '−'} ${p}% = ${m}% of the original`, `Multiplier = ${ps(m / 100)}, so original = ${fmtV(N)} ÷ ${ps(m / 100)}`, `= ${B(fmtV(O))}`,
            `Or by scaling: ${m}% = ${fmtV(N)}, so 1% = ${fmtV(N)} ÷ ${m} = ${ps(N / m, 6)}, and 100% = ${B(fmtV(O))}`, `Check: ${fmtV(O)} × ${ps(m / 100)} = ${fmtV(N)} ✓`] };
      }],
  ]);

  // =====================================================================
  // School-sheet gap fillers
  // =====================================================================
  const sfParts = (v) => { const [m, e] = v.toExponential(10).split('e'); return [ps(+m), +e]; };
  const sfH = (m, e) => `${m} × 10<sup>${ds(e)}</sup>`;
  const sfAnswer = (v) => { const [m, e] = sfParts(v); return { answer: `${m}×10^${e}`, check: { type: 'number', value: v, sf: true, tol: Math.abs(v) * 1e-9 }, answerHtml: B(sfH(m, e)), format: 'Type it like 3.2×10^5 (or 3.2x10^5, or 3.2e5)' }; };

  addStyles('y9-standard-form', [
    ['Adding, subtracting & tidying standard form',
      'To add or subtract, first make the powers of 10 the same (or write both as ordinary numbers), then combine the front numbers. If the front number ends up outside 1 to 10, adjust it: 14 × 10⁵ = 1.4 × 10⁶ and 0.5 × 10³ = 5 × 10².',
      (r) => {
        const t = r.int(0, 3);
        if (t === 0) { // same power, answer needs tidying
          let a, b; do { a = r.int(2, 9); b = r.int(2, 9); } while (a + b < 10 || a === b); const n = r.int(-6, 9); const v = Number(`${a + b}e${n}`); const [m, e] = sfParts(v);
          return { html: `Work out ${B(`(${sfH(a, n)}) + (${sfH(b, n)})`)}. Give your answer in standard form.`, ...sfAnswer(v), hint: 'The powers are the same, so add the front numbers — then check the front number is between 1 and 10.',
            steps: [`Same power of 10, so add the front numbers: ${a} + ${b} = ${a + b}`, `${sfH(a + b, n)} — but ${a + b} is not between 1 and 10`, `${a + b} = 1.${(a + b) % 10 ? (a + b) % 10 : ''} × 10, so the answer is ${B(sfH(m, e))}`.replace('1. ×', '1 ×')] };
        }
        if (t === 1) { // different powers, add or subtract
          const A = r.int(11, 99), Bm = r.int(11, 99); const n = r.int(2, 7); const d = r.pick([1, 2]); const add = r.chance();
          const x = Number(`${A / 10}e${n}`), y = Number(`${Bm / 10}e${n - d}`); const v = add ? x + y : x - y; const [m, e] = sfParts(v);
          return { html: `Work out ${B(`(${sfH(A / 10, n)}) ${add ? '+' : '−'} (${sfH(Bm / 10, n - d)})`)}. Give your answer in standard form.`, ...sfAnswer(v), hint: 'Write both as ordinary numbers first (or make the powers the same).',
            steps: [`${sfH(A / 10, n)} = ${ds(x)}`, `${sfH(Bm / 10, n - d)} = ${ds(y)}`, `${ds(x)} ${add ? '+' : '−'} ${ds(y)} = ${ds(v)}`, `In standard form: ${B(sfH(m, e))}`] };
        }
        if (t === 2) { // tidy a non-standard number
          const big = r.chance(); const fr = big ? r.pick([r.int(11, 99), r.int(101, 999)]) : r.pick([r.int(11, 99) / 100, r.int(1, 9) / 10]); const n = r.int(-5, 8);
          const v = Number(`${fr}e${n}`); const [m, e] = sfParts(v); const sh = e - n;
          return { html: `${B(sfH(ps(fr), n))} is not in standard form. Write it in standard form.`, ...sfAnswer(v), hint: 'Make the front number between 1 and 10, then change the power to balance it.',
            steps: [`${ps(fr)} is not between 1 and 10: ${ps(fr)} = ${m} × 10<sup>${ds(sh)}</sup>`, `So ${sfH(ps(fr), n)} = ${m} × 10<sup>${ds(sh)}</sup> × 10<sup>${ds(n)}</sup>`, `Add the powers: ${B(sfH(m, e))}`] };
        }
        // division where the divisor is not in standard form, e.g. (1.5 × 10^5) ÷ (0.3 × 10^3)
        let q, b; do { q = r.int(2, 9); b = r.int(2, 9); } while (q * b < 10 || (q * b) % 10 === 0);
        const bb = b / 10, top = q * b / 10; const p = r.int(4, 9), n2 = r.int(1, 3); const v = Number(`${q}e${p - n2}`);
        return { html: `Work out ${B(`(${sfH(ps(top), p)}) ÷ (${sfH(ps(bb), n2)})`)}. Give your answer in standard form.`, ...sfAnswer(v), hint: 'Divide the front numbers and subtract the powers.',
          steps: [`Divide the front numbers: ${ps(top)} ÷ ${ps(bb)} = ${ps(top * 10)} ÷ ${b} = ${q}`, `Subtract the powers: 10<sup>${p}</sup> ÷ 10<sup>${n2}</sup> = 10<sup>${p - n2}</sup>`, `${q} is between 1 and 10, so the answer is ${B(sfH(q, p - n2))}`] };
      }],
  ]);

  const FDP = [[1, 2], [1, 4], [3, 4], [1, 5], [2, 5], [3, 5], [4, 5], [1, 8], [3, 8], [5, 8], [7, 8], [1, 10], [3, 10], [7, 10], [9, 10], [1, 20], [3, 20], [7, 20], [11, 20], [1, 25], [6, 25], [12, 25], [1, 50], [17, 50], [21, 25]];
  const REC = [[1, 3, '0.333…'], [2, 3, '0.666…'], [1, 9, '0.111…'], [4, 9, '0.444…'], [1, 6, '0.1666…'], [5, 6, '0.8333…'], [1, 11, '0.0909…'], [7, 9, '0.777…']];
  addStyles('y9-percentage-change', [
    ['Fractions, decimals & percentages',
      'Per cent means "out of 100". Decimal → percentage: × 100. Fraction → decimal: divide the numerator by the denominator (or make the denominator 100). Some fractions, such as ⅓, give recurring decimals.',
      (r) => {
        const t = r.int(0, 5); const [n, d] = r.pick(FDP); const dec = n / d, pc = dec * 100;
        if (t === 0) return { html: `Write ${B(frac(n, d))} as a percentage.`, ...nAns(pc, { unit: '%' }), unit: '%', hint: 'Make the denominator 100, or divide and multiply by 100.',
          steps: 100 % d === 0 ? [`${frac(n, d)} = ${frac(n * 100 / d, 100)} (multiply top and bottom by ${100 / d})`, `${n * 100 / d} out of 100 = ${B(ps(pc) + '%')}`] : [`${n} ÷ ${d} = ${ps(dec)}`, `${ps(dec)} × 100 = ${B(ps(pc) + '%')}`] };
        if (t === 1) return { html: `Write ${B(ps(pc) + '%')} as a fraction in its simplest form.`, ...fAns(n, d), format: 'Type a fraction, e.g. 3/20', hint: 'Write it over 100, then simplify.',
          steps: [`${ps(pc)}% = ${frac(ps(pc), 100)}${pc % 1 ? ` = ${frac(ps(pc * 10), 1000)}` : ''}`, `Simplify: ${B(frac(n, d))}`] };
        if (t === 2) { const dv = r.pick([0.7, 0.07, 0.35, 0.125, 1.2, 0.04, 0.65, 0.9, 0.015, 2.5, 0.48]); const up = r.chance();
          return up ? { html: `Write ${B(ps(dv))} as a percentage.`, ...nAns(dv * 100, { unit: '%' }), unit: '%', hint: 'Multiply by 100.', steps: [`${ps(dv)} × 100`, `= ${B(ps(dv * 100) + '%')}`] }
            : { html: `Write ${B(ps(dv * 100) + '%')} as a decimal.`, ...nAns(dv), hint: 'Divide by 100.', steps: [`${ps(dv * 100)} ÷ 100`, `= ${B(ps(dv))}`] }; }
        if (t === 3) { const [a, b, s] = r.pick(REC); const wrong = [ps(Math.round(a / b * 10) / 10), ps(Math.round(a / b * 100) / 100), `0.${a}${b}`].filter((x) => x !== s);
          const opts = [...new Set([s, ...wrong])];
          return { html: `Which decimal is exactly equal to ${B(frac(a, b))}?`, ...mcq(r, opts, 0), hint: 'Use short division — does it stop or repeat?',
            steps: [`${a} ÷ ${b} = ${s} — the digits repeat for ever (a recurring decimal).`, `Values such as ${wrong[0]} are rounded, so they are close but not exact. The answer is ${B(s)}.`] }; }
        if (t === 4) { // compare a fraction, a decimal and a percentage
          let fs3; do { fs3 = r.sample(FDP, 3); } while (new Set(fs3.map((f) => f[0] / f[1])).size < 3);
          const vals = fs3.map((f) => f[0] / f[1]); const labels = [`${fs3[0][0]}/${fs3[0][1]}`, ps(vals[1]), ps(vals[2] * 100) + '%']; const shown = [frac(fs3[0][0], fs3[0][1]), labels[1], labels[2]];
          const big = r.chance(); const k = vals.reduce((bi, v, i) => ((big ? v > vals[bi] : v < vals[bi]) ? i : bi), 0);
          return { html: `Which is the ${B(big ? 'largest' : 'smallest')}: ${shown.map((x) => B(x)).join(', ')}?`, ...mcq(r, labels, k), hint: 'Change them all into the same form, e.g. percentages.',
            steps: [...labels.map((l, i) => `${shown[i]} = ${ps(vals[i] * 100)}%`), `The ${big ? 'largest' : 'smallest'} is ${B(shown[k])}.`] };
        }
        // amount as a percentage
        const tot = r.pick([20, 25, 40, 50, 80, 200, 250, 400]); let part; do { part = r.int(1, tot - 1); } while ((part * 100) % tot);
        const ctx = r.pick([['scored', 'marks', 'in a test out of'], ['answered', 'questions correctly', 'in a quiz of'], ['sold', 'tickets', 'from a batch of']]);
        return { html: `${r.pick(nameSet)} ${ctx[0]} ${B(part)} ${ctx[1]} ${ctx[2]} ${B(tot)}. What percentage is this?`, ...nAns(part * 100 / tot, { unit: '%' }), unit: '%', hint: 'Write it as a fraction, then change to a percentage.',
          steps: [`As a fraction: ${frac(part, tot)}`, `${frac(part, tot)} = ${frac(part * 100 / tot, 100)}`, `= ${B(ps(part * 100 / tot) + '%')}`] };
      }],
    ['Percentage profit & loss',
      'Percentage profit (or loss) = change ÷ ORIGINAL price × 100. The original is the price paid (the cost), not the selling price.',
      (r) => {
        const p = r.pick([5, 10, 12.5, 15, 20, 25, 30, 35, 37.5, 40, 45, 60, 2.5, 17.5, 7.5]); const up = r.chance();
        const ctx = r.pick([['a phone', 1, [8, 60], 5], ['a house', 1000, [90, 400], 1], ['a car', 100, [20, 300], 1], ['a painting', 10, [5, 200], 1], ['a bike', 1, [20, 120], 5], ['a games console', 1, [10, 60], 10]]);
        let C; do { C = r.int(ctx[2][0], ctx[2][1]) * ctx[1] * ctx[3]; } while (!Number.isInteger(C * p) || (ctx[1] >= 10 && !Number.isInteger(C * p / 100)));
        const S = C * (up ? 100 + p : 100 - p) / 100; const who = r.pick(nameSet);
        return { html: `${who} bought ${ctx[0]} for ${B(money(C))} and later sold it for ${B(money(S))}. Work out the percentage ${up ? 'profit' : 'loss'}.`, ...nAns(p, { unit: '%' }), unit: '%', hint: 'Divide the change by the price ' + who + ' paid.',
          steps: [`${up ? 'Profit' : 'Loss'} = ${money(Math.max(C, S))} − ${money(Math.min(C, S))} = ${money(Math.abs(S - C))}`, `Percentage ${up ? 'profit' : 'loss'} = ${frac(ps(Math.abs(S - C)), ps(C))} × 100`, `= ${B(ps(p) + '%')}`] };
      }],
  ]);

  addStyles('y9-maths-money', [
    ['Unit pricing',
      'The unit price is the cost of one item (or one gram, one litre…). Divide the total cost by the number of units. Because cost and number of items are in direct proportion, you can also halve, double or scale to compare deals.',
      (r) => {
        const t = r.int(0, 3); const it = r.pick([['oranges', 'orange'], ['cupcakes', 'cupcake'], ['pens', 'pen'], ['bread rolls', 'bread roll'], ['cans of pop', 'can'], ['bananas', 'banana']]);
        if (t === 0) { const n = r.int(2, 12), u = r.int(8, 95); return { html: `A pack of ${B(`${n} ${it[0]}`)} costs ${B(P(n * u))}. What is the cost of one ${it[1]}, in pence?`, ...nAns(u, { unit: 'p' }), unit: 'p', format: 'Type the number of pence, e.g. 25', hint: 'Divide the cost by the number of items.',
          steps: [`${P(n * u)} = ${n * u}p`, `${n * u} ÷ ${n} = ${B(u + 'p')} each`] }; }
        if (t === 1) { let nA, nB, uA, uB; do { nA = r.int(2, 8); nB = r.int(2, 8); uA = r.int(10, 90); uB = r.int(10, 90); } while (nA === nB || uA === uB);
          const save = r.int(2, 6) * 2; const best = uA < uB ? 'A' : 'B';
          return { html: `Shop A: ${B(`${nA} ${it[0]}`)} for ${B(P(nA * uA))}. Shop B: ${B(`${nB} ${it[0]}`)} for ${B(P(nB * uB))}. How much would you save by buying ${B(save + ' ' + it[0])} at the cheaper shop?`, ...nAns(save * Math.abs(uA - uB) / 100, { money: true }), format: MONEY_FMT, hint: 'Find the cost of one item at each shop first.',
            steps: [`Shop A: ${nA * uA}p ÷ ${nA} = ${uA}p each`, `Shop B: ${nB * uB}p ÷ ${nB} = ${uB}p each`, `Shop ${best} is cheaper by ${Math.abs(uA - uB)}p per ${it[1]}`, `Saving on ${save}: ${save} × ${Math.abs(uA - uB)}p = ${B(P(save * Math.abs(uA - uB)))}`] }; }
        if (t === 3) { let n, c; do { n = r.int(3, 9); c = r.int(10, 60) * 10; } while ((n * 100) % c === 0 && false);
          const per = n / (c / 100);
          return { html: `${B(`${n} ${it[0]}`)} cost ${B(P(c))}. How many ${it[0]} do you get ${B('for each £1')}? Give your answer to 2 decimal places.`, ...nAns(per, { dp: 2 }), format: 'Type a number, e.g. 3.33', hint: 'Divide the number of items by the cost in pounds.',
            steps: [`Cost in pounds: ${ps(c / 100)}`, `${n} ÷ ${ps(c / 100)} = ${ps(per, 5)}…`, `= ${B(fx(per, 2))} ${it[0]} per £1`] }; }
        let n, u, m; do { n = r.int(2, 10); u = r.int(10, 80); m = r.int(3, 20); } while (m === n); const tot = n * u;
        return { html: `${B(`${n} ${it[0]}`)} cost ${B(P(tot))}. Using the unit price, work out the cost of ${B(`${m} ${it[0]}`)}.`, ...nAns(m * u / 100, { money: true }), format: MONEY_FMT, hint: 'Find the cost of one first.',
          steps: [`Unit price: ${tot}p ÷ ${n} = ${u}p`, `${m} × ${u}p = ${m * u}p = ${B(P(m * u))}`] };
      }],
  ]);
};
