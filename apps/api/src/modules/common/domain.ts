// Pure domain rules and catalogues (no I/O).
import type { ContentService, Topic } from '../../content/types.js';
import { addDays, schoolTerm, today, TERM_NAMES } from '../../core/dates.js';

// ---------- pricing ----------
export const PRICE_PER_LESSON = 1;
export const PRICES: Record<string, number> = { lesson: 1, exam: 1, test: 1, review: 0 };
export const PACKS = [
  { id: 'single', credits: 1, bonus: 0, price: 1.0, label: '1 lesson' },
  { id: 'pack10', credits: 10, bonus: 1, price: 10.0, label: '10 lessons', tag: '+1 free' },
  { id: 'pack30', credits: 30, bonus: 5, price: 30.0, label: '30 lessons', tag: '+5 free · best value' },
];
export const QUESTIONS_PER_LESSON = 10;
/** Years up to the student's own year are open; later years unlock when the student moves up. */
export const yearLocked = (year: number, yearGroup: number) => year > yearGroup;
export const yearLockMessage = (year: number) => `This is Year ${year} content — it unlocks when you move up to Year ${year}.`;
export const REVIEW_IN_LESSON = 2;
export const REVIEW_SESSION_SIZE = 10;
export const SR_INTERVALS = [1, 2, 4, 7, 15, 30, 60];
export const REWARD_EVERY_LESSONS = 10;
export const MISSION_BONUS = 50;

// ---------- grades & levels ----------
export const BOUNDARIES: [number, number][] = [[9, 85], [8, 75], [7, 65], [6, 55], [5, 45], [4, 35], [3, 25], [2, 15], [1, 5]];
export function gradeFor(pct: number, tier?: string | null): number | 'U' {
  for (const [g, min] of BOUNDARIES) if (pct >= min) return tier === 'F' ? Math.min(g, 5) : g;
  return 'U';
}
export function levelInfo(xp = 0) {
  const level = Math.floor(Math.sqrt(xp / 60)) + 1;
  const cur = 60 * (level - 1) ** 2, next = 60 * level ** 2;
  return { level, xp, cur, next, pct: Math.round(((xp - cur) / (next - cur)) * 100) };
}

export interface ProgressRow { done: number; correct: number; incorrect: number; skipped: number; lastAt?: string | null }
export type StyleStatus = 'new' | 'started' | 'completed' | 'mastered';
export function styleStatus(r?: ProgressRow | null): StyleStatus {
  if (!r || (!r.done && !r.incorrect)) return 'new';
  const answered = r.done - r.skipped;
  const acc = answered ? r.correct / answered : 0;
  if (r.done >= QUESTIONS_PER_LESSON && acc >= 0.8) return 'mastered';
  if (r.done >= QUESTIONS_PER_LESSON) return 'completed';
  return 'started';
}

// ---------- exams catalogue ----------
export interface ExamDef { id: string; subject: string; year: number; term: number; kind: string; tier?: string; name: string; questions: number; minutes: number; topicId?: string; weightCurrent?: number; balanced?: boolean; blurb?: string; scope: (t: Topic) => boolean }

