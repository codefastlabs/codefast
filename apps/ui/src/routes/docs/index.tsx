import { createFileRoute } from "@tanstack/react-router";

import { PageHeader } from "#/components/shared/page-header";
import { PackageCard } from "#/features/package-docs/components/package-card";
import { getPackages } from "#/features/package-docs/lib/package-docs";
import { CONTENT_CACHE_HEADERS } from "#/lib/cache";
import { canonicalHead } from "#/lib/seo";

export const Route = createFileRoute("/docs/")({
  // Effective in dev and any live render; once prerendered, `routeRules` in vite.config.ts applies instead.
  headers: () => ({ ...CONTENT_CACHE_HEADERS }),
  staleTime: 60 * 60_000,
  head: () => {
    const seo = canonicalHead("/docs");

    return {
      meta: [
        { title: "Packages — Codefast Labs" },
        {
          name: "description",
          content:
            "Documentation for every published @codefast package: README, specification, architecture, decisions, and changelog.",
        },
        ...seo.meta,
      ],
      links: seo.links,
    };
  },
  loader: () => getPackages(),
  component: DocsIndexPage,
});

function DocsIndexPage() {
  const packages = Route.useLoaderData();

  return (
    <main className="container mx-auto px-4 py-16 pb-32">
      <PageHeader
        title={
          <>
            Package <span className="text-ui-brand">documentation.</span>
          </>
        }
        description="Each package publishes its README, and where it has one, its specification, architecture notes, decision record, and changelog — rendered straight from the repository."
        className="mb-12"
      />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {packages.map((pkg) => (
          <PackageCard key={pkg.slug} pkg={pkg} />
        ))}
      </div>
    </main>
  );
}
