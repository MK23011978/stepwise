// Imports the v1 JSON datastore (data/db.json) into PostgreSQL.
// Idempotent: rows that already exist are skipped (ON CONFLICT DO NOTHING); run with reset=true to start clean.
// Legacy plain-text session tokens are NOT imported — users simply sign in again.
import { sql } from 'drizzle-orm';
import { randomBytes } from 'node:crypto';
import type { Db } from './client.js';
import * as s from './schema.js';

/* eslint-disable @typescript-eslint/no-explicit-any */
type Legacy = Record<string, any>;
const iso = (v: unknown) => (typeof v === 'string' && v ? v : null);
const day = (v: unknown) => (typeof v === 'string' && /^\d{4}-\d{2}-\d{2}/.test(v) ? v.slice(0, 10) : null);
const rid = (p: string) => `${p}_${randomBytes(8).toString('hex')}`;

export interface ImportReport { [table: string]: number }

async function insertChunks(db: Db, table: any, rows: any[], report: ImportReport, name: string) {
  report[name] = (report[name] || 0) + rows.length;
  const now = new Date().toISOString();
  for (const r of rows) {
    for (const k of Object.keys(r)) if (r[k] === undefined) delete r[k];
    if (r.createdAt == null) delete r.createdAt; // column default (now)
    if ('startedAt' in r && r.startedAt == null) r.startedAt = now;
    if ('deadline' in r && r.deadline == null) r.deadline = r.startedAt || now;
  }
  for (let i = 0; i < rows.length; i += 400) {
    const chunk = rows.slice(i, i + 400);
    if (chunk.length) await db.insert(table).values(chunk).onConflictDoNothing();
  }
}

