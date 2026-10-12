// Rewards (v1 #/app/rewards): KPIs, parent reward goals, gift-card tickets, reward shop, certificates, badges, inbox.
import { useState, type FormEvent } from 'react';
import { Link } from 'react-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { useSession } from '../../state/session';
import { useOverlay } from '../../ui/overlays';
import { StudentGate } from '../../features/StudentGate';
import { Coin, ErrorBox, SHOP_LOOK, Spinner } from '../../ui/bits';
import { confetti } from '../../lib/confetti';
import { fmtDate } from '../../lib/format';
import { GiftsCard } from './GiftsCard';
/* eslint-disable @typescript-eslint/no-explicit-any */

export default function RewardsPage() {
  return <StudentGate title="Rewards">{(c) => <Rewards child={c} />}</StudentGate>;
}

function Rewards({ child: c }: { child: any }) {
  const s = useSession(); const qc = useQueryClient();
  const { toast, confirm, openModal } = useOverlay();
  const isParent = s.me!.user.role !== 'student';
  const q = useQuery({ queryKey: ['rewards', c.id], queryFn: () => api.rewards.overview(c.id) });
  if (q.isLoading) return <Spinner />;
  if (q.error) return <ErrorBox error={q.error} />;
  const R = q.data;
  R.shop.forEach((it: any) => { SHOP_LOOK[it.id] = it.emoji || it.css; });
  const earned = R.badges.filter((b: any) => b.got);
  const reload = () => qc.invalidateQueries({ queryKey: ['rewards', c.id] });

  const buy = async (it: any, action: 'buy' | 'equip') => {
    try {
      await api.rewards.shop(c.id, { itemId: it.id, action });
      if (action !== 'equip') { confetti(40); toast(`Unlocked ${it.name}!`, 'good'); }
      await s.refresh(); reload();
    } catch (e) { toast((e as Error).message, 'bad'); }
  };
  const deliver = async (g: any) => { try { await api.rewards.deliverGoal(c.id, g.id); toast('Marked as given 🎁', 'good'); reload(); } catch (e) { toast((e as Error).message, 'bad'); } };
  const removeGoal = async (g: any) => {
    if (!(await confirm('Remove goal?', 'This removes the goal and its progress.', { ok: 'Remove', danger: true }))) return;
    try { await api.rewards.deleteGoal(c.id, g.id); reload(); } catch (e) { toast((e as Error).message, 'bad'); }
  };
  const newGoal = () => openModal((close) => <GoalForm child={c} types={R.goalTypes} close={close} onDone={reload} />);

  const shopSection = (kind: string, label: string, first = false) => (
    <><div className="tiny muted" style={{ margin: first ? '6px 0 10px' : '18px 0 10px' }}>{label}</div>
      <div className="shop-grid">{R.shop.filter((x: any) => x.kind === kind).map((it: any) => <ShopItem key={it.id} it={it} R={R} onBuy={buy} />)}</div></>
  );

  return (
    <>
      <div className="page-head"><h1>🏆 Rewards</h1><p>Every correct answer earns XP and coins. Level up, collect badges and certificates, unlock avatars in the shop — and earn a free lesson every {R.rewardEvery} lessons.</p></div>
      <div className="kpis">
        <div className="card kpi"><div className="v"><Coin n={R.coins} /></div><div className="l">Coins to spend</div></div>
        <div className="card kpi"><div className="v">Lv {R.level.level}</div><div className="l">{R.level.xp} XP · {R.level.next - R.level.xp} to next level</div><div className="bar thin" style={{ marginTop: 8 }}><i style={{ width: `${R.level.pct}%` }} /></div></div>
        <div className="card kpi"><div className="v">{earned.length}<span className="faint" style={{ fontSize: 18 }}> / {R.badges.length}</span></div><div className="l">Badges earned</div></div>
        <div className="card kpi"><div className="v">🎁 {R.nextReward}</div><div className="l">lessons until a free lesson</div><div className="bar thin" style={{ marginTop: 8 }}><i style={{ width: `${((R.rewardEvery - R.nextReward) / R.rewardEvery) * 100}%`, background: 'var(--good)' }} /></div></div>
      </div>
      <div className="grid-main">
        <div className="stack">
          <div className="card"><div className="card-head"><h3>🎯 Reward goals {isParent ? '' : 'from your parent'}</h3>{isParent && <button className="btn sm" onClick={newGoal}>+ New goal</button>}</div>
            {R.goals.length ? <div className="stack">{R.goals.slice().reverse().map((g: any) => (
              <div key={g.id} className={`goal ${g.achievedAt ? 'done' : ''}`}>
                <div className="row spread"><b>{g.label} {g.target}</b>{g.achievedAt ? (g.deliveredAt ? <span className="pill good">Reward given ✓</span> : <span className="pill warn">Achieved! 🎉</span>) : <span className="small muted">{g.progress}/{g.target}</span>}</div>
                <div className="bar"><i style={{ width: `${g.pct}%`, background: g.achievedAt ? 'var(--good)' : '#f59e0b' }} /></div>
                <div className="row spread wrap"><span>🎁 {g.reward}</span>
                  {isParent && <span className="row">{g.achievedAt && !g.deliveredAt && <button className="btn sm good" onClick={() => deliver(g)}>Mark reward given</button>}<button className="btn sm ghost" onClick={() => removeGoal(g)}>Remove</button></span>}</div>
              </div>))}</div>
              : <div className="empty small"><div className="e">🎯</div>{isParent ? 'Set a goal with a real-world reward — e.g. “Complete 20 lessons → cinema trip”. It’s tracked automatically and your child is notified when they hit it.' : 'No goals yet — ask your parent to set one!'}</div>}
          </div>
          <GiftsCard child={c} />
          <div className="card"><div className="card-head"><h3>🛍️ Reward shop</h3><span><Coin n={R.coins} /></span></div>
            {shopSection('avatar', 'Avatars', true)}{shopSection('background', 'Backgrounds')}{shopSection('consumable', 'Power-ups')}</div>
        </div>
        <div className="stack">
          <div className="card"><div className="card-head"><h3>📜 Certificates</h3></div>
            {R.certificates.length ? R.certificates.map((ct: any) => (
              <Link key={ct.id} className="rec" to={`/app/certificate/${ct.id}`} style={{ marginBottom: 8 }}><span className="dot" style={{ background: 'linear-gradient(135deg,#f59e0b,#b45309)' }}>{ct.kind === 'year' ? '🎓' : ct.kind === 'exam' ? '🌟' : '📜'}</span>
                <div className="grow"><b>{ct.title}</b><div className="small muted">{ct.subtitle || ''} · {fmtDate(ct.at)}</div></div></Link>))
              : <div className="empty small"><div className="e">📜</div>Master every style in a topic to earn its certificate.</div>}</div>
          <div className="card"><div className="card-head"><h3>🏅 Badges</h3></div><div className="badges">{R.badges.map((b: any) => (
            <div key={b.id || b.name} className={`badge ${b.got ? '' : 'off'}`} title={`${b.desc}${b.at ? ' · ' + fmtDate(b.at) : ''}`}><div className="e">{b.icon}</div><div className="n">{b.name}</div></div>))}</div></div>
          <div className="card"><div className="card-head"><h3>🔔 Recent rewards</h3></div>
            {R.inbox.length ? R.inbox.slice(0, 12).map((e: any, i: number) => (
              <div key={i} className="inbox-row"><span style={{ fontSize: 22 }}>{e.icon || '🎉'}</span><div className="grow"><b className="small">{e.title}</b><div className="small muted">{e.text || ''}</div></div><span className="tiny faint">{fmtDate(e.at)}</span></div>))
              : <div className="small muted">Nothing yet — start a lesson!</div>}</div>
        </div>
      </div>
    </>
  );
}

