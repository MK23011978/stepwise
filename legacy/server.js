// Stepwise GCSE Maths — zero-dependency Node server (Node >= 18).
const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const store = require('./db');
const C = require('../packages/content-seed/registry.cjs');
const LEARN = C.LEARN;
const ST = (id) => C.getStyle(id);

const PORT = Number(process.env.PORT || 3000);
const PUBLIC = path.join(__dirname, 'public');
const SESSION_DAYS = 14;
const SECURE = process.env.COOKIE_SECURE === 'true' ? '; Secure' : ''; // set COOKIE_SECURE=true behind HTTPS

// ---------- Pricing ----------
const PRICE_PER_LESSON = 1; // £1 = 1 credit
const PRICES = { lesson: 1, exam: 1, test: 1, review: 0 };
const PACKS = [
  { id: 'single', credits: 1, bonus: 0, price: 1.0, label: '1 lesson' },
  { id: 'pack10', credits: 10, bonus: 1, price: 10.0, label: '10 lessons', tag: '+1 free' },
  { id: 'pack30', credits: 30, bonus: 5, price: 30.0, label: '30 lessons', tag: '+5 free · best value' },
];
const QUESTIONS_PER_LESSON = 10;

// ---------- Payments (Stripe) ----------
// Without keys the app runs in demo mode (simulated payments, no card fields at all).
const STRIPE_SECRET = process.env.STRIPE_SECRET_KEY || '';
const STRIPE_PK = process.env.STRIPE_PUBLISHABLE_KEY || '';
const STRIPE_WHSEC = process.env.STRIPE_WEBHOOK_SECRET || '';
const STRIPE_LIVE = !!(STRIPE_SECRET && STRIPE_PK);
const REQUIRE_CARD_FOR_TRIAL = process.env.REQUIRE_CARD_FOR_TRIAL !== 'false';
const REVIEW_IN_LESSON = 2;           // past questions mixed into every lesson
const REVIEW_SESSION_SIZE = 10;
const SR_INTERVALS = [1, 2, 4, 7, 15, 30, 60]; // spaced-repetition box → days until next review
const REWARD_EVERY_LESSONS = 10;      // +1 free credit for every 10 completed lessons

// ---------- Exams (checkpoints / mocks / topic tests) ----------
const TERM_NAMES = { 1: 'Autumn', 2: 'Spring', 3: 'Summer' };
const BOUNDARIES = [[9, 85], [8, 75], [7, 65], [6, 55], [5, 45], [4, 35], [3, 25], [2, 15], [1, 5]];
const YEARS = [...new Set(C.TOPICS.map((t) => t.year))].sort((a, b) => a - b);

// Maths keeps its original exam ids (y8-autumn, gcse-higher…); other subjects are prefixed with the subject id.
function buildExams() {
  const exams = [];
  for (const sub of C.SUBJECTS) {
    const pre = sub.id === 'maths' ? '' : `${sub.id}-`;
    const label = sub.id === 'maths' ? '' : `${sub.name} `;
    const has = (fn) => C.TOPICS.some((t) => t.subject === sub.id && fn(t));
    for (const y of YEARS) {
      const add = (e) => { const scope = (t) => t.subject === sub.id && e.match(t); if (has(e.match)) exams.push({ ...e, subject: sub.id, scope }); };
      add({ id: `${pre}y${y}-autumn`, year: y, term: 1, kind: 'checkpoint', name: `Year ${y} ${label}Autumn Checkpoint`, questions: 12, minutes: 25, match: (t) => t.year === y && t.term === 1 });
      add({ id: `${pre}y${y}-spring`, year: y, term: 2, kind: 'checkpoint', name: `Year ${y} ${label}Spring Checkpoint`, questions: 12, minutes: 25, match: (t) => t.year === y && t.term <= 2 });
      add({ id: `${pre}y${y}-summer`, year: y, term: 3, kind: 'end-of-year', name: `Year ${y} ${label}End-of-Year Exam`, questions: 20, minutes: 45, match: (t) => t.year <= y, weightCurrent: y });
    }
    const gcse = (t) => t.subject === sub.id && t.year >= 9;
    if (sub.tiers) {
      exams.push({ id: `${pre}gcse-foundation`, subject: sub.id, year: 11, term: 3, kind: 'mock', tier: 'F', name: `GCSE ${sub.name} Mock — Foundation`, questions: 25, minutes: 60, scope: (t) => gcse(t) && t.tier !== 'H' });
      exams.push({ id: `${pre}gcse-higher`, subject: sub.id, year: 11, term: 3, kind: 'mock', tier: 'H', name: `GCSE ${sub.name} Mock — Higher`, questions: 25, minutes: 60, scope: gcse });
    } else if (C.TOPICS.some(gcse)) {
      exams.push({ id: `${pre}gcse-mock`, subject: sub.id, year: 11, term: 3, kind: 'mock', name: `GCSE ${sub.name} Mock`, questions: 25, minutes: 60, scope: gcse });
    }
  }
  return exams.map(({ match, ...e }) => e);
}
const EXAMS = buildExams();

function examDef(id) {
  if (typeof id === 'string' && id.startsWith('topic:')) {
    const t = C.getTopic(id.slice(6)); if (!t) return null;
    return { id, subject: t.subject, year: t.year, term: t.term, kind: 'topic', topicId: t.id, name: `${t.name} — Topic Test`, questions: 15, minutes: 25, scope: (x) => x.id === t.id };
  }
  return EXAMS.find((e) => e.id === id) || null;
}
const subjectName = (id) => C.getSubject(id)?.name || id;
const targetFor = (s, subject) => (s.targets && s.targets[subject]) || s.targetGrade || 7;

function gradeFor(pct, tier) {
  for (const [g, min] of BOUNDARIES) if (pct >= min) return tier === 'F' ? Math.min(g, 5) : g;
  return 'U';
}

// ---------- Rewards catalogue ----------
const SHOP = [
  ...[['fox', '🦊', 60], ['panda', '🐼', 60], ['cat', '🐱', 60], ['frog', '🐸', 80], ['owl', '🦉', 80], ['lion', '🦁', 120], ['tiger', '🐯', 120],
    ['octopus', '🐙', 150], ['robot', '🤖', 200], ['alien', '👽', 200], ['unicorn', '🦄', 300], ['dragon', '🐲', 400], ['rocket', '🚀', 500], ['crown', '👑', 800]]
    .map(([id, emoji, price]) => ({ id: `avatar-${id}`, kind: 'avatar', name: id[0].toUpperCase() + id.slice(1), emoji, price })),
  ...[['ocean', 'linear-gradient(135deg,#0ea5e9,#6366f1)', 150], ['sunset', 'linear-gradient(135deg,#f97316,#ec4899)', 150], ['forest', 'linear-gradient(135deg,#10b981,#065f46)', 150],
    ['galaxy', 'linear-gradient(135deg,#7c3aed,#0f172a)', 250], ['gold', 'linear-gradient(135deg,#f59e0b,#fde047)', 600]]
    .map(([id, css, price]) => ({ id: `bg-${id}`, kind: 'background', name: id[0].toUpperCase() + id.slice(1), css, price })),
  { id: 'streak-freeze', kind: 'consumable', name: 'Streak Freeze', emoji: '🧊', price: 120, desc: 'Protects your streak if you miss a day' },
];

// ---------- helpers ----------
const now = () => new Date().toISOString();
const today = () => new Date().toISOString().slice(0, 10);
const addDays = (n, from = new Date()) => { const d = new Date(from); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); };
const D = () => store.data;
const shuffle = (a) => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };

class HttpError extends Error { constructor(status, msg) { super(msg); this.status = status; } }
const fail = (status, msg) => { throw new HttpError(status, msg); };

function send(res, status, body, headers = {}) {
  const data = typeof body === 'string' ? body : JSON.stringify(body);
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', ...headers });
  res.end(data);
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let size = 0; const chunks = [];
    req.on('data', (c) => { size += c.length; if (size > 1e6) { reject(new HttpError(413, 'Payload too large')); req.destroy(); } else chunks.push(c); });
    req.on('end', () => {
      if (!chunks.length) return resolve({});
      try { resolve(JSON.parse(Buffer.concat(chunks).toString('utf8'))); } catch { reject(new HttpError(400, 'Invalid JSON')); }
    });
    req.on('error', reject);
  });
}

function parseCookies(req) {
  const out = {};
  (req.headers.cookie || '').split(';').forEach((p) => {
    const i = p.indexOf('='); if (i > 0) out[p.slice(0, i).trim()] = decodeURIComponent(p.slice(i + 1).trim());
  });
  return out;
}

function audit(actor, action, detail) {
  D().audit.unshift({ at: now(), actor: actor ? actor.id : null, actorName: actor ? actor.name : 'system', action, detail });
  D().audit.length = Math.min(D().audit.length, 500);
}

const COLORS = ['#3b6cf6', '#8b5cf6', '#0ea5a4', '#f59e0b', '#ec4899', '#10b981', '#ef4444', '#6366f1'];
const pickColor = () => COLORS[Math.floor(Math.random() * COLORS.length)];

function str(v, max = 120) { return typeof v === 'string' ? v.trim().slice(0, max) : ''; }
function validEmail(e) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e); }
function validPassword(p) { if (typeof p !== 'string' || p.length < 8) fail(400, 'Password must be at least 8 characters'); }

function findUser(idv) { return D().users.find((u) => u.id === idv); }
function children(parentId) { return D().users.filter((u) => u.role === 'student' && u.parentId === parentId); }
function walletOwner(user) { return user.role === 'student' ? findUser(user.parentId) : user; }

function publicUser(u) {
  if (!u) return null;
  const { passHash, salt, inbox, cardFingerprint, stripeCustomerId, ...rest } = u;
  return rest;
}

// ---------- auth ----------
function createSession(res, user) {
  const token = crypto.randomBytes(32).toString('hex');
  D().sessions[token] = { userId: user.id, expires: Date.now() + SESSION_DAYS * 864e5 };
  user.lastLoginAt = now();
  store.save();
  res.setHeader('Set-Cookie', `sid=${token}; HttpOnly; Path=/; SameSite=Lax; Max-Age=${SESSION_DAYS * 86400}${SECURE}`);
}

function currentUser(req) {
  const token = parseCookies(req).sid;
  const s = token && D().sessions[token];
  if (!s) return null;
  if (s.expires < Date.now()) { delete D().sessions[token]; return null; }
  const u = findUser(s.userId);
  if (!u || u.status !== 'active') return null;
  return u;
}

const loginAttempts = new Map();
function throttle(key) {
  const rec = loginAttempts.get(key) || { n: 0, t: Date.now() };
  if (Date.now() - rec.t > 10 * 60e3) { rec.n = 0; rec.t = Date.now(); }
  rec.n++; loginAttempts.set(key, rec);
  if (rec.n > 10) fail(429, 'Too many attempts. Try again in a few minutes.');
}

// Can `user` see/act for student `sid`?
function studentFor(user, sid) {
  const s = findUser(sid);
  if (!s || s.role !== 'student') fail(404, 'Student not found');
  if (user.role === 'admin') return s;
  if (user.role === 'parent' && s.parentId === user.id) return s;
  if (user.role === 'student' && user.id === s.id) return s;
  fail(403, 'Not allowed');
}

// ---------- credits ----------
function adjustCredits(owner, delta, reason, actor) {
  owner.credits = (owner.credits || 0) + delta;
  D().ledger.unshift({ id: store.id('led'), parentId: owner.id, delta, balance: owner.credits, reason, at: now(), by: actor ? actor.id : null });
}

// Free access can be granted by an admin to a parent (whole family) or to a single student.
function hasFreeAccess(user, student) {
  const owner = walletOwner(user);
  return !!((owner && owner.freeAccess) || (student && student.freeAccess) || (student && findUser(student.parentId)?.freeAccess));
}

function chargeOrFree(user, kind, label, student) {
  const cost = PRICES[kind] || 0;
  if (!cost) return { free: true };
  const owner = student ? findUser(student.parentId) : walletOwner(user);
  if (!owner) fail(400, 'No account to charge');
  if (hasFreeAccess(user, student)) {
    D().ledger.unshift({ id: store.id('led'), parentId: owner.id, delta: 0, balance: owner.credits || 0, reason: `Free access — ${label}`, at: now() });
    return { free: true };
  }
  if (kind === 'lesson' && !owner.freeLessonUsed) {
    // free trial needs a £0 card check first (prevents repeat sign-ups claiming endless free lessons)
    // (a family that already has credits but no card check simply pays for the lesson instead)
    const needsCheck = REQUIRE_CARD_FOR_TRIAL && !owner.cardVerified;
    if (needsCheck && (owner.credits || 0) < cost) fail(428, 'CARD_CHECK_REQUIRED');
    if (!needsCheck) {
    owner.freeLessonUsed = true;
    D().ledger.unshift({ id: store.id('led'), parentId: owner.id, delta: 0, balance: owner.credits || 0, reason: `Free trial lesson — ${label}`, at: now() });
    return { free: true };
    }
  }
  if ((owner.credits || 0) < cost) fail(402, 'Not enough lesson credits. Top up to continue (£1 per lesson).');
  adjustCredits(owner, -cost, `${{ exam: 'Exam', test: 'Topic test', lesson: 'Lesson' }[kind]} — ${label}`);
  return { free: false };
}

// ---------- progress & gamification ----------
function prog(sid) { return (D().progress[sid] = D().progress[sid] || {}); }
function srMap(sid) { D().review = D().review || {}; return (D().review[sid] = D().review[sid] || {}); }
function mistakes(sid) { D().mistakes = D().mistakes || {}; return (D().mistakes[sid] = D().mistakes[sid] || []); }

function addXp(student, xp) {
  if (!xp) return;
  student.xp = (student.xp || 0) + xp;
  student.coins = (student.coins || 0) + Math.max(1, Math.round(xp / 2));
}

function markActive(student, n = 1) {
  const a = (D().activity[student.id] = D().activity[student.id] || {});
  a[today()] = (a[today()] || 0) + n;
}

function recordAnswer(student, styleId, outcome, xp) {
  const p = prog(student.id);
  const r = (p[styleId] = p[styleId] || { done: 0, correct: 0, incorrect: 0, skipped: 0, lastAt: null });
  if (outcome === 'correct') { r.done++; r.correct++; }
  else if (outcome === 'skipped') { r.done++; r.skipped++; }
  else if (outcome === 'wrong-final') { r.done++; }
  else if (outcome === 'incorrect') { r.incorrect++; }
  r.lastAt = now();
  if (outcome !== 'incorrect') markActive(student);
  addXp(student, xp || 0);
}

function srUpdate(student, styleId, good) {
  const m = srMap(student.id);
  const e = m[styleId] || { box: -1 };
  e.box = good ? Math.min(SR_INTERVALS.length - 1, e.box + 1) : 0;
  e.due = addDays(SR_INTERVALS[e.box]);
  e.lastAt = now();
  m[styleId] = e;
}

function addMistake(student, q, styleId, source) {
  const list = mistakes(student.id);
  if (q.mistakeId) { const m = list.find((x) => x.id === q.mistakeId); if (m) { m.tries = (m.tries || 0) + 1; m.at = now(); return; } }
  const { mistakeId, review, ...clean } = q;
  list.unshift({ id: store.id('mis'), styleId, q: clean, at: now(), source, tries: 0 });
  if (list.length > 200) list.length = 200;
}

function resolveMistake(student, mistakeId) {
  const list = mistakes(student.id);
  const i = list.findIndex((x) => x.id === mistakeId);
  if (i >= 0) { list.splice(i, 1); student.mistakesFixed = (student.mistakesFixed || 0) + 1; student.fixedLog = student.fixedLog || {}; student.fixedLog[today()] = (student.fixedLog[today()] || 0) + 1; }
}

