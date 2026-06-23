import { GoogleGenAI } from "@google/genai";
import type { LocalBusiness } from "@/types";

function getAi() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY is not configured");
  return new GoogleGenAI({ apiKey });
}

export interface AuditInput {
  businessName: string;
  keyword: string;
  location: string;
  targetBusiness?: LocalBusiness;
  competitors: LocalBusiness[];
}

export interface AuditResult {
  analysis: string;
  score: number;
  recommendations: string[];
}

export async function generateSeoAudit(input: AuditInput): Promise<AuditResult> {
  const competitorSummary = input.competitors
    .slice(0, 10)
    .map(
      (c, i) =>
        `${i + 1}. ${c.title ?? "Unknown"} — Rating: ${c.rating ?? "N/A"} (${c.reviews ?? 0} reviews), Address: ${c.address ?? "N/A"}, Website: ${c.website ?? "None"}`
    )
    .join("\n");

  const targetSummary = input.targetBusiness
    ? `Target Business: ${input.targetBusiness.title}
Rating: ${input.targetBusiness.rating ?? "N/A"} (${input.targetBusiness.reviews ?? 0} reviews)
Address: ${input.targetBusiness.address ?? "N/A"}
Website: ${input.targetBusiness.website ?? "None"}
Position in local pack: ${input.targetBusiness.position ?? "Not ranked in top results"}`
    : `Target Business: ${input.businessName} (not found in top local results)`;

  const prompt = `You are an expert local SEO consultant. Analyze the following Google Maps local search data and provide actionable recommendations.

Search Keyword: "${input.keyword}"
Location: "${input.location}"

${targetSummary}

Top Competitors in Local Pack:
${competitorSummary || "No competitor data available."}

Respond with valid JSON only (no markdown fences) in this exact structure:
{
  "score": <number 0-100 representing local SEO health>,
  "analysis": "<2-3 paragraph detailed analysis of current local SEO position, strengths, weaknesses>",
  "recommendations": ["<specific actionable recommendation 1>", "<recommendation 2>", "<recommendation 3>", "<recommendation 4>", "<recommendation 5>"]
}

Focus on: Google Business Profile optimization, review strategy, NAP consistency, local citations, keyword targeting, competitor gaps, and content opportunities.`;

  const response = await getAi().models.generateContent({
    model: "gemini-3.5-flash",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
    },
  });

  const text = response.text ?? "{}";
  const parsed = JSON.parse(text) as AuditResult;

  return {
    analysis: parsed.analysis ?? "Analysis unavailable.",
    score: Math.min(100, Math.max(0, Number(parsed.score) || 50)),
    recommendations: Array.isArray(parsed.recommendations)
      ? parsed.recommendations
      : [],
  };
}

export async function generateKeywordSuggestions(
  businessType: string,
  location: string
): Promise<string[]> {
  const prompt = `Generate 8 high-intent local SEO keywords for a "${businessType}" business in "${location}". Return JSON only: { "keywords": ["keyword1", "keyword2", ...] }`;

  const response = await getAi().models.generateContent({
    model: "gemini-3.5-flash",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
    },
  });

  const text = response.text ?? "{}";
  const parsed = JSON.parse(text) as { keywords?: string[] };
  return parsed.keywords ?? [];
}

export async function generateStrategistAnswer(question: string): Promise<string> {
  const prompt = `You are Blazly AI, an expert local SEO strategist assistant. Answer this user question with specific, actionable local SEO advice. Be concise but thorough (2-4 paragraphs).

User question: ${question}

Context: The user runs a local business (e.g. dental clinic in Brooklyn). They track GBP, citations, reviews, rankings, and competitors.`;

  const response = await getAi().models.generateContent({
    model: "gemini-3.5-flash",
    contents: prompt,
  });

  return response.text ?? "Unable to generate a response. Please try again.";
}

