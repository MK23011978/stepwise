// Reading & Words: a daily reading goal with a vocabulary focus — log today's reading with a summary, collect new
// words from the book, review them with spaced repetition, and pick books from the recommended Year 9 list.
import { useState, type FormEvent } from 'react';
import { useSearchParams } from 'react-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { useSession } from '../../state/session';
import { useOverlay } from '../../ui/overlays';
import { StudentGate } from '../../features/StudentGate';
import { Donut } from '../../ui/charts';
import { Empty, ErrorBox, Spinner } from '../../ui/bits';
import { fmtDate, todayStr } from '../../lib/format';
import { confetti } from '../../lib/confetti';
/* eslint-disable @typescript-eslint/no-explicit-any */

export default function ReadingPage() {
  return <StudentGate title="Reading & Words">{(c) => <Reading child={c} />}</StudentGate>;
}

const TABS = [['today', '📖 Today'], ['shelf', '📚 My books'], ['words', '🔤 Word bank'], ['library', '🏛️ Book list']] as const;

function Reading({ child: c }: { child: any }) {
  const [params, setParams] = useSearchParams(); const tab = params.get('tab') || 'today';
  const q = useQuery({ queryKey: ['reading', c.id], queryFn: () => api.reading.overview(c.id) });
  const books = useQuery({ queryKey: ['reading-books'], queryFn: () => api.reading.books(), staleTime: 3600_000 });
  if (q.isLoading) return <Spinner />;
  if (q.error) return <ErrorBox error={q.error} />;
  const D = q.data;
  return (
    <>
      <div className="page-head"><h1>📚 Reading & Words</h1><p>Read a little every day and collect new words from your book. Daily goal: <b>{D.goal.dailyMinutes} minutes</b> and <b>{D.goal.dailyWords} new word{D.goal.dailyWords === 1 ? '' : 's'}</b> — reach both for +{D.reward.xp} XP and +{D.reward.coins} coins.</p></div>
      <div className="tabs" role="tablist">{TABS.map(([id, label]) => <button key={id} className={tab === id ? 'on' : ''} onClick={() => setParams(id === 'today' ? {} : { tab: id }, { replace: true })}>{label}</button>)}</div>
      {tab === 'today' && <Today child={c} D={D} goTo={(t) => setParams({ tab: t })} />}
      {tab === 'shelf' && <Shelf child={c} D={D} goTo={(t) => setParams({ tab: t })} />}
      {tab === 'words' && <Words child={c} D={D} books={books.data?.books || []} />}
      {tab === 'library' && <Library child={c} D={D} books={books.data?.books || []} loading={books.isLoading} />}
    </>
  );
}

function useReload(id: string) {
  const qc = useQueryClient(); const s = useSession();
  return () => { qc.invalidateQueries({ queryKey: ['reading', id] }); qc.invalidateQueries({ queryKey: ['vocab', id] }); s.refresh(); };
}
const goalToast = (g: any, toast: (m: string, k?: any) => void) => { if (g?.rewarded) { confetti(90); toast('Daily reading goal complete! 🎉 +XP and coins', 'good'); } };

