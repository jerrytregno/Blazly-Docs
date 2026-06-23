import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  outputFileTracingRoot: process.cwd(),
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
    ],
  },
};

export default nextConfig;
