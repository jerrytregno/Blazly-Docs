import type { User } from "firebase/auth";

/**
 * Starts a Stripe Checkout session for the current user and redirects the
 * browser to Stripe's hosted payment page.
 */
export async function startCheckout(user: User, quantity = 1): Promise<void> {
  const idToken = await user.getIdToken();
  const qty = Math.min(10, Math.max(1, Math.floor(quantity)));

  const res = await fetch("/api/stripe/checkout", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ idToken, quantity: qty }),
  });

  const data = (await res.json()) as { url?: string; error?: string };

  if (!res.ok || !data.url) {
    throw new Error(data.error ?? "Could not start checkout. Please try again.");
  }

  window.location.href = data.url;
}
