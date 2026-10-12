import { and, desc, eq, ne, sql } from 'drizzle-orm';
import type Stripe from 'stripe';
import * as s from '../../db/schema.js';
import type { Db } from '../../db/client.js';
import type { Deps } from '../../core/deps.js';
import { fail } from '../../core/errors.js';
import { newId } from '../../core/ids.js';
import { nowIso } from '../../core/dates.js';
import { audit } from '../common/audit.js';
import { PACKS, PRICES, PRICE_PER_LESSON } from '../common/domain.js';
import type { AuthUser } from '../../plugins/auth.js';
import type { Student } from '../students/students.repo.js';

export function createBillingService(deps: Deps) {
  const { db, config } = deps;
  const stripe = deps.stripe;

  async function wallet(d: Db, parentId: string) {
    const [w] = await d.select().from(s.wallets).where(eq(s.wallets.parentId, parentId));
    return w || fail(400, 'No wallet for this account');
  }
  async function adjustCredits(d: Db, parentId: string, delta: number, reason: string, byUserId: string | null = null) {
    const [w] = await d.update(s.wallets).set({ credits: sql`${s.wallets.credits} + ${delta}` }).where(eq(s.wallets.parentId, parentId)).returning({ credits: s.wallets.credits });
    if (!w) fail(400, 'No wallet for this account');
    await d.insert(s.creditLedger).values({ id: newId('led'), parentId, delta, balance: w.credits, reason, byUserId });
    return w.credits;
  }
  async function hasFreeAccess(d: Db, student: Student) {
    if (student.freeAccess) return true;
    const [p] = await d.select({ f: s.users.freeAccess }).from(s.users).where(eq(s.users.id, student.parentId!));
    return !!p?.f;
  }

  /** Charges 1 credit for a lesson / exam / topic test — or uses free access / the free trial lesson. */
  async function charge(d: Db, student: Student, kind: 'lesson' | 'exam' | 'test' | 'review', label: string) {
    const cost = PRICES[kind] || 0;
    if (!cost) return { free: true };
    const parentId = student.parentId!;
    const w = await wallet(d, parentId);
    const log = (reason: string) => d.insert(s.creditLedger).values({ id: newId('led'), parentId, delta: 0, balance: w.credits, reason });
    if (await hasFreeAccess(d, student)) { await log(`Free access — ${label}`); return { free: true }; }
    if (kind === 'lesson' && !w.freeLessonUsed) {
      const needsCheck = config.requireCardForTrial && !w.cardVerified;
      if (needsCheck && w.credits < cost) fail(428, 'CARD_CHECK_REQUIRED', 'CARD_CHECK_REQUIRED');
      if (!needsCheck) {
        await d.update(s.wallets).set({ freeLessonUsed: true }).where(eq(s.wallets.parentId, parentId));
        await log(`Free trial lesson — ${label}`);
        return { free: true };
      }
    }
    if (w.credits < cost) fail(402, 'Not enough lesson credits. Top up to continue (£1 per lesson).');
    await adjustCredits(d, parentId, -cost, `${{ exam: 'Exam', test: 'Topic test', lesson: 'Lesson', review: 'Review' }[kind]} — ${label}`);
    return { free: false };
  }

  async function overview(user: AuthUser) {
    const w = await wallet(db, user.id);
    return {
      credits: w.credits, freeLessonAvailable: !w.freeLessonUsed, freeAccess: user.freeAccess, packs: PACKS, perLesson: PRICE_PER_LESSON,
      live: config.stripeLive, cardVerified: w.cardVerified, card: w.cardVerified ? { brand: w.cardBrand, last4: w.cardLast4 } : null,
      payments: (await db.select().from(s.payments).where(eq(s.payments.parentId, user.id)).orderBy(desc(s.payments.createdAt))).map(paymentView),
      ledger: (await db.select().from(s.creditLedger).where(eq(s.creditLedger.parentId, user.id)).orderBy(desc(s.creditLedger.createdAt)).limit(50)).map((l) => ({ ...l, at: l.createdAt })),
    };
  }
  const paymentView = (p: typeof s.payments.$inferSelect) => ({ ...p, amount: p.amountPence / 100 });

  async function configFor(user: AuthUser) {
    const ownerId = user.role === 'student' ? user.parentId : user.id;
    const [w] = ownerId ? await db.select().from(s.wallets).where(eq(s.wallets.parentId, ownerId)) : [];
    const [owner] = ownerId ? await db.select({ email: s.users.email }).from(s.users).where(eq(s.users.id, ownerId)) : [];
    return { live: config.stripeLive, publishableKey: config.stripeLive ? config.STRIPE_PUBLISHABLE_KEY : null, requireCardForTrial: config.requireCardForTrial,
      cardVerified: !!w?.cardVerified, card: w?.cardVerified ? { brand: w.cardBrand, last4: w.cardLast4 } : null, email: owner?.email || null };
  }

  const live = (): Stripe => (config.stripeLive && stripe ? stripe : fail(400, 'Card payments are not configured (demo mode)'));
  async function customer(user: AuthUser) {
    const w = await wallet(db, user.id);
    if (w.stripeCustomerId) return w.stripeCustomerId;
    const c = await live().customers.create({ email: user.email || undefined, name: user.name, metadata: { userId: user.id } });
    await db.update(s.wallets).set({ stripeCustomerId: c.id }).where(eq(s.wallets.parentId, user.id));
    return c.id;
  }
  async function setupIntent(user: AuthUser) {
    const si = await live().setupIntents.create({ customer: await customer(user), usage: 'off_session', automatic_payment_methods: { enabled: true }, metadata: { userId: user.id, purpose: 'trial-check' } });
    return { clientSecret: si.client_secret };
  }
  async function verifyCard(user: AuthUser, body: { setupIntentId?: string; demo?: boolean }) {
    let fingerprint: string, brand: string, last4: string;
    if (config.stripeLive) {
      const si = await live().setupIntents.retrieve(String(body.setupIntentId || ''), { expand: ['payment_method'] });
      if (si.metadata?.userId !== user.id || si.status !== 'succeeded') fail(400, 'Card check not completed');
      const pm = si.payment_method as Stripe.PaymentMethod;
      fingerprint = pm.card?.fingerprint || pm.id; brand = pm.card?.brand || pm.type; last4 = pm.card?.last4 || '';
    } else {
      if (!body.demo) fail(400, 'Demo mode: use the simulated check');
      fingerprint = `demo-${user.id}`; brand = 'demo'; last4 = '0000';
    }
    const [reused] = await db.select({ id: s.wallets.parentId }).from(s.wallets).where(and(eq(s.wallets.cardFingerprint, fingerprint), ne(s.wallets.parentId, user.id)));
    const w = await wallet(db, user.id);
    await db.update(s.wallets).set({ cardVerified: true, cardFingerprint: fingerprint, cardBrand: brand, cardLast4: last4, cardVerifiedAt: nowIso(), ...(reused ? { freeLessonUsed: true } : {}) }).where(eq(s.wallets.parentId, user.id));
    await audit(db, user, 'card-verified', `${brand} ${last4}${reused ? ' (card already used for a trial)' : ''}`);
    const trialAvailable = !w.freeLessonUsed && !reused;
    return { verified: true, trialAvailable, message: reused ? 'This card has already been used for a free lesson on another account, so the free trial is not available. You can still buy lessons.' : 'Card checked — your free lesson is ready.' };
  }
  async function paymentIntent(user: AuthUser, packId: string) {
    const pack = PACKS.find((p) => p.id === packId) || fail(400, 'Unknown pack');
    const pi = await live().paymentIntents.create({ amount: Math.round(pack.price * 100), currency: 'gbp', customer: await customer(user), automatic_payment_methods: { enabled: true },
      description: `Stepwise — ${pack.label}`, receipt_email: user.email || undefined, metadata: { userId: user.id, packId: pack.id } });
    return { clientSecret: pi.client_secret, id: pi.id };
  }
  async function creditPaymentIntent(pi: Stripe.PaymentIntent) {
    if (pi.status !== 'succeeded') return null;
    const pack = PACKS.find((p) => p.id === pi.metadata?.packId); const userId = pi.metadata?.userId;
    if (!pack || !userId || pi.amount !== Math.round(pack.price * 100)) return null;
    return db.transaction(async (tx) => {
      const [user] = await tx.select().from(s.users).where(eq(s.users.id, userId));
      if (!user) return null;
      const inserted = await tx.insert(s.payments).values({ id: newId('pay'), parentId: userId, packId: pack.id, label: pack.label, amountPence: pi.amount, credits: pack.credits + pack.bonus, provider: 'stripe', providerRef: pi.id, status: 'succeeded' })
        .onConflictDoNothing().returning();
      if (!inserted.length) return null; // already credited (webhook + confirm race)
      await adjustCredits(tx as unknown as Db, userId, pack.credits + pack.bonus, `Purchase — ${pack.label}${pack.bonus ? ` (+${pack.bonus} bonus)` : ''}`, userId);
      await audit(tx as unknown as Db, user, 'payment', `£${pack.price.toFixed(2)} ${pack.label} (Stripe)`);
      return paymentView(inserted[0]);
    });
  }
  async function confirm(user: AuthUser, paymentIntentId: string) {
    const pi = await live().paymentIntents.retrieve(paymentIntentId);
    if (pi.metadata?.userId !== user.id) fail(403, 'Not your payment');
    if (pi.status !== 'succeeded') fail(402, `Payment ${pi.status.replace(/_/g, ' ')}`);
    const pay = (await creditPaymentIntent(pi)) || (await db.select().from(s.payments).where(eq(s.payments.providerRef, pi.id)).then((r) => (r[0] ? paymentView(r[0]) : null)));
    return { payment: pay, credits: (await wallet(db, user.id)).credits };
  }
  async function simulatedCheckout(user: AuthUser, packId: string) {
    if (config.stripeLive) fail(400, 'Please pay by card');
    const pack = PACKS.find((p) => p.id === packId) || fail(400, 'Unknown pack');
    return db.transaction(async (tx) => {
      const [pay] = await tx.insert(s.payments).values({ id: newId('pay'), parentId: user.id, packId: pack.id, label: pack.label, amountPence: Math.round(pack.price * 100), credits: pack.credits + pack.bonus, provider: 'simulated', status: 'succeeded' }).returning();
      const credits = await adjustCredits(tx as unknown as Db, user.id, pack.credits + pack.bonus, `Purchase — ${pack.label}${pack.bonus ? ` (+${pack.bonus} bonus)` : ''}`, user.id);
      await audit(tx as unknown as Db, user, 'payment', `£${pack.price.toFixed(2)} ${pack.label}`);
      return { payment: paymentView(pay), credits };
    });
  }
  async function webhook(rawBody: Buffer, signature: string | undefined) {
    if (!stripe || !config.STRIPE_WEBHOOK_SECRET) fail(400, 'Webhook not configured');
    let event: Stripe.Event;
    try { event = stripe!.webhooks.constructEvent(rawBody, signature || '', config.STRIPE_WEBHOOK_SECRET); } catch { return fail(400, 'Bad signature'); }
    if (event.type === 'payment_intent.succeeded') await creditPaymentIntent(event.data.object as Stripe.PaymentIntent);
    return { received: true };
  }
  return { wallet, adjustCredits, charge, hasFreeAccess, overview, configFor, setupIntent, verifyCard, paymentIntent, confirm, simulatedCheckout, webhook, paymentView };
}
export type BillingService = ReturnType<typeof createBillingService>;
