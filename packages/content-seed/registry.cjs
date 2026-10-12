// Subject registry: Maths (procedural, curriculum.js) + bank/generator subjects (subjects/<id>.js) behind one interface.
const fs = require('fs');
const path = require('path');
const MATH = require('../engine/maths.cjs');
const MATH_LEARN = require('./maths-learn/index.cjs');
const { toQuestion, checkItem } = require('../engine/items.cjs');

const SUBJECT_ORDER = ['maths', 'biology', 'chemistry', 'physics', 'english-language', 'english-literature', 'computer-science', 'geography', 'history'];
const SUBJECTS = [{ id: 'maths', name: 'Maths', board: 'Edexcel', spec: '1MA1', color: '#3b6cf6', icon: '➗', tiers: true }];
const STRANDS = MATH.STRANDS.map((s) => ({ ...s, subject: 'maths' }));
const TOPICS = MATH.TOPICS.map((t) => Object.assign(t, { subject: 'maths' }));
const STYLES = {}; // non-maths styles only; maths styles live in MATH.STYLES
const LEARN = { ...MATH_LEARN };

for (const id of SUBJECT_ORDER.slice(1)) {
  const file = path.join(__dirname, 'subjects', id + '.cjs');
  if (!fs.existsSync(file)) continue;
  try {
    const M = require(file);
    if (!M.subject || !Array.isArray(M.topics) || !M.topics.length) continue;
    const topics = M.topics.filter((t) => t.styles && t.styles.every((sid) => M.styles[sid] && ((M.styles[sid].items && M.styles[sid].items.length) || M.styles[sid].gen)));
    if (!topics.length) continue;
    SUBJECTS.push({ tiers: false, ...M.subject });
    M.strands.forEach((s) => STRANDS.push({ ...s, subject: M.subject.id }));
    topics.forEach((t) => TOPICS.push({ ...t, subject: M.subject.id }));
    for (const t of topics) for (const sid of t.styles) STYLES[sid] = { ...M.styles[sid], subject: M.subject.id };
    Object.assign(LEARN, M.learn || {});
  } catch (e) {
    console.warn(`[subjects] could not load ${id}: ${e.message}`);
  }
}
TOPICS.sort((a, b) => SUBJECT_ORDER.indexOf(a.subject) - SUBJECT_ORDER.indexOf(b.subject) || a.year - b.year || a.term - b.term);

const topicIndex = new Map(TOPICS.map((t) => [t.id, t]));
const getTopic = (id) => topicIndex.get(id);
const getStyle = (id) => (STYLES[id] ? STYLES[id] : MATH.STYLES[id] ? { ...MATH.STYLES[id], subject: 'maths' } : undefined);
const subjectOf = (styleId) => (STYLES[styleId] ? STYLES[styleId].subject : MATH.STYLES[styleId] ? 'maths' : null);
const getSubject = (id) => SUBJECTS.find((s) => s.id === id);

function rngFrom(seed) {
  if (seed == null) return Math.random;
  let a = typeof seed === 'number' ? seed >>> 0 : [...String(seed)].reduce((h, c) => Math.imul(h ^ c.charCodeAt(0), 2654435761) >>> 0, 1779033703);
  return () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}

function generate(styleId, seed) {
  if (MATH.STYLES[styleId]) return MATH.generate(styleId, seed);
  const s = STYLES[styleId]; if (!s) throw new Error('Unknown style ' + styleId);
  const rng = rngFrom(seed);
  const item = s.gen ? s.gen(rng) : s.items[Math.floor(rng() * s.items.length)];
  return toQuestion(item, rng);
}

// n questions for one style without repeating bank items (and avoiding duplicate maths questions where possible)
function generateMany(styleId, n) {
  const s = STYLES[styleId];
  if (s && s.items) {
    const idx = s.items.map((_, i) => i);
    for (let i = idx.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [idx[i], idx[j]] = [idx[j], idx[i]]; }
    const out = [];
    for (let i = 0; i < n; i++) out.push(toQuestion(s.items[idx[i % idx.length]], Math.random));
    return out;
  }
  const out = []; const seen = new Set();
  for (let i = 0; out.length < n && i < n * 4; i++) { const q = generate(styleId); if (seen.has(q.html) && i < n * 3) continue; seen.add(q.html); out.push(q); }
  return out;
}

function checkAnswer(check, input) {
  if (!check) return false;
  if (['choice', 'order', 'words'].includes(check.type)) return checkItem(check, input);
  return MATH.checkAnswer(check, input);
}

function styleIntro(id) { return (STYLES[id] || MATH.STYLES[id] || {}).intro || ''; }
function styleName(id) { return (STYLES[id] || MATH.STYLES[id] || {}).name || id; }

function publicCurriculum() {
  return {
    subjects: SUBJECTS,
    strands: STRANDS,
    topics: TOPICS.map((t) => ({ ...t, styles: t.styles.map((id) => ({ id, name: styleName(id) })) })),
  };
}

module.exports = { SUBJECTS, STRANDS, TOPICS, LEARN, getTopic, getStyle, getSubject, subjectOf, generate, generateMany, checkAnswer, styleIntro, styleName, publicCurriculum, MATH };
