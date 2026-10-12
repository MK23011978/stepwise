// Planner & Tasks (v1 #/app/planner): month calendar with a day panel, and a task board.
import { useState } from 'react';
import { Link, useSearchParams } from 'react-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { useSession } from '../../state/session';
import { useOverlay } from '../../ui/overlays';
import { StudentGate } from '../../features/StudentGate';
import { useLearningActions } from '../../features/actions';
import { Coin, ErrorBox, Spinner } from '../../ui/bits';
import { confetti } from '../../lib/confetti';
import { fmtDate, store, todayStr } from '../../lib/format';
import { TaskForm } from './TaskForm';
/* eslint-disable @typescript-eslint/no-explicit-any */

type Tab = 'calendar' | 'tasks';

export default function PlannerPage() {
  return <StudentGate title="Planner & Tasks">{(c) => <Planner child={c} />}</StudentGate>;
}

function Planner({ child: c }: { child: any }) {
  const [params] = useSearchParams();
  const [tab, setTabState] = useState<Tab>(params.get('tab') === 'tasks' ? 'tasks' : store.get<Tab>('plannerTab', 'calendar'));
  const setTab = (t: Tab) => { store.set('plannerTab', t); setTabState(t); };
  const task = useTaskForm(c);
  return (
    <>
      <div className="page-head row spread wrap"><div><h1>🗓️ Planner</h1><p>Reviews, planned lessons, tasks and exams in one place. Tasks set by a parent can earn coins.</p></div>
        <div className="row wrap"><div className="tabs" role="tablist" style={{ margin: 0 }}>
          <button role="tab" aria-selected={tab === 'calendar'} className={tab === 'calendar' ? 'on' : ''} onClick={() => setTab('calendar')}>Calendar</button>
          <button role="tab" aria-selected={tab === 'tasks'} className={tab === 'tasks' ? 'on' : ''} onClick={() => setTab('tasks')}>Tasks</button></div>
          <button className="btn" onClick={() => task(null)}>+ New task</button></div></div>
      {tab === 'calendar' ? <Calendar child={c} onAddTask={(date) => task({ dueDate: date })} /> : <Board child={c} onEdit={(t) => task(t)} />}
    </>
  );
}

function useTaskForm(c: any) {
  const { openModal } = useOverlay(); const qc = useQueryClient();
  return (existing: any) => openModal((close) => <TaskForm child={c} existing={existing} close={close} onDone={() => {
    qc.invalidateQueries({ queryKey: ['tasks', c.id] }); qc.invalidateQueries({ queryKey: ['calendar', c.id] });
  }} />, { wide: true });
}

// ---------- calendar ----------
const LEGEND: [string, string][] = [['review', 'Review due'], ['plan', 'Planned lesson'], ['task', 'Task'], ['done', 'Completed'], ['school', 'School dates']];
const DOT: Record<string, string> = { review: '#8b5cf6', plan: '#3b6cf6', task: '#0284c7', done: '#10b981', 'exam-done': '#10b981', school: '#f59e0b', missions: '#f97316' };
const DOW = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

