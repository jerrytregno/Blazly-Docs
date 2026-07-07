import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { DOCS_SITE_URL, getSiteUrl } from "@/config/site";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(getSiteUrl()),
  title: {
    default: "Blazly Documentation",
    template: "%s | Blazly Docs",
  },
  description:
    "Product documentation for Blazly SEO, GEO, Backlinker, Lead Engine, Local SEO, and Social.",
  alternates: {
    canonical: "/docs",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: DOCS_SITE_URL,
    siteName: "Blazly Docs",
    title: "Blazly Documentation",
    description:
      "Product documentation for Blazly SEO, GEO, Backlinker, Lead Engine, Local SEO, and Social.",
  },
  icons: {
    icon: "/blazly-logo-white.png",
    apple: "/blazly-logo-white.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scroll-smooth" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
