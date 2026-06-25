"use client";

import { useState } from "react";
import { Building2, CalendarDays, Check, Loader2, Plus } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAuth } from "@/components/providers/auth-provider";
import { usePlan } from "@/components/providers/plan-provider";
import { startCheckout } from "@/lib/billing";
import { showToast } from "@/components/ui/toast";

const ENTERPRISE_DEMO_URL =
  "https://calendly.com/blazly-marketing/blazly-demo?month=2026-06";

const PLAN_FEATURES = [
  "Complete Google Business Profile Optimization",
  "AI-Powered Local SEO Recommendations",
  "Local Keyword Discovery & Tracking",
  "Google Maps Rank Monitoring",
  "Top 10 Competitor Intelligence",
  "Competitor Keyword Analysis",
  "Review Management & Monitoring",
  "AI Review Reply Generation",
  "Business Image Enhancement",
  "Image Ranking Recommendations",
  "Performance & Growth Analytics",
  "Customer Engagement Insights",
  "Local Visibility Tracking",
  "Actionable SEO Recommendations",
  "Priority Feature Updates",
] as const;

const BUSINESS_TIERS = [
  { businesses: 1, total: 29 },
  { businesses: 2, total: 58 },
  { businesses: 3, total: 87 },
] as const;

function ProPlanCard() {
  const { user } = useAuth();
  const { isPro, businessSlots, loading, refreshPlan } = usePlan();
  const [submitting, setSubmitting] = useState(false);

  const handleCheckout = async () => {
    if (!user) {
      showToast("error", "Please sign in to subscribe.");
      return;
    }
    setSubmitting(true);
    try {
      await startCheckout(user);
      // Browser redirects to Stripe on success; refresh as a fallback.
      await refreshPlan();
    } catch (error) {
      showToast(
        "error",
        error instanceof Error ? error.message : "Could not start checkout."
      );
      setSubmitting(false);
    }
  };

  const hasPaid = isPro && businessSlots > 0;

  return (
    <div className="mx-auto max-w-md overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="bg-indigo-600 px-5 py-3.5 text-center text-white">
        <p className="text-[10px] font-semibold uppercase tracking-wider opacity-90">Per business</p>
        <h2 className="mt-0.5 text-lg font-bold">Local SEO Pro</h2>
      </div>

      <div className="px-5 py-4 text-center">
        <div className="inline-flex items-baseline gap-1">
          <span className="text-4xl font-bold text-slate-900">$29</span>
          <span className="text-base font-medium text-slate-500">/mo</span>
        </div>
        <p className="mt-1 text-xs text-slate-600">per Google Business Profile</p>
        <p className="mt-0.5 text-[11px] text-slate-400">1 business included · add more at $29 each</p>
      </div>

      {hasPaid && (
        <div className="mx-5 flex items-center justify-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-800">
          <Check className="h-3.5 w-3.5" strokeWidth={2.5} />
          Active — {businessSlots} business {businessSlots === 1 ? "profile" : "profiles"} unlocked
        </div>
      )}

      <ul className="max-h-44 space-y-1.5 overflow-y-auto border-t border-slate-100 px-5 py-3.5">
        {PLAN_FEATURES.map((feature) => (
          <li key={feature} className="flex items-start gap-2 text-xs text-slate-700">
            <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-500" strokeWidth={2.5} />
            <span>{feature}</span>
          </li>
        ))}
      </ul>

      <div className="border-t border-slate-100 px-5 pb-5 pt-4">
        <Button
          type="button"
          onClick={handleCheckout}
          disabled={submitting || loading}
          className="h-10 w-full rounded-lg bg-blue-600 text-sm font-bold shadow-sm hover:bg-blue-700"
        >
          {submitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Redirecting to checkout…
            </>
          ) : hasPaid ? (
            "Pay again — add another business ($29/mo)"
          ) : (
            "Subscribe — $29/mo per business"
          )}
        </Button>
        <p className="mt-2 text-center text-[11px] leading-relaxed text-slate-500">
          14-day money-back guarantee. No long-term contract.
          <br />
          Adding another business? You&apos;ll be charged an additional $29/month.
        </p>
      </div>
    </div>
  );
}

