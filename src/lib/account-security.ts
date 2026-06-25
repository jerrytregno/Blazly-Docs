import {
  EmailAuthProvider,
  GoogleAuthProvider,
  linkWithCredential,
  reauthenticateWithCredential,
  reauthenticateWithPopup,
  updateEmail,
  updatePassword,
  type User,
} from "firebase/auth";
import { requestPasswordReset } from "@/lib/password-reset";

export function hasEmailPasswordProvider(user: User): boolean {
  return user.providerData.some((p) => p.providerId === "password");
}

export function hasGoogleProvider(user: User): boolean {
  return user.providerData.some((p) => p.providerId === "google.com");
}

export function getSignInMethods(user: User): string[] {
  const methods: string[] = [];
  if (hasGoogleProvider(user)) methods.push("Google");
  if (hasEmailPasswordProvider(user)) methods.push("Email & password");
  return methods;
}

export async function reauthenticateWithPassword(
  user: User,
  password: string
): Promise<void> {
  if (!user.email) {
    throw new Error("This account has no email address.");
  }
  const credential = EmailAuthProvider.credential(user.email, password);
  await reauthenticateWithCredential(user, credential);
}

export async function reauthenticateWithGoogle(user: User): Promise<void> {
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: "login" });
  await reauthenticateWithPopup(user, provider);
}

/** Confirm identity — Google popup or password depending on account type */
export async function reauthenticateUser(
  user: User,
  password?: string
): Promise<void> {
  if (password?.trim() && hasEmailPasswordProvider(user)) {
    await reauthenticateWithPassword(user, password);
    return;
  }
  if (hasGoogleProvider(user)) {
    await reauthenticateWithGoogle(user);
    return;
  }
  if (password?.trim()) {
    await reauthenticateWithPassword(user, password);
    return;
  }
  throw new Error("Please enter your current password to continue.");
}

export async function linkEmailPasswordToAccount(
  user: User,
  password: string
): Promise<void> {
  if (!user.email) {
    throw new Error("This account has no email address.");
  }
  if (password.length < 6) {
    throw new Error("Password must be at least 6 characters.");
  }
  if (hasEmailPasswordProvider(user)) {
    throw new Error("A password is already set for this account.");
  }
  await reauthenticateWithGoogle(user);
  const credential = EmailAuthProvider.credential(user.email, password);
  await linkWithCredential(user, credential);
  await user.reload();
}

export async function changeAccountPassword(
  user: User,
  currentPassword: string,
  newPassword: string
): Promise<void> {
  if (newPassword.length < 6) {
    throw new Error("Password must be at least 6 characters.");
  }
  if (hasEmailPasswordProvider(user) && currentPassword === newPassword) {
    throw new Error("New password must be different from your current password.");
  }

  if (!hasEmailPasswordProvider(user)) {
    await linkEmailPasswordToAccount(user, newPassword);
    return;
  }

  await reauthenticateUser(user, currentPassword);
  await updatePassword(user, newPassword);
  await user.reload();
}

export async function changeAccountEmail(
  user: User,
  newEmail: string,
  currentPassword?: string
): Promise<void> {
  const email = newEmail.trim();
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error("Please enter a valid email address.");
  }
  if (email === user.email) {
    throw new Error("That is already your current email.");
  }

  await reauthenticateUser(user, currentPassword);
  await updateEmail(user, email);
  await user.reload();
}

export async function sendAccountPasswordReset(email: string): Promise<void> {
  await requestPasswordReset(email);
}

export async function revokeAllSessions(idToken: string): Promise<boolean> {
  const res = await fetch("/api/auth/revoke-sessions", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ idToken }),
  });
  if (res.status === 503) return false;
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error ?? "Failed to revoke sessions");
  }
  return true;
}

export async function signOutAllDevices(
  user: User,
  currentPassword?: string
): Promise<boolean> {
  await reauthenticateUser(user, currentPassword);
  const idToken = await user.getIdToken();
  return revokeAllSessions(idToken).catch(() => false);
}
