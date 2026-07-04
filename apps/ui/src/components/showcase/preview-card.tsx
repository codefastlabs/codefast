import { cn } from "@codefast/ui/lib/utils";
import type { ComponentProps, ReactNode } from "react";

import { ComponentCardMeta } from "#/components/showcase/component-card-meta";

interface PreviewCardProps extends ComponentProps<"div"> {
  name: string;
  description: string;
  children: ReactNode;
  wide?: boolean | undefined;
  /** When set, the card title links to /components/<slug>. */
  slug?: string;
  /** Flags a recently added component with a "New" badge. */
  isNew?: boolean | undefined;
}

/**
 * Gallery card: a live demo preview plus its metadata. The full source lives on
 * the component detail page (`/components/$slug`) — gallery cards stay a quick
 * visual scan, so they neither ship a Code tab nor load any highlighted source.
 */
export function PreviewCard({ name, description, children, wide, slug, isNew, className, ...props }: PreviewCardProps) {
  return (
    <div
      className={cn(
        "flex h-full scroll-mt-gallery flex-col rounded-2xl border border-ui-border/60 bg-ui-card transition-[box-shadow,border-color] duration-200 target:animate-gallery-highlight hover:border-ui-brand/30 hover:shadow-lg hover:shadow-black/5 dark:hover:shadow-black/20",
        wide && "sm:col-span-2",
        className,
      )}
      {...props}
    >
      <div className="flex min-h-40 flex-1 items-center justify-center rounded-t-2xl bg-ui-surface p-6">{children}</div>

      <ComponentCardMeta
        name={name}
        description={description}
        slug={slug}
        isNew={isNew}
        className="rounded-b-2xl border-t border-ui-border/60"
      />
    </div>
  );
}
