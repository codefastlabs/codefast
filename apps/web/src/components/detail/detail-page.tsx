import { useLocation } from "@tanstack/react-router";
import { Suspense } from "react";

import { DETAIL_BODY_BY_SLUG } from "#/components/detail/detail-body";
import { DetailHeroSection } from "#/components/detail/detail-hero-section";
import { ComponentDetailNotFound } from "#/components/detail/detail-not-found";
import { DetailSkeleton } from "#/components/detail/detail-skeleton";
import { useHashScroll } from "#/hooks/use-hash-scroll";
import { COMPONENT_BY_SLUG } from "#/registry/components";

interface ComponentDetailPageProps {
  readonly slug: string;
}

export function ComponentDetailPage({ slug }: ComponentDetailPageProps) {
  const hash = useLocation({ select: (location) => location.hash });
  const component = COMPONENT_BY_SLUG.get(slug);

  useHashScroll(hash);

  if (!component) {
    return <ComponentDetailNotFound />;
  }

  const Body = DETAIL_BODY_BY_SLUG.get(slug);

  return (
    <main>
      <DetailHeroSection component={component} />

      <div className="container mx-auto px-4 py-10 pb-32">
        {Body ? (
          <Suspense fallback={<DetailSkeleton />}>
            <Body />
          </Suspense>
        ) : null}
      </div>
    </main>
  );
}
