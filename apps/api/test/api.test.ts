// End-to-end API behaviour (ported from the v1 test suite) against PostgreSQL 16 (PGlite).
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { eq } from 'drizzle-orm';
import * as s from '../src/db/schema.js';
import { hashPassword } from '../src/core/password.js';
import { makeApp, client } from './setup.js';

let ctx: Awaited<ReturnType<typeof makeApp>>;
beforeAll(async () => { ctx = await makeApp(); }, 120_000);
afterAll(async () => ctx?.close());

const lesson = async (id: string) => (await ctx.deps.db.select().from(s.lessons).where(eq(s.lessons.id, id)))[0];
const attempt = async (id: string) => (await ctx.deps.db.select().from(s.examAttempts).where(eq(s.examAttempts.id, id)))[0];
const qs = (row: { questions: unknown }) => row.questions as { answer: string }[];

describe('stage 2 — full API flow', () => {
  it('runs the whole family journey', async () => {
    const c = client(ctx.app);
    const cur = await c.call('GET', '/curriculum');
    expect(cur.subjects.length).toBeGreaterThanOrEqual(1);
    expect(cur.years).toEqual(expect.arrayContaining([7, 11]));

    await c.call('POST', '/auth/register', { name: 'Test Parent', email: 'tp@example.test', password: 'longenough1' });
    const me = await c.call('GET', '/me');
    expect(me.wallet.cardCheckRequired).toBe(true);
    const { child } = await c.call('POST', '/children', { name: 'Kid', yearGroup: 9, tier: 'H', targetGrade: 7, username: 'kid.test', password: 'kidpassword' });
    expect(child.subjects.length).toBe(cur.subjects.length);
    const y9 = cur.topics.find((t: { subject: string; year: number }) => t.subject === 'maths' && t.year === 9);
    const styleId = y9.styles[0].id;

    // free trial needs a £0 card check first
    await c.call('POST', '/lessons', { studentId: child.id, styleId }, 428);
    expect((await c.call('POST', '/billing/verify-card', { demo: true })).trialAvailable).toBe(true);
    const { lesson: L0 } = await c.call('POST', '/lessons', { studentId: child.id, styleId });
    expect(L0.free).toBe(true);
    expect(L0.question.check).toBeUndefined(); // answers never leave the server
    const L = await lesson(L0.id);
    for (let i = 0; i < qs(L).length; i++) {
      if (i === 3) await c.call('POST', `/lessons/${L.id}/skip`);
      else if (i === 5) { for (let k = 0; k < 3; k++) await c.call('POST', `/lessons/${L.id}/answer`, { input: 'zzz' }); }
      else expect((await c.call('POST', `/lessons/${L.id}/answer`, { input: qs(L)[i].answer })).correct).toBe(true);
      await c.call('POST', `/lessons/${L.id}/next`);
    }
    expect((await lesson(L.id)).status).toBe('completed');
    const rv = await c.call('GET', `/students/${child.id}/review`);
    expect(rv.mistakeCount).toBeGreaterThanOrEqual(2);
    expect(rv.tracked).toBeGreaterThanOrEqual(1);

    // free review session fixes the mistakes
    const { lesson: R0 } = await c.call('POST', '/reviews', { studentId: child.id, mode: 'mistakes' });
    const R = await lesson(R0.id);
    for (let i = 0; i < qs(R).length; i++) { await c.call('POST', `/lessons/${R.id}/answer`, { input: qs(R)[i].answer }); await c.call('POST', `/lessons/${R.id}/next`); }
    expect((await c.call('GET', `/students/${child.id}/review`)).mistakeCount).toBe(0);

    // another subject (multiple choice) — needs credits
    await c.call('POST', '/billing/checkout', { packId: 'pack10' });
    const other = cur.topics.find((t: { subject: string }) => t.subject !== 'maths');
    if (other) {
      const { lesson: B0 } = await c.call('POST', '/lessons', { studentId: child.id, styleId: other.styles[0].id });
      const B = await lesson(B0.id);
      expect((await c.call('POST', `/lessons/${B.id}/answer`, { input: qs(B)[0].answer })).correct).toBe(true);
      expect((await c.call('GET', `/students/${child.id}/overview?subject=${other.subject}`)).subject).toBe(other.subject);
    }
    const before = (await c.call('GET', '/billing')).credits;
    await c.call('POST', '/lessons', { studentId: child.id, styleId: y9.styles[1].id });
    expect((await c.call('GET', '/billing')).credits).toBe(before - 1);

    // year locks: Year 10 content is locked for a Year 9 student until they move up
    const y10 = cur.topics.find((t: { subject: string; year: number }) => t.subject === 'maths' && t.year === 10);
    const locked = await c.call('POST', '/lessons', { studentId: child.id, styleId: y10.styles[0].id }, 403);
    expect(locked.code).toBe('YEAR_LOCKED');
    await c.call('POST', '/exams', { studentId: child.id, examId: 'y10-autumn' }, 403);
    expect((await c.call('GET', `/students/${child.id}/exams?subject=maths`)).exams.find((e: { id: string }) => e.id === 'y10-autumn').locked).toBe(true);
    // exam with a wrong answer → explanation + similar question
    const { attempt: A0 } = await c.call('POST', '/exams', { studentId: child.id, examId: 'y9-autumn' });
    expect(A0.questions[0].answer).toBeUndefined();
    const A = await attempt(A0.id);
    const sub = await c.call('POST', `/exams/${A0.id}/submit`, { answers: qs(A).map((q, i) => (i === 0 ? 'wrong' : q.answer)) });
    expect(sub.attempt.pct).toBeLessThan(100);
    expect(sub.attempt.questions[0].steps.length).toBeGreaterThan(0);
    const sim = await c.call('GET', `/exams/${A0.id}/similar/0`);
    expect(sim.question.check).toBeUndefined();
    const SQ = ((await attempt(A0.id)).similar as Record<string, { q: { answer: string } }>)['0'].q;
    expect((await c.call('POST', `/exams/${A0.id}/similar/0`, { input: SQ.answer })).correct).toBe(true);
    const { attempt: T } = await c.call('POST', '/exams', { studentId: child.id, examId: `topic:${y9.id}` });
    expect(T.questions).toHaveLength(15);

    // report, missions, planner, gifts
    const rep = await c.call('GET', `/students/${child.id}/report`);
    expect(rep.plan.weeks).toHaveLength(6);
    const ms = await c.call('GET', `/students/${child.id}/missions`);
    expect(ms.missions.some((m: { done: boolean }) => m.done)).toBe(true);
    await c.call('POST', `/students/${child.id}/missions/claim`, {});
    const tk = await c.call('POST', `/students/${child.id}/tasks`, { title: 'Homework', kind: 'custom', coins: 30, requiresApproval: true });
    await c.call('POST', `/students/${child.id}/tasks`, { title: 'Any maths lesson', kind: 'lesson', subject: 'maths' });
    const cal = await c.call('GET', `/students/${child.id}/calendar`);
    expect(cal.days.some((d: { events: { kind: string }[] }) => d.events.some((e) => e.kind === 'task'))).toBe(true);
    await c.call('POST', `/students/${child.id}/goals`, { type: 'lessons', target: 1, reward: 'Pizza night' });
    const rw = await c.call('GET', `/students/${child.id}/rewards`);
    expect(rw.badges.some((b: { got: boolean }) => b.got)).toBe(true);
    await ctx.deps.db.update(s.studentProfiles).set({ coins: 6000 }).where(eq(s.studentProfiles.userId, child.id));
    const tkt = await c.call('POST', `/students/${child.id}/gifts`, { cardId: 'roblox', value: 5 });
    expect(tkt.coins).toBe(4000);

    // the student signs in: sees only self, can't pay, approve, or set goals
    const studentC = client(ctx.app);
    await studentC.call('POST', '/auth/login', { login: 'kid.test', password: 'kidpassword' });
    await studentC.call('GET', `/students/${child.id}/overview`);
    await studentC.call('GET', '/billing', undefined, 403);
    await studentC.call('POST', `/students/${child.id}/goals`, { type: 'xp', target: 10, reward: 'x' }, 403);
    await studentC.call('GET', '/admin/stats', undefined, 403);
    // the student moves up a class → Year 10 unlocks; moving back down locks it again
    expect((await studentC.call('PUT', `/students/${child.id}/year-group`, { yearGroup: 10 })).to).toBe(10);
    await c.call('POST', '/lessons', { studentId: child.id, styleId: y10.styles[0].id });
    await studentC.call('PUT', `/students/${child.id}/year-group`, { yearGroup: 9 });
    await c.call('POST', '/lessons', { studentId: child.id, styleId: y10.styles[1].id }, 403);
    await studentC.call('PUT', `/students/${child.id}/year-group`, { yearGroup: 12 }, 400);
    expect((await studentC.call('POST', `/students/${child.id}/tasks/${tk.task.id}/complete`, {})).waiting).toBe(true);
    await studentC.call('POST', `/students/${child.id}/tasks/${tk.task.id}/approve`, {}, 403);
    await studentC.call('PATCH', `/students/${child.id}/gifts/${tkt.ticket.id}`, { action: 'approve' }, 403);

    // parent approves → coins paid; delivers the gift card
    const coinsBefore = (await c.call('GET', `/students/${child.id}/rewards`)).coins;
    expect((await c.call('GET', '/approvals')).count).toBe(2);
    await c.call('POST', `/students/${child.id}/tasks/${tk.task.id}/approve`, {});
    expect((await c.call('GET', `/students/${child.id}/rewards`)).coins).toBe(coinsBefore + 30);
    await c.call('PATCH', `/students/${child.id}/gifts/${tkt.ticket.id}`, { action: 'deliver', code: 'X' });
    expect((await c.call('GET', '/approvals')).count).toBe(0);

    // another parent cannot see this child
    const other2 = client(ctx.app);
    await other2.call('POST', '/auth/register', { name: 'Other', email: 'o@example.test', password: 'longenough1' });
    await other2.call('GET', `/students/${child.id}/overview`, undefined, 403);

    // admin: free access → no credits used; suspension kills sessions
    await ctx.deps.db.insert(s.users).values({ id: 'usr_admin', role: 'admin', name: 'Admin', email: 'a@example.test', passwordHash: await hashPassword('adminpass123') });
    const adm = client(ctx.app);
    await adm.call('POST', '/auth/login', { login: 'a@example.test', password: 'adminpass123' });
    const parentId = me.user.id;
    await adm.call('PATCH', `/admin/users/${parentId}`, { freeAccess: true });
    const credits = (await c.call('GET', '/billing')).credits;
    await c.call('POST', '/lessons', { studentId: child.id, styleId: y9.styles[2].id });
    expect((await c.call('GET', '/billing')).credits).toBe(credits);
    const stats = await adm.call('GET', '/admin/stats');
    expect(stats.revenue).toBe(10);
    await adm.call('PATCH', `/admin/users/${parentId}`, { creditDelta: 5, reason: 'goodwill' });
    await adm.call('PATCH', `/admin/users/${parentId}`, { status: 'suspended' });
    await c.call('GET', '/me', undefined, 401);
  }, 120_000);
});
