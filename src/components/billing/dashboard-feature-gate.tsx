"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { isFreeDashboardRoute } from "@/config/plans";
import { navigation } from "@/config/navigation";
import { useUpgradeModal } from "@/components/billing/upgrade-modal-provider";
import { usePlan } from "@/components/providers/plan-provider";

function featureLabelForPath(pathname: string): string {
  const match = navigation.find((section) => {
    if (!section.href) return false;
    if (section.href === "/dashboard") return pathname === "/dashboard";
    return pathname === section.href || pathname.startsWith(`${section.href}/`);
  });
  return match?.label ?? "This feature";
}

export function DashboardFeatureGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { hasPaidAccess, loading } = usePlan();
  const { openUpgradeModal } = useUpgradeModal();
  const blocked = !loading && !hasPaidAccess && !isFreeDashboardRoute(pathname);

  useEffect(() => {
    if (!blocked) return;
    openUpgradeModal(featureLabelForPath(pathname));
    router.replace("/dashboard");
  }, [blocked, pathname, openUpgradeModal, router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (blocked) return null;

  return <>{children}</>;
}
