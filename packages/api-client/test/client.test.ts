// The client against the real API (in-process), in both web-cookie and mobile-token modes.
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createApiClient, ApiError, type TokenStore } from '../src/index.js';
import { makeApp } from '../../../apps/api/test/setup.js';

let ctx: Awaited<ReturnType<typeof makeApp>>;
// fetch → fastify.inject bridge (keeps a cookie jar like a browser would)
function injectFetch(jar?: Record<string, string>): typeof fetch {
  return (async (url: string, init: RequestInit = {}) => {
    const res = await ctx.app.inject({ method: (init.method || 'GET') as never, url: String(url), payload: init.body as string,
      headers: { ...(init.headers as Record<string, string>), ...(jar ? { cookie: Object.entries(jar).map(([k, v]) => `${k}=${v}`).join('; ') } : {}) } });
    if (jar) for (const c of res.cookies) { if (c.value) jar[c.name] = c.value; else delete jar[c.name]; }
    return new Response(res.body, { status: res.statusCode, headers: { 'content-type': 'application/json' } });
  }) as typeof fetch;
}
beforeAll(async () => { ctx = await makeApp(); }, 180_000);
afterAll(async () => ctx?.close());

describe('@stepwise/api-client', () => {
  it('web mode: cookies carry the session', async () => {
    const jar: Record<string, string> = {};
    const api = createApiClient({ fetch: injectFetch(jar) });
    await api.auth.register({ name: 'Web Parent', email: 'web@example.test', password: 'longenough1' });
    expect((await api.auth.me()).user.email).toBe('web@example.test');
    const { child } = await api.family.addChild({ name: 'Kid', yearGroup: 8 });
    expect((await api.students.overview(child.id, 'maths')).subject).toBe('maths');
  });

  it('mobile mode: stores tokens, refreshes automatically after expiry, typed errors', async () => {
    let saved: Awaited<ReturnType<TokenStore['get']>> = null;
    const store: TokenStore = { get: async () => saved, set: async (t) => { saved = t; } };
    const api = createApiClient({ fetch: injectFetch(), auth: { kind: 'token', store } });
    await api.auth.login({ login: 'web@example.test', password: 'longenough1' });
    expect(saved?.refreshToken).toBeTruthy();
    saved = { ...saved!, accessToken: 'expired.or.invalid' }; // simulate an expired access token
    expect((await api.auth.me()).user.email).toBe('web@example.test'); // refreshed transparently
    await expect(api.lessons.get('nope')).rejects.toBeInstanceOf(ApiError);
    await api.auth.logout();
    expect(saved).toBeNull();
  });
});
