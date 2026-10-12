// Admin: chat reports from students, with the recent conversation.
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { useOverlay } from '../../ui/overlays';
import { AppShell } from '../../layout/AppShell';
import { Empty, ErrorBox, Spinner } from '../../ui/bits';
import { fmtDateTime } from '../../lib/format';
/* eslint-disable @typescript-eslint/no-explicit-any */

export default function AdminReportsPage() {
  const qc = useQueryClient(); const { toast } = useOverlay();
  const q = useQuery({ queryKey: ['chat-reports'], queryFn: () => api.social.reports() });
  const act = (id: string, status: 'open' | 'closed') => api.social.closeReport(id, status).then(() => { toast(status === 'closed' ? 'Closed' : 'Reopened'); qc.invalidateQueries({ queryKey: ['chat-reports'] }); });
  return (
    <AppShell title="Chat reports" admin>
      <div className="page-head"><h1>Chat reports</h1><p>Students can report a friend or a message. Read the conversation, contact the families if needed (Users), then close the report.</p></div>
      {q.isLoading ? <Spinner /> : q.error ? <ErrorBox error={q.error} /> : !q.data.reports.length ? <div className="card"><Empty icon="🛡️">No reports. All quiet.</Empty></div>
        : <div className="stack">{q.data.reports.map((r: any) => <div key={r.id} className={`card ${r.status === 'open' ? 'approvals' : ''}`}>
          <div className="row spread wrap"><div><b>{r.reporter}</b> reported a chat between <b>{r.between.join(' & ')}</b><div className="small muted">{fmtDateTime(r.createdAt)} · {r.status}</div></div>
            <button className="btn sm ghost" onClick={() => act(r.id, r.status === 'open' ? 'closed' : 'open')}>{r.status === 'open' ? 'Close' : 'Reopen'}</button></div>
          <p style={{ margin: '10px 0' }}>“{r.reason}”</p>
          <div className="chat-log">{r.messages.map((m: any) => <div key={m.id} className={`bubble ${m.id === r.messageId ? 'flagged' : ''}`}>{m.shared ? `🧩 ${m.shared.topicName}` : m.body}
            <div className="meta">{fmtDateTime(m.createdAt)}{m.filtered ? ' · filtered' : ''}{m.id === r.messageId ? ' · reported message' : ''}</div></div>)}</div>
        </div>)}</div>}
    </AppShell>
  );
}
