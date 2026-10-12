import { and, count, desc, eq, sql } from 'drizzle-orm';
import * as s from '../../db/schema.js';
import type { Deps } from '../../core/deps.js';
import { fail } from '../../core/errors.js';
import { newId } from '../../core/ids.js';
import { addDays } from '../../core/dates.js';
import { hashPassword } from '../../core/password.js';
import { audit } from '../common/audit.js';
import * as repo from '../students/students.repo.js';
import { publicUser, type StudentService } from '../students/students.service.js';
import type { BillingService } from '../billing/billing.service.js';
import type { AuthTokens, AuthUser } from '../../plugins/auth.js';
import type { FamilyService } from '../family/family.service.js';
import { pickColor } from '../auth/auth.service.js';

export function createAdminService(deps: Deps, students: StudentService, billing: BillingService, tokens: AuthTokens, family: FamilyService) {
  const { db, content } = deps;

  async function stats() {
    const users = await db.select({ role: s.users.role, status: s.users.status, freeAccess: s.users.freeAccess, createdAt: s.users.createdAt }).from(s.users);
    const payments = await db.select({ amountPence: s.payments.amountPence, createdAt: s.payments.createdAt, status: s.payments.status }).from(s.payments);
    const lessons = await db.select({ createdAt: s.lessons.createdAt, status: s.lessons.status, topicId: s.lessons.topicId }).from(s.lessons);
    const [{ c: examsTaken }] = await db.select({ c: count() }).from(s.examAttempts).where(sql`${s.examAttempts.submittedAt} is not null`);
    const [{ c: credits }] = await db.select({ c: sql<number>`coalesce(sum(${s.wallets.credits}),0)` }).from(s.wallets);
    const years = await db.select({ y: s.studentProfiles.yearGroup, c: count() }).from(s.studentProfiles).groupBy(s.studentProfiles.yearGroup);
    const days = Array.from({ length: 30 }, (_, i) => {
      const k = addDays(i - 29);
      return { date: k, revenue: payments.filter((p) => p.createdAt.slice(0, 10) === k).reduce((t, p) => t + p.amountPence / 100, 0), lessons: lessons.filter((l) => l.createdAt.slice(0, 10) === k).length,
        signups: users.filter((u) => u.createdAt.slice(0, 10) === k && u.role === 'parent').length };
    });
    const topicCounts: Record<string, number> = {};
    for (const l of lessons) if (l.topicId) topicCounts[l.topicId] = (topicCounts[l.topicId] || 0) + 1;
    return {
      parents: users.filter((u) => u.role === 'parent').length, students: users.filter((u) => u.role === 'student').length, admins: users.filter((u) => u.role === 'admin').length,
      suspended: users.filter((u) => u.status !== 'active').length, freeAccess: users.filter((u) => u.freeAccess).length,
      revenue: payments.filter((p) => p.status === 'succeeded').reduce((t, p) => t + p.amountPence / 100, 0), payments: payments.length, lessons: lessons.length,
      lessonsCompleted: lessons.filter((l) => l.status === 'completed').length, exams: Number(examsTaken), creditsOutstanding: Number(credits), days,
      yearMix: content.years.map((y) => ({ year: y, n: Number(years.find((r) => r.y === y)?.c || 0) })),
      topTopics: Object.entries(topicCounts).sort((a, b) => b[1] - a[1]).slice(0, 6).map(([k, n]) => ({ name: content.getTopic(k)?.name || k, n })),
      audit: (await db.select().from(s.auditLog).orderBy(desc(s.auditLog.createdAt)).limit(25)).map((a) => ({ ...a, at: a.createdAt })),
      curriculum: { topics: content.topics.length, styles: content.topics.reduce((n, t) => n + t.styles.length, 0), learn: content.learnIds().length, subjects: content.subjects.length },
    };
  }

  async function users() {
    const all = await db.select().from(s.users).leftJoin(s.studentProfiles, eq(s.studentProfiles.userId, s.users.id)).leftJoin(s.wallets, eq(s.wallets.parentId, s.users.id)).orderBy(desc(s.users.createdAt));
    const names = new Map(all.map((r) => [r.users.id, r.users]));
    const kids: Record<string, number> = {}; for (const r of all) if (r.users.parentId) kids[r.users.parentId] = (kids[r.users.parentId] || 0) + 1;
    const spent = await db.select({ p: s.payments.parentId, t: sql<number>`sum(${s.payments.amountPence})` }).from(s.payments).groupBy(s.payments.parentId);
    const lessonsBy = await db.select({ st: s.lessons.studentId, c: count() }).from(s.lessons).groupBy(s.lessons.studentId);
    return { users: all.map((r) => ({
      ...publicUser({ ...r.users, ...(r.student_profiles || {}) } as repo.Student), credits: r.wallets?.credits,
      parentName: r.users.parentId ? names.get(r.users.parentId)?.name : undefined, parentFree: r.users.parentId ? !!names.get(r.users.parentId)?.freeAccess : undefined,
      childCount: r.users.role === 'parent' ? kids[r.users.id] || 0 : undefined,
      spent: r.users.role === 'parent' ? Number(spent.find((x) => x.p === r.users.id)?.t || 0) / 100 : undefined,
      lessons: r.users.role === 'student' ? Number(lessonsBy.find((x) => x.st === r.users.id)?.c || 0) : undefined,
    })) };
  }

  async function user(id: string) {
    const [u] = await db.select().from(s.users).where(eq(s.users.id, id));
    if (!u) fail(404, 'User not found');
    const st = u!.role === 'student' ? await repo.getStudent(db, id) : undefined;
    const [w] = u!.role === 'parent' ? await db.select().from(s.wallets).where(eq(s.wallets.parentId, id)) : [];
    const kids = u!.role === 'parent' ? await repo.childrenOf(db, id) : [];
    const kidViews = [];
    for (const k of kids) kidViews.push({ ...publicUser(k), summary: students.summary((await students.load(db, k.id))!) });
    const [parent] = u!.parentId ? await db.select().from(s.users).where(eq(s.users.id, u!.parentId)) : [];
    return {
      user: { ...publicUser(st || u!), ...(w ? { credits: w.credits, freeLessonUsed: w.freeLessonUsed, cardVerified: w.cardVerified, cardBrand: w.cardBrand, cardLast4: w.cardLast4 } : {}) },
      parent: parent ? publicUser(parent) : null, children: kidViews, summary: st ? students.summary((await students.load(db, id))!) : null,
      payments: (await db.select().from(s.payments).where(eq(s.payments.parentId, id)).orderBy(desc(s.payments.createdAt))).map(billing.paymentView),
      ledger: (await db.select().from(s.creditLedger).where(eq(s.creditLedger.parentId, id)).orderBy(desc(s.creditLedger.createdAt)).limit(30)).map((l) => ({ ...l, at: l.createdAt })),
    };
  }

  async function createUser(actor: AuthUser, body: { name: string; email: string; password: string; role: 'admin' | 'parent'; freeAccess: boolean }) {
    const [exists] = await db.select({ id: s.users.id }).from(s.users).where(sql`lower(${s.users.email}) = ${body.email}`);
    if (exists) fail(409, 'Email already in use');
    const id = newId('usr');
    await db.transaction(async (tx) => {
      await tx.insert(s.users).values({ id, role: body.role, name: body.name, email: body.email, passwordHash: await hashPassword(body.password), freeAccess: body.role === 'parent' && body.freeAccess, avatarColor: pickColor() });
      if (body.role === 'parent') await tx.insert(s.wallets).values({ parentId: id });
    });
    await audit(db, actor, 'admin-create-user', `${body.role} ${body.email}${body.freeAccess ? ' (free access)' : ''}`);
    const [u] = await db.select().from(s.users).where(eq(s.users.id, id));
    return { user: publicUser(u) };
  }

  async function patchUser(actor: AuthUser, id: string, b: Record<string, unknown> & { status?: string; role?: string; freeAccess?: boolean; name?: string; creditDelta?: number; coinDelta?: number; reason?: string; resetFreeLesson?: boolean }) {
    const [u] = await db.select().from(s.users).where(eq(s.users.id, id));
    if (!u) fail(404, 'User not found');
    if (b.status && b.status !== u!.status) {
      if (u!.id === actor.id) fail(400, 'You cannot suspend yourself');
      await db.update(s.users).set({ status: b.status as 'active' | 'suspended' }).where(eq(s.users.id, id));
      if (b.status === 'suspended') await tokens.revokeAllFor(id);
      await audit(db, actor, `user-${b.status}`, u!.name);
    }
    if (b.role && u!.role !== 'student' && b.role !== u!.role) {
      if (u!.id === actor.id) fail(400, 'You cannot change your own role');
      await db.update(s.users).set({ role: b.role as 'admin' | 'parent' }).where(eq(s.users.id, id));
      if (b.role === 'parent') await db.insert(s.wallets).values({ parentId: id }).onConflictDoNothing();
      await audit(db, actor, 'role-change', `${u!.name} → ${b.role}`);
    }
    if (typeof b.freeAccess === 'boolean' && u!.role !== 'admin') { await db.update(s.users).set({ freeAccess: b.freeAccess }).where(eq(s.users.id, id)); await audit(db, actor, b.freeAccess ? 'free-access-on' : 'free-access-off', u!.name); }
    if (b.name) await db.update(s.users).set({ name: b.name }).where(eq(s.users.id, id));
    if (u!.role === 'student') { const st = (await repo.getStudent(db, id))!; await family.update(st, { yearGroup: b.yearGroup as number | undefined, tier: b.tier as 'F' | 'H' | undefined, targetGrade: b.targetGrade as number | undefined, username: b.username as string | undefined }); }
    if (b.creditDelta) {
      const parentId = u!.role === 'student' ? u!.parentId! : u!.id;
      if (u!.role === 'admin') fail(400, 'Credits can only be adjusted on parent accounts');
      const w = await billing.wallet(db, parentId);
      if (w.credits + b.creditDelta < 0) fail(400, 'Balance cannot go below zero');
      await billing.adjustCredits(db, parentId, b.creditDelta, b.reason || 'Admin adjustment', actor.id);
      await audit(db, actor, 'credit-adjust', `${u!.name} ${b.creditDelta > 0 ? '+' : ''}${b.creditDelta}`);
    }
    if (b.coinDelta && u!.role === 'student') {
      await db.update(s.studentProfiles).set({ coins: sql`greatest(0, ${s.studentProfiles.coins} + ${b.coinDelta})` }).where(eq(s.studentProfiles.userId, id));
      if (b.coinDelta > 0) await repo.notify(db, id, { type: 'gift', title: 'You received coins!', text: `+${b.coinDelta} coins from the Stepwise team`, icon: '🪙' });
      await audit(db, actor, 'coin-adjust', `${u!.name} ${b.coinDelta > 0 ? '+' : ''}${b.coinDelta}`);
    }
    if (b.resetFreeLesson && u!.role === 'parent') await db.update(s.wallets).set({ freeLessonUsed: false }).where(eq(s.wallets.parentId, id));
    return { user: (await user(id)).user };
  }

  async function resetPassword(actor: AuthUser, id: string, password: string) {
    const [u] = await db.select().from(s.users).where(eq(s.users.id, id));
    if (!u) fail(404, 'User not found');
    await db.update(s.users).set({ passwordHash: await hashPassword(password) }).where(eq(s.users.id, id));
    await tokens.revokeAllFor(id);
    await audit(db, actor, 'password-reset', u!.name);
    return { ok: true as const };
  }
  async function deleteUser(actor: AuthUser, id: string) {
    if (id === actor.id) fail(400, 'You cannot delete yourself');
    const [u] = await db.delete(s.users).where(eq(s.users.id, id)).returning();
    if (!u) fail(404, 'User not found');
    await audit(db, actor, 'delete-user', `${u!.role} ${u!.name}`);
    return { ok: true as const };
  }
  async function payments() {
    const p = await db.select().from(s.payments).leftJoin(s.users, eq(s.users.id, s.payments.parentId)).orderBy(desc(s.payments.createdAt));
    const l = await db.select().from(s.creditLedger).orderBy(desc(s.creditLedger.createdAt)).limit(200);
    return { payments: p.map((r) => ({ ...billing.paymentView(r.payments), parentName: r.users?.name })), ledger: l.map((x) => ({ ...x, at: x.createdAt })) };
  }
  void and;
  return { stats, users, user, createUser, patchUser, resetPassword, deleteUser, payments };
}
export type AdminService = ReturnType<typeof createAdminService>;
