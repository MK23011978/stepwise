// Reference page: data via react-query + @stepwise/api-client, shared actions, overlays and charts.
import { useEffect } from 'react';
import { Link } from 'react-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { useSession } from '../../state/session';
import { useOverlay } from '../../ui/overlays';
import { StudentGate } from '../../features/StudentGate';
import { useLearningActions } from '../../features/actions';
import { CardCheck } from '../../features/payments';
import { Bars, Heatmap, LineChart, Radar, RingLevel } from '../../ui/charts';
import { Coin, ErrorBox, Spinner } from '../../ui/bits';
import { fmtDate, gradeLabel, shortName } from '../../lib/format';
/* eslint-disable @typescript-eslint/no-explicit-any */

export default function DashboardPage() {
  return <StudentGate title="Dashboard" subjectBar>{(c) => <Dashboard child={c} />}</StudentGate>;
}

function Dashboard({ child: c }: { child: any }) {
  const s = useSession(); const subj = s.subject;
  const { celebrate } = useOverlay();
  const { startLesson, startReview } = useLearningActions();
  const q = useQuery({ queryKey: ['overview', c.id, subj.id], queryFn: () => api.students.overview(c.id, subj.id) });
  useEffect(() => { if (q.data?.rewards?.length) celebrate(q.data.rewards); }, [q.data]); // eslint-disable-line react-hooks/exhaustive-deps
  if (q.isLoading) return <Spinner />;
  if (q.error) return <ErrorBox error={q.error} />;
  const o = q.data; const sm = o.summary; const w = s.me!.wallet;
  const earned = sm.badges.filter((b: any) => b.got).length;
  const rec0 = o.recommendations[0];
  const nextExam = o.exams.find((e: any) => e.recommended && !e.best && e.hasContent);
  const gradeColor = sm.predicted == null ? 'var(--ink)' : sm.predicted >= sm.targetGrade ? 'var(--good)' : 'var(--warn)';
  const trial = w && w.freeLessonAvailable && w.cardCheckRequired && !w.freeAccess && w.credits < 1 && sm.lessonsCompleted === 0;

  return (
    <>
      {trial && s.me!.user.role === 'parent' && <TrialBanner name={c.name} onReady={() => rec0 && startLesson(rec0.styleId)} />}
      <div className="card welcome" style={{ marginBottom: 22, background: `radial-gradient(600px 300px at 100% 0, rgba(255,255,255,.18), transparent 60%), linear-gradient(120deg, color-mix(in srgb, ${subj.color} 70%, #0f172a), ${subj.color})` }}>
        <div className="level-ring"><RingLevel level={sm.level} /><div>
          <h2>{s.me!.user.role === 'student' ? 'Hi' : 'Learning for'} {c.name} 👋</h2>
          <p>{subj.icon} {subj.name} · Year {c.yearGroup} · {sm.level.xp} XP · {sm.level.next - sm.level.xp} XP to level {sm.level.level + 1}</p>
          <div className="row wrap" style={{ marginTop: 10, gap: 18 }}><span>🔥 <b>{sm.streak}</b> day streak</span><span>📘 <b>{sm.lessonsCompleted}</b> lessons</span><span>🏅 <b>{earned}</b> badges</span><span>🪙 <b>{sm.coins}</b> coins</span></div>
        </div></div>
        {rec0 && <button className="btn lg" onClick={() => startLesson(rec0.styleId)}>▶ {rec0.reason === 'Needs practice' ? 'Practise' : 'Start'}: {rec0.name}</button>}
      </div>

      {s.me!.user.role === 'parent' && <Approvals />}
      <Missions childId={c.id} />

      {(o.review.dueCount > 0 || o.review.mistakeCount > 0) && (
        <div className="card" style={{ marginBottom: 22, borderLeft: '4px solid #8b5cf6' }}><div className="row wrap spread">
          <div className="row"><span style={{ fontSize: 30 }}>🔁</span><div><b>Time to review!</b><div className="small muted">{o.review.dueCount} topics due for review · {o.review.mistakeCount} past mistakes to fix · review sessions are free</div></div></div>
          <div className="row"><Link className="btn ghost" to="/app/review">See all</Link><button className="btn" onClick={() => startReview()}>Start review</button></div>
        </div></div>
      )}

      <div className="kpis">
        <div className="card kpi"><div className="ico" style={{ background: 'var(--good-soft)' }}>✅</div><div className="v">{sm.correct}</div><div className="l">Correct answers</div></div>
        <div className="card kpi"><div className="ico" style={{ background: 'var(--brand-soft)' }}>🎯</div><div className="v">{sm.accuracy == null ? '–' : `${sm.accuracy}%`}</div><div className="l">Accuracy (in scope)</div></div>
        <div className="card kpi"><div className="ico" style={{ background: 'var(--warn-soft)' }}>🧩</div><div className="v">{sm.mastered}</div><div className="l">Styles mastered · {sm.coverage}% covered</div></div>
        <div className="card kpi"><div className="ico" style={{ background: '#f3e8ff' }}>🎓</div><div className="v" style={{ color: gradeColor }}>{gradeLabel(sm.predicted)} <span className="faint" style={{ fontSize: 18 }}>/ target {sm.targetGrade}</span></div><div className="l">Predicted {subj.name} grade</div></div>
      </div>

      <div className="grid-main">
        <div className="stack">
          <div className="card"><div className="card-head"><h3>{subj.name} exam results</h3><Link to="/app/exams" className="small">All tests →</Link></div>
            <LineChart points={sm.exams.map((e: any, i: number) => ({ label: `#${i + 1}`, title: e.name, value: e.pct, tag: e.grade }))} /></div>
          <div className="card"><div className="card-head"><h3>All subjects</h3></div>
            <Bars items={o.overall.strands.filter((x: any) => s.enrolled(c).some((e) => e.id === x.id)).map((x: any) => ({ name: `${x.icon} ${x.name}`, value: x.accuracy, color: x.color }))} /></div>
          <div className="card"><div className="card-head"><h3>Activity · last 12 weeks</h3><span className="small muted">{o.activity.reduce((t: number, d: any) => t + d.n, 0)} questions</span></div><Heatmap days={o.activity} /></div>
        </div>
        <div className="stack">
          <div className="card"><div className="card-head"><h3>Recommended next</h3></div><div className="stack">
            {o.recommendations.length ? o.recommendations.map((r: any) => { const t = s.topicOfStyle(r.styleId); const st = s.strand(t?.strand);
              return <button key={r.styleId} className="rec" onClick={() => startLesson(r.styleId)}><span className="dot" style={{ background: st.color }}>{st.icon || '#'}</span>
                <div className="grow"><b>{r.name}</b><div className="small muted">{r.topic} · Y{t?.year}</div></div><span className={`pill ${r.reason === 'Needs practice' ? 'warn' : 'brand'}`}>{r.reason}</span></button>; })
              : <div className="empty small">All caught up! Explore the roadmap.</div>}
          </div></div>
          <div className="card"><div className="card-head"><h3>Strength by area</h3></div><div style={{ display: 'flex', justifyContent: 'center' }}>
            <Radar items={sm.strands.map((x: any) => ({ name: x.name, short: shortName(x.name), value: x.accuracy, color: x.color }))} /></div></div>
          {o.goals.length > 0 && <div className="card"><div className="card-head"><h3>🎯 Reward goals</h3><Link className="small" to="/app/rewards">View</Link></div>
            {o.goals.map((g: any) => <div key={g.id} style={{ margin: '10px 0' }}><div className="row spread small"><b>{g.label} {g.target}</b><span className="muted">{g.progress}/{g.target}</span></div>
              <div className="bar"><i style={{ width: `${g.pct}%`, background: '#f59e0b' }} /></div><div className="small muted" style={{ marginTop: 4 }}>🎁 {g.reward}</div></div>)}</div>}
          <div className="card"><div className="card-head"><h3>Next free lesson</h3>🎁</div><div className="small muted">Complete <b>{sm.nextReward}</b> more lesson{sm.nextReward === 1 ? '' : 's'} to earn a free lesson for the family wallet.</div>
            <div className="bar" style={{ marginTop: 10 }}><i style={{ width: `${((10 - sm.nextReward) / 10) * 100}%`, background: 'var(--good)' }} /></div></div>
          {nextExam && <div className="card" style={{ borderLeft: '4px solid var(--warn)' }}><div className="tiny" style={{ color: '#b45309' }}>Next checkpoint</div><h3 style={{ margin: '6px 0' }}>{nextExam.name}</h3>
            <p className="small muted" style={{ margin: '0 0 14px' }}>{nextExam.questions} questions · {nextExam.minutes} minutes · 1 credit</p><Link className="btn sm" to="/app/exams">View exams</Link></div>}
        </div>
      </div>
    </>
  );
}