function levelInfo(xp = 0) {
  const level = Math.floor(Math.sqrt(xp / 60)) + 1;
  const cur = 60 * (level - 1) ** 2, next = 60 * level ** 2;
  return { level, xp, cur, next, pct: Math.round(((xp - cur) / (next - cur)) * 100) };
}

function streak(student) {
  const a = D().activity[student.id] || {};
  const frozen = new Set(student.frozenDays || []);
  const has = (k) => a[k] || frozen.has(k);
  let n = 0; const d = new Date();
  if (!has(d.toISOString().slice(0, 10))) d.setUTCDate(d.getUTCDate() - 1);
  while (has(d.toISOString().slice(0, 10))) { if (a[d.toISOString().slice(0, 10)]) n++; d.setUTCDate(d.getUTCDate() - 1); }
  return n;
}

// Use a streak freeze automatically if yesterday was missed but the day before was active.
function applyFreeze(student) {
  if (!student.freezes) return;
  const a = D().activity[student.id] || {};
  const y = addDays(-1), y2 = addDays(-2);
  const frozen = new Set(student.frozenDays || []);
  if (!a[y] && !frozen.has(y) && (a[y2] || frozen.has(y2))) {
    student.freezes--; student.frozenDays = [...frozen, y].slice(-30);
    pushInbox(student, { type: 'freeze', title: 'Streak saved!', text: 'A Streak Freeze protected your streak yesterday.', icon: '🧊' });
  }
}

function styleStatus(r) {
  if (!r || (!r.done && !r.incorrect)) return 'new';
  const answered = r.done - r.skipped;
  const acc = answered ? r.correct / answered : 0;
  if (r.done >= QUESTIONS_PER_LESSON && acc >= 0.8) return 'mastered';
  if (r.done >= QUESTIONS_PER_LESSON) return 'completed';
  return 'started';
}

function inScope(student, t) {
  if (t.year > student.yearGroup) return false;
  if (student.tier === 'F' && t.tier === 'H' && C.getSubject(t.subject)?.tiers) return false;
  return true;
}

function completedLessons(sid) { return D().lessons.filter((l) => l.studentId === sid && l.status === 'completed' && l.kind !== 'review').length; }
function completedReviews(sid) { return D().lessons.filter((l) => l.studentId === sid && l.status === 'completed' && l.kind === 'review').length; }
function finishedExams(sid) { return D().examAttempts.filter((e) => e.studentId === sid && e.submittedAt).sort((a, b) => (a.submittedAt < b.submittedAt ? -1 : 1)); }

const attemptSubject = (a) => a.subject || examDef(a.examId)?.subject || 'maths';

// subject = null → across all subjects ("strands" then become one entry per subject)
function summary(student, subject = null) {
  const p = prog(student.id);
  let correct = 0, incorrect = 0, skipped = 0, done = 0, mastered = 0, scopeStyles = 0, scopeTouched = 0, scopeCorrect = 0, scopeAnswered = 0;
  const groupOf = (t) => (subject ? t.strand : t.subject);
  const groups = subject ? C.STRANDS.filter((s) => s.subject === subject) : C.SUBJECTS;
  const agg = {};
  for (const g of groups) agg[g.id] = { correct: 0, answered: 0, styles: 0, mastered: 0 };
  for (const t of C.TOPICS) {
    if (subject && t.subject !== subject) continue;
    const inS = inScope(student, t);
    const a = agg[groupOf(t)] || (agg[groupOf(t)] = { correct: 0, answered: 0, styles: 0, mastered: 0 });
    for (const sid of t.styles) {
      const r = p[sid];
      const st = styleStatus(r);
      if (inS) { scopeStyles++; a.styles++; }
      if (st === 'mastered') { mastered++; if (inS) a.mastered++; }
      if (!r) continue;
      correct += r.correct; incorrect += r.incorrect; skipped += r.skipped; done += r.done;
      if (inS) {
        if (r.done) scopeTouched++;
        scopeCorrect += r.correct; scopeAnswered += r.done - r.skipped;
        a.correct += r.correct; a.answered += r.done - r.skipped;
      }
    }
  }
  const exams = finishedExams(student.id).filter((e) => !subject || attemptSubject(e) === subject);
  const accuracy = scopeAnswered ? scopeCorrect / scopeAnswered : null;
  const coverage = scopeStyles ? scopeTouched / scopeStyles : 0;
  // Predicted grade: blend of practice accuracy (scaled by coverage) and recent exam performance.
  let predicted = null;
  if (subject && (scopeAnswered >= 10 || exams.length)) {
    const practice = accuracy == null ? null : accuracy * 100 * (0.55 + 0.45 * coverage);
    const recent = exams.filter((e) => e.kind !== 'topic').slice(-3);
    const examPct = recent.length ? recent.reduce((s, e) => s + e.pct, 0) / recent.length : null;
    const blended = practice == null ? (examPct ?? 0) : examPct == null ? practice : practice * 0.4 + examPct * 0.6;
    predicted = gradeFor(blended, C.getSubject(subject)?.tiers ? student.tier : 'H');
  }
  const strands = groups.map((s) => {
    const a = agg[s.id];
    return { id: s.id, name: s.name, color: s.color, icon: s.icon, accuracy: a.answered ? Math.round((a.correct / a.answered) * 100) : null, mastered: a.mastered, styles: a.styles };
  });
  const lessonsCompleted = completedLessons(student.id);
  const sumObj = {
    correct, incorrect, skipped, done, mastered, accuracy: accuracy == null ? null : Math.round(accuracy * 100),
    coverage: Math.round(coverage * 100), scopeStyles, predicted, targetGrade: student.targetGrade,
    level: levelInfo(student.xp), streak: streak(student), coins: student.coins || 0, freezes: student.freezes || 0,
    strands, lessonsCompleted, reviewsCompleted: completedReviews(student.id), mistakesFixed: student.mistakesFixed || 0,
    nextReward: REWARD_EVERY_LESSONS - (lessonsCompleted % REWARD_EVERY_LESSONS),
    subject, exams: exams.filter((e) => e.kind !== 'topic').map((e) => ({ id: e.id, examId: e.examId, subject: attemptSubject(e), name: e.name, pct: e.pct, grade: e.grade, at: e.submittedAt })),
    certificates: (student.certificates || []).length,
  };
  sumObj.badges = badgeDefs(student, sumObj, exams).map((b) => ({ ...b, at: (student.badges || {})[b.id] || null }));
  return sumObj;
}

function badgeDefs(student, s, exams) {
  const lessons = D().lessons.filter((l) => l.studentId === student.id && l.status === 'completed' && l.kind !== 'review');
  const perfect = lessons.some((l) => l.results.length && l.results.every((r) => r.outcome === 'correct' && r.attempts === 1));
  const certs = student.certificates || [];
  return [
    { id: 'first-lesson', name: 'First Steps', desc: 'Complete your first lesson', icon: '🚀', got: lessons.length >= 1 },
    { id: 'ten-lessons', name: 'Committed', desc: 'Complete 10 lessons', icon: '📚', got: lessons.length >= 10 },
    { id: 'fifty-lessons', name: 'Dedicated', desc: 'Complete 50 lessons', icon: '🎒', got: lessons.length >= 50 },
    { id: 'perfect', name: 'Flawless', desc: 'Get every question right first time in a lesson', icon: '💎', got: perfect },
    { id: 'c50', name: 'Half Century', desc: '50 correct answers', icon: '🎯', got: s.correct >= 50 },
    { id: 'c250', name: 'Sharpshooter', desc: '250 correct answers', icon: '🏹', got: s.correct >= 250 },
    { id: 'c1000', name: 'Thousand Club', desc: '1,000 correct answers', icon: '🥇', got: s.correct >= 1000 },
    { id: 'streak3', name: 'On a Roll', desc: '3-day streak', icon: '🔥', got: s.streak >= 3 },
    { id: 'streak7', name: 'Week Warrior', desc: '7-day streak', icon: '⚡', got: s.streak >= 7 },
    { id: 'streak30', name: 'Unstoppable', desc: '30-day streak', icon: '🌋', got: s.streak >= 30 },
    { id: 'master5', name: 'Skill Builder', desc: 'Master 5 styles', icon: '🧩', got: s.mastered >= 5 },
    { id: 'master25', name: 'Topic Titan', desc: 'Master 25 styles', icon: '🏆', got: s.mastered >= 25 },
    { id: 'master100', name: 'Maths Legend', desc: 'Master 100 styles', icon: '👑', got: s.mastered >= 100 },
    { id: 'review1', name: 'Look Back', desc: 'Complete a review session', icon: '🔁', got: s.reviewsCompleted >= 1 },
    { id: 'review10', name: 'Memory Master', desc: 'Complete 10 review sessions', icon: '🧠', got: s.reviewsCompleted >= 10 },
    { id: 'fix10', name: 'Fixer', desc: 'Fix 10 past mistakes', icon: '🔧', got: s.mistakesFixed >= 10 },
    { id: 'exam1', name: 'Test Taker', desc: 'Complete an exam or topic test', icon: '📝', got: exams.length >= 1 },
    { id: 'grade7', name: 'Grade 7+', desc: 'Score grade 7 or above in an exam', icon: '🌟', got: exams.some((e) => typeof e.grade === 'number' && e.grade >= 7) },
    { id: 'grade9', name: 'Top Grade', desc: 'Score grade 9 in an exam', icon: '💫', got: exams.some((e) => e.grade === 9) },
    { id: 'cert-topic', name: 'Certified', desc: 'Earn a topic certificate', icon: '📜', got: certs.some((c) => c.kind === 'topic') },
    { id: 'cert-year', name: 'Year Complete', desc: 'Complete a whole school year', icon: '🎓', got: certs.some((c) => c.kind === 'year') },
    { id: 'level10', name: 'Level 10', desc: 'Reach level 10', icon: '🔟', got: s.level.level >= 10 },
  ];
}

// ---------- parent goals ----------
const GOAL_TYPES = {
  lessons: { label: 'Complete lessons', metric: (s) => completedLessons(s.id), relative: true },
  mastered: { label: 'Master question styles', metric: (s) => summary(s).mastered, relative: true },
  xp: { label: 'Earn XP', metric: (s) => s.xp || 0, relative: true },
  streak: { label: 'Reach a day streak of', metric: (s) => streak(s), relative: false },
  grade: { label: 'Score at least grade', metric: (s, g) => Math.max(0, ...finishedExams(s.id).filter((e) => e.submittedAt >= g.createdAt && typeof e.grade === 'number').map((e) => e.grade)), relative: false },
  reviews: { label: 'Complete review sessions', metric: (s) => completedReviews(s.id), relative: true },
};
function goalView(s, g) {
  const T = GOAL_TYPES[g.type]; const v = T.metric(s, g);
  const progress = T.relative ? v - g.baseline : v;
  return { ...g, label: T.label, progress: Math.max(0, Math.min(progress, g.target)), pct: Math.min(100, Math.round((Math.max(0, progress) / g.target) * 100)) };
}

// ---------- reward engine ----------
function pushInbox(student, ev) {
  student.inbox = student.inbox || [];
  student.inbox.unshift({ id: store.id('evt'), at: now(), seen: false, ...ev });
  if (student.inbox.length > 60) student.inbox.length = 60;
}

// Detects newly earned rewards, applies them, and returns the events to celebrate.
function checkRewards(student) {
  const events = [];
  // free-lesson milestone
  const done = completedLessons(student.id);
  const due = Math.floor(done / REWARD_EVERY_LESSONS);
  student.milestones = student.milestones || 0;
  while (student.milestones < due) {
    student.milestones++;
    const parent = findUser(student.parentId);
    if (parent) adjustCredits(parent, 1, `Reward — ${student.name} completed ${student.milestones * REWARD_EVERY_LESSONS} lessons`);
    events.push({ type: 'milestone', title: `${student.milestones * REWARD_EVERY_LESSONS} lessons completed!`, text: 'You earned a FREE lesson for your family wallet. 🎁', icon: '🎁' });
  }
  // certificates
  student.certificates = student.certificates || [];
  const has = (k) => student.certificates.some((c) => c.key === k);
  const p = prog(student.id);
  for (const t of C.TOPICS) {
    if (!has(`topic:${t.id}`) && t.styles.every((sid) => styleStatus(p[sid]) === 'mastered')) {
      const c = { id: store.id('crt'), key: `topic:${t.id}`, kind: 'topic', title: t.name, subtitle: `${subjectName(t.subject)} · Year ${t.year} · ${C.STRANDS.find((x) => x.id === t.strand)?.name}`, at: now() };
      student.certificates.push(c); addXp(student, 50);
      events.push({ type: 'certificate', title: 'Topic certificate earned!', text: `You mastered every style in ${t.name}. +50 XP`, icon: '📜', certId: c.id });
    }
  }
  for (const sub of C.SUBJECTS) for (const y of YEARS) {
    const ts = C.TOPICS.filter((t) => t.subject === sub.id && t.year === y && !(sub.tiers && student.tier === 'F' && t.tier === 'H'));
    const key = `year:${sub.id}:${y}`;
    if (ts.length && !has(key) && ts.every((t) => t.styles.every((sid) => ['completed', 'mastered'].includes(styleStatus(p[sid]))))) {
      const c = { id: store.id('crt'), key, kind: 'year', title: `Year ${y} ${sub.id === 'maths' ? 'Mathematics' : sub.name}`, subtitle: 'Every topic completed', at: now() };
      student.certificates.push(c); addXp(student, 200); student.coins = (student.coins || 0) + 200;
      events.push({ type: 'certificate', title: `Year ${y} ${sub.name} complete!`, text: 'An amazing achievement. +200 XP and 200 coins!', icon: '🎓', certId: c.id });
    }
  }
  // badges
  student.badges = student.badges || {};
  for (const b of summary(student).badges) if (b.got && !student.badges[b.id]) {
    student.badges[b.id] = now(); addXp(student, 20);
    events.push({ type: 'badge', title: `New badge: ${b.name}`, text: `${b.desc}. +20 XP bonus!`, icon: b.icon });
  }
  // level ups
  const lvl = levelInfo(student.xp).level;
  if (lvl > (student.lastLevel || 1)) {
    const coins = 25 * (lvl - (student.lastLevel || 1));
    student.coins = (student.coins || 0) + coins;
    events.push({ type: 'level', title: `Level ${lvl}!`, text: `You levelled up and earned ${coins} bonus coins.`, icon: '⬆️', level: lvl });
    student.lastLevel = lvl;
  }
  // parent goals
  for (const g of student.goals || []) {
    if (g.achievedAt) continue;
    const v = goalView(student, g);
    if (v.progress >= g.target) {
      g.achievedAt = now();
      events.push({ type: 'goal', title: 'Goal achieved!', text: `${v.label} ${g.target} — your reward: ${g.reward}`, icon: '🎉', goalId: g.id });
    }
  }
  events.forEach((e) => pushInbox(student, e));
  // returned events are being shown right now → mark seen
  if (student.inbox) student.inbox.slice(0, events.length).forEach((e) => (e.seen = true));
  return events;
}

function weeklyActivity(sid, days = 84) {
  const a = D().activity[sid] || {};
  const out = []; const d = new Date(); d.setUTCDate(d.getUTCDate() - days + 1);
  for (let i = 0; i < days; i++) { const k = d.toISOString().slice(0, 10); out.push({ date: k, n: a[k] || 0 }); d.setUTCDate(d.getUTCDate() + 1); }
  return out;
}

function recommendations(student, subject = 'maths') {
  const p = prog(student.id);
  const recs = [];
  const topics = C.TOPICS.filter((t) => t.subject === subject && inScope(student, t)).sort((a, b) => (b.year === student.yearGroup) - (a.year === student.yearGroup) || a.year - b.year || a.term - b.term);
  for (const t of topics) for (const sid of t.styles) {
    const r = p[sid]; if (!r) continue;
    const ans = r.done - r.skipped;
    if (ans >= 4 && r.correct / ans < 0.6) recs.push({ styleId: sid, topicId: t.id, reason: 'Needs practice', topic: t.name, name: ST(sid).name });
  }
  for (const t of topics) for (const sid of t.styles) {
    if (recs.length >= 4) break;
    if (!p[sid]) recs.push({ styleId: sid, topicId: t.id, reason: t.year < student.yearGroup ? 'Catch up' : 'Up next', topic: t.name, name: ST(sid).name });
  }
  return recs.slice(0, 4);
}

