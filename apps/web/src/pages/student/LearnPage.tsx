// v1 `/app/learn/:topicId`: the topic explanation page (hero, contents, objectives, key words, sections, live examples, practise).
import { useEffect } from 'react';
import { Link, useParams } from 'react-router';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { useSession } from '../../state/session';
import { AppShell } from '../../layout/AppShell';
import { StyleRow } from '../../features/StyleRow';
import { ErrorBox, Html, Spinner } from '../../ui/bits';
import { TERMS } from '../../lib/format';
import { speak, speakable, stopSpeaking } from '../../lib/speech';
import { useTierOn, useTopicTest } from './topicShared';
/* eslint-disable @typescript-eslint/no-explicit-any */

export default function LearnPage() {
  const { topicId = '' } = useParams(); const s = useSession();
  const t = s.cur?.topics.find((x) => x.id === topicId);
  useEffect(() => { if (t && s.child && s.subject?.id !== t.subject) s.setSubject(t.subject); }, [t?.id, s.child?.id]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => () => { stopSpeaking(); }, []);
  if (!t) return <AppShell title="Learn"><ErrorBox error={new Error('Topic not found')} /></AppShell>;
  return <AppShell title={t.name}><Learn t={t} /></AppShell>;
}

function Learn({ t }: { t: any }) {
  const s = useSession(); const tierOn = useTierOn(); const topicTest = useTopicTest();
  const sub = s.subjectInfo(t.subject); const st = s.strand(t.strand); const c = s.child;
  const q = useQuery({ queryKey: ['learn', t.id], queryFn: () => api.content.learn(t.id) });
  const pr = useQuery({ queryKey: ['progress', c?.id, t.subject], queryFn: () => api.students.progress(c!.id, t.subject), enabled: !!c });
  if (q.isLoading) return <Spinner />;
  if (q.error) return <ErrorBox error={q.error} />;
  const d = q.data; const L = d.content; const secs: any[] = L ? L.sections : [];
  const styles = pr.data?.styles || {};
  const go = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  const listen = () => speak([t.name, ...(L ? [speakable(L.overview), ...secs.map((x) => `${x.title}. ${speakable(x.html)}`)] : [])]);
  const toc = ['Objectives', 'Key words', ...secs.map((x) => x.title), 'Common mistakes', 'Exam tips', 'Practise'];
  const ref = L?.specRef || t.specRef;

  return (
    <div className="learn">
      <Link className="small" to="/app/roadmap">← {sub.name} roadmap</Link>
      <div className="learn-hero" style={{ marginTop: 12, background: `linear-gradient(130deg,color-mix(in srgb,${st.color} 75%,#0f172a),${st.color})` }}>
        <div className="tiny" style={{ opacity: 0.85 }}>{sub.icon} {sub.name} · {st.name} · Year {t.year} · {TERMS[t.term - 1]} term{t.tier === 'H' && tierOn(t.subject) ? ' · Higher tier' : ''}</div>
        <h1>{t.name}</h1>
        {L ? <Html className="prose" style={{ color: 'rgba(255,255,255,.9)' }} html={L.overview} /> : <div className="prose" style={{ color: 'rgba(255,255,255,.9)' }}>{t.summary || ''}</div>}
        <div className="row wrap" style={{ marginTop: 18, position: 'relative', zIndex: 1 }}>
          <button className="btn" style={{ background: '#fff', color: '#0f172a' }} onClick={listen}>🔊 Listen</button>
          {ref && <span className="pill" style={{ background: 'rgba(255,255,255,.18)', color: '#fff' }}>{ref}</span>}
        </div>
      </div>

      {L ? (
        <>
          <nav className="learn-toc" aria-label="Contents">{toc.map((x, i) => <a key={i} href={`#sec-${i}`} onClick={(e) => { e.preventDefault(); go(`sec-${i}`); }}>{x}</a>)}</nav>
          <div className="grid-main" style={{ gridTemplateColumns: '1fr 1fr', marginBottom: 18 }}>
            <div className="card learn-section" id="sec-0"><h3 style={{ marginBottom: 10 }}>🎯 By the end you can…</h3><ul className="tick-list">{L.objectives.map((o: string, i: number) => <Html as="li" key={i} html={o} />)}</ul></div>
            <div className="card learn-section" id="sec-1"><h3 style={{ marginBottom: 10 }}>🔑 Key words</h3><div className="kw-grid" style={{ gridTemplateColumns: '1fr' }}>
              {L.keyWords.map((k: any, i: number) => <div key={i} className="kw"><b>{k.term}</b><Html as="span" html={k.def} /></div>)}</div></div>
          </div>
          {secs.map((x, i) => <div key={i} className="card learn-section" id={`sec-${i + 2}`}><h2><span className="n">{i + 1}</span>{x.title}</h2><Html className="prose" html={x.html} /></div>)}
          <div className="grid-main" style={{ gridTemplateColumns: '1fr 1fr' }}>
            <div className="card learn-section" id={`sec-${secs.length + 2}`}><h3 style={{ marginBottom: 10 }}>⚠️ Common mistakes</h3><ul className="tick-list warn-list">{L.mistakes.map((o: string, i: number) => <Html as="li" key={i} html={o} />)}</ul></div>
            <div className="card learn-section" id={`sec-${secs.length + 3}`}><h3 style={{ marginBottom: 10 }}>⭐ Exam tips</h3><ul className="tick-list tip-list">{L.examTips.map((o: string, i: number) => <Html as="li" key={i} html={o} />)}</ul></div>
          </div>
          {L.realLife && <div className="card" style={{ marginTop: 18 }}><b>🌍 In real life:</b> <Html as="span" className="muted" html={L.realLife} /></div>}
        </>
      ) : <div className="card" style={{ marginBottom: 18 }}><p className="muted" style={{ margin: 0 }}>The full explanation for this topic is being written. Meanwhile, here are the methods and live worked examples.</p></div>}

      <h2 style={{ margin: '28px 0 14px' }}>✍️ Live examples</h2>
      {d.examples.map((x: any, i: number) => (
        <div key={i} className="card learn-section"><div className="tiny" style={{ color: st.color }}>{x.styleName}</div><p className="muted">{x.intro}</p>
          <div className="worked">
            <div className="wq"><Html html={x.html} />{x.diagram && <Html className="diagram" html={x.diagram} />}
              {x.options && <ol type="A" style={{ margin: '8px 0 0' }}>{x.options.map((o: string, j: number) => <Html as="li" key={j} html={o} />)}</ol>}</div>
            <ol>{x.steps.map((o: string, j: number) => <Html as="li" key={j} html={o} />)}</ol>
            <div className="wa">Answer: <Html as="span" html={x.answerHtml} /></div>
          </div></div>))}

      <div className="card pad-lg" id={`sec-${secs.length + 4}`} style={{ marginTop: 20, textAlign: 'center' }}><h2>Ready to practise?</h2>
        <p className="muted">Each lesson: worked example + 10 questions (1 credit). The topic test mixes every style (1 credit).</p>
        {s.child && t.year > s.child.yearGroup && <div className="lock-banner" style={{ marginTop: 12, textAlign: 'left' }}><span style={{ fontSize: 22 }}>🔒</span><div className="small"><b>Year {t.year} topic.</b> Read the explanation now — lessons and the test unlock in Year {t.year}.</div></div>}
        <div style={{ textAlign: 'left', marginTop: 12 }}>{t.styles.map((x: any, i: number) => <StyleRow key={x.id} s={x} i={i} r={styles[x.id]} lockedYear={s.child && t.year > s.child.yearGroup ? t.year : null} />)}</div>
        {s.child && t.year > s.child.yearGroup ? <div style={{ marginTop: 16 }}><span className="lock-pill">🔒 Topic test unlocks in Year {t.year}</span></div> : <button className="btn lg" style={{ marginTop: 16 }} onClick={() => topicTest(t.id)}>📝 Take the topic test</button>}</div>
    </div>
  );
}
