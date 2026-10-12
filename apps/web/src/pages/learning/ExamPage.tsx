// Exam (v1 `/app/exam/:id`): timed taking mode with autosave, then a result page that walks through every mistake.
import { useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { useSession } from '../../state/session';
import { useOverlay } from '../../ui/overlays';
import { AppShell } from '../../layout/AppShell';
import { AnswerWidget, correctLettersFrom } from '../../ui/AnswerWidget';
import { Donut } from '../../ui/charts';
import { ErrorBox, Html, Spinner } from '../../ui/bits';
import { speak, speakable, stopSpeaking } from '../../lib/speech';
import { confetti, xpPop } from '../../lib/confetti';
import { LETTERS, fmtDateTime, store } from '../../lib/format';
/* eslint-disable @typescript-eslint/no-explicit-any */

export default function ExamPage() {
  const { id = '' } = useParams();
  const q = useQuery({ queryKey: ['exam', id], queryFn: () => api.exams.get(id), staleTime: Infinity });
  const [done, setDone] = useState<any>(null);
  useEffect(() => () => stopSpeaking(), []);
  useEffect(() => setDone(null), [id]);
  if (q.isLoading) return <AppShell title="Exam"><Spinner /></AppShell>;
  if (q.error || !q.data) return <AppShell title="Exam"><ErrorBox error={q.error} /></AppShell>;
  const A = done || q.data.attempt;
  return (
    <AppShell title={A.name}>
      {A.submittedAt ? <ExamResult key={A.id} A={A} /> : <ExamTaking key={A.id} A={A} onSubmitted={setDone} />}
    </AppShell>
  );
}

const isMathsQ = (s: ReturnType<typeof useSession>, q: any) => !q.options && (s.topicOfStyle(q.styleId)?.subject || 'maths') === 'maths';

function ExamTaking({ A, onSubmitted }: { A: any; onSubmitted: (a: any) => void }) {
  const s = useSession(); const qc = useQueryClient(); const { confirm, toast, celebrate } = useOverlay();
  const key = `exam:${A.id}`;
  const [answers, setAnswers] = useState<Record<string, string>>(() => store.get(key, {}));
  const answersRef = useRef(answers); answersRef.current = answers;
  const sent = useRef(false);
  const end = Date.parse(A.deadline);
  const [now, setNow] = useState(Date.now());
  const ms = end - now;

  const setAnswer = (i: number, v: string) => setAnswers((a) => { const n = { ...a, [i]: v }; store.set(key, n); return n; });
  const list = () => A.questions.map((_: any, i: number) => answersRef.current[i] || '');
  const answered = A.questions.filter((_: any, i: number) => (answers[i] || '').trim()).length;

  const submit = async (auto: boolean) => {
    if (sent.current) return;
    if (!auto) {
      const left = list().filter((v: string) => !v.trim()).length;
      if (!(await confirm('Submit?', left ? `You have ${left} unanswered question${left > 1 ? 's' : ''}.` : 'All questions answered. Ready to see your grade?', { ok: 'Submit' }))) return;
      if (sent.current) return;
    }
    sent.current = true;
    try {
      const r = await api.exams.submit(A.id, list());
      store.del(key); toast(`Submitted · +${r.xp} XP`, 'good');
      qc.invalidateQueries({ queryKey: ['exams'] }); qc.setQueryData(['exam', A.id], { attempt: r.attempt });
      s.refresh();
      onSubmitted(r.attempt); celebrate(r.rewards);
    } catch (e) { sent.current = false; toast((e as Error).message, 'bad'); }
  };
  const submitRef = useRef(submit); submitRef.current = submit;

  useEffect(() => {
    const tick = () => {
      const left = end - Date.now(); setNow(Date.now());
      if (left <= 0) { clearInterval(iv); if (!sent.current) { toast('Time’s up — submitting'); submitRef.current(true); } }
    };
    const iv = setInterval(tick, 1000); tick();
    return () => clearInterval(iv);
  }, [end]); // eslint-disable-line react-hooks/exhaustive-deps

  const m = Math.max(0, Math.floor(ms / 60000)), sec = Math.max(0, Math.floor((ms % 60000) / 1000));
  const timer = ms <= 0 ? '00:00' : Number.isFinite(ms) ? `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}` : '--:--';

  return (
    <div className="lesson">
      <div className="card" style={{ position: 'sticky', top: 80, zIndex: 5, marginBottom: 18, padding: '14px 20px' }}>
        <div className="row spread">
          <div><b>{A.name}</b><div className="small muted">{answered}/{A.questions.length} answered</div></div>
          <div className="row"><span className={`timer ${ms < 120000 ? 'low' : ''}`} role="timer" aria-label="Time left">{timer}</span><button className="btn" onClick={() => submit(false)}>Submit</button></div>
        </div>
      </div>
      <div className="qcard">
        {A.questions.map((q: any, i: number) => (
          <div key={i} className="exam-q"><div className="row" style={{ alignItems: 'flex-start', gap: 14 }}><span className="num">{i + 1}</span><div className="grow">
            <div className="row spread"><span className="small faint">{q.topic}</span><span className="small faint">[{q.marks} mark{q.marks > 1 ? 's' : ''}]</span></div>
            <Html className="qtext" html={q.html} />
            {q.diagram && <Html className="diagram" html={q.diagram} />}
            <AnswerWidget q={q} value={answers[i] || ''} onChange={(v) => setAnswer(i, v)} compact showKeypad={isMathsQ(s, q)} />
          </div></div></div>))}
        <div className="row" style={{ justifyContent: 'flex-end', marginTop: 20 }}><button className="btn lg" onClick={() => submit(false)}>Submit</button></div>
      </div>
    </div>
  );
}

function ExamResult({ A }: { A: any }) {
  const s = useSession();
  const wrong = A.questions.filter((q: any) => !q.correct);
  const right = A.questions.filter((q: any) => q.correct);
  const walkRef = useRef<HTMLHeadingElement>(null);
  useEffect(() => { if (A.pct >= 70) confetti(); }, []); // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <div className="lesson">
      <div className="card result-hero">
        <div className="tiny muted">{A.name} · {fmtDateTime(A.submittedAt)}</div>
        <div className="row" style={{ justifyContent: 'center', gap: 48, margin: '22px 0', flexWrap: 'wrap' }}>
          <div><div className="grade-big">{A.grade}</div><div className="muted">Grade{A.tier === 'F' ? ' (Foundation)' : ''}</div></div>
          <div><Donut pct={A.pct} color={A.pct >= 65 ? '#10b981' : A.pct >= 45 ? '#f59e0b' : '#ef4444'} size={130} /><div className="muted">{A.score}/{A.max} marks</div></div>
        </div>
        <div style={{ maxWidth: 520, margin: '0 auto', textAlign: 'left' }}>
          {Object.entries(A.byStrand || {}).map(([k, v]: [string, any]) => (
            <div key={k} style={{ margin: '10px 0' }}><div className="row spread small"><b>{s.strand(k).name || k}</b><span className="muted">{v.score}/{v.max}</span></div>
              <div className="bar"><i style={{ width: `${v.max ? (v.score / v.max) * 100 : 0}%`, background: s.strand(k).color }} /></div></div>))}
        </div>
        <div className="row wrap" style={{ justifyContent: 'center', marginTop: 20 }}>
          <Link className="btn ghost" to="/app/exams">All tests</Link>
          {wrong.length > 0 && <button className="btn" onClick={() => walkRef.current?.scrollIntoView({ behavior: 'smooth' })}>Go through my mistakes ↓</button>}
          <Link className="btn soft" to="/app/review">Review centre</Link>
        </div>
      </div>
      {wrong.length ? <>
        <h2 style={{ margin: '30px 0 6px' }} ref={walkRef}>📘 Let’s go through the {wrong.length} question{wrong.length > 1 ? 's' : ''} you missed</h2>
        <p className="muted" style={{ margin: '0 0 16px' }}>For each one: what you wrote, the correct answer, why, and the full method. Then try a similar question to lock it in (+8 XP each). These questions are also saved to your mistakes bank.</p>
        {wrong.map((q: any) => <WalkCard key={q.n} A={A} q={q} />)}
      </> : <div className="card pad-lg empty" style={{ marginTop: 22 }}><div className="e">🏆</div><h2>Full marks — every answer correct!</h2></div>}
      {right.length > 0 && (
        <details className="card" style={{ marginTop: 22 }}>
          <summary style={{ cursor: 'pointer', fontWeight: 700 }}>✅ Questions you got right ({right.length})</summary>
          {right.map((q: any) => (
            <div key={q.n} className="exam-q"><div className="row" style={{ alignItems: 'flex-start', gap: 14 }}>
              <span className="num" style={{ background: 'var(--good-soft)', color: 'var(--good)' }}>{q.n}</span>
              <div className="grow"><Html className="qtext" html={q.html} /><div className="small" style={{ marginTop: 6 }}>Your answer: <b>{q.given}</b> ✓</div>
                <details style={{ marginTop: 6 }}><summary className="small link">Method</summary><div className="solution"><ol>{(q.steps || []).map((x: string, i: number) => <Html as="li" key={i} html={x} />)}</ol></div></details></div>
            </div></div>))}
        </details>)}
    </div>
  );
}