// ---------------------------------------------------------------- today
function Today({ child: c, D, goTo }: { child: any; D: any; goTo: (t: string) => void }) {
  const { openModal } = useOverlay(); const s = useSession();
  const reading = D.shelf.filter((b: any) => b.status === 'reading');
  const minPct = Math.min(100, Math.round((D.today.minutes / D.goal.dailyMinutes) * 100));
  const wordPct = D.goal.dailyWords ? Math.min(100, Math.round((D.today.words / D.goal.dailyWords) * 100)) : 100;
  const max = Math.max(D.goal.dailyMinutes, ...D.week.map((d: any) => d.minutes));
  return (
    <div className="stack">
      <div className="card">
        <div className="row wrap" style={{ gap: 26, alignItems: 'center' }}>
          <div className="row" style={{ gap: 14 }}><Donut pct={minPct} size={104} label={`${D.today.minutes}`} color="#0ea5a4" /><div><b>Minutes read</b><div className="small muted">goal {D.goal.dailyMinutes}</div></div></div>
          <div className="row" style={{ gap: 14 }}><Donut pct={wordPct} size={104} label={`${D.today.words}`} color="#8b5cf6" /><div><b>New words</b><div className="small muted">goal {D.goal.dailyWords}</div></div></div>
          <div className="grow" style={{ minWidth: 200 }}>
            {D.today.met ? <div className="pill good" style={{ fontSize: 14, padding: '6px 12px' }}>✅ Today’s goal is done!</div> : <div className="small muted">Read and add words to complete today’s goal.</div>}
            <div style={{ marginTop: 10 }}>🔥 <b>{D.streak}</b>-day reading streak · 🔤 <b>{D.vocab.total}</b> words ({D.vocab.mastered} mastered)</div>
            <div className="row wrap" style={{ marginTop: 12 }}>
              <button className="btn" disabled={!reading.length} onClick={() => openModal((close) => <LogForm child={c} shelf={reading} close={close} />, { wide: true })}>📝 Log today’s reading</button>
              <button className="btn soft" onClick={() => openModal((close) => <WordForm child={c} shelf={D.shelf} close={close} />, { wide: true })}>+ New word</button>
              {D.vocab.due > 0 && <button className="btn ghost" onClick={() => openModal((close) => <Quiz child={c} close={close} />, { wide: true })}>🧠 Review {D.vocab.due} word{D.vocab.due === 1 ? '' : 's'}</button>}
            </div>
            {!reading.length && <div className="small" style={{ marginTop: 8 }}>First, <button className="link" onClick={() => goTo('library')}>choose a book</button> to read.</div>}
          </div>
          <GoalEditor child={c} goal={D.goal} canEdit={!!s.me} />
        </div>
      </div>

      <div className="card"><div className="card-head"><h3>Last 14 days</h3></div>
        <div className="reading-week">{D.week.map((d: any) => <div key={d.day} className={`rw-day ${d.met ? 'met' : ''}`} title={`${fmtDate(d.day)}: ${d.minutes} min, ${d.words} words`}>
          <div className="rw-bar"><i style={{ height: `${Math.round((d.minutes / max) * 100)}%` }} /></div>
          <div className="tiny">{new Date(d.day).toLocaleDateString('en-GB', { weekday: 'narrow' })}</div>{d.met ? <div className="tiny">✅</div> : <div className="tiny muted">{d.words || ''}</div>}</div>)}</div>
        <div className="small muted">Bars show minutes read; ✅ = daily goal met; the number is new words.</div></div>

      <div className="card"><div className="card-head"><h3>Reading diary</h3></div>
        {D.logs.length ? D.logs.slice(0, 15).map((l: any) => <div key={l.id} className="diary">
          <div className="row spread wrap"><b>{l.title}</b><span className="small muted">{fmtDate(l.day)} · {l.minutes} min{l.toPage ? ` · up to p. ${l.toPage}` : ''}</span></div>
          <p className="small" style={{ margin: '6px 0 0' }}>{l.summary}</p></div>)
          : <Empty icon="📝">Your daily summaries will appear here.</Empty>}</div>
    </div>
  );
}

function GoalEditor({ child: c, goal }: { child: any; goal: any; canEdit: boolean }) {
  const { openModal, toast } = useOverlay(); const reload = useReload(c.id);
  const edit = () => openModal((close) => {
    let m = goal.dailyMinutes, w = goal.dailyWords;
    return <form onSubmit={async (e) => { e.preventDefault(); try { await api.reading.setGoal(c.id, { dailyMinutes: m, dailyWords: w }); toast('Goal saved', 'good'); reload(); close(); } catch (err) { toast((err as Error).message, 'bad'); } }}>
      <h2>Daily reading goal</h2><p className="muted">Small and steady works best: 15–30 minutes and 2–5 new words a day.</p>
      <div className="grid-2" style={{ gap: 14, margin: '16px 0' }}>
        <label className="field"><span>Minutes a day</span><input className="input" type="number" min={5} max={180} defaultValue={m} onChange={(e) => { m = Number(e.target.value); }} required /></label>
        <label className="field"><span>New words a day</span><input className="input" type="number" min={0} max={20} defaultValue={w} onChange={(e) => { w = Number(e.target.value); }} required /></label>
      </div>
      <div className="row" style={{ justifyContent: 'flex-end' }}><button type="button" className="btn ghost" onClick={close}>Cancel</button><button className="btn">Save goal</button></div></form>;
  });
  return <button className="btn sm ghost" onClick={edit}>⚙️ Change goal</button>;
}

