// One answer control for every question type: typed answers (with a maths keypad), single choice,
// multi-select and ordering. Controlled: the parent owns `value`.
import { useRef } from 'react';
import { Html } from './bits';
import { LETTERS } from '../lib/format';
/* eslint-disable @typescript-eslint/no-explicit-any */
export interface AnswerWidgetProps {
  q: any; value: string; onChange: (v: string) => void; onSubmit?: () => void;
  locked?: boolean; showKeypad?: boolean; compact?: boolean; inputState?: '' | 'ok' | 'shake';
  /** after marking: the correct letters (e.g. "B" or "AC") and what the student gave */
  reveal?: { correct: string; given: string } | null;
}
const KEYS = ['√', '²', '³', '^', '/', '(', ')', 'π', '×', '−', '≤', '≥', ':'];
// answerHtml for choice questions is "B) text<br>D) text" — take the letter before each ")" at the start or after a <br>
export const correctLettersFrom = (answerHtml?: string) => [...String(answerHtml || '').matchAll(/(?:^|<br\s*\/?>)\s*([A-H])\)/g)].map((m) => m[1]).join('');

export function AnswerWidget({ q, value, onChange, onSubmit, locked, showKeypad = true, compact, inputState = '', reveal }: AnswerWidgetProps) {
  const input = useRef<HTMLInputElement>(null);
  if (q.options) {
    const kind = q.ordering ? 'order' : q.multi ? 'multi' : 'single';
    const picked = value ? value.split('') : [];
    const toggle = (L: string) => {
      if (locked) return;
      let next: string[];
      if (kind === 'single') next = [L];
      else if (picked.includes(L)) next = picked.filter((x) => x !== L);
      else next = [...picked, L];
      onChange(kind === 'multi' ? [...next].sort().join('') : next.join(''));
    };
    return (
      <>
        <div className="choices" role={kind === 'single' ? 'radiogroup' : 'group'}>
          {q.options.map((o: string, i: number) => {
            const L = LETTERS[i]; const k = picked.indexOf(L);
            const cls = reveal ? (reveal.correct.includes(L) ? 'right' : reveal.given.includes(L) ? 'wrong' : '') : k >= 0 ? 'sel' : '';
            return <button type="button" key={L} className={`choice ${cls}`} disabled={locked} onClick={() => toggle(L)} aria-pressed={k >= 0}>
              <span className="l">{L}</span><Html as="span" className="grow" html={o} /><span className="ord">{kind === 'order' && k >= 0 ? k + 1 : ''}</span></button>;
          })}
        </div>
        {q.format && <div className="fmt">{q.format}</div>}
      </>
    );
  }
  const insert = (k: string) => {
    const key = k === '²' ? '^2' : k === '³' ? '^3' : k; const el = input.current; const p = el?.selectionStart ?? value.length;
    const next = value.slice(0, p) + key + value.slice(el?.selectionEnd ?? p);
    onChange(next); requestAnimationFrame(() => { el?.focus(); el?.setSelectionRange(p + key.length, p + key.length); });
  };
  return (
    <>
      <div className="answer-row" style={compact ? { marginTop: 12 } : undefined}>
        {q.answerLabel && <Html as="span" className="lbl" html={q.answerLabel} />}
        <input ref={input} className={`answer-input ${inputState}`} value={value} disabled={locked} autoComplete="off" spellCheck={false} placeholder="Your answer" aria-label="Your answer"
          onChange={(e) => onChange(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); onSubmit?.(); } }} />
        {q.unit && <span className="lbl">{q.unit}</span>}
      </div>
      {showKeypad && !locked && <div className="keypad">{KEYS.map((k) => <button type="button" key={k} onClick={() => insert(k)}>{k}</button>)}</div>}
      {q.format && <div className="fmt">{q.format}</div>}
    </>
  );
}
