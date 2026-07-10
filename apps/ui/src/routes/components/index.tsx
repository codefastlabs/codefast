import { createFileRoute } from "@tanstack/react-router";

import { GalleryHeroSection } from "#/features/components-catalog/components/gallery/gallery-hero-section";
import { GalleryLayout } from "#/features/components-catalog/components/gallery/gallery-layout";
import { CONTENT_CACHE_HEADERS } from "#/lib/cache";
import { canonicalHead } from "#/lib/seo";

export const Route = createFileRoute("/components/")({
  // ISR: this is a live render the CDN caches — both headers required (see lib/cache.ts).
  headers: () => ({ ...CONTENT_CACHE_HEADERS }),
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
