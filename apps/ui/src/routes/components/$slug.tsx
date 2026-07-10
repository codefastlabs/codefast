import { createFileRoute, notFound } from "@tanstack/react-router";

import { fetchDetail } from "#/features/components-catalog/components/detail/detail-bodies";
import { DetailNotFound } from "#/features/components-catalog/components/detail/detail-not-found";
import { DetailPage } from "#/features/components-catalog/components/detail/detail-page";
import { CONTENT_CACHE_HEADERS } from "#/lib/cache";
import { SITE_OG_IMAGE, absoluteUrl, canonicalHead, jsonLdScript } from "#/lib/seo";
import { COMPONENT_BY_SLUG } from "#/registry/_core/components";

export const Route = createFileRoute("/components/$slug")({
  // ISR: this is a live render the CDN caches — both headers required (see lib/cache.ts).
  headers: () => ({ ...CONTENT_CACHE_HEADERS }),
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
    const component = COMPONENT_BY_SLUG.get(params.slug);

    if (!component) {
      throw notFound();
    }

    // Await the (serializable) detail here so SSR ships a complete body and the
    // client renders it synchronously — no React.lazy / Suspense skeleton.
    return fetchDetail(component);
  },
  notFoundComponent: DetailNotFound,
  component: ComponentDetailRoute,
});

function ComponentDetailRoute() {
  const detail = Route.useLoaderData();

  return <DetailPage detail={detail} />;
}
