import { NextRequest, NextResponse } from "next/server";
import {
  getBusiness,
  getKeywordResearch,
  updateKeywordResearch,
} from "@/lib/firestore/collections";
import { generateRankingStrategy } from "@/lib/keyword-research/gemini-keyword-research";

export const maxDuration = 60;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId } = body as { userId: string };

    if (!userId?.trim()) {
      return NextResponse.json({ error: "userId is required" }, { status: 400 });
    }

    const uid = userId.trim();
    const [business, existing] = await Promise.all([
      getBusiness(uid),
      getKeywordResearch(uid),
    ]);

    const report = existing.report;
    if (!report?.listings?.length) {
      return NextResponse.json(
        { error: "Run keyword research search first." },
        { status: 400 }
      );
    }

    const strategy = await generateRankingStrategy({
      businessName: business.name,
      category: report.category,
      location: report.location,
      yourPosition: report.yourPosition,
      listings: report.listings,
      competitorDetail: report.competitorDetail,
      scores: report.scores,
    });

    const updatedReport = { ...report, strategy };
    await updateKeywordResearch(uid, {
      report: updatedReport,
      analyzedAt: new Date().toISOString(),
      error: null,
    });

    return NextResponse.json({ userId: uid, strategy, report: updatedReport });
  } catch (error) {
    console.error("Keyword strategy error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to generate strategy" },
      { status: 500 }
    );
  }
}
