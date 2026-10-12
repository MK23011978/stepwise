// Who's online, friends and 1-to-1 chat between students.
// Safety rules (children): friendships need the other student AND both parents to approve; parents can read their
// child's chats, turn chat or online visibility off, and anyone can block or report. Personal details are masked.
import { and, asc, desc, eq, gt, inArray, or, sql } from 'drizzle-orm';
import type { Db } from '../../db/client.js';
import * as s from '../../db/schema.js';
import { newId } from '../../core/ids.js';
import { nowIso } from '../../core/dates.js';
import { fail } from '../../core/errors.js';
import * as repo from '../students/students.repo.js';
import type { Deps } from '../../core/deps.js';
import { yearLocked, yearLockMessage } from '../common/domain.js';
import { stripQ } from '../lessons/lessons.service.js';

export const ONLINE_WINDOW_MS = 90_000;
type Friendship = typeof s.friendships.$inferSelect;
type Viewer = { id: string; role: string };

/** "Amelia Jones" → "Amelia J." — other students never see full names, emails or parents. */
export const displayName = (name: string) => { const [first, ...rest] = String(name).trim().split(/\s+/); return rest.length ? `${first} ${rest[rest.length - 1][0].toUpperCase()}.` : first; };

// ---------- message filter: personal details and bad language are masked ----------
const MASK = '•••';
const PATTERNS: RegExp[] = [
  /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/gi, // email
  /(?:https?:\/\/|www\.)\S+/gi, // links
  /\b[a-z0-9-]+\.(?:com|co\.uk|uk|net|org|io|me|gg|tv|app|ly)\b\S*/gi, // bare domains
  /(?:\+?\d[\s().-]*){7,}/g, // phone-like digit runs
  /(?:^|\s)@[a-z0-9_.]{3,}/gi, // social handles
  /\b(?:snap(?:chat)?|insta(?:gram)?|ig|tiktok|tt|whatsapp|discord|telegram|kik|roblox|xbox|psn|fortnite)\b(?:\s*(?:is|me|at|on|my|name|id|user(?:name)?|handle|tag|[:=\-]))*\s*\S*/gi, // "my snap is …"
  /\b[a-z]+[._][a-z0-9._]*\d[a-z0-9._]*\b|\b[a-z]*\d+[a-z]*_[a-z0-9_]+\b|\b[a-z]+_[a-z0-9_]+\b/gi, // handle-like tokens (amy_x, ben.99)
];
const BAD = ['fuck', 'shit', 'bitch', 'cunt', 'dick', 'bastard', 'slut', 'whore', 'wanker', 'twat', 'prick', 'retard', 'fag', 'nigg', 'kill yourself', 'kys'];
export function filterMessage(text: string) {
  let out = text; let filtered = false;
  for (const re of PATTERNS) out = out.replace(re, (m) => { filtered = true; return (/^\s/.test(m) ? ' ' : '') + MASK; });
  for (const w of BAD) {
    const re = new RegExp(w.replace(/ /g, '\\s+'), 'gi');
    if (re.test(out)) { filtered = true; out = out.replace(re, (m) => m[0] + '*'.repeat(Math.max(1, m.length - 1))); }
  }
  return { body: out.trim() || MASK, filtered };
}

export const SHARED_TRIES = 3;
export const SHARED_XP = 5;
type Attempts = Record<string, { tries: number; correct: boolean; input: string; at: string }>;

