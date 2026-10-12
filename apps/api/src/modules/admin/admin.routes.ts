import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { z } from 'zod';
import { AnyObject, AdminCreateUserBody, AdminPatchUserBody, AdminPasswordBody, Ok } from '@stepwise/shared';
import type { Services } from '../../services.js';

const routes: FastifyPluginAsyncZod<{ svc: Services }> = async (app, { svc }) => {
  const admin = { roles: ['admin' as const] }; const tags = ['admin']; const Id = z.object({ id: z.string() });
  app.get('/admin/stats', { config: admin, schema: { tags, response: { 200: AnyObject } } }, async () => svc.admin.stats());
  app.get('/admin/users', { config: admin, schema: { tags, response: { 200: AnyObject } } }, async () => svc.admin.users());
  app.post('/admin/users', { config: admin, schema: { tags, body: AdminCreateUserBody, response: { 200: AnyObject } } }, async (req) => svc.admin.createUser(req.user!, req.body));
  app.get('/admin/users/:id', { config: admin, schema: { tags, params: Id, response: { 200: AnyObject } } }, async (req) => svc.admin.user(req.params.id));
  app.patch('/admin/users/:id', { config: admin, schema: { tags, params: Id, body: AdminPatchUserBody, response: { 200: AnyObject } } }, async (req) => svc.admin.patchUser(req.user!, req.params.id, req.body));
  app.post('/admin/users/:id/password', { config: admin, schema: { tags, params: Id, body: AdminPasswordBody, response: { 200: Ok } } }, async (req) => svc.admin.resetPassword(req.user!, req.params.id, req.body.password));
  app.delete('/admin/users/:id', { config: admin, schema: { tags, params: Id, response: { 200: Ok } } }, async (req) => svc.admin.deleteUser(req.user!, req.params.id));
  app.get('/admin/payments', { config: admin, schema: { tags, response: { 200: AnyObject } } }, async () => svc.admin.payments());
  app.get('/admin/tickets', { config: admin, schema: { tags, response: { 200: AnyObject } } }, async () => svc.gifts.all(svc.deps.db));
};
export default routes;
