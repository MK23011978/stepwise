// v1 `/app/report` and `/app/report/:studentId`: progress report, 6-week personal plan and road to the GCSE exams.
import { Link, useParams } from 'react-router';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { useSession } from '../../state/session';
import { AppShell } from '../../layout/AppShell';
import { StudentGate } from '../../features/StudentGate';
import { useLearningActions } from '../../features/actions';
import { Avatar, ErrorBox, Spinner } from '../../ui/bits';
import { fmtDate, gradeLabel } from '../../lib/format';
/* eslint-disable @typescript-eslint/no-explicit-any */

const TONE: Record<string, string> = { good: 'var(--good)', warn: '#f59e0b', bad: 'var(--bad)', '': 'var(--ink-3)' };
const KIND_ICON: Record<string, string> = { review: '🔁', practise: '🎯', learn: '📘', test: '📝', exam: '🏁' };
const KIND_LABEL: Record<string, string> = { review: 'Review', practise: 'Practise', learn: 'New', test: 'Topic test', exam: 'Checkpoint' };
const gx = (g: number) => `${((Math.max(1, Math.min(9, g)) - 1) / 8) * 100}%`;

function printAs(cls: string) {
  document.body.classList.add(cls);
  const done = () => { document.body.classList.remove(cls); window.removeEventListener('afterprint', done); };
  window.addEventListener('afterprint', done);
  window.print();
  setTimeout(done, 1500);
}

export default function ReportPage() {
  const { studentId } = useParams(); const s = useSession();
  if (!studentId) return <StudentGate title="Report & Plan">{(c) => <Report id={c.id} />}</StudentGate>;
  return <AppShell title="Report & Plan" admin={s.me?.user.role === 'admin'}><Report id={studentId} /></AppShell>;
}

