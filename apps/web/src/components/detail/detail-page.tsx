import { cn } from "@codefast/ui/lib/utils";
import { useLocation } from "@tanstack/react-router";
import type { ComponentProps } from "react";
import { Suspense } from "react";

import { DETAIL_BODY_BY_SLUG } from "#/components/detail/detail-body";
import { DetailCtaSection } from "#/components/detail/detail-cta-section";
import { DetailHeroSection } from "#/components/detail/detail-hero-section";
import { ComponentDetailNotFound } from "#/components/detail/detail-not-found";
import { DetailSkeleton } from "#/components/detail/detail-skeleton";
import { SidebarNav } from "#/components/showcase/sidebar-nav";
import { ALPHABET_GROUPS } from "#/data/showcase";
import { useHashScroll } from "#/hooks/use-hash-scroll";
import { COMPONENT_BY_SLUG } from "#/registry/components";

interface ComponentDetailPageProps extends ComponentProps<"main"> {
  readonly slug: string;
}

export function ComponentDetailPage({ slug, className, ...props }: ComponentDetailPageProps) {
  const hash = useLocation({ select: (location) => location.hash });
  const component = COMPONENT_BY_SLUG.get(slug);

  useHashScroll(hash);

  if (!component) {
    return <ComponentDetailNotFound />;
  }

  const Body = DETAIL_BODY_BY_SLUG.get(slug);

  return (
    <main className={cn("container mx-auto px-4 py-10 pb-32", className)} {...props}>
      <div className="lg:grid lg:grid-cols-[200px_minmax(0,1fr)] lg:gap-10 xl:grid-cols-[220px_minmax(0,1fr)]">
        <SidebarNav groups={ALPHABET_GROUPS} activeSlug={slug} />

        <div className="min-w-0">
          <DetailHeroSection component={component} />

          {Body ? (
            <Suspense fallback={<DetailSkeleton />}>
              <Body />
            </Suspense>
          ) : null}
        </div>
      </div>

      <DetailCtaSection />
    </main>
  );
}