function LogForm({ child: c, shelf, close }: { child: any; shelf: any[]; close: () => void }) {
  const { toast } = useOverlay(); const reload = useReload(c.id);
  const [shelfId, setShelfId] = useState(shelf[0]?.id || ''); const book = shelf.find((b) => b.id === shelfId);
  const [minutes, setMinutes] = useState('20'); const [toPage, setToPage] = useState(''); const [summary, setSummary] = useState(''); const [busy, setBusy] = useState(false);
  const submit = async (e: FormEvent) => {
    e.preventDefault(); setBusy(true);
    try { const r = await api.reading.log(c.id, { shelfId, minutes: Number(minutes), toPage: toPage ? Number(toPage) : undefined, summary, day: todayStr() }); goalToast(r.goal, toast); if (!r.goal.rewarded) toast('Reading saved 📖', 'good'); reload(); close(); }
    catch (err) { toast((err as Error).message, 'bad'); } finally { setBusy(false); }
  };
  return (
    <form onSubmit={submit}><h2>📝 Log today’s reading</h2>
      <div className="grid-2" style={{ gap: 14, margin: '16px 0' }}>
        <label className="field" style={{ gridColumn: '1 / -1' }}><span>Book</span><select className="input" value={shelfId} onChange={(e) => setShelfId(e.target.value)}>{shelf.map((b) => <option key={b.id} value={b.id}>{b.title}</option>)}</select></label>
        <label className="field"><span>Minutes read</span><input className="input" type="number" min={1} max={600} value={minutes} onChange={(e) => setMinutes(e.target.value)} required /></label>
        <label className="field"><span>Page reached{book?.totalPages ? ` (of ${book.totalPages})` : ''}</span><input className="input" type="number" min={book?.currentPage || 0} max={book?.totalPages || 5000} value={toPage} onChange={(e) => setToPage(e.target.value)} placeholder={book?.currentPage ? `last time: ${book.currentPage}` : 'e.g. 24'} /></label>
        <label className="field" style={{ gridColumn: '1 / -1' }}><span>Summary — what happened in today’s reading? (in your own words)</span>
          <textarea className="input" rows={5} value={summary} onChange={(e) => setSummary(e.target.value)} minLength={30} maxLength={2000} required placeholder="Who did what? What changed? What do you think will happen next?" />
          <span className="small muted">{summary.trim().length}/30 characters minimum</span></label>
      </div>
      {book?.book?.prompts?.length > 0 && <div className="note small" style={{ marginBottom: 14 }}><b>Ideas for your summary:</b><ul style={{ margin: '6px 0 0 18px' }}>{book.book.prompts.map((p: string) => <li key={p}>{p}</li>)}</ul></div>}
      <div className="row" style={{ justifyContent: 'flex-end' }}><button type="button" className="btn ghost" onClick={close}>Cancel</button><button className="btn" disabled={busy}>Save</button></div>
    </form>
  );
}

function WordForm({ child: c, shelf, close, preset }: { child: any; shelf: any[]; close: () => void; preset?: { word: string; meaning: string; bookId?: string } }) {
  const { toast } = useOverlay(); const reload = useReload(c.id);
  const [f, setF] = useState({ word: preset?.word || '', meaning: preset?.meaning || '', example: '', shelfId: shelf.find((b) => b.bookId === preset?.bookId)?.id || shelf.find((b) => b.status === 'reading')?.id || '' });
  const [busy, setBusy] = useState(false);
  const set = (k: string) => (e: any) => setF((x) => ({ ...x, [k]: e.target.value }));
  const submit = async (e: FormEvent) => {
    e.preventDefault(); setBusy(true);
    try { const r = await api.reading.addWord(c.id, { word: f.word, meaning: f.meaning, example: f.example || undefined, shelfId: f.shelfId || undefined, bookId: preset?.bookId }); goalToast(r.goal, toast); if (!r.goal.rewarded) toast(`“${f.word}” added to your word bank`, 'good'); reload(); close(); }
    catch (err) { toast((err as Error).message, 'bad'); } finally { setBusy(false); }
  };
  return (
    <form onSubmit={submit}><h2>🔤 New word</h2><p className="muted">Write the meaning and your own sentence — using a word yourself is the best way to remember it.</p>
      <div className="grid-2" style={{ gap: 14, margin: '16px 0' }}>
        <label className="field"><span>Word</span><input className="input" value={f.word} onChange={set('word')} required maxLength={60} autoFocus={!preset} /></label>
        <label className="field"><span>From which book? (optional)</span><select className="input" value={f.shelfId} onChange={set('shelfId')}><option value="">—</option>{shelf.map((b) => <option key={b.id} value={b.id}>{b.title}</option>)}</select></label>
        <label className="field" style={{ gridColumn: '1 / -1' }}><span>Meaning</span><input className="input" value={f.meaning} onChange={set('meaning')} required maxLength={300} placeholder="What does it mean?" /></label>
        <label className="field" style={{ gridColumn: '1 / -1' }}><span>Your own sentence using the word</span><input className="input" value={f.example} onChange={set('example')} maxLength={300} placeholder={f.word ? `Write a sentence with “${f.word}”` : ''} autoFocus={!!preset} /></label>
      </div>
      <div className="row" style={{ justifyContent: 'flex-end' }}><button type="button" className="btn ghost" onClick={close}>Cancel</button><button className="btn" disabled={busy}>Add word</button></div>
    </form>
  );
}

