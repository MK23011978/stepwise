// Parent family overview (v1 `/app/family`): a card per child with progress at a glance, plus add/edit child.
import { useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { useQueries } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { useSession } from '../../state/session';
import { useOverlay } from '../../ui/overlays';
import { AppShell } from '../../layout/AppShell';
import { ChildForm } from '../../features/ChildForm';
import { Bars, Donut } from '../../ui/charts';
import { Avatar, ErrorBox, Spinner } from '../../ui/bits';
/* eslint-disable @typescript-eslint/no-explicit-any */

export default function FamilyPage() {
  const s = useSession(); const { openModal } = useOverlay(); const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const kids = s.me?.children || [];
  const qs = useQueries({ queries: kids.map((c) => ({ queryKey: ['overview', c.id, 'maths'], queryFn: () => api.students.overview(c.id, 'maths') })) });
  const addChild = () => openModal((close) => <ChildForm close={close} />, { wide: true });
  const opened = useRef(false);
  useEffect(() => {
    if (params.get('add') === '1' && !opened.current && s.cur) {
      opened.current = true;
      if (!kids.length) addChild();
      setParams({}, { replace: true });
    }
  }, [params, s.cur]); // eslint-disable-line react-hooks/exhaustive-deps

  const go = (id: string, to: string) => { s.setChildId(id); navigate(to); };
  const loading = qs.some((q) => q.isLoading); const err = qs.find((q) => q.error)?.error;

  return (
    <AppShell title="Family">
      <div className="page-head row spread wrap"><div><h1>Your family</h1><p>Manage children, subjects and logins, and see everyone’s progress at a glance.</p></div>
        <button className="btn" onClick={addChild}>+ Add a child</button></div>
      {!kids.length ? <div className="card empty"><div className="e">👨‍👩‍👧</div>No children yet. Add one to start their free lesson.</div>
        : loading ? <Spinner /> : err ? <ErrorBox error={err} />
          : <div className="grid-3">{qs.map((q, i) => {
            const { student, overall: o } = q.data as any; const c = student || kids[i];
            return (
              <div key={c.id} className="card">
                <div className="row"><Avatar u={c} size="lg" /><div className="grow"><h3 style={{ fontSize: 19 }}>{c.name}</h3>
                  <div className="small muted">Year {c.yearGroup} · {c.tier === 'F' ? 'Foundation' : 'Higher'} · @{c.username}</div></div></div>
                <div className="row" style={{ margin: '18px 0 8px', gap: 18 }}><Donut pct={o.coverage} color="#3b6cf6" size={86} />
                  <div className="small" style={{ lineHeight: 1.9 }}><div>✅ <b>{o.correct}</b> correct · 🎯 {o.accuracy ?? '–'}%</div><div>🔥 {o.streak}-day streak · Lv {o.level.level}</div><div>🪙 {o.coins} coins · 📜 {o.certificates} certificates</div></div></div>
                <div style={{ marginBottom: 14 }}><Bars items={o.strands.filter((x: any) => s.enrolled(c).some((e) => e.id === x.id)).slice(0, 5).map((x: any) => ({ name: `${x.icon} ${x.name}`, value: x.accuracy, color: x.color }))} /></div>
                <div className="row wrap">
                  <button className="btn sm grow" onClick={() => go(c.id, '/app')}>View dashboard</button>
                  <button className="btn sm ghost" onClick={() => go(c.id, '/app/report')}>📄 Report</button>
                  <button className="btn sm ghost" onClick={() => go(c.id, '/app/rewards')}>🎯 Goals</button>
                  <button className="btn sm ghost" onClick={() => openModal((close) => <ChildForm existing={kids.find((k) => k.id === c.id) || c} close={close} />, { wide: true })}>Edit</button>
                </div>
              </div>
            );
          })}</div>}
    </AppShell>
  );
}
