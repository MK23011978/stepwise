export const nowIso = () => new Date().toISOString();
export const today = () => new Date().toISOString().slice(0, 10);
export const addDays = (n: number, from: Date | string = new Date()) => { const d = new Date(from); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); };
// UK school year: Autumn = Sep–Dec, Spring = Jan–Mar, Summer = Apr–Aug.
export const schoolTerm = (d = new Date()) => { const m = d.getUTCMonth() + 1; return m >= 9 ? 1 : m <= 3 ? 2 : 3; };
export const TERM_NAMES: Record<number, string> = { 1: 'Autumn', 2: 'Spring', 3: 'Summer' };
export function gcseExamDate(yearGroup: number, d = new Date()) {
  const startYear = d.getUTCMonth() + 1 >= 9 ? d.getUTCFullYear() : d.getUTCFullYear() - 1;
  return new Date(Date.UTC(startYear + 1 + (11 - yearGroup), 4, 12));
}
