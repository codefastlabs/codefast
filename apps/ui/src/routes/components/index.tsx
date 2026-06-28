import { createFileRoute } from "@tanstack/react-router";

import { GalleryHeroSection } from "#/components/showcase/gallery-hero-section";
import { GalleryLayout } from "#/components/showcase/gallery-layout";
import { canonicalHead } from "#/lib/seo";

export const Route = createFileRoute("/components/")({
  head: () => {
    const seo = canonicalHead("/components");

    return {
      meta: [
        { title: "Components — codefast/ui" },
        {
          name: "description",
          content:
            "Browse the full @codefast/ui component library, A–Z — live previews and copy-ready source for every component.",
        },
        ...seo.meta,
      ],
      links: seo.links,
    };
  },
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
