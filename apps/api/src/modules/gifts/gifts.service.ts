import { and, desc, eq, inArray, sql } from 'drizzle-orm';
import * as s from '../../db/schema.js';
import type { Db } from '../../db/client.js';
import { fail } from '../../core/errors.js';
import { newId } from '../../core/ids.js';
import { nowIso, today } from '../../core/dates.js';
import { GIFT_CARDS, defaultGiftSettings } from '../common/domain.js';
import * as repo from '../students/students.repo.js';
import { audit } from '../common/audit.js';
import type { AuthUser } from '../../plugins/auth.js';

type Ticket = typeof s.giftTickets.$inferSelect;
const tv = (t: Ticket) => ({ ...t, value: t.valuePounds });
type GiftSettings = ReturnType<typeof defaultGiftSettings>;

export function createGiftService() {
  const settingsOf = (st: repo.Student): GiftSettings => ({ ...defaultGiftSettings(), ...((st.giftSettings || {}) as Partial<GiftSettings>) });
  async function monthSpent(db: Db, studentId: string) {
    const m = today().slice(0, 7);
    const rows = await db.select({ v: s.giftTickets.valuePounds }).from(s.giftTickets).where(and(eq(s.giftTickets.studentId, studentId), sql`to_char(${s.giftTickets.createdAt}, 'YYYY-MM') = ${m}`, sql`${s.giftTickets.status} not in ('declined','cancelled')`));
    return rows.reduce((t, r) => t + r.v, 0);
  }
  async function overview(db: Db, st: repo.Student) {
    const g = settingsOf(st);
    const tickets = await db.select().from(s.giftTickets).where(eq(s.giftTickets.studentId, st.id)).orderBy(desc(s.giftTickets.createdAt));
    return { settings: g, catalogue: GIFT_CARDS.filter((c) => g.allowed.includes(c.id)).map((c) => ({ ...c, options: c.values.map((v) => ({ value: v, coins: v * g.coinsPerPound })) })),
      allCards: GIFT_CARDS, coins: st.coins, spentThisMonth: await monthSpent(db, st.id), tickets: tickets.map(tv) };
  }
  async function request(db: Db, st: repo.Student, body: { cardId: string; value: number; note: string }) {
    const g = settingsOf(st);
    if (!g.enabled) fail(400, 'Gift-card rewards are switched off by your parent');
    const card = GIFT_CARDS.find((c) => c.id === body.cardId && g.allowed.includes(c.id)) || fail(400, 'Choose a gift card');
    if (!card.values.includes(body.value)) fail(400, 'Choose an amount');
    const coins = body.value * g.coinsPerPound;
    if (st.coins < coins) fail(400, `You need ${coins - st.coins} more coins`);
    const spent = await monthSpent(db, st.id);
    if (spent + body.value > g.monthlyLimit) fail(400, `Monthly limit is £${g.monthlyLimit} (already used £${spent})`);
    const pending = await db.select({ id: s.giftTickets.id }).from(s.giftTickets).where(and(eq(s.giftTickets.studentId, st.id), eq(s.giftTickets.status, 'pending')));
    if (pending.length >= 3) fail(400, 'You already have 3 tickets waiting for approval');
    const t = await db.transaction(async (tx) => {
      const [u] = await tx.update(s.studentProfiles).set({ coins: sql`${s.studentProfiles.coins} - ${coins}` }).where(and(eq(s.studentProfiles.userId, st.id), sql`${s.studentProfiles.coins} >= ${coins}`)).returning();
      if (!u) fail(400, 'Not enough coins');
      const [row] = await tx.insert(s.giftTickets).values({ id: newId('tkt'), studentId: st.id, parentId: st.parentId!, cardId: card.id, cardName: card.name, icon: card.icon, valuePounds: body.value, coins, status: 'pending', note: body.note || null }).returning();
      return row;
    });
    await repo.notify(db, st.id, { type: 'ticket', title: 'Reward ticket sent!', text: `£${body.value} ${card.name} — waiting for your parent to approve`, icon: '🎟️', seen: true });
    await audit(db, st, 'gift-ticket', `£${body.value} ${card.name}`);
    return { ticket: tv(t), coins: st.coins - coins };
  }
  async function act(db: Db, user: AuthUser, st: repo.Student, ticketId: string, body: { action: string; reply: string; code: string }) {
    const [t] = await db.select().from(s.giftTickets).where(and(eq(s.giftTickets.id, ticketId), eq(s.giftTickets.studentId, st.id)));
    if (!t) fail(404, 'Ticket not found');
    const refund = () => repo.addXpCoins(db, st.id, 0, t!.coins);
    if (user.role === 'student') {
      if (body.action !== 'cancel' || t!.status !== 'pending') fail(403, 'Only your parent can do that');
      await db.update(s.giftTickets).set({ status: 'cancelled' }).where(eq(s.giftTickets.id, t!.id)); await refund();
    } else if (body.action === 'approve' && t!.status === 'pending') {
      await db.update(s.giftTickets).set({ status: 'approved', approvedAt: nowIso() }).where(eq(s.giftTickets.id, t!.id));
      await repo.notify(db, st.id, { type: 'ticket', title: 'Reward approved! 🎉', text: `£${t!.valuePounds} ${t!.cardName} is on its way`, icon: '🎟️' });
    } else if (body.action === 'decline' && ['pending', 'approved'].includes(t!.status)) {
      await db.update(s.giftTickets).set({ status: 'declined', reply: body.reply || null }).where(eq(s.giftTickets.id, t!.id)); await refund();
      await repo.notify(db, st.id, { type: 'ticket', title: 'Reward ticket declined', text: `${t!.cardName} — your ${t!.coins} coins were refunded${body.reply ? '. ' + body.reply : ''}`, icon: '↩️' });
    } else if (body.action === 'deliver' && ['pending', 'approved'].includes(t!.status)) {
      await db.update(s.giftTickets).set({ status: 'delivered', deliveredAt: nowIso(), reply: body.reply || null, code: body.code || null }).where(eq(s.giftTickets.id, t!.id));
      await repo.notify(db, st.id, { type: 'ticket', title: 'Your gift card is here! 🎁', text: `£${t!.valuePounds} ${t!.cardName}${body.code ? ' — code in your Rewards page' : ''}`, icon: '🎁' });
    } else fail(400, 'Not possible for this ticket');
    await audit(db, user, `gift-${body.action}`, `${st.name}: £${t!.valuePounds} ${t!.cardName}`);
    const [u] = await db.select().from(s.giftTickets).where(eq(s.giftTickets.id, t!.id));
    return { ticket: tv(u) };
  }
  async function saveSettings(db: Db, st: repo.Student, body: GiftSettings) {
    const settings = { ...body, allowed: body.allowed.filter((x) => GIFT_CARDS.some((g) => g.id === x)) };
    await repo.updateProfile(db, st.id, { giftSettings: settings });
    return { settings };
  }
  async function all(db: Db) { return { tickets: (await db.select().from(s.giftTickets).orderBy(desc(s.giftTickets.createdAt))).map(tv) }; }
  void inArray;
  return { overview, request, act, saveSettings, all };
}
export type GiftService = ReturnType<typeof createGiftService>;
