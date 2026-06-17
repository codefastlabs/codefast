import { createFileRoute, notFound } from "@tanstack/react-router";

import { preloadDetail } from "#/components/detail/detail-body";
import { ComponentDetailNotFound } from "#/components/detail/detail-not-found";
import { ComponentDetailPage } from "#/components/detail/detail-page";
import { SITE_OG_IMAGE, absoluteUrl, canonicalHead, jsonLdScript } from "#/lib/seo";
import { COMPONENT_BY_SLUG } from "#/registry/components";

export const Route = createFileRoute("/components/$slug")({
  head: ({ params }: { params: { slug: string } }) => {
    const component = COMPONENT_BY_SLUG.get(params.slug);
    const url = absoluteUrl(`/components/${params.slug}`);
    const seo = canonicalHead(`/components/${params.slug}`);

    return {
      meta: [
        { title: `${component?.name ?? "Component"} — codefast/ui` },
        {
          name: "description",
          content: component?.description ?? "A composable codefast/ui component.",
        },
        ...seo.meta,
      ],
      links: seo.links,
      scripts: component
        ? [
            jsonLdScript({
              "@context": "https://schema.org",
              "@type": "TechArticle",
              headline: `${component.name} — codefast/ui`,
              name: component.name,
              description: component.description,
              url,
              image: SITE_OG_IMAGE,
            }),
            jsonLdScript({
              "@context": "https://schema.org",
              "@type": "BreadcrumbList",
              itemListElement: [
                { "@type": "ListItem", position: 1, name: "Home", item: absoluteUrl("/") },
                { "@type": "ListItem", position: 2, name: "Components", item: absoluteUrl("/components") },
                { "@type": "ListItem", position: 3, name: component.name, item: url },
              ],
            }),
          ]
        : [],
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
