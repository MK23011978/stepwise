// Session + selection state: who is signed in, which child and subject are active, and the curriculum.
import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api, ApiError } from '../lib/api';
import { store } from '../lib/format';
import { SHOP_LOOK } from '../ui/bits';
/* eslint-disable @typescript-eslint/no-explicit-any */
export type Me = { user: any; children: any[]; wallet: any };
export type Curriculum = { subjects: any[]; strands: any[]; topics: any[]; years: number[]; exams: any[]; learnAvailable: string[]; pricing: any };

interface Session {
  me: Me | null; loading: boolean; cur: Curriculum | null;
  child: any | null; childId: string | null; setChildId: (id: string) => void;
  subject: any; setSubject: (id: string) => void; enrolled: (c?: any) => any[];
  refresh: () => Promise<void>; signOut: () => Promise<void>;
  strand: (id: string) => any; topicOfStyle: (styleId: string) => any; topicsOf: (subject: string) => any[]; subjectInfo: (id: string) => any;
}
const Ctx = createContext<Session | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  const qc = useQueryClient();
  const meQ = useQuery({ queryKey: ['me'], queryFn: async () => { try { return await api.auth.me(); } catch (e) { if (e instanceof ApiError && e.status === 401) return null; throw e; } }, staleTime: 30_000 });
  const curQ = useQuery({ queryKey: ['curriculum'], queryFn: () => api.content.curriculum() as Promise<Curriculum>, staleTime: 5 * 60_000 });
  const [childPick, setChildPick] = useState<string | null>(store.get('childId', null));
  const [subjectPick, setSubjectPick] = useState<string>(store.get('subject', 'maths'));
  const me = (meQ.data as Me | null | undefined) ?? null;
  const cur = curQ.data ?? null;
  // equipped avatars/backgrounds render everywhere, so load the shop looks with the curriculum
  for (const it of (cur as any)?.shop || []) SHOP_LOOK[it.id] = it.look;

  const value = useMemo<Session>(() => {
    const kids = me?.children || [];
    const childId = me?.user?.role === 'student' ? me.user.id : kids.some((c: any) => c.id === childPick) ? childPick : kids[0]?.id ?? null;
    const child = kids.find((c: any) => c.id === childId) || null;
    const subjectInfo = (id: string) => cur?.subjects.find((s) => s.id === id) || cur?.subjects[0];
    const enrolled = (c = child) => { if (!cur) return []; const ids = c?.subjects?.length ? c.subjects : cur.subjects.map((s) => s.id); return cur.subjects.filter((s) => ids.includes(s.id)); };
    const list = enrolled(child);
    const subject = list.find((s) => s.id === subjectPick) || list[0] || cur?.subjects[0];
    return {
      me, loading: meQ.isLoading || curQ.isLoading, cur, child, childId, enrolled, subject, subjectInfo,
      setChildId: (id) => { store.set('childId', id); setChildPick(id); },
      setSubject: (id) => { store.set('subject', id); setSubjectPick(id); },
      refresh: async () => { await qc.invalidateQueries({ queryKey: ['me'] }); },
      signOut: async () => { await api.auth.logout().catch(() => {}); qc.clear(); await qc.invalidateQueries(); },
      strand: (id) => cur?.strands.find((s) => s.id === id) || { color: '#3b6cf6', name: id, icon: '•' },
      topicOfStyle: (styleId) => cur?.topics.find((t) => t.styles.some((s: any) => s.id === styleId)),
      topicsOf: (subject) => cur?.topics.filter((t) => t.subject === subject) || [],
    };
  }, [me, cur, childPick, subjectPick, meQ.isLoading, curQ.isLoading, qc]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
export function useSession() { const s = useContext(Ctx); if (!s) throw new Error('SessionProvider missing'); return s; }