export async function importLegacy(db: Db, data: Legacy, { reset = false } = {}): Promise<ImportReport> {
  const report: ImportReport = {};
  const users: any[] = data.users || [];
  const userIds = new Set(users.map((u) => u.id));
  const students = users.filter((u) => u.role === 'student' && userIds.has(u.parentId));
  const studentIds = new Set(students.map((u) => u.id));
  const parents = users.filter((u) => u.role === 'parent');
  const parentIds = new Set(parents.map((u) => u.id));
  const okStudent = (id: string) => studentIds.has(id);

  await db.transaction(async (tx) => {
    const t = tx as unknown as Db;
    if (reset) {
      await t.execute(sql`TRUNCATE users, audit_log RESTART IDENTITY CASCADE`);
    }
    // identity
    await insertChunks(t, s.users, users.filter((u) => u.role !== 'student' || okStudent(u.id)).sort((a, b) => (a.role === 'student' ? 1 : 0) - (b.role === 'student' ? 1 : 0)).map((u) => ({
      id: u.id, role: u.role, name: u.name || 'User', email: u.email || null, username: u.username || null, parentId: u.role === 'student' ? u.parentId : null,
      passwordHash: `scrypt$${u.salt}$${u.passHash}`, status: u.status === 'suspended' ? 'suspended' : 'active',
      avatarColor: u.avatarColor || '#3b6cf6', freeAccess: !!u.freeAccess, createdAt: iso(u.createdAt) || new Date().toISOString(), lastLoginAt: iso(u.lastLoginAt),
    })), report, 'users');
    await insertChunks(t, s.wallets, parents.map((u) => ({
      parentId: u.id, credits: u.credits || 0, freeLessonUsed: !!u.freeLessonUsed, cardVerified: !!u.cardVerified, cardBrand: u.cardBrand || null,
      cardLast4: u.cardLast4 || null, cardFingerprint: u.cardFingerprint || null, cardVerifiedAt: iso(u.cardVerifiedAt), stripeCustomerId: u.stripeCustomerId || null,
    })), report, 'wallets');
    await insertChunks(t, s.studentProfiles, students.map((u) => ({
      userId: u.id, yearGroup: Number(u.yearGroup) || 9, tier: u.tier === 'F' ? 'F' : 'H', targetGrade: Number(u.targetGrade) || 7,
      targets: u.targets || {}, subjects: Array.isArray(u.subjects) ? u.subjects : [], xp: u.xp || 0, coins: u.coins || 0, lastLevel: u.lastLevel || 1,
      milestones: u.milestones || 0, mistakesFixed: u.mistakesFixed || 0, freezes: u.freezes || 0, frozenDays: u.frozenDays || [], fixedLog: u.fixedLog || {},
      badges: u.badges || {}, owned: u.owned || [], equipped: u.equipped || {}, giftSettings: u.giftSettings || null,
    })), report, 'student_profiles');

    // money
    await insertChunks(t, s.payments, (data.payments || []).filter((p: any) => parentIds.has(p.parentId)).map((p: any) => ({
      id: p.id, parentId: p.parentId, packId: p.packId, label: p.label, amountPence: Math.round(Number(p.amount) * 100), currency: p.currency || 'GBP',
      credits: p.credits, provider: p.provider || 'simulated', providerRef: p.providerRef || null, status: p.status || 'succeeded', createdAt: iso(p.createdAt),
    })), report, 'payments');
    await insertChunks(t, s.creditLedger, (data.ledger || []).filter((l: any) => parentIds.has(l.parentId)).map((l: any) => ({
      id: l.id || rid('led'), parentId: l.parentId, delta: l.delta, balance: l.balance, reason: l.reason, byUserId: l.by || null, createdAt: iso(l.at),
    })), report, 'credit_ledger');

    // learning state
    const progressRows: any[] = []; const activityRows: any[] = []; const reviewRows: any[] = []; const mistakeRows: any[] = []; const missionRows: any[] = [];
    for (const [sid, map] of Object.entries<any>(data.progress || {})) if (okStudent(sid)) for (const [styleId, r] of Object.entries<any>(map)) progressRows.push({ studentId: sid, styleId, done: r.done || 0, correct: r.correct || 0, incorrect: r.incorrect || 0, skipped: r.skipped || 0, lastAt: iso(r.lastAt) });
    for (const [sid, map] of Object.entries<any>(data.activity || {})) if (okStudent(sid)) for (const [d, n] of Object.entries<any>(map)) if (day(d)) activityRows.push({ studentId: sid, day: d, questions: Number(n) || 0 });
    for (const [sid, map] of Object.entries<any>(data.review || {})) if (okStudent(sid)) for (const [styleId, r] of Object.entries<any>(map)) if (day(r.due)) reviewRows.push({ studentId: sid, styleId, box: Math.max(0, r.box || 0), due: r.due, lastAt: iso(r.lastAt) });
    for (const [sid, list] of Object.entries<any>(data.mistakes || {})) if (okStudent(sid)) for (const m of list) mistakeRows.push({ id: m.id, studentId: sid, styleId: m.styleId, question: m.q, source: m.source || 'lesson', tries: m.tries || 0, createdAt: iso(m.at) });
    for (const [sid, map] of Object.entries<any>(data.missions || {})) if (okStudent(sid)) for (const [d, m] of Object.entries<any>(map)) missionRows.push({ studentId: sid, day: d, missions: m.missions || [], claimed: m.claimed || {}, bonusClaimed: !!m.bonusClaimed });
    await insertChunks(t, s.styleProgress, progressRows, report, 'style_progress');
    await insertChunks(t, s.dailyActivity, activityRows, report, 'daily_activity');
    await insertChunks(t, s.reviewSchedule, reviewRows, report, 'review_schedule');
    await insertChunks(t, s.mistakes, mistakeRows, report, 'mistakes');
    await insertChunks(t, s.dailyMissions, missionRows, report, 'daily_missions');

    await insertChunks(t, s.lessons, (data.lessons || []).filter((l: any) => okStudent(l.studentId)).map((l: any) => ({
      id: l.id, studentId: l.studentId, kind: l.kind || 'lesson', styleId: l.styleId || null, topicId: l.topicId || null, status: l.status, free: !!l.free,
      example: l.example || null, questions: l.questions || [], results: l.results || [], idx: l.idx || 0, xp: l.xp || 0, bonus: l.bonus || 0,
      createdAt: iso(l.createdAt), completedAt: iso(l.completedAt),
    })), report, 'lessons');
    await insertChunks(t, s.examAttempts, (data.examAttempts || []).filter((a: any) => okStudent(a.studentId)).map((a: any) => ({
      id: a.id, studentId: a.studentId, examId: a.examId, subject: a.subject || (String(a.examId).includes('-y') && !/^y\d/.test(a.examId) ? String(a.examId).split('-y')[0] : 'maths'),
      kind: a.kind || 'checkpoint', name: a.name, tier: a.tier === 'F' ? 'F' : a.tier === 'H' ? 'H' : null, startedAt: iso(a.startedAt), deadline: iso(a.deadline),
      submittedAt: iso(a.submittedAt), questions: a.questions || [], answers: a.answers ?? null, marked: a.marked ?? null, score: a.score ?? null, max: a.max ?? null,
      pct: a.pct ?? null, grade: a.grade == null ? null : String(a.grade), byStrand: a.byStrand ?? null, similar: a.similar ?? null, xp: a.xp ?? null, late: !!a.late,
    })), report, 'exam_attempts');

    // rewards
    const certRows: any[] = []; const notifRows: any[] = []; const goalRows: any[] = [];
    for (const u of students) {
      for (const c of u.certificates || []) certRows.push({ id: c.id, studentId: u.id, key: c.key, kind: c.kind, title: c.title, subtitle: c.subtitle || null, createdAt: iso(c.at) });
      for (const e of u.inbox || []) { const { id, type, title, text, icon, seen, at, ...meta } = e; notifRows.push({ id: id || rid('evt'), studentId: u.id, type: type || 'info', title: title || '', text: text || null, icon: icon || null, meta, seen: !!seen, createdAt: iso(at) }); }
      for (const g of u.goals || []) goalRows.push({ id: g.id, studentId: u.id, type: g.type, target: g.target, reward: g.reward, baseline: g.baseline || 0, createdBy: g.createdBy || null, createdAt: iso(g.createdAt), achievedAt: iso(g.achievedAt), deliveredAt: iso(g.deliveredAt) });
    }
    await insertChunks(t, s.certificates, certRows, report, 'certificates');
    await insertChunks(t, s.notifications, notifRows, report, 'notifications');
    await insertChunks(t, s.goals, goalRows, report, 'goals');
    await insertChunks(t, s.giftTickets, (data.tickets || []).filter((x: any) => okStudent(x.studentId) && parentIds.has(x.parentId)).map((x: any) => ({
      id: x.id, studentId: x.studentId, parentId: x.parentId, cardId: x.cardId, cardName: x.cardName, icon: x.icon || null, valuePounds: x.value, coins: x.coins,
      status: x.status, note: x.note || null, reply: x.reply || null, code: x.code || null, createdAt: iso(x.createdAt), approvedAt: iso(x.approvedAt), deliveredAt: iso(x.deliveredAt),
    })), report, 'gift_tickets');

    // planner
    const legacyTasks = (data.tasks || []).filter((x: any) => okStudent(x.studentId));
    await insertChunks(t, s.tasks, legacyTasks.map((x: any) => ({
      id: x.id, studentId: x.studentId, createdBy: x.createdBy || null, createdByRole: x.createdByRole || 'parent', title: x.title, notes: x.notes || '', kind: x.kind || 'custom',
      subject: x.subject || null, ref: x.ref || null, dueDate: day(x.dueDate) || new Date().toISOString().slice(0, 10), dueTime: x.dueTime || '', recurrence: x.recurrence || 'none',
      until: day(x.until), priority: x.priority || 'normal', status: x.status || 'todo', coins: x.coins || 0, requiresApproval: !!x.requiresApproval, createdAt: iso(x.createdAt),
    })), report, 'tasks');
    await insertChunks(t, s.taskCompletions, legacyTasks.flatMap((x: any) => Object.entries<any>(x.done || {}).filter(([d]) => day(d)).map(([d, v]) => ({
      taskId: x.id, day: d, completedAt: iso(v.at) || new Date().toISOString(), approvedAt: iso(v.approvedAt),
    }))), report, 'task_completions');

    await insertChunks(t, s.auditLog, (data.audit || []).map((a: any) => ({
      id: a.id || rid('aud'), actorId: a.actor && userIds.has(a.actor) ? a.actor : null, actorName: a.actorName || 'system', action: a.action, detail: a.detail || null, createdAt: iso(a.at),
    })), report, 'audit_log');
  });
  return report;
}
