// Shared contract between the API, the web app and (later) the React Native app.
// Request bodies are validated with these schemas on the server, and the same types are used by the API client.
import { z } from 'zod';

export const API_PREFIX = '/api/v1';

// ---------- enums ----------
export const Role = z.enum(['admin', 'parent', 'student']);
export const Tier = z.enum(['F', 'H']);
export const ClientKind = z.enum(['web', 'mobile']);
export const YearGroup = z.coerce.number().int().min(7).max(11);
export const Grade = z.coerce.number().int().min(1).max(9);
export const IsoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Use YYYY-MM-DD');
export type Role = z.infer<typeof Role>;

const password = z.string().min(8, 'Password must be at least 8 characters').max(200);
const email = z.string().trim().toLowerCase().email('Please enter a valid email').max(160);
const name = z.string().trim().min(1, 'Please enter a name').max(80);
const username = z.string().trim().toLowerCase().regex(/^[a-z0-9._-]{3,30}$/, 'Username: 3–30 letters, numbers, dot, dash or underscore');

// ---------- auth ----------
export const RegisterBody = z.object({ name, email, password, client: ClientKind.default('web') });
export const LoginBody = z.object({ login: z.string().trim().toLowerCase().min(1).max(160), password: z.string().min(1).max(200), client: ClientKind.default('web') });
export const RefreshBody = z.object({ refreshToken: z.string().min(20).optional() });
export const UpdateMeBody = z.object({ name: name.optional(), currentPassword: z.string().optional(), newPassword: password.optional() });
export const TokenPair = z.object({ accessToken: z.string(), refreshToken: z.string(), expiresIn: z.number() });
export type TokenPairT = z.infer<typeof TokenPair>;

// ---------- family ----------
export const ChildBody = z.object({
  name, yearGroup: YearGroup, tier: Tier.default('H'), targetGrade: Grade.default(7),
  subjects: z.array(z.string()).optional(), targets: z.record(z.string(), Grade).optional(),
  username: username.optional().or(z.literal('').transform(() => undefined)),
  password: password.optional().or(z.literal('').transform(() => undefined)),
  parentId: z.string().optional(), // admin only
});
export const ChildPatch = ChildBody.partial().omit({ parentId: true });
export const YearGroupBody = z.object({ yearGroup: YearGroup });

// ---------- learning ----------
export const StartLessonBody = z.object({ studentId: z.string(), styleId: z.string() });
export const StartReviewBody = z.object({ studentId: z.string(), mode: z.enum(['mixed', 'mistakes']).optional(), mistakeId: z.string().optional() });
export const AnswerBody = z.object({ input: z.string().trim().min(1, 'Type an answer first').max(200) });
export const StartExamBody = z.object({ studentId: z.string(), examId: z.string() });
export const SubmitExamBody = z.object({ answers: z.array(z.string().max(200).nullable()).max(100) });
export const SubjectQuery = z.object({ subject: z.string().optional() });

// ---------- rewards & planner ----------
export const ShopBody = z.object({ itemId: z.string(), action: z.enum(['buy', 'equip']).default('buy') });
export const GoalBody = z.object({ type: z.enum(['lessons', 'mastered', 'xp', 'streak', 'grade', 'reviews']), target: z.coerce.number().int().min(1).max(100000), reward: z.string().trim().min(1, 'Describe the reward').max(120) });
export const GoalPatch = z.object({ delivered: z.boolean().optional() });
export const ClaimMissionBody = z.object({ missionId: z.string().optional() });
export const TaskKind = z.enum(['custom', 'lesson', 'topic', 'review', 'test']);
export const Recurrence = z.enum(['none', 'daily', 'weekdays', 'weekly']);
export const TaskBody = z.object({
  title: z.string().trim().min(1, 'Give the task a title').max(120),
  notes: z.string().max(500).default(''),
  kind: TaskKind.default('custom'),
  subject: z.string().nullish(),
  ref: z.string().max(80).nullish(),
  dueDate: IsoDate.optional(),
  dueTime: z.string().regex(/^(\d{2}:\d{2})?$/).default(''),
  recurrence: Recurrence.default('none'),
  until: IsoDate.nullish().or(z.literal('')),
  priority: z.enum(['low', 'normal', 'high']).default('normal'),
  coins: z.coerce.number().int().min(0).max(500).default(0),
  requiresApproval: z.coerce.boolean().default(false),
});
export const TaskPatch = TaskBody.partial().extend({ status: z.enum(['todo', 'doing']).optional() });
export const TaskCompleteBody = z.object({ date: IsoDate.optional() });
export const TaskApproveBody = z.object({ date: IsoDate.optional(), reject: z.boolean().optional(), note: z.string().max(200).optional() });
export const CalendarQuery = z.object({ from: IsoDate.optional(), to: IsoDate.optional() });
export const GiftRequestBody = z.object({ cardId: z.string(), value: z.coerce.number().int().positive(), note: z.string().max(140).default('') });
export const GiftActionBody = z.object({ action: z.enum(['approve', 'decline', 'deliver', 'cancel']), reply: z.string().max(200).default(''), code: z.string().max(80).default('') });
export const GiftSettingsBody = z.object({ enabled: z.boolean(), coinsPerPound: z.coerce.number().int().min(50).max(5000), monthlyLimit: z.coerce.number().int().min(0).max(200), allowed: z.array(z.string()) });