// ---------------------------------------------------------------- word bank + quiz
function Words({ child: c, D }: { child: any; D: any; books: any[] }) {
  const { openModal, confirm, toast } = useOverlay(); const reload = useReload(c.id);
  const q = useQuery({ queryKey: ['vocab', c.id], queryFn: () => api.reading.words(c.id) });
  const [find, setFind] = useState('');
  if (q.isLoading) return <Spinner />;
  if (q.error) return <ErrorBox error={q.error} />;
  const list = q.data.words.filter((w: any) => !find || (w.word + ' ' + w.meaning).toLowerCase().includes(find.toLowerCase()));
  const title = (sid: string) => D.shelf.find((b: any) => b.id === sid)?.title;
  return (
    <div className="card">
      <div className="card-head row spread wrap"><h3>🔤 Word bank ({q.data.words.length}) · {D.vocab.mastered} mastered</h3>
        <div className="row wrap"><input className="input" style={{ width: 200 }} placeholder="Search words" value={find} onChange={(e) => setFind(e.target.value)} aria-label="Search words" />
          <button className="btn soft" onClick={() => openModal((close) => <WordForm child={c} shelf={D.shelf} close={close} />, { wide: true })}>+ New word</button>
          <button className="btn" disabled={!D.vocab.due} onClick={() => openModal((close) => <Quiz child={c} close={close} />, { wide: true })}>🧠 Review{D.vocab.due ? ` (${D.vocab.due})` : ''}</button></div></div>
      {!list.length ? <Empty icon="🔤">No words yet. Add words you meet while reading — or pick some from your book’s word list.</Empty>
        : <div className="word-grid">{list.map((w: any) => <div key={w.id} className="word-card">
          <div className="row spread"><b style={{ fontSize: 17 }}>{w.word}</b><span className={`pill ${w.mastered ? 'good' : w.dueNow ? 'warn' : ''}`}>{w.mastered ? '★ mastered' : w.dueNow ? 'review now' : `level ${w.box}`}</span></div>
          <div className="small" style={{ margin: '4px 0' }}>{w.meaning}</div>
          {w.example && <div className="small muted"><i>“{w.example}”</i></div>}
          <div className="row spread" style={{ marginTop: 6 }}><span className="tiny muted">{title(w.shelfId) || ''}</span>
            <button className="link tiny" onClick={async () => { if (await confirm(`Remove “${w.word}”?`, 'It will be removed from your word bank.', { ok: 'Remove', danger: true })) { await api.reading.removeWord(c.id, w.id).catch((e) => toast(e.message, 'bad')); reload(); } }}>Remove</button></div></div>)}</div>}
    </div>
  );
}

