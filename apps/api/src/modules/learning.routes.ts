// Lessons, review sessions and exams.
import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { z } from 'zod';
import { AnyObject, StartLessonBody, StartReviewBody, AnswerBody, StartExamBody, SubmitExamBody } from '@stepwise/shared';
import type { Services } from '../services.js';

const Id = z.object({ id: z.string() });
const routes: FastifyPluginAsyncZod<{ svc: Services }> = async (app, { svc }) => {
  const L = { tags: ['lessons'] }; const E = { tags: ['exams'] };
  app.post('/lessons', { schema: { ...L, summary: 'Start (or resume) a lesson — charges 1 credit unless free', body: StartLessonBody, response: { 200: AnyObject } } }, async (req) => svc.lessons.start(req.user!, req.body.studentId, req.body.styleId));
  app.post('/reviews', { schema: { ...L, summary: 'Start a free review session (past mistakes + due topics)', body: StartReviewBody, response: { 200: AnyObject } } }, async (req) => svc.lessons.startReview(req.user!, req.body));
  app.get('/lessons/:id', { schema: { ...L, params: Id, response: { 200: AnyObject } } }, async (req) => svc.lessons.get(req.user!, req.params.id));
  app.post('/lessons/:id/answer', { schema: { ...L, params: Id, body: AnswerBody, response: { 200: AnyObject } } }, async (req) => svc.lessons.answer(req.user!, req.params.id, req.body.input));
  app.post('/lessons/:id/hint', { schema: { ...L, params: Id, response: { 200: AnyObject } } }, async (req) => svc.lessons.hint(req.user!, req.params.id));
  app.post('/lessons/:id/skip', { schema: { ...L, params: Id, response: { 200: AnyObject } } }, async (req) => svc.lessons.skip(req.user!, req.params.id));
  app.post('/lessons/:id/next', { schema: { ...L, params: Id, response: { 200: AnyObject } } }, async (req) => svc.lessons.next(req.user!, req.params.id));

  app.post('/exams', { schema: { ...E, summary: 'Start an exam, checkpoint, mock or topic test (examId "topic:<topicId>")', body: StartExamBody, response: { 200: AnyObject } } }, async (req) => svc.exams.start(req.user!, req.body.studentId, req.body.examId));
  app.get('/exams/:id', { schema: { ...E, params: Id, response: { 200: AnyObject } } }, async (req) => svc.exams.get(req.user!, req.params.id));
  app.post('/exams/:id/submit', { schema: { ...E, params: Id, body: SubmitExamBody, response: { 200: AnyObject } } }, async (req) => svc.exams.submit(req.user!, req.params.id, req.body.answers));
  const Sim = z.object({ id: z.string(), n: z.coerce.number().int().min(0) });
  app.get('/exams/:id/similar/:n', { schema: { ...E, summary: 'A fresh question like a missed one', params: Sim, response: { 200: AnyObject } } }, async (req) => svc.exams.similar(req.user!, req.params.id, req.params.n));
  app.post('/exams/:id/similar/:n', { schema: { ...E, params: Sim, body: AnswerBody, response: { 200: AnyObject } } }, async (req) => svc.exams.similarAnswer(req.user!, req.params.id, req.params.n, req.body.input));
};
export default routes;
