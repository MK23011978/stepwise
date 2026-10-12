// Validates a subject module against docs/SUBJECT_FORMAT.md.  Usage: node packages/content-seed/validate.cjs <subjectId>
const path = require('path');
const { toQuestion, checkItem } = require('../engine/items.cjs');
const id = process.argv[2];
if (!id) { console.error('usage: node packages/content-seed/validate.cjs <subjectId>'); process.exit(2); }
const M = require(path.join(__dirname, 'subjects', id + '.cjs'));
const errs = []; const warns = []; const warn = (m) => warns.push(m);
const E = (m) => errs.push(m);
const ALLOWED_TAGS = new Set(['p', 'b', 'i', 'em', 'strong', 'ul', 'ol', 'li', 'sup', 'sub', 'br', 'table', 'tr', 'th', 'td', 'thead', 'tbody', 'div', 'span', 'blockquote', 'svg', 'g', 'path', 'line', 'rect', 'circle', 'ellipse', 'polygon', 'polyline', 'text', 'tspan', 'defs', 'marker', 'title']);
function html(s, where) {
  if (typeof s !== 'string') return E(`${where}: not a string`);
  for (const m of s.matchAll(/<\/?([a-zA-Z0-9]+)/g)) if (!ALLOWED_TAGS.has(m[1].toLowerCase())) E(`${where}: tag <${m[1]}> not allowed`);
  if (/undefined|NaN|\$\{/.test(s)) E(`${where}: contains undefined/NaN/\${`);
}
let rngSeed = 1; const rng = () => { rngSeed = (rngSeed * 16807) % 2147483647; return rngSeed / 2147483647; };

const { subject, strands, topics, styles, learn } = M;
if (!subject || !subject.id || subject.id !== id) E('subject.id must equal file name');
const prefix = { biology: 'bio-', chemistry: 'chem-', physics: 'phy-', 'english-language': 'englang-', 'english-literature': 'englit-', 'computer-science': 'cs-', geography: 'geo-', history: 'hist-' }[id] || '';
if (!Array.isArray(strands) || !strands.length) E('strands missing');
const strandIds = new Set((strands || []).map((s) => s.id));
if (!Array.isArray(topics) || topics.length < 8) E(`need ≥ 8 topics (have ${topics ? topics.length : 0}; target 12–16)`);
let itemCount = 0;
for (const t of topics || []) {
  const w = `topic ${t.id}`;
  if (!t.id.startsWith(prefix)) E(`${w}: id must start with ${prefix}`);
  if (!strandIds.has(t.strand)) E(`${w}: unknown strand ${t.strand}`);
  if (![7, 8, 9, 10, 11].includes(t.year)) E(`${w}: year`);
  if (![1, 2, 3].includes(t.term)) E(`${w}: term`);
  if (!['FH', 'H'].includes(t.tier)) E(`${w}: tier`);
  if (!t.name || !t.summary || !t.specRef) E(`${w}: name/summary/specRef`);
  if (!Array.isArray(t.styles) || t.styles.length < 3 || t.styles.length > 6) E(`${w}: 3–5 styles required (has ${t.styles ? t.styles.length : 0})`);
  for (const sid of t.styles || []) {
    const s = styles[sid];
    if (!s) { E(`${w}: style ${sid} missing`); continue; }
    if (s.id !== sid || s.topicId !== t.id || !s.name || !s.intro) E(`style ${sid}: id/topicId/name/intro`);
    const items = s.items || [];
    if (s.gen) {
      const seen = new Set();
      for (let i = 0; i < 200; i++) {
        const it = s.gen(rng); const q = toQuestion(it, rng); seen.add(q.html);
        if (!checkItem(q.check, q.answer)) E(`style ${sid}: generated answer fails its own check (${q.answer})`);
      }
      if (seen.size < 20) E(`style ${sid}: generator gives only ${seen.size} distinct questions`);
      itemCount += 20;
    } else {
      if (items.length < 15) E(`style ${sid}: only ${items.length} items (min 15)`);
      itemCount += items.length;
      items.forEach((it, i) => {
        const iw = `item ${sid}#${i}`;
        try {
          html(it.q, iw + '.q'); if (it.explain) html(it.explain, iw + '.explain'); else E(`${iw}: explain missing`);
          if (['mcq', 'multi', 'order'].includes(it.type)) { if (!Array.isArray(it.options) || it.options.length < (it.type === 'order' ? 3 : 3)) E(`${iw}: options`); it.options.forEach((o, k) => html(o, `${iw}.opt${k}`)); if (new Set(it.options).size !== it.options.length) E(`${iw}: duplicate options`); }
          if (it.type === 'mcq' && !(Number.isInteger(it.correct) && it.correct >= 0 && it.correct < it.options.length)) E(`${iw}: correct index`);
          if (it.type === 'multi' && !(Array.isArray(it.correct) && it.correct.length >= 2)) E(`${iw}: multi needs ≥ 2 correct`);
          if (it.type === 'tf' && typeof it.correct !== 'boolean') E(`${iw}: tf correct must be boolean`);
          if (it.type === 'short' && !((it.accept && it.accept.length) || (it.keywords && it.keywords.length))) E(`${iw}: short needs accept/keywords`);
          if (it.type === 'number' && !Number.isFinite(it.value)) E(`${iw}: number value`);
          for (let r = 0; r < 4; r++) {
            const q = toQuestion(it, rng);
            if (!checkItem(q.check, q.answer)) E(`${iw}: canonical answer fails (${q.answer})`);
            if (checkItem(q.check, 'zzqx')) E(`${iw}: garbage accepted`);
          }
        } catch (e) { E(`${iw}: ${e.message}`); }
      });
    }
  }
  const L = learn && learn[t.id];
  if (!L) { E(`${w}: learn content missing`); continue; }
  for (const k of ['overview', 'realLife', 'specRef']) if (!L[k]) E(`${w} learn: ${k}`);
  html(L.overview, `${w} learn.overview`);
  if (!(L.objectives && L.objectives.length >= 3)) E(`${w} learn: objectives`);
  if (!(L.keyWords && L.keyWords.length >= 3)) E(`${w} learn: keyWords`);
  if (!(L.sections && L.sections.length >= 3 && L.sections.length <= 6)) E(`${w} learn: 3–6 sections`);
  (L.sections || []).forEach((s, i) => { if (!s.title) E(`${w} learn: section ${i} title`); html(s.html, `${w} learn.section${i}`); });
  if (!(L.mistakes && L.mistakes.length >= 2)) E(`${w} learn: mistakes`);
  if (!(L.examTips && L.examTips.length >= 2)) E(`${w} learn: examTips`);
}
const years = new Set((topics || []).map((t) => t.year));
for (const y of [7, 8, 9, 10, 11]) if (!years.has(y)) warn(`no topics in Year ${y}`);
try { JSON.stringify({ subject, strands, topics, learn }); } catch (e) { E('not JSON-serialisable: ' + e.message); }
warns.forEach((m) => console.log('WARN', m));
if (errs.length) { console.log(errs.slice(0, 60).join('\n')); console.log(`\n${errs.length} problem(s). Topics: ${topics?.length}, items≈${itemCount}`); process.exit(1); }
console.log(`OK — ${topics.length} topics, ${Object.keys(styles).length} styles, ≈${itemCount} questions, learn pages: ${Object.keys(learn).length}`);
