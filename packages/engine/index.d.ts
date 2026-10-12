export type Question = Record<string, any> & { html: string; answer: string; answerHtml: string; check: any; steps: string[]; hint?: string; options?: string[] };
export type BankItem =
  | { type: 'mcq'; q: string; options: string[]; correct: number; explain: string; hint?: string; diagram?: string }
  | { type: 'multi'; q: string; options: string[]; correct: number[]; explain: string; hint?: string; diagram?: string }
  | { type: 'tf'; q: string; correct: boolean; explain: string; hint?: string }
  | { type: 'short'; q: string; answer?: string; accept?: string[]; keywords?: string[][]; explain: string; hint?: string; format?: string }
  | { type: 'number'; q: string; value: number; tol?: number; unit?: string; answer?: string; steps?: string[]; explain: string; hint?: string }
  | { type: 'order'; q: string; options: string[]; explain: string; hint?: string };
export function generate(generatorKey: string, seed?: number | string): Question;
export function fromItem(item: BankItem, seed?: number | string): Question;
export function checkAnswer(check: any, input: string): boolean;
export function hasGenerator(key: string): boolean;
export function generatorKeys(): string[];
export function rngFrom(seed?: number | string): () => number;
export const maths: any;
export const items: any;
