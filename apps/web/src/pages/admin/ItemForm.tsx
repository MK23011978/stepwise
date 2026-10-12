// Add / edit one question-bank item. Fields depend on the item type (mcq, multi, tf, short, number, order).
import { useState, type FormEvent } from 'react';
import type { BankItem } from '@stepwise/api-client';
import { api } from '../../lib/api';
import { LETTERS } from '../../lib/format';
/* eslint-disable @typescript-eslint/no-explicit-any */

const TYPES: [BankItem['type'], string][] = [['mcq', 'Multiple choice (one answer)'], ['multi', 'Multiple choice (several answers)'], ['tf', 'True / false'], ['short', 'Short text answer'], ['number', 'Numeric answer'], ['order', 'Put in order']];
const MIN_OPTS: Record<string, number> = { mcq: 2, multi: 3, order: 3 };
const lines = (s: string) => s.split('\n').map((x) => x.trim()).filter(Boolean);

export function ItemForm({ styleId, item, close, onSaved }: { styleId: string; item?: any; close: () => void; onSaved: () => void }) {
  const b: any = item?.body || {};
  const [type, setType] = useState<BankItem['type']>(b.type || 'mcq');
  const [q, setQ] = useState<string>(b.q || '');
  const [explain, setExplain] = useState<string>(b.explain || '');
  const [hint, setHint] = useState<string>(b.hint || '');
  const [diagram, setDiagram] = useState<string>(b.diagram || '');
  const [options, setOptions] = useState<string[]>(b.options?.length ? b.options : ['', '', '']);
  const [correctOne, setCorrectOne] = useState<number>(typeof b.correct === 'number' ? b.correct : 0);
  const [correctMany, setCorrectMany] = useState<number[]>(Array.isArray(b.correct) ? b.correct : []);
  const [tf, setTf] = useState<boolean>(typeof b.correct === 'boolean' ? b.correct : true);
  const [answer, setAnswer] = useState<string>(b.answer || '');
  const [accept, setAccept] = useState<string>((b.accept || []).join('\n'));
  const [keywords, setKeywords] = useState<string>((b.keywords || []).map((g: string[]) => g.join(', ')).join('\n'));
  const [format, setFormat] = useState<string>(b.format || '');
  const [value, setValue] = useState<string>(b.value != null ? String(b.value) : '');
  const [tol, setTol] = useState<string>(b.tol != null ? String(b.tol) : '');
  const [unit, setUnit] = useState<string>(b.unit || '');
  const [steps, setSteps] = useState<string>((b.steps || []).join('\n'));
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const hasOpts = type === 'mcq' || type === 'multi' || type === 'order';

  const build = (): BankItem | string => {
    const base: any = { q: q.trim(), explain: explain.trim() };
    if (hint.trim()) base.hint = hint.trim();
    if (diagram.trim()) base.diagram = diagram.trim();
    const opts = options.map((o) => o.trim());
    if (hasOpts) {
      if (opts.some((o) => !o)) return 'Fill in every option or remove empty ones';
      if (opts.length < MIN_OPTS[type]) return `Needs at least ${MIN_OPTS[type]} options`;
    }
    switch (type) {
      case 'mcq': return { type, ...base, options: opts, correct: correctOne };
      case 'multi': if (correctMany.length < 2) return 'Tick at least two correct options'; return { type, ...base, options: opts, correct: [...correctMany].sort((x, y) => x - y) };
      case 'order': return { type, ...base, options: opts };
      case 'tf': return { type, ...base, correct: tf };
      case 'short': {
        const o: any = { type, ...base };
        if (answer.trim()) o.answer = answer.trim();
        if (lines(accept).length) o.accept = lines(accept);
        const kw = lines(keywords).map((l) => l.split(',').map((x) => x.trim()).filter(Boolean)).filter((g) => g.length);
        if (kw.length) o.keywords = kw;
        if (format.trim()) o.format = format.trim();
        return o;
      }
      case 'number': {
        if (value.trim() === '' || Number.isNaN(Number(value))) return 'Enter the numeric answer';
        const o: any = { type, ...base, value: Number(value) };
        if (tol.trim()) o.tol = Number(tol);
        if (unit.trim()) o.unit = unit.trim();
        if (answer.trim()) o.answer = answer.trim();
        if (lines(steps).length) o.steps = lines(steps);
        if (format.trim()) o.format = format.trim();
        return o;
      }
    }
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault(); setErr('');
    const body = build();
    if (typeof body === 'string') { setErr(body); return; }
    setBusy(true);
    try { if (item) await api.admin.patchItem(item.id, { body }); else await api.admin.addItem(styleId, body); close(); onSaved(); }
    catch (x) { setErr((x as Error).message); }
    finally { setBusy(false); }
  };

  const setOpt = (i: number, v: string) => setOptions((o) => o.map((x, j) => (j === i ? v : x)));
  const removeOpt = (i: number) => {
    setOptions((o) => o.filter((_, j) => j !== i));
    setCorrectOne((c) => (c === i ? 0 : c > i ? c - 1 : c));
    setCorrectMany((m) => m.filter((x) => x !== i).map((x) => (x > i ? x - 1 : x)));
  };

  return (
    <><h2>{item ? 'Edit question' : 'Add question'}</h2><p className="muted small">HTML is allowed in the question, options and explanation. The server checks the item’s own answer is marked correct before saving.</p>
      <form className="stack" style={{ marginTop: 14 }} onSubmit={submit}>
        <label className="field"><span>Type</span><select className="input" value={type} onChange={(e) => setType(e.target.value as BankItem['type'])}>{TYPES.map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select></label>
        <label className="field"><span>Question</span><textarea className="input" rows={3} value={q} onChange={(e) => setQ(e.target.value)} required maxLength={20000} /></label>

        {hasOpts && <div className="field"><span>{type === 'order' ? 'Options — in the correct order (shuffled for students)' : type === 'multi' ? 'Options — tick every correct one' : 'Options — choose the correct one'}</span>
          <div className="stack" style={{ gap: 8 }}>{options.map((o, i) => (
            <div key={i} className="row" style={{ gap: 8 }}>
              {type === 'mcq' && <input type="radio" name="correct" aria-label={`Option ${LETTERS[i]} is correct`} checked={correctOne === i} onChange={() => setCorrectOne(i)} />}
              {type === 'multi' && <input type="checkbox" aria-label={`Option ${LETTERS[i]} is correct`} checked={correctMany.includes(i)} onChange={(e) => setCorrectMany((m) => (e.target.checked ? [...m, i] : m.filter((x) => x !== i)))} />}
              <b className="small" style={{ width: 18 }}>{type === 'order' ? i + 1 : LETTERS[i]}</b>
              <input className="input grow" aria-label={`Option ${i + 1}`} value={o} onChange={(e) => setOpt(i, e.target.value)} />
              <button type="button" className="btn sm ghost" aria-label={`Remove option ${i + 1}`} disabled={options.length <= MIN_OPTS[type]} onClick={() => removeOpt(i)}>✕</button>
            </div>))}
            {options.length < 8 && <button type="button" className="btn sm ghost" style={{ alignSelf: 'flex-start' }} onClick={() => setOptions((o) => [...o, ''])}>+ Option</button>}</div></div>}

        {type === 'tf' && <label className="field"><span>Correct answer</span><select className="input" value={tf ? 'true' : 'false'} onChange={(e) => setTf(e.target.value === 'true')}><option value="true">True</option><option value="false">False</option></select></label>}

        {type === 'short' && <>
          <label className="field"><span>Model answer (shown after)</span><input className="input" value={answer} onChange={(e) => setAnswer(e.target.value)} /></label>
          <div className="grid2"><label className="field"><span>Accepted answers (one per line)</span><textarea className="input" rows={3} value={accept} onChange={(e) => setAccept(e.target.value)} /></label>
            <label className="field"><span>Keyword groups (one group per line, comma-separated alternatives)</span><textarea className="input" rows={3} value={keywords} onChange={(e) => setKeywords(e.target.value)} /></label></div>
          <label className="field"><span>Format hint (optional)</span><input className="input" value={format} onChange={(e) => setFormat(e.target.value)} /></label></>}

        {type === 'number' && <>
          <div className="grid2"><label className="field"><span>Value</span><input className="input" type="number" step="any" value={value} onChange={(e) => setValue(e.target.value)} required /></label>
            <label className="field"><span>Tolerance (optional)</span><input className="input" type="number" step="any" min={0} value={tol} onChange={(e) => setTol(e.target.value)} /></label></div>
          <div className="grid2"><label className="field"><span>Unit (optional)</span><input className="input" value={unit} onChange={(e) => setUnit(e.target.value)} /></label>
            <label className="field"><span>Answer as shown (optional)</span><input className="input" value={answer} onChange={(e) => setAnswer(e.target.value)} /></label></div>
          <label className="field"><span>Worked steps (one per line, optional)</span><textarea className="input" rows={3} value={steps} onChange={(e) => setSteps(e.target.value)} /></label>
          <label className="field"><span>Format hint (optional)</span><input className="input" value={format} onChange={(e) => setFormat(e.target.value)} /></label></>}

        <label className="field"><span>Explanation</span><textarea className="input" rows={3} value={explain} onChange={(e) => setExplain(e.target.value)} required maxLength={5000} /></label>
        <div className="grid2"><label className="field"><span>Hint (optional)</span><input className="input" maxLength={1000} value={hint} onChange={(e) => setHint(e.target.value)} /></label>
          <label className="field"><span>Diagram SVG (optional)</span><textarea className="input" rows={2} value={diagram} onChange={(e) => setDiagram(e.target.value)} /></label></div>
        <div className="error" role="alert">{err}</div>
        <div className="row" style={{ justifyContent: 'flex-end' }}><button type="button" className="btn ghost" onClick={close}>Cancel</button><button className="btn" disabled={busy}>{item ? 'Save question' : 'Add question'}</button></div>
      </form></>
  );
}
