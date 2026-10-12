// "Solve together": a question card inside the chat, plus the picker for sharing one.
import { useState, type FormEvent } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { useSession } from '../../state/session';
import { useOverlay } from '../../ui/overlays';
import { Html } from '../../ui/bits';
import { AnswerWidget, correctLettersFrom } from '../../ui/AnswerWidget';
import { xpPop } from '../../lib/confetti';
/* eslint-disable @typescript-eslint/no-explicit-any */

export function SharedQuestionCard({ fid, sq, meId, friend }: { fid: string; sq: any; meId: string; friend: any }) {
  const qc = useQueryClient(); const { toast } = useOverlay(); const s = useSession();
  const [value, setValue] = useState(''); const [busy, setBusy] = useState(false); const [state, setState] = useState<'' | 'ok' | 'shake'>('');
  const them = sq.players[friend.id]; const isMaths = sq.subject === 'maths';
  const check = async () => {
    if (!value.trim() || busy) return; setBusy(true);
    try {
      const r = await api.social.answerShared(fid, sq.id, value);
      setState(r.correct ? 'ok' : 'shake'); setTimeout(() => setState(''), 600);
      if (r.correct) xpPop(r.xp); else if (!r.shared.done) toast(`Not quite — ${r.shared.triesLeft} ${r.shared.triesLeft === 1 ? 'try' : 'tries'} left`);
      await qc.invalidateQueries({ queryKey: ['chat', fid] });
      if (r.correct) s.refresh();
    } catch (e) { toast((e as Error).message, 'bad'); } finally { setBusy(false); }
  };
  const mine = sq.players[meId];
  const reveal = sq.done && sq.question.options ? { correct: correctLettersFrom(sq.answerHtml), given: mine?.input || '' } : null;
  const status = (p: any, who: string) => !p ? `${who}: not tried yet` : p.correct ? `${who}: ✓ solved${p.tries > 1 ? ` in ${p.tries} tries` : ' first try'}` : p.done ? `${who}: ✗ out of tries` : `${who}: trying (${p.tries})`;
  return (
    <div className="shared-q">
      <div className="tiny" style={{ color: 'var(--brand)' }}>🧩 Solve together · {sq.topicName}</div>
      <div className="small muted" style={{ margin: '2px 0 8px' }}>{sq.styleName}</div>
      <Html className="q-html" html={sq.question.html} />
      {sq.question.diagram && <Html className="diagram" html={sq.question.diagram} />}
      <form onSubmit={(e: FormEvent) => { e.preventDefault(); check(); }}>
        <AnswerWidget q={sq.question} value={sq.done ? (mine?.input || value) : value} onChange={setValue} onSubmit={check} locked={sq.done} showKeypad={isMaths && !sq.question.options} compact inputState={state} reveal={reveal} />
        {!sq.done && <div className="row spread" style={{ marginTop: 10 }}><span className="small muted">{sq.triesLeft} {sq.triesLeft === 1 ? 'try' : 'tries'} left · +5 XP</span><button className="btn sm" disabled={busy || !value.trim()}>Check</button></div>}
      </form>
      {sq.done && <div className={`shared-result ${sq.correct ? 'good' : 'bad'}`}><b>{sq.correct ? 'Correct! 🎉' : 'Answer'}</b>: <Html as="span" html={sq.answerHtml || sq.answer} />
        {sq.steps?.length > 0 && <ol className="small" style={{ margin: '8px 0 0 18px' }}>{sq.steps.map((x: string, i: number) => <Html as="li" key={i} html={x} />)}</ol>}
        {sq.done && them?.input && <div className="small muted" style={{ marginTop: 6 }}>{friend.name} answered: {them.input}</div>}</div>}
      <div className="small muted" style={{ marginTop: 8 }}>{status(mine, 'You')} · {status(them, friend.name)}</div>
    </div>
  );
}

export function ShareQuestionForm({ fid, close }: { fid: string; close: () => void }) {
  const s = useSession(); const qc = useQueryClient(); const { toast } = useOverlay();
  const me = s.child; const subjects = s.enrolled(me);
  const [subject, setSubject] = useState<string>(s.subject?.id || subjects[0]?.id);
  const [topicId, setTopicId] = useState(''); const [busy, setBusy] = useState(false);
  const topics = s.topicsOf(subject).filter((t: any) => t.year <= (me?.yearGroup || 11)).sort((a: any, b: any) => b.year - a.year || a.term - b.term);
  const submit = async (e: FormEvent) => {
    e.preventDefault(); setBusy(true);
    try { await api.social.shareQuestion(fid, topicId ? { topicId } : { subject }); await qc.invalidateQueries({ queryKey: ['chat', fid] }); close(); }
    catch (err) { toast((err as Error).message, 'bad'); } finally { setBusy(false); }
  };
  return (
    <form onSubmit={submit}><h2>🧩 Share a question</h2><p className="muted">You both get the same question. Answers stay hidden until each of you has finished — no peeking!</p>
      <div className="stack" style={{ margin: '16px 0' }}>
        <label className="field"><span>Subject</span><select className="input" value={subject} onChange={(e) => { setSubject(e.target.value); setTopicId(''); }}>{subjects.map((x) => <option key={x.id} value={x.id}>{x.icon} {x.name}</option>)}</select></label>
        <label className="field"><span>Topic</span><select className="input" value={topicId} onChange={(e) => setTopicId(e.target.value)}>
          <option value="">🎲 Surprise me (any topic up to Year {me?.yearGroup})</option>{topics.map((t: any) => <option key={t.id} value={t.id}>Year {t.year} · {t.name}</option>)}</select></label>
      </div>
      <div className="row" style={{ justifyContent: 'flex-end' }}><button type="button" className="btn ghost" onClick={close}>Cancel</button><button className="btn" disabled={busy}>Share</button></div>
    </form>
  );
}
