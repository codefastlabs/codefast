import { createFileRoute } from "@tanstack/react-router";

import { CONTENT_CACHE_CONTROL, CONTENT_CDN_CACHE_CONTROL } from "#/lib/cache";
import { GITHUB_URL } from "#/lib/nav-links";
import { absoluteUrl } from "#/lib/seo";
import { COMPONENTS } from "#/registry/_core/components";

const NPM_URL = "https://www.npmjs.com/package/@codefast/ui";

/**
 * Builds the `/llms.txt` body — a machine-readable summary for LLM-powered tools
 * (ChatGPT, Claude, Perplexity, …). Generated from the component registry so it
 * always lists every shipped component. Format follows https://llmstxt.org.
 */
function buildLlmsTxt(): string {
  const components = COMPONENTS.map(
    (component) => `- [${component.name}](${absoluteUrl(`/components/${component.slug}`)}): ${component.description}`,
  ).join("\n");

  return `# codefast/ui

> ${COMPONENTS.length}+ accessible React components built on Radix UI primitives and Tailwind CSS v4. Copy the source, own the code — strict TypeScript, dark mode, and zero config. Built for React 19.

## Key facts
- Package: \`@codefast/ui\` — install with \`pnpm add @codefast/ui\`
- Every component is a named sub-path import: \`@codefast/ui/<slug>\` (e.g. \`@codefast/ui/button\`)
- Built on Radix UI primitives and Tailwind CSS v4
- Copy-the-source model: you own the code, no config files required
- Peer dependencies: React 19 and Tailwind CSS v4

## Pages
- [Home](${absoluteUrl("/")}): Overview of codefast/ui
- [Getting Started](${absoluteUrl("/about")}): Install the package and wire up the CSS
- [Components](${absoluteUrl("/components")}): Browse the full component library A–Z

## Components
${components}

## Links
- [GitHub](${GITHUB_URL})
- [npm](${NPM_URL})
`;
}

export const Route = createFileRoute("/llms.txt")({
  server: {
    handlers: {
      GET: () => {
        return new Response(buildLlmsTxt(), {
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
