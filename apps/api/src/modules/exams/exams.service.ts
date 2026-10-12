import { and, desc, eq, sql } from 'drizzle-orm';
import * as s from '../../db/schema.js';
import type { Db } from '../../db/client.js';
import type { Deps } from '../../core/deps.js';
import { fail } from '../../core/errors.js';
import { newId } from '../../core/ids.js';
import { nowIso, TERM_NAMES } from '../../core/dates.js';
import { examDef, gradeFor, shuffle, yearLocked, yearLockMessage, type ExamDef } from '../common/domain.js';
import * as repo from '../students/students.repo.js';
import type { BillingService } from '../billing/billing.service.js';
import type { RewardsService } from '../rewards/rewards.service.js';
import type { TaskService } from '../tasks/tasks.service.js';
import type { LessonService } from '../lessons/lessons.service.js';
import { stripQ } from '../lessons/lessons.service.js';
import type { AuthUser } from '../../plugins/auth.js';
import { studentFor } from '../common/access.js';

type Attempt = typeof s.examAttempts.$inferSelect;
/* eslint-disable @typescript-eslint/no-explicit-any */
type Q = Record<string, any>;
const gradeOut = (g: string | null) => (g == null ? null : isNaN(Number(g)) ? g : Number(g));

export function createExamService(deps: Deps, billing: BillingService, rewards: RewardsService, tasks: TaskService, lessons: LessonService) {
  const { db, content, exams } = deps;

  function pick(exam: ExamDef, student: repo.Student) {
    let topics = content.topics.filter(exam.scope);
    if (exam.tier === 'F') topics = topics.filter((t) => t.tier !== 'H');
    else if (!exam.tier && exam.kind !== 'topic' && student.tier === 'F' && content.getSubject(exam.subject)?.tiers) topics = topics.filter((t) => t.tier !== 'H');
    if (!topics.length) fail(400, 'This exam has no content yet');
    const styles = topics.flatMap((t) => t.styles.map((sid) => ({ sid, t })));
    const pool = exam.weightCurrent ? styles.flatMap((x) => (x.t.year === exam.weightCurrent ? [x, x, x] : [x])) : styles;
    const qs: Q[] = []; const used = new Set<string>();
    if (exam.balanced) { // every topic at least once, then spread the rest across topics, never repeating a style while unused ones remain
      const order = shuffle(topics);
      for (let i = 0; qs.length < exam.questions && i < 1000; i++) {
        const t = order[i % order.length]; const fresh = t.styles.filter((sid) => !used.has(sid)); const sid = (fresh.length ? fresh : t.styles)[Math.floor(Math.random() * (fresh.length || t.styles.length))];
        used.add(sid);
        qs.push({ ...content.generate(sid), styleId: sid, topic: t.name, strand: t.strand, marks: 1 });
      }
      return shuffle(qs);
    }
    for (let i = 0; qs.length < exam.questions && i < 1000; i++) {
      const x = exam.kind === 'topic' ? styles[qs.length % styles.length] : pool[Math.floor(Math.random() * pool.length)];
      if (exam.kind !== 'topic' && used.has(x.sid) && used.size < styles.length) continue;
      used.add(x.sid);
      qs.push({ ...content.generate(x.sid), styleId: x.sid, topic: x.t.name, strand: x.t.strand, marks: x.t.year >= 10 ? 2 : 1 });
    }
    return exam.kind === 'topic' ? shuffle(qs) : qs.sort((a, b) => a.marks - b.marks);
  }

  function view(a: Attempt, reveal: boolean) {
    const qs = a.questions as Q[]; const answers = (a.answers || []) as string[]; const marked = (a.marked || []) as boolean[]; const similar = (a.similar || {}) as Record<string, { solved: boolean }>;
    return {
      id: a.id, examId: a.examId, kind: a.kind, name: a.name, startedAt: a.startedAt, deadline: a.deadline, submittedAt: a.submittedAt, studentId: a.studentId,
      score: a.score, max: a.max, pct: a.pct, grade: gradeOut(a.grade), tier: a.tier, byStrand: a.byStrand,
      questions: qs.map((q, i) => ({ ...stripQ(q), n: i + 1,
        ...(reveal ? { answerHtml: q.answerHtml, steps: q.steps, hint: q.hint, given: answers[i] || '', correct: !!marked[i], styleName: content.getStyle(q.styleId)?.name, intro: content.getStyle(q.styleId)?.intro, similarDone: !!similar[i]?.solved } : {}) })),
    };
  }

  async function status(studentId: string, subject: string | null) {
    const st = (await repo.getStudent(db, studentId))!;
    const attempts = await db.select({ id: s.examAttempts.id, examId: s.examAttempts.examId, pct: s.examAttempts.pct, grade: s.examAttempts.grade, submittedAt: s.examAttempts.submittedAt, deadline: s.examAttempts.deadline })
      .from(s.examAttempts).where(eq(s.examAttempts.studentId, studentId));
    const now = nowIso();
    return exams.filter((e) => !subject || e.subject === subject).map((e) => {
      const mine = attempts.filter((a) => a.examId === e.id && a.submittedAt);
      const best = mine.reduce<typeof mine[number] | null>((b, a) => (!b || (a.pct || 0) > (b.pct || 0) ? a : b), null);
      const active = attempts.find((a) => a.examId === e.id && !a.submittedAt && a.deadline > now);
      return { id: e.id, subject: e.subject, name: e.name, blurb: e.blurb || null, year: e.year, term: e.term, termName: TERM_NAMES[e.term], kind: e.kind, tier: e.tier || null, questions: e.questions, minutes: e.minutes,
        attempts: mine.length, best: best ? { pct: best.pct, grade: gradeOut(best.grade), id: best.id } : null, activeId: active ? active.id : null,
        recommended: e.year === st.yearGroup, locked: e.year > st.yearGroup, hasContent: content.topics.some(e.scope) };
    });
  }
  async function topicTests(studentId: string) {
    const rows = await db.select().from(s.examAttempts).where(and(eq(s.examAttempts.studentId, studentId), sql`${s.examAttempts.examId} like 'topic:%'`));
    const out: Record<string, { attempts: number; best: { pct: number | null; grade: unknown; id: string } | null; activeId: string | null }> = {};
    for (const a of rows) {
      const k = a.examId.slice(6); const o = (out[k] ||= { attempts: 0, best: null, activeId: null });
      if (a.submittedAt) { o.attempts++; if (!o.best || (a.pct || 0) > (o.best.pct || 0)) o.best = { pct: a.pct, grade: gradeOut(a.grade), id: a.id }; }
      else if (a.deadline > nowIso()) o.activeId = a.id;
    }
    return out;
  }
  async function list(studentId: string, subject: string | null) {
    const rows = await db.select().from(s.examAttempts).where(and(eq(s.examAttempts.studentId, studentId), sql`${s.examAttempts.submittedAt} is not null`, subject ? eq(s.examAttempts.subject, subject) : sql`true`)).orderBy(desc(s.examAttempts.submittedAt));
    return { exams: await status(studentId, subject), attempts: rows.map((a) => ({ id: a.id, examId: a.examId, kind: a.kind, name: a.name, pct: a.pct, grade: gradeOut(a.grade), score: a.score, max: a.max, at: a.submittedAt })) };
  }

  async function start(user: AuthUser, studentId: string, examId: string) {
    const st = await studentFor(db, user, studentId);
    const exam = examDef(exams, content, examId) || fail(404, 'Unknown exam');
    if (yearLocked(exam.year, st.yearGroup)) fail(403, yearLockMessage(exam.year), 'YEAR_LOCKED');
    const [existing] = await db.select().from(s.examAttempts).where(and(eq(s.examAttempts.studentId, studentId), eq(s.examAttempts.examId, exam.id), sql`${s.examAttempts.submittedAt} is null`, sql`${s.examAttempts.deadline} > now()`));
    if (existing) return { attempt: view(existing, false) };
    const questions = pick(exam, st);
    const a = await db.transaction(async (tx) => {
      await billing.charge(tx as unknown as Db, st, exam.kind === 'topic' ? 'test' : 'exam', `${st.name}: ${exam.name}`);
      const [row] = await tx.insert(s.examAttempts).values({ id: newId('exm'), studentId, examId: exam.id, subject: exam.subject, kind: exam.kind, name: exam.name, tier: (exam.tier || st.tier) as 'F' | 'H',
        startedAt: nowIso(), deadline: new Date(Date.now() + exam.minutes * 60e3).toISOString(), questions }).returning();
      return row;
    });
    return { attempt: view(a, false) };
  }

  async function getFor(user: AuthUser, id: string) {
    const [a] = await db.select().from(s.examAttempts).where(eq(s.examAttempts.id, id));
    if (!a) fail(404, 'Exam not found');
    const st = await studentFor(db, user, a!.studentId);
    return { a: a!, st };
  }
  async function get(user: AuthUser, id: string) { const { a } = await getFor(user, id); return { attempt: view(a, !!a.submittedAt) }; }

  async function submit(user: AuthUser, id: string, raw: (string | null)[]) {
    const { a, st } = await getFor(user, id);
    if (a.submittedAt) return { attempt: view(a, true), xp: a.xp || 0, rewards: [] };
    const qs = a.questions as Q[];
    const answers = qs.map((_, i) => String(raw[i] ?? '').slice(0, 200));
    const marked = qs.map((q, i) => !!answers[i] && content.checkAnswer(q.check, answers[i]));
    const max = qs.reduce((t, q) => t + q.marks, 0); const score = qs.reduce((t, q, i) => t + (marked[i] ? q.marks : 0), 0);
    const pct = Math.round((score / max) * 100); const grade = gradeFor(pct, a.tier);
    const byStrand: Record<string, { score: number; max: number }> = {};
    qs.forEach((q, i) => { const b = (byStrand[q.strand] ||= { score: 0, max: 0 }); b.max += q.marks; if (marked[i]) b.score += q.marks; });
    const xp = score * 4 + (pct >= 70 ? 30 : 0);
    const updated = await db.transaction(async (tx) => {
      const d = tx as unknown as Db;
      const [u] = await tx.update(s.examAttempts).set({ answers, marked, max, score, pct, grade: String(grade), byStrand, submittedAt: nowIso(), late: Date.now() > Date.parse(a.deadline) + 60e3, xp })
        .where(and(eq(s.examAttempts.id, a.id), sql`${s.examAttempts.submittedAt} is null`)).returning();
      if (!u) return null;
      for (let i = 0; i < qs.length; i++) {
        const q = qs[i];
        if (!marked[i]) await lessons.addMistake(d, st.id, q, q.styleId, a.kind === 'topic' ? 'topic test' : 'exam');
        const [has] = await d.select({ b: s.reviewSchedule.box }).from(s.reviewSchedule).where(and(eq(s.reviewSchedule.studentId, st.id), eq(s.reviewSchedule.styleId, q.styleId)));
        if (has || marked[i]) await lessons.srUpdate(d, st.id, q.styleId, marked[i]);
      }
      await repo.addXpCoins(d, st.id, xp, Math.max(1, Math.round(xp / 2)));
      await repo.markActive(d, st.id, qs.length);
      const target = (st.targets && st.targets[a.subject]) || st.targetGrade || 7;
      if (typeof grade === 'number' && grade >= target && a.kind !== 'topic') {
        await d.insert(s.certificates).values({ id: newId('crt'), studentId: st.id, key: `exam:${a.id}`, kind: 'exam', title: a.name, subtitle: `Grade ${grade} — on target` }).onConflictDoNothing();
      }
      return u;
    });
    if (!updated) return get(user, id).then((r) => ({ ...r, xp: 0, rewards: [] }));
    const done = await tasks.autoComplete(db, st.id, a.kind === 'topic' ? { kind: 'test', topicId: a.examId.slice(6), examId: a.examId } : { kind: 'exam', examId: a.examId });
    const ev = [...done, ...(await rewards.check(db, st.id))];
    return { attempt: view(updated, true), xp, rewards: ev };
  }

  async function similar(user: AuthUser, id: string, n: number) {
    const { a } = await getFor(user, id);
    if (!a.submittedAt) fail(400, 'Finish the exam first');
    const base = (a.questions as Q[])[n] || fail(404, 'No such question');
    const q = { ...content.generate(base.styleId), styleId: base.styleId };
    const sim = { ...((a.similar || {}) as Record<string, unknown>), [n]: { q, attempts: 0, solved: false } };
    await db.update(s.examAttempts).set({ similar: sim }).where(eq(s.examAttempts.id, a.id));
    return { question: stripQ(q) };
  }
  async function similarAnswer(user: AuthUser, id: string, n: number, input: string) {
    const { a, st } = await getFor(user, id);
    const all = (a.similar || {}) as Record<string, { q: Q; attempts: number; solved: boolean }>;
    const sim = all[n] || fail(400, 'Ask for a similar question first');
    if (sim.solved) fail(400, 'Already answered');
    sim.attempts++;
    const ok = content.checkAnswer(sim.q.check, input);
    const done = ok || sim.attempts >= 2;
    if (done) sim.solved = true;
    await db.update(s.examAttempts).set({ similar: { ...all, [n]: sim } }).where(eq(s.examAttempts.id, a.id));
    if (ok) await lessons.record(db, st.id, sim.q.styleId, 'correct', 8); else if (done) await lessons.record(db, st.id, sim.q.styleId, 'wrong-final', 0);
    const ev = ok ? await rewards.check(db, st.id) : [];
    return { correct: ok, done, attemptsLeft: done ? 0 : 2 - sim.attempts, ...(done ? { answerHtml: sim.q.answerHtml, steps: sim.q.steps } : { hint: sim.q.hint }), rewards: ev };
  }

  return { status, topicTests, list, start, get, submit, similar, similarAnswer, view };
}
export type ExamService = ReturnType<typeof createExamService>;
