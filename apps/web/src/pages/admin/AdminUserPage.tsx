// Admin user detail (v1 #/admin/users/:id): status, role, free access, credits, coins, student edit, password, delete.
import { useState, type FormEvent } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { useSession } from '../../state/session';
import { useOverlay } from '../../ui/overlays';
import { AppShell } from '../../layout/AppShell';
import { Bars } from '../../ui/charts';
import { Avatar, ErrorBox, Spinner } from '../../ui/bits';
import { fmtDate, fmtDateTime } from '../../lib/format';
import { FreeBadge, RoleBadge, StatusBadge } from './badges';
/* eslint-disable @typescript-eslint/no-explicit-any */

export default function AdminUserPage() {
  return <AppShell title="User detail" admin><UserDetail /></AppShell>;
}

const ModalActions = ({ close, ok }: { close: () => void; ok: string }) => (
  <div className="row" style={{ justifyContent: 'flex-end' }}><button type="button" className="btn ghost" onClick={close}>Cancel</button><button className="btn">{ok}</button></div>
);

function UserDetail() {
  const { id = '' } = useParams(); const navigate = useNavigate(); const qc = useQueryClient();
  const s = useSession(); const { openModal, confirm, toast } = useOverlay();
  const q = useQuery({ queryKey: ['admin', 'user', id], queryFn: () => api.admin.user(id) });
  if (q.isLoading) return <Spinner />;
  if (q.error) return <ErrorBox error={q.error} />;
  const d = q.data; const u = d.user;
  const isSelf = u.id === s.me!.user.id;
  const viaParent = u.role === 'student' && d.parent?.freeAccess;
  const reload = () => { qc.invalidateQueries({ queryKey: ['admin'] }); };
  const patch = async (body: any, msg: string) => { try { await api.admin.patchUser(id, body); toast(msg, 'good'); reload(); } catch (e) { toast((e as Error).message, 'bad'); } };

  const toggleStatus = async () => {
    const active = u.status === 'active';
    if (await confirm(active ? 'Suspend user?' : 'Reactivate user?', active ? 'They will be signed out and unable to log in.' : 'They will be able to sign in again.')) patch({ status: active ? 'suspended' : 'active' }, 'Status updated');
  };
  const switchRole = async () => {
    const r = u.role === 'admin' ? 'parent' : 'admin';
    if (await confirm(`Change role to ${r}?`, r === 'admin' ? 'Admins have full access to all users, payments and settings.' : 'They will lose admin access.')) patch({ role: r }, 'Role updated');
  };
  const del = async () => {
    if (!(await confirm(`Delete ${u.name}?`, u.role === 'parent' ? 'This permanently deletes the parent, all their children and all progress.' : 'This permanently deletes this account and its data.', { ok: 'Delete', danger: true }))) return;
    try { await api.admin.deleteUser(id); toast('User deleted'); qc.invalidateQueries({ queryKey: ['admin'] }); navigate('/admin/users'); } catch (e) { toast((e as Error).message, 'bad'); }
  };
  const credits = () => openModal((close) => <CreditsForm current={u.credits || 0} close={close} onApply={(b) => { close(); patch(b, 'Credits updated'); }} />);
  const coins = () => openModal((close) => <CoinsForm close={close} onApply={(n) => { close(); patch({ coinDelta: n }, 'Coins updated'); }} />);
  const editStudent = () => openModal((close) => <StudentForm u={u} years={s.cur?.years || [7, 8, 9, 10, 11]} close={close} onApply={(b) => { close(); patch(b, 'Student updated'); }} />);
  const resetPwd = () => openModal((close) => <PasswordForm name={u.name} close={close} onApply={async (pw) => { await api.admin.resetPassword(id, pw); close(); toast('Password reset', 'good'); }} />);

  return (
    <>
      <Link to="/admin/users" className="small">← All users</Link>
      <div className="card pad-lg" style={{ margin: '14px 0 22px' }}>
        <div className="row wrap spread">
          <div className="row"><Avatar u={u} size="lg" /><div><h1 style={{ fontSize: 26 }}>{u.name}</h1><div className="muted">{u.email || '@' + u.username} · joined {fmtDate(u.createdAt)}</div>
            <div className="row wrap" style={{ marginTop: 8 }}><RoleBadge r={u.role} /><StatusBadge s={u.status} />{u.freeAccess && <FreeBadge />}{viaParent && <span className="pill">free access via parent</span>}
              {u.role === 'parent' && <><span className="pill">{u.credits || 0} credits</span>{!u.freeLessonUsed && <span className="pill good">free lesson unused</span>}{u.cardVerified && <span className="pill">💳 {u.cardBrand || ''} {u.cardLast4 || ''}</span>}</>}
              {u.role === 'student' && <><span className="pill">Year {u.yearGroup} · {u.tier}</span><span className="pill">🪙 {u.coins || 0}</span></>}</div></div></div>
          <div className="row wrap">
            {!isSelf && <button className={`btn sm ${u.status === 'active' ? 'ghost' : 'good'}`} onClick={toggleStatus}>{u.status === 'active' ? 'Suspend' : 'Reactivate'}</button>}
            {u.role !== 'student' && !isSelf && <button className="btn sm ghost" onClick={switchRole}>Make {u.role === 'admin' ? 'parent' : 'admin'}</button>}
            {u.role === 'parent' && <button className="btn sm ghost" onClick={credits}>Adjust credits</button>}
            {u.role === 'student' && <><Link className="btn sm" to={`/app/report/${u.id}`}>📄 Report & plan</Link><button className="btn sm ghost" onClick={editStudent}>Edit student</button><button className="btn sm ghost" onClick={coins}>Gift coins</button></>}
            <button className="btn sm ghost" onClick={resetPwd}>Reset password</button>
            {!isSelf && <button className="btn sm danger" onClick={del}>Delete</button>}
          </div>
        </div>
        {u.role !== 'admin' && <div className="card" style={{ boxShadow: 'none', background: 'var(--panel-2)', border: 0, marginTop: 18 }}><div className="row wrap spread">
          <div><b>✨ Free access</b><div className="small muted">{u.role === 'parent' ? 'Every child in this family can take lessons, topic tests and exams without using credits.' : 'This student can take lessons and tests without using the family’s credits.'}</div></div>
          <label className="row" style={{ cursor: 'pointer' }}><input type="checkbox" checked={!!u.freeAccess} style={{ width: 20, height: 20 }} onChange={(e) => patch({ freeAccess: e.target.checked }, e.target.checked ? 'Free access turned on ✨' : 'Free access turned off')} /> <b>{u.freeAccess ? 'On' : 'Off'}</b></label>
        </div></div>}
      </div>

      {u.role === 'student' && d.summary && <>
        <div className="kpis">
          <div className="card kpi"><div className="v">{d.summary.correct}</div><div className="l">Correct answers</div></div>
          <div className="card kpi"><div className="v">{d.summary.accuracy ?? '–'}%</div><div className="l">Accuracy</div></div>
          <div className="card kpi"><div className="v">{d.summary.lessonsCompleted}</div><div className="l">Lessons completed</div></div>
          <div className="card kpi"><div className="v">Lv {d.summary.level.level}</div><div className="l">{d.summary.level.xp} XP · {d.summary.certificates} certificates</div></div>
        </div>
        <div className="card"><div className="card-head"><h3>By subject</h3></div><Bars items={d.summary.strands.map((x: any) => ({ name: `${x.icon} ${x.name}`, value: x.accuracy, color: x.color }))} /></div>
      </>}

      {u.role === 'parent' && <div className="grid-main">
        <div className="card"><div className="card-head"><h3>Children</h3></div>
          {d.children.length ? <div className="table-wrap"><table className="data"><thead><tr><th>Name</th><th>Year</th><th>Lessons</th><th>Access</th><th></th></tr></thead><tbody>
            {d.children.map((c: any) => <tr key={c.id}><td><div className="row"><Avatar u={c} /><b>{c.name}</b></div></td><td>Y{c.yearGroup} {c.tier}</td><td>{c.summary?.lessonsCompleted ?? 0}</td>
              <td>{c.freeAccess || u.freeAccess ? <FreeBadge /> : '£1'}</td><td><Link className="btn sm ghost" to={`/admin/users/${c.id}`}>Open</Link></td></tr>)}</tbody></table></div>
            : <div className="empty small">No children</div>}</div>
        <div className="card"><div className="card-head"><h3>Payments &amp; credits</h3></div>
          {d.ledger.length ? <div className="table-wrap"><table className="data"><tbody>{d.ledger.map((l: any, i: number) => <tr key={l.id || i}><td className="small muted">{fmtDateTime(l.at)}</td><td className="small">{l.reason}</td><td><b>{l.delta > 0 ? '+' : ''}{l.delta}</b></td></tr>)}</tbody></table></div>
            : <div className="empty small">No activity</div>}</div>
      </div>}

      {u.role === 'student' && u.parentId && <div className="card" style={{ marginTop: 22 }}><div className="card-head"><h3>Parent</h3></div><Link to={`/admin/users/${u.parentId}`} className="btn sm ghost">Open parent account</Link></div>}
    </>
  );
}