function Calendar({ child: c, onAddTask }: { child: any; onAddTask: (date: string) => void }) {
  const T = todayStr();
  const [month, setMonth] = useState(T.slice(0, 7));
  const [sel, setSel] = useState<string | null>(null);
  const { startLesson, startReview, startExam } = useLearningActions();
  const [y, m] = month.split('-').map(Number);
  const first = new Date(Date.UTC(y, m - 1, 1)); const startPad = (first.getUTCDay() + 6) % 7;
  const gridStart = new Date(first); gridStart.setUTCDate(1 - startPad);
  const cells = Array.from({ length: 42 }, (_, i) => { const d = new Date(gridStart); d.setUTCDate(gridStart.getUTCDate() + i); return d.toISOString().slice(0, 10); });
  const q = useQuery({ queryKey: ['calendar', c.id, cells[0], cells[41]], queryFn: () => api.students.calendar(c.id, cells[0], cells[41]) });
  if (q.isLoading) return <Spinner />;
  if (q.error) return <ErrorBox error={q.error} />;
  const byDate: Record<string, any> = Object.fromEntries(q.data.days.map((d: any) => [d.date, d]));
  const day = sel && sel >= cells[0] && sel <= cells[41] ? sel : T.slice(0, 7) === month ? T : cells[startPad];
  const label = first.toLocaleDateString('en-GB', { month: 'long', year: 'numeric', timeZone: 'UTC' });
  const shift = (n: number) => { const d = new Date(Date.UTC(y, m - 1 + n, 1)); setMonth(d.toISOString().slice(0, 7)); };
  const d = byDate[day] || { events: [], questions: 0 };

  return (
    <div className="grid-main" style={{ gridTemplateColumns: 'minmax(0,1.7fr) minmax(0,1fr)' }}>
      <div className="card">
        <div className="cal-head"><button className="btn sm ghost" aria-label="Previous month" onClick={() => shift(-1)}>‹</button><h3 style={{ minWidth: 160, textAlign: 'center' }}>{label}</h3>
          <button className="btn sm ghost" aria-label="Next month" onClick={() => shift(1)}>›</button><button className="btn sm ghost" onClick={() => { setMonth(T.slice(0, 7)); setSel(T); }}>Today</button>
          <div className="legend" style={{ marginLeft: 'auto' }}>{LEGEND.map(([k, l]) => <span key={k}><i className={`ev-${k}`} />{l}</span>)}</div></div>
        <div className="cal">{DOW.map((x) => <div key={x} className="dow">{x}</div>)}
          {cells.map((k) => { const dd = byDate[k]; const evs: any[] = dd ? dd.events : [];
            return (
              <button key={k} className={`cal-day ${k.slice(0, 7) !== month ? 'out' : ''} ${k === T ? 'today' : ''} ${k === day ? 'sel' : ''}`} onClick={() => setSel(k)} aria-label={k}>
                <span className="num">{Number(k.slice(8))}{dd?.questions ? <i>✏️{dd.questions}</i> : null}</span>
                <span className="evs">{evs.slice(0, 3).map((e, i) => <span key={i} className={`chip-ev ev-${e.kind} ${e.state ? 'state-' + e.state : ''}`} title={e.title}>{e.title}</span>)}
                  {evs.length > 3 && <span className="tiny faint">+{evs.length - 3}</span>}</span>
              </button>); })}
        </div>
      </div>
      <div className="card day-panel">
        <div className="card-head"><h3>{new Date(day + 'T00:00:00Z').toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'UTC' })}</h3>
          <button className="btn sm ghost" onClick={() => onAddTask(day)}>+ Task</button></div>
        {d.questions ? <div className="small muted" style={{ marginBottom: 8 }}>✏️ {d.questions} questions answered</div> : null}
        {d.events.length ? d.events.map((e: any, i: number) => (
          <div key={i} className="ev"><span className="dot" style={{ background: e.color || DOT[e.kind] || '#94a3b8' }} />
            <div className="grow"><b className="small">{e.title}</b>{e.detail && <div className="small muted">{e.detail}</div>}</div>
            {e.kind === 'review' && day <= T && <button className="btn sm soft" onClick={() => startReview({})}>Review</button>}
            {e.kind === 'plan' && e.styleId && <button className="btn sm soft" onClick={() => startLesson(e.styleId)}>Start</button>}
            {e.kind === 'plan' && e.examId && <button className="btn sm soft" onClick={() => startExam(e.examId, e.title, String(e.examId).startsWith('topic:') ? 15 : 12, 25)}>Start</button>}
            {e.kind === 'task' && <span className={`pill ${e.state === 'done' ? 'good' : e.state === 'missed' ? 'bad' : e.state === 'waiting' ? 'warn' : ''}`}>{e.state}</span>}
            {e.kind === 'exam-done' && <Link className="btn sm ghost" to={`/app/exam/${e.ref}`}>View</Link>}
          </div>))
          : <div className="empty small"><div className="e">🌤️</div>Nothing planned.</div>}
      </div>
    </div>
  );
}

// ---------- board ----------
const COLS: [string, string][] = [['todo', '📋 To do'], ['doing', '⚙️ In progress'], ['waiting', '⏳ Waiting approval'], ['done', '✅ Done']];
const REC: Record<string, string> = { none: '', daily: '🔁 daily', weekdays: '🔁 weekdays', weekly: '🔁 weekly' };
const colOf = (t: any) => (t.recurrence !== 'none' ? (t.state === 'done' ? 'done' : t.state === 'waiting' ? 'waiting' : 'todo') : t.state === 'missed' ? 'todo' : t.state);

