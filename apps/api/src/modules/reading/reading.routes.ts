// Reading & vocabulary endpoints. Students act for themselves; parents (and admins) for their children.
import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { z } from 'zod';
import { AnyObject, Ok, ReadingGoalBody, ShelfAddBody, ShelfPatchBody, ReadingLogBody, VocabAddBody, VocabAnswerBody } from '@stepwise/shared';
import type { Services } from '../../services.js';
import { studentFor } from '../common/access.js';

const routes: FastifyPluginAsyncZod<{ svc: Services }> = async (app, { svc }) => {
  const { db } = svc.deps; const R = svc.reading;
  const T = { tags: ['reading'] };
  const Id = z.object({ id: z.string() });
  const Sid = z.object({ id: z.string(), sid: z.string() });
  const Wid = z.object({ id: z.string(), wid: z.string() });
  const st = (req: { user: never; params: { id: string } }) => studentFor(db, req.user, req.params.id);

  app.get('/reading/books', { schema: { ...T, summary: 'Recommended books with their vocabulary lists', response: { 200: AnyObject } } }, async () => ({ books: R.catalog() }));
  app.get('/reading/books/:bookId/text', { schema: { ...T, summary: 'Chapters of a public-domain book', params: z.object({ bookId: z.string() }), response: { 200: AnyObject } } }, async (req) => R.contents(req.params.bookId));
  app.get('/reading/books/:bookId/text/:n', { schema: { ...T, summary: 'One chapter of a public-domain book', params: z.object({ bookId: z.string(), n: z.coerce.number().int().min(1) }), response: { 200: AnyObject } } }, async (req) => R.chapter(req.params.bookId, req.params.n));
  app.get('/students/:id/reading', { schema: { ...T, summary: 'Goal, today, streak, shelf, log and word-bank stats', params: Id, response: { 200: AnyObject } } }, async (req) => R.overview(db, await st(req as never)));
  app.put('/students/:id/reading/goal', { schema: { ...T, params: Id, body: ReadingGoalBody, response: { 200: AnyObject } } }, async (req) => R.setGoal(db, await st(req as never), req.body));
  app.post('/students/:id/reading/shelf', { schema: { ...T, params: Id, body: ShelfAddBody, response: { 200: AnyObject } } }, async (req) => R.addToShelf(db, await st(req as never), req.body));
  app.patch('/students/:id/reading/shelf/:sid', { schema: { ...T, params: Sid, body: ShelfPatchBody, response: { 200: AnyObject } } }, async (req) => R.patchShelf(db, await st(req as never), req.params.sid, req.body));
  app.delete('/students/:id/reading/shelf/:sid', { schema: { ...T, params: Sid, response: { 200: Ok } } }, async (req) => R.removeShelf(db, await st(req as never), req.params.sid));
  app.post('/students/:id/reading/logs', { schema: { ...T, summary: 'Log a reading session (minutes, page reached, summary)', params: Id, body: ReadingLogBody, response: { 200: AnyObject } } }, async (req) => R.log(db, await st(req as never), req.body));
  app.get('/students/:id/vocab', { schema: { ...T, params: Id, response: { 200: AnyObject } } }, async (req) => R.words(db, await st(req as never)));
  app.post('/students/:id/vocab', { schema: { ...T, summary: 'Add a word to the word bank', params: Id, body: VocabAddBody, response: { 200: AnyObject } } }, async (req) => R.addWord(db, await st(req as never), req.body));
  app.delete('/students/:id/vocab/:wid', { schema: { ...T, params: Wid, response: { 200: Ok } } }, async (req) => R.removeWord(db, await st(req as never), req.params.wid));
  app.get('/students/:id/vocab/quiz', { schema: { ...T, summary: 'Due words as meaning/spelling questions', params: Id, response: { 200: AnyObject } } }, async (req) => R.quiz(db, await st(req as never)));
  app.post('/students/:id/vocab/:wid/answer', { schema: { ...T, params: Wid, body: VocabAnswerBody, response: { 200: AnyObject } } }, async (req) => R.answer(db, await st(req as never), req.params.wid, req.body));
};
export default routes;
