// Friends & chat: presence, the request → accept → both-parents-approve flow, chat, filtering, controls, reports.
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import * as s from '../src/db/schema.js';
import { hashPassword } from '../src/core/password.js';
import { filterMessage, displayName } from '../src/modules/social/social.service.js';
import { makeApp, client } from './setup.js';

let ctx: Awaited<ReturnType<typeof makeApp>>;
beforeAll(async () => { ctx = await makeApp(); }, 120_000);
afterAll(async () => ctx?.close());

async function family(tag: string, kid: string) {
  const parent = client(ctx.app);
  await parent.call('POST', '/auth/register', { name: `Parent ${tag}`, email: `p${tag}@example.test`, password: 'longenough1' });
  const { child } = await parent.call('POST', '/children', { name: kid, yearGroup: 9, username: `kid${tag}`, password: 'kidpassword' });
  const kidC = client(ctx.app);
  await kidC.call('POST', '/auth/login', { login: `kid${tag}`, password: 'kidpassword' });
  return { parent, kid: kidC, child };
}

describe('message filter', () => {
  it('masks contact details and bad words', () => {
    expect(filterMessage('my email is amy@gmail.com').body).not.toContain('gmail');
    expect(filterMessage('call 07700 900123').filtered).toBe(true);
    expect(filterMessage('add me on snapchat amy_x').body).not.toContain('amy_x');
    expect(filterMessage('go to www.site.com now').body).not.toContain('site');
    expect(filterMessage('My snap is ben_99').body).not.toContain('ben_99');
    expect(filterMessage('my roblox name: coolkid.2012').body).not.toContain('coolkid');
    expect(filterMessage('x = 3.5 and y = 0.25').filtered).toBe(false);
    expect(filterMessage('what is 3/4 of 120?')).toEqual({ body: 'what is 3/4 of 120?', filtered: false });
    expect(filterMessage('this is shit').body).toBe('this is s***');
    expect(displayName('Amelia Rose Jones')).toBe('Amelia J.');
  });
});

