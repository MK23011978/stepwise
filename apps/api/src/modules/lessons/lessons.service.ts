import { and, desc, eq, sql } from 'drizzle-orm';
import * as s from '../../db/schema.js';
import type { Db } from '../../db/client.js';
import type { Deps } from '../../core/deps.js';
import { fail } from '../../core/errors.js';
import { newId } from '../../core/ids.js';
import { addDays, nowIso, today } from '../../core/dates.js';
import { levelInfo, yearLocked, yearLockMessage, QUESTIONS_PER_LESSON, REVIEW_IN_LESSON, REVIEW_SESSION_SIZE, SR_INTERVALS } from '../common/domain.js';
import * as repo from '../students/students.repo.js';
import type { StudentService } from '../students/students.service.js';
import type { BillingService } from '../billing/billing.service.js';
import type { RewardsService } from '../rewards/rewards.service.js';
import type { TaskService } from '../tasks/tasks.service.js';
import type { AuthUser } from '../../plugins/auth.js';
import { studentFor } from '../common/access.js';

type LessonRow = typeof s.lessons.$inferSelect;
/* eslint-disable @typescript-eslint/no-explicit-any */
type Q = Record<string, any>;
type Result = { attempts: number; hinted: boolean; outcome: string | null };
const stripQ = (q: Q) => { const { check, answer, answerHtml, steps, mistakeId, ...rest } = q; void check; void answer; void answerHtml; void steps; void mistakeId; return rest; };
export { stripQ };

