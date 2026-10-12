import { eq, sql, and, ne } from 'drizzle-orm';
import { randomBytes } from 'node:crypto';
import * as s from '../../db/schema.js';
import type { Deps } from '../../core/deps.js';
import { fail } from '../../core/errors.js';
import { newId } from '../../core/ids.js';
import { hashPassword } from '../../core/password.js';
import { audit } from '../common/audit.js';
import * as repo from '../students/students.repo.js';
import { publicUser } from '../students/students.service.js';
import { pickColor } from '../auth/auth.service.js';
import type { AuthUser } from '../../plugins/auth.js';
import type { ChildBody } from '@stepwise/shared';

export function createFamilyService(deps: Deps) {
  const { db, content } = deps;
  const validSubjects = (list?: string[]) => (list || []).filter((x) => content.getSubject(x));

  async function usernameFree(username: string, exceptId?: string) {
    const [u] = await db.select({ id: s.users.id }).from(s.users).where(and(sql`(lower(${s.users.username}) = ${username} or lower(${s.users.email}) = ${username})`, exceptId ? ne(s.users.id, exceptId) : sql`true`));
    if (u) fail(409, 'That username is taken');
  }

  async function create(user: AuthUser, body: ChildBody) {
    const parentId = user.role === 'admin' ? body.parentId : user.id;
    const [parent] = parentId ? await db.select().from(s.users).where(eq(s.users.id, parentId)) : [];
    if (!parent || parent.role !== 'parent') fail(400, 'Parent account required');
    if ((await repo.childrenOf(db, parentId!)).length >= 6) fail(400, 'Maximum 6 children per account');
    const username = body.username || `${body.name.toLowerCase().replace(/[^a-z0-9]/g, '') || 'student'}${Math.floor(1000 + Math.random() * 9000)}`;
    await usernameFree(username);
    const id = newId('stu');
    const subjects = validSubjects(body.subjects); 
    await db.transaction(async (tx) => {
      await tx.insert(s.users).values({ id, role: 'student', name: body.name, username, parentId, passwordHash: await hashPassword(body.password || randomBytes(12).toString('hex')), avatarColor: pickColor() });
      await tx.insert(s.studentProfiles).values({ userId: id, yearGroup: body.yearGroup, tier: body.tier, targetGrade: body.targetGrade, targets: body.targets || {}, subjects: subjects.length ? subjects : content.subjects.map((x) => x.id) });
    });
    await audit(db, user, 'add-child', body.name);
    return { child: publicUser((await repo.getStudent(db, id))!) };
  }

  async function update(st: repo.Student, body: Partial<ChildBody>) {
    const u: Partial<typeof s.users.$inferInsert> = {}; const p: Partial<repo.ProfileRow> = {};
    if (body.name) u.name = body.name;
    if (body.username && body.username !== st.username) { await usernameFree(body.username, st.id); u.username = body.username; }
    if (body.password) u.passwordHash = await hashPassword(body.password);
    if (body.yearGroup !== undefined) p.yearGroup = body.yearGroup;
    if (body.tier) p.tier = body.tier;
    if (body.targetGrade !== undefined) p.targetGrade = body.targetGrade;
    if (body.targets) p.targets = body.targets;
    if (body.subjects) { const v = validSubjects(body.subjects); p.subjects = v.length ? v : ['maths']; }
    if (Object.keys(u).length) await db.update(s.users).set(u).where(eq(s.users.id, st.id));
    await repo.updateProfile(db, st.id, p);
    return { child: publicUser((await repo.getStudent(db, st.id))!) };
  }

  async function remove(user: AuthUser, st: repo.Student) {
    await db.delete(s.users).where(eq(s.users.id, st.id));
    await audit(db, user, 'delete-child', st.name);
    return { ok: true as const };
  }
  return { create, update, remove };
}
export type FamilyService = ReturnType<typeof createFamilyService>;
