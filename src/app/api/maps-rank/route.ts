import { NextRequest, NextResponse } from "next/server";
import { lookupGoogleMapsRank } from "@/lib/seo/google-maps-rank";
import { regionGl } from "@/lib/seo/search-regions";

export const maxDuration = 60;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { keyword, location, businessName, placeId, searchRegion } = body as {
      keyword?: string;
      location?: string;
      businessName?: string;
      placeId?: string;
      searchRegion?: string;
    };

    if (!keyword?.trim() || !location?.trim() || !businessName?.trim()) {
      return NextResponse.json(
        { error: "keyword, location, and businessName are required" },
        { status: 400 }
      );
    }

    const result = await lookupGoogleMapsRank({
      keyword: keyword.trim(),
      location: location.trim(),
      businessName: businessName.trim(),
      placeId: placeId?.trim(),
      gl: regionGl(searchRegion),
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Maps rank lookup error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Maps rank lookup failed" },
      { status: 500 }
    );
  }
}
