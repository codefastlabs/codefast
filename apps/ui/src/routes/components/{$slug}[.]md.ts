import { createFileRoute } from "@tanstack/react-router";

import { buildComponentMarkdown } from "#/lib/component-markdown";
import { COMPONENT_BY_SLUG } from "#/registry/components";
import { loadDoc } from "#/registry/docs";

/**
 * Serves the Markdown twin of a detail page at `/components/<slug>.md` — the
 * LLM-friendly artifact behind the "Copy page" menu. Built from the same
 * `buildComponentMarkdown` as the client, so the two never drift.
 *
 * NOTE: only dispatches in production — the Vite/Nitro dev server 404s any `.md`
 * route, so "View as Markdown" doesn't resolve locally.
 */
export const Route = createFileRoute("/components/{$slug}.md")({
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
