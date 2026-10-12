// Creates demo accounts and realistic sample activity. Run: npm run seed   (add --reset to wipe data first)
const store = require('./db');
const C = require('../packages/content-seed/registry.cjs');
const { EXAMS, gradeFor, checkRewards } = require('./server');

// Demo / local test accounts (change these before deploying anywhere public).
const DEMO = {
  admins: [
    { name: 'Site Admin', email: 'admin@stepwise.test', password: 'Admin#2026' },
    { name: 'Murat Kaplan', email: 'murat.kaplan@sampa.com', password: '12345678' },
  ],
  parent: { name: 'Murat Kaplan', email: 'parent@stepwise.test', password: 'Parent#2026' },
  children: [
    { name: 'Emirhan', username: 'emirhan', password: 'Student#2026', yearGroup: 9, tier: 'H', targetGrade: 8, skill: 0.82, subjects: C.SUBJECTS.map((s) => s.id) },
    { name: 'Elif', username: 'elif', password: 'Student#2026', yearGroup: 7, tier: 'H', targetGrade: 7, skill: 0.7, subjects: ['maths', 'biology', 'chemistry', 'physics', 'english-language', 'history'] },
  ],
};

store.load();
if (process.argv.includes('--reset')) store.reset();
const d = store.data;
d.review = d.review || {}; d.mistakes = d.mistakes || {};
const iso = (daysAgo, h = 17) => { const t = new Date(); t.setUTCDate(t.getUTCDate() - daysAgo); t.setUTCHours(h, Math.floor(Math.random() * 60)); return t.toISOString(); };
const day = (daysAgo) => iso(daysAgo).slice(0, 10);
const mkUser = (o) => { const { salt, hash } = store.hashPassword(o.password); const { password, skill, ...rest } = o; return { id: store.id(o.role === 'student' ? 'stu' : 'usr'), salt, passHash: hash, status: 'active', createdAt: iso(70), avatarColor: o.avatarColor || '#3b6cf6', ...rest }; };
const ledger = (p, delta, reason, at) => { p.credits += delta; d.ledger.push({ id: store.id('led'), parentId: p.id, delta, balance: p.credits, reason, at }); };
const pay = (p, packId, label, amount, credits, at) => { d.payments.push({ id: store.id('pay'), parentId: p.id, parentName: p.name, packId, label, amount, currency: 'GBP', credits, provider: 'simulated', status: 'succeeded', createdAt: at }); ledger(p, credits, `Purchase — ${label}`, at); };

if (d.users.some((u) => u.email === DEMO.admins[0].email)) { console.log('Demo data already present. Use `node seed.js --reset` to start over.'); process.exit(0); }

DEMO.admins.forEach((a, i) => d.users.push(mkUser({ role: 'admin', ...a, avatarColor: i ? '#3b6cf6' : '#ef4444' })));
const parent = mkUser({ role: 'parent', ...DEMO.parent, credits: 0, freeLessonUsed: true, cardVerified: true, cardBrand: 'visa', cardLast4: '4242', cardFingerprint: 'demo-parent', avatarColor: '#3b6cf6' });
d.users.push(parent);
pay(parent, 'pack30', '30 lessons', 30, 35, iso(62));

