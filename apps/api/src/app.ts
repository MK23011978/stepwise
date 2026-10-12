import Fastify from 'fastify';
import cookie from '@fastify/cookie';
import rateLimit from '@fastify/rate-limit';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import { serializerCompiler, validatorCompiler, jsonSchemaTransform, hasZodFastifySchemaValidationErrors, type ZodTypeProvider } from 'fastify-type-provider-zod';
import { API_PREFIX } from '@stepwise/shared';
import type { Deps } from './core/deps.js';
import { HttpError } from './core/errors.js';
import authPlugin from './plugins/auth.js';
import { createServices } from './services.js';
import authRoutes from './modules/auth/auth.routes.js';
import billingRoutes from './modules/billing/billing.routes.js';
import contentRoutes from './modules/content.routes.js';
import studentRoutes from './modules/students.routes.js';
import learningRoutes from './modules/learning.routes.js';
import adminRoutes from './modules/admin/admin.routes.js';
import contentAdminRoutes from './modules/admin/content-admin.routes.js';
import socialRoutes from './modules/social.routes.js';
import schoolResultRoutes from './modules/school-results.routes.js';

export async function buildApp(deps: Deps, { logger = false }: { logger?: boolean } = {}) {
  const app = Fastify({ logger: logger ? { level: 'info' } : false, trustProxy: true, bodyLimit: 1_000_000 }).withTypeProvider<ZodTypeProvider>();
  app.setValidatorCompiler(validatorCompiler);
  app.setSerializerCompiler(serializerCompiler);
  const svc = createServices(deps);

  await app.register(cookie);
  await app.register(rateLimit, { global: false });
  await app.register(swagger, {
    openapi: {
      info: { title: 'Stepwise API', version: '1.0.0', description: 'GCSE learning platform API. Web clients authenticate with HttpOnly cookies; mobile clients send `Authorization: Bearer <accessToken>` and rotate with `/auth/refresh`.' },
      components: { securitySchemes: { bearer: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' }, cookie: { type: 'apiKey', in: 'cookie', name: 'sw_at' } } },
      security: [{ bearer: [] }, { cookie: [] }],
    },
    transform: jsonSchemaTransform,
  });
  await app.register(swaggerUi, { routePrefix: `${API_PREFIX}/docs` });

  app.setErrorHandler((err, req, reply) => {
    if (hasZodFastifySchemaValidationErrors(err)) {
      const first = err.validation[0];
      return reply.status(400).send({ error: first?.message || 'Invalid request', code: 'VALIDATION', issues: err.validation });
    }
    if (err instanceof HttpError) return reply.status(err.status).send({ error: err.message, ...(err.code ? { code: err.code } : {}) });
    const e = err as { statusCode?: number; message?: string };
    if (e.statusCode && e.statusCode < 500) return reply.status(e.statusCode).send({ error: e.message || 'Bad request' });
    req.log.error(err);
    return reply.status(500).send({ error: 'Something went wrong' });
  });

  await app.register(async (v1) => {
    await v1.register(authPlugin, { deps, tokens: svc.tokens });
    v1.addHook('onRequest', async () => { await deps.content.ensureFresh?.(); });
    v1.get('/health', { config: { auth: false }, schema: { hide: true } }, async () => ({ ok: true }));
    v1.get('/openapi.json', { config: { auth: false }, schema: { hide: true } }, async () => app.swagger());
    for (const r of [authRoutes, billingRoutes, contentRoutes, studentRoutes, learningRoutes, adminRoutes, contentAdminRoutes, socialRoutes, schoolResultRoutes]) await v1.register(r, { svc });
  }, { prefix: API_PREFIX });

  return app;
}
