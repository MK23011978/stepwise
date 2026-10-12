// Add / edit a planner task (v1 taskForm). Lesson/topic options come from the curriculum.
import { useMemo, useState, type FormEvent } from 'react';
import { api } from '../../lib/api';
import { useSession } from '../../state/session';
import { useOverlay } from '../../ui/overlays';
import { todayStr } from '../../lib/format';
/* eslint-disable @typescript-eslint/no-explicit-any */

const KINDS: [string, string][] = [['custom', '✍️ Custom task'], ['lesson', '📘 Lesson in the app'], ['topic', '📖 Any lesson in a topic'], ['review', '🔁 Review session'], ['test', '📝 Topic test']];
const RECUR: [string, string][] = [['none', 'Once'], ['daily', 'Every day'], ['weekdays', 'Weekdays (Mon–Fri)'], ['weekly', 'Every week']];
const REF_KINDS = ['lesson', 'topic', 'test'];

export function TaskForm({ child: c, existing, close, onDone }: { child: any; existing: any; close: () => void; onDone: () => void }) {
  const s = useSession(); const { toast } = useOverlay();
  const isParent = s.me!.user.role !== 'student';
  const editing = !!existing?.id;
  const init = { title: '', notes: '', dueDate: todayStr(), dueTime: '', recurrence: 'none', priority: 'normal', kind: 'custom', subject: '', ref: '', coins: 0, requiresApproval: true, ...(existing || {}) };
  if (existing?.id && !existing.dueDate && existing.date) init.dueDate = existing.date;
  const [f, setF] = useState({ ...init, subject: init.subject || '', ref: init.ref || '', dueTime: init.dueTime || '', notes: init.notes || '', coins: String(init.coins || 0) });
  const [err, setErr] = useState('');
  const set = (k: string, v: unknown) => setF((x: any) => ({ ...x, [k]: v }));
  const subs = s.enrolled(c);

  const opts = useMemo(() => {
    const topics = (s.cur?.topics || []).filter((x: any) => (!f.subject || x.subject === f.subject) && x.year <= c.yearGroup && (f.subject || x.subject === s.subject?.id));
    const list: [string, string][] = f.kind === 'lesson' ? topics.flatMap((x: any) => x.styles.map((st: any) => [st.id, `${x.name} — ${st.name}`] as [string, string])) : topics.map((x: any) => [x.id, `Y${x.year} · ${x.name}`] as [string, string]);
    return list.slice(-400);
  }, [f.kind, f.subject, s.cur, s.subject, c.yearGroup]);
  const showRef = REF_KINDS.includes(f.kind);
  const refValue = showRef ? (opts.some(([id]) => id === f.ref) ? f.ref : f.kind === 'lesson' ? '' : opts[0]?.[0] || '') : '';

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const b: any = { title: f.title, notes: f.notes, kind: f.kind, subject: f.subject || null, ref: refValue || null, dueDate: f.dueDate || undefined, dueTime: f.dueTime || '', recurrence: f.recurrence, priority: f.priority };
    if (isParent) { b.coins = Number(f.coins) || 0; b.requiresApproval = !!f.requiresApproval; }
    try {
      if (editing) await api.tasks.update(c.id, existing.id, b); else await api.tasks.create(c.id, b);
      close(); toast(editing ? 'Task saved' : 'Task added 📌', 'good'); onDone();
    } catch (x) { setErr((x as Error).message); }
  };

  return (
    <><h2>{editing ? 'Edit task' : 'New task'}{isParent ? ` for ${c.name}` : ''}</h2>
      <p className="muted">{isParent ? 'Tasks linked to app work complete themselves. Custom tasks (homework, reading, revision) can need your approval before coins are paid.' : 'Plan your own study — homework, revision, reading.'}</p>
      <form className="stack" style={{ marginTop: 14 }} onSubmit={submit}>
        <label className="field"><span>Title</span><input className="input" maxLength={120} value={f.title} onChange={(e) => set('title', e.target.value)} placeholder="e.g. Science homework p.42, Revise Macbeth Act 1" required /></label>
        <div className="grid2"><label className="field"><span>Type</span><select className="input" value={f.kind} onChange={(e) => set('kind', e.target.value)}>{KINDS.map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select></label>
          <label className="field"><span>Subject</span><select className="input" value={f.subject} onChange={(e) => set('subject', e.target.value)}><option value="">— any —</option>{subs.map((x: any) => <option key={x.id} value={x.id}>{x.icon} {x.name}</option>)}</select></label></div>
        {showRef && <label className="field"><span>{f.kind === 'lesson' ? 'Lesson (question style)' : 'Topic'}</span>
          <select className="input" value={refValue} onChange={(e) => set('ref', e.target.value)}>{f.kind === 'lesson' && <option value="">— any lesson in this subject —</option>}
            {opts.map(([id, l]) => <option key={id} value={id}>{l}</option>)}</select></label>}
        <div className="grid2"><label className="field"><span>Date</span><input className="input" type="date" value={f.dueDate} onChange={(e) => set('dueDate', e.target.value)} /></label>
          <label className="field"><span>Time (optional)</span><input className="input" type="time" value={f.dueTime} onChange={(e) => set('dueTime', e.target.value)} /></label></div>
        <div className="grid2"><label className="field"><span>Repeat</span><select className="input" value={f.recurrence} onChange={(e) => set('recurrence', e.target.value)}>{RECUR.map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select></label>
          <label className="field"><span>Priority</span><select className="input" value={f.priority} onChange={(e) => set('priority', e.target.value)}>{['high', 'normal', 'low'].map((k) => <option key={k}>{k}</option>)}</select></label></div>
        <label className="field"><span>Notes</span><input className="input" maxLength={500} value={f.notes} onChange={(e) => set('notes', e.target.value)} /></label>
        {isParent && <div className="grid2"><label className="field"><span>Coin reward</span><input className="input" type="number" min={0} max={500} value={f.coins} onChange={(e) => set('coins', e.target.value)} /></label>
          <label className="row small" style={{ marginTop: 26 }}><input type="checkbox" checked={!!f.requiresApproval} onChange={(e) => set('requiresApproval', e.target.checked)} /> I approve it before coins are paid (custom tasks)</label></div>}
        <div className="error">{err}</div>
        <div className="row" style={{ justifyContent: 'flex-end' }}><button type="button" className="btn ghost" onClick={close}>Cancel</button><button className="btn">{editing ? 'Save' : 'Add task'}</button></div>
      </form></>
  );
}
