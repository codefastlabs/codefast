import { createFileRoute } from "@tanstack/react-router";

import { FeaturesSection } from "#/components/home/features-section";
import { HeroSection } from "#/components/home/hero-section";
import { InstallCta } from "#/components/home/install-cta";
import { StatsSection } from "#/components/home/stats-section";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [{ title: "codefast/ui — Beautiful, accessible React components for React 19" }],
  }),
  component: HomePage,
});

function HomePage() {
  return (
    <main>
      <HeroSection />
      <StatsSection />
      <FeaturesSection />
      <InstallCta />
    </main>
  );
}
