import { createFileRoute } from "@tanstack/react-router";

import { buildComponentMarkdown } from "#/lib/component-markdown";
import { COMPONENT_BY_SLUG } from "#/registry/components";
import { loadDoc } from "#/registry/docs";

/**
 * Serves the Markdown twin of a component detail page at `/components/<slug>.txt`
 * — the canonical, LLM-friendly artifact behind the detail page's "Copy page"
 * menu ("View as Markdown", "Open in Claude / ChatGPT"). The `{$slug}.txt` suffix
 * pattern (braces, not a bare `$slug`) keeps the param named `slug` while the
 * extension lives in the same segment. `.txt` (not `.md`) because the Vite dev
 * server intercepts `*.md` requests as static assets, so a `.md` route 404s
 * locally; `.txt` dispatches in both dev and prod and renders inline. Built from
 * the same `buildComponentMarkdown` the client uses, so the two never drift; the
 * rich `doc` chunk is resolved server-side just like SSR.
 */
export const Route = createFileRoute("/components/{$slug}.txt")({
  server: {
    handlers: {
      GET: async ({ params }) => {
        const component = COMPONENT_BY_SLUG.get(params.slug);

        if (!component) {
          return new Response("Not found", { status: 404 });
        }

        const doc = await loadDoc(component.slug);

        return new Response(buildComponentMarkdown(component, doc), {
          headers: {
            "Content-Type": "text/plain; charset=utf-8",
          },
        });
      },
    },
  },
});
