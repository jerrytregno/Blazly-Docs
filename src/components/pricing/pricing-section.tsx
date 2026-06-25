"use client";

import { useState } from "react";
import { CalendarDays, Check, Loader2, Minus, Plus, ShieldCheck, Zap } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
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

const PRICE_PER_BUSINESS = 29;

function ProPlanCard() {
  const { user } = useAuth();
  const { isPro, businessSlots, loading, refreshPlan } = usePlan();
  const [submitting, setSubmitting] = useState(false);
  const [quantity, setQuantity] = useState(1);

  const total = quantity * PRICE_PER_BUSINESS;
  const hasPaid = isPro && businessSlots > 0;

  const handleCheckout = async () => {
    if (!user) {
      showToast("error", "Please sign in to subscribe.");
      return;
    }
    setSubmitting(true);
    try {
      await startCheckout(user, quantity);
      await refreshPlan();
    } catch (error) {
      showToast(
        "error",
        error instanceof Error ? error.message : "Could not start checkout."
      );
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-lg">
      <div className="grid lg:grid-cols-[1.05fr_1fr]">
        {/* Left — offer + price + CTA */}
        <div className="relative flex flex-col border-b border-slate-100 p-6 sm:p-8 lg:border-b-0 lg:border-r">
          <div className="absolute right-5 top-5">
            <span className="inline-flex items-center gap-1 rounded-full bg-indigo-600/10 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-indigo-700">
              Most popular
            </span>
          </div>

          <p className="text-[11px] font-semibold uppercase tracking-wider text-indigo-600">
            Per business
          </p>
          <h2 className="mt-1 text-2xl font-bold text-slate-900">Local SEO Pro</h2>
          <p className="mt-1.5 text-sm leading-relaxed text-slate-500">
            Everything you need to rank higher on Google Maps and win more local customers.
          </p>

          <div className="mt-6 rounded-2xl border border-slate-100 bg-slate-50/70 p-5">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
              How many businesses?
            </p>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  disabled={quantity <= 1}
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50 disabled:opacity-40"
                  aria-label="Decrease business count"
                >
                  <Minus className="h-4 w-4" />
                </button>
                <span className="min-w-[5.5rem] text-center text-sm font-semibold text-slate-700">
                  {quantity} {quantity === 1 ? "business" : "businesses"}
                </span>
                <button
                  type="button"
                  onClick={() => setQuantity((q) => Math.min(10, q + 1))}
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50"
                  aria-label="Increase business count"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="mt-5 flex items-end justify-between">
              <div>
                <div className="flex items-baseline gap-1">
                  <span className="text-5xl font-extrabold tracking-tight text-slate-900">
                    ${total}
                  </span>
                  <span className="text-lg font-medium text-slate-500">/mo</span>
                </div>
                <p className="mt-1 text-xs text-slate-500">
                  ${PRICE_PER_BUSINESS}/mo × {quantity} Google Business{" "}
                  {quantity === 1 ? "Profile" : "Profiles"}
                </p>
              </div>
              <span className="rounded-md bg-emerald-50 px-2 py-1 text-[11px] font-semibold text-emerald-700">
                Just ${PRICE_PER_BUSINESS} each
              </span>
            </div>
          </div>

          {hasPaid && (
            <div className="mt-4 flex items-center justify-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-800">
              <Check className="h-3.5 w-3.5" strokeWidth={2.5} />
              Active — {businessSlots} business {businessSlots === 1 ? "profile" : "profiles"} unlocked
            </div>
          )}

          <div className="mt-auto pt-6">
            <Button
              type="button"
              onClick={handleCheckout}
              disabled={submitting || loading}
              className="h-12 w-full rounded-xl bg-blue-600 text-base font-bold shadow-sm hover:bg-blue-700"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Redirecting to checkout…
                </>
              ) : hasPaid ? (
                `Add ${quantity} more — $${total}/mo`
              ) : (
                `Get started — $${total}/mo`
              )}
            </Button>

            <div className="mt-4 grid grid-cols-3 gap-2 text-center">
              {[
                { icon: ShieldCheck, label: "14-day money back" },
                { icon: Zap, label: "Instant access" },
                { icon: Check, label: "Cancel anytime" },
              ].map(({ icon: Icon, label }) => (
                <div key={label} className="flex flex-col items-center gap-1">
                  <Icon className="h-4 w-4 text-emerald-600" strokeWidth={2.5} />
                  <span className="text-[10px] font-medium leading-tight text-slate-500">
                    {label}
                  </span>
                </div>
              ))}
            </div>
            <p className="mt-3 text-center text-[11px] leading-relaxed text-slate-400">
              No long-term contract. One payment unlocks {quantity}{" "}
              {quantity === 1 ? "business profile" : "business profiles"}.
            </p>
          </div>
        </div>

        {/* Right — full feature list */}
        <div className="bg-gradient-to-br from-indigo-50/60 via-white to-white p-6 sm:p-8">
          <p className="text-sm font-bold text-slate-900">Everything included</p>
          <p className="mt-0.5 text-xs text-slate-500">
            One plan, the complete local SEO toolkit — no add-ons, no upsells.
          </p>
          <ul className="mt-5 space-y-2.5">
            {PLAN_FEATURES.map((feature) => (
              <li key={feature} className="flex items-start gap-2.5 text-sm text-slate-700">
                <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-emerald-100">
                  <Check className="h-3 w-3 text-emerald-600" strokeWidth={3} />
                </span>
                <span>{feature}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

export function PricingSection() {
  return (
    <section className="space-y-10">
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

      <ProPlanCard />

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
    </section>
  );
}
