"use client";

import { Suspense, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CreditCard } from "lucide-react";
import { PageDataGuard } from "@/components/data/page-data-guard";
import { PricingSection } from "@/components/pricing/pricing-section";
import { usePlan } from "@/components/providers/plan-provider";
import { showToast } from "@/components/ui/toast";

function CheckoutStatusHandler() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { refreshPlan } = usePlan();
  const handled = useRef(false);

  useEffect(() => {
    if (handled.current) return;
    const status = searchParams.get("checkout");
    if (!status) return;
    handled.current = true;

    if (status === "success") {
      showToast("success", "Payment received! Your business profile is now unlocked.");
      // Webhook updates Firestore; poll a couple of times so the UI catches up.
      void refreshPlan();
      const t1 = setTimeout(() => void refreshPlan(), 2500);
      const t2 = setTimeout(() => void refreshPlan(), 6000);
      router.replace("/dashboard/pricing");
      return () => {
        clearTimeout(t1);
        clearTimeout(t2);
      };
    }

    if (status === "cancelled") {
      showToast("error", "Checkout cancelled. You have not been charged.");
      router.replace("/dashboard/pricing");
    }
  }, [searchParams, refreshPlan, router]);

  return null;
}

export default function PricingPage() {
  return (
    <PageDataGuard>
      <div className="space-y-6 pb-20 md:pb-0">
        <Suspense fallback={null}>
          <CheckoutStatusHandler />
        </Suspense>
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-gray-900">
            <CreditCard className="h-7 w-7 text-indigo-600" />
            Pricing
          </h1>
        </div>

        <PricingSection />
      </div>
    </PageDataGuard>
  );
}
