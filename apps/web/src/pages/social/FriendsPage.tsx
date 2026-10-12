// Students: who's online, friend requests (approved by both parents) and 1-to-1 chat with friends.
import { useEffect, useRef, useState, type FormEvent } from 'react';
import { useSearchParams } from 'react-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { useSession } from '../../state/session';
import { useOverlay } from '../../ui/overlays';
import { AppShell } from '../../layout/AppShell';
import { Avatar, Empty, ErrorBox, Spinner } from '../../ui/bits';
import { fmtDateTime } from '../../lib/format';
import { SharedQuestionCard, ShareQuestionForm } from './SharedQuestion';
/* eslint-disable @typescript-eslint/no-explicit-any */

const Face = ({ u }: { u: any }) => <span className="face-wrap"><Avatar u={u} />{u.online && <i className="online-dot" aria-label="online" />}</span>;

export default function FriendsPage() {
  const s = useSession(); const qc = useQueryClient(); const { toast } = useOverlay();
  const [params, setParams] = useSearchParams(); const open = params.get('chat');
  const q = useQuery({ queryKey: ['social'], queryFn: () => api.social.overview(), refetchInterval: 20_000 });
  const reload = () => qc.invalidateQueries({ queryKey: ['social'] });
  const run = (fn: () => Promise<unknown>, ok?: string) => fn().then(() => { if (ok) toast(ok, 'good'); reload(); }).catch((e) => toast(e.message, 'bad'));
  const openChat = (fid: string | null) => setParams(fid ? { chat: fid } : {}, { replace: !fid });
  if (s.me?.user.role !== 'student') return <AppShell title="Friends & Chat"><Empty icon="💬">Friends & chat is for students. Parents can manage it from the Family page.</Empty></AppShell>;
  if (q.isLoading) return <AppShell title="Friends & Chat"><Spinner /></AppShell>;
  if (q.error) return <AppShell title="Friends & Chat"><ErrorBox error={q.error} /></AppShell>;
  const D = q.data; const current = D.friends.find((f: any) => f.id === open);

  const list = (
    <div className="stack">
      <div className="card"><div className="card-head"><h3><span className="dot-live" /> Online now ({D.online.length})</h3></div>
        {!D.me.showOnline && <p className="small muted" style={{ marginBottom: 10 }}>You’re hidden from this list (your parent turned it off).</p>}
        {D.online.length ? D.online.map((u: any) => <div key={u.id} className="person"><Face u={u} /><div className="grow"><b>{u.name}</b><div className="small muted">Year {u.yearGroup}</div></div>
          {u.relation === 'active' ? <button className="btn sm soft" onClick={() => openChat(u.friendshipId)}>Chat</button>
            : u.relation === 'pending' || u.relation === 'approval' ? <span className="pill warn">Requested</span>
              : <button className="btn sm ghost" onClick={() => run(() => api.social.request({ userId: u.id }), 'Friend request sent 👋')}>+ Add friend</button>}</div>)
          : <Empty icon="🌙">Nobody else is online right now.</Empty>}
      </div>

      {D.requests.length > 0 && <div className="card approvals"><div className="card-head"><h3>👋 Friend requests</h3></div>
        {D.requests.map((r: any) => <div key={r.id} className="person"><Face u={r.student} /><div className="grow"><b>{r.student.name}</b>
          <div className="small muted">{r.status === 'approval' ? `Waiting for parents · yours ${r.myParentOk ? '✓' : '…'} · theirs ${r.theirParentOk ? '✓' : '…'}` : r.incoming ? 'Wants to be your friend' : 'Waiting for them to accept'}</div></div>
          {r.incoming ? <><button className="btn sm good" onClick={() => run(() => api.social.accept(r.id), 'Accepted — now your parents need to say yes')}>Accept</button>
            <button className="btn sm ghost" onClick={() => run(() => api.social.decline(r.id))}>No thanks</button></>
            : <button className="btn sm ghost" onClick={() => run(() => api.social.remove(r.id))}>Cancel</button>}</div>)}
      </div>}

      <div className="card"><div className="card-head"><h3>💬 Friends ({D.friends.length})</h3></div>
        {D.friends.length ? D.friends.map((f: any) => <button key={f.id} className={`person as-btn ${f.id === open ? 'on' : ''}`} onClick={() => openChat(f.id)}><Face u={f.student} />
          <div className="grow"><b>{f.student.name}</b><div className="small muted">{f.student.online ? 'Online' : f.lastMessageAt ? `Last message ${fmtDateTime(f.lastMessageAt)}` : `Year ${f.student.yearGroup}`}</div></div>
          {f.unread > 0 && <span className="badge-count">{f.unread}</span>}</button>)
          : <Empty icon="🤝">No friends yet. Add someone who’s online, or type a classmate’s username below.</Empty>}
        <AddByUsername onDone={reload} />
      </div>

      {D.blocked.length > 0 && <div className="card"><div className="card-head"><h3>🚫 Blocked</h3></div>
        {D.blocked.map((b: any) => <div key={b.id} className="person"><Avatar u={b.student} /><div className="grow"><b>{b.student.name}</b></div>
          <button className="btn sm ghost" onClick={() => run(() => api.social.remove(b.id), 'Unblocked')}>Unblock</button></div>)}</div>}
    </div>
  );

  return (
    <AppShell title="Friends & Chat">
      <div className="page-head"><h1>Friends & Chat</h1><p>See who’s studying right now and chat with your friends. Every new friendship is checked by both families’ parents first.</p></div>
      <div className={`social-grid ${current ? 'chatting' : ''}`}>
        <div className="social-list">{list}</div>
        <div className="social-chat">{current ? <ChatPanel key={current.id} f={current} me={D.me} onBack={() => openChat(null)} onChanged={reload} />
          : <div className="card empty"><div className="e">💬</div>Choose a friend to start chatting.<p className="small muted" style={{ marginTop: 10 }}>Be kind, and never share your address, phone number, school or passwords.</p></div>}</div>
      </div>
    </AppShell>
  );
}