function Quiz({ child: c, close }: { child: any; close: () => void }) {
  const reload = useReload(c.id);
  const q = useQuery({ queryKey: ['vocab-quiz', c.id], queryFn: () => api.reading.quiz(c.id), gcTime: 0 });
  const [i, setI] = useState(0); const [res, setRes] = useState<any>(null); const [typed, setTyped] = useState(''); const [score, setScore] = useState(0);
  if (q.isLoading) return <Spinner />;
  if (q.error) return <ErrorBox error={q.error} />;
  const qs = q.data.questions;
  if (!qs.length) return <><h2>All caught up! 🎉</h2><p className="muted">No words are due for review right now.</p><div className="row" style={{ justifyContent: 'flex-end' }}><button className="btn" onClick={close}>Close</button></div></>;
  if (i >= qs.length) return <><h2>Review done! 🧠</h2><p>You got <b>{score}</b> out of <b>{qs.length}</b>. Words you got right come back later; the others come back tomorrow.</p><div className="row" style={{ justifyContent: 'flex-end' }}><button className="btn" onClick={() => { reload(); close(); }}>Finish</button></div></>;
  const cur = qs[i];
  const send = async (answer: string) => { if (res || !answer.trim()) return; const r = await api.reading.answer(c.id, cur.wordId, { mode: cur.mode, answer }); setRes({ ...r, given: answer }); if (r.correct) setScore((x) => x + 1); };
  const next = () => { setRes(null); setTyped(''); setI(i + 1); };
  return (
    <>
      <div className="row spread"><span className="tiny muted">Word {i + 1} of {qs.length}</span><span className="tiny muted">✓ {score}</span></div>
      {cur.mode === 'meaning' ? <><h2 style={{ margin: '10px 0' }}>What does <span style={{ color: 'var(--brand)' }}>{cur.prompt}</span> mean?</h2>
        <div className="stack">{cur.options.map((o: string) => <button key={o} className={`rec ${res ? (o === res.meaning ? 'ok' : o === res.given ? 'no' : '') : ''}`} disabled={!!res} onClick={() => send(o)} style={{ textAlign: 'left' }}>{o}</button>)}</div></>
        : <><h2 style={{ margin: '10px 0' }}>Which word means: “{cur.prompt}”?</h2>
          {cur.example && <p className="muted"><i>{cur.example}</i></p>}<p className="small muted">{cur.hint}</p>
          <form className="row" onSubmit={(e) => { e.preventDefault(); send(typed); }}><input className="input" value={typed} onChange={(e) => setTyped(e.target.value)} disabled={!!res} autoFocus aria-label="Your answer" /><button className="btn" disabled={!!res || !typed.trim()}>Check</button></form></>}
      {res && <div className={`shared-result ${res.correct ? 'good' : 'bad'}`} style={{ marginTop: 14 }}><b>{res.correct ? 'Correct! ' : 'Not quite. '}</b><b>{res.word}</b> — {res.meaning}{res.example && <div className="small muted"><i>“{res.example}”</i></div>}{res.mastered && <div className="small">★ Mastered!</div>}</div>}
      <div className="row" style={{ justifyContent: 'flex-end', marginTop: 14 }}><button className="btn ghost" onClick={() => { reload(); close(); }}>Stop</button>{res && <button className="btn" onClick={next}>Next →</button>}</div>
    </>
  );
}

