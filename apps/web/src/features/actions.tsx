// Shared learning actions used across pages: start a lesson (with price/free-trial/card-check), a review, or an exam.
import { useNavigate } from 'react-router';
import { useQueryClient } from '@tanstack/react-query';
import { useSession } from '../state/session';
import { useOverlay } from '../ui/overlays';
import { api, ApiError } from '../lib/api';
import { money } from '../lib/format';
import { CardCheck } from './payments';

export function useLearningActions() {
  const s = useSession(); const navigate = useNavigate(); const qc = useQueryClient();
  const { openModal, toast, confirm } = useOverlay();

  const cardCheck = () => new Promise<boolean>((resolve) => {
    if (s.me?.user.role !== 'parent') { toast('Ask your parent to sign in and start the free lesson.', 'bad'); resolve(false); return; }
    openModal((close) => <CardCheck onCancel={() => { close(); resolve(false); }} onDone={async (r) => { close(); await s.refresh(); toast(r.message, r.trialAvailable ? 'good' : ''); resolve(true); }} />, { onClose: () => resolve(false) });
  });

  async function startLesson(styleId: string): Promise<void> {
    const c = s.child; if (!c) { navigate('/app/family?add=1'); return; }
    const t = s.topicOfStyle(styleId); const st = t?.styles.find((x: { id: string }) => x.id === styleId); const sub = s.subjectInfo(t.subject);
    if (t.year > c.yearGroup) { toast(`🔒 Year ${t.year} topic — it unlocks when you move up to Year ${t.year}.`); return; }
    const w = s.me?.wallet || { credits: 0 };
    const trial = !w.freeAccess && w.freeLessonAvailable && w.credits < 1;
    const can = w.freeAccess || w.credits >= 1 || trial;
    openModal((close) => (
      <>
        <div className="tiny" style={{ color: s.strand(t.strand).color }}>{sub.icon} {sub.name} · {s.strand(t.strand).name} · Year {t.year}</div>
        <h2 style={{ marginTop: 6 }}>{st?.name}</h2>
        <p className="muted">{t.name} — a worked example, then 10 practice questions (plus 2 quick review questions from earlier topics). Up to 3 tries each, with hints and full explanations.</p>
        <div className="card" style={{ boxShadow: 'none', background: 'var(--panel-2)', border: 0, margin: '18px 0' }}>
          <div className="row spread"><span>Lesson for <b>{c.name}</b></span><b>{w.freeAccess ? <span className="pill good">Free access</span> : trial ? <span className="pill good">FREE trial lesson</span> : `1 credit · ${money(1)}`}</b></div>
          {!w.freeAccess && !trial && <div className="small muted" style={{ marginTop: 6 }}>Balance: {w.credits} credit{w.credits === 1 ? '' : 's'}</div>}
        </div>
        {!can && <div className="demo-note">{s.me?.user.role === 'parent' ? 'You’re out of credits. Top up your wallet to start this lesson.' : 'Out of lesson credits — ask your parent to top up.'}</div>}
        <div className="row wrap" style={{ justifyContent: 'space-between', marginTop: 22 }}>
          <button className="btn ghost" onClick={() => { close(); navigate(`/app/learn/${t.id}`); }}>📖 Read the topic first</button>
          <div className="row"><button className="btn ghost" onClick={close}>Cancel</button>
            {can ? <button className="btn" onClick={async () => {
              try { const r = await api.lessons.start(c.id, styleId); close(); await s.refresh(); navigate(`/app/lesson/${r.lesson.id}`); }
              catch (e) { if (e instanceof ApiError && e.status === 428) { close(); if (await cardCheck()) await startLesson(styleId); return; } toast((e as Error).message, 'bad'); }
            }}>Start lesson</button> : s.me?.user.role === 'parent' ? <button className="btn" onClick={() => { close(); navigate('/app/billing'); }}>Top up</button> : null}
          </div>
        </div>
      </>));
  }

  async function startReview(opts: { mode?: 'mixed' | 'mistakes'; mistakeId?: string } = {}) {
    const c = s.child; if (!c) return;
    try { const r = await api.lessons.startReview({ studentId: c.id, ...opts }); navigate(`/app/lesson/${r.lesson.id}`); } catch (e) { toast((e as Error).message, 'bad'); }
  }

  async function startExam(examId: string, name: string, questions: number, minutes: number) {
    const c = s.child; if (!c) return;
    const examYear = examId.startsWith('topic:') ? s.cur?.topics.find((t) => t.id === examId.slice(6))?.year : s.cur?.exams.find((e) => e.id === examId)?.year;
    if (examYear && examYear > c.yearGroup) { toast(`🔒 Year ${examYear} test — it unlocks when you move up to Year ${examYear}.`); return; }
    const w = s.me?.wallet;
    if (!(await confirm(`Start ${name}?`, `${questions} questions, ${minutes} minutes. The timer starts immediately and it auto-submits at the end. Afterwards every wrong answer is explained step by step. ${w?.freeAccess ? 'Free access.' : `Uses 1 credit (balance: ${w?.credits ?? 0}).`}`, { ok: 'Start' }))) return;
    try { const r = await api.exams.start(c.id, examId); await s.refresh(); qc.invalidateQueries({ queryKey: ['exams'] }); navigate(`/app/exam/${r.attempt.id}`); }
    catch (e) { toast((e as Error).message, 'bad'); if (e instanceof ApiError && e.status === 402 && s.me?.user.role === 'parent') navigate('/app/billing'); }
  }
  return { startLesson, startReview, startExam, cardCheck };
}