export async function generateReviewReply(
  review: string,
  tone: string,
  options?: {
    rating?: number;
    regenerate?: boolean;
    previousReply?: string;
  }
): Promise<string> {
  const reviewContext = review.trim()
    ? `Review: "${review}"`
    : `This is a ${options?.rating ?? 5}-star Google review with no written comment.`;

  const variation =
    options?.regenerate && options?.previousReply
      ? `\n\nWrite a clearly DIFFERENT reply from this previous version. Use a different opening, structure, and wording. Do not repeat sentences:\n"${options.previousReply}"`
      : options?.regenerate
        ? "\n\nProvide a fresh alternative wording with a different opening and phrasing."
        : "";

  const prompt = `Write a professional, warm reply to this ${tone.toLowerCase()} for a local business. Keep it under 100 words. Do not use placeholders.

${reviewContext}${variation}`;

  const response = await getAi().models.generateContent({
    model: "gemini-3.5-flash",
    contents: prompt,
    config: {
      temperature: options?.regenerate ? 0.95 : 0.7,
    },
  });

  return response.text?.trim() ?? "Thank you for your feedback!";
}

export async function generateAnalyticsInsights(
  businessName: string,
  reportSummary: string
): Promise<{
  strengths: { text: string; priority: "high" | "medium" | "low" }[];
  weaknesses: { text: string; priority: "high" | "medium" | "low" }[];
  recommendations: { text: string; priority: "high" | "medium" | "low" }[];
}> {
  const prompt = `You are a local SEO analytics expert. Analyze this 30-day business analytics snapshot for "${businessName}" and return JSON only.

${reportSummary}

Return this exact JSON shape:
{
  "strengths": [{ "text": "...", "priority": "high|medium|low" }],
  "weaknesses": [{ "text": "...", "priority": "high|medium|low" }],
  "recommendations": [{ "text": "...", "priority": "high|medium|low" }]
}

Provide 3-5 items per section. Focus on: business hours, reviews, customer engagement, peak-time promotions, GBP visibility, and competitor gaps. Be specific and actionable.`;

  const response = await getAi().models.generateContent({
    model: "gemini-3.5-flash",
    contents: prompt,
    config: { responseMimeType: "application/json" },
  });

  const parsed = JSON.parse(response.text ?? "{}") as {
    strengths?: { text: string; priority: string }[];
    weaknesses?: { text: string; priority: string }[];
    recommendations?: { text: string; priority: string }[];
  };

  const normalize = (items?: { text: string; priority: string }[]) =>
    (items ?? []).map((item) => ({
      text: item.text,
      priority: (["high", "medium", "low"].includes(item.priority)
        ? item.priority
        : "medium") as "high" | "medium" | "low",
    }));

  return {
    strengths: normalize(parsed.strengths),
    weaknesses: normalize(parsed.weaknesses),
    recommendations: normalize(parsed.recommendations),
  };
}

export interface ProfileEnhancementInput {
  snapshot: {
    name: string;
    address: string;
    phone: string;
    website: string;
    primaryCategory: string;
    additionalCategories: string[];
    hoursSummary: string;
    reviewsCount: number;
    averageRating: number;
    description: string;
    photosCount: number;
    services: string[];
    attributes: string[];
  };
  fieldAudit: Array<{
    field: string;
    label: string;
    status: string;
    value?: string;
  }>;
  scores: {
    profileCompleteness: number;
    localSeo: number;
    reputation: number;
    visibility: number;
  };
}

interface RawRecommendation {
  id?: string;
  category?: string;
  title?: string;
  description?: string;
  impact?: string;
  action?: string;
}

function normalizeImpact(impact?: string): "high" | "medium" | "low" {
  const v = impact?.toLowerCase();
  if (v === "high" || v === "high impact") return "high";
  if (v === "low" || v === "low impact") return "low";
  return "medium";
}

function mapRecommendations(
  items: RawRecommendation[] | undefined,
  prefix: string
) {
  return (items ?? []).map((r, i) => ({
    id: r.id ?? `${prefix}-${i}`,
    category: r.category ?? prefix,
    title: r.title ?? "Recommendation",
    description: r.description ?? "",
    impact: normalizeImpact(r.impact),
    action: r.action,
  }));
}