function CreditsForm({ current, close, onApply }: { current: number; close: () => void; onApply: (b: any) => void }) {
  const [delta, setDelta] = useState(''); const [reason, setReason] = useState(''); const [reset, setReset] = useState(false);
  const submit = (e: FormEvent) => { e.preventDefault(); const b: any = { reason, resetFreeLesson: reset }; if (Number(delta) !== 0) b.creditDelta = Number(delta); onApply(b); };
  return (
    <><h2>Adjust credits</h2><p className="muted">Current balance: {current}. Use a negative number to remove credits.</p>
      <form className="stack" style={{ marginTop: 14 }} onSubmit={submit}>
        <label className="field"><span>Change</span><input className="input" type="number" step={1} value={delta} onChange={(e) => setDelta(e.target.value)} required /></label>
        <label className="field"><span>Reason</span><input className="input" maxLength={120} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. Goodwill, refund" /></label>
        <label className="row small"><input type="checkbox" checked={reset} onChange={(e) => setReset(e.target.checked)} /> Restore free trial lesson</label>
        <ModalActions close={close} ok="Apply" />
      </form></>
  );
}

function CoinsForm({ close, onApply }: { close: () => void; onApply: (n: number) => void }) {
  const [n, setN] = useState('100');
  return (
    <><h2>Gift coins</h2>
      <form className="stack" style={{ marginTop: 14 }} onSubmit={(e) => { e.preventDefault(); onApply(Number(n)); }}>
        <label className="field"><span>Coins (negative to remove)</span><input className="input" type="number" value={n} onChange={(e) => setN(e.target.value)} required /></label>
        <ModalActions close={close} ok="Apply" />
      </form></>
  );
}

