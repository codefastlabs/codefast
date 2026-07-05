import { createFileRoute } from "@tanstack/react-router";

import { AboutHeroSection } from "#/components/about/about-hero-section";
import { InstallationSection } from "#/components/about/installation-section";
import { LibrarySection } from "#/components/about/library-section";
import { NextStepsSection } from "#/components/about/next-steps-section";
import { RequirementsSection } from "#/components/about/requirements-section";
import { ThemeSection } from "#/components/about/theme-section";
import { CONTENT_CACHE_CONTROL } from "#/lib/cache";
import { canonicalHead } from "#/lib/seo";

export const Route = createFileRoute("/about")({
  /**
   * Declares this route's caching policy for dev and any non-prerendered render. Has no
   * effect once prerendered for Vercel, where `routeRules` in `vite.config.ts` applies instead.
   */
  headers: () => ({ "Cache-Control": CONTENT_CACHE_CONTROL }),
  head: () => {
    const seo = canonicalHead("/about");

    return {
      meta: [
        { title: "Getting Started — codefast/ui" },
        {
          name: "description",
          content: "Install @codefast/ui, wire up the CSS, and start building. No config files required.",
        },
        ...seo.meta,
      ],
      links: seo.links,
    };
  },
  component: GettingStartedPage,
});

function GettingStartedPage() {
  return (
    <main>
      <AboutHeroSection />

      <div className="container mx-auto px-4 py-16 pb-32">
        <RequirementsSection />
        <InstallationSection />
        <ThemeSection />
        <LibrarySection />
        <NextStepsSection />
      </div>
    </main>
  );
}
