"use client";

import { LandingNav } from "./landing-nav";
import { HeroSection } from "./hero-section";
import { TrustedBy } from "./trusted-by";
import { FeatureHighlights } from "./feature-highlights";
import { HowItWorks } from "./how-it-works";
import { WhyChoose } from "./why-choose";
import { AiInsights } from "./ai-insights";
import { Testimonials } from "./testimonials";
import { Faq } from "./faq";
import { FinalCta } from "./final-cta";
import { LandingFooter } from "./landing-footer";

export function LandingPage() {
  return (
    <div className="landing-page min-h-screen">
      <LandingNav />
      <main>
        <HeroSection />
        <TrustedBy />
        <FeatureHighlights />
        <HowItWorks />
        <WhyChoose />
        <AiInsights />
        <Testimonials />
        <Faq />
        <FinalCta />
      </main>
      <LandingFooter />
    </div>
  );
}
