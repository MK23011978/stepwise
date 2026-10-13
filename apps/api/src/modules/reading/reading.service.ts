// Daily reading with a vocabulary focus: a goal (minutes + new words a day), a bookshelf, a reading log where each
// session needs a short summary, and the student's own word bank practised with spaced repetition.
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { and, asc, desc, eq, gte, lte, sql } from 'drizzle-orm';
import type { Db } from '../../db/client.js';
import * as s from '../../db/schema.js';
import { newId } from '../../core/ids.js';
import { addDays, nowIso, today } from '../../core/dates.js';
import { fail } from '../../core/errors.js';
import * as repo from '../students/students.repo.js';

export interface CatalogWord { word: string; type: string; def: string; example: string }
export interface CatalogBook { id: string; title: string; author: string; published: number; years: number[]; pages: number; level: string; genre: string; blurb: string; why: string; themes: string[]; contentNote?: string; publicDomain?: boolean; freeLink?: string; words: CatalogWord[]; prompts: string[] }

const require = createRequire(import.meta.url);
const CATALOG_FILE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../../../packages/content-seed/reading/books.cjs');
let cache: CatalogBook[] | null = null;
export function catalog(): CatalogBook[] {
  if (!cache) { try { cache = require(CATALOG_FILE) as CatalogBook[]; } catch { cache = []; } }
  return cache;
}
// spare wrong options so a "choose the meaning" question always has four choices
const SPARE_MEANINGS = ['feeling very tired after hard work', 'easy to see through, like glass', 'unwilling to change your mind', 'happening once every year',
  'a feeling of great happiness', 'to make something smaller or weaker', 'very old and no longer used', 'full of energy and enthusiasm', 'to say no to an offer or request', 'calm and peaceful'];
