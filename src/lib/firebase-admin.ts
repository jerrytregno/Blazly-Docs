import { cert, getApps, initializeApp, type App } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";

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

export async function revokeUserRefreshTokens(idToken: string): Promise<boolean> {
  const app = getAdminApp();
  if (!app) return false;

  const adminAuth = getAuth(app);
  const decoded = await adminAuth.verifyIdToken(idToken);
  await adminAuth.revokeRefreshTokens(decoded.uid);
  return true;
}
