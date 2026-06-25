import { cert, getApps, initializeApp, type App } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore, FieldValue, type Firestore } from "firebase-admin/firestore";

function getAdminApp(): App | null {
  if (getApps().length) return getApps()[0]!;

  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  if (!raw?.trim()) return null;

  try {
    return initializeApp({
      credential: cert(JSON.parse(raw) as Record<string, string>),
    });
  } catch {
    return null;
  }
}

/** Firestore instance from the Admin SDK, or null when credentials are missing. */
export function getAdminDb(): Firestore | null {
  const app = getAdminApp();
  if (!app) return null;
  return getFirestore(app);
}

/** Verifies a Firebase ID token and returns the user's uid + email, or null. */
export async function verifyIdToken(
  idToken: string
): Promise<{ uid: string; email: string | null } | null> {
  const app = getAdminApp();
  if (!app) return null;

  try {
    const decoded = await getAuth(app).verifyIdToken(idToken);
    return { uid: decoded.uid, email: decoded.email ?? null };
  } catch {
    return null;
  }
}

export async function revokeUserRefreshTokens(idToken: string): Promise<boolean> {
  const app = getAdminApp();
  if (!app) return false;

  const adminAuth = getAuth(app);
  const decoded = await adminAuth.verifyIdToken(idToken);
  await adminAuth.revokeRefreshTokens(decoded.uid);
  return true;
}

interface PaidBusinessRecord {
  stripeCustomerId?: string | null;
  stripeSubscriptionId?: string | null;
  subscriptionStatus?: string | null;
  /** Stripe Checkout session id — used to make webhook processing idempotent. */
  checkoutSessionId?: string | null;
  /** Number of business slots to grant (from checkout quantity). */
  slotCount?: number;
}

/**
 * Marks a user as paid: upgrades them to the Pro plan and grants additional
 * business slots. Processing is idempotent per Stripe Checkout session.
 */
export async function grantPaidBusinessSlot(
  uid: string,
  record: PaidBusinessRecord
): Promise<boolean> {
  const db = getAdminDb();
  if (!db) return false;

  const slotCount = Math.max(1, record.slotCount ?? 1);
  const userRef = db.collection("users").doc(uid);

  return db.runTransaction(async (tx) => {
    const snap = await tx.get(userRef);
    const data = snap.data() ?? {};

    const processed: string[] = Array.isArray(data.processedCheckoutSessions)
      ? (data.processedCheckoutSessions as string[])
      : [];

    if (record.checkoutSessionId && processed.includes(record.checkoutSessionId)) {
      return false;
    }

    const update: Record<string, unknown> = {
      plan: "Pro",
      businessSlots: FieldValue.increment(slotCount),
      paidAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    };

    if (record.stripeCustomerId) update.stripeCustomerId = record.stripeCustomerId;
    if (record.stripeSubscriptionId) update.stripeSubscriptionId = record.stripeSubscriptionId;
    if (record.subscriptionStatus) update.subscriptionStatus = record.subscriptionStatus;
    if (record.checkoutSessionId) {
      update.processedCheckoutSessions = FieldValue.arrayUnion(record.checkoutSessionId);
    }

    tx.set(userRef, update, { merge: true });
    return true;
  });
}

/** Updates subscription status (e.g. when a subscription is cancelled). */
export async function updateSubscriptionStatus(
  stripeCustomerId: string,
  status: string,
  options: { downgrade?: boolean } = {}
): Promise<void> {
  const db = getAdminDb();
  if (!db) return;

  const matches = await db
    .collection("users")
    .where("stripeCustomerId", "==", stripeCustomerId)
    .limit(1)
    .get();

  if (matches.empty) return;

  const update: Record<string, unknown> = {
    subscriptionStatus: status,
    updatedAt: FieldValue.serverTimestamp(),
  };
  if (options.downgrade) {
    update.plan = "Free";
    update.businessSlots = 0;
  }

  await matches.docs[0]!.ref.set(update, { merge: true });
}
