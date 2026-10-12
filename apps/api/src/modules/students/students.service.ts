// Read model for a student: loads everything once per request, then computes summaries in memory.
import type { Deps } from '../../core/deps.js';
import type { Db } from '../../db/client.js';
import type { Topic } from '../../content/types.js';
import { addDays, today } from '../../core/dates.js';
import * as repo from './students.repo.js';
import { levelInfo, gradeFor, styleStatus, REWARD_EVERY_LESSONS, shuffle } from '../common/domain.js';

export type Student = repo.Student;
export interface StudentState {
  student: Student;
  progress: repo.ProgressMap;
  activity: Record<string, number>;
  exams: Awaited<ReturnType<typeof repo.submittedExams>>;
  lessons: number; reviews: number; perfect: boolean;
  certificates: Awaited<ReturnType<typeof repo.certificatesOf>>;
}

export function publicUser(u: Partial<Student> & { id: string }) {
  const { passwordHash, ...rest } = u as Student;
  void passwordHash;
  return rest;
}

export function createStudentService(deps: Deps) {
  const { content } = deps;
  const targetFor = (s: Student, subject: string) => (s.targets && s.targets[subject]) || s.targetGrade || 7;
  const inScope = (s: Student, t: Topic) => !(t.year > s.yearGroup) && !(s.tier === 'F' && t.tier === 'H' && content.getSubject(t.subject)?.tiers);
  const attemptSubject = (a: { subject: string | null; examId: string }) => a.subject || 'maths';

  async function load(db: Db, studentId: string): Promise<StudentState | undefined> {
    const student = await repo.getStudent(db, studentId);
    if (!student) return undefined;
    const [progress, activity, exams, counts, perfect, certificates] = await Promise.all([
      repo.progressMap(db, studentId), repo.activityMap(db, studentId, addDays(-120)), repo.submittedExams(db, studentId),
      repo.lessonCounts(db, studentId), repo.hasPerfectLesson(db, studentId), repo.certificatesOf(db, studentId),
    ]);
    return { student, progress, activity, exams, lessons: counts.lessons, reviews: counts.reviews, perfect, certificates };
  }

  function streak(st: StudentState) {
    const frozen = new Set(st.student.frozenDays || []);
    const has = (k: string) => st.activity[k] || frozen.has(k);
    let n = 0; const d = new Date();
    if (!has(d.toISOString().slice(0, 10))) d.setUTCDate(d.getUTCDate() - 1);
    while (has(d.toISOString().slice(0, 10))) { if (st.activity[d.toISOString().slice(0, 10)]) n++; d.setUTCDate(d.getUTCDate() - 1); }
    return n;
  }

  function summary(st: StudentState, subject: string | null = null) {
    const s = st.student; const p = st.progress;
    let correct = 0, incorrect = 0, skipped = 0, done = 0, mastered = 0, scopeStyles = 0, scopeTouched = 0, scopeCorrect = 0, scopeAnswered = 0;
    const groups = subject ? content.strands.filter((x) => x.subject === subject) : content.subjects;
    const agg: Record<string, { correct: number; answered: number; styles: number; mastered: number }> = {};
    for (const g of groups) agg[g.id] = { correct: 0, answered: 0, styles: 0, mastered: 0 };
    for (const t of content.topics) {
      if (subject && t.subject !== subject) continue;
      const inS = inScope(s, t);
      const a = (agg[subject ? t.strand : t.subject] ||= { correct: 0, answered: 0, styles: 0, mastered: 0 });
      for (const sid of t.styles) {
        const r = p[sid]; const status = styleStatus(r);
        if (inS) { scopeStyles++; a.styles++; }
        if (status === 'mastered') { mastered++; if (inS) a.mastered++; }
        if (!r) continue;
        correct += r.correct; incorrect += r.incorrect; skipped += r.skipped; done += r.done;
        if (inS) { if (r.done) scopeTouched++; scopeCorrect += r.correct; scopeAnswered += r.done - r.skipped; a.correct += r.correct; a.answered += r.done - r.skipped; }
      }
    }
    const exams = st.exams.filter((e) => !subject || attemptSubject(e) === subject);
    const accuracy = scopeAnswered ? scopeCorrect / scopeAnswered : null;
    const coverage = scopeStyles ? scopeTouched / scopeStyles : 0;
    let predicted: number | 'U' | null = null;
    if (subject && (scopeAnswered >= 10 || exams.length)) {
      const practice = accuracy == null ? null : accuracy * 100 * (0.55 + 0.45 * coverage);
      const recent = exams.filter((e) => e.kind !== 'topic').slice(-3);
      const examPct = recent.length ? recent.reduce((t, e) => t + (e.pct || 0), 0) / recent.length : null;
      const blended = practice == null ? (examPct ?? 0) : examPct == null ? practice : practice * 0.4 + examPct * 0.6;
      predicted = gradeFor(blended, content.getSubject(subject)?.tiers ? s.tier : 'H');
    }
    const strands = groups.map((g) => { const a = agg[g.id]; return { id: g.id, name: g.name, color: g.color, icon: g.icon, accuracy: a.answered ? Math.round((a.correct / a.answered) * 100) : null, mastered: a.mastered, styles: a.styles }; });
    const level = levelInfo(s.xp);
    const sum = {
      subject, correct, incorrect, skipped, done, mastered, accuracy: accuracy == null ? null : Math.round(accuracy * 100), coverage: Math.round(coverage * 100), scopeStyles,
      predicted, targetGrade: subject ? targetFor(s, subject) : s.targetGrade, level, streak: streak(st), coins: s.coins, freezes: s.freezes, strands,
      lessonsCompleted: st.lessons, reviewsCompleted: st.reviews, mistakesFixed: s.mistakesFixed, nextReward: REWARD_EVERY_LESSONS - (st.lessons % REWARD_EVERY_LESSONS),
      exams: exams.filter((e) => e.kind !== 'topic').map((e) => ({ id: e.id, examId: e.examId, subject: attemptSubject(e), name: e.name, pct: e.pct, grade: e.grade == null ? null : isNaN(Number(e.grade)) ? e.grade : Number(e.grade), at: e.submittedAt })),
      certificates: st.certificates.length,
      badges: [] as ReturnType<typeof badgeDefs>,
    };
    sum.badges = badgeDefs(st, sum).map((b) => ({ ...b, at: (s.badges || {})[b.id] || null }));
    return sum;
  }

  function badgeDefs(st: StudentState, s: { correct: number; mastered: number; streak: number; level: { level: number } }) {
    const grades = st.exams.map((e) => Number(e.grade)).filter((g) => !isNaN(g));
    const certs = st.certificates;
    return [
      { id: 'first-lesson', name: 'First Steps', desc: 'Complete your first lesson', icon: '🚀', got: st.lessons >= 1 },
      { id: 'ten-lessons', name: 'Committed', desc: 'Complete 10 lessons', icon: '📚', got: st.lessons >= 10 },
      { id: 'fifty-lessons', name: 'Dedicated', desc: 'Complete 50 lessons', icon: '🎒', got: st.lessons >= 50 },
      { id: 'perfect', name: 'Flawless', desc: 'Get every question right first time in a lesson', icon: '💎', got: st.perfect },
      { id: 'c50', name: 'Half Century', desc: '50 correct answers', icon: '🎯', got: s.correct >= 50 },
      { id: 'c250', name: 'Sharpshooter', desc: '250 correct answers', icon: '🏹', got: s.correct >= 250 },
      { id: 'c1000', name: 'Thousand Club', desc: '1,000 correct answers', icon: '🥇', got: s.correct >= 1000 },
      { id: 'streak3', name: 'On a Roll', desc: '3-day streak', icon: '🔥', got: s.streak >= 3 },
      { id: 'streak7', name: 'Week Warrior', desc: '7-day streak', icon: '⚡', got: s.streak >= 7 },
      { id: 'streak30', name: 'Unstoppable', desc: '30-day streak', icon: '🌋', got: s.streak >= 30 },
      { id: 'master5', name: 'Skill Builder', desc: 'Master 5 styles', icon: '🧩', got: s.mastered >= 5 },
      { id: 'master25', name: 'Topic Titan', desc: 'Master 25 styles', icon: '🏆', got: s.mastered >= 25 },
      { id: 'master100', name: 'Maths Legend', desc: 'Master 100 styles', icon: '👑', got: s.mastered >= 100 },
      { id: 'review1', name: 'Look Back', desc: 'Complete a review session', icon: '🔁', got: st.reviews >= 1 },
      { id: 'review10', name: 'Memory Master', desc: 'Complete 10 review sessions', icon: '🧠', got: st.reviews >= 10 },
      { id: 'fix10', name: 'Fixer', desc: 'Fix 10 past mistakes', icon: '🔧', got: st.student.mistakesFixed >= 10 },
      { id: 'exam1', name: 'Test Taker', desc: 'Complete an exam or topic test', icon: '📝', got: st.exams.length >= 1 },
      { id: 'grade7', name: 'Grade 7+', desc: 'Score grade 7 or above in an exam', icon: '🌟', got: grades.some((g) => g >= 7) },
      { id: 'grade9', name: 'Top Grade', desc: 'Score grade 9 in an exam', icon: '💫', got: grades.some((g) => g === 9) },
      { id: 'cert-topic', name: 'Certified', desc: 'Earn a topic certificate', icon: '📜', got: certs.some((c) => c.kind === 'topic') },
      { id: 'cert-year', name: 'Year Complete', desc: 'Complete a whole school year', icon: '🎓', got: certs.some((c) => c.kind === 'year') },
      { id: 'level10', name: 'Level 10', desc: 'Reach level 10', icon: '🔟', got: s.level.level >= 10 },
    ];
  }

  function recommendations(st: StudentState, subject = 'maths') {
    const s = st.student; const p = st.progress;
    const recs: { styleId: string; topicId: string; reason: string; topic: string; name: string }[] = [];
    const topics = content.topics.filter((t) => t.subject === subject && inScope(s, t))
      .sort((a, b) => Number(b.year === s.yearGroup) - Number(a.year === s.yearGroup) || a.year - b.year || a.term - b.term);
    for (const t of topics) for (const sid of t.styles) {
      const r = p[sid]; if (!r) continue; const ans = r.done - r.skipped;
      if (ans >= 4 && r.correct / ans < 0.6) recs.push({ styleId: sid, topicId: t.id, reason: 'Needs practice', topic: t.name, name: content.getStyle(sid)?.name || sid });
    }
    for (const t of topics) for (const sid of t.styles) {
      if (recs.length >= 4) break;
      if (!p[sid]) recs.push({ styleId: sid, topicId: t.id, reason: t.year < s.yearGroup ? 'Catch up' : 'Up next', topic: t.name, name: content.getStyle(sid)?.name || sid });
    }
    return recs.slice(0, 4);
  }

  function weeklyActivity(st: StudentState, days = 84) {
    const out: { date: string; n: number }[] = []; const d = new Date(); d.setUTCDate(d.getUTCDate() - days + 1);
    for (let i = 0; i < days; i++) { const k = d.toISOString().slice(0, 10); out.push({ date: k, n: st.activity[k] || 0 }); d.setUTCDate(d.getUTCDate() + 1); }
    return out;
  }

  async function reviewStatus(db: Db, studentId: string) {
    const [rows, mis] = await Promise.all([repo.reviewRows(db, studentId), repo.mistakesOf(db, studentId)]);
    const T = today();
    const info = (styleId: string) => { const st = content.getStyle(styleId); return { name: st?.name || styleId, topic: content.getTopic(st?.topicId)?.name || '' }; };
    const valid = rows.filter((r) => content.getStyle(r.styleId)).sort((a, b) => (a.due < b.due ? -1 : 1));
    const due = valid.filter((r) => r.due <= T).map((r) => ({ styleId: r.styleId, ...info(r.styleId), box: r.box, due: r.due }));
    const upcoming = valid.filter((r) => r.due > T).slice(0, 8).map((r) => ({ styleId: r.styleId, ...info(r.styleId), box: r.box, due: r.due }));
    const mistakes = mis.filter((m) => content.getStyle(m.styleId)).map((m) => ({ id: m.id, styleId: m.styleId, ...info(m.styleId), html: (m.question as { html: string }).html, at: m.createdAt, source: m.source, tries: m.tries }));
    const boxes = [0, 0, 0, 0, 0, 0, 0]; valid.forEach((r) => { boxes[Math.max(0, Math.min(6, r.box))]++; });
    return { due, dueCount: due.length, upcoming, mistakes, mistakeCount: mistakes.length, boxes, tracked: valid.length };
  }

  // Past-question items: mistakes first, then due styles, then other practised styles.
  async function pickReviewItems(db: Db, st: StudentState, n: number, excludeStyle: string | null) {
    const items: Record<string, unknown>[] = []; const used = new Set<string>();
    const mis = (await repo.mistakesOf(db, st.student.id)).reverse();
    for (const m of mis) {
      if (items.length >= Math.ceil(n / 2)) break;
      if (m.styleId === excludeStyle || !content.getStyle(m.styleId)) continue;
      items.push({ ...(m.question as object), styleId: m.styleId, review: 'mistake', mistakeId: m.id }); used.add(m.styleId);
    }
    const T = today();
    const due = (await repo.reviewRows(db, st.student.id)).filter((r) => r.due <= T && r.styleId !== excludeStyle && !used.has(r.styleId) && content.getStyle(r.styleId)).sort((a, b) => (a.due < b.due ? -1 : 1));
    for (const d of due) { if (items.length >= n) break; items.push({ ...content.generate(d.styleId), styleId: d.styleId, review: 'due' }); used.add(d.styleId); }
    for (const sid of shuffle(Object.keys(st.progress).filter((x) => content.getStyle(x) && x !== excludeStyle && !used.has(x)))) {
      if (items.length >= n) break; items.push({ ...content.generate(sid), styleId: sid, review: 'practice' });
    }
    return items;
  }

  return { load, summary, recommendations, weeklyActivity, reviewStatus, pickReviewItems, streak, inScope, targetFor, attemptSubject, styleStatus };
}
export type StudentService = ReturnType<typeof createStudentService>;
