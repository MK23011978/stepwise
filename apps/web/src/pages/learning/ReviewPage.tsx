// Review centre (v1 `/app/review`): spaced-repetition schedule, mistakes bank, and daily review sessions.
import { useQuery } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { useSession } from '../../state/session';
import { StudentGate } from '../../features/StudentGate';
import { useLearningActions } from '../../features/actions';
import { Empty, ErrorBox, Html, Spinner } from '../../ui/bits';
import { fmtDate } from '../../lib/format';
/* eslint-disable @typescript-eslint/no-explicit-any */

const BOX_NAMES = ['1 day', '2 days', '4 days', '1 week', '2 weeks', '1 month', '2 months'];

export default function ReviewPage() {
  return <StudentGate title="Review">{(c) => <Review child={c} />}</StudentGate>;
}

function Review({ child: c }: { child: any }) {
  const s = useSession(); const { startReview } = useLearningActions();
  const q = useQuery({ queryKey: ['review', c.id], queryFn: () => api.students.review(c.id) });
  if (q.isLoading) return <Spinner />;
  if (q.error || !q.data) return <ErrorBox error={q.error} />;
  const r = q.data;
  const maxBox = Math.max(1, ...r.boxes);
  const fixed = s.me?.children.find((x: any) => x.id === c.id)?.mistakesFixed ?? c.mistakesFixed ?? 0;
  const row = { padding: '7px 0', borderBottom: '1px solid var(--line)' };
  return (
    <>
      <div className="page-head"><h1>🔁 Review &amp; retry</h1><p>Topics come back for a quick review just before you’d forget them, and every question you got wrong waits in your mistakes bank until you fix it. Review sessions are always free.</p></div>
      <div className="kpis">
        <div className="card kpi"><div className="v" style={{ color: '#8b5cf6' }}>{r.dueCount}</div><div className="l">Topics due for review</div></div>
        <div className="card kpi"><div className="v" style={{ color: 'var(--bad)' }}>{r.mistakeCount}</div><div className="l">Mistakes to fix</div></div>
        <div className="card kpi"><div className="v">{r.tracked}</div><div className="l">Styles in your memory schedule</div></div>
        <div className="card kpi"><div className="v" style={{ color: 'var(--good)' }}>{fixed}</div><div className="l">Mistakes fixed</div></div>
      </div>
      <div className="card pad-lg" style={{ marginBottom: 22, background: 'linear-gradient(120deg,#7c3aed,#3b6cf6)', color: '#fff', border: 0 }}>
        <div className="row wrap spread">
          <div><h2 style={{ fontSize: 24 }}>Daily review</h2><p style={{ margin: '6px 0 0', color: '#e0e7ff' }}>10 questions: your past mistakes first, then topics due for review, then a recap of earlier work. +3 XP bonus for every remembered answer.</p></div>
          <div className="row wrap">
            <button className="btn lg" style={{ background: '#fff', color: '#4c1d95' }} onClick={() => startReview({})}>▶ Start review</button>
            {r.mistakeCount > 0 && <button className="btn lg ghost" style={{ color: '#fff', borderColor: 'rgba(255,255,255,.4)' }} onClick={() => startReview({ mode: 'mistakes' })}>Fix my mistakes</button>}
          </div>
        </div>
      </div>
      <div className="grid-main">
        <div className="card"><div className="card-head"><h3>Mistakes bank</h3><span className="small muted">{r.mistakeCount} to fix</span></div>
          {r.mistakes.length ? r.mistakes.slice(0, 40).map((m: any) => (
            <div key={m.id} className="mistake">
              <div><div className="small muted">{s.subjectInfo(s.topicOfStyle(m.styleId)?.subject)?.icon || ''} {m.topic} · {m.name} · from {m.source} · {fmtDate(m.at)}{m.tries ? ` · tried ${m.tries}×` : ''}</div><Html className="q" html={m.html} /></div>
              <button className="btn sm soft" onClick={() => startReview({ mistakeId: m.id })}>Retry</button>
            </div>)) : <Empty icon="🎉">No mistakes waiting — brilliant!</Empty>}
        </div>
        <div className="stack">
          <div className="card"><div className="card-head"><h3>Memory boxes</h3></div><p className="small muted" style={{ marginTop: 0 }}>Each correct review moves a style to a longer gap. A mistake sends it back to box 1.</p>
            <div className="boxes" role="img" aria-label="Styles per memory box">{r.boxes.map((n: number, i: number) => (
              <div key={i}><span className="small" style={{ fontWeight: 700 }}>{n}</span><i style={{ height: `${(n / maxBox) * 100}%` }} /><span className="tiny faint" style={{ fontSize: 9, textAlign: 'center' }}>{BOX_NAMES[i]}</span></div>))}</div></div>
          <div className="card"><div className="card-head"><h3>Due now</h3></div>
            {r.due.length ? r.due.slice(0, 12).map((d: any, i: number) => <div key={i} className="row spread small" style={row}><span>{d.name} <span className="muted">· {d.topic}</span></span><span className="pill">box {d.box + 1}</span></div>)
              : <div className="small muted">Nothing due right now.</div>}</div>
          <div className="card"><div className="card-head"><h3>Coming up</h3></div>
            {r.upcoming.length ? r.upcoming.map((d: any, i: number) => <div key={i} className="row spread small" style={row}><span>{d.name}</span><span className="muted">{fmtDate(d.due)}</span></div>)
              : <div className="small muted">Complete lessons to build your schedule.</div>}</div>
        </div>
      </div>
    </>
  );
}
