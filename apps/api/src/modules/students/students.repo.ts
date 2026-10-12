// Data access for students: profile, progress, activity, review schedule, mistakes, notifications.
import { and, asc, desc, eq, gte, inArray, sql, count } from 'drizzle-orm';
import type { Db } from '../../db/client.js';
import * as s from '../../db/schema.js';
import { newId } from '../../core/ids.js';
import { nowIso, today } from '../../core/dates.js';

export type UserRow = typeof s.users.$inferSelect;
export type ProfileRow = typeof s.studentProfiles.$inferSelect;
export type Student = UserRow & ProfileRow;
export type ProgressMap = Record<string, { done: number; correct: number; incorrect: number; skipped: number; lastAt: string | null }>;

export async function getStudent(db: Db, id: string): Promise<Student | undefined> {
  const rows = await db.select().from(s.users).innerJoin(s.studentProfiles, eq(s.studentProfiles.userId, s.users.id)).where(eq(s.users.id, id));
  return rows[0] ? { ...rows[0].users, ...rows[0].student_profiles } : undefined;
}
export async function childrenOf(db: Db, parentId: string): Promise<Student[]> {
  const rows = await db.select().from(s.users).innerJoin(s.studentProfiles, eq(s.studentProfiles.userId, s.users.id)).where(eq(s.users.parentId, parentId)).orderBy(asc(s.users.createdAt));
  return rows.map((r) => ({ ...r.users, ...r.student_profiles }));
}
export async function updateProfile(db: Db, id: string, patch: Partial<ProfileRow>) {
  if (Object.keys(patch).length) await db.update(s.studentProfiles).set(patch).where(eq(s.studentProfiles.userId, id));
}
export async function addXpCoins(db: Db, id: string, xp: number, coins: number) {
  await db.update(s.studentProfiles).set({ xp: sql`${s.studentProfiles.xp} + ${xp}`, coins: sql`${s.studentProfiles.coins} + ${coins}` }).where(eq(s.studentProfiles.userId, id));
}

// progress
export async function progressMap(db: Db, studentId: string): Promise<ProgressMap> {
  const rows = await db.select().from(s.styleProgress).where(eq(s.styleProgress.studentId, studentId));
  return Object.fromEntries(rows.map((r) => [r.styleId, { done: r.done, correct: r.correct, incorrect: r.incorrect, skipped: r.skipped, lastAt: r.lastAt }]));
}
export async function bumpProgress(db: Db, studentId: string, styleId: string, d: { done?: number; correct?: number; incorrect?: number; skipped?: number }) {
  const v = { done: d.done || 0, correct: d.correct || 0, incorrect: d.incorrect || 0, skipped: d.skipped || 0 };
  await db.insert(s.styleProgress).values({ studentId, styleId, ...v, lastAt: nowIso() }).onConflictDoUpdate({
    target: [s.styleProgress.studentId, s.styleProgress.styleId],
    set: { done: sql`${s.styleProgress.done} + ${v.done}`, correct: sql`${s.styleProgress.correct} + ${v.correct}`, incorrect: sql`${s.styleProgress.incorrect} + ${v.incorrect}`, skipped: sql`${s.styleProgress.skipped} + ${v.skipped}`, lastAt: nowIso() },
  });
}

// activity
export async function activityMap(db: Db, studentId: string, sinceDay?: string): Promise<Record<string, number>> {
  const rows = await db.select().from(s.dailyActivity).where(sinceDay ? and(eq(s.dailyActivity.studentId, studentId), gte(s.dailyActivity.day, sinceDay)) : eq(s.dailyActivity.studentId, studentId));
  return Object.fromEntries(rows.map((r) => [r.day, r.questions]));
}
export async function markActive(db: Db, studentId: string, n = 1) {
  await db.insert(s.dailyActivity).values({ studentId, day: today(), questions: n }).onConflictDoUpdate({
    target: [s.dailyActivity.studentId, s.dailyActivity.day], set: { questions: sql`${s.dailyActivity.questions} + ${n}` },
  });
}

