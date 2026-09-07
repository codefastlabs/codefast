import { createFileRoute } from "@tanstack/react-router";

import { PageHeader } from "#/components/shared/page-header";
import { BrandColorSection } from "#/features/brand/components/brand-color-section";
import { BrandDownloadsSection } from "#/features/brand/components/brand-downloads-section";
import { BrandLockupsSection } from "#/features/brand/components/brand-lockups-section";
import { BrandMarkSection } from "#/features/brand/components/brand-mark-section";
import { BrandNamingSection } from "#/features/brand/components/brand-naming-section";
import { BrandTypeSection } from "#/features/brand/components/brand-type-section";
import { CONTENT_CACHE_HEADERS } from "#/lib/cache";
import { canonicalHead } from "#/lib/seo";

export const Route = createFileRoute("/brand")({
  // Effective in dev and any live render; once prerendered, `routeRules` in vite.config.ts applies instead.
  headers: () => ({ ...CONTENT_CACHE_HEADERS }),
  head: () => {
    const seo = canonicalHead("/brand");

    return {
      meta: [
        { title: "Brand — Codefast Labs" },
        {
          name: "description",
          content: "The Codefast Labs mark, wordmark, colours and type, with every asset ready to download.",
        },
        ...seo.meta,
      ],
      links: seo.links,
    };
  },
  component: BrandPage,
});

function BrandPage() {
  return (
    <main className="container mx-auto px-4 py-16 pb-32">
      <PageHeader
        title={
          <>
            Brand <span className="text-ui-brand">assets.</span>
          </>
        }
        description="The mark, the wordmark, the colours and the type behind Codefast Labs, and the files to use them. Right-click the logo anywhere on the site to come back here."
        className="mb-4"
      />
      <BrandMarkSection />
      <BrandLockupsSection />
      <BrandColorSection />
      <BrandTypeSection />
      <BrandNamingSection />
      <BrandDownloadsSection />
    </main>
  );
}
