import { NextRequest, NextResponse } from "next/server";
import {
  getAnalytics,
  getBusiness,
  updateAnalytics,
} from "@/lib/firestore/collections";
import { generateAnalyticsInsights } from "@/lib/gemini";
import { summarizeAnalyticsReport } from "@/lib/analytics/summarize";

export const maxDuration = 60;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId } = body as { userId: string };

    if (!userId?.trim()) {
      return NextResponse.json({ error: "userId is required" }, { status: 400 });
    }

    const uid = userId.trim();
    const [analytics, business] = await Promise.all([
      getAnalytics(uid),
      getBusiness(uid),
    ]);

    if (!analytics.report) {
      return NextResponse.json(
        { error: "Generate analytics report first." },
        { status: 400 }
      );
    }

    const summary = summarizeAnalyticsReport(
      analytics.report,
      business.name || "Your business"
    );

    const generated = await generateAnalyticsInsights(
      business.name || "Your business",
      summary
    );

    const aiInsights = {
      generatedAt: new Date().toISOString(),
      strengths: generated.strengths,
      weaknesses: generated.weaknesses,
      recommendations: generated.recommendations,
    };

    await updateAnalytics(uid, { aiInsights });

    return NextResponse.json({ aiInsights });
  } catch (error) {
    console.error("Analytics insights error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to generate insights",
      },
      { status: 500 }
    );
  }
}
