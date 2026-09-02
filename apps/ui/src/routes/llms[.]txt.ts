import { createFileRoute } from "@tanstack/react-router";

import { DOC_KIND_BY_SLUG, docPath } from "#/features/package-docs/lib/doc-kinds";
import type { PackageSummary } from "#/features/package-docs/lib/rendered-doc";
import { CONTENT_CACHE_CONTROL, CONTENT_CDN_CACHE_CONTROL } from "#/lib/cache";
import { GITHUB_URL } from "#/lib/nav-links";
import { absoluteUrl } from "#/lib/seo";
import { COMPONENTS } from "#/registry/_core/components";

const NPM_ORG_URL = "https://www.npmjs.com/org/codefast";

/** One package's docs as llms.txt bullets: the README page plus its `.md` twin for every document it ships. */
function packageSection(pkg: PackageSummary): string {
  const docs = pkg.docs
    .map((doc) => {
      const label = DOC_KIND_BY_SLUG.get(doc)?.label ?? doc;
      const path = docPath(pkg.slug, doc);

      return `  - [${label}](${absoluteUrl(path)}) · [Markdown](${absoluteUrl(`${path}.md`)})`;
    })
    .join("\n");

  return `- **${pkg.name}** v${pkg.version}: ${pkg.description}\n${docs}`;
}

/**
 * Builds the `/llms.txt` body — a machine-readable summary for LLM-powered tools
 * (ChatGPT, Claude, Perplexity, …). Generated from the package manifests and the
 * component registry so it always lists every shipped package, document, and
 * component. Format follows https://llmstxt.org.
 */
function buildLlmsTxt(packages: ReadonlyArray<PackageSummary>): string {
  const components = COMPONENTS.map(
    (component) =>
      `- [${component.name}](${absoluteUrl(`/components/${component.slug}`)}): ${component.description} · [Markdown](${absoluteUrl(`/components/${component.slug}.md`)})`,
  ).join("\n");
  const packageSections = packages
    .filter((pkg) => pkg.slug !== "ui")
    .map((pkg) => packageSection(pkg))
    .join("\n");

  return `# Codefast Labs

> Open-source TypeScript packages for React 19 products, published under \`@codefast\`: ${COMPONENTS.length}+ accessible UI components built on Radix UI and Tailwind CSS v4, a type-safe variant styling API, appearance management, consent-gated event tracking for TanStack Start, and dependency-injection primitives.

## Key facts
- Every package is published to npm under the \`@codefast\` scope and developed in one monorepo
- \`@codefast/ui\` components are named sub-path imports: \`@codefast/ui/<slug>\` (e.g. \`@codefast/ui/button\`)
- Every page below has a raw Markdown twin: append \`.md\` to a component page, or use the Markdown links under each package

## Pages
- [Home](${absoluteUrl("/")}): Every published package at a glance
- [Packages](${absoluteUrl("/docs")}): Documentation index for the non-UI packages
- [Getting Started](${absoluteUrl("/about")}): Install @codefast/ui and wire up the CSS
- [Components](${absoluteUrl("/components")}): Browse the full component library A–Z

## Packages
${packageSections}

## @codefast/ui components
${components}

## Links
- [GitHub](${GITHUB_URL})
- [npm](${NPM_ORG_URL})
`;
}

export const Route = createFileRoute("/llms.txt")({
  server: {
    handlers: {
      GET: async () => {
        const { PACKAGES } = await import("#/features/package-docs/lib/doc-source.impl");

        return new Response(buildLlmsTxt(PACKAGES), {
          headers: {
            "Content-Type": "text/plain; charset=utf-8",
            "Cache-Control": CONTENT_CACHE_CONTROL,
            "CDN-Cache-Control": CONTENT_CDN_CACHE_CONTROL,
          },
        });
      },
    },
  },
});
