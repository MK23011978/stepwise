// Stepwise relational schema (PostgreSQL 16).
// Ownership: parent (users.role = 'parent') → wallet, payments, ledger
//            parent → students (student_profiles.parent_id) → progress, lessons, exams, tasks, rewards…
// Flexible payloads (generated questions, results, settings) live in JSONB.
import { sql } from 'drizzle-orm';
import {
  type AnyPgColumn, pgTable, pgEnum, text, integer, boolean, timestamp, date, jsonb, primaryKey, index, uniqueIndex,
} from 'drizzle-orm/pg-core';

const ts = (name: string) => timestamp(name, { withTimezone: true, mode: 'string' });
const createdAt = () => ts('created_at').notNull().defaultNow();

export const roleEnum = pgEnum('user_role', ['admin', 'parent', 'student']);
export const statusEnum = pgEnum('user_status', ['active', 'suspended']);
export const tierEnum = pgEnum('tier', ['F', 'H']);

// ---------- identity ----------
export const users = pgTable('users', {
  id: text('id').primaryKey(),
  role: roleEnum('role').notNull(),
  name: text('name').notNull(),
  email: text('email'),
  username: text('username'),
  // students belong to a parent; deleting the parent deletes the whole family
  parentId: text('parent_id').references((): AnyPgColumn => users.id, { onDelete: 'cascade' }),
  passwordHash: text('password_hash').notNull(), // "scrypt$<salt>$<hash>"
  status: statusEnum('status').notNull().default('active'),
  avatarColor: text('avatar_color').notNull().default('#3b6cf6'),
  freeAccess: boolean('free_access').notNull().default(false),
  createdAt: createdAt(),
  lastLoginAt: ts('last_login_at'),
  lastSeenAt: ts('last_seen_at'), // presence heartbeat — "online" = seen in the last 90 seconds
}, (t) => [
  uniqueIndex('users_email_uq').on(sql`lower(${t.email})`),
  uniqueIndex('users_username_uq').on(sql`lower(${t.username})`),
  index('users_role_idx').on(t.role),
  index('users_parent_idx').on(t.parentId),
]);

// Refresh tokens / web sessions. Access tokens are stateless JWTs; this table makes refresh + logout + revoke possible.
export const authSessions = pgTable('auth_sessions', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  tokenHash: text('token_hash').notNull(),
  client: text('client').notNull().default('web'), // web | mobile
  userAgent: text('user_agent'),
  createdAt: createdAt(),
  lastUsedAt: ts('last_used_at'),
  expiresAt: ts('expires_at').notNull(),
  revokedAt: ts('revoked_at'),
}, (t) => [uniqueIndex('auth_sessions_token_uq').on(t.tokenHash), index('auth_sessions_user_idx').on(t.userId)]);

// ---------- family wallet (one per parent) ----------
export const wallets = pgTable('wallets', {
  parentId: text('parent_id').primaryKey().references(() => users.id, { onDelete: 'cascade' }),
  credits: integer('credits').notNull().default(0),
  freeLessonUsed: boolean('free_lesson_used').notNull().default(false),
  cardVerified: boolean('card_verified').notNull().default(false),
  cardBrand: text('card_brand'),
  cardLast4: text('card_last4'),
  cardFingerprint: text('card_fingerprint'),
  cardVerifiedAt: ts('card_verified_at'),
  stripeCustomerId: text('stripe_customer_id'),
}, (t) => [index('wallets_fingerprint_idx').on(t.cardFingerprint)]);

