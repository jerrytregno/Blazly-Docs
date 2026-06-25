import { NextRequest, NextResponse } from "next/server";
import { runCompetitionScan } from "@/lib/seo/competition-scan";

export const maxDuration = 60;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      businessName,
      website,
      category,
      location,
      phone,
      mapsPlaceId,
      searchRegion,
    } = body as {
      businessName: string;
      website?: string;
      category?: string;
      location?: string;
      phone?: string;
      mapsPlaceId?: string;
      searchRegion?: string;
    };

    if (!businessName?.trim()) {
      return NextResponse.json({ error: "businessName is required" }, { status: 400 });
    }

    const result = await runCompetitionScan({
      businessName: businessName.trim(),
      website: website?.trim(),
      category: category?.trim(),
      location: location?.trim(),
      phone: phone?.trim(),
      mapsPlaceId: mapsPlaceId?.trim(),
      searchRegion: searchRegion?.trim(),
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Competition scan error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to scan competition",
      },
      { status: 500 }
    );
  }
}