function Board({ child: c, onEdit }: { child: any; onEdit: (t: any) => void }) {
  const s = useSession(); const qc = useQueryClient();
  const { toast, confirm, celebrate } = useOverlay();
  const { startLesson, startReview } = useLearningActions();
  const isParent = s.me!.user.role !== 'student';
  const q = useQuery({ queryKey: ['tasks', c.id], queryFn: () => api.tasks.list(c.id) });
  if (q.isLoading) return <Spinner />;
  if (q.error) return <ErrorBox error={q.error} />;
  const tasks: any[] = q.data.tasks;
  const redraw = () => { qc.invalidateQueries({ queryKey: ['tasks', c.id] }); qc.invalidateQueries({ queryKey: ['calendar', c.id] }); qc.invalidateQueries({ queryKey: ['approvals'] }); };
  const run = async (fn: () => Promise<unknown>) => { try { await fn(); } catch (e) { toast((e as Error).message, 'bad'); } };

  const doing = (t: any) => run(async () => { await api.tasks.update(c.id, t.id, { status: 'doing' }); redraw(); });
  const done = (t: any) => run(async () => {
    const r = await api.tasks.complete(c.id, t.id, t.date);
    if (r.waiting) toast('Sent to your parent for approval ⏳'); else { confetti(40); celebrate(r.rewards); }
    await s.refresh(); redraw();
  });
  const approve = (t: any, reject: boolean) => run(async () => { await api.tasks.approve(c.id, t.id, { date: t.date, reject }); toast(reject ? 'Sent back' : 'Approved — coins sent', reject ? '' : 'good'); redraw(); });
  const del = (t: any) => run(async () => {
    if (!(await confirm('Delete task?', 'This removes the task and its history.', { ok: 'Delete', danger: true }))) return;
    await api.tasks.remove(c.id, t.id); redraw();
  });

  const card = (t: any) => (
    <div key={t.id + t.date} className={`task p-${t.priority}`}>
      <div className="row spread"><span className="t">{t.title}</span>{t.coins ? <span className="pill"><Coin n={t.coins} /></span> : null}</div>
      {t.notes && <div className="small muted" style={{ marginTop: 4 }}>{t.notes}</div>}
      <div className="meta"><span>{t.state === 'missed' ? '⚠️ overdue · ' : ''}📅 {fmtDate(t.date)}{t.dueTime ? ' ' + t.dueTime : ''}</span>
        {REC[t.recurrence] && <span>{REC[t.recurrence]}</span>}
        {t.subjectName && <span>{t.icon} {t.subjectName}</span>}
        {t.refName && <span>🔗 {t.refName}</span>}
        {t.kind !== 'custom' ? <span>✨ auto-completes</span> : t.requiresApproval ? <span>👍 needs approval</span> : null}
        <span>by {t.createdByRole === 'student' ? (isParent ? c.name : 'me') : 'parent'}</span></div>
      <div className="acts">
        {t.state !== 'done' && t.state !== 'waiting' && t.recurrence === 'none' && t.state !== 'doing' && <button className="btn sm ghost" onClick={() => doing(t)}>Start</button>}
        {t.kind === 'lesson' && t.ref && t.state !== 'done' && <button className="btn sm soft" onClick={() => startLesson(t.ref)}>Open lesson</button>}
        {t.kind === 'review' && t.state !== 'done' && <button className="btn sm soft" onClick={() => startReview({})}>Start review</button>}
        {(t.kind === 'custom' || isParent) && t.state !== 'done' && t.state !== 'waiting' && <button className="btn sm good" onClick={() => done(t)}>✓ Done</button>}
        {isParent && t.state === 'waiting' && <><button className="btn sm good" onClick={() => approve(t, false)}>Approve</button><button className="btn sm ghost" onClick={() => approve(t, true)}>Send back</button></>}
        {(isParent || t.createdByRole === 'student') && <><button className="btn sm ghost" onClick={() => onEdit(t)}>Edit</button>
          <button className="btn sm ghost" style={{ color: 'var(--bad)' }} aria-label={`Delete ${t.title}`} onClick={() => del(t)}>✕</button></>}
      </div>
    </div>
  );

  return (
    <div className="board">{COLS.map(([k, l]) => { const list = tasks.filter((t) => colOf(t) === k);
      return <div key={k} className="col"><h4><span>{l}</span><span>{list.length}</span></h4>{list.length ? list.map(card) : <div className="small faint" style={{ padding: 8 }}>Nothing here</div>}</div>; })}</div>
  );
}
