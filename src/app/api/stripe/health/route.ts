import { NextResponse } from "next/server";

export const runtime = "nodejs";

/** Lightweight health check — no firebase-admin import at module load. */
export async function GET() {
  let firebaseAdminReady = false;
  let adminProjectId: string | null = null;
  try {
    const admin = await import("@/lib/firebase-admin");
    firebaseAdminReady = admin.isFirebaseAdminConfigured();
    adminProjectId = admin.getAdminProjectId();
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Firebase Admin failed to load",
      },
      { status: 500 }
    );
  }

  const stripeKey = process.env.STRIPE_SECRET_KEY?.trim();
  const priceId = process.env.STRIPE_PRICE_ID?.trim();
  const clientProjectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID?.trim() ?? null;
  const firebaseProjectsMatch =
    Boolean(clientProjectId && adminProjectId) && clientProjectId === adminProjectId;

  return NextResponse.json({
    ok: firebaseAdminReady && Boolean(stripeKey && priceId) && firebaseProjectsMatch,
    stripeKeySet: Boolean(stripeKey),
    stripeKeyMode: stripeKey?.startsWith("sk_live_")
      ? "live"
      : stripeKey?.startsWith("sk_test_")
        ? "test"
        : "unknown",
    priceIdSet: Boolean(priceId),
    firebaseAdminReady,
    clientProjectId,
    adminProjectId,
    firebaseProjectsMatch,
    appUrl:
      process.env.NEXT_PUBLIC_APP_URL?.trim() ??
      (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null),
  });
}