function WalkCard({ A, q }: { A: any; q: any }) {
  const s = useSession();
  const t = s.topicOfStyle(q.styleId);
  const listen = () => speak([`Question ${q.n}.`, speakable(q.html), `The correct answer is ${speakable(q.answerHtml)}.`, ...(q.steps || []).map(speakable)]);
  const given = q.given
    ? (q.options ? <Html html={q.given.split('').map((L: string) => `${L}) ${q.options[LETTERS.indexOf(L)] || ''}`).join('<br>')} /> : q.given)
    : <span className="faint">(left blank)</span>;
  return (
    <div className="walk">
      <div className="row spread wrap">
        <div className="row"><span className="num" style={{ background: 'var(--bad-soft)', color: 'var(--bad)' }}>{q.n}</span><span className="small muted">{q.topic} · {q.styleName || ''}</span></div>
        <button className="speak" onClick={listen}>🔊 Explain aloud</button>
      </div>
      <Html className="qtext" style={{ marginTop: 12, fontSize: 19 }} html={q.html} />
      {q.diagram && <Html className="diagram" html={q.diagram} />}
      {q.options && <ol type="A" className="small" style={{ margin: '8px 0' }}>{q.options.map((o: string, i: number) => <Html as="li" key={i} html={o} />)}</ol>}
      <div className="ans-compare">
        <div className="yours"><div className="tiny" style={{ color: 'var(--bad)' }}>Your answer</div><div style={{ marginTop: 4, fontWeight: 600 }}>{given}</div></div>
        <div className="right"><div className="tiny" style={{ color: 'var(--good)' }}>Correct answer</div><Html style={{ marginTop: 4, fontWeight: 700 }} html={q.answerHtml} /></div>
      </div>
      {q.intro && <div className="why"><b>💡 The key idea:</b> {q.intro}</div>}
      {q.hint && <div className="small muted" style={{ margin: '6px 0' }}><b>Where it usually goes wrong:</b> <Html as="span" html={q.hint} /></div>}
      <div className="solution"><div className="tiny muted" style={{ marginTop: 10 }}>Step-by-step solution</div><ol>{(q.steps || []).map((x: string, i: number) => <Html as="li" key={i} html={x} />)}</ol></div>
      <Similar A={A} q={q} topic={t} />
    </div>
  );
}

