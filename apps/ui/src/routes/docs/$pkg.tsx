import { createFileRoute, notFound } from "@tanstack/react-router";

import { DocNotFound } from "#/features/package-docs/components/doc-not-found";
import { DocPage } from "#/features/package-docs/components/doc-page";
import { docPageHead } from "#/features/package-docs/lib/doc-page-head";
import { getDocPage } from "#/features/package-docs/lib/package-docs";
import { CONTENT_CACHE_HEADERS } from "#/lib/cache";

export const Route = createFileRoute("/docs/$pkg")({
  // Effective in dev and any live render; once prerendered, `routeRules` in vite.config.ts applies instead.
  headers: () => ({ ...CONTENT_CACHE_HEADERS }),
  staleTime: 60 * 60_000,
  loader: async ({ params }) => {
    const page = await getDocPage({ data: { pkg: params.pkg, doc: "readme" } });

    if (!page) {
      throw notFound();
    }

    return page;
  },
  // Declared after `loader` on purpose: placed before it, TS cannot infer the loader type and `useLoaderData` degrades.
  head: ({ loaderData }) => docPageHead(loaderData),
  notFoundComponent: DocNotFound,
  component: PackageReadmeRoute,
});

function PackageReadmeRoute() {
  const data = Route.useLoaderData();

  return <DocPage data={data} />;
}
