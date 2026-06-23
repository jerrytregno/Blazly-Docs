import { NextRequest, NextResponse } from "next/server";
import {
  getProfileOptimization,
  updateProfileOptimization,
} from "@/lib/firestore/collections";
import { runProfileAnalysis } from "@/lib/seo/profile-optimization";

export const maxDuration = 60;

export async function GET(request: NextRequest) {
  try {
    const userId = request.nextUrl.searchParams.get("userId");
    if (!userId?.trim()) {
      return NextResponse.json({ error: "userId is required" }, { status: 400 });
    }
    const doc = await getProfileOptimization(userId.trim());
    return NextResponse.json(doc);
  } catch (error) {
    console.error("Profile GET error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to load profile" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, websiteUrl, mapsLink, gl } = body as {
      userId: string;
      websiteUrl?: string;
      mapsLink?: string;
      gl?: string;
    };

    if (!userId?.trim()) {
      return NextResponse.json({ error: "userId is required" }, { status: 400 });
    }

    if (!mapsLink?.trim()) {
      return NextResponse.json({ error: "mapsLink is required" }, { status: 400 });
    }

    const result = await runProfileAnalysis({ websiteUrl, mapsLink, gl });

    const payload = {
      ...result,
      enhancement: null,
    };

    await updateProfileOptimization(userId.trim(), payload);

    return NextResponse.json(payload);
  } catch (error) {
    console.error("Profile analyze error:", error);
    const message =
      error instanceof Error ? error.message : "Failed to analyze profile";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
