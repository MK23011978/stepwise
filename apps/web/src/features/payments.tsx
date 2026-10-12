// £0 card check (Stripe SetupIntent) and credit-pack checkout (PaymentIntent) with the official Stripe React SDK.
// Without Stripe keys the API runs in demo mode and these flows are simulated (no card fields are shown).
import { useEffect, useState } from 'react';
import { loadStripe, type Stripe } from '@stripe/stripe-js';
import { Elements, ExpressCheckoutElement, LinkAuthenticationElement, PaymentElement, useElements, useStripe } from '@stripe/react-stripe-js';
import { api } from '../lib/api';
import { money } from '../lib/format';
import { confetti } from '../lib/confetti';
import { Spinner } from '../ui/bits';
/* eslint-disable @typescript-eslint/no-explicit-any */
let stripePromise: Promise<Stripe | null> | null = null;
const getStripe = (pk: string) => (stripePromise ||= loadStripe(pk));
const appearance = () => {
  const dark = document.documentElement.dataset.theme === 'dark' || (!document.documentElement.dataset.theme && matchMedia('(prefers-color-scheme: dark)').matches);
  return { theme: (dark ? 'night' : 'stripe') as 'night' | 'stripe', variables: { colorPrimary: '#3b6cf6', borderRadius: '12px', fontFamily: 'Inter, system-ui, sans-serif' } };
};

function StripeForm({ mode, email, submitLabel, onDone, run }: { mode: 'setup' | 'payment'; email?: string; submitLabel: string; onDone: (r: any) => void; run: (stripe: Stripe, elements: any) => Promise<any> }) {
  const stripe = useStripe(); const elements = useElements(); const [err, setErr] = useState(''); const [busy, setBusy] = useState(false); const [express, setExpress] = useState(true);
  const go = async () => {
    if (!stripe || !elements) return; setBusy(true); setErr('');
    try { const sub = await elements.submit(); if (sub.error) throw sub.error; onDone(await run(stripe, elements)); }
    catch (e: any) { setErr(e.message || 'Payment failed'); setBusy(false); }
  };
  return (
    <>
      {express && <><ExpressCheckoutElement options={{ buttonHeight: 50 }} onReady={(e) => { if (!e.availablePaymentMethods) setExpress(false); }} onConfirm={go} /><div className="pay-or">OR</div></>}
      <h3 style={{ marginBottom: 10 }}>Enter payment details</h3>
      <LinkAuthenticationElement options={{ defaultValues: { email: email || '' } }} />
      <h3 style={{ margin: '18px 0 10px' }}>{mode === 'setup' ? 'Save payment information' : 'Card'}</h3>
      <PaymentElement options={{ layout: 'tabs' }} />
      <div className="error" style={{ marginTop: 10 }}>{err}</div>
      <button className="btn lg block" style={{ marginTop: 12 }} disabled={busy || !stripe} onClick={go}>{submitLabel}</button>
    </>
  );
}

export function CardCheck({ onDone, onCancel }: { onDone: (r: any) => void; onCancel: () => void }) {
  const [cfg, setCfg] = useState<any>(null);
  useEffect(() => { api.billing.config().then(setCfg); }, []);
  const head = <><div className="tiny" style={{ color: 'var(--brand)', letterSpacing: '.14em' }}>Free first lesson</div><h2 style={{ marginTop: 8 }}>Pay £0 to start your child’s first lesson</h2>
    <p className="muted">This quick check helps us prevent bots and misuse of free trials. Your card won’t be charged.</p></>;
  if (!cfg) return <Spinner />;
  if (!cfg.live) return <>{head}<div className="demo-note" style={{ margin: '16px 0' }}>🧪 <b>Demo mode:</b> Stripe keys are not configured, so no card form is shown and nothing is collected.</div>
    <div className="row" style={{ justifyContent: 'flex-end' }}><button className="btn ghost" onClick={onCancel}>Cancel</button><button className="btn" onClick={async () => onDone(await api.billing.verifyCard({ demo: true }))}>Simulate card check</button></div></>;
  return <>{head}<Elements stripe={getStripe(cfg.publishableKey)} options={{ mode: 'setup', currency: 'gbp', appearance: appearance() }}>
    <StripeForm mode="setup" email={cfg.email} submitLabel="Continue to start your free trial lesson" onDone={onDone} run={async (stripe, elements) => {
      const { clientSecret } = await api.billing.setupIntent();
      const { error, setupIntent } = await stripe.confirmSetup({ elements, clientSecret, confirmParams: { return_url: `${location.origin}/app/billing` }, redirect: 'if_required' });
      if (error) throw error;
      return api.billing.verifyCard({ setupIntentId: setupIntent!.id });
    }} /></Elements>
    <p className="pay-small">Your card won’t be charged. It’s checked once so the free first lesson can only be claimed once per card. No subscription, no ongoing charges.</p></>;
}

export function PackCheckout({ pack, onDone, onCancel }: { pack: any; onDone: () => void; onCancel: () => void }) {
  const [cfg, setCfg] = useState<any>(null); const [busy, setBusy] = useState(false);
  useEffect(() => { api.billing.config().then(setCfg); }, []);
  const total = pack.credits + pack.bonus;
  const head = <><h2>Checkout</h2><p className="muted">{pack.label} · {total} lesson credits</p>
    <div className="card" style={{ boxShadow: 'none', background: 'var(--panel-2)', border: 0, margin: '14px 0' }}><div className="row spread"><span>Total</span><b style={{ fontSize: 24 }}>{money(pack.price)}</b></div></div></>;
  const done = () => { confetti(); onDone(); };
  if (!cfg) return <Spinner />;
  if (!cfg.live) return <>{head}<div className="demo-note">🧪 <b>Demo mode:</b> no real payment is taken. Add Stripe keys to accept cards, Apple Pay and Link.</div>
    <div className="row" style={{ justifyContent: 'flex-end', marginTop: 20 }}><button className="btn ghost" onClick={onCancel}>Cancel</button>
      <button className="btn" disabled={busy} onClick={async () => { setBusy(true); await api.billing.checkout(pack.id); done(); }}>Pay {money(pack.price)} (demo)</button></div></>;
  return <>{head}<Elements stripe={getStripe(cfg.publishableKey)} options={{ mode: 'payment', amount: Math.round(pack.price * 100), currency: 'gbp', appearance: appearance() }}>
    <StripeForm mode="payment" email={cfg.email} submitLabel={`Pay ${money(pack.price)}`} onDone={done} run={async (stripe, elements) => {
      const { clientSecret } = await api.billing.paymentIntent(pack.id);
      const { error, paymentIntent } = await stripe.confirmPayment({ elements, clientSecret, confirmParams: { return_url: `${location.origin}/app/billing` }, redirect: 'if_required' });
      if (error) throw error;
      return api.billing.confirm(paymentIntent!.id);
    }} /></Elements><p className="pay-small">Payments are processed securely by Stripe. Card details never reach Stepwise.</p></>;
}

/** Completes a Stripe redirect (3-D Secure / bank app) when the user lands back on the site. */
export async function completeStripeRedirect() {
  const p = new URLSearchParams(location.search);
  const si = p.get('setup_intent'); const pi = p.get('payment_intent');
  if (!si && !pi) return null;
  history.replaceState(null, '', location.pathname);
  if (si) return api.billing.verifyCard({ setupIntentId: si });
  return api.billing.confirm(pi!);
}