const colors = ['#8b5cf6', '#0ea5a4'];
DEMO.children.forEach((c, ci) => {
  const s = mkUser({ role: 'student', parentId: parent.id, xp: 0, coins: 0, ...c, avatarColor: colors[ci] });
  d.users.push(s);
  const prog = (d.progress[s.id] = {}); const act = (d.activity[s.id] = {}); const sr = (d.review[s.id] = {}); const mis = (d.mistakes[s.id] = []);
  let lessonNo = 0;
  for (const sub of c.subjects) {
    const topics = C.TOPICS.filter((t) => t.subject === sub && t.year <= s.yearGroup && !(sub === 'maths' && s.tier === 'F' && t.tier === 'H'));
    const styles = topics.flatMap((t) => t.styles.map((sid) => ({ sid, t })));
    const share = sub === 'maths' ? (ci === 0 ? 0.45 : 0.4) : ci === 0 ? 0.3 : 0.25;
    const n = Math.round(styles.length * share);
    let dd = 55;
    styles.slice(0, n).forEach(({ sid, t }) => {
      dd = Math.max(0, dd - (Math.random() < 0.55 ? 1 : 0));
      const at = iso(dd);
      const skill = c.skill - (t.year === s.yearGroup ? 0.08 : 0) + (Math.random() - 0.5) * 0.25;
      const results = []; let xp = 0;
      for (let q = 0; q < 10; q++) {
        const r = Math.random();
        if (r < skill) { results.push({ outcome: 'correct', attempts: Math.random() < 0.85 ? 1 : 2, hinted: false }); xp += 10; }
        else if (r < skill + 0.05) results.push({ outcome: 'skipped', attempts: 0, hinted: false });
        else { results.push({ outcome: 'incorrect', attempts: 3, hinted: true }); xp += 1; }
      }
      const correct = results.filter((x) => x.outcome === 'correct').length;
      const skipped = results.filter((x) => x.outcome === 'skipped').length;
      prog[sid] = { done: 10, correct, skipped, incorrect: results.reduce((a, x) => a + (x.outcome === 'incorrect' ? 3 : Math.max(0, x.attempts - 1)), 0), lastAt: at };
      act[at.slice(0, 10)] = (act[at.slice(0, 10)] || 0) + 10;
      s.xp += xp; s.coins += Math.round(xp / 2);
      // spaced-repetition schedule: some due now, others later
      const box = correct >= 8 ? Math.floor(Math.random() * 4) + 1 : 0;
      sr[sid] = { box, due: day(-Math.floor(Math.random() * 10) + 4), lastAt: at };
      // a couple of real mistakes for the mistakes bank
      if (correct < 8 && mis.length < 14) { const q = C.generate(sid); mis.push({ id: store.id('mis'), styleId: sid, q, at, source: 'lesson', tries: 0 }); }
      d.lessons.push({ id: store.id('les'), kind: 'lesson', studentId: s.id, styleId: sid, topicId: t.id, createdAt: at, completedAt: at, status: 'completed', free: false, example: null, questions: Array(10).fill({}), idx: 9, results, xp });
      lessonNo++;
      ledger(parent, -1, `Lesson — ${s.name}: ${C.styleName(sid)}`, at);
    });
    if (styles[n]) prog[styles[n].sid] = { done: 4, correct: 3, skipped: 0, incorrect: 2, lastAt: iso(0) };
  }
  // a few review sessions
  for (let i = 0; i < 3; i++) d.lessons.push({ id: store.id('les'), kind: 'review', studentId: s.id, styleId: null, topicId: null, createdAt: iso(5 - i), completedAt: iso(5 - i), status: 'completed', free: true, example: null, questions: Array(10).fill({}), idx: 9, results: Array(10).fill({ outcome: 'correct', attempts: 1 }), xp: 100 });
  // streak: active the last few days
  for (let k = 0; k < (ci === 0 ? 6 : 3); k++) act[day(k + 1)] = (act[day(k + 1)] || 0) + 8;

  // Exams: maths + science checkpoints up to the current year
  const examList = EXAMS.filter((e) => (e.subject === 'maths' || e.subject === 'biology') && (e.year < s.yearGroup || (e.year === s.yearGroup && e.term === 1)) && e.kind !== 'mock');
  examList.forEach((exam, k) => {
    const pool = C.TOPICS.filter(exam.scope).flatMap((t) => t.styles.map((sid) => ({ sid, t })));
    if (!pool.length) return;
    const qs = []; for (let i = 0; i < exam.questions; i++) { const x = pool[Math.floor(Math.random() * pool.length)]; const q = C.generate(x.sid); Object.assign(q, { styleId: x.sid, topic: x.t.name, strand: x.t.strand, marks: x.t.year >= 10 ? 2 : 1 }); qs.push(q); }
    const at = iso(50 - k * 6);
    const p = Math.min(0.95, c.skill - 0.1 + k * 0.03);
    const marked = qs.map(() => Math.random() < p);
    const answers = qs.map((q, i) => (marked[i] ? q.answer : ''));
    const max = qs.reduce((t, q) => t + q.marks, 0); const score = qs.reduce((t, q, i) => t + (marked[i] ? q.marks : 0), 0);
    const pct = Math.round((score / max) * 100);
    const by = {}; qs.forEach((q, i) => { const b = (by[q.strand] = by[q.strand] || { score: 0, max: 0 }); b.max += q.marks; if (marked[i]) b.score += q.marks; });
    d.examAttempts.push({ id: store.id('exm'), studentId: s.id, examId: exam.id, subject: exam.subject, kind: exam.kind, name: exam.name, tier: s.tier, startedAt: at, deadline: at, submittedAt: at, questions: qs, answers, marked, max, score, pct, grade: gradeFor(pct, s.tier), byStrand: by, xp: score * 4 });
    s.xp += score * 4; s.coins += score * 2;
    ledger(parent, -1, `Exam — ${s.name}: ${exam.name}`, at);
  });
  s.goals = [{ id: store.id('gol'), type: 'lessons', target: 20, reward: ci === 0 ? 'Cinema trip 🎬' : 'New art set 🎨', createdAt: iso(10), baseline: Math.max(0, lessonNo - 6), createdBy: parent.id }];
});

// keep the demo family in credit
let k = 0;
while (parent.credits < 15) { pay(parent, 'pack30', '30 lessons', 30, 35, iso(40 - k * 7)); k++; }
d.ledger.sort((a, b) => (a.at < b.at ? 1 : -1));
d.payments.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));

