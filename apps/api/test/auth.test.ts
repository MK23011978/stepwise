import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { makeApp, client } from './setup.js';

let ctx: Awaited<ReturnType<typeof makeApp>>;
beforeAll(async () => { ctx = await makeApp(); }, 120_000);
afterAll(async () => ctx?.close());

describe('stage 2 — auth', () => {
  it('registers a parent and keeps a web session in HttpOnly cookies', async () => {
    const c = client(ctx.app);
    await c.call('GET', '/me', undefined, 401);
    await c.call('POST', '/auth/register', { name: 'Ann', email: 'ann@example.test', password: 'short' }, 400);
    const r = await c.call('POST', '/auth/register', { name: 'Ann', email: 'ann@example.test', password: 'longenough1' });
    expect(r.user.role).toBe('parent');
    expect(r.tokens).toBeUndefined();
    expect(Object.keys(c.jar())).toEqual(expect.arrayContaining(['sw_at', 'sw_rt']));
    const me = await c.call('GET', '/me');
    expect(me.wallet.freeLessonAvailable).toBe(true);
    await c.call('POST', '/auth/register', { name: 'Ann', email: 'ANN@example.test', password: 'longenough1' }, 409);
  });

  it('silently refreshes a web session when the access cookie has expired', async () => {
    const c = client(ctx.app);
    await c.call('POST', '/auth/login', { login: 'ann@example.test', password: 'longenough1' });
    const jar = c.jar(); const rt = jar.sw_rt; delete jar.sw_at;
    const me = await c.call('GET', '/me');
    expect(me.user.email).toBe('ann@example.test');
    expect(c.jar().sw_rt).not.toBe(rt); // rotated
  });

  it('supports mobile clients with access + refresh tokens', async () => {
    const c = client(ctx.app);
    const r = await c.call('POST', '/auth/login', { login: 'ann@example.test', password: 'longenough1', client: 'mobile' });
    expect(r.tokens.accessToken).toBeTruthy(); expect(r.tokens.refreshToken).toBeTruthy();
    expect(Object.keys(c.jar())).toHaveLength(0);
    c.setBearer(r.tokens.accessToken);
    expect((await c.call('GET', '/me')).user.email).toBe('ann@example.test');
    const r2 = await c.call('POST', '/auth/refresh', { refreshToken: r.tokens.refreshToken });
    await c.call('POST', '/auth/refresh', { refreshToken: r.tokens.refreshToken }, 401); // old token no longer valid
    c.setBearer(r2.tokens.accessToken);
    await c.call('POST', '/auth/logout');
    await c.call('GET', '/me', undefined, 401); // session revoked → access token rejected
  });

  it('rejects wrong passwords and serves an OpenAPI document', async () => {
    const c = client(ctx.app);
    await c.call('POST', '/auth/login', { login: 'ann@example.test', password: 'nope-nope' }, 401);
    const doc = await c.call('GET', '/openapi.json');
    expect(doc.openapi).toMatch(/^3/);
    expect(Object.keys(doc.paths)).toContain('/api/v1/auth/login');
  });
});
