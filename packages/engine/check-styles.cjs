// Quality check for maths generators: node packages/engine/check-styles.cjs <regex on topic id> [samples]
// For each style: generates N questions, checks the stored answer marks as correct, no "undefined"/"NaN" leaks,
// enough variety, steps present; for each topic: 3–6 styles, specRef and a learn page.
const M = require('./maths.cjs');
const LEARN = require('../content-seed/maths-learn/index.cjs');
const re = new RegExp(process.argv[2] || '.');
const N = Number(process.argv[3] || 400);
let bad = 0;
const fail = (m) => { bad++; console.log('  ✗ ' + m); };
for (const t of M.TOPICS.filter((x) => re.test(x.id))) {
  console.log(`${t.id} — ${t.name} (Y${t.year} T${t.term}, ${t.styles.length} styles)`);
  if (t.styles.length < 3 || t.styles.length > 8) fail(`${t.id}: needs 3–8 styles`);
  if (!t.specRef) fail(`${t.id}: missing SPEC entry`);
  const L = LEARN[t.id];
  if (!L) fail(`${t.id}: missing learn page`);
  else for (const k of ['overview', 'objectives', 'keyWords', 'sections', 'mistakes', 'examTips', 'realLife', 'specRef']) if (!L[k] || (Array.isArray(L[k]) && !L[k].length)) fail(`${t.id}: learn.${k} missing`);
  for (const sid of t.styles) {
    const st = M.STYLES[sid]; const seen = new Set(); let errs = 0;
    if (!st.intro || st.intro.length < 30) fail(`${sid}: intro too short`);
    for (let i = 0; i < N; i++) {
      let q;
      try { q = M.generate(sid, `chk-${i}`); } catch (e) { if (errs++ < 2) fail(`${sid}: throws ${e.message}`); continue; }
      seen.add(q.html + '|' + (q.options || []).join('|'));
      const text = [q.html, q.answer, q.answerHtml, ...(q.steps || []), ...(q.options || []), q.hint].join(' ');
      if (/undefined|NaN|\[object|Infinity/.test(text)) { if (errs++ < 2) fail(`${sid}: leak in "${text.slice(0, 160)}"`); }
      if (!M.checkAnswer(q.check, q.answer)) { if (errs++ < 2) fail(`${sid}: own answer not accepted (${q.answer})`); }
      if (!q.steps || !q.steps.length) { if (errs++ < 2) fail(`${sid}: no steps`); }
      if (q.options && (q.options.length < 2 || new Set(q.options).size !== q.options.length)) { if (errs++ < 2) fail(`${sid}: duplicate/too few options`); }
    }
    const v = seen.size;
    if (v < Math.min(20, N)) fail(`${sid}: only ${v} distinct questions`);
    console.log(`  ${errs ? '✗' : '✓'} ${sid} ${st.name} — ${v} distinct`);
  }
}
console.log(bad ? `\n${bad} problem(s)` : '\nOK');
process.exit(bad ? 1 : 0);
