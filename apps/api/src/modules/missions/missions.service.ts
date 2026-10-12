import { and, desc, eq, sql } from 'drizzle-orm';
import * as s from '../../db/schema.js';
import type { Db } from '../../db/client.js';
import type { Deps } from '../../core/deps.js';
import { fail } from '../../core/errors.js';
import { addDays, nowIso, today } from '../../core/dates.js';
import { MISSION_BONUS } from '../common/domain.js';
import * as repo from '../students/students.repo.js';
import type { StudentService } from '../students/students.service.js';

type Mission = { id: string; title: string; icon: string; target: number; coins: number; subject?: string };

export function createMissionService(deps: Deps, students: StudentService) {
  const { content } = deps;

  async function lessonsOn(db: Db, studentId: string, date: string) {
    const rows = await db.select({ kind: s.lessons.kind, styleId: s.lessons.styleId }).from(s.lessons)
      .where(and(eq(s.lessons.studentId, studentId), eq(s.lessons.status, 'completed'), sql`${s.lessons.completedAt}::date = ${date}::date`));
    return rows;
  }

  async function ensure(db: Db, studentId: string, date = today()) {
    const [row] = await db.select().from(s.dailyMissions).where(and(eq(s.dailyMissions.studentId, studentId), eq(s.dailyMissions.day, date)));
    if (row) return row;
    const st = (await students.load(db, studentId))!;
    const subs = (st.student.subjects?.length ? st.student.subjects : content.subjects.map((x) => x.id)).filter((x) => content.getSubject(x));
    const ranked = subs.map((x) => { const sm = students.summary(st, x); return { x, gap: typeof sm.predicted === 'number' ? students.targetFor(st.student, x) - sm.predicted : 0.5 }; }).sort((a, b) => b.gap - a.gap);
    const top = ranked.filter((r) => r.gap === ranked[0].gap);
    const focus = top[new Date(date).getUTCDate() % top.length].x;
    const qTarget = ({ 7: 15, 8: 20, 9: 20, 10: 25, 11: 30 } as Record<number, number>)[st.student.yearGroup] || 20;
    const mistakes = await repo.mistakeCount(db, studentId);
    const missions: Mission[] = [
      { id: 'questions', title: `Answer ${qTarget} questions`, icon: '✏️', target: qTarget, coins: 20 },
      { id: 'lesson', title: 'Complete a lesson', icon: '📘', target: 1, coins: 20 },
      { id: 'focus', title: `Do a ${content.getSubject(focus)!.name} lesson`, icon: content.getSubject(focus)!.icon, target: 1, coins: 25, subject: focus },
      mistakes >= 3 ? { id: 'fix', title: 'Fix 3 past mistakes', icon: '🔧', target: 3, coins: 25 } : { id: 'review', title: 'Complete a review session', icon: '🔁', target: 1, coins: 20 },
    ];
    const [created] = await db.insert(s.dailyMissions).values({ studentId, day: date, missions }).onConflictDoNothing().returning();
    return created || (await db.select().from(s.dailyMissions).where(and(eq(s.dailyMissions.studentId, studentId), eq(s.dailyMissions.day, date))))[0];
  }

  async function view(db: Db, studentId: string) {
    const date = today();
    const day = await ensure(db, studentId, date);
    const [act, done, st] = await Promise.all([repo.activityMap(db, studentId, date), lessonsOn(db, studentId, date), repo.getStudent(db, studentId)]);
    const progressOf = (m: Mission) => ({
      questions: act[date] || 0,
      lesson: done.filter((l) => l.kind !== 'review').length,
      focus: done.filter((l) => l.kind !== 'review' && content.subjectOf(l.styleId) === m.subject).length,
      fix: (st!.fixedLog || {})[date] || 0,
      review: done.filter((l) => l.kind === 'review').length,
    } as Record<string, number>)[m.id] || 0;
    const claimed = day.claimed || {};
    const missions = (day.missions as Mission[]).map((m) => { const p = progressOf(m); return { ...m, progress: Math.min(p, m.target), done: p >= m.target, claimed: !!claimed[m.id] }; });
    return { date, missions, allDone: missions.every((m) => m.done), bonus: MISSION_BONUS, bonusClaimed: day.bonusClaimed, coinsAvailable: missions.filter((m) => m.done && !m.claimed).reduce((t, m) => t + m.coins, 0), streak: await streak(db, studentId) };
  }
  async function streak(db: Db, studentId: string) {
    const rows = await db.select({ day: s.dailyMissions.day, b: s.dailyMissions.bonusClaimed }).from(s.dailyMissions).where(eq(s.dailyMissions.studentId, studentId)).orderBy(desc(s.dailyMissions.day)).limit(60);
    const m = new Map(rows.map((r) => [r.day, r.b])); let n = 0;
    for (let i = 1; i < 60; i++) { if (m.get(addDays(-i))) n++; else break; }
    return n + (m.get(today()) ? 1 : 0);
  }
  async function claim(db: Db, studentId: string, missionId?: string) {
    const v = await view(db, studentId);
    const [day] = await db.select().from(s.dailyMissions).where(and(eq(s.dailyMissions.studentId, studentId), eq(s.dailyMissions.day, v.date)));
    const claimed = { ...(day.claimed || {}) }; let coins = 0; const events = [];
    for (const m of v.missions) if ((!missionId || missionId === m.id) && m.done && !claimed[m.id]) { claimed[m.id] = nowIso(); coins += m.coins; }
    let bonusClaimed = day.bonusClaimed;
    if (v.allDone && !bonusClaimed) {
      bonusClaimed = true; coins += MISSION_BONUS;
      const ev = { type: 'missions', title: 'All daily missions complete!', text: `Treasure chest: +${MISSION_BONUS} bonus coins.`, icon: '🧰' };
      events.push(ev); await repo.notify(db, studentId, { ...ev, seen: true });
    }
    if (!coins) fail(400, 'Nothing to claim yet');
    await db.update(s.dailyMissions).set({ claimed, bonusClaimed }).where(and(eq(s.dailyMissions.studentId, studentId), eq(s.dailyMissions.day, v.date)));
    await repo.addXpCoins(db, studentId, 0, coins);
    const st = await repo.getStudent(db, studentId);
    return { coins, total: st!.coins, missions: await view(db, studentId), rewards: events };
  }
  return { view, claim, ensure };
}
export type MissionService = ReturnType<typeof createMissionService>;
