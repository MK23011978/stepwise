// Sign in / create parent account (v1 `authPage(mode)`); mode comes from the path.
import { useState, type FormEvent } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router';
import { api } from '../../lib/api';
import { useSession } from '../../state/session';
import { Logo, Spinner } from '../../ui/bits';
/* eslint-disable @typescript-eslint/no-explicit-any */

export default function AuthPage() {
  const s = useSession(); const loc = useLocation(); const navigate = useNavigate();
  const mode: 'login' | 'register' = loc.pathname === '/register' ? 'register' : 'login';
  const from = (loc.state as any)?.from as string | undefined;
  const [f, setF] = useState({ name: '', login: '', email: '', password: '' });
  const [err, setErr] = useState(''); const [busy, setBusy] = useState(false);
  const set = (k: keyof typeof f, v: string) => setF((x) => ({ ...x, [k]: v }));

  if (s.loading && !busy) return <Spinner />;
  if (s.me && !busy) return <Navigate to={s.me.user.role === 'admin' ? '/admin' : '/app'} replace />;

  const submit = async (e: FormEvent) => {
    e.preventDefault(); setBusy(true); setErr('');
    try {
      const r: any = mode === 'login' ? await api.auth.login({ login: f.login, password: f.password }) : await api.auth.register({ name: f.name, email: f.email, password: f.password });
      await s.refresh();
      const role = r?.user?.role;
      navigate(role === 'admin' ? '/admin' : mode === 'register' ? '/app/family?add=1' : from && from.startsWith('/app') ? from : '/app', { replace: true });
    } catch (e2) { setErr((e2 as Error).message); setBusy(false); }
  };

  return (
    <div className="auth-wrap">
      <div className="auth-art"><Logo />
        <div><h2 style={{ fontSize: 40, fontWeight: 800, lineHeight: 1.1, letterSpacing: '-.03em' }}>Five years.<br />One clear path<br />to top grades.</h2>
          <p style={{ color: '#a5b4fc', maxWidth: 420, fontSize: 17 }}>Lessons, reviews, tests and mocks from Year 7 to the GCSE exam hall.</p></div>
        <div className="small" style={{ color: '#64748b' }}>Students: sign in with the username your parent created.</div></div>
      <div className="auth-form"><div className="auth-card">
        <h1>{mode === 'login' ? 'Welcome back' : 'Create a parent account'}</h1>
        <p className="muted">{mode === 'login' ? 'Parents sign in with email; students with their username.' : 'Your child’s first lesson is free.'}</p>
        <div className="tabs">
          <button type="button" className={mode === 'login' ? 'on' : ''} onClick={() => { setErr(''); navigate('/login', { state: loc.state }); }}>Sign in</button>
          <button type="button" className={mode === 'register' ? 'on' : ''} onClick={() => { setErr(''); navigate('/register', { state: loc.state }); }}>Create account</button>
        </div>
        <form className="stack" onSubmit={submit}>
          {mode === 'register' && <label className="field"><span>Your name</span><input className="input" name="name" autoComplete="name" required value={f.name} onChange={(e) => set('name', e.target.value)} /></label>}
          {mode === 'login'
            ? <label className="field"><span>Email or username</span><input className="input" name="login" autoComplete="username" required value={f.login} onChange={(e) => set('login', e.target.value)} /></label>
            : <label className="field"><span>Email</span><input className="input" name="email" type="email" autoComplete="email" required value={f.email} onChange={(e) => set('email', e.target.value)} /></label>}
          <label className="field"><span>Password</span><input className="input" type="password" name="password" autoComplete={mode === 'login' ? 'current-password' : 'new-password'} minLength={mode === 'login' ? 1 : 8} required value={f.password} onChange={(e) => set('password', e.target.value)} /></label>
          <div className="error" role="alert">{err}</div>
          <button className="btn block lg" disabled={busy}>{mode === 'login' ? 'Sign in' : 'Create account'}</button>
        </form>
        <p className="small faint" style={{ marginTop: 18 }}><Link to="/">← Back to home</Link></p>
      </div></div>
    </div>
  );
}
