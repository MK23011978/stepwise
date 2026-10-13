// Stepwise API client. Transport-agnostic: works in browsers (HttpOnly cookies) and in React Native / Expo
// (access + refresh tokens kept in secure storage). All request bodies are typed by @stepwise/shared.
import type { z } from 'zod';
import * as S from '@stepwise/shared';

export class ApiError extends Error {
  constructor(public status: number, message: string, public code?: string) { super(message); }
}

/** Where a mobile app keeps its tokens (e.g. expo-secure-store). */
export interface TokenStore { get(): Promise<S.TokenPairT | null>; set(t: S.TokenPairT | null): Promise<void> }
export type AuthMode = { kind: 'cookie' } | { kind: 'token'; store: TokenStore };
export interface ClientOptions { baseUrl?: string; auth?: AuthMode; fetch?: typeof fetch; onUnauthorized?: () => void }

type In<T extends z.ZodTypeAny> = z.input<T>;
/* eslint-disable @typescript-eslint/no-explicit-any */
export type Json = any;

export function createApiClient(opts: ClientOptions = {}) {
  const base = (opts.baseUrl || '') + S.API_PREFIX;
  const auth: AuthMode = opts.auth || { kind: 'cookie' };
  const f = opts.fetch || ((...a: Parameters<typeof fetch>) => fetch(...a));
  let refreshing: Promise<boolean> | null = null;

  async function refreshTokens(): Promise<boolean> {
    if (auth.kind !== 'token') return false;
    refreshing ||= (async () => {
      const t = await auth.store.get(); if (!t) return false;
      const r = await f(`${base}/auth/refresh`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ refreshToken: t.refreshToken }) });
      if (!r.ok) { await auth.store.set(null); return false; }
      await auth.store.set((await r.json()).tokens); return true;
    })().finally(() => { refreshing = null; });
    return refreshing;
  }

  async function request<T = Json>(method: string, path: string, body?: unknown, retry = true): Promise<T> {
    const headers: Record<string, string> = {};
    if (body !== undefined) headers['Content-Type'] = 'application/json';
    if (auth.kind === 'token') { const t = await auth.store.get(); if (t) headers.Authorization = `Bearer ${t.accessToken}`; }
    const res = await f(base + path, { method, headers, body: body === undefined ? undefined : JSON.stringify(body), credentials: auth.kind === 'cookie' ? 'include' : 'omit' });
    if (res.status === 401 && retry && auth.kind === 'token' && !path.startsWith('/auth/')) { if (await refreshTokens()) return request<T>(method, path, body, false); }
    const text = await res.text();
    const json = text ? JSON.parse(text) : {};
    if (!res.ok) { if (res.status === 401) opts.onUnauthorized?.(); throw new ApiError(res.status, json.error || 'Request failed', json.code); }
    return json as T;
  }
  const get = <T = Json>(p: string) => request<T>('GET', p);
  const post = <T = Json>(p: string, b: unknown = {}) => request<T>('POST', p, b);
  const patch = <T = Json>(p: string, b: unknown) => request<T>('PATCH', p, b);
  const put = <T = Json>(p: string, b: unknown) => request<T>('PUT', p, b);
  const del = <T = Json>(p: string) => request<T>('DELETE', p);
  const qs = (o: Record<string, string | undefined>) => { const e = Object.entries(o).filter(([, v]) => v != null && v !== ''); return e.length ? `?${new URLSearchParams(e as [string, string][])}` : ''; };
  const client = auth.kind === 'token' ? 'mobile' : 'web';
  const withTokens = async (r: Json) => { if (auth.kind === 'token' && r.tokens) await auth.store.set(r.tokens); return r; };

  return {
    request,
    auth: {
      register: (b: Omit<In<typeof S.RegisterBody>, 'client'>) => post('/auth/register', { ...b, client }).then(withTokens),
      login: (b: Omit<In<typeof S.LoginBody>, 'client'>) => post('/auth/login', { ...b, client }).then(withTokens),
      logout: async () => { const r = await post('/auth/logout'); if (auth.kind === 'token') await auth.store.set(null); return r; },
      me: () => get<S.MeResponse>('/me'),
      updateMe: (b: In<typeof S.UpdateMeBody>) => patch('/me', b),
      deleteMe: () => del('/me'),
    },
    content: {
      curriculum: () => get('/curriculum'),
      sample: (styleId: string) => get(`/curriculum/sample/${encodeURIComponent(styleId)}`),
      learn: (topicId: string) => get(`/learn/${encodeURIComponent(topicId)}`),
    },
    family: {
      addChild: (b: In<typeof S.ChildBody>) => post('/children', b),
      updateChild: (id: string, b: In<typeof S.ChildPatch>) => patch(`/children/${id}`, b),
      deleteChild: (id: string) => del(`/children/${id}`),
    },
    students: {
      overview: (id: string, subject?: string) => get(`/students/${id}/overview${qs({ subject })}`),
      progress: (id: string, subject?: string) => get(`/students/${id}/progress${qs({ subject })}`),
      history: (id: string) => get(`/students/${id}/history`),
      setYearGroup: (id: string, yearGroup: number) => put(`/students/${id}/year-group`, { yearGroup }),
      review: (id: string) => get(`/students/${id}/review`),
      report: (id: string) => get(`/students/${id}/report`),
      calendar: (id: string, from?: string, to?: string) => get(`/students/${id}/calendar${qs({ from, to })}`),
      exams: (id: string, subject?: string) => get(`/students/${id}/exams${qs({ subject })}`),
      missions: (id: string) => get(`/students/${id}/missions`),
      claimMission: (id: string, missionId?: string) => post(`/students/${id}/missions/claim`, missionId ? { missionId } : {}),
    },
    rewards: {
      overview: (id: string) => get(`/students/${id}/rewards`),
      shop: (id: string, b: In<typeof S.ShopBody>) => post(`/students/${id}/shop`, b),
      certificate: (id: string, cid: string) => get(`/students/${id}/certificates/${cid}`),
      createGoal: (id: string, b: In<typeof S.GoalBody>) => post(`/students/${id}/goals`, b),
      deliverGoal: (id: string, gid: string) => patch(`/students/${id}/goals/${gid}`, { delivered: true }),
      deleteGoal: (id: string, gid: string) => del(`/students/${id}/goals/${gid}`),
    },
    tasks: {
      list: (id: string) => get(`/students/${id}/tasks`),
      create: (id: string, b: In<typeof S.TaskBody>) => post(`/students/${id}/tasks`, b),
      update: (id: string, tid: string, b: In<typeof S.TaskPatch>) => patch(`/students/${id}/tasks/${tid}`, b),
      remove: (id: string, tid: string) => del(`/students/${id}/tasks/${tid}`),
      complete: (id: string, tid: string, date?: string) => post(`/students/${id}/tasks/${tid}/complete`, date ? { date } : {}),
      approve: (id: string, tid: string, b: In<typeof S.TaskApproveBody> = {}) => post(`/students/${id}/tasks/${tid}/approve`, b),
      approvals: () => get('/approvals'),
    },
    gifts: {
      overview: (id: string) => get(`/students/${id}/gifts`),
      request: (id: string, b: In<typeof S.GiftRequestBody>) => post(`/students/${id}/gifts`, b),
      act: (id: string, tid: string, b: In<typeof S.GiftActionBody>) => patch(`/students/${id}/gifts/${tid}`, b),
      settings: (id: string, b: In<typeof S.GiftSettingsBody>) => put(`/students/${id}/gifts/settings`, b),
    },
    reading: {
      books: () => get('/reading/books'),
      contents: (bookId: string) => get(`/reading/books/${encodeURIComponent(bookId)}/text`),
      chapter: (bookId: string, n: number) => get(`/reading/books/${encodeURIComponent(bookId)}/text/${n}`),
      overview: (id: string) => get(`/students/${id}/reading`),
      setGoal: (id: string, b: In<typeof S.ReadingGoalBody>) => put(`/students/${id}/reading/goal`, b),
      addToShelf: (id: string, b: In<typeof S.ShelfAddBody>) => post(`/students/${id}/reading/shelf`, b),
      updateShelf: (id: string, sid: string, b: In<typeof S.ShelfPatchBody>) => patch(`/students/${id}/reading/shelf/${sid}`, b),
      removeShelf: (id: string, sid: string) => del(`/students/${id}/reading/shelf/${sid}`),
      log: (id: string, b: In<typeof S.ReadingLogBody>) => post(`/students/${id}/reading/logs`, b),
      words: (id: string) => get(`/students/${id}/vocab`),
      addWord: (id: string, b: In<typeof S.VocabAddBody>) => post(`/students/${id}/vocab`, b),
      removeWord: (id: string, wid: string) => del(`/students/${id}/vocab/${wid}`),
      quiz: (id: string) => get(`/students/${id}/vocab/quiz`),
      answer: (id: string, wid: string, b: In<typeof S.VocabAnswerBody>) => post(`/students/${id}/vocab/${wid}/answer`, b),
    },
    schoolResults: {
      list: (id: string) => get(`/students/${id}/school-results`),
      add: (id: string, b: In<typeof S.SchoolResultBody>) => post(`/students/${id}/school-results`, b),
      update: (id: string, rid: string, b: In<typeof S.SchoolResultPatch>) => patch(`/students/${id}/school-results/${rid}`, b),
      remove: (id: string, rid: string) => del(`/students/${id}/school-results/${rid}`),
    },
    social: {
      heartbeat: () => post('/presence'),
      overview: () => get('/social'),
      request: (b: In<typeof S.FriendRequestBody>) => post('/social/friends', b),
      accept: (fid: string) => post(`/social/friends/${fid}/accept`),
      decline: (fid: string) => post(`/social/friends/${fid}/decline`),
      block: (fid: string) => post(`/social/friends/${fid}/block`),
      remove: (fid: string) => del(`/social/friends/${fid}`),
      messages: (fid: string, after?: string) => get(`/social/friends/${fid}/messages${qs({ after })}`),
      send: (fid: string, body: string) => post(`/social/friends/${fid}/messages`, { body }),
      report: (fid: string, b: In<typeof S.ChatReportBody>) => post(`/social/friends/${fid}/report`, b),
      shareQuestion: (fid: string, b: In<typeof S.ShareQuestionBody> = {}) => post(`/social/friends/${fid}/questions`, b),
      answerShared: (fid: string, qid: string, input: string) => post(`/social/friends/${fid}/questions/${qid}/answer`, { input }),
      // parents
      child: (id: string) => get(`/students/${id}/social`),
      settings: (id: string, b: In<typeof S.SocialSettingsBody>) => put(`/students/${id}/social`, b),
      childMessages: (id: string, fid: string) => get(`/students/${id}/friends/${fid}/messages`),
      approve: (id: string, fid: string, approve: boolean) => post(`/students/${id}/friends/${fid}/approve`, { approve }),
      // admin
      reports: () => get('/admin/chat-reports'),
      closeReport: (rid: string, status: 'open' | 'closed' = 'closed') => patch(`/admin/chat-reports/${rid}`, { status }),
    },
    lessons: {
      start: (studentId: string, styleId: string) => post('/lessons', { studentId, styleId }),
      startReview: (b: In<typeof S.StartReviewBody>) => post('/reviews', b),
      get: (id: string) => get(`/lessons/${id}`),
      answer: (id: string, input: string) => post(`/lessons/${id}/answer`, { input }),
      hint: (id: string) => post(`/lessons/${id}/hint`),
      skip: (id: string) => post(`/lessons/${id}/skip`),
      next: (id: string) => post(`/lessons/${id}/next`),
    },
    exams: {
      start: (studentId: string, examId: string) => post('/exams', { studentId, examId }),
      get: (id: string) => get(`/exams/${id}`),
      submit: (id: string, answers: (string | null)[]) => post(`/exams/${id}/submit`, { answers }),
      similar: (id: string, n: number) => get(`/exams/${id}/similar/${n}`),
      answerSimilar: (id: string, n: number, input: string) => post(`/exams/${id}/similar/${n}`, { input }),
    },
    billing: {
      overview: () => get('/billing'),
      config: () => get('/billing/config'),
      setupIntent: () => post('/billing/setup-intent'),
      verifyCard: (b: In<typeof S.VerifyCardBody>) => post('/billing/verify-card', b),
      paymentIntent: (packId: string) => post('/billing/payment-intent', { packId }),
      confirm: (paymentIntentId: string) => post('/billing/confirm', { paymentIntentId }),
      checkout: (packId: string) => post('/billing/checkout', { packId }),
    },
    admin: {
      stats: () => get('/admin/stats'),
      users: () => get('/admin/users'),
      user: (id: string) => get(`/admin/users/${id}`),
      createUser: (b: In<typeof S.AdminCreateUserBody>) => post('/admin/users', b),
      patchUser: (id: string, b: In<typeof S.AdminPatchUserBody>) => patch(`/admin/users/${id}`, b),
      resetPassword: (id: string, password: string) => post(`/admin/users/${id}/password`, { password }),
      deleteUser: (id: string) => del(`/admin/users/${id}`),
      payments: () => get('/admin/payments'),
      tickets: () => get('/admin/tickets'),
      contentTopic: (id: string) => get(`/admin/content/topics/${id}`),
      patchTopic: (id: string, b: In<typeof S.TopicPatchBody>) => patch(`/admin/content/topics/${id}`, b),
      patchStyle: (id: string, b: In<typeof S.StylePatchBody>) => patch(`/admin/content/styles/${id}`, b),
      items: (styleId: string) => get(`/admin/content/styles/${styleId}/items`),
      addItem: (styleId: string, body: S.BankItem) => post(`/admin/content/styles/${styleId}/items`, { body }),
      patchItem: (itemId: string, b: In<typeof S.ItemPatchBody>) => patch(`/admin/content/items/${encodeURIComponent(itemId)}`, b),
      deleteItem: (itemId: string) => del(`/admin/content/items/${encodeURIComponent(itemId)}`),
      putLearn: (topicId: string, content: S.LearnPage) => put(`/admin/content/learn/${topicId}`, { content }),
    },
  };
}
export type ApiClient = ReturnType<typeof createApiClient>;
export * from '@stepwise/shared';
