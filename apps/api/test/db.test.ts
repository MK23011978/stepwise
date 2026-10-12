import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { eq, sql, count } from 'drizzle-orm';
import { connectPglite, type DbHandle } from '../src/db/client.js';
import { importLegacy } from '../src/db/legacy-import.js';
import * as s from '../src/db/schema.js';
import { legacyFixture } from './helpers.js';

let h: DbHandle;
let data: Record<string, any>;
const n = async (table: any) => Number((await h.db.select({ c: count() }).from(table))[0].c);

beforeAll(async () => {
  data = legacyFixture();
  h = await connectPglite();
  await h.migrate();
}, 120_000);
afterAll(async () => { await h?.close(); });

describe('stage 1 — PostgreSQL schema & legacy import', () => {
  it('applies migrations on a clean PostgreSQL 16 database', async () => {
    const r = await h.db.execute(sql`select count(*)::int as c from information_schema.tables where table_schema = 'public'`);
    expect(Number((r as any).rows[0].c)).toBeGreaterThanOrEqual(25);
  });

  it('imports every legacy record with relations intact', async () => {
    const report = await importLegacy(h.db, data);
    const students = data.users.filter((u: any) => u.role === 'student');
    expect(await n(s.users)).toBe(data.users.length);
    expect(await n(s.studentProfiles)).toBe(students.length);
    expect(await n(s.wallets)).toBe(data.users.filter((u: any) => u.role === 'parent').length);
    expect(await n(s.lessons)).toBe(data.lessons.length);
    expect(await n(s.examAttempts)).toBe(data.examAttempts.length);
    expect(await n(s.payments)).toBe(data.payments.length);
    expect(await n(s.creditLedger)).toBe(data.ledger.length);
    expect(await n(s.tasks)).toBe(data.tasks.length);
    expect(await n(s.giftTickets)).toBe(data.tickets.length);
    const progressRows = Object.values<any>(data.progress).reduce((t, m) => t + Object.keys(m).length, 0);
    expect(await n(s.styleProgress)).toBe(progressRows);
    expect(report.certificates).toBeGreaterThan(0);
  });

  it('keeps flexible payloads in JSONB exactly', async () => {
    const legacy = data.examAttempts[0];
    const [row] = await h.db.select().from(s.examAttempts).where(eq(s.examAttempts.id, legacy.id));
    expect(row.questions).toEqual(legacy.questions);
    expect(row.byStrand).toEqual(legacy.byStrand);
    expect(row.grade).toBe(String(legacy.grade));
  });

  it('preserves password hashes so users keep their passwords', async () => {
    const legacy = data.users.find((u: any) => u.email === 'parent@stepwise.test');
    const [row] = await h.db.select().from(s.users).where(eq(s.users.id, legacy.id));
    expect(row.passwordHash).toBe(`scrypt$${legacy.salt}$${legacy.passHash}`);
  });

  it('stores money in pence and keeps the wallet balance', async () => {
    const legacy = data.users.find((u: any) => u.email === 'parent@stepwise.test');
    const [w] = await h.db.select().from(s.wallets).where(eq(s.wallets.parentId, legacy.id));
    expect(w.credits).toBe(legacy.credits);
    const pays = await h.db.select().from(s.payments).where(eq(s.payments.parentId, legacy.id));
    expect(pays.every((p) => Number.isInteger(p.amountPence))).toBe(true);
  });

  it('is idempotent — importing twice adds nothing', async () => {
    const before = await n(s.lessons);
    await importLegacy(h.db, data);
    expect(await n(s.lessons)).toBe(before);
  });

  it('enforces relations — deleting a parent removes the family’s data', async () => {
    const parent = data.users.find((u: any) => u.email === 'parent@stepwise.test');
    const kids = data.users.filter((u: any) => u.parentId === parent.id).map((u: any) => u.id);
    await h.db.delete(s.users).where(eq(s.users.id, parent.id));
    for (const k of kids) {
      expect((await h.db.select().from(s.studentProfiles).where(eq(s.studentProfiles.userId, k))).length).toBe(0);
      expect((await h.db.select().from(s.lessons).where(eq(s.lessons.studentId, k))).length).toBe(0);
    }
    expect((await h.db.select().from(s.wallets).where(eq(s.wallets.parentId, parent.id))).length).toBe(0);
  });

  it('rejects duplicate emails case-insensitively', async () => {
    const any = data.users.find((u: any) => u.email && u.role === 'admin');
    await expect(h.db.insert(s.users).values({ id: 'usr_dup', role: 'parent', name: 'Dup', email: any.email.toUpperCase(), passwordHash: 'x' })).rejects.toThrow();
  });
});
