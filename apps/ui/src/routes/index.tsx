import { Link, createFileRoute } from "@tanstack/react-router";

import { BenchmarkSection } from "#/features/home/components/benchmark-section";
import { DiPillarsSection } from "#/features/home/components/di-pillars-section";
import { DiTestingSection } from "#/features/home/components/di-testing-section";
import { HeroSection } from "#/features/home/components/hero-section";
import { InstallCta } from "#/features/home/components/install-cta";
import { WiringSection } from "#/features/home/components/wiring-section";
import { DI_INSTALL_COMMAND } from "#/features/home/data";
import { getHomeSnippets } from "#/features/home/lib/home-snippets";
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
    const [packages, snippets] = await Promise.all([getPackages(), getHomeSnippets()]);

    return { packages, snippets };
  },
  head: () => {
    const seo = canonicalHead("/");

    return {
      meta: [
        { title: "Codefast Labs — Type-safe dependency injection for TypeScript, and the packages around it" },
        ...seo.meta,
      ],
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
  const { packages, snippets } = Route.useLoaderData();

  return (
    <main>
      <HeroSection quickStartHtml={snippets.quickStart} />
      <WiringSection />
      <DiPillarsSection wrongListHtml={snippets.wrongList} decoratorsHtml={snippets.decorators} />
      <DiTestingSection testBedHtml={snippets.testBed} />
      <BenchmarkSection />
      <PackagesSection packages={packages} />
      <InstallCta
        command={DI_INSTALL_COMMAND}
        titleId="home-install-title"
        title="One command to start."
        description="Add the package, declare a class's dependencies with @injectable, and resolve it from a container. Native decorators, no reflect-metadata, nothing to configure."
        analyticsName="home-di"
        docsAction={
          <Link to="/docs/$pkg" params={{ pkg: "di" }}>
            Read the docs
          </Link>
        }
      />
    </main>
  );
}
