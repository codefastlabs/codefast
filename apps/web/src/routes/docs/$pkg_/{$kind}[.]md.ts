import { createFileRoute } from "@tanstack/react-router";

import { rawDocResponse } from "#/features/package-docs/lib/raw-doc-response";

/** Serves one package document as raw Markdown at `/docs/<pkg>/<kind>.md`. */
export const Route = createFileRoute("/docs/$pkg_/{$kind}.md")({
  server: {
    handlers: {
      GET: ({ params }) => rawDocResponse(params.pkg, params.kind),
    },
  },
});
