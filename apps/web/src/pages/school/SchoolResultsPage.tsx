// School results: a table the student (or parent) fills in with marks from school tests, with trends and a Stepwise comparison.
import { useState, type FormEvent } from 'react';
import { Link } from 'react-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { useSession } from '../../state/session';
import { useOverlay } from '../../ui/overlays';
import { StudentGate } from '../../features/StudentGate';
import { Empty, ErrorBox, Spinner } from '../../ui/bits';
import { LineChart } from '../../ui/charts';
import { fmtDate, todayStr } from '../../lib/format';
/* eslint-disable @typescript-eslint/no-explicit-any */

export default function SchoolResultsPage() {
  return <StudentGate title="School Results">{(c) => <SchoolResults child={c} />}</StudentGate>;
}

const tone = (p: number) => (p >= 70 ? 'good' : p >= 50 ? 'warn' : 'bad');

function SchoolResults({ child: c }: { child: any }) {
  const s = useSession(); const qc = useQueryClient(); const { openModal, confirm, toast } = useOverlay();
  const q = useQuery({ queryKey: ['school-results', c.id], queryFn: () => api.schoolResults.list(c.id) });
  const [filter, setFilter] = useState('all');
  const isStudent = s.me!.user.role === 'student';
  if (q.isLoading) return <Spinner />;
  if (q.error) return <ErrorBox error={q.error} />;
  const D = q.data; const reload = () => qc.invalidateQueries({ queryKey: ['school-results', c.id] });
  const open = (existing?: any) => openModal((close) => <ResultForm child={c} units={D.units} existing={existing} close={close} onDone={reload} />, { wide: true });
  const remove = async (r: any) => { if (await confirm('Delete this result?', `${r.title} · ${r.score}/${r.maxScore}`, { ok: 'Delete', danger: true })) { await api.schoolResults.remove(c.id, r.id).catch((e) => toast(e.message, 'bad')); reload(); } };
  const rows = D.results.filter((r: any) => filter === 'all' || r.subject === filter);
  const points = [...rows].reverse().map((r: any) => ({ label: new Date(r.takenOn).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }), title: `${r.subjectName}: ${r.title}`, value: Math.round(r.pct), tag: r.grade || null }));

  return (
    <>
      <div className="page-head row spread wrap"><div><h1>🏫 School results</h1><p>{isStudent ? 'Add your marks from school tests and see how they change over time.' : `Marks from ${c.name}’s school tests, next to their Stepwise results.`}</p></div>
        <button className="btn" onClick={() => open()}>+ Add a result</button></div>

      {!D.results.length ? <div className="card empty"><div className="e">📝</div><h3 style={{ marginBottom: 6 }}>No school results yet</h3>
        <p className="muted" style={{ maxWidth: 460, margin: '0 auto 16px' }}>When you get a test back at school, add the mark here: the test name, your score, what it was out of and the grade if your teacher gave one.</p>
        <button className="btn" onClick={() => open()}>+ Add your first result</button></div> : <>
        <div className="grid-3" style={{ marginBottom: 22 }}>{D.subjects.map((x: any) => <div key={x.subject} className="card">
          <div className="row spread"><b>{x.icon} {x.name}</b><span className="small muted">{x.count} test{x.count === 1 ? '' : 's'}</span></div>
          <div className="row" style={{ alignItems: 'baseline', gap: 10, margin: '10px 0 4px' }}><span style={{ fontSize: 30, fontWeight: 800 }}>{Math.round(x.latestPct)}%</span>
            {x.latestGrade && <span className="pill brand">Grade {x.latestGrade}</span>}
            {x.trend != null && <span className={`pill ${x.trend >= 0 ? 'good' : 'bad'}`}>{x.trend >= 0 ? '▲' : '▼'} {Math.abs(x.trend)}%</span>}</div>
          <div className="small muted">Latest school test · average {Math.round(x.averagePct)}%</div>
          <div className="small" style={{ marginTop: 8 }}>{x.stepwisePct != null ? <>Stepwise tests (last 4 months): <b>{x.stepwisePct}%</b></> : <Link to="/app/exams">Take a Stepwise test to compare →</Link>}</div>
        </div>)}</div>

        <div className="card" style={{ marginBottom: 22 }}><div className="card-head row spread wrap"><h3>📈 Trend</h3>
          {D.subjects.length > 1 && <select className="input" style={{ width: 'auto' }} value={filter} onChange={(e) => setFilter(e.target.value)} aria-label="Subject"><option value="all">All subjects</option>{D.subjects.map((x: any) => <option key={x.subject} value={x.subject}>{x.name}</option>)}</select>}</div>
          <LineChart points={points} /></div>

        <div className="card"><div className="card-head"><h3>All results</h3></div>
          <div className="table-wrap"><table className="data">
            <thead><tr><th>Date</th><th>Subject</th><th>Test</th><th>Score</th><th>%</th><th>Grade</th><th>Target</th><th /></tr></thead>
            <tbody>{rows.map((r: any) => <tr key={r.id}>
              <td className="nowrap">{fmtDate(r.takenOn)}</td><td>{r.subjectName}</td>
              <td><b>{r.title}</b>{r.unitName && <div className="small muted">{r.unitName}</div>}{r.notes && <div className="small muted">“{r.notes}”</div>}</td>
              <td className="nowrap">{r.score} / {r.maxScore}</td><td><span className={`pill ${tone(r.pct)}`}>{Math.round(r.pct)}%</span></td>
              <td>{r.grade || '–'}</td><td>{r.targetGrade || '–'}</td>
              <td className="nowrap"><button className="btn sm ghost" onClick={() => open(r)}>Edit</button> <button className="btn sm ghost" onClick={() => remove(r)} aria-label="Delete">🗑</button></td></tr>)}</tbody>
          </table></div></div>
      </>}
    </>
  );
}

