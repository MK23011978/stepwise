// Gift-card reward tickets (v1 renderGifts): catalogue, request modal, ticket list, parent actions and settings.
import { useState, type FormEvent } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { useSession } from '../../state/session';
import { useOverlay } from '../../ui/overlays';
import { ErrorBox, Spinner } from '../../ui/bits';
import { confetti } from '../../lib/confetti';
import { fmtDate } from '../../lib/format';
/* eslint-disable @typescript-eslint/no-explicit-any */

const STATUS: Record<string, [string, string]> = {
  pending: ['warn', '⏳ waiting for parent'], approved: ['brand', '👍 approved'], delivered: ['good', '🎁 delivered'],
  declined: ['bad', 'declined · refunded'], cancelled: ['', 'cancelled · refunded'],
};

export function GiftsCard({ child: c }: { child: any }) {
  const s = useSession(); const qc = useQueryClient();
  const { openModal, toast } = useOverlay();
  const isParent = s.me!.user.role !== 'student';
  const q = useQuery({ queryKey: ['gifts', c.id], queryFn: () => api.gifts.overview(c.id) });
  const [vals, setVals] = useState<Record<string, number>>({});
  if (q.isLoading) return <div className="card"><Spinner /></div>;
  if (q.error) return <div className="card"><ErrorBox error={q.error} /></div>;
  const g = q.data;
  const reload = () => { qc.invalidateQueries({ queryKey: ['gifts', c.id] }); qc.invalidateQueries({ queryKey: ['rewards', c.id] }); };

  const request = (cd: any) => {
    const value = vals[cd.id] ?? cd.options[0]?.value; const coins = value * g.settings.coinsPerPound;
    openModal((close) => <RequestModal cd={cd} value={value} coins={coins} have={g.coins} close={close} onSend={async (note) => {
      try { await api.gifts.request(c.id, { cardId: cd.id, value, note }); close(); confetti(50); toast('Ticket sent to your parent 🎟️', 'good'); await s.refresh(); reload(); }
      catch (e) { toast((e as Error).message, 'bad'); }
    }} />);
  };
  const act = async (t: any, action: 'approve' | 'deliver' | 'decline' | 'cancel') => {
    if (action === 'deliver' || action === 'decline') {
      openModal((close) => <ActionModal action={action} close={close} onDo={async (code, reply) => {
        try { await api.gifts.act(c.id, t.id, { action, code, reply }); close(); toast('Updated', 'good'); await s.refresh(); reload(); }
        catch (e) { toast((e as Error).message, 'bad'); }
      }} />);
      return;
    }
    try { await api.gifts.act(c.id, t.id, { action }); toast(action === 'cancel' ? 'Cancelled — coins refunded' : 'Approved 👍', 'good'); await s.refresh(); reload(); }
    catch (e) { toast((e as Error).message, 'bad'); }
  };
  const settings = () => openModal((close) => <SettingsForm child={c} g={g} close={close} onDone={reload} />, { wide: true });

  return (
    <div className="card">
      <div className="card-head"><div><h3>🎟️ Game & gift-card tickets</h3><div className="small muted">Swap coins for a real reward — your parent approves and buys the card. Limit £{g.settings.monthlyLimit}/month (used £{g.spentThisMonth}).</div></div>
        {isParent && <button className="btn sm ghost" onClick={settings}>Settings</button>}</div>
      {!g.settings.enabled ? <div className="demo-note">Gift-card tickets are switched off.</div>
        : <div className="gift-grid">{g.catalogue.map((cd: any) => (
          <div key={cd.id} className="gift"><span className="ic" aria-hidden>{cd.icon}</span><b className="small">{cd.name}</b>
            <select className="input" aria-label={`${cd.name} amount`} value={vals[cd.id] ?? cd.options[0]?.value} onChange={(e) => setVals((v) => ({ ...v, [cd.id]: Number(e.target.value) }))}>
              {cd.options.map((o: any) => <option key={o.value} value={o.value}>£{o.value} · {o.coins.toLocaleString()} coins</option>)}</select>
            <button className="btn sm block" onClick={() => request(cd)}>Request</button></div>))}</div>}
      <div className="tiny muted" style={{ margin: '18px 0 6px' }}>Tickets</div>
      {g.tickets.length ? g.tickets.map((t: any) => { const st = STATUS[t.status] || ['', t.status];
        return (
          <div key={t.id} className="ticket"><span style={{ fontSize: 24 }}>{t.icon}</span>
            <div className="grow"><b>£{t.value} {t.cardName}</b> <span className={`pill ${st[0]}`}>{st[1]}</span>
              <div className="small muted">{t.coins.toLocaleString()} coins · {fmtDate(t.createdAt)}{t.note ? ` · “${t.note}”` : ''}{t.reply ? ` · Parent: ${t.reply}` : ''}</div>
              {t.code && <div className="small" style={{ marginTop: 6 }}>Code: <span className="code">{t.code}</span></div>}</div>
            {isParent && ['pending', 'approved'].includes(t.status) && <>
              {t.status === 'pending' && <button className="btn sm good" onClick={() => act(t, 'approve')}>Approve</button>}
              <button className="btn sm" onClick={() => act(t, 'deliver')}>Mark delivered</button>
              <button className="btn sm ghost" onClick={() => act(t, 'decline')}>Decline</button></>}
            {!isParent && t.status === 'pending' && <button className="btn sm ghost" onClick={() => act(t, 'cancel')}>Cancel</button>}
          </div>); })
        : <div className="small muted">No tickets yet.</div>}
    </div>
  );
}