// Year 9 maths units as the school teaches them (from the school's knowledge organisers). School exams cover every
// topic in a unit at least once.
export const SCHOOL_Y9_UNITS: { id: string; name: string; term: number; topics: string[] }[] = [
  { id: 'algebra', name: 'Reasoning with Algebra', term: 1, topics: ['y9-straight-line-graphs', 'y9-formulae', 'y9-equations-both-sides', 'y9-inequalities', 'y9-conjectures', 'y9-expanding-double'] },
  { id: 'constructing', name: 'Constructing in 2D & 3D', term: 1, topics: ['y9-3d-shapes', 'y9-volume-surface-area', 'y9-constructions'] },
  { id: 'number', name: 'Reasoning with Number', term: 2, topics: ['y9-number-skills', 'y9-percentage-change', 'y9-maths-money', 'y9-standard-form'] },
  { id: 'geometry', name: 'Reasoning with Geometry', term: 2, topics: ['y9-angle-deduction', 'y9-polygons', 'y9-transformations', 'y9-pythagoras', 'y9-enlargement', 'y9-ratio-proportion', 'y9-direct-proportion', 'y9-rates-graphs', 'y9-speed-distance-time', 'y9-density'] },
  { id: 'representations', name: 'Representations', term: 3, topics: ['y9-probability-diagrams', 'y9-relative-frequency', 'y9-nonlinear-graphs'] },
];
export function buildExams(content: ContentService): ExamDef[] {
  const exams: ExamDef[] = [];
  for (const sub of content.subjects) {
    const pre = sub.id === 'maths' ? '' : `${sub.id}-`;
    const label = sub.id === 'maths' ? '' : `${sub.name} `;
    const has = (fn: (t: Topic) => boolean) => content.topics.some((t) => t.subject === sub.id && fn(t));
    for (const y of content.years) {
      const add = (e: Omit<ExamDef, 'scope' | 'subject'> & { match: (t: Topic) => boolean }) => {
        const { match, ...rest } = e;
        if (has(match)) exams.push({ ...rest, subject: sub.id, scope: (t) => t.subject === sub.id && match(t) });
      };
      add({ id: `${pre}y${y}-autumn`, year: y, term: 1, kind: 'checkpoint', name: `Year ${y} ${label}Autumn Checkpoint`, questions: 12, minutes: 25, match: (t) => t.year === y && t.term === 1 });
      add({ id: `${pre}y${y}-spring`, year: y, term: 2, kind: 'checkpoint', name: `Year ${y} ${label}Spring Checkpoint`, questions: 12, minutes: 25, match: (t) => t.year === y && t.term <= 2 });
      add({ id: `${pre}y${y}-summer`, year: y, term: 3, kind: 'end-of-year', name: `Year ${y} ${label}End-of-Year Exam`, questions: 20, minutes: 45, match: (t) => t.year <= y, weightCurrent: y });
    }
    if (sub.id === 'maths') {
      const ids = (u: { topics: string[] }) => u.topics.filter((id) => content.getTopic(id));
      for (const u of SCHOOL_Y9_UNITS) {
        const list = ids(u); if (list.length < 2) continue;
        exams.push({ id: `school-y9-${u.id}`, subject: 'maths', year: 9, term: u.term, kind: 'school', balanced: true, name: `School Unit Test: ${u.name}`, questions: Math.max(12, list.length * 2), minutes: 30,
          blurb: `Covers every topic in your school’s “${u.name}” unit`, scope: (t) => list.includes(t.id) });
      }
      const all = SCHOOL_Y9_UNITS.flatMap(ids);
      if (all.length) exams.push({ id: 'school-y9-exam', subject: 'maths', year: 9, term: 3, kind: 'school', balanced: true, name: 'Year 9 School Exam', questions: 35, minutes: 70,
        blurb: 'Every Year 9 unit your school teaches, in one exam', scope: (t) => all.includes(t.id) });
    }
    const gcse = (t: Topic) => t.subject === sub.id && t.year >= 9;
    if (sub.tiers) {
      exams.push({ id: `${pre}gcse-foundation`, subject: sub.id, year: 11, term: 3, kind: 'mock', tier: 'F', name: `GCSE ${sub.name} Mock — Foundation`, questions: 25, minutes: 60, scope: (t) => gcse(t) && t.tier !== 'H' });
      exams.push({ id: `${pre}gcse-higher`, subject: sub.id, year: 11, term: 3, kind: 'mock', tier: 'H', name: `GCSE ${sub.name} Mock — Higher`, questions: 25, minutes: 60, scope: gcse });
    } else if (content.topics.some(gcse)) {
      exams.push({ id: `${pre}gcse-mock`, subject: sub.id, year: 11, term: 3, kind: 'mock', name: `GCSE ${sub.name} Mock`, questions: 25, minutes: 60, scope: gcse });
    }
  }
  return exams;
}
export function examDef(exams: ExamDef[], content: ContentService, id: string): ExamDef | null {
  if (id.startsWith('topic:')) {
    const t = content.getTopic(id.slice(6)); if (!t) return null;
    return { id, subject: t.subject, year: t.year, term: t.term, kind: 'topic', topicId: t.id, name: `${t.name} — Topic Test`, questions: 15, minutes: 25, scope: (x) => x.id === t.id };
  }
  return exams.find((e) => e.id === id) || null;
}
export const publicExam = ({ scope, ...e }: ExamDef) => e;

// ---------- rewards catalogue ----------
const cap = (s: string) => s[0].toUpperCase() + s.slice(1);
export const SHOP = [
  ...([['fox', '🦊', 60], ['panda', '🐼', 60], ['cat', '🐱', 60], ['frog', '🐸', 80], ['owl', '🦉', 80], ['lion', '🦁', 120], ['tiger', '🐯', 120],
    ['octopus', '🐙', 150], ['robot', '🤖', 200], ['alien', '👽', 200], ['unicorn', '🦄', 300], ['dragon', '🐲', 400], ['rocket', '🚀', 500], ['crown', '👑', 800]] as const)
    .map(([id, emoji, price]) => ({ id: `avatar-${id}`, kind: 'avatar', name: cap(id), emoji, price } as { id: string; kind: string; name: string; emoji?: string; css?: string; price: number; desc?: string })),
  ...([['ocean', 'linear-gradient(135deg,#0ea5e9,#6366f1)', 150], ['sunset', 'linear-gradient(135deg,#f97316,#ec4899)', 150], ['forest', 'linear-gradient(135deg,#10b981,#065f46)', 150],
    ['galaxy', 'linear-gradient(135deg,#7c3aed,#0f172a)', 250], ['gold', 'linear-gradient(135deg,#f59e0b,#fde047)', 600]] as const)
    .map(([id, css, price]) => ({ id: `bg-${id}`, kind: 'background', name: cap(id), css, price } as { id: string; kind: string; name: string; emoji?: string; css?: string; price: number; desc?: string })),
  { id: 'streak-freeze', kind: 'consumable', name: 'Streak Freeze', emoji: '🧊', price: 120, desc: 'Protects your streak if you miss a day' },
];
export const GIFT_CARDS = [
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
export const defaultGiftSettings = () => ({ enabled: true, coinsPerPound: 400, monthlyLimit: 10, allowed: GIFT_CARDS.map((g) => g.id) });

// ---------- scheduling ----------
export const shuffle = <T>(a: T[]) => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
export function occursOn(t: { recurrence: string; dueDate: string; until?: string | null }, date: string) {
  if (t.recurrence === 'daily') return date >= t.dueDate && (!t.until || date <= t.until);
  if (t.recurrence === 'weekdays') { const wd = new Date(date).getUTCDay(); return date >= t.dueDate && wd >= 1 && wd <= 5 && (!t.until || date <= t.until); }
  if (t.recurrence === 'weekly') return date >= t.dueDate && new Date(date).getUTCDay() === new Date(t.dueDate).getUTCDay() && (!t.until || date <= t.until);
  return date === t.dueDate;
}
export { addDays, schoolTerm, today, TERM_NAMES };
