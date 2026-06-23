"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/providers/auth-provider";
import { hasActiveBusiness } from "@/lib/firestore/reset-business";
import { getUserProfile } from "@/lib/user-profile";
import { canAccessBusinessSetup } from "@/lib/onboarding-flow";

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login");
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (loading || !user) return;

    Promise.all([getUserProfile(user.uid), hasActiveBusiness(user.uid)])
      .then(([profile, active]) => {
        const complete = profile?.onboardingComplete === true;
        const needsSetup = canAccessBusinessSetup(complete, active);
        if (needsSetup) {
          router.replace("/onboarding");
          return;
        }
        setChecking(false);
      })
      .catch(() => router.replace("/onboarding"));
  }, [user, loading, router]);

  if (loading || checking) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
      </div>
    );
  }

  if (!user) return null;

  return <>{children}</>;
}
