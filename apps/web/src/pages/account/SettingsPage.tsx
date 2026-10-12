// Account settings (v1 `/app/settings`): name, password, children, delete account.
import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router';
import { api } from '../../lib/api';
import { useSession } from '../../state/session';
import { useOverlay } from '../../ui/overlays';
import { AppShell } from '../../layout/AppShell';
import { ChildForm } from '../../features/ChildForm';
import { Avatar } from '../../ui/bits';

export default function SettingsPage() {
  const s = useSession(); const me = s.me!.user;
  return <AppShell title="Settings" admin={me.role === 'admin'}><Settings /></AppShell>;
}

function Settings() {
  const s = useSession(); const me = s.me!.user; const navigate = useNavigate();
  const { toast, confirm, openModal } = useOverlay();
  const [name, setName] = useState<string>(me.name || '');
  const [pw, setPw] = useState({ currentPassword: '', newPassword: '' }); const [pwErr, setPwErr] = useState('');

  const saveName = async (e: FormEvent) => {
    e.preventDefault();
    try { await api.auth.updateMe({ name }); await s.refresh(); toast('Saved', 'good'); } catch (e2) { toast((e2 as Error).message, 'bad'); }
  };
  const savePw = async (e: FormEvent) => {
    e.preventDefault(); setPwErr('');
    try { await api.auth.updateMe(pw); setPw({ currentPassword: '', newPassword: '' }); toast('Password updated', 'good'); } catch (e2) { setPwErr((e2 as Error).message); }
  };
  const deleteAccount = async () => {
    if (!(await confirm('Delete your account?', 'All children, progress, exam results and remaining credits will be permanently removed.', { ok: 'Delete everything', danger: true }))) return;
    try { await api.auth.deleteMe(); await s.signOut(); navigate('/'); } catch (e) { toast((e as Error).message, 'bad'); }
  };

  return (
    <>
      <div className="page-head"><h1>Settings</h1></div>
      <div style={{ maxWidth: 720 }} className="stack">
        <div className="card"><div className="tiny muted" style={{ marginBottom: 12 }}>Your account</div>
          <form className="stack" onSubmit={saveName}><div className="grid2">
            <label className="field"><span>Name</span><input className="input" name="name" value={name} onChange={(e) => setName(e.target.value)} /></label>
            <label className="field"><span>{me.email ? 'Email' : 'Username'}</span><input className="input" value={me.email || me.username || ''} disabled /></label></div>
            <div><button className="btn">Save</button></div></form></div>

        <div className="card"><div className="tiny muted" style={{ marginBottom: 12 }}>Change password</div>
          <form className="stack" onSubmit={savePw}><div className="grid2">
            <label className="field"><span>Current password</span><input className="input" type="password" name="currentPassword" autoComplete="current-password" required value={pw.currentPassword} onChange={(e) => setPw((x) => ({ ...x, currentPassword: e.target.value }))} /></label>
            <label className="field"><span>New password</span><input className="input" type="password" name="newPassword" minLength={8} autoComplete="new-password" required value={pw.newPassword} onChange={(e) => setPw((x) => ({ ...x, newPassword: e.target.value }))} /></label></div>
            <div className="error" role="alert">{pwErr}</div><div><button className="btn">Update password</button></div></form></div>

        {me.role === 'parent' && <>
          <div className="card"><div className="tiny muted" style={{ marginBottom: 12 }}>Children</div>
            <p className="small muted" style={{ marginTop: 0 }}>Deleting a child removes their profile, progress and lesson history. Unused credits stay on your account.</p>
            {s.me!.children.map((c) => <div key={c.id} className="row spread" style={{ padding: '10px 0', borderTop: '1px solid var(--line)' }}>
              <div className="row"><Avatar u={c} /><div><b>{c.name}</b><div className="small muted">Year {c.yearGroup}</div></div></div>
              <button className="btn sm ghost" onClick={() => openModal((close) => <ChildForm existing={c} close={close} />, { wide: true })}>Manage</button></div>)}</div>
          <div className="card" style={{ borderColor: 'color-mix(in srgb,var(--bad) 40%,var(--line))' }}><div className="tiny" style={{ color: 'var(--bad)', marginBottom: 12 }}>Delete account</div>
            <p style={{ marginTop: 0 }}>Permanently delete your account, children and all progress. This can’t be undone.</p>
            <button className="btn danger" onClick={deleteAccount}>Delete my account</button></div>
        </>}
      </div>
    </>
  );
}
