// Admin gift tickets (v1 #/admin/tickets).
import { Link } from 'react-router';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { AppShell } from '../../layout/AppShell';
import { ErrorBox, Spinner } from '../../ui/bits';
import { fmtDateTime } from '../../lib/format';
/* eslint-disable @typescript-eslint/no-explicit-any */

export default function AdminTicketsPage() {
  return <AppShell title="Gift tickets" admin><Tickets /></AppShell>;
}

function Tickets() {
  const q = useQuery({ queryKey: ['admin', 'tickets'], queryFn: () => api.admin.tickets() });
  if (q.isLoading) return <Spinner />;
  if (q.error) return <ErrorBox error={q.error} />;
  const tickets: any[] = q.data.tickets;
  return (
    <>
      <div className="page-head"><h1>Gift-card tickets</h1><p>Children redeem coins for gift-card tickets; parents approve and buy the cards themselves. {tickets.length} tickets.</p></div>
      <div className="card"><div className="table-wrap"><table className="data"><thead><tr><th>Date</th><th>Student</th><th>Card</th><th>Value</th><th>Coins</th><th>Status</th></tr></thead><tbody>
        {tickets.length ? tickets.map((t) => <tr key={t.id}><td className="small">{fmtDateTime(t.createdAt)}</td><td><Link to={`/admin/users/${t.studentId}`}>{t.studentName}</Link></td>
          <td>{t.icon} {t.cardName}</td><td>£{t.value}</td><td>{t.coins}</td><td><span className="pill">{t.status}</span></td></tr>)
          : <tr><td colSpan={6} className="empty">No tickets yet</td></tr>}</tbody></table></div></div>
    </>
  );
}