function reviewStatus(student) {
  const m = srMap(student.id); const t = today();
  const due = Object.entries(m).filter(([sid, e]) => ST(sid) && e.due <= t).sort((a, b) => (a[1].due < b[1].due ? -1 : 1))
    .map(([sid, e]) => ({ styleId: sid, name: ST(sid).name, topic: C.getTopic(ST(sid).topicId)?.name, box: e.box, due: e.due }));
  const upcoming = Object.entries(m).filter(([sid, e]) => ST(sid) && e.due > t).sort((a, b) => (a[1].due < b[1].due ? -1 : 1)).slice(0, 8)
    .map(([sid, e]) => ({ styleId: sid, name: ST(sid).name, topic: C.getTopic(ST(sid).topicId)?.name, box: e.box, due: e.due }));
  const mis = mistakes(student.id).filter((x) => ST(x.styleId)).map((x) => ({ id: x.id, styleId: x.styleId, name: ST(x.styleId).name, topic: C.getTopic(ST(x.styleId).topicId)?.name, html: x.q.html, at: x.at, source: x.source, tries: x.tries }));
  const boxes = [0, 0, 0, 0, 0, 0, 0]; Object.values(m).forEach((e) => { boxes[Math.max(0, e.box)]++; });
  return { due, dueCount: due.length, upcoming, mistakes: mis, mistakeCount: mis.length, boxes, tracked: Object.keys(m).length };
}

// Pick past-question items: mistakes first, then due styles, then other practised styles.
function pickReviewItems(student, n, excludeStyle) {
  const items = []; const usedStyles = new Set();
  for (const m of mistakes(student.id).slice().reverse()) {
    if (items.length >= Math.ceil(n / 2)) break;
    if (m.styleId === excludeStyle || !ST(m.styleId)) continue;
    items.push({ ...m.q, styleId: m.styleId, review: 'mistake', mistakeId: m.id }); usedStyles.add(m.styleId);
  }
  const due = reviewStatus(student).due.filter((d) => d.styleId !== excludeStyle && !usedStyles.has(d.styleId));
  for (const d of due) { if (items.length >= n) break; items.push({ ...C.generate(d.styleId), styleId: d.styleId, review: 'due' }); usedStyles.add(d.styleId); }
  const practised = shuffle(Object.keys(prog(student.id)).filter((sid) => ST(sid) && sid !== excludeStyle && !usedStyles.has(sid)));
  for (const sid of practised) { if (items.length >= n) break; items.push({ ...C.generate(sid), styleId: sid, review: 'practice' }); }
  return items;
}

// ---------- lessons ----------
function stripQ(q) { const { check, answer, answerHtml, steps, mistakeId, ...rest } = q; return rest; }

function lessonView(l) {
  const cur = l.questions[l.idx];
  const qStyle = (cur && cur.styleId) || l.styleId;
  const style = ST(qStyle) || {}; const topic = C.getTopic(style.topicId) || {};
  const main = l.styleId ? ST(l.styleId) : null;
  const r = l.results[l.idx];
  return {
    id: l.id, kind: l.kind || 'lesson', status: l.status, styleId: l.styleId, styleName: main ? main.name : 'Review session', topicName: main ? C.getTopic(main.topicId).name : 'Past questions',
    intro: main ? main.intro : null, free: l.free, example: l.example, idx: l.idx, total: l.questions.length, xp: l.xp,
    results: l.results.map((x) => x && { outcome: x.outcome, attempts: x.attempts }),
    reviewSlots: l.questions.map((q) => q.review || null),
    question: l.status === 'active' && cur ? { ...stripQ(cur), styleName: style.name, topicName: topic.name, attempts: r ? r.attempts : 0, hinted: r ? r.hinted : false, hint: r && r.hinted ? cur.hint : null } : null,
  };
}

function getLesson(user, lid) {
  const l = D().lessons.find((x) => x.id === lid);
  if (!l) fail(404, 'Lesson not found');
  studentFor(user, l.studentId);
  return l;
}

// ---------- exams ----------
function pickExamQuestions(exam, student) {
  let topics = C.TOPICS.filter(exam.scope);
  if (exam.tier === 'F') topics = topics.filter((t) => t.tier !== 'H');
  else if (!exam.tier && exam.kind !== 'topic' && student.tier === 'F') topics = topics.filter((t) => t.tier !== 'H');
  if (!topics.length) fail(400, 'This exam has no content yet');
  const styles = topics.flatMap((t) => t.styles.map((s) => ({ s, t })));
  const pool = exam.weightCurrent ? styles.flatMap((x) => (x.t.year === exam.weightCurrent ? [x, x, x] : [x])) : styles;
  const qs = []; const used = new Set();
  for (let i = 0; qs.length < exam.questions && i < 1000; i++) {
    const x = exam.kind === 'topic' ? styles[qs.length % styles.length] : pool[Math.floor(Math.random() * pool.length)];
    if (exam.kind !== 'topic' && used.has(x.s) && used.size < styles.length) continue;
    used.add(x.s);
    const q = C.generate(x.s);
    q.styleId = x.s; q.topic = x.t.name; q.strand = x.t.strand; q.marks = x.t.year >= 10 ? 2 : 1;
    qs.push(q);
  }
  return exam.kind === 'topic' ? shuffle(qs) : qs.sort((a, b) => a.marks - b.marks);
}

function examStatus(student, subject = null) {
  const attempts = D().examAttempts.filter((e) => e.studentId === student.id);
  return EXAMS.filter((e) => !subject || e.subject === subject).map((e) => {
    const mine = attempts.filter((a) => a.examId === e.id && a.submittedAt);
    const best = mine.reduce((b, a) => (!b || a.pct > b.pct ? a : b), null);
    const active = attempts.find((a) => a.examId === e.id && !a.submittedAt && Date.parse(a.deadline) > Date.now());
    return { id: e.id, subject: e.subject, name: e.name, year: e.year, term: e.term, termName: TERM_NAMES[e.term], kind: e.kind, tier: e.tier || null, questions: e.questions, minutes: e.minutes,
      attempts: mine.length, best: best ? { pct: best.pct, grade: best.grade, id: best.id } : null, activeId: active ? active.id : null,
      recommended: e.year === student.yearGroup, hasContent: C.TOPICS.some(e.scope) };
  });
}

function topicTestStatus(student) {
  const out = {};
  for (const a of D().examAttempts) {
    if (a.studentId !== student.id || !a.examId.startsWith('topic:')) continue;
    const k = a.examId.slice(6); const o = (out[k] = out[k] || { attempts: 0, best: null, activeId: null });
    if (a.submittedAt) { o.attempts++; if (!o.best || a.pct > o.best.pct) o.best = { pct: a.pct, grade: a.grade, id: a.id }; }
    else if (Date.parse(a.deadline) > Date.now()) o.activeId = a.id;
  }
  return out;
}

function examView(a, reveal) {
  return {
    id: a.id, examId: a.examId, kind: a.kind || 'exam', name: a.name, startedAt: a.startedAt, deadline: a.deadline, submittedAt: a.submittedAt || null,
    score: a.score, max: a.max, pct: a.pct, grade: a.grade, tier: a.tier, byStrand: a.byStrand || null, studentId: a.studentId,
    questions: a.questions.map((q, i) => ({
      ...stripQ(q), n: i + 1,
      ...(reveal ? { answerHtml: q.answerHtml, steps: q.steps, hint: q.hint, given: a.answers ? a.answers[i] : '', correct: a.marked ? a.marked[i] : false,
        styleName: ST(q.styleId)?.name, intro: ST(q.styleId)?.intro, similarDone: !!(a.similar && a.similar[i] && a.similar[i].solved) } : {}),
    })),
  };
}

// ---------- routing ----------
const routes = [];
function route(method, pattern, opts, handler) {
  if (typeof opts === 'function') { handler = opts; opts = {}; }
  const keys = []; const re = new RegExp('^' + pattern.replace(/:(\w+)/g, (_, k) => { keys.push(k); return '([^/]+)'; }) + '$');
  routes.push({ method, re, keys, handler, auth: opts.auth !== false, roles: opts.roles });
}

// Auth
route('POST', '/api/auth/register', { auth: false }, async (req, res, { body }) => {
  const name = str(body.name, 80), email = str(body.email, 160).toLowerCase();
  if (!name) fail(400, 'Please enter your name');
  if (!validEmail(email)) fail(400, 'Please enter a valid email');
  validPassword(body.password);
  if (D().users.some((u) => u.email === email)) fail(409, 'An account with this email already exists');
  const { salt, hash } = store.hashPassword(body.password);
  const u = { id: store.id('usr'), role: 'parent', name, email, salt, passHash: hash, status: 'active', credits: 0, freeLessonUsed: false, createdAt: now(), avatarColor: pickColor() };
  D().users.push(u); audit(u, 'register', email);
  createSession(res, u);
  return { user: publicUser(u) };
});

route('POST', '/api/auth/login', { auth: false }, async (req, res, { body }) => {
  const login = str(body.login, 160).toLowerCase();
  throttle(login + '|' + req.socket.remoteAddress);
  const u = D().users.find((x) => x.email === login || (x.username && x.username === login));
  if (!u || !store.verifyPassword(body.password || '', u.salt, u.passHash)) fail(401, 'Incorrect email/username or password');
  if (u.status !== 'active') fail(403, 'This account is suspended. Contact support.');
  createSession(res, u); audit(u, 'login', '');
  return { user: publicUser(u) };
});

route('POST', '/api/auth/logout', { auth: false }, async (req, res) => {
  const t = parseCookies(req).sid; if (t) delete D().sessions[t];
  res.setHeader('Set-Cookie', `sid=; HttpOnly; Path=/; Max-Age=0; SameSite=Lax${SECURE}`);
  return { ok: true };
});

route('GET', '/api/me', async (req, res, { user }) => {
  const owner = walletOwner(user);
  const free = !!(owner && owner.freeAccess) || (user.role === 'student' && !!user.freeAccess);
  return {
    user: publicUser(user),
    children: user.role === 'parent' ? children(user.id).map(publicUser) : user.role === 'student' ? [publicUser(user)] : [],
    wallet: owner && owner.role !== 'admin' ? { credits: owner.credits || 0, freeLessonAvailable: !owner.freeLessonUsed, freeAccess: free, cardVerified: !!owner.cardVerified, cardCheckRequired: REQUIRE_CARD_FOR_TRIAL && !owner.cardVerified } : null,
  };
});

route('PATCH', '/api/me', async (req, res, { user, body }) => {
  if (body.name) user.name = str(body.name, 80);
  if (body.newPassword) {
    if (!store.verifyPassword(body.currentPassword || '', user.salt, user.passHash)) fail(400, 'Current password is incorrect');
    validPassword(body.newPassword);
    Object.assign(user, (({ salt, hash }) => ({ salt, passHash: hash }))(store.hashPassword(body.newPassword)));
  }
  return { user: publicUser(user) };
});

route('DELETE', '/api/me', { roles: ['parent'] }, async (req, res, { user }) => {
  deleteParent(user); audit(null, 'self-delete', user.email);
  res.setHeader('Set-Cookie', `sid=; HttpOnly; Path=/; Max-Age=0; SameSite=Lax${SECURE}`);
  return { ok: true };
});

function deleteStudent(s) {
  const d = D();
  d.users = d.users.filter((u) => u.id !== s.id);
  delete d.progress[s.id]; delete d.activity[s.id];
  if (d.review) delete d.review[s.id];
  if (d.mistakes) delete d.mistakes[s.id];
  d.lessons = d.lessons.filter((l) => l.studentId !== s.id);
  d.examAttempts = d.examAttempts.filter((l) => l.studentId !== s.id);
  for (const [k, v] of Object.entries(d.sessions)) if (v.userId === s.id) delete d.sessions[k];
}
function deleteParent(p) {
  children(p.id).forEach(deleteStudent);
  const d = D();
  d.users = d.users.filter((u) => u.id !== p.id);
  for (const [k, v] of Object.entries(d.sessions)) if (v.userId === p.id) delete d.sessions[k];
}

// Children (students)
function childInput(body, existing) {
  const out = {};
  if (body.name !== undefined || !existing) { out.name = str(body.name, 60); if (!out.name) fail(400, 'Please enter the child’s name'); }
  if (body.yearGroup !== undefined || !existing) { out.yearGroup = Number(body.yearGroup); if (!YEARS.includes(out.yearGroup)) fail(400, `Year group must be ${YEARS[0]}–${YEARS[YEARS.length - 1]}`); }
  if (body.tier !== undefined || !existing) { out.tier = body.tier === 'F' ? 'F' : 'H'; }
  if (body.targetGrade !== undefined || !existing) { const g = Number(body.targetGrade || 7); out.targetGrade = Math.min(9, Math.max(1, g)); }
  if (body.username !== undefined && body.username !== '') {
    const un = str(body.username, 30).toLowerCase();
    if (!/^[a-z0-9._-]{3,30}$/.test(un)) fail(400, 'Username: 3–30 letters, numbers, dot, dash or underscore');
    if (D().users.some((u) => (u.username === un || u.email === un) && (!existing || u.id !== existing.id))) fail(409, 'That username is taken');
    out.username = un;
  }
  if (body.password) { validPassword(body.password); const { salt, hash } = store.hashPassword(body.password); out.salt = salt; out.passHash = hash; }
  if (Array.isArray(body.subjects)) { out.subjects = body.subjects.filter((x) => C.getSubject(x)); if (!out.subjects.length) out.subjects = ['maths']; }
  else if (!existing) out.subjects = C.SUBJECTS.map((x) => x.id);
  if (body.targets && typeof body.targets === 'object') { out.targets = {}; for (const [k, v] of Object.entries(body.targets)) if (C.getSubject(k)) out.targets[k] = Math.min(9, Math.max(1, Number(v) || 7)); }
  return out;
}

route('POST', '/api/children', { roles: ['parent', 'admin'] }, async (req, res, { user, body }) => {
  const parent = user.role === 'admin' ? findUser(body.parentId) : user;
  if (!parent || parent.role !== 'parent') fail(400, 'Parent account required');
  if (children(parent.id).length >= 6) fail(400, 'Maximum 6 children per account');
  const data = childInput(body, null);
  if (!data.username) { data.username = (data.name.toLowerCase().replace(/[^a-z0-9]/g, '') || 'student') + Math.floor(1000 + Math.random() * 9000); }
  if (!data.passHash) { const { salt, hash } = store.hashPassword(crypto.randomBytes(12).toString('hex')); data.salt = salt; data.passHash = hash; }
  const s = { id: store.id('stu'), role: 'student', parentId: parent.id, status: 'active', xp: 0, coins: 0, createdAt: now(), avatarColor: pickColor(), ...data };
  D().users.push(s); audit(user, 'add-child', s.name);
  return { child: publicUser(s) };
});

route('PATCH', '/api/children/:id', { roles: ['parent', 'admin'] }, async (req, res, { user, params, body }) => {
  const s = studentFor(user, params.id);
  Object.assign(s, childInput(body, s));
  return { child: publicUser(s) };
});

route('DELETE', '/api/children/:id', { roles: ['parent', 'admin'] }, async (req, res, { user, params }) => {
  const s = studentFor(user, params.id);
  deleteStudent(s); audit(user, 'delete-child', s.name);
  return { ok: true };
});

// Curriculum & teaching content
route('GET', '/api/curriculum', { auth: false }, async () => ({
  ...C.publicCurriculum(), years: YEARS, exams: EXAMS.map(({ scope, ...e }) => e),
  learnAvailable: Object.keys(LEARN), pricing: { perLesson: PRICE_PER_LESSON, packs: PACKS, prices: PRICES, rewardEvery: REWARD_EVERY_LESSONS },
}));

