"use client";

import Link from "next/link";
import { ChevronRight, ClipboardCheck, ImageIcon, MessageSquareHeart, Radar, BarChart3 } from "lucide-react";
import type { DashboardDoc, ProfileOptimizationDoc, RankingsDoc, ReviewsDoc } from "@/types/firestore";

interface ToolItem {
  title: string;
  description: string;
  href: string;
  icon: React.ElementType;
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
      title: "Review Management",
      description:
        "Fetch Google reviews, see star ratings, and generate AI replies for unanswered reviews.",
      href: "/dashboard/review-management",
      icon: MessageSquareHeart,
      metric: pendingReplies ? String(pendingReplies) : "0",
      metricLabel: "unanswered reviews",
    },
    {
      title: "Enhance Images",
      description:
        "Upload GBP photos, check compliance, and AI-enhance lighting, clarity, and color.",
      href: "/dashboard/enhance-images",
      icon: ImageIcon,
    },
    {
      title: "Analytics",
      description:
        "30-day GBP traffic, reviews, footfall, hours comparison, and AI-powered competitor insights.",
      href: "/dashboard/analytics",
      icon: BarChart3,
      metric: rankings?.competitionAnalysis?.topCompetitor?.name
        ? "vs " + rankings.competitionAnalysis.topCompetitor.name.slice(0, 12)
        : undefined,
      metricLabel: "competitor benchmark",
    },
  ];

  return (
    <section>
      <div className="mb-6">
        <h2 className="text-2xl font-bold tracking-tight text-slate-900">Your tools</h2>
        <p className="mt-2 text-base text-slate-500">
          Profile optimization, competitor insights, review management, image enhancement, and analytics.
        </p>
      </div>

      <div className="space-y-3">
        {tools.map((tool, index) => (
          <Link
            key={tool.href}
            href={tool.href}
            className={`blazly-feature-row group ${index === 0 ? "blazly-feature-row-hero" : ""}`}
          >
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-indigo-600 transition-colors group-hover:border-indigo-200 group-hover:bg-indigo-50">
              <tool.icon className="h-5 w-5" />
            </div>

            <div className="min-w-0 flex-1">
              <h3 className="text-lg font-semibold text-slate-900 group-hover:text-indigo-700">
                {tool.title}
              </h3>
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
          </Link>
        ))}
      </div>
    </section>
  );
}
