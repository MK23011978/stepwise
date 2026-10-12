// Friends & chat. Students act for themselves; parents approve friendships, read their child's chats and set controls; admins handle reports.
import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { z } from 'zod';
import { AnyObject, Ok, FriendRequestBody, ChatMessageBody, ChatQuery, ChatReportBody, FriendApproveBody, SocialSettingsBody, ReportPatchBody, ShareQuestionBody, SharedAnswerBody } from '@stepwise/shared';
import type { Services } from '../services.js';
import { studentFor } from './common/access.js';
import { audit } from './common/audit.js';

const Fid = z.object({ fid: z.string() });
const routes: FastifyPluginAsyncZod<{ svc: Services }> = async (app, { svc }) => {
  const { db } = svc.deps; const social = svc.social;
  const student = { roles: ['student' as const] };
  const parentOrAdmin = { roles: ['parent' as const, 'admin' as const] };
  const T = { tags: ['social'] };

  app.post('/presence', { schema: { ...T, summary: 'Heartbeat — call every ~45s while the app is open', response: { 200: Ok } } }, async (req) => social.heartbeat(db, req.user!.id));

  // ----- student -----
  app.get('/social', { config: student, schema: { ...T, summary: 'Online students, friends, requests and unread count', response: { 200: AnyObject } } }, async (req) => social.overview(db, req.user!.id));
  app.post('/social/friends', { config: { ...student, rateLimit: { max: 20, timeWindow: '1 hour' } }, schema: { ...T, summary: 'Send a friend request', body: FriendRequestBody, response: { 200: Ok } } }, async (req) => social.request(db, req.user!, req.body));
  app.post('/social/friends/:fid/accept', { config: student, schema: { ...T, params: Fid, response: { 200: Ok } } }, async (req) => social.respond(db, req.user!, req.params.fid, true));
  app.post('/social/friends/:fid/decline', { config: student, schema: { ...T, params: Fid, response: { 200: Ok } } }, async (req) => social.respond(db, req.user!, req.params.fid, false));
  app.post('/social/friends/:fid/block', { config: student, schema: { ...T, params: Fid, response: { 200: Ok } } }, async (req) => social.block(db, req.user!, req.params.fid));
  app.delete('/social/friends/:fid', { config: student, schema: { ...T, summary: 'Unfriend, cancel a request or unblock', params: Fid, response: { 200: Ok } } }, async (req) => social.remove(db, req.user!, req.params.fid));
  app.get('/social/friends/:fid/messages', { config: student, schema: { ...T, params: Fid, querystring: ChatQuery, response: { 200: AnyObject } } }, async (req) => social.thread(db, req.user!, req.params.fid, req.query.after));
  app.post('/social/friends/:fid/messages', { config: student, schema: { ...T, params: Fid, body: ChatMessageBody, response: { 200: AnyObject } } }, async (req) => social.send(db, req.user!, req.params.fid, req.body.body));
  app.post('/social/friends/:fid/questions', { config: student, schema: { ...T, summary: 'Share a question to solve together (random from your open years if no style/topic is given)', params: Fid, body: ShareQuestionBody, response: { 200: AnyObject } } }, async (req) => social.share(db, req.user!, req.params.fid, req.body));
  app.post('/social/friends/:fid/questions/:qid/answer', { config: student, schema: { ...T, params: z.object({ fid: z.string(), qid: z.string() }), body: SharedAnswerBody, response: { 200: AnyObject } } }, async (req) => social.answerShared(db, req.user!, req.params.fid, req.params.qid, req.body.input));
  app.post('/social/friends/:fid/report', { config: student, schema: { ...T, params: Fid, body: ChatReportBody, response: { 200: Ok } } }, async (req) => {
    const r = await social.report(db, req.user!, req.params.fid, req.body);
    await audit(db, req.user, 'chat-report', req.body.reason.slice(0, 120));
    return r;
  });

  // ----- parent -----
  const ChildF = z.object({ id: z.string(), fid: z.string() });
  app.get('/students/:id/social', { config: parentOrAdmin, schema: { ...T, summary: 'A child’s friends and chat controls', params: z.object({ id: z.string() }), response: { 200: AnyObject } } }, async (req) => social.forParent(db, await studentFor(db, req.user, req.params.id)));
  app.put('/students/:id/social', { config: parentOrAdmin, schema: { ...T, params: z.object({ id: z.string() }), body: SocialSettingsBody, response: { 200: Ok } } }, async (req) => social.saveSettings(db, await studentFor(db, req.user, req.params.id), req.body));
  app.get('/students/:id/friends/:fid/messages', { config: parentOrAdmin, schema: { ...T, summary: 'Read a child’s chat', params: ChildF, response: { 200: AnyObject } } }, async (req) => social.parentThread(db, await studentFor(db, req.user, req.params.id), req.params.fid));
  app.post('/students/:id/friends/:fid/approve', { config: parentOrAdmin, schema: { ...T, params: ChildF, body: FriendApproveBody, response: { 200: AnyObject } } }, async (req) => social.parentDecide(db, await studentFor(db, req.user, req.params.id), req.params.fid, req.body.approve));

  // ----- admin -----
  app.get('/admin/chat-reports', { config: { roles: ['admin'] }, schema: { ...T, response: { 200: AnyObject } } }, async () => social.reports(db));
  app.patch('/admin/chat-reports/:rid', { config: { roles: ['admin'] }, schema: { ...T, params: z.object({ rid: z.string() }), body: ReportPatchBody, response: { 200: Ok } } }, async (req) => social.closeReport(db, req.params.rid, req.body.status));
};
export default routes;
