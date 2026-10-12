// Stepwise engine: the algorithmic part of the content.
//  • Maths: every style is a procedural generator (maths.cjs).
//  • Other subjects: calculation styles (physics equations, moles, binary…) are generators defined with `gen`
//    in the subject seed modules; everything else is a question bank stored in the database.
//  • checkAnswer() marks every question type (numeric, algebraic, fractions, multiple choice, ordering, words…).
const fs = require('fs');
const path = require('path');
const maths = require('./maths.cjs');
const items = require('./items.cjs');

const SUBJECT_DIR = path.join(__dirname, '..', 'content-seed', 'subjects');
const subjectGenerators = new Map();
for (const f of fs.existsSync(SUBJECT_DIR) ? fs.readdirSync(SUBJECT_DIR) : []) {
  if (!f.endsWith('.cjs')) continue;
  const mod = require(path.join(SUBJECT_DIR, f));
  for (const [id, st] of Object.entries(mod.styles || {})) if (typeof st.gen === 'function') subjectGenerators.set(id, st.gen);
}

function rngFrom(seed) {
  if (seed == null) return Math.random;
  let a = typeof seed === 'number' ? seed >>> 0 : [...String(seed)].reduce((h, c) => Math.imul(h ^ c.charCodeAt(0), 2654435761) >>> 0, 1779033703);
  return () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}

const hasGenerator = (key) => !!maths.STYLES[key] || subjectGenerators.has(key);
function generate(key, seed) {
  if (maths.STYLES[key]) return maths.generate(key, seed);
  const gen = subjectGenerators.get(key);
  if (!gen) throw new Error(`No generator for ${key}`);
  const rng = rngFrom(seed);
  return items.toQuestion(gen(rng), rng);
}
function fromItem(item, seed) { const rng = rngFrom(seed); return items.toQuestion(item, rng); }
function checkAnswer(check, input) {
  if (!check) return false;
  if (['choice', 'order', 'words'].includes(check.type)) return items.checkItem(check, input);
  return maths.checkAnswer(check, input);
}
module.exports = { generate, fromItem, checkAnswer, hasGenerator, generatorKeys: () => [...Object.keys(maths.STYLES), ...subjectGenerators.keys()], rngFrom, maths, items };
