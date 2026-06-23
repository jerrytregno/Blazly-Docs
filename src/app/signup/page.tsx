"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/providers/auth-provider";
import { AuthLayout } from "@/components/auth/auth-layout";
import { getFirebaseAuthErrorMessage } from "@/lib/auth-errors";
import { auth } from "@/lib/firebase";
import { markPendingOnboarding } from "@/lib/onboarding-flow";
import { getPostAuthPath } from "@/lib/user-profile";

export default function SignupPage() {
  const { user, loading: authLoading, signUp, signInWithGoogle } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);

  // Already signed in: send to onboarding or dashboard (never stay on signup)
  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setCheckingSession(false);
      return;
    }
    getPostAuthPath(user.uid)
      .then((path) => router.replace(path))
      .catch(() => router.replace("/onboarding"))
      .finally(() => setCheckingSession(false));
  }, [user, authLoading, router]);

  const goToOnboarding = () => {
    markPendingOnboarding();
    router.replace("/onboarding");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }
    setLoading(true);
    try {
      await signUp(email, password);
      goToOnboarding();
    } catch (err) {
      setError(getFirebaseAuthErrorMessage(err));
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setError("");
    setLoading(true);
    try {
      const { isNewUser } = await signInWithGoogle();
      if (isNewUser) {
        goToOnboarding();
        return;
      }
      const uid = auth.currentUser?.uid;
      const path = uid ? await getPostAuthPath(uid) : "/onboarding";
      router.replace(path);
    } catch (err) {
      setError(getFirebaseAuthErrorMessage(err));
      setLoading(false);
    }
  };

  if (authLoading || checkingSession || user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
      </div>
    );
  }

  return (
    <AuthLayout
      title="Create Account"
      subtitle="Get started with Blazly SEO."
      onGoogleSignIn={handleGoogle}
      googleLoading={loading}
      footer={
        <>
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-indigo-600 hover:text-indigo-700">
            Log In
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-2">
          <label htmlFor="email" className="text-[11px] font-semibold tracking-widest text-gray-500">
            EMAIL
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            required
            autoComplete="email"
            className="auth-input h-12 w-full rounded-xl px-4 text-sm"
          />
        </div>
        <div className="space-y-2">
          <label htmlFor="password" className="text-[11px] font-semibold tracking-widest text-gray-500">
            PASSWORD
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            required
            autoComplete="new-password"
            minLength={6}
            className="auth-input h-12 w-full rounded-xl px-4 text-sm"
          />
        </div>
        {error && (
          <p className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-300">{error}</p>
        )}
        <button
          type="submit"
          disabled={loading}
          className="gradient-btn h-12 w-full rounded-xl text-sm font-semibold transition"
        >
          {loading ? "Creating account..." : "Create Account"}
        </button>
      </form>
    </AuthLayout>
  );
}
