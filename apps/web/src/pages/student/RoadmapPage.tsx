// v1 `/app/roadmap`: year tabs (remembered per subject), three term columns of topic cards + exam milestones, topic modal.
import { useState } from 'react';
import { Link } from 'react-router';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { useSession } from '../../state/session';
import { useOverlay } from '../../ui/overlays';
import { StudentGate } from '../../features/StudentGate';
import { StyleRow } from '../../features/StyleRow';
import { ErrorBox, Spinner } from '../../ui/bits';
import { TERMS, shortName, store } from '../../lib/format';
import { useTierOn, useTopicTest } from './topicShared';
import { YearSwitcher, isYearLocked, lockText } from '../../features/yearLock';
/* eslint-disable @typescript-eslint/no-explicit-any */

export default function RoadmapPage() {
  return <StudentGate title="Roadmap & Learn" subjectBar>{(c) => <Roadmap child={c} />}</StudentGate>;
}

function Roadmap({ child: c }: { child: any }) {
  const s = useSession(); const subj = s.subject;
  const { openModal } = useOverlay(); const tierOn = useTierOn();
  const [picked, setPicked] = useState<Record<string, number>>({});
  const prog = useQuery({ queryKey: ['progress', c.id, subj.id], queryFn: () => api.students.progress(c.id, subj.id) });
  const ex = useQuery({ queryKey: ['exams', c.id, subj.id], queryFn: () => api.students.exams(c.id, subj.id) });
  if (prog.isLoading || ex.isLoading) return <Spinner />;
  if (prog.error || ex.error) return <ErrorBox error={prog.error || ex.error} />;
  const { styles, topicTests = {} } = prog.data; const exams: any[] = ex.data.exams;

  const all = s.topicsOf(subj.id);
  const years = (s.cur?.years || []).filter((y) => all.some((t) => t.year === y));
  const yKey = `roadmapYear:${subj.id}`;
  let year = Number(picked[subj.id] ?? store.get(yKey, c.yearGroup));
  if (!years.includes(year)) year = years.includes(c.yearGroup) ? c.yearGroup : years[0];
  const pickYear = (y: number) => { store.set(yKey, y); setPicked((p) => ({ ...p, [subj.id]: y })); };
  const pctTopic = (t: any) => Math.round((t.styles.reduce((a: number, x: any) => a + Math.min(10, styles[x.id]?.done || 0), 0) / (t.styles.length * 10)) * 100);
  const yearPct = (y: number) => { const ts = all.filter((t) => t.year === y); return ts.length ? Math.round(ts.reduce((a, t) => a + pctTopic(t), 0) / ts.length) : 0; };
  const examsY = exams.filter((e) => e.year === year);
  const locked = isYearLocked(year, c);
  const openTopic = (t: any) => openModal((close) => <TopicModal t={t} styles={styles} tt={topicTests[t.id]} close={close} lockedYear={isYearLocked(t.year, c) ? t.year : null} />, { wide: true });

  return (
    <>
      <div className="page-head row spread wrap"><div><h1>{subj.icon} {subj.name} roadmap</h1><p>{subj.board} {subj.spec || ''} · Topics in teaching order, term by term. Year {c.yearGroup} and earlier years are open; later years unlock as {s.me!.user.role === 'student' ? 'you move' : `${c.name} moves`} up.</p></div><YearSwitcher child={c} /></div>
      <div className="year-tabs">{years.map((y) => { const p = yearPct(y); const cur = y === c.yearGroup;
        return <button key={y} className={`year-tab ${y === year ? 'on' : ''} ${isYearLocked(y, c) ? 'locked' : ''}`} onClick={() => pickYear(y)}>
          <span className={`tiny ${cur ? '' : 'faint'}`} style={cur ? { color: 'var(--brand)' } : undefined}>{cur ? 'Current year' : y < c.yearGroup ? 'Revisit' : lockText(y)}</span><b>Year {y}</b>
          <div className="bar thin" style={{ marginTop: 8 }}><i style={{ width: `${p}%`, background: subj.color }} /></div><span className="small muted">{p}% complete</span></button>; })}</div>
      {locked && <div className="lock-banner"><span style={{ fontSize: 26 }}>🔒</span><div className="grow"><b>Year {year} is locked</b><div className="small muted">You can look at what’s coming. Lessons and tests open when {s.me!.user.role === 'student' ? 'you move' : `${c.name} moves`} up to Year {year}.</div></div></div>}
      <div className="terms">{[1, 2, 3].map((term) => {
        const ts = all.filter((t) => t.year === year && t.term === term);
        const exm = examsY.filter((e) => e.term === term);
        return (
          <div key={term} className="term-col"><h4><span>{TERMS[term - 1]} term</span><span>{ts.length} topics</span></h4>
            {ts.length ? ts.map((t) => { const st = s.strand(t.strand); const p = pctTopic(t); const tt = topicTests[t.id];
              return <button key={t.id} className={`topic-card ${locked ? 'locked' : ''}`} style={{ ['--c' as string]: st.color }} onClick={() => openTopic(t)}>
                <div className="row spread"><span className="tiny" style={{ color: st.color }}>{shortName(st.name)}</span><span className="row" style={{ gap: 6 }}>
                  {tt?.best && <span className="pill good" title="Topic test">✓ {tt.best.pct}%</span>}{t.tier === 'H' && tierOn(t.subject) && <span className="pill" title="Higher tier">H</span>}</span></div>
                <div className="t" style={{ margin: '6px 0 10px' }}>{t.name}</div><div className="bar thin"><i style={{ width: `${p}%`, background: st.color }} /></div>
                <div className="row spread small muted" style={{ marginTop: 6 }}><span>📖 {t.styles.length} styles</span><span>{locked ? '🔒' : `${p}%`}</span></div></button>; })
              : <div className="faint small">No topics</div>}
            {exm.map((e) => <Link key={e.id} className={`milestone ${locked ? 'locked' : ''}`} to="/app/exams"><span style={{ fontSize: 22 }}>{e.kind === 'mock' ? '🎓' : '🏁'}</span><div className="grow"><b>{e.name}</b><div className="small muted">{e.questions} Qs · {e.minutes} min</div></div>
              {e.best ? <span className="pill good">Grade {e.best.grade}</span> : <span className="pill warn">Not taken</span>}</Link>)}
          </div>);
      })}</div>
    </>
  );
}

