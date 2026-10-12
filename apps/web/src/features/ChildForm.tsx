import { useState } from 'react';
import { useSession } from '../state/session';
import { useOverlay } from '../ui/overlays';
import { api } from '../lib/api';
/* eslint-disable @typescript-eslint/no-explicit-any */
export function ChildForm({ existing, close }: { existing?: any; close: () => void }) {
  const s = useSession(); const { toast, confirm } = useOverlay();
  const all = s.cur!.subjects.map((x) => x.id);
  const [f, setF] = useState({ name: existing?.name || '', yearGroup: existing?.yearGroup || 9, tier: existing?.tier || 'H', targetGrade: existing?.targetGrade || 7, subjects: existing?.subjects?.length ? existing.subjects : all, username: existing?.username || '', password: '' });
  const [err, setErr] = useState('');
  const set = (k: string, v: unknown) => setF((x) => ({ ...x, [k]: v }));
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!f.subjects.length) { setErr('Choose at least one subject'); return; }
    const body: any = { ...f, yearGroup: Number(f.yearGroup), targetGrade: Number(f.targetGrade) }; if (!body.password) delete body.password; if (!body.username) delete body.username;
    try {
      const r = existing ? await api.family.updateChild(existing.id, body) : await api.family.addChild(body);
      if (!existing) s.setChildId(r.child.id);
      await s.refresh(); close(); toast(existing ? 'Saved' : `${r.child.name} added — username: ${r.child.username}`, 'good');
    } catch (e2) { setErr((e2 as Error).message); }
  };
  return (
    <form className="stack" onSubmit={submit}>
      <h2>{existing ? `Edit ${existing.name}` : 'Add a child'}</h2>
      <p className="muted" style={{ marginTop: 0 }}>{existing ? 'Update details, subjects or login.' : 'Each child gets their own roadmap and login.'}</p>
      <label className="field"><span>First name</span><input className="input" value={f.name} onChange={(e) => set('name', e.target.value)} required /></label>
      <div className="grid2">
        <label className="field"><span>Year group (this school year)</span><select className="input" value={f.yearGroup} onChange={(e) => set('yearGroup', Number(e.target.value))}>{s.cur!.years.map((y) => <option key={y} value={y}>Year {y}</option>)}</select></label>
        <label className="field"><span>Tier (Maths & Science)</span><select className="input" value={f.tier} onChange={(e) => set('tier', e.target.value)}><option value="H">Higher (grades 4–9)</option><option value="F">Foundation (grades 1–5)</option></select></label>
      </div>
      <div className="field"><span>Subjects</span><div className="check-grid">{s.cur!.subjects.map((x) => <label key={x.id}><input type="checkbox" checked={f.subjects.includes(x.id)} onChange={(e) => set('subjects', e.target.checked ? [...f.subjects, x.id] : f.subjects.filter((y: string) => y !== x.id))} /> {x.icon} {x.name}</label>)}</div></div>
      <label className="field"><span>Target grade: <b>{f.targetGrade}</b></span><input type="range" min={1} max={9} value={f.targetGrade} onChange={(e) => set('targetGrade', Number(e.target.value))} style={{ width: '100%' }} /></label>
      <div className="grid2">
        <label className="field"><span>Student username {existing ? '' : '(optional)'}</span><input className="input" value={f.username} onChange={(e) => set('username', e.target.value)} placeholder="auto-generated" autoComplete="off" /></label>
        <label className="field"><span>{existing ? 'New password (optional)' : 'Student password (optional)'}</span><input className="input" type="password" minLength={8} value={f.password} onChange={(e) => set('password', e.target.value)} autoComplete="new-password" placeholder="min 8 characters" /></label>
      </div>
      <div className="error">{err}</div>
      <div className="row spread">
        {existing ? <button type="button" className="btn ghost" style={{ color: 'var(--bad)' }} onClick={async () => {
          close();
          if (await confirm(`Delete ${existing.name}?`, 'This permanently removes their profile, progress, lessons and exam results. Unused credits stay in your wallet.', { ok: 'Delete', danger: true })) { await api.family.deleteChild(existing.id); await s.refresh(); toast('Child removed'); }
        }}>Delete child</button> : <span />}
        <div className="row"><button type="button" className="btn ghost" onClick={close}>Cancel</button><button className="btn">{existing ? 'Save' : 'Add child'}</button></div>
      </div>
    </form>
  );
}
