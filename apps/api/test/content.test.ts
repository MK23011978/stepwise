import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { count, eq } from 'drizzle-orm';
import * as s from '../src/db/schema.js';
import { loadLegacyContent } from '../src/content/legacy.js';
import { hashPassword } from '../src/core/password.js';
import { makeApp, client } from './setup.js';

let ctx: Awaited<ReturnType<typeof makeApp>>;
beforeAll(async () => { ctx = await makeApp(); }, 180_000);
afterAll(async () => ctx?.close());

describe('stage 3 — content in the database', () => {
  it('imports every subject, topic, style, bank question and teaching page', async () => {
    const legacy = loadLegacyContent();
    const db = ctx.deps.db;
    expect(Number((await db.select({ c: count() }).from(s.topics))[0].c)).toBe(legacy.topics.length);
    expect(ctx.deps.content.topics.length).toBe(legacy.topics.length);
    expect(ctx.deps.content.subjects.map((x) => x.id)).toEqual(legacy.subjects.map((x) => x.id));
    expect(Number((await db.select({ c: count() }).from(s.items))[0].c)).toBeGreaterThan(9000);
    expect(ctx.deps.content.learnIds().length).toBe(legacy.learnIds().length);
    const gen = await db.select().from(s.styles).where(eq(s.styles.source, 'generator'));
    expect(gen.length).toBeGreaterThan(400); // maths + science/CS calculation generators stay in code
  });

  it('serves generated and bank questions that mark their own answers correct', () => {
    const c = ctx.deps.content;
    for (const t of c.topics.filter((_, i) => i % 7 === 0)) for (const sid of t.styles) {
      const q = c.generate(sid);
      expect(c.checkAnswer(q.check, q.answer), sid).toBe(true);
    }
  });

  it('admins edit a question bank and the change is served without a restart', async () => {
    await ctx.deps.db.insert(s.users).values({ id: 'usr_adm', role: 'admin', name: 'Admin', email: 'adm@example.test', passwordHash: await hashPassword('adminpass123') });
    const a = client(ctx.app);
    await a.call('POST', '/auth/login', { login: 'adm@example.test', password: 'adminpass123' });
    const bankTopic = ctx.deps.content.topics.find((t) => t.subject === 'history')!;
    const styleId = bankTopic.styles[0];
    const before = (await a.call('GET', `/admin/content/styles/${styleId}/items`)).items.length;
    // malformed: says option 9 is correct
    await a.call('POST', `/admin/content/styles/${styleId}/items`, { body: { type: 'mcq', q: 'Bad?', options: ['a', 'b'], correct: 9, explain: 'x' } }, 400);
    const unique = 'In which year did the Battle of Hastings take place? (admin test)';
    const { item } = await a.call('POST', `/admin/content/styles/${styleId}/items`, { body: { type: 'mcq', q: unique, options: ['1066', '1066 BC', '1166', '966'], correct: 0, explain: '1066 — William of Normandy defeated Harold II.' } });
    expect((await a.call('GET', `/admin/content/styles/${styleId}/items`)).items.length).toBe(before + 1);
    // every other item switched off → the new one must be served immediately
    for (const it of (await a.call('GET', `/admin/content/styles/${styleId}/items`)).items) if (it.id !== item.id) await ctx.deps.db.update(s.items).set({ active: false }).where(eq(s.items.id, it.id));
    await a.call('PATCH', `/admin/content/items/${item.id}`, { active: true });
    expect(ctx.deps.content.generate(styleId).html).toBe(unique);
    // teaching page edit
    await a.call('PUT', `/admin/content/learn/${bankTopic.id}`, { content: { overview: '<p>New overview</p>', objectives: ['I can explain 1066'], keyWords: [{ term: 'Conquest', def: 'Taking by force' }], sections: [{ title: 'Intro', html: '<p>x</p>' }] } });
    expect((await a.call('GET', `/learn/${bankTopic.id}`)).content.overview).toBe('<p>New overview</p>');
    // students and parents cannot edit content
    const p = client(ctx.app);
    await p.call('POST', '/auth/register', { name: 'P', email: 'p@example.test', password: 'longenough1' });
    await p.call('PATCH', `/admin/content/items/${item.id}`, { active: false }, 403);
  });
});
