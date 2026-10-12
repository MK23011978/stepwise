// Admin curriculum map (v1 #/admin/curriculum): subject pills, per-year topic tables, explanation status, style previews.
import { useState } from 'react';
import { Link } from 'react-router';
import { useSession } from '../../state/session';
import { useOverlay } from '../../ui/overlays';
import { AppShell } from '../../layout/AppShell';
import { Spinner } from '../../ui/bits';
import { shortName, store, TERMS } from '../../lib/format';
import { SamplePreview } from './SamplePreview';
/* eslint-disable @typescript-eslint/no-explicit-any */

export default function AdminCurriculumPage() {
  return <AppShell title="Curriculum" admin><Curriculum /></AppShell>;
}

function Curriculum() {
  const s = useSession(); const { openModal } = useOverlay();
  const [pick, setPick] = useState<string>(store.get('adminSubject', 'maths'));
  const cur = s.cur;
  if (!cur) return <Spinner />;
  const sub = cur.subjects.some((x) => x.id === pick) ? pick : cur.subjects[0]?.id;
  const learn = new Set(cur.learnAvailable);
  const ts = s.topicsOf(sub);
  const choose = (id: string) => { store.set('adminSubject', id); setPick(id); };
  const preview = (st: any) => openModal((close) => <SamplePreview styleId={st.id} name={st.name} close={close} />, { wide: true });

  return (
    <>
      <div className="page-head"><h1>Curriculum map</h1><p>{cur.subjects.length} subjects · {cur.topics.length} topics · {cur.topics.reduce((t, x) => t + x.styles.length, 0)} styles · {learn.size} topic explanations. Click a style to preview a generated question, or a topic to edit its content.</p></div>
      <div className="subject-bar">{cur.subjects.map((x) => (
        <button key={x.id} className={`subject-pill ${x.id === sub ? 'on' : ''}`} style={{ ['--c' as string]: x.color }} onClick={() => choose(x.id)}>
          <span className="e">{x.icon}</span>{x.name} <span className="small" style={{ opacity: 0.7 }}>{s.topicsOf(x.id).length}</span></button>))}</div>
      {cur.years.filter((y) => ts.some((t) => t.year === y)).map((y) => (
        <div key={y}>
          <div className="strand-head">Year {y}</div>
          <div className="card"><div className="table-wrap"><table className="data"><thead><tr><th>Term</th><th>Area</th><th>Topic</th><th>Tier</th><th>Explanation</th><th>Styles</th></tr></thead><tbody>
            {ts.filter((t) => t.year === y).sort((a, b) => a.term - b.term).map((t) => { const st = s.strand(t.strand);
              return (
                <tr key={t.id}><td>{TERMS[t.term - 1]}</td>
                  <td><span className="pill" style={{ background: `${st.color}22`, color: st.color }}>{shortName(st.name)}</span></td>
                  <td><Link to={`/admin/content/${t.id}`}><b>{t.name}</b></Link></td><td>{t.tier}</td>
                  <td>{learn.has(t.id) ? <Link className="pill good" to={`/app/learn/${t.id}`}>✓ view</Link> : <span className="pill warn">pending</span>}</td>
                  <td className="small">{t.styles.map((x: any, i: number) => <span key={x.id}>{i > 0 && ' · '}<button className="link small" onClick={() => preview(x)}>{x.name}</button></span>)}</td>
                </tr>); })}
          </tbody></table></div></div>
        </div>))}
    </>
  );
}
