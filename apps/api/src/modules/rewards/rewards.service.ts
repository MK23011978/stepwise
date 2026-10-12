import { and, desc, eq, sql } from 'drizzle-orm';
import * as s from '../../db/schema.js';
import type { Db } from '../../db/client.js';
import type { Deps } from '../../core/deps.js';
import { fail } from '../../core/errors.js';
import { newId } from '../../core/ids.js';
import { nowIso } from '../../core/dates.js';
import * as repo from '../students/students.repo.js';
import type { StudentService, StudentState } from '../students/students.service.js';
import type { BillingService } from '../billing/billing.service.js';
import { levelInfo, styleStatus, REWARD_EVERY_LESSONS, SHOP } from '../common/domain.js';

export interface RewardEvent { type: string; title: string; text?: string; icon?: string; certId?: string; level?: number; goalId?: string }
export const GOAL_LABELS: Record<string, string> = { lessons: 'Complete lessons', mastered: 'Master question styles', xp: 'Earn XP', streak: 'Reach a day streak of', grade: 'Score at least grade', reviews: 'Complete review sessions' };

export function createRewardsService(deps: Deps, students: StudentService, billing: BillingService) {
  const { content } = deps;

  function goalMetric(st: StudentState, g: { type: string; createdAt: string }) {
    switch (g.type) {
      case 'lessons': return st.lessons;
      case 'mastered': return students.summary(st).mastered;
      case 'xp': return st.student.xp;
      case 'streak': return students.streak(st);
      case 'reviews': return st.reviews;
      case 'grade': return Math.max(0, ...st.exams.filter((e) => (e.submittedAt || '') >= g.createdAt && !isNaN(Number(e.grade))).map((e) => Number(e.grade)));
      default: return 0;
    }
  }
  const relative = (type: string) => ['lessons', 'mastered', 'xp', 'reviews'].includes(type);
  function goalView(st: StudentState, g: typeof s.goals.$inferSelect) {
    const v = goalMetric(st, g); const progress = relative(g.type) ? v - g.baseline : v;
    return { ...g, label: GOAL_LABELS[g.type], progress: Math.max(0, Math.min(progress, g.target)), pct: Math.min(100, Math.round((Math.max(0, progress) / g.target) * 100)) };
  }

  /** Detects newly earned rewards, applies them and returns events to celebrate (stored as seen notifications). */
  async function check(db: Db, studentId: string): Promise<RewardEvent[]> {
    const events: RewardEvent[] = [];
    let st = (await students.load(db, studentId))!;
    const s0 = st.student;
    // free-lesson milestones
    const due = Math.floor(st.lessons / REWARD_EVERY_LESSONS);
    for (let m = s0.milestones + 1; m <= due; m++) {
      await billing.adjustCredits(db, s0.parentId!, 1, `Reward — ${s0.name} completed ${m * REWARD_EVERY_LESSONS} lessons`);
      events.push({ type: 'milestone', title: `${m * REWARD_EVERY_LESSONS} lessons completed!`, text: 'You earned a FREE lesson for your family wallet. 🎁', icon: '🎁' });
    }
    if (due > s0.milestones) await repo.updateProfile(db, studentId, { milestones: due });
    // certificates
    const has = new Set(st.certificates.map((c) => c.key));
    let xp = 0, coins = 0;
    for (const t of content.topics) {
      const key = `topic:${t.id}`;
      if (!has.has(key) && t.styles.every((sid) => styleStatus(st.progress[sid]) === 'mastered')) {
        const id = newId('crt');
        await db.insert(s.certificates).values({ id, studentId, key, kind: 'topic', title: t.name, subtitle: `${content.getSubject(t.subject)?.name} · Year ${t.year} · ${content.strands.find((x) => x.id === t.strand)?.name}` }).onConflictDoNothing();
        xp += 50; events.push({ type: 'certificate', title: 'Topic certificate earned!', text: `You mastered every style in ${t.name}. +50 XP`, icon: '📜', certId: id });
      }
    }
    for (const sub of content.subjects) for (const y of content.years) {
      const ts = content.topics.filter((t) => t.subject === sub.id && t.year === y && !(sub.tiers && s0.tier === 'F' && t.tier === 'H'));
      const key = `year:${sub.id}:${y}`;
      if (ts.length && !has.has(key) && ts.every((t) => t.styles.every((sid) => ['completed', 'mastered'].includes(styleStatus(st.progress[sid]))))) {
        const id = newId('crt');
        await db.insert(s.certificates).values({ id, studentId, key, kind: 'year', title: `Year ${y} ${sub.id === 'maths' ? 'Mathematics' : sub.name}`, subtitle: 'Every topic completed' }).onConflictDoNothing();
        xp += 200; coins += 200; events.push({ type: 'certificate', title: `Year ${y} ${sub.name} complete!`, text: 'An amazing achievement. +200 XP and 200 coins!', icon: '🎓', certId: id });
      }
    }
    if (xp || coins) { await repo.addXpCoins(db, studentId, xp, coins); }
    if (events.some((e) => e.type === 'certificate')) st = (await students.load(db, studentId))!;
    // badges
    const badges = { ...(st.student.badges || {}) }; let badgeXp = 0;
    for (const b of students.summary(st).badges) if (b.got && !badges[b.id]) {
      badges[b.id] = nowIso(); badgeXp += 20;
      events.push({ type: 'badge', title: `New badge: ${b.name}`, text: `${b.desc}. +20 XP bonus!`, icon: b.icon });
    }
    // level ups
    const totalXp = st.student.xp + badgeXp;
    const lvl = levelInfo(totalXp).level; let levelCoins = 0; let lastLevel = st.student.lastLevel;
    if (lvl > lastLevel) { levelCoins = 25 * (lvl - lastLevel); events.push({ type: 'level', title: `Level ${lvl}!`, text: `You levelled up and earned ${levelCoins} bonus coins.`, icon: '⬆️', level: lvl }); lastLevel = lvl; }
    if (badgeXp || levelCoins || lastLevel !== st.student.lastLevel) {
      await db.update(s.studentProfiles).set({ badges, lastLevel, xp: sql`${s.studentProfiles.xp} + ${badgeXp}`, coins: sql`${s.studentProfiles.coins} + ${levelCoins}` }).where(eq(s.studentProfiles.userId, studentId));
    }
    // parent goals
    const goals = await db.select().from(s.goals).where(and(eq(s.goals.studentId, studentId), sql`${s.goals.achievedAt} is null`));
    for (const g of goals) {
      const v = goalView(st, g);
      if (v.progress >= g.target) {
        await db.update(s.goals).set({ achievedAt: nowIso() }).where(eq(s.goals.id, g.id));
        events.push({ type: 'goal', title: 'Goal achieved!', text: `${v.label} ${g.target} — your reward: ${g.reward}`, icon: '🎉', goalId: g.id });
      }
    }
    for (const e of events) await repo.notify(db, studentId, { ...e, seen: true });
    return events;
  }

  async function overview(db: Db, studentId: string) {
    const st = (await students.load(db, studentId))!;
    const sum = students.summary(st);
    const goals = await db.select().from(s.goals).where(eq(s.goals.studentId, studentId)).orderBy(s.goals.createdAt);
    return {
      coins: st.student.coins, owned: st.student.owned, equipped: st.student.equipped, freezes: st.student.freezes, shop: SHOP, badges: sum.badges, level: sum.level,
      certificates: st.certificates.slice().reverse().map((c) => ({ ...c, at: c.createdAt })), goals: goals.map((g) => goalView(st, g)), goalTypes: GOAL_LABELS,
      inbox: (await repo.notificationsOf(db, studentId, 30)).map((n) => ({ ...n, ...(n.meta as object), at: n.createdAt })),
      lessonsCompleted: sum.lessonsCompleted, nextReward: sum.nextReward, rewardEvery: REWARD_EVERY_LESSONS,
    };
  }

  async function shop(db: Db, studentId: string, itemId: string, action: 'buy' | 'equip') {
    const item = SHOP.find((x) => x.id === itemId) || fail(404, 'Unknown item');
    const st = (await repo.getStudent(db, studentId))!;
    const owned = [...(st.owned || [])]; const equipped = { ...(st.equipped || {}) };
    if (action === 'equip') {
      if (!owned.includes(item.id)) fail(400, 'Buy this item first');
      equipped[item.kind] = equipped[item.kind] === item.id ? null : item.id;
      await repo.updateProfile(db, studentId, { equipped });
      return { equipped };
    }
    if (item.kind !== 'consumable' && owned.includes(item.id)) fail(400, 'You already own this');
    if (st.coins < item.price) fail(400, `You need ${item.price - st.coins} more coins`);
    const patch: Partial<repo.ProfileRow> = { coins: st.coins - item.price };
    if (item.kind === 'consumable') patch.freezes = st.freezes + 1; else { owned.push(item.id); equipped[item.kind] = item.id; patch.owned = owned; patch.equipped = equipped; }
    await repo.updateProfile(db, studentId, patch);
    await repo.notify(db, studentId, { type: 'shop', title: `Unlocked: ${item.name}`, text: `Bought for ${item.price} coins`, icon: item.emoji || '🎨', seen: true });
    return { coins: patch.coins, owned: patch.owned || owned, equipped: patch.equipped || equipped, freezes: patch.freezes ?? st.freezes };
  }

  async function createGoal(db: Db, studentId: string, userId: string, body: { type: string; target: number; reward: string }) {
    if (body.type === 'grade' && body.target > 9) fail(400, 'Grades go up to 9');
    const active = await db.select({ id: s.goals.id }).from(s.goals).where(and(eq(s.goals.studentId, studentId), sql`${s.goals.achievedAt} is null`));
    if (active.length >= 5) fail(400, 'Maximum 5 active goals');
    const st = (await students.load(db, studentId))!;
    const id = newId('gol'); const createdAt = nowIso();
    const baseline = relative(body.type) ? goalMetric(st, { type: body.type, createdAt }) : 0;
    const [g] = await db.insert(s.goals).values({ id, studentId, type: body.type, target: body.target, reward: body.reward, baseline, createdBy: userId, createdAt }).returning();
    await repo.notify(db, studentId, { type: 'goal-new', title: 'New reward goal!', text: `${GOAL_LABELS[body.type]} ${body.target} to earn: ${body.reward}`, icon: '🎯' });
    return { goal: goalView(st, g) };
  }
  async function deliverGoal(db: Db, studentId: string, goalId: string) {
    const [g] = await db.update(s.goals).set({ deliveredAt: nowIso() }).where(and(eq(s.goals.id, goalId), eq(s.goals.studentId, studentId))).returning();
    if (!g) fail(404, 'Goal not found');
    await repo.notify(db, studentId, { type: 'goal-delivered', title: 'Reward delivered 🎁', text: g.reward, icon: '🎁' });
    return { goal: goalView((await students.load(db, studentId))!, g) };
  }
  async function deleteGoal(db: Db, studentId: string, goalId: string) { await db.delete(s.goals).where(and(eq(s.goals.id, goalId), eq(s.goals.studentId, studentId))); return { ok: true as const }; }
  async function certificate(db: Db, studentId: string, certId: string) {
    const [c] = await db.select().from(s.certificates).where(and(eq(s.certificates.id, certId), eq(s.certificates.studentId, studentId)));
    if (!c) fail(404, 'Certificate not found');
    const st = (await repo.getStudent(db, studentId))!;
    return { certificate: { ...c, at: c.createdAt }, student: { name: st.name, yearGroup: st.yearGroup } };
  }
  async function goalsOf(db: Db, st: StudentState) {
    return (await db.select().from(s.goals).where(eq(s.goals.studentId, st.student.id)).orderBy(desc(s.goals.createdAt))).map((g) => goalView(st, g));
  }
  return { check, overview, shop, createGoal, deliverGoal, deleteGoal, certificate, goalsOf, goalView };
}
export type RewardsService = ReturnType<typeof createRewardsService>;
