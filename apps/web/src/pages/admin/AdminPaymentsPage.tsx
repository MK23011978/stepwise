// Admin payments (v1 #/admin/payments): payments table and credit ledger.
import { Link } from 'react-router';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { AppShell } from '../../layout/AppShell';
import { ErrorBox, Spinner } from '../../ui/bits';
import { fmtDateTime, money } from '../../lib/format';
/* eslint-disable @typescript-eslint/no-explicit-any */

export default function AdminPaymentsPage() {
  return <AppShell title="Payments" admin><Payments /></AppShell>;
}

function Payments() {
  const q = useQuery({ queryKey: ['admin', 'payments'], queryFn: () => api.admin.payments() });
  if (q.isLoading) return <Spinner />;
  if (q.error) return <ErrorBox error={q.error} />;
  const { payments, ledger } = q.data;
  const total = payments.reduce((t: number, p: any) => t + p.amount, 0);
  return (
    <>
      <div className="page-head"><h1>Payments</h1><p>{payments.length} payments · {money(total)} total</p></div>
      <div className="card" style={{ marginBottom: 22 }}><div className="table-wrap"><table className="data"><thead><tr><th>Date</th><th>Customer</th><th>Item</th><th>Credits</th><th>Amount</th><th>Provider</th></tr></thead><tbody>
        {payments.length ? payments.map((p: any) => <tr key={p.id}><td className="small">{fmtDateTime(p.createdAt)}</td><td><Link to={`/admin/users/${p.parentId}`}>{p.parentName}</Link></td><td>{p.label}</td><td>{p.credits}</td>
          <td><b>{money(p.amount)}</b></td><td><span className={`pill ${p.provider === 'stripe' ? 'good' : ''}`}>{p.provider}</span></td></tr>)
          : <tr><td colSpan={6} className="empty">No payments yet</td></tr>}</tbody></table></div></div>
      <div className="card"><div className="card-head"><h3>Credit ledger</h3></div><div className="table-wrap"><table className="data"><thead><tr><th>Date</th><th>Reason</th><th>Change</th><th>Balance</th></tr></thead><tbody>
        {ledger.map((l: any, i: number) => <tr key={l.id || i}><td className="small">{fmtDateTime(l.at)}</td><td className="small">{l.reason}</td><td><b>{l.delta > 0 ? '+' : ''}{l.delta}</b></td><td>{l.balance}</td></tr>)}</tbody></table></div></div>
    </>
  );
}
