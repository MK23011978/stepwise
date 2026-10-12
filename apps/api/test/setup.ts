import { connectPglite } from '../src/db/client.js';
import { loadConfig } from '../src/core/config.js';
import { loadContent } from '../src/content/index.js';
import { buildExams } from '../src/modules/common/domain.js';
import { buildApp } from '../src/app.js';
import type { Deps } from '../src/core/deps.js';

export async function makeApp(env: Record<string, string> = {}) {
  const h = await connectPglite();
  await h.migrate();
  const config = loadConfig({ NODE_ENV: 'test', ...env } as NodeJS.ProcessEnv);
  const content = await loadContent(h.db); // imports the seed content into this fresh database
  const deps: Deps = { db: h.db, content, config, stripe: null, exams: buildExams(content) };
  const app = await buildApp(deps);
  await app.ready();
  return { app, deps, close: async () => { await app.close(); await h.close(); } };
}

// Minimal cookie-jar client around fastify.inject
export function client(app: Awaited<ReturnType<typeof makeApp>>['app']) {
  let jar: Record<string, string> = {};
  let bearer: string | null = null;
  const call = async (method: string, url: string, body?: unknown, expect = 200) => {
    const res = await app.inject({ method: method as never, url: `/api/v1${url}`, payload: body as never,
      headers: { cookie: Object.entries(jar).map(([k, v]) => `${k}=${v}`).join('; '), ...(bearer ? { authorization: `Bearer ${bearer}` } : {}) } });
    for (const c of res.cookies) { if (c.value) jar[c.name] = c.value; else delete jar[c.name]; }
    const json = res.body ? JSON.parse(res.body) : {};
    if (res.statusCode !== expect) throw new Error(`${method} ${url} → ${res.statusCode} ${res.body.slice(0, 300)}`);
    return json;
  };
  return { call, reset: () => { jar = {}; bearer = null; }, setBearer: (t: string | null) => { bearer = t; }, jar: () => jar };
}