route('GET', '/api/curriculum/sample/:styleId', { auth: false }, async (req, res, { params }) => {
  if (!C.getStyle(params.styleId)) fail(404, 'Unknown style');
  const q = C.generate(params.styleId);
  return { intro: C.styleIntro(params.styleId), example: { html: q.html + (q.options ? `<ol type="A">${q.options.map((o) => `<li>${o}</li>`).join('')}</ol>` : ''), diagram: q.diagram, answerHtml: q.answerHtml, steps: q.steps } };
});

route('GET', '/api/learn/:topicId', { auth: false }, async (req, res, { params }) => {
  const t = C.getTopic(params.topicId); if (!t) fail(404, 'Unknown topic');
  const examples = t.styles.slice(0, 3).map((sid) => { const q = C.generate(sid); return { styleId: sid, styleName: ST(sid).name, intro: ST(sid).intro, html: q.html, diagram: q.diagram, options: q.options || null, steps: q.steps, answerHtml: q.answerHtml }; });
  return { topic: { ...t, styles: t.styles.map((id) => ({ id, name: ST(id).name, intro: ST(id).intro })) }, content: LEARN[t.id] || null, examples };
});

// Progress / dashboard
route('GET', '/api/students/:id/overview', async (req, res, { user, params, query }) => {
  const s = studentFor(user, params.id);
  const subject = C.getSubject(query.get('subject')) ? query.get('subject') : 'maths';
  applyFreeze(s);
  const events = checkRewards(s); // catch up any rewards (e.g. after data changes)
  const unseen = (s.inbox || []).filter((e) => !e.seen);
  unseen.forEach((e) => (e.seen = true));
  const rv = reviewStatus(s);
  return {
    student: publicUser(s), subject, summary: { ...summary(s, subject), targetGrade: targetFor(s, subject) }, overall: summary(s), activity: weeklyActivity(s.id), recommendations: recommendations(s, subject), exams: examStatus(s, subject),
    review: { dueCount: rv.dueCount, mistakeCount: rv.mistakeCount }, goals: (s.goals || []).map((g) => goalView(s, g)),
    rewards: [...events, ...unseen.filter((e) => !events.some((x) => x.title === e.title))],
  };
});

route('GET', '/api/students/:id/progress', async (req, res, { user, params, query }) => {
  const s = studentFor(user, params.id);
  const subject = C.getSubject(query.get('subject')) ? query.get('subject') : 'maths';
  const p = prog(s.id);
  const styles = {};
  for (const [k, r] of Object.entries(p)) styles[k] = { ...r, status: styleStatus(r) };
  return { student: publicUser(s), subject, styles, summary: { ...summary(s, subject), targetGrade: targetFor(s, subject) }, topicTests: topicTestStatus(s) };
});

// ---------- Student report & personal roadmap ----------
// UK school year: Autumn = Sep–Dec, Spring = Jan–Mar, Summer = Apr–Aug.
function schoolTerm(d = new Date()) { const m = d.getUTCMonth() + 1; return m >= 9 ? 1 : m <= 3 ? 2 : 3; }
function gcseExamDate(yearGroup, d = new Date()) {
  const startYear = d.getUTCMonth() + 1 >= 9 ? d.getUTCFullYear() : d.getUTCFullYear() - 1; // September the current school year began
  return new Date(Date.UTC(startYear + 1 + (11 - yearGroup), 4, 12)); // GCSE written exams start mid-May of Year 11
}
const STATUS = {
  ahead: { label: 'Ahead of target', tone: 'good' }, ontrack: { label: 'On track', tone: 'good' }, close: { label: 'Close to target', tone: 'warn' },
  focus: { label: 'Needs focus', tone: 'bad' }, nodata: { label: 'Not enough data yet', tone: '' },
};

function subjectReport(student, subject) {
  const sub = C.getSubject(subject); const p = prog(student.id);
  const sum = summary(student, subject); const target = targetFor(student, subject);
  const term = schoolTerm();
  const topics = C.TOPICS.filter((t) => t.subject === subject && inScope(student, t));
  const expectedTopics = topics.filter((t) => t.year < student.yearGroup || (t.year === student.yearGroup && t.term <= term));
  const expStyles = expectedTopics.flatMap((t) => t.styles);
  const doneExpected = expStyles.filter((sid) => ['completed', 'mastered'].includes(styleStatus(p[sid]))).length;
  const startedExpected = expStyles.filter((sid) => p[sid] && p[sid].done).length;
  const schedulePct = expStyles.length ? Math.round((startedExpected / expStyles.length) * 100) : 100;
  const styleStats = topics.flatMap((t) => t.styles.map((sid) => {
    const r = p[sid]; const ans = r ? r.done - r.skipped : 0;
    return { styleId: sid, name: ST(sid).name, topic: t.name, topicId: t.id, year: t.year, answered: ans, acc: ans ? r.correct / ans : null, status: styleStatus(r) };
  }));
  const weak = styleStats.filter((x) => x.answered >= 4 && x.acc < 0.65).sort((a, b) => a.acc - b.acc).slice(0, 6).map((x) => ({ ...x, acc: Math.round(x.acc * 100) }));
  const strongTopics = topics.filter((t) => t.styles.length && t.styles.every((sid) => styleStatus(p[sid]) === 'mastered')).map((t) => t.name);
  const strands = sum.strands.filter((x) => x.accuracy != null).sort((a, b) => b.accuracy - a.accuracy);
  const gap = sum.predicted == null || typeof sum.predicted !== 'number' ? null : target - sum.predicted;
  const statusKey = gap == null ? 'nodata' : gap < 0 ? 'ahead' : gap === 0 ? 'ontrack' : gap === 1 ? 'close' : 'focus';
  // next new styles in teaching order: catch-up first (earlier years / earlier terms), then current term, then the next term
  const order = (t) => (t.year - student.yearGroup) * 10 + t.term;
  const nextNew = topics.slice().sort((a, b) => order(a) - order(b)).flatMap((t) => t.styles.filter((sid) => !p[sid]).map((sid) => ({ styleId: sid, name: ST(sid).name, topic: t.name, topicId: t.id, year: t.year, term: t.term, catchUp: t.year < student.yearGroup || (t.year === student.yearGroup && t.term < term) })))
    .filter((x) => x.year <= student.yearGroup).slice(0, 12);
  const exams = finishedExams(student.id).filter((e) => attemptSubject(e) === subject && e.kind !== 'topic').slice(-4).map((e) => ({ name: e.name, pct: e.pct, grade: e.grade, at: e.submittedAt }));
  const trend = exams.length >= 2 ? exams[exams.length - 1].pct - exams[0].pct : null;
  const upcoming = examStatus(student, subject).filter((e) => e.hasContent && !e.best && e.year === student.yearGroup && e.term >= term).slice(0, 2).map((e) => ({ id: e.id, name: e.name, term: e.termName }));
  // written comment
  const c = [];
  if (statusKey === 'nodata') c.push(`Not enough work yet to predict a grade — completing a few lessons and the ${upcoming[0] ? upcoming[0].name : 'next checkpoint'} will give a clear picture.`);
  else c.push(`${student.name} is currently working at grade ${sum.predicted} against a target of ${target} — ${STATUS[statusKey].label.toLowerCase()}.`);
  if (strands[0]) c.push(`Strongest area: ${strands[0].name} (${strands[0].accuracy}% accuracy)${strongTopics.length ? `, with ${strongTopics.length} topic${strongTopics.length > 1 ? 's' : ''} fully mastered` : ''}.`);
  if (weak.length) c.push(`Main area to improve: ${weak[0].name} in ${weak[0].topic} (${weak[0].acc}% correct)${weak[1] ? ` and ${weak[1].name}` : ''}.`);
  if (schedulePct < 50 && expStyles.length) c.push(`Behind the expected pace for this point in Year ${student.yearGroup}: ${schedulePct}% of topics so far have been started — a little practice each week will close the gap.`);
  else if (expStyles.length) c.push(`Good pace: ${schedulePct}% of the topics expected by now have been started.`);
  if (trend != null) c.push(trend >= 5 ? `Exam scores are rising (+${trend} percentage points across recent tests).` : trend <= -5 ? `Exam scores have dipped recently (${trend} points) — the review sessions will help consolidate.` : 'Exam scores are steady.');
  return {
    id: subject, name: sub.name, icon: sub.icon, color: sub.color, board: `${sub.board} ${sub.spec || ''}`.trim(),
    predicted: sum.predicted, target, gap, status: { key: statusKey, ...STATUS[statusKey] },
    accuracy: sum.accuracy, coverage: sum.coverage, mastered: sum.mastered, correct: sum.correct,
    schedulePct, expectedStyles: expStyles.length, completedExpected: doneExpected,
    strands: sum.strands, strongAreas: strands.slice(0, 2).map((x) => x.name), strongTopics: strongTopics.slice(0, 6),
    weak, nextNew, exams, trend, upcoming, comment: c,
  };
}

function buildReport(student) {
  const enrolled = (student.subjects && student.subjects.length ? student.subjects : C.SUBJECTS.map((x) => x.id)).filter((x) => C.getSubject(x));
  const subjects = enrolled.map((sid) => subjectReport(student, sid));
  const overall = summary(student);
  const act = D().activity[student.id] || {};
  const sumDays = (from, to) => { let n = 0; for (let i = from; i < to; i++) n += act[addDays(-i)] || 0; return n; };
  const last4 = sumDays(0, 28), prev4 = sumDays(28, 56);
  const activeDays = Object.keys(act).filter((k) => k >= addDays(-28)).length;
  const rv = reviewStatus(student);
  const examDate = gcseExamDate(student.yearGroup);
  const weeksToExam = Math.max(0, Math.round((examDate - Date.now()) / (7 * 864e5)));

  // ---- personal 6-week plan ----
  const pressure = subjects.reduce((t, x) => t + Math.max(0, x.gap || 0) + (x.schedulePct < 50 ? 1 : 0), 0);
  const perWeek = Math.min(8, Math.max(3, 2 + Math.ceil(pressure / 2) + (student.yearGroup >= 10 ? 1 : 0)));
  // each subject gets a weighted queue: weak styles first, then new styles in teaching order
  const queues = subjects.map((x) => ({
    sub: x, weight: 1 + Math.max(0, x.gap || 0) + (x.status.key === 'nodata' ? 0.5 : 0) + (x.schedulePct < 50 ? 1 : 0) + (x.id === 'maths' || x.id.startsWith('english') ? 0.5 : 0),
    items: [...x.weak.map((w) => ({ kind: 'practise', styleId: w.styleId, name: w.name, topic: w.topic, topicId: w.topicId, why: `Only ${w.acc}% correct so far` })),
      ...x.nextNew.map((n) => ({ kind: 'learn', styleId: n.styleId, name: n.name, topic: n.topic, topicId: n.topicId, why: n.year < student.yearGroup ? `Catch up — Year ${n.year} topic` : n.catchUp ? 'Catch up — taught earlier this year' : `Year ${n.year} ${['Autumn', 'Spring', 'Summer'][n.term - 1]} term` }))],
    credit: 0,
  })).filter((q) => q.items.length);
  const weeks = [];
  const start = new Date(); start.setUTCDate(start.getUTCDate() + ((8 - start.getUTCDay()) % 7 || 7) - 7); // this week's Monday
  for (let w = 0; w < 6; w++) {
    const items = [];
    items.push({ kind: 'review', name: rv.mistakeCount && w === 0 ? `Fix ${Math.min(rv.mistakeCount, 10)} past mistakes` : 'Daily review session', why: 'Free · spaced repetition keeps earlier topics fresh', mode: rv.mistakeCount && w === 0 ? 'mistakes' : 'mixed' });
    for (let k = 0; k < perWeek; k++) {
      const live = queues.filter((q) => q.items.length); if (!live.length) break;
      live.forEach((q) => (q.credit += q.weight));
      const q = live.sort((a, b) => b.credit - a.credit)[0];
      q.credit -= live.reduce((t, x) => t + x.weight, 0);
      const it = q.items.shift();
      items.push({ ...it, subject: q.sub.id, subjectName: q.sub.name, icon: q.sub.icon, color: q.sub.color });
    }
    // a test at the end of weeks 3 and 6
    if (w === 2 || w === 5) {
      const learned = items.concat(...weeks.map((x) => x.items)).filter((x) => x.topicId);
      const t = learned[learned.length - 1];
      const up = subjects.find((x) => x.upcoming.length && !weeks.some((wk) => wk.items.some((i) => i.examId === x.upcoming[0].id)));
      if (w === 5 && up) items.push({ kind: 'exam', examId: up.upcoming[0].id, name: up.upcoming[0].name, subject: up.id, subjectName: up.name, icon: up.icon, color: up.color, why: 'Checkpoint for this term — measures progress towards the target grade' });
      else if (t) items.push({ kind: 'test', examId: `topic:${t.topicId}`, name: `${t.topic} — topic test`, subject: t.subject, subjectName: t.subjectName, icon: t.icon, color: t.color, why: 'Check that this topic has stuck' });
    }
    const from = new Date(start); from.setUTCDate(from.getUTCDate() + w * 7);
    weeks.push({ n: w + 1, from: from.toISOString().slice(0, 10), items, minutes: items.reduce((t, i) => t + ({ review: 10, practise: 20, learn: 20, test: 25, exam: 25 }[i.kind] || 15), 0) });
  }
  // long-term milestones up to the GCSE exams
  const milestones = [];
  for (let y = student.yearGroup; y <= 11; y++) {
    const t0 = y === student.yearGroup ? schoolTerm() : 1;
    for (let t = t0; t <= 3; t++) milestones.push({ year: y, term: t, label: `Year ${y} ${['Autumn', 'Spring', 'Summer'][t - 1]}`, items: [t === 3 ? `End-of-Year exams (Year ${y})` : `${['Autumn', 'Spring'][t - 1]} checkpoints`, ...(y === 11 && t === 2 ? ['Full GCSE mock exams'] : []), ...(y === 11 && t === 3 ? ['GCSE exams (from mid-May)'] : [])], current: y === student.yearGroup && t === t0 });
  }
  return {
    generatedAt: now(), student: publicUser(student), term: ['Autumn', 'Spring', 'Summer'][schoolTerm() - 1],
    examDate: examDate.toISOString().slice(0, 10), weeksToExam,
    overall: { level: overall.level, xp: overall.level.xp, streak: overall.streak, lessons: overall.lessonsCompleted, reviews: overall.reviewsCompleted, correct: overall.correct,
      badges: overall.badges.filter((b) => b.got).length, certificates: overall.certificates, mistakesOpen: rv.mistakeCount, reviewsDue: rv.dueCount,
      questions4w: last4, questionsPrev4w: prev4, activeDays4w: activeDays },
    subjects, plan: { perWeek, weeks }, milestones,
  };
}

route('GET', '/api/students/:id/report', async (req, res, { user, params }) => buildReport(studentFor(user, params.id)));

