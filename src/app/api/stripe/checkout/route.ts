import { NextRequest, NextResponse } from "next/server";
import type Stripe from "stripe";
import {
  getStripe,
  STRIPE_PRICE_ID,
  getAppUrl,
  isMissingStripeCustomerError,
  stripeErrorMessage,
} from "@/lib/stripe";
import { verifyIdToken, getAdminDb, isFirebaseAdminConfigured } from "@/lib/firebase-admin";
import { logStripeCheckoutError } from "@/lib/stripe/logs";

export const runtime = "nodejs";

type CheckoutParams = Stripe.Checkout.SessionCreateParams;

async function createCheckoutSession(
  stripe: Stripe,
  params: CheckoutParams
): Promise<Stripe.Checkout.Session> {
  return stripe.checkout.sessions.create(params);
}

export async function POST(request: NextRequest) {
  let uid: string | undefined;
  let quantity = 1;
  let customerId: string | undefined;

  try {
    const { idToken, quantity: rawQuantity } = (await request.json()) as {
      idToken?: string;
      quantity?: number;
    };

    if (!idToken?.trim()) {
      return NextResponse.json({ error: "idToken is required" }, { status: 400 });
    }

    quantity = Math.min(10, Math.max(1, Math.floor(rawQuantity ?? 1)));

    const stripe = getStripe();
    if (!stripe || !STRIPE_PRICE_ID) {
      return NextResponse.json(
        { error: "Payments are not configured on the server." },
        { status: 503 }
      );
    }

    if (!isFirebaseAdminConfigured()) {
      return NextResponse.json(
        {
          error:
            "Server auth is not configured. Check FIREBASE_SERVICE_ACCOUNT_KEY on Vercel (valid JSON, single line).",
        },
        { status: 503 }
      );
    }

    const decoded = await verifyIdToken(idToken.trim());
    if (!decoded) {
      return NextResponse.json({ error: "Invalid or expired session." }, { status: 401 });
    }

    uid = decoded.uid;
    const email = decoded.email;

    const db = getAdminDb();
    if (db) {
      const snap = await db.collection("users").doc(uid).get();
      customerId = (snap.data()?.stripeCustomerId as string) ?? undefined;
    }

    const appUrl = getAppUrl(request);

    const baseParams: CheckoutParams = {
      mode: "subscription",
      line_items: [{ price: STRIPE_PRICE_ID, quantity }],
      client_reference_id: uid,
      metadata: { firebaseUid: uid, businessQuantity: String(quantity) },
      subscription_data: { metadata: { firebaseUid: uid } },
      allow_promotion_codes: true,
      success_url: `${appUrl}/dashboard/pricing?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/dashboard/pricing?checkout=cancelled`,
    };

    let session: Stripe.Checkout.Session;
    try {
      session = await createCheckoutSession(stripe, {
        ...baseParams,
        ...(customerId
          ? { customer: customerId }
          : email
            ? { customer_email: email }
            : {}),
      });
    } catch (error) {
      // Stored customer ids from test mode (or manual grants) break live checkout.
      if (customerId && isMissingStripeCustomerError(error)) {
        session = await createCheckoutSession(stripe, {
          ...baseParams,
          ...(email ? { customer_email: email } : {}),
        });
      } else {
        throw error;
      }
    }

    if (!session.url) {
      return NextResponse.json({ error: "Could not start checkout." }, { status: 500 });
    }

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("Stripe checkout error:", error);
    await logStripeCheckoutError({
      firebaseUid: uid,
      quantity,
      stripeCustomerId: customerId ?? null,
      error,
    });
    return NextResponse.json(
      { error: stripeErrorMessage(error) },
      { status: 500 }
    );
  }
}
