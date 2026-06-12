import { Badge } from "@codefast/ui/badge";
import { Button } from "@codefast/ui/button";
import { Link, createFileRoute, notFound } from "@tanstack/react-router";
import { Suspense } from "react";

import { DETAIL_BODY_BY_SLUG, preloadDetail } from "#/components/detail/detail-body";
import { ComponentDetailHeader } from "#/components/detail/detail-header";
import { COMPONENT_BY_SLUG } from "#/registry/components";

export const Route = createFileRoute("/components/$slug")({
  head: ({ params }: { params: { slug: string } }) => {
    const component = COMPONENT_BY_SLUG.get(params.slug);

    return {
      meta: [
        { title: `${component?.name ?? "Component"} — codefast/ui` },
        {
          name: "description",
          content: component?.description ?? "A composable codefast/ui component.",
        },
      ],
    };
  },
  loader: ({ params }) => {
    if (!COMPONENT_BY_SLUG.has(params.slug)) {
      throw notFound();
    }

    // Fire-and-forget warm-up. The router runs this loader on link intent
    // (defaultPreload: "intent"), so hovering any detail link fetches that
    // slug's body chunk before the click lands.
    preloadDetail(params.slug);
  },
  notFoundComponent: ComponentNotFound,
  component: ComponentDetailPage,
});

function ComponentNotFound() {
  return (
    <main className="container mx-auto flex flex-col items-center px-4 pt-32 pb-32 text-center">
      <Badge variant="outline" className="mb-5 border-ui-border text-ui-muted">
        404
      </Badge>
      <h1 className="mb-3 text-3xl font-bold tracking-tighter text-ui-fg">Component not found</h1>
      <p className="mb-8 max-w-sm text-ui-muted">
        We couldn’t find that component. It may have been renamed or removed.
      </p>
      <Button asChild>
        <Link to="/components">Browse all components</Link>
      </Button>
    </main>
  );
}

/** Layout-stable placeholder while a detail chunk streams in. */
function DetailSkeleton() {
  return (
    <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_180px] lg:gap-12">
      <div className="min-w-0 space-y-16">
        <div className="min-h-64 animate-pulse rounded-2xl border border-ui-border bg-ui-surface" />
        <div className="min-h-40 animate-pulse rounded-2xl border border-ui-border bg-ui-surface" />
      </div>
    </div>
  );
}

function ComponentDetailPage() {
  const { slug } = Route.useParams();
  const component = COMPONENT_BY_SLUG.get(slug);

  if (!component) {
    return <ComponentNotFound />;
  }

  // Per-slug code-split body: only this component's doc/examples chunk loads.
  const Body = DETAIL_BODY_BY_SLUG.get(slug);

  return (
    <main className="container mx-auto px-4 pt-10 pb-32">
      <ComponentDetailHeader component={component} />

      {Body ? (
        <Suspense fallback={<DetailSkeleton />}>
          <Body />
        </Suspense>
      ) : null}
    </main>
  );
}