// ---------- Daily missions ----------
const MISSION_BONUS = 50; // coins for completing every mission of the day
function lessonsOn(sid, date, pred = () => true) {
  return D().lessons.filter((l) => l.studentId === sid && l.status === 'completed' && (l.completedAt || '').slice(0, 10) === date && pred(l)).length;
}
function missionsFor(student, date = today()) {
  D().missions = D().missions || {};
  const all = (D().missions[student.id] = D().missions[student.id] || {});
  if (!all[date]) {
    const subs = (student.subjects && student.subjects.length ? student.subjects : C.SUBJECTS.map((x) => x.id)).filter((x) => C.getSubject(x));
    // focus subject: the enrolled subject furthest below target (rotates daily when tied)
    const ranked = subs.map((x) => { const sm = summary(student, x); return { x, gap: typeof sm.predicted === 'number' ? targetFor(student, x) - sm.predicted : 0.5 }; })
      .sort((a, b) => b.gap - a.gap);
    const top = ranked.filter((r) => r.gap === ranked[0].gap);
    const focus = top[new Date(date).getUTCDate() % top.length].x;
    const qTarget = { 7: 15, 8: 20, 9: 20, 10: 25, 11: 30 }[student.yearGroup] || 20;
    const ms = [
      { id: 'questions', title: `Answer ${qTarget} questions`, icon: '✏️', target: qTarget, coins: 20 },
      { id: 'lesson', title: 'Complete a lesson', icon: '📘', target: 1, coins: 20 },
      { id: 'focus', title: `Do a ${C.getSubject(focus).name} lesson`, icon: C.getSubject(focus).icon, target: 1, coins: 25, subject: focus },
      mistakes(student.id).length >= 3 ? { id: 'fix', title: 'Fix 3 past mistakes', icon: '🔧', target: 3, coins: 25 } : { id: 'review', title: 'Complete a review session', icon: '🔁', target: 1, coins: 20 },
    ];
    all[date] = { date, missions: ms, claimed: {}, bonusClaimed: false };
    const keys = Object.keys(all).sort(); while (keys.length > 60) delete all[keys.shift()];
  }
  const day = all[date];
  const tasksDone = (D().tasks || []).filter((t) => t.studentId === student.id && t.done && t.done[date]).length;
  const progressOf = (m) => ({
    questions: (D().activity[student.id] || {})[date] || 0,
    lesson: lessonsOn(student.id, date, (l) => l.kind !== 'review'),
    focus: lessonsOn(student.id, date, (l) => l.kind !== 'review' && C.subjectOf(l.styleId) === m.subject),
    fix: (student.fixedLog || {})[date] || 0,
    review: lessonsOn(student.id, date, (l) => l.kind === 'review'),
    task: tasksDone,
  }[m.id] || 0);
  const missions = day.missions.map((m) => { const p = progressOf(m); return { ...m, progress: Math.min(p, m.target), done: p >= m.target, claimed: !!day.claimed[m.id] }; });
  return { date, missions, allDone: missions.every((m) => m.done), bonus: MISSION_BONUS, bonusClaimed: day.bonusClaimed, coinsAvailable: missions.filter((m) => m.done && !m.claimed).reduce((t, m) => t + m.coins, 0) };
}
function missionStreak(student) {
  const all = (D().missions || {})[student.id] || {}; let n = 0;
  for (let i = 1; i < 60; i++) { const d = all[addDays(-i)]; if (d && d.bonusClaimed) n++; else break; }
  return n + (all[today()] && all[today()].bonusClaimed ? 1 : 0);
}

route('GET', '/api/students/:id/missions', async (req, res, { user, params }) => {
  const s = studentFor(user, params.id);
  return { ...missionsFor(s), streak: missionStreak(s) };
});

route('POST', '/api/students/:id/missions/claim', async (req, res, { user, params, body }) => {
  const s = studentFor(user, params.id);
  const view = missionsFor(s); const day = D().missions[s.id][view.date];
  const events = [];
  const claim = (m) => { if (m.done && !day.claimed[m.id]) { day.claimed[m.id] = now(); s.coins = (s.coins || 0) + m.coins; return m.coins; } return 0; };
  let coins = 0;
  for (const m of view.missions) if (!body.missionId || body.missionId === m.id) coins += claim(m);
  if (view.allDone && !day.bonusClaimed && view.missions.every((m) => m.done)) {
    day.bonusClaimed = true; s.coins += MISSION_BONUS; coins += MISSION_BONUS;
    events.push({ type: 'missions', title: 'All daily missions complete!', text: `Treasure chest: +${MISSION_BONUS} bonus coins. Mission streak: ${missionStreak(s)} day${missionStreak(s) === 1 ? '' : 's'}.`, icon: '🧰' });
    events.forEach((e) => pushInbox(s, { ...e, seen: true }));
  }
  if (!coins) fail(400, 'Nothing to claim yet');
  return { coins, total: s.coins, missions: { ...missionsFor(s), streak: missionStreak(s) }, rewards: events };
});

// ---------- Tasks (parent-set and personal) ----------
// A task can be custom ("Read chapter 3") or linked to app work (lesson style / topic / review / test), which completes it automatically.
function tasksOf(sid) { D().tasks = D().tasks || []; return D().tasks.filter((t) => t.studentId === sid); }
function occursOn(t, date) {
  if (t.recurrence === 'daily') return date >= t.dueDate && (!t.until || date <= t.until);
  if (t.recurrence === 'weekdays') { const wd = new Date(date).getUTCDay(); return date >= t.dueDate && wd >= 1 && wd <= 5 && (!t.until || date <= t.until); }
  if (t.recurrence === 'weekly') return date >= t.dueDate && new Date(date).getUTCDay() === new Date(t.dueDate).getUTCDay() && (!t.until || date <= t.until);
  return date === t.dueDate;
}
function taskState(t, date) {
  const d = (t.done || {})[date];
  if (!d) return t.recurrence === 'none' && t.status === 'doing' ? 'doing' : date < today() ? 'missed' : 'todo';
  return d.approvedAt || !t.requiresApproval ? 'done' : 'waiting';
}
function taskView(t, date) {
  const key = t.recurrence === 'none' ? t.dueDate : date || today();
  return { ...t, date: key, state: taskState(t, key), subjectName: t.subject ? C.getSubject(t.subject)?.name : null, icon: t.subject ? C.getSubject(t.subject)?.icon : null,
    refName: t.ref ? (t.kind === 'lesson' ? ST(t.ref)?.name : t.kind === 'topic' || t.kind === 'test' ? C.getTopic(t.ref)?.name : null) : null };
}
function completeTask(s, t, date, approver) {
  t.done = t.done || {};
  const d = (t.done[date] = t.done[date] || { at: now() });
  if (t.recurrence === 'none') t.status = 'done';
  if (!t.requiresApproval || approver) {
    if (!d.approvedAt) { d.approvedAt = now(); if (t.coins) { s.coins = (s.coins || 0) + t.coins; } return { type: 'task', title: 'Task complete!', text: `${t.title}${t.coins ? ` · +${t.coins} coins` : ''}`, icon: '✅' }; }
  }
  return null;
}
function autoCompleteTasks(s, ev) {
  const events = []; const date = today();
  for (const t of tasksOf(s.id)) {
    if (t.recurrence !== 'none' && !occursOn(t, date)) continue;
    const key = t.recurrence === 'none' ? t.dueDate : date;
    if ((t.done || {})[key]) continue;
    const match = (t.kind === 'review' && ev.kind === 'review')
      || (t.kind === 'lesson' && ev.kind === 'lesson' && (!t.ref || t.ref === ev.styleId) && (!t.subject || t.subject === ev.subject))
      || (t.kind === 'topic' && ev.kind === 'lesson' && t.ref === ev.topicId)
      || (t.kind === 'test' && (ev.kind === 'test' || ev.kind === 'exam') && (!t.ref || t.ref === ev.topicId || `topic:${t.ref}` === ev.examId || t.ref === ev.examId));
    if (match) { const e = completeTask(s, t, key, 'auto'); if (e) events.push(e); } // app work is verified, so it counts as approved
  }
  events.forEach((e) => pushInbox(s, { ...e, seen: true }));
  return events;
}

route('GET', '/api/students/:id/tasks', async (req, res, { user, params }) => {
  const s = studentFor(user, params.id);
  const list = tasksOf(s.id);
  const todayList = list.filter((t) => occursOn(t, today()) || (t.recurrence === 'none' && t.dueDate < today() && !(t.done || {})[t.dueDate])).map((t) => taskView(t, t.recurrence === 'none' ? t.dueDate : today()));
  return { tasks: list.map((t) => taskView(t)).sort((a, b) => (a.dueDate < b.dueDate ? -1 : 1)), today: todayList,
    waiting: list.flatMap((t) => Object.entries(t.done || {}).filter(([, d]) => !d.approvedAt && t.requiresApproval).map(([date]) => ({ ...taskView(t, date), date }))) };
});

function taskInput(body, user, existing) {
  const out = {};
  const isStudent = user.role === 'student';
  if (body.title !== undefined || !existing) { out.title = str(body.title, 120); if (!out.title) fail(400, 'Give the task a title'); }
  if (body.notes !== undefined) out.notes = str(body.notes, 500);
  if (body.dueDate !== undefined || !existing) { out.dueDate = /^\d{4}-\d{2}-\d{2}$/.test(body.dueDate || '') ? body.dueDate : today(); }
  if (body.dueTime !== undefined) out.dueTime = /^\d{2}:\d{2}$/.test(body.dueTime || '') ? body.dueTime : '';
  if (body.recurrence !== undefined || !existing) out.recurrence = ['none', 'daily', 'weekdays', 'weekly'].includes(body.recurrence) ? body.recurrence : 'none';
  if (body.until !== undefined) out.until = /^\d{4}-\d{2}-\d{2}$/.test(body.until || '') ? body.until : '';
  if (body.priority !== undefined || !existing) out.priority = ['low', 'normal', 'high'].includes(body.priority) ? body.priority : 'normal';
  if (body.kind !== undefined || !existing) out.kind = ['custom', 'lesson', 'topic', 'review', 'test'].includes(body.kind) ? body.kind : 'custom';
  if (body.subject !== undefined) out.subject = C.getSubject(body.subject) ? body.subject : null;
  if (body.ref !== undefined) out.ref = str(body.ref, 80) || null;
  if (body.status !== undefined && ['todo', 'doing'].includes(body.status)) out.status = body.status;
  if (!isStudent) {
    if (body.coins !== undefined) out.coins = Math.max(0, Math.min(500, Math.trunc(Number(body.coins) || 0)));
    if (body.requiresApproval !== undefined) out.requiresApproval = !!body.requiresApproval;
  } else if (!existing) { out.coins = 0; out.requiresApproval = false; }
  return out;
}

route('POST', '/api/students/:id/tasks', async (req, res, { user, params, body }) => {
  const s = studentFor(user, params.id);
  if (tasksOf(s.id).length >= 300) fail(400, 'Too many tasks — delete some old ones first');
  const t = { id: store.id('tsk'), studentId: s.id, createdBy: user.id, createdByRole: user.role, createdAt: now(), status: 'todo', done: {}, coins: 0, requiresApproval: false, ...taskInput(body, user, null) };
  if (t.kind !== 'custom') t.requiresApproval = false; // app work is verified automatically
  D().tasks.push(t);
  if (user.role !== 'student') pushInbox(s, { type: 'task-new', title: 'New task from your parent', text: `${t.title}${t.coins ? ` · ${t.coins} coins` : ''}`, icon: '📌' });
  return { task: taskView(t) };
});

function getTask(user, sid, tid) {
  const s = studentFor(user, sid);
  const t = tasksOf(s.id).find((x) => x.id === tid); if (!t) fail(404, 'Task not found');
  return { s, t };
}

route('PATCH', '/api/students/:id/tasks/:tid', async (req, res, { user, params, body }) => {
  const { t } = getTask(user, params.id, params.tid);
  if (user.role === 'student' && t.createdByRole !== 'student') { if (body.status) t.status = ['todo', 'doing'].includes(body.status) ? body.status : t.status; return { task: taskView(t) }; }
  Object.assign(t, taskInput(body, user, t));
  return { task: taskView(t) };
});

route('POST', '/api/students/:id/tasks/:tid/complete', async (req, res, { user, params, body }) => {
  const { s, t } = getTask(user, params.id, params.tid);
  const date = t.recurrence === 'none' ? t.dueDate : (/^\d{4}-\d{2}-\d{2}$/.test(body.date || '') ? body.date : today());
  if (t.kind !== 'custom' && user.role === 'student') fail(400, 'This task completes itself when you do the work in the app');
  if (date > today()) fail(400, 'You can’t complete a future task yet');
  const ev = completeTask(s, t, date, user.role !== 'student' ? user : null);
  if (!ev && user.role === 'student') {
    const parent = findUser(s.parentId); if (parent) audit(s, 'task-awaiting-approval', t.title);
  }
  const rewards = ev ? [ev, ...checkRewards(s)] : [];
  return { task: taskView(t, date), rewards, waiting: !ev };
});

route('POST', '/api/students/:id/tasks/:tid/approve', { roles: ['parent', 'admin'] }, async (req, res, { user, params, body }) => {
  const { s, t } = getTask(user, params.id, params.tid);
  const date = body.date || t.dueDate;
  if (!(t.done || {})[date]) fail(400, 'Not completed yet');
  if (body.reject) { delete t.done[date]; if (t.recurrence === 'none') t.status = 'todo'; pushInbox(s, { type: 'task-rejected', title: 'Task sent back', text: `${t.title}${body.note ? ' — ' + str(body.note, 200) : ''}`, icon: '↩️' }); return { task: taskView(t, date) }; }
  const ev = completeTask(s, t, date, user);
  if (ev) pushInbox(s, { ...ev, title: 'Task approved!' });
  return { task: taskView(t, date) };
});

route('DELETE', '/api/students/:id/tasks/:tid', async (req, res, { user, params }) => {
  const { t } = getTask(user, params.id, params.tid);
  if (user.role === 'student' && t.createdByRole !== 'student') fail(403, 'Only your parent can delete this task');
  D().tasks = D().tasks.filter((x) => x.id !== t.id);
  return { ok: true };
});

// ---------- Calendar ----------
route('GET', '/api/students/:id/calendar', async (req, res, { user, params, query }) => {
  const s = studentFor(user, params.id);
  const isDate = (x) => /^\d{4}-\d{2}-\d{2}$/.test(x || '');
  const from = isDate(query.get('from')) ? query.get('from') : addDays(-14); const to = isDate(query.get('to')) ? query.get('to') : addDays(28);
  const days = {}; const T = today();
  const day = (k) => (days[k] = days[k] || { date: k, events: [], questions: 0 });
  const inRange = (k) => k >= from && k <= to;
  const act = D().activity[s.id] || {};
  for (const [k, n] of Object.entries(act)) if (inRange(k)) day(k).questions = n;
  // spaced-review due dates (overdue ones are shown today)
  const m = srMap(s.id);
  const dueBy = {};
  for (const [sid, e] of Object.entries(m)) { if (!ST(sid)) continue; const k = e.due < T ? T : e.due; (dueBy[k] = dueBy[k] || []).push(sid); }
  for (const [k, list] of Object.entries(dueBy)) if (inRange(k)) day(k).events.push({ kind: 'review', title: `${list.length} topic${list.length > 1 ? 's' : ''} to review`, detail: list.slice(0, 4).map((x) => ST(x).name).join(', '), count: list.length });
  // completed lessons & reviews
  const doneBy = {};
  for (const l of D().lessons) if (l.studentId === s.id && l.status === 'completed' && l.completedAt && inRange(l.completedAt.slice(0, 10))) {
    const k = l.completedAt.slice(0, 10); (doneBy[k] = doneBy[k] || []).push(l);
  }
  for (const [k, ls] of Object.entries(doneBy)) {
    const lessons = ls.filter((l) => l.kind !== 'review'); const reviews = ls.length - lessons.length;
    if (lessons.length) day(k).events.push({ kind: 'done', title: `${lessons.length} lesson${lessons.length > 1 ? 's' : ''} completed`, detail: lessons.slice(0, 4).map((l) => ST(l.styleId)?.name).join(', ') });
    if (reviews) day(k).events.push({ kind: 'done', title: `${reviews} review session${reviews > 1 ? 's' : ''} completed` });
  }
  // exams taken
  for (const a of D().examAttempts) if (a.studentId === s.id && a.submittedAt && inRange(a.submittedAt.slice(0, 10))) day(a.submittedAt.slice(0, 10)).events.push({ kind: 'exam-done', title: a.name, detail: `Grade ${a.grade} · ${a.pct}%`, ref: a.id });
  // tasks
  const pushTask = (t, k) => { const v = taskView(t, k); day(k).events.push({ kind: 'task', title: t.title, detail: [v.subjectName, t.dueTime, t.coins ? `${t.coins} coins` : ''].filter(Boolean).join(' · '), state: v.state, taskId: t.id, priority: t.priority, date: k }); };
  for (const t of tasksOf(s.id)) {
    if (t.recurrence === 'none') { if (inRange(t.dueDate)) pushTask(t, t.dueDate); continue; }
    for (let k = from; k <= to; k = addDays(1, new Date(k))) if (occursOn(t, k)) pushTask(t, k);
  }
  // planned lessons from the personal roadmap (next 6 weeks), spread Mon–Fri
  if (to >= T) {
    const rep = buildReport(s);
    rep.plan.weeks.forEach((w) => {
      const learnItems = w.items.filter((i) => i.kind !== 'review');
      learnItems.forEach((it, i) => {
        const k = addDays(Math.min(4, Math.floor((i * 5) / Math.max(1, learnItems.length))), new Date(w.from));
        if (k < T || !inRange(k)) return;
        day(k).events.push({ kind: 'plan', title: it.name, detail: [it.subjectName, it.kind === 'practise' ? 'practise' : it.kind === 'learn' ? 'new topic' : it.kind].filter(Boolean).join(' · '), styleId: it.styleId || null, examId: it.examId || null, color: it.color, itemKind: it.kind });
      });
    });
    // daily missions on today
    const ms = missionsFor(s);
    day(T).events.unshift({ kind: 'missions', title: `Daily missions ${ms.missions.filter((x) => x.done).length}/${ms.missions.length}`, detail: ms.missions.map((x) => (x.done ? '✓ ' : '○ ') + x.title).join(' · ') });
  }
  // school calendar milestones
  const termStarts = [['09-01', 'Autumn term starts'], ['01-06', 'Spring term starts'], ['04-20', 'Summer term starts']];
  for (const y of [from.slice(0, 4), to.slice(0, 4)]) for (const [md, label] of termStarts) { const k = `${y}-${md}`; if (inRange(k)) day(k).events.push({ kind: 'school', title: label }); }
  const exam = gcseExamDate(s.yearGroup).toISOString().slice(0, 10); if (inRange(exam)) day(exam).events.push({ kind: 'school', title: 'GCSE exams begin' });
  return { from, to, today: T, days: Object.values(days).sort((a, b) => (a.date < b.date ? -1 : 1)) };
});