function Similar({ A, q, topic }: { A: any; q: any; topic: any }) {
  const { toast, celebrate } = useOverlay();
  const n = q.n - 1;
  const [state, setState] = useState<'idle' | 'loading' | 'ready'>('idle');
  const [sq, setSq] = useState<any>(null);
  const [value, setValue] = useState('');
  const [busy, setBusy] = useState(false);
  const [res, setRes] = useState<any>(null);
  const [retryHint, setRetryHint] = useState<string | null | undefined>(undefined);
  const isMaths = (topic?.subject || 'maths') === 'maths';
  const revise = topic && <Link className="btn ghost" style={{ marginLeft: 8 }} to={`/app/learn/${topic.id}`}>📖 Revise the topic</Link>;

  const load = async () => {
    setState('loading');
    try { const r = await api.exams.similar(A.id, n); setSq(r.question); setState('ready'); }
    catch (e) { setState('idle'); toast((e as Error).message, 'bad'); }
  };
  const check = async () => {
    if (busy || res || !value.trim()) return;
    setBusy(true);
    try {
      const r = await api.exams.answerSimilar(A.id, n, value);
      if (r.done) { setRes(r); if (r.correct) { xpPop(8); celebrate(r.rewards); } }
      else setRetryHint(r.hint || null);
    } catch (e) { toast((e as Error).message, 'bad'); }
    finally { setBusy(false); }
  };

  if (q.similarDone && state === 'idle') return <div className="similar"><span className="pill good">✓ Similar question done</span>{revise}</div>;
  if (state === 'idle') return <div className="similar"><button className="btn soft" onClick={load}>✍️ Try a similar question</button>{revise}</div>;
  if (state === 'loading') return <div className="similar"><div className="spinner" style={{ margin: '10px auto' }} /></div>;
  return (
    <div className="similar">
      <div className="tiny" style={{ color: 'var(--brand)' }}>Your turn — a similar question</div>
      <Html className="qtext" style={{ marginTop: 8, fontSize: 18 }} html={sq.html} />
      {sq.diagram && <Html className="diagram" html={sq.diagram} />}
      <form onSubmit={(e) => { e.preventDefault(); check(); }}>
        <AnswerWidget q={sq} value={value} onChange={setValue} onSubmit={check} compact locked={!!res} showKeypad={isMaths && !sq.options}
          reveal={res && sq.options ? { correct: correctLettersFrom(res.answerHtml), given: value } : null} />
        {!res && <div className="row" style={{ justifyContent: 'flex-end', marginTop: 10 }}><button className="btn" disabled={busy}>Check</button></div>}
      </form>
      <div>
        {res ? (
          <div className={`feedback ${res.correct ? 'good' : 'bad'}`}>
            <h4>{res.correct ? '✅ You’ve got it now! +8 XP' : '📘 Still tricky — here’s the method'}</h4>
            {!res.correct && <div>Answer: <b><Html as="span" html={res.answerHtml} /></b></div>}
            <div className="solution"><ol>{(res.steps || []).map((x: string, i: number) => <Html as="li" key={i} html={x} />)}</ol></div>
          </div>
        ) : retryHint !== undefined ? <div className="feedback bad"><b>Not quite — one more try.</b>{retryHint && <> Hint: <Html as="span" html={retryHint} /></>}</div> : null}
      </div>
    </div>
  );
}
