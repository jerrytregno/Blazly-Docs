import { GoogleGenAI, Modality } from "@google/genai";
import type { ImageCategory, ImageSeoSuggestions } from "@/types/image-enhance";

const ENHANCE_PROMPT = `Enhance this business image for Google Business Profile optimization. Improve lighting, brightness, sharpness, color balance, clarity, and professionalism. Maintain natural appearance and realistic colors. Increase visual quality while preserving the original business environment, products, branding, and authenticity. Optimize for local SEO and customer engagement. Do not add fake objects, people, logos, or alter the business identity.`;

function getAi() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY is not configured");
  return new GoogleGenAI({ apiKey });
}

function imageModel() {
  return process.env.GEMINI_IMAGE_MODEL ?? "gemini-3.1-flash-image";
}

export async function enhanceBusinessImage(
  imageBase64: string,
  mimeType: string,
  customPrompt?: string
): Promise<{ imageBase64: string; mimeType: string; note?: string }> {
  const ai = getAi();
  const userInstructions = customPrompt?.trim();
  const prompt = userInstructions
    ? `${ENHANCE_PROMPT}\n\nAdditional instructions from the user: ${userInstructions}`
    : ENHANCE_PROMPT;

  const response = await ai.models.generateContent({
    model: imageModel(),
    contents: [
      { text: prompt },
      { inlineData: { mimeType, data: imageBase64 } },
    ],
    config: {
      responseModalities: [Modality.TEXT, Modality.IMAGE],
    },
  });

  let note: string | undefined;
  let outData: string | undefined;
  let outMime = "image/png";

  const parts = response.candidates?.[0]?.content?.parts ?? [];
  for (const part of parts) {
    if (part.text) note = part.text;
    if (part.inlineData?.data) {
      outData =
        typeof part.inlineData.data === "string"
          ? part.inlineData.data
          : Buffer.from(part.inlineData.data).toString("base64");
      outMime = part.inlineData.mimeType ?? "image/png";
    }
  }

  if (!outData) {
    throw new Error(
      "No enhanced image returned. Ensure GEMINI_IMAGE_MODEL supports image output (e.g. gemini-2.5-flash-image)."
    );
  }

  return { imageBase64: outData, mimeType: outMime, note };
}

export async function suggestImageSeo(input: {
  fileName: string;
  width: number;
  height: number;
  businessName?: string;
}): Promise<ImageSeoSuggestions> {
  const ai = getAi();
  const prompt = `You are a local SEO expert. Suggest Google Business Profile image metadata.

File: ${input.fileName}
Dimensions: ${input.width}x${input.height}
Business: ${input.businessName || "local business"}

Return JSON only:
{
  "filename": "seo-friendly-filename.jpg",
  "altText": "descriptive alt text under 125 chars",
  "category": "one of: Exterior, Interior, Team, Products, Services, Office, Equipment"
}`;

  const response = await ai.models.generateContent({
    model: "gemini-3.5-flash",
    contents: prompt,
    config: { responseMimeType: "application/json" },
  });

  const parsed = JSON.parse(response.text ?? "{}") as Partial<ImageSeoSuggestions>;
  const categories: ImageCategory[] = [
    "Exterior",
    "Interior",
    "Team",
    "Products",
    "Services",
    "Office",
    "Equipment",
  ];
  const category = categories.includes(parsed.category as ImageCategory)
    ? (parsed.category as ImageCategory)
    : "Exterior";

  return {
    filename: parsed.filename ?? input.fileName.replace(/\s+/g, "-").toLowerCase(),
    altText: parsed.altText ?? `Photo for ${input.businessName ?? "business"}`,
    category,
  };
}