// ---------- Gift-card reward tickets (parent approves and buys the card) ----------
const GIFT_CARDS = [
  { id: 'roblox', name: 'Roblox', icon: '🧱', values: [5, 10, 25] },
  { id: 'appstore', name: 'App Store & iTunes', icon: '🍎', values: [5, 10, 25] },
  { id: 'googleplay', name: 'Google Play', icon: '▶️', values: [5, 10, 25] },
  { id: 'minecraft', name: 'Minecraft', icon: '⛏️', values: [10, 20] },
  { id: 'fortnite', name: 'Fortnite V-Bucks', icon: '🪂', values: [8, 20] },
  { id: 'playstation', name: 'PlayStation Store', icon: '🎮', values: [5, 10, 20] },
  { id: 'xbox', name: 'Xbox', icon: '🕹️', values: [5, 10, 20] },
  { id: 'nintendo', name: 'Nintendo eShop', icon: '🍄', values: [15, 25] },
  { id: 'steam', name: 'Steam', icon: '💨', values: [5, 10, 20] },
  { id: 'spotify', name: 'Spotify', icon: '🎧', values: [10] },
  { id: 'cash', name: 'Pocket money', icon: '💷', values: [2, 5, 10] },
];
const giftSettings = (s) => ({ enabled: true, coinsPerPound: 400, monthlyLimit: 10, allowed: GIFT_CARDS.map((g) => g.id), ...(s.giftSettings || {}) });
const tickets = () => (D().tickets = D().tickets || []);
const monthSpent = (sid) => { const m = today().slice(0, 7); return tickets().filter((t) => t.studentId === sid && t.createdAt.slice(0, 7) === m && t.status !== 'declined' && t.status !== 'cancelled').reduce((a, t) => a + t.value, 0); };

route('GET', '/api/students/:id/gifts', async (req, res, { user, params }) => {
  const s = studentFor(user, params.id); const g = giftSettings(s);
  return { settings: g, catalogue: GIFT_CARDS.filter((c) => g.allowed.includes(c.id)).map((c) => ({ ...c, options: c.values.map((v) => ({ value: v, coins: v * g.coinsPerPound })) })),
    allCards: GIFT_CARDS, coins: s.coins || 0, spentThisMonth: monthSpent(s.id), tickets: tickets().filter((t) => t.studentId === s.id).slice().reverse() };
});

route('POST', '/api/students/:id/gifts', async (req, res, { user, params, body }) => {
  const s = studentFor(user, params.id); const g = giftSettings(s);
  if (!g.enabled) fail(400, 'Gift-card rewards are switched off by your parent');
  const card = GIFT_CARDS.find((c) => c.id === body.cardId && g.allowed.includes(c.id)); if (!card) fail(400, 'Choose a gift card');
  const value = Number(body.value); if (!card.values.includes(value)) fail(400, 'Choose an amount');
  const coins = value * g.coinsPerPound;
  if ((s.coins || 0) < coins) fail(400, `You need ${coins - (s.coins || 0)} more coins`);
  if (monthSpent(s.id) + value > g.monthlyLimit) fail(400, `Monthly limit is £${g.monthlyLimit} (already used £${monthSpent(s.id)})`);
  if (tickets().filter((t) => t.studentId === s.id && t.status === 'pending').length >= 3) fail(400, 'You already have 3 tickets waiting for approval');
  s.coins -= coins;
  const t = { id: store.id('tkt'), studentId: s.id, studentName: s.name, parentId: s.parentId, cardId: card.id, cardName: card.name, icon: card.icon, value, coins, status: 'pending', createdAt: now(), note: str(body.note, 140) };
  tickets().push(t);
  pushInbox(s, { type: 'ticket', title: 'Reward ticket sent!', text: `£${value} ${card.name} — waiting for your parent to approve`, icon: '🎟️', seen: true });
  audit(s, 'gift-ticket', `£${value} ${card.name}`);
  return { ticket: t, coins: s.coins };
});

route('PATCH', '/api/students/:id/gifts/:tid', async (req, res, { user, params, body }) => {
  const s = studentFor(user, params.id);
  const t = tickets().find((x) => x.id === params.tid && x.studentId === s.id); if (!t) fail(404, 'Ticket not found');
  const act = body.action;
  if (user.role === 'student') {
    if (act !== 'cancel' || t.status !== 'pending') fail(403, 'Only your parent can do that');
    t.status = 'cancelled'; s.coins += t.coins; return { ticket: t };
  }
  if (act === 'approve' && t.status === 'pending') { t.status = 'approved'; t.approvedAt = now(); pushInbox(s, { type: 'ticket', title: 'Reward approved! 🎉', text: `£${t.value} ${t.cardName} is on its way`, icon: '🎟️' }); }
  else if (act === 'decline' && ['pending', 'approved'].includes(t.status)) { t.status = 'declined'; t.reply = str(body.reply, 200); s.coins += t.coins; pushInbox(s, { type: 'ticket', title: 'Reward ticket declined', text: `${t.cardName} — your ${t.coins} coins were refunded${t.reply ? '. ' + t.reply : ''}`, icon: '↩️' }); }
  else if (act === 'deliver' && ['pending', 'approved'].includes(t.status)) {
    t.status = 'delivered'; t.deliveredAt = now(); t.reply = str(body.reply, 200); t.code = str(body.code, 80);
    pushInbox(s, { type: 'ticket', title: 'Your gift card is here! 🎁', text: `£${t.value} ${t.cardName}${t.code ? ' — code in your Rewards page' : ''}`, icon: '🎁' });
  } else fail(400, 'Not possible for this ticket');
  audit(user, `gift-${act}`, `${s.name}: £${t.value} ${t.cardName}`);
  return { ticket: t };
});

route('PUT', '/api/students/:id/gifts/settings', { roles: ['parent', 'admin'] }, async (req, res, { user, params, body }) => {
  const s = studentFor(user, params.id);
  s.giftSettings = {
    enabled: !!body.enabled,
    coinsPerPound: Math.max(50, Math.min(5000, Math.trunc(Number(body.coinsPerPound) || 400))),
    monthlyLimit: Math.max(0, Math.min(200, Math.trunc(Number(body.monthlyLimit) || 0))),
    allowed: Array.isArray(body.allowed) ? body.allowed.filter((x) => GIFT_CARDS.some((g) => g.id === x)) : GIFT_CARDS.map((g) => g.id),
  };
  return { settings: giftSettings(s) };
});

// Parent home: everything waiting for a decision across the family
route('GET', '/api/approvals', { roles: ['parent', 'admin'] }, async (req, res, { user }) => {
  const kids = user.role === 'parent' ? children(user.id) : [];
  const ids = new Set(kids.map((k) => k.id));
  const waitingTasks = (D().tasks || []).filter((t) => ids.has(t.studentId) && t.requiresApproval).flatMap((t) => Object.entries(t.done || {}).filter(([, d]) => !d.approvedAt).map(([date]) => ({ ...taskView(t, date), date, studentName: findUser(t.studentId)?.name })));
  const pendingTickets = tickets().filter((t) => ids.has(t.studentId) && ['pending', 'approved'].includes(t.status));
  return { tasks: waitingTasks, tickets: pendingTickets, count: waitingTasks.length + pendingTickets.length };
});

route('GET', '/api/admin/tickets', { roles: ['admin'] }, async () => ({ tickets: tickets().slice().reverse() }));

route('GET', '/api/students/:id/history', async (req, res, { user, params }) => {
  const s = studentFor(user, params.id);
  const lessons = D().lessons.filter((l) => l.studentId === s.id).slice(-60).reverse().map((l) => ({
    id: l.id, kind: l.kind || 'lesson', styleName: l.styleId ? ST(l.styleId)?.name : 'Review session', topic: l.styleId ? C.getTopic(ST(l.styleId)?.topicId)?.name : 'Past questions',
    status: l.status, createdAt: l.createdAt, free: l.free, xp: l.xp,
    correct: l.results.filter((r) => r && r.outcome === 'correct').length, total: l.questions.length,
  }));
  return { lessons };
});

// Review (spaced repetition + mistakes bank)
route('GET', '/api/students/:id/review', async (req, res, { user, params }) => reviewStatus(studentFor(user, params.id)));

route('POST', '/api/reviews', async (req, res, { user, body }) => {
  const s = studentFor(user, body.studentId);
  const active = D().lessons.find((l) => l.studentId === s.id && l.kind === 'review' && l.status === 'active');
  if (active) return { lesson: lessonView(active), resumed: true };
  let items;
  if (body.mode === 'mistakes') items = mistakes(s.id).filter((m) => ST(m.styleId)).slice(0, REVIEW_SESSION_SIZE).map((m) => ({ ...m.q, styleId: m.styleId, review: 'mistake', mistakeId: m.id }));
  else if (body.mistakeId) { const m = mistakes(s.id).find((x) => x.id === body.mistakeId); if (!m) fail(404, 'Mistake not found'); items = [{ ...m.q, styleId: m.styleId, review: 'mistake', mistakeId: m.id }, ...[0, 1].map(() => ({ ...C.generate(m.styleId), styleId: m.styleId, review: 'practice' }))]; }
  else items = pickReviewItems(s, REVIEW_SESSION_SIZE, null);
  if (!items.length) fail(400, 'Nothing to review yet — complete a lesson first.');
  const l = { id: store.id('les'), kind: 'review', studentId: s.id, styleId: null, topicId: null, createdAt: now(), status: 'active', free: true, example: null, questions: items, idx: 0, results: [], xp: 0 };
  D().lessons.push(l);
  return { lesson: lessonView(l) };
});

// Lessons
route('POST', '/api/lessons', async (req, res, { user, body }) => {
  const s = studentFor(user, body.studentId);
  const style = C.getStyle(body.styleId); if (!style) fail(404, 'Unknown style');
  const active = D().lessons.find((l) => l.studentId === s.id && l.styleId === style.id && l.status === 'active');
  if (active) return { lesson: lessonView(active), resumed: true };
  const topic = C.getTopic(style.topicId);
  const charge = chargeOrFree(user, 'lesson', `${s.name}: ${style.name}`, s);
  const ex = C.generate(style.id);
  const qs = C.generateMany(style.id, QUESTIONS_PER_LESSON).map((q) => ({ ...q, styleId: style.id }));
  // interleave past questions ("retrieval practice") at regular gaps
  const extra = pickReviewItems(s, REVIEW_IN_LESSON, style.id);
  extra.forEach((q, i) => qs.splice(Math.min(qs.length, 4 + i * 5), 0, q));
  const l = { id: store.id('les'), kind: 'lesson', studentId: s.id, styleId: style.id, topicId: topic.id, createdAt: now(), status: 'active', free: charge.free,
    example: { html: ex.html, diagram: ex.diagram, answerHtml: ex.answerHtml, steps: ex.steps }, questions: qs, idx: 0, results: [], xp: 0 };
  D().lessons.push(l);
  return { lesson: lessonView(l) };
});

route('GET', '/api/lessons/:id', async (req, res, { user, params }) => ({ lesson: lessonView(getLesson(user, params.id)) }));

function finalise(l, s, q, outcome) {
  const sid = q.styleId || l.styleId;
  if (q.review) srUpdate(s, sid, outcome === 'correct');
  if (outcome === 'correct' && q.mistakeId) resolveMistake(s, q.mistakeId);
  else if (outcome !== 'correct') addMistake(s, q, sid, l.kind === 'review' ? 'review' : 'lesson');
}

route('POST', '/api/lessons/:id/answer', async (req, res, { user, params, body }) => {
  const l = getLesson(user, params.id);
  if (l.status !== 'active') fail(400, 'Lesson finished');
  const s = findUser(l.studentId);
  const q = l.questions[l.idx]; const sid = q.styleId || l.styleId;
  const r = (l.results[l.idx] = l.results[l.idx] || { attempts: 0, hinted: false, outcome: null });
  if (r.outcome) fail(400, 'Already answered');
  const input = str(body.input, 200);
  if (!input) fail(400, 'Type an answer first');
  r.attempts++;
  const ok = C.checkAnswer(q.check, input);
  let xp = 0, reveal = false;
  const lvlBefore = levelInfo(s.xp).level;
  if (ok) {
    xp = r.attempts === 1 ? (r.hinted ? 6 : 10) : r.attempts === 2 ? 5 : 3;
    if (q.review) xp += 3; // remembering old work is worth more
    const streakRun = l.results.slice(0, l.idx).reverse().findIndex((x) => !(x.outcome === 'correct' && x.attempts === 1));
    const run = streakRun === -1 ? l.idx : streakRun;
    if (r.attempts === 1 && run >= 2) xp += 2; // combo bonus
    r.outcome = 'correct'; reveal = true;
    recordAnswer(s, sid, 'correct', xp);
    finalise(l, s, q, 'correct');
  } else if (r.attempts >= 3) {
    r.outcome = 'incorrect'; reveal = true;
    recordAnswer(s, sid, 'incorrect', 0);
    recordAnswer(s, sid, 'wrong-final', 1);
    finalise(l, s, q, 'incorrect');
    xp = 1;
  } else {
    recordAnswer(s, sid, 'incorrect', 0);
  }
  l.xp += xp;
  const rewards = levelInfo(s.xp).level > lvlBefore ? checkRewards(s) : [];
  return {
    correct: ok, attemptsLeft: reveal ? 0 : 3 - r.attempts, xp, done: reveal, coins: s.coins,
    ...(reveal ? { answerHtml: q.answerHtml, steps: q.steps } : { hint: r.attempts === 2 ? q.hint : null }),
    level: levelInfo(s.xp), rewards,
  };
});

