import { NextRequest, NextResponse } from "next/server";
import {
  getAnalytics,
  getBusiness,
  getDashboard,
  getRankings,
  getReviews,
  updateAnalytics,
} from "@/lib/firestore/collections";
import { buildAnalyticsReportFromSources } from "@/lib/analytics/build-analytics";

export const maxDuration = 120;

async function loadSources(userId: string) {
  const [business, dashboard, rankings, reviews] = await Promise.all([
    getBusiness(userId),
    getDashboard(userId),
    getRankings(userId),
    getReviews(userId),
  ]);
  return { business, dashboard, rankings, reviews };
}

function canBuildAnalytics(dashboard: Awaited<ReturnType<typeof getDashboard>>) {
  return (
    dashboard.analysisStatus === "complete" ||
    dashboard.metrics.overallScore > 0 ||
    dashboard.metrics.gbpHealth > 0
  );
}

async function buildAndStore(userId: string, periodDays: number, aiInsights: unknown) {
  const { business, dashboard, rankings, reviews } = await loadSources(userId);

  if (!canBuildAnalytics(dashboard)) {
    return null;
  }

  const report = await buildAnalyticsReportFromSources({
    business,
    dashboard,
    rankings,
    reviews,
    periodDays,
  });

  const payload = {
    report,
    analyzedAt: new Date().toISOString(),
    error: null,
  };

  await updateAnalytics(userId, payload);

  return { userId, ...payload, aiInsights };
}

export async function GET(request: NextRequest) {
  try {
    const userId = request.nextUrl.searchParams.get("userId");
    if (!userId?.trim()) {
      return NextResponse.json({ error: "userId is required" }, { status: 400 });
    }

    const uid = userId.trim();
    const existing = await getAnalytics(uid);
    const refresh = request.nextUrl.searchParams.get("refresh") !== "false";

    if (refresh) {
      const fresh = await buildAndStore(uid, 30, existing?.aiInsights ?? null);
      if (fresh) {
        return NextResponse.json(fresh);
      }
    }

    return NextResponse.json(existing ?? { userId: uid, report: null, aiInsights: null });
  } catch (error) {
    console.error("Analytics GET error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to load analytics" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, periodDays } = body as { userId: string; periodDays?: number };

    if (!userId?.trim()) {
      return NextResponse.json({ error: "userId is required" }, { status: 400 });
    }

    const uid = userId.trim();
    const existing = await getAnalytics(uid);
    const { dashboard } = await loadSources(uid);

    if (!canBuildAnalytics(dashboard)) {
      return NextResponse.json(
        { error: "Run SEO analysis first to populate analytics data." },
        { status: 400 }
      );
    }

    const result = await buildAndStore(uid, periodDays ?? 30, existing?.aiInsights ?? null);
    if (!result) {
      return NextResponse.json(
        { error: "Run SEO analysis first to populate analytics data." },
        { status: 400 }
      );
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("Analytics POST error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to build analytics" },
      { status: 500 }
    );
  }
}
