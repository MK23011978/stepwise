// Public marketing page (v1 route `/`): hero with a live worked example, subjects, features, programme, pricing.
import { useMemo, type MouseEvent } from 'react';
import { Link } from 'react-router';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { useSession } from '../../state/session';
import { Avatar, Html, Logo, Spinner } from '../../ui/bits';
import { money } from '../../lib/format';
/* eslint-disable @typescript-eslint/no-explicit-any */

const GRADS = ['linear-gradient(140deg,#0ea5a4,#2dd4bf)', 'linear-gradient(140deg,#3b6cf6,#5b8cff)', 'linear-gradient(140deg,#7c3aed,#a78bfa)', 'linear-gradient(140deg,#e2557d,#f59e0b)', 'linear-gradient(140deg,#0f172a,#334155)'];
const YEAR_TAG: Record<number, string> = { 7: 'First steps', 8: 'Foundations', 9: 'Building blocks', 10: 'GCSE core', 11: 'Exam year' };
const FEATURES: [string, string, string, string][] = [
  ['📖', '#e8eeff', 'Clear topic explanations', 'Every topic has a full teaching page: key words, step-by-step methods, worked examples, common mistakes and exam tips.'],
  ['🎧', '#f3e8ff', 'Voice-led lessons', 'Each lesson opens with a spoken worked example, then ten questions with hints and full solutions.'],
  ['🔁', '#dcfce7', 'Spaced review', 'Past questions come back at the right time, and every mistake goes into a bank to retry until it sticks.'],
  ['📝', '#fef3c7', 'Tests, checkpoints & mocks', 'Topic tests, termly checkpoints and full GCSE mocks — with every wrong answer explained afterwards.'],
  ['🏆', '#fee2e2', 'Rewards that motivate', 'XP, levels, coins, a reward shop, badges, certificates, free lessons at milestones and goals set by parents.'],
  ['👨‍👩‍👧', '#e0f2fe', 'One family account', 'Up to six children, each with their own login, year, subjects and targets. One shared wallet at £1 per lesson.'],
];

function scrollTo(e: MouseEvent<HTMLAnchorElement>) {
  e.preventDefault();
  const id = e.currentTarget.getAttribute('href') || '';
  document.querySelector(id)?.scrollIntoView({ behavior: 'smooth' });
}

export default function LandingPage() {
  const s = useSession();
  if (!s.cur) return <Spinner />;
  return <Landing />;
}

