import { cn } from "@codefast/ui/lib/utils";
import type { ReactNode } from "react";

import { PreviewTabs } from "#/components/shared/preview-tabs";
import { ComponentCardMeta } from "#/components/showcase/component-card-meta";
import { ImportPathLabel } from "#/components/showcase/import-path-label";
import { LazyCodeBlock } from "#/components/showcase/lazy-code-block";
import type { HighlightedSource } from "#/lib/highlight";

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
  return (
    <div
      id={id}
      className={cn(
        "flex h-full scroll-mt-gallery flex-col rounded-2xl border border-ui-border/60 bg-ui-card transition-[box-shadow,border-color] duration-200 target:animate-gallery-highlight hover:border-ui-brand/30 hover:shadow-lg hover:shadow-black/5 dark:hover:shadow-black/20",
        wide && "sm:col-span-2",
      )}
    >
      <PreviewTabs
        variant="card"
        className="flex min-h-0 flex-1 flex-col"
        trailing={<ImportPathLabel path={path} />}
        preview={<div className="flex min-h-40 flex-1 items-center justify-center bg-ui-surface p-6">{children}</div>}
        code={<LazyCodeBlock load={loadSource} className="min-h-40" />}
      />

      <ComponentCardMeta name={name} description={description} slug={slug} />
    </div>
  );
}
