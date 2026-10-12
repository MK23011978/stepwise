import { z } from 'zod';

const Env = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().default(3000),
  DATABASE_URL: z.string().optional(),
  JWT_SECRET: z.string().min(32).default('dev-only-secret-change-me-dev-only-secret'),
  ACCESS_TOKEN_TTL: z.coerce.number().default(15 * 60), // seconds
  REFRESH_TOKEN_DAYS: z.coerce.number().default(30),
  COOKIE_SECURE: z.enum(['true', 'false']).default('false'),
  PUBLIC_ORIGIN: z.string().optional(), // e.g. https://stepwise.example — enables strict origin checks
  STRIPE_SECRET_KEY: z.string().default(''),
  STRIPE_PUBLISHABLE_KEY: z.string().default(''),
  STRIPE_WEBHOOK_SECRET: z.string().default(''),
  REQUIRE_CARD_FOR_TRIAL: z.enum(['true', 'false']).default('true'),
  WEB_DIST: z.string().optional(), // built React app to serve (optional; can also be hosted separately)
});

export type Config = ReturnType<typeof loadConfig>;
export function loadConfig(env: NodeJS.ProcessEnv = process.env) {
  const e = Env.parse(env);
  // Render sets RENDER_EXTERNAL_URL (https://<service>.onrender.com) — use it when PUBLIC_ORIGIN isn't given.
  if (!e.PUBLIC_ORIGIN && env.RENDER_EXTERNAL_URL) e.PUBLIC_ORIGIN = env.RENDER_EXTERNAL_URL;
  if (e.NODE_ENV === 'production' && e.JWT_SECRET.startsWith('dev-only')) throw new Error('JWT_SECRET must be set in production');
  return {
    ...e,
    cookieSecure: e.COOKIE_SECURE === 'true' || e.NODE_ENV === 'production',
    stripeLive: !!(e.STRIPE_SECRET_KEY && e.STRIPE_PUBLISHABLE_KEY),
    requireCardForTrial: e.REQUIRE_CARD_FOR_TRIAL === 'true',
  };
}
