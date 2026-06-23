import { GoogleGenAI } from "@google/genai";
import type {
  CompetitorDeepDive,
  KeywordOpportunity,
  KeywordResearchListing,
  KeywordResearchStrategy,
} from "@/types/firestore";

function getAi() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY is not configured");
  return new GoogleGenAI({ apiKey });
}

function clamp(n: number, min = 0, max = 100) {
  return Math.round(Math.max(min, Math.min(max, n)));
}

function estimateVolume(keyword: string): number {
  const words = keyword.split(/\s+/).length;
  if (words <= 2) return 1200 + keyword.length * 12;
  if (words <= 4) return 450 + keyword.length * 8;
  return 120 + keyword.length * 5;
}

export async function generateKeywordOpportunities(input: {
  category: string;
  location: string;
  businessName: string;
}): Promise<KeywordOpportunity[]> {
  const place = input.location.trim() || "your area";

  const prompt = `You are a local SEO keyword researcher. Generate local keyword opportunities for a ${input.category} business "${input.businessName}" in ${place}.

Return JSON only:
{
  "keywords": [
    {
      "keyword": "string",
      "tier": "primary|secondary|long-tail",
      "searchVolume": number 100-5000,
      "competitionScore": number 0-100,
      "difficulty": number 0-100
    }
  ]
}

Provide exactly:
- 3 primary keywords (category + city style)
- 4 secondary keywords (services + city)
- 4 long-tail keywords (conversational local intent)

Use realistic local search volumes. difficulty = how hard to rank in Google Maps (higher = harder).`;

  const response = await getAi().models.generateContent({
    model: "gemini-3.5-flash",
    contents: prompt,
    config: { responseMimeType: "application/json" },
  });

  const parsed = JSON.parse(response.text ?? "{}") as {
    keywords?: Array<{
      keyword?: string;
      tier?: string;
      searchVolume?: number;
      competitionScore?: number;
      difficulty?: number;
    }>;
  };

  return (parsed.keywords ?? []).map((k, i) => ({
    keyword: k.keyword ?? `${input.category} ${place}`,
    tier: (["primary", "secondary", "long-tail"].includes(k.tier ?? "")
      ? k.tier
      : i < 3
        ? "primary"
        : i < 7
          ? "secondary"
          : "long-tail") as KeywordOpportunity["tier"],
    searchVolume: clamp(k.searchVolume ?? estimateVolume(k.keyword ?? ""), 50, 5000),
    competitionScore: clamp(k.competitionScore ?? 55, 0, 100),
    difficulty: clamp(k.difficulty ?? 50, 0, 100),
  }));
}

export async function generateRankingStrategy(input: {
  businessName: string;
  category: string;
  location: string;
  yourPosition?: number;
  listings: KeywordResearchListing[];
  competitorDetail?: CompetitorDeepDive;
  scores: { overall: number; localRanking: number; review: number };
}): Promise<KeywordResearchStrategy> {
  const you = input.listings.find((l) => l.isYou);
  const top = input.listings.find((l) => l.position === 1);
  const place = input.location.trim() || "your area";

  const prompt = `You are a local SEO strategist. Create an action plan to improve Google Maps rankings.

Business: ${input.businessName}
Category: ${input.category}
Location: ${place}
Your Maps position: ${input.yourPosition ? `#${input.yourPosition}` : "Not in top 10"}
Your rating/reviews: ${you?.rating ?? 0}★ / ${you?.reviews ?? 0} reviews
Top competitor: ${top?.name ?? "Unknown"} — ${top?.rating ?? 0}★ / ${top?.reviews ?? 0} reviews
Visibility scores — overall: ${input.scores.overall}, ranking: ${input.scores.localRanking}, reviews: ${input.scores.review}
${input.competitorDetail ? `Why competitor ranks higher: ${input.competitorDetail.whyTheyRankHigher.join("; ")}` : ""}

Return JSON only:
{
  "highPriority": ["actionable task 1", "..."],
  "mediumPriority": ["..."],
  "lowPriority": ["..."]
}

Provide 4-5 high priority, 3-4 medium, 2-3 low. Be specific with numbers (reviews, photos, posts). Focus on Google Business Profile, reviews, photos, categories, citations.`;

  const response = await getAi().models.generateContent({
    model: "gemini-3.5-flash",
    contents: prompt,
    config: { responseMimeType: "application/json" },
  });

  const parsed = JSON.parse(response.text ?? "{}") as {
    highPriority?: string[];
    mediumPriority?: string[];
    lowPriority?: string[];
  };

  return {
    generatedAt: new Date().toISOString(),
    highPriority: parsed.highPriority ?? ["Get more Google reviews from happy customers"],
    mediumPriority: parsed.mediumPriority ?? ["Post weekly GBP updates"],
    lowPriority: parsed.lowPriority ?? ["Add secondary categories"],
  };
}
