import { createFileRoute } from "@tanstack/react-router";

import { FeaturesSection } from "#/features/home/components/features-section";
import { HeroSection } from "#/features/home/components/hero-section";
import { InstallCta } from "#/features/home/components/install-cta";
import { StatsSection } from "#/features/home/components/stats-section";
import { CONTENT_CACHE_HEADERS } from "#/lib/cache";
import { GITHUB_URL } from "#/lib/nav-links";
import { SITE_URL, absoluteUrl, canonicalHead, jsonLdScript } from "#/lib/seo";

const NPM_URL = "https://www.npmjs.com/package/@codefast/ui";

export const Route = createFileRoute("/")({
  // ISR: this is a live render the CDN caches — both headers required (see lib/cache.ts).
  headers: () => ({ ...CONTENT_CACHE_HEADERS }),
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
