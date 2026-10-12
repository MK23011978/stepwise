# Stepwise — GCSE from Year 7 to Year 11

A complete GCSE preparation platform for **9 subjects** — Maths (Edexcel 1MA1), Biology, Chemistry, Physics,
English Language, English Literature, Computer Science, Geography and History (AQA) — from Year 7 (KS3
foundations) to Year 11. Topic explanation pages, lessons with endless questions, spaced review of past
questions and a mistakes bank, topic tests, termly checkpoints and full mocks with a step-by-step walkthrough of
every wrong answer, rewards (XP, levels, coins, shop, badges, certificates, free lessons, parent goals),
a family wallet at **£1 per lesson** with a £0 card check for the free trial, and an admin console.

Zero dependencies — just Node.js 18+.

```bash
npm run seed     # demo accounts + sample progress (wipes data/db.json)
npm start        # http://localhost:3000
npm test         # API end-to-end + subject validation + maths generator tests
```

## Demo accounts (created by `npm run seed`)

| Role    | Login                     | Password             |
|---------|---------------------------|----------------------|
| Admin   | `murat.kaplan@sampa.com`  | `12345678` |
| Admin   | `admin@stepwise.test`     | `Admin#2026`         |
| Parent  | `parent@stepwise.test`    | `Parent#2026`        |
| Student | `emirhan` (Year 9, all subjects) | `Student#2026` |
| Student | `elif` (Year 7)           | `Student#2026`       |
| Parent with free access | `sarah@example.test` | `Parent#2026` |

Change these (Settings → Change password) before deploying anywhere public. Create more admins with:

```bash
npm run create-admin -- --email you@example.com --name "Your Name" --password "min 8 chars"
```

## Content

| Subject | Board | Topics | Question styles |
|---|---|---|---|
| Maths | Edexcel 1MA1 | 83 | 373 (procedural — fresh numbers every time) |
| Biology / Chemistry / Physics | AQA 8461 / 8462 / 8463 | 16 each | 55–57 each |
| English Language / Literature | AQA 8700 / 8702 | 16 / 15 | 50 / 52 |
| Computer Science | AQA 8525 | 16 | 58 |
| Geography / History | AQA 8035 / 8145 | 16 / 15 | 51 / 51 |

Every topic has a teaching page (objectives, key words, step-by-step sections with worked examples, common
mistakes, exam tips). Bank-based styles have ≥ 15 questions each (multiple choice, multi-select, true/false,
ordering, short answer, numeric); calculation styles are generated.

## Key features

- **Lessons** (1 credit): explanation → worked example (spoken in Maths) → 10 questions + 2 interleaved review
  questions from earlier topics; 3 tries, hints, full explanation.
- **Review** (free): spaced repetition (1, 2, 4, 7, 15, 30, 60 days) plus a mistakes bank — every wrong or
  skipped answer, in lessons or exams, comes back until it's fixed.
- **Tests**: topic tests (15 Qs), Autumn/Spring checkpoints and End-of-Year exams per subject and year, full GCSE
  mocks. After submitting, every missed question is explained (your answer vs correct answer, key idea,
  step-by-step method, read aloud) with a similar question to try straight away.
- **Rewards**: XP & levels, coins, a shop (avatars, backgrounds, streak freezes), 22 badges, printable topic /
  year / exam certificates, a free lesson for every 10 completed lessons, parent-set goals with real rewards.
- **Report & Plan**: per-student progress report (predicted vs target grade per subject, pace, strengths, areas to
  improve, written comments) and a personal 6-week roadmap plus a timeline to the GCSE exams; printable.
- **Daily missions**: four missions a day (questions, a lesson, a focus subject, review / fix mistakes) with coins
  and a treasure-chest bonus for finishing all of them.
- **Planner & Tasks**: a calendar showing reviews due, planned lessons, tasks, completed work, exams and school
  dates; a task board (to do / in progress / waiting approval / done). Parents set tasks with coin rewards —
  one-off or repeating, custom (homework, reading) with parent approval, or linked to app work that completes
  itself. Students can add their own tasks.
- **Gift-card tickets**: children swap coins for a Roblox, App Store, Google Play, Minecraft, Fortnite, PlayStation,
  Xbox, Nintendo, Steam, Spotify or pocket-money ticket; the parent approves, buys the card themselves and can
  paste the code. Parents set the coin rate, monthly limit and allowed cards. Stepwise never sells cards.
- **Admin**: revenue & usage charts, user management (create, suspend, roles, credits, coins, password reset,
  delete) and **free access** — turn it on for any parent (whole family) or single student and their lessons
  and tests don't use credits.

## Payments (Stripe)

Without keys the app runs in **demo mode**: purchases and the trial card check are simulated, and no card form
is shown. To take real payments set:

```bash
export STRIPE_SECRET_KEY=sk_live_...        # or sk_test_...
export STRIPE_PUBLISHABLE_KEY=pk_live_...
export STRIPE_WEBHOOK_SECRET=whsec_...      # webhook endpoint: POST /api/billing/webhook (payment_intent.succeeded)
```

- **£0 card check for the free trial** — a Stripe SetupIntent confirmed with the Payment Element (Apple Pay,
  Link, cards). The card fingerprint is stored so one card can only claim one free lesson.
  `REQUIRE_CARD_FOR_TRIAL=false` turns the check off.
- **Credit packs** — PaymentIntents confirmed in the browser; credits are added on confirmation and by webhook.
- Card details go straight to Stripe and never reach this server.

## Files

| File | Purpose |
|------|---------|
| `server.js` | HTTP server, auth, API, pricing, Stripe, exams, review, rewards, admin |
| `db.js` | JSON file store (`data/db.json`) |
| `curriculum.js` | Maths topics, generators, SVG diagrams, answer checking |
| `content/` | Maths teaching pages (Y7, Y8–9, Y10–11) |
| `subjects/` | Other subjects (`<id>.js`), registry (`index.js`), item engine, validator |
| `docs/SUBJECT_FORMAT.md` | Format for adding or extending a subject |
| `public/` | Single-page app (`app.js`, `styles.css`) — light & dark, mobile-friendly |
| `seed.js`, `scripts/create-admin.js`, `test/` | Demo data, admin creation, tests |

**Before going live:** HTTPS (add `Secure` to the session cookie), a real database, Stripe live keys, email
verification and password reset by email, and a subject-expert review of the non-maths content.
