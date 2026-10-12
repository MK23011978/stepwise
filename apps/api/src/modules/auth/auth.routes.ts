import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { z } from 'zod';
import { RegisterBody, LoginBody, RefreshBody, UpdateMeBody, MeResponse, AuthResponse, TokenPair, Ok } from '@stepwise/shared';
import type { Services } from '../../services.js';
import { RT_COOKIE } from '../../plugins/auth.js';
import { HttpError } from '../../core/errors.js';
import { publicUser } from '../students/students.service.js';

const routes: FastifyPluginAsyncZod<{ svc: Services }> = async (app, { svc }) => {
  const rateLimit = { rateLimit: { max: 10, timeWindow: '10 minutes' } };

  app.post('/auth/register', { config: { auth: false, ...rateLimit }, schema: { tags: ['auth'], summary: 'Create a parent account', body: RegisterBody, response: { 200: AuthResponse } } }, async (req, reply) => {
    const user = await svc.auth.register(req.body);
    const t = await svc.tokens.issue(user, req.body.client, req.headers['user-agent']);
    if (req.body.client === 'web') svc.tokens.setCookies(reply, t);
    return { user: publicUser(user), ...(req.body.client === 'mobile' ? { tokens: t } : {}) };
  });

  app.post('/auth/login', { config: { auth: false, ...rateLimit }, schema: { tags: ['auth'], summary: 'Sign in (web: sets HttpOnly cookies; mobile: returns tokens)', body: LoginBody, response: { 200: AuthResponse } } }, async (req, reply) => {
    const user = await svc.auth.login(req.body.login, req.body.password);
    const t = await svc.tokens.issue(user, req.body.client, req.headers['user-agent']);
    if (req.body.client === 'web') svc.tokens.setCookies(reply, t);
    return { user: publicUser(user), ...(req.body.client === 'mobile' ? { tokens: t } : {}) };
  });

  app.post('/auth/refresh', { config: { auth: false }, schema: { tags: ['auth'], summary: 'Rotate the refresh token (mobile: body; web: cookie)', body: RefreshBody, response: { 200: z.object({ tokens: TokenPair.optional(), ok: z.boolean() }) } } }, async (req, reply) => {
    const token = req.body?.refreshToken || req.cookies[RT_COOKIE];
    if (!token) throw new HttpError(401, 'No refresh token');
    const r = await svc.tokens.rotate(token);
    if (!r) { svc.tokens.clearCookies(reply); throw new HttpError(401, 'Session expired — please sign in again'); }
    if (req.body?.refreshToken) return { ok: true, tokens: r.tokens };
    svc.tokens.setCookies(reply, r.tokens);
    return { ok: true };
  });

  app.post('/auth/logout', { config: { auth: false }, schema: { tags: ['auth'], summary: 'Sign out (revokes the session)', response: { 200: Ok } } }, async (req, reply) => {
    if (req.user) await svc.tokens.revoke(req.user.sessionId);
    svc.tokens.clearCookies(reply);
    return { ok: true as const };
  });

  app.get('/me', { schema: { tags: ['auth'], summary: 'Current user, children and wallet', response: { 200: MeResponse } } }, async (req) => svc.auth.me(req.user!));
  app.patch('/me', { schema: { tags: ['auth'], body: UpdateMeBody, response: { 200: MeResponse } } }, async (req) => svc.auth.updateMe(req.user!, req.body));
  app.delete('/me', { config: { roles: ['parent'] }, schema: { tags: ['auth'], summary: 'Delete my account and all family data', response: { 200: Ok } } }, async (req, reply) => {
    await svc.auth.deleteMe(req.user!); svc.tokens.clearCookies(reply); return { ok: true as const };
  });
};
export default routes;
