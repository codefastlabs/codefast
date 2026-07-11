import { cn } from "@codefast/ui/lib/utils";
import { Link } from "@tanstack/react-router";
import { ArrowRightIcon } from "lucide-react";
import { Suspense } from "react";

import { LazyVisible } from "#/components/shared/lazy-visible";
import { PreviewSkeleton } from "#/components/shared/preview-skeleton";
import { COMPONENT_BY_SLUG } from "#/registry/_core/components";
import { DEMO_BY_SLUG } from "#/registry/_core/demos";

interface DemoTileProps {
  /** Registry slug of the component to preview. */
  readonly slug: string;
  /** Span the tile across two grid columns. */
  readonly wide?: boolean | undefined;
}

/** Playground tile: a live registry demo plus a link to the component's page. */
export function DemoTile({ slug, wide }: DemoTileProps) {
  const component = COMPONENT_BY_SLUG.get(slug);
  const demo = DEMO_BY_SLUG.get(slug);

  if (!component || !demo) {
    return null;
  }

  const { Demo } = demo;

  return (
    <div
      className={cn(
        "group reveal-up flex flex-col overflow-hidden rounded-2xl border border-ui-border/60 bg-ui-card transition-[box-shadow,border-color,translate] duration-300 hover:-translate-y-1 hover:border-ui-brand/30 hover:shadow-xl hover:shadow-black/5 dark:hover:shadow-black/25",
        wide && "sm:col-span-2",
      )}
    >
      <div className="flex min-h-64 flex-1 items-center justify-center overflow-hidden bg-ui-surface p-6">
        <LazyVisible minHeight={160}>
          <Suspense fallback={<PreviewSkeleton minHeight={160} className="w-full" />}>
            <Demo />
          </Suspense>
        </LazyVisible>
      </div>

      <Link
        to="/components/$slug"
        params={{ slug }}
        className="flex items-center justify-between border-t border-ui-border/60 px-5 py-3.5 text-sm font-medium text-ui-fg no-underline transition-colors hover:bg-ui-surface"
      >
        {component.name}
        <ArrowRightIcon
          aria-hidden
          className="size-4 text-ui-muted transition-transform duration-200 group-hover:translate-x-0.5"
        />
      </Link>
    </div>
  );
}
