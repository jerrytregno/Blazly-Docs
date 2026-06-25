"use client";

import Link from "next/link";
import {
  ChevronRight,
  ClipboardCheck,
  ImageIcon,
  Lock,
  MessageSquareHeart,
  Radar,
  BarChart3,
  TrendingUp,
} from "lucide-react";
import { useUpgradeModal } from "@/components/billing/upgrade-modal-provider";
import { usePlan } from "@/components/providers/plan-provider";
import type { DashboardDoc, ProfileOptimizationDoc, RankingsDoc, ReviewsDoc } from "@/types/firestore";

interface ToolItem {
  title: string;
  description: string;
  href: string;
  icon: React.ElementType;
  requiresPro?: boolean;
  metric?: string;
  metricLabel?: string;
  detail?: string;
}

export function FeatureHighlightsRow({
  rankings,
  reviews,
  profileOptimization,
}: {
  dashboard: DashboardDoc;
  rankings: RankingsDoc | null;
  reviews: ReviewsDoc | null;
  business?: unknown;
  profileOptimization?: ProfileOptimizationDoc | null;
}) {
  const { isPro } = usePlan();
  const { openUpgradeModal } = useUpgradeModal();
  const pendingReplies = reviews?.inbox.filter((r) => !r.replied).length ?? 0;
  const competition = rankings?.competitionAnalysis;
  const profileScore = profileOptimization?.scores.profileCompleteness;

  const tools: ToolItem[] = [
    {
      title: "Profile Optimization",
      description:
        "Audit your Google Business Profile with a Maps link, see completion score, and get AI enhancement tips.",
      href: "/dashboard/profile-optimization",
      icon: ClipboardCheck,
      metric: profileScore !== undefined && profileScore > 0 ? `${profileScore}%` : undefined,
      metricLabel: "profile score",
    },
    {
      title: "Competitor Analysis",
      description:
        "See if your category and location is low, medium, or high competition on Google Maps.",
      href: "/dashboard/competitor-analysis",
      icon: Radar,
      metric: competition?.levelLabel,
      metricLabel: "competition level",
      detail: competition
        ? `${competition.category} · ${competition.location} · ${competition.competitorCount} competitors`
        : undefined,
    },
    {
      title: "Rank Tracker",
      description:
        "Discover local keywords, track Google Maps rankings, and get AI strategy recommendations.",
      href: "/dashboard/rank-tracker",
      icon: TrendingUp,
      requiresPro: true,
    },
    {
      title: "Review Management",
      description:
        "Fetch Google reviews, see star ratings, and generate AI replies for unanswered reviews.",
      href: "/dashboard/review-management",
      icon: MessageSquareHeart,
      requiresPro: true,
      metric: pendingReplies ? String(pendingReplies) : "0",
      metricLabel: "unanswered reviews",
    },
    {
      title: "Enhance Images",
      description:
        "Upload GBP photos, check compliance, and AI-enhance lighting, clarity, and color.",
      href: "/dashboard/enhance-images",
      icon: ImageIcon,
      requiresPro: true,
    },
    {
      title: "Analytics",
      description:
        "30-day GBP traffic, reviews, footfall, hours comparison, and AI-powered competitor insights.",
      href: "/dashboard/analytics",
      icon: BarChart3,
      requiresPro: true,
      metric: rankings?.competitionAnalysis?.topCompetitor?.name
        ? "vs " + rankings.competitionAnalysis.topCompetitor.name.slice(0, 12)
        : undefined,
      metricLabel: "competitor benchmark",
    },
  ];

  const rowClass = "blazly-feature-row group";

  return (
    <section>
      <div className="mb-6">
        <h2 className="text-2xl font-bold tracking-tight text-slate-900">Your tools</h2>
        <p className="mt-2 text-base text-slate-500">
          Profile optimization, competitor insights, review management, image enhancement, and analytics.
        </p>
      </div>

      <div className="space-y-3">
        {tools.map((tool, index) => {
          const locked = tool.requiresPro && !isPro;
          const content = (
            <>
              <div className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-indigo-600 transition-colors group-hover:border-indigo-200 group-hover:bg-indigo-50">
                <tool.icon className="h-5 w-5" />
                {locked && (
                  <span className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full border border-white bg-slate-100 text-slate-500 shadow-sm">
                    <Lock className="h-3 w-3" aria-hidden />
                  </span>
                )}
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-semibold text-slate-900 group-hover:text-indigo-700">
                    {tool.title}
                  </h3>
                  {locked && (
                    <Lock className="hidden h-4 w-4 shrink-0 text-slate-400 sm:block" aria-hidden />
                  )}
                </div>
                <p className="mt-0.5 text-sm leading-relaxed text-slate-500">{tool.description}</p>
                {tool.detail && (
                  <p className="mt-2 text-sm text-slate-400">
                    <span className="font-medium text-slate-700">{tool.detail}</span>
                  </p>
                )}
              </div>

              {tool.metric && (
                <div className="hidden shrink-0 text-right sm:block">
                  <p className="text-2xl font-bold text-indigo-600">{tool.metric}</p>
                  <p className="text-xs font-medium capitalize text-slate-400">{tool.metricLabel}</p>
                </div>
              )}

              <ChevronRight className="h-5 w-5 shrink-0 text-slate-300 transition-transform group-hover:translate-x-0.5 group-hover:text-indigo-500" />
            </>
          );

          if (locked) {
            return (
              <button
                key={tool.href}
                type="button"
                onClick={() => openUpgradeModal(tool.title)}
                className={`${rowClass} w-full text-left ${index === 0 ? "blazly-feature-row-hero" : ""}`}
              >
                {content}
              </button>
            );
          }

          return (
            <Link
              key={tool.href}
              href={tool.href}
              className={`${rowClass} ${index === 0 ? "blazly-feature-row-hero" : ""}`}
            >
              {content}
            </Link>
          );
        })}
      </div>
    </section>
  );
}
