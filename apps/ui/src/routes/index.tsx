import { createFileRoute } from "@tanstack/react-router";

import { HeroSection } from "#/features/home/components/hero-section";
import { getHeroSnippet } from "#/features/home/lib/hero-snippet";
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
  loader: async () => {
    const [packages, snippetHtml] = await Promise.all([getPackages(), getHeroSnippet()]);

    return { packages, snippetHtml };
  },
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
          description: `Open-source TypeScript packages for React 19 products: dependency injection with an auto-mocking test bed, ${COMPONENTS.length}+ accessible UI components, variant styling, appearance management, and consent-gated tracking.`,
          publisher: {
            "@type": "Organization",
            name: "Codefast Labs",
            url: SITE_URL,
            logo: absoluteUrl("/icon-512.png"),
            sameAs: [GITHUB_URL, NPM_URL],
          },
        }),
      ],
    };
  },
  component: HomePage,
});

function HomePage() {
  const { packages, snippetHtml } = Route.useLoaderData();

  return (
    <main>
      <HeroSection snippetHtml={snippetHtml} />
      <PackagesSection packages={packages} />
    </main>
  );
}
