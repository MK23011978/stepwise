// Production / dev entrypoint. Stateless: all state lives in PostgreSQL, so Cloud Run can run many instances.
import Stripe from 'stripe';
import fs from 'node:fs';
import path from 'node:path';
import fastifyStatic from '@fastify/static';
import { loadConfig } from './core/config.js';
import { connectPg } from './db/client.js';
import { loadContent } from './content/index.js';
import { buildExams } from './modules/common/domain.js';
import { buildApp } from './app.js';
import { ensureAdmin } from './db/bootstrap.js';

const config = loadConfig();
const h = connectPg(config.DATABASE_URL);
if (process.env.RUN_MIGRATIONS === 'true') await h.migrate();
await ensureAdmin(h.db, process.env);
const content = await loadContent(h.db);
const stripe = config.stripeLive ? new Stripe(config.STRIPE_SECRET_KEY) : null;
const app = await buildApp({ db: h.db, content, config, stripe, exams: buildExams(content) }, { logger: true });

// Optionally serve the built React app (same origin → cookies just work). It can also be hosted separately (Firebase Hosting / CDN).
const webDist = config.WEB_DIST || path.resolve(process.cwd(), '../web/dist');
if (fs.existsSync(path.join(webDist, 'index.html'))) {
  await app.register(fastifyStatic, { root: webDist, prefix: '/', wildcard: true });
  app.setNotFoundHandler((req, reply) => (req.url.startsWith('/api/') ? reply.status(404).send({ error: 'Not found' }) : reply.sendFile('index.html')));
}

const close = async () => { await app.close(); await h.close(); process.exit(0); };
process.on('SIGTERM', close); process.on('SIGINT', close);
await app.listen({ port: config.PORT, host: '0.0.0.0' });
