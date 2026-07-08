import { createFileRoute } from "@tanstack/react-router";

import { GalleryHeroSection } from "#/features/components-catalog/components/gallery/gallery-hero-section";
import { GalleryLayout } from "#/features/components-catalog/components/gallery/gallery-layout";
import { CONTENT_CACHE_CONTROL } from "#/lib/cache";
import { canonicalHead } from "#/lib/seo";

export const Route = createFileRoute("/components/")({
  /**
   * Declares this route's caching policy for dev and any non-prerendered render. Has no
   * effect once prerendered for Vercel, where `routeRules` in `vite.config.ts` applies instead.
   */
  headers: () => ({ "Cache-Control": CONTENT_CACHE_CONTROL }),
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
