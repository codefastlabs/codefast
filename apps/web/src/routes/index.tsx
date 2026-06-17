import { createFileRoute } from "@tanstack/react-router";

import { FeaturesSection } from "#/components/home/features-section";
import { HeroSection } from "#/components/home/hero-section";
import { InstallCta } from "#/components/home/install-cta";
import { StatsSection } from "#/components/home/stats-section";
import { GITHUB_URL } from "#/components/layout/nav-links";
import { SITE_URL, absoluteUrl, canonicalHead, jsonLdScript } from "#/lib/seo";

const NPM_URL = "https://www.npmjs.com/package/@codefast/ui";

export const Route = createFileRoute("/")({
  head: () => {
    const seo = canonicalHead("/");

    return {
      meta: [{ title: "codefast/ui — Beautiful, accessible React components for React 19" }, ...seo.meta],
      links: seo.links,
      scripts: [
        jsonLdScript({
          "@context": "https://schema.org",
          "@type": "WebSite",
          name: "codefast/ui",
          url: SITE_URL,
          description:
            "60+ accessible React components built on Radix UI primitives and Tailwind CSS v4. Copy the source, own the code.",
          publisher: {
            "@type": "Organization",
            name: "Codefast Labs",
            url: SITE_URL,
            logo: absoluteUrl("/logo512.png"),
            sameAs: [GITHUB_URL, NPM_URL],
          },
        }),
      ],
    };
  },
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
