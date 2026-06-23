import { GoogleGenAI } from "@google/genai";
import type { AnalyticsPopularHour } from "@/types/firestore";

const HOUR_LABELS = [
  "6 AM",
  "7 AM",
  "8 AM",
  "9 AM",
  "10 AM",
  "11 AM",
  "12 PM",
  "1 PM",
  "2 PM",
  "3 PM",
  "4 PM",
  "5 PM",
  "6 PM",
  "7 PM",
  "8 PM",
  "9 PM",
  "10 PM",
];

export interface CategoryPopularTimesInput {
  businessName: string;
  primaryCategory: string;
  additionalCategories?: string[];
  location?: string;
  weeklyHours?: { day: string; hours: string }[];
  competitorName: string;
  competitorWeeklyHours?: { day: string; hours: string }[];
}

export interface CategoryPopularTimes {
  user: AnalyticsPopularHour[];
  competitor: AnalyticsPopularHour[];
  userCategoryLabel?: string;
  competitorCategoryLabel?: string;
}

function getAi() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY is not configured");
  return new GoogleGenAI({ apiKey });
}

function formatHoursSummary(hours?: { day: string; hours: string }[]): string {
  if (!hours?.length) return "Not specified — infer typical hours for this category";
  return hours.map((h) => `${h.day}: ${h.hours}`).join("; ");
}

function visitorsToLevel(visitors: number): AnalyticsPopularHour["level"] {
  if (visitors >= 85) return "very-high";
  if (visitors >= 65) return "high";
  if (visitors >= 40) return "medium";
  if (visitors >= 20) return "low";
  return "very-low";
}

function slotsToPopularHours(
  slots: { hour: number; visitors: number }[]
): AnalyticsPopularHour[] {
  const byHour = new Map(
    slots.map((s) => [s.hour, Math.max(0, Math.min(100, Math.round(s.visitors)))])
  );

  return Array.from({ length: 17 }, (_, i) => {
    const hour = 6 + i;
    const visitors = byHour.get(hour) ?? (hour <= 7 || hour >= 21 ? 8 : 15);
    return {
      hour,
      label: HOUR_LABELS[i],
      visitors,
      level: visitorsToLevel(visitors),
    };
  });
}

export async function generateCategoryPopularTimes(
  input: CategoryPopularTimesInput
): Promise<CategoryPopularTimes> {
  const categories = [input.primaryCategory, ...(input.additionalCategories ?? [])]
    .filter(Boolean)
    .join(", ");

  const prompt = `You are a local business footfall analyst modeling Google Maps "Popular times" charts.

Estimate typical weekday hourly busyness (relative 0–100 scale) for these two businesses in the same local market.

User business:
- Name: ${input.businessName}
- Categories: ${categories || "Local business"}
- Location: ${input.location || "Unknown"}
- Hours: ${formatHoursSummary(input.weeklyHours)}

Competitor:
- Name: ${input.competitorName}
- Hours: ${formatHoursSummary(input.competitorWeeklyHours)}

Rules:
1. First infer the true customer-facing business type from name + categories (e.g. "Bar", "Restaurant", "Retail store", "Dental clinic", "Hair salon", "Gym", "Hotel").
2. Shape hourly patterns to match that type:
   - Bars / pubs / nightclubs: low morning, rising afternoon, peak 7–10 PM
   - Restaurants / cafes: lunch peak 11 AM–1 PM, dinner peak 6–8 PM
   - Retail / shopping: gradual rise from 10 AM, peak 2–5 PM
   - Medical / dental / professional: weekday morning–midday peaks 9 AM–12 PM
   - Salons / spas: late morning through afternoon
   - Gyms: early morning 6–8 AM and evening 5–8 PM
   - Hotels / lodging: check-in afternoon 3–6 PM
3. Use very low values (5–15) for hours when the business is likely closed per their hours.
4. Competitor should follow a similar pattern but with slightly different peak intensity (±5–15 visitors).
5. Return exactly 17 hourly points for each business: hours 6 through 22 (6 AM to 10 PM).

Return JSON only:
{
  "userCategoryLabel": "Bar",
  "competitorCategoryLabel": "Bar",
  "user": [{ "hour": 6, "visitors": 10 }, { "hour": 7, "visitors": 12 }, ...through hour 22],
  "competitor": [{ "hour": 6, "visitors": 8 }, ...through hour 22]
}`;

  const response = await getAi().models.generateContent({
    model: "gemini-3.5-flash",
    contents: prompt,
    config: { responseMimeType: "application/json" },
  });

  const parsed = JSON.parse(response.text ?? "{}") as {
    userCategoryLabel?: string;
    competitorCategoryLabel?: string;
    user?: { hour: number; visitors: number }[];
    competitor?: { hour: number; visitors: number }[];
  };

  if (!parsed.user?.length || !parsed.competitor?.length) {
    throw new Error("Gemini returned incomplete popular times data");
  }

  return {
    user: slotsToPopularHours(parsed.user),
    competitor: slotsToPopularHours(parsed.competitor),
    userCategoryLabel: parsed.userCategoryLabel,
    competitorCategoryLabel: parsed.competitorCategoryLabel,
  };
}
