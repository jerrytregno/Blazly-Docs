type App = import("firebase-admin/app").App;
type Firestore = import("firebase-admin/firestore").Firestore;

let cachedApp: App | null | undefined;
let cachedServiceAccount: Record<string, string> | null | undefined;

function parseServiceAccountJson(raw: string): Record<string, string> | null {
  const trimmed = raw.trim();
  const candidates = [
    trimmed,
    trimmed.startsWith("'") && trimmed.endsWith("'") ? trimmed.slice(1, -1) : null,
    trimmed.startsWith('"') && trimmed.endsWith('"') ? trimmed.slice(1, -1) : null,
  ].filter((value): value is string => Boolean(value));

  for (const candidate of candidates) {
    try {
      const parsed = JSON.parse(candidate) as Record<string, unknown>;
      if (typeof parsed.private_key === "string") {
        parsed.private_key = parsed.private_key.replace(/\\n/g, "\n");
      }
      return parsed as Record<string, string>;
    } catch {
      // try next candidate
    }
  }

  return null;
}

/** Lazy-load firebase-admin so Vercel does not evaluate native modules at import time. */
function getAdminApp(): App | null {
  if (cachedApp !== undefined) return cachedApp;

  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  if (!raw?.trim()) {
    cachedApp = null;
    cachedServiceAccount = null;
    return null;
  }

  const serviceAccount = parseServiceAccountJson(raw);
  if (!serviceAccount) {
    console.error("FIREBASE_SERVICE_ACCOUNT_KEY is set but could not be parsed as JSON.");
    cachedApp = null;
    cachedServiceAccount = null;
    return null;
  }

  cachedServiceAccount = serviceAccount;

  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { cert, getApps, initializeApp } = require("firebase-admin/app") as typeof import("firebase-admin/app");

    if (getApps().length) {
      cachedApp = getApps()[0]!;
      return cachedApp;
    }

    cachedApp = initializeApp({
      credential: cert(serviceAccount),
    });
    return cachedApp;
  } catch (error) {
    console.error("Failed to initialize Firebase Admin:", error);
    cachedApp = null;
    return null;
  }
}

function getFirestoreModule() {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  return require("firebase-admin/firestore") as typeof import("firebase-admin/firestore");
}

function getAuthModule() {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  return require("firebase-admin/auth") as typeof import("firebase-admin/auth");
}

/** Firebase project id from the service account (server-side). */
export function getAdminProjectId(): string | null {
  if (cachedServiceAccount === undefined) {
    getAdminApp();
  }
  return cachedServiceAccount?.project_id ?? null;
}

/** True when Firebase Admin SDK initialized successfully (server-side auth/Firestore). */
export function isFirebaseAdminConfigured(): boolean {
  return getAdminApp() !== null;
}

/** Firestore instance from the Admin SDK, or null when credentials are missing. */
export function getAdminDb(): Firestore | null {
  const app = getAdminApp();
  if (!app) return null;
  const { getFirestore } = getFirestoreModule();
  return getFirestore(app);
}

/** Verifies a Firebase ID token and returns the user's uid + email, or null. */
export async function verifyIdToken(
  idToken: string
): Promise<{ uid: string; email: string | null } | null> {
  const app = getAdminApp();
  if (!app) return null;

  try {
    const { getAuth } = getAuthModule();
    const decoded = await getAuth(app).verifyIdToken(idToken);
    return { uid: decoded.uid, email: decoded.email ?? null };
  } catch (error) {
    const code =
      typeof error === "object" && error !== null && "code" in error
        ? String((error as { code?: string }).code)
        : "unknown";
    console.error("Firebase ID token verification failed:", code, error);
    return null;
  }
}

/** Returns a user-facing hint when token verification fails on the server. */
export function authVerificationHint(): string {
  const clientProject = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID?.trim();
  const adminProject = getAdminProjectId();
  if (clientProject && adminProject && clientProject !== adminProject) {
    return `Firebase project mismatch: client uses "${clientProject}" but server uses "${adminProject}". Align NEXT_PUBLIC_FIREBASE_* and FIREBASE_SERVICE_ACCOUNT_KEY on Vercel, then redeploy.`;
  }
  return "Sign out, sign back in, and try again. If it persists, redeploy after verifying Firebase env vars on Vercel.";
}

export async function revokeUserRefreshTokens(idToken: string): Promise<boolean> {
  const app = getAdminApp();
  if (!app) return false;

  const { getAuth } = getAuthModule();
  const adminAuth = getAuth(app);
  const decoded = await adminAuth.verifyIdToken(idToken);
  await adminAuth.revokeRefreshTokens(decoded.uid);
  return true;
}

interface PaidBusinessRecord {
  stripeCustomerId?: string | null;
  stripeSubscriptionId?: string | null;
  subscriptionStatus?: string | null;
  checkoutSessionId?: string | null;
  slotCount?: number;
}

export async function grantPaidBusinessSlot(
  uid: string,
  record: PaidBusinessRecord
): Promise<boolean> {
  const db = getAdminDb();
  if (!db) return false;

  const { FieldValue } = getFirestoreModule();
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

export async function updateSubscriptionStatus(
  stripeCustomerId: string,
  status: string,
  options: { downgrade?: boolean } = {}
): Promise<void> {
  const db = getAdminDb();
  if (!db) return;

  const { FieldValue } = getFirestoreModule();
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
