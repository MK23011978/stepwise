// Daily reading goal + vocabulary: shelf, reading log with summaries, word bank, spaced-repetition quiz, rewards.
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { eq } from 'drizzle-orm';
import * as s from '../src/db/schema.js';
import { makeApp, client } from './setup.js';

let ctx: Awaited<ReturnType<typeof makeApp>>;
beforeAll(async () => { ctx = await makeApp(); }, 120_000);
afterAll(async () => ctx?.close());

describe('reading & vocabulary', () => {
  it('runs a day of reading', async () => {
    const p = client(ctx.app);
    await p.call('POST', '/auth/register', { name: 'Read Parent', email: 'rp@example.test', password: 'longenough1' });
    const { child } = await p.call('POST', '/children', { name: 'Ria Reader', yearGroup: 9, username: 'ria.reader', password: 'kidpassword' });
    const kid = client(ctx.app);
    await kid.call('POST', '/auth/login', { login: 'ria.reader', password: 'kidpassword' });
    const base = `/students/${child.id}`;

    const books = (await kid.call('GET', '/reading/books')).books;
    expect(Array.isArray(books)).toBe(true);
    // parent sets the goal
    await p.call('PUT', `${base}/reading/goal`, { dailyMinutes: 20, dailyWords: 2 });
    const ov0 = await kid.call('GET', `${base}/reading`);
    expect(ov0.goal).toEqual({ dailyMinutes: 20, dailyWords: 2 });
    expect(ov0.today.met).toBe(false);

    const { item } = await kid.call('POST', `${base}/reading/shelf`, books.length ? { bookId: books[0].id } : { title: 'My Book', totalPages: 200 });
    if (books.length) await kid.call('POST', `${base}/reading/shelf`, { bookId: books[0].id }, 409);
    await kid.call('POST', `${base}/reading/logs`, { shelfId: item.id, minutes: 15, toPage: 20, summary: 'too short' }, 400);
    const l1 = await kid.call('POST', `${base}/reading/logs`, { shelfId: item.id, minutes: 25, toPage: 30, summary: 'The two friends arrive at a new place and meet the people they will work with.' });
    expect(l1.goal).toMatchObject({ minutes: 25, words: 0, met: false });

    // words: the example must use the word; duplicates rejected
    await kid.call('POST', `${base}/vocab`, { word: 'ominous', meaning: 'giving the feeling that something bad will happen', example: 'The sky looked dark.' }, 400);
    await kid.call('POST', `${base}/vocab`, { word: 'ominous', meaning: 'giving the feeling that something bad will happen', example: 'The clouds gathered ominously over the hills.', shelfId: item.id });
    await kid.call('POST', `${base}/vocab`, { word: 'Ominous', meaning: 'x x' }, 409);
    const before = (await p.call('GET', `${base}/rewards`)).coins;
    const w2 = await kid.call('POST', `${base}/vocab`, { word: 'futile', meaning: 'having no useful result', example: 'Arguing with the referee was futile.' });
    expect(w2.goal).toMatchObject({ met: true, rewarded: true });
    expect((await p.call('GET', `${base}/rewards`)).coins).toBe(before + 10);
    await kid.call('POST', `${base}/vocab`, { word: 'benevolent', meaning: 'kind and helpful' }); // goal already rewarded today
    expect((await p.call('GET', `${base}/rewards`)).coins).toBe(before + 10);

    const ov = await p.call('GET', `${base}/reading`);
    expect(ov.today).toMatchObject({ minutes: 25, words: 3, met: true });
    expect(ov.streak).toBe(1);
    expect(ov.shelf[0].currentPage).toBe(30);
    expect(ov.logs[0].summary).toContain('two friends');
    expect(ov.vocab).toMatchObject({ total: 3, mastered: 0, due: 0 });

    // spaced repetition: make words due, quiz, answer
    await ctx.deps.db.update(s.vocabWords).set({ due: '2000-01-01' }).where(eq(s.vocabWords.studentId, child.id));
    const qz = await kid.call('GET', `${base}/vocab/quiz`);
    expect(qz.questions).toHaveLength(3);
    const q = qz.questions.find((x: { mode: string }) => x.mode === 'meaning');
    expect(q.options).toHaveLength(4);
    const words = (await kid.call('GET', `${base}/vocab`)).words;
    const target = words.find((w: { id: string }) => w.id === q.wordId);
    const ok = await kid.call('POST', `${base}/vocab/${q.wordId}/answer`, { mode: 'meaning', answer: target.meaning });
    expect(ok).toMatchObject({ correct: true, box: 1 });
    const bad = await kid.call('POST', `${base}/vocab/${words[0].id}/answer`, { mode: 'spell', answer: 'wrongword' });
    expect(bad).toMatchObject({ correct: false, box: 0 });
    expect((await kid.call('GET', `${base}/reading`)).today.reviewed).toBe(2);

    // finishing needs a summary
    await kid.call('PATCH', `${base}/reading/shelf/${item.id}`, { status: 'finished' }, 400);
    expect((await kid.call('PATCH', `${base}/reading/shelf/${item.id}`, { status: 'finished', rating: 5, summary: 'A short story about two workers who share a dream of owning land, and how loneliness and bad luck get in the way.' })).finished).toBe(true);

    // privacy
    const other = client(ctx.app);
    await other.call('POST', '/auth/register', { name: 'Other', email: 'other-rd@example.test', password: 'longenough1' });
    await other.call('GET', `${base}/reading`, undefined, 403);
    await other.call('GET', `${base}/vocab`, undefined, 403);
  }, 120_000);
});
