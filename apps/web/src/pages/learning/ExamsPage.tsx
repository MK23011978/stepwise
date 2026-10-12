// Tests & mocks list (v1 `/app/exams`): results chart, recent attempts, exams grouped by year plus full mocks.
import { Link } from 'react-router';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { useSession } from '../../state/session';
import { StudentGate } from '../../features/StudentGate';
import { useLearningActions } from '../../features/actions';
import { LineChart } from '../../ui/charts';
import { ErrorBox, Spinner } from '../../ui/bits';
import { fmtDate } from '../../lib/format';
/* eslint-disable @typescript-eslint/no-explicit-any */

const KIND_ICON: Record<string, string> = { checkpoint: '🏁', 'end-of-year': '📅', mock: '🎓', topic: '📝' };

export default function ExamsPage() {
  return <StudentGate title="Tests & Mocks" subjectBar>{(c) => <Exams child={c} />}</StudentGate>;
}

function Exams({ child: c }: { child: any }) {
  const s = useSession(); const subj = s.subject;
  const q = useQuery({ queryKey: ['exams', c.id, subj.id], queryFn: () => api.students.exams(c.id, subj.id) });
  if (q.isLoading) return <Spinner />;
  if (q.error || !q.data) return <ErrorBox error={q.error} />;
  const { exams, attempts } = q.data as { exams: any[]; attempts: any[] };
  const years = [c.yearGroup, ...(s.cur?.years || []).filter((y) => y !== c.yearGroup)].filter((y) => exams.some((e) => e.year === y && e.kind !== 'mock'));
  const mocks = exams.filter((e) => e.kind === 'mock');
  return (
    <>
      <div className="page-head"><h1>{subj.icon} {subj.name} tests &amp; mock exams</h1><p>Timed, mixed-topic exams marked instantly with a grade — then every wrong answer is explained step by step, with a similar question to try straight away. Topic tests are on each topic’s page.</p></div>
      <div className="grid-main" style={{ marginBottom: 26 }}>
        <div className="card"><div className="card-head"><h3>Results over time</h3></div>
          <LineChart points={attempts.filter((a) => a.kind !== 'topic').slice().reverse().map((a, i) => ({ label: `#${i + 1}`, title: a.name, value: a.pct, tag: a.grade }))} /></div>
        <div className="card"><div className="card-head"><h3>Recent attempts</h3></div>
          {attempts.length ? <div className="stack">{attempts.slice(0, 6).map((a) => (
            <Link key={a.id} className="rec" to={`/app/exam/${a.id}`}><span className="dot" style={{ background: 'linear-gradient(135deg,#3b6cf6,#8b5cf6)' }}>{a.grade}</span>
              <div className="grow"><b>{a.name}</b><div className="small muted">{fmtDate(a.at)} · {a.score}/{a.max} marks</div></div><b>{a.pct}%</b></Link>))}</div>
            : <div className="empty small">No attempts yet.</div>}</div>
      </div>
      {years.map((y) => (
        <div key={y}><div className="strand-head">Year {y}{y === c.yearGroup ? ' · current' : ''}</div>
          <div className="exam-grid">{exams.filter((e) => e.year === y && e.kind !== 'mock').map((e) => <ExamCard key={e.id} e={e} />)}</div></div>))}
      {mocks.length > 0 && <><div className="strand-head">Full GCSE mocks</div><div className="exam-grid">{mocks.map((e) => <ExamCard key={e.id} e={e} />)}</div></>}
    </>
  );
}

function ExamCard({ e }: { e: any }) {
  const { startExam } = useLearningActions();
  return (
    <div className={`card exam-card ${e.locked ? 'locked' : ''}`} style={e.recommended ? { borderColor: 'var(--brand)' } : undefined}>
      <div className="row spread"><span style={{ fontSize: 28 }}>{KIND_ICON[e.kind]}</span>{e.recommended && <span className="pill brand">Your year</span>}</div>
      <div className="ttl">{e.name}</div>
      <div className="small muted">{e.questions} questions · {e.minutes} minutes · {e.kind === 'mock' ? 'full GCSE content' : e.kind === 'end-of-year' ? `everything up to Year ${e.year}` : `${e.termName} term content`}</div>
      <div className="row spread" style={{ marginTop: 'auto' }}>
        {e.best ? <Link className="pill good" to={`/app/exam/${e.best.id}`}>Best: Grade {e.best.grade} · {e.best.pct}%</Link> : <span className="pill">{e.attempts ? `${e.attempts} attempts` : 'Not attempted'}</span>}
        {e.locked ? <span className="lock-pill">🔒 Unlocks in Year {e.year}</span>
          : e.activeId ? <Link className="btn sm" to={`/app/exam/${e.activeId}`}>Resume</Link>
          : e.hasContent ? <button className={`btn sm ${e.best ? 'soft' : ''}`} onClick={() => startExam(e.id, e.name, e.questions, e.minutes)}>{e.best ? 'Retake' : 'Start'}</button>
            : <span className="small faint">Coming soon</span>}
      </div>
    </div>
  );
}
