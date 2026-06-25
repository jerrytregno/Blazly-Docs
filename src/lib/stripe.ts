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

type UrlRequest = { headers: Headers };

/** Resolve the public app URL for Stripe redirect URLs. */
export function getAppUrl(request?: UrlRequest): string {
  const fromEnv = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (fromEnv) return fromEnv.replace(/\/$/, "");

  const vercel = process.env.VERCEL_URL?.trim();
  if (vercel) return `https://${vercel.replace(/\/$/, "")}`;

  const origin = request?.headers.get("origin")?.trim();
  if (origin) return origin.replace(/\/$/, "");

  const host = request?.headers.get("x-forwarded-host")?.trim();
  const proto = request?.headers.get("x-forwarded-proto")?.trim() ?? "https";
  if (host) return `${proto}://${host}`.replace(/\/$/, "");

  throw new Error(
    "Could not determine app URL. Set NEXT_PUBLIC_APP_URL in your environment (e.g. https://localseo.blazly.ai), then redeploy."
  );
}

export function stripeErrorMessage(error: unknown): string {
  if (error instanceof Stripe.errors.StripeError) {
    if (error.code === "resource_missing") {
      return "Stripe configuration error: price or customer not found. Check live-mode STRIPE_PRICE_ID and customer IDs.";
    }
    return error.message;
  }
  if (error instanceof Error) return error.message;
  return "Failed to start checkout";
}

export function isMissingStripeCustomerError(error: unknown): boolean {
  return (
    error instanceof Stripe.errors.StripeError &&
    error.code === "resource_missing" &&
    error.param === "customer"
  );
}
