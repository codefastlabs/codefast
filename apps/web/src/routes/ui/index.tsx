import { Link, createFileRoute } from "@tanstack/react-router";

import { DemoWallSection } from "#/features/home/components/demo-wall-section";
import { FeaturesSection } from "#/features/home/components/features-section";
import { InstallCta } from "#/features/home/components/install-cta";
import { StatsSection } from "#/features/home/components/stats-section";
import { FEATURES } from "#/features/home/data";
import { UiHeroSection } from "#/features/ui-home/components/ui-hero-section";
import { CONTENT_CACHE_HEADERS } from "#/lib/cache";
import { INSTALL_COMMAND } from "#/lib/install";
import { GITHUB_URL } from "#/lib/nav-links";
import { SITE_URL, absoluteUrl, canonicalHead, jsonLdScript } from "#/lib/seo";
import { COMPONENTS } from "#/registry/_core/components";

const NPM_URL = "https://www.npmjs.com/package/@codefast/ui";

export const Route = createFileRoute("/ui/")({
  // Effective in dev and any live render; once prerendered, `routeRules` in vite.config.ts applies instead.
  headers: () => ({ ...CONTENT_CACHE_HEADERS }),
  head: () => {
    const seo = canonicalHead("/ui");

    return {
      meta: [
        { title: "codefast/ui — Accessible React components, yours to own" },
        {
          name: "description",
          content: `${COMPONENTS.length}+ React components built on Radix UI primitives and Tailwind CSS v4. Accessible by construction, typed to the prop, themeable in plain CSS — and yours to copy, source and all.`,
        },
        ...seo.meta,
      ],
      links: seo.links,
      scripts: [
        jsonLdScript({
          "@context": "https://schema.org",
          "@type": "SoftwareSourceCode",
          name: "@codefast/ui",
          url: absoluteUrl("/ui"),
          codeRepository: GITHUB_URL,
          programmingLanguage: "TypeScript",
          description: `${COMPONENTS.length}+ accessible React components built on Radix UI primitives and Tailwind CSS v4.`,
          publisher: { "@type": "Organization", name: "Codefast Labs", url: SITE_URL, sameAs: [GITHUB_URL, NPM_URL] },
        }),
      ],
    };
  },
  component: UiHomePage,
});

function UiHomePage() {
  return (
    <main>
      <UiHeroSection />
      <DemoWallSection />
      <StatsSection />
      <FeaturesSection
        eyebrow="Why codefast/ui"
        titleId="ui-features-title"
        title={
          <>
            The details,
            <br />
            already handled.
          </>
        }
        description="The unglamorous parts of a component library — accessibility, types, theming, ownership — are the parts you feel every day. So we started there."
        features={FEATURES}
      />
      <InstallCta
        command={INSTALL_COMMAND}
        titleId="ui-install-title"
        title="One command to start."
        description="Add the package, import three lines of CSS, and build. Design tokens, dark mode, and accessibility are already wired up — there's nothing to configure."
        analyticsName="home-hero"
        docsAction={<Link to="/ui/about">Read the docs</Link>}
      />
    </main>
  );
}
