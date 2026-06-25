import {
  fetchSignInMethodsForEmail,
  sendPasswordResetEmail,
  type ActionCodeSettings,
} from "firebase/auth";
import { auth } from "@/lib/firebase";

export class PasswordResetError extends Error {
  readonly code: "google_only" | "invalid_email";

  constructor(message: string, code: "google_only" | "invalid_email" = "invalid_email") {
    super(message);
    this.name = "PasswordResetError";
    this.code = code;
  }
}

function passwordResetContinueUrl(): string {
  if (typeof window !== "undefined" && window.location.origin) {
    return `${window.location.origin}/login`;
  }

  const base = process.env.NEXT_PUBLIC_APP_URL?.trim().replace(/\/$/, "");
  if (!base) {
    throw new Error("NEXT_PUBLIC_APP_URL is not configured. Add it to .env.local");
  }

  return `${base}/login`;
}

/** Sends a Firebase password reset email when the account uses email/password. */
export async function requestPasswordReset(email: string): Promise<void> {
  const trimmed = email.trim().toLowerCase();
  if (!trimmed) {
    throw new PasswordResetError("Enter your email address first.");
  }

  let methods: string[] = [];
  try {
    methods = await fetchSignInMethodsForEmail(auth, trimmed);
  } catch {
    // Enumeration protection may hide methods — still attempt send below.
  }

  if (methods.length > 0) {
    const hasPassword = methods.includes("password");
    const hasGoogle = methods.includes("google.com");

    if (!hasPassword && hasGoogle) {
      throw new PasswordResetError(
        "This account uses Google sign-in. Use Continue with Google instead of resetting a password.",
        "google_only"
      );
    }

    if (!hasPassword) {
      throw new PasswordResetError(
        "This account does not use email and password sign-in.",
        "google_only"
      );
    }
  }

  const actionCodeSettings: ActionCodeSettings = {
    url: passwordResetContinueUrl(),
    handleCodeInApp: false,
  };

  await sendPasswordResetEmail(auth, trimmed, actionCodeSettings);
}
