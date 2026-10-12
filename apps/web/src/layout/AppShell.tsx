// Responsive shell: sidebar on desktop, slide-in menu + bottom tab bar on mobile (mobile-first).
import { useState, type ReactNode } from 'react';
import { Link, NavLink, useNavigate } from 'react-router';
import { useSession } from '../state/session';
import { useOverlay } from '../ui/overlays';
import { Avatar, Coin, Icon, Logo } from '../ui/bits';
import { store } from '../lib/format';
import { YearSwitcher } from '../features/yearLock';
import { OnlinePill, useSocial } from '../features/social';

const STUDENT_NAV: [string, string, string][] = [
  ['/app', 'home', 'Dashboard'], ['/app/planner', 'calendar', 'Planner & Tasks'], ['/app/report', 'report', 'Report & Plan'], ['/app/roadmap', 'map', 'Roadmap & Learn'],
  ['/app/progress', 'chart', 'Progress'], ['/app/review', 'repeat', 'Review'], ['/app/exams', 'exam', 'Tests & Mocks'], ['/app/rewards', 'gift', 'Rewards'],
];
const ADMIN_NAV: [string, string, string][] = [
  ['/admin', 'chart', 'Overview'], ['/admin/users', 'users', 'Users'], ['/admin/payments', 'card', 'Payments'], ['/admin/tickets', 'ticket', 'Gift tickets'], ['/admin/curriculum', 'book', 'Curriculum'], ['/admin/reports', 'flag', 'Chat reports'],
];
const STUDENT_ONLY: [string, string, string][] = [['/app/friends', 'chat', 'Friends & Chat']];
const BOTTOM: [string, string, string][] = [['/app', 'home', 'Home'], ['/app/roadmap', 'map', 'Learn'], ['/app/planner', 'calendar', 'Planner'], ['/app/review', 'repeat', 'Review'], ['/app/rewards', 'gift', 'Rewards']];