route('POST', '/api/lessons/:id/hint', async (req, res, { user, params }) => {
  const l = getLesson(user, params.id);
  const r = (l.results[l.idx] = l.results[l.idx] || { attempts: 0, hinted: false, outcome: null });
  r.hinted = true;
  return { hint: l.questions[l.idx].hint };
});

route('POST', '/api/lessons/:id/skip', async (req, res, { user, params }) => {
  const l = getLesson(user, params.id);
  if (l.status !== 'active') fail(400, 'Lesson finished');
  const q = l.questions[l.idx]; const s = findUser(l.studentId);
  const r = (l.results[l.idx] = l.results[l.idx] || { attempts: 0, hinted: false, outcome: null });
  if (r.outcome) fail(400, 'Already answered');
  r.outcome = 'skipped';
  recordAnswer(s, q.styleId || l.styleId, 'skipped', 0);
  finalise(l, s, q, 'skipped');
  return { answerHtml: q.answerHtml, steps: q.steps };
});

route('POST', '/api/lessons/:id/next', async (req, res, { user, params }) => {
  const l = getLesson(user, params.id);
  if (l.status !== 'active') return { lesson: lessonView(l), rewards: [] };
  if (!l.results[l.idx] || !l.results[l.idx].outcome) fail(400, 'Answer or skip this question first');
  let rewards = [];
  if (l.idx + 1 >= l.questions.length) {
    l.status = 'completed'; l.completedAt = now();
    const s = findUser(l.studentId);
    const correct = l.results.filter((r) => r.outcome === 'correct').length;
    const total = l.questions.length;
    const bonus = correct === total ? 25 : correct >= total * 0.8 ? 10 : 0;
    addXp(s, bonus); l.xp += bonus; l.bonus = bonus;
    if (l.kind !== 'review') {
      // schedule this style for spaced review based on how the core questions went
      const core = l.questions.map((q, i) => [q, l.results[i]]).filter(([q]) => !q.review);
      const acc = core.filter(([, r]) => r.outcome === 'correct').length / Math.max(1, core.length);
      srUpdate(s, l.styleId, acc >= 0.8);
    }
    const done = autoCompleteTasks(s, l.kind === 'review' ? { kind: 'review' } : { kind: 'lesson', styleId: l.styleId, topicId: l.topicId, subject: C.subjectOf(l.styleId) });
    rewards = [...done, ...checkRewards(s)];
  } else l.idx++;
  return { lesson: lessonView(l), bonus: l.bonus || 0, rewards };
});

// Exams & topic tests
route('GET', '/api/students/:id/exams', async (req, res, { user, params, query }) => {
  const s = studentFor(user, params.id);
  const subject = C.getSubject(query.get('subject')) ? query.get('subject') : null;
  const attempts = D().examAttempts.filter((a) => a.studentId === s.id && a.submittedAt && (!subject || attemptSubject(a) === subject)).reverse()
    .map((a) => ({ id: a.id, examId: a.examId, kind: a.kind || 'exam', name: a.name, pct: a.pct, grade: a.grade, score: a.score, max: a.max, at: a.submittedAt }));
  return { exams: examStatus(s, subject), attempts };
});

route('POST', '/api/exams', async (req, res, { user, body }) => {
  const s = studentFor(user, body.studentId);
  const exam = examDef(body.examId); if (!exam) fail(404, 'Unknown exam');
  const existing = D().examAttempts.find((a) => a.studentId === s.id && a.examId === exam.id && !a.submittedAt && Date.parse(a.deadline) > Date.now());
  if (existing) return { attempt: examView(existing, false) };
  const questions = pickExamQuestions(exam, s);
  chargeOrFree(user, exam.kind === 'topic' ? 'test' : 'exam', `${s.name}: ${exam.name}`, s);
  const a = { id: store.id('exm'), studentId: s.id, examId: exam.id, subject: exam.subject, kind: exam.kind, name: exam.name, tier: exam.tier || s.tier, startedAt: now(),
    deadline: new Date(Date.now() + exam.minutes * 60e3).toISOString(), questions };
  D().examAttempts.push(a);
  return { attempt: examView(a, false) };
});

function getAttempt(user, id) {
  const a = D().examAttempts.find((x) => x.id === id); if (!a) fail(404, 'Exam not found');
  return { a, s: studentFor(user, a.studentId) };
}

route('GET', '/api/exams/:id', async (req, res, { user, params }) => {
  const { a } = getAttempt(user, params.id);
  return { attempt: examView(a, !!a.submittedAt) };
});

route('POST', '/api/exams/:id/submit', async (req, res, { user, params, body }) => {
  const { a, s } = getAttempt(user, params.id);
  if (a.submittedAt) return { attempt: examView(a, true), rewards: [] };
  const answers = Array.isArray(body.answers) ? body.answers.map((x) => str(String(x ?? ''), 200)) : [];
  a.answers = a.questions.map((_, i) => answers[i] || '');
  a.marked = a.questions.map((q, i) => !!a.answers[i] && C.checkAnswer(q.check, a.answers[i]));
  a.max = a.questions.reduce((t, q) => t + q.marks, 0);
  a.score = a.questions.reduce((t, q, i) => t + (a.marked[i] ? q.marks : 0), 0);
  a.pct = Math.round((a.score / a.max) * 100);
  a.grade = gradeFor(a.pct, a.tier);
  const by = {};
  a.questions.forEach((q, i) => { const b = (by[q.strand] = by[q.strand] || { score: 0, max: 0 }); b.max += q.marks; if (a.marked[i]) b.score += q.marks; });
  a.byStrand = by;
  a.submittedAt = now();
  a.late = Date.now() > Date.parse(a.deadline) + 60e3;
  // wrong answers go to the mistakes bank; every style seen feeds spaced repetition
  a.questions.forEach((q, i) => {
    if (!a.marked[i]) addMistake(s, q, q.styleId, a.kind === 'topic' ? 'topic test' : 'exam');
    if (srMap(s.id)[q.styleId] || a.marked[i]) srUpdate(s, q.styleId, a.marked[i]);
  });
  const xp = a.score * 4 + (a.pct >= 70 ? 30 : 0);
  addXp(s, xp); a.xp = xp;
  markActive(s, a.questions.length);
  if (typeof a.grade === 'number' && a.grade >= targetFor(s, a.subject) && a.kind !== 'topic') {
    s.certificates = s.certificates || [];
    s.certificates.push({ id: store.id('crt'), key: `exam:${a.id}`, kind: 'exam', title: a.name, subtitle: `Grade ${a.grade} — on target`, at: now() });
  }
  const done = autoCompleteTasks(s, a.kind === 'topic' ? { kind: 'test', topicId: a.examId.slice(6), examId: a.examId } : { kind: 'exam', examId: a.examId });
  const rewards = [...done, ...checkRewards(s)];
  return { attempt: examView(a, true), xp, rewards };
});

// Post-exam: a fresh question of the same style as a wrong answer, to practise straight after the explanation.
route('GET', '/api/exams/:id/similar/:n', async (req, res, { user, params }) => {
  const { a } = getAttempt(user, params.id);
  if (!a.submittedAt) fail(400, 'Finish the exam first');
  const n = Number(params.n); const base = a.questions[n]; if (!base) fail(404, 'No such question');
  a.similar = a.similar || {};
  const q = { ...C.generate(base.styleId), styleId: base.styleId };
  a.similar[n] = { q, attempts: 0, solved: false };
  return { question: stripQ(q) };
});

route('POST', '/api/exams/:id/similar/:n', async (req, res, { user, params, body }) => {
  const { a, s } = getAttempt(user, params.id);
  const sim = a.similar && a.similar[Number(params.n)]; if (!sim) fail(400, 'Ask for a similar question first');
  if (sim.solved) fail(400, 'Already answered');
  sim.attempts++;
  const ok = C.checkAnswer(sim.q.check, str(body.input, 200));
  const done = ok || sim.attempts >= 2;
  if (ok) { sim.solved = true; recordAnswer(s, sim.q.styleId, 'correct', 8); }
  else if (done) { sim.solved = true; recordAnswer(s, sim.q.styleId, 'wrong-final', 0); }
  const rewards = ok ? checkRewards(s) : [];
  return { correct: ok, done, attemptsLeft: done ? 0 : 2 - sim.attempts, ...(done ? { answerHtml: sim.q.answerHtml, steps: sim.q.steps } : { hint: sim.q.hint }), rewards };
});

// Rewards: shop, inbox, certificates, goals
route('GET', '/api/students/:id/rewards', async (req, res, { user, params }) => {
  const s = studentFor(user, params.id);
  const sum = summary(s);
  return {
    coins: s.coins || 0, owned: s.owned || [], equipped: s.equipped || {}, freezes: s.freezes || 0, shop: SHOP,
    badges: sum.badges, level: sum.level, certificates: (s.certificates || []).slice().reverse(),
    goals: (s.goals || []).map((g) => goalView(s, g)), goalTypes: Object.fromEntries(Object.entries(GOAL_TYPES).map(([k, v]) => [k, v.label])),
    inbox: (s.inbox || []).slice(0, 30), lessonsCompleted: sum.lessonsCompleted, nextReward: sum.nextReward, rewardEvery: REWARD_EVERY_LESSONS,
  };
});

route('POST', '/api/students/:id/shop', async (req, res, { user, params, body }) => {
  const s = studentFor(user, params.id);
  const item = SHOP.find((x) => x.id === body.itemId); if (!item) fail(404, 'Unknown item');
  s.owned = s.owned || []; s.equipped = s.equipped || {};
  if (body.action === 'equip') {
    if (!s.owned.includes(item.id)) fail(400, 'Buy this item first');
    s.equipped[item.kind] = s.equipped[item.kind] === item.id ? null : item.id;
    return { equipped: s.equipped };
  }
  if (item.kind !== 'consumable' && s.owned.includes(item.id)) fail(400, 'You already own this');
  if ((s.coins || 0) < item.price) fail(400, `You need ${item.price - (s.coins || 0)} more coins`);
  s.coins -= item.price;
  if (item.kind === 'consumable') s.freezes = (s.freezes || 0) + 1;
  else { s.owned.push(item.id); s.equipped[item.kind] = item.id; }
  pushInbox(s, { type: 'shop', title: `Unlocked: ${item.name}`, text: `Bought for ${item.price} coins`, icon: item.emoji || '🎨', seen: true });
  return { coins: s.coins, owned: s.owned, equipped: s.equipped, freezes: s.freezes || 0 };
});

route('GET', '/api/students/:id/certificates/:cid', async (req, res, { user, params }) => {
  const s = studentFor(user, params.id);
  const c = (s.certificates || []).find((x) => x.id === params.cid); if (!c) fail(404, 'Certificate not found');
  return { certificate: c, student: { name: s.name, yearGroup: s.yearGroup } };
});

route('POST', '/api/students/:id/goals', { roles: ['parent', 'admin'] }, async (req, res, { user, params, body }) => {
  const s = studentFor(user, params.id);
  const T = GOAL_TYPES[body.type]; if (!T) fail(400, 'Choose a goal type');
  const target = Math.trunc(Number(body.target));
  if (!(target >= 1 && target <= 100000)) fail(400, 'Enter a target number');
  if (body.type === 'grade' && target > 9) fail(400, 'Grades go up to 9');
  const reward = str(body.reward, 120); if (!reward) fail(400, 'Describe the reward');
  s.goals = s.goals || [];
  if (s.goals.filter((g) => !g.achievedAt).length >= 5) fail(400, 'Maximum 5 active goals');
  const g = { id: store.id('gol'), type: body.type, target, reward, createdAt: now(), baseline: T.relative ? T.metric(s) : 0, createdBy: user.id };
  s.goals.push(g);
  pushInbox(s, { type: 'goal-new', title: 'New reward goal!', text: `${T.label} ${target} to earn: ${reward}`, icon: '🎯' });
  return { goal: goalView(s, g) };
});

route('PATCH', '/api/students/:id/goals/:gid', { roles: ['parent', 'admin'] }, async (req, res, { user, params, body }) => {
  const s = studentFor(user, params.id);
  const g = (s.goals || []).find((x) => x.id === params.gid); if (!g) fail(404, 'Goal not found');
  if (body.delivered) { g.deliveredAt = now(); pushInbox(s, { type: 'goal-delivered', title: 'Reward delivered 🎁', text: g.reward, icon: '🎁' }); }
  return { goal: goalView(s, g) };
});

route('DELETE', '/api/students/:id/goals/:gid', { roles: ['parent', 'admin'] }, async (req, res, { user, params }) => {
  const s = studentFor(user, params.id);
  s.goals = (s.goals || []).filter((x) => x.id !== params.gid);
  return { ok: true };
});

// Billing
route('GET', '/api/billing', { roles: ['parent'] }, async (req, res, { user }) => ({
  credits: user.credits || 0, freeLessonAvailable: !user.freeLessonUsed, freeAccess: !!user.freeAccess, packs: PACKS, perLesson: PRICE_PER_LESSON,
  live: STRIPE_LIVE, cardVerified: !!user.cardVerified, card: user.cardVerified ? { brand: user.cardBrand, last4: user.cardLast4 } : null,
  payments: D().payments.filter((p) => p.parentId === user.id),
  ledger: D().ledger.filter((l) => l.parentId === user.id).slice(0, 50),
}));

function flatten(obj, prefix = '', out = {}) {
  for (const [k, v] of Object.entries(obj)) {
    const key = prefix ? `${prefix}[${k}]` : k;
    if (v && typeof v === 'object') flatten(v, key, out); else if (v !== undefined && v !== null) out[key] = String(v);
  }
  return out;
}
async function stripe(method, p, params) {
  const qs = params ? new URLSearchParams(flatten(params)).toString() : '';
  const r = await fetch(`https://api.stripe.com/v1${p}${method === 'GET' && qs ? '?' + qs : ''}`, {
    method, headers: { Authorization: `Bearer ${STRIPE_SECRET}`, 'Content-Type': 'application/x-www-form-urlencoded' }, body: method === 'GET' ? undefined : qs,
  });
  const j = await r.json();
  if (!r.ok) fail(402, j.error?.message || 'Payment provider error');
  return j;
}
async function ensureCustomer(user) {
  if (user.stripeCustomerId) return user.stripeCustomerId;
  const c = await stripe('POST', '/customers', { email: user.email, name: user.name, metadata: { userId: user.id } });
  user.stripeCustomerId = c.id; store.save();
  return c.id;
}
function creditPaymentIntent(pi) {
  if (pi.status !== 'succeeded' || D().payments.some((x) => x.providerRef === pi.id)) return null;
  const user = findUser(pi.metadata?.userId); const pack = PACKS.find((x) => x.id === pi.metadata?.packId);
  if (!user || !pack || pi.amount !== Math.round(pack.price * 100)) return null;
  const pay = { id: store.id('pay'), parentId: user.id, parentName: user.name, packId: pack.id, label: pack.label, amount: pack.price, currency: 'GBP',
    credits: pack.credits + pack.bonus, provider: 'stripe', providerRef: pi.id, status: 'succeeded', createdAt: now() };
  D().payments.unshift(pay);
  adjustCredits(user, pay.credits, `Purchase — ${pack.label}${pack.bonus ? ` (+${pack.bonus} bonus)` : ''}`, user);
  audit(user, 'payment', `£${pack.price.toFixed(2)} ${pack.label} (Stripe)`);
  store.save();
  return pay;
}

route('GET', '/api/billing/config', async (req, res, { user }) => {
  const owner = walletOwner(user);
  return { live: STRIPE_LIVE, publishableKey: STRIPE_LIVE ? STRIPE_PK : null, requireCardForTrial: REQUIRE_CARD_FOR_TRIAL,
    cardVerified: !!owner?.cardVerified, card: owner?.cardVerified ? { brand: owner.cardBrand, last4: owner.cardLast4 } : null, email: owner?.email || null };
});

