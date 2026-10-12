// Two app instances on one database behave as one service (what Cloud Run does with multiple copies).
import { describe, it, expect } from 'vitest';
import { connectPglite } from '../src/db/client.js';
import { loadConfig } from '../src/core/config.js';
import { loadLegacyContent } from '../src/content/legacy.js';
import { buildExams } from '../src/modules/common/domain.js';
import { buildApp } from '../src/app.js';

describe('stage 2 — stateless instances', () => {
  it('a session created on instance A works on instance B, and logout on B revokes it on A', async () => {
    const h = await connectPglite(); await h.migrate();
    const content = loadLegacyContent();
    const deps = { db: h.db, content, config: loadConfig({ NODE_ENV: 'test' } as NodeJS.ProcessEnv), stripe: null, exams: buildExams(content) };
    const a = await buildApp(deps); const b = await buildApp(deps);
    const reg = await a.inject({ method: 'POST', url: '/api/v1/auth/register', payload: { name: 'X', email: 'x@example.test', password: 'longenough1', client: 'mobile' } });
    const { accessToken } = reg.json().tokens;
    const auth = { authorization: `Bearer ${accessToken}` };
    expect((await b.inject({ method: 'GET', url: '/api/v1/me', headers: auth })).statusCode).toBe(200);
    expect((await b.inject({ method: 'POST', url: '/api/v1/auth/logout', headers: auth })).statusCode).toBe(200);
    expect((await a.inject({ method: 'GET', url: '/api/v1/me', headers: auth })).statusCode).toBe(401);
    await a.close(); await b.close(); await h.close();
  });
});