function Landing() {
  const s = useSession(); const cur = s.cur!; const me = s.me?.user;
  const goApp = me ? (me.role === 'admin' ? '/admin' : '/app') : '/register';
  const styleCount = cur.topics.reduce((t, x) => t + x.styles.length, 0);
  const yrs = cur.years.map((y) => ({ y, topics: cur.topics.filter((t) => t.year === y) }));
  return (
    <>
      <header className="site-nav"><Logo />
        <nav className="nav-links"><a href="#subjects" onClick={scrollTo}>Subjects</a><a href="#journey" onClick={scrollTo}>Programme</a><a href="#how" onClick={scrollTo}>How it works</a><a href="#pricing" onClick={scrollTo}>Pricing</a></nav>
        <div className="grow" />
        {me ? <><Link to={goApp}>Dashboard</Link><Avatar u={me} /></>
          : <><Link to="/login">Sign in</Link><Link className="btn sm" to="/register" style={{ color: '#fff', textTransform: 'none', letterSpacing: 0 }}>Start free</Link></>}
      </header>

      <section className="hero"><div className="hero-inner">
        <div>
          <span className="pill" style={{ background: 'rgba(255,255,255,.1)', color: '#c7d2fe' }}>Year 7 → GCSE · {cur.subjects.length} subjects · Edexcel Maths & AQA</span>
          <h1 style={{ marginTop: 18 }}>Start early.<br /><span className="accent">Finish strong.</span></h1>
          <p className="lead">A five-year, step-by-step programme from Year 7 to the GCSE exams. Clear topic explanations, spoken worked examples, endless practice, spaced review of past questions, checkpoints, mock exams — and rewards that keep children coming back.</p>
          <div className="row wrap"><Link className="btn lg" to={goApp}>{me ? 'Go to dashboard' : 'Start your free lesson'}</Link><a className="btn lg ghost" href="#subjects" onClick={scrollTo}>See the subjects</a></div>
          <div className="hero-badges"><div><b>{cur.subjects.length}</b>subjects</div><div><b>{cur.topics.length}</b>topics</div><div><b>{styleCount}</b>question styles</div><div><b>£1</b>per lesson</div></div>
        </div>
        <HeroDemo />
      </div></section>

      <section className="section" id="subjects"><div className="section-inner">
        <h2>Every core GCSE subject</h2><p className="sub">Maths follows Edexcel 1MA1; the other subjects follow the AQA specifications. Years 7–9 build the foundations, Years 10–11 cover the full GCSE.</p>
        <div className="subject-grid">{cur.subjects.map((x) => (
          <div key={x.id} className="subject-card" style={{ background: `linear-gradient(140deg,${x.color},color-mix(in srgb,${x.color} 55%,#0f172a))` }}><span className="e">{x.icon}</span>
            <div><b>{x.name}</b><div className="small" style={{ opacity: 0.85 }}>{x.board} {x.spec || ''} · {s.topicsOf(x.id).length} topics</div></div></div>))}</div>
      </div></section>

      <section className="section alt" id="features"><div className="section-inner">
        <h2>Everything a GCSE year needs</h2><p className="sub">Built around the exam specifications and the way good tutors actually teach.</p>
        <div className="feature-grid">{FEATURES.map(([e, bg, t, d]) => <div key={t} className="feature"><div className="ic" style={{ background: bg }}>{e}</div><h3>{t}</h3><p>{d}</p></div>)}</div>
      </div></section>

      <section className="section" id="journey"><div className="section-inner">
        <h2>The Stepwise programme</h2><p className="sub">Each year has three terms of topics and ends with an exam. Students can always revisit earlier years.</p>
        <div className="journey" style={{ gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))' }}>{yrs.map(({ y, topics }, i) => (
          <div key={y} className="journey-card" style={{ background: GRADS[i % GRADS.length] }}>
            <div className="tag">{YEAR_TAG[y] || ''}</div><h3>Year {y}</h3>
            <div className="small" style={{ opacity: 0.85 }}>{topics.length} topics · {new Set(topics.map((t) => t.subject)).size} subjects</div>
            <ul>{topics.filter((t) => t.subject === 'maths').slice(0, 4).map((t) => <li key={t.id}>{t.name}</li>)}<li>+ {Math.max(0, topics.length - 4)} more</li></ul></div>))}</div>
      </div></section>

      <section className="section alt" id="how"><div className="section-inner">
        <h2>How it works</h2><p className="sub">From sign-up to the first lesson in under two minutes.</p>
        <div className="steps3">
          <div><div className="n">1</div><h3>Create a parent account</h3><p>Add your child with their year group, subjects and target grades. They get their own login.</p></div>
          <div><div className="n">2</div><h3>Start a free trial lesson</h3><p>Your child jumps straight into a real lesson, completely free. A card is needed to sign up, but it won’t be charged.</p></div>
          <div><div className="n">3</div><h3>Keep learning, at your pace</h3><p>Carry on at £1 per lesson whenever it suits you. No subscription, credits never expire.</p></div>
        </div>
      </div></section>

      <section className="section" id="pricing"><div className="section-inner">
        <h2>Simple pricing</h2><p className="sub">Every lesson, topic test and checkpoint costs £1. Review sessions are free. Every 10 lessons completed earns a free one.</p>
        <div className="price-grid">{cur.pricing.packs.map((p: any, i: number) => (
          <div key={p.id} className={`price ${i === 1 ? 'featured' : ''}`}>{p.tag && <span className="pill brand ribbon">{p.tag}</span>}
            <div className="tiny muted">{p.label}</div><div className="amt">{money(p.price)}</div><div className="muted small">{p.credits + p.bonus} lesson credits</div>
            <ul><li>Any subject, any child in the family</li><li>Topic explanation + 10 questions per lesson</li><li>Free spaced-review sessions</li><li>Credits never expire</li></ul>
            <Link className={`btn block ${i === 1 ? '' : 'ghost'}`} to={goApp}>{me ? 'Go to dashboard' : 'Start with a free lesson'}</Link></div>))}</div>
      </div></section>

      <footer className="footer"><div className="section-inner"><div><Logo /><div style={{ marginTop: 10 }}>GCSE success, one step at a time.</div></div>
        <div>© {new Date().getFullYear()} Stepwise · Maths: Edexcel 1MA1 · Other subjects: AQA</div></div></footer>
    </>
  );
}

function HeroDemo() {
  const s = useSession(); const cur = s.cur!;
  const sid = useMemo(() => {
    const ids = cur.topics.filter((t) => t.subject === 'maths' && t.year >= 9).flatMap((t) => t.styles.map((x: any) => x.id));
    return ids[Math.floor(Math.random() * ids.length)] as string | undefined;
  }, [cur]);
  const q = useQuery({ queryKey: ['sample', sid], queryFn: () => api.content.sample(sid!), enabled: !!sid, staleTime: Infinity, retry: false });
  if (!sid || q.error) return null;
  if (!q.data) return <div className="hero-card"><Spinner /></div>;
  const d = q.data; const t = s.topicOfStyle(sid);
  return (
    <div className="hero-card">
      <div className="row spread"><span className="tiny" style={{ color: '#93c5fd' }}>Worked example</span><span className="pill" style={{ background: 'rgba(255,255,255,.1)', color: '#cbd5e1' }}>{t?.name}</span></div>
      <Html className="q" html={d.example.html} />
      {d.example.diagram && <Html className="diagram" style={{ color: '#e2e8f0' }} html={d.example.diagram} />}
      {d.example.steps.slice(0, 4).map((st: string, i: number) => <div key={i} className="step" style={{ animationDelay: `${0.4 + i * 0.5}s` }}><i>{i + 1}</i><Html html={st} /></div>)}
    </div>
  );
}