// ---------------------------------------------------------------- shelf + library
function Shelf({ child: c, D, goTo }: { child: any; D: any; goTo: (t: string) => void }) {
  const { openModal, confirm, toast } = useOverlay(); const reload = useReload(c.id);
  const finish = (b: any) => openModal((close) => <FinishForm child={c} item={b} close={close} />, { wide: true });
  const add = () => openModal((close) => <CustomBook child={c} close={close} />);
  return (
    <div className="stack">
      <div className="row spread wrap"><span className="muted">Books you are reading or have read.</span><div className="row"><button className="btn soft" onClick={() => goTo('library')}>Browse the book list</button><button className="btn ghost" onClick={add}>+ Another book</button></div></div>
      {!D.shelf.length ? <div className="card"><Empty icon="📚">No books yet — pick one from the recommended Year 9 list.</Empty></div>
        : <div className="grid-3">{D.shelf.map((b: any) => <div key={b.id} className="card">
          <div className="row spread"><span className={`pill ${b.status === 'finished' ? 'good' : b.status === 'paused' ? '' : 'brand'}`}>{b.status === 'finished' ? '✓ Finished' : b.status === 'paused' ? 'Paused' : 'Reading'}</span>{b.rating ? <span>{'★'.repeat(b.rating)}</span> : null}</div>
          <h3 style={{ margin: '10px 0 2px' }}>{b.title}</h3><div className="small muted">{b.author || ''}</div>
          {b.totalPages ? <><div className="bar thin" style={{ marginTop: 12 }}><i style={{ width: `${b.pct}%` }} /></div><div className="small muted">page {b.currentPage} of {b.totalPages} · {b.pct}%</div></> : <div className="small muted" style={{ marginTop: 12 }}>page {b.currentPage}</div>}
          {b.summary && <p className="small" style={{ marginTop: 10 }}>{b.summary}</p>}
          <div className="row wrap" style={{ marginTop: 12 }}>
            {b.status !== 'finished' && <button className="btn sm" onClick={() => finish(b)}>Finished it!</button>}
            {b.status === 'reading' && <button className="btn sm ghost" onClick={() => api.reading.updateShelf(c.id, b.id, { status: 'paused' }).then(reload)}>Pause</button>}
            {b.status === 'paused' && <button className="btn sm ghost" onClick={() => api.reading.updateShelf(c.id, b.id, { status: 'reading' }).then(reload)}>Resume</button>}
            <button className="btn sm ghost" onClick={async () => { if (await confirm(`Remove “${b.title}”?`, 'Its reading diary entries are removed too. Words stay in your word bank.', { ok: 'Remove', danger: true })) { await api.reading.removeShelf(c.id, b.id).catch((e) => toast(e.message, 'bad')); reload(); } }}>Remove</button></div>
        </div>)}</div>}
    </div>
  );
}

function FinishForm({ child: c, item, close }: { child: any; item: any; close: () => void }) {
  const { toast } = useOverlay(); const reload = useReload(c.id);
  const [summary, setSummary] = useState(item.summary || ''); const [rating, setRating] = useState(item.rating || 4); const [busy, setBusy] = useState(false);
  const submit = async (e: FormEvent) => {
    e.preventDefault(); setBusy(true);
    try { await api.reading.updateShelf(c.id, item.id, { status: 'finished', summary, rating }); confetti(120); toast(`Well done — you finished ${item.title}! +50 XP`, 'good'); reload(); close(); }
    catch (err) { toast((err as Error).message, 'bad'); } finally { setBusy(false); }
  };
  return (
    <form onSubmit={submit}><h2>🏆 Finished “{item.title}”</h2><p className="muted">Write a summary of the whole book in your own words: the main characters, what happens, and what you thought of it (no copying from the internet!).</p>
      <textarea className="input" rows={7} style={{ margin: '12px 0' }} value={summary} onChange={(e) => setSummary(e.target.value)} minLength={80} maxLength={3000} required />
      <div className="row spread wrap"><label className="row" style={{ gap: 8 }}><span className="small">Your rating</span><select className="input" style={{ width: 'auto' }} value={rating} onChange={(e) => setRating(Number(e.target.value))}>{[5, 4, 3, 2, 1].map((n) => <option key={n} value={n}>{'★'.repeat(n)}</option>)}</select></label>
        <div className="row"><span className="small muted">{summary.trim().length}/80</span><button type="button" className="btn ghost" onClick={close}>Cancel</button><button className="btn" disabled={busy}>Save</button></div></div>
    </form>
  );
}

function CustomBook({ child: c, close }: { child: any; close: () => void }) {
  const { toast } = useOverlay(); const reload = useReload(c.id);
  const [f, setF] = useState({ title: '', author: '', totalPages: '' });
  const submit = async (e: FormEvent) => { e.preventDefault(); try { await api.reading.addToShelf(c.id, { title: f.title, author: f.author || undefined, totalPages: f.totalPages ? Number(f.totalPages) : undefined }); toast('Added to your books', 'good'); reload(); close(); } catch (err) { toast((err as Error).message, 'bad'); } };
  return <form onSubmit={submit}><h2>Add another book</h2><div className="stack" style={{ margin: '14px 0' }}>
    <label className="field"><span>Title</span><input className="input" value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} required maxLength={160} /></label>
    <label className="field"><span>Author</span><input className="input" value={f.author} onChange={(e) => setF({ ...f, author: e.target.value })} maxLength={120} /></label>
    <label className="field"><span>Number of pages</span><input className="input" type="number" min={1} value={f.totalPages} onChange={(e) => setF({ ...f, totalPages: e.target.value })} /></label></div>
    <div className="row" style={{ justifyContent: 'flex-end' }}><button type="button" className="btn ghost" onClick={close}>Cancel</button><button className="btn">Add</button></div></form>;
}

