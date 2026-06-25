import Stripe from "stripe";

let cached: Stripe | null = null;

/** Returns a configured Stripe client, or null when the secret key is missing. */
export function getStripe(): Stripe | null {
  if (cached) return cached;
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key?.trim()) return null;
  cached = new Stripe(key.trim());
  return cached;
}

export const STRIPE_PRICE_ID = process.env.STRIPE_PRICE_ID ?? "";

export function getAppUrl(): string {
  const base = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (!base) {
    throw new Error("NEXT_PUBLIC_APP_URL is not configured. Add it to .env.local");
  }
  return base.replace(/\/$/, "");
}
