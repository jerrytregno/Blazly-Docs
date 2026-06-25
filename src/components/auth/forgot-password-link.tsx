"use client";

import { useState } from "react";
import { requestPasswordReset, PasswordResetError } from "@/lib/password-reset";
import { getFirebaseAuthErrorMessage } from "@/lib/auth-errors";
import { cn } from "@/lib/utils";

export function ForgotPasswordLink({
  email,
  className,
}: {
  email: string;
  className?: string;
}) {
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);

  const handleForgot = async () => {
    setMessage("");
    setError("");
    const trimmed = email.trim();
    if (!trimmed) {
      setError("Enter your email address first.");
      return;
    }
    setSending(true);
    try {
      await requestPasswordReset(trimmed);
      setMessage(
        `If ${trimmed} has an email/password account, we sent a reset link. Check your inbox and spam folder (sender may be Firebase or noreply).`
      );
    } catch (err) {
      if (err instanceof PasswordResetError) {
        setError(err.message);
      } else {
        setError(getFirebaseAuthErrorMessage(err));
      }
    } finally {
      setSending(false);
    }
  };

  return (
    <div className={cn("flex w-full flex-col items-end gap-1", className)}>
      <button
        type="button"
        onClick={() => void handleForgot()}
        disabled={sending}
        className="text-xs font-medium text-indigo-600 hover:text-indigo-700 disabled:opacity-60"
      >
        {sending ? "Sending..." : "Forgot password?"}
      </button>
      {message ? (
        <p className="w-full text-left text-xs leading-relaxed text-emerald-600">{message}</p>
      ) : null}
      {error ? <p className="w-full text-left text-xs leading-relaxed text-red-600">{error}</p> : null}
    </div>
  );
}
