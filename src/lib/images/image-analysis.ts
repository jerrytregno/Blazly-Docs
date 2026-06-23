import type { ImageMetrics, ImageQualityScores } from "@/types/image-enhance";
import { checkGbpCompliance, complianceScore } from "./gbp-compliance";

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function loadImageFromFile(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Failed to load image"));
    };
    img.src = url;
  });
}

function analyzePixels(img: HTMLImageElement): {
  brightness: number;
  contrast: number;
  sharpness: number;
  noise: number;
} {
  const canvas = document.createElement("canvas");
  const maxSample = 256;
  const scale = Math.min(1, maxSample / Math.max(img.width, img.height));
  const w = Math.max(1, Math.round(img.width * scale));
  const h = Math.max(1, Math.round(img.height * scale));
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) return { brightness: 50, contrast: 50, sharpness: 50, noise: 50 };

  ctx.drawImage(img, 0, 0, w, h);
  const { data } = ctx.getImageData(0, 0, w, h);

  let sum = 0;
  let sumSq = 0;
  const lum: number[] = [];
  for (let i = 0; i < data.length; i += 4) {
    const l = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
    lum.push(l);
    sum += l;
    sumSq += l * l;
  }
  const n = lum.length;
  const mean = sum / n;
  const variance = sumSq / n - mean * mean;
  const contrast = Math.min(100, Math.sqrt(Math.max(0, variance)) / 1.28);

  let laplacian = 0;
  let lapCount = 0;
  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      const idx = y * w + x;
      const c = lum[idx];
      const lap =
        -4 * c +
        lum[idx - 1] +
        lum[idx + 1] +
        lum[idx - w] +
        lum[idx + w];
      laplacian += Math.abs(lap);
      lapCount++;
    }
  }
  const sharpness = Math.min(100, (laplacian / Math.max(lapCount, 1)) * 2.5);

  let noise = 0;
  let noiseCount = 0;
  for (let i = 1; i < lum.length; i++) {
    noise += Math.abs(lum[i] - lum[i - 1]);
    noiseCount++;
  }
  const noiseLevel = Math.min(100, (noise / Math.max(noiseCount, 1)) * 3);
  const noiseScore = Math.max(0, 100 - noiseLevel);

  const brightness = Math.min(100, (mean / 255) * 100);

  return {
    brightness: Math.round(brightness),
    contrast: Math.round(contrast),
    sharpness: Math.round(sharpness),
    noise: Math.round(noiseScore),
  };
}

function resolutionScore(width: number, height: number): number {
  const minSide = Math.min(width, height);
  if (minSide >= 720) return 100;
  if (minSide >= 500) return 85;
  if (minSide >= 250) return 60;
  return Math.round((minSide / 250) * 50);
}

export function computeQualityScores(
  metrics: ImageMetrics,
  compliance: ReturnType<typeof checkGbpCompliance>
): ImageQualityScores {
  const resolution = resolutionScore(metrics.width, metrics.height);
  const brightness =
    metrics.brightness >= 35 && metrics.brightness <= 80
      ? 100
      : metrics.brightness < 35
        ? Math.round((metrics.brightness / 35) * 70)
        : Math.round(100 - (metrics.brightness - 80) * 2);
  const sharpness = metrics.sharpness;
  const gbpCompliance = complianceScore(compliance);
  const overall = Math.round(
    resolution * 0.25 +
      brightness * 0.2 +
      sharpness * 0.2 +
      gbpCompliance * 0.25 +
      metrics.contrast * 0.1
  );

  return {
    resolution,
    brightness: Math.max(0, Math.min(100, brightness)),
    sharpness,
    gbpCompliance,
    overall,
  };
}

export async function analyzeImageFile(file: File): Promise<{
  metrics: ImageMetrics;
  scores: ImageQualityScores;
  compliance: ReturnType<typeof checkGbpCompliance>;
}> {
  const img = await loadImageFromFile(file);
  const pixel = analyzePixels(img);
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "unknown";
  const format =
    file.type.includes("png") ? "png" : file.type.includes("webp") ? "webp" : "jpeg";

  const metrics: ImageMetrics = {
    width: img.width,
    height: img.height,
    fileSizeBytes: file.size,
    fileSizeLabel: formatBytes(file.size),
    format: ext || format,
    brightness: pixel.brightness,
    sharpness: pixel.sharpness,
    contrast: pixel.contrast,
    noise: pixel.noise,
  };

  const compliance = checkGbpCompliance({
    width: metrics.width,
    height: metrics.height,
    fileSizeBytes: metrics.fileSizeBytes,
    format: metrics.format,
  });

  const scores = computeQualityScores(metrics, compliance);

  return { metrics, scores, compliance };
}

export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const base64 = result.split(",")[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export async function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export async function exportImageAs(
  imageUrl: string,
  format: "jpeg" | "png" | "webp",
  quality = 0.9
): Promise<Blob> {
  const img = await loadImageFromUrl(imageUrl);
  const canvas = document.createElement("canvas");
  canvas.width = img.width;
  canvas.height = img.height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas unavailable");
  ctx.drawImage(img, 0, 0);
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("Export failed"))),
      format === "jpeg" ? "image/jpeg" : format === "png" ? "image/png" : "image/webp",
      quality
    );
  });
}

function loadImageFromUrl(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}
