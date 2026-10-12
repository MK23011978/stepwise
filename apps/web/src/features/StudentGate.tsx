// Wraps student pages: shows the shell, and an "add your first child" prompt when there is no child yet.
import type { ReactNode } from 'react';
import { Navigate } from 'react-router';
import { useSession } from '../state/session';
import { useOverlay } from '../ui/overlays';
import { AppShell } from '../layout/AppShell';
import { ChildForm } from './ChildForm';

export function StudentGate({ title, subjectBar, children }: { title: string; subjectBar?: boolean; children: (child: any) => ReactNode }) { // eslint-disable-line @typescript-eslint/no-explicit-any
  const s = useSession(); const { openModal } = useOverlay();
  if (!s.child) {
    if (s.me?.user.role === 'admin') return <Navigate to="/admin" replace />;
    return <AppShell title="Welcome"><div className="card pad-lg empty"><div className="e">👋</div><h2 style={{ marginBottom: 8 }}>Add your first child</h2>
      <p className="muted" style={{ maxWidth: 440, margin: '0 auto 20px' }}>Tell us their year group, subjects and target grade — we’ll build their roadmap from Year 7 to the GCSE exams. Their first lesson is free.</p>
      <button className="btn lg" onClick={() => openModal((close) => <ChildForm close={close} />, { wide: true })}>+ Add a child</button></div></AppShell>;
  }
  return <AppShell title={title} subjectBar={subjectBar}>{children(s.child)}</AppShell>;
}
