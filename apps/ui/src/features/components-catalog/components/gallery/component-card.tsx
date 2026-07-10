import { Suspense } from "react";

import { ComponentCardMeta } from "#/features/components-catalog/components/gallery/component-card-meta";
import { LazyVisible } from "#/features/components-catalog/components/gallery/lazy-visible";
import { PreviewCard } from "#/features/components-catalog/components/gallery/preview-card";
import { PreviewSkeleton } from "#/features/components-catalog/components/gallery/preview-skeleton.tsx";
import type { ComponentMeta } from "#/registry/_core/components";
import { DEMO_BY_SLUG } from "#/registry/_core/demos";

// Branches between a bare `<div>` and `<PreviewCard>` and forwards no native
// attributes, so the props are a plain named interface, not an extension of
// `ComponentProps`.
interface ComponentCardProps {
  readonly component: ComponentMeta;
}

/** A live-demo preview card, or a docs-only card for components without a demo. */
export function ComponentCard({ component }: ComponentCardProps) {
  const demo = DEMO_BY_SLUG.get(component.slug);

  if (!demo) {
    return (
      <div
        id={component.slug}
        className="flex h-full scroll-mt-gallery flex-col rounded-2xl border border-dashed border-ui-border/40 bg-ui-card transition-[box-shadow,border-color] duration-200 target:animate-gallery-highlight hover:border-ui-brand/30 hover:shadow-lg hover:shadow-black/5 dark:hover:shadow-black/20"
      >
        <div className="flex min-h-40 flex-1 items-center justify-center rounded-t-2xl bg-ui-surface p-6">
          <span className="rounded-full border border-ui-border/60 bg-ui-card px-3 py-1 text-xs font-medium text-ui-muted">
            No live preview
          </span>
        </div>

        <ComponentCardMeta
          name={component.name}
          description={component.description}
          slug={component.slug}
          isNew={component.isNew}
          className="rounded-b-2xl border-t border-ui-border/60"
        />
      </div>
    );
  }

  const { Demo } = demo;

  return (
    <PreviewCard
      id={component.slug}
      slug={component.slug}
      name={component.name}
      description={component.description}
      wide={component.wide}
      isNew={component.isNew}
    >
      <LazyVisible>
        <Suspense fallback={<PreviewSkeleton className="w-full" />}>
          <Demo />
        </Suspense>
      </LazyVisible>
    </PreviewCard>
  );
}
