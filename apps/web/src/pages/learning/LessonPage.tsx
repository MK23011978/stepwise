// Lesson / review player (v1 `/app/lesson/:id`): worked-example intro, questions with up to 3 tries, reveal, finish screen.
import { useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { useSession } from '../../state/session';
import { useOverlay } from '../../ui/overlays';
import { AppShell } from '../../layout/AppShell';
import { useLearningActions } from '../../features/actions';
import { AnswerWidget, correctLettersFrom } from '../../ui/AnswerWidget';
import { Donut } from '../../ui/charts';
import { ErrorBox, Html, Spinner } from '../../ui/bits';
import { speak, speakable, stopSpeaking } from '../../lib/speech';
import { confetti, xpPop } from '../../lib/confetti';
import { LETTERS, store } from '../../lib/format';
/* eslint-disable @typescript-eslint/no-explicit-any */

type Phase = 'intro' | 'question' | 'done';

export default function LessonPage() {
  const { id = '' } = useParams();
  const q = useQuery({ queryKey: ['lesson', id], queryFn: () => api.lessons.get(id), staleTime: Infinity, gcTime: 0 });
  useEffect(() => () => stopSpeaking(), []);
  if (q.isLoading) return <AppShell title="Lesson"><Spinner /></AppShell>;
  if (q.error || !q.data) return <AppShell title="Lesson"><ErrorBox error={q.error} /></AppShell>;
  return <Player key={id} initial={q.data.lesson} />;
}

function Player({ initial }: { initial: any }) {
  const s = useSession();
  const [L, setL] = useState<any>(initial);
  const isReview = L.kind === 'review';
  const t = L.styleId ? s.topicOfStyle(L.styleId) : null;
  const st = t ? s.strand(t.strand) : { color: '#8b5cf6', name: 'Review' };
  const [phase, setPhase] = useState<Phase>(() => (initial.status === 'completed' ? 'done' : initial.kind !== 'review' && initial.idx === 0 && !initial.results.length && initial.example ? 'intro' : 'question'));
  const title = isReview ? 'Review session' : `${t?.name || 'Lesson'} · ${L.styleName}`;

  const dots = (
    <div className="qdots">{Array.from({ length: L.total }, (_, i) => (
      <i key={i} className={L.results[i]?.outcome || (i === L.idx && phase !== 'intro' ? 'cur' : '')} style={L.reviewSlots?.[i] ? { outline: '2px solid #c4b5fd', outlineOffset: 1 } : undefined} />))}</div>
  );
  const top = (
    <div className="lesson-top">
      <Link className="btn sm ghost" to={isReview ? '/app/review' : '/app/progress'} aria-label="Leave lesson">✕</Link>
      {dots}
      <span className="small muted" style={{ fontWeight: 600 }}>{phase === 'intro' ? 'Example' : `${Math.min(L.idx + 1, L.total)}/${L.total}`}</span>
      <span className="pill brand">⚡ {L.xp} XP</span>
    </div>
  );
  const noQuestion = phase === 'question' && !L.question;

  return (
    <AppShell title={title}>
      <div className="lesson">
        {top}
        {phase === 'intro' && <Intro L={L} t={t} st={st} onBegin={() => { stopSpeaking(); setPhase('question'); }} />}
        {phase === 'question' && !noQuestion && <Question key={`${L.id}:${L.idx}`} L={L} setL={setL} topic={t} onDone={() => setPhase('done')} />}
        {(phase === 'done' || noQuestion) && <Finish L={L} t={t} isReview={isReview} />}
      </div>
    </AppShell>
  );
}

function Intro({ L, t, st, onBegin }: { L: any; t: any; st: any; onBegin: () => void }) {
  const steps: string[] = L.example.steps || [];
  const [voiceOn, setVoiceOn] = useState<boolean>(() => store.get('voice', true));
  const [shown, setShown] = useState(1);
  const reveal = (n: number) => setShown((x) => Math.max(x, n));
  const narrate = () => speak([speakable(L.intro || ''), 'Here is a worked example. ' + speakable(L.example.html), ...steps.map(speakable), 'So the answer is ' + speakable(L.example.answerHtml)],
    (i) => { if (i >= 2) reveal(Math.min(steps.length, i - 1)); if (i === steps.length + 2) reveal(steps.length); });
  useEffect(() => { if (voiceOn) narrate(); return () => stopSpeaking(); }, []); // eslint-disable-line react-hooks/exhaustive-deps
  const toggleVoice = () => { const v = !voiceOn; setVoiceOn(v); store.set('voice', v); if (v) narrate(); else stopSpeaking(); };
  const all = shown >= steps.length;
  return (
    <div className="qcard example">
      <div className="row spread wrap">
        <div><span className="tiny" style={{ color: st.color }}>{st.name}{t ? ` · Year ${t.year}` : ''}</span><h2 style={{ fontSize: 26, marginTop: 4 }}>{L.styleName}</h2></div>
        <button className={`speak ${voiceOn ? 'on' : ''}`} onClick={toggleVoice} aria-pressed={voiceOn}>🔊 {voiceOn ? 'Voice on' : 'Voice off'}</button>
      </div>
      <div className="intro-box" style={{ marginTop: 18 }}>💡 {L.intro} {t && <Link to={`/app/learn/${t.id}`} className="small">Read the full topic →</Link>}</div>
      <div className="tiny muted">Worked example</div>
      <Html className="qtext" style={{ marginTop: 6 }} html={L.example.html} />
      {L.example.diagram && <Html className="diagram" html={L.example.diagram} />}
      <div className="solution">
        <ol>{steps.slice(0, shown).map((x, i) => <Html as="li" key={i} html={x} />)}</ol>
        {all && <div className="feedback info"><b>Answer:</b> <Html as="span" html={L.example.answerHtml} /></div>}
      </div>
      <div className="row" style={{ justifyContent: 'flex-end', marginTop: 24, gap: 10 }}>
        {!all && <button className="btn ghost" onClick={() => reveal(shown + 1)}>Next step ↓</button>}
        <button className="btn" onClick={onBegin}>I’m ready — start questions →</button>
      </div>
    </div>
  );
}

type Reveal = { good: boolean; r: any; title: string; given: string };
const PRAISE = ['Brilliant!', 'Correct!', 'Spot on!', 'Nailed it!', 'Great work!'];
const REVIEW_TAG: Record<string, string> = { mistake: 'Past mistake — try again', due: 'Review: due today', practice: 'Recap' };

function Question({ L, setL, topic, onDone }: { L: any; setL: (f: (l: any) => any) => void; topic: any; onDone: () => void }) {
  const s = useSession(); const { toast, celebrate } = useOverlay();
  const q = L.question;
  const qt = s.topicOfStyle(q.styleId) || topic;
  const isMaths = (qt?.subject || 'maths') === 'maths';
  const [value, setValue] = useState('');
  const [inputState, setInputState] = useState<'' | 'ok' | 'shake'>('');
  const [flash, setFlash] = useState<string | null>(null);
  const [fb, setFb] = useState<{ kind: 'hint'; hint: string } | { kind: 'retry'; left: number; hint?: string } | null>(q.hint ? { kind: 'hint', hint: q.hint } : null);
  const [tries, setTries] = useState(3 - (q.attempts || 0));
  const [busy, setBusy] = useState(false);
  const [rev, setRev] = useState<Reveal | null>(null);
  const [showSol, setShowSol] = useState(false);
  const nextRef = useRef<HTMLButtonElement>(null);
  useEffect(() => { if (rev) nextRef.current?.focus(); }, [rev]);

  const setResult = (outcome: string, extra: any = {}, xp = 0) => setL((l) => { const results = [...l.results]; results[l.idx] = { outcome, ...extra }; return { ...l, results, xp: l.xp + xp }; });

  const check = async () => {
    if (busy || rev) return;
    if (!value.trim()) { toast(q.options ? 'Choose an answer first' : 'Type an answer first'); return; }
    setBusy(true);
    try {
      const r = await api.lessons.answer(L.id, value);
      if (r.correct) {
        setResult('correct', { attempts: 3 - r.attemptsLeft }, r.xp); setInputState('ok'); xpPop(r.xp);
        setRev({ good: true, r, title: PRAISE[Math.floor(Math.random() * PRAISE.length)], given: value });
      } else if (r.done) {
        setResult('incorrect', {}, r.xp);
        setRev({ good: false, r, title: 'Not this time — let’s look at why', given: value });
      } else {
        setInputState(''); requestAnimationFrame(() => setInputState('shake'));
        if (q.options) { setFlash(value); setTimeout(() => setFlash(null), 700); }
        setFb({ kind: 'retry', left: r.attemptsLeft, hint: r.hint }); setTries(r.attemptsLeft);
      }
      celebrate(r.rewards);
    } catch (e) { toast((e as Error).message, 'bad'); }
    finally { setBusy(false); }
  };
  const hint = async () => { try { const r = await api.lessons.hint(L.id); setFb({ kind: 'hint', hint: r.hint }); } catch (e) { toast((e as Error).message, 'bad'); } };
  const skip = async () => {
    if (rev) return;
    try { const r = await api.lessons.skip(L.id); setResult('skipped'); setRev({ good: false, r, title: 'Skipped — here’s how to do it', given: '' }); }
    catch (e) { toast((e as Error).message, 'bad'); }
  };
  const next = async () => {
    setBusy(true);
    try {
      const res = await api.lessons.next(L.id);
      const nl = { ...res.lesson, bonus: res.bonus };
      setL(() => nl);
      if (nl.status === 'completed') { onDone(); celebrate(res.rewards); }
    } catch (e) { toast((e as Error).message, 'bad'); setBusy(false); }
  };

  const reveal = rev && q.options ? { correct: correctLettersFrom(rev.r.answerHtml), given: rev.given } : flash ? { correct: '', given: flash } : null;
  const last = L.idx + 1 >= L.total;

  return (
    <div className="qcard">
      <div className="row spread wrap">
        <span className="row">{q.review ? <span className="review-tag">🔁 {REVIEW_TAG[q.review] || 'Review'} · {q.topicName || ''}</span> : <span className="tiny muted">Question {L.idx + 1}</span>}</span>
        <button className="speak" onClick={() => speak([speakable(q.html), ...(q.options || []).map((o: string, i: number) => `${LETTERS[i]}: ${speakable(o)}`)])}>🔊 Read</button>
      </div>
      <Html className="qtext" style={{ marginTop: 10 }} html={q.html} />
      {q.diagram && <Html className="diagram" html={q.diagram} />}
      <form onSubmit={(e) => { e.preventDefault(); check(); }}>
        <AnswerWidget q={q} value={value} onChange={setValue} onSubmit={check} locked={!!rev} showKeypad={isMaths && !q.options} inputState={inputState} reveal={reveal} />
        {!rev && <div className="row" style={{ justifyContent: 'flex-end', marginTop: 14 }}><button className="btn lg" disabled={busy}>Check</button></div>}
      </form>
      <div>
        {rev ? (
          <div className={`feedback ${rev.good ? 'good' : 'bad'}`}>
            <h4>{rev.good ? '✅' : '📘'} {rev.title}</h4>
            {!rev.good && <div>The answer is <b><Html as="span" html={rev.r.answerHtml} /></b></div>}
            <div className="solution">
              {rev.good && !showSol && <button className="link small" onClick={() => setShowSol(true)}>Show the explanation</button>}
              {(!rev.good || showSol) && <ol>{(rev.r.steps || []).map((x: string, i: number) => <Html as="li" key={i} html={x} />)}</ol>}
            </div>
            {!rev.good && <div className="small muted" style={{ marginTop: 8 }}>🔁 Saved to your mistakes bank — it will come back in a review.</div>}
          </div>
        ) : fb?.kind === 'hint' ? <div className="feedback info"><b>Hint:</b> <Html as="span" html={fb.hint} /></div>
          : fb?.kind === 'retry' ? <div className="feedback bad"><h4>Not quite — try again</h4>{fb.left} {fb.left === 1 ? 'try' : 'tries'} left.{fb.hint && <div style={{ marginTop: 8 }}><b>Hint:</b> <Html as="span" html={fb.hint} /></div>}</div> : null}
      </div>
      <div className="row" style={{ justifyContent: 'space-between', marginTop: 22 }}>
        {rev ? <>
          <button className="speak" onClick={() => speak((rev.r.steps || []).map(speakable))}>🔊 Explain aloud</button>
          <button ref={nextRef} className="btn lg" disabled={busy} onClick={next}>{last ? 'Finish' : 'Next question →'}</button>
        </> : <>
          <div className="row"><button className="btn ghost sm" onClick={hint}>💡 Hint</button><button className="btn ghost sm" onClick={skip}>Skip</button></div>
          <span className="small faint">{tries} tries left</span>
        </>}
      </div>
    </div>
  );
}

function Finish({ L, t, isReview }: { L: any; t: any; isReview: boolean }) {
  const s = useSession(); const { startLesson, startReview } = useLearningActions();
  const correct = L.results.filter((r: any) => r?.outcome === 'correct').length;
  const pct = L.total ? Math.round((correct / L.total) * 100) : 0;
  useEffect(() => { stopSpeaking(); if (pct >= 80) confetti(); s.refresh(); }, []); // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <div className="qcard result-hero">
      <div style={{ fontSize: 54 }}>{pct === 100 ? '🏆' : pct >= 80 ? '🌟' : pct >= 50 ? '💪' : '📘'}</div>
      <h2 style={{ fontSize: 30, margin: '8px 0' }}>{pct === 100 ? 'Perfect!' : pct >= 80 ? 'Excellent work!' : pct >= 50 ? 'Good effort!' : 'Keep practising!'}</h2>
      <p className="muted">{isReview ? 'Review session' : `${L.styleName} · ${t?.name || ''}`}</p>
      <div className="row" style={{ justifyContent: 'center', gap: 40, margin: '26px 0', flexWrap: 'wrap' }}>
        <div><Donut pct={pct} color={pct >= 80 ? '#10b981' : pct >= 50 ? '#f59e0b' : '#ef4444'} size={120} /><div className="small muted">{correct}/{L.total} correct</div></div>
        <div style={{ textAlign: 'left' }}><div className="v" style={{ fontSize: 40, fontWeight: 800 }}>+{L.xp}</div>
          <div className="muted">XP earned{L.bonus ? ` (incl. +${L.bonus} bonus)` : ''}</div><div className="muted small">+{Math.round(L.xp / 2)} coins</div></div>
      </div>
      <div className="row wrap" style={{ justifyContent: 'center' }}>
        {isReview ? <>
          <Link className="btn ghost" to="/app/review">Back to review</Link>
          <button className="btn" onClick={() => startReview({})}>Another review</button>
        </> : <>
          <Link className="btn ghost" to="/app/progress">Back to progress</Link>
          <button className="btn" onClick={() => startLesson(L.styleId)}>Practise again (1 credit)</button>
          {t && <Link className="btn soft" to={`/app/learn/${t.id}`}>📖 Topic page</Link>}
        </>}
        <Link className="btn soft" to="/app">Dashboard</Link>
      </div>
    </div>
  );
}
