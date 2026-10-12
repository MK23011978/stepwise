// End-to-end API test against an isolated temp data dir. Run: node test/api.test.js
const os = require('os'); const fs = require('fs'); const path = require('path');
process.env.DATA_DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'stepwise-'));
const assert = require('assert');
const store = require('../db');
const { server } = require('../server');

let base, cookie = '';
async function call(method, url, body, expect = 200) {
  const r = await fetch(base + url, { method, headers: { 'Content-Type': 'application/json', cookie }, body: body ? JSON.stringify(body) : undefined });
  const sc = r.headers.get('set-cookie'); if (sc) cookie = sc.split(';')[0];
  const j = await r.json();
  assert.strictEqual(r.status, expect, `${method} ${url} → ${r.status} ${JSON.stringify(j).slice(0, 300)}`);
  return j;
}
const lesson = (id) => store.data.lessons.find((l) => l.id === id);

server.listen(0, async () => {
  base = `http://127.0.0.1:${server.address().port}`;
  try {
    const cur = await call('GET', '/api/curriculum');
    assert(cur.subjects.length >= 1 && cur.topics.length > 50, 'curriculum loaded');
    assert(cur.years.includes(7) && cur.years.includes(11), 'years 7–11');
    await call('GET', '/api/me', null, 401);
    await call('POST', '/api/auth/register', { name: 'Test Parent', email: 'tp@example.test', password: 'short' }, 400);
    await call('POST', '/api/auth/register', { name: 'Test Parent', email: 'tp@example.test', password: 'longenough1' });
    const me = await call('GET', '/api/me');
    assert.strictEqual(me.user.role, 'parent'); assert.strictEqual(me.wallet.freeLessonAvailable, true); assert.strictEqual(me.wallet.cardCheckRequired, true);
    const { child } = await call('POST', '/api/children', { name: 'Kid', yearGroup: 9, tier: 'H', targetGrade: 7, username: 'kid.test', password: 'kidpassword' });
    assert(child.subjects.length === cur.subjects.length, 'enrolled in all subjects by default');
    const y9 = cur.topics.find((t) => t.subject === 'maths' && t.year === 9);
    const styleId = y9.styles[0].id;

    // free trial needs a £0 card check first (demo mode)
    await call('POST', '/api/lessons', { studentId: child.id, styleId }, 428);
    const vc = await call('POST', '/api/billing/verify-card', { demo: true });
    assert.strictEqual(vc.trialAvailable, true);
    const { lesson: L0 } = await call('POST', '/api/lessons', { studentId: child.id, styleId });
    assert.strictEqual(L0.free, true);
    const L = lesson(L0.id);
    for (let i = 0; i < L.questions.length; i++) {
      if (i === 3) await call('POST', `/api/lessons/${L.id}/skip`);
      else if (i === 5) { for (let k = 0; k < 3; k++) await call('POST', `/api/lessons/${L.id}/answer`, { input: 'zzz' }); }
      else { const r = await call('POST', `/api/lessons/${L.id}/answer`, { input: L.questions[i].answer }); assert(r.correct, `q${i} correct with canonical answer`); }
      await call('POST', `/api/lessons/${L.id}/next`);
    }
    assert.strictEqual(L.status, 'completed');
    const rv = await call('GET', `/api/students/${child.id}/review`);
    assert(rv.mistakeCount >= 2, 'skipped + wrong went to mistakes bank');
    assert(rv.tracked >= 1, 'style scheduled for spaced review');

    // review session is free and fixes mistakes
    const { lesson: R0 } = await call('POST', '/api/reviews', { studentId: child.id, mode: 'mistakes' });
    const R = lesson(R0.id);
    for (let i = 0; i < R.questions.length; i++) { await call('POST', `/api/lessons/${R.id}/answer`, { input: R.questions[i].answer }); await call('POST', `/api/lessons/${R.id}/next`); }
    assert.strictEqual((await call('GET', `/api/students/${child.id}/review`)).mistakeCount, 0, 'mistakes fixed');

    // other subjects: multiple-choice lesson
    const bio = cur.topics.find((t) => t.subject !== 'maths');
    if (bio) {
      await call('POST', '/api/billing/checkout', { packId: 'pack10' });
      const { lesson: B0 } = await call('POST', '/api/lessons', { studentId: child.id, styleId: bio.styles[0].id });
      const B = lesson(B0.id);
      const r = await call('POST', `/api/lessons/${B.id}/answer`, { input: B.questions[0].answer });
      assert(r.correct, `${bio.subject} canonical answer accepted`);
      const ov = await call('GET', `/api/students/${child.id}/overview?subject=${bio.subject}`);
      assert.strictEqual(ov.subject, bio.subject);
    } else {
      await call('POST', '/api/billing/checkout', { packId: 'pack10' });
    }

    // second maths lesson costs a credit
    const before = (await call('GET', '/api/billing')).credits;
    await call('POST', '/api/lessons', { studentId: child.id, styleId: y9.styles[1].id });
    assert.strictEqual((await call('GET', '/api/billing')).credits, before - 1);

    // exam with wrong answers → post-exam similar question
    const { attempt } = await call('POST', '/api/exams', { studentId: child.id, examId: 'y9-autumn' });
    const A = store.data.examAttempts.find((a) => a.id === attempt.id);
    assert(!attempt.questions[0].answer && !attempt.questions[0].check, 'answers hidden during exam');
    const sub = await call('POST', `/api/exams/${attempt.id}/submit`, { answers: A.questions.map((q, i) => (i === 0 ? 'wrong' : q.answer)) });
    assert(sub.attempt.pct < 100 && sub.attempt.questions[0].steps.length, 'review shows steps');
    const sim = await call('GET', `/api/exams/${attempt.id}/similar/0`);
    assert(sim.question.html && !sim.question.check, 'similar question hidden answer');
    const SQ = A.similar[0].q;
    assert((await call('POST', `/api/exams/${attempt.id}/similar/0`, { input: SQ.answer })).correct);

    // topic test
    const { attempt: T } = await call('POST', '/api/exams', { studentId: child.id, examId: `topic:${y9.id}` });
    assert.strictEqual(T.questions.length, 15);

    // progress report & personal roadmap
    const rep = await call('GET', `/api/students/${child.id}/report`);
    assert(rep.subjects.length === cur.subjects.length && rep.plan.weeks.length === 6 && rep.milestones.length, 'report + 6-week plan');
    assert(rep.plan.weeks[0].items.length >= 2, 'plan has items');
    // rewards: goal + shop
    const g = await call('POST', `/api/students/${child.id}/goals`, { type: 'lessons', target: 1, reward: 'Pizza night' });
    assert(g.goal.id);
    const rw = await call('GET', `/api/students/${child.id}/rewards`);
    assert(rw.coins > 0 && rw.badges.some((b) => b.got), 'coins and badges earned');
    const cheap = rw.shop.filter((x) => x.kind === 'avatar').sort((a, b) => a.price - b.price)[0];
    if (rw.coins >= cheap.price) await call('POST', `/api/students/${child.id}/shop`, { itemId: cheap.id });

    // daily missions, tasks, calendar, gift tickets
    const ms = await call('GET', `/api/students/${child.id}/missions`);
    assert(ms.missions.length === 4 && ms.missions.some((m) => m.done), 'missions with progress');
    await call('POST', `/api/students/${child.id}/missions/claim`, {});
    const tk = await call('POST', `/api/students/${child.id}/tasks`, { title: 'Homework', kind: 'custom', coins: 30, requiresApproval: true });
    const lk = await call('POST', `/api/students/${child.id}/tasks`, { title: 'Any maths lesson', kind: 'lesson', subject: 'maths' });
    const cal = await call('GET', `/api/students/${child.id}/calendar`);
    assert(cal.days.some((d) => d.events.some((e) => e.kind === 'task')), 'tasks on calendar');
    const gc = await call('GET', `/api/students/${child.id}/gifts`);
    assert(gc.catalogue.some((c) => c.id === 'roblox'), 'gift catalogue');
    store.data.users.find((u) => u.id === child.id).coins += 5000;
    const tkt = await call('POST', `/api/students/${child.id}/gifts`, { cardId: 'roblox', value: 5 });
    // student login sees only self, cannot use billing, goals or admin
    const parentCookie = cookie; cookie = '';
    await call('POST', '/api/auth/login', { login: 'kid.test', password: 'kidpassword' });
    await call('GET', `/api/students/${child.id}/overview`);
    await call('GET', '/api/billing', null, 403);
    // student completes a parent task → waits for approval; can't approve own; app task auto-completes on a lesson
    const done = await call('POST', `/api/students/${child.id}/tasks/${tk.task.id}/complete`, {});
    assert(done.waiting, 'custom task waits for approval');
    await call('POST', `/api/students/${child.id}/tasks/${tk.task.id}/approve`, {}, 403);
    await call('PATCH', `/api/students/${child.id}/gifts/${tkt.ticket.id}`, { action: 'approve' }, 403);
    await call('POST', `/api/students/${child.id}/goals`, { type: 'xp', target: 10, reward: 'x' }, 403);
    await call('GET', '/api/admin/stats', null, 403);
    const before2 = store.data.users.find((u) => u.id === child.id).coins;
    cookie = parentCookie;
    await call('POST', `/api/students/${child.id}/tasks/${tk.task.id}/approve`, { date: store.data.tasks.find((t) => t.id === tk.task.id).dueDate });
    assert.strictEqual(store.data.users.find((u) => u.id === child.id).coins, before2 + 30, 'approval pays coins');
    await call('PATCH', `/api/students/${child.id}/gifts/${tkt.ticket.id}`, { action: 'deliver', code: 'X' });
    const appr = await call('GET', '/api/approvals'); assert.strictEqual(appr.tasks.length, 0);
    // another parent cannot see this child
    cookie = '';
    await call('POST', '/api/auth/register', { name: 'Other', email: 'o@example.test', password: 'longenough1' });
    await call('GET', `/api/students/${child.id}/overview`, null, 403);
    // admin: free access means no credits are used
    const { hashPassword } = store; const { salt, hash } = hashPassword('adminpass123');
    store.data.users.push({ id: 'usr_admin', role: 'admin', name: 'Admin', email: 'a@example.test', salt, passHash: hash, status: 'active', createdAt: new Date().toISOString() });
    cookie = '';
    await call('POST', '/api/auth/login', { login: 'a@example.test', password: 'adminpass123' });
    const parentId = store.data.users.find((u) => u.email === 'tp@example.test').id;
    await call('PATCH', `/api/admin/users/${parentId}`, { freeAccess: true });
    const credits = store.data.users.find((u) => u.id === parentId).credits;
    await call('POST', '/api/lessons', { studentId: child.id, styleId: y9.styles[2].id });
    assert.strictEqual(store.data.users.find((u) => u.id === parentId).credits, credits, 'free access: no credit used');
    await call('PATCH', `/api/admin/users/${parentId}`, { creditDelta: 5, reason: 'goodwill' });
    await call('PATCH', `/api/admin/users/${parentId}`, { status: 'suspended' });
    cookie = parentCookie; await call('GET', '/api/me', null, 401); // suspended → session killed
    console.log('API tests passed ✔');
    process.exit(0);
  } catch (e) { console.error(e.message); process.exit(1); }
});