function Library({ child: c, D, books, loading }: { child: any; D: any; books: any[]; loading: boolean }) {
  const { openModal, toast } = useOverlay(); const reload = useReload(c.id);
  const [level, setLevel] = useState('all');
  if (loading) return <Spinner />;
  if (!books.length) return <div className="card"><Empty icon="🏛️">The book list is being prepared.</Empty></div>;
  const onShelf = (id: string) => D.shelf.some((b: any) => b.bookId === id);
  const levels = ['all', ...new Set(books.map((b) => b.level))];
  const list = books.filter((b) => level === 'all' || b.level === level).sort((a, b) => Number(b.years.includes(c.yearGroup)) - Number(a.years.includes(c.yearGroup)));
  const start = async (b: any) => { try { await api.reading.addToShelf(c.id, { bookId: b.id }); toast(`“${b.title}” added to your books`, 'good'); reload(); } catch (e) { toast((e as Error).message, 'bad'); } };
  const showWords = (b: any) => openModal((close) => <BookWords child={c} book={b} shelf={D.shelf} close={close} />, { wide: true });
  return (
    <div className="stack">
      <div className="row wrap">{levels.map((l) => <button key={l} className={`pill ${level === l ? 'brand' : ''}`} style={{ border: 0, cursor: 'pointer' }} onClick={() => setLevel(l)}>{l === 'all' ? 'All books' : l}</button>)}</div>
      <div className="grid-3">{list.map((b) => <div key={b.id} className="card book-card">
        <div className="row spread wrap"><span className="pill">{b.level}</span><span className="tiny muted">Year {b.years.join('–')} · ~{b.pages} pages</span></div>
        <h3 style={{ margin: '10px 0 2px' }}>{b.title}</h3><div className="small muted">{b.author} · {b.published}</div>
        <p className="small" style={{ margin: '10px 0 6px' }}>{b.blurb}</p>
        <p className="small muted" style={{ margin: 0 }}><b>Why read it:</b> {b.why}</p>
        {b.contentNote && <p className="tiny muted" style={{ marginTop: 6 }}>⚠️ {b.contentNote}</p>}
        <div className="row wrap" style={{ marginTop: 'auto', paddingTop: 12 }}>
          {onShelf(b.id) ? <span className="pill good">On your shelf</span> : <button className="btn sm" onClick={() => start(b)}>Start reading</button>}
          <button className="btn sm ghost" onClick={() => showWords(b)}>🔤 {b.words.length} key words</button>
          {b.freeLink && <a className="btn sm ghost" href={b.freeLink} target="_blank" rel="noreferrer">Read free online ↗</a>}
        </div></div>)}</div>
    </div>
  );
}

function BookWords({ child: c, book, shelf, close }: { child: any; book: any; shelf: any[]; close: () => void }) {
  const { openModal } = useOverlay();
  const mine = useQuery({ queryKey: ['vocab', c.id], queryFn: () => api.reading.words(c.id) });
  const have = new Set((mine.data?.words || []).map((w: any) => w.word.toLowerCase()));
  return (
    <>
      <h2>🔤 Key words: {book.title}</h2><p className="muted">Look out for these words as you read. When you meet one, add it to your word bank with your own sentence.</p>
      <div className="word-grid" style={{ margin: '14px 0' }}>{book.words.map((w: any) => <div key={w.word} className="word-card">
        <div className="row spread"><b>{w.word}</b><span className="tiny muted">{w.type}</span></div>
        <div className="small" style={{ margin: '4px 0' }}>{w.def}</div><div className="small muted"><i>e.g. {w.example}</i></div>
        <div style={{ marginTop: 6 }}>{have.has(w.word.toLowerCase()) ? <span className="pill good">In your word bank</span>
          : <button className="btn sm soft" onClick={() => { close(); openModal((cl) => <WordForm child={c} shelf={shelf} close={cl} preset={{ word: w.word, meaning: w.def, bookId: book.id }} />, { wide: true }); }}>+ Add (write your own sentence)</button>}</div></div>)}</div>
      <div className="row" style={{ justifyContent: 'flex-end' }}><button className="btn ghost" onClick={close}>Close</button></div>
    </>
  );
}
