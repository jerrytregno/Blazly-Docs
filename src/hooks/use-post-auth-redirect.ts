"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/providers/auth-provider";
import { hasPendingOnboarding } from "@/lib/onboarding-flow";
import { getPostAuthPath } from "@/lib/user-profile";

export function usePostAuthRedirect() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading || !user) return;
    if (hasPendingOnboarding()) {
      router.replace("/onboarding");
      return;
    }
    getPostAuthPath(user.uid)
      .then((path) => router.replace(path))
      .catch(() => router.replace("/onboarding"));
  }, [user, loading, router]);
}
