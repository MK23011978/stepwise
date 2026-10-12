// Content served from PostgreSQL. Each API instance keeps an in-memory snapshot and reloads it when
// content_version changes (checked at most every few seconds), so admins can edit banks and teaching
// pages without a deploy and every Cloud Run instance converges quickly.
import { asc, eq } from 'drizzle-orm';
import engine from '@stepwise/engine';
import * as s from '../db/schema.js';
import type { Db } from '../db/client.js';
import type { ContentService, Subject, Strand, Topic, StyleInfo, GeneratedQuestion } from './types.js';

interface Snapshot {
  version: number; subjects: Subject[]; strands: Strand[]; topics: Topic[]; years: number[];
  styles: Map<string, StyleInfo & { source: string; generatorKey: string | null }>; topicIndex: Map<string, Topic>;
  items: Map<string, unknown[]>; learn: Map<string, unknown>;
}

export async function readVersion(db: Db) {
  const [v] = await db.select().from(s.contentVersion).where(eq(s.contentVersion.id, 1));
  return v?.version || 0;
}

async function snapshot(db: Db): Promise<Snapshot> {
  const version = await readVersion(db);
  const [subs, strs, tops, sts, its, lps] = await Promise.all([
    db.select().from(s.subjects).orderBy(asc(s.subjects.sortOrder)),
    db.select().from(s.strands).orderBy(asc(s.strands.sortOrder)),
    db.select().from(s.topics).where(eq(s.topics.published, true)).orderBy(asc(s.topics.sortOrder)),
    db.select().from(s.styles).orderBy(asc(s.styles.sortOrder)),
    db.select({ styleId: s.items.styleId, body: s.items.body }).from(s.items).where(eq(s.items.active, true)).orderBy(asc(s.items.sortOrder)),
    db.select().from(s.learnPages),
  ]);
  const items = new Map<string, unknown[]>();
  for (const it of its) { const l = items.get(it.styleId) || []; l.push(it.body); items.set(it.styleId, l); }
  const subjectOfTopic = new Map(tops.map((t) => [t.id, t.subjectId]));
  const styles = new Map(sts.filter((x) => subjectOfTopic.has(x.topicId)).map((x) => [x.id, { id: x.id, topicId: x.topicId, name: x.name, intro: x.intro, subject: subjectOfTopic.get(x.topicId)!, source: x.source, generatorKey: x.generatorKey }]));
  // only serve styles that can actually produce questions
  const usable = (id: string) => { const st = styles.get(id); return !!st && (st.source === 'generator' ? engine.hasGenerator(st.generatorKey || id) : (items.get(id)?.length || 0) > 0); };
  const topics: Topic[] = tops.map((t) => ({ id: t.id, subject: t.subjectId, strand: t.strandId, year: t.year, term: t.term, tier: t.tier, name: t.name, summary: t.summary, specRef: t.specRef,
    styles: sts.filter((x) => x.topicId === t.id).map((x) => x.id).filter(usable) })).filter((t) => t.styles.length);
  const subjectIds = new Set(topics.map((t) => t.subject));
  return {
    version, topics, styles, items, topicIndex: new Map(topics.map((t) => [t.id, t])),
    subjects: subs.filter((x) => subjectIds.has(x.id)).map((x) => ({ id: x.id, name: x.name, board: x.board, spec: x.spec, color: x.color, icon: x.icon, tiers: x.tiers })),
    strands: strs.filter((x) => subjectIds.has(x.subjectId)).map((x) => ({ id: x.id, subject: x.subjectId, name: x.name, color: x.color, icon: x.icon })),
    years: [...new Set(topics.map((t) => t.year))].sort((a, b) => a - b),
    learn: new Map(lps.map((l) => [l.topicId, l.content])),
  };
}

export async function loadDbContent(db: Db, { refreshMs = 5000 } = {}): Promise<ContentService & { version: () => number; reload: () => Promise<void> }> {
  let snap = await snapshot(db);
  let lastCheck = Date.now();
  let refreshing: Promise<void> | null = null;
  const shuffle = <T,>(a: T[]) => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const svc = {
    get subjects() { return snap.subjects; }, get strands() { return snap.strands; }, get topics() { return snap.topics; }, get years() { return snap.years; },
    getSubject: (id: string | null | undefined) => snap.subjects.find((x) => x.id === id),
    getTopic: (id: string | null | undefined) => (id ? snap.topicIndex.get(id) : undefined),
    getStyle: (id: string | null | undefined) => { const st = id ? snap.styles.get(id) : undefined; return st ? { id: st.id, topicId: st.topicId, name: st.name, intro: st.intro, subject: st.subject } : undefined; },
    subjectOf: (id: string | null | undefined) => (id ? snap.styles.get(id)?.subject || null : null),
    generate(styleId: string, seed?: number | string): GeneratedQuestion {
      const st = snap.styles.get(styleId);
      if (!st) throw new Error(`Unknown style ${styleId}`);
      if (st.source === 'generator') return engine.generate(st.generatorKey || styleId, seed);
      const bank = snap.items.get(styleId) || [];
      if (!bank.length) throw new Error(`No questions in ${styleId}`);
      const rng = engine.rngFrom(seed);
      return engine.fromItem(bank[Math.floor(rng() * bank.length)] as never, seed);
    },
    generateMany(styleId: string, n: number) {
      const st = snap.styles.get(styleId);
      if (st && st.source === 'bank') {
        const bank = shuffle([...(snap.items.get(styleId) || [])]);
        return Array.from({ length: n }, (_, i) => engine.fromItem(bank[i % bank.length] as never));
      }
      const out: GeneratedQuestion[] = []; const seen = new Set<string>();
      for (let i = 0; out.length < n && i < n * 4; i++) { const q = svc.generate(styleId); if (seen.has(q.html) && i < n * 3) continue; seen.add(q.html); out.push(q); }
      return out;
    },
    checkAnswer: (check: unknown, input: string) => engine.checkAnswer(check, input),
    learn: (topicId: string) => snap.learn.get(topicId) || null,
    learnIds: () => [...snap.learn.keys()].filter((k) => snap.topicIndex.has(k)),
    version: () => snap.version,
    async reload() { snap = await snapshot(db); lastCheck = Date.now(); },
    async ensureFresh() {
      if (Date.now() - lastCheck < refreshMs) return;
      lastCheck = Date.now();
      refreshing ||= (async () => { try { if ((await readVersion(db)) !== snap.version) snap = await snapshot(db); } finally { refreshing = null; } })();
      await refreshing;
    },
  };
  return svc;
}
