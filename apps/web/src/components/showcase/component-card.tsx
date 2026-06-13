import { Link } from "@tanstack/react-router";
import { ArrowUpRightIcon } from "lucide-react";
import { Suspense } from "react";

import { LazyVisible } from "#/components/showcase/lazy-visible";
import { PreviewCard } from "#/components/showcase/preview-card";
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
        className="flex scroll-mt-28 flex-col rounded-2xl border border-dashed border-ui-border bg-ui-card"
      >
        <div className="flex min-h-40 flex-1 items-center justify-center bg-ui-surface p-6">
          <span className="rounded-full border border-ui-border bg-ui-card px-3 py-1 text-xs font-medium text-ui-muted">
            No live preview
          </span>
        </div>
        <div className="border-t border-ui-border px-4 py-3">
          <Link
            to="/components/$slug"
            params={{ slug: component.slug }}
            className="group inline-flex items-center gap-1 text-sm font-semibold text-ui-fg no-underline"
          >
            {component.name}
            <ArrowUpRightIcon className="size-3.5 text-ui-muted transition-colors group-hover:text-ui-brand" />
          </Link>
          <p className="mt-0.5 text-xs leading-5 text-ui-muted">{component.description}</p>
        </div>
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
      {/* LazyVisible defers the mount until the card nears the viewport, which
          is also what triggers the React.lazy chunk download. */}
      <LazyVisible>
        <Suspense fallback={null}>
          <Demo />
        </Suspense>
      </LazyVisible>
    </PreviewCard>
  );
}