function ResultForm({ child, units, existing, close, onDone }: { child: any; units: any[]; existing?: any; close: () => void; onDone: () => void }) {
  const s = useSession(); const { toast } = useOverlay();
  const subjects = s.enrolled(child);
  const [f, setF] = useState({ subject: existing?.subject || 'maths', title: existing?.title || '', unit: existing?.unit || '', takenOn: existing?.takenOn || todayStr(),
    score: existing ? String(existing.score) : '', maxScore: existing ? String(existing.maxScore) : '', grade: existing?.grade || '', targetGrade: existing?.targetGrade || '', notes: existing?.notes || '' });
  const [busy, setBusy] = useState(false);
  const set = (k: string) => (e: any) => setF((x) => ({ ...x, [k]: e.target.value }));
  const subjUnits = units.filter((u) => u.subject === f.subject && child.yearGroup === u.year);
  const pct = Number(f.score) >= 0 && Number(f.maxScore) > 0 && f.score !== '' ? Math.round((Number(f.score) / Number(f.maxScore)) * 100) : null;
  const submit = async (e: FormEvent) => {
    e.preventDefault(); setBusy(true);
    const body = { ...f, score: Number(f.score), maxScore: Number(f.maxScore), unit: f.unit || null, grade: f.grade || null, targetGrade: f.targetGrade || null, notes: f.notes || null };
    try { if (existing) await api.schoolResults.update(child.id, existing.id, body); else await api.schoolResults.add(child.id, body); toast(existing ? 'Saved' : 'Result added 🎉', 'good'); onDone(); close(); }
    catch (err) { toast((err as Error).message, 'bad'); } finally { setBusy(false); }
  };
  return (
    <form onSubmit={submit}><h2>{existing ? 'Edit result' : 'Add a school result'}</h2>
      <div className="grid-2" style={{ margin: '16px 0', gap: 14 }}>
        <label className="field"><span>Subject</span><select className="input" value={f.subject} onChange={(e) => setF((x) => ({ ...x, subject: e.target.value, unit: '' }))}>{subjects.map((x) => <option key={x.id} value={x.id}>{x.icon} {x.name}</option>)}</select></label>
        <label className="field"><span>Date of the test</span><input className="input" type="date" value={f.takenOn} max={todayStr()} onChange={set('takenOn')} required /></label>
        <label className="field" style={{ gridColumn: '1 / -1' }}><span>Test name</span><input className="input" value={f.title} onChange={set('title')} placeholder="e.g. Autumn assessment, Unit 3 test" required maxLength={120} /></label>
        {subjUnits.length > 0 && <label className="field" style={{ gridColumn: '1 / -1' }}><span>School unit (optional)</span><select className="input" value={f.unit} onChange={set('unit')}><option value="">—</option>{subjUnits.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}</select></label>}
        <label className="field"><span>Your score</span><input className="input" type="number" inputMode="decimal" min={0} step="0.5" value={f.score} onChange={set('score')} required /></label>
        <label className="field"><span>Out of</span><input className="input" type="number" inputMode="decimal" min={1} step="0.5" value={f.maxScore} onChange={set('maxScore')} required /></label>
        <label className="field"><span>Grade (optional)</span><input className="input" value={f.grade} onChange={set('grade')} placeholder="e.g. 6, 5+, B" maxLength={20} /></label>
        <label className="field"><span>Target grade (optional)</span><input className="input" value={f.targetGrade} onChange={set('targetGrade')} placeholder="e.g. 7" maxLength={20} /></label>
        <label className="field" style={{ gridColumn: '1 / -1' }}><span>Notes (optional)</span><input className="input" value={f.notes} onChange={set('notes')} placeholder="e.g. lost marks on ratio questions" maxLength={500} /></label>
      </div>
      <div className="row spread"><span className="muted">{pct != null && `That’s ${pct}%`}</span>
        <div className="row"><button type="button" className="btn ghost" onClick={close}>Cancel</button><button className="btn" disabled={busy}>{existing ? 'Save' : 'Add result'}</button></div></div>
    </form>
  );
}
