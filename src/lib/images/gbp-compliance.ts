import type { GbpComplianceCheck } from "@/types/image-enhance";

const MAX_BYTES = 5 * 1024 * 1024;
const MIN_DIM = 250;
const RECOMMENDED_DIM = 720;

export function checkGbpCompliance(input: {
  width: number;
  height: number;
  fileSizeBytes: number;
  format: string;
}): GbpComplianceCheck {
  const messages: string[] = [];
  const recommendations: string[] = [];

  const minSide = Math.min(input.width, input.height);
  const maxSide = Math.max(input.width, input.height);

  let resolutionStatus: GbpComplianceCheck["resolutionStatus"] = "pass";
  if (minSide < MIN_DIM) {
    resolutionStatus = "fail";
    messages.push(`Resolution too low (${input.width}×${input.height}). Minimum is 250×250.`);
    recommendations.push("Upload an image at least 250×250 pixels.");
  } else if (minSide < RECOMMENDED_DIM) {
    resolutionStatus = "warn";
    messages.push(`Below recommended size (${input.width}×${input.height}). Google recommends 720×720 or higher.`);
    recommendations.push("Resize to at least 720×720 for best GBP display quality.");
  } else {
    messages.push(`Resolution meets Google recommendations (${input.width}×${input.height}).`);
  }

  let fileSizeStatus: GbpComplianceCheck["fileSizeStatus"] = "pass";
  if (input.fileSizeBytes > MAX_BYTES) {
    fileSizeStatus = "fail";
    messages.push("File exceeds Google's 5 MB limit.");
    recommendations.push("Compress or resize the image to under 5 MB.");
  }

  const fmt = input.format.toLowerCase();
  let formatStatus: GbpComplianceCheck["formatStatus"] = "pass";
  if (fmt === "webp") {
    formatStatus = "warn";
    messages.push("WEBP is supported for upload but Google GBP prefers JPG or PNG.");
    recommendations.push("Download as optimized JPG or PNG before uploading to Google Business Profile.");
  } else if (fmt !== "jpeg" && fmt !== "jpg" && fmt !== "png") {
    formatStatus = "fail";
    messages.push(`Format "${input.format}" may not be accepted on Google Business Profile.`);
    recommendations.push("Use JPG or PNG for GBP uploads.");
  }

  const passed =
    resolutionStatus !== "fail" && fileSizeStatus !== "fail" && formatStatus !== "fail";

  if (passed && recommendations.length === 0) {
    recommendations.push("Image meets core GBP guidelines. Use AI enhance for lighting and clarity polish.");
  }

  return {
    passed,
    resolutionStatus,
    fileSizeStatus,
    formatStatus,
    messages,
    recommendations,
  };
}

export function complianceScore(compliance: GbpComplianceCheck): number {
  let score = 100;
  if (compliance.resolutionStatus === "fail") score -= 40;
  else if (compliance.resolutionStatus === "warn") score -= 15;
  if (compliance.fileSizeStatus === "fail") score -= 30;
  if (compliance.formatStatus === "fail") score -= 25;
  else if (compliance.formatStatus === "warn") score -= 10;
  return Math.max(0, score);
}
