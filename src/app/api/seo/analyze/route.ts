import { NextRequest, NextResponse } from "next/server";
import { runBusinessAnalysis } from "@/lib/seo/build-analysis";

export const maxDuration = 120;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, businessName, website, category, location, phone, mapsPlaceId, searchRegion } = body as {
      userId: string;
      businessName: string;
      website?: string;
      category?: string;
      location?: string;
      phone?: string;
      mapsPlaceId?: string;
      searchRegion?: string;
    };

    if (!userId?.trim()) {
      return NextResponse.json({ error: "userId is required" }, { status: 400 });
    }
    if (!businessName?.trim()) {
      return NextResponse.json(
        { error: "businessName is required" },
        { status: 400 }
      );
    }

    const result = await runBusinessAnalysis({
      userId,
      businessName: businessName.trim(),
      website: website?.trim(),
      category: category?.trim(),
      location: location?.trim(),
      phone: phone?.trim(),
      mapsPlaceId: mapsPlaceId?.trim(),
      searchRegion: searchRegion?.trim(),
    });

    return NextResponse.json({
      business: result.business,
      dashboard: result.dashboard,
      rankings: result.rankings,
      reviews: result.reviews,
      profileOptimization: result.profileOptimization,
      foundListing: Boolean(result.listing),
    });
  } catch (error) {
    console.error("SEO analysis error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to analyze business",
      },
      { status: 500 }
    );
  }
}
