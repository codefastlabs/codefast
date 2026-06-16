import { createFileRoute } from "@tanstack/react-router";

import { AboutHeroSection } from "#/components/about/about-hero-section";
import { InstallationSection } from "#/components/about/installation-section";
import { LibrarySection } from "#/components/about/library-section";
import { NextStepsSection } from "#/components/about/next-steps-section";
import { RequirementsSection } from "#/components/about/requirements-section";
import { ThemeSection } from "#/components/about/theme-section";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "Getting Started — codefast/ui" },
      {
        name: "description",
        content: "Install @codefast/ui, wire up the CSS, and start building. No config files required.",
      },
    ],
  }),
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
