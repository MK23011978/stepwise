// Admin overview (v1 #/admin): KPIs, revenue and lesson charts, year mix, popular topics, audit log.
import { useQuery } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { AppShell } from '../../layout/AppShell';
import { BarChart } from '../../ui/charts';
import { ErrorBox, Spinner } from '../../ui/bits';
import { fmtDate, fmtDateTime, money } from '../../lib/format';
/* eslint-disable @typescript-eslint/no-explicit-any */

const YEAR_COLORS = ['#0ea5a4', '#3b6cf6', '#8b5cf6', '#f59e0b', '#ec4899'];

export default function AdminOverviewPage() {
  return <AppShell title="Admin overview" admin><Overview /></AppShell>;
}

function Overview() {
  const q = useQuery({ queryKey: ['admin', 'stats'], queryFn: () => api.admin.stats() });
  if (q.isLoading) return <Spinner />;
  if (q.error) return <ErrorBox error={q.error} />;
  const s = q.data;
  const yTotal = Math.max(1, s.yearMix.reduce((t: number, y: any) => t + y.n, 0));
  return (
    <>
      <div className="page-head"><h1>Platform overview</h1><p>{s.curriculum.subjects} subjects · {s.curriculum.topics} topics · {s.curriculum.styles} question styles · {s.curriculum.learn} topic explanations.</p></div>
      <div className="kpis">
        <div className="card kpi"><div className="ico" style={{ background: 'var(--good-soft)' }}>💷</div><div className="v">{money(s.revenue)}</div><div className="l">Total revenue · {s.payments} payments</div></div>
        <div className="card kpi"><div className="ico" style={{ background: 'var(--brand-soft)' }}>👪</div><div className="v">{s.parents}</div><div className="l">Parents · {s.students} students · {s.freeAccess} free access</div></div>
        <div className="card kpi"><div className="ico" style={{ background: 'var(--warn-soft)' }}>📘</div><div className="v">{s.lessons}</div><div className="l">Lessons started · {s.lessonsCompleted} completed</div></div>
        <div className="card kpi"><div className="ico" style={{ background: '#f3e8ff' }}>📝</div><div className="v">{s.exams}</div><div className="l">Tests taken · {s.creditsOutstanding} credits unspent</div></div>
      </div>
      <div className="grid-main">
        <div className="stack">
          <div className="card"><div className="card-head"><h3>Revenue · last 30 days</h3><span className="small muted">{money(s.days.reduce((t: number, d: any) => t + d.revenue, 0))}</span></div>
            <BarChart data={s.days.map((d: any) => ({ label: fmtDate(d.date), short: d.date.slice(8), value: d.revenue }))} color="#10b981" fmt={(v) => '£' + v} /></div>
          <div className="card"><div className="card-head"><h3>Lessons started · last 30 days</h3></div>
            <BarChart data={s.days.map((d: any) => ({ label: fmtDate(d.date), short: d.date.slice(8), value: d.lessons }))} color="#3b6cf6" /></div>
        </div>
        <div className="stack">
          <div className="card"><div className="card-head"><h3>Students by year</h3></div>
            {s.yearMix.map((y: any, i: number) => <div key={y.year} style={{ margin: '12px 0' }}><div className="row spread small"><b>Year {y.year}</b><span className="muted">{y.n}</span></div>
              <div className="bar"><i style={{ width: `${(y.n / yTotal) * 100}%`, background: YEAR_COLORS[i % 5] }} /></div></div>)}</div>
          <div className="card"><div className="card-head"><h3>Popular topics</h3></div>
            {s.topTopics.length ? s.topTopics.map((t: any, i: number) => <div key={i} className="row spread small" style={{ padding: '7px 0', borderBottom: '1px solid var(--line)' }}><span>{t.name}</span><b>{t.n}</b></div>)
              : <div className="empty small">No lessons yet</div>}</div>
          <div className="card"><div className="card-head"><h3>Recent activity</h3></div><div style={{ maxHeight: 320, overflow: 'auto' }}>
            {s.audit.map((a: any, i: number) => <div key={i} className="small" style={{ padding: '7px 0', borderBottom: '1px solid var(--line)' }}><b>{a.actorName}</b> <span className="muted">{a.action}</span> {a.detail || ''}<div className="faint">{fmtDateTime(a.at)}</div></div>)}</div></div>
        </div>
      </div>
    </>
  );
}