function Report({ id }: { id: string }) {
  const s = useSession(); const { startLesson, startReview, startExam } = useLearningActions();
  const q = useQuery({ queryKey: ['report', id], queryFn: () => api.students.report(id) });
  if (q.isLoading) return <Spinner />;
  if (q.error) return <ErrorBox error={q.error} />;
  const r = q.data; const st = r.student; const o = r.overall;
  const isAdmin = s.me?.user.role === 'admin';
  const canAct = !isAdmin && !!s.child && s.child.id === st.id;
  const trend = o.questions4w - o.questionsPrev4w;

  const startItem = (it: any) => {
    if (it.styleId) return startLesson(it.styleId);
    if (it.kind === 'review') return startReview(it.mode === 'mistakes' ? { mode: 'mistakes' } : {});
    return startExam(it.examId, it.name, it.kind === 'test' ? 15 : 12, 25);
  };

  return (
    <div className="report">
      <div className="row spread no-print" style={{ marginBottom: 14 }}>
        {isAdmin ? <Link className="small" to={`/admin/users/${st.id}`}>← {st.name}</Link> : <span />}
        <button className="btn" onClick={() => printAs('print-report')}>🖨️ Print / save as PDF</button>
      </div>
      <div className="report-head"><Avatar u={st} size="lg" /><div><div className="tiny" style={{ color: '#a5b4fc' }}>Progress report & personal plan</div><h1>{st.name}</h1>
        <div className="meta">Year {st.yearGroup} · {st.tier === 'F' ? 'Foundation' : 'Higher'} tier · {r.term} term · generated {fmtDate(r.generatedAt)}</div></div>
        <div className="count"><b>{r.weeksToExam}</b><span className="meta">weeks to GCSE exams<br />(from {fmtDate(r.examDate)})</span></div></div>

      <div className="kpis">
        <div className="card kpi"><div className="v">{o.lessons}</div><div className="l">Lessons completed · {o.reviews} reviews</div></div>
        <div className="card kpi"><div className="v">{o.questions4w}</div><div className="l">Questions in the last 4 weeks <b style={{ color: trend >= 0 ? 'var(--good)' : 'var(--bad)' }}>{trend >= 0 ? '▲' : '▼'} {Math.abs(trend)}</b> vs previous 4</div></div>
        <div className="card kpi"><div className="v">{o.activeDays4w}<span className="faint" style={{ fontSize: 18 }}>/28</span></div><div className="l">Active days · 🔥 {o.streak}-day streak</div></div>
        <div className="card kpi"><div className="v">Lv {o.level.level}</div><div className="l">🏅 {o.badges} badges · 📜 {o.certificates} certificates</div></div>
      </div>

      <h2 style={{ margin: '6px 0 14px' }}>📊 Subject by subject</h2>
      <div className="grid-3" style={{ gridTemplateColumns: 'repeat(auto-fill,minmax(min(320px,100%),1fr))' }}>{r.subjects.map((x: any) => { const tone = TONE[x.status.tone] ?? TONE['']; return (
        <div key={x.id ?? x.name} className="card subj-report" style={{ ['--c' as string]: x.color }}>
          <div className="row spread"><div className="row"><span style={{ fontSize: 24 }}>{x.icon}</span><div><h3>{x.name}</h3><div className="small muted">{x.board}</div></div></div>
            <span className="pill" style={{ background: `color-mix(in srgb, ${tone} 15%, transparent)`, color: tone }}>{x.status.label}</span></div>
          <div className="grade-scale" role="img" aria-label={`Predicted grade ${gradeLabel(x.predicted)}, target ${x.target}`}><div className="track" />
            {[1, 3, 5, 7, 9].map((g) => <span key={g} className="tick" style={{ left: gx(g) }}>{g}</span>)}
            <span className="mk target" style={{ left: gx(x.target) }} title="Target grade">{x.target}</span>
            {typeof x.predicted === 'number' && <span className="mk" style={{ left: gx(x.predicted), background: tone }} title="Predicted grade">{x.predicted}</span>}</div>
          <div className="row wrap small muted" style={{ gap: 14, marginTop: -6 }}><span>● predicted {gradeLabel(x.predicted)}</span><span>■ target {x.target}</span><span>🎯 {x.accuracy ?? '–'}%</span><span>⏱ pace {x.schedulePct}%</span></div>
          <div className="bar thin" style={{ margin: '8px 0 14px' }} title="Topics expected by now that have been started"><i style={{ width: `${x.schedulePct}%`, background: x.color }} /></div>
          <div className="comment">{x.comment.join(' ')}</div>
          {x.weak.length > 0 && <><div className="tiny muted" style={{ marginTop: 14 }}>Areas to improve</div><ul className="mini-list">{x.weak.slice(0, 3).map((w: any, i: number) =>
            <li key={i}><span>{w.name} <span className="faint">· {w.topic}</span></span><b style={{ color: 'var(--bad)' }}>{w.acc}%</b></li>)}</ul></>}
          {x.strongAreas.length > 0 && <><div className="tiny muted" style={{ marginTop: 14 }}>Strengths</div><div className="small" style={{ marginTop: 6 }}>💪 {x.strongAreas.join(' · ')}</div></>}
          {x.exams.length > 0 && <><div className="tiny muted" style={{ marginTop: 14 }}>Recent exams</div><div className="row wrap" style={{ gap: 6, marginTop: 6 }}>
            {x.exams.map((e: any, i: number) => <span key={i} className="pill" title={e.name}>Grade {e.grade} · {e.pct}%</span>)}</div></>}
        </div>); })}</div>

      <h2 style={{ margin: '30px 0 6px' }}>🗺️ Personal roadmap — next 6 weeks</h2>
      <p className="muted" style={{ margin: '0 0 14px' }}>Built from {st.name}’s results: weakest skills first, then the next topics in teaching order, weighted towards subjects furthest from target. About <b>{r.plan.perWeek} lessons a week</b> plus a free review session.</p>
      <div className="card">{r.plan.weeks.map((w: any) => (
        <div key={w.n} className="week"><div><div className="week-n">Week {w.n}</div><div className="small muted">from {fmtDate(w.from)}</div><div className="small muted">≈ {Math.round((w.minutes / 60) * 10) / 10} hours</div></div>
          <div>{w.items.map((it: any, i: number) => (
            <div key={i} className="plan-item"><span className="ic" style={{ background: it.color || '#8b5cf6' }}>{KIND_ICON[it.kind]}</span>
              <div className="grow"><div><span className="tiny" style={{ color: it.color || '#8b5cf6' }}>{KIND_LABEL[it.kind]}{it.subjectName ? ` · ${it.subjectName}` : ''}</span></div>
                <b className="small">{it.name}</b>{it.topic && it.kind !== 'test' && <span className="small muted"> · {it.topic}</span>}<div className="plan-why">{it.why || ''}</div></div>
              {canAct && <button className="btn sm soft no-print" onClick={() => startItem(it)}>Start</button>}</div>))}</div></div>))}</div>

      <h2 style={{ margin: '30px 0 14px' }}>🎓 Road to the GCSE exams</h2>
      <div className="card"><div className="timeline">{r.milestones.map((m: any, i: number) => (
        <div key={i} className={`tl-step ${m.current ? 'now' : ''} ${m.items.some((x: string) => /GCSE exams/.test(x)) ? 'exam' : ''}`}><b>{m.label}{m.current ? ' · now' : ''}</b>{m.items.map((x: string, j: number) => <span key={j}>{x}</span>)}</div>))}</div></div>
      <p className="small faint" style={{ marginTop: 18 }}>Predicted grades combine practice accuracy (weighted by how much of the year has been covered) with recent exam results, mapped to GCSE grade boundaries. They become more reliable as more work is completed. “Pace” is the share of topics expected by this point in Year {st.yearGroup} that have been started.</p>
    </div>
  );
}