function TopicModal({ t, styles, tt, close, lockedYear }: { t: any; styles: any; tt: any; close: () => void; lockedYear: number | null }) {
  const s = useSession(); const tierOn = useTierOn(); const topicTest = useTopicTest();
  const st = s.strand(t.strand);
  return (
    <>
      <div className="tiny" style={{ color: st.color }}>{st.name} · Year {t.year} · {TERMS[t.term - 1]} term {t.tier === 'H' && tierOn(t.subject) ? '· Higher' : ''}</div>
      <h2 style={{ marginTop: 6 }}>{t.name}</h2><p className="muted">{t.summary || ''}</p>
      {lockedYear && <div className="lock-banner"><span style={{ fontSize: 22 }}>🔒</span><div className="small"><b>Year {lockedYear} topic.</b> You can read the explanation now — lessons and the test unlock in Year {lockedYear}.</div></div>}
      <div className="row wrap" style={{ margin: '14px 0' }}><Link className="btn" to={`/app/learn/${t.id}`} onClick={close}>📖 Learn this topic</Link>
        {lockedYear ? <span className="lock-pill">🔒 Topic test · Year {lockedYear}</span> : <button className="btn ghost" onClick={() => topicTest(t.id)}>📝 Topic test · 15 Qs · 1 credit{tt?.best ? ` (best ${tt.best.pct}%)` : ''}</button>}</div>
      <div>{t.styles.map((x: any, i: number) => <StyleRow key={x.id} s={x} i={i} r={styles[x.id]} lockedYear={lockedYear} />)}</div>
      <div className="row" style={{ justifyContent: 'flex-end', marginTop: 16 }}><button className="btn ghost" onClick={close}>Close</button></div>
    </>
  );
}
