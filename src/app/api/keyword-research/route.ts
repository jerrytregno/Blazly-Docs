import { NextRequest, NextResponse } from "next/server";
import {
  getBusiness,
  getDashboard,
  getKeywordResearch,
  getProfileOptimization,
  getRankings,
  updateKeywordResearch,
} from "@/lib/firestore/collections";
import { buildKeywordResearchReport } from "@/lib/keyword-research/build-report";
import { getRankSearchCooldownState } from "@/lib/seo/analysis-cooldown";
import { resolveSearchLocation } from "@/lib/seo/analysis-location";
import { regionGl, resolveSearchRegionId } from "@/lib/seo/search-regions";

export const maxDuration = 120;

export async function GET(request: NextRequest) {
  try {
    const userId = request.nextUrl.searchParams.get("userId");
    if (!userId?.trim()) {
      return NextResponse.json({ error: "userId is required" }, { status: 400 });
    }
    const doc = await getKeywordResearch(userId.trim());
    return NextResponse.json(doc);
  } catch (error) {
    console.error("Keyword research GET error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to load" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      userId,
      category,
      location,
      competitorPlaceId,
      includeStrategy,
    } = body as {
      userId: string;
      category?: string;
      location?: string;
      competitorPlaceId?: string;
      includeStrategy?: boolean;
    };

    if (!userId?.trim()) {
      return NextResponse.json({ error: "userId is required" }, { status: 400 });
    }

    const uid = userId.trim();
    const existing = await getKeywordResearch(uid);
    const isCompetitorOnly = Boolean(competitorPlaceId?.trim());

    if (!isCompetitorOnly) {
      const cooldown = getRankSearchCooldownState(existing.analyzedAt);
      if (!cooldown.canRun) {
        return NextResponse.json({ error: cooldown.message }, { status: 429 });
      }
    }

    const [business, dashboard, profileOptimization, rankings] = await Promise.all([
      getBusiness(uid),
      getDashboard(uid),
      getProfileOptimization(uid),
      getRankings(uid),
    ]);

    const searchCategory = category?.trim() || business.primaryCategory || "Local business";
    const searchLocation =
      location?.trim() ||
      business.city?.trim() ||
      resolveSearchLocation(business) ||
      business.address?.trim() ||
      "";

    const gl = regionGl(
      resolveSearchRegionId(dashboard.searchRegion, business.country)
    );

    const report = await buildKeywordResearchReport({
      business,
      category: searchCategory,
      location: searchLocation,
      gl,
      competitorPlaceId,
      includeStrategy: Boolean(includeStrategy),
      profileCompleteness: profileOptimization.scores?.profileCompleteness,
      rankTrackerSeed: rankings.rankTrackerSeed,
      preferAnalysisCache: !isCompetitorOnly,
    });

    const payload = {
      report,
      analyzedAt: isCompetitorOnly ? existing.analyzedAt : new Date().toISOString(),
      error: null,
    };

    await updateKeywordResearch(uid, payload);

    return NextResponse.json({ userId: uid, ...payload });
  } catch (error) {
    console.error("Keyword research POST error:", error);
    const message =
      error instanceof Error ? error.message : "Failed to run rank tracker search";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
