import { createFileRoute } from "@tanstack/react-router";

import { GalleryHeroSection } from "#/components/showcase/gallery-hero-section";
import { GalleryLayout } from "#/components/showcase/gallery-layout";

export const Route = createFileRoute("/components/")({
  head: () => ({
    meta: [
      { title: "Components — codefast/ui" },
      {
        name: "description",
        content:
          "Browse the full @codefast/ui component library, A–Z — live previews and copy-ready source for every component.",
      },
    ],
  }),
  component: ComponentsPage,
});

function ComponentsPage() {
  return (
    <main>
      <GalleryHeroSection />
      <GalleryLayout />
    </main>
  );
}
