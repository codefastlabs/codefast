import { createFileRoute } from "@tanstack/react-router";

import { rawDocResponse } from "#/features/package-docs/lib/raw-doc-response";

/** Serves a package's README as raw Markdown at `/docs/<pkg>.md` — the LLM-friendly twin of `/docs/<pkg>`. */
export const Route = createFileRoute("/docs/{$pkg}.md")({
  server: {
    handlers: {
      GET: ({ params }) => rawDocResponse(params.pkg, "readme"),
    },
  },
});
