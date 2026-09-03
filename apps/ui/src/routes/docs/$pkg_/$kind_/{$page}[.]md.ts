import { createFileRoute } from "@tanstack/react-router";

import { rawDocResponse } from "#/features/package-docs/lib/raw-doc-response";

/** Serves a directory kind's page as raw Markdown at `/docs/<pkg>/<kind>/<page>.md`. */
export const Route = createFileRoute("/docs/$pkg_/$kind_/{$page}.md")({
  server: {
    handlers: {
      GET: ({ params }) => rawDocResponse(params.pkg, params.kind, params.page),
    },
  },
});
