// Stage-2 content source: the v1 CommonJS registry (Maths generators + subject banks + teaching pages).
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { ContentService, Subject, Strand, Topic, StyleInfo } from './types.js';

const require = createRequire(import.meta.url);
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../..');

export function loadLegacyContent(): ContentService {
  const C = require(path.join(ROOT, 'packages/content-seed/registry.cjs'));
  const subjects: Subject[] = C.SUBJECTS;
  const strands: Strand[] = C.STRANDS;
  const topics: Topic[] = C.TOPICS.map((t: Topic) => ({ ...t, styles: [...t.styles] }));
  const topicIndex = new Map(topics.map((t) => [t.id, t]));
  const years = [...new Set(topics.map((t) => t.year))].sort((a, b) => a - b);
  return {
    subjects, strands, topics, years,
    getSubject: (id) => subjects.find((s) => s.id === id),
    getTopic: (id) => (id ? topicIndex.get(id) : undefined),
    getStyle: (id) => { const s = id ? C.getStyle(id) : undefined; return s ? ({ id: s.id, topicId: s.topicId, name: s.name, intro: s.intro, subject: s.subject } as StyleInfo) : undefined; },
    subjectOf: (id) => (id ? C.subjectOf(id) : null),
    generate: (id, seed) => C.generate(id, seed),
    generateMany: (id, n) => C.generateMany(id, n),
    checkAnswer: (check, input) => C.checkAnswer(check, input),
    learn: (id) => C.LEARN[id] || null,
    learnIds: () => Object.keys(C.LEARN),
  };
}
