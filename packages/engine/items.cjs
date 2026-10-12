// Turns bank items (mcq / multi / tf / short / number / order) into the shared Question shape, and marks answers.
const LETTERS = 'ABCDEFGH';

function shuffleWith(rng, arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}

const norm = (s) => String(s ?? '').toLowerCase().replace(/[’']/g, '').replace(/[^a-z0-9.\- ]+/g, ' ').replace(/\s+/g, ' ').trim()
  .split(' ').map((w) => (w.length > 3 && w.endsWith('s') && !w.endsWith('ss') ? w.slice(0, -1) : w)).join(' ');

function toQuestion(item, rng) {
  const base = { diagram: item.diagram || null, answerLabel: '', unit: '', hint: item.hint || 'Re-read the question carefully and eliminate options you know are wrong.', explain: item.explain || '' };
  const steps = item.steps && item.steps.length ? item.steps.slice() : [];
  if (item.explain) steps.push(item.explain);
  switch (item.type) {
    case 'mcq': case 'multi': {
      const order = shuffleWith(rng, item.options.map((_, i) => i));
      const correct = item.type === 'mcq' ? [item.correct] : item.correct;
      const correctPos = order.map((orig, pos) => (correct.includes(orig) ? pos : -1)).filter((p) => p >= 0);
      const options = order.map((i) => item.options[i]);
      const letters = correctPos.map((p) => LETTERS[p]).join(', ');
      return { ...base, html: item.q, options, multi: item.type === 'multi', format: item.type === 'multi' ? `Choose ${correctPos.length} answers.` : 'Choose one answer.',
        answer: letters, answerHtml: correctPos.map((p) => `${LETTERS[p]}) ${options[p]}`).join('<br>'), check: { type: 'choice', correct: correctPos }, steps: steps.length ? steps : ['The correct answer is ' + letters + '.'] };
    }
    case 'tf': {
      return { ...base, html: item.q, options: ['True', 'False'], format: 'True or false?', answer: item.correct ? 'A' : 'B',
        answerHtml: item.correct ? 'True' : 'False', check: { type: 'choice', correct: [item.correct ? 0 : 1] }, steps: steps.length ? steps : [item.correct ? 'True.' : 'False.'] };
    }
    case 'order': {
      const order = shuffleWith(rng, item.options.map((_, i) => i));
      if (order.every((v, i) => v === i) && order.length > 1) order.push(order.shift());
      const options = order.map((i) => item.options[i]);
      const seq = item.options.map((_, orig) => LETTERS[order.indexOf(orig)]).join('');
      return { ...base, html: item.q, options, ordering: true, format: 'Tap the options in the correct order (or type the letters, e.g. CADB).', answer: seq,
        answerHtml: item.options.map((o, i) => `${i + 1}. ${o}`).join('<br>'), check: { type: 'order', seq }, steps: steps.length ? steps : ['Correct order: ' + seq] };
    }
    case 'short': {
      return { ...base, html: item.q, format: item.format || 'Type a short answer (one to three words).', answer: item.answer || item.accept[0], answerHtml: item.answer || item.accept[0],
        check: { type: 'words', accept: item.accept || [], keywords: item.keywords || null }, steps: steps.length ? steps : [String(item.answer)] };
    }
    case 'number': {
      return { ...base, html: item.q, unit: item.unit || '', format: item.format || (item.unit ? `Give your answer in ${item.unit}.` : 'Give a number.'), answer: String(item.value),
        answerHtml: item.answer || `${item.value}${item.unit ? ' ' + item.unit : ''}`, check: { type: 'number', value: item.value, tol: item.tol ?? 1e-9 }, steps: steps.length ? steps : [String(item.answer || item.value)] };
    }
    default: throw new Error('Unknown item type ' + item.type);
  }
}

function parseNumber(input) {
  const s = String(input).replace(/[−–]/g, '-').replace(/,/g, '').replace(/×\s*10\^?/g, 'e').trim();
  const m = s.match(/-?\d*\.?\d+(?:e-?\d+)?/i);
  return m ? Number(m[0]) : NaN;
}

function checkItem(check, input) {
  try {
    const raw = String(input ?? '').trim();
    if (!raw) return false;
    switch (check.type) {
      case 'choice': {
        const picked = [...new Set((raw.toUpperCase().match(/[A-H]/g) || []).map((l) => LETTERS.indexOf(l)))].sort();
        const want = check.correct.slice().sort();
        return picked.length === want.length && picked.every((v, i) => v === want[i]);
      }
      case 'order': return raw.toUpperCase().replace(/[^A-H]/g, '') === check.seq;
      case 'words': {
        const n = norm(raw);
        if (check.accept.some((a) => norm(a) === n)) return true;
        if (check.keywords && check.keywords.length) { const words = ` ${n} `; return check.keywords.every((g) => g.some((w) => words.includes(` ${norm(w)} `) || n.includes(norm(w)))); }
        return false;
      }
      case 'number': { const x = parseNumber(raw); return Number.isFinite(x) && Math.abs(x - check.value) <= (check.tol ?? 1e-9) + 1e-12; }
      default: return false;
    }
  } catch { return false; }
}

module.exports = { toQuestion, checkItem, norm, LETTERS };