// spaced repetition
export async function reviewRows(db: Db, studentId: string) { return db.select().from(s.reviewSchedule).where(eq(s.reviewSchedule.studentId, studentId)); }
export async function upsertReview(db: Db, studentId: string, styleId: string, box: number, due: string) {
  await db.insert(s.reviewSchedule).values({ studentId, styleId, box, due, lastAt: nowIso() }).onConflictDoUpdate({
    target: [s.reviewSchedule.studentId, s.reviewSchedule.styleId], set: { box, due, lastAt: nowIso() },
  });
}

// mistakes bank
export async function mistakesOf(db: Db, studentId: string, limit = 200) {
  return db.select().from(s.mistakes).where(eq(s.mistakes.studentId, studentId)).orderBy(desc(s.mistakes.createdAt)).limit(limit);
}
export async function mistakeCount(db: Db, studentId: string) {
  return Number((await db.select({ c: count() }).from(s.mistakes).where(eq(s.mistakes.studentId, studentId)))[0].c);
}

// lessons / exams aggregates
export async function lessonCounts(db: Db, studentId: string) {
  const rows = await db.select({ kind: s.lessons.kind, c: count() }).from(s.lessons)
    .where(and(eq(s.lessons.studentId, studentId), eq(s.lessons.status, 'completed'))).groupBy(s.lessons.kind);
  const m = Object.fromEntries(rows.map((r) => [r.kind, Number(r.c)]));
  return { lessons: m.lesson || 0, reviews: m.review || 0 };
}
export async function hasPerfectLesson(db: Db, studentId: string) {
  const r = await db.execute(sql`select 1 from lessons where student_id = ${studentId} and status = 'completed' and kind <> 'review'
    and jsonb_array_length(results) > 0 and not exists (select 1 from jsonb_array_elements(results) e where e->>'outcome' <> 'correct' or (e->>'attempts')::int <> 1) limit 1`);
  return ((r as unknown as { rows: unknown[] }).rows || []).length > 0;
}
export async function submittedExams(db: Db, studentId: string) {
  return db.select({ id: s.examAttempts.id, examId: s.examAttempts.examId, subject: s.examAttempts.subject, kind: s.examAttempts.kind, name: s.examAttempts.name,
    pct: s.examAttempts.pct, grade: s.examAttempts.grade, score: s.examAttempts.score, max: s.examAttempts.max, submittedAt: s.examAttempts.submittedAt })
    .from(s.examAttempts).where(and(eq(s.examAttempts.studentId, studentId), sql`${s.examAttempts.submittedAt} is not null`)).orderBy(asc(s.examAttempts.submittedAt));
}
export async function certificatesOf(db: Db, studentId: string) {
  return db.select().from(s.certificates).where(eq(s.certificates.studentId, studentId)).orderBy(asc(s.certificates.createdAt));
}

// notifications (the student's reward inbox)
export async function notify(db: Db, studentId: string, ev: { type: string; title: string; text?: string; icon?: string; seen?: boolean; [k: string]: unknown }) {
  const { type, title, text, icon, seen, ...meta } = ev;
  await db.insert(s.notifications).values({ id: newId('evt'), studentId, type, title, text: text || null, icon: icon || null, meta, seen: !!seen });
}
export async function notificationsOf(db: Db, studentId: string, limit = 30) {
  return db.select().from(s.notifications).where(eq(s.notifications.studentId, studentId)).orderBy(desc(s.notifications.createdAt)).limit(limit);
}
export async function takeUnseen(db: Db, studentId: string) {
  const rows = await db.select().from(s.notifications).where(and(eq(s.notifications.studentId, studentId), eq(s.notifications.seen, false))).orderBy(desc(s.notifications.createdAt)).limit(20);
  if (rows.length) await db.update(s.notifications).set({ seen: true }).where(inArray(s.notifications.id, rows.map((r) => r.id)));
  return rows;
}
