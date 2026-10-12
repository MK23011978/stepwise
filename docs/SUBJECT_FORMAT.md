# Subject module format (non-maths subjects)

Each subject lives in ONE CommonJS file `subjects/<subjectId>.js`, zero dependencies, consumed by `subjects/index.js`.
Maths is built separately (`curriculum.js`) and is NOT in this format.

```js
module.exports = {
  subject: { id: 'biology', name: 'Biology', board: 'AQA', spec: '8461', color: '#10b981', icon: '🧬', tiers: true },
  strands: [ { id: 'bio-cells', name: 'Cell Biology', color: '#10b981', icon: '🔬' }, ... ],   // the AQA topic areas, 4–8 strands
  topics: [
    { id: 'bio-y10-cell-structure', strand: 'bio-cells', year: 10, term: 1, tier: 'FH', name: 'Cell Structure',
      summary: 'one sentence', specRef: 'AQA 8461 4.1.1', styles: ['bio-y10-cell-structure-1', ...] },
  ],
  styles: {
    'bio-y10-cell-structure-1': { id, topicId, name: 'Animal & plant cells', intro: '1–3 sentence teaching explanation', items: [ Item, ... ] },
    // OR a procedural generator for calculation styles (physics/chemistry maths skills):
    'phy-y10-energy-2': { id, topicId, name, intro, gen: (rng) => ({ type: 'number', q, value, tol, unit, answer, steps, explain, hint }) },
  },
  learn: { [topicId]: Content },   // teaching page for EVERY topic (see below)
};
```

## Ids
- Every id starts with the subject prefix: `bio-`, `chem-`, `phy-`, `englang-`, `englit-`, `cs-`, `geo-`, `hist-`.
- Topic id: `<prefix>-y<year>-<slug>`; style id: `<topicId>-<n>` (n = 1, 2, 3…).

## Years, terms, tiers
- Years 7–11. Years 7–9 = KS3 foundations that lead into the GCSE (DfE KS3 programme of study); Years 10–11 = the AQA GCSE specification.
- Aim for **12–16 topics per subject**, roughly: Y7 2–3, Y8 2–3, Y9 2–3, Y10 3–4, Y11 3–4. Terms 1–3 spread sensibly.
- `tier`: `'FH'` or `'H'` (Higher-only content, e.g. sciences' HT material). Subjects without tiers always use `'FH'`.
- Each topic has **3–5 styles**. Each item-based style has **at least 15 items** (more is better — product owner says "questions must not be few"). Generator styles must give ≥ 20 distinct questions.

## Items
```js
{ type: 'mcq',    q: 'HTML question', options: ['HTML', 'HTML', 'HTML', 'HTML'], correct: 2, explain: 'HTML: why the answer is right AND why the tempting wrong options are wrong', hint: 'optional nudge' }
{ type: 'multi',  q: 'Which TWO …?', options: [...5 options], correct: [0, 3], explain, hint }
{ type: 'tf',     q: 'statement', correct: true, explain, hint }
{ type: 'short',  q, answer: 'display answer', accept: ['photosynthesis'], keywords: [['chlorophyll'], ['light', 'sunlight']], explain, hint }
{ type: 'number', q, value: 12.5, tol: 0.05, unit: 'm/s', answer: '12.5 m/s', steps: ['HTML step', ...], explain, hint }
{ type: 'order',  q: 'Put these in order …', options: ['first', 'second', 'third', 'fourth'], explain, hint }   // options given in the CORRECT order; shuffled when shown
```
- `short` is marked correct if the normalised input equals any `accept` entry, OR (when `keywords` is given) every keyword group has at least one of its words in the input. Normalisation: lowercase, strip punctuation, collapse spaces, trailing plural "s" ignored. Use `short` for 1–3 word recall answers (key terms, names, dates) — never for essays.
- `number`: numeric answer with tolerance; units in the input are ignored. Calculation items must include full `steps` (formula → substitute → answer with unit).
- Mix types within a style: mostly `mcq`, plus `short`, `tf`, `multi`, `order`, `number` where natural. MCQ distractors must be plausible (real misconceptions).
- `explain` is shown after every answer, including in the post-exam review, so it must TEACH: state the correct answer, the reason, and the misconception behind the wrong options.
- **English**: include extract-based items — a short passage (≤ 120 words) written by you, or a short public-domain quotation (Shakespeare, Dickens, Stevenson, Brontë, pre-1900 poetry), then ask about language/structure techniques, effect, inference, grammar/punctuation, vocabulary. Never quote copyrighted text (e.g. An Inspector Calls, modern poems in the AQA anthology): for those, write items about plot, characters, themes, context and the writer's methods without quoting.
- **History/Geography**: facts, dates, causes/consequences, key terms, source/interpretation skills (with short sources you write), data skills (with small tables).

## Learn content (teaching page) — one per topic
```js
{
  overview: '2–4 sentence HTML',
  objectives: ['I can …'],               // 3–6
  keyWords: [{ term, def }],              // 4–10
  sections: [{ title, html }],            // 3–6 teaching sections, clear, building to exam level
  mistakes: ['…'],                        // 3–5 common mistakes / misconceptions
  examTips: ['…'],                        // 2–4 AQA exam technique tips (command words, marks, timing)
  realLife: 'one sentence',
  specRef: 'AQA 8461 4.1.1'
}
```
Section HTML may use ONLY: `<p> <b> <i> <ul> <ol> <li> <sup> <sub> <br>`, `<table class="qt">` with `<tr><th><td>`,
`<div class="rule">key fact/formula/definition</div>`, `<div class="note">tip</div>`,
`<div class="worked"><div class="wq">question</div><ol><li>step</li></ol><div class="wa">Answer: …</div></div>` (worked examples — for essay subjects use these to model an exam answer: question → plan steps → model paragraph),
`<blockquote>` for quotations/extracts, and inline SVG diagrams (viewBox, `width="100%" style="max-width:340px"`, `currentColor` for lines/text, accent `#3b6cf6`) that are legible on light and dark backgrounds.
Item HTML may use the same tags.

## Quality and sources
- Follow the AQA specification for the subject (codes in `specRef`) and the DfE KS3 programme of study for Years 7–9. You may use WebSearch/WebFetch to check the spec scope.
- Write ALL wording yourself. Never copy text or questions from BBC Bitesize, Seneca, Save My Exams, Cognito, past papers, mark schemes or textbooks.
- British English. Age-appropriate. Facts must be correct — double-check.
- Write the file incrementally (create it early with a few topics, then add topics one by one) so partial work is never lost.
- Validate with `node subjects/validate.js <subjectId>` until it prints `OK`.
