import { and, eq, inArray, isNull } from 'drizzle-orm';
import * as s from '../../db/schema.js';
import type { Db } from '../../db/client.js';
import type { Deps } from '../../core/deps.js';
import { fail } from '../../core/errors.js';
import { newId } from '../../core/ids.js';
import { nowIso, today } from '../../core/dates.js';
import { occursOn } from '../common/domain.js';
import * as repo from '../students/students.repo.js';
import type { AuthUser } from '../../plugins/auth.js';
import type { RewardEvent } from '../rewards/rewards.service.js';

type TaskRow = typeof s.tasks.$inferSelect;
type Completion = typeof s.taskCompletions.$inferSelect;
export type TaskInput = { title?: string; notes?: string; kind?: string; subject?: string | null; ref?: string | null; dueDate?: string; dueTime?: string; recurrence?: string; until?: string | null; priority?: string; coins?: number; requiresApproval?: boolean; status?: string };

export function createTaskService(deps: Deps) {
  const { content } = deps;

  async function load(db: Db, studentId: string) {
    const tasks = await db.select().from(s.tasks).where(eq(s.tasks.studentId, studentId));
    const comps = tasks.length ? await db.select().from(s.taskCompletions).where(inArray(s.taskCompletions.taskId, tasks.map((t) => t.id))) : [];
    const byTask = new Map<string, Record<string, Completion>>();
    for (const c of comps) { const m = byTask.get(c.taskId) || {}; m[c.day] = c; byTask.set(c.taskId, m); }
    return tasks.map((t) => ({ ...t, done: byTask.get(t.id) || {} }));
  }
  type LoadedTask = TaskRow & { done: Record<string, Completion> };

  function state(t: LoadedTask, date: string) {
    const d = t.done[date];
    if (!d) return t.recurrence === 'none' && t.status === 'doing' ? 'doing' : date < today() ? 'missed' : 'todo';
    return d.approvedAt || !t.requiresApproval ? 'done' : 'waiting';
  }
  function view(t: LoadedTask, date?: string) {
    const key = t.recurrence === 'none' ? t.dueDate : date || today();
    const sub = t.subject ? content.getSubject(t.subject) : undefined;
    const refName = t.ref ? (t.kind === 'lesson' ? content.getStyle(t.ref)?.name : ['topic', 'test'].includes(t.kind) ? content.getTopic(t.ref)?.name : null) : null;
    return { ...t, done: Object.fromEntries(Object.entries(t.done).map(([k, v]) => [k, { at: v.completedAt, approvedAt: v.approvedAt }])), date: key, state: state(t, key),
      subjectName: sub?.name || null, icon: sub?.icon || null, refName: refName || null };
  }

  async function list(db: Db, studentId: string) {
    const all = await load(db, studentId); const T = today();
    const todayList = all.filter((t) => occursOn(t, T) || (t.recurrence === 'none' && t.dueDate < T && !t.done[t.dueDate])).map((t) => view(t, t.recurrence === 'none' ? t.dueDate : T));
    const waiting = all.flatMap((t) => Object.entries(t.done).filter(([, d]) => !d.approvedAt && t.requiresApproval).map(([date]) => ({ ...view(t, date), date })));
    return { tasks: all.map((t) => view(t)).sort((a, b) => (a.dueDate < b.dueDate ? -1 : 1)), today: todayList, waiting };
  }

  function sanitize(body: TaskInput, user: AuthUser, existing?: TaskRow) {
    const out: Partial<TaskRow> = {};
    for (const k of ['title', 'notes', 'kind', 'dueTime', 'recurrence', 'priority'] as const) if (body[k] !== undefined) (out as Record<string, unknown>)[k] = body[k];
    if (body.subject !== undefined) out.subject = body.subject && content.getSubject(body.subject) ? body.subject : null;
    if (body.ref !== undefined) out.ref = body.ref || null;
    if (body.dueDate !== undefined || !existing) out.dueDate = body.dueDate || today();
    if (body.until !== undefined) out.until = body.until || null;
    if (body.status !== undefined && ['todo', 'doing'].includes(body.status)) out.status = body.status;
    if (user.role !== 'student') {
      if (body.coins !== undefined) out.coins = body.coins;
      if (body.requiresApproval !== undefined) out.requiresApproval = !!body.requiresApproval;
    } else if (!existing) { out.coins = 0; out.requiresApproval = false; }
    if ((out.kind || existing?.kind) !== 'custom') out.requiresApproval = false; // app work is verified automatically
    return out;
  }

  async function create(db: Db, user: AuthUser, studentId: string, body: TaskInput) {
    const existing = await db.select({ id: s.tasks.id }).from(s.tasks).where(eq(s.tasks.studentId, studentId));
    if (existing.length >= 300) fail(400, 'Too many tasks — delete some old ones first');
    const id = newId('tsk');
    await db.insert(s.tasks).values({ id, studentId, createdBy: user.id, createdByRole: user.role, title: body.title!, ...sanitize(body, user), dueDate: body.dueDate || today() } as typeof s.tasks.$inferInsert);
    const t = (await load(db, studentId)).find((x) => x.id === id)!;
    if (user.role !== 'student') await repo.notify(db, studentId, { type: 'task-new', title: 'New task from your parent', text: `${t.title}${t.coins ? ` · ${t.coins} coins` : ''}`, icon: '📌' });
    return { task: view(t) };
  }

  async function get(db: Db, studentId: string, taskId: string) {
    const t = (await load(db, studentId)).find((x) => x.id === taskId);
    return t || fail(404, 'Task not found');
  }
  async function patch(db: Db, user: AuthUser, studentId: string, taskId: string, body: TaskInput) {
    const t = await get(db, studentId, taskId);
    const upd = user.role === 'student' && t.createdByRole !== 'student'
      ? (body.status && ['todo', 'doing'].includes(body.status) ? { status: body.status } : {})
      : sanitize(body, user, t);
    if (Object.keys(upd).length) await db.update(s.tasks).set(upd).where(eq(s.tasks.id, t.id));
    return { task: view(await get(db, studentId, taskId)) };
  }

  async function completeRow(db: Db, studentId: string, t: LoadedTask, date: string, approved: boolean): Promise<RewardEvent | null> {
    const existing = t.done[date];
    if (!existing) await db.insert(s.taskCompletions).values({ taskId: t.id, day: date, completedAt: nowIso(), approvedAt: approved || !t.requiresApproval ? nowIso() : null }).onConflictDoNothing();
    else if (approved && !existing.approvedAt) await db.update(s.taskCompletions).set({ approvedAt: nowIso() }).where(and(eq(s.taskCompletions.taskId, t.id), eq(s.taskCompletions.day, date)));
    else return null;
    if (t.recurrence === 'none') await db.update(s.tasks).set({ status: 'done' }).where(eq(s.tasks.id, t.id));
    if (approved || !t.requiresApproval) {
      if (t.coins) await repo.addXpCoins(db, studentId, 0, t.coins);
      return { type: 'task', title: 'Task complete!', text: `${t.title}${t.coins ? ` · +${t.coins} coins` : ''}`, icon: '✅' };
    }
    return null;
  }

  async function complete(db: Db, user: AuthUser, studentId: string, taskId: string, date?: string) {
    const t = await get(db, studentId, taskId);
    const key = t.recurrence === 'none' ? t.dueDate : date || today();
    if (t.kind !== 'custom' && user.role === 'student') fail(400, 'This task completes itself when you do the work in the app');
    if (key > today()) fail(400, 'You can’t complete a future task yet');
    const ev = await completeRow(db, studentId, t, key, user.role !== 'student');
    if (ev) await repo.notify(db, studentId, { ...ev, seen: true });
    return { task: view(await get(db, studentId, taskId), key), event: ev, waiting: !ev && t.requiresApproval };
  }

  async function approve(db: Db, studentId: string, taskId: string, body: { date?: string; reject?: boolean; note?: string }) {
    const t = await get(db, studentId, taskId);
    const date = body.date || t.dueDate;
    if (!t.done[date]) fail(400, 'Not completed yet');
    if (body.reject) {
      await db.delete(s.taskCompletions).where(and(eq(s.taskCompletions.taskId, t.id), eq(s.taskCompletions.day, date)));
      if (t.recurrence === 'none') await db.update(s.tasks).set({ status: 'todo' }).where(eq(s.tasks.id, t.id));
      await repo.notify(db, studentId, { type: 'task-rejected', title: 'Task sent back', text: `${t.title}${body.note ? ' — ' + body.note : ''}`, icon: '↩️' });
    } else {
      const ev = await completeRow(db, studentId, t, date, true);
      if (ev) await repo.notify(db, studentId, { ...ev, title: 'Task approved!' });
    }
    return { task: view(await get(db, studentId, taskId), date) };
  }

  async function remove(db: Db, user: AuthUser, studentId: string, taskId: string) {
    const t = await get(db, studentId, taskId);
    if (user.role === 'student' && t.createdByRole !== 'student') fail(403, 'Only your parent can delete this task');
    await db.delete(s.tasks).where(eq(s.tasks.id, t.id));
    return { ok: true as const };
  }

  /** Called after lessons / reviews / tests: completes matching app-linked tasks. */
  async function autoComplete(db: Db, studentId: string, ev: { kind: 'lesson' | 'review' | 'test' | 'exam'; styleId?: string | null; topicId?: string | null; subject?: string | null; examId?: string }) {
    const events: RewardEvent[] = []; const T = today();
    for (const t of await load(db, studentId)) {
      if (t.kind === 'custom') continue;
      if (t.recurrence !== 'none' && !occursOn(t, T)) continue;
      const key = t.recurrence === 'none' ? t.dueDate : T;
      if (t.done[key]) continue;
      const match = (t.kind === 'review' && ev.kind === 'review')
        || (t.kind === 'lesson' && ev.kind === 'lesson' && (!t.ref || t.ref === ev.styleId) && (!t.subject || t.subject === ev.subject))
        || (t.kind === 'topic' && ev.kind === 'lesson' && t.ref === ev.topicId)
        || (t.kind === 'test' && (ev.kind === 'test' || ev.kind === 'exam') && (!t.ref || t.ref === ev.topicId || `topic:${t.ref}` === ev.examId || t.ref === ev.examId));
      if (match) { const e = await completeRow(db, studentId, t, key, true); if (e) { events.push(e); await repo.notify(db, studentId, { ...e, seen: true }); } }
    }
    return events;
  }

  async function approvalsFor(db: Db, parentId: string) {
    const kids = await repo.childrenOf(db, parentId);
    const tasks: unknown[] = [];
    for (const k of kids) for (const w of (await list(db, k.id)).waiting) tasks.push({ ...w, studentName: k.name });
    const tickets = kids.length ? await db.select().from(s.giftTickets).where(and(inArray(s.giftTickets.studentId, kids.map((k) => k.id)), inArray(s.giftTickets.status, ['pending', 'approved']))) : [];
    return { tasks, tickets: tickets.map((t) => ({ ...t, value: t.valuePounds, studentName: kids.find((k) => k.id === t.studentId)?.name })), count: tasks.length + tickets.length };
  }
  void isNull;
  return { load, list, view, create, patch, complete, approve, remove, autoComplete, approvalsFor, state };
}
export type TaskService = ReturnType<typeof createTaskService>;
