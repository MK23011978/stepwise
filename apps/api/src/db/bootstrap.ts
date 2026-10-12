// First-boot admin for hosts without a shell (e.g. Render free): set ADMIN_EMAIL + ADMIN_PASSWORD once.
// Only creates the account if that email doesn't exist yet — it never overwrites a password on later boots.
import { sql } from 'drizzle-orm';
import type { Db } from './client.js';
import * as s from './schema.js';
import { hashPassword } from '../core/password.js';
import { newId } from '../core/ids.js';

export async function ensureAdmin(db: Db, env: NodeJS.ProcessEnv) {
  const email = String(env.ADMIN_EMAIL || '').toLowerCase().trim(); const password = env.ADMIN_PASSWORD || '';
  if (!email || !password) return;
  if (password.length < 8) { console.warn('ADMIN_PASSWORD is shorter than 8 characters — admin not created'); return; }
  const [u] = await db.select({ id: s.users.id }).from(s.users).where(sql`lower(${s.users.email}) = ${email}`);
  if (u) return;
  await db.insert(s.users).values({ id: newId('usr'), role: 'admin', name: env.ADMIN_NAME || 'Admin', email, passwordHash: await hashPassword(password), avatarColor: '#ef4444' });
  console.log(`Created admin ${email}`);
}
