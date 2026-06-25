"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, ArrowRight } from "lucide-react";
import { useAuth } from "@/components/providers/auth-provider";
import { OnboardingShell } from "@/components/onboarding/onboarding-shell";
import { completeOnboarding, getUserProfile } from "@/lib/user-profile";
import { parseGoogleMapsPlaceId } from "@/lib/seo/maps-place";
import { fetchSeoAnalysis } from "@/lib/seo/client";
import {
  updateBusiness,
  updateDashboard,
  updateRankings,
  updateReviews,
} from "@/lib/firestore/collections";
import { hasActiveBusiness } from "@/lib/firestore/reset-business";
import {
  clearPendingOnboarding,
  canAccessBusinessSetup,
  isReplacingBusiness,
  isAddingBusiness,
} from "@/lib/onboarding-flow";

type Step = "form" | "analyzing" | "complete";

export default function OnboardingPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [step, setStep] = useState<Step>("form");
  const [checking, setChecking] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const replacing = isReplacingBusiness();
  const adding = isAddingBusiness();

  const [businessName, setBusinessName] = useState("");
  const [website, setWebsite] = useState("");
  const [category, setCategory] = useState("");
  const [location, setLocation] = useState("");
  const [mapsLink, setMapsLink] = useState("");

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace("/login");
      return;
    }
    Promise.all([getUserProfile(user.uid), hasActiveBusiness(user.uid)])
      .then(([profile, active]) => {
        const complete = profile?.onboardingComplete === true;
        if (!canAccessBusinessSetup(complete, active)) {
          router.replace("/dashboard");
        } else {
          setChecking(false);
        }
      })
      .catch(() => setChecking(false));
  }, [user, loading, router]);

  useEffect(() => {
    if (step !== "complete") return;
    const timer = setTimeout(() => router.replace("/dashboard"), 2500);
    return () => clearTimeout(timer);
  }, [step, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setError("");

    const trimmedMaps = mapsLink.trim();
    if (!trimmedMaps) {
      setError("Google Maps link is required.");
      return;
    }

    setSaving(true);
    try {
      const mapsPlaceId =
        parseGoogleMapsPlaceId(trimmedMaps) || trimmedMaps;
      await completeOnboarding(
        user.uid,
        {
          businessName,
          website,
          category,
          location,
          mapsPlaceId,
        },
        { isAddingBusiness: adding, isReplacingBusiness: replacing }
      );
      clearPendingOnboarding();
      setStep("analyzing");
      try {
        const result = await fetchSeoAnalysis({
          userId: user.uid,
          businessName,
          website,
          category,
          location,
          mapsPlaceId,
        });
        await Promise.all([
          updateBusiness(user.uid, result.business),
          updateDashboard(user.uid, result.dashboard),
          updateRankings(user.uid, result.rankings),
          updateReviews(user.uid, result.reviews),
        ]);
      } catch (analysisErr) {
        const message =
          analysisErr instanceof Error ? analysisErr.message : "Analysis failed";
        await updateDashboard(user.uid, {
          analysisStatus: "error",
          analysisError: message,
        }).catch(() => {});
      }
      setStep("complete");
    } catch {
      setError("Failed to save your business. Please try again.");
      setStep("form");
    } finally {
      setSaving(false);
    }
  };

  if (loading || checking) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
      </div>
    );
  }

  if (step === "analyzing") {
    return (
      <OnboardingShell
        title="Analyzing your business"
        subtitle="Fetching Google Maps data and calculating your local SEO scores..."
      >
        <div className="flex flex-col items-center py-12">
          <div className="h-12 w-12 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
          <p className="mt-6 text-sm text-[#b8a9d9]">This may take up to a minute</p>
        </div>
      </OnboardingShell>
    );
  }

  if (step === "complete") {
    return (
      <OnboardingShell
        title={replacing ? "New business ready" : "Project Setup Complete"}
        subtitle="Your dashboard is being updated with fresh local SEO metrics..."
      >
        <div className="flex flex-col items-center py-6 text-center">
          <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-500/20">
            <CheckCircle2 className="h-10 w-10 text-emerald-400" />
          </div>
          <div className="w-full space-y-2 rounded-xl border border-white/10 bg-white/5 p-4 text-left text-sm">
            <p className="font-medium text-white">{businessName}</p>
            {website ? <p className="text-[#b8a9d9]">{website}</p> : null}
            <p className="text-[#b8a9d9]">{category}</p>
            <p className="text-[#b8a9d9]">{location}</p>
          </div>
          <button
            type="button"
            onClick={() => router.replace("/dashboard")}
            className="gradient-btn mt-8 flex h-12 w-full items-center justify-center gap-2 rounded-xl text-sm font-semibold"
          >
            Go to Dashboard
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </OnboardingShell>
    );
  }

  return (
    <OnboardingShell
      title={replacing ? "Set up a new business" : "Set up your business"}
      subtitle={
        replacing
          ? "Enter your new business details. Previous data has been cleared."
          : "Tell us about your business to personalize your local SEO dashboard."
      }
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-2">
          <label htmlFor="businessName" className="text-[11px] font-semibold tracking-widest text-gray-500">
            BUSINESS NAME
          </label>
          <input
            id="businessName"
            value={businessName}
            onChange={(e) => setBusinessName(e.target.value)}
            required
            className="auth-input h-12 w-full rounded-xl px-4 text-sm"
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="mapsLink" className="text-[11px] font-semibold tracking-widest text-gray-500">
            GOOGLE MAPS LINK
          </label>
          <input
            id="mapsLink"
            value={mapsLink}
            onChange={(e) => setMapsLink(e.target.value)}
            required
            placeholder="Paste your Google Maps business URL or Place ID"
            className="auth-input h-12 w-full rounded-xl px-4 text-sm"
          />
          <p className="text-xs text-gray-400">
            Most accurate option — opens your exact GBP listing on Google Maps.
          </p>
        </div>

        <div className="space-y-2">
          <label htmlFor="category" className="text-[11px] font-semibold tracking-widest text-gray-500">
            BUSINESS CATEGORY
          </label>
          <input
            id="category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            required
            className="auth-input h-12 w-full rounded-xl px-4 text-sm"
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="location" className="text-[11px] font-semibold tracking-widest text-gray-500">
            PRIMARY LOCATION
          </label>
          <input
            id="location"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            required
            placeholder="e.g. Chennai, Tamil Nadu, India"
            className="auth-input h-12 w-full rounded-xl px-4 text-sm"
          />
          <p className="text-xs text-gray-400">
            City and country (or full address) — used to center Google Maps results.
          </p>
        </div>

        <div className="space-y-2">
          <label htmlFor="website" className="text-[11px] font-semibold tracking-widest text-gray-500">
            WEBSITE URL <span className="font-normal normal-case tracking-normal text-gray-400">(optional)</span>
          </label>
          <input
            id="website"
            value={website}
            onChange={(e) => setWebsite(e.target.value)}
            placeholder="https://yourbusiness.com"
            className="auth-input h-12 w-full rounded-xl px-4 text-sm"
          />
        </div>

        {error && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
        )}

        <button
          type="submit"
          disabled={saving}
          className="gradient-btn h-12 w-full rounded-xl text-sm font-semibold transition"
        >
          {saving ? "Setting up..." : replacing ? "Save new business" : "Complete Setup"}
        </button>
      </form>
    </OnboardingShell>
  );
}
