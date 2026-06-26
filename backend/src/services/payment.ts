// ── Payment stub ──────────────────────────────────────────────────────────────
// v1: always returns "free" tier. Wire real provider here.
//
// To integrate PayFast (primary, SA-friendly):
//   1. Set PAYMENT_PROVIDER=payfast in .env
//   2. Implement createPayfastCheckout() using PAYFAST_MERCHANT_ID etc.
//   3. Handle ITN (Instant Transaction Notification) webhook at POST /api/payment/notify
//
// To integrate Stripe:
//   1. Set PAYMENT_PROVIDER=stripe
//   2. Use STRIPE_SECRET_KEY / STRIPE_WEBHOOK_SECRET

import { Tier } from "@lineupai/shared";

export interface PaymentService {
  getTierForUser(userId: string): Promise<Tier>;
  createCheckoutUrl(userId: string, plan: Tier): Promise<string>;
}

const stubPaymentService: PaymentService = {
  async getTierForUser(_userId: string): Promise<Tier> {
    return "free"; // TODO: look up subscription in DB
  },
  async createCheckoutUrl(_userId: string, _plan: Tier): Promise<string> {
    return "/payment-stub"; // TODO: return real PayFast/Stripe URL
  },
};

export const payment: PaymentService = stubPaymentService;
