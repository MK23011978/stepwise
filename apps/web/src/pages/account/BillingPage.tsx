// Wallet & billing (v1 `/app/billing`): credits, top-up packs, card on file, payments and credit history.
import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { useSession } from '../../state/session';
import { useOverlay } from '../../ui/overlays';
import { AppShell } from '../../layout/AppShell';
import { CardCheck, PackCheckout } from '../../features/payments';
import { ErrorBox, Spinner } from '../../ui/bits';
import { fmtDate, fmtDateTime, money } from '../../lib/format';
/* eslint-disable @typescript-eslint/no-explicit-any */

export default function BillingPage() {
  return <AppShell title="Billing"><Billing /></AppShell>;
}

function Billing() {
  const s = useSession(); const qc = useQueryClient(); const { openModal, toast } = useOverlay();
  const q = useQuery({ queryKey: ['billing'], queryFn: () => api.billing.overview() });
  const [sel, setSel] = useState<string | null>(null);
  if (q.isLoading) return <Spinner />;
  if (q.error) return <ErrorBox error={q.error} />;
  const b = q.data;
  const selId = sel ?? b.packs[1]?.id ?? b.packs[0]?.id;
  const reload = async () => { await Promise.all([s.refresh(), qc.invalidateQueries({ queryKey: ['billing'] })]); };

  const pay = () => {
    const pack = b.packs.find((x: any) => x.id === selId); if (!pack) return;
    openModal((close) => <PackCheckout pack={pack} onCancel={close} onDone={async () => { close(); toast(`Payment successful — ${pack.credits + pack.bonus} credits added`, 'good'); await reload(); }} />);
  };
  const checkCard = () => openModal((close) => <CardCheck onCancel={close} onDone={async (r) => { close(); await reload(); toast(r.message, r.trialAvailable ? 'good' : ''); }} />);

  return (
    <>
      <div className="page-head"><h1>Wallet &amp; billing</h1><p>£1 per lesson, topic test or checkpoint. Review sessions are free. Credits are shared by the whole family and never expire.</p></div>
      {b.freeAccess && <div className="card" style={{ marginBottom: 22, borderLeft: '4px solid var(--good)' }}><b>✨ Your family has free access.</b> <span className="muted">Lessons and tests don’t use credits.</span></div>}
      <div className="grid-main">
        <div className="stack">
          <div className="card welcome"><div><div className="tiny" style={{ color: '#c7d2fe' }}>Available credits</div><div style={{ fontSize: 56, fontWeight: 900, lineHeight: 1.1 }}>{b.credits}</div>
            <p>{b.freeLessonAvailable ? '🎁 Your free trial lesson is still available.' : `≈ ${b.credits} lessons`} · Every 10 completed lessons earns a free one.</p></div></div>
          <div className="card"><div className="card-head"><h3>Top up</h3>{b.live ? <span className="pill good">Secure card payments by Stripe</span> : <span className="pill warn">Demo mode</span>}</div>
            <div className="stack" role="radiogroup" aria-label="Credit packs">{b.packs.map((p: any) => (
              <button key={p.id} role="radio" aria-checked={p.id === selId} className={`pack ${p.id === selId ? 'on' : ''}`} onClick={() => setSel(p.id)}>
                <div><b style={{ fontSize: 17 }}>{p.label}</b>{p.tag && <> <span className="pill brand">{p.tag}</span></>}
                  <div className="small muted">{p.credits + p.bonus} credits · {money(p.price / (p.credits + p.bonus))} per lesson</div></div>
                <div className="p">{money(p.price)}</div></button>))}</div>
            <button className="btn lg block" style={{ marginTop: 18 }} onClick={pay}>Continue to payment</button></div>
          <div className="card"><div className="card-head"><h3>Card on file</h3></div>
            {b.cardVerified ? <div className="row"><span style={{ fontSize: 26 }}>💳</span><div><b>{(b.card?.brand || '').toUpperCase()} •••• {b.card?.last4 || ''}</b><div className="small muted">Checked with a £0 verification</div></div></div>
              : <><div className="small muted">No card checked yet. A £0 check is needed for the free trial lesson.</div><button className="btn sm ghost" style={{ marginTop: 10 }} onClick={checkCard}>Check a card (£0)</button></>}</div>
        </div>
        <div className="stack">
          <div className="card"><div className="card-head"><h3>Payments</h3></div>
            {b.payments.length ? <div className="table-wrap"><table className="data"><thead><tr><th>Date</th><th>Item</th><th>Amount</th></tr></thead><tbody>
              {b.payments.map((p: any, i: number) => <tr key={p.id || i}><td>{fmtDate(p.createdAt)}</td><td>{p.label}</td><td><b>{money(p.amount)}</b></td></tr>)}</tbody></table></div>
              : <div className="empty small">No payments yet.</div>}</div>
          <div className="card"><div className="card-head"><h3>Credit history</h3></div>
            {b.ledger.length ? <div className="table-wrap"><table className="data"><tbody>
              {b.ledger.map((l: any, i: number) => <tr key={i}><td className="small muted">{fmtDateTime(l.at)}</td><td>{l.reason}</td>
                <td style={{ textAlign: 'right' }}><b style={{ color: l.delta > 0 ? 'var(--good)' : l.delta < 0 ? 'var(--ink)' : 'var(--ink-3)' }}>{l.delta > 0 ? '+' : ''}{l.delta}</b></td></tr>)}</tbody></table></div>
              : <div className="empty small">No activity yet.</div>}</div>
        </div>
      </div>
    </>
  );
}
