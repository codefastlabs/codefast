import { Suspense } from "react";

import { ComponentCardMeta, PREVIEW_PANE_CLASS } from "#/components/showcase/component-card-meta";
import { LazyVisible } from "#/components/showcase/lazy-visible";
import { PreviewCard } from "#/components/showcase/preview-card";
import { PreviewSkeleton } from "#/components/showcase/preview-skeleton";
import type { ComponentMeta } from "#/registry/components";
import { componentImportLabel } from "#/registry/components";
import { DEMO_BY_SLUG } from "#/registry/demos";

/** A live-demo preview card, or a docs-only card for components without a demo. */
export function ComponentCard({ component }: { component: ComponentMeta }) {
  const demo = DEMO_BY_SLUG.get(component.slug);

  if (!demo) {
    return (
      <div
        id={component.slug}
        className="flex h-full scroll-mt-gallery flex-col rounded-2xl border border-dashed border-ui-border/40 bg-ui-card transition-[box-shadow,border-color] duration-200 target:animate-gallery-highlight hover:border-ui-brand/30 hover:shadow-lg hover:shadow-black/5 dark:hover:shadow-black/20"
      >
        <div className={PREVIEW_PANE_CLASS}>
          <span className="rounded-full border border-ui-border/60 bg-ui-card px-3 py-1 text-xs font-medium text-ui-muted">
            No live preview
          </span>
        </div>
        <ComponentCardMeta name={component.name} description={component.description} slug={component.slug} />
      </div>
    );
  }

  const { Demo } = demo;

  return (
    <PreviewCard
      id={component.slug}
      slug={component.slug}
      name={component.name}
      path={componentImportLabel(component)}
      description={component.description}
      wide={component.wide ?? false}
      loadSource={demo.loadSource}
    >
      <LazyVisible>
        <Suspense fallback={<PreviewSkeleton />}>
          <Demo />
        </Suspense>
      </LazyVisible>
    </PreviewCard>
  );
}
