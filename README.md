# Stepwise — GCSE from Year 7 to Year 11 (v2)

A GCSE preparation platform for 9 subjects — Maths (Edexcel 1MA1), Biology, Chemistry, Physics, English Language,
English Literature, Computer Science, Geography and History (AQA): topic teaching pages, lessons with generated and
bank questions, spaced review and a mistakes bank, tests/checkpoints/mocks with step-by-step explanations, reports and
a personal roadmap, daily missions, a planner with parent-set tasks, rewards (coins, shop, badges, certificates,
parent goals, gift-card tickets), a family wallet at £1 per lesson with Stripe, and an admin console with a content editor.
(The v1 feature write-up is in `docs/README-v1.md`.)

## Architecture

```
apps/
  api/            Fastify + TypeScript API (/api/v1, OpenAPI UI at /api/v1/docs)
    src/modules/  route → service → repository layers per domain (auth, family, lessons, exams, review,
                  rewards, missions, tasks, report, gifts, billing, admin, content-admin)
    src/db/       Drizzle schema + migrations (PostgreSQL 16), legacy JSON importer
    src/content/  content service: reads banks/teaching pages from PostgreSQL, hot-reloads on change
  web/            React 19 + TypeScript + Vite, mobile-first, react-router + TanStack Query
packages/
  shared/         Zod schemas + types shared by API, web and the future React Native app
  api-client/     typed API client (web: HttpOnly cookies · mobile: access + refresh tokens)
  engine/         question generators (Maths + science/CS calculations) and answer checking — code
  content-seed/   initial question banks + teaching pages, imported into the database
legacy/           the v1 app (single-file server + UI), kept for reference and demo-data generation
```

- **Data:** PostgreSQL 16 (Cloud SQL in production). Relational core (parent → students → lessons, exams,
  payments…), JSONB for flexible payloads (generated questions, results, settings). Migrations with Drizzle Kit.
- **Stateless API:** sessions are signed JWT access tokens + refresh tokens stored hashed in `auth_sessions`; content
  is cached per instance and refreshed when `content_version` changes → safe to run many Cloud Run instances.
- **Auth:** web uses HttpOnly cookies with silent refresh; mobile sends `Authorization: Bearer` and rotates via
  `POST /api/v1/auth/refresh`.
- **Content:** generators stay in code (`packages/engine`); question banks and teaching pages live in the database and
  are editable in Admin → Curriculum → topic (validated: every item must mark its own answer correct).
- **Payments:** official Stripe SDKs (server `stripe`, client `@stripe/react-stripe-js`). Without keys: demo mode.

## Local development

```bash
npm install
npm run db:up                         # PostgreSQL 16 in Docker (localhost:5432)
export DATABASE_URL=postgres://stepwise:stepwise@localhost:5432/stepwise
npm run db:migrate                    # apply migrations
npm run db:seed                       # demo families + content (see Demo accounts)
npm run dev:api                       # API on :3000 (OpenAPI UI: http://localhost:3000/api/v1/docs)
npm run dev:web                       # web on :5173 (proxies /api to :3000)
npm test                              # API, API client, web and content validation tests
```

Migrate an existing v1 installation: `npm run db:import-legacy -w @stepwise/api -- ../../data/db.json`
(idempotent; passwords are preserved; users sign in again).

## Demo accounts (after `npm run db:seed`)

| Role    | Login                     | Password             |
|---------|---------------------------|----------------------|
| Admin   | `murat.kaplan@sampa.com`  | `12345678`           |
| Admin   | `admin@stepwise.test`     | `Admin#2026`         |
| Parent  | `parent@stepwise.test`    | `Parent#2026`        |
| Student | `emirhan` / `elif`        | `Student#2026`       |

Change these before deploying anywhere public.

## Deployment (Google Cloud)

`Dockerfile` builds one image (API + built web app, same origin). `deploy/cloudbuild.yaml` runs tests, builds and
pushes the image to Artifact Registry, runs migrations as a Cloud Run job, then deploys the Cloud Run service with
Cloud SQL and secrets from Secret Manager (`database-url`, `jwt-secret`, `stripe-*`). Required environment in
production: `DATABASE_URL`, `JWT_SECRET` (32+ chars), `NODE_ENV=production`; optional `STRIPE_*`, `PUBLIC_ORIGIN`.
Region: `europe-west2` (London).

## Mobile app (next step)

A React Native / Expo app can reuse `@stepwise/shared` and `@stepwise/api-client` as-is:
`createApiClient({ baseUrl: 'https://…', auth: { kind: 'token', store: secureStoreAdapter } })`.
