// Admin content editor for one topic: topic details, each style (name/intro + question bank or generator preview),
// and the teaching page as JSON. Uses api.admin.contentTopic / patchTopic / patchStyle / items / addItem / patchItem / deleteItem / putLearn.
import { useState, type FormEvent } from 'react';
import { Link, useParams } from 'react-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { useOverlay } from '../../ui/overlays';
import { AppShell } from '../../layout/AppShell';
import { ErrorBox, Html, Spinner } from '../../ui/bits';
import { fmtDateTime } from '../../lib/format';
import { ItemForm } from './ItemForm';
import { SampleBody } from './SamplePreview';
/* eslint-disable @typescript-eslint/no-explicit-any */

export default function AdminContentPage() {
  return <AppShell title="Content editor" admin><ContentEditor /></AppShell>;
}

function ContentEditor() {
  const { topicId = '' } = useParams(); const qc = useQueryClient();
  const q = useQuery({ queryKey: ['admin', 'content', topicId], queryFn: () => api.admin.contentTopic(topicId) });
  if (q.isLoading) return <Spinner />;
  if (q.error) return <ErrorBox error={q.error} />;
  const { topic, styles, learn } = q.data;
  const reload = () => { qc.invalidateQueries({ queryKey: ['admin', 'content', topicId] }); qc.invalidateQueries({ queryKey: ['curriculum'] }); };
  return (
    <>
      <Link to="/admin/curriculum" className="small">← Curriculum</Link>
      <div className="page-head" style={{ marginTop: 10 }}><h1>{topic.name}</h1><p>Year {topic.year} · term {topic.term} · tier {topic.tier} · {styles.length} question styles · id <code>{topic.id}</code></p></div>
      <div className="stack">
        <TopicForm key={topic.id + topic.name + topic.summary + topic.published} topic={topic} onSaved={reload} />
        {styles.map((st: any) => <StyleCard key={st.id} st={st} onSaved={reload} />)}
        <LearnEditor key={JSON.stringify(learn)} topicId={topic.id} learn={learn} onSaved={reload} />
      </div>
    </>
  );
}

function TopicForm({ topic, onSaved }: { topic: any; onSaved: () => void }) {
  const { toast } = useOverlay();
  const [name, setName] = useState<string>(topic.name || '');
  const [summary, setSummary] = useState<string>(topic.summary || '');
  const [published, setPublished] = useState<boolean>(!!topic.published);
  const [err, setErr] = useState('');
  const submit = async (e: FormEvent) => {
    e.preventDefault(); setErr('');
    try { await api.admin.patchTopic(topic.id, { name, summary, published }); toast('Topic saved', 'good'); onSaved(); } catch (x) { setErr((x as Error).message); }
  };
  return (
    <form className="card stack" onSubmit={submit}>
      <div className="card-head"><h3>Topic</h3><span className={`pill ${topic.published ? 'good' : 'warn'}`}>{topic.published ? 'Published' : 'Hidden'}</span></div>
      <label className="field"><span>Name</span><input className="input" maxLength={120} value={name} onChange={(e) => setName(e.target.value)} required /></label>
      <label className="field"><span>Summary</span><textarea className="input" rows={2} maxLength={500} value={summary} onChange={(e) => setSummary(e.target.value)} /></label>
      <label className="row small"><input type="checkbox" checked={published} onChange={(e) => setPublished(e.target.checked)} /> Published — visible to students on the roadmap</label>
      <div className="error" role="alert">{err}</div>
      <div className="row" style={{ justifyContent: 'flex-end' }}><button className="btn">Save topic</button></div>
    </form>
  );
}

