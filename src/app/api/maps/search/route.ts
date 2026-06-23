import { NextRequest, NextResponse } from "next/server";
import { searchGoogleMaps, geocodeLocation } from "@/lib/searchapi";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { q, location, ll, hl, gl, page } = body as {
      q: string;
      location?: string;
      ll?: string;
      hl?: string;
      gl?: string;
      page?: number;
    };

    if (!q?.trim()) {
      return NextResponse.json(
        { error: "Search query is required" },
        { status: 400 }
      );
    }

    let coordinates = ll;
    if (!coordinates && location?.trim()) {
      coordinates = (await geocodeLocation(location)) ?? undefined;
    }

    const results = await searchGoogleMaps({
      q: q.trim(),
      ll: coordinates,
      hl,
      gl,
      page,
    });

    return NextResponse.json(results);
  } catch (error) {
    console.error("Maps search error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to search Google Maps",
      },
      { status: 500 }
    );
  }
}