function TrialBanner({ name, onReady }: { name: string; onReady: () => void }) {
  const { openModal, toast } = useOverlay(); const s = useSession();
  return (
    <div className="card trial-card" style={{ margin: '0 0 22px', maxWidth: 'none' }}><div className="row wrap spread"><div style={{ maxWidth: 620 }}><div className="tiny">Free first lesson</div>
      <p style={{ fontSize: 17, margin: '8px 0 0' }}>Pay £0 to start {name}’s first lesson. This quick check helps us prevent bots and misuse of free trials. Your card won’t be charged.</p></div>
      <button className="btn lg" onClick={() => openModal((close) => <CardCheck onCancel={close} onDone={async (r) => { close(); await s.refresh(); toast(r.message, 'good'); onReady(); }} />)}>Continue to start your free trial lesson</button></div></div>
  );
}

function Missions({ childId }: { childId: string }) {
  const qc = useQueryClient(); const { toast, celebrate } = useOverlay(); const s = useSession();
  const m = useQuery({ queryKey: ['missions', childId], queryFn: () => api.students.missions(childId) });
  const t = useQuery({ queryKey: ['tasks', childId], queryFn: () => api.tasks.list(childId) });
  if (!m.data || !t.data) return null;
  const doneN = m.data.missions.filter((x: any) => x.done).length;
  const todays = t.data.today.filter((x: any) => x.state !== 'done');
  const claim = async (missionId?: string) => {
    try { const r = await api.students.claimMission(childId, missionId); toast(`+${r.coins} coins 🪙`, 'good'); celebrate(r.rewards); qc.invalidateQueries({ queryKey: ['missions', childId] }); s.refresh(); }
    catch (e) { toast((e as Error).message, 'bad'); }
  };
  return (
    <div className="card" style={{ marginBottom: 22 }}>
      <div className="card-head"><div><h3>🎯 Today’s missions</h3><div className="small muted">{doneN}/{m.data.missions.length} done · mission streak 🔥 {m.data.streak} · resets at midnight</div></div>
        {m.data.coinsAvailable > 0 && <button className="btn sm good" onClick={() => claim()}>Claim <Coin n={m.data.coinsAvailable} /></button>}</div>
      <div className="missions">{m.data.missions.map((x: any) => (
        <div key={x.id} className={`mission ${x.done ? 'done' : ''}`}><div className="top"><span className="ic">{x.icon}</span><div className="grow"><b className="small">{x.title}</b><div className="small muted">{x.progress}/{x.target} · <Coin n={x.coins} /></div></div>
          {x.claimed ? <span className="pill good">✓</span> : x.done ? <button className="btn sm good" onClick={() => claim(x.id)}>Claim</button> : null}</div>
          <div className="bar thin"><i style={{ width: `${(x.progress / x.target) * 100}%`, background: x.done ? 'var(--good)' : 'var(--brand)' }} /></div></div>))}</div>
      <div className="chest"><span style={{ fontSize: 28 }}>🧰</span><div className="grow"><b>Treasure chest</b><div className="small">Finish all {m.data.missions.length} missions for +{m.data.bonus} bonus coins</div></div>
        {m.data.bonusClaimed ? <span className="pill good">Opened ✓</span> : m.data.allDone ? <button className="btn sm" onClick={() => claim()}>Open!</button> : <span className="small">{doneN}/{m.data.missions.length}</span>}</div>
      {todays.length > 0 && <><div className="tiny muted" style={{ margin: '16px 0 8px' }}>Today’s tasks</div>
        {todays.slice(0, 5).map((x: any) => <div key={x.id + x.date} className="row spread small" style={{ padding: '6px 0', borderBottom: '1px dashed var(--line)' }}>
          <span>{x.state === 'missed' ? '⚠️' : x.state === 'waiting' ? '⏳' : '📌'} <b>{x.title}</b> <span className="muted">{x.dueTime ? `· ${x.dueTime}` : ''} {x.coins ? `· ${x.coins} coins` : ''}</span></span><Link to="/app/planner?tab=tasks">Open</Link></div>)}</>}
    </div>
  );
}

