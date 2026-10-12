import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { PackBody, VerifyCardBody, ConfirmPaymentBody, AnyObject } from '@stepwise/shared';
import type { Services } from '../../services.js';

const routes: FastifyPluginAsyncZod<{ svc: Services }> = async (app, { svc }) => {
  const parent = { roles: ['parent' as const] };
  const tags = ['billing'];
  app.get('/billing', { config: parent, schema: { tags, summary: 'Wallet, packs, payments and credit history', response: { 200: AnyObject } } }, async (req) => svc.billing.overview(req.user!));
  app.get('/billing/config', { schema: { tags, summary: 'Payment configuration for the client (Stripe publishable key, card status)', response: { 200: AnyObject } } }, async (req) => svc.billing.configFor(req.user!));
  app.post('/billing/setup-intent', { config: parent, schema: { tags, summary: '£0 card check — create a Stripe SetupIntent', response: { 200: AnyObject } } }, async (req) => svc.billing.setupIntent(req.user!));
  app.post('/billing/verify-card', { config: parent, schema: { tags, body: VerifyCardBody, response: { 200: AnyObject } } }, async (req) => svc.billing.verifyCard(req.user!, req.body));
  app.post('/billing/payment-intent', { config: parent, schema: { tags, body: PackBody, response: { 200: AnyObject } } }, async (req) => svc.billing.paymentIntent(req.user!, req.body.packId));
  app.post('/billing/confirm', { config: parent, schema: { tags, body: ConfirmPaymentBody, response: { 200: AnyObject } } }, async (req) => svc.billing.confirm(req.user!, req.body.paymentIntentId));
  app.post('/billing/checkout', { config: parent, schema: { tags, summary: 'Simulated checkout (demo mode only)', body: PackBody, response: { 200: AnyObject } } }, async (req) => svc.billing.simulatedCheckout(req.user!, req.body.packId));
  // Stripe webhook needs the raw body for signature verification
  await app.register(async (raw) => {
    raw.addContentTypeParser('application/json', { parseAs: 'buffer' }, (_req, body, done) => done(null, body));
    raw.post('/billing/webhook', { config: { auth: false }, schema: { tags, summary: 'Stripe webhook (payment_intent.succeeded)', hide: false } }, async (req) =>
      svc.billing.webhook(req.body as Buffer, req.headers['stripe-signature'] as string | undefined));
  });
};
export default routes;
