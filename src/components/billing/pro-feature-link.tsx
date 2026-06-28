"use client";

import Link from "next/link";
import { Lock } from "lucide-react";
import { usePlan } from "@/components/providers/plan-provider";
import { useUpgradeModal } from "@/components/billing/upgrade-modal-provider";

export function ProFeatureLink({
  href,
  featureLabel,
  className,
  children,
  showLockIcon = true,
}: {
  href: string;
  featureLabel: string;
  className?: string;
  children: React.ReactNode;
  showLockIcon?: boolean;
}) {
  const { hasPaidAccess } = usePlan();
  const { openUpgradeModal } = useUpgradeModal();

  if (!hasPaidAccess) {
    return (
      <button
        type="button"
        onClick={() => openUpgradeModal(featureLabel)}
        className={className}
      >
        {children}
        {showLockIcon && (
          <Lock className="ml-1 inline h-3.5 w-3.5 shrink-0 opacity-80" aria-hidden />
        )}
      </button>
    );
  }

  return (
    <Link href={href} className={className}>
      {children}
    </Link>
  );
}