// ---------- friends & chat ----------
export const FriendRequestBody = z.object({ userId: z.string().optional(), username: z.string().trim().toLowerCase().max(30).optional() })
  .refine((b) => !!(b.userId || b.username), 'Choose a student or type their username');
export const ChatMessageBody = z.object({ body: z.string().trim().min(1, 'Type a message').max(500, 'Messages can be up to 500 characters') });
export const ShareQuestionBody = z.object({ styleId: z.string().optional(), topicId: z.string().optional(), subject: z.string().optional() });
export const SharedAnswerBody = z.object({ input: z.string().trim().min(1, 'Type an answer first').max(200) });
export const ChatQuery = z.object({ after: z.string().optional() });
export const ChatReportBody = z.object({ reason: z.string().trim().min(3, 'Tell us what happened').max(300), messageId: z.string().optional() });
export const FriendApproveBody = z.object({ approve: z.boolean() });
export const SocialSettingsBody = z.object({ showOnline: z.boolean().optional(), chatEnabled: z.boolean().optional() });
export const ReportPatchBody = z.object({ status: z.enum(['open', 'closed']) });

// ---------- school results ----------
export const SchoolResultBody = z.object({
  subject: z.string().min(1).max(40),
  title: z.string().trim().min(1, 'Name the test, e.g. Autumn assessment').max(120),
  unit: z.string().max(40).nullish(),
  takenOn: IsoDate,
  score: z.coerce.number().min(0, 'Score can’t be negative').max(10000),
  maxScore: z.coerce.number().positive('Out of must be more than 0').max(10000),
  grade: z.string().trim().max(20).nullish(),
  targetGrade: z.string().trim().max(20).nullish(),
  notes: z.string().trim().max(500).nullish(),
}).refine((b) => b.score <= b.maxScore, { message: 'Score can’t be more than the total', path: ['score'] });
export const SchoolResultPatch = z.object({
  subject: z.string().min(1).max(40).optional(), title: z.string().trim().min(1).max(120).optional(), unit: z.string().max(40).nullish(), takenOn: IsoDate.optional(),
  score: z.coerce.number().min(0).max(10000).optional(), maxScore: z.coerce.number().positive().max(10000).optional(),
  grade: z.string().trim().max(20).nullish(), targetGrade: z.string().trim().max(20).nullish(), notes: z.string().trim().max(500).nullish(),
});

// ---------- reading & vocabulary ----------
export const ReadingGoalBody = z.object({ dailyMinutes: z.coerce.number().int().min(5).max(180), dailyWords: z.coerce.number().int().min(0).max(20) });
export const ShelfAddBody = z.object({ bookId: z.string().max(80).optional(), title: z.string().trim().min(1).max(160).optional(), author: z.string().trim().max(120).optional(), totalPages: z.coerce.number().int().min(1).max(5000).optional() })
  .refine((b) => !!(b.bookId || b.title), 'Choose a book or type its title');
export const ShelfPatchBody = z.object({ status: z.enum(['reading', 'finished', 'paused']).optional(), summary: z.string().trim().max(3000).optional(), rating: z.coerce.number().int().min(1).max(5).optional(), totalPages: z.coerce.number().int().min(1).max(5000).optional() });
export const ReadingLogBody = z.object({
  shelfId: z.string(), minutes: z.coerce.number().int().min(1, 'How many minutes did you read?').max(600), toPage: z.coerce.number().int().min(0).max(5000).optional(),
  summary: z.string().trim().min(30, 'Write at least a couple of sentences about what you read (30+ characters)').max(2000), day: IsoDate.optional(),
});
export const VocabAddBody = z.object({ word: z.string().trim().min(1).max(60), meaning: z.string().trim().min(2, 'Write what the word means').max(300), example: z.string().trim().max(300).optional(), shelfId: z.string().optional(), bookId: z.string().optional() });
export const VocabAnswerBody = z.object({ mode: z.enum(['meaning', 'spell']), answer: z.string().trim().min(1).max(300) });

// ---------- billing ----------
export const PackBody = z.object({ packId: z.string() });
export const VerifyCardBody = z.object({ setupIntentId: z.string().optional(), demo: z.boolean().optional() });
export const ConfirmPaymentBody = z.object({ paymentIntentId: z.string() });