function StyleCard({ st, onSaved }: { st: any; onSaved: () => void }) {
  const { toast } = useOverlay();
  const [name, setName] = useState<string>(st.name || '');
  const [intro, setIntro] = useState<string>(st.intro || '');
  const [err, setErr] = useState('');
  const [nonce, setNonce] = useState(0);
  const bank = st.source === 'bank';
  const dirty = name !== st.name || intro !== st.intro;
  const submit = async (e: FormEvent) => {
    e.preventDefault(); setErr('');
    try { await api.admin.patchStyle(st.id, { name, intro }); toast('Style saved', 'good'); onSaved(); } catch (x) { setErr((x as Error).message); }
  };
  return (
    <div className="card">
      <div className="card-head"><div><h3>{st.name}</h3><div className="small muted"><code>{st.id}</code> · {bank ? `question bank · ${st.items} active items` : `generator${st.generatorKey ? ` · ${st.generatorKey}` : ''}`}</div></div>
        <span className={`pill ${bank ? 'brand' : ''}`}>{bank ? 'Bank' : 'Generator'}</span></div>
      <form className="stack" onSubmit={submit}>
        <label className="field"><span>Style name</span><input className="input" maxLength={120} value={name} onChange={(e) => setName(e.target.value)} required /></label>
        <label className="field"><span>Intro (shown before the lesson)</span><textarea className="input" rows={2} maxLength={2000} value={intro} onChange={(e) => setIntro(e.target.value)} required /></label>
        <div className="error" role="alert">{err}</div>
        <div className="row" style={{ justifyContent: 'flex-end' }}><button className="btn sm" disabled={!dirty}>Save style</button></div>
      </form>
      {bank ? <ItemsList styleId={st.id} onChanged={onSaved} />
        : <div style={{ marginTop: 12 }}><div className="row spread"><div className="tiny muted">Generated by code — preview</div><button className="btn sm ghost" onClick={() => setNonce((n) => n + 1)}>↻ New sample</button></div>
          <SampleBody styleId={st.id} nonce={nonce} /></div>}
    </div>
  );
}

