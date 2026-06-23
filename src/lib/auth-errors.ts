export function getFirebaseAuthErrorMessage(error: unknown): string {
  const code =
    error && typeof error === "object" && "code" in error
      ? String((error as { code: string }).code)
      : "";

  switch (code) {
    case "auth/invalid-email":
      return "Please enter a valid email address.";
    case "auth/user-disabled":
      return "This account has been disabled.";
    case "auth/user-not-found":
    case "auth/wrong-password":
      return "Invalid email or password.";
    case "auth/invalid-credential":
      return "Current password is incorrect.";
    case "auth/email-already-in-use":
      return "An account with this email already exists.";
    case "auth/credential-already-in-use":
      return "This email is already linked to another account.";
    case "auth/provider-already-linked":
      return "This sign-in method is already linked to your account.";
    case "auth/weak-password":
      return "Password must be at least 6 characters.";
    case "auth/popup-closed-by-user":
      return "Sign-in popup was closed. Please try again.";
    case "auth/popup-blocked":
      return "Popup was blocked. Allow popups for this site.";
    case "auth/operation-not-allowed":
      return "This sign-in method is not enabled. Enable Email/Password or Google in Firebase Console → Authentication.";
    case "auth/network-request-failed":
      return "Network error. Check your connection and try again.";
    case "auth/too-many-requests":
      return "Too many attempts. Please wait and try again.";
    case "auth/requires-recent-login":
      return "Please sign out and sign in again, then retry this action.";
    case "auth/configuration-not-found":
      return "Firebase Auth is not configured. Enable Authentication in Firebase Console.";
    default:
      if (error instanceof Error) return error.message;
      return "Authentication failed. Please try again.";
  }
}