function RequestModal({ cd, value, coins, have, close, onSend }: { cd: any; value: number; coins: number; have: number; close: () => void; onSend: (note: string) => void }) {
  const [note, setNote] = useState(''); const short = have < coins;
  return (
    <><h2>{cd.icon} £{value} {cd.name}</h2><p className="muted">This uses <b>{coins.toLocaleString()} coins</b> (you have {have.toLocaleString()}). Your parent gets a ticket to approve. If they decline, your coins come back.</p>
      <label className="field" style={{ marginTop: 12 }}><span>Message for your parent (optional)</span><input className="input" maxLength={140} value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g. For the new Roblox game!" /></label>
      <div className="row" style={{ justifyContent: 'flex-end', marginTop: 18 }}><button className="btn ghost" onClick={close}>Cancel</button>
        <button className="btn" disabled={short} onClick={() => onSend(note)}>{short ? `Need ${(coins - have).toLocaleString()} more coins` : 'Send ticket 🎟️'}</button></div></>
  );
}

function ActionModal({ action, close, onDo }: { action: 'deliver' | 'decline'; close: () => void; onDo: (code: string, reply: string) => void }) {
  const [code, setCode] = useState(''); const [reply, setReply] = useState('');
  const deliver = action === 'deliver';
  return (
    <><h2>{deliver ? 'Mark as delivered' : 'Decline ticket'}</h2>
      <p className="muted">{deliver ? 'Buy the gift card yourself (shop, app store or online), then optionally paste the code so your child can see it on their Rewards page.' : 'The coins are refunded to your child.'}</p>
      {deliver && <label className="field" style={{ marginTop: 12 }}><span>Gift-card code (optional)</span><input className="input" maxLength={80} autoComplete="off" value={code} onChange={(e) => setCode(e.target.value)} /></label>}
      <label className="field" style={{ marginTop: 12 }}><span>Message (optional)</span><input className="input" maxLength={200} value={reply} onChange={(e) => setReply(e.target.value)} /></label>
      <div className="row" style={{ justifyContent: 'flex-end', marginTop: 18 }}><button className="btn ghost" onClick={close}>Cancel</button>
        <button className={`btn ${deliver ? 'good' : 'danger'}`} onClick={() => onDo(code, reply)}>{deliver ? 'Delivered 🎁' : 'Decline'}</button></div></>
  );
}

function SettingsForm({ child: c, g, close, onDone }: { child: any; g: any; close: () => void; onDone: () => void }) {
  const { toast } = useOverlay();
  const [enabled, setEnabled] = useState<boolean>(!!g.settings.enabled);
  const [cpp, setCpp] = useState(String(g.settings.coinsPerPound));
  const [limit, setLimit] = useState(String(g.settings.monthlyLimit));
  const [allowed, setAllowed] = useState<string[]>(g.settings.allowed || []);
  const [err, setErr] = useState('');
  const submit = async (e: FormEvent) => {
    e.preventDefault();
    try { await api.gifts.settings(c.id, { enabled, coinsPerPound: Number(cpp), monthlyLimit: Number(limit), allowed }); close(); toast('Saved', 'good'); onDone(); }
    catch (x) { setErr((x as Error).message); }
  };
  return (
    <><h2>Gift-card settings for {c.name}</h2>
      <form className="stack" style={{ marginTop: 14 }} onSubmit={submit}>
        <label className="row"><input type="checkbox" checked={enabled} onChange={(e) => setEnabled(e.target.checked)} /> Allow gift-card tickets</label>
        <div className="grid2"><label className="field"><span>Coins per £1</span><input className="input" type="number" min={50} max={5000} value={cpp} onChange={(e) => setCpp(e.target.value)} /></label>
          <label className="field"><span>Monthly limit (£)</span><input className="input" type="number" min={0} max={200} value={limit} onChange={(e) => setLimit(e.target.value)} /></label></div>
        <div className="field"><span>Allowed cards</span><div className="check-grid">{g.allCards.map((cd: any) => (
          <label key={cd.id}><input type="checkbox" checked={allowed.includes(cd.id)} onChange={(e) => setAllowed((a) => (e.target.checked ? [...a, cd.id] : a.filter((x) => x !== cd.id)))} /> {cd.icon} {cd.name}</label>))}</div></div>
        <p className="small faint" style={{ margin: 0 }}>Stepwise never buys cards or takes payment for them — you decide and buy the card yourself.</p>
        <div className="error">{err}</div>
        <div className="row" style={{ justifyContent: 'flex-end' }}><button type="button" className="btn ghost" onClick={close}>Cancel</button><button className="btn">Save</button></div>
      </form></>
  );
}
