// Content contract used by every service. Implemented first over the v1 JS modules (legacy.ts),
// then over PostgreSQL (db-content.ts) so question banks and teaching pages can change without a deploy.
export interface Subject { id: string; name: string; board: string; spec?: string | null; color: string; icon: string; tiers: boolean }
export interface Strand { id: string; subject: string; name: string; color: string; icon?: string | null }
export interface Topic { id: string; subject: string; strand: string; year: number; term: number; tier: string; name: string; summary?: string | null; specRef?: string | null; styles: string[] }
export interface StyleInfo { id: string; topicId: string; name: string; intro: string; subject: string }
/* eslint-disable @typescript-eslint/no-explicit-any */
export type GeneratedQuestion = Record<string, any> & { html: string; answer: string; answerHtml: string; check: any; steps: string[]; hint?: string };

export interface ContentService {
  readonly subjects: Subject[];
  readonly strands: Strand[];
  readonly topics: Topic[];
  readonly years: number[];
  getSubject(id: string | null | undefined): Subject | undefined;
  getTopic(id: string | null | undefined): Topic | undefined;
  getStyle(id: string | null | undefined): StyleInfo | undefined;
  subjectOf(styleId: string | null | undefined): string | null;
  generate(styleId: string, seed?: number | string): GeneratedQuestion;
  generateMany(styleId: string, n: number): GeneratedQuestion[];
  checkAnswer(check: any, input: string): boolean;
  learn(topicId: string): any | null;
  learnIds(): string[];
  /** refreshes cached content if it changed in the database (no-op for code-backed content) */
  ensureFresh?(): Promise<void>;
}