export const payments = pgTable('payments', {
  id: text('id').primaryKey(),
  parentId: text('parent_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  packId: text('pack_id').notNull(),
  label: text('label').notNull(),
  amountPence: integer('amount_pence').notNull(),
  currency: text('currency').notNull().default('GBP'),
  credits: integer('credits').notNull(),
  provider: text('provider').notNull(), // stripe | simulated
  providerRef: text('provider_ref'),
  status: text('status').notNull(),
  createdAt: createdAt(),
}, (t) => [index('payments_parent_idx').on(t.parentId), uniqueIndex('payments_provider_ref_uq').on(t.providerRef)]);

export const creditLedger = pgTable('credit_ledger', {
  id: text('id').primaryKey(),
  parentId: text('parent_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  delta: integer('delta').notNull(),
  balance: integer('balance').notNull(),
  reason: text('reason').notNull(),
  byUserId: text('by_user_id'),
  createdAt: createdAt(),
}, (t) => [index('ledger_parent_idx').on(t.parentId, t.createdAt)]);

// ---------- student ----------
export const studentProfiles = pgTable('student_profiles', {
  userId: text('user_id').primaryKey().references(() => users.id, { onDelete: 'cascade' }),
  yearGroup: integer('year_group').notNull(),
  tier: tierEnum('tier').notNull().default('H'),
  targetGrade: integer('target_grade').notNull().default(7),
  targets: jsonb('targets').$type<Record<string, number>>().notNull().default({}),
  subjects: text('subjects').array().notNull().default(sql`'{}'::text[]`),
  xp: integer('xp').notNull().default(0),
  coins: integer('coins').notNull().default(0),
  lastLevel: integer('last_level').notNull().default(1),
  milestones: integer('milestones').notNull().default(0),
  mistakesFixed: integer('mistakes_fixed').notNull().default(0),
  freezes: integer('freezes').notNull().default(0),
  frozenDays: jsonb('frozen_days').$type<string[]>().notNull().default([]),
  fixedLog: jsonb('fixed_log').$type<Record<string, number>>().notNull().default({}),
  badges: jsonb('badges').$type<Record<string, string>>().notNull().default({}),
  owned: jsonb('owned').$type<string[]>().notNull().default([]),
  equipped: jsonb('equipped').$type<Record<string, string | null>>().notNull().default({}),
  giftSettings: jsonb('gift_settings').$type<Record<string, unknown> | null>(),
  // social controls (parent-managed)
  showOnline: boolean('show_online').notNull().default(true),
  chatEnabled: boolean('chat_enabled').notNull().default(true),
});

export const styleProgress = pgTable('style_progress', {
  studentId: text('student_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  styleId: text('style_id').notNull(),
  done: integer('done').notNull().default(0),
  correct: integer('correct').notNull().default(0),
  incorrect: integer('incorrect').notNull().default(0),
  skipped: integer('skipped').notNull().default(0),
  lastAt: ts('last_at'),
}, (t) => [primaryKey({ columns: [t.studentId, t.styleId] })]);

export const dailyActivity = pgTable('daily_activity', {
  studentId: text('student_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  day: date('day', { mode: 'string' }).notNull(),
  questions: integer('questions').notNull().default(0),
}, (t) => [primaryKey({ columns: [t.studentId, t.day] })]);

export const reviewSchedule = pgTable('review_schedule', {
  studentId: text('student_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  styleId: text('style_id').notNull(),
  box: integer('box').notNull(),
  due: date('due', { mode: 'string' }).notNull(),
  lastAt: ts('last_at'),
}, (t) => [primaryKey({ columns: [t.studentId, t.styleId] }), index('review_due_idx').on(t.studentId, t.due)]);

export const mistakes = pgTable('mistakes', {
  id: text('id').primaryKey(),
  studentId: text('student_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  styleId: text('style_id').notNull(),
  question: jsonb('question').notNull(),
  source: text('source').notNull(),
  tries: integer('tries').notNull().default(0),
  createdAt: createdAt(),
}, (t) => [index('mistakes_student_idx').on(t.studentId, t.createdAt)]);

// ---------- learning sessions ----------
export const lessons = pgTable('lessons', {
  id: text('id').primaryKey(),
  studentId: text('student_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  kind: text('kind').notNull().default('lesson'), // lesson | review
  styleId: text('style_id'),
  topicId: text('topic_id'),
  status: text('status').notNull(), // active | completed
  free: boolean('free').notNull().default(false),
  example: jsonb('example'),
  questions: jsonb('questions').notNull().default([]),
  results: jsonb('results').notNull().default([]),
  idx: integer('idx').notNull().default(0),
  xp: integer('xp').notNull().default(0),
  bonus: integer('bonus').notNull().default(0),
  createdAt: createdAt(),
  completedAt: ts('completed_at'),
}, (t) => [index('lessons_student_idx').on(t.studentId, t.createdAt), index('lessons_active_idx').on(t.studentId, t.status)]);

export const examAttempts = pgTable('exam_attempts', {
  id: text('id').primaryKey(),
  studentId: text('student_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  examId: text('exam_id').notNull(),
  subject: text('subject').notNull().default('maths'),
  kind: text('kind').notNull(),
  name: text('name').notNull(),
  tier: tierEnum('tier'),
  startedAt: ts('started_at').notNull(),
  deadline: ts('deadline').notNull(),
  submittedAt: ts('submitted_at'),
  questions: jsonb('questions').notNull(),
  answers: jsonb('answers'),
  marked: jsonb('marked'),
  score: integer('score'),
  max: integer('max'),
  pct: integer('pct'),
  grade: text('grade'),
  byStrand: jsonb('by_strand'),
  similar: jsonb('similar'),
  xp: integer('xp'),
  late: boolean('late').notNull().default(false),
}, (t) => [index('exams_student_idx').on(t.studentId, t.submittedAt)]);

// ---------- rewards ----------
export const certificates = pgTable('certificates', {
  id: text('id').primaryKey(),
  studentId: text('student_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  key: text('key').notNull(),
  kind: text('kind').notNull(),
  title: text('title').notNull(),
  subtitle: text('subtitle'),
  createdAt: createdAt(),
}, (t) => [uniqueIndex('certificates_key_uq').on(t.studentId, t.key)]);

export const notifications = pgTable('notifications', {
  id: text('id').primaryKey(),
  studentId: text('student_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  type: text('type').notNull(),
  title: text('title').notNull(),
  text: text('text'),
  icon: text('icon'),
  meta: jsonb('meta').notNull().default({}),
  seen: boolean('seen').notNull().default(false),
  createdAt: createdAt(),
}, (t) => [index('notifications_student_idx').on(t.studentId, t.createdAt)]);

export const goals = pgTable('goals', {
  id: text('id').primaryKey(),
  studentId: text('student_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  type: text('type').notNull(),
  target: integer('target').notNull(),
  reward: text('reward').notNull(),
  baseline: integer('baseline').notNull().default(0),
  createdBy: text('created_by'),
  createdAt: createdAt(),
  achievedAt: ts('achieved_at'),
  deliveredAt: ts('delivered_at'),
}, (t) => [index('goals_student_idx').on(t.studentId)]);

export const dailyMissions = pgTable('daily_missions', {
  studentId: text('student_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  day: date('day', { mode: 'string' }).notNull(),
  missions: jsonb('missions').notNull(),
  claimed: jsonb('claimed').$type<Record<string, string>>().notNull().default({}),
  bonusClaimed: boolean('bonus_claimed').notNull().default(false),
}, (t) => [primaryKey({ columns: [t.studentId, t.day] })]);

export const giftTickets = pgTable('gift_tickets', {
  id: text('id').primaryKey(),
  studentId: text('student_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  parentId: text('parent_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  cardId: text('card_id').notNull(),
  cardName: text('card_name').notNull(),
  icon: text('icon'),
  valuePounds: integer('value_pounds').notNull(),
  coins: integer('coins').notNull(),
  status: text('status').notNull(), // pending | approved | delivered | declined | cancelled
  note: text('note'),
  reply: text('reply'),
  code: text('code'),
  createdAt: createdAt(),
  approvedAt: ts('approved_at'),
  deliveredAt: ts('delivered_at'),
}, (t) => [index('tickets_parent_idx').on(t.parentId, t.status), index('tickets_student_idx').on(t.studentId)]);

// ---------- planner ----------
export const tasks = pgTable('tasks', {
  id: text('id').primaryKey(),
  studentId: text('student_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  createdBy: text('created_by'),
  createdByRole: text('created_by_role').notNull(),
  title: text('title').notNull(),
  notes: text('notes').notNull().default(''),
  kind: text('kind').notNull().default('custom'), // custom | lesson | topic | review | test
  subject: text('subject'),
  ref: text('ref'),
  dueDate: date('due_date', { mode: 'string' }).notNull(),
  dueTime: text('due_time').notNull().default(''),
  recurrence: text('recurrence').notNull().default('none'), // none | daily | weekdays | weekly
  until: date('until', { mode: 'string' }),
  priority: text('priority').notNull().default('normal'),
  status: text('status').notNull().default('todo'),
  coins: integer('coins').notNull().default(0),
  requiresApproval: boolean('requires_approval').notNull().default(false),
  createdAt: createdAt(),
}, (t) => [index('tasks_student_idx').on(t.studentId, t.dueDate)]);

export const taskCompletions = pgTable('task_completions', {
  taskId: text('task_id').notNull().references(() => tasks.id, { onDelete: 'cascade' }),
  day: date('day', { mode: 'string' }).notNull(),
  completedAt: ts('completed_at').notNull(),
  approvedAt: ts('approved_at'),
}, (t) => [primaryKey({ columns: [t.taskId, t.day] })]);

// ---------- friends & chat (students only; every friendship needs both parents' approval) ----------
// a_id < b_id so a pair has exactly one row. status: pending (waiting for the other student) → approval (waiting for parents) → active;
// or declined / blocked. a_parent_ok / b_parent_ok record each parent's approval.
export const friendships = pgTable('friendships', {
  id: text('id').primaryKey(),
  aId: text('a_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  bId: text('b_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  requestedBy: text('requested_by').notNull(),
  status: text('status').notNull(),
  aParentOk: boolean('a_parent_ok').notNull().default(false),
  bParentOk: boolean('b_parent_ok').notNull().default(false),
  blockedBy: text('blocked_by'),
  aReadAt: ts('a_read_at'),
  bReadAt: ts('b_read_at'),
  lastMessageAt: ts('last_message_at'),
  createdAt: createdAt(),
  updatedAt: ts('updated_at'),
}, (t) => [uniqueIndex('friendships_pair_uq').on(t.aId, t.bId), index('friendships_b_idx').on(t.bId)]);

export const chatMessages = pgTable('chat_messages', {
  id: text('id').primaryKey(),
  friendshipId: text('friendship_id').notNull().references(() => friendships.id, { onDelete: 'cascade' }),
  senderId: text('sender_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  body: text('body').notNull(),
  filtered: boolean('filtered').notNull().default(false), // personal details / bad words were masked
  kind: text('kind').notNull().default('text'), // text | question
  refId: text('ref_id'), // shared_questions.id for kind = question
  createdAt: createdAt(),
}, (t) => [index('chat_messages_thread_idx').on(t.friendshipId, t.createdAt)]);

// "Solve together": a generated question shared in a chat. The answer never leaves the server until a student has finished.
export const sharedQuestions = pgTable('shared_questions', {
  id: text('id').primaryKey(),
  friendshipId: text('friendship_id').notNull().references(() => friendships.id, { onDelete: 'cascade' }),
  sharedBy: text('shared_by').notNull().references(() => users.id, { onDelete: 'cascade' }),
  styleId: text('style_id').notNull(),
  question: jsonb('question').notNull(),
  attempts: jsonb('attempts').$type<Record<string, { tries: number; correct: boolean; input: string; at: string }>>().notNull().default({}),
  createdAt: createdAt(),
}, (t) => [index('shared_questions_friendship_idx').on(t.friendshipId)]);

export const chatReports = pgTable('chat_reports', {
  id: text('id').primaryKey(),
  friendshipId: text('friendship_id').notNull().references(() => friendships.id, { onDelete: 'cascade' }),
  messageId: text('message_id'),
  reporterId: text('reporter_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  reason: text('reason').notNull(),
  status: text('status').notNull().default('open'), // open | closed
  createdAt: createdAt(),
  closedAt: ts('closed_at'),
}, (t) => [index('chat_reports_status_idx').on(t.status, t.createdAt)]);

// ---------- platform ----------
export const auditLog = pgTable('audit_log', {
  id: text('id').primaryKey(),
  actorId: text('actor_id'),
  actorName: text('actor_name').notNull(),
  action: text('action').notNull(),
  detail: text('detail'),
  createdAt: createdAt(),
}, (t) => [index('audit_created_idx').on(t.createdAt)]);

// ---------- content (stage 3: banks + teaching pages live in the database) ----------
export const subjects = pgTable('subjects', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  board: text('board').notNull(),
  spec: text('spec'),
  color: text('color').notNull(),
  icon: text('icon').notNull(),
  tiers: boolean('tiers').notNull().default(false),
  sortOrder: integer('sort_order').notNull().default(0),
});

export const strands = pgTable('strands', {
  id: text('id').primaryKey(),
  subjectId: text('subject_id').notNull().references(() => subjects.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  color: text('color').notNull(),
  icon: text('icon'),
  sortOrder: integer('sort_order').notNull().default(0),
});

export const topics = pgTable('topics', {
  id: text('id').primaryKey(),
  subjectId: text('subject_id').notNull().references(() => subjects.id, { onDelete: 'cascade' }),
  strandId: text('strand_id').notNull().references(() => strands.id),
  year: integer('year').notNull(),
  term: integer('term').notNull(),
  tier: text('tier').notNull().default('FH'),
  name: text('name').notNull(),
  summary: text('summary'),
  specRef: text('spec_ref'),
  sortOrder: integer('sort_order').notNull().default(0),
  published: boolean('published').notNull().default(true),
}, (t) => [index('topics_subject_idx').on(t.subjectId, t.year, t.term)]);

export const styles = pgTable('styles', {
  id: text('id').primaryKey(),
  topicId: text('topic_id').notNull().references(() => topics.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  intro: text('intro').notNull(),
  source: text('source').notNull(), // 'generator' (algorithm in code) | 'bank' (items table)
  generatorKey: text('generator_key'),
  sortOrder: integer('sort_order').notNull().default(0),
}, (t) => [index('styles_topic_idx').on(t.topicId)]);

export const items = pgTable('items', {
  id: text('id').primaryKey(),
  styleId: text('style_id').notNull().references(() => styles.id, { onDelete: 'cascade' }),
  type: text('type').notNull(), // mcq | multi | tf | short | number | order
  body: jsonb('body').notNull(), // the full item payload
  active: boolean('active').notNull().default(true),
  sortOrder: integer('sort_order').notNull().default(0),
  updatedAt: ts('updated_at').notNull().defaultNow(),
}, (t) => [index('items_style_idx').on(t.styleId)]);

export const learnPages = pgTable('learn_pages', {
  topicId: text('topic_id').primaryKey().references(() => topics.id, { onDelete: 'cascade' }),
  content: jsonb('content').notNull(),
  updatedAt: ts('updated_at').notNull().defaultNow(),
});

// bumped on every content change so stateless API instances can refresh their in-memory content cache
export const contentVersion = pgTable('content_version', {
  id: integer('id').primaryKey().default(1),
  version: integer('version').notNull().default(1),
  updatedAt: ts('updated_at').notNull().defaultNow(),
});

