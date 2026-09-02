import { createFileRoute } from "@tanstack/react-router";

import { rawDocResponse } from "#/features/package-docs/lib/raw-doc-response";

/** Serves one package document as raw Markdown at `/docs/<pkg>/<doc>.md`. */
export const Route = createFileRoute("/docs/$pkg_/{$doc}.md")({
  server: {
    handlers: {
      GET: ({ params }) => rawDocResponse(params.pkg, params.doc),
    },
  },
});
