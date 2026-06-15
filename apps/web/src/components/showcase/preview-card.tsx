import { cn } from "@codefast/ui/lib/utils";
import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";

import { PreviewTabs } from "#/components/shared/preview-tabs";
import { ComponentCardMeta, PREVIEW_PANE_CLASS } from "#/components/showcase/component-card-meta";
import { ImportPathCopy } from "#/components/showcase/import-path-copy";
import { LazyCodeBlock } from "#/components/showcase/lazy-code-block";
import { usePreloadDetail } from "#/hooks/use-preload-detail";
import type { HighlightedSource } from "#/lib/highlight";
import { SCROLL_MT_GALLERY } from "#/lib/layout";

interface PreviewCardProps {
  name: string;
  path: string;
  description: string;
  /** Loads the demo's source chunk — fetched only when the Code tab opens. */
  loadSource: () => Promise<HighlightedSource>;
  children: ReactNode;
  wide?: boolean;
  id?: string;
  /** When set, the card title links to /components/<slug>. */
  slug?: string;
}

export function PreviewCard({ name, path, description, loadSource, children, wide, id, slug }: PreviewCardProps) {
  const preload = usePreloadDetail(slug);

  const previewContent = slug ? (
    <Link
      to="/components/$slug"
      params={{ slug }}
      className={cn(PREVIEW_PANE_CLASS, "cursor-pointer no-underline")}
      {...preload}
    >
      {children}
    </Link>
  ) : (
    <div className={PREVIEW_PANE_CLASS}>{children}</div>
  );

  return (
    <div
      id={id}
      className={cn(
        "flex h-full flex-col rounded-2xl border border-ui-border/60 bg-ui-card transition-[box-shadow,border-color] duration-200 hover:border-ui-brand/30 hover:shadow-lg hover:shadow-black/5 dark:hover:shadow-black/20",
        SCROLL_MT_GALLERY,
        wide && "sm:col-span-2",
      )}
    >
      <PreviewTabs
        variant="card"
        className="flex min-h-0 flex-1 flex-col"
        trailing={<ImportPathCopy path={path} />}
        preview={previewContent}
        code={<LazyCodeBlock load={loadSource} className="min-h-40" />}
      />

      <ComponentCardMeta name={name} description={description} slug={slug} />
    </div>
  );
}