export const DEFAULT_GOAL = { dailyMinutes: 20, dailyWords: 3 };
export const INTERVALS = [1, 2, 4, 7, 15, 30]; // days until the next review, by Leitner box
export const MASTERED_BOX = 4;
export const GOAL_XP = 20, GOAL_COINS = 10;
const norm = (x: string) => x.toLowerCase().replace(/[’']/g, "'").replace(/[^a-z0-9' -]+/g, ' ').replace(/\s+/g, ' ').trim();

export function createReadingService() {
  const goalOf = (st: repo.Student) => ({ ...DEFAULT_GOAL, ...(st.reading || {}) });

  async function shelfItem(db: Db, studentId: string, shelfId: string) {
    const [row] = await db.select().from(s.readingShelf).where(and(eq(s.readingShelf.id, shelfId), eq(s.readingShelf.studentId, studentId)));
    return row || fail(404, 'Book not found on your shelf');
  }

  /** Pays the daily reward the first time both parts of the goal are met on a day. */
  async function checkGoal(db: Db, st: repo.Student, day = today()) {
    const g = goalOf(st);
    const [{ minutes }] = await db.select({ minutes: sql<number>`coalesce(sum(${s.readingLogs.minutes}), 0)::int` }).from(s.readingLogs).where(and(eq(s.readingLogs.studentId, st.id), eq(s.readingLogs.day, day)));
    const [{ words }] = await db.select({ words: sql<number>`count(*)::int` }).from(s.vocabWords).where(and(eq(s.vocabWords.studentId, st.id), eq(s.vocabWords.addedOn, day)));
    const met = minutes >= g.dailyMinutes && words >= g.dailyWords;
    if (!met || day !== today()) return { minutes, words, met, rewarded: false };
    await db.insert(s.readingDays).values({ studentId: st.id, day }).onConflictDoNothing();
    const upd = await db.update(s.readingDays).set({ goalMetAt: nowIso() }).where(and(eq(s.readingDays.studentId, st.id), eq(s.readingDays.day, day), sql`${s.readingDays.goalMetAt} is null`)).returning({ day: s.readingDays.day });
    if (upd.length) {
      await repo.addXpCoins(db, st.id, GOAL_XP, GOAL_COINS);
      await repo.notify(db, st.id, { type: 'reading', title: 'Reading goal complete! 📚', text: `${minutes} minutes read and ${words} new word${words === 1 ? '' : 's'} today. +${GOAL_XP} XP, +${GOAL_COINS} coins.`, icon: '📚' });
    }
    return { minutes, words, met, rewarded: upd.length > 0 };
  }

  async function overview(db: Db, st: repo.Student) {
    const g = goalOf(st); const t = today(); const from = addDays(-13);
    const shelf = await db.select().from(s.readingShelf).where(eq(s.readingShelf.studentId, st.id)).orderBy(desc(s.readingShelf.startedAt));
    const logs = await db.select().from(s.readingLogs).where(eq(s.readingLogs.studentId, st.id)).orderBy(desc(s.readingLogs.day), desc(s.readingLogs.createdAt)).limit(60);
    const mins = await db.select({ day: s.readingLogs.day, m: sql<number>`sum(${s.readingLogs.minutes})::int` }).from(s.readingLogs).where(and(eq(s.readingLogs.studentId, st.id), gte(s.readingLogs.day, from))).groupBy(s.readingLogs.day);
    const added = await db.select({ day: s.vocabWords.addedOn, n: sql<number>`count(*)::int` }).from(s.vocabWords).where(and(eq(s.vocabWords.studentId, st.id), gte(s.vocabWords.addedOn, from))).groupBy(s.vocabWords.addedOn);
    const days = await db.select().from(s.readingDays).where(and(eq(s.readingDays.studentId, st.id), gte(s.readingDays.day, addDays(-400))));
    const metSet = new Set(days.filter((d) => d.goalMetAt).map((d) => d.day));
    let streak = 0; for (let i = metSet.has(t) ? 0 : 1; metSet.has(addDays(-i)); i++) streak++;
    const week = Array.from({ length: 14 }, (_, i) => { const d = addDays(i - 13); return { day: d, minutes: mins.find((x) => x.day === d)?.m || 0, words: added.find((x) => x.day === d)?.n || 0, met: metSet.has(d) }; });
    const [v] = await db.select({ total: sql<number>`count(*)::int`, mastered: sql<number>`count(*) filter (where ${s.vocabWords.box} >= ${MASTERED_BOX})::int`, due: sql<number>`count(*) filter (where ${s.vocabWords.due} <= ${t})::int` }).from(s.vocabWords).where(eq(s.vocabWords.studentId, st.id));
    const todayRow = week[13];
    const cat = new Map(catalog().map((b) => [b.id, b]));
    return {
      goal: g,
      today: { minutes: todayRow.minutes, words: todayRow.words, reviewed: days.find((d) => d.day === t)?.reviewed || 0, met: metSet.has(t) },
      streak, week, vocab: v,
      shelf: shelf.map((b) => ({ ...b, pct: b.totalPages ? Math.min(100, Math.round((b.currentPage / b.totalPages) * 100)) : null, book: b.bookId ? { level: cat.get(b.bookId)?.level, prompts: cat.get(b.bookId)?.prompts || [], wordCount: cat.get(b.bookId)?.words.length || 0 } : null })),
      logs: logs.map((l) => ({ ...l, title: shelf.find((b) => b.id === l.shelfId)?.title || '' })),
      reward: { xp: GOAL_XP, coins: GOAL_COINS },
    };
  }

  async function setGoal(db: Db, st: repo.Student, b: { dailyMinutes: number; dailyWords: number }) {
    await repo.updateProfile(db, st.id, { reading: { dailyMinutes: b.dailyMinutes, dailyWords: b.dailyWords } });
    return { goal: b };
  }

  async function addToShelf(db: Db, st: repo.Student, b: { bookId?: string; title?: string; author?: string; totalPages?: number }) {
    let title = b.title, author = b.author, pages = b.totalPages;
    if (b.bookId) {
      const book = catalog().find((x) => x.id === b.bookId); if (!book) return fail(404, 'Book not found');
      const [dup] = await db.select({ id: s.readingShelf.id }).from(s.readingShelf).where(and(eq(s.readingShelf.studentId, st.id), eq(s.readingShelf.bookId, book.id)));
      if (dup) return fail(409, 'This book is already on your shelf');
      title = book.title; author = book.author; pages = pages || book.pages;
    }
    const row = { id: newId('shf'), studentId: st.id, bookId: b.bookId || null, title: title!, author: author || null, totalPages: pages || null };
    await db.insert(s.readingShelf).values(row);
    return { item: row };
  }

  async function patchShelf(db: Db, st: repo.Student, shelfId: string, b: { status?: string; summary?: string; rating?: number; totalPages?: number }) {
    const item = await shelfItem(db, st.id, shelfId);
    if (b.status === 'finished' && !(b.summary || item.summary)) return fail(400, 'Write a short summary of the whole book before marking it finished', 'SUMMARY_NEEDED');
    if (b.status === 'finished' && (b.summary || item.summary || '').length < 80) return fail(400, 'Your book summary should be at least a few sentences (80+ characters)', 'SUMMARY_NEEDED');
    const finishing = b.status === 'finished' && item.status !== 'finished';
    await db.update(s.readingShelf).set({ ...b, ...(finishing ? { finishedAt: nowIso(), currentPage: item.totalPages || item.currentPage } : {}) }).where(eq(s.readingShelf.id, item.id));
    if (finishing) {
      await repo.addXpCoins(db, st.id, 50, 25);
      await repo.notify(db, st.id, { type: 'reading', title: `You finished “${item.title}”! 🏆`, text: '+50 XP, +25 coins for finishing a book.', icon: '🏆' });
    }
    return { ok: true as const, finished: finishing };
  }

  async function removeShelf(db: Db, st: repo.Student, shelfId: string) {
    const item = await shelfItem(db, st.id, shelfId);
    await db.delete(s.readingShelf).where(eq(s.readingShelf.id, item.id));
    return { ok: true as const };
  }

  async function log(db: Db, st: repo.Student, b: { shelfId: string; minutes: number; toPage?: number; summary: string; day?: string }) {
    const item = await shelfItem(db, st.id, b.shelfId);
    const day = b.day || today();
    if (day > today() || day < addDays(-7)) return fail(400, 'You can log reading for today or the last 7 days');
    if (b.toPage != null && item.totalPages && b.toPage > item.totalPages) return fail(400, `This book has ${item.totalPages} pages`);
    await db.insert(s.readingLogs).values({ id: newId('rlg'), studentId: st.id, shelfId: item.id, day, minutes: b.minutes, fromPage: item.currentPage || 0, toPage: b.toPage ?? null, summary: b.summary });
    if (b.toPage != null && b.toPage > item.currentPage) await db.update(s.readingShelf).set({ currentPage: b.toPage, status: item.status === 'paused' ? 'reading' : item.status }).where(eq(s.readingShelf.id, item.id));
    await repo.markActive(db, st.id);
    return { goal: await checkGoal(db, st, day) };
  }

  async function addWord(db: Db, st: repo.Student, b: { word: string; meaning: string; example?: string; shelfId?: string; bookId?: string }) {
    const w0 = norm(b.word); const stem = w0.slice(0, Math.max(3, Math.min(5, w0.length - 1))); // allow other forms: ominous → ominously
    if (b.example && !norm(b.example).includes(stem)) return fail(400, 'Your example sentence should use the word', 'EXAMPLE_NEEDS_WORD');
    const t = today();
    try {
      await db.insert(s.vocabWords).values({ id: newId('voc'), studentId: st.id, shelfId: b.shelfId || null, bookId: b.bookId || null, word: b.word, meaning: b.meaning, example: b.example || null, due: addDays(1), addedOn: t });
    } catch { return fail(409, `“${b.word}” is already in your word bank`); }
    return { goal: await checkGoal(db, st, t) };
  }
  async function removeWord(db: Db, st: repo.Student, wid: string) {
    const del = await db.delete(s.vocabWords).where(and(eq(s.vocabWords.id, wid), eq(s.vocabWords.studentId, st.id))).returning({ id: s.vocabWords.id });
    if (!del.length) return fail(404, 'Word not found');
    return { ok: true as const };
  }
  async function words(db: Db, st: repo.Student) {
    const rows = await db.select().from(s.vocabWords).where(eq(s.vocabWords.studentId, st.id)).orderBy(desc(s.vocabWords.createdAt));
    return { words: rows.map((w) => ({ ...w, mastered: w.box >= MASTERED_BOX, dueNow: w.due <= today() })) };
  }

  /** Up to 10 due words; each as "choose the meaning" (4 options) or "spell the word from its meaning". */
  async function quiz(db: Db, st: repo.Student) {
    const due = await db.select().from(s.vocabWords).where(and(eq(s.vocabWords.studentId, st.id), lte(s.vocabWords.due, today()))).orderBy(asc(s.vocabWords.due), asc(s.vocabWords.box)).limit(10);
    const all = await db.select({ meaning: s.vocabWords.meaning }).from(s.vocabWords).where(eq(s.vocabWords.studentId, st.id));
    const pool = [...new Set([...all.map((x) => x.meaning), ...catalog().flatMap((b) => b.words.map((w) => w.def)), ...SPARE_MEANINGS])];
    const shuffle = <T,>(a: T[]) => a.map((x) => [Math.random(), x] as const).sort((p, q) => p[0] - q[0]).map(([, x]) => x);
    return { questions: due.map((w, i) => {
      const mode = w.box >= 2 && i % 2 === 1 ? 'spell' : 'meaning';
      if (mode === 'spell') return { wordId: w.id, mode, prompt: w.meaning, hint: `${w.word.length} letters, starts with “${w.word[0]}”`, example: w.example ? w.example.replace(new RegExp(w.word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'ig'), '_____') : null };
      const wrong = shuffle(pool.filter((m) => norm(m) !== norm(w.meaning))).slice(0, 3);
      return { wordId: w.id, mode, prompt: w.word, options: shuffle([w.meaning, ...wrong]) };
    }) };
  }

  async function answer(db: Db, st: repo.Student, wid: string, b: { mode: 'meaning' | 'spell'; answer: string }) {
    const [w] = await db.select().from(s.vocabWords).where(and(eq(s.vocabWords.id, wid), eq(s.vocabWords.studentId, st.id)));
    if (!w) return fail(404, 'Word not found');
    const ok = b.mode === 'meaning' ? norm(b.answer) === norm(w.meaning) : norm(b.answer) === norm(w.word);
    const box = ok ? Math.min(INTERVALS.length - 1, w.box + 1) : 0;
    await db.update(s.vocabWords).set({ box, due: addDays(ok ? INTERVALS[box] : 1), correct: w.correct + (ok ? 1 : 0), wrong: w.wrong + (ok ? 0 : 1) }).where(eq(s.vocabWords.id, w.id));
    await db.insert(s.readingDays).values({ studentId: st.id, day: today(), reviewed: 1 }).onConflictDoUpdate({ target: [s.readingDays.studentId, s.readingDays.day], set: { reviewed: sql`${s.readingDays.reviewed} + 1` } });
    if (ok) await repo.addXpCoins(db, st.id, 2, 0);
    return { correct: ok, word: w.word, meaning: w.meaning, example: w.example, box, mastered: box >= MASTERED_BOX };
  }

  return { catalog, overview, setGoal, addToShelf, patchShelf, removeShelf, log, addWord, removeWord, words, quiz, answer, checkGoal };
}
export type ReadingService = ReturnType<typeof createReadingService>;
