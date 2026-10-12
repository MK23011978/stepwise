// Imports subjects, topics, styles, question banks and teaching pages from the seed modules into PostgreSQL.
// Default mode only inserts what is missing, so edits made in the database are never overwritten.
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { sql } from 'drizzle-orm';
import engine from '@stepwise/engine';
import * as s from '../db/schema.js';
import type { Db } from '../db/client.js';

const require = createRequire(import.meta.url);
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../..');

export async function bumpContentVersion(db: Db) {
  await db.insert(s.contentVersion).values({ id: 1, version: 1 }).onConflictDoUpdate({ target: s.contentVersion.id, set: { version: sql`${s.contentVersion.version} + 1`, updatedAt: sql`now()` } });
}

const countAll = async (db: Db) => {
  const n = async (t: string) => Number(((await db.execute(sql.raw(`select count(*)::int as n from ${t}`))) as unknown as { rows: { n: number }[] }).rows[0].n);
  return [await n('topics'), await n('styles'), await n('items'), await n('learn_pages')].join(',');
};

/** Start-up sync for an existing database: adds topics/styles/items/pages that are new in the seed (never overwrites
 *  edits), keeps topic and style order in line with the seed, and bumps the content version only if something changed. */
export async function syncContent(db: Db) {
  const before = await countAll(db);
  await importContent(db, { bump: false });
  const R = require(path.join(ROOT, 'packages/content-seed/registry.cjs'));
  await db.transaction(async (tx) => {
    for (const [i, t] of (R.TOPICS as { id: string; styles: string[] }[]).entries()) {
      await tx.update(s.topics).set({ sortOrder: i }).where(sql`${s.topics.id} = ${t.id} and ${s.topics.sortOrder} <> ${i}`);
    }
  });
  const after = await countAll(db);
  if (after !== before) await bumpContentVersion(db);
  return { changed: after !== before, before, after };
}

export async function importContent(db: Db, { overwrite = false, bump = true } = {}) {
  const R = require(path.join(ROOT, 'packages/content-seed/registry.cjs'));
  const report: Record<string, number> = {};
  const up = async (table: never, rows: Record<string, unknown>[], key: string, name: string) => {
    report[name] = rows.length;
    for (let i = 0; i < rows.length; i += 300) {
      const chunk = rows.slice(i, i + 300);
      if (!chunk.length) continue;
      const q = db.insert(table).values(chunk as never);
      if (overwrite) {
        const cols = Object.keys(chunk[0]).filter((k) => k !== key);
        await q.onConflictDoUpdate({ target: (table as Record<string, never>)[key], set: Object.fromEntries(cols.map((c) => [c, sql.raw(`excluded."${snake(c)}"`)])) as never });
      } else await q.onConflictDoNothing();
    }
  };
  const snake = (c: string) => c.replace(/[A-Z]/g, (m) => `_${m.toLowerCase()}`);
  await db.transaction(async (tx) => {
    const t = tx as unknown as Db; const save = db; db = t;
    await up(s.subjects as never, R.SUBJECTS.map((x: Record<string, unknown>, i: number) => ({ id: x.id, name: x.name, board: x.board, spec: x.spec || null, color: x.color, icon: x.icon, tiers: !!x.tiers, sortOrder: i })), 'id', 'subjects');
    await up(s.strands as never, R.STRANDS.map((x: Record<string, unknown>, i: number) => ({ id: x.id, subjectId: x.subject, name: x.name, color: x.color, icon: x.icon || null, sortOrder: i })), 'id', 'strands');
    await up(s.topics as never, R.TOPICS.map((x: Record<string, unknown>, i: number) => ({ id: x.id, subjectId: x.subject, strandId: x.strand, year: x.year, term: x.term, tier: x.tier, name: x.name, summary: x.summary || null, specRef: x.specRef || null, sortOrder: i })), 'id', 'topics');
    const styles: Record<string, unknown>[] = []; const items: Record<string, unknown>[] = [];
    for (const t of R.TOPICS) t.styles.forEach((sid: string, i: number) => {
      const st = R.getStyle(sid);
      const gen = engine.hasGenerator(sid);
      styles.push({ id: sid, topicId: t.id, name: st.name, intro: st.intro, source: gen ? 'generator' : 'bank', generatorKey: gen ? sid : null, sortOrder: i });
      if (!gen) (st.items || []).forEach((it: { type: string }, k: number) => items.push({ id: `${sid}~${String(k).padStart(3, '0')}`, styleId: sid, type: it.type, body: it, sortOrder: k }));
    });
    await up(s.styles as never, styles, 'id', 'styles');
    await up(s.items as never, items, 'id', 'items');
    await up(s.learnPages as never, Object.entries(R.LEARN).filter(([k]) => R.TOPICS.some((t: { id: string }) => t.id === k)).map(([topicId, content]) => ({ topicId, content })), 'topicId', 'learn_pages');
    if (bump) await bumpContentVersion(t);
    db = save;
  });
  return report;
}