export async function generateProfileEnhancement(
  input: ProfileEnhancementInput
): Promise<import("@/types/firestore").ProfileEnhancement> {
  const { snapshot, fieldAudit, scores } = input;

  const missingFields = fieldAudit
    .filter((f) => f.status !== "complete")
    .map((f) => `${f.label} (${f.status})`)
    .join(", ");

  const prompt = `You are an expert Google Business Profile (GBP) and local SEO consultant.

Analyze this business profile and generate optimization recommendations.

Business: ${snapshot.name}
Address: ${snapshot.address}
Phone: ${snapshot.phone || "MISSING"}
Website: ${snapshot.website || "MISSING"}
Primary category: ${snapshot.primaryCategory || "MISSING"}
Additional categories: ${snapshot.additionalCategories.join(", ") || "NONE"}
Hours: ${snapshot.hoursSummary || "MISSING"}
Reviews: ${snapshot.reviewsCount} (${snapshot.averageRating}★ average)
Description (${snapshot.description.length} chars): ${snapshot.description || "MISSING"}
Photos: ${snapshot.photosCount}
Services listed: ${snapshot.services.join(", ") || "NONE"}
Attributes: ${snapshot.attributes.join(", ") || "NONE"}

Scores — Completeness: ${scores.profileCompleteness}, Local SEO: ${scores.localSeo}, Reputation: ${scores.reputation}, Visibility: ${scores.visibility}
Missing/incomplete fields: ${missingFields || "None"}

Respond with valid JSON only (no markdown). Structure:
{
  "optimizedDescription": "<SEO-optimized GBP description, 500-750 characters, MAX 750. Front-load key services and location in the first 250 characters before Read more>",
  "sections": {
    "businessInformation": [{ "title": "", "description": "", "impact": "high|medium|low", "action": "" }],
    "businessDescription": [{ "title": "", "description": "", "impact": "high|medium|low", "action": "" }],
    "reviewsOptimization": [{ "title": "", "description": "", "impact": "high|medium|low", "action": "" }],
    "photosOptimization": [{ "title": "", "description": "", "impact": "high|medium|low", "action": "" }],
    "servicesOptimization": [{ "title": "", "description": "", "impact": "high|medium|low", "action": "" }],
    "gbpOptimization": [{ "title": "", "description": "", "impact": "high|medium|low", "action": "" }]
  },
  "actionPlan": {
    "quickWins": ["<action doable today>"],
    "shortTerm": ["<1-2 week improvement>"],
    "longTerm": ["<1-3 month improvement>"]
  }
}

Provide 2-4 items per section. Classify impact accurately. Be specific to this business.

GBP description rules for optimizedDescription and businessDescription suggestions:
- Hard maximum: 750 characters
- Recommended length: 500-750 characters
- First ~250 characters appear before "Read more" — prioritize hook, services, and city/area there
- Include at least one businessDescription suggestion about character limits and above-the-fold copy`;

  const response = await getAi().models.generateContent({
    model: "gemini-3.5-flash",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
    },
  });

  const text = response.text ?? "{}";
  const parsed = JSON.parse(text) as {
    optimizedDescription?: string;
    sections?: Record<string, RawRecommendation[]>;
    actionPlan?: {
      quickWins?: string[];
      shortTerm?: string[];
      longTerm?: string[];
    };
  };

  const sections = {
    businessInformation: mapRecommendations(
      parsed.sections?.businessInformation,
      "businessInformation"
    ),
    businessDescription: mapRecommendations(
      parsed.sections?.businessDescription,
      "businessDescription"
    ),
    reviewsOptimization: mapRecommendations(
      parsed.sections?.reviewsOptimization,
      "reviewsOptimization"
    ),
    photosOptimization: mapRecommendations(
      parsed.sections?.photosOptimization,
      "photosOptimization"
    ),
    servicesOptimization: mapRecommendations(
      parsed.sections?.servicesOptimization,
      "servicesOptimization"
    ),
    gbpOptimization: mapRecommendations(
      parsed.sections?.gbpOptimization,
      "gbpOptimization"
    ),
  };

  const recommendations = [
    ...sections.businessInformation,
    ...sections.businessDescription,
    ...sections.reviewsOptimization,
    ...sections.photosOptimization,
    ...sections.servicesOptimization,
    ...sections.gbpOptimization,
  ];

  let optimizedDescription = parsed.optimizedDescription?.trim();
  if (optimizedDescription && optimizedDescription.length > 750) {
    optimizedDescription = optimizedDescription.slice(0, 750).trimEnd();
  }

  return {
    generatedAt: new Date().toISOString(),
    optimizedDescription,
    recommendations,
    sections,
    actionPlan: {
      quickWins: parsed.actionPlan?.quickWins ?? [],
      shortTerm: parsed.actionPlan?.shortTerm ?? [],
      longTerm: parsed.actionPlan?.longTerm ?? [],
    },
  };
}