export function createSocialService(deps: Deps) {
  const { content } = deps;
  const pair = (x: string, y: string) => (x < y ? [x, y] : [y, x]) as [string, string];
  const sideOf = (f: Friendship, id: string) => (f.aId === id ? 'a' : f.bId === id ? 'b' : null);
  const otherOf = (f: Friendship, id: string) => (f.aId === id ? f.bId : f.aId);
  const isOnline = (u: { lastSeenAt: string | null }) => !!u.lastSeenAt && Date.now() - new Date(u.lastSeenAt).getTime() < ONLINE_WINDOW_MS;
  const card = (st: repo.Student) => ({ id: st.id, name: displayName(st.name), yearGroup: st.yearGroup, avatarColor: st.avatarColor, equipped: st.equipped,
    online: isOnline(st) && st.showOnline });

  async function students(db: Db, ids: string[]) {
    if (!ids.length) return new Map<string, repo.Student>();
    const rows = await db.select().from(s.users).innerJoin(s.studentProfiles, eq(s.studentProfiles.userId, s.users.id)).where(inArray(s.users.id, ids));
    return new Map(rows.map((r) => [r.users.id, { ...r.users, ...r.student_profiles } as repo.Student]));
  }
  async function friendshipsOf(db: Db, id: string) {
    return db.select().from(s.friendships).where(or(eq(s.friendships.aId, id), eq(s.friendships.bId, id))).orderBy(desc(s.friendships.createdAt));
  }
  async function getFriendship(db: Db, fid: string) {
    const [f] = await db.select().from(s.friendships).where(eq(s.friendships.id, fid));
    return f || fail(404, 'Friend not found');
  }
  async function mine(db: Db, me: Viewer, fid: string) {
    const f = await getFriendship(db, fid);
    if (!sideOf(f, me.id)) fail(403, 'Not allowed');
    return f;
  }

  async function heartbeat(db: Db, userId: string) {
    await db.update(s.users).set({ lastSeenAt: nowIso() }).where(eq(s.users.id, userId));
    return { ok: true as const };
  }

  /** Everything the Friends page needs for one student. */
  async function overview(db: Db, studentId: string) {
    const me = (await repo.getStudent(db, studentId)) || fail(404, 'Student not found');
    const since = new Date(Date.now() - ONLINE_WINDOW_MS).toISOString();
    const onlineRows = await db.select().from(s.users).innerJoin(s.studentProfiles, eq(s.studentProfiles.userId, s.users.id))
      .where(and(eq(s.users.role, 'student'), eq(s.users.status, 'active'), gt(s.users.lastSeenAt, since), eq(s.studentProfiles.showOnline, true)))
      .orderBy(desc(s.users.lastSeenAt)).limit(60);
    const fs = await friendshipsOf(db, me.id);
    const people = await students(db, fs.map((f) => otherOf(f, me.id)));
    const relation = new Map(fs.map((f) => [otherOf(f, me.id), f]));
    const unread = fs.length ? await db.select({ fid: s.chatMessages.friendshipId, n: sql<number>`count(*)::int` }).from(s.chatMessages)
      .innerJoin(s.friendships, eq(s.friendships.id, s.chatMessages.friendshipId))
      .where(and(inArray(s.chatMessages.friendshipId, fs.map((f) => f.id)), sql`${s.chatMessages.senderId} <> ${me.id}`,
        sql`${s.chatMessages.createdAt} > coalesce(case when ${s.friendships.aId} = ${me.id} then ${s.friendships.aReadAt} else ${s.friendships.bReadAt} end, 'epoch'::timestamptz)`))
      .groupBy(s.chatMessages.friendshipId) : [];
    const unreadMap = new Map(unread.map((u) => [u.fid, u.n]));
    const view = (f: Friendship) => {
      const other = people.get(otherOf(f, me.id)); if (!other) return null;
      const side = sideOf(f, me.id)!;
      return { id: f.id, status: f.status, incoming: f.status === 'pending' && f.requestedBy !== me.id, blockedByMe: f.blockedBy === me.id,
        myParentOk: side === 'a' ? f.aParentOk : f.bParentOk, theirParentOk: side === 'a' ? f.bParentOk : f.aParentOk,
        unread: unreadMap.get(f.id) || 0, lastMessageAt: f.lastMessageAt, student: card(other) };
    };
    const all = fs.map(view).filter(Boolean) as NonNullable<ReturnType<typeof view>>[];
    return {
      me: { id: me.id, name: displayName(me.name), showOnline: me.showOnline, chatEnabled: me.chatEnabled },
      online: onlineRows.map((r) => ({ ...r.users, ...r.student_profiles } as repo.Student)).filter((u) => u.id !== me.id)
        .map((u) => { const f = relation.get(u.id); return { ...card(u), friendshipId: f?.id || null, relation: f?.status || null }; })
        .filter((u) => u.relation !== 'blocked'),
      friends: all.filter((f) => f.status === 'active').sort((x, y) => Number(y.student.online) - Number(x.student.online) || String(y.lastMessageAt || '').localeCompare(String(x.lastMessageAt || ''))),
      requests: all.filter((f) => f.status === 'pending' || f.status === 'approval'),
      blocked: all.filter((f) => f.status === 'blocked' && f.blockedByMe),
      unread: all.reduce((a, f) => a + (f.status === 'active' ? f.unread : 0), 0),
    };
  }

  async function request(db: Db, me: Viewer, b: { userId?: string; username?: string }) {
    let targetId = b.userId;
    if (!targetId && b.username) {
      const [u] = await db.select({ id: s.users.id }).from(s.users).where(and(eq(s.users.role, 'student'), sql`lower(${s.users.username}) = ${b.username.replace(/^@/, '')}`));
      targetId = u?.id;
    }
    const target = targetId ? await repo.getStudent(db, targetId) : undefined;
    if (!target || target.role !== 'student' || target.status !== 'active') return fail(404, 'We couldn’t find that student');
    if (target.id === me.id) return fail(400, 'That’s you!');
    const [aId, bId] = pair(me.id, target.id);
    const [existing] = await db.select().from(s.friendships).where(and(eq(s.friendships.aId, aId), eq(s.friendships.bId, bId)));
    if (existing) {
      if (existing.status === 'blocked') return fail(403, 'You can’t add this student');
      if (existing.status !== 'declined') return fail(409, existing.status === 'active' ? 'You’re already friends' : 'A request is already waiting');
      await db.update(s.friendships).set({ status: 'pending', requestedBy: me.id, aParentOk: false, bParentOk: false, updatedAt: nowIso() }).where(eq(s.friendships.id, existing.id));
    } else {
      await db.insert(s.friendships).values({ id: newId('frd'), aId, bId, requestedBy: me.id, status: 'pending' });
    }
    await repo.notify(db, target.id, { type: 'friend', title: 'New friend request', text: `${displayName((await repo.getStudent(db, me.id))!.name)} wants to be friends.`, icon: '👋', seen: true });
    return { ok: true as const };
  }

  async function respond(db: Db, me: Viewer, fid: string, accept: boolean) {
    const f = await mine(db, me, fid);
    if (f.status !== 'pending' || f.requestedBy === me.id) return fail(400, 'Nothing to answer');
    await db.update(s.friendships).set({ status: accept ? 'approval' : 'declined', updatedAt: nowIso() }).where(eq(s.friendships.id, f.id));
    return { ok: true as const };
  }

  /** A parent (or admin) approves/declines a friendship for their own child. Active once both parents say yes. */
  async function parentDecide(db: Db, child: repo.Student, fid: string, approve: boolean) {
    const f = await getFriendship(db, fid);
    const side = sideOf(f, child.id);
    if (!side) return fail(404, 'Friend not found');
    if (f.status !== 'approval') return fail(400, 'This friendship isn’t waiting for approval');
    if (!approve) { await db.update(s.friendships).set({ status: 'declined', updatedAt: nowIso() }).where(eq(s.friendships.id, f.id)); return { status: 'declined' }; }
    const next = { aParentOk: side === 'a' ? true : f.aParentOk, bParentOk: side === 'b' ? true : f.bParentOk };
    const status = next.aParentOk && next.bParentOk ? 'active' : 'approval';
    await db.update(s.friendships).set({ ...next, status, updatedAt: nowIso() }).where(eq(s.friendships.id, f.id));
    if (status === 'active') for (const id of [f.aId, f.bId]) await repo.notify(db, id, { type: 'friend', title: 'You have a new friend! 🎉', text: 'You can now chat in Friends.', icon: '🤝', seen: true });
    return { status };
  }

  async function remove(db: Db, me: Viewer, fid: string) {
    const f = await mine(db, me, fid);
    if (f.status === 'blocked' && f.blockedBy !== me.id) return fail(403, 'Not allowed');
    await db.delete(s.friendships).where(eq(s.friendships.id, f.id));
    return { ok: true as const };
  }
  async function block(db: Db, me: Viewer, fid: string) {
    const f = await mine(db, me, fid);
    await db.update(s.friendships).set({ status: 'blocked', blockedBy: me.id, updatedAt: nowIso() }).where(eq(s.friendships.id, f.id));
    return { ok: true as const };
  }

  /** A shared question as one viewer may see it: the answer and the friend's input appear only once the viewer has finished. */
  function questionView(row: typeof s.sharedQuestions.$inferSelect, viewerId: string | null) {
    const q = row.question as Record<string, any>; const att = row.attempts as Attempts;
    const mine = viewerId ? att[viewerId] : undefined;
    const done = !viewerId || !!mine && (mine.correct || mine.tries >= SHARED_TRIES); // parents/admins see everything
    const style = content.getStyle(row.styleId); const topic = content.getTopic(style?.topicId);
    return {
      id: row.id, sharedBy: row.sharedBy, styleId: row.styleId, styleName: style?.name, topicName: topic?.name, subject: content.subjectOf(row.styleId),
      question: stripQ(q as never), triesLeft: Math.max(0, SHARED_TRIES - (mine?.tries || 0)), done, correct: !!mine?.correct,
      ...(done ? { answer: q.answer, answerHtml: q.answerHtml, steps: q.steps } : {}),
      players: Object.fromEntries(Object.entries(att).map(([uid, a]) => [uid, { tries: a.tries, correct: a.correct, done: a.correct || a.tries >= SHARED_TRIES, ...(done || uid === viewerId ? { input: a.input } : {}) }])),
    };
  }
  async function messages(db: Db, f: Friendship, after?: string, limit = 100, viewerId: string | null = null) {
    const where = after ? and(eq(s.chatMessages.friendshipId, f.id), gt(s.chatMessages.createdAt, after)) : eq(s.chatMessages.friendshipId, f.id);
    const rows = (await db.select().from(s.chatMessages).where(where).orderBy(desc(s.chatMessages.createdAt)).limit(limit)).reverse();
    const qids = rows.filter((m) => m.kind === 'question' && m.refId).map((m) => m.refId!);
    const qs = qids.length ? await db.select().from(s.sharedQuestions).where(inArray(s.sharedQuestions.id, qids)) : [];
    return rows.map((m) => { const sq = m.kind === 'question' ? qs.find((x) => x.id === m.refId) : undefined;
      return { id: m.id, kind: m.kind, senderId: m.senderId, body: m.body, filtered: m.filtered, createdAt: m.createdAt, ...(sq ? { shared: questionView(sq, viewerId) } : {}) }; });
  }
  async function thread(db: Db, me: Viewer, fid: string, after?: string) {
    const f = await mine(db, me, fid);
    if (f.status !== 'active') return fail(403, 'You can chat once you’re friends', 'NOT_FRIENDS');
    const people = await students(db, [f.aId, f.bId]);
    const other = people.get(otherOf(f, me.id))!;
    const list = await messages(db, f, after, 100, me.id);
    await db.update(s.friendships).set(sideOf(f, me.id) === 'a' ? { aReadAt: nowIso() } : { bReadAt: nowIso() }).where(eq(s.friendships.id, f.id));
    return { friendshipId: f.id, friend: card(other), canChat: !!people.get(me.id)?.chatEnabled && other.chatEnabled, messages: list };
  }
  async function chatReady(db: Db, me: Viewer, fid: string) {
    const f = await mine(db, me, fid);
    if (f.status !== 'active') return fail(403, 'You can chat once you’re friends', 'NOT_FRIENDS');
    const people = await students(db, [f.aId, f.bId]);
    if (!people.get(me.id)?.chatEnabled) return fail(403, 'Chat is turned off on your account', 'CHAT_OFF');
    if (!people.get(otherOf(f, me.id))?.chatEnabled) return fail(403, 'Your friend can’t chat at the moment', 'CHAT_OFF');
    return { f, me: people.get(me.id)!, friend: people.get(otherOf(f, me.id))! };
  }
  async function send(db: Db, me: Viewer, fid: string, text: string) {
    const { f } = await chatReady(db, me, fid);
    const since = new Date(Date.now() - 60_000).toISOString();
    const [{ n }] = await db.select({ n: sql<number>`count(*)::int` }).from(s.chatMessages).where(and(eq(s.chatMessages.senderId, me.id), gt(s.chatMessages.createdAt, since)));
    if (n >= 20) return fail(429, 'Slow down a little — try again in a minute');
    const { body, filtered } = filterMessage(text);
    const now = nowIso();
    const msg = { id: newId('msg'), friendshipId: f.id, senderId: me.id, body, filtered, createdAt: now };
    await db.insert(s.chatMessages).values(msg);
    await db.update(s.friendships).set({ lastMessageAt: now, ...(sideOf(f, me.id) === 'a' ? { aReadAt: now } : { bReadAt: now }) }).where(eq(s.friendships.id, f.id));
    return { message: { id: msg.id, senderId: msg.senderId, body, filtered, createdAt: now } };
  }
  /** Share a question (a chosen style/topic, or a random one from the sharer's open years) to solve together. */
  async function share(db: Db, viewer: Viewer, fid: string, b: { styleId?: string; topicId?: string; subject?: string }) {
    const { f, me } = await chatReady(db, viewer, fid);
    let styleId = b.styleId;
    if (!styleId) {
      const pool = b.topicId ? [content.getTopic(b.topicId)].filter(Boolean) as typeof content.topics
        : content.topics.filter((t) => !yearLocked(t.year, me.yearGroup) && (!b.subject || t.subject === b.subject) && (!me.subjects?.length || me.subjects.includes(t.subject)));
      const topic = pool[Math.floor(Math.random() * pool.length)];
      styleId = topic?.styles[Math.floor(Math.random() * topic.styles.length)];
    }
    const style = content.getStyle(styleId); const topic = content.getTopic(style?.topicId);
    if (!style || !topic) return fail(404, 'Question type not found');
    if (yearLocked(topic.year, me.yearGroup)) return fail(403, yearLockMessage(topic.year), 'YEAR_LOCKED');
    const since = new Date(Date.now() - 3600_000).toISOString();
    const [{ n }] = await db.select({ n: sql<number>`count(*)::int` }).from(s.sharedQuestions).where(and(eq(s.sharedQuestions.sharedBy, me.id), gt(s.sharedQuestions.createdAt, since)));
    if (n >= 30) return fail(429, 'That’s a lot of questions — try again later');
    const q = content.generate(style.id);
    const now = nowIso(); const id = newId('shq');
    await db.insert(s.sharedQuestions).values({ id, friendshipId: f.id, sharedBy: me.id, styleId: style.id, question: q, createdAt: now });
    await db.insert(s.chatMessages).values({ id: newId('msg'), friendshipId: f.id, senderId: me.id, body: `🧩 ${topic.name} — ${style.name}`, kind: 'question', refId: id, createdAt: now });
    await db.update(s.friendships).set({ lastMessageAt: now, ...(sideOf(f, me.id) === 'a' ? { aReadAt: now } : { bReadAt: now }) }).where(eq(s.friendships.id, f.id));
    const [row] = await db.select().from(s.sharedQuestions).where(eq(s.sharedQuestions.id, id));
    return { shared: questionView(row, me.id) };
  }
  async function answerShared(db: Db, viewer: Viewer, fid: string, qid: string, input: string) {
    const f = await mine(db, viewer, fid);
    if (f.status !== 'active') return fail(403, 'You can chat once you’re friends', 'NOT_FRIENDS');
    return db.transaction(async (tx) => {
      const d = tx as unknown as Db;
      const [row] = await d.select().from(s.sharedQuestions).where(and(eq(s.sharedQuestions.id, qid), eq(s.sharedQuestions.friendshipId, f.id))).for('update');
      if (!row) return fail(404, 'Question not found');
      const att = { ...(row.attempts as Attempts) }; const a = att[viewer.id] || { tries: 0, correct: false, input: '', at: '' };
      if (a.correct || a.tries >= SHARED_TRIES) return fail(400, 'You’ve already finished this one');
      const ok = content.checkAnswer((row.question as Record<string, any>).check, input);
      att[viewer.id] = { tries: a.tries + 1, correct: ok, input, at: nowIso() };
      await d.update(s.sharedQuestions).set({ attempts: att }).where(eq(s.sharedQuestions.id, row.id));
      if (ok) { await repo.addXpCoins(d, viewer.id, SHARED_XP, 0); await repo.markActive(d, viewer.id); }
      return { correct: ok, xp: ok ? SHARED_XP : 0, shared: questionView({ ...row, attempts: att }, viewer.id) };
    });
  }

  async function report(db: Db, me: Viewer, fid: string, b: { reason: string; messageId?: string }) {
    const f = await mine(db, me, fid);
    await db.insert(s.chatReports).values({ id: newId('rep'), friendshipId: f.id, messageId: b.messageId || null, reporterId: me.id, reason: b.reason });
    return { ok: true as const };
  }

  // ---------- parents ----------
  /** A child's friends, requests and recent chats, for their parent. */
  async function forParent(db: Db, child: repo.Student) {
    const fs = await friendshipsOf(db, child.id);
    const people = await students(db, fs.map((f) => otherOf(f, child.id)));
    return {
      settings: { showOnline: child.showOnline, chatEnabled: child.chatEnabled },
      friendships: fs.map((f) => { const o = people.get(otherOf(f, child.id)); const side = sideOf(f, child.id)!;
        return o && { id: f.id, status: f.status, myParentOk: side === 'a' ? f.aParentOk : f.bParentOk, lastMessageAt: f.lastMessageAt, blockedBy: f.blockedBy === child.id ? 'child' : f.blockedBy ? 'friend' : null, student: card(o) }; }).filter(Boolean),
    };
  }
  async function parentThread(db: Db, child: repo.Student, fid: string) {
    const f = await getFriendship(db, fid);
    if (!sideOf(f, child.id)) return fail(404, 'Friend not found');
    const people = await students(db, [f.aId, f.bId]);
    return { friend: card(people.get(otherOf(f, child.id))!), childId: child.id, messages: await messages(db, f, undefined, 300, null) };
  }
  async function approvalsFor(db: Db, parentId: string) {
    const kids = await repo.childrenOf(db, parentId);
    if (!kids.length) return [];
    const ids = kids.map((k) => k.id);
    const fs = await db.select().from(s.friendships).where(and(eq(s.friendships.status, 'approval'), or(inArray(s.friendships.aId, ids), inArray(s.friendships.bId, ids))));
    const people = await students(db, fs.flatMap((f) => [f.aId, f.bId]));
    const out = [];
    for (const f of fs) for (const k of kids) {
      const side = sideOf(f, k.id); if (!side || (side === 'a' ? f.aParentOk : f.bParentOk)) continue;
      const o = people.get(otherOf(f, k.id)); if (!o) continue;
      out.push({ id: f.id, studentId: k.id, studentName: k.name, friend: { ...card(o), yearGroup: o.yearGroup } });
    }
    return out;
  }
  async function saveSettings(db: Db, child: repo.Student, b: { showOnline?: boolean; chatEnabled?: boolean }) {
    const patch: Partial<repo.ProfileRow> = {};
    if (b.showOnline !== undefined) patch.showOnline = b.showOnline;
    if (b.chatEnabled !== undefined) patch.chatEnabled = b.chatEnabled;
    await repo.updateProfile(db, child.id, patch);
    return { ok: true as const };
  }

  // ---------- admin ----------
  async function reports(db: Db) {
    const rows = await db.select().from(s.chatReports).orderBy(asc(s.chatReports.status), desc(s.chatReports.createdAt)).limit(200);
    const fs = rows.length ? await db.select().from(s.friendships).where(inArray(s.friendships.id, [...new Set(rows.map((r) => r.friendshipId))])) : [];
    const people = await students(db, [...new Set(fs.flatMap((f) => [f.aId, f.bId]))]);
    const name = (id: string) => people.get(id)?.name || 'Unknown';
    return { reports: await Promise.all(rows.map(async (r) => {
      const f = fs.find((x) => x.id === r.friendshipId)!;
      return { ...r, reporter: name(r.reporterId), between: [name(f.aId), name(f.bId)], messages: await messages(db, f, undefined, 50, null) };
    })) };
  }
  async function closeReport(db: Db, id: string, status: 'open' | 'closed') {
    await db.update(s.chatReports).set({ status, closedAt: status === 'closed' ? nowIso() : null }).where(eq(s.chatReports.id, id));
    return { ok: true as const };
  }

  return { heartbeat, overview, request, respond, parentDecide, remove, block, thread, send, share, answerShared, report, forParent, parentThread, approvalsFor, saveSettings, reports, closeReport };
}
export type SocialService = ReturnType<typeof createSocialService>;
