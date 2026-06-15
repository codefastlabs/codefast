import { createFileRoute, notFound } from "@tanstack/react-router";

import { preloadDetail } from "#/components/detail/detail-body";
import { ComponentDetailNotFound } from "#/components/detail/detail-not-found";
import { ComponentDetailPage } from "#/components/detail/detail-page";
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

    preloadDetail(params.slug);
  },
  notFoundComponent: ComponentDetailNotFound,
  component: ComponentDetailRoute,
});

function ComponentDetailRoute() {
  const { slug } = Route.useParams();

  return <ComponentDetailPage slug={slug} />;
}
