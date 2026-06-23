export type ImageCategory =
  | "Exterior"
  | "Interior"
  | "Team"
  | "Products"
  | "Services"
  | "Office"
  | "Equipment";

export interface ImageQualityScores {
  resolution: number;
  brightness: number;
  sharpness: number;
  gbpCompliance: number;
  overall: number;
}

export interface ImageMetrics {
  width: number;
  height: number;
  fileSizeBytes: number;
  fileSizeLabel: string;
  format: string;
  brightness: number;
  sharpness: number;
  contrast: number;
  noise: number;
}

export interface GbpComplianceCheck {
  passed: boolean;
  resolutionStatus: "pass" | "warn" | "fail";
  fileSizeStatus: "pass" | "fail";
  formatStatus: "pass" | "warn" | "fail";
  messages: string[];
  recommendations: string[];
}

export interface ImageSeoSuggestions {
  filename: string;
  altText: string;
  category: ImageCategory;
}

export interface EnhancedImageItem {
  id: string;
  fileName: string;
  originalUrl: string;
  enhancedUrl?: string;
  mimeType: string;
  metrics: ImageMetrics;
  scores: ImageQualityScores;
  compliance: GbpComplianceCheck;
  seo?: ImageSeoSuggestions;
  status: "ready" | "analyzing" | "enhancing" | "enhanced" | "error";
  error?: string;
  /** User instructions sent with the enhancement request */
  prompt?: string;
}
