// Create or promote an admin.  npm run create-admin -w @stepwise/api -- --email you@x.com --name "Your Name" --password "…"
import { eq, sql } from 'drizzle-orm';
import { connectPg } from '../src/db/client.js';
import * as s from '../src/db/schema.js';
import { hashPassword } from '../src/core/password.js';
import { newId } from '../src/core/ids.js';

const arg = (k: string) => { const i = process.argv.indexOf(`--${k}`); return i > 0 ? process.argv[i + 1] : undefined; };
const email = String(arg('email') || '').toLowerCase().trim(); const name = arg('name') || 'Admin'; const password = arg('password') || '';
if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || password.length < 8) { console.error('Usage: --email you@x.com --name "Name" --password "min 8 chars"'); process.exit(1); }
const h = connectPg();
const [u] = await h.db.select().from(s.users).where(sql`lower(${s.users.email}) = ${email}`);
if (u) { await h.db.update(s.users).set({ role: 'admin', status: 'active', name, passwordHash: await hashPassword(password) }).where(eq(s.users.id, u.id)); console.log(`Promoted ${email} to admin.`); }
else { await h.db.insert(s.users).values({ id: newId('usr'), role: 'admin', name, email, passwordHash: await hashPassword(password), avatarColor: '#ef4444' }); console.log(`Created admin ${email}.`); }
await h.close();
