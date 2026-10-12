// Parents: a child's friends, chat controls and read-only chat history.
import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { useOverlay } from '../../ui/overlays';
import { Avatar, Empty, ErrorBox, Html, Spinner } from '../../ui/bits';
import { fmtDateTime } from '../../lib/format';
/* eslint-disable @typescript-eslint/no-explicit-any */

const STATUS: Record<string, string> = { active: 'Friends', pending: 'Request sent', approval: 'Needs approval', declined: 'Declined', blocked: 'Blocked' };

export function ChildSocial({ child, close }: { child: any; close: () => void }) {
  const qc = useQueryClient(); const { toast } = useOverlay();
  const q = useQuery({ queryKey: ['child-social', child.id], queryFn: () => api.social.child(child.id) });
  const [open, setOpen] = useState<string | null>(null);
  const reload = () => { qc.invalidateQueries({ queryKey: ['child-social', child.id] }); qc.invalidateQueries({ queryKey: ['approvals'] }); };
  const set = (b: any) => api.social.settings(child.id, b).then(() => { toast('Saved', 'good'); reload(); }).catch((e) => toast(e.message, 'bad'));
  const decide = (fid: string, approve: boolean) => api.social.approve(child.id, fid, approve).then(() => { toast(approve ? 'Approved' : 'Declined', approve ? 'good' : ''); reload(); }).catch((e) => toast(e.message, 'bad'));
  if (q.isLoading) return <Spinner />;
  if (q.error) return <ErrorBox error={q.error} />;
  const D = q.data;
  return (
    <>
      <h2>👥 {child.name}’s friends & chat</h2>
      <p className="muted">Friendships only start when you and the other child’s parent both approve. Personal details (phone numbers, emails, links, social handles) are hidden automatically.</p>
      <div className="stack" style={{ margin: '16px 0' }}>
        <label className="row toggle"><input type="checkbox" checked={D.settings.chatEnabled} onChange={(e) => set({ chatEnabled: e.target.checked })} /><span><b>Allow chat</b><div className="small muted">Turn off to pause all messages.</div></span></label>
        <label className="row toggle"><input type="checkbox" checked={D.settings.showOnline} onChange={(e) => set({ showOnline: e.target.checked })} /><span><b>Show in “Online now”</b><div className="small muted">Other students see first name, last initial and year only.</div></span></label>
      </div>
      {!D.friendships.length ? <Empty icon="🤝">No friends or requests yet.</Empty>
        : D.friendships.map((f: any) => <div key={f.id}>
          <div className="person"><Avatar u={f.student} /><div className="grow"><b>{f.student.name}</b><div className="small muted">Year {f.student.yearGroup} · {STATUS[f.status] || f.status}{f.lastMessageAt ? ` · last message ${fmtDateTime(f.lastMessageAt)}` : ''}</div></div>
            {f.status === 'approval' && !f.myParentOk && <><button className="btn sm good" onClick={() => decide(f.id, true)}>Approve</button><button className="btn sm ghost" onClick={() => decide(f.id, false)}>Decline</button></>}
            {f.status === 'approval' && f.myParentOk && <span className="pill warn">Waiting for their parent</span>}
            {(f.status === 'active' || f.status === 'blocked') && <button className="btn sm ghost" onClick={() => setOpen(open === f.id ? null : f.id)}>{open === f.id ? 'Hide chat' : 'Read chat'}</button>}</div>
          {open === f.id && <ChatLog childId={child.id} fid={f.id} name={f.student.name} />}
        </div>)}
      <div className="row" style={{ justifyContent: 'flex-end', marginTop: 16 }}><button className="btn ghost" onClick={close}>Close</button></div>
    </>
  );
}

function ChatLog({ childId, fid, name }: { childId: string; fid: string; name: string }) {
  const q = useQuery({ queryKey: ['child-chat', childId, fid], queryFn: () => api.social.childMessages(childId, fid) });
  if (q.isLoading) return <Spinner />;
  if (q.error) return <ErrorBox error={q.error} />;
  return <div className="chat-log">{q.data.messages.length ? q.data.messages.map((m: any) => <div key={m.id} className={`bubble ${m.senderId === childId ? 'mine' : ''}`}>
    {m.shared ? <div><b>🧩 {m.shared.topicName}</b><Html className="small" html={m.shared.question.html} /><div className="small muted">Answer: <Html as="span" html={m.shared.answerHtml || m.shared.answer} /></div></div> : m.body}
    <div className="meta">{m.senderId === childId ? 'Your child' : name} · {fmtDateTime(m.createdAt)}{m.filtered ? ' · 🔒 words hidden' : ''}</div></div>)
    : <Empty icon="💬">No messages yet.</Empty>}</div>;
}
