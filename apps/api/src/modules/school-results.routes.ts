// School results: the student (or parent) records marks from school tests, next to their Stepwise results.
import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { z } from 'zod';
import { and, asc, eq, gte, isNotNull } from 'drizzle-orm';
import { AnyObject, Ok, SchoolResultBody, SchoolResultPatch } from '@stepwise/shared';
import type { Services } from '../services.js';
import * as s from '../db/schema.js';
import { studentFor } from './common/access.js';
import { audit } from './common/audit.js';
import { SCHOOL_Y9_UNITS } from './common/domain.js';
import { newId } from '../core/ids.js';
import { addDays, nowIso } from '../core/dates.js';
import { fail } from '../core/errors.js';

const pctOf = (score: number, max: number) => Math.round((score / max) * 1000) / 10;

const routes: FastifyPluginAsyncZod<{ svc: Services }> = async (app, { svc }) => {
  const { db, content } = svc.deps;
  const T = { tags: ['school-results'] };
  const Id = z.object({ id: z.string() });
  const Rid = z.object({ id: z.string(), rid: z.string() });
  const checkSubject = (id?: string) => { if (id && !content.getSubject(id)) fail(400, 'Unknown subject'); };

  app.get('/students/:id/school-results', { schema: { ...T, summary: 'School test results with per-subject summary and Stepwise comparison', params: Id, response: { 200: AnyObject } } }, async (req) => {
    const st = await studentFor(db, req.user, req.params.id);
    const rows = await db.select().from(s.schoolResults).where(eq(s.schoolResults.studentId, st.id)).orderBy(asc(s.schoolResults.takenOn), asc(s.schoolResults.createdAt));
    const results = rows.map((r) => ({ ...r, pct: pctOf(r.score, r.maxScore), subjectName: content.getSubject(r.subject)?.name || r.subject, unitName: SCHOOL_Y9_UNITS.find((u) => u.id === r.unit)?.name || null }));
    const recent = await db.select({ subject: s.examAttempts.subject, pct: s.examAttempts.pct }).from(s.examAttempts)
      .where(and(eq(s.examAttempts.studentId, st.id), isNotNull(s.examAttempts.submittedAt), gte(s.examAttempts.submittedAt, addDays(-120))));
    const subjects = [...new Set(results.map((r) => r.subject))].map((sub) => {
      const list = results.filter((r) => r.subject === sub); const last = list[list.length - 1];
      const app = recent.filter((a) => (a.subject || 'maths') === sub && a.pct != null);
      return { subject: sub, name: content.getSubject(sub)?.name || sub, icon: content.getSubject(sub)?.icon || '📘', count: list.length,
        latestPct: last.pct, latestGrade: last.grade, averagePct: Math.round(list.reduce((a, r) => a + r.pct, 0) / list.length * 10) / 10,
        trend: list.length > 1 ? Math.round((last.pct - list[list.length - 2].pct) * 10) / 10 : null,
        stepwisePct: app.length ? Math.round(app.reduce((a, x) => a + Number(x.pct), 0) / app.length) : null };
    });
    return { results: results.reverse(), subjects, units: SCHOOL_Y9_UNITS.map((u) => ({ id: u.id, name: u.name, subject: 'maths', year: 9 })) };
  });

  app.post('/students/:id/school-results', { schema: { ...T, params: Id, body: SchoolResultBody, response: { 200: AnyObject } } }, async (req) => {
    const st = await studentFor(db, req.user, req.params.id); checkSubject(req.body.subject);
    const row = { id: newId('scr'), studentId: st.id, ...req.body, unit: req.body.unit || null, grade: req.body.grade || null, targetGrade: req.body.targetGrade || null, notes: req.body.notes || null, createdBy: req.user!.id };
    await db.insert(s.schoolResults).values(row);
    await audit(db, req.user, 'school-result', `${st.name}: ${req.body.title} ${req.body.score}/${req.body.maxScore}`);
    return { result: { ...row, pct: pctOf(row.score, row.maxScore) } };
  });

  app.patch('/students/:id/school-results/:rid', { schema: { ...T, params: Rid, body: SchoolResultPatch, response: { 200: AnyObject } } }, async (req) => {
    const st = await studentFor(db, req.user, req.params.id); checkSubject(req.body.subject);
    const [cur] = await db.select().from(s.schoolResults).where(and(eq(s.schoolResults.id, req.params.rid), eq(s.schoolResults.studentId, st.id)));
    if (!cur) return fail(404, 'Result not found');
    const next = { ...cur, ...req.body };
    if (next.score > next.maxScore) return fail(400, 'Score can’t be more than the total');
    await db.update(s.schoolResults).set({ ...req.body, updatedAt: nowIso() }).where(eq(s.schoolResults.id, cur.id));
    return { result: { ...next, pct: pctOf(next.score, next.maxScore) } };
  });

  app.delete('/students/:id/school-results/:rid', { schema: { ...T, params: Rid, response: { 200: Ok } } }, async (req) => {
    const st = await studentFor(db, req.user, req.params.id);
    const del = await db.delete(s.schoolResults).where(and(eq(s.schoolResults.id, req.params.rid), eq(s.schoolResults.studentId, st.id))).returning({ id: s.schoolResults.id });
    if (!del.length) return fail(404, 'Result not found');
    return { ok: true as const };
  });
};
export default routes;
