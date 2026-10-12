// v1 `/app/progress`: KPIs, year/status filters (remembered), strands → topics with Learn/Test buttons and style rows.
import { useState } from 'react';
import { Link } from 'react-router';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { useSession } from '../../state/session';
import { StudentGate } from '../../features/StudentGate';
import { StyleRow } from '../../features/StyleRow';
import { Donut } from '../../ui/charts';
import { ErrorBox, Spinner } from '../../ui/bits';
import { TERMS, store } from '../../lib/format';
import { useTierOn, useTopicTest } from './topicShared';
/* eslint-disable @typescript-eslint/no-explicit-any */

type Filter = { year: number | 'all'; status: string };
const STATUSES: [string, string][] = [['all', 'All'], ['new', 'Not started'], ['started', 'In progress'], ['completed', 'Completed'], ['mastered', 'Mastered']];

export default function ProgressPage() {
  return <StudentGate title="Progress" subjectBar>{(c) => <Progress child={c} />}</StudentGate>;
}

function Progress({ child: c }: { child: any }) {
  const s = useSession(); const subj = s.subject; const tierOn = useTierOn(); const topicTest = useTopicTest();
  const [f, setF] = useState<Filter>(() => store.get<Filter>('progFilter', { year: c.yearGroup, status: 'all' }));
  const q = useQuery({ queryKey: ['progress', c.id, subj.id], queryFn: () => api.students.progress(c.id, subj.id) });
  if (q.isLoading) return <Spinner />;
  if (q.error) return <ErrorBox error={q.error} />;
  const { styles, summary: sm, topicTests = {} } = q.data;
  const all = s.topicsOf(subj.id);
  const years = (s.cur?.years || []).filter((y) => all.some((t) => t.year === y));
  const year = f.year !== 'all' && !years.includes(f.year) ? 'all' : f.year;
  const update = (p: Partial<Filter>) => { const n = { ...f, year, ...p }; store.set('progFilter', n); setF(n); };
  const topics = all.filter((t) => year === 'all' || t.year === year);
  const match = (sid: string) => f.status === 'all' || (styles[sid]?.status || 'new') === f.status;
  const strands = (s.cur?.strands || []).filter((x) => x.subject === subj.id)
    .map((st) => ({ st, ts: topics.filter((t) => t.strand === st.id && t.styles.some((x: any) => match(x.id))) })).filter((x) => x.ts.length);

  return (
    <>
      <div className="page-head"><h1>{s.me!.user.role === 'student' ? 'Your' : `${c.name}’s`} {subj.name} progress</h1><p>Each topic is split into styles of question. A style is completed once 10 questions are done; mastered at 80%+ accuracy.</p></div>
      <div className="kpis">
        <div className="card kpi"><div className="v">{sm.correct}</div><div className="l">Correct answers</div></div>
        <div className="card kpi"><div className="v">{sm.incorrect}</div><div className="l">Incorrect attempts</div></div>
        <div className="card kpi"><div className="v" style={{ color: 'var(--brand)' }}>{sm.mastered}</div><div className="l">Styles mastered</div></div>
        <div className="card kpi"><div className="row"><Donut pct={sm.coverage} color={subj.color} size={64} /><div className="l">of Year {c.yearGroup} scope started</div></div></div>
      </div>
      <div className="filters"><span className="small muted" style={{ fontWeight: 600 }}>Year</span>
        {(['all', ...years] as (number | 'all')[]).map((y) => <button key={y} className={`chip ${String(year) === String(y) ? 'on' : ''}`} aria-pressed={String(year) === String(y)} onClick={() => update({ year: y })}>{y === 'all' ? 'All' : `Y${y}${typeof y === 'number' && y > c.yearGroup ? ' 🔒' : ''}`}</button>)}
        <span style={{ width: 12 }} /><span className="small muted" style={{ fontWeight: 600 }}>Status</span>
        {STATUSES.map(([k, l]) => <button key={k} className={`chip ${f.status === k ? 'on' : ''}`} aria-pressed={f.status === k} onClick={() => update({ status: k })}>{l}</button>)}
      </div>
      <div id="topics">{strands.length ? strands.map(({ st, ts }) => (
        <div key={st.id}><div className="strand-head"><i style={{ background: st.color }} />{st.name}</div>
          {ts.map((t: any) => { const done = t.styles.reduce((a: number, x: any) => a + Math.min(10, styles[x.id]?.done || 0), 0); const tt = topicTests[t.id]; const lk = t.year > c.yearGroup ? t.year : null;
            return (
              <div key={t.id} className={`topic ${lk ? 'locked' : ''}`}><div className="topic-top"><div><h3>{t.name}</h3><span className="small muted">Year {t.year} · {TERMS[t.term - 1]} {t.tier === 'H' && tierOn(t.subject) ? '· Higher' : ''}</span></div>
                <div className="row wrap"><span className="muted small">{done}/{t.styles.length * 10} questions</span><Link className="btn sm ghost" to={`/app/learn/${t.id}`}>📖 Learn</Link>
                  {lk ? <span className="lock-pill">🔒 Unlocks in Year {lk}</span> : <button className="btn sm ghost" onClick={() => topicTest(t.id)}>📝 Test{tt?.best ? ` · ${tt.best.pct}%` : ''}</button>}</div></div>
                <div className="bar"><i style={{ width: `${(done / (t.styles.length * 10)) * 100}%`, background: st.color }} /></div>
                <div style={{ marginTop: 8 }}>{t.styles.map((x: any, i: number) => (match(x.id) ? <StyleRow key={x.id} s={x} i={i} r={styles[x.id]} lockedYear={lk} /> : null))}</div></div>);
          })}</div>))
        : <div className="empty"><div className="e">🔍</div>Nothing matches these filters.</div>}</div>
    </>
  );
}
