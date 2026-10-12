// Printable certificate (v1 `/app/certificate/:id`).
import { Link, useParams } from 'react-router';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { StudentGate } from '../../features/StudentGate';
import { ErrorBox, Spinner } from '../../ui/bits';
import { fmtDate } from '../../lib/format';
/* eslint-disable @typescript-eslint/no-explicit-any */

export default function CertificatePage() {
  return <StudentGate title="Certificate">{(c) => <Certificate child={c} />}</StudentGate>;
}

function printAs(cls: string) {
  document.body.classList.add(cls);
  const done = () => { document.body.classList.remove(cls); window.removeEventListener('afterprint', done); };
  window.addEventListener('afterprint', done);
  window.print();
  setTimeout(done, 1500);
}

function Certificate({ child: c }: { child: any }) {
  const { id = '' } = useParams();
  const q = useQuery({ queryKey: ['certificate', c.id, id], queryFn: () => api.rewards.certificate(c.id, id) });
  if (q.isLoading) return <Spinner />;
  if (q.error || !q.data) return <ErrorBox error={q.error} />;
  const { certificate: ct, student } = q.data as { certificate: any; student: any };
  return (
    <>
      <div className="row" style={{ justifyContent: 'space-between', marginBottom: 16 }}>
        <Link to="/app/rewards" className="small">← Rewards</Link>
        <button className="btn" onClick={() => printAs('print-cert')}>🖨️ Print / save as PDF</button>
      </div>
      <div className="cert"><div className="cert-inner">
        <div className="seal" aria-hidden="true">{ct.kind === 'year' ? '🎓' : ct.kind === 'exam' ? '🌟' : '📜'}</div>
        <div style={{ letterSpacing: '.3em', fontSize: 12, color: '#b45309', fontWeight: 700 }}>STEPWISE · CERTIFICATE OF ACHIEVEMENT</div>
        <h1 style={{ marginTop: 12 }}>Certificate of {ct.kind === 'year' ? 'Completion' : 'Mastery'}</h1>
        <div style={{ marginTop: 20, color: '#64748b' }}>This certifies that</div>
        <div className="who">{student.name}</div>
        <div style={{ color: '#64748b' }}>has {ct.kind === 'year' ? 'completed every topic in' : ct.kind === 'exam' ? 'achieved their target in' : 'mastered every question style in'}</div>
        <div className="what">{ct.title}</div>
        <div style={{ color: '#64748b', marginTop: 6 }}>{ct.subtitle || ''}</div>
        <div className="foot"><span>Awarded {fmtDate(ct.at)}</span><span>Year {student.yearGroup}</span><span>stepwise · GCSE programme</span></div>
      </div></div>
    </>
  );
}
