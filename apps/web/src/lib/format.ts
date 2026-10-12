export const money = (n: number) => '£' + Number(n || 0).toFixed(2);
export const fmtDate = (d: string | Date) => new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
export const fmtDateTime = (d: string | Date) => new Date(d).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
export const initials = (n?: string) => String(n || '?').split(/\s+/).map((x) => x[0]).slice(0, 2).join('').toUpperCase();
export const LETTERS = 'ABCDEFGH';
export const TERMS = ['Autumn', 'Spring', 'Summer'];
export const todayStr = () => new Date().toISOString().slice(0, 10);
export const shortName = (n: string) => String(n).split(/[,&(]/)[0].replace(/^The /, '').trim().split(' ').slice(0, 2).join(' ');
export const gradeLabel = (g: unknown) => (g == null ? '–' : String(g));
export const store = {
  get<T>(k: string, d: T): T { try { const v = localStorage.getItem(k); return v == null ? d : (JSON.parse(v) as T); } catch { return d; } },
  set(k: string, v: unknown) { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* private mode */ } },
  del(k: string) { try { localStorage.removeItem(k); } catch { /* ignore */ } },
};