function Approvals() {
  const qc = useQueryClient(); const { toast } = useOverlay(); const s = useSession();
  const a = useQuery({ queryKey: ['approvals'], queryFn: () => api.tasks.approvals() });
  if (!a.data?.count) return null;
  const act = async (t: any, reject: boolean) => { await api.tasks.approve(t.studentId, t.id, { date: t.date, reject }); toast(reject ? 'Sent back' : 'Approved — coins sent', reject ? '' : 'good'); qc.invalidateQueries({ queryKey: ['approvals'] }); };
  return (
    <div className="card approvals" style={{ marginBottom: 22 }}><div className="card-head"><h3>⏳ Waiting for your approval ({a.data.count})</h3></div>
      {a.data.tasks.map((t: any) => <div key={t.id + t.date} className="ticket"><span style={{ fontSize: 22 }}>📌</span><div className="grow"><b>{t.studentName}</b> finished <b>{t.title}</b><div className="small muted">{fmtDate(t.date)}{t.coins ? ` · ${t.coins} coins on approval` : ''}</div></div>
        <button className="btn sm good" onClick={() => act(t, false)}>Approve</button><button className="btn sm ghost" onClick={() => act(t, true)}>Send back</button></div>)}
      {(a.data.friends || []).map((f: any) => <div key={f.id + f.studentId} className="ticket"><span style={{ fontSize: 22 }}>👋</span><div className="grow"><b>{f.studentName}</b> wants to be friends with <b>{f.friend.name}</b>
        <div className="small muted">Year {f.friend.yearGroup} · they can chat once both parents approve</div></div>
        <button className="btn sm good" onClick={() => api.social.approve(f.studentId, f.id, true).then(() => { toast('Approved', 'good'); qc.invalidateQueries({ queryKey: ['approvals'] }); })}>Approve</button>
        <button className="btn sm ghost" onClick={() => api.social.approve(f.studentId, f.id, false).then(() => qc.invalidateQueries({ queryKey: ['approvals'] }))}>Decline</button></div>)}
      {a.data.tickets.map((t: any) => <div key={t.id} className="ticket"><span style={{ fontSize: 22 }}>{t.icon}</span><div className="grow"><b>{t.studentName}</b> wants a <b>£{t.value} {t.cardName}</b> gift card
        <div className="small muted">{t.coins} coins · {fmtDate(t.createdAt)} · {t.status}{t.note ? ` · “${t.note}”` : ''}</div></div>
        <Link className="btn sm" to="/app/rewards" onClick={() => s.setChildId(t.studentId)}>Review</Link></div>)}
    </div>
  );
}