function StudentForm({ u, years, close, onApply }: { u: any; years: number[]; close: () => void; onApply: (b: any) => void }) {
  const [f, setF] = useState({ name: u.name || '', yearGroup: String(u.yearGroup || years[0]), tier: u.tier || 'H', targetGrade: String(u.targetGrade || 7), username: u.username || '' });
  const set = (k: string, v: string) => setF((x) => ({ ...x, [k]: v }));
  const submit = (e: FormEvent) => {
    e.preventDefault();
    const b: any = { name: f.name, yearGroup: Number(f.yearGroup), tier: f.tier, targetGrade: Number(f.targetGrade) };
    if (f.username) b.username = f.username;
    onApply(b);
  };
  return (
    <><h2>Edit student</h2>
      <form className="stack" style={{ marginTop: 14 }} onSubmit={submit}>
        <label className="field"><span>Name</span><input className="input" value={f.name} onChange={(e) => set('name', e.target.value)} /></label>
        <div className="grid2"><label className="field"><span>Year</span><select className="input" value={f.yearGroup} onChange={(e) => set('yearGroup', e.target.value)}>{years.map((y) => <option key={y} value={y}>{y}</option>)}</select></label>
          <label className="field"><span>Tier</span><select className="input" value={f.tier} onChange={(e) => set('tier', e.target.value)}><option value="H">Higher</option><option value="F">Foundation</option></select></label></div>
        <div className="grid2"><label className="field"><span>Target grade</span><input className="input" type="number" min={1} max={9} value={f.targetGrade} onChange={(e) => set('targetGrade', e.target.value)} /></label>
          <label className="field"><span>Username</span><input className="input" value={f.username} onChange={(e) => set('username', e.target.value)} /></label></div>
        <ModalActions close={close} ok="Save" />
      </form></>
  );
}

function PasswordForm({ name, close, onApply }: { name: string; close: () => void; onApply: (pw: string) => Promise<void> }) {
  const [pw, setPw] = useState(''); const [err, setErr] = useState('');
  return (
    <><h2>Reset password</h2><p className="muted">Set a new temporary password for {name}. They will be signed out everywhere.</p>
      <form className="stack" style={{ marginTop: 14 }} onSubmit={async (e) => { e.preventDefault(); try { await onApply(pw); } catch (x) { setErr((x as Error).message); } }}>
        <label className="field"><span>New password</span><input className="input" type="password" minLength={8} autoComplete="new-password" value={pw} onChange={(e) => setPw(e.target.value)} required /></label>
        <div className="error">{err}</div>
        <ModalActions close={close} ok="Reset" />
      </form></>
  );
}
