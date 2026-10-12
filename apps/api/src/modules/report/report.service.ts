import { eq } from 'drizzle-orm';
import * as s from '../../db/schema.js';
import type { Db } from '../../db/client.js';
import type { Deps } from '../../core/deps.js';
import { addDays, gcseExamDate, schoolTerm, today, TERM_NAMES } from '../../core/dates.js';
import { occursOn, styleStatus } from '../common/domain.js';
import * as repo from '../students/students.repo.js';
import { publicUser, type StudentService, type StudentState } from '../students/students.service.js';
import type { ExamService } from '../exams/exams.service.js';
import type { TaskService } from '../tasks/tasks.service.js';
import type { MissionService } from '../missions/missions.service.js';

const STATUS: Record<string, { label: string; tone: string }> = {
  ahead: { label: 'Ahead of target', tone: 'good' }, ontrack: { label: 'On track', tone: 'good' }, close: { label: 'Close to target', tone: 'warn' },
  focus: { label: 'Needs focus', tone: 'bad' }, nodata: { label: 'Not enough data yet', tone: '' },
};

export function createReportService(deps: Deps, students: StudentService, exams: ExamService, tasks: TaskService, missions: MissionService) {
  const { content } = deps;

  async function subjectReport(st: StudentState, subject: string) {
    const student = st.student; const sub = content.getSubject(subject)!; const p = st.progress;
    const sum = students.summary(st, subject); const target = students.targetFor(student, subject);
    const term = schoolTerm();
    const topics = content.topics.filter((t) => t.subject === subject && students.inScope(student, t));
    const expStyles = topics.filter((t) => t.year < student.yearGroup || (t.year === student.yearGroup && t.term <= term)).flatMap((t) => t.styles);
    const startedExpected = expStyles.filter((sid) => p[sid] && p[sid].done).length;
    const schedulePct = expStyles.length ? Math.round((startedExpected / expStyles.length) * 100) : 100;
    const styleStats = topics.flatMap((t) => t.styles.map((sid) => { const r = p[sid]; const ans = r ? r.done - r.skipped : 0; return { styleId: sid, name: content.getStyle(sid)?.name || sid, topic: t.name, topicId: t.id, year: t.year, answered: ans, acc: ans ? r!.correct / ans : null, status: styleStatus(r) }; }));
    const weak = styleStats.filter((x) => x.answered >= 4 && (x.acc as number) < 0.65).sort((a, b) => (a.acc as number) - (b.acc as number)).slice(0, 6).map((x) => ({ ...x, acc: Math.round((x.acc as number) * 100) }));
    const strongTopics = topics.filter((t) => t.styles.length && t.styles.every((sid) => styleStatus(p[sid]) === 'mastered')).map((t) => t.name);
    const strands = sum.strands.filter((x) => x.accuracy != null).sort((a, b) => (b.accuracy as number) - (a.accuracy as number));
    const gap = typeof sum.predicted === 'number' ? target - sum.predicted : null;
    const statusKey = gap == null ? 'nodata' : gap < 0 ? 'ahead' : gap === 0 ? 'ontrack' : gap === 1 ? 'close' : 'focus';
    const order = (t: { year: number; term: number }) => (t.year - student.yearGroup) * 10 + t.term;
    const nextNew = topics.slice().sort((a, b) => order(a) - order(b)).flatMap((t) => t.styles.filter((sid) => !p[sid]).map((sid) => ({ styleId: sid, name: content.getStyle(sid)?.name || sid, topic: t.name, topicId: t.id, year: t.year, term: t.term, catchUp: t.year < student.yearGroup || (t.year === student.yearGroup && t.term < term) }))).filter((x) => x.year <= student.yearGroup).slice(0, 12);
    const recentExams = st.exams.filter((e) => students.attemptSubject(e) === subject && e.kind !== 'topic').slice(-4).map((e) => ({ name: e.name, pct: e.pct, grade: isNaN(Number(e.grade)) ? e.grade : Number(e.grade), at: e.submittedAt }));
    const trend = recentExams.length >= 2 ? (recentExams[recentExams.length - 1].pct || 0) - (recentExams[0].pct || 0) : null;
    const upcoming = (await exams.status(student.id, subject)).filter((e) => e.hasContent && !e.best && e.year === student.yearGroup && e.term >= term).slice(0, 2).map((e) => ({ id: e.id, name: e.name, term: e.termName }));
    const c: string[] = [];
    if (statusKey === 'nodata') c.push(`Not enough work yet to predict a grade — completing a few lessons and the ${upcoming[0] ? upcoming[0].name : 'next checkpoint'} will give a clear picture.`);
    else c.push(`${student.name} is currently working at grade ${sum.predicted} against a target of ${target} — ${STATUS[statusKey].label.toLowerCase()}.`);
    if (strands[0]) c.push(`Strongest area: ${strands[0].name} (${strands[0].accuracy}% accuracy)${strongTopics.length ? `, with ${strongTopics.length} topic${strongTopics.length > 1 ? 's' : ''} fully mastered` : ''}.`);
    if (weak.length) c.push(`Main area to improve: ${weak[0].name} in ${weak[0].topic} (${weak[0].acc}% correct)${weak[1] ? ` and ${weak[1].name}` : ''}.`);
    if (expStyles.length) c.push(schedulePct < 50 ? `Behind the expected pace for this point in Year ${student.yearGroup}: ${schedulePct}% of topics so far have been started — a little practice each week will close the gap.` : `Good pace: ${schedulePct}% of the topics expected by now have been started.`);
    if (trend != null) c.push(trend >= 5 ? `Exam scores are rising (+${trend} percentage points across recent tests).` : trend <= -5 ? `Exam scores have dipped recently (${trend} points) — the review sessions will help consolidate.` : 'Exam scores are steady.');
    return { id: subject, name: sub.name, icon: sub.icon, color: sub.color, board: `${sub.board} ${sub.spec || ''}`.trim(), predicted: sum.predicted, target, gap, status: { key: statusKey, ...STATUS[statusKey] },
      accuracy: sum.accuracy, coverage: sum.coverage, mastered: sum.mastered, correct: sum.correct, schedulePct, expectedStyles: expStyles.length, strands: sum.strands,
      strongAreas: strands.slice(0, 2).map((x) => x.name), strongTopics: strongTopics.slice(0, 6), weak, nextNew, exams: recentExams, trend, upcoming, comment: c };
  }

  async function build(db: Db, studentId: string) {
    const st = (await students.load(db, studentId))!; const student = st.student;
    const enrolled = (student.subjects?.length ? student.subjects : content.subjects.map((x) => x.id)).filter((x) => content.getSubject(x));
    const subjects = [];
    for (const sid of enrolled) subjects.push(await subjectReport(st, sid));
    const overall = students.summary(st);
    const act = st.activity; const sumDays = (a: number, b: number) => { let n = 0; for (let i = a; i < b; i++) n += act[addDays(-i)] || 0; return n; };
    const rv = await students.reviewStatus(db, studentId);
    const examDate = gcseExamDate(student.yearGroup);
    const pressure = subjects.reduce((t, x) => t + Math.max(0, x.gap || 0) + (x.schedulePct < 50 ? 1 : 0), 0);
    const perWeek = Math.min(8, Math.max(3, 2 + Math.ceil(pressure / 2) + (student.yearGroup >= 10 ? 1 : 0)));
    type Item = { kind: string; name: string; why: string; styleId?: string; topic?: string; topicId?: string; examId?: string; mode?: string; subject?: string; subjectName?: string; icon?: string; color?: string };
    const queues = subjects.map((x) => ({ sub: x, credit: 0,
      weight: 1 + Math.max(0, x.gap || 0) + (x.status.key === 'nodata' ? 0.5 : 0) + (x.schedulePct < 50 ? 1 : 0) + (x.id === 'maths' || x.id.startsWith('english') ? 0.5 : 0),
      items: [...x.weak.map((w) => ({ kind: 'practise', styleId: w.styleId, name: w.name, topic: w.topic, topicId: w.topicId, why: `Only ${w.acc}% correct so far` })),
        ...x.nextNew.map((n) => ({ kind: 'learn', styleId: n.styleId, name: n.name, topic: n.topic, topicId: n.topicId, why: n.year < student.yearGroup ? `Catch up — Year ${n.year} topic` : n.catchUp ? 'Catch up — taught earlier this year' : `Year ${n.year} ${TERM_NAMES[n.term]} term` }))] as Item[] })).filter((q) => q.items.length);
    const weeks: { n: number; from: string; items: Item[]; minutes: number }[] = [];
    const start = new Date(); start.setUTCDate(start.getUTCDate() - ((start.getUTCDay() + 6) % 7));
    for (let w = 0; w < 6; w++) {
      const items: Item[] = [{ kind: 'review', name: rv.mistakeCount && w === 0 ? `Fix ${Math.min(rv.mistakeCount, 10)} past mistakes` : 'Daily review session', why: 'Free · spaced repetition keeps earlier topics fresh', mode: rv.mistakeCount && w === 0 ? 'mistakes' : 'mixed' }];
      for (let k = 0; k < perWeek; k++) {
        const live = queues.filter((q) => q.items.length); if (!live.length) break;
        live.forEach((q) => (q.credit += q.weight));
        const q = live.sort((a, b) => b.credit - a.credit)[0]; q.credit -= live.reduce((t, x) => t + x.weight, 0);
        items.push({ ...q.items.shift()!, subject: q.sub.id, subjectName: q.sub.name, icon: q.sub.icon, color: q.sub.color });
      }
      if (w === 2 || w === 5) {
        const learned = [...items, ...weeks.flatMap((x) => x.items)].filter((x) => x.topicId);
        const t = learned[learned.length - 1];
        const up = subjects.find((x) => x.upcoming.length && !weeks.some((wk) => wk.items.some((i) => i.examId === x.upcoming[0].id)));
        if (w === 5 && up) items.push({ kind: 'exam', examId: up.upcoming[0].id, name: up.upcoming[0].name, subject: up.id, subjectName: up.name, icon: up.icon, color: up.color, why: 'Checkpoint for this term — measures progress towards the target grade' });
        else if (t) items.push({ kind: 'test', examId: `topic:${t.topicId}`, name: `${t.topic} — topic test`, subject: t.subject, subjectName: t.subjectName, icon: t.icon, color: t.color, why: 'Check that this topic has stuck' });
      }
      const from = new Date(start); from.setUTCDate(from.getUTCDate() + w * 7);
      weeks.push({ n: w + 1, from: from.toISOString().slice(0, 10), items, minutes: items.reduce((t, i) => t + ({ review: 10, practise: 20, learn: 20, test: 25, exam: 25 } as Record<string, number>)[i.kind], 0) });
    }
    const milestones = [];
    for (let y = student.yearGroup; y <= 11; y++) {
      const t0 = y === student.yearGroup ? schoolTerm() : 1;
      for (let t = t0; t <= 3; t++) milestones.push({ year: y, term: t, label: `Year ${y} ${TERM_NAMES[t]}`, current: y === student.yearGroup && t === t0,
        items: [t === 3 ? `End-of-Year exams (Year ${y})` : `${TERM_NAMES[t]} checkpoints`, ...(y === 11 && t === 2 ? ['Full GCSE mock exams'] : []), ...(y === 11 && t === 3 ? ['GCSE exams (from mid-May)'] : [])] });
    }
    return {
      generatedAt: new Date().toISOString(), student: publicUser(student), term: TERM_NAMES[schoolTerm()], examDate: examDate.toISOString().slice(0, 10),
      weeksToExam: Math.max(0, Math.round((examDate.getTime() - Date.now()) / (7 * 864e5))),
      overall: { level: overall.level, xp: overall.level.xp, streak: overall.streak, lessons: overall.lessonsCompleted, reviews: overall.reviewsCompleted, correct: overall.correct,
        badges: overall.badges.filter((b) => b.got).length, certificates: overall.certificates, mistakesOpen: rv.mistakeCount, reviewsDue: rv.dueCount,
        questions4w: sumDays(0, 28), questionsPrev4w: sumDays(28, 56), activeDays4w: Object.keys(act).filter((k) => k >= addDays(-28) && act[k]).length },
      subjects, plan: { perWeek, weeks }, milestones,
    };
  }

  async function calendar(db: Db, studentId: string, fromQ?: string, toQ?: string) {
    const from = fromQ || addDays(-14); const to = toQ || addDays(28); const T = today();
    const days: Record<string, { date: string; events: Record<string, unknown>[]; questions: number }> = {};
    const day = (k: string) => (days[k] ||= { date: k, events: [], questions: 0 });
    const inRange = (k: string) => k >= from && k <= to;
    const st = (await students.load(db, studentId))!;
    for (const [k, n] of Object.entries(await repo.activityMap(db, studentId, from))) if (inRange(k)) day(k).questions = n;
    const dueBy: Record<string, string[]> = {};
    for (const r of await repo.reviewRows(db, studentId)) { if (!content.getStyle(r.styleId)) continue; const k = r.due < T ? T : r.due; (dueBy[k] ||= []).push(r.styleId); }
    for (const [k, list] of Object.entries(dueBy)) if (inRange(k)) day(k).events.push({ kind: 'review', title: `${list.length} topic${list.length > 1 ? 's' : ''} to review`, detail: list.slice(0, 4).map((x) => content.getStyle(x)?.name).join(', '), count: list.length });
    const lessons = await db.select({ kind: s.lessons.kind, styleId: s.lessons.styleId, completedAt: s.lessons.completedAt }).from(s.lessons).where(eq(s.lessons.studentId, studentId));
    const doneBy: Record<string, typeof lessons> = {};
    for (const l of lessons) if (l.completedAt && inRange(l.completedAt.slice(0, 10))) (doneBy[l.completedAt.slice(0, 10)] ||= []).push(l);
    for (const [k, ls] of Object.entries(doneBy)) {
      const lsn = ls.filter((l) => l.kind !== 'review'); const rv = ls.length - lsn.length;
      if (lsn.length) day(k).events.push({ kind: 'done', title: `${lsn.length} lesson${lsn.length > 1 ? 's' : ''} completed`, detail: lsn.slice(0, 4).map((l) => content.getStyle(l.styleId)?.name).join(', ') });
      if (rv) day(k).events.push({ kind: 'done', title: `${rv} review session${rv > 1 ? 's' : ''} completed` });
    }
    for (const a of st.exams) if (a.submittedAt && inRange(a.submittedAt.slice(0, 10))) day(a.submittedAt.slice(0, 10)).events.push({ kind: 'exam-done', title: a.name, detail: `Grade ${a.grade} · ${a.pct}%`, ref: a.id });
    for (const t of await tasks.load(db, studentId)) {
      const push = (k: string) => { const v = tasks.view(t, k); day(k).events.push({ kind: 'task', title: t.title, detail: [v.subjectName, t.dueTime, t.coins ? `${t.coins} coins` : ''].filter(Boolean).join(' · '), state: v.state, taskId: t.id, priority: t.priority, date: k }); };
      if (t.recurrence === 'none') { if (inRange(t.dueDate)) push(t.dueDate); continue; }
      for (let k = from; k <= to; k = addDays(1, k)) if (occursOn(t, k)) push(k);
    }
    if (to >= T) {
      const rep = await build(db, studentId);
      rep.plan.weeks.forEach((w) => {
        const learn = w.items.filter((i) => i.kind !== 'review');
        learn.forEach((it, i) => {
          const k = addDays(Math.min(4, Math.floor((i * 5) / Math.max(1, learn.length))), w.from);
          if (k < T || !inRange(k)) return;
          day(k).events.push({ kind: 'plan', title: it.name, detail: [it.subjectName, it.kind === 'practise' ? 'practise' : it.kind === 'learn' ? 'new topic' : it.kind].filter(Boolean).join(' · '), styleId: it.styleId || null, examId: it.examId || null, color: it.color, itemKind: it.kind });
        });
      });
      const ms = await missions.view(db, studentId);
      day(T).events.unshift({ kind: 'missions', title: `Daily missions ${ms.missions.filter((x) => x.done).length}/${ms.missions.length}`, detail: ms.missions.map((x) => (x.done ? '✓ ' : '○ ') + x.title).join(' · ') });
    }
    for (const y of new Set([from.slice(0, 4), to.slice(0, 4)])) for (const [md, label] of [['09-01', 'Autumn term starts'], ['01-06', 'Spring term starts'], ['04-20', 'Summer term starts']]) { const k = `${y}-${md}`; if (inRange(k)) day(k).events.push({ kind: 'school', title: label }); }
    const ex = gcseExamDate(st.student.yearGroup).toISOString().slice(0, 10); if (inRange(ex)) day(ex).events.push({ kind: 'school', title: 'GCSE exams begin' });
    return { from, to, today: T, days: Object.values(days).sort((a, b) => (a.date < b.date ? -1 : 1)) };
  }
  return { build, calendar };
}
export type ReportService = ReturnType<typeof createReportService>;
