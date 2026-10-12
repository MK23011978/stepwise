// Admin user management (v1 #/admin/users): search, role / free-access filter, status filter, table, create user.
import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { useOverlay } from '../../ui/overlays';
import { AppShell } from '../../layout/AppShell';
import { Avatar, ErrorBox, Spinner } from '../../ui/bits';
import { fmtDate, fmtDateTime, money } from '../../lib/format';
import { FreeBadge, RoleBadge, StatusBadge } from './badges';
/* eslint-disable @typescript-eslint/no-explicit-any */

const ROLES = ['all', 'parent', 'student', 'admin', 'free'];

export default function AdminUsersPage() {
  return <AppShell title="Users" admin><Users /></AppShell>;
}

function Users() {
  const navigate = useNavigate(); const { openModal } = useOverlay();
  const q = useQuery({ queryKey: ['admin', 'users'], queryFn: () => api.admin.users() });
  const [text, setText] = useState(''); const [role, setRole] = useState('all'); const [status, setStatus] = useState('all');
  if (q.isLoading) return <Spinner />;
  if (q.error) return <ErrorBox error={q.error} />;
  const users: any[] = q.data.users;
  const ql = text.toLowerCase();
  const list = users.filter((u) => (role === 'all' || (role === 'free' ? u.freeAccess || u.parentFree : u.role === role)) && (status === 'all' || u.status === status)
    && (!ql || [u.name, u.email, u.username, u.parentName].some((x) => x && String(x).toLowerCase().includes(ql))));
  const newUser = () => openModal((close) => <NewUserForm close={close} onCreated={(id) => navigate(`/admin/users/${id}`)} />);

  return (
    <>
      <div className="page-head row spread wrap"><div><h1>User management</h1><p>{users.length} accounts · {users.filter((u) => u.freeAccess).length} with free access</p></div><button className="btn" onClick={newUser}>+ New user</button></div>
      <div className="card">
        <div className="filters" style={{ marginBottom: 14 }}>
          <input className="input" aria-label="Search users" placeholder="Search name, email, username…" style={{ maxWidth: 300 }} value={text} onChange={(e) => setText(e.target.value)} />
          {ROLES.map((r) => <button key={r} className={`chip ${role === r ? 'on' : ''}`} onClick={() => setRole(r)}>{r === 'all' ? 'All roles' : r === 'free' ? '✨ free access' : r + 's'}</button>)}
          <select className="input" aria-label="Status" style={{ maxWidth: 160 }} value={status} onChange={(e) => setStatus(e.target.value)}><option value="all">Any status</option><option value="active">Active</option><option value="suspended">Suspended</option></select>
        </div>
        <div className="table-wrap"><table className="data"><thead><tr><th>User</th><th>Role</th><th>Details</th><th>Access</th><th>Status</th><th>Joined</th><th>Last login</th></tr></thead><tbody>
          {list.length ? list.map((u) => (
            <tr key={u.id} className="click" tabIndex={0} onClick={() => navigate(`/admin/users/${u.id}`)} onKeyDown={(e) => { if (e.key === 'Enter') navigate(`/admin/users/${u.id}`); }}>
              <td><div className="row"><Avatar u={u} /><div><b>{u.name}</b><div className="small muted">{u.email || '@' + u.username}</div></div></div></td>
              <td><RoleBadge r={u.role} /></td>
              <td className="small">{u.role === 'parent' ? `${u.childCount} child${u.childCount === 1 ? '' : 'ren'} · ${u.credits || 0} credits · ${money(u.spent)} spent` : u.role === 'student' ? `Y${u.yearGroup} ${u.tier} · ${u.lessons} lessons · parent: ${u.parentName || '–'}` : '—'}</td>
              <td>{u.freeAccess ? <FreeBadge /> : u.parentFree ? <span className="pill">via parent ✨</span> : u.role === 'admin' ? '—' : <span className="pill">£1 / lesson</span>}</td>
              <td><StatusBadge s={u.status} /></td><td className="small muted">{fmtDate(u.createdAt)}</td><td className="small muted">{u.lastLoginAt ? fmtDateTime(u.lastLoginAt) : '—'}</td>
            </tr>)) : <tr><td colSpan={7} className="empty">No users match.</td></tr>}
        </tbody></table></div>
      </div>
    </>
  );
}

function NewUserForm({ close, onCreated }: { close: () => void; onCreated: (id: string) => void }) {
  const { toast } = useOverlay();
  const [f, setF] = useState({ name: '', role: 'parent', email: '', password: '', freeAccess: false });
  const [err, setErr] = useState('');
  const set = (k: string, v: unknown) => setF((x) => ({ ...x, [k]: v }));
  const submit = async (e: FormEvent) => {
    e.preventDefault();
    try { const r = await api.admin.createUser({ ...f, role: f.role as 'parent' | 'admin' }); close(); toast('User created', 'good'); onCreated(r.user.id); }
    catch (x) { setErr((x as Error).message); }
  };
  return (
    <><h2>Create user</h2>
      <form className="stack" style={{ marginTop: 16 }} onSubmit={submit}>
        <div className="grid2"><label className="field"><span>Name</span><input className="input" value={f.name} onChange={(e) => set('name', e.target.value)} required /></label>
          <label className="field"><span>Role</span><select className="input" value={f.role} onChange={(e) => set('role', e.target.value)}><option value="parent">Parent</option><option value="admin">Admin</option></select></label></div>
        <label className="field"><span>Email</span><input className="input" type="email" value={f.email} onChange={(e) => set('email', e.target.value)} required /></label>
        <label className="field"><span>Temporary password</span><input className="input" type="password" minLength={8} autoComplete="new-password" value={f.password} onChange={(e) => set('password', e.target.value)} required /></label>
        <label className="row small"><input type="checkbox" checked={f.freeAccess} onChange={(e) => set('freeAccess', e.target.checked)} /> ✨ Free access — this family’s lessons and tests don’t use credits</label>
        <div className="error">{err}</div>
        <div className="row" style={{ justifyContent: 'flex-end' }}><button type="button" className="btn ghost" onClick={close}>Cancel</button><button className="btn">Create</button></div>
      </form></>
  );
}
