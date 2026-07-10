import { createFileRoute } from "@tanstack/react-router";

import { AboutHeroSection } from "#/features/about/components/about-hero-section";
import { InstallationSection } from "#/features/about/components/installation-section";
import { LibrarySection } from "#/features/about/components/library-section";
import { NextStepsSection } from "#/features/about/components/next-steps-section";
import { RequirementsSection } from "#/features/about/components/requirements-section";
import { ThemeSection } from "#/features/about/components/theme-section";
import { CONTENT_CACHE_HEADERS } from "#/lib/cache";
import { canonicalHead } from "#/lib/seo";

export const Route = createFileRoute("/about")({
  // Effective in dev and any live render; once prerendered, `routeRules` in vite.config.ts applies instead.
  headers: () => ({ ...CONTENT_CACHE_HEADERS }),
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
