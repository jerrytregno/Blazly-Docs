"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/providers/auth-provider";
import { AuthLayout } from "@/components/auth/auth-layout";
import { usePostAuthRedirect } from "@/hooks/use-post-auth-redirect";
import { getFirebaseAuthErrorMessage } from "@/lib/auth-errors";
import { auth } from "@/lib/firebase";
import { getPostAuthPath } from "@/lib/user-profile";

export default function LoginPage() {
  const { signIn, signInWithGoogle } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  usePostAuthRedirect();

  const redirectAfterAuth = async () => {
    const uid = auth.currentUser?.uid;
    if (!uid) return;
    const path = await getPostAuthPath(uid);
    router.replace(path);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await signIn(email, password);
      await redirectAfterAuth();
    } catch (err) {
      setError(getFirebaseAuthErrorMessage(err));
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setError("");
    setLoading(true);
    try {
      await signInWithGoogle();
      await redirectAfterAuth();
    } catch (err) {
      setError(getFirebaseAuthErrorMessage(err));
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Sign in to your Blazly Local SEO dashboard."
      onGoogleSignIn={handleGoogle}
      googleLoading={loading}
      footer={
        <>
          Don&apos;t have an account?{" "}
          <Link href="/signup" className="font-medium text-indigo-600 hover:text-indigo-700">
            Create Account
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
            autoComplete="current-password"
            className="auth-input h-12 w-full rounded-xl px-4 text-sm"
          />
        </div>
        {error && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
        )}
        <button
          type="submit"
          disabled={loading}
          className="gradient-btn h-12 w-full rounded-xl text-sm font-semibold transition"
        >
          {loading ? "Signing in..." : "Sign In"}
        </button>
      </form>
    </AuthLayout>
  );
}