// £0 card check: a SetupIntent confirmed in the browser with Stripe Elements (card data never touches this server).
route('POST', '/api/billing/setup-intent', { roles: ['parent'] }, async (req, res, { user }) => {
  if (!STRIPE_LIVE) fail(400, 'Card payments are not configured (demo mode)');
  const customer = await ensureCustomer(user);
  const si = await stripe('POST', '/setup_intents', { customer, usage: 'off_session', automatic_payment_methods: { enabled: true }, metadata: { userId: user.id, purpose: 'trial-check' } });
  return { clientSecret: si.client_secret };
});

route('POST', '/api/billing/verify-card', { roles: ['parent'] }, async (req, res, { user, body }) => {
  let fingerprint, brand, last4;
  if (STRIPE_LIVE) {
    const si = await stripe('GET', `/setup_intents/${encodeURIComponent(str(body.setupIntentId, 100))}`);
    if (si.metadata?.userId !== user.id || si.status !== 'succeeded') fail(400, 'Card check not completed');
    const pm = await stripe('GET', `/payment_methods/${encodeURIComponent(si.payment_method)}`);
    fingerprint = pm.card?.fingerprint || pm.id; brand = pm.card?.brand || pm.type; last4 = pm.card?.last4 || '';
  } else {
    if (!body.demo) fail(400, 'Demo mode: use the simulated check');
    fingerprint = 'demo-' + user.id; brand = 'demo'; last4 = '0000';
  }
  const reused = D().users.some((u) => u.id !== user.id && u.cardFingerprint === fingerprint);
  Object.assign(user, { cardVerified: true, cardFingerprint: fingerprint, cardBrand: brand, cardLast4: last4, cardVerifiedAt: now() });
  if (reused && !user.freeLessonUsed) user.freeLessonUsed = true;
  audit(user, 'card-verified', `${brand} ${last4}${reused ? ' (card already used for a trial)' : ''}`);
  return { verified: true, trialAvailable: !user.freeLessonUsed, message: reused ? 'This card has already been used for a free lesson on another account, so the free trial is not available. You can still buy lessons.' : 'Card checked — your free lesson is ready.' };
});

route('POST', '/api/billing/payment-intent', { roles: ['parent'] }, async (req, res, { user, body }) => {
  if (!STRIPE_LIVE) fail(400, 'Card payments are not configured (demo mode)');
  const pack = PACKS.find((p) => p.id === body.packId); if (!pack) fail(400, 'Unknown pack');
  const customer = await ensureCustomer(user);
  const pi = await stripe('POST', '/payment_intents', { amount: Math.round(pack.price * 100), currency: 'gbp', customer, automatic_payment_methods: { enabled: true },
    description: `Stepwise — ${pack.label}`, receipt_email: user.email, metadata: { userId: user.id, packId: pack.id } });
  return { clientSecret: pi.client_secret, id: pi.id };
});

route('POST', '/api/billing/confirm', { roles: ['parent'] }, async (req, res, { user, body }) => {
  if (!STRIPE_LIVE) fail(400, 'Demo mode');
  const pi = await stripe('GET', `/payment_intents/${encodeURIComponent(str(body.paymentIntentId, 100))}`);
  if (pi.metadata?.userId !== user.id) fail(403, 'Not your payment');
  if (pi.status !== 'succeeded') fail(402, `Payment ${pi.status.replace(/_/g, ' ')}`);
  const pay = creditPaymentIntent(pi) || D().payments.find((x) => x.providerRef === pi.id);
  return { payment: pay, credits: user.credits };
});

// Simulated checkout (demo mode only).
route('POST', '/api/billing/checkout', { roles: ['parent'] }, async (req, res, { user, body }) => {
  if (STRIPE_LIVE) fail(400, 'Please pay by card');
  const pack = PACKS.find((p) => p.id === body.packId); if (!pack) fail(400, 'Unknown pack');
  const pay = { id: store.id('pay'), parentId: user.id, parentName: user.name, packId: pack.id, label: pack.label, amount: pack.price, currency: 'GBP',
    credits: pack.credits + pack.bonus, provider: 'simulated', status: 'succeeded', createdAt: now() };
  D().payments.unshift(pay);
  adjustCredits(user, pay.credits, `Purchase — ${pack.label}${pack.bonus ? ` (+${pack.bonus} bonus)` : ''}`, user);
  audit(user, 'payment', `£${pack.price.toFixed(2)} ${pack.label}`);
  return { payment: pay, credits: user.credits };
});

// Admin
const ADMIN = { roles: ['admin'] };
route('GET', '/api/admin/stats', ADMIN, async () => {
  const d = D(); const users = d.users;
  const revenue = d.payments.filter((p) => p.status === 'succeeded').reduce((t, p) => t + p.amount, 0);
  const days = []; const dt = new Date(); dt.setUTCDate(dt.getUTCDate() - 29);
  for (let i = 0; i < 30; i++) {
    const k = dt.toISOString().slice(0, 10);
    days.push({ date: k,
      revenue: d.payments.filter((p) => p.createdAt.slice(0, 10) === k).reduce((t, p) => t + p.amount, 0),
      lessons: d.lessons.filter((l) => l.createdAt.slice(0, 10) === k).length,
      signups: users.filter((u) => u.createdAt.slice(0, 10) === k && u.role === 'parent').length });
    dt.setUTCDate(dt.getUTCDate() + 1);
  }
  const yearMix = YEARS.map((y) => ({ year: y, n: users.filter((u) => u.role === 'student' && u.yearGroup === y).length }));
  const counts = {};
  d.lessons.forEach((l) => { if (l.topicId) counts[l.topicId] = (counts[l.topicId] || 0) + 1; });
  const topTopics = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 6).map(([k, n]) => ({ name: C.getTopic(k)?.name || k, n }));
  return {
    parents: users.filter((u) => u.role === 'parent').length, students: users.filter((u) => u.role === 'student').length,
    admins: users.filter((u) => u.role === 'admin').length, suspended: users.filter((u) => u.status !== 'active').length,
    freeAccess: users.filter((u) => u.freeAccess).length,
    revenue, payments: d.payments.length, lessons: d.lessons.length, lessonsCompleted: d.lessons.filter((l) => l.status === 'completed').length,
    exams: d.examAttempts.filter((a) => a.submittedAt).length, creditsOutstanding: users.reduce((t, u) => t + (u.credits || 0), 0),
    days, yearMix, topTopics, audit: d.audit.slice(0, 25),
    curriculum: { topics: C.TOPICS.length, styles: C.TOPICS.reduce((n, t) => n + t.styles.length, 0), subjects: C.SUBJECTS.length, learn: Object.keys(LEARN).length },
  };
});

route('GET', '/api/admin/users', ADMIN, async () => {
  const d = D();
  return { users: d.users.map((u) => ({
    ...publicUser(u),
    parentName: u.parentId ? findUser(u.parentId)?.name : undefined,
    parentFree: u.parentId ? !!findUser(u.parentId)?.freeAccess : undefined,
    childCount: u.role === 'parent' ? children(u.id).length : undefined,
    spent: u.role === 'parent' ? d.payments.filter((p) => p.parentId === u.id).reduce((t, p) => t + p.amount, 0) : undefined,
    lessons: u.role === 'student' ? d.lessons.filter((l) => l.studentId === u.id).length : undefined,
  })) };
});

route('GET', '/api/admin/users/:id', ADMIN, async (req, res, { params }) => {
  const u = findUser(params.id); if (!u) fail(404, 'User not found');
  const d = D();
  return {
    user: publicUser(u), parent: u.parentId ? publicUser(findUser(u.parentId)) : null,
    children: u.role === 'parent' ? children(u.id).map((c) => ({ ...publicUser(c), summary: summary(c) })) : [],
    summary: u.role === 'student' ? summary(u) : null,
    payments: d.payments.filter((p) => p.parentId === u.id),
    ledger: d.ledger.filter((l) => l.parentId === u.id).slice(0, 30),
  };
});

route('POST', '/api/admin/users', ADMIN, async (req, res, { user, body }) => {
  const role = ['admin', 'parent'].includes(body.role) ? body.role : 'parent';
  const name = str(body.name, 80), email = str(body.email, 160).toLowerCase();
  if (!name) fail(400, 'Name required'); if (!validEmail(email)) fail(400, 'Valid email required');
  validPassword(body.password);
  if (D().users.some((u) => u.email === email)) fail(409, 'Email already in use');
  const { salt, hash } = store.hashPassword(body.password);
  const u = { id: store.id('usr'), role, name, email, salt, passHash: hash, status: 'active', credits: 0, freeLessonUsed: false, freeAccess: !!body.freeAccess, createdAt: now(), avatarColor: pickColor() };
  D().users.push(u); audit(user, 'admin-create-user', `${role} ${email}${u.freeAccess ? ' (free access)' : ''}`);
  return { user: publicUser(u) };
});

route('PATCH', '/api/admin/users/:id', ADMIN, async (req, res, { user, params, body }) => {
  const u = findUser(params.id); if (!u) fail(404, 'User not found');
  if (body.status && ['active', 'suspended'].includes(body.status)) {
    if (u.id === user.id) fail(400, 'You cannot suspend yourself');
    u.status = body.status; audit(user, `user-${body.status}`, u.name);
    if (body.status === 'suspended') for (const [k, v] of Object.entries(D().sessions)) if (v.userId === u.id) delete D().sessions[k];
  }
  if (body.role && u.role !== 'student' && ['admin', 'parent'].includes(body.role) && body.role !== u.role) {
    if (u.id === user.id) fail(400, 'You cannot change your own role');
    u.role = body.role; audit(user, 'role-change', `${u.name} → ${body.role}`);
  }
  if (typeof body.freeAccess === 'boolean' && u.role !== 'admin') {
    u.freeAccess = body.freeAccess; audit(user, body.freeAccess ? 'free-access-on' : 'free-access-off', u.name);
  }
  if (body.name) u.name = str(body.name, 80);
  if (u.role === 'student') Object.assign(u, childInput({ yearGroup: body.yearGroup, tier: body.tier, targetGrade: body.targetGrade, username: body.username }, u));
  if (body.creditDelta) {
    const n = Math.trunc(Number(body.creditDelta)); const owner = walletOwner(u);
    if (!n || !owner || owner.role === 'admin') fail(400, 'Credits can only be adjusted on parent accounts');
    if ((owner.credits || 0) + n < 0) fail(400, 'Balance cannot go below zero');
    adjustCredits(owner, n, str(body.reason, 120) || 'Admin adjustment', user); audit(user, 'credit-adjust', `${owner.name} ${n > 0 ? '+' : ''}${n}`);
  }
  if (body.coinDelta && u.role === 'student') {
    const n = Math.trunc(Number(body.coinDelta)); u.coins = Math.max(0, (u.coins || 0) + n);
    if (n > 0) pushInbox(u, { type: 'gift', title: 'You received coins!', text: `+${n} coins from the Stepwise team`, icon: '🪙' });
    audit(user, 'coin-adjust', `${u.name} ${n > 0 ? '+' : ''}${n}`);
  }
  if (body.resetFreeLesson && u.role === 'parent') u.freeLessonUsed = false;
  return { user: publicUser(u) };
});

route('POST', '/api/admin/users/:id/password', ADMIN, async (req, res, { user, params, body }) => {
  const u = findUser(params.id); if (!u) fail(404, 'User not found');
  validPassword(body.password);
  const { salt, hash } = store.hashPassword(body.password); u.salt = salt; u.passHash = hash;
  for (const [k, v] of Object.entries(D().sessions)) if (v.userId === u.id) delete D().sessions[k];
  audit(user, 'password-reset', u.name);
  return { ok: true };
});

route('DELETE', '/api/admin/users/:id', ADMIN, async (req, res, { user, params }) => {
  const u = findUser(params.id); if (!u) fail(404, 'User not found');
  if (u.id === user.id) fail(400, 'You cannot delete yourself');
  if (u.role === 'student') deleteStudent(u); else deleteParent(u);
  audit(user, 'delete-user', `${u.role} ${u.name}`);
  return { ok: true };
});

route('GET', '/api/admin/payments', ADMIN, async () => ({ payments: D().payments, ledger: D().ledger.slice(0, 200) }));

// ---------- static ----------
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png', '.ico': 'image/x-icon', '.json': 'application/json' };
function serveStatic(req, res, pathname) {
  let file = path.normalize(path.join(PUBLIC, decodeURIComponent(pathname)));
  if (!file.startsWith(PUBLIC)) { res.writeHead(403); return res.end(); }
  if (!fs.existsSync(file) || fs.statSync(file).isDirectory()) file = path.join(PUBLIC, 'index.html');
  res.writeHead(200, { 'Content-Type': MIME[path.extname(file)] || 'application/octet-stream', 'X-Content-Type-Options': 'nosniff', 'Cache-Control': 'no-cache' });
  fs.createReadStream(file).pipe(res);
}

// Stripe webhook: credits the wallet even if the browser closes before /api/billing/confirm.
function stripeWebhook(req, res) {
  const chunks = [];
  req.on('data', (c) => chunks.push(c));
  req.on('end', () => {
    try {
      const raw = Buffer.concat(chunks).toString('utf8');
      const sig = Object.fromEntries(String(req.headers['stripe-signature'] || '').split(',').map((kv) => kv.split('=')));
      const expected = crypto.createHmac('sha256', STRIPE_WHSEC).update(`${sig.t}.${raw}`).digest('hex');
      const ok = STRIPE_WHSEC && sig.v1 && sig.v1.length === expected.length && crypto.timingSafeEqual(Buffer.from(sig.v1), Buffer.from(expected)) && Math.abs(Date.now() / 1000 - Number(sig.t)) < 600;
      if (!ok) return send(res, 400, { error: 'Bad signature' });
      const ev = JSON.parse(raw);
      if (ev.type === 'payment_intent.succeeded') creditPaymentIntent(ev.data.object);
      send(res, 200, { received: true });
    } catch (e) { console.error(e); send(res, 400, { error: 'Bad payload' }); }
  });
}

// ---------- server ----------
const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://x');
  if (!url.pathname.startsWith('/api/')) return serveStatic(req, res, url.pathname);
  if (url.pathname === '/api/billing/webhook' && req.method === 'POST') return stripeWebhook(req, res);
  try {
    if (req.method !== 'GET') {
      // CSRF: state-changing requests must come from our own origin
      const origin = req.headers.origin;
      if (origin && new URL(origin).host !== req.headers.host) fail(403, 'Bad origin');
    }
    for (const r of routes) {
      if (r.method !== req.method) continue;
      const m = url.pathname.match(r.re); if (!m) continue;
      const params = Object.fromEntries(r.keys.map((k, i) => [k, decodeURIComponent(m[i + 1])]));
      const user = currentUser(req);
      if (r.auth && !user) fail(401, 'Please sign in');
      if (r.roles && !r.roles.includes(user.role)) fail(403, 'Not allowed');
      const body = ['POST', 'PATCH', 'PUT', 'DELETE'].includes(req.method) ? await readBody(req) : {};
      const out = await r.handler(req, res, { user, params, body, query: url.searchParams });
      store.save();
      return send(res, 200, out);
    }
    fail(404, 'Not found');
  } catch (e) {
    if (!(e instanceof HttpError)) console.error(e);
    send(res, e.status || 500, { error: e.status ? e.message : 'Something went wrong' });
  }
});

store.load();
if (require.main === module) {
  if (!store.data.users.some((u) => u.role === 'admin')) console.log('No admin found — run `npm run seed` or `npm run create-admin`.');
  process.on('SIGINT', () => { store.flush(); process.exit(0); });
  process.on('SIGTERM', () => { store.flush(); process.exit(0); });
  server.listen(PORT, () => console.log(`Stepwise running on http://localhost:${PORT}`));
}
module.exports = { server, EXAMS, YEARS, gradeFor, checkRewards, summary };