export function AppShell({ title, admin = false, subjectBar = false, children }: { title: string; admin?: boolean; subjectBar?: boolean; children: ReactNode }) {
  const s = useSession(); const navigate = useNavigate(); const { openModal } = useOverlay();
  const [menu, setMenu] = useState(false); const [dd, setDd] = useState(false);
  const me = s.me!.user; const c = s.child; const role = me.role;
  const social = useSocial(role === 'student' && !admin);
  const nav2: [string, string, string][] = admin ? [['/app/settings', 'cog', 'Settings']]
    : [...(role === 'parent' ? [['/app/family', 'users', 'Family'], ['/app/billing', 'wallet', 'Billing']] as [string, string, string][] : []), ['/app/help', 'help', 'Help'], ...(role === 'admin' ? [['/admin', 'shield', 'Admin']] as [string, string, string][] : [])];
  const cycleTheme = () => {
    const t = document.documentElement.dataset.theme; const next = t === 'dark' ? 'light' : t === 'light' ? null : 'dark';
    if (next) { document.documentElement.dataset.theme = next; store.set('theme', next); } else { delete document.documentElement.dataset.theme; store.del('theme'); }
  };
  const pickChild = () => openModal((close) => (
    <><h2>Switch child</h2><p className="muted">Choose whose learning to view.</p><div className="stack" style={{ marginTop: 18 }}>
      {s.me!.children.map((k) => <button key={k.id} className="rec" onClick={() => { s.setChildId(k.id); close(); }}><Avatar u={k} /><div className="grow"><b>{k.name}</b>
        <div className="small muted">Year {k.yearGroup} · {k.tier === 'F' ? 'Foundation' : 'Higher'}</div></div>{k.id === s.childId && <span className="pill good">Active</span>}</button>)}
      <button className="btn ghost block" onClick={() => { close(); navigate('/app/family?add=1'); }}>+ Add a child</button></div></>));
  const W = s.me!.wallet;
  return (
    <div className="shell">
      {menu && <div className="scrim" onClick={() => setMenu(false)} />}
      <aside className={`side ${menu ? 'open' : ''}`} onClick={() => setMenu(false)}>
        <Logo />
        <nav>{(admin ? ADMIN_NAV : role === 'student' ? [...STUDENT_NAV, ...STUDENT_ONLY] : STUDENT_NAV).map(([to, i, l]) => <NavLink key={to} to={to} end={to === '/app' || to === '/admin'} className={({ isActive }) => (isActive ? 'on' : '')}><Icon name={i} />{l}</NavLink>)}</nav>
        <div className="nav-label">{admin ? 'Switch' : 'Account'}</div>
        <nav>{nav2.map(([to, i, l]) => <NavLink key={to} to={to} end className={({ isActive }) => (isActive ? 'on' : '')}><Icon name={i} />{l}</NavLink>)}</nav>
        <div className="bottom">
          {W && <div className="wallet">{W.freeAccess ? <><div className="tiny" style={{ color: '#86efac' }}>Free access</div><div style={{ color: '#fff', fontWeight: 700, marginTop: 4 }}>✨ Unlimited lessons</div></>
            : <><div className="tiny" style={{ color: '#a5b4fc' }}>Lesson credits</div><div className="row spread"><b>{W.credits}</b>{role === 'parent' && <Link className="btn sm" to="/app/billing">Top up</Link>}</div>
              {W.freeLessonAvailable && <div className="small" style={{ color: '#86efac', marginTop: 4 }}>🎁 First lesson free</div>}</>}</div>}
          {!admin && role === 'student' && c && <div style={{ margin: '0 0 8px' }} onClick={(e) => e.stopPropagation()}><YearSwitcher child={c} compact /></div>}
          {!admin && role !== 'admin' && <button className="child-switch" onClick={(e) => { e.stopPropagation(); if (role === 'parent') pickChild(); }}>
            {c ? <Avatar u={c} /> : <span className="avatar" style={{ background: '#334155' }}>+</span>}
            <div className="grow"><div style={{ color: '#fff', fontWeight: 600 }}>{c ? c.name : 'Add a child'}</div><div className="small" style={{ color: '#64748b' }}>{c ? `Year ${c.yearGroup} · ${c.tier === 'F' ? 'Foundation' : 'Higher'}` : 'Get started'}{role === 'parent' ? ' · switch' : ''}</div></div>{role === 'parent' ? '›' : ''}</button>}
        </div>
      </aside>
      <div className="main">
        <header className="topbar">
          <button className="menu-btn" aria-label="Menu" onClick={() => setMenu(true)}><Icon name="menu" size={22} /></button>
          <h2>{title}</h2><div className="grow" />
          {role === 'student' && !admin && <OnlinePill data={social.data} />}
          {c && !admin && <Link className="pill" to="/app/rewards" title="Coins"><Coin n={c.coins || 0} /></Link>}
          <div className="dropdown">
            <button className="row link" style={{ color: 'var(--ink)' }} onClick={() => setDd((x) => !x)}><Avatar u={me} /><span className="small" style={{ fontWeight: 600 }}>{me.name.split(' ')[0]}</span> ▾</button>
            {dd && <div className="dropdown-menu" onMouseLeave={() => setDd(false)}>
              <div style={{ padding: '10px 12px' }}><b>{me.name}</b><div className="small muted">{me.email || '@' + me.username} · {role}</div></div><hr />
              <Link to="/app/settings" onClick={() => setDd(false)}><Icon name="cog" size={16} /> Settings</Link>
              {role === 'parent' && <Link to="/app/billing" onClick={() => setDd(false)}><Icon name="wallet" size={16} /> Billing</Link>}
              <button onClick={cycleTheme}>🌓 Change theme</button><hr />
              <button onClick={async () => { await s.signOut(); navigate('/'); }}>↩ Sign out</button></div>}
          </div>
        </header>
        <main className="content">
          {subjectBar && c && <div className="subject-bar">{s.enrolled().map((x) => <button key={x.id} className={`subject-pill ${x.id === s.subject?.id ? 'on' : ''}`} style={{ ['--c' as string]: x.color }} onClick={() => s.setSubject(x.id)}><span className="e">{x.icon}</span>{x.name}</button>)}</div>}
          {children}
        </main>
      </div>
      {!admin && <nav className="bottom-nav" aria-label="Main">{BOTTOM.map(([to, i, l]) => <NavLink key={to} to={to} end={to === '/app'} className={({ isActive }) => (isActive ? 'on' : '')}><Icon name={i} />{l}</NavLink>)}</nav>}
    </div>
  );
}
