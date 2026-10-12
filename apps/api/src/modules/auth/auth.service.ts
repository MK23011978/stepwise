import { eq, or, sql } from 'drizzle-orm';
import * as s from '../../db/schema.js';
import type { Deps } from '../../core/deps.js';
import { fail } from '../../core/errors.js';
import { newId } from '../../core/ids.js';
import { nowIso } from '../../core/dates.js';
import { hashPassword, verifyPassword } from '../../core/password.js';
import { audit } from '../common/audit.js';
import { childrenOf, getStudent } from '../students/students.repo.js';
import { publicUser } from '../students/students.service.js';
import type { AuthUser } from '../../plugins/auth.js';

const COLORS = ['#3b6cf6', '#8b5cf6', '#0ea5a4', '#f59e0b', '#ec4899', '#10b981', '#ef4444', '#6366f1'];
export const pickColor = () => COLORS[Math.floor(Math.random() * COLORS.length)];

export function createAuthService(deps: Deps) {
  const { db, config } = deps;

  async function register(input: { name: string; email: string; password: string }) {
    const [exists] = await db.select({ id: s.users.id }).from(s.users).where(sql`lower(${s.users.email}) = ${input.email}`);
    if (exists) fail(409, 'An account with this email already exists');
    const id = newId('usr');
    await db.transaction(async (tx) => {
      await tx.insert(s.users).values({ id, role: 'parent', name: input.name, email: input.email, passwordHash: await hashPassword(input.password), avatarColor: pickColor() });
      await tx.insert(s.wallets).values({ parentId: id });
    });
    const [user] = await db.select().from(s.users).where(eq(s.users.id, id));
    await audit(db, user, 'register', input.email);
    return user;
  }

  async function login(login: string, password: string) {
    const [user] = await db.select().from(s.users).where(or(sql`lower(${s.users.email}) = ${login}`, sql`lower(${s.users.username}) = ${login}`));
    if (!user || !(await verifyPassword(password, user.passwordHash))) fail(401, 'Incorrect email/username or password');
    if (user!.status !== 'active') fail(403, 'This account is suspended. Contact support.');
    await db.update(s.users).set({ lastLoginAt: nowIso() }).where(eq(s.users.id, user!.id));
    await audit(db, user!, 'login');
    return user!;
  }

  async function wallet(user: AuthUser) {
    const ownerId = user.role === 'student' ? user.parentId : user.role === 'parent' ? user.id : null;
    if (!ownerId) return null;
    const [w] = await db.select().from(s.wallets).where(eq(s.wallets.parentId, ownerId));
    const [owner] = await db.select({ freeAccess: s.users.freeAccess }).from(s.users).where(eq(s.users.id, ownerId));
    if (!w) return null;
    const free = !!owner?.freeAccess || (user.role === 'student' && user.freeAccess);
    return { credits: w.credits, freeLessonAvailable: !w.freeLessonUsed, freeAccess: free, cardVerified: w.cardVerified, cardCheckRequired: config.requireCardForTrial && !w.cardVerified };
  }

  async function me(user: AuthUser) {
    const self = user.role === 'student' ? await getStudent(db, user.id) : user;
    const children = user.role === 'parent' ? await childrenOf(db, user.id) : user.role === 'student' && self ? [self] : [];
    const { sessionId, ...u } = self as AuthUser; void sessionId;
    return { user: publicUser(u), children: children.map(publicUser), wallet: await wallet(user) };
  }

  async function updateMe(user: AuthUser, body: { name?: string; currentPassword?: string; newPassword?: string }) {
    const patch: Partial<typeof s.users.$inferInsert> = {};
    if (body.name) patch.name = body.name;
    if (body.newPassword) {
      if (!(await verifyPassword(body.currentPassword || '', user.passwordHash))) fail(400, 'Current password is incorrect');
      patch.passwordHash = await hashPassword(body.newPassword);
    }
    if (Object.keys(patch).length) await db.update(s.users).set(patch).where(eq(s.users.id, user.id));
    return me({ ...user, ...patch } as AuthUser);
  }

  async function deleteMe(user: AuthUser) {
    await db.delete(s.users).where(eq(s.users.id, user.id)); // cascades to children and all their data
    await audit(db, null, 'self-delete', user.email || user.id);
  }
  return { register, login, me, wallet, updateMe, deleteMe };
}
export type AuthService = ReturnType<typeof createAuthService>;