function AddByUsername({ onDone }: { onDone: () => void }) {
  const { toast } = useOverlay(); const [v, setV] = useState(''); const [busy, setBusy] = useState(false);
  const submit = async (e: FormEvent) => {
    e.preventDefault(); if (!v.trim()) return; setBusy(true);
    try { await api.social.request({ username: v.trim().replace(/^@/, '') }); toast('Friend request sent 👋', 'good'); setV(''); onDone(); } catch (err) { toast((err as Error).message, 'bad'); } finally { setBusy(false); }
  };
  return <form className="row" style={{ marginTop: 14 }} onSubmit={submit}><input className="input" placeholder="Classmate’s username" value={v} onChange={(e) => setV(e.target.value)} maxLength={30} aria-label="Username" />
    <button className="btn sm" disabled={busy}>Add</button></form>;
}

function ChatPanel({ f, me, onBack, onChanged }: { f: any; me: any; onBack: () => void; onChanged: () => void }) {
  const { toast, confirm, openModal } = useOverlay(); const qc = useQueryClient();
  const q = useQuery({ queryKey: ['chat', f.id], queryFn: () => api.social.messages(f.id), refetchInterval: 4000 });
  const [text, setText] = useState(''); const [sending, setSending] = useState(false);
  const end = useRef<HTMLDivElement>(null);
  const n = q.data?.messages.length || 0;
  useEffect(() => { end.current?.scrollIntoView({ block: 'end' }); if (n) qc.invalidateQueries({ queryKey: ['social'] }); }, [n]); // eslint-disable-line react-hooks/exhaustive-deps

  const send = async (e: FormEvent) => {
    e.preventDefault(); const body = text.trim(); if (!body) return; setSending(true);
    try {
      const r = await api.social.send(f.id, body); setText('');
      if (r.message.filtered) toast('Some words were hidden — keep personal details private 🔒');
      await qc.invalidateQueries({ queryKey: ['chat', f.id] });
    } catch (err) { toast((err as Error).message, 'bad'); } finally { setSending(false); }
  };
  const report = (messageId?: string) => openModal((close) => <ReportForm fid={f.id} messageId={messageId} name={f.student.name} close={close} />);
  const block = async () => { if (await confirm(`Block ${f.student.name}?`, 'They won’t be able to message you or send you friend requests. You can unblock later.', { ok: 'Block', danger: true })) { await api.social.block(f.id); toast('Blocked'); onChanged(); onBack(); } };
  const unfriend = async () => { if (await confirm(`Remove ${f.student.name} as a friend?`, 'Your chat will be closed.', { ok: 'Remove', danger: true })) { await api.social.remove(f.id); onChanged(); onBack(); } };

  return (
    <div className="card chat">
      <div className="chat-head"><button className="btn sm ghost back" onClick={onBack} aria-label="Back">‹</button><Face u={f.student} />
        <div className="grow"><b>{f.student.name}</b><div className="small muted">{f.student.online ? 'Online' : 'Offline'} · Year {f.student.yearGroup}</div></div>
        <button className="btn sm ghost" onClick={() => report()} title="Report">🚩</button><button className="btn sm ghost" onClick={block}>Block</button><button className="btn sm ghost hide-sm" onClick={unfriend}>Unfriend</button></div>
      <div className="chat-body">
        {q.isLoading ? <Spinner /> : q.error ? <ErrorBox error={q.error} /> : !n ? <Empty icon="👋">Say hi to {f.student.name}!</Empty>
          : q.data.messages.map((m: any) => { const mine = m.senderId === me.id;
            if (m.shared) return <div key={m.id} className={`bubble wide ${mine ? 'mine' : ''}`}><div className="meta" style={{ marginTop: 0, marginBottom: 6 }}>{mine ? 'You shared a question' : `${f.student.name} shared a question`} · {fmtDateTime(m.createdAt)}</div>
              <SharedQuestionCard fid={f.id} sq={m.shared} meId={me.id} friend={f.student} /></div>;
            return <div key={m.id} className={`bubble ${mine ? 'mine' : ''}`}><div>{m.body}</div><div className="meta">{fmtDateTime(m.createdAt)}{m.filtered ? ' · 🔒 hidden words' : ''}
              {!mine && <button className="link tiny" onClick={() => report(m.id)}>Report</button>}</div></div>; })}
        <div ref={end} />
      </div>
      {q.data && !q.data.canChat ? <div className="chat-off small muted">Chat is turned off at the moment.</div>
        : <form className="chat-send" onSubmit={send}><button type="button" className="btn ghost" title="Share a question to solve together" onClick={() => openModal((close) => <ShareQuestionForm fid={f.id} close={close} />)}>🧩</button><input className="input" value={text} onChange={(e) => setText(e.target.value)} maxLength={500} placeholder={`Message ${f.student.name}…`} aria-label="Message" />
          <button className="btn" disabled={sending || !text.trim()}>Send</button></form>}
      <div className="small muted chat-note">🔒 Be kind. Don’t share personal details. Your parent can read your chats.</div>
    </div>
  );
}

function ReportForm({ fid, messageId, name, close }: { fid: string; messageId?: string; name: string; close: () => void }) {
  const { toast } = useOverlay(); const [reason, setReason] = useState(''); const [busy, setBusy] = useState(false);
  const submit = async (e: FormEvent) => {
    e.preventDefault(); setBusy(true);
    try { await api.social.report(fid, { reason, messageId }); toast('Thanks — our team will look at this', 'good'); close(); } catch (err) { toast((err as Error).message, 'bad'); } finally { setBusy(false); }
  };
  return <form onSubmit={submit}><h2>Report {name}</h2><p className="muted">Tell us what happened. A safety admin will read the chat. If you feel unsafe, tell a parent or teacher too.</p>
    <textarea className="input" rows={4} style={{ margin: '14px 0' }} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="What happened?" required minLength={3} maxLength={300} />
    <div className="row" style={{ justifyContent: 'flex-end' }}><button type="button" className="btn ghost" onClick={close}>Cancel</button><button className="btn" disabled={busy}>Send report</button></div></form>;
}
