import { createFileRoute } from "@tanstack/react-router";

import { HeroSection } from "#/features/home/components/hero-section";
import { PackagesSection } from "#/features/package-docs/components/packages-section";
import { getPackages } from "#/features/package-docs/lib/package-docs";
import { CONTENT_CACHE_HEADERS } from "#/lib/cache";
import { GITHUB_URL } from "#/lib/nav-links";
import { SITE_URL, absoluteUrl, canonicalHead, jsonLdScript } from "#/lib/seo";
import { COMPONENTS } from "#/registry/_core/components";

const NPM_URL = "https://www.npmjs.com/org/codefast";

export const Route = createFileRoute("/")({
  // Effective in dev and any live render; once prerendered, `routeRules` in vite.config.ts applies instead.
  headers: () => ({ ...CONTENT_CACHE_HEADERS }),
  staleTime: 60 * 60_000,
  loader: () => getPackages(),
  head: () => {
    const seo = canonicalHead("/");

    return {
      meta: [{ title: "Codefast Labs — TypeScript packages for React 19 products" }, ...seo.meta],
      links: seo.links,
      scripts: [
        jsonLdScript({
          "@context": "https://schema.org",
          "@type": "WebSite",
          name: "Codefast Labs",
          url: SITE_URL,
          description: `Open-source TypeScript packages for React 19 products: ${COMPONENTS.length}+ accessible UI components, variant styling, appearance management, consent-gated tracking, and dependency injection.`,
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
  const packages = Route.useLoaderData();

  return (
    <main>
      <HeroSection />
      <PackagesSection packages={packages} />
    </main>
  );
}