export function PricingSection() {
  return (
    <section className="space-y-10">
      <ProPlanCard />

      <div className="space-y-8">
        <div className="rounded-2xl border border-indigo-200 bg-gradient-to-br from-indigo-50 via-white to-slate-50 px-5 py-6 sm:px-8">
          <p className="text-sm font-semibold uppercase tracking-wide text-indigo-600">
            Per-business pricing
          </p>
          <h3 className="mt-2 text-2xl font-bold text-slate-900 sm:text-3xl">
            One business per subscription
          </h3>
          <p className="mt-3 max-w-2xl text-base leading-relaxed text-slate-600">
            Each Google Business Profile you manage needs its own{" "}
            <strong className="font-semibold text-slate-800">$29/month</strong> plan. Your account can
            hold one active business on a single subscription — add another location and you pay{" "}
            <strong className="font-semibold text-slate-800">another $29/month</strong> for that
            business.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="text-lg font-bold text-slate-900">How billing works</h3>
            <ol className="mt-5 space-y-5">
              {[
                {
                  step: "1",
                  title: "Subscribe for your first business",
                  body: "Pay $29/month to unlock the full toolkit for one Google Business Profile.",
                },
                {
                  step: "2",
                  title: "Manage one location per plan",
                  body: "Rank tracking, reviews, analytics, and optimization all apply to that single business.",
                },
                {
                  step: "3",
                  title: "Add more businesses anytime",
                  body: "Need a second café, clinic, or storefront? Subscribe again at $29/month per additional business.",
                },
              ].map((item) => (
                <li key={item.step} className="flex gap-4">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-sm font-bold text-white">
                    {item.step}
                  </span>
                  <div>
                    <p className="font-semibold text-slate-900">{item.title}</p>
                    <p className="mt-1 text-sm leading-relaxed text-slate-600">{item.body}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="text-lg font-bold text-slate-900">Monthly cost by business count</h3>
            <p className="mt-1 text-sm text-slate-500">+$29 for every additional business you add</p>
            <div className="mt-5 space-y-3">
              {BUSINESS_TIERS.map((tier, index) => (
                <div
                  key={tier.businesses}
                  className={cn(
                    "flex items-center justify-between rounded-xl border px-4 py-3",
                    index === 0
                      ? "border-indigo-200 bg-indigo-50/60"
                      : "border-slate-200 bg-slate-50/50"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div className="flex -space-x-1">
                      {Array.from({ length: tier.businesses }).map((_, i) => (
                        <span
                          key={i}
                          className="flex h-8 w-8 items-center justify-center rounded-lg border-2 border-white bg-white shadow-sm"
                        >
                          <Building2 className="h-4 w-4 text-indigo-600" />
                        </span>
                      ))}
                    </div>
                    <span className="text-sm font-medium text-slate-700">
                      {tier.businesses} {tier.businesses === 1 ? "business" : "businesses"}
                    </span>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-slate-900">${tier.total}/mo</p>
                    {index > 0 ? (
                      <p className="text-xs text-slate-500">+${29 * index} for extra locations</p>
                    ) : (
                      <p className="text-xs text-slate-500">base plan</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
            <p className="mt-4 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5 text-sm text-amber-900">
              <Plus className="mt-0.5 h-4 w-4 shrink-0" />
              <span>
                Each new business is a separate <strong className="font-semibold">$29/month</strong>{" "}
                subscription — not a shared account limit.
              </span>
            </p>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="max-w-xl">
              <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">
                Enterprise
              </p>
              <h3 className="mt-1 text-xl font-bold text-slate-900">
                Managing many locations or an agency?
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">
                For enterprise teams with multiple brands, franchises, or high-volume needs, we offer
                custom plans and onboarding. Book a demo to talk through pricing and setup with our
                team.
              </p>
            </div>
            <Link
              href={ENTERPRISE_DEMO_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-12 shrink-0 items-center justify-center gap-2 rounded-xl border border-amber-900 bg-amber-900 px-6 text-base font-semibold text-white shadow-sm transition-all hover:bg-amber-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-700 focus-visible:ring-offset-2"
            >
              <CalendarDays className="h-4 w-4" />
              Book a demo
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
