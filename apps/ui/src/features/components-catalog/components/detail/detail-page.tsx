import { cn } from "@codefast/ui/lib/utils";
import { useLocation } from "@tanstack/react-router";
import type { ComponentProps } from "react";

import type { ComponentDetail } from "#/features/components-catalog/components/detail/detail-bodies";
import { DetailBody } from "#/features/components-catalog/components/detail/detail-bodies";
import { DetailCtaSection } from "#/features/components-catalog/components/detail/detail-cta-section";
import { DetailHeroSection } from "#/features/components-catalog/components/detail/detail-hero-section";
import { SidebarNav } from "#/features/components-catalog/components/gallery/sidebar-nav";
import { ALPHABET_GROUPS } from "#/features/components-catalog/data";
import { useHashScroll } from "#/features/components-catalog/hooks/use-hash-scroll";

interface DetailPageProps extends Omit<ComponentProps<"main">, "children"> {
  /** The component detail, resolved by the `$slug` route loader. */
  readonly detail: ComponentDetail;
}

export function DetailPage({ detail, className, ...props }: DetailPageProps) {
  const hash = useLocation({ select: (location) => location.hash });

  useHashScroll(hash);

  const { component } = detail;

  return (
    <main className={cn("container mx-auto px-4 py-10 pb-32", className)} {...props}>
      <div className="lg:grid lg:grid-cols-[200px_minmax(0,1fr)] lg:gap-10 xl:grid-cols-[220px_minmax(0,1fr)]">
        <SidebarNav groups={ALPHABET_GROUPS} activeSlug={component.slug} />

        <div className="min-w-0">
          <DetailHeroSection component={component} />
          <DetailBody detail={detail} />
        </div>
      </div>

      <DetailCtaSection />
    </main>
  );
}