const plain = (html: string) => String(html || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();

function ItemsList({ styleId, onChanged }: { styleId: string; onChanged: () => void }) {
  const qc = useQueryClient(); const { openModal, confirm, toast } = useOverlay();
  const q = useQuery({ queryKey: ['admin', 'items', styleId], queryFn: () => api.admin.items(styleId) });
  const reload = () => { qc.invalidateQueries({ queryKey: ['admin', 'items', styleId] }); onChanged(); };
  const edit = (item?: any) => openModal((close) => <ItemForm styleId={styleId} item={item} close={close} onSaved={() => { toast(item ? 'Question saved' : 'Question added', 'good'); reload(); }} />, { wide: true });
  const toggle = async (it: any) => { try { await api.admin.patchItem(it.id, { active: !it.active }); reload(); } catch (e) { toast((e as Error).message, 'bad'); } };
  const del = async (it: any) => {
    if (!(await confirm('Delete question?', 'This permanently removes the question from the bank. Deactivating keeps it but hides it from students.', { ok: 'Delete', danger: true }))) return;
    try { await api.admin.deleteItem(it.id); toast('Question deleted'); reload(); } catch (e) { toast((e as Error).message, 'bad'); }
  };
  if (q.isLoading) return <Spinner />;
  if (q.error) return <ErrorBox error={q.error} />;
  const items: any[] = q.data.items;
  return (
    <div style={{ marginTop: 12 }}>
      <div className="row spread"><div className="tiny muted">Questions ({items.length})</div><button className="btn sm" onClick={() => edit()}>+ Add question</button></div>
      {items.length ? <div className="table-wrap"><table className="data"><thead><tr><th>#</th><th>Type</th><th>Question</th><th>Active</th><th></th></tr></thead><tbody>
        {items.map((it, i) => (
          <tr key={it.id} style={it.active ? undefined : { opacity: 0.55 }}>
            <td className="small muted">{i + 1}</td><td><span className="pill">{it.type}</span></td>
            <td className="small"><span title={plain(it.body?.q)}>{plain(it.body?.q).slice(0, 140) || <Html as="span" html={it.body?.q} />}</span><div className="tiny faint">{it.updatedAt ? `updated ${fmtDateTime(it.updatedAt)}` : ''}</div></td>
            <td><label className="row small" style={{ cursor: 'pointer' }}><input type="checkbox" checked={!!it.active} onChange={() => toggle(it)} /> {it.active ? 'On' : 'Off'}</label></td>
            <td><div className="row" style={{ gap: 6 }}><button className="btn sm ghost" onClick={() => edit(it)}>Edit</button>
              <button className="btn sm ghost" style={{ color: 'var(--bad)' }} aria-label={`Delete question ${i + 1}`} onClick={() => del(it)}>✕</button></div></td>
          </tr>))}
      </tbody></table></div> : <div className="empty small">No questions yet — add the first one.</div>}
    </div>
  );
}

const LEARN_TEMPLATE = {
  overview: '<p>What this topic is about…</p>', objectives: ['…'], keyWords: [{ term: '…', def: '…' }],
  sections: [{ title: '…', html: '<p>…</p>' }], mistakes: [], examTips: [], realLife: '', specRef: '',
};

// Light client-side shape check so obvious mistakes are caught before the server's full validation.
function checkLearn(v: any): string | null {
  if (!v || typeof v !== 'object' || Array.isArray(v)) return 'The teaching page must be a JSON object';
  if (typeof v.overview !== 'string' || !v.overview) return '“overview” must be a non-empty HTML string';
  if (!Array.isArray(v.objectives) || !v.objectives.length) return '“objectives” must be a non-empty list of strings';
  if (!Array.isArray(v.keyWords) || !v.keyWords.length || v.keyWords.some((k: any) => typeof k?.term !== 'string' || typeof k?.def !== 'string')) return '“keyWords” must be a non-empty list of { term, def }';
  if (!Array.isArray(v.sections) || !v.sections.length || v.sections.length > 12 || v.sections.some((x: any) => typeof x?.title !== 'string' || !x.title || typeof x?.html !== 'string' || !x.html)) return '“sections” must have 1–12 items, each { title, html }';
  for (const k of ['mistakes', 'examTips']) if (v[k] != null && !Array.isArray(v[k])) return `“${k}” must be a list of strings`;
  return null;
}

function LearnEditor({ topicId, learn, onSaved }: { topicId: string; learn: any; onSaved: () => void }) {
  const { toast } = useOverlay();
  const [text, setText] = useState(() => JSON.stringify(learn || LEARN_TEMPLATE, null, 2));
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  let parseErr = '';
  try { JSON.parse(text); } catch (e) { parseErr = (e as Error).message; }
  const save = async () => {
    setErr('');
    let v: any; try { v = JSON.parse(text); } catch (e) { setErr(`Invalid JSON: ${(e as Error).message}`); return; }
    const bad = checkLearn(v); if (bad) { setErr(bad); return; }
    setBusy(true);
    try { await api.admin.putLearn(topicId, v); toast('Teaching page saved', 'good'); onSaved(); } catch (e) { setErr((e as Error).message); } finally { setBusy(false); }
  };
  return (
    <div className="card">
      <div className="card-head"><div><h3>📖 Teaching page</h3><div className="small muted">{learn ? 'Edit the JSON below.' : 'No teaching page yet — start from the template below.'} Fields: overview, objectives, keyWords, sections, mistakes, examTips, realLife, specRef.</div></div>
        {learn && <Link className="btn sm ghost" to={`/app/learn/${topicId}`}>View</Link>}</div>
      <label className="field"><span>Content (JSON)</span>
        <textarea className="input" rows={18} spellCheck={false} style={{ fontFamily: 'ui-monospace, Menlo, monospace', fontSize: 13, width: '100%' }} value={text} onChange={(e) => setText(e.target.value)} /></label>
      <div className="error" role="alert">{err || (parseErr ? `Invalid JSON: ${parseErr}` : '')}</div>
      <div className="row" style={{ justifyContent: 'flex-end' }}>
        <button className="btn ghost" onClick={() => { try { setText(JSON.stringify(JSON.parse(text), null, 2)); } catch { /* invalid JSON: shown above */ } }} disabled={!!parseErr}>Format</button>
        <button className="btn" onClick={save} disabled={busy || !!parseErr}>Save teaching page</button></div>
    </div>
  );
}
