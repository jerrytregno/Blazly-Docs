"use client";

import { CreditCard } from "lucide-react";
import { PageDataGuard } from "@/components/data/page-data-guard";
import { PricingSection } from "@/components/pricing/pricing-section";

export default function PricingPage() {
  return (
    <PageDataGuard>
      <div className="space-y-6 pb-20 md:pb-0">
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