export function createLessonService(deps: Deps, students: StudentService, billing: BillingService, rewards: RewardsService, tasks: TaskService) {
  const { db, content } = deps;

  function view(l: LessonRow) {
    const qs = l.questions as Q[]; const results = l.results as (Result | null)[];
    const cur = qs[l.idx]; const qStyle = (cur && cur.styleId) || l.styleId;
    const style = content.getStyle(qStyle); const topic = content.getTopic(style?.topicId);
    const main = l.styleId ? content.getStyle(l.styleId) : null;
    const r = results[l.idx];
    return {
      id: l.id, kind: l.kind, status: l.status, styleId: l.styleId, styleName: main ? main.name : 'Review session', topicName: main ? content.getTopic(main.topicId)?.name : 'Past questions',
      intro: main ? main.intro : null, free: l.free, example: l.example, idx: l.idx, total: qs.length, xp: l.xp, bonus: l.bonus,
      results: results.map((x) => x && { outcome: x.outcome, attempts: x.attempts }), reviewSlots: qs.map((q) => q.review || null),
      question: l.status === 'active' && cur ? { ...stripQ(cur), styleName: style?.name, topicName: topic?.name, attempts: r ? r.attempts : 0, hinted: r ? r.hinted : false, hint: r && r.hinted ? cur.hint : null } : null,
    };
  }

  async function getFor(user: AuthUser, lessonId: string, d: Db = db, lock = false) {
    const q = d.select().from(s.lessons).where(eq(s.lessons.id, lessonId));
    const [l] = lock ? await q.for('update') : await q;
    if (!l) fail(404, 'Lesson not found');
    await studentFor(d, user, l!.studentId);
    return l!;
  }

  async function start(user: AuthUser, studentId: string, styleId: string) {
    const st0 = await studentFor(db, user, studentId);
    const style = content.getStyle(styleId) || fail(404, 'Unknown style');
    const styleYear = content.getTopic(style.topicId)!.year;
    if (yearLocked(styleYear, st0.yearGroup)) fail(403, yearLockMessage(styleYear), 'YEAR_LOCKED');
    const [active] = await db.select().from(s.lessons).where(and(eq(s.lessons.studentId, studentId), eq(s.lessons.styleId, styleId), eq(s.lessons.status, 'active')));
    if (active) return { lesson: view(active), resumed: true };
    const topic = content.getTopic(style.topicId)!;
    const st = (await students.load(db, studentId))!;
    const ex = content.generate(style.id);
    const qs: Q[] = content.generateMany(style.id, QUESTIONS_PER_LESSON).map((q) => ({ ...q, styleId: style.id }));
    const extra = await students.pickReviewItems(db, st, REVIEW_IN_LESSON, style.id);
    extra.forEach((q, i) => qs.splice(Math.min(qs.length, 4 + i * 5), 0, q));
    const l = await db.transaction(async (tx) => {
      const charge = await billing.charge(tx as unknown as Db, st0, 'lesson', `${st0.name}: ${style.name}`);
      const [row] = await tx.insert(s.lessons).values({ id: newId('les'), studentId, kind: 'lesson', styleId: style.id, topicId: topic.id, status: 'active', free: charge.free,
        example: { html: ex.html, diagram: ex.diagram, answerHtml: ex.answerHtml, steps: ex.steps, options: ex.options }, questions: qs, results: [] }).returning();
      return row;
    });
    return { lesson: view(l) };
  }

  async function startReview(user: AuthUser, body: { studentId: string; mode?: string; mistakeId?: string }) {
    await studentFor(db, user, body.studentId);
    const [active] = await db.select().from(s.lessons).where(and(eq(s.lessons.studentId, body.studentId), eq(s.lessons.kind, 'review'), eq(s.lessons.status, 'active')));
    if (active) return { lesson: view(active), resumed: true };
    let items: Q[];
    if (body.mode === 'mistakes') {
      items = (await repo.mistakesOf(db, body.studentId)).filter((m) => content.getStyle(m.styleId)).slice(0, REVIEW_SESSION_SIZE).map((m) => ({ ...(m.question as Q), styleId: m.styleId, review: 'mistake', mistakeId: m.id }));
    } else if (body.mistakeId) {
      const [m] = await db.select().from(s.mistakes).where(and(eq(s.mistakes.id, body.mistakeId), eq(s.mistakes.studentId, body.studentId)));
      if (!m) fail(404, 'Mistake not found');
      items = [{ ...(m!.question as Q), styleId: m!.styleId, review: 'mistake', mistakeId: m!.id }, ...[0, 1].map(() => ({ ...content.generate(m!.styleId), styleId: m!.styleId, review: 'practice' }))];
    } else {
      items = await students.pickReviewItems(db, (await students.load(db, body.studentId))!, REVIEW_SESSION_SIZE, null);
    }
    if (!items.length) fail(400, 'Nothing to review yet — complete a lesson first.');
    const [l] = await db.insert(s.lessons).values({ id: newId('les'), studentId: body.studentId, kind: 'review', status: 'active', free: true, questions: items, results: [] }).returning();
    return { lesson: view(l) };
  }

  async function srUpdate(d: Db, studentId: string, styleId: string, good: boolean) {
    const [cur] = await d.select().from(s.reviewSchedule).where(and(eq(s.reviewSchedule.studentId, studentId), eq(s.reviewSchedule.styleId, styleId)));
    const box = good ? Math.min(SR_INTERVALS.length - 1, (cur ? cur.box : -1) + 1) : 0;
    await repo.upsertReview(d, studentId, styleId, box, addDays(SR_INTERVALS[box]));
  }
  async function addMistake(d: Db, studentId: string, q: Q, styleId: string, source: string) {
    if (q.mistakeId) { await d.update(s.mistakes).set({ tries: sql`${s.mistakes.tries} + 1`, createdAt: nowIso() }).where(eq(s.mistakes.id, q.mistakeId)); return; }
    const { mistakeId, review, ...clean } = q; void mistakeId; void review;
    await d.insert(s.mistakes).values({ id: newId('mis'), studentId, styleId, question: clean, source });
    // keep the bank at 200 most recent
    await d.execute(sql`delete from mistakes where student_id = ${studentId} and id not in (select id from mistakes where student_id = ${studentId} order by created_at desc limit 200)`);
  }
  async function resolveMistake(d: Db, studentId: string, mistakeId: string) {
    const del = await d.delete(s.mistakes).where(and(eq(s.mistakes.id, mistakeId), eq(s.mistakes.studentId, studentId))).returning({ id: s.mistakes.id });
    if (!del.length) return;
    const st = (await repo.getStudent(d, studentId))!;
    const log = { ...(st.fixedLog || {}) }; log[today()] = (log[today()] || 0) + 1;
    await repo.updateProfile(d, studentId, { mistakesFixed: st.mistakesFixed + 1, fixedLog: log });
  }
  async function finalise(d: Db, l: LessonRow, q: Q, outcome: string) {
    const sid = q.styleId || l.styleId;
    if (q.review) await srUpdate(d, l.studentId, sid, outcome === 'correct');
    if (outcome === 'correct' && q.mistakeId) await resolveMistake(d, l.studentId, q.mistakeId);
    else if (outcome !== 'correct') await addMistake(d, l.studentId, q, sid, l.kind === 'review' ? 'review' : 'lesson');
  }
  async function record(d: Db, studentId: string, styleId: string, outcome: 'correct' | 'incorrect' | 'wrong-final' | 'skipped', xp: number) {
    await repo.bumpProgress(d, studentId, styleId, outcome === 'correct' ? { done: 1, correct: 1 } : outcome === 'skipped' ? { done: 1, skipped: 1 } : outcome === 'wrong-final' ? { done: 1 } : { incorrect: 1 });
    if (outcome !== 'incorrect') await repo.markActive(d, studentId);
    if (xp) await repo.addXpCoins(d, studentId, xp, Math.max(1, Math.round(xp / 2)));
  }

  async function answer(user: AuthUser, lessonId: string, input: string) {
    const out = await db.transaction(async (tx) => {
      const d = tx as unknown as Db;
      const l = await getFor(user, lessonId, d, true);
      if (l.status !== 'active') fail(400, 'Lesson finished');
      const qs = l.questions as Q[]; const results = [...(l.results as (Result | null)[])];
      const q = qs[l.idx]; const sid = q.styleId || l.styleId;
      const r: Result = results[l.idx] || { attempts: 0, hinted: false, outcome: null };
      if (r.outcome) fail(400, 'Already answered');
      r.attempts++;
      const before = (await repo.getStudent(d, l.studentId))!;
      const ok = content.checkAnswer(q.check, input);
      let xp = 0, reveal = false;
      if (ok) {
        xp = r.attempts === 1 ? (r.hinted ? 6 : 10) : r.attempts === 2 ? 5 : 3;
        if (q.review) xp += 3;
        const prev = results.slice(0, l.idx).reverse(); const run = prev.findIndex((x) => !(x && x.outcome === 'correct' && x.attempts === 1));
        if (r.attempts === 1 && (run === -1 ? l.idx : run) >= 2) xp += 2;
        r.outcome = 'correct'; reveal = true;
        await record(d, l.studentId, sid, 'correct', xp); await finalise(d, l, q, 'correct');
      } else if (r.attempts >= 3) {
        r.outcome = 'incorrect'; reveal = true; xp = 1;
        await record(d, l.studentId, sid, 'incorrect', 0); await record(d, l.studentId, sid, 'wrong-final', 1); await finalise(d, l, q, 'incorrect');
      } else {
        await record(d, l.studentId, sid, 'incorrect', 0);
      }
      results[l.idx] = r;
      await tx.update(s.lessons).set({ results, xp: l.xp + xp }).where(eq(s.lessons.id, l.id));
      const after = (await repo.getStudent(d, l.studentId))!;
      return { l, ok, xp, reveal, q, r, levelUp: levelInfo(after.xp).level > levelInfo(before.xp).level, after };
    });
    const rewards = out.levelUp ? await rewards_.check(db, out.l.studentId) : [];
    const after = rewards.length ? (await repo.getStudent(db, out.l.studentId))! : out.after;
    return {
      correct: out.ok, attemptsLeft: out.reveal ? 0 : 3 - out.r.attempts, xp: out.xp, done: out.reveal, coins: after.coins,
      ...(out.reveal ? { answerHtml: out.q.answerHtml, steps: out.q.steps } : { hint: out.r.attempts === 2 ? out.q.hint : null }),
      level: levelInfo(after.xp), rewards,
    };
  }
  const rewards_ = rewards;

  async function hint(user: AuthUser, lessonId: string) {
    return db.transaction(async (tx) => {
      const l = await getFor(user, lessonId, tx as unknown as Db, true);
      const results = [...(l.results as (Result | null)[])];
      const r = results[l.idx] || { attempts: 0, hinted: false, outcome: null }; r.hinted = true; results[l.idx] = r;
      await tx.update(s.lessons).set({ results }).where(eq(s.lessons.id, l.id));
      return { hint: (l.questions as Q[])[l.idx].hint };
    });
  }

  async function skip(user: AuthUser, lessonId: string) {
    return db.transaction(async (tx) => {
      const d = tx as unknown as Db;
      const l = await getFor(user, lessonId, d, true);
      if (l.status !== 'active') fail(400, 'Lesson finished');
      const q = (l.questions as Q[])[l.idx]; const results = [...(l.results as (Result | null)[])];
      const r = results[l.idx] || { attempts: 0, hinted: false, outcome: null };
      if (r.outcome) fail(400, 'Already answered');
      r.outcome = 'skipped'; results[l.idx] = r;
      await record(d, l.studentId, q.styleId || l.styleId, 'skipped', 0); await finalise(d, l, q, 'skipped');
      await tx.update(s.lessons).set({ results }).where(eq(s.lessons.id, l.id));
      return { answerHtml: q.answerHtml, steps: q.steps };
    });
  }

  async function next(user: AuthUser, lessonId: string) {
    const out = await db.transaction(async (tx) => {
      const d = tx as unknown as Db;
      const l = await getFor(user, lessonId, d, true);
      if (l.status !== 'active') return { l, completed: false };
      const results = l.results as (Result | null)[];
      if (!results[l.idx] || !results[l.idx]!.outcome) fail(400, 'Answer or skip this question first');
      const qs = l.questions as Q[];
      if (l.idx + 1 < qs.length) { const [u] = await tx.update(s.lessons).set({ idx: l.idx + 1 }).where(eq(s.lessons.id, l.id)).returning(); return { l: u, completed: false }; }
      const correct = results.filter((r) => r && r.outcome === 'correct').length;
      const bonus = correct === qs.length ? 25 : correct >= qs.length * 0.8 ? 10 : 0;
      if (bonus) await repo.addXpCoins(d, l.studentId, bonus, Math.round(bonus / 2));
      if (l.kind !== 'review' && l.styleId) {
        const core = qs.map((q, i) => [q, results[i]] as const).filter(([q]) => !q.review);
        const acc = core.filter(([, r]) => r && r.outcome === 'correct').length / Math.max(1, core.length);
        await srUpdate(d, l.studentId, l.styleId, acc >= 0.8);
      }
      const [u] = await tx.update(s.lessons).set({ status: 'completed', completedAt: nowIso(), bonus, xp: l.xp + bonus }).where(eq(s.lessons.id, l.id)).returning();
      return { l: u, completed: true };
    });
    let ev: Awaited<ReturnType<typeof rewards.check>> = [];
    if (out.completed) {
      const l = out.l;
      const done = await tasks.autoComplete(db, l.studentId, l.kind === 'review' ? { kind: 'review' } : { kind: 'lesson', styleId: l.styleId, topicId: l.topicId, subject: content.subjectOf(l.styleId) });
      ev = [...done, ...(await rewards.check(db, l.studentId))];
    }
    return { lesson: view(out.l), bonus: out.l.bonus || 0, rewards: ev };
  }

  async function history(studentId: string) {
    const rows = await db.select().from(s.lessons).where(eq(s.lessons.studentId, studentId)).orderBy(desc(s.lessons.createdAt)).limit(60);
    return { lessons: rows.map((l) => ({ id: l.id, kind: l.kind, styleName: l.styleId ? content.getStyle(l.styleId)?.name : 'Review session', topic: l.styleId ? content.getTopic(content.getStyle(l.styleId)?.topicId)?.name : 'Past questions',
      status: l.status, createdAt: l.createdAt, free: l.free, xp: l.xp, correct: (l.results as (Result | null)[]).filter((r) => r && r.outcome === 'correct').length, total: (l.questions as Q[]).length })) };
  }

  return { view, start, startReview, get: async (user: AuthUser, id: string) => ({ lesson: view(await getFor(user, id)) }), answer, hint, skip, next, history, srUpdate, addMistake, record };
}
export type LessonService = ReturnType<typeof createLessonService>;
