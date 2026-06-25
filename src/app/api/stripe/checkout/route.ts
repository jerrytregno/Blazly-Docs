import { NextRequest, NextResponse } from "next/server";
import { getStripe, STRIPE_PRICE_ID, getAppUrl } from "@/lib/stripe";
import { verifyIdToken, getAdminDb } from "@/lib/firebase-admin";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const { idToken } = (await request.json()) as { idToken?: string };

    if (!idToken?.trim()) {
      return NextResponse.json({ error: "idToken is required" }, { status: 400 });
    }

    const stripe = getStripe();
    if (!stripe || !STRIPE_PRICE_ID) {
      return NextResponse.json(
        { error: "Payments are not configured on the server." },
        { status: 503 }
      );
    }

    const decoded = await verifyIdToken(idToken.trim());
    if (!decoded) {
      return NextResponse.json({ error: "Invalid or expired session." }, { status: 401 });
    }

    const { uid, email } = decoded;

    // Reuse an existing Stripe customer id if we have one stored.
    let customerId: string | undefined;
    const db = getAdminDb();
    if (db) {
      const snap = await db.collection("users").doc(uid).get();
      customerId = (snap.data()?.stripeCustomerId as string) ?? undefined;
    }

    const appUrl = getAppUrl();

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      line_items: [{ price: STRIPE_PRICE_ID, quantity: 1 }],
      ...(customerId
        ? { customer: customerId }
        : email
          ? { customer_email: email }
          : {}),
      client_reference_id: uid,
      metadata: { firebaseUid: uid },
      subscription_data: { metadata: { firebaseUid: uid } },
      allow_promotion_codes: true,
      success_url: `${appUrl}/dashboard/pricing?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/dashboard/pricing?checkout=cancelled`,
    });

    if (!session.url) {
      return NextResponse.json({ error: "Could not start checkout." }, { status: 500 });
    }

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("Stripe checkout error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to start checkout" },
      { status: 500 }
    );
  }
}
