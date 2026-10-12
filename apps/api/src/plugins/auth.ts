// Authentication: web = HttpOnly cookies (access + refresh, silent refresh); mobile = Bearer access token + refresh token.
import fp from 'fastify-plugin';
import type { FastifyReply, FastifyRequest } from 'fastify';
import { and, eq, gt, isNull } from 'drizzle-orm';
import * as s from '../db/schema.js';
import type { Deps } from '../core/deps.js';
import { hashToken, newRefreshToken, signAccess, verifyAccess } from '../core/tokens.js';
import { HttpError } from '../core/errors.js';
import { newId } from '../core/ids.js';
import { nowIso } from '../core/dates.js';

export type AuthUser = typeof s.users.$inferSelect & { sessionId: string };
declare module 'fastify' {
  interface FastifyRequest { user: AuthUser | null }
  interface FastifyContextConfig { auth?: boolean; roles?: ('admin' | 'parent' | 'student')[] }
}

export const AT_COOKIE = 'sw_at';
export const RT_COOKIE = 'sw_rt';

export function createAuthTokens(deps: Deps) {
  const { db, config } = deps;
  async function issue(user: { id: string; role: string }, client: 'web' | 'mobile', userAgent?: string) {
    const refreshToken = newRefreshToken();
    const sessionId = newId('ses');
    await db.insert(s.authSessions).values({ id: sessionId, userId: user.id, tokenHash: hashToken(refreshToken), client, userAgent: userAgent?.slice(0, 200) || null,
      expiresAt: new Date(Date.now() + config.REFRESH_TOKEN_DAYS * 864e5).toISOString() });
    const accessToken = await signAccess({ sub: user.id, role: user.role, sid: sessionId }, config.JWT_SECRET, config.ACCESS_TOKEN_TTL);
    return { accessToken, refreshToken, expiresIn: config.ACCESS_TOKEN_TTL, sessionId };
  }
  async function rotate(refreshToken: string) {
    const [sess] = await db.select().from(s.authSessions).where(and(eq(s.authSessions.tokenHash, hashToken(refreshToken)), isNull(s.authSessions.revokedAt), gt(s.authSessions.expiresAt, nowIso())));
    if (!sess) return null;
    const [user] = await db.select().from(s.users).where(eq(s.users.id, sess.userId));
    if (!user || user.status !== 'active') return null;
    const next = newRefreshToken();
    await db.update(s.authSessions).set({ tokenHash: hashToken(next), lastUsedAt: nowIso(), expiresAt: new Date(Date.now() + config.REFRESH_TOKEN_DAYS * 864e5).toISOString() }).where(eq(s.authSessions.id, sess.id));
    const accessToken = await signAccess({ sub: user.id, role: user.role, sid: sess.id }, config.JWT_SECRET, config.ACCESS_TOKEN_TTL);
    return { user, client: sess.client, tokens: { accessToken, refreshToken: next, expiresIn: config.ACCESS_TOKEN_TTL, sessionId: sess.id } };
  }
  async function revoke(sessionId: string) { await db.update(s.authSessions).set({ revokedAt: nowIso() }).where(eq(s.authSessions.id, sessionId)); }
  async function revokeAllFor(userId: string) { await db.update(s.authSessions).set({ revokedAt: nowIso() }).where(and(eq(s.authSessions.userId, userId), isNull(s.authSessions.revokedAt))); }

  function setCookies(reply: FastifyReply, t: { accessToken: string; refreshToken: string }) {
    const base = { httpOnly: true, sameSite: 'lax' as const, secure: config.cookieSecure, path: '/' };
    reply.setCookie(AT_COOKIE, t.accessToken, { ...base, maxAge: config.ACCESS_TOKEN_TTL });
    reply.setCookie(RT_COOKIE, t.refreshToken, { ...base, path: '/api', maxAge: config.REFRESH_TOKEN_DAYS * 86400 });
  }
  function clearCookies(reply: FastifyReply) {
    reply.clearCookie(AT_COOKIE, { path: '/' }); reply.clearCookie(RT_COOKIE, { path: '/api' });
  }
  return { issue, rotate, revoke, revokeAllFor, setCookies, clearCookies };
}
export type AuthTokens = ReturnType<typeof createAuthTokens>;

export default fp<{ deps: Deps; tokens: AuthTokens }>(async (app, { deps, tokens }) => {
  const { db, config } = deps;
  app.decorateRequest('user', null);

  async function resolve(req: FastifyRequest, reply: FastifyReply): Promise<AuthUser | null> {
    const header = req.headers.authorization;
    const bearer = header?.startsWith('Bearer ') ? header.slice(7) : null;
    let claims = await (bearer || req.cookies[AT_COOKIE] ? verifyAccess((bearer || req.cookies[AT_COOKIE]) as string, config.JWT_SECRET) : null);
    if (!claims && !bearer && req.cookies[RT_COOKIE]) {
      // web: silent refresh with the HttpOnly refresh cookie
      const r = await tokens.rotate(req.cookies[RT_COOKIE] as string);
      if (r) { tokens.setCookies(reply, r.tokens); claims = { sub: r.user.id, role: r.user.role, sid: r.tokens.sessionId }; }
    }
    if (!claims) return null;
    const [user] = await db.select().from(s.users).where(eq(s.users.id, claims.sub));
    if (!user || user.status !== 'active') return null;
    const [sess] = await db.select({ revokedAt: s.authSessions.revokedAt }).from(s.authSessions).where(eq(s.authSessions.id, claims.sid));
    if (!sess || sess.revokedAt) return null;
    return { ...user, sessionId: claims.sid };
  }

  app.addHook('preHandler', async (req, reply) => {
    const cfg = req.routeOptions.config || {};
    const usesCookies = !req.headers.authorization && !!(req.cookies[AT_COOKIE] || req.cookies[RT_COOKIE]);
    // CSRF: cookie-authenticated state-changing requests must come from our own origin
    if (usesCookies && !['GET', 'HEAD', 'OPTIONS'].includes(req.method) && req.headers.origin) {
      const allowed = config.PUBLIC_ORIGIN ? [new URL(config.PUBLIC_ORIGIN).host] : [req.headers.host];
      if (!allowed.includes(new URL(req.headers.origin).host)) throw new HttpError(403, 'Bad origin');
    }
    req.user = await resolve(req, reply);
    if (cfg.auth !== false && !req.user) throw new HttpError(401, 'Please sign in');
    if (cfg.roles && req.user && !cfg.roles.includes(req.user.role)) throw new HttpError(403, 'Not allowed');
  });
});