// ---------- admin ----------
export const AdminCreateUserBody = z.object({ name, email, password, role: z.enum(['admin', 'parent']).default('parent'), freeAccess: z.boolean().default(false) });
export const AdminPatchUserBody = z.object({
  status: z.enum(['active', 'suspended']).optional(), role: z.enum(['admin', 'parent']).optional(), freeAccess: z.boolean().optional(), name: name.optional(),
  yearGroup: YearGroup.optional(), tier: Tier.optional(), targetGrade: Grade.optional(), username: username.optional(),
  creditDelta: z.coerce.number().int().optional(), coinDelta: z.coerce.number().int().optional(), reason: z.string().max(120).optional(), resetFreeLesson: z.boolean().optional(),
});
export const AdminPasswordBody = z.object({ password });

// ---------- common responses ----------
export const ErrorResponse = z.object({ error: z.string(), code: z.string().optional(), issues: z.array(z.any()).optional() });
export const Ok = z.object({ ok: z.literal(true) });

export const PublicUser = z.object({
  id: z.string(), role: Role, name: z.string(), email: z.string().nullable(), username: z.string().nullable(), parentId: z.string().nullable(),
  status: z.enum(['active', 'suspended']), avatarColor: z.string(), freeAccess: z.boolean(), createdAt: z.string(), lastLoginAt: z.string().nullable(),
  // student fields
  yearGroup: z.number().optional(), tier: Tier.optional(), targetGrade: z.number().optional(), targets: z.record(z.string(), z.number()).optional(),
  subjects: z.array(z.string()).optional(), xp: z.number().optional(), coins: z.number().optional(), mistakesFixed: z.number().optional(),
  equipped: z.record(z.string(), z.string().nullable()).optional(),
}).passthrough();
export type PublicUser = z.infer<typeof PublicUser>;

export const Wallet = z.object({ credits: z.number(), freeLessonAvailable: z.boolean(), freeAccess: z.boolean(), cardVerified: z.boolean(), cardCheckRequired: z.boolean() });
export const MeResponse = z.object({ user: PublicUser, children: z.array(PublicUser), wallet: Wallet.nullable() });
export const AuthResponse = z.object({ user: PublicUser, tokens: TokenPair.optional() });

export const Question = z.object({
  html: z.string(), diagram: z.string().nullable().optional(), answerLabel: z.string().optional(), unit: z.string().optional(), format: z.string().optional(),
  options: z.array(z.string()).optional(), multi: z.boolean().optional(), ordering: z.boolean().optional(),
}).passthrough();
export type Question = z.infer<typeof Question>;

// Loose schema for rich, evolving payloads (documented as objects in OpenAPI)
export const AnyObject = z.record(z.string(), z.any());

export type RegisterBody = z.infer<typeof RegisterBody>;
export type LoginBody = z.infer<typeof LoginBody>;
export type ChildBody = z.infer<typeof ChildBody>;
export type TaskBody = z.infer<typeof TaskBody>;
export type MeResponse = z.infer<typeof MeResponse>;

// ---------- content management (question banks & teaching pages live in the database) ----------
const html = z.string().min(1).max(20000);
const itemBase = { q: html, explain: z.string().min(1).max(5000), hint: z.string().max(1000).optional(), diagram: z.string().max(20000).optional() };
export const BankItem = z.discriminatedUnion('type', [
  z.object({ type: z.literal('mcq'), options: z.array(html).min(2).max(8), correct: z.number().int().min(0), ...itemBase }),
  z.object({ type: z.literal('multi'), options: z.array(html).min(3).max(8), correct: z.array(z.number().int().min(0)).min(2), ...itemBase }),
  z.object({ type: z.literal('tf'), correct: z.boolean(), ...itemBase }),
  z.object({ type: z.literal('short'), answer: z.string().optional(), accept: z.array(z.string()).optional(), keywords: z.array(z.array(z.string())).optional(), format: z.string().optional(), ...itemBase }),
  z.object({ type: z.literal('number'), value: z.number(), tol: z.number().min(0).optional(), unit: z.string().optional(), answer: z.string().optional(), steps: z.array(z.string()).optional(), format: z.string().optional(), ...itemBase }),
  z.object({ type: z.literal('order'), options: z.array(html).min(3).max(8), ...itemBase }),
]);
export type BankItem = z.infer<typeof BankItem>;
export const LearnPage = z.object({
  overview: html, objectives: z.array(z.string()).min(1), keyWords: z.array(z.object({ term: z.string(), def: z.string() })).min(1),
  sections: z.array(z.object({ title: z.string().min(1), html })).min(1).max(12), mistakes: z.array(z.string()).default([]), examTips: z.array(z.string()).default([]),
  realLife: z.string().default(''), specRef: z.string().default(''),
});
export type LearnPage = z.infer<typeof LearnPage>;
export const ItemCreateBody = z.object({ body: BankItem });
export const ItemPatchBody = z.object({ body: BankItem.optional(), active: z.boolean().optional() });
export const TopicPatchBody = z.object({ name: z.string().min(1).max(120).optional(), summary: z.string().max(500).optional(), published: z.boolean().optional() });
export const StylePatchBody = z.object({ name: z.string().min(1).max(120).optional(), intro: z.string().min(1).max(2000).optional() });
export const LearnPutBody = z.object({ content: LearnPage });
