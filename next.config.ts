import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  outputFileTracingRoot: process.cwd(),
  serverExternalPackages: [
    "firebase-admin",
    "@google-cloud/firestore",
    "google-gax",
    "jwks-rsa",
    "jose",
    "stripe",
  ],
  outputFileTracingIncludes: {
    "/api/stripe/checkout": ["./node_modules/firebase-admin/**"],
    "/api/stripe/webhook": ["./node_modules/firebase-admin/**"],
    "/api/images/enhance": ["./node_modules/firebase-admin/**"],
  },
  async redirects() {
    return [
      { source: "/dashboard/projects", destination: "/dashboard/gbp/business-details", permanent: false },
      { source: "/dashboard/search", destination: "/dashboard/competitors/discovery", permanent: false },
      { source: "/dashboard/ai-strategist/ask", destination: "/dashboard/ai-strategist/recommendations", permanent: false },
    ];
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
      {
        protocol: "https",
        hostname: "kommodo.ai",
      },
      {
        protocol: "https",
        hostname: "plain-apac-prod-public.komododecks.com",
      },
    ],
  },
};

export default nextConfig;
