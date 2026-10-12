// Student-scoped endpoints: dashboards, progress, review, report, planner, rewards, gifts.
import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { z } from 'zod';
import { AnyObject, SubjectQuery, ChildBody, ChildPatch, ShopBody, GoalBody, GoalPatch, ClaimMissionBody, TaskBody, TaskPatch, TaskCompleteBody, TaskApproveBody,
  CalendarQuery, GiftRequestBody, GiftActionBody, GiftSettingsBody, YearGroupBody, Ok } from '@stepwise/shared';
import { audit } from './common/audit.js';
import type { Services } from '../services.js';
import { studentFor } from './common/access.js';
import { addDays } from '../core/dates.js';
import * as repo from './students/students.repo.js';
import { publicUser } from './students/students.service.js';

const Id = z.object({ id: z.string() });
const routes: FastifyPluginAsyncZod<{ svc: Services }> = async (app, { svc }) => {
  const { db, content } = svc.deps;
  const subj = (q?: string) => (q && content.getSubject(q) ? q : 'maths');
  const parentOrAdmin = { roles: ['parent' as const, 'admin' as const] };
  const T = (tag: string) => ({ tags: [tag] });

  // ----- family -----
  app.post('/children', { config: parentOrAdmin, schema: { ...T('family'), summary: 'Add a child', body: ChildBody, response: { 200: AnyObject } } }, async (req) => svc.family.create(req.user!, req.body));
  app.patch('/children/:id', { config: parentOrAdmin, schema: { ...T('family'), params: Id, body: ChildPatch, response: { 200: AnyObject } } }, async (req) => svc.family.update(await studentFor(db, req.user, req.params.id), req.body));
  app.delete('/children/:id', { config: parentOrAdmin, schema: { ...T('family'), params: Id, response: { 200: Ok } } }, async (req) => svc.family.remove(req.user!, await studentFor(db, req.user, req.params.id)));

  // ----- dashboards -----
  app.get('/students/:id/overview', { schema: { ...T('students'), summary: 'Dashboard for one subject (also returns new rewards to celebrate)', params: Id, querystring: SubjectQuery, response: { 200: AnyObject } } }, async (req) => {
    const s0 = await studentFor(db, req.user, req.params.id); const subject = subj(req.query.subject);
    await applyFreeze(s0);
    const events = await svc.rewards.check(db, s0.id);
    const unseen = await repo.takeUnseen(db, s0.id);
    const st = (await svc.students.load(db, s0.id))!;
    const rv = await svc.students.reviewStatus(db, s0.id);
    return {
      student: publicUser(st.student), subject, summary: svc.students.summary(st, subject), overall: svc.students.summary(st),
      activity: svc.students.weeklyActivity(st), recommendations: svc.students.recommendations(st, subject), exams: await svc.exams.status(s0.id, subject),
      review: { dueCount: rv.dueCount, mistakeCount: rv.mistakeCount }, goals: (await svc.rewards.goalsOf(db, st)).filter((g) => !g.achievedAt),
      rewards: [...events, ...unseen.filter((u) => !events.some((e) => e.title === u.title)).map((u) => ({ ...(u.meta as object), type: u.type, title: u.title, text: u.text, icon: u.icon }))],
    };
  });
  // Streak freeze: if yesterday was missed but the day before was active, spend a freeze to keep the streak.
  async function applyFreeze(st: repo.Student) {
    if (!st.freezes) return;
    const act = await repo.activityMap(db, st.id, addDays(-3)); const y = addDays(-1), y2 = addDays(-2); const frozen = new Set(st.frozenDays || []);
    if (!act[y] && !frozen.has(y) && (act[y2] || frozen.has(y2))) {
      await repo.updateProfile(db, st.id, { freezes: st.freezes - 1, frozenDays: [...frozen, y].slice(-30) });
      await repo.notify(db, st.id, { type: 'freeze', title: 'Streak saved!', text: 'A Streak Freeze protected your streak yesterday.', icon: '🧊' });
    }
  }
  app.get('/students/:id/progress', { schema: { ...T('students'), params: Id, querystring: SubjectQuery, response: { 200: AnyObject } } }, async (req) => {
    const s0 = await studentFor(db, req.user, req.params.id); const subject = subj(req.query.subject);
    const st = (await svc.students.load(db, s0.id))!;
    const styles = Object.fromEntries(Object.entries(st.progress).map(([k, r]) => [k, { ...r, status: svc.students.styleStatus(r) }]));
    return { student: publicUser(st.student), subject, styles, summary: svc.students.summary(st, subject), topicTests: await svc.exams.topicTests(s0.id) };
  });
  // Change class (year group). Students may change their own; parents and admins their children's.
  app.put('/students/:id/year-group', { schema: { ...T('students'), summary: 'Change the student’s year group — later years unlock, earlier stay open', params: Id, body: YearGroupBody, response: { 200: AnyObject } } }, async (req) => {
    const st = await studentFor(db, req.user, req.params.id);
    const from = st.yearGroup; const to = req.body.yearGroup;
    if (from !== to) {
      await repo.updateProfile(db, st.id, { yearGroup: to });
      await audit(db, req.user, 'year-change', `${st.name}: Year ${from} → Year ${to}`);
      await repo.notify(db, st.id, { type: 'year', title: to > from ? `Welcome to Year ${to}! 🎉` : `Moved to Year ${to}`, text: to > from ? `Year ${to} topics, tests and exams are now unlocked.` : `Years above ${to} are locked again — your progress is kept.`, icon: to > from ? '🔓' : '🔒', seen: true });
    }
    return { student: publicUser((await repo.getStudent(db, st.id))!), from, to };
  });
  app.get('/students/:id/history', { schema: { ...T('students'), params: Id, response: { 200: AnyObject } } }, async (req) => svc.lessons.history((await studentFor(db, req.user, req.params.id)).id));
  app.get('/students/:id/review', { schema: { ...T('review'), params: Id, response: { 200: AnyObject } } }, async (req) => svc.students.reviewStatus(db, (await studentFor(db, req.user, req.params.id)).id));
  app.get('/students/:id/report', { schema: { ...T('students'), summary: 'Progress report and personal 6-week roadmap', params: Id, response: { 200: AnyObject } } }, async (req) => svc.report.build(db, (await studentFor(db, req.user, req.params.id)).id));
  app.get('/students/:id/calendar', { schema: { ...T('planner'), params: Id, querystring: CalendarQuery, response: { 200: AnyObject } } }, async (req) => svc.report.calendar(db, (await studentFor(db, req.user, req.params.id)).id, req.query.from, req.query.to));
  app.get('/students/:id/exams', { schema: { ...T('exams'), params: Id, querystring: SubjectQuery, response: { 200: AnyObject } } }, async (req) => svc.exams.list((await studentFor(db, req.user, req.params.id)).id, req.query.subject && content.getSubject(req.query.subject) ? req.query.subject : null));

  // ----- missions -----
  app.get('/students/:id/missions', { schema: { ...T('missions'), params: Id, response: { 200: AnyObject } } }, async (req) => svc.missions.view(db, (await studentFor(db, req.user, req.params.id)).id));
  app.post('/students/:id/missions/claim', { schema: { ...T('missions'), params: Id, body: ClaimMissionBody, response: { 200: AnyObject } } }, async (req) => svc.missions.claim(db, (await studentFor(db, req.user, req.params.id)).id, req.body.missionId));

  // ----- rewards -----
  app.get('/students/:id/rewards', { schema: { ...T('rewards'), params: Id, response: { 200: AnyObject } } }, async (req) => svc.rewards.overview(db, (await studentFor(db, req.user, req.params.id)).id));
  app.post('/students/:id/shop', { schema: { ...T('rewards'), params: Id, body: ShopBody, response: { 200: AnyObject } } }, async (req) => svc.rewards.shop(db, (await studentFor(db, req.user, req.params.id)).id, req.body.itemId, req.body.action));
  app.get('/students/:id/certificates/:cid', { schema: { ...T('rewards'), params: z.object({ id: z.string(), cid: z.string() }), response: { 200: AnyObject } } }, async (req) => svc.rewards.certificate(db, (await studentFor(db, req.user, req.params.id)).id, req.params.cid));
  app.post('/students/:id/goals', { config: parentOrAdmin, schema: { ...T('rewards'), params: Id, body: GoalBody, response: { 200: AnyObject } } }, async (req) => svc.rewards.createGoal(db, (await studentFor(db, req.user, req.params.id)).id, req.user!.id, req.body));
  app.patch('/students/:id/goals/:gid', { config: parentOrAdmin, schema: { ...T('rewards'), params: z.object({ id: z.string(), gid: z.string() }), body: GoalPatch, response: { 200: AnyObject } } }, async (req) => svc.rewards.deliverGoal(db, (await studentFor(db, req.user, req.params.id)).id, req.params.gid));
  app.delete('/students/:id/goals/:gid', { config: parentOrAdmin, schema: { ...T('rewards'), params: z.object({ id: z.string(), gid: z.string() }), response: { 200: Ok } } }, async (req) => svc.rewards.deleteGoal(db, (await studentFor(db, req.user, req.params.id)).id, req.params.gid));

  // ----- tasks -----
  const TaskId = z.object({ id: z.string(), tid: z.string() });
  app.get('/students/:id/tasks', { schema: { ...T('planner'), params: Id, response: { 200: AnyObject } } }, async (req) => svc.tasks.list(db, (await studentFor(db, req.user, req.params.id)).id));
  app.post('/students/:id/tasks', { schema: { ...T('planner'), params: Id, body: TaskBody, response: { 200: AnyObject } } }, async (req) => svc.tasks.create(db, req.user!, (await studentFor(db, req.user, req.params.id)).id, req.body));
  app.patch('/students/:id/tasks/:tid', { schema: { ...T('planner'), params: TaskId, body: TaskPatch, response: { 200: AnyObject } } }, async (req) => svc.tasks.patch(db, req.user!, (await studentFor(db, req.user, req.params.id)).id, req.params.tid, req.body));
  app.delete('/students/:id/tasks/:tid', { schema: { ...T('planner'), params: TaskId, response: { 200: Ok } } }, async (req) => svc.tasks.remove(db, req.user!, (await studentFor(db, req.user, req.params.id)).id, req.params.tid));
  app.post('/students/:id/tasks/:tid/complete', { schema: { ...T('planner'), params: TaskId, body: TaskCompleteBody, response: { 200: AnyObject } } }, async (req) => {
    const st = await studentFor(db, req.user, req.params.id);
    const r = await svc.tasks.complete(db, req.user!, st.id, req.params.tid, req.body.date);
    const rewards = r.event ? [r.event, ...(await svc.rewards.check(db, st.id))] : [];
    return { task: r.task, waiting: r.waiting, rewards };
  });
  app.post('/students/:id/tasks/:tid/approve', { config: parentOrAdmin, schema: { ...T('planner'), params: TaskId, body: TaskApproveBody, response: { 200: AnyObject } } }, async (req) => svc.tasks.approve(db, (await studentFor(db, req.user, req.params.id)).id, req.params.tid, req.body));
  app.get('/approvals', { config: parentOrAdmin, schema: { ...T('planner'), summary: 'Everything waiting for the parent’s decision', response: { 200: AnyObject } } }, async (req) => (req.user!.role === 'parent' ? svc.tasks.approvalsFor(db, req.user!.id) : { tasks: [], tickets: [], count: 0 }));

  // ----- gift-card tickets -----
  app.get('/students/:id/gifts', { schema: { ...T('gifts'), params: Id, response: { 200: AnyObject } } }, async (req) => svc.gifts.overview(db, await studentFor(db, req.user, req.params.id)));
  app.post('/students/:id/gifts', { schema: { ...T('gifts'), params: Id, body: GiftRequestBody, response: { 200: AnyObject } } }, async (req) => svc.gifts.request(db, await studentFor(db, req.user, req.params.id), req.body));
  app.patch('/students/:id/gifts/:tid', { schema: { ...T('gifts'), params: TaskId, body: GiftActionBody, response: { 200: AnyObject } } }, async (req) => svc.gifts.act(db, req.user!, await studentFor(db, req.user, req.params.id), req.params.tid, req.body));
  app.put('/students/:id/gifts/settings', { config: parentOrAdmin, schema: { ...T('gifts'), params: Id, body: GiftSettingsBody, response: { 200: AnyObject } } }, async (req) => svc.gifts.saveSettings(db, await studentFor(db, req.user, req.params.id), req.body));
};
export default routes;