function ShopItem({ it, R, onBuy }: { it: any; R: any; onBuy: (it: any, action: 'buy' | 'equip') => void }) {
  const owned = R.owned.includes(it.id);
  const eq = R.equipped[it.kind] === it.id;
  const art = it.kind === 'background' ? <span className="art" style={{ background: it.css }} /> : <span className="art">{it.emoji}</span>;
  return (
    <div className={`shop-item ${owned ? 'owned' : ''} ${eq ? 'eq' : ''}`} title={it.desc || ''}>{art}<b className="small">{it.name}</b>
      {it.kind === 'consumable' ? <><button className="btn sm" onClick={() => onBuy(it, 'buy')} aria-label={`Buy ${it.name}`}><Coin n={it.price} /></button><span className="tiny faint">You have {R.freezes}</span></>
        : owned ? <button className={`btn sm ${eq ? 'good' : 'ghost'}`} onClick={() => onBuy(it, 'equip')}>{eq ? 'Equipped ✓' : 'Equip'}</button>
          : <button className={`btn sm ${R.coins >= it.price ? '' : 'ghost'}`} disabled={R.coins < it.price} onClick={() => onBuy(it, 'buy')} aria-label={`Buy ${it.name}`}><Coin n={it.price} /></button>}
    </div>
  );
}

function GoalForm({ child: c, types, close, onDone }: { child: any; types: Record<string, string>; close: () => void; onDone: () => void }) {
  const { toast } = useOverlay();
  const keys = Object.keys(types || {});
  const [type, setType] = useState(keys[0] || 'lessons');
  const [target, setTarget] = useState('10');
  const [reward, setReward] = useState('');
  const [err, setErr] = useState('');
  const submit = async (e: FormEvent) => {
    e.preventDefault();
    try { await api.rewards.createGoal(c.id, { type: type as any, target: Number(target), reward }); close(); toast('Goal created 🎯', 'good'); onDone(); }
    catch (x) { setErr((x as Error).message); }
  };
  return (
    <><h2>New reward goal for {c.name}</h2><p className="muted">Progress is tracked automatically from today. {c.name} gets a celebration the moment it’s achieved.</p>
      <form className="stack" style={{ marginTop: 16 }} onSubmit={submit}>
        <div className="grid2"><label className="field"><span>Goal</span><select className="input" value={type} onChange={(e) => setType(e.target.value)}>{Object.entries(types || {}).map(([k, v]) => <option key={k} value={k}>{v}…</option>)}</select></label>
          <label className="field"><span>Target</span><input className="input" type="number" min={1} value={target} onChange={(e) => setTarget(e.target.value)} required /></label></div>
        <label className="field"><span>Reward</span><input className="input" maxLength={120} value={reward} onChange={(e) => setReward(e.target.value)} placeholder="e.g. Cinema trip, new football, £10 pocket money" required /></label>
        <div className="error">{err}</div>
        <div className="row" style={{ justifyContent: 'flex-end' }}><button type="button" className="btn ghost" onClick={close}>Cancel</button><button className="btn">Create goal</button></div>
      </form></>
  );
}