describe('friends & chat', () => {
  it('runs the whole safe-chat journey', async () => {
    const A = await family('a', 'Amelia Jones');
    const B = await family('b', 'Ben Smith');
    const C = await family('c', 'Cara Lee');

    // presence → both show up online, with first name + initial only
    await A.kid.call('POST', '/presence'); await B.kid.call('POST', '/presence');
    const ov = await A.kid.call('GET', '/social');
    const ben = ov.online.find((u: { id: string }) => u.id === B.child.id);
    expect(ben.name).toBe('Ben S.');
    expect(ben.email).toBeUndefined(); expect(ben.username).toBeUndefined();
    // parents can't use the student endpoints
    await A.parent.call('GET', '/social', undefined, 403);

    // request → accept → parents approve (both!)
    await A.kid.call('POST', '/social/friends', { userId: B.child.id });
    await A.kid.call('POST', '/social/friends', { userId: B.child.id }, 409);
    const req = (await B.kid.call('GET', '/social')).requests[0];
    expect(req.incoming).toBe(true);
    await A.kid.call('POST', `/social/friends/${req.id}/accept`, {}, 400); // can't accept your own request
    await B.kid.call('POST', `/social/friends/${req.id}/accept`);
    await A.kid.call('POST', `/social/friends/${req.id}/messages`, { body: 'hi' }, 403); // not friends until parents agree
    const appr = await A.parent.call('GET', '/approvals');
    expect(appr.friends).toHaveLength(1);
    expect(appr.count).toBeGreaterThanOrEqual(1);
    expect((await A.parent.call('POST', `/students/${A.child.id}/friends/${req.id}/approve`, { approve: true })).status).toBe('approval');
    await C.parent.call('POST', `/students/${A.child.id}/friends/${req.id}/approve`, { approve: true }, 403); // not their child
    expect((await B.parent.call('POST', `/students/${B.child.id}/friends/${req.id}/approve`, { approve: true })).status).toBe('active');

    // chat, with masking and unread counts
    const sent = await A.kid.call('POST', `/social/friends/${req.id}/messages`, { body: 'Hi Ben! my number is 07700 900123' });
    expect(sent.message.filtered).toBe(true);
    expect(sent.message.body).not.toContain('900123');
    expect((await B.kid.call('GET', '/social')).unread).toBe(1);
    const t = await B.kid.call('GET', `/social/friends/${req.id}/messages`);
    expect(t.messages).toHaveLength(1);
    expect((await B.kid.call('GET', '/social')).unread).toBe(0);
    await B.kid.call('POST', `/social/friends/${req.id}/messages`, { body: 'hello!' });
    expect((await A.kid.call('GET', `/social/friends/${req.id}/messages?after=${encodeURIComponent(sent.message.createdAt)}`)).messages.map((m: { body: string }) => m.body)).toEqual(['hello!']);

    // solve together: a shared question keeps its answer secret until each student finishes
    const sh = await A.kid.call('POST', `/social/friends/${req.id}/questions`, { subject: 'maths' });
    expect(sh.shared.question.check).toBeUndefined(); expect(sh.shared.answer).toBeUndefined();
    const y11 = ctx.deps.content.topics.find((t) => t.year === 11)!;
    expect((await A.kid.call('POST', `/social/friends/${req.id}/questions`, { topicId: y11.id }, 403)).code).toBe('YEAR_LOCKED');
    const [row] = await ctx.deps.db.select().from(s.sharedQuestions);
    const right = (row.question as { answer: string }).answer;
    const w = await B.kid.call('POST', `/social/friends/${req.id}/questions/${row.id}/answer`, { input: 'zzz-wrong' });
    expect(w.correct).toBe(false); expect(w.shared.answer).toBeUndefined(); expect(w.shared.triesLeft).toBe(2);
    const okB = await B.kid.call('POST', `/social/friends/${req.id}/questions/${row.id}/answer`, { input: right });
    expect(okB.correct).toBe(true); expect(okB.shared.answer).toBe(right); expect(okB.xp).toBe(5);
    await B.kid.call('POST', `/social/friends/${req.id}/questions/${row.id}/answer`, { input: right }, 400);
    const aView = (await A.kid.call('GET', `/social/friends/${req.id}/messages`)).messages.find((m: { kind: string }) => m.kind === 'question').shared;
    expect(aView.players[B.child.id].correct).toBe(true);
    expect(aView.players[B.child.id].input).toBeUndefined(); // no copying before you've finished
    expect(aView.answer).toBeUndefined();
    await C.kid.call('POST', `/social/friends/${req.id}/questions/${row.id}/answer`, { input: right }, 403);

    // outsiders can't read; the parent can
    await C.kid.call('GET', `/social/friends/${req.id}/messages`, undefined, 403);
    expect((await A.parent.call('GET', `/students/${A.child.id}/friends/${req.id}/messages`)).messages).toHaveLength(3);
    await C.parent.call('GET', `/students/${A.child.id}/friends/${req.id}/messages`, undefined, 403);

    // parent controls: chat off, hidden from the online list
    await B.parent.call('PUT', `/students/${B.child.id}/social`, { chatEnabled: false, showOnline: false });
    expect((await A.kid.call('POST', `/social/friends/${req.id}/messages`, { body: 'there?' }, 403)).code).toBe('CHAT_OFF');
    await B.kid.call('POST', '/presence');
    expect((await C.kid.call('GET', '/social')).online.some((u: { id: string }) => u.id === B.child.id)).toBe(false);
    await B.parent.call('PUT', `/students/${B.child.id}/social`, { chatEnabled: true, showOnline: true });

    // report + block; admin sees the report with the messages
    await B.kid.call('POST', `/social/friends/${req.id}/report`, { reason: 'Asked for my number' });
    await B.kid.call('POST', `/social/friends/${req.id}/block`);
    await A.kid.call('POST', `/social/friends/${req.id}/messages`, { body: 'hey' }, 403);
    await A.kid.call('POST', '/social/friends', { userId: B.child.id }, 403);
    await A.kid.call('DELETE', `/social/friends/${req.id}`, undefined, 403); // only the blocker can unblock
    await ctx.deps.db.insert(s.users).values({ id: 'usr_adm2', role: 'admin', name: 'Admin', email: 'adm2@example.test', passwordHash: await hashPassword('adminpass123') });
    const adm = client(ctx.app);
    await adm.call('POST', '/auth/login', { login: 'adm2@example.test', password: 'adminpass123' });
    const reps = await adm.call('GET', '/admin/chat-reports');
    expect(reps.reports[0].messages).toHaveLength(3);
    await adm.call('PATCH', `/admin/chat-reports/${reps.reports[0].id}`, { status: 'closed' });
    await A.kid.call('GET', '/admin/chat-reports', undefined, 403);

    // friend by username; declining
    await C.kid.call('POST', '/social/friends', { username: 'kida' });
    const r2 = (await A.kid.call('GET', '/social')).requests.find((x: { incoming: boolean }) => x.incoming);
    await A.kid.call('POST', `/social/friends/${r2.id}/decline`);
    expect((await A.kid.call('GET', '/social')).requests).toHaveLength(0);
    await C.kid.call('POST', '/social/friends', { username: 'nobody' }, 404);
  }, 120_000);
});