// Extra families so the admin dashboard has data. Sarah's family has free access (no credits used).
const extra = [['Sarah Thompson', 'sarah@example.test', [['Oliver', 10, 'H', 7]], true], ['James Patel', 'james@example.test', [['Aisha', 11, 'H', 9], ['Ravi', 8, 'F', 5]], false], ['Emma Wilson', 'emma@example.test', [['Lily', 7, 'F', 5]], false]];
extra.forEach(([name, email, kids, free], i) => {
  const p = mkUser({ role: 'parent', name, email, password: 'Parent#2026', credits: 0, freeLessonUsed: true, freeAccess: free, avatarColor: ['#f59e0b', '#ec4899', '#10b981'][i] });
  p.createdAt = iso(40 - i * 9); d.users.push(p);
  if (!free) pay(p, ['single', 'pack10', 'pack30'][i], ['1 lesson', '10 lessons', '30 lessons'][i], [1, 10, 30][i], [1, 11, 35][i], iso(30 - i * 8));
  kids.forEach(([n, y, t, g]) => d.users.push(mkUser({ role: 'student', parentId: p.id, name: n, username: n.toLowerCase() + (100 + i), password: 'Student#2026', yearGroup: y, tier: t, targetGrade: g, xp: 0, coins: 0, subjects: C.SUBJECTS.map((s) => s.id), avatarColor: '#6366f1' })));
});

// Sample tasks, missions and gift tickets for the demo family
d.tasks = d.tasks || []; d.tickets = d.tickets || [];
const kidsDemo = d.users.filter((u) => u.role === 'student' && u.parentId === parent.id);
kidsDemo.forEach((k, i) => {
  const T = (o) => d.tasks.push({ id: store.id('tsk'), studentId: k.id, createdBy: parent.id, createdByRole: 'parent', createdAt: iso(3), status: 'todo', done: {}, notes: '', dueTime: '', until: '', subject: null, ref: null, priority: 'normal', coins: 0, requiresApproval: false, recurrence: 'none', kind: 'custom', ...o });
  T({ title: 'Daily review (10 min)', kind: 'review', recurrence: 'weekdays', dueDate: day(10), coins: 10, priority: 'high' });
  T({ title: 'Science homework — worksheet 3', subject: 'biology', dueDate: day(-2), dueTime: '18:00', coins: 40, requiresApproval: true });
  T({ title: 'Read 20 pages of your book', subject: 'english-literature', recurrence: 'daily', dueDate: day(6), coins: 15, requiresApproval: true, priority: 'low' });
  T({ title: 'Maths lesson before Friday', kind: 'lesson', subject: 'maths', dueDate: day(-3), coins: 25 });
  const hw = T({ title: 'Tidy notes for the history test', subject: 'history', dueDate: day(1), coins: 30, requiresApproval: true });
  d.tasks[d.tasks.length - 1].done = { [day(1)]: { at: iso(1) } }; // waiting for approval
  d.tasks.push({ id: store.id('tsk'), studentId: k.id, createdBy: k.id, createdByRole: 'student', createdAt: iso(1), status: 'doing', done: {}, notes: 'Pages 12–18', dueTime: '', until: '', subject: 'geography', ref: null, priority: 'normal', coins: 0, requiresApproval: false, recurrence: 'none', kind: 'custom', title: 'Make flashcards on coasts', dueDate: day(-1) });
  if (i === 0) {
    d.tickets.push({ id: store.id('tkt'), studentId: k.id, studentName: k.name, parentId: parent.id, cardId: 'roblox', cardName: 'Roblox', icon: '🧱', value: 5, coins: 2000, status: 'delivered', createdAt: iso(20), deliveredAt: iso(19), reply: 'Well done! 🎉', code: 'DEMO-1234-ABCD' });
    d.tickets.push({ id: store.id('tkt'), studentId: k.id, studentName: k.name, parentId: parent.id, cardId: 'appstore', cardName: 'App Store & iTunes', icon: '🍎', value: 5, coins: 2000, status: 'pending', createdAt: iso(0), note: 'For a new game please!' });
  }
});

// award badges / certificates / levels earned by the sample activity (marked as already seen)
for (const s of d.users.filter((u) => u.role === 'student')) { checkRewards(s); checkRewards(s); (s.inbox || []).forEach((e) => (e.seen = true)); s.coins = s.username === 'emirhan' ? 2600 : Math.min(s.coins || 0, 380 + Math.floor(Math.random() * 120)); }

d.audit.unshift({ at: new Date().toISOString(), actor: null, actorName: 'system', action: 'seed', detail: 'Demo data created' });
store.flush();
console.log('Demo data created. Accounts are listed in README.md (Demo accounts).');
